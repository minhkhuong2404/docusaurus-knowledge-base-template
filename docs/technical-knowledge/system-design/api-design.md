---
id: api-design
title: API Design
sidebar_label: API Design
description: Best practices for designing REST, gRPC, and GraphQL APIs including versioning, pagination, error handling, rate limiting, idempotency, and API gateway patterns.
tags: [api, rest, grpc, graphql, versioning, pagination, rate-limiting, idempotency, openapi, system-design]
---

# API Design

---

:::tip System Design Interview Tip
If you are designing an API during a system design interview, keep this section brief (under 5 minutes). Focus on the core endpoints, use shorthand for error codes (`2xx`, `4xx`, `5xx`), and don't write out exhaustive JSON response schemas unless explicitly asked.
:::

## REST API Design Principles

### Resource-Oriented Design
REST is built around resources (nouns) and standard HTTP methods (verbs). Resources in your URL should map directly to the core entities of your system and **must be plural**.

```
✅ GET    /events/{id}             - Get event
✅ POST   /events                  - Create event
✅ PUT    /events/{id}             - Replace event (Idempotent)
✅ PATCH  /events/{id}             - Partial update
✅ DELETE /events/{id}             - Delete event
✅ GET    /events/{id}/tickets     - Get event's tickets

❌ POST /createEvent               - Verb in URL
❌ POST /events                    - When updating an existing event
❌ GET  /deleteEvent?id=1          - Side effect on GET
```

### Passing Inputs (Path vs. Query vs. Body)
* **Path Parameters**: Use when the input is strictly **required** to identify the resource (e.g., `GET /events/123`).
* **Query Parameters**: Use for **optional** filtering, sorting, or pagination (e.g., `GET /events?location=LA&date=Jan1`).
* **Request Body**: Use for passing JSON data when creating or updating resources (used with `POST`, `PUT`, `PATCH`).

### HTTP Status Codes
| Code                      | Meaning                 | When                     |
| ------------------------- | ----------------------- | ------------------------ |
| 200 OK                    | Success with body       | GET, PUT, PATCH          |
| 201 Created               | Resource created        | POST                     |
| 204 No Content            | Success, no body        | DELETE                   |
| 400 Bad Request           | Invalid input           | Validation errors        |
| 401 Unauthorized          | Auth required           | Missing/invalid token    |
| 403 Forbidden             | Auth OK, access denied  | Insufficient permissions |
| 404 Not Found             | Resource not found      |                          |
| 429 Too Many Requests     | Rate limit exceeded     |                          |
| 500 Internal Server Error | Unexpected server error |                          |

---

## Authentication & Security

Security is typically handled via HTTP Headers rather than the request body. You will commonly use either a **JSON Web Token (JWT)** (which includes a signature to prevent tampering) or a **Session Token** (where state is checked in a database/cache).

⚠️ **Crucial Anti-Pattern**: Do not put the `user_id` of the actor in the request body for actions like creating a resource.
```json
// ❌ BAD: A malicious user could pass someone else's user_id and act on their behalf
POST /tweets
{ "text": "Hello world", "user_id": "999" }

// ✅ GOOD: Derive the user context entirely from the secure JWT/Session Header
POST /tweets
{ "text": "Hello world" }
```

---

## Pagination

Pagination is necessary to prevent massive payloads and high latency when querying collections.

### Offset-based (Simple, problematic at scale)
```
GET /events?page=5&limit=20
```
* **Problem 1**: If data is highly active (many writes/deletes), items will shift between pages, causing duplicates or skipped data.
* **Problem 2**: `OFFSET 10000` requires the database to scan 10,000 rows before returning data.

### Cursor-based (Recommended)
```
GET /events?limit=20&cursor=eyJpZCI6MTAwfQ==
```
Instead of a page number, you pass a pointer (cursor) to the last item received. The database simply queries the next 20 items *after* that specific ID. This is resilient to shifting data and highly performant.

---

## REST vs gRPC vs GraphQL

| Feature             | REST                 | gRPC                   | GraphQL               |
| ------------------- | -------------------- | ---------------------- | --------------------- |
| Protocol            | HTTP/1.1 or 2        | HTTP/2                 | HTTP/1.1 or 2         |
| Format              | JSON                 | Protobuf (binary)      | JSON                  |
| Over/under-fetching | Common               | N/A                    | Solved                |
| Best for            | External Public APIs | Internal Microservices | Client-driven queries |

### GraphQL Insights
GraphQL solves REST's overfetching/underfetching by allowing the client to specify exactly what fields it needs in a single request.
* **The N+1 Problem**: Fetching a list of 100 events, and then requesting the venue for each event, results in 101 database queries. **Solution**: Use batching tools like *DataLoaders* to combine these into a single database query.
* **Security**: Unlike REST which secures at the endpoint level, GraphQL can secure access at the **field level** using Schema Resolvers (e.g., anyone can see an event name, but only admins can see event revenue).

### gRPC / RPC Insights
gRPC treats API calls like local function calls (e.g., `getEvents(req)`). 
* **Why it's so fast**: It uses Protocol Buffers to send data as raw binary bytes rather than human-readable JSON, making it 5-10x faster than REST. 
* **Why not use it everywhere?** While great for server-to-server microservices, REST remains standard for client-to-server APIs because standard HTTP JSON easily passes through firewalls and is broadly understood by diverse clients (web, mobile, 3rd party devs).

---

## Real-Time Protocols
If your API requires continuous, open connections (like a chat app or live scores), standard request-response protocols won't work well. Consider:
* **WebSockets**: Full bi-directional communication.
* **Server-Sent Events (SSE)**: One-way data streaming from server to client.
* **WebRTC**: Peer-to-peer streaming (often used for video/audio).

---

## Versioning & Idempotency

### URL Versioning (Most Common)
```
/v1/users      ← stable
/v2/users      ← new version with breaking changes
```

### Idempotency
An API is idempotent if making the same request multiple times produces the same result. `GET`, `PUT`, and `DELETE` are inherently idempotent. `POST` is not. To make a POST request idempotent (e.g., processing a payment), require an `Idempotency-Key` header and cache the result.

---

## Rate Limiting

### Algorithms
| Algorithm      | Behavior                       | Use Case                                 |
| -------------- | ------------------------------ | ---------------------------------------- |
| Token Bucket   | Allows burst up to bucket size | APIs with burst tolerance                |
| Leaky Bucket   | Smooth output rate             | Strict rate enforcement                  |
| Fixed Window   | Count per time window          | Simple, risk of burst at window boundary |
| Sliding Window | Rolling count                  | More accurate, slightly complex          |

---

## Interview Questions

1. What is the difference between Path parameters, Query parameters, and Request bodies?
2. How do you implement cursor-based pagination? Why is it better than offset pagination for high-write systems?
3. What is API idempotency and how do you implement it for a POST request?
4. Why would you choose gRPC for internal services, but REST for client-facing APIs?
5. What is the N+1 problem in GraphQL and how do you solve it?
6. How do you securely verify user actions without passing `user_id` in the JSON body?
7. What algorithm would you choose for a rate limiter that allows short bursts?
8. How would you version an API that has breaking changes? What if you want to avoid versioning?
9. When would you use WebSockets or Server-Sent Events instead of REST?
10. How do you handle error responses in a consistent way across your API?
11. What are some common security vulnerabilities in API design and how do you mitigate them?
12. How would you design an API gateway to handle authentication, rate limiting, and routing for multiple microservices?
13. How do you document your API for internal and external developers? What tools do you use (e.g., OpenAPI/Swagger)?
14. How do you handle backward compatibility when evolving your API?
15. What are some strategies for testing your API endpoints (unit tests, integration tests, contract tests)?