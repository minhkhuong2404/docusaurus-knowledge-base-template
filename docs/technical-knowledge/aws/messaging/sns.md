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

## SNS vs SQS

| Feature | SNS | SQS |
|---|---|---|
| **Model** | Push (pub/sub) | Pull (queue) |
| **Persistence** | ❌ No (messages not stored) | ✅ Yes (up to 14 days) |
| **Consumers** | Many at once (all subscribers) | One consumer per message |
| **Use case** | Fan-out, alerts, notifications | Decoupling, buffering |

---

## Subscription Types

| Protocol | Use Case |
|---|---|
| **SQS** | Fan-out to a queue for async processing |
| **Lambda** | Direct serverless processing |
| **HTTP/HTTPS** | Webhook delivery |
| **Email / Email-JSON** | Human notifications |
| **SMS** | Mobile text messages |
| **Mobile Push** | APNs (iOS), FCM (Android), ADM |

---

## Fan-Out Pattern (SNS + SQS)

```
          [S3 Event / App]
                │
                ▼
           [SNS Topic]
          /     │     \
         ▼      ▼      ▼
      [SQS]  [SQS]  [Lambda]
      Queue  Queue
     (ETL)  (Audit) (Alert)
```

**Why not publish to multiple SQS directly?**
→ SNS fan-out is atomic: one publish → all subscribers in parallel.
→ Adding new consumers doesn't change the producer.

---

## Message Filtering

Each SQS subscription can define a **filter policy** so it only receives relevant messages:

```json
// Subscription filter — only receive orders from "electronics" category
{
  "category": ["electronics"],
  "price": [{ "numeric": [">=", 100] }]
}
```

Messages are published with **message attributes**, and SNS only delivers to matching subscriptions.

---

## SNS FIFO

- Ordered messages to **SQS FIFO** subscribers only
- Supports **deduplication** (same as SQS FIFO)
- Topic name must end in `.fifo`
- Lower throughput than standard SNS

---

## 🧪 Practice Questions

**Q1.** An e-commerce app publishes an `OrderPlaced` event. Three services need to process it: inventory, billing, and shipping. What is the BEST architecture?

A) One SQS queue per service, application publishes to all 3  
B) SNS Topic → 3 SQS subscriptions (fan-out)  
C) Kinesis Data Stream  
D) Direct Lambda invocation from the order service  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — The **SNS fan-out pattern** (SNS → multiple SQS queues) is the standard answer for "multiple consumers need the same event." Each service gets its own queue, decoupling processing speed and failure domains.
</details>

---

**Q2.** A notification system needs to send alerts via email to admins and via SMS to on-call engineers from the same alert. What SNS feature enables this?

A) Message Filtering  
B) Multiple Subscriptions on one Topic  
C) SNS FIFO  
D) Dead Letter Queue  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — SNS Topics support **multiple subscriptions** with different protocols. One email subscription + one SMS subscription receives every published message.
</details>

---

## 🔗 Resources

- [SNS Developer Guide](https://docs.aws.amazon.com/sns/latest/dg/)
- [SNS Message Filtering](https://docs.aws.amazon.com/sns/latest/dg/sns-message-filtering.html)
- [Fan-Out Pattern](https://aws.amazon.com/blogs/compute/messaging-fanout-pattern-for-serverless-architectures-using-amazon-sns/)
