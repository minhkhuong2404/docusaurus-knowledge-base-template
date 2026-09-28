---
id: online-auction
title: Design a Real-Time Online Auction Platform Like eBay
sidebar_label: 21. Online Auction (eBay)
description: Staff-level system design breakdown for a real-time online auction platform handling bid sniping, proxy bidding, and countdown extensions.
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design a Real-Time Online Auction Platform Like eBay

An online auction platform (e.g., eBay, Sotheby's, Yahoo Auctions) enables sellers to list items for auction and buyers to place competing bids in real-time until a closing deadline. The platform requires high-concurrency bid processing, proxy bidding automation, real-time price broadcasting over WebSockets, and soft-closing countdown extensions to prevent **bid sniping** (submitting bids at the final millisecond to block competition).

---

## 1. Understanding the Problem

### Functional Requirements
1. **List Auction Item**: Sellers list items with starting price, reserve price, bid increment, and auction end time.
2. **Place Real-Time Bid**: Bidders submit bids; each bid must be strictly greater than `current_highest_bid + bid_increment`.
3. **Proxy Bidding (Automatic Bidding)**: Bidders set a maximum budget; the system automatically outbids competitors by the minimum increment up to that budget.
4. **Real-Time Price Broadcast**: Active bidders and watchers receive instant price updates via WebSockets.
5. **Countdown Timer & Anti-Sniping (Soft Close)**: If a bid is submitted in the final 2 minutes, the auction deadline is automatically extended by 2 minutes.
6. **Auction Settlement**: When the clock expires, declare the winner, lock the auction, and trigger payment processing.

### Non-Functional Requirements
- **Strict Linearizability (Zero Race Conditions)**: Bids must be processed strictly in serial order. Two concurrent equal bids must result in exactly one winner.
- **Ultra-Low Latency**: Bid acknowledgment and price broadcast to watchers in `< 100ms`.
- **High Availability for Bidding**: A system downtime during the final 60 seconds of a million-dollar art auction causes severe legal and financial liability.
- **Clock Synchronization**: Strict monotonic time enforcement to prevent client clock tampering.

### Capacity Estimations & Sizing
- **Active Concurrent Auctions**: 1 Million live auctions globally.
- **Total Registered Bidders**: 50 Million users.
- **Bid Submission QPS**:
  - Most auctions receive few bids, but the final 60 seconds of popular auctions experience intense contention:
  - 10,000 auctions closing concurrently $\times$ 5 bids/sec $\implies$ **50,000 bids/sec peak**.
- **WebSocket Broadcast Fan-Out**:
  - Average 50 active watchers per closing auction:
    $\text{Broadcast QPS} = 50,000 \text{ bids/sec} \times 50 \text{ watchers} = \mathbf{2.5\text{ Million WebSocket frames/sec}}$.
- **Storage Calculation (5 Years)**:
  - 500 Million historical auctions $\times$ 1 KB metadata $\approx$ **500 GB**.
  - 5 Billion total bids $\times$ 128 bytes $\approx$ **640 GB** (relational database tables partitioned by year/month).

---

## 2. The Set Up

### Defining the Core Entities

```
┌────────────────────────────────────────────────────────┐
│                        AUCTION                         │
├──────────────────┬──────────────┬──────────────────────┤
│ auction_id       │ UUID         │ PRIMARY KEY          │
│ seller_id        │ UUID         │ INDEX, FK            │
│ title            │ VARCHAR(255) │ NOT NULL             │
│ current_price    │ BIGINT       │ In cents             │
│ current_winner_id│ UUID         │ NULLABLE, FK         │
│ min_increment    │ INT          │ In cents             │
│ reserve_price    │ BIGINT       │ Minimum seller price │
│ status           │ VARCHAR(16)  │ ACTIVE / ENDED / ... │
│ ends_at          │ TIMESTAMP    │ Countdown deadline   │
│ version          │ BIGINT       │ Optimistic lock      │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                          BID                           │
├──────────────────┬──────────────┬──────────────────────┤
│ bid_id           │ UUID         │ PRIMARY KEY          │
│ auction_id       │ UUID         │ COMPOSITE INDEX, FK  │
│ bidder_id        │ UUID         │ INDEX, FK            │
│ bid_amount_cents │ BIGINT       │ NOT NULL             │
│ created_at       │ TIMESTAMP    │ Microsecond precision│
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                       PROXY_BID                        │
├──────────────────┬──────────────┬──────────────────────┤
│ proxy_bid_id     │ UUID         │ PRIMARY KEY          │
│ auction_id       │ UUID         │ COMPOSITE INDEX, FK  │
│ bidder_id        │ UUID         │ INDEX, FK            │
│ max_budget_cents │ BIGINT       │ Confidential maximum │
│ created_at       │ TIMESTAMP    │ NOT NULL             │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API Design

#### 1. Submit Real-Time Bid
```http
POST /api/v1/auctions/{auction_id}/bids
Content-Type: application/json
Authorization: Bearer <jwt_token>
Idempotency-Key: bid_99a812-4019

{
  "bid_amount_cents": 150000 // $1,500.00
}
```
**Response (`200 OK`)**:
```json
{
  "status": "ACCEPTED",
  "auction_id": "auc_771204",
  "current_price_cents": 150000,
  "highest_bidder_id": "usr_current_user",
  "new_ends_at": "2026-09-22T23:02:00Z" // Extended if soft-closed!
}
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="online-auction" title="Real-Time Online Auction Bidding & Anti-Sniping Topology" />

### Walkthrough of Core Bidding Flows

#### 1. Bid Submission & Atomic Concurrency Check
1. Bidder clicks "Place Bid" $\implies$ `POST /api/v1/auctions/{id}/bids`.
2. The request hits the **Bidding Engine**:
   - Executes an atomic **Redis Lua script** keyed by `auction:{auction_id}`:
     - Checks `now() < ends_at`.
     - Checks `bid_amount >= current_price + min_increment`.
     - Updates `current_price = bid_amount`, `current_winner = bidder_id`.
     - **Soft-Close Check**: If `ends_at - now() < 120 seconds`, extends deadline: `ends_at = ends_at + 120 seconds`.
3. If the Lua script returns success, the new state is committed and an `AuctionPriceUpdatedEvent` is published to **Redis Pub/Sub** and **Apache Kafka**.

#### 2. Real-Time WebSocket Fan-Out
1. Hundreds of regional **WebSocket Edge Servers** maintain open connections with watchers viewing the auction.
2. The WebSocket servers receive the update from Redis Pub/Sub.
3. Pushes the new price, winning bidder masked ID, and updated countdown timer to all connected clients in `< 50ms`.

#### 3. Auction Settlement
1. An external **Hierarchical Timing Wheel / Job Scheduler** monitors the `ends_at` timestamp.
2. When the clock expires, the scheduler transitions auction status to `ENDED` in the primary PostgreSQL database.
3. Automatically charges the winning bidder's credit card and creates the order ledger.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Bid Sniping & The Anti-Sniping Soft-Close Engine
What is bid sniping, and why does it destroy user trust and seller revenue?

- **The Exploit (Bid Sniping)**:
  - Malicious bidders use bots to submit bids at $T - 100\text{ms}$ before closing.
  - Other human bidders do not have enough time to see the new price and react.
  - Sells items below true market value and frustrates honest bidders.
- **The Soft-Close Solution (Overtime Rule)**:
  - If a bid arrives within the **final 2 minutes** of an auction, the deadline is automatically extended by another 2 minutes.
  - The auction continues extending until a full 2 minutes passes with zero new bids.
  - **Result**: Replicates live physical auction behavior (*"Going once, going twice, sold!"*), maximizing seller revenue.

### Deep Dive 2: Automated Proxy Bidding (The eBay Algorithm)
How does proxy bidding automatically increment bids without exposing users' private budgets?

```
User A sets Max Budget = $100.
Current Price = $20 (User A is winning at $20).

User B enters and places a bid of $50:
- The system evaluates User A's proxy budget ($100) against User B's bid ($50).
- User A's proxy automatically outbids User B by minimum increment ($5):
  ➔ New Current Price = $55.
  ➔ User A is STILL winning at $55!

User C enters and places a bid of $120:
- Exceeds User A's maximum budget!
- User A is knocked out.
- User C becomes the new leader at $105 ($100 + $5 increment).
```
- **Atomicity Requirement**: The proxy bidding calculation must run inside an atomic transaction or single-threaded Redis Lua execution to ensure multi-user budget comparisons do not experience race conditions.

### Deep Dive 3: Monotonic Time Enforcement & Clock Drift
What happens if Application Server 1's clock is 3 seconds slower than Application Server 2's clock due to NTP drift?
- A bidder on Server 1 might place a bid at 10:00:01 AM, but Server 1 timestamps it as 09:59:58 AM, accepting a bid after the auction actually ended!
- **TrueTime / Central Monotonic Clock**:
  - Do **NOT** use local machine wall-clock time (`System.currentTimeMillis()`).
  - Use **Redis Server Time** (`TIME` command executed within the Lua script) as the authoritative single source of truth for the auction.
  - This guarantees that all bids and deadline extensions are evaluated against a single, monotonically increasing global clock.

---

## 5. Architectural Trade-Off Matrix

| Design Area | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Bidding Engine** | Relational DB Row Lock (`FOR UPDATE`) | In-Memory Redis Lua Engine | **Redis Lua**: Relational row locks under 5,000 bids/sec in the final 10 seconds freeze connection pools. Redis executes atomic comparisons in sub-millisecond RAM. |
| **Auction Closing** | Hard Fixed Clock Deadline | Dynamic Soft-Close (Overtime Extension) | **Soft-Close**: Prevents bot sniping, ensures fair human competition, and generates 15–20% higher final auction prices for sellers. |
| **Price Updates** | Client Polling every 1s | Persistent WebSocket Connections | **WebSockets**: Cuts server HTTP overhead by 95% and provides sub-50ms visual price flashes during high-intensity bidding wars. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Understands the race conditions inherent in concurrent bidding.
- Designs relational schemas for Auctions, Bids, and Users.
- Uses WebSockets to broadcast price updates to clients.
- Implements basic auction expiration checks.

### Senior (L5 / IC5)
- Solves final-second bid contention using atomic Redis Lua scripts.
- Implements the soft-close anti-sniping countdown extension algorithm.
- Details the automated proxy bidding state machine and minimum increment logic.
- Guarantees monotonic time enforcement using Redis server time to eliminate NTP clock drift hazards.

### Staff+ (L6 / Principal)
- Designs active-active multi-region bidding synchronization: Explains why single-leader partitioning per auction is mandatory (distributed consensus across continents cannot beat the speed of light in 100ms auctions).
- Architects automated settlement and post-auction reconciliation: Handling payment authorization holds, credit card failures, and automatic second-chance offers to runner-up bidders.
- Details anti-collusion and shill-bidding fraud detection: Graph algorithms detecting sellers using dummy accounts to artificially inflate their own item prices.
