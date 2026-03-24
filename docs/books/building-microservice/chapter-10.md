---
sidebar_position: 11
title: "Chapter 10: From Monitoring to Observability"
---

# Chapter 10: From Monitoring to Observability

**Part II — Implementation**

> With dozens of services, traditional monitoring dashboards aren't enough. This chapter introduces the shift to observability — the ability to ask new questions about your system without deploying new instrumentation.

---

## Monitoring vs. Observability

**Monitoring** = watching predefined metrics and alerting on thresholds.
- "CPU usage > 80% → alert"
- "Error rate > 1% → alert"

**Observability** = the ability to understand the *internal state* of your system from its *external outputs* — even for scenarios you didn't anticipate.

> An observable system lets you ask *any* question about what's happening, not just the ones you predicted when you wrote your dashboards.

In a microservice architecture, monitoring breaks down because:
- A user request may span 10 services
- An error in service E may be caused by service B, discovered in service D
- "Something is slow" requires tracing through multiple hops to find the root cause

Observability solves this.

---

## The Three Pillars of Observability

### 1. Logs
Structured, timestamped records of discrete events. The classic debugging tool.

**Best Practices:**
- Use **structured logging** (JSON) — machine-parseable, filterable
- Include **correlation IDs** in every log line — trace a request across services
- Log at appropriate levels: `DEBUG` (dev), `INFO` (normal ops), `WARN` (unexpected but handled), `ERROR` (requires investigation)

**Spring Boot + Logback (structured JSON):**
```xml
<!-- logback-spring.xml -->
<dependency>
    <groupId>net.logstash.logback</groupId>
    <artifactId>logstash-logback-encoder</artifactId>
</dependency>
```

```java
@Slf4j
@Service
public class OrderService {
    public Order createOrder(CreateOrderRequest request) {
        log.info("Creating order for customer={} items={}", 
            request.getCustomerId(), request.getItems().size());
        // ...
        log.info("Order created orderId={} status={}", order.getId(), order.getStatus());
        return order;
    }
}
```

Output: `{"timestamp":"2024-01-15T10:30:00Z","level":"INFO","message":"Order created","orderId":"ord-123","status":"CONFIRMED","traceId":"abc123"}`

### 2. Metrics

Numerical measurements aggregated over time. CPU, memory, request rates, error rates, latency percentiles.

**Spring Boot Actuator + Micrometer:**
Spring Boot's Micrometer library instruments everything automatically. Add your own metrics with:

```java
@Service
public class OrderService {
    private final Counter orderCreatedCounter;
    private final Timer orderCreationTimer;

    public OrderService(MeterRegistry registry) {
        this.orderCreatedCounter = Counter.builder("orders.created")
            .description("Number of orders created")
            .tag("region", "eu-west")
            .register(registry);
        this.orderCreationTimer = Timer.builder("orders.creation.duration")
            .register(registry);
    }

    public Order createOrder(CreateOrderRequest request) {
        return orderCreationTimer.record(() -> {
            Order order = doCreateOrder(request);
            orderCreatedCounter.increment();
            return order;
        });
    }
}
```

Metrics are then scraped by **Prometheus** and visualized in **Grafana**.

### 3. Distributed Tracing

A trace tracks a single request as it flows through multiple services. Each service adds a **span** — a unit of work with start time, end time, and metadata.

```
Trace ID: abc-123
│
├── Span: API Gateway (0ms - 250ms)
│   ├── Span: Order Service (5ms - 200ms)
│   │   ├── Span: DB Query - findCustomer (10ms - 25ms)
│   │   ├── Span: Inventory Service call (30ms - 120ms)  ← Slow!
│   │   └── Span: DB Insert - saveOrder (130ms - 180ms)
│   └── Span: Notification Service (205ms - 245ms)
```

This immediately shows that the Inventory Service call (90ms) is the bottleneck.

**Spring Boot + Micrometer Tracing (replaces Spring Cloud Sleuth):**
```yaml
# application.yml
management:
  tracing:
    sampling:
      probability: 1.0  # Sample 100% in dev; use 0.1 (10%) in prod
```

Traces are exported to **Zipkin**, **Jaeger**, or **OpenTelemetry Collector**.

```java
// Trace context propagates automatically via HTTP headers (B3 or W3C TraceContext)
// Just call other services normally — Spring adds the trace headers
OrderDto order = orderClient.getOrder(orderId);  // trace header injected automatically
```

---

## Correlation IDs

Every request entering your system gets a unique ID. Every service logs this ID. Every downstream call passes it along.

```java
// Spring Cloud Sleuth / Micrometer Tracing does this automatically
// But you can also set it manually in a filter:
@Component
public class CorrelationIdFilter implements Filter {
    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
        throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) req;
        String correlationId = Optional.ofNullable(request.getHeader("X-Correlation-Id"))
            .orElse(UUID.randomUUID().toString());
        
        MDC.put("correlationId", correlationId);
        ((HttpServletResponse) res).setHeader("X-Correlation-Id", correlationId);
        
        try {
            chain.doFilter(req, res);
        } finally {
            MDC.remove("correlationId");
        }
    }
}
```

---

## Alerting: Semantic vs. Syntactic

**Syntactic alerting** = alert on raw metric values. "CPU > 80%"
**Semantic alerting** = alert on business impact. "Order creation error rate > 0.1%"

Semantic alerts are more meaningful — they directly tell you about user impact. Syntactic alerts cause alert fatigue (CPU can be 80% for perfectly legitimate reasons).

### Alert Design Principles
- Alert on **symptoms** (high error rate) not **causes** (high CPU)
- Every alert should require **human action** — if you can't do anything about it, don't alert
- Target **page-worthy** events only (something waking you up at 3am)
- Use runbooks linked from alerts — "This alert means X, investigate Y, fix with Z"

---

## The ELK Stack / Grafana Stack

### Common Observability Stacks

**Grafana Stack (open-source favorite):**
- **Prometheus** — metrics collection and storage
- **Grafana** — dashboards and visualization
- **Loki** — log aggregation (logs-as-metrics approach)
- **Tempo** — distributed tracing backend

**ELK Stack:**
- **Elasticsearch** — log storage and search
- **Logstash** — log ingestion and transformation
- **Kibana** — log visualization and dashboards

**Cloud-native alternatives:**
- AWS CloudWatch, X-Ray
- Google Cloud Operations Suite
- Datadog, New Relic, Dynatrace (commercial SaaS)

---

## Key Metrics to Track per Microservice

The **RED Method** (for services):
- **R**ate — requests per second
- **E**rrors — error rate (4xx, 5xx)
- **D**uration — latency percentiles (p50, p95, p99)

The **USE Method** (for infrastructure):
- **U**tilization — CPU, memory, disk
- **S**aturation — queue depth, connection pool usage
- **E**rrors — hardware and OS errors

---

## Summary

| Pillar | Tool (Spring ecosystem) | Purpose |
|---|---|---|
| Logs | SLF4J + Logback JSON → Loki/ELK | Discrete events with context |
| Metrics | Micrometer → Prometheus → Grafana | Aggregated numbers over time |
| Traces | Micrometer Tracing → Zipkin/Jaeger | Request flow across services |
| Alerting | Prometheus AlertManager | Page on symptoms, not causes |
| Correlation ID | Spring Micrometer Tracing (auto) | Tie logs/traces across services |
