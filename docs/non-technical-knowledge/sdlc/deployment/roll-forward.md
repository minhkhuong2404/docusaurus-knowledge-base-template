---
id: roll-forward
title: Roll-Forward Strategy
sidebar_label: Roll-Forward
---

# Roll-Forward Strategy

## What is Roll-Forward?

**Roll-forward** is a deployment recovery strategy where, instead of reverting to the previous version when an issue is detected, the team **fixes the defect and deploys a new patched version forward** to production as quickly as possible.

It is the preferred strategy when:
- The defect is minor and a fix is available quickly
- Data migrations have already run and cannot be reversed cleanly
- The rollback itself would cause more disruption than the bug
- The new version introduced structural changes (schema, API) that downstream systems already depend on

---

## Roll-Forward vs Roll-Backward

| Factor | Roll-Forward | Roll-Backward |
|---|---|---|
| Fix availability | Fix is ready or trivial | Fix will take hours or days |
| Data migration | Irreversible migration ran | Migration is reversible |
| Downtime tolerance | Low — system stays up | Higher — rollback takes time |
| Risk | Lower if fix is well-tested | Higher if rollback untested |
| User impact | Minimal if bug is non-critical | Temporary feature loss |

---

## When to Roll-Forward

Use roll-forward when **any** of the following conditions are met:

- **Database migration already applied** — rolling back would require a down-migration, which is risky and often unavailable
- **Downstream consumers already using the new API version** — reverting the producer breaks consumers
- **Bug is non-critical** (P3/P4) — system still functional, workaround exists
- **Hotfix is < 30 minutes away** — faster than a rollback + redeploy cycle
- **Feature flags are available** — the problematic feature can be disabled instantly without a new deploy

---

## Roll-Forward Decision Flowchart

```
Issue detected post-deployment
            ↓
    Is it a P1 (Critical)?
     ↙ Yes         ↘ No
  Can we        Is a fix
  fix in        available in
  < 15 min?     < 30 min?
  ↙    ↘          ↙    ↘
Yes    No        Yes    No
 ↓      ↓         ↓      ↓
Fix   Roll-      Fix   Roll-
fwd   back       fwd   back
```

---

## Roll-Forward Process

### Step 1 — Immediate Mitigation (< 5 minutes)
While the fix is being prepared, reduce user impact:

```bash
# Option A: Disable the broken feature via feature flag (zero downtime)
curl -X PATCH https://launchdarkly.com/api/v2/flags/production/broken-feature \
  -H "Authorization: $LD_API_TOKEN" \
  -d '{"patch": [{"op": "replace", "path": "/environments/production/on", "value": false}]}'

# Option B: Route traffic away from the broken endpoint via API gateway rule
# Option C: Return a maintenance response for the specific endpoint
```

### Step 2 — Hotfix Branch

```bash
# Checkout from the released tag, NOT from develop (develop may have unrelated changes)
git checkout -b hotfix/JIRA-999-fix-null-pointer v1.2.0

# Make the minimal targeted fix
# Do not include refactors, new features, or unrelated changes
git commit -m "fix(transactions): resolve NPE when description is null (JIRA-999)"

# Push and create PR against both main and develop
git push origin hotfix/JIRA-999-fix-null-pointer
```

### Step 3 — Accelerated CI Pipeline

Hotfix pipelines should run a **targeted** subset of the full CI suite to move faster:

```yaml
# .github/workflows/hotfix-ci.yml
name: Hotfix CI

on:
  push:
    branches: ['hotfix/**']

jobs:
  hotfix-pipeline:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: maven

      - name: Build and run targeted tests
        run: |
          mvn verify -B \
            -Dtest="TransactionServiceTest,TransactionControllerIT" \
            -Dgroups="regression,smoke"

      - name: Sonar delta analysis
        run: mvn sonar:sonar -B -Dsonar.analysis.mode=preview
```

### Step 4 — Fast-Track Deployment

```bash
# Tag the hotfix
git tag -a v1.2.1 -m "Hotfix: resolve NPE on null description (JIRA-999)"

# Trigger hotfix deployment pipeline
# This bypasses normal release schedule and CAB fast-track approval

# Deploy via existing CD pipeline
kubectl set image deployment/transaction-service \
  transaction-service=your-registry/transaction-service:v1.2.1

# Monitor rollout
kubectl rollout status deployment/transaction-service --timeout=5m
```

### Step 5 — Post-Fix Verification

```bash
# Run inflight smoke tests
mvn test -Dgroups="inflight" \
  -Dinflight.base-url=https://production.yourapp.com \
  -Dinflight.api-key=$INFLIGHT_API_KEY

# Re-enable the feature flag (if it was disabled in Step 1)
curl -X PATCH https://launchdarkly.com/api/v2/flags/production/broken-feature \
  -H "Authorization: $LD_API_TOKEN" \
  -d '{"patch": [{"op": "replace", "path": "/environments/production/on", "value": true}]}'
```

### Step 6 — Merge Hotfix Back

```bash
# Merge hotfix into main (for the release tag)
git checkout main
git merge --no-ff hotfix/JIRA-999-fix-null-pointer
git tag -a v1.2.1

# Merge hotfix into develop (to keep develop in sync)
git checkout develop
git merge --no-ff hotfix/JIRA-999-fix-null-pointer

# Delete hotfix branch
git branch -d hotfix/JIRA-999-fix-null-pointer
```

---

## Roll-Forward with Database Migrations

When a Flyway migration has already been applied, roll-forward is almost always required:

```java
// V1_2_1__add_description_not_null_default.sql
-- Safe roll-forward migration: add a default to prevent the NPE
-- Never drop columns or make breaking changes in a hotfix migration

ALTER TABLE transactions
  ALTER COLUMN description SET DEFAULT '';

UPDATE transactions
  SET description = ''
  WHERE description IS NULL;

ALTER TABLE transactions
  ALTER COLUMN description SET NOT NULL;
```

:::warning
Never write a `V1_2_0__rollback__...` Flyway script. Flyway does not support rollback scripts in the community edition. Use roll-forward migrations exclusively.
:::

---

## Checklist

- [ ] Root cause identified
- [ ] Feature flag disabled (if applicable) to mitigate impact
- [ ] Hotfix branch created from the release tag (not develop)
- [ ] Minimal, targeted fix committed — no unrelated changes
- [ ] Targeted CI suite passed
- [ ] Hotfix deployed to production
- [ ] Inflight tests passed
- [ ] Feature flag re-enabled (if disabled)
- [ ] Hotfix merged back to both `main` and `develop`
- [ ] Incident ticket updated with resolution
- [ ] Post-incident review scheduled

---

:::tip Feature Flags are Your Best Friend
The fastest roll-forward is a feature flag toggle — no deployment required, instant effect. Design new features behind flags so that any issue can be mitigated in seconds while the fix is being prepared.
:::
