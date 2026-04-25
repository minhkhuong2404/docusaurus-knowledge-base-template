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

## Source vs Sink Connectors

### Source Connector
Reads from an external system and publishes to Kafka:

```
MySQL → [JDBC Source Connector] → Kafka topic "mysql.orders.orders"
S3    → [S3 Source Connector]   → Kafka topic "s3-data"
```

### Sink Connector
Reads from Kafka and writes to an external system:

```
Kafka topic "orders" → [Elasticsearch Sink Connector] → Elasticsearch index
Kafka topic "events" → [S3 Sink Connector]            → S3 bucket
```

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

---

## Exactly-Once Semantics (EOS)

By default, Kafka Connect provides **at-least-once** delivery. Achieving exactly-once requires specific configurations at both source and sink levels.

### Source Connectors — EOS (Kafka 3.3+)

```properties
# Worker-level config — enables exactly-once for source connectors
exactly.once.source.support=enabled

# The worker will use transactions when writing to Kafka
# connect-offsets commits are done atomically with producer sends
```

With EOS enabled, the internal source loop becomes transactional:

```
BEGIN TRANSACTION
  producer.send(record-1)
  producer.send(record-2)
  offsetStore.commit(sourceOffset)   ← atomic with the sends
COMMIT TRANSACTION
```

If the broker crashes after `send` but before `COMMIT`, the transaction is aborted and records are not visible to consumers — the source will re-poll and re-send, but exactly-once is preserved end-to-end.

### Sink Connectors — EOS

Sink EOS depends entirely on the **external system's** transactional support:

- **Idempotent sink** (e.g., Elasticsearch by document ID): use `PUT` with deterministic IDs — same record written twice has the same result.
- **Transactional sink** (e.g., JDBC to PostgreSQL): wrap `put()` in a database transaction, only commit if Kafka offset commit succeeds.
- **Non-idempotent sink** (e.g., HTTP webhook): you must accept at-least-once or build your own deduplication.

```java
// Example: JDBC sink with manual transaction control
@Override
public void put(Collection<SinkRecord> records) {
    try (Connection conn = dataSource.getConnection()) {
        conn.setAutoCommit(false);
        for (SinkRecord record : records) {
            // Write each record inside a transaction
            upsert(conn, record);
        }
        conn.commit();  // Only commits if all writes succeed
    }
}

@Override
public void flush(Map<TopicPartition, OffsetAndMetadata> offsets) {
    // Framework commits Kafka consumer offsets here,
    // after put() already committed to the DB
}
```

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

### Snapshot Mode

When Debezium starts for the first time (or after a slot is lost), it needs to capture the current state of the table before streaming live changes. This is the **initial snapshot**:

```
Phase 1: Snapshot (reads full table state, op = "r")
  → SELECT * FROM orders  (in a consistent transaction)
  → Emits every row as a SourceRecord with op="r"

Phase 2: Streaming (real-time changes from WAL, op = c/u/d)
  → Streams from the LSN captured at snapshot start
```

**Snapshot mode options:**
```properties
# Full snapshot on first start, then stream
snapshot.mode=initial

# Skip snapshot, only stream new changes
snapshot.mode=never

# Snapshot only — don't stream after
snapshot.mode=initial_only

# Use exported snapshot (consistent across tables)
snapshot.mode=exported
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