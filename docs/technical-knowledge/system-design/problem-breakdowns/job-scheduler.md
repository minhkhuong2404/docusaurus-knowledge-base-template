---
id: job-scheduler
title: Design a Distributed Job Scheduler Like Quartz / Temporal
sidebar_label: 22. Job Scheduler
description: Staff-level system design breakdown for a fault-tolerant distributed job scheduler executing millions of recurring crons and delayed tasks.
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design a Distributed Job Scheduler Like Quartz / Temporal

A distributed job scheduler (e.g., Temporal, Apache Airflow, Quartz, AWS Step Functions) orchestrates the execution of millions of scheduled background jobs, recurring crons (e.g. `0 0 * * *` midnight billing), and delayed one-off tasks (e.g. "Send reminder email in 3 days"). The system must guarantee reliable execution, survive node crashes, and enforce **at-least-once** delivery with task idempotency.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Schedule Delayed Tasks**: Schedule a one-off job to execute at an exact future timestamp (e.g., `execute_at = 2026-09-25 14:00:00`).
2. **Recurring Crons**: Support recurring cron syntax expressions (e.g. every 5 minutes, daily at midnight).
3. **Execute Job**: Dispatch jobs to specialized worker pools based on task type (Email, Billing, Data Processing).
4. **Retry & Backoff**: Automatically retry failed tasks with exponential backoff and jitter up to a maximum attempt threshold.
5. **Job Lifecycle & Monitoring**: View task status (`SCHEDULED`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED`), execution logs, and historical metrics.

### Non-Functional Requirements
- **High Timing Precision**: Jobs must fire within `< 1 second` of their scheduled execution time.
- **At-Least-Once Execution Guarantee**: A scheduled job must never be lost or silently dropped, even if workers or scheduler masters crash.
- **High Throughput**: Schedule and execute **Tens of Thousands of jobs per second**.
- **Idempotency & Deduplication**: Tasks must carry unique idempotency keys to ensure workers do not execute duplicate operations during retries.

### Capacity Estimations & Sizing
- **Total Registered Jobs**: 100 Million scheduled jobs in the system.
- **Job Execution Rate**:
  - Peak rate: **20,000 jobs dispatched/sec**.
- **Job Payload Sizing**:
  - Task metadata: `job_id` (16 bytes) + `cron_expr` (32 bytes) + `payload_json` (500 bytes) + `status` (8 bytes) + timestamps $\approx$ **1 KB**.
  - 100 Million active jobs $\times$ 1 KB $\approx$ **100 GB storage** (stored in relational DB with partition by status and schedule time).
- **Execution Log Retention (90 Days)**:
  - 500 Million completed runs/day $\times$ 90 days = 45 Billion execution logs $\implies$ **4.5 TB** (stored in ClickHouse or S3 for auditing).

---

## 2. The Set Up

### Defining the Core Entities

```
┌────────────────────────────────────────────────────────┐
│                        JOB_DEF                         │
├──────────────────┬──────────────┬──────────────────────┤
│ job_id           │ UUID         │ PRIMARY KEY          │
│ name             │ VARCHAR(100) │ NOT NULL             │
│ cron_expression  │ VARCHAR(64)  │ NULLABLE (For crons) │
│ target_endpoint  │ VARCHAR(255) │ gRPC / HTTP Worker   │
│ payload_json     │ JSONB        │ Execution arguments  │
│ max_retries      │ INT          │ Default: 3           │
│ is_active        │ BOOLEAN      │ DEFAULT TRUE         │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                     JOB_INSTANCE                       │
├──────────────────┬──────────────┬──────────────────────┤
│ instance_id      │ UUID         │ PRIMARY KEY          │
│ job_id           │ UUID         │ INDEX, FK            │
│ scheduled_time   │ TIMESTAMP    │ B+Tree / Partition   │
│ status           │ VARCHAR(16)  │ PENDING / RUNNING /  │
│                  │              │ COMPLETED / FAILED   │
│ locked_by_worker │ VARCHAR(64)  │ Worker Node Hostname │
│ lock_expires_at  │ TIMESTAMP    │ Lease Expiration     │
│ retry_count      │ INT          │ Default: 0           │
│ idempotency_key  │ VARCHAR(64)  │ UNIQUE               │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API Design

#### Schedule a Delayed Task
```http
POST /api/v1/jobs/schedule
Content-Type: application/json
Idempotency-Key: sched_9918-a012

{
  "name": "SendUserOnboardingEmail",
  "execute_at": "2026-09-25T14:00:00Z",
  "target_topic": "email-worker-pool",
  "payload": {
    "user_id": "usr_88192",
    "template": "welcome_day_3"
  }
}
```
**Response (`201 Created`)**:
```json
{
  "job_id": "job_99a81203",
  "instance_id": "inst_1049281",
  "status": "SCHEDULED",
  "scheduled_time": "2026-09-25T14:00:00Z"
}
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="job-scheduler" title="Distributed Job Scheduler & Timing Wheel Architecture" />

### Core Scheduler Subsystems

#### 1. The Coordinator / Leader Cluster (etcd / Raft)
- Elects an active **Scheduler Leader** to prevent split-brain dual-scheduling.
- Coordinates worker node heartbeats and lease renewals.

#### 2. The Delayed Queue Engine (Hierarchical Timing Wheel & Redis ZSET)
- High-precision timer that tracks upcoming jobs.
- Moves jobs from the `PENDING` state to an executable message queue (Kafka/RabbitMQ) the millisecond their target execution time arrives.

#### 3. The Execution Worker Pool
- Stateless worker nodes pull jobs from Kafka topics, execute business logic (calling external microservices), and report status.
- Renews an active task lease heartbeat every 10 seconds.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: Delayed Scheduling Data Structures (DB Polling vs Redis ZSET vs Timing Wheel)
How do we find which jobs are ready to run right now without running `SELECT * FROM jobs WHERE scheduled_time <= NOW()` every 100ms?

| Mechanism | Implementation | Pros | Bottleneck / Production Gotcha |
|---|---|---|---|
| **Database Polling** | `SELECT ... WHERE scheduled_time <= NOW() LIMIT 100` | Simple, persistent. | Severe database lock contention; polling millions of rows every second thrashes disk I/O. |
| **Redis Sorted Set (ZSET)** | `ZADD delayed_queue <epoch_ts> <job_id>` | Fast in-memory range queries via `ZRANGEBYSCORE`. | Memory limit: Storing 100 Million jobs in RAM is expensive. |
| **Hierarchical Timing Wheel (Kafka/Netty Model)** | Multi-tier circular ring buffer (Hours $\to$ Minutes $\to$ Seconds). | **$O(1)$ add, $O(1)$ trigger**. Blazing fast; minimal CPU overhead. | Requires durable backing store to survive node reboots. |

#### The Hierarchical Timing Wheel Architecture:
```
Tier 1: Days Wheel (30 buckets, 1 bucket = 1 day)
Tier 2: Hours Wheel (24 buckets, 1 bucket = 1 hour)
Tier 3: Minutes Wheel (60 buckets, 1 bucket = 1 minute)
Tier 4: Seconds Wheel (60 buckets, 1 bucket = 1 second)

A job scheduled for 3 days, 4 hours, and 12 seconds from now is placed into Tier 1.
As time progresses, the job cascades down:
Tier 1 ➔ Tier 2 ➔ Tier 3 ➔ Tier 4.
When it reaches Tier 4 and the second bucket expires, the job fires in O(1) time!
```

### Deep Dive 2: Worker Failures & Task Lease Expiration (Heartbeats)
What happens if Worker 4 picks up a 2-hour video rendering job and suddenly suffers a hardware kernel panic 10 minutes in?

- **The Worker Lease Pattern**:
  1. When a worker claims a job, it sets:
     `status = 'RUNNING'`, `locked_by_worker = 'worker_4'`, `lock_expires_at = now() + 30 seconds`.
  2. While the worker executes the job, a background thread sends a heartbeat every 10 seconds, extending the lease:
     `UPDATE job_instance SET lock_expires_at = now() + 30 seconds WHERE instance_id = ? AND locked_by_worker = 'worker_4'`.
  3. **Crash Detection**:
     - If Worker 4 crashes, its heartbeat ceases.
     - Within 30 seconds, `lock_expires_at < now()`.
     - A **Scheduler Sweeper Worker** detects the expired lease, resets the status back to `PENDING`, increments `retry_count`, and re-queues the job to Kafka for another worker to resume!

### Deep Dive 3: Idempotency & Distributed Deduplication
If Worker 4 charged a customer's credit card and then crashed before reporting `status = COMPLETED`, the sweeper worker will reassign the task, potentially charging the customer twice!
- **Mandatory Idempotency Keys**:
  - Every job instance is generated with a deterministic `idempotency_key` (e.g., `billing:sub_991:month:202609`).
  - Downstream services (Payment Gateways, Email Providers) must accept the `idempotency_key`.
  - If a worker retries an already-processed task, the payment gateway detects the key and returns the existing transaction receipt without re-charging.

---

## 5. Architectural Trade-Off Matrix

| Design Area | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Execution Delivery** | At-Most-Once (Fast, Drop on Error) | At-Least-Once (Persistent Retries) | **At-Least-Once**: Critical business jobs (billing, notifications) must never be dropped. Combined with consumer idempotency, it provides end-to-end exactly-once behavior. |
| **Timer Engine** | Relational Database Polling | Redis ZSET + Hierarchical Timing Wheel | **Timing Wheel**: $O(1)$ complexity. Eliminates periodic relational database table locks and handles 20K+ triggers/sec effortlessly. |
| **Scheduler Clustering** | Active-Active Dual Masters | Active-Passive Single Leader (Raft / etcd) | **Active-Passive Leader**: Active-active schedulers suffer from split-brain double-dispatch conflicts during network partitions. A single Raft leader guarantees deterministic dispatch. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Explains the difference between delayed tasks and recurring cron jobs.
- Designs relational schemas for Jobs, Instances, and Execution Logs.
- Understands the need for worker pools and asynchronous execution via queues.
- Implements basic retry loops with max retry counts.

### Senior (L5 / IC5)
- Explains the **Hierarchical Timing Wheel** data structure and compares it with Redis Sorted Sets.
- Implements the Worker Lease and Heartbeat pattern to detect and recover from worker crashes.
- Enforces At-Least-Once execution guarantees and explains the role of consumer idempotency keys.
- Designs active-passive leader election using etcd / ZooKeeper to prevent split-brain dual dispatch.

### Staff+ (L6 / Principal)
- Evaluates distributed workflow orchestration (DAG task dependencies, step transitions, state machine rollbacks as seen in Temporal/Cadence).
- Designs multi-tenant scheduler quota enforcement: Preventing a single abusive tenant from consuming 100% of the worker thread capacity.
- Solves disaster recovery across cloud regions: Handling cross-datacenter leader failover without executing duplicate jobs or dropping scheduled timer events.

---

## 7. Production Deep Dives: Fencing Tokens, Sharded Pollers & DAG Orchestration

> **Reference**: [Sujeet Pro — Task Scheduler Design](https://sujeet.pro/articles/task-scheduler-design)

### 1. Comparing the 4 Storage & Timer Coordination Engines
At hyperscale, a distributed job scheduler separates **Cold/Durable Schedule Storage** (jobs scheduled hours or months in the future) from the **Hot In-Memory Timer Engine** (jobs firing within the next 60 seconds):

1. **RDBMS Polling with `SELECT ... FOR UPDATE SKIP LOCKED`**:
   - Ideal up to **5,000–10,000 jobs/sec**. Requires a **partial B+Tree index** (`CREATE INDEX ON job_instance (scheduled_time) WHERE status = 'PENDING'`) so completed historical runs do not bloat the index. `SKIP LOCKED` allows dozens of concurrent scheduler pollers to claim disjoint batches without blocking each other on row locks.
2. **Redis Sorted Sets (`ZSET`) + Atomic Lua Claiming**:
   - Stores `(score = epoch_ms, member = instance_id)`. Pollers run an atomic Lua script that executes `ZRANGEBYSCORE delayed_queue -inf <now_ms> LIMIT 0 100`, removes those IDs via `ZREM`, and pushes them to a ready stream/list. Achieves **50k+ triggers/sec**, but storing hundreds of millions of future jobs in RAM is costly and vulnerable to async replication lag on Redis failover.
3. **Hierarchical Hashed Timing Wheels (Netty / Kafka Purgatory Model)**:
   - A circular ring buffer of $N$ slots (e.g., 60 slots $\times$ 100ms tick = 6s wheel, cascading into Minute and Hour wheels). Insertion and cancellation are **$O(1)$** (append to doubly-linked list in bucket `slot = (target_time / tick_ms) % N`), and advancing the clock tick is **$O(1)$**.
   - **Two-Tier Hybrid Pattern**: Keep all 100M scheduled jobs in a durable database partitioned by `time_bucket_minute`. A background **Lookahead Loader** reads the upcoming 5 minutes of jobs for its assigned shard into the in-memory Timing Wheel, combining $O(1)$ sub-second precision with unlimited disk capacity.
4. **RocksDB / Cassandra Time-Bucketed Partitions**:
   - Models the table as `PRIMARY KEY ((epoch_minute, shard_id), scheduled_time, instance_id)`. To dispatch jobs at `14:05`, scheduler workers read `epoch_minute = 202611141405` across shards `0..K-1`. Old minute partitions are dropped via TTL or `DROP PART` with zero compaction or B+Tree vacuum overhead.

---

### 2. Zombie Worker Fencing via Monotonic `fencing_token`
Heartbeats and visibility timeouts detect crashed workers, but they **cannot prevent split-brain execution** when a live worker freezes (due to JVM GC pause, page fault stall, or network partition) longer than its `lock_expires_at` window:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                       ZOMBIE WORKER FENCING (MONOTONIC TOKEN)                          │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  1. Worker A claims Job #99 ➔ DB increments attempt_fencing_token = 1                  │
│  2. Worker A freezes (45s JVM GC pause); lease expires at t = 30s                      │
│  3. Sweeper reassigns Job #99 to Worker B ➔ DB increments attempt_fencing_token = 2    │
│  4. Worker B completes Job #99 and commits side-effect with fencing_token = 2          │
│  5. Worker A unfreezes at t = 45s and tries to write side-effect with fencing_token = 1│
│     ➔ Downstream Storage / DB checks: incoming_token (1) < max_seen_token (2)          │
│     ➔ REJECTED (409 Stale Fencing Token)! Zero duplicate side effects.                 │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

Every claim transition (`PENDING -> RUNNING` or expired `RUNNING -> RUNNING`) atomically increments `fencing_token` (or `attempt_number`). Both the scheduler state database and any downstream stateful resource validate `WHERE fencing_token = :token`.

---

### 3. Partitioned Leader / Sharded Poller Coordination & DAG Workflows
- **Sharded Poller Ring (Avoiding Single-Leader Bottlenecks)**:
  Instead of a single active leader polling 100M jobs, partition all job instances into **256 virtual shards** (`shard_id = MurmurHash3(job_id) & 255`). Scheduler coordinator nodes form an **etcd / Raft lease group** (or Kafka consumer group) where each node is assigned an exclusive range of shards. If Node 3 dies, its etcd lease expires in 10 seconds and its shards rebalance across surviving nodes.
- **DAG Workflow Execution (Airflow / Temporal Model)**:
  When a workflow consists of dependent tasks ($A \to C, B \to C$), the scheduler stores an adjacency table `dag_edges(parent_id, child_id)` and an atomic counter `pending_dependencies` on each child vertex. When a parent task transitions to `COMPLETED`, the state machine decrements `pending_dependencies` on all children inside the same transaction; any child reaching `pending_dependencies == 0` is immediately enqueued into the ready queue.

---

## 🧠 Senior/Staff Interview Playbook: How to Ace Distributed Job Scheduler Interviews

### 1. The Senior Framing Strategy (First 60 Seconds)

When asked to *"Design a Distributed Task Scheduler (like Quartz, Temporal, or CloudWatch Events) at 50,000 jobs/sec"*, anchor your design on four pillars:
1. **Separate the Hot Timer Plane from the Cold Storage Plane**:
   - Do not hold 100M long-term jobs in Redis RAM, and do not poll a 100M-row SQL table every 100ms without partitioning. Store durable job definitions and future instances on disk (partitioned by **Minute Time-Bucket + Shard ID**), and stream the next 60 seconds of due tasks into an in-memory **Hierarchical Timing Wheel** or **Redis ZSET**.
2. **At-Least-Once Dispatch + Idempotent/Fenced Execution**:
   - Network partitions and worker crashes mean a job *will* occasionally be dispatched twice. Guarantee **Effectively-Once** semantics using three primitives: **Lease Heartbeats**, **Monotonic Fencing Tokens (`attempt_number`)**, and deterministic **Idempotency Keys** (`hash(job_id + scheduled_time)`).
3. **Cron Next-Run Determinism & Misfire Policies**:
   - Never compute the next cron tick upon task *completion* if you want fixed-schedule accuracy; compute and persist the next instance upon *dispatch* (or via a dedicated lookahead generator), and explicitly define **misfire policies** (`SKIP_MISFIRED`, `FIRE_ONCE_NOW`, `BACKFILL_ALL`).
4. **Multi-Tenant Isolation & Backpressure**:
   - Decouple the **Timer Trigger Engine** from **Task Execution Workers** via partitioned Kafka topics (`jobs-high-priority`, `jobs-default`, `jobs-bulk`) so a slow downstream HTTP endpoint or a single tenant's 1M-job spike never stalls the global timer clock.

### 2. Classic Interviewer Traps & Principal Rebuttals

#### Trap 1: "Why not just store all scheduled jobs in a Redis Sorted Set (`ZSET`) with the Unix timestamp as the score and poll `ZRANGEBYSCORE`?"
* **Junior/Mid Answer:** "Redis ZSET is super fast ($O(\log N)$) and handles tens of thousands of operations per second, so it's the best primary store for a job scheduler."
* **Principal Rebuttal:** "Using Redis as the **sole primary store** fails two Staff-level requirements:
  1. **Durability & Failover Loss**: Redis replication is asynchronous, and AOF `everysec` can lose up to 1 second of committed financial/billing schedules during a node crash or primary-replica failover.
  2. **Memory Wall**: 200 Million scheduled jobs with 2 KB payloads requires `> 400 GB` of expensive DRAM just to hold tasks that won't fire for 30 days.
  The production architecture persists all jobs in an **ACID database / RocksDB time-bucketed store**, and uses a **Lookahead Pump** to load only jobs due in the next `60 seconds` into Redis ZSET or an in-memory **Hierarchical Timing Wheel**."

#### Trap 2: "Multiple scheduler nodes poll PostgreSQL with `SELECT * FROM job_instance WHERE status='PENDING' AND scheduled_time <= NOW() LIMIT 100`. What happens at 10,000 jobs/sec?"
* **Junior/Mid Answer:** "We put an index on `(status, scheduled_time)` and update the status to `RUNNING` in a transaction."
* **Principal Rebuttal:** "Without `FOR UPDATE SKIP LOCKED` and shard partitioning, 20 poller nodes executing that query at the exact same millisecond will select the **exact same top 100 rows**, causing 19 of the 20 nodes to block on row locks or fail optimistic concurrency checks—wasting 95% of DB CPU! Furthermore, a standard index on `(status, scheduled_time)` becomes 99% filled with millions of historical `COMPLETED` rows. You **must**:
  1. Use a **Partial Index** (`WHERE status = 'PENDING'`) so the B+Tree only contains active future work.
  2. Use `FOR UPDATE SKIP LOCKED` (or **Shard-Assigned Pollers** where Poller $i$ only queries `shard_id = i`) to eliminate cross-worker lock contention."

#### Trap 3: "If a recurring cron job is scheduled for every 1 minute, and the 12:01 run takes 3 minutes to finish, what happens at 12:02 and 12:03?"
* **Junior/Mid Answer:** "The scheduler fires a new instance every minute on a separate worker thread."
* **Principal Rebuttal:** "Blindly firing overlapping cron instances causes catastrophic resource exhaustion (e.g., if a database backup or billing sync slows down, overlapping runs pile up and crash the DB). A production scheduler enforces an explicit per-job **`ConcurrencyPolicy`** (modeled on Kubernetes CronJob / Temporal):
  - `FORBID` (Default for stateful batch): If the previous `job_id` instance is still `RUNNING`, skip the 12:02 tick and emit a `cron_misfire_skipped` metric.
  - `BUFFER_ONE`: Queue at most 1 pending run to execute immediately after the current run finishes.
  - `ALLOW`: Run concurrently (only safe for stateless, partitioned tasks)."

#### Trap 4: "When a worker crashes mid-job and the lease expires after 30 seconds, the sweeper re-queues the job. What if the original worker wasn't dead—just paused by GC—and finishes right after the new worker starts?"
* **Junior/Mid Answer:** "The heartbeat thread will fail to update the lease, so the first worker will know its lease expired and stop."
* **Principal Rebuttal:** "A GC pause freezes **all** threads in the JVM simultaneously—including the background heartbeat thread! When the JVM unfreezes, the worker thread may be on the exact line of code right before writing the output to S3 or charging the customer, before the heartbeat thread gets scheduled by the OS. To guarantee safety:
  1. Increment a monotonic **`fencing_token` (`attempt_number`)** in the DB on every lease claim.
  2. Pass both `idempotency_key = hash(job_id, scheduled_time)` and `fencing_token` to downstream APIs/databases so any stale write with an older `fencing_token` is atomically rejected."

### 3. Quick Reference — Mid-Level vs. Principal Candidate Cheat Sheet

| Concept / Scenario | Mid-Level Candidate Says | Principal Candidate Demonstrates |
| :--- | :--- | :--- |
| **Timer Data Structure** | "Poll SQL `WHERE scheduled_time <= NOW()` or put everything in Redis ZSET." | "Combine **Time-Bucketed Durable Storage (`epoch_minute, shard_id`)** with an in-memory **Hierarchical Timing Wheel ($O(1)$)** via a 60s Lookahead Loader." |
| **Concurrent Pollers** | "Lock the table or use optimistic locking when claiming jobs." | "Assign disjoint **Virtual Shards (`0..255`)** via etcd leases, and use `SELECT ... FOR UPDATE SKIP LOCKED` backed by a **Partial Index (`WHERE status='PENDING'`)**." |
| **Zombie Worker Defense** | "Use a 30-second visibility timeout and heartbeat every 10s." | "Pair lease heartbeats with a monotonic **`fencing_token`** validated on every state transition and downstream write, plus deterministic `idempotency_key`s." |
| **Recurring Crons** | "Re-calculate `next_run_time` when the job finishes." | "Enforce explicit **Overlap (`FORBID`/`ALLOW`)** and **Misfire (`SKIP`/`FIRE_ONCE`)** policies; handle timezone DST transitions cleanly." |
| **Poison-Pill Tasks** | "Retry failed tasks 3 times, then mark `FAILED`." | "Apply **Exponential Backoff + Full Jitter** via delayed retry buckets, isolate failures into a **Dead-Letter Queue (DLQ)** with replay tooling, and enforce per-tenant worker quotas." |

