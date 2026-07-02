---
id: deployment-strategies
title: Deployment Strategies
sidebar_label: Deployment Strategies
description: Comprehensive guide to zero-downtime deployment strategies — Rolling, Blue-Green, Canary, Shadow, Feature Flags, and A/B Testing — with Kubernetes configs, database migration patterns, observability, and rollback runbooks.
tags: [system-design, devops, deployment-strategies, ci-cd, blue-green, canary, kubernetes, istio, argo-rollouts]
---

# Deployment Strategies

A **Deployment Strategy** defines how a new version of a service is introduced into production. The goal is always the same: ship new code with **zero downtime**, minimize the blast radius of unexpected failures, and maintain a rapid, rehearsed rollback path.

Choosing the wrong strategy — or implementing the right one incorrectly — is one of the most common causes of production incidents during deployments. This guide covers every major strategy, their operational mechanics, configuration, failure modes, and when to use each one.

---

## 1. Strategy Comparison Matrix

| Strategy | Rollback Speed | Blast Radius | Infra Cost | Complexity | Best For |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Recreate** | Medium | 100% | 1x | Low | Dev/test environments; batch jobs with no active users |
| **Rolling** | Slow (minutes) | Medium (~25%) | 1x | Low | Standard stateless microservice releases |
| **Blue-Green** | Instant (&lt;30s) | Low | 2x | Medium | Critical services; major DB schema changes |
| **Canary** | Fast (minutes) | Very Low (&lt;5%) | ~1.1x | High | User-facing features; behavioral validation at scale |
| **Shadow** | N/A | None | ~2x | High | Load testing; ML model validation; algorithm changes |
| **Feature Flags** | Instant | Configurable | 1x | Medium | Long-lived feature development; kill switches |
| **A/B Testing** | Instant | Configurable | ~1.1x | High | UX experiments; conversion rate optimization |

---

## 2. Recreate Deployment

The simplest strategy: **terminate all instances of the old version, then start the new version**. There is a downtime window between teardown and startup.

```
State 1 (running):  [ v1 ] [ v1 ] [ v1 ]
State 2 (gap):      [    ] [    ] [    ]  ← downtime window
State 3 (complete): [ v2 ] [ v2 ] [ v2 ]
```

```yaml
spec:
  strategy:
    type: Recreate   # Kubernetes terminates all v1 pods before creating v2
```

**When to use**: Development environments, batch processing jobs, or any non-production workload where a brief outage is acceptable in exchange for deployment simplicity. Never use in production for user-facing services.

**Why it exists**: Recreate is the only safe choice when v1 and v2 cannot co-exist — for example, when a DB migration is not backward-compatible and you cannot run mixed versions even momentarily.

---

## 3. Rolling Deployment

Replaces instances of the old version **one at a time** (or in small batches), so the deployment set always has a mix of old and new versions until the rollout completes.

```
Start:    [ v1 ] [ v1 ] [ v1 ] [ v1 ]   (100% v1)
Step 1:   [ v2 ] [ v1 ] [ v1 ] [ v1 ]   (25% v2, 75% v1)
Step 2:   [ v2 ] [ v2 ] [ v1 ] [ v1 ]   (50% / 50%)
Step 3:   [ v2 ] [ v2 ] [ v2 ] [ v1 ]   (75% v2, 25% v1)
Complete: [ v2 ] [ v2 ] [ v2 ] [ v2 ]   (100% v2)
```

### Kubernetes Configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # Allow 1 extra pod above the desired count during update
                         # e.g., 4 desired → max 5 pods temporarily exist
      maxUnavailable: 0  # Never reduce below desired count during update
                         # Guarantees full capacity is always available
  selector:
    matchLabels:
      app: order-service
  template:
    metadata:
      labels:
        app: order-service
    spec:
      containers:
      - name: order-service
        image: order-service:v2.1.0
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
          failureThreshold: 3   # Pod must pass 3 consecutive checks before traffic is routed to it
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
      terminationGracePeriodSeconds: 60   # Give in-flight requests time to complete
```

:::tip[Readiness vs Liveness Probes]
**Readiness probe** controls when a pod **receives traffic** — a pod that fails readiness is removed from the load balancer endpoint slice but is not restarted. Use this to protect users from hitting an unready pod.

**Liveness probe** controls when a pod is **restarted** — a pod that fails liveness is killed and replaced. Use this to recover from deadlocks or internal corruption.

Both must be configured correctly for rolling deployments to be safe. Missing readiness probes are the most common cause of brief errors during rolling updates.
:::

### Rolling Deployment: The Mixed-Version Window Problem

During a rolling update, **v1 and v2 are both serving production traffic simultaneously**. This is the critical constraint that rolling deployments impose:

```
User A's request:  ──► v1 pod (sees old schema, old business logic)
User B's request:  ──► v2 pod (sees new schema, new business logic)
Same request type, different behavior — must be acceptable
```

This means:
- **API contracts must be backward-compatible** between v1 and v2.
- **Database schema changes cannot be breaking** — v1 must still function against the post-migration schema. See Section 8.
- **Message formats** (Kafka events, gRPC proto changes) must be forward- and backward-compatible.

**Rollback**: Kubernetes rolls back a deployment by triggering a reverse rolling update — it replaces v2 pods with v1 pods following the same `maxSurge`/`maxUnavailable` rules. Rollback is **not instant**: it takes the same amount of time as the original rollout.

```bash
# Rollback to the previous revision
kubectl rollout undo deployment/order-service

# Rollback to a specific revision
kubectl rollout undo deployment/order-service --to-revision=3

# Check rollout history
kubectl rollout history deployment/order-service
```

---

## 4. Blue-Green Deployment

Maintains **two complete, identical production environments** — Blue and Green. At any time, only one environment serves live traffic; the other is idle and available for testing or immediate rollback.

```
Before deployment:
  Users ──► [ Load Balancer ] ──► Blue (v1.0.0) ← ACTIVE
                                  Green (idle)

Preparation (Green deployment and testing):
  Users ──► [ Load Balancer ] ──► Blue (v1.0.0) ← ACTIVE
                                  Green (v2.0.0) ← being tested, no traffic

Cutover (atomic switch):
  Users ──► [ Load Balancer ] ──► Blue (v1.0.0) ← idle, kept for rollback
                                  Green (v2.0.0) ← ACTIVE

Rollback (if needed, instant):
  Users ──► [ Load Balancer ] ──► Blue (v1.0.0) ← ACTIVE again
                                  Green (v2.0.0) ← decommissioned
```

### Kubernetes Implementation via Service Selectors

The cutover mechanism is a label selector change on the Kubernetes `Service` — a near-instant operation that redirects all traffic atomically.

```yaml
# Blue deployment — always running
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service-blue
spec:
  replicas: 4
  selector:
    matchLabels:
      app: order-service
      version: blue
  template:
    metadata:
      labels:
        app: order-service
        version: blue
    spec:
      containers:
      - name: order-service
        image: order-service:v1.0.0
---
# Green deployment — staged, not yet receiving traffic
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service-green
spec:
  replicas: 4
  selector:
    matchLabels:
      app: order-service
      version: green
  template:
    metadata:
      labels:
        app: order-service
        version: green
    spec:
      containers:
      - name: order-service
        image: order-service:v2.0.0
---
# The Service controls which environment receives traffic — change `version` to flip
apiVersion: v1
kind: Service
metadata:
  name: order-service
spec:
  selector:
    app: order-service
    version: blue   # ← Change to "green" to perform cutover
  ports:
  - port: 80
    targetPort: 8080
```

```bash
# Cutover: patch the selector to switch to green
kubectl patch service order-service \
  -p '{"spec":{"selector":{"version":"green"}}}'

# Rollback: patch back to blue — takes effect in <5 seconds
kubectl patch service order-service \
  -p '{"spec":{"selector":{"version":"blue"}}}'
```

### DNS-Based Cutover (AWS Route 53 / Multi-Region)

For cross-region or infrastructure-level blue-green, traffic switching can be done at the DNS layer:

```
Before:
  order-service.company.com  →  Route53  →  Blue ALB  (Weight: 100%)
                                             Green ALB (Weight: 0%)

Cutover:
  order-service.company.com  →  Route53  →  Blue ALB  (Weight: 0%)
                                             Green ALB (Weight: 100%)
```

:::warning[DNS TTL and Stale Clients]
DNS changes are not instant. Clients cache DNS responses for the duration of the TTL. Before a blue-green cutover via DNS, **lower the TTL to 60 seconds** well in advance (at least 2x the current TTL before the deployment window). After confirming the green environment is stable, raise the TTL back to normal. Without this, some clients will continue hitting the blue environment for minutes after the intended cutover.
:::

### Blue-Green Costs and Trade-offs

| Benefit | Cost |
|:---|:---|
| Instant rollback (flip the selector back) | 2x infrastructure cost at all times |
| Zero traffic impact during testing | Database and stateful session migrations are complex |
| Clean separation of old and new environments | Warming up a fresh green environment takes time |
| Can run full integration tests against green before cutover | Long-lived connections (WebSockets) must be drained manually |

**The database problem**: Blue-Green is straightforward for stateless services. For services backed by a shared database, both environments share the same database during the transition — meaning the same backward-compatibility constraints as rolling deployments apply. The database schema must support both v1 (blue) and v2 (green) simultaneously. See Section 8.

---

## 5. Canary Deployment

Exposes the new version to a **small, controlled subset of real production traffic** — the canary — while the stable version serves the majority. The canary is monitored closely; if metrics remain healthy, traffic is gradually increased. If not, the canary is killed and traffic returns entirely to stable.

```
                   ┌─────────────────────┐
 All Traffic ────► │    Load Balancer    │
                   └──┬──────────────┬──┘
                      │              │
               95% ───┘              └─── 5%
                      ▼              ▼
               ┌────────────┐  ┌───────────┐
               │ v1 Stable  │  │ v2 Canary │
               │ (4 pods)   │  │  (1 pod)  │
               └────────────┘  └───────────┘
                      │              │
               Healthy metrics   Monitored closely
```

### Istio VirtualService Traffic Splitting

```yaml
# DestinationRule defines the two subsets (stable and canary)
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: order-service
spec:
  host: order-service
  subsets:
  - name: stable
    labels:
      version: v1
  - name: canary
    labels:
      version: v2
---
# VirtualService controls the traffic split weights
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: order-service
spec:
  hosts:
  - order-service
  http:
  - route:
    - destination:
        host: order-service
        subset: stable
      weight: 95
    - destination:
        host: order-service
        subset: canary
      weight: 5
```

### Argo Rollouts — Automated Progressive Delivery

Manually managing canary weight increases is error-prone. [Argo Rollouts](https://argoproj.github.io/rollouts/) automates progressive traffic shifting and integrates with Prometheus to automatically roll back if error rate thresholds are breached.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: order-service
spec:
  replicas: 10
  strategy:
    canary:
      # Traffic steps: increase weight over time, pausing to validate at each step
      steps:
      - setWeight: 5        # Step 1: send 5% to canary
      - pause:
          duration: 5m      # Wait 5 minutes, evaluate metrics
      - setWeight: 20       # Step 2: increase to 20%
      - pause:
          duration: 10m
      - setWeight: 50       # Step 3: 50/50 split
      - pause:
          duration: 10m
      - setWeight: 100      # Step 4: full canary rollout complete

      # Automated rollback: if these Prometheus metrics breach thresholds, rollback immediately
      analysis:
        templates:
        - templateName: success-rate-check
        startingStep: 1
        args:
        - name: service-name
          value: order-service

---
# AnalysisTemplate defines the automated health check logic
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: success-rate-check
spec:
  args:
  - name: service-name
  metrics:
  - name: success-rate
    interval: 1m
    # Fail the analysis if success rate drops below 99% in any 1-minute window
    successCondition: result[0] >= 0.99
    failureLimit: 3        # Allow up to 3 failures before triggering rollback
    provider:
      prometheus:
        address: http://prometheus.monitoring:9090
        query: |
          sum(rate(http_requests_total{service="{{args.service-name}}",status!~"5.."}[2m]))
          /
          sum(rate(http_requests_total{service="{{args.service-name}}"}[2m]))
```

### Canary Targeting — Header and User-Based Routing

Beyond pure percentage-based routing, production canary systems often route to the canary based on **user identity or request attributes** — ensuring the same user always hits the same version, and that internal users or beta testers hit the canary first.

```yaml
# Istio VirtualService: route internal employees to canary, everyone else to stable
http:
- match:
  - headers:
      x-user-group:
        exact: "internal-beta"   # Route requests from internal users to canary
  route:
  - destination:
      host: order-service
      subset: canary
    weight: 100
- route:  # Default: all other traffic to stable
  - destination:
      host: order-service
      subset: stable
    weight: 100
```

### What to Monitor During a Canary

A canary is only as safe as the metrics you watch. Monitor these in parallel for stable vs. canary:

| Metric Category | Specific Signals | Rollback Trigger |
|:---|:---|:---|
| **Error Rate** | HTTP 5xx rate, gRPC error rate | Canary 5xx > Stable 5xx by >0.5% |
| **Latency** | p50, p95, p99 response time | Canary p99 > Stable p99 by >20% |
| **Saturation** | CPU%, memory%, thread pool depth | Canary resource usage trending upward |
| **Business Metrics** | Order success rate, payment completion | Canary conversion rate significantly below stable |
| **Downstream Impact** | Error rates in services called by the canary | Cascading errors into dependencies |

---

## 6. Shadow Deployment (Dark Launch)

Mirrors **a copy of all real production requests** to the new version, running in parallel. The shadow version processes each request fully but **its responses are discarded** — users only receive responses from the stable version. The shadow cannot write to shared production databases or call external APIs.

```
              ┌─────────────────────────────────────────────────────┐
              │                  Ingress / Service Mesh             │
              └───────────────┬──────────────────┬──────────────────┘
                              │                  │ (mirrored copy)
                         100% │                  │ 100% (shadowed)
                              ▼                  ▼
                     ┌──────────────┐    ┌──────────────────┐
                     │  v1 Stable   │    │   v2 Shadow      │
                     │              │    │                  │
                     │  Reads DB    │    │  Reads DB (safe) │
                     │  Writes DB   │    │  Discards writes │
                     │  Calls APIs  │    │  Stubs ext APIs  │
                     └──────┬───────┘    └──────────────────┘
                            │                  ↑
                    Response returned    Response discarded
                       to user           (metrics captured)
```

### Istio Traffic Mirroring Configuration

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: order-service
spec:
  hosts:
  - order-service
  http:
  - route:
    - destination:
        host: order-service
        subset: stable
      weight: 100
    mirror:
      host: order-service
      subset: shadow           # Traffic is mirrored here
    mirrorPercentage:
      value: 100.0             # Mirror 100% of requests (or set lower for cost savings)
```

### What Shadow Deployment Validates

Shadow deployments are the **highest-confidence validation** tool available before a production release — but also the highest cost and complexity. Use them specifically for:

| Use Case | What You're Validating |
|:---|:---|
| **Algorithm replacement** | Does the new recommendation engine produce different results? Are the differences acceptable? |
| **ML model promotion** | Does the new model perform better or worse on real production inputs than the current model? |
| **Database migration** | Does the new code work correctly against the migrated schema? |
| **Rewrite of a critical service** | Does the rewritten service produce identical output for all production request shapes? |
| **Load testing** | Can the new service sustain real production traffic volume without degrading? |

### Shadow Deployment Constraints

Shadow versions **must be carefully isolated** from shared state:

```
Shadow Version MUST:                Shadow Version MUST NOT:
───────────────────────────────────────────────────────────
✅ Read from production DB          ❌ Write to production DB
✅ Generate metrics/logs            ❌ Send emails/SMS to real users
✅ Call internal read-only APIs     ❌ Call external payment APIs
✅ Record shadow response diffs     ❌ Enqueue messages to production queues
```

Violating these rules can cause real user harm — for example, a shadow version that writes to the production DB will corrupt data, or a shadow version that calls Stripe will process real payments twice.

---

## 7. Feature Flags

Feature flags (also called feature toggles or feature gates) decouple **code deployment from feature release**. Code for a new feature is deployed to production but dormant — the feature is activated by flipping a flag in a configuration store, without any new deployment.

```
Deploy:  New code ships to 100% of instances (flag defaults to OFF)
         │
Activate: Flag flipped to ON for 5% of users (internal beta)
         │
Expand:  Flag expanded to 25%, then 50%, then 100%
         │
Cleanup: Flag removed from code; feature is always-on
```

### Flag Types

| Type | Description | Example |
|:---|:---|:---|
| **Release toggle** | Hide a partially-built feature until it's complete | `new-checkout-flow: false` |
| **Ops toggle / kill switch** | Disable a feature under load without deployment | `enable-recommendation-service: false` |
| **Experiment toggle** | Route a subset of users for A/B testing | `new-pricing-algorithm: 10%` |
| **Permission toggle** | Enable a feature for a specific user group | `beta-dashboard: internal-users` |

### Implementation with a Flag SDK

```java
// Using LaunchDarkly SDK (or OpenFeature-compatible client)
@Service
public class CheckoutService {
    private final LDClient ldClient;

    public CheckoutResponse processCheckout(User user, Cart cart) {
        // Evaluate the flag — the flag can be percentage-based, user-attribute-based, etc.
        boolean useNewCheckoutFlow = ldClient.boolVariation(
            "new-checkout-flow",
            LDUser.builder(user.getId())
                  .country(user.getCountry())
                  .custom("plan", user.getPlan())
                  .build(),
            false  // default value if flag service is unreachable
        );

        if (useNewCheckoutFlow) {
            return newCheckoutFlow.process(cart);
        } else {
            return legacyCheckoutFlow.process(cart);
        }
    }
}
```

### Kill Switches — The Most Important Flag Type

A **kill switch** is an ops toggle that immediately disables a feature that is causing production issues, without a deployment. This is the fastest possible mitigation for a production incident caused by a specific feature.

```
Production incident at 02:00:
  New recommendation engine consuming 4x expected CPU → latency spiking

02:01: Engineer flips kill switch "enable-recommendation-service" → false
02:01: All instances read flag; recommendation service calls bypassed
02:01: Latency returns to normal. No deployment required. No rollback required.

08:00: Team investigates, fixes the issue, re-enables the flag in staging
```

This is why kill switches should be provisioned for every major new feature before it goes to production — not as an afterthought, but as a required part of the feature's design.

### Feature Flags vs. Canary Deployment

| Dimension | Feature Flag | Canary Deployment |
|:---|:---|:---|
| **Requires new deployment to activate** | ❌ No | ✅ Yes |
| **Requires new deployment to roll back** | ❌ No (flip the flag) | ✅ Yes |
| **Targets specific users/groups** | ✅ Fine-grained (user attributes) | Limited (header-based) |
| **Requires code change to remove** | ✅ Yes (flag debt if not cleaned up) | ❌ No |
| **Infrastructure cost** | 1x | ~1.1x |
| **Best for** | Long-lived feature development; kill switches | Infrastructure changes; version migrations |

---

## 8. Database Migrations: The Backward Compatibility Trap

**No zero-downtime deployment strategy survives a breaking database schema change.** If v2 renames a column and v1 is still running (rolling update) or available for rollback (blue-green), v1 will crash the moment it queries the renamed column.

This is the most commonly underestimated constraint in production deployments.

### The Expand and Contract Pattern

Expand-Contract (also called Parallel Change) is the standard pattern for backward-compatible database migrations:

```
Phase 1 — EXPAND (add, never remove)
─────────────────────────────────────
Goal: make the schema support BOTH old and new versions simultaneously.

 ALTER TABLE orders ADD COLUMN new_status VARCHAR(50);

 Application code (v2):
   - Writes to BOTH old_status and new_status
   - Reads from old_status (source of truth still = old column)
   - v1 instances still work: they ignore new_status entirely
   - v2 instances are safe: they write both columns

Phase 2 — MIGRATE (backfill data)
───────────────────────────────────
Goal: populate new_status for all existing rows.

 UPDATE orders SET new_status = old_status WHERE new_status IS NULL;
 -- Run as a background migration; batch updates to avoid table locks
 -- Verify: SELECT COUNT(*) FROM orders WHERE new_status IS NULL;

Phase 3 — CONTRACT (remove the old)
──────────────────────────────────────
Goal: switch reads to new column, then drop old column.

 Deploy v3: reads and writes to new_status only; no longer references old_status
 Confirm all v2 instances are gone (no mixed-version traffic)

 ALTER TABLE orders DROP COLUMN old_status;
 -- Safe: no live code references this column anymore
```

### Common Database Anti-Patterns That Break Zero-Downtime Deployments

| Anti-Pattern | Why It Breaks | Safe Alternative |
|:---|:---|:---|
| `ALTER TABLE ... DROP COLUMN` in the same deploy as code that stops using it | v1 instances crash immediately | Drop only after all v1 instances are gone (Phase 3) |
| `ALTER TABLE ... RENAME COLUMN` | Both old and new names are live simultaneously | Add new column, migrate data, drop old (Expand-Contract) |
| Adding a `NOT NULL` column without a default | Existing rows fail constraint; v1 inserts without the column fail | Add with a default value first; make it NOT NULL only after migration |
| Changing a column's data type in-place | v1 code may send incompatible types | Add new column with new type, migrate, drop old |
| Removing an index that v1 queries depend on | Query plan degrades or fails | Only remove after confirming no running version uses that index |

### Migration Tooling

Production database migrations should be:
- **Version-controlled** (Flyway, Liquibase, Alembic) — every schema change tracked as a numbered migration file.
- **Idempotent** — safe to run twice without error.
- **Reversible** — every `upgrade` migration should have a corresponding `downgrade` migration, especially during the Expand phase.
- **Non-blocking** — use `CREATE INDEX CONCURRENTLY` (PostgreSQL) or `ALGORITHM=INPLACE` (MySQL) to avoid table locks during index creation on large tables.

```sql
-- PostgreSQL: safe concurrent index creation (does not lock the table)
CREATE INDEX CONCURRENTLY idx_orders_new_status ON orders(new_status);

-- MySQL: online DDL that minimizes locking
ALTER TABLE orders ADD COLUMN new_status VARCHAR(50), ALGORITHM=INPLACE, LOCK=NONE;
```

---

## 9. Observability During Deployments

A deployment without proper monitoring is flying blind. The following observability setup is required for any production deployment strategy to be operated safely.

### Golden Signals — What to Watch Per Version

During any deployment with mixed traffic (rolling, canary), instrument your monitoring to **segment metrics by version label**:

```yaml
# Prometheus metric labels — always include version
http_requests_total{service="order-service", version="v2", status="500"} 42
http_request_duration_seconds{service="order-service", version="v2", quantile="0.99"} 0.45
```

```promql
# Error rate per version — compare canary (v2) vs stable (v1)
sum(rate(http_requests_total{service="order-service", version="v2", status=~"5.."}[2m]))
/
sum(rate(http_requests_total{service="order-service", version="v2"}[2m]))

# p99 latency per version
histogram_quantile(0.99,
  sum(rate(http_request_duration_seconds_bucket{service="order-service"}[2m])) by (le, version)
)
```

### Automated Rollback Triggers

Deployments should roll back **automatically** when health metrics breach thresholds, without requiring a human to be watching at 3 AM.

| Tool | Mechanism | Integration |
|:---|:---|:---|
| **Argo Rollouts** | `AnalysisTemplate` queries Prometheus on a schedule; fails rollout if thresholds breached | Kubernetes-native; integrates with Istio, Nginx |
| **Flagger** | Continuous metric checks during canary promotion; auto-promotes or rolls back | Works with any service mesh |
| **Spinnaker** | Deployment pipeline stages with integrated metric gates | Multi-cloud; integrates with Datadog, New Relic, Prometheus |
| **AWS CodeDeploy** | CloudWatch Alarms can trigger automatic deployment rollback | AWS-native; ECS, EC2, Lambda |

### Pre-Deployment Checklist

Before any production deployment, verify:

- [ ] Readiness and liveness probes configured and tested
- [ ] `terminationGracePeriodSeconds` set to exceed longest expected in-flight request duration
- [ ] Database migrations reviewed for backward compatibility with the previous version
- [ ] Feature flag kill switch provisioned for major new features
- [ ] Prometheus dashboards segmented by version label
- [ ] Automated rollback trigger thresholds configured (error rate, latency)
- [ ] Rollback procedure documented and rehearsed (not just written)
- [ ] Stakeholder notification plan ready (support, on-call, external status page)

---

## 10. Common Failure Modes and Anti-Patterns

### 1. Missing Readiness Probes → User-Visible Errors During Rolling Updates

Kubernetes routes traffic to a new pod as soon as it is `Running`, not when it is *ready to serve traffic*. Without a readiness probe, newly started pods receive requests while still initializing (loading caches, establishing DB connections, warming JIT), causing errors.

```
Fix: always configure a readiness probe that returns 200 only when the pod
is fully initialized and capable of handling requests.
```

### 2. Stateful Connections Not Drained → Broken WebSockets and Uploads

When a rolling update terminates a v1 pod, any long-lived connections (WebSockets, SSE, streaming uploads) on that pod are abruptly closed.

```yaml
# Fix: configure a preStop hook to drain connections gracefully before shutdown
lifecycle:
  preStop:
    exec:
      command: ["/bin/sh", "-c", "sleep 15"]  # Allow load balancer to deregister pod
                                               # and existing connections to close naturally
terminationGracePeriodSeconds: 75   # Must be > preStop sleep + longest request duration
```

### 3. Missing Automated Rollback → Manual Intervention at 2 AM

Relying on a human to notice a deployment is degrading and manually trigger a rollback means:
- Mean time to recovery (MTTR) is as long as it takes someone to notice and act.
- Errors at night or weekends go undetected longer.
- Inconsistent execution of rollback procedures under stress.

```
Fix: use Argo Rollouts or Flagger with Prometheus-driven AnalysisTemplates.
If p99 latency exceeds threshold for 3 consecutive minutes, rollback automatically.
```

### 4. Session Affinity Masking Canary Failure Rates

If the load balancer uses sticky sessions (cookie-based or IP-based affinity), some users will be **permanently pinned** to the canary pod. This corrupts percentage-based error rate analysis — if the canary is broken for specific user flows, only those pinned users are affected, and aggregate metrics may look healthy.

```
Fix: disable sticky sessions during canary testing, or use user-ID-based
consistent routing (via Istio header matching) instead of infrastructure-level
session affinity, so you retain control over which users hit the canary.
```

### 5. Treating All Deployments as Identical

Not every deployment carries the same risk. A CSS change and a payment processing engine change should not use the same deployment strategy.

```
Risk Classification:
  LOW   → CSS/static assets, config-only changes, copy updates
          Strategy: Rolling with fast maxSurge

  MEDIUM → New API endpoints, non-breaking logic changes
           Strategy: Canary at 5% → 25% → 100% with automated rollback

  HIGH  → Payment flows, auth systems, DB schema changes
          Strategy: Blue-Green with manual smoke tests before cutover

  CRITICAL → Core ledger changes, regulatory-mandatory changes
             Strategy: Blue-Green + shadow validation + extended canary
```

---

## 11. Strategy Selection Guide

```
Is the service stateless?
├── NO (stateful: WebSockets, active uploads, session-pinned)
│   └──► Rolling with long terminationGracePeriodSeconds + preStop drain hook
│
└── YES
    │
    Can v1 and v2 run simultaneously? (API compat, DB compat)
    ├── NO
    │   └──► Blue-Green (complete switch) or Recreate (if downtime is acceptable)
    │
    └── YES
        │
        Is this a high-risk change? (payments, auth, major new feature)
        ├── YES
        │   ├── Need to validate under real load before full release?
        │   │   └──► Shadow (validate) → then Canary (progressive rollout)
        │   └── Need instant guaranteed rollback?
        │       └──► Blue-Green
        │
        └── NO (standard low-risk release)
            ├── Need user-targeted rollout? (internal beta, A/B test)
            │   └──► Canary with header-based routing or Feature Flags
            └── Standard release
                └──► Rolling (simple, cost-effective)
```

---

## 🔗 Related Concepts

- [CI/CD Pipeline Design](./cicd-pipeline.md)
- [Kubernetes Health Probes](./kubernetes-probes.md)
- [Database Migration Patterns](./database-migrations.md)
- [Service Mesh with Istio](./istio.md)
- [Argo Rollouts Progressive Delivery](./argo-rollouts.md)
- [Feature Flag Management](./feature-flags.md)
- [Incident Response & Rollback Runbooks](./incident-response.md)