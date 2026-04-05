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

Rate limiting protects your API from abuse, DDoS attacks, and noisy neighbors by restricting the number of requests a client can make within a specific timeframe. 

### Algorithms

**1. Token Bucket**
* **How it works:** Imagine a bucket that holds a maximum number of tokens. Tokens are added to the bucket at a constant rate. Every incoming request consumes one token. If the bucket is empty, the request is dropped (HTTP 429).
* **Pros:** Highly memory efficient. It natively allows for sudden traffic bursts (up to the bucket's capacity).
* **Cons:** Tuning the bucket size and refill rate to optimal levels can be challenging.
* **Use Case:** Consumer APIs where users might send a quick burst of requests but maintain a lower average rate over time (e.g., Amazon API Gateway, Stripe).

**2. Leaky Bucket**
* **How it works:** Requests enter a queue (the bucket). The server processes (leaks) requests from the queue at a strict, constant rate. If incoming requests fill the queue to its maximum capacity, new requests are dropped.
* **Pros:** Smooths out traffic completely, ensuring a stable, predictable load on your servers regardless of input volatility.
* **Cons:** Sudden traffic spikes can fill up the queue with older requests, causing newer, potentially more important requests to be dropped.
* **Use Case:** Systems that require strict traffic shaping and absolute protection against sudden spikes (e.g., asynchronous task processing, Shopify).

**3. Fixed Window Counter**
* **How it works:** Time is divided into fixed, discrete windows (e.g., 12:00:00 to 12:01:00). A counter increments for each request within that window. If the counter hits the limit, requests are dropped until the next window begins.
* **Pros:** Very simple to implement and highly memory efficient.
* **Cons:** The "Edge Case Spike." If a client sends a burst of requests at the very end of one window and another burst at the very beginning of the next, they can effectively double their allowed rate limit within a very short timeframe.
* **Use Case:** Simple, low-stakes internal tooling or systems where strict accuracy isn't critical.

**4. Sliding Window Log**
* **How it works:** Instead of a counter, the system keeps a log of exact timestamps for every single request. When a new request arrives, the system removes timestamps older than the rolling time window and checks if the remaining log size exceeds the limit.
* **Pros:** Highly accurate. Completely solves the edge-case burst problem of the Fixed Window approach.
* **Cons:** Extremely memory-intensive and computationally expensive, as it must store and process every request timestamp, even for dropped requests.
* **Use Case:** High-tier rate limiting where strict accuracy is paramount, though rarely used in high-volume production due to the overhead.

**5. Sliding Window Counter**
* **How it works:** A hybrid of the Fixed Window and Sliding Window Log. It tracks request counters for fixed windows but estimates the current rolling window's count by calculating a weighted average. This is done based on the previous fixed window's count and the overlap percentage of the current rolling window.
* **Pros:** Memory efficient (only stores a few counters per user) while effectively smoothing out the boundary spikes of the fixed window approach.
* **Cons:** Slightly less perfectly precise than the log approach (it assumes an even distribution of requests within the previous window).
* **Use Case:** The industry standard for high-performance APIs (e.g., Cloudflare, Redis-based rate limiters).

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
16. How do you monitor and log API usage and errors in production?
17. How do you handle CORS (Cross-Origin Resource Sharing) in your API design?
18. What are some best practices for designing RESTful APIs?
19. How do you ensure your API is scalable and can handle high traffic?
20. How do you handle authentication and authorization in your API design?