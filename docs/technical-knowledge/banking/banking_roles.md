---
id: banking_roles
title: Banking Roles & Teams
sidebar_label: Roles & Teams
sidebar_position: 2
description: A bank is made up of many specialised teams. Understanding who does what helps you collaborate effectively, know who to escalate to, and understand where you fit in the payments ecosystem.
tags:
- technical-knowledge
- banking
- banking_roles
---

import BankingRolesGovernanceDiagram from '@site/src/components/BankingRolesGovernanceDiagram';

# Banking Roles & Teams

## Overview

A bank is made up of many specialised teams. Understanding who does what helps you collaborate effectively, know who to escalate to, and understand where you fit in the payments ecosystem.

<BankingRolesGovernanceDiagram />

---

## Three Lines of Defence (3LoD Governance Framework)

Banks operate under the **Three Lines of Defence (3LoD)** risk governance framework — mandated by global regulators (APRA CPS 220 / CPS 230 in Australia, Basel III globally). This model establishes clear boundaries between business execution, independent policy oversight, and objective audit assurance.

### 1st Line of Defence: Business & Operations (Risk Owners)
- **Who**: Payments Engineering, Payments Operations, Core Banking, Retail/Corporate Business Units, Product Owners.
- **Responsibilities**:
  - Own and manage operational, credit, and compliance risks day-to-day.
  - Implement automated inline controls within application code (e.g. duplicate payment checks, balance reservations, input validation).
  - Execute Business-As-Usual (BAU) payment processing, exception resolution, and initial incident response.
  - Establish Key Risk Indicators (KRIs) and operate within the Risk Appetite Statement (RAS) defined by 2nd Line.

### 2nd Line of Defence: Risk & Compliance (Independent Oversight & Policy)
- **Who**: Compliance, Financial Crime (AML/CTF & Sanctions), Operational Risk, Cyber Security (CISO), Legal.
- **Responsibilities**:
  - Set risk management frameworks, policies, and mandatory control standards.
  - Provide independent oversight and **active challenge** to 1st Line business decisions.
  - Review and approve production release risk assessments, new payment product launches, and sanctions screening threshold changes.
  - Has independent veto authority over production deployments or business operations that exceed risk appetite.
  - Direct reporting line to the Chief Risk Officer (CRO) and Board Risk Committee.

### 3rd Line of Defence: Internal Audit (Independent Assurance)
- **Who**: Internal Audit Function, External Independent Auditors.
- **Responsibilities**:
  - Provide independent, objective assurance on the design and operational effectiveness of 1st and 2nd Line controls.
  - Conduct periodic audits of payment engines, key management, HSM controls, and regulatory reporting accuracy (SMR/IFTI).
  - Direct, unfettered reporting line to the **Board Audit Committee** (completely independent of executive management).

---

## Payments-Specific Teams

### Payments Operations

The team responsible for the **day-to-day running of payment processing**:

| Sub-team | Responsibilities |
|----------|----------------|
| **Payment Processing** | Monitor STP rates, handle exceptions |
| **Investigations** | Resolve unmatched payments, customer complaints |
| **Nostro Reconciliation** | Match correspondent account balances |
| **SWIFT Operations** | Manage SWIFT connectivity, gpi tracking |
| **Scheme Operations** | Manage NPP/BECS/RTGS submissions and monitoring |

**You'll work with Payments Ops when:**
- Your code produces payment exceptions (ops resolves them)
- Building new exception management workflows
- Investigating production incidents involving payments

---

### Transaction Banking / Cash Management

Serves corporate and institutional clients:

| Role | Responsibilities |
|------|----------------|
| **Transaction Banker** | Client-facing; structures cash management solutions |
| **Product Manager (Cash)** | Owns payment product (e.g., Osko for business) |
| **Implementation Manager** | Onboards corporates to host-to-host file delivery |
| **Client Services** | Handles corporate client enquiries |

---

### Technology / Engineering

Within the technology division:

| Role | Focus Area |
|------|-----------|
| **Payments Engineer** | Builds and maintains payment processing systems |
| **Core Banking Engineer** | Works on CBS (T24, Finacle, etc.) |
| **Integration Engineer** | Connects channels, CBS, networks (APIs, MQ) |
| **Data Engineer** | Payment data pipelines, reconciliation, reporting |
| **Platform/SRE** | Reliability, uptime, incident response |
| **Security Engineer** | Encryption, HSMs, API security |
| **Test Engineer / QA** | End-to-end payment testing, regression |

---

### Product

| Role | Focus |
|------|-------|
| **Product Owner (Payments)** | Backlog, user stories, prioritisation |
| **Product Manager** | Strategy, scheme submissions, roadmap |
| **Business Analyst** | Requirements, process mapping, gap analysis |

---

### Compliance & Financial Crime

| Role | Responsibilities |
|------|----------------|
| **AML Analyst** | Reviews transaction monitoring alerts |
| **Sanctions Analyst** | Reviews sanctions screening hits |
| **Financial Crime Investigator** | Deep-dive fraud and AML investigations |
| **Compliance Manager** | Policy ownership, regulatory change management |
| **MLRO** (Money Laundering Reporting Officer) | Statutory role; signs off on SMR filings |

---

### Treasury

| Role | Responsibilities |
|------|----------------|
| **Treasury Dealer** | FX trading, money market, liquidity management |
| **Liquidity Manager** | ESA/nostro balance management, intraday liquidity |
| **ALM (Asset/Liability Management)** | Balance sheet management |
| **Treasury Operations** | Trade confirmation, settlement instructions |

---

### Risk

| Role | Responsibilities |
|------|----------------|
| **Operational Risk Manager** | Identifies and monitors operational risks in payments |
| **Market Risk** | FX and interest rate risk |
| **Credit Risk** | Counterparty and customer credit exposure |
| **Fraud Risk Analyst** | Models and rules for fraud detection |

---

## Escalation Paths in Payments

Know who to contact for common situations:

| Situation | Who to Contact |
|-----------|---------------|
| Payment stuck in processing | Payments Operations |
| Sanctions alert on a payment | Compliance Analyst (2nd Line) |
| Fraud suspicion on a customer | Fraud team (1st Line) |
| NPP/BECS network outage | Scheme Operations + Technology |
| Corporate client complaint | Client Services / Transaction Banking |
| Regulatory question | Compliance |
| Production system down | On-call engineer → Platform/SRE |
| Large financial loss event | Operational Risk + Senior Management |
| Media/public incident | Communications + Risk |

---

## Key Acronyms Used in Banking Teams

| Acronym | Full Form | Context |
|---------|-----------|---------|
| **COO** | Chief Operating Officer | Heads operations |
| **CRO** | Chief Risk Officer | Heads risk function |
| **CISO** | Chief Information Security Officer | Heads cybersecurity |
| **CTO** | Chief Technology Officer | Heads technology |
| **MLRO** | Money Laundering Reporting Officer | AML compliance |
| **SME** | Subject Matter Expert | Domain expert on a topic |
| **BAU** | Business As Usual | Day-to-day operational work |
| **SLA** | Service Level Agreement | Target response/resolution times |
| **RCA** | Root Cause Analysis | Post-incident investigation |
| **P&L** | Profit and Loss | Financial performance |
| **RTB/CTB** | Run The Bank / Change The Bank | Ops vs project/change work |
| **MVP** | Minimum Viable Product | Smallest releasable feature |
| **UAT** | User Acceptance Testing | Business testing before go-live |

---

## Working in an Agile Payment Team (Engineering Pod Mechanics)

Payment engineering teams operate in multi-disciplinary **Agile Pods** designed for high reliability, strict compliance, and 24/7 mission-critical execution.

### Pod Composition & Specialised Roles
- **Payment Tech Lead / Senior Engineers**: Architects non-blocking event-driven microservices, guarantees idempotency keys, and enforces zero-downtime database migrations.
- **Product Owner (Payments)**: Translates scheme mandates (NPPA, SWIFT, AusPayNet) into prioritized epics and user stories.
- **Payments Operations SME**: Embedded in pod to define real-time exception resolution flows, manual repair screens, and operational SLAs.
- **Compliance Champion (2nd Line Liaison)**: Embedded to review data privacy, audit logging, and AML/sanctions screening hook designs during sprint grooming.
- **QA & Synthetic Test Engineer**: Builds automated ISO 20022 schema validation suites and executes synthetic payment simulation against scheme test harnesses.

### Non-Functional Requirements (NFRs) in Payment Sprints
Unlike standard web apps, payment user stories must satisfy non-negotiable NFRs before passing Definition of Done (DoD):
1. **Sub-Second Latency**: NPP payments must complete end-to-end processing in under 500ms.
2. **Strict Idempotency**: System must safely absorb duplicate network retries without generating double-debits.
3. **99.999% Availability**: Zero planned downtime; deployments use Blue/Green or Canary strategies with automated rollback.
4. **Immutable Audit Trail**: Every payment state change must emit structured audit events tagged with global trace IDs (`UETR`, `EndToEndId`).
5. **Dual-Control Release Approval**: Production deployment requires independent sign-off from both 1st Line Tech Lead and 2nd Line Risk/Compliance.

---

## Related Concepts
- [payment_lifecycle_101.md](./payment_lifecycle_101.md) — What the team is building/supporting
- [payment_exceptions.md](./payment_exceptions.md) — What ops teams handle daily
- [aml_kyc.md](./aml_kyc.md) — What compliance teams enforce
- [testing_banking.md](./testing_banking.md) — What QA/test engineers do in payments
