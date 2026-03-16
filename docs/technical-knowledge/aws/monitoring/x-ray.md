---
id: x-ray
title: AWS X-Ray
sidebar_label: "🔍 X-Ray"
description: >
  AWS X-Ray for DVA-C02. Distributed tracing, segments and subsegments,
  service maps, annotations vs metadata, sampling rules, X-Ray daemon,
  and Java SDK integration with Spring Boot.
tags:
  - x-ray
  - tracing
  - observability
  - distributed-tracing
  - segments
  - subsegments
  - sampling
  - dva-c02
  - domain-4
---

# AWS X-Ray

> **Core concept**: X-Ray provides **distributed tracing** — see how requests flow through your entire application (Lambda → API Gateway → DynamoDB → external services).

---

## Key Concepts

| Concept | Description |
|---|---|
| **Trace** | End-to-end path of a request through all services |
| **Segment** | One service's portion of a trace (e.g., Lambda execution) |
| **Subsegment** | Work within a segment (e.g., a DynamoDB call) |
| **Annotation** | Key-value pair **indexed** for filtering/searching |
| **Metadata** | Key-value pair **not indexed** — for debugging detail |
| **Service Map** | Visual graph of all services and their connections |
| **Sampling** | % of requests to trace (controls cost) |

---

## Annotations vs Metadata

| | Annotations | Metadata |
|---|---|---|
| **Indexed** | ✅ Yes — searchable | ❌ No |
| **Use for** | Filtering traces (`userId`, `orderId`) | Debugging data (full request/response) |
| **Type** | String, number, boolean | Any (JSON) |

```java
Subsegment subsegment = AWSXRay.beginSubsegment("ProcessOrder");
try {
    // Annotations are searchable
    subsegment.putAnnotation("orderId", orderId);
    subsegment.putAnnotation("customerId", customerId);
    
    // Metadata for rich debugging (not searchable)
    subsegment.putMetadata("orderDetails", orderMap);
    
    processOrder(orderId);
} catch (Exception e) {
    subsegment.addException(e);
    throw e;
} finally {
    AWSXRay.endSubsegment();
}
```

---

## Sampling Rules

Default sampling: **5% of requests + 1 req/second reservoir**

Custom rules (configured in console or via API):

```json
{
  "RuleName": "HighValueOrders",
  "Priority": 1,
  "ReservoirSize": 10,
  "FixedRate": 0.5,
  "URLPath": "/orders/*",
  "ServiceName": "order-service",
  "HTTPMethod": "POST"
}
```

- **ReservoirSize**: requests/second to always trace
- **FixedRate**: % of remaining requests to trace
- Lower **Priority** number = higher priority

---

## X-Ray Daemon

The X-Ray SDK sends trace data to the **X-Ray daemon**, which buffers and sends to the X-Ray API:

```
Your App → X-Ray SDK → UDP port 2000 → X-Ray Daemon → X-Ray API
```

| Environment | Daemon Location |
|---|---|
| Lambda | Built-in (enable Active Tracing) |
| ECS | Sidecar container |
| EC2 | Install manually or via User Data |
| Elastic Beanstalk | Built-in (enable in config) |

```yaml
# Lambda — enable X-Ray in SAM
MyFunction:
  Type: AWS::Serverless::Function
  Properties:
    Tracing: Active    # PassThrough = disabled
```

---

## Java SDK Integration

### Maven Dependency

```xml
<dependency>
    <groupId>com.amazonaws</groupId>
    <artifactId>aws-xray-recorder-sdk-core</artifactId>
    <version>2.14.0</version>
</dependency>
<!-- AWS SDK instrumentation -->
<dependency>
    <groupId>com.amazonaws</groupId>
    <artifactId>aws-xray-recorder-sdk-aws-sdk-v2-instrumentor</artifactId>
    <version>2.14.0</version>
</dependency>
```

### Spring Boot Integration

```java
@Configuration
public class XRayConfig {
    
    @Bean
    public Filter tracingFilter() {
        return new AWSXRayServletFilter("my-spring-service");
    }
}

// All AWS SDK calls (DynamoDB, S3, SQS...) are auto-instrumented
// when aws-xray-recorder-sdk-aws-sdk-v2-instrumentor is on classpath
```

### Manual Subsegments

```java
@Service
public class PaymentService {
    
    public void processPayment(String orderId) {
        // Creates a subsegment in the current trace
        AWSXRay.createSubsegment("PaymentGateway", (subsegment) -> {
            subsegment.putAnnotation("orderId", orderId);
            
            // Call external payment gateway
            paymentGateway.charge(orderId);
            
            return null;
        });
    }
}
```

---

## What X-Ray Traces

With the SDK and instrumentation:
- Incoming HTTP requests (via filter)
- **AWS SDK calls** (DynamoDB, S3, SQS, SNS, Lambda...)
- **SQL queries** (JDBC instrumentation)
- **HTTP client calls** (Apache HttpClient, OkHttp)
- Custom business logic (manual subsegments)

---

## 🧪 Practice Questions

**Q1.** A developer needs to search X-Ray traces for all requests where `userId = "user-123"`. What should they use to make this possible?

A) X-Ray Metadata with key `userId`  
B) X-Ray Annotation with key `userId`  
C) CloudWatch Log filter  
D) X-Ray Groups  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — **Annotations** are indexed and searchable. Metadata is stored with the trace but not indexed and cannot be used in filter expressions. Use `putAnnotation("userId", userId)`.
</details>

---

**Q2.** A Lambda function has X-Ray Active Tracing enabled. However, DynamoDB calls are not appearing as subsegments. What is missing?

A) X-Ray Daemon is not installed  
B) The IAM role lacks `xray:PutTraceSegments`  
C) The **X-Ray SDK AWS SDK instrumentor** is not on the classpath  
D) X-Ray sampling rate is too low  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — To auto-instrument AWS SDK v2 calls, you need `aws-xray-recorder-sdk-aws-sdk-v2-instrumentor` on the classpath. Without it, DynamoDB/S3/SQS calls won't appear as subsegments.
</details>

---

**Q3.** By default, what percentage of requests does X-Ray trace?

A) 100%  
B) 10%  
C) **5% + 1 request/second reservoir**  
D) 1%  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — The default sampling rule traces the **first request each second** (reservoir) and **5% of all additional requests**. This balances visibility with cost.
</details>

---

## 🔗 Resources

- [X-Ray Developer Guide](https://docs.aws.amazon.com/xray/latest/devguide/)
- [X-Ray SDK for Java](https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-java.html)
- [X-Ray Spring Boot Integration](https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-java-filters.html)
- [X-Ray Sampling Rules](https://docs.aws.amazon.com/xray/latest/devguide/xray-console-sampling.html)
