---
id: sns
title: Amazon SNS
sidebar_label: "📢 SNS"
description: >
  Amazon SNS for DVA-C02. Topics, subscriptions, fan-out pattern with SQS,
  message filtering, SNS FIFO, mobile push notifications, and the difference
  between SNS and SQS.
tags:
  - sns
  - messaging
  - pub-sub
  - fan-out
  - notifications
  - dva-c02
  - domain-1
---

# Amazon SNS (Simple Notification Service)

> **Core concept**: SNS is a **pub/sub** service — one message published to a Topic is pushed to **all subscribers** simultaneously (fan-out).

---

## 🔰 What Is SNS?

Think of SNS as a radio broadcast — one speaker, many listeners. The publisher sends one message to a topic, and SNS delivers it to all subscribers in parallel. Compare with SQS where each message goes to exactly one consumer.

---

## SNS vs SQS

| Feature | SNS (Pub/Sub) | SQS (Queue) |
|---|---|---|
| **Model** | Push to all subscribers | Pull by one consumer |
| **Persistence** | ❌ No retention | ✅ Up to 14 days |
| **Consumers** | All subscribers get every message | One consumer per message |
| **Delivery** | Fire-and-forget | Guaranteed (with retries) |
| **Use case** | Fan-out, alerts, notifications | Decoupling, buffering, rate control |

### When to Use Both Together (Fan-Out)

```
S3 Event / Application Event
        │
        ▼
   [SNS Topic]  ← single publish
   /    │    \
  ▼     ▼     ▼
[SQS] [SQS] [Lambda]  ← multiple independent consumers
Queue  Queue  Function
(ETL) (Audit) (Alert)
```

**Why fan-out with SNS + SQS?**
1. **Atomic delivery** — one publish, all subscribers receive
2. **Consumer independence** — each queue processes at its own pace
3. **Failure isolation** — if audit service fails, ETL is unaffected
4. **Easy extension** — add new consumers without changing producer

---

## Subscription Protocols

| Protocol | Use Case | Retry |
|---|---|---|
| **SQS** | Async processing (fan-out) | SQS retains message |
| **Lambda** | Serverless processing | SNS retry policy |
| **HTTP/HTTPS** | Webhook delivery | 3 retries, then DLQ |
| **Email** | Human notifications | No retry |
| **SMS** | Mobile alerts | No retry |
| **Kinesis Data Firehose** | Stream to S3/Redshift | Managed |
| **Mobile Push** | APNs, FCM, ADM | Platform-specific |

---

## Message Filtering

Without filtering, ALL subscribers receive ALL messages. Filter policies let subscribers receive only relevant messages:

```json
// Publisher sends message with attributes:
{
  "MessageBody": "{\"orderId\": \"ORD-123\", \"amount\": 150}",
  "MessageAttributes": {
    "category": { "DataType": "String", "StringValue": "electronics" },
    "price": { "DataType": "Number", "StringValue": "150" },
    "region": { "DataType": "String", "StringValue": "us-east-1" }
  }
}
```

```json
// Subscription 1 filter: Only electronics over $100
{
  "category": ["electronics"],
  "price": [{ "numeric": [">=", 100] }]
}

// Subscription 2 filter: Only US regions
{
  "region": [{ "prefix": "us-" }]
}

// Subscription 3: No filter → receives ALL messages
```

### Filter Policy Scope

| Scope | Description |
|---|---|
| **MessageAttributes** (default) | Filter on message attributes |
| **MessageBody** | Filter on JSON body content (newer feature) |

---

## SNS FIFO

| Feature | Standard SNS | FIFO SNS |
|---|---|---|
| **Ordering** | Best-effort | Strict FIFO |
| **Deduplication** | ❌ | ✅ (5-min window) |
| **Throughput** | Nearly unlimited | 300 TPS (3,000 with batching) |
| **Subscribers** | All protocols | **SQS FIFO only** |
| **Naming** | Any | Must end in `.fifo` |

---

## SNS + Lambda DLQ

If Lambda subscription fails after retries:

```yaml
SNSTopic:
  Type: AWS::SNS::Subscription
  Properties:
    Protocol: lambda
    Endpoint: !GetAtt MyFunction.Arn
    TopicArn: !Ref MyTopic
    RedrivePolicy:
      deadLetterTargetArn: !GetAtt SNSFailureDLQ.Arn
```

---

## Java SDK — Publishing

```java
SnsClient snsClient = SnsClient.create();

// Publish with message attributes (for filtering)
snsClient.publish(PublishRequest.builder()
    .topicArn("arn:aws:sns:us-east-1:123:order-events")
    .message("{\"orderId\": \"ORD-123\", \"amount\": 150}")
    .messageAttributes(Map.of(
        "category", MessageAttributeValue.builder()
            .dataType("String").stringValue("electronics").build(),
        "price", MessageAttributeValue.builder()
            .dataType("Number").stringValue("150").build()))
    .build());

// FIFO topic
snsClient.publish(PublishRequest.builder()
    .topicArn("arn:aws:sns:us-east-1:123:order-events.fifo")
    .message("{\"orderId\": \"ORD-456\"}")
    .messageGroupId("customer-A")
    .messageDeduplicationId("ORD-456-event")
    .build());
```

---

## 🎯 DVA-C02 Exam Tips

:::tip[SNS Exam Cheat Sheet]
1. **Fan-out** = SNS → multiple SQS queues (classic exam pattern)
2. **Message filtering** = subscribers only receive relevant messages (saves processing)
3. **SNS FIFO** = only SQS FIFO subscribers supported
4. **No message persistence** — if subscriber is down, message is lost (use SQS for persistence)
5. **SNS + SQS** = reliable fan-out (SQS retains messages even if consumer is slow)
6. **Up to 12.5M subscriptions** per topic
7. **Message size**: 256 KB max
8. **Cross-account**: Use SNS access policy to allow other accounts to publish/subscribe
:::

---

## Practice Questions

**Q1.** OrderPlaced event needs to go to inventory, billing, and shipping services. Best architecture?

A) App publishes to 3 SQS queues  
B) **SNS Topic → 3 SQS subscriptions**  
C) Kinesis Data Stream  
D) Direct Lambda calls  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — SNS fan-out: one publish, all subscribers receive in parallel. Adding new consumers doesn't change the producer.
</details>

---

**Q2.** Only the billing service needs "electronics" orders above $100. Other services need all orders. How?

A) Separate SNS topics per category  
B) **SNS message filtering on the billing subscription**  
C) Lambda pre-processor  
D) SQS message groups  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — Filter policies on individual subscriptions. Billing gets `{"category": ["electronics"], "price": [{"numeric": [">=", 100]}]}`. Others have no filter.
</details>

---

**Q3.** SNS FIFO topic needs guaranteed ordering. Which subscriber types are supported?

A) Lambda, SQS, HTTP  
B) **SQS FIFO only**  
C) All subscriber types  
D) Lambda and SQS FIFO  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — SNS FIFO only supports **SQS FIFO** queue subscribers.
</details>

---

## 🔗 Resources

- [SNS Developer Guide](https://docs.aws.amazon.com/sns/latest/dg/)
- [SNS Message Filtering](https://docs.aws.amazon.com/sns/latest/dg/sns-message-filtering.html)
- [Fan-Out Pattern](https://aws.amazon.com/blogs/compute/messaging-fanout-pattern-for-serverless-architectures-using-amazon-sns/)
