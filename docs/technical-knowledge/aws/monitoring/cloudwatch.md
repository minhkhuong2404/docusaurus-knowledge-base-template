---
id: cloudwatch
title: Amazon CloudWatch
sidebar_label: "📊 CloudWatch"
description: >
  Amazon CloudWatch for DVA-C02. Metrics, custom metrics, alarms, logs,
  log insights, metric filters, dashboards, EventBridge, and Lambda
  monitoring patterns with Java examples.
tags:
  - cloudwatch
  - monitoring
  - observability
  - metrics
  - alarms
  - logs
  - dva-c02
  - domain-4
---

# Amazon CloudWatch

> **Core concept**: CloudWatch is AWS's central observability service — metrics, logs, alarms, and events in one place.

---

## Metrics

### Default Metrics (Free)
Auto-collected from AWS services:

| Service | Metrics |
|---|---|
| EC2 | CPUUtilization, NetworkIn/Out, DiskRead/Write |
| Lambda | Invocations, Errors, Duration, Throttles, ConcurrentExecutions |
| SQS | NumberOfMessagesSent, ApproximateNumberOfMessages, ApproximateAgeOfOldestMessage |
| API Gateway | Count, Latency, 4XXError, 5XXError |
| DynamoDB | ConsumedReadCapacityUnits, SuccessfulRequestLatency |

:::caution EC2 — RAM is NOT default
`MemoryUtilization` requires installing the **CloudWatch Agent** on the EC2 instance. This is a common exam trick question.
:::

### Custom Metrics

```java
CloudWatchClient cloudWatch = CloudWatchClient.create();

// Standard resolution (1-minute granularity) — free
cloudWatch.putMetricData(PutMetricDataRequest.builder()
    .namespace("MyApp/OrderProcessing")
    .metricData(MetricDatum.builder()
        .metricName("OrdersProcessed")
        .value(42.0)
        .unit(StandardUnit.COUNT)
        .timestamp(Instant.now())
        .dimensions(
            Dimension.builder().name("Environment").value("prod").build(),
            Dimension.builder().name("Service").value("order-service").build()
        )
        .build())
    .build());
```

| Resolution | Granularity | Cost |
|---|---|---|
| Standard | 1 minute | Free |
| High Resolution | 1 second | Higher |

---

## CloudWatch Alarms

```
Metric → Threshold → Alarm State → Action
```

### Alarm States

| State | Meaning |
|---|---|
| `OK` | Metric is within threshold |
| `ALARM` | Metric breached threshold |
| `INSUFFICIENT_DATA` | Not enough data to determine (usually on start) |

### Alarm Actions

| Action | Example |
|---|---|
| **SNS notification** | Email ops team |
| **Auto Scaling** | Scale EC2 fleet |
| **EC2 action** | Stop/reboot/recover/terminate instance |
| **Lambda invoke** | Custom remediation |

### Composite Alarms

```
ALARM if:
  (CPUAlarm AND MemoryAlarm)
  OR
  (ErrorRateAlarm AND LatencyAlarm)
```

Reduce alert noise by combining multiple alarms.

---

## CloudWatch Logs

### Log Groups and Log Streams

```
Log Group: /aws/lambda/my-function
  └── Log Stream: 2024/01/15/[$LATEST]abc123...
  └── Log Stream: 2024/01/15/[$LATEST]def456...
```

- **Log Group** = application / function (you define)
- **Log Stream** = single instance / execution environment

### Retention Policies

```yaml
# CloudFormation
LogGroup:
  Type: AWS::Logs::LogGroup
  Properties:
    LogGroupName: /aws/lambda/my-function
    RetentionInDays: 30   # Never expires by default!
```

:::caution Default = Never Expire
By default, log groups **never expire** — costs accumulate. Always set a retention policy!
:::

### Log Insights — Query Language

```sql
-- Find Lambda errors in the last hour
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 20

-- Lambda cold start detection
filter @message like /Init Duration/
| stats avg(@initDuration), count() by bin(5m)

-- P99 latency for Lambda
filter @type = "REPORT"
| stats pct(@duration, 99) as p99Latency by bin(1h)
```

### Metric Filters

Create a CloudWatch Metric from log patterns:

```
Log: "[ERROR] Payment failed for order-456"
           ↓ Metric Filter: "ERROR"
CloudWatch Metric: ErrorCount (increments by 1)
           ↓
CloudWatch Alarm: ErrorCount > 5 per minute → SNS alert
```

---

## CloudWatch Agent (EC2)

For collecting:
- Memory utilization
- Disk space
- Custom application logs
- Process-level metrics

```bash
# Install and configure on EC2
sudo yum install amazon-cloudwatch-agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
sudo systemctl start amazon-cloudwatch-agent
```

---

## EventBridge (formerly CloudWatch Events)

Schedule or react to AWS events:

```yaml
# SAM — trigger Lambda every 5 minutes
MyScheduledFunction:
  Type: AWS::Serverless::Function
  Properties:
    Events:
      ScheduleEvent:
        Type: Schedule
        Properties:
          Schedule: rate(5 minutes)
          # Or cron: cron(0 12 * * ? *)  → every day at noon UTC
```

---

## Lambda-Specific Metrics

| Metric | Description | Alert on |
|---|---|---|
| `Errors` | Invocation errors | > 0 |
| `Throttles` | Throttled invocations | > 0 in prod |
| `Duration` | Execution time (ms) | > 80% of timeout |
| `ConcurrentExecutions` | Live executions | Near account limit |
| `IteratorAge` | For ESM — age of Kinesis/DynamoDB records | Growing = consumer behind |

---

## 🧪 Practice Questions

**Q1.** A developer notices that Lambda is being throttled in production. They want to be alerted when throttles exceed 10 per minute. What should they set up?

A) X-Ray tracing  
B) CloudWatch Alarm on the `Throttles` metric with threshold > 10  
C) CloudWatch Log Metric Filter on Lambda logs  
D) SNS subscription to Lambda error notifications  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — The Lambda `Throttles` metric is a built-in CloudWatch metric. Create a **CloudWatch Alarm** with threshold `> 10` and an SNS notification action for immediate alerting.
</details>

---

**Q2.** A developer needs to monitor memory usage on an EC2 instance. They set up a CloudWatch alarm on `MemoryUtilization` but no data appears. Why?

A) EC2 doesn't support memory metrics  
B) The metric namespace is wrong  
C) **Memory is not a default EC2 metric** — the CloudWatch Agent must be installed  
D) The IAM role doesn't allow CloudWatch access  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — EC2 default metrics only include CPU, Network, and Disk I/O. **RAM/Memory** requires the **CloudWatch Agent** to be installed and configured on the instance.
</details>

---

**Q3.** A Lambda function logs errors in JSON format. A developer wants to count the number of `"status": "FAILED"` occurrences per minute. What is the correct approach?

A) Use X-Ray to count errors  
B) Create a **CloudWatch Metric Filter** on the log group matching `FAILED`, then create an alarm on the resulting metric  
C) Query CloudWatch Log Insights every minute via cron  
D) Use CloudWatch Contributor Insights  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — A **Metric Filter** continuously monitors log data and increments a custom metric whenever the pattern matches. This is more efficient than periodic Log Insights queries and supports real-time alarming.
</details>

---

**Q4.** What happens to CloudWatch Logs if no retention policy is set on a Log Group?

A) Logs are deleted after 90 days  
B) Logs are archived to S3 after 30 days  
C) **Logs are kept indefinitely** (never expire) — costs accumulate  
D) Logs are deleted after the default 7 days  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — By default, CloudWatch Log Groups have **no expiration** — logs are stored forever and you pay for storage. Always set a `RetentionInDays` policy.
</details>

---

## 🔗 Resources

- [CloudWatch User Guide](https://docs.aws.amazon.com/cloudwatch/)
- [Log Insights Query Syntax](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html)
- [CloudWatch Agent Configuration](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch-Agent-Configuration-File-Details.html)
- [Embedded Metrics Format (EMF)](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Embedded_Metric_Format.html)
