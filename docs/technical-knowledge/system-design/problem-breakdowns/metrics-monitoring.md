---
id: metrics-monitoring
title: Design a Large-Scale Metrics Monitoring System Like Datadog
sidebar_label: 29. Metrics Monitoring (Datadog)
description: Staff-level system design breakdown for a time-series metrics ingestion, TSDB storage, Gorilla compression, and alerting platform like Datadog or Prometheus.
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design a Large-Scale Metrics Monitoring System Like Datadog

A distributed metrics monitoring and alerting system (e.g., Datadog, Prometheus, Amazon CloudWatch, VictoriaMetrics) continuously ingests, compresses, stores, and queries time-series telemetry metrics (CPU utilization, memory usage, request counts, latencies) emitted by millions of servers, containers, and microservices. The system must support high-frequency write ingestion, fast analytical range queries (PromQL), automated downsampling rollups, and real-time alert rule evaluations.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Metrics Telemetry Ingestion**: Ingest counters, gauges, and histograms emitted by agents or OpenTelemetry collectors at regular intervals (e.g. every 10–15 seconds).
2. **Multi-Dimensional Tagging**: Support querying metrics filtered by key-value label tags (e.g. `service="checkout"`, `env="prod"`, `region="us-east-1"`).
3. **Time-Series Query Engine**: Support fast analytical PromQL/SQL range queries (rates, sums, percentiles, moving averages) for live dashboards.
4. **Automated Downsampling & Retention**: Retain high-resolution raw data (10s) for 7 days; automatically roll up into 1-minute aggregates for 30 days, and 1-hour aggregates for 1 year.
5. **Real-Time Alert Rule Evaluation**: Continuously evaluate alerting thresholds (e.g., *"Fire PagerDuty alert if CPU > 90% for 5 consecutive minutes"*).

### Non-Functional Requirements
- **Extreme Write Throughput**: Ingest and compress **Millions of metric data points per second**.
- **Low Query Latency**: Dashboard graph queries over the past 24 hours must load in `< 500ms`.
- **Exceptional Compression Ratio**: Minimize storage footprint; raw float samples compressed to `< 1.5 bytes per sample` using Gorilla compression.
- **High Ingestion Availability**: Telemetry ingestion must never block client applications; metric drops during catastrophic network partitions are preferred over application downtime.

### Capacity Estimations & Sizing (Enterprise Scale)
- **Monitored Entities**: 100,000 servers/containers.
- **Metrics per Entity**: 500 unique metric time series per server.
  - Total Active Time Series = $100,000 \times 500 = \mathbf{50\text{ Million active series}}$.
- **Sampling Interval**: 10 seconds.
- **Ingestion Throughput**:
  - $50,000,000 / 10\text{ seconds} = \mathbf{5\text{ Million data points/sec}}$ continuous write load!
- **Storage Sizing (With Gorilla Compression)**:
  - Uncompressed sample: `timestamp` (8 bytes) + `value` (8 bytes) = 16 bytes.
  - Gorilla compressed sample: **~1.5 bytes per sample** (over 90% compression!).
  - Daily Ingress Storage = $5\text{M points/sec} \times 86,400 \times 1.5\text{ bytes} \approx$ **648 GB / day**.
  - 1-Year Storage (accounting for downsampling after 7 days) $\approx$ **45 Terabytes (TB)** across the TSDB cluster.

---

## 2. The Set Up

### Defining the Time-Series Data Model

```
┌────────────────────────────────────────────────────────────────────────┐
│                        METRIC TIME-SERIES MODEL                        │
├────────────────────────────────────────────────────────────────────────┤
│ Metric Name: http_requests_total                                       │
│ Labels / Tags: {service="payment", env="prod", region="us-east-1"}     │
│ Samples:                                                               │
│   (1774301980, 14205.0)                                                │
│   (1774301990, 14218.0)                                                │
│   (1774302000, 14235.0)                                                │
└────────────────────────────────────────────────────────────────────────┘
```

### The API Design

#### 1. Ingest Metrics Batch (Agent to Gateway)
```http
POST /api/v1/metrics/ingest
Content-Type: application/x-protobuf
Content-Encoding: snappy

// Protobuf Payload: Array of MetricSeries
message MetricSample {
  string metric_name = 1;
  map<string, string> labels = 2;
  int64 timestamp_ms = 3;
  double value = 4;
}
```
**Response (`204 No Content`)**: Processed asynchronously.

#### 2. Query Metrics Range (PromQL / Dashboard)
```http
GET /api/v1/query_range?query=sum(rate(http_requests_total[5m]))+by+(service)&start=1774215580&end=1774301980&step=60
```
**Response (`200 OK`)**:
```json
{
  "status": "success",
  "data": {
    "resultType": "matrix",
    "result": [
      {
        "metric": {"service": "payment"},
        "values": [
          [1774215580, "420.5"],
          [1774215640, "438.2"]
        ]
      }
    ]
  }
}
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="stream-analytics" title="Datadog Metrics Ingestion, TSDB Gorilla Compression & Alerting Topology" />

### Walkthrough of the Time-Series Pipeline

#### 1. Ingestion & Sharding
1. Monitored hosts and pods run a local **Datadog / OpenTelemetry Agent**.
2. Agents batch metric samples every 10 seconds, compress using Snappy, and transmit to the **Metrics Ingestion Gateway**.
3. The Gateway computes the **Series Hash**:
   $\text{Series ID} = \text{MurmurHash3}(\text{metric\_name} + \text{sorted\_labels})$.
4. Routes samples to an **Apache Kafka Cluster** partitioned by `Series ID`.

#### 2. Time-Series Storage Engine (TSDB Internals)
1. **TSDB Ingestion Workers** consume from Kafka:
   - Holds an in-memory **Memtable Buffer** storing active 2-hour chunk blocks for each time series.
   - Encodes data points using **Facebook Gorilla Compression**:
     - *Timestamps*: Delta-of-deltas compression (most timestamps compress to a single 0-bit!).
     - *Floating Point Values*: XOR floating-point compression against the preceding sample.
2. Every **2 hours**, the in-memory chunk is closed, serialized into an immutable block file, and flushed to local NVMe SSD / S3.

#### 3. Downsampling & Query Serving
1. A **Compactor Worker** reads raw 2-hour blocks from storage:
   - Blocks older than 7 days are aggregated into 1-minute resolution chunks (min, max, sum, count).
   - Blocks older than 30 days are aggregated into 1-hour resolution chunks.
2. When an engineer queries a Grafana dashboard:
   - The **Query Coordinator** inspects the requested time window:
     - For the past 6 hours $\implies$ Queries raw 10-second blocks.
     - For the past 6 months $\implies$ Queries 1-hour downsampled rollups!
   - Returns graph data in `< 200ms` without scanning billions of raw points.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Gorilla Time-Series Compression (Under the Hood)
How does Facebook's Gorilla compression reduce an 8-byte timestamp and an 8-byte float down to **1.37 bytes** per sample?

```
TIMESTAMP DELTA-OF-DELTAS COMPRESSION:
Most metrics arrive at regular intervals (e.g. exactly every 10 seconds):
Time t0 = 1000
Time t1 = 1010 (Delta D1 = 10)
Time t2 = 1020 (Delta D2 = 10)
Delta-of-Deltas = D2 - D1 = 10 - 10 = 0!

If Delta-of-Deltas == 0:
➔ Store a SINGLE BIT: '0'!
➔ An 8-byte (64-bit) timestamp is encoded in EXACTLY 1 BIT!

FLOATING POINT XOR COMPRESSION:
If value v1 = 45.0 and value v2 = 45.0 (unchanged metric):
➔ v1 XOR v2 = 0x0000000000000000
➔ Store a SINGLE BIT: '0'!
Even when values change slightly, the leading and trailing zeroes in the XOR
IEEE 754 floating point representation are stripped, consuming only 4-8 bits!
```

### Deep Dive 2: Inverted Indexing for High-Cardinality Labels
What happens when a developer tags a metric with a unique `user_id` or random `request_id` (High Cardinality)?

- **The High-Cardinality Trap**:
  - TSDB engines maintain an inverted index mapping: `label_key:label_value -> List<Series_ID>`.
  - If a metric includes `request_id`, it generates **100 Million distinct time series**!
  - The inverted index explodes, exhausts RAM, and slows down every query.
- **Production Defense**:
  1. **Strict Tag Validation**: Reject high-cardinality label keys at the ingestion gateway using pre-configured schema whitelists.
  2. **Decoupled Metric Index**: The inverted index is stored in a specialized memory-mapped Lucene / Roaring Bitmap index, allowing fast label intersections (`env="prod" AND service="checkout"`).

### Deep Dive 3: Real-Time Alert Evaluation (Evaluating 500,000 Rules/min)
How does Datadog evaluate 500,000 customer alerting conditions continuously without lagging behind real-time?
- **The Scheduled Pull Hazard**: Running 500,000 full PromQL queries against the TSDB every minute will saturate storage disks.
- **Streaming Alert Rule Evaluation Engine**:
  - Alert rules are compiled into in-memory streaming operators.
  - As metric points arrive from Kafka, they are evaluated **inline in the streaming pipeline**.
  - A sliding window state tracker (maintained in memory or Redis) tracks consecutive failure counts.
  - When the condition triggers ($N$ consecutive breaches), an alert payload is dispatched to the **Alert Notification Worker** immediately, completely bypassing the disk query engine!

---

## 5. Architectural Trade-Off Matrix

| Design Area | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Ingestion Protocol** | Pull Model (Prometheus Scraping) | Push Model (Datadog Agent / OTel) | **Push Model**: In dynamic ephemeral environments (AWS Lambda, auto-scaled K8s pods), short-lived containers disappear before a pull scraper can discover them. Push guarantees instant telemetry delivery. |
| **Data Compression** | Generic Gzip / Snappy | Specialized Gorilla TSDB Encoding | **Gorilla Encoding**: Achieves 12:1 compression ratio (1.37 bytes/sample), reducing cluster RAM and SSD costs by over 90%. |
| **Storage Architecture** | Generic Relational DB (PostgreSQL) | LSM-Tree Time-Series Engine (TSDB) | **TSDB (LSM-Tree)**: Sequential append-only chunk writing with automatic time-based partition dropping and downsampling compactions. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Identifies the basic time-series metric data model (Metric, Labels, Timestamp, Value).
- Compares Push vs Pull ingestion models.
- Designs schemas for raw metrics and aggregated downsamples.
- Understands basic threshold-based alerting.

### Senior (L5 / IC5)
- Explains the **Gorilla Compression Algorithm** (Delta-of-Deltas for timestamps, XOR for floats).
- Identifies the high-cardinality label trap and explains Roaring Bitmap inverted indexing.
- Details the automated downsampling compaction lifecycle (Raw $\to$ 1m $\to$ 1h).
- Implements streaming alert evaluation to prevent disk query saturation.

### Staff+ (L6 / Principal)
- Evaluates multi-tenant isolation: Preventing a runaway microservice emitting 10M new time-series tags from crashing the shared monitoring cluster.
- Designs multi-datacenter active-active TSDB replication with local query federations (e.g. Thanos / Cortex architecture).
- Solves clock drift across 100,000 distributed agent hosts: Applying time-boundary clamping to incoming samples to prevent corrupting time-series chunk block boundaries.
