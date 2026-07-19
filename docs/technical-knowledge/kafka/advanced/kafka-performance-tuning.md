---
id: kafka-performance-tuning
title: Kafka Performance Tuning Guide
sidebar_label: Performance Tuning Guide
description: End-to-end Kafka performance tuning — producer batching, broker I/O, consumer throughput, JVM and OS tuning, compression selection, tiered storage, and benchmarking methodology.
tags:
- technical-knowledge
- kafka
- advanced
- performance
- tuning
---

# Kafka Performance Tuning Guide

Kafka's default configuration is deliberately conservative — optimized for correctness and compatibility, not peak throughput. In production, the difference between default settings and a tuned cluster can be **5–10×** in throughput and **50–80%** in latency.

This guide walks through every layer of the Kafka stack — producer, broker, consumer, OS, and JVM — with concrete configuration recommendations and the reasoning behind each.

---

## The Performance Mental Model

Performance problems in Kafka fall into four root causes:

```
┌─────────────────────────────────────────────────────┐
│              Kafka Performance Bottlenecks           │
├─────────────┬──────────────────────────────────────-┤
│ Layer       │ Typical Root Cause                     │
├─────────────┼────────────────────────────────────────┤
│ Producer    │ Small batches, no compression,         │
│             │ synchronous sends, wrong acks setting  │
├─────────────┼────────────────────────────────────────┤
│ Network     │ Insufficient bandwidth, no compression,│
│             │ too many TCP connections               │
├─────────────┼────────────────────────────────────────┤
│ Broker      │ Disk I/O saturation, GC pauses,        │
│             │ too many partitions, page cache misses │
├─────────────┼────────────────────────────────────────┤
│ Consumer    │ Slow processing, single-threaded,      │
│             │ too-frequent commits, DLQ overhead     │
└─────────────┴────────────────────────────────────────┘
```

Identify your bottleneck first using metrics (broker JMX, producer/consumer metrics), then tune the right layer.

---

## Producer Tuning

### Batching: The Biggest Lever

The producer accumulates messages in a `RecordAccumulator` before sending. Larger batches = less network overhead per message = higher throughput.

```properties
# Default → tuned for throughput
linger.ms=0               →  linger.ms=10        # Wait up to 10ms to fill batches
batch.size=16384          →  batch.size=65536     # 64 KB batches (from 16 KB default)
buffer.memory=33554432    →  buffer.memory=67108864  # 64 MB buffer pool
```

**Effect**: With `linger.ms=10` and `batch.size=64KB`, a producer processing 10,000 msg/sec might reduce network requests by 80%, significantly improving throughput.

**Trade-off**: `linger.ms=10` adds up to 10ms of latency per message. Acceptable for batch pipelines; unacceptable for interactive/transactional workloads.

### Compression

Compression reduces network I/O and broker disk usage — the dominant bottleneck for most workloads.

| Algorithm | CPU Cost | Compression Ratio | Throughput |
|-----------|---------|------------------|------------|
| `none` | 0 | 1.0× | Baseline |
| `snappy` | Low | 2–3× | Excellent ✅ |
| `lz4` | Very low | 2–3× | Excellent ✅ |
| `zstd` | Medium | 3–5× | Best ratio ✅ (Kafka 4.0+ default for internal topics) |
| `gzip` | High | 3–5× | Poor throughput ❌ |

```properties
# Recommended for most production workloads
compression.type=lz4     # Best latency-to-compression trade-off
# or
compression.type=zstd    # Best compression ratio (Kafka 4.0+)
```

**Real-world impact**: Enabling `lz4` on a 1 Gbps network with JSON payloads typically delivers 2–3× effective throughput increase.

### Delivery Acknowledgment (`acks`)

| Setting | Latency | Durability | Use Case |
|---------|---------|------------|---------|
| `acks=0` | Lowest | None (fire-and-forget) | Metrics, telemetry (loss acceptable) |
| `acks=1` | Low | Leader only | Default; single-broker loss causes data loss |
| `acks=all` | Higher | All ISR replicas | Financial, critical data |

```properties
# High-throughput analytics (some loss acceptable)
acks=1
linger.ms=20
batch.size=65536

# Critical data (payments, inventory)
acks=all
enable.idempotence=true
linger.ms=5
batch.size=32768
```

### In-Flight Requests

```properties
# Default: 5 — allows pipeline of up to 5 unacked batches
max.in.flight.requests.per.connection=5

# With idempotence enabled:
# ✅ Safe to use up to 5 — Kafka ensures ordering via sequence numbers
enable.idempotence=true
max.in.flight.requests.per.connection=5

# Without idempotence, ordering requires:
max.in.flight.requests.per.connection=1  # Kills throughput — avoid unless necessary
```

### Producer Configuration Template

```java
// High-throughput, at-least-once (analytics/events)
Map<String, Object> highThroughputProps = Map.of(
    ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "kafka:9092",
    ProducerConfig.ACKS_CONFIG, "1",
    ProducerConfig.LINGER_MS_CONFIG, 20,
    ProducerConfig.BATCH_SIZE_CONFIG, 65536,
    ProducerConfig.BUFFER_MEMORY_CONFIG, 67108864L,
    ProducerConfig.COMPRESSION_TYPE_CONFIG, "lz4",
    ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, 5
);

// Low-latency, exactly-once (payments/orders)
Map<String, Object> lowLatencyProps = Map.of(
    ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "kafka:9092",
    ProducerConfig.ACKS_CONFIG, "all",
    ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true,
    ProducerConfig.LINGER_MS_CONFIG, 1,
    ProducerConfig.BATCH_SIZE_CONFIG, 16384,
    ProducerConfig.COMPRESSION_TYPE_CONFIG, "snappy",
    ProducerConfig.RETRIES_CONFIG, Integer.MAX_VALUE,
    ProducerConfig.DELIVERY_TIMEOUT_MS_CONFIG, 120000
);
```

---

## Broker Tuning

### Disk I/O: The Core Bottleneck

Kafka's write path is a **sequential append** to a log file — one of the fastest disk operations. But random reads (during consumer catch-up or replication) and full-disk scenarios degrade performance severely.

```properties
# Use multiple log directories across multiple disks
log.dirs=/data/kafka-1,/data/kafka-2,/data/kafka-3

# Kafka distributes partitions across log dirs — more disks = more I/O parallelism
```

**Storage recommendations:**
- Use **NVMe SSDs** for log directories — not HDDs, not network-attached storage (NAS/NFS)
- Separate Kafka data from OS disk
- RAID 10 for redundancy + performance (Kafka replication makes RAID less critical for durability)
- XFS filesystem — better performance than ext4 for Kafka's write pattern

### Page Cache: The Free Tier of Performance

Kafka relies heavily on the OS **page cache** to serve consumer reads — recently produced data is served from RAM, not disk. This is why Kafka brokers should have large RAM but don't need huge JVM heaps.

```bash
# JVM heap (keep small — leave RAM for page cache!)
export KAFKA_HEAP_OPTS="-Xmx6g -Xms6g"

# Recommended: 6–8 GB JVM, rest to OS page cache
# On a 32 GB machine: JVM=6GB, OS page cache gets ~24GB
```

**Rationale**: If broker JVM uses 24 GB, the page cache shrinks to 6 GB — active consumers will hit disk instead of RAM, causing latency spikes.

### Network Tuning

```properties
# Number of threads handling network requests
num.network.threads=8       # default: 3; set to ~num CPUs / 2

# Number of threads handling I/O requests
num.io.threads=16           # default: 8; set to ~num CPUs

# Socket buffer sizes
socket.send.buffer.bytes=102400      # 100 KB
socket.receive.buffer.bytes=102400   # 100 KB
socket.request.max.bytes=104857600   # 100 MB max request
```

### Replication Tuning

```properties
# Replication fetch size (default 1MB — increase for high-throughput topics)
replica.fetch.max.bytes=10485760      # 10 MB

# Time before a lagging follower is removed from ISR (default 30s)
replica.lag.time.max.ms=30000

# Number of threads for replication
num.replica.fetchers=4               # default: 1; increase for multi-disk or high-replication
```

### Request Handler Threads

Monitor `RequestHandlerAvgIdlePercent` via JMX. If it drops below 0.2 (20%), the broker is CPU-bound.

```properties
# Default: 8 — increase if RequestHandlerAvgIdlePercent is consistently < 0.2
num.io.threads=16
```

---

## Consumer Tuning

### Fetch Size and Parallelism

```properties
# Consumer fetch configuration
fetch.min.bytes=1              # Default: 1 byte — too small, causes frequent small fetches
fetch.min.bytes=1048576        # 1 MB: wait for 1 MB before returning (higher throughput)
fetch.max.wait.ms=500          # Max time to wait for min bytes
max.partition.fetch.bytes=10485760  # 10 MB per partition per fetch

max.poll.records=500           # Default: 500; increase for batch-heavy processing
```

### Concurrency Model

```java
// Spring Kafka: multiple concurrent consumers per application instance
@Bean
public ConcurrentKafkaListenerContainerFactory<String, OrderEvent> factory() {
    var factory = new ConcurrentKafkaListenerContainerFactory<String, OrderEvent>();
    factory.setConsumerFactory(consumerFactory());
    factory.setConcurrency(6);  // 6 consumer threads = up to 6 partitions
    return factory;
}
```

**Rule**: `concurrency` per instance × number of instances ≤ number of partitions. Beyond that, consumers sit idle.

### Commit Strategy

```properties
# Async commit (default) — faster but potential duplicate on crash
enable.auto.commit=true
auto.commit.interval.ms=5000

# Manual commit (recommended for exactly-once processing)
enable.auto.commit=false
```

```java
// Manual commit after successful processing batch
@KafkaListener(topics = "orders", groupId = "order-service")
public void listen(List<ConsumerRecord<String, OrderEvent>> records, Acknowledgment ack) {
    processBatch(records);
    ack.acknowledge();  // Commit only after successful processing
}
```

### Polling Timeouts

```properties
# session.timeout.ms: how long before coordinator marks consumer dead
session.timeout.ms=30000     # 30s: increase for slow processing environments

# max.poll.interval.ms: max time between poll() calls before being kicked from group
max.poll.interval.ms=300000  # 5 min: increase if batch processing takes long

# heartbeat.interval.ms: must be < session.timeout.ms / 3
heartbeat.interval.ms=10000  # 10s
```

**Common pitfall**: Processing takes > `max.poll.interval.ms` → consumer is kicked from group → rebalance triggers → processing resumes → rebalance again → rebalance storm. Fix: increase `max.poll.interval.ms` or reduce `max.poll.records`.

---

## OS-Level Tuning

### Linux Kernel Parameters

```bash
# /etc/sysctl.conf — persist across reboots

# Increase socket buffers
net.core.rmem_max=134217728
net.core.wmem_max=134217728
net.ipv4.tcp_rmem=4096 65536 134217728
net.ipv4.tcp_wmem=4096 65536 134217728

# Dirty page writeback (critical for Kafka sequential writes)
vm.dirty_ratio=80               # 80% of RAM can be dirty before blocking I/O
vm.dirty_background_ratio=5     # Background flush starts at 5% dirty
vm.swappiness=1                 # Minimize swap usage (Kafka hates swap)

# File descriptors (each partition = multiple file handles)
fs.file-max=1000000
```

```bash
# /etc/security/limits.conf
kafka soft nofile 100000
kafka hard nofile 100000
```

### Filesystem Mount Options

```bash
# /etc/fstab — XFS with noatime (skip access time updates = less I/O)
/dev/nvme0n1 /data/kafka xfs defaults,noatime 0 0
```

---

## JVM Tuning

Kafka brokers run on the JVM. GC pauses cause latency spikes and can trigger ISR shrinkage.

```bash
# Recommended JVM flags for Kafka brokers (ZGC for low-latency)
export KAFKA_JVM_PERFORMANCE_OPTS="-server \
  -XX:+UseZGC \
  -XX:MaxGCPauseMillis=20 \
  -XX:InitiatingHeapOccupancyPercent=35 \
  -XX:+ExplicitGCInvokesConcurrent \
  -Djava.awt.headless=true"
```

**GC Algorithm Selection:**

| GC | Max Pause | Best For |
|----|-----------|---------| 
| **ZGC** (Kafka 4.0+ default) | < 10ms | Low-latency production |
| **G1GC** | 20–200ms | Balanced; Kafka 3.x default |
| **ParallelGC** | 100ms+ | Throughput over latency (batch) |

```bash
# Heap sizing (keep small for page cache)
-Xms6g -Xmx6g  # 6 GB on a 32 GB machine
```

---

## Performance Benchmarking

Always benchmark before and after tuning to measure actual impact.

```bash
# Producer throughput benchmark
kafka-producer-perf-test.sh \
  --topic perf-test \
  --num-records 10000000 \
  --record-size 1024 \
  --throughput -1 \
  --producer-props \
    bootstrap.servers=localhost:9092 \
    acks=1 \
    compression.type=lz4 \
    batch.size=65536 \
    linger.ms=10

# Expected output:
# 10000000 records sent, 584795.3 records/sec (571.09 MB/sec), 6.6 ms avg latency

# Consumer throughput benchmark
kafka-consumer-perf-test.sh \
  --bootstrap-server localhost:9092 \
  --topic perf-test \
  --messages 10000000 \
  --group perf-consumer

# Expected output:
# MB.sec  nMsg.sec  rebalance.time  fetch.time  fetch.MB.sec
# 520.00  534000    3000            29000       520.00
```

---

## Tiered Storage and Performance (Kafka 3.6+)

Tiered storage offloads cold segments to object storage (S3, GCS, Azure Blob), reducing broker disk requirements. Performance implications:

```properties
# Enable tiered storage
remote.log.storage.system.enable=true
remote.log.manager.task.interval.ms=60000

# Local retention (hot data on broker SSD)
local.retention.ms=86400000    # Keep 1 day locally for fast consumer access
local.retention.bytes=21474836480  # 20 GB local per partition

# Remote retention (cold data in object storage)
retention.ms=604800000         # Total retention: 7 days
```

**Performance trade-offs with tiered storage:**
- Consumers catching up from cold segments read from object storage (higher latency)
- Active consumers reading recent data use page cache (unaffected)
- Log compaction only runs on local segments — remote segments retain all historical versions

---

## Performance Tuning Quick Reference

| Setting | Conservative (Default) | Throughput Optimized | Low Latency |
|---------|----------------------|---------------------|-------------|
| `linger.ms` | 0 | 20 | 1 |
| `batch.size` | 16 KB | 64–128 KB | 16 KB |
| `compression.type` | none | lz4/zstd | snappy |
| `acks` | 1 | 1 | all |
| `fetch.min.bytes` | 1 | 1 MB | 1 |
| `max.poll.records` | 500 | 2000 | 100 |
| `num.io.threads` | 8 | num_cpus | 8 |
| `num.network.threads` | 3 | num_cpus/2 | 4 |

---

## Interview Questions

**Q: What is the most impactful producer tuning for throughput?**

> Batching and compression together have the highest impact. Setting `linger.ms=10–20` and `batch.size=64KB` allows the producer to accumulate more messages per batch, dramatically reducing per-message overhead. Adding `compression.type=lz4` or `zstd` then multiplies effective throughput by 2–5× by reducing network bandwidth and disk I/O. The `buffer.memory` should also be increased to match — if the buffer fills up, the producer blocks.

**Q: Why should Kafka broker JVM heap be kept small?**

> Kafka's read path for consumers that are nearly caught up is served from the OS page cache — recently written segments are already in RAM. The larger the page cache, the more consumer reads are served from memory instead of disk. If the JVM heap consumes most of a broker's RAM (e.g., 24 GB on a 32 GB machine), the page cache shrinks, causing consumer reads to hit disk, significantly increasing latency. The recommended pattern is 6–8 GB JVM heap and leaving the rest for the OS page cache.

**Q: What causes `max.poll.interval.ms` timeouts and how do you fix them?**

> When a consumer's message processing takes longer than `max.poll.interval.ms` (default 5 minutes), the group coordinator assumes the consumer has died and triggers a rebalance. This typically happens when: processing is slow (external DB calls, heavy computation), `max.poll.records` is set too high (processing 500 records takes > 5 min), or a poison message causes indefinite retry loops. Fixes: increase `max.poll.interval.ms` for slow-but-correct processors; reduce `max.poll.records` so each batch completes faster; or process records asynchronously within the poll loop and commit only after completion.

**Q: How does compression affect Kafka performance end-to-end?**

> Compression is applied at the producer, sent compressed to the broker (the broker stores it compressed), and decompressed at the consumer. This reduces: network bandwidth between producer and broker (2–5× less data), broker disk usage (2–5× smaller logs), network bandwidth between broker and consumer, and consequently page cache efficiency (more compressed segments fit in cache). The CPU cost is modest on modern hardware: `lz4` and `snappy` have negligible overhead; `zstd` has slightly higher CPU usage but achieves the best compression ratios.

---

## Related Topics

- [Kafka Throughput Optimization](./kafka-throughput-optimization.md) — Deep dive into compression and batching
- [Monitoring & Operations](./monitoring-operations.md) — JMX metrics for identifying bottlenecks
- [Partitioning Strategies](../core/kafka-partitioning-strategies.md) — Partition count and hot key tuning
- [Replication & ISR](../core/replication.md) — Replication overhead and `min.insync.replicas` trade-offs

## Sources

1. [Apache Kafka Documentation: Configuration](https://kafka.apache.org/documentation/#configuration)
2. [Conduktor Glossary: Kafka Performance Tuning](https://www.conduktor.io/glossary/kafka-performance-tuning-guide)
3. [LinkedIn Engineering: Kafka Performance](https://engineering.linkedin.com/kafka/kafka-linkedin-our-journey)
4. Narkhede, N., Shapira, G., & Palino, T. — *Kafka: The Definitive Guide* (O'Reilly), Chapter 4
