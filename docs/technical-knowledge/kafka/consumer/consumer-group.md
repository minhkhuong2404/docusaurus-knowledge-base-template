---
id: consumer-group
title: Consumer Groups
sidebar_label: Consumer Group
description: A **consumer group** is a set of consumers that collectively consume
  a topic's partitions. Each partition is assigned to exactly one consumer within
  the group.
tags:
- technical-knowledge
- kafka
- consumer
- consumer-group
---

import KafkaConsumerGroupRebalanceDiagram from '@site/src/components/KafkaConsumerGroupRebalanceDiagram';
import KafkaIncrementalCooperativeRebalanceDiagram from '@site/src/components/KafkaIncrementalCooperativeRebalanceDiagram';

# Consumer Groups

<KafkaConsumerGroupRebalanceDiagram />

---

## What is a Consumer Group?

A **consumer group** is a set of consumers that collectively consume a topic's partitions. Each partition is assigned to exactly one consumer within the group at a time — enabling parallel, load-balanced consumption.

---

## Fan-Out with Multiple Groups

Different groups consume the same topic **independently**, each maintaining their own offsets:

This is one of Kafka's most powerful features — no message is "consumed" from the topic; all groups see all messages.

---

## Partition Assignment

### Rule: max parallelism = number of partitions

```
6 partitions, 3 consumers → 2 partitions per consumer   (optimal)
6 partitions, 6 consumers → 1 partition per consumer    (max parallelism)
6 partitions, 8 consumers → 2 consumers idle            (wasteful)
```

:::tip[The number of partitions is the upper bound on consumer parallelism within a group. Plan partition count with your expected consumer scale in mind.]
:::

---

## Rebalancing

When consumers join or leave the group, Kafka **rebalances** partition assignments:

```
Trigger events:
- New consumer joins
- Consumer leaves (graceful shutdown)
- Consumer dies (session.timeout.ms exceeded)
- Topic partition count changes
- Group subscription changes
```

### Stop-the-World Rebalance (legacy)

All consumers **pause** processing during rebalance. This can cause processing latency spikes.

```
All consumers → "stop processing"
Group Coordinator assigns partitions
All consumers → "resume with new assignments"
```

### Incremental Cooperative Rebalance (recommended)

```yaml
spring:
  kafka:
    consumer:
      partition-assignment-strategy: org.apache.kafka.clients.consumer.CooperativeStickyAssignor
```

With `CooperativeStickyAssignor`, only the **affected** partitions are revoked and reassigned. Consumers not losing/gaining partitions continue processing uninterrupted.

---

## Incremental Cooperative Rebalancing & Static Group Membership

> **Reference Guides**: [Conduktor — Consumer Incremental Rebalance & Static Group Membership](https://www.conduktor.io/kafka/consumer-incremental-rebalance-and-static-group-membership) | [Confluent — Incremental Cooperative Rebalancing in Apache Kafka (KIP-429)](https://www.confluent.io/blog/incremental-cooperative-rebalancing-in-kafka/)

In production microservices, rolling Kubernetes deployments and autoscaling events happen dozens of times a day. Understanding how **Incremental Cooperative Rebalancing (KIP-429)** and **Static Group Membership (KIP-345)** work internally—and how they eliminate **"Stop-the-World" consumer lag spikes**—is essential for building low-latency Kafka pipelines.

### Interactive Protocol Simulator: Eager vs. Incremental Cooperative vs. Static Membership

Use the simulator below to step through the exact `JoinGroup`, `SyncGroup`, `onPartitionsRevoked`, and `group.instance.id` wire protocol transitions:

<KafkaIncrementalCooperativeRebalanceDiagram />

### 1. Why Eager Rebalancing Causes Stop-the-World Outages

Legacy assignors (`RangeAssignor`, `RoundRobinAssignor`, and non-cooperative `StickyAssignor`) implement the **Eager** protocol (`RebalanceProtocol.EAGER`):
- When a single consumer joins, restarts, or misses `session.timeout.ms`, the Group Coordinator forces **every** consumer in the group to invoke `onPartitionsRevoked(ALL)` *before* sending `JoinGroupRequest`.
- **100% of partitions stop being fetched simultaneously**, even if 95% of those partitions will end up right back on the same consumers!
- For **Kafka Streams** or stateful consumers with local caches/RocksDB state stores, dropping all partitions triggers expensive state-store teardown, offset re-seeks, and changelog restoration.

### 2. How Incremental Cooperative Rebalancing Works Internally (KIP-429)

`CooperativeStickyAssignor` (`RebalanceProtocol.COOPERATIVE`) eliminates global pauses by splitting partition migration into **two fast cooperative rounds**:

1. **Round 1 — Keep Existing Partitions & Identify Excess**:
   - Consumers **do not** revoke any partitions before sending `JoinGroupRequest`. Instead, they serialize their currently owned partitions inside `JoinGroupRequest` user-data metadata and **continue polling uninterrupted**.
   - The **Group Leader** (the first consumer in the group) computes the ideal balanced target assignment while maximizing stickiness.
   - If `C1` owns `[P0, P1, P2]`, `C2` owns `[P3, P4, P5]`, and `C3` joins, the Leader sees `P2` and `P5` must move to `C3`. In Round 1 `SyncGroupResponse`, the Leader instructs `C1` to keep `[P0, P1]` (revoking only `P2`) and `C2` to keep `[P3, P4]` (revoking only `P5`), while `C3` temporarily receives `[]`.
2. **Selective Revocation & Automatic Rejoin**:
   - `C1` invokes `onPartitionsRevoked([P2])` (commits `P2`'s offset and releases it, while `P0` and `P1` **never pause**). `C2` revokes only `[P5]`.
   - Because partitions were revoked, the clients immediately send a second `JoinGroupRequest` with their updated owned sets (`[P0, P1]` and `[P3, P4]`).
3. **Round 2 — Assign Newly Freed Partitions**:
   - The Group Leader sees `[P2, P5]` are now unowned and assigns them to `C3` via `SyncGroupResponse`.
   - **Result**: `P0, P1, P3, P4` experienced **0 ms of downtime**.

:::info[Modern Kafka KIP-848 (`group.protocol=consumer`)]
Starting in Apache Kafka 3.7+ / 4.0 (KIP-848), Kafka replaces the client-side `JoinGroup`/`SyncGroup` Leader election with a **broker-driven server-side assignor** (`group.protocol=consumer`), making incremental cooperative assignment the native default without requiring two client rebalance rounds!
:::

### 3. Static Group Membership (`group.instance.id`, KIP-345)

Even with cooperative rebalancing, a pod rolling restart normally triggers two unnecessary rebalances (one when the old pod shuts down, one when the new pod boots up 15 seconds later). **Static Group Membership** eliminates rebalances completely during planned restarts:

- **Persistent Identity**: Set a stable `group.instance.id` per instance (e.g., Kubernetes `StatefulSet` pod ordinal `order-consumer-0` or host-tied ID).
- **Suppressed `LeaveGroupRequest`**: When a static member calls `consumer.close()` during a rolling deploy, it **does not send `LeaveGroupRequest`**. The Group Coordinator preserves its exact partition assignment in memory for up to `session.timeout.ms`.
- **Instant Reclaim**: When the restarted pod reconnects within `session.timeout.ms` using the same `group.instance.id`, the Coordinator immediately returns its cached partitions (`[P2, P3]`) **without incrementing the group generation or notifying any other consumer**!
- **Zombie Fencing (`FENCED_INSTANCE_ID`)**: Each `JoinGroup` assigns a new internal `member.id` to the `group.instance.id`. If a paused zombie instance wakes up and sends a heartbeat with the old `member.id`, the broker rejects it with `FencedInstanceIdException`, preventing split-brain duplicate consumption.

```java
// Production Spring Boot / Kafka Client config combining Cooperative Rebalance + Static Membership
Map<String, Object> props = new HashMap<>();
props.put(ConsumerConfig.GROUP_ID_CONFIG, "order-service");
props.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG,
    CooperativeStickyAssignor.class.getName());

// Static membership: tie to deterministic Kubernetes StatefulSet ordinal / host ID
props.put(ConsumerConfig.GROUP_INSTANCE_ID_CONFIG, System.getenv("POD_NAME"));

// Must exceed your longest expected pod restart / GC pause (e.g., 45s–90s)
props.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, 45_000);
props.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG, 3_000);
```

| Feature / Property | Dynamic + Eager (`RangeAssignor`) | Dynamic + Cooperative (`CooperativeStickyAssignor`) | Static + Cooperative (`group.instance.id`) |
|:---|:---|:---|:---|
| **Rolling Pod Restart** | 2 full Stop-the-World rebalances | 2–4 tiny selective rebalances (unaffected partitions keep running) | **0 rebalances** if pod restarts within `session.timeout.ms` |
| **Scale-Out (Adding Pods)** | 100% of partitions pause | Only migrated partitions pause; existing pods keep fetching | Only migrated partitions pause |
| **Kubernetes Fit** | Poor (high lag spikes) | Good for stateless `Deployment` pods with ephemeral names | **Optimal** for `StatefulSet` / deterministic pod IDs |
| **Trap / Gotcha** | Global lag spikes & state store rebuilds | Mixed assignors in rolling upgrade require 2-step migration | Duplicate `group.instance.id` across two live pods causes `FencedInstanceIdException` |

---

## Group Coordinator

The **Group Coordinator** is a broker (selected based on `hash(group.id) % __consumer_offsets partitions`) responsible for:

1. Accepting join requests from consumers
2. Triggering rebalance when membership changes
3. Storing committed offsets in `__consumer_offsets`

### Group State Machine

```
Empty → PreparingRebalance → CompletingRebalance → Stable → Dead
```

| State | Description |
|-------|-------------|
| `Empty` | No members, might have offsets |
| `PreparingRebalance` | Awaiting JoinGroup requests |
| `CompletingRebalance` | Leader assigned, awaiting SyncGroup |
| `Stable` | All members assigned, consuming |
| `Dead` | Group metadata deleted |

---

## Spring Boot Consumer Group Config

```java
@Configuration
public class KafkaConsumerConfig {

    @Bean
    public ConsumerFactory<String, OrderEvent> consumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "order-service");
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 100);
        props.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, 300_000);
        props.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, 10_000);
        props.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG, 3_000);
        props.put(ConsumerConfig.PARTITION_ASSIGNMENT_STRATEGY_CONFIG,
            CooperativeStickyAssignor.class.getName());
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        return new DefaultKafkaConsumerFactory<>(props);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, OrderEvent>
            kafkaListenerContainerFactory(ConsumerFactory<String, OrderEvent> cf) {
        ConcurrentKafkaListenerContainerFactory<String, OrderEvent> factory =
            new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(cf);
        factory.setConcurrency(3);  // 3 threads = 3 consumers in the group (per instance)
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL_IMMEDIATE);
        return factory;
    }
}
```

```java
@KafkaListener(
    id = "orderConsumerContainer", // Spring-local container bean ID for KafkaListenerEndpointRegistry
    groupId = "order-service",     // Kafka broker-wide consumer group ID
    concurrency = "3"              // Overrides factory concurrency (3 threads per instance)
)
public void listen(ConsumerRecord<String, OrderEvent> record, Acknowledgment ack) {
    processOrder(record.value());
    ack.acknowledge();
}
```

:::tip[`id` vs `groupId` in `@KafkaListener`]
Never omit `groupId` when setting an `id` unless you intentionally want `groupId` to equal `id`! In Spring Kafka, `idIsGroup` defaults to `true`. If you specify `@KafkaListener(id = "myListener")` without `groupId`, Spring silently overrides your global `spring.kafka.consumer.group-id`. For the full architectural deep dive and programmatic pause/resume patterns, see [Kafka Consumer Overview — id vs groupId Deep Dive](./consumer-overview#kafkalistener-id-vs-groupid-architecture--mechanics).
:::

---

## Offset Management Deep Dive

### `__consumer_offsets` Topic

Committed offsets are stored in the internal `__consumer_offsets` topic (50 partitions by default, compacted):

```
Key:   GroupId + Topic + Partition
Value: Offset + Metadata + Timestamp
```

### Viewing Offsets

```bash
# Check consumer group lag
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --describe --group order-service

# Output:
# GROUP         TOPIC   PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG
# order-service orders  0          1050            1100            50
# order-service orders  1          980             980             0
```

### Reset Offsets (for reprocessing)

```bash
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group order-service \
  --topic orders \
  --reset-offsets --to-earliest \
  --execute
```

---

## Static Group Membership

By default, each consumer re-joins on restart, triggering a rebalance. **Static membership** assigns a stable `group.instance.id`, allowing a restarting consumer to reclaim its partitions without rebalancing (within `session.timeout.ms`):

```java
props.put(ConsumerConfig.GROUP_INSTANCE_ID_CONFIG, "order-consumer-pod-1");
```

Ideal for Kubernetes deployments with stable pod names.

---

## Interview Questions

### Q: Can two consumers in the same group read from the same partition?

> No. At any given time, a partition is assigned to exactly one consumer within a group. This is the fundamental guarantee that prevents double-processing within the group. Multiple groups can read the same partition independently.

### Q: What triggers a consumer group rebalance?

> Any change in group membership: a new consumer joins, an existing consumer leaves (graceful or via timeout), a consumer's `session.timeout.ms` expires, or the topic's partition count changes. Some partition assignment strategies (like range assignor) also rebalance when the group subscription changes.

### Q: What is consumer lag?

> Consumer lag is the difference between the Log End Offset (LEO) and the consumer's committed offset for a partition: `lag = LEO - committed_offset`. High lag means the consumer is falling behind the producer. It's a critical metric monitored in production (via Kafka metrics or Burrow/Cruise Control).

### Q: What is the difference between `subscribe()` and `assign()`?

> `subscribe(topics)` registers with a consumer group — the group coordinator assigns partitions dynamically and handles rebalancing. `assign(partitions)` manually assigns specific partitions, bypassing the group mechanism entirely (no rebalancing, no group coordinator, no shared offset management). Use `assign` for batch reprocessing jobs; use `subscribe` for live consumers.

### Q: What is static group membership and when should you use it?

> Static membership (`group.instance.id`) gives a consumer a persistent identity. When a statically-membered consumer restarts, it reclaims its previous partition assignments without triggering a group-wide rebalance — as long as it comes back within `session.timeout.ms`. This is valuable in Kubernetes where pod restarts are frequent and rebalances are expensive.

---

## 🧠 Senior/Staff Interview Playbook: How to Ace Kafka Rebalancing & Static Membership Interviews

### 1. The Senior Framing Strategy (First 60 Seconds)

When asked *"How do you prevent consumer lag spikes and rebalance storms during Kubernetes deployments or autoscaling?"*, anchor your answer on four protocol-level truths:

1. **Separate Eager vs. Cooperative Rebalance Mechanics**:
   - Immediately contrast `RangeAssignor` (Eager: revokes 100% of partitions *before* `JoinGroup`, causing stop-the-world outages) with `CooperativeStickyAssignor` (KIP-429: keeps unaffected partitions active while migrating only excess partitions across two cooperative rounds) and KIP-848 (`group.protocol=consumer`).
2. **Pair Cooperative Rebalance with Static Group Membership (`group.instance.id`)**:
   - Explain that `CooperativeStickyAssignor` solves *scale-out*, whereas `group.instance.id` (KIP-345) solves *rolling restarts* by suppressing `LeaveGroupRequest` on shutdown and caching partition ownership for `session.timeout.ms`.
3. **Quantify Timeout & Heartbeat Invariants**:
   - State the two distinct liveness timers: `session.timeout.ms` (background heartbeat thread, e.g. `45s` for static members to survive container restarts) vs. `max.poll.interval.ms` (main processing loop deadline, e.g. `300s`).
4. **Proactively Call Out Rolling-Upgrade & Kubernetes Deployment Traps**:
   - Never deploy `group.instance.id` with a hardcoded string or random UUID (either causes `FencedInstanceIdException` fencing loops or defeats static membership), and never switch directly from `RangeAssignor` to `CooperativeStickyAssignor` in a rolling deploy without checking protocol compatibility.

---

### 2. Classic Interviewer Traps & Principal Rebuttals

#### Trap 1: "We switched `partition.assignment.strategy` to `CooperativeStickyAssignor` in a Kubernetes `Deployment` and deployed a rolling update—why did our consumers throw `IllegalStateException` or fall back to Eager?"
* **Junior/Mid Answer:** *"Maybe `CooperativeStickyAssignor` has a bug in that Kafka version, or we forgot to restart the brokers."*
* **Principal Rebuttal:**
  > *"The Group Coordinator requires **all** active consumers in the group to share at least one common `RebalanceProtocol` (`EAGER` vs. `COOPERATIVE`). If you replace `[RangeAssignor]` with `[CooperativeStickyAssignor]` in a single rolling deploy, old pods only speak `EAGER` and new pods only speak `COOPERATIVE`—so `JoinGroup` fails protocol intersection! In production, you must do a **two-step rolling upgrade**: (1) Deploy `[RangeAssignor, CooperativeStickyAssignor]` (or `[CooperativeStickyAssignor, StickyAssignor]`) so new pods still speak Eager while old pods drain; (2) Once 100% of pods are on step 1, deploy `[CooperativeStickyAssignor]` alone."*

#### Trap 2: "We enabled Static Group Membership (`group.instance.id`) on our Kubernetes `Deployment`, and now pods keep crashing and getting kicked out of the group with `FencedInstanceIdException`!"
* **Junior/Mid Answer:** *"Static membership is buggy in Kubernetes—we should increase `heartbeat.interval.ms` to stop the fencing."*
* **Principal Rebuttal:**
  > *"A Kubernetes `Deployment` (unlike a `StatefulSet`) spins up the **new** pod *before* terminating the **old** pod during a rolling update, or assigns random suffixes (`app-7d9f8b-x2k9p`). If two live pods share the same `group.instance.id` simultaneously, the Group Coordinator intentionally fences the older `member.id` with `FencedInstanceIdException` to prevent split-brain duplicate consumption! Use Static Membership with a **`StatefulSet`** (stable ordinal `pod-0`, `pod-1` with `OrderedReady` / terminate-before-start), or ensure `maxSurge: 0, maxUnavailable: 1` on a `Deployment` with deterministic instance IDs."*

#### Trap 3: "If Static Membership holds a restarting pod's partitions for `session.timeout.ms = 120s`, doesn't that mean those partitions sit idle for 2 minutes if a pod genuinely crashes?"
* **Junior/Mid Answer:** *"Yes, that's unavoidable, so we should just set `session.timeout.ms = 5000` (5 seconds) so failover is fast."*
* **Principal Rebuttal:**
  > *"Setting `session.timeout.ms = 5s` defeats Static Membership because almost no JVM/Spring Boot pod can restart, initialize Spring context, and rejoin in 5 seconds—you'll trigger a full rebalance anyway, plus risk false-positive rebalances on brief GC pauses. The production sweet spot is sizing `session.timeout.ms` just above your measured p99 pod restart time (typically `30s–45s`), accepting a bounded 30s pause on rare hard crashes in exchange for **zero rebalances across 100% of planned rolling deployments**."*

---

### 3. Quick Reference — Mid-Level vs. Principal Candidate Cheat Sheet

| Kafka Rebalance Scenario | Mid-Level Candidate Says | Principal Candidate Demonstrates |
|:---|:---|:---|
| **Eliminating Stop-the-World Pauses** | *"Increase `session.timeout.ms` so rebalances happen less often."* | *"Adopt **`CooperativeStickyAssignor` (KIP-429)** for two-round selective revocation (or **KIP-848** broker-driven protocol) so unaffected partitions experience 0 ms pause."* |
| **Rolling Kubernetes Restarts** | *"Rebalances are normal during deploys; Kafka handles it."* | *"Enable **Static Group Membership (`group.instance.id`)** on a `StatefulSet` (or `maxSurge: 0`) so `close()` suppresses `LeaveGroupRequest` and pods reclaim partitions with 0 rebalances."* |
| **Upgrading to Cooperative Mode** | *"Change `partition.assignment.strategy` to `CooperativeStickyAssignor` and deploy."* | *"Execute a **2-phase rolling upgrade** (`[Range, CooperativeSticky]` $\to$ `[CooperativeSticky]`) so mixed-generation pods during rollout still intersect on a common protocol."* |
| **Heartbeat vs. Poll Timeouts** | *"They both check if the consumer is alive."* | *"`session.timeout.ms` monitors the background **heartbeat thread** (liveness); `max.poll.interval.ms` bounds **record processing time** between `poll()` calls (progress)."* |
