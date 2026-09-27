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

## HTTP Methods In Depth

HTTP methods (also called "verbs") tell the server **what action to perform** on a resource. Each method has a defined contract around safety and idempotency.

### Understanding Safety and Idempotency

These two properties are critical for designing resilient APIs and clients.

**Safe** means the request does not change server state. Safe methods can be cached, prefetched, and retried freely.

**Idempotent** means calling the same request N times has the same effect as calling it once. Idempotent requests can be safely retried on network failure without risk of duplicate side effects.

```
Example: DELETE /orders/42

First call:  order exists → deleted → 200 OK
Second call: order gone → 404 Not Found

The server state is the same after both calls (order is gone).
→ DELETE is idempotent even though the response code differs.
```

| Method    | Safe | Idempotent | Has Body | Primary Use                               |
| --------- | ---- | ---------- | -------- | ----------------------------------------- |
| `GET`     | ✅    | ✅          | ❌        | Read / retrieve a resource                |
| `HEAD`    | ✅    | ✅          | ❌        | Read headers only (no body)               |
| `OPTIONS` | ✅    | ✅          | ❌        | Discover allowed methods / CORS preflight |
| `DELETE`  | ❌    | ✅          | Rarely   | Remove a resource                         |
| `PUT`     | ❌    | ✅          | ✅        | Replace a resource entirely               |
| `PATCH`   | ❌    | ❌*         | ✅        | Partially update a resource               |
| `POST`    | ❌    | ❌          | ✅        | Create a resource, trigger an action      |
| `CONNECT` | ❌    | ❌          | —        | Establish a TCP tunnel (proxy)            |

*PATCH *can* be designed to be idempotent (e.g., `SET field=value`) or non-idempotent (e.g., `INCREMENT field by 1`). The HTTP spec leaves this to the implementation.

---

### GET — Read a Resource

Retrieves a representation of a resource. The most common method. **Never use GET to modify state.**

```
GET /api/products/42 HTTP/1.1
Host: api.example.com
Accept: application/json
Authorization: Bearer <token>

→ No body. All parameters go in the URL or query string.
```

```
GET /api/products?category=electronics&sort=price&page=2 HTTP/1.1
```

**Safe, idempotent** → browsers can prefetch GET requests, CDNs can cache them, load balancers can retry on failure.

:::warning[Never use GET to modify state]
`GET /api/orders/42/cancel` is a design error. If a browser or CDN prefetches that URL, the order gets cancelled silently. Use `POST /api/orders/42/cancel` or `DELETE /api/orders/42` instead.
:::

```java
@GetMapping("/products/{id}")
public ResponseEntity<Product> getProduct(@PathVariable Long id) {
    return ResponseEntity.ok(productService.findById(id));
}

@GetMapping("/products")
public ResponseEntity<Page<Product>> listProducts(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String category) {
    return ResponseEntity.ok(productService.findAll(page, size, category));
}
```

**Cacheability:** GET responses can be cached by browsers, CDNs, and proxies. Control this with `Cache-Control` headers.

```
HTTP/1.1 200 OK
Cache-Control: public, max-age=3600   ← cache for 1 hour
ETag: "d8e8fca2dc0f896f"             ← fingerprint for conditional requests
```

---

### POST — Create or Submit

Creates a new resource or triggers a server-side action. The response usually includes the newly created resource's URL in the `Location` header.

**Not idempotent** → retrying a POST may create duplicate resources. Always design APIs so clients don't need to retry blindly.

```
POST /api/orders HTTP/1.1
Content-Type: application/json

{"userId": 42, "items": [...], "total": 99.90}

→ Response:
HTTP/1.1 201 Created
Location: /api/orders/1001     ← URL of the new resource
Content-Type: application/json

{"orderId": 1001, "status": "pending"}
```

**POST for actions (RPC-style):**

POST is also the right method for actions that don't map cleanly to CRUD:

```
POST /api/orders/1001/cancel       ← cancel an order
POST /api/payments/1001/refund     ← refund a payment
POST /api/users/42/send-verification-email
POST /api/reports/generate
```

```java
@PostMapping("/orders")
public ResponseEntity<Order> createOrder(@RequestBody @Valid CreateOrderRequest req) {
    Order order = orderService.create(req);
    URI location = URI.create("/api/orders/" + order.getId());
    return ResponseEntity.created(location).body(order); // 201 Created + Location header
}

@PostMapping("/orders/{id}/cancel")
public ResponseEntity<Void> cancelOrder(@PathVariable Long id) {
    orderService.cancel(id);
    return ResponseEntity.noContent().build(); // 204 No Content
}
```

**Idempotency key pattern** — make POST idempotent when retries are needed:

```
POST /api/payments HTTP/1.1
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000   ← client-generated UUID

Server stores: if this key was seen before, return the original response.
Retry safety: client can retry on network failure without double-charging.
```

---

### PUT — Replace Entirely

Replaces a resource completely with the request body. The client sends the **full representation** — any fields not included are removed or reset to defaults.

**Idempotent** → calling PUT multiple times with the same body has the same result.

```
PUT /api/users/42 HTTP/1.1
Content-Type: application/json

{
  "name": "Alice",
  "email": "alice@example.com",
  "role": "admin",
  "preferences": {"theme": "dark"}
}

→ The entire user object is replaced. Every field must be included.
   Missing fields are nulled/defaulted — not preserved.
```

```java
@PutMapping("/users/{id}")
public ResponseEntity<User> replaceUser(
        @PathVariable Long id,
        @RequestBody @Valid UserRequest req) {
    User user = userService.replace(id, req); // full replacement
    return ResponseEntity.ok(user);
}
```

**PUT can also create** (upsert) if the client specifies the resource ID:

```
PUT /api/settings/user:42     ← creates if not exists, replaces if it does
```

:::tip[PUT vs POST for creation]
Use **POST** when the **server assigns the ID** (`POST /orders` → server creates `order:1001`).
Use **PUT** when the **client assigns the ID** (`PUT /files/my-document.pdf` → client-named resource).
:::

---

### PATCH — Partial Update

Updates only the fields provided in the request body. Fields not mentioned are left unchanged. More efficient than PUT when only changing one or two fields of a large resource.

```
PATCH /api/users/42 HTTP/1.1
Content-Type: application/json

{"email": "newemail@example.com"}

→ Only email is changed. name, role, preferences remain as-is.
   (Compare: PUT would require sending all fields)
```

**PATCH is not always idempotent.** It depends on the operation:

```
Idempotent PATCH:     {"status": "cancelled"}    → set to cancelled (same result each time)
Non-idempotent PATCH: {"balance": {"$inc": 100}} → add 100 each time (different each call)
```

**JSON Patch** (RFC 6902) — a standardized patch format for complex operations:

```
PATCH /api/users/42 HTTP/1.1
Content-Type: application/json-patch+json

[
  {"op": "replace", "path": "/email", "value": "new@example.com"},
  {"op": "add",     "path": "/tags/-", "value": "premium"},
  {"op": "remove",  "path": "/legacyField"}
]
```

```java
@PatchMapping("/users/{id}")
public ResponseEntity<User> updateUser(
        @PathVariable Long id,
        @RequestBody Map<String, Object> updates) {  // only fields to change
    User user = userService.partialUpdate(id, updates);
    return ResponseEntity.ok(user);
}

// Service: apply only non-null fields
public User partialUpdate(Long id, Map<String, Object> updates) {
    User user = repo.findById(id).orElseThrow();
    if (updates.containsKey("email")) user.setEmail((String) updates.get("email"));
    if (updates.containsKey("name"))  user.setName((String)  updates.get("name"));
    return repo.save(user);
}
```

---

### DELETE — Remove a Resource

Removes the specified resource. Returns `200 OK` with a body, `204 No Content` with no body, or `202 Accepted` if deletion is async.

**Idempotent** → deleting an already-deleted resource returns `404`, but the server state (resource absent) is the same.

```
DELETE /api/orders/1001 HTTP/1.1
Authorization: Bearer <token>

→ HTTP/1.1 204 No Content    (most common: success, no body)
→ HTTP/1.1 404 Not Found     (already deleted — still idempotent)
→ HTTP/1.1 202 Accepted      (async delete queued, not yet complete)
```

```java
@DeleteMapping("/orders/{id}")
public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
    orderService.delete(id);
    return ResponseEntity.noContent().build(); // 204
}

// Soft delete — mark as deleted, don't actually remove from DB
@DeleteMapping("/users/{id}")
public ResponseEntity<Void> deactivateUser(@PathVariable Long id) {
    userService.softDelete(id); // sets deletedAt, isActive=false
    return ResponseEntity.noContent().build();
}
```

---

### HEAD — Metadata Without Body

Identical to GET but the server returns **only headers, no body**. Used to check resource existence, size, or freshness without downloading the full content.

```
HEAD /api/files/report.pdf HTTP/1.1

→ HTTP/1.1 200 OK
   Content-Length: 2048576     ← file is 2MB — client can decide whether to download
   Content-Type: application/pdf
   Last-Modified: Mon, 14 Mar 2026 09:00:00 GMT
   ETag: "d8e8fca"
   (no body)
```

**Practical uses:**
- Check if a file exists before downloading it
- Get the `Content-Length` to show a progress bar
- Validate an ETag before a conditional GET
- Health check: `HEAD /health` (faster than `GET /health` since no body is transferred)

```java
@RequestMapping(value = "/files/{name}", method = RequestMethod.HEAD)
public ResponseEntity<Void> checkFile(@PathVariable String name) {
    FileMetadata meta = fileService.getMetadata(name);
    return ResponseEntity.ok()
        .contentLength(meta.size())
        .contentType(MediaType.APPLICATION_PDF)
        .eTag(meta.etag())
        .build();
}
```

---

### OPTIONS — Discover Capabilities

Returns the HTTP methods and headers allowed for a resource. Primarily used for **CORS preflight requests** — the browser asks "can I make this cross-origin request?" before actually sending it.

```
OPTIONS /api/orders HTTP/1.1
Origin: https://frontend.example.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Authorization, Content-Type

→ HTTP/1.1 204 No Content
   Allow: GET, POST, OPTIONS
   Access-Control-Allow-Origin: https://frontend.example.com
   Access-Control-Allow-Methods: GET, POST, PUT, DELETE
   Access-Control-Allow-Headers: Authorization, Content-Type
   Access-Control-Max-Age: 86400     ← cache preflight for 24h
```

Spring handles OPTIONS/CORS automatically when configured — you rarely implement `@RequestMapping(method = OPTIONS)` manually.

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
