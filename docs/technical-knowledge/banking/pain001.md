---
id: pain001
title: "pain.001 — Customer Credit Transfer Initiation"
sidebar_label: "pain.001"
sidebar_position: 1
description: Overview of pain.001 — Customer Credit Transfer Initiation.
tags: [banking, pain001, pain-001, customer, credit, transfer]
---

# pain.001 — CustomerCreditTransferInitiation

## Overview

`pain.001` (Payment Initiation) is an ISO 20022 message sent by an **Originator (Customer)** to their **Debtor Bank** to instruct a credit transfer. It is the entry point of any outbound payment flow.

- **Full name:** `CustomerCreditTransferInitiationV09` (or later versions)
- **Namespace:** `urn:iso:std:iso:20022:tech:xsd:pain.001.001.09`
- **Direction:** Customer → Debtor Bank
- **Channel:** Host-to-host file, API, banking portal

---

## Message Structure

```
pain.001
├── GrpHdr (Group Header)           ← 1..1
│   ├── MsgId                       Message ID (unique per file)
│   ├── CreDtTm                     Creation DateTime
│   ├── NbOfTxs                     Number of transactions
│   ├── CtrlSum                     Total amount of all transactions
│   └── InitgPty                    Initiating Party
│
└── PmtInf (Payment Information)    ← 1..n  (one per batch/debit account)
    ├── PmtInfId                    Payment Info ID
    ├── PmtMtd                      Payment Method (TRF = Credit Transfer)
    ├── ReqdExctnDt                 Requested Execution Date
    ├── Dbtr                        Debtor (name, address)
    ├── DbtrAcct                    Debtor Account (IBAN / account number)
    ├── DbtrAgt                     Debtor Agent (BIC of debtor bank)
    │
    └── CdtTrfTxInf                 ← 1..n  (one per transaction)
        ├── PmtId
        │   ├── InstrId             Instruction ID
        │   └── EndToEndId          End-to-End ID (carried through whole chain)
        ├── Amt
        │   └── InstdAmt Ccy="AUD"  Instructed Amount + Currency
        ├── CdtrAgt                 Creditor Agent (BIC of creditor bank)
        ├── Cdtr                    Creditor (name)
        ├── CdtrAcct                Creditor Account
        └── RmtInf                  Remittance Information (payment reference)
```

---

## Key Fields Explained

| Field | Description | Notes |
|-------|-------------|-------|
| `MsgId` | Unique ID for the whole file | Must be unique per sender per day |
| `EndToEndId` | Tracks payment from initiation to completion | Echoed back in camt.054 |
| `InstrId` | Instruction ID assigned by initiating party | Used for internal tracking |
| `InstdAmt` | Amount to be transferred | Currency must be explicit |
| `ReqdExctnDt` | Date the debtor bank should execute | Future-dating supported |
| `Dbtr` / `DbtrAcct` | Payer's name and account | Must match bank records |
| `Cdtr` / `CdtrAcct` | Payee's name and account | IBAN or BBAN |
| `RmtInf` | Payment description / invoice reference | Structured or Unstructured |

---

## Batching

`pain.001` supports **multiple `PmtInf` blocks**, each grouping transactions per:
- Debit account
- Payment method
- Execution date
- Service level (e.g., URGP for urgent, NORM for normal)

```
1 pain.001 file
├── PmtInf[1]  → Debit Account A, 3 transactions
├── PmtInf[2]  → Debit Account A, 5 transactions (different date)
└── PmtInf[3]  → Debit Account B, 2 transactions
```

---

## Validation Rules

1. `NbOfTxs` must equal total count of `CdtTrfTxInf` across all `PmtInf`
2. `CtrlSum` must equal sum of all `InstdAmt`
3. `EndToEndId` must be unique within a `PmtInf`
4. `CreDtTm` must not be in the future
5. Debtor account must exist and be active
6. Currency must be supported by the debtor bank

---

## Relationship to Other Messages

```
pain.001  ──(initiates)──►  pacs.008  (bank-to-bank transfer)
pain.001  ──(confirmed by)──►  pain.002  (payment status report)
pain.001  ──(notified by)──►  camt.054  (account notification on debit)
```

---

## pain.001 vs pain.008

| | pain.001 | pain.008 |
|--|---------|---------|
| Type | Credit Transfer Initiation | Direct Debit Initiation |
| Initiator | Payer (Debtor) | Payee (Creditor) |
| Flow | Push payment | Pull payment |

---

## Java / Spring Integration Notes

```java
// Typical pain.001 processing pipeline in Spring
@Service
public class Pain001ProcessingService {

    // 1. Unmarshal incoming XML
    // 2. Validate schema (XSD)
    // 3. Validate business rules (CtrlSum, NbOfTxs)
    // 4. Enrich with internal account details
    // 5. Run sanctions & fraud checks
    // 6. Persist to payment table
    // 7. Route to pacs.008 builder or on-us handler

    public void process(CustomerCreditTransferInitiationV09 pain001) {
        validateGroupHeader(pain001.getGrpHdr());
        pain001.getPmtInf().forEach(pmtInf -> {
            pmtInf.getCdtTrfTxInf().forEach(tx -> {
                PaymentOrder order = mapper.toPaymentOrder(pmtInf, tx);
                sanctionService.screen(order);
                fraudService.evaluate(order);
                paymentRepository.save(order);
                routingService.route(order);
            });
        });
    }
}
```

---

## Common Error Codes (pain.002 response)

| Code | Reason |
|------|--------|
| `AC01` | Incorrect Account Number |
| `AC04` | Closed Account Number |
| `AC06` | Blocked Account |
| `AM04` | Insufficient Funds |
| `FF01` | Invalid File Format |
| `NARR` | Free-text narrative reason |
