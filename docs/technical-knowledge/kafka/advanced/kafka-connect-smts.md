---
id: kafka-connect-smts
title: Kafka Connect — Single Message Transforms (SMTs)
sidebar_label: Connect SMTs
description: Lightweight per-record transformations in Kafka Connect. Covers built-in SMTs, conditional predicates, custom SMT development, and when to use SMTs vs stream processing frameworks.
tags:
- technical-knowledge
- kafka
- advanced
- kafka-connect
- smt
---

# Kafka Connect: Single Message Transforms (SMTs)

When building data pipelines with Kafka Connect, you often need to modify data as it flows between systems. **Single Message Transforms (SMTs)** provide a lightweight mechanism to transform records within the connector itself — without requiring separate stream processing applications.

> **See also**: For Kafka Connect fundamentals and architecture, see [Kafka Connect Deep Dive](./kafka-connect.md).

---

## What Are SMTs?

Single Message Transforms are **pluggable components in Kafka Connect** that modify individual records as they pass through a connector. They operate on one message at a time, applying transformations like field manipulation, filtering, type conversion, or topic routing.

**Key characteristics:**
- Configured directly in connector configuration — no separate deployment
- Execute within the Connect worker's JVM
- Form a **chain** — multiple SMTs applied in sequence
- Operate on `SourceRecord` (before writing to Kafka) or `SinkRecord` (before writing to destination)

SMTs are ideal for **simple, stateless per-record transformations**. They are NOT suitable for aggregations, joins, or stateful processing.

---

## How SMTs Work

For **source connectors**: SMTs run after data is read from the source, before writing to Kafka.  
For **sink connectors**: SMTs run after reading from Kafka, before writing to the destination.

```
Source System → [Read] → [SMT Chain] → Kafka Topic      (source connector)
Kafka Topic → [Read] → [SMT Chain] → Destination System  (sink connector)
```

Each SMT receives a record, applies its transformation, and passes the modified record to the next SMT.

### Basic SMT Configuration

```properties
# Apply two SMTs in sequence
transforms=maskPII,addTimestamp

transforms.maskPII.type=org.apache.kafka.connect.transforms.MaskField$Value
transforms.maskPII.fields=ssn,creditCard

transforms.addTimestamp.type=org.apache.kafka.connect.transforms.InsertField$Value
transforms.addTimestamp.timestamp.field=processing_time
```

**Before** (input record):
```json
{
  "customer_id": 12345,
  "name": "Jane Doe",
  "ssn": "123-45-6789",
  "creditCard": "4111-1111-1111-1111"
}
```

**After** (after SMT chain):
```json
{
  "customer_id": 12345,
  "name": "Jane Doe",
  "ssn": null,
  "creditCard": null,
  "processing_time": 1704067200000
}
```

---

## Built-in SMT Types

### Field Manipulation

| SMT | Purpose |
|-----|---------|
| `InsertField` | Add new fields (timestamp, static values, metadata) |
| `ReplaceField` | Rename or exclude specific fields |
| `MaskField` | Replace sensitive field values with null/placeholder |
| `ExtractField` | Extract a single field from a complex record |

```properties
# Rename a field
transforms=renameField
transforms.renameField.type=org.apache.kafka.connect.transforms.ReplaceField$Value
transforms.renameField.renames=customer_id:customerId,order_date:orderDate

# Add a static field
transforms=addEnv
transforms.addEnv.type=org.apache.kafka.connect.transforms.InsertField$Value
transforms.addEnv.static.field=environment
transforms.addEnv.static.value=production
```

### Type Conversion

| SMT | Purpose |
|-----|---------|
| `Cast` | Convert field types (string → int, long → string) |
| `TimestampConverter` | Transform timestamp formats (string ↔ Unix ↔ Timestamp) |

```properties
transforms=convertTs
transforms.convertTs.type=org.apache.kafka.connect.transforms.TimestampConverter$Value
transforms.convertTs.target.type=string
transforms.convertTs.field=created_at
transforms.convertTs.format=yyyy-MM-dd'T'HH:mm:ssZ
```

### Key / Value Transformations

| SMT | Purpose |
|-----|---------|
| `ValueToKey` | Copy value fields to the record key (rekeying) |
| `KeyToValue` | Copy key fields into the record value |
| `HoistField` | Wrap entire record value in a named struct field |

### Filtering and Topic Routing

| SMT | Purpose |
|-----|---------|
| `Filter` | Drop records based on predicates |
| `RegexRouter` | Rename topic based on regex pattern |
| `TimestampRouter` | Route to topic based on timestamp (e.g., `orders-2024-01`) |

```properties
# Route all records to a prefixed topic
transforms=addPrefix
transforms.addPrefix.type=org.apache.kafka.connect.transforms.RegexRouter
transforms.addPrefix.regex=(.*)
transforms.addPrefix.replacement=db_$1_events
```

### Schema Modifications

| SMT | Purpose |
|-----|---------|
| `Flatten` | Convert nested structures to flat records |
| `SetSchemaMetadata` | Modify schema names and versions |

```properties
# Flatten nested JSON for relational database compatibility
transforms=flatten
transforms.flatten.type=org.apache.kafka.connect.transforms.Flatten$Value
transforms.flatten.delimiter=_
```

---

## Conditional Transformations with Predicates

Since **Kafka Connect 2.6**, SMTs can be applied conditionally using **predicates**:

```properties
transforms=addRegion,maskPII
transforms.addRegion.type=org.apache.kafka.connect.transforms.InsertField$Value
transforms.addRegion.static.field=region
transforms.addRegion.static.value=us-east
transforms.addRegion.predicate=isUSCustomer   # ← conditional

transforms.maskPII.type=org.apache.kafka.connect.transforms.MaskField$Value
transforms.maskPII.fields=ssn
transforms.maskPII.predicate=hasSSN
transforms.maskPII.negate=false               # ← negate=true applies when condition NOT met

predicates=isUSCustomer,hasSSN
predicates.isUSCustomer.type=org.apache.kafka.connect.transforms.predicates.TopicNameMatches
predicates.isUSCustomer.pattern=us-.*

predicates.hasSSN.type=org.apache.kafka.connect.transforms.predicates.HasHeaderKey
predicates.hasSSN.name=contains-ssn
```

**Built-in predicates:**
- `TopicNameMatches` — matches based on topic name regex
- `HasHeaderKey` — matches if record has a specific header
- `RecordIsTombstone` — matches tombstone records (null value)

---

## Real-World Use Cases

### PII Masking for Compliance (PostgreSQL → S3)

```properties
name=postgres-to-s3-connector
connector.class=io.aiven.kafka.connect.s3.AivenKafkaConnectS3SinkConnector
topics=customer_data

transforms=maskSensitive,addTimestamp,flatten

transforms.maskSensitive.type=org.apache.kafka.connect.transforms.MaskField$Value
transforms.maskSensitive.fields=ssn,credit_card,password_hash

transforms.addTimestamp.type=org.apache.kafka.connect.transforms.InsertField$Value
transforms.addTimestamp.timestamp.field=ingest_timestamp

transforms.flatten.type=org.apache.kafka.connect.transforms.Flatten$Value
transforms.flatten.delimiter=_
```

### CDC Topic Routing (Multi-Table → Separate Topics)

```properties
transforms=routeByTable
transforms.routeByTable.type=org.apache.kafka.connect.transforms.RegexRouter
transforms.routeByTable.regex=(.*)
transforms.routeByTable.replacement=cdc_$1
# db.public.orders → cdc_db.public.orders
```

---

## SMTs vs Full Stream Processing

| Capability | SMTs | Kafka Streams / Flink |
|------------|------|-----------------------|
| Per-record transformation | ✅ | ✅ |
| Stateless operations | ✅ | ✅ |
| Aggregations / windowing | ❌ | ✅ |
| Stream joins | ❌ | ✅ |
| External lookups / enrichment | ❌ | ✅ |
| Complex error handling | ❌ (stops connector) | ✅ (DLQ, retry) |
| Operational complexity | Low | High |
| Deployment overhead | None | Separate app/cluster |

**Use SMTs when:** simple, per-record transformations (masking, routing, type conversion, field rename)  
**Use stream processing when:** aggregations, joins, stateful operations, complex error handling

---

## Developing Custom SMTs

When built-in transformations don't meet your needs, implement the `org.apache.kafka.connect.transforms.Transformation` interface:

```java
package com.example.transforms;

import org.apache.kafka.common.config.ConfigDef;
import org.apache.kafka.connect.connector.ConnectRecord;
import org.apache.kafka.connect.transforms.Transformation;
import org.apache.kafka.connect.data.*;
import java.util.Map;

public class AddEnvironmentField<R extends ConnectRecord<R>>
    implements Transformation<R> {

    private String environmentValue;

    @Override
    public void configure(Map<String, ?> configs) {
        environmentValue = (String) configs.get("environment");
    }

    @Override
    public R apply(R record) {
        if (record.value() == null) return record;

        Struct value = (Struct) record.value();
        Schema updatedSchema = SchemaBuilder.struct()
            .field("environment", Schema.STRING_SCHEMA)
            .fields(value.schema().fields())
            .build();

        Struct updatedValue = new Struct(updatedSchema);
        updatedValue.put("environment", environmentValue);
        value.schema().fields()
            .forEach(f -> updatedValue.put(f.name(), value.get(f)));

        return record.newRecord(
            record.topic(), record.kafkaPartition(),
            record.keySchema(), record.key(),
            updatedSchema, updatedValue, record.timestamp()
        );
    }

    @Override
    public ConfigDef config() {
        return new ConfigDef()
            .define("environment", ConfigDef.Type.STRING,
                ConfigDef.Importance.HIGH, "Environment identifier");
    }

    @Override
    public void close() {}
}
```

**Packaging and deployment:**
```bash
mvn clean package
mkdir -p /opt/kafka-connect/plugins/custom-smts
cp target/custom-smt-1.0.0-jar-with-dependencies.jar \
   /opt/kafka-connect/plugins/custom-smts/
```

**Custom SMT best practices:**
- Keep transformations **stateless** — SMTs may execute on multiple threads concurrently
- Ensure **thread-safety** — no shared mutable state
- Handle **null values** gracefully (tombstone records)
- Throw `DataException` for data validation issues (not `RuntimeException`)
- Avoid **expensive external calls** in the hot path (no HTTP calls, DB lookups)

---

## Monitoring SMT Performance

SMTs execute **synchronously** in the connector's data path — slow SMTs directly reduce throughput.

**Key JMX metrics:**

| Metric | Description |
|--------|-------------|
| `transformation-time-ms-avg` | Average time per record in transformation |
| `transformation-time-ms-max` | Worst-case transformation time |
| `transformation-record-rate` | Records transformed per second |
| `transformation-record-total` | Total records transformed |

```bash
# Query via jmxterm
echo "get -b kafka.connect:type=connector-task-metrics,connector=my-connector,task=0 transformation-time-ms-avg" \
  | java -jar jmxterm.jar -l localhost:9999
```

**Performance tips:**
- Profile SMT chains to identify bottlenecks
- Use predicates to skip unnecessary transformations
- Consider batch processing if throughput is critical
- Monitor GC pressure from large object transformations

---

## Best Practices

1. **One responsibility per SMT** — keep each transform focused on a single operation
2. **Order matters** — mask PII before logging/routing; add timestamps last
3. **Test with production-like data** — different data types can expose edge cases
4. **Schema compatibility** — `Cast`, `Flatten`, and `ReplaceField` can break schema evolution; test thoroughly
5. **No external I/O** — SMTs cannot call external APIs or databases; use stream processing for enrichment
6. **Monitor transformation time** — set alerts on `transformation-time-ms-avg` to detect slowdowns

---

## Interview Questions — Kafka Connect SMTs

**Q: What is the difference between a source SMT and a sink SMT?**

> Source SMTs execute after data is read from the external source but before writing to Kafka, enabling transformations before data enters the streaming platform. Sink SMTs execute after reading from Kafka but before writing to the external destination, enabling transformations at delivery time. The SMT class is the same — the timing of execution differs based on connector type.

**Q: When should you use SMTs instead of Kafka Streams?**

> Use SMTs for simple, stateless, per-record transformations like field masking, renaming, type conversion, or topic routing. Use Kafka Streams when you need aggregations, stream joins, windowed operations, complex error handling, or any processing that requires knowledge of multiple records. The key distinction is: SMTs cannot maintain state, cannot access external systems, and have no retry/DLQ mechanisms — they stop the entire connector on failure.

**Q: How do predicates work with SMTs?**

> Predicates are conditions evaluated per record before applying an SMT. If the predicate matches (or with `negate=true`, if it doesn't match), the transformation is applied; otherwise the record passes through unchanged. This enables conditional logic like "only mask SSN fields if the record has a certain header" or "only add region field for topics matching a pattern." Predicates avoid creating multiple connectors for slight variations in transformation logic.

**Q: What are the thread-safety requirements for custom SMTs?**

> The Connect framework may call the `apply()` method from multiple threads concurrently (one per task). Custom SMTs must therefore be thread-safe: avoid shared mutable state, use local variables within `apply()`, and if external resources are needed, ensure they're thread-safe or use thread-local storage. The `configure()` method is called once during initialization and is not thread-safe with `apply()`.

---

## Related Topics

- [Kafka Connect Deep Dive](./kafka-connect.md) — Full Kafka Connect architecture, source/sink connectors
- [Exactly-Once Semantics](./exactly-once.md) — Delivery guarantees in Connect pipelines
- [Schema Registry](./schema-registry.md) — Schema compatibility when SMTs modify record structure
- [Kafka Streams Deep Dive](./kafka-streams-deep-dive.md) — When SMTs are insufficient

## Sources

1. [Apache Kafka Documentation — Connect Transforms](https://kafka.apache.org/documentation/#connect_transforms)
2. [Confluent SMT Reference](https://docs.confluent.io/platform/current/connect/transforms/overview.html)
3. [Kafka Connect GitHub — SMT Source](https://github.com/apache/kafka/tree/trunk/connect/transforms)
