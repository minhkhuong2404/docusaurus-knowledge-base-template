---
id: bpay
title: BPAY — Bill Payment System
sidebar_label: BPAY
sidebar_position: 4
description: Overview of BPAY — Bill Payment System.
tags: [banking, bpay, bill, payment, system]
---

# BPAY — Bill Payment System

## Overview

**BPAY** is Australia's **bill payment scheme** that allows customers to pay bills electronically using a **Biller Code** and a **Customer Reference Number (CRN)**. It operates over the BECS infrastructure and is one of the highest-volume payment methods in Australia.

- **Operator:** BPAY Group (subsidiary of AusPayNet)
- **Launched:** 1997
- **Volume:** ~1 billion transactions per year
- **Infrastructure:** Built on BECS Direct Entry
- **Availability:** Payments initiated 24/7; processing next business day

---

## How BPAY Works

```
Customer (Payer)
     │
     │  1. Gets bill with:
     │     - Biller Code (4-6 digits)
     │     - CRN (up to 20 digits)
     │     - Amount
     │
     │  2. Logs into banking app / phone banking
     │  3. Selects "Pay Bill" → enters Biller Code + CRN + Amount
     │
     ▼
Customer's Bank (Financial Institution)
     │
     │  4. Validates Biller Code against BPAY register
     │  5. Validates CRN format (Luhn check variant)
     │  6. Debits customer account
     │  7. Batches into BPAY file
     │
     ▼
BPAY Clearing (via BECS)
     │
     │  8. Files submitted by 5 PM cut-off
     │  9. BPAY clears and routes to biller's bank
     │
     ▼
Biller's Bank
     │
     │  10. Credits biller's account
     │  11. Provides remittance file to biller
     │      (Biller Code + CRN + Amount + Date)
     │
     ▼
Biller (Creditor)
     │
     │  12. Matches CRN to invoice / customer record
     │  13. Marks invoice as paid
```

---

## BPAY Key Identifiers

### Biller Code
```
- 4 to 6 digit number assigned by BPAY
- Uniquely identifies the biller organisation
- Registered in the BPAY biller directory
- Printed on every bill/invoice

Example:  Biller Code 12345 = AGL Energy
```

### Customer Reference Number (CRN)
```
- Up to 20 digits
- Set by the biller; unique per customer or invoice
- Contains a check digit (mod-10 Luhn variant)
- Printed alongside Biller Code on the bill

Examples:
  Account-based CRN:  Customer account number
  Invoice-based CRN:  Invoice number
  Property-based CRN: Property ID + check digit
```

### CRN Validation (Luhn-like check)
```java
public boolean validateCrn(String crn) {
    // BPAY uses a Luhn variant (weight pattern 1,3,7,9...)
    int[] weights = {1, 3, 7, 9};
    int sum = 0;
    for (int i = 0; i < crn.length() - 1; i++) {
        sum += Character.getNumericValue(crn.charAt(i)) 
               * weights[i % 4];
    }
    int checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit == Character.getNumericValue(
        crn.charAt(crn.length() - 1));
}
```

---

## BPAY File Format

BPAY uses a **proprietary flat file** based on BECS DE format with BPAY-specific extensions:

```
Record Type 0  — File Header
Record Type 2  — BPAY Credit Transaction
  Fields:
  ├── BSB (biller's bank BSB)
  ├── Account (biller's account)
  ├── Amount (in cents)
  ├── Biller Code
  ├── CRN (Customer Reference Number)
  ├── Payment date
  └── Lodgement reference
Record Type 7  — File Trailer (net totals)
```

---

## BPAY Processing Windows

| Event | Time (AEST) |
|-------|-------------|
| Payment initiated by customer | 24/7 |
| Bank submission cut-off | 5:00 PM |
| BPAY clearing & routing | Overnight |
| Credit to biller's account | Next business day AM |
| Remittance file to biller | Next business day AM |

> **Important:** Payments made after 5 PM are processed the **next** business day. Some banks apply a "same-day BPAY" service for payments before a specific intraday cut-off (e.g., 2 PM).

---

## BPAY vs NPP vs Direct Debit

| Feature | BPAY | NPP / Osko | BECS Direct Debit |
|---------|------|-----------|-------------------|
| Initiator | Customer (push) | Customer (push) | Biller (pull) |
| Speed | Next business day | < 15 seconds | Next business day |
| Identifier | Biller Code + CRN | PayID / BSB+Account | BSB + Account |
| Remittance | Biller Code + CRN | 280 chars free text | Lodgement ref |
| Dispute window | 7 days | N/A | 7 days |
| Bill-specific | ✅ Yes | ❌ Generic | ❌ Generic |

---

## BPAY Remittance to Biller

After clearing, the biller receives a **remittance file** containing:

```
For each payment:
  - Biller Code
  - CRN (Customer Reference Number)   ← key for matching to invoice
  - Amount paid
  - Payment date
  - Customer's bank BSB
  - Processing date
```

The biller's **accounts receivable system** must match these records to open invoices using the CRN.

---

## BPAY View

**BPAY View** is an e-billing extension that allows billers to present digital bills directly in customers' banking apps:

```
Biller generates bill
     │  [Electronic bill via BPAY View]
     ▼
Customer sees bill in banking app
     │  Biller Code, CRN, amount pre-filled
     ▼
Customer clicks "Pay"  (no manual data entry)
     │
     ▼
Standard BPAY payment flow
```

---

## BPAY Error & Exception Codes

| Code | Description |
|------|-------------|
| `01` | Invalid Biller Code |
| `02` | Invalid CRN |
| `03` | Amount mismatch (if biller restricts amount) |
| `04` | Biller not accepting payments |
| `05` | Duplicate payment |
| `06` | Account closed / invalid |

---

## Java Spring Integration Notes

```java
@Service
public class BpayPaymentService {

    public BpayPaymentResult processPayment(BpayPaymentRequest request) {
        // 1. Validate Biller Code
        BillerDetails biller = billerRegistry
            .findByCode(request.getBillerCode())
            .orElseThrow(() -> new InvalidBillerCodeException(request.getBillerCode()));
        
        // 2. Validate CRN check digit
        if (!crnValidator.validate(request.getCrn())) {
            throw new InvalidCrnException(request.getCrn());
        }
        
        // 3. Validate amount (some billers restrict to exact amount)
        if (biller.isFixedAmount() && 
            !biller.getFixedAmount().equals(request.getAmount())) {
            throw new AmountMismatchException();
        }
        
        // 4. Check balance
        accountService.checkSufficientFunds(
            request.getDebtorAccountId(), request.getAmount());
        
        // 5. Debit customer account
        String ledgerRef = ledgerService.postDebit(
            request.getDebtorAccountId(), request.getAmount(), 
            "BPAY " + request.getBillerCode() + " " + request.getCrn());
        
        // 6. Add to BPAY batch for clearing
        bpayBatchService.addToBatch(BpayBatchItem.builder()
            .billerCode(request.getBillerCode())
            .crn(request.getCrn())
            .amount(request.getAmount())
            .billerBsb(biller.getBsb())
            .billerAccount(biller.getAccountNumber())
            .build());
        
        return BpayPaymentResult.success(ledgerRef);
    }
}
```

---

## Related Concepts
- [outbound.md](/technical-knowledge/banking/outbound) — BPAY is an outbound payment
- [direct_debit.md](/technical-knowledge/banking/direct_debit) — Pull-based alternative for recurring bills
- [npp.md](/technical-knowledge/banking/npp) — Real-time alternative for one-off payments
- [clearing.md](/technical-knowledge/banking/clearing) — BPAY clears via BECS infrastructure
- [reconciliation.md](/technical-knowledge/banking/reconciliation) — CRN-based remittance matching
