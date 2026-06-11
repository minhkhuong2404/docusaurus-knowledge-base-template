---
id: elasticsearch-internals
title: "Elasticsearch Internals: Inverted Index & Cluster Architecture"
sidebar_label: Internals & Core Architecture
description: A deep dive into Elasticsearch internals — covering the inverted index structure, node roles, sharding, document write path, and search query execution.
tags: [elasticsearch, inverted-index, lucene, sharding, replication, cluster-architecture, index-lifecycle]
---

# Elasticsearch Internals: Inverted Index & Cluster Architecture

To design high-performance search systems, engineers must understand how Elasticsearch stores, retrieves, and maintains data. Under the hood, Elasticsearch uses **Apache Lucene** segments to manage text indexes and implements a sophisticated distributed consensus layer to orchestrate cluster state.

---

## The Inverted Index

Unlike relational databases that use B-Tree indexes to map a row ID to column values, Elasticsearch uses an **Inverted Index**. An inverted index maps individual terms (words) to the list of documents containing them.

### Structure of an Inverted Index

Consider three documents:
- **Doc 1**: *"Build reliable distributed systems"*
- **Doc 2**: *"Scale distributed database writes"*
- **Doc 3**: *"Database connection pooling"*

The Lucene indexing pipeline processes these texts, transforming them into a sorted term dictionary pointing to **Posting Lists**:

| Term | Doc Frequency | Posting List (Doc IDs, [Term Frequencies, Offsets]) |
|---|---|---|
| build | 1 | `Doc 1: [1, (0-5)]` |
| connection | 1 | `Doc 3: [1, (9-19)]` |
| database | 2 | `Doc 2: [1, (17-25)]`, `Doc 3: [1, (0-8)]` |
| distributed | 2 | `Doc 1: [1, (15-26)]`, `Doc 2: [1, (6-17)]` |
| pooling | 1 | `Doc 3: [1, (20-27)]` |
| reliable | 1 | `Doc 1: [1, (6-14)]` |
| scale | 1 | `Doc 2: [1, (0-5)]` |
| systems | 1 | `Doc 1: [1, (27-34)]` |
| writes | 1 | `Doc 2: [1, (26-32)]` |

- **Posting List**: Holds Doc IDs, term frequency (how many times the word appears in the doc, used for TF/IDF scoring), and position offsets (used for phrase searches).
- **Term Dictionary**: A sorted list of all unique terms. Lucene caches this in memory using a **Term Index** structured as a Finite State Transducer (FST) to enable fast prefix lookups.

### Deep Dive: Posting List Compression & Term Index (FST)

To manage millions of documents, Lucene implements advanced compression techniques for the components of the inverted index:

1. **Term Index: Finite State Transducer (FST)**:
   * Storing all unique terms (the Term Dictionary) in memory is impossible at scale.
   * Lucene structures a **Term Index** as an FST in memory. The FST acts like a compressed prefix tree (trie), mapping prefix characters to the offset position of the corresponding block in the Term Dictionary on disk.
   * On a query, Lucene performs a fast traversal of the FST in memory to locate the block offset, then executes a single seek on disk to read the term and its posting list.
2. **Posting List Compression: Frame of Reference (FOR)**:
   * Posting lists contain a sorted list of integer document IDs (e.g., `[1002, 1007, 1012, 1013]`).
   * To compress these, Lucene first computes the differences (deltas) between consecutive document IDs: `[1002, 5, 5, 1]`.
   * These small deltas are grouped into blocks (typically of size 128). Lucene finds the maximum value in the block and uses only the minimum bits necessary to store that value.
   * For instance, if the maximum delta in a block is `5`, it requires only 3 bits (since $2^3 = 8 > 5$) instead of a full 32-bit integer. This compresses the list by up to 90% and enables fast CPU vectorization (SIMD) scans.
3. **Bitset Compression: Roaring Bitmaps**:
   * For non-scoring filter operations, Lucene caches matches in memory using bitsets.
   * A raw bitset of 10 million documents takes ~1.2MB. When caching thousands of filters, this causes heap bloat.
   * Lucene uses **Roaring Bitmaps** to compress bitsets:
     * Document IDs are divided into chunks of $2^{16}$ (65,536).
     * If a chunk has fewer than 4,096 documents, it is stored as an array of 16-bit integers.
     * If a chunk has more than 4,096 documents, it is stored as a raw bit map (65,536 bits).
     * If a chunk is fully populated (e.g., matching a wide range), it is stored as run-length encoded (RLE) ranges.

### Lucene Analysis Pipeline

Before a text field is inserted into the inverted index, it passes through an **Analyzer**:

```
Raw Text ──► [Character Filters] ──► [Tokenizer] ──► [Token Filters] ──► Inverted Index
```

1.  **Character Filters**: Clean the string (e.g., strip HTML tags `<a>` or map characters like `&` to `and`).
2.  **Tokenizer**: Splits the text stream into tokens (e.g., the `standard` tokenizer splits on spaces and punctuation).
3.  **Token Filters**: Modify tokens. Examples include:
    *   `lowercase`: Converts all tokens to lowercase.
    *   `stop`: Removes common stop words (*the, a, is, to*).
    *   `stemmer`: Reduces words to root forms (e.g., *writes, writing, written* → *write*).

### Deep Dive: Tokenizing & Stemming

The behavior of tokenization and stemming determines the query match accuracy (recall vs. precision).

1. **Tokenization Strategy**:
   * **Standard Tokenizer**: Splits text based on Unicode boundaries, stripping punctuation and brackets. Good for natural language.
   * **Keyword Tokenizer**: Treats the entire input string as a single token. Used for exact value matches (e.g. email addresses, product codes).
   * **N-Gram / Edge N-Gram Tokenizer**: Splits text into sliding window combinations of letters. For example, an edge N-Gram of `"elastic"` with size 3-5 generates: `["ela", "elas", "elast"]`. Essential for autocomplete/search-as-you-type optimization.
2. **Stemming vs. Lemmatization**:
   * **Stemming**: A heuristic, rule-based algorithmic process that chops off the ends of words.
     * *Example*: The popular **Porter Stemmer** or **Snowball** apply rules like: if word ends in `sses` -> replace with `ss` (e.g., `caresses` → `caress`); if word ends in `ies` -> replace with `i` (e.g., `flies` → `fli`).
     * *Pros*: Extremely fast, lightweight, requires no external dictionaries.
     * *Cons*: Can over-stem (e.g., `organization` and `organs` both mapping to `organ`) or under-stem (e.g., `feet` and `foot` not mapping together).
   * **Lemmatization**: A dictionary-based lookup that identifies the vocabulary root of a word (the lemma) by analyzing its morphological context (part of speech).
     * *Example*: `better` → `good`, `ran` → `run`, `feet` → `foot`.
     * *Pros*: Highly accurate, preserves true semantic roots.
     * *Cons*: Slower, requires large dictionary lookups, and consumes more memory.

---

## Cluster Topology & Node Roles

Elasticsearch operates as a peer-to-peer distributed system. Every node participates in cluster coordination, data storage, or query execution by assuming one or more roles:

| Node Role | Key Responsibility | Resource Focus |
|---|---|---|
| **Master-Eligible** | Participates in voting to elect the active Master node. The active Master updates and publishes the cluster state (index mappings, node join/leave, routing table). | CPU & Network (low memory) |
| **Data Node** | Stores shard segments and executes search, aggregation, and write operations. | Disk I/O & Memory |
| **Coordinating** | Acts as a load balancer/router. Receives client REST requests, routes write requests to primary shards, scatters search queries to data nodes, and merges results. | Network & CPU (garbage collection) |
| **Ingest Node** | Runs pre-processing pipelines (ingest processors) on documents before indexing (similar to a lightweight Logstash). | CPU & Memory |
| **Voting-Only** | Participates in Master elections but cannot be elected as the active Master. Used to prevent split-brain scenarios in dual-zone clusters. | Minimal footprint |

---

## Sharding & Replication

An Elasticsearch Index is a logical namespace pointing to one or more physical **Shards**. Under the hood, a shard is an instance of an **Apache Lucene Index**.

```
Logical Index (3 Shards, 1 Replica)
 ├── Shard 0 (Primary on Node A, Replica on Node B)
 ├── Shard 1 (Primary on Node B, Replica on Node C)
 └── Shard 2 (Primary on Node C, Replica on Node A)
```

### Document Routing Heuristics
When a document is indexed, its destination shard is determined by a strict hashing formula:

$$\text{Shard ID} = \text{hash}(\text{routing\_value}) \pmod{\text{number\_of\_primary\_shards}}$$

*   **Routing Value**: Defaults to the document's `_id`. It can be overridden (e.g., set to `routing=user_id`) to ensure all logs for a specific tenant or user land on the same shard, optimizing search latency.
*   **Immutability of Primary Shards**: Because the modulo operation depends on the denominator, the number of primary shards (`number_of_shards`) cannot be changed after index creation. If you need to change shard count, you must **Reindex** all data into a new index.

### Deep Dive: The Distributed Replication Model

Elasticsearch's distributed coordination layer is designed to maintain high availability and prevent data loss during network partitions or node failures.

1. **Paxos-Based Consensus (Zen2 Discovery)**:
   * Elasticsearch uses **Zen2 Discovery** (built on a consensus protocol similar to Raft) to elect a single active Master node.
   * Only the Master node can modify the global **Cluster State** (e.g., creating/deleting indices, adding/removing nodes, assigning primary/replica shards).
   * When the Master changes the cluster state, it broadcasts the state to all nodes using a **Two-Phase Commit (2PC)**:
     1. **Prepare**: Master sends the new state to all master-eligible nodes. Nodes validate and cache it.
     2. **Commit**: Once a quorum of master-eligible nodes accepts the state, the Master broadcasts a commit signal, prompting nodes to apply the state updates.
2. **Primary-Backup Replication Flow**:
   * Unlike masterless systems like Cassandra, Elasticsearch uses a **Primary-Backup** model for data replication.
   * Every write/index request is routed exclusively to the **Primary Shard**. The primary shard validates the operation, writes it locally, and then forwards the operation to all active **Replica Shards** in parallel.
   * The coordinating node returns a success response to the client only after all active replicas acknowledge the write.
3. **Active Shards Protection (`wait_for_active_shards`)**:
   * To prevent write loss when replica nodes are offline, you can configure how many copies of a shard must be active before a write is permitted.
   * Options include:
     * `all`: Requires all configured replicas to be online.
     * `index-setting`: Defaults to `1` (requires only the primary shard to be active to proceed).
   * If the minimum active shard count is not met, the write fails with a `ReplicationGroup` exception.
4. **Sequence Numbers & Local/Global Checkpoints**:
   * To keep replicas in sync without scanning whole segments, Elasticsearch assigns a **Sequence Number** to every write operation.
   * Nodes track:
     * **Local Checkpoint**: The highest sequence number where all previous operations have been successfully processed on that specific shard copy.
     * **Global Checkpoint**: The highest sequence number where all previous operations have been processed on *every* replica in the replication group.
   * If a replica node temporarily disconnects and reconnects, it checks its local checkpoint against the primary's global checkpoint. It can then request only the missing operations from the primary's translog (an incremental recovery), avoiding a full shard sync over the network.

---

## Document Write Path (Indexing Lifecycle)

Writing a document to Elasticsearch involves a two-stage process: routing to the primary shard, and committing it to memory and disk.

```
Client 
  │  (1) POST /logs/_doc/1
  ▼
[Coordinating Node] 
  │  (2) routing: hash("1") % 3 = Shard 0 (Primary on Node A)
  ▼
[Node A: Primary Shard 0] ──────────────────────────────────────────┐
  │                                                                 │
  ├──► Writes to: Memory Index Buffer                               │
  ├──► Writes to: Translog (append-only write-ahead log)            │
  │                                                                 │
  ├── (3) Parallel replicate                                        │
  ▼                                                                 │
[Node B: Replica Shard 0]                                           │
  │                                                                 │
  ├──► Memory Index Buffer                                          │
  └──► Translog                                                     │
  │                                                                 │
  ▼ (4) ACK                                                         │
[Node A: Primary Shard 0] ◄─────────────────────────────────────────┘
  │
  ▼ (5) Return success response (201 Created)
Client
```

### Writing to Lucene Segments (Near-Real-Time)
A document is not immediately searchable upon landing on the data node. Lucene indexes data using immutable file chunks called **Segments**. The process unfolds in two critical phases:

```
                  ┌──────────────────────┐
                  │ Memory Index Buffer  │
                  └──────────┬───────────┘
                             │
                      Refresh (every 1s)
                             │
                             ▼
                  ┌──────────────────────┐
                  │ OS Page Cache        │  ◄── Document now SEARCHABLE
                  │ (Lucene Segment)     │
                  └──────────┬───────────┘
                             │
                        Flush (30m/full)
                             │
                             ▼
                  ┌──────────────────────┐
                  │ Physical Disk        │  ◄── Fsync'd to disk (durable)
                  └──────────────────────┘
```

1.  **Refresh (Searchability)**:
    *   By default, every 1 second, the **Memory Index Buffer** is written into a new Lucene segment inside the **OS Page Cache**.
    *   Once in the page cache, the segment is opened for search. The document is now **searchable** (near-real-time search).
    *   This is memory-only; no data is written to disk yet.
2.  **Flush (Durability)**:
    *   The **Translog** is an append-only transaction log that ensures durability. If a node crashes before disk commit, the translog replays indexing.
    *   Every 30 minutes (or if the translog reaches 512MB), a **Flush** is triggered.
    *   During a flush, the memory buffer is cleared, a new Lucene segment is created, all segments in the page cache are written to physical disk via `fsync`, and the translog is truncated.

### Deep Dive: Immutable Segments, Deletes, and Updates

Lucene's design choice of using **immutable segments** simplifies index search execution but changes how updates and deletions behave.

1. **Why Immutable Segments?**:
   * **No Locking**: Since segments are read-only, multiple search threads can query segments concurrently without lock contention.
   * **OS Page Cache Utilization**: Once a segment file is read into physical memory, it remains cached because it never changes. This avoids cache invalidation overhead.
   * **Compression**: Immutability allows Lucene to aggressively apply delta-compression (FOR) and prefix-encoding (FST) to files since it doesn't need to leave empty space for future inserts.
2. **How Deletes Work: The `.del` File**:
   * Since a segment file on disk is read-only, a document cannot be deleted from it immediately.
   * Instead, when a delete request is processed, the document ID is written to a separate **`.del` bitset file** associated with that segment.
   * During search execution, Lucene queries the segment index as usual, but checks the `.del` file, dynamically filtering out any deleted documents before returning results.
3. **How Updates Work: Delete-then-Insert**:
   * Relational databases perform updates in-place. Lucene cannot do this.
   * When you update a document:
     1. The old document is looked up, and its ID is written to the segment's `.del` file (marking it as deleted).
     2. The updated document is indexed as a completely new document, written to the active memory indexing buffer. It will eventually be refreshed into a new Lucene segment.
4. **Segment Merging (Reclaiming Disk Space)**:
   * Every refresh creates a new segment. Over time, search latency increases because Lucene must scan every segment.
   * To prevent this, Elasticsearch runs a background **Segment Merge** process.
   * During a merge, Elasticsearch selects several smaller segments, reads their contents, **discards any documents marked in the `.del` files**, and writes the remaining active documents into a single, larger, optimized segment.
   * Once the new segment is complete, the old segments are deleted, permanently reclaiming disk space.

---

## Document Read & Search Path

Searching across a distributed index requires a **Scatter-Gather** pattern executed in two phases: **Query** and **Fetch**.

```
Client ──► [Coordinating Node]
             │
             ├─ (Scatter Phase) ─► query query query
             │                      │     │     │
             ▼                      ▼     ▼     ▼
          Data Nodes           [Shard 0][Shard 1][Shard 2] (Collect local top N match)
             │                      │     │     │
             ├─ (Gather Phase)  ─◄──┘     │     │
             │  Return Doc IDs + Sort Values    │
             ▼                                  │
          [Coordinating Node] (Sort & select global top N)
             │
             ├─ (Scatter Phase) ─► Fetch Doc 1, Doc 5...
             ▼
          Data Nodes           Retrieve source JSON from disk segment
             │
             ▼ (Gather Phase)
          [Coordinating Node] ──► Merge JSON list ──► Return to Client
```

### 1. The Query Phase (Scatter)
1.  The client sends a query to the Coordinating Node (can be any node in the cluster).
2.  The Coordinating Node chooses which shards to query (primary or replica, based on load balancing).
3.  The Coordinating Node sends the query request to all active shards.
4.  Each shard executes the search locally, building a priority queue of sorted results (containing only the document **IDs** and sorting values like `_score`, not the full `_source` JSON).
5.  Each shard returns its priority queue list to the Coordinating Node.

### 2. The Fetch Phase (Gather)
1.  The Coordinating Node merges the priority queues from all shards and performs a global sort to identify the top $N$ documents requested (e.g., if `from: 0, size: 10`, it picks the top 10).
2.  The Coordinating Node contacts only the specific shards that hold the winning documents, requesting the actual `_source` JSON data by ID.
3.  Shards retrieve the source documents from Lucene segments and return them to the Coordinating Node.
4.  The Coordinating Node merges the JSON list and returns the response to the client.

:::warning[Deep Pagination Warning]
The scatter-gather pattern explains why deep pagination is extremely expensive in Elasticsearch. If you query `{ "from": 9000, "size": 10 }`, each shard must build a priority queue of 9010 documents and send it to the coordinating node, which then sorts $9010 \times \text{number of shards}$ documents. This causes high memory consumption and GC pressure. To paginate safely through millions of documents, use `search_after` or the `Scroll API` instead of `from` and `size`.
:::

---

## Query Context vs. Filter Context

When constructing searches, Elasticsearch distinguishes between evaluating relevance and executing strict boolean matching.

### Query Context (How Relevant?)
- **Behavior**: Calculates a relevance score (`_score`) for each document. The score represents how closely the document's content matches the search terms.
- **Algorithm**: Lucene uses the **BM25** algorithm (an evolution of TF/IDF) which evaluates:
  1. **Term Frequency (TF)**: How often the term appears in this document (more frequency = higher score).
  2. **Inverse Document Frequency (IDF)**: How rare the term is across the entire index (rarer term = higher score).
  3. **Field Length**: Shorter fields containing the term get higher relevance than very long fields.
- **Caching**: Results **cannot** be cached because scores are dynamically calculated relative to the search term and the state of the index segments.

### Filter Context (Yes or No?)
- **Behavior**: Evaluates whether a document matches a condition without calculating a score. The answer is a simple, binary yes or no.
- **Caching**: Crucially, filter results are cached in the **Node Query Cache** using **Bitsets** (specifically, Roaring Bitmaps). A bitset represents matching document IDs as `1`s and non-matches as `0`s (e.g., `[1, 0, 1, 1, 0]`). Subsequent queries reuse these bitsets from memory without re-evaluating the segments.
- **Execution**: If multiple filters are applied, Lucene optimizes execution by running the most restrictive filter first.

### Key Conceptual Differences
| Feature | Query Context | Filter Context |
|---|---|---|
| **Scoring** | Computes `_score` for ranking | No score computed (`_score` is 0 or unchanged) |
| **Caching** | Never cached | Cached in memory via Bitsets |
| **Performance** | Slower (CPU-intensive score math) | Faster (retrieved from memory/bitset) |
| **Common Operators** | `match`, `multi_match`, `query_string` | `term`, `terms`, `range`, `exists` |
| **Logical Position** | Inside `must` or `should` clauses | Inside `filter` or `must_not` clauses |

