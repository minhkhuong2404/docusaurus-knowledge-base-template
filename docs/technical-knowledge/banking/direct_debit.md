---
id: direct_debit
title: Direct Debit — Pull Payment Mechanics
sidebar_label: Direct Debit
sidebar_position: 8
description: Complete guide to direct debit in Australia — BECS DDR vs PayTo, mandate management, dishonour/return codes, timing, and engineering patterns.
tags: [banking, direct-debit, becs, payto, mandate, ddr, dishonour]
---

# 🔁 Direct Debit — Pull Payment Mechanics

Direct debit is a **pull payment** — the receiving party (creditor/biller) initiates the collection from the payer's account, with the payer's prior authorisation via a **mandate**.

Unlike credit transfers where the debtor pushes funds, direct debit authorises a third party to pull funds on a schedule or on-demand.

---

## Direct Debit vs Credit Transfer

| | Direct Debit (Pull) | Credit Transfer (Push) |
|---|---|---|
| **Initiator** | Creditor (biller) | Debtor (payer) |
| **Authority** | Mandate (pre-authorisation) | Real-time instruction |
| **Use case** | Subscriptions, bills, loans | One-off payments, salary |
| **Return risk** | Dishonour possible after debit | N/A (funds already authorised) |
| **Australian examples** | BECS DDR, PayTo | NPP Osko, BECS DE credit |

---

## Australian Direct Debit Schemes

### 1. BECS DDR (Direct Debit Request) — Legacy

**BECS DDR** (Bulk Electronic Clearing System — Direct Debit Request) is the legacy Australian direct debit scheme, operating since the 1990s.

| Attribute | Detail |
|-----------|--------|
| Operator | AusPayNet |
| Format | 120-char fixed-width DE file |
| Timing | D+1 (next business day processing) |
| Settlement | DNS — 3 windows per day |
| Mandate type | Paper or digital DDR form |
| Dispute window | Customer can dispute up to 7 years (!!) |
| Status | Still widely used; being replaced by PayTo |

#### BECS DDR File Record Types

| Record Type | Description |
|-------------|-------------|
| `0` | File header |
| `1` | Descriptive record (batch info) |
| `2` | Detail record (individual transaction) |
| `7` | Batch control record |
| `9` | File trailer |

#### BECS DDR Transaction Codes (Field 1 in Detail Record)

| Code | Meaning |
|------|---------|
| `13` | Externally initiated debit |
| `50` | Externally initiated credit |
| `51` | Australian Government Security |
| `52` | Family allowance |
| `53` | Pay |
| `54` | Pension |
| `55` | Allotment |
| `56` | Dividend |

### 2. PayTo — Modern NPP-Based Direct Debit

**PayTo** (launched 2023) is the next-generation Australian direct debit scheme built on top of the NPP infrastructure.

| Attribute | Detail |
|-----------|--------|
| Operator | NPP Australia (NPPA) |
| Infrastructure | NPP / New Payments Platform |
| Timing | Real-time (sub-second settlement) |
| Settlement | RTGS via RBA FSS |
| Mandate type | Digital mandate via Mandate Management Service (MMS) |
| Customer control | Payer can view/manage/revoke mandates via internet banking |
| Status | Active — growing adoption, intended to replace BECS DDR |

---

## Mandate Management

### BECS DDR Mandate Lifecycle

```
Payer completes paper/digital DDR form
         │
         ▼
Creditor holds mandate (no central registry)
         │
         ▼
Creditor submits debit instruction via DE file
         │
         ▼
Payer's bank processes debit (no mandate validation — trust model)
         │
         ▼
If invalid: bank returns dishonour code
```

> ⚠️ **BECS DDR weakness:** There is no real-time mandate validation. A creditor can submit a debit even if the customer never authorised it. The customer must catch this and dispute it.

### PayTo Mandate Lifecycle

```
Creditor creates mandate request via PayTo API
         │
         ▼
Mandate Management Service (MMS) routes to payer's bank
         │
         ▼
Payer reviews and approves mandate in internet banking
         │
         ▼ (or rejects → mandate REJECTED)
Mandate ACTIVE in MMS
         │
         ▼
Creditor submits payment initiation against mandate
         │
         ▼
Payer's bank validates mandate (real-time MMS lookup)
         │
         ▼
If valid → NPP payment processes instantly
If invalid → payment rejected with reason code
```

#### PayTo Mandate States

| State | Meaning |
|-------|---------|
| `CREATED` | Mandate submitted, awaiting payer action |
| `ACTIVE` | Approved by payer — payments can be initiated |
| `PAUSED` | Temporarily suspended by payer |
| `CANCELLED` | Permanently revoked — no further payments |
| `REJECTED` | Payer rejected the mandate request |
| `EXPIRED` | Past end date (if defined) |
| `SUSPENDED` | Suspended by creditor or bank |

---

## Dishonour & Return Codes (BECS DDR)

When a BECS direct debit cannot be processed, the receiving bank returns a **dishonour**:

| Code | Reason | Action |
|------|--------|--------|
| `01` | Refer to customer | Customer must contact their bank |
| `02` | Refer to customer with caution | Potential fraud concern |
| `03` | No authority to debit | No valid DDR — contact creditor |
| `04` | Account closed | Account no longer exists |
| `05` | Account transferred to another bank | Update BSB/account |
| `06` | Account inactive | Dormant account |
| `07` | Invalid BSB | BSB does not exist |
| `08` | Amount not agreed | Amount differs from DDR |
| `09` | Invalid account number | Format/checksum error |
| `10` | Customer deceased | |
| `11` | Account not found | BSB/account combination invalid |
| `12` | Account not eligible for debits | Credit-only account (e.g. savings) |
| `13` | Non-sufficient funds (NSF) | Insufficient balance at time of debit |
| `14` | Funds withheld (attachment) | Account under garnishment order |
| `15` | Duplicate transaction | Same debit submitted twice |

---

## Timing — BECS DDR

```
Day 0 (D):    Creditor submits DE file to originating bank (before cut-off)
Day 1 (D+1):  File sent to BECS clearing house overnight
              Settlement occurs at morning window
              Debit posts to payer account
Day 1 (D+1):  Creditor receives credit (if on-us) or awaits return
Day 2 (D+2):  Potential dishonour file returned (if any)
```

**Dishonour return window:** Bank has up to **7 business days** to return a dishonour to the creditor's bank.

---

## Engineering Patterns

### Mandate Service

```java
// PayTo mandate domain model
@Entity
public class PayToMandate {
    private String mandateId;          // NPPA-issued UUID
    private String payerBsb;
    private String payerAccountNumber;
    private String creditorId;
    private MandateStatus status;
    private BigDecimal maximumAmount;  // optional limit per transaction
    private String frequency;         // WEEKLY, FORTNIGHTLY, MONTHLY, ADHOC
    private LocalDate startDate;
    private LocalDate endDate;        // null = indefinite
    private Instant lastUpdated;
}

// Validate mandate before initiating PayTo payment
public PaymentResult initiatePayToDebit(String mandateId, BigDecimal amount) {
    Mandate mandate = mandateRepository.findById(mandateId)
        .orElseThrow(() -> new MandateNotFoundException(mandateId));

    if (mandate.getStatus() != MandateStatus.ACTIVE) {
        throw new MandateNotActiveException(mandate.getStatus());
    }

    if (mandate.getMaximumAmount() != null &&
        amount.compareTo(mandate.getMaximumAmount()) > 0) {
        throw new AmountExceedsMandateLimitException(amount, mandate.getMaximumAmount());
    }

    return nppGateway.initiatePayment(mandate, amount);
}
```

### Dishonour Handling

```java
// Process returned BECS dishonour file
public void processDishonourFile(BecsReturnFile returnFile) {
    for (ReturnRecord record : returnFile.getRecords()) {
        String dishonourCode = record.getDishonourCode();
        String originalTransactionRef = record.getOriginalRef();

        // Mark original debit as dishonoured
        paymentRepository.updateStatus(
            originalTransactionRef,
            PaymentStatus.DISHONOURED
        );

        // Notify creditor
        DishonourReason reason = DishonourReason.fromCode(dishonourCode);
        creditorNotificationService.sendDishonourNotice(record, reason);

        // Publish domain event for retry/write-off workflow
        eventPublisher.publish(new PaymentDishonoured(originalTransactionRef, reason));
    }
}
```

---

## BECS DDR vs PayTo Comparison

| Feature | BECS DDR | PayTo |
|---------|----------|-------|
| Infrastructure | Legacy DE batch | NPP real-time |
| Mandate validation | None (trust model) | Real-time MMS lookup |
| Customer visibility | None | Full visibility in banking app |
| Customer control | Dispute after the fact | Approve/pause/cancel in app |
| Processing speed | D+1 | Sub-second |
| Settlement | DNS | RTGS |
| Return codes | BECS dishonour codes | ISO 20022 reason codes |
| Dispute window | Up to 7 years | Standard payment dispute |
| Adoption | Universal | Growing (2023+) |

---

## Interview Questions

**Q: Why is BECS DDR considered a trust model and what risk does that create?**
> BECS DDR has no mandate registry. The creditor holds the paper/digital DDR form privately. When they submit a debit, the payer's bank cannot validate that a mandate exists — it just processes the debit. This creates the risk of unauthorised debits, which customers may not notice. The only protection is the customer's right to dispute — which can happen years later, creating chargeback risk for creditors.

**Q: How does PayTo's mandate model solve this problem?**
> PayTo stores mandates in the centralised NPPA Mandate Management Service (MMS). Before processing any PayTo payment, the payer's bank validates the mandate in real-time. If no active mandate exists, the payment is rejected. This eliminates unauthorised debits while giving customers full visibility and control via their banking app.

:::info[Migration Note]
Banks are gradually migrating BECS DDR volumes to PayTo, but full migration will take years due to the large number of billers (utilities, insurance, subscriptions) that need to rebuild their payment initiation systems.
:::

---

## Related Concepts

- [PayTo](./payto)
- [BECS](./becs)
- [NPP](./npp)
- [Payment Return](./payment_return)
- [Clearing](./clearing)
- [Idempotency in Payments](./idempotency)
