---
id: observability
title: Observability & Monitoring
sidebar_label: Observability & Monitoring
description: Comprehensive guide to observability in distributed systems covering the three pillars (metrics, logs, traces), SLOs, alerting strategies, and Spring Boot Actuator + Micrometer setup.
tags: [observability, monitoring, metrics, logging, tracing, slo, sla, prometheus, grafana, jaeger]
---
import DistributedTracingDiagram from '@site/src/components/DistributedTracingDiagram';

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

### Q: What are the three pillars of observability? How do they differ?

**A:** Metrics show aggregate trends, logs capture discrete events, and traces connect request paths across services. Together they answer what is failing, where, and why.

### Q: What are the four golden signals? Why those four?

**A:** Latency, traffic, errors, and saturation. They cover user experience, load, correctness, and capacity pressure, which are the main failure dimensions.

### Q: What is the difference between SLI, SLO, and SLA?

**A:** SLI is a measured reliability metric, SLO is the internal target for that metric, and SLA is the external contractual commitment. Breaching SLA has business/legal consequences.

### Q: What is an error budget and how should it affect engineering decisions?

**A:** Error budget is allowable unreliability under the SLO. When budget burns fast, prioritize reliability work and slow risky feature releases.

### Q: How do you implement distributed tracing in a Spring Boot microservices system?

**A:** Use OpenTelemetry instrumentation, propagate `traceparent` across sync and async calls, and export spans to a tracing backend. Add key span attributes (endpoint, tenant, DB call) for diagnosis.

### Q: What's the difference between liveness and readiness probes in Kubernetes?

**A:** Liveness decides when to restart a stuck container; readiness decides whether it should receive traffic. A pod can be alive but temporarily not ready.

### Q: How do you prevent alert fatigue?

**A:** Alert on actionable symptoms tied to SLO impact, deduplicate noisy signals, and tune thresholds with burn-rate policies. Route ownership clearly and retire stale alerts.

### Q: What should you log? What should you not log?

**A:** Log state transitions, failures, and contextual identifiers needed for triage. Do not log secrets, raw PII, or high-cardinality noise with little diagnostic value.

### Q: What is structured logging and why is it better than plain text logs?

**A:** Structured logs store fields as key-value JSON for reliable querying and correlation. They improve aggregation, filtering, and automated analysis compared to free text parsing.

### Q: How would you debug a latency issue that only affects the p99 of requests?

**A:** Slice by endpoint, tenant, region, and dependency to isolate outliers, then inspect traces for long-tail hops. Typical causes are lock contention, queue buildup, GC pauses, and retries.

---

## OpenTelemetry: The Unified Observability Standard

:::info[Chapter 10 Reference]
Building Microservices Chapter 10 covers the evolution from per-service instrumentation to standardized, vendor-neutral telemetry pipelines — which is exactly what OpenTelemetry addresses.
:::

OpenTelemetry (OTel) is the CNCF project that unifies the three pillars under a single vendor-neutral SDK and protocol (OTLP). It replaces the fragmented landscape of Zipkin clients, Prometheus clients, and Logback appenders with a single instrumentation API.

### OTel Architecture

<DistributedTracingDiagram initialTab="pipeline" />

### OTel Collector Configuration

```yaml
# otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 1s
    send_batch_size: 1024
  memory_limiter:
    limit_mib: 400
  # Tail-based sampling processor
  tail_sampling:
    decision_wait: 10s
    policies:
      - name: error-policy
        type: status_code
        status_code: { status_codes: [ERROR] }
      - name: slow-policy
        type: latency
        latency: { threshold_ms: 500 }
      - name: probabilistic-fallback
        type: probabilistic
        probabilistic: { sampling_percentage: 5 }

exporters:
  jaeger:
    endpoint: jaeger:14250
  prometheus:
    endpoint: "0.0.0.0:8889"
  loki:
    endpoint: http://loki:3100/loki/api/v1/push

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, tail_sampling, batch]
      exporters: [jaeger]
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [prometheus]
    logs:
      receivers: [otlp]
      processors: [batch]
      exporters: [loki]
```

### Auto-Instrumentation vs. Manual Instrumentation

| Approach | Coverage | Control | Overhead |
|---|---|---|---|
| **Auto (Java Agent)** | HTTP, JDBC, Kafka, Redis, gRPC automatically | Low | ~3-5% CPU overhead |
| **Manual Spans** | Business-level operations (checkout, payment) | Full | Requires code changes |
| **Hybrid (recommended)** | Auto for infrastructure, manual for business events | Optimal | Balanced |

```java
// Hybrid instrumentation: auto-instruments HTTP, then add business span
@Service
public class CheckoutService {
    @Autowired private Tracer tracer;

    public CheckoutResult checkout(Cart cart) {
        // Auto-instrumented: HTTP calls to inventory, payment services
        // Manual: wrap the business transaction for end-to-end visibility
        Span checkoutSpan = tracer.spanBuilder("checkout.process")
            .setAttribute("cart.total", cart.getTotal())
            .setAttribute("cart.items", cart.getItemCount())
            .setAttribute("user.tier", cart.getUserTier())
            .startSpan();

        try (Scope scope = checkoutSpan.makeCurrent()) {
            InventoryResult inv = inventoryClient.reserve(cart);   // auto-traced
            PaymentResult pay = paymentClient.charge(cart);        // auto-traced
            return orderRepository.save(new Order(cart, inv, pay)); // auto-traced
        } catch (Exception e) {
            checkoutSpan.setStatus(StatusCode.ERROR, e.getMessage());
            checkoutSpan.recordException(e);
            throw e;
        } finally {
            checkoutSpan.end();
        }
    }
}
```

---

## Tracing Sampling Strategies: Deep Dive

:::info[Chapter 10 Reference]
Building Microservices distinguishes between capturing everything (cost-prohibitive at scale) and sampling intelligently to retain diagnostic signal for failures and outliers.
:::

### Head-Based vs. Tail-Based Sampling

| Strategy | Decision Point | Pros | Cons | Use Case |
|---|---|---|---|---|
| **Head-Based** | At trace start, before any data collected | Low overhead, simple | Blindly samples; misses rare errors | High-volume, low-criticality APIs |
| **Tail-Based** | After the full trace is collected | Captures all errors + slow traces | Requires buffering entire traces | Payment, checkout, critical paths |
| **Adaptive/Dynamic** | Rate-adjusted based on current traffic | Balances cost + signal | More complex to configure | General production workloads |
| **Priority-Based** | Caller sets `sampling.priority` header | Useful for QA/debugging | Can be abused to inflate storage | Debug sessions, specific user traces |

### Tail-Based Sampling Decision Logic

```
Trace completes (all spans collected in collector)
         │
         ├─ Any span has ERROR status?  → ALWAYS KEEP
         │
         ├─ Root span duration > 500ms? → ALWAYS KEEP
         │
         ├─ Trace includes payment/auth service? → KEEP 20%
         │
         └─ Otherwise → KEEP 1%
```

### Head-Based Sampling Configuration

```java
// Spring Boot + OTel: probabilistic head-based
management:
  tracing:
    sampling:
      probability: 0.05  # 5% of all traces

# OR: rate-based (max N traces/sec regardless of traffic)
# Uses token bucket internally
```

### Tail-Based Sampling: Collector-Side

```yaml
# Requires OTel Collector with tail_sampling processor
# Spans from the same trace are buffered in memory for `decision_wait` seconds
processors:
  tail_sampling:
    decision_wait: 30s       # Wait for full trace before deciding
    num_traces: 50000        # Buffer up to 50k concurrent traces
    expected_new_traces_per_sec: 10
    policies:
      - name: keep-errors
        type: status_code
        status_code:
          status_codes: [ERROR]
      - name: keep-slow
        type: latency
        latency:
          threshold_ms: 1000
      - name: keep-specific-routes
        type: string_attribute
        string_attribute:
          key: http.route
          values: ["/api/checkout", "/api/payment"]
      - name: base-rate
        type: probabilistic
        probabilistic:
          sampling_percentage: 2  # Keep 2% of normal traces
```

### Propagation Formats Comparison

| Format | Header | Use Case |
|---|---|---|
| **W3C TraceContext** | `traceparent`, `tracestate` | Modern standard, cross-vendor |
| **B3 Multi-Header** | `X-B3-TraceId`, `X-B3-SpanId`, `X-B3-Sampled` | Zipkin legacy |
| **B3 Single-Header** | `b3` | Compact B3 |
| **Jaeger** | `uber-trace-id` | Jaeger native |

```yaml
# OTel SDK: configure propagators
OTEL_PROPAGATORS=tracecontext,baggage
# For Zipkin-compatible systems:
OTEL_PROPAGATORS=b3multi,tracecontext
```

---

## Log Aggregation Pipeline: Architecture Comparison

:::info[Chapter 10 Reference]
Building Microservices Chapter 10 emphasizes that in a microservices system with dozens of services, centralized log aggregation is not optional — it is a prerequisite for effective diagnosis.
:::

### ELK Stack vs. PLG Stack

| Dimension | ELK (Elasticsearch + Logstash + Kibana) | PLG (Promtail + Loki + Grafana) |
|---|---|---|
| **Storage model** | Full-text index of all log fields | Index only metadata labels; compress raw log text |
| **Cost** | High (indexes every field) | Low (10x cheaper per GB) |
| **Query speed** | Fast full-text search across all fields | Fast label queries; slower full-text (grep-like) |
| **Schema** | Schema-on-write (mapping required) | Schema-on-read (no upfront schema) |
| **Alerting** | Kibana alerts / Elastalert | Grafana AlertManager (integrated with Prometheus) |
| **Best for** | Rich full-text log analysis, security audit | Kubernetes-native, cost-sensitive high-volume logs |

### Loki Label Design (Critical for Performance)

```yaml
# ✅ Good: Low-cardinality labels
{app="order-service", env="prod", region="us-east-1"}

# ❌ Bad: High-cardinality labels (kills Loki performance)
{request_id="abc123", user_id="user-456789"}
# Never put request/user IDs as Loki labels — put them in the log line itself
```

### Log Pipeline: Kubernetes → Loki

```yaml
# Promtail DaemonSet: scrapes all pod logs from /var/log/pods/
# Automatically adds Kubernetes metadata as labels
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: promtail
spec:
  template:
    spec:
      containers:
        - name: promtail
          image: grafana/promtail:latest
          args:
            - -config.file=/etc/promtail/config.yml
          volumeMounts:
            - name: varlog
              mountPath: /var/log
              readOnly: true
```

```yaml
# promtail config.yml
scrape_configs:
  - job_name: kubernetes-pods
    kubernetes_sd_configs:
      - role: pod
    pipeline_stages:
      - docker: {}    # Parse Docker JSON log format
      - json:         # Extract fields from structured log
          expressions:
            level: level
            traceId: traceId
            service: service
      - labels:       # Promote to Loki labels (low-cardinality only)
          level:
          service:
      - timestamp:
          source: timestamp
          format: RFC3339
```

### Correlation Between Pillars

```
User reports slow checkout
    │
    ├─ [Grafana] Metric dashboard: p99 checkout latency spike at 14:23
    │
    ├─ [Loki] Log query: {service="checkout"} |= "ERROR" 
    │          → Found: "PaymentService timeout after 30s"
    │
    └─ [Jaeger] Trace query: traceId=abc123
               → Found: PaymentService span = 30.1s
                         └─ DB query span = 29.8s 
                              └─ Missing index on payment_methods.user_id
```

---

## SLO Burn Rate Alerting: Senior Deep Dive

### Multi-Window Burn Rate

Simple threshold alerts (e.g., "error rate > 1%") suffer from **alert lag** — they fire late and miss short spikes. Multi-window burn rate alerting from the Google SRE Workbook addresses both problems.

**Burn rate** = how fast the error budget is being consumed relative to normal.

```
Error Budget = 1 - SLO target
For 99.9% SLO: error budget = 0.1% = 1440 minutes/day × 0.001 = 1.44 min/day of errors

Burn Rate of 1  = consuming budget at exactly the SLO rate (will exhaust in 30 days)
Burn Rate of 5  = will exhaust budget in 6 days
Burn Rate of 14.4 = will exhaust budget in 2 days (CRITICAL)
Burn Rate of 36 = will exhaust budget in 1 hour (PAGE NOW)
```

### Multi-Window Alert Matrix

| Severity | Short Window | Long Window | Burn Rate | Response |
|---|---|---|---|---|
| **Page (Critical)** | 2% budget in 1h | 5% budget in 5h | ≥ 14.4x | Immediate page |
| **Ticket (High)** | 5% budget in 6h | 10% budget in 3d | ≥ 6x | Next business hour |
| **Warning** | 10% budget in 3d | — | ≥ 3x | Track and monitor |

```yaml
# Prometheus: Multi-window burn rate alert for 99.9% SLO
groups:
- name: slo-checkout
  rules:
  # Fast burn: detect high burn over short window
  - alert: CheckoutSLOFastBurn
    expr: |
      (
        rate(checkout_errors_total[1h]) / rate(checkout_requests_total[1h])
        > 14.4 * 0.001  # 14.4x burn rate × 0.1% error budget
      ) and (
        rate(checkout_errors_total[5h]) / rate(checkout_requests_total[5h])
        > 14.4 * 0.001
      )
    for: 2m
    labels:
      severity: page
      slo: checkout_availability
    annotations:
      summary: "Checkout SLO burning at >14.4x rate — page on-call"
      runbook_url: https://wiki/runbooks/checkout-slo

  # Slow burn: detect consistent moderate burn
  - alert: CheckoutSLOSlowBurn
    expr: |
      (
        rate(checkout_errors_total[6h]) / rate(checkout_requests_total[6h])
        > 6 * 0.001
      ) and (
        rate(checkout_errors_total[3d]) / rate(checkout_requests_total[3d])
        > 6 * 0.001
      )
    for: 1h
    labels:
      severity: ticket
```

### Error Budget Tracking Dashboard

```yaml
# Grafana panel: Error Budget Remaining
expr: |
  1 - (
    sum(rate(http_requests_total{status=~"5.."}[30d]))
    /
    sum(rate(http_requests_total[30d]))
  ) / 0.001  # Normalize by error budget (0.1%)

# Interpretation:
# 1.0 = full budget remaining (no errors this month)
# 0.5 = half budget consumed
# 0.0 = budget exhausted → SLA breach territory
# < 0 = already breached SLA
```

---

## Metric Cardinality: The Silent Killer

High cardinality in metrics is the most common cause of Prometheus OOM crashes and Datadog bill explosions.

### What Is Cardinality?

Every **unique label combination** creates a separate time series.

```
metric_name{label1="val1", label2="val2"} → 1 time series
```

| Label | Cardinality | Impact |
|---|---|---|
| `env` (prod/staging/dev) | 3 values | Acceptable |
| `http_method` (GET/POST/PUT/DELETE) | 4 values | Acceptable |
| `http_status_code` (200/404/500...) | ~15 values | Acceptable |
| `endpoint` (/users/\{id\}/orders) | Thousands of paths | **DANGEROUS** |
| `user_id` | Millions | **CATASTROPHIC** |
| `trace_id` | Unique per request | **CATASTROPHIC** |

### Cardinality Trap: Dynamic Labels

```java
// ❌ BAD: userId creates millions of time series
Counter.builder("api.calls")
    .tag("userId", userId)           // NEVER do this
    .tag("orderId", orderId.toString()) // NEVER do this
    .register(registry);

// ✅ GOOD: low-cardinality labels only
Counter.builder("api.calls")
    .tag("service", "order-service")
    .tag("endpoint", "/api/orders")   // normalized, not parameterized
    .tag("status", "success")
    .register(registry);

// Put high-cardinality data in traces/logs, not metrics
```

### Prometheus Cardinality Limits

```yaml
# prometheus.yml — protect against cardinality explosions
global:
  scrape_interval: 15s

# Limit per scrape target
scrape_configs:
  - job_name: order-service
    metric_relabel_configs:
      # Drop high-cardinality labels before ingestion
      - source_labels: [user_id]
        regex: '.+'
        action: drop

# Global limit
storage:
  tsdb:
    max-block-chunk-seg-size: 536870912   # 512 MB
```

---

## Distributed Tracing: Context Propagation Across Async Boundaries

### HTTP Propagation (Automatic)

Spring Boot 3 + Micrometer Tracing auto-propagates `traceparent` via HTTP headers. Zero configuration needed.

```java
// Outbound HTTP: traceparent header added automatically
@FeignClient(name = "payment-service")
public interface PaymentClient {
    @GetMapping("/charge")
    PaymentResult charge(ChargeRequest req);
    // OTel SDK intercepts, adds: traceparent: 00-traceId-spanId-01
}
```

### Kafka Propagation (Manual)

Kafka does not use HTTP headers, so trace context must be manually injected into Kafka record headers.

```java
// Producer: inject trace context into Kafka headers
@Service
public class OrderEventPublisher {
    @Autowired private KafkaTemplate<String, OrderEvent> kafkaTemplate;
    @Autowired private Tracer tracer;

    public void publish(OrderEvent event) {
        ProducerRecord<String, OrderEvent> record =
            new ProducerRecord<>("order-events", event.getOrderId(), event);

        // Inject current span context into Kafka headers
        tracer.currentSpan().propagateHeaders(
            (key, value) -> record.headers().add(key, value.getBytes())
        );

        kafkaTemplate.send(record);
    }
}

// Consumer: extract trace context from Kafka headers
@KafkaListener(topics = "order-events")
public void onOrderEvent(ConsumerRecord<String, OrderEvent> record) {
    // Restore trace context from Kafka headers
    Context extractedContext = openTelemetry.getPropagators()
        .getTextMapPropagator()
        .extract(Context.current(), record.headers(),
            (headers, key) -> {
                Header h = headers.lastHeader(key);
                return h != null ? new String(h.value()) : null;
            });

    Span span = tracer.spanBuilder("kafka.order-events.consume")
        .setParent(extractedContext)
        .startSpan();
    // ... process event
}
```

### Thread Pool / CompletableFuture Propagation

```java
// ❌ Context is LOST when crossing thread boundaries
CompletableFuture.supplyAsync(() -> paymentClient.charge(req)); // Trace context lost!

// ✅ Wrap executor with OTel context propagation
ExecutorService contextAwareExecutor =
    Context.taskWrapping(Executors.newFixedThreadPool(10));

CompletableFuture.supplyAsync(
    () -> paymentClient.charge(req),
    contextAwareExecutor   // Context propagated automatically
);
```

---

## Advanced Alerting Strategies

### Symptom-Based vs. Cause-Based Alerts

| Type | Example | Problem |
|---|---|---|
| **Cause-based** | "CPU > 80%" | Too many false positives; CPU spikes without user impact |
| **Cause-based** | "JVM GC pause > 500ms" | Not always user-visible |
| **Symptom-based** | "p99 checkout latency > 2s" | Direct user impact |
| **Symptom-based** | "Checkout error rate > 1%" | Direct user impact |

**Rule:** Alert on symptoms. Investigate causes. Symptoms = SLO breach indicators.

### Alerting Anti-Patterns

| Anti-Pattern | Problem | Solution |
|---|---|---|
| **Flapping alerts** | Fire/resolve every 30s | Use `for` clause (must be true for N minutes) |
| **Alert without runbook** | On-call doesn't know what to do | Every alert must link to a runbook |
| **Too many alerts** | Alert fatigue → ignored | Ruthlessly prune non-actionable alerts |
| **Alert on infrastructure not user impact** | CPU alert fires, users unaffected | SLO-driven alerting |
| **Shared inbox** | No clear owner | Route to service team, not shared channel |
| **Wide alert windows** | 15-minute error rates miss 2-minute outages | Multi-window: 1m + 5m + 15m |

### Alert Routing Strategy

```yaml
# Alertmanager routing: route by service ownership
route:
  group_by: ['service', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 3h
  receiver: default

  routes:
  - match:
      service: checkout
    receiver: checkout-team
    routes:
    - match:
        severity: page
      receiver: checkout-oncall   # PagerDuty/OpsGenie

  - match:
      service: payment
    receiver: payments-team

receivers:
- name: checkout-team
  slack_configs:
  - api_url: https://hooks.slack.com/services/...
    channel: '#checkout-alerts'

- name: checkout-oncall
  pagerduty_configs:
  - service_key: <integration-key>
    description: "{{ .CommonAnnotations.summary }}"
```

---

## Profiling: The Fourth Pillar

Profiling captures CPU flame graphs and memory allocation data — complementary to the three pillars.

### Continuous Profiling Tools

| Tool | Type | Language Support | Integration |
|---|---|---|---|
| **Pyroscope** | CPU, memory, goroutines | Java, Go, Python, Node | OTel-native, Grafana |
| **Async Profiler** | CPU, allocation, lock | JVM | JVM agent |
| **Parca** | CPU | Go, any (DWARF) | Kubernetes-native |
| **eBPF-based (Pixie)** | System-level, no instrumentation | Any language | Kubernetes |

### Flame Graph Interpretation

```
main (1000ms total)
├── checkout (600ms, 60%)
│   ├── inventoryClient.reserve (400ms, 40%) ← HOT PATH
│   │   └── HTTP + JSON deserialization (390ms)  ← Bottleneck
│   └── orderRepository.save (200ms, 20%)
└── paymentClient.charge (400ms, 40%)
    └── network wait (380ms) ← Slow external call
```

A wide flat bar = hot path (CPU-bound).  
A deep thin chain = latency bound (waiting, I/O, network).

---

## Observability Anti-Patterns

| Anti-Pattern | Why It Fails | Better Approach |
|---|---|---|
| **Log-only observability** | Unstructured logs are hard to correlate at scale | Add metrics + traces |
| **Metrics without context** | "Error rate 5%" — which service, endpoint, tenant? | Always add service/endpoint labels |
| **100% trace sampling** | Costs explode at 10k RPS | Head-based 5-10% + tail-based for errors |
| **No correlation ID** | Cannot link log → trace → metric for same request | Propagate `traceId` in all three pillars |
| **Alerting on averages** | Average hides long tails | Always alert on p95/p99 |
| **Short retention for traces** | Can't diagnose bugs reported days later | 14-day trace retention minimum |
| **No canary observability** | Deploy new version, no idea if degraded | Always compare canary vs stable metrics |
| **Alert without owner** | Alert fires, nobody acts | Every alert must have `team` label and runbook |

---

## Observability Maturity Model

Building Microservices describes organizations evolving from reactive fire-fighting to proactive SLO-driven reliability engineering.

| Level | Capabilities | Typical Tooling |
|---|---|---|
| **Level 1 – Basic** | Container logs, basic health checks | `kubectl logs`, basic Prometheus |
| **Level 2 – Instrumented** | Structured logs, RED metrics per service, distributed traces | ELK/PLG, Prometheus+Grafana, Jaeger |
| **Level 3 – SLO-Driven** | Defined SLOs per service, error budgets, burn-rate alerts | Sloth/SLO generators, multi-window alerts |
| **Level 4 – Predictive** | Anomaly detection, capacity forecasting, auto-remediation | ML-based alerting, Prometheus + ML |

---

## Spring Boot Observability: Full Production Setup

```java
// Complete observability configuration for a Spring Boot 3 microservice
@Configuration
public class ObservabilityConfig {

    // Customize which endpoints get traced
    @Bean
    public ObservationPredicate excludeActuatorObservations() {
        return (name, context) -> !name.startsWith("spring.security.http.secured");
    }

    // Add custom span attributes to all HTTP server observations
    @Bean
    public ObservationRegistryCustomizer<ObservationRegistry> httpServerObservations() {
        return registry -> registry.observationConfig()
            .observationHandler(new CustomHttpServerObservationHandler());
    }
}

// Custom observation handler: add tenant/correlation to every span
public class CustomHttpServerObservationHandler
        implements ObservationHandler<ServerHttpObservationContext> {

    @Override
    public void onStart(ServerHttpObservationContext context) {
        HttpServletRequest request = context.getCarrier();
        String tenantId = request.getHeader("X-Tenant-ID");
        if (tenantId != null) {
            context.setHighCardinalityKeyValue(
                KeyValue.of("tenant.id", tenantId)
            );
        }
    }

    @Override
    public boolean supportsContext(Observation.Context ctx) {
        return ctx instanceof ServerHttpObservationContext;
    }
}
```

```yaml
# application.yml — full observability setup
management:
  endpoints:
    web:
      exposure:
        include: health, info, metrics, prometheus, loggers
  endpoint:
    health:
      show-details: when_authorized
      probes:
        enabled: true      # /actuator/health/liveness and /readiness
  metrics:
    distribution:
      percentiles-histogram:
        http.server.requests: true   # Enable histogram for p99 calculations
      percentiles:
        http.server.requests: 0.5, 0.95, 0.99
      slo:                           # SLO boundaries in histogram
        http.server.requests: 100ms, 500ms, 1s, 2s
    tags:
      application: ${spring.application.name}
      version: ${APP_VERSION:unknown}
      environment: ${APP_ENV:local}
  tracing:
    sampling:
      probability: 0.1    # 10% head-based
    baggage:
      correlation:
        fields: [tenantId, userId]   # Propagate in MDC for log correlation
  otlp:
    tracing:
      endpoint: http://otel-collector:4318/v1/traces
    metrics:
      endpoint: http://otel-collector:4318/v1/metrics

logging:
  pattern:
    level: "%5p [${spring.application.name},%X{traceId:-},%X{spanId:-}]"
```

---

## Interview Questions

### Q: Explain multi-window burn rate alerting. Why is it better than simple threshold alerts?

**A:** Simple threshold alerts fire based on instantaneous metric values and suffer from either high false positives (tight thresholds) or slow detection (loose thresholds). Multi-window burn rate alerting measures how fast the error budget is being consumed across two time windows simultaneously: a short window detects sudden spikes, and a long window confirms sustained problems. Requiring both windows to exceed the burn rate threshold eliminates noisy alerts from brief transient spikes while ensuring real sustained degradation always pages. For a 99.9% SLO, a burn rate of 14.4x means the full monthly budget will be consumed in 50 hours — worth an immediate page.

### Q: What is label cardinality in Prometheus and why does it matter?

**A:** Each unique combination of label values creates a separate time series in Prometheus. High-cardinality labels like user_id, request_id, or trace_id create millions of time series, causing Prometheus to consume massive amounts of RAM and eventually OOM-crash. Best practice is to restrict metric labels to low-cardinality dimensions (service, env, endpoint pattern, status bucket) and push high-cardinality data to logs and traces instead.

### Q: How do you propagate trace context across Kafka messages?

**A:** Kafka messages use record headers rather than HTTP headers. The producer must inject the current span context into Kafka headers using the OTel text map propagator's inject API. The consumer then extracts the trace context from record headers before starting its span, setting the extracted context as the parent. This creates a continuous trace across the asynchronous boundary, linking the producer span to the consumer span in Jaeger/Tempo.

### Q: What is tail-based sampling and when should you use it over head-based?

**A:** Head-based sampling makes the keep/drop decision at the start of the trace before any data is collected. It is simple and low-overhead but will sample out rare errors statistically. Tail-based sampling buffers all spans until the entire trace completes, then applies rules: always keep error traces, always keep slow traces, and probabilistically keep the rest. It guarantees every error trace is captured. Use tail-based for payment, checkout, and financial flows where missing a single error trace has business cost. Use head-based for high-volume low-criticality paths like health checks.

### Q: How do you correlate logs, metrics, and traces for a single user request?

**A:** The key is a shared trace ID propagated through all three pillars. The OTel SDK puts `traceId` and `spanId` into the MDC (mapped diagnostic context), which structured logging frameworks include in every log line. The same `traceId` tags metric exemplars in Prometheus. In Grafana, you can click a metric spike, jump to the trace via exemplar, and from the trace link to the correlated logs by querying Loki with the trace ID. This requires: structured logging with traceId field, Prometheus exemplars enabled, and Grafana Tempo/Jaeger configured as the trace data source.

### Q: How would you design observability for a multi-tenant SaaS system?

**A:** Add tenant ID as a low-cardinality label to metrics (if tenants number in hundreds, not millions). Propagate tenant ID in the W3C `tracestate` baggage field so every span and log line carries it. Define separate SLOs per enterprise tier: free tier at 99%, business tier at 99.9%, enterprise at 99.99%. Use tenant-aware dashboards that show per-tenant error rates and latency. Alert on SLO burn rate per tenant-tier combination, not just aggregate. For security, ensure tenant data in logs is masked/hashed.

---

## 🔬 Distributed Monitoring Systems: TSDB Internals, Metric Types & Collection Architecture

> **Reference**: [Sujeet Pro — Distributed Monitoring Systems](https://sujeet.pro/articles/distributed-monitoring)

To design or operate observability infrastructure at scale, engineers must understand the physical mechanics of **metric data structures**, **Push vs. Pull collection**, and **Time-Series Database (TSDB) storage engines**.

### 1. Metric Types & The Mathematics of Aggregatable Percentiles

| Metric Type | Wire Representation | Mathematical Semantics | Aggregation Rule Across $N$ Pods |
| :--- | :--- | :--- | :--- |
| **Counter** | Monotonically increasing 64-bit float/int (resets to 0 on restart). | Cumulative events (`http_requests_total`). | Compute per-series rate first (`rate(m[5m])`), then `sum()` across pods. |
| **Gauge** | Point-in-time snapshot value that can go up or down. | Current state (`jvm_memory_used_bytes`, `queue_depth`). | `sum()`, `avg()`, `min()`, or `max()` across pods at timestamp $t$. |
| **Summary (Client-Side Quantiles)** | Pre-calculated φ-quantiles (`p50`, `p99`) computed in app memory over a sliding window. | Exact per-pod latency percentiles. | **❌ mathematically un-mergeable!** You **cannot** average or take the max of `p99` across 50 pods. |
| **Histogram (Le-Bucketed)** | Cumulative counters per upper-bound bucket (`le="0.05"`, `le="0.1"`, `le="0.5"`, `+Inf`). | Frequency distribution across latency buckets. | **✅ Mergeable!** `sum(rate(bucket[5m])) by (le)` merges histograms across 1,000 pods before computing `histogram_quantile()`. |
| **DDSketch / HDRHistogram (Exponential Native Histograms)** | Dynamically allocated buckets with relative error bounds $\alpha$ (e.g., $\pm 1\%$ error across any order of magnitude). | High-precision latency distributions without manual bucket boundary tuning. | **✅ Losslessly Mergeable** in $O(B)$ space; eliminates the classic Prometheus bucket-boundary misconfiguration problem. |

---

### 2. The High-Cardinality Explosion Problem (Under the Hood)

Why does adding a single `.tag("user_id", userId)` crash a 64 GB RAM Prometheus server within minutes?

1. **Inverted Index Series Multiplication**:
   In a TSDB, every unique combination of `metric_name + sorted(label_key=label_value)` is assigned a unique 64-bit **Series ID (`ref_id`)** in the in-memory **Head Block**.
   $$\text{Total Active Series} = |\text{metrics}| \times |\text{methods}| \times |\text{statuses}| \times |\text{pods}| \times |\text{users}|$$
   If `5 endpoints × 4 status codes × 50 pods` ($1,000$ series) is tagged with $500,000$ active `user_id` values, the series count jumps to **$500,000,000$ active time series**.
2. **Head Block RAM Exhaustion**:
   Prometheus maintains an in-memory inverted index (`Postings List`: mapping `label_name="value" -> sorted List<SeriesID>`), a symbol table of all label strings, and an active Gorilla chunk buffer (~2–8 KB per active series in the Head Block). Even **10 million churned series** consumes **30–50 GB of RAM**, triggering fatal Linux OOM kills and multi-minute Write-Ahead Log (WAL) replay loops on restart.

---

### 3. Pull (Prometheus Scraping) vs. Push (StatsD / OTel Collector)

| Dimension | Pull Model (Prometheus) | Push Model (Datadog / StatsD / OTel Push) |
| :--- | :--- | :--- |
| **Discovery & Flow Control** | TSDB discovers targets via K8s Service Discovery (`endpoints`/`pods`) and scrapes `/metrics` on its own schedule. Built-in backpressure (`sample_limit`). | Applications or node agents push UDP/gRPC batches to a central collector/gateway. |
| **Target Health Detection** | Automatic `up == 0` synthetic metric generated the instant a scrape fails. | Requires separate heartbeat tracking and TTL expiration to infer dead hosts. |
| **Short-Lived / Ephemeral Jobs** | **Weak**: Serverless functions (AWS Lambda) or short batch jobs exit before the 15s scrape tick arrives (requires Pushgateway workaround). | **Strong**: Ephemeral tasks flush metrics immediately prior to process termination. |
| **Network Topology** | Requires ingress firewall rules from central Prometheus into every VPC/subnet (mitigated via Agent Mode / remote-write). | Works naturally across NAT boundaries; agents initiate outbound-only HTTPS/gRPC connections. |

---

### 4. Time-Series Storage Engine Internals (Gorilla Compression & LSM Blocks)

Modern TSDBs (**Prometheus, VictoriaMetrics, Grafana Mimir, Thanos, Cortex**) combine Facebook's **Gorilla in-memory compression paper** with **2-hour immutable LSM-style disk blocks** and S3 object storage tiering:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                         TSDB STORAGE ENGINE & GORILLA ENCODING                         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  Incoming Sample (Timestamp: 64-bit int, Value: 64-bit IEEE-754 float = 16 Bytes)      │
│         │                                                                              │
│         ├──► 1. Append to On-Disk Write-Ahead Log (WAL) in 128 MB segments             │
│         │                                                                              │
│         └──► 2. Append to In-Memory Head Block (Active 2-Hour Window)                  │
│                   ├─ Timestamp: Delta-of-Delta Encoding                                │
│                   │    t0=1000, t1=1015 (Δ=15), t2=1030 (Δ=15 ➔ ΔΔ = 0 ➔ single '0' bit)│
│                   └─ Float Value: XOR Encoding against previous value                  │
│                        If unchanged (v2 == v1): single '0' bit                         │
│                        If changed: control bits + stripped leading/trailing XOR zeros  │
│                   ➔ Compresses 16 bytes/point down to ~1.37 bytes/point (12x reduction)│
│                                                                                        │
│  Every 2 Hours: Cut Immutable Block [index + chunks/ + tombstones + meta.json]         │
│         │                                                                              │
│         └──► Upload to S3 (Mimir / Thanos) + Downsample (Raw 15s ➔ 5m ➔ 1h rollups)   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Why 16 Bytes Compresses to `~1.37 Bytes`**:
  - **Timestamps (Delta-of-Delta)**: Scrape intervals are periodic ($t_n - t_{n-1} \approx 15\text{s}$). The second derivative $\Delta\Delta = (t_n - t_{n-1}) - (t_{n-1} - t_{n-2})$ is `0` for 96% of samples, which encodes as a **single `0` bit**. Small jitter fits in 7 to 9 bits.
  - **Values (XOR Floating-Point)**: Consecutive gauge/rate floats share identical sign, exponent, and high-order mantissa bits. `v_n XOR v_{n-1}` produces mostly leading and trailing zeros; storing only the meaningful middle XOR bits reduces 64-bit floats to ~10 bits on average.
- **Long-Term Horizontal Scaling (Mimir / Thanos)**:
  - After 2 hours, the Head Block is flushed as an immutable directory (`chunks/`, inverted `index`, `meta.json`) and uploaded to object storage (S3/GCS).
  - A background **Compactor** merges 2-hour blocks into larger blocks and computes **5-minute and 1-hour downsampled aggregations** (`min`, `max`, `sum`, `count`, `counter_reset`), allowing 1-year dashboard queries to scan 240x fewer data points.

---

## 🧠 Senior/Staff Interview Playbook: How to Ace Observability & Monitoring Interviews

### 1. The Senior Framing Strategy (First 60 Seconds)

When asked to design or troubleshoot an observability stack in a Senior/Staff interview, frame your approach around four pillars:
1. **The Cardinality & Cost Invariant**: Separate **low-cardinality aggregated signals (Metrics)** for cheap, real-time SLO alerting from **high-cardinality contextual events (Logs & Traces)** for forensic root-cause isolation. Never cross the streams by putting `user_id` or `trace_id` into metric labels.
2. **Back-of-the-Envelope Physics**:
   - $10\text{M active series}$ scraped every $15\text{s} \approx 667\text{k samples/sec}$.
   - Using Gorilla compression ($\approx 1.37\text{ bytes/sample}$), raw samples require only $667\text{k} \times 86,400 \times 1.37\text{ B} \approx 79\text{ GB/day}$ on disk—proving that **RAM for the inverted label index**, not disk bandwidth for float samples, is the primary scaling bottleneck.
3. **Failure-Mode Isolation**: Observability pipelines must fail open. If the OTel Collector or Kafka cluster is unreachable, local buffers drop telemetry rather than blocking application request threads or causing OOM crashes.
4. **Actionable Symptom Alerting**: Replace noisy static infrastructure alerts (`CPU > 80%`) with **Google SRE Multi-Window, Multi-Burn-Rate SLO alerts** connected via **Metric Exemplars (`trace_id`)** directly to tail-sampled traces.

### 2. Classic Interviewer Traps & Principal Rebuttals

#### Trap 1: "To compute our global service p99 latency across 50 Kubernetes pods, each pod exports a `p99_latency` metric and we average (or take the max of) those 50 series in Grafana."
* **Junior/Mid Answer:** "Taking `avg(p99_latency)` or `max(p99_latency)` across all pods gives us a good picture of the global 99th percentile latency."
* **Principal Rebuttal:** "Percentiles are **statistically non-aggregatable** (`avg` of percentiles is mathematical nonsense). If 49 idle pods handle 1 request/sec with a `p99` of `10ms`, and 1 hot pod handles 10,000 requests/sec with a `p99` of `2,000ms`, the average of `p99`s reports `~50ms` while 99% of your users experience `2,000ms`! To compute an accurate fleet-wide `p99`, pods must export either **cumulative Histograms (`le` buckets)**—where the query engine sums event counts per bucket across all pods (`sum(rate(http_duration_bucket[5m])) by (le)`) before interpolating—or **mergeable sketches (`DDSketch` / Prometheus Native Exponential Histograms)**."

#### Trap 2: "Product wants to track API error rates and p99 latency per customer (`customer_id` label in Prometheus) across our 2 million B2B users."
* **Junior/Mid Answer:** "We can add `.tag("customer_id", customerId)` to our Micrometer `Timer` and build a Grafana dashboard with a `$customer_id` dropdown variable."
* **Principal Rebuttal:** "Adding a 2-million-cardinality tag to a `Timer` (which creates ~15 histogram bucket series per tag combination) across 20 endpoints and 50 pods will generate $2\text{M} \times 15 \times 20 = 600\text{ Million time series}$, instantly OOM-killing the TSDB inverted index. Instead, we keep Prometheus metrics strictly low-cardinality (tagged at most by `customer_tier` = `free|pro|enterprise`) and satisfy per-customer analytics via two mechanisms:
  1. **Metric Exemplars**: Attach `{trace_id, customer_id}` as an unindexed **Exemplar** on histogram bucket increments so engineers can click a spike and see offending customers.
  2. **Columnar OLAP / Tail-Sampled Traces**: Query per-customer latency and error breakdowns from **ClickHouse** or **OpenTelemetry Traces**, which are engineered for high-cardinality `GROUP BY customer_id` queries."

#### Trap 3: "We set up 1% probabilistic head-based trace sampling at the API Gateway to save money, so we'll catch 1% of all production bugs."
* **Junior/Mid Answer:** "Yes, 1% head-based sampling is industry standard at scale because 100% tracing is too expensive."
* **Principal Rebuttal:** "Pure 1% head-based sampling makes the keep/drop decision on the very first hop *before* the request executes. If a critical payment bug occurs on 0.05% of checkouts, 99% of those rare error traces are discarded at ingress! Production architectures use a **Two-Tier Hybrid Sampling Pipeline**:
  1. Propagate context on 100% of requests internally (or use a generous head rate) to a stateless/stateful **OTel Collector tier** routed by `consistent_hash(trace_id)`.
  2. Apply **Tail-Based Sampling** at the collector (`decision_wait: 15s`): retain **100% of traces containing an `ERROR` span or `duration > p99`**, and probabilistically sample normal `200 OK` fast traces at `0.5%`."

#### Trap 4: "Our on-call engineer gets paged 15 times a week because we alert whenever the 1-minute error rate exceeds 0.1% (our 99.9% SLO threshold)."
* **Junior/Mid Answer:** "Increase the Prometheus `for: 15m` duration so short spikes don't page the engineer."
* **Principal Rebuttal:** "Simply increasing `for: 15m` creates a blind spot: if 100% of requests fail (a total outage), you wait 15 full minutes before paging—consuming 35% of your entire monthly 43.8-minute error budget before anyone wakes up! The correct architecture is **Multi-Window, Multi-Burn-Rate Alerting**:
  - **Page Immediately (`14.4x` burn rate)**: Requires *both* the `1h` window and the `5m` short window to exceed `1.44%` error rate (2% of monthly budget burned in 1 hour). The `5m` window ensures the alert resolves within 5 minutes once fixed.
  - **Ticket Only (`6x` burn rate)**: Requires `6h` and `30m` windows to exceed `0.6%` error rate."

### 3. Quick Reference — Mid-Level vs. Principal Candidate Cheat Sheet

| Concept / Scenario | Mid-Level Candidate Says | Principal Candidate Demonstrates |
| :--- | :--- | :--- |
| **Percentile Aggregation** | "Export `p95` and `p99` client-side summaries and average them in Grafana." | "Client-side quantiles cannot be aggregated across nodes; use **Histogram `le` buckets** or **DDSketch / Native Exponential Histograms**." |
| **High-Cardinality Dimensions** | "Add `user_id` or `endpoint_url` as Prometheus labels." | "Normalize URL templates (`/users/{id}`), enforce gateway label cardinality limits, and use **Exemplars + ClickHouse/Traces** for high-cardinality slicing." |
| **TSDB Storage Mechanics** | "Metrics take up a lot of disk space so we delete them after 7 days." | "Gorilla **delta-of-delta timestamp + XOR float encoding** compresses samples to `1.37 bytes`; scale retention via **2h immutable blocks + S3 Compactor downsampling (`15s -> 5m -> 1h`)**." |
| **Distributed Trace Sampling** | "Sample 5% of traces at the API Gateway." | "Route spans by `hash(trace_id)` to an OTel Collector pool for **Tail-Based Sampling** (100% of errors & tail-latency outliers, 1% baseline)." |
| **Alerting Strategy** | "Page on-call if CPU > 85% or 5m error rate > 0.1%." | "Alert on **SLO Error Budget Burn Rates** using dual short/long windows (`1h + 5m` at `14.4x` burn) to achieve fast detection and zero reset lag." |


