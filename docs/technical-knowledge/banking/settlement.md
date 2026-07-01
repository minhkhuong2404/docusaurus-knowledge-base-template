---
id: settlement
title: Settlement — Final Transfer of Central Bank Money
sidebar_label: Settlement
sidebar_position: 7
description: How payment settlement works in Australia and globally — ESA accounts, RBA FSS, RTGS finality, DNS settlement risk, failed settlement handling, and Nostro/Vostro reconciliation.
tags: [banking, settlement, rtgs, dns, esa, rba, finality, nostro, vostro]
---

# 💰 Settlement — Final Transfer of Central Bank Money

Settlement is the **final, irrevocable transfer of funds** between financial institutions. It is the point at which a payment obligation is discharged and cannot be reversed by the payment system. Settlement occurs in **central bank money** — the most risk-free form of payment.

> Clearing = what you owe. Settlement = actually paying it.

---

## Settlement vs Clearing Recap

| | Clearing | Settlement |
|---|---|---|
| What happens | Obligations calculated and netted | Central bank money moves between ESAs |
| When | During/after payment processing | At scheduled times (DNS) or immediately (RTGS) |
| Finality | Not yet final | Final and irrevocable |
| Risk | Systemic (DNS) | Eliminated |

---

## Exchange Settlement Accounts (ESA)

In Australia, all financial institutions that participate in direct clearing and settlement hold an **Exchange Settlement Account (ESA)** at the **Reserve Bank of Australia (RBA)**.

### Key Properties
- Denominated in AUD only
- Funds in ESA = **central bank money** (settlement-grade)
- Zero credit risk — backed by the RBA
- Interest paid at the **cash rate target** (less 25bps for standard ESA)
- ADI must maintain positive ESA balance at end of each RTGS cycle

### ESA vs Customer Deposit Account

| | ESA | Customer Account |
|---|---|---|
| Held at | Reserve Bank of Australia | Commercial bank |
| Type of money | Central bank money | Commercial bank money |
| Risk | None (sovereign) | Deposit guarantee up to $250K |
| Usage | Interbank settlement only | Customer transactions |

---

## RBA Settlement Systems

### RITS — Reserve Bank Information and Transfer System

The core high-value settlement infrastructure in Australia:

| Feature | Detail |
|---------|--------|
| Operator | Reserve Bank of Australia |
| Payment types | High-value RTGS, HVCS, ESA-to-ESA |
| Operating hours | 7:30 AM – 8:30 PM AEST (business days) |
| Settlement mechanism | RTGS with LSM (Liquidity Saving Mechanism) |
| Access | Direct SWIFT connection to RBA |

### NPP Fast Settlement Service (FSS)

The settlement layer underpinning the New Payments Platform:

| Feature | Detail |
|---------|--------|
| Operator | Reserve Bank of Australia |
| Payment types | NPP/Osko real-time payments |
| Operating hours | 24/7/365 |
| Settlement mechanism | Individual RTGS per NPP payment |
| Latency | Sub-second settlement |

---

## Settlement Finality

**Finality** = the point at which a payment cannot be reversed by the payment system.

### In RTGS (NPP/FSS, HVCS/RITS)
- Settlement is final at the moment the ESA debit is confirmed
- The receiving bank's ESA is credited simultaneously
- No unwinding possible by the scheme — only court orders or bilateral agreement can reverse

### In DNS (BECS, BPAY)
- Settlement finalises at the settlement window cut-off
- Before settlement, obligations are **provisional** — a defaulting bank can cause unwind
- After settlement, positions are final

### Finality and the Customer

Note: settlement finality does **not** automatically mean the customer's account is credited. The bank may:
1. Credit the customer immediately (NPP — typical)
2. Hold funds pending compliance review
3. Apply a value date (BECS — typically D+1)
4. Return funds post-settlement if fraud/error discovered (customer-level, not scheme-level)

---

## DNS Settlement Process (BECS)

```
All BECS payments submitted for a cycle
        │
        ▼
AusPayNet Clearing House nets all obligations
        │ (net position per ADI)
        ▼
Net settlement instructions sent to RBA RITS
        │
        ▼
RBA debits net-payer ESAs
RBA credits net-receiver ESAs
        │
        ▼
Settlement confirmed — obligations discharged
        │
        ▼
Receiving ADIs post credits to customer accounts
```

### BECS Settlement Windows (Indicative)

| Window | Settlement Time |
|--------|----------------|
| Window 1 | ~8:45 AM AEST |
| Window 2 | ~1:45 PM AEST |
| Window 3 | ~6:15 PM AEST |

---

## Failed Settlement — What Happens?

### DNS Default Scenario

If a bank cannot fund its net settlement position:
1. **Notification**: RBA/AusPayNet notified
2. **Liquidity provision**: Bank may draw on intraday repo (RBA collateral facility)
3. **Default fund**: Scheme's default fund used if applicable
4. **Loss sharing**: Remaining participants share the shortfall (proportional to exposure)
5. **Unwind**: As a last resort, all payments involving the defaulting bank are unwound — affecting all its counterparties

### RTGS Default Scenario
- Each payment is final the moment it settles — no systemic unwind
- If a bank's ESA is exhausted, payments queue (not fail immediately)
- RBA provides intraday liquidity via repo against eligible collateral
- RITS LSM helps resolve circular queuing (gridlock)

---

## Nostro / Vostro in Cross-Border Settlement

For international payments, settlement does not occur via a central bank. Instead it occurs via bilateral Nostro/Vostro account relationships.

### Definitions

| Term | Meaning | Example |
|------|---------|---------|
| **Nostro** | "Our account" held at another bank | AU Bank's USD account at JP Morgan New York |
| **Vostro** | "Your account" held at our bank | JP Morgan's AUD account at AU Bank |
| **Loro** | A third party's account (used when describing to a third bank) | "Their account at JP Morgan" |

### How Cross-Border Settlement Works

```
AU Customer pays USD to US Beneficiary

AU Bank holds Nostro (USD) at JP Morgan NY
                │
AU Bank sends MT103 to JP Morgan NY
JP Morgan debits AU Bank's Nostro account    ← settlement
JP Morgan credits Beneficiary's US Bank
```

### Nostro Reconciliation

Nostro accounts must be reconciled daily:
- **Expected**: AU Bank's internal ledger shows what should have moved
- **Actual**: JP Morgan's vostro statement (MT940/camt.053)
- **Breaks**: Any difference must be investigated — could be timing, missed payment, or fraud

```
Internal Ledger              Nostro Statement (MT940)
  USD Out: $10,000,000    vs   Debits: $9,999,500
  USD In:   $5,000,000    vs   Credits: $5,000,000
  Expected close: $3M         Actual close: $3,000,500
  BREAK: $500 — investigate fee deduction at correspondent
```

---

## Liquidity Management at Settlement

Banks actively manage ESA balances and Nostro positions throughout the day:

| Action | Purpose |
|--------|---------|
| **Intraday repo** | Borrow against collateral from RBA to fund RTGS payments |
| **Reverse repo** | Park excess cash at RBA intraday |
| **Interbank lending** | Borrow from other banks via overnight cash market |
| **Payment queuing** | Delay non-urgent outgoing payments to preserve liquidity |
| **LSM simulation** | RITS continuously simulates batch offsets to reduce liquidity needs |

---

## Settlement in ISO 20022 Messages

| Message | Settlement Field |
|---------|----------------|
| `pacs.008` | `<IntrBkSttlmDt>` — interbank settlement date |
| `pacs.008` | `<SttlmMtd>` — settlement method (INGA/INDA/COVE/CLRG) |
| `camt.053` | `<Bal>` — opening/closing/available balances |
| `pacs.002` | `<SttlmInf>` — settlement information in status report |

### Settlement Method Codes

| Code | Meaning |
|------|---------|
| `INDA` | Instructed Agent — receiver's correspondent covers |
| `INGA` | Instructing Agent — sender's correspondent covers |
| `COVE` | Cover Method — separate cover payment (MT202 COV) |
| `CLRG` | Clearing — through a clearing scheme |

---

## Engineering Notes

```java
// Model settlement state as an explicit state machine
enum SettlementStatus {
    PENDING,        // obligation exists, not yet settled
    QUEUED,         // in RTGS queue
    SETTLED,        // ESA transfer confirmed — FINAL
    FAILED,         // ESA debit failed (insufficient funds)
    UNWOUND         // DNS unwind applied (exceptional)
}

// Settlement confirmation should be treated as an immutable event
@Entity
public class SettlementRecord {
    private String settlementId;
    private LocalDate settlementDate;
    private SettlementStatus status;
    private Instant settledAt;   // set once, never changed
    private BigDecimal netAmount;
    private String esaReference; // RBA reference number
}
```

**Key engineering principles:**
- Settlement = financial finality → write once, never update
- Publish `PaymentSettled` domain event on ESA confirmation
- Reconcile against external statement (MT940/camt.053) daily
- Never credit customer funds until settlement is final (for DNS)
- For NPP: settlement is near-instant → safe to credit immediately

---

## Interview Questions

**Q: What is the difference between payment finality at the customer level vs the scheme level?**
> Scheme-level finality = the interbank obligation is discharged and cannot be unwound by the scheme. Customer-level finality = the bank's internal posting to the customer account. For NPP, both happen within seconds. For BECS, scheme finality at settlement window but customers are credited after D+1 value date. A bank can still reverse a customer posting post-scheme-finality for fraud (not via the scheme — bilaterally or via pacs.004 return).

**Q: What is Nostro reconciliation and why is it critical?**
> Nostro reconciliation compares the bank's internal expectation of movements in its foreign currency accounts (Nostro) against the actual statement from the correspondent bank. Breaks indicate missed payments, fee deductions, timing differences, or fraud. Unreconciled breaks → incorrect P&L, compliance risk, liquidity misjudgement.

:::warning[Common Interview Trap]
Conflating "payment is processed" with "payment is settled." A payment can be debited from a customer, pass all checks, and reach the beneficiary bank — but settlement of the interbank obligation may still be hours away (DNS). Crediting the beneficiary before settlement creates credit risk for the receiving bank.
:::

---

## Related Concepts

- [Clearing](./clearing)
- [Liquidity Management](./liquidity)
- [RTGS](./rtgs)
- [NPP](./npp)
- [BECS](./becs)
- [Reconciliation](./reconciliation)
- [SWIFT](./swift)
- [Correspondent Banking](./correspondent_banking)
