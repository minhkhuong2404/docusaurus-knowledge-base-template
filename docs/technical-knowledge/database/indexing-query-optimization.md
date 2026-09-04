---
id: indexing-query-optimization
title: Indexing & Query Optimization
description: Deep dive into database indexing mechanisms — covering disk I/O, B-Trees, hash indexes, composite index design, geospatial indexing, inverted indexes, EXPLAIN analysis, and Spring/JPA performance.
tags: [database, indexing, query-optimization, b-tree, explain, performance, system-design]
sidebar_position: 3
---

import DatabaseIndexScanTypesDiagram from '@site/src/components/DatabaseIndexScanTypesDiagram';
import DatabaseJoinAlgorithmsDiagram from '@site/src/components/DatabaseJoinAlgorithmsDiagram';
import BTreeWritePathDiagram from '@site/src/components/BTreeWritePathDiagram';
import GeospatialIndexingDiagram from '@site/src/components/GeospatialIndexingDiagram';

# Indexing & Query Optimization

---

In large-scale database systems and system design interviews, "just add an index" is not a complete answer. Engineers must understand how data is physically structured on disk, how different data structures interact with memory hierarchies, how to analyze query paths using `EXPLAIN`, and the precise trade-offs of various indexing algorithms.

---

## 1. What is an Index & The Hardware Constraint

An index is a **separate data structure** that stores a subset of a table's columns in organized memory and disk pages so the database can locate records without performing a full table scan.

### Trade-offs:
- ✅ Speeds up `SELECT`, `JOIN`, `ORDER BY`, `WHERE`
- ❌ Slows down `INSERT`, `UPDATE`, `DELETE` (index structures must be updated)
- ❌ Consumes additional disk and RAM storage

## The Hardware Constraint: Why We Index

Before discussing tree structures, we must understand the core problem: **Disk I/O**.

Data in a relational database is continuously serialized onto persistent storage (SSD/HDD). To optimize block storage, databases divide data into fixed-size contiguous chunks called **Pages** (commonly 8KB in size).

### The Memory Hierarchy

| Memory Layer | Typical Capacity | Access Latency | Relative Latency Factor | Volatility & Role |
|---|---|---|---|---|
| **CPU Registers** | &lt; 1 KB | ~0.5 ns | 1x | Volatile; immediate processor instructions. |
| **CPU Cache (L1/L2/L3)** | 32 KB – 12 MB | 1 – 10 ns | 2x – 20x | Volatile; frequently accessed variables and cache lines. |
| **Main Memory (RAM)** | 8 – 64 GB | ~100 ns | 200x | Volatile; Database Buffer Pool / Shared Buffers. |
| **NVMe SSD Storage** | 256 GB – 4 TB | ~100 μs | **200,000x** | Non-volatile; random/sequential page reads and WAL appends. |
| **HDD Magnetic Storage** | 1 – 10 TB | ~10 ms | **20,000,000x** | Non-volatile; mechanical platter seek time bottleneck. |

> 💡 **Key Insight:** Disk I/O is **100,000x to 1,000,000x slower** than CPU and RAM! Every index optimization is fundamentally an effort to minimize random physical page fetches from disk.

### The Sequential Scan Bottleneck

When querying a database without an index, the engine executes a **Full Table Scan**:

1. Fetches a page from disk into RAM.
2. Scans the ~100 rows within that page for the target value.
3. Evicts the page and fetches the next one.

:::danger[The Math Behind the Bottleneck]
If you have 100 million users, and each 8KB page holds 100 rows, your table spans **1 million pages**.
At approximately **100 microseconds** per SSD-to-RAM round trip, scanning 1 million pages takes **~100 seconds** in the worst case. Even with sequential pre-fetching reducing this to 3–5 seconds, this latency is catastrophic for synchronous application flows.
:::

**Indexes** are auxiliary data structures stored on disk that act as a map. They allow the database engine to resolve a key to a specific memory offset/page pointer in logarithmic or constant time, fetching *only* the specific page required into memory.

### Visual Example

| Scan Strategy | Query Execution Path | Disk I/O Pages Fetched | Execution Latency |
|---|---|---|---|
| **Without Index (Full Table Scan)** | Sequential scan: Page 1 ➔ Page 2 ➔ Page 3 ... ➔ Page 10,000 until key `999,999` is located. | **10,000 pages** (~80 MB read from disk) | ~1,000 ms (1 second) |
| **With Index (B-Tree Logarithmic Search)** | Tree traversal: Root page ➔ Level 1 internal node ➔ Leaf page ➔ Data page pointer. | **4 pages** (32 KB read from cache/disk) | **~0.4 ms (2,500x speedup!)** |

---


## B-Trees (B+ Trees): The Industry Workhorse

<BTreeWritePathDiagram />

By far the most common index implementation across modern databases (PostgreSQL, MySQL, InnoDB) is the **B-Tree** (specifically the B+ Tree).

### Structure and Memory Mapping

A B-Tree node is a sorted array of keys and pointers.

* **Internal Nodes:** Contain routing keys and pointers to child nodes (other index pages).
* **Leaf Nodes:** Contain pointers directly to the physical Data Pages (or cluster the data directly in the case of clustered indexes).

Because a node is specifically designed to fit within a single disk page (e.g., 8KB), B-Trees exhibit a massive "fan-out" (branching factor). This keeps the tree remarkably shallow—usually 3 or 4 levels deep—meaning it only takes 3-4 disk I/O operations to find any record among billions.

### B-Tree Structure

| Tree Level | Node Type | Disk Storage & Contents | Purpose & Routing |
|---|---|---|---|
| **Level 0 (Top)** | Root Node (e.g. `[50 \| 100]`) | 1 Page in Buffer Pool | Root entry point; routes search to left (`<50`), middle (`50-100`), or right (`>100`). |
| **Level 1** | Internal Nodes (e.g. `[25]`, `[75]`, `[150]`) | 8KB Pages | Pure navigation keys and child page pointers. No table data stored here. |
| **Level 2 (Bottom)** | Leaf Nodes (e.g. `[10]`, `[40]`, `[60]`, ...) | 8KB Pages linked via doubly-linked pointers (`prev` / `next`) | Contains actual row keys + physical pointers / clustered row payloads. |

**Key Properties of Production B+ Trees:**
- **Balanced Depth**: All leaf nodes reside at the exact same depth ($O(\log_B N)$).
- **High Fan-Out ($B \approx 100-500$)**: Fitting hundreds of keys per 8KB page keeps depth to only 3–4 levels even for billions of records.
- **Sequential Leaf Chains**: Leaf pages are linked horizontally, enabling $O(1)$ consecutive page reads during range scans (`BETWEEN`, `>`, `<`).

### B+ Tree vs B-Tree

**B+ Tree (used in most databases):**
- All data stored in leaf nodes
- Internal nodes only contain keys for navigation
- Leaf nodes linked together for range queries
- Better for disk I/O (larger fan-out)

**B-Tree:**
- Data stored in all nodes
- Smaller fan-out
- Deeper tree
- Less efficient for range queries

### Why B-Trees Dominate

While B-Trees provide $O(\log N)$ exact lookups, their true superpower is **Range Queries and Sorting**.

Because keys are stored in strictly sorted order, a query like `SELECT * FROM users WHERE age > 50` traverses the tree to find the node for `50`, and simply follows the linked list of leaf nodes horizontally, pulling only the relevant pages into memory.

### B-Tree Operations

**Insertion:**
```python
def insert(btree, key, value):
    # Find appropriate leaf node
    leaf = find_leaf(btree, key)

    # Insert key into leaf
    if leaf.has_space():
        leaf.insert(key, value)
    else:
        # Split leaf node
        split_leaf(leaf, key, value)

        # Propagate split up if necessary
        propagate_split(leaf.parent)
```

**Deletion:**
```python
def delete(btree, key):
    # Find leaf node containing key
    leaf = find_leaf(btree, key)

    # Remove key from leaf
    leaf.remove(key)

    # Rebalance if necessary
    if leaf.is_underflow():
        rebalance(leaf)
```

**Search:**
```python
def search(btree, key):
    node = btree.root

    while not node.is_leaf():
        # Find appropriate child
        child = find_child(node, key)
        node = child

    # Search in leaf node
    return leaf.find(key)
```

### Clustered vs Non-Clustered Indexes

**Clustered Index:**
- Data stored directly in leaf nodes
- Only one clustered index per table
- Usually on primary key
- Faster lookups (no extra I/O)

**Non-Clustered Index:**
- Leaf nodes contain pointers to data
- Multiple non-clustered indexes per table
- Extra I/O to fetch data
- More flexible

| Dimension | Clustered Index (e.g. MySQL InnoDB Primary Key) | Non-Clustered / Secondary Index (e.g. Postgres Heap B-Tree) |
|---|---|---|
| **Leaf Node Content** | Stores **complete row data** directly inside the B+ tree leaf page (`[10, data]`, `[20, data]`). | Stores **search key + tuple pointer** (`[10, TID/PK]`, `[20, TID/PK]`). |
| **Data Organization** | Table rows are physically ordered on disk by this key (max 1 clustered index per table). | Auxiliary index; physical table order remains independent (heap or primary key order). |
| **Disk I/O Cost** | **Single I/O**: Leaf page fetch immediately yields row columns. | **Double I/O**: Index leaf lookup requires secondary hop to fetch heap tuple data. |
| **Write Amplification** | Inserting out-of-order keys causes page splits and reorganization of complete row payloads. | Lightweight key inserts; only index leaf splits without moving physical heap rows. |

---


## Composite Indexes & Column Order

```sql
CREATE INDEX idx_user_date ON orders (user_id, created_at, status);
```

The **left-prefix rule**: the index is usable only if queries filter on columns from **left to right** without skipping.

| Query | Uses Index? |
|-------|-------------|
| `WHERE user_id = 1` | ✅ (leftmost) |
| `WHERE user_id = 1 AND created_at > '2024-01-01'` | ✅ |
| `WHERE user_id = 1 AND status = 'active'` | ✅ (user_id only, status skips) |
| `WHERE created_at > '2024-01-01'` | ❌ (skips user_id) |
| `WHERE status = 'active'` | ❌ |

**Rule of thumb:** Place **equality** columns first, **range** columns last, **high cardinality** columns first.

---


## Covering Index

A covering index includes **all columns** needed by a query — no heap (table) lookup required.

```sql
-- Query
SELECT user_id, total FROM orders WHERE status = 'pending';

-- Covering index
CREATE INDEX idx_covering ON orders (status, user_id, total);
-- status in WHERE, user_id + total in SELECT — all in index
```

MySQL EXPLAIN will show `Using index` (not `Using index condition`) for a true covering index.

---


## Hash Indexes: Fast but Inflexible

A Hash Index uses a standard hash map stored on disk. The search key is passed through a hash function to map directly to a bucket that contains the disk pointer.

### Hash Index Structure

| Hash Bucket Index | Stored Entry Pairs `[Key, Pointer]` | Collision Resolution Strategy | Complexity |
|---|---|---|---|
| **Bucket 0** | `[key1, ptr1]`, `[key2, ptr2]` | Chained linked list / overflow page | $O(1)$ avg, $O(K)$ worst |
| **Bucket 1** | `[key3, ptr3]` | Single entry (direct match) | $O(1)$ avg |
| **Bucket 2** | `[key4, ptr4]`, `[key5, ptr5]`, `[key6, ptr6]` | Multiple hash collision overflow list | $O(1)$ avg, $O(K)$ worst |
| **Bucket 3** | `[]` (Empty) | No entries mapped | $O(1)$ avg |

**Operational Characteristics:**
- **Point Lookups**: $O(1)$ average time complexity for exact equality (`WHERE id = 42`).
- **No Range Queries**: Cannot serve `BETWEEN`, `>`, `<`, or `ORDER BY` because hash buckets do not preserve ordering.
- **Used by**: Memory storage engine (MySQL MEMORY tables) and PostgreSQL Hash indexes (crash-safe since PG 10).

### Hash Index Operations

**Insertion:**
```python
def insert(hash_index, key, value):
    bucket = hash_function(key) % bucket_count
    hash_index[bucket].append((key, value))
```

**Search:**
```python
def search(hash_index, key):
    bucket = hash_function(key) % bucket_count
    for k, v in hash_index[bucket]:
        if k == key:
            return v
    return None
```

**Deletion:**
```python
def delete(hash_index, key):
    bucket = hash_function(key) % bucket_count
    for i, (k, v) in enumerate(hash_index[bucket]):
        if k == key:
            del hash_index[bucket][i]
            return
```

:::warning[Why are Hash Indexes rarely used in relational databases?]
Despite offering $O(1)$ lookups, Hash Indexes explicitly **destroy ordering**. If you use a Hash Index, queries like `WHERE age > 50` or `ORDER BY created_at` cannot utilize the index, resulting in a full table scan.
:::

**When to use them:** Hash indexes are relegated to in-memory key-value stores (like Redis or Memcached), where the primary access pattern is strictly direct-key lookup and disk I/O paging is irrelevant.

### Hash Index vs B-Tree

| Feature | Hash Index | B-Tree |
|---------|------------|--------|
| **Lookup Time** | O(1) average | O(log N) |
| **Range Queries** | Not supported | Supported |
| **Sorting** | Not supported | Supported |
| **Prefix Searches** | Not supported | Supported |
| **Memory Usage** | Higher | Lower |
| **Collision Handling** | Required | Not required |
| **Best For** | Exact lookups | General purpose |

---


## Geospatial Indexing: Solving Multi-Dimensional Data

B-trees natively index 1-dimensional data. They fail spectacularly when indexing 2-dimensional data (like Latitude and Longitude).

If you run a bounding box query (`WHERE lat BETWEEN 100 AND 400 AND long BETWEEN 20 AND 200`), a B-Tree forces the engine to fetch massive continuous strips of latitude pages, massive strips of longitude pages, and perform an extremely expensive set-intersection (merge) in memory.

To solve this, we use specialized algorithms that reduce 2D space into 1D space, or cluster data dynamically.

### The Problem with 2D Data

<GeospatialIndexingDiagram initialTab="hilbert" />

### 4.1 Geohashing (Z-Order Curves)

Geohashing recursively subdivides the map into four quadrants (`0, 1, 2, 3`), continuing downwards to increase precision.

* By appending the quadrant numbers (e.g., `3 -> 31 -> 310`), spatial proximity is converted into **string prefix proximity**.
* These strings are Base-32 encoded.
* **Implementation:** Once spatial data is converted to 1D strings, the database simply stores these strings inside a standard B-Tree. Finding nearby drivers in a radius becomes a simple string prefix match in the B-Tree. **Redis uses Geohashing natively.**

### Geohashing Example

<GeospatialIndexingDiagram initialTab="h3_hexagons" />

### Geohashing Implementation

```python
import base64

def geohash(latitude, longitude, precision=5):
    """Convert lat/long to geohash"""
    BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz"
    lat_range = [-90.0, 90.0]
    long_range = [-180.0, 180.0]
    geohash = []
    bits = 0
    bit = 0
    even = True

    while len(geohash) < precision:
        if even:
            mid = (long_range[0] + long_range[1]) / 2
            if longitude > mid:
                bits |= (1 << bit)
                long_range[0] = mid
            else:
                long_range[1] = mid
        else:
            mid = (lat_range[0] + lat_range[1]) / 2
            if latitude > mid:
                bits |= (1 << bit)
                lat_range[0] = mid
            else:
                lat_range[1] = mid

        even = not even
        bit += 1

        if bit == 5:
            geohash.append(BASE32[bits])
            bits = 0
            bit = 0

    return ''.join(geohash)

def nearby_geohashes(geohash):
    """Get nearby geohashes for radius search"""
    neighbors = []
    # Implementation depends on precision level
    # For precision 5, check 8 surrounding cells
    return neighbors
```

### 4.2 Quad Trees

Quad trees split the world recursively similar to Geohashes, but they map the space to a tree structure and utilize a density constant `k`. A grid is only subdivided into four smaller grids if the number of items inside it exceeds `k`. This ensures memory is not wasted on empty oceanic spaces and depth is focused on high-density areas (like Manhattan).

### Quad Tree Structure

| Quad Tree Quadrant | Bounding Coordinates Range | Contained Points Density | Adaptive Subdivision Policy |
|---|---|---|---|
| **NW (North-West)** | `[x_min..x_mid, y_mid..y_max]` | Low (4 points) | Below capacity threshold $k$: kept as leaf node. |
| **NE (North-East)** | `[x_mid..x_max, y_mid..y_max]` | High (15 points) | Exceeds $k$: recursively split into 4 child quadrants. |
| **SW (South-West)** | `[x_min..x_mid, y_min..y_mid]` | Sparse (2 points) | Below capacity threshold $k$: kept as leaf node. |
| **SE (South-East)** | `[x_mid..x_max, y_min..y_mid]` | Very High (45 points) | Exceeds $k$: recursively split into deep hierarchy. |

**Key Advantage:** Memory is never wasted subdividing empty oceans or deserts; tree depth automatically concentrates in dense metropolitan regions.

### Quad Tree Implementation

```python
class QuadTreeNode:
    def __init__(self, bounds, capacity=4):
        self.bounds = bounds  # (x1, y1, x2, y2)
        self.capacity = capacity
        self.points = []
        self.children = None

    def insert(self, point):
        if not self.contains(point):
            return False

        if len(self.points) < self.capacity or self.children is None:
            self.points.append(point)
            return True

        if self.children is None:
            self.subdivide()

        return any(child.insert(point) for child in self.children)

    def subdivide(self):
        x1, y1, x2, y2 = self.bounds
        mid_x = (x1 + x2) / 2
        mid_y = (y1 + y2) / 2

        self.children = [
            QuadTreeNode((x1, y1, mid_x, mid_y), self.capacity),
            QuadTreeNode((mid_x, y1, x2, mid_y), self.capacity),
            QuadTreeNode((x1, mid_y, mid_x, y2), self.capacity),
            QuadTreeNode((mid_x, mid_y, x2, y2), self.capacity)
        ]

    def query(self, bounds):
        results = []
        if not self.intersects(bounds):
            return results

        for point in self.points:
            if self.point_in_rect(point, bounds):
                results.append(point)

        if self.children:
            for child in self.children:
                results.extend(child.query(bounds))

        return results
```

### 4.3 R-Trees (Region Trees)

R-trees (predecessors derived from Quad Trees) represent the modern standard for disk-based geospatial indexes. Instead of rigidly dividing the map into quadrants, R-Trees dynamically cluster objects into overlapping **Minimum Bounding Rectangles (MBRs)**.

* **Implementation:** When searching for a point, the engine traverses down intersecting bounding boxes. This is the underlying algorithm powering **PostGIS** (the spatial extension for PostgreSQL).

### R-Tree Structure

| MBR Hierarchy Level | Bounding Box Identifier | Bounding Coordinates $(x_1, y_1, x_2, y_2)$ | Spatial Clustering Strategy |
|---|---|---|---|
| **Root MBR** | Global Map Bounding Box | `[0.0, 0.0, 100.0, 100.0]` | Outer bounding box enclosing all child nodes. |
| **Child Node MBR A** | Commercial District | `[10.0, 20.0, 35.0, 45.0]` | Encloses 6 dense points; overlaps slightly with MBR B. |
| **Child Node MBR B** | Harbor & Port Zone | `[30.0, 18.0, 55.0, 40.0]` | Dynamically expanded to minimize bounding box area penalty. |
| **Child Node MBR C** | Residential Suburb | `[5.0, 5.0, 25.0, 18.0]` | Clustered based on minimum bounding rectangle growth algorithm. |
| **Child Node MBR D** | Industrial Hub | `[28.0, 2.0, 50.0, 16.0]` | Contains warehouse locations with balanced leaf fan-out. |

**Key Advantage:** Unlike rigid grid quadrant partitions, R-Trees support arbitrary polygon geometries, multi-dimensional shapes, and dynamic rebalancing, making them the standard engine in **PostGIS** and spatial RDBMS.

### R-Tree Implementation

```python
class RTreeNode:
    def __init__(self, is_leaf=False, capacity=4):
        self.is_leaf = is_leaf
        self.capacity = capacity
        self.children = []
        self.mbr = None  # Minimum Bounding Rectangle

    def insert(self, item):
        if self.is_leaf:
            self.children.append(item)
            self.update_mbr()
            return True

        # Find best child to insert
        best_child = self.find_best_child(item)
        if best_child.insert(item):
            self.update_mbr()
            return True

        # Split if necessary
        if len(self.children) >= self.capacity:
            self.split()

        return False

    def find_best_child(self, item):
        # Find child with minimum MBR enlargement
        best_child = None
        min_enlargement = float('inf')

        for child in self.children:
            enlargement = self.calculate_enlargement(child.mbr, item.mbr)
            if enlargement < min_enlargement:
                min_enlargement = enlargement
                best_child = child

        return best_child

    def query(self, bounds):
        results = []
        if not self.intersects(bounds):
            return results

        if self.is_leaf:
            for item in self.children:
                if self.intersects(item.mbr, bounds):
                    results.append(item)
        else:
            for child in self.children:
                results.extend(child.query(bounds))

        return results
```

---


## Inverted Indexes: Full-Text Search

If you need to query partial string matches (e.g., `WHERE business_name LIKE '%pizza%'`), a B-Tree is rendered useless. Because B-trees are sorted lexicographically, they can optimize prefix searches (`'pizza%'`) but wildcard suffix searches force a Full Table Scan.

**The Solution:** The Inverted Index.
Instead of mapping a Row ID to a string, an Inverted Index tokenizes text into discrete words and maps each word to a list of Document IDs.

| Token      | Posting List (Document IDs/Pointers) |
| :--------- | :----------------------------------- |
| `fast`     | `[doc1, doc2]`                       |
| `reliable` | `[doc1]`                             |
| `range`    | `[doc3]`                             |

When a user searches for "fast", the engine simply looks up the token `fast` in a hash map or B-Tree, retrieves the pointers `[doc1, doc2]`, and pulls those specific disk pages into RAM.

**Implementation:** This architecture is the core engine behind full-text search technologies like **Elasticsearch**, Lucene, and PostgreSQL's `tsvector`/`tsquery`.

### Inverted Index Structure

| Analyzed Token (Term) | Term Frequency ($TF$) | Inverted Posting List `[DocID, Positions]` |
|---|---|---|
| `"a"` | 1 | `[Doc 2: pos 1]` |
| `"brown"` | 2 | `[Doc 1: pos 3]`, `[Doc 2: pos 3]` |
| `"dog"` | 2 | `[Doc 1: pos 9]`, `[Doc 3: pos 3]` |
| `"fast"` | 1 | `[Doc 2: pos 2]` |
| `"fox"` | 2 | `[Doc 1: pos 4]`, `[Doc 2: pos 4]` |
| `"jumps"` | 1 | `[Doc 1: pos 5]` |
| `"lazy"` | 2 | `[Doc 1: pos 8]`, `[Doc 3: pos 2]` |
| `"over"` | 1 | `[Doc 1: pos 6]` |
| `"quick"` | 1 | `[Doc 1: pos 2]` |
| `"quickly"` | 1 | `[Doc 2: pos 6]` |
| `"runs"` | 1 | `[Doc 2: pos 5]` |
| `"sleeps"` | 1 | `[Doc 3: pos 4]` |
| `"the"` | 3 | `[Doc 1: pos 1, 7]`, `[Doc 3: pos 1]` |

**Query Resolution (`"brown fox"`):**
1. Look up term `"brown"` ➔ `[Doc 1, Doc 2]`
2. Look up term `"fox"` ➔ `[Doc 1, Doc 2]`
3. Fast two-pointer list intersection ($O(M+N)$) ➔ **Match: `[Doc 1, Doc 2]`**.

### Inverted Index Implementation

```python
import re
from collections import defaultdict

class InvertedIndex:
    def __init__(self):
        self.index = defaultdict(list)
        self.documents = {}

    def add_document(self, doc_id, text):
        self.documents[doc_id] = text
        tokens = self.tokenize(text)

        for token in tokens:
            if doc_id not in self.index[token]:
                self.index[token].append(doc_id)

    def tokenize(self, text):
        # Simple tokenization
        text = text.lower()
        tokens = re.findall(r'\b\w+\b', text)
        return tokens

    def search(self, query):
        query_tokens = self.tokenize(query)

        if not query_tokens:
            return []

        # Get posting lists for all tokens
        posting_lists = [self.index.get(token, []) for token in query_tokens]

        # Intersect posting lists
        result = set(posting_lists[0])
        for posting_list in posting_lists[1:]:
            result.intersection_update(posting_list)

        return list(result)

    def search_with_ranking(self, query):
        query_tokens = self.tokenize(query)
        scores = defaultdict(int)

        for token in query_tokens:
            for doc_id in self.index.get(token, []):
                scores[doc_id] += 1

        # Sort by score
        return sorted(scores.items(), key=lambda x: x[1], reverse=True)
```

### Advanced Features

**Stemming:**
```python
from nltk.stem import PorterStemmer

class InvertedIndexWithStemming(InvertedIndex):
    def __init__(self):
        super().__init__()
        self.stemmer = PorterStemmer()

    def tokenize(self, text):
        tokens = super().tokenize(text)
        # Apply stemming
        return [self.stemmer.stem(token) for token in tokens]
```

**Stop Words:**
```python
class InvertedIndexWithStopWords(InvertedIndex):
    STOP_WORDS = {'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to'}

    def tokenize(self, text):
        tokens = super().tokenize(text)
        # Remove stop words
        return [token for token in tokens if token not in self.STOP_WORDS]
```

**Phrase Search:**
```python
def phrase_search(index, phrase):
    tokens = index.tokenize(phrase)
    if len(tokens) < 2:
        return index.search(phrase)

    # Get documents containing all tokens
    candidate_docs = set(index.index.get(tokens[0], []))
    for token in tokens[1:]:
        candidate_docs.intersection_update(index.index.get(token, []))

    # Check phrase proximity
    results = []
    for doc_id in candidate_docs:
        text = index.documents[doc_id]
        if phrase in text.lower():
            results.append(doc_id)

    return results
```

---


## Analyzing Queries with EXPLAIN

<DatabaseIndexScanTypesDiagram />

```sql
EXPLAIN SELECT * FROM orders WHERE user_id = 5 AND status = 'pending';
```

### Key EXPLAIN fields (MySQL)

| Field | Look For |
|-------|----------|
| `type` | `const` > `eq_ref` > `ref` > `range` > `index` > `ALL` (worst) |
| `key` | Which index was chosen (NULL = no index) |
| `rows` | Estimated rows scanned |
| `Extra` | `Using index` (good), `Using filesort` (bad), `Using temporary` (bad) |

```sql
EXPLAIN ANALYZE SELECT ...;  -- PostgreSQL: actual execution stats
```

### PostgreSQL EXPLAIN example
```
Seq Scan on orders  (cost=0.00..4320.00 rows=85000 width=50)
  Filter: (status = 'pending')
→ Bad: full scan. Add index on status.

Index Scan using idx_status on orders  (cost=0.43..8.45 rows=1 width=50)
  Index Cond: (status = 'pending')
→ Good: index used.
```

---


## Common Query Optimization Techniques

### 1. Avoid functions on indexed columns
```sql
-- ❌ Bad: index on created_at not used
WHERE YEAR(created_at) = 2024

-- ✅ Good: range on indexed column
WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'
```

### 2. Avoid implicit type conversion
```sql
-- ❌ Bad: user_id is INT but compared to VARCHAR
WHERE user_id = '42'

-- ✅ Good
WHERE user_id = 42
```

### 3. Use EXISTS instead of IN for subqueries
```sql
-- ❌ Potentially slow for large subquery
SELECT * FROM users WHERE id IN (SELECT user_id FROM orders WHERE total > 100);

-- ✅ Better: stops at first match
SELECT * FROM users u WHERE EXISTS (
    SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.total > 100
);
```

### 4. Pagination: avoid OFFSET on large tables
```sql
-- ❌ Bad: scans and discards 100,000 rows
SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 100000;

-- ✅ Good: keyset pagination
SELECT * FROM orders WHERE id > 100000 ORDER BY id LIMIT 20;
```

### 5. SELECT only needed columns
```sql
-- ❌ Bad: fetches all columns, forcing heap reads
SELECT * FROM users;

-- ✅ Good: allows index-only covering scans
SELECT id, email FROM users WHERE active = true;
```

### 6. Prefer UNION ALL over UNION
```sql
-- ❌ Bad: UNION forces sort/hash deduplication & temp disk spill
SELECT id, email, 'TIER1' FROM active_users
UNION
SELECT id, email, 'TIER2' FROM partner_users;

-- ✅ Good: UNION ALL streams results with O(1) memory
SELECT id, email, 'TIER1' FROM active_users
UNION ALL
SELECT id, email, 'TIER2' FROM partner_users;
```

### 7. Avoid DISTINCT to fix 1:N JOIN duplicates (Use EXISTS)
```sql
-- ❌ Bad: DISTINCT hashes 250,000 inflated rows to collapse duplicates
SELECT DISTINCT c.id, c.name FROM customers c
JOIN orders o ON o.customer_id = c.id WHERE o.total > 500;

-- ✅ Good: Semi-join stops on first match without row multiplication
SELECT c.id, c.name FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id AND o.total > 500);
```

### 8. Structure with CTEs instead of correlated scalar subqueries
```sql
-- ❌ Bad: Correlated subquery in SELECT executes once per outer row (N+1 query loops)
SELECT e.id, e.name, (SELECT COUNT(*) FROM tasks t WHERE t.emp_id = e.id) FROM employees e;

-- ✅ Good: CTE aggregates once in a single scan and joins via Hash Join
WITH task_counts AS (
    SELECT emp_id, COUNT(*) AS total_tasks FROM tasks GROUP BY emp_id
)
SELECT e.id, e.name, COALESCE(tc.total_tasks, 0)
FROM employees e
LEFT JOIN task_counts tc ON tc.emp_id = e.id;
```

### 9. Deploy Summary Tables & Materialized Views for OLAP Aggregations
For large-scale analytical rollups scanning tens of millions of rows, hardware I/O limits prevent instant response times regardless of indexes. Pre-aggregate data into Materialized Views (`REFRESH MATERIALIZED VIEW CONCURRENTLY`) or background summary tables.

> 🚀 **Deep Dive**: For full execution plans, engine-specific diagnostic commands, and interactive plan simulations, see **[The 7 Rules for High-Performance SQL in Performance & Monitoring](./performance-monitoring.md#the-7-rules-for-writing-high-performance-sql--slow-query-tuning)**.

---


## Index Selectivity & Cardinality

**Cardinality** = number of distinct values in a column.

- High cardinality (e.g. `email`, `user_id`) → indexes very effective
- Low cardinality (e.g. `status` with 3 values, `boolean`) → indexes often **not used** by optimizer (full scan cheaper)

```sql
-- Check cardinality in MySQL
SELECT COUNT(DISTINCT status) / COUNT(*) AS selectivity FROM orders;
-- > 0.01 = low selectivity, index may not help
```

---


## Index Maintenance

```sql
-- MySQL: analyze table statistics
ANALYZE TABLE orders;

-- PostgreSQL: rebuild bloated index
REINDEX INDEX idx_orders_status;

-- Find unused indexes (PostgreSQL)
SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;

-- Find missing indexes (MySQL slow query log + pt-query-digest)
```

---


## Spring / JPA Notes

```java
// Add indexes via JPA annotations
@Entity
@Table(name = "orders", indexes = {
    @Index(name = "idx_user_status", columnList = "user_id, status"),
    @Index(name = "idx_created_at",  columnList = "created_at")
})
public class Order { ... }

// Enable SQL logging to spot bad queries

## How Database Indexes Work Internally

### Index Storage

**On-Disk Storage:**
| On-Disk Component | Allocated Size | Internal Layout & Contents | Engine Purpose |
|---|---|---|---|
| **Index Header Page** | 8 KB Page | Root page pointer, tree depth, index metadata | Entry point for index scan navigation. |
| **Internal B-Tree Pages** | 8 KB Pages | Delimiter key values + child Page pointers | Navigational routing across tree levels. |
| **Leaf B-Tree Pages** | 8 KB Pages | Indexed key values + physical row pointers (`ctid` / PK) | Final search tier linked via horizontal pointers. |
| **Page Header** | 96 Bytes | Page ID, page type, free space lower/upper offsets | Consistency checking and WAL recovery. |
| **Index Line Pointers** | 4 Bytes / entry | Byte offsets into page payload | In-page binary search table. |
| **Free Space Hole** | Dynamic | Unallocated contiguous bytes between pointers & data | Absorbs in-page insertions before triggering page split. |

### Index Creation Process

```sql
-- Create index
CREATE INDEX idx_users_email ON users(email);

-- What happens internally:
-- 1. Scan entire table
-- 2. Extract email values and row IDs
-- 3. Sort by email
-- 4. Build B-Tree structure
-- 5. Write to disk
```

**Internal Process:**
```python
def create_index(table, column):
    # Step 1: Scan table
    rows = scan_table(table)

    # Step 2: Extract key-value pairs
    key_values = [(row[column], row.id) for row in rows]

    # Step 3: Sort by key
    key_values.sort(key=lambda x: x[0])

    # Step 4: Build B-Tree
    btree = BTree()
    for key, row_id in key_values:
        btree.insert(key, row_id)

    # Step 5: Write to disk
    write_to_disk(btree)

    return btree
```

### Index Maintenance

**Insert Operation:**
```python
def insert_with_index(table, row):
    # Insert into table
    table.insert(row)

    # Update all indexes
    for index in table.indexes:
        key = row[index.column]
        index.insert(key, row.id)
```

**Update Operation:**
```python
def update_with_index(table, row_id, new_values):
    # Get old row
    old_row = table.get(row_id)

    # Update table
    table.update(row_id, new_values)

    # Update indexes
    for index in table.indexes:
        old_key = old_row[index.column]
        new_key = new_values[index.column]

        if old_key != new_key:
            index.delete(old_key, row_id)
            index.insert(new_key, row_id)
```

**Delete Operation:**
```python
def delete_with_index(table, row_id):
    # Get row
    row = table.get(row_id)

    # Delete from table
    table.delete(row_id)

    # Update indexes
    for index in table.indexes:
        key = row[index.column]
        index.delete(key, row_id)
```

### Index Statistics

**Statistics Collection:**
```python
class IndexStatistics:
    def __init__(self, index):
        self.index = index
        self.stats = {}

    def collect_statistics(self):
        # Number of distinct values
        self.stats['distinct_values'] = self.count_distinct()

        # Null values
        self.stats['null_values'] = self.count_nulls()

        # Average key length
        self.stats['avg_key_length'] = self.avg_key_length()

        # Index depth
        self.stats['depth'] = self.index.depth()

        # Page count
        self.stats['page_count'] = self.index.page_count()

        return self.stats

    def count_distinct(self):
        # Count distinct values in index
        distinct = set()
        for key in self.index.keys():
            distinct.add(key)
        return len(distinct)

    def count_nulls(self):
        # Count null values
        null_count = 0
        for key in self.index.keys():
            if key is None:
                null_count += 1
        return null_count
```

### Query Optimization

**Query Planner:**
```python
class QueryPlanner:
    def __init__(self, database):
        self.database = database

    def plan_query(self, query):
        # Parse query
        parsed = self.parse_query(query)

        # Identify usable indexes
        usable_indexes = self.find_usable_indexes(parsed)

        # Estimate costs
        costs = self.estimate_costs(parsed, usable_indexes)

        # Choose best plan
        best_plan = min(costs, key=lambda x: x['cost'])

        return best_plan

    def find_usable_indexes(self, query):
        usable_indexes = []

        for table in query.tables:
            for index in table.indexes:
                if self.can_use_index(query, index):
                    usable_indexes.append(index)

        return usable_indexes

    def can_use_index(self, query, index):
        # Check if index can be used for WHERE clause
        for condition in query.where_conditions:
            if condition.column == index.column:
                if condition.operator in ['=', '>', '<', '>=', '<=']:
                    return True

        # Check if index can be used for ORDER BY
        if query.order_by.column == index.column:
            return True

        return False

    def estimate_costs(self, query, indexes):
        costs = []

        # Full table scan cost
        full_scan_cost = self.estimate_full_scan_cost(query)
        costs.append({
            'plan': 'full_scan',
            'cost': full_scan_cost
        })

        # Index scan costs
        for index in indexes:
            index_cost = self.estimate_index_cost(query, index)
            costs.append({
                'plan': f'index_scan_{index.name}',
                'cost': index_cost
            })

        return costs
```

---


## Real-World Implementations

### PostgreSQL Indexes

**B-Tree Index:**
```sql
-- Create B-Tree index (default)
CREATE INDEX idx_users_email ON users(email);

-- Create unique index
CREATE UNIQUE INDEX idx_users_username ON users(username);

-- Create composite index
CREATE INDEX idx_users_name_age ON users(last_name, first_name, age);

-- Create partial index
CREATE INDEX idx_active_users ON users(email) WHERE is_active = true;

-- Create expression index
CREATE INDEX idx_users_lower_email ON users(LOWER(email));
```

**Hash Index:**
```sql
-- Create hash index (only for equality)
CREATE INDEX idx_users_id_hash ON users USING HASH(id);

-- Note: Hash indexes are not WAL-logged and not replicated
```

**GIN Index (Generalized Inverted Index):**
```sql
-- Create GIN index for array columns
CREATE INDEX idx_users_tags ON users USING GIN(tags);

-- Create GIN index for full-text search
CREATE INDEX idx_documents_content ON documents USING GIN(to_tsvector('english', content));

-- Full-text search query
SELECT * FROM documents
WHERE to_tsvector('english', content) @@ to_tsquery('english', 'fast');
```

**GiST Index (Generalized Search Tree):**
```sql
-- Create GiST index for geometric data
CREATE INDEX idx_locations_point ON locations USING GIST(point);

-- Create GiST index for full-text search
CREATE INDEX idx_documents_content_gist ON documents USING GIST(to_tsvector('english', content));

-- Range queries
SELECT * FROM locations
WHERE point <@ box '((0,0),(10,10))';
```

**BRIN Index (Block Range Index):**
```sql
-- Create BRIN index for large tables
CREATE INDEX idx_orders_created_at ON orders USING BRIN(created_at);

-- BRIN is very space-efficient but less precise
-- Good for time-series data
```

*Deep-dive guide & interactive simulator:* [PostgreSQL BRIN Index (Block Range Index): 99% Smaller Than B-Tree](./postgresql-brin-index-guide.md).

### MySQL Indexes

**B-Tree Index:**
```sql
-- Create B-Tree index (default in InnoDB)
CREATE INDEX idx_users_email ON users(email);

-- Create unique index
CREATE UNIQUE INDEX idx_users_username ON users(username);

-- Create composite index
CREATE INDEX idx_users_name_age ON users(last_name, first_name, age);

-- Create full-text index
CREATE FULLTEXT INDEX idx_articles_content ON articles(content);
```

**Hash Index (Memory Engine):**
```sql
-- Hash indexes only available in Memory engine
CREATE TABLE users (
    id INT PRIMARY KEY,
    email VARCHAR(255),
    INDEX (email) USING HASH
) ENGINE=Memory;
```

### MongoDB Indexes

**Single Field Index:**
```javascript
// Create single field index
db.users.createIndex({ email: 1 });

// Create unique index
db.users.createIndex({ username: 1 }, { unique: true });

// Create sparse index
db.users.createIndex({ email: 1 }, { sparse: true });
```

**Compound Index:**
```javascript
// Create compound index
db.users.createIndex({ lastName: 1, firstName: 1, age: -1 });

// Note: Order matters for queries
```

**Text Index:**
```javascript
// Create text index
db.articles.createIndex({ content: "text", title: "text" });

// Text search
db.articles.find({ $text: { $search: "fast reliable" } });
```

**Geospatial Index:**
```javascript
// Create 2dsphere index
db.locations.createIndex({ location: "2dsphere" });

// Geospatial query
db.locations.find({
    location: {
        $near: {
            $geometry: { type: "Point", coordinates: [-73.9667, 40.78] },
            $maxDistance: 1000
        }
    }
});
```

**Hash Index:**
```javascript
// Create hash index (sharding key)
db.users.createIndex({ _id: "hashed" });
```

### Redis Indexes

**Sorted Sets (ZSET):**
```bash

## Integration Patterns

### Pattern 1: Covering Index

Create an index that includes all columns needed for a query.

```sql
-- Query
SELECT id, name, email FROM users WHERE age > 30;

-- Covering index
CREATE INDEX idx_users_age_name_email ON users(age, name, email);

-- Benefits:
-- - No need to access table data
-- - All data available in index
-- - Faster query execution
```

### Pattern 2: Composite Index

Create an index on multiple columns for complex queries.

```sql
-- Query
SELECT * FROM orders
WHERE user_id = 123
AND status = 'completed'
AND created_at > '2024-01-01';

-- Composite index
CREATE INDEX idx_orders_user_status_date
ON orders(user_id, status, created_at);

-- Note: Column order matters!
-- Most selective column first
```

### Pattern 3: Partial Index

Create an index for a subset of data.

```sql
-- Query
SELECT * FROM users WHERE is_active = true AND email LIKE '%@gmail.com';

-- Partial index
CREATE INDEX idx_active_gmail_users
ON users(email)
WHERE is_active = true AND email LIKE '%@gmail.com';

-- Benefits:
-- - Smaller index size
-- - Faster maintenance
-- - Better query performance
```

### Pattern 4: Expression Index

Create an index on computed expressions.

```sql
-- Query
SELECT * FROM users WHERE LOWER(email) = 'user@example.com';

-- Expression index
CREATE INDEX idx_users_lower_email ON users(LOWER(email));

-- Benefits:
-- - Index on computed values
-- - Case-insensitive searches
```

### Pattern 5: Functional Index

Create an index on function results.

```sql
-- Query
SELECT * FROM products WHERE price * quantity > 1000;

-- Functional index (PostgreSQL)
CREATE INDEX idx_products_total ON products((price * quantity));

-- Benefits:
-- - Index on computed values
-- - Faster complex queries
```

---


## Pros and Cons

### B-Tree Indexes

**Pros:**
✅ **Versatile:** Supports exact match, range, and sort operations
✅ **Efficient:** O(log N) lookup time
✅ **Balanced:** Consistent performance regardless of data distribution
✅ **Widely Supported:** Available in most databases
✅ **Predictable:** Stable performance characteristics

**Cons:**
❌ **Size:** Can be 20-30% of table size
❌ **Write Overhead:** Slows down INSERT/UPDATE/DELETE operations
❌ **Memory:** Requires memory for caching
❌ **Maintenance:** Needs periodic rebuilding

### Hash Indexes

**Pros:**
✅ **Fast:** O(1) average lookup time
✅ **Simple:** Easy to implement
✅ **Memory Efficient:** Smaller than B-Tree for exact lookups

**Cons:**
❌ **Limited:** Only supports equality operations
❌ **No Range:** Cannot support range queries
❌ **No Sorting:** Cannot support ORDER BY
❌ **Collisions:** Need collision handling

### Geospatial Indexes

**Pros:**
✅ **Spatial:** Efficient for location-based queries
✅ **Radius:** Supports radius searches
✅ **Bounding Box:** Supports bounding box queries

**Cons:**
❌ **Complex:** More complex to implement
❌ **Size:** Can be large for dense data
❌ **Precision:** Trade-off between precision and performance

### Inverted Indexes

**Pros:**
✅ **Full-Text:** Efficient for text search
✅ **Flexible:** Supports various search operations
✅ **Ranking:** Can support relevance ranking

**Cons:**
❌ **Size:** Can be very large
❌ **Maintenance:** Complex to maintain
❌ **Updates:** Expensive to update

---


## 📋 System Design Cheatsheet: Choosing the Right Index

In a system design interview, your choice of index explicitly dictates the performance of your system. Use this decision matrix:

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

## 🎯 Best Practices

1. **Index Strategically:** Only create indexes for frequently queried columns
2. **Monitor Usage:** Track index usage and remove unused indexes
3. **Consider Write Overhead:** Balance read performance with write performance
4. **Use Covering Indexes:** Include all needed columns in the index
5. **Maintain Indexes:** Regularly rebuild or reorganize fragmented indexes
6. **Test Thoroughly:** Test index performance with realistic data volumes
7. **Document Decisions:** Maintain architecture decision records for index choices
8. **Plan for Growth:** Design indexes that scale with data growth
9. **Use Partial Indexes:** Index only the data you need
10. **Monitor Statistics:** Keep index statistics up to date for query optimization

---


## Interview Questions

### Database & Query Execution Questions


**Q1. What is a B-Tree index and how does it work?**
> A B-Tree is a self-balancing tree where each node holds multiple keys and pointers to child nodes. Searches traverse from root to leaf in O(log n). In B+ Trees (used in practice), only leaf nodes hold data pointers and leaves are linked for efficient range scans.

**Q2. What is a covering index?**
> An index that includes all columns required by a query (in WHERE, SELECT, ORDER BY), so the DB can answer the query entirely from the index without reading the actual table row. Results in `Using index` in MySQL EXPLAIN.

**Q3. Explain the left-prefix rule for composite indexes.**
> A composite index on `(a, b, c)` is only useful if the query's WHERE clause includes `a`, then optionally `b`, then optionally `c` — without skipping. A query filtering on `b` alone won't use the index.

**Q4. When would you NOT add an index?**
> - Low-cardinality columns (boolean, enum with few values)
> - Tables with heavy write loads where index maintenance cost outweighs read gains
> - Very small tables where a full scan is cheaper than index traversal
> - Columns never used in WHERE, JOIN, or ORDER BY

**Q5. What does `Using filesort` mean in EXPLAIN and how do you fix it?**
> The DB cannot use an index to satisfy the ORDER BY and must sort results in memory or on disk. Fix by creating an index that matches the ORDER BY clause (and its sort direction), potentially as part of a composite index with WHERE columns.

**Q6. What is the difference between a clustered and non-clustered index?**
> A **clustered index** determines the physical order of data on disk — the table IS the index (InnoDB uses the PK as clustered). There can be only one. A **non-clustered index** is a separate structure with pointers back to the heap rows. Secondary indexes in InnoDB store the PK value (not a direct pointer) to look up the row.

**Q7. How do you find slow queries in MySQL/PostgreSQL?**
> - MySQL: Enable `slow_query_log`, set `long_query_time`; analyze with `pt-query-digest`
> - PostgreSQL: `pg_stat_statements` extension for query stats; `auto_explain` for plans
> - Both: `EXPLAIN ANALYZE` to see actual vs. estimated row counts

**Q8. What is index bloat and how do you handle it?**
> Over time, updates/deletes leave dead index entries ("bloat"). In PostgreSQL, run `VACUUM` (autovacuum handles this) or `REINDEX`. In MySQL, `OPTIMIZE TABLE` rebuilds the table and indexes. Bloat increases index size and slows scans.

---


### System Design & Architectural Index Questions


### Beginner Level

**Q1: What is a database index?**
A: A database index is a data structure that improves the speed of data retrieval operations on a database table at the cost of additional writes and storage space. Indexes are used to quickly locate data without having to search every row in a database table.

**Q2: Why do we need indexes?**
A: Indexes are needed to improve query performance. Without indexes, the database must perform a full table scan to find data, which is slow for large tables. Indexes allow the database to find data quickly using logarithmic or constant time lookups.

**Q3: What is a B-Tree index?**
A: A B-Tree index is a balanced tree data structure that keeps data sorted and allows searches, sequential access, insertions, and deletions in logarithmic time. It's the most common type of index used in databases.

**Q4: What is the difference between clustered and non-clustered indexes?**
A: A clustered index determines the physical order of data in a table. There can be only one clustered index per table. A non-clustered index is a separate structure that contains a pointer to the actual data. There can be multiple non-clustered indexes per table.

**Q5: What is a composite index?**
A: A composite index is an index on multiple columns. It can improve performance for queries that filter on multiple columns. The order of columns in a composite index matters for query optimization.

### Intermediate Level

**Q6: How does a B-Tree index work?**
A: A B-Tree index works by storing keys in a balanced tree structure. Each node contains multiple keys and pointers to child nodes. The tree is balanced, meaning all leaf nodes are at the same depth. To find a key, the database traverses the tree from the root to the appropriate leaf node.

**Q7: What is a hash index and when would you use it?**
A: A hash index uses a hash function to map keys to buckets. It provides O(1) average lookup time but only supports equality operations. Hash indexes are useful for exact lookups where range queries are not needed.

**Q8: What is a covering index?**
A: A covering index is an index that contains all the columns needed for a query. When a query can be satisfied entirely from the index, the database doesn't need to access the table data, which improves performance.

**Q9: How do indexes affect write performance?**
A: Indexes slow down write operations because the database must update the index structures for every INSERT, UPDATE, and DELETE operation. The more indexes a table has, the slower the write performance.

**Q10: What is a partial index?**
A: A partial index is an index created on a subset of table rows that satisfy a predicate condition. Partial indexes are smaller and faster to maintain than full indexes, and they're useful for queries that only need to index a subset of data.

### Advanced Level

**Q11: Explain how geospatial indexing works.**
A: Geospatial indexing uses specialized data structures like R-Trees, Quad Trees, or Geohashing to index multi-dimensional spatial data. These structures reduce 2D space to 1D space or cluster data dynamically to efficiently answer spatial queries like radius searches and bounding box queries.

**Q12: What is an inverted index and how is it used for full-text search?**
A: An inverted index maps words to document IDs. For each word in a document, the index stores a list of documents containing that word. When searching for a phrase, the database looks up each word in the index and intersects the posting lists to find documents containing all the words.

**Q13: How does the query optimizer choose which index to use?**
A: The query optimizer uses statistics about the data distribution and index characteristics to estimate the cost of different query plans. It considers factors like selectivity, index depth, and I/O costs to choose the most efficient plan.

**Q14: What is index fragmentation and how do you fix it?**
A: Index fragmentation occurs when index pages become disorganized due to insertions, updates, and deletions. Fragmentation can be fixed by rebuilding or reorganizing indexes, which reorganizes the index pages to improve performance.

**Q15: How do you design indexes for a read-heavy vs. write-heavy workload?**
A: For read-heavy workloads, create more indexes to optimize query performance. For write-heavy workloads, minimize indexes to reduce write overhead. Use covering indexes to avoid table lookups, and consider partial indexes for frequently queried subsets of data.

### Senior Level

**Q16: Design an indexing strategy for a social media platform.**
A: Implement a combination of indexes: B-Tree indexes for user profiles and relationships, inverted indexes for content search, geospatial indexes for location-based features, and time-series indexes for activity feeds. Use covering indexes for common queries and partial indexes for active users.

**Q17: How do you handle index maintenance in a distributed database?**
A: Implement distributed index maintenance with consistent hashing for index distribution, use gossip protocols for index synchronization, implement version vectors for conflict resolution, and use background processes for index rebuilding and optimization.

**Q18: How do you optimize indexes for high-throughput systems?**
A: Use memory-optimized indexes, implement index partitioning, use covering indexes to avoid table lookups, implement index caching strategies, use read replicas for read-heavy workloads, and implement index pre-warming for critical queries.

**Q19: How do you monitor and tune index performance?**
A: Monitor index usage statistics, track query performance metrics, analyze index fragmentation, monitor index size growth, track index maintenance overhead, and implement automated index tuning based on workload patterns.

**Q20: How do you design indexes for multi-tenant applications?**
A: Implement tenant-specific indexes, use partial indexes with tenant filters, implement index partitioning by tenant, use composite indexes with tenant ID, and implement index isolation strategies to prevent cross-tenant index contention.

---


## Senior Deep Dive: Advanced Topics: Advanced Topics

### Topic 1: Index Partitioning

**Horizontal Partitioning:**
```sql
-- Partition index by range
CREATE INDEX idx_orders_date
ON orders(created_at)
PARTITION BY RANGE (created_at);

-- Partition index by hash
CREATE INDEX idx_users_id
ON users(id)
PARTITION BY HASH(id) PARTITIONS 16;
```

**Vertical Partitioning:**
```sql
-- Split index across multiple tables
CREATE TABLE users_hot (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(255),
    INDEX idx_email (email)
);

CREATE TABLE users_cold (
    id INT PRIMARY KEY,
    bio TEXT,
    preferences JSON
);
```

### Topic 2: Index Compression

**Prefix Compression:**
```python
class CompressedBTree:
    def __init__(self):
        self.nodes = []

    def compress_keys(self, keys):
        compressed = []
        prev_key = ""

        for key in keys:
            # Find common prefix
            common_prefix = 0
            while (common_prefix < len(prev_key) and
                   common_prefix < len(key) and
                   prev_key[common_prefix] == key[common_prefix]):
                common_prefix += 1

            # Store prefix length and suffix
            compressed.append((common_prefix, key[common_prefix:]))
            prev_key = key

        return compressed

    def decompress_keys(self, compressed):
        keys = []
        prev_key = ""

        for prefix_len, suffix in compressed:
            key = prev_key[:prefix_len] + suffix
            keys.append(key)
            prev_key = key

        return keys
```

### Topic 3: Index Caching

**Buffer Pool Management:**
```python
class IndexBufferPool:
    def __init__(self, size):
        self.size = size
        self.cache = {}
        self.lru = []

    def get_page(self, page_id):
        if page_id in self.cache:
            # Update LRU
            self.lru.remove(page_id)
            self.lru.append(page_id)
            return self.cache[page_id]

        # Load from disk
        page = self.load_from_disk(page_id)

        # Evict if necessary
        if len(self.cache) >= self.size:
            evicted = self.lru.pop(0)
            del self.cache[evicted]

        # Add to cache
        self.cache[page_id] = page
        self.lru.append(page_id)

        return page

    def load_from_disk(self, page_id):
        # Load page from disk
        return disk.read(page_id)
```

### Topic 4: Index Statistics

**Histogram Statistics:**
```python
class IndexStatistics:
    def __init__(self, index):
        self.index = index
        self.histogram = {}

    def collect_histogram(self, buckets=100):
        # Collect value distribution
        values = self.index.get_all_values()

        # Create histogram
        min_val = min(values)
        max_val = max(values)
        bucket_size = (max_val - min_val) / buckets

        for value in values:
            bucket = int((value - min_val) / bucket_size)
            self.histogram[bucket] = self.histogram.get(bucket, 0) + 1

        return self.histogram

    def estimate_selectivity(self, min_val, max_val):
        # Estimate selectivity for range query
        total = sum(self.histogram.values())
        matching = 0

        for bucket, count in self.histogram.items():
            bucket_min = self.get_bucket_min(bucket)
            bucket_max = self.get_bucket_max(bucket)

            if bucket_min >= min_val and bucket_max <= max_val:
                matching += count
            elif bucket_min < max_val and bucket_max > min_val:
                # Partial match
                matching += count * self.get_overlap_ratio(
                    bucket_min, bucket_max, min_val, max_val
                )

        return matching / total
```

### Topic 5: Index Rebuilding

**Online Index Rebuilding:**
```python
class OnlineIndexRebuilder:
    def __init__(self, database):
        self.database = database

    def rebuild_index(self, table, index_name):
        # Create new index
        new_index = self.create_new_index(table, index_name)

        # Copy data from old index
        self.copy_index_data(table, index_name, new_index)

        # Switch indexes atomically
        self.switch_indexes(table, index_name, new_index)

        # Drop old index
        self.drop_old_index(table, index_name)

    def create_new_index(self, table, index_name):
        # Get index definition
        definition = self.get_index_definition(table, index_name)

        # Create new index with temporary name
        temp_name = f"{index_name}_temp"
        self.create_index(table, temp_name, definition)

        return temp_name

    def copy_index_data(self, table, old_index, new_index):
        # Copy data in batches
        batch_size = 1000
        offset = 0

        while True:
            batch = self.get_index_batch(table, old_index, offset, batch_size)

            if not batch:
                break

            # Insert into new index
            for item in batch:
                self.insert_into_index(table, new_index, item)

            offset += batch_size

    def switch_indexes(self, table, old_index, new_index):
        # Atomically switch indexes
        with self.database.transaction():
            self.database.execute(f"""
                ALTER TABLE {table}
                DROP INDEX {old_index}
            """)

            self.database.execute(f"""
                ALTER TABLE {table}
                RENAME INDEX {new_index} TO {old_index}
            """)
```

---


## Advanced Editorial Pass: Index Strategy as Cost Engineering

### Senior Engineering Focus
- Optimize indexes for dominant access patterns, not generic completeness.
- Balance read acceleration against write amplification and storage cost.
- Pair index lifecycle with evolving workload behavior.

### Failure Modes to Anticipate
- Index bloat and duplication from uncontrolled additions.
- False confidence from small-data benchmarks.
- Over-indexing that degrades ingest and update throughput.

### Practical Heuristics
1. Maintain an index inventory with owner and purpose.
2. Re-evaluate index utility periodically using query telemetry.
3. Test index changes with both read and write workloads.

### Compare Next
- [Query Planner & Optimizer](./query-planner-optimizer.md)
- [Performance & Monitoring](./performance-monitoring.md)
- [Advanced SQL](./advanced-sql.md)
