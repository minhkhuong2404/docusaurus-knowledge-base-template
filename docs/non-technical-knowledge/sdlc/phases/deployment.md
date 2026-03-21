---
id: deployment
title: Phase 6 — Deployment
sidebar_label: Deployment
---

# Phase 6 — Deployment

## Overview

The **Deployment phase** moves tested, approved software from the staging environment to production. A well-executed deployment is **planned, automated, monitored, and reversible**.

Modern deployments are not single big-bang events. They use progressive delivery techniques — feature flags, canary releases, blue/green deployments — to minimise risk and enable rapid rollback.

---

## Goals

- Deploy software to production with zero or minimal downtime
- Verify the deployment is healthy through monitoring and inflight testing
- Have a clear roll-backward plan ready if issues are detected
- Communicate deployment status to all stakeholders

---

## Entry Criteria

- All quality gates passed (see Testing phase)
- Test Summary Report approved
- Change Advisory Board (CAB) approval obtained (if applicable)
- Deployment runbook reviewed by on-call engineer
- Rollback procedure documented and tested
- Release notes prepared

---

## Deployment Strategies

### Blue/Green Deployment

Two identical environments — **blue** (current live) and **green** (new version). Traffic is switched atomically from blue to green.

```
Traffic Router
    ├── BLUE  ← 100% live traffic (current version)
    └── GREEN ← 0% traffic (new version, ready to go live)

After deployment:
    ├── BLUE  ← 0% traffic (kept warm for rollback)
    └── GREEN ← 100% live traffic (new version)
```

**Pros:** Instant rollback, zero downtime  
**Cons:** Requires double infrastructure

### Canary Deployment

Gradually shift traffic to the new version while monitoring metrics.

```
Stage 1:  5% canary → new version | 95% → old version
Stage 2: 25% canary → new version | 75% → old version
Stage 3: 50% canary → new version | 50% → old version
Stage 4: 100% → new version (old version decommissioned)
```

**Pros:** Gradual risk exposure, real-world validation  
**Cons:** Complex traffic management, longer total deployment

### Rolling Update (Kubernetes)

Kubernetes replaces pods one at a time, keeping the service available throughout.

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1         # Allow 1 extra pod during rollout
    maxUnavailable: 0   # Never reduce below desired replica count
```

---

## Deployment Runbook Template

Every deployment must have a runbook:

```markdown
## Release: v1.2.0
**Date:** 2024-03-15 22:00 UTC
**Engineer:** @deployer
**Rollback Owner:** @oncall-engineer

### Pre-Deployment Checks
- [ ] All feature flags configured for canary stage
- [ ] Database migrations tested on staging
- [ ] Rollback procedure reviewed

### Deployment Steps
1. Tag release: `git tag -a v1.2.0 -m "Release 1.2.0"`
2. Trigger CD pipeline: [link to pipeline]
3. Monitor deployment progress in ArgoCD/Spinnaker
4. Verify health checks at 5%, 25%, 50%, 100% traffic
5. Run smoke tests post-deployment

### Post-Deployment Verification
- [ ] Inflight test suite green
- [ ] Error rate < 0.1% in Grafana dashboard
- [ ] Latency p99 < 500ms
- [ ] No unusual spike in logs (Kibana/DataDog)

### Rollback Trigger Criteria
Roll back immediately if any of the following occur:
- Error rate > 1% within 10 minutes
- p99 latency > 2x baseline
- Any P1 defect reported
```

---

## Post-Deployment Monitoring

Key signals to watch for 30–60 minutes after deployment:

| Signal | Tool | Threshold |
|---|---|---|
| HTTP error rate (5xx) | Grafana / Datadog | < 0.1% |
| API latency p99 | Grafana / Prometheus | < baseline × 1.5 |
| JVM heap usage | Micrometer + Grafana | < 80% |
| Database connection pool | HikariCP metrics | < 90% utilisation |
| Kafka consumer lag | Kafka UI / Grafana | < 5 minutes behind |
| Exception count | ELK / Datadog | No new exception classes |

---

## Related Pages

- [Roll-Forward Strategy](../deployment/roll-forward)
- [Roll-Backward Strategy](../deployment/roll-backward)
- [Inflight Testing](../testing/inflight-testing)

---

## Exit Criteria

- [ ] Deployment completed successfully
- [ ] All health checks passing
- [ ] Inflight tests green
- [ ] Monitoring dashboards are normal for 30+ minutes
- [ ] Stakeholders notified of successful deployment
- [ ] Old version decommissioned (blue environment cleaned up)

---

:::tip Zero Downtime Deployments in Spring Boot
Use `@ConditionalOnProperty` to wire feature flags at the bean level, and `/actuator/health/liveness` + `/actuator/health/readiness` probes for Kubernetes zero-downtime rollouts.
:::
