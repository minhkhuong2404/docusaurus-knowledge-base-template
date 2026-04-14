---
id: database-indexing-deep-dive
title: "Database Indexing: A Senior Engineer's Deep Dive"
description: "An advanced, comprehensive guide to database indexing mechanisms, covering Disk I/O, B-Trees, Hash Indexes, Geospatial (Geohashing, R-trees), and Inverted Indexes for System Design."
sidebar_label: DB Indexing Deep Dive
sidebar_position: 1
tags: [database, system-design, performance, internals]
---

# Database Indexing: A Senior Engineer's Deep Dive

In system design interviews and large-scale architecture, "just add an index" is no longer an acceptable answer. Senior engineers must understand **how data is physically structured on disk**, how different data structures interact with memory hierarchies, and the precise limitations of various indexing algorithms. 

This guide provides a foundational deep dive into database indexing based on the core constraints of hardware and data geometry.

---

## 1. The Hardware Constraint: Why We Index

Before discussing tree structures, we must understand the core problem: **Disk I/O**.

Data in a relational database is continuously serialized onto persistent storage (SSD/HDD). To optimize block storage, databases divide data into fixed-size contiguous chunks called **Pages** (commonly 8KB in size). [00:00:33]

### The Sequential Scan Bottleneck
When querying a database without an index, the engine executes a **Full Table Scan**:
1. Fetches a page from disk into RAM.
2. Scans the ~100 rows within that page for the target value.
3. Evicts the page and fetches the next one.

:::danger[The Math Behind the Bottleneck]
If you have 100 million users, and each 8KB page holds 100 rows, your table spans **1 million pages**. 
At approximately **100 microseconds** per SSD-to-RAM round trip, scanning 1 million pages takes **~100 seconds** in the worst case [00:01:12]. Even with sequential pre-fetching reducing this to 3–5 seconds, this latency is catastrophic for synchronous application flows.
:::

**Indexes** are auxiliary data structures stored on disk that act as a map. They allow the database engine to resolve a key to a specific memory offset/page pointer in logarithmic or constant time, fetching *only* the specific page required into memory. [00:01:46]

---

## 2. B-Trees (B+ Trees): The Industry Workhorse

By far the most common index implementation across modern databases (PostgreSQL, MySQL, InnoDB) is the **B-Tree** (specifically the B+ Tree).

### Structure and Memory Mapping
A B-Tree node is a sorted array of keys and pointers. [00:02:24]
* **Internal Nodes:** Contain routing keys and pointers to child nodes (other index pages).
* **Leaf Nodes:** Contain pointers directly to the physical Data Pages (or cluster the data directly in the case of clustered indexes). 

Because a node is specifically designed to fit within a single disk page (e.g., 8KB), B-Trees exhibit a massive "fan-out" (branching factor). This keeps the tree remarkably shallow—usually 3 or 4 levels deep—meaning it only takes 3-4 disk I/O operations to find any record among billions.

### Why B-Trees Dominate
While B-Trees provide $O(\log N)$ exact lookups, their true superpower is **Range Queries and Sorting** [00:03:35]. 
Because keys are stored in strictly sorted order, a query like `SELECT * FROM users WHERE age > 50` traverses the tree to find the node for `50`, and simply follows the linked list of leaf nodes horizontally, pulling only the relevant pages into memory. 

---

## 3. Hash Indexes: Fast but Inflexible

A Hash Index uses a standard hash map stored on disk. The search key is passed through a hash function to map directly to a bucket that contains the disk pointer [00:04:06].

:::warning[Why are Hash Indexes rarely used in relational databases?]
Despite offering $O(1)$ lookups, Hash Indexes explicitly **destroy ordering**. If you use a Hash Index, queries like `WHERE age > 50` or `ORDER BY created_at` cannot utilize the index, resulting in a full table scan [00:04:32]. 
:::

**When to use them:** Hash indexes are relegated to in-memory key-value stores (like Redis or Memcached), where the primary access pattern is strictly direct-key lookup and disk I/O paging is irrelevant [00:04:44].

---

## 4. Geospatial Indexing: Solving Multi-Dimensional Data

B-trees natively index 1-dimensional data. They fail spectacularly when indexing 2-dimensional data (like Latitude and Longitude).

If you run a bounding box query (`WHERE lat BETWEEN 100 AND 400 AND long BETWEEN 20 AND 200`), a B-Tree forces the engine to fetch massive continuous strips of latitude pages, massive strips of longitude pages, and perform an extremely expensive set-intersection (merge) in memory [00:05:49]. 

To solve this, we use specialized algorithms that reduce 2D space into 1D space, or cluster data dynamically.

### 4.1 Geohashing (Z-Order Curves)
Geohashing recursively subdivides the map into four quadrants (`0, 1, 2, 3`), continuing downwards to increase precision [00:06:30]. 
* By appending the quadrant numbers (e.g., `3 -> 31 -> 310`), spatial proximity is converted into **string prefix proximity**.
* These strings are Base-32 encoded. 
* **Implementation:** Once spatial data is converted to 1D strings, the database simply stores these strings inside a standard B-Tree. Finding nearby drivers in a radius becomes a simple string prefix match in the B-Tree [00:07:25]. **Redis uses Geohashing natively.**

### 4.2 Quad Trees
Quad trees split the world recursively similar to Geohashes, but they map the space to a tree structure and utilize a density constant `k` [00:07:53]. A grid is only subdivided into four smaller grids if the number of items inside it exceeds `k`. This ensures memory is not wasted on empty oceanic spaces and depth is focused on high-density areas (like Manhattan).

### 4.3 R-Trees (Region Trees)
R-trees (predecessors derived from Quad Trees) represent the modern standard for disk-based geospatial indexes. Instead of rigidly dividing the map into quadrants, R-Trees dynamically cluster objects into overlapping **Minimum Bounding Rectangles (MBRs)** [00:09:12]. 
* **Implementation:** When searching for a point, the engine traverses down intersecting bounding boxes. This is the underlying algorithm powering **PostGIS** (the spatial extension for PostgreSQL) [00:10:20].

---

## 5. Inverted Indexes: Full-Text Search

If you need to query partial string matches (e.g., `WHERE business_name LIKE '%pizza%'`), a B-Tree is rendered useless. Because B-trees are sorted lexicographically, they can optimize prefix searches (`'pizza%'`) but wildcard suffix searches force a Full Table Scan [00:10:57].

**The Solution:** The Inverted Index.
Instead of mapping a Row ID to a string, an Inverted Index tokenizes text into discrete words and maps each word to a list of Document IDs [00:11:32].

| Token      | Posting List (Document IDs/Pointers) |
| :--------- | :----------------------------------- |
| `fast`     | `[doc1, doc2]`                       |
| `reliable` | `[doc1]`                             |
| `range`    | `[doc3]`                             |

When a user searches for "fast", the engine simply looks up the token `fast` in a hash map or B-Tree, retrieves the pointers `[doc1, doc2]`, and pulls those specific disk pages into RAM [00:12:07].

**Implementation:** This architecture is the core engine behind full-text search technologies like **Elasticsearch**, Lucene, and PostgreSQL's `tsvector`/`tsquery` [00:12:23].

---

## System Design Cheatsheet: Choosing the Right Index

In a system design interview, your choice of index explicitly dictates the performance of your system. Use this decision matrix [00:13:00]:

1. **Do you need fast lookups?**
   * *No* ➡️ Full Table Scan (Sequential).
   * *Yes* ➡️ Proceed to step 2.
2. **Is your dataset small (e.g., configurations)?**
   * *Yes* ➡️ Full Table Scan (fits entirely in RAM).
   * *No* ➡️ Proceed to step 3.
3. **What is the geometric access pattern of the query?**
   * **Full-Text / Wildcard Search:** ➡️ Inverted Index (Elasticsearch, Lucene).
   * **Spatial / Radius / Location:** ➡️ Geospatial Index (Geohashing in Redis, R-Trees in PostGIS).
   * **Strictly Exact-Match Key-Value (In-Memory):** ➡️ Hash Index (Redis, Memcached).
   * **Relational / Sorting / Range / Everything Else:** ➡️ B-Tree (Default RDBMS Index).
   * **Bonus:** If you have a read-heavy workload with infrequent writes, consider a **Clustered Index** to store data directly in the leaf nodes of the B-Tree for even faster access.