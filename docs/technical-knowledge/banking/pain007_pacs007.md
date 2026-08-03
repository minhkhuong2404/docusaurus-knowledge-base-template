---
id: pain007_pacs007
title: pain.007 & pacs.007 — Payment Reversal & Recall
sidebar_label: pain.007 / pacs.007 — Reversal
sidebar_position: 8
description: Payment reversals allow **the sending side** (debtor bank or originating customer) to request that a previously submitted payment be reversed — cancelling the.
tags:
- technical-knowledge
- banking
- pain007_pacs007
---

import BankingReversalRecallDiagram from '@site/src/components/BankingReversalRecallDiagram';

# pain.007 & pacs.007 — Payment Reversal & Recall

## Overview

Payment reversals allow **the sending side** (debtor bank or originating customer) to request that a previously submitted payment be reversed — cancelling the credit and returning funds. Two messages handle this:

| Message | Name | Direction | Scope |
|---------|------|-----------|-------|
| `pain.007` | CustomerPaymentReversal | Customer → Debtor Bank | Reversal of a `pain.001` |
| `pacs.007` | FIToFIPaymentReversal | Debtor Bank → Creditor Bank | Interbank reversal instruction |

> **Key concept:** A reversal is *requested by the sender*. A return (`pacs.004`) is *initiated by the receiver* when they can't apply the payment.

---

## When to Use Each Message

<BankingReversalRecallDiagram />

---

## pain.007 — CustomerPaymentReversal

### Overview

`pain.007` is sent by the **originating customer** to their bank to request the reversal of a previously submitted `pain.001`.

- **Full name:** `CustomerPaymentReversalV11`
- **Direction:** Customer → Debtor Bank
- **Triggers:** `pacs.007` from the bank to the counterparty

### Message Structure

```
pain.007
├── GrpHdr
│   ├── MsgId
│   ├── CreDtTm
│   └── InitgPty                        Customer making the reversal request
│
└── OrgnlPmtInfAndRvsl                  ← 1..n
    ├── RvslPmtInfId                    New ID for this reversal instruction
    ├── OrgnlPmtInfId                   PmtInfId from original pain.001
    ├── RvslRsnInf                      Reason for reversal
    │   └── Rsn → Cd                   e.g., DUPL, FRAD, UPAY
    │
    └── TxInf                           ← 1..n (per transaction to reverse)
        ├── RvslId                      Unique reversal transaction ID
        ├── OrgnlInstrId                InstrId from original pain.001
        ├── OrgnlEndToEndId             EndToEndId from original pain.001
        └── OrgnlInstdAmt              Amount to reverse
```

### Reversal Reason Codes (pain.007 / pacs.007)

| Code | Reason |
|------|--------|
| `DUPL` | Duplicate payment — same payment sent twice |
| `FRAD` | Fraudulent origin — payment originated by fraud |
| `UPAY` | Undue Payment — payment was not due/authorised |
| `TECH` | Technical problem at sender side |
| `CUST` | Requested by customer |
| `AGNT` | Incorrect agent details |
| `AM09` | Wrong amount |
| `NARR` | Free text narrative |

---

## pacs.007 — FIToFIPaymentReversal

### Overview

`pacs.007` is the **interbank reversal message** sent from the Debtor Bank to the Creditor Bank, requesting the reversal of a `pacs.008`.

- **Full name:** `FIToFIPaymentReversalV12`
- **Direction:** Debtor Bank → Creditor Bank
- **Triggered by:** `pain.007` from customer, or bank-initiated error correction

### Message Structure

```
pacs.007
├── GrpHdr
│   ├── MsgId
│   ├── CreDtTm
│   ├── NbOfTxs
│   ├── TtlRvsdIntrBkSttlmAmt
│   └── SttlmInf
│
└── TxInf                               ← 1..n
    ├── RvslId                          New reversal transaction ID
    ├── OrgnlGrpInf
    │   ├── OrgnlMsgId                  Original pacs.008 MsgId
    │   └── OrgnlMsgNmId               "pacs.008.001.10"
    ├── OrgnlInstrId                    Original InstrId
    ├── OrgnlEndToEndId                 Original EndToEndId
    ├── OrgnlTxId                       Original TxId
    ├── OrgnlUETR                       Original UETR (SWIFT)
    ├── RvsdIntrBkSttlmAmt             Amount to reverse
    ├── RvslRsnInf
    │   └── Rsn → Cd                   Reason code
    └── OrgnlTxRef                     Echo of original pacs.008 parties
```

---

## Reversal vs Return: The Critical Difference

```
REVERSAL (pacs.007)                  RETURN (pacs.004)
────────────────────────────         ────────────────────────────
Initiator:  DEBTOR BANK              Initiator: CREDITOR BANK
Reason:     Sender's error/fraud     Reason: Cannot apply credit
Consent:    Creditor bank must agree Consent: Not required
Funds:      Were correctly sent      Funds:  Cannot be credited
Response:   Creditor sends pacs.004  Response: No separate request needed
              back if agreeing
Timeline:   Time-sensitive — harder  Timeline: Governed by scheme rules
              to reverse after credit              (up to 14 days NPP)
```

---

## Reversal Flow (Full Chain)

```
Customer          Debtor Bank           Creditor Bank         Customer B

    ──[pain.007]─►│
                  │─Validate reversal
                  │─Check: already sent?
                  │    YES (pacs.008 already submitted):
                  │      ──[pacs.007]──────────────────►│
                  │                                     │─Check: already credited?
                  │                                     │   NO: Cancel + Agree
                  │                                     │   YES: Need consent
                  │                                     │       from Customer B
                  │◄─[pacs.004 FOCR]───────────────────│
                  │  (return, reason: FOCR)             │
                  │─Credit debtor account               │─Debit/cancel credit
                  │─Send camt.054 (CRDT)                │─Send camt.054 to B
                  ◄──[pain.002 RVRSD]─────────────────── (if applicable)
```

### FOCR — Following Cancellation Request

When a creditor bank agrees to a reversal request (pacs.007), they respond with a `pacs.004` using reason code `FOCR` (Following Cancellation Request), confirming funds are being returned.

---

## Cancellation Requests: camt.056

For a more formal approach to recalling a payment, banks use `camt.056` — see the [camt.055 & camt.056](./camt055_camt056.md) page. The relationship:

```
pacs.007  ─── Operational reversal instruction (bilateral)
camt.056  ─── Formal cancellation request (standardised, tracked)
```

On SWIFT gpi, `camt.056` is the **preferred mechanism** for recalls, as it integrates with gpi tracking.

---

## When a Reversal Is Refused

The creditor bank may **refuse** to return funds if:
- Funds have already been withdrawn by the beneficiary
- Beneficiary does not consent (for legitimate credits)
- Return window has elapsed
- Legal order in place (e.g., court freeze)

In this case, the debtor bank receives no `pacs.004`, and must pursue recovery through other means (legal action, bilateral negotiation, fraud teams).

---

## Java Spring Notes

```java
// pain.007 processing — customer reversal request
@Service
public class Pain007ProcessingService {

    @Transactional
    public ReversalResult process(CustomerPaymentReversalV11 pain007) {
        for (var rvsl : pain007.getOrgnlPmtInfAndRvsl()) {
            for (var txInfo : rvsl.getTxInf()) {
                String origE2EId = txInfo.getOrgnlEndToEndId();
                
                PaymentOrder order = paymentRepository
                    .findByEndToEndId(origE2EId)
                    .orElseThrow();

                // Can we still reverse?
                if (!reversalPolicy.canReverse(order)) {
                    throw new ReversalNotPermittedException(
                        "Payment already settled and credited: " + origE2EId);
                }

                String reasonCode = rvsl.getRvslRsnInf().get(0)
                    .getRsn().getCd().value();

                // Build and send pacs.007 to creditor bank
                Pacs007 pacs007 = pacs007Builder.build(order, reasonCode);
                networkGateway.send(pacs007);

                order.setStatus(PaymentStatus.REVERSAL_REQUESTED);
                order.setReversalReason(reasonCode);
                paymentRepository.save(order);
            }
        }
        return ReversalResult.pending();
    }
}
```

---

## Related Concepts
- [pain004.md](./pain004.md) — Why pain.004 doesn't exist (common confusion)
- [pacs004.md](./pacs004.md) — pacs.004 Payment Return (creditor-initiated)
- [camt055_camt056.md](./camt055_camt056.md) — Formal cancellation request messages
- [pain001.md](./pain001.md) — The original payment pain.007 reverses
- [pacs008.md](./pacs008.md) — The interbank message pacs.007 reverses
- [debit_reversal.md](./debit_reversal.md) — Internal debit reversal accounting
