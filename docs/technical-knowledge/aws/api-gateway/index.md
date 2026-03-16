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
  - dva-c02
  - domain-1
---

# Amazon API Gateway

> **Core concept**: API Gateway is the fully managed "front door" for APIs — routes HTTP requests to Lambda, EC2, HTTP backends, or AWS services directly.

---

## API Types

| Type | Use Case | Features | Cost |
|---|---|---|---|
| **REST API** | Full-featured traditional REST | Caching, WAF, usage plans, request/response transform | Higher |
| **HTTP API** | Low-latency, simple REST | JWT authorizer, auto-deploy, OIDC | ~70% cheaper |
| **WebSocket API** | Real-time bidirectional (chat, dashboards) | Connection management | Per message |

:::tip Exam: REST vs HTTP API
- Need **usage plans / API keys** → REST API
- Need **response caching** → REST API
- Need **resource policies** → REST API
- Simplest serverless API with Cognito JWT auth → **HTTP API**
:::

---

## Integration Types

| Type | Description |
|---|---|
| **Lambda Proxy** | API Gateway passes raw event to Lambda, Lambda returns full response |
| **Lambda Non-Proxy** | You map request/response via Velocity templates (VTL) |
| **HTTP Proxy** | Pass through to HTTP backend |
| **AWS Service** | Directly invoke SQS, DynamoDB, S3, etc. (no Lambda needed!) |
| **Mock** | Return static response without backend |

### Direct SQS Integration (No Lambda!)

```yaml
# CloudFormation: API Gateway → SQS directly
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

---

## Authorizers

### Cognito User Pool Authorizer
- Validates the JWT Access token from Cognito
- Built-in, no Lambda needed
- Attach to REST or HTTP APIs

### Lambda Authorizer (Custom Authorizer)
- Your Lambda validates the token (JWT, OAuth, API key, etc.)
- Returns an IAM policy document
- **Token type**: receives a header token (Bearer)
- **Request type**: receives full request context (headers, query params, etc.)

```java
// Lambda authorizer response
public AuthPolicy handleRequest(TokenAuthorizerContext input, Context context) {
    String token = input.getAuthorizationToken();
    // Validate token...
    return AuthPolicy.builder()
        .principalId("user-123")
        .policyDocument(PolicyDocument.builder()
            .statements(List.of(Statement.builder()
                .effect(Effect.ALLOW)
                .actions(List.of("execute-api:Invoke"))
                .resources(List.of("arn:aws:execute-api:*:*:*"))
                .build()))
            .build())
        .build();
}
```

:::tip Authorizer caching
Lambda Authorizer results are **cached** (TTL: 0–3600s). Set TTL = 0 to disable caching for dynamic permissions.
:::

---

## Deployment Stages

```
API → [dev stage]   → https://xyz.execute-api.us-east-1.amazonaws.com/dev
    → [prod stage]  → https://xyz.execute-api.us-east-1.amazonaws.com/prod
```

- Each stage is a **snapshot** of the API deployment
- Stage variables = environment-specific config (like Lambda alias or DB URL)

### Canary Deployments

```
prod stage → 95% → stable Lambda version
          →  5% → canary Lambda version (testing)
```

---

## Caching (REST API only)

- Cache API responses for **0.5 – 3600 seconds**
- Reduces Lambda invocations
- Cache key = method + path + query params + headers (configurable)
- Can be **invalidated** with `Cache-Control: max-age=0` header (if allowed)

---

## Throttling

| Level | Default |
|---|---|
| Account | 10,000 RPS, burst 5,000 |
| Stage/Method | Configurable per stage |
| Usage Plan | Per-API key throttle + quota |

---

## 🧪 Practice Questions

**Q1.** A developer builds a serverless API with Lambda. They need to throttle API calls per customer and charge customers differently based on API usage tier. What feature should they use?

A) Stage Variables  
B) Lambda Reserved Concurrency  
C) API Gateway Usage Plans with API Keys  
D) Cognito User Pools  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — **Usage Plans** define throttle rates and quotas, assigned to **API Keys**. Each customer gets their own API key mapped to a usage plan.
</details>

---

**Q2.** An API needs to return cached responses for most users, but allow admins to bypass the cache. How should this be implemented?

A) Use a Lambda Authorizer to skip the cache  
B) Configure different stages (cached vs non-cached)  
C) Allow clients to send `Cache-Control: max-age=0` to invalidate  
D) Disable caching for admin routes  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — API Gateway supports `Cache-Control: max-age=0` header to **invalidate the cache per request**. Grant `execute-api:InvalidateCache` permission to authorized users.
</details>

---

**Q3.** What is the maximum integration timeout for API Gateway calling a Lambda function?

A) 3 seconds  
B) 10 seconds  
C) 29 seconds  
D) 15 minutes  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — API Gateway has a maximum integration timeout of **29 seconds** for all backends. If your Lambda takes longer, API Gateway will return a 504 Gateway Timeout. Lambda itself can run for 15 minutes, but API Gateway won't wait.
</details>

---

## 🔗 Resources

- [API Gateway Developer Guide](https://docs.aws.amazon.com/apigateway/latest/developerguide/)
- [REST vs HTTP API](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-vs-rest.html)
- [Lambda Authorizer](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html)
