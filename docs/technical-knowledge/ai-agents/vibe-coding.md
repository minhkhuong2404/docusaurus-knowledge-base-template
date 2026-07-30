---
id: vibe-coding
title: "The Vibe Coding Handbook"
sidebar_label: 🚀 Vibe Coding
description: Actionable guidelines, workflow frameworks, best practices, and anti-patterns for software development in the era of AI agentic orchestration.
tags: [ai-agents, vibe-coding, software-engineering, workflows, prompt-engineering, developer-productivity, context-engineering, context-compaction]
---

import VibeCodingWorkflowDiagram from '@site/src/components/VibeCodingWorkflowDiagram';
import VibeCodingStrategiesDiagram from '@site/src/components/VibeCodingStrategiesDiagram';

# The Vibe Coding Handbook

As AI coding agents become more powerful, the primary bottleneck in software engineering shifts from **syntax generation** (how to write code) to **system orchestration** (what to build, how to structure it, and how to verify it). 

This is the paradigm of **Vibe Coding**. This handbook details the core workflow, best practices, and common pitfalls of vibe coding to help you build software at unprecedented speed while maintaining high quality.

---

## 🧭 The Vibe Coding Workflow

Vibe coding is not "lazy coding." It is a disciplined feedback loop where the developer acts as the **director** and the AI agent acts as the **operator**. The workflow has three distinct phases:

<VibeCodingWorkflowDiagram />

### Phase 1: Plan & Specify (The Architect)
Before you type a single prompt, you must know what you are building. 
*   **Write an implementation plan:** Create a temporary scratch document or markdown file outlining:
    *   The goal.
    *   Proposed files to create or modify.
    *   API schemas, data structures, and edge cases.
*   **Establish boundaries:** Decide on the tech stack, library versions, and patterns (e.g., SOLID, Clean Architecture) before starting the coding agent.

### Phase 2: Guide & Implement (The Director)
Now, spawn the agent or use your IDE composer (like Cursor Composer, Windsurf, or Antigravity):
*   **Work incrementally:** Never ask the agent to build the entire app at once. Ask it to do **one specific task** from your plan (e.g., *"Create the database entity class and repository"*).
*   **Feed error logs directly:** If a command fails, copy-paste the compiler error or stack trace directly into the chat and say: *"This failed. Inspect the log and propose a fix."*
*   **Steer, don't type:** If the agent takes a wrong approach, interrupt it and correct its path: *"Do not use a library for this. Write a helper function instead."*

### Phase 3: Verify & Review (The QA/Reviewer)
This is the most critical phase. **Never accept code blindly.**
*   **Review Git Diffs:** Carefully inspect every line of code the agent modifies before committing. Look for:
    *   Accidental deletions of existing logic.
    *   Security flaws (hardcoded credentials, SQL injection).
    *   Duplicated functions.
*   **Run Compilers & Linters:** Immediately run your build/compile scripts.
*   **Run Tests:** Keep a test suite active and make sure the agent runs tests after every major file change.

---

## 💡 Best Practices for Vibe Coding

To achieve maximum efficiency with AI agents, structure your code and your habits around these best practices:

### 1. Structure Code for AI Readability
AI agents have a limited context window. Large, monolithic files confuse them.
*   **Keep files small & modular:** Follow the **Single Responsibility Principle (SRP)**. If a file is under 150 lines, the agent can read and modify it perfectly without forgetting context.
*   **Write clear docstrings/interfaces:** If your code has clear function names, types, and Javadocs/docstrings, the agent can understand how to call your classes without reading the implementation code.

### 2. Manage the Context Window (Token Budget)
Every file you open in your IDE or mention in your prompt gets sent to the LLM. 
*   **Close irrelevant files:** Keep only files related to your current task open.
*   **Use selective references:** Use `@file` tags or file-linking features to send only the files the agent absolutely needs. 

### 3. Fail Fast with Automated Verifications
Make it incredibly easy for the agent to check its own work:
*   Have single-line commands for validation: e.g., `npm run test` or `./gradlew test`.
*   Direct the agent to run these scripts as tools. For example, say: *"Implement this service, and then run `npm run test` to verify it passes."*

### 4. Maintain an Active Project Map
When working on large codebases, agents can lose track of overall architecture. Keep a `docs/` folder or a README file describing the system architecture and guidelines. Always feed this file to the agent as a reference when starting new features.

### ❌ Pitfall 5: Library Version Hallucination
*   **The Symptom:** The agent generates code referencing non-existent library methods or deprecated syntax (e.g., using Spring Boot 2.x `@Autowired` setter injection when working in Spring Boot 3.3).
*   **The Risk:** Infinite compiler errors and broken dependencies.
*   **The Fix:** Explicitly state modern library versions in your system prompt or `AGENTS.md` file (e.g., *"Java 21, Spring Boot 3.3.x, JUnit 5. Use records for DTOs"*).

### ❌ Pitfall 6: Dependency Inflation ("Package Bloat")
*   **The Symptom:** For every minor helper task (e.g., parsing a string or formatting dates), the agent adds a new npm package or Maven dependency.
*   **The Risk:** Bloated build artifacts, supply chain security risks, and version conflicts.
*   **The Fix:** Add a strict rule: *"Do NOT introduce new third-party dependencies without explicit user confirmation. Use language standard libraries first."*

### ❌ Pitfall 7: Over-refactoring Unrelated Files
*   **The Symptom:** You ask the agent to add one field to `UserDTO.java`, and it refactors 12 controllers, renames 4 services, and reformats the entire project's indentation.
*   **The Risk:** Mass merge conflicts, broken regression tests, and unreviewable git diffs.
*   **The Fix:** Use **Scoped Prompting**: *"Modify ONLY `UserDTO.java` and `UserRepository.java`. Do not touch any other files."*

### ❌ Pitfall 8: Ignoring Test Suite Warnings
*   **The Symptom:** The agent declares *"Feature complete!"* after writing code, but when you run tests, 3 existing regression tests fail silently.
*   **The Risk:** Pushing broken features to staging or production.
*   **The Fix:** Direct the agent to execute the full test suite (`npm run test` or `./gradlew test`) and confirm 100% pass before accepting diffs.

### ❌ Pitfall 9: Architectural Coupling ("Spaghetti Abstraction")
*   **The Symptom:** The agent bypasses service or repository layers, making raw DB queries inside UI components or API controllers to "get it working faster."
*   **The Risk:** Severe architectural debt and broken separation of concerns.
*   **The Fix:** Define your layer architecture in `AGENTS.md` and review diffs to ensure logic resides in the correct architectural layer.

### ❌ Pitfall 10: Secret Leakage in Prompts
*   **The Symptom:** Pasting real API keys, database credentials, or private user data into chat prompts or code files created by the agent.
*   **The Risk:** Security breaches, credential leaks in git history or third-party LLM logs.
*   **The Fix:** Use environment variables (`.env` or OS env) and never paste production secrets into LLM prompts.

---

## 🎯 Vibe Coding Strategies by Project Type

<VibeCodingStrategiesDiagram />


### 1. Greenfield (0-to-1) Projects
- **Goal:** Rapid prototype to working architecture without accumulating early tech debt.
- **Workflow:**
  1. Generate an explicit `ARCHITECTURE.md` and database schema outline first.
  2. Implement backend data layer -> API service layer -> Frontend components sequentially.
  3. Create an initial `AGENTS.md` defining stack constraints before writing application code.

### 2. Legacy Codebases & Major Refactors
- **Goal:** Safely modify code without breaking existing production behavior.
- **Workflow:**
  1. **Lock down regression tests first:** Ensure high test coverage exists on the legacy module before modifying it.
  2. **Scoped execution:** Edit one isolated file at a time.
  3. Provide exact interfaces and docstrings to the agent rather than loading the whole codebase into context.

### 3. Production Bug Fixing & Triage
- **Goal:** Surgical diagnostic and remediation with zero side effects.
- **Workflow:**
  1. Feed the exact stacktrace and environment details into context.
  2. Ask the agent to write a **failing regression test** reproducing the issue *before* touching application code.
  3. Apply the fix and verify that the new test passes alongside all existing tests.

---

## ⚠️ Common Pitfalls (And How to Avoid Them)

Avoid these common vibe-coding anti-patterns:

### ❌ Pitfall 1: Blind Trust ("Ghost Coding")
*   **The Symptom:** You ask the agent to add a feature, it writes 500 lines of code, and you click "Accept All" and commit it without reading.
*   **The Risk:** The app works today, but has hidden bugs, memory leaks, or spaghetti logic that will make it impossible to maintain next month.
*   **The Fix:** Read every diff. Ask the agent: *"Why did you make this change in this specific file?"*

### ❌ Pitfall 2: Prompt Dumping
*   **The Symptom:** You paste a 2,000-word prompt containing 15 features, UI requirements, database changes, and test instructions at once.
*   **The Risk:** The agent gets overwhelmed, misses 5 requirements, halluncinates code, and creates compilation errors.
*   **The Fix:** Break it down. Execute one requirement at a time. Commit the code, verify, then prompt the next step.

### ❌ Pitfall 3: The Infinite Guessing Loop
*   **The Symptom:** The agent creates a bug. You say *"It's broken, fix it."* The agent guesses a fix, creates a new bug, and you repeat *"Still broken, fix it."* This loop repeats 10 times.
*   **The Risk:** Code degradation. The agent keeps layering quick fixes on top of quick fixes, turning your code into spaghetti.
*   **The Fix:** Break the loop. Stop the agent. Look at the code yourself, locate the root cause, and tell the agent: *"The bug is because of X. Modify the function Y to handle it this way."*

### ❌ Pitfall 4: Context Drift
*   **The Symptom:** After 20+ turns of debugging, the agent starts ignoring the architectural constraints you set at the start of the session. It uses the wrong patterns, imports the wrong libraries, or re-introduces bugs it already fixed.
*   **The Risk:** The agent's "effective persona" has drifted from "senior engineer following conventions" to "debugging assistant focused on the immediate error." Early instructions are effectively forgotten.
*   **The Fix:** Compact the session (use `/compact` or start a fresh session) and feed a concise handoff prompt summarizing what was done and what the next task is.

---

## 🧠 Context Engineering for Vibe Coders (2026)

> **The 2026 upgrade:** Vibe coding matured from "prompting" to **context engineering** — the discipline of managing what the agent sees, when it sees it, and how much fits in its working memory.

### What is Context Engineering?

The context window is the agent's RAM. Context engineering is RAM management:

| Old (Prompt Engineering) | New (Context Engineering) |
|:---|:---|
| "How do I phrase this question?" | "What is the optimal set of tokens the model needs right now?" |
| Load all open files into context | Load only the 2–3 files relevant to the current task |
| Keep the whole conversation history | Compact at 70% capacity; summarize old steps |
| One model for everything | Route simple tasks to fast/cheap models |
| Long sessions until the task is done | Reset between features; use handoff prompts |

### Context Rot — The Silent Agent Killer

**Context rot** is the gradual degradation of agent quality as its context fills — _before_ hitting hard limits.

```
Turn 1:  "Build a REST controller for /api/orders"
         → Perfect, idiomatic code ✅

Turn 15: "Add validation to the orders endpoint"
         → Mixes in code from other files, duplicates existing methods ⚠️

Turn 25: "Fix the import error"
         → Re-introduces a bug that was fixed in Turn 8 ❌
```

**Signs you have context rot:**
- Agent contradicts decisions it made earlier
- Agent duplicates code it already wrote
- Agent introduces bugs that were already fixed

**Immediate fix:** Use `/compact` or start a fresh session with a handoff prompt (see below).

### The Context Reset Handoff Pattern

When you notice context drift or rot, the fastest fix is a **fresh session with a curated handoff**:

```markdown
## Handoff (paste into new session)

### What was done
- Added `PaymentService.processTransfer()` with idempotency key check
- Fixed NPE when `recipientId` is null — null check on line 42
- All tests pass (including new `testIdempotentTransfer`)

### Current state
- Modified: PaymentService.java, PaymentServiceTest.java
- Build: GREEN ✅

### Next task
Add rate limiting to `processTransfer()` — max 10 calls/minute per sender.
Use our existing Redis rate limiter at `infrastructure/RateLimiter.java`.
```

This costs ~200 tokens instead of carrying 50,000 tokens of accumulated history.

### Scoped Prompting

A **scoped prompt** tells the agent exactly what it may and may not touch:

```
❌ Unscoped: "Refactor the payment module"
   → Agent rewrites half the codebase, touches files it shouldn't

✅ Scoped: "In PaymentService.java only, extract the validation logic
   on lines 45-78 into a private method called validateTransfer().
   Do NOT touch any other file. Run the tests after."
   → Agent makes exactly the surgical change requested
```

**Scoping vocabulary:**

| Constraint | Example |
|:---|:---|
| **File scope** | "Only modify `PaymentService.java`" |
| **Line scope** | "Only the `processTransfer()` method, lines 45–120" |
| **Library scope** | "Do not add new dependencies — use only existing imports" |
| **Approach scope** | "Do not use Lombok. Do not use reflection." |
| **Size scope** | "This should be a 10–20 line change, not a full refactor" |

### The AGENTS.md / CLAUDE.md Pattern

Create a project configuration file the agent loads at session start — eliminating the need to re-explain your project's conventions every time:

```markdown
# AGENTS.md — Project Rules

## Stack
- Java 21, Spring Boot 3.3.x, no Lombok (use records)
- PostgreSQL 16, Flyway migrations, JUnit 5 + Testcontainers

## Build & Test
- Build: `./gradlew build`
- Test: `./gradlew test`

## Constraints
- Do NOT modify the DB schema directly — only via Flyway
- Do NOT hardcode credentials
- Ask before refactoring code outside the current task scope
```

> **Keep AGENTS.md lean.** A bloated configuration file is a form of context pollution — it wastes tokens on irrelevant constraints and dilutes the signal of what actually matters right now.

---

## 🎨 Case Study: Building a Spring Boot REST Endpoint

Here is a comparison of how a traditional developer vs. a vibe coder builds a new REST API endpoint:

```
[Traditional Developer]                    [Vibe Coder]
1. Write Controller class manually.        1. Prompt: "Create a REST controller for `/api/orders`
2. Write Service interface & impl.             using standard JPA patterns."
3. Write Repository interfaces.            2. Review generated files + Diffs.
4. Write DTOs and mapper logic.             3. Prompt: "Run the project test suite and verify
5. Manually compile and debug imports.         compile passes."
6. Write integration tests.                 4. Prompt: "Write integration tests for the controller
                                               testing validation and edge cases."
                                            5. Review git diff and click Accept.
```

By transitioning to the **Vibe Coding** paradigm, the developer shifts focus from writing repetitive boilerplate to directing architecture, styling, security, and verification—boosting development throughput by up to **10x** while maintaining software quality.

---

## 📚 Go Deeper

- **[Context Engineering Guide](./context-engineering)** — Deep dive into context compaction, model routing, thinking budget, subagents, and all the advanced 2026 concepts referenced here.
- **[AI Agent Architectures](./agents)** — ReAct loops, multi-agent patterns, and production engineering of agents.
- **[Agent Skills: MCP, RAG & Memory](./skills)** — Tool design, Model Context Protocol (MCP), RAG, and memory systems.
