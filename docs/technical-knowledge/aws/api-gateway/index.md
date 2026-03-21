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

> **Core concept**: API Gateway is the fully managed "front door" for APIs — it routes HTTP requests to Lambda, EC2, HTTP backends, or AWS services directly. It handles traffic management, CORS, authorization, access control, throttling, and API versioning.

---

## Endpoint Types (REST API)

When creating a REST API, you must choose an endpoint type based on where your clients are located:

- **Edge-Optimized (Default)**: Best for geographically distributed clients. Requests are routed through the AWS CloudFront Edge network to improve latency.
- **Regional**: Best for clients in the same AWS region as the API (e.g., an EC2 instance calling the API). Often combined with Route 53 latency-based routing for multi-region active-active setups.
- **Private**: Can only be accessed from your Amazon VPC using an Interface VPC Endpoint (AWS PrivateLink). Use Resource Policies to allow specific VPCs/Subnets.

---

## API Types

| Type              | Use Case                                   | Features                                                                      | Cost         |
| ----------------- | ------------------------------------------ | ----------------------------------------------------------------------------- | ------------ |
| **REST API**      | Full-featured traditional REST             | Caching, WAF, usage plans, request/response transform, Edge/Private endpoints | Higher       |
| **HTTP API**      | Low-latency, simple REST                   | JWT authorizer, auto-deploy, OIDC, CORS built-in                              | ~70% cheaper |
| **WebSocket API** | Real-time bidirectional (chat, dashboards) | Connection management, stateful                                               | Per message  |

:::tip Exam: REST vs HTTP API
- Need **usage plans / API keys** → REST API
- Need **response caching** → REST API
- Need **resource policies / WAF integration** → REST API
- Simplest serverless API with Cognito JWT auth / OIDC → **HTTP API**
:::

---

## Integration Types

### Lambda Proxy vs. Non-Proxy Integration

| Feature                 | Lambda Proxy Integration                                                       | Lambda Non-Proxy (Custom) Integration                                      |
| ----------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| **Request passing**     | API Gateway passes the *entire raw HTTP request* to Lambda.                    | API Gateway extracts parameters and passes a formatted JSON to Lambda.     |
| **Response**            | Lambda *must* return a specific JSON format (`statusCode`, `body`, `headers`). | Lambda can return anything; API Gateway formats it for the client.         |
| **Data Transformation** | Not possible at the API Gateway level.                                         | Uses **Velocity Template Language (VTL)** to transform requests/responses. |
| **Setup effort**        | Minimal (Click and deploy).                                                    | High (Requires writing mapping templates).                                 |

### Mapping Templates (VTL)
Used in Non-Proxy integrations to modify request/response payloads. 
- **Example use case**: Renaming a JSON key from a legacy client request before sending it to a modern Lambda backend, or converting an XML request to JSON.
- **Example use case**: Adding default headers or filtering out sensitive data from the backend response.

### Direct SQS Integration (No Lambda!)

You can bypass Lambda and write directly to an AWS service (like SQS, DynamoDB, or Kinesis) to save costs and reduce latency.

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

### 1. Cognito User Pool Authorizer
- Validates the JWT Access token from Cognito.
- Built-in, no Lambda needed.
- Cannot inspect the payload logic (only validates the signature/expiration).

### 2. Lambda Authorizer (Custom Authorizer)
- Your Lambda validates the token (JWT, OAuth, SAML, third-party API key).
- Returns an IAM policy document (`Allow` or `Deny`).
- **Token type**: receives a header token (Bearer).
- **Request type**: receives full request context (headers, query params, etc.).
- **Caching**: Results are cached (TTL: 0–3600s). Set TTL = 0 to disable caching for dynamic permissions.

### 3. IAM (Resource Policies & SigV4)
- Ideal for internal AWS service-to-service communication.
- The client must sign the API request using **Signature Version 4 (SigV4)**.
- You can attach a Resource Policy to the API Gateway to restrict access to specific IP ranges or VPCs.

---

## Deployment Stages & Stage Variables

```
API → [dev stage]   → [https://xyz.execute-api.us-east-1.amazonaws.com/dev](https://xyz.execute-api.us-east-1.amazonaws.com/dev)
    → [prod stage]  → [https://xyz.execute-api.us-east-1.amazonaws.com/prod](https://xyz.execute-api.us-east-1.amazonaws.com/prod)
```

- Each stage is an immutable **snapshot** of the API deployment. If you update a resource, you must *deploy* it to a stage for changes to take effect.
- **Stage variables** act like environment variables for your API Gateway. 

:::info Stage Variables + Lambda Aliases (Highly Testable!)
A common pattern is to use stage variables to point different API Gateway stages to different Lambda Aliases (e.g., `dev` API stage points to the `DEV` Lambda alias).
- Format the Integration URI like this: `arn:aws:lambda:us-east-1:123456789012:function:my-function:${stageVariables.lambdaAlias}`
- You must grant API Gateway permission to invoke *each* specific Lambda alias.
:::

### Canary Deployments
Gradually shift traffic to a new deployment to catch errors before fully committing.
```
prod stage → 95% → stable deployment
          →  5% → canary deployment (testing)
```

---

## CORS (Cross-Origin Resource Sharing)

If a web application running on `domain-a.com` tries to call an API Gateway on `domain-b.com`, the browser will block it unless CORS is enabled.

- API Gateway handles CORS via the **OPTIONS** HTTP method (preflight request).
- API Gateway must respond to the OPTIONS request with the header: `Access-Control-Allow-Origin: *` (or the specific domain).
- **Mock Integration** is typically used for the OPTIONS method so it can return the CORS headers immediately without invoking a backend Lambda.

---

## Caching, Throttling & Usage Plans

### Caching (REST API only)
- Cache API responses for **0.5 – 3600 seconds** (default is 300s).
- Reduces backend Lambda invocations and lowers latency.
- Cache key is calculated using method + path + query params + headers.
- **Invalidation**: Clients can send `Cache-Control: max-age=0` to force a refresh (requires `execute-api:InvalidateCache` IAM permission).
- Cache data can be encrypted at rest.

### Throttling & Usage Plans
- **Account Limit**: 10,000 Requests Per Second (RPS) with a burst of 5,000. (Returns `429 Too Many Requests` if exceeded).
- **Usage Plans**: Used to monetize APIs. You can define throttle rates and quotas (e.g., 1000 requests per month).
- **API Keys**: Alphanumeric strings assigned to customers. You map an API Key to a Usage Plan to track and limit a specific customer's usage.

---

## Common API Gateway Error Codes

| Code    | Meaning             | Exam Context                                                                                                     |
| ------- | ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **400** | Bad Request         | Client sent malformed data or missing parameters.                                                                |
| **403** | Access Denied       | WAF blocked the request, missing API Key, or denied by Authorizer.                                               |
| **429** | Too Many Requests   | Throttling limit exceeded (Account, Stage, or Usage Plan limit).                                                 |
| **502** | Bad Gateway         | **Lambda Proxy integration format error.** Lambda didn't return the required JSON format (`statusCode`, `body`). |
| **503** | Service Unavailable | Backend server/Lambda is down or out of concurrency.                                                             |
| **504** | Gateway Timeout     | **29-second hard limit.** Lambda took longer than 29 seconds to respond.                                         |

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

**Q3.** A developer has configured an API Gateway with a Lambda Proxy integration. When calling the API, the client receives a `502 Bad Gateway` error, but the Lambda logs show the function executed successfully. What is the most likely cause?

A) The Lambda function timed out after 29 seconds.  
B) The Lambda function is returning a raw string instead of a properly formatted JSON response containing `statusCode` and `body`.  
C) The client forgot to pass the API Key in the headers.  
D) API Gateway does not have resource-based permissions to invoke the Lambda function.  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — In a **Lambda Proxy Integration**, the backend Lambda *must* return a specific JSON object structure. If it returns a plain string, integer, or improperly formatted JSON, API Gateway cannot parse it and throws a `502 Bad Gateway`. (Timeout would be 504; Permissions issue would be 500; Missing key is 403).
</details>

---

**Q4.** You have an API Gateway with a `dev` and `prod` stage. You want to route `dev` requests to the `$LATEST` version of your Lambda function, and `prod` requests to the `v1` alias of the same function. How can you achieve this with the least amount of management overhead?

A) Create two separate API Gateways.  
B) Hardcode the Lambda ARN in the Integration Request for each stage.  
C) Use Stage Variables in the API Gateway and reference the variable in the Lambda Integration URI.  
D) Write a mapping template to inspect the request URL and dynamically invoke the correct alias.  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — **Stage Variables** are designed exactly for this. You define a variable (e.g., `lambdaAlias`) on the stage, set its value to `dev` or `v1`, and use `${stageVariables.lambdaAlias}` in the Lambda Integration setup.
</details>

---

## 🔗 Resources

- [API Gateway Developer Guide](https://docs.aws.amazon.com/apigateway/latest/developerguide/)
- [REST vs HTTP API](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-vs-rest.html)
- [Set up Stage Variables](https://docs.aws.amazon.com/apigateway/latest/developerguide/amazon-api-gateway-using-stage-variables.html)
- [Lambda Proxy vs Non-Proxy Integrations](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-api-integration-types.html)
- [CORS Configuration](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html)
- [API Gateway Error Codes](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-known-issues.html#api-gateway-error-codes)
