---
id: amazon-shopping-cart
title: "Design an Always-Writable Shopping Cart (Amazon)"
sidebar_label: "43. Shopping Cart (Amazon)"
description: "Staff-level breakdown of an always-writable distributed shopping cart using Dynamo-style key-value replication, CRDTs/vector clocks, and guest-to-auth session reconciliation."
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design an Always-Writable Shopping Cart (Amazon)

The Amazon shopping cart is the foundational real-world use case that inspired Werner Vogels and the Amazon engineering team to develop the **Dynamo storage architecture** in 2007. In e-commerce, **rejecting a customer's request to add an item to their cart translates directly into lost revenue**. Consequently, the shopping cart is engineered as an **"Always-Writable" distributed system**, prioritizing extreme write availability and partition tolerance (AP in the CAP theorem) over strict immediate consistency.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Cart Modifications**: Add, update quantity, and remove items from a cart.
2. **Guest vs Authenticated User Persistence**: Support anonymous guest shopping carts (via session cookies) and seamlessly merge guest carts into authenticated user accounts upon login.
3. **Cart Viewing**: Retrieve current cart contents with item details, prices, and discounts in $< 10\text{ms}$.
4. **Cross-Device Sync**: A user adding an item on their mobile phone must see it appear on their laptop cart.
5. **Checkout Handoff**: Transition cart contents into the Order and Inventory Reservation service during checkout.

### Non-Functional Requirements
- **Always-Writable (100% Write Availability)**: An `Add to Cart` request must **never fail**, even during cross-region network partitions, node crashes, or database degraded modes.
- **Ultra-Low Latency**: P99 write latency $< 10\text{ms}$; P99 read latency $< 5\text{ms}$.
- **Eventual Consistency**: Replicas converge deterministically. If concurrent divergent writes occur, the system must never drop an item the customer intended to purchase.
- **Scale**: Support **300+ Million active user carts** handling **50,000+ peak write QPS**.

### Capacity Estimations & Sizing (5 Years)
- **Active Carts**: 300 Million active shopping carts.
- **Cart Size**: Average cart contains 5 items.
- **Average Record Size**: `user_id` (16 bytes) + 5 items $\times$ (item_id: 16B, qty: 4B, price_snapshot: 8B, timestamp: 8B) $\approx$ **250 bytes**.
- **Storage Sizing**:
  $$300\text{M carts} \times 250\text{ bytes} \approx \mathbf{75\text{ Gigabytes}}$$
  With $3\text{x}$ replication across regions: $\approx \mathbf{225\text{ Gigabytes}}$.
  *Insight*: The entire global shopping cart dataset easily fits into the memory of a distributed Redis / DynamoDB cluster!
- **Throughput Sizing**:
  - Daily Cart Operations: 500 Million actions/day.
  - Average QPS: $\sim 6,000\text{ QPS}$.
  - Peak Flash-Sale / Prime Day QPS: **50,000+ QPS**.

---

## 2. The Set Up

### Defining Core Entities

```
┌────────────────────────────────────────────────────────┐
│                     SHOPPING_CART                      │
├──────────────────┬──────────────┬──────────────────────┤
│ cart_id          │ VARCHAR(64)  │ PK (user_id / anon)  │
│ owner_type       │ ENUM         │ AUTHENTICATED, GUEST │
│ items_json       │ JSONB        │ Map of Item Elements │
│ vector_clock     │ VARCHAR(128) │ Version Causality    │
│ updated_at       │ TIMESTAMP    │ Last Modified Time   │
│ ttl_seconds      │ INT          │ Expire after 30 days │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                       CART_ITEM                        │
├──────────────────┬──────────────┬──────────────────────┤
│ sku_id           │ VARCHAR(32)  │ Product Identifier   │
│ quantity         │ INT          │ Item Count           │
│ price_cents      │ INT          │ Price at Add Time    │
│ added_timestamp  │ BIGINT       │ Unix Microsecond     │
│ is_deleted       │ BOOLEAN      │ Tombstone Flag       │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API Design

#### 1. Add / Update Item in Cart
```http
POST /api/v1/cart/items
Content-Type: application/json
Authorization: Bearer <user_jwt_or_guest_cookie>
X-Vector-Clock: "nodeA:4;nodeB:2"

{
  "sku_id": "SKU-9481-B",
  "quantity_delta": 1,
  "unit_price_cents": 2999
}
```
**Response (`200 OK`)**:
```json
{
  "cart_id": "user_94812",
  "total_items": 4,
  "new_vector_clock": "nodeA:5;nodeB:2",
  "items": [
    {"sku_id": "SKU-9481-B", "quantity": 2, "unit_price_cents": 2999}
  ]
}
```

#### 2. Merge Guest Cart into User Account (Upon Login)
```http
POST /api/v1/cart/merge
Content-Type: application/json
Authorization: Bearer <user_authenticated_token>

{
  "guest_session_token": "guest_sess_7a81094b"
}
```
**Response (`200 OK`)**:
```json
{
  "cart_id": "user_94812",
  "merged_items_count": 5,
  "status": "CONVERGED"
}
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="key-value-store" title="Amazon Always-Writable Distributed Shopping Cart Architecture" />

### Walkthrough of Core Flows

#### 1. The Always-Writable Write Path
1. The user clicks *"Add to Cart"*.
2. The request hits the **Cart Microservice** behind the API Gateway.
3. The service writes to an **AP-mode Distributed Key-Value Store (DynamoDB / Cassandra)**:
   - Configured with write quorum $W = 1$ (or sloppy quorum with hinted handoff).
   - The coordinator node writes to the first reachable healthy replica.
   - Even if 2 out of 3 replicas are partitioned or down, **the write succeeds immediately in $< 5\text{ms}$**!
4. The response includes an updated **Vector Clock** header back to the client.

#### 2. The Read Path & Conflict Reconciliation (Read Repair)
1. User navigates to `/cart`.
2. The service queries $R = 2$ replicas on the consistent hash ring.
3. If both replicas return the exact same vector clock, the cart is returned immediately.
4. **Divergence Detected (Siblings)**:
   - If two replicas return diverging vector clocks (caused by concurrent writes during a network split), the Cart Service executes **Domain-Specific Conflict Resolution**:
   - **The "Add-Wins" Business Rule**: The cart merges the items using a set union. If Replica 1 has 2 books and Replica 2 has 1 pair of shoes, the merged cart contains both 2 books and 1 pair of shoes!
   - The resolved cart is returned to the user and asynchronously written back to the replicas (Read Repair).

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Why Amazon Chose Availability Over Consistency (The Dynamo Philosophy)
What happens if the shopping cart uses a traditional CP relational database (like PostgreSQL with synchronous 2-phase commit)?
- During a network partition between US-East and US-West datacenters, a CP system blocks writes to preserve consistency:
  $$\text{User Clicks "Add to Cart"} \implies \text{HTTP 500 / Timeout Error}$$
- **The Financial Impact**: Customers who receive error screens frequently abandon their shopping sessions entirely.
- **The AP Trade-Off**: Vogels famously established that it is far better to occasionally resurrect a deleted item in a shopping cart (which the user can easily remove before paying) than to prevent the user from adding an item in the first place!

### Deep Dive 2: Guest Cart to Authenticated User Cart Merging
What happens when an anonymous user browses for 30 minutes, adds 3 items to a guest cart, and then logs in?

```
┌────────────────────────────────────────────────────────┐
│            GUEST-TO-AUTH CART MERGE PIPELINE           │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Guest Cart (Cookie ID: guest_8410):                   │
│  • Item A (Qty: 1)                                     │
│  • Item B (Qty: 2)                                     │
│                                                        │
│  Existing User Cart (User ID: user_9912):              │
│  • Item B (Qty: 1)                                     │
│  • Item C (Qty: 1)                                     │
│                                                        │
│                    AUTHENTICATION EVENT                │
│                             │                          │
│                             ▼                          │
│  Merged Result Cart (User ID: user_9912):              │
│  • Item A: Qty = 1                                     │
│  • Item B: Qty = MAX(2, 1) = 2 (or 2+1=3 based on rule)│
│  • Item C: Qty = 1                                     │
│                                                        │
│  Action: Delete guest_8410 record asynchronously.      │
│                                                        │
└────────────────────────────────────────────────────────┘
```
- **Business Rule Decision**: For duplicate items across guest and user carts:
  - Default: Take $\max(Q_{\text{guest}}, Q_{\text{user}})$ (e.g. user was likely adding the same item they saw earlier).
  - Alternative: Sum quantities ($Q_{\text{guest}} + Q_{\text{user}}$) with a safety cap against warehouse inventory limits.

### Deep Dive 3: Conflict-Free Replicated Data Types (CRDTs: PN-Counter)
How can we mathematically guarantee convergence without complex manual sibling merging?
- Use a **PN-Counter (Positive-Negative Counter)** CRDT for each item:
  - $P$: monotonically increasing counter for additions.
  - $N$: monotonically increasing counter for subtractions/deletions.
  - Current Quantity: $\text{Value} = P - N$.
- **Merge Operation ($\sqcup$)**:
  $$P_{\text{merged}} = \max(P_1, P_2), \quad N_{\text{merged}} = \max(N_1, N_2)$$
- Because $\max()$ is **commutative, associative, and idempotent**, any replica can merge divergent state in any order and arrive at the exact same deterministic quantity!

### Deep Dive 4: Price Snapshotting vs Live Inventory Validation at Checkout
Does adding an item to the shopping cart reserve warehouse stock?
- **No!** Holding warehouse inventory for every cart addition is an anti-pattern. Millions of users abandon carts; reserving inventory would lock up items that active buyers want to purchase.
- **The Two-Stage Checkout Transition**:
  1. **Shopping Cart Phase**: Cart holds loose item references with a timestamped price snapshot. Stock is **not reserved**.
  2. **Checkout Phase**: When the user clicks *"Proceed to Checkout"*:
     - The system locks the cart.
     - Calls the **Pricing Service** to verify current prices (informing the user if a price changed).
     - Calls the **Inventory Service** to execute an atomic reservation with a 10-minute hold TTL (via Redis Lua / `SKIP LOCKED`).

---

## 5. Architectural Trade-Off Matrix

| Design Alternative | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **CAP Classification** | CP (Strict ACID PostgreSQL) | AP (Dynamo-style Eventual Consistency) | **AP (Eventual Consistency)**: Guarantees 100% write availability; "Add to Cart" never drops a paying customer. |
| **Conflict Resolution** | Last-Write-Wins (LWW by Clock) | Vector Clocks with Add-Wins Union | **Add-Wins Union**: Clock drift in LWW can silently erase items a user added; Add-Wins guarantees no purchased item is lost. |
| **Inventory Reservation** | Reserve stock upon Cart Addition | Reserve stock only upon Checkout | **Reserve at Checkout**: Prevents abandoned carts from tying up physical warehouse inventory. |
| **Guest Cart Merging** | Synchronous Block on Login | Asynchronous Background Worker | **Synchronous on Login**: Ensures the very next screen the user sees contains their full combined cart. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Identifies the need to store carts for both anonymous guests (via cookies) and logged-in users.
- Designs basic schemas for cart headers and cart item rows.
- Explains why inventory is not reserved until checkout.

### Senior (L5 / IC5)
- Explains the Dynamo philosophy: why e-commerce carts must be "always writable" ($W=1$, AP mode).
- Details guest-to-user cart merging logic and duplicate resolution rules.
- Explains vector clocks and sibling reconciliation (Add-Wins policy).
- Separates cart persistence from the live checkout pricing and reservation pipeline.

### Staff+ (L6 / Principal)
- Mathematically evaluates CRDT convergence models (PN-Counters and OR-Sets - Observed-Remove Sets) for lock-free cart replication.
- Formulates multi-region active-active deployment topologies with Anycast DNS routing to topologically closest datacenters.
- Formulates strategies for preventing cart bloating attacks (malicious bots adding 10,000 items to exhaust memory).
- Designs automated TTL archival policies for abandoned carts to keep primary memory caches lean.
