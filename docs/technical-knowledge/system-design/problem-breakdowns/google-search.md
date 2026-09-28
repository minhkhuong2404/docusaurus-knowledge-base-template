---
id: google-search
title: "Design a Web Search Engine Like Google"
sidebar_label: "40. Google Search Engine"
description: "Staff-level architecture for distributed web crawling, inverted index sharding, document scoring (PageRank + BM25), and sub-50ms query serving over 50+ billion web pages."
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design a Web Search Engine Like Google

A global web search engine crawls the public Internet, indexes tens of billions of web pages, and resolves complex multi-keyword search queries in **under 50 milliseconds**. The system must balance the immense scale of batch distributed document indexing (petabytes of text and hyperlinks) with low-latency, high-concurrency real-time query evaluation, document ranking, and dynamic snippet generation.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Web Crawling & Parsing**: Continuously crawl billions of web pages, extract text, and extract outgoing hyperlinks.
2. **Inverted Indexing**: Build and maintain a distributed inverted index mapping searchable words to document occurrences.
3. **Query Serving**: Given a search query (e.g. `"distributed systems design"`), return the top 10 most relevant web pages with title, URL, and highlighted text snippet.
4. **Ranking Algorithm**: Rank search results by combining text relevance (BM25 / TF-IDF), link authority (PageRank), and user signals.
5. **Deduplication**: Detect and discard duplicate or near-duplicate web pages.

### Non-Functional Requirements
- **Sub-50ms Search Latency**: P99 search query response time must be $< 50\text{ms}$.
- **Massive Scalability**: Index **50+ Billion web pages** across petabytes of text.
- **High Concurrency**: Sustain **100,000+ Queries per Second (QPS)** globally.
- **Freshness**: Breaking news and high-priority web pages should be crawled, indexed, and searchable within minutes.

### Capacity Estimations & Sizing (5 Years)
- **Document Corpus**: 50 Billion indexed web pages.
- **Average Page Text Size**: 10 KB (after HTML stripping and boiler-plate removal).
- **Raw Text Storage**: $50\text{B pages} \times 10\text{ KB} = \mathbf{500\text{ Terabytes}}$.
- **Inverted Index Size**:
  - Assume 10 Million unique words (vocabulary).
  - An inverted index posting list stores `(doc_id, term_frequency, positions_array)`.
  - With delta encoding and variable-byte integer compression, inverted index size is roughly 30% of raw text $\implies \mathbf{150\text{ Terabytes}}$.
- **Search Query QPS**:
  - 5 Billion searches/day $\approx \mathbf{60,000\text{ QPS average}}$ (peaking at **120,000 QPS**).

---

## 2. The Set Up

### Defining Core Entities

```
┌────────────────────────────────────────────────────────┐
│                        DOCUMENT                        │
├──────────────────┬──────────────┬──────────────────────┤
│ doc_id           │ INT64        │ Unique Document ID   │
│ url              │ VARCHAR(2048)│ Canonical Page URL   │
│ simhash          │ INT64        │ 64-bit Fingerprint   │
│ pagerank_score   │ FLOAT        │ Precomputed Authority│
│ crawled_at       │ TIMESTAMP    │ Last Ingestion Time  │
│ s3_content_uri   │ VARCHAR(512) │ Raw Cleaned HTML     │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│               INVERTED_INDEX_POSTING_LIST              │
├──────────────────┬──────────────┬──────────────────────┤
│ term             │ VARCHAR(64)  │ Normalized Token     │
│ document_count   │ INT          │ Total Docs with Term │
│ postings_bytes   │ BLOB         │ Compressed Postings  │
│                  │              │ [(doc_id_delta, tf,  │
│                  │              │  positions...), ...] │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API Design

#### 1. Search Query API
```http
GET /api/v1/search?q=distributed+consensus+raft&page=1&limit=10
Accept: application/json
```
**Response (`200 OK`)**:
```json
{
  "total_hits": 4810000,
  "execution_time_ms": 18.4,
  "results": [
    {
      "doc_id": 9481023,
      "title": "In Search of an Understandable Consensus Algorithm (Raft)",
      "url": "https://raft.github.io/raft.pdf",
      "snippet": "Raft is a <b>consensus</b> algorithm designed as an alternative to Paxos for managing replicated logs in <b>distributed</b> systems...",
      "pagerank": 0.94
    }
  ]
}
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="post-search" title="Google Web Search Engine & Distributed Inverted Index Topology" />

### Walkthrough of Core Flows

#### 1. The Crawling & Indexing Pipeline (Offline/Nearline)
1. The **URL Frontier** schedules prioritized web pages to crawl based on PageRank and update frequency.
2. The **Distributed Crawler** downloads HTML, verifies `robots.txt`, and calculates a 64-bit **SimHash** to discard duplicate content.
3. The **Document Parser** tokenizes words, stems terms (e.g. `"running"` $\to$ `"run"`), and strips stop words.
4. The **Hyperlink Extractor** feeds new URLs back to the Frontier and outputs the web link graph to the **PageRank Computation Engine**.
5. **Indexer Workers** build sorted posting lists using MapReduce/Spark and write compressed index shards to distributed storage (Colossus/S3).

#### 2. The Real-Time Query Serving Pipeline (Sub-50ms)
1. The user enters `"distributed consensus raft"`.
2. The **Query Parser** normalizes the string, extracts keywords, handles synonyms, and identifies user geographic intent.
3. **Scatter-Gather Search**:
   - The query router broadcasts the keywords to **Index Serving Nodes (Leaf Shards)**.
   - Each leaf node searches its local inverted index, retrieves the posting lists for each word, intersects the lists (Boolean AND / OR), and computes local BM25 scores.
   - Each leaf returns its top 100 candidate document IDs to the Aggregator.
4. **Ranking & Scoring Engine**:
   - Aggregates candidates from all shards.
   - Computes final ranking: $\text{Final Score} = w_1 \cdot \text{BM25} + w_2 \cdot \text{PageRank} + w_3 \cdot \text{Freshness} + w_4 \cdot \text{Neural Semantic Similarity}$.
5. **Snippet Generator**: Fetches the top 10 document text snippets from the forward document cache, highlights keywords with `<b>` tags, and returns the response.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Inverted Index Sharding: Partition by Term vs Partition by Document
How do we shard an inverted index containing 50 billion web pages?

```
┌────────────────────────────────────────────────────────┐
│              INVERTED INDEX SHARDING STRATEGIES        │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Option A: Partition by Term (Term-Centric)            │
│  • Shard 1 holds words [a - c]; Shard 2 [d - f]...     │
│  • Multi-word query ("system design"):                  │
│    Must contact Shard 2 ("system") and Shard 1 ("design│
│  • Massive Network Bottleneck: Transferring huge       │
│    posting lists across nodes to compute intersection. │
│                                                        │
│  Option B: Partition by Document (Document-Centric -   │
│            Google Standard)                            │
│  • Each shard holds the COMPLETE vocabulary, but for a │
│    random subset of documents (e.g. 50M docs per shard)│
│  • Scatter-Gather: Broadcast query to all shards; each │
│    shard computes full intersection locally in memory! │
│  • Network transfer is tiny: each shard returns only   │
│    its local top 100 candidate IDs.                    │
│                                                        │
└────────────────────────────────────────────────────────┘
```
**Conclusion**: Modern search engines strictly use **Partition by Document**. It guarantees that posting list intersections happen entirely within local server RAM without cross-network posting list transfers.

### Deep Dive 2: Posting List Compression & Skip Lists
A posting list for the word `"the"` contains billions of document IDs. How do we store and intersect these lists in milliseconds?

1. **Delta (d-gap) Encoding**:
   - Instead of storing absolute IDs: `[1000004, 1000010, 1000015, 1000030]`
   - Store deltas between consecutive IDs: `[1000004, 6, 5, 15]`
   - Small delta integers can be packed into 1 or 2 bytes using **Variable Byte (VByte)** or **Elias-Fano** bit-packing, reducing index size by **80%**.
2. **Skip Lists for Fast Intersection**:
   - To compute the intersection of List A and List B, naive traversal checks every integer: $O(|A| + |B|)$.
   - By adding **Skip Pointers** every $\sqrt{N}$ entries (e.g., skip 128 elements), the pointer can skip ahead when comparing against a large document ID, accelerating list intersections by **10x to 50x**.

### Deep Dive 3: The Ranking Equation (BM25 + PageRank + Embeddings)
How does Google decide which document is #1?

$$\text{Score}(D, Q) = \sum_{t \in Q} \text{BM25}(t, D) + \alpha \cdot \log(\text{PageRank}(D)) + \beta \cdot \text{VectorCosine}(\vec{Q}, \vec{D})$$

1. **BM25 (Best Matching 25)**:
   - Measures term frequency within the document penalized by document length (to prevent keyword stuffing).
   - Weighted by Inverse Document Frequency ($\text{IDF} = \log(N / df)$) so rare words like `"Raft"` carry more weight than common words like `"systems"`.
2. **PageRank (Link Graph Eigenvector)**:
   - Evaluates authority based on the quantity and quality of incoming links:
     $$PR(u) = \frac{1 - d}{N} + d \sum_{v \in B_u} \frac{PR(v)}{L(v)}$$
   - Computed offline via iterative power iteration over billions of web graph nodes.

### Deep Dive 4: Near-Duplicate Detection via SimHash
Web crawlers encounter millions of mirror sites, scrape sites, and near-identical pages. How do we identify duplicate pages in $O(1)$ time?
- Traditional MD5/SHA-256 hashes are useless: changing 1 word changes the entire hash!
- **SimHash (Locality-Sensitive Hashing)**:
  1. Extract 64-bit feature hashes for every token in the document.
  2. Sum weights into a 64-dimensional accumulator vector.
  3. Generate a final 64-bit fingerprint based on whether vector components are positive or negative.
  4. **Property**: Two documents differing by only a few words produce SimHashes with a **Hamming distance $\le 3$** (they differ in $\le 3$ bits out of 64).
  5. The crawler queries an in-memory inverted hash table to drop near-duplicates in $< 1\text{ms}$.

---

## 5. Architectural Trade-Off Matrix

| Design Alternative | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Index Sharding** | Partition by Term | Partition by Document | **Partition by Document**: Eliminates network transmission of multi-megabyte posting lists during query intersections. |
| **Posting List Storage** | Raw 64-bit Integer Array | Delta Encoding + Elias-Fano Compression | **Delta Compression**: Compresses index footprint by 80%, allowing billions of postings to remain resident in memory. |
| **Duplicate Detection** | Exact MD5 Hashing | 64-bit SimHash (Locality-Sensitive) | **SimHash**: Detects near-identical content differing only by timestamps, ads, or headers. |
| **Ranking Pipeline** | Single-Stage Complex ML Model | Two-Stage (BM25 Retrieval $\to$ Deep Learning Rerank) | **Two-Stage**: Stage 1 retrieves top 1,000 candidates in 10ms; Stage 2 applies deep neural cross-encoders to rank the top 10. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Explains the difference between web crawling and query evaluation.
- Defines an Inverted Index (term to document ID list).
- Understands basic TF-IDF scoring and PageRank concept.

### Senior (L5 / IC5)
- Explains why Document-Centric sharding is preferred over Term-Centric sharding for distributed search engines.
- Details posting list compression (Delta encoding, VByte) and skip pointers for fast intersection.
- Describes the two-stage ranking architecture (fast retrieval + ML reranking).
- Implements SimHash for near-duplicate elimination.

### Staff+ (L6 / Principal)
- Designs tiered index architectures (Hot Tier in RAM for recent/popular pages vs Cold Tier on NVMe SSDs).
- Evaluates neural semantic vector search (Dense Retrieval via ColBERT/FAISS) alongside classical sparse BM25 inverted indexes.
- Formulates crawler politeness algorithms (per-host queues, crawl delays, DNS resolution caching).
- Designs global multi-datacenter query routing with automatic tail-latency hedging.
