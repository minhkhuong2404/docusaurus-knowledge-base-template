---
id: robinhood
title: Design a Stock Trading Platform Like Robinhood
sidebar_label: 26. Robinhood (Stock Trading)
description: Staff-level system design breakdown for a low-latency stock trading platform with double-entry ledgers, LMAX Disruptor order matching, and FIX protocol routing.
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design a Stock Trading Platform Like Robinhood

A modern retail stock brokerage and trading platform (e.g., Robinhood, Charles Schwab, Interactive Brokers) allows millions of users to trade equities, options, and ETFs in real-time, view live market ticker data, and manage account balances. The system requires ultra-low latency order matching, financial **double-entry ledger accounting**, strict risk/margin verification, and compliant execution routing via the Financial Information eXchange (FIX) protocol.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Place & Cancel Orders**: Users can place Market Orders (execute immediately at best price) and Limit Orders (execute only at specified price or better) during market hours.
2. **Order Execution & Routing**: Route retail orders to external Market Makers (Citadel Securities, Virtu) or internal matching engines via the FIX protocol.
3. **Real-Time Market Data Streaming**: Stream real-time stock price quotes, bids, asks, and candlestick charts to millions of mobile clients.
4. **Risk & Purchasing Power Checks**: Real-time validation of account cash balance and margin limits before accepting an order.
5. **Double-Entry Financial Ledger**: Maintain strict, immutable accounting for cash, stock positions, deposits, and withdrawals.

### Non-Functional Requirements
- **Ultra-Low Latency**: Order validation and dispatch in `< 20ms`; market data quote distribution in `< 50ms`.
- **Strict Financial Correctness**: Zero phantom balances, zero double execution, exact penny-accurate double-entry accounting.
- **High Availability**: `99.999%` uptime during market hours (9:30 AM – 4:00 PM EST). An outage during market volatility results in catastrophic regulatory fines (SEC/FINRA) and customer lawsuits.
- **Regulatory Compliance & Auditability**: Complete, immutable order audit trail (OATS/CAT compliance) with microsecond timestamps.

### Capacity Estimations & Sizing
- **Total Registered Accounts**: 25 Million accounts.
- **Daily Orders**: 10 Million orders executed per trading day.
- **Peak Order Throughput**:
  - High-volatility market open (9:30 AM EST) creates intense surges:
  - Peak = **10,000 orders placed/sec**.
- **Market Data Quote Ingress**:
  - US Stock Exchanges broadcast ~500,000 quote updates/sec across 10,000 ticker symbols.
- **Financial Ledger Sizing (5 Years)**:
  - 10M orders/day $\times$ 250 trading days/year $\times$ 5 years = **12.5 Billion transactions**.
  - Each double-entry ledger entry: 2 postings (Debit & Credit) $\times$ 128 bytes $\approx$ **3.2 TB storage** (stored in high-durability partitioned PostgreSQL or CockroachDB).

---

## 2. The Set Up

### Defining the Core Entities

```
┌────────────────────────────────────────────────────────┐
│                        ACCOUNT                         │
├──────────────────┬──────────────┬──────────────────────┤
│ account_id       │ UUID         │ PRIMARY KEY          │
│ user_id          │ UUID         │ INDEX, FK            │
│ cash_balance     │ BIGINT       │ In cents (USD)       │
│ buying_power     │ BIGINT       │ Cash + Margin        │
│ is_day_trader    │ BOOLEAN      │ PDT Rule flag        │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                      STOCK_ORDER                       │
├──────────────────┬──────────────┬──────────────────────┤
│ order_id         │ UUID         │ PRIMARY KEY          │
│ account_id       │ UUID         │ INDEX, FK            │
│ symbol           │ VARCHAR(10)  │ e.g. "AAPL", "NVDA"  │
│ side             │ VARCHAR(4)   │ BUY / SELL           │
│ order_type       │ VARCHAR(16)  │ MARKET / LIMIT       │
│ quantity         │ INT          │ Number of shares     │
│ limit_price_cents│ INT          │ Specified price      │
│ status           │ VARCHAR(16)  │ PENDING / FILLED / ..│
│ idempotency_key  │ VARCHAR(64)  │ UNIQUE               │
│ created_at       │ TIMESTAMP    │ Microsecond precision│
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                     LEDGER_POSTING                     │
├──────────────────┬──────────────┬──────────────────────┤
│ posting_id       │ UUID         │ PRIMARY KEY          │
│ transaction_id   │ UUID         │ INDEX, Grouping ID   │
│ account_id       │ UUID         │ INDEX, FK            │
│ entry_type       │ VARCHAR(6)   │ DEBIT / CREDIT       │
│ amount_cents     │ BIGINT       │ Financial Amount     │
│ asset_type       │ VARCHAR(16)  │ USD / SHARES         │
│ created_at       │ TIMESTAMP    │ Immutable audit time │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API Design

#### Place Stock Order Request
```http
POST /api/v1/orders
Content-Type: application/json
Authorization: Bearer <jwt_token>
Idempotency-Key: ord_77120-99120

{
  "account_id": "acc_88192a01",
  "symbol": "NVDA",
  "side": "BUY",
  "order_type": "LIMIT",
  "quantity": 10,
  "limit_price_cents": 12500 // $125.00
}
```
**Response (`201 Created`)**:
```json
{
  "order_id": "ord_990184",
  "status": "ACCEPTED",
  "symbol": "NVDA",
  "shares": 10,
  "limit_price": 125.00,
  "estimated_cost": 1250.00
}
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="distributed-ledger" title="Robinhood Low-Latency Order Execution & Ledger Architecture" />

### Walkthrough of the Order Execution Path

#### 1. Ingestion & Pre-Trade Risk Verification
1. User clicks "Swipe Up to Buy" $\implies$ `POST /api/v1/orders`.
2. The **Order Gateway** checks idempotency in Redis.
3. The **Pre-Trade Risk Engine**:
   - Evaluates user's available purchasing power in memory (`cash_balance >= quantity * price`).
   - Verifies SEC Pattern Day Trader (PDT) limits (max 3 day trades per 5-day window for balances under \$25,000).
   - Atomically holds cash in memory: `buying_power = buying_power - estimated_cost`.

#### 2. Order Matching / Routing (FIX Protocol)
1. The order is passed to the **Order Router**:
   - Encodes the order into a standard **FIX (Financial Information eXchange) Protocol message** (e.g. `FIX 4.4 Tag 35=D New Order Single`).
   - Dispatches via ultra-fast point-to-point leased line to the Market Maker (Citadel/Virtu).
2. The Market Maker executes the trade and returns a `FIX Tag 35=8 Execution Report` (Fill at \$124.95).

#### 3. Trade Settlement & Double-Entry Ledger Commitment
1. The **Settlement Service** consumes the execution report:
   - Updates `STOCK_ORDER` status to `FILLED` with `executed_price = 124.95`.
   - Writes immutable double-entry postings to the **Financial Ledger**:
     - `DEBIT: Customer Cash Account (-$1,249.50)`
     - `CREDIT: Customer Stock Position (+10 Shares NVDA)`
     - Releases excess hold difference (\$0.50 price improvement).
2. Sends instant push notification and WebSocket portfolio update to the client.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Double-Entry Bookkeeping (Why Single-Balance Tables Fail)
Why is `UPDATE account SET balance = balance - 100` illegal in professional financial architecture?

- **The Mutation Flaw**: Overwriting an in-place balance column leaves **zero audit trail**. If a bug, race condition, or hardware bit-flip alters the balance, it is impossible to reconstruct where the money came from or where it went.
- **Double-Entry Principle**:
  - Money is never created or destroyed; it only transfers between accounts.
  - Every financial transaction consists of at least one **Debit** and one **Credit**.
  - **Fundamental Accounting Invariant**:
    $$\sum \text{Debits} \equiv \sum \text{Credits}$$
  - The sum of all postings in a transaction must equal **exactly zero**.
  - **Account Balances are Materialized Views**: An account's balance is formally defined as the cumulative sum of its immutable ledger entries:
    `SELECT sum(amount) FROM ledger_posting WHERE account_id = ?`.

### Deep Dive 2: Low-Latency Order Book Matching (LMAX Disruptor Pattern)
How do high-frequency internal matching engines match 100,000 orders/sec in microseconds without lock contention?

- **The Multi-Threaded Locking Bottleneck**: Traditional Java/Go thread pools using mutex locks (`ReentrantLock`, `sync.Mutex`) suffer from severe OS context-switching overhead and CPU cache line invalidation.
- **The LMAX Disruptor Architecture**:
  - Uses an in-memory **lock-free Ring Buffer** backed by a contiguous pre-allocated array.
  - Eliminates garbage collection allocation.
  - Employs a **Single-Threaded Business Logic Event Processor** pinned to a dedicated CPU core.
  - Because it is strictly single-threaded, there are **zero locks, zero mutexes, zero context switches**, and zero race conditions!
  - Processes over **6 Million orders per second** on a single thread with sub-microsecond latency.

### Deep Dive 3: Real-Time Market Data Streaming (500K Updates/sec)
How do millions of mobile users view fluctuating stock charts without overwhelming backend connections?
- **Conflation & Throttling at Edge**:
  - Stock exchanges emit 100 quote ticks per second for volatile stocks like Tesla (TSLA).
  - Mobile phone screens update at 60Hz; mobile networks cannot handle 100 frames/sec per stock.
  - **Conflation Engine**: The WebSocket Gateway buffers ticks and emits at most **1 conflated quote update every 250ms** per ticker to connected mobile devices.
  - Merges ticks into high/low/close candlestick snapshots, reducing mobile data traffic by **95%**.

---

## 5. Architectural Trade-Off Matrix

| Design Area | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Accounting Ledger** | Single Balance Column Mutation | Immutable Double-Entry Ledger Postings | **Double-Entry Ledger**: Mandatory for financial integrity and regulatory compliance. Every cent is permanently traceable and balance corruption is mathematically impossible. |
| **Order Matching** | Distributed Multi-Threaded Locks | Lock-Free Single-Threaded Ring Buffer (Disruptor) | **LMAX Disruptor**: Eliminates mutex lock contention and cache invalidation, delivering sub-microsecond matching throughput. |
| **Market Data Fan-Out**| Raw Unfiltered Ticks Broadcast | Edge Conflation (250ms Windows) | **Edge Conflation**: Prevents cellular network saturation and mobile UI rendering thrashing while preserving perfect visual responsiveness. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Designs relational schemas for Accounts, Orders, and Portfolios.
- Understands basic Market vs Limit order mechanics.
- Uses WebSockets to stream price updates to mobile clients.
- Implements basic balance checks before order creation.

### Senior (L5 / IC5)
- Details the **Double-Entry Bookkeeping** architecture with atomic debit/credit invariants.
- Explains the **LMAX Disruptor pattern** (lock-free ring buffers) for ultra-low latency matching.
- Implements market data conflation to prevent mobile socket exhaustion.
- Designs pre-trade risk checks and margin purchasing power hold reservations.

### Staff+ (L6 / Principal)
- Evaluates regulatory audit requirements (FINRA Consolidated Audit Trail - CAT) requiring microsecond monotonic timestamps across distributed servers.
- Designs high-availability active-passive failover with synchronous journal replication to ensure zero order execution loss during datacenter power cuts.
- Architects multi-asset risk management: Real-time portfolio margin calculations for complex multi-leg options spreads during market flash crashes.
