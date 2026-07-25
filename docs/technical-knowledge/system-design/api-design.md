---
id: api-design
title: API Design — REST, gRPC & GraphQL
sidebar_label: API Design
description: A complete guide to API design — REST principles, gRPC, GraphQL, pagination, rate limiting, idempotency, versioning, security, API gateway patterns, and production observability. Beginner through senior depth.
tags: [api, rest, grpc, graphql, versioning, pagination, rate-limiting, idempotency, openapi, system-design, websocket, cors, hateoas]
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# API Design — REST, gRPC & GraphQL

:::info[Who this guide is for]
- **New learners** — start at [What is an API?](#what-is-an-api) and [REST Fundamentals](#rest-fundamentals) to build the foundational mental model.
- **Senior engineers** — jump to [gRPC Deep Dive](#grpc-deep-dive), [GraphQL Internals](#graphql), [Rate Limiting Algorithms](#rate-limiting), [API Gateway](#api-gateway-patterns), or [Security Threat Model](#api-security).
:::

:::tip[System design interview tip]
When designing an API in a system design interview, spend under 5 minutes on this section. Declare your protocol choice (REST/gRPC/GraphQL) and why, sketch the 3–5 core endpoints, reference shorthand status codes (`2xx`, `4xx`, `5xx`), and move on to the system architecture. Only expand if the interviewer asks you to.
:::

---

## What is an API?

An **API** (Application Programming Interface) is a contract that defines how two systems communicate. It specifies what operations are available, what inputs they accept, what outputs they return, and what errors they can produce.

```
Without a well-designed API:
  Client:  POST /updateUserEmailAndNameAndPhoneAndAddress?userId=42&newEmail=...
  Server:  interprets this however the developer felt that day
  Result:  every client is coupled to the server's internal implementation  ❌

With a well-designed API:
  Client:  PATCH /users/42  { "email": "new@example.com" }
  Server:  validates, updates, returns 200 with updated resource
  Result:  any client in any language can consume this consistently  ✅
```

### Why API design matters

| Bad API design | Good API design |
|---------------|----------------|
| Breaking changes crash clients on every deploy | Versioning and backward compatibility give clients time to migrate |
| No pagination returns 10M rows crashing the client | Cursor pagination returns bounded pages efficiently |
| Inconsistent error shapes require per-endpoint error handling | Standardised error envelope — one error handler for all endpoints |
| No rate limiting — one bad client DoS's everyone | Rate limiting protects the service for all consumers |
| `user_id` in request body — attackers act as other users | Identity derived from signed JWT — unforgeable |

### Choosing the right protocol

```
Is this a public-facing API consumed by browsers or third parties?
  → REST

Is this an internal service-to-service call where performance matters?
  → gRPC

Does the client need to fetch deeply nested, flexible data shapes?
  → GraphQL

Does the server need to push data to the client continuously?
  → WebSockets (bidirectional) or SSE (server-to-client)
```

---

## REST Fundamentals

### Resource-oriented design

REST (Representational State Transfer) treats everything as a **resource** (noun). HTTP methods are the **verbs**. URLs describe *what* you are operating on; methods describe *how*.

```
✅ Correct resource-oriented design:
GET    /orders              → list orders
GET    /orders/42           → get order #42
POST   /orders              → create a new order
PUT    /orders/42           → replace order #42 entirely
PATCH  /orders/42           → partially update order #42
DELETE /orders/42           → delete order #42
GET    /orders/42/items     → get the items belonging to order #42
POST   /orders/42/cancel    → action on a resource (acceptable exception)

❌ RPC-style URLs that violate resource orientation:
POST /createOrder           → verb in URL
GET  /deleteOrder?id=42     → side effect on a GET (non-idempotent)
POST /updateOrderStatus     → method name, not a resource
GET  /getOrdersForUser?userId=7  → should be GET /users/7/orders
```

:::tip[URL rules]
- Use **plural nouns** for collections (`/orders`, not `/order`)
- Use **lowercase and hyphens** (`/order-items`, not `/orderItems` or `/OrderItems`)
- Nest only one level deep for relationships (`/orders/42/items` — fine; `/users/7/orders/42/items/5` — too deep, flatten it)
- Actions that don't map to CRUD use a verb sub-resource: `POST /orders/42/cancel`, `POST /payments/99/refund`
:::

### HTTP Methods: GET vs. POST vs. PUT

Understanding the semantic and architectural differences between HTTP verbs is essential for designing robust REST APIs:

| Attribute | `GET` | `POST` | `PUT` | `PATCH` |
|---|---|---|---|---|
| **Semantic Action** | Read / Retrieve | Create / Process Action | Replace / Overwrite | Partial Update |
| **Request Body** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| **Safe Method** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Idempotent** | ✅ Yes | ❌ No | ✅ Yes | ❌ No (generally) |
| **Cacheable** | ✅ Yes | ❌ No (unless specified) | ❌ No | ❌ No |

#### Key Architectural Distinctions

1. **Idempotency (`PUT` vs. `POST`)**
   - **`PUT` is idempotent**: Sending `PUT /orders/42 { "status": "shipped" }` multiple times consecutively results in the exact same resource state as sending it once.
   - **`POST` is NOT idempotent**: Sending `POST /orders { "item": "laptop" }` multiple times creates multiple distinct order records (generating new IDs) and triggers multiple downstream events (e.g. charging a payment gateway twice).

2. **Resource Addressing (`PUT` vs. `POST`)**
   - Use **`POST`** when the server determines the URI of the newly created resource (e.g., `POST /orders` returns path `/orders/12345`).
   - Use **`PUT`** when the client determines or already knows the target URI (e.g., `PUT /users/lukhuong` creates or overwrites that specific resource).

3. **Safe Methods (`GET` vs. Others)**
   - A method is **safe** if it does not change resource state on the server. `GET` is safe.
   - Any side effects of a `GET` request (like logging DB analytics, page-view counters, etc.) must not mutate the primary representation of the target resource.

4. **Complete Replacement vs. Partial Update (`PUT` vs. `PATCH`)**
   - **`PUT`** replaces the entire target resource with the request payload. Missing fields are either overwritten to `null` or reset to defaults.
   - **`PATCH`** applies a partial delta update, modifying only the fields explicitly supplied in the payload.

### Where to put inputs

| Input type | Location | When to use |
|-----------|---------|------------|
| Resource identifier | **Path** `GET /orders/42` | Required to identify the specific resource |
| Filters, sorting, pagination | **Query** `GET /orders?status=pending&sort=createdAt,desc` | Optional — does not change the resource |
| Business payload | **Body** (JSON) `POST /orders { "items": [...] }` | Creating or mutating state |
| Auth, tracing, idempotency | **Headers** `Authorization: Bearer ...` | Cross-cutting concerns, not business data |

### HTTP status codes

| Code | Meaning | When to use |
|------|---------|------------|
| `200 OK` | Success with body | GET, PUT, PATCH responses |
| `201 Created` | Resource created | POST that creates a resource; include `Location` header |
| `204 No Content` | Success, no body | DELETE, PUT with no body returned |
| `400 Bad Request` | Malformed or invalid request | Failed validation, wrong type |
| `401 Unauthorized` | Authentication missing or invalid | Missing/expired token |
| `403 Forbidden` | Authenticated but not authorised | Insufficient permissions |
| `404 Not Found` | Resource does not exist | Wrong ID or URL |
| `409 Conflict` | State conflict | Duplicate creation, optimistic lock failure |
| `410 Gone` | Resource permanently deleted | Deleted resources (vs 404 = never existed) |
| `422 Unprocessable Entity` | Semantically invalid | Business rule violation (e.g. insufficient balance) |
| `429 Too Many Requests` | Rate limit exceeded | Include `Retry-After` header |
| `500 Internal Server Error` | Unexpected server failure | Never expose internal details |
| `502 Bad Gateway` | Upstream service failed | API gateway or reverse proxy |
| `503 Service Unavailable` | Temporarily unavailable | Maintenance window, overload |

### Consistent error response format

Every endpoint must return errors in the same structure. Clients should need only one error handler:

```json
{
  "status": 422,
  "errorCode": "INSUFFICIENT_BALANCE",
  "message": "Account balance of $10.00 is insufficient for a transfer of $50.00",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "timestamp": "2024-01-15T09:30:00Z",
  "fieldErrors": [
    { "field": "amount", "message": "Must not exceed current balance" }
  ]
}
```

| Field | Purpose |
|-------|---------|
| `status` | HTTP status code — matches the HTTP response status |
| `errorCode` | Machine-readable code — client switches on this, not the message |
| `message` | Human-readable — for developers and logs |
| `traceId` | Correlation ID — link logs across services |
| `fieldErrors` | Per-field validation failures (validation errors only) |

---

## Authentication & Security Basics

Security is enforced through **headers**, never through request bodies.

### The user_id anti-pattern

```json
// ❌ DANGEROUS: client sends their own user_id — trivially forgeable
POST /orders
{
  "userId": 999,
  "items": [...]
}
// Attacker changes userId to 42 → creates orders as another user

// ✅ CORRECT: identity is derived from the signed JWT
POST /orders
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
{
  "items": [...]
}
// Server extracts userId from the verified JWT — impossible to forge
```

### Token types

<Tabs>
  <TabItem value="jwt" label="JWT (stateless)">

```
Header.Payload.Signature
eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjQyLCJyb2xlIjoiVVNFUiIsImV4cCI6MTcwNTMyNzgwMH0.xyz

Payload (decoded):
{
  "userId": 42,
  "role": "USER",
  "exp": 1705327800   ← expiry — short-lived (15min–1hr)
}
```

**Pros:** Stateless — server validates signature without a DB lookup. Works across multiple server instances.

**Cons:** Cannot be invalidated before expiry (see [Refresh Token Security & Multi-Device Session Invalidation](../security/refresh-token-security-invalidation.md) for rotation and invalidation patterns).

  </TabItem>
  <TabItem value="session" label="Session Token (stateful)">

```
Cookie: sessionId=4bf92f3577b34da6a3ce929d0e0e4736
```

Server looks up `sessionId` in Redis/DB to get the user context.

**Pros:** Immediately revocable — delete the session record to log out.

**Cons:** Requires session store — adds latency; doesn't scale across stateless services without a shared store.

  </TabItem>
  <TabItem value="apikey" label="API Key (machine-to-machine)">

```
X-API-Key: sk_live_4bf92f3577b34da6a3ce929d0e0e4736
```

**Pros:** Simple for M2M integrations. Easy to scope (read-only, rate-limit by key).

**Cons:** Long-lived — rotation policy required. No user identity embedded.

  </TabItem>
</Tabs>

---

## Pagination

Pagination prevents catastrophic queries that return millions of rows, crash client memory, and time out database connections.

### Offset-based pagination — simple but broken at scale

```
GET /orders?page=5&limit=20
→ SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 100
```

**Problem 1 — data shifting:** if someone inserts 3 orders while you're on page 5, page 6 repeats 3 orders you already saw (or skips 3). Concurrent writes invalidate page positions.

**Problem 2 — deep scan:** `OFFSET 100000` forces the database to read and discard 100,000 rows before returning 20. At scale this becomes a full table scan.

**When it's acceptable:** admin UIs with infrequent data changes, small datasets (< 10,000 rows total), or when approximate results are acceptable.

### Cursor-based pagination — the production standard

```
GET /orders?limit=20&cursor=eyJpZCI6MTAwLCJjcmVhdGVkQXQiOiIyMDI0LTAxLTE1VDA5OjAwOjAwWiJ9
```

The cursor is an opaque, Base64-encoded pointer to the last item seen. The server decodes it and runs a keyset query:

```sql
-- Cursor decoded: { "id": 100, "createdAt": "2024-01-15T09:00:00Z" }
SELECT * FROM orders
WHERE (created_at, id) < ('2024-01-15T09:00:00Z', 100)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

**Why this works:** the `WHERE` clause uses an index — no rows are scanned and discarded. New inserts don't shift existing pages. Consistent at any depth.

```json
// Response structure
{
  "data": [...20 orders...],
  "pagination": {
    "nextCursor": "eyJpZCI6ODAuLi59",   // null if last page
    "hasMore": true,
    "limit": 20
  }
}
```

:::tip[Cursor encoding]
Base64-encode the cursor to prevent clients from parsing or manipulating it. The internal structure (`id`, `created_at`) is an implementation detail — clients treat the cursor as an opaque token.
:::

### Keyset vs. cursor — what's the difference?

They are the same concept. "Cursor" refers to the opaque token the API returns. "Keyset" refers to the SQL `WHERE` clause that implements it. Both mean: "give me records after this stable pointer."

---

## REST vs gRPC vs GraphQL

| | REST | gRPC | GraphQL |
|-|------|------|---------|
| **Protocol** | HTTP/1.1 or HTTP/2 | HTTP/2 (required) | HTTP/1.1 or HTTP/2 |
| **Data format** | JSON (text) | Protocol Buffers (binary) | JSON |
| **Type safety** | Optional (OpenAPI) | Strict (Protobuf schema) | Strict (SDL schema) |
| **Contract** | OpenAPI / informal | `.proto` file | SDL schema |
| **Over-fetching** | Common | N/A (exact struct) | Solved — client specifies fields |
| **Under-fetching** | Common (multiple round trips) | N/A | Solved — single query, multiple entities |
| **Streaming** | Via SSE or WebSocket | Native (4 patterns) | Via subscriptions |
| **Browser support** | ✅ Native | ❌ Requires gRPC-Web proxy | ✅ Native |
| **Human-readable** | ✅ JSON | ❌ Binary | ✅ JSON |
| **Payload size** | Large (verbose JSON) | Small (binary, ~3–10× smaller) | Varies (only requested fields) |
| **Best for** | Public APIs, browser clients | Internal microservices | Client-driven data fetching |

---

## gRPC Deep Dive

gRPC is a high-performance RPC framework from Google. Calls look like local function invocations — the network is abstracted away.

### Protocol Buffers — the type contract

```protobuf
// order_service.proto — this file IS the API contract
syntax = "proto3";
package order.v1;

option java_package = "com.example.order.v1";

// Service definition — one gRPC "endpoint" per rpc declaration
service OrderService {
    rpc GetOrder(GetOrderRequest)           returns (OrderResponse);          // Unary
    rpc StreamOrders(StreamOrdersRequest)   returns (stream OrderResponse);  // Server streaming
    rpc BulkCreateOrders(stream CreateOrderRequest) returns (OrderSummary); // Client streaming
    rpc OrderUpdates(stream HeartBeat)      returns (stream OrderResponse);  // Bidirectional
}

message GetOrderRequest {
    int64 order_id = 1;     // field number 1 — used in binary encoding (never change these)
}

message OrderResponse {
    int64  id         = 1;
    int64  user_id    = 2;
    double total      = 3;
    string status     = 4;
    int64  created_at = 5;  // Unix timestamp millis

    repeated Item items = 6;  // list of items
}

message Item {
    int64  product_id = 1;
    int32  quantity   = 2;
    double unit_price = 3;
    string name       = 4;
}

message CreateOrderRequest {
    int64          user_id = 1;
    repeated Item  items   = 2;
}

message StreamOrdersRequest {
    int64 user_id = 1;
}

message OrderSummary {
    int32  total_created = 1;
    double total_value   = 2;
}

message HeartBeat {
    int64 timestamp = 1;
}
```

:::warning[Never change field numbers in a .proto file]
Protobuf uses field numbers (not names) in the binary encoding. Changing `int64 order_id = 1` to `= 2` breaks all existing serialized messages. You can rename fields (the name is not in the wire format) but **never reuse or change field numbers**. Adding new fields is always safe — old clients ignore unknown fields.
:::

### Four gRPC communication patterns

```
1. Unary (request-response — most common)
   Client: GetOrder(id=42)  →  Server: OrderResponse

2. Server streaming (server pushes multiple responses)
   Client: StreamOrders(userId=7)  →  Server: order1, order2, order3... END

3. Client streaming (client pushes multiple requests)
   Client: item1, item2, item3... END  →  Server: BulkSummary

4. Bidirectional streaming (both sides stream simultaneously)
   Client: HeartBeat  ⇄  Server: OrderUpdate (like WebSockets over HTTP/2)
```

| Pattern | Use case |
|---------|---------|
| Unary | Standard CRUD — get, create, update, delete |
| Server streaming | Live order updates, log tailing, large file downloads |
| Client streaming | Bulk data upload, batch inserts, chunked file upload |
| Bidirectional | Real-time chat, collaborative editing, live dashboards |

### Spring Boot gRPC implementation

```java
// ── Server side ───────────────────────────────────────────────────────────
@GrpcService
@Slf4j
public class OrderGrpcService extends OrderServiceGrpc.OrderServiceImplBase {

    @Autowired private OrderRepository orderRepo;

    // Unary RPC
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

    // Server streaming RPC
    @Override
    public void streamOrders(StreamOrdersRequest req,
                              StreamObserver<OrderResponse> observer) {
        try {
            orderRepo.findByUserIdOrderByCreatedAtDesc(req.getUserId())
                .forEach(order -> observer.onNext(toProto(order)));
            observer.onCompleted();
        } catch (Exception e) {
            observer.onError(Status.INTERNAL.withDescription(e.getMessage()).asRuntimeException());
        }
    }

    // Client streaming RPC
    @Override
    public StreamObserver<CreateOrderRequest> bulkCreateOrders(
            StreamObserver<OrderSummary> responseObserver) {

        return new StreamObserver<>() {
            private int count = 0;
            private double total = 0;

            @Override
            public void onNext(CreateOrderRequest req) {
                Order saved = orderRepo.save(fromProto(req));
                count++;
                total += saved.getTotal();
            }

            @Override
            public void onError(Throwable t) {
                log.error("Client streaming error", t);
            }

            @Override
            public void onCompleted() {
                responseObserver.onNext(OrderSummary.newBuilder()
                    .setTotalCreated(count)
                    .setTotalValue(total)
                    .build());
                responseObserver.onCompleted();
            }
        };
    }

    private OrderResponse toProto(Order order) {
        return OrderResponse.newBuilder()
            .setId(order.getId())
            .setUserId(order.getUserId())
            .setTotal(order.getTotal())
            .setStatus(order.getStatus().name())
            .setCreatedAt(order.getCreatedAt().toEpochMilli())
            .build();
    }
}
```

```java
// ── Client side ───────────────────────────────────────────────────────────
@Service
public class OrderGrpcClient {

    @GrpcClient("order-service")
    private OrderServiceGrpc.OrderServiceBlockingStub blockingStub;

    @GrpcClient("order-service")
    private OrderServiceGrpc.OrderServiceStub asyncStub;

    // Unary call — blocks until response
    public OrderResponse getOrder(long orderId) {
        return blockingStub
            .withDeadlineAfter(5, TimeUnit.SECONDS)
            .getOrder(GetOrderRequest.newBuilder().setOrderId(orderId).build());
    }

    // Server streaming — processes each response as it arrives
    public void streamOrders(long userId, Consumer<OrderResponse> onEach) {
        CountDownLatch latch = new CountDownLatch(1);
        asyncStub.streamOrders(
            StreamOrdersRequest.newBuilder().setUserId(userId).build(),
            new StreamObserver<>() {
                @Override public void onNext(OrderResponse r) { onEach.accept(r); }
                @Override public void onError(Throwable t)    { latch.countDown(); }
                @Override public void onCompleted()           { latch.countDown(); }
            }
        );
        latch.await(30, TimeUnit.SECONDS);
    }
}
```

```yaml
# application.yaml — gRPC client config
grpc:
  client:
    order-service:
      address: static://order-service:9090
      negotiation-type: plaintext    # use TLS in production
      enable-keep-alive: true
      keep-alive-time: 30s
      keep-alive-timeout: 5s
```

### gRPC error handling — Status codes

gRPC has its own status codes (different from HTTP):

| gRPC Status | HTTP equivalent | When to use |
|-------------|----------------|------------|
| `OK` | 200 | Success |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `ALREADY_EXISTS` | 409 | Duplicate creation |
| `INVALID_ARGUMENT` | 400 | Bad input |
| `UNAUTHENTICATED` | 401 | Missing/invalid credentials |
| `PERMISSION_DENIED` | 403 | Insufficient permissions |
| `RESOURCE_EXHAUSTED` | 429 | Rate limit exceeded |
| `UNAVAILABLE` | 503 | Service temporarily down (safe to retry) |
| `INTERNAL` | 500 | Unexpected server error |
| `DEADLINE_EXCEEDED` | 504 | Timeout |

---

## GraphQL

GraphQL is a **query language** — the client specifies exactly what data it needs, in one request, regardless of how the server stores it.

### The problem GraphQL solves

```
REST under-fetching (multiple round trips):
  GET /users/42          → { id, name, email }
  GET /users/42/orders   → [{ id, total }, ...]
  GET /orders/1/items    → [{ id, product, qty }]
  3 round trips, potential waterfall

REST over-fetching (too much data):
  GET /users/42 → { id, name, email, phone, address, createdAt, lastLogin, ... }
  You needed only name and email — the rest is wasted bandwidth

GraphQL (one request, exactly what you need):
  query {
    user(id: 42) {
      name
      email
      orders(last: 5) {
        total
        items { productName qty }
      }
    }
  }
```

### Schema Definition Language (SDL)

```graphql
# The GraphQL schema IS the contract between client and server

type Query {
  user(id: ID!): User
  orders(status: OrderStatus, first: Int, after: String): OrderConnection!
}

type Mutation {
  createOrder(input: CreateOrderInput!): OrderPayload!
  cancelOrder(id: ID!): OrderPayload!
}

type Subscription {
  orderStatusChanged(orderId: ID!): Order!   # real-time push
}

type User {
  id:        ID!
  name:      String!
  email:     String!
  orders:    [Order!]!
  createdAt: DateTime!
}

type Order {
  id:        ID!
  status:    OrderStatus!
  total:     Float!
  items:     [OrderItem!]!
  user:      User!          # resolver — can JOIN or call another service
}

type OrderItem {
  product:  Product!
  quantity: Int!
  price:    Float!
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

# Cursor-based connection pattern (Relay spec)
type OrderConnection {
  edges:    [OrderEdge!]!
  pageInfo: PageInfo!
}
type OrderEdge {
  node:   Order!
  cursor: String!
}
type PageInfo {
  hasNextPage:     Boolean!
  endCursor:       String
}

input CreateOrderInput {
  items: [OrderItemInput!]!
}
input OrderItemInput {
  productId: ID!
  quantity:  Int!
}
type OrderPayload {
  order:  Order
  errors: [UserError!]!
}
type UserError {
  field:   String
  message: String!
}
```

### The N+1 problem and DataLoader

```javascript
// ❌ N+1 without DataLoader
// Resolving 100 orders, each with a user:
// → 1 query: SELECT * FROM orders LIMIT 100
// → 100 queries: SELECT * FROM users WHERE id = ?  (one per order)
// = 101 queries total

const resolvers = {
  Order: {
    user: (order) => db.query('SELECT * FROM users WHERE id = ?', [order.userId])
    // Called once per order — 100 separate DB calls
  }
}

// ✅ DataLoader — batches all user IDs, one query
import DataLoader from 'dataloader';

const userLoader = new DataLoader(async (userIds) => {
  // Called ONCE with all 100 userIds collected during one event loop tick
  const users = await db.query('SELECT * FROM users WHERE id IN (?)', [userIds]);
  // Return in the same order as userIds (DataLoader requirement)
  return userIds.map(id => users.find(u => u.id === id));
});

const resolvers = {
  Order: {
    user: (order) => userLoader.load(order.userId)
    // load() defers — DataLoader collects all IDs, then calls the batch fn once
  }
}
// Result: 1 query for orders + 1 batched query for all users = 2 queries total
```

### Field-level security in GraphQL

Unlike REST (endpoint-level auth), GraphQL can secure individual fields:

```javascript
const resolvers = {
  Order: {
    // Anyone who can see an order can see these:
    id:     (order) => order.id,
    status: (order) => order.status,
    total:  (order) => order.total,

    // Only the order owner or an admin can see payment details:
    paymentMethod: (order, _, context) => {
      if (context.userId !== order.userId && context.role !== 'ADMIN') {
        throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN' } });
      }
      return order.paymentMethod;
    },

    // Only finance team can see the raw cost (internal margin info):
    costPrice: (order, _, context) => {
      if (!context.scopes.includes('finance:read')) return null;
      return order.costPrice;
    }
  }
}
```

### Query depth and complexity limiting

GraphQL's flexibility is also a vulnerability — a malicious client can craft deeply nested queries that blow up your database:

```graphql
# ❌ Deeply nested attack query:
{
  users {
    orders {
      user {
        orders {
          user {
            orders { ... }  # 5 levels deep → exponential DB queries
          }
        }
      }
    }
  }
}
```

```javascript
import depthLimit from 'graphql-depth-limit';
import { createComplexityLimitRule } from 'graphql-validation-complexity';

const server = new ApolloServer({
  schema,
  validationRules: [
    depthLimit(5),                       // max 5 levels of nesting
    createComplexityLimitRule(1000, {    // each field costs points; reject if total > 1000
      scalarCost: 1,
      objectCost: 2,
      listFactor: 10                     // lists multiply cost by 10
    })
  ]
});
```

---

## Rate Limiting

Rate limiting protects your API from abuse, accidental traffic spikes, DDoS attacks, and noisy-neighbour effects.

### Algorithm comparison

<Tabs>
  <TabItem value="token-bucket" label="Token Bucket">

```
Bucket capacity: 100 tokens
Refill rate: 10 tokens/second

Client sends 80 requests in 1 second:
  Tokens: 100 → 20 remaining  ✅ all served

Client sends 120 requests in 1 second:
  Tokens: 100 → 0 → 20 requests dropped (429)  ❌

After 8 seconds with no requests:
  Tokens refill to 80  ✅ burst capacity partially restored
```

**Implementation:**
```python
import time

class TokenBucket:
    def __init__(self, capacity: int, refill_rate: float):
        self.capacity    = capacity
        self.refill_rate = refill_rate   # tokens per second
        self.tokens      = capacity
        self.last_refill = time.time()

    def allow(self) -> bool:
        now = time.time()
        elapsed = now - self.last_refill
        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
        self.last_refill = now

        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False
```

**Pros:** Allows natural bursts up to bucket capacity. Memory-efficient (one float per client).

**Cons:** Bucket size tuning requires traffic analysis.

**Used by:** Amazon API Gateway, Stripe, most AWS services.

  </TabItem>
  <TabItem value="sliding-window-counter" label="Sliding Window Counter">

```
Window: 60 seconds
Limit: 100 requests

At time T=60.5 seconds, client sends a request.
Current window (T=0.5 to T=60.5):
  Weight from previous window: 0.5/60 = 0.8% overlap
  Previous window count: 90 requests
  Current window count: 15 requests
  Estimated total: 90 × 0.8% + 15 = 72 + 15 = 87  ✅ under 100, allow
```

**Redis implementation:**

```python
import redis
import time

r = redis.Redis()

def sliding_window_allow(client_id: str, limit: int, window_sec: int) -> bool:
    now        = time.time()
    window_key = f"rate:{client_id}:{int(now // window_sec)}"
    prev_key   = f"rate:{client_id}:{int(now // window_sec) - 1}"

    pipe = r.pipeline()
    pipe.get(prev_key)
    pipe.incr(window_key)
    pipe.expire(window_key, window_sec * 2)
    prev_count, curr_count, _ = pipe.execute()

    prev_count = int(prev_count or 0)
    curr_count = int(curr_count)
    elapsed    = now % window_sec
    weight     = 1 - (elapsed / window_sec)

    estimated = int(prev_count * weight) + curr_count
    return estimated <= limit
```

**Pros:** Smooths edge-case spike of fixed window. Memory-efficient (two integers per client).

**Used by:** Cloudflare, nginx rate limiting, Redis-based limiters.

  </TabItem>
  <TabItem value="fixed-window" label="Fixed Window Counter">

```
Window: 60 seconds, limit: 100 requests

12:00:00–12:01:00 window:  client sends 100 requests → limit reached
12:01:00 (new window):     counter resets → client can send 100 more

Problem: at 12:00:59 client sends 100, at 12:01:01 sends 100 again
→ 200 requests in 2 seconds — double the intended rate
```

**When to use:** Simple internal tooling, low-stakes APIs, when approximate limits are acceptable.

  </TabItem>
  <TabItem value="leaky-bucket" label="Leaky Bucket">

```
Queue capacity: 100 requests
Processing rate: 10 requests/second (constant)

Request arrives → joins queue if space available
Queue is always drained at exactly 10 req/sec regardless of input rate
If queue is full → new request dropped (429)
```

**Pros:** Perfectly smooth output — server always receives exactly N req/sec. Ideal for protecting downstream systems from burst.

**Cons:** Bursty input fills the queue with old requests; newer requests are queued behind them even if the old ones are less important.

**Used by:** Shopify, asynchronous task queues, outbound API call throttling.

  </TabItem>
</Tabs>

### Rate limiting response headers

Always tell the client how much quota remains:

```
HTTP/1.1 200 OK
X-RateLimit-Limit:     1000       ← requests allowed per window
X-RateLimit-Remaining: 847        ← requests left in current window
X-RateLimit-Reset:     1705327800 ← Unix timestamp when window resets
Retry-After:           42         ← seconds to wait (on 429 only)
```

### Distributed rate limiting with Redis

In a multi-instance deployment, per-instance counters undercount. Use Redis for a shared counter:

```python
import redis

r = redis.Redis(host="redis", port=6379)

def rate_limit(client_id: str, limit: int, window_sec: int) -> dict:
    key = f"rate:{client_id}"

    pipe = r.pipeline()
    pipe.incr(key)
    pipe.ttl(key)
    count, ttl = pipe.execute()

    if count == 1:               # first request — set the window expiry
        r.expire(key, window_sec)
        ttl = window_sec

    allowed   = count <= limit
    remaining = max(0, limit - count)

    if not allowed:
        r.decr(key)              # don't count rejected requests against quota

    return {
        "allowed":   allowed,
        "remaining": remaining,
        "reset_in":  ttl,
        "limit":     limit
    }
```

---

## Versioning Strategies

### URL versioning (recommended for public APIs)

```
/api/v1/orders   ← stable, maintained
/api/v2/orders   ← new version with breaking changes
```

**Pros:** Explicit, easy to test in browsers, easy to route at the gateway level.

**Cons:** URL is technically not "pure REST" (versioning is not a resource property). Most teams accept this trade-off.

### Header versioning

```
GET /api/orders
Accept: application/vnd.myapi.v2+json
```

**Pros:** Clean URLs, REST-pure.

**Cons:** Cannot test in a browser address bar. Clients must set headers per request.

### Query parameter versioning

```
GET /api/orders?version=2
```

**Pros:** Easy to switch.

**Cons:** Pollutes URLs, easily cached without version distinction.

### Backward-compatible evolution (avoiding new versions)

The safest strategy is to never need a version bump:

| Change type | Breaking? | Safe? |
|------------|:--------:|:-----:|
| Add a new optional field to response | ❌ | ✅ |
| Add a new optional query parameter | ❌ | ✅ |
| Add a new endpoint | ❌ | ✅ |
| Remove a field from response | ✅ | ❌ |
| Rename a field | ✅ | ❌ |
| Change a field's type | ✅ | ❌ |
| Change status code semantics | ✅ | ❌ |
| Make a previously optional field required | ✅ | ❌ |

:::tip[Sunset headers — deprecation signals]
When deprecating a version, tell clients with the `Sunset` header:
```
Sunset: Sat, 31 Dec 2025 23:59:59 GMT
Deprecation: Mon, 01 Jan 2025 00:00:00 GMT
Link: <https://docs.example.com/migration/v2>; rel="successor-version"
```
:::

---

## Idempotency

An operation is **idempotent** if performing it N times produces the same result as performing it once.

| Method | Idempotent? | Why |
|--------|:-----------:|-----|
| GET | ✅ | Read-only, no state change |
| PUT | ✅ | Replaces resource with the same state each time |
| DELETE | ✅ | Resource is gone after first call; subsequent calls are no-ops |
| PATCH | ⚠️ | Depends on implementation — `{"status": "active"}` is idempotent; `{"count": "+1"}` is not |
| POST | ❌ | Creates a new resource each time by default |

### Making POST idempotent with an Idempotency-Key

```
Client sends:
  POST /payments
  Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
  { "amount": 9990, "currency": "VND" }

Server processes and stores:
  { key: "550e8400...", response: {paymentId: 99, status: "completed"}, expiresAt: +24h }

Client network times out — retries:
  POST /payments
  Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000   ← same key
  { "amount": 9990, "currency": "VND" }

Server finds key in store → returns cached response
  { paymentId: 99, status: "completed" }   ← no double charge
```

```python
# Redis-backed idempotency store
def idempotent_create_payment(idempotency_key: str, request: dict) -> dict:
    cache_key = f"idempotency:{idempotency_key}"

    # Check if we've seen this key before
    cached = redis.get(cache_key)
    if cached:
        return json.loads(cached)   # return exact same response

    # Process the payment
    result = payment_service.charge(request)

    # Store the result with a 24-hour TTL
    redis.setex(cache_key, 86400, json.dumps(result))

    return result
```

---

## Real-Time Protocols

Standard request-response REST doesn't fit use cases where the server must push data to the client continuously.

| Protocol | Direction | Latency | Use case |
|---------|-----------|---------|---------|
| **Polling** | Client pulls | High (~interval) | Simple, stateless — fallback only |
| **Long polling** | Client holds connection open | Medium | Notifications when WebSocket unavailable |
| **WebSockets** | Bidirectional, full-duplex | Very low | Chat, collaborative editing, live trading |
| **SSE (Server-Sent Events)** | Server → Client only | Low | Live feeds, notifications, progress bars |
| **WebRTC** | Peer-to-peer | Lowest | Video/audio calls, file sharing |

### WebSockets vs SSE — when to use each

```
Use WebSockets when:
  ✅ Client also sends data to server (chat messages, cursor positions)
  ✅ Sub-100ms latency required
  ✅ Binary data (audio, video frames)

Use SSE when:
  ✅ Server pushes only (no client messages needed)
  ✅ Simpler infrastructure (just HTTP — no WebSocket upgrade)
  ✅ Automatic reconnection built-in
  ✅ Works through HTTP/2 multiplexing
  Example: live order status updates, background job progress, news feeds
```

---

## API Gateway Patterns

An API gateway is a reverse proxy that sits in front of all services — handling cross-cutting concerns so individual services don't have to.

```
Mobile app   ─┐
Web browser  ─┤                           ┌─► Order Service
3rd party   ─┘                            │
                → API Gateway → Routes ───┼─► User Service
                  ├─ Auth (JWT validation)│
                  ├─ Rate limiting        └─► Payment Service
                  ├─ Request routing
                  ├─ SSL termination
                  ├─ Request/response logging
                  └─ Circuit breaking
```

### What belongs in the gateway vs. the service

| Concern | Gateway | Service |
|---------|:-------:|:-------:|
| TLS termination | ✅ | ❌ |
| JWT signature validation | ✅ | ❌ |
| Rate limiting (global) | ✅ | ❌ |
| Request routing | ✅ | ❌ |
| CORS headers | ✅ | Optional |
| Authorization (business rules) | ❌ | ✅ |
| Business logic | ❌ | ✅ |
| Data validation | ❌ | ✅ |
| Database access | ❌ | ✅ |

:::warning[Don't put business logic in the gateway]
The gateway should be a dumb pipe for cross-cutting infrastructure concerns. Business rules ("can this user see this order?") must live in the service — they depend on business data the gateway doesn't have.
:::

### Spring Boot REST implementation

```java
@RestController
@RequestMapping("/api/v1/orders")
@Validated
@Slf4j
public class OrderController {

    @Autowired private OrderService orderService;

    @GetMapping
    public ResponseEntity<PagedResponse<OrderDto>> listOrders(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "20") @Max(100) int limit,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        PagedResponse<OrderDto> result = orderService.findAll(status, limit, cursor, parseSort(sort));
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<OrderDto> createOrder(
            @Valid @RequestBody CreateOrderRequest req,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @AuthenticationPrincipal JwtUser user) {   // ← identity from JWT, not body

        OrderDto order = orderService.create(req, user.getId(), idempotencyKey);
        return ResponseEntity
            .created(URI.create("/api/v1/orders/" + order.getId()))
            .body(order);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderDto> getOrder(@PathVariable Long id,
                                              @AuthenticationPrincipal JwtUser user) {
        OrderDto order = orderService.findById(id, user.getId());
        return ResponseEntity.ok(order);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<OrderDto> updateOrder(@PathVariable Long id,
                                                 @Valid @RequestBody UpdateOrderRequest req,
                                                 @AuthenticationPrincipal JwtUser user) {
        OrderDto updated = orderService.update(id, req, user.getId());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteOrder(@PathVariable Long id,
                             @AuthenticationPrincipal JwtUser user) {
        orderService.delete(id, user.getId());
    }
}
```

---

## API Security

### OWASP API Top 10 threats

| Threat | What it means | Mitigation |
|--------|--------------|-----------|
| **BOLA / IDOR** | User accesses another user's resource by guessing an ID (`GET /orders/43` when they own `42`) | Always verify ownership server-side: `WHERE id = ? AND user_id = ?` |
| **Broken Authentication** | Weak tokens, no expiry, insecure transmission | Short-lived JWTs, HTTPS only, rotate refresh tokens |
| **Excessive Data Exposure** | API returns 40 fields; client needs 4 | Use DTO projections, never `SELECT *`, field-level serialisation |
| **Lack of Rate Limiting** | Attacker brute-forces login, enumerates IDs | Rate limit by IP + user at gateway level |
| **Broken Function-Level Auth** | Regular user calls admin endpoint | Verify role/scope per endpoint, not just authentication |
| **Mass Assignment** | `{ "role": "ADMIN" }` in user update body is applied | Maintain explicit DTO allowlists; never bind request body to entity directly |
| **Security Misconfiguration** | Verbose error messages expose stack traces | Return generic messages; log details server-side only |
| **Injection** | SQL/NoSQL/command injection via query params | Parameterised queries always; never string-concatenate user input |

### CORS configuration

```java
@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // ✅ Allowlist — never use "*" for credentialed requests
        config.setAllowedOrigins(List.of(
            "https://app.example.com",
            "https://admin.example.com"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of(
            "Authorization", "Content-Type", "Idempotency-Key", "X-Trace-Id"
        ));
        config.setAllowCredentials(true);       // allows cookies and auth headers
        config.setMaxAge(3600L);                // cache preflight for 1 hour

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
```

---

## OpenAPI — API as Code

OpenAPI 3.1 is the industry standard for documenting REST APIs. The spec is machine-readable — use it to auto-generate SDKs, mock servers, and interactive documentation.

```yaml
# openapi.yaml
openapi: 3.1.0
info:
  title: Order API
  version: 1.0.0

paths:
  /api/v1/orders:
    get:
      summary: List orders
      operationId: listOrders
      parameters:
        - name: status
          in: query
          schema: { type: string, enum: [PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED] }
        - name: limit
          in: query
          schema: { type: integer, default: 20, minimum: 1, maximum: 100 }
        - name: cursor
          in: query
          schema: { type: string }
      responses:
        '200':
          description: Paginated list of orders
          content:
            application/json:
              schema: { $ref: '#/components/schemas/PagedOrders' }
        '401': { $ref: '#/components/responses/Unauthorized' }
        '429': { $ref: '#/components/responses/RateLimited' }
      security:
        - bearerAuth: []

    post:
      summary: Create an order
      operationId: createOrder
      parameters:
        - name: Idempotency-Key
          in: header
          schema: { type: string, format: uuid }
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/CreateOrderRequest' }
      responses:
        '201':
          description: Order created
          headers:
            Location:
              schema: { type: string, example: /api/v1/orders/42 }
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Order' }
        '400': { $ref: '#/components/responses/BadRequest' }
        '422': { $ref: '#/components/responses/UnprocessableEntity' }

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    Order:
      type: object
      required: [id, status, total, createdAt]
      properties:
        id:        { type: integer, format: int64 }
        status:    { type: string, enum: [PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED] }
        total:     { type: number, format: double }
        createdAt: { type: string, format: date-time }

  responses:
    Unauthorized:
      description: Authentication required
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ErrorResponse' }
    RateLimited:
      description: Too many requests
      headers:
        Retry-After: { schema: { type: integer } }
```

---

## Production Observability

### RED metrics — the minimum for any API

| Metric | Description | Alert condition |
|--------|-------------|----------------|
| **Rate** | Requests per second per endpoint | Sudden drop → possible outage |
| **Error rate** | `5xx / total` per endpoint | > 1% sustained → SLO breach |
| **Duration** | P50, P95, P99 response time | P99 > SLA threshold |

```java
// Micrometer — auto-exposed via Spring Actuator
// No code needed for basic endpoint metrics

// Custom business metric
@Service
public class OrderService {

    @Autowired private MeterRegistry registry;

    public OrderDto create(CreateOrderRequest req, Long userId, String idempotencyKey) {
        Timer.Sample sample = Timer.start(registry);
        try {
            OrderDto result = /* ... create order ... */;
            registry.counter("orders.created",
                "status", "success",
                "channel", req.getChannel()
            ).increment();
            return result;
        } catch (Exception e) {
            registry.counter("orders.created", "status", "error").increment();
            throw e;
        } finally {
            sample.stop(registry.timer("orders.creation.duration"));
        }
    }
}
```

### Structured logging with correlation IDs

```java
// Every request gets a unique trace ID — included in all logs and error responses
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class TraceIdFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain) throws IOException, ServletException {
        String traceId = Optional.ofNullable(req.getHeader("X-Trace-Id"))
            .orElseGet(() -> UUID.randomUUID().toString());

        MDC.put("traceId", traceId);
        res.setHeader("X-Trace-Id", traceId);

        try { chain.doFilter(req, res); }
        finally { MDC.clear(); }
    }
}

// logback.xml — include traceId in every log line
// {"timestamp":"...","level":"INFO","traceId":"%X{traceId}","message":"..."}
```

---

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Verbs in URLs (`POST /createOrder`) | Not resource-oriented; violates REST semantics | Use nouns + HTTP methods: `POST /orders` |
| `user_id` in request body | Attacker changes it to impersonate another user | Derive identity from signed JWT/session only |
| `SELECT *` in API responses | Exposes internal fields, PII, and future columns to clients | Explicit DTO with only the fields clients need |
| Offset pagination on large datasets | O(offset) table scan; duplicate/skipped rows under concurrent writes | Use cursor/keyset pagination |
| POST without idempotency key for mutations | Network retry causes double-charge, duplicate order, etc. | Require `Idempotency-Key` header for money/state mutations |
| `500` for all errors | Client can't distinguish auth failures from bad input from bugs | Map exceptions to correct HTTP codes (`400`, `401`, `403`, `404`, `422`) |
| No rate limiting | One bad client DoS's the API for everyone | Rate-limit at gateway level; return `429` with `Retry-After` |
| Wildcard CORS (`Access-Control-Allow-Origin: *`) | Allows any website to make credentialed requests to your API | Explicit allowlist of trusted origins only |
| Removing a field in a "patch" | Breaking change — clients crash if they depended on the field | Never remove; deprecate with a `Deprecated-Field` header + migration guide |
| gRPC field number reuse | Old binary messages deserialise into wrong fields silently | Field numbers in `.proto` are permanent — never reuse or change |

---

## Interview Questions

**Q1. What makes an API truly RESTful, and what is HATEOAS?**
> REST satisfies six constraints: client-server separation, statelessness (no session on server), cacheability, uniform interface (resource URIs + standard HTTP methods), layered system, and optionally code-on-demand. Most "REST APIs" are actually HTTP APIs — they miss **HATEOAS** (Hypermedia as the Engine of Application State): including navigable links in responses (`"links": {"cancel": "/orders/42/cancel"}`) so clients discover capabilities dynamically rather than hardcoding URLs. HATEOAS decouples clients from API structure but adds implementation complexity — most teams consciously omit it.

**Q2. What is the difference between PUT and PATCH?**
> `PUT` replaces the **entire** resource — you send the complete new state; omitted fields become null/default. `PUT` is always idempotent. `PATCH` partially updates — only send the fields to change; omitted fields are untouched. `PATCH` is not inherently idempotent (`{"count": "+1"}` applied twice doubles the increment). For most update operations, `PATCH` is preferred — it avoids accidental data loss from omitting fields and reduces payload size.

**Q3. Why use cursor-based pagination over offset pagination?**
> Offset pagination (`LIMIT N OFFSET M`) has two problems at scale: (1) the database must scan and discard M rows before returning N — at OFFSET 100,000 this is a full-table scan; (2) concurrent inserts shift rows between pages — clients see duplicates or skip items. Cursor/keyset pagination uses a `WHERE (created_at, id) < (cursor_ts, cursor_id)` clause — the index is used directly, no rows are discarded, and new inserts don't affect existing pages. The trade-off: no random page access (you can't jump to page 500) — but this is rarely needed in practice.

**Q4. When would you choose gRPC over REST for internal services?**
> gRPC is preferred for internal service-to-service calls when: (1) payload size matters — Protobuf is 3–10× smaller than JSON for equivalent data; (2) strong typed contracts are needed — the `.proto` file generates type-safe clients in all languages; (3) streaming is required — native bidirectional streaming over HTTP/2 without WebSocket complexity; (4) high throughput — HTTP/2 multiplexing eliminates head-of-line blocking. REST remains standard for public APIs because browsers consume JSON natively, firewalls understand HTTP/1.1, and third-party developers don't want to set up Protobuf tooling.

**Q5. What is the N+1 problem in GraphQL and how does DataLoader solve it?**
> When a GraphQL query resolves a list of N orders each with a user, the naive resolver calls the database once per user — N+1 total queries. DataLoader batches requests: instead of fetching user immediately per order, it defers and collects all user IDs requested during one event-loop tick, then issues a single `SELECT * FROM users WHERE id IN (...)`. This collapses N+1 queries into 2 — one for orders, one batched for all users. DataLoader also caches results within the request scope, deduplications duplicate IDs automatically.

**Q6. What is idempotency and how do you implement it for a POST payment request?**
> Idempotency means repeating the same operation N times produces the same result as once. Clients must safely retry on network failure — without idempotency, a payment retry charges the customer twice. Implementation: require a client-generated `Idempotency-Key` UUID header. On first call, process the payment and store `{key → response}` in Redis with a 24-hour TTL. On subsequent calls with the same key, return the cached response without reprocessing. The key must be scoped to the client ID and endpoint to prevent cross-client collisions.

**Q7. (Senior) Compare Token Bucket and Sliding Window Counter for rate limiting.**
> **Token Bucket** refills at a constant rate and allows controlled bursts — if a user has 100 tokens and sends 80 at once, all succeed. Simple to implement, memory-efficient (one float per client). Best for consumer APIs where bursts are acceptable. **Sliding Window Counter** estimates the request count across a rolling window using weighted interpolation between the previous and current fixed windows. Eliminates the edge-case spike of fixed-window (where clients can double their rate by straddling window boundaries) while remaining memory-efficient (two integers per client). Best for APIs where boundary accuracy matters without the memory cost of sliding window logs. In practice, the Sliding Window Counter is the industry default for high-volume APIs.

**Q8. (Senior) How would you design an API gateway for authentication, rate limiting, and routing across multiple microservices?**
> The gateway sits in front of all services as a reverse proxy. Auth: validate JWT signature and expiry centrally — extract claims and forward as trusted headers (`X-User-Id`, `X-User-Role`) to services; services trust these without re-validating the JWT. Rate limiting: enforce per-client limits using a shared Redis store — the gateway is stateless, Redis holds the counters. Routing: match on path prefix or headers (`/api/v1/orders/*` → order-service; `/api/v1/users/*` → user-service) using service discovery (Consul, Kubernetes DNS). Keep the gateway stateless and fast — business logic, authorization decisions, and data access stay in the services. The gateway should be observable: log every request with traceId, emit rate-limit hits to metrics, and implement circuit breaking to fail fast when a downstream service is unhealthy.

---

## See Also

- [Spring Exception Handling — @RestControllerAdvice](../spring/spring-exception-handling.md)
- [Spring Data JPA: Custom Queries with @Query](../spring/spring-data-jpa-custom-query.md)
- [Database Sharding & Partitioning](./sharding-partitioning.md)
- [AI Agent Skills: Tools, MCP, Memory & RAG](../ai-agents/skills.md)
