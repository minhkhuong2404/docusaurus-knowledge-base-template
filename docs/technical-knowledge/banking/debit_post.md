---
id: debit_post
title: Debit Posting
sidebar_label: Debit Posting
description: Detailed explanation of core banking debit posting, ledger mechanics, and dealing with idempotency and balance checks.
tags: [banking, ledger, debit, posting, idempotency]
---

# Debit Posting

In core banking and payment processing, a **Debit Post** is the act of recording a decrease in a customer's account balance, representing the withdrawal or transfer of funds out of the account. Because a bank operates on liability accounting conventions, the mathematical rules dictate that a debit *decreases* a liability account (the customer's deposit).

---

## 🏗️ The Execution Flow

Debit posting is almost never a single mathematical operation. For high-volume transactional accounts, it typically happens in two distinct stages to guarantee safety while waiting for the overarching payment to settle.

### 1. Memo Post (Authorization / Hold)
Before a payment actually leaves the bank, the funds must be reserved. 
- The system checks if the customer has a sufficient "Available Balance" (Current Balance - Reserved Funds + Overdraft Limit).
- If approved, a **Memo Post** (or Hold) is applied. 
- The customer immediately sees their Available Balance decrease.
- The actual ledger balance (Current Balance) *does not change*.

This guarantees the funds won't be spent twice while the payment system processes the outbound clearing messages (like an NPP `pacs.008` or SWIFT `MT103`).

### 2. Hard Post (Settlement / Clearing)
Once the outbound payment is successfully acknowledged by the network or immediately upon End of Day (EOD) batch processing:
- The Memo Post hold is released.
- The **Hard Post** is executed against the master ledger.
- The customer's Current Balance officially decreases.

> [!TIP]
> This separation allows the bank to quickly release the hold (a **Debit Reversal**) if the payment network times out or rejects the message, without ever touching the immutable official accounting ledger.

---

## ⚔️ Engineering Challenges

### Balance Contention and Row Locking
Because an account can process dozens of transactions concurrently, the ledger database uses **Pessimistic Locking** (`SELECT ... FOR UPDATE`) or **Optimistic Locking** (version ID checks) to prevent race conditions during balance checks.

```sql
-- Example: Pessimistic Row Lock
BEGIN TRANSACTION;
SELECT available_balance FROM accounts WHERE account_id = '123' FOR UPDATE;
-- Check if balance >= debit_amount
UPDATE accounts SET available_balance = available_balance - 100.00 WHERE account_id = '123';
COMMIT;
```

### Idempotency Enforcement
Payment systems are highly distributed. If a payment orchestration engine times out while waiting for the Core Banking debit response, it will likely retry the request. The ledger **must** be idempotent.

**How it works in practice:**
1. The Payment Engine generates a unique `InstructionId` or `DebitRef`.
2. The Core Banking API receives the request and immediately checks a unique index or an idempotency table.
3. If the `DebitRef` exists, the system bypasses the balance deduction and returns the cached `SUCCESS` response.
4. If it's new, it processes the debit and inserts the `DebitRef`.

---

## 🔗 Related Concepts
- [Credit Posting](./credit_post.md)
- [Debit Reversal](./debit_reversal.md)
- [Payment Lifecycle 101](./payment_lifecycle_101.md)
