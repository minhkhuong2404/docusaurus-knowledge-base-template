---
id: pacs004
title: pacs.004 — Payment Return
sidebar_label: pacs.004 — Payment Return
sidebar_position: 6
---

# pacs.004 — PaymentReturn

## Overview

`pacs.004` is the **interbank payment return message**. It is sent by the **Creditor Bank back to the Debtor Bank** when a previously received `pacs.008` credit transfer cannot be applied to the beneficiary's account. The message carries the original payment details and the reason why funds are being returned.

- **Full name:** `PaymentReturnV10`
- **Namespace:** `urn:iso:std:iso:20022:tech:xsd:pacs.004.001.10`
- **Direction:** Creditor Bank → (Network) → Debtor Bank
- **Triggered by:** Failed credit application after `pacs.008` received

> ⚠️ A `pacs.004` means **funds have already moved** to the creditor bank and are now being sent back. This is different from a `pacs.002 RJCT` which means funds were never applied in the first place.

---

## pacs.004 in Context

```
ORIGINAL PAYMENT:
Debtor Bank ──[pacs.008]──────────────────────────► Creditor Bank
            ◄──[pacs.002 ACSP]────────────────────── (accepted, settling)

RETURN (when credit fails):
Creditor Bank ──[pacs.004]────────────────────────► Debtor Bank
              (funds sent back)
```

---

## Message Structure

```
pacs.004
├── GrpHdr (Group Header)                         ← 1..1
│   ├── MsgId                                     Unique return message ID
│   ├── CreDtTm                                   Timestamp
│   ├── NbOfTxs                                   Number of transactions being returned
│   ├── TtlRtrdIntrBkSttlmAmt                     Total returned settlement amount
│   ├── IntrBkSttlmDt                             Return settlement date
│   └── SttlmInf                                  Settlement details for the return
│
└── TxInf (Transaction Information)               ← 1..n
    ├── RtrId                                     Return transaction ID (new, unique)
    ├── OrgnlGrpInf                               References to original message
    │   ├── OrgnlMsgId                            pacs.008 MsgId
    │   └── OrgnlMsgNmId                          "pacs.008.001.10"
    ├── OrgnlInstrId                              Original InstrId (from pacs.008)
    ├── OrgnlEndToEndId                           Original EndToEndId (preserved)
    ├── OrgnlTxId                                 Original TxId (from pacs.008)
    ├── OrgnlUETR                                 Original UETR (SWIFT payments)
    ├── RtrdIntrBkSttlmAmt Ccy="AUD"             Amount being returned
    ├── IntrBkSttlmDt                             Settlement date for return
    ├── RtrdInstdAmt Ccy="AUD"                   Original instructed amount
    ├── ChrgBr                                    Charge bearer for return
    ├── RtrChain                                  Return payment chain info
    │   ├── Assgnr                                Who is returning (creditor bank)
    │   └── Assgne                                Who receives return (debtor bank)
    ├── RtrRsnInf                                 Return reason
    │   ├── Orgtr                                 Who initiated the return
    │   └── Rsn → Cd                              Reason code (e.g., AC04)
    ├── OrgnlTxRef                                Key fields echoed from original
    │   ├── Dbtr                                  Original debtor
    │   ├── DbtrAcct                              Original debtor account
    │   ├── Cdtr                                  Original creditor
    │   └── CdtrAcct                              Original creditor account
    └── SplmtryData                               Optional supplementary data
```

---

## Return Reason Codes

These are the ISO 20022 standard reason codes for `pacs.004`:

### Account Issues
| Code | Reason | Description |
|------|--------|-------------|
| `AC01` | Incorrect Account Number | Account does not exist |
| `AC03` | Invalid Creditor Account Type | Account cannot receive this payment type |
| `AC04` | Closed Account Number | Account has been closed |
| `AC05` | Closed Debtor Account Number | Debtor account closed (less common in returns) |
| `AC06` | Blocked Account | Account is frozen/blocked |
| `AC13` | Invalid Debtor Account Type | Account type not appropriate |

### Amount Issues
| Code | Reason | Description |
|------|--------|-------------|
| `AM09` | Wrong Amount | Amount is incorrect per agreement |
| `AM10` | Invalid Control Sum | Control sum does not match |
| `AM14` | Amount exceeds agreed maximum | Over limit |

### Creditor-Initiated Returns
| Code | Reason | Description |
|------|--------|-------------|
| `CUST` | Requested by Customer | Beneficiary requests return of funds |
| `DUPL` | Duplicate Payment | Beneficiary received same payment twice |
| `FOCR` | Following Cancellation Request | Response to a camt.056 recall request |
| `MD06` | Refusal by End Customer | Beneficiary refuses the credit |
| `MS02` | Not Specified Reason Customer Generated | Unspecified customer reason |
| `MS03` | Not Specified Reason Agent Generated | Unspecified bank reason |

### Regulatory & Compliance
| Code | Reason | Description |
|------|--------|-------------|
| `RR01` | Missing Debtor Account or ID | Regulatory — missing info |
| `RR02` | Missing Debtor Name or Address | Regulatory — missing info |
| `RR03` | Missing Creditor Name or Address | Regulatory — missing info |
| `RR04` | Regulatory Reason | Sanction/compliance block |

### Technical
| Code | Reason | Description |
|------|--------|-------------|
| `FF01` | Invalid File Format | Message format error |
| `NARR` | Narrative | Free-text reason (use sparingly) |

---

## pacs.004 Return Flow

### Scenario: Creditor Account Closed

```
Day 1:
Debtor Bank ──[pacs.008]──────────────────────────► Creditor Bank
            ◄──[pacs.002 ACSP]────────────────────── 
            RBA settles ESA funds ─────────────────►

Day 1–5 (within return window):
Creditor Bank discovers account AC04 (closed)
Creditor Bank ──[pacs.004 AC04]──────────────────► Debtor Bank
              Return settlement via same scheme

Debtor Bank:
  ├── Receives pacs.004
  ├── Credits customer account (return of debit)
  ├── Sends camt.054 (CRDT, RvslInd=false, narrative "Return of payment")
  └── Sends pain.002 status update to customer (if applicable)
```

---

## Return Windows (Maximum Time Allowed)

| Scheme | Return Window | Notes |
|--------|--------------|-------|
| **NPP (AU)** | 14 calendar days | Per NPP scheme rules |
| **BECS/DE (AU)** | 5 business days | Dishonour window |
| **SWIFT** | 10 business days (guideline) | No hard legal maximum |
| **SEPA (EU)** | D+5 business days | EC Payment Services Directive |

> After the return window, the creditor bank can no longer force a return through the scheme. Manual bilateral recovery is needed.

---

## pacs.004 vs pacs.002 RJCT

This is one of the most important distinctions in payments:

| | pacs.002 RJCT | pacs.004 |
|--|--------------|---------|
| Timing | Before or at settlement | After settlement |
| Funds moved? | ❌ No — payment blocked | ✅ Yes — funds already at creditor bank |
| Who sends it | Clearing network or creditor bank | Creditor bank only |
| Trigger | Validation failure | Credit application failure |
| Debtor action | Release debit hold / reverse | Await return settlement |
| Customer impact | No funds left | Funds temporarily at other bank |

---

## Receiving a pacs.004 — Debtor Bank Processing

```
Receive pacs.004
     │
     ▼
Extract OrgnlTxId
     │
     ▼
Find original PaymentOrder by TxId
     │
     ▼
Verify return amount = original amount
  (or note partial return if different)
     │
     ▼
Post CREDIT to debtor's account
  (return of original debit)
     │
     ▼
Update payment status → RETURNED
     │
     ▼
Record return reason code
     │
     ▼
Generate camt.054 (CRDT) to customer
     │
     ▼
If original payment was on behalf of a customer's
pain.001, generate pain.002 update (RJCT or RTRN)
     │
     ▼
Close reconciliation record
```

---

## Partial Returns

In some cases (e.g., charges deducted), the return amount may be **less than the original**:

```xml
<RtrdIntrBkSttlmAmt Ccy="AUD">985.00</RtrdIntrBkSttlmAmt>
<!-- Original was 1000.00 — 15.00 deducted as correspondent fee -->

<RtrdInstdAmt Ccy="AUD">1000.00</RtrdInstdAmt>
<!-- Original instructed amount preserved for reference -->
```

This is most common on SWIFT payments where intermediary banks have deducted charges, and `ChrgBr = CRED`.

---

## Sample pacs.004 XML

```xml
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.004.001.10">
  <PmtRtr>
    <GrpHdr>
      <MsgId>RTN-20240616-CBA-001</MsgId>
      <CreDtTm>2024-06-16T09:30:00</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <TtlRtrdIntrBkSttlmAmt Ccy="AUD">2500.00</TtlRtrdIntrBkSttlmAmt>
      <IntrBkSttlmDt>2024-06-16</IntrBkSttlmDt>
      <SttlmInf>
        <SttlmMtd>CLRG</SttlmMtd>
      </SttlmInf>
    </GrpHdr>
    <TxInf>
      <RtrId>RTNID-20240616-001</RtrId>
      <OrgnlGrpInf>
        <OrgnlMsgId>PACS008-ANZ-20240615-001</OrgnlMsgId>
        <OrgnlMsgNmId>pacs.008.001.10</OrgnlMsgNmId>
      </OrgnlGrpInf>
      <OrgnlTxId>TX-UUID-001</OrgnlTxId>
      <OrgnlEndToEndId>E2E-CUST-REF-001</OrgnlEndToEndId>
      <RtrdIntrBkSttlmAmt Ccy="AUD">2500.00</RtrdIntrBkSttlmAmt>
      <RtrRsnInf>
        <Rsn><Cd>AC04</Cd></Rsn>
      </RtrRsnInf>
      <OrgnlTxRef>
        <Dbtr><Nm>Acme Corp</Nm></Dbtr>
        <DbtrAcct><Id><Othr><Id>111222333</Id></Othr></Id></DbtrAcct>
        <Cdtr><Nm>Jane Smith</Nm></Cdtr>
        <CdtrAcct><Id><Othr><Id>999888777</Id></Othr></Id></CdtrAcct>
      </OrgnlTxRef>
    </TxInf>
  </PmtRtr>
</Document>
```

---

## Java Spring Notes

```java
@Service
public class Pacs004ProcessingService {

    @Transactional
    public ReturnResult processReturn(PaymentReturnV10 pacs004) {
        for (var txInf : pacs004.getTxInf()) {
            // 1. Find original payment
            PaymentOrder original = paymentRepository
                .findByTxId(txInf.getOrgnlTxId())
                .orElseThrow(() -> new PaymentNotFoundException(
                    txInf.getOrgnlTxId()));

            // 2. Validate return amount
            BigDecimal returnAmt = txInf.getRtrdIntrBkSttlmAmt().getValue();
            BigDecimal origAmt   = original.getSettlementAmount();
            boolean isPartial    = returnAmt.compareTo(origAmt) < 0;

            // 3. Post credit to debtor account
            String creditRef = ledgerService.postCredit(
                original.getDebtorAccountId(),
                returnAmt,
                "RTN:" + txInf.getRtrRsnInf().get(0).getRsn().getCd().value()
            );

            // 4. Update original payment status
            original.setStatus(PaymentStatus.RETURNED);
            original.setReturnReasonCode(
                txInf.getRtrRsnInf().get(0).getRsn().getCd().value());
            original.setReturnDate(LocalDate.now());
            original.setReturnRef(txInf.getRtrId());
            if (isPartial) {
                original.setReturnedAmount(returnAmt);
                original.setShortfallAmount(origAmt.subtract(returnAmt));
            }
            paymentRepository.save(original);

            // 5. Notify customer via camt.054
            notificationService.sendReturnNotification(original, txInf);

            // 6. Reconciliation
            reconciliationService.matchReturn(original, pacs004);
        }
        return ReturnResult.success();
    }
}
```

---

## Related Concepts
- [pain004.md](./pain004.md) — Why pain.004 doesn't exist (common confusion)
- [pain007_pacs007.md](./pain007_pacs007.md) — Payment reversal/recall (debtor-initiated)
- [camt055_camt056.md](./camt055_camt056.md) — Cancellation request that triggers a return
- [pacs008.md](./pacs008.md) — The original payment message being returned
- [debit_post.md](./debit_post.md#payment-return) — Accounting treatment of return
- [inbound.md](./inbound.md) — When a creditor bank initiates a return
- [payment_exceptions.md](./payment_exceptions.md) — Returns as exception handling
