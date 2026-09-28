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
