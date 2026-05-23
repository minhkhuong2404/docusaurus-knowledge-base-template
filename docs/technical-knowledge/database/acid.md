---
id: acid
title: Database ACID Properties
description: A comprehensive guide to database ACID properties (Atomicity, Consistency, Isolation, Durability) for both beginners and experienced engineers.
tags: [database, transactions, acid, basics, deep-dive]
sidebar_position: 5
---

# 🛡️ Database ACID Properties

In database systems, a **transaction** is a sequence of read and write operations treated as a single logical unit of work. To guarantee data integrity under concurrency and failures, relational databases enforce the **ACID** properties: **Atomicity**, **Consistency**, **Isolation**, and **Durability**.

This guide covers ACID from the ground up, starting with simple analogies for new learners and descending into the low-level execution mechanics for senior developers.

---

## 📊 ACID Cheat Sheet

| Property | Core Concept | Implementation Mechanism | Analogy |
| :--- | :--- | :--- | :--- |
| **Atomicity** | All-or-nothing execution. | Undo logs / Rollback logs, Shadow paging | Booking a round-trip ticket (both legs or neither). |
| **Consistency** | DB moves from one valid state to another. | Constraints, triggers, application logic | Account balance cannot be negative. |
| **Isolation** | Concurrent transactions do not interfere. | Locks (2PL), MVCC, SSI | Watching a movie in a private theater room. |
| **Durability** | Committed data is safe forever. | Write-Ahead Log (WAL), fsync | Writing a contract on stone instead of paper. |

---

## 🐣 ACID for New Learners

Let's understand ACID using a familiar, real-world scenario: **a bank transfer of $100 from Alice to Bob.**

This transfer requires two operations:
1. **Deduct $100** from Alice's account.
2. **Add $100** to Bob's account.

```
[ Alice: $500 ]  ──( -$100 )──►  [ Deducted: $100 ]  ──( +$100 )──►  [ Bob: $200 ]
```

Here is how the four ACID properties keep this transfer safe:

### 1. Atomicity (All or Nothing)
* **What it means**: The transaction cannot be partially completed. Either both steps succeed, or both fail.
* **The Analogy**: If the database crashes *after* deducting $100 from Alice but *before* adding it to Bob, the deducted $100 doesn't just disappear into thin air. The database detects the failure and **rolls back** Alice's balance back to its original state.
* **Result**: Alice doesn't lose her money, and Bob doesn't get free money.

### 2. Consistency (State Invariant Validation)
* **What it means**: The transaction must follow all rules (constraints) of the database.
* **The Analogy**: The bank has a rule: *"No account balance can fall below $0."* If Alice only has $50 in her account and tries to send $100, the database rejects the entire transaction.
* **Result**: The system remains in a valid state, preventing impossible financial scenarios.

### 3. Isolation (Work in Secret)
* **What it means**: If multiple transactions run at the same time, they shouldn't interfere with or see each other's half-finished work.
* **The Analogy**: While Alice's transfer is being processed, Bob shouldn't see his balance temporarily fluctuate, nor should Alice's husband be able to withdraw the same $100 at the exact same millisecond.
* **Result**: Each transaction feels like it has exclusive access to the database.

### 4. Durability (Unshakeable Memory)
* **What it means**: Once a transaction is completed ("committed"), its changes are permanent, even if the power cuts or the database server crashes.
* **The Analogy**: The moment the screen says *"Transfer Successful,"* that record is written directly to non-volatile storage (disk). If the server blows a fuse a second later, the money is still in Bob's account when the system restarts.
* **Result**: Completed work is never lost.

---

## 🔍 Deep Dive: How ACID Works Under the Hood

For senior developers, ACID isn't just an acronym; it represents a set of engineering tradeoffs and low-level subsystem interactions.

```
                   ┌──────────────────────────────────────┐
                   │             TRANSACTION              │
                   └──────────────────┬───────────────────┘
                                      │
         ┌──────────────────┬─────────┴─────────┬──────────────────┐
         ▼                  ▼                   ▼                  ▼
   [ ATOMICITY ]     [ CONSISTENCY ]      [ ISOLATION ]      [ DURABILITY ]
   • Undo/Redo Logs  • Constraints        • Locks (2PL)      • WAL / Redo
   • Shadow Paging   • Application Logic  • MVCC / SSI       • fsync / Sync
```

### 1. Atomicity: The Undo Mechanism

To achieve all-or-nothing behavior, the database must keep track of what it modifies so it can undo (roll back) those writes if a transaction aborts or crashes.

#### Undo Log (Rollback Segment)
* Every time a row is modified, the database writes the *before-image* (the old value) to an **Undo Log**.
* If a transaction executes `ROLLBACK`, or if the database crashes before committing, the engine reads the Undo Log backward and overwrites modified blocks with their original data.
* **InnoDB (MySQL)** uses dedicated undo logs inside the system tablespace.

#### Shadow Paging
* An alternative to logs where the database maintains two page tables: a current table and a shadow table.
* Writes are directed to new, copied blocks. On commit, the system simply flips the pointer to the new page table. If it aborts, it discards the new page table, leaving the shadow table untouched.
* Shadow paging avoids log maintenance but causes fragmented files (used by SQLite's rollback journal).

---

### 2. Consistency: Database vs. Application

There is a historical nuance to "Consistency" in ACID:
> **The "C" is actually the responsibility of the application developer.** The database can enforce simple constraints (unique keys, foreign keys, check constraints), but it cannot detect if your business rules are broken unless you define them.

#### ⚠️ ACID Consistency vs. CAP Consistency
A common interview pitfall is confusing consistency in ACID with consistency in the **CAP Theorem**:
* **ACID Consistency**: Relational correctness. The database transitions from one valid state to another according to constraints and invariants.
* **CAP Consistency (Linearizability)**: Distributed agreement. Every read receives the most recent write or an error.

---

### 3. Isolation: Concurrency Control

Isolation is the most complex property because enforcing strict, absolute isolation (**Serializable**) is extremely slow. Database engines use two primary concurrency control models:

#### Multi-Version Concurrency Control (MVCC)
Instead of locking rows and making readers wait for writers, MVCC keeps multiple versions of a record.
* **PostgreSQL implementation**: Each tuple (row) has a hidden `xmin` (ID of the transaction that inserted it) and `xmax` (ID of the transaction that deleted/updated it). A reader uses a transaction snapshot to determine which version of the row is visible.
* **MySQL (InnoDB) implementation**: InnoDB uses the undo log to construct historical versions of a row on-the-fly for readers, keeping the active table clean.

#### Two-Phase Locking (2PL)
A pessimistic concurrency control mechanism where a transaction must acquire locks in two phases:
1. **Growing Phase**: The transaction acquires locks but cannot release any.
2. **Shrinking Phase**: The transaction releases locks but cannot acquire any new ones.
* **Shared Lock (S)**: Allows concurrent reads.
* **Exclusive Lock (X)**: Blocks both reads and writes.

#### Serializable Snapshot Isolation (SSI)
* An optimistic approach used by PostgreSQL. Transactions run concurrently without blocking.
* The database tracks dependency graphs of read-write conflicts. If a cycle is detected (indicating a potential anomaly like **Write Skew**), one of the conflicting transactions is aborted.

---

### 4. Durability: Persistence Assurances

To guarantee durability without killing write performance, databases rely on sequential logging.

#### Write-Ahead Logging (WAL)
Writing to random locations on disk is slow. Writing sequentially is fast.
1. When a write occurs, the database writes the change to the **WAL (Redo Log)** in memory, then flushes it to disk sequentially.
2. The database updates its data pages in memory (buffer pool), marking them as "dirty."
3. At a later time (checkpointing), the dirty pages are flushed to their actual disk locations asynchronously.
4. **Crash Recovery**: If the server crashes, the engine replays the WAL from the last checkpoint to reconstruct committed states.

```
Write Op ──► [ WAL Buffer ] ──( sequential write )──► [ WAL on Disk (Redo Log) ]
                   │
                   ▼
             [ Buffer Pool ] ──( async flush )──────► [ Data Files on Disk ]
```

#### The `fsync` System Call
Operating systems buffer disk writes in OS memory. To ensure data is *physically* written to the disk platter or flash cells, the database must call the OS `fsync()` command.
* Running `fsync()` after every transaction commit guarantees durability but limits throughput to disk write cycles.
* Many database configurations allow you to relax this (e.g., flushing to disk once per second) to trade a small risk of data loss for massive speed gains.

---

## 🌐 Distributed ACID: The Scaling Problem

When a database grows beyond a single server, maintaining ACID becomes exponentially harder. 

### CAP Theorem Tradeoffs
In a partitioned network, you must choose between Consistency (Linearizability) and Availability:
* **ACID Relational Databases (e.g., PostgreSQL)**: Prioritize consistency. If network partitions occur, write operations are rejected or blocked to prevent dirty or inconsistent states.
* **NoSQL Databases (e.g., Cassandra)**: Prioritize availability. They use the **BASE** model (Basically Available, Soft state, Eventual consistency) and trade strict consistency for horizontal scalability.

### ACID vs. BASE

| Feature | ACID | BASE |
| :--- | :--- | :--- |
| **Focus** | Strong consistency & correctness. | High availability & scale. |
| **State** | Hard state (changes are immediate & atomic). | Soft state (data floats and converges over time). |
| **Consistency** | Immediate consistency. | Eventual consistency. |
| **Schema** | Rigid, pre-defined schema. | Flexible, schema-on-read. |

### Distributed Transactions: Two-Phase Commit (2PC)
To maintain ACID across multiple physical servers, databases use **2PC**:
1. **Prepare Phase**: The coordinator node asks all participant nodes if they are ready to commit. The participants lock their records and respond with a vote (Yes/No).
2. **Commit Phase**: If all participants vote "Yes", the coordinator sends a "Commit" message. If any node votes "No" (or times out), the coordinator sends "Rollback".

:::warning[The Cost of 2PC]
2PC blocks resources because locks are held across network calls. If the coordinator crashes mid-process, participant nodes remain locked and blocking, creating a Single Point of Failure (SPOF).
:::

---

## 💻 Code Examples

### 1. Raw SQL: Atomic Transactions
This script illustrates a classic transfer transaction with explicit error handling and manual rollback points.

```sql
-- PostgreSQL Transaction Example
BEGIN;

-- 1. Deduct from sender
UPDATE accounts 
SET balance = balance - 100 
WHERE id = 1 AND balance >= 100;

-- Ensure row was actually updated (violating this aborts the transaction)
-- If row count = 0, application triggers ROLLBACK

-- 2. Add to recipient
UPDATE accounts 
SET balance = balance + 100 
WHERE id = 2;

-- If any step fails or violates a check constraint
-- ROLLBACK;

COMMIT;
```

### 2. Java / Spring Boot: Declarative ACID
In Spring Boot, the `@Transactional` annotation handles transaction boundaries automatically using AOP proxies.

```java
@Service
public class BankService {

    @Autowired
    private AccountRepository accountRepository;

    @Transactional(
        isolation = Isolation.READ_COMMITTED,
        propagation = Propagation.REQUIRED,
        rollbackFor = Exception.class
    )
    public void transferFunds(Long fromId, Long toId, BigDecimal amount) {
        // 1. Deduct funds (will fail if constraint violated)
        Account sender = accountRepository.findById(fromId)
            .orElseThrow(() -> new AccountNotFoundException("Sender not found"));
        sender.debit(amount); 
        
        // 2. Add funds
        Account recipient = accountRepository.findById(toId)
            .orElseThrow(() -> new AccountNotFoundException("Recipient not found"));
        recipient.credit(amount);

        // Save operations automatically join the active transaction context
        accountRepository.save(sender);
        accountRepository.save(recipient);
    }
}
```

---

## 🎯 Interview Practice: ACID Questions

### Q1. What is a "write skew" anomaly, and how is it related to ACID?
> **Answer**: Write skew is an anomaly where two concurrent transactions read overlapping data, make non-overlapping writes, and subsequently violate a system invariant. 
> 
> *Example*: Two doctors are on call. The rule is "at least one doctor must be on call." Both doctors concurrently check the database, see that two are on call, and both request to go offline. Both transactions commit because they updated different rows, but the invariant is now broken (0 doctors on call).
> 
> Write skew is an **Isolation** issue. It is allowed under Snapshot Isolation / Repeatable Read and can only be prevented by **Serializable** isolation or explicit locking (`SELECT FOR UPDATE`).

### Q2. How does Write-Ahead Logging (WAL) guarantee Durability?
> **Answer**: WAL ensures durability by making sure that transaction logs are appended sequentially to persistent storage *before* any actual changes are applied to the database data files. Sequential disk writes are extremely fast. If the database crashes, the engine replays this sequential log (Redo phase) to restore all committed transactions that hadn't been flushed to data files yet, and uses the logs to undo uncommitted modifications (Undo phase).

### Q3. Explain the difference between single-object atomicity and multi-object atomicity.
> **Answer**: Single-object atomicity ensures that a write to a single row/document is all-or-nothing (e.g., updating a 10KB JSON document won't result in a half-written file if the power fails). Multi-object atomicity guarantees that updates across *multiple* different tables or rows are tied together under the same outcome. Relational databases support multi-object transactions natively, whereas many distributed NoSQL engines only guarantee single-object atomicity.

---

### Compare Next
- [Transactions & Concurrency](./transactions-concurrency.md)
- [Storage Engines & Data Structures](./storage-engines-data-structures.md)
- [Database Patterns for Microservices](./database-patterns-microservices.md)
- [CAP Theorem & System Design](../system-design/cap-theorem.md)
