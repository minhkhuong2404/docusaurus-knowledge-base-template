---
id: ad-click-aggregator
title: Design an Ad Click Event Aggregator Like Google Ads
sidebar_label: 15. Ad Click Aggregator
description: Staff-level system design breakdown for an exactly-once real-time ad click event ingestion, deduplication, and OLAP analytics platform.
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design an Ad Click Event Aggregator Like Google Ads

An ad click aggregator (e.g., Google Ads, Meta Ads Manager, Amazon Ads) ingests billions of real-time ad impression and click events, filters fraudulent and duplicate clicks, and aggregates metrics across advertiser campaigns in sub-minute tumbling windows. Because advertisers are billed directly per click (Cost-Per-Click - CPC), the system requires **strict exactly-once processing semantics**, financial auditability, and sub-second OLAP query performance.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Ad Click Ingestion**: Ingest high-volume ad click events from web browsers and mobile apps globally.
2. **Click Deduplication & Fraud Detection**: Detect and filter duplicate clicks (e.g., accidental double taps) and invalid/bot clicks within a sliding window.
3. **Windowed Aggregation**: Aggregate metrics (Total Clicks, Unique Clicks, Total Cost) by `(ad_id, campaign_id, country)` over 1-minute and 1-hour tumbling windows.
4. **Advertiser Analytics Queries**: Enable advertisers to query aggregated click counts and campaign spend in real-time with sub-second dashboard latencies.
5. **Auditing & Raw Event Archival**: Store immutable raw event logs for 90 days for financial compliance and billing reconciliation.

### Non-Functional Requirements
- **Exactly-Once Processing**: Advertisers must never be double-billed for the same physical click event.
- **High Ingestion Throughput**: Ingest and process **100,000+ click events/sec** continuously.
- **Real-Time Freshness**: Advertisers must see aggregated click counts on their dashboards in `< 1 minute` from user click.
- **Data Durability & Audit Trail**: Zero data loss. Raw events must be permanently replayable in case of pipeline failure.

### Capacity Estimations & Sizing
- **Daily Click Events**: 1 Billion click events per day.
- **Ingestion Throughput**:
  - $1,000,000,000 / 86,400 \approx$ **11,500 clicks/sec average** (peaking at **50,000 clicks/sec** during holiday sales).
- **Event Payload Sizing**:
  - Each click event: `click_id` (16 bytes) + `ad_id` (16 bytes) + `campaign_id` (16 bytes) + `user_id` (16 bytes) + `ip` (16 bytes) + `bid_price_cents` (4 bytes) + `timestamp` (8 bytes) $\approx$ **100 bytes**.
  - Daily raw event storage = $1\text{B} \times 100\text{ bytes} \approx$ **100 GB / day** $\implies$ **36.5 TB / year** (stored as compressed Parquet on S3).
- **Aggregated Record Reduction**:
  - Aggregating 1 Billion events by 1-minute buckets reduces row count by **99%**, producing ~10 Million aggregated rows/day for the OLAP database.

---

## 2. The Set Up

### Defining the Core Entities

```
┌────────────────────────────────────────────────────────┐
│                       CLICK_EVENT                      │
├──────────────────┬──────────────┬──────────────────────┤
│ click_id         │ UUID         │ PRIMARY KEY (Unique) │
│ ad_id            │ UUID         │ INDEX, FK            │
│ campaign_id      │ UUID         │ INDEX, FK            │
│ advertiser_id    │ UUID         │ INDEX, FK            │
│ cost_cents       │ INT          │ Billed Amount        │
│ ip_address       │ VARCHAR(45)  │ Fraud Analysis       │
│ user_agent       │ VARCHAR(256) │ Device Info          │
│ clicked_at       │ TIMESTAMP    │ Event Time           │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                   AD_HOURLY_AGGREGATE                  │
├──────────────────┬──────────────┬──────────────────────┤
│ window_start     │ TIMESTAMP    │ PARTITION KEY (OLAP) │
│ ad_id            │ UUID         │ PRIMARY KEY COMPOSITE│
│ country_code     │ CHAR(2)      │ PRIMARY KEY COMPOSITE│
│ total_clicks     │ BIGINT       │ Aggregated Counter   │
│ unique_users     │ BIGINT       │ HyperLogLog Estimate │
│ total_cost_cents │ BIGINT       │ Financial Total      │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API Design

#### 1. Ingest Click Beacon (Client Browser to Ad Gateway)
```http
POST /api/v1/clicks
Content-Type: application/json
Idempotency-Key: clk_99a81-1029-4102

{
  "click_id": "clk_99a81-1029-4102",
  "ad_id": "ad_771204",
  "campaign_id": "cmp_33109",
  "advertiser_id": "adv_8812",
  "bid_price_cents": 45,
  "clicked_at": 1774301980000
}
```
**Response (`202 Accepted`)**: HTTP 204 No Content (returns immediately to avoid blocking client redirect).

#### 2. Query Campaign Analytics (Advertiser Dashboard)
```http
GET /api/v1/advertisers/{advertiser_id}/analytics?timeframe=24h&granularity=1h
```
**Response (`200 OK`)**:
```json
{
  "advertiser_id": "adv_8812",
  "timeframe": "24h",
  "total_spend_cents": 452100,
  "total_clicks": 10046,
  "series": [
    {"timestamp": "2026-09-22T21:00:00Z", "clicks": 412, "spend_cents": 18540},
    {"timestamp": "2026-09-22T22:00:00Z", "clicks": 489, "spend_cents": 22005}
  ]
}
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="stream-analytics" title="Google Ads Real-Time Click Aggregation & Deduplication Pipeline" />

### Walkthrough of the Data Ingestion & Analytics Pipeline

#### 1. Ingestion & Message Buffering
1. Ad click reaches the edge **Ad Ingestion Gateway**.
2. The Gateway extracts headers and immediately returns `HTTP 204 No Content` to ensure the user is redirected to the destination landing page without delay.
3. The Gateway writes the raw click event to an **Apache Kafka Cluster** partitioned by `hash(ad_id) % num_partitions`.

#### 2. Stream Processing & Deduplication (Apache Flink)
1. **Apache Flink Stream Cluster** consumes from Kafka.
2. **Deduplication Operator**:
   - Queries Flink's internal stateful storage (RocksDB).
   - If `click_id` has already been processed within the last 10 minutes $\implies$ Discards duplicate click.
   - Filters bot clicks based on suspicious click frequency from the same IP/User-Agent.
3. **Windowed Aggregation Operator**:
   - Aggregates valid clicks into **1-minute tumbling windows** grouped by `(ad_id, campaign_id, country_code)`.
   - Computes `sum(clicks)`, `sum(cost)`, and `HyperLogLog(user_id)`.
4. Writes aggregated metrics to an OLAP database using transactional two-phase commit.

#### 3. Real-Time OLAP Serving (ClickHouse / Apache Pinot)
1. Aggregated 1-minute blocks are ingested into **ClickHouse**.
2. ClickHouse organizes data using a `SummingMergeTree` storage engine, automatically merging 1-minute blocks into hourly and daily rollups in the background.
3. Advertiser dashboards execute fast analytical SQL queries (`SELECT sum(total_clicks) FROM ad_aggregates WHERE campaign_id = ?`) in `< 50ms`.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Exactly-Once Processing Semantics (End-to-End)
How do we guarantee that an advertiser is charged for a click **exactly once**, even if Kafka brokers or Flink worker nodes crash?

```
                    Kafka Message Bus (At-Least-Once)
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  APACHE FLINK EXACTLY-ONCE ENGINE                      │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Asynchronous Barrier Snapshotting (Chandy-Lamport Algorithm):       │
│    Injects checkpoint barriers into the event stream every 30 seconds. │
│ 2. RocksDB Local State: Stores processed click_ids and window sums.    │
│ 3. Two-Phase Commit (2PC) Sink to ClickHouse / Kafka:                  │
│    - Phase 1 (Prepare): Writes windowed aggregates into staging table. │
│    - Phase 2 (Commit): On successful Flink checkpoint, commits staging │
│      data to the live analytical table atomically.                     │
└────────────────────────────────────────────────────────────────────────┘
```
- **Crash Recovery**: If a worker crashes midway, Flink rolls back Kafka consumer offsets and in-memory state to the last successful checkpoint, guaranteeing that no clicks are double-counted.

### Deep Dive 2: Click Fraud & Duplicate Click Filtering
How do competitors or malicious botnets drain an advertiser's budget?

1. **Accidental Double Clicks**: A user with an unstable mouse or touchscreen taps an ad twice in 500ms.
   - *Defense*: Sliding window deduplication. Any click matching `(user_id, ad_id)` within a **10-minute sliding window** is counted as a single billable click.
2. **Bot Farm Burst Attack**: Multiple virtual machines clicking ads from the same datacenter ASN or IP range.
   - *Defense*: Real-time IP velocity counters in Redis. If IP exceeds 10 clicks per minute across all ads, redirect clicks to an invalid clicks topic (`fraud_clicks`).
3. **Reconciliation & Chargebacks**: At the end of each billing cycle (midnight), a batch MapReduce job runs machine learning fraud detection models over the raw S3 event lake. If fraudulent patterns are detected post-facto, an automatic billing credit is applied to the advertiser's ledger.

### Deep Dive 3: OLAP Database Engine: Why ClickHouse Over PostgreSQL?
Why can't we store aggregated metrics in standard PostgreSQL?

| Feature | PostgreSQL / Relational | ClickHouse / OLAP Columnar Store |
|---|---|---|
| **Storage Layout** | Row-oriented (reads entire row off disk) | Columnar (reads ONLY `total_clicks` column) |
| **Compression Ratio** | 2:1 to 3:1 | **10:1 to 15:1** (LZ4/ZSTD over identical column types) |
| **Analytical Query Speed** | Slow for large scans (millions of rows take seconds) | **Vectorized CPU execution (SIMD)**: Scans 100M rows in `< 50ms` |
| **Automatic Rollups** | Requires complex manual triggers or materialized views | **SummingMergeTree**: Background engine automatically folds 1-minute rows into hourly summaries |

---

## 5. Architectural Trade-Off Matrix

| Design Area | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Stream Processing** | Micro-batching (Spark Streaming) | Native Event Streaming (Apache Flink) | **Apache Flink**: Delivers true event-time processing with sub-second latency and native Chandy-Lamport stateful deduplication. |
| **Unique User Counting** | Exact Set of User UUIDs | HyperLogLog (HLL) Probabilistic Cardinality | **HyperLogLog**: Storing millions of user IDs per ad window exhausts memory. HLL uses **1.5 KB of RAM** per ad with an error margin of `< 1%`. |
| **Audit Compliance** | Store only aggregated sums | Store immutable raw events in S3 Data Lake | **S3 Data Lake**: Aggregations are lossy. In financial advertising, raw events must be archived permanently for tax audits and advertiser dispute arbitrations. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Understands why relational databases fail under 50K clicks/sec analytical queries.
- Designs basic stream aggregation using Kafka and a stream processor.
- Designs schemas for raw clicks and aggregated metrics.
- Proposes deduplication by tracking `click_id`.

### Senior (L5 / IC5)
- Details Flink's Chandy-Lamport checkpointing and Two-Phase Commit (2PC) to achieve true **Exactly-Once processing**.
- Explains ClickHouse `SummingMergeTree` columnar storage mechanics and compression benefits.
- Solves duplicate clicks using stateful sliding window filters and uses HyperLogLog for unique user counts.
- Designs fraud mitigation strategies and asynchronous advertiser billing reconciliation.

### Staff+ (L6 / Principal)
- Evaluates multi-region Kafka data replication: Active-active cross-datacenter event ingestion without creating duplicate billing records during network partitions.
- Designs financial ledger reconciliation: Reconciling real-time ClickHouse metrics against bank billing statements and credit card payment processor gateway transactions.
- Architects real-time adaptive bidding feedback loops: Feeding click-through-rate (CTR) updates back into the ad matching auction engine in `< 10 seconds`.
