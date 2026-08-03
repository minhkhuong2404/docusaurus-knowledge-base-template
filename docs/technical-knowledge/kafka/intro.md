---
id: intro
title: Apache Kafka Knowledge Base
sidebar_label: Introduction
description: Apache Kafka is a distributed event streaming platform designed for high-throughput, fault-tolerant, and scalable real-time data pipelines and streaming applications.
tags:
  - technical-knowledge
  - kafka
  - intro
---

import KafkaIntroOverviewDiagram from '@site/src/components/KafkaIntroOverviewDiagram';

# Apache Kafka Knowledge Base

> A comprehensive reference guide covering Apache Kafka architecture, producer/consumer internal mechanics, stream processing, Exactly-Once Semantics (EOS), and production performance tuning with Java and Spring Boot.

---

## What is Apache Kafka?

Apache Kafka is a **distributed commit log** and event streaming platform designed for high-throughput, fault-tolerant, and horizontally scalable real-time data streaming.

<KafkaIntroOverviewDiagram />

Originally built at LinkedIn to replace monolithic message brokers, Kafka is designed around an append-only commit log stored on disk. Rather than destroying messages upon delivery, Kafka retains ordered records in partition log segments for configurable retention periods (`log.retention.hours`), allowing consumers to replay historical event streams at arbitrary offsets.

---

## Key Pillars of Kafka Architecture

| Pillar | Mechanism | Senior Engineering Advantage |
|---|---|---|
| **Append-Only Disk I/O** | Sequential writes to log segments (`.log`). | Achieves $100\text{--}500\text{ MB/sec}$ disk write bandwidth by eliminating random disk head seeks. |
| **Zero-Copy Transfers** | Linux `sendfile()` syscall. | DMA transfers bytes from OS Page Cache directly to NIC hardware without JVM heap memory allocation. |
| **Log Partitioning** | Parallel topics partitioned across broker nodes. | Scales read and write throughput linearly across clusters. |
| **ISR Replication** | In-Sync Replicas quorum tracking. | Provides tunable zero-data-loss durability (`acks=all` + `min.insync.replicas`). |

---

## Quick-Start with Spring Boot

### Dependency (`pom.xml`)

```xml
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka</artifactId>
</dependency>
```

### Application Configuration (`application.yml`)

```yaml
spring:
  kafka:
    bootstrap-servers: localhost:9092
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.apache.kafka.common.serialization.StringSerializer
      acks: all
      properties:
        enable.idempotence: true
    consumer:
      group-id: payment-processing-group
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      auto-offset-reset: earliest
      enable-auto-commit: false
```

### Producer Service

```java
@Service
@RequiredArgsConstructor
public class OrderEventPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;

    public CompletableFuture<SendResult<String, String>> publishOrderEvent(String orderId, String payload) {
        // Publishes asynchronously with key-based partition routing
        return kafkaTemplate.send("order-events", orderId, payload);
    }
}
```

### Consumer Listener

```java
@Component
public class OrderEventConsumer {

    @KafkaListener(topics = "order-events", groupId = "order-processor-group")
    public void handleOrderEvent(
            @Payload String payload,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset) {
        
        log.info("Processing order event from partition={} offset={}: {}", partition, offset, payload);
    }
}
```

---

## Interview Questions

### Q1. When should Kafka be chosen over a traditional message queue like RabbitMQ?
> Choose Kafka when building high-throughput event-driven systems requiring long-term message retention, replayability (consumers seeking back to past offsets), event sourcing, or stream processing. Choose RabbitMQ for complex message routing (AMQP topic exchanges, headers), flexible per-message queueing, or immediate message deletion upon consumption.

### Q2. What is the fundamental production trade-off in Kafka cluster tuning?
> The core trade-off is **Latency vs Durability vs Throughput**. Setting `acks=all`, `min.insync.replicas=2`, and `enable.idempotence=true` guarantees maximum durability and zero data loss, but increases producer write latency. Increasing `linger.ms=20` and `batch.size=65536` maximizes network throughput, but adds intentional micro-latency delays.

### Q3. How do you prevent hot partition bottlenecks in a production Kafka topic?
> Ensure partition key cardinality is high and uniformly distributed (e.g., UUID or account ID using MurmurHash2). Avoid low-cardinality keys like enum states ("PENDING", "COMPLETED") which route millions of records into a single partition while other partitions sit idle. If key skew is unavoidable, use custom partitioners with salt suffixes.

### Q4. What happens when a consumer group has more consumers than topic partitions?
> The max parallelism for a consumer group is strictly capped by the partition count of the subscribed topic. Excess consumers beyond the partition count will sit completely idle in the consumer group, receiving zero partition assignments until an active consumer crashes or unsubscribes.

---

## See Also

- [Kafka Architecture Overview](./core/kafka-overview.md)
- [Broker Storage Mechanics](./core/broker.md)
- [KRaft Consensus vs ZooKeeper](./core/kraft-vs-zookeeper.md)
