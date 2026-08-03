---
id: devops-observability
title: Observability Stack
sidebar_label: Observability
description: The Three Pillars of Observability in Kubernetes — Metrics (Prometheus), Logs (Fluentd/Elasticsearch), and Traces (OpenTelemetry).
tags: [kubernetes, observability, prometheus, opentelemetry, fluentd, intermediate]
---

import DevOpsObservabilityIacDiagram from '@site/src/components/DevOpsObservabilityIacDiagram';

# The Observability Stack

In a monolithic architecture, a single error log provides a complete stack trace of a failure. In a microservices architecture running on Kubernetes, an HTTP request might traverse an Ingress, an API Gateway, an Auth microservice, a Billing microservice, and a PostgreSQL database. 

If this request fails or is slow, answering *"Why?"* requires robust **Observability**. Observability is defined by three pillars: **Metrics**, **Logs**, **Traces**.

<DevOpsObservabilityIacDiagram />

---

## 1. Metrics (Prometheus & Grafana)

Metrics are numerical representations of data measured over intervals of time. They are lightweight, highly compressible, and perfect for triggering alerts or viewing long-term trends.

* **Examples:** `http_requests_total`, `cpu_usage_seconds`, `database_connection_pool_active`.
* **Standard Stack:** Prometheus (storage and scraping) + Grafana (visualization).

### Prometheus Architecture
Prometheus uses a **pull-based** model. Instead of applications pushing metrics to a database, Prometheus reaches out to application endpoints (e.g. `/actuator/prometheus`, `/metrics`) and scrapes time-series data periodically over HTTP.

**Key Advantages:**
1. Applications don't need to know where Prometheus is—they just expose an HTTP port. If Prometheus goes down, the application isn't impacted.
2. The network isn't flooded with push requests; scaling Prometheus scraping is highly predictable.

### Metric Types
1. **Counter:** A value that only goes up (e.g., total HTTP requests). Reset on restart.
2. **Gauge:** A value that goes up and down (e.g., active memory, current thread count).
3. **Histogram:** Groups observations into buckets to calculate percentiles (e.g., p95 response time).

---

## 2. Logs (EFK / PLG Stack)

Logs are immutable, timestamped records of discrete events. Crucial for pinpointing the exact error line that caused an exception.

K8s containers output logs to `stdout` and `stderr`. The kubelet stores these locally on the node in `/var/log/containers/*.log`. Since pods are ephemeral, **logs must be shipped off the node** to centralized storage immediately.

### The Stack

**Collection (The shippers):**
* **Fluentd / Fluent Bit:** The industry standard. Deployed as a `DaemonSet` perfectly ensuring exactly one replica runs on every node. It mounts the node's `/var/log` directory, enriches logs with Kubernetes metadata (namespace, pod name, labels), and forwards them.
* **Promtail:** Similar to Fluent Bit, heavily optimized for Loki.

**Storage & Visualization:**
* **EFK:** Elasticsearch (Storage/Search) + Fluentd (Collector) + Kibana (UI). Powerful, but heavy.
* **PLG:** Promtail (Collector) + Loki (Storage) + Grafana (UI). Loki inherently scales better and is much cheaper because it *only indexes labels*, dropping the log payload straight into S3/GCS.

---

## 3. Distributed Tracing (OpenTelemetry)

While logs tell you *what* broke, and metrics tell you *how often* it breaks, Distributed Traces tell you *where in the microservice chain* the slowdown occurred.

A Trace represents the end-to-end journey of a single request. A Trace is made up of multiple **Spans** (individual units of work, like a DB query or an HTTP call downstream).

### OpenTelemetry (OTel)

[OpenTelemetry](https://opentelemetry.io/) is the CNCF standard for generating and collecting telemetry data. It has replaced vendor-specific instrumentation agents.

1. **Instrumentation:** Java apps include the OTel Java Agent (`-javaagent:opentelemetry-javaagent.jar`). It intercepts HTTP clients and JDBC drivers automatically, generating Spans without developer code changes.
2. **Context Propagation:** The agent injects a `traceparent` HTTP Header into outbound requests.
   ```
   # Header automatically added to downstream REST calls
   traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
                     └────── TRACE ID ────────────┘ └── SPAN ID ──┘
   ```
3. **The Receiver:** The downstream service's OTel agent reads that header and attaches its own Spans to the same Trace ID.
4. **The Collector:** Both apps export their spans via OTLP (OpenTelemetry Protocol) over gRPC to an **OTel Collector** running in the cluster.
5. **The Backend:** The Collector batches, filters, and exports the traces to a backend like Jaeger, Zipkin, Tempo, or Datadog for visualization.

---

## The Golden Signals

When building observability dashboards for a cluster, always measure the **Four Golden Signals** (coined by Google SRE):

| Signal | Description | Example Metric |
|---|---|---|
| **Latency** | The time it takes to service a request. | HTTP 95th percentile response time. |
| **Traffic** | The demand placed on your system. | HTTP requests per second (RPS). |
| **Errors** | Rate of requests that fail. | 5xx HTTP response codes relative to total. |
| **Saturation** | How "full" your service is. | CPU limits, connection pool utilization, disk I/O. |

---

## Interview Questions

### Q: How do metrics, logs, and traces complement each other during incidents?
**A:** Metrics detect and scope, traces localize path-level latency, and logs provide root-cause evidence.

### Q: What is a common anti-pattern in observability programs?
**A:** Collecting high-volume telemetry without clear SLO-aligned questions and alert strategy.

### Q: How do you reduce alert fatigue while preserving reliability?
**A:** Alert on symptom-based SLO burn and critical dependency failures, not every infrastructure fluctuation.

### Q: Why is trace context propagation mandatory in microservices?
**A:** Without it, cross-service causality is lost and latency debugging becomes guesswork.

### Q: What sampling strategy would you use in production tracing?
**A:** Low baseline sampling with dynamic upsampling on errors and high-latency paths.

### Q: Which golden signals should be dashboarded per service by default?
**A:** Request rate, error rate, latency percentiles, and saturation indicators tied to service capacity.
