---
id: kinesis
title: Amazon Kinesis
sidebar_label: "🌊 Kinesis"
description: >
  Kinesis Data Streams vs Kinesis Data Firehose vs Kinesis Data Analytics.
  Shards, partition keys, sequence numbers, Enhanced Fan-Out, Lambda ESM,
  and when to use Kinesis vs SQS.
tags:
  - kinesis
  - streaming
  - real-time
  - data-streams
  - firehose
  - shards
  - dva-c02
  - domain-1
---

# Amazon Kinesis

> **Core concept**: Kinesis handles **real-time streaming data** — logs, metrics, IoT events, clickstreams.

---

## Kinesis Services Comparison

| Service | Purpose | Retention | Consumers |
|---|---|---|---|
| **Data Streams** | Real-time stream processing | 1–365 days | Custom (Lambda, KCL, SDK) |
| **Data Firehose** | Load streaming data to destinations | No retention | Managed destinations only |
| **Data Analytics** | SQL / Apache Flink on streams | N/A | Output to streams/destinations |

---

## Kinesis Data Streams

### Shards

- **1 shard** = 1 MB/s write, 2 MB/s read, 1,000 records/s
- Add shards to scale (Shard Splitting)
- Remove shards to reduce cost (Shard Merging)

### Partition Keys

```java
// Records with same partition key → same shard (ordered within shard)
PutRecordRequest request = PutRecordRequest.builder()
    .streamName("clickstream")
    .data(SdkBytes.fromUtf8String(jsonData))
    .partitionKey(userId)  // Same userId → same shard → ordered
    .build();
```

### Consumers

| Type | Read throughput | Description |
|---|---|---|
| **Standard** | 2 MB/s shared across all consumers | Pull-based, cheaper |
| **Enhanced Fan-Out** | 2 MB/s per consumer per shard | Push-based, dedicated throughput |

### Lambda ESM for Kinesis

- Lambda polls shards automatically
- **Bisect on error**: splits failed batches
- **Tumbling windows**: aggregate records over a time window
- Iterator position: `TRIM_HORIZON` (from beginning) or `LATEST`

---

## Kinesis vs SQS

| Aspect | Kinesis Data Streams | SQS |
|---|---|---|
| **Order** | Per-shard ordering | FIFO only |
| **Multiple consumers** | ✅ All consumers read the same stream | ❌ One consumer per message |
| **Replay** | ✅ Up to retention period | ❌ Message deleted after processing |
| **Real-time** | ✅ Sub-second | Near real-time |
| **Provisioning** | Manual (shards) | Automatic |
| **Use case** | Analytics, metrics, logs | Task queues, job processing |

:::tip Kinesis vs SQS keyword triggers
- "Multiple applications consume same data" → **Kinesis**
- "Replay data from the past" → **Kinesis**
- "Job processing, decoupling" → **SQS**
- "Exactly-once, ordering required, no replay" → **SQS FIFO**
:::

---

## Kinesis Data Firehose

- Fully managed — no shards to manage
- Destinations: **S3, Redshift, OpenSearch, Splunk, HTTP endpoints**
- **Buffering**: by size (1–128 MB) or time (60–900 seconds)
- Can transform data with Lambda before delivery
- Near-real-time (not real-time — has buffer delay)

---

## 🧪 Practice Questions

**Q1.** An IoT platform generates 5 MB/s of sensor data. Multiple analytics applications need to read the same data simultaneously and replay data from the last 7 days. What service fits best?

A) SQS Standard  
B) SQS FIFO  
C) Kinesis Data Streams  
D) SNS  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — **Kinesis Data Streams** supports multiple consumers reading the same data independently, with data retention (configurable up to 365 days) enabling replay. SQS doesn't support multiple consumers or replay.
</details>

---

**Q2.** You need to load streaming clickstream data into S3 every 5 minutes for batch analytics. Which service requires the least operational overhead?

A) Kinesis Data Streams + custom Lambda  
B) Kinesis Data Firehose  
C) SQS + Lambda  
D) Kinesis Data Analytics  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — **Kinesis Data Firehose** is fully managed, handles buffering and S3 delivery natively, with no shards or consumers to manage. It's purpose-built for this use case.
</details>

---

## 🔗 Resources

- [Kinesis Data Streams Developer Guide](https://docs.aws.amazon.com/streams/latest/dev/)
- [Kinesis Data Firehose Guide](https://docs.aws.amazon.com/firehose/latest/dev/)
- [Kinesis Client Library (KCL)](https://docs.aws.amazon.com/streams/latest/dev/shared-throughput-kcl-consumers.html)
