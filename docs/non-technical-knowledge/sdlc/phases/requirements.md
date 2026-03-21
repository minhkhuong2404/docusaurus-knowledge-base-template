---
id: requirements
title: Phase 2 — Requirements Analysis
sidebar_label: Requirements
---

# Phase 2 — Requirements Analysis

## Overview

The **Requirements Analysis phase** transforms the high-level project vision from the Planning phase into detailed, unambiguous, and testable specifications. This phase bridges the gap between business stakeholders and engineering teams.

Requirements are the contract between what the business needs and what engineering delivers. Ambiguous or missing requirements are a primary driver of rework.

---

## Goals

- Capture all functional and non-functional requirements
- Decompose requirements into user stories with clear acceptance criteria
- Validate requirements with stakeholders
- Define definition of done (DoD) for the project
- Create a baseline from which scope changes are measured

---

## Entry Criteria

- Project Charter is approved
- Key stakeholders are identified and available
- Planning phase is complete

---

## Types of Requirements

### Functional Requirements
Define **what** the system must do:
- User authentication and authorization
- Business rules and workflows
- Data processing and transformations
- API contracts and integrations
- Reporting and notification features

### Non-Functional Requirements (NFRs)
Define **how well** the system must perform:

| NFR Category | Example |
|---|---|
| **Performance** | API response time < 200ms at p99 under 1000 RPS |
| **Availability** | 99.9% uptime SLA (≤ 8.7 hours downtime/year) |
| **Scalability** | Support 10x current load within 6 months |
| **Security** | All PII data encrypted at rest and in transit |
| **Maintainability** | Code coverage ≥ 80%; Sonar quality gate green |
| **Compliance** | GDPR, PCI-DSS, SOC2 requirements met |

---

## Key Activities

### 1. Stakeholder Interviews and Workshops
Structured sessions to elicit requirements:
- Business process walkthroughs
- Use case identification
- Pain point analysis of the current system

### 2. User Story Writing
Follow the format:

```
As a [persona],
I want to [action],
So that [business value].
```

**Example:**
```
As a registered customer,
I want to view my full transaction history with filtering by date range,
So that I can reconcile my monthly expenses.
```

### 3. Acceptance Criteria (Given / When / Then)
Each user story must have testable acceptance criteria:

```gherkin
Feature: Transaction History

  Scenario: Filter transactions by date range
    Given I am logged in as a customer
    And I have transactions between Jan 1 and Jan 31
    When I apply a date filter for January
    Then I should see only transactions within that date range
    And the results should be sorted by date descending
    And the total count should be displayed
```

### 4. Requirements Traceability Matrix (RTM)
Link every requirement to its corresponding test case:

| Req ID | Requirement | User Story | Test Case |
|---|---|---|---|
| REQ-001 | User can log in | US-101 | TC-001, TC-002 |
| REQ-002 | Transaction history filtered by date | US-105 | TC-010 through TC-015 |

### 5. Definition of Done (DoD)
Agreed checklist before a story is considered complete:

- [ ] Code reviewed and approved by at least 1 peer
- [ ] Unit test coverage ≥ 80% for new code
- [ ] Acceptance criteria verified by QA
- [ ] No critical or high Sonar issues introduced
- [ ] API documentation updated (Swagger/OpenAPI)
- [ ] Feature flag configured if applicable
- [ ] Product Manager has accepted the story

---

## Non-Functional Requirements in a Java/Spring Context

```yaml
# application.yml — NFR-driven configuration examples

# Performance: thread pool sizing
server:
  tomcat:
    threads:
      max: 200
      min-spare: 20

# Timeouts
spring:
  datasource:
    hikari:
      connection-timeout: 30000
      maximum-pool-size: 20
  mvc:
    async:
      request-timeout: 30000

# Resilience
resilience4j:
  circuitbreaker:
    instances:
      paymentService:
        failure-rate-threshold: 50
        wait-duration-in-open-state: 10s
```

---

## Exit Criteria

- [ ] All functional requirements documented and approved
- [ ] All NFRs are measurable and approved
- [ ] User stories are written with acceptance criteria
- [ ] RTM baseline is created
- [ ] Definition of Done is agreed by the team
- [ ] No open questions or ambiguities remain

---

:::warning Common Pitfall
Do not start development until acceptance criteria are written and approved. Developers coding against vague requirements guarantees rework.
:::
