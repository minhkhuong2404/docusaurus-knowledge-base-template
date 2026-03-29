---
id: payment_return
title: Payment Return
sidebar_label: Payment Return
description: Detailed explanation of payment returns, pacs.004 ISO messaging, accounting, and difference from reversals.
tags: [banking, ledger, returns, pacs004, iso20022, swift, npp]
---

# Payment Return

A **Payment Return** represents funds being actively sent back to a sending bank ("Debtor Bank") by the receiving bank ("Creditor Bank") after the initial payment successfully traversed the clearing network, but could not be applied to the recipient's account.

---

## 🚫 Primary Causes

Because a Return means the payment reached its destination untouched by network timeouts, the fault almost always lies with the recipient's information or status:
- **Account Close:** The destination routing numbers (BSB / Swift Code / IBAN / Account Number) are structurally perfectly valid, but the account is closed.
- **Account Blocked / Frozen:** The account exists but is restricted due to Legal Hold or Suspicious Activity (AML triggers).
- **Invalid Payee Name:** For networks enforcing Confirmation of Payee (CoP), a mismatch in name may cause an automatic return.
- **Customer Requested Refusal:** For direct debit pull scenarios (`pacs.003`), the debtor can instruct their bank to refuse it.

Unlike a [Debit Reversal](./debit_reversal.md) (which happens *before* or *during* network transit due to technical failures), a return means the payment was technically fully successful from a networking standpoint, but practically unappliable by the business logic at the destination bank.

## ✉️ ISO 20022 Context: The `pacs.004` Message

In ISO 20022 payment rails (like SWIFT CBPR+, Australian NPP, European SEPA), a Payment Return isn't standard credit transfer (`pacs.008`) sent backwards. It must use a dedicated **Return Instruction** message: the `pacs.004`.

**Key `pacs.004` characteristics:**
1. It retains the original transaction identification (`TxId`, `InstrId`, and `EndToEndId`) so the sending bank can unequivocally link the returned funds to the initial outbound debit instruction.
2. It includes a specific **Return Reason Code** (e.g., `AC04` = Closed Account, `AM05` = Duplication, `MD01` = Mandate Missing).
3. The returned funds might be slightly less than the initial amount due to deducted processing fees by the receiving or intermediary banks.

```xml
<!-- Example ISO 20022 Return Reason Block in pacs.004 -->
<RtrRsnInf>
    <Rsn>
        <Prtry>AC04</Prtry>
    </Rsn>
    <AddtlInf>Account closed on 12th March</AddtlInf>
</RtrRsnInf>
```

---

## ⚖️ Ledger Accounting Impact

When the Debtor Bank receives a `pacs.004`, they must execute a credit to the sender's account to return the funds. This is a new **Credit Post** event linked to the return message. 

If the customer's account has since been closed too (which occasionally happens if they just closed their account and an old outbound payment bounced back days later), the funds will fall into an internal Bank Suspense Account, triggering manual intervention by the Operations / Exceptions team.

---

## 🔗 Related Concepts
- [Debit Reversal](./debit_reversal.md)
- [Credit Posting](./credit_post.md)
- [Payment Exceptions](./payment_exceptions.md)
