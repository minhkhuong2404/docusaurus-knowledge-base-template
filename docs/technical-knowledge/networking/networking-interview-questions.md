---
id: networking-interview-questions
title: Networking Interview Questions — Master List
description: Comprehensive compilation of the most common networking interview questions across all topics, organized by category and difficulty.
tags: [networking, interview, questions, preparation, system-design]
sidebar_position: 19
---

# Networking Interview Questions — Master List

A curated compilation of the most common and important networking questions in software engineering interviews — from junior to senior/staff level. Each answer is concise and interview-ready.

---

## 🔩 Foundations: OSI & TCP/IP

**Q: What are the 7 layers of the OSI model?**
> Physical (bits) → Data Link (frames, MAC) → Network (packets, IP) → Transport (segments, TCP/UDP) → Session → Presentation → Application. Mnemonic: *"Please Do Not Throw Sausage Pizza Away"*.

**Q: What happens when you type `https://google.com` in a browser?**
> 1. **DNS**: resolve `google.com` → IP (browser cache → OS → resolver → root → TLD → authoritative NS). 2. **TCP**: 3-way handshake to port 443. 3. **TLS**: client hello → server hello + cert → key exchange → session keys → encrypted. 4. **HTTP/2** (or 3) GET request over TLS. 5. Server responds, browser renders. Each step involves the relevant OSI layers — from app-layer DNS to physical bits on the wire.

**Q: What is the difference between a switch and a router?**
> Switch (Layer 2): forwards Ethernet **frames** within a LAN using a MAC address table. Doesn't cross network boundaries. Router (Layer 3): routes IP **packets** between different networks using a routing table. Connects LANs to WANs. A Layer-3 switch can do both.

**Q: What is ARP?**
> ARP (Address Resolution Protocol) maps an IP address to a MAC address on the local network. A host broadcasts "who has IP X?" and the target replies with its MAC. Results are cached in the ARP table (~20 min). ARP only works within a single broadcast domain (LAN).

---

## 📡 TCP & Transport Layer

**Q: Explain the TCP 3-way handshake.**
> Client sends **SYN** (I want to connect, my seq=X). Server replies **SYN-ACK** (OK, my seq=Y, I acknowledge your X). Client sends **ACK** (I acknowledge your Y). After this, the connection is established and both sides agree on initial sequence numbers for reliable delivery.

**Q: What is the TCP 4-way termination?**
> Either side can initiate: (1) FIN → (2) ACK (data can still flow half-open) → (3) FIN → (4) ACK. After sending the final ACK, the initiator enters **TIME_WAIT** for 2×MSL (~60s) to handle any delayed packets.

**Q: What is the difference between TCP and UDP?**
> TCP: connection-oriented, reliable (ACKs, retransmission), ordered, flow/congestion control. Higher overhead. Use for: HTTP, databases, files, email. UDP: connectionless, unreliable (no ACKs), unordered, minimal overhead. Use for: DNS, video streaming, gaming, VoIP, QUIC. Rule of thumb: use UDP when you need low latency and can tolerate loss; use your own reliability if needed.

**Q: What is TCP flow control?**
> Flow control prevents the sender from overwhelming the receiver. The receiver advertises a **receive window** (RWND) — how many bytes it can buffer. The sender cannot have more unacknowledged bytes in flight than the receive window. If RWND=0, the sender stops and polls with probe packets.

**Q: What is TCP congestion control?**
> Prevents the sender from overwhelming the **network**. TCP infers congestion from packet loss. Phases: **Slow Start** (exponential growth from 1 MSS), **Congestion Avoidance** (linear growth after threshold), **Fast Retransmit** (resend on 3 duplicate ACKs), **Fast Recovery** (halve cwnd, don't restart slow start). Modern algorithms: CUBIC (default Linux), BBR.

**Q: What is the TCP TIME_WAIT state?**
> After the final ACK of connection termination, the closing side waits 2×MSL (~60s) before fully closing. Purpose: (1) Ensures the final ACK was received (if lost, the other side will resend FIN). (2) Ensures old packets from this connection don't confuse a new connection on the same 4-tuple. High TIME_WAIT counts are normal for busy servers — only a problem if you exhaust ephemeral ports.

**Q: What is a TCP SYN flood attack?**
> Attacker sends many SYN packets with spoofed source IPs, causing the server to allocate half-open connection state (SYN-RCVD) for each. Server fills its backlog, blocking legitimate connections. Mitigations: **SYN cookies** (server doesn't allocate state until ACK received), rate limiting SYN packets, firewall rules.

---

## 🌐 HTTP & Application Layer

**Q: What is the difference between HTTP/1.1, HTTP/2, and HTTP/3?**
> HTTP/1.1: text-based, one request per connection (pipelining broken), uses keep-alive for reuse, HOL blocking per connection. HTTP/2: binary framing, multiplexing (many requests per connection), header compression (HPACK), server push — all over TCP (HOL blocking at TCP level). HTTP/3: same semantics but over QUIC (UDP), eliminates all HOL blocking, 0-RTT resumption, connection migration.

**Q: Explain the TLS handshake.**
> TLS 1.3: (1) Client sends ClientHello (supported ciphers, key share). (2) Server sends ServerHello (chosen cipher, key share, certificate). (3) Both derive session keys from key exchange (ECDHE). (4) Server sends Finished (encrypted). (5) Client verifies cert, sends Finished. Handshake: 1 RTT. Resumption: 0-RTT.

**Q: What are HTTP status code categories?**
> 1xx: Informational (100 Continue). 2xx: Success (200 OK, 201 Created, 204 No Content). 3xx: Redirect (301 Moved Permanently, 302 Found, 304 Not Modified). 4xx: Client Error (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 429 Too Many Requests). 5xx: Server Error (500 Internal, 502 Bad Gateway, 503 Unavailable, 504 Gateway Timeout).

**Q: What is the difference between 401 and 403?**
> 401 Unauthorized: the client is **not authenticated** (no valid credentials were provided — despite the misleading name). 403 Forbidden: the client **is authenticated** but does not have permission to access the resource. Practical: missing/invalid token = 401; valid token, wrong role = 403.

**Q: What is HTTP caching and how do `Cache-Control` headers work?**
> `Cache-Control` directives: `max-age=3600` (cache for 1 hour), `no-cache` (must revalidate before using cache — not "don't cache"), `no-store` (never cache), `private` (browser only), `public` (CDN ok), `must-revalidate` (use stale if server unreachable = no). Revalidation: client sends `If-None-Match: <etag>` or `If-Modified-Since` — server returns 304 Not Modified if unchanged.

**Q: What is CORS and why does it exist?**
> CORS (Cross-Origin Resource Sharing) is a browser security mechanism that restricts web pages from making requests to a different origin (protocol+host+port) than the page was loaded from. The browser sends a preflight OPTIONS request with `Origin` header; the server must respond with `Access-Control-Allow-Origin` to grant permission. It prevents malicious sites from silently making requests to your API using the user's cookies.

---

## 🔍 DNS

**Q: What is the order of DNS resolution?**
> Browser DNS cache → OS DNS cache → OS resolver (checks `/etc/hosts`) → configured DNS resolver (ISP or 8.8.8.8) → resolver's cache → if miss: query root nameserver → TLD nameserver → authoritative nameserver → A/AAAA record returned → cached at each level with TTL.

**Q: What DNS record types do you know?**
> A: IPv4 address. AAAA: IPv6 address. CNAME: canonical name (alias). MX: mail exchange server (+ priority). TXT: text data (SPF, DKIM, domain verification). NS: authoritative nameserver for zone. SOA: start of authority (zone serial, refresh, retry, expire). PTR: reverse DNS (IP → hostname). SRV: service discovery (hostname + port). CAA: certificate authority authorization.

**Q: What is a CNAME and when can't you use one?**
> CNAME maps one hostname to another (the canonical name). The resolver follows it to the ultimate A/AAAA record. Restriction: you cannot use CNAME at the zone apex (`example.com`) because the zone apex must have SOA and NS records, which can't coexist with a CNAME (RFC 1034). Use ALIAS/ANAME records (Route 53, Cloudflare) for apex domains — they resolve like CNAME but return A records.

---

## ⚡ Load Balancing & CDN

**Q: What load balancing algorithms do you know?**
> Round Robin: equal rotation — simple, ignores server capacity. Weighted Round Robin: rotation by weight. Least Connections: send to server with fewest active connections — best for variable request duration. IP Hash: consistent hashing on client IP for sticky routing. Random: statistically similar to round robin. Least Response Time: combines connections + latency.

**Q: What is a CDN and how does it work?**
> CDN (Content Delivery Network) caches content at geographically distributed edge nodes (PoPs). User requests are routed to the nearest edge (via Anycast DNS or BGP routing). Edge serves cached responses (cache hit), or fetches from origin on miss (cache fill). Benefits: reduced latency (closer), reduced origin load, DDoS absorption. Used for: static assets, API responses, media streaming.

**Q: What is the difference between L4 and L7 load balancing?**
> L4 (Transport): routes based on IP + TCP/UDP port. Doesn't inspect content. Fast, low overhead. Can't route based on URL path, headers, or cookies. L7 (Application): inspects HTTP headers, URL paths, cookies. Can route `/api` to one pool, `/static` to another. Can handle SSL termination, rewrites, WAF. More overhead but much more flexible.

---

## 🔐 Network Security

**Q: What is the difference between symmetric and asymmetric encryption?**
> Symmetric: same key encrypts and decrypts (AES, ChaCha20). Fast, used for bulk data. Problem: key distribution. Asymmetric: public/private key pair (RSA, ECDSA). Public key encrypts or verifies; private key decrypts or signs. Slow, used for key exchange and signatures. TLS uses asymmetric to establish shared secret, then symmetric for the session.

**Q: What is a DDoS attack and how do you mitigate it?**
> DDoS (Distributed Denial of Service): flood a target with traffic from many sources (botnet) to exhaust resources (bandwidth, connections, CPU). Types: volumetric (UDP flood), protocol (SYN flood), application (HTTP GET flood). Mitigations: CDN with DDoS scrubbing (Cloudflare, AWS Shield), rate limiting, SYN cookies, Anycast diffusion, WAF for application-layer attacks, traffic profiling to block attack patterns.

**Q: What is a firewall and what types exist?**
> Packet filter (stateless): allow/deny based on IP, port, protocol — no connection tracking. Stateful: tracks TCP connection state — knows if a packet is part of an established connection. Application-layer firewall/WAF: inspects payload, detects SQLi, XSS, etc. Next-gen firewall (NGFW): DPI, IDS/IPS, user identity awareness.

**Q: What is mTLS and when would you use it?**
> Mutual TLS: both client and server present and verify X.509 certificates. In regular TLS, only the server is authenticated. mTLS provides cryptographic proof of identity for both parties — used for zero-trust service-to-service communication in microservices, IoT device authentication, and high-security APIs where API keys aren't sufficient.

---

## 🔌 Sockets & I/O

**Q: What is the difference between blocking and non-blocking I/O?**
> Blocking I/O: the calling thread blocks until data is available or the operation completes. Simple to code, but one thread per connection = poor scalability. Non-blocking I/O (NIO): the call returns immediately (EAGAIN/EWOULDBLOCK if no data). Requires polling or I/O multiplexing (select/epoll) to know when I/O is ready. One thread can handle thousands of connections.

**Q: What is epoll and why is it better than select?**
> `select` and `poll`: the application passes all file descriptors on every call; the kernel scans all of them — O(n) per call. `epoll`: edge-triggered event notification. Register FDs once; the kernel notifies only when they become ready — O(1) per event. `epoll` can handle millions of connections efficiently; `select` degrades badly above 1000 FDs.

**Q: What is the C10K problem?**
> In 1999, Dan Kegel identified that serving 10,000 concurrent connections with one-thread-per-connection was infeasible (too much memory + context-switching). The solution: event-driven, non-blocking I/O (epoll/kqueue) with a thread pool for CPU work. This is the architecture behind Nginx, Node.js, Netty, and Spring WebFlux — enabling millions of concurrent connections.

---

## 🏗️ REST & API Design

**Q: What are the REST constraints?**
> Client-Server separation, Statelessness (no session state on server), Cacheability (responses declare cacheability), Uniform Interface (resource URIs, standard methods, self-descriptive messages), Layered System (clients don't know if talking to origin or proxy), and optionally Code on Demand (serve executable code).

**Q: What is idempotency and which HTTP methods are idempotent?**
> Idempotent: calling the same operation N times has the same effect as calling it once. GET (read, no side effect), PUT (replace — same result each time), DELETE (first delete succeeds, subsequent return 404 but state is same), HEAD, OPTIONS are idempotent. POST is **not idempotent** (each call may create a new resource). PATCH is not idempotent by definition but can be implemented as such.

**Q: How do you version a REST API?**
> Options: URI versioning (`/v1/orders`, `/v2/orders`) — most visible, easy to route; Header versioning (`Accept: application/vnd.api+json;version=2`) — clean URIs, harder to test in browser; Query param (`/orders?version=2`) — easy but pollutes URLs. URI versioning is most commonly used in practice. Always maintain backward compatibility within a version; deprecate old versions with sunset headers.

---

## ☁️ Microservices & Service Mesh

**Q: What is a service mesh and what problems does it solve?**
> A service mesh is an infrastructure layer for service-to-service communication, implemented as sidecar proxies (e.g., Envoy) alongside each service. Solves: mutual TLS without code changes, observability (metrics/traces/logs for every call), traffic management (retries, circuit breaking, timeouts, canary routing), service discovery. Istio and Linkerd are the most common implementations.

**Q: What is a circuit breaker and why is it needed?**
> A circuit breaker prevents cascading failures in distributed systems. When a service is failing, the circuit breaker "trips" (opens) and immediately returns errors/fallback responses instead of waiting for timeouts. States: Closed (normal, requests pass through), Open (failing, requests fail fast), Half-Open (probe with a few requests to see if service recovered). Resilience4j and Hystrix implement this pattern.

**Q: What is service discovery and what are the two types?**
> Service discovery lets services find each other's current network addresses (since IPs change in dynamic environments). Client-side discovery: the client queries a registry (e.g., Eureka, Consul) and load-balances itself. Server-side discovery: the client sends requests to a router (load balancer, service mesh) that queries the registry and routes. Kubernetes uses DNS-based server-side discovery.

---

## 📊 Performance

**Q: What is latency vs throughput? Can you have both?**
> Latency: time for one operation to complete (ms). Throughput: operations per unit time (req/s). They're often in tension — optimizing for throughput (batching, pipelining) increases per-request latency; minimizing latency may reduce throughput. But for many systems, high throughput at low latency is achievable with proper architecture (async I/O, connection pooling, CDN caching, efficient protocols).

**Q: What is the Bandwidth-Delay Product (BDP)?**
> BDP = bandwidth × RTT. It represents how many bytes can be "in flight" in the network pipe at once. If your TCP window is smaller than BDP, you can't fully utilize the link. For a 100 Mbps link with 100ms RTT: BDP = 100e6 × 0.1 = 10 MB. Your TCP socket buffer and window scaling must accommodate this. Critical for tuning long-distance, high-bandwidth connections.

**Q: What is connection pooling and why is it important?**
> Creating a TCP connection (+ TLS handshake + DB auth) takes 5–50ms. For high-throughput apps, creating a new connection per request is prohibitive. Connection pools maintain a set of pre-established, reusable connections. The app checks out a connection, uses it, returns it. HikariCP (DB), Reactor Netty (HTTP) handle this automatically. Pool sizing: too small = contention; too large = resource waste.

---

## 🎓 System Design Scenarios

**Q: How would you design the networking layer for a globally distributed API?**
> Layers: (1) **DNS**: Route 53/Cloudflare with latency-based routing to nearest region. (2) **CDN**: Cloudflare/CloudFront for caching, DDoS protection, TLS termination at edge. (3) **Global Load Balancer**: Anycast to nearest PoP, health checks, failover. (4) **Regional L7 Load Balancer**: nginx/ALB for routing to service clusters. (5) **Service mesh**: mTLS between services, observability. (6) **Connection pooling** at every layer. (7) Circuit breakers for resilience.

**Q: How does a WebSocket connection work and how does it differ from HTTP polling?**
> WebSocket starts as HTTP, upgrades via `Upgrade: websocket` header to a persistent, full-duplex TCP connection. No HTTP overhead per message — messages are lightweight frames. Long polling: client sends HTTP request, server holds it until data is available, responds, client immediately reconnects — simulates push but with HTTP overhead. SSE: server keeps HTTP connection open, streams `text/event-stream` — server-to-client only. WebSocket: full-duplex, lowest overhead, best for bidirectional real-time.

**Q: What would you check if API response times suddenly increased by 2x?**
> Step 1: Determine scope — one endpoint or all? One region or global? Step 2: Correlate with deployment, traffic spike, dependency change. Step 3: Measure where time is spent — DB query time? External service latency? GC pause? Network? Use tracing (Jaeger/Zipkin). Step 4: Network-specific checks — DNS TTL change? New TLS handshakes? Connection pool exhaustion? Replication lag? Step 5: `curl -w` timing to isolate DNS vs TCP vs TLS vs TTFB. Step 6: Check CDN hit rates dropped. Step 7: Check connection pool metrics (awaiting connections = undersized pool).
