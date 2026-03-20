---
id: exactly-once-vs-dedup
title: Exactly-Once vs Deduplication
sidebar_label: Exactly-Once vs Dedup
description: "Deep comparison of Kafka exactly-once semantics and application-level deduplication strategies."
tags: [kafka, exactly-once, deduplication, event-driven]
---

# Exactly-Once vs Deduplication — Deep Dive

## TL;DR

- **Exactly-once (EOS)** = *Kafka guarantees no duplicate processing inside Kafka ecosystem*
- **Deduplication** = *Application guarantees idempotency across system boundaries*

👉 In real systems: **you almost always need BOTH**

---

# 1. The Core Problem

Distributed systems fundamentally cannot guarantee:

- No retries
- No duplicates
- No partial failures

So you must choose how to handle:

```

Process → Fail → Retry → Duplicate?

```

---

# 2. Exactly-Once Semantics (EOS)

## What It Actually Guarantees

With:

```properties
processing.guarantee=exactly_once_v2
```

Kafka ensures:

```
READ → PROCESS → WRITE → COMMIT OFFSET
         (ALL IN ONE TRANSACTION)
```

### Guarantees

* No duplicate output records in Kafka
* No lost records
* Offset + output atomicity

---

## Internal Flow

```
BEGIN TX
  → Consume records
  → Process
  → Write output topic
  → Write changelog (state store)
  → Commit offsets
END TX
```

👉 If crash happens:

* Transaction is aborted
* No partial writes

---

## What EOS Does NOT Solve ❗

### 1. External Side Effects

```java
process(order) {
    chargeCreditCard();  // external system
    sendKafkaEvent();
}
```

👉 If crash occurs after:

* `chargeCreditCard()` succeeds
* but before Kafka commit

→ Retry → **double charge**

---

### 2. Non-Transactional Systems

* REST APIs
* Databases (without XA)
* Email / notification systems

👉 EOS does not extend outside Kafka

---

## Key Insight

EOS = **exactly-once within Kafka boundary only**

---

# 3. Deduplication (Idempotency)

## What It Solves

Dedup ensures:

```
Same event processed multiple times → same result
```

---

## Common Strategy

### Idempotency Key

```json
{
  "eventId": "ORDER-123",
  "payload": {...}
}
```

### Flow

```
Check if eventId exists
    ↓
YES → skip
NO  → process + store eventId
```

---

## Implementation Options

### 1. Database (Strong Consistency)

```sql
INSERT INTO processed_events (event_id)
VALUES ('ORDER-123')
ON CONFLICT DO NOTHING;
```

👉 If insert fails → duplicate

---

### 2. Redis (Fast, Eventually Consistent)

```bash
SETNX event:ORDER-123 1
```

* Success → process
* Fail → duplicate

---

### 3. Kafka State Store (Streams)

```java
if (store.get(eventId) != null) {
    return; // duplicate
}
store.put(eventId, true);
```

---

## Trade-offs

| Method     | Pros               | Cons                    |
| ---------- | ------------------ | ----------------------- |
| DB         | Strong consistency | Latency, bottleneck     |
| Redis      | Fast               | Possible race condition |
| StateStore | Local, scalable    | Limited to stream scope |

---

# 4. EOS vs Dedup — Head-to-Head

| Aspect           | Exactly-Once (EOS)        | Deduplication            |
| ---------------- | ------------------------- | ------------------------ |
| Scope            | Kafka only                | Entire system            |
| Guarantees       | No duplicate Kafka writes | Idempotent processing    |
| External systems | ❌ Not covered             | ✅ Covered                |
| Performance      | Slower (transactions)     | Faster (depends on impl) |
| Complexity       | Medium                    | High (design required)   |
| Failure handling | Automatic rollback        | Manual logic             |

---

# 5. Real Production Patterns

## Pattern 1: EOS Only (Rare)

Use when:

* Only Kafka → Kafka pipeline
* No external side effects

```
Kafka → Streams → Kafka
```

---

## Pattern 2: Dedup Only

Use when:

* External system is source of truth

```
Kafka → Service → DB (idempotent)
```

---

## Pattern 3: EOS + Dedup (MOST COMMON ✅)

```
Kafka → Stream Processor (EOS)
            ↓
      External System (Dedup)
```

### Why BOTH?

* EOS protects Kafka pipeline
* Dedup protects external side effects

---

# 6. Failure Scenarios (Critical)

## Scenario A: Without Dedup

```
Process → Call API → Success
Crash before offset commit
Retry → Call API again ❌
```

---

## Scenario B: With Dedup

```
Process → Check ID → Not exist
Call API → Success
Store ID
Crash
Retry → Check ID → Skip ✅
```

---

# 7. Performance Trade-offs

## EOS Cost

* Transaction overhead
* Increased latency
* Lower throughput

## Dedup Cost

* Storage (event IDs)
* Lookup latency
* Cleanup (TTL)

---

# 8. Design Heuristics

### Use EOS when:

* Kafka → Kafka pipelines
* Need strict correctness
* No external side effects

---

### Use Dedup when:

* Calling external systems
* Handling retries
* Business requires idempotency

---

### Use BOTH when (default choice):

* Microservices architecture
* Event-driven workflows
* Financial / critical systems

---

# 9. Advanced Insight

## EOS ≠ Idempotency

* EOS = **delivery guarantee**
* Dedup = **business correctness guarantee**

---

## Dedup ≠ Free

You must handle:

* TTL cleanup
* Storage growth
* Key design (eventId uniqueness)

---

## Golden Rule

> "Exactly-once is a transport guarantee.
> Idempotency is a business guarantee."

---

# 10. Interview-Level Answer

**Q: When would you use deduplication if Kafka already supports exactly-once?**

> Exactly-once semantics only guarantee that records are processed once within Kafka itself. However, in real systems, processing often involves external side effects such as database updates or API calls, which are not covered by Kafka transactions. Deduplication ensures idempotency at the application level, preventing duplicate side effects even when retries occur. Therefore, deduplication is required whenever processing extends beyond Kafka.

---

# 11. Final Takeaway

```
EOS protects your PIPELINE
Dedup protects your BUSINESS
```

