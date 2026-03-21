---
id: aws-sdk-java
title: AWS SDK for Java v2 — Developer Guide
sidebar_label: "☕ AWS SDK for Java"
description: >
  AWS SDK for Java v2 for DVA-C02. Client initialization patterns,
  credential providers, default credential chain, pagination, waiters,
  presigners, and Spring Boot autoconfiguration. Essential for Java
  developers taking the DVA-C02 exam.
tags:
  - java
  - aws-sdk
  - spring-boot
  - credentials
  - dva-c02
  - domain-1
---

# AWS SDK for Java v2 — Developer Guide

> **Java-specific exam content**: The exam tests that you understand credential resolution, async clients, and proper client initialization patterns.

---

## Maven Dependencies

```xml
<!-- AWS SDK BOM — manages all SDK versions -->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>software.amazon.awssdk</groupId>
            <artifactId>bom</artifactId>
            <version>2.25.0</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<!-- Individual service clients -->
<dependencies>
    <dependency>
        <groupId>software.amazon.awssdk</groupId>
        <artifactId>dynamodb</artifactId>
    </dependency>
    <dependency>
        <groupId>software.amazon.awssdk</groupId>
        <artifactId>s3</artifactId>
    </dependency>
    <dependency>
        <groupId>software.amazon.awssdk</groupId>
        <artifactId>sqs</artifactId>
    </dependency>
    <dependency>
        <groupId>software.amazon.awssdk</groupId>
        <artifactId>secretsmanager</artifactId>
    </dependency>
    <!-- URL connection HTTP client (sync) -->
    <dependency>
        <groupId>software.amazon.awssdk</groupId>
        <artifactId>url-connection-client</artifactId>
    </dependency>
    <!-- Apache HTTP client (sync, better for production) -->
    <dependency>
        <groupId>software.amazon.awssdk</groupId>
        <artifactId>apache-client</artifactId>
    </dependency>
</dependencies>
```

---

## Default Credential Chain

The SDK resolves credentials **in this order**:

```
1. Java system properties (-Daws.accessKeyId, -Daws.secretAccessKey)
2. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
3. AWS SSO / IAM Identity Center
4. ~/.aws/credentials file
5. Container credentials (ECS/EKS metadata service)
6. EC2 instance metadata (IMDS)
7. IAM Role (Lambda execution role, EC2 instance role)
```

```java
// Use default chain (recommended for production)
DynamoDbClient client = DynamoDbClient.builder()
    .credentialsProvider(DefaultCredentialsProvider.create())
    .build();

// Explicit credentials (only for testing, never hardcode in prod)
DynamoDbClient testClient = DynamoDbClient.builder()
    .credentialsProvider(StaticCredentialsProvider.create(
        AwsBasicCredentials.create("accessKey", "secretKey")))
    .build();
```

:::tip Lambda credential resolution
In Lambda, the SDK automatically picks up the **execution role credentials** via the container metadata endpoint (step 5 above). You don't need to configure anything — just use `DefaultCredentialsProvider.create()` or the no-arg client builder.
:::

---

## Client Initialization — Lambda Best Practices

```java
// ✅ Static initialization — runs ONCE on cold start, reused on warm invocations
public class OrderHandler implements RequestHandler<SQSEvent, SQSBatchResponse> {

    // Initialize clients statically — they are thread-safe and expensive to create
    private static final DynamoDbClient DYNAMO = DynamoDbClient.builder()
        .region(Region.of(System.getenv("AWS_REGION")))
        .build();

    private static final S3Client S3 = S3Client.create();  // Uses env region

    private static final ObjectMapper MAPPER = new ObjectMapper();

    // Pre-load config at init time
    private static final String TABLE_NAME = System.getenv("TABLE_NAME");

    @Override
    public SQSBatchResponse handleRequest(SQSEvent event, Context context) {
        // DYNAMO and S3 are already warmed up — no client creation here
        List<SQSBatchResponse.BatchItemFailure> failures = new ArrayList<>();
        for (var msg : event.getRecords()) {
            try {
                processMessage(msg, context);
            } catch (Exception e) {
                context.getLogger().log("ERROR: " + e.getMessage());
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

## Sync vs Async Clients

| Client Type | Use Case | Thread model |
|---|---|---|
| `DynamoDbClient` | Synchronous — simple, easy to reason | Blocking |
| `DynamoDbAsyncClient` | Async — non-blocking, CompletableFuture | Non-blocking I/O |
| `DynamoDbEnhancedClient` | ORM-style, POJO mapping | Wraps sync client |

```java
// Async client (useful for high-throughput Lambda or reactive apps)
DynamoDbAsyncClient asyncClient = DynamoDbAsyncClient.create();

CompletableFuture<GetItemResponse> future = asyncClient.getItem(
    GetItemRequest.builder()
        .tableName("Orders")
        .key(Map.of("orderId", AttributeValue.fromS("ORD-001")))
        .build());

future.thenAccept(response -> {
    Map<String, AttributeValue> item = response.item();
    System.out.println("Order status: " + item.get("status").s());
}).join(); // Block in Lambda handler
```

---

## Pagination

AWS SDK v2 uses **paginators** for auto-pagination:

```java
// Manual pagination (low-level)
String lastEvaluatedKey = null;
do {
    QueryRequest.Builder builder = QueryRequest.builder()
        .tableName("Orders")
        .keyConditionExpression("customerId = :cid")
        .expressionAttributeValues(Map.of(
            ":cid", AttributeValue.fromS("CUST-001")));

    if (lastEvaluatedKey != null) {
        builder.exclusiveStartKey(Map.of(
            "customerId", AttributeValue.fromS("CUST-001"),
            "orderId", AttributeValue.fromS(lastEvaluatedKey)));
    }

    QueryResponse response = dynamoDb.query(builder.build());
    response.items().forEach(this::processItem);
    lastEvaluatedKey = response.hasLastEvaluatedKey()
        ? response.lastEvaluatedKey().get("orderId").s()
        : null;
} while (lastEvaluatedKey != null);

// ✅ Auto-pagination (SDK v2 paginator)
dynamoDb.queryPaginator(QueryRequest.builder()
    .tableName("Orders")
    .keyConditionExpression("customerId = :cid")
    .expressionAttributeValues(Map.of(":cid", AttributeValue.fromS("CUST-001")))
    .build())
    .stream()
    .flatMap(page -> page.items().stream())
    .forEach(this::processItem);
```

---

## Error Handling

```java
try {
    dynamoDb.putItem(PutItemRequest.builder()
        .tableName("Orders")
        .item(itemMap)
        .conditionExpression("attribute_not_exists(orderId)")
        .build());

} catch (ConditionalCheckFailedException e) {
    // Order already exists
    log.warn("Duplicate order: {}", orderId);

} catch (ProvisionedThroughputExceededException e) {
    // Throttled — back off and retry
    log.warn("DynamoDB throttled: {}", e.getMessage());
    throw new RetryableException(e);

} catch (DynamoDbException e) {
    // Generic DynamoDB error
    log.error("DynamoDB error: {}", e.awsErrorDetails().errorMessage());
    throw new RuntimeException(e);
}
```

### Built-in Retry

SDK v2 has **automatic retry** with exponential backoff for:
- Throttling exceptions
- Transient network errors
- 5xx service errors

Default: 3 retries with jitter. Configure:

```java
DynamoDbClient client = DynamoDbClient.builder()
    .overrideConfiguration(ClientOverrideConfiguration.builder()
        .retryStrategy(RetryMode.STANDARD)  // or ADAPTIVE
        .build())
    .build();
```

---

## Spring Boot Autoconfiguration

With `spring-cloud-aws`, clients are auto-configured:

```xml
<dependency>
    <groupId>io.awspring.cloud</groupId>
    <artifactId>spring-cloud-aws-starter-dynamodb</artifactId>
    <version>3.1.0</version>
</dependency>
```

```yaml
# application.yml
spring:
  cloud:
    aws:
      region:
        static: us-east-1
      credentials:
        instance-profile: true  # Use EC2/ECS/Lambda instance credentials
```

```java
@Service
public class OrderService {
    
    private final DynamoDbEnhancedClient dynamoDb;  // Auto-injected
    private final DynamoDbTable<Order> orderTable;
    
    public OrderService(DynamoDbEnhancedClient dynamoDb) {
        this.dynamoDb = dynamoDb;
        this.orderTable = dynamoDb.table("Orders", TableSchema.fromBean(Order.class));
    }
    
    @Cacheable("orders")  // Spring Cache + ElastiCache
    public Order findById(String orderId) {
        return orderTable.getItem(r -> r.key(k -> k.partitionValue(orderId)));
    }
}
```

---

## Common Environment Variables in Lambda

```java
// Standard AWS Lambda environment variables
String region = System.getenv("AWS_REGION");              // e.g., "us-east-1"
String functionName = System.getenv("AWS_LAMBDA_FUNCTION_NAME");
String functionVersion = System.getenv("AWS_LAMBDA_FUNCTION_VERSION"); // "$LATEST" or "5"
String memoryLimit = System.getenv("AWS_LAMBDA_FUNCTION_MEMORY_SIZE"); // "512"
String logGroupName = System.getenv("AWS_LAMBDA_LOG_GROUP_NAME");
String logStreamName = System.getenv("AWS_LAMBDA_LOG_STREAM_NAME");

// Custom variables from function config / SAM template
String tableName = System.getenv("TABLE_NAME");
String queueUrl = System.getenv("SQS_QUEUE_URL");
```

---

## 🧪 Practice Questions

**Q1.** A Lambda function uses `DynamoDbClient.create()` inside the `handleRequest` method. What is the impact?

A) The client is cached across invocations — no impact  
B) A new client connection pool is created on every invocation, increasing latency and resource usage  
C) The Lambda fails because DynamoDB clients can only be static  
D) The Lambda incurs additional KMS costs  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — Creating a client inside `handleRequest` means it's created on **every invocation** — new connection pool, TLS handshake, credential refresh. Move client initialization to static fields to reuse across warm invocations.
</details>

---

**Q2.** A Lambda function uses `DefaultCredentialsProvider.create()`. When deployed to Lambda, where does the SDK resolve credentials from?

A) From `~/.aws/credentials` inside the Lambda runtime  
B) From environment variables set in the Lambda configuration  
C) **From the Lambda execution role via the container metadata endpoint**  
D) From the root account  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — In Lambda, `DefaultCredentialsProvider` automatically discovers credentials from the **Lambda execution role** via the container credential endpoint (step 5 in the chain). No explicit credential configuration needed.
</details>

---

## 🔗 Resources

- [AWS SDK for Java v2 Developer Guide](https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/)
- [SDK v2 GitHub + Examples](https://github.com/awsdocs/aws-doc-sdk-examples/tree/main/javav2)
- [Spring Cloud AWS](https://docs.awspring.io/spring-cloud-aws/docs/3.0.0/reference/html/)
- [Lambda with Java Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [DynamoDB Enhanced Client](https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/dynamodb-enhanced-client.html)
