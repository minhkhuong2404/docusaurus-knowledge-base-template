---
id: index
title: AWS Lambda
sidebar_label: "⚡ Lambda"
description: >
  Comprehensive Lambda study guide for DVA-C02. Covers invocation types,
  concurrency, cold starts, event source mappings, layers, container images,
  environment variables, VPC integration, destinations, and Java handler patterns.
tags:
  - lambda
  - serverless
  - compute
  - cold-start
  - concurrency
  - event-source-mapping
  - invocation
  - dva-c02
  - domain-1
---

# AWS Lambda

> **Exam Weight**: Domain 1 (Development) — Lambda is the **#1 most tested service** in DVA-C02.

---

## Key Facts

| Property | Value |
|---|---|
| **Max execution time** | 15 minutes |
| **Memory** | 128 MB – 10,240 MB (scales CPU proportionally) |
| **Ephemeral storage (`/tmp`)** | 512 MB – 10,240 MB |
| **Deployment package** | 50 MB (zipped), 250 MB (unzipped) |
| **Container image** | Up to 10 GB |
| **Max concurrent executions** | 1,000 per region (soft limit, can increase) |
| **Environment variables** | Max 4 KB total |

---

## Invocation Types

| Type | Behavior | Retries | Used With |
|---|---|---|---|
| **Synchronous** | Wait for response | None (caller handles errors) | API Gateway, SDK, CLI |
| **Asynchronous** | Fire and forget | 2 retries (with backoff) | S3, SNS, EventBridge |
| **Event Source Mapping** | Lambda polls the source | Configurable | SQS, Kinesis, DynamoDB Streams, MSK |

:::caution Retry behavior matters
- **Async**: Lambda retries up to **2 times** before sending to DLQ or EventBridge destination
- **ESM (SQS)**: Messages are not deleted until Lambda succeeds. If it fails, message becomes visible again (visibility timeout)
:::

---

## Event Source Mappings

| Source | Batching | Error Behavior |
|---|---|---|
| **SQS** | Up to 10,000 messages | Failed batch → back to queue or DLQ |
| **SQS FIFO** | Up to 10 messages | Blocks queue until processed |
| **Kinesis Data Streams** | 100 records or 1 shard | Iterator moves, old records may expire |
| **DynamoDB Streams** | Up to 10,000 records | Same as Kinesis |
| **MSK / Kafka** | Up to 10,000 records | Offset not committed on failure |

### Bisect on Error (Kinesis/DynamoDB Streams)
If a batch fails, Lambda can **split the batch** to identify the bad record, rather than retrying the entire batch.

---

## Concurrency

### Concurrency Calculation
```
Concurrency = (Requests per second) × (Average execution duration in seconds)
# Example: 100 RPS × 2s = 200 concurrent executions
```

### Types

| Type | Description |
|---|---|
| **Unreserved** | Shares the 1,000 account default |
| **Reserved** | Guarantees N concurrency for one function, limits it to N (throttles at N+1) |
| **Provisioned** | Pre-warms N execution environments — eliminates cold starts |

:::tip
Use **Provisioned Concurrency** for latency-sensitive APIs. Use **Reserved Concurrency** to prevent one function from starving others.
:::

---

## Cold Starts

A **cold start** occurs when Lambda needs to create a new execution environment:
1. Download code / container image
2. Start runtime (JVM for Java!)
3. Initialize static code / `@PostConstruct`
4. Execute handler

### Reducing Java Cold Starts

```java
// ❌ BAD — create clients inside handler (new cold start every time)
public class Handler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent event, Context context) {
        DynamoDbClient db = DynamoDbClient.create(); // Cold start hit!
        // ...
    }
}

// ✅ GOOD — initialize clients statically (reused across warm invocations)
public class Handler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    private static final DynamoDbClient DB = DynamoDbClient.create(); // Runs once on cold start
    
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent event, Context context) {
        // DB is already warm
    }
}
```

**Other cold start mitigations**:
- Provisioned Concurrency
- SnapStart (for Java 11+) — snapshots JVM after init, resumes from snapshot
- Use smaller deployment packages
- Use Lambda Layers to separate dependencies

---

## Lambda SnapStart (Java)

```yaml
# SAM template
MyFunction:
  Type: AWS::Serverless::Function
  Properties:
    Runtime: java11
    SnapStart:
      ApplyOn: PublishedVersions
```

- Takes a snapshot of the **initialized execution environment**
- Restores from snapshot instead of a full cold start
- ~10x faster cold starts for Java
- Requires `RequestHandler` to be idempotent

---

## Destinations

For **asynchronous** invocations, configure where Lambda sends results:

| Condition | Destination Targets |
|---|---|
| **On Success** | SQS, SNS, Lambda, EventBridge |
| **On Failure** | SQS, SNS, Lambda, EventBridge |

:::note DLQ vs Destinations
- **DLQ** (Dead Letter Queue) — failure only, supports SQS and SNS
- **Destinations** — both success and failure, more targets, newer feature
Prefer **Destinations** over DLQ for new implementations.
:::

---

## Environment Variables & Secrets

```java
// Read env variable
String tableName = System.getenv("TABLE_NAME");

// Read from Secrets Manager (with SDK, called at init time for caching)
private static final String SECRET = SecretsManagerClient.create()
    .getSecretValue(GetSecretValueRequest.builder()
        .secretId(System.getenv("SECRET_ARN"))
        .build())
    .secretString();
```

:::caution
Environment variables are **not encrypted at rest by default** — enable KMS encryption for sensitive values, or better yet, use Secrets Manager / Parameter Store.
:::

---

## VPC Integration

When Lambda is in a VPC:
- Can access **RDS, ElastiCache, internal services**
- **Cannot access the internet** unless you have a NAT Gateway
- **Cold starts increase** (ENI creation — mitigated since 2020 with hyperplane ENIs)

```
Lambda (in VPC) → Private Subnet → NAT Gateway → Internet Gateway → Internet
Lambda (in VPC) → VPC Endpoint → DynamoDB / S3 (no internet needed)
```

---

## Java Handler Patterns

```java
// Pattern 1: Plain POJO
public class MyHandler implements RequestHandler<Map<String, String>, String> {
    public String handleRequest(Map<String, String> event, Context context) {
        return "Hello " + event.get("name");
    }
}

// Pattern 2: API Gateway Proxy
public class ApiHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent event, Context context) {
        return new APIGatewayProxyResponseEvent()
            .withStatusCode(200)
            .withBody("{\"message\": \"OK\"}");
    }
}

// Pattern 3: Stream handler (for custom serialization)
public class StreamHandler implements RequestStreamHandler {
    public void handleRequest(InputStream in, OutputStream out, Context context) throws IOException {
        // Use Jackson/Gson directly
    }
}
```

---

## 🧪 Practice Questions

**Q1.** A Lambda function is triggered by an S3 `PutObject` event. The function fails. How many times will Lambda retry?

A) 0  
B) 1  
C) **2**  
D) 3  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — S3 uses **asynchronous invocation**. Lambda retries async failures up to **2 times** with exponential backoff, then sends to DLQ or Destination (on failure) if configured.
</details>

---

**Q2.** A Java Lambda function handles 500 requests/second, each taking 200ms on average. What is the required concurrency?

A) 50  
B) 100  
C) 200  
D) 500  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — `500 RPS × 0.2s = 100 concurrent executions`.
</details>

---

**Q3.** A developer wants to eliminate cold starts for a Java Lambda serving a critical low-latency API. What is the BEST solution?

A) Increase Lambda memory  
B) Use Reserved Concurrency  
C) Enable Provisioned Concurrency  
D) Reduce deployment package size  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — **Provisioned Concurrency** pre-initializes execution environments, eliminating cold starts. Reserved Concurrency limits concurrency but doesn't pre-warm. Memory increase speeds up init but doesn't eliminate cold starts.
</details>

---

**Q4.** Which Lambda feature allows a Java 11+ function to take a snapshot of the initialized JVM state and restore from it?

A) Provisioned Concurrency  
B) Reserved Concurrency  
C) Lambda Layers  
D) **Lambda SnapStart**  

<details>
<summary>✅ Answer & Explanation</summary>

**D** — **SnapStart** (Java 11+) takes a snapshot after `init` completes and restores from it, dramatically reducing cold start times for Java.
</details>

---

**Q5.** A Lambda function processes messages from an SQS queue in batches of 10. One message in a batch fails. What happens by default?

A) Only the failed message is retried  
B) The entire batch is returned to the queue  
C) The function is retried with only the failed message  
D) The failed message goes to a DLQ immediately  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — By default, if any message in an ESM batch fails, the **entire batch** is returned to the queue. To avoid reprocessing successful messages, use **`ReportBatchItemFailures`** in your Lambda response to report only the failed message IDs.
</details>

---

## 🔗 Resources

- [Lambda Developer Guide](https://docs.aws.amazon.com/lambda/latest/dg/)
- [Lambda with Java](https://docs.aws.amazon.com/lambda/latest/dg/java-handler.html)
- [Lambda SnapStart](https://docs.aws.amazon.com/lambda/latest/dg/snapstart.html)
- [Lambda Concurrency](https://docs.aws.amazon.com/lambda/latest/dg/configuration-concurrency.html)
- [AWS Lambda Power Tuning Tool](https://github.com/alexcasalboni/aws-lambda-power-tuning)
