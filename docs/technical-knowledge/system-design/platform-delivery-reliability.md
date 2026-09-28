---
id: platform-delivery-reliability
title: "Platform Delivery, Edge Caching & Modern CI/CD Reliability"
sidebar_label: 🚀 Delivery & Reliability
description: Deep dive into modern web delivery and platform reliability — Edge Anycast routing, surrogate-key cache invalidation, automated Canary gates, SSG to SSR/ISR migration, atomic versioned S3/CloudFront deployments, CI/CD build pipelines, zero-downtime data migrations, SLO error budget burn rates, and OpenTelemetry observability fundamentals.
tags: [platform-engineering, edge-caching, cdn, canary, ci-cd, slo, error-budget, ssg, ssr, opentelemetry, devops]
---

import PlatformDeliveryDiagram from '@site/src/components/PlatformDeliveryDiagram';

# Platform Delivery, Edge Caching & Modern CI/CD Reliability

---

High availability is not achieved solely inside application code; it is determined by the platform delivery pipeline: edge caching, progressive traffic shifting, automated canary rollback gates, and error budget governance.

This guide explores the eight core engineering practices that ensure fast, reliable software delivery from edge points of presence (PoPs) to core databases.

<PlatformDeliveryDiagram />

---

## 1. Edge Delivery & Cache Invalidation

Modern web platforms serve over 90% of requests from Content Delivery Network (CDN) edge nodes deployed across hundreds of global Anycast Points of Presence (PoPs).

### The Invalidation Dilemma: URL Purging vs Surrogate Keys
Historically, CDNs cached files strictly by URL path (e.g. `/api/v1/products/4819`).
- **The Problem**: A product change (e.g. Nike Air Max price update) affects dozens of pages: the product page, the category page (`/shoes/running`), the search result index, the brand page, and the homepage deal carousel.
- Issuing individual URL purges is slow, fragile, and misses dynamic query strings.

### The Solution: Surrogate-Keys (Cache-Tags)
Modern CDNs (Fastly, Cloudflare, Akamai, CloudFront) support **Surrogate-Keys**:
```http
HTTP/1.1 200 OK
Content-Type: text/html
Cache-Control: public, max-age=86400, stale-while-revalidate=60
Surrogate-Key: product-4819 category-shoes brand-nike
```
When product `4819` price changes in the CMS, the backend issues an API purge request targeting exactly one tag:
```bash
POST /service/purge-key
Key: product-4819
```
Every cached document worldwide tagged with `product-4819` is purged simultaneously in **under 150 milliseconds**, while unrelated products remain cached.

---

## 2. SSG on AWS: Atomic Deploys, Edge Functions & Pre-Compression

Serving Static Site Generated (SSG) applications on AWS S3 and CloudFront only looks simple until you roll back at 2:00 AM and users receive broken CSS/JS assets.

### Atomic Versioned Deployments:
Never upload files directly over existing S3 keys (e.g. `s3://bucket/index.html` and `s3://bucket/main.js`). If a user requests `index.html` mid-deploy and then requests the old `main.js`, they encounter HTTP 404s.

**The Atomic Pattern**:
1. Upload every build into an immutable, versioned prefix:
   ```
   s3://bucket/releases/2026-05-01-v1482/
   ```
2. Assets (JS, CSS, images) receive content-hashed filenames and immutable cache headers:
   ```http
   Cache-Control: public, max-age=31536000, immutable
   ```
3. Update the root `index.html` or CloudFront Origin Path pointer **atomically**. Rollbacks are instant: simply point the origin back to the previous release directory without re-uploading files.

### Edge Functions: CloudFront Functions vs Lambda@Edge
- **CloudFront Functions**: Executes in lightweight V8 isolates in **sub-millisecond latency** directly at all 400+ PoPs. Best for URL rewrites, normalized query strings, and basic auth headers ($0.10 per million requests).
- **Lambda@Edge**: Runs full Node.js/Python runtimes at regional edge caches with network and file access. Best for server-side personalization, edge SSR, and third-party API calls.

### Pre-Compression with Brotli:
Compress assets with **Brotli level 11** at build time rather than relying on on-the-fly CDN compression (which uses low Brotli level 4 or Gzip to save CPU). Store pre-compressed `.br` files in S3 and serve them based on the client's `Accept-Encoding: br` header, saving 25% bandwidth.

---

## 3. Progressive Delivery: Blue-Green & Canary Rollouts

Deploying software directly to 100% of production servers creates unacceptable operational risk. Progressive delivery mitigates this through automated traffic shifting.

```
                    CANARY ANALYSIS WORKFLOW
                                │
        ┌───────────────────────┴───────────────────────┐
        ▼                                               ▼
BASELINE FLEET (95% Traffic)                    CANARY FLEET (5% Traffic)
• Running current stable version (v1.4)         • Running new release candidate (v1.5)
• Telemetry: 0.02% error rate, 45ms P99         • Telemetry: Automated Mann-Whitney U test
        │                                               │
        └───────────────────────┬───────────────────────┘
                                ▼
              [ Kayenta / Argo Rollout Evaluation ]
              • Error rate spike > 0.05%?
              • P99 latency degraded by > 20%?
                                │
              ┌─────────────────┴─────────────────┐
              ▼                                   ▼
         [ PASS ]                             [ FAIL ]
    Promote to 25% ➔ 100%               Immediate Envoy drain & rollback!
```

### Statistical Canary Analysis (Kayenta / Argo Rollouts):
Rather than relying on human gut feeling during a release, automated canary tools compare telemetry between the **Canary** and a freshly deployed **Baseline** running the same code version:
- **Mann-Whitney U Test**: Statistical non-parametric test determines whether observed latency differences represent genuine degradation or random network variance.
- **Automated Rollback Gates**: If the canary breaches error rate or latency thresholds, routing proxies (Envoy/NGINX) immediately drain canary traffic back to the primary fleet with zero human intervention.

---

## 4. Build Pipelines & Modern CI/CD Architecture

Continuous Integration and Delivery is not simply a Jenkins server or GitHub Actions script; it is an **immutable artifact promotion engine**.

### Hermetic Builds & Distributed Caching:
In large monorepos (Turborepo, Bazel, Nx), running full test suites and builds on every commit takes hours.
- **Hermetic Build Execution**: Every build step runs in an isolated sandbox with strictly declared inputs and outputs.
- **Cryptographic Hash Caching**: Computes a SHA-256 hash of all input source files, dependencies, and environment variables. If the hash matches a previously compiled artifact in the remote S3/GCS cache, the step finishes in **100ms** by downloading the pre-compiled binary.

### Strict Promotion Stages:
```
Commit ──► Lint/Typecheck ──► Unit Tests ──► Hermetic Container Build ──► Integration Tests (Testcontainers) ──► Staging Canary ──► Production
```
- **Build Once, Deploy Everywhere**: The exact Docker image digest (`sha256:7f89b...`) tested in staging must be the exact image promoted to production. Never recompile code between environments.

---

## 5. Web Rendering Evolution: SSG vs SSR vs ISR

Choosing the correct rendering architecture determines Time to First Byte (TTFB), CDN cache hit ratio, and build pipeline scalability.

| Architecture | Rendering Timing | TTFB | Server CPU Load | Scaling Limit |
|---|---|---|---|---|
| **SSG** *(Static Site Generation)* | Build Time | **~10ms (CDN Edge)** | Zero at runtime | Build times explode when catalog exceeds 10,000 pages |
| **SSR** *(Server-Side Rendering)* | Per Request | 150–400ms | High (Node.js/Edge CPU) | Requires autoscaling clusters to absorb traffic spikes |
| **ISR** *(Incremental Static Regeneration)* | Hybrid On-Demand | **~10ms (CDN Edge)** | Minimal | Scales to millions of SKUs with sub-minute build times |

### Incremental Static Regeneration (ISR):
1. The build pipeline pre-renders only the **top 1,000 most visited product pages** (taking &lt; 2 minutes).
2. When a user requests page #84,201 for the first time, the edge serves a fallback while generating the static HTML in the background.
3. The generated page is permanently cached on the CDN edge for subsequent visitors.

---

## 6. Zero-Downtime Data Migration Architecture

Migrating data stores (e.g. Postgres to DynamoDB, or MySQL 5.7 to MySQL 8) without taking downtime follows a strict 5-stage protocol:

```
Stage 1: Dual-Writing (App writes to Old DB + asynchronously to New DB)
Stage 2: Historical Backfill (Migrate past records with timestamp reconciliation)
Stage 3: Shadow Reads (App reads from Old DB, fires async read to New DB, verifies bitwise diffs)
Stage 4: Cutover Reads (Switch primary reads to New DB, maintain write fallback)
Stage 5: Decommission (Remove dual-writing and decommission Old DB)
```

---

## 7. SLOs, SLIs & Error Budget Burn Rate Governance

Site Reliability Engineering (SRE) manages reliability through **Service Level Objectives (SLOs)** and **Error Budgets**.

### Defining the Mathematics:
- **SLI (Service Level Indicator)**: Percentage of successful requests:
  $$\text{SLI} = \frac{\text{Successful Requests}}{\text{Total Valid Requests}} \times 100\%$$
- **SLO (Service Level Objective)**: Target reliability over a 30-day rolling window (e.g. 99.9%).
- **Error Budget**: The permitted unreliability ($100\% - 99.9\% = 0.1\%$). For 10 million requests, you can afford 10,000 failed requests per month.

### Multi-Window Multi-Burn-Rate Alerting:
Google SRE established the industry-standard **Burn Rate Alerting Matrix** to eliminate false-positive alert fatigue while detecting catastrophic outages fast:

| Burn Rate | Budget Consumed in Window | Window Size | Severity & Action |
|---|---|---|---|
| **14.4x** | 2% in 1 hour | 1 Hour | **Critical Page**: On-call engineer paged immediately |
| **6x** | 5% in 6 hours | 6 Hours | **High Priority Ticket**: Investigation required within 4 hours |
| **1x** | 100% in 30 days | 30 Days | Normal baseline burn rate |

> 🚨 **The Feature Freeze Gate**: If an engineering team burns 100% of its 30-day error budget before the end of the month, **all new feature releases are automatically blocked** by CI/CD gates. Engineering effort shifts 100% to reliability, bug fixes, and infrastructure hardening.

---

## 8. Observability Fundamentals: Logs, Metrics & Distributed Tracing

Observability in distributed systems rests on three complementary signals:

```
                       THE THREE PILLARS
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
    METRICS                  LOGS                   TRACES
• Low storage cost       • High context          • End-to-end request path
• Constant cardinality   • Discrete event record • Span timings across RPCs
• Ideal for alerting     • Expensive to index    • Ideal for debugging latency
```

### The High-Cardinality Trap:
- **Cardinality** is the number of unique combinations of metric label values.
- Attaching high-cardinality fields (like `user_id`, `order_id`, or `email`) to Prometheus or Datadog metric labels causes an explosion in time-series cardinality, consuming gigabytes of memory and crashing TSDB engines.
- **Rule**: High-cardinality values belong in **structured JSON logs and distributed trace spans**, never in metric tags!

### Head-Based vs Tail-Based Trace Sampling:
- **Head-Based Sampling**: The ingress gateway makes a probabilistic decision at request arrival (e.g. sample 1% of requests). *Drawback*: You miss 99% of rare error traces!
- **Tail-Based Sampling**: The OpenTelemetry Collector buffers all spans in memory until the request completes. If the request returns HTTP 5xx or exceeds 2,000ms latency, the collector retains **100% of the trace**, dropping ordinary fast 200 OK traces.

---

### Compare Next
- [Catastrophic Outages & Reliability](./case-studies-outages-reliability.md)
- [Petabyte Data Stores & Migrations](./case-studies-data-migrations.md)
- [Media Systems & Production Testing](./media-systems-and-testing.md)
