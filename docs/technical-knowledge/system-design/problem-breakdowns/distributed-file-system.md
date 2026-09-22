---
id: distributed-file-system
title: "Design a Distributed File System (GFS / HDFS)"
sidebar_label: "34. Distributed File System"
description: "Staff-level breakdown of large-scale distributed append-only file systems handling petabytes across commodity hardware based on the Google File System (GFS) and Apache HDFS architectures."
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design a Distributed File System (GFS / HDFS)

A distributed file system provides a scalable, fault-tolerant namespace for storing multi-terabyte to petabyte files across thousands of unreliable commodity servers. Pioneered by Google File System (GFS) and open-sourced as Apache Hadoop HDFS, this architecture is optimized for batch-processing workloads (MapReduce, Spark) characterized by **large sequential reads and append-heavy writes**, rather than random in-place updates.

---

## 1. Understanding the Problem

### Functional Requirements
1. **File Operations**: Support standard hierarchical namespace operations (`mkdir`, `create`, `delete`, `open`, `read`, `append`).
2. **Atomic Record Append**: Multiple concurrent clients must be able to append records to the same file simultaneously with atomic "at-least-once" guarantees.
3. **Large Chunk Streaming**: High-throughput sequential data streaming for multi-gigabyte files.
4. **Master Metadata Operations**: Rapid metadata lookups, namespace renames, and permission checks.

### Non-Functional Requirements
- **High Throughput over Low Latency**: Optimized for streaming throughput (multi-GB/s sustained) rather than sub-millisecond random seeks.
- **Fault Tolerance on Commodity Hardware**: Component failures (disks, servers, switches) are treated as daily norms, not exceptions.
- **Rack-Aware High Availability**: Data must survive total rack power loss or top-of-rack (ToR) switch failures.
- **Scalability**: Capable of storing **100+ Petabytes** across 5,000+ storage nodes.

### Capacity Estimations & Sizing (5 Years)
- **Total Storage Capacity**: 100 Petabytes ($100 \times 10^{15}\text{ bytes}$).
- **Replication Factor**: $3\text{x}$ replication $\implies \mathbf{300\text{ PB}}$ raw disk storage.
- **Chunk / Block Size**: 64 MB (or 128 MB).
- **Total Chunk Count**:
  $$\text{Chunks} = \frac{100\text{ PB}}{64\text{ MB}} = \frac{100 \times 10^{15}}{67.1 \times 10^6} \approx \mathbf{1.5\text{ Billion Chunks}}$$
- **Master Node RAM Sizing**:
  - The Master maintains all metadata in RAM for speed.
  - Metadata per chunk: `chunk_handle` (8 bytes) + `version` (8 bytes) + `length` (4 bytes) + `locations` (3 $\times$ 8 bytes = 24 bytes) $\approx$ **64 bytes**.
  - $1.5\text{ Billion chunks} \times 64\text{ bytes} \approx \mathbf{96\text{ GB RAM}}$.
  - Adding file namespace trees, directory nodes, and block maps: A single high-spec server with **256 GB to 512 GB RAM** easily holds the entire metadata state in memory!

---

## 2. The Set Up

### Defining Core Entities

```
┌────────────────────────────────────────────────────────┐
│                    MASTER_METADATA                     │
├──────────────────┬──────────────┬──────────────────────┤
│ file_path        │ VARCHAR(1024)│ PRIMARY KEY          │
│ file_size        │ BIGINT       │ Total Bytes          │
│ replication_level│ INT          │ Default: 3           │
│ chunk_handles    │ ARRAY[INT64] │ Ordered chunk list   │
│ created_at       │ TIMESTAMP    │ File creation time   │
│ permissions      │ INT          │ POSIX style bitmask  │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                     CHUNK_METADATA                     │
├──────────────────┬──────────────┬──────────────────────┤
│ chunk_handle     │ INT64        │ Globally Unique ID   │
│ chunk_version    │ INT64        │ Incremented on lease │
│ primary_node_id  │ UUID         │ Active lease holder  │
│ lease_expires_at │ TIMESTAMP    │ 60s lease timeout    │
│ replica_locations│ ARRAY[UUID]  │ Active Chunkservers  │
│ checksum_array   │ ARRAY[INT32] │ 32-bit CRC per 64KB  │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API Design

#### 1. Open File & Fetch Chunk Locations
```http
POST /api/v1/files/open
Content-Type: application/json

{
  "file_path": "/analytics/logs/2026-09-22.csv",
  "offset": 134217728  // 128 MB into file
}
```
**Response (`200 OK`)**:
```json
{
  "chunk_handle": 948102948123,
  "chunk_index": 2,
  "primary_chunkserver": {
    "host": "10.0.4.12",
    "port": 9000,
    "rack": "rack-us-west-1a"
  },
  "replica_chunkservers": [
    {"host": "10.0.4.15", "port": 9000, "rack": "rack-us-west-1a"},
    {"host": "10.0.8.22", "port": 9000, "rack": "rack-us-west-1b"}
  ]
}
```

#### 2. Chunkserver Append Data Stream
```
Client ──► Primary Chunkserver:
Command: APPEND_RECORD(chunk_handle: 948102948123, data_bytes: [...])
Response: { status: "SUCCESS", offset: 14210080, bytes_written: 65536 }
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="distributed-storage" title="Distributed File System (GFS / HDFS) Architecture & Replication Pipeline" />

### Walkthrough of Core Flows

#### 1. The Pipelined Write / Record Append Path
1. The **Client** contacts the **Master** asking for the chunk handle and replica locations for the last chunk of the target file.
2. The Master checks if a valid **lease** exists. If not, it assigns a 60-second lease to one Chunkserver (making it the **Primary**) and increments the chunk version number.
3. The Master returns the identities of the Primary and Secondary replicas to the client. The client caches this metadata.
4. **Data Pipelining (Decoupled from Control Flow)**:
   - The client pushes raw data blocks to the **closest Chunkserver** in network topology distance.
   - That Chunkserver buffers the data in memory and pipelines it immediately to the second Chunkserver, which forwards it to the third.
   - Data flows down the chain via linear TCP socket pipelining, saturating full full-duplex network bandwidth.
5. **Mutation Execution**:
   - Once all replicas have buffered the data, the client sends an `EXECUTE_APPEND` command to the Primary.
   - The Primary assigns a sequential byte offset to the record.
   - The Primary writes the record to its local chunk file on disk.
   - The Primary instructs all Secondaries to write the record at the exact same offset.
6. Once all Secondaries confirm successful disk writes, the Primary replies to the client.

#### 2. The Chunk Read Path
1. The client translates the byte offset into a chunk index: $\text{chunk\_index} = \lfloor \text{offset} / 64\text{ MB} \rfloor$.
2. The client asks the Master for the locations of `(file_path, chunk_index)`.
3. The Master returns the chunk handle and replica IP addresses.
4. The client **caches** this chunk location locally and contacts the closest Chunkserver directly.
5. The Chunkserver reads data sequentially from its local filesystem (`ext4`/`XFS`), validates 32-bit CRC checksums for each 64 KB block, and streams bytes to the client.
6. **Zero Master Bottleneck**: The Master is completely bypassed during actual file byte transmission!

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Why 64 MB (or 128 MB) Chunks?
Why not use standard OS 4 KB filesystem blocks?

| Metric | Small Blocks (4 KB - 64 KB) | Large Chunks (64 MB - 128 MB) |
|---|---|---|
| **Master Metadata Size** | Storing 100 PB in 4 KB blocks requires 25 Trillion metadata entries $\implies$ **1.6 PB RAM** on Master (impossible). | Storing 100 PB in 64 MB chunks requires 1.5 Billion entries $\implies$ **96 GB RAM** (fits easily in single server memory). |
| **Network Overhead** | Thousands of client-to-master handshakes per file transfer. | Client performs a single master query for 64 MB of streaming data. |
| **Sequential Disk Throughput** | Random disk head seeks degrade rotational HDD and SSD throughput. | Large sequential reads maximize disk controller DMA throughput ($200\text{ MB/s}$ on HDD, $3+\text{ GB/s}$ on NVMe). |
| **Internal Fragmentation** | Low waste on small files. | Severe waste if storing millions of small 2 KB files. |

**The Small File Trap**: Storing millions of small files ($< 1\text{ MB}$) is the Achilles' heel of GFS/HDFS. It causes catastrophic master memory exhaustion while leaving chunk storage capacity mostly empty. Small files must be packed into Archive files (`HAR` or sequence files) before ingestion.

### Deep Dive 2: Single Master In-Memory Metadata, WAL & Checkpoints
How does the single Master survive power failures without losing the filesystem namespace?

```
┌────────────────────────────────────────────────────────┐
│               MASTER PERSISTENCE ARCHITECTURE          │
├────────────────────────────────────────────────────────┤
│                                                        │
│   Client Mutation ──► Append to Operation Log (WAL)    │
│                             │ synchronous fsync        │
│                             ▼                          │
│                       Disk / NVMe                      │
│                             │                          │
│   Update In-Memory Data ◄───┘                          │
│   Structures (B-Tree)                                  │
│                             ▲                          │
│                             │                          │
│   Periodic B-Tree Snapshot ─┴─► Checkpoint File        │
│   (Compacted Image)                                    │
│                                                        │
└────────────────────────────────────────────────────────┘
```
1. **The Operation Log (WAL)**: Contains an immutable, append-only history of namespace mutations (renames, file creations). Every metadata change is synchronously flushed (`fsync`) to disk before returning success to the client.
2. **Compact Checkpoints**: When the log exceeds a size threshold (e.g. 1 GB), a background thread creates a point-in-time image (checkpoint) of the in-memory metadata B-Tree and flushes it to disk. On crash recovery, the master loads the latest checkpoint in seconds and replays only the trailing log entries.
3. **Standby Master (ZooKeeper / Raft Failover)**: A Standby NameNode continuously tails the edit log via shared journal nodes. If the Active Master's ZooKeeper ephemeral lock expires, the Standby is automatically fenced and promoted to Active in $< 30$ seconds.

### Deep Dive 3: Atomic Record Append & At-Least-Once Semantics
When multiple clients append concurrently to the same file (e.g. distributed log aggregators), how does the system guarantee consistency without distributed locking?
- **Primary-Driven Offsetting**: The Primary Chunkserver determines the write offset. Secondaries are forbidden from picking offsets independently.
- **Handling Chunk Boundaries**: If a record append exceeds the 64 MB chunk boundary, the Primary pads the remainder of the chunk with empty bytes, instructs replicas to pad, and returns `CHUNK_FULL` to the client. The client then requests a new chunk from the Master.
- **Failure Retry & Duplicate Padding**: If a write fails on one of the secondaries, the client retries the append. Because the primary assigns a new offset on retry, the previous failed attempt may leave a duplicate or fragmented gap on surviving replicas. Therefore, GFS/HDFS guarantees **at-least-once** append semantics, requiring consumers to embed unique sequence IDs for deduplication.

### Deep Dive 4: Rack-Aware Replica Placement Policy
How does the Master place 3 replicas to balance fault tolerance against network cross-switch bandwidth?

```
Datacenter Fabric
      │
┌─────┴──────────────────┐
▼                        ▼
Rack 1 (Switch A)        Rack 2 (Switch B)
├── Chunkserver 1 (Replica 1)   └── Chunkserver 3 (Replica 3)
└── Chunkserver 2 (Replica 2)
```
- **HDFS / GFS Rack Placement Rule**:
  - **Replica 1**: Placed on the local node or on a random node within the local rack.
  - **Replica 2**: Placed on a **different node in the same rack** (fast intra-rack replication over top-of-rack switch).
  - **Replica 3**: Placed on an **entirely different rack** across the datacenter (survives complete rack power or switch failure).
- **Why not 3 different racks?** Placing replicas across 3 separate racks would double the cross-rack bisection bandwidth consumption without providing meaningful reliability gains over the 2-in-rack + 1-cross-rack policy.

---

## 5. Architectural Trade-Off Matrix

| Design Alternative | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Master Architecture** | Distributed Masterless (Cassandra) | Centralized Master (GFS / HDFS) | **Centralized Master**: Trivializes global namespace operations, chunk lease management, and garbage collection without complex multi-master Paxos transactions. |
| **Write Model** | Arbitrary Random Overwrite | Append-Only Sequential Writes | **Append-Only**: Eliminates expensive random disk seeks and complex distributed file locking; perfectly aligns with big data analytics. |
| **Metadata Location** | Disk-backed B+Tree | 100% In-Memory RAM | **100% In-Memory RAM**: Sub-millisecond namespace operations; eliminates disk I/O bottlenecks during directory traversals. |
| **Data Replication Path** | Star Topology (Master/Client to All) | Linear Pipelined Chain | **Linear Pipelined Chain**: Saturates full-duplex network cards; data flows down the node chain while control acknowledgments flow back. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Identifies the role of the Master/NameNode and Chunkserver/DataNode.
- Explains why chunk sizes are large (64MB/128MB) compared to standard OS blocks.
- Calculates total storage requirements including $3\text{x}$ replication factor.

### Senior (L5 / IC5)
- Explains why the Master does not broker data transfer (client streams directly to Chunkservers).
- Details the operation log (WAL), checkpointing, and in-memory metadata footprint calculations.
- Analyzes the pipelined write protocol and rack-aware replica placement strategy.
- Understands at-least-once append semantics and chunk boundary padding.

### Staff+ (L6 / Principal)
- Designs solutions for the "Small Files Problem" (SequenceFiles, HAR archives, or federated NameNodes).
- Analyzes split-brain fencing mechanisms (STONITH, ZooKeeper active/standby leases) during master failovers.
- Formulates storage tiering strategies (Erasure Coding for cold data vs $3\text{x}$ replication for hot streaming data).
- Evaluates checksum block validation overhead and disk bit rot scrubbers on commodity SMR drives.
