---
id: opensearch-query-search-best-practices
title: "OpenSearch Query, Search & Aggregation Guideline: How to Query Properly & Effectively"
sidebar_label: "OpenSearch Query & Search Guide"
description: "Principal engineering guideline on writing fast, memory-safe OpenSearch queries: Query vs Filter Context (Roaring Bitmap caches), Point-in-Time (PIT) + search_after deep pagination, high-cardinality aggregations, and Hybrid BM25 + k-NN Vector Search."
tags:
  - system-design
  - opensearch
  - search
  - query-dsl
  - aggregations
  - vector-search
  - knn
  - lucene
  - performance
---

import OpenSearchBestPracticesDiagram from '@site/src/components/OpenSearchBestPracticesDiagram';

# OpenSearch Query, Search & Aggregation Guideline: How to Query Properly & Effectively

Most OpenSearch latency spikes, `429 Too Many Requests` rejections, and `circuit_breaking_exception` crashes are not caused by hardware bottlenecks—they are caused by **suboptimal query patterns** that defeat Apache Lucene's internal caches or force shards to materialize millions of objects in the JVM Heap.

This guide provides the definitive engineering rules for writing **fast, predictable, and memory-safe OpenSearch queries, pagination flows, aggregations, and hybrid vector searches** in production.

---

## 1. The #1 Rule of Querying: Query Context (`must`) vs. Filter Context (`filter`)

Every clause inside an OpenSearch `bool` query executes in one of two physical modes inside Apache Lucene: **Query Context** or **Filter Context**. Putting exact-match predicates in the wrong context is the single most common performance mistake in OpenSearch.

<OpenSearchBestPracticesDiagram initialMode="query-execution" />

### 1.1 How `bool.must` vs. `bool.filter` Executes Under the Hood

| Execution Dimension | Query Context (`bool.must`, `bool.should`) | Filter Context (`bool.filter`, `bool.must_not`) |
| :--- | :--- | :--- |
| **Core Question Answered** | *"How well does this document match the query?"* | *"Does this document match? (Yes / No — `1` or `0`)"* |
| **Relevance Score (`_score`)** | Computes floating-point **BM25 (`TF-IDF`)** score for every matched document. | **Skips all scoring math** (`_score` is `0.0`). |
| **Node Bitset Caching (`IndicesQueryCache`)** | **Never cached** in the node filter bitset cache. Re-evaluates posting lists on every request. | **Automatically cached** as a compressed **Roaring Bitmap** in RAM (`1 bit` per document). |
| **CPU & Latency Cost** | High CPU (floating-point division, term frequency & doc-length normalization lookup). | **Sub-millisecond (`~0.1 ms`)** via hardware-accelerated bitwise `AND` / `AND NOT` instructions. |
| **When to Use** | Full-text human search fields (`title`, `product_name`, `message` relevance). | Exact identifiers (`tenant_id`, `status`, `user_id`), numeric/date ranges (`@timestamp`, `price`), and security ACLs. |

### 1.2 How Lucene's `IndicesQueryCache` Decides What to Cache

OpenSearch does not blindly cache every filter on every segment. A `bool.filter` clause is promoted into the node-level **Roaring Bitmap Filter Cache** only when all three physical conditions are met:
1. **Segment Size Threshold**: The Lucene segment must contain **`> 10,000` documents** (or represent **`> 3%`** of the total documents in the shard). Tiny newly refreshed segments are skipped because scanning them directly is faster than building a cache entry, and they will soon be merged away.
2. **Usage History Ring Buffer**: OpenSearch maintains a 256-slot LRU usage tracker per shard. A filter clause must be seen **at least 2 times** (for costly queries like `range`) or **5 times** (for lightweight `term` queries) within the last 256 queries before its Roaring Bitmap is materialized in RAM.
3. **Cache Key Determinism (The `now` Timestamp Trap!)**:
   - If you write `"gte": "now-1h"`, `now` resolves to millisecond precision (`1760681856142`). Every single request 1 millisecond later has a **different cache key** and suffers a **100% Filter Cache Miss**!
   - **The Principal Fix**: Always **round relative date math** to the nearest minute or 5-minute boundary (`"gte": "now-1h/m"`) so thousands of concurrent user requests share the exact same cached Roaring Bitmap!

```json
// ❌ BAD: Everything in "must" + unrounded "now" (0% Filter Cache hit rate, wasted BM25 CPU)
{
  "query": {
    "bool": {
      "must": [
        { "match": { "title": "wireless keyboard" } },
        { "term": { "tenant_id": "acme_corp" } },
        { "term": { "status": "IN_STOCK" } },
        { "range": { "created_at": { "gte": "now-24h" } } }
      ]
    }
  }
}

// ✅ GOOD: Scored text in "must", exact/range predicates in "filter" with rounded "/m" date math
{
  " _source": ["product_id", "title", "price", "rating"],
  "query": {
    "bool": {
      "must": [
        { "match": { "title": { "query": "wireless keyboard", "operator": "and" } } }
      ],
      "filter": [
        { "term": { "tenant_id": "acme_corp" } },
        { "term": { "status": "IN_STOCK" } },
        { "range": { "created_at": { "gte": "now-24h/m" } } }
      ]
    }
  }
}
```

---

## 2. Choosing the Right Query Clause: The Do's & Don'ts Matrix

Using the wrong query type can turn an $O(1)$ Finite State Transducer (FST) lookup into a cluster-halting $O(|V|)$ full dictionary scan.

| Use Case | ❌ Anti-Pattern to Avoid | ✅ Proper OpenSearch Query | Under-the-Hood Engine Mechanics |
| :--- | :--- | :--- | :--- |
| **Exact ID / Enum Filter** | `match` on a `text` field for `user_id` or `status` | `term` (single) or `terms` (array) inside `bool.filter` on a **`keyword`** field | Jumps directly to the exact byte sequence in the FST Term Dictionary in $O(\text{length of key})$ without analyzer tokenization. |
| **Multi-Value Set (`IN (...)`)** | 500 `bool.should` clauses | `terms` query (or `terms_set` / `terms` lookup from an index) | Sorts the lookup terms lexicographically and performs a single forward pass over the segment's FST. |
| **Full-Text Search (Single Field)** | `query_string` with raw user input (`"user: (foo OR *bar"` throws syntax error!) | `match` (with `"operator": "and"` or `"minimum_should_match": "75%"`) or **`simple_query_string`** | `simple_query_string` never throws syntax exceptions on unbalanced parentheses or stray characters typed by end users. |
| **Exact Phrase / Proximity** | `wildcard: "*connection reset*"` | `match_phrase` (with optional `"slop": 2`) | Intersects token posting lists (`"connection"` $\cap$ `"reset"`) first, then verifies adjacency using `.pos` positional offsets. |
| **Multi-Field Search** | 10 separate `match` queries in `should` | `multi_match` (`best_fields` for distinct concepts, `cross_fields` for `first_name` + `last_name`) | `cross_fields` blends term frequencies across fields so searching `"John Smith"` matches across `first_name` and `last_name` seamlessly. |
| **Autocomplete / Typeahead** | `wildcard: "iph*"` or `regexp` on every keystroke | **`search_as_you_type`** field or `match_bool_prefix` | Pre-builds `2-gram` and `3-gram` shingle & edge-ngram subfields at index time so keystroke queries are $O(1)$ term lookups! |
| **Substring / Infix Search (`*foo*`)** | `wildcard: "*NullPointer*"` on standard `keyword` | Map the field as **`type: "wildcard"`** (OpenSearch 2.x+) | Standard `keyword` leading wildcards scan the entire FST. The `wildcard` field type indexes **3-character trigram N-grams** (`"Nul"`, `"ull"`, `"llP"...`) to intersect candidates before verifying! |

> [!WARNING]
> **Protect Your Cluster Against Unbounded Wildcards & Regexes**:
> Always ensure `search.allow_expensive_queries` is consciously governed in production. If a business requirement mandates searching arbitrary substrings inside log lines or file paths, map that specific field as `type: "wildcard"` rather than running `*substring*` against a high-cardinality `keyword` field.

---

## 3. Pagination Done Right: Why `from + size` Fails & How to Use `PIT + search_after`

### 3.1 The Scatter-Gather Trap of `from + size`

Suppose an index has **20 primary shards** and a client requests page 2,500 (`from: 50000, size: 20`):
1. Because the Coordinating Node does not know which shard holds the globally ranked 50,001st to 50,020th documents, **every single shard (`20 shards`) must allocate a priority queue of `50,000 + 20 = 50,020` entries** in JVM Heap.
2. All 20 shards return `50,020` sort tuples to the Coordinating Node.
3. The Coordinating Node merges and sorts **$20 \times 50,020 = 1,000,400$ entries** in memory, returns the final `20` documents, and throws away `1,000,380` results!
4. This is why OpenSearch enforces a hard guardrail of `index.max_result_window: 10000`. Raising `index.max_result_window` to `500000` is a classic production anti-pattern that causes **Coordinating Node JVM Old-Gen OOMs**.

### 3.2 Choosing the Right Pagination Strategy

| Pagination Method | Best Use Case | Max Depth | Consistency Under Live Writes | Resource Cost |
| :--- | :--- | :--- | :--- | :--- |
| **`from` + `size`** | Shallow UI pagination (Pages 1 to 100, e.g., e-commerce search results where users jump to Page 1, 2, 3). | $\le 10,000$ docs | Eventual (concurrent inserts can shift rows between pages). | $O(S \times (\text{from} + \text{size}))$ |
| **`Point-in-Time (PIT)` + `search_after`** | **Infinite scroll ("Load More"), cursor APIs, deep pagination, and parallel data exports.** | **Unlimited** (Millions/Billions of docs) | **Snapshot Consistent** (PIT freezes the live segment view across refreshes!). | **$O(S \times \text{size})$ — Constant cost!** |
| **`Scroll API` (`_search?scroll=5m`)** | Legacy bulk tools (Deprecated in OpenSearch 2.x+ in favor of PIT + `search_after`). | Unlimited | Snapshot Consistent (ties up heavy server context). | High stateful heap retention if not cleared. |

### 3.3 Step-by-Step `Point-in-Time (PIT)` + `search_after` Protocol

1. **Create a Point-in-Time (PIT) ID**:
   ```http
   POST /orders-prod/_search/point_in_time?keep_alive=5m
   ```
   Returns a lightweight `pit_id` that pins the current set of Lucene segments so background refreshes or new writes never cause duplicate or skipped rows while paginating.
2. **Fetch Page 1 (Deterministic Sort with a Unique Tiebreaker)**:
   Always include a **100% unique tiebreaker field** (such as `order_id` or `_shard_doc`) as the last element of your `sort` array; otherwise documents sharing the exact same `@timestamp` can be skipped across pages!
   ```json
   POST /_search
   {
     "size": 100,
     "pit": { "id": "46ToAwMDaWR4B...", "keep_alive": "5m" },
     "query": {
       "bool": { "filter": [{ "term": { "status": "COMPLETED" } }] }
     },
     "sort": [
       { "@timestamp": { "order": "desc" } },
       { "order_id": { "order": "asc" } }
     ]
   }
   ```
3. **Fetch Page $N$ Using `search_after`**:
   Take the `sort` array from the **last hit** of the previous response (`[1760681000123, "ord_991827"]`) and pass it into `search_after`:
   ```json
   POST /_search
   {
     "size": 100,
     "pit": { "id": "46ToAwMDaWR4B...", "keep_alive": "5m" },
     "query": {
       "bool": { "filter": [{ "term": { "status": "COMPLETED" } }] }
     },
     "sort": [
       { "@timestamp": { "order": "desc" } },
       { "order_id": { "order": "asc" } }
     ],
     "search_after": [1760681000123, "ord_991827"]
   }
   ```
4. **Close the PIT Context When Finished**:
   ```http
   DELETE /_search/point_in_time
   { "pit_id": ["46ToAwMDaWR4B..."] }
   ```

---

## 4. High-Performance Aggregations Without Tripping Circuit Breakers

Aggregations operate over columnar **`DocValues` (`.dvd`)** in the Linux OS Page Cache. However, poorly structured aggregations can still exhaust JVM Heap on data nodes and coordinating nodes.

### 4.1 The 5 Rules of Production Aggregations

1. **Always Set `"size": 0` When You Only Need Aggregations**:
   - By default, OpenSearch fetches and decompresses `_source` for the top `10` hits even if your application only reads `response.aggregations()`. Setting `"size": 0` eliminates `_source` disk decompression and enables **Instant Aggregation Caching** in the Shard Request Cache!
2. **Understand `shard_size` and `doc_count_error_upper_bound` in `terms` Aggregations**:
   - When you ask for the top `"size": 10` categories across 20 shards, a category that ranks `#11` on every shard might actually be `#3` globally!
   - To prevent this skew, each shard returns `shard_size = (size * 1.5 + 10)` buckets by default (`25` buckets for `size: 10`). If `doc_count_error_upper_bound > 0` in your response, increase `shard_size` (e.g., `"shard_size": 100`) for exact top-K accuracy.
3. **Never Run `terms` with `"size": 100000` on High-Cardinality Fields—Use `composite` Instead**:
   - A `terms` aggregation with `size: 100000` forces every shard to materialize 100,000 bucket objects in JVM Heap simultaneously, tripping `[parent] Data too large`.
   - Instead, use a **`composite` aggregation** with `"size": 1000` and paginate through all unique buckets sequentially using the returned `after_key` cursor!
4. **Tune `execution_hint`: `global_ordinals` vs. `map`**:
   - By default, `terms` aggregations use **Global Ordinals** (integer dictionary IDs mapped to string values across all segments in a shard).
   - For **low-to-medium cardinality** fields (`status`, `country`, `service`), `global_ordinals` is blazingly fast.
   - However, if your `bool.filter` narrows a 100M-document shard down to just **50 documents**, building Global Ordinals for a high-cardinality field (`user_id`) is slower than aggregating the raw values directly! In narrow filtered queries on high-cardinality fields, set `"execution_hint": "map"` to hash the 50 matched values directly without building global ordinals.
5. **Use `cardinality` (HyperLogLog++) for Distinct Counts**:
   - `cardinality` uses the probabilistic **HyperLogLog++** sketch algorithm. Tune `"precision_threshold": 10000` (default `3000`, max `40000`), which uses only `~80 KB` of RAM per shard while delivering `> 99%` accuracy over hundreds of millions of unique IDs.

---

## 5. Hybrid Search: Combining Lexical BM25 + Vector k-NN Search

Modern AI and e-commerce search engines require **Hybrid Search**:
- **Lexical Search (BM25)** excels at exact part numbers (`"RTX-4090-OC"`), error codes (`"ERR_SSL_PROTOCOL_ERROR"`), and rare proper nouns.
- **Dense Vector Search (`knn_vector`)** excels at semantic intent, synonyms, and natural language queries (`"quiet mechanical keyboard for office"`).

<OpenSearchBestPracticesDiagram initialMode="hybrid-knn" />

### 5.1 Efficient k-NN Pre-Filtering (Never Post-Filter in Application Code!)

A notorious failure mode in vector databases is **Post-Filtering**: fetching the top `k = 50` nearest vectors globally and then filtering by `tenant_id = "acme"` in application code—which often leaves **0 results** if `"acme"` owns only 1% of the index!

In OpenSearch 2.9+ / 3.x (`lucene` and `faiss` engines), always place metadata predicates inside the **`knn.<field>.filter`** clause (Efficient Pre-Filtering):
- OpenSearch builds a **Roaring Bitmap** of the filter first.
- If the filter matches a sufficient ratio of documents, the **HNSW (Hierarchical Navigable Small World)** graph traversal evaluates only graph nodes whose Document ID bit is `1` in the bitmap.
- If the filter is ultra-selective (e.g., `< 500` documents match the filter), OpenSearch automatically switches from approximate HNSW graph traversal to **exact SIMD brute-force distance calculation** over those 500 documents, guaranteeing 100% recall with `< 5 ms` latency!

### 5.2 Score Normalization & RRF (Reciprocal Rank Fusion) Search Pipelines

You cannot simply add a BM25 score (`0.0` to `45.0+`) to a Cosine Similarity score (`0.0` to `1.0`)—BM25 would completely dominate the ranking. OpenSearch solves this inside the cluster via **Search Pipelines**:

```json
// 1. Register a Hybrid Search Normalization Pipeline once:
// PUT /_search/pipeline/hybrid-norm-pipeline
{
  "description": "Min-Max normalization with 30% BM25 lexical and 70% semantic vector weight",
  "phase_results_processors": [
    {
      "normalization-processor": {
        "normalization": { "technique": "min_max" },
        "combination": {
          "technique": "arithmetic_mean",
          "parameters": { "weights": [0.3, 0.7] }
        }
      }
    }
  ]
}

// 2. Execute the Hybrid Query using the pipeline:
// POST /products-catalog/_search?search_pipeline=hybrid-norm-pipeline
{
  "size": 20,
  "_source": ["sku", "title", "category", "price"],
  "query": {
    "hybrid": {
      "queries": [
        {
          "bool": {
            "must": [{ "match": { "title": "ergonomic split keyboard" } }],
            "filter": [
              { "term": { "in_stock": true } },
              { "range": { "price": { "lte": 250.0 } } }
            ]
          }
        },
        {
          "knn": {
            "title_embedding": {
              "vector": [0.021, -0.044, 0.118, "... 768 dimensions ..."],
              "k": 50,
              "filter": {
                "bool": {
                  "filter": [
                    { "term": { "in_stock": true } },
                    { "range": { "price": { "lte": 250.0 } } }
                  ]
                }
              }
            }
          }
        }
      ]
    }
  }
}
```

---

## 6. Production Java 21 Implementation (`opensearch-java`)

Below is a production-grade Java 21 service demonstrating **Filter Context optimization**, **source field projection**, and **Point-in-Time (PIT) + `search_after` cursor pagination** with automatic resource cleanup:

```java
package com.example.search.opensearch;

import org.opensearch.client.json.JsonData;
import org.opensearch.client.opensearch.OpenSearchClient;
import org.opensearch.client.opensearch._types.FieldSort;
import org.opensearch.client.opensearch._types.FieldValue;
import org.opensearch.client.opensearch._types.SortOptions;
import org.opensearch.client.opensearch._types.SortOrder;
import org.opensearch.client.opensearch._types.Time;
import org.opensearch.client.opensearch.core.CreatePitRequest;
import org.opensearch.client.opensearch.core.CreatePitResponse;
import org.opensearch.client.opensearch.core.DeletePitRequest;
import org.opensearch.client.opensearch.core.SearchRequest;
import org.opensearch.client.opensearch.core.SearchResponse;
import org.opensearch.client.opensearch.core.search.Hit;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

@Service
public class EffectiveOpenSearchQueryService {

    private final OpenSearchClient client;

    public EffectiveOpenSearchQueryService(OpenSearchClient client) {
        this.client = client;
    }

    public record OrderDocument(String orderId, String tenantId, String status, long createdAtEpochMs, double totalAmount) {}

    /**
     * Streams millions of matching documents in constant O(size) heap memory
     * using Point-in-Time (PIT) + search_after cursor pagination.
     */
    public void streamTenantOrdersWithPit(
            String indexName,
            String tenantId,
            int pageSize,
            Consumer<List<OrderDocument>> batchConsumer) throws IOException {

        // 1. Open Point-in-Time (PIT) snapshot for 2 minutes
        CreatePitResponse pitResponse = client.createPit(CreatePitRequest.of(p -> p
            .targetIndexes(indexName)
            .keepAlive(Time.of(t -> t.time("2m")))
        ));
        String pitId = pitResponse.pitId();

        try {
            List<FieldValue> searchAfterCursor = null;

            while (true) {
                final List<FieldValue> currentCursor = searchAfterCursor;

                SearchRequest.Builder reqBuilder = new SearchRequest.Builder()
                    .size(pageSize)
                    .pit(p -> p.id(pitId).keepAlive("2m"))
                    // Project only required fields to minimize network & JSON deserialization cost
                    .source(src -> src.filter(f -> f
                        .includes("orderId", "tenantId", "status", "createdAtEpochMs", "totalAmount")
                    ))
                    // Use Filter Context so Lucene caches the Roaring Bitmap and skips BM25 math
                    .query(q -> q.bool(b -> b
                        .filter(f -> f.term(t -> t.field("tenantId").value(FieldValue.of(tenantId))))
                        .filter(f -> f.term(t -> t.field("status").value(FieldValue.of("PAID"))))
                    ))
                    // Deterministic sort with unique tiebreaker (orderId)
                    .sort(
                        SortOptions.of(so -> so.field(FieldSort.of(fs -> fs
                            .field("createdAtEpochMs")
                            .order(SortOrder.Desc)
                        ))),
                        SortOptions.of(so -> so.field(FieldSort.of(fs -> fs
                            .field("orderId")
                            .order(SortOrder.Asc)
                        )))
                    );

                if (currentCursor != null) {
                    reqBuilder.searchAfter(currentCursor);
                }

                SearchResponse<OrderDocument> response = client.search(reqBuilder.build(), OrderDocument.class);
                List<Hit<OrderDocument>> hits = response.hits().hits();

                if (hits.isEmpty()) {
                    break;
                }

                List<OrderDocument> batch = new ArrayList<>(hits.size());
                for (Hit<OrderDocument> hit : hits) {
                    if (hit.source() != null) {
                        batch.add(hit.source());
                    }
                }
                batchConsumer.accept(batch);

                // Advance cursor using the sort values of the final document in this batch
                Hit<OrderDocument> lastHit = hits.get(hits.size() - 1);
                searchAfterCursor = lastHit.sort();

                if (hits.size() < pageSize) {
                    break;
                }
            }
        } finally {
            // Always release the PIT reader context to allow merged Lucene segments to be freed on disk
            client.deletePit(DeletePitRequest.of(d -> d.pitId(pitId)));
        }
    }
}
```

---

## 🧠 Senior/Staff Interview Playbook: How to Ace OpenSearch Query & Search Optimization Interviews

When an interviewer asks *"Our OpenSearch p99 search latency jumped from 15 ms to 2.5 seconds at peak traffic—how do you diagnose and optimize the queries?"*, structure your answer using this Principal framework.

### 1. The Senior Framing Strategy (First 60 Seconds)

Open by categorizing search bottlenecks into **Four Physical Engine Layers**:
1. **Bitset Cache Efficiency (`bool.filter` + Date Rounding)**: Verify that all non-scored predicates (`tenant_id`, `status`, `@timestamp`) live inside `bool.filter` rather than `bool.must`, and that relative timestamps are rounded (`now-1h/m`) so Lucene's **`IndicesQueryCache`** serves compressed **Roaring Bitmaps** in `< 0.2 ms` instead of recomputing BKD-tree scans on every query.
2. **Scatter-Gather Amplification Control**: In a 30-shard index, every unrouted query fans out to 30 shards. Use custom `_routing` (`?routing=tenant_id`) to turn a 30-shard scatter-gather into a 1-shard targeted read, and enforce **`Point-in-Time (PIT)` + `search_after`** instead of deep `from + size` pagination.
3. **Payload & Decompression Minimization (`size: 0` & `_source` Projection)**: Fetching stored `_source` requires decompressing `LZ4`/`ZSTD` blocks from disk. Set `size: 0` on analytics queries so aggregations run purely in the OS Page Cache over columnar `DocValues`, and use `_source.includes` on search queries.
4. **High-Cardinality Aggregation Bounds**: Replace unbounded `terms` aggregations with `composite` cursor pagination, `cardinality` (HyperLogLog++), or `sampler` wrappers to keep per-request memory well below the JVM Heap Circuit Breaker.

---

### 2. Classic Interviewer Traps & Principal Rebuttals

#### Trap 1: "We put our timestamp range filter `created_at >= now-15m` inside `bool.filter` just like the documentation recommends, yet our Node Filter Cache hit rate is still 0%. Why?"
* **Junior/Mid Answer:** "Maybe range queries cannot be cached in OpenSearch, or the filter cache size is too small."
* **Principal Rebuttal:** "Range queries inside `bool.filter` **are** eligible for `IndicesQueryCache`, provided the segment has `> 10,000` documents. The reason your cache hit rate is 0% is **Millisecond Cache Key Busting**: `now` evaluates to the current epoch millisecond (`1760682000123`). Two requests arriving 5 milliseconds apart generate two completely distinct range queries, so neither ever reaches the 2-to-5 repeat execution threshold in the 256-slot history ring buffer!
  - **The Principal Fix**: Round the relative date expression to the nearest minute or 5-minute interval (`"gte": "now-15m/m"`). Now every request within that 60-second window hashes to the **exact same filter cache key**, boosting `IndicesQueryCache` hit rate to `> 98%`!"

#### Trap 2: "A product manager wants users to be able to jump directly to Page 5,000 (`from: 100000, size: 20`) in our search UI, so a developer increased `index.max_result_window` from `10,000` to `500,000`. Why did the cluster crash two days later?"
* **Junior/Mid Answer:** "Fetching 100,000 rows from disk is slow and uses too much network bandwidth."
* **Principal Rebuttal:** "OpenSearch doesn't even fetch `_source` from disk during the initial `query` phase—the crash happens in the **Coordinating Node Priority Queue during Scatter-Gather**:
  - With `from: 100000, size: 20` across `30 shards`, each shard must maintain a min-heap priority queue of `100,020` score/sort tuples.
  - The Coordinating Node receives $30 \times 100,020 = 3,000,600$ tuples per request. If just 20 concurrent requests (or a web scraper bot!) hit Page 5,000 simultaneously, the Coordinating Node allocates **60 million sort objects in JVM Heap**, triggering an immediate `OutOfMemoryError` or tripping the `parent` circuit breaker!
  - **The Principal Fix**: Keep `index.max_result_window` strictly at `10,000` for numbered page jumps (99.9% of human users never click past page 20), and implement **Keyset / Cursor Pagination (`Point-in-Time` + `search_after`)** for infinite scrolling and deep API exports."

#### Trap 3: "When we run a `terms` aggregation (`size: 10`) to find the top 10 highest-volume customers across our 20-shard orders index, the counts returned by OpenSearch are slightly off by a few percent compared to SQL. Why, and how do you make it exact?"
* **Junior/Mid Answer:** "OpenSearch is eventually consistent, so some recent documents haven't refreshed yet."
* **Principal Rebuttal:** "Even on a completely static index with zero writes, a distributed `terms` aggregation is **approximate by design** due to the **Top-K Shard Cut-Off Phenomenon**:
  - Each shard independently computes its local top `shard_size` buckets (default `shard_size = size * 1.5 + 10 = 25`) and sends only those 25 buckets to the Coordinating Node.
  - If Customer X has moderate volume evenly spread across all 20 shards (ranking `#26` on each shard), no single shard includes Customer X in its top 25—even though Customer X's global sum across all 20 shards would rank `#4` overall!
  - **The Principal Fix**: Inspect `doc_count_error_upper_bound` in the aggregation response (which reports the maximum possible missed count). To eliminate the error bound, increase **`shard_size`** (e.g., `"shard_size": 500`) in the `terms` aggregation so each shard sends a deeper local candidate list to the Coordinating Node."

#### Trap 4: "We added `knn_vector` embeddings for semantic search, and now we need to filter results by `tenant_id` and `department`. Should we filter inside the `knn` query or wrap `knn` inside a parent `bool.filter`?"
* **Junior/Mid Answer:** "Put the `knn` query inside a `bool.must` and put `tenant_id` in `bool.filter`—they work the same way."
* **Principal Rebuttal:** "Wrapping a `knn` query inside an outer `bool.filter` executes **Post-Filtering**: the shard first finds the top `k = 50` nearest vectors across the **entire shard** (ignoring `tenant_id`), and then the outer `bool.filter` intersects those 50 hits with `tenant_id`. If that tenant only owns 2% of the documents in the shard, 49 or all 50 hits get filtered out, returning an empty page!
  - **The Principal Fix**: Always place the filter **inside the `knn.<field>.filter` clause** (Efficient Pre-Filtering). OpenSearch evaluates the filter bitmap **during** the HNSW graph walk (and automatically switches to exact brute-force search when the filtered document count is small), guaranteeing you always receive `k` valid results belonging to that tenant!"

---

### 3. Mid-Level vs. Principal Candidate Cheat Sheet

| Concept / Scenario | Mid-Level Candidate Says | Principal Candidate Demonstrates |
| :--- | :--- | :--- |
| **Filter vs. Must** | "Use `filter` when you don't need relevance scores." | "Use `bool.filter` with rounded timestamps (`now-1h/m`) so segments `> 10,000` docs cache **Roaring Bitmaps** in `IndicesQueryCache` and execute via bitwise `AND` in `< 0.2 ms`." |
| **Deep Pagination** | "Use the Scroll API when `from + size` exceeds 10,000." | "Scroll API is deprecated for user queries. Open a **Point-in-Time (PIT)** context and paginate via **`search_after`** with a unique tiebreaker sort field (`[@timestamp, _id]`) in $O(S \times \text{size})$ memory." |
| **Substring Search (`*foo*`)** | "Avoid leading wildcards because they are slow." | "Leading wildcards on `keyword` force an $O(\|V\|)$ FST scan. Map fields requiring infix search as **`type: wildcard`**, which indexes **3-gram trigrams** into the inverted index." |
| **High-Cardinality Group-By** | "Increase `size` on the `terms` aggregation." | "Large `terms` sizes trip the `parent` circuit breaker. Use **`composite` aggregations** with `after_key` cursor pagination to stream millions of buckets in bounded chunks, or `cardinality` (HyperLogLog++) for unique counts." |
| **Hybrid Vector Search** | "Run a BM25 query and a k-NN query in the backend and merge the results." | "Use OpenSearch's native **`hybrid` query** with **Efficient Pre-Filtering (`knn.field.filter`)** and an in-cluster **Search Pipeline (`normalization-processor` or RRF)** to normalize and fuse scores in a single round-trip." |

---

## See Also

- **[OpenSearch Indexing, Schema Design & Day-2 Operations Guideline](./opensearch-indexing-schema-operations-guide.md)** — Mapping governance (`nested` vs `flat_object`), zero-downtime Alias + `_reindex` migrations, `_bulk` optimization, custom `_routing`, and troubleshooting `Red`/`Yellow` clusters.
- **[OpenSearch Architecture Deep Dive & Splunk-to-OpenSearch Migration Guide](./opensearch-splunk-migration-guide.md)** — Lucene segments, FSTs, DocValues, Segment Replication, SPL-to-PPL translation, and ISM Hot/UltraWarm/Cold S3 tiering.
- **[Search Systems & Inverted Indexes](./search-systems.md)** — Foundational full-text search patterns and CDC synchronization.
