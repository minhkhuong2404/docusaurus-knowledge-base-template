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

> **Core concept**: Kinesis handles **real-time streaming data** — logs, metrics, IoT events, clickstreams — with multiple consumers reading the same data independently.

---

## 🔰 What Is Kinesis?

Kinesis is like a conveyor belt at an airport. Bags (data records) flow through in order, and multiple workers (consumers) can watch the same belt independently. Unlike SQS where a message goes to one consumer and is deleted, Kinesis keeps records for replay.

---

## Kinesis Services Comparison

| Service | Purpose | Retention | Management | Consumers |
|---|---|---|---|---|
| **Data Streams** | Real-time processing | 1–365 days | You manage shards | Custom (Lambda, KCL, SDK) |
| **Data Firehose** | Load to destinations | No retention (buffer only) | Fully managed | S3, Redshift, OpenSearch, Splunk, HTTP |
| **Data Analytics** | SQL/Flink on streams | N/A | Fully managed | Output to streams/destinations |

---

## Kinesis Data Streams

### Shards (Capacity Units)

| Metric | Per Shard |
|---|---|
| **Write** | 1 MB/s or 1,000 records/s |
| **Read** (standard) | 2 MB/s shared across all consumers |
| **Read** (enhanced fan-out) | 2 MB/s per consumer per shard |

**Example**: 5 MB/s ingest → need at least 5 shards

### Partition Keys

Records with the same partition key → same shard → **ordered within that shard**:

```java
KinesisClient kinesis = KinesisClient.create();

kinesis.putRecord(PutRecordRequest.builder()
    .streamName("clickstream")
    .data(SdkBytes.fromUtf8String("{\"userId\": \"U-123\", \"page\": \"/checkout\"}"))
    .partitionKey("U-123")  // All events for U-123 → same shard → ordered
    .build());
```

:::caution[Hot Shard]
If one partition key has disproportionate traffic, it creates a hot shard. Use high-cardinality keys (userId, deviceId) not low-cardinality (country, status).
:::

### Consumer Types

| Type | Throughput | Latency | Use Case |
|---|---|---|---|
| **Standard** (GetRecords) | 2 MB/s shared per shard | ~200ms | Cost-effective, fewer consumers |
| **Enhanced Fan-Out** (SubscribeToShard) | 2 MB/s dedicated per consumer per shard | ~70ms | Multiple consumers, low latency |

**Example**: 3 consumers on standard = 2 MB/s ÷ 3 = ~667 KB/s each. With enhanced fan-out = 2 MB/s each.

### Lambda ESM for Kinesis

```yaml
MyFunction:
  Type: AWS::Serverless::Function
  Properties:
    Events:
      KinesisEvent:
        Type: Kinesis
        Properties:
          Stream: !GetAtt MyStream.Arn
          StartingPosition: TRIM_HORIZON    # From beginning of stream
          BatchSize: 100
          MaximumBatchingWindowInSeconds: 5
          BisectBatchOnFunctionError: true   # Split batch on error
          MaximumRetryAttempts: 3
          DestinationConfig:
            OnFailure:
              Destination: !GetAtt FailureSNS.Arn
          ParallelizationFactor: 10         # Up to 10 Lambda per shard
          TumblingWindowInSeconds: 60       # Aggregate over 1-min windows
```

| Feature | Description |
|---|---|
| **StartingPosition** | `TRIM_HORIZON` (all records) or `LATEST` (new only) |
| **BisectBatchOnFunctionError** | Split failed batch in half to isolate bad record |
| **ParallelizationFactor** | Up to 10 concurrent Lambdas per shard |
| **TumblingWindowInSeconds** | Stateful aggregation over time windows |
| **MaximumRetryAttempts** | Retry count before sending to failure destination |

---

## Kinesis Data Firehose

```
Data Sources → Firehose → (Optional Lambda Transform) → Destination
                                                         ↓
                                        S3, Redshift, OpenSearch, Splunk, HTTP
```

| Property | Value |
|---|---|
| **Buffer size** | 1–128 MB |
| **Buffer time** | 60–900 seconds |
| **Transform** | Optional Lambda function |
| **Compression** | GZIP, Snappy, ZIP (for S3) |
| **Format conversion** | JSON → Parquet/ORC (for S3/Athena) |
| **Real-time?** | Near real-time (has buffer delay, minimum ~60s) |

---

## Kinesis vs SQS vs SNS

| Feature | Kinesis Data Streams | SQS | SNS |
|---|---|---|---|
| **Model** | Stream (ordered log) | Queue (point-to-point) | Pub/Sub (fan-out) |
| **Consumers** | Multiple (same data) | One per message | All subscribers |
| **Replay** | ✅ (up to 365 days) | ❌ | ❌ |
| **Ordering** | Per-shard | FIFO queues only | FIFO topics only |
| **Provisioning** | Manual (shards) | Automatic | Automatic |
| **Throughput** | 1 MB/s per shard write | Unlimited (standard) | Nearly unlimited |
| **Use case** | Analytics, real-time, logs | Job queues, decoupling | Alerts, fan-out |

:::tip[Exam Keyword Triggers]
- "Multiple consumers reading same data" → **Kinesis**
- "Replay data from the past" → **Kinesis**
- "Load streaming data to S3/Redshift" → **Firehose**
- "Job processing, decoupling" → **SQS**
- "Fan-out to multiple services" → **SNS + SQS**
- "Exactly-once, no replay" → **SQS FIFO**
:::

---

## Shard Operations

### Splitting (Scale Up)

```
Shard 1 (hash range 0-50) → Split → Shard 2 (0-25) + Shard 3 (26-50)
```

### Merging (Scale Down)

```
Shard 2 (0-25) + Shard 3 (26-50) → Merge → Shard 4 (0-50)
```

- Shards have a **parent-child** relationship
- Old (parent) shards remain until retention expires
- **On-Demand mode** auto-scales shards (up to 200 MB/s write default)

---

## 🏆 Best Practices

1. **High-cardinality partition keys** to avoid hot shards
2. **Enhanced Fan-Out** for multiple consumers needing dedicated throughput
3. **Firehose** instead of custom consumers for simple S3/Redshift loading
4. **BisectBatchOnFunctionError** with Lambda to isolate poison pills
5. **On-Demand capacity mode** to avoid manual shard management
6. **ParallelizationFactor** for Lambda to increase per-shard parallelism

---

## 🎯 DVA-C02 Exam Tips

:::tip[Kinesis Exam Cheat Sheet]
1. **1 shard** = 1 MB/s write, 2 MB/s read
2. **Same partition key** → same shard → ordered
3. **Enhanced Fan-Out** = dedicated 2 MB/s per consumer
4. **Firehose** = fully managed, near-real-time delivery to S3/Redshift
5. **Data Streams** retain data; **Firehose** does not
6. **Replay** = only Kinesis Data Streams (not SQS, not Firehose)
7. **BisectBatchOnFunctionError** = split batch to find bad record
8. **ParallelizationFactor** = up to 10 concurrent Lambdas per shard
9. **On-Demand** auto-scales shards (no manual management)
10. **Retention**: default 24h, max 365 days
:::

---

## Practice Questions

**Q1.** IoT platform: 5 MB/s sensor data, multiple analytics apps need same data, replay last 7 days. Best service?

A) SQS Standard  
B) SQS FIFO  
C) **Kinesis Data Streams**  
D) SNS  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — Kinesis supports multiple consumers, data retention for replay, and ordered processing. Need ≥5 shards for 5 MB/s.
</details>

---

**Q2.** Load clickstream data to S3 every 5 minutes. Least operational overhead?

A) Kinesis Data Streams + Lambda  
B) **Kinesis Data Firehose**  
C) SQS + Lambda  
D) Kinesis Data Analytics  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — Firehose is fully managed, handles buffering and S3 delivery natively. No shards or consumers to manage.
</details>

---

**Q3.** Lambda processes Kinesis records. One poison-pill record causes the entire batch to fail. How to isolate it?

A) Increase batch size  
B) **Enable BisectBatchOnFunctionError**  
C) Use FIFO  
D) Increase shard count  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — `BisectBatchOnFunctionError` splits the failed batch in half recursively until the bad record is isolated.
</details>

---

**Q4.** 3 consumers read from a 5-shard stream. Each consumer needs at least 2 MB/s per shard. What to enable?

A) Add more shards  
B) **Enhanced Fan-Out**  
C) Increase buffer size  
D) ParallelizationFactor  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — Standard mode shares 2 MB/s across all consumers. Enhanced Fan-Out gives each consumer dedicated 2 MB/s per shard.
</details>

---

## 🔗 Resources

- [Kinesis Data Streams Developer Guide](https://docs.aws.amazon.com/streams/latest/dev/)
- [Kinesis Data Firehose Guide](https://docs.aws.amazon.com/firehose/latest/dev/)
- [Lambda with Kinesis](https://docs.aws.amazon.com/lambda/latest/dg/with-kinesis.html)
- [Kinesis Client Library (KCL)](https://docs.aws.amazon.com/streams/latest/dev/shared-throughput-kcl-consumers.html)
