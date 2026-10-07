---
id: state-stores-rocksdb
title: Kafka Streams — State Stores & RocksDB Tuning
sidebar_label: 3. State Stores & RocksDB
sidebar_position: 3
description: >
  Deep dive into Kafka Streams state stores, RocksDB LSM-tree mechanics, Linux OS Page Cache,
  preventing Kubernetes cgroup OOMKilled with RocksDBConfigSetter, State TTL, and checkpointing.
tags:
  - kafka
  - kafka-streams
  - state-stores
  - rocksdb
  - changelog
---

import KafkaStreamsStateStoreDiagram from '@site/src/components/KafkaStreamsStateStoreDiagram';
import KafkaStreamsFailoverRecoveryDiagram from '@site/src/components/KafkaStreamsFailoverRecoveryDiagram';

# Kafka Streams — State Stores & RocksDB Tuning

State stores are local key-value databases that hold aggregation state, join tables, and custom business context. Understanding their internal architecture, disk flushing behavior, and off-heap memory footprint is essential for production performance and stability.

---

## 1. Internal Architecture

<KafkaStreamsStateStoreDiagram initialTab="layers" />

### State Store Types

```java
// 1. KeyValueStore — simple key-value (most common)
Materialized.<String, Long, KeyValueStore<Bytes, byte[]>>as("count-store")
    .withKeySerde(Serdes.String())
    .withValueSerde(Serdes.Long());

// 2. WindowStore — keyed by (key, window-start-time)
Materialized.<String, Long, WindowStore<Bytes, byte[]>>as("windowed-count-store");

// 3. SessionStore — keyed by (key, session-start, session-end)
Materialized.<String, Long, SessionStore<Bytes, byte[]>>as("session-store");

// 4. In-Memory Store — state stored in heap (lost on crash, rebuilt from changelog)
Materialized.<String, Long, KeyValueStore<Bytes, byte[]>>as("ephemeral-store")
    .withStoreType(Materialized.StoreType.IN_MEMORY);
```

---

## 2. RocksDB — Why It Is Used

<KafkaStreamsStateStoreDiagram initialTab="rocksdb_io" />

RocksDB is a Log-Structured Merge-tree (LSM-tree) embedded key-value database, optimized for write-heavy workloads on fast SSDs.

**Why RocksDB over a Java HashMap?**
- Dataset can exceed available RAM — RocksDB spills to local disk transparently.
- Supports fast range queries — required for windowed aggregations.
- Crash-safe via Write-Ahead Log (WAL) — data survives JVM crashes without requiring a full changelog replay from Kafka brokers.
- Highly tunable memory/disk trade-off via block cache size, write buffer sizes, and compression.

---

## 3. How RocksDB Interacts with Linux OS Page Cache

A frequent architectural point of confusion: **Does Kafka Streams have a Page Cache, or is that only on the Kafka Broker?**

**Both use the Linux OS Page Cache, but in fundamentally different ways:**
- On the **Kafka Broker**: The Page Cache directly buffers topic partition log segment files (`.log`), and `sendfile(2)` streams them to the network via Zero-Copy DMA without touching user space.
- In **Kafka Streams**: The Page Cache runs on your **client application host or Kubernetes pod**, acting as a **secondary disk cache for RocksDB**:

```
Kafka Streams Memory Hierarchy on Client Host / K8s Pod:
┌────────────────────────────────────────────────────────────────────────┐
│ Tier 1: JVM Heap Memory (-Xmx)                                        │
│ - Topology DAG, SerDes, StreamThread queues, POJO records              │
├────────────────────────────────────────────────────────────────────────┤
│ Tier 2: RocksDB Off-Heap Native Memory (C++ via JNI)                   │
│ - MemTable: In-memory write buffer for fast mutations                  │
│ - Block Cache: Decompressed hot key-value data blocks                  │
├────────────────────────────────────────────────────────────────────────┤
│ Tier 3: Linux OS Page Cache (Host / Container Kernel RAM)              │
│ - Caches compressed SSTable (.sst) files and WAL logs                  │
│ - Prevents physical disk I/O when Block Cache misses occur             │
├────────────────────────────────────────────────────────────────────────┤
│ Tier 4: Physical Storage (Local NVMe / Persistent Volume)              │
│ - Flushed SSTables, .checkpoint file                                   │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Read Request Path**: When your stream topology queries a state store (`store.get(key)`):
   - It checks the RocksDB in-memory **Block Cache** in off-heap C++ RAM.
   - On a block cache miss, RocksDB performs a file read. The Linux kernel intercepts this read and checks the **OS Page Cache**. If the SST page is present in Page Cache, it is read into native memory at RAM bus speeds without hitting storage media.
   - Only on a cold Page Cache miss does the kernel trigger physical NVMe/SSD read I/O.
2. **Kubernetes Memory Planning Hazard**:
   - In containerized environments (Kubernetes), developers frequently set container limits based only on the JVM `-Xmx` setting (e.g. `limit: 4Gi`, `-Xmx3g`).
   - Because RocksDB allocates native C++ memory for its Block Cache and MemTables outside the JVM, and the Linux kernel allocates Page Cache for SST files within the container cgroup, total memory usage will exceed 4 GiB, triggering an **`OOMKilled` (Exit Code 137)** termination.
   - **Production Sizing Formula**:
     $$\text{Container Memory Limit} \ge \text{JVM Heap } (-Xmx) + \text{RocksDB Block Cache} + \text{MemTables} + \text{Page Cache Buffer (25--30\%)}$$

---

## 4. Bounding Native Off-Heap Memory with `RocksDBConfigSetter`

By default, **every state store in every task creates its own independent RocksDB instance**, each allocating its own Block Cache (default 32MB) and MemTables (3 $\times$ 16MB).
If an application has 8 active tasks and 3 state stores per task, that equals $8 \times 3 = 24$ independent RocksDB instances!
$$24 \times (32\text{MB Block Cache} + 48\text{MB MemTables}) \approx 1.92\text{ GB native C++ RAM}$$
Without global bounding, native memory balloons uncontrollably under load and triggers a container `OOMKilled (Exit Code 137)`.

### The Solution: Shared Cache and Shared WriteBufferManager

Implement `org.apache.kafka.streams.state.RocksDBConfigSetter` to enforce a single global memory pool shared across all RocksDB instances on the JVM:

```java
import org.apache.kafka.streams.state.RocksDBConfigSetter;
import org.rocksdb.BlockBasedTableConfig;
import org.rocksdb.BloomFilter;
import org.rocksdb.Cache;
import org.rocksdb.CompactionStyle;
import org.rocksdb.CompressionType;
import org.rocksdb.LRUCache;
import org.rocksdb.Options;
import org.rocksdb.WriteBufferManager;
import java.util.Map;

public class CustomRocksDBConfigSetter implements RocksDBConfigSetter {

    // Shared native memory budget across ALL RocksDB instances in this JVM process
    // Total Native RocksDB Cap = 512 MB (Block Cache + Write Buffers)
    private static final Cache SHARED_BLOCK_CACHE = new LRUCache(384 * 1024 * 1024L); // 384 MB
    private static final WriteBufferManager SHARED_WRITE_BUFFER_MANAGER =
        new WriteBufferManager(128 * 1024 * 1024L, SHARED_BLOCK_CACHE); // 128 MB write buffer charged to cache

    @Override
    public void setConfig(String storeName, Options options, Map<String, Object> configs) {
        // 1. Enforce global shared write buffer manager
        options.setWriteBufferManager(SHARED_WRITE_BUFFER_MANAGER);

        // 2. Table options: attach shared block cache and configure bloom filter
        BlockBasedTableConfig tableConfig = new BlockBasedTableConfig();
        tableConfig.setBlockCache(SHARED_BLOCK_CACHE);
        tableConfig.setBlockSize(16 * 1024L); // 16 KB block size (improves point lookup performance)
        tableConfig.setCacheIndexAndFilterBlocks(true); // Cache index/filter in the shared block cache
        tableConfig.setFilterPolicy(new BloomFilter(10, false)); // 10 bits per key (~1% false positive rate)
        options.setTableFormatConfig(tableConfig);

        // 3. Compaction and I/O tuning
        options.setCompactionStyle(CompactionStyle.LEVEL);
        options.setCompressionType(CompressionType.LZ4_COMPRESSION); // Fast compression, low CPU overhead
        options.setMaxWriteBufferNumber(3);
        options.setWriteBufferSize(32 * 1024 * 1024L); // 32 MB per memtable
        options.setMaxBackgroundJobs(4); // Parallel flush and compaction threads
    }

    @Override
    public void close(String storeName, Options options) {
        // RocksDBConfigSetter close hook (resources cleaned on JVM shutdown)
    }
}
```

Enable it in your streams configuration:
```java
props.put(StreamsConfig.ROCKSDB_CONFIG_SETTER_CLASS_CONFIG, CustomRocksDBConfigSetter.class.getName());
```

---

## 5. State Store TTL & Expiration Patterns

Unbounded state stores are the primary cause of disk space exhaustion and prolonged recovery times in production.

| Store Type | Built-In Retention Mechanism | How TTL Works |
|:---|:---|:---|
| **WindowStore** | Native `TimeWindows.ofSizeAndGrace(...)` | Segments older than `windowSize + gracePeriod` are physically dropped |
| **SessionStore** | Native `SessionWindows.ofInactivityGapAndGrace(...)` | Expired sessions dropped once inactivity gap + grace period passes |
| **KeyValueStore** | **None** by default (Retained indefinitely!) | Requires KIP-653 / KIP-1033 state store TTL or custom Punctuator |

### Key-Value Store Expiration via Processor API Punctuator

```java
public class TtlCleanupProcessor extends ContextualProcessor<String, ValueWithTimestamp<String>, String, String> {

    private KeyValueStore<String, ValueWithTimestamp<String>> stateStore;
    private static final long TTL_MS = Duration.ofHours(6).toMillis();

    @Override
    public void init(ProcessorContext<String, String> context) {
        super.init(context);
        this.stateStore = context.getStateStore("ttl-store");

        // Schedule wall-clock punctuator to purge expired keys every 15 minutes
        context.schedule(Duration.ofMinutes(15), PunctuationType.WALL_CLOCK_TIME, timestamp -> {
            try (KeyValueIterator<String, ValueWithTimestamp<String>> iterator = stateStore.all()) {
                while (iterator.hasNext()) {
                    KeyValue<String, ValueWithTimestamp<String>> entry = iterator.next();
                    if (timestamp - entry.value.getTimestamp() > TTL_MS) {
                        stateStore.delete(entry.key); // Writes tombstone to state store and changelog
                    }
                }
            }
        });
    }

    @Override
    public void process(Record<String, ValueWithTimestamp<String>> record) {
        stateStore.put(record.key(), record.value());
        context().forward(record.withValue(record.value().getValue()));
    }
}
```

---

## 6. Changelog Topics & Durability

Every persistent state store is backed by a **compacted Kafka changelog topic** (`cleanup.policy=compact`). Total changelog size is bounded by the number of unique keys rather than event history.

```java
Map<String, String> changelogConfig = Map.of(
    "min.insync.replicas", "2",
    "replication.factor", "3",
    "retention.ms", "-1", // Never expire
    "cleanup.policy", "compact"
);

Materialized.as("order-summary-store")
    .withLoggingEnabled(changelogConfig);
```

---

## 7. The `.checkpoint` File Anatomy & Hazard

<KafkaStreamsStateStoreDiagram initialTab="checkpoint" />

Located on disk at `<state.dir>/<application.id>/<task_id>/.checkpoint`, this plain text file represents the watermark up to which RocksDB data has been fsynced to storage:

```
0                       <-- Checkpoint file version (0)
2                       <-- Number of state stores tracked
order-count-store-changelog 0 148920
summary-store-changelog     0 93402
```

### Why Checkpoint Corruption Causes Catastrophic Cold Replay
1. **Commit Coordination**: Kafka Streams only updates `.checkpoint` **after** RocksDB flushes all active MemTables to disk as immutable SST files.
2. **Crash Before Checkpoint**: If a pod crashes mid-batch, uncommitted MemTable writes are lost, but `.checkpoint` reflects the last committed offset. On restart, Kafka Streams safely plays the changelog forward from `148920` to the partition head.
3. **The Checkpoint Erasure Disaster**: If operations scripts or pod volume remounts delete `.checkpoint` while retaining the RocksDB `.sst` data files, Kafka Streams treats the state as **dirty and corrupted**, wipes the directory, and replays the entire changelog from offset 0!

---

## 8. Failure Recovery & Standby Replicas

<KafkaStreamsFailoverRecoveryDiagram />

### Standby Replicas (`num.standby.replicas`)
Standby replicas are **shadow tasks** that passively consume a state store's changelog without processing input events:

```
Normal operation (num.standby.replicas = 1):
  Instance A: Active Task 0 ──► Processes orders, writes changelog
  Instance B: Standby Task 0 ──► Passively consumes changelog, keeps local RocksDB warm

Instance A crashes:
  Instance B already has state at t ≈ now
  Recovery time drops from minutes to sub-second!
```

### Observing Restoration with `StateRestoreListener`

```java
kafkaStreams.setGlobalStateRestoreListener(new StateRestoreListener() {

    @Override
    public void onRestoreStart(TopicPartition topicPartition, String storeName,
                               long startingOffset, long endingOffset) {
        log.info("Starting restore for store [{}] partition [{}] (records: {})",
            storeName, topicPartition, endingOffset - startingOffset);
    }

    @Override
    public void onBatchRestored(TopicPartition topicPartition, String storeName,
                                long batchEndOffset, long numRestored) {
        log.debug("Restored batch of {} records for store [{}]", numRestored, storeName);
    }

    @Override
    public void onRestoreEnd(TopicPartition topicPartition, String storeName, long totalRestored) {
        log.info("Completed restore for store [{}] partition [{}] (total: {})",
            storeName, topicPartition, totalRestored);
    }
});
```
