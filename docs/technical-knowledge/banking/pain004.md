---
id: pain004
title: pain.004 — Does It Exist?
sidebar_label: pain.004 (Clarification)
sidebar_position: 7
---

# pain.004 — Clarification

## Does pain.004 Exist in ISO 20022?

**No — `pain.004` is not a defined ISO 20022 message.**

This is a common source of confusion for new learners. The ISO 20022 `pain` (Payment Initiation) message family skips directly from `pain.002` to `pain.007`. There is no `pain.003`, `pain.004`, `pain.005`, or `pain.006` in the standard set.

---

## The pain.00x Message Family

| Message | Name | Status |
|---------|------|--------|
| `pain.001` | CustomerCreditTransferInitiation | ✅ Defined and widely used |
| `pain.002` | CustomerPaymentStatusReport | ✅ Defined and widely used |
| `pain.003` | — | ❌ Not defined |
| `pain.004` | — | ❌ Not defined |
| `pain.005` | — | ❌ Not defined |
| `pain.006` | — | ❌ Not defined |
| `pain.007` | CustomerPaymentReversal | ✅ Defined |
| `pain.008` | CustomerDirectDebitInitiation | ✅ Defined and widely used |
| `pain.009` | MandateInitiationRequest | ✅ Defined (direct debit mandates) |
| `pain.010` | MandateAmendmentRequest | ✅ Defined |
| `pain.011` | MandateCancellationRequest | ✅ Defined |
| `pain.012` | MandateAcceptanceReport | ✅ Defined |
| `pain.013` | CreditorPaymentActivationRequest | ✅ Defined (Request to Pay) |
| `pain.014` | CreditorPaymentActivationRequestStatusReport | ✅ Defined |

---

## What You Are Probably Looking For

If you searched for `pain.004`, you likely mean one of:

| What you want | Correct message | Description |
|---------------|----------------|-------------|
| **Payment return** (creditor bank returns funds) | [`pacs.004`](./pacs004.md) | Interbank payment return message |
| **Payment reversal** (bank reverses a payment) | [`pain.007`](./pain007_pacs007.md) + [`pacs.007`](./pain007_pacs007.md) | Customer and interbank reversal |
| **Recall / cancellation request** | [`camt.055`](./camt055_camt056.md) / [`camt.056`](./camt055_camt056.md) | Request to cancel a sent payment |
| **Debit reversal** (undo a debit posting) | [Debit Reversal](./debit_reversal.md) | Internal accounting reversal |

---

## Quick Reference: Return vs Reversal vs Recall

```
WHO initiates?    WHAT message?     WHY?
─────────────────────────────────────────────────────
Creditor Bank  →  pacs.004        Cannot apply to account
                                   (account closed, wrong account)

Debtor Bank    →  pain.007        Customer requests reversal
               →  pacs.007        Interbank reversal instruction
               →  camt.056        Formal cancellation/recall request

Internal       →  (no ISO msg)    Technical error / debit reversal
               →  camt.054        Notification of internal reversal
                  (RvslInd=true)
```

---

## See Also

- [pacs.004 — Payment Return](./pacs004.md) — The message you are most likely looking for
- [pain.007 & pacs.007 — Payment Reversal](./pain007_pacs007.md)
- [camt.055 & camt.056 — Cancellation Request](./camt055_camt056.md)
- [Debit Reversal](./debit_reversal.md) — Internal accounting reversal
