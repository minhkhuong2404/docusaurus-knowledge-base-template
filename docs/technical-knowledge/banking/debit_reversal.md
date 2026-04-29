---
id: debit_reversal
title: Debit Reversal
sidebar_label: Debit Reversal
description: Detailed explanation of debit reversals, compensating transactions, and rollback strategies in banking ledgers.
tags: [banking, ledger, reversal, microservices, saga]
---

# Debit Reversal

A **Debit Reversal** occurs when a bank has successfully deducted (debited) funds from a customer's account for an outbound payment, but the payment subsequently fails to be delivered or processed by the payment network or the receiving bank. To correct the ledger, the funds must be seamlessly redeposited.

---

## 🛠️ Triggers for Reversals

Reversals are common due to the asynchronous nature of national settlement systems. Common triggers include:

- The payment orchestrator failed to format the `pacs.008` ISO message correctly.
- The outbound network gateway (e.g., SWIFT, NPP switch) was unreachable.
- The receiving bank timed out or immediately rejected the inbound message before processing.
- A critical compliance (AML/Sanction) check failed *right after* the balance was taken but *before* the message left the firewall.

### Reversal vs Return
A **Reversal** is generally initiated by the sending bank (origination side) because the payment failed to leave its boundaries or failed immediately in the network. A **Return** is when the funds successfully reach the destination bank, but that bank later rejects them (e.g., "Account Closed") and sends them back.

---

## 🔄 Microservices Context: The Saga Pattern

In older monolithic mainframes, a payment might be processed as a single massive ACID database transaction. If taking the debit succeeded but building the SWIFT message threw an exception, the entire SQL transaction rolled back. `COMMIT` vs `ROLLBACK` handled everything.

In modern distributed microservice banking architectures, that is impossible. You cannot hold a database lock open across a network call that might take 15 seconds to reply. This requires the **Saga Pattern**.

### Compensating Transactions
When the payment intent starts, the Ledger Service is called to hard debit the account. It replies `SUCCESS`. Ten milliseconds later, the Network Service crashes. 

The payment orchestrator catches the failure event. Instead of a database rollback, it must explicitly call the Ledger Service a second time with a **Compensating Transaction** — a brand new instruction to credit the exact same amount back to the customer, explicitly marked as a `REVERSAL` type with a reference linking it to the original `DebitRef` so the customer's bank statement reads clearly: "Reversal for failed payment X".

### Idempotency and Timing Flags
If the orchestrator is unaware whether the network gateway processed the payment or not due to a timeout (`HTTP 504 Gateway Timeout`), it CANNOT just assume failure and trigger a reversal. This creates a risk of giving the customer free money while the payment actually cleared.
- Such transactions are marked `UNKNOWN` or `TIMEOUT`.
- A background reconciliation batch runs to independently verify the clearing house's end-of-day logs. Only if the status is definitively confirmed failed will a reversal be generated manually or by a reconciliation engine.

---

## 🔗 Related Concepts
- [Debit Posting](./debit_post)
- [Payment Return](./payment_return)
- [Clearing](./clearing)
- [On-Us Transactions](./onus)
- [Off-Us Transactions](./offus)
