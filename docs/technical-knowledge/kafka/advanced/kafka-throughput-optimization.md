---
id: kafka-throughput-optimization
title: "Kafka Throughput Optimization"
slug: kafka-throughput-optimization
description: A deep-dive into techniques for improving Kafka throughput — covering compression, batching, partitions, consumer parallelism, tuning configs, and their trade-offs.
tags: [kafka, performance, throughput, compression, batching, partitions, optimization]
---

# Kafka Throughput Optimization

> **Goal:** Maximize the volume of messages Kafka can produce and consume per unit of time, while understanding the trade-offs of each technique.

---

## Mental Model: Where Are the Bottlenecks?

Throughput in Kafka is constrained by five primary resources:

| Resource | Bottleneck |
|----------|------------|
| **Network I/O** | Bandwidth between producer, broker, and consumer |
| **Disk I/O** | Sequential write speed on broker storage |
| **CPU** | Compression/decompression on producer and consumer |
| **Memory** | Buffer pools on producer and page cache on broker |
| **Partition count** | Max parallelism for consumers |

Each optimization technique below targets one or more of these bottlenecks.

---

## 1. Message Compression

Compression reduces the size of data sent over the wire and stored on disk, directly cutting network and disk I/O.

### Configuration

```properties
# Producer config
compression.type=snappy     # Options: none, gzip, snappy, lz4, zstd
```

### Algorithm Comparison

| Algorithm | Compression Ratio | CPU Usage | Speed | Best Use Case |
|-----------|-------------------|-----------|-------|---------------|
| `none` | 1x (no savings) | Zero | Fastest | Low-volume or already-compressed data (images, video) |
| `gzip` | Highest (~5–7x) | High | Slowest | Archival, batch pipelines with ample CPU |
| `snappy` | Moderate (~2–3x) | Low | Fast | General-purpose real-time streaming |
| `lz4` | Moderate (~2–3x) | Very Low | Fastest | Latency-sensitive applications |
| `zstd` | High (~4–5x) | Moderate | Fast | Best balance of all dimensions (Kafka 2.1+) |

### Pros
- ✅ Significantly reduces network bandwidth consumption (up to 70%)
- ✅ Reduces broker disk usage, allowing smaller storage costs
- ✅ Kafka compresses the **entire batch**, so larger batches = better compression ratios (synergy with batching)
- ✅ Compression metadata is stored in the message; consumers decompress automatically

### Cons
- ❌ CPU overhead on the producer side (and consumer decompression)
- ❌ Does **not** benefit already-compressed payloads (images, encrypted data, pre-gzipped JSON)
- ❌ `gzip` can become a throughput bottleneck if the producer is CPU-constrained
- ❌ If producers and brokers use different compression types, the broker must **recompress**, causing severe latency spikes

:::tip Best Practice
Use `zstd` as the default in modern Kafka clusters (2.1+). It delivers the best compression-to-CPU ratio. Avoid `gzip` in real-time pipelines with > 50k msg/s.
:::

---

## 2. Producer Batching

Kafka's producer does not send each message immediately. It accumulates messages into **batches** before sending, reducing network round trips.

### Configuration

```properties
# Producer config
# Time the producer waits to fill a batch before sending it
linger.ms=20

# Max memory a single batch can occupy per partition before it is sent
batch.size=131072   # 128 KB (default: 16 KB)
```

### How It Works

```
Without batching (linger.ms=0):
  [msg1] ─send→ broker
  [msg2] ─send→ broker
  [msg3] ─send→ broker
  → 3 network round trips, 3 small I/O writes

With batching (linger.ms=20, batch.size=128KB):
  [msg1, msg2, msg3, ...N] ─send→ broker  (after 20ms OR when 128KB is full)
  → 1 network round trip, 1 larger sequential I/O write
```

### Key Configs Your Must Know

| Config | Default | Impact |
|--------|---------|--------|
| `linger.ms` | 0ms (send immediately) | Higher values = larger batches = better throughput but adds latency |
| `batch.size` | 16 KB | Increase to accommodate high msg/s rates (try 64KB–256KB) |
| `buffer.memory` | 32 MB | Total memory pool for all pending batches. Increase if producing fast bursts. |

### Pros
- ✅ Drastically reduces number of network I/O operations (fewer TCP round trips)
- ✅ Enables better compression ratios (compression applies at the batch level)
- ✅ Increases broker sequential disk write throughput (sequential I/O is faster than many small writes)

### Cons
- ❌ Introduces **end-to-end latency** equal to `linger.ms` for each batch
- ❌ Large batches increase memory pressure on the producer's JVM buffer pool
- ❌ If a batch fails mid-send, all messages in the batch must be retried

:::tip Best Practice
Set `linger.ms=20` and `batch.size=65536` (64KB) as a starting point. For maximum throughput workloads like analytics pipelines, push `linger.ms` to 50–100ms.
:::

---

## 3. Increasing Partition Count

**Partitions are the unit of Kafka parallelism.** More partitions enable more producers to write in parallel and more consumer instances to read in parallel simultaneously.

### How Partitions Drive Throughput

```
Topic with 3 partitions:
  Partition-0 ←→ Producer A / Consumer A
  Partition-1 ←→ Producer B / Consumer B
  Partition-2 ←→ Producer C / Consumer C
  → 3x throughput vs. single partition

Topic with 1 partition:
  Partition-0 ←→ Producer A, B, C (serialized writes) / Consumer A (single)
  → Bottleneck
```

### Sizing Guidance

A common industry formula for partition count:
```
partitions = max(
  target_throughput_MB/s / producer_throughput_per_partition_MB/s,
  target_throughput_MB/s / consumer_throughput_per_partition_MB/s
)
```

**Rule of thumb:** Start with `partitions = replication_factor × 2` and scale based on measured pressure.

### Pros
- ✅ Linearly increases **producer write** parallelism
- ✅ Linearly increases **consumer read** parallelism (each consumer instance can handle 1+ partitions)
- ✅ Distributes load across multiple broker nodes, preventing single-broker hotspots

### Cons
- ❌ **More partitions = more open file handles** on each broker (OS limit risk)
- ❌ **Higher leader election cost:** When a broker fails, Kafka must elect a new leader for each partition leader on that broker — more partitions = longer recovery time
- ❌ **End-to-end latency increases** (replication writes happen per-partition in parallel but add overhead per partition count)
- ❌ **Cannot reduce partition count** — you can only add partitions, never remove them after creation. Poor initial sizing requires topic recreation.
- ❌ **Message ordering** is guaranteed only within a single partition. More partitions means ordering guarantees apply to a smaller subset of messages.

:::caution Rule
Do NOT pre-emptively create topics with 1000 partitions. Over-partitioning is just as harmful as under-partitioning. Start conservatively and increase systematically.
:::

---

## 4. Consumer Parallelism (Consumer Group Scaling)

Adding consumer instances within a consumer group allows Kafka to distribute partition load horizontally.

### How It Works

```
Topic: orders-topic (6 partitions)

# Scenario A: 1 consumer
Consumer-1: reads Partition-0, 1, 2, 3, 4, 5  → bottleneck

# Scenario B: 3 consumers in same group
Consumer-1: Partition-0, 1
Consumer-2: Partition-2, 3
Consumer-3: Partition-4, 5  → 3x throughput

# Scenario C: 6 consumers (1:1 mapping)
Consumer-1: Partition-0
Consumer-2: Partition-1
...           → maximum throughput

# Scenario D: 7 consumers (over-provisioned)
Consumer-7: IDLE → wasted resource, no partition assigned
```

### Pros
- ✅ Linear throughput scaling up to the partition count
- ✅ Provides fault tolerance — if one consumer dies, its partitions are rebalanced to surviving consumers
- ✅ Zero Kafka configuration change required — handled at the application level

### Cons
- ❌ Number of active consumers is **capped by the number of partitions** — adding consumers beyond partition count gives zero benefit
- ❌ Consumer group rebalancing temporarily pauses consumption for all consumers in the group
- ❌ Each consumer has its own memory footprint (`fetch.min.bytes`, `max.partition.fetch.bytes` buffer per partition)

---

## 5. Tuning Fetch Size (Consumer)

The consumer's fetch behavior directly controls how much data it retrieves per request to the broker.

### Configuration

```properties
# Consumer config
fetch.min.bytes=65536       # Wait until at least 64KB is available before responding (default: 1 byte)
fetch.max.wait.ms=500       # Max time broker waits to fill fetch.min.bytes (default: 500ms)
max.partition.fetch.bytes=1048576  # Max data fetched per partition per request (default: 1 MB)
max.poll.records=500        # Max messages returned per poll() call (default: 500)
```

### How Increasing `fetch.min.bytes` Helps

| Setting | Behavior | Throughput | Latency |
|---------|----------|------------|---------|
| `fetch.min.bytes=1` (default) | Respond immediately with even 1 byte | Low (many small RPCs) | Lowest |
| `fetch.min.bytes=64KB` | Broker waits to accumulate 64KB | Higher | + small delay |
| `fetch.min.bytes=1MB` | Broker accumulates 1MB before responding | Highest | + significant delay |

### Pros
- ✅ Fewer network requests between consumer and broker → lower RPC overhead
- ✅ Better CPU utilization on the consumer side (deserializing fewer but larger payloads)
- ✅ Reduces broker CPU usage on response serialization

### Cons
- ❌ Increases per-message consumption latency (because the broker waits to fill the buffer)
- ❌ Increasing `max.partition.fetch.bytes` too aggressively can cause OOM on the consumer JVM if it processes many partitions simultaneously

---

## 6. Async Producer + Callback Pattern

The default Kafka Java producer supports both synchronous and asynchronous sending. Using async aggressively enables maximum pipeline throughput.

```java
// SLOW: Synchronous send (waits for acknowledgment before next send)
producer.send(record).get();  // Blocks!

// FAST: Asynchronous send with callback
producer.send(record, (metadata, exception) -> {
    if (exception != null) {
        // Handle failure
        log.error("Failed to send to partition {}", metadata.partition(), exception);
    } else {
        log.debug("Sent to partition {}, offset {}", metadata.partition(), metadata.offset());
    }
});
// Returns immediately. Producer accumulates in buffer; network thread sends batches.
```

### Pros
- ✅ Producer thread is never blocked — it continuously pushes new messages into the in-memory buffer
- ✅ Allows the internal network thread to batch-send efficiently via `linger.ms`
- ✅ Critical for high-velocity event streams (millions of events/second)

### Cons
- ❌ Error handling is deferred — failures are reported asynchronously in the callback, requiring careful retry logic
- ❌ If the send rate exceeds the buffer capacity, `send()` will block (by default) or throw a `BufferExhaustedException` if `max.block.ms` is exceeded
- ❌ Harder to reason about message ordering guarantees if concurrent retries occur on failures

---

## 7. Broker-Side Tuning

### Log Segment Size

```properties
# Server config (server.properties / broker config)
log.segment.bytes=1073741824  # 1 GB per log segment (default: 1 GB)
```

Larger segments mean fewer active file handles and, critically, fewer `fsync` calls during segment rolls.

### OS Page Cache

Kafka is specifically designed to rely on the Linux **page cache** rather than an in-process cache. Brokers should be configured with:
- **No JVM heap > 6GB** — leave remaining RAM as page cache
- Use **XFS or ext4** with `noatime` mount flag for optimal sequential I/O

### Network Threads

```properties
# Increase if broker is I/O-saturated from many concurrent connections
num.network.threads=8    # Default: 3
num.io.threads=16        # Default: 8
```

### Pros
- ✅ Higher broker-side throughput without changing producer/consumer code
- ✅ Allows more concurrent connections and parallel I/O operations

### Cons
- ❌ Requires broker access and restart — not suitable for managed services (Confluent Cloud, MSK) without support desk tickets
- ❌ Thread count must be balanced against available CPU cores to avoid context-switch degradation

---

## Summary: Optimization Techniques at a Glance

| Technique | Throughput Gain | Latency Impact | Complexity |
|-----------|-----------------|----------------|------------|
| **Compression (zstd/lz4)** | High | Low (+CPU) | Low |
| **Batching (`linger.ms` / `batch.size`)** | High | Medium (+ms) | Low |
| **More Partitions** | High | Low | Medium |
| **More Consumer Instances** | High (up to partitions) | None | Low |
| **Fetch Size Tuning** | Medium | Medium | Low |
| **Async Producer** | High | Low | Medium |
| **Broker Tuning** | Medium | Low | High |

---

## Interview Questions

**Q1: What is the relationship between `linger.ms`, `batch.size`, and throughput?**

`linger.ms` tells the producer how long to wait to accumulate a batch before sending. `batch.size` caps the maximum size of a single batch. In practice, a batch is sent when **either** `batch.size` is reached or `linger.ms` expires, whichever comes first. Higher values for both mean fewer, larger network requests, dramatically increasing throughput while trading off latency.

**Q2: Why can't I reduce the number of partitions on an existing Kafka topic?**

Kafka is an append-only log. Removing a partition would destroy data in that partition and break existing consumer offset mappings (`consumer-offset → partition-N`). The only safe operations are to add partitions. If you need fewer partitions, create a new topic and migrate consumers to it.

**Q3: How does compression interact with batching?**

Kafka compresses at the **batch level**. The compressor is given the entire batch of raw messages at once and produces a single compressed payload. Larger batches have more redundancy for the compressor to exploit, achieving significantly higher compression ratios. This is why `compression.type` and `batch.size` / `linger.ms` are powerful together — each independently improves throughput, and they compound each other.

**Q4: When does adding more consumers stop improving throughput?**

Adding more consumers beyond the number of partitions yields zero benefit. Kafka assigns exactly one consumer per partition within a consumer group. Excess consumers will be idle and unassigned. Throughput plateau at `min(active_consumer_count, partition_count)`.

**Q5: What is the risk of setting `acks=0` or `acks=1` to improve throughput?**

Setting `acks=0` means the producer fires and forgets — zero acknowledgment from the broker. `acks=1` means only the leader partition confirms receipt. Both configurations sacrifice durability: if the broker or leader crashes immediately after acknowledgment (before replication), messages are permanently lost. For throughput-critical pipelines such as metrics telemetry where some loss is acceptable, these are valid trade-offs. For financial or transactional data, use `acks=all` with `min.insync.replicas=2`.

**Q6: What happens if `buffer.memory` is exhausted on the producer?**

If the rate of `send()` calls exceeds the rate of network transmission, the in-memory send buffer fills up. The producer will block for `max.block.ms` (default: 60 seconds) waiting for buffer space to free. If the timeout is exceeded, a `org.apache.kafka.common.errors.TimeoutException` is thrown. Solution: increase `buffer.memory`, reduce `batch.size`, or add back-pressure at the application layer.

---

## Advanced Editorial Pass

### Performance Decision Tree

```
Throughput complaint?
│
├─ Network bound? → Enable compression (zstd) + Increase linger.ms/batch.size
│
├─ Single-partition writes bottleneck? → Scale partition count
│
├─ Consumer can't keep up? → Add consumer instances (up to partition count)
│                            → Increase fetch.min.bytes + max.poll.records
│
├─ Producer blocking? → Switch to async send + increase buffer.memory
│
└─ Broker I/O saturated? → Tune num.io.threads + OS page cache size
```

### Senior-Level Insights
- **Don't optimize prematurely.** Profile first — is the bottleneck producer CPU, network bandwidth, broker disk I/O, or consumer processing time?
- **Compression is almost always free money.** Unless you're bandwidth-unlimited and CPU-constrained, enable `zstd`.
- **Page cache is your best friend.** A broker with 64GB RAM and a 4GB JVM heap has 60GB of page cache — Kafka consumers re-reading recent data will typically receive it entirely from OS page cache at memory speed.
