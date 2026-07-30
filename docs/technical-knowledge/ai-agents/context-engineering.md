---
id: context-engineering
title: "Context Engineering, Compaction & Advanced Vibe Coding"
sidebar_label: "🧠 Context Engineering"
description: A deep-dive into Context Engineering, Context Compaction, Context Rot, Model Routing, Thinking Budget, AGENTS.md/CLAUDE.md configuration, and advanced Vibe Coding discipline for 2026.
tags: [ai-agents, context-engineering, context-compaction, mcp, vibe-coding, model-routing, thinking-budget, prompt-engineering, subagents]
---

import ContextEngineeringStrategiesDiagram from '@site/src/components/ContextEngineeringStrategiesDiagram';
import ContextCompactionDiagram from '@site/src/components/ContextCompactionDiagram';
import ModelRoutingArchitectureDiagram from '@site/src/components/ModelRoutingArchitectureDiagram';
import ThinkingBudgetDiagram from '@site/src/components/ThinkingBudgetDiagram';
import SubagentIsolationDiagram from '@site/src/components/SubagentIsolationDiagram';

# Context Engineering, Compaction & Advanced Vibe Coding

> **The shift is complete.** In 2024, developers learned _prompt engineering_ — how to phrase a question. In 2025–2026, the field moved to **context engineering** — the discipline of managing _what_ the agent sees, _when_ it sees it, and _how much_ of it fits in working memory.

This guide covers the concepts that separate amateur vibe coders from production-grade AI engineers:

- [Context Engineering](#context-engineering)
- [Context Rot & Context Drift](#context-rot--context-drift)
- [Context Compaction & Summarization](#context-compaction--summarization)
- [AGENTS.md / CLAUDE.md — The Agent Configuration File](#agentsmd--claudemd-the-agent-configuration-file)
- [Model Routing & Thinking Budget](#model-routing--thinking-budget)
- [Subagents & Context Isolation](#subagents--context-isolation)
- [Advanced Vibe Coding Discipline](#advanced-vibe-coding-discipline)

---

## Context Engineering

### What is it?

**Context engineering** is the practice of deliberately designing, curating, and managing every token that enters an AI agent's context window — including system prompts, conversation history, retrieved documents, tool definitions, and execution state.

> Think of the context window as RAM. Context engineering is RAM management for LLMs.

Prompt engineering asks: *"How do I phrase this question well?"*
Context engineering asks: *"What is the optimal set of information this model should hold in working memory at each step of a long-running task?"*

```
Prompt Engineering (2023):
  "Write me a function that sorts a list"  →  Good output

Context Engineering (2026):
  System Prompt: "You are a Java backend engineer on the payments team."
  Loaded Files:  [PaymentService.java, OrderRepository.java]
  Rules:         [coding-standards.md, AGENTS.md]
  Tool State:    {last_test_run: "2 failures", open_files: ["PaymentService.java"]}
  History:       [Summarized 20 earlier steps]
  Task:          "Add idempotency to the transfer method"
  
  → Much higher-quality, contextually-aware output
```

### The four strategies of Context Engineering

<ContextEngineeringStrategiesDiagram />


| Strategy | What it does | When to use |
|:---|:---|:---|
| **Retrieval** | Dynamically load only the files, facts, and tools relevant to the current step | Long-running tasks with large codebases or knowledge bases |
| **Offloading** | Move completed state (old tool results, resolved variables) to external storage | After each major step in a multi-step pipeline |
| **Isolation** | Spawn subagents with fresh contexts for independent subtasks | When a subtask doesn't need the parent's full history |
| **Compression** | Summarize the oldest portion of history before it overflows | Proactively, at 60–70% context capacity |

---

## Context Rot & Context Drift

### Context Rot

**Context rot** is the gradual degradation of an agent's reasoning quality as its context window fills up — _before_ hitting hard token limits.

```
Turn 1:   "Build a REST controller for /api/orders"
          → Agent writes perfect, idiomatic code ✅

Turn 12:  "Now add validation to the orders endpoint"
          → Agent starts mixing in code from unrelated files it "remembered" earlier
          → Introduces a duplicate method already defined in Turn 5 ⚠️

Turn 22:  "Fix the import error"
          → Agent re-introduces the original bug it fixed in Turn 8
          → Cannot recall key architectural decisions from Turn 2 ❌
```

**Why it happens:** LLMs use attention mechanisms that focus less precisely on early tokens when the context is large. The further back a piece of information is, the less reliably the model attends to it.

**Signs of context rot:**
- Agent starts contradicting earlier decisions
- Agent duplicates code it already created
- Agent "forgets" the architectural constraints you gave at the start
- Agent introduces bugs that were already fixed earlier

**The fix:** Proactive context compaction + structured state.

### Context Drift

**Context drift** is when the agent's _persona_, _goal_, or _constraints_ gradually shift away from the original intent due to accumulated conversational history overriding the original system prompt.

```
Original intent: "Senior backend engineer focused on performance"

After 30 turns of debug messages and error logs:
  The model's effective "persona" has shifted toward:
  "Debugging assistant focused on immediate errors"
  
  → It starts ignoring performance constraints it was given at the start
```

**The fix:** Periodically reset or reinforce the system prompt. Use `/compact` commands or start fresh sessions between major features.

---

## Context Compaction & Summarization

### The problem: The Token Tax

Every step of an agentic loop re-sends the entire accumulated history to the model. This compounds:

```
Step 1:  Send 2,000 tokens    → cost: $0.003
Step 5:  Send 15,000 tokens   → cost: $0.023
Step 10: Send 45,000 tokens   → cost: $0.068
Step 20: Send 120,000 tokens  → cost: $0.180
           ↑ 60× the cost of step 1 for roughly the same task
```

This is called the **token tax** — the compounding overhead of re-sending history and tool results at every inference step.

### What is Context Compaction?

**Context compaction** (also called **context compression**) is the process of reducing the token footprint of an agent's working memory without losing task-critical information.

<ContextCompactionDiagram />

---


### When to compact

> **Golden Rule:** Compact _proactively_ at **60–75% context capacity**. Do not wait for the limit. A model with 30% headroom reasons far better than one at 95% capacity.

```python
class SmartContextManager:
    COMPACT_THRESHOLD = 0.70  # Compact at 70% full

    def __init__(self, model_context_limit: int):
        self.limit = model_context_limit
        self.messages = []

    def add_message(self, msg: dict):
        self.messages.append(msg)
        usage = self.count_tokens() / self.limit

        if usage > self.COMPACT_THRESHOLD:
            print(f"⚠️  Context at {usage:.0%} — compacting...")
            self._compact()

    def _compact(self):
        """Summarize the oldest half of messages."""
        system_msg = self.messages[0]          # Always keep system prompt
        recent_msgs = self.messages[-10:]       # Always keep last 10 turns
        old_msgs = self.messages[1:-10]

        if not old_msgs:
            return

        summary = llm.summarize(
            "Summarize this conversation history, preserving all "
            "key decisions, code changes, bugs fixed, and open issues:\n"
            + json.dumps(old_msgs)
        )

        self.messages = [
            system_msg,
            {"role": "system", "content": f"[History summary]: {summary}"}
        ] + recent_msgs
```

### Tool result pruning

Accumulated tool results are often the biggest source of context bloat. A file read returning 5,000 tokens of code is only needed for 1–2 subsequent steps:

```python
def prune_stale_tool_results(messages: list, keep_last_n: int = 3) -> list:
    """
    Remove old tool result messages that are no longer needed.
    Keep only the N most recent tool results to reduce token noise.
    """
    tool_result_indices = [
        i for i, m in enumerate(messages)
        if m.get("role") == "tool"
    ]

    stale_indices = set(tool_result_indices[:-keep_last_n])

    return [
        m for i, m in enumerate(messages)
        if i not in stale_indices
    ]
```

---

## AGENTS.md / CLAUDE.md — The Agent Configuration File

### What are they?

`AGENTS.md`, `CLAUDE.md`, and `.cursorrules` are **project-scoped instruction files** that act as a persistent system prompt loaded by AI agents at the start of every session.

They solve the problem of re-explaining your project's conventions, constraints, and architecture every time you start a new coding session.

```
Without AGENTS.md:
  Every session: "We're using Spring Boot 3.x, Java 21, PostgreSQL,
                  no Lombok, service layer must be transactional,
                  use record classes for DTOs, tests with JUnit 5..."

With AGENTS.md:
  Agent reads the file → already knows all of this
  First prompt: "Add a search endpoint to OrderController"
  → Agent immediately follows all conventions ✅
```

### Anatomy of a good AGENTS.md

```markdown
# Project: Payment Platform API

## Stack
- Java 21 (use records, sealed classes, pattern matching)
- Spring Boot 3.3.x (no Lombok — use records for DTOs)
- PostgreSQL 16 (JPA/Hibernate, no native queries unless profiled)
- Redis for caching (use @Cacheable, TTL always specified)
- JUnit 5 + Testcontainers for integration tests

## Coding Standards
- Service methods must be @Transactional
- All DTOs are Java records
- Exceptions extend RuntimeException, use global @ControllerAdvice
- No System.out.println — use SLF4J Logger
- Every public method needs a Javadoc

## Build & Test
- Build: `./gradlew build`
- Test: `./gradlew test`
- Run: `./gradlew bootRun`

## Constraints
- Do NOT modify the database schema directly — use Flyway migrations
- Do NOT hardcode credentials — use application.yml properties
- Ask before refactoring existing code outside the current task
- If a test fails, run it again before assuming the code is broken

## Current Task Context
- Working on: PROJ-1234 — Idempotent payment transfers
- Open issues: ConcurrentModificationException in PaymentBatch.java:42
```

### What to keep in AGENTS.md

| ✅ Include | ❌ Avoid |
|:---|:---|
| Tech stack versions and constraints | Every historical decision ever made |
| Build and test commands | Resolved bugs and completed features |
| Active coding standards | Lengthy explanations of basic concepts |
| Current task / open issues | Instructions for tools you don't use |
| Security/safety rules | Duplicate content from your README |

> **Key principle:** Keep it lean and current. A bloated `AGENTS.md` is a form of context pollution — it wastes tokens on irrelevant constraints and dilutes the signal.

---

## Model Routing & Thinking Budget

### Model Routing

**Model routing** is the automated process of directing specific tasks within an agentic pipeline to the most cost-appropriate AI model.

Using a frontier model (e.g., Claude Opus, GPT-4o) for every step is like using a Formula 1 car to pick up groceries — capable, but unnecessarily expensive.

<ModelRoutingArchitectureDiagram />

---


**Implementation:**

```python
class ModelRouter:
    
    FRONTIER = "claude-opus-4-5"
    MID_TIER = "claude-sonnet-4-5"
    FAST     = "claude-haiku-4-5"

    def route(self, task_type: str, complexity: int) -> str:
        """
        Route to the cheapest model that can handle the task.
        complexity: 1 (trivial) → 5 (very complex)
        """
        routing_map = {
            "planning":       self.FRONTIER,
            "complex_coding": self.MID_TIER  if complexity >= 4 else self.FAST,
            "simple_coding":  self.FAST,
            "formatting":     self.FAST,
            "summarization":  self.MID_TIER,
            "tool_call":      self.FAST,
            "critique":       self.FRONTIER  if complexity >= 4 else self.MID_TIER,
        }
        return routing_map.get(task_type, self.MID_TIER)
```

### Thinking Budget

The **thinking budget** controls how many tokens the model dedicates to internal reasoning _before_ producing a response.

Extended thinking allows the model to reason through complex multi-step problems internally. But it costs output tokens at 3–10× the rate of regular tokens.

```python
# Extended thinking with a token budget
response = client.messages.create(
    model="claude-opus-4-5",
    max_tokens=16000,
    thinking={
        "type": "enabled",
        "budget_tokens": 10000   # Model can use up to 10K tokens to "think"
    },
    messages=[{
        "role": "user",
        "content": "Design a distributed rate limiter for 100K RPS."
    }]
)

for block in response.content:
    if block.type == "thinking":
        print(f"[Internal reasoning — {len(block.thinking)} chars]")
    elif block.type == "text":
        print(f"Answer: {block.text}")
```

**Thinking budget strategy:**

<ThinkingBudgetDiagram />

> **Cost alert:** A 10,000-token thinking budget adds ~$0.75 to every call at Opus pricing. Use sparingly — only for genuinely complex reasoning tasks.

---

## Subagents & Context Isolation

### Why subagents?

A single agentic session accumulates context pollution from every step it takes. Subagents solve this by **isolating subtasks into fresh context windows**, preventing one task's output from contaminating another's reasoning.

<SubagentIsolationDiagram />

**Key principle:** The parent receives only the _final result_ of each subagent, not its internal reasoning chain or accumulated tool history. This keeps the orchestrator's context lean.


### Subagent communication pattern

```python
async def orchestrate_feature_build(feature_spec: str) -> str:
    """
    Orchestrator: breaks the task into subagents,
    each with an isolated, minimal context.
    """
    # Subagent 1: Research existing codebase structure
    relevant_files = await spawn_subagent(
        task=f"Find all files relevant to: {feature_spec}. Return only file paths.",
        tools=["semantic_search", "list_directory"],
    )

    # Subagent 2: Implement using only the relevant files
    implementation = await spawn_subagent(
        task=f"Implement: {feature_spec}\nRelevant files: {relevant_files}",
        tools=["read_file", "write_file", "run_tests"],
    )

    # Subagent 3: Review the implementation
    review = await spawn_subagent(
        task=f"Review this implementation for bugs and style:\n{implementation}",
        tools=["read_file"],
    )

    return f"Implementation: {implementation}\nReview: {review}"
```

---

## Advanced Vibe Coding Discipline

### From Vibe Coding to Context Engineering

In 2025, vibe coding was about _what to prompt_. In 2026, it's about _managing the session_ — understanding context budgets, knowing when to compact or reset, and architecting your AGENTS.md to maximize per-token signal.

### The 2026 Vibe Coding Checklist

```
Before starting a session:
  ✅ Is AGENTS.md up to date with active constraints?
  ✅ Are irrelevant files closed in the IDE?
  ✅ Is the context cleared from the previous feature session?
  ✅ Do I have a written plan I will feed to the agent first?

During a session:
  ✅ Am I prompting one specific task at a time?
  ✅ Am I reviewing diffs before accepting?
  ✅ Is context approaching 70%? → /compact or new session
  ✅ Is the agent contradicting earlier decisions? → context drift → reset

After a session:
  ✅ Did I commit and review the diff?
  ✅ Did all tests pass?
  ✅ Update AGENTS.md if any new constraints were established
```

### The Context Reset Pattern

When you notice context drift or rot, the fastest fix is a **fresh session with a curated handoff**:

```markdown
# Handoff prompt (paste into new session)

## What we built in the last session
- Added `PaymentService.processTransfer()` with idempotency key check
- Fixed NPE when `recipientId` is null (added null check on line 42)
- All existing tests pass; new test `testIdempotentTransfer` also passes

## Current state
- Files modified: PaymentService.java, PaymentServiceTest.java
- Build status: GREEN ✅

## Next task
Add rate limiting to `processTransfer()` — max 10 calls per minute per sender.
Use our existing Redis rate limiter at `infrastructure/RateLimiter.java`.
```

This costs ~200 tokens instead of carrying 50,000 tokens of old conversation history.

### Scoped Prompting

A **scoped prompt** constrains the agent's blast radius — it tells the agent explicitly what it _may_ and _may not_ touch:

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

### Context-Aware Prompt Patterns

| Situation | Pattern to use |
|:---|:---|
| Starting a new feature | "Based on AGENTS.md and our project structure, implement X" |
| After a long debug session | "Reset. Summary: [2-line summary]. New task: Y" |
| Agent contradicts itself | "Stop. Earlier you said [X]. The correct constraint is [X]. Continue with Z." |
| Agent touching wrong files | "Do not modify [files]. Only work in [scope]." |
| Agent producing wrong style | "This violates our convention. Revert and redo using [specific pattern]." |

---

## Interview Questions

| Question | Strong Answer |
|:---|:---|
| **What is context rot?** | Gradual degradation of agent reasoning quality as context fills up — the model attends less precisely to early tokens. Fix: proactive compaction at 60–70% capacity. |
| **When do you use a subagent?** | When a subtask is independent enough that it doesn't need the parent's full history. Subagents prevent context pollution and keep the orchestrator lean. |
| **Compaction vs. summarization?** | Compaction = reducing tokens (includes summarization + verbatim deletion). Summarization is one technique — using an LLM to condense old history. Verbatim deletion is another — removing stale tool results without summarizing. |
| **What is the token tax?** | The compounding cost of re-sending full conversation history at every inference step of an agentic loop. Compounds 60× from step 1 to step 20. |
| **How do you implement model routing?** | Map each node in the agentic graph to the cheapest model tier that can handle it. Planning → frontier. Tool call formatting → fast model. Can reduce costs 40–85%. |
| **What should go in AGENTS.md?** | Tech stack constraints, build/test commands, active coding standards, current task context, and safety rules. Keep it lean — only active, relevant constraints. Bloated AGENTS.md is context pollution. |

---

## 📚 Further Reading

- [Anthropic — Context Window Management](https://docs.anthropic.com/en/docs/build-with-claude/context-window) — Official guide to Claude's context window and caching
- [LangChain — Context Compression](https://python.langchain.com/docs/how_to/context_compression/) — Practical techniques for compressing retrieved context in RAG pipelines
- [Simon Willison — Prompt Injection & Agents](https://simonwillison.net/2023/Apr/14/working-with-open-ai-apis/) — Deep analysis of security risks in agentic systems
- [Anthropic — Extended Thinking](https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking) — How to use Claude's thinking budget effectively
