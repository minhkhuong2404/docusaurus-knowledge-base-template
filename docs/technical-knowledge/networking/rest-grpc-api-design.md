---
id: rest-grpc-api-design
title: REST, gRPC & API Design
description: REST principles and constraints, gRPC and Protocol Buffers, GraphQL, API versioning, pagination, idempotency, and API design best practices.
tags: [networking, rest, grpc, graphql, api, protobuf, versioning, http, design]
sidebar_position: 11
---

# REST, gRPC & API Design

## REST — Representational State Transfer

REST is an **architectural style** (not a protocol) defined by Roy Fielding. True REST has 6 constraints:

| Constraint | Meaning |
|-----------|---------|
| **Client-Server** | Separation of concerns; client and server evolve independently |
| **Stateless** | Each request contains all information needed; server stores no client state |
| **Cacheable** | Responses must declare themselves cacheable or not |
| **Uniform Interface** | Consistent resource identification, manipulation via representations, self-descriptive messages |
| **Layered System** | Client can't tell if directly connected to server or intermediary |
| **Code on Demand** | (Optional) Server can send executable code to client |

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
# Offset-based (simple but problematic for large offsets)
GET /orders?page=5&size=20
Response:
{
  "data": [...],
  "pagination": {
    "page": 5, "size": 20,
    "total": 1000,
    "next": "/orders?page=6&size=20",
    "prev": "/orders?page=4&size=20"
  }
}

# Cursor-based (preferred for large datasets)
GET /orders?cursor=eyJpZCI6MTAwfQ&size=20
Response:
{
  "data": [...],
  "nextCursor": "eyJpZCI6MTIwfQ",  // opaque token (base64 of {id:120})
  "hasMore": true
}
```

### Filtering, Sorting

```
GET /orders?status=pending&userId=42&sort=createdAt:desc&minTotal=100
GET /products?category=electronics&price[gte]=100&price[lte]=500
```

### Versioning

```
# URL versioning (simplest, most visible)
GET /v1/orders
GET /v2/orders

# Header versioning
GET /orders
Accept: application/vnd.example.v2+json

# Query param versioning
GET /orders?version=2

# Recommended: URL versioning for public APIs
# Header versioning for internal APIs
```

### Idempotency Keys

For non-idempotent operations (POST), clients can supply idempotency keys:

```http
POST /payments
Idempotency-Key: a8098c1a-f86e-11da-bd1a-00112444be1e
Content-Type: application/json

{"amount": 100, "currency": "USD"}
```

Server stores the key + response for ~24h. If the same key is seen again (retry), return cached response without processing twice. Prevents double charges on network failures.

### Error Response Format

```json
{
  "status": 400,
  "error": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "timestamp": "2026-03-14T10:00:00Z",
  "requestId": "abc-123",
  "details": [
    { "field": "email", "message": "must be a valid email address" },
    { "field": "age",   "message": "must be between 18 and 120" }
  ]
}
```

---

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

## REST vs gRPC Comparison

| | REST | gRPC |
|--|------|------|
| Protocol | HTTP/1.1 or HTTP/2 | HTTP/2 |
| Format | JSON (text) | Protocol Buffers (binary) |
| Schema | Optional (OpenAPI) | Required (.proto file) |
| Payload size | Larger (JSON overhead) | ~3-10x smaller |
| Performance | Good | Excellent |
| Streaming | Limited (SSE, WebSocket workaround) | Native (4 patterns) |
| Browser support | Native | Needs gRPC-Web proxy |
| Human readable | Yes | No (binary) |
| Code generation | Optional | Built-in (all languages) |
| Error model | HTTP status codes | Rich status + details |
| Best for | Public APIs, browser | Internal microservices, streaming |

---

## GraphQL

GraphQL is a **query language for APIs** — clients request exactly the data they need.

```graphql
# Client specifies exactly what fields it wants
query {
  order(id: "42") {
    id
    total
    status
    user {
      name
      email     # only these fields, nothing more
    }
    items {
      quantity
      product {
        name
        price
      }
    }
  }
}

# Response only contains requested fields — no over-fetching
```

```graphql
# Mutation (write)
mutation {
  createOrder(input: { userId: "7", items: [{ productId: "1", qty: 2 }] }) {
    id
    status
    total
  }
}

# Subscription (real-time)
subscription {
  orderStatusChanged(orderId: "42") {
    status
    updatedAt
  }
}
```

### REST vs GraphQL Trade-offs

| | REST | GraphQL |
|--|------|---------|
| Fetching | May over-fetch or under-fetch | Exactly what you ask for |
| N+1 problem | Handled server-side | Client-driven (DataLoader needed) |
| Caching | HTTP-level caching | Complex (per-query, not per-resource) |
| Schema | Optional (OpenAPI) | Required (strongly typed) |
| Best for | Simple CRUD, public APIs | Complex, client-driven data access |

---

## API Design Principles

```
1. Be RESTful where appropriate — resources, HTTP verbs, status codes
2. Design for evolution — version from day 1; backwards compatible changes only
3. Fail fast — validate input immediately, return clear 400 errors
4. Be consistent — same patterns across all endpoints
5. Document everything — OpenAPI/Swagger for REST, .proto for gRPC
6. Rate limit — protect your API (429 with Retry-After header)
7. Idempotency — support retry safely (idempotency keys for POST)
8. Return useful errors — never expose stack traces; include requestId
9. HATEOAS (optional) — include links to related actions in responses
10. Don't break clients — deprecate before removing; sunset headers
```

---

## 🎯 Interview Questions

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
