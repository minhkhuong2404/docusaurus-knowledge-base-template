---
id: prompt-engineering
title: "Prompt Engineering & In-Context Learning for AI Agents"
sidebar_label: "✍️ Prompt Engineering"
description: Master the art and science of Prompt Engineering — system prompt design, few-shot learning, Chain-of-Thought reasoning, structured output techniques, and developer workflow prompt templates.
tags: [ai-agents, prompt-engineering, few-shot, chain-of-thought, system-prompt, structured-output, vibe-coding, llm]
---

import PromptingFrameworksDiagram from '@site/src/components/PromptingFrameworksDiagram';
import SystemPromptArchitectureDiagram from '@site/src/components/SystemPromptArchitectureDiagram';

# Prompt Engineering & In-Context Learning for AI Agents

> **Prompt engineering** is the practice of designing, structuring, and optimizing textual inputs (prompts) to guide Large Language Models (LLMs) and autonomous AI agents toward producing precise, reliable, and high-quality outputs without retraining model weights.

In the era of AI Agents and Vibe Coding, prompt engineering is not just asking questions—it is **programmatic instruction design**. It is how developers configure the behavioral limits, reasoning steps, tool usage rules, and output schemas of LLMs.

---

## 🏗️ Core Prompting Frameworks & Mechanics

<PromptingFrameworksDiagram />

### 1. Zero-Shot, One-Shot, and Few-Shot Prompting


- **Zero-Shot:** You provide only instructions and constraints.
  - *Best for:* Simple classification, straightforward coding tasks on frontier models (GPT-4o, Claude 3.5 Sonnet).
- **One-Shot:** You provide a single exemplary input-output pair.
  - *Best for:* Defining a specific response format or style tone.
- **Few-Shot (3–5 examples):** You provide multiple input-output pairs demonstrating various edge cases.
  - *Best for:* Complex JSON output generation, legacy code transformations, domain-specific DSL translations.

#### Few-Shot Example for Code Refactoring:

```markdown
Task: Convert Java anonymous inner class listeners to lambda expressions.

Example 1:
Input:
button.addActionListener(new ActionListener() {
    @Override
    public void actionPerformed(ActionEvent e) {
        System.out.println("Clicked");
    }
});
Output:
button.addActionListener(e -> System.out.println("Clicked"));

Example 2:
Input:
runnableRunner.execute(new Runnable() {
    @Override
    public void run() {
        processTask();
    }
});
Output:
runnableRunner.execute(() -> processTask());

Now process this input:
executor.submit(new Runnable() {
    @Override
    public void run() {
        log.info("Executing background job");
    }
});
```

---

### 2. Chain-of-Thought (CoT) & Reasoning Tokens

**Chain-of-Thought (CoT)** forces the LLM to generate step-by-step intermediate reasoning before emitting the final answer. This dramatically improves performance on logical, mathematical, and multi-step engineering tasks.

```
Without CoT:
Prompt: "Should we use Kafka or Redis Streams for an order queue with 50,000 TPS, strict ordering, and 7-day replay?"
Answer: "Use Kafka." (Lacks reasoning, high risk of hallucinated rationale)

With CoT:
Prompt: "Analyze whether to use Kafka or Redis Streams for an order queue with 50,000 TPS, strict ordering, and 7-day replay. Think step-by-step before making your final recommendation."
Answer: 
1. Evaluate throughput requirements: 50k TPS is supported by both Kafka and Redis Streams.
2. Evaluate ordering: Kafka guarantees ordering per partition key. Redis Streams guarantees ordering per stream key.
3. Evaluate retention & replay: Redis Streams stores data in RAM; holding 7 days of 50k TPS event history in RAM is cost-prohibitive. Kafka stores sequentially on disk/pagecache, optimized for long retention.
Conclusion: Recommend Kafka due to retention cost efficiency and disk-based pagecache architecture.
```

#### Modern Reasoning Models (o1, o3-mini, Claude Extended Thinking)
Next-generation models natively implement **Reasoning Tokens** (internal CoT) before generating user-facing tokens. For developer workflows:
- **Low Thinking Budget (0–2k tokens):** Quick syntax fixes, lint corrections, boilerplate generation.
- **High Thinking Budget (8k–32k tokens):** Multi-file system architecture, complex algorithm optimization, race condition debugging.

---

### 3. Structured Output Engineering (JSON, XML, Pydantic)

When AI agents invoke tools or communicate with backend systems, free-form text causes parsing failures. Structuring LLM outputs is mandatory.

#### Using XML Tags (Anthropic / Claude Best Practice)
Claude models process XML tags (`<context>`, `<instructions>`, `<code_snippet>`, `<output_format>`) with high attention fidelity:

```xml
<system_instructions>
  You are an expert Java Code Auditor.
  Inspect the provided code snippet for concurrency issues.
</system_instructions>

<code_snippet>
public class ConcurrentCounter {
    private int count = 0;
    public void increment() { count++; }
}
</code_snippet>

<output_schema>
Return your finding in the following XML structure:
<audit_report>
  <vulnerability_found>true/false</vulnerability_found>
  <issue_description>Brief description</issue_description>
  <remediation_code>Corrected Java code</remediation_code>
</output_schema>
```

#### JSON Mode & Schema Enforcement (OpenAI / Function Calling)
OpenAI and modern OSS models enforce strict JSON Schema validation at the decoding level (guaranteeing valid JSON matching a Pydantic schema):

```python
from pydantic import BaseModel, Field

class AuditReport(BaseModel):
    vulnerability_found: bool = Field(description="True if thread-safety issues exist")
    issue_description: str = Field(description="Technical root cause analysis")
    remediation_code: str = Field(description="Thread-safe Java implementation")

# Enforced via API tool_choice or response_format
```

---

## 🎨 System Prompt Architecture for Coding Agents

A production-grade system prompt acts as the **operating ruleset** for an AI Agent. It should be modular and structured into 5 key blocks:

<SystemPromptArchitectureDiagram />

---


## 🛠️ Ready-to-Use Developer Prompt Templates

### Template 1: Surgical Code Refactoring (Minimal Blast Radius)

```markdown
You are a Senior Software Engineer. Refactor the code in file `<target_file>` according to these strict rules:

RULES:
1. ONLY modify the function `<function_name>`. Do not edit any other functions or imports.
2. Objective: Change `<current_behavior>` to `<desired_behavior>`.
3. Preserve all existing docstrings, log statements, and inline comments.
4. Do NOT introduce new third-party libraries. Use standard library utilities only.
5. After editing, verify that no compiler or type-checker warnings are introduced.

Target File Content:
```<language>
<code_content>
```
```

---

### Template 2: Root Cause Bug Diagnostics (Stacktrace Analysis)

```markdown
Analyze the following error log and stack trace to diagnose the root cause:

ENVIRONMENT:
- Framework: Spring Boot 3.2.x
- Database: PostgreSQL 15
- Execution context: Production worker pod under heavy load

STACK TRACE:
```text
<paste_stacktrace_here>
```

TASK:
1. Identify the exact line of code and root cause (e.g., deadlock, connection pool exhaustion, memory leak).
2. Explain WHY this happened under load.
3. Provide a production-grade fix avoiding quick patches or workarounds.
4. State how to write an automated test that reproduces this issue.
```

---

### Template 3: Automated Test Generation (High Coverage & Edge Cases)

```markdown
You are a QA Engineering Lead. Write comprehensive unit tests for the following Java class:

CLASS TO TEST:
```java
<paste_class_code_here>
```

REQUIREMENTS:
1. Framework: JUnit 5 + AssertJ + Mockito.
2. Test Coverage Goals:
   - Happy path scenarios
   - Null and empty input validation
   - Boundary values and numeric overflow
   - Exception handling & unexpected state branches
3. Use `@ParameterizedTest` for multiple input permutations where applicable.
4. Name test methods descriptively following `givenState_whenAction_thenExpectedResult` pattern.
```

---

## ⚠️ Anti-Patterns in Prompt Engineering

| Anti-Pattern | Description | Fix |
|:---|:---|:---|
| **Prompt Bloat** | Injecting 5,000 tokens of irrelevant background information into every call. | Keep system prompts lean; use dynamic RAG/retrieval for context. |
| **Negative Overloading** | Filling prompt with "Don't do X, Don't do Y, Don't do Z" (models process affirmative statements better). | Rephrase as positive constraints ("Do X instead of Y"). |
| **Vague Specification** | Prompting "Fix this code" or "Make this fast". | Define explicit criteria: "Reduce complexity from $O(N^2)$ to $O(N)$ using a HashSet." |
| **Ignoring Token Budget** | Sending huge file contents repeatedly in every turn of a conversation. | Use context compaction, file diffing, or subagents. |
| **Hallucination Blindness** | Assuming the LLM knows the API signature of a library updated last month. | Feed the library documentation or interfaces directly into context. |

---

## 📚 Further Reading & Related Documentation

- **[Context Engineering & Compaction](./context-engineering)** — Managing context windows, context rot, and model routing.
- **[The Vibe Coding Handbook](./vibe-coding)** — Practical vibe coding workflows, best practices, and steering agents.
- **[AI Agent Architectures](./agents)** — ReAct loops, planning, and multi-agent coordination frameworks.
