---
id: kafka-connect
title: Kafka Connect
slug: kafka-connect
---

# Kafka Connect

Kafka Connect is a framework for streaming data between Apache Kafka and external systems (databases, key-value stores, search indexes, file systems, etc.) using reusable **connectors**.

---

## 1. Why Kafka Connect?

Writing custom producers and consumers for every data source is tedious and error-prone. Kafka Connect solves this by providing:

- **Declarative configuration** — no code required, just JSON/properties config
- **Scalability** — distributed mode runs across multiple workers
- **Fault tolerance** — automatic task failover and rebalancing
- **Offset management** — built-in tracking of source/sink positions
- **A rich connector ecosystem** — hundreds of community and vendor connectors

---

## 2. Architecture

```
┌───────────────┐       ┌──────────────────────────┐       ┌───────────────┐
│  External      │       │     Kafka Connect        │       │               │
│  Source System  │──────▶│  ┌────────────────────┐  │──────▶│  Kafka Broker │
│  (DB, Files)   │       │  │  Source Connector   │  │       │               │
└───────────────┘       │  │  (Tasks 1..N)       │  │       └───────┬───────┘
                        │  └────────────────────┘  │               │
                        │                          │               │
┌───────────────┐       │  ┌────────────────────┐  │               │
│  External      │◀──────│  │  Sink Connector    │  │◀──────────────┘
│  Target System │       │  │  (Tasks 1..N)      │  │
│  (ES, S3, DB)  │       │  └────────────────────┘  │
└───────────────┘       └──────────────────────────┘
```

### Key Components

| Component      | Description                                                        |
|---------------|--------------------------------------------------------------------|
| **Worker**     | A JVM process that runs connectors and tasks                       |
| **Connector**  | A logical job that defines how data moves (source or sink)         |
| **Task**       | A unit of work; a connector is split into one or more tasks        |
| **Converter**  | Serializes/deserializes data (JSON, Avro, Protobuf)               |
| **Transform**  | Optional single-message transformation (SMT) applied inline       |

---

## 3. Source vs. Sink Connectors

### Source Connectors

Read data from an external system and write it to Kafka topics.

**Examples:**
- `io.debezium.connector.mysql.MySqlConnector` — CDC from MySQL
- `io.confluent.connect.jdbc.JdbcSourceConnector` — poll-based JDBC source
- `org.apache.kafka.connect.file.FileStreamSourceConnector` — read from files

### Sink Connectors

Read data from Kafka topics and write it to an external system.

**Examples:**
- `io.confluent.connect.elasticsearch.ElasticsearchSinkConnector`
- `io.confluent.connect.s3.S3SinkConnector`
- `io.confluent.connect.jdbc.JdbcSinkConnector`

---

## 4. Standalone vs. Distributed Mode

### Standalone Mode

- Single worker process
- Config stored in local files
- Good for development and testing

```bash
connect-standalone.sh config/connect-standalone.properties \
  config/my-source-connector.properties
```

### Distributed Mode (recommended for production)

- Multiple worker processes form a **Connect cluster**
- Config and offsets stored in **internal Kafka topics**
- Automatic load balancing and failover
- Connectors managed via REST API

```bash
connect-distributed.sh config/connect-distributed.properties
```

---

## 5. Configuration Example

### JDBC Source Connector

```json
{
  "name": "jdbc-source-orders",
  "config": {
    "connector.class": "io.confluent.connect.jdbc.JdbcSourceConnector",
    "connection.url": "jdbc:postgresql://db-host:5432/mydb",
    "connection.user": "${file:/secrets/db.properties:user}",
    "connection.password": "${file:/secrets/db.properties:password}",
    "table.whitelist": "orders",
    "mode": "incrementing",
    "incrementing.column.name": "id",
    "topic.prefix": "db-",
    "tasks.max": 2,
    "poll.interval.ms": 5000
  }
}
```

### Elasticsearch Sink Connector

```json
{
  "name": "es-sink-orders",
  "config": {
    "connector.class": "io.confluent.connect.elasticsearch.ElasticsearchSinkConnector",
    "topics": "db-orders",
    "connection.url": "http://elasticsearch:9200",
    "type.name": "_doc",
    "key.ignore": true,
    "schema.ignore": true,
    "tasks.max": 2
  }
}
```

---

## 6. REST API (Distributed Mode)

Manage connectors via HTTP:

```bash
# List all connectors
curl -s http://localhost:8083/connectors | jq

# Create a connector
curl -X POST http://localhost:8083/connectors \
  -H "Content-Type: application/json" \
  -d @my-connector.json

# Get connector status
curl -s http://localhost:8083/connectors/jdbc-source-orders/status | jq

# Pause a connector
curl -X PUT http://localhost:8083/connectors/jdbc-source-orders/pause

# Resume a connector
curl -X PUT http://localhost:8083/connectors/jdbc-source-orders/resume

# Restart a failed task
curl -X POST http://localhost:8083/connectors/jdbc-source-orders/tasks/0/restart

# Delete a connector
curl -X DELETE http://localhost:8083/connectors/jdbc-source-orders
```

---

## 7. Single Message Transforms (SMTs)

SMTs apply lightweight transformations to each record **before** it reaches the topic (source) or the sink system.

### Common Built-in SMTs

| Transform                        | Description                                    |
|---------------------------------|------------------------------------------------|
| `InsertField`                   | Add a field (e.g., timestamp, static value)    |
| `ReplaceField`                  | Rename, include, or exclude fields             |
| `MaskField`                     | Mask sensitive field values                    |
| `ExtractField`                  | Pull out a single field from a struct          |
| `TimestampRouter`               | Modify topic name based on timestamp           |
| `RegexRouter`                   | Modify topic name using a regex                |
| `Filter` (with predicates)      | Conditionally drop records                     |

### Example: Add a timestamp field and route topics

```json
{
  "transforms": "addTimestamp,routeTopic",
  "transforms.addTimestamp.type": "org.apache.kafka.connect.transforms.InsertField$Value",
  "transforms.addTimestamp.timestamp.field": "ingested_at",
  "transforms.routeTopic.type": "org.apache.kafka.connect.transforms.RegexRouter",
  "transforms.routeTopic.regex": "(.*)",
  "transforms.routeTopic.replacement": "prod-$1"
}
```

---

## 8. Converters

Converters control how data is serialized/deserialized between Connect and Kafka.

| Converter                                  | Format           |
|-------------------------------------------|------------------|
| `JsonConverter`                            | JSON             |
| `AvroConverter` (Confluent)               | Avro + Schema Registry |
| `ProtobufConverter` (Confluent)           | Protobuf + Schema Registry |
| `StringConverter`                          | Plain string     |
| `ByteArrayConverter`                       | Raw bytes        |

Configure globally or per-connector:

```properties
key.converter=org.apache.kafka.connect.storage.StringConverter
value.converter=io.confluent.connect.avro.AvroConverter
value.converter.schema.registry.url=http://schema-registry:8081
```

---

## 9. Error Handling and Dead Letter Queues

By default, a single bad record can fail an entire task. Use **error tolerance** and **dead letter queues (DLQ)** for resilience:

```json
{
  "errors.tolerance": "all",
  "errors.deadletterqueue.topic.name": "dlq-my-connector",
  "errors.deadletterqueue.topic.replication.factor": 3,
  "errors.deadletterqueue.context.headers.enable": true,
  "errors.log.enable": true,
  "errors.log.include.messages": true
}
```

- `errors.tolerance=all` — skip bad records instead of failing
- Failed records are routed to the DLQ topic with error context in headers
- Monitor the DLQ topic to investigate and reprocess failures

---

## 10. Best Practices

1. **Use distributed mode** in production for scalability and fault tolerance.
2. **Externalize secrets** — use config providers (`FileConfigProvider`, `VaultConfigProvider`) instead of plain-text credentials.
3. **Set `tasks.max` appropriately** — match parallelism to the number of topic partitions or source table partitions.
4. **Enable dead letter queues** — don't let one bad record stop the pipeline.
5. **Use Schema Registry + Avro/Protobuf** — enforce schema evolution and compatibility.
6. **Monitor connector status** — poll the REST API or use JMX metrics for alerting.
7. **Pin connector versions** — test upgrades in staging before production.
8. **Use SMTs sparingly** — for complex transformations, prefer Kafka Streams or ksqlDB instead.

---

## Further Reading

- [Kafka Connect Documentation](https://kafka.apache.org/documentation/#connect)
- [Confluent Hub — Connector Catalog](https://www.confluent.io/hub/)
- [Debezium — CDC Connectors](https://debezium.io/documentation/)
