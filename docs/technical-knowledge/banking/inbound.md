---
id: inbound
title: Inbound Payments
sidebar_label: Inbound Payments
sidebar_position: 3
description: Complete guide to inbound payment processing — STP vs exception routing, credit hold rules, beneficiary validation, camt.054 notification, and engineering patterns.
tags: [banking, inbound, payments, stp, credit, camt054, beneficiary]
---

# 📥 Inbound Payments

An **inbound payment** is a credit transfer received by a bank on behalf of one of its customers — money coming **in** to the bank from another financial institution. It is the counterpart to an [outbound payment](./outbound).

---

## Inbound Payment Sources

| Source | Message | Timing |
|--------|---------|--------|
| **NPP (domestic real-time)** | pacs.008 via NPP | Sub-second |
| **BECS Direct Entry (batch credit)** | DE file via AusPayNet | D+1 |
| **SWIFT / cross-border** | MT103 / pacs.008 | D+0 to D+2 |
| **RTGS / HVCS** | MT202 / pacs.009 | Same-day |
| **BPAY** | Batch file | D+1 |
| **On-us (internal)** | Internal instruction | Real-time |

---

## Inbound Payment Processing — End to End

```
Inbound pacs.008 / DE credit arrives at bank
        │
        ▼
1. SCHEMA VALIDATION
   - Message format correct?
   - All mandatory fields present?
   - Character encoding valid?
        │
        ▼
2. DUPLICATE DETECTION
   - Check MsgId, InstrId, EndToEndId, UETR
   - If duplicate: reject with AM05 or log and skip
        │
        ▼
3. BENEFICIARY LOOKUP
   - Resolve BSB/account or PayID to customer record
   - Account exists? Active? Type compatible?
   - If not found: REJECT (AC01/AC04) or exception queue
        │
        ▼
4. COMPLIANCE CHECKS (parallel)
   ├── Sanctions screening (debtor, creditor, remittance info)
   ├── AML / Transaction Monitoring
   └── Fraud rules
        │
        ├── PASS → proceed
        └── FAIL → HOLD for manual review (compliance queue)
        │
        ▼
5. CREDIT HOLD ASSESSMENT
   - Large amount triggers temporary hold?
   - Structuring indicators?
   - High-risk jurisdiction?
        │
        ▼
6. CREDIT POSTING
   - Debit settlement/nostro account
   - Credit customer account
   - Record with full reference chain
        │
        ▼
7. CUSTOMER NOTIFICATION
   - Send camt.054 (debit/credit notification)
   - Push notification (mobile banking)
   - Send pacs.002 acknowledgement back to sender
```

---

## STP vs Exception Routing

### Straight-Through Processing (STP)

An inbound payment is **STP** if it passes all automated checks without human intervention:

- Schema valid ✅
- No duplicate ✅
- Beneficiary found and account active ✅
- No sanctions/AML hits ✅
- No credit hold triggers ✅
- Credit posts automatically ✅

**Target STP rate for mature payments systems: >95%**

### Exception / Manual Queue

Payments failing any automated check enter the **exception queue** for manual investigation:

| Exception Type | Typical Cause | Resolution |
|---------------|--------------|------------|
| Beneficiary not found | Account closed, BSB changed | Return pacs.004 or contact sender |
| Duplicate detected | Retry without dedup | Confirm duplicate; reject or hold |
| Sanctions hit | Name match on sanctions list | Compliance team review — hold or return |
| AML alert | Unusual transaction pattern | AML analyst reviews within SLA |
| Invalid format | Malformed message fields | Return pacs.002 RJCT with FF01 |
| Credit hold | Large amount, high-risk source | Compliance approval required |

---

## Beneficiary Validation

Receiving banks validate the beneficiary's account details before crediting:

### BSB/Account Validation

| Check | Validation |
|-------|-----------|
| BSB format | Must be 6 digits (xxx-xxx format) |
| BSB existence | BSB must be registered in the BSB Directory |
| Account existence | Account must exist and be active at that BSB |
| Account type | Must be eligible to receive credits (not credit-only or restricted) |
| Currency match | Payment currency must match account currency (or FX conversion rules applied) |
| Name match (CoP) | If CoP enabled: check beneficiary name matches account holder |

### PayID Lookup (NPP)

For NPP payments using PayID:
1. Sender bank resolves PayID → BSB/account via NPPA PayID directory
2. Resolution returns beneficiary name (shown to sender for CoP verification)
3. Transaction routed to beneficiary bank using resolved BSB/account

---

## Credit Hold Rules

Banks may temporarily **hold** an inbound credit before posting to the customer account:

| Trigger | Typical Hold Duration | Action Required |
|---------|----------------------|----------------|
| Amount > threshold (e.g. >$1M) | 1–4 hours | Compliance officer reviews |
| Source: high-risk jurisdiction | 1–2 business days | AML team review |
| Sanctions name match | Until resolved | Compliance + legal |
| Structuring indicators | 1–2 business days | SAR filing assessment |
| Account under freeze order | Indefinitely | Court order / legal team |
| Missing mandatory reference | 1–4 hours | Operations traces funds |

During a hold:
- Customer funds are NOT available
- Interest may or may not accrue (depending on policy)
- Customer should be notified (if legally permitted)

---

## camt.054 — Credit Notification to Customer

Once the credit is posted, the bank sends the customer a **camt.054 notification**:

```xml
<BkToCstmrDbtCdtNtfctn>
  <GrpHdr>
    <MsgId>NTFN-2024-001</MsgId>
    <CreDtTm>2024-01-15T14:23:00</CreDtTm>
  </GrpHdr>
  <Ntfctn>
    <Acct>
      <Id><Othr><Id>12345678</Id></Othr></Id>
    </Acct>
    <Ntry>
      <CdtDbtInd>CRDT</CdtDbtInd>
      <Amt Ccy="AUD">5000.00</Amt>
      <BookgDt><Dt>2024-01-15</Dt></BookgDt>
      <NtryDtls>
        <TxDtls>
          <Refs>
            <EndToEndId>E2E-PAY-123456</EndToEndId>
          </Refs>
          <RmtInf>
            <Ustrd>Invoice INV-2024-001 payment</Ustrd>
          </RmtInf>
        </TxDtls>
      </NtryDtls>
    </Ntry>
  </Ntfctn>
</BkToCstmrDbtCdtNtfctn>
```

---

## Engineering Patterns

### Inbound Payment Handler

```java
@Service
public class InboundPaymentProcessor {

    public InboundResult processInbound(Pacs008Message message) {

        // 1. Idempotency check
        if (paymentRepository.existsByEndToEndId(message.getEndToEndId())) {
            return InboundResult.duplicate(message.getEndToEndId());
        }

        // 2. Beneficiary lookup
        CustomerAccount account = accountService
            .findByBsbAndAccount(
                message.getCreditorBsb(),
                message.getCreditorAccount()
            )
            .orElseThrow(() -> new BeneficiaryNotFoundException(message));

        // 3. Compliance — run async but wait for result
        ComplianceResult compliance = complianceService
            .screenInbound(message);

        if (compliance.requiresHold()) {
            return holdForReview(message, account, compliance.getHoldReason());
        }

        if (compliance.isRejected()) {
            return returnPayment(message, compliance.getReturnCode());
        }

        // 4. Credit posting
        CreditResult credit = postingService.creditAccount(
            account,
            message.getAmount(),
            message.getCurrency(),
            buildPostingReference(message)
        );

        // 5. Notify customer
        notificationService.sendCreditNotification(account, credit);

        // 6. Send pacs.002 acknowledgement
        pacs002Service.sendAccepted(message.getMsgId(), message.getEndToEndId());

        return InboundResult.success(credit);
    }
}
```

---

## Interview Questions

**Q: What is the difference between STP and exception processing for inbound payments?**
> STP (Straight-Through Processing) = all automated checks pass → payment credited without human intervention. Exception = one or more checks fails (compliance hit, account not found, format error) → payment enters a manual review queue. A bank's STP rate is a key operational KPI — low STP means high operational cost and slower customer credit.

**Q: When should a bank hold an inbound credit rather than post it immediately?**
> When: sanctions screening returns a match requiring analyst review; AML rules flag the transaction for investigation; the amount exceeds a policy threshold requiring authorisation; the account is under a legal freeze; or structuring indicators suggest the payment is part of a layering scheme. The payment is held in a suspense/holding account while under review.

---

## Related Concepts

- [Outbound Payments](./outbound)
- [On-Us Transactions](./onus)
- [Off-Us Transactions](./offus)
- [pacs.008](./pacs008)
- [camt.054](./camt054)
- [Sanctions Screening](./sanction)
- [AML, CTF & KYC](./aml_kyc)
- [Credit Posting](./credit_post)
