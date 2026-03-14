---
id: load-balancing-reliability
title: Load Balancing & Service Reliability
sidebar_label: Load Balancing & Reliability
description: Load balancing algorithms, health checks, failover strategies, chaos engineering, disaster recovery, and SRE practices for building reliable distributed services.
tags: [load-balancing, reliability, failover, chaos-engineering, disaster-recovery, sre, high-availability]
---

# Load Balancing & Service Reliability

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

```
Internet
    ↓
DNS (Route 53) → TTL-based failover across regions
    ↓
Global Load Balancer (Anycast IP)
    ↓
Regional Load Balancer (L7)
    ↓
Service Instance Pool
    ↓
Internal Load Balancer (service mesh / k8s)
    ↓
Downstream Services
```

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

### Active-Passive (Hot Standby)
```
Primary: handles all traffic
Standby: idle, ready to take over

On primary failure:
  DNS failover (1–5 min TTL) → Standby
  OR
  Heartbeat + VIP (Virtual IP) → Standby claims IP
```

**RPO** (Recovery Point Objective): Time since last replication  
**RTO** (Recovery Time Objective): Time to restore service

### Active-Active
```
Both primaries handle traffic
Traffic split across multiple regions/AZs

On failure of one:
  Load balancer removes from pool
  Remaining primary absorbs load
```

### Multi-Region
```
Region A (us-east) ←→ Region B (eu-west) [bidirectional replication]
        ↑                    ↑
    Users (US)           Users (EU)

On Region A failure:
  DNS → Route all traffic to Region B
  Region B reads are slightly stale (replication lag)
```

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
```
Level 0: Full functionality (green)
Level 1: Personalization disabled, use cached/popular content (yellow)
Level 2: Read-only mode, no writes accepted (orange)
Level 3: Static maintenance page (red)
```

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

### Blue-Green
```
Blue (current v1) ← 100% traffic
Green (new v2) ← Deploy + test with 0% traffic

Switch LB:
Blue (current v1) ← 0% traffic (keep for rollback)
Green (new v2) ← 100% traffic
```

### Canary
```
v1: 95% traffic
v2: 5% traffic (canary)

Watch metrics for 30 min...

If OK: gradually increase v2 to 100%
If bad: route all back to v1 (instant rollback)
```

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

### Rolling Update
```
v1: [pod1, pod2, pod3, pod4]
Update pod1 → v2, health check passes
Update pod2 → v2, health check passes
Update pod3 → v2, health check passes
Update pod4 → v2
Done: [pod1v2, pod2v2, pod3v2, pod4v2]
```

---

## Interview Questions

1. What load balancing algorithm would you use for WebSocket connections? Why?
2. What is the difference between L4 and L7 load balancing?
3. What is the difference between liveness and readiness probes in Kubernetes?
4. What is blue-green deployment and how does it enable zero-downtime releases?
5. What is canary deployment? How do you decide when to proceed vs rollback?
6. What is chaos engineering and why is it important?
7. What is RPO and RTO? How do you design a system to meet given targets?
8. How do you implement graceful degradation in a microservices system?
9. What is the difference between active-passive and active-active failover?
10. How do you design a multi-region system that remains consistent during a regional outage?
