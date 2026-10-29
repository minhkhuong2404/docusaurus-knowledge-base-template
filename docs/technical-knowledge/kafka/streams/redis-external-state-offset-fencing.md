---
id: redis-external-state-offset-fencing
title: Kafka Streams + Redis — External State Store with Offset & Partition Fencing
sidebar_label: 4. Redis State + Offset Fencing
sidebar_position: 4
description: >
  How to replace or offload the RocksDB state store with Redis in Kafka Streams / Kafka consumers,
  avoid full local state restore, and prevent lost or duplicated messages during batch processing
  by combining per-partition offset fencing, partition-key validation, epoch fencing and atomic Lua scripts.
tags:
  - kafka
  - kafka-streams
  - redis
  - state-stores
  - rocksdb
  - idempotency
  - exactly-once
---

import KafkaRedisOffsetFenceDiagram from '@site/src/components/KafkaRedisOffsetFenceDiagram';

# Kafka Streams + Redis — External State with Offset & Partition Fencing

RocksDB is the default Kafka Streams state store, but it couples state to the pod: a cold pod must **replay the changelog** before it can process, and the LSM tree consumes off-heap memory that is hard to bound in containers (see [State Stores & RocksDB](./state-stores-rocksdb.md)). A common alternative is to keep state in **Redis** (shared, network-attached) and use Kafka offsets as a **fence** so that retries, rebalances and batch replays never lose or double-apply a message.

> [!IMPORTANT]
> Moving state out of RocksDB removes the changelog and, with it, Kafka's transactional guarantee that "state update + output + offset commit" are atomic. You must rebuild that guarantee yourself. This page shows how.

---

## 1. Why replace RocksDB (and when not to)

| Concern | RocksDB state store | Redis external state |
|---|---|---|
| Read latency | Microseconds (local, page cache) | 0.2 to 1 ms network round trip |
| Cold start / rebalance | Restore full changelog (minutes to hours for large stores) | None. Any pod reads the same data instantly |
| Memory | Off-heap block cache + memtables, risk of cgroup OOMKilled | Moved to Redis cluster, sized and monitored separately |
| Exactly-once | Native (changelog written inside the transaction) | Not available. Needs offset fence + idempotent writes |
| Failure domain | Per pod | Shared dependency (cluster failover can lose acked writes) |
| Cost | Cheap local SSD | RAM is roughly 10x to 20x more expensive per GB |

**Try these first**: bounded `RocksDBConfigSetter` (shared block cache + `WriteBufferManager`), `num.standby.replicas=1`, state TTL / `WindowStore` retention, and a StatefulSet with persistent volumes so the local checkpoint survives restarts. Choose Redis when state is large and long-lived, restore time is unacceptable, or several services must read the same state.

---

## 2. The core problem: three ways to lose or corrupt data

Without a changelog, the only record of "what was already applied" lives in Redis. Three failure modes appear:

1. **Duplicate apply** (at-least-once replay): consumer crashes after the Redis write but before the offset commit. On restart the record is read again and the state is mutated twice (double counts).
2. **Lost output** (the subtle one): Redis write succeeded, downstream produce not yet flushed, pod crashes. On replay a naive "already applied, skip it" rule drops the record, so the output message **never reaches the next topic**.
3. **Stale / zombie writer**: after a rebalance, the old owner of a partition is paused (GC, network) and later writes old state over the new owner's fresher state.

The cure is one atomic check in Redis that uses the record identity `(topic, partition, offset)` plus an ownership epoch.

<KafkaRedisOffsetFenceDiagram />

---

## 3. Why offset alone is not enough: the partition-key check

An offset is only a total order **inside one partition**. Comparing offset 12 of partition 7 with offset 104 of partition 3 is meaningless. So the fence stores the pair and the key is validated against its expected partition:

- **Fence per key**: `lastPartition` and `lastOffset` are stored next to the value. Same partition: compare offsets. Different partition: **rebase** (offsets are incomparable) and alert.
- **Partition-key validation**: the producer's default partitioner is `murmur2(keyBytes)` modulo partition count. If the record's partition differs from that, co-partitioning is broken (custom partitioner, repartition topic mismatch, partition count change). Send it to a DLQ ([Processor API & DLQ](./processor-api-dlq.md)) rather than splitting one key's state across tasks.
- **Offsets have holes**: transaction markers and log compaction consume offsets. Never require `offset == last + 1`. Treat a bigger jump as a metric, not an error.

> [!WARNING]
> Adding partitions to a topic changes `murmur2(key) mod N` for existing keys. After a partition-count change, expect rebase events and plan a controlled migration (new topic + dual-write), not a live resize.

---

## 4. Decision table (the full fence contract)

| Incoming vs Redis fence | Verdict | State | Downstream emit |
|---|---|---|---|
| `partition` ≠ `murmur2(key) mod N` | DLQ | untouched | no |
| `epoch` < current partition epoch | FENCE (reject) | untouched | no |
| same partition, `offset` > `lastOffset` | APPLY | update + move fence | yes |
| same partition, `offset` == `lastOffset` | RE-EMIT | untouched | yes, rebuilt from stored state |
| same partition, `offset` < `lastOffset` | SKIP | untouched | no |
| different partition than `lastPartition` | REBASE | update + reset fence | yes, plus alert |

The `==` row is what prevents lost output. The `<` row is what prevents double counting.

---

## 5. Atomic fence + state update (Lua)

Two separate Redis commands (read fence, then write state) race between instances. A Lua script runs atomically on the single-threaded Redis event loop, so check and update cannot interleave.

```lua
-- KEYS[1] = state:{key}          (hash: value, offset, partition)
-- KEYS[2] = epoch:{topic}:{partition}  (string counter bumped on assignment)
-- ARGV[1] = partition, ARGV[2] = offset, ARGV[3] = callerEpoch, ARGV[4] = newValue
local curEpoch = tonumber(redis.call('GET', KEYS[2]) or '0')
if tonumber(ARGV[3]) < curEpoch then
  return {'FENCE'}
end
local lastOffset = redis.call('HGET', KEYS[1], 'offset')
local lastPartition = redis.call('HGET', KEYS[1], 'partition')
local offset = tonumber(ARGV[2])
if lastOffset == false then
  redis.call('HSET', KEYS[1], 'value', ARGV[4], 'offset', ARGV[2], 'partition', ARGV[1])
  return {'APPLY'}
end
if lastPartition ~= ARGV[1] then
  redis.call('HSET', KEYS[1], 'value', ARGV[4], 'offset', ARGV[2], 'partition', ARGV[1])
  return {'REBASE'}
end
lastOffset = tonumber(lastOffset)
if offset > lastOffset then
  redis.call('HSET', KEYS[1], 'value', ARGV[4], 'offset', ARGV[2])
  return {'APPLY', tostring(offset - lastOffset)}
elseif offset == lastOffset then
  return {'REEMIT', redis.call('HGET', KEYS[1], 'value')}
end
return {'SKIP'}
```

> [!NOTE]
> The script computes the new value on the client (`ARGV[4]`), which is fine for "last write wins" state. For read-modify-write state such as counters, do the arithmetic inside the script (for example `HINCRBY`) so two instances cannot both read the same old value.

---

## 6. Java: Processor API without a RocksDB store

Use the Processor API (`Processor<K,V,K,V>`) and talk to Redis directly. No `StoreBuilder` means no changelog topic and no local restore.

```java
import io.lettuce.core.RedisClient;
import io.lettuce.core.ScriptOutputType;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.sync.RedisCommands;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.apache.kafka.common.utils.Utils;
import org.apache.kafka.streams.processor.api.Processor;
import org.apache.kafka.streams.processor.api.ProcessorContext;
import org.apache.kafka.streams.processor.api.Record;
import org.apache.kafka.streams.processor.api.RecordMetadata;

public final class RedisFencedProcessor implements Processor<String, String, String, String> {

    private static final String LUA = """
        -- (script from section 5)
        """;

    private final StatefulRedisConnection<String, String> connection;
    private final RedisCommands<String, String> redis;
    private final String scriptSha;
    private ProcessorContext<String, String> context;

    public RedisFencedProcessor(RedisClient client) {
        this.connection = client.connect();
        this.redis = connection.sync();
        this.scriptSha = redis.scriptLoad(LUA);   // EVALSHA avoids resending the script
    }

    @Override
    public void init(ProcessorContext<String, String> context) {
        this.context = context;
    }

    @Override
    public void process(Record<String, String> record) {
        RecordMetadata meta = context.recordMetadata().orElseThrow();
        int partition = meta.partition();
        long offset = meta.offset();
        int partitions = partitionCount();

        int expected = Utils.toPositive(
            Utils.murmur2(record.key().getBytes(StandardCharsets.UTF_8))) % partitions;
        if (expected != partition) {
            throw new IllegalStateException(
                "Key %s on partition %d, expected %d".formatted(record.key(), partition, expected));
        }

        long epoch = currentEpoch(meta.topic(), partition);
        String newValue = compute(record.value());

        List<Object> result = redis.evalsha(
            scriptSha, ScriptOutputType.MULTI,
            new String[] {"state:" + record.key(), "epoch:" + meta.topic() + ":" + partition},
            String.valueOf(partition), String.valueOf(offset),
            String.valueOf(epoch), newValue);

        switch ((String) result.get(0)) {
            case "APPLY", "REBASE" -> context.forward(record.withValue(newValue));
            case "REEMIT" -> context.forward(record.withValue((String) result.get(1)));
            case "SKIP" -> { /* already applied and already emitted */ }
            case "FENCE" -> throw new IllegalStateException("Fenced: lost ownership of partition");
            default -> throw new IllegalStateException("Unknown fence verdict");
        }
    }

    @Override
    public void close() {
        connection.close();
    }

    private String compute(String value) { return value; }          // business logic
    private int partitionCount() { return 12; }                      // from AdminClient / config
    private long currentEpoch(String topic, int partition) { return 0L; } // cached from rebalance listener
}
```

Notes that matter in production:

- **Throw on `FENCE` and on a key/partition mismatch**: the task fails and the commit is not advanced, so nothing is lost silently. Route poison records through a DLQ handler instead of crash-looping.
- **Epoch source**: bump `INCR epoch:{topic}:{partition}` from a `ConsumerRebalanceListener.onPartitionsAssigned` (plain consumers) or from a `StateListener` / `TaskAssignor` hook (Streams) and cache it per task.
- **Do not close the connection per record**; keep one connection per stream thread (Lettuce connections are thread-safe but a pipeline per thread keeps ordering simple).

---

## 7. Batch processing ("patching") without losing messages

For high throughput, Redis round trips dominate: at 10,000 msg/s and 0.5 ms per call, a synchronous loop needs about 5 busy-seconds per second, so one thread cannot keep up (Little's Law: concurrency = rate × latency = 5). Batch the poll loop:

1. `poll()` returns a batch, group records by `(partition)` preserving order.
2. Pipeline `EVALSHA` for the batch (Lettuce async commands or a `RedisAdvancedClusterAsyncCommands` batch with `setAutoFlushCommands(false)` then `flushCommands()`).
3. Wait for **all** futures. Any `FENCE` or exception aborts the batch.
4. `producer.flush()` of all outputs, **then** `consumer.commitSync(offsets)` for the highest offset per partition.

```java
consumer.poll(Duration.ofMillis(200)).partitions().forEach(tp -> {
    List<ConsumerRecord<String, String>> batch = records.records(tp);
    // 1) pipeline fence+state, 2) await all, 3) send downstream
    // 4) producer.flush();  5) commit lastOffset + 1 for tp
});
```

**Order is the invariant**: Redis write, then produce, then commit. A crash at any point is repaired by replay because the fence turns the replay into `SKIP` or `REEMIT`. Reversing the order (commit first) is the classic way to lose messages.

---

## 8. Redis-side production gotchas

| Gotcha | Impact | Mitigation |
|---|---|---|
| Async replication on failover | Acked write lost, fence moves **backwards**, state diverges from Kafka | `WAIT 1 timeout` on critical writes, AOF `appendfsync everysec` at minimum, accept replay as the repair path |
| Redis Cluster hash slots | Multi-key Lua fails with `CROSSSLOT` | Use hash tags: `state:{key}` and `epoch:{key}` share a slot, or store the epoch inside the same hash |
| Eviction (`maxmemory-policy`) | Silent state loss | `noeviction` for state, separate instance from caches |
| Hot key | One slot saturates one core | Key salting, shard counters and merge on read |
| TTL on state | Fence expires, old replays re-applied | Set TTL longer than max replay window (retention + max lag) |
| Memory growth | Unbounded keys | Compact value encoding (hash ziplist, protobuf), TTL, monitor `used_memory` |
| Redis outage | Whole pipeline stalls | Circuit breaker + pause consumer (`consumer.pause`), never skip and commit |

> [!CAUTION]
> If Redis loses data, the offset fence is gone and replays are re-applied. Treat Redis as a **durable store** (replicas, AOF, backups) or keep a periodic snapshot topic in Kafka (compacted) that you can rebuild from.

---

## 9. Trade-offs: choosing the right design

| Option | Guarantee | Complexity | Verdict |
|---|---|---|---|
| RocksDB + changelog, `exactly_once_v2` | Exactly-once, atomic | Low | Default. Tune memory first |
| Redis + offset/partition fence (this page) | Effectively-once (idempotent) | High | When restore time or sharing state matters |
| Redis, no fence | At-least-once with double counts | Low | Never for money or counters |
| Custom `StateStore` backed by Redis | Streams API semantics, no changelog | Very high | Only if you need DSL joins and aggregates over Redis |
| Transactional outbox to DB | Exactly-once with a database | Medium | Best when the sink is already a relational DB |

---

## 10. Observability and Day-2 operations

- Metrics: verdict counters (`apply`, `skip`, `reemit`, `rebase`, `fence`, `dlq`), Redis call p99, batch size, consumer lag.
- Alert on a rising `rebase` or `dlq` rate (partitioner or topology change) and on any `fence` burst (rebalance storm).
- Reconciliation job: sample keys, compare Redis `offset` with a replay of the topic to confirm the fence never regressed.
- Chaos test: kill the pod between each of the three steps (Redis write, produce, commit) and assert the downstream output count equals the input count.

---

## 🧠 Senior/Staff Interview Playbook: How to Ace Kafka Streams + Redis State Interviews

### The Senior Framing Strategy (first 60 seconds)

State the invariants before the tools: *every input record must affect state at most once and emit output at least once*. Without a changelog transaction that means an idempotent fence keyed by `(topic, partition, offset)`. Do the capacity math out loud: concurrency = rate × latency, so 10k msg/s at 0.5 ms Redis latency needs about 5 in-flight calls, hence pipelining. Name the failure boundary (Redis failover with async replication moves the fence backwards) and the Day-2 controls (verdict metrics, reconciliation, chaos test between write, produce and commit).

### Classic Interviewer Traps & Principal Rebuttals

#### Trap 1: "Just skip the record if the offset is already in Redis."
* **Junior/Mid Answer:** "Duplicates are bad, so skip anything at or below the stored offset."
* **Principal Rebuttal:** Skipping on `==` loses output when the crash happens after the Redis write and before the produce flush. Lower offsets are skipped; equal offsets re-emit the output rebuilt from stored state. Only that makes the pipeline output-lossless.

#### Trap 2: "Offsets are sequential, so detect lost messages by looking for gaps."
* **Junior/Mid Answer:** "If offset jumps from 104 to 106, message 105 was lost."
* **Principal Rebuttal:** Transaction commit markers and log compaction create legitimate holes. Gaps are a metric. Real loss prevention is ordering: Redis write, produce, flush, then commit offset, never the reverse.

#### Trap 3: "Does the offset check work if the key moves partitions?"
* **Junior/Mid Answer:** "Yes, a bigger offset is always newer."
* **Principal Rebuttal:** Offsets are ordered per partition only. Store `(partition, offset)`; if the partition differs, rebase and alert; if it differs from `murmur2(key) mod N`, the co-partitioning contract is broken, so DLQ it. Changing partition count remaps keys, so migrate via a new topic.

#### Trap 4: "Can you get exactly-once with Redis?"
* **Junior/Mid Answer:** "Set `processing.guarantee=exactly_once_v2` and it works."
* **Principal Rebuttal:** EOS covers Kafka writes only. Redis is outside the transaction, so you get effectively-once through idempotence: atomic Lua fence, epoch fencing for zombies, and replay as the repair mechanism.

#### Trap 5: "Why not just use Redis for everything and drop RocksDB?"
* **Junior/Mid Answer:** "Redis is faster."
* **Principal Rebuttal:** RocksDB reads are local microseconds; Redis adds a network hop and a shared failure domain, and RAM costs far more. Exhaust RocksDB tuning (bounded cache, standbys, TTL) first; move to Redis when restore time or cross-service state sharing dominates.

### Mid-Level vs. Principal Candidate Cheat Sheet

| Concept / Scenario | Mid-Level Candidate Says | Principal Candidate Demonstrates |
|---|---|---|
| Duplicate handling | "Store the last offset and skip" | Three-way compare: skip lower, re-emit equal, apply higher, all in one Lua script |
| Lost messages | "Look for offset gaps" | Ordering invariant (state, produce, flush, commit) and chaos test at each boundary |
| Partition check | "Key hashes to a partition" | Validate `murmur2(key) mod N`, rebase on partition change, DLQ on contract break |
| Zombie writers | "Rebalancing handles it" | Epoch counter bumped on assignment, rejected in Lua when stale |
| Redis durability | "Redis is in-memory and fast" | Async replication regression of the fence, `WAIT`, AOF, `noeviction`, snapshot topic |
| Throughput | "Call Redis per record" | Little's Law sizing, pipelined batches, per-partition ordering |

---

## Related reading

- [State Stores & RocksDB Tuning](./state-stores-rocksdb.md)
- [Processor API & Dead Letter Queues](./processor-api-dlq.md)
- [Production Runbook](./production-runbook.md)
