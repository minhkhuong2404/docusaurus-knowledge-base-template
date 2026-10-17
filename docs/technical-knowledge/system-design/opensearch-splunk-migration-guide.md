---
id: opensearch-splunk-migration-guide
title: "OpenSearch Architecture Deep Dive & Splunk-to-OpenSearch Migration Guide"
sidebar_label: "OpenSearch & Splunk Migration"
description: "Principal engineering guide to OpenSearch internals (Apache Lucene segments, FSTs, DocValues, Segment Replication, ISM tiers) and end-to-end Splunk-to-OpenSearch migration (Schema-on-Read vs Schema-on-Write, SPL to PPL/DSL translation, Data Prepper pipelines, and capacity math)."
tags:
  - system-design
  - opensearch
  - splunk
  - observability
  - logging
  - lucene
  - data-prepper
  - migration
  - ppl
---

import OpenSearchSplunkMigrationDiagram from '@site/src/components/OpenSearchSplunkMigrationDiagram';

# OpenSearch Architecture Deep Dive & Splunk-to-OpenSearch Migration Guide

Migrating an enterprise observability and security analytics platform from **Splunk** to **OpenSearch** (the Apache 2.0 open-source distributed search and analytics engine forked from Elasticsearch 7.10.2 by AWS and the community) is one of the highest-ROI infrastructure initiatives a Senior or Staff Engineer can lead—frequently reducing annual observability TCO by **65% to 85%**.

However, treating OpenSearch like a "free drop-in Splunk replacement" without understanding the underlying engine shift from **Schema-on-Read (`rawdata` + `tsidx`)** to **Schema-on-Write (Apache Lucene Inverted Indexes + Columnar `DocValues`)** will cause catastrophic production outages (Mapping Explosions, JVM Heap OOMs, and Shard Over-Allocation).

---

## 1. The Paradigm Shift: Splunk (Schema-on-Read) vs. OpenSearch (Schema-on-Write)

To migrate smoothly from Splunk to OpenSearch, you must first rewire how you think about log ingestion, indexing, and querying.

<OpenSearchSplunkMigrationDiagram initialMode="architecture" />

### 1.1 Engine Architecture Comparison

| Architectural Dimension | Splunk Enterprise / Cloud | OpenSearch (Apache 2.0) | Migration Engineering Impact |
| :--- | :--- | :--- | :--- |
| **Schema Paradigm** | **Schema-on-Read**: Stores compressed raw text (`journal.gz`) + lightweight token lexicon (`tsidx`). Parses fields via regex at **search time**. | **Schema-on-Write**: Parses JSON fields at **ingest time** into typed Apache Lucene structures (`Inverted Index`, `BKD-Trees`, `DocValues`). | You must standardize structured JSON logging and govern field types via **Index Templates** before ingesting at scale. |
| **Ingest Cost vs. Query Speed** | Fast, forgiving ingest; **CPU-expensive queries** (regex scanning raw blocks during aggregations). | Slightly higher ingest CPU (mitigated by **Segment Replication**); **10x faster aggregations** via pre-built columnar `DocValues`. | Aggregations over 500M events (`stats count by service`) run in milliseconds in OpenSearch without scanning raw log strings. |
| **Licensing Model** | Volume-based (`$1,500–$2,500+` per GB/day ingested) or steep SVC compute units. | **100% Open Source (Apache 2.0)** — you pay only for underlying EC2/EKS compute, NVMe, and S3 storage. | Engineers no longer have to drop valuable `INFO` business events just to avoid Splunk license overage penalties. |
| **Primary Query Language** | **SPL** (Search Processing Language — pipe-based: `index=main | stats ...`) | **PPL** (Piped Processing Language — pipe-based!), **DQL** (Dashboards Query Language), **SQL**, and **JSON Query DSL**. | Splunk engineers can immediately use **OpenSearch PPL** (`source=logs-* | where ... | stats ...`) with minimal retraining. |

---

### 1.2 Complete Rosetta Stone: Splunk $\leftrightarrow$ OpenSearch Terminology

| Splunk Component / Concept | OpenSearch Equivalent | Under-the-Hood Explanation |
| :--- | :--- | :--- |
| **Universal Forwarder (UF)** | **Fluent Bit** / **OpenTelemetry Collector** | Lightweight DaemonSet agents tailing `/var/log/containers/*.log` and forwarding structured records with Kubernetes metadata. |
| **Heavy Forwarder (HF)** (`props.conf`, `transforms.conf`) | **OpenSearch Data Prepper** (or Ingest Node Pipelines) | Stateless ETL tier that parses unstructured logs (Grok/Regex), redacts PII, enriches GeoIP, aggregates OTel traces, and batches `_bulk` writes. |
| **Indexer** | **OpenSearch Data Node** (`data: [hot, warm]`) | Executes Lucene indexing, stores primary/replica shards, and serves shard-level search & aggregations. |
| **Indexer Clustering Master** | **Dedicated Cluster Manager Node** (`cluster_manager`) | Quorum of 3 dedicated nodes managing cluster state, shard allocation, and index mappings (formerly called Master nodes). |
| **Search Head (SH)** | **OpenSearch Dashboards + Coordinating Node** | Dashboards provides the Web UI (Discover, Visualizations, Trace Analytics); Coordinating nodes execute scatter-gather query routing. |
| **Index (`index=prod`)** | **Data Stream (`logs-prod-app`)** or **Index Alias** | Logical write/read target backed by hidden time-series rollover indices (`.ds-logs-prod-app-2026.10.16-000001`). |
| **Sourcetype (`sourcetype=access_combined`)** | **Index Template + ECS / OTel Schema Mapping** | Note: `_type` was removed in Lucene/ES 7+. Separate distinct schemas into separate Data Streams (`logs-nginx-*`, `logs-payment-*`). |
| **Bucket (`Hot` $\to$ `Warm` $\to$ `Cold` $\to$ `Frozen`)** | **Shard + Index State Management (ISM) Tiers** (`Hot` $\to$ `UltraWarm` $\to$ `Cold` $\to$ `Delete`) | Automated policy moving rolled-over indices from local NVMe SSDs to S3-backed **Searchable Snapshots** (`UltraWarm`/`Cold`). |
| **Search-Time Field Extraction (`rex`)** | **Derived / Runtime Fields (Painless Script)** or **PPL `parse`** | Evaluates regex on `_source` at query time without adding index storage overhead—exact Splunk Schema-on-Read behavior when needed! |
| **Lookup Tables (`inputlookup` / KV Store)** | **Data Prepper Enrichment** or **Term Lookup Query** | Join static reference metadata at ingest time in Data Prepper, or enrich dynamically in PPL (`lookup`). |
| **Saved Searches & Alerts** | **OpenSearch Alerting Monitors** & **Anomaly Detection (RCF)** | Scheduled DSL/PPL monitors and unsupervised **Random Cut Forest (RCF)** ML detectors triggering Slack/PagerDuty webhooks. |

---

## 2. OpenSearch Under-the-Hood: Lucene Storage Engine & Node Roles

To pass Senior/Staff architecture reviews and run OpenSearch reliably at multi-terabyte daily scale, you must understand what happens inside an OpenSearch **Shard** (which is physically a standalone **Apache Lucene Index** instance).

<OpenSearchSplunkMigrationDiagram initialMode="storage-engine" />

### 2.1 The 4 Data Structures Inside Every Lucene Segment

When OpenSearch indexes a JSON log document, it does not just compress the text. It decomposes every field into four specialized on-disk data structures inside an immutable **Lucene Segment**:

1. **Inverted Index (`.tip`, `.tim`, `.doc`, `.pos`) — For Fast Full-Text & Keyword Filtering**:
   - **Term Dictionary (`.tim`)**: Sorted list of all unique tokens (`"order-service"`, `"timeout"`, `"stripe"`).
   - **Term Index (`.tip` — Finite State Transducer / FST)**: A highly compressed byte-prefix state machine loaded into memory/page-cache that locates the exact disk offset of any term in the Term Dictionary in $O(\text{length of term})$ time.
   - **Posting Lists (`.doc`)**: Frame-of-Reference (FOR) delta-encoded or **Roaring Bitmap** lists of Document IDs (`[Doc 12, Doc 45, Doc 901]`) containing that term. Intersecting two filter clauses (`service: "payment"` AND `level: "ERROR"`) is a hardware-accelerated bitwise `AND` over two Roaring Bitmaps!
2. **Columnar `DocValues` (`.dvd`, `.dvm`) — For Fast Aggregations, Sorting & Group-By**:
   - An Inverted Index answers *"Which documents contain term X?"*, but if you run `| stats avg(duration_ms) by service` (which asks *"What is the value of `duration_ms` and `service` for these 1,000,000 matched documents?"*), an Inverted Index is useless.
   - **`DocValues`** stores values in a **column-oriented layout** (`DocID -> Value`) on disk inside the OS Page Cache (`mmap`), enabling OpenSearch to scan millions of numeric/keyword values sequentially at L1/L2 CPU cache speeds without deserializing the JSON document!
3. **BKD-Trees (Block KD-Trees — `.kdd`, `.kdi`, `.kdm`) — For `@timestamp`, Numeric Ranges & IP Subnets**:
   - Numeric fields (`long`, `double`, `date`, `ip`) are indexed into multi-dimensional spatial BKD-trees, making time-range queries (`@timestamp >= now-15m`) and latency range filters (`duration_ms BETWEEN 500 AND 2000`) $O(\log N)$ tree traversals.
4. **Stored `_source` (`.fdt`, `.fdx`) — For Returning the Original JSON Document**:
   - The original raw JSON payload compressed in blocks using `LZ4` (default) or `ZSTD`/`DEFLATE` (`index.codec: best_compression`, which reduces log storage footprint by **35–45%**).

---

### 2.2 The Write Path: Indexing Buffer $\to$ Translog $\to$ Refresh $\to$ Flush $\to$ Merge

When Data Prepper sends a `POST /_bulk` batch of 5,000 logs to an OpenSearch Coordinating Node:

1. **Deterministic Shard Routing**:
   $$\text{shard\_num} = \text{Murmur3Hash}(\text{\_routing or \_id}) \bmod \text{num\_primary\_shards}$$
   *(This is why `number_of_shards` on a single index can **never** be changed without reindexing or rolling over to a new index in a Data Stream!)*
2. **Primary Shard In-Memory Buffer + Translog**:
   - The Primary Shard parses the JSON document into its **JVM Indexing Buffer** (not yet searchable!) and appends the raw operation to the **Translog** (Write-Ahead Log on NVMe disk) for crash recovery.
3. **Refresh (Near Real-Time Visibility — Default `1s`, Recommended `30s` for Logs)**:
   - Every `index.refresh_interval`, the in-memory buffer is written into a new immutable **Lucene Segment** in the **Linux OS Page Cache** (without a slow disk `fsync`). Once in the OS Page Cache, the segment is opened for search!
   - **Production Tuning**: Creating a new segment every `1s` for a write-heavy log index creates thousands of tiny segments and triggers constant background merge I/O. Increasing `index.refresh_interval` from `"1s"` to **`"30s"`** increases log ingestion throughput by **50–80%**!
4. **Flush & Commit Point**:
   - Every 30 minutes (or when the Translog exceeds `512 MB`), OpenSearch executes a Lucene Commit: it calls `fsync()` on all unwritten segments in the OS Page Cache, writes a `.segments_N` commit point file, and truncates the old Translog.
5. **Segment Merging (Background Compaction & Deletion Purge)**:
   - Because Lucene segments are **immutable**, deleting or updating a document merely sets a bit in a `.del` bitmap file. A background `TieredMergePolicy` thread periodically merges smaller segments into larger ones (up to `5 GB`), physically purging `.del` tombstones and reclaiming disk space.

---

### 2.3 Game-Changer: OpenSearch Segment Replication vs. Document Replication

In legacy Elasticsearch and early OpenSearch (`replication.type: DOCUMENT`), when a Primary Shard indexed 10,000 log lines, it forwarded the raw JSON documents to every Replica Shard, and **every Replica Shard repeated the entire CPU-intensive JSON parsing, tokenization, FST construction, and BKD-tree indexing from scratch**.

In OpenSearch 2.7+ / 3.x with **Segment Replication (`"index.replication.type": "SEGMENT"`)**:
- **Only the Primary Shard** parses the JSON and builds the immutable Lucene segment.
- Upon refresh, the Primary Shard streams the **already-built binary Lucene segment files** directly to its Replica Shards over the network (or via S3 in zero-replication remote-backed storage).
- **Result**: Cuts cluster-wide CPU utilization by **40–50%** and increases sustained indexing throughput by up to **2x**.

---

## 3. Migrating Queries: Splunk SPL to OpenSearch PPL, DQL & Query DSL

The #1 cultural barrier when migrating engineering teams from Splunk to OpenSearch is query syntax. Engineers love Splunk's **SPL (Search Processing Language)** because they can chain unix-style pipes (`| where ... | stats ... | eval ... | sort ...`) iteratively.

**The Solution:** OpenSearch natively supports **PPL (Piped Processing Language)** inside OpenSearch Dashboards (Observability $\to$ Logs / Event Analytics) and via the `POST /_plugins/_ppl` REST endpoint!

<OpenSearchSplunkMigrationDiagram initialMode="spl-to-ppl" />

### 3.1 Comprehensive Splunk SPL $\to$ OpenSearch PPL Cheat Sheet

| Operation | Splunk SPL Syntax | OpenSearch PPL Syntax | Notes for Migrating Engineers |
| :--- | :--- | :--- | :--- |
| **Select Index / Data Stream** | `index="prod-logs"` | `source = logs-prod-*` | Always start a PPL query with `source = <index-pattern>`. |
| **Exact & Boolean Filter** | `service="order-svc" status>=500` | `\| where service = 'order-svc' and status >= 500` | Use single quotes `'...'` for string literals inside PPL `where` clauses. |
| **Full-Text Phrase Search** | `"Connection refused"` | `\| where match_phrase(message, 'Connection refused')` | Uses the Lucene Inverted Index (`text` field) with positional matching. |
| **Select Specific Columns** | `\| table _time, service, traceId, message` | `\| fields @timestamp, service, traceId, message` | `fields +` includes columns; `fields -` excludes columns. |
| **Rename Columns** | `\| rename traceId as trace_id` | `\| rename traceId as trace_id` | Identical syntax between SPL and PPL! |
| **Calculated / Derived Field** | `\| eval latency_sec = duration_ms / 1000` | `\| eval latency_sec = duration_ms / 1000` | Supports arithmetic, string functions (`concat`, `lower`, `substr`), and `if(cond, trueVal, falseVal)`. |
| **On-the-Fly Regex Extraction** | `\| rex field=message "user=(?<uid>\w+)"` | `\| parse message '.*user=(?<uid>\\w+).*' \| where isnotnull(uid)` | Extracts capture groups into ephemeral fields at query time (Schema-on-Read!). |
| **Aggregations (`stats`)** | `\| stats count, avg(lat), perc95(lat) by svc` | `\| stats count(), avg(lat), percentile(lat, 95) by svc` | Executes over columnar Lucene `DocValues`. |
| **Time-Series Histogram** | `\| timechart span=5m count by status` | `\| stats count() by span(@timestamp, 5m), status` | `span(@timestamp, 1m\|5m\|1h\|1d)` replaces `timechart`. |
| **Top / Rare Values** | `\| top 10 client_ip` / `\| rare client_ip` | `\| top 10 client_ip` / `\| rare client_ip` | Identical syntax between SPL and PPL! |
| **Deduplicate Events** | `\| dedup 1 traceId` | `\| dedup 1 traceId` | Keeps the first $N$ events per unique field combination. |
| **Sort & Limit** | `\| sort - error_count \| head 20` | `\| sort - error_count \| head 20` | `-` sorts descending; `+` sorts ascending. |

---

## 4. The 4 Deadly Production Traps When Migrating from Splunk

Because Splunk is Schema-on-Read, application teams often develop logging habits that are harmless in Splunk but **lethal** in a Schema-on-Write engine like OpenSearch.

### Trap 1: Mapping Explosion (The Dynamic Key Anti-Pattern)

In Splunk, a developer can log a JSON map keyed by dynamic IDs:
```json
// ❌ LETHAL IN OPENSEARCH (Dynamic Field Keys)
{
  "service": "cart-service",
  "items": {
    "sku_99182": { "qty": 2 },
    "sku_44109": { "qty": 1 }
  }
}
```
- **What happens in OpenSearch**: By default (`"dynamic": true`), every time OpenSearch sees a new JSON key (`items.sku_99182.qty`), it mutates the **Index Mapping** and broadcasts an updated `ClusterState` across every node in the cluster via the `cluster_manager`. Once an index exceeds `index.mapping.total_fields.limit` (default `1,000` fields), OpenSearch rejects all logs for that service (`IllegalArgumentException: Limit of total fields [1000] has been exceeded`), or worse, bloats the `ClusterState` until the Cluster Manager suffers a JVM Heap OOM!
- **The Principal Fix**:
  1. Refactor arrays of key-value pairs into structured objects (`"items": [{"sku": "sku_99182", "qty": 2}]`), OR
  2. Map dynamic metadata bags (`labels`, `tags`, `attributes`, `mdc`) using OpenSearch's **`flat_object`** field type! A `flat_object` indexes all arbitrary nested child keys into a single flattened field without adding individual sub-fields to the cluster mapping!

---

### Trap 2: The `text` vs. `keyword` Field Trap

In OpenSearch, string fields can be indexed in two fundamentally different ways:
- **`text` (Analyzed for Full-Text Search)**: Runs through the `standard` analyzer (splits on whitespace, hyphens, punctuation, and lowercases). `"order-service-prod"` becomes three separate tokens: `["order", "service", "prod"]`. Does **not** support `DocValues` sorting or `terms` aggregations.
- **`keyword` (Exact-Match & Aggregatable)**: Stored as a single verbatim byte string `"order-service-prod"` in both the Inverted Index and columnar `DocValues`.
- **The Fix**: In log index templates, map identifiers (`service`, `traceId`, `spanId`, `userId`, `orderId`, `level`, `host`, `status_code`) explicitly as **`keyword`** (never waste disk/CPU indexing both `text` and `.keyword` multi-fields for UUIDs or service names!). Reserve `text` exclusively for human-readable `message` and `error.stack_trace` fields.

---

### Trap 3: The 32 GB JVM Heap Ceiling & OS Page Cache Starvation

Engineers migrating from Java monoliths often allocate 56 GB of JVM Heap (`-Xmx56g`) on a 64 GB RAM OpenSearch data node. **This degrades performance by 40% and causes long GC pauses.**
1. **The 32 GB Compressed OOPs Boundary**: In the 64-bit HotSpot JVM, if heap size is below $\sim 32\text{ GB}$ (`-Xmx31g`), the JVM uses **Compressed Ordinary Object Pointers (Compressed OOPs)**—representing object references in 32 bits (4 bytes) instead of 64 bits (8 bytes) via bit-shifting. Crossing 32 GB (`-Xmx33g`) disables Compressed OOPs, so a 33 GB heap actually holds **fewer objects** than a 31 GB heap!
2. **OS Page Cache Is Where Lucene Lives**: Lucene relies on the Linux kernel's **Page Cache (`mmap`)** to keep hot `.doc` posting lists, `.dvd` `DocValues`, and `.kdd` BKD-trees in RAM.
   - **Rule of Thumb**: Allocate **50% of node RAM to JVM Heap, capped strictly at `31 GB` (`-Xms31g -Xmx31g`)**, leaving the remaining $\ge 50\%$ (`33+ GB`) untouched for the Linux OS Page Cache.

---

### Trap 4: Shard Sizing Math (Over-Sharding vs. Giant Shards)

Every Lucene shard maintains its own file descriptors, segment metadata, FST term index dictionaries in memory, and thread-pool execution overhead.
- **Target Primary Shard Size for Log Analytics**: **`30 GB to 50 GB` per shard**.
- **Capacity Formula**:
  $$\text{Primary Shards per Daily Index} = \left\lceil \frac{\text{Daily Compressed Index Volume (GB)}}{40\text{ GB}} \right\rceil$$
  *Example*: If your platform ingests $2\text{ TB/day}$ of raw JSON logs and `best_compression` (`ZSTD`) compresses it to $800\text{ GB/day}$ on disk:
  $$\text{Primary Shards} = \left\lceil \frac{800\text{ GB}}{40\text{ GB}} \right\rceil = 20\text{ Primary Shards} + 20\text{ Replica Shards (1 Replica)} = 40\text{ Total Shards/day}$$
  Distribute those 40 shards evenly across 10 Hot Data Nodes (4 shards per node), and configure **ISM Rollover** at `max_primary_shard_size: "50gb"` or `max_age: "1d"`.

---

## 5. Production Implementation: Data Prepper, ISM Policies & Java 21 Client

<OpenSearchSplunkMigrationDiagram initialMode="tiered-ism" />

### 5.1 OpenSearch Data Prepper Pipeline (Replacing Splunk Heavy Forwarder `props.conf` / `transforms.conf`)

```yaml
# pipelines/logs-ingestion-pipeline.yaml
log-ingestion-pipeline:
  workers: 8
  delay: "100"
  buffer:
    bounded_blocking:
      buffer_size: 25600
      batch_size: 1000
  source:
    kafka:
      bootstrap_servers: ["kafka-1.internal:9092", "kafka-2.internal:9092"]
      topics:
        - name: "k8s-application-logs"
          group_id: "dataprepper-opensearch-prod"
          workers: 8
  processor:
    # 1. Parse JSON container log envelope
    - parse_json:
        source: "message"
        handle_failed_events: skip
    # 2. Drop noisy Kubernetes healthcheck & Prometheus scrape logs (saves 20% storage)
    - drop_events:
        drop_when: '/requestPath == "/actuator/health" or /requestPath == "/actuator/prometheus"'
    # 3. Redact sensitive PII (Credit Cards / Bearer Tokens) before indexing (replaces SEDCMD in Splunk props.conf)
    - substitute_string:
        entries:
          - source: "message"
            from: "(?i)(Bearer\\s+)[A-Za-z0-9\\-_]+\\.[A-Za-z0-9\\-_]+\\.[A-Za-z0-9\\-_]+"
            to: "$1[REDACTED_JWT]"
    # 4. Standardize timestamp to @timestamp
    - date:
        from_time_received: false
        match:
          - key: "timestamp"
            patterns: ["yyyy-MM-dd'T'HH:mm:ss.SSSZ"]
        destination: "@timestamp"
  sink:
    - opensearch:
        hosts: ["https://opensearch-ingest.internal:9200"]
        index_type: custom
        # Route dynamically into service-tier data streams
        index: "logs-prod-%{service}"
        bulk_size: 15
        flush_timeout: 5000
        dlq:
          s3:
            bucket: "prod-opensearch-dlq-events"
            region: "us-east-1"
            key_path_prefix: "failed-mapping-logs/"
```

---

### 5.2 Production Index Template & Index State Management (ISM) Policy

```json
// PUT _index_template/logs-prod-template
{
  "index_patterns": ["logs-prod-*"],
  "data_stream": {
    "timestamp_field": { "name": "@timestamp" }
  },
  "priority": 200,
  "template": {
    "settings": {
      "index.number_of_shards": 10,
      "index.number_of_replicas": 1,
      "index.refresh_interval": "30s",
      "index.codec": "best_compression",
      "index.replication.type": "SEGMENT",
      "index.mapping.total_fields.limit": 1000,
      "plugins.index_state_management.policy_id": "logs-hot-warm-cold-90d"
    },
    "mappings": {
      "dynamic": "strict",
      "properties": {
        "@timestamp":      { "type": "date" },
        "level":           { "type": "keyword" },
        "service":         { "type": "keyword" },
        "version":         { "type": "keyword" },
        "environment":     { "type": "keyword" },
        "traceId":         { "type": "keyword" },
        "spanId":          { "type": "keyword" },
        "userId":          { "type": "keyword" },
        "orderId":         { "type": "keyword" },
        "errorCode":       { "type": "keyword" },
        "durationMs":      { "type": "long" },
        "status":          { "type": "integer" },
        "message":         { "type": "text", "norms": false },
        "stackTrace":      { "type": "text", "norms": false },
        "mdc":             { "type": "flat_object" },
        "k8sLabels":       { "type": "flat_object" }
      }
    }
  }
}
```

> [!TIP]
> **Why `"norms": false` on `message` and `stackTrace`?** In e-commerce search, Lucene stores per-document length normalization factors (`norms`, 1 byte per doc per field) so shorter product titles rank higher in BM25 scoring. In **log search**, you never care whether a shorter log message is "more relevant" than a longer log message! Setting `"norms": false` on log `text` fields saves hundreds of megabytes of memory and disk per shard.

---

### 5.3 Java 21 OpenSearch Client: High-Throughput Search & Aggregations (`opensearch-java`)

```java
package com.example.observability.opensearch;

import org.opensearch.client.json.JsonData;
import org.opensearch.client.opensearch.OpenSearchClient;
import org.opensearch.client.opensearch._types.FieldValue;
import org.opensearch.client.opensearch._types.SortOrder;
import org.opensearch.client.opensearch._types.aggregations.Aggregate;
import org.opensearch.client.opensearch._types.aggregations.StringTermsBucket;
import org.opensearch.client.opensearch.core.SearchRequest;
import org.opensearch.client.opensearch.core.SearchResponse;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
public class LogAnalyticsQueryService {

    private final OpenSearchClient openSearchClient;

    public LogAnalyticsQueryService(OpenSearchClient openSearchClient) {
        this.openSearchClient = openSearchClient;
    }

    public record ServiceErrorSummary(String serviceName, long errorCount, double p99DurationMs) {}

    /**
     * Executes the Java DSL equivalent of Splunk SPL:
     * index="logs-prod-*" level="ERROR" @timestamp >= from
     * | stats count as errorCount, perc99(durationMs) as p99DurationMs by service
     */
    public List<ServiceErrorSummary> getTopErrorServices(Instant from, Instant to) throws IOException {
        SearchRequest request = SearchRequest.of(s -> s
            .index("logs-prod-*")
            .size(0) // Don't fetch raw _source documents; compute purely over columnar DocValues
            .query(q -> q.bool(b -> b
                // Use filter context (NOT must) so Lucene caches Roaring Bitmaps and skips BM25 scoring!
                .filter(f -> f.term(t -> t.field("level").value(FieldValue.of("ERROR"))))
                .filter(f -> f.range(r -> r
                    .field("@timestamp")
                    .gte(JsonData.of(from.toString()))
                    .lte(JsonData.of(to.toString()))
                ))
            ))
            .aggregations("by_service", a -> a
                .terms(t -> t
                    .field("service")
                    .size(25)
                    .order(Map.of("_count", SortOrder.Desc))
                )
                .aggregations("p99_latency", sub -> sub
                    .percentiles(p -> p.field("durationMs").percents(99.0))
                )
            )
        );

        SearchResponse<Void> response = openSearchClient.search(request, Void.class);
        Aggregate byServiceAgg = response.aggregations().get("by_service");

        return byServiceAgg.sterms().buckets().array().stream()
            .map((StringTermsBucket bucket) -> {
                double p99 = bucket.aggregations()
                    .get("p99_latency")
                    .tdigestPercentiles()
                    .values()
                    .keyed()
                    .getOrDefault("99.0", 0.0);
                return new ServiceErrorSummary(bucket.key(), bucket.docCount(), p99);
            })
            .toList();
    }
}
```

---

## 🧠 Senior/Staff Interview Playbook: How to Ace OpenSearch & Splunk Migration Interviews

When an interviewer asks *"How would you migrate a 10 TB/day Splunk log cluster to OpenSearch?"* or *"Our OpenSearch cluster is dropping bulk writes and hitting 95% JVM Heap—how do you diagnose and fix it?"*, use this Principal framework.

### 1. The Senior Framing Strategy (First 60 Seconds)

In the first 60 seconds, frame OpenSearch around **Four Physical & Economic Laws**:
1. **Schema-on-Read $\to$ Schema-on-Write Governance**: Explain that Splunk defers parsing cost to query time (`rawdata` + `tsidx`), whereas OpenSearch front-loads structure into immutable **Apache Lucene segments** (`FST` Term Dictionaries + Roaring Bitmap Posting Lists + Columnar `DocValues`). Therefore, migration begins at the **Ingestion Contract** (strict Index Templates, `flat_object` for dynamic labels, and Data Prepper DLQs for malformed logs).
2. **Back-of-the-Envelope Cluster Sizing Math (10 TB/day Raw Logs)**:
   - **Compression & Replica Factor**: 10 TB/day raw JSON compressed with `ZSTD` (`best_compression`) + `"norms": false` $\approx$ 4 TB/day primary index size. With 1 Replica (`Segment Replication`), Hot storage per day = 8 TB/day.
   - **7-Day Hot NVMe Tier**: $8\text{ TB/day} \times 7\text{ days} \times 1.25\text{ (watermark + merge headroom)} = 70\text{ TB}$ of NVMe SSD across ~24 `i4i.4xlarge` Hot Data Nodes (200 Primary Shards/day at `40 GB/shard`).
   - **83-Day UltraWarm / Cold S3 Tier**: Days 8–90 sit on S3 via **Searchable Snapshots** at `$0.023` per GB per month with zero replica overhead (S3 provides 11 nines of durability natively).
3. **The 31 GB JVM Heap & OS Page Cache Split**: Always enforce `-Xms31g -Xmx31g` on 64 GB RAM nodes to keep 32-bit **Compressed OOPs** active and dedicate $\ge 50\%$ of host RAM to the **Linux OS Page Cache** where Lucene `mmap`s `.dvd` (`DocValues`) and `.doc` (Posting Lists).
4. **Decoupled Buffering (Kafka + Data Prepper)**: Never allow 500 microservices to push logs directly into OpenSearch HTTP endpoints. Always place **Kafka + OpenSearch Data Prepper** in front to absorb $10\times$ outage log storms and route poison mapping documents to an S3 Dead-Letter Queue.

---

### 2. Classic Interviewer Traps & Principal Rebuttals

#### Trap 1: "When we migrated from Splunk to OpenSearch, our engineers kept searching for error substrings using leading wildcards like `message: *NullPointerException*` in Dashboards, and the cluster CPU pinned at 100%. Why did that work in Splunk but kill OpenSearch?"
* **Junior/Mid Answer:** "Wildcard queries are slow in OpenSearch; engineers should use exact match queries instead."
* **Principal Rebuttal:** "Look at the **Finite State Transducer (FST) Term Dictionary** inside Lucene: terms are sorted lexicographically by prefix. A prefix query (`NullPointer*`) jumps directly to the `'N'` transition in the FST in $O(1)$ time. However, a **leading wildcard (`*NullPointerException*`)** cannot use the prefix FST—it forces every shard to iterate through **every single unique term in the Term Dictionary** and build a massive deterministic finite automaton (DFA) in JVM heap!
  - **The Principal Fix**:
    1. Stop treating structured stack traces as raw text blobs: extract `error.type: "java.lang.NullPointerException"` as a dedicated `keyword` field at ingest time via `LogstashEncoder` / Data Prepper.
    2. Use `match_phrase` on tokenized `text` fields (`message: "NullPointerException"`), which hits the Inverted Index in `< 5 ms`.
    3. If genuine substring/infix search is required (e.g., searching partial SQL queries or file paths), use OpenSearch's **`wildcard` field type** (which indexes 3-character **trigram N-grams** into the inverted index specifically to accelerate `*substring*` queries!)."

#### Trap 2: "Why should we use a `bool.filter` clause instead of `bool.must` when querying logs by `service`, `environment`, and `@timestamp` in OpenSearch Query DSL?"
* **Junior/Mid Answer:** "`filter` is slightly faster because it doesn't calculate a relevance score."
* **Principal Rebuttal:** "Skipping the floating-point **BM25 (`TF-IDF`)** math is only half the story. The massive performance difference comes from **Lucene's Roaring Bitmap Filter Cache (`IndicesQueryCache`)**:
  - Clauses inside `bool.must` are evaluated in **Query Context**: they compute a per-document `_score` and **cannot be cached** in the node's bitset cache.
  - Clauses inside `bool.filter` are evaluated in **Filter Context**: for frequently used filters (like `environment: "prod"` or `level: "ERROR"`) on segments with more than 10,000 documents, OpenSearch caches the resulting **Roaring Bitmap** (1 bit per document, compressed) in memory. Subsequent queries reuse the cached bitset via bitwise `AND` CPU instructions in **microseconds**, bypassing disk and BKD/FST traversal entirely!"

#### Trap 3: "During a major production incident, our services logged 10x more errors than usual. OpenSearch started returning `429 Too Many Requests (es_rejected_execution_exception)` on `_bulk` writes, and recent logs stopped appearing in Dashboards for 20 minutes. How do you prevent and recover from this?"
* **Junior/Mid Answer:** "Increase the bulk thread pool queue size in OpenSearch from 200 to 5,000 so it doesn't reject requests."
* **Principal Rebuttal:** "Increasing the in-memory `write` thread pool queue in OpenSearch is an **anti-pattern** that simply shifts the failure from clean `429` backpressure into a fatal **JVM Old-Gen Heap OOM** (because 5,000 queued `_bulk` payloads of 10 MB each consume 50 GB of JVM heap!).
  - **How to Architect for 10x Log Floods**:
    1. **Upstream Kafka Backpressure**: Keep OpenSearch's `write` queue small and let Data Prepper pause Kafka partition consumption when OpenSearch returns `429`, buffering the spike safely on Kafka's sequential disk log.
    2. **Dynamic Ingest Tuning**: Set `index.refresh_interval: "30s"` (or `"60s"` during an emergency flood) and enable `index.replication.type: "SEGMENT"` so replica shards don't burn CPU re-indexing documents.
    3. **Hot-Shard Avoidance**: Ensure the active Data Stream write index has enough primary shards ($2\times$ the number of Hot Data Nodes) so every Hot node's NVMe drive and CPU cores participate evenly in `_bulk` ingestion."

#### Trap 4: "An engineer ran a dashboard aggregation grouping by `traceId` (`size: 100000`) over 7 days of logs, and OpenSearch threw `circuit_breaking_exception: [parent] Data too large`. Why did that happen and how do you guard the cluster?"
* **Junior/Mid Answer:** "Grouping by high-cardinality fields uses too much memory; we should tell engineers not to aggregate on `traceId`."
* **Principal Rebuttal:** "Running a standard `terms` aggregation with `size: 100000` on a high-cardinality field like `traceId` or `userId` forces every shard to build a hash table of 100,000 buckets in JVM Heap and stream them to the Coordinating Node, tripping the **Parent Circuit Breaker** (set at 95% of JVM Heap to prevent a hard `OutOfMemoryError` crash).
  - **The Principal Guardrails**:
    1. To count unique traces/users, use the **`cardinality` aggregation** (backed by **HyperLogLog++** probabilistic sketches, which estimates 100 million unique IDs using only **12–40 KB of memory**!).
    2. If you genuinely need to paginate through all unique high-cardinality buckets, use a **`composite` aggregation** with `after` cursor pagination (`size: 1000` per page) instead of a giant single-shot `terms` aggregation.
    3. Enable OpenSearch **Search Backpressure & Query Sandboxing** (`search_backpressure.mode: enforced`) to automatically cancel runaway queries that exceed heap or CPU thresholds before they trip the node-wide circuit breaker."

#### Trap 5: "How do you execute a zero-downtime migration from Splunk to OpenSearch for 500 microservices without losing a single alert or compliance log?"
* **Junior/Mid Answer:** "Switch Fluent Bit to send logs to OpenSearch instead of Splunk over a weekend maintenance window."
* **Principal Rebuttal:** "Never do a big-bang cutover on an observability pipeline during a maintenance window. Execute a **4-Phase Dual-Shipping Strangler Migration**:
  1. **Phase 1 — Dual-Sink Tee at the Shipper / Collector**: Configure the OpenTelemetry Collector / Fluent Bit / Kafka pipeline to fan out 100% of logs to **both** Splunk HEC (HTTP Event Collector) and OpenSearch Data Prepper simultaneously.
  2. **Phase 2 — Schema & Mapping Stabilization**: Monitor the Data Prepper S3 Dead-Letter Queue (DLQ) for 2 weeks to catch type conflicts (e.g., Service A logging `status: 200` as integer while Service B logs `status: "OK"` as string) and normalize them into OpenTelemetry / ECS (Elastic Common Schema) conventions.
  3. **Phase 3 — Alert & Dashboard Shadowing**: Translate top Splunk SPL alerts into **OpenSearch PPL / DSL Alerting Monitors** running in a `#shadow-alerts` Slack channel. Compare alert firing parity and query p99 latency against Splunk for 14 days.
  4. **Phase 4 — Cold Cutover & Historical S3 Export**: Turn off the Splunk HEC sink before license renewal, keeping legacy historical Splunk data exported as Parquet/JSON in S3 (queryable on-demand via Amazon Athena or OpenSearch S3 Data Source Federation without keeping Splunk indexers running)."

---

### 3. Mid-Level vs. Principal Candidate Cheat Sheet

| Concept / Scenario | Mid-Level Candidate Says | Principal Candidate Demonstrates |
| :--- | :--- | :--- |
| **Splunk vs. OpenSearch Engine** | "Splunk is commercial and OpenSearch is open-source Elasticsearch." | "Splunk is **Schema-on-Read** (`rawdata` + `tsidx` parsed via regex at query time); OpenSearch is **Schema-on-Write** (Apache Lucene `FST` Inverted Index + `BKD-Trees` + columnar `DocValues` built at ingest time)." |
| **Splunk SPL Migration** | "Rewrite all Splunk queries into JSON Query DSL." | "Use **OpenSearch PPL (Piped Processing Language)** (`source=logs-* \| where ... \| stats ... by span(@timestamp, 5m)`) for 1:1 SPL pipe parity in Dashboards and alerting." |
| **Dynamic JSON Fields** | "OpenSearch automatically indexes any JSON field you send." | "Unbounded dynamic fields cause **Cluster State Mapping Explosion**. Enforce `dynamic: strict` on core fields and map arbitrary tag/label maps as **`flat_object`**." |
| **Node Memory Sizing** | "Give the OpenSearch JVM as much RAM as possible (e.g. 56 GB on a 64 GB host)." | "Cap JVM Heap strictly at **`-Xms31g -Xmx31g`** to preserve 32-bit **Compressed OOPs** and leave $\ge 50\%$ RAM (33 GB) for the **Linux OS Page Cache** (`mmap` for `DocValues` and Posting Lists)." |
| **Replication Overhead** | "Set `number_of_replicas: 1` for high availability." | "Enable **Segment Replication (`index.replication.type: SEGMENT`)** so only the Primary Shard builds Lucene segments and streams binary segment files to Replicas, cutting cluster CPU by 40–50%." |
| **Long-Term Retention Cost** | "Delete logs after 14 days because SSDs are expensive." | "Use **Index State Management (ISM)**: keep Days 0–7 on Hot NVMe, transition Days 8–30 to **UltraWarm (S3 Searchable Snapshots)**, and Days 31–90 to **Cold S3**, cutting storage cost by ~75%." |

---

## See Also

- **[OpenSearch Query, Search & Aggregation Guideline: How to Query Properly & Effectively](./opensearch-query-search-best-practices.md)** — Query vs. Filter Context (`IndicesQueryCache` Roaring Bitmaps), `Point-in-Time + search_after` pagination, high-cardinality aggregations, and Hybrid BM25 + k-NN Vector Search.
- **[OpenSearch Indexing, Schema Design & Day-2 Operations Guideline](./opensearch-indexing-schema-operations-guide.md)** — Schema mapping rules (`nested` vs `flat_object`), zero-downtime Alias + `_reindex` migrations, `_bulk` throughput optimization, `UUIDv7` IDs, multi-tenant `_routing`, and Day-2 runbooks.
- **[Log Aggregation (ELK / EFK / Loki Patterns)](./log-aggregation.md)** — Structured JSON logging, `MdcRequestContextFilter`, and Spring Boot `LogstashEncoder` configuration.
- **[Search Systems & Inverted Indexes](./search-systems.md)** — Full-text search, BM25 relevance scoring, autocomplete edge N-grams, and CDC indexing.
- **[SLF4J, Log Levels & Error Stacktrace Printout Internals](../java/java-logging-slf4j-stacktrace.md)** — How JVM stack traces and `ShortenedThrowableConverter` (`rootCauseFirst`) feed into log aggregation pipelines.
- **[Observability & Monitoring](./observability.md)** — Correlating Logs, Metrics (Prometheus/Micrometer), and Distributed Traces (OpenTelemetry).
