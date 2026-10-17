---
id: opensearch-indexing-schema-operations-guide
title: "OpenSearch Indexing, Schema Design & Day-2 Operations Guideline: How to Build & Run Effectively"
sidebar_label: "OpenSearch Schema & Ops Guide"
description: "Principal engineering guide to OpenSearch schema design (nested vs flat_object, keyword vs numeric IDs), zero-downtime Alias + sliced _reindex migrations, high-throughput Java 21 BulkIngester, multi-tenant shard _routing, and Day-2 operational runbooks."
tags:
  - system-design
  - opensearch
  - indexing
  - schema-design
  - bulk-api
  - operations
  - multi-tenancy
  - lucene
  - sre
---

import OpenSearchBestPracticesDiagram from '@site/src/components/OpenSearchBestPracticesDiagram';

# OpenSearch Indexing, Schema Design & Day-2 Operations Guideline: How to Build & Run Effectively

Because OpenSearch is a **Schema-on-Write** distributed engine backed by immutable **Apache Lucene** segments, architectural mistakes made in your **Index Mapping**, **Document `_id` strategy**, or **Shard Routing** cannot be fixed with a simple `ALTER TABLE`—they require reindexing terabytes of data.

This guide establishes the production engineering standards for **designing OpenSearch schemas, executing zero-downtime migrations, maximizing `_bulk` ingestion throughput, isolating multi-tenant workloads, and operating clusters reliably on Day 2**.

---

## 1. Schema & Mapping Design Guidelines (Getting Schema-on-Write Right)

Never allow production indices to rely on default dynamic mapping (`"dynamic": true`), which indexes every string twice (`text` + `.keyword`) and leaves your cluster vulnerable to **Mapping Explosions**. Always enforce `"dynamic": "strict"` (or `"dynamic": false` alongside a `flat_object` metadata field).

<OpenSearchBestPracticesDiagram initialMode="schema-reindex" />

### 1.1 The Principal Field Mapping Decision Matrix

| Data Type / Field Pattern | ❌ Naive Mapping | ✅ Optimal OpenSearch Mapping | Under-the-Hood Storage & CPU Reason |
| :--- | :--- | :--- | :--- |
| **Identifiers (`order_id`, `user_id`, `zip_code`, `isbn`, `sku`)** | `long` or `integer` (because the ID happens to be digits) | **`keyword`** | Numeric types build **BKD-Trees** optimized for `range` scans (`BETWEEN 100 AND 500`), which are **3x slower** for exact equality lookups than a `keyword` **FST Term Dictionary**! Only map a field as numeric if you run `<`, `>`, or math aggregations (`sum`/`avg`) on it. |
| **High-Volume Log Text (`message`, `stack_trace`)** | Default `text` (with `norms: true` and `.keyword` subfield) | **`text` with `"norms": false`** (and **no** `.keyword` subfield) | Disabling `norms` saves `1 byte` per document per field (hundreds of MBs of RAM) because log search doesn't need document-length relevance boosting. |
| **Substring / Path Search (`file_path`, `url`, `sql_fingerprint`)** | `keyword` queried with `*substring*` | **`wildcard`** | Indexes **3-character trigram N-grams** into the inverted index so infix `*foo*` queries run in milliseconds instead of scanning the entire FST. |
| **Single-Value Environment / Index Constant (`env: "prod"`)** | `keyword` | **`constant_keyword`** | Stores the value once in the segment metadata instead of repeating it in every document's posting list, making filter queries instant with `0 bytes` of per-doc overhead. |
| **Arbitrary User Tags / K8s Labels / MDC Map** | `"dynamic": true` nested `object` | **`flat_object`** | Prevents **ClusterState Mapping Explosion** (`total_fields.limit > 1000`) by indexing all dynamic child keys into a single flattened field. |
| **Opaque JSON Blob Returned to UI Only (`raw_webhook_payload`)** | Indexed `object` or `text` | **`object` with `"enabled": false`** | Stored in compressed `_source` so the API can return it, but **completely skipped by Lucene indexing**, saving 100% of CPU, FST, and `DocValues` disk space! |
| **Filter-Only Token (Never Sorted or Aggregated)** | Default `keyword` (`doc_values: true`) | **`keyword` with `"doc_values": false`** | If you only filter on `session_token_hash` via `term` queries and **never** run `sort` or `terms` aggregations on it, disabling `doc_values` cuts that field's disk footprint by **50%**. |

---

### 1.2 Arrays of Objects: The Flattening Trap vs. `nested` vs. `flat_object`

Suppose you index an order document containing an array of line items or permissions:
```json
{
  "order_id": "ord_500",
  "approvers": [
    { "name": "Alice", "role": "admin" },
    { "name": "Bob",   "role": "viewer" }
  ]
}
```
1. **Why Standard `type: "object"` Silently Returns Wrong Results**:
   - In Lucene, standard JSON arrays of objects are **flattened into parallel multi-value fields**:
     - `approvers.name`: `["Alice", "Bob"]`
     - `approvers.role`: `["admin", "viewer"]`
   - The correlation between element `0` and element `1` is **destroyed**! A query asking for `approvers.name = "Bob" AND approvers.role = "admin"` will **FALSELY MATCH** `ord_500`!
2. **When to Use `type: "nested"` (And Its Hidden Write Amplification Cost)**:
   - Mapping `"approvers": { "type": "nested" }` instructs Lucene to index each element of the `approvers` array as a **separate, hidden child Lucene document** stored sequentially inside the same segment block as the parent document.
   - Querying via a `nested` query preserves 100% correlation (`Bob` + `admin` correctly returns `false`).
   - **Production Gotcha (Root-Plus-Children Explosion)**:
     - If `1` parent document contains `200` nested items, Lucene physically indexes **`201` documents**!
     - Updating a single field on the parent document requires **re-indexing all 201 Lucene documents**.
     - Always keep `nested` arrays bounded (`< 50` elements) and enforce `index.mapping.nested_objects.limit: 10000` (default) to prevent malicious payloads from causing OOMs.

---

## 2. Zero-Downtime Schema Evolution: Read/Write Aliases + Sliced `_reindex`

Because Lucene segments are immutable on disk, you **cannot** change an existing field's mapping type in-place (e.g., changing `status` from `text` to `keyword`) or change `number_of_shards` on an existing index.

**Golden Rule**: Microservices must **NEVER** reference a physical index name (`orders_v1`) in application code. Always reference **Index Aliases** (`orders_read` and `orders_write`).

### 2.1 The 5-Step Zero-Downtime Migration Runbook

```http
### STEP 1: Initial State — Aliases point to physical index orders_v1
POST /_aliases
{
  "actions": [
    { "add": { "index": "orders_v1", "alias": "orders_read" } },
    { "add": { "index": "orders_v1", "alias": "orders_write", "is_write_index": true } }
  ]
}

### STEP 2: Create the new physical index orders_v2 with the updated mapping
PUT /orders_v2
{
  "settings": {
    "index.number_of_shards": 12,
    "index.number_of_replicas": 1,
    "index.refresh_interval": "30s",
    "index.replication.type": "SEGMENT"
  },
  "mappings": {
    "dynamic": "strict",
    "properties": {
      "order_id": { "type": "keyword" },
      "status":   { "type": "keyword" },
      "amount":   { "type": "scaled_float", "scaling_factor": 100 }
    }
  }
}

### STEP 3: Dual-Write or Point Write Alias + Background Parallel Sliced Reindex
# Use ?slices=auto so OpenSearch parallelizes the scroll+bulk across all primary shards!
# Set requests_per_second to throttle background I/O so live search p99 is unaffected.
POST /_reindex?slices=auto&wait_for_completion=false&requests_per_second=5000
{
  "conflicts": "proceed",
  "source": {
    "index": "orders_v1",
    "size": 2500
  },
  "dest": {
    "index": "orders_v2",
    "op_type": "index"
  }
}
# Monitor progress via: GET /_tasks?detailed=true&actions=*reindex

### STEP 4: Atomic Cutover (Executes in < 5ms inside ClusterState with ZERO downtime!)
POST /_aliases
{
  "actions": [
    { "remove": { "index": "orders_v1", "alias": "orders_read" } },
    { "remove": { "index": "orders_v1", "alias": "orders_write" } },
    { "add":    { "index": "orders_v2", "alias": "orders_read" } },
    { "add":    { "index": "orders_v2", "alias": "orders_write", "is_write_index": true } }
  ]
}

### STEP 5: Run a final delta _reindex for any documents written during Step 3, then delete orders_v1
DELETE /orders_v1
```

> [!TIP]
> **When Can You Avoid Creating a New Index?**
> If you are simply **adding a brand-new field** (or adding a `.keyword` multi-field to an existing `text` field), you do **not** need a new index! Update the existing mapping in-place (`PUT /orders_v1/_mapping`) and backfill existing documents asynchronously via `POST /orders_v1/_update_by_query?slices=auto&conflicts=proceed`.

---

## 3. High-Throughput Indexing & `_bulk` Best Practices

<OpenSearchBestPracticesDiagram initialMode="bulk-routing" />

### 3.1 The 5 Laws of High-Throughput `_bulk` Ingestion

1. **Size `_bulk` Requests by Byte Volume (`5 MB to 15 MB`), Not Document Count**:
   - Sending `10,000` tiny 200-byte metrics (`2 MB`) is safe, whereas sending `10,000` large 50 KB stack traces (`500 MB` in a single HTTP request!) will immediately choke the Coordinating Node's JVM Heap and trigger `circuit_breaking_exception`.
   - Always configure your bulk flusher to trigger when **either** `maxOperations` (`2,000–5,000`) **or** `flushBytes` (**`10 MB`**) is reached first.
2. **Avoid Random `UUIDv4` Document `_id`s on Append-Only Data (+40% to +65% Speedup)**:
   - Whenever you supply a custom `_id` (`{"index": {"_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479"}}`), the Primary Shard cannot know whether that ID already exists in an older segment. It must probe the **per-segment Bloom filters and FST Term Dictionaries** across existing segments on disk to check if an older version needs to be marked as deleted in `.del`!
   - With completely random `UUIDv4` strings, values span the entire byte range (`00..ff`), causing constant **FST prefix cache misses** on every segment.
   - **The Principal Fix**:
     - For append-only logs/events: **Omit `_id`** and let OpenSearch auto-generate its time-ordered, shard-local flake ID (which skips segment duplicate checks entirely!).
     - If you require idempotent retries from Kafka/SQS: Use **time-ordered `UUIDv7` (RFC 9562)** or a `timestamp + sequence` prefix so all newly arriving IDs share the same lexicographical FST prefix in the OS Page Cache!
3. **Never Retry the Entire `_bulk` Batch on Partial Failure (`200 OK` with `"errors": true`)**:
   - The OpenSearch `_bulk` API returns HTTP `200 OK` even if 50 out of 1,000 documents failed with `429 Too Many Requests`!
   - You **must** check `bulkResponse.errors()` and iterate through `bulkResponse.items()`:
     - If an item failed with `429` (`es_rejected_execution_exception`), retry **only that specific failed document** with exponential backoff + jitter.
     - If an item failed with `400` (`mapper_parsing_exception`), **never retry it**—route it immediately to a Dead-Letter Queue (DLQ) so a single poison document doesn't block the batch forever!
4. **Disable Replicas & Refresh During Massive Historical Backfills**:
   - When bulk-loading 500M historical records into a brand-new index, temporarily set `"index.refresh_interval": "-1"` and `"index.number_of_replicas": 0`.
   - Once the bulk load completes, restore `"index.number_of_replicas": 1` (with `Segment Replication`, the primary simply streams the completed segment files to the replica!), run `POST /my_index/_refresh`, and set `"index.refresh_interval": "30s"`.
5. **Use Custom `_routing` for Multi-Tenant SaaS Isolation**:
   - By default, documents are scattered across all $N$ primary shards via `Murmur3Hash(_id) % N`. A search for `tenant_id = "acme"` must scatter-gather across all $N$ shards.
   - By indexing and searching with `?routing=acme`, all of Acme's documents live on **1 shard** (or `k` shards if `index.routing_partition_size: k` is configured for whale tenants), reducing search CPU and IOPS by **$N\times$**!
   - Always enforce `"_routing": { "required": true }` in the index mapping so developers cannot accidentally query or index without specifying the tenant routing key.

---

### 3.2 Production Java 21 `BulkIngester` with Byte-Threshold & DLQ Routing

```java
package com.example.search.opensearch;

import org.opensearch.client.opensearch.OpenSearchClient;
import org.opensearch.client.opensearch._helpers.bulk.BulkIngester;
import org.opensearch.client.opensearch._helpers.bulk.BulkListener;
import org.opensearch.client.opensearch.core.BulkRequest;
import org.opensearch.client.opensearch.core.BulkResponse;
import org.opensearch.client.opensearch.core.bulk.BulkResponseItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.Closeable;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Component
public class ProductionOpenSearchBulkIndexer implements Closeable {

    private static final Logger log = LoggerFactory.getLogger(ProductionOpenSearchBulkIndexer.class);

    private final BulkIngester<String> bulkIngester;

    public ProductionOpenSearchBulkIndexer(OpenSearchClient client) {
        BulkListener<String> listener = new BulkListener<>() {
            @Override
            public void beforeBulk(long executionId, BulkRequest request, List<String> contexts) {
                log.debug("Dispatching bulk executionId={} with {} operations", executionId, request.operations().size());
            }

            @Override
            public void afterBulk(long executionId, BulkRequest request, List<String> contexts, BulkResponse response) {
                if (!response.errors()) {
                    return;
                }
                List<BulkResponseItem> items = response.items();
                for (int i = 0; i < items.size(); i++) {
                    BulkResponseItem item = items.get(i);
                    if (item.error() != null) {
                        int status = item.status();
                        String docId = contexts.get(i);
                        if (status == 429) {
                            // Transient backpressure: schedule targeted retry with backoff
                            log.warn("Bulk item throttled (429) for docId={}, reason={}", docId, item.error().reason());
                        } else if (status >= 400 && status < 500) {
                            // Permanent mapping/schema error: route to Dead-Letter Queue (never infinite-retry!)
                            log.error("Poison document rejected ({}): docId={}, type={}, reason={}",
                                status, docId, item.error().type(), item.error().reason());
                        }
                    }
                }
            }

            @Override
            public void afterBulk(long executionId, BulkRequest request, List<String> contexts, Throwable failure) {
                log.error("Entire bulk request failed (network/timeout) for executionId={}", executionId, failure);
            }
        };

        this.bulkIngester = BulkIngester.of(b -> b
            .client(client)
            .maxOperations(5000)                    // Cap at 5,000 docs
            .maxSize(10L * 1024L * 1024L)           // Cap at 10 MB byte payload (whichever hits first!)
            .flushInterval(2, TimeUnit.SECONDS)     // Bound NRT ingest latency
            .maxConcurrentRequests(4)               // Bound in-flight memory pressure
            .listener(listener)
        );
    }

    /**
     * Enqueues a tenant-routed document using a time-ordered UUIDv7 ID.
     */
    public <T> void indexTenantDocument(String writeAlias, String tenantId, String uuidV7Id, T document) {
        bulkIngester.add(op -> op
            .index(idx -> idx
                .index(writeAlias)
                .id(uuidV7Id)
                .routing(tenantId) // Co-locate tenant documents onto their dedicated shard!
                .document(document)
            ),
            uuidV7Id
        );
    }

    @Override
    public void close() {
        bulkIngester.close();
    }
}
```

---

## 4. Day-2 Operations, Circuit Breakers & Troubleshooting Runbook

### 4.1 Diagnosing `Yellow` and `Red` Cluster States in 60 Seconds

- **Cluster Status `Yellow`**: All **Primary Shards** are active (reads and writes work), but one or more **Replica Shards** are `UNASSIGNED`.
  - *Common Cause*: A single-node dev cluster (or 2-node cluster where `number_of_replicas: 2`) cannot allocate a replica to the same host that holds the primary shard (**Same-Host Anti-Affinity Rule**).
- **Cluster Status `Red`**: At least one **Primary Shard** is `UNASSIGNED` (data on that shard is unavailable for reads and writes!).
- **The #1 Diagnostic Command**: Never guess why a shard is unassigned—run:
  ```http
  GET /_cluster/allocation/explain
  {
    "index": "orders_v2",
    "shard": 3,
    "primary": true
  }
  ```
  This returns the exact decider (`disk_threshold`, `same_shard`, `awareness`, `max_retry`) blocking allocation!

---

### 4.2 Disk Watermarks & Recovering From `read_only_allow_delete`

OpenSearch protects data nodes from running out of disk space during Lucene segment merges via three watermark thresholds:

| Watermark Tier | Default Disk Threshold | Cluster Manager Action | Operational Recovery Procedure |
| :--- | :--- | :--- | :--- |
| **Low Watermark** | `85%` (`cluster.routing.allocation.disk.watermark.low`) | Stops allocating **new** shards to this node (existing primary/replica shards continue accepting writes). | Delete old indices, scale EBS/NVMe storage, or rebalance shard count. |
| **High Watermark** | `90%` (`...disk.watermark.high`) | Actively **relocates existing shards away** from this node to healthier nodes. | Monitor `GET /_cat/recovery?v` and ensure ISM rollover policies are deleting expired indices. |
| **Flood Stage** | `95%` (`...disk.watermark.flood_stage`) | **Emergency Circuit Breaker**: Sets `"index.blocks.read_only_allow_delete": true` on every index with a shard on that node! All writes fail with `403 Forbidden (cluster_block_exception)`. | Free disk below 85% (delete old indices or expand volume). OpenSearch 2.x+ automatically clears the read-only block once disk usage drops below the high watermark, or clear manually via:<br/>`PUT /_all/_settings {"index.blocks.read_only_allow_delete": null}` |

---

### 4.3 Production Readiness Checklist (15-Point Pre-Launch Audit)

| # | Category | Production Requirement | Target Setting / Verification |
| :--- | :--- | :--- | :--- |
| 1 | **Topology** | Dedicated Cluster Manager Quorum | 3 dedicated `cluster_manager` nodes (no `data` or `ingest` role) across 3 AZs to prevent split-brain and GC starvation. |
| 2 | **JVM Memory** | Compressed OOPs & OS Page Cache | Set `-Xms31g -Xmx31g` (never exceed `31 GB`); leave $\ge 50\%$ host RAM for the Linux OS Page Cache. |
| 3 | **OS Kernel** | Disable Swapping & Set `vm.max_map_count` | `bootstrap.memory_lock: true` (`swapoff -a`) and `sysctl -w vm.max_map_count=262144` for Lucene `mmap`. |
| 4 | **Mappings** | Forbid Unbounded Dynamic Fields | Set `"dynamic": "strict"` on core schemas; use `flat_object` for dynamic user tags/labels. |
| 5 | **String Types** | Separate `keyword` vs `text` | Map IDs (`order_id`, `trace_id`, `status`) strictly as `keyword`; set `"norms": false` on log `text` fields. |
| 6 | **Aliases** | Zero Physical Index Names in Code | All microservices read/write via aliases (`orders_read`, `orders_write`) or Data Streams (`logs-prod-*`). |
| 7 | **Shards** | Right-Sized Primary Shards | Keep primary shards between `10 GB–30 GB` (search latency) or `30 GB–50 GB` (log analytics); $< 20$ shards per GB of JVM Heap. |
| 8 | **Replication** | Enable Segment Replication | Set `"index.replication.type": "SEGMENT"` to reduce cluster indexing CPU by 40–50%. |
| 9 | **Refresh** | Tune `refresh_interval` | Set `"index.refresh_interval": "30s"` for write-heavy logs/analytics (`"1s"`–`"5s"` only for interactive user search). |
| 10 | **Compression** | Enable `ZSTD` / `best_compression` | Set `"index.codec": "best_compression"` on log and archival indices to cut NVMe footprint by 35–45%. |
| 11 | **Queries** | Filter Context + Date Rounding | Put all exact/range filters in `bool.filter` and round relative dates (`now-1h/m`) for Roaring Bitmap caching. |
| 12 | **Pagination** | Enforce `PIT + search_after` | Keep `index.max_result_window: 10000`; use Point-in-Time + `search_after` for all deep pagination and exports. |
| 13 | **Bulk Writes** | Byte-Bounded Batches + Per-Item DLQ | Cap `_bulk` payloads at `5 MB–15 MB`; inspect `response.errors()` and route `4xx` mapping failures to an S3/Kafka DLQ. |
| 14 | **Guardrails** | Search Backpressure & Slow Logs | Enable `search_backpressure.mode: "enforced"` and configure `index.search.slowlog.threshold.query.warn: "2s"`. |
| 15 | **DR & Lifecycle** | Automated S3 Snapshots & ISM | Configure hourly Automated Snapshots to S3 (`Snapshot Management`) and ISM rollover/retention policies. |

---

## 🧠 Senior/Staff Interview Playbook: How to Ace OpenSearch Schema, Indexing & Operations Interviews

When an interviewer asks *"How do you design a multi-tenant OpenSearch cluster for 10,000 B2B customers where the top 1% of customers generate 50% of the data?"* or *"How do you change a field mapping on a 5 TB production index with zero downtime?"*, apply this Principal framework.

### 1. The Senior Framing Strategy (First 60 Seconds)

Anchor your design around **Four Operational Guarantees**:
1. **Tiered Multi-Tenancy with Bounded Routing (`_routing` + `routing_partition_size`)**: Never create 10,000 separate indices (1 index per tenant creates tens of thousands of tiny shards and overwhelms the `ClusterState`). Instead, use a **Shared Index with Custom `_routing: tenant_id`** for standard tenants (1-shard query locality), and either `index.routing_partition_size: 4` or dedicated isolated indices for the top 1% "Whale" tenants.
2. **Immutable Segment Economics**: Explain that because Lucene segments are write-once immutable files, every document update or custom `_id` write carries a hidden lookup + tombstone cost (`.del` bitmap + background `TieredMergePolicy` compaction I/O).
3. **Alias Indirection for Schema Evolution**: Decouple physical storage (`orders_v1`) from logical access (`orders_read` / `orders_write`) so schema changes and shard rescaling are executed via background sliced `_reindex` followed by an atomic metadata pointer swap.
4. **Proactive Backpressure & Blast-Radius Isolation**: Govern memory with the Parent Circuit Breaker (`95%` heap), Search Backpressure (auto-canceling runaway tasks), and Dedicated Cluster Manager nodes so a bad user query never triggers a cluster-wide split-brain outage.

---

### 2. Classic Interviewer Traps & Principal Rebuttals

#### Trap 1: "To make our `_bulk` ingestion idempotent when consuming from Kafka, we set the OpenSearch document `_id` to a random `UUIDv4` generated by the producer. Why did our indexing throughput drop by 45% as the index grew past 50 GB?"
* **Junior/Mid Answer:** "UUID strings are 36 characters long, so they take more disk space to store than integers."
* **Principal Rebuttal:** "String length is negligible—the 45% throughput collapse is caused by **Random FST Term Dictionary & Bloom Filter Lookups Across Immutable Segments**:
  - When you omit `_id`, OpenSearch generates a shard-local sequential ID and knows with **100% certainty** that the document is a brand-new insert—so it appends directly to the in-memory indexing buffer without touching disk segments!
  - When you supply a custom `_id`, Lucene must treat the operation as a potential **upsert**: before indexing, it must check whether that `_id` already exists in **any of the shard's existing segments** so it can mark the old document as deleted in the `.del` bitmap.
  - Because `UUIDv4` is completely random, consecutive IDs hit completely different byte prefixes in the `_id` FST Term Dictionary, causing constant **OS Page Cache thrashing and random disk I/O** as the index grows!
  - **The Principal Fix**: Use **time-ordered `UUIDv7` (RFC 9562)** (or prefix your deterministic key with an epoch timestamp/hour bucket like `2026101713-<hash>`). Because all incoming IDs in the current batch share the exact same lexicographical prefix, the active FST branch stays 100% hot in L1/L2 CPU cache and OS Page Cache, recovering almost all of the auto-ID speed while preserving Kafka idempotency!"

#### Trap 2: "We have an arrays-of-objects field `items: [{"sku": "A", "status": "SHIPPED"}, {"sku": "B", "status": "CANCELLED"}]`, so we mapped `items` as `type: "nested"`. Now our product catalog has 1,000 nested child items per parent document, and updates take 15 seconds. Why?"
* **Junior/Mid Answer:** "Nested queries require a join at query time, which makes updates slow."
* **Principal Rebuttal:** "Under the hood, Lucene implements `type: "nested"` using **Block Joins**: when you index 1 parent document with 1,000 nested items, Lucene physically writes **1,001 separate Lucene documents** contiguously into the same segment block!
  - Because Lucene segments are **immutable**, if you update even a single scalar field on the parent document (e.g., changing `updated_at`), OpenSearch must mark all **1,001 Lucene documents** as deleted in `.del` and **re-index all 1,001 documents** into a new segment!
  - Furthermore, it rapidly hits `index.mapping.nested_objects.limit` (`10,000`).
  - **The Principal Fix**:
    1. If you only need key-value equality lookup without cross-attribute joins, flatten the data into synthetic keys (`sku_status: ["A#SHIPPED", "B#CANCELLED"]`) as a simple `keyword` array! That allows exact correlated `term` matching (`sku_status: "B#SHIPPED"` $\to$ `false`) inside **1 single Lucene document** with zero `nested` overhead!
    2. If each child item has an independent update lifecycle and hundreds of items per parent, model them as **separate top-level documents** in a child index (`order_items`) with `order_id` as a `keyword` foreign key and `_routing: order_id`."

#### Trap 3: "In our multi-tenant SaaS index (30 primary shards), we used `_routing: tenant_id` so each tenant's queries only hit 1 shard. Suddenly, one node's CPU and disk hit 95% while the other 29 shards are idle! How do you fix this without losing routing locality?"
* **Junior/Mid Answer:** "Remove `_routing` so the documents are spread evenly across all 30 shards again."
* **Principal Rebuttal:** "Removing `_routing` forces every single tenant query to scatter-gather across all 30 shards, ruining your cluster's QPS capacity. This is the classic **Whale Tenant / Hot-Shard Skew** problem: `Murmur3Hash("whale_tenant") % 30` hashes all 200 million documents of your largest enterprise customer onto a single shard!
  - **The Principal Fix (2-Tier Tenant Architecture)**:
    1. **Index-Level Partitioned Routing (`index.routing_partition_size`)**: Configure `index.routing_partition_size: 4` on the index. Now `?routing=tenant_id` hashes each tenant across a deterministic contiguous subset of **4 shards** instead of 1 shard:
       $$\text{shard\_num} = \left(\text{Hash}(\text{\_routing}) + \text{Hash}(\text{\_id}) \bmod \text{partition\_size}\right) \bmod \text{num\_shards}$$
       Queries only hit 4 shards (instead of 30), while spreading the whale tenant's storage and write load across 4 nodes!
    2. **Tiered Index Isolation via Aliases**: Route Enterprise "Whale" tenants to their own dedicated physical index (`saas_tenant_whale_v1`) behind a per-tenant alias (`tenant_whale_read`), while keeping the remaining 9,950 small/medium tenants in the shared routed index."

#### Trap 4: "Our `_bulk` ingestion service checks `if (httpStatusCode == 200)` and marks the Kafka batch offset as committed. Yet during peak load, we discovered thousands of missing documents in OpenSearch with zero exceptions in our microservice logs! How is that possible?"
* **Junior/Mid Answer:** "Maybe `"refresh_interval"` was too long or `"acks"` wasn't set to all."
* **Principal Rebuttal:** "The OpenSearch `_bulk` REST endpoint is a **multi-status batch envelope**: the top-level HTTP status code is **`200 OK`** as long as the Coordinating Node parsed the HTTP request—**even if 100% of the individual operations inside the batch failed** with `429 Too Many Requests (es_rejected_execution_exception)` or `400 mapper_parsing_exception`!
  - Checking only the HTTP status code silently drops every rejected item and commits the Kafka offset!
  - **The Principal Fix**: Always inspect `bulkResponse.errors()` (`true`/`false`), iterate over `bulkResponse.items()`, retry `429` items with exponential backoff + jitter, and send `400` schema failures to a Dead-Letter Queue before committing the Kafka consumer offset."

---

### 3. Mid-Level vs. Principal Candidate Cheat Sheet

| Concept / Scenario | Mid-Level Candidate Says | Principal Candidate Demonstrates |
| :--- | :--- | :--- |
| **Numeric Identifiers (`order_id`)** | "Map `order_id` as `long` because it is a 64-bit number." | "Map `order_id` as **`keyword`**. `long` builds a BKD-Tree for range scans; `keyword` builds an FST Term Dictionary that executes exact `term` lookups **3x faster** with less disk." |
| **Arrays of Objects** | "Use `type: nested` whenever you have an array of JSON objects." | "Standard `object` flattens arrays (`A#B` cross-match bug); `nested` writes separate hidden Lucene docs (write amplification!). For simple pairs, use synthetic `keyword` tokens (`\"Alice#admin\"`) to avoid `nested` overhead." |
| **Changing a Field Type** | "Update the index mapping and restart the service." | "Lucene segments are immutable. Point apps to `read`/`write` **Aliases**, create `index_v2`, run **`POST _reindex?slices=auto`**, and execute an atomic `POST /_aliases` swap." |
| **Document `_id` Selection** | "Use a random `UUIDv4` for every document `_id`." | "Random `UUIDv4` forces per-segment FST/Bloom filter duplicate lookups across all segments (-45% throughput). Use **auto-generated IDs** or time-ordered **`UUIDv7`** so new IDs share hot FST prefixes." |
| **Multi-Tenant Routing** | "Create one index per customer." | "10,000 indices causes shard/ClusterState explosion. Use a shared index with **`_routing: tenant_id`** + `index.routing_partition_size` for skew mitigation, and isolate whale tenants behind aliases." |

---

## See Also

- **[OpenSearch Query, Search & Aggregation Guideline: How to Query Properly & Effectively](./opensearch-query-search-best-practices.md)** — Query vs Filter Context (`IndicesQueryCache` Roaring Bitmaps), `Point-in-Time + search_after` deep pagination, `composite` aggregations, and Hybrid BM25 + k-NN Vector Search.
- **[OpenSearch Architecture Deep Dive & Splunk-to-OpenSearch Migration Guide](./opensearch-splunk-migration-guide.md)** — Lucene segments, FSTs, DocValues, Segment Replication, SPL-to-PPL translation, and ISM Hot/UltraWarm/Cold S3 tiering.
- **[Time, Ordering & Unique Identifiers (UUIDv7 Deep Dive)](./time-and-ordering-and-unique-ids.md)** — Why time-ordered UUIDv7 eliminates B+Tree and Lucene FST page thrashing.
