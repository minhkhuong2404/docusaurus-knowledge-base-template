---
id: scaling-writes
title: Scaling Writes
sidebar_label: Scaling Writes
description: Techniques for handling high write throughput including sharding, partitioning, write-ahead logging, append-only patterns, batching, and async write pipelines.
tags: [scaling, writes, sharding, partitioning, kafka, wal, async, performance]
---

# Scaling Writes

> Write scaling is harder than read scaling — writes mutate state and require consistency guarantees.

---

## Write Bottleneck Diagnosis

Before adding complexity, measure:
- Is the bottleneck **CPU**, **I/O**, **network**, or **lock contention**?
- What's the current write QPS vs the DB's limit?
- Are writes synchronous or could they be async?

---

## Async Write Pipelines

The first optimization: **don't make users wait for writes to persist**.

```
Client → API → Message Queue (Kafka) → Consumer → DB
                    ↑ ack immediately
```

### When to Use
- Writes don't need to be read back immediately
- Non-financial: activity logs, analytics events, notifications

### Spring Boot + Kafka Producer
```java
@Service
public class EventService {
    @Autowired private KafkaTemplate<String, ActivityEvent> kafkaTemplate;

    public void recordActivity(ActivityEvent event) {
        // Return immediately; Kafka handles delivery
        kafkaTemplate.send("activity-events", event.getUserId().toString(), event);
    }
}

@KafkaListener(topics = "activity-events")
public void processActivity(ActivityEvent event) {
    activityRepository.save(event); // Async, batched by Kafka consumer
}
```

---

## Batching Writes

Accumulate writes in memory and flush as one batch.

```java
// Spring Batch / manual batching
@Transactional
public void flushBatch(List<Event> events) {
    jdbcTemplate.batchUpdate(
        "INSERT INTO events(user_id, type, ts) VALUES (?, ?, ?)",
        events,
        100,
        (ps, e) -> {
            ps.setLong(1, e.getUserId());
            ps.setString(2, e.getType());
            ps.setTimestamp(3, Timestamp.from(e.getTimestamp()));
        }
    );
}
```

**Performance gain**: 10–100× fewer round trips to DB.

---

## Write-Ahead Log (WAL)

Append writes to a sequential log first (fast), apply to storage later (async).

```
Write → WAL (append-only, sequential I/O) → ACK to client
              ↓ (async)
         Apply to B-Tree / Storage Engine
```

**Used in**: PostgreSQL, MySQL (InnoDB redo log), Kafka itself.  
**Why fast**: Sequential I/O is 10–100× faster than random I/O.

---

## Sharding (Horizontal Partitioning)

Split data across multiple DB instances. Each shard handles a subset of writes.

### Sharding Strategies

#### Hash-Based
```
shard = hash(user_id) % NUM_SHARDS
```
- Even distribution
- Hard to add shards (re-sharding needed → use consistent hashing)

#### Range-Based
```
shard0: user_id  0 – 1,000,000
shard1: user_id  1,000,001 – 2,000,000
```
- Simple queries within a range
- Risk of hot shard (sequential IDs, time-based data)

#### Consistent Hashing
```
Virtual ring → each shard owns a range of the ring
Adding shard → only adjacent data migrates
```

### Shard Key Selection
- Must be in every write query
- High cardinality (many unique values)
- Even distribution (avoid hot shards)
- Avoid cross-shard joins (denormalize)

### Cross-Shard Problems
| Problem | Solution |
|---|---|
| JOIN across shards | Denormalize or use application-level join |
| Unique ID generation | Snowflake ID, UUID v7, DB sequence + shard ID |
| Global transactions | Saga pattern (see Multi-Step Processes) |

### Snowflake ID (Twitter-style)
```
| 41 bits timestamp | 10 bits machine ID | 12 bits sequence |
→ Globally unique, roughly sortable, no coordination needed
```

---

## Append-Only Patterns

Instead of updating records, append new state. Enables high write throughput.

```sql
-- Instead of UPDATE account SET balance = balance - 100
-- Use append-only ledger:
INSERT INTO ledger(account_id, delta, ts) VALUES (42, -100, now());

-- Balance = SUM(delta) for account_id = 42
```

**Used by**: Event sourcing, accounting systems, Kafka.

---

## Backpressure & Rate Limiting Writes

Prevent upstream from overwhelming downstream.

```java
// Token bucket rate limiter with Resilience4j
RateLimiter rateLimiter = RateLimiter.of("write-limiter",
    RateLimiterConfig.custom()
        .limitRefreshPeriod(Duration.ofSeconds(1))
        .limitForPeriod(1000) // 1000 writes/sec
        .timeoutDuration(Duration.ofMillis(100))
        .build()
);

rateLimiter.executeRunnable(() -> writeService.save(data));
```

---

## Connection Pooling

DB connections are expensive. Pool and reuse them.

```yaml
# application.yml — HikariCP (Spring Boot default)
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 3000    # 3s max wait for connection
      idle-timeout: 600000        # 10 min
      max-lifetime: 1800000       # 30 min
```

**Rule of thumb**: `pool_size = (core_count * 2) + effective_spindle_count`

---

## Idempotent Writes

Ensure retrying a write doesn't cause duplicates.

```java
// Idempotency key in DB
@Transactional
public OrderResult placeOrder(PlaceOrderCommand cmd) {
    // Check if already processed
    if (orderRepository.existsByIdempotencyKey(cmd.getIdempotencyKey())) {
        return orderRepository.findByIdempotencyKey(cmd.getIdempotencyKey());
    }
    Order order = new Order(cmd);
    order.setIdempotencyKey(cmd.getIdempotencyKey());
    return orderRepository.save(order);
}
```

---

## Database Write Optimization

### Indexing Trade-offs
- **Every index slows writes** (must update index on every insert/update)
- Audit indexes regularly; drop unused ones
- Partial indexes for filtered writes

### Bulk Insert Performance
```sql
-- Use COPY in PostgreSQL (fastest bulk load)
COPY events(user_id, type, ts) FROM '/data/events.csv' CSV;

-- Or multi-row VALUES
INSERT INTO events(user_id, type, ts) VALUES
  (1, 'click', now()), (2, 'view', now()), ...;
```

### Partitioned Tables (time-based)
```sql
CREATE TABLE events (
    id BIGSERIAL,
    ts TIMESTAMPTZ NOT NULL,
    data JSONB
) PARTITION BY RANGE (ts);

CREATE TABLE events_2024_01 PARTITION OF events
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```
Drop old partitions instantly instead of slow DELETEs.

---

## Write Scaling Decision Tree

```
Is write throughput the bottleneck?
  ├─ Can writes be async? → Use queue (Kafka)
  ├─ Can writes be batched? → Batch + WAL
  ├─ Single DB maxed out?
  │    ├─ < 5,000 wps → Optimize queries, add indexes
  │    ├─ 5,000–50,000 wps → Connection pool, caching, async
  │    └─ > 50,000 wps → Sharding or specialized DB
  └─ Hot rows/tables? → See Handling Contention
```

---

## Interview Questions

1. How would you scale a system from 1,000 writes/sec to 100,000 writes/sec?
2. What is a write-ahead log and why does it speed up writes?
3. How do you choose a shard key, and what makes a bad one?
4. What is consistent hashing and why is it used for sharding?
5. How do you handle cross-shard transactions?
6. Why are append-only writes faster than in-place updates?
7. How do you generate globally unique IDs without a centralized coordinator?
8. What is backpressure and how do you implement it?
