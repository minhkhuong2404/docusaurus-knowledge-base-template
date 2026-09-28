---
id: credit_post
title: Credit Posting
sidebar_label: Credit Posting
description: Detailed explanation of core banking credit posting, funds availability, double-entry accounting, settlement risk, holds, and exception handling.
tags: [banking, ledger, credit, posting, funds-availability, settlement, double-entry, reconciliation]
---

# Credit Posting

In core banking, a **Credit Post** records an increase to a customer's account balance — signifying the deposit or receipt of funds. In double-entry banking ledgers, customer deposits are a **liability** for the bank (the bank *owes* the customer that money), so a credit entry increases the liability side of the bank's balance sheet.

Credit posting appears simple on the surface, but production behavior is governed by settlement confidence, product policy, compliance holds, and scheme-specific timing rules. The central decision is always: **when can the customer actually spend the funds?**

---

## 1. Balance Types and Why They Matter

Before understanding posting flows, you must understand that a customer's account does not have a single "balance" — it has several, each representing a different ledger view:

| Balance Type | Definition | Updated at |
|:---|:---|:---|
| **Ledger Balance** (Book Balance) | All posted transactions, cleared and uncleared | Time of posting |
| **Available Balance** | Funds the customer can actually withdraw/spend today | After holds/clearance rules applied |
| **Current Balance** | Usually synonymous with Ledger Balance in retail banking | Time of posting |
| **Shadow / Memo Balance** | Includes unposted, in-flight items (memo credits/debits) | Time of memo instruction |
| **Cleared Balance** | Only fully settled, irrevocable funds | Post-settlement confirmation |

A **memo credit** increases the Ledger Balance (the customer sees it) but does not immediately increase the Available Balance. A **hard credit** increases both. The gap between these two figures is where clearance risk, fraud risk, and policy decisions live.

---

## 2. The Credit Posting Lifecycle

### Phase 1 — Instruction Receipt and Validation

An inbound payment instruction arrives via a payment scheme (SWIFT, NPP, BECS, SEPA, Fedwire, etc.) and enters the bank's payment processing engine.

| Pipeline Step | Validation Stage | Rule Check & Evaluation Logic | Failure Action & Exception Code |
|---|---|---|---|
| **1. Message Parsing** | Syntax & Protocol | Parses ISO 20022 `pacs.008`, SWIFT MT103, or BECS direct entry ABA records. | Malformed syntax rejection |
| **2. Duplicate Check** | Deduplication Cache | Evaluates composite idempotency key (`EndToEndId` + Scheme + Amount + Date). | Idempotent duplicate bypass / ack |
| **3. Beneficiary Resolution** | Account Directory | Maps public BSB/Account or PayID proxy to internal CBS ledger account ID. | `AC01` (Incorrect Account Number) |
| **4. Account Eligibility** | Account Status | Verifies account state (Active vs Dormant/Closed/Blocked) and product credit permissions. | `AC04` (Closed Account) / `AC06` (Blocked) |
| **5. Compliance Screening** | Regulatory Filters | Real-time screening against OFAC/DFAT sanctions, AML rules, and court garnishee orders. | Immediate payment freeze & referral |
| **6. Posting Decision** | Settlement Engine | Determines whether to post a **Memo Credit** (pending settlement) or **Hard Credit** (RTGS settled). | Routing to suspense vs settled ledger |

### Phase 2 — Memo Credit (Pending / Uncleared Funds)

When an inbound payment instruction arrives but settlement has not yet been confirmed, the bank posts a **memo credit** — also called a pending credit, uncleared credit, or provisional credit depending on the product and scheme.

| Balance Component | Amount | Availability Status | Accounting Meaning |
|---|---|---|---|
| **Booked Ledger Balance** | **$10,500** | Recorded in system | Total account position including uncleared deposits. |
| **Available Balance** | **$10,000** | **Immediately Spendable** | Funds free from memo holds and overdraft restrictions. |
| **Pending / Memo Credits** | **+$500** | *Uncleared hold* | Provisional credit pending interbank ESA settlement confirmation. |

**What happens internally:**
- The transaction is written to a **suspense ledger** or **clearing account**, not directly to the customer's settled position.
- A **hold** is placed on the credited amount, preventing the Available Balance from reflecting it.
- The customer sees the inbound credit for transparency, but cannot withdraw it yet.

**When memo credits are used:**
- Batch scheme payments (BECS/BACS/NACHA) received overnight, settled next morning.
- SWIFT wires where settlement occurs at end-of-day in RTGS.
- Cheque deposits (may hold for 1–3 business days under Regulation CC or local equivalents).
- Any credit where the receiving bank has not yet received confirmed irrevocable settlement funds.

### Phase 3 — Settlement Confirmation

Settlement occurs when the bank's Exchange Settlement Account (ESA) at the central bank is credited — at that point, the funds are irrevocably the receiving bank's. For real-time gross settlement (RTGS) systems, this happens transaction-by-transaction; for deferred net settlement (DNS), it happens at the end of a settlement cycle.

| Participant / System | ESA Settlement Transaction | Balance Movement | Core Banking Notification & Action |
|---|---|---|---|
| **Sending Bank** | Debited at Central Bank RBA | **- $500.00** (Dr) | Sending bank reserves reduced irrevocably. |
| **Receiving Bank** | Credited at Central Bank RBA | **+ $500.00** (Cr) | Settlement notification received via RTGS gateway. |
| **Core Banking System** | Hard Credit Execution | Memo hold released | **Available Balance updated to $10,500**; customer SMS dispatched. |

### Phase 4 — Hard Credit (Cleared / Available Funds)

Once settlement is confirmed:

1. The **hold on the memo credit is released**.
2. The transaction is moved from the suspense/clearing ledger to the **customer's settled ledger position**.
3. The **Available Balance is updated** to reflect the now-spendable funds.
4. A customer notification (push notification, SMS, email) is typically triggered.
5. The **booking date** and **value date** are finalized and recorded against the transaction.

| Balance Component | Amount | Availability Status | Accounting Meaning |
|---|---|---|---|
| **Booked Ledger Balance** | **$10,500** | Irrevocably Settled | Account position backed by confirmed central bank reserves. |
| **Available Balance** | **$10,500** | **Fully Spendable** | Matches ledger balance exactly; memo hold released. |
| **Pending Credits** | **$0** | Cleared | Zero pending uncleared balances remaining. |

---

## 3. Funds Availability Policies

Different banks, products, and jurisdictions have different rules about when memo credits become available. This is not a technical decision — it is a **risk and product policy decision** with regulatory dimensions.

### Policy Models

| Model | Description | Scheme Examples | Settlement Risk Taken |
|:---|:---|:---|:---|
| **Hold Until Settled** | Available balance only updates after confirmed settlement | Cheques, BECS batch | Minimal — bank never exposes uncleared funds |
| **Conditional Immediate Availability** | Funds available immediately for low-risk senders; held for unknown/high-risk | Internal transfers, trusted correspondents | Moderate — bank uses risk scoring |
| **Full Immediate Availability** | Available balance updated on receipt, before settlement | NPP (Australia), Faster Payments (UK), RTP (US) | High — bank underwrites settlement risk |
| **Value-Dated Availability** | Funds available on a pre-agreed future date | Forward-value SWIFT wires, term deposits | Controlled — contractually defined |

### Regulation CC (USA) — Mandatory Hold Periods

In the United States, Regulation CC (12 CFR 229) mandates maximum hold periods:

| Deposit Type | Next-Day Availability | Regulatory Max Hold |
|:---|:---|:---|
| Cash deposits | ✅ Next business day | 1 business day |
| Electronic payments (ACH/Fedwire) | ✅ Next business day | 1 business day |
| Local cheques | Day 2 | 2 business days |
| Non-local cheques | Day 5 | 5 business days |
| New accounts / large deposits (>$5,525) | Exception holds permitted | Up to 9 business days |

> Other jurisdictions have equivalent frameworks: ePayments Code (Australia), Payment Services Regulations (UK/EU), MAS Notice (Singapore).

---

## 4. Settlement Risk Deep Dive

:::caution[Settlement Risk is a Bank P&L Risk, Not a Tech Risk]
When a bank provides immediate funds availability before actual settlement (common in modern real-time payment rails like NPP, Faster Payments, PIX), the bank is **underwriting the settlement risk**. If the sending bank fails before end-of-day net settlement, the receiving bank may not receive the funds — but the customer has already spent them. The loss is the receiving bank's.
:::

### The Settlement Risk Timeline (DNS Example)

```
09:14  — Customer at Bank B receives NPP payment from Bank A.
          Bank B posts memo credit. Customer sees funds immediately.
          Available balance updated (Bank B policy: immediate availability).

09:15  — Customer withdraws $500 at ATM. Funds disbursed.

16:30  — Bank A placed into administration. APRA suspends Bank A's settlements.

17:00  — DNS settlement cycle runs. Bank A's net position cannot be settled.
          Bank B's ESA is NOT credited for the $500.

17:01  — Bank B has paid out $500 that it never received. Net loss: $500.
          Multiplied across all Bank A payments that day: potentially millions.
```

### Mitigations Used in Production

| Mitigation | How It Works |
|:---|:---|
| **Intraday Liquidity Limits** | Each counterpart bank is assigned a maximum unsettled exposure limit. Payments beyond the limit are queued until prior ones settle. |
| **Risk-Based Hold Rules** | New senders, high-value senders, or senders in financial distress trigger automatic holds until settlement. |
| **Loss Mutualisation** | Payment scheme operators (e.g., NPP Australia) hold a shared default fund. Losses from a defaulted member are shared across all members. |
| **CLS (Continuous Linked Settlement)** | Used for FX trades — simultaneous payment-versus-payment across currencies eliminates the gap between the two legs. |
| **Prefunded Models** | Sender prefunds at the scheme level before payments are released; settlement risk is eliminated (e.g., some stablecoin / CBDC designs). |

---

## 5. Double-Entry Accounting

A core banking ledger must always balance. A credit to a customer account is only one leg of the transaction. Every posting must have an equal and opposite debit.

### Example 1 — Inbound SWIFT Wire ($500 from Citibank)

| Leg | Account | Dr/Cr | Amount | Description |
|:---|:---|:---|:---|:---|
| 1 | Nostro Account (Citibank at our bank) | **Dr** | $500 | Asset: our claim on Citibank's prefunded account |
| 2 | Customer Retail Account (liability) | **Cr** | $500 | Liability: we now owe the customer $500 |

The **Nostro account** (from Latin *noster* — "ours") is our account held *at* the correspondent bank. When Citibank's nostro is debited, it means we've drawn down the funds Citibank was holding for us.

### Example 2 — Internal Transfer (Same Bank, $200 Account A → Account B)

| Leg | Account | Dr/Cr | Amount | Description |
|:---|:---|:---|:---|:---|
| 1 | Customer Account A (liability) | **Dr** | $200 | Liability decreases (we owe A less) |
| 2 | Customer Account B (liability) | **Cr** | $200 | Liability increases (we owe B more) |

Both sides are liabilities — the total balance sheet position of the bank doesn't change, but the obligation shifts between customers.

### Example 3 — Memo Credit to Hard Credit Transition

The movement from memo to hard credit also has two distinct ledger entries:

**Step 1 — Memo Credit (instruction received, settlement pending):**

| Leg | Account | Dr/Cr | Amount |
|:---|:---|:---|:---|
| 1 | Inbound Clearing Suspense | **Dr** | $500 |
| 2 | Customer Account (uncleared) | **Cr** | $500 |

**Step 2 — Hard Credit (settlement confirmed):**

| Leg | Account | Dr/Cr | Amount |
|:---|:---|:---|:---|
| 1 | Customer Account (uncleared) | **Dr** | $500 | ← reverses the memo |
| 2 | Inbound Clearing Suspense | **Cr** | $500 | ← clears the suspense |
| 3 | ESA / Nostro (asset) | **Dr** | $500 | ← real settlement funds received |
| 4 | Customer Account (cleared) | **Cr** | $500 | ← hard credit posted |

This four-leg structure ensures that the **clearing suspense account always nets to zero** at end-of-day if all settlements complete — any residual balance in the suspense account is an exception requiring investigation.

### Ledger Integrity Rules

- **Every transaction must sum to zero** across all legs (Dr = Cr at all times).
- **Suspense accounts** must be monitored for aging items — anything not cleared within the scheme's settlement window (typically same-day or T+1) must trigger an exceptions workflow.
- **Value date** (the economic date the interest starts/stops accruing) must be set correctly even if the **booking date** differs (e.g., a payment received on a Friday evening may have a booking date of Monday but a value date of Friday).

---

## 6. Holds and Compliance Controls

Before making funds available — even after settlement — the bank may impose holds for compliance, legal, or fraud reasons.

### Hold Types

| Hold Type | Trigger | Who Applies | Effect on Available Balance |
|:---|:---|:---|:---|
| **Clearance Hold** | Memo credit pending settlement | System (automatic) | Reduces Available Balance |
| **Sanctions Hold** | OFAC/AUSTRAC/EU sanctions match | Compliance team | Full account freeze or transaction hold |
| **Legal Hold / Garnishment** | Court order, tax authority levy | Legal / Ops | Specific amount ring-fenced |
| **Fraud Hold** | AML rule or behavioural anomaly | Fraud engine (automatic) | Prevents withdrawal pending review |
| **New Account Hold** | First large credit, account &lt;30 days old | System (policy-based) | Temporary hold per Reg CC or policy |
| **Large Value Hold** | Credits above a defined threshold | System (policy-based) | Partial hold on amount above threshold |

### Hold Lifecycle

```
Credit arrives
     │
     ▼
Compliance Screening ──── Match Found ────► HOLD applied
     │                                          │
  No Match                               Manual Review
     │                                      │        │
     ▼                                   Clear    Escalate
Fraud Rules ──── Anomaly ────────────────► HOLD
     │
  Clean
     │
     ▼
Clearance Rules ──── Memo ────────────────► HOLD (pending settlement)
     │
  Settled
     │
     ▼
  HARD CREDIT — funds released to Available Balance
```

---

## 7. Idempotency and Replay Safety

Inbound payment notifications are frequently retried — by the sending bank, by the scheme, or by internal retry mechanisms. A credit posting engine must be **idempotent**: processing the same instruction twice must produce exactly one credit, not two.

### Idempotency Key Design

The idempotency key for an inbound credit should be a composite of fields that are guaranteed to be unique per legitimate transaction and stable across retries:

```
idempotency_key = hash(
  payment_scheme,          // e.g., "NPP", "BECS", "SWIFT"
  end_to_end_id,           // e.g., E2E reference from pacs.008
  transaction_amount,
  transaction_currency,
  value_date,
  debtor_account_number    // sending account — prevents replay of same E2E ID across senders
)
```

:::warning[Avoid using only End-to-End ID as the idempotency key]
End-to-End IDs are set by the originating customer, not by the bank. Malicious or misconfigured originators can reuse the same E2E ID across different transactions. Always combine E2E ID with amount, currency, and date to form a robust deduplication key.
:::

### Replay Handling Flow

| Idempotency Key Status | Database Operation | Concurrency Protection | Handler Action & Output |
|---|---|---|---|
| **`Found` (Duplicate)** | `SELECT WHERE idempotency_key = ?` | Read-only idempotent check | Replay detected: bypass posting, return stored original transaction ID and status. |
| **`New` (Atomic Insert)** | `INSERT INTO processed_transactions (key, status='PROCESSING')` | **Database UNIQUE constraint** | Lock acquired atomically. Concurrent identical requests trigger unique key violation and wait. |
| **`Execution`** | Execute double-entry ledger posting | Row-level locking on account | Moves funds from clearing ledger to customer ledger. |
| **`Terminal Status`** | `UPDATE status = 'COMPLETED'` | Transaction commit | Releases lock; returns 200 OK / 201 Created to caller. |

The `PROCESSING` state with an atomic insert (enforced by a unique constraint on the idempotency key) ensures that even under concurrent retries, only one thread can proceed to posting. All others will hit a unique constraint violation and return the in-progress or completed result.

---

## 8. Value Date vs. Booking Date

These two dates govern interest accrual and customer-visible statement presentation respectively, and they are not always the same.

| Date | Definition | Example |
|:---|:---|:---|
| **Booking Date** (Entry Date) | Calendar date the transaction is recorded in the ledger | Monday — even if received Friday night |
| **Value Date** | Economic date from which interest is calculated (for or against the customer) | Friday — the day funds were actually received |
| **Settlement Date** | Date the funds actually moved at the central bank | Usually same as Value Date for RTGS; T+1 for DNS |

**Why value date matters for the customer**: A customer receiving a Friday-night SWIFT wire that is memo-credited Friday but hard-credited Monday should still earn interest from Friday. The value date controls this. A bank that sets value date = booking date on late-arriving credits is quietly underpaying interest — a regulatory risk in most jurisdictions.

**Why value date matters for the bank**: If a bank credits with a value date in the past (back-valuing), it must provision for the interest from that past date. Getting value dates wrong is a common source of P&L leakage and reconciliation breaks.

---

## 9. Controls Checklist

Before a credit is fully posted and funds are released to Available Balance, the following controls must be satisfied:

- [ ] **Duplicate detection** — idempotency key lookup against processed transaction store
- [ ] **Beneficiary account resolution** — account number maps to a valid, open internal account
- [ ] **Account eligibility** — product type accepts inbound credits; account is not blocked/frozen/closed
- [ ] **Sanctions screening** — debtor (sender) name, BIC, and country screened against OFAC, UN, EU, AUSTRAC, and local watchlists
- [ ] **AML rules** — transaction pattern checked against AML velocity rules (e.g., large cash-equivalent deposits, structuring patterns)
- [ ] **Fraud hold evaluation** — behavioural rules (new payee, unusual amount, unusual time) evaluated against the account's risk profile
- [ ] **Clearance hold applied** (if memo credit) — Available Balance not updated until settlement confirmed
- [ ] **Value date set correctly** — especially for late-day or cross-timezone receipts
- [ ] **Double-entry legs balanced** — both sides of the ledger entry verified before commit
- [ ] **Notification triggered** — customer notification queued post-posting (not pre-posting, to avoid notifying on a failed post)

---

## 10. Common Exceptions and Resolution Paths

| Exception | Root Cause | Resolution |
|:---|:---|:---|
| **Return received after credit posted** (`pacs.004` / `MT900`) | Sender bank returned the payment post-settlement | Reverse the credit; debit customer account; notify customer; if funds spent, initiate recovery |
| **Beneficiary account closed between validation and posting** | Race condition — account closed during processing window | Route to a suspense/dormant account; contact account holder; issue cheque or return to sender |
| **Notification delivered but posting failed** | System error mid-flow after scheme acknowledgment sent | Replay using idempotency key; do NOT re-acknowledge — posting must catch up to acknowledgment |
| **Reconciliation mismatch** (scheme totals ≠ ledger entries) | Partial batch failure, duplicate suppression error, or rounding | Automated reconciliation job flags the item; exception queue with T+1 SLA |
| **Sanctions match post-credit** | Watchlist updated after posting, retroactive match | Freeze account immediately; file SAR/suspicious matter report; do NOT reverse without regulatory approval |
| **Value date error** | Late booking sets wrong value date; incorrect accrual | Correct via adjustment posting with proper value date; may require interest recalculation |
| **Duplicate credit posted** | Idempotency failure or manual re-posting error | Reverse one leg; audit idempotency key logic; post-mortem on deduplication failure |

Exceptions must feed into **standardized investigation queues** with:
- Defined **SLA by exception type** (e.g., return processing: same day; reconciliation: T+1)
- **Ownership assigned** at intake — no ownerless exceptions
- **Audit trail** of all actions taken, required for regulatory examination

---

## 11. Scheme-Specific Posting Behaviors

Different payment rails have materially different settlement models, which drives different credit posting behaviors:

| Scheme | Settlement Model | Credit Posting Behavior | Return Window |
|:---|:---|:---|:---|
| **SWIFT (MT103 / pacs.008)** | Correspondent banking, RTGS via CLS/Fedwire | Memo credit on receipt; hard credit after nostro settlement | No mandatory return; recall via `pacs.008` return request |
| **NPP (Australia)** | RTGS — real-time, individual settlement per payment | Hard credit immediately (sub-second); settlement risk underwritten by scheme | 13-month recall window (not guaranteed return) |
| **BECS (Australia)** | DNS — overnight batch, T+1 settlement | Memo credit on file receipt; hard credit after morning settlement run | Day of settlement (dishonour) |
| **Fedwire (USA)** | RTGS — real-time, irrevocable | Hard credit immediately; settlement is final and irrevocable | No return once settled |
| **ACH (USA)** | DNS — batch settlement, T+1 or T+2 | Memo credit on receipt; hard credit after settlement | 2 business days for return (R-codes) |
| **SEPA Credit Transfer (EU)** | RTGS (SEPA Instant) or DNS (standard SCT) | Instant: hard credit; Standard: T+1 memo then hard | SEPA Instant: no return; SCT: recall within 10 business days |
| **PIX (Brazil)** | RTGS — 24/7 real-time | Hard credit immediately | No automatic return |

Understanding which scheme a payment arrived on determines the correct posting strategy, hold duration, and return/recall rights — all of which should be encapsulated in the core banking engine's **scheme adapter layer**, not scattered across business logic.

---

## 🔗 Related Concepts

- [Debit Posting](./debit_post.md)
- [Payment Return](./payment_return.md)
- [Settlement](./settlement.md)
- [Nostro / Vostro Reconciliation](./reconciliation.md#3-nostro-reconciliation)
- [Suspense Account Management](./reconciliation.md#suspense-account)
- [AML and Compliance Holds](./sanction.md)
- [Funds Availability Policy](#3-funds-availability-policies)