---
id: maintenance
title: Phase 7 — Maintenance
sidebar_label: Maintenance
---

# Phase 7 — Maintenance

## Overview

The **Maintenance phase** begins immediately after deployment and continues for the lifetime of the system. It encompasses monitoring, incident response, performance optimisation, security patching, and iterative enhancements.

In a modern continuous delivery model, maintenance and development phases overlap — teams continuously ship improvements while the current version is in production.

---

## Goals

- Maintain system health, availability, and performance
- Respond to and resolve incidents quickly
- Apply security and dependency patches proactively
- Gather feedback for the next development iteration

---

## Maintenance Activities

### 1. Monitoring and Alerting
Continuously observe key system signals:

```yaml
# Prometheus alerting rules example
groups:
  - name: sdlc-service-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_server_requests_seconds_count{status=~"5.."}[5m]) > 0.01
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High HTTP error rate on {{ $labels.service }}"

      - alert: HighLatency
        expr: histogram_quantile(0.99, rate(http_server_requests_seconds_bucket[5m])) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "p99 latency > 500ms on {{ $labels.service }}"
```

### 2. Incident Management

| Severity | Response Time | Escalation |
|---|---|---|
| P1 — Critical | 15 minutes | Immediate — all hands |
| P2 — High | 1 hour | On-call engineer + Tech Lead |
| P3 — Medium | Next business day | Regular sprint planning |
| P4 — Low | Next sprint | Backlog |

**Incident lifecycle:**
1. Alert fires → On-call engineer notified
2. Acknowledge and assess severity
3. Create incident channel (Slack/PagerDuty)
4. Mitigate (roll backward if necessary)
5. Resolve root cause
6. Post-incident review (PIR) within 48 hours
7. Action items tracked in Jira

### 3. Post-Incident Review (PIR)
PIR is blameless and focuses on systemic improvements:

```markdown
## PIR: Payment service timeout — 2024-03-15

**Duration:** 22:14 – 22:47 UTC (33 minutes)
**Impact:** 12% of payment requests timed out

### Timeline
- 22:14 Alert: p99 latency > 2s on payment-service
- 22:18 On-call acknowledged, began investigation
- 22:31 Root cause identified: DB connection pool exhausted
- 22:47 Fix deployed (connection pool size increased)

### Root Cause
HikariCP max-pool-size was set to 10 for a service handling 
500 RPS. A spike in slow queries exhausted available connections.

### Action Items
- [ ] Increase pool size to 50 and add connection pool monitoring
- [ ] Add database slow query alert (> 100ms threshold)
- [ ] Add load test to CI for this service
```

### 4. Dependency Management
Proactively manage library and platform versions:

```bash
# Maven dependency check
mvn versions:display-dependency-updates

# OWASP security scan
mvn dependency-check:check

# Renovate / Dependabot — automated PR creation for updates
```

### 5. Technical Debt Management
Track and schedule reduction of technical debt:
- Dedicate 10–20% of each sprint to tech debt
- Tag Jira items with `tech-debt` label
- Refactor incrementally — avoid big-bang rewrites
- Use SonarQube tech debt dashboard for visibility

---

## Operational Runbooks

Maintain runbooks for common operational tasks:

- **How to restart a service safely** (drain, restart, verify)
- **How to run a database migration in production**
- **How to increase JVM heap size without restart** (JVM flags)
- **How to flush a Redis cache**
- **How to replay Kafka messages from a topic offset**

---

## Exit Criteria

Maintenance is ongoing — it formally "ends" when the system is decommissioned:

- [ ] System reaches end-of-life
- [ ] Data migration completed
- [ ] Service deregistered from service registry and DNS
- [ ] Infrastructure destroyed (cloud resources terminated)
- [ ] Documentation archived

---

:::info Tip: Actuator Endpoints for Maintenance
Enable Spring Boot Actuator for runtime visibility:
- `/actuator/health` — liveness and readiness
- `/actuator/metrics` — all Micrometer metrics
- `/actuator/loggers` — change log level at runtime without restart
- `/actuator/env` — inspect active configuration
- `/actuator/threaddump` — diagnose thread starvation
:::
