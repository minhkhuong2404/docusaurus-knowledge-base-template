---
id: time-series-databases
title: Time-Series Databases
description: Time-series data characteristics, storage optimizations, InfluxDB, TimescaleDB, Prometheus, and common time-series patterns.
tags: [database, time-series, influxdb, timescaledb, prometheus, iot, metrics, monitoring]
sidebar_position: 19
---

# Time-Series Databases

## What Is Time-Series Data?

Time-series data is a sequence of data points **indexed by time**, typically collected at regular intervals.

**Characteristics:**
- High write volume (millions of points per second possible)
- Writes are almost always **appends** (no updates to past data)
- Data is queried by **time ranges**
- Recent data accessed most; old data can be compressed or downsampled
- Queries are often aggregations: avg, max, min, rate, percentile over time windows

**Use cases:**
- Application metrics (CPU, memory, request latency)
- IoT sensor data (temperature, pressure, GPS)
- Financial tick data (stock prices, order flow)
- Infrastructure monitoring (server health)
- Business KPIs (revenue per hour, signups per day)

---

## Why Not Use a Relational DB?

```sql
-- Naive approach in PostgreSQL
CREATE TABLE metrics (
    id         BIGSERIAL,
    metric     VARCHAR(100),
    value      DOUBLE PRECISION,
    timestamp  TIMESTAMPTZ,
    tags       JSONB
);

-- Problems at scale:
-- 1. Index grows without bound → slow inserts
-- 2. No time-based partitioning by default
-- 3. No automatic retention policies
-- 4. No time-series specific aggregation functions
-- 5. Storing duplicate metric names wastes space
```

Time-series databases address all of these.

---

## TimescaleDB

PostgreSQL extension that adds time-series superpowers. Fully SQL compatible.

### Hypertables

```sql
-- Create a regular table first
CREATE TABLE metrics (
    time    TIMESTAMPTZ NOT NULL,
    device  TEXT NOT NULL,
    metric  TEXT NOT NULL,
    value   DOUBLE PRECISION NOT NULL
);

-- Convert to hypertable (auto-partitions by time)
SELECT create_hypertable('metrics', 'time',
    chunk_time_interval => INTERVAL '1 day');

-- Timescale automatically creates "chunks" (partitions)
-- Each chunk = one day of data → indexes stay small
-- Old chunks can be compressed/archived independently
```

### Continuous Aggregates (Materialized Views)

```sql
-- Pre-aggregate hourly averages automatically
CREATE MATERIALIZED VIEW metrics_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS hour,
    device,
    metric,
    AVG(value) AS avg_value,
    MAX(value) AS max_value,
    MIN(value) AS min_value,
    COUNT(*)   AS sample_count
FROM metrics
GROUP BY 1, 2, 3;

-- Auto-refresh policy
SELECT add_continuous_aggregate_policy('metrics_hourly',
    start_offset => INTERVAL '2 hours',
    end_offset   => INTERVAL '10 minutes',
    schedule_interval => INTERVAL '30 minutes');
```

### Compression

```sql
-- Compress chunks older than 7 days (columnar + delta/gorilla encoding)
SELECT add_compression_policy('metrics', INTERVAL '7 days');

-- Check compression ratio
SELECT chunk_name, before_compression_total_bytes,
       after_compression_total_bytes,
       round(100 * (1 - after_compression_total_bytes::numeric /
             before_compression_total_bytes), 1) AS savings_pct
FROM chunk_compression_stats('metrics');
-- Typically 10-20x compression on numeric time-series data
```

### Retention Policy

```sql
-- Automatically drop data older than 90 days
SELECT add_retention_policy('metrics', INTERVAL '90 days');
```

### Time-Series Queries

```sql
-- Average CPU per hour for last 24h
SELECT time_bucket('1 hour', time) AS hour,
       device,
       AVG(value) AS avg_cpu
FROM metrics
WHERE metric = 'cpu_usage'
  AND time > NOW() - INTERVAL '24 hours'
GROUP BY 1, 2
ORDER BY 1;

-- Rate of change (derivative)
SELECT time, value,
       (value - LAG(value) OVER w) /
       EXTRACT(EPOCH FROM (time - LAG(time) OVER w)) AS rate_per_sec
FROM metrics
WHERE device = 'server-01' AND metric = 'bytes_sent'
WINDOW w AS (PARTITION BY device ORDER BY time);

-- Gap filling (fill missing intervals with NULLs or interpolation)
SELECT time_bucket_gapfill('5 minutes', time) AS bucket,
       device,
       locf(AVG(value)) AS value    -- last-observation-carried-forward
FROM metrics
WHERE time BETWEEN '2024-01-15' AND '2024-01-16'
GROUP BY 1, 2;
```

---

## InfluxDB

Purpose-built time-series database. Uses a custom query language (InfluxQL or Flux).

### Data Model

```
Measurement ≈ Table
Tags        ≈ Indexed string metadata (device, region, environment)
Fields      ≈ Actual values (not indexed, stored as float/int/string/bool)
Timestamp   ≈ Nanosecond precision

Point: cpu,host=server01,region=us-east usage_idle=98.5,usage_user=1.5 1674000000000000000
        │    ───────tags──────────────   ────────────fields──────────── ─timestamp (ns)─
```

### Writing Data

```bash
# Line protocol: measurement,tags fields timestamp
curl -X POST "http://localhost:8086/api/v2/write?bucket=metrics" \
  -H "Authorization: Token mytoken" \
  --data-raw "
cpu,host=server01,dc=us-east usage_idle=98.5,usage_user=1.5 $(date +%s%N)
memory,host=server01 used_percent=45.2 $(date +%s%N)
"
```

### Flux Query Language

```javascript
// Average CPU per host over last hour
from(bucket: "metrics")
  |> range(start: -1h)
  |> filter(fn: (r) => r._measurement == "cpu")
  |> filter(fn: (r) => r._field == "usage_user")
  |> aggregateWindow(every: 5m, fn: mean, createEmpty: false)
  |> group(columns: ["host"])
  |> mean()
  |> yield(name: "avg_cpu_per_host")

// Percentile
from(bucket: "metrics")
  |> range(start: -24h)
  |> filter(fn: (r) => r._measurement == "http_requests")
  |> filter(fn: (r) => r._field == "response_time_ms")
  |> quantile(q: 0.99)   // p99 latency
```

### Retention Policies (InfluxDB 1.x) / Bucket TTL (2.x)

```bash
# Create bucket with 30 day retention
influx bucket create --name metrics --retention 30d
```

---

## Prometheus

Metrics monitoring system with a pull-based model. Purpose-built for infrastructure metrics.

### Data Model

```
Metric name + labels → time series

http_requests_total{method="GET", status="200", endpoint="/api/orders"} 1024
http_requests_total{method="POST", status="500", endpoint="/api/orders"} 3
node_cpu_seconds_total{cpu="0", mode="idle"} 12345.6
```

### Metric Types

| Type | Description | Example |
|------|-------------|---------|
| `Counter` | Monotonically increasing | HTTP requests, errors |
| `Gauge` | Can go up or down | CPU usage, memory, queue depth |
| `Histogram` | Bucket-based distribution | Request duration, response size |
| `Summary` | Pre-calculated quantiles | p50, p95, p99 latency |

### PromQL

```promql
# Request rate (per second, 5m window)
rate(http_requests_total[5m])

# Error rate percentage
rate(http_requests_total{status=~"5.."}[5m])
  / rate(http_requests_total[5m]) * 100

# p99 latency from histogram
histogram_quantile(0.99,
  sum by (le) (rate(http_request_duration_seconds_bucket[5m])))

# CPU usage
100 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100
```

### Spring Boot Micrometer Integration

```java
// Auto-configured with Spring Boot Actuator
// pom.xml: spring-boot-starter-actuator + micrometer-registry-prometheus

@RestController
public class OrderController {

    private final Counter orderCounter;
    private final Timer orderTimer;

    public OrderController(MeterRegistry registry) {
        this.orderCounter = Counter.builder("orders.placed.total")
            .tag("currency", "USD")
            .register(registry);

        this.orderTimer = Timer.builder("orders.processing.duration")
            .percentiles(0.5, 0.95, 0.99)
            .register(registry);
    }

    @PostMapping("/orders")
    public Order placeOrder(@RequestBody OrderRequest req) {
        return orderTimer.record(() -> {
            Order order = orderService.place(req);
            orderCounter.increment();
            return order;
        });
    }
}

# Scrape endpoint: GET /actuator/prometheus
```

---

## Downsampling & Rollups

Time-series data is typically **downsampled** as it ages:

```
Raw data (1 second resolution) → keep for 7 days
5-minute averages              → keep for 30 days
1-hour averages                → keep for 1 year
1-day averages                 → keep forever

Storage savings: 1-second for a year = 31M points
                 1-day for a year    = 365 points
```

```sql
-- TimescaleDB downsampling policy
SELECT add_continuous_aggregate_policy('metrics_5min', ...);
SELECT add_continuous_aggregate_policy('metrics_hourly', ...);
SELECT add_retention_policy('metrics', INTERVAL '7 days');       -- raw
SELECT add_retention_policy('metrics_5min', INTERVAL '30 days');
-- metrics_hourly: no retention (keep forever)
```

---

## Comparison: TimescaleDB vs InfluxDB vs Prometheus

| | TimescaleDB | InfluxDB 2.x | Prometheus |
|--|-------------|-------------|------------|
| Query language | SQL | Flux | PromQL |
| Storage | PostgreSQL-based | Custom TSM | Custom TSDB |
| High cardinality | Good | Limited | Struggles |
| Long-term storage | Excellent | Good | Use remote storage |
| SQL ecosystem | Full | No | No |
| Best for | Mixed SQL + TS | IoT, dashboards | Infrastructure metrics |
| Scaling | PostgreSQL cluster | Clustering (paid) | Via federation/Thanos |

---

## 🎯 Interview Questions

**Q1. What makes time-series data different from regular relational data?**
> Time-series data is append-only (rarely updated), arrives in strict time order, is queried by time ranges rather than individual row lookups, has predictable growth patterns, and benefits from time-based compression. The temporal dimension is the primary access key, and aggregation over time windows is the dominant query pattern.

**Q2. What is a hypertable in TimescaleDB?**
> A hypertable is a PostgreSQL table automatically partitioned into "chunks" by time (and optionally by space/device). Each chunk covers a fixed time interval (e.g., 1 day) and has its own smaller B-tree index. This keeps indexes small and fast for recent data while allowing old chunks to be compressed or archived independently. The interface is standard SQL — hypertables are transparent to applications.

**Q3. What is the difference between Prometheus Counters, Gauges, and Histograms?**
> Counter: monotonically increasing (never decreases) — tracks total events like HTTP requests, errors. Use `rate()` to get per-second rate. Gauge: can go up or down — current values like memory usage, queue depth. Histogram: samples observations into configurable buckets — enables quantile computation (`histogram_quantile()`). Use for latency distributions.

**Q4. What is downsampling in time-series data and why is it important?**
> Downsampling aggregates high-resolution data into lower-resolution summaries (1s → 5min → 1hr) as data ages. Without it, storage grows unboundedly and queries over long time ranges scan massive amounts of data. With downsampling, year-long queries operate on ~8760 hourly data points instead of 31M per-second points, at acceptable precision for trend analysis.

**Q5. What are Prometheus labels and why must high cardinality be avoided?**
> Labels are key-value pairs that differentiate time series of the same metric (e.g., `{host="server01", endpoint="/api/orders"}`). High cardinality means many unique label combinations — e.g., `user_id` as a label creates one time series per user (millions of series), which overwhelms Prometheus's memory and performance. Labels should have bounded, small value sets.

**Q6. What is the difference between InfluxDB's tags and fields?**
> Tags are indexed string metadata used for filtering and grouping (host, region, environment) — stored in an inverted index, high performance for WHERE/GROUP BY. Fields are the actual measured values (temperature, CPU usage, latency) — not indexed, stored efficiently as time-series data. Mistakes: putting high-cardinality values in tags blows up the index; putting filter criteria in fields makes queries slow.

**Q7. How does Prometheus collect data differently from push-based systems?**
> Prometheus uses a pull model: it scrapes HTTP endpoints (`/metrics`) at configured intervals. Services expose metrics; Prometheus fetches them. Benefits: centralized scrape configuration, easy to detect when a service goes down (no metrics = problem). Contrast with push: services send metrics to a receiver. Push is better for short-lived jobs (use Pushgateway as intermediary for Prometheus).

**Q8. How would you store per-second metrics for 10,000 devices for 1 year efficiently?**
> 10,000 devices × 86,400 sec/day × 365 = ~315B raw data points/year. Strategy: write raw 1-second data, keep for 7 days; continuously aggregate to 1-minute averages (keep 30 days); 1-hour averages (keep 1 year). Use columnar compression (TimescaleDB achieves 10-20x compression on numeric data via delta+gorilla encoding). Total storage: weeks of raw + years of aggregates is feasible with < 1TB.

---

## Advanced Editorial Pass: Time-Series Storage for High-Cardinality Streams

### Senior Engineering Focus
- Design retention and downsampling as first-class data lifecycle policies.
- Tune ingestion and query paths for high-cardinality tag behavior.
- Align compression and partitioning strategy with access windows.

### Failure Modes to Anticipate
- Cardinality explosions degrading index and query performance.
- Retention misconfiguration causing cost and compliance issues.
- Ingestion bursts overwhelming write path and compaction.

### Practical Heuristics
1. Track cardinality growth and retention effectiveness.
2. Use tiered storage and rollups for long-horizon analytics.
3. Stress-test ingest spikes with realistic label dimensions.

### Compare Next
- [Performance & Monitoring](./performance-monitoring.md)
- [NoSQL & Distributed Databases](./nosql-distributed.md)
- [Replication & Partitioning](./replication-partitioning.md)
