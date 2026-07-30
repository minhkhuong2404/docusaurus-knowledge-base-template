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

## 🔰 What Is AWS Lambda?

AWS Lambda is a **serverless compute service** that runs your code in response to events — without provisioning or managing servers. You pay only for the compute time you consume, billed in 1ms increments.

**Analogy for beginners**: Think of Lambda like a vending machine. You don't own the machine (no servers to manage). You put in a coin (trigger an event), press a button (invoke the function), and get your snack (response). When nobody uses it, you pay nothing.

### When to Use Lambda

| ✅ Use Lambda When | ❌ Don't Use Lambda When |
|---|---|
| Event-driven processing (S3 uploads, API calls) | Long-running processes (>15 min) |
| Unpredictable/spiky traffic | Consistent high-throughput (consider ECS/EC2) |
| Microservice backends | Stateful applications needing persistent connections |
| Scheduled tasks (cron jobs) | GPU-intensive workloads |
| Data transformation pipelines | Applications needing full OS control |

---

## Key Facts & Limits

| Property | Value |
|---|---|
| **Max execution time** | 15 minutes (900 seconds) |
| **Memory** | 128 MB – 10,240 MB (scales CPU proportionally) |
| **vCPUs** | 2 at 1,769 MB; 6 at 10,240 MB |
| **Ephemeral storage (`/tmp`)** | 512 MB – 10,240 MB |
| **Deployment package (zip)** | 50 MB zipped, 250 MB unzipped |
| **Container image** | Up to 10 GB |
| **Max concurrent executions** | 1,000 per region (soft limit) |
| **Environment variables** | Max 4 KB total |
| **Layers** | Max 5 per function |
| **Timeout** | Default 3s, max 900s |
| **Burst concurrency** | 500–3,000 (varies by region) |

:::caution[Memory = CPU]
Lambda allocates CPU power **proportional to memory**. At 1,769 MB you get 1 full vCPU. If your function is CPU-bound (e.g., JSON parsing, encryption), **increasing memory can reduce execution time and cost**.
:::

---

## Lambda Execution Lifecycle

Understanding the lifecycle is critical for performance optimization:

```
┌─────────────────────────────────────────────────────────┐
│                    COLD START                            │
│  1. Download code/container image                       │
│  2. Create execution environment (microVM)              │
│  3. Initialize runtime (JVM, Node.js, Python)           │
│  4. Run INIT code (static blocks, global scope)         │
│  ← This is the "init" phase (up to 10s for init)  →    │
├─────────────────────────────────────────────────────────┤
│                    INVOKE (handler)                      │
│  5. Execute handler function                            │
│  ← Billed duration starts here →                        │
├─────────────────────────────────────────────────────────┤
│                    WARM INVOCATION                       │
│  6. Reuse existing environment → skip steps 1-4         │
│  ← Much faster! →                                       │
├─────────────────────────────────────────────────────────┤
│                    SHUTDOWN                              │
│  7. After ~5-15 min of inactivity, environment frozen   │
│  8. Eventually destroyed                                │
└─────────────────────────────────────────────────────────┘
```

:::tip[Senior Insight]
The INIT phase has its own **10-second timeout** separate from the function timeout. If your static initializers (DB connections, SDK clients) take longer than 10s, the function fails before the handler even runs.
:::

---

## Invocation Types

| Type | Behavior | Retries | Used With |
|---|---|---|---|
| **Synchronous** | Caller waits for response | None (caller handles) | API Gateway, SDK, CLI, ALB, Cognito |
| **Asynchronous** | Fire and forget | 2 retries (backoff) | S3, SNS, EventBridge, SES, CloudFormation |
| **Event Source Mapping** | Lambda polls the source | Configurable | SQS, Kinesis, DynamoDB Streams, MSK, MQ |

### Synchronous Invocation Deep Dive

```java
// SDK call — synchronous by default
LambdaClient lambda = LambdaClient.create();
InvokeResponse response = lambda.invoke(InvokeRequest.builder()
    .functionName("my-function")
    .invocationType(InvocationType.REQUEST_RESPONSE) // synchronous
    .payload(SdkBytes.fromUtf8String("{\"key\":\"value\"}"))
    .build());

// Check for function errors (200 status but function threw exception)
if (response.functionError() != null) {
    // Handle error — response.payload() contains error details
}
```

### Asynchronous Invocation Deep Dive

```
Client → Lambda Service → Internal Queue → Lambda Function
                                         ↓ (on failure after 2 retries)
                                    DLQ or Destination
```

- Lambda adds the event to an **internal queue** and returns `202 Accepted` immediately
- Retries: **2 times** with exponential backoff (1 min, then 2 min)
- Configure **MaximumRetryAttempts** (0-2) and **MaximumEventAge** (60s–6hrs)
- After retries exhausted → sent to **DLQ** or **Destination (on failure)**

```bash
# Configure async invocation settings
aws lambda put-function-event-invoke-config \
    --function-name my-function \
    --maximum-retry-attempts 1 \
    --maximum-event-age-in-seconds 3600 \
    --destination-config '{
        "OnSuccess": {"Destination": "arn:aws:sqs:...:success-queue"},
        "OnFailure": {"Destination": "arn:aws:sqs:...:failure-queue"}
    }'
```

:::caution[Retry behavior matters on exam]
- **Async**: Lambda retries up to **2 times** before sending to DLQ/Destination
- **ESM (SQS)**: Messages not deleted until Lambda succeeds. If it fails, message becomes visible again after visibility timeout
- **ESM (Kinesis/DynamoDB)**: Blocks the shard until success or record expires
:::

---

## Event Source Mappings (ESM)

Lambda **polls** these sources — you don't configure the source to invoke Lambda.

| Source | Batch Size | Error Behavior |
|---|---|---|
| **SQS Standard** | 1–10,000 | Failed batch → back to queue or DLQ |
| **SQS FIFO** | Up to 10 | Blocks message group until processed |
| **Kinesis Data Streams** | 1–10,000 | Blocks shard; use bisect/skip |
| **DynamoDB Streams** | 1–10,000 | Same as Kinesis |
| **MSK / Self-managed Kafka** | 1–10,000 | Offset not committed on failure |
| **Amazon MQ** | 1–10,000 | Requeue on failure |

### ReportBatchItemFailures (Critical for Exam!)

By default, if **any** message in an SQS batch fails, the **entire batch** returns to the queue. To avoid reprocessing successful messages:

```java
// Return only failed message IDs
public class SQSBatchHandler implements RequestHandler<SQSEvent, SQSBatchResponse> {
    public SQSBatchResponse handleRequest(SQSEvent event, Context context) {
        List<SQSBatchResponse.BatchItemFailure> failures = new ArrayList<>();
        
        for (SQSEvent.SQSMessage message : event.getRecords()) {
            try {
                processMessage(message);
            } catch (Exception e) {
                // Report ONLY this message as failed
                failures.add(SQSBatchResponse.BatchItemFailure.builder()
                    .itemIdentifier(message.getMessageId())
                    .build());
            }
        }
        return SQSBatchResponse.builder()
            .batchItemFailures(failures)
            .build();
    }
}
```

### Bisect on Error (Kinesis/DynamoDB Streams)

If a batch fails, Lambda can **split the batch in half** recursively to isolate the bad record, rather than retrying the entire batch.

### Event Filtering

Filter which events trigger your Lambda **before** invocation (saves cost):

```json
{
  "FilterCriteria": {
    "Filters": [{
      "Pattern": "{\"body\": {\"status\": [\"CRITICAL\"]}}"
    }]
  }
}
```

---

## Concurrency

### Concurrency Calculation

```
Concurrency = (Requests per second) × (Average duration in seconds)

Example: 100 RPS × 2s duration = 200 concurrent executions
Example: 1000 RPS × 0.1s duration = 100 concurrent executions
```

### Types of Concurrency

| Type | Description | Use Case |
|---|---|---|
| **Unreserved** | Shares the 1,000 account pool | Default for all functions |
| **Reserved** | Guarantees N for this function, caps at N | Prevent starvation; throttle non-critical |
| **Provisioned** | Pre-warms N environments | Eliminate cold starts for critical APIs |

```
Account limit: 1,000 concurrent executions
├── Function A: Reserved = 200 (guaranteed 200, never exceeds 200)
├── Function B: Reserved = 100
└── Remaining: 700 shared by all unreserved functions
```

:::tip[Best Practice]
- Use **Reserved** to prevent one function from consuming all concurrency
- Use **Provisioned** for latency-sensitive APIs (eliminates cold starts)
- Set Reserved = 0 to **throttle/disable** a function without deleting it
:::

### Throttling Behavior

When concurrency limit is reached:
- **Synchronous**: Returns `429 TooManyRequestsException`
- **Asynchronous**: Retries internally, then sends to DLQ/Destination
- **ESM**: Reduces polling rate

---

## Cold Starts

A **cold start** occurs when Lambda creates a new execution environment:

### Cold Start Timeline

| Phase | Java | Python | Node.js |
|---|---|---|---|
| Download code | ~100ms | ~50ms | ~50ms |
| Start runtime | ~2-5s (JVM!) | ~100ms | ~100ms |
| Initialize code | ~1-3s (DI, SDK) | ~200ms | ~200ms |
| **Total cold start** | **3-8s** | **~350ms** | **~350ms** |

### Reducing Java Cold Starts

```java
// ❌ BAD — creates SDK clients inside handler (every cold start)
public class Handler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent event, Context context) {
        DynamoDbClient db = DynamoDbClient.create(); // Cold start hit every time!
        // ...
    }
}

// ✅ GOOD — static initialization (reused across warm invocations)
public class Handler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    // Runs ONCE on cold start, reused for all subsequent invocations
    private static final DynamoDbClient DB = DynamoDbClient.create();
    private static final ObjectMapper MAPPER = new ObjectMapper();
    
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent event, Context context) {
        // DB client is already warm — no init cost
    }
}
```

### All Cold Start Mitigation Strategies

| Strategy | Cold Start Reduction | Cost | Complexity |
|---|---|---|---|
| **Provisioned Concurrency** | Eliminates | High (pay for idle) | Low |
| **SnapStart (Java 11+)** | ~90% reduction | Free | Low |
| **Smaller packages** | Moderate | Free | Low |
| **Lambda Layers** | Moderate | Free | Medium |
| **ARM64 (Graviton2)** | ~10-15% faster | 20% cheaper | Low |
| **Tiered compilation** | Moderate | Free | Low |
| **GraalVM native image** | Near-zero | Free | Very High |

---

## Lambda SnapStart (Java)

SnapStart takes a **CRaC snapshot** of the initialized JVM and restores from it:

```yaml
# SAM template
MyFunction:
  Type: AWS::Serverless::Function
  Properties:
    Runtime: java17
    SnapStart:
      ApplyOn: PublishedVersions  # Only works with published versions
```

**How it works**:
1. On `PublishVersion`, Lambda initializes the function and takes a Firecracker microVM snapshot
2. On invocation, it restores from the snapshot (~200ms vs 5s+)
3. ~10x faster cold starts for Java

**Important constraints**:
- Only works with **published versions** (not `$LATEST`)
- Must handle **uniqueness** — cached random values, connections, and temp files from snapshot time are reused
- Use `CRaC` hooks or `afterRestore()` to re-initialize connections

```java
// Handle SnapStart restore — re-seed random, refresh connections
import org.crac.Context;
import org.crac.Core;
import org.crac.Resource;

public class Handler implements RequestHandler<String, String>, Resource {
    private static final SecureRandom random = new SecureRandom();
    
    public Handler() {
        Core.getGlobalContext().register(this); // Register for CRaC hooks
    }
    
    @Override
    public void afterRestore(Context<? extends Resource> context) {
        // Re-seed after snapshot restore to avoid predictable values
        random.setSeed(random.generateSeed(20));
    }
}
```

---

## Destinations

For **asynchronous** invocations, configure where Lambda sends results:

| Condition | Supported Targets |
|---|---|
| **On Success** | SQS, SNS, Lambda, EventBridge |
| **On Failure** | SQS, SNS, Lambda, EventBridge |

:::note[DLQ vs Destinations]
| Feature | DLQ | Destinations |
|---|---|---|
| Success handling | ❌ No | ✅ Yes |
| Failure handling | ✅ Yes | ✅ Yes |
| Targets | SQS, SNS only | SQS, SNS, Lambda, EventBridge |
| Metadata | Limited | Full context (request, response, error) |
| **Recommendation** | Legacy | **Use Destinations** for new projects |
:::

---

## Environment Variables & Secrets

```java
// Read env variable
String tableName = System.getenv("TABLE_NAME");
String stage = System.getenv("STAGE");

// Read from Secrets Manager — cache at INIT time
private static final String DB_PASSWORD;
static {
    SecretsManagerClient sm = SecretsManagerClient.create();
    DB_PASSWORD = sm.getSecretValue(GetSecretValueRequest.builder()
        .secretId(System.getenv("DB_SECRET_ARN"))
        .build())
        .secretString();
}
```

:::caution[Security]
- Environment variables are visible in the Lambda console by default
- Enable **KMS encryption** for sensitive values, or use **Secrets Manager / SSM Parameter Store**
- Use the **AWS Parameters and Secrets Lambda Extension** to cache secrets (avoids SDK calls)
:::

---

## Lambda Function URLs

A dedicated HTTPS endpoint for your function — no API Gateway needed.

| Feature | Function URL | API Gateway |
|---|---|---|
| **Cost** | Free (pay for Lambda only) | Per-request pricing |
| **WAF** | ❌ | ✅ |
| **Throttling** | ❌ (use reserved concurrency) | ✅ |
| **Custom domains** | ❌ (use CloudFront) | ✅ |
| **Auth** | IAM or None | IAM, Cognito, Lambda Authorizer |
| **CORS** | ✅ Built-in | ✅ |

**Best for**: Webhooks, single-function backends, service-to-service calls where API Gateway features aren't needed.

---

## VPC Integration

```
Lambda (in VPC) → Private Subnet → NAT Gateway → Internet Gateway → Internet
Lambda (in VPC) → VPC Endpoint → DynamoDB / S3 (no internet needed, free for Gateway endpoints)
Lambda (no VPC) → Internet (default, no NAT needed)
```

| Consideration | Details |
|---|---|
| **Access private resources** | RDS, ElastiCache, internal ALBs |
| **Internet access** | Requires NAT Gateway in public subnet |
| **AWS services without internet** | Use VPC Endpoints (Gateway for S3/DynamoDB, Interface for others) |
| **Cold start impact** | Minimal since 2019 (Hyperplane ENI) |
| **Security groups** | Lambda gets an ENI with a security group |

---

## AWS Lambda Powertools (Java)

For **production-grade** serverless apps, use Powertools for structured observability:

```java
public class OrderHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    @Tracing          // Auto X-Ray tracing + cold start annotation
    @Metrics(captureColdStart = true)  // Auto CloudWatch EMF metrics
    @Logging(logEvent = true)          // Structured JSON logs with correlation IDs
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent event, Context context) {
        
        // Custom metric
        MetricsUtils.metricsLogger().putMetric("OrderProcessed", 1, Unit.COUNT);
        
        // Custom tracing annotation (searchable in X-Ray)
        TracingUtils.putAnnotation("orderId", "ORD-123");
        
        // Structured log
        LoggingUtils.appendKey("orderId", "ORD-123");
        
        return new APIGatewayProxyResponseEvent().withStatusCode(200);
    }
}
```

---

## Java Handler Patterns

```java
// Pattern 1: POJO Handler (simple)
public class PojoHandler implements RequestHandler<Map<String, String>, String> {
    public String handleRequest(Map<String, String> event, Context context) {
        context.getLogger().log("Remaining time: " + context.getRemainingTimeInMillis() + "ms");
        return "Hello " + event.get("name");
    }
}

// Pattern 2: API Gateway Proxy (most common)
public class ApiHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent event, Context context) {
        String body = event.getBody();
        Map<String, String> queryParams = event.getQueryStringParameters();
        Map<String, String> pathParams = event.getPathParameters();
        
        return new APIGatewayProxyResponseEvent()
            .withStatusCode(200)
            .withHeaders(Map.of("Content-Type", "application/json"))
            .withBody("{\"message\": \"OK\"}");
    }
}

// Pattern 3: Stream Handler (custom serialization, large payloads)
public class StreamHandler implements RequestStreamHandler {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    
    public void handleRequest(InputStream in, OutputStream out, Context context) throws IOException {
        JsonNode input = MAPPER.readTree(in);
        Map<String, String> response = Map.of("processed", input.get("data").asText());
        MAPPER.writeValue(out, response);
    }
}
```

---

## 🏆 Best Practices

### Performance
1. **Initialize SDK clients outside the handler** — reused across warm invocations
2. **Set memory based on workload** — use [Lambda Power Tuning](https://github.com/alexcasalboni/aws-lambda-power-tuning) to find optimal
3. **Use ARM64 (Graviton2)** — 20% cheaper, often 10-15% faster
4. **Minimize deployment package** — remove unused dependencies, use ProGuard/R8

### Cost
1. **Right-size memory** — over-provisioning wastes money, under-provisioning wastes time
2. **Use Provisioned Concurrency sparingly** — only for latency-critical paths
3. **Set appropriate timeouts** — don't use 15 min when your function takes 3 seconds
4. **Use event filtering** — avoid invoking Lambda for events you'll discard

### Security
1. **Use least-privilege IAM roles** — one role per function
2. **Never hardcode secrets** — use Secrets Manager or SSM Parameter Store
3. **Enable X-Ray tracing** for production functions
4. **Set reserved concurrency** to prevent runaway costs

### Error Handling
1. **Always configure a DLQ or Destination** for async invocations
2. **Use `ReportBatchItemFailures`** for SQS ESM to avoid reprocessing
3. **Implement idempotency** — events may be delivered more than once
4. **Use Powertools Idempotency module** for automatic deduplication

---

## 🔧 Troubleshooting Guide

| Symptom | Cause | Solution |
|---|---|---|
| `Task timed out after X seconds` | Function exceeds timeout | Increase timeout or optimize code |
| `Runtime exited with error: signal: killed` | Out of memory | Increase memory allocation |
| `TooManyRequestsException` (429) | Concurrency limit hit | Increase reserved concurrency or request limit increase |
| `AccessDeniedException` | IAM role missing permissions | Add required permissions to execution role |
| Function can't reach internet | Lambda in VPC without NAT | Add NAT Gateway or use VPC endpoints |
| Cold starts >5s (Java) | JVM startup + dependency init | Use SnapStart, Provisioned Concurrency, or optimize init |
| `InvalidParameterValueException` on deploy | Package too large | Use layers, remove unused deps, or use container image |

---

## 🎯 DVA-C02 Exam Tips

:::tip[Lambda Exam Cheat Sheet]
1. **Invocation type identification**: S3/SNS/EventBridge = Async. SQS/Kinesis/DynamoDB Streams = ESM. API Gateway/SDK = Sync
2. **502 from API Gateway** = Lambda response format wrong (missing `statusCode`/`body`)
3. **504 from API Gateway** = Lambda took >29 seconds (API Gateway hard limit)
4. **SnapStart** requires `PublishedVersions` — doesn't work with `$LATEST`
5. **Provisioned Concurrency** eliminates cold starts; **Reserved** only caps concurrency
6. **SQS batch failure** → default re-queues entire batch. Use `ReportBatchItemFailures`
7. **Kinesis shard blocked** → use Bisect on Error + configure MaxRetryAttempts
8. **Lambda@Edge** runs at CloudFront edge locations (viewer/origin request/response)
9. **Function URL auth**: `AWS_IAM` (SigV4) or `NONE` (public)
10. **Environment variable limit**: 4 KB total. Use SSM/Secrets Manager for larger configs
:::

---

## Practice Questions

**Q1.** A Lambda function is triggered by an S3 `PutObject` event. The function fails. How many times will Lambda retry?

A) 0  
B) 1  
C) **2**  
D) 3  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — S3 triggers use **asynchronous invocation**. Lambda retries async failures up to **2 times** with exponential backoff (1 min, 2 min), then sends to DLQ/Destination if configured.
</details>

---

**Q2.** A Java Lambda handles 500 RPS, each taking 200ms. What concurrency is needed?

A) 50  
B) **100**  
C) 200  
D) 500  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — `500 × 0.2 = 100 concurrent executions`.
</details>

---

**Q3.** A developer wants to eliminate cold starts for a critical Java API. What is the BEST solution?

A) Increase Lambda memory  
B) Use Reserved Concurrency  
C) **Enable Provisioned Concurrency**  
D) Reduce deployment package size  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — **Provisioned Concurrency** pre-initializes environments, eliminating cold starts. Reserved only caps concurrency. Memory speeds up init but doesn't eliminate it.
</details>

---

**Q4.** Which feature takes a JVM snapshot after init and restores from it?

A) Provisioned Concurrency  
B) Reserved Concurrency  
C) Lambda Layers  
D) **Lambda SnapStart**  

<details>
<summary>✅ Answer & Explanation</summary>

**D** — **SnapStart** (Java 11+) snapshots the initialized JVM using CRaC and restores from it, reducing cold start from ~5s to ~200ms.
</details>

---

**Q5.** Lambda processes SQS messages in batches of 10. One message fails. What happens by default?

A) Only the failed message is retried  
B) **The entire batch is returned to the queue**  
C) The function retries with just the failed message  
D) The failed message goes to DLQ immediately  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — By default, if any message fails, the **entire batch** returns to the queue. Use **`ReportBatchItemFailures`** to report only failed message IDs.
</details>

---

**Q6.** A Lambda function in a VPC cannot access DynamoDB. The team doesn't want to use a NAT Gateway. What should they do?

A) Move Lambda out of the VPC  
B) Add an Internet Gateway to the private subnet  
C) **Create a VPC Gateway Endpoint for DynamoDB**  
D) Increase the function timeout  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — A **VPC Gateway Endpoint** provides private access to DynamoDB and S3 without internet. Gateway endpoints are free. Interface endpoints (for other services) have hourly costs.
</details>

---

**Q7.** An API Gateway returns `502 Bad Gateway` but Lambda logs show successful execution. What is the most likely cause?

A) Lambda timed out  
B) **Lambda returned an incorrectly formatted response**  
C) API Gateway throttled the request  
D) IAM permissions are missing  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — In Lambda Proxy Integration, the function **must** return `{ statusCode, body, headers }`. A raw string or missing fields causes `502`. Timeout = 504, throttle = 429.
</details>

---

**Q8.** A developer configures a Lambda function with Reserved Concurrency of 50 and Provisioned Concurrency of 30. What happens when 60 concurrent requests arrive?

A) All 60 execute normally  
B) **50 execute, 10 are throttled**  
C) 30 execute with no cold start, 20 have cold starts, 10 throttled  
D) 30 execute, 30 are throttled  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — Reserved Concurrency **caps** total concurrency at 50. Of those 50, the first 30 use pre-warmed Provisioned environments (no cold start), the next 20 have cold starts. The remaining 10 are throttled.
</details>

---

## 🔗 Resources

- [Lambda Developer Guide](https://docs.aws.amazon.com/lambda/latest/dg/)
- [Lambda with Java](https://docs.aws.amazon.com/lambda/latest/dg/java-handler.html)
- [Lambda SnapStart](https://docs.aws.amazon.com/lambda/latest/dg/snapstart.html)
- [Lambda Concurrency](https://docs.aws.amazon.com/lambda/latest/dg/configuration-concurrency.html)
- [AWS Lambda Power Tuning Tool](https://github.com/alexcasalboni/aws-lambda-power-tuning)
- [Lambda Powertools for Java](https://docs.powertools.aws.dev/lambda/java/)
- [Lambda Operator Guide](https://docs.aws.amazon.com/lambda/latest/operatorguide/)
