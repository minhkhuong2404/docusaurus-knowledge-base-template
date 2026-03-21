---
id: component-performance-testing
title: Component Performance Testing
sidebar_label: Component Performance Testing
---

# Component Performance Testing

## What is Component Performance Testing?

**Component performance testing** measures the behaviour and resource consumption of a **single service or component** under controlled load conditions — in isolation from the full system. It identifies performance bottlenecks, resource limits, and regression in latency or throughput before a release.

Unlike full system load tests, component tests are faster to run and easier to diagnose because there is no noise from other services.

---

## Goals

- Establish a **performance baseline** for each service
- Detect **performance regressions** introduced by code changes
- Validate that the service meets **NFR targets** (latency, throughput, resource consumption)
- Identify the **breaking point** (maximum RPS before errors occur)
- Find **memory leaks**, **thread pool exhaustion**, and **connection pool saturation**

---

## Performance Test Types

| Type | What It Measures |
|---|---|
| **Baseline / Benchmark** | Establishes normal performance under typical load |
| **Load Test** | Validates performance at expected production load |
| **Stress Test** | Finds the service's breaking point (keeps increasing load) |
| **Spike Test** | Validates behaviour under sudden traffic spikes |
| **Soak / Endurance Test** | Detects memory leaks and degradation over extended time (hours) |
| **Capacity Test** | Determines the maximum throughput before SLA breach |

---

## NFR Targets (Example)

Define measurable targets before writing tests:

| Metric | Target | Breach Threshold |
|---|---|---|
| p50 latency | < 50ms | > 100ms |
| p95 latency | < 200ms | > 400ms |
| p99 latency | < 500ms | > 1000ms |
| Throughput | ≥ 1000 RPS sustained | < 800 RPS |
| Error rate | < 0.1% | > 0.5% |
| JVM heap (steady state) | < 512MB | > 800MB |
| CPU (steady state) | < 60% | > 85% |

---

## Tools

| Tool | Language | Best For |
|---|---|---|
| **Gatling** | Scala DSL | Java/Scala teams, CI integration, detailed reports |
| **k6** | JavaScript | Developer-friendly, easy scripting |
| **Apache JMeter** | GUI + XML | GUI-based test design, enterprise use |
| **Wrk / Wrk2** | CLI | Quick latency benchmarks |
| **Locust** | Python | Distributed load testing |

---

## Gatling Performance Test (Java/Spring Ecosystem)

Gatling is the most idiomatic choice for Spring Boot teams — it integrates into Maven cleanly.

### Maven Setup

```xml
<plugin>
    <groupId>io.gatling</groupId>
    <artifactId>gatling-maven-plugin</artifactId>
    <version>4.9.0</version>
    <configuration>
        <simulationClass>
            com.yourorg.perf.TransactionServiceSimulation
        </simulationClass>
    </configuration>
</plugin>
```

### Gatling Simulation

```scala
package com.yourorg.perf

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._

class TransactionServiceSimulation extends Simulation {

  val baseUrl = System.getProperty("perf.baseUrl", "http://localhost:8080")
  val token   = System.getProperty("perf.token",   "test-jwt-token")

  val httpProtocol = http
    .baseUrl(baseUrl)
    .header("Authorization", s"Bearer $token")
    .header("Content-Type", "application/json")
    .acceptHeader("application/json")

  // Scenario: List transactions
  val listTransactions = scenario("List Transactions")
    .exec(
      http("GET /api/v1/transactions")
        .get("/api/v1/transactions")
        .queryParam("fromDate", "2024-01-01")
        .queryParam("toDate",   "2024-01-31")
        .check(status.is(200))
        .check(responseTimeInMillis.lte(500))
        .check(jsonPath("$.content").exists)
    )

  // Scenario: Create transaction
  val createTransaction = scenario("Create Transaction")
    .exec(
      http("POST /api/v1/transactions")
        .post("/api/v1/transactions")
        .body(StringBody(
          """{"amount": 99.99, "currency": "USD", "description": "perf-test"}"""
        ))
        .check(status.is(201))
        .check(responseTimeInMillis.lte(300))
    )

  // Load profile: ramp to 1000 RPS over 2 minutes, hold for 5 minutes
  setUp(
    listTransactions.inject(
      rampUsersPerSec(10).to(800).during(2.minutes),
      constantUsersPerSec(800).during(5.minutes)
    ),
    createTransaction.inject(
      rampUsersPerSec(5).to(200).during(2.minutes),
      constantUsersPerSec(200).during(5.minutes)
    )
  ).protocols(httpProtocol)
    .assertions(
      global.responseTime.percentile(99).lte(500),     // p99 < 500ms
      global.responseTime.percentile(95).lte(200),     // p95 < 200ms
      global.successfulRequests.percent.gte(99.9)      // Error rate < 0.1%
    )
}
```

---

## Analysing Results

### Key JVM Metrics to Monitor During Tests

Use Spring Boot Actuator + Prometheus + Grafana:

```java
// Add to application.yml for performance profiling
management:
  metrics:
    distribution:
      percentiles-histogram:
        http.server.requests: true
      percentiles:
        http.server.requests: 0.5, 0.75, 0.95, 0.99
  endpoints:
    web:
      exposure:
        include: health,metrics,prometheus
```

### HikariCP Metrics (Watch During Tests)

```
hikaricp.connections.active      → should not stay at max
hikaricp.connections.pending     → should be 0 or near 0  
hikaricp.connections.timeout     → should always be 0
hikaricp.connections.acquire     → p99 should be < 10ms
```

### JVM Heap Analysis

```
jvm.memory.used{area="heap"}     → watch for linear growth (memory leak)
jvm.gc.pause                     → frequent long GCs indicate heap pressure
jvm.threads.live                 → should be stable, not growing
```

---

## Performance Regression Gate in CI

Block a release if performance regresses beyond thresholds:

```yaml
# .github/workflows/perf.yml
- name: Run performance tests
  run: |
    mvn gatling:test \
      -Dperf.baseUrl=${{ env.SIT_URL }} \
      -Dperf.token=${{ secrets.PERF_TOKEN }}

- name: Fail on performance regression
  if: failure()
  run: |
    echo "❌ Performance regression detected — release blocked"
    exit 1
```

---

## Exit Criteria

- [ ] Baseline established and documented
- [ ] All NFR targets met (p95, p99, throughput, error rate)
- [ ] No memory leak detected in 30-minute soak test
- [ ] JVM heap, CPU, and thread counts are stable under load
- [ ] Results attached to [Test Summary Report](../reports/test-summary-report)

---

:::tip Tip: Warm Up Before Measuring
Always include a warm-up ramp in Gatling simulations. JVM JIT compilation means the first few minutes of a test will show higher latency. Discard warm-up results from your assertions.
:::
