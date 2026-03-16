---
id: sqs
title: Amazon SQS
sidebar_label: "📬 SQS"
description: >
  Amazon SQS for DVA-C02 — standard vs FIFO queues, visibility timeout,
  message retention, DLQ, long polling, delay queues, and Lambda integration
  via Event Source Mapping. Key exam patterns covered.
tags:
  - sqs
  - messaging
  - queues
  - fifo
  - dlq
  - visibility-timeout
  - decoupling
  - dva-c02
  - domain-1
---

# Amazon SQS (Simple Queue Service)

> **Core concept**: SQS **decouples** producers from consumers. If the consumer is down, messages wait in the queue.

---

## Standard vs FIFO Queue

| Feature | Standard | FIFO |
|---|---|---|
| **Throughput** | Unlimited | 300 TPS (3,000 with batching) |
| **Ordering** | Best-effort | **Guaranteed** (first-in, first-out) |
| **Delivery** | At-least-once | Exactly-once processing |
| **Deduplication** | ❌ | ✅ (5-minute dedup window) |
| **Message Groups** | ❌ | ✅ (parallel per group) |
| **Naming** | Any | Must end in `.fifo` |

:::tip When to use FIFO
- Financial transactions (order matters)
- Sequential processing (step A must complete before step B)
- Deduplication needed (prevent double-charge)
:::

---

## Key Parameters

| Parameter | Default | Max | Description |
|---|---|---|---|
| **Message retention** | 4 days | 14 days | How long messages stay in queue |
| **Visibility timeout** | 30 sec | 12 hours | Hides message from other consumers while being processed |
| **Max message size** | 256 KB | 256 KB | Use S3 Extended Client for larger messages |
| **Delivery delay** | 0 sec | 15 min | Delay before message becomes visible (Delay Queue) |
| **Receive wait time** | 0 sec | 20 sec | Long polling duration |
| **Max receive count** | — | — | Before moving to DLQ |

---

## Visibility Timeout

```
Producer → [Message in Queue]
                │
Consumer receives message
Message is INVISIBLE for 30s (default)
                │
┌───────────────┴───────────────┐
│ Processed OK?                  │
│ ✅ Delete message              │
│ ❌ Timeout → message reappears │
└───────────────────────────────┘
```

:::caution
If your Lambda/consumer takes **longer than visibility timeout**, the message becomes visible again and another consumer may process it → **duplicate processing**.

Fix: Set visibility timeout > your function's max execution time, or call `ChangeMessageVisibility` to extend it.
:::

---

## Dead Letter Queue (DLQ)

```
Producer → [Main Queue]
                │ (fails maxReceiveCount times)
                ▼
           [Dead Letter Queue]
                │
           Monitor via CloudWatch
           Alert & debug failed messages
```

- DLQ must be the **same type** as source (Standard DLQ for Standard, FIFO DLQ for FIFO)
- Use **DLQ Redrive** to reprocess after fixing bugs

---

## Long Polling vs Short Polling

| Type | Behavior | Cost |
|---|---|---|
| **Short Polling** (default) | Returns immediately (even if empty) | More API calls, higher cost |
| **Long Polling** | Waits up to 20s for a message | Fewer API calls, lower latency |

```java
// Enable long polling on receive
ReceiveMessageRequest request = ReceiveMessageRequest.builder()
    .queueUrl(queueUrl)
    .waitTimeSeconds(20)  // Long polling
    .maxNumberOfMessages(10)
    .build();
```

---

## Lambda Integration (Event Source Mapping)

```
SQS Queue → Lambda ESM → Lambda Function
```

- Lambda polls SQS (managed by the ESM)
- Batch size: 1 – 10,000 messages
- **`ReportBatchItemFailures`** — return failed message IDs to avoid reprocessing successes

```java
public class SqsHandler implements RequestHandler<SQSEvent, SQSBatchResponse> {
    public SQSBatchResponse handleRequest(SQSEvent event, Context context) {
        List<SQSBatchResponse.BatchItemFailure> failures = new ArrayList<>();
        
        for (SQSEvent.SQSMessage msg : event.getRecords()) {
            try {
                processMessage(msg.getBody());
            } catch (Exception e) {
                // Only report this message as failed
                failures.add(SQSBatchResponse.BatchItemFailure.builder()
                    .withItemIdentifier(msg.getMessageId())
                    .build());
            }
        }
        return SQSBatchResponse.builder().withBatchItemFailures(failures).build();
    }
}
```

---

## 🧪 Practice Questions

**Q1.** A Lambda function processes SQS messages. The function takes 45 seconds. The visibility timeout is 30 seconds. What will happen?

A) Lambda will timeout and the message will be deleted  
B) The message will become visible and may be processed twice  
C) Lambda auto-extends the visibility timeout  
D) The message goes to the DLQ  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — When visibility timeout expires before the function finishes, the message becomes visible again and **another consumer can pick it up**, causing duplicate processing. Set visibility timeout ≥ Lambda timeout (+ buffer).
</details>

---

**Q2.** Which SQS feature guarantees that duplicate messages (same content within 5 minutes) are not delivered twice?

A) Standard Queue At-Least-Once delivery  
B) FIFO Queue Deduplication  
C) Visibility Timeout  
D) DLQ  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — **FIFO Queue Deduplication** (using MessageDeduplicationId or content-based hashing) prevents duplicate messages within a 5-minute deduplication window.
</details>

---

**Q3.** A developer wants to reduce API call costs when polling an empty SQS queue. What should they configure?

A) Increase message retention period  
B) Enable FIFO  
C) Enable **Long Polling** (set `WaitTimeSeconds` to up to 20)  
D) Reduce batch size  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — **Long polling** waits up to 20 seconds for messages, reducing empty-response API calls and cost compared to the default short polling.
</details>

---

## 🔗 Resources

- [SQS Developer Guide](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/)
- [SQS Best Practices](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-best-practices.html)
- [Lambda with SQS](https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html)
