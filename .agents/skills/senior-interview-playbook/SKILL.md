---
name: senior-interview-playbook
description: Always include a Senior/Staff Interview Playbook with tips, tricks, classic interviewer traps, principal rebuttals, and senior framing matrices for every technical knowledge article added to or updated in the website.
---

# Skill: Senior/Staff Technical Interview Playbook

This skill mandates that **every technical knowledge article, concept deep-dive, system design guide, or interview question file** added to or updated in `docs/technical-knowledge/` MUST include a dedicated **Senior/Staff Interview Playbook** section containing actionable tips, tricks, classic interviewer traps, principal rebuttals, and senior framing strategies.

Read the complete domain-specific trap catalog and copy-paste templates at:
[references/INTERVIEW_PLAYBOOK_GUIDELINES.md](./references/INTERVIEW_PLAYBOOK_GUIDELINES.md)

---

## When to Trigger This Skill (MANDATORY)

You **MUST ALWAYS** apply this skill whenever:
1. **Adding new knowledge** anywhere under `docs/technical-knowledge/` (Java, Spring, System Design, Databases, Kafka, Networking, Operating Systems, Security, AI/GenAI, Banking, DevOps, Testing, or Architecture).
2. **Updating or expanding existing knowledge** pages with new concepts, videos, or architectural patterns.
3. **Writing or auditing interview question collections** in `docs/technical-knowledge/interview-questions/`, `docs/technical-knowledge/java/`, or `docs/technical-knowledge/spring/`.

---

## Mandatory Structure of a Senior/Staff Interview Playbook

Every knowledge article must include a dedicated section near the bottom of the page (immediately before or after the Production Checklist / Summary Matrix) titled:

```markdown
## 🧠 Senior/Staff Interview Playbook: How to Ace [Topic] Interviews
```

This section **MUST** contain the following three components:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                 SENIOR / STAFF INTERVIEW PLAYBOOK ANATOMY                │
├─────────────────────────────────┬────────────────────────────────────────┤
│ 1. The Senior Framing Strategy  │ How to open the answer like a Staff/   │
│    (First 60 Seconds)           │ Principal Engineer (invariants, math,  │
│                                 │ failure domains, Day-2 ops).           │
├─────────────────────────────────┼────────────────────────────────────────┤
│ 2. Classic Interviewer Traps &  │ 3 to 5 probing follow-up traps showing │
│    Principal Rebuttals          │ Junior/Mid trap answer vs. Principal   │
│                                 │ rebuttal backed by engine mechanics.   │
├─────────────────────────────────┼────────────────────────────────────────┤
│ 3. Mid-Level vs. Principal      │ High-signal comparative table upgrading│
│    Candidate Cheat Sheet        │ surface phrases into Staff-level depth.│
└─────────────────────────────────┴────────────────────────────────────────┘
```

### Component 1: The Senior Framing Strategy (How to Open Your Answer)
Explain how a Senior/Staff candidate frames the topic in the first 60 seconds of an interview before drawing boxes or writing code:
- **State Non-Negotiable Invariants Upfront**: Define the physical or business invariant first (e.g., $\sum \text{Debits} - \sum \text{Credits} = 0$, strict serializability, happens-before memory visibility, or bounded tail latency).
- **Back-of-the-Envelope Capacity & Hardware Physics**: Anchor the discussion with real numbers (e.g., Little's Law $L = \lambda \times W$,HikariCP pool formula $2 \times \text{CPU} + \text{Disk}$, B+Tree 16KB page splits, or CPU cache line 64-byte boundaries).
- **Proactive Failure-Mode Identification**: Call out what breaks under partial degradation (network partitions, GC pauses, clock drift, slow downstream partner APIs, poison pills) before the interviewer asks.
- **Day-2 Operational Realism**: Mention observability, metrics, safe rollbacks, feature flags, or offline reconciliation jobs.

### Component 2: Classic Interviewer Traps & Principal Rebuttals (3–5 Traps Minimum)
Interviewers at Tier-1 companies ask deceptive follow-up questions ("Can't we just use X?") to test whether a candidate has real production scars. Document **at least 3 to 5 traps** per topic using this exact format:

```markdown
#### Trap 1: "[Exact probing or deceptive question asked by the interviewer]"
* **Junior/Mid Answer:** *"[The naive, textbook, or surface-level answer that falls into the trap.]"*
* **Principal Rebuttal:**
  > *"[The authoritative rebuttal explaining WHY the naive approach fails in production under load, referencing physical engine truth (JMM, OS kernel, B+Tree, network buffers, proxies) and providing the exact production-grade solution or code snippet.]"*
```

### Component 3: Quick Reference — Mid-Level vs. Principal Candidate Cheat Sheet
Include a concise comparison table contrasting how a mid-level developer talks about the concept versus how a Principal Engineer communicates it:

```markdown
| Concept / Scenario | Mid-Level Candidate Says | Principal Candidate Demonstrates |
|:---|:---|:---|
| **[Concept A]** | *"[Vague or textbook statement]"* | *"[Precise architectural mechanism, trade-off, and failure mitigation]"* |
```

---

## Execution Workflow When Adding Knowledge

1. **Draft Core Technical Content**: Write the deep-dive technical content and interactive React SVG diagram following `senior-architect-review` and `design-diagrams`.
2. **Synthesize the Interview Playbook**:
   - Identify the **top 3–5 questions** a Staff interviewer at Google, Stripe, Netflix, Amazon, or Meta would ask to stress-test a candidate on this specific topic.
   - Consult [references/INTERVIEW_PLAYBOOK_GUIDELINES.md](./references/INTERVIEW_PLAYBOOK_GUIDELINES.md) for domain benchmarks.
   - Write the **Senior Framing Strategy**, **Interviewer Traps & Principal Rebuttals**, and **Cheat Sheet Table**.
3. **Verify Code & Math Formatting**:
   - Ensure any inline currency (`\$100`) escapes the dollar sign so KaTeX does not misinterpret prose as math.
   - Ensure code snippets inside rebuttals are syntactically valid and memory-safe.
4. **Add/Update Automated Tests**:
   - Verify or add test coverage in `tests/` confirming the new documentation and interview playbook sections exist and compile cleanly with MDX.
