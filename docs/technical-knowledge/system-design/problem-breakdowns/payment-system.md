---
id: payment-system
title: Design a Mission-Critical Payment Processing Platform Like Stripe
sidebar_label: 28. Payment System (Stripe)
description: Staff-level system design breakdown for a fault-tolerant payment processing gateway with idempotency keys, double-entry ledgers, and reconciliation.
---

import SystemDesignArchitectureDiagram from '@site/src/components/SystemDesignArchitectureDiagram';

# Design a Mission-Critical Payment Processing Platform Like Stripe

A mission-critical payment processing platform (e.g., Stripe, Adyen, PayPal) enables online businesses to accept credit cards, digital wallets, and bank transfers safely and reliably. In payments, there is **zero tolerance for data loss, double charging, or inconsistent balances**. The platform requires strict end-to-end idempotency, double-entry financial ledger accounting, Payment Service Provider (PSP) orchestration, and asynchronous daily bank reconciliations.

---

## 1. Understanding the Problem

### Functional Requirements
1. **Process Card Payment**: Charge a customer's credit card, debit card, or digital wallet (Apple Pay, Google Pay).
2. **Idempotent Payment Execution**: Guarantee that retrying a payment request (e.g. during mobile network drops or server timeouts) will **never charge the customer twice**.
3. **Double-Entry Accounting Ledger**: Track every movement of funds (customer payment, platform processing fee, merchant payout) in an immutable double-entry ledger.
4. **PSP Routing & Redundancy**: Route transactions to optimal Payment Service Providers / Acquirers (Visa, Mastercard, Chase Paymentech) with automated failover.
5. **Reconciliation Engine**: Asynchronously reconcile internal ledger records against daily bank settlement statement files to detect discrepancies.

### Non-Functional Requirements
- **Strict Exactly-Once Financial Semantics**: Overcharging or double-crediting money causes immediate regulatory penalties, merchant churn, and financial loss.
- **High Availability**: `99.999%` uptime. A payment outage directly stops all business revenue.
- **Sub-Second Authorization Latency**: Payment authorization must complete in `< 1.5 seconds` (P95).
- **PCI-DSS Level 1 Compliance**: Cardholder PAN and CVV must never touch general application servers; handled entirely by tokenized payment vaults.

### Capacity Estimations & Sizing
- **Daily Transaction Volume**: 50 Million payments per day.
- **Throughput**:
  - $50,000,000 / 86,400 \approx$ **580 payments/sec average** (peaking at **3,000 payments/sec** during Black Friday / Cyber Monday).
- **Storage Calculation (5 Years)**:
  - 50M payments/day $\times$ 365 days $\times$ 5 years $\approx$ **91 Billion transactions**.
  - Payment record: `payment_id` (16 bytes) + `customer_id` (16 bytes) + `amount` (8 bytes) + `status` (8 bytes) + timestamps $\approx$ **256 bytes**.
  - Ledger entries: 4 double-entry postings per payment $\times$ 128 bytes $\approx$ **512 bytes**.
  - Total Storage = 91B $\times$ 768 bytes $\approx$ **70 Terabytes (TB)** stored across horizontally partitioned relational databases (PostgreSQL / CockroachDB).

---

## 2. The Set Up

### Defining the Core Entities

```
┌────────────────────────────────────────────────────────┐
│                        PAYMENT                         │
├──────────────────┬──────────────┬──────────────────────┤
│ payment_id       │ UUID         │ PRIMARY KEY          │
│ idempotency_key  │ VARCHAR(64)  │ UNIQUE, NOT NULL     │
│ merchant_id      │ UUID         │ INDEX, FK            │
│ customer_id      │ UUID         │ INDEX, FK            │
│ amount_cents     │ BIGINT       │ In smallest currency │
│ currency         │ CHAR(3)      │ USD, EUR, JPY        │
│ status           │ VARCHAR(16)  │ PENDING / AUTHORIZED │
│                  │              │ CAPTURED / FAILED    │
│ psp_reference    │ VARCHAR(128) │ Acquirer Trans ID    │
│ created_at       │ TIMESTAMP    │ NOT NULL             │
└──────────────────┴──────────────┴──────────────────────┘

┌────────────────────────────────────────────────────────┐
│                     LEDGER_POSTING                     │
├──────────────────┬──────────────┬──────────────────────┤
│ posting_id       │ UUID         │ PRIMARY KEY          │
│ payment_id       │ UUID         │ INDEX, FK            │
│ account_id       │ UUID         │ Internal Account ID  │
│ entry_type       │ VARCHAR(6)   │ DEBIT / CREDIT       │
│ amount_cents     │ BIGINT       │ Financial Amount     │
│ currency         │ CHAR(3)      │ USD, EUR             │
│ created_at       │ TIMESTAMP    │ Immutable audit time │
└──────────────────┴──────────────┴──────────────────────┘
```

### The API Design

#### Charge Customer Payment Request
```http
POST /api/v1/payments/charge
Content-Type: application/json
Authorization: Bearer <secret_key>
Idempotency-Key: pay_req_88192a01-b201-4412

{
  "amount_cents": 10000, // $100.00
  "currency": "USD",
  "payment_method": "tok_visa_4242",
  "merchant_id": "mch_991203",
  "description": "Enterprise Subscription - Monthly"
}
```
**Response (`200 OK`)**:
```json
{
  "payment_id": "pay_99a81203",
  "status": "CAPTURED",
  "amount_cents": 10000,
  "currency": "USD",
  "receipt_url": "https://pay.stripe.com/receipts/pay_99a81203"
}
```

---

## 3. High-Level Design

<SystemDesignArchitectureDiagram systemType="distributed-ledger" title="Stripe Mission-Critical Payment Gateway & Settlement Pipeline" />

### Walkthrough of the Payment Execution Lifecycle

#### 1. Ingestion & Idempotency Layer
1. Client issues `POST /api/v1/payments/charge` with a unique `Idempotency-Key`.
2. The **Payment Gateway** acquires a distributed lock in **Redis** on `idempotency_key`:
   - **Case A: Key Already Exists with Status `SUCCESS`**: Returns the cached previous HTTP response immediately without re-processing!
   - **Case B: Key Already Exists with Status `IN_PROGRESS`**: Returns `409 Conflict` or waits for in-flight transaction to finish.
   - **Case C: New Key**: Creates a new record in PostgreSQL with `status: PENDING`.

#### 2. Risk & PSP Orchestration
1. **Fraud Engine (Radar)**: Scores transaction risk using ML models (IP geolocation, card velocity, device fingerprinting).
2. **PSP Router**: Selects the optimal acquiring bank / card network (e.g. Chase for US Visa, Adyen for European SEPA) based on fee optimization and current bank health metrics.
3. Invokes the chosen PSP API:
   - **Auth (Authorization)**: Reserves the \$100.00 on customer's credit line.
   - **Capture**: Commits the funds transfer.

#### 3. Double-Entry Ledger Commitment
1. Upon PSP success confirmation, the **Ledger Service** executes an atomic database transaction:
   - Sets `PAYMENT` status to `CAPTURED`.
   - Writes immutable double-entry postings:
     - `DEBIT: Customer Card Asset Account (-$100.00)`
     - `CREDIT: Merchant Payable Account (+$97.10)`
     - `CREDIT: Stripe Processing Fee Account (+$2.90)`
     - **Verification**: Debits ($100.00) = Credits ($97.10 + $2.90) $\equiv 0$.
2. The Redis idempotency lock is updated with the completed response payload (cached with a 24-hour TTL).
3. Emits `PaymentSucceededEvent` to **Apache Kafka** for customer receipt emailing.

---

## 4. Potential Deep Dives & Bottlenecks

### Deep Dive 1: The Idempotency Key Pattern (Under the Hood)
What happens if the customer taps "Pay \$100", the server charges the card at Visa, but the customer's mobile cellular connection drops before receiving the HTTP response?

```
Client App                                Payment Server                      Visa Acquirer
    │                                           │                                   │
    │─── 1. POST /charge (Key: K1) ────────────►│                                   │
    │                                           │─── 2. Auth & Capture ($100) ─────►│
    │                                           │                                   │
    │                                           │◄── 3. Visa Success (Auth code) ───│
    │                                           │                                   │
    │                                           │ [Cellular Network Connection Drops!]
    │                                           X                                   │
    │ [Client Times Out after 5s]               │                                   │
    │                                           │                                   │
    │─── 4. RETRY: POST /charge (Key: K1) ─────►│                                   │
    │                                           │                                   │
    │                                           │ Detects Key K1 in Database!       │
    │                                           │ Status = ALREADY CAPTURED!        │
    │                                           │ (Does NOT call Visa again!)       │
    │                                           │                                   │
    │◄── 5. Returns Existing Receipt ($100) ────│                                   │
    ➔ ZERO DOUBLE CHARGE! Transaction is 100% idempotent.
```

#### Production Implementation in PostgreSQL:
```sql
CREATE TABLE idempotency_records (
    idempotency_key VARCHAR(64) PRIMARY KEY,
    user_id UUID NOT NULL,
    request_hash CHAR(64) NOT NULL,
    response_status INT,
    response_body JSONB,
    created_at TIMESTAMP NOT NULL,
    locked_until TIMESTAMP NOT NULL
);
```
- If a duplicate request arrives with the same `idempotency_key` but a **different request payload hash**, the server rejects it immediately with `400 Bad Request` (*"Idempotency key reused with different parameters"*).

### Deep Dive 2: Distributed Sagas vs Two-Phase Commit (2PC) in Payments
When orchestrating a payment involving internal wallet balances, external banks, and inventory deductions, why is 2PC avoided?

- **Why Two-Phase Commit (2PC) Fails in Payments**:
  - 2PC is a blocking protocol. External acquiring banks (Chase, Visa) do **not** participate in our XA/2PC database transactions!
  - If a network partition occurs during the prepare phase, resources remain locked indefinitely, causing cascading connection pool exhaustion.
- **The Orchestrated Saga Pattern**:
  - The payment flow is executed as a sequence of independent local database transactions coordinated by a central **Payment Orchestrator**:
    1. Local Tx 1: Hold Inventory.
    2. Local Tx 2: Call Stripe API (External).
    3. Local Tx 3: Commit Ledger.
  - **Compensating Transactions**: If Step 2 fails (e.g. Card Declined), the orchestrator executes a compensating rollback transaction: Release Inventory Hold.

### Deep Dive 3: The Daily Bank Reconciliation Engine
How do payment companies detect if a bank silently lost a transaction or double-deducted processing fees?

```
Internal Ledger Database                      Acquiring Bank Settlement
(Stripe's Ledger_Posting Table)               (Daily EOD CSV / MT940 File)
               │                                            │
               └──────────────────────┬─────────────────────┘
                                      ▼
                        Batch Reconciliation Worker
                                      │
               ┌──────────────────────┴─────────────────────┐
               ▼                                            ▼
      [Exact Matches (99.98%)]                    [Discrepancies (0.02%)]
      - Amounts match                              - Missing at Bank
      - PIDs match                                 - Currency conversion drift
      ➔ Status: RECONCILED                         - Unknown fee deduction
                                                   ➔ Flaggable for Manual Audit
```
- Every night at 00:00 UTC, partner banks generate a settlement batch file (CAMT.053 / BAI2 / CSV format) detailing every transaction settled through the Federal Reserve / ACH network.
- The **Reconciliation Engine** runs a distributed join between internal ledger entries and the bank statement:
  - Discrepancies are routed to human operations queues for financial arbitration.

---

## 5. Architectural Trade-Off Matrix

| Design Area | Option A | Option B | Selected Choice & Rationale |
|---|---|---|---|
| **Coordination** | Two-Phase Commit (2PC) | Orchestrated Saga with Compensations | **Orchestrated Saga**: External bank APIs cannot participate in internal database locks. Sagas provide non-blocking asynchronous resiliency. |
| **Accounting Model** | Single Balance Column Mutation | Immutable Double-Entry Ledger Postings | **Double-Entry Ledger**: Mandatory for financial software. Guarantees mathematical balance integrity ($\sum \text{Debits} \equiv \sum \text{Credits}$) and complete auditability. |
| **Payment Ingestion** | Asynchronous Kafka Buffering | Synchronous HTTP Gateway with Idempotency | **Synchronous HTTP**: E-commerce customers expect instant feedback (*"Card Approved"*). The gateway executes authorization synchronously while offloading receipts and analytics asynchronously. |

---

## 6. What is Expected at Each Level?

### Mid-Level (L4 / IC4)
- Understands the necessity of the **Idempotency Key** to prevent double charging.
- Designs relational schemas for Payments, Customers, and Merchants.
- Explains the difference between Payment Authorization and Payment Capture.
- Proposes basic retry logic with exponential backoff.

### Senior (L5 / IC5)
- Details the complete **Idempotency Key lifecycle** (Redis lock $\to$ PostgreSQL state machine $\to$ payload hash verification).
- Implements the **Double-Entry Bookkeeping** ledger with strict balance conservation rules.
- Explains the **Orchestrated Saga pattern** and compensating rollback transactions.
- Designs the daily automated bank settlement reconciliation engine.

### Staff+ (L6 / Principal)
- Evaluates multi-PSP dynamic routing: Optimizing transaction authorization rates in real-time based on bank uptime telemetry and interchange fees.
- Architects PCI-DSS Level 1 tokenization vaults: Isolating raw card numbers (PANs) into air-gapped cryptographic hardware security modules (HSMs).
- Solves foreign exchange (FX) currency settlement volatility: Managing currency conversion rate locking between authorization time and settlement time across cross-border transactions.
