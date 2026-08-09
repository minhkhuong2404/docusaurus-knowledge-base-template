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

import KafkaConnectFlowDiagram from '@site/src/components/KafkaConnectFlowDiagram';

# Kafka Connect

## What is Kafka Connect?

**Kafka Connect** is a framework for **reliably moving data between Kafka and external systems** (databases, file systems, cloud services) without writing custom code.

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

<KafkaConnectFlowDiagram />

### The Source Connector Execution Loop

A source task runs a tight poll loop inside its thread. The Kafka Connect framework calls this in a loop:

**Problem:** During steps 2–6, **zero work is being done** across the entire cluster. Adding a single worker causes a full stop-the-world pause for all connectors. This is called the **"stop-the-world" rebalance**.

### Incremental Cooperative Rebalancing (Kafka 2.3+, Connect 2.6+)

This mirrors the **Incremental Cooperative Rebalancing** introduced in the Kafka consumer group protocol. Tasks are only stopped if they need to move — others keep running.

Enable in `worker.properties`:

**Key benefit:** Adding workers or updating one connector no longer interrupts unrelated connectors.

### Worker Group Membership — Under the Hood

Connect workers use Kafka's **GroupCoordinator** (the same broker-side component used by consumer groups) to manage cluster membership:

Config params that affect rebalance sensitivity:

1. **Transactional Production**: The framework wraps the record dispatch and the `connect-offsets` write into a single Kafka transaction.
2. **Atomic Commits**:
   - If the write succeeds, the records and offsets are committed atomically.
   - If the write fails or the worker crashes mid-transaction, the transaction is aborted. Downstream consumer groups configured with `isolation.level=read_committed` will never see the aborted records.
3. **How to Enable (Worker-Level Config)**:
   Add the following properties to your Connect worker configuration:
   

### Task Lifecycle within a Connector

### Scaling Tasks Dynamically

### Avro + Schema Registry Flow

With `AvroConverter`, the schema is NOT embedded in every message. Instead:

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
  
- **Never modify `CLASSPATH`**:
  Do not copy connector dependency JARs into the Connect worker's `libs` directory or manually include them in the `CLASSPATH` environment variable. Doing so loads them into the system classloader, breaking isolation and causing version conflicts.

---

## Single Message Transforms (SMT) — Internal Details

SMTs are applied **synchronously in the connector's task thread**, before records are sent to Kafka (source) or after they are received from Kafka (sink):

**Why `tasks.max=1` for Debezium:** The WAL/binlog is a single ordered stream per database. You cannot parallelize reads from it — doing so would break ordering guarantees. One task reads the entire log sequentially.

### Debezium Event Envelope

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

## Interview Questions

### Q: What is the difference between a Source and Sink connector?

> A **Source connector** pulls data from an external system and publishes it to Kafka topics. A **Sink connector** reads from Kafka topics and writes to an external system. The same JDBC connector plugin can function as either source or sink depending on configuration.

### Q: What is CDC and how does Debezium implement it?

> Change Data Capture (CDC) captures every database row change (insert/update/delete) and streams it as an event. Debezium reads the database's **binary/transaction log** (binlog for MySQL, WAL for PostgreSQL) rather than polling tables. This ensures low latency, captures deletes, and doesn't add load to the database with expensive queries.

### Q: How does Kafka Connect handle failures?

> In distributed mode, if a worker dies, its tasks are automatically redistributed to the remaining workers. Connector offsets (source positions, consumed offsets) are stored in dedicated Kafka topics (`connect-offsets`), so tasks resume from where they left off after recovery — providing at-least-once guarantees.

### Q: Explain what happens during a rebalance in Kafka Connect distributed mode.

> A rebalance is triggered when a worker joins or leaves, or a connector is updated. In the default (eager) protocol, all tasks across the entire cluster stop, workers re-join and report to the leader, the leader recomputes the full assignment, and workers restart with their new tasks. This causes a brief processing pause. With incremental cooperative rebalancing (Kafka 2.6+), only tasks that need to move are stopped — unaffected connectors continue processing during the rebalance.

### Q: What is an SMT (Single Message Transform)?

> An SMT is a lightweight, stateless record transformation applied to each message as it flows through a connector. Common uses: rename fields, mask PII, add metadata fields, convert timestamps. SMTs are composable (chained in sequence) and avoid the overhead of a full Kafka Streams topology for simple transformations. They run synchronously in the task thread, so expensive SMTs reduce throughput.

### Q: What are the internal Kafka Connect topics and why are they compacted?

> `connect-configs` stores connector and task configurations. `connect-offsets` stores source connector offsets (tracks position in the external source). `connect-status` stores the current state of connectors and tasks. All three use **log compaction** so only the latest value per key is retained. This lets any worker reconstruct full cluster state by reading these topics from the beginning — the cluster is completely stateless beyond Kafka itself.

### Q: Why is Debezium limited to tasks.max=1?

> Debezium reads from the database's transaction log (WAL/binlog), which is a single ordered stream. You cannot split or parallelize reads from it without breaking event ordering. Multiple tasks would race to read the same log, causing duplicate events and out-of-order delivery. One task reads the entire stream sequentially.

### Q: How would you achieve exactly-once semantics with Kafka Connect?

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
