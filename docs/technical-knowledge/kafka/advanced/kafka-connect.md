---
id: kafka-connect
title: Kafka Connect
sidebar_label: Kafka Connect
description: '**Kafka Connect** is a framework for **reliably moving data between
  Kafka and external systems** (databases, file systems, cloud services) without writing.'
tags:
- technical-knowledge
- kafka
- advanced
- kafka-connect
---

# Kafka Connect

## What is Kafka Connect?

**Kafka Connect** is a framework for **reliably moving data between Kafka and external systems** (databases, file systems, cloud services) without writing custom code.

```
External System                    Kafka                    External System
(MySQL, S3, etc.)                                          (Elasticsearch, etc.)
      │                               │                           │
      └──── Source Connector ────────►│────► Sink Connector ─────┘
```

---

## Core Concepts

| Term                     | Description                                                   |
| ------------------------ | ------------------------------------------------------------- |
| **Connector**            | Plugin that moves data to/from an external system             |
| **Task**                 | Unit of work (a connector can have multiple parallel tasks)   |
| **Worker**               | JVM process running connectors and tasks                      |
| **Standalone Mode**      | Single worker, single process (for dev/testing)               |
| **Distributed Mode**     | Multiple workers, high availability, load-balanced            |
| **Converter**            | Serializes/deserializes data (JSON, Avro, Protobuf)           |
| **Transformation (SMT)** | Single Message Transform — lightweight in-flight modification |

---

## Source vs Sink Connectors: Architectural Deep Dive

While both connector types run inside the Kafka Connect worker cluster, they utilize completely different control loops, threading models, offset tracking mechanisms, and scaling boundaries.

```
Source Connector (PULL from Source, PUSH to Kafka):
  ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
  │ External System ├──────►│   SourceTask    ├──────►│  Kafka Topic    │
  │ (MySQL, S3, etc)│ Poll  │ (Custom Code)   │ Send  │ (Broker Cluster)│
  └─────────────────┘       └─────────────────┘       └─────────────────┘

Sink Connector (PULL from Kafka, PUSH to Target):
  ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
  │   Kafka Topic   ├──────►│    SinkTask     ├──────►│ External System │
  │ (Broker Cluster)│ Poll  │ (Custom Code)   │ Put   │(Elasticsearch,  │
  └─────────────────┘       └─────────────────┘       └────────┬────────┘
                                                               │ Flush
                                                               ▼
                                                      Commit to Target
```

---

### 1. Source Connectors: Pulling Data into Kafka

Source Connectors ingest data from external systems (databases, APIs, message queues, log files) and publish it to Kafka topics.

#### Internals and Control Flow
1. **Partition Mapping**: The `SourceConnector` identifies the logical subdivisions of the external system (called **sourcePartitions**). A partition could be a database table name, a directory path, a specific file, or a shard ID.
2. **Task Assignment**: The connector divides these partitions among `SourceTask` instances.
3. **The Poll Loop**: Each `SourceTask` runs a continuous polling loop. The Connect framework calls `poll()` on the task thread:
   - The task queries the external system for new changes *since the last tracked offset* for its assigned partitions.
   - It wraps each change in a `SourceRecord`, containing:
     - `sourcePartition` (Map defining which resource this came from, e.g., `{"table": "users"}`)
     - `sourceOffset` (Map defining the read position, e.g., `{"row_id": 4550}`)
     - The target Kafka topic name, message key, and message value.
4. **Serialization and Send**: The Connect framework passes the `SourceRecord` through any configured Single Message Transforms (SMTs), serializes it using the designated `Converter`, and publishes it to Kafka using an internal `KafkaProducer`.
5. **Offset Commitment**: Only after the broker acknowledges the message write does the framework write the task's `sourceOffset` to the internal `connect-offsets` topic.

#### Source Scaling Limits
- **Resource Constraints**: Parallelism (number of tasks) is limited by how many partitions exist in the external system. For example, if you are reading from a directory with 3 files, configuring `tasks.max=10` will still result in only 3 active tasks; the other 7 will have no partitions assigned.
- **Log Constraints (CDC)**: For Change Data Capture (CDC) connectors like Debezium, reading from a database binlog or write-ahead log (WAL) is strictly sequential. Since there is only one WAL file stream, Debezium must run with `tasks.max=1` to guarantee message ordering and avoid concurrent read collisions.

---

### 2. Sink Connectors: Pushing Data to External Systems

Sink Connectors consume records from Kafka topics and write them to external datastores, indexers, or object storage systems.

#### Internals and Control Flow
1. **Topic Subscription**: The `SinkConnector` defines which Kafka topics to consume.
2. **Task Assignment & Partition Rebalance**: The Connect framework assigns partitions of the source topics to `SinkTask` instances.
3. **Consumer Loop**: The framework manages an internal `KafkaConsumer` for each task. It pulls batches of records from the brokers, runs them through the configured `Converter` and SMTs, and calls `SinkTask.put(Collection<SinkRecord>)`.
4. **Write and Flush**:
   - The `put()` method buffers or writes records immediately to the external system's writer client.
   - Periodically, the framework calls `SinkTask.flush(Map<TopicPartition, OffsetAndMetadata>)`. This is the signal for the task to commit any pending writes (e.g., commit DB transactions, flush file buffers to disk, or call `flush` on HTTP client).
5. **Offset Commitment**: Once the `flush()` method returns successfully, the framework commits the consumer offsets to Kafka's internal `__consumer_offsets` topic under the consumer group named `connect-{connector-name}`.

#### Sink Scaling Limits
- **Topic Partitions**: The maximum parallelism of a Sink Connector is directly bound by the number of partitions in the source Kafka topics. If the input topic has 6 partitions, setting `tasks.max=10` will result in 6 active tasks and 4 idle tasks (since standard consumer group protocol limits assignment to one consumer per partition).
- **Target Rate Limits**: Sinks are often limited by the write capacity (throttling, IOPS, connection pools) of the target database or external API.

---

### 3. Comparison Matrix: Source vs. Sink

| Feature | Source Connectors | Sink Connectors |
| :--- | :--- | :--- |
| **Data Flow Direction** | External System ──► Kafka Topic | Kafka Topic ──► External System |
| **Framework Class** | Extends `SourceConnector` / `SourceTask` | Extends `SinkConnector` / `SinkTask` |
| **Primary Method** | `List<SourceRecord> poll()` | `void put(Collection<SinkRecord> records)` |
| **Internal Client** | `KafkaProducer` | `KafkaConsumer` |
| **Offset Storage** | Compacted Kafka topic `connect-offsets` | Consumer offset topic `__consumer_offsets` |
| **Offset Group Name** | N/A (tracked per connector name key) | `connect-{connector-name}` |
| **Parallelism Bound** | Number of partitions in the source system (e.g., tables) | Number of partitions in the Kafka topic |
| **At-Least-Once Handshake** | Offset committed *after* broker ACK | Consumer offset committed *after* target write flush |
| **Exactly-Once Semantics** | Supported via KIP-618 transactions (Connect 3.3+) | Depends on target system idempotency or transaction limits |
| **Error Handling (DLQ)** | N/A (cannot route source errors to DLQ) | Supported (direct invalid Kafka records to a DLQ topic) |

---

## Internal Architecture — How Kafka Connect Really Works

Understanding internals is what separates a user of Kafka Connect from someone who can debug, tune, and operate it under pressure.

### The Worker Process

A **Worker** is a JVM process that hosts connectors and their tasks. In distributed mode, multiple workers form a **Connect cluster** and coordinate via Kafka's **Group Membership Protocol** (the same protocol Kafka consumer groups use).

```
┌─────────────────────────────────────────────────────────────────┐
│                        Worker JVM Process                       │
│                                                                 │
│   ┌─────────────────┐     ┌─────────────────────────────────┐  │
│   │ ConnectorThread  │     │         TaskThread(s)           │  │
│   │                 │     │                                 │  │
│   │  - Manages task │     │  Source: poll() → convert →    │  │
│   │    lifecycle    │     │          send to Kafka          │  │
│   │  - Reconfigures │     │                                 │  │
│   │    on changes   │     │  Sink:   fetch from Kafka →    │  │
│   └─────────────────┘     │          convert → put()        │  │
│                           └─────────────────────────────────┘  │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │                  OffsetBackingStore                      │  │
│   │    (KafkaOffsetBackingStore in distributed mode)         │  │
│   └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### The Source Connector Execution Loop

A source task runs a tight poll loop inside its thread. The Kafka Connect framework calls this in a loop:

```java
// This is what the framework does internally — simplified
while (running) {
    // 1. Call your connector's poll() — you return a list of SourceRecord
    List<SourceRecord> records = sourceTask.poll();

    // 2. Apply SMTs to each record
    records = applyTransformations(records);

    // 3. Serialize with Converter (e.g., JsonConverter)
    ProducerRecord<byte[], byte[]> producerRecord = converter.fromConnectData(record);

    // 4. Send to Kafka via internal KafkaProducer
    producer.send(producerRecord, callback);

    // 5. On successful send callback: commit offset to connect-offsets topic
    offsetWriter.offset(record.sourcePartition(), record.sourceOffset());
    offsetWriter.flush();
}
```

**Key insight:** Source offsets are committed to Kafka (`connect-offsets`) only **after** the producer receives acknowledgement from Kafka. This gives **at-least-once** guarantees — if the worker dies after sending to Kafka but before committing the offset, the record will be re-sent on recovery.

### The Sink Connector Execution Loop

```java
// Simplified internal sink loop
while (running) {
    // 1. Poll Kafka consumer for records (the framework manages the KafkaConsumer)
    ConsumerRecords<byte[], byte[]> consumerRecords = consumer.poll(Duration.ofMillis(timeout));

    // 2. Deserialize with Converter
    // 3. Apply SMTs
    // 4. Buffer records

    // 5. Call your task's put() with the batch
    sinkTask.put(convertedRecords);

    // 6. Flush — signals the task to commit writes to the external system
    sinkTask.flush(currentOffsets);

    // 7. Commit offsets back to Kafka consumer group
    consumer.commitSync();
}
```

**Key insight:** The consumer offset commit happens *after* `flush()` confirms the external write succeeded. This is also at-least-once — if the external write succeeds but offset commit fails, the records will be re-delivered to `put()`.

### Internal Kafka Topics

These three topics are the **brain of the Connect cluster** — the cluster is completely stateless beyond them:

| Topic             | Purpose                           | Key Design                                         |
| ----------------- | --------------------------------- | -------------------------------------------------- |
| `connect-configs` | Stores connector and task configs | `compact` — latest config wins                     |
| `connect-offsets` | Stores source positions           | `compact` — per `(sourcePartition, connectorName)` |
| `connect-status`  | Connector/task running states     | `compact` — latest status wins                     |

All these topics use **log compaction**, so each key retains only its latest value. When a worker starts up fresh, it reads all three topics from the beginning to reconstruct full cluster state — no external database needed.

---

## Distributed Mode — Rebalancing Deep Dive

This is where most engineers have gaps. Understanding rebalancing is critical for operating Connect reliably.

### What Triggers a Rebalance?

1. A **new worker joins** the cluster
2. A **worker crashes or leaves** (missed heartbeat)
3. A **connector is created, updated, or deleted**
4. A **task reconfiguration** is requested (e.g., number of tasks changes)
5. A **connector fails** and needs task reassignment

### The Rebalance Protocol (Eager/Stop-the-World) — Default Pre-2.4

Before Kafka 2.4, Connect used an **eager rebalancing** protocol (inherited from the consumer group protocol):

```
Step 1: Leader detects a change (worker join/leave/connector update)
         │
Step 2: All workers are notified → ALL tasks are stopped immediately
         │
         ▼
Step 3: Workers re-join the group and send their capabilities
         │
Step 4: Leader computes new task assignment for ALL connectors
         │
Step 5: Leader sends assignment to all workers
         │
Step 6: All workers start their newly assigned tasks
```

**Problem:** During steps 2–6, **zero work is being done** across the entire cluster. Adding a single worker causes a full stop-the-world pause for all connectors. This is called the **"stop-the-world" rebalance**.

```
Timeline:
Worker-1: [task A] [task B] ─── STOP ──────────────────── [task A] [task C]
Worker-2: [task C] [task D] ─── STOP ──────────────────── [task B] [task D]
Worker-3: (joins)           ───────────────────────────── [task E] [task F]
                                  ▲─── Full pause here ──▲
```

### Incremental Cooperative Rebalancing (Kafka 2.3+, Connect 2.6+)

This mirrors the **Incremental Cooperative Rebalancing** introduced in the Kafka consumer group protocol. Tasks are only stopped if they need to move — others keep running.

```
Step 1: Leader detects change → asks workers to revoke only necessary tasks
         │
Step 2: Only affected tasks stop; unaffected tasks continue running
         │
Step 3: Affected workers re-join, report revoked tasks
         │
Step 4: Leader assigns freed tasks to appropriate workers
         │
Step 5: Only the newly assigned tasks start
```

Enable in `worker.properties`:
```properties
# Enable incremental cooperative rebalancing
connect.protocol=sessioned
```

```
Timeline with Cooperative Rebalancing:
Worker-1: [task A] [task B] ──────────── [task A] ─── [task A] [task C←moved]
Worker-2: [task C] [task D] ──────────── [task D] ─── [task D] (task C moved)
Worker-3: (joins)           ──────────────────────── [task C] [task E] [task F]
                                         ▲─ Only task C stops and moves ─▲
```

**Key benefit:** Adding workers or updating one connector no longer interrupts unrelated connectors.

### Worker Group Membership — Under the Hood

Connect workers use Kafka's **GroupCoordinator** (the same broker-side component used by consumer groups) to manage cluster membership:

```
Worker ──heartbeat──► GroupCoordinator (Broker)
                            │
                     Detects worker failure
                      if heartbeat timeout
                            │
                     Triggers rebalance
                      for the group
```

Config params that affect rebalance sensitivity:

```properties
# How often workers send heartbeats to the broker
heartbeat.interval.ms=3000         # default: 3s

# If no heartbeat received within this window, worker is considered dead
session.timeout.ms=30000           # default: 30s (must be > heartbeat.interval.ms)

# Max time a rebalance can be in progress before members are kicked
rebalance.timeout.ms=60000         # default: 60s
```

**Tuning advice:** Lowering `session.timeout.ms` makes the cluster react faster to failures but increases false-positive rebalances (e.g., on GC pauses). For production, keep defaults unless you have very stable infrastructure.

### Cluster Resilience & Split-Brain Mitigation

In a distributed Connect cluster, workers communicate with Kafka brokers to coordinate group membership. However, if a worker experiences a network partition (losing connection to the Kafka brokers but not to the external system it is writing to), it can lead to split-brain scenarios where multiple tasks attempt to write to the same destination simultaneously.

#### Dual Writers & Leader Fencing

If Worker A is partitioned from the Kafka cluster, the Group Coordinator (broker) will eventually miss its heartbeats (exceeding `session.timeout.ms`) and trigger a rebalance. The remaining workers will elect a new leader, and Worker A's tasks will be reassigned to Worker B.

If Worker A is still running locally and tries to write to the external system, and Worker B also starts executing the same tasks, they will both attempt to write simultaneously. This is a classic split-brain/dual-writer issue.

Kafka Connect handles this fencing using different strategies:

1. **Source Connector Fencing (Transactional IDs)**
   - When exactly-once source support is enabled (`exactly.once.source.support=enabled`), the Connect worker assigns a unique `transactional.id` to each source task.
   - The transactional ID format is typically `connect-txn-group-<connectorName>-<taskId>`.
   - When Worker B starts the reassigned task, it initializes the producer with that same `transactional.id`.
   - The Kafka broker detects the new producer session initialization for this ID and increments the epoch. Any write attempts from Worker A's old producer (using the older epoch) will immediately fail with a `ProducerFencedException`, successfully fencing out the zombie writer.

2. **Sink Connector Fencing**
   - Sink connectors rely on consumer group membership. When a rebalance occurs, the consumer coordinator fences out old consumer group members. Any attempt by the old consumer to commit offsets or interact with the coordinator will be rejected with a `CommitFailedException` or `RebalanceInProgressException`.
   - However, Kafka's consumer fencing does not natively prevent the partitioned task from writing to the external system. This must be handled at the destination level (e.g., database locks, unique key constraints, or deterministic file overwriting), which is described in detail in the deduplication section below.

---

## Preventing Message Duplication & Exactly-Once Semantics (EOS)

By default, Kafka Connect operates under **at-least-once delivery** guarantees. In the event of a worker crash, network partition, or broker rebalance, records may be reprocessed, causing duplicate data downstream. 

Preventing duplicates requires different strategies depending on whether data is being pulled (Source) or pushed (Sink).

---

### 1. Deduplication in Source Connectors (Pushing to Kafka)

#### Why Duplicates Occur
A `SourceTask` polls the source database, generates `SourceRecord`s, and writes them to Kafka. If the worker crashes *after* the records are written to the Kafka topic but *before* the task commits the new offsets to the `connect-offsets` topic, the task restarts and re-reads the source from the last committed offset, publishing duplicate messages to Kafka.

#### The Solution: Exactly-Once Source Support (Kafka 3.3+ / KIP-618)
Kafka Connect provides native **exactly-once source semantics** by combining Kafka transactions with internal offset commits.

```
                    Kafka Connect Worker (EOS Loop)
                    ┌────────────────────────────┐
                    │  1. Begin Transaction      │
                    │  2. producer.send(records) │
                    │  3. Write Offsets to       │
                    │     connect-offsets topic  │
                    │  4. Commit Transaction     │
                    └─────────────┬──────────────┘
                                  │ (Atomic Commit)
                                  ▼
                      Both Records & Offsets Written
                      OR Transaction Aborted (Atomic Rollback)
```

1. **Transactional Production**: The framework wraps the record dispatch and the `connect-offsets` write into a single Kafka transaction.
2. **Atomic Commits**:
   - If the write succeeds, the records and offsets are committed atomically.
   - If the write fails or the worker crashes mid-transaction, the transaction is aborted. Downstream consumer groups configured with `isolation.level=read_committed` will never see the aborted records.
3. **How to Enable (Worker-Level Config)**:
   Add the following properties to your Connect worker configuration:
   ```properties
   # Enable worker-level exactly-once for source connectors
   exactly.once.source.support=enabled
   
   # Enable transaction state management inside Connect
   transaction.state.log.min.isr=2
   transaction.state.log.replication.factor=3
   ```
4. **Connector Requirements**:
   - The connector must support transactional source offsets (most modern plugins, including Debezium and official JDBC source connectors, support this out of the box).
   - If a source connector is not transaction-safe, Connect will fail to start the connector and throw an exception if the connector-level configuration `exactly.once.support=required` is configured. If set to `exactly.once.support=requested` (the default), it will fallback to at-least-once delivery semantics and start successfully.

---

### 2. Deduplication in Sink Connectors (Writing to External Systems)

#### Why Duplicates Occur
A `SinkTask` polls records from Kafka, writes them to the external system (e.g., Elasticsearch, S3, PostgreSQL), and then commits consumer offsets to `__consumer_offsets`. If the worker crashes after the data is written to the destination but before offsets are committed to Kafka, the re-assigned task resumes from the last committed offset, writing duplicate entries to the target.

#### Strategy A: Idempotency (Upsert Semantics)
The most resilient way to prevent duplication is to design the writes to be **idempotent**, meaning writing the same record multiple times results in the same target state.

1. **Deterministic Unique Keys**:
   Map the Kafka record coordinates (topic, partition, offset) or business primary keys (e.g., `transaction_id`) directly to the target system's unique identifier.
   - **Elasticsearch/MongoDB**:
     Use the Kafka partition and offset as the document ID:
     ```http
     PUT /orders/_doc/topic-partition-offset
     ```
     If the message is reprocessed, it overwrites the existing document instead of appending a new one.
   - **Relational Databases (JDBC Sink)**:
     Utilize upsert operations (`INSERT ... ON CONFLICT DO UPDATE` or `MERGE` statements).
     ```properties
     insert.mode=upsert
     pk.mode=record_key   # Use the Kafka message key as the primary key
     pk.fields=id         # Target column primary key
     ```

2. **Single Message Transforms (SMTs) for Key Projection**:
   If your source records have keys nested inside the value payload, use the `ValueToKey` SMT to project them to the actual Kafka message key, enabling down-stream sinks to perform natural key deduplication:
   ```properties
   transforms=createKey
   transforms.createKey.type=org.apache.kafka.connect.transforms.ValueToKey
   transforms.createKey.fields=order_id
   ```

#### Strategy B: Transactional/Two-Phase Commit Sinks (Exactly-Once)
If the target system supports **[ACID](../../database/acid.md)** transactions, the sink task can coordinate writes with offset tracking.

1. **Atomic DB Transactions**:
   Write the data and the corresponding Kafka offsets to the target database *within the same database transaction*.
2. **Control Flow**:
   - The task disables auto-commit.
   - In `put()`, it inserts records and updates a metadata table containing the Kafka partition offsets:
     ```sql
     INSERT INTO orders (id, price) VALUES (...);
     UPDATE kafka_offsets SET offset_val = 1045 WHERE partition = 2;
     ```
   - It commits the database transaction.
   - On startup/recovery, the connector task queries the `kafka_offsets` table in the target database to seek the consumer to the correct offset, completely bypassing Kafka's `__consumer_offsets`.

```java
// Example: Transactional JDBC Sink Task (Atomic DB Commit)
public class TransactionalSinkTask extends SinkTask {
    
    @Override
    public void put(Collection<SinkRecord> records) {
        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(false); // Enable manual transaction control
            
            for (SinkRecord record : records) {
                // 1. Write business data
                insertBusinessData(conn, record);
                
                // 2. Write offset to database tracking table
                updateOffsetTrackingTable(conn, record.kafkaPartition(), record.kafkaOffset());
            }
            
            conn.commit(); // Commit data and offsets atomically
        } catch (SQLException e) {
            throw new RetriableException("Database write failed, rolling back transaction...", e);
        }
    }

    @Override
    public void flush(Map<TopicPartition, OffsetAndMetadata> offsets) {
        // Leave empty! Do not rely on Kafka's offset committing mechanism
    }
}
```

#### Strategy C: Write-Once / Read-Many files (HDFS, S3)
For storage sinks (S3, GCS, HDFS), writing records line-by-line is inefficient. Instead, tasks write to a temporary file.
- **Atomic Renames**: During the `flush()` lifecycle call, the task closes the temporary file and renames it atomically to the final path (e.g., `orders_partition_2_offset_1000.parquet`).
- **Recovery**: If the task crashes mid-way, the temporary file is abandoned, and the restarted task starts writing a new temp file, ensuring no duplicate data is exposed in the final bucket directory.

---

## Error Handling — Production Patterns

### Default Behavior

By default, a single bad record **kills the entire task**. The task enters `FAILED` state and must be manually restarted.

### Error Tolerance Configuration

```json
{
  "errors.tolerance": "all",
  "errors.log.enable": "true",
  "errors.log.include.messages": "true",
  "errors.deadletterqueue.topic.name": "dlq.my-connector",
  "errors.deadletterqueue.topic.replication.factor": "3",
  "errors.deadletterqueue.context.headers.enable": "true"
}
```

| Config                                          | Value            | Behavior                              |
| ----------------------------------------------- | ---------------- | ------------------------------------- |
| `errors.tolerance`                              | `none` (default) | Fail fast — task dies on first error  |
| `errors.tolerance`                              | `all`            | Skip bad records, continue processing |
| `errors.deadletterqueue.topic.name`             | topic name       | Route failed records to this topic    |
| `errors.deadletterqueue.context.headers.enable` | `true`           | Add error metadata in Kafka headers   |

### Dead Letter Queue (DLQ) Message Structure

When a record is routed to DLQ, Connect adds headers explaining what went wrong:

```
Header: __connect.errors.topic          = "orders"
Header: __connect.errors.partition      = "2"
Header: __connect.errors.offset         = "10043"
Header: __connect.errors.connector.name = "mysql-orders-source"
Header: __connect.errors.task.id        = "0"
Header: __connect.errors.stage          = "VALUE_CONVERTER"
Header: __connect.errors.class.name     = "JsonConverter"
Header: __connect.errors.exception.message = "JsonParseException: ..."
Header: __connect.errors.exception.stacktrace = "..."
```

### Classifying Error Types

Not all errors should be handled the same way:

| Error Type         | Examples                                   | Strategy                           |
| ------------------ | ------------------------------------------ | ---------------------------------- |
| **Transient**      | Network timeout, DB connection drop        | Retry with backoff                 |
| **Poison pill**    | Malformed JSON, schema mismatch            | DLQ + alert                        |
| **Contract error** | Unexpected schema evolution, field removal | Pause connector, alert immediately |
| **Back-pressure**  | External system too slow                   | Reduce `batch.size`, add tasks     |

```properties
# Retry config for transient errors (source connectors)
errors.retry.timeout=300000     # Retry for up to 5 minutes
errors.retry.delay.max.ms=60000 # Max 60s between retries (exponential backoff)
```

---

## Connector Lifecycle and Task Management

### Connector States

```
     ┌──────────┐
     │ UNASSIGNED│  ← Just submitted via REST API, not yet picked up by a worker
     └─────┬────┘
           │  Worker picks it up
           ▼
     ┌──────────┐
     │ RUNNING  │  ← Tasks are actively running
     └──┬───┬──┘
        │   │
   error│   │pause request
        ▼   ▼
     ┌──────────┐   ┌──────────┐
     │  FAILED  │   │  PAUSED  │  ← Tasks stopped, connector config preserved
     └──────────┘   └──────────┘
```

### Task Lifecycle within a Connector

```
Connector.taskConfigs(maxTasks)   ← Called by framework to get per-task config
         │
         │ Framework splits work across N tasks
         ▼
Task.start(config)                ← Task initializes its resources (DB connection, etc.)
         │
         ▼
Task.poll() / Task.put()          ← Runs in tight loop
         │
         ▼
Task.stop()                       ← Cleanup resources
```

### Scaling Tasks Dynamically

```bash
# Change number of tasks for a running connector (triggers rebalance)
curl -X PUT http://localhost:8083/connectors/mysql-orders-source/config \
  -H "Content-Type: application/json" \
  -d '{"tasks.max": "4", ...other config...}'
```

**How the work is split between tasks** is connector-specific. For JDBC source: each task may handle a subset of tables. For Debezium: typically `tasks.max=1` because the binary log is a single ordered stream that cannot be parallelized.

---

## Offset Management — Deep Dive

### Source Connector Offsets

Each source task tracks its own position in the source system using a **sourcePartition** → **sourceOffset** mapping stored in `connect-offsets`.

```java
// Example: a custom source task tracking file position
@Override
public List<SourceRecord> poll() {
    // Define what "partition" means for your source
    Map<String, Object> sourcePartition = Map.of(
        "filename", "/var/log/app.log"
    );

    // Define the current position (can be any serializable value)
    Map<String, Object> sourceOffset = Map.of(
        "position", currentFilePosition
    );

    SourceRecord record = new SourceRecord(
        sourcePartition,
        sourceOffset,
        "my-topic",
        Schema.STRING_SCHEMA,
        line
    );
    return List.of(record);
}

@Override
public void start(Map<String, String> props) {
    // On startup — recover last committed offset
    Map<String, Object> storedOffset = context.offsetStorageReader()
        .offset(Map.of("filename", "/var/log/app.log"));

    if (storedOffset != null) {
        currentFilePosition = (Long) storedOffset.get("position");
    }
}
```

The framework writes this to `connect-offsets` with the key:
```
key:   ["connector-name", {"filename": "/var/log/app.log"}]
value: {"position": 10485760}
```

### Sink Connector Offsets

Sink connectors rely on **Kafka consumer group offsets** (stored in `__consumer_offsets`). The group ID is always `connect-{connector-name}`.

```bash
# Check sink connector's consumer group lag
kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --describe \
  --group connect-elasticsearch-sink
```

### Advanced Operations: Offset Manipulation

As of Apache Kafka 3.5.0 (via KIP-875), Kafka Connect provides built-in REST API endpoints to view, alter, and reset offsets for both source and sink connectors. Prior to this, modifying offsets required manual partition manipulation or Kafka CLI tools.

#### 1. REST API Offset Management (Kafka 3.5+)

The connector must be in the `STOPPED` state (not running or paused) before offsets can be altered or reset.

##### Get Current Offsets
Retrieve the current offsets for a connector:
```http
GET http://localhost:8083/connectors/mysql-orders-source/offsets
```
Response format:
```json
{
  "offsets": [
    {
      "partition": { "filename": "/var/log/app.log" },
      "offset": { "position": 10485760 }
    }
  ]
}
```

##### Alter Offsets
Update offsets to skip forward or replay data:
```http
PATCH http://localhost:8083/connectors/mysql-orders-source/offsets
Content-Type: application/json

{
  "offsets": [
    {
      "partition": { "filename": "/var/log/app.log" },
      "offset": { "position": 5242880 }
    }
  ]
}
```

##### Reset Offsets
Delete all committed offset state for the connector (useful for re-snapshotting or re-importing all data):
```http
DELETE http://localhost:8083/connectors/mysql-orders-source/offsets
```

#### 2. Manual Offset Manipulation (Older Connect Versions)

If running a Connect cluster older than 3.5.0, you must manipulate the offset store manually.

##### Source Connectors
Source offsets are stored in the internal, compacted `connect-offsets` topic.
1. **Stop the connector** to avoid write collisions.
2. Locate the key and value format by reading the topic using a console consumer:
   ```bash
   kafka-console-consumer.sh --bootstrap-server localhost:9092 \
     --topic connect-offsets --from-beginning --property print.key=true
   ```
   Key format is a JSON array: `["connector-name", {"partition_field": "value"}]`.
3. To reset the offset, publish a **tombstone message** (null value) with the exact matching key:
   ```bash
   # Produce key with a null value to trigger compaction deletion
   kafka-console-producer.sh --bootstrap-server localhost:9092 \
     --topic connect-offsets \
     --property parse.key=true \
     --property key.separator="|"
   
   ["mysql-orders-source",{"filename":"/var/log/app.log"}]|
   ```
4. Start the connector.

##### Sink Connectors
Sink connectors use standard consumer groups (`connect-{connector-name}`). You can reset or shift offsets using the Kafka CLI tools while the connector is stopped:
```bash
# Shift offsets back by 100 messages for a specific topic
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group connect-elasticsearch-sink \
  --reset-offsets --shift-by -100 \
  --topic orders \
  --execute
```

---

## Converters and Schema Registry

### Converter Internal Flow

```
Source Record (Java Object)
        │
        ▼
Converter.fromConnectData(topic, schema, value)
        │  Serializes Schema + Data together
        ▼
byte[] → sent to Kafka
        │
        ▼
Converter.toConnectData(topic, bytes)
        │  Deserializes and reconstructs Schema + Data
        ▼
Sink Record (Java Object with Schema)
```

### Avro + Schema Registry Flow

With `AvroConverter`, the schema is NOT embedded in every message. Instead:

```
Producer side:
  1. Converter registers schema in Schema Registry → gets schema_id (e.g., 42)
  2. Message format: [magic byte (0x00)] [schema_id as 4 bytes] [avro-encoded payload]

Consumer side:
  1. Read magic byte → confirm Avro format
  2. Read schema_id → fetch schema from Schema Registry (cached after first fetch)
  3. Decode Avro payload using fetched schema
```

```properties
# Worker-level converter config (applies to all connectors unless overridden)
key.converter=io.confluent.connect.avro.AvroConverter
key.converter.schema.registry.url=http://schema-registry:8081
value.converter=io.confluent.connect.avro.AvroConverter
value.converter.schema.registry.url=http://schema-registry:8081

# Per-connector override (if this connector needs JSON instead)
value.converter=org.apache.kafka.connect.json.JsonConverter
value.converter.schemas.enable=true
```

### Schema Evolution Compatibility Modes

Schema Registry enforces evolution rules. Misconfiguring this is a common production incident:

| Mode       | What's allowed               | Safe for Connect?                  |
| ---------- | ---------------------------- | ---------------------------------- |
| `BACKWARD` | New schema can read old data | ✅ Safe for consumers               |
| `FORWARD`  | Old schema can read new data | ✅ Safe for producers               |
| `FULL`     | Both directions              | ✅ Safest                           |
| `NONE`     | Anything goes                | ❌ Risk of deserialization failures |

**Common failure pattern:** A database column is added, the source connector picks up the new schema, Schema Registry rejects it as incompatible → source task fails.

### Classloader Isolation & Plugin Path Internals

At scale, running multiple connectors on a shared Connect worker cluster introduces the risk of dependency conflicts. For instance, the JDBC connector might require Guava version `31.0` while the S3 connector requires version `28.0`. Standard Java classloading delegation (parent-first) would load one version from the system classpath, causing runtime `NoSuchMethodError` or `ClassCastException` in the other.

To prevent this, Kafka Connect uses a custom **plugin isolation** mechanism.

#### How `PluginClassLoader` Works

Each connector plugin, converter, or SMT deployed in a directory under `plugin.path` gets its own dedicated classloader (`PluginClassLoader`).

```
                    System ClassLoader (JVM System Classpath)
                                ▲
                                │ [Delegates for Connect APIs & whitelist]
                                │
                    ┌───────────┴───────────┐
                    │  PluginClassLoader    │ (Child-First delegation)
                    │                       │
                    │   Checks Plugin JARs  │
                    │   First (Local Path)  │
                    └───────────┬───────────┘
                                │ [If not found locally, delegating upward]
                                ▼
                       Loads Local Classes
```

1. **Child-First Delegation Pattern**:
   Unlike standard Java classloaders (which delegate to the parent first), `PluginClassLoader` attempts to find and load requested classes from the **local plugin directory** first.
2. **Framework Isolation Protection**:
   Connect APIs and key runtime classes must not be isolated; otherwise, sharing data between the runner and the plugin would result in `ClassCastException` (e.g., both loading their own copies of `SourceRecord`).
   The `PluginClassLoader` maintains an exclusion list (whitelist) of packages that **always** bypass child-first loading and delegate directly to the system classloader:
   - `org.apache.kafka.connect.*` (Connect API interfaces)
   - `org.apache.kafka.common.*` (Configuration & standard exceptions)
   - `java.*` and `javax.*` (Standard runtime libraries)
   - `org.slf4j.*` (Logging frameworks to avoid split logging)

#### Best Practices for `plugin.path`

- **Correct Plugin Directory Hierarchy**:
  Each plugin must occupy its own separate folder under `plugin.path`:
  ```
  plugin.path=/usr/share/java,/opt/connectors
  
  # Correct structure:
  /usr/share/java/kafka-connect-jdbc/
    ├── kafka-connect-jdbc-10.7.0.jar
    └── sqlite-jdbc-3.34.0.jar
  /usr/share/java/kafka-connect-s3/
    ├── kafka-connect-s3-10.3.0.jar
    └── jackson-core-2.13.0.jar
  ```
- **Never modify `CLASSPATH`**:
  Do not copy connector dependency JARs into the Connect worker's `libs` directory or manually include them in the `CLASSPATH` environment variable. Doing so loads them into the system classloader, breaking isolation and causing version conflicts.

---

## Single Message Transforms (SMT) — Internal Details

SMTs are applied **synchronously in the connector's task thread**, before records are sent to Kafka (source) or after they are received from Kafka (sink):

```
Source Task:  poll() → [SMT chain] → Converter → Kafka
Sink Task:    Kafka → Converter → [SMT chain] → put()
```

Since SMTs run in the task thread, **expensive SMTs reduce throughput**. They are designed for:
- Field manipulation (rename, mask, drop, add)
- Routing (change topic name based on field value)
- Simple type conversion

They are **not** designed for:
- Joining streams
- Aggregations
- Lookups to external systems (use Kafka Streams instead)

### Chaining SMTs

```json
{
  "transforms": "route,maskPII,addTimestamp",
  "transforms.route.type": "org.apache.kafka.connect.transforms.RegexRouter",
  "transforms.route.regex": "mysql\\.(.*)",
  "transforms.route.replacement": "processed.$1",

  "transforms.maskPII.type": "org.apache.kafka.connect.transforms.MaskField$Value",
  "transforms.maskPII.fields": "email,phone,credit_card",

  "transforms.addTimestamp.type": "org.apache.kafka.connect.transforms.InsertField$Value",
  "transforms.addTimestamp.timestamp.field": "ingested_at"
}
```

SMTs are applied **in the order listed** in the `transforms` property.

### Custom SMT (Java)

```java
public class TenantRouter<R extends ConnectRecord<R>>
        implements Transformation<R> {

    @Override
    public R apply(R record) {
        // Extract tenant_id from the record value
        Struct value = (Struct) record.value();
        String tenantId = value.getString("tenant_id");

        // Route to tenant-specific topic
        String newTopic = "tenant." + tenantId + "." + record.topic();

        return record.newRecord(
            newTopic,
            record.kafkaPartition(),
            record.keySchema(), record.key(),
            record.valueSchema(), record.value(),
            record.timestamp()
        );
    }

    @Override
    public ConfigDef config() { return new ConfigDef(); }

    @Override
    public void close() {}

    @Override
    public void configure(Map<String, ?> configs) {}
}
```

### Custom Source Connector Blueprint

Writing a custom connector is necessary when dealing with proprietary APIs, legacy systems, or custom file formats. Below is a production-grade blueprint for implementing a custom `SourceConnector` and `SourceTask` in Java.

#### 1. The Source Connector Class
The connector class is responsible for configuration validation, lifecycle management, and task slicing. It does not process data directly.

```java
package com.example.kafka.connect;

import org.apache.kafka.common.config.ConfigDef;
import org.apache.kafka.common.config.ConfigDef.Type;
import org.apache.kafka.common.config.ConfigDef.Importance;
import org.apache.kafka.connect.connector.Task;
import org.apache.kafka.connect.source.SourceConnector;
import org.apache.common.config.ConfigException;

import java.util.*;

public class MyCustomSourceConnector extends SourceConnector {

    private Map<String, String> configProperties;

    public static final String API_URL_CONFIG = "api.url";
    public static final String TENANTS_CONFIG = "tenants";

    // Define configuration schema with ConfigDef
    private static final ConfigDef CONFIG_DEF = new ConfigDef()
        .define(API_URL_CONFIG, Type.STRING, Importance.HIGH, "The target system endpoint API URL")
        .define(TENANTS_CONFIG, Type.LIST, Importance.HIGH, "Comma-separated list of tenants to sync");

    @Override
    public void start(Map<String, String> props) {
        this.configProperties = props;
        // Pre-flight check: validate config
        try {
            CONFIG_DEF.parse(props);
        } catch (Exception e) {
            throw new ConfigException("Invalid configuration for MyCustomSourceConnector: " + e.getMessage());
        }
    }

    @Override
    public Class<? extends Task> taskClass() {
        return MyCustomSourceTask.class;
    }

    @Override
    public List<Map<String, String>> taskConfigs(int maxTasks) {
        // Divide partitions (tenants) dynamically across the maximum number of tasks
        List<String> tenants = Arrays.asList(configProperties.get(TENANTS_CONFIG).split(","));
        List<Map<String, String>> taskConfigs = new ArrayList<>();
        
        int numTasks = Math.min(maxTasks, tenants.size());
        
        // Initialize config lists for each task
        List<List<String>> partitionedTenants = new ArrayList<>();
        for (int i = 0; i < numTasks; i++) {
            partitionedTenants.add(new ArrayList<>());
        }
        
        // Round-robin distribution of partitions to tasks
        for (int i = 0; i < tenants.size(); i++) {
            partitionedTenants.get(i % numTasks).add(tenants.get(i));
        }

        for (int i = 0; i < numTasks; i++) {
            Map<String, String> taskProps = new HashMap<>(configProperties);
            // Assign specific partitions (tenants) to this task configuration
            taskProps.put(TENANTS_CONFIG, String.join(",", partitionedTenants.get(i)));
            taskConfigs.add(taskProps);
        }
        return taskConfigs;
    }

    @Override
    public void stop() {
        // Clean up resources if any
    }

    @Override
    public ConfigDef config() {
        return CONFIG_DEF;
    }

    @Override
    public String version() {
        return "1.0.0";
    }
}
```

#### 2. The Source Task Class
The task class contains the runtime poll loop that extracts data from the external system, handles offsets, and produces `SourceRecord` objects.

```java
package com.example.kafka.connect;

import org.apache.kafka.connect.source.SourceTask;
import org.apache.kafka.connect.source.SourceRecord;
import org.apache.kafka.connect.data.Schema;
import org.apache.kafka.connect.data.Struct;
import org.apache.kafka.connect.data.SchemaBuilder;

import java.util.*;

public class MyCustomSourceTask extends SourceTask {

    private String apiUrl;
    private List<String> assignedTenants;
    private Map<String, Long> tenantCursors = new HashMap<>();

    @Override
    public void start(Map<String, String> props) {
        this.apiUrl = props.get(MyCustomSourceConnector.API_URL_CONFIG);
        this.assignedTenants = Arrays.asList(props.get(MyCustomSourceConnector.TENANTS_CONFIG).split(","));

        // Recover previously saved offsets from Kafka offset backing store
        for (String tenant : assignedTenants) {
            Map<String, Object> partitionKey = Map.of("tenant", tenant);
            Map<String, Object> offsetVal = context.offsetStorageReader().offset(partitionKey);
            if (offsetVal != null) {
                tenantCursors.put(tenant, (Long) offsetVal.get("last_seen_id"));
            } else {
                tenantCursors.put(tenant, 0L); // Start from beginning if no offset exists
            }
        }
    }

    @Override
    public List<SourceRecord> poll() throws InterruptedException {
        List<SourceRecord> records = new ArrayList<>();

        for (String tenant : assignedTenants) {
            long lastSeenId = tenantCursors.get(tenant);
            
            // Mock network fetch call representing an API request
            List<ApiRecord> batch = fetchFromApi(tenant, lastSeenId);
            
            for (ApiRecord item : batch) {
                // Track source partition & offset
                Map<String, Object> sourcePartition = Map.of("tenant", tenant);
                Map<String, Object> sourceOffset = Map.of("last_seen_id", item.getId());

                // Define payload schema
                Schema valueSchema = SchemaBuilder.struct().name("com.example.TenantRecord")
                    .field("tenant_id", Schema.STRING_SCHEMA)
                    .field("id", Schema.INT64_SCHEMA)
                    .field("data", Schema.STRING_SCHEMA)
                    .build();

                Struct valueStruct = new Struct(valueSchema)
                    .put("tenant_id", tenant)
                    .put("id", item.getId())
                    .put("data", item.getData());

                // Build SourceRecord
                SourceRecord sourceRecord = new SourceRecord(
                    sourcePartition,
                    sourceOffset,
                    "tenant-data-topic",
                    null, // Partition assigned by Kafka
                    Schema.STRING_SCHEMA, tenant, // Message Key
                    valueSchema, valueStruct     // Message Value
                );
                
                records.add(sourceRecord);
                tenantCursors.put(tenant, item.getId());
            }
        }

        // Avoid tight looping if there's no new data from source API
        if (records.isEmpty()) {
            Thread.sleep(5000);
        }
        
        return records;
    }

    @Override
    public void stop() {
        // Clean up connections or file streams
    }

    @Override
    public String version() {
        return "1.0.0";
    }

    // Helper representation of system API response records
    private List<ApiRecord> fetchFromApi(String tenant, long lastSeenId) {
        // Typically call HTTP Client here using apiUrl...
        return Collections.emptyList();
    }

    private static class ApiRecord {
        private final long id;
        private final String data;
        public ApiRecord(long id, String data) { this.id = id; this.data = data; }
        public long getId() { return id; }
        public String getData() { return data; }
    }
}
```

---

## Debezium CDC — Internal Mechanics

Debezium deserves special attention because it is architecturally different from poll-based connectors.

### How Debezium Reads the Database Log

```
PostgreSQL WAL (Write-Ahead Log)
        │
        │  Debezium uses a Replication Slot
        │  (logical decoding with pgoutput plugin)
        ▼
┌─────────────────────────────┐
│   Debezium PostgreSQL Task  │
│                             │
│  ReplicationStream.read()   │  ← Streams changes in real-time
│         │                   │
│  Decode WAL event           │
│         │                   │
│  Build SourceRecord with    │
│  before/after/op fields     │
└─────────────────────────────┘
        │
        ▼
Kafka topic: cdc.public.orders
```

**Why `tasks.max=1` for Debezium:** The WAL/binlog is a single ordered stream per database. You cannot parallelize reads from it — doing so would break ordering guarantees. One task reads the entire log sequentially.

### Debezium Event Envelope

```json
{
  "schema": { "...": "..." },
  "payload": {
    "before": {
      "id": 1001,
      "status": "PENDING",
      "total": 99.99
    },
    "after": {
      "id": 1001,
      "status": "SHIPPED",
      "total": 99.99
    },
    "source": {
      "connector": "postgresql",
      "db": "shopdb",
      "table": "orders",
      "lsn": 24023128,
      "txId": 555,
      "ts_ms": 1700000000000
    },
    "op": "u",
    "ts_ms": 1700000000500
  }
}
```

| `op` value | Meaning         |
| ---------- | --------------- |
| `c`        | CREATE (INSERT) |
| `u`        | UPDATE          |
| `d`        | DELETE          |
| `r`        | READ (snapshot) |

### Snapshot Mode & Lock-Free Snapshot Mechanics

When Debezium starts for the first time (or after a slot/binlog position is lost), it performs an **initial snapshot** to read the existing records of the monitored tables. Traditionally, generating a consistent view of the database required table locks (`FLUSH TABLES WITH READ LOCK`), freezing writes on production databases for the duration of the snapshot. 

Modern Debezium connector versions implement advanced, lock-free (or minimal-lock) consistent snapshotting.

#### 1. PostgreSQL Lock-Free Consistency via Exported Snapshots

PostgreSQL utilizes logical replication slots and MVCC (Multi-Version Concurrency Control) to construct consistent snapshots without acquiring table-level locks.

```
PostgreSQL Database                                  Debezium PG Connector
        │                                                     │
        │ 1. Open Transaction (REPEATABLE READ)               │
        │◄────────────────────────────────────────────────────┤
        │ 2. Create Logical Replication Slot                  │
        │◄────────────────────────────────────────────────────┤
        │ 3. Slot exports Snapshot ID: "00000003-0000008F-1" │
        ├────────────────────────────────────────────────────►│
        │ 4. Start concurrent read connection                 │
        │◄────────────────────────────────────────────────────┤
        │ 5. SET TRANSACTION SNAPSHOT '00000003-0000008F-1';  │
        │◄────────────────────────────────────────────────────┤
        │                                                     │
        │ 6. Run SELECT * FROM table (MVCC read)              │
        │◄────────────────────────────────────────────────────┤
        │─── Returns consistent data from snapshot boundary ──►│
        │                                                     │
```

1. **Step 1**: The main connector connection opens a transaction in `REPEATABLE READ` or `SERIALIZABLE` mode.
2. **Step 2**: The connection creates a logical replication slot. Under the hood, PostgreSQL exports a transaction snapshot identifier (e.g., `00000003-0000008F-1`).
3. **Step 3**: To parallelize or read tables without blocking, Debezium opens secondary read-only connections and issues:
   ```sql
   SET TRANSACTION SNAPSHOT '00000003-0000008F-1';
   ```
   This synchronizes the secondary transactions' MVCC view to the exact moment the replication slot was created.
4. **Step 4**: Debezium reads all records from tables using simple `SELECT` statements. The read data matches the slot starting position exactly, allowing Debezium to safely stream subsequent WAL records from that LSN onward once the snapshot is complete. No locks are placed on the tables.

#### 2. MySQL Minimal-Lock Snapshots

MySQL InnoDB relies on MVCC to provide repeatable read consistency.
- **Global Read Lock Window**: Debezium MySQL Connector initially issues a short global read lock (`FLUSH TABLES WITH READ LOCK` or `LOCK TABLES`) to read the current binlog coordinate (filename and position) and execute schema descriptions.
- **Immediate Lock Release**: As soon as the metadata is retrieved, the transaction is marked as `REPEATABLE READ`, and the locks are released (usually lasting only milliseconds).
- **Consistent Selects**: Debezium then queries the tables using `SELECT * FROM table`. InnoDB provides a consistent view matching the start of the transaction, without blocking incoming updates or inserts.

#### 3. Debezium Incremental Snapshots (Signaling Tables)

If an initial snapshot fails midway, or a new table is added to the inclusion list, restarting the snapshot from scratch on a multi-terabyte database is highly disruptive. Debezium solves this using **Incremental Snapshots** (via a signaling mechanism):

- **Signal Table**: Create a dedicated signal table in the database.
- **Write a Signal**: Insert a signal record to execute an incremental snapshot:
  ```sql
  INSERT INTO debezium_signal (id, type, data) 
  VALUES ('sig-1', 'execute-snapshot', '{"data-collections": ["public.customers"]}');
  ```
- **Chunk-Based Snapshotting**: Debezium processes the table in configured chunk sizes by primary key:
  ```sql
  SELECT * FROM customers WHERE id >= 1 AND id < 10000 ORDER BY id;
  ```
- **Interleaving Event Processing**: Between reading chunks, Debezium continues reading live WAL/binlog stream events. If it processes a transaction update for customer `id=500` from the WAL after reading that chunk, it updates the record logic accordingly. This prevents large memory spikes, eliminates table locks, and keeps streaming replication lag low.

#### 4. Snapshot Configuration Modes

Configure snapshotting strategy via `snapshot.mode`:
```properties
# Perform initial snapshot if no offsets are stored, then stream binlog/WAL
snapshot.mode=initial

# Skip initial snapshot entirely; only stream new changes since start
snapshot.mode=never

# Read existing table states and immediately terminate without streaming
snapshot.mode=initial_only

# PostgreSQL specific: use pg_export_snapshot consistent read
snapshot.mode=exported
```

#### Snapshot Performance Tuning

To optimize memory utilization and database query times during large table snapshots, adjust the following parameters:

```properties
# Number of rows to read per database query during snapshots
snapshot.fetch.size=10000

# Pause between processing incremental snapshot chunks to control DB load
incremental.snapshot.chunk.size=20000
```

---

## Performance Tuning

### Source Connector Throughput

```properties
# How many records to buffer per task before sending to Kafka
# Higher = better throughput, more memory
producer.batch.size=65536          # 64KB (bytes)
producer.linger.ms=5               # Wait up to 5ms to fill a batch

# Number of parallel tasks
tasks.max=4

# Poll interval for JDBC connectors (lower = more DB load)
poll.interval.ms=1000

# Max records returned per poll() call
batch.max.rows=1000
```

### Sink Connector Throughput

```properties
# Number of parallel tasks (must be ≤ number of topic partitions)
tasks.max=4

# Consumer fetch settings (tune for throughput)
consumer.max.poll.records=500
consumer.fetch.min.bytes=1
consumer.fetch.max.wait.ms=500
```

### Worker-Level Tuning

```properties
# Internal task queue size — larger = more buffering
offset.flush.interval.ms=60000     # Commit source offsets every 60s
offset.flush.timeout.ms=5000       # Timeout for offset commit

# Producer for internal messages (configs, offsets, status)
internal.key.converter=org.apache.kafka.connect.json.JsonConverter
internal.value.converter=org.apache.kafka.connect.json.JsonConverter
```

---

## Monitoring and Observability

### Key JMX Metrics

Kafka Connect exposes JMX metrics for each connector and task:

```
# Connector-level
kafka.connect:type=connector-metrics,connector=<name>
  → connector-status (running/paused/failed)

# Task-level (source)
kafka.connect:type=source-task-metrics,connector=<name>,task=<id>
  → source-record-poll-rate       # Records/sec produced from source
  → source-record-write-rate      # Records/sec sent to Kafka
  → poll-batch-avg-time-ms        # Average time for poll()

# Task-level (sink)
kafka.connect:type=sink-task-metrics,connector=<name>,task=<id>
  → sink-record-read-rate         # Records/sec consumed from Kafka
  → sink-record-send-rate         # Records/sec written to external system
  → put-batch-avg-time-ms         # Average time for put()

# Worker-level
kafka.connect:type=connect-worker-metrics
  → connector-count
  → task-count
  → connector-startup-failure-total
```

### What to Alert On

| Metric / Condition                   | Alert Threshold                             | Meaning                       |
| ------------------------------------ | ------------------------------------------- | ----------------------------- |
| Task status = `FAILED`               | Immediately                                 | Task crashed, needs attention |
| Consumer group lag (sink)            | > your SLA                                  | Sink is falling behind        |
| `source-record-poll-rate` drops to 0 | Source may be stalled                       |                               |
| `put-batch-avg-time-ms` spikes       | External system degraded                    |                               |
| DLQ topic growing                    | Contract or poison pill errors accumulating |                               |

### Prometheus + JMX Exporter Setup

```yaml
# jmx_exporter config for Kafka Connect
rules:
  - pattern: 'kafka.connect<type=connector-metrics, connector=(.+)><>connector-status'
    name: kafka_connect_connector_status
    labels:
      connector: "$1"

  - pattern: 'kafka.connect<type=source-task-metrics, connector=(.+), task=(.+)><>source-record-poll-rate'
    name: kafka_connect_source_record_poll_rate
    labels:
      connector: "$1"
      task: "$2"
```

---

## Spring Boot with Kafka Connect

Kafka Connect is typically deployed as a separate service, not embedded in Spring Boot. However, you can manage it programmatically using a typed REST client:

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class ConnectManagementService {

    private final RestTemplate restTemplate;

    @Value("${kafka.connect.url}")
    private String connectUrl;

    public void createConnector(ConnectorConfig config) {
        try {
            restTemplate.postForObject(
                connectUrl + "/connectors",
                config,
                String.class
            );
            log.info("Connector created: {}", config.getName());
        } catch (HttpClientErrorException.Conflict ex) {
            log.warn("Connector {} already exists — updating config", config.getName());
            updateConnector(config.getName(), config.getConfig());
        }
    }

    public ConnectorStatus getStatus(String connectorName) {
        return restTemplate.getForObject(
            connectUrl + "/connectors/{name}/status",
            ConnectorStatus.class,
            connectorName
        );
    }

    public void pauseConnector(String connectorName) {
        restTemplate.put(
            connectUrl + "/connectors/{name}/pause",
            null,
            connectorName
        );
    }

    public void resumeConnector(String connectorName) {
        restTemplate.put(
            connectUrl + "/connectors/{name}/resume",
            null,
            connectorName
        );
    }

    public void restartFailedTasks(String connectorName) {
        ConnectorStatus status = getStatus(connectorName);
        status.getTasks().stream()
            .filter(task -> "FAILED".equals(task.getState()))
            .forEach(task -> {
                log.warn("Restarting failed task {}-{}", connectorName, task.getId());
                restTemplate.postForObject(
                    connectUrl + "/connectors/{name}/tasks/{taskId}/restart",
                    null,
                    Void.class,
                    connectorName,
                    task.getId()
                );
            });
    }

    private void updateConnector(String name, Map<String, String> config) {
        restTemplate.put(
            connectUrl + "/connectors/{name}/config",
            config,
            name
        );
    }
}
```

---

## Deploying a Connector (REST API)

```bash
# Create a JDBC Source Connector
curl -X POST http://localhost:8083/connectors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "mysql-orders-source",
    "config": {
      "connector.class": "io.confluent.connect.jdbc.JdbcSourceConnector",
      "connection.url": "jdbc:mysql://localhost:3306/shop",
      "connection.user": "kafka",
      "connection.password": "secret",
      "table.whitelist": "orders",
      "mode": "incrementing",
      "incrementing.column.name": "id",
      "topic.prefix": "mysql.",
      "poll.interval.ms": "1000"
    }
  }'

# Check connector + task status
curl http://localhost:8083/connectors/mysql-orders-source/status

# List all connectors
curl http://localhost:8083/connectors

# Pause (graceful — tasks finish current batch)
curl -X PUT http://localhost:8083/connectors/mysql-orders-source/pause

# Resume
curl -X PUT http://localhost:8083/connectors/mysql-orders-source/resume

# Restart all failed tasks
curl -X POST "http://localhost:8083/connectors/mysql-orders-source/restart?includeTasks=true&onlyFailed=true"

# Delete a connector
curl -X DELETE http://localhost:8083/connectors/mysql-orders-source
```

---

## Popular Connectors

### Source Connectors
| Connector                      | Use Case                             |
| ------------------------------ | ------------------------------------ |
| `debezium-connector-mysql`     | CDC from MySQL (change data capture) |
| `debezium-connector-postgres`  | CDC from PostgreSQL                  |
| `kafka-connect-jdbc`           | Poll-based SQL source                |
| `kafka-connect-s3-source`      | Read files from S3                   |
| `kafka-connect-mongodb-source` | CDC from MongoDB                     |

### Sink Connectors
| Connector                     | Use Case                            |
| ----------------------------- | ----------------------------------- |
| `kafka-connect-elasticsearch` | Index events to Elasticsearch       |
| `kafka-connect-s3`            | Archive to S3 (Parquet, JSON, Avro) |
| `kafka-connect-jdbc`          | Write to SQL databases              |
| `kafka-connect-mongodb`       | Write to MongoDB                    |
| `kafka-connect-bigquery`      | Stream to Google BigQuery           |

---

## Interview Questions — Kafka Connect

**Q: What is the difference between a Source and Sink connector?**

> A **Source connector** pulls data from an external system and publishes it to Kafka topics. A **Sink connector** reads from Kafka topics and writes to an external system. The same JDBC connector plugin can function as either source or sink depending on configuration.

**Q: What is CDC and how does Debezium implement it?**

> Change Data Capture (CDC) captures every database row change (insert/update/delete) and streams it as an event. Debezium reads the database's **binary/transaction log** (binlog for MySQL, WAL for PostgreSQL) rather than polling tables. This ensures low latency, captures deletes, and doesn't add load to the database with expensive queries.

**Q: How does Kafka Connect handle failures?**

> In distributed mode, if a worker dies, its tasks are automatically redistributed to the remaining workers. Connector offsets (source positions, consumed offsets) are stored in dedicated Kafka topics (`connect-offsets`), so tasks resume from where they left off after recovery — providing at-least-once guarantees.

**Q: Explain what happens during a rebalance in Kafka Connect distributed mode.**

> A rebalance is triggered when a worker joins or leaves, or a connector is updated. In the default (eager) protocol, all tasks across the entire cluster stop, workers re-join and report to the leader, the leader recomputes the full assignment, and workers restart with their new tasks. This causes a brief processing pause. With incremental cooperative rebalancing (Kafka 2.6+), only tasks that need to move are stopped — unaffected connectors continue processing during the rebalance.

**Q: What is an SMT (Single Message Transform)?**

> An SMT is a lightweight, stateless record transformation applied to each message as it flows through a connector. Common uses: rename fields, mask PII, add metadata fields, convert timestamps. SMTs are composable (chained in sequence) and avoid the overhead of a full Kafka Streams topology for simple transformations. They run synchronously in the task thread, so expensive SMTs reduce throughput.

**Q: What are the internal Kafka Connect topics and why are they compacted?**

> `connect-configs` stores connector and task configurations. `connect-offsets` stores source connector offsets (tracks position in the external source). `connect-status` stores the current state of connectors and tasks. All three use **log compaction** so only the latest value per key is retained. This lets any worker reconstruct full cluster state by reading these topics from the beginning — the cluster is completely stateless beyond Kafka itself.

**Q: Why is Debezium limited to tasks.max=1?**

> Debezium reads from the database's transaction log (WAL/binlog), which is a single ordered stream. You cannot split or parallelize reads from it without breaking event ordering. Multiple tasks would race to read the same log, causing duplicate events and out-of-order delivery. One task reads the entire stream sequentially.

**Q: How would you achieve exactly-once semantics with Kafka Connect?**

> For source connectors in Kafka 3.3+: enable `exactly.once.source.support=enabled` on the worker, which wraps producer sends and offset commits in a single Kafka transaction. For sink connectors: it depends on the external system. If the target is transactional (e.g., a relational DB), you can wrap `put()` in a DB transaction and only commit if the Kafka offset commit succeeds. If the target is idempotent (e.g., Elasticsearch with document IDs), use deterministic IDs for natural idempotency.

---

## Converters

Converters control how data is serialized and deserialized between Connect and Kafka.

| Converter            | Format                     |
| -------------------- | -------------------------- |
| `JsonConverter`      | JSON                       |
| `AvroConverter`      | Avro + Schema Registry     |
| `ProtobufConverter`  | Protobuf + Schema Registry |
| `StringConverter`    | Plain string               |
| `ByteArrayConverter` | Raw bytes                  |

---

## Senior Design Checklist

Use this as a review when designing a Kafka Connect pipeline for production:

- [ ] **Connector topology** reflects domain ownership and schema boundaries
- [ ] **Error handling policy** distinguishes transient, poison-pill, and contract errors
- [ ] **DLQ defined** with triage ownership and SLA (don't let it grow silently)
- [ ] **Tasks.max** set appropriately — more tasks than partitions is wasteful
- [ ] **Incremental cooperative rebalancing** enabled to avoid stop-the-world pauses
- [ ] **Schema compatibility mode** set to `FULL` or `BACKWARD` to prevent silent breakage
- [ ] **Connector configs version-controlled** (treat as infrastructure code)
- [ ] **Monitoring in place**: connector status, consumer lag, DLQ growth, task error rate
- [ ] **Snapshot mode** for Debezium tested and understood before go-live
- [ ] **Session timeout** tuned to balance failure detection speed vs false-positive rebalances

---

## Further Reading

- [Kafka Connect Documentation](https://kafka.apache.org/documentation/#connect)
- [Confluent Hub — Connector Catalog](https://www.confluent.io/hub/)
- [Debezium — CDC Connectors](https://debezium.io/documentation/)
- [Incremental Cooperative Rebalancing — KIP-415](https://cwiki.apache.org/confluence/display/KAFKA/KIP-415%3A+Incremental+Cooperative+Rebalancing+in+Kafka+Connect)
- [Exactly-Once Source Connectors — KIP-618](https://cwiki.apache.org/confluence/display/KAFKA/KIP-618%3A+Exactly-Once+Support+for+Source+Connectors)