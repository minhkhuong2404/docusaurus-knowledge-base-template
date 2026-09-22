---
id: chatgpt
title: Design a Large-Scale Conversational AI Platform Like ChatGPT
sidebar_label: 31. ChatGPT (LLM Inference Gateway)
description: Staff-level system design breakdown for an enterprise conversational AI inference gateway with SSE token streaming, KV cache routing, and continuous batching.
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design a Large-Scale Conversational AI Platform Like ChatGPT

An enterprise conversational AI platform (e.g., ChatGPT, Claude, Google Gemini) enables hundreds of millions of users to engage in low-latency multi-turn conversations with large language models (LLMs). Unlike traditional stateless web APIs, LLM inference is **GPU-memory bound**, requires **continuous token streaming** over long-lived HTTP connections, and demands sophisticated **KV (Key-Value) cache management** and dynamic request scheduling.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Multi-Turn Chat**: Users send prompts and receive responses contextualized by the preceding conversation history.
2. **Real-Time Token Streaming**: Generated tokens stream back to the client immediately as they are generated (sub-second Time-To-First-Token - TTFT).
3. **Chat History & Sessions**: Persist user conversations, titles, and message histories across devices.
4. **Safety & Content Moderation**: Intercept and block abusive, toxic, or unsafe content in real-time.
5. **Multi-Model Support**: Route requests to appropriate models (e.g. GPT-4o, GPT-4o-mini, Reasoning models) based on user tier and task complexity.

### Non-Functional Requirements
- **Low Time-To-First-Token (TTFT)**: TTFT must be `< 800ms` to provide an interactive conversational experience.
- **High Generation Throughput**: Sustain smooth token generation (`30–60 tokens/sec` per stream).
- **GPU Resource Utilization**: Maximize expensive GPU VRAM and compute utilization via **Continuous Batching** and **PagedAttention**.
- **High Availability**: `99.9%` availability; graceful queuing during sudden traffic surges.

### Capacity Estimations & GPU Hardware Sizing
- **Daily Active Users (DAU)**: 100 Million users.
- **Daily Messages Sent**: 500 Million prompts/day.
- **Concurrent In-Flight Requests**: 50,000 requests generating tokens simultaneously at peak.
- **Model Footprint & GPU Sizing (e.g. 70B Parameter Model)**:
  - FP16 model weights = $70\text{B} \times 2\text{ bytes} \approx$ **140 GB VRAM** (requires 2x NVIDIA H100 80GB SXM GPUs just to load the weights).
  - With Tensor Parallelism ($TP=2$ or $TP=4$), weights are distributed across GPUs in a node.
- **KV Cache Memory Footprint (The Primary Scalability Bottleneck)**:
  - For each active request with a 4,000-token context:
    $\text{KV Cache Size} = 2 \times 2\text{ bytes} \times \text{layers} (80) \times \text{heads} (8) \times \text{dim} (128) \times 4,000 \approx \mathbf{1.3\text{ GB of VRAM per active conversation!}}$
  - A single 80 GB GPU node can host only **20 to 30 concurrent active context streams** unless sophisticated memory paging (PagedAttention) and prefix caching are applied.
  - To support 50,000 concurrent streaming requests: Requires a fleet of **~2,000 to 3,000 H100 GPUs**.

---

## 2. The Set Up

### Defining the Core Entities

```
┌────────────────────────────────────────────────────────┐
│                      CONVERSATION                      │
├──────────────────┬──────────────┬──────────────────────┤
│ conversation_id  │ UUID         │ PRIMARY KEY          │
│ user_id          │ UUID         │ INDEX, FK            │
│ title            │ VARCHAR(255) │ Auto-generated       │
│ model_name       │ VARCHAR(64)  │ e.g. "gpt-4o"        │
│ system_prompt    │ TEXT         │ Persona definition   │
│ created_at       │ TIMESTAMP    │ NOT NULL             │
│ updated_at       │ TIMESTAMP    │ NOT NULL             │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                        MESSAGE                         │
├──────────────────┬──────────────┬──────────────────────┤
│ message_id       │ UUID         │ PRIMARY KEY          │
│ conversation_id  │ UUID         │ COMPOSITE INDEX, FK  │
│ role             │ VARCHAR(16)  │ USER / ASSISTANT / SY│
│ content          │ TEXT         │ Markdown / Code      │
│ prompt_tokens    │ INT          │ Input token count    │
│ completion_tokens│ INT          │ Output token count   │
│ created_at       │ TIMESTAMP    │ Ordered chronologic  │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API / Streaming Protocol Design

#### Stream Chat Completion (Server-Sent Events - SSE)
```http
POST /api/v1/chat/completions
Content-Type: application/json
Authorization: Bearer <jwt_token>
Accept: text/event-stream

{
  "conversation_id": "conv_88192a01",
  "model": "gpt-4o",
  "message": "Explain B+Tree page traversal in 3 sentences."
}
```

**Response (`200 OK` via `text/event-stream`)**:
```http
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Transfer-Encoding: chunked

data: {"id":"msg_101","choices":[{"delta":{"content":"A"}}]}

data: {"id":"msg_101","choices":[{"delta":{"content":" B"}}]}

data: {"id":"msg_101","choices":[{"delta":{"content":"+Tree"}}]}

data: {"id":"msg_101","choices":[{"delta":{"content":" stores"}}]}

data: [DONE]
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="chatgpt-gateway" title="ChatGPT Inference Gateway, KV Cache Routing & Token Streaming Architecture" />

### Walkthrough of the Inference Request Flow

#### 1. Ingestion & Guardrails Layer
1. User enters prompt $\implies$ Client opens an **HTTP POST connection with SSE streaming**.
2. The **API Gateway** checks rate limits (tokens/min) and authenticates the user.
3. The **Context Assembler**:
   - Fetches the conversation's recent message history from **Redis / PostgreSQL**.
   - Truncates context window to fit model limits (e.g. 128K tokens).
   - Assembles the combined prompt: `[System, Past Messages, User Prompt]`.
4. **Input Moderation Guardrail**: High-speed lightweight classifier verifies the prompt does not violate safety policies.

#### 2. KV-Cache Aware Routing
1. The **Inference Router**:
   - Calculates a hash of the conversation prefix: `hash([System, Past Messages])`.
   - Checks the **Global KV Cache Directory (Redis)** to find which GPU worker node already holds the KV cache for this conversation in VRAM.
   - Routes the request to that specific GPU node (**Prefix-Aware Routing**), achieving a **90%+ KV Cache Hit Rate** and cutting prefill computation to near zero!

#### 3. GPU Worker Execution (vLLM / TensorRT-LLM)
1. The GPU Worker adds the request to its active **Continuous Batching Queue**.
2. **Prefill Phase**: Processes new input tokens in parallel.
3. **Decode Phase**: Generates output tokens one by one in an iteration loop.
4. As each token is generated:
   - Evaluated by the **Streaming Safety Filter**.
   - Streamed back through the API Gateway down the client's open SSE connection in real-time.
5. When the model outputs `<|endoftext|>`:
   - Full assistant response is persisted asynchronously to PostgreSQL.
   - Stream closes with `data: [DONE]`.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: PagedAttention & Continuous Batching (vLLM Engine Internals)
Why did early LLM serving fail, and how does PagedAttention unlock 10x higher GPU throughput?

```
STATIC BATCHING (Naive):
All requests in a batch must start and finish together.
If Request 1 needs 10 tokens and Request 2 needs 1,000 tokens:
➔ GPU sits idle waiting for Request 2! (Massive GPU under-utilization).

CONTINUOUS BATCHING (Iteration-Level Scheduling):
As soon as Request 1 finishes (after 10 tokens), it is evicted from the batch.
A new waiting request (Request 3) is injected into the NEXT forward pass!
➔ GPU compute cores remain at 100% saturation continuously!

PAGEDATTENTION (Solving VRAM Fragmentation):
Traditional serving pre-allocated contiguous VRAM for the maximum context (e.g. 8K tokens).
60-80% of VRAM was completely wasted as unused contiguous padding!
PagedAttention borrows the OS Virtual Memory concept:
- Divides KV cache into fixed-size physical blocks (e.g. 16 tokens per block).
- Allocates blocks non-contiguously in GPU VRAM via a Page Table!
➔ Eliminates memory fragmentation entirely.
➔ Triples the number of concurrent streams a single GPU node can serve!
```

### Deep Dive 2: Prefix Caching & KV Cache Routing
In a 20-turn conversation, 95% of the prompt tokens are identical to the previous turn (the past conversation history). Recomputing the KV cache on every turn is extremely wasteful!

- **Prefix Caching (Prompt Cache)**:
  - If Turn 1 processed Tokens `[1 ... 500]`, its KV cache tensors remain cached in GPU VRAM.
  - When Turn 2 arrives with Tokens `[1 ... 500, new_prompt]`:
  - The GPU engine reuses the cached KV tensors for Tokens `[1 ... 500]` directly!
  - **Prefill Latency**: Drops from **500ms down to 10ms**!
- **Session-Aware Router**:
  - The load balancer must route subsequent messages in the same conversation to the **same GPU worker node** where the KV cache page blocks reside.

### Deep Dive 3: Streaming Protocol: Server-Sent Events (SSE) vs WebSockets
Why do OpenAI, Anthropic, and Google use HTTP SSE instead of WebSockets for token streaming?

| Feature | Server-Sent Events (SSE) | WebSockets |
|---|---|---|
| **Protocol** | Standard HTTP/2 or HTTP/1.1 | Custom `ws://` TCP upgrade protocol |
| **Directionality** | Unidirectional (Server $\to$ Client) | Full Duplex (Bi-directional) |
| **Firewall & Proxy Traversal** | **Native HTTP**: Seamlessly traverses enterprise firewalls, CDNs, and load balancers. | Often blocked or timed out by corporate security proxies. |
| **Reconnection & Resilience** | Built-in browser reconnection (`EventSource`) with message ID tracking. | Requires manual client ping/pong and reconnect logic. |
| **Use Case Fit** | **Perfect**: Client sends 1 prompt; server streams back hundreds of tokens. | Overkill; bi-directional communication is not needed during generation. |

---

## 5. Architectural Trade-Off Matrix

| Design Area | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Streaming Protocol** | WebSockets | HTTP Server-Sent Events (SSE) | **Server-Sent Events (SSE)**: Standard HTTP semantics; native browser reconnection; works over standard HTTP/2 multiplexed connections without proxy issues. |
| **Batching Mechanism** | Static Batching | Continuous Batching (vLLM) | **Continuous Batching**: 4x–8x higher GPU throughput. Eliminates idle GPU bubbles caused by variable request lengths. |
| **Router Strategy** | Round-Robin Load Balancing | Prefix-Aware Consistent Routing | **Prefix-Aware Routing**: Maximizes GPU VRAM KV cache hits, slashing TTFT from 800ms to 100ms for multi-turn conversations. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Understands token streaming and why Server-Sent Events (SSE) are used.
- Designs schemas for Conversations and Messages.
- Identifies the need to pass previous conversational history with each turn.
- Implements basic prompt moderation and rate limiting.

### Senior (L5 / IC5)
- Explains the **KV Cache memory bottleneck** and calculates VRAM capacity per active stream.
- Details **Continuous Batching** and **PagedAttention** (virtual memory page tables in VRAM).
- Implements **Prefix Caching** and session-aware routing to eliminate redundant prefill compute.
- Compares SSE vs WebSockets for unidirectional LLM generation.

### Staff+ (L6 / Principal)
- Evaluates Tensor Parallelism ($TP$) vs Pipeline Parallelism ($PP$) trade-offs across NVLink vs Infiniband clusters.
- Designs speculative decoding architectures: Using a lightweight draft model (e.g. 1B model) to predict tokens, verified in parallel by the 70B model to double generation speed.
- Architects multi-cluster GPU load balancing: Handling catastrophic GPU node thermal throttle crashes and dynamic capacity pooling across cloud providers.
