---
id: kafka-overview
title: Kafka Architecture Overview
sidebar_label: Kafka Overview
---

# Kafka Architecture Overview

## High-Level Architecture

```
Producers  ──►  [ Broker Cluster ]  ──►  Consumers
                  │  │  │
                  B1 B2 B3
                  │
                ZooKeeper / KRaft
```

Kafka's architecture revolves around five fundamental components:

| Component | Role |
|---|---|
| **Producer** | Publishes messages to topics |
| **Broker** | Stores and serves messages |
| **Topic** | Named channel for message streams |
| **Partition** | Ordered, immutable log within a topic |
| **Consumer** | Reads messages from topics |

---

## The Kafka Log

Kafka's core abstraction is the **append-only, immutable log**. Every message written to Kafka is appended to a partition log and assigned an **offset** — a monotonically increasing integer.

```
Partition 0: [0][1][2][3][4][5] ← new messages appended here
                         ▲
                    consumer offset
```

Key properties:
- **Immutable**: Messages are never modified after write.
- **Ordered within partition**: Global ordering is not guaranteed across partitions.
- **Retention-based**: Messages are retained for a configurable time (default 7 days) or size, regardless of whether they've been consumed.

---

## ZooKeeper vs KRaft

### ZooKeeper Mode (legacy)
Kafka historically used Apache ZooKeeper for:
- Cluster metadata and broker registration
- Leader election
- Consumer group coordination (old API)

### KRaft Mode (Kafka 3.3+ stable)
KRaft (Kafka Raft) eliminates ZooKeeper by embedding a Raft-based metadata quorum directly into Kafka brokers:

```yaml
# server.properties (KRaft mode)
process.roles=broker,controller
node.id=1
controller.quorum.voters=1@localhost:9093
```

**Benefits of KRaft:**
- Simpler operations (one less system)
- Faster controller failover (milliseconds vs seconds)
- Supports millions of partitions per cluster

---

## Data Flow

```
1. Producer serializes message → chooses partition
2. Message appended to leader partition on a broker
3. Follower brokers replicate the message (ISR)
4. Producer receives ACK (based on acks config)
5. Consumer polls, processes, commits offset
```

---

## Kafka vs Traditional Message Queues

| Feature | Kafka | RabbitMQ / ActiveMQ |
|---|---|---|
| Storage model | Log (disk-based) | Queue (in-memory/disk) |
| Message retention | Time/size based | Until consumed |
| Consumer model | Pull | Push |
| Replay | ✅ Yes | ❌ No (once consumed) |
| Throughput | Very high | Moderate |
| Ordering guarantee | Per-partition | Per-queue |
| Scalability | Horizontal (partitions) | Vertical primarily |

---

## Key Configuration Files

```properties
# server.properties (broker)
broker.id=1
log.dirs=/var/kafka/logs
num.partitions=3
default.replication.factor=3
log.retention.hours=168
zookeeper.connect=localhost:2181   # ZooKeeper mode only

# producer.properties
bootstrap.servers=localhost:9092
acks=all
retries=3

# consumer.properties
bootstrap.servers=localhost:9092
group.id=my-group
auto.offset.reset=earliest
```

---

## Interview Questions — Kafka Overview

**Q: What makes Kafka different from a traditional message queue?**

> Kafka is a distributed log, not a queue. Messages are retained after consumption, enabling replay, multiple consumer groups reading the same data independently, and time-travel debugging. Traditional queues delete messages once consumed.

**Q: What is an offset in Kafka?**

> An offset is a monotonically increasing integer that uniquely identifies each message within a partition. Offsets are per-partition — offset 5 in partition 0 is a different message than offset 5 in partition 1.

**Q: How does KRaft improve over ZooKeeper?**

> KRaft removes the external ZooKeeper dependency, simplifying cluster operations. Controller failover drops from tens of seconds to milliseconds, and the system can scale to millions of partitions. Metadata is now stored in a Kafka topic itself, managed by a Raft consensus quorum.

**Q: Can Kafka guarantee global message ordering?**

> No. Kafka only guarantees ordering within a single partition. For global ordering, you'd need a single partition — which eliminates parallelism. The common pattern is to use a partition key to route related messages to the same partition, ensuring per-entity ordering.

---

## Common CLI Commands

```bash
# List topics
kafka-topics.sh --bootstrap-server localhost:9092 --list

# Describe a topic
kafka-topics.sh --bootstrap-server localhost:9092 \
  --describe --topic order-events

# Produce messages
kafka-console-producer.sh --bootstrap-server localhost:9092 \
  --topic order-events

# Consume messages from the beginning
kafka-console-consumer.sh --bootstrap-server localhost:9092 \
  --topic order-events --from-beginning --group my-group

# Check consumer group lag
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --describe --group order-processing-group
```

---

## Further Reading

- [Apache Kafka Official Documentation](https://kafka.apache.org/documentation/)
- [Confluent Developer Tutorials](https://developer.confluent.io/)
- *Kafka: The Definitive Guide* — Neha Narkhede, Gwen Shapira, Todd Palino (O'Reilly)

---

## Advanced Editorial Pass: Kafka Platform Thinking

### Strategic Architecture Focus
- Topic design, partition strategy, and key semantics are long-term contracts.
- Delivery guarantees must align with business consistency requirements.
- Operability (lag, rebalancing, retries, DLQ) determines real reliability.

### Production Failure Modes
- Partition-key mistakes that create hotspots and unstable throughput.
- Retry policies that amplify duplicates without idempotent consumers.
- Under-observed consumer groups causing silent backlog growth.

### Engineering Heuristics
1. Treat event schema and key design as governance decisions.
2. Define replay and backfill strategy before first production launch.
3. Instrument lag and end-to-end processing latency as primary SLO inputs.
