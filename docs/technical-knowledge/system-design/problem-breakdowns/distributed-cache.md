---
id: distributed-cache
title: Design a Distributed In-Memory Cache Like Redis
sidebar_label: 20. Distributed Cache
description: Staff-level system design breakdown for a high-performance distributed in-memory key-value cache with consistent hashing, eviction algorithms, and replication.
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design a Distributed In-Memory Cache Like Redis

A distributed in-memory cache (e.g., Redis Cluster, Memcached, Amazon ElastiCache) provides ultra-low latency, sub-millisecond key-value storage in RAM. Caching sits between application services and durable databases to absorb massive read spikes, reduce database CPU load, and accelerate API response times.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Core Key-Value Operations**: `get(key)`, `put(key, value, ttl)`, `delete(key)` with sub-millisecond latency.
2. **Configurable Eviction Policies**: Evict cold items when memory limit is reached (LRU, LFU, W-TinyLFU, FIFO).
3. **Data Expiration (TTL)**: Keys expire automatically after their Time-To-Live (TTL) has elapsed.
4. **Horizontal Scalability**: Add or remove cache nodes dynamically with minimal cache disruption (Consistent Hashing).
5. **High Availability & Replication**: Primary-replica clustering with automated failover.

### Non-Functional Requirements
- **Sub-Millisecond Read/Write Latency**: P99 latency `< 1ms` for all operations.
- **High Throughput**: Support **Millions of operations per second** across the cluster.
- **Memory Efficiency**: Minimal memory overhead per key; zero memory fragmentation crashes.
- **Fault Tolerance**: Cluster continues serving traffic during node failures without data corruption or cascading crashes.

### Capacity Estimations & Sizing
- **Total Ingress Throughput**: 5 Million operations/sec (80% reads, 20% writes).
- **Total Cached Data**: 10 Terabytes (TB) of active cached objects.
- **Server Sizing**:
  - Cloud cache nodes equipped with 64 GB RAM and 10 Gbps network interfaces.
  - Safe memory utilization cap (80% to avoid OS swapping): $64\text{ GB} \times 0.80 \approx 51.2\text{ GB usable RAM/node}$.
  - Total Nodes = $10\text{ TB} / 51.2\text{ GB} \approx$ **200 Cache Shards**.
  - With 1 replica per shard (2x replication) $\implies$ **400 Total Nodes**.

---

## 2. The Set Up

### Eviction Policies & Data Structures

```
┌───────────────────────────┬──────────────────────────────────┬──────────────────────────────────┐
│ EVICTION POLICY           │ DATA STRUCTURE                   │ COMPLEXITY & BEHAVIOR            │
├───────────────────────────┼──────────────────────────────────┼──────────────────────────────────┤
│ 1. LRU (Least Recently    │ Hash Map + Doubly Linked List    │ O(1) get, O(1) put.              │
│    Used)                  │                                  │ Vulnerable to full-cache flushes │
│                           │                                  │ during one-off table scans.      │
├───────────────────────────┼──────────────────────────────────┼──────────────────────────────────┤
│ 2. LFU (Least Frequently  │ Hash Map + Frequency Doubly      │ O(1) get, O(1) put.              │
│    Used)                  │ Linked Lists                     │ Historical bias: Old popular     │
│                           │                                  │ items linger forever (decay req) │
├───────────────────────────┼──────────────────────────────────┼──────────────────────────────────┤
│ 3. W-TinyLFU (Window      │ TinyLFU (Count-Min Sketch) +     │ Near-optimal hit ratios! Used by │
│    TinyLFU)               │ SLRU (Segmented LRU)             │ Caffeine Cache and modern Redis. │
└───────────────────────────┴──────────────────────────────────┴──────────────────────────────────┘
```

### The Client Driver & Protocol API

```
// Standard Cache Operations
interface DistributedCacheClient {
    byte[] get(String key);
    boolean put(String key, byte[] value, long ttlSeconds);
    boolean delete(String key);
}
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="in-memory-cache" title="Distributed In-Memory Cache Cluster Architecture" />

### Core Subsystems & Operational Flow

#### 1. Consistent Hashing Client Routing
1. The application client driver holds a local view of the **Consistent Hashing Ring** containing virtual nodes (tokens) for all primary cache instances.
2. Client calls `get("user:101")`.
3. The client computes: $\text{hash} = \text{MurmurHash3}(\text{"user:101"})$.
4. Finds the first virtual node clockwise on the ring $\implies$ Node 4.
5. Issues a direct TCP socket call to Node 4 over a persistent connection pool in **0.4ms**.

#### 2. Storage & Eviction Inside a Single Cache Node
1. Node receives `put(key, value, ttl)`.
2. Checks current memory usage against max allocation (`maxmemory`).
3. If memory is full:
   - Triggers the **Eviction Engine (LRU / W-TinyLFU)**: Evicts victim keys from RAM.
4. Stores key, pointer, metadata, and expiration timestamp in the in-memory hash table.
5. Asynchronously streams the write command to connected replica nodes over replication sockets.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Consistent Hashing with Virtual Nodes
Why does naive modulo hashing (`hash(key) % N`) fail in distributed caching?

- **The Modulo Catastrophe**:
  - If we have $N=10$ nodes and 1 node crashes ($N=9$):
  - Almost 100% of keys remap to different nodes (`hash(key) % 9 != hash(key) % 10`)!
  - **Result**: Immediate 100% cache miss storm across the entire company. Database receives 100x traffic surge and collapses instantly (**Cascading Failure**).
- **Consistent Hashing Solution**:
  - Map keys and server nodes onto a circular $2^{32}-1$ integer ring.
  - When a server is added or removed, **only $K/N$ keys** are remapped!
- **Virtual Nodes (Preventing Non-Uniform Hotspots)**:
  - Placing physical nodes directly on the ring causes uneven partition splits.
  - By assigning **100 to 256 virtual nodes** per physical server (e.g. `Server1#1`, `Server1#2`), keys are distributed uniformly across all physical nodes within a 2% variance.

```
                  Consistent Hash Ring (0 to 2^32 - 1)
                            [Node 1#V1]
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
           [Node 3#V2]                      [Node 2#V1]
                 │                               │
                 │          Key "order:99"       │
                 │          hashes here ────────►│ (Routed to Node 2)
                 │                               │
           [Node 2#V2]                      [Node 1#V2]
                 │                               │
                 └───────────────┬───────────────┘
                                 │
                            [Node 3#V1]
```

### Deep Dive 2: Memory Management & Fragmentation (Slab Allocation vs jemalloc)
Why does continuous allocation of dynamic key sizes crash cache servers?

- **External Memory Fragmentation**: Repeatedly allocating and freeing random-sized keys (100 bytes, 4 KB, 1 MB) creates holes in physical memory. The OS reports 10 GB of free RAM, but no contiguous block exists to allocate a 50 KB object $\implies$ `OutOfMemoryError` crash!
- **Slab Allocation (Memcached Model)**:
  - Pre-allocates memory into fixed 1 MB pages.
  - Divides pages into uniform chunks called **Slab Classes** (e.g. Class 1: 64 bytes, Class 2: 128 bytes, Class 3: 256 bytes).
  - A 100-byte object is stored in Slab Class 2.
  - Completely eliminates external memory fragmentation.
- **jemalloc & Active Defragmentation (Redis Model)**:
  - Uses `jemalloc` with automatic background defragmentation (`activedefrag yes`).
  - The engine copies allocated values to contiguous memory in the background while updating pointers without blocking reads.

### Deep Dive 3: Cache Stampede (Thundering Herd) & Single-Flight Locking
What happens when a popular hot key (`"breaking:news"`) expires under 50,000 requests per second?

```
50,000 Concurrent Requests arrive for Key "breaking:news"
                 │
                 ▼
Key expired in Cache! (50,000 Cache Misses!)
                 │
                 ▼
ALL 50,000 REQUESTS HIT THE PRIMARY DATABASE SIMULTANEOUSLY!
                 ➔ DATABASE CONNECTION EXHAUSTION & CRASH!
```

#### Production Defenses:
1. **Single-Flight / Mutex Locking (`Go singleflight` / Distributed Lock)**:
   - When a cache miss occurs, only **one single worker** acquires a local mutex to fetch the data from the database and populate the cache.
   - The remaining 49,999 requests wait for the mutex or subscribe to the in-flight result, completely protecting the database.
2. **Probabilistic Early Expiration (XFetch Algorithm)**:
   - Recompute the cache value before it actually expires using probabilistic math:
     $\Delta \times \beta \times \ln(\text{rand}()) > \text{TTL} - \text{now}()$.
   - A background thread silently refreshes the key before the hard expiration boundary arrives.

---

## 5. Architectural Trade-Off Matrix

| Design Area | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Routing Topology** | Proxy-Based Routing (Twemproxy/Envoy) | Client-Side Consistent Hash Driver | **Client-Side Driver**: Direct socket communication eliminates a proxy network hop, shaving 0.5ms off every request. |
| **Eviction Algorithm** | Standard LRU | W-TinyLFU (Window TinyLFU) | **W-TinyLFU**: Solves the scan resistance flaw of standard LRU. Prevents full-cache evictions caused by one-off analytical scans. |
| **Replication Semantics** | Synchronous Replication | Asynchronous Primary-Replica | **Asynchronous**: Synchronous replication forces writes to wait for network round-trips to replicas, destroying sub-millisecond write SLAs. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Understands the need for caching in front of databases.
- Implements basic in-memory LRU cache using a Hash Map and Doubly Linked List.
- Explains basic TTL and cache expiration.
- Designs basic Cache-Aside read/write flows.

### Senior (L5 / IC5)
- Details the **Consistent Hashing** algorithm and why virtual nodes are essential to prevent partition skew.
- Explains memory fragmentation and compares Slab Allocation (Memcached) vs jemalloc defragmentation (Redis).
- Solves Cache Stampede / Thundering Herd using single-flight mutexes or probabilistic early expiration (XFetch).
- Implements primary-replica failover mechanisms with automated health-check heartbeats.

### Staff+ (L6 / Principal)
- Designs multi-datacenter cache synchronization: Handling cross-region cache replication without causing stale read loops or split-brain overwrites during network partitions.
- Details kernel networking optimization: Bypassing Linux kernel network stack overhead using kernel-bypass networking (DPDK / eBPF / XDP) to achieve 10M+ packets/sec per node.
- Evaluates persistent memory (PMEM / Intel Optane) trade-offs for instant cold-start cache warming after cluster restarts.
