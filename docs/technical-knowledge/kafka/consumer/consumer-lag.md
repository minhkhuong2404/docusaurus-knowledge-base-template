---
id: consumer-lag
title: Consumer Lag & Poison Messages
sidebar_label: Consumer Lag & Poison Messages
description: Deep dive into Kafka consumer lag — offset mechanics, lag calculation, root cause diagnosis, scaling strategies, and poison message handling (DLQ, retry topics, skip strategies) for senior engineers.
tags:
  - kafka
  - consumer
  - consumer-lag
  - poison-messages
  - dlq
  - dead-letter-queue
  - monitoring
  - resilience
---

import KafkaConsumerLagPoisonDiagram from '@site/src/components/KafkaConsumerLagPoisonDiagram';

# Consumer Lag & Poison Messages in Kafka

<KafkaConsumerLagPoisonDiagram />

---

Consumer lag and poison messages represent the two most common operational degradation modes in Kafka consumer groups:

1. **Consumer Lag**: Indicates that consumer execution processing throughput is insufficient to keep pace with the producer write rate.
2. **Poison Messages**: Indicates a malformed or corrupt record payload that consistently causes consumer processing threads to throw unhandled exceptions and crash-loop, blocking the partition committed offset from advancing.

---

## Part 1: Consumer Lag Mechanics

### Lag Calculation Formula

$$\text{Partition Lag} = \text{Log End Offset (LEO)} - \text{Committed Offset}$$

```
Partition 0 Log:
[ Offset 0 | Offset 1 | Offset 2 | Offset 3 | Offset 4 | Offset 5 ] -> LEO = 6
                                              ^
                                    Committed Offset = 4
                                    (Lag = 6 - 4 = 2 records unread)
```

- **Log End Offset (LEO)**: Maintained by the partition leader broker. Represents the offset of the next record to be written.
- **Committed Offset**: Maintained by the consumer group in the `__consumer_offsets` system topic. Represents the next record offset the consumer will fetch upon restart.

---

## Part 2: Poison Messages & Dead Letter Queues (DLQ)

A **Poison Message** is a record payload that triggers non-retryable runtime exceptions (e.g., `NullPointerException`, `JsonParseException`, schema corruption) whenever a consumer thread attempts to process it.

```
Consumer Loop:
1. Poll batch containing Offset 104 (Poison Message).
2. Deserialization or Business Logic throws exception.
3. Exception Handler catches failure -> Consumer restarts or retries Offset 104.
4. Loop repeats endlessly: Committed Offset stays at 104; Partition 0 Lag grows infinitely!
```

### Production Poison Message Architecture (DLQ Pattern)

```
[ Incoming Topic ] ----> [ Consumer Listener ] --(Exception)--> [ Spring ErrorHandler ]
                                                                       |
                                                                       +---> [ DLQ Topic (.DLT) ]
                                                                       |
                                                                       +---> [ Commit Offset 104 ]
```

```java
// Spring Boot DLQ & Exponential Backoff Retry Configuration
@Configuration
public class KafkaConsumerConfig {

    @Bean
    public CommonErrorHandler errorHandler(KafkaTemplate<Object, Object> template) {
        // Send failed records after 3 retries (1s initial backoff, 2.0 multiplier) to DLT
        DefaultErrorHandler errorHandler = new DefaultErrorHandler(
            new DeadLetterPublishingRecoverer(template,
                (record, ex) -> new TopicPartition(record.topic() + ".DLT", record.partition())),
            new ExponentialBackOffWithMaxRetries(3)
        );
        
        // Add 1s initial interval and cap at 10s max backoff
        errorHandler.addNotRetryableExceptions(JsonParseException.class, IllegalArgumentException.class);
        return errorHandler;
    }
}
```

---

## Part 3: Root Cause Diagnostic Reference Matrix

| Diagnostic Signal | Root Cause | Remediation Strategy |
|---|---|---|
| **Asymmetric Single Partition Lag** | Poison Message blocking single partition consumer thread. | Route poison payload to DLQ (`.DLT`) and force offset commit. |
| **All Partitions Lag Growing** | Consumer group processing bottleneck (slow DB writes or API calls). | Add consumer instances (up to partition count); batch DB writes (`saveAll`). |
| **Lag Spikes with Frequent Rebalances** | Slow processing exceeding `max.poll.interval.ms`. | Reduce `max.poll.records` or enable `CooperativeStickyAssignor`. |

---

## Interview Questions

### Q1. What is Consumer Lag in Apache Kafka and how is it calculated?
> Consumer Lag is the numerical difference between the Log End Offset (LEO) of a partition log segment and the consumer group's Committed Offset for that partition ($\text{Lag} = \text{LEO} - \text{CommittedOffset}$). It measures how many unread records remain in the queue. A growing lag indicates consumer processing throughput cannot keep pace with producer write throughput.

### Q2. What is a Poison Message and why can it cause infinite lag on a single partition?
> A poison message is a corrupted or malformed record payload that triggers unhandled runtime exceptions during consumer processing. If exception handling is absent, the consumer fails to commit the offset, re-polls the identical poison record on the next iteration, and crash-loops continuously. This freezes the committed offset on that partition, causing partition lag to grow infinitely while other partitions process normally.

### Q3. What is the difference between `session.timeout.ms` and `max.poll.interval.ms`?
> `session.timeout.ms` is the maximum duration the Group Coordinator broker waits without receiving a **background thread heartbeat** before declaring a consumer instance dead. `max.poll.interval.ms` is the maximum duration allowed between explicit `poll()` calls from the **main processing thread**. If a consumer thread takes too long processing a batch, `max.poll.interval.ms` expires, evicting the consumer from the group and triggering a rebalance storm.

---

## See Also

- [Kafka Consumer Overview](./consumer-overview.md)
- [Kafka Consumer Group Rebalancing](./consumer-group.md)
- [Kafka Parallel Consumer Pattern](./parallel-consumer.md)
