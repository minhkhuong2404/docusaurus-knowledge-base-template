---
id: outbound
title: Outbound Payments
sidebar_label: Outbound Payments
sidebar_position: 2
description: Complete guide to outbound payment processing — initiation, validation, dual approval, payment factory, channel selection, and engineering patterns.
tags: [banking, outbound, payments, stp, pain001, pacs008, payment-factory]
---

# 📤 Outbound Payments

An **outbound payment** is a credit transfer initiated by a bank on behalf of one of its customers — money going **out** of the bank to another financial institution. It is the counterpart to an [inbound payment](./inbound).

---

## Outbound Payment Channels

| Channel | Rail | Best For |
|---------|------|---------|
| **NPP / Osko** | NPP | Domestic real-time (&lt;$1M typically) |
| **PayTo** | NPP | Pull-based collections |
| **BECS Direct Entry** | BECS | Bulk payroll, batch supplier credits |
| **BPAY** | BPAY | Bill payments with biller code |
| **RTGS / HVCS** | RITS | High-value, time-critical, >$250K |
| **SWIFT MT103** | SWIFT | International cross-border |
| **PayID** | NPP | Domestic using PayID alias |

---

## Outbound Payment Processing — End to End

```
Customer submits payment instruction (pain.001 / API / online banking)
        │
        ▼
1. RECEIPT & PARSING
   - Parse pain.001 XML or API request
   - Assign InstrId, TxId, MsgId
   - Validate schema and business rules
        │
        ▼
2. AUTHENTICATION & AUTHORISATION
   - Customer authenticated (OAuth, biometric, OTP)?
   - Payment within customer's authorised limits?
   - Dual approval required (corporate)? → approval queue
        │
        ▼
3. DUPLICATE DETECTION
   - Check EndToEndId (customer-provided)
   - Check content hash (amount + accounts + date)
   - Reject with AM05 if duplicate found
        │
        ▼
4. BENEFICIARY VALIDATION
   - Account format valid?
   - PayID lookup (NPP)
   - Confirmation of Payee (CoP) name check (if enabled)
        │
        ▼
5. COMPLIANCE CHECKS (parallel)
   ├── Sanctions screening (debtor, creditor, remittance text)
   ├── Fraud rules (velocity, amount, counterparty patterns)
   └── AML / transaction monitoring
        │
        ├── PASS → proceed
        └── FAIL → hold/reject with reason
        │
        ▼
6. BALANCE / LIMIT CHECK
   - Customer account balance ≥ payment amount + fees?
   - Daily limit not exceeded?
   - Credit facility check (if overdrawn)
        │
        ▼
7. CHANNEL SELECTION
   - Domestic real-time? → NPP
   - High-value? → RTGS/HVCS
   - Bulk? → BECS
   - International? → SWIFT
   - Bill? → BPAY
        │
        ▼
8. DEBIT POSTING
   - Hold/debit customer account (pre-funding)
   - Create debit journal entry
        │
        ▼
9. PAYMENT INSTRUCTION BUILD
   - Construct pacs.008 (or MT103 / DE record)
   - Set UETR (SWIFT gpi), InstrId, TxId
   - Include EndToEndId from customer instruction
        │
        ▼
10. NETWORK SUBMISSION
    - Submit to NPP / RITS / BECS clearing / SWIFT
    - Record submission timestamp and reference
        │
        ▼
11. STATUS TRACKING
    - Receive pacs.002 acknowledgement
    - Update payment status (ACTC → ACSP → ACSC)
    - Handle rejections (RJCT → return credit to customer)
        │
        ▼
12. CUSTOMER NOTIFICATION
    - Send payment confirmation (camt.054 DBIT notification)
    - Update internet/mobile banking status
```

---

## Dual Approval — Corporate Payments

High-value corporate payments often require **dual approval** (four-eyes principle):

| Amount | Approval Required |
|--------|-----------------|
| < \$10,000 | Single user (initiator) |
| \$10,000 – \$100,000 | Secondary approver |
| > \$100,000 | Senior approver or management |
| > \$1,000,000 | Treasury / C-suite |

Implementation:

```java
public PaymentApprovalResult submitForApproval(PaymentInstruction payment) {
    ApprovalPolicy policy = approvalPolicyService.getPolicy(
        payment.getCustomerId(),
        payment.getAmount()
    );

    if (policy.requiresDualApproval()) {
        // Create approval request — payment not executed until approved
        ApprovalRequest request = approvalService.create(payment, policy);
        notificationService.notifyApprovers(request);
        return PaymentApprovalResult.pendingApproval(request.getId());
    }

    // Single approval — execute immediately
    return execute(payment);
}
```

---

## Payment Factory Pattern

A **Payment Factory** centralises all payment initiation from multiple channels into a single orchestration layer:

```
                    ┌─────────────────────────────────┐
Internet Banking    │                                 │
Mobile Banking  ───►│     PAYMENT FACTORY             │
Corporate Portal    │     (Centralised Orchestrator)  │
API / Open Banking  │                                 │
Batch Files         │  - Normalises all inputs        │
                    │  - Applies consistent rules     │
                    └──────────────┬──────────────────┘
                                   │
               ┌───────────────────┼───────────────────┐
               ▼                   ▼                   ▼
            NPP Gateway       BECS Batch           SWIFT Gateway
         (real-time)           (daily batch)       (cross-border)
```

Benefits:
- Single compliance/fraud/sanctions policy
- Consistent audit trail
- Centralised rate/limit management
- Channel switching without app changes

---

## Channel Selection Logic

```java
public PaymentChannel selectChannel(PaymentInstruction instruction) {

    boolean isDomestic = isDomesticAUD(instruction);
    BigDecimal amount = instruction.getAmount();

    if (!isDomestic) {
        return PaymentChannel.SWIFT;  // All international go SWIFT
    }

    if (instruction.isBpay()) {
        return PaymentChannel.BPAY;
    }

    if (instruction.isBatch()) {
        return PaymentChannel.BECS;   // Bulk/payroll
    }

    if (amount.compareTo(HVCS_THRESHOLD) > 0) {
        return PaymentChannel.HVCS;   // High-value
    }

    // Real-time domestic — prefer NPP
    if (nppService.isReachable(instruction.getCreditorBsb())) {
        return PaymentChannel.NPP;
    }

    return PaymentChannel.BECS;       // Fallback to batch
}
```

---

## Outbound Payment States

```
CREATED     → Received and stored
VALIDATED   → Schema and business rules passed
PENDING_APPROVAL → Dual approval required
APPROVED    → Approval obtained
COMPLIANCE_REVIEW → Held for compliance
SUBMITTED   → Sent to clearing/network
ACKNOWLEDGED → pacs.002 ACTC received
IN_PROGRESS → pacs.002 ACSP (settlement in process)
SETTLED     → pacs.002 ACSC (settlement complete) — FINAL
REJECTED    → pacs.002 RJCT — credit returned to customer
RETURNED    → pacs.004 received from beneficiary bank — credit returned
CANCELLED   → Cancelled before submission
```

---

## Cutover Times by Channel

| Channel | Same-Day Cutoff (AEST) | After Cutoff |
|---------|----------------------|-------------|
| NPP | 24/7 — no cutoff | Always same-day |
| BECS credit | ~11:00 AM (midday window) | D+1 |
| BECS debit | ~3:00 PM | D+1 |
| BPAY | ~5:30 PM | Next business day |
| HVCS/RTGS | ~8:00 PM | Next business day |
| SWIFT | Currency-specific | Next value date |

---

## Interview Questions

**Q: What checks must occur before debiting a customer's account for an outbound payment?**
> 1. Authentication/authorisation — customer is who they claim to be and has authority
> 2. Duplicate detection — not a replay of a previous instruction
> 3. Schema validation — message is correctly formed
> 4. Sanctions/AML/Fraud screening — no compliance blocks
> 5. Balance check — sufficient cleared funds
> 6. Limit check — within daily/transaction limits
> Only after all pass should the debit post. Partial failures must roll back cleanly.

**Q: What is a Payment Factory and why do banks build one?**
> A Payment Factory is a centralised orchestration layer that normalises all payment instructions from multiple channels (internet banking, mobile, corporate portals, APIs, batches) into a single processing pipeline. It ensures consistent compliance checks, audit trails, limits enforcement, and channel selection logic. Without it, each channel reimplements these rules independently — creating inconsistency, compliance gaps, and higher maintenance cost.

:::tip[STP Optimisation]
The single biggest driver of low STP rates in outbound payments is incomplete or incorrect beneficiary details. Implementing Confirmation of Payee (CoP) upfront — before the customer submits — significantly reduces the rate of payments that end up in exceptions due to account mismatches.
:::

---

## Related Concepts

- [Inbound Payments](./inbound)
- [pain.001](./pain001)
- [pacs.008](./pacs008)
- [pacs.002](./pacs002)
- [NPP](./npp)
- [BECS](./becs)
- [SWIFT](./swift)
- [Debit Posting](./debit_post)
- [Confirmation of Payee](./cop)
- [Idempotency in Payments](./idempotency)
