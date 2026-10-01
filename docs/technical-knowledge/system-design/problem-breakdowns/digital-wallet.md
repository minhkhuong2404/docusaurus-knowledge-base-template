---
id: digital-wallet
title: Design a Digital Wallet & Distributed Ledger (1,000,000 TPS)
sidebar_label: 47. Digital Wallet (Ledger & 1M TPS)
description: Staff-level system design breakdown for a high-throughput digital wallet service supporting 1,000,000 TPS with double-entry bookkeeping, Try-Confirm/Cancel (TC/C) transactions, and Raft-replicated event sourcing.
---

import DigitalWalletLedgerDiagram from '@site/src/components/DigitalWalletLedgerDiagram';

# Design a Digital Wallet & Distributed Ledger (1,000,000 TPS)

A **Digital Wallet** platform (such as PayPal, Alipay, Venmo, or Apple Cash) allows millions of users to store monetary balances, transfer funds between accounts instantly, top up balances via external banks, and make retail payments. While a retail payment gateway (like Stripe) focuses on orchestration with external credit card acquirers, a **wallet engine is fundamentally an internal bank ledger**: it must execute hundreds of thousands to millions of financial balance mutations per second with **zero data loss, absolute mathematical balance invariants, and deterministic auditability**.

---

## 1. Requirements & System Scope

### Functional Requirements
1. **Wallet Balance Operations**: Real-time balance queries for accounts across multiple currencies.
2. **Peer-to-Peer Transfers**: Atomic movement of funds between Account A and Account B within the platform.
3. **Double-Entry Bookkeeping**: Every transaction must record balanced debit and credit posting legs. In-place balance mutations (`UPDATE balance = balance - 100`) are strictly forbidden.
4. **Historical Reconciliation & Audit**: Complete immutable ledger history to support daily regulatory settlement and reconciliation.

### Non-Functional Requirements
- **Extreme Scale Throughput**: Must support **1,000,000 transactions per second (TPS)** during peak shopping festivals (e.g., Singles' Day or Black Friday).
- **Sub-10ms Latency**: P99 transfer execution latency $< 10\text{ms}$.
- **Strict ACID & Zero Financial Loss**: Exactly-once processing guarantee. Under no failure mode (hardware crash, network partition, power outage) can money vanish or be duplicated.
- **High Availability**: `99.999%` uptime (less than 5.26 minutes of downtime per year).

---

## 2. The Scale Problem: Why Relational Databases Fail at 1,000,000 TPS

A standard relational architecture uses an ACID database (like PostgreSQL or MySQL):

```sql
-- TRADITIONAL RELATIONAL TRANSACTION (FAILS AT 1M TPS)
BEGIN TRANSACTION;
SELECT balance FROM accounts WHERE user_id = 101 FOR UPDATE;
UPDATE accounts SET balance = balance - 100 WHERE user_id = 101;
UPDATE accounts SET balance = balance + 100 WHERE user_id = 102;
INSERT INTO ledger_journal (txn_id, from_user, to_user, amount) VALUES ('txn_8842', 101, 102, 100);
COMMIT;
```

### Why This Architecture Crumbles:
1. **Row-Level Lock Contention**: When multiple concurrent transactions interact with popular merchant accounts or payroll accounts, row-level locks (`SELECT FOR UPDATE`) create massive thread queuing, lock waits, and deadlocks.
2. **Disk I/O Write Amplification**: Committing a transaction requires flushing the database Write-Ahead Log (WAL) to NVMe SSD (`fsync`). Modern high-end enterprise NVMe drives achieve ~100k–200k random write IOPS. Sustaining 1,000,000 TPS requires millions of synchronous disk flushes per second, exceeding physical hardware limits without massive distributed sharding.
3. **Distributed Two-Phase Commit (2PC) Latency**: If accounts reside on different database shards, 2PC introduces two sequential network round-trips with blocking coordinator locks. Network latency ($0.5\text{ms} \times 4 = 2\text{ms}$) bounds throughput to a few hundred TPS per shard.

---

## 3. High-Level Architecture & Interactive Diagram

<DigitalWalletLedgerDiagram />

---

## 4. Fundamental Accounting Principles: Double-Entry Bookkeeping

The cornerstone of all financial engineering is **Double-Entry Bookkeeping**:

```
Every transaction must have at least two posting legs:
           Total Debits = Total Credits
```

### Ledger Journal Schema
The ledger records immutable entries in an append-only table:

```
┌────────────────────────────────────────────────────────────────────────┐
│                             LEDGER_ENTRY                               │
├───────────────────┬──────────────┬─────────────────────────────────────┤
│ entry_id          │ BIGINT       │ Monotonic Sequence ID (PK)          │
│ transaction_id    │ UUID         │ Idempotency Grouping Key            │
│ account_id        │ VARCHAR(64)  │ Target Ledger Account               │
│ direction         │ ENUM         │ DEBIT (+ Assets) | CREDIT (+ Liab)  │
│ amount            │ BIGINT       │ Amount in Minor Units (Cents)       │
│ currency          │ VARCHAR(3)   │ ISO 4217 (USD, EUR, etc.)           │
│ created_at        │ TIMESTAMP    │ Immutable Audit Timestamp           │
└───────────────────┴──────────────┴─────────────────────────────────────┘
```

#### Transfer Example: User A transfers $100 to User B
```
Entry 1: Account A (Liability)  | DEBIT  | $100.00  (Liability decreases)
Entry 2: Account B (Liability)  | CREDIT | $100.00  (Liability increases)
SUM(Debits) - SUM(Credits) = 0.00  [BALANCED]
```

Account balance is **never stored as a mutable integer in a table**. It is a **derived view** computed by summing historical ledger entries:
$$\text{Balance}_{\text{Account}} = \sum \text{Credits} - \sum \text{Debits}$$

To optimize read performance, snapshot balances are pre-aggregated into in-memory caches and materialized views at periodic checkpoints.

---

## 5. Distributed Transaction Strategies: 2PC vs TC/C vs Saga

When a transaction spans multiple independent banking services or ledger shards, we must choose a distributed consistency protocol:

```
┌───────────────────────────┬───────────────────────────┬───────────────────────────┐
│ 2-Phase Commit (2PC)      │ Try-Confirm/Cancel (TC/C) │ Orchestrated Saga         │
├───────────────────────────┼───────────────────────────┼───────────────────────────┤
│ Heavy database-level      │ Application-level 2-phase │ Asynchronous event-driven │
│ blocking locks (XA)       │ with reserved funds       │ compensating transactions │
└───────────────────────────┴───────────────────────────┴───────────────────────────┘
```

### 5.1 Try-Confirm/Cancel (TC/C) Pattern (Recommended for Wallets)
Unlike 2PC, which holds database row locks across network round-trips, **TC/C operates at the business application layer**:

```
Step 1: TRY (Reservation Phase)
   - Account A: balance $500 -> available $400, reserved $100
   - Account B: verify Account B is active and eligible

Step 2: CONFIRM (Execution Phase)
   - Account A: reserved $100 deducted permanently
   - Account B: balance credited +$100
   - Transaction marked COMPLETED

Alternative: CANCEL (Rollback Phase)
   - Account A: reserved $100 returned -> available $500
   - Transaction marked CANCELLED
```

**Why TC/C Excels**:
- No physical database locks are held between the Try and Confirm phases.
- If the Confirm phase encounters temporary network failures, the coordinator retries idempotently until success.
- If Account B fails compliance validation during Try, the coordinator calls Cancel on Account A.

---

## 6. Reaching 1,000,000 TPS: Memory-Mapped Event Sourcing & Raft

To achieve 1,000,000 TPS with zero database lock contention, the architecture transitions to an **In-Memory Event Sourcing Engine** (pioneered by LMAX and adopted by modern FinTech backbones):

```
┌────────────────────────────────────────────────────────────────────────┐
│                   IN-MEMORY DETERMINISTIC WALLET NODE                  │
│                                                                        │
│   Incoming Command                                                     │
│         │                                                              │
│         ▼                                                              │
│   ┌───────────────┐        mmap write                                  │
│   │ Monotonic Seq │ ──────────────────────▶ Append-Only WAL (NVMe SSD) │
│   └───────┬───────┘                                                    │
│           │                                                            │
│           ▼                                                            │
│   ┌───────────────┐        Zero Locks                                  │
│   │ Single-Thread │ ──────────────────────▶ In-Memory State Machine    │
│   │ Execution FSM │                         (Balances in RAM HashMap)  │
│   └───────┬───────┘                                                    │
│           │                                                            │
│           ▼                                                            │
│   ┌───────────────┐        Network Socket                              │
│   │ Raft Consens. │ ──────────────────────▶ Follower Nodes (Replicas)  │
│   └───────────────┘                                                    │
└────────────────────────────────────────────────────────────────────────┘
```

### Core Architectural Mechanics:
1. **Memory-Mapped Files (`mmap`)**:
   - Write-Ahead Log entries are written to local NVMe storage using Linux `mmap` syscalls, bypassing standard user-space to kernel-space buffer copies. Sequential append throughput on modern NVMe drives easily exceeds $1\text{ GB/sec}$ ($> 10\text{ Million records/sec}$).
2. **Single-Threaded Deterministic State Machine**:
   - Each ledger partition is owned by a single dedicated CPU core pinned via thread affinity (`pthread_setaffinity_np`).
   - Because only **one thread** mutates the balance hash map, there are **zero mutex locks, zero CAS loops, and zero memory barrier cache bounces**.
3. **Raft Consensus Replication**:
   - Every state transition event is replicated to a quorum of follower nodes via Raft consensus. A transaction is confirmed only when acknowledged by $N/2 + 1$ nodes.
4. **CQRS (Command Query Responsibility Segregation)**:
   - Balance mutations (Writes) occur exclusively on the in-memory write engine.
   - Read-only queries (user balance checks, transaction history) are served asynchronously by read replicas hydrated via Kafka changelog streams.

---

## 7. Distributed Transaction Idempotency Pattern

Network retries can result in duplicate debit requests. The system enforces strict idempotency at the API gateway and ledger core:

```
Client ──[Idempotency-Key: uuid-v4]──▶ API Gateway ──▶ Redis Distributed Lock
```

```java
public TransactionResult executeTransfer(TransferCommand cmd) {
    String lockKey = "lock:wallet:transfer:" + cmd.getIdempotencyKey();
    
    // Acquire distributed lock with short TTL (e.g. 5 seconds)
    boolean acquired = redisLock.acquire(lockKey, 5000);
    if (!acquired) {
        throw new DuplicateTransactionException("Transaction in flight");
    }
    
    try {
        // 1. Check if transaction has already completed
        Transaction existing = ledgerRepository.findByIdempotencyKey(cmd.getIdempotencyKey());
        if (existing != null) {
            return existing.toResult(); // Return cached response
        }
        
        // 2. Execute Double-Entry Booking in Ledger FSM
        return ledgerEngine.process(cmd);
    } finally {
        redisLock.release(lockKey);
    }
}
```

---

## 8. Failure Modes & Production Disaster Recovery

### 1. Primary Node Power Crash
- **Hazard**: Master node suffers sudden kernel panic or power loss while holding uncommitted in-memory states.
- **Recovery**: Raft leader election promotes a follower with the highest log index within 500ms. The new leader replays unapplied log entries from its local append-only log to restore exact in-memory state.

### 2. Dual Ledger Desynchronization (Split-Brain)
- **Hazard**: Network partition isolates Master Node A from followers, leading Node A to continue accepting writes while followers elect Node B.
- **Recovery**: Strict Raft quorum enforcement. Node A cannot commit any transaction without acknowledgments from a majority of nodes ($3\text{ of }5$). Isolated nodes automatically transition to candidate/follower state upon heartbeat timeout.

### 3. End-of-Day Ledger Reconciliation Discrepancy
- **Hazard**: Rounding errors or rare message delivery edge cases cause external bank balances to drift from internal wallet liabilities.
- **Recovery**: Automated nightly batch reconciliation engine compares internal ledger journals against external bank settlement files (MT940/CAMT.053). Any discrepancy triggers automated escrow adjustment accounts and immediate P1 alerts to financial operations.
