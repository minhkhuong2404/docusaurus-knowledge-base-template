---
id: ways-of-working
title: Modern Engineering Way of Working (WoW)
sidebar_label: 4. Modern Way of Working
description: Practical guide to enterprise engineering ways of working, Team Topologies, 3 Amigos, INVEST user stories, Kanban WIP limits, PR SLAs, Tech Debt, and Blameless Post-Mortems.
tags:
  - non-technical-knowledge
  - agile
  - way-of-working
  - engineering-practices
  - team-topologies
---

import WayOfWorkingLifecycleDiagram from '@site/src/components/WayOfWorkingLifecycleDiagram';

# Modern Engineering Way of Working (WoW)

> A practical, senior-level blueprint for how engineering squads organize, discover, build, verify, deploy, and maintain software systems in modern technology enterprises.

---

## What is "Way of Working" (WoW)?

While Scrum and Agile provide the strategic ceremonies and philosophical principles, a company's **Way of Working (WoW)** defines the tactical, day-to-day engineering mechanics:

- *How do we decide what to build before touching code?*
- *How do cross-functional squads interact with platform and infrastructure teams?*
- *What is our standard for pull requests, code reviews, and automated verification?*
- *How do we balance customer features against technical debt and architectural upgrades?*
- *How do we handle production incidents without a culture of fear and finger-pointing?*

---

## 1. Squad Architecture & Team Topologies

Modern tech companies structure engineering around **autonomous, cross-functional squads** rather than functional silos (where all frontend devs sit in one room, backend devs in another, and QA in a third).

According to **Conway’s Law**:
> *"Organizations which design systems are constrained to produce designs which are copies of the communication structures of these organizations."*

To build decoupled, event-driven microservices or modular monoliths, organizations adopt **Team Topologies**:

```
       ┌────────────────────────────────────────────────────────┐
       │                    STREAM-ALIGNED SQUAD                │
       │  (Cross-functional: PO, TL, 4 Devs, 1 QA, 1 Designer)  │
       │       Delivers end-to-end customer value flow          │
       └──────────────────────────┬─────────────────────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
  │PLATFORM TEAM │         │ENABLING TEAM │         │COMPLICATED   │
  │              │         │              │         │SUBSYSTEM     │
  │Internal Dev  │         │Consults &    │         │Specialized   │
  │Platform (IDP)│         │upskills on   │         │Math / Crypto │
  │K8s, CI/CD    │         │Observability │         │or ML Kernels │
  └──────────────┘         └──────────────┘         └──────────────┘
```

### The 4 Fundamental Team Topologies

1. **Stream-Aligned Teams (Squads)**: Aligned directly to a single continuous stream of business work (e.g., *Payments Squad*, *Checkout Squad*, *Identity Squad*). Possesses all skills required to take a feature from ideation to production.
2. **Platform Teams**: Provide an underlying Internal Developer Platform (IDP)—Kubernetes clusters, CI/CD templates, telemetry, authentication gateways—enabling stream-aligned teams to deliver autonomously without cognitive overload.
3. **Enabling Teams**: Teams of subject matter experts (e.g., Security, Observability, Testing) that act as internal consultants to teach and upskill squads, then move on.
4. **Complicated-Subsystem Teams**: Rare teams dedicated to domains requiring deep mathematical or scientific specialization (e.g., a custom video transcoding engine, 3D rendering pipeline, or cryptographic HSM interface).

---

## 2. The Feature Delivery Pipeline & Team Flow

Every piece of work follows a structured path with explicit entry and exit criteria. Inspect the interactive delivery pipeline below to explore stage activities, WIP capacities, Little's Law dynamics, and team norms.

<WayOfWorkingLifecycleDiagram />

---

## 3. Product Discovery & The "Three Amigos"

The most expensive defect to fix is one born from a misunderstanding in requirements. Before any code is written, teams run a **Three Amigos** session (also known as Story Kickoff).

```
          ┌────────────────────────────────────────────────────────┐
          │                    THE THREE AMIGOS                    │
          └──────────────────────────┬─────────────────────────────┘
                                     │
            ┌────────────────────────┼────────────────────────┐
            ▼                        ▼                        ▼
     ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
     │PRODUCT / BA  │         │DEVELOPMENT   │         │QA / TEST     │
     └──────────────┘         └──────────────┘         └──────────────┘
     "Why & What"              "How & Feasibility"      "What could break?"
     Customer persona          Architecture & cost      Edge cases & inputs
     Business value            Dependencies             Negative assertions
```

### Three Amigos Protocol
- **Timebox**: 15 to 30 minutes per complex user story.
- **Key Outcome**: Agreement on testable **Given-When-Then** acceptance criteria (Behavior-Driven Development / BDD).
- **The Golden Rule**: If the developer and QA engineer have different mental models of how an edge case behaves, that dispute must be resolved in the Three Amigos session—not in a Pull Request comment two weeks later.

---

## 4. Writing High-Impact User Stories: The INVEST Criteria

User stories are not formal legal specifications; they are **reminders for a conversation**. A well-crafted story conforms to the **INVEST** mnemonic:

| Letter | Principle | What it Means in Practice |
|---|---|---|
| **I** | **Independent** | The story can be built, tested, and shipped without hard lockstep dependency on another unbuilt story. Avoids pipeline logjams. |
| **N** | **Negotiable** | The details are open to technical and UX negotiation between developers and product managers to balance value vs cost. |
| **V** | **Valuable** | Delivers concrete value to the end user or buyer. Technical enablers should state how they enable customer outcomes. |
| **E** | **Estimable** | The team understands the scope and technical approach well enough to provide a relative Fibonacci story point estimate. |
| **S** | **Small** | Fits comfortably within a single sprint (ideally 1 to 3 days of development). Reduces batch size. |
| **T** | **Testable** | Clear, unambiguous acceptance criteria allow automated pass/fail verification. |

### The Standard User Story & Acceptance Criteria Template

```markdown
### User Story
As a registered e-commerce customer,
I want to save multiple delivery addresses in my checkout profile,
So that I can quickly send gifts to friends without re-typing shipping information.

---

### Acceptance Criteria (Given - When - Then)

Scenario 1: Successfully save a second valid domestic address
Given I am an authenticated customer on the "Address Book" settings page
When I submit a new address with valid Street, City, State, and Postal Code
Then the address is saved to my profile database record
And it appears immediately in my saved addresses list
And I receive an HTTP 201 Created confirmation toast.

Scenario 2: Reject duplicate address submission
Given I already have "123 Main St, Springfield" saved in my profile
When I attempt to add the identical normalized address again
Then the submission is rejected with HTTP 409 Conflict
And an inline warning states "This address is already saved in your address book."

Scenario 3: Maximum address limit reached
Given an account already contains 10 saved addresses (configured system limit)
When I click the "Add New Address" button
Then the form is disabled
And a tooltip informs me to remove an obsolete address before adding a new one.
```

---

## 5. Flow Control & Work-In-Progress (WIP) Limits

A common corporate dysfunction is an engineering team where every engineer works on two or three tickets simultaneously.

According to **Little’s Law** from queuing theory:

$$\text{Cycle Time} = \frac{\text{Work In Progress (WIP)}}{\text{Throughput}}$$

When you double the number of items in progress, you automatically **double the Cycle Time** of every ticket in the system.

```
THE REALITY OF CONTEXT SWITCHING:
1 Active Task:   [████████████████████████████████████████] 100% Productive coding
2 Active Tasks:  [████████████████] (Context) [████████████████] 80% Productive (20% lost)
3 Active Tasks:  [█████████] (Context) [█████████] (Context) [█████████] 60% Productive (40% lost)
```

### Team WIP Limit Rules
1. **Column Limits**: Set hard limits on the Jira/Kanban board for each column (e.g., max 3 items in *In Development*, max 2 items in *Code Review*).
2. **Swarming Policy**: If the *Code Review* column reaches its maximum WIP limit, **developers are forbidden from pulling new tickets from the backlog**. Instead, they must swarm to review pending PRs or help test staging items.
3. **Stop Starting, Start Finishing**: Celebrate team members who unblock teammates and close tickets rather than those who simply open new ones.

---

## 6. Engineering Team Norms & SLAs

High-velocity engineering teams agree upon explicit, written working agreements:

### A. Pull Request (PR) Turnaround SLA ($< 4$ Hours)
- **The Problem**: An engineer finishes coding, opens a PR, and it sits unreviewed for 3 days. By the time feedback arrives, the author has switched contexts, forgotten the logic, and faces painful git merge conflicts.
- **The Rule**: Inbound PRs must be reviewed **within 4 working hours** (same-day review).
- **Size Limit**: Pull requests should ideally be **under 250 lines of code**. Monolithic 2,000-line PRs receive superficial, rubber-stamp approvals because reviewers suffer cognitive fatigue.

### B. Code Review Etiquette
- Use prefixes to clarify the severity of comments:
  - `[BLOCKER]`: A bug, security flaw, or race condition that must be addressed before merging.
  - `[SUGGESTION]`: An alternative idiom or performance tweak; author may decide.
  - `[NIT]`: Trivial style or naming preference; non-blocking.
  - `[QUESTION]`: Seeking architectural context or understanding.
- Never write derogatory remarks. Critique the code, not the person.

### C. Technical Debt: The 70 / 20 / 10 Rule
To prevent codebases from degrading into unmaintainable legacy quagmires:
- **70% Capacity**: Direct customer-facing feature delivery and roadmap commitments.
- **20% Capacity**: Technical debt remediation, framework upgrades (e.g., Spring Boot 2 ➔ 3), database indexing, test suite speedups, and architectural refactoring.
- **10% Capacity**: Engineering spikes, learning, proof-of-concept experiments, and hackathon projects.

### D. Technical Spikes
When a story contains too many architectural unknowns to estimate responsibly, do not guess. Schedule a **Spike**:
- A **timeboxed** investigation (strictly capped at 1 to 2 days).
- Produces throwaway prototype code or an Architecture Decision Record (ADR).
- The output of the spike is the knowledge required to write and estimate production-ready user stories for the subsequent sprint.

---

## 7. Production Operations, On-Call & Blameless Post-Mortems

Agile doesn't end when code is deployed. The team that builds the software operates the software (**"You build it, you run it"**).

```
         ┌────────────────────────────────────────────────────────┐
         │                 PRODUCTION INCIDENT LOOP               │
         └──────────────────────────┬─────────────────────────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           ▼                        ▼                        ▼
    ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
    │ALERT & PAGER │ ──────> │TRIAGE & HEAL │ ──────> │BLAMELESS     │
    │              │         │              │         │POST-MORTEM   │
    │Prometheus/   │         │Rollback or   │         │5-Whys Root   │
    │PagerDuty P1  │         │circuit break │         │Cause Fixes   │
    └──────────────┘         └──────────────┘         └──────────────┘
```

### The Blameless Post-Mortem Culture

When a P1 production incident occurs, dysfunctional organizations seek someone to blame, punish, or reprimand. This creates a culture of fear where engineers hide mistakes, avoid bold refactoring, and refuse to touch production configs.

Google’s Site Reliability Engineering (SRE) standard establishes the **Blameless Post-Mortem**:

1. **Fundamental Assumption**: Humans make mistakes, but systems must be resilient to human error. If an engineer typed the wrong CLI command, the fault is that the CLI lacked guardrails, confirmation prompts, or sandboxing.
2. **Timeline Reconstruction**: Minute-by-minute breakdown of what occurred, what alerts fired, when the engineer acted, and when customer impact ceased.
3. **The 5 Whys Analysis**:
   - *Why did the service crash?* Database connection pool ran dry.
   - *Why did the connection pool run dry?* A slow query locked rows for 12 seconds under load.
   - *Why was the query slow?* A database migration dropped an index on `account_id`.
   - *Why was the index dropped?* The schema migration script lacked a pre-deploy validation check.
   - *Why did it lack a check?* Our CI pipeline did not run Flyway migration tests against staging data replicas.
4. **Action Items**: Concrete engineering Jira tickets with assigned owners to build systemic safeguards (e.g., adding automated query linter in CI, tuning HikariCP connection timeouts, and canary traffic gating).

---

## Summary Matrix: The Modern Agile Engineer's Playbook

| Scenario | Traditional Anti-Pattern | Modern Engineering Way of Working |
|---|---|---|
| **Requirements** | 100-page spec handed off without discussion. | **3 Amigos** kickoff with BDD Given-When-Then criteria. |
| **Estimation** | Mandated hours with punishment for misses. | **Story Points** (Fibonacci relative sizing) via Planning Poker. |
| **Execution** | Engineers juggle 4 tickets concurrently. | **Strict WIP limits**; swarm to unblock PRs and QA before starting new work. |
| **Code Review** | 1,500-line PR sits in queue for a week. | Micro-PRs ($< 250\text{ LOC}$) reviewed within **$< 4\text{ hours}$ SLA**. |
| **Tech Debt** | Ignored for years until total rewrite is required. | **70/20/10 allocation**; continuous refactoring in every sprint. |
| **Incidents** | Finger-pointing, reprimands, and fear. | **Blameless post-mortem** focusing on systemic safeguards and automation. |

---

## Related Knowledge Modules

- Understand the theoretical foundations in **[Agile Foundations & Empirical Process](./intro)**.
- Master the roles, ceremonies, and artifacts in **[Scrum Framework](./scrum-framework)**.
- Deep dive into flow velocity and burndown curves in **[Estimation, Velocity & Metrics](./estimation-metrics)**.
