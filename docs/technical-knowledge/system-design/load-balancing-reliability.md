---
id: load-balancing-reliability
title: Load Balancing & Service Reliability
sidebar_label: Load Balancing & Reliability
description: Load balancing algorithms, health checks, failover strategies, chaos engineering, disaster recovery, and SRE practices for building reliable distributed services.
tags: [load-balancing, reliability, failover, chaos-engineering, disaster-recovery, sre, high-availability]
---
import LoadBalancerArchitectureDiagram from '@site/src/components/LoadBalancerArchitectureDiagram';
import FailoverStrategiesDiagram from '@site/src/components/FailoverStrategiesDiagram';
import MultiRegionDiagram from '@site/src/components/MultiRegionDiagram';
import DegradationLevelsDiagram from '@site/src/components/DegradationLevelsDiagram';
import DeploymentStrategiesDiagram from '@site/src/components/DeploymentStrategiesDiagram';
import AnycastRoutingDiagram from '@site/src/components/AnycastRoutingDiagram';
import SessionPersistenceDiagram from '@site/src/components/SessionPersistenceDiagram';
import GSLBDiagram from '@site/src/components/GSLBDiagram';

# Load Balancing & Service Reliability

:::tip[Comparative Architecture]
To understand how a Load Balancer differs from a Reverse Proxy and an API Gateway, and how they coexist in a production network path, see the [Reverse Proxy vs. Load Balancer vs. API Gateway Guide](./reverse-proxy-load-balancer-api-gateway.md).
:::

---

## Load Balancing Algorithms

| Algorithm | How | Best For |
|---|---|---|
| **Round Robin** | Rotate through servers in order | Equal capacity servers, stateless |
| **Weighted Round Robin** | More requests to higher-weight servers | Mixed capacity servers |
| **Least Connections** | Route to server with fewest active connections | Variable request durations |
| **IP Hash** | Hash client IP → same server | Session affinity, WebSocket |
| **Random** | Random server selection | Simple, low overhead |
| **Resource-based** | Route based on CPU/memory | CPU-intensive workloads |

### L4 vs L7 Load Balancing

| | L4 (Transport) | L7 (Application) |
|---|---|---|
| Works at | TCP/UDP level | HTTP/HTTPS level |
| Content awareness | No (binary stream) | Yes (URL, headers, cookies) |
| TLS termination | No | Yes |
| Routing by | IP:port | URL path, headers, cookies |
| Performance | Higher | Slightly lower (parses headers) |
| Examples | AWS NLB, HAProxy (L4 mode) | AWS ALB, nginx, Envoy |

---

## Load Balancer Architecture

<LoadBalancerArchitectureDiagram />

---

## Health Checks

### Types
| Type | Description | Use |
|---|---|---|
| **Passive** | Track errors/timeouts on live traffic | Real traffic quality signal |
| **Active** | Periodic synthetic request to health endpoint | Proactive failure detection |
| **Hybrid** | Both passive + active | Best coverage |

```
# nginx health check config
upstream backend {
    server app1:8080;
    server app2:8080;

    check interval=3000 rise=2 fall=3 timeout=1000 type=http;
    check_http_send "GET /actuator/health HTTP/1.0\r\n\r\n";
    check_http_expect_alive http_2xx;
}
```

### Kubernetes Probes
```yaml
livenessProbe:       # Is the container alive? Restart if fails.
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
  failureThreshold: 3

readinessProbe:      # Is the container ready to serve traffic? Remove from LB if fails.
  httpGet:
    path: /actuator/health/readiness
    port: 8080
  periodSeconds: 5
  failureThreshold: 2

startupProbe:        # Is the app done starting? Don't liveness-kill a slow start.
  httpGet:
    path: /actuator/health
    port: 8080
  failureThreshold: 30
  periodSeconds: 10
```

---

## Failover Strategies

<FailoverStrategiesDiagram />

<MultiRegionDiagram />

---

## Graceful Degradation

Design systems to provide reduced functionality rather than complete failure.

```java
@CircuitBreaker(name = "recommendations", fallbackMethod = "defaultRecommendations")
public List<Product> getRecommendations(Long userId) {
    return recommendationService.getPersonalized(userId);
}

// Fallback: show popular items instead of personalized
public List<Product> defaultRecommendations(Long userId, Exception ex) {
    log.warn("Recommendation service unavailable, using popular items fallback");
    return productService.getMostPopular(10);
}
```

### Degradation Levels

<DegradationLevelsDiagram />

---

## Chaos Engineering

> Deliberately inject failures to find weaknesses before users do.

### Principles
1. Define steady state (normal behavior)
2. Hypothesize what will happen during failure
3. Introduce failure in controlled way
4. Compare actual vs expected

### Common Chaos Experiments
| Experiment | What to Test |
|---|---|
| Kill random pod | Service resilience, restart behavior |
| Introduce network latency | Timeout handling, circuit breakers |
| Drop packets | Retry logic, idempotency |
| Exhaust connection pool | Backpressure, error handling |
| Spike CPU to 90% | Autoscaling, latency under load |
| Kill a DB replica | Failover, replication handling |

### Chaos Monkey (Spring Boot)
```java
// Chaos Monkey for Spring Boot (Netflix Chaos Monkey style)
@ChaosMonkey(
    assaults = {LatencyAssault.class},
    watcher = {ServiceWatcher.class}
)
@Service
public class OrderService { ... }
```

---

## Disaster Recovery

### RTO & RPO Targets
| Tier | RTO | RPO | Strategy |
|---|---|---|---|
| Tier 1 (Critical) | < 1 hour | ~0 (zero data loss) | Active-active, synchronous replication |
| Tier 2 (Important) | < 4 hours | < 1 hour | Active-passive, async replication |
| Tier 3 (Standard) | < 24 hours | < 24 hours | Backup + restore |
| Tier 4 (Low) | < 72 hours | < 72 hours | Periodic backup |

### DR Runbook Checklist
- [ ] Identify failed component(s)
- [ ] Assess data loss window (check last replication timestamp)
- [ ] Activate DR environment
- [ ] Point DNS to DR
- [ ] Verify functionality with smoke tests
- [ ] Notify stakeholders
- [ ] Document incident timeline
- [ ] Post-mortem within 48 hours

---

## Zero-Downtime Deployments

<DeploymentStrategiesDiagram />

```yaml
# Kubernetes canary with Argo Rollouts
apiVersion: argoproj.io/v1alpha1
kind: Rollout
spec:
  strategy:
    canary:
      steps:
      - setWeight: 5    # 5% to canary
      - pause: {duration: 10m}
      - setWeight: 25
      - pause: {duration: 10m}
      - setWeight: 100
```

---


## Anycast

CDNs use **anycast** to route users to the nearest PoP automatically.

<AnycastRoutingDiagram />

Used by: Cloudflare, Google (8.8.8.8), root DNS servers.

---


## Session Persistence (Sticky Sessions)

When application state is stored in-server memory, all requests from a user must go to the same server.

<SessionPersistenceDiagram />

:::tip[Best Practice]
Avoid sticky sessions when possible. Store session data in a distributed cache (Redis) so any server can handle any request — true horizontal scaling.
:::

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

<GSLBDiagram />

---


## Interview Questions

### Q: What load balancing algorithm would you use for WebSocket connections? Why?

**A:** Use least-connections (or weighted least-connections) because WebSockets are long-lived and uneven. It balances concurrent connection load better than round-robin.

### Q: What is the difference between L4 and L7 load balancing?

**A:** L4 routes by IP/port and is fast/protocol-agnostic; L7 routes by HTTP attributes like path, host, or headers. L7 enables smarter routing and policy but adds more processing overhead.

### Q: What is the difference between liveness and readiness probes in Kubernetes?

**A:** Liveness checks if container should be restarted; readiness checks if it can serve traffic now. Readiness protects rollout and dependency warm-up phases.

### Q: What is blue-green deployment and how does it enable zero-downtime releases?

**A:** Run old and new stacks in parallel, then switch traffic atomically to the new stack. Rollback is fast by flipping traffic back to the old environment.

### Q: What is canary deployment? How do you decide when to proceed vs rollback?

**A:** Canary sends a small traffic slice to new version first and expands gradually. Advance only if error/latency/business KPIs stay within guardrails; otherwise auto-rollback.

### Q: What is chaos engineering and why is it important?

**A:** Chaos engineering injects controlled faults to validate resilience assumptions in production-like conditions. It exposes hidden coupling before real incidents do.

### Q: What is RPO and RTO? How do you design a system to meet given targets?

**A:** RPO is acceptable data loss window; RTO is acceptable recovery time. Meet targets with replication frequency, backup strategy, failover automation, and regular disaster drills.

### Q: How do you implement graceful degradation in a microservices system?

**A:** Prioritize core paths and shed optional features during overload/failure. Use timeouts, fallbacks, cached defaults, and feature flags to keep essential functionality alive.

### Q: What is the difference between active-passive and active-active failover?

**A:** Active-passive keeps standby idle until failover, simplifying consistency but increasing failover delay. Active-active serves traffic in multiple sites continuously, improving availability but complicating conflict handling.

### Q: How do you design a multi-region system that remains consistent during a regional outage?

**A:** Classify data by consistency need: strongly consistent writes via quorum/primary strategy, and eventually consistent data via async replication. Automate failover with clear write-routing and reconciliation plans.


### CDN & Network Level Load Balancing Questions


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