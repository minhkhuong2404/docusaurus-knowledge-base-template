---
id: kafka-connect
title: Kafka Connect
sidebar_label: Kafka Connect
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

| Term | Description |
|------|-------------|
| **Connector** | Plugin that moves data to/from an external system |
| **Task** | Unit of work (a connector can have multiple parallel tasks) |
| **Worker** | JVM process running connectors and tasks |
| **Standalone Mode** | Single worker, single process (for dev/testing) |
| **Distributed Mode** | Multiple workers, high availability, load-balanced |
| **Converter** | Serializes/deserializes data (JSON, Avro, Protobuf) |
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

# Check status
curl http://localhost:8083/connectors/mysql-orders-source/status

# List all connectors
curl http://localhost:8083/connectors

# Delete a connector
curl -X DELETE http://localhost:8083/connectors/mysql-orders-source
```

---

## Popular Connectors

### Source Connectors
| Connector | Use Case |
|-----------|----------|
| `debezium-connector-mysql` | CDC from MySQL (change data capture) |
| `debezium-connector-postgres` | CDC from PostgreSQL |
| `kafka-connect-jdbc` | Poll-based SQL source |
| `kafka-connect-s3-source` | Read files from S3 |
| `kafka-connect-mongodb-source` | CDC from MongoDB |

### Sink Connectors
| Connector | Use Case |
|-----------|----------|
| `kafka-connect-elasticsearch` | Index events to Elasticsearch |
| `kafka-connect-s3` | Archive to S3 (Parquet, JSON, Avro) |
| `kafka-connect-jdbc` | Write to SQL databases |
| `kafka-connect-mongodb` | Write to MongoDB |
| `kafka-connect-bigquery` | Stream to Google BigQuery |

---

## Debezium CDC Example

Capture every INSERT/UPDATE/DELETE from PostgreSQL:

```json
{
  "name": "postgres-orders-cdc",
  "config": {
    "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
    "database.hostname": "localhost",
    "database.port": "5432",
    "database.user": "debezium",
    "database.password": "secret",
    "database.dbname": "shopdb",
    "database.server.name": "postgres",
    "table.include.list": "public.orders",
    "plugin.name": "pgoutput",
    "publication.autocreate.mode": "filtered",
    "slot.name": "debezium_orders_slot",
    "topic.prefix": "cdc"
  }
}
```

Debezium publishes change events to `cdc.public.orders`:
```json
{
  "before": {"id": 1, "status": "PENDING"},
  "after":  {"id": 1, "status": "SHIPPED"},
  "op": "u",
  "ts_ms": 1700000000000
}
```

---

## Single Message Transforms (SMT)

SMTs allow lightweight transformations without a full Kafka Streams app:

```json
{
  "transforms": "addPrefix,maskSensitive",
  "transforms.addPrefix.type": "org.apache.kafka.connect.transforms.ReplaceField$Value",
  "transforms.addPrefix.renames": "id:orderId,ts:timestamp",
  "transforms.maskSensitive.type": "org.apache.kafka.connect.transforms.MaskField$Value",
  "transforms.maskSensitive.fields": "credit_card_number,ssn"
}
```

Common built-in SMTs:
- `ReplaceField` — add/drop/rename fields
- `MaskField` — mask sensitive data
- `ExtractField` — extract nested field to top-level
- `ValueToKey` — promote a value field to the message key
- `TimestampConverter` — convert timestamp formats
- `InsertField` — add static fields or metadata

---

## Distributed Mode Architecture

```
┌──────────────────────────────────────────────────────┐
│                   Kafka Connect Cluster               │
│                                                      │
│  Worker-1: [Connector-A Task1] [Connector-B Task1]   │
│  Worker-2: [Connector-A Task2] [Connector-B Task2]   │
│  Worker-3: [Connector-C Task1]                       │
└──────────────────────────────────────────────────────┘
            │
     Stored in Kafka topics:
       connect-configs
       connect-offsets
       connect-status
```

Workers self-coordinate — if one dies, tasks are redistributed automatically.

---

## Spring Boot with Kafka Connect

Kafka Connect is typically deployed as a separate service, not embedded in Spring Boot. However, you can manage it programmatically:

```java
@Service
@RequiredArgsConstructor
public class ConnectManagementService {

    private final RestTemplate restTemplate;
    private final String connectUrl = "http://kafka-connect:8083";

    public void createConnector(ConnectorConfig config) {
        restTemplate.postForObject(
            connectUrl + "/connectors",
            config,
            String.class
        );
    }

    public ConnectorStatus getStatus(String connectorName) {
        return restTemplate.getForObject(
            connectUrl + "/connectors/{name}/status",
            ConnectorStatus.class,
            connectorName
        );
    }

    public void restartConnector(String connectorName) {
        restTemplate.postForObject(
            connectUrl + "/connectors/{name}/restart",
            null,
            Void.class,
            connectorName
        );
    }
}
```

---

## Interview Questions — Kafka Connect

**Q: What is the difference between a Source and Sink connector?**

> A **Source connector** pulls data from an external system and publishes it to Kafka topics. A **Sink connector** reads from Kafka topics and writes to an external system. The same JDBC connector plugin can function as either source or sink depending on configuration.

**Q: What is CDC and how does Debezium implement it?**

> Change Data Capture (CDC) captures every database row change (insert/update/delete) and streams it as an event. Debezium reads the database's **binary/transaction log** (binlog for MySQL, WAL for PostgreSQL) rather than polling tables. This ensures low latency, captures deletes, and doesn't add load to the database with expensive queries.

**Q: How does Kafka Connect handle failures?**

> In distributed mode, if a worker dies, its tasks are automatically redistributed to the remaining workers. Connector offsets (source positions, consumed offsets) are stored in dedicated Kafka topics (`connect-offsets`), so tasks resume from where they left off after recovery — providing at-least-once guarantees.

**Q: What is an SMT (Single Message Transform)?**

> An SMT is a lightweight, stateless record transformation applied to each message as it flows through a connector. Common uses: rename fields, mask PII, add metadata fields, convert timestamps. SMTs are composable (chained in sequence) and avoid the overhead of a full Kafka Streams topology for simple transformations.

**Q: What are the internal Kafka Connect topics?**

> `connect-configs` stores connector and task configurations. `connect-offsets` stores source connector offsets (tracks position in the external source). `connect-status` stores the current state of connectors and tasks. These topics allow the cluster to be stateless — any worker can reconstruct the full state from these topics.

---

## Converters

Converters control how data is serialized and deserialized between Connect and Kafka.

| Converter | Format |
|-----------|--------|
| `JsonConverter` | JSON |
| `AvroConverter` | Avro + Schema Registry |
| `ProtobufConverter` | Protobuf + Schema Registry |
| `StringConverter` | Plain string |
| `ByteArrayConverter` | Raw bytes |

---

## Further Reading

- [Kafka Connect Documentation](https://kafka.apache.org/documentation/#connect)
- [Confluent Hub — Connector Catalog](https://www.confluent.io/hub/)
- [Debezium — CDC Connectors](https://debezium.io/documentation/)

---

## Advanced Editorial Pass: Data Integration with Operational Guarantees

### Senior Design Priorities
- Connector topology should reflect ownership, schema evolution, and replay needs.
- Error handling policy must separate transient, poison, and contract errors.
- Throughput tuning should preserve data correctness and back-pressure safety.

### Failure Patterns
- Connector-level retries masking persistent schema incompatibility.
- Dead-letter topics without triage ownership.
- Source and sink task scaling that ignores downstream saturation limits.

### Implementation Heuristics
1. Version connector configs and transforms as audited artifacts.
2. Define DLQ triage workflow with SLA and ownership.
3. Monitor connector task health together with end-system latency.
