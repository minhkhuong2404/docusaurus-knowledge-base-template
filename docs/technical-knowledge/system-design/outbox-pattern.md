---
id: outbox-pattern
title: "Transactional Outbox Pattern"
sidebar_label: Transactional Outbox
description: A complete guide to the Transactional Outbox Pattern — from the Dual-Write problem for beginners to CDC vs polling internals, at-least-once guarantees, ordering semantics, and production monitoring for senior engineers.
tags: [system-design, distributed-systems, outbox-pattern, cdc, database, transactions, event-driven, kafka]
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import TransactionalOutboxDiagram from '@site/src/components/TransactionalOutboxDiagram';
import DebeziumCdcDiagram from '@site/src/components/DebeziumCdcDiagram';
import CdcVsPollingDiagram from '@site/src/components/CdcVsPollingDiagram';
import OutboxFailureRecoveryDiagram from '@site/src/components/OutboxFailureRecoveryDiagram';

# Transactional Outbox Pattern

:::info[Who this guide is for]
- **New learners** — start at [The Dual-Write Problem](#the-dual-write-problem) and [The Coffee Shop Analogy](#the-coffee-shop-analogy) to build intuition.
- **Senior engineers** — jump to [How the Relay Works Internally](#how-the-relay-works-internally), [CDC vs Polling Deep Dive](#cdc-vs-polling-publisher-deep-dive), [Ordering Semantics](#ordering-semantics--partitioning), or [Production Observability](#production-observability).
:::

---

## The Dual-Write Problem

Every event-driven microservice eventually hits the same wall:

```java
@Transactional
public Order placeOrder(CreateOrderCommand cmd) {
    Order order = orderRepository.save(Order.from(cmd));   // Write #1: database
    kafkaTemplate.send("order-events", new OrderPlaced(order)); // Write #2: Kafka
    return order;
}
```

This code looks innocent but has a **fatal concurrency bug**. There are **two independent writes** to two different systems, and there is no way to make them atomic together:

| Scenario | DB Write | Kafka Write | Result |
|:---|:---|:---|:---|
| Both succeed | ✅ | ✅ | Correct |
| DB fails, Kafka succeeds | ❌ | ✅ | **Ghost event** — event for an order that doesn't exist |
| DB succeeds, Kafka fails | ✅ | ❌ | **Silent drop** — order exists but no downstream service knows |
| Process crashes between the two writes | ✅ | ❌ | **Same as above** |

The third scenario — **DB succeeds, Kafka fails** — is the most dangerous and most common. Your order service confirms the order to the user, but inventory was never reserved, the email was never sent, and payment was never triggered.

---

## The Coffee Shop Analogy

Imagine a coffee shop. When you order, the barista:
1. Writes your order on a **paper ticket** (the outbox table — in the same action as taking the order)
2. Sticks it on the **order board** (publishes to Kafka — done by a separate relay process)

Even if the board catches fire (Kafka is down), the paper ticket is still there. A new barista (relay restart) can read the ticket and re-post it to the board when it's back up.

The key insight: **the ticket (outbox record) and the order (business record) are written in one pen stroke — atomically**. The board (Kafka) gets updated eventually but reliably.

---

## The Transactional Outbox Pattern

The Transactional Outbox Pattern solves the Dual-Write Problem by writing the event payload **to the same database as the business data**, in the same local ACID transaction. A separate relay process then reads the outbox and publishes events to the message broker.

<TransactionalOutboxDiagram />

**Guarantee:** If the database transaction commits, the event **will eventually** be published to Kafka. If the transaction rolls back, no event is published. There is no window where the order exists but the event is missing.

---

## Database Schema

### PostgreSQL Outbox Table

```sql
CREATE TABLE outbox_events (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type  VARCHAR(255) NOT NULL,           -- e.g., 'Order', 'Payment'
    aggregate_id    VARCHAR(255) NOT NULL,           -- e.g., order UUID
    event_type      VARCHAR(255) NOT NULL,           -- e.g., 'OrderPlaced'
    payload         JSONB        NOT NULL,           -- full event payload
    topic           VARCHAR(255) NOT NULL,           -- target Kafka topic
    partition_key   VARCHAR(255),                   -- for ordering (e.g., orderId)
    status          VARCHAR(50)  NOT NULL DEFAULT 'PENDING',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    published_at    TIMESTAMPTZ,
    retry_count     INT          NOT NULL DEFAULT 0,
    last_error      TEXT,
    idempotency_key VARCHAR(255) UNIQUE              -- prevents duplicate inserts
);

-- Fast index for the relay process (only scans PENDING rows)
CREATE INDEX CONCURRENTLY idx_outbox_pending
    ON outbox_events (created_at ASC)
    WHERE status = 'PENDING';

-- Index for cleanup jobs (purge old PUBLISHED records)
CREATE INDEX idx_outbox_published_at
    ON outbox_events (published_at)
    WHERE status = 'PUBLISHED';
```

:::tip[Why a partial index?]
`WHERE status = 'PENDING'` makes the index only cover unpublished rows — which is the tiny minority of rows in a mature system. The relay's SELECT query scans only this index, not the full table, giving O(1) relay performance regardless of total table size.
:::

---

## Application Write Phase (Spring Boot)

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {
    private final OrderRepository orderRepository;
    private final OutboxRepository outboxRepository;
    private final ObjectMapper objectMapper;

    @Transactional // local ACID — both writes succeed or both fail
    public Order placeOrder(CreateOrderCommand cmd) {
        // Business operation
        Order order = Order.create(cmd);
        orderRepository.save(order);

        // Write event to outbox IN THE SAME TRANSACTION
        OutboxEvent event = OutboxEvent.builder()
            .aggregateType("Order")
            .aggregateId(order.getId().toString())
            .eventType("OrderPlaced")
            .topic("order-events")
            .partitionKey(order.getId().toString())  // ensures ordering per order
            .payload(serialize(new OrderPlacedEvent(order)))
            .idempotencyKey("order-placed:" + order.getId())
            .build();

        outboxRepository.save(event);

        log.info("Order {} created, outbox event {} queued", order.getId(), event.getId());
        return order;
    }

    private String serialize(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Serialization failed", e);
        }
    }
}
```

---

## How the Relay Works Internally

### Strategy A: Polling Publisher (SKIP LOCKED)

A scheduled background job queries for `PENDING` rows and publishes them to Kafka. The critical detail is `FOR UPDATE SKIP LOCKED` — this prevents multiple relay instances from picking up the same events simultaneously.

```
Timeline:
t=0    Relay instance 1 queries: SELECT ... WHERE status='PENDING' FOR UPDATE SKIP LOCKED
       → Gets rows [E1, E2, E3] (locked)
t=0    Relay instance 2 queries: SELECT ... WHERE status='PENDING' FOR UPDATE SKIP LOCKED
       → Gets rows [E4, E5, E6] (different rows — instance 1's rows are SKIPped)
t=1    Instance 1 publishes E1 to Kafka, marks PUBLISHED
t=1    Instance 2 publishes E4 to Kafka, marks PUBLISHED
       → Both instances work in parallel without contention ✅
```

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class OutboxPollingRelay {
    private final OutboxRepository outboxRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final OutboxMetrics metrics;

    @Scheduled(fixedDelay = 500) // poll every 500ms
    @Transactional
    public void pollAndPublish() {
        List<OutboxEvent> batch = outboxRepository.findPendingForUpdate(100);

        if (batch.isEmpty()) return;

        log.debug("Processing batch of {} outbox events", batch.size());
        long startMs = System.currentTimeMillis();

        for (OutboxEvent event : batch) {
            try {
                // Synchronous send — confirms broker accepted before marking as published
                kafkaTemplate.send(
                    event.getTopic(),
                    event.getPartitionKey(),
                    event.getPayload()
                ).get(5, TimeUnit.SECONDS); // timeout after 5s

                event.markPublished();
                outboxRepository.save(event);
                metrics.recordPublished(event.getEventType());

            } catch (Exception e) {
                log.error("Failed to publish outbox event {}: {}", event.getId(), e.getMessage());
                event.recordFailure(e.getMessage());
                outboxRepository.save(event);
                metrics.recordFailure(event.getEventType());
                break; // Stop batch on failure to preserve ordering per partition key
            }
        }

        metrics.recordBatchDuration(System.currentTimeMillis() - startMs);
    }
}
```

```java
public interface OutboxRepository extends JpaRepository<OutboxEvent, UUID> {

    @Query(value = """
            SELECT *
            FROM outbox_events
            WHERE status = 'PENDING'
            ORDER BY created_at ASC
            LIMIT :#{#pageable.pageSize}
            FOR UPDATE SKIP LOCKED
            """, nativeQuery = true)
    List<OutboxEvent> findPendingForUpdate(int limit);
}
```

**Polling trade-offs:**

| Aspect | Detail |
|:---|:---|
| **Latency** | 0–500ms additional latency (poll interval) |
| **Database load** | Constant read queries every 500ms per relay instance |
| **Complexity** | Simple — no additional infrastructure |
| **Throughput** | Scales horizontally by adding relay instances |
| **Best for** | Low-to-medium volume (< 1,000 events/sec) |

---

### Strategy B: Change Data Capture (CDC) via Debezium

Debezium reads the PostgreSQL **Write-Ahead Log (WAL)** directly — the same internal mechanism PostgreSQL uses for replication. When a row is inserted into `outbox_events`, Debezium reads the WAL entry and streams it to Kafka Connect immediately — typically in **< 50ms**.

<DebeziumCdcDiagram />

```json
{
  "name": "outbox-connector",
  "config": {
    "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
    "tasks.max": "1",
    "database.hostname": "postgres-host",
    "database.port": "5432",
    "database.user": "debezium_user",
    "database.password": "${file:/kafka/connect-secrets:postgres.password}",
    "database.dbname": "myapp",
    "slot.name": "debezium_outbox_slot",
    "publication.name": "debezium_publication",
    "table.include.list": "public.outbox_events",
    "transforms": "outbox",
    "transforms.outbox.type": "io.debezium.transforms.outbox.EventRouter",
    "transforms.outbox.route.by.field": "aggregate_type",
    "transforms.outbox.route.topic.replacement": "${routedByValue}-events",
    "transforms.outbox.table.field.event.key": "aggregate_id",
    "transforms.outbox.table.field.event.payload": "payload",
    "transforms.outbox.table.field.event.type": "event_type",
    "heartbeat.interval.ms": "10000",
    "slot.drop.on.stop": "false"
  }
}
```

**Setting up PostgreSQL for logical replication:**

```sql
-- postgresql.conf must have:
wal_level = logical
max_replication_slots = 5  -- one per Debezium connector
max_wal_senders = 5

-- Create a Debezium user with replication privileges
CREATE USER debezium_user WITH REPLICATION LOGIN PASSWORD 'secure_pass';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO debezium_user;

-- Create publication (what Debezium watches)
CREATE PUBLICATION debezium_publication FOR TABLE outbox_events;
```

**CDC trade-offs:**

| Aspect | Detail |
|:---|:---|
| **Latency** | Sub-50ms — reads WAL nearly in real time |
| **Database load** | Minimal — reads WAL stream, not polling queries |
| **Complexity** | Requires Kafka Connect + Debezium + PostgreSQL logical replication |
| **Ordering** | Preserves WAL order — events published in exact insert order |
| **Best for** | High volume (> 1,000 events/sec), strict latency requirements |

---

## CDC vs Polling Publisher Deep Dive
<CdcVsPollingDiagram />

:::note[Both strategies deliver at-least-once]
Neither polling nor CDC guarantees exactly-once delivery to Kafka. Your consumers must handle duplicates using idempotency keys. See the [Deduplication Guide](../kafka/advanced/exactly-once-vs-dedup.md) for implementation patterns.
:::

---

## Database Failure Retries & Post-Publish ACK Failure Recovery

The naive `@Transactional` polling relay shown earlier works on happy paths, but breaks violently in production when **either the database or Kafka degrades**. Understanding two concrete production failure modes separates a textbook outbox from a bank-grade resilient outbox:

1. **Database Issues on the Outbox Table** (connection pool exhaustion, RDS Multi-AZ primary failover `57P01`, deadlocks `40P01`, serialization failures `40001`, or slow queries).
2. **Kafka Succeeds, But Updating `outbox_events` Status Fails** (the **"Post-Publish ACK Failure"** / Reverse Dual-Write window where Kafka has already persisted the message, but the DB `UPDATE status = 'PUBLISHED'` fails due to a DB outage, timeout, or relay pod crash).

<OutboxFailureRecoveryDiagram />

### 1. Why Naive `@Transactional` Polling Fails Under Load

Holding a Spring `@Transactional` boundary open across a synchronous `kafkaTemplate.send().get(5, SECONDS)` call is a **critical production anti-pattern**:

- **HikariCP Connection Starvation**: If a batch of 100 events hits a slow Kafka broker (2s per message), a single relay thread holds one database connection and 100 row locks for **200 seconds**. Across 10 relay pods, your database connection pool is exhausted and user-facing `POST /orders` traffic starts failing with `HikariPool - Connection is not available`.
- **PostgreSQL MVCC `xmin` Horizon Pinning**: Long-running open transactions prevent PostgreSQL `VACUUM` from reclaiming dead tuples across the entire database, causing rapid table bloat and degraded index scans.
- **All-or-Nothing Rollback Amplification**: If event #99 fails to update in the DB and triggers a transaction rollback, events #1 through #98—which were **already published to Kafka**—all revert to `PENDING` and get duplicated 98 times on the next poll!

### 2. Production Fix: The 3-Phase Claim-Publish-Ack Pattern (Lease + Fencing Token)

Never hold a database transaction open while talking to Kafka. Split the relay into **three isolated phases** backed by a lease timeout and a monotonically increasing `fencing_token`:

```sql
-- Add lease, retry-backoff, and fencing columns to outbox_events
ALTER TABLE outbox_events
    ADD COLUMN locked_by        VARCHAR(128),
    ADD COLUMN lease_expires_at TIMESTAMPTZ,
    ADD COLUMN next_retry_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN fencing_token    BIGINT      NOT NULL DEFAULT 0;

-- Partial index covering BOTH ready PENDING rows and expired IN_PROGRESS leases
CREATE INDEX CONCURRENTLY idx_outbox_claimable
    ON outbox_events (next_retry_at ASC, created_at ASC)
    WHERE status IN ('PENDING', 'IN_PROGRESS');
```

**Atomic Lease Claim Query (Phase 1 — commits in `< 5ms`, releases DB connection immediately):**

```sql
WITH claimable AS (
    SELECT id
    FROM outbox_events
    WHERE (status = 'PENDING' AND next_retry_at <= now())
       OR (status = 'IN_PROGRESS' AND lease_expires_at < now())
    ORDER BY created_at ASC
    LIMIT :batchSize
    FOR UPDATE SKIP LOCKED
)
UPDATE outbox_events o
SET status           = 'IN_PROGRESS',
    locked_by        = :workerId,
    lease_expires_at = now() + INTERVAL '60 seconds',
    fencing_token    = o.fencing_token + 1
FROM claimable c
WHERE o.id = c.id
RETURNING o.*;
```

**Why `fencing_token` is mandatory**: If Relay Pod A claims Event `E1` (`fencing_token = 1`), pauses for 70 seconds during a JVM Stop-The-World GC pause, and Relay Pod B reclaims `E1` after the 60s lease expires (`fencing_token = 2`), Pod A's delayed Phase 3 update (`WHERE id = :id AND fencing_token = 1`) updates **0 rows** and cannot overwrite Pod B's newer state.

---

### 3. How to Retry Database Issues on the Outbox Table

#### A. Application Write Path (Inserting Business Row + Outbox Row)
Classify PostgreSQL/MySQL `SQLState` codes carefully before retrying:

| SQLState / Error Class | Root Cause | Exact Retry Policy |
|:---|:---|:---|
| **`40001`** (Serialization Failure)<br/>**`40P01`** (Deadlock Detected) | Concurrent write contention on business or outbox table | **Retry the entire `@Transactional` unit** up to 3 times with short jittered backoff (`50ms -> 150ms -> 400ms`). |
| **`08xxx`** (Connection Exception)<br/>**`57P01`** (Admin Shutdown / RDS Failover)<br/>**`53300`** (Too Many Connections) | Transient DB failover or network blip | **Bounded retry with exponential backoff + full jitter** (max 3 retries, total budget `< 2s`), guarded by a **Resilience4j Circuit Breaker** so caller threads fail fast with HTTP `503 Retry-After` instead of piling up. |
| **`23505`** (Unique Violation on `idempotency_key`) | Client retried after a previous commit succeeded (HTTP response dropped) | **DO NOT retry!** Catch `DataIntegrityViolationException`, load the already-committed order by `idempotency_key`, and return HTTP `200/201` idempotently. |
| **`22xxx` / `23502`** (Invalid JSON / NOT NULL) | Application bug or malformed payload | **Never retry.** Fail fast with HTTP `400/500` and alert engineering. |

#### B. Relay Polling Path (DB Reads & Status Updates)
1. **Exponential Backoff with Full Jitter (`next_retry_at`)**:
   - Never hot-loop a failing row every 500ms. Compute:
     $$\text{delay} = \text{random}\left(0,\; \min\left(\text{maxDelay},\; \text{baseDelay} \times 2^{\text{retryCount}}\right)\right)$$
   - Example progression: `1s` $\to$ `2s` $\to$ `4s` $\to$ `8s` $\to$ `16s` $\to$ capped at `5m`.
2. **Database Circuit Breaker on the Poller**:
   - Wrap Phase 1 (`claimBatch`) in a Resilience4j `@CircuitBreaker(name = "outboxDb")`. If PostgreSQL is in the middle of a 20-second Multi-AZ failover, the circuit trips `OPEN` after 5 consecutive connection failures and stops hammering the recovering primary with useless `SELECT ... FOR UPDATE` storms until `HALF_OPEN` probes succeed.
3. **Dead-Letter Quarantine (`status = 'DEAD_LETTER'`)**:
   - Once `retry_count >= 10` (e.g., payload exceeds Kafka's `max.message.bytes` or target topic ACL is missing), transition `status = 'DEAD_LETTER'`, persist `last_error`, emit a P1 metric alert, and **keep processing healthy events** so one poison pill never stalls the outbox.

---

### 4. What to Do When Kafka Succeeds, But Updating `outbox_events` Status Fails

This is the single most common production question about the Polling Outbox:

> *"Relay published `event_id = E42` to Kafka and received `RecordMetadata` (broker ACK). One millisecond later, PostgreSQL fails over or drops the connection, so `UPDATE outbox_events SET status = 'PUBLISHED'` throws `TransientDataAccessException`. What happens now?"*

You cannot "un-publish" a committed Kafka record. Instead, handle it with **four layered production defenses**:

#### Layer 1 — Immediate Bounded In-Memory Retry (`REQUIRES_NEW` Fresh Connection)
For transient 1–3 second DB blips, deadlocks, or connection-pool stale sockets, **immediately retry the lightweight single-row status update 3–5 times** with jittered backoff (`100ms`, `300ms`, `800ms`, `1500ms`) in its own fresh `TransactionTemplate` call:
- **Zero duplicate Kafka messages** if the DB blip recovers within ~2–3 seconds!

#### Layer 2 — Pending-ACK Reconciliation Buffer (Preventing Duplicates Across 10–30s DB Failovers)
If Layer 1 exhausts its 3–5 fast retries because the DB is undergoing a 25-second RDS Multi-AZ failover:
- Enqueue `(eventId, fencingToken)` into a **bounded in-memory `ConcurrentHashMap` / `LinkedBlockingQueue`** (or a lightweight Redis set `outbox:pending_acks` with 5-minute TTL).
- A background `PendingAckFlusher` wakes up every 2 seconds and executes a single batched `UPDATE outbox_events SET status = 'PUBLISHED', published_at = now() WHERE id = :id AND fencing_token = :token` as soon as the DB comes back online.
- If the DB recovers before the 60-second lease expires, **every single already-published event is marked `PUBLISHED` cleanly with zero duplicate Kafka publishes!**

#### Layer 3 — Graceful At-Least-Once Lease Replay + Mandatory Consumer Transactional Inbox
What if the **relay pod itself is `SIGKILL`ed / OOMKilled** 1ms after Kafka ACK (destroying any in-memory pending-ACK buffer) OR the DB outage lasts 5 minutes (longer than the 60s lease)?
- The row's `lease_expires_at` expires $\to$ a healthy relay pod reclaims the row (`fencing_token` increments), re-publishes the **exact same `event_id` header** to Kafka, and updates `status = 'PUBLISHED'`.
- Because downstream consumers enforce the **Transactional Inbox Pattern** (`INSERT INTO processed_events (event_id) VALUES (:eventId) ON CONFLICT DO NOTHING` inside the same local ACID transaction as the consumer's business update), the duplicate Kafka message is **deterministically dropped in $O(\log N)$ index time** with zero double-charging or duplicate side effects!

#### Layer 4 — Structural Elimination via Debezium WAL CDC (No DB Status Update At All!)
If your system runs >1,000 events/sec or strict latency SLOs, **Debezium CDC eliminates the post-publish DB status update failure mode completely**:
- Debezium reads the PostgreSQL WAL (`pgoutput`) and publishes to Kafka.
- It **never executes `UPDATE outbox_events SET status = 'PUBLISHED'` back against PostgreSQL**.
- Instead, Kafka Connect commits the PostgreSQL WAL **LSN offset** directly to Kafka's internal `__connect_offsets` topic.
- Even better: the application can `INSERT` into `outbox_events` and immediately `DELETE` the row inside the **exact same local DB transaction** (PostgreSQL still writes the `INSERT` record into the WAL for Debezium to stream, while the physical `outbox_events` table stays at **0 rows** with zero `VACUUM` bloat!).

---

### 5. Production Java 21 LTS Implementation: 3-Phase Resilient Relay + Pending-ACK Flusher + Consumer Inbox

```java
package com.knowledge.systemdesign.outbox;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;

import org.apache.kafka.clients.producer.ProducerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Production 3-Phase Claim-Publish-Ack Outbox Relay:
 * 1. Short DB TX claims batch via SKIP LOCKED + lease_expires_at + fencing_token (<5ms).
 * 2. Kafka publish runs OUTSIDE any DB transaction (zero HikariCP connection holding).
 * 3. Fenced DB ACK retries transiently with jitter; falls back to PendingAckBuffer on DB outage;
 *    lease expiry + consumer Transactional Inbox guarantee zero lost events on pod crash.
 */
@Component
public final class ResilientOutboxRelay {

    private static final Logger log = LoggerFactory.getLogger(ResilientOutboxRelay.class);
    private static final int BATCH_SIZE = 100;
    private static final int MAX_KAFKA_RETRIES = 10;
    private static final int MAX_ACK_DB_RETRIES = 4;
    private static final int MAX_PENDING_ACK_BUFFER = 10_000;

    private final OutboxLeaseRepository outboxRepo;
    private final TransactionTemplate txTemplate;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final String workerId = "relay-" + UUID.randomUUID().toString().substring(0, 8);

    // Layer 2: Bounded Pending-ACK buffer for events published to Kafka when DB ACK failed
    private final Map<UUID, Long> pendingDbAcks = new ConcurrentHashMap<>();

    public ResilientOutboxRelay(
            OutboxLeaseRepository outboxRepo,
            TransactionTemplate txTemplate,
            KafkaTemplate<String, String> kafkaTemplate) {
        this.outboxRepo = Objects.requireNonNull(outboxRepo);
        this.txTemplate = Objects.requireNonNull(txTemplate);
        this.kafkaTemplate = Objects.requireNonNull(kafkaTemplate);
    }

    @Scheduled(fixedDelay = 300)
    public void pollAndRelay() {
        // First flush any buffered ACKs from a recent DB failover before claiming new work
        flushPendingDbAcks();

        // PHASE 1: Short atomic lease claim (releases DB connection in <5ms)
        List<ClaimedOutboxEvent> batch;
        try {
            batch = txTemplate.execute(status -> outboxRepo.claimBatch(workerId, BATCH_SIZE));
        } catch (DataAccessException dbEx) {
            log.warn("Outbox DB unavailable during Phase 1 claim (backoff next tick): {}", dbEx.getMessage());
            return;
        }

        if (batch == null || batch.isEmpty()) {
            return;
        }

        // PHASE 2: Publish to Kafka with ZERO DB transactions or row locks held
        for (ClaimedOutboxEvent event : batch) {
            try {
                ProducerRecord<String, String> record = new ProducerRecord<>(
                        event.topic(),
                        event.partitionKey(),
                        event.payload()
                );
                // Attach immutable event_id header for downstream Transactional Inbox deduplication
                record.headers().add("event_id", event.id().toString().getBytes(StandardCharsets.UTF_8));
                record.headers().add("event_type", event.eventType().getBytes(StandardCharsets.UTF_8));

                kafkaTemplate.send(record).get(5, TimeUnit.SECONDS);

                // PHASE 3: Kafka ACK succeeded -> update outbox status with fenced retry
                ackPublishedWithRetry(event.id(), event.fencingToken());

            } catch (Exception kafkaEx) {
                log.error("Kafka publish failed for outbox event {} (attempt {}): {}",
                        event.id(), event.retryCount() + 1, kafkaEx.getMessage());
                scheduleBackoffOrDeadLetter(event, kafkaEx.getMessage());
            }
        }
    }

    private void ackPublishedWithRetry(UUID eventId, long fencingToken) {
        long baseBackoffMs = 100L;
        for (int attempt = 1; attempt <= MAX_ACK_DB_RETRIES; attempt++) {
            try {
                Integer updated = txTemplate.execute(
                        status -> outboxRepo.markPublishedFenced(eventId, fencingToken));
                if (updated != null && updated == 0) {
                    log.warn("Fencing token {} rejected for event {} — another relay already reclaimed it",
                            fencingToken, eventId);
                }
                return;
            } catch (DataAccessException dbEx) {
                log.warn("Post-publish DB ACK failed for event {} (attempt {}/{}): {}",
                        eventId, attempt, MAX_ACK_DB_RETRIES, dbEx.getMessage());
                if (attempt < MAX_ACK_DB_RETRIES) {
                    sleepWithFullJitter(baseBackoffMs << (attempt - 1));
                }
            }
        }

        // Layer 2 fallback: DB is still down after fast retries; buffer ACK to avoid duplicate publish
        if (pendingDbAcks.size() < MAX_PENDING_ACK_BUFFER) {
            pendingDbAcks.put(eventId, fencingToken);
            log.warn("Buffered event {} (fence={}) in Pending-ACK reconciler; will flush when DB recovers",
                    eventId, fencingToken);
        } else {
            // Buffer full: rely safely on Layer 3 (60s lease expiry + consumer idempotency)
            log.error("Pending-ACK buffer full! Event {} will replay via lease expiry after DB recovery", eventId);
        }
    }

    @Scheduled(fixedDelay = 2_000)
    public void flushPendingDbAcks() {
        if (pendingDbAcks.isEmpty()) {
            return;
        }
        for (Map.Entry<UUID, Long> entry : pendingDbAcks.entrySet()) {
            try {
                txTemplate.executeWithoutResult(
                        status -> outboxRepo.markPublishedFenced(entry.getKey(), entry.getValue()));
                pendingDbAcks.remove(entry.getKey(), entry.getValue());
            } catch (DataAccessException dbEx) {
                // DB still recovering — stop flushing this cycle and retry in 2s
                log.debug("DB still unavailable while flushing {} pending ACKs", pendingDbAcks.size());
                return;
            }
        }
    }

    private void scheduleBackoffOrDeadLetter(ClaimedOutboxEvent event, String errorMsg) {
        int nextAttempt = event.retryCount() + 1;
        try {
            if (nextAttempt >= MAX_KAFKA_RETRIES) {
                txTemplate.executeWithoutResult(
                        status -> outboxRepo.markDeadLetterFenced(event.id(), event.fencingToken(), errorMsg));
            } else {
                long capSeconds = Math.min(300L, 1L << Math.min(nextAttempt, 8));
                long jitterSeconds = ThreadLocalRandom.current().nextLong(1, capSeconds + 1);
                Instant nextRetryAt = Instant.now().plus(Duration.ofSeconds(jitterSeconds));
                txTemplate.executeWithoutResult(
                        status -> outboxRepo.markRetryPendingFenced(
                                event.id(), event.fencingToken(), nextAttempt, nextRetryAt, errorMsg));
            }
        } catch (DataAccessException dbEx) {
            // If DB is also down, the 60s lease will expire naturally and reclaim the row later
            log.error("Failed to record backoff for event {}; falling back to lease expiry: {}",
                    event.id(), dbEx.getMessage());
        }
    }

    private static void sleepWithFullJitter(long maxMillis) {
        long sleepMs = ThreadLocalRandom.current().nextLong(20L, Math.max(21L, maxMillis + 1));
        try {
            Thread.sleep(sleepMs);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }
    }

    public record ClaimedOutboxEvent(
            UUID id, String topic, String partitionKey, String eventType,
            String payload, int retryCount, long fencingToken) {}

    public interface OutboxLeaseRepository {
        List<ClaimedOutboxEvent> claimBatch(String workerId, int limit);
        int markPublishedFenced(UUID id, long fencingToken);
        int markRetryPendingFenced(UUID id, long fencingToken, int retryCount, Instant nextRetryAt, String error);
        int markDeadLetterFenced(UUID id, long fencingToken, String error);
    }
}
```

**Downstream Consumer Transactional Inbox (Guarantees Effectively-Once Processing During Replay):**

```sql
-- Consumer database: atomic deduplication + business mutation in ONE local transaction
BEGIN;

INSERT INTO processed_events (event_id, processed_at)
VALUES (:eventId, now())
ON CONFLICT (event_id) DO NOTHING
RETURNING event_id;

-- If 0 rows returned: duplicate from post-publish ACK failure -> COMMIT & skip business logic!
-- If 1 row returned: execute business state mutation (e.g., reserve inventory / credit ledger) and COMMIT.
```

### 6. Architectural Trade-Off Matrix: Handling Post-Publish ACK Failures

| Recovery Architecture | HikariCP Pool Safety | Duplicate Rate on DB Failover | Operational Complexity | When to Choose |
|:---|:---|:---|:---|:---|
| **Naive `@Transactional` Polling** | ❌ **Unsafe** (holds DB lock across Kafka I/O) | High (entire batch rolls back on 1 failure) | Very Low | Prototypes / dev only — **never in production**. |
| **3-Phase Claim-Publish-Ack + Pending-ACK Flusher + Consumer Inbox** | ✅ **Safe** (`<5ms` short DB TXs) | **Near-Zero** on transient DB blips; safe at-least-once on pod crash | Low–Medium (pure app + SQL, zero extra infra) | `< 1,000 events/sec`, teams without Kafka Connect / Debezium ops. |
| **Debezium WAL CDC + Consumer Inbox** | ✅ **Optimal** (zero polling & zero DB status `UPDATE`!) | Near-Zero (LSN offset tracked inside Kafka Connect) | Medium–High (requires `wal_level=logical` + Kafka Connect cluster) | `> 1,000 events/sec`, strict `< 50ms` latency, zero DB write-back overhead. |

---

### 7. Worked Case Study: Async S3 File Upload & Processing (`QUEUED → PROCESSING → COMPLETED`)

A classic production scenario where the Transactional Outbox shines—and where naive implementations silently corrupt state—is **asynchronous S3 file processing**:

> **Scenario**: A user uploads a file to S3. Once S3 confirms the upload, we save `file_jobs.status = 'QUEUED'` and return `202 Accepted`. Next, we publish a Kafka event (`FileUploaded`) to notify the user and trigger async processing (`PROCESSING → COMPLETED`).
> 1. *What if Kafka publish fails?*
> 2. *What if Kafka publish succeeds AND the downstream worker already finishes processing the file (`COMPLETED`), while our relay's DB update to `PROCESSING` fails or arrives late?*

#### Step 1: S3 Upload + Atomic Local DB Transaction (`QUEUED`)
Upload the binary object to S3 **first** (ideally via an S3 Presigned URL + `HeadObject` ETag check). If the subsequent DB commit fails, an **S3 Lifecycle Rule** (expiring unreferenced prefixes after 24h) cleans up orphaned objects automatically.

Once S3 confirms durability, commit **both** the business job row and the outbox event in **one local ACID transaction**:

```sql
BEGIN;
  INSERT INTO file_jobs (id, s3_key, status, version)
  VALUES (:fileId, :s3Key, 'QUEUED', 1);

  INSERT INTO outbox_events (id, aggregate_type, aggregate_id, event_type, topic, partition_key, payload, status, idempotency_key)
  VALUES (:eventId, 'FileJob', :fileId, 'FileUploaded', 'file-events', :fileId, :payloadJson, 'PENDING', 'file-uploaded:' || :fileId);
COMMIT;
```

#### Step 2: Spot the State-Ownership Trap (Why the Relay Must NOT Set `PROCESSING`)
If the **Outbox Relay** attempts to update `file_jobs.status = 'PROCESSING'` *after* publishing to Kafka, you introduce a fatal **state-regression race condition** even on a healthy database:
1. `t = 0ms`: Relay publishes `FileUploaded` to Kafka.
2. `t = 25ms`: Fast downstream worker consumes `FileUploaded`, processes the S3 file, and updates `file_jobs.status = 'COMPLETED'`.
3. `t = 40ms`: Relay's delayed DB update runs `UPDATE file_jobs SET status = 'PROCESSING' WHERE id = :fileId` — **silently rolling a `COMPLETED` file back to `PROCESSING` forever!**

#### Step 3: The 3 Non-Negotiable Production Rules
1. **Decouple Outbox State from Business Job State**:
   - The **Outbox Relay ONLY updates `outbox_events.status` (`PENDING` → `IN_PROGRESS` → `PUBLISHED`)**. Publishing to Kafka only means the event is enqueued, *not* that a worker has begun processing it.
   - The **Downstream Worker owns `file_jobs.status` (`QUEUED` → `PROCESSING` → `COMPLETED` / `FAILED`)**.
2. **Enforce a Monotonic State Machine in SQL (Guarded Predecessor `WHERE` Clause)**:
   - Every transition explicitly checks allowed predecessor states so a late or retried update can **never regress a terminal state**:

```sql
-- Optional: If the relay marks 'DISPATCHED', strictly guard on 'QUEUED'
UPDATE file_jobs
SET status = 'DISPATCHED', updated_at = now()
WHERE id = :fileId
  AND status = 'QUEUED';
-- If downstream ALREADY moved the job to PROCESSING or COMPLETED, 0 rows are updated!

-- Downstream Worker starts processing:
UPDATE file_jobs
SET status = 'PROCESSING', started_at = now()
WHERE id = :fileId
  AND status IN ('QUEUED', 'DISPATCHED');

-- Downstream Worker finishes processing:
UPDATE file_jobs
SET status = 'COMPLETED', finished_at = now()
WHERE id = :fileId
  AND status IN ('QUEUED', 'DISPATCHED', 'PROCESSING');
```

3. **Survive Post-Publish ACK Failure + Lease Replay via Consumer Transactional Inbox**:
   - If Kafka publish fails $\to$ `outbox_events` retries with jittered backoff until Kafka recovers (or quarantines to `DEAD_LETTER` after `MAX_RETRIES`).
   - If Kafka succeeds AND downstream already marked `COMPLETED`, while the relay's `UPDATE outbox_events SET status = 'PUBLISHED'` fails:
     1. Fast jittered ACK retry / Pending-ACK reconciler updates `outbox_events` once the DB recovers.
     2. If the relay pod crashes (`SIGKILL`), lease expiry replays `FileUploaded` with the **exact same `event_id`**.
     3. The downstream worker executes `INSERT INTO processed_events (event_id) VALUES (:eventId) ON CONFLICT DO NOTHING RETURNING event_id` (and/or checks `WHERE status IN ('QUEUED', 'DISPATCHED')`) $\to$ gets **0 rows**, skips duplicate S3 processing and duplicate user notifications, and commits its Kafka offset safely.

---

## Ordering Semantics & Partitioning

Kafka preserves order **within a partition**. To ensure ordered delivery for a specific entity (e.g., all events for `orderId=123` arrive in order), all events for that entity must go to the **same partition**:

```java
// Use orderId as the partition key — Kafka hashes it to a consistent partition
OutboxEvent event = OutboxEvent.builder()
    .topic("order-events")
    .partitionKey(order.getId().toString()) // ← critical for ordering
    .payload(serialize(new OrderPlaced(order)))
    .build();
```

**What happens without a partition key:**
- Events for the same order may land on different Kafka partitions
- Consumers may process `OrderCancelled` before `OrderPlaced` (out of order)
- Downstream services corrupt state

**What to use as partition key:**

| Entity Type | Partition Key | Why |
|:---|:---|:---|
| Order events | `orderId` | All order lifecycle events stay in order |
| Customer events | `customerId` | Customer profile/preference events stay ordered |
| Payment events | `paymentId` or `orderId` | Depends on consumer needs |
| Inventory events | `productId` | Stock changes per product stay ordered |

---

## Cleanup & Table Management

The `outbox_events` table grows indefinitely without a cleanup strategy. Published events are safe to delete after a retention window.

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class OutboxCleanupJob {

    private final OutboxRepository outboxRepository;

    @Scheduled(cron = "0 0 2 * * ?") // 2am daily
    @Transactional
    public void cleanupPublishedEvents() {
        Instant cutoff = Instant.now().minus(Duration.ofDays(7)); // keep 7 days
        int deleted = outboxRepository.deletePublishedBefore(cutoff);
        log.info("Cleaned up {} published outbox events older than {}", deleted, cutoff);
    }

    @Scheduled(cron = "0 */30 * * * ?") // every 30 minutes
    @Transactional
    public void retryFailedEvents() {
        // Re-queue events that have been PENDING for too long (relay may have died)
        Instant staleThreshold = Instant.now().minus(Duration.ofMinutes(5));
        List<OutboxEvent> staleEvents = outboxRepository
            .findStalePendingEvents(staleThreshold, 50);

        log.warn("Found {} stale outbox events, re-queuing", staleEvents.size());
        // They will be picked up by the next polling cycle
    }
}
```

```java
public interface OutboxRepository extends JpaRepository<OutboxEvent, UUID> {

    @Modifying
    @Query("DELETE FROM OutboxEvent e WHERE e.status = 'PUBLISHED' AND e.publishedAt < :cutoff")
    int deletePublishedBefore(@Param("cutoff") Instant cutoff);

    @Query("SELECT e FROM OutboxEvent e WHERE e.status = 'PENDING' AND e.createdAt < :threshold ORDER BY e.createdAt ASC")
    List<OutboxEvent> findStalePendingEvents(@Param("threshold") Instant threshold, Pageable page);
}
```

---

## Production Observability

```java
@Component
@RequiredArgsConstructor
public class OutboxMetrics {

    private final MeterRegistry registry;

    public void recordPublished(String eventType) {
        registry.counter("outbox.published", "event_type", eventType).increment();
    }

    public void recordFailure(String eventType) {
        registry.counter("outbox.publish_failed", "event_type", eventType).increment();
    }

    public void recordBatchDuration(long durationMs) {
        registry.timer("outbox.relay.batch_duration").record(durationMs, TimeUnit.MILLISECONDS);
    }

    // Called from a scheduled job
    public void recordPendingCount() {
        long count = outboxRepository.countByStatus("PENDING");
        registry.gauge("outbox.pending_count", count);
    }
}
```

**Key dashboards and alerts:**

| Metric | Alert Threshold | Meaning |
|:---|:---|:---|
| `outbox.pending_count` | > 1,000 | Relay is falling behind or has died |
| `outbox.pending_count` stable > 5 min | Any | Relay is stuck — check logs |
| `outbox.publish_failed` rate | > 0 for > 2 min | Kafka broker connectivity issue |
| `outbox.relay.batch_duration` p99 | > 2s | Kafka or DB performance degradation |
| Events with `retry_count` > 5 | Any | Persistent failure — check event payload and topic config |

---

## Summary Comparison: 2PC vs Saga vs Outbox

| Pattern | Consistency | Availability | Latency | Complexity | Best For |
|:---|:---|:---|:---|:---|:---|
| **2PC (XA)** | Strong (ACID) | Low (blocking) | High (sync round trips) | Medium | Collocated JDBC resources, < 500 TPS |
| **Saga (Orchestration)** | Eventual | High | Low (async) | High | Complex multi-service workflows with compensation |
| **Saga (Choreography)** | Eventual | High | Low (async) | Medium | Simple linear event chains between loosely coupled services |
| **Transactional Outbox** | Eventual (at-least-once) | High | Very low (relay async) | Low–Medium | Reliable event publishing from any service |

:::tip[The Outbox is not an alternative to Sagas — it's complementary]
Use the **Outbox Pattern inside each Saga step** to make event publishing within each step reliable. The Outbox solves "how do I reliably publish an event?". The Saga solves "how do I coordinate a multi-step workflow?". They work together.
:::

---

## 🧠 Senior/Staff Interview Playbook: How to Ace Transactional Outbox & Failure Recovery Interviews

### 1. The Senior Framing Strategy (First 60 Seconds)

When asked *"How do you guarantee atomic database updates and Kafka event publishing—and what happens when the DB or Kafka fails?"*, frame your answer around four physical invariants upfront:

1. **State the Fundamental Impossibility Theorem (FLP / No Free 2PC)**:
   - Open with: *"PostgreSQL and Kafka are independent distributed storage engines without a shared commit log. Rather than blocking availability with XA Two-Phase Commit, we collapse the dual-write into a **single local ACID transaction** (`business_table` + `outbox_events`) and accept **at-least-once delivery** paired with **idempotent consumers (Transactional Inbox)** to achieve effectively-once business semantics."*
2. **Never Hold DB Transactions Across Network I/O (Little's Law $L = \lambda \times W$)**:
   - Explicitly reject naive `@Transactional` polling relays: *"Holding a HikariCP connection and `FOR UPDATE SKIP LOCKED` locks open while synchronously waiting on Kafka stalls the pool and pins PostgreSQL's MVCC `xmin` horizon. In a polling relay, we always use **3-Phase Claim-Publish-Ack** with short `<5ms` transactions, a `lease_expires_at` timeout, and monotonic `fencing_token` guards."*
3. **Proactively Call Out the Post-Publish ACK Failure Window**:
   - Before the interviewer asks, state: *"Even with an outbox, Kafka can ACK a message right before the DB status update fails. We minimize duplicates via **bounded jittered ACK retries + a Pending-ACK reconciler**, survive pod `SIGKILL` via **lease expiry replay**, and guarantee business correctness via **consumer-side `INSERT ... ON CONFLICT DO NOTHING`**—or eliminate DB write-backs completely using **Debezium WAL CDC**."*
4. **Day-2 Operational Realism**:
   - Call out `outbox_events` table bloat (partial index `WHERE status IN ('PENDING', 'IN_PROGRESS')` + range partitioning / `DROP PARTITION` instead of `DELETE`), PostgreSQL WAL disk exhaustion (`max_slot_wal_keep_size` for Debezium), and `DEAD_LETTER` quarantine alerts so one poison pill never causes head-of-line blocking.

---

### 2. Classic Interviewer Traps & Principal Rebuttals

#### Trap 1: "Your relay published the event to Kafka and got a broker ACK, but then PostgreSQL failed over so `UPDATE outbox_events SET status = 'PUBLISHED'` threw a connection error. Do we roll back Kafka?"
* **Junior/Mid Answer:** *"We should wrap Kafka and PostgreSQL in a distributed XA transaction, or send a compensating 'cancel' event to Kafka whenever the DB update fails."*
* **Principal Rebuttal:**
  > *"You cannot roll back an already-committed Kafka offset, and sending a fake 'cancel' event creates out-of-order state corruption for downstream consumers. Instead, we treat this as a standard **Post-Publish ACK Failure** with three defenses: (1) Retry the tiny single-row fenced `UPDATE` 3–4 times with jittered backoff (`REQUIRES_NEW`) to absorb 1–3s DB failovers with zero duplicates; (2) Buffer `(event_id, fencing_token)` in a bounded Pending-ACK flusher so it marks `PUBLISHED` the moment the DB recovers; and (3) Rely on `lease_expires_at` replay + mandatory downstream **Transactional Inbox deduplication** (`INSERT INTO processed_events (event_id) ON CONFLICT DO NOTHING`) if the relay pod crashes completely. At high scale (`>1k events/s`), **Debezium WAL CDC** eliminates the DB status write-back altogether because the LSN offset is committed inside Kafka Connect."*

#### Trap 2: "To prevent duplicate publishing in our polling relay, let's put `@Transactional` on the polling method so `SELECT ... FOR UPDATE SKIP LOCKED`, `kafkaTemplate.send().get()`, and `UPDATE status = 'PUBLISHED'` all happen in one atomic DB transaction!"
* **Junior/Mid Answer:** *"Yes! Keeping them in one `@Transactional` method guarantees no other relay pod touches those rows until Kafka finishes and the status is updated."*
* **Principal Rebuttal:**
  > *"Holding a database transaction open across external Kafka network I/O is a textbook production outage trigger. First, by Little's Law, if Kafka latency spikes to 2 seconds across a 100-row batch, a single relay thread holds a HikariCP connection and row locks for 200 seconds—starving user-facing API requests. Second, an open transaction pins PostgreSQL's MVCC `xmin` horizon, blocking `autovacuum` table-wide. Third, if event #99 fails and rolls back the transaction, events #1–#98—already live in Kafka—all revert to `PENDING` and duplicate en masse. Always decouple into **Phase 1: Short `<5ms` Lease Claim TX (`IN_PROGRESS` + `fencing_token`) $\to$ Phase 2: Kafka Publish (No DB TX) $\to$ Phase 3: Short Fenced ACK TX**."*

#### Trap 3: "When our `outbox_events` table hits a transient database error during `INSERT` (from a client API call) or during relay polling, let's just retry immediately in a `while` loop until PostgreSQL responds!"
* **Junior/Mid Answer:** *"Since the DB failover usually finishes in 10 seconds, an immediate retry loop guarantees zero failed requests."*
* **Principal Rebuttal:**
  > *"Tight retry loops without error classification, jitter, or circuit breaking trigger a **Metastable Retry Storm** that prevents PostgreSQL from ever recovering after a failover. You must inspect the `SQLState`: retry transient codes (`40001`, `40P01`, `08xxx`, `57P01`) using **bounded exponential backoff with full jitter** behind a **Resilience4j Circuit Breaker**; treat `23505` (unique constraint on `idempotency_key`) as an **idempotent success** (return the already-committed entity without retrying); and quarantine permanent failures (`retry_count >= MAX`) to `status = 'DEAD_LETTER'` so poison pills never block healthy aggregates."*

#### Trap 4: "If we use Debezium CDC on `outbox_events`, won't the table still grow to 500 GB and require massive `DELETE` cleanup jobs that bloat PostgreSQL?"
* **Junior/Mid Answer:** *"We can run a nightly `DELETE FROM outbox_events WHERE created_at < now() - interval '7 days'` cron job to keep the table small."*
* **Principal Rebuttal:**
  > *"With Debezium WAL CDC, you don't even need to retain rows in `outbox_events`! Because PostgreSQL writes every `INSERT` into the Write-Ahead Log regardless of subsequent deletes, your application can `INSERT` the outbox event and immediately `DELETE` it **within the exact same local transaction** (Debezium's `EventRouter` SMT ignores tombstones/deletes and streams the `INSERT` payload from the WAL). The physical `outbox_events` table stays at **zero rows** permanently! If you must retain an audit trail (e.g., for polling or compliance), use **PostgreSQL daily time-partitioned tables** and drop old partitions instantaneously via `DROP TABLE outbox_events_2026_11_01` instead of running `VACUUM`-heavy `DELETE` scans."*

---

### 3. Quick Reference — Mid-Level vs. Principal Candidate Cheat Sheet

| Outbox Failure Scenario | Mid-Level Candidate Says (L4) | Principal Candidate Demonstrates (L5+ / Staff) |
|:---|:---|:---|
| **Polling Relay Architecture** | *"Put `@Transactional` around `SKIP LOCKED`, `kafka.send()`, and `save()`."* | *"Use **3-Phase Claim-Publish-Ack** (`<5ms` short TXs + `lease_expires_at` + monotonic `fencing_token`) so zero DB locks/connections are held during Kafka I/O."* |
| **Kafka OK, DB Status Update Fails** | *"Catch the exception and log it; maybe run a manual SQL script later."* | *"Layer 1: Jittered `REQUIRES_NEW` ACK retry; Layer 2: Pending-ACK reconciler buffer; Layer 3: Lease-expiry replay + Consumer **Transactional Inbox** (`ON CONFLICT DO NOTHING`); Layer 4: Eliminate write-back with **Debezium CDC**."* |
| **DB Deadlock / Failover Retries** | *"Add `@Retryable(maxAttempts = 5)` on all exceptions."* | *"Classify `SQLState` (`40001/40P01/57P01` $\to$ jittered backoff + DB Circuit Breaker; `23505` $\to$ idempotent return; poison pill $\to$ `DEAD_LETTER` quarantine)."* |
| **Outbox Table Growth & Bloat** | *"Run a daily `DELETE FROM outbox_events WHERE status = 'PUBLISHED'`."* | *"Use partial index `WHERE status IN ('PENDING', 'IN_PROGRESS')` + **time-based table partitioning (`DROP PARTITION`)**, or **INSERT+DELETE in one TX** under Debezium CDC."* |

---

## Interview Questions

### Q: The Transactional Outbox guarantees at-least-once delivery. How do downstream consumers handle duplicates?

**A:** Consumers must be **idempotent**. For each event, the consumer checks if it has already been processed using the event's `id` or a business-level idempotency key. Common approaches:
1. `INSERT INTO processed_events (event_id) ... ON CONFLICT DO NOTHING` — DB-backed dedup.
2. `Redis SETNX event:{id}` with a TTL — fast path check before processing.
3. Upsert the target entity using the aggregate ID — makes the operation naturally idempotent.

### Q: What is a replication slot in PostgreSQL and why does Debezium need it?

**A:** A **replication slot** is a cursor in PostgreSQL's WAL stream. It tracks how far a consumer has read, and prevents PostgreSQL from discarding WAL segments that the consumer hasn't yet processed. Debezium creates a slot and maintains its position (LSN — Log Sequence Number). If Debezium restarts, it resumes reading from its last LSN, guaranteeing no events are missed. The risk: if Debezium falls behind, PostgreSQL cannot discard old WAL — disk usage grows. Always monitor `pg_replication_slots` lag in production.

### Q: What happens if the relay publishes an event to Kafka but then crashes before marking it as `PUBLISHED` in the database?

**A:** On restart, the relay will find the event still in `PENDING` state and publish it again. Kafka will receive a **duplicate**. This is why both the relay (via `SKIP LOCKED`) and downstream consumers (via idempotency keys) must be designed for at-least-once semantics. The event's `id` should be used as the Kafka message key or included in the payload as the idempotency key.

### Q: How would you handle outbox events for multi-tenant systems where each tenant has its own schema?

**A:** Options:
1. **Single shared outbox table** with a `tenant_id` column — simple but requires partitioning strategy.
2. **Per-tenant outbox table** with dynamic table routing in the relay — flexible but complex.
3. **Per-tenant Debezium connectors** using `table.include.list` per schema — fully isolated but operationally expensive at scale.

Most teams use option 1 with `tenant_id` as part of the partition key for Kafka, ensuring per-tenant ordering.

---

## See Also

- [Saga Pattern](./saga-pattern.md) — Use Outbox inside each Saga step for reliable event publishing
- [Two-Phase Commit (2PC)](./two-phase-commit.md) — Synchronous alternative to understand the trade-offs
- [Change Data Capture (CDC)](./cdc.md) — The broader CDC pattern that Debezium implements
- [Dead Letter Queue (DLQ)](./dead-letter-queue.md) — Handling permanently failed relay events
- [Scaling Reads](./scaling-reads.md) — How outbox pattern / event-driven invalidation keeps caches consistent with database state
- [Scaling Writes](./scaling-writes.md) — Using async write pipelines and transactional deduplication to scale ingestion

