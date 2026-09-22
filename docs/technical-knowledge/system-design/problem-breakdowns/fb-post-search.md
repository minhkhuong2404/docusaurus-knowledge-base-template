---
id: fb-post-search
title: Design Facebook's Post Search Engine
sidebar_label: 16. FB Post Search
description: Staff-level system design breakdown for a real-time full-text search engine indexing billions of social media posts with sub-second visibility.
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design Facebook's Post Search Engine

A social post search engine (e.g., Facebook Search, Twitter/X Search, LinkedIn Search) enables users to search billions of public and friend-shared posts by keyword, hashtag, user tag, and date range. Unlike traditional static web search (which re-indexes over hours or days), social post search requires **real-time indexing** (posts must be searchable within 5 seconds of creation) and strict **social graph privacy enforcement** (users can only search posts they have permission to see).

---

## 1. Understanding the Problem

### Functional Requirements
1. **Full-Text Keyword Search**: Users can search for posts using keywords (e.g., `"Taylor Swift concert"`, `"#systemdesign"`).
2. **Real-Time Indexing**: Newly created posts must be searchable across the entire network in `< 5 seconds`.
3. **Relevance & Recency Ranking**: Search results are ranked based on text relevance (TF-IDF/BM25), author social affinity, and recency.
4. **Privacy & Social Graph Filtering**: Users must never see posts from private accounts or closed groups they do not belong to.
5. **Pagination**: Support paginated results with cursor-based retrieval.

### Non-Functional Requirements
- **Low Query Latency**: Search queries must return the top 20 ranked results in `< 150ms` (P95).
- **High Read Throughput**: Support up to **50,000 search queries/sec** during breaking news events.
- **High Write Throughput**: Index up to **5,000 new/updated posts per second**.
- **Data Durability**: Posts and indices must never be permanently lost; indices must be rebuildable from primary database storage.

### Capacity Estimations & Sizing (Global Scale)
- **Total Posts to Index**: 100 Billion posts.
- **Average Post Text Length**: 250 characters $\approx$ 50 words.
- **Inverted Index Size Calculation**:
  - Each post contains ~30 unique terms after stop-word removal.
  - Total index postings = $100\text{B posts} \times 30\text{ terms} = \mathbf{3\text{ Trillion postings entries}}$.
  - Storing a posting entry: `post_id` (8 bytes) + `term_frequency` (2 bytes) + `field_flags` (2 bytes) $\approx$ **12 bytes**.
  - Total Raw Index Size = $3\text{ Trillion} \times 12\text{ bytes} \approx$ **36 Terabytes (TB)**.
  - With forward index, term dictionary, and inverted index compressed via frame-of-reference (PForDelta): **~20 TB of distributed index RAM/NVMe storage**.
- **Search Query QPS**: 50,000 queries/sec peak.

---

## 2. The Set Up

### Defining the Inverted Index Structure

```
TERM DICTIONARY                      POSTING LIST (Inverted Index)
┌──────────────┐                     ┌──────────────────────────────────────────────┐
│ "distributed"│ ──────────────────► │ Doc 101 [tf: 2] ➔ Doc 405 [tf: 1] ➔ Doc 9912 │
├──────────────┤                     ├──────────────────────────────────────────────┤
│ "systems"    │ ──────────────────► │ Doc 101 [tf: 1] ➔ Doc 204 [tf: 3] ➔ Doc 405  │
├──────────────┤                     ├──────────────────────────────────────────────┤
│ "kafka"      │ ──────────────────► │ Doc 204 [tf: 1] ➔ Doc 8812 [tf: 2]           │
└──────────────┘                     └──────────────────────────────────────────────┘
```

### The API Design

#### Search Posts Query
```http
GET /api/v1/search/posts?q=distributed+systems&sort=relevant&limit=20
Authorization: Bearer <jwt_token>
```
**Response (`200 OK`)**:
```json
{
  "query": "distributed systems",
  "total_hits": 142050,
  "posts": [
    {
      "post_id": "pst_90184",
      "author": {"user_id": "usr_441", "name": "Martin Kleppmann"},
      "snippet": "Deep dive into <b>distributed systems</b> and consensus...",
      "score": 8.94,
      "created_at": "2026-09-22T21:15:00Z"
    }
  ],
  "next_cursor": "cur_a81902..."
}
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="post-search" title="Facebook Real-Time Post Search & Inverted Index Topology" />

### Core Data & Query Pipelines

#### 1. Real-Time Indexing Pipeline (Write Path)
1. User publishes post $\implies$ `POST /api/v1/posts`.
2. Primary database commits post row and emits `PostCreatedEvent` to **Apache Kafka**.
3. **Search Ingestion Workers** consume from Kafka:
   - **Text Tokenizer & Normalizer**: Splits text into tokens, converts to lowercase, applies language-specific stemming (e.g. `"running"` $\to$ `"run"`), and strips stop-words (`"the"`, `"and"`).
   - Generates document posting tuples: `(term, post_id, term_frequency, position)`.
4. Writes the document into an in-memory **RAM Buffer Segment**.
5. Every 2 seconds, an in-memory segment is committed and made searchable; background workers periodically merge memory segments into immutable **Lucene NVMe segments**.

#### 2. Search Serving Pipeline (Read Path)
1. User enters query: `"distributed systems"` $\implies$ hits **Search Aggregator / Query Coordinator**.
2. **Query Rewriter**: Expands synonyms, extracts hashtags, and parses boolean terms (`distributed AND systems`).
3. **Scatter-Gather Execution**:
   - Coordinator broadcasts query to all **Index Shards** in parallel.
   - Each shard intersects posting lists for `"distributed"` and `"systems"` using bitwise SIMD instructions.
   - Each shard scores candidate posts using BM25 relevance and returns its local **Top 100 posts** to the Coordinator.
4. **Privacy & Social Graph Filtering**:
   - Coordinator filters candidates against the Social Graph Service to eliminate posts the searcher is not authorized to view.
5. **Global Re-Ranking & Hydration**:
   - Merges results, applies social affinity boosts (posts by close friends ranked higher), hydrates author photos and snippets, and returns top 20 posts to the user in `< 150ms`.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Index Partitioning: Document-Partitioned vs Term-Partitioned
How should the 20 TB inverted index be distributed across hundreds of servers?

```
TERM-PARTITIONED INDEX:
Each shard owns a specific set of words (e.g. Shard 1 owns A-D; Shard 2 owns E-H).
Query "apple banana":
➔ Coordinator contacts Shard 1 ("apple") and Shard 1 ("banana").
Catastrophic Drawback:
Writing a single post with 50 words requires writing to 50 DIFFERENT SHARDS!
Extreme write amplification and distributed transactional complexity.

DOCUMENT-PARTITIONED INDEX (Industry Standard):
Each shard owns an entire subset of posts (e.g. Shard 1 owns Posts 0-1M; Shard 2 owns Posts 1M-2M).
Writing a single post requires writing to EXACTLY ONE SHARD!
Query "apple banana":
➔ Scatter-gather query sent to all shards; each shard intersects locally.
```
- **Why Document-Partitioning Wins**:
  - In social media, writes happen at 5,000+ posts/sec. Localized single-shard writes eliminate network write amplification.
  - Adding new posts or deleting posts is completely contained within a single machine.

### Deep Dive 2: Fast Posting List Intersection (SIMD & Skip Lists)
When a query contains two common words (`"software"` AND `"engineer"`), how does an index shard intersect two lists containing millions of document IDs in sub-millisecond time?

```
List A: 3, 14, 19, 25, 42, 67, 89, 104, 150, 201 ...
List B: 19, 42, 99, 150, 304 ...

Naive O(M + N) pointer traversal is too slow for 10M-element lists.

SKIP LIST / BLOCK JUMPING:
List A is broken into compressed 128-integer blocks with a max value index:
[Block 1: Max 25] ➔ [Block 2: Max 89] ➔ [Block 3: Max 150] ...

When comparing against List B's value (19):
➔ Immediately inspect Block 1 (Max 25 >= 19).
When comparing against 150:
➔ SKIP Block 2 entirely (Max 89 < 150)! Jump directly to Block 3!
➔ Saves 80%+ of CPU cycles.
```
- **Bitset SIMD Vectorization**: Modern engines represent dense document IDs as bitsets and execute the `AND` intersection using AVX-512 vector CPU instructions, intersecting 512 IDs in a single CPU clock cycle!

### Deep Dive 3: Real-Time Social Graph Privacy Filtering
Unlike Google Search where all indexed web pages are public, Facebook posts have complex access control lists (ACLs): `PUBLIC`, `FRIENDS_ONLY`, `FRIENDS_OF_FRIENDS`, `CUSTOM_GROUP`.
- **Pre-Filtering vs Post-Filtering**:
  - *Pre-Filtering (In the Index)*: Storing every allowed viewer ID in the index explodes index size by 1,000x!
  - *Post-Filtering (In the Coordinator)*: If the coordinator fetches top 100 results and filters out 95 private posts, only 5 results remain on page 1!
- **Two-Stage Hybrid Security Filter**:
  1. Store broad privacy flags in the posting list (`is_public: true/false`).
  2. Public queries bypass ACL checks entirely.
  3. For private posts, each shard returns the top 500 candidates. The Coordinator invokes an in-memory **Social Graph Cache** (`GET friends:{viewer_id}`) and performs high-speed bitwise set intersection to verify friendship before ranking.

---

## 5. Architectural Trade-Off Matrix

| Design Area | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Index Partitioning** | Term-Partitioned | Document-Partitioned | **Document-Partitioned**: Confines every post write to exactly one shard. Vital for handling 5,000+ real-time writes/sec. |
| **Real-Time Freshness** | Hourly Batch MapReduce Re-indexing | In-Memory Segment Buffering (Lucene NRT) | **In-Memory Segments**: Posts become searchable within 2 seconds of publication by searching RAM buffers before disk flushing. |
| **Ranking Metric** | Pure Keyword Relevance (BM25) | Two-Stage (BM25 $\to$ Social Affinity ML) | **Two-Stage**: BM25 surfaces text matches; ML re-ranker elevates posts from close friends and family, providing meaningful social context. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Explains the structure and purpose of an Inverted Index.
- Designs basic schemas for Posts, Terms, and Posting Lists.
- Understands tokenization, stemming, and stop-word removal.
- Proposes ElasticSearch / OpenSearch as an off-the-shelf component.

### Senior (L5 / IC5)
- Evaluates the critical trade-offs between **Document-Partitioned** and **Term-Partitioned** index topologies.
- Explains real-time in-memory segment flushing (Near Real-Time - NRT search).
- Optimizes posting list intersection using skip lists and SIMD bitset operations.
- Solves social graph privacy enforcement (pre-filtering vs post-filtering trade-offs).

### Staff+ (L6 / Principal)
- Designs index lifecycle management: Automatic segment compaction, hot vs warm NVMe tiering, and index re-sharding without downtime.
- Addresses catastrophic query failure modes: Handling common stop-word queries (`"the new car"`) that cause posting list explosion (early termination algorithms like WAND - Weak AND).
- Architects multi-region search synchronization: Maintaining index replicas across global regions with consistent document deletion semantics under GDPR right-to-be-forgotten mandates.
