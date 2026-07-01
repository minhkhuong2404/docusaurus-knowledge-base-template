---
id: payto
title: PayTo — NPP-Based Pull Payments & Mandate Management
sidebar_label: PayTo
sidebar_position: 9
description: Complete guide to PayTo — Australia's modern pull payment system built on NPP. Covers mandate lifecycle, payment initiation, PayID, agreement types, and engineering integration patterns.
tags: [banking, payto, npp, mandate, direct-debit, pull-payment, mms]
---

# 🔗 PayTo — NPP-Based Pull Payments

PayTo is Australia's **next-generation pull payment system**, launched by NPP Australia (NPPA) in 2023. It replaces the legacy BECS Direct Debit Request (DDR) system with a real-time, customer-controlled mandate framework built on top of the New Payments Platform (NPP).

---

## Why PayTo Was Created

BECS DDR (legacy direct debit) had fundamental problems:
- No mandate registry — unauthorised debits were possible
- D+1 processing — not real-time
- Customers had no visibility or control
- Long dispute windows (up to 7 years)
- No structured data for reconciliation

PayTo solves all of these with a mandate-first, real-time, transparent architecture.

---

## Key Participants

| Participant | Role |
|-------------|------|
| **Payer** | The customer whose account will be debited |
| **Payee / Initiating Party** | The business/biller initiating the pull |
| **Payer's Bank (Receiving Bank)** | Validates mandate, processes debit |
| **Payee's Bank (Initiating Bank)** | Submits payment initiation on behalf of payee |
| **NPPA / MMS** | Operates the Mandate Management Service |
| **NPP** | Real-time payment rail carrying the funds |

---

## Mandate Management Service (MMS)

The **MMS** is the central registry for all PayTo mandates in Australia. Every active PayTo mandate is stored and validated here.

### Mandate Attributes

```
Mandate:
├── mandateId (UUID — NPPA assigned)
├── payerPayId or BSB/Account  (how payer is identified)
├── payeeId / creditorId
├── description (shown to customer)
├── purpose (e.g. LOAN, UTILITY, SUBSCRIPTION)
├── maximumAmount (optional per-transaction cap)
├── frequency: ADHOC | DAILY | WEEKLY | FORTNIGHTLY | MONTHLY | ANNUAL
├── startDate
├── endDate (null = indefinite)
├── firstPaymentDate (optional)
├── lastPaymentDate (optional)
└── status: CREATED | ACTIVE | PAUSED | CANCELLED | SUSPENDED | EXPIRED
```

### Mandate Lifecycle

```
Payee initiates mandate via PayTo API
         │
         ▼
MMS creates mandate in CREATED state
         │
         ▼
Payer's bank notifies customer (push notification / internet banking)
         │
    ┌────┴────┐
    │         │
  Approved  Rejected ──► Mandate REJECTED (terminal)
    │
    ▼
Mandate ACTIVE
    │
    ├── Payee initiates payments against mandate
    │
    ├── Payer can PAUSE (temporarily stop debits)
    │
    ├── Payer can CANCEL (permanently revoke)
    │
    ├── Payer can AMEND (change caps, end date)
    │
    └── Mandate EXPIRED (end date reached)
```

---

## Payment Initiation Flow

Once a mandate is `ACTIVE`, the payee initiates individual payments:

```
Payee / Initiating Bank
    │ Submit PayTo payment instruction (NPP pacs.008 with mandate reference)
    ▼
NPP Gateway
    │ Route to Payer's Bank
    ▼
Payer's Bank
    ├── Real-time MMS mandate lookup
    ├── Validate: mandate ACTIVE? Amount ≤ max? Frequency within limits?
    ├── Run fraud/sanctions checks
    ├── Check balance
    └── Debit payer account
    │
    ▼
NPP Fast Settlement Service (FSS / RBA)
    │ RTGS settlement — sub-second
    ▼
Payee's Bank
    │ Credit payee account
    ▼
Payee notified (camt.054)
```

---

## PayID Integration

PayTo mandates can reference payers via **PayID** instead of BSB/account:

| PayID Type | Example |
|-----------|---------|
| Mobile number | `0412 345 678` |
| Email address | `jane@example.com` |
| ABN | `12 345 678 901` |
| Organisation ID | Assigned by bank |

Using PayID makes mandates portable — if the customer changes their bank account, they can reroute the PayID, and all existing PayTo mandates continue working.

---

## Agreement Types

PayTo supports structured agreement types to describe the mandate purpose:

| Purpose Code | Description |
|-------------|-------------|
| `LOAN` | Loan repayment |
| `UTILITY` | Utilities (electricity, gas, water) |
| `SUBSCRIPTION` | Recurring subscription service |
| `INSURANCE` | Insurance premiums |
| `MORTGAGE` | Mortgage repayment |
| `RENTAL` | Rent collection |
| `GOVERNMENT` | Government payment |
| `OTHER` | General purpose |

---

## PayTo vs BECS DDR

| Feature | BECS DDR | PayTo |
|---------|----------|-------|
| Mandate registry | ❌ None | ✅ Centralised MMS |
| Mandate validation | ❌ No real-time check | ✅ Real-time per payment |
| Processing speed | ❌ D+1 | ✅ Sub-second |
| Settlement | DNS | RTGS |
| Customer visibility | ❌ Not visible | ✅ Full in banking app |
| Customer control | ❌ Dispute only | ✅ Approve/pause/cancel |
| Data richness | Limited | ISO 20022 structured |
| PayID support | ❌ | ✅ |
| Dispute window | Up to 7 years | Standard payment return |

---

## Engineering Integration

### Initiating Party (Payee/Biller) Integration

```java
// Step 1: Create mandate
PayToMandateRequest mandateReq = PayToMandateRequest.builder()
    .payerPayId("0412345678")
    .payerPayIdType(PayIdType.MOBILE)
    .description("Monthly subscription - Premier Plan")
    .purpose(AgreementPurpose.SUBSCRIPTION)
    .frequency(PaymentFrequency.MONTHLY)
    .maximumAmount(new Money(BigDecimal.valueOf(99.99), Currency.AUD))
    .startDate(LocalDate.now())
    .build();

MandateResponse response = payToClient.createMandate(mandateReq);
String mandateId = response.getMandateId(); // store for future payments

// Step 2: Poll or receive webhook for mandate status
mandateId → CREATED → (payer approves) → ACTIVE

// Step 3: Initiate payment against active mandate
PayToPaymentRequest paymentReq = PayToPaymentRequest.builder()
    .mandateId(mandateId)
    .amount(new Money(BigDecimal.valueOf(99.99), Currency.AUD))
    .endToEndId(IdempotencyKeyGenerator.generate())
    .description("January 2025 subscription")
    .build();

PaymentResult result = payToClient.initiatePayment(paymentReq);
```

### Webhook Handling (Mandate Status Changes)

```java
@PostMapping("/payto/webhook")
public ResponseEntity<Void> handleMandateEvent(@RequestBody MandateEvent event) {
    switch (event.getEventType()) {
        case MANDATE_APPROVED:
            mandateService.activate(event.getMandateId());
            schedulerService.scheduleFirstPayment(event.getMandateId());
            break;
        case MANDATE_CANCELLED:
            mandateService.cancel(event.getMandateId());
            subscriptionService.suspend(event.getMandateId());
            break;
        case MANDATE_PAUSED:
            schedulerService.suspendSchedule(event.getMandateId());
            break;
        case PAYMENT_RETURNED:
            paymentService.handleReturn(event.getPaymentId(), event.getReturnCode());
            break;
    }
    return ResponseEntity.ok().build();
}
```

---

## Rejection and Return Reason Codes

PayTo uses ISO 20022 reason codes (unlike BECS DDR's proprietary codes):

| Code | Reason |
|------|--------|
| `AC01` | Invalid account number |
| `AC04` | Closed account |
| `AM04` | Insufficient funds |
| `AG01` | Transaction forbidden (mandate not active) |
| `MS02` | Not specified reason by customer |
| `MD01` | No mandate — mandate not found or not active |
| `MD06` | Refund request by end customer |

---

## Migration Path from BECS DDR

For banks migrating biller customers from BECS DDR to PayTo:

```
Phase 1: New mandates go through PayTo only
Phase 2: Existing BECS DDR mandates migrated to MMS (bank-facilitated)
Phase 3: BECS DDR submissions disabled for PayTo-eligible payments
Phase 4: BECS DDR decommissioned
```

Key migration challenge: **bulk migration of existing mandates** requires contacting each customer to re-authorise via PayTo flow (cannot auto-migrate DDR forms to MMS without fresh consent).

---

## Interview Questions

**Q: What is the key architectural difference between PayTo and BECS DDR?**
> PayTo is mandate-first with a centralised real-time registry (MMS), validated at every payment. BECS DDR is trust-based — no real-time registry exists, so any party that knows your BSB/account can submit a debit. PayTo also settles via RTGS (sub-second) vs BECS DDR's DNS (D+1).

**Q: Can a PayTo payment proceed if the mandate is paused?**
> No. Before processing any PayTo payment, the payer's bank validates the mandate status in real-time against the MMS. A `PAUSED` or `CANCELLED` mandate will result in an immediate rejection with `MD01` reason code.

:::tip[Business Value]
PayTo gives billers real-time collection certainty (no D+1 wait), lower dishonour rates (mandate validated upfront), and reduced fraud via consumer-controlled consent — while giving customers unprecedented visibility and control over who can debit their account.
:::

---

## Related Concepts

- [NPP](./npp)
- [Direct Debit](./direct_debit)
- [BECS](./becs)
- [Idempotency in Payments](./idempotency)
- [Payment Return](./payment_return)
- [Open Banking / CDR](./open_banking)
