---
id: cdn-load-balancing
title: CDN & Load Balancing
description: Content Delivery Networks, edge caching, load balancing algorithms, health checks, session persistence, and global traffic management.
tags: [networking, cdn, load-balancing, reverse-proxy, anycast, health-check, nginx, algorithms]
sidebar_position: 7
---

# CDN & Load Balancing

## Content Delivery Network (CDN)

A CDN is a **globally distributed network of servers (PoPs — Points of Presence)** that caches content close to end users, reducing latency and origin server load.

```
Without CDN:
  User in Vietnam ──────────────────────────► Origin (US) : ~200ms RTT

With CDN:
  User in Vietnam → Singapore PoP (cached) : ~10ms RTT
  Cache miss → Singapore PoP fetches from origin once → caches for future users
```

### CDN Benefits

| Benefit | How |
|---------|-----|
| **Reduced latency** | Serve from geographically close PoP |
| **Reduced origin load** | Cache hits never reach origin |
| **DDoS protection** | CDN absorbs volumetric attacks |
| **Bandwidth savings** | CDN pays bulk rates, origin saves egress |
| **High availability** | If origin fails, CDN can serve stale cache |
| **TLS termination** | CDN handles TLS at the edge |

### What CDNs Cache

- ✅ Static assets: images, CSS, JS, fonts, PDFs
- ✅ API responses with appropriate `Cache-Control`
- ✅ HTML (with short TTL)
- ❌ Authenticated responses (private: server must set `Cache-Control: private`)
- ❌ No-store responses
- ❌ POST/PUT/DELETE (non-idempotent by default)

### CDN Cache Keys

```
Default cache key: URL (scheme + host + path + query string)
  https://cdn.example.com/api/products?lang=en → one cache entry
  https://cdn.example.com/api/products?lang=vi → different cache entry

Custom cache key variations:
  - Vary by Accept-Language header
  - Vary by device type (mobile vs desktop)
  - Strip irrelevant query params (utm_source, etc.)
```

### Popular CDNs

| CDN | Strengths |
|-----|-----------|
| Cloudflare | Security-first, free tier, Workers (edge compute) |
| AWS CloudFront | Deep AWS integration, Lambda@Edge |
| Akamai | Enterprise, media streaming |
| Fastly | Programmable VCL, instant purge |
| Azure CDN | Azure integration |

---

## Anycast

CDNs use **anycast** to route users to the nearest PoP automatically.

```
Same IP address (e.g., 104.16.0.0) announced from multiple locations
BGP routing automatically sends packets to the nearest PoP

User in Tokyo → Tokyo PoP  (same IP, different physical server)
User in London → London PoP

No DNS magic needed — routing infrastructure handles it
```

Used by: Cloudflare, Google (8.8.8.8), root DNS servers.

---

## Load Balancing

A load balancer distributes incoming traffic across multiple backend servers.

```
                         ┌──────────────┐
          ┌──────────────► Backend 1     │
          │              └──────────────┘
Clients ──► Load Balancer │
          │              ┌──────────────┐
          └──────────────► Backend 2     │
                         └──────────────┘
                         ┌──────────────┐
                         ► Backend 3     │
                         └──────────────┘
```

### Load Balancer Types

| Type | Layer | What it sees | Examples |
|------|-------|-------------|---------|
| L4 (Transport) | TCP/UDP | IP + port | AWS NLB, HAProxy (TCP mode) |
| L7 (Application) | HTTP | URL, headers, cookies | AWS ALB, nginx, Envoy |

**L4**: Fast, simple, works for any TCP/UDP protocol. Cannot route by URL path.

**L7**: Smarter routing (by path, header, host), SSL termination, health checks on HTTP, A/B testing, request rewriting.

---

## Load Balancing Algorithms

### Round Robin

```
Request 1 → Server A
Request 2 → Server B
Request 3 → Server C
Request 4 → Server A (cycle repeats)
```

Simple, equal distribution. Ignores server load — a slow server gets the same rate.

### Weighted Round Robin

```
Server A: weight 3  → gets 3/6 = 50% of requests
Server B: weight 2  → gets 2/6 = 33%
Server C: weight 1  → gets 1/6 = 17%
```

Use when servers have different capacities.

### Least Connections

Routes to the server with the **fewest active connections**.

```
Server A: 10 active connections
Server B: 3 active connections  ← next request goes here
Server C: 7 active connections
```

Better for long-lived connections (WebSockets, streaming) where request duration varies.

### Least Response Time

Routes to the server with the **lowest response time AND fewest connections**.

```
Score = (active_connections × response_time_avg)
Lowest score wins
```

### IP Hash / Consistent Hashing

```
server_index = hash(client_ip) % num_servers
```

Same client always goes to the same server (session persistence without cookies). Drawback: uneven distribution if IP distribution is skewed.

### Resource-Based / Adaptive

Routes based on actual server health metrics (CPU, memory) reported by agents. Most sophisticated but requires monitoring infrastructure.

---

## Session Persistence (Sticky Sessions)

When application state is stored in-server memory, all requests from a user must go to the same server.

```
User Alice → LB → Server A  (session stored on A)
Next request from Alice → must go to Server A (not B or C)

Methods:
1. Cookie-based: LB injects SERVERID cookie
   Set-Cookie: SERVERID=server-a; Path=/

2. IP-based: hash source IP (breaks with NAT)

3. Application-level: store session in Redis (preferred — stateless servers)
   → Eliminates need for sticky sessions
```

:::tip Best Practice
Avoid sticky sessions when possible. Store session data in a distributed cache (Redis) so any server can handle any request — true horizontal scaling.
:::

---

## Health Checks

The load balancer continuously checks backend health and removes unhealthy servers.

### Passive Health Checks

Detect failures from **live traffic** — if a server returns errors, mark it unhealthy.

```
If server returns 5xx N times in window → mark down
If server returns 2xx again → mark up (after M successes)
```

### Active Health Checks (Preferred)

Proactively send **probe requests** to each backend.

```nginx
# nginx upstream health check
upstream backend {
    server 10.0.0.1:8080;
    server 10.0.0.2:8080;
    server 10.0.0.3:8080;

    # nginx Plus (commercial) or use lua module for OSS:
    health_check interval=5s fails=3 passes=2 uri=/health;
}
```

```yaml
# AWS ALB target group health check
health_check:
  path: /actuator/health
  interval: 30
  timeout: 5
  healthy_threshold: 2
  unhealthy_threshold: 3
  matcher: "200"
```

```java
// Spring Boot Actuator health endpoint
@Component
public class DatabaseHealthIndicator implements HealthIndicator {
    @Override
    public Health health() {
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            return Health.up().withDetail("database", "reachable").build();
        } catch (Exception e) {
            return Health.down().withDetail("error", e.getMessage()).build();
        }
    }
}
```

---

## nginx Load Balancer Configuration

```nginx
upstream api_servers {
    least_conn;                          # algorithm

    server 10.0.0.1:8080 weight=3;
    server 10.0.0.2:8080 weight=2;
    server 10.0.0.3:8080 backup;        # only used when others are down

    keepalive 32;                        # keep N idle upstream connections open
}

server {
    listen 80;
    server_name api.example.com;

    location /api/ {
        proxy_pass http://api_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /static/ {
        root /var/www;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## Global Server Load Balancing (GSLB)

Distributes traffic across **multiple data centers globally** using DNS:

```
Primary DC: us-east-1 (203.0.113.10)
DR DC:      eu-west-1 (198.51.100.20)

DNS-based GSLB:
  Healthy: api.example.com → 203.0.113.10
  Primary fails health check → DNS switches to 198.51.100.20
  (with low TTL for fast failover)

Latency-based GSLB (AWS Route 53):
  US user → us-east-1
  EU user → eu-west-1
```

---

## 🎯 Interview Questions

**Q1. What is the difference between L4 and L7 load balancing?**
> L4 (transport layer) load balancing operates on TCP/UDP — it sees source/destination IP and port but not application data. Fast, protocol-agnostic, but can't route by URL path or headers. L7 (application layer) operates on HTTP — it can route by URL, headers, cookies, method; terminate TLS; perform content-based routing; modify requests. More overhead but much more flexible.

**Q2. What is the difference between round-robin and least-connections algorithms?**
> Round-robin cycles requests evenly across servers — good for stateless apps where each request takes similar time. Least-connections sends to the server with fewest active connections — better when request duration varies significantly (e.g., some requests take 100ms, others take 10s). Least-connections prevents piling requests onto a slow server that's busy with long operations.

**Q3. What are sticky sessions and why are they problematic at scale?**
> Sticky sessions (session affinity) ensure all requests from one user go to the same backend server — needed when session state is in server memory. Problems: uneven load distribution, a server crash loses all its users' sessions, prevents true horizontal scaling. Solution: externalize session state to Redis (or a database), making all servers stateless and interchangeable.

**Q4. How does anycast work and where is it used?**
> Anycast announces the same IP address from multiple geographic locations. BGP routing naturally sends packets to the topologically nearest location announcing that prefix. There's no DNS trick — the internet's routing infrastructure handles it. Used by: CDNs (serve from nearest PoP), public DNS resolvers (8.8.8.8 works from anywhere), root DNS servers, DDoS mitigation (absorb attacks at multiple locations).

**Q5. What is the purpose of health checks in load balancing?**
> Health checks detect unhealthy backends before they cause user-facing errors. Active checks proactively send probes (HTTP GET to `/health`) and mark backends down before failures impact traffic. Passive checks detect failures from live traffic patterns. Without health checks, the LB would send requests to dead servers, causing errors for those users until the problem is noticed manually.

**Q6. What is cache busting and why is it needed with CDNs?**
> When static assets (JS, CSS) are updated but clients have cached the old version, users see outdated code. Cache busting adds a content hash to filenames (`app.a3f4b.js`) so each new version has a unique URL — never cached as the old version. CDN serves `app.a3f4b.js` with very long TTL (immutable); after deployment, the HTML references `app.c7d2a.js` (new hash) — a fresh request.

**Q7. How would you design a load balancer health check for a Spring Boot application?**
> Expose Spring Boot Actuator's `/actuator/health` endpoint. Configure it to check database connectivity, cache availability, and any critical dependencies. Return HTTP 200 when healthy, 503 when not. Configure the LB to send GET `/actuator/health` every 10–30s, mark unhealthy after 2–3 failures, mark healthy after 2 successes. Protect the endpoint — restrict access to LB's IP range or use a separate management port.

**Q8. Explain CDN cache invalidation strategies.**
> Options: (1) TTL expiry — wait for TTL to expire (simplest; acceptable for slow-changing content); (2) Versioned URLs — change the URL on update (hash in filename); cache old versions expire naturally; (3) API purge — call CDN's purge API to immediately invalidate specific URLs or patterns (Cloudflare, Fastly, CloudFront all support this); (4) Cache tags/surrogate keys — tag cached objects and purge all objects with a tag (e.g., purge all objects tagged `product:42`).
