---
id: banking_roles
title: Banking Roles & Teams
sidebar_label: Roles & Teams
sidebar_position: 2
---

# Banking Roles & Teams

## Overview

A bank is made up of many specialised teams. Understanding who does what helps you collaborate effectively, know who to escalate to, and understand where you fit in the payments ecosystem.

---

## Three Lines of Defence

Banks are organised around the **Three Lines of Defence** model — a governance framework that defines accountability for risk:

```
┌───────────────────────────────────────────────────────────────────┐
│  1st LINE: Business & Operations                                  │
│  (They own and manage risk day-to-day)                            │
│  ├── Payments Operations                                          │
│  ├── Retail Banking                                               │
│  ├── Transaction Banking                                          │
│  └── Technology / Product teams                                   │
├───────────────────────────────────────────────────────────────────┤
│  2nd LINE: Risk & Compliance                                      │
│  (They set the rules and independently oversee 1st line)          │
│  ├── Compliance (AML, sanctions, regulatory)                      │
│  ├── Financial Crime                                              │
│  ├── Operational Risk                                             │
│  └── Legal                                                        │
├───────────────────────────────────────────────────────────────────┤
│  3rd LINE: Internal Audit                                         │
│  (Independent assurance — audits 1st and 2nd lines)               │
│  └── Internal Audit                                               │
└───────────────────────────────────────────────────────────────────┘
```

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

## Working in an Agile Payment Team

Most payment technology teams operate with:

```
2-week sprints
├── Sprint Planning  — Team selects work from backlog
├── Daily Standup    — 15-min sync (what did I do, what will I do, blockers)
├── Sprint Review    — Demo completed work to stakeholders
└── Retrospective    — What went well, what to improve

Common artefacts:
├── User Story       — "As a payments operator, I want to see exception details..."
├── Acceptance Criteria — "Given X, When Y, Then Z"
├── Definition of Done — Code reviewed, tested, deployed to staging
└── Epic             — Group of related stories (e.g., "NPP PayTo Integration")
```

---

## Related Concepts
- [payment_lifecycle_101.md](./payment_lifecycle_101.md) — What the team is building/supporting
- [payment_exceptions.md](./payment_exceptions.md) — What ops teams handle daily
- [aml_kyc.md](./aml_kyc.md) — What compliance teams enforce
- [testing_banking.md](./testing_banking.md) — What QA/test engineers do in payments
