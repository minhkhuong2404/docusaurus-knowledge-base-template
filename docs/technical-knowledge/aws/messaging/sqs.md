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

> **Core concept**: SQS **decouples** producers from consumers. Messages wait safely in the queue even if the consumer is down or slow.

---

## 🔰 What Is SQS?

SQS is a fully managed **message queuing service**. Think of it as a post office — senders drop letters (messages) in the mailbox (queue), and recipients pick them up at their own pace.

**Why decouple?** If your web server calls a payment service directly and the payment service is slow, your users wait. With SQS, the web server drops a message in the queue and responds immediately — the payment service processes it asynchronously.

---

## Standard vs FIFO Queue

| Feature | Standard | FIFO |
|---|---|---|
| **Throughput** | Unlimited | 300 TPS (3,000 with batching, 70K with high throughput) |
| **Ordering** | Best-effort | **Strict FIFO** (within message group) |
| **Delivery** | At-least-once (possible duplicates) | Exactly-once processing |
| **Deduplication** | ❌ | ✅ (5-minute dedup window) |
| **Message Groups** | ❌ | ✅ (parallel processing per group) |
| **Naming** | Any | Must end in `.fifo` |

### FIFO Message Group ID

```
Queue: orders.fifo
├── GroupID: "customer-A"  → Messages processed in order for customer A
├── GroupID: "customer-B"  → Messages processed in order for customer B
└── GroupID: "customer-C"  → Messages processed in order for customer C
                            ↑ Different groups process IN PARALLEL
```

### FIFO Deduplication

| Method | How |
|---|---|
| **Content-based** | SHA-256 hash of body (enable on queue) |
| **MessageDeduplicationId** | You provide a unique ID per message |

```java
sqsClient.sendMessage(SendMessageRequest.builder()
    .queueUrl("https://sqs.../orders.fifo")
    .messageBody("{\"orderId\": \"ORD-123\", \"action\": \"process\"}")
    .messageGroupId("customer-A")
    .messageDeduplicationId("ORD-123-process")  // Prevents duplicates in 5 min window
    .build());
```

:::tip[Exam: FIFO vs Standard Decision]
- **Financial transactions** → FIFO (order matters, no duplicates)
- **Log processing** → Standard (order doesn't matter, high throughput)
- **IoT telemetry** → Standard (volume matters more than order)
- **Order processing per customer** → FIFO with MessageGroupId = customerId
:::

---

## Key Parameters

| Parameter | Default | Max | Description |
|---|---|---|---|
| **Message retention** | 4 days | 14 days | How long messages stay in queue |
| **Visibility timeout** | 30 sec | 12 hours | Message hidden from others during processing |
| **Max message size** | 256 KB | 256 KB | Use SQS Extended Client for larger |
| **Delivery delay** | 0 sec | 15 min | Delay before message becomes visible |
| **Receive wait time** | 0 sec | 20 sec | Long polling duration |
| **Max receive count** | — | — | Before sending to DLQ |

---

## Visibility Timeout

```
Producer → [Message in Queue]
                │
Consumer receives message → message INVISIBLE for 30s (default)
                │
┌───────────────┴──────────────────────────┐
│ Consumer finishes in < 30s?              │
│   ✅ Delete message → DONE              │
│   ❌ Timeout → message reappears        │
│              → ANOTHER consumer picks up │
│              → DUPLICATE PROCESSING!     │
└──────────────────────────────────────────┘
```

### Setting Visibility Timeout

**Rule of thumb**: Set visibility timeout ≥ **6× your average processing time**

```java
// Extend visibility timeout if processing takes longer
sqsClient.changeMessageVisibility(ChangeMessageVisibilityRequest.builder()
    .queueUrl(queueUrl)
    .receiptHandle(message.receiptHandle())
    .visibilityTimeout(120)  // Extend to 2 minutes
    .build());
```

:::caution[Lambda + SQS Visibility Timeout]
When Lambda processes SQS via ESM, set visibility timeout ≥ **6× Lambda timeout**. Lambda auto-extends visibility for long-running functions, but the initial setting matters.
:::

---

## Dead Letter Queue (DLQ)

Amazon SQS supports dead letter queues (DLQs) to isolate unprocessable messages (poison pills) from healthy source queues. 

For the complete design principles, retention strategies, and exact CLI redrive instructions (`start-message-move-task`), see the centralized **[AWS SQS DLQ & Redrive](../../system-design/dead-letter-queue.md#sqs-redrive-aws-cli--java-sdk)** section.

---

## Long Polling vs Short Polling

| Type | Behavior | Cost | API Calls |
|---|---|---|---|
| **Short** (default) | Returns immediately (empty or not) | Higher | Many empty responses |
| **Long** | Waits up to 20s for a message | Lower | Fewer calls |

```java
// Long polling at queue level (all consumers)
sqsClient.setQueueAttributes(SetQueueAttributesRequest.builder()
    .queueUrl(queueUrl)
    .attributes(Map.of(QueueAttributeName.RECEIVE_MESSAGE_WAIT_TIME_SECONDS, "20"))
    .build());

// Or per-request long polling
ReceiveMessageResponse response = sqsClient.receiveMessage(ReceiveMessageRequest.builder()
    .queueUrl(queueUrl)
    .waitTimeSeconds(20)       // Long poll for up to 20s
    .maxNumberOfMessages(10)   // Batch up to 10 messages
    .build());
```

:::tip[Always enable long polling unless you need immediate response]
Long polling reduces SQS API costs and latency. Set `WaitTimeSeconds > 0`.
:::

---

## Lambda Integration (Event Source Mapping)

```
SQS Queue → Lambda ESM (managed polling) → Lambda Function
```

### Batch Processing with Partial Failures

```java
public class OrderProcessor implements RequestHandler<SQSEvent, SQSBatchResponse> {
    
    public SQSBatchResponse handleRequest(SQSEvent event, Context context) {
        List<SQSBatchResponse.BatchItemFailure> failures = new ArrayList<>();
        
        for (SQSEvent.SQSMessage msg : event.getRecords()) {
            try {
                Order order = parseOrder(msg.getBody());
                processOrder(order);
                // Success — message will be deleted from queue
            } catch (Exception e) {
                context.getLogger().log("Failed: " + msg.getMessageId());
                failures.add(SQSBatchResponse.BatchItemFailure.builder()
                    .withItemIdentifier(msg.getMessageId())
                    .build());
                // Only THIS message returns to queue
            }
        }
        
        return SQSBatchResponse.builder()
            .withBatchItemFailures(failures)
            .build();
    }
}
```

### ESM Configuration

```yaml
MyFunction:
  Type: AWS::Serverless::Function
  Properties:
    Events:
      SQSEvent:
        Type: SQS
        Properties:
          Queue: !GetAtt MyQueue.Arn
          BatchSize: 10
          MaximumBatchingWindowInSeconds: 5  # Wait up to 5s to fill batch
          FunctionResponseTypes:
            - ReportBatchItemFailures  # MUST enable for partial failures
```

---

## SQS Extended Client (Large Messages)

For messages >256KB, store payload in S3:

```java
// Producer stores large payload in S3, sends reference via SQS
AmazonSQSExtendedClient extendedSqsClient = new AmazonSQSExtendedClient(
    sqsClient,
    new ExtendedClientConfiguration()
        .withPayloadSupportEnabled(s3Client, "sqs-large-payloads-bucket")
        .withAlwaysThroughS3(false)  // Only use S3 for messages > 256KB
);

// Consumer automatically downloads from S3
```

---

## Patterns

### Fan-Out: SNS + SQS

```
Event → SNS Topic → SQS Queue 1 (service A)
                   → SQS Queue 2 (service B)
                   → SQS Queue 3 (service C)
```

### Throttling: SQS as Buffer

```
API Gateway (burst) → SQS Queue → Lambda (controlled concurrency)
```

Set Lambda ESM's `MaximumConcurrency` to control processing rate.

---

## 🎯 DVA-C02 Exam Tips

:::tip[SQS Exam Cheat Sheet]
1. **Visibility timeout** ≥ 6× processing time (prevents duplicates)
2. **FIFO** = guaranteed order + exactly-once. Standard = unlimited throughput
3. **DLQ** must be same type as source queue
4. **Long polling** reduces API costs (WaitTimeSeconds > 0)
5. **ReportBatchItemFailures** = partial batch failure handling
6. **Max message size** = 256 KB. Use Extended Client for larger
7. **Message retention** = max 14 days
8. **FIFO MessageGroupId** enables parallel processing per group
9. **Delay Queue** = delay message visibility up to 15 minutes
10. **Lambda + FIFO** = max 1 Lambda per message group
:::

---

## Practice Questions

**Q1.** Lambda takes 45s, visibility timeout is 30s. What happens?

A) Lambda timeout  
B) **Message reappears, may be processed twice**  
C) Lambda auto-extends timeout  
D) Message goes to DLQ  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — Visibility timeout expires at 30s while Lambda is still processing. Message becomes visible and another consumer can pick it up → duplicate processing.
</details>

---

**Q2.** Prevent duplicate messages within 5 minutes. Which feature?

A) Standard queue  
B) **FIFO queue deduplication**  
C) Visibility timeout  
D) DLQ  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — FIFO deduplication (MessageDeduplicationId or content-based) prevents duplicates within 5-minute window.
</details>

---

**Q3.** Reduce costs polling empty queue. What to configure?

A) Increase retention  
B) Enable FIFO  
C) **Long polling (WaitTimeSeconds > 0)**  
D) Reduce batch size  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — Long polling waits up to 20s for messages, reducing empty-response API calls.
</details>

---

**Q4.** Lambda processes 10 SQS messages. 1 fails. How to retry only the failed one?

A) Set maxReceiveCount to 1  
B) **Enable ReportBatchItemFailures, return failed messageId**  
C) Catch exception and ignore  
D) Use FIFO queue  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — With `ReportBatchItemFailures`, return only the failed messageId. The 9 successful messages are deleted; only the failed one returns to the queue.
</details>

---

## 🔗 Resources

- [SQS Developer Guide](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/)
- [SQS Best Practices](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-best-practices.html)
- [Lambda with SQS](https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html)
- [FIFO Queue](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/FIFO-queues.html)
