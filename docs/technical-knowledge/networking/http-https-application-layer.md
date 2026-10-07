---
id: http-https-application-layer
title: HTTP, HTTPS & Application Layer
description: A complete guide to HTTP — from beginner fundamentals to senior-level protocol internals. Covers methods, status codes, headers, caching, TLS, CORS, and HTTP/1.1 vs HTTP/2 vs HTTP/3 evolution.
tags: [networking, http, https, http2, http3, tls, ssl, headers, caching, quic, rest]
sidebar_position: 5
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import HttpIntroDiagram from '@site/src/components/HttpIntroDiagram';
import HttpWhatIsDiagram from '@site/src/components/HttpWhatIsDiagram';
import HttpMethodDecisionDiagram from '@site/src/components/HttpMethodDecisionDiagram';
import HttpCachingDiagram from '@site/src/components/HttpCachingDiagram';
import HttpEvolutionDiagram from '@site/src/components/HttpEvolutionDiagram';
import QuicStackDiagram from '@site/src/components/QuicStackDiagram';
import TlsHandshakeDiagram from '@site/src/components/TlsHandshakeDiagram';
import CertChainDiagram from '@site/src/components/CertChainDiagram';
import CorsDiagram from '@site/src/components/CorsDiagram';
import HttpStatusCodesDiagram from '@site/src/components/HttpStatusCodesDiagram';
import HttpHeadersDiagram from '@site/src/components/HttpHeadersDiagram';
import HttpMethodSemanticsDiagram from '@site/src/components/HttpMethodSemanticsDiagram';
import ProductionChecklistDiagram from '@site/src/components/ProductionChecklistDiagram';

# HTTP, HTTPS & Application Layer

A complete guide covering HTTP fundamentals for newcomers, a practical decision framework for choosing the right method and status code, and senior-level deep dives into protocol evolution, TLS internals, and production design patterns.

---

## 🗺️ How to Use This Document

| You are...             | Start here                                                                                                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| New to HTTP            | [What Is HTTP?](#what-is-http) → [Request Structure](#http-request-structure) → [Methods](#http-methods-in-depth)                                                 |
| Mid-level engineer     | [Decision Framework](#-decision-framework-which-method-to-use) → [Status Codes](#http-response-status-codes) → [Caching](#http-caching)                                    |
| Senior / system design | [Protocol Evolution](#protocol-evolution-http10--http11--http2--http3-and-https-integration) → [TLS Deep Dive](#https--tls-deep-dive) → [Production Checklist](#production-readiness-checklist) |

---

## What Is HTTP?

:::note[For Newcomers]
Imagine HTTP as the language your browser and a web server use to talk to each other. When you type a URL and press Enter, your browser sends an HTTP **request** (like asking a question), and the server sends back an HTTP **response** (the answer). Every time you load a page, click a link, or submit a form, HTTP is happening under the hood.
:::

**HTTP** (HyperText Transfer Protocol) is a **stateless, request-response** application protocol that powers the web. It operates over TCP (HTTP/1.x and HTTP/2) or QUIC (HTTP/3).

**Stateless** means every request is completely independent — the server remembers nothing about previous requests. This is why we need cookies, sessions, and tokens: they're workarounds for HTTP's statelessness, added at the application layer.

<HttpWhatIsDiagram />

---

## HTTP Request Structure

Every HTTP request has four parts:

<HttpIntroDiagram />

:::note[For Newcomers]
Think of it like a physical letter:
- **Request Line** = the subject line ("Please process this order")
- **Headers** = envelope metadata (return address, content type, stamps)
- **Body** = the actual letter contents (the data you're sending)
:::

---

## HTTP Methods In Depth (RFC 9110 & RFC 5789)

HTTP request methods (verbs) define the **operational semantics applied to a target resource**. In enterprise distributed architectures, choosing and implementing these methods correctly is not merely a stylistic convention—it dictates **cacheability at CDN edge layers, proxy connection pooling, safe automated retry policies in service meshes, and distributed concurrency controls**.

<HttpMethodSemanticsDiagram />

---

### Mathematical Invariants: Safety & Idempotency

RFC 9110 establishes two foundational properties that every distributed systems engineer must understand at a mathematical and operational level:

```
┌────────────────────────────────────────────────────────────────────────┐
│               SAFETY & IDEMPOTENCY OPERATIONAL CONTRACTS               │
├─────────────────┬──────────────────────┬───────────────────────────────┤
│ Property        │ Mathematical Formula │ Distributed System Guarantee  │
├─────────────────┼──────────────────────┼───────────────────────────────┤
│ Safe            │ f(S) = S             │ Origin state unchanged;       │
│                 │                      │ Safe to prefetch & cache      │
├─────────────────┼──────────────────────┼───────────────────────────────┤
│ Idempotent      │ f(f(S)) = f(S)       │ N executions == 1 execution;  │
│                 │                      │ Safe to retry on TCP/network  │
│                 │                      │ timeout without side effects  │
└─────────────────┴──────────────────────┴───────────────────────────────┘
```

1. **Safety ($f(S) = S$)**:
   - The origin server's target resource state does **not mutate**.
   - *Operational Realism*: A safe request *may* produce ancillary server side effects—such as appending to audit access logs, incrementing promotional view counters, or evaluating rate-limit token buckets. RFC 9110 explicitly states that ancillary side-effects do not invalidate safety, provided they do not alter the target resource representation.
2. **Idempotency ($f(f(S)) = f(S)$)**:
   - Executing the request $N$ times ($N \ge 1$) produces the exact same server state as executing it once.
   - *The Network Retry Contract*: If a client encounters a TCP reset, HTTP 503, or gateway timeout while calling an idempotent method (`GET`, `PUT`, `DELETE`, `HEAD`, `OPTIONS`), service meshes (like Envoy, Istio) and HTTP client libraries can **safely retry automatically** without application-level distributed locks.

---

### Comprehensive Method Semantics Matrix

| Method | Safe | Idempotent | RFC Spec | Request Body Wire Rule | Cacheable by Default? | Typical Status Codes | Distributed Concurrency Strategy |
| :--- | :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| **`GET`** | ✅ | ✅ | RFC 9110 §9.3.1 | Forbidden / Ignored by proxies | ✅ (RFC 9111) | `200`, `206`, `304`, `404` | Conditional Headers (`If-None-Match`, `If-Modified-Since`) |
| **`HEAD`** | ✅ | ✅ | RFC 9110 §9.3.2 | Forbidden / No body | ✅ (RFC 9111) | `200`, `304`, `404` | Metadata freshness validation |
| **`POST`** | ❌ | ❌ | RFC 9110 §9.3.3 | Full Payload Required | Only with explicit `Cache-Control` | `201`, `202`, `200`, `204` | Distributed Idempotency Key (`Idempotency-Key` + Redis Lock) |
| **`PUT`** | ❌ | ✅ | RFC 9110 §9.3.4 | Complete Resource Representation | ❌ (Invalidates cache) | `200`, `201`, `204`, `412` | Optimistic Concurrency Control (`If-Match: ETag`) |
| **`PATCH`** | ❌ | ❌* | RFC 5789 | Delta / Patch Instructions | ❌ (Invalidates cache) | `200`, `204`, `409`, `422` | In-band CAS (`"op": "test"`) or `If-Match: ETag` |
| **`DELETE`** | ❌ | ✅ | RFC 9110 §9.3.5 | Undefined semantics (Avoid) | ❌ (Invalidates cache) | `204`, `202`, `200`, `404` | Precondition check (`If-Match`) + Kafka Tombstones |
| **`OPTIONS`**| ✅ | ✅ | RFC 9110 §9.3.7 | No Body | ❌ (Cached via `Access-Control-Max-Age`) | `204`, `200` | Stateless introspection |

*\*Note: PATCH is non-idempotent by default (e.g. array appends, numeric increments), but can be designed as idempotent when applying deterministic property sets or CAS test operations.*

---

### 1. GET — Retrieve a Resource Representation

`GET` is the foundational read verb of the web. It retrieves the current representation of the target resource identified by the Request-URI.

#### Physical Wire Framing & Payload Policy
- **The Empty Body Rule**: RFC 9110 §9.3.1 specifies: *"A client SHOULD NOT generate content in a GET request unless it is made to a server that explicitly supports it."*
- **Proxy/CDN Dropping Trap**: Intermediate proxies (NGINX, Envoy, HAProxy), AWS Application Load Balancers (ALB), and Cloudflare **routinely strip or reject GET requests containing a body** (returning `400 Bad Request` or routing the request without payload bytes).
- **URI Length Limits**:
  - RFC 9110 defines no protocol upper bound for URI length.
  - Practical infrastructure bounds: Internet Explorer/Edge (~2,083 chars), Apache (`LimitRequestLine` 8,192 bytes), NGINX (`large_client_header_buffers` 8 KB), AWS ALB (16 KB total header buffer).
  - Exceeding limits triggers `414 URI Too Long`. For complex filtering or massive geospatial polygon searches, enterprise APIs use `POST /search` or `REPORT` (RFC 3253).

#### Conditional GET & Cache Validation
To eliminate redundant payload transfer across high-latency WAN links, clients perform conditional GET requests using HTTP Entity Tags (ETags) or timestamps:

```http
GET /api/v2/products/42 HTTP/1.1
Host: api.enterprise.com
If-None-Match: "a8f3b-65c92e"
If-Modified-Since: Tue, 06 Oct 2026 12:00:00 GMT

→ Response (when unchanged):
HTTP/1.1 304 Not Modified
ETag: "a8f3b-65c92e"
Cache-Control: public, max-age=3600, stale-while-revalidate=60
(Zero body bytes transferred!)
```

#### Byte-Range Streaming (`Range` & `206 Partial Content`)
Modern video streaming players (HLS, DASH) and large file downloaders split multi-gigabyte files into discrete byte chunks using `GET` with the `Range` header:

```http
GET /media/lecture_4k.mp4 HTTP/1.1
Range: bytes=0-1048575

→ Response:
HTTP/1.1 206 Partial Content
Accept-Ranges: bytes
Content-Range: bytes 0-1048575/524288000
Content-Length: 1048576
Content-Type: video/mp4

[1 MB Binary Segment Data]
```

#### Senior Production Gotcha: The Prefetching Mutation Catastrophe
```http
// ⚠️ ANTI-PATTERN: NEVER mutate state via GET
GET /api/accounts/42/deactivate HTTP/1.1
```
Web crawlers (Googlebot), aggressive browser link pre-fetchers, and chat message link unfurlers (Slack, Discord, Apple Messages) crawl URLs automatically. If state mutation is mapped to a `GET` endpoint, a single automated link unfurler can deactivate accounts, delete orders, or trigger catastrophic side effects!

---

### 2. POST — Resource Factory & Non-Idempotent Processing

`POST` requests that the target resource process the payload representation according to the target's own specific semantics. It functions as a **resource creation factory**, a **data append pipeline**, or an **RPC command processor**.

#### The Factory Pattern & Response Semantics
When creating a resource, the target URI represents the **collection/factory** (`/orders`), while the newly minted entity receives its own distinct subordinate URI:

```http
POST /api/orders HTTP/1.1
Host: api.enterprise.com
Content-Type: application/json

{"customerId": "cust_901", "currency": "USD", "items": [{"sku": "SKU_88", "qty": 2}]}

→ Response:
HTTP/1.1 201 Created
Location: /api/orders/ord_550e8400
Content-Type: application/json

{"orderId": "ord_550e8400", "status": "PENDING", "created": "2026-10-07T12:00:00Z"}
```

#### Asynchronous Processing (`202 Accepted`)
For long-running background compute (e.g. video transcoding, financial reconciliation, or machine learning model generation), returning a synchronous 200/201 would exhaust HTTP gateway timeouts:

```http
POST /api/reports/annual-audit HTTP/1.1

→ Response:
HTTP/1.1 202 Accepted
Location: /api/jobs/job_99812
Retry-After: 30
Content-Type: application/json

{"jobId": "job_99812", "status": "QUEUED", "pollUrl": "/api/jobs/job_99812"}
```

#### Distributed Idempotency Key Architecture (The Two-Generals Solution)
Because `POST` is **non-idempotent**, an unhandled network disconnect between the server and client after database commit causes the client to retry blindly, resulting in **double-billing or duplicate entity creation**.

To guarantee safety, enterprise payment and mutation APIs adopt the **IETF Idempotency-Key Standard**:

```
                       ┌────────────────────────────┐
                       │  Client (Mobile/Web/API)   │
                       └─────────────┬──────────────┘
                                     │
           POST /payments (Idempotency-Key: "uuid-v4-abc", Body: {...})
                                     │
                                     ▼
                       ┌────────────────────────────┐
                       │   API Gateway / Filter     │
                       └─────────────┬──────────────┘
                                     │
                  Atomic Check: Redis SET NX PX 10000
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼ (Key exists & Completed)              ▼ (Key new: Acquire Lock)
    ┌─────────────────────────────┐         ┌─────────────────────────────────────┐
    │ Return Cached HTTP Response │         │ Compute SHA-256(Body) & Process Txn │
    │ 201 Created (Txn #8812)     │         │ Update Redis with Result + 24h TTL  │
    └─────────────────────────────┘         └─────────────────────────────────────┘
```

```java
@Component
public class IdempotencyFilter extends OncePerRequestFilter {
    private final StringRedisTemplate redis;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        String key = request.getHeader("Idempotency-Key");
        if (key == null || !"POST".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String cacheKey = "idemp:" + key;
        String requestHash = sha256(request.getInputStream());

        // Atomic lock attempt
        Boolean acquired = redis.opsForValue().setIfAbsent(cacheKey + ":lock", "LOCKED", Duration.ofSeconds(10));
        if (Boolean.FALSE.equals(acquired)) {
            response.setStatus(HttpStatus.CONFLICT.value()); // 409 Conflict: concurrent duplicate in flight
            response.getWriter().write("{\"error\": \"Concurrent request in flight for this Idempotency-Key\"}");
            return;
        }

        try {
            String cachedResponse = redis.opsForValue().get(cacheKey);
            if (cachedResponse != null) {
                // Key was already executed successfully -> replay cached response directly
                replayResponse(response, cachedResponse);
                return;
            }

            // Wrap response to capture bytes and commit downstream
            ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(response);
            filterChain.doFilter(request, responseWrapper);

            // Cache status, headers, and body for 24 hours
            cacheExecutionResult(cacheKey, responseWrapper);
            responseWrapper.copyBodyToResponse();
        } finally {
            redis.delete(cacheKey + ":lock");
        }
    }
}
```

---

### 3. PUT — Complete Replacement & Upsert

`PUT` requests that the state of the target resource be **created or completely replaced** with the state defined by the enclosed payload representation.

#### The Complete Replacement Contract
Unlike partial updates, `PUT` replaces the **entire state**. If an existing entity has 10 attributes and the client sends a `PUT` body with only 2 attributes, the remaining 8 attributes must be **reset to defaults, set to null, or deleted**.

```http
PUT /api/users/42 HTTP/1.1
Host: api.enterprise.com
Content-Type: application/json

{
  "email": "alice@corp.com",
  "name": "Alice Cooper"
}

// ⚠️ If "role", "address", and "preferences" existed previously on user 42,
// a compliant PUT server wipes them out!
```

#### Upsert Semantics (Creation via PUT)
- If the target resource **exists**: Server replaces it and returns `200 OK` (with updated entity) or `204 No Content` (without body).
- If the target resource **does not exist**: Server creates the entity at that exact URI and returns `201 Created`.

#### Concurrency & The Lost Update Problem
In concurrent distributed systems, `PUT` is vulnerable to the classic **Lost Update Anomaly**:

```
Client A: Reads Product 42 (Price: $100, Stock: 5, Version: 1)
Client B: Reads Product 42 (Price: $100, Stock: 5, Version: 1)

Client A: Modifies Price -> $110. Sends PUT /products/42 (Price=$110, Stock=5)
Origin: Commits Product 42.

Client B: Modifies Stock -> 4. Sends PUT /products/42 (Price=$100, Stock=4)
Origin: Commits Product 42.

🚨 DISASTER: Client A's price change ($110) is silently overwritten and lost!
```

#### The Senior Solution: Optimistic Locking with `If-Match` & ETags
Enterprise systems guard `PUT` operations using **HTTP Precondition Validation (RFC 9110 §13.1.1)**:

```http
// 1. Client reads entity and receives ETag header
GET /api/products/42 HTTP/1.1
→ HTTP/1.1 200 OK
   ETag: "version_1_hash"

// 2. Client issues conditional replacement
PUT /api/products/42 HTTP/1.1
If-Match: "version_1_hash"
Content-Type: application/json

{"price": 110.00, "stock": 5}

// 3. If another client updated the record first:
→ HTTP/1.1 412 Precondition Failed
   Content-Type: application/json

{"error": "Resource modified by another transaction. Fetch latest ETag before retry."}
```

```java
@PutMapping("/products/{id}")
public ResponseEntity<ProductDTO> updateProduct(
        @PathVariable Long id,
        @RequestHeader(value = "If-Match", required = false) String ifMatch,
        @RequestBody @Valid ProductDTO dto) {

    if (ifMatch == null) {
        throw new ResponseStatusException(HttpStatus.PRECONDITION_REQUIRED, "If-Match header mandatory for PUT");
    }

    Product current = repository.findById(id).orElseThrow();
    String currentEtag = "\"" + current.getVersion() + "\"";

    if (!currentEtag.equals(ifMatch)) {
        return ResponseEntity.status(HttpStatus.PRECONDITION_FAILED).build(); // 412
    }

    Product updated = service.replace(id, dto);
    return ResponseEntity.ok()
            .eTag("\"" + updated.getVersion() + "\"")
            .body(mapper.toDTO(updated));
}
```

---

### 4. PATCH — Partial Modification (RFC 5789)

`PATCH` applies a **delta set of modifications** described in the request payload to the target resource. Unlike `PUT`, fields not referenced in the patch remain untouched.

#### The Two Standardized Patch Formats

```
┌────────────────────────────────────────────────────────┐
│                   PATCH SPECIFICATIONS                 │
├───────────────────────────┬────────────────────────────┤
│ RFC 7396: JSON Merge Patch│ RFC 6902: JSON Patch       │
│ Content-Type:             │ Content-Type:              │
│ application/merge-patch   │ application/json-patch+json│
└───────────────────────────┴────────────────────────────┘
```

#### 1. JSON Merge Patch (RFC 7396)
Clients transmit a partial JSON fragment containing only the target fields:

```http
PATCH /api/users/42 HTTP/1.1
Content-Type: application/merge-patch+json

{
  "email": "alice_updated@corp.com",
  "temporaryNotice": null
}
```

- **Semantics**: Existing keys are overwritten; new keys are added. Sending `key: null` explicitly instructs the server to **remove the key**.
- **The "Null Ambiguity" Trap**: If a field legitimately permits a `null` value (e.g. `middleName: null`), Merge Patch cannot distinguish between *"delete this attribute"* and *"set this attribute's value to null"*.

#### 2. JSON Patch (RFC 6902) — Enterprise Grade
JSON Patch represents modifications as an array of atomic operations: `add`, `remove`, `replace`, `move`, `copy`, and `test`:

```http
PATCH /api/orders/ord_101 HTTP/1.1
Content-Type: application/json-patch+json

[
  { "op": "test", "path": "/status", "value": "SUBMITTED" },
  { "op": "replace", "path": "/shippingAddress/zipCode", "value": "94105" },
  { "op": "add", "path": "/tags/-", "value": "EXPEDITE_PRIORITY" }
]
```

- **Atomic Compare-And-Swap (CAS)**: The `"test"` operation verifies that `/status` is currently `"SUBMITTED"`. If another thread has transitioned the order to `"FULFILLED"`, the entire JSON Patch **aborts atomically with `409 Conflict` or `422 Unprocessable Entity`**, preventing stale mutation.
- **Array Mutation**: `path: "/tags/-"` safely appends to an array without re-sending the whole array.

---

### 5. OPTIONS — Capabilities & The CORS Preflight Tax

`OPTIONS` requests information regarding communication options and allowed methods available for the target URI or server (`OPTIONS *`).

#### The Target Asterisk (`OPTIONS *`)
Querying `*` inspects the top-level server capabilities without addressing a particular resource path:

```http
OPTIONS * HTTP/1.1
Host: api.enterprise.com

→ HTTP/1.1 200 OK
Allow: GET, POST, OPTIONS, HEAD
Server: Envoy/1.30.0
```

#### The CORS Preflight Mechanism
Web browsers execute security preflights whenever a cross-origin web application initiates a request with **non-simple methods** (`PUT`, `PATCH`, `DELETE`) or **non-simple headers** (`Authorization`, `Content-Type: application/json`):

```http
OPTIONS /api/customers/99 HTTP/1.1
Host: api.enterprise.com
Origin: https://app.enterprise.com
Access-Control-Request-Method: DELETE
Access-Control-Request-Headers: Authorization, X-Tenant-ID

→ Response:
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.enterprise.com
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, X-Tenant-ID, Content-Type
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

#### Senior Security Invariant: The Credentialed Wildcard Vulnerability
If `Access-Control-Allow-Credentials: true` is set (permitting cookies or Authorization headers), RFC compliance and browser security engines **strictly forbid** using a wildcard origin (`Access-Control-Allow-Origin: *`). The server must echo the exact validated requesting origin domain (`https://app.enterprise.com`), or the browser immediately drops the response!

#### The 1-RTT Preflight Latency Tax & Production Mitigations
Every cross-origin API call adds an extra **full round-trip time (RTT)** before the browser transmits application data. In high-latency mobile or inter-continental scenarios (150ms RTT), this doubles perceived latency!

```
Mitigation Strategies:
1. Max-Age Caching: Return `Access-Control-Max-Age: 86400` (24h) to cache preflight decisions in browser cache.
2. Same-Origin BFF (Backend-for-Frontend): Deploy an edge reverse proxy (NGINX/Cloudflare) serving both frontend assets and proxying `/api/*` on the exact same origin domain, completely eliminating cross-origin preflight requests!
```

---

### 6. DELETE — Resource Mapping Termination

`DELETE` requests that the origin server remove the association between the target Request-URI and the resource.

#### Semantics of Termination (RFC 9110 §9.3.5)
- DELETE does **not mandate physical disk block sanitization**. It mandates that the URI no longer maps to the target resource representation.
- Subsequent `GET` requests to that URI should return `404 Not Found` or `410 Gone`.

#### Request Body Policy
While RFC 9110 does not strictly forbid a body in a DELETE request, it explicitly assigns it **no defined semantics**. Major reverse proxies, Cloudflare workers, and cloud load balancers may **drop DELETE bodies or return 400 Bad Request**. Never pass deletion parameters in a DELETE payload—use query parameters or request headers instead.

#### Response Status Code Contract
- **`204 No Content`**: Deletion executed synchronously; no response body returned (standard default).
- **`200 OK`**: Deletion executed synchronously and returns a representation of the deleted entity or an audit confirmation payload.
- **`202 Accepted`**: Deletion is asynchronous and queued for background processing (e.g., massive tenant purge or Amazon S3 bucket deletion). Returns a status URL in `Location`.
- **`404 Not Found` vs `204 No Content` on Retries**: Because DELETE is **idempotent**, calling DELETE on an already deleted entity produces the exact same server state (resource absent). While some APIs return `404` on the second call and others return `204`, returning `204` simplifies client error handling during network retries.

#### Senior Architectural Pattern: Soft Deletes vs Kafka Event Tombstones

```
┌────────────────────────────────────────────────────────┐
│               ENTERPRISE DELETION PATTERNS             │
├────────────────────────────┬───────────────────────────┤
│ Relational Database (OLTP) │ Distributed Event Streams │
│ Soft Delete Pattern        │ Kafka Log Compaction      │
└────────────────────────────┴───────────────────────────┘
```

1. **Relational Database Soft Deletes**:
   - `UPDATE users SET deleted_at = NOW(), is_active = false WHERE id = 42;`
   - *Database Gotcha*: Soft deletes cause B-tree index bloat and break standard SQL unique constraints. A `UNIQUE(email)` constraint rejects new registrations for an email that was deleted!
   - *Mitigation*: Partial Unique Indexes in PostgreSQL/MySQL:
     ```sql
     CREATE UNIQUE INDEX idx_users_active_email ON users(email) WHERE deleted_at IS NULL;
     ```
2. **Event-Driven Kafka Tombstones**:
   - In distributed event sourcing, publishing a record with `Key = "user_42"` and `Value = null` is recognized by Apache Kafka as a **Tombstone**.
   - During background **Log Compaction**, Kafka brokers physically purge all historical log segments for `user_42`, reclaiming disk while broadcasting the deletion event to all downstream read replicas and elasticsearch indexes.

---

### 7. HEAD — Metadata Verification Without Body

`HEAD` is identical to `GET`, except the server **must not return a message body** in the response.

#### Practical Engineering Use Cases
1. **Zero-Byte Health Checking**: Probing microservice endpoints (`HEAD /health`) verifies TCP, TLS, and application readiness without allocating socket buffer space for JSON payload serialization.
2. **Resource Sizing & Range Planning**: Reading `Content-Length` before triggering a multi-gigabyte download to confirm available client disk storage.
3. **Cache Validation**: Inspecting `Last-Modified` and `ETag` to verify local cache freshness without transferring content bytes.

```java
@RequestMapping(value = "/artifacts/{name}", method = RequestMethod.HEAD)
public ResponseEntity<Void> inspectArtifact(@PathVariable String name) {
    ArtifactMetadata meta = storageService.getMetadata(name);
    return ResponseEntity.ok()
            .contentLength(meta.sizeInBytes())
            .contentType(MediaType.parseMediaType(meta.mimeType()))
            .eTag("\"" + meta.sha256() + "\"")
            .lastModified(meta.updatedAt())
            .build(); // Zero body bytes emitted
}
```


---

## 🧭 Decision Framework: Which Method to Use?

### Flowchart

<HttpMethodDecisionDiagram />

### Quick-Reference Decision Matrix

| Scenario              | Method                         | Status Code    | Notes                    |
| --------------------- | ------------------------------ | -------------- | ------------------------ |
| Fetch a product       | `GET /products/42`             | 200            | Cacheable                |
| List with filters     | `GET /products?category=shoes` | 200            | Params in query string   |
| Create an order       | `POST /orders`                 | 201 + Location | Not idempotent           |
| Create with client ID | `PUT /files/my-doc.pdf`        | 200 or 201     | Idempotent upsert        |
| Replace user profile  | `PUT /users/42`                | 200            | Send full object         |
| Update just email     | `PATCH /users/42`              | 200            | Send only `{email: ...}` |
| Cancel an order       | `POST /orders/42/cancel`       | 200 or 204     | Action, not a resource   |
| Delete a record       | `DELETE /orders/42`            | 204            | Idempotent               |
| Check file size       | `HEAD /files/report.pdf`       | 200            | No body transferred      |
| CORS preflight        | `OPTIONS /api/orders`          | 204            | Browser auto-sends       |

### PUT vs PATCH — When Does It Matter?

```
Resource: User { name, email, role, preferences, address, billingInfo, ... }

Scenario: User changes only their email address.

PUT (wrong approach):
  → Client must fetch the entire user object
  → Change only email
  → Send the entire object back (50+ fields over the wire)
  → Race condition: if another field changed between GET and PUT, it's overwritten

PATCH (correct approach):
  → Client sends only: {"email": "new@example.com"}
  → Server changes only email, preserves all other fields
  → No race condition on unrelated fields
  → Much less bandwidth for large objects
```

:::tip[When to use PUT despite having PATCH]
Use PUT when you **intentionally want to clear unset fields** (e.g., a settings reset to defaults), or when the resource is small enough that sending the full object is trivial. PATCH requires careful merge logic on the server; PUT is simpler to implement correctly.
:::

### POST vs PUT for Creation

```
POST — server-assigned ID:
  POST /api/orders
  Body: {"items": [...]}
  → Server creates order with ID=1001
  → Returns: 201 Created, Location: /api/orders/1001
  → Client doesn't know the ID until after the response

PUT — client-assigned ID:
  PUT /api/files/quarterly-report-q1-2026.pdf
  Body: <file bytes>
  → Server stores the file at that exact path
  → Idempotent: uploading the same file again replaces it, no duplicate
  → Client owns the identifier
```

---

## HTTP Response Status Codes

Status codes tell the client **what happened** on the server. Choosing the correct code is part of good API design — clients use them to decide how to react (retry, redirect, display error).

<HttpStatusCodesDiagram />

:::tip[503 best practices]
Always include `Retry-After` on 503 responses. This tells load balancers and clients when to retry, preventing a thundering herd of retries that worsens the outage.

```
HTTP/1.1 503 Service Unavailable
Retry-After: 30
Content-Type: application/json

{"error": "Service temporarily unavailable", "retryAfter": 30}
```
:::

---

## Important HTTP Headers

<HttpHeadersDiagram />

### Security Headers — Why They Matter

```java
// Spring Security: add security headers to all responses
@Configuration
public class SecurityHeadersConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.headers(headers -> headers
            // Prevent clickjacking: refuse to render in iframes
            .frameOptions(frame -> frame.deny())

            // Prevent MIME-type sniffing (browser trusts Content-Type header)
            .contentTypeOptions(Customizer.withDefaults())

            // Force HTTPS for 1 year, including subdomains
            .httpStrictTransportSecurity(hsts -> hsts
                .maxAgeInSeconds(31536000)
                .includeSubDomains(true)
                .preload(true))

            // Restrict resource loading sources (prevents XSS)
            .contentSecurityPolicy(csp -> csp
                .policyDirectives("default-src 'self'; script-src 'self' https://cdn.trusted.com"))
        );
        return http.build();
    }
}
```

---

## HTTP Caching

HTTP caching reduces bandwidth, reduces server load, and improves perceived performance. It works by allowing clients (browsers) and intermediaries (CDNs, proxies) to store and reuse responses.

<HttpCachingDiagram />

### Cache-Control Directives

```
Cache-Control: max-age=3600              # cache for 1 hour (client + CDN)
Cache-Control: s-maxage=86400            # CDN TTL — overrides max-age for proxies
Cache-Control: public                    # any cache (browser, CDN) may store
Cache-Control: private                   # only browser may cache (not CDN)
Cache-Control: no-cache                  # store locally, but revalidate before use
Cache-Control: no-store                  # never cache — not in browser or CDN
Cache-Control: immutable                 # content will never change — skip revalidation
Cache-Control: stale-while-revalidate=60 # serve stale for 60s while refreshing async
Cache-Control: must-revalidate           # expired copies must not be served, ever
```

**Choosing Cache-Control by content type:**

| Content Type                      | Recommended Directive                  | Reason                                      |
| --------------------------------- | -------------------------------------- | ------------------------------------------- |
| Static assets (JS, CSS with hash) | `public, max-age=31536000, immutable`  | Content hash in URL = safe to cache forever |
| API GET responses                 | `private, max-age=300` or `no-cache`   | May be user-specific                        |
| Public data (product catalog)     | `public, max-age=3600, s-maxage=86400` | CDN caches longer than browser              |
| Authenticated responses           | `private, no-cache`                    | Don't cache user-specific data in CDN       |
| Sensitive data (banking)          | `no-store`                             | Never cache anywhere                        |
| Real-time data                    | `no-store` or `max-age=0`              | Must always be fresh                        |

### ETags and Conditional Requests

ETags let clients validate whether their cached copy is still current without downloading the full response body if it hasn't changed.

```java
@GetMapping("/products/{id}")
public ResponseEntity<Product> getProduct(@PathVariable Long id,
                                          @RequestHeader(value = "If-None-Match",
                                                        required = false) String ifNoneMatch) {
    Product product = productService.findById(id);

    // Generate ETag from content hash or version
    String etag = '"' + DigestUtils.md5DigestAsHex(
        objectMapper.writeValueAsBytes(product)) + '"';

    // If client's cached version is still valid, return 304 (no body)
    if (etag.equals(ifNoneMatch)) {
        return ResponseEntity.status(HttpStatus.NOT_MODIFIED)
            .eTag(etag)
            .build();
    }

    return ResponseEntity.ok()
        .eTag(etag)
        .cacheControl(CacheControl.maxAge(5, TimeUnit.MINUTES))
        .body(product);
}
```

---

## Protocol Evolution: HTTP/1.0 → HTTP/1.1 → HTTP/2 → HTTP/3 (and HTTPS Integration)

Understanding the physical evolution of HTTP is crucial for distributed systems architecture, API gateway tuning, and high-throughput microservices. Each generation was engineered to eliminate the fundamental architectural bottleneck of its predecessor.

<HttpEvolutionDiagram />

---

### 1. HTTP/1.0 — Ephemeral Connections & The Early Web (1996, RFC 1945)

HTTP/1.0 was designed for a document-centric Web where a web page was a single static HTML file with rare inline images.

#### Wire Mechanics & Lifecycle
- **Strictly Ephemeral Socket Model**: Every single HTTP transaction executed across its own dedicated TCP connection:
  $$\text{Socket Lifecycle} = \text{socket}() \to \text{connect}() \to \text{write}() \to \text{read}() \to \text{close}()$$
- **Connection Termination as EOF**: The server signaled the end of the response body by executing a TCP `FIN` control segment to close the socket.

#### HTTPS & Security Integration
- **SSL 2.0 / SSL 3.0**: Encrypted web traffic ran over dedicated TCP port 443.
- **The 4-RTT Penalty**: Setting up a secure HTTP/1.0 request required **4 complete network Round Trips (RTTs)** before receiving the first byte of payload:
  1. $1\text{ RTT}$: TCP 3-Way Handshake (`SYN` $\to$ `SYN-ACK` $\to$ `ACK`).
  2. $2\text{ RTTs}$: SSL 3.0 / TLS 1.0 Handshake (`ClientHello` $\to$ `ServerHello` + Cert $\to$ `ClientKeyExchange` $\to$ Finished).
  3. $1\text{ RTT}$: HTTP `GET` request $\to$ HTTP response.
- **The Non-SNI Multi-Tenant Wall**: SSL 3.0 lacked Server Name Indication (SNI). Because the TLS handshake completed *before* the plaintext HTTP `Host` header was received, servers could only bind a single SSL certificate per physical IPv4 address. Every customer or domain required a dedicated public IPv4 address.

#### Under-the-Hood Performance Killers
1. **TCP Slow-Start Amputation**: TCP connections start with a small initial congestion window ($\text{initcwnd} = 1$ to $2$ segments in the 1990s). Because the socket was torn down after every response, the connection was killed before it ever ramped up through exponential congestion window growth. Network pipes operated at single-digit percentages of available bandwidth.
2. **Kernel Ephemeral Port Exhaustion**: A high-traffic server rapidly accumulated thousands of sockets stuck in the OS kernel `TIME_WAIT` state ($2 \times \text{MSL} = 60\text{ to }120\text{ seconds}$). This exhausted ephemeral client ports (`/proc/sys/net/ipv4/ip_local_port_range`) and overwhelmed OS socket file descriptors.
3. **No Dynamic Streaming**: Without chunked transfer encoding, servers had to know the exact `Content-Length` in advance or buffer the entire dynamically generated response in memory before sending.

---

### 2. HTTP/1.1 — Persistent Connections, Virtual Hosting & Caching (1997/1999, RFC 2616 / RFC 7230 / RFC 9112)

HTTP/1.1 modernized the protocol for interactive web applications, making connection reuse the default standard.

#### Core Architectural Innovations
1. **Mandatory `Host` Header**:
   - HTTP/1.1 required the `Host: app.example.com` header in every request. This unlocked **Name-Based Virtual Hosting**, allowing thousands of distinct websites to share a single physical web server and IP address.
2. **Persistent Connections (`Connection: keep-alive`)**:
   - TCP sockets remain open by default after a response completes. Subsequent requests to the same origin reuse the established socket, completely bypassing recurring 3-way handshakes and preserving the warmed-up TCP congestion window (`cwnd`).
3. **Chunked Transfer Encoding (`Transfer-Encoding: chunked`)**:
   - Solved dynamic streaming without pre-buffering. Servers stream data in discrete chunks prefixed by their hexadecimal byte length, terminating with a zero-length chunk (`0\r\n\r\n`) and optional trailing headers.
4. **Early Handshake Pre-Flight (`Expect: 100-continue`)**:
   - Clients send headers with `Expect: 100-continue`. If the server authorizes the request, it responds with `100 Continue`; otherwise, it returns `401 Unauthorized` or `413 Payload Too Large` before the client wastes bandwidth uploading megabytes of request body.
5. **Advanced Caching Primitives**:
   - Introduced strong entity validation via `ETag` / `If-None-Match`, and granular cache directives via `Cache-Control: max-age, s-maxage, no-cache, stale-while-revalidate`.

#### HTTPS & Security Evolution
- **TLS 1.0 – 1.2 Integration**: Transitioned from SSL to modern TLS.
- **Server Name Indication (SNI, RFC 3546 / RFC 6066)**: Added the `server_name` extension to the TLS `ClientHello`. The client sends the target hostname in plaintext during the TLS handshake, enabling servers to select and present the matching SSL certificate from a multi-tenant keystore.

#### The Bottleneck: Application-Level Head-of-Line (HoL) Blocking
While HTTP/1.1 introduced **HTTP Pipelining** (sending multiple requests consecutively without waiting for individual responses), the specification strictly required responses to return in the **exact same FIFO order** as the requests.

```
TCP Socket #1:
Client  ──► [Req 1: /api/slow-report (2.5s)] ──► [Req 2: /avatar.png (10ms)] ──► [Req 3: /style.css (5ms)]
Server  ──► [     Calculating... 2.5s     ] ──► [Blocked behind Req 1]       ──► [Blocked behind Req 1]
```

If Request 1 triggered a slow database query, Requests 2 and 3 were completely blocked in the server queue. In the real world, buggy intermediate network proxies frequently corrupted or desynchronized pipelined streams. As a result, **browsers disabled HTTP Pipelining permanently**.

#### Production Workarounds in the HTTP/1.1 Era
To survive Application HoL blocking, engineers were forced to adopt complex anti-patterns:
- **Connection Pools**: Browsers opened parallel TCP connections per origin (standardized at **6 concurrent connections** in Chrome, Firefox, Safari).
- **Domain Sharding**: Serving assets from multiple subdomains (`static1.cdn.com`, `static2.cdn.com`) to bypass the 6-socket limit, tripling DNS queries, TCP handshakes, and memory overhead.
- **Asset Concatenation & CSS Sprites**: Merging hundreds of JS/CSS files and images into huge bundles to minimize HTTP request counts, destroying granular browser caching.

---

### 3. HTTP/2.0 — Binary Framing Layer & Stream Multiplexing (2015, RFC 7540 / RFC 9113)

Derived from Google's SPDY protocol, HTTP/2 revolutionized the application layer by replacing newline-delimited ASCII text with a high-performance **Binary Framing Layer**.

#### Binary Framing Layer Architecture
Instead of parsing text character-by-character, HTTP/2 breaks every communication into standardized binary frames:

```
+-----------------------------------------------+
|                 Length (24)                   |
+---------------+---------------+---------------+
|   Type (8)    |   Flags (8)   |
+-+-------------+---------------+-------------------------------+
|R|                     Stream Identifier (31)                  |
+=+=============================================================+
|                   Frame Payload (0...N)                       |
+---------------------------------------------------------------+
```

- **9-Byte Frame Header**: Length (3 bytes), Frame Type (1 byte), Flags (1 byte), Reserved Bit (1 bit), and Stream ID (31 bits).
- **Core Frame Types**:
  - `HEADERS (0x1)`: Carries HTTP headers compressed with HPACK.
  - `DATA (0x0)`: Carries the raw HTTP request/response body chunks.
  - `SETTINGS (0x4)`: Configuration negotiation (max frame size, initial window size).
  - `WINDOW_UPDATE (0x8)`: Flow-control credit allocation.
  - `RST_STREAM (0x3)`: Immediately cancels a stream without tearing down the underlying TCP connection.
  - `GOAWAY (0x7)`: Graceful connection shutdown.

#### True Multiplexing over a Single TCP Connection
In HTTP/2, all communication occurs over **one single TCP socket per origin**:
- Multiple independent streams are broken into binary frames and interleaved concurrently across the socket.
- **Stream ID Allocation**: Client-initiated streams use **odd numbers** (`1, 3, 5, 7...`); server-initiated streams use **even numbers** (`2, 4, 6...`).
- A slow response on Stream 1 no longer blocks delivery of Stream 3. Binary chunks interleave freely on the wire.

#### HPACK Header Compression (RFC 7541)
In HTTP/1.1, repetitive headers (`User-Agent`, `Cookie`, `Authorization`) added up to 1-2 KB of plaintext overhead on every single request. HTTP/2 solved this with **HPACK**:
- **Static Table**: A hardcoded, read-only table of 61 common HTTP headers (e.g., Index 2 = `GET`, Index 8 = `status: 200`, Index 14 = `status: 404`). If a header matches, only its index number is transmitted.
- **Dynamic Table**: A stateful FIFO sliding buffer established per connection. When new headers (like a session JWT or cookie) are sent, they are assigned an index in the dynamic table; subsequent requests only send the index.
- **Huffman Encoding**: Text strings are compressed using a custom static Huffman code table.
- **Result**: Header size overhead is reduced by **85% to 90%**.

#### Stream Prioritization & Flow Control
- **Stream Dependencies & Weighting**: Clients assign priority trees and weights (1 to 256) to ensure critical rendering paths (HTML, CSS) receive bandwidth before background images.
- **Credit-Based Flow Control**: Senders cannot transmit more data than allowed by the receiver's window (`WINDOW_UPDATE` frames). Senders maintain both per-stream and connection-level flow control windows.

#### HTTPS & Security Integration
- **De Facto TLS Requirement**: Although RFC 7540 defined plaintext HTTP/2 (`h2c`), all major browser vendors (Google, Mozilla, Apple, Microsoft) implemented HTTP/2 exclusively over TLS (`h2`).
- **ALPN (Application-Layer Protocol Negotiation, RFC 7301)**: The client includes `h2` in the `application_layer_protocol_negotiation` extension of its TLS `ClientHello`. The server acknowledges `h2` in its `ServerHello`, completing protocol negotiation in **0 additional RTTs**.
- **Cipher Suite Restrictions**: HTTP/2 explicitly blacklists insecure cipher suites (forbids CBC mode, RC4, MD5, and non-ephemeral RSA key exchange). Requires AEAD ciphers (GCM, ChaCha20-Poly1305) with mandatory forward secrecy.

#### The Achilles' Heel: TCP-Level Head-of-Line Blocking
While HTTP/2 completely eliminated *application-level* HoL blocking, it concentrated all traffic into a **single TCP connection**, exposing a critical vulnerability:

```
Single TCP Socket:
Wire: [Stream 1: DATA] ──► [Stream 3: DATA (LOST!)] ──► [Stream 5: DATA] ──► [Stream 1: DATA]
                           ^^^^^^^^^^^^^^^^^^^^^^^^
Kernel Buffer: ──► [Stalled] ──► [Stalled in OS Kernel] ──► [Stalled in OS Kernel]
```

TCP guarantees an **in-order byte stream**. The OS kernel TCP stack cannot release received bytes to user-space application memory if an earlier segment is missing.
- When a single TCP packet drops on Stream 3, the kernel halts delivery of **all subsequent packets** (including Stream 1 and Stream 5), waiting for TCP retransmission.
- **The Loss Inversion Paradox**: On networks with $\ge 2\%$ packet loss (such as crowded cellular 4G/LTE or fluctuating WiFi), **HTTP/2 performs worse than HTTP/1.1**, because HTTP/1.1's 6 parallel TCP connections isolate packet loss to a single socket while the other 5 keep flowing.

---

### 4. HTTP/3.0 — QUIC Transport & User-Space Datagrams (2022, RFC 9114 / RFC 9000)

HTTP/3 completely dismantles the 30-year reliance on OS kernel TCP by migrating transport to **QUIC** (Quick UDP Internet Connections) running on top of UDP.

<QuicStackDiagram />

#### Per-Stream Independent Loss Recovery (Zero HoL Blocking)
QUIC implements stream multiplexing, sequencing, congestion control, and loss recovery entirely in **user-space UDP frames**:
- Each stream maintains its own independent byte-offset accounting and acknowledgment sequence.
- If a UDP packet carrying data for Stream 1 is dropped on the network, the kernel delivers Streams 3 and 5 to the application **immediately without waiting**.
- Only Stream 1 waits for packet retransmission. TCP-level Head-of-Line blocking is completely eliminated.

#### Unified 1-RTT & 0-RTT Connection Establishment
In HTTP/2 over TLS 1.2, connection setup required 2 to 3 RTTs. HTTP/3 unifies transport parameters and cryptographic key exchange into a single handshake:

```
HTTP/1.1 & HTTP/2 (TCP + TLS 1.3):
  [Client] ─── TCP SYN ────────► [Server]
  [Client] ◄── TCP SYN-ACK ────  [Server]  (1 RTT: TCP Handshake)
  [Client] ─── TLS ClientHello ─► [Server]
  [Client] ◄── ServerHello+Cert  [Server]  (2 RTTs: TLS Handshake)
  [Client] ─── HTTP GET ───────► [Server]  (3 RTTs: First Data Delivered)

HTTP/3 (QUIC + Embedded TLS 1.3):
  [Client] ─── QUIC Initial (Crypto ClientHello + TransportParams) ─► [Server]
  [Client] ◄── QUIC Handshake (ServerHello + Cert + 1-RTT Keys) ──── [Server]  (1 RTT: Fully Connected & Encrypted!)
  [Client] ─── HTTP GET (Encrypted with 1-RTT Application Keys) ────► [Server]
```

- **0-RTT Session Resumption (`early_data`)**: If a client has previously communicated with the server, it caches the server's transport parameters and session ticket. On reconnection, the client encrypts the HTTP request in the **very first UDP datagram sent**, achieving a **0-RTT round-trip time**.

#### Connection Migration (Mobile Roaming Survival)
Traditional TCP sockets are bound to an OS 4-tuple: `(Source IP, Source Port, Destination IP, Destination Port)`.
- When a user on a smartphone steps out of their house and transitions from home WiFi to 5G cellular, the phone's IP address changes immediately.
- In HTTP/1.1 and HTTP/2, the TCP connection instantly breaks, aborting active downloads, terminating TLS sessions, and requiring full reconnects.
- **The QUIC Solution**: QUIC connections are identified by an arbitrary, randomized **64-bit Connection ID (CID)** embedded in the QUIC packet header. When the client's network interface switches from WiFi (`192.168.1.5:54321`) to 5G (`172.56.21.8:48910`), the server inspects the CID and migrates the connection state seamlessly. The video stream or file upload continues with **zero interruption**.

#### QPACK Header Compression (RFC 9204)
HPACK could not be used in HTTP/3. In HTTP/2, HPACK assumed TCP guaranteed in-order frame delivery. If an HPACK table update was lost, subsequent headers could not be decompressed.
- **QPACK** redesigns compression for out-of-order networks:
  - Splits communication into the request/response stream and **two dedicated unidirectional control streams** (Encoder Stream and Decoder Stream).
  - Employs stream cancellation tracking and explicit acknowledgment frames, ensuring streams can decode dynamic table references without stalling unrelated requests.

#### HTTPS & Security Invariants
- **100% Encrypted by Definition**: Plaintext HTTP/3 does not exist.
- **Encrypted Transport Metadata**: In HTTP/2, TCP sequence numbers and flags travel in plaintext across the Internet. In QUIC, packet numbers, connection control signals, and payload frames are encrypted under TLS 1.3 keys. Intermediate network eavesdroppers only see opaque UDP payloads and the public Connection ID.

#### Production Gotchas & Engine Realities
1. **UDP Port 443 Blocking**: Many restrictive enterprise firewalls, hotels, and deep-packet-inspection middleboxes drop UDP traffic on port 443. Web browsers handle this via the `Alt-Svc` header:
   ```http
   Alt-Svc: h3=":443"; ma=86400, h2=":443"
   ```
   The browser loads the page via HTTP/2 first, reads the `Alt-Svc` header, tests UDP in the background, and upgrades to HTTP/3 on subsequent requests. If UDP fails, it transparently falls back to HTTP/2.
2. **CPU & Kernel Overhead**: Processing thousands of individual UDP packets generates significant kernel interrupt overhead compared to TCP's hardware offloads. High-throughput HTTP/3 deployments require:
   - **UDP GSO (Generic Segmentation Offload)** in Linux (`SO_ZEROCOPY`).
   - Batched packet syscalls: `recvmmsg()` and `sendmmsg()`.
   - eBPF socket steering (e.g. `BPF_PROG_TYPE_SK_REUSEPORT`) to distribute incoming CIDs across multiple worker processes without lock contention.

---

### 5. Architectural & HTTPS Evolution Matrix

| Architectural Feature | HTTP/1.0 (1996) | HTTP/1.1 (1999) | HTTP/2.0 (2015) | HTTP/3.0 (2022) |
|---|---|---|---|---|
| **Primary RFCs** | RFC 1945 | RFC 2616, 7230, 9112 | RFC 7540, 9113 | RFC 9114, 9000 (QUIC) |
| **Transport Layer** | TCP (1 socket per request) | TCP (Keep-Alive pool $\le 6$) | TCP (Single socket per origin) | QUIC over UDP (User-space) |
| **Wire Protocol** | Plaintext ASCII | Plaintext ASCII | Binary Framing Layer | QUIC Variable-Length Frames |
| **Multiplexing** | None (Serialized) | Failed Pipelining (Disabled) | Interleaved Binary Streams | Independent QUIC Streams |
| **Head-of-Line Blocking** | Full Connection-level | Application-level (FIFO responses) | TCP-level (Kernel buffer stall) | **Zero HoL Blocking** (Stream isolated) |
| **Header Compression** | None (Full text resubmission) | None (Full text resubmission) | HPACK (Static + Dynamic table) | QPACK (Decoupled control streams) |
| **HTTPS Security Layer** | SSL 2.0 / SSL 3.0 | TLS 1.0 – 1.2 | TLS 1.2+ (Enforced by browsers) | **Native TLS 1.3 Embedded** |
| **TLS Negotiation** | Dedicated port 443 | SNI Extension (RFC 6066) | ALPN Extension (`h2`) | ALPN Extension (`h3`) via `Alt-Svc` |
| **Handshake Latency** | 4 RTTs (TCP + SSL + Req) | 2–3 RTTs cold / 1 RTT warm | 2–3 RTTs cold / 1 RTT warm | **1 RTT cold / 0-RTT warm** |
| **Connection Migration** | Impossible | Impossible | Impossible | **Yes** (64-bit Connection ID) |
| **Primary Bottleneck** | Ephemeral port/TIME_WAIT | Domain sharding & App HoL | Packet loss stall on lossy networks | UDP firewall blocking & CPU cost |

---

## HTTPS & TLS Deep Dive

HTTPS = HTTP + **TLS** (Transport Layer Security). TLS provides: **encryption** (eavesdroppers can't read traffic), **authentication** (you're talking to the real server), and **integrity** (data wasn't tampered with in transit).

### TLS 1.3 Handshake

<TlsHandshakeDiagram />

TLS 1.3 vs 1.2:
| Aspect                | TLS 1.2                          | TLS 1.3                                |
| --------------------- | -------------------------------- | -------------------------------------- |
| Handshake RTTs        | 2 RTT                            | 1 RTT (0-RTT for resumption)           |
| Cipher suites         | Many, including weak ones        | Only strong AEAD ciphers               |
| Key exchange          | RSA (no forward secrecy) + ECDHE | ECDHE only (mandatory forward secrecy) |
| Handshake encryption  | Partially plaintext              | Most handshake messages encrypted      |
| Deprecated algorithms | RC4, MD5, SHA-1 allowed          | Removed entirely                       |

**Forward Secrecy** — why it matters:

```
Without Forward Secrecy (RSA key exchange):
  Attacker records encrypted traffic today.
  Years later, obtains server's private key (breach, subpoena, etc.)
  → Decrypts all previously recorded traffic retroactively.

With Forward Secrecy (ECDHE — mandatory in TLS 1.3):
  New ephemeral key pair generated for each session.
  Session key discarded after session ends.
  → Past sessions cannot be decrypted even with the server's private key.
```

### Certificate Chain of Trust

<CertChainDiagram />

Browsers verify: *"Is this server certificate signed by an Intermediate CA that is signed by a Root CA that I trust?"*

### Spring Boot TLS Configuration

```yaml
# application.yml — production TLS setup
server:
  port: 8443
  ssl:
    enabled: true
    key-store: classpath:keystore.p12
    key-store-password: ${SSL_KEYSTORE_PASSWORD}   # from env var, never hardcoded
    key-store-type: PKCS12
    key-alias: myserver
    protocol: TLS
    enabled-protocols: TLSv1.3,TLSv1.2            # TLS 1.0 and 1.1 disabled
    ciphers: >
      TLS_AES_128_GCM_SHA256,
      TLS_AES_256_GCM_SHA384,
      TLS_CHACHA20_POLY1305_SHA256,
      TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,
      TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
```

```java
// Redirect HTTP → HTTPS (never serve plaintext in production)
@Configuration
public class HttpsRedirectConfig {

    @Bean
    public ServletWebServerFactory servletContainer() {
        TomcatServletWebServerFactory tomcat = new TomcatServletWebServerFactory() {
            @Override
            protected void postProcessContext(Context context) {
                SecurityConstraint sc = new SecurityConstraint();
                sc.setUserConstraint("CONFIDENTIAL"); // forces HTTPS
                SecurityCollection collection = new SecurityCollection();
                collection.addPattern("/*");
                sc.addCollection(collection);
                context.addConstraint(sc);
            }
        };
        tomcat.addAdditionalTomcatConnectors(httpToHttpsRedirectConnector());
        return tomcat;
    }

    private Connector httpToHttpsRedirectConnector() {
        Connector connector = new Connector("org.apache.coyote.http11.Http11NioProtocol");
        connector.setScheme("http");
        connector.setPort(8080);
        connector.setSecure(false);
        connector.setRedirectPort(8443);
        return connector;
    }
}
```

---

## CORS — Cross-Origin Resource Sharing

:::note[For Newcomers]
Browsers have a **Same-Origin Policy**: JavaScript on `https://app.example.com` is blocked from making requests to `https://api.other.com`. This prevents malicious websites from silently reading your Gmail or bank data using your logged-in session. CORS is the mechanism servers use to **selectively lift this restriction**.
:::

```
Origin = scheme + host + port
https://app.example.com:443   ← one origin
https://api.example.com:443   ← different origin (different subdomain)
http://app.example.com:80     ← different origin (different scheme + port)
```

### CORS Preflight Flow

<CorsDiagram />

:::warning[CORS is browser-only]
CORS is enforced by browsers, not servers. Server-to-server API calls (curl, Postman, mobile apps, backend services) are **never subject to CORS**. If someone claims your API has a CORS bug but they found it with Postman — it's not a CORS bug.
:::

```java
// Global CORS configuration (Spring MVC)
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins(
                "https://app.example.com",
                "https://admin.example.com"
            )
            .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            .allowedHeaders("Authorization", "Content-Type", "X-Request-ID")
            .exposedHeaders("X-Request-ID", "X-RateLimit-Remaining") // headers JS can read
            .allowCredentials(true)   // allow cookies/auth headers
            .maxAge(86400);           // cache preflight for 24h
    }
}

// Per-controller override
@CrossOrigin(origins = "https://partner.example.com")
@RestController
@RequestMapping("/api/public")
public class PublicApiController { ... }
```

---

## Production Readiness Checklist

<ProductionChecklistDiagram />

---

## Interview Questions

### Foundational

### Q: What is the difference between GET and POST?
> GET retrieves a resource — it is safe (no side effects), idempotent, and the parameters go in the URL. It should never modify state. POST submits data to the server to create a resource or trigger an action — it is neither safe nor idempotent, and data goes in the request body. GET responses are cacheable; POST responses generally are not. The key distinction: GET reads, POST writes.

### Q: What does idempotent mean, and which HTTP methods are idempotent?
> An operation is idempotent if calling it N times produces the same server state as calling it once. GET, HEAD, OPTIONS, PUT, and DELETE are idempotent. POST and PATCH are not (by default). Idempotency matters for retry logic: if a network request fails, you can safely retry an idempotent method without risk of duplicating side effects. For example, a client can safely retry `DELETE /orders/42` — if the order is already deleted, the state remains "order deleted".

### Q: When would you use PUT vs PATCH?
> Use PUT for full replacement — the client must send the entire resource representation, and any fields omitted are cleared. Use PATCH for partial updates — the client sends only the fields to change. PATCH is more efficient (less bandwidth) and avoids race conditions where a concurrent write to an unrelated field gets overwritten. Use PUT when the full replacement behavior is intentional — such as a settings reset.

### Q: What is the difference between 401 and 403?
> 401 Unauthorized means the request lacks valid authentication — the user is not identified (expired token, no credentials). The response should include `WWW-Authenticate` to tell the client how to authenticate. The fix is for the client to log in or refresh their token. 403 Forbidden means the user is identified but doesn't have permission to perform the action. Logging in again will not help. The most common mistake is returning 403 when the user is simply not logged in — that should be 401.

---

### Intermediate

### Q: What is the difference between HTTP/1.1, HTTP/2, and HTTP/3?
> HTTP/1.1 uses persistent connections (keep-alive) but suffers from application-level head-of-line blocking — one slow response blocks subsequent ones on the connection, so browsers work around this by opening 6 parallel TCP connections per domain. HTTP/2 introduces multiplexing — many concurrent request/response streams over one TCP connection — along with header compression (HPACK) and server push. However, it still suffers TCP-level HoL blocking: a single lost TCP packet stalls all streams. HTTP/3 uses QUIC over UDP, eliminating TCP-level HoL blocking (each stream has independent reliability), and provides 0-RTT connection resumption and connection migration (helpful on mobile).

### Q: What is the difference between `Cache-Control: no-cache` and `no-store`?
> `no-cache` means: you may store a cached copy, but you must revalidate with the server before using it (sends `If-None-Match` / `If-Modified-Since`). If the server responds with `304 Not Modified`, the cached copy is used — saving bandwidth. `no-store` means: never store a copy anywhere — not in the browser cache, not in CDNs, not in proxies. Use `no-store` for genuinely sensitive data (financial transactions, authentication responses) where even having a cached copy on disk is unacceptable.

### Q: What is an ETag and how does it enable conditional caching?
> An ETag is a fingerprint of a resource's content (a hash or version number). The server returns `ETag: "abc123"` with a response. On the next request, the client sends `If-None-Match: "abc123"`. If the content hasn't changed, the server returns `304 Not Modified` with no body — the client uses its cached copy, saving the full response body transfer. ETags enable bandwidth-efficient cache validation without relying on timestamps (which can be unreliable due to clock skew and second-level precision).

---

### Senior / System Design

### Q: How does TLS 1.3 improve upon TLS 1.2, and what is forward secrecy?
> TLS 1.3 reduces handshake RTTs from 2 to 1 (with 0-RTT resumption), removes all weak cipher suites (RSA key exchange, RC4, MD5, SHA-1), and mandates ECDHE key exchange for every session, which provides forward secrecy. Forward secrecy means each session uses an ephemeral key pair that is discarded after the session ends. Even if an attacker records all TLS traffic today and later obtains the server's private key (via breach or subpoena), they cannot retroactively decrypt past sessions — because the ephemeral session keys no longer exist.

### Q: Why is CORS only a browser concern, and what are the security implications?
> CORS is enforced by browsers as part of the Same-Origin Policy — a browser security feature to prevent malicious websites from making authenticated cross-origin requests on behalf of users. Non-browser HTTP clients (curl, Postman, backend services, mobile apps) do not enforce CORS. This has two implications: (1) A CORS misconfiguration is only exploitable via a browser context — typically CSRF-style attacks where a malicious page makes requests using the victim's cookies. (2) Testing CORS with Postman does not accurately represent browser behavior — you must test with an actual browser or a tool that sends proper preflight requests.

### Q: How would you design an API to make POST requests safely retryable?
> POST is not idempotent by default, but you can make it idempotent using the **Idempotency Key** pattern: the client generates a unique UUID for each logical operation and sends it as `Idempotency-Key: <uuid>` in the request. The server stores the key and the result in a short-lived store (Redis with TTL). On retry, if the server sees a key it has already processed, it returns the original response without re-executing the operation. This pattern is essential for payment processing, email sending, and any operation where duplicate execution causes real-world harm. Stripe, Adyen, and most payment APIs require idempotency keys on all write operations.

### Q: Explain HTTP/2 server push and why it fell out of favor.
> Server push lets the server proactively send resources (CSS, JS, fonts) to the client before it requests them — reducing round-trips for critical assets. In theory, when a browser requests `index.html`, the server can simultaneously push `app.js` and `style.css` before the browser even parses the HTML. In practice, server push had significant problems: it bypassed the browser cache (the server couldn't know if the browser already had the resource cached), it competed with other streams for bandwidth, and it was difficult to implement correctly without over-pushing. HTTP/3 / the HTTP Working Group has effectively deprecated server push in favor of the `103 Early Hints` response code and the `Link: rel=preload` header, which let the browser decide whether to fetch the resource based on its own cache state.

---

## See Also

- [Rate Limiting](../redis/redis-rate-limiting.md) — 429 status codes, `Retry-After` header, throttling strategies
- [Caching Strategies](../system-design/caching-strategies.md) — `Cache-Control`, ETags, CDN caching in depth
- [API Design](../system-design/api-design.md) — REST resource naming, versioning, error response schemas
- [Security Patterns](../system-design/security-patterns.md) — CSRF, XSS, CSP, auth header patterns
- [Distributed Systems](../system-design/distributed-systems.md) — Connection pooling, circuit breaking, timeouts
