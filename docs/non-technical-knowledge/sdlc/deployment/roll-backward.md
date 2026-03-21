---
id: roll-backward
title: Roll-Backward Strategy
sidebar_label: Roll-Backward
---

# Roll-Backward Strategy

## What is Roll-Backward?

**Roll-backward** (commonly called a **rollback**) is a deployment recovery strategy where the system is reverted to the **previously known-good version** when a critical issue is detected after deployment. It is the fastest way to restore system stability when a fix is not immediately available.

Roll-backward is a safety net — it must be **planned, tested, and executable in minutes**, not improvised during an incident.

---

## When to Roll-Backward

Trigger a roll-backward when:

- A **P1 (Critical) defect** is detected post-deployment — system down, data corruption, security vulnerability
- The defect is **not quickly fixable** (fix > 30–60 minutes away)
- The **database migration is reversible** (down migration is available and tested)
- The **new API version has not yet been adopted** by consumers
- A **canary metric threshold is breached** automatically (error rate > 1%, latency > 2x)

---

## Pre-Requisites for a Safe Rollback

A rollback must be prepared **before** the deployment happens — not during the incident:

| Pre-requisite | How to Ensure |
|---|---|
| Previous image tag is retained | Never overwrite `:latest` — always use versioned tags |
| Down migration is written and tested | Flyway down migrations tested in staging before release |
| Rollback procedure is in the runbook | Reviewed by on-call engineer before deployment |
| Kubernetes rollout history retained | `revisionHistoryLimit: 3` in Deployment spec |
| Database backup taken | Automated snapshot before migration runs |

---

## Roll-Backward Decision Flowchart

```
P1 incident detected post-deployment
              ↓
   Is a hotfix available in < 15 min?
      ↙ Yes              ↘ No
  Roll-Forward         Has DB migration run?
                          ↙ Yes        ↘ No
                    Can we safely     Rollback
                    down-migrate?     immediately
                    ↙ Yes   ↘ No
                Rollback   Roll-Forward
                + Down-    (only option)
                migrate
```

---

## Roll-Backward Process

### Step 1 — Declare Incident and Notify (< 2 minutes)

```
On-call Engineer:
  1. Open incident channel: #incident-YYYY-MM-DD-[service]
  2. Post: "🔴 Initiating rollback of [service] v1.2.0 → v1.1.5"
  3. Tag: Tech Lead, Product Manager, QA Lead
  4. Set PagerDuty incident: In Progress
```

### Step 2 — Kubernetes Rollback (< 3 minutes)

Kubernetes retains rollout history, making rollback instantaneous:

```bash
# View rollout history
kubectl rollout history deployment/transaction-service

# Output:
# REVISION  CHANGE-CAUSE
# 1         v1.1.5 — stable release
# 2         v1.2.0 — current (broken)

# Roll back to the previous revision
kubectl rollout undo deployment/transaction-service

# Or roll back to a specific revision
kubectl rollout undo deployment/transaction-service --to-revision=1

# Monitor the rollback progress
kubectl rollout status deployment/transaction-service --timeout=5m

# Verify the running image version
kubectl get deployment transaction-service \
  -o jsonpath='{.spec.template.spec.containers[0].image}'
```

Ensure rollout history is retained in your Deployment spec:

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: transaction-service
spec:
  revisionHistoryLimit: 5       # Keep last 5 revisions for rollback
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    spec:
      containers:
        - name: transaction-service
          image: your-registry/transaction-service:v1.2.0  # Always pin, never :latest
```

### Step 3 — Database Down Migration (if applicable)

If the deployment included a Flyway migration, you must run a corresponding down migration:

```sql
-- V1_2_0__Undo__add_transaction_category.sql
-- This script is run MANUALLY during rollback — it is NOT auto-applied by Flyway

-- Step 1: Remove data added by the forward migration
UPDATE transactions SET category = NULL;

-- Step 2: Drop the column added in v1.2.0
ALTER TABLE transactions DROP COLUMN IF EXISTS category;

-- Step 3: Remove the Flyway history entry so v1.2.0 can be re-applied later
DELETE FROM flyway_schema_history WHERE version = '1.2.0';
```

Run the down migration:

```bash
# Connect to production DB (use your standard DB access tooling)
psql -h $DB_HOST -U $DB_USER -d $DB_NAME \
  -f migrations/rollback/V1_2_0__Undo__add_transaction_category.sql

# Verify the rollback
psql -h $DB_HOST -U $DB_USER -d $DB_NAME \
  -c "SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;"
```

:::danger
Always take a database snapshot **immediately before** running a down migration. Down migrations are destructive — they cannot be undone if something goes wrong mid-script.
:::

### Step 4 — Verify Rollback Success

```bash
# 1. Check pod health
kubectl get pods -l app=transaction-service

# 2. Run inflight smoke tests against the rolled-back version
mvn test -Dgroups="inflight" \
  -Dinflight.base-url=https://production.yourapp.com \
  -Dinflight.api-key=$INFLIGHT_API_KEY

# 3. Confirm error rate has recovered in Grafana
# Expected: HTTP 5xx rate < 0.1% within 5 minutes of rollback
```

### Step 5 — Disable the Broken Feature via Feature Flag (belt-and-suspenders)

Even after rolling back, disable the feature that caused the issue to prevent accidental re-enablement:

```bash
curl -X PATCH https://launchdarkly.com/api/v2/flags/production/transaction-category \
  -H "Authorization: $LD_API_TOKEN" \
  -d '{"patch": [{"op": "replace", "path": "/environments/production/on", "value": false}]}'
```

### Step 6 — Communicate and Close Incident

```
Post to #incident channel:

✅ Rollback complete
  Service: transaction-service
  Rolled back: v1.2.0 → v1.1.5
  Time to recover: 12 minutes
  Error rate: back to < 0.1%
  DB down-migration: applied ✅
  Inflight smoke tests: ✅ all passing

  Root cause investigation ongoing — PIR within 48 hours.
  Deployment of v1.2.0 blocked until root cause resolved.
```

---

## Rollback for Blue/Green Deployments

Blue/Green makes rollback even simpler — just switch traffic back:

```bash
# Switch load balancer back to the blue (old) environment
# AWS ALB example:
aws elbv2 modify-listener \
  --listener-arn $LISTENER_ARN \
  --default-actions Type=forward,TargetGroupArn=$BLUE_TARGET_GROUP_ARN

# The green environment remains running and healthy — 
# can be inspected and fixed without time pressure
```

---

## Rollback for Canary Deployments

If using Argo Rollouts or Flagger, rollback can be triggered automatically or manually:

```bash
# Argo Rollouts manual rollback
kubectl argo rollouts abort transaction-service
kubectl argo rollouts undo transaction-service

# Flagger — rollback is automatic when metric thresholds are breached
# Configure thresholds in the Canary resource:
```

```yaml
# canary.yaml
apiVersion: flagger.app/v1beta1
kind: Canary
spec:
  analysis:
    threshold: 3           # number of failed checks before rollback
    maxWeight: 50          # maximum canary traffic weight
    stepWeight: 10         # increment per step
    metrics:
      - name: request-success-rate
        thresholdRange:
          min: 99          # rollback if success rate < 99%
        interval: 1m
      - name: request-duration
        thresholdRange:
          max: 500         # rollback if p99 latency > 500ms
        interval: 1m
```

---

## Rollback Testing

Rollback procedures must be tested **before** production incidents:

| Activity | Frequency |
|---|---|
| Dry-run Kubernetes rollback in staging | Every release |
| Test down migration in staging against a copy of prod data | Every migration |
| Chaos engineering: simulate a failed deployment | Quarterly |
| Fire drill: execute the full rollback runbook | Semi-annually |

---

## Checklist

- [ ] Incident declared and stakeholders notified
- [ ] Decision to roll-backward documented (rationale)
- [ ] Database snapshot taken (if migration involved)
- [ ] Kubernetes rollback executed (`kubectl rollout undo`)
- [ ] Down migration run and verified (if applicable)
- [ ] Inflight smoke tests passed on rolled-back version
- [ ] Monitoring dashboards confirm recovery
- [ ] Feature flag disabled to prevent re-triggering
- [ ] Incident closed and stakeholders notified of recovery
- [ ] Broken version blocked in CI/CD pipeline
- [ ] Post-incident review scheduled (within 48 hours)

---

:::info Rollback is Not Failure
A fast, clean rollback is a sign of engineering maturity. The failure is not the rollback — the failure is shipping untested code, or being unable to rollback when needed.
:::
