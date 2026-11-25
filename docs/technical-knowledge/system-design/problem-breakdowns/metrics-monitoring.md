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

---

## 7. Production Deep Dives: Metric Semantics, OTel Pipelines & SLO Burn Rates

> **Reference**: [Sujeet Pro — Distributed Monitoring Systems](https://sujeet.pro/articles/distributed-monitoring)

### 1. Metric Types & Accurate Fleet-Wide Percentile Aggregation
A monitoring system cannot treat all numerical telemetry identically. At the ingestion and query layers, metrics fall into four distinct mathematical structures:
- **Counters**: Monotonically non-decreasing cumulative totals (`http_requests_total`). Query engines must detect counter resets (when a pod restarts and drops from `45,000` to `0`) and extrapolate slopes via `rate()` or `increase()`.
- **Gauges**: Point-in-time measurements (`memory_in_use_bytes`, `active_connections`) that can rise or fall arbitrarily between scrape intervals.
- **Summaries vs. Histograms vs. DDSketch**:
  - **Client-Side Summaries**: Compute streaming quantiles (e.g., Cormode-Muthukrishnan CKMS algorithm) inside the application process. While cheap on series count, `p99` values from 100 pods **cannot be mathematically combined** (`avg(p99)` is invalid when traffic is skewed).
  - **Fixed-Bucket Histograms (`_bucket{le="..."}`)**: Export cumulative event counts across predefined latency boundaries. Aggregators sum matching buckets across all pods before linear/exponential interpolation—at the cost of $B \times$ series cardinality multiplication.
  - **DDSketch / Native Exponential Histograms**: Used by Datadog and Prometheus 2.40+. Bucket boundaries grow exponentially ($b_i = \gamma^i$), guaranteeing a bounded **relative error** (e.g., $\le 1\%$) across any latency scale from microseconds to hours, and merging losslessly across thousands of hosts in a single time series.

### 2. Pull (Prometheus Scraping) vs. Push (StatsD / OpenTelemetry Collector)
In a hybrid cloud environment, a large-scale monitoring platform supports both collection models:
- **Pull (Scrape Loop + Service Discovery)**:
  - The TSDB scraper watches Kubernetes/Consul APIs, maintains a target ring, and pulls `/metrics` over HTTP every 10–60s.
  - **Strengths**: Trivial target liveness detection (`up == 0`), centralized scrape rate control, and protection against client-induced DDoS storms (`sample_limit` per scrape).
- **Push (OTel Collector / StatsD Agent)**:
  - Applications emit UDP packets to a local node DaemonSet agent or stream OTLP/gRPC batches to a stateless collector fleet.
  - **Strengths**: Captures metrics from **ephemeral/serverless workloads** (AWS Lambda, Kubernetes Jobs) that terminate in `< 500ms`, works across outbound-only NAT/firewall boundaries, and unifies Metrics, Logs, and Traces over a single protocol (OTLP).

### 3. TSDB Storage Engine: WAL, Head Block, Mimir/Thanos Object Storage Tiering
How does a modern distributed TSDB (like Grafana Mimir, Thanos, or Cortex) scale a single Prometheus engine to **1 Billion active series**?

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                 DISTRIBUTED TSDB (MIMIR / THANOS / CORTEX ARCHITECTURE)                │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  [Ingester Nodes (Hash-Ring Sharded by SeriesID, RF=3)]                                │
│    ├─ Write-Ahead Log (WAL): Sequential disk append before acking write                │
│    ├─ In-Memory Head Block (2-Hour Window):                                            │
│    │    • Inverted Index: Label Value ➔ Roaring Bitmap / Postings List of SeriesIDs    │
│    │    • Gorilla Chunk: ΔΔ Timestamps (1 bit) + XOR Floats (~11 bits) = 1.37B/sample  │
│    └─ Every 2 Hours: Cut Immutable Block ➔ Upload to Amazon S3 / GCS                   │
│                                                                                        │
│  [Compactor & Downsampler Fleet]                                                       │
│    ├─ Deduplicates 3x replica blocks in S3                                             │
│    └─ Generates 5-minute & 1-hour Downsampled Rollups (min, max, sum, count)           │
│                                                                                        │
│  [Store Gateway + Querier Fleet]                                                       │
│    ├─ Recent (< 2h): Fan-out query to Ingester RAM Head Blocks                         │
│    └─ Historical (> 2h): Fetch index headers cached on Store Gateways + S3 byte-ranges │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 4. Head-Based vs. Tail-Based Distributed Trace Sampling & Metric Exemplars
Metrics tell you *that* `checkout-service` latency spiked; traces tell you *why*. To bridge the two without paying to store 100% of traces at 500,000 RPS:
- **Metric Exemplars**: When an application records a slow request into a Histogram bucket (`le="2.0"`), it attaches `{trace_id="4bf92f3577b34da6"}` as an **Exemplar** on that bucket.
- **Two-Tier Tail Sampling**:
  - **Tier 1 (SDK)**: Propagates W3C `traceparent` headers across all services.
  - **Tier 2 (OTel Collector Routing Tier)**: Load-balances spans by `MurmurHash3(trace_id)` so all spans for a given trace land on the same collector instance. The collector buffers spans in memory for `decision_wait` (e.g., 10–15s) and retains **100% of traces with `status=ERROR`, `http.status_code >= 500`, or `duration > p99`**, plus any trace marked with an Exemplar, while dropping 99% of healthy baseline traces.

### 5. Multi-Window Multi-Burn-Rate SLO Alerting
Static threshold alerts (`error_rate > 0.1% for 5m`) force an impossible trade-off between **slow detection** and **false-positive alert fatigue**. Google SRE's **Multi-Window Multi-Burn-Rate** model alerts on the rate at which the monthly **Error Budget** ($1 - \text{SLO}$) is being exhausted:
- For a **99.9% SLO** (30-day error budget = $43.2\text{ minutes}$, allowable error ratio = $0.001$):
  - **Critical Page (`Burn Rate >= 14.4x` — exhausts 2% of monthly budget in 1 hour)**:
    $$\text{ErrorRatio}_{1\text{h}} > 14.4 \times 0.001 \quad \mathbf{\text{AND}} \quad \text{ErrorRatio}_{5\text{m}} > 14.4 \times 0.001$$
    The `1h` window filters out brief 30-second blips; the `5m` companion window guarantees the alert stops firing within 5 minutes of remediation (preventing a 55-minute "reset shadow").
  - **Ticket Alert (`Burn Rate >= 6x` — exhausts 5% of monthly budget in 6 hours)**:
    $$\text{ErrorRatio}_{6\text{h}} > 6 \times 0.001 \quad \mathbf{\text{AND}} \quad \text{ErrorRatio}_{30\text{m}} > 6 \times 0.001$$

---

## 🧠 Senior/Staff Interview Playbook: How to Ace Metrics Monitoring System Design Interviews

### 1. The Senior Framing Strategy (First 60 Seconds)

When asked to *"Design Datadog / Prometheus at 10M+ data points per second"*, immediately establish four architectural invariants:
1. **Series Cardinality vs. Sample Throughput Separation**:
   - Explicitly separate **Sample Write Throughput** (solved by Gorilla bitwise compression: `10M samples/sec` compresses from `160 MB/sec` to **`~13.7 MB/sec`**) from **Active Series Cardinality** (the real memory bottleneck: every unique label combination requires an in-memory inverted index entry and open Head Chunk).
2. **Shard-by-Series-Hash Affinity**:
   - Gorilla compression only achieves `1.37 bytes/sample` if consecutive points for the **exact same `SeriesID`** arrive sequentially at the **same Ingester node** so delta-of-delta and XOR state can be maintained in RAM. Thus, the Kafka / Ingester ring **must** partition by `Hash(metric_name + sorted_labels)`.
3. **Failure-Mode Degradation (Fail-Open Telemetry)**:
   - Monitoring must never take down production. Agents use bounded ring buffers and drop oldest points under backpressure; multi-tenant Ingestion Gateways enforce per-tenant active-series quotas (`max_global_series_per_user`) so one team's bad deploy cannot OOM the shared TSDB cluster.
4. **Tiered Resolution & Streaming Alerting**:
   - Combine in-memory streaming alert evaluation (to avoid hammering disk with 500k PromQL queries/min) with S3 block compaction and `10s -> 1m -> 1h` downsampling rollups.

### 2. Classic Interviewer Traps & Principal Rebuttals

#### Trap 1: "To scale ingestion horizontally, our API Gateway can round-robin incoming metric batches across any stateless TSDB writer node, which then flushes to shared disk."
* **Junior/Mid Answer:** "Yes, stateless round-robin load balancing is the easiest way to scale writes evenly across worker nodes."
* **Principal Rebuttal:** "Round-robin routing **destroys Gorilla compression** and increases storage and I/O costs by $10\times$! Gorilla's delta-of-delta timestamp encoding and XOR float encoding depend on comparing sample $t_n$ against sample $t_{n-1}$ of the **same time series** inside a contiguous 2-hour in-memory chunk. If samples for `Series_A` are scattered across 50 random nodes, each node must open a separate chunk header and write uncompressed 16-byte points. You **must** use **Consistent Hashing (with Replication Factor = 3)** keyed by `SeriesID = MurmurHash3(metric_name + canonical_labels)` so all samples for a series deterministically land on the same 3 Ingester replicas."

#### Trap 2: "Why not store metrics in Cassandra or DynamoDB with `partition_key = metric_name` and `sort_key = timestamp`?"
* **Junior/Mid Answer:** "Cassandra is great for write-heavy time-series workloads because it uses an LSM-tree."
* **Principal Rebuttal:** "Storing raw metric samples directly as rows in Cassandra fails on two fronts:
  1. **Multi-Dimensional Tag Filtering (`WHERE env='prod' AND region='us-east' AND status='500'`)**: Cassandra cannot intersect arbitrary label combinations without secondary indexes (which scatter-gather across the entire cluster). A true TSDB uses a **Lucene-style Inverted Index with Roaring Bitmaps** in the Head Block to intersect 5 label filters in microseconds and resolve the exact list of matching `SeriesID`s.
  2. **Storage & Compaction Amplification**: Even with Snappy compression, a Cassandra row per sample takes `30–60 bytes` (cell metadata + timestamp + value), compared to `1.37 bytes` in a Gorilla bit-stream chunk—a **25x–40x storage penalty**."

#### Trap 3: "When an Ingester node crashes and restarts, how do you prevent losing the last 2 hours of in-memory Gorilla chunks without doing an `fsync` to disk on every single metric sample?"
* **Junior/Mid Answer:** "We can `fsync` the Write-Ahead Log on every sample write to guarantee zero data loss, just like PostgreSQL."
* **Principal Rebuttal:** "Calling `fsync()` on every sample at 500,000 samples/sec per node will immediately saturate NVMe IOPS. Instead, production TSDBs (like Mimir/Cortex) use **Quorum Replication ($N=3, W=2, R=2$) across Availability Zones paired with batched asynchronous WAL flushes**:
  1. The Ingestion Distributor hashes each series to **3 Ingester nodes in different AZs** and waits for at least **2 of 3 Ingesters** to acknowledge appending the sample to their in-memory Head Chunk + OS page-cache WAL buffer.
  2. If one Ingester node loses power, the remaining 2 replicas still hold the complete 2-hour in-memory chunk for both live queries and the eventual S3 block upload."

#### Trap 4: "A dashboard query asks for `sum(rate(http_requests_total[5m]))` over the last 90 days. The query times out scanning 770,000 raw 10-second points per series. How do you make 90-day queries return in `< 200ms`?"
* **Junior/Mid Answer:** "Add a Redis cache in front of the Query Service so repeated dashboard queries are fast."
* **Principal Rebuttal:** "Caching only helps identical repeat queries; it doesn't solve the cold scan of 770,000 points per series. We solve this with two architectural mechanisms:
  1. **Resolution-Aware Downsampling Rollups**: The Compactor pre-aggregates 2-hour raw blocks into `5m` and `1h` rollup blocks in S3, storing `(min, max, sum, count, counter_reset_hint)`. For a 90-day graph with 1-hour step resolution, the Query Coordinator automatically reads the `1h` rollup blocks—scanning only **2,160 points** instead of **777,600 points** ($360\times$ speedup).
  2. **Query Frontend Step-Aligning & Time-Splitting**: A stateless **Query Frontend** aligns query start/end timestamps to step boundaries (maximizing cache hits for historical sub-windows) and splits a 90-day query into ninety parallel 1-day sub-queries executed concurrently across the Store Gateway pool."

### 3. Quick Reference — Mid-Level vs. Principal Candidate Cheat Sheet

| Concept / Scenario | Mid-Level Candidate Says | Principal Candidate Demonstrates |
| :--- | :--- | :--- |
| **Write Routing** | "Round-robin metric batches to stateless ingestion workers." | "Route by **Consistent Hash of `SeriesID`** ($RF=3$, quorum $W=2$) so consecutive points for a series append to the same in-memory Gorilla chunk." |
| **Compression Mechanics** | "Compress metric JSON payloads with Gzip or Snappy." | "Use **Gorilla bitwise encoding** (Delta-of-Delta timestamps + IEEE-754 XOR floats) to achieve `~1.37 bytes/sample` inside 2-hour blocks." |
| **Label Indexing** | "Use a composite B-Tree index on `(metric_name, env, service)`." | "Maintain an in-memory **Inverted Index (`label=val -> Roaring Bitmap of SeriesIDs`)** for $O(1)$ multi-dimensional bitmap intersections." |
| **High-Cardinality Defense** | "Scale up RAM when series count grows." | "Enforce **per-tenant active series limits**, strip dynamic IDs via relabeling rules, and route high-cardinality slicing to **Exemplars + ClickHouse/Traces**." |
| **Long-Range Queries & Alerting** | "Run PromQL queries against the DB every minute for alerts and 1-year graphs." | "Evaluate alert rules **inline on the streaming ingestion pipeline**; serve 1-year queries via **S3 downsampled rollups (`10s -> 5m -> 1h`)** and a **Query Frontend splitter**." |

