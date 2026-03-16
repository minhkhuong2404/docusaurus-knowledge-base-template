---
id: cloudtrail
title: AWS CloudTrail
sidebar_label: "📋 CloudTrail"
description: >
  AWS CloudTrail for DVA-C02. Management events vs data events, event history,
  trails, CloudTrail Insights, integration with CloudWatch Logs, and
  the difference between CloudTrail and CloudWatch.
tags:
  - cloudtrail
  - audit
  - compliance
  - api-logging
  - security
  - dva-c02
  - domain-2
  - domain-4
---

# AWS CloudTrail

> **Core concept**: CloudTrail records **every API call** made in your AWS account — who did what, when, from where.

---

## CloudWatch vs CloudTrail

| | CloudWatch | CloudTrail |
|---|---|---|
| **What it monitors** | Resource performance & application logs | AWS API calls (who/what/when/where) |
| **Use case** | "My Lambda is erroring" | "Who deleted that S3 bucket?" |
| **Data type** | Metrics, logs | API events |
| **Retention** | Configurable | 90 days (free), longer via S3 trail |

---

## Event Types

| Type | Description | Examples |
|---|---|---|
| **Management Events** | Control plane — AWS resource operations | `CreateBucket`, `RunInstances`, `AssumeRole` |
| **Data Events** | Data plane — operations on data | `S3:GetObject`, `Lambda:Invoke`, `DynamoDB:PutItem` |
| **Insights Events** | Unusual API activity detection | Spike in `TerminateInstances` |

:::note Default is management events only
Data events are **not enabled by default** — they generate high volume (every S3 GET) and cost extra. Enable selectively.
:::

---

## Trails

- **Event History**: Free, 90-day rolling window, management events only
- **Trail**: Delivers events to **S3** (and optionally CloudWatch Logs) for long-term retention

```bash
# Create a trail
aws cloudtrail create-trail \
  --name my-audit-trail \
  --s3-bucket-name my-cloudtrail-logs \
  --include-global-service-events \
  --is-multi-region-trail    # Capture events from ALL regions
```

:::tip Multi-region trail
Always create a **multi-region trail** to capture API calls from all regions including global services (IAM, STS, CloudFront).
:::

---

## CloudTrail Insights

Detects **unusual API activity**:
- Error rate spikes
- Unexpected resource provisioning
- Service limit approaches

---

## Integration with CloudWatch

```
CloudTrail → S3 (raw events) → CloudWatch Logs (via trail config)
                                    ↓
                              Metric Filter → "Unauthorized API calls"
                                    ↓
                              CloudWatch Alarm → SNS → PagerDuty
```

---

## 🧪 Practice Questions

**Q1.** A security team needs to know who deleted an important DynamoDB table last Tuesday. Which service should they use?

A) CloudWatch Logs  
B) **CloudTrail Event History**  
C) X-Ray  
D) Config  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — **CloudTrail** records all `DeleteTable` API calls with the caller's identity, IP, time, and request parameters. CloudWatch tracks performance metrics, not API calls.
</details>

---

**Q2.** By default, CloudTrail Event History is retained for how long?

A) 7 days  
B) 30 days  
C) **90 days**  
D) 1 year  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — CloudTrail's built-in Event History retains management events for **90 days** at no charge. For longer retention or data events, create a Trail that delivers to S3.
</details>

---

## 🔗 Resources

- [CloudTrail User Guide](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/)
- [CloudTrail Event Reference](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-event-reference.html)
- [CloudTrail Insights](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/logging-insights-events-with-cloudtrail.html)
