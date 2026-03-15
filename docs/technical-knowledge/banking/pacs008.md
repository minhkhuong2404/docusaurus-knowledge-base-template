---
id: pacs008
title: "pacs.008 — FI-to-FI Customer Credit Transfer"
sidebar_label: "pacs.008"
sidebar_position: 3
description: Overview of pacs.008 — FI-to-FI Customer Credit Transfer.
tags: [banking, pacs008, pacs-008, fi, to, customer]
---

# pacs.008 — FIToFICustomerCreditTransfer

## Overview

`pacs.008` is the **interbank credit transfer message** in the ISO 20022 standard. It is sent between Financial Institutions (FIs) to move funds on behalf of a customer. This is the primary payment message flowing through clearing and settlement networks.

- **Full name:** `FIToFICustomerCreditTransferV10`
- **Namespace:** `urn:iso:std:iso:20022:tech:xsd:pacs.008.001.10`
- **Direction:** Debtor Bank → (Intermediary Banks) → Creditor Bank
- **Triggered by:** pain.001 processing at debtor bank

---

## Message Structure

```
pacs.008
├── GrpHdr (Group Header)              ← 1..1
│   ├── MsgId                          Unique message ID
│   ├── CreDtTm                        Creation timestamp
│   ├── NbOfTxs                        Number of transactions
│   ├── SttlmInf                       Settlement Information
│   │   ├── SttlmMtd                   Settlement method (INDA/INGA/COVE/CLRG)
│   │   └── SttlmAcct                  Settlement account (if applicable)
│   └── InstgAgt / InstdAgt            Instructing / Instructed Agent
│
└── CdtTrfTxInf (Credit Transfer)      ← 1..n
    ├── PmtId
    │   ├── InstrId                    Instruction ID (assigned by sender)
    │   ├── EndToEndId                 End-to-End ID (from pain.001)
    │   └── TxId                       Transaction ID (unique within chain)
    ├── IntrBkSttlmAmt                 Interbank Settlement Amount
    ├── IntrBkSttlmDt                  Interbank Settlement Date
    ├── SttlmPrty                      Settlement Priority (HIGH/NORM)
    ├── InstdAmt                       Original instructed amount
    ├── XchgRate                       Exchange rate (if FX involved)
    ├── ChrgBr                         Charge Bearer (DEBT/CRED/SHAR/SLEV)
    ├── Dbtr                           Debtor details
    ├── DbtrAcct                       Debtor account
    ├── DbtrAgt                        Debtor Agent (sending bank)
    ├── CdtrAgt                        Creditor Agent (receiving bank)
    ├── Cdtr                           Creditor details
    ├── CdtrAcct                       Creditor account
    ├── Purp                           Purpose of payment
    └── RmtInf                         Remittance info (passed through)
```

---

## Settlement Methods (`SttlmMtd`)

| Code | Name | Description |
|------|------|-------------|
| `INDA` | Instructed Agent | Creditor bank settles via its account at debtor bank |
| `INGA` | Instructing Agent | Debtor bank settles via its account at creditor bank |
| `COVE` | Cover Method | Separate cover payment sent via correspondent bank |
| `CLRG` | Clearing System | Settled through a central clearing system (e.g., NPP, HVPS) |

---

## Charge Bearer (`ChrgBr`)

| Code | Meaning |
|------|---------|
| `DEBT` | All charges paid by debtor (sender) |
| `CRED` | All charges paid by creditor (receiver) |
| `SHAR` | Shared — each party pays their own bank charges |
| `SLEV` | Service Level determines charge allocation |

---

## Payment ID Chain

```
Customer creates:    EndToEndId = "CUS-REF-20240101-001"
Debtor Bank adds:    InstrId    = "DB-INSTR-001"
                     TxId       = "TXID-UUID-001"

These IDs travel unchanged through:
  pain.001 → pacs.008 → camt.054
                      → pacs.002 (status)
                      → pacs.004 (return)
```

---

## pacs.008 in Multi-Hop / Cover Payments

```
Debtor Bank ──[pacs.008]──► Correspondent Bank ──[pacs.008]──► Creditor Bank
      └──────────────────[pacs.009 Cover]────────────────────►
```

In cover method (`COVE`), two parallel flows occur:
- **Payment flow:** pacs.008 carries payment details to creditor bank
- **Cover flow:** pacs.009 carries the actual funds via correspondent

---

## Validation Checklist

- [ ] `MsgId` is globally unique
- [ ] `NbOfTxs` matches actual count of `CdtTrfTxInf`
- [ ] `IntrBkSttlmDt` is a valid business date
- [ ] `EndToEndId` preserved from original pain.001
- [ ] Creditor account is valid (format check)
- [ ] Sanctions screening passed
- [ ] Duplicate detection (same `TxId` not processed twice)
- [ ] `IntrBkSttlmAmt` currency is supported

---

## Related Messages

| Message | Relationship |
|---------|-------------|
| `pain.001` | Upstream initiator |
| `pacs.002` | Payment status report (ACK/NACK/RJCT/ACCP) |
| `pacs.004` | Payment return (if creditor bank rejects) |
| `pacs.009` | Cover payment (FI-to-FI, no customer details) |
| `camt.054` | Account notification to creditor |
| `camt.053` | End-of-day statement |

---

## Real-Time vs Batch

| Scenario | Notes |
|----------|-------|
| **NPP (AU)** | Single pacs.008 per transaction, sub-second processing |
| **SWIFT** | Batch or single, same-day or next-day settlement |
| **RTGS** | Single high-value, real-time gross settlement |
| **ACH/DE** | Batched, processed in clearing windows |

---

## Java Spring Implementation Notes

```java
@Component
public class Pacs008Builder {

    public FIToFICustomerCreditTransferV10 build(PaymentOrder order) {
        var msg = new FIToFICustomerCreditTransferV10();
        
        // Group Header
        var grpHdr = new GroupHeader93();
        grpHdr.setMsgId(idGenerator.nextMsgId());
        grpHdr.setCreDtTm(XMLGregorianCalendarUtil.now());
        grpHdr.setNbOfTxs("1");
        grpHdr.setSttlmInf(buildSettlementInfo(order));
        msg.setGrpHdr(grpHdr);
        
        // Transaction
        var tx = new CreditTransferTransaction50();
        tx.setPmtId(buildPaymentId(order));
        tx.setIntrBkSttlmAmt(buildAmount(order));
        tx.setDbtr(buildDebtor(order));
        tx.setCdtr(buildCreditor(order));
        tx.setRmtInf(buildRemittanceInfo(order));
        
        msg.getCdtTrfTxInf().add(tx);
        return msg;
    }
}
```

---

## Failure Scenarios

| Scenario | Response Message | Key Code |
|----------|-----------------|----------|
| Creditor account not found | pacs.002 RJCT | `AC01` |
| Duplicate transaction | pacs.002 RJCT | `AM05` |
| Sanction match | pacs.002 RJCT | `CH16` |
| Settlement failure | pacs.002 RJCT | `AG01` |
| Creditor bank offline | pacs.002 RJCT | `REAS` |
