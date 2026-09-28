---
id: scrum-framework
title: Scrum Framework — Roles, Ceremonies & Artifacts
sidebar_label: 2. Scrum Framework
description: Deep dive into Scrum accountabilities (PO, SM, Developers), the 5 events (Planning, Daily, Review, Retro, Refinement), 3 artifacts, and Definition of Done vs Definition of Ready.
tags:
  - non-technical-knowledge
  - agile
  - scrum
  - ceremonies
  - artifacts
---

import AgileScrumLifecycleDiagram from '@site/src/components/AgileScrumLifecycleDiagram';

# Scrum Framework — Roles, Ceremonies & Artifacts

> A comprehensive reference for the three accountabilities, five events, and three artifacts that make up the Scrum framework, including real-world failure modes and production best practices.

---

## The Scrum Architecture

Scrum is intentionally incomplete. It is a lightweight framework within which people can address complex adaptive problems while productively delivering products of the highest possible value.

Scrum is defined by:
- **3 Accountabilities (Roles)**: Product Owner, Scrum Master, Developers.
- **5 Events (Ceremonies)**: Sprint, Sprint Planning, Daily Scrum, Sprint Review, Sprint Retrospective (plus continuous Backlog Refinement).
- **3 Artifacts & Commitments**:
  - *Product Backlog* ➔ committed to the **Product Goal**
  - *Sprint Backlog* ➔ committed to the **Sprint Goal**
  - *Increment* ➔ committed to the **Definition of Done (DoD)**

---

## 1. Scrum Accountabilities (Roles)

Scrum avoids traditional corporate hierarchies within the Scrum Team. There are no sub-teams or hierarchies; it is a cohesive unit of professionals focused on one objective at a time.

```
       ┌────────────────────────────────────────────────────────┐
       │                    THE SCRUM TEAM                      │
       └──────────────────────────┬─────────────────────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
  │PRODUCT OWNER │         │ SCRUM MASTER │         │  DEVELOPERS  │
  └──────────────┘         └──────────────┘         └──────────────┘
  Value Maximizer          Process Enabler          Solution Builders
  Owns "WHAT & WHY"        Owns "HOW WE WORK"       Owns "HOW TO BUILD"
  Product Backlog          Removes Roadblocks       Quality & Estimates
```

### A. The Product Owner (PO)
The Product Owner is accountable for **maximizing the value of the product** resulting from the work of the Scrum Team.

* **Core Responsibilities**:
  - Developing and explicitly communicating the **Product Goal**.
  - Creating and clearly communicating **Product Backlog items (PBIs)**.
  - Ordering Product Backlog items by business value, ROI, and technical risk.
  - Ensuring the backlog is transparent, visible, and understood by all.
* **Authority**: For the PO to succeed, the entire organization must respect their decisions. No stakeholder can direct the developers to work on alternate priorities without PO agreement.
* **Anti-Patterns & Traps**:
  - *The Proxy PO*: A junior coordinator who has no real authority and must ask an executive for permission before answering any question.
  - *The Micromanager*: Dictating technical architecture, database schemas, or assigning individual tickets to developers.
  - *The Order-Taker / Feature Factory*: Saying "yes" to every stakeholder request, resulting in a bloated, unfocused product with no coherent strategy.

---

### B. The Scrum Master (SM)
The Scrum Master is accountable for **establishing Scrum as defined in the Scrum Guide** and for the **Scrum Team’s effectiveness**. They are **servant leaders** who serve both the team and the broader organization.

* **Core Responsibilities**:
  - Coaching team members in self-management and cross-functionality.
  - Helping the team focus on creating high-value Increments that meet the **Definition of Done**.
  - Facilitating the removal of organizational impediments beyond the team's direct control.
  - Ensuring that all Scrum events take place, are productive, kept within the timebox, and psychologically safe.
* **Project Manager vs. Scrum Master**:
  
  | Dimension | Traditional Project Manager | Agile Scrum Master |
  |---|---|---|
  | **Authority** | Manages scope, budget, schedule, and team assignments. | Holds no command-and-control authority over people or scope. |
  | **Focus** | Conformance to Gantt plan, milestone dates, task assignments. | Team effectiveness, flow, process improvement, obstacle removal. |
  | **Decision Making** | Directs "Who does what by when". | Facilitates the team to decide how to self-organize and execute. |
  | **Failure Mode** | Micromanagement and status-chasing. | Devolving into a calendar secretary or Jira admin. |

* **Anti-Patterns & Traps**:
  - *The Jira Admin / Meeting Secretary*: Spending all day updating ticket statuses, moving cards, and scheduling Outlook invites without coaching or driving improvement.
  - *The Agile Police*: Blindly enforcing rituals ("You cannot talk to each other without a ticket") rather than fostering collaboration.

---

### C. The Developers
Developers are the people in the Scrum Team who are committed to **creating any aspect of a usable Increment each Sprint**. In software, this includes backend/frontend engineers, QA/test automation engineers, UI/UX designers, and DevOps/SREs.

* **Core Responsibilities**:
  - Creating a plan for the Sprint (the **Sprint Backlog**).
  - Instilling quality by adhering to the **Definition of Done (DoD)**.
  - Adapting their plan each day toward the **Sprint Goal**.
  - Holding each other accountable as professionals.
* **Anti-Patterns & Traps**:
  - *Siloed Specialists*: "I am a backend engineer, I don't touch frontend or write automated tests." High-performing teams possess **T-shaped skills**—deep expertise in one domain, with the ability to assist across the stack.
  - *Throwing Code Over the Wall*: Writing code and tossing it to a separate QA team to test. In modern Scrum, testing is an integral part of the development activity.

---

## 2. The 5 Scrum Events (Ceremonies)

Every Scrum event is a formal opportunity to **inspect and adapt** Scrum artifacts. They are purposefully designed to enable critical transparency and eliminate the need for unplanned, wasteful ad-hoc status meetings.

<AgileScrumLifecycleDiagram />

---

### Event 1: The Sprint
The Sprint is the heartbeat of Scrum, where ideas are turned into value. Sprints are fixed-length iterations of **one to four weeks** (two weeks is the industry standard). A new Sprint starts immediately after the conclusion of the previous Sprint.

* **Inviolable Sprint Rules**:
  1. No changes are made that would endanger the **Sprint Goal**.
  2. Quality goals do not decrease (the Definition of Done is non-negotiable).
  3. The Product Backlog is refined as needed.
  4. Scope may be clarified and re-negotiated between the PO and Developers as more is learned.
* **Sprint Cancellation**: A Sprint can be cancelled before the timebox expires only by the Product Owner if the Sprint Goal becomes obsolete (e.g., company pivot, sudden regulatory change).

---

### Event 2: Sprint Planning
Sprint Planning initiates the Sprint by laying out the work to be performed for the Sprint.

* **Timebox**: Maximum 8 hours for a one-month Sprint (typically **2 to 4 hours for a two-week Sprint**).
* **Three Key Topics Addressed**:
  1. **Topic 1: Why is this Sprint valuable?** The Product Owner proposes how the product could increase its value and utility. The whole team collaborates to define a **Sprint Goal**.
  2. **Topic 2: What can be Done this Sprint?** The Developers select items from the Product Backlog to include in the Sprint based on past performance (velocity) and current team capacity (vacations, on-call).
  3. **Topic 3: How will the chosen work get done?** For each selected item, the Developers decompose the work into technical tasks of one day or less.

```
SPRINT PLANNING STRUCTURE:
┌────────────────────────────────────────────────────────────────────────┐
│ PART 1: Business Value & Sprint Goal (PO leads context)                 │
│ ➔ "Why are we doing this? What customer metric does this move?"       │
├────────────────────────────────────────────────────────────────────────┤
│ PART 2: Scope Selection (Developers decide capacity)                   │
│ ➔ "What stories from the top of the backlog fit our net capacity?"     │
├────────────────────────────────────────────────────────────────────────┤
│ PART 3: Technical Decomposition (Developers design & breakdown)        │
│ ➔ "How will we build it? DB schema, API contract, test suite, tasks"   │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Event 3: Daily Scrum (Standup)
The purpose of the Daily Scrum is to **inspect progress toward the Sprint Goal** and adapt the Sprint Backlog as necessary, producing an actionable plan for the next 24 hours.

* **Timebox**: Strictly **15 minutes** every working day at the same time and place.
* **Who Attends**: Exclusively for the **Developers**. The SM and PO may attend as observers, but the meeting is an internal engineering sync.
* **Structure Options**:
  - *Classic 3 Questions*: What did I do yesterday that helped achieve the Sprint Goal? What will I do today? Do I see any impediments?
  - *Walk the Board (Recommended)*: Starting from right to left (**Done ➔ Testing ➔ In Review ➔ In Progress**), review in-flight tickets. This reinforces the core flow principle: **"Stop starting, start finishing."**
* **The 16th-Minute Rule**: Never debug complex architectural problems or have a two-person debate during the 15-minute window. Flag the issue as a blocker, schedule a sidebar immediately after, and let the rest of the team return to deep work.

---

### Event 4: Sprint Review (Demo)
The purpose of the Sprint Review is to **inspect the outcome of the Sprint and determine future adaptations**. The Scrum Team presents the results of their work to key business stakeholders.

* **Timebox**: Maximum 4 hours for a one-month Sprint (typically **1 to 2 hours for a two-week Sprint**).
* **Key Principles**:
  - **Show Working Software**: Never present PowerPoint slides, static Figma designs, or code snippets. Demonstrate running, working software in staging or production.
  - **Collaborative Feedback**: This is not an approval gate or executive exam; it is a collaborative session where stakeholders interact with the product and provide real-world reactions.
  - **Backlog Adaptation**: The Product Backlog is reviewed and adjusted on the spot based on stakeholder feedback, market shifts, and budget updates.

---

### Event 5: Sprint Retrospective
The purpose of the Sprint Retrospective is to **plan ways to increase quality and effectiveness**. It is the primary engine of continuous organizational improvement.

* **Timebox**: Maximum 3 hours for a one-month Sprint (typically **1 to 1.5 hours for a two-week Sprint**).
* **Who Attends**: The complete Scrum Team (Developers, Scrum Master, Product Owner). Stakeholders and outside managers are **not permitted**, preserving psychological safety.
* **The Prime Directive** (Norm Kerth):
  > *"Regardless of what we discover, we understand and truly believe that everyone did the best job they could, given what they knew at the time, their skills and abilities, the resources available, and the situation at hand."*
* **Retrospective Flow**:
  1. *Set the Stage*: Check-in, safety poll, review previous sprint's action items.
  2. *Gather Data*: Timelines, metrics (velocity, escaped bugs, PR cycle time), subjective observations ("What went well", "What was painful").
  3. *Generate Insights*: Group items, run root-cause analysis (e.g., the **5 Whys** technique).
  4. *Decide Actions*: Vote and commit to **1 or 2 concrete, measurable process improvement actions** for the next sprint. Assign a clear engineer owner to each.
  5. *Close Retro*: Quick appreciation and checkout.

---

### Activity: Backlog Refinement (Grooming)
While not an official "event" in the 2020 Scrum Guide, continuous refinement is essential for predictable delivery. Teams typically spend **5% to 10% of their sprint capacity** refining upcoming items.

* **Activities**: Decomposing large epics into smaller user stories, clarifying acceptance criteria with the **Three Amigos** (Product, Engineering, QA), identifying technical dependencies, and assigning relative story point estimates.

---

## 3. Scrum Artifacts & Commitments

Scrum’s artifacts represent work or value. They are designed to maximize transparency of key information. Each artifact contains a specific **commitment** to guarantee accountability.

```
ARTIFACTS & THEIR INSEPARABLE COMMITMENTS:
┌───────────────────────────┬───────────────────────────────────────────┐
│ Scrum Artifact            │ Inseparable Commitment                    │
├───────────────────────────┼───────────────────────────────────────────┤
│ 1. Product Backlog        │ ➔ Product Goal (Long-term target)         │
│ 2. Sprint Backlog         │ ➔ Sprint Goal (Single sprint focus)       │
│ 3. Increment              │ ➔ Definition of Done (Quality contract)   │
└───────────────────────────┴───────────────────────────────────────────┘
```

### Artifact 1: Product Backlog ➔ Committed to the Product Goal
The Product Backlog is an emergent, ordered list of what is needed to improve the product.
- **Product Goal**: Describes a future state of the product which can serve as a target for the Scrum Team to plan against. The team must fulfill or abandon one goal before taking on another.
- **DEEP Backlog Criteria**:
  - **D**etailed Appropriately: Items near the top have granular acceptance criteria; items near the bottom are broad epics.
  - **E**stimated: Sized with relative story points.
  - **E**mergent: Continuously updated as new insights arrive.
  - **P**rioritized: Strictly ordered from highest to lowest business value/risk.

---

### Artifact 2: Sprint Backlog ➔ Committed to the Sprint Goal
The Sprint Backlog is composed of:
1. The **Sprint Goal** (why).
2. The set of **Product Backlog items selected for the Sprint** (what).
3. An **actionable plan for delivering the Increment** (how).

The Sprint Backlog is created by and for the Developers. It is updated throughout the Sprint as more is learned. If work turns out to be different than expected, the Developers collaborate with the Product Owner to adjust the scope without compromising the Sprint Goal.

---

### Artifact 3: The Increment ➔ Committed to the Definition of Done
An Increment is a concrete stepping stone toward the Product Goal. Multiple Increments may be created within a Sprint. The moment a Product Backlog item meets the **Definition of Done**, an Increment is born.

- If an item does not meet the Definition of Done, it **cannot be released, demonstrated at the Sprint Review, or counted in team velocity**. It returns to the Product Backlog.

---

## Definition of Ready (DoR) vs. Definition of Done (DoD)

Engineering organizations often confuse or conflate these two critical quality gates. Here is how they differ:

| Dimension | Definition of Ready (DoR) | Definition of Done (DoD) |
|---|---|---|
| **Where it applies** | Entry Gate: At the boundary between Backlog Refinement and Sprint Planning. | Exit Gate: At the boundary between In Progress and Release/Done. |
| **Question it answers** | *"Is this user story understood, estimated, and unblocked enough to start building?"* | *"Is this piece of code tested, secure, and production-ready?"* |
| **Who enforces it** | The **Developers** (rejecting half-baked stories from entering the sprint). | The **Whole Team** (rejecting untested or unverified code from being merged/shipped). |
| **Risk of violation** | Confusion, mid-sprint scope rework, blocked dependencies. | Production outages, security breaches, data corruption, technical debt. |

### Production Definition of Ready (DoR) Checklist

Before a ticket is pulled into a Sprint:
- [ ] User story follows the standard template: *As a [persona], I want to [action], so that [business value]*.
- [ ] Acceptance criteria are explicitly written in **Given-When-Then** (BDD) format.
- [ ] Three Amigos kickoff completed (Product, Dev, QA alignment).
- [ ] Sized with relative story points (typically $\le 8$ points; larger items split).
- [ ] UI/UX Figma mocks provided, reviewed, and finalized with empty/error/loading states.
- [ ] External API contracts and architectural dependencies identified and accessible.
- [ ] Security, compliance, and privacy constraints (GDPR/PII) flagged.

### Production Definition of Done (DoD) Checklist

Before code is marked as complete:
- [ ] Business logic implemented and strictly meets all Acceptance Criteria.
- [ ] Unit test coverage $\ge 80\%$ with all edge cases and boundary conditions verified.
- [ ] Integration tests pass against test containers or staging dependencies.
- [ ] Code reviewed and approved by at least 2 senior engineers via Pull Request.
- [ ] Static analysis passes: SonarQube zero new bugs, zero vulnerabilities, zero code smells.
- [ ] Performance verified: p99 response time within agreed SLA (e.g., $< 200\text{ ms}$).
- [ ] Observability in place: Structured logging, Prometheus metrics, and distributed trace headers instrumented.
- [ ] Database migration scripts written, backward-compatible, and tested against real data scale.
- [ ] Deployed and verified in the Staging environment without regression.
- [ ] User-facing documentation or API changelog (OpenAPI/Swagger) updated.

---

## Next Steps

- Learn how to estimate work and interpret agile charts in **[Estimation, Velocity & Metrics](./estimation-metrics)**.
- See how cross-functional squads operate day-to-day in **[Modern Way of Working (WoW)](./ways-of-working)**.
