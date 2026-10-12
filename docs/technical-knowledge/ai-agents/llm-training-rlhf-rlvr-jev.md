---
id: llm-training-rlhf-rlvr-jev
title: "LLM Lifecycle: Pre-Training, Post-Training (RLHF, RLVR, RLCD) & Jev Decision Models"
sidebar_label: "🧠 LLM Training, RL & Jev"
description: Principal-level architectural breakdown of the modern AI model lifecycle—from pre-training and SFT to RLHF, RLVR, RLCD, and non-generative System 1 decision models like TypeSafe Jev.
---

import LlmTrainingPipelineDiagram from '@site/src/components/LlmTrainingPipelineDiagram';
import RlvrVerificationFlowDiagram from '@site/src/components/RlvrVerificationFlowDiagram';
import JevDecisionEngineDiagram from '@site/src/components/JevDecisionEngineDiagram';
import TwoTierAiArchitectureDiagram from '@site/src/components/TwoTierAiArchitectureDiagram';

# LLM Lifecycle: Pre-Training, Post-Training (RLHF, RLVR, RLCD) & Jev Decision Models

Modern Artificial Intelligence has evolved beyond monolithic, autoregressive text generators. While early Large Language Models (LLMs) operated strictly as next-token predictors, production enterprise systems now rely on a multi-stage training pipeline (Pre-training $\to$ SFT $\to$ RL Post-training) combined with specialized **System 1 decision engines** (such as **Jev** by TypeSafe AI) that do not generate text at all.

This guide provides a comprehensive architectural deep-dive into the training mechanics, mathematical foundations, alignment paradigms (**RLHF**, **RLVR**, **RLCD**), and the emerging hybrid architectures pairing fast decision models with deep reasoning LLMs.

---

## 1. The End-to-End LLM Lifecycle

The creation and alignment of a modern frontier model spans three distinct physical phases:

<LlmTrainingPipelineDiagram />

---

## 3. Phase 1: Pre-Training Fundamentals

Pre-training transforms uninitialized neural network weights into a general-purpose knowledge base by predicting the next token over trillions of tokens of web scrapes (Common Crawl), source code, books, and scientific papers.

### 3.1 Loss Formulation: Causal Language Modeling (CLM)
For a token sequence $W = (w_1, w_2, \dots, w_T)$, the training objective maximizes the log-likelihood:

$$\mathcal{L}_{\text{CLM}}(\theta) = -\sum_{t=1}^{T} \log P_\theta(w_t \mid w_1, w_2, \dots, w_{t-1})$$

The model computes a softmax distribution over vocabulary $V$ (typically 32,000 to 128,000 tokens):
$$P(w_t \mid w_{<t}) = \frac{\exp(z_t)}{\sum_{v \in V} \exp(z_v)}$$

### 3.2 Compute Scaling Laws (Chinchilla)
Hoffmann et al. (DeepMind Chinchilla) demonstrated that model parameter count $N$ and training dataset size $D$ should scale in equal proportion:

$$D \approx 20 \times N$$

- Training a 70B parameter model compute-optimally requires $\approx 1.4\text{ to }2.0\text{ Trillion}$ tokens.
- Modern foundation models (e.g. LLaMA 3 70B/405B) intentionally **over-train** by up to $15\text{ Trillion}$ tokens to minimize downstream inference serving costs.

### 3.3 Hardware Memory Bounds: The Memory Wall
Training a modern 70B–405B model exceeds single-GPU High Bandwidth Memory (HBM3e). With 16-bit mixed precision (BF16):
- **Model Weights**: $2\text{ bytes} \times N$ (140 GB for 70B).
- **Gradients**: $2\text{ bytes} \times N$ (140 GB).
- **Adam Optimizer States**: FP32 master weights ($4\text{B}$), first momentum ($4\text{B}$), second momentum ($4\text{B}$) = $12\text{ bytes} \times N$ (840 GB).
- **Total Static State**: $\mathbf{16\text{ bytes per parameter}}$ ($\approx 1.12\text{ TB}$ for 70B model before KV-cache and activation memory).

To distribute this compute, clusters utilize **3D Parallelism** (Megatron-LM Tensor Parallelism across NVLink, Pipeline Parallelism across InfiniBand, and ZeRO-3 Data Parallelism).

---

## 4. Phase 2: Supervised Fine-Tuning (SFT)

A pre-trained base model is merely a statistical completion engine: given the prompt *"Write a Python script to sort an array"*, it may simply complete the prompt with more interview questions.

**Supervised Fine-Tuning (SFT)** uses curated question-answer pairs $(x, y)$ to teach the model instruction adherence:

$$\mathcal{L}_{\text{SFT}}(\theta) = -\sum_{t=1}^{|y|} \log P_\theta(y_t \mid x, y_{<t})$$

### The Loss Masking Invariant
The cross-entropy loss is **strictly masked out on the prompt tokens $x$**. Gradients are backpropagated **only through assistant completion tokens $y$**. Backpropagating gradients through user prompt tokens degrades the model's pre-trained distribution.

### The Limits of SFT
While SFT establishes formatting and tone, it cannot teach complex, multi-step problem solving. SFT suffers from:
1. **Teacher Forcing Distribution Shift**: During training, the ground truth prefix is always fed. During inference, errors compound autoregressively.
2. **Superficial Imitation**: The model mimics human writing style without validating mathematical or logical veracity.

---

## 5. Phase 3: Post-Training Reinforcement Learning (RL)

Reinforcement Learning frames text generation as a **Markov Decision Process (MDP)**:
- **State $s_t$**: The prompt $x$ concatenated with all generated tokens $y_{<t}$.
- **Action $a_t$**: The next token $y_t \in V$ sampled from policy $\pi_\theta(y_t \mid s_t)$.
- **Transition**: Deterministic string concatenation: $s_{t+1} = [s_t; y_t]$.
- **Reward $R(x, y)$**: Scalar evaluation assigned upon reaching the terminal end-of-sequence (`<|eos|>`) token.

---

### 5.1 RLHF (Reinforcement Learning from Human Feedback)

Pioneered by InstructGPT and Claude, RLHF aligns models with subjective human preferences through a 3-step pipeline:
1. **Pairwise Annotation**: Human raters compare candidate completions ($y_w \succ y_l$) for given prompt $x$.
2. **Reward Model Training**: Train scalar reward function $r_\psi(x, y)$ based on Bradley-Terry preference modeling.
3. **Policy Optimization**: Optimize policy $\pi_\theta$ using PPO or DPO with KL divergence penalties.

#### The Bradley-Terry Reward Model
Human annotators rank two completions $y_w$ (preferred) and $y_l$ (rejected) for prompt $x$. The reward model loss minimizes:

$$\mathcal{L}_{\text{RM}}(\psi) = -\mathbb{E}_{(x, y_w, y_l)} \left[ \log \sigma\left(r_\psi(x, y_w) - r_\psi(x, y_l)\right) \right]$$

#### PPO Objective with KL Regularization
To prevent **reward hacking** (where the model generates nonsensical, repetitive phrases that happen to exploit weaknesses in $r_\psi$), a Kullback-Leibler (KL) divergence penalty anchors the policy to reference model $\pi_{\text{ref}}$:

$$\max_\theta \mathbb{E}_{x \sim \mathcal{D}, y \sim \pi_\theta} \left[ r_\psi(x, y) - \beta D_{\text{KL}}\left(\pi_\theta(y \mid x) \parallel \pi_{\text{ref}}(y \mid x)\right) \right]$$

#### Direct Preference Optimization (DPO)
DPO simplifies RLHF by analytically solving for the optimal policy and rewriting the loss function directly over $\pi_\theta$ without training an explicit reward model:

$$\mathcal{L}_{\text{DPO}}(\theta) = -\mathbb{E}_{(x, y_w, y_l)} \left[ \log \sigma\left(\beta \log \frac{\pi_\theta(y_w \mid x)}{\pi_{\text{ref}}(y_w \mid x)} - \beta \log \frac{\pi_\theta(y_l \mid x)}{\pi_{\text{ref}}(y_l \mid x)}\right) \right]$$

#### Production Flaws of RLHF:
- **Verbosity Bias**: Reward models consistently favor longer, fluffier answers regardless of informational density.
- **Sycophancy**: The model validates incorrect user premises rather than correcting them.

---

### 5.2 RLVR (Reinforcement Learning with Verifiable Rewards)

**RLVR** represents the core architectural paradigm shift behind modern frontier reasoning models (such as **DeepSeek R1**, **OpenAI o1**, and **Qwen2.5-Math**).

Instead of relying on fuzzy human opinion, RLVR uses **objective, deterministic, machine-verifiable truth**:

<RlvrVerificationFlowDiagram />

#### Deterministic Verifiers:
1. **Competitive Programming**: Unit tests run inside gVisor/Docker sandboxes.
2. **Mathematics**: Symbolic equivalence verified via SymPy or Lean theorem provers.
3. **Formal Verification**: Compilers (Rust `rustc`, GCC) testing syntactical and memory validity.

#### Group Relative Policy Optimization (GRPO)
Traditional PPO requires maintaining a separate **Value Network (Critic)** in GPU memory, which consumes as much memory as the actor model itself. DeepSeek introduced **GRPO**, which eliminates the critic entirely by sampling a group of $G$ candidate outputs $\{y_1, y_2, \dots, y_G\}$ for each prompt:

$$A_i = \frac{r(y_i) - \text{mean}(\{r(y_1), \dots, r(y_G)\})}{\text{std}(\{r(y_1), \dots, r(y_G)\})}$$

$$\mathcal{L}_{\text{GRPO}}(\theta) = -\frac{1}{G}\sum_{i=1}^G \left[ \min\left(\frac{\pi_\theta(y_i \mid x)}{\pi_{\text{old}}(y_i \mid x)} A_i, \; \text{clip}\left(\frac{\pi_\theta(y_i \mid x)}{\pi_{\text{old}}(y_i \mid x)}, 1-\epsilon, 1+\epsilon\right) A_i\right) - \beta D_{\text{KL}}\right]$$

#### The Emergence of System 2 Long Reasoning:
Under pure RLVR without human demonstration, models autonomously learn:
- **Chain-of-Thought (CoT)**: Generating hidden reasoning steps (`<think> ... </think>`).
- **Self-Correction & Backtracking**: Re-reading problem constraints and reversing incorrect logical assumptions.

---

### 5.3 RLCD (Reinforcement Learning for Calibrated Decisions)

In production software automation, an agent rarely needs paragraphs of conversational prose. It needs **accurate, schema-constrained decisions with calibrated uncertainty**:

```
Decision = REFUND_ELIGIBLE | FRAUD_ALERT | ROUTE_TO_TIER_2
Confidence = 0.942  (94.2% empirical accuracy)
```

**RLCD** optimizes models not for conversational eloquence or raw binary correctness, but for **Epistemic Calibration**:

#### The Proper Scoring Rule (Brier Score)
If a model outputs probability vector $\mathbf{p} = [p_1, p_2, \dots, p_K]$ for $K$ discrete choices, and the true outcome is one-hot vector $\mathbf{o}$, the **Brier Score** strictly penalizes overconfidence:

$$\text{BS} = \frac{1}{K}\sum_{k=1}^K (p_k - o_k)^2$$

A model that outputs $p = 0.99$ for an event that occurs only $60\%$ of the time incurs an extreme penalty. Under RLCD, **a stated confidence of 80% guarantees that across 100 historical decisions, exactly 80 are correct**.

---

## 6. What Is Jev? The AI Model That Doesn't Generate Text

As highlighted by **IBM Technology** in *"What Is Jev? The AI Model That Doesn't Generate Text"*, **Jev** (developed by **TypeSafe AI**) represents a new class of AI model: a **non-generative, schema-constrained System 1 decision engine**.

<JevDecisionEngineDiagram />

### 6.1 Why Generative LLMs Fail at Structured Microservice Decisions

When traditional LLMs are forced to act as routers or classifiers via prompt engineering (*"Respond with JSON only: `{"category": "string"}`"*):
1. **Autoregressive Latency Trap**: The GPU must execute sequential forward passes token-by-token. Even generating 50 output tokens takes **800ms–2500ms** due to GPU memory bandwidth limits during KV-cache reads.
2. **Schema Invalidation**: Prompting an LLM for structured JSON frequently fails on edge cases (missing closing brackets, markdown backticks ```` ```json ````, or conversational preambles like *"Here is your JSON:"*).
3. **Uncalibrated Confidence**: Standard LLMs use temperature-scaled softmax over thousands of vocabulary tokens, producing overconfident outputs even when completely hallucinating.

---

### 6.2 How Jev Operates Under the Hood

Unlike an autoregressive LLM, **Jev is a classification and decision model constrained by typed schemas**:

1. **Non-Autoregressive Single Forward Pass**: Jev processes the full context and decision questions in a single forward pass without sequential token generation, yielding **70ms–200ms latency**.
2. **Schema-Constrained Embeddings**: The developer defines allowable Enum variants, boolean flags, or numerical bounds in advance. The model cannot output an invalid or unparseable type.
3. **Calibrated Confidence**: Outputs an exact posterior probability distribution $P(C_k \mid X)$. Downstream microservices can enforce rigorous SLA gating (e.g. *"Only auto-refund if confidence > 0.95; otherwise escalate"*).
4. **Zero Output Token Billing**: Users are billed strictly for input context, drastically slashing operational costs compared to generative models.

---

## 7. Production Enterprise Architectures: The Two-Tier Hybrid Pattern

In high-throughput enterprise architectures, using an expensive reasoning LLM for all queries is cost-prohibitive. The industry standard has coalesced around the **System 1 / System 2 Two-Tier Pattern**:

<TwoTierAiArchitectureDiagram />

### Pattern 1: High-Speed AI Firewall & WAF
- **Requirement**: Detect prompt injections, jailbreaks, and PII leakage at API gateway line-rate.
- **Implementation**: Jev inspects every inbound prompt in **70ms**. Malicious payloads are dropped immediately at the edge (HTTP 403) before consuming GPU cluster inference budget.

### Pattern 2: Customer Triage & Zero-Touch Dispatch
- **Requirement**: Process 1,000,000 daily customer tickets.
- **Implementation**:
  - Jev classifies ticket intent with calibrated confidence.
  - If `intent == CANCELLATION` and `confidence > 0.92`, process automatically via internal payment APIs.
  - If `confidence < 0.80`, route directly to a human support agent or invoke a multi-turn System 2 agent.

---

## 8. Architectural Trade-Off Matrix

Use the interactive **Paradigm Comparison Matrix** tab in the diagram above to inspect physical engine metrics across training approaches:

| Paradigm | Inference Latency | Reward / Ground Truth | Output Modality | Optimal Enterprise Use Case |
|---|---|---|---|---|
| **SFT (Supervised)** | 500–2,000ms | Demonstration matching | Conversational Prose | Chatbot formatting, persona adaptation |
| **RLHF (Human Pref)** | 500–3,000ms | Bradley-Terry Reward Model | Conversational Prose | Creative writing, subjective dialogue |
| **RLVR (GRPO)** | 2,000–15,000ms | Compilers, PyTest, Lean Provers | Extended Chain-of-Thought | Competitive coding, mathematics, science |
| **RLCD / Jev** | **70–120ms** | Brier Score Proper Scoring Rule | **Typed Enum + Probability** | API routing, security guardrails, automated triage |

---

## 9. Production Failure Modes & Architectural Mitigations

### 1. Verification Sandboxing Escapes in RLVR
- **Hazard**: During RLVR rollouts, the model attempts arbitrary code execution or infinite recursion inside the testing container.
- **Mitigation**: Execute all unit-test verifications inside hardened, network-isolated microVMs (AWS Firecracker or gVisor) with hard CPU execution timeouts ($< 5\text{s}$) and restricted memory cgroups.

### 2. Overconfidence Drift in Changing Real-World Distributions
- **Hazard**: A decision model trained on summer e-commerce data encounters holiday fraud attack vectors, causing its calibrated confidence scores to drift.
- **Mitigation**: Continuous **Expected Calibration Error (ECE)** telemetry tracking in production:
  $$\text{ECE} = \sum_{m=1}^M \frac{|B_m|}{N} \left| \text{acc}(B_m) - \text{conf}(B_m) \right|$$
  If ECE exceeds $0.05$, automatically trigger shadow fine-tuning on recent verified settlement data.

### 3. Sycophancy & Length Bias in Conversational LLMs
- **Hazard**: Generative models write pages of apologetic, repetitive text to maximize reward model preference scores.
- **Mitigation**: Enforce brevity penalties in the RL reward formulation and replace conversational LLM routing logic with schema-constrained System 1 decision models.
