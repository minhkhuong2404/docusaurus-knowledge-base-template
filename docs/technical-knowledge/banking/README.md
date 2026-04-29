---
title: Banking Knowledge Path
description: Guided learning path for the banking and payments knowledge base.
slug: /banking/learning-path
tags: [banking, learning-path, roadmap]
---

# Banking Knowledge Path

Use this page as the entry point for learning banking and payments topics in a practical order.

## How To Use This Path

- Read each stage in order the first time.
- Use "Role Tracks" after Stage 2 to specialize.
- Keep `payment_lifecycle_101` and `glossary` open while reading message specs.

---

## Stage 0 - Foundations (Beginner)

Start here if you are new to banking/payments domain language.

1. [Overview](./overview.md)
2. [Payment Lifecycle 101](./payment_lifecycle_101.md)
3. [Banking Roles and Teams](./banking_roles.md)
4. [Banking Glossary](./glossary.md)

Outcome:
- Understand who does what in a bank
- Understand end-to-end payment flow
- Understand core terms used in all other docs

---

## Stage 1 - Core Payment Flows (Beginner -> Intermediate)

Learn the flow categories and routing decisions.

1. [Outbound Payments](./outbound.md)
2. [Inbound Payments](./inbound.md)
3. [On-Us Transactions](./onus.md)
4. [Off-Us Transactions](./offus.md)
5. [Clearing](./clearing.md)
6. [Settlement](./settlement.md)

Outcome:
- Distinguish on-us vs off-us behavior
- Understand where clearing ends and settlement begins
- Understand common flow failure points

---

## Stage 2 - ISO 20022 Message Chain (Intermediate)

Study messages in execution order:

1. [pain.001](./pain001.md) - customer payment initiation
2. [pacs.008](./pacs008.md) - interbank credit transfer
3. [pacs.002](./pacs002.md) - status report
4. [camt.054](./camt054.md) - debit/credit notification
5. [camt.053](./camt053.md) - account statement

Then exception messages:

6. [pacs.004](./pacs004.md) - payment return
7. [pain.007 and pacs.007](./pain007_pacs007.md) - reversal
8. [camt.055 and camt.056](./camt055_camt056.md) - cancellation/recall
9. [pain.004 Clarification](./pain004.md) - common naming confusion

Outcome:
- Trace a payment using reference IDs across messages
- Explain reject vs return vs reversal vs cancellation

---

## Stage 3 - Rails and Networks (Intermediate)

1. [NPP](./npp.md)
2. [BPAY](./bpay.md)
3. [Direct Debit](./direct_debit.md)
4. [SWIFT](./swift.md)

Outcome:
- Choose appropriate rail by use case, urgency, and geography
- Understand domestic vs cross-border constraints

---

## Stage 4 - Ledger and Core Banking (Intermediate -> Advanced)

1. [Core Banking System](./core_banking.md)
2. [Account Types](./account_types.md)
3. [Debtor](./debtor.md)
4. [Debit Posting](./debit_post.md)
5. [Credit Posting](./credit_post.md)
6. [Debit Reversal](./debit_reversal.md)
7. [Payment Return](./payment_return.md)
8. [FX in Payments](./fx.md)
9. [Interest and Fees](./interest_fees.md)
10. [FIS](./fis.md)

Outcome:
- Understand ledger effects and posting patterns
- Understand idempotency and reconciliation dependencies

---

## Stage 5 - Risk, Compliance, and Operations (Advanced)

1. [Fraud Detection and Prevention](./fraud.md)
2. [Sanctions Screening](./sanction.md)
3. [AML, CTF, and KYC](./aml_kyc.md)
4. [Payment Exceptions and Investigations](./payment_exceptions.md)
5. [Reconciliation](./reconciliation.md)
6. [Testing in Banking and Payments](./testing_banking.md)

Outcome:
- Understand financial-crime checkpoints in flow
- Understand operational controls and investigation lifecycle

---

## Stage 6 - Modernization and Strategy

1. [ISO 20022 Migration](./iso20022_migration.md)
2. [Open Banking and CDR](./open_banking.md)

Outcome:
- Understand migration impact on data, systems, and teams
- Understand where ecosystem changes affect payment architecture

---

## Role Tracks

### Developer Track

Follow: Stage 0 -> Stage 1 -> Stage 2 -> Stage 4 -> Stage 5

Focus topics:
- Message schemas and field mapping
- Idempotent posting and retries
- Exception-safe state transitions

### Operations / Analyst Track

Follow: Stage 0 -> Stage 1 -> Stage 3 -> Stage 5

Focus topics:
- Status monitoring and exception handling
- Reconciliation and return workflows
- SLA and incident triage

### Compliance / Risk Track

Follow: Stage 0 -> Stage 1 -> Stage 5

Focus topics:
- Sanctions, AML/KYC, fraud controls
- Hold/release/return decision points
- Regulatory reporting and evidence

### Product / Business Track

Follow: Stage 0 -> Stage 1 -> Stage 3 -> Stage 6

Focus topics:
- Rail capability and customer experience trade-offs
- Pricing/latency/risk considerations
- Modernization opportunities

---

## Quick Revision Path (60-90 minutes)

If you need a fast refresh before interviews or design discussions:

1. [Payment Lifecycle 101](./payment_lifecycle_101.md)
2. [On-Us Transactions](./onus.md) and [Off-Us Transactions](./offus.md)
3. [pain.001](./pain001.md) -> [pacs.008](./pacs008.md) -> [pacs.002](./pacs002.md
4. [pacs.004](./pacs004.md), [Debit Reversal](./debit_reversal.md), [Payment Return](./payment_return.md)
5. [Reconciliation](./reconciliation.md), [Fraud](./fraud.md), [Sanctions](./sanction.md)

