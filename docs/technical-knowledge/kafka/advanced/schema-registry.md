---
id: schema-registry
title: Schema Registry
sidebar_label: Schema Registry
description: Deep-dive into Confluent Schema Registry — Avro wire format internals, subject naming strategies, compatibility mode mechanics, schema evolution patterns, code generation, topic reset with schema changes, and production Spring Boot configuration.
tags:
  - kafka
  - schema-registry
  - avro
  - spring-boot
  - schema-evolution
---

import KafkaSchemaRegistryDiagram from '@site/src/components/KafkaSchemaRegistryDiagram';

# Schema Registry

**Schema Registry** is a centralized repository for managing, versioning, and validating schemas for Kafka messages. It ensures producers and consumers agree on the data contract, preventing silent data corruption and pipeline failures when schemas evolve.

---

## The Problem Without Schema Registry

<KafkaSchemaRegistryDiagram />

In a Kafka-based system without schema governance, schema drift is invisible until it breaks production:

The magic byte `0x00` distinguishes Schema Registry messages from raw bytes. Any consumer receiving a message without this magic byte will throw a `SerializationException` immediately.

### Schema Registry Internal Storage

Confluent Schema Registry stores all schemas in a Kafka topic:

---

## Observability

```java
@Component
@Slf4j
public class SchemaRegistryHealthMonitor {

    private final RestClient schemaRegistryClient;
    private final MeterRegistry meterRegistry;

    @Scheduled(fixedDelay = 60_000)
    public void checkSchemaRegistryHealth() {
        try {
            // Check registry is reachable and responsive
            String response = schemaRegistryClient.get()
                .uri("/subjects")
                .retrieve()
                .body(String.class);

            meterRegistry.gauge("schema.registry.subjects.count",
                (double) new ObjectMapper().readTree(response).size());
            meterRegistry.counter("schema.registry.health.check", "status", "success")
                .increment();
        } catch (Exception e) {
            log.error("Schema Registry health check failed", e);
            meterRegistry.counter("schema.registry.health.check", "status", "failure")
                .increment();
        }
    }
}
```

```yaml
# Prometheus alerts
groups:
- name: schema-registry
  rules:
  - alert: SchemaRegistryDown
    expr: up{job="schema-registry"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Schema Registry is down — all Avro producers and consumers will fail"

  - alert: SchemaDeserializationErrors
    expr: rate(kafka_consumer_fetch_manager_records_consumed_total{topic="orders"}[5m]) == 0
      and rate(kafka_consumer_fetch_manager_fetch_total[5m]) > 0
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "Possible schema deserialization errors — consumer fetching but not processing"
```

---

## Decision Matrix

| Scenario | Recommendation |
|:---|:---|
| New project, greenfield | Avro with `FULL_TRANSITIVE` compatibility; register via CI/CD pipeline |
| Polyglot environment (Java + Python + Go) | Protobuf — better multi-language code generation than Avro |
| Human-readable messages needed | JSON Schema — less compact but debuggable without tooling |
| Adding a new field | Always add as optional (`["null", "type"]`) with `"default": null` |
| Renaming a field | Use `aliases` or introduce a new topic with the new schema |
| Breaking schema change required | New topic name + migration period; never mutate existing topic schemas destructively |
| Topic reset + same schema | Safe — no schema registry changes needed |
| Topic reset + new schema | Set `NONE` compatibility temporarily, delete old versions after draining, restore compatibility |
| `auto.register.schemas` setting | `false` in staging and production; `true` in local dev only |
| Consumer group offset reset | Use `kafka-consumer-groups.sh --reset-offsets` or programmatic `AdminClient` |
| Schema Registry HA | Deploy 3+ instances sharing the same `_schemas` topic; use a load balancer |