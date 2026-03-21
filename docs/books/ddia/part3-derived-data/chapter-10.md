---
id: chapter-10
title: "Chapter 10: Batch Processing"
sidebar_label: "Ch 10 — Batch Processing"
sidebar_position: 1
---

# Chapter 10: Batch Processing

## The Big Idea

So far the book has focused on systems that handle requests as they arrive (OLTP) or read/write in real-time. But some of the most important data processing happens **offline, in bulk** — batch processing. This chapter explores batch processing systems, culminating in the MapReduce model and the dataflow systems that succeeded it.

Three types of systems by response time:

| Type | Response Time | Examples |
|---|---|---|
| **Services (online)** | Milliseconds | Web services, databases |
| **Batch processing (offline)** | Minutes to hours | MapReduce jobs, ETL pipelines |
| **Stream processing (near-real-time)** | Seconds | Flink, Kafka Streams |

---

## 🗂️ Batch Processing with Unix Tools

The Unix philosophy provides surprisingly powerful batch processing primitives. Consider counting the 5 most visited URLs from a web server log:

```bash
cat /var/log/nginx/access.log |
  awk '{print $7}' |          # extract URL field
  sort |                       # sort alphabetically
  uniq -c |                    # count occurrences
  sort -r -n |                 # sort by count (descending)
  head -n 5                    # top 5
```

This processes gigabytes of data in seconds on a single machine. The Unix philosophy makes this work:

1. **Each program does one thing well**
2. **Programs communicate via text streams (stdin/stdout)**
3. **Programs are composable** — the output of one is the input of the next
4. **Immutable inputs** — each tool reads from its input without modifying it

The `|` operator connects programs via **in-memory buffers**, not files. The OS schedules them to run concurrently — this is a form of stream processing!

### The Uniform Interface

The reason Unix pipes work: every program reads from stdin and writes to stdout, using the same format (newline-delimited text). This **uniform interface** is what enables composition.

The equivalent in databases: SQL is the uniform interface that lets you combine tables, views, and queries.

---

## 🗺️ MapReduce and Distributed Filesystems

When data doesn't fit on one machine, you need distributed batch processing. **MapReduce** (Google, 2004) is the foundational model.

### HDFS (Hadoop Distributed File System)

Built on commodity hardware. Large files are split into **blocks** (typically 128 MB), replicated across multiple machines for fault tolerance.

Unlike network-attached storage (NAS), HDFS co-locates computation with storage — **bring the computation to the data**, not the data to the computation. This avoids network bottlenecks.

### MapReduce Job Execution

A MapReduce job has two phases:

**Map phase:** Run a mapper function on each input record. Output key-value pairs.

```
Input:  "2016-05-01 GET /api/users 200"
Output: ("/api/users", 1)
```

**Reduce phase:** Group all values by key, then run a reducer function on each group.

```
Input:  [("/api/users", [1, 1, 1, 1, ...]), ("/api/posts", [1, 1, ...])]
Output: [("/api/users", 4821), ("/api/posts", 312)]
```

**The shuffle:** Between map and reduce, the framework:
1. Sorts all mapper outputs by key
2. Sends all values for the same key to the same reducer
3. Merges sorted output files from multiple mappers

This is the most expensive part (network transfer + disk I/O).

### Distributed Grep (Word Count Example)

```python
# Mapper
def map(line):
    for word in line.split():
        emit(word, 1)

# Reducer
def reduce(word, counts):
    emit(word, sum(counts))
```

Every MapReduce tutorial starts with word count. But real-world jobs chain many MapReduce steps (job chains).

---

## 🔗 MapReduce Workflows

Real pipelines chain multiple MapReduce jobs. The output of job 1 is the input of job 2.

Tools like **Pig** (scripting language for Pig Latin → MapReduce) and **Hive** (SQL → MapReduce) made this more ergonomic, but the underlying model was the same.

### Joins in MapReduce

Joins are tricky in MapReduce. Two approaches:

**Sort-Merge Join:**
- Mapper outputs `(key, {tag: "user", data: ...})` or `(key, {tag: "event", data: ...})`
- Reducer receives all data for one key from both datasets
- Reducer joins matching records

**Broadcast Hash Join:**
- One dataset is small enough to fit in memory
- Load the small dataset into a hash map on each mapper
- For each record in the large dataset, look up in the hash map
- No reduce phase needed → much faster

**Partitioned Hash Join (Bucketed Map Join):**
- Both datasets partitioned by the same key
- Each mapper only needs to load its partition's small-dataset shard

### Handling Skew

**Hot keys** (e.g., a celebrity user ID that appears in millions of records) cause one reducer to get all the work — the **straggler** problem.

Solutions:
- Sample hot keys first; replicate small dataset for those keys
- Split the hot key reducer into multiple reducers with random suffixes

---

## 🔄 Beyond MapReduce: Dataflow Engines

MapReduce has significant overhead:
- Every step writes to HDFS (fault tolerance via materialization)
- Many jobs re-read data written by the previous job
- The sort/shuffle in every step is expensive even when unnecessary

**Dataflow engines** (Spark, Tez, Flink) improve on this:

- Model the entire job as one **DAG (Directed Acyclic Graph)** of operators
- Data flows between operators **in memory** (no HDFS between steps)
- Only materialize to disk when the operator graph requires it (e.g., sorting for a join)
- Fault tolerance via **re-computation** from a checkpoint, not by materializing everything

```
MapReduce workflow:
  read HDFS → Map → write HDFS → read HDFS → Reduce → write HDFS

Spark DAG:
  read HDFS → Map → Reduce → write HDFS
               ↑
           in-memory pipeline, no intermediate writes
```

**Result:** Spark jobs are typically 10-100x faster than equivalent MapReduce jobs for iterative algorithms (machine learning) and multi-step pipelines.

---

## 📊 High-Level Batch APIs

Modern batch frameworks support SQL-like operations natively:

- **Apache Spark SQL / DataFrames** — SQL on distributed datasets
- **Apache Flink** — unified batch and stream processing
- **Apache Beam** — portable API that runs on Spark, Flink, or Google Dataflow

These frameworks can optimize queries across the entire dataflow graph (predicate pushdown, join reordering, column pruning) — similar to a query optimizer in a relational database.

---

## 🏗️ The Output of Batch Jobs

What does a batch job produce?

- **Reports/aggregations** → write to a database, data warehouse
- **Search indexes** → Lucene index files (bulk-loaded into Elasticsearch)
- **Machine learning models** → trained model files
- **Key-value stores** → pre-computed results for fast serving (e.g., recommendations)

**Building databases in batch jobs:** Instead of writing records one by one, build an SSTable/sorted file offline and **bulk-load** it into the serving layer. This is orders of magnitude faster than individual inserts and doesn't impact production.

---

## Summary

Batch processing draws a clean line between:

```
Input data (immutable, read-only)
         ↓
Transformation (pure functions, no side effects)
         ↓
Output data (new datasets)
```

This functional approach — treating data as immutable and transformations as pure — is what makes batch jobs **easy to reason about, retry, and debug**. The same data can be reprocessed as requirements change (you keep the raw data forever, regenerate derived views).

The Unix philosophy, MapReduce, and modern dataflow engines all share this same insight: **separate the logic from the execution**, and make reprocessing cheap.
