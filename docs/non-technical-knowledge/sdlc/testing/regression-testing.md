---
id: regression-testing
title: Regression Testing
sidebar_label: Regression Testing
---

# Regression Testing

## What is Regression Testing?

**Regression testing** is the process of re-running existing test suites after code changes to verify that previously working functionality has not been broken — intentionally or accidentally.

Every code change — no matter how small — is a potential regression risk. A 1-line config change once took down a production payment service for 45 minutes.

---

## Why Regression Testing Matters

| Scenario Without Regression Testing | Consequence |
|---|---|
| Developer fixes bug A, inadvertently breaks feature B | Feature B fails silently in production |
| Dependency upgrade changes serialisation behaviour | API responses differ; consumers break |
| Database migration drops a column still used in code | NullPointerException in production |
| New service added to the call chain changes latency | SLAs breached without warning |

---

## Types of Regression Testing

### Full Regression
Run the complete test suite across all modules. Done before every major release.

- Slowest, most comprehensive
- Catches the broadest range of issues
- May take 30–90 minutes in CI

### Targeted/Partial Regression
Run only tests related to the changed area. Used for patch releases and hotfixes.

- Faster feedback loop
- Higher risk of missing indirect regressions
- Use **test impact analysis** tools to determine scope

### Automated Regression (Recommended)
The regression suite is automated and runs in CI/CD on every merge to `develop` or `release/**`:

```
Developer merges PR
        ↓
CI triggers regression suite
        ↓
Unit tests → Integration tests → API tests → Smoke E2E
        ↓
Results reported to PR / Slack / Jira
        ↓
Gate: All passed? → Allow merge to release branch
      Any failed? → Block, notify, assign
```

---

## Regression Suite Design

### What to Include

- All existing unit tests
- All integration tests
- API contract tests (Spring Cloud Contract / Pact)
- Critical user journey smoke tests
- Previously failing tests that were fixed (prevent re-occurrence)

### What NOT to Include

- Exploratory tests (manual only)
- Performance tests (separate pipeline)
- Tests known to be flaky — fix or quarantine them

---

## Regression in the Java/Spring Ecosystem

### Spring Cloud Contract — Contract-Based Regression

Define producer-side contracts that are published as stubs for consumers:

```groovy
// contracts/TransactionController/shouldReturnTransactionsForUser.groovy
Contract.make {
    description "GET /api/v1/transactions returns 200 with page of transactions"
    request {
        method GET()
        url('/api/v1/transactions') {
            queryParameters {
                parameter 'fromDate': '2024-01-01'
                parameter 'toDate': '2024-01-31'
            }
        }
        headers {
            authorization(matching('Bearer .+'))
        }
    }
    response {
        status 200
        headers {
            contentType(applicationJson())
        }
        body([
            totalElements: $(consumer(anyNumber()), producer(1)),
            content: [[
                id: $(consumer(anyUuid()), producer('3fa85f64-5717-4562-b3fc-2c963f66afa6')),
                amount: 99.99
            ]]
        ])
    }
}
```

These contracts auto-generate regression tests on both producer and consumer sides.

---

## Regression Test Management

### Test Tagging Strategy

```java
@Tag("regression")
@Tag("transactions")
@SpringBootTest
class TransactionRegressionTest {
    // ...
}
```

Run tagged regression tests in CI:
```bash
mvn test -Dgroups="regression"
```

### Handling Flaky Tests

Flaky tests destroy trust in the regression suite. Treat them as P2 defects:

1. Identify flaky test (fails intermittently)
2. Quarantine: add `@Disabled("JIRA-456: flaky — intermittent race condition")` 
3. Create a Jira ticket to fix it
4. Fix root cause (often timing issues, test pollution, or real race conditions)
5. Re-enable and monitor

---

## Metrics to Track

| Metric | Target |
|---|---|
| Regression pass rate | ≥ 99% on every release |
| Regression execution time | < 30 minutes for full suite |
| Flaky test rate | < 1% of total test count |
| Defect escape rate | < 2% of defects reach production |

---

## Exit Criteria for Regression

- [ ] Full regression suite executed on the release candidate build
- [ ] 100% of tests passed (or failures are investigated and accepted)
- [ ] No new flaky tests introduced
- [ ] Results documented in [Test Summary Report](../reports/test-summary-report)
- [ ] Tech Lead and QA Lead sign-off

---

:::warning Regression ≠ New Feature Testing
Regression testing validates that **existing** functionality still works. New features require their own dedicated test cases before being added to the regression suite.
:::
