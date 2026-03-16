---
id: schema-registry
title: Schema Registry
sidebar_label: Schema Registry
---

# Schema Registry

## What is Schema Registry?

**Schema Registry** is a centralized repository for managing and validating schemas for Kafka messages. It ensures that producers and consumers agree on the data format, preventing schema incompatibilities from breaking your pipeline.

```
Producer → [serialize with schema] → Schema Registry → Kafka
Consumer ← [deserialize with schema] ← Schema Registry ← Kafka
```

---

## Why Schema Registry?

Without Schema Registry:
- Producer renames a field → Consumer crashes with deserialization error
- No versioning → No way to evolve schemas safely
- No validation → Bad data enters the pipeline silently

With Schema Registry:
- Schemas are versioned and centrally validated
- Compatibility rules prevent breaking changes
- Consumers automatically get the correct schema version

---

## Supported Formats

| Format | Notes |
|--------|-------|
| **Avro** | Most popular; binary, compact, schema-embedded |
| **Protobuf** | Google format; good for polyglot environments |
| **JSON Schema** | Human-readable; less efficient |

---

## Schema Compatibility Modes

| Mode | Allowed Changes |
|------|----------------|
| `BACKWARD` (default) | New schema can read data written by old schema. Add optional fields, delete fields |
| `FORWARD` | Old schema can read data written by new schema. Add fields, delete optional fields |
| `FULL` | Both backward and forward compatible |
| `BACKWARD_TRANSITIVE` | Backward-compatible with all previous versions |
| `FORWARD_TRANSITIVE` | Forward-compatible with all previous versions |
| `FULL_TRANSITIVE` | Both directions, all versions |
| `NONE` | No compatibility checks |

---

## Avro with Spring Boot

### Dependency
```xml
<dependency>
    <groupId>io.confluent</groupId>
    <artifactId>kafka-avro-serializer</artifactId>
    <version>7.5.0</version>
</dependency>
<dependency>
    <groupId>org.apache.avro</groupId>
    <artifactId>avro</artifactId>
    <version>1.11.0</version>
</dependency>
```

### Avro Schema (`order.avsc`)
```json
{
  "type": "record",
  "name": "OrderEvent",
  "namespace": "com.example.kafka.avro",
  "fields": [
    {"name": "orderId",   "type": "string"},
    {"name": "userId",    "type": "string"},
    {"name": "amount",    "type": "double"},
    {"name": "status",    "type": "string"},
    {"name": "createdAt", "type": "long",   "logicalType": "timestamp-millis"},
    {"name": "notes",     "type": ["null", "string"], "default": null}
  ]
}
```

### Producer Config
```java
@Bean
public ProducerFactory<String, OrderEvent> avroProducerFactory() {
    Map<String, Object> props = new HashMap<>();
    props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
    props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
    props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, KafkaAvroSerializer.class);
    props.put("schema.registry.url", "http://localhost:8081");
    props.put(ProducerConfig.ACKS_CONFIG, "all");
    return new DefaultKafkaProducerFactory<>(props);
}
```

### Consumer Config
```java
@Bean
public ConsumerFactory<String, OrderEvent> avroConsumerFactory() {
    Map<String, Object> props = new HashMap<>();
    props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
    props.put(ConsumerConfig.GROUP_ID_CONFIG, "order-service");
    props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
    props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, KafkaAvroDeserializer.class);
    props.put("schema.registry.url", "http://localhost:8081");
    props.put(KafkaAvroDeserializerConfig.SPECIFIC_AVRO_READER_CONFIG, true);
    return new DefaultKafkaConsumerFactory<>(props);
}
```

---

## Wire Format

The Avro serializer uses a compact wire format:

```
Byte 0:     Magic byte (0x00)
Bytes 1-4:  Schema ID (int32, from Schema Registry)
Bytes 5+:   Avro-encoded payload
```

This means only the schema ID is transmitted, not the full schema — keeping messages compact. The consumer uses the ID to fetch the schema from Schema Registry.

---

## Schema Evolution Example

**V1 Schema:**
```json
{"name": "orderId", "type": "string"},
{"name": "amount",  "type": "double"}
```

**V2 Schema (backward-compatible — added optional field):**
```json
{"name": "orderId",  "type": "string"},
{"name": "amount",   "type": "double"},
{"name": "currency", "type": ["null", "string"], "default": null}
```

Old consumers reading V2 messages: `currency` field is ignored (backward compatible).
New consumers reading V1 messages: `currency` defaults to `null`.

**BREAKING change (not allowed under BACKWARD):**
```json
// Renaming a field — breaks existing consumers
{"name": "orderIdentifier", ...}  // was "orderId"
```

---

## REST API Operations

```bash
# Register a schema
curl -X POST http://localhost:8081/subjects/orders-value/versions \
  -H "Content-Type: application/vnd.schemaregistry.v1+json" \
  -d '{"schema": "{\"type\":\"record\",\"name\":\"OrderEvent\",...}"}'

# Get latest schema
curl http://localhost:8081/subjects/orders-value/versions/latest

# List all subjects
curl http://localhost:8081/subjects

# Check compatibility
curl -X POST http://localhost:8081/compatibility/subjects/orders-value/versions/latest \
  -H "Content-Type: application/vnd.schemaregistry.v1+json" \
  -d '{"schema": "..."}'

# Set compatibility level for a subject
curl -X PUT http://localhost:8081/config/orders-value \
  -H "Content-Type: application/vnd.schemaregistry.v1+json" \
  -d '{"compatibility": "FULL_TRANSITIVE"}'
```

---

## Interview Questions — Schema Registry

**Q: Why is Schema Registry important in a Kafka ecosystem?**

> Schema Registry provides centralized schema management and enforces compatibility rules. Without it, a producer can change a field name or type and silently break all consumers. With Schema Registry, schema changes are validated against compatibility rules before being accepted, and both producers and consumers automatically negotiate the correct schema version using the schema ID embedded in each message.

**Q: What is the difference between BACKWARD and FORWARD compatibility?**

> **BACKWARD**: New schema can read old data. Consumers can be upgraded before producers. **FORWARD**: Old schema can read new data. Producers can be upgraded before consumers. **FULL** provides both. For rolling deployments where you can't upgrade all services simultaneously, FULL or FULL_TRANSITIVE is the safest choice.

**Q: What breaking schema changes are never allowed under BACKWARD compatibility?**

> Removing a required field (no default), renaming a field, and changing a field's type are breaking changes under BACKWARD compatibility. Adding a field with a default value is safe.

**Q: How does the Avro wire format work?**

> Each message starts with a magic byte (0x00), followed by a 4-byte schema ID from the Schema Registry, followed by the Avro-encoded payload. The schema itself is not embedded in each message — only the ID. Consumers look up the schema by ID from the Registry. This keeps messages compact.

**Q: What is `SPECIFIC_AVRO_READER_CONFIG=true` vs false?**

> When `true`, the deserializer returns generated Java classes (from the Avro schema via the Avro Maven/Gradle plugin). When `false`, it returns `GenericRecord` — a dynamic, schema-agnostic representation. Use specific records for type safety in application code; use generic records for generic pipelines or schema migration tools.
