---
id: elasticsearch-senior-deep-dive
title: "Elasticsearch Senior Deep Dive: Performance & Scaling"
sidebar_label: Senior Deep Dive
description: Senior-level guide to Elasticsearch cluster engineering — covering memory management, the 32GB JVM heap boundary, Zen2 discovery, write/search optimization, and ILM.
tags: [elasticsearch, system-design, jvm, heap-tuning, clustering, scaling, performance-optimization, indexing-speed]
---

import ElasticsearchIlmPipelineDiagram from '@site/src/components/ElasticsearchIlmPipelineDiagram';

# Elasticsearch Senior Deep Dive: Performance & Scaling

Operating an Elasticsearch cluster at scale (terabytes of data, thousands of requests per second) requires careful management of JVM internals, cluster coordination mechanisms, and caching hierarchies. This guide addresses the design patterns and configuration details necessary for senior engineers.

---

## JVM Heap & Memory Allocation Heuristics

Elasticsearch runs on the Java Virtual Machine. Correct memory sizing is the most critical factor for cluster stability.

| Memory Tier (e.g. 64 GB Host) | Allocated RAM | Primary Responsibilities & Internal Storage | Critical Operational Guideline |
|---|---|---|---|
| **JVM Heap (`-Xmx`)** | **31 GB** | Object allocations, query parsing, aggregation coordinator merges, fielddata, circuit breakers | **Do not exceed 32GB threshold** to preserve Compressed Ordinary Object Pointers (Compressed OOPs). |
| **OS Page Cache** | **33 GB** | Caches raw Lucene segment files, inverted index posting lists, and doc values directly in RAM | **Never starve OS page cache**; Lucene searches run in microseconds when reading cached segment pages. |

### 1. The 50% RAM Rule
**Never allocate more than 50% of physical RAM to the JVM heap.**
Lucene segments are immutable files written to disk. When a search is executed, Lucene reads these segments directly. If segment files are cached in the **OS Page Cache** (RAM), searches run in microseconds. If they must be read from SSD/HDD, latency spikes.
*   **Rule**: Leave at least 50% of Node RAM free for the OS Page Cache.

### 2. The 32GB Compressed OOPs Boundary
**Never set the heap size above the threshold for Compressed Ordinary Object Pointers (Compressed OOPs).**
*   On 64-bit systems, JVM object references are 8 bytes long. This increases memory footprint and cache pollution.
*   To optimize, the HotSpot JVM uses Compressed OOPs (a 32-bit reference offset). This allows references to address up to 32GB of heap.
*   The exact boundary where Compressed OOPs are disabled varies depending on the JVM and OS, but is typically around **30.5 GB to 31.8 GB**.
*   **Anti-Pattern**: Setting heap to 32GB (`-Xmx32g`) drops Compressed OOPs, converting references to 64-bit. A node configured with `-Xmx32g` actually has *less* usable object space than a node configured with `-Xmx31g`.
*   **Senior Action**: Verify Compressed OOPs are enabled in your JVM logs on startup:
    ```bash
    java -XX:+PrintFlagsFinal -version | grep UseCompressedOops
    ```
    Configure your heap using:
    ```yaml
    # /etc/elasticsearch/jvm.options.d/heap.options
    -Xms31g
    -Xmx31g
    ```

### 3. Disabling Swap (Memory Pinning)
If the OS swaps JVM heap pages to disk, garbage collection cycles that scan the heap will trigger major page faults, freezing the node for tens of seconds.
*   **System Action**: Disable swap globally, or set `bootstrap.memory_lock: true` in `elasticsearch.yml`. This instructs the JVM to pin its address space using the `mlockall` system call.

---

## Cluster Membership & Split-Brain Mitigation

In older versions of Elasticsearch (pre-7.0), Zen Discovery relied on `discovery.zen.minimum_master_nodes` to prevent **split-brain** scenarios (where a network partition cuts a cluster in half, and both halves elect a Master, leading to diverged indexes).
*   The math was simple: `minimum_master_nodes = (N/2) + 1` (quorum).

### Modern Zen2 Cluster Coordination (7.x & 8.x+)
Modern Elasticsearch uses a custom consensus algorithm based on Raft:
*   **Cluster State Updates**: Only the elected Master can update the cluster state. It publishes updates to the cluster. A state change is only committed once a quorum of master-eligible nodes acknowledges it.
*   **Voting Configurations**: The cluster automatically maintains a *voting configuration* (a subset of master-eligible nodes). During partition events, the cluster dynamically adjusts this set to ensure quorum voting remains safe.
*   **Voting-Only Nodes**: In three-zone setups, you can deploy two active master nodes (one in Zone A, one in Zone B) and a voting-only node in Zone C (acting as a tie-breaker). This saves hardware cost while maintaining zone resiliency.

---

## Horizontal Scaling Mechanics: Shards & Nodes

Elasticsearch is designed to scale out horizontally by distributing compute and storage across a dynamic set of nodes.

### 1. Scaling Out Storage and CPU (Shard Allocation)
*   **Indices to Shards**: A logical index is split into multiple physical primary shards.
*   **Shard Rebalancing**: When you add a new node to the cluster, the Master node detects the new node and automatically re-allocates a subset of primary and replica shards from existing overloaded nodes to the new node. This redistributes both disk utilization and search CPU workload across the cluster.
*   **Disk Watermarks**: Nodes monitor disk utilization. If a node reaches the *low disk watermark* (default 85%), Elasticsearch stops allocating new shards to it. If it reaches the *high disk watermark* (default 90%), it actively moves shards off that node.

### 2. Scaling Write Throughput vs. Read Throughput
*   **Scaling Writes (Ingestion)**:
    *   Since every write is routed to a single primary shard determined by `hash(routing) % primary_shards`, you scale ingestion by increasing the **primary shard count** and spreading these primary shards across separate physical data nodes. This parallelizes CPU indexing cycles.
    *   *Constraint*: Primary shard count is immutable after index creation. Plan primary shard counts ahead of time based on expected data volumes.
*   **Scaling Reads (Queries)**:
    *   Since a search query can be executed on either a primary shard or any of its replicas, you scale search throughput by adding **replica shards** (`number_of_replicas`).
    *   If you have a 3-shard index with 2 replicas, you have 9 shards total (3 primary, 6 replicas) distributed across nodes. This triples the number of execution units available to serve search queries.
    *   *Advantage*: Replica shard counts are dynamically mutable at runtime. You can scale replicas up during peak query events and down afterward.

### 3. The Scatter-Gather Bottleneck at Scale
As a cluster grows to dozens of nodes and hundreds of shards, the scatter-gather search mechanism faces a scalability bottleneck:
*   **The Cost**: A query sent to an index with 50 shards must be sent to 50 shards. The coordinating node must compile and sort 50 separate priority queues in memory. This causes high CPU usage on the coordinating node and high GC overhead.
*   **The Solution**: Use **Custom Routing** (e.g., `routing=tenant_id`). When you index and query documents using a routing key, the coordinating node calculates the exact target shard ID and executes the search query *on that single shard copy only*. The scatter-gather phase is completely bypassed, allowing the cluster to scale search throughput linearly as nodes are added.

---

## Write Optimization Strategies (High Ingestion)

If your primary use case is log ingestion or telemetry collection, configure Elasticsearch to prioritize write throughput over near-real-time search availability:

### 1. Adjust the Refresh Interval
The default refresh interval is 1 second, meaning Lucene writes memory buffers to segments every second. This creates hundreds of tiny segments, forcing Lucene to merge them constantly (segment merging is highly CPU/IO intensive).
*   **Action**: Increase the refresh interval to 30 seconds or more for write-heavy logging indices:
    ```json
    PUT /my-index/_settings
    {
      "index.refresh_interval": "30s"
    }
    ```
    During mass migrations or initial index loads, turn off refresh completely:
    ```json
    PUT /my-index/_settings
    {
      "index.refresh_interval": "-1"
    }
    ```
    Re-enable it and force a merge once the migration completes.

### 2. Leverage the Bulk API
Never index documents one by one. Single indexing incurs separate HTTP connection overhead and thread scheduling latency.
*   **Heuristic**: Group documents into bulk batches. The optimal bulk size depends on document complexity and network bandwidth, but a general starting target is **5MB to 15MB per bulk request** (or 1,000 to 5,000 documents).

### 3. Manage the Index Buffer Size
Increase the memory allocated to buffer indexed documents before they are written to segments.
*   **Action**: Set `indices.memory.index_buffer_size` in `elasticsearch.yml`. The default is `10%` of the total heap. For dedicated write nodes, increase this to `20%` (leaving less room for search cache, which is appropriate for pure ingest nodes).

---

## Index Lifecycle Management (ILM)

Storing data indefinitely on expensive, high-IO data nodes is cost-prohibitive. Index Lifecycle Management automates moving index segments across different hardware tiers as the data ages.

<ElasticsearchIlmPipelineDiagram />

1.  **Hot Phase**:
    *   Index is actively receiving writes and is searched frequently.
    *   Hardware: High-performance NVMe SSDs, fast CPUs.
2.  **Warm Phase**:
    *   Index is no longer receiving writes (read-only), but is still queried regularly.
    *   Action: Segments are shrunk (`_shrink` API reduces primary shard count) and merged into a single segment (`_forcemerge`) to optimize search execution.
    *   Hardware: Balanced SATA SSDs or HDDs.
3.  **Cold Phase**:
    *   Index is read-only and queried rarely.
    *   Action: Indices can be frozen or backed up as searchable snapshots.
    *   Hardware: Cheap, high-capacity mechanical drives or object storage (S3/GCS).
4.  **Delete Phase**:
    *   Index is permanently deleted to reclaim storage.

### Data Streams vs. Index Aliases
For time-series logging, use **Data Streams**.
*   A data stream acts as a single named entry point for writing and reading. Under the hood, it consists of multiple hidden auto-generated indices.
*   As an index reaches a size limit (e.g., 50GB) or time limit (e.g., 7 days), the data stream automatically performs a **Rollover**, creating a new active index for writes while moving the old index down the ILM pipeline.

---

## Search & Filtering Optimization Strategies

Executing low-latency queries requires proper query structure, index mappings, and utilization of Elasticsearch's caching hierarchies.

### 1. Optimize Filter Execution via Boolean Structure
Always structure your queries to separate scoring search from strict filter conditions:
- **Rule**: Place non-scoring conditions (statuses, dates, category IDs) inside the `filter` block of a `bool` query. This allows Lucene to skip BM25 scoring and cache results using Node Query Cache bitsets.
- **Example**:
  ```json
  GET /orders/_search
  {
    "query": {
      "bool": {
        "must": [
          { "match": { "item_name": "leather jacket" } }
        ],
        "filter": [
          { "term": { "status": "COMPLETED" } },
          { "range": { "created_at": { "gte": "now-30d" } } }
        ]
      }
    }
  }
  ```

### 2. Avoid Wildcard Prefix Queries
Queries that start with a wildcard (e.g., `{"wildcard": {"user_email": "*@gmail.com"}}`) force Elasticsearch to scan the entire Term Index (FST).
- **Rule**: Avoid leading wildcards. If prefix-based matching is required, use the `edge_ngram` tokenizer at index time to split strings into prefixes (e.g., `"john"` → `"j"`, `"jo"`, `"joh"`, `"john"`) and perform standard term matching.

### 3. Implement Custom Routing
To avoid querying every shard in the index, use custom routing on both index and search requests:
- **Heuristic**: Append `routing` parameter (e.g., `routing=tenant_id` or `routing=user_id`). This routes the write/read request to a single specific shard, eliminating the coordinating node's need to scatter queries to all shards and merge massive heaps.

### 4. Segment Force Merging
As segments age, the background segment-merge process can take time.
- **Action**: For indices that are no longer active (e.g., completed daily log indices), execute a force merge down to a single segment:
  ```bash
  POST /springboot-logs-2026.06.07/_forcemerge?max_num_segments=1
  ```
  This reduces file descriptor lookups and removes deleted documents, resulting in a 10–30% speedup for historical searches.

---

## Troubleshooting & Diagnostics Playbook

When an Elasticsearch cluster behaves erratically, use these command sequences to identify the bottleneck.

### 1. Diagnosing Cluster Health & Thread Pools
Check cluster health and find out which nodes are under resource pressure:
```bash
# Get overall cluster health status (Green, Yellow, Red)
curl -X GET "http://localhost:9200/_cluster/health?pretty"

# List all nodes, CPU usage, heap usage, and roles
curl -X GET "http://localhost:9200/_cat/nodes?v&h=ip,port,name,role,cpu,heap.percent,ram.percent"

# Check if thread pools are rejecting tasks (search or write)
curl -X GET "http://localhost:9200/_cat/thread_pool?v&h=node_name,name,active,queue,rejected"
```
*   **Interpretation**: If the `rejected` count in the `write` pool is rising, your data nodes cannot keep up with write throughput. Implement backpressure or increase bulk sizes.

### 2. Profiling Slow Queries
If a specific search query is running slowly, append `"profile": true` to the search payload:
```json
POST /my-index/_search
{
  "profile": true,
  "query": {
    "match": {
      "message": "connection exception"
    }
  }
}
```
*   **Interpretation**: The response contains a detailed breakdown showing exactly which Lucene classes (e.g., `TermQuery`, `BooleanQuery`) took the most time to run on each shard. Use this to determine if you need to optimize search queries or add index mappings.

### 3. Locating Shard Allocation Failures
If cluster health is **Red** or **Yellow**, some shards are unassigned. Find out why:
```bash
# List all unassigned shards and the reasons for their state
curl -X GET "http://localhost:9200/_cat/shards?h=index,shard,prirep,state,unassigned.reason" | grep UNASSIGNED

# Explain the allocation decision for a specific unassigned shard
curl -X POST "http://localhost:9200/_cluster/allocation/explain?pretty" -H 'Content-Type: application/json' -d'
{
  "index": "springboot-logs-2026.06.07",
  "shard": 0,
  "primary": true
}'
```
*   **Interpretation**: The `allocation/explain` API provides a detailed reason (e.g., disk watermark exceeded, node attribute routing mismatch, too many shards on node) explaining why the cluster cannot assign the shard.
