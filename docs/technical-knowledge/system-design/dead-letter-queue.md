---
id: dead-letter-queue
title: Dead Letter Queue (DLQ) Pattern
sidebar_label: Dead Letter Queue
description: A comprehensive guide to the Dead Letter Queue (DLQ) pattern in asynchronous messaging, outlining poison pill handling, visibility timeouts, AWS SQS, Spring Boot/Kafka/RabbitMQ configs, and production playbooks.
tags: [dead-letter-queue, dlq, poison-pills, system-design, retry-policies, messaging, reliability]
---

# Dead Letter Queue (DLQ) Pattern

> A Dead Letter Queue (DLQ) acts as a safety valve in asynchronous systems, isolating failed or unprocessable messages so they do not block healthy traffic.

---

## 👶 Beginner View: What is a DLQ?

Imagine a post office. Letters flow down a conveyor belt to sorting machines. Most letters are successfully stamped, sorted, and routed to their destination. 

However, occasionally a letter arrives that cannot be delivered:
- The address is written in a language the machine cannot read.
- The letter has no stamp or return address.
- The letter is physically torn or damaged (e.g., leaked ink).

**Without a DLQ:** If the sorting machine gets stuck on this unreadable letter, it halts the entire conveyor belt. Sorters pile up, subsequent healthy mail is delayed, and the entire post office grinds to a halt.

**With a DLQ:** When the machine detects an unreadable letter, it immediately ejects it into a separate bin labeled **"Unprocessable Mail"** (the Dead Letter Queue). The main conveyor belt keeps moving at full speed. At the end of the day, a human postal worker (the operator/engineer) goes through the unprocessable bin to manually inspect, repair, or discard the bad letters.

In distributed systems, a DLQ isolates **"poison pills"** (messages that consistently crash consumers) so that your worker pool does not get stuck in an infinite retry loop.

---

## 🏗️ Core System Design Concepts

```
Normal Queue ──► [ Consumer / Worker ] ── (fails maxReceiveCount times)
                        │
                        ▼ (Route to)
             [ Dead Letter Queue (DLQ) ]
                        │
                        ▼ (Operational Loop)
             Alert ──► Manual / Automated Redrive ──► Fix & Replay
```

### Poison Pills vs. Transient Failures
Understanding the root cause of a message failure dictates whether it should go to a DLQ immediately, be retried, or be dropped.

1. **Transient Failures (Retryable):**
   - *Causes:* Temporary database connection drop, downstream service timeout, network partition.
   - *Mitigation:* Retry with **exponential backoff and jitter**.
2. **Permanent Failures / Poison Pills (Non-Retryable):**
   - *Causes:* Malformed JSON payloads, type mismatch errors, missing required fields, illegal state transitions.
   - *Mitigation:* Bypassing standard retries and routing to a DLQ immediately to prevent resource starvation.

### Max Retry Threshold & Backoff
If a message fails, the consumer releases it back to the queue (or negative-acknowledges it). To avoid immediate redelivery storm, configure:
- **Max Receive Count (Max Retries):** The number of times a message is allowed to be attempted (typically 3 to 5) before being routed to the DLQ.
- **Visibility Timeout / Lease Expiry:** The duration the message remains hidden from other consumers while a worker processes it. If the worker crashes, the visibility timeout expires, and the message is released for another worker to try.

---

## 📬 AWS SQS DLQ & Redrive

In AWS, standard and FIFO SQS queues can be configured with a DLQ.

```
Producer ──► [ Source SQS Queue ]
                    │
                    ▼ (maxReceiveCount Exceeded)
             [ SQS Dead Letter Queue ]
                    │ (DLQ Redrive API)
                    ▼
          [ Back to Source Queue ]
```

### Configuration Rules
- **Queue Compatibility:** A FIFO source queue must use a **FIFO DLQ**. A Standard source queue must use a **Standard DLQ**.
- **Cross-Account DLQ:** SQS DLQs must reside in the same AWS account and region as the source queue.
- **Retention Period:** Set the DLQ retention period longer than the source queue (e.g., **14 days** on the DLQ vs. **4 days** on the source queue) to give engineers ample time to diagnose and fix the bugs before messages expire.

### CLI DLQ Redrive (Message Move Task)
Once the downstream bug is fixed, you can use SQS Redrive to move messages from the DLQ back to the source queue for reprocessing.

```bash
# Start a task to move messages back to the source queue
aws sqs start-message-move-task \
    --source-arn arn:aws:sqs:us-east-1:123456789012:orders-dlq \
    --destination-arn arn:aws:sqs:us-east-1:123456789012:orders-queue
```

---

## ⚡ Spring Boot & Event-Driven Configurations

### 1. Spring Boot + Kafka (Non-Blocking Retries & DLQ)
Spring Kafka provides a robust error-handling mechanism that redirects messages to a DLQ topic after a specified number of attempts without blocking the main partition thread.

```java
@Configuration
@EnableKafka
public class KafkaConfig {

    @Bean
    public CommonErrorHandler errorHandler(KafkaTemplate<Object, Object> template) {
        // Recoverer that sends the failed record to a .DLQ topic
        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(template,
            (record, exception) -> new TopicPartition(record.topic() + ".DLQ", record.partition())
        );

        // Retry 3 times with a 2-second fixed backoff before sending to DLQ
        return new DefaultErrorHandler(recoverer, new FixedBackoff(2000L, 3L));
    }
}
```

```java
@Component
public class OrderConsumer {

    @KafkaListener(topics = "orders", groupId = "order-group")
    public void consume(Order order) {
        if (order.getPrice() == null) {
            // Permanently malformed - will trigger the DefaultErrorHandler and route to orders.DLQ
            throw new IllegalArgumentException("Order price cannot be null");
        }
        processOrder(order);
    }
}
```

### 2. RabbitMQ DLQ Configuration (YAML)
RabbitMQ handles DLQ routing at the exchange/queue level via arguments specified during queue declaration.

```yaml
spring:
  rabbitmq:
    listener:
      simple:
        retry:
          enabled: true
          max-attempts: 3
          initial-interval: 1000ms
          multiplier: 2.0
```

```java
// Java Config declaring a queue with DLQ settings
@Bean
public Queue mainQueue() {
    return QueueBuilder.durable("orders-queue")
        .withArgument("x-dead-letter-exchange", "orders-dlx")
        .withArgument("x-dead-letter-routing-key", "orders-dlq-key")
        .build();
}

@Bean
public Queue dlQueue() {
    return QueueBuilder.durable("orders-dlq").build();
}
```

---

## 🔌 Kafka Connect DLQ

Kafka Connect allows routing invalid or unparseable source/sink records to a DLQ. This is crucial when a connector encounters a record that violates schema requirements.

### Configuration Properties
To enable DLQ routing for a connector, define the following properties in the connector JSON configuration:

```json
{
  "name": "mongodb-sink-connector",
  "config": {
    "connector.class": "hpg.mongodb.MongoSinkConnector",
    "topics": "orders",
    "errors.tolerance": "all",
    "errors.deadletterqueue.topic.name": "orders-dlq",
    "errors.deadletterqueue.topic.replication.factor": 3,
    "errors.deadletterqueue.context.headers.enable": true,
    "errors.log.enable": true,
    "errors.log.include.messages": true
  }
}
```

### DLQ Header Metadata
When Kafka Connect routes a message to a DLQ, it attaches critical metadata headers to help developers understand why the message failed:

- `input-record-topic`: The source topic of the failed record.
- `input-record-partition`: The partition where the record originally resided.
- `input-record-offset`: The offset of the original failed record.
- `exception-class`: The Java class of the exception that caused the failure.
- `exception-message`: The detailed error message (e.g., JSON parsing error).
- `exception-stacktrace`: The complete Java stack trace.

---

## ⚠️ Failure Modes & Production Playbooks

### 1. The Ordering vs. Latency Trade-Off
When a message fails and is sent to a DLQ, strict chronological processing order is broken.

```
Queue: [ Msg A (failed) ] ───► [ Msg B ] ───► [ Msg C ]

If A goes to DLQ:
- Consumer processes B and C (out of order!).
- If Msg B depends on state from Msg A, B will fail or create data corruption.
```

**Production Playbook:**
- If **strict ordering** is mandatory (e.g., banking ledgers, account state updates), you **cannot** use a standard DLQ. Instead, you must **pause the partition** on failure, raise a high-severity pager alert, and halt further processing until the issue is fixed.
- If **throughput** is more important than order (e.g., notifications, search syncs), routing to a DLQ is the correct path.

### 2. Visibility Timeout Saturation
If the queue visibility timeout is configured too close to the actual processing time, the message might reappear on the queue *before* the first worker has finished processing it. This leads to **duplicate processing** and potential resource exhaustion as multiple workers consume the same task.

**Rule of Thumb:** Configure visibility timeout to be at least **6 times** the average processing execution time of your tasks.

### 3. Monitoring & Alerts Checklist
A DLQ should remain empty under normal operating conditions. Set up Prometheus/Grafana alerts for:
- `QueueDepth` / `ApproximateNumberOfMessagesVisible` on the DLQ > 0 (Immediate alert).
- `AgeOfOldestMessage` in the DLQ approaching expiration limits.
- High rate of messages entering the DLQ (indicates a breaking API contract change or schema drift).
