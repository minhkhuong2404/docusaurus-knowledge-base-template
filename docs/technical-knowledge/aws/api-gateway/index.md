---
id: index
title: Amazon API Gateway
sidebar_label: "🌐 API Gateway"
description: >
  API Gateway for DVA-C02. REST API vs HTTP API vs WebSocket API, integration
  types, authorizers (Cognito, Lambda), deployment stages, caching, throttling,
  CORS, canary deployments, and usage plans.
tags:
  - api-gateway
  - rest-api
  - http-api
  - websocket
  - authorizer
  - lambda
  - throttling
  - caching
  - cors
  - dva-c02
  - domain-1
---

# Amazon API Gateway

> **Core concept**: API Gateway is the fully managed "front door" for APIs — it routes HTTP requests to Lambda, EC2, HTTP backends, or AWS services directly. It handles traffic management, CORS, authorization, throttling, and API versioning.

---

## 🔰 What Is API Gateway?

:::tip[Reverse Proxy vs. Load Balancer vs. API Gateway]
API Gateways are often confused with general-purpose reverse proxies and load balancers. To see a detailed comparison of their differences, feature matrices, and how they coexist in production, see the [Reverse Proxy vs. Load Balancer vs. API Gateway Guide](../../system-design/reverse-proxy-load-balancer-api-gateway).
:::

API Gateway acts as a **reverse proxy** between your clients (web, mobile, IoT) and your backend services. Think of it as a receptionist at an office building — it checks credentials, routes visitors to the right floor, and manages how many visitors can enter at once.

### Why Use API Gateway?

| Without API Gateway | With API Gateway |
|---|---|
| Manage own load balancer | Fully managed scaling |
| Build auth from scratch | Built-in Cognito/IAM/Lambda auth |
| No throttling | Per-client rate limiting |
| No caching | Built-in response caching |
| No API versioning | Stage-based versioning |
| No request validation | Schema validation |

---

## Endpoint Types (REST API)

| Type | Description | Best For |
|---|---|---|
| **Edge-Optimized** (Default) | Routed through CloudFront edge network | Geographically distributed clients |
| **Regional** | Direct access in same region | Same-region clients, custom CDN setups |
| **Private** | VPC-only via Interface VPC Endpoint | Internal microservices |

---

## API Types

| Type | Use Case | Features | Cost |
|---|---|---|---|
| **REST API** | Full-featured REST | Caching, WAF, usage plans, VTL transforms, Edge/Private | Higher |
| **HTTP API** | Simple, low-latency | JWT auth, OIDC, auto-deploy, CORS | ~70% cheaper |
| **WebSocket API** | Real-time (chat, dashboards) | Connection management, stateful | Per message |

### REST vs HTTP API Decision Matrix

| Need | REST API | HTTP API |
|---|---|---|
| Usage plans / API keys | ✅ | ❌ |
| Response caching | ✅ | ❌ |
| Resource policies / WAF | ✅ | ❌ |
| Request/response transformation (VTL) | ✅ | ❌ |
| Cognito JWT auth / OIDC | ✅ | ✅ |
| Private integrations (VPC Link) | ✅ (NLB) | ✅ (ALB, NLB, Cloud Map) |
| Lowest cost | ❌ | ✅ |
| Fastest performance | ❌ | ✅ |

:::tip[Exam Decision]
If the question mentions **usage plans, API keys, caching, WAF, or VTL** → **REST API**
If the question asks for **simplest** or **cheapest** → **HTTP API**
:::

---

## Integration Types

### Lambda Proxy vs Non-Proxy

| Feature | Lambda Proxy | Lambda Non-Proxy (Custom) |
|---|---|---|
| **Request** | Entire raw HTTP request passed to Lambda | API Gateway extracts/formats parameters |
| **Response** | Lambda MUST return `{statusCode, body, headers}` | Lambda returns anything; APIGW formats it |
| **Transformation** | ❌ Not possible at APIGW level | ✅ Uses VTL mapping templates |
| **Setup** | Minimal | High (requires mapping templates) |
| **Error if wrong format** | **502 Bad Gateway** | API Gateway handles |

### Mapping Templates (VTL)

Used in Non-Proxy integrations to transform request/response:

```velocity
## Request mapping: Rename JSON field for legacy backend
#set($inputRoot = $input.path('$'))
{
  "customer_name": "$inputRoot.name",
  "customer_email": "$inputRoot.email",
  "request_id": "$context.requestId"
}
```

### Direct AWS Service Integration

Skip Lambda entirely — call AWS services directly:

```yaml
# API Gateway → SQS (no Lambda needed!)
Integration:
  Type: AWS
  IntegrationHttpMethod: POST
  Uri: !Sub "arn:aws:apigateway:${AWS::Region}:sqs:path/${AWS::AccountId}/${Queue.QueueName}"
  Credentials: !GetAtt ApiGatewayRole.Arn
  RequestParameters:
    integration.request.header.Content-Type: "'application/x-www-form-urlencoded'"
  RequestTemplates:
    application/json: "Action=SendMessage&MessageBody=$input.body"
```

Other direct integrations: DynamoDB, Kinesis, Step Functions, S3

### VPC Links (Private Integrations)

```
API Gateway → VPC Link → NLB/ALB → Private EC2/ECS/Fargate
```

- **REST APIs**: Connect via Network Load Balancer (NLB)
- **HTTP APIs**: Connect via ALB, NLB, or AWS Cloud Map
- Uses **AWS PrivateLink** — traffic never leaves AWS network

---

## Authorizers

### 1. Cognito User Pool Authorizer

```
Client → Login to Cognito → Receives JWT token
Client → API Gateway (Authorization: Bearer <JWT>) → Cognito validates → Allow/Deny
```

- Built-in, no Lambda needed
- Validates JWT signature and expiration
- Cannot inspect payload or custom logic

### 2. Lambda Authorizer (Custom)

```
Client → API Gateway → Lambda Authorizer → Returns IAM Policy
                                           ↓
                                     {Allow/Deny, Context}
```

Two subtypes:
- **Token-based**: Receives Bearer token header
- **Request-based**: Receives full request context (headers, query params, path)

```java
// Lambda Authorizer returns IAM policy
public class AuthorizerHandler implements RequestHandler<Map<String, Object>, Map<String, Object>> {
    public Map<String, Object> handleRequest(Map<String, Object> event, Context context) {
        String token = (String) event.get("authorizationToken");
        
        // Validate token (JWT, API key, custom logic)
        boolean isValid = validateToken(token);
        String userId = extractUserId(token);
        
        return Map.of(
            "principalId", userId,
            "policyDocument", Map.of(
                "Version", "2012-10-17",
                "Statement", List.of(Map.of(
                    "Action", "execute-api:Invoke",
                    "Effect", isValid ? "Allow" : "Deny",
                    "Resource", event.get("methodArn")
                ))
            ),
            "context", Map.of(
                "userId", userId,
                "plan", "premium"  // Available in $context.authorizer.plan
            )
        );
    }
}
```

**Caching**: Results cached by TTL (0–3600s). Set TTL=0 for dynamic permissions.

### 3. IAM (SigV4)

- Client signs request with AWS credentials (Signature V4)
- Ideal for **service-to-service** communication
- Combine with **Resource Policies** for cross-account or IP restrictions

### 4. Mutual TLS (mTLS)

- Client presents X.509 certificate to authenticate
- Requires **Custom Domain Name**
- Trust store (CA cert PEM file) uploaded to S3
- Used for B2B, banking, IoT

### Authorizer Comparison

| Authorizer | Use Case | Custom Logic | Caching |
|---|---|---|---|
| **Cognito** | User pools, social login | ❌ | Built-in |
| **Lambda** | Custom validation, 3rd-party tokens | ✅ | 0–3600s TTL |
| **IAM** | AWS service-to-service | ❌ | N/A |
| **mTLS** | B2B, banking, IoT | ❌ | N/A |

---

## Deployment Stages & Stage Variables

```
API → [dev stage]   → https://xyz.execute-api.us-east-1.amazonaws.com/dev
    → [staging]     → https://xyz.execute-api.us-east-1.amazonaws.com/staging
    → [prod stage]  → https://xyz.execute-api.us-east-1.amazonaws.com/prod
```

- Changes require **deployment** to a stage to take effect
- **Stage variables** = environment variables for API Gateway

### Stage Variables + Lambda Aliases

```
dev stage:  lambdaAlias = "dev"   → Lambda:dev ($LATEST)
prod stage: lambdaAlias = "prod"  → Lambda:prod (version 5)
```

Integration URI: `arn:aws:lambda:...:my-function:${stageVariables.lambdaAlias}`

:::info[Must grant invoke permission for EACH alias]
API Gateway needs `lambda:InvokeFunction` permission on each specific Lambda alias referenced by stage variables.
:::

### Canary Deployments

```
prod stage → 95% → stable deployment
           →  5% → canary deployment (testing new changes)
```

---

## CORS

If a browser at `domain-a.com` calls API Gateway at `domain-b.com`:

1. Browser sends **preflight OPTIONS** request
2. API Gateway responds with CORS headers
3. Browser allows/blocks the actual request

For **Lambda Proxy** integration, your Lambda function MUST return CORS headers:

```java
return new APIGatewayProxyResponseEvent()
    .withStatusCode(200)
    .withHeaders(Map.of(
        "Access-Control-Allow-Origin", "https://myapp.example.com",
        "Access-Control-Allow-Headers", "Content-Type,Authorization",
        "Access-Control-Allow-Methods", "GET,POST,OPTIONS"
    ))
    .withBody(responseBody);
```

For **Non-Proxy** integration, configure CORS via **Mock Integration** on the OPTIONS method.

---

## Caching, Throttling & Usage Plans

### Caching (REST API Only)

| Property | Value |
|---|---|
| **TTL** | 0.5 – 3600 seconds (default 300s) |
| **Size** | 0.5 GB – 237 GB |
| **Cache key** | Method + path + query params + headers |
| **Invalidation** | `Cache-Control: max-age=0` header |
| **Permission** | Requires `execute-api:InvalidateCache` IAM permission |
| **Encryption** | Can be encrypted at rest |

### Throttling

| Limit | Value |
|---|---|
| **Account limit** | 10,000 RPS with burst of 5,000 |
| **Per-stage/method** | Configurable |
| **Error** | `429 Too Many Requests` |

### Usage Plans & API Keys

```
Usage Plan "Basic":
  Rate: 100 RPS
  Burst: 200
  Quota: 10,000 requests/month
  → Assigned to API Key "customer-A-key"

Usage Plan "Premium":
  Rate: 1000 RPS
  Burst: 2000
  Quota: Unlimited
  → Assigned to API Key "customer-B-key"
```

---

## WebSocket API

### Connection Lifecycle

```
Client → $connect    → Lambda (save connectionId to DynamoDB)
Client → $default    → Lambda (process messages)
Client → $disconnect → Lambda (remove connectionId from DynamoDB)
Client → customRoute → Lambda (custom action)
```

### Send Message to Client

```java
// Server pushes message to a specific connected client
ApiGatewayManagementApiClient apiClient = ApiGatewayManagementApiClient.builder()
    .endpointOverride(URI.create("https://abc123.execute-api.us-east-1.amazonaws.com/prod"))
    .build();

apiClient.postToConnection(PostToConnectionRequest.builder()
    .connectionId("AbCdEfG=")
    .data(SdkBytes.fromUtf8String("{\"message\": \"Hello from server!\"}"))
    .build());
```

---

## Request Validation

API Gateway can validate requests **before** invoking the backend:

```json
{
  "type": "object",
  "required": ["name", "email"],
  "properties": {
    "name": { "type": "string", "minLength": 1, "maxLength": 100 },
    "email": { "type": "string", "format": "email" },
    "age": { "type": "integer", "minimum": 0, "maximum": 150 }
  }
}
```

Returns `400 Bad Request` if validation fails — no Lambda invocation (saves cost!).

---

## Common Error Codes

| Code | Meaning | Exam Context |
|---|---|---|
| **400** | Bad Request | Failed request validation |
| **403** | Forbidden | WAF blocked, missing API key, authorizer denied |
| **429** | Too Many Requests | Throttling limit exceeded |
| **502** | Bad Gateway | Lambda response format wrong (proxy integration) |
| **503** | Service Unavailable | Backend down or Lambda out of concurrency |
| **504** | Gateway Timeout | Lambda >29s (API Gateway hard limit) |

:::caution[502 vs 504 — Exam Classic!]
- **502** = Lambda returned wrong format (missing `statusCode`/`body`)
- **504** = Lambda took longer than **29 seconds** (API Gateway timeout limit, NOT Lambda's 15 min limit)
:::

---

## 🏆 Best Practices

1. **Use HTTP API** when you don't need REST-specific features — 70% cheaper
2. **Cache responses** to reduce Lambda invocations and latency
3. **Enable request validation** to reject bad requests before invoking backend
4. **Use stage variables** for environment-specific configuration
5. **Direct service integrations** when Lambda is just a pass-through
6. **Lambda Authorizer caching** — set appropriate TTL to reduce auth calls
7. **Custom domains** for professional, versioned APIs

---

## 🎯 DVA-C02 Exam Tips

:::tip[API Gateway Exam Cheat Sheet]
1. **502** = Lambda proxy response format wrong. **504** = timeout >29s
2. **Usage plans + API keys** = per-customer throttling/quotas (REST only)
3. **Stage variables** route stages to different Lambda aliases
4. **HTTP API** = cheapest, simplest. **REST API** = full-featured
5. **Lambda Proxy** = Lambda must return `{statusCode, body, headers}`
6. **VTL mapping templates** = Non-Proxy integration only
7. **CORS in proxy mode** = Lambda must return CORS headers
8. **Canary deployment** = gradual traffic shift to new API deployment
9. **Cache invalidation** needs `execute-api:InvalidateCache` permission
10. **WebSocket** = `$connect`, `$disconnect`, `$default` routes
:::

---

## 🧪 Practice Questions

**Q1.** Throttle API per customer and charge by usage tier. What feature?

A) Stage Variables  
B) Lambda Reserved Concurrency  
C) **Usage Plans with API Keys**  
D) Cognito User Pools  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — Usage Plans define throttle rates and quotas per API Key per customer.
</details>

---

**Q2.** Cached API but admins need to bypass cache. How?

A) Lambda Authorizer skips cache  
B) Separate cached/uncached stages  
C) **`Cache-Control: max-age=0` header with IAM permission**  
D) Disable caching for admin routes  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — Clients with `execute-api:InvalidateCache` permission can send `Cache-Control: max-age=0`.
</details>

---

**Q3.** Lambda Proxy returns `502` but Lambda logs show success. Cause?

A) Lambda timeout  
B) **Lambda returned wrong response format**  
C) Missing API key  
D) Missing invoke permission  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — Lambda Proxy requires `{statusCode, body, headers}`. Raw string or wrong format → 502. Timeout → 504.
</details>

---

**Q4.** Route `dev` stage to Lambda `$LATEST` and `prod` to `v1` alias. Least effort?

A) Two API Gateways  
B) Hardcode ARN per stage  
C) **Stage Variables referencing Lambda alias in Integration URI**  
D) Mapping template  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — Stage variable `lambdaAlias` in the URI `${stageVariables.lambdaAlias}` resolves per stage.
</details>

---

**Q5.** API must call a private ALB in VPC. Which integration?

A) Lambda Proxy  
B) **VPC Link (HTTP API → ALB)**  
C) Direct HTTP integration  
D) Mock integration  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — VPC Links connect API Gateway to private resources via PrivateLink. HTTP API supports ALB/NLB; REST API supports NLB only.
</details>

---

## Interview Questions (Senior Level)

1. How would you design per-tenant rate limiting and monetization while keeping a migration path from REST to HTTP API?
2. When would you choose VPC Link private integrations over direct Lambda?
3. How do you handle sporadic `502` from Lambda proxy integration?

---

## 🔗 Resources

- [API Gateway Developer Guide](https://docs.aws.amazon.com/apigateway/latest/developerguide/)
- [REST vs HTTP API](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-vs-rest.html)
- [Stage Variables](https://docs.aws.amazon.com/apigateway/latest/developerguide/amazon-api-gateway-using-stage-variables.html)
- [Lambda Authorizers](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html)
- [WebSocket APIs](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html)
