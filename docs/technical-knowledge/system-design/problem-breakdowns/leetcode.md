---
id: leetcode
title: Design an Online Coding Judge Platform Like LeetCode
sidebar_label: 7. LeetCode (Online Judge)
description: Staff-level system design breakdown for a secure, sandboxed online code judge platform handling concurrent code execution and live contests.
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design an Online Coding Judge Platform Like LeetCode

An online code judge platform (e.g., LeetCode, Codeforces, HackerRank) allows developers to write code in multiple programming languages, submit it for evaluation, and receive real-time verdicts (Accepted, Wrong Answer, Time Limit Exceeded, Memory Limit Exceeded, Runtime Error). The system must securely execute arbitrary, untrusted user code while defending against malicious exploits, resource exhaustion, and denial-of-service attacks.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Submit Code**: Users submit source code for a specific problem in a chosen programming language (Python, Java, C++, Go, Rust, JavaScript).
2. **Execute & Judge Code**: The platform compiles, executes, and evaluates the code against hidden test cases under strict CPU and memory limits.
3. **Verdict Generation**: Provide granular verdicts: `Accepted (AC)`, `Wrong Answer (WA)`, `Time Limit Exceeded (TLE)`, `Memory Limit Exceeded (MLE)`, `Runtime Error (RTE)`, `Compile Error (CE)`.
4. **Live Contests & Leaderboards**: Support weekly live coding contests with tens of thousands of simultaneous submissions and instant penalty/ranking calculations.
5. **Run Code (Interactive Playground)**: Allow users to run sample test cases interactively before submitting.

### Non-Functional Requirements
- **Strict Security Sandboxing**: Untrusted user code must be 100% isolated. Zero access to host kernel, private network, host filesystem, or other container environments.
- **Fair Resource Allocation**: Every submission receives deterministic CPU time and memory regardless of noisy neighbors on the judge cluster.
- **Low Latency & High Responsiveness**:
  - Sample "Run Code" execution results returned in `< 2s`.
  - Full submission evaluation returned in `< 5s`.
- **Surge Resilience**: Contest start times create massive submission spikes; the queue must not drop submissions.

### Capacity Estimations & Sizing
- **Daily Active Users (DAU)**: 2 Million users.
- **Daily Submissions**: 5 Million submissions/day.
- **Weekly Contest Spike**: 50,000 contestants submitting code concurrently at contest start/end $\implies$ **5,000 submissions/sec peak**.
- **Judge Execution Time**: Average execution time = 1.5 seconds across 50 test cases.
- **Judge Worker Sizing**:
  - At 5,000 submissions/sec and 1.5s average duration:
    $\text{Concurrent Executions} = 5,000 \times 1.5 = \mathbf{7,500\text{ concurrent sandboxes}}$.
  - If each worker node runs 16 sandboxed microVMs/containers:
    $7,500 / 16 \approx$ **470 Judge Worker Nodes** required during peak contest windows.

---

## 2. The Set Up

### Defining the Core Entities

```
┌────────────────────────────────────────────────────────┐
│                        PROBLEM                         │
├──────────────────┬──────────────┬──────────────────────┤
│ problem_id       │ INT          │ PRIMARY KEY          │
│ title            │ VARCHAR(255) │ NOT NULL             │
│ difficulty       │ VARCHAR(16)  │ EASY / MEDIUM / HARD │
│ time_limit_ms    │ INT          │ e.g. 2000 ms         │
│ memory_limit_mb  │ INT          │ e.g. 256 MB          │
│ testcase_s3_uri  │ VARCHAR(255) │ S3 Bucket Path       │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                       SUBMISSION                       │
├──────────────────┬──────────────┬──────────────────────┤
│ submission_id    │ UUID         │ PRIMARY KEY          │
│ user_id          │ UUID         │ INDEX, FK            │
│ problem_id       │ INT          │ INDEX, FK            │
│ language         │ VARCHAR(32)  │ python3, java, cpp   │
│ source_code      │ TEXT         │ UTF-8 Source         │
│ status           │ VARCHAR(32)  │ QUEUED/RUNNING/DONE  │
│ verdict          │ VARCHAR(32)  │ ACCEPTED / TLE / ... │
│ runtime_ms       │ INT          │ Execution time       │
│ memory_kb        │ INT          │ Peak memory          │
│ failed_testcase  │ INT          │ Testcase index       │
│ created_at       │ TIMESTAMP    │ NOT NULL             │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API Design

#### 1. Submit Code for Evaluation
```http
POST /api/v1/problems/{problem_id}/submit
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "language": "cpp",
  "source_code": "#include <vector>\nusing namespace std;\nclass Solution { ... };"
}
```
**Response (`202 Accepted`)**:
```json
{
  "submission_id": "sub_90184b2-a102",
  "status": "QUEUED",
  "poll_url": "/api/v1/submissions/sub_90184b2-a102"
}
```

#### 2. Poll or Stream Submission Status
```http
GET /api/v1/submissions/sub_90184b2-a102
```
**Response (`200 OK`)**:
```json
{
  "submission_id": "sub_90184b2-a102",
  "status": "COMPLETED",
  "verdict": "ACCEPTED",
  "passed_testcases": 64,
  "total_testcases": 64,
  "runtime_ms": 4,
  "runtime_percentile": 92.4,
  "memory_kb": 10400,
  "memory_percentile": 84.1
}
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="execution-sandbox" title="LeetCode Distributed Judge & Sandboxed Execution Pipeline" />

### Walkthrough of the Judge Architecture

#### 1. Submission & Priority Queue Ingestion
1. User clicks "Submit". The API Gateway validates user authentication and rate limits.
2. The Submission Service writes the submission record to PostgreSQL with `status: QUEUED`.
3. The submission payload is pushed to an **Apache Kafka / RabbitMQ Queue**:
   - **High Priority Queue**: Active live contest submissions.
   - **Normal Priority Queue**: Daily practice submissions.
   - **Low Priority Queue**: Interactive "Run Code" playground runs.

#### 2. Judge Worker Execution Loop
1. An idle **Judge Worker** pulls a submission message from Kafka.
2. The worker retrieves the problem's hidden test cases from local memory or local NVMe SSD (cached from S3).
3. The worker spins up an isolated **gVisor / Firecracker MicroVM sandbox**.
4. Inside the sandbox:
   - Compiles code (if C++/Java/Rust/Go). If compilation fails $\implies$ returns `Compile Error`.
   - Executes binary against test cases one by one.
   - Streams inputs via `stdin` and reads outputs from `stdout`.
   - Monitors execution with a hardware watchdog timer and Linux `cgroups`.
5. Compares user output against expected output via deterministic byte-diffing.
6. Returns verdict, peak memory, and CPU time to the Results Aggregator.
7. Pushes result to Redis and notifies the client via **Server-Sent Events (SSE)** or WebSocket.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Secure Sandboxing (Standard Docker vs gVisor vs Firecracker)
Why is standard Docker containerization dangerously insufficient for an online judge?

- **The Docker Vulnerability**: Docker containers share the host Linux kernel. A malicious submission executing a kernel privilege escalation exploit (`Dirty COW`, `cgroup escape`) can compromise the entire host node, read other users' code, or steal secret contest testcases!
- **Common Malicious Code Attacks**:
  - Fork bombs: `int main() { while(1) fork(); }` $\implies$ exhausts host process table (`PID limit`).
  - Network sniffing: Socket calls scanning AWS metadata API (`169.254.169.254`).
  - Disk filling: `while(1) printf("spam");` $\implies$ fills disk space, causing node crash.
- **The Sandboxing Hierarchy**:

| Isolation Technology | Kernel Boundary | Startup Overhead | Security Profile |
|---|---|---|---|
| **Standard Docker (runc)** | Shared Host Kernel | ~50ms | **Unsafe**: Vulnerable to kernel CVE exploits. |
| **gVisor (runsc)** | User-space virtualized kernel intercepting all syscalls | ~150ms | **High Security**: Re-implements 300+ Linux syscalls in memory (Go). Zero direct host kernel access. |
| **Firecracker MicroVM** | Dedicated lightweight KVM virtual machine | ~5ms | **Maximum Security**: Hardware-level virtualization isolation. Industry standard at AWS Lambda. |

#### Judge Sandbox Security Defenses:
1. **Disabled Networking**: Sandbox network namespace configured with `--net=none` (zero outbound socket access).
2. **cgroups v2 Enforcement**:
   - `cpu.max`: Strict quota (e.g. 1 core max).
   - `memory.max`: Strict hard memory limit (e.g. 256 MB); triggers `OOMKilled` $\to$ `Memory Limit Exceeded`.
   - `pids.max`: Hard limit of 32 processes (neutralizes fork bombs instantly).
3. **seccomp-bpf Filters**: Whitelist only permitted syscalls (`read`, `write`, `exit_group`, `mmap`). Block dangerous syscalls (`ptrace`, `reboot`, `sys_chroot`).
4. **Read-Only Root Filesystem**: Root filesystem mounted `ro`; temporary `/tmp` mounted in RAM (`tmpfs`) with 10 MB limit.

### Deep Dive 2: Deterministic Benchmarking (Runtime & Memory Percentiles)
How does LeetCode calculate: *"Your runtime beats 94.2% of C++ submissions"*?
- **The Problem of Noisy Neighbors**: If Worker A is running 8 heavy Python jobs while Worker B is idle, a C++ solution on Worker A will run slower, skewing percentiles.
- **CPU Pinning (`taskset`)**:
  - Each sandbox is pinned to dedicated physical CPU cores (`cpuset.cpus = "2,3"`).
  - Hyper-threading is disabled to prevent L1/L2 cache contention between adjacent logical cores.
- **Percentile Calculation (Histogram Bucketing)**:
  - For each `(problem_id, language)` tuple, maintain an in-memory histogram in Redis:
    - Bucket 0: 0–4ms
    - Bucket 1: 5–8ms
    - Bucket 2: 9–12ms
  - When a submission records 4ms, the service increments Bucket 0 via `HINCRBY` and calculates the percentile dynamically using cumulative distribution.

### Deep Dive 3: Test Case Storage & Caching Strategy
If a problem has 100 test cases totaling 50 MB (e.g. large graphs or 100,000-element arrays), downloading test cases from S3 for every submission creates a catastrophic network bottleneck!
- **Worker Local NVMe Cache**:
  - Test cases are packaged into compressed archive files on S3.
  - Judge Workers cache active problem test cases in a local LRU cache on high-speed NVMe SSD or in memory (`tmpfs`).
  - When a contest starts, the 4 contest problems are **pre-warmed** across all judge workers before the contest begins, achieving **zero S3 fetch latency** during submissions.

---

## 5. Architectural Trade-Off Matrix

| Design Area | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Client Result Delivery** | Client Polling every 1s | Server-Sent Events (SSE) | **SSE**: Polling creates 5,000 QPS of wasted HTTP overhead. SSE provides immediate, push-based verdict updates over a single open HTTP connection. |
| **Judge Scheduling** | Push Model (Central Dispatcher) | Pull Model (Workers pull from Kafka) | **Pull Model via Kafka**: Prevents overloading slow workers; workers pull jobs only when they have free sandbox capacity. Naturally provides backpressure during surges. |
| **Sandbox Architecture** | Full Virtual Machine (VMware) | gVisor / Firecracker MicroVMs | **Firecracker**: Boots in 5ms with minimal RAM overhead (5 MB per microVM) while providing hardware-isolated virtualization safety. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Understands asynchronous processing using message queues (RabbitMQ/Kafka).
- Designs relational schemas for Problems, Submissions, and Verdicts.
- Explains basic container isolation using Docker and time/memory limits.
- Implements polling or WebSockets to return execution verdicts to users.

### Senior (L5 / IC5)
- Identifies critical security vulnerabilities of Docker and explains user-space kernel virtualization (gVisor) or MicroVMs (Firecracker).
- Configures Linux `cgroups` (CPU quotas, memory limits, PID limits) and `seccomp` system call filters.
- Solves testcase caching using local NVMe/tmpfs pre-warming to prevent S3 bottlenecks.
- Designs priority queues to ensure live contest submissions are never blocked behind background practice runs.

### Staff+ (L6 / Principal)
- Evaluates deterministic hardware benchmarking across heterogeneous judge clusters (cloud instances with different CPU clock frequencies).
- Designs multi-tenant isolation and abuse prevention: Defending against covert timing channel attacks, compiler exploits (e.g., C++ template metaprogramming recursion DoS), and memory dumping.
- Architects instant contest leaderboard calculation: Handling 50,000 contestants with real-time score and penalty updates using Redis Sorted Sets and distributed streaming rank trees.
