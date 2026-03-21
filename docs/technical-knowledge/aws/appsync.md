---
id: appsync
title: AWS AppSync
sidebar_label: "📡 AppSync (GraphQL)"
description: >
  AWS AppSync for DVA-C02. GraphQL API service, resolvers, data sources
  (DynamoDB, Lambda, RDS, HTTP), real-time subscriptions, caching,
  authorization modes, and comparison with API Gateway.
tags:
  - appsync
  - graphql
  - real-time
  - subscriptions
  - resolvers
  - dva-c02
  - domain-1
---

# AWS AppSync

> **Core concept**: AppSync is a fully managed **GraphQL API** service — ideal for real-time, multi-data-source, and mobile/web apps.

---

## AppSync vs API Gateway

| Feature | AppSync | API Gateway |
|---|---|---|
| **Protocol** | GraphQL | REST / HTTP / WebSocket |
| **Real-time** | ✅ Native subscriptions (WebSocket) | WebSocket API only |
| **Multiple data sources** | ✅ Single query, multiple sources | ❌ One integration per endpoint |
| **Offline sync** | ✅ Conflict resolution built-in | ❌ |
| **Caching** | ✅ Server-side per-resolver | ✅ Stage-level |
| **Use case** | Mobile/web apps, real-time dashboards | REST APIs, microservices |

---

## Data Sources

| Source | Description |
|---|---|
| **DynamoDB** | Direct DynamoDB access via VTL mapping |
| **Lambda** | Any custom logic, any backend |
| **RDS / Aurora Serverless** | SQL queries via Data API |
| **OpenSearch** | Full-text search |
| **HTTP** | Any REST API |
| **None** | Local resolvers (computed values) |

---

## Resolvers

Resolvers map GraphQL operations to data source operations using **VTL (Velocity Template Language)** or **JavaScript** (APPSYNC_JS):

```javascript
// JavaScript resolver — DynamoDB GetItem
export function request(ctx) {
    return {
        operation: 'GetItem',
        key: util.dynamodb.toMapValues({ id: ctx.args.id })
    };
}

export function response(ctx) {
    return ctx.result;
}
```

### Pipeline Resolvers

Chain multiple data sources in one resolver:
```
Query: getOrderWithProducts
  → Step 1: DynamoDB (get order)
  → Step 2: DynamoDB (get product details)
  → Step 3: Lambda (calculate price with tax)
  → Return merged result
```

---

## Real-Time Subscriptions

```graphql
# Schema
type Subscription {
    onOrderUpdated(customerId: ID!): Order
        @aws_subscribe(mutations: ["updateOrder"])
}

# Client subscribes via WebSocket
subscription {
    onOrderUpdated(customerId: "CUST-123") {
        orderId
        status
        updatedAt
    }
}
```

- Client connects over WebSocket (MQTT over WebSocket)
- AppSync pushes updates automatically when mutation fires

---

## Authorization Modes

| Mode | Use Case |
|---|---|
| **API Key** | Public APIs, development |
| **AWS IAM** | Server-to-server, IAM roles |
| **Cognito User Pools** | User authentication (most common) |
| **OIDC** | Third-party identity providers |
| **Lambda Authorizer** | Custom auth logic |

Multiple modes can be configured simultaneously, with one as default.

---

## Caching

```
Per-resolver TTL: 0 – 3600 seconds
Cache key: resolved query arguments

Enables: Cache frequently-requested data
Reduces: Lambda invocations, DynamoDB reads
```

---

## 🧪 Practice Questions

**Q1.** A mobile app needs real-time order status updates pushed to connected clients whenever an order is updated. Which service is BEST suited?

A) API Gateway WebSocket API  
B) SQS + client polling  
C) **AppSync with GraphQL Subscriptions**  
D) SNS mobile push notifications  

<details>
<summary>✅ Answer & Explanation</summary>

**C** — **AppSync Subscriptions** automatically push mutation events to connected WebSocket clients — purpose-built for this pattern. API Gateway WebSocket requires managing connection IDs and routing manually.
</details>

---

**Q2.** A single GraphQL query needs to aggregate data from DynamoDB and call a Lambda for business logic. Which AppSync feature enables this without client-side orchestration?

A) Multiple AppSync APIs  
B) **Pipeline Resolver** chaining DynamoDB and Lambda functions  
C) Lambda resolver that calls DynamoDB  
D) REST API Gateway passthrough  

<details>
<summary>✅ Answer & Explanation</summary>

**B** — **Pipeline Resolvers** chain multiple resolver functions (each connecting to a different data source) into a single GraphQL operation. The client makes one request; AppSync orchestrates the steps.
</details>

---

## 🔗 Resources

- [AppSync Developer Guide](https://docs.aws.amazon.com/appsync/latest/devguide/)
- [AppSync JavaScript Resolvers](https://docs.aws.amazon.com/appsync/latest/devguide/resolver-reference-js-version.html)
- [AppSync Real-time Data](https://docs.aws.amazon.com/appsync/latest/devguide/real-time-data.html)
- [AppSync with Spring (community)](https://github.com/awslabs/aws-appsync-community)
