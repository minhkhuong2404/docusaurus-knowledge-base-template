---
id: api-design
title: API Design
sidebar_label: API Design
description: Best practices for designing REST, gRPC, and GraphQL APIs including versioning, pagination, error handling, rate limiting, idempotency, and API gateway patterns.
tags: [api, rest, grpc, graphql, versioning, pagination, rate-limiting, idempotency, openapi]
---

# API Design

---

## REST API Design Principles

### Resource-Oriented Design
```
✅ GET    /users/{id}              - Get user
✅ POST   /users                   - Create user
✅ PUT    /users/{id}              - Replace user
✅ PATCH  /users/{id}             - Partial update
✅ DELETE /users/{id}             - Delete user
✅ GET    /users/{id}/orders       - Get user's orders

❌ POST /getUser                   - Not resource-oriented
❌ POST /createOrder               - Verb in URL
❌ GET  /deleteUser?id=1           - Side effect on GET
```

### HTTP Status Codes
| Code | Meaning | When |
|---|---|---|
| 200 OK | Success with body | GET, PUT, PATCH |
| 201 Created | Resource created | POST |
| 202 Accepted | Async job started | Long-running ops |
| 204 No Content | Success, no body | DELETE |
| 400 Bad Request | Invalid input | Validation errors |
| 401 Unauthorized | Auth required | Missing/invalid token |
| 403 Forbidden | Auth OK, access denied | Insufficient permissions |
| 404 Not Found | Resource not found | |
| 409 Conflict | Conflict with existing state | Duplicate, version mismatch |
| 422 Unprocessable Entity | Valid syntax, invalid semantics | Business rule violation |
| 429 Too Many Requests | Rate limit exceeded | |
| 500 Internal Server Error | Unexpected server error | |

### Error Response Format
```json
{
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "Account balance is insufficient for this transaction",
    "details": [
      { "field": "amount", "issue": "Requested 100.00 but balance is 50.00" }
    ],
    "traceId": "abc123-def456"
  }
}
```

---

## Pagination

### Offset-based (Simple, problematic at scale)
```
GET /posts?page=5&limit=20

Problem: If page 1 changes between requests, page 2 has duplicates/gaps
Problem: OFFSET 10000 requires scanning 10,000 rows
```

### Cursor-based (Recommended)
```
GET /posts?limit=20
→ returns: { data: [...], nextCursor: "eyJpZCI6MTAwfQ==" }

GET /posts?limit=20&cursor=eyJpZCI6MTAwfQ==
→ SQL: WHERE id < 100 ORDER BY id DESC LIMIT 20
```

```java
@GetMapping("/posts")
public PagedResponse<Post> getPosts(
        @RequestParam(defaultValue = "20") int limit,
        @RequestParam(required = false) String cursor) {

    Long afterId = cursor != null ? decodeCursor(cursor) : null;
    List<Post> posts = postRepository.findWithCursor(afterId, limit + 1);

    boolean hasMore = posts.size() > limit;
    if (hasMore) posts = posts.subList(0, limit);

    String nextCursor = hasMore ? encodeCursor(posts.get(posts.size() - 1).getId()) : null;
    return new PagedResponse<>(posts, nextCursor, hasMore);
}
```

---

## Versioning

### URL Versioning (Most Common)
```
/v1/users      ← stable
/v2/users      ← new version with breaking changes
```

### Header Versioning
```
Accept: application/vnd.myapp.v2+json
```

### Backwards Compatibility Rules
- **Never remove fields** from responses (clients may depend on them)
- **Never rename fields**
- **Add new fields** as optional
- **Deprecation headers** before removal:
  ```
  Deprecation: true
  Sunset: Sat, 31 Dec 2025 23:59:59 GMT
  Link: <https://docs.api.com/v2/users>; rel="successor-version"
  ```

---

## Idempotency

```java
@PostMapping("/payments")
public ResponseEntity<Payment> createPayment(
        @RequestHeader("Idempotency-Key") String idempotencyKey,
        @RequestBody PaymentRequest req) {

    // Return cached result for duplicate requests
    Optional<Payment> existing = paymentRepository.findByIdempotencyKey(idempotencyKey);
    if (existing.isPresent()) {
        return ResponseEntity.ok(existing.get());
    }

    Payment payment = paymentService.process(req);
    payment.setIdempotencyKey(idempotencyKey);
    paymentRepository.save(payment);
    return ResponseEntity.status(HttpStatus.CREATED).body(payment);
}
```

**Idempotent by design:**
- `GET`, `PUT`, `DELETE` are inherently idempotent
- `POST` needs explicit idempotency keys

---

## Rate Limiting

### Algorithms
| Algorithm | Behavior | Use Case |
|---|---|---|
| Token Bucket | Allows burst up to bucket size | APIs with burst tolerance |
| Leaky Bucket | Smooth output rate | Strict rate enforcement |
| Fixed Window | Count per time window | Simple, risk of burst at window boundary |
| Sliding Window | Rolling count | More accurate, slightly complex |

```java
// Bucket4j with Redis for distributed rate limiting
@Component
public class RateLimitFilter extends OncePerRequestFilter {
    @Autowired private BucketProxyManager<String> proxyManager;

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res,
            FilterChain chain) throws IOException, ServletException {

        String apiKey = req.getHeader("X-API-Key");
        Bucket bucket = proxyManager.builder()
            .build(apiKey, () -> BucketConfiguration.builder()
                .addLimit(Bandwidth.classic(100, Refill.greedy(100, Duration.ofMinutes(1))))
                .build()
            );

        if (bucket.tryConsume(1)) {
            chain.doFilter(req, res);
        } else {
            res.setStatus(429);
            res.setHeader("X-RateLimit-Retry-After", "60");
            res.getWriter().write("{\"error\": \"Rate limit exceeded\"}");
        }
    }
}
```

---

## REST vs gRPC vs GraphQL

| Feature | REST | gRPC | GraphQL |
|---|---|---|---|
| Protocol | HTTP/1.1 or 2 | HTTP/2 | HTTP/1.1 or 2 |
| Format | JSON | Protobuf (binary) | JSON |
| Schema | OpenAPI (optional) | Proto (required) | Schema (required) |
| Streaming | Limited | Native (bidirectional) | Subscriptions |
| Performance | Good | Excellent | Good |
| Tooling | Excellent | Good | Good |
| Over/under-fetching | Common | N/A | Solved |
| Best for | Public APIs | Microservice-to-service | Client-driven queries |

### gRPC Example (Spring Boot)
```protobuf
syntax = "proto3";

service UserService {
    rpc GetUser (GetUserRequest) returns (UserResponse);
    rpc StreamUserActivity (UserRequest) returns (stream ActivityEvent);
}

message GetUserRequest { int64 user_id = 1; }
message UserResponse { int64 id = 1; string name = 2; string email = 3; }
```

```java
// gRPC server implementation
@GrpcService
public class UserGrpcService extends UserServiceGrpc.UserServiceImplBase {
    @Override
    public void getUser(GetUserRequest request, StreamObserver<UserResponse> observer) {
        User user = userRepository.findById(request.getUserId()).orElseThrow();
        observer.onNext(UserResponse.newBuilder()
            .setId(user.getId())
            .setName(user.getName())
            .setEmail(user.getEmail())
            .build());
        observer.onCompleted();
    }
}
```

---

## OpenAPI / Swagger

```java
// Spring Boot + SpringDoc
@Operation(summary = "Create an order", tags = {"orders"})
@ApiResponse(responseCode = "201", description = "Order created")
@ApiResponse(responseCode = "400", description = "Invalid request")
@PostMapping("/orders")
public ResponseEntity<Order> createOrder(@Valid @RequestBody CreateOrderRequest req) {
    return ResponseEntity.status(201).body(orderService.create(req));
}
```

---

## HATEOAS (Hypermedia)

REST Level 3: responses include links to related actions.

```json
{
  "id": 42,
  "status": "PENDING",
  "_links": {
    "self":    { "href": "/orders/42" },
    "confirm": { "href": "/orders/42/confirm", "method": "POST" },
    "cancel":  { "href": "/orders/42/cancel",  "method": "DELETE" }
  }
}
```

---

## Interview Questions

1. What's the difference between PUT and PATCH?
2. What HTTP status code should a POST that creates a resource return?
3. How do you implement cursor-based pagination? Why is it better than offset pagination at scale?
4. What is API idempotency and how do you implement it?
5. When would you choose gRPC over REST?
6. What are the trade-offs between REST and GraphQL?
7. How do you version a REST API without breaking existing clients?
8. How does rate limiting work, and what algorithm would you choose for an API that allows short bursts?
9. How do you design an API for long-running operations?
10. What is HATEOAS and does it matter in practice?
