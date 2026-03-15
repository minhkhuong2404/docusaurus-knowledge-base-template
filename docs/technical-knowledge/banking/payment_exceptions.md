---
id: payment_exceptions
title: Payment Exceptions & Investigations
sidebar_label: Exceptions & Investigations
sidebar_position: 1
description: Overview of Payment Exceptions & Investigations.
tags: [banking, payment, exceptions, investigations]
---

# Payment Exceptions & Investigations

## Overview

**Payment exceptions** are transactions that cannot be processed automatically and require **manual intervention** by operations staff. They arise from technical errors, data quality issues, unmatched payments, compliance holds, or network failures.

Effective exception management is critical — unresolved exceptions represent **financial risk**, **regulatory exposure**, and **customer dissatisfaction**.

---

## Types of Payment Exceptions

| Type | Cause | Owner |
|------|-------|-------|
| **Unmatched Inbound** | Creditor account not found | Operations |
| **Sanction Hold** | Potential match on watchlist | Compliance |
| **Fraud Hold** | High fraud score | Fraud team |
| **Duplicate Payment** | Same payment submitted twice | Operations |
| **Amount Mismatch** | Payment amount doesn't match expected | Operations |
| **Format Error** | Invalid field values, missing mandatory fields | Tech/Operations |
| **Settlement Failure** | Network or counterparty settlement rejection | Operations |
| **Timed-Out Payment** | No confirmation received within SLA | Operations |
| **Suspense Account Item** | Funds received, account unidentifiable | Operations |
| **Return Not Applied** | pacs.004 received but original not found | Operations |
| **Balance Discrepancy** | Statement balance doesn't reconcile | Finance/Operations |
| **FX Rate Dispute** | Incorrect exchange rate applied | Treasury/Ops |

---

## Exception Lifecycle

```
Exception Raised (auto or manual)
        │
        ▼
   Categorise & Prioritise
   ├── HIGH: Regulatory (sanctions) → Compliance team
   ├── HIGH: Large amount > threshold → Senior ops
   ├── MEDIUM: Unmatched inbound → Ops queue
   └── LOW: Minor format warning → Batch ops
        │
        ▼
   Assign to Owner / Queue
        │
        ▼
   Investigate
   ├── Check payment details
   ├── Contact counterparty bank (SWIFT gpi, phone)
   ├── Contact customer
   └── Check upstream systems
        │
        ▼
   Resolve
   ├── Apply to correct account
   ├── Return funds (pacs.004)
   ├── Resubmit corrected payment
   ├── Write off (if unrecoverable, within authority)
   └── Escalate (if above resolution authority)
        │
        ▼
   Close & Log
   (outcome, root cause, resolution time)
```

---

## Unmatched Inbound Payments (Suspense)

The most common exception — an inbound payment arrives but the creditor account cannot be identified:

```
Inbound pacs.008 received
        │
        ▼
Account lookup fails:
  ├── Invalid BSB + account number
  ├── Account closed
  ├── PayID not registered
  └── Account in different currency
        │
        ▼
Funds credited to SUSPENSE ACCOUNT
  (internal holding account — not customer money yet)
        │
        ▼
Exception raised in Ops queue
        │
        ▼
Operations team investigates:
  ├── Check if account recently closed → identify new account
  ├── Check if CRN/reference matches known customer
  ├── Contact sending bank for more details
  └── Contact potential beneficiary
        │
        ├── MATCH FOUND: Transfer from suspense → customer account
        │               Send camt.054 to customer
        │
        └── NO MATCH after SLA: Return via pacs.004
                                 Reason code: AC01 / AC04
```

### Suspense SLAs

| Priority | SLA | Action on Breach |
|----------|-----|-----------------|
| > $100,000 | 24 hours | Escalate to senior ops manager |
| $10,000–$100,000 | 3 business days | Team lead review |
| < $10,000 | 5 business days | Standard ops handling |
| Any amount after 10 days | Mandatory return | Regulatory obligation |

---

## Sanction Holds

When a payment hits a potential sanctions match:

```
Payment held by sanctions engine
        │
        ▼
Compliance analyst receives alert
        │
        ▼
Review:
  ├── Is this a true match or false positive?
  ├── Name similarity? Address? Entity type?
  ├── Check all aliases and related entities
  └── Consult legal/compliance if uncertain
        │
        ├── FALSE POSITIVE:
        │     Document decision + rationale
        │     Release payment
        │     Update screening rules if needed
        │
        └── TRUE MATCH (CONFIRMED HIT):
              BLOCK payment permanently
              Freeze account (if customer is sanctioned)
              File report with AUSTRAC / OFAC / OFSI
              DO NOT tip off the customer
              Retain records (7 years)
```

**Critical:** Sanctions holds must **never** be resolved by simply releasing the payment without compliance review. The payment must be permanently blocked if it's a true hit.

---

## Timed-Out / Unconfirmed Payments

When a payment is submitted but no pacs.002 confirmation arrives:

```
Payment submitted to NPP/SWIFT at T+0
        │
No pacs.002 within SLA:
  NPP:   60 seconds
  RTGS:  15 minutes
  SWIFT: 24 hours (business day)
        │
        ▼
Exception raised: UNCONFIRMED PAYMENT
        │
        ▼
Investigate:
  ├── Check NPP/SWIFT tracking (gpi, UETR)
  ├── Query network operator
  ├── Check if duplicate already received
  └── Contact counterparty bank directly
        │
        ├── CONFIRMED SETTLED:
        │     Apply settlement to internal records
        │     Close exception
        │
        ├── CONFIRMED REJECTED:
        │     Reverse debit posting
        │     Notify customer
        │
        └── STILL UNKNOWN after 2 business days:
              Treat as failed
              Reverse debit
              Notify customer
              Pursue recovery if funds confirmed gone
```

---

## Exception Priority Matrix

| Severity | Criteria | Response SLA | Escalation |
|----------|----------|-------------|-----------|
| **P1 Critical** | Regulatory hold (sanctions), large systemic failure | 1 hour | Compliance Director / CTO |
| **P2 High** | > $500K unresolved, customer complaint, potential fraud | 4 hours | Ops Manager |
| **P3 Medium** | > $10K unmatched, settlement fail | 1 business day | Team Lead |
| **P4 Low** | < $10K unmatched, format warning | 3 business days | Standard queue |

---

## Exception Metrics (KPIs)

| Metric | Formula | Target |
|--------|---------|--------|
| **Exception Rate** | Exceptions / Total payments | < 0.1% |
| **STP Rate** | Payments processed without exception / Total | > 99.9% |
| **Avg Resolution Time** | Time from raise to close | < 4h (P1), < 8h (P2) |
| **Suspense Aging** | Items > 5 days in suspense | 0 |
| **False Positive Rate** | Sanctions false positives / total alerts | < 80% |
| **Repeat Exceptions** | Same root cause recurring | Trending down |

---

## Java Spring Implementation

```java
@Service
public class ExceptionManagementService {

    public PaymentException raise(
            String paymentId, 
            ExceptionType type, 
            String reason) {
        
        PaymentException exception = PaymentException.builder()
            .paymentId(paymentId)
            .type(type)
            .reason(reason)
            .status(ExceptionStatus.OPEN)
            .priority(determinePriority(type, paymentId))
            .raisedAt(Instant.now())
            .assignedQueue(routeToQueue(type))
            .build();
        
        exceptionRepository.save(exception);
        
        // Alert operations team
        opsAlertService.alert(exception);
        
        // If P1/P2 — page on-call ops
        if (exception.getPriority().isCritical()) {
            oncallService.page(exception);
        }
        
        return exception;
    }

    public void resolve(
            String exceptionId, 
            ResolutionAction action, 
            String resolvedBy,
            String notes) {
        
        PaymentException exception = exceptionRepository.findById(exceptionId)
            .orElseThrow();
        
        switch (action) {
            case APPLY_TO_ACCOUNT -> applyToAccount(exception);
            case RETURN_FUNDS     -> initiateReturn(exception);
            case RESUBMIT         -> resubmitPayment(exception);
            case WRITE_OFF        -> {
                authorisationService.checkWriteOffAuthority(
                    resolvedBy, exception.getAmount());
                writeOffService.writeOff(exception);
            }
        }
        
        exception.setStatus(ExceptionStatus.CLOSED);
        exception.setResolvedAt(Instant.now());
        exception.setResolvedBy(resolvedBy);
        exception.setResolutionNotes(notes);
        exceptionRepository.save(exception);
        
        auditService.logResolution(exception);
    }
}

public enum ExceptionType {
    UNMATCHED_INBOUND,
    SANCTION_HOLD,
    FRAUD_HOLD,
    DUPLICATE_PAYMENT,
    SETTLEMENT_FAILURE,
    TIMEOUT,
    FORMAT_ERROR,
    AMOUNT_MISMATCH,
    SUSPENSE_ITEM,
    RETURN_NOT_APPLIED
}
```

---

## Root Cause Analysis (RCA)

After resolving exceptions, capture root cause to prevent recurrence:

| Root Cause Category | Example | Prevention |
|--------------------|---------|-----------|
| **Data quality** | Invalid BSB submitted by customer | Add BSB validation in UI |
| **System bug** | Duplicate submission on timeout retry | Implement idempotency keys |
| **Configuration** | Stale sanctions list not updated | Automate list refresh |
| **Counterparty** | Other bank sent wrong account | Improve Confirmation of Payee |
| **Process gap** | No SLA monitoring for suspense | Add automated aging alerts |

---

## Related Concepts
- [inbound.md](/technical-knowledge/banking/inbound) — Unmatched inbound is the most common exception
- [sanction.md](/technical-knowledge/banking/sanction) — Sanction holds
- [fraud.md](/technical-knowledge/banking/fraud) — Fraud holds
- [reconciliation.md](/technical-knowledge/banking/reconciliation) — Exceptions surfaced through reconciliation
- [payment_return.md](/technical-knowledge/banking/payment_return) — Resolution via pacs.004 return
- [debit_reversal.md](/technical-knowledge/banking/debit_reversal) — Resolution via debit reversal
