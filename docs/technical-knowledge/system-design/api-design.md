---
id: api-design
title: API Design
sidebar_label: API Design
description: Best practices for designing REST, gRPC, and GraphQL APIs including versioning, pagination, error handling, rate limiting, idempotency, and API gateway patterns.
tags: [api, rest, grpc, graphql, versioning, pagination, rate-limiting, idempotency, openapi, system-design]
---

# API Design

---

:::tip[System Design Interview Tip]
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


## REST Resource Design

```
Resources = nouns, not verbs
HTTP methods = the verbs

✅ Good                       ❌ Bad
GET    /orders                GET /getOrders
GET    /orders/42             GET /getOrder?id=42
POST   /orders                POST /createOrder
PUT    /orders/42             POST /updateOrder/42
PATCH  /orders/42             PUT /orders/modifyPartial
DELETE /orders/42             GET /deleteOrder?id=42
GET    /users/7/orders        GET /getOrdersForUser?userId=7
POST   /orders/42/cancel      ← action on resource (acceptable exception)
```

### Status Codes Mapping

```
POST /orders          201 Created + Location: /orders/42
GET  /orders/42       200 OK
GET  /orders/999      404 Not Found
PUT  /orders/42       200 OK or 204 No Content
DELETE /orders/42     204 No Content
POST /orders (bad)    400 Bad Request + error body
POST /orders (dup)    409 Conflict
GET  /orders (auth)   401 Unauthorized
```

---


## REST API Best Practices

### Pagination

```

## Spring REST Implementation

```java
@RestController
@RequestMapping("/api/v1/orders")
@Validated
public class OrderController {

    @GetMapping
    public ResponseEntity<Page<OrderDto>> getOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        Pageable pageable = PageRequest.of(page, size, parseSort(sort));
        Page<OrderDto> orders = orderService.findAll(status, pageable);
        return ResponseEntity.ok(orders);
    }

    @PostMapping
    public ResponseEntity<OrderDto> createOrder(
            @Valid @RequestBody CreateOrderRequest req,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {

        OrderDto order = orderService.create(req, idempotencyKey);
        URI location = URI.create("/api/v1/orders/" + order.getId());
        return ResponseEntity.created(location).body(order);
    }

    @ExceptionHandler(OrderNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(OrderNotFoundException ex) {
        return ResponseEntity.status(404)
            .body(new ErrorResponse("ORDER_NOT_FOUND", ex.getMessage()));
    }
}
```

---


## gRPC

gRPC is a **high-performance, open-source RPC framework** from Google, built on HTTP/2 and Protocol Buffers.

```
REST:  JSON over HTTP/1.1 or HTTP/2
gRPC:  Protocol Buffers (binary) over HTTP/2
```

### Protocol Buffers (Protobuf)

```protobuf
// order_service.proto
syntax = "proto3";
package order.v1;

option java_package = "com.example.order.v1";
option java_outer_classname = "OrderProto";

service OrderService {
    rpc GetOrder(GetOrderRequest) returns (OrderResponse);
    rpc CreateOrder(CreateOrderRequest) returns (OrderResponse);
    rpc StreamOrders(StreamOrdersRequest) returns (stream OrderResponse);  // server streaming
    rpc CreateOrders(stream CreateOrderRequest) returns (OrderSummary);    // client streaming
    rpc OrderChat(stream ChatMessage) returns (stream ChatMessage);        // bidirectional
}

message GetOrderRequest {
    int64 order_id = 1;
}

message OrderResponse {
    int64  id         = 1;
    int64  user_id    = 2;
    double total      = 3;
    string status     = 4;
    int64  created_at = 5;  // Unix timestamp millis
}

message CreateOrderRequest {
    int64           user_id = 1;
    repeated Item   items   = 2;
}

message Item {
    int64  product_id = 1;
    int32  quantity   = 2;
    double unit_price = 3;
}
```

### gRPC Communication Patterns

| Pattern | Request | Response | Use Case |
|---------|---------|----------|---------|
| Unary | Single | Single | Standard request-response |
| Server Streaming | Single | Stream | Download, logs, events |
| Client Streaming | Stream | Single | Upload, bulk insert |
| Bidirectional | Stream | Stream | Chat, real-time sync |

### Spring Boot gRPC (net.devh)

```java
// Server
@GrpcService
public class OrderGrpcService extends OrderServiceGrpc.OrderServiceImplBase {

    @Override
    public void getOrder(GetOrderRequest req, StreamObserver<OrderResponse> observer) {
        try {
            Order order = orderRepo.findById(req.getOrderId())
                .orElseThrow(() -> Status.NOT_FOUND
                    .withDescription("Order not found: " + req.getOrderId())
                    .asRuntimeException());

            observer.onNext(toProto(order));
            observer.onCompleted();
        } catch (StatusRuntimeException e) {
            observer.onError(e);
        }
    }

    @Override
    public void streamOrders(StreamOrdersRequest req,
                              StreamObserver<OrderResponse> observer) {
        orderRepo.findByUserId(req.getUserId())
            .forEach(order -> observer.onNext(toProto(order)));
        observer.onCompleted();
    }
}

// Client
@GrpcClient("order-service")
private OrderServiceGrpc.OrderServiceBlockingStub orderStub;

// Call
OrderResponse response = orderStub.getOrder(
    GetOrderRequest.newBuilder().setOrderId(42L).build());
```

---


## GraphQL

GraphQL is a **query language for APIs** — clients request exactly the data they need.

```graphql

## Interview Questions

### Q: What is the difference between Path parameters, Query parameters, and Request bodies?

**A:** Path parameters identify a specific resource, query parameters filter/sort/paginate, and the request body carries the state to create or update. Keep resource identity in the URL and business payload in the body.

### Q: How do you implement cursor-based pagination? Why is it better than offset pagination for high-write systems?

**A:** Return a stable cursor like `created_at,id` and fetch `WHERE (created_at,id) < cursor ORDER BY created_at DESC,id DESC LIMIT N`. It avoids deep scans and skipped/duplicated rows caused by concurrent inserts.

### Q: What is API idempotency and how do you implement it for a POST request?

**A:** Idempotency means retries produce one logical result. Use an idempotency key scoped to client and endpoint, persist first response, and return that response for duplicate keys.

### Q: Why would you choose gRPC for internal services, but REST for client-facing APIs?

**A:** gRPC gives strong contracts, HTTP/2 multiplexing, and efficient protobuf payloads for service-to-service calls. REST is broadly compatible with browsers, mobile SDKs, and third-party integrators.

### Q: What is the N+1 problem in GraphQL and how do you solve it?

**A:** Resolvers issue one query for parents and one per child, exploding DB calls. Batch and cache by request with DataLoader so child fetches become a single grouped query.

### Q: How do you securely verify user actions without passing `user_id` in the JSON body?

**A:** Derive identity from verified auth context (JWT/session) and ignore client-supplied `user_id` for authorization decisions. Authorize against claims/scopes and server-side ownership checks.

### Q: What algorithm would you choose for a rate limiter that allows short bursts?

**A:** Use token bucket: tokens refill at a fixed rate, and requests consume tokens. It allows controlled bursts while still enforcing a long-term average rate.

### Q: How would you version an API that has breaking changes? What if you want to avoid versioning?

**A:** Use explicit versioning (for example `/v2` or media-type version) and run versions in parallel with deprecation windows. To avoid frequent versions, add fields compatibly and use capability flags.

### Q: When would you use WebSockets or Server-Sent Events instead of REST?

**A:** Use WebSockets for bidirectional low-latency interactions like chat/collab; use SSE for one-way server push like notifications. REST stays best for request/response CRUD.

### Q: How do you handle error responses in a consistent way across your API?

**A:** Standardize an error envelope with code, message, correlation ID, and optional details. Map domain failures to stable HTTP status + machine-readable codes.

### Q: What are some common security vulnerabilities in API design and how do you mitigate them?

**A:** Common issues are BOLA/IDOR, injection, broken auth, and excessive data exposure. Mitigate with deny-by-default authorization, parameterized queries, schema validation, and output minimization.

### Q: How would you design an API gateway to handle authentication, rate limiting, and routing for multiple microservices?

**A:** Centralize authn/authz policy checks, per-tenant rate limits, and request routing based on path/headers/service discovery. Keep business logic in services and make gateway behavior observable and stateless.

### Q: How do you document your API for internal and external developers? What tools do you use (e.g., OpenAPI/Swagger)?

**A:** Use OpenAPI as source of truth, publish interactive docs, and auto-generate SDKs/examples. Keep docs versioned with the API and enforce contract checks in CI.

### Q: How do you handle backward compatibility when evolving your API?

**A:** Prefer additive changes, never repurpose existing fields, and keep old behavior until clients migrate. Announce deprecations early with telemetry on remaining consumers.

### Q: What are some strategies for testing your API endpoints (unit tests, integration tests, contract tests)?

**A:** Use unit tests for validation/mapping logic, integration tests for DB and auth flows, and contract tests between consumers/providers. Add load and chaos tests for critical paths.

### Q: How do you monitor and log API usage and errors in production?

**A:** Track RED metrics (rate, errors, duration), segment by endpoint/tenant/status code, and emit structured logs with correlation IDs. Alert on SLO burn, not only raw error count.

### Q: How do you handle CORS (Cross-Origin Resource Sharing) in your API design?

**A:** Use an allowlist of trusted origins, methods, and headers, and set credentials only when required. Cache preflight responses and avoid wildcard origins for authenticated APIs.

### Q: What are some best practices for designing RESTful APIs?

**A:** Use resource-oriented URIs, correct HTTP semantics, idempotent methods where applicable, and predictable pagination/filtering. Keep schemas explicit and error contracts stable.

### Q: How do you ensure your API is scalable and can handle high traffic?

**A:** Make handlers stateless, cache aggressively where safe, and use async processing for slow work. Apply rate limits, autoscaling, and load tests based on realistic traffic patterns.

### Q: How do you handle authentication and authorization in your API design?

**A:** Authenticate with standards like OAuth2/OIDC and short-lived tokens; authorize with RBAC/ABAC at resource level. Enforce checks consistently at service boundaries and audit decisions.

### REST & gRPC Specific Questions


**Q1. What makes an API truly RESTful?**
> True REST satisfies Fielding's 6 constraints: client-server separation, statelessness (no session state on server), cacheability (responses declare cache policy), uniform interface (resource-based URIs, standard HTTP methods), layered system (client can't distinguish server from proxy), and optionally code-on-demand. Most "REST" APIs are actually HTTP APIs — they miss HATEOAS (Hypermedia As The Engine of Application State), which would include navigable links in responses.

**Q2. What is the difference between PUT and PATCH?**
> PUT replaces the entire resource — send the complete new state; any field omitted is set to null/default. PUT is idempotent. PATCH partially updates a resource — only send fields to change; omitted fields are unchanged. PATCH is not necessarily idempotent (applying the same delta twice may differ if others wrote between). For most APIs, PATCH is preferred for partial updates.

**Q3. What are the advantages of gRPC over REST for internal microservices?**
> Protocol Buffers encode data in binary — 3-10x smaller payloads, faster serialization. HTTP/2 multiplexing enables concurrent calls on one connection. Native bidirectional streaming (chat, real-time sync). Strongly typed contracts with code generation in all languages (no manual DTO writing). Rich error model. Better performance for high-throughput internal calls. Downside: not browser-native, binary (not human-readable).

**Q4. What is idempotency and why is it important for APIs?**
> An operation is idempotent if performing it N times has the same effect as once. GET, PUT, DELETE are inherently idempotent. POST is not — submitting a payment twice charges twice. Idempotency keys let clients safely retry POSTs: include a unique key per logical operation; server deduplicates based on the key and returns the cached response. Critical for reliability in distributed systems where network failures cause retransmissions.

**Q5. How would you design API pagination for a large dataset?**
> Avoid OFFSET for large datasets (O(offset) scan). Use cursor/keyset pagination: the last-seen record's ID or timestamp becomes the "cursor" for the next page. Return `nextCursor` (opaque token) and `hasMore` in the response. This is O(1) per page regardless of depth. For total count needs, provide a separate count endpoint or include count only on the first page (expensive to recompute on every page).

**Q6. What is the N+1 problem in GraphQL and how is DataLoader solving it?**
> When resolving a list of N orders each with a user, a naive resolver makes 1 query for orders + N queries for each user — N+1 total. DataLoader batches: instead of fetching user for each order immediately, it collects all user IDs requested during one event loop tick, then makes a single `SELECT * FROM users WHERE id IN (...)`. Dramatically reduces DB queries for nested object resolution.

**Q7. How do you handle API versioning and what are the trade-offs of each approach?**
> URL versioning (`/v1/orders`): explicit, easy to test, breaks REST uniformity. Recommended for public APIs. Header versioning (`Accept: application/vnd.v2+json`): REST-pure, clients set version once, but harder to test in browsers. Query param (`?version=2`): easy but pollutes URLs. Best practice: URL versioning for public APIs; maintain N-1 versions simultaneously; use Sunset headers to warn of deprecation; never make breaking changes within a version.

**Q8. What is HATEOAS and is it required for REST?**
> HATEOAS (Hypermedia As The Engine of Application State): responses include links to related actions/resources, so clients can discover API behavior dynamically rather than hardcoding URLs. Example: an order response includes `"links": {"cancel": "/orders/42/cancel", "invoice": "/orders/42/invoice"}`. Technically required for "true" REST per Fielding, but rarely implemented. Benefit: loose coupling between client and API structure. Practical trade-off: complexity vs flexibility.