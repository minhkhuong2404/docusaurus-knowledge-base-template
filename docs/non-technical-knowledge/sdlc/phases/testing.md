---
id: testing
title: Phase 5 — Testing
sidebar_label: Testing
---

# Phase 5 — Testing

## Overview

The **Testing phase** verifies that the software meets all functional and non-functional requirements before it is deployed to production. Testing is a quality gate — not a final hurdle.

Modern engineering teams treat testing as a **continuous activity** throughout the SDLC, not a phase that happens only after development is complete.

---

## Testing Pyramid

```
          ┌─────────────────┐
          │   E2E Tests     │  ← Slowest, fewest, highest confidence
          │ (User journeys) │
         ─┴─────────────────┴─
        ┌───────────────────────┐
        │  Integration Tests    │  ← Service interactions, DB, queues
        │  + Inflight / Perf    │
       ─┴───────────────────────┴─
      ┌─────────────────────────────┐
      │        Unit Tests           │  ← Fastest, most numerous
      │  (Methods, Classes, Logic)  │
      └─────────────────────────────┘
```

Tests should be abundant at the bottom and sparse at the top. Each layer complements, not replaces, the others.

---

## Testing Types Overview

| Type | What It Validates | When It Runs |
|---|---|---|
| [Unit Testing](../testing/unit-testing) | Individual methods and classes in isolation | Every commit, in CI |
| [Integration Testing](../testing/integration-testing) | Component interactions (DB, queues, APIs) | Every commit, in CI |
| [Regression Testing](../testing/regression-testing) | Existing functionality still works | Before every release |
| [End-to-End Testing](../testing/end-to-end-testing) | Full user workflows through the whole stack | Pre-deployment |
| [Inflight Testing](../testing/inflight-testing) | System behaviour under real production traffic | During / after deployment |
| [Component Performance Testing](../testing/component-performance-testing) | Individual service performance under load | Before major releases |

---

## Quality Gates

Every release must pass these gates before promotion to the next environment:

### DEV → SIT (System Integration Testing)
- [ ] Unit test suite green (≥ 80% coverage)
- [ ] Sonar quality gate green
- [ ] Integration tests green

### SIT → UAT (User Acceptance Testing)
- [ ] All integration tests passing
- [ ] No open Critical or Blocker defects
- [ ] Regression suite completed on SIT

### UAT → Production
- [ ] UAT signed off by Product Manager
- [ ] E2E tests green on UAT
- [ ] Performance benchmarks met
- [ ] Security scan completed
- [ ] [Test Summary Report](../reports/test-summary-report) approved

---

## Defect Management

### Defect Severity Levels

| Severity | Definition | Resolution SLA |
|---|---|---|
| **P1 — Critical** | System crash, data loss, security breach | Block release — fix immediately |
| **P2 — High** | Major feature broken, no workaround | Must fix before release |
| **P3 — Medium** | Feature partially broken, workaround exists | Fix in current or next sprint |
| **P4 — Low** | Minor UI/UX issue, cosmetic | Backlog |

### Defect Lifecycle

```
New → Assigned → In Progress → Fixed → Verification → Closed
                                              ↓
                                         Rejected → Reopened
```

---

## Entry Criteria

- Development phase complete (stories merged to develop)
- Test environment is configured and seeded with test data
- Test cases are written and reviewed
- Test environment matches production configuration as closely as possible

## Exit Criteria

- [ ] All planned test cases executed
- [ ] No open P1 or P2 defects
- [ ] P3 defects reviewed and accepted or deferred
- [ ] Regression suite passed
- [ ] E2E suite passed
- [ ] Test Summary Report produced and approved
- [ ] Performance benchmarks met
- [ ] Product Manager sign-off obtained

---

:::info Testing Tools in the Java/Spring Ecosystem
- **Unit testing**: JUnit 5, Mockito, AssertJ
- **Integration testing**: Spring Boot Test, Testcontainers, MockMvc
- **Contract testing**: Spring Cloud Contract, Pact
- **E2E testing**: Selenium, Playwright, Cypress
- **Performance testing**: Gatling, k6, Apache JMeter
- **Security testing**: OWASP ZAP, Snyk
:::
