---
id: intro
title: Kafka Knowledge Base
sidebar_label: Introduction
description: Apache Kafka is a **distributed event streaming platform** designed for
  high-throughput, fault-tolerant, and scalable real-time data pipelines and streaming.
tags:
- technical-knowledge
- kafka
- intro
---
# Apache Kafka Knowledge Base

> A comprehensive guide to mastering Apache Kafka — from core concepts to production-grade patterns, with Java/Spring Boot examples and interview prep.

## What is Apache Kafka?

Apache Kafka is a **distributed event streaming platform** designed for high-throughput, fault-tolerant, and scalable real-time data pipelines and streaming applications.

Originally developed at LinkedIn and open-sourced in 2011, Kafka is now maintained by the Apache Software Foundation and is the backbone of event-driven architectures at thousands of companies worldwide.

---

## Why Kafka?

| Feature | Description |
|---|---|
| **High Throughput** | Millions of messages/sec per broker |
| **Low Latency** | Sub-millisecond to single-digit ms |
| **Durability** | Persisted to disk, replicated across brokers |
| **Scalability** | Horizontally scalable via partitions |
| **Fault Tolerance** | Leader election, ISR replication |
| **Replayability** | Consumers can re-read past messages |

---

## How to Use This Knowledge Base

```
Core Concepts       → Start here if you're new to Kafka
Producer            → Deep dive into producing messages
Consumer            → Deep dive into consuming messages
Advanced Topics     → Streams, Connect, EOS, ordering
Interview Prep      → Curated Q&A to ace Kafka interviews
```

---

## Quick-Start with Spring Boot

Add the dependency:

```xml
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka</artifactId>
</dependency>
```

Minimal `application.yml`:

```yaml
spring:
  kafka:
    bootstrap-servers: localhost:9092
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.apache.kafka.common.serialization.StringSerializer
    consumer:
      group-id: my-group
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      auto-offset-reset: earliest
```

Send a message:

```java
@Service
@RequiredArgsConstructor
public class OrderService {

    private final KafkaTemplate<String, String> kafkaTemplate;

    public void publishOrder(String orderId, String payload) {
        kafkaTemplate.send("orders", orderId, payload);
    }
}
```

Consume a message:

```java
@Component
public class OrderConsumer {

    @KafkaListener(topics = "orders", groupId = "order-group")
    public void consume(String message, @Header(KafkaHeaders.RECEIVED_PARTITION) int partition) {
        System.out.printf("Received from partition %d: %s%n", partition, message);
    }
}
```

---

## Prerequisites

- Java 17+
- Docker (for local Kafka via `docker-compose`)
- Basic understanding of publish-subscribe messaging

---

:::tip[Get started]
Head to [Core Concepts → Kafka Overview](./core/kafka-overview) to begin your journey.
:::

---

## Interview Questions

### Q: When should Kafka be chosen over a traditional message queue?
**A:** Choose Kafka for high-throughput event streams, replayability, and long retention; use classic queues for simpler point-to-point workflows.

### Q: What is the most important production trade-off in Kafka design?
**A:** Balancing durability and latency via replication factor, acks, and batching settings.

### Q: How do you avoid hot partitions?
**A:** Use balanced partition keys and validate key cardinality against traffic distribution.

### Q: Why does consumer group design matter for scaling?
**A:** Throughput scales by partition count and consumer parallelism constraints; misalignment causes idle consumers or lag.

### Q: What reliability controls should be discussed in a senior interview answer?
**A:** Idempotent producers, retries with backoff, dead-letter handling, and observability of lag and rebalance behavior.

### Q: How do you explain eventual consistency with Kafka to product stakeholders?
**A:** Events are processed asynchronously with bounded delay; systems converge to correctness while gaining resilience and scale.
