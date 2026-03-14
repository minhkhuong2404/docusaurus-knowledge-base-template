---
id: http-https-application-layer
title: HTTP, HTTPS & Application Layer
description: HTTP/1.1, HTTP/2, HTTP/3 evolution, request/response structure, headers, caching, TLS handshake, and HTTPS best practices.
tags: [networking, http, https, http2, http3, tls, ssl, headers, caching, quic]
sidebar_position: 5
---

# HTTP, HTTPS & Application Layer

## HTTP Fundamentals

HTTP (HyperText Transfer Protocol) is a **stateless, request-response** application protocol that operates over TCP (or QUIC for HTTP/3).

**Stateless**: each request is independent — the server does not retain session state between requests. Cookies, tokens, and sessions are application-level workarounds.

---

## HTTP Request Structure

```
POST /api/orders HTTP/1.1
Host: api.example.com
Content-Type: application/json
Authorization: Bearer eyJhbGci...
Accept: application/json
Content-Length: 85
User-Agent: Java-http-client/11

{"userId": 42, "items": [{"productId": 1, "qty": 2}], "total": 99.90}
│
└── Request Line: METHOD PATH HTTP-VERSION
    Headers: key-value pairs
    Blank line (CRLF)
    Body (optional)
```

### HTTP Methods

| Method | Idempotent | Safe | Body | Usage |
|--------|-----------|------|------|-------|
| `GET` | ✅ | ✅ | ❌ | Read resource |
| `POST` | ❌ | ❌ | ✅ | Create resource, submit data |
| `PUT` | ✅ | ❌ | ✅ | Replace resource entirely |
| `PATCH` | ❌ | ❌ | ✅ | Partial update |
| `DELETE` | ✅ | ❌ | ❌ | Delete resource |
| `HEAD` | ✅ | ✅ | ❌ | GET without body (check headers) |
| `OPTIONS` | ✅ | ✅ | ❌ | CORS preflight, list methods |
| `CONNECT` | ❌ | ❌ | — | Establish tunnel (proxies) |

**Idempotent**: calling N times has the same effect as calling once.
**Safe**: does not modify server state.

---

## HTTP Response Structure

```
HTTP/1.1 201 Created
Date: Mon, 14 Mar 2026 10:00:00 GMT
Content-Type: application/json
Content-Length: 124
Location: /api/orders/1001
Cache-Control: no-store
X-Request-Id: abc-123

{"orderId": 1001, "status": "pending", "createdAt": "2026-03-14T10:00:00Z"}
│
└── Status Line: HTTP-VERSION STATUS-CODE REASON-PHRASE
    Headers
    Blank line
    Body
```

### HTTP Status Codes

| Range | Category | Key Codes |
|-------|----------|-----------|
| 1xx | Informational | 100 Continue, 101 Switching Protocols |
| 2xx | Success | 200 OK, 201 Created, 204 No Content |
| 3xx | Redirection | 301 Moved Permanently, 302 Found, 304 Not Modified |
| 4xx | Client Error | 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 429 Too Many Requests |
| 5xx | Server Error | 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout |

:::tip 401 vs 403
`401 Unauthorized` means *unauthenticated* (no valid credentials). `403 Forbidden` means *authenticated but not authorized* (you're logged in but don't have permission).
:::

---

## Important HTTP Headers

### Request Headers

| Header | Purpose | Example |
|--------|---------|---------|
| `Host` | Target server (required in HTTP/1.1) | `api.example.com` |
| `Authorization` | Auth credentials | `Bearer <token>` |
| `Content-Type` | Request body format | `application/json` |
| `Accept` | Acceptable response formats | `application/json` |
| `Accept-Encoding` | Compression support | `gzip, deflate, br` |
| `Connection` | Connection management | `keep-alive` |
| `Cache-Control` | Caching directives | `no-cache` |
| `If-None-Match` | Conditional GET (ETag) | `"abc123"` |
| `If-Modified-Since` | Conditional GET (date) | `Tue, 10 Mar 2026...` |
| `X-Forwarded-For` | Original client IP (behind proxy) | `203.0.113.5` |
| `Origin` | CORS — request origin | `https://app.example.com` |

### Response Headers

| Header | Purpose | Example |
|--------|---------|---------|
| `Content-Type` | Response body format | `application/json; charset=utf-8` |
| `Content-Encoding` | Compression used | `gzip` |
| `Cache-Control` | Caching policy | `max-age=3600, public` |
| `ETag` | Resource version identifier | `"d8e8fca2dc0f896fd7cb4cb0031ba249"` |
| `Last-Modified` | Last change timestamp | `Mon, 14 Mar 2026 09:00:00 GMT` |
| `Location` | Redirect target or new resource | `/api/orders/1001` |
| `Set-Cookie` | Set a cookie | `session=abc; HttpOnly; Secure` |
| `Strict-Transport-Security` | Force HTTPS (HSTS) | `max-age=31536000; includeSubDomains` |
| `Access-Control-Allow-Origin` | CORS allow header | `https://app.example.com` |
| `X-Content-Type-Options` | Prevent MIME sniffing | `nosniff` |

---

## HTTP Caching

```
Client          Cache           Server
  │──GET /data──►│               │
  │              │──GET /data────►│  (cache miss)
  │              │◄──200 + ETag──│
  │◄──200 ───────│               │
  │              │               │
  │──GET /data──►│               │
  │◄──200 (hit)─│               │  (cache hit, no server request)
  │              │               │
  │──GET /data──►│               │
  │              │──GET + If-None-Match: "etag" ──►│  (cache stale, revalidate)
  │              │◄──────────────────── 304 ───────│
  │◄──200 (hit)─│               │
```

### Cache-Control Directives

```
Cache-Control: max-age=3600          # cache for 1 hour
Cache-Control: no-cache              # must revalidate with server before using
Cache-Control: no-store              # don't cache at all (sensitive data)
Cache-Control: private               # only client may cache (not CDN)
Cache-Control: public                # CDN and clients may cache
Cache-Control: immutable             # won't change, skip revalidation
Cache-Control: s-maxage=86400        # CDN TTL (overrides max-age for proxies)
Cache-Control: stale-while-revalidate=60  # serve stale for 60s while refreshing
```

---

## HTTP/1.0 vs HTTP/1.1 vs HTTP/2 vs HTTP/3

### HTTP/1.0
- New TCP connection for **every request** (no keep-alive)
- No persistent connections → 3-way handshake per request
- Very slow for pages with many resources

### HTTP/1.1
- **Persistent connections** (`Connection: keep-alive`) — reuse TCP connection
- **Pipelining** — send multiple requests without waiting for each response (rarely used — head-of-line blocking)
- Chunked transfer encoding
- Virtual hosting (`Host` header required)
- **Head-of-line blocking**: one slow response blocks all subsequent responses on the connection

### HTTP/2

```
HTTP/1.1: one request per connection at a time
          [req1]───────────[resp1][req2]──[resp2][req3]─[resp3]

HTTP/2:   multiplexing — many streams on one TCP connection
          Stream 1: [req1]────────────────────[resp1]
          Stream 2:    [req2]──────[resp2]
          Stream 3:       [req3]──────────[resp3]
```

**HTTP/2 Features:**
- **Multiplexing**: multiple concurrent requests/responses over one TCP connection
- **Header compression** (HPACK): removes redundant headers
- **Server push**: server can proactively send resources before client requests them
- **Stream prioritization**: important resources delivered first
- **Binary framing**: more efficient than text-based HTTP/1.1
- **Still TCP**: susceptible to TCP-level head-of-line blocking (one lost packet blocks all streams)

### HTTP/3 (QUIC)

```
HTTP/1.1, 2: TCP ← reliable, ordered, but HoL blocking
HTTP/3:     QUIC (UDP-based) ← reliability per stream, no HoL blocking
```

**HTTP/3 / QUIC Features:**
- Runs over **UDP** with reliability built into QUIC
- **0-RTT connection establishment**: TLS 1.3 + QUIC combined — resume connections instantly
- **No HoL blocking**: lost UDP packet only blocks its own stream
- **Connection migration**: connection persists across IP changes (mobile handoff)
- Built-in TLS 1.3 — no unencrypted QUIC

```
HTTP/1.1: TCP handshake (1 RTT) + TLS handshake (2 RTT) = 3 RTT before data
HTTP/2:   Same
HTTP/3:   QUIC 0-RTT = 0 RTT for known servers (1 RTT first time)
```

---

## HTTPS & TLS

HTTPS = HTTP + **TLS** (Transport Layer Security) encryption.

### TLS 1.3 Handshake

```
Client                           Server
  │                                │
  │─── ClientHello ───────────────►│
  │    (supported ciphers, key)     │
  │                                │
  │◄── ServerHello + Certificate ──│
  │    (chosen cipher, server key)  │
  │                                │
  │─── {Finished} ────────────────►│  (encrypted from here)
  │                                │
  │◄── {Finished} ─────────────────│
  │                                │
  │═══════ Encrypted HTTP ══════════│
```

**TLS 1.3 vs 1.2:**
- TLS 1.3: 1 RTT handshake (vs 2 RTT for TLS 1.2), 0-RTT resumption
- TLS 1.3: eliminated weak cipher suites (RC4, 3DES, RSA key exchange)
- TLS 1.3: mandatory forward secrecy (ECDHE key exchange)
- TLS 1.3: encrypted more of the handshake

### Certificate Chain

```
Root CA (self-signed, pre-installed in browsers/OS)
  └── Intermediate CA (signed by root)
        └── Server Certificate (signed by intermediate)
              ← presented to browser for api.example.com
```

### Spring Boot TLS Configuration

```yaml
# application.yml
server:
  port: 8443
  ssl:
    key-store: classpath:keystore.p12
    key-store-password: ${SSL_KEYSTORE_PASSWORD}
    key-store-type: PKCS12
    key-alias: myserver
    enabled: true
    protocol: TLS
    enabled-protocols: TLSv1.2,TLSv1.3
    ciphers: TLS_AES_128_GCM_SHA256,TLS_AES_256_GCM_SHA384
```

```java
// Spring WebClient with TLS
WebClient webClient = WebClient.builder()
    .clientConnector(new ReactorClientHttpConnector(
        HttpClient.create().secure(sslSpec ->
            sslSpec.sslContext(SslContextBuilder
                .forClient()
                .trustManager(InsecureTrustManagerFactory.INSTANCE) // dev only!
                .build()))))
    .build();
```

---

## CORS — Cross-Origin Resource Sharing

Browsers restrict cross-origin requests unless the server explicitly allows them.

```
Origin A: https://frontend.example.com
Origin B: https://api.example.com     ← different origin (different host)

Browser enforces:
  1. Preflight OPTIONS request to check CORS headers
  2. If allowed, sends actual request
  3. If not allowed, blocks response (request still happens server-side!)
```

```java
// Spring MVC CORS
@CrossOrigin(origins = "https://frontend.example.com", 
             methods = {RequestMethod.GET, RequestMethod.POST},
             maxAge = 3600)
@RestController
public class OrderController { ... }

// Global CORS configuration
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("https://frontend.example.com")
            .allowedMethods("GET", "POST", "PUT", "DELETE")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(3600);
    }
}
```

---

## 🎯 Interview Questions

**Q1. What is the difference between HTTP/1.1, HTTP/2, and HTTP/3?**
> HTTP/1.1: persistent connections, pipelining (rarely used), text-based, head-of-line blocking at application level. HTTP/2: multiplexing many requests over one TCP connection, binary framing, HPACK header compression, server push — but still suffers TCP-level head-of-line blocking. HTTP/3: uses QUIC over UDP, per-stream reliability eliminates HoL blocking, 0-RTT resumption, built-in TLS 1.3, connection migration for mobile.

**Q2. What is the difference between `no-cache` and `no-store` in Cache-Control?**
> `no-store`: never cache at all — not in browser, not in CDN. Use for sensitive data (banking transactions). `no-cache`: you may store a cached copy, but must revalidate with the server before using it (sends conditional GET with ETag/Last-Modified). If server returns 304 Not Modified, use the cached version. `no-cache` allows the bandwidth savings of 304 responses; `no-store` doesn't.

**Q3. Explain the TLS handshake and what it establishes.**
> The TLS handshake establishes: (1) cipher suite agreement; (2) server authentication via certificate; (3) session keys via asymmetric cryptography (ECDHE for forward secrecy). After the handshake, all HTTP traffic is encrypted with symmetric keys (much faster). TLS 1.3 does this in 1 RTT vs 2 RTT for TLS 1.2.

**Q4. What is the difference between 401 and 403?**
> 401 Unauthorized means the request lacks valid authentication credentials — the client is not identified (send `WWW-Authenticate` header to challenge). 403 Forbidden means the client is authenticated but the server refuses to authorize the action — the client is known but not permitted. Common mistake: using 403 when the user isn't logged in (correct: 401).

**Q5. What is CORS and why does it exist?**
> CORS (Cross-Origin Resource Sharing) is a browser security mechanism that restricts web pages from making requests to a different origin than the one that served the page. It exists to prevent malicious websites from making authenticated requests to other sites on behalf of users (CSRF). The server opts in via `Access-Control-Allow-Origin` headers. Note: CORS is a browser enforcement — server-to-server calls are not affected.

**Q6. What is HTTP head-of-line blocking and how does HTTP/2 address it?**
> In HTTP/1.1, a slow response blocks subsequent responses on the same connection (even with pipelining). HTTP/2 multiplexes requests as independent streams on one TCP connection — a slow stream doesn't block others. However, at the TCP level, a lost packet blocks all streams until retransmitted (TCP-level HoL blocking). HTTP/3/QUIC solves this by implementing independent per-stream reliability over UDP.

**Q7. What is the purpose of the ETag header?**
> An ETag (Entity Tag) is a fingerprint (hash/version) of a resource. The server sends `ETag: "abc123"` with a response. On the next request, the client sends `If-None-Match: "abc123"`. If the resource hasn't changed, the server returns `304 Not Modified` with no body — saving bandwidth. ETags enable conditional caching without time-based staleness.

**Q8. What is HSTS and why is it important?**
> HSTS (HTTP Strict Transport Security) instructs browsers to always use HTTPS for a domain, even if the user types `http://`. Set via `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`. Prevents SSL stripping attacks where an attacker intercepts the initial HTTP request before the redirect to HTTPS. `preload` adds the domain to browsers' built-in HSTS list — HTTPS-only even before the first visit.
