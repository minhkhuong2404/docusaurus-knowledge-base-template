---
id: consumer-lag
title: Consumer Lag, Poison Messages & Retry Topics
sidebar_label: Consumer Lag & Retry Topics
description: Deep dive into Kafka consumer lag — offset mechanics, lag calculation, root cause diagnosis, scaling strategies, and non-blocking retry topics (DLQ, multi-tier backoff, 2-phase consumer commits).
tags:
  - kafka
  - consumer
  - consumer-lag
  - poison-messages
  - retry-topics
  - dlq
  - dead-letter-queue
  - monitoring
  - resilience
---

import KafkaConsumerLagPoisonDiagram from '@site/src/components/KafkaConsumerLagPoisonDiagram';
import KafkaRetryTopicsDiagram from '@site/src/components/KafkaRetryTopicsDiagram';

# Consumer Lag, Poison Messages & Retry Topics in Kafka

Consumer lag, poison messages, and retry handling represent the most frequent operational challenges in Kafka streaming systems:

1. **Consumer Lag**: Processing throughput is insufficient to keep pace with the producer write rate.
2. **Poison Messages**: Malformed payloads triggering unhandled runtime exceptions that cause crash-loops and freeze offset progress.
3. **Head-of-Line (HoL) Blocking**: In-place retries blocking all subsequent records in the partition log.

---

## Part 1: Consumer Lag Mechanics

<KafkaConsumerLagPoisonDiagram initialScenario="normal" />

### Lag Calculation Formula

$$\text{Partition Lag} = \text{Log End Offset (LEO)} - \text{Committed Offset}$$

- **Log End Offset (LEO)**: Maintained by the partition leader broker. Represents the offset of the next record to be written.
- **Committed Offset**: Stored by the consumer group in the `__consumer_offsets` internal topic. Represents the next record offset the consumer will fetch upon restart or rebalance.
- **Consumer Current Offset**: In-memory read position of the active consumer instance. If auto-commit is disabled, `Current Offset` may be far ahead of `Committed Offset`.

---

## Part 2: Poison Messages & Non-Blocking Retry Topics

A **Poison Message** is a record payload that triggers non-retryable exceptions (e.g., `JsonParseException`, schema corruption, null pointer) or transient dependency failures (e.g., downstream 503 HTTP errors, database connection pool exhaustion).

<KafkaRetryTopicsDiagram />

### Why Kafka Lacks Native Per-Message Retries

Unlike traditional message queues (AWS SQS, RabbitMQ) that manage individual message states, Kafka is a **continuous, append-only log with a single sequential offset cursor per partition**. 

If a consumer encounters an error on offset #42:
- It **cannot** skip offset #42, commit #43, and ask Kafka to "retry offset #42 later". Offsets are strictly sequential.
- If the thread sleeps in-place to retry, **Head-of-Line Blocking** occurs: records #43 through #10,000 are frozen behind it.
- If in-place retries exceed `max.poll.interval.ms` (default 5 minutes), the broker's Group Coordinator assumes the consumer is dead, evicts it from the group, and triggers an expensive **rebalance storm**.

### The Non-Blocking Retry Topics Architecture

To achieve production-grade error handling without Head-of-Line blocking, enterprise systems (Uber, Slack, Spring Kafka) implement **Multi-Tier Retry Topics with Dead Letter Queues**:

1. **Main Topic (`orders`)**: Consumer polls Record #42. If an exception occurs, the record is republished to `orders-retry-10s` with metadata headers (`x-retry-count: 1`, `x-original-offset: 42`, `x-exception-message`).
2. **Immediate Offset Commit**: The main consumer immediately commits offset #42 on the `orders` topic and advances to Record #43 without delay.
3. **Dedicated Retry Worker Pool**: A separate consumer group listens to `orders-retry-10s`. If the 10-second backoff window has not elapsed, the partition is paused via `consumer.pause()`. Once the delay expires, the record is retried.
4. **Escalation to Second Retry Topic**: If the retry fails, it is published to `orders-retry-1m` with `x-retry-count: 2`.
5. **Dead Letter Queue (DLQ)**: Once maximum retry attempts are exhausted, the payload is routed to `orders-dlq` alongside the root-cause stack trace for SRE investigation and manual redrive.

```java
// Spring Boot Non-Blocking Retry Topic Configuration
@Configuration
@EnableKafka
public class KafkaRetryConfig {

    @Bean
    public RetryTopicConfiguration retryTopicConfiguration(KafkaTemplate<String, Object> template) {
        return RetryTopicConfigurationBuilder
            .newInstance()
            .maxAttempts(3)
            .exponentialBackoff(10_000, 2.0, 60_000) // 10s initial, 2.0 multiplier, 60s max
            .autoCreateTopics(true, 6, (short) 3)
            .dltHandlerMethod("orderDltConsumer", "processDeadLetter")
            .excludeNamespaces(JsonParseException.class) // Non-retryable: go straight to DLT
            .create(template);
    }
}
```

---

## Part 3: Offset Commit Discipline & Consumer Stage Decoupling

In system design interviews, deciding **when to commit consumer offsets** is crucial for data consistency and recovery efficiency.

### Rule 1: Commit Only After External Durable Side-Effects

Never commit an offset until all durable downstream side effects have been successfully finalized.

> **System Design Case Study: Distributed Web Crawler**  
> In a web crawler, a consumer fetches URLs from Kafka, downloads raw HTML, and uploads it to an S3 blob storage bucket.
> - **Anti-Pattern**: Committing the Kafka offset right after downloading the HTML into memory. If the worker crashes before the S3 upload finishes, the URL is lost forever (data loss / at-most-once violation).
> - **Production Standard**: Commit the Kafka offset **only after** Amazon S3 returns HTTP 200 OK confirming the blob has been safely written. If the worker crashes before S3 finishes, the next consumer will safely re-fetch and re-download (at-least-once with idempotent S3 keys).

### Rule 2: Keep Consumer Tasks Small (The 2-Phase Pattern)

The more heavy computational work a consumer performs in a single poll loop, the more duplicated work must be redone when a consumer crashes or is rebalanced.

Break monolithic consumer processing pipelines into decoupled stages using intermediate Kafka topics:

```
Monolithic Pipeline (High Failure Blast Radius):
[ URL Queue ] ──> [ Worker: Download HTML (15s) + Parse DOM (5s) + Store to DB (2s) ] ──> Commit
                  (Failure at second 21 causes all 22s of work to be redone from scratch)

2-Phase Decoupled Pipeline (Minimal Redo on Failure):
[ URL Queue ] ──> [ Phase 1 Worker: Download HTML ] ──> Upload to S3 ──> Commit
                                                           │
                                                           ▼ Publish S3 URI (1 KB)
                                                [ HTML-Downloaded Topic ]
                                                           │
                                                           ▼
                                                [ Phase 2 Worker: Parse DOM & Extract Links ] ──> Commit
```

---

## Part 4: Root Cause Diagnostic Reference Matrix

| Diagnostic Signal | Root Cause | Remediation Strategy |
|---|---|---|
| **Asymmetric Single Partition Lag** | Poison Message or slow external API call on a single partition thread. | Route payload to retry topic / DLQ and commit offset immediately. |
| **All Partitions Lag Growing** | Consumer processing bottleneck (slow DB writes, lock contention). | Add consumer instances (up to partition count); batch DB writes (`saveAll`). |
| **Lag Spikes with Frequent Rebalances** | Processing latency exceeding `max.poll.interval.ms`. | Reduce `max.poll.records` (e.g. 500 ➔ 50) or implement thread pool dispatch with `ParallelConsumer`. |
| **Consumer Lag Drops to Zero Instantly** | Offset committed without processing or auto-commit enabled on unhandled failure. | Audit error handlers; disable `enable.auto.commit` in favor of manual synchronous commits. |

---

## Interview Questions & Answers

### Q1. What is Consumer Lag in Apache Kafka and how is it monitored?
> Consumer Lag is the numerical difference between the Log End Offset (LEO) of a partition log segment and the consumer group's Committed Offset ($\text{Lag} = \text{LEO} - \text{CommittedOffset}$). It represents the count of unread records queued in the partition. Lag is monitored via JMX metrics (`records-lag-max`), Prometheus `kafka_consumergroup_lag`, or CLI tools (`kafka-consumer-groups.sh --describe`). A persistently climbing lag indicates consumer throughput cannot match producer write volume.

### Q2. Why doesn't Kafka support per-message retries natively like AWS SQS or RabbitMQ?
> Kafka is designed as an immutable, append-only sequential commit log with a single scalar offset cursor per partition. SQS and RabbitMQ track individual message states (in-flight, acknowledged, dead-lettered) in broker memory. In Kafka, skipping an offset to retry later violates the sequential cursor abstraction. To achieve per-message retries in Kafka without blocking the partition, systems implement **Non-Blocking Retry Topics**: the failed record is republished to a delayed retry topic (`topic-retry-10s`), and the main consumer immediately commits the original offset to continue processing subsequent records.

### Q3. What is Head-of-Line (HoL) Blocking and how do you prevent it in Kafka consumers?
> Head-of-Line blocking occurs when a consumer thread encounters a failing or poison record and repeatedly sleeps or retries in-place. Because Kafka offsets are sequential, no subsequent records on that partition can be processed while the consumer is stuck on that single record. Furthermore, sleeping in-place risks exceeding `max.poll.interval.ms`, which causes the Group Coordinator to evict the consumer and trigger a rebalance storm. It is prevented by forwarding the failed record to a dedicated retry topic and immediately committing the offset on the main topic.

### Q4. When should a Kafka consumer commit its offsets in an event processing pipeline?
> A consumer should commit offsets **only after** all durable external side-effects (e.g. database transactions, S3 blob uploads, downstream API state mutations) are successfully completed. Committing before external writes introduces the risk of silent data loss if the process crashes. Furthermore, keep consumer processing stages small and decoupled (e.g. 2-phase download vs parsing pipeline) to minimize the blast radius and redundant work required if a consumer crashes before committing.

---

## See Also

- [Kafka Overview](../core/kafka-overview.md)
- [Kafka vs Traditional Queues](../core/kafka-vs-rabbitmq.md)
- [Consumer Groups & Rebalancing](./consumer-group.md)
- [Kafka Parallel Consumer Pattern](./parallel-consumer.md)
