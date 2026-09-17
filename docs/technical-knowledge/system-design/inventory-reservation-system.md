---
id: inventory-reservation-system
title: "Inventory Reservations at Scale: Why Shopify Moved from Redis to MySQL"
sidebar_label: 🛒 Inventory Reservations
description: Deep dive into high-concurrency inventory reservation architectures — why Redis dual-writes cause overselling and underselling, how MySQL 8 SKIP LOCKED eliminates row contention, and how Shopify scaled to $5.1M GMV/minute during Black Friday.
tags: [inventory-reservation, shopify, mysql, redis, skip-locked, e-commerce, concurrency, flash-sales, system-design]
---

import InventoryReservationDiagram from '@site/src/components/InventoryReservationDiagram';

# Inventory Reservations at Scale: Why Shopify Moved from Redis to MySQL

During viral flash sales (e.g. Kylie Cosmetics, Gymshark, Supreme) and Black Friday / Cyber Monday, tens of thousands of shoppers attempt to checkout the exact same 100 inventory units within the same second. 

Designing an inventory system for this scale presents one of the most demanding challenges in distributed systems: **How do you guarantee sub-second checkout latency while providing 100% strict consistency against overselling and underselling?**

For years, standard industry wisdom recommended holding reservations in **Redis** and recording the authoritative ledger in **MySQL**. However, in a landmark engineering shift, Shopify migrated their entire inventory reservation system back to **MySQL 8**, using `SELECT ... FOR UPDATE SKIP LOCKED` to handle peaks of **$5.1 million in sales per minute**.

---

## 1. The Core E-Commerce Problem: Overselling vs Underselling

When 10,000 customers race to purchase the last 5 items, any race condition creates severe business failures:

<InventoryReservationDiagram initialTab="tradeoff-matrix" />

| Failure Mode | Physical Cause | Real-World Consequence |
|---|---|---|
| **Overselling** | Two checkouts simultaneously claim the same inventory unit before the stock deduction commits. | Selling more inventory than physically exists in the warehouse; order cancellations, angry customers, merchant fines. |
| **Underselling** | Abandoned checkouts lock inventory units that are never purchased or reconciled. | Product shows "Sold Out" on the website while units physically sit unpurchased on warehouse shelves. |

---

## 2. Architecture 1: The Monolithic Counter Dilemma

The naive relational approach tracks inventory as a simple numeric counter:

```sql
-- Naive deduction
UPDATE inventory 
SET quantity = quantity - 1 
WHERE item_id = 42 AND quantity > 0;
```

Or using pessimistic locking:

```sql
SELECT quantity FROM inventory WHERE item_id = 42 FOR UPDATE;
-- Application checks quantity > 0
UPDATE inventory SET quantity = quantity - 1 WHERE item_id = 42;
```

### Why It Collapses Under Flash Sales (The Row Contention Bottleneck)
1. **Single Row Mutex**: Every checkout process must acquire an exclusive row-level write lock on the **exact same row** (`item_id = 42`).
2. **Lock Queue Serialization**: If 10,000 shoppers click "Buy Now" at 10:00:00 AM, the database serializes all 10,000 transactions one by one.
3. **Cascading Failure**:
   - Transaction 1 holds the lock for 5ms. Transaction 1,000 waits 5,000ms.
   - App servers exhaust their database connection pools waiting on row locks.
   - Database queries begin timing out (`ERROR 1205: Lock wait timeout exceeded`).
   - The entire checkout service crashes.

---

## 3. Architecture 2: Redis Holds + MySQL Ledger (The "Dual-Write Seam")

To avoid database row contention, the standard industry pattern introduced **Redis as an in-memory reservation cache**:



### The Fatal Flaw: The "Seam" Between Two Independent Datastores

Because Redis and MySQL are physically independent databases, **there is no distributed atomic transaction spanning both systems**. This boundary creates an architectural "seam" where edge-case failures inevitably corrupt inventory state:

<InventoryReservationDiagram initialTab="dual-write-seam" />

### 3 Catastrophic Failure Scenarios of Redis + MySQL

#### Scenario A: The Expiration Race (Overselling)
1. User A reserves the last item in Redis with a 10-minute hold TTL (`SETEX hold:item_42 600 user_A`).
2. Stripe's payment processing experiences a transient delay, taking 10 minutes and 5 seconds.
3. At 10:00.000, Redis expires the reservation and releases the stock back to the pool.
4. User B immediately claims the released stock in Redis.
5. At 10:05.000, User A's payment succeeds and commits an order into MySQL.
6. User B finishes payment and also commits an order into MySQL.
7. **Result**: Both User A and User B paid for the exact same physical unit (**Overselling**).

#### Scenario B: Phantom Holds (Underselling)
1. User A adds item to cart; Redis decrements stock.
2. The browser crashes, network disconnects, or the payment fails.
3. If the compensation rollback to Redis fails, the stock remains locked.
4. The product displays as "Sold Out" while inventory physically sits in the warehouse.

#### Scenario C: Reconciliation Churn
To combat drift between Redis and MySQL, engineering teams deploy background "reconciler" scripts. During Black Friday, reconciling millions of rapidly changing keys across Redis and MySQL consumes massive compute and disk I/O, frequently falling behind real-time traffic.

---

## 4. Architecture 3: The Modern Solution — Moving to MySQL 8 with `SKIP LOCKED`

To eliminate the dual-write seam permanently, Shopify moved reservations directly into **MySQL 8**. They solved the row contention problem through two key innovations: **Inventory Disaggregation** and **`SELECT ... FOR UPDATE SKIP LOCKED`**.

<InventoryReservationDiagram initialTab="mysql-skip-locked" />

### Innovation 1: Disaggregating Inventory into Unit-Level Rows

Instead of storing a single row with a numeric quantity (`quantity = 100`), stock is modeled as individual units or discrete claimable slots:

```sql
CREATE TABLE inventory_units (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_id BIGINT NOT NULL,
    status ENUM('available', 'reserved', 'sold') NOT NULL DEFAULT 'available',
    reservation_id VARCHAR(64) NULL,
    expires_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_item_status_expires (item_id, status, expires_at)
) ENGINE=InnoDB;
```

### Innovation 2: `SELECT ... FOR UPDATE SKIP LOCKED`

Under standard SQL pessimistic locking (`FOR UPDATE`), if Row 1 is locked by Transaction A, Transaction B blocks and waits for Transaction A to finish.

Under **`SKIP LOCKED`**, if Row 1 is locked by Transaction A, the database **skips Row 1 immediately** and claims the next unlocked row (Row 2):

```sql
START TRANSACTION;

-- 1. Atomically claim 2 available units without waiting on locked rows
SELECT id 
FROM inventory_units 
WHERE item_id = 101 AND status = 'available' 
ORDER BY id 
LIMIT 2 
FOR UPDATE SKIP LOCKED;

-- If 2 IDs are returned (e.g. IDs 1042, 1043):
UPDATE inventory_units 
SET status = 'reserved', 
    reservation_id = 'res_9981a', 
    expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE) 
WHERE id IN (1042, 1043);

COMMIT;
```

### Why `SKIP LOCKED` Scales Infinitely
- **Zero Lock Contention**: 50 concurrent checkout workers can query `item_id = 101` at the exact same millisecond. Each worker instantly claims different rows without a single millisecond spent waiting in a lock queue!
- **Deterministic Throughput**: Throughput scales linearly with the number of available CPU cores and database IOPS.

---

## 5. The 3-State Reservation Lifecycle

Every unit in the warehouse transitions through a deterministic state machine:

<InventoryReservationDiagram initialTab="lifecycle-flow" />

### Step 1: Claiming a Reservation (Hold)
```sql
UPDATE inventory_units 
SET status = 'reserved', reservation_id = :res_id, expires_at = NOW() + INTERVAL 10 MINUTE 
WHERE id = :unit_id AND status = 'available';
```

### Step 2: Committing the Sale (Payment Confirmed)
When the payment gateway confirms successful authorization:
```sql
UPDATE inventory_units 
SET status = 'sold', reservation_id = NULL, expires_at = NULL 
WHERE reservation_id = :res_id AND status = 'reserved';
```

### Step 3: Releasing an Abandoned Reservation (Timeout / Cancel)
If the user closes the tab or payment is declined:
```sql
UPDATE inventory_units 
SET status = 'available', reservation_id = NULL, expires_at = NULL 
WHERE reservation_id = :res_id AND status = 'reserved';
```

---

## 6. High-Throughput Expiration Sweepers

What happens when a customer abandons their cart and never returns? The reservation expires, but who marks it `available` again?

### Approach A: Lazy In-Query Expiration
During the checkout query, allow `SKIP LOCKED` to claim units that are either `'available'` OR expired:

```sql
SELECT id 
FROM inventory_units 
WHERE item_id = :item_id 
  AND (status = 'available' OR (status = 'reserved' AND expires_at < NOW()))
LIMIT :quantity 
FOR UPDATE SKIP LOCKED;
```
- **Pro**: Reclaims expired units immediately on demand without background worker lag.
- **Con**: Slightly more complex index evaluation.

### Approach B: Background Sweeper Worker
A lightweight background job continuously reclaims expired units in batches:

```sql
-- Run every 10 seconds by a background worker
UPDATE inventory_units 
SET status = 'available', reservation_id = NULL, expires_at = NULL 
WHERE status = 'reserved' AND expires_at < NOW() 
LIMIT 500;
```

---

## 7. Architecture Comparison Matrix

| Architectural Pattern | Max Concurrency | Consistency Level | Dual-Write Risk | Production Operational Complexity |
|---|---|---|---|---|
| **Single Counter in SQL** (`qty = qty - 1`) | ~100 tx/sec per item | Strong (ACID) | Zero | Low (Single table) |
| **Redis Cache Holds + MySQL Ledger** | ~50,000 tx/sec | Eventual / Weak | High (Seam between Redis and MySQL) | High (Reconciler scripts, TTL race conditions) |
| **MySQL 8 `SKIP LOCKED` (Shopify)** | **~15,000 - 25,000 tx/sec per shard** | **Strict Serializability (ACID)** | **Zero (Single datastore)** | **Moderate (Unit-level table + index tuning)** |
| **DynamoDB Conditional Writes** | ~20,000 tx/sec | Strong (per partition) | Low | High (No relational joins, custom transactional rollbacks) |

---

## 8. Summary: Key Takeaways

1. **Beware the Seam**: Whenever state spans two independent storage systems (e.g. Redis for holds and MySQL for orders), true atomic consistency is impossible without complex distributed transactions.
2. **Disaggregate Hot Counters**: Converting a single numeric counter row into discrete unit rows spreads lock contention across multiple distinct records.
3. **`SKIP LOCKED` Eliminates Lock Queuing**: Instead of blocking behind a mutex, checkout workers skip locked units and claim adjacent available inventory simultaneously.
4. **Simplicity Wins at Scale**: By eliminating Redis from the reservation critical path, Shopify removed distributed race conditions, eliminated reconciliation drift, and achieved unprecedented Black Friday reliability.

---

### Related Concepts
- [Handling Contention & High-Concurrency Locks](./handling-contention.md)
- [Real-World Case Studies: Hyper-Scale Architectures](./case-studies-architecture-scaling.md)
- [PostgreSQL Heap Storage Architecture & Internals](../database/postgresql-heap-storage-architecture.md)
- [Database Connection Pooling & Tuning](../database/connection-pooling.md)
- [Transactional Outbox Pattern](./outbox-pattern.md)
