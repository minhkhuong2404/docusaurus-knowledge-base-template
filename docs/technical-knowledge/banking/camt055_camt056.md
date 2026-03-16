---
id: camt055_camt056
title: camt.055 & camt.056 — Payment Cancellation Requests
sidebar_label: camt.055 / camt.056 — Cancellation
sidebar_position: 9
---

# camt.055 & camt.056 — Payment Cancellation Requests

## Overview

These two messages form the **formal payment cancellation (recall) workflow**, allowing a payment to be recalled after it has been sent — even after settlement.

| Message | Name | Direction |
|---------|------|-----------|
| `camt.055` | CustomerPaymentCancellationRequest | Customer → Debtor Bank |
| `camt.056` | FIToFIPaymentCancellationRequest | Debtor Bank → Creditor Bank |

> These are the "formal" recall messages used in SWIFT gpi and modern ISO 20022 schemes. They replace informal email/phone recall requests with a structured, trackable workflow.

---

## camt.055 — Customer Cancellation Request

Sent by a **customer** to their bank when they want to cancel a payment they initiated via `pain.001`.

```
pain.001  ──────────────────────────► Bank (payment sent)

Later:

Customer ──[camt.055]──► Debtor Bank    "Please cancel this payment"
```

### When to use camt.055

| Scenario | Use |
|----------|-----|
| Duplicate payment spotted by customer | ✅ |
| Wrong beneficiary entered | ✅ |
| Wrong amount submitted | ✅ |
| Customer changed mind (legitimate credit) | ✅ (beneficiary must agree) |
| Suspected fraud — customer didn't initiate | ✅ (urgent) |

---

## camt.056 — FI-to-FI Cancellation Request

Sent by the **Debtor Bank** to the **Creditor Bank** to formally request cancellation/recall of a `pacs.008`.

```
Debtor Bank ──[camt.056]──► Creditor Bank    "Please return this payment"
Creditor Bank ──[pacs.004 FOCR]──► Debtor Bank   (if agreed)
              OR
Creditor Bank ──[camt.029]──► Debtor Bank   (resolution of investigation — refusal)
```

---

## camt.056 Message Structure

```
camt.056
├── Assgnmt (Assignment)
│   ├── Id                           Assignment ID
│   ├── Assgnr                       Requester (debtor bank)
│   ├── Assgne                       Respondent (creditor bank)
│   └── CreDtTm
│
└── Undrlyg (Underlying)             ← 1..n
    ├── OrgnlGrpInfAndCxl
    │   ├── OrgnlMsgId               pacs.008 MsgId
    │   └── OrgnlMsgNmId
    │
    └── TxInf                        ← 1..n
        ├── CxlId                    Cancellation instruction ID
        ├── OrgnlInstrId             Original InstrId
        ├── OrgnlEndToEndId          Original EndToEndId
        ├── OrgnlTxId                Original TxId
        ├── OrgnlUETR                Original UETR (SWIFT gpi)
        ├── CxlRsnInf
        │   └── Rsn → Cd            Cancellation reason code
        └── OrgnlTxRef              Echoed parties from original
```

---

## Cancellation Reason Codes (camt.056)

| Code | Reason | Description |
|------|--------|-------------|
| `DUPL` | Duplicate Payment | Same payment sent twice |
| `FRAD` | Fraudulent Payment | Unauthorised/scam payment |
| `UPAY` | Undue Payment | Not owed, not authorised |
| `CUST` | Customer Cancellation | Customer request |
| `TECH` | Technical Issue | System error at originating bank |
| `AGNT` | Wrong Agent | Incorrect bank details |
| `AM09` | Wrong Amount | |
| `NARR` | Free Text | |

---

## Full Recall Workflow

```
T+0   Customer submits payment (pain.001)
      Debtor Bank sends pacs.008 → Creditor Bank
      Payment settles via NPP/SWIFT

T+1   Customer notices wrong account entered
      ↓
      Customer submits camt.055 to Debtor Bank
      ↓
      Debtor Bank validates and sends camt.056 to Creditor Bank
      ↓
      Creditor Bank receives camt.056:

      Scenario A — Funds still in beneficiary account:
        Creditor Bank agrees → sends pacs.004 (FOCR)
        Debtor Bank credits customer → sends camt.054
        Debtor Bank responds to customer with pain.002 / camt.029

      Scenario B — Funds already withdrawn by beneficiary:
        Creditor Bank contacts beneficiary for consent
        Beneficiary refuses → Creditor Bank sends camt.029 (refusal)
        Debtor Bank notifies customer → funds not recoverable via scheme

      Scenario C — FRAUD flagged:
        Immediate escalation — Creditor Bank may freeze beneficiary account
        Police referral possible
        Creditor Bank returns funds under fraud protocols
```

---

## camt.029 — Resolution of Investigation

`camt.029` is the **response message** from the creditor bank to a camt.056 recall request:

```
camt.056 ──────────────────────────► Creditor Bank
          ◄────────────── camt.029  (resolution)

camt.029 resolution codes:
  ACCP  — Accepted, funds returned via pacs.004
  RJCT  — Rejected (beneficiary refused, already withdrawn, etc.)
  PDNG  — Pending (investigation ongoing)
```

---

## SWIFT gpi and camt.056

In SWIFT gpi, camt.056 is the **standard recall mechanism** and integrates with gpi tracking:

```
1. Send camt.056 via SWIFT gpi
2. UETR from original pacs.008 is referenced
3. gpi tracker updates status to "RECALL_REQUESTED"
4. All banks in the payment chain can see the recall
5. Response via camt.029 / pacs.004 updates tracker
6. SLA: Creditor bank must respond within 10 business days
```

---

## NPP Recall (Australia)

On NPP, a similar mechanism exists as part of the **Osko dispute process**:

```
Via NPP/Osko:
  Debtor Bank sends cancellation request through NPP BI
  Creditor Bank receives notification
  Window: Up to 14 calendar days from payment date
  If agreed: pacs.004 return via NPP
  If disputed: Escalate to dispute resolution
```

---

## Java Spring Notes

```java
@Service
public class CancellationRequestService {

    // Customer submits camt.055
    public void processCamt055(
            CustomerPaymentCancellationRequestV10 camt055) {
        
        camt055.getUndrlyg().forEach(underlying -> {
            underlying.getTxInf().forEach(txInfo -> {
                String origTxId = txInfo.getOrgnlTxId();
                
                PaymentOrder order = paymentRepository
                    .findByTxId(origTxId).orElseThrow();

                String reason = txInfo.getCxlRsnInf().get(0)
                    .getRsn().getCd().value();

                // Build camt.056 and send to creditor bank
                FIToFIPaymentCancellationRequestV10 camt056 =
                    camt056Builder.build(order, reason);
                
                networkGateway.send(camt056, order.getCreditorBankBic());
                
                order.setStatus(PaymentStatus.RECALL_REQUESTED);
                paymentRepository.save(order);
                
                auditService.logRecall(order, reason);
            });
        });
    }

    // Receive camt.029 resolution from creditor bank
    public void processCamt029(ResolutionOfInvestigationV13 camt029) {
        String status = camt029.getSts().getConfSts().value();
        String origTxId = camt029.getCxlDtls().get(0)
            .getOrgnlTxRef().getTxId();
        
        PaymentOrder order = paymentRepository
            .findByTxId(origTxId).orElseThrow();

        if ("ACCP".equals(status)) {
            // Accepted — pacs.004 will follow
            order.setStatus(PaymentStatus.RECALL_ACCEPTED);
        } else {
            // Rejected — notify customer
            order.setStatus(PaymentStatus.RECALL_REJECTED);
            notificationService.notifyRecallFailure(order, camt029);
        }
        paymentRepository.save(order);
    }
}
```

---

## Related Concepts
- [pain007_pacs007.md](./pain007_pacs007.md) — Operational reversal (less formal)
- [pacs004.md](./pacs004.md) — The return message triggered by an agreed recall
- [fraud.md](./fraud.md) — Fraud-driven recalls
- [payment_exceptions.md](./payment_exceptions.md) — Recalls as exception cases
- [swift.md](./swift.md) — SWIFT gpi recall integration
