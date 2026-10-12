---
id: stock-exchange
title: Design a Stock Exchange & Matching Engine (Microsecond Latency)
sidebar_label: 48. Stock Exchange (Matching Engine)
description: Staff-level system design breakdown for an ultra-low latency stock exchange matching engine using Price-Time Priority order books, LMAX Disruptor lock-free ring buffers, and reliable UDP multicast market data feeds.
---

import StockExchangeMatchingDiagram from '@site/src/components/StockExchangeMatchingDiagram';

# Design a Stock Exchange & Matching Engine (Microsecond Latency)

A **Stock Exchange** (such as NASDAQ, NYSE, or Euronext) is the apex of mission-critical, ultra-low-latency financial infrastructure. Unlike a retail broker (e.g., Robinhood) which merely routes client orders to market makers, an **exchange matching engine is the definitive central counterparty that maintains the Limit Order Book (LOB), pairs buyers and sellers with sub-microsecond precision, guarantees deterministic execution ordering, and broadcasts real-time tick-by-tick market data**.

---

## 1. Requirements & System Scope

### Functional Requirements
1. **Order Placement & Cancellation**: Support limit orders, market orders, and cancel orders via industry-standard protocols (FIX, OUCH).
2. **Deterministic Order Matching**: Execute trades using **Price-Time Priority (FIFO)**: orders with better prices execute first; orders at the same price execute in strict arrival sequence.
3. **Limit Order Book (LOB) Maintenance**: Maintain live sorted Bid (buy) and Ask (sell) price ladders with depth of book.
4. **Market Data Dissemination**: Broadcast real-time trade executions, quotes, and order book changes to all market participants simultaneously (ITCH protocol).

### Non-Functional Requirements
- **Sub-Microsecond Matching Latency**: P99 order execution latency $< 10\text{ microseconds}$ within the engine core.
- **Strict Determinism**: Given the identical sequence of incoming orders, any engine replica or replay log must produce the **exact same execution output and internal state**.
- **Fairness & Zero Information Asymmetry**: Market data must be disseminated simultaneously to all participants without preferential jitter (via UDP Multicast).
- **High Availability & Instant Failover**: Zero message loss ($RPO = 0$) and sub-second recovery ($RTO < 1\text{s}$) upon primary hardware failure.

---

## 2. Capacity Estimations & Throughput Numbers

```
┌─────────────────────────────────────────────────────────────┐
│                    EXCHANGE SCALE METRICS                   │
├─────────────────────────────────────────┬───────────────────┤
│ Tradable Symbols (Tickers)              │ 10,000 instruments│
│ Trading Hours                           │ 6.5 hours / day   │
│ Daily Orders & Cancels                  │ 1 Billion messages│
│ Average Message Rate                    │ ~45,000 msgs/sec  │
│ Peak Message Rate (Market Open/Fed Rate)│ 1,000,000 msgs/sec│
│ Target Matching Engine Latency          │ < 10 microseconds │
└─────────────────────────────────────────┴───────────────────┘
```

At 1,000,000 messages/sec during market-moving economic events, traditional multi-threaded architectures relying on OS thread synchronization, database I/O, or network sockets collapse due to CPU cache thrashing and context switching.

---

## 3. High-Level Architecture & Interactive Diagram

<StockExchangeMatchingDiagram />

---

## 4. Limit Order Book (LOB) Data Structure

The Limit Order Book is the central memory structure of the matching engine. It must support three operations at extreme velocity:
1. **Insert Order**: Add a new limit order at a specific price level.
2. **Cancel Order**: Remove an existing order by its Order ID ($O(1)$ required).
3. **Match Order**: Walk the opposing side of the book and fill resting volume.

```
       BIDS (Buy Orders)                       ASKS (Sell Orders)
  Price ($)    Queue (FIFO)              Price ($)    Queue (FIFO)
┌───────────┬───────────────────┐       ┌───────────┬───────────────────┐
│  $100.50  │ [Ord 1] ─▶ [Ord 2]│       │  $100.55  │ [Ord 5] ─▶ [Ord 6]│
├───────────┼───────────────────┤       ├───────────┼───────────────────┤
│  $100.45  │ [Ord 3] ─▶ [Ord 4]│       │  $100.60  │ [Ord 7]           │
└───────────┴───────────────────┘       └───────────┴───────────────────┘
```

### The Composite Data Structure:
To achieve $O(1)$ cancellations and $O(\log M)$ price-level lookups:

```
┌────────────────────────────────────────────────────────┐
│                   COMPOSITE ORDER BOOK                 │
│                                                        │
│  Skip List / B-Tree of Prices (Sorted)                │
│    ├── Price $100.50 ──▶ Doubly Linked List of Orders  │
│    │                      [Head] ⇄ [Node A] ⇄ [Tail]   │
│    └── Price $100.45 ──▶ Doubly Linked List of Orders  │
│                                                        │
│  Fast Lookup Hash Map:                                 │
│    OrderID (UUID/uint64) ──▶ Direct Pointer to Node    │
└────────────────────────────────────────────────────────┘
```

1. **Price Ladder (Skip List / Red-Black Tree)**:
   - Maintains sorted price levels. Highest bid is at the top of Bids; lowest ask is at the top of Asks.
   - Price levels contain aggregated total volume and head/tail pointers to a FIFO queue.
2. **Doubly Linked List of Orders (Time Priority)**:
   - Each order points to `prev` and `next`. When a limit order arrives at an existing price level, it is appended to the tail in $O(1)$.
3. **Direct Order Index (Hash Table / Array)**:
   - Maps `order_id` to the memory address of the `Order` struct.
   - When a cancellation arrives, the engine looks up the node in $O(1)$ and unlinks it from the doubly linked list in $O(1)$ without scanning the queue!

---

## 5. The LMAX Disruptor & Mechanical Sympathy

Modern high-frequency matching engines do not use traditional thread pools or Java `BlockingQueue`. They utilize **Mechanical Sympathy**—aligning software design with the physical CPU hardware architecture.

### Why Traditional Locks Destroy Microsecond Latency:
- A Linux mutex lock/unlock takes ~25ns under zero contention, but skyrockets to **millions of nanoseconds (1–10ms)** when multiple threads contend and the OS kernel context switches the thread off the CPU core.
- Multi-threaded shared memory invalidates CPU L1/L2 caches via cache coherency protocols (MESI), causing continuous cache misses.

### The Lock-Free Ring Buffer (LMAX Disruptor):

```
       [Slot 7]   [Slot 0]
   [Slot 6]             [Slot 1] ─── Write Cursor (Sequencer)
   [Slot 5]             [Slot 2] ─── Read Cursor (Matching Engine)
       [Slot 4]   [Slot 3]
```

1. **Pre-Allocated Contiguous Array**:
   - The ring buffer is pre-allocated in RAM at process startup. Zero runtime object allocations occur in the hot path, completely eliminating Java Garbage Collection pauses.
2. **Bitwise Modulo via Power of Two**:
   - Sized to $2^N$ (e.g., $1,048,576$ slots). Slot index calculation uses fast bitwise AND instead of slow division:
     $$\text{slotIndex} = \text{sequence} \ \& \ (\text{capacity} - 1)$$
3. **Cache Line Padding to Prevent False Sharing**:
   - Modern CPUs load memory in 64-byte cache lines. If the writer cursor and reader cursor share the same 64-byte boundary, modifying one invalidates the other core's cache!
   - Cursor fields are padded with 56 bytes of dummy `long` values to ensure every sequence cursor occupies its own isolated 64-byte L1 cache line:

```java
public class PaddedAtomicLong {
    // 56 bytes of preceding padding
    public volatile long p1, p2, p3, p4, p5, p6, p7;
    // The actual hot sequence value
    public volatile long value = 0L;
    // 56 bytes of trailing padding
    public volatile long p8, p9, p10, p11, p12, p13, p14;
}
```

---

## 6. The Deterministic Sequencer & Single-Threaded Core

```
Incoming Orders ──▶ Deterministic Sequencer ──▶ Ring Buffer ──▶ Single-Threaded Engine Core
                         (Assigns ID: 1, 2, 3...)                    (Pinned CPU Core)
```

1. **Global Monotonic Sequencer**:
   - Every inbound packet is stamped with a strictly increasing 64-bit integer sequence number ($1, 2, 3, \dots$).
   - This timestamp/sequence defines the absolute, unchallengeable legal order of priority across the entire exchange.
2. **Single-Threaded Execution**:
   - The matching engine core runs on **a single dedicated thread pinned to an isolated physical CPU core** (using Linux `isolcpus` and `taskset`).
   - Because only one thread touches the Limit Order Book, **zero locks, zero synchronized blocks, and zero atomic CAS loops** are required. The CPU runs instructions at maximum IPC (Instructions Per Cycle) directly out of L1 cache!
3. **Throughput Capacity**:
   - A single modern CPU core executing simple memory updates can match up to **2.5 to 5 million orders per second** at $< 2\text{ microseconds}$ per match!

---

## 7. Market Data Dissemination: Reliable UDP Multicast & ITCH/OUCH

Once an order matches or updates the book, the result must be published to thousands of market participants (brokers, hedge funds, algorithmic traders).

```
Matching Engine ──▶ Market Data Publisher ──UDP Multicast (Aeron)──▶ Broker 1
                                                                  ──▶ Broker 2
                                                                  ──▶ Hedge Fund A
```

### Why TCP Unicast Fails for Market Data:
- If the exchange had 1,000 connected brokers, publishing a trade over TCP requires transmitting the packet 1,000 separate times sequentially over 1,000 sockets.
- The 1st broker receives the quote at $T_0$; the 1,000th broker receives it at $T_0 + 5\text{ms}$. This creates massive regulatory unfairness and latency arbitrage.

### The UDP Multicast Solution (Nasdaq ITCH Protocol):
1. **Single Transmission**: The exchange switches broadcast the packet once onto the multicast group IP (e.g., `233.54.1.1`). Network switches replicate the packet at hardware wire-speed to all subscriber ports simultaneously.
2. **Deterministic Fairness**: Every participant receives the tick within nanoseconds of each other.
3. **Loss Recovery via Gap Fill**:
   - Each ITCH packet contains a monotonic sequence number.
   - If a subscriber detects a sequence gap (e.g., received #400, then #402), it requests a historical retransmission of #401 from a dedicated out-of-band TCP Replay Server.

---

## 8. High-Availability & Disaster Recovery: Hot Standby Replay

To survive hardware failure with zero data loss ($RPO = 0$):

```
                       ┌────────────────────────┐
                       │ Deterministic Sequencer│
                       └───────────┬────────────┘
                                   │
                 ┌─────────────────┴─────────────────┐
                 ▼                                   ▼
      ┌───────────────────────┐           ┌───────────────────────┐
      │ Primary Matching Core │           │ Hot Standby Replica   │
      │ - Processes Seq: N    │           │ - Processes Seq: N    │
      │ - Publishes Execution │           │ - Suppresses Output   │
      └───────────────────────┘           └───────────────────────┘
```

1. **Identical Deterministic Replay**:
   - Both Primary and Standby listen to the exact same sequenced input stream.
   - Because the matching engine is a 100% deterministic state machine, the Standby's internal Limit Order Book is an identical clone of the Primary's book at all times.
2. **Output Suppression**:
   - The Standby executes all matches in memory, but suppresses its external network output.
3. **Sub-Millisecond Heartbeat Failover**:
   - If the Primary misses a hardware heartbeat (e.g., 50ms), the Standby unsuppresses its network output and assumes primary matching duties with **zero state reconstruction delay**.
