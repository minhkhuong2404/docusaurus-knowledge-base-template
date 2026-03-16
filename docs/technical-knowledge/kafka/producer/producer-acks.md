---
id: producer-acks
title: Producer Acknowledgements (acks)
sidebar_label: Producer Acks
---

# Producer Acknowledgements (acks)

## What are Producer Acks?

The `acks` configuration controls **how many broker acknowledgements the producer requires before considering a send successful**. It directly trades off between throughput, latency, and durability.

---

## The Three Modes

### `acks=0` — Fire and Forget

```
Producer ──► Broker
             (no ack)
```

- Producer does **not wait** for any acknowledgement
- Highest throughput, lowest latency
- **No durability guarantee** — if the broker is down, message is lost silently
- Useful for: log aggregation, metrics, cases where occasional loss is acceptable

```java
props.put(ProducerConfig.ACKS_CONFIG, "0");
```

### `acks=1` — Leader ACK Only

```
Producer ──► Leader Broker
             (appended to leader log)
                  │
                  ▼
Producer ◄── ACK from Leader
```

- Wait for the leader to write to its local log
- **Leader may ACK and then crash before replication** → message lost
- Good middle ground for moderate durability requirements
- Default for most Kafka clients prior to 3.x

```java
props.put(ProducerConfig.ACKS_CONFIG, "1");
```

### `acks=all` (or `-1`) — Full ISR ACK

```
Producer ──► Leader Broker
             appended to leader
                  ↓ replicated to ISR followers
             ACK after all ISR members confirm
                  │
                  ▼
Producer ◄── ACK from Leader
```

- Wait for **all in-sync replicas** to acknowledge
- No data loss as long as at least one ISR member survives
- Highest latency (waits for slowest ISR member)
- **Required for exactly-once and zero data-loss scenarios**

```java
props.put(ProducerConfig.ACKS_CONFIG, "all");
```

---

## Acks Comparison Table

| Setting | Throughput | Latency | Durability | Use Case |
|---------|-----------|---------|------------|----------|
| `0` | Highest | Lowest | None | Metrics, non-critical logs |
| `1` | High | Low | Moderate | General use (loss possible) |
| `all` | Moderate | Higher | **Strongest** | Financial, critical events |

---

## Acks and `min.insync.replicas` Interaction

`acks=all` alone is not sufficient — the durability depends on how many replicas are in the ISR at write time:

```
acks=all  +  min.insync.replicas=1  →  Only leader must ack (same as acks=1 effectively)
acks=all  +  min.insync.replicas=2  →  At least 2 ISR replicas must ack (recommended)
acks=all  +  min.insync.replicas=3  →  All 3 replicas must ack (strictest)
```

**Recommended production configuration:**

```properties
# Producer
acks=all

# Topic or Broker
min.insync.replicas=2
replication.factor=3
```

This tolerates 1 broker failure while maintaining write availability.

---

## Acks Topology Diagram

```
acks=0:
  Producer → [Leader] → done (no ACK)

acks=1:
  Producer → [Leader ✓] → ACK
                ↓ (async, no wait)
           [Follower1] [Follower2]

acks=all:
  Producer → [Leader ✓] → waits...
                ↓ replicates
           [Follower1 ✓] [Follower2 ✓]
                          → ACK to Producer
```

---

## Spring Boot Configuration

```java
@Bean
public ProducerFactory<String, String> producerFactory() {
    Map<String, Object> props = new HashMap<>();
    props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
    props.put(ProducerConfig.ACKS_CONFIG, "all");
    props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
    props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
    return new DefaultKafkaProducerFactory<>(props);
}
```

Or via `application.yml`:
```yaml
spring:
  kafka:
    producer:
      acks: all
      retries: 2147483647
      properties:
        enable.idempotence: true
```

---

## The Safe Delivery Combination

For **at-least-once with no data loss**:

```java
props.put(ProducerConfig.ACKS_CONFIG, "all");
props.put(ProducerConfig.RETRIES_CONFIG, Integer.MAX_VALUE);
props.put(ProducerConfig.DELIVERY_TIMEOUT_MS_CONFIG, 120_000);
props.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, 5);
props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true); // upgrade to exactly-once
```

---

## Interview Questions — Producer Acks

**Q: What is the risk of `acks=1`?**

> With `acks=1`, the leader sends the ACK as soon as it writes to its local log, before replication. If the leader crashes immediately after, the message was acknowledged to the producer but not replicated — resulting in **data loss**. The new leader (elected from followers) will not have that message.

**Q: Does `acks=all` guarantee no data loss?**

> Nearly, but not entirely on its own. If `min.insync.replicas=1` and the topic has only one ISR member (the leader), then `acks=all` behaves like `acks=1`. For true no-data-loss, combine: `acks=all`, `min.insync.replicas=2`, `replication.factor=3`, `unclean.leader.election.enable=false`.

**Q: What happens to throughput with `acks=all`?**

> Throughput decreases slightly because the producer must wait for the slowest ISR member to replicate. However, with a healthy cluster (fast followers) and batching (`linger.ms`, `batch.size`), the throughput difference is often acceptable. Compression also helps offset this.

**Q: With `acks=0`, can retries help?**

> No. If the producer doesn't receive an ACK, it has no way to know whether the message was received or not — it simply moves on. `retries` config has no effect with `acks=0` because retries are triggered by failed ACKs, and no ACK is expected.

**Q: What error does a producer receive when the ISR drops below `min.insync.replicas`?**

> The producer receives `NotEnoughReplicasException` (or `NotEnoughReplicasAfterAppendException`). This is a retriable error — the producer will retry according to its retry configuration. If the ISR doesn't recover within `delivery.timeout.ms`, the produce call fails.
