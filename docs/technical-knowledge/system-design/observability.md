---
id: observability
title: Observability & Monitoring
sidebar_label: Observability & Monitoring
description: Comprehensive guide to observability in distributed systems covering the three pillars (metrics, logs, traces), SLOs, alerting strategies, and Spring Boot Actuator + Micrometer setup.
tags: [observability, monitoring, metrics, logging, tracing, slo, sla, prometheus, grafana, jaeger]
---

# Observability & Monitoring

> "Observability is not about what you know to look for. It's about being able to ask questions you haven't thought of yet."

---

## The Three Pillars

| Pillar | What | Tool Examples |
|---|---|---|
| **Metrics** | Numeric measurements over time | Prometheus, Micrometer, Datadog |
| **Logs** | Timestamped text records of events | ELK Stack, Loki, CloudWatch |
| **Traces** | Request journey across services | Jaeger, Zipkin, AWS X-Ray |

---

## Metrics

### The Four Golden Signals (Google SRE)

| Signal | Description | Example Metric |
|---|---|---|
| **Latency** | Time to serve a request | `http_request_duration_seconds` |
| **Traffic** | Request rate | `http_requests_total` |
| **Errors** | Error rate | `http_errors_total / http_requests_total` |
| **Saturation** | Resource utilization | `jvm_memory_used_bytes / jvm_memory_max_bytes` |

### RED Method (Services)
- **R**ate: Requests per second
- **E**rror rate: % of failed requests
- **D**uration: Latency distribution (p50, p95, p99)

### USE Method (Resources)
- **U**tilization: % of time resource is busy
- **S**aturation: Queue length waiting for resource
- **E**rrors: Count of error events

---

## Spring Boot Observability Setup

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-tracing-bridge-otel</artifactId>
</dependency>
```

```yaml
# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health, info, metrics, prometheus
  endpoint:
    health:
      show-details: always
  metrics:
    tags:
      application: ${spring.application.name}  # Tag all metrics with app name
  tracing:
    sampling:
      probability: 0.1  # 10% sampling in prod
```

### Custom Metrics
```java
@Service
public class OrderService {
    private final Counter orderCounter;
    private final Timer orderTimer;
    private final Gauge pendingOrdersGauge;

    public OrderService(MeterRegistry registry, OrderRepository repo) {
        this.orderCounter = Counter.builder("orders.created")
            .description("Total orders created")
            .tag("region", "us-east")
            .register(registry);

        this.orderTimer = Timer.builder("orders.processing.duration")
            .description("Order processing time")
            .publishPercentiles(0.5, 0.95, 0.99)
            .register(registry);

        // Gauge — reports current value when scraped
        Gauge.builder("orders.pending", repo, r -> r.countByStatus("PENDING"))
            .description("Pending orders in queue")
            .register(registry);
    }

    public Order createOrder(CreateOrderRequest req) {
        return orderTimer.record(() -> {
            Order order = processOrder(req);
            orderCounter.increment();
            return order;
        });
    }
}
```

---

## Logging Best Practices

### Structured Logging (JSON)
```java
// Use SLF4J with Logback → JSON output for ELK/Loki
@Slf4j
@Service
public class PaymentService {
    public void processPayment(Payment payment) {
        log.info("Processing payment",
            kv("paymentId", payment.getId()),
            kv("amount", payment.getAmount()),
            kv("userId", payment.getUserId()),
            kv("status", payment.getStatus()));

        try {
            // ... processing ...
            log.info("Payment processed successfully",
                kv("paymentId", payment.getId()),
                kv("durationMs", timer.elapsed()));
        } catch (Exception e) {
            log.error("Payment processing failed",
                kv("paymentId", payment.getId()),
                kv("error", e.getMessage()),
                e);
        }
    }
}
```

```yaml
# logback-spring.xml — JSON output
<configuration>
  <appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
    <encoder class="net.logstash.logback.encoder.LogstashEncoder"/>
  </appender>
  <root level="INFO">
    <appender-ref ref="JSON"/>
  </root>
</configuration>
```

### Log Levels
| Level | Use For |
|---|---|
| `TRACE` | Very fine-grained, loop iterations |
| `DEBUG` | Debugging information, method entry/exit |
| `INFO` | Business events, startup, key state changes |
| `WARN` | Unexpected but handled situations |
| `ERROR` | Failures requiring attention |

### Correlation IDs
```java
// Add trace/correlation ID to all logs via MDC
@Component
public class CorrelationFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest req, ...) {
        String correlationId = req.getHeader("X-Correlation-ID");
        if (correlationId == null) correlationId = UUID.randomUUID().toString();

        MDC.put("correlationId", correlationId);
        response.setHeader("X-Correlation-ID", correlationId);
        try {
            chain.doFilter(req, response);
        } finally {
            MDC.clear();
        }
    }
}
// All subsequent log statements automatically include correlationId
```

---

## Distributed Tracing

```java
// Spring Boot 3 + Micrometer Tracing (auto-configures)
// Trace context automatically propagated via HTTP headers (W3C TraceContext)

@Service
public class OrderService {
    @Autowired private Tracer tracer;

    public Order processOrder(CreateOrderCommand cmd) {
        Span span = tracer.nextSpan().name("process-order").start();
        try (Tracer.SpanInScope ws = tracer.withSpan(span)) {
            span.tag("orderId", cmd.getOrderId().toString());
            span.tag("userId", cmd.getUserId().toString());

            inventoryClient.reserve(cmd); // Trace context propagated automatically
            paymentClient.charge(cmd);

            return orderRepository.save(new Order(cmd));
        } catch (Exception e) {
            span.error(e);
            throw e;
        } finally {
            span.end();
        }
    }
}
```

### Trace Visualization
```
Request: POST /orders (traceId: abc123)
  └─ OrderService.processOrder (12ms)
       ├─ InventoryService.reserve (3ms) → HTTP GET inventory-service/items/reserve
       ├─ PaymentService.charge (7ms) → HTTP POST payment-service/charges
       └─ DB: INSERT orders (2ms)
```

---

## SLO / SLA / SLI

| Term | Definition | Example |
|---|---|---|
| **SLI** (Indicator) | What you measure | 99th percentile latency = 120ms |
| **SLO** (Objective) | Target for SLI | p99 latency < 200ms, 99.9% of the time |
| **SLA** (Agreement) | Legal contract | If SLO violated → customer credit |
| **Error Budget** | Allowed downtime | 99.9% SLO = 8.76 hours/year downtime allowed |

### Error Budget Policy
```
Monthly error budget: 99.9% = 43.8 minutes downtime

If budget consumed < 50%: Deploy freely, take risks
If budget consumed 50-75%: Review before deploying
If budget consumed > 75%: Freeze non-critical deploys
If budget exhausted: Incident response only
```

---

## Alerting

### Alert Anatomy
```yaml
# Prometheus alerting rule
groups:
- name: api-alerts
  rules:
  - alert: HighErrorRate
    expr: |
      rate(http_requests_total{status=~"5.."}[5m])
      / rate(http_requests_total[5m]) > 0.01
    for: 5m          # Must be true for 5 min before firing
    labels:
      severity: critical
    annotations:
      summary: "Error rate > 1% on {{ $labels.service }}"
      description: "Error rate is {{ $value | humanizePercentage }}"

  - alert: SlowP99
    expr: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 0.5
    for: 10m
    labels:
      severity: warning
```

### Alert Fatigue Prevention
- Only alert on **user impact** (not noise)
- Use **symptom-based** alerts over cause-based
- Every alert should be **actionable**
- Avoid flapping alerts (use `for` clause)
- Escalation policy: warning → critical → page on-call

---

## Health Checks

```java
// Custom health indicator
@Component
public class DatabaseHealthIndicator extends AbstractHealthIndicator {
    @Autowired private DataSource dataSource;

    @Override
    protected void doHealthCheck(Health.Builder builder) {
        try (Connection conn = dataSource.getConnection()) {
            conn.isValid(2); // 2s timeout
            builder.up()
                .withDetail("database", "PostgreSQL")
                .withDetail("connectionPool", getPoolStats());
        } catch (Exception e) {
            builder.down().withException(e);
        }
    }
}
```

```yaml
# Kubernetes liveness/readiness probes
livenessProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /actuator/health/readiness
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5
```

---

## Runbook Template

Every alert should have a runbook:

```markdown
## Alert: HighErrorRate

**Severity**: Critical
**SLO Impact**: Error budget burning at 5x rate

### Diagnosis Steps
1. Check `http_errors_total` by endpoint — which endpoint is failing?
2. Check recent deployments — was there a recent deploy?
3. Check DB connection pool — is the pool exhausted?
4. Check downstream services — is a dependency down?

### Remediation
- If bad deploy: rollback with `kubectl rollout undo deployment/api`
- If DB issue: check `pg_stat_activity` for long-running queries
- If dependency down: enable circuit breaker fallback

### Escalation
- After 15 min unresolved: page backend team lead
```

---

## Interview Questions

1. What are the three pillars of observability? How do they differ?
2. What are the four golden signals? Why those four?
3. What is the difference between SLI, SLO, and SLA?
4. What is an error budget and how should it affect engineering decisions?
5. How do you implement distributed tracing in a Spring Boot microservices system?
6. What's the difference between liveness and readiness probes in Kubernetes?
7. How do you prevent alert fatigue?
8. What should you log? What should you not log?
9. What is structured logging and why is it better than plain text logs?
10. How would you debug a latency issue that only affects the p99 of requests?
