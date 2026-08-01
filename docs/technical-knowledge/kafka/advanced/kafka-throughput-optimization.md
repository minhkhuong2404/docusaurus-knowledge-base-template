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

:::tip[Best Practice]
Set `linger.ms=20` and `batch.size=65536` (64KB) as a starting point. For maximum throughput workloads like analytics pipelines, push `linger.ms` to 50–100ms.
:::

---

## 3. Increasing Partition Count

**Partitions are the unit of Kafka parallelism.** More partitions enable more producers to write in parallel and more consumer instances to read in parallel simultaneously.

### How Partitions Drive Throughput

### Senior-Level Insights
- **Don't optimize prematurely.** Profile first — is the bottleneck producer CPU, network bandwidth, broker disk I/O, or consumer processing time?
- **Compression is almost always free money.** Unless you're bandwidth-unlimited and CPU-constrained, enable `zstd`.
- **Page cache is your best friend.** A broker with 64GB RAM and a 4GB JVM heap has 60GB of page cache — Kafka consumers re-reading recent data will typically receive it entirely from OS page cache at memory speed.
