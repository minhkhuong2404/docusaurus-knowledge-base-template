---
id: clearing
title: Clearing — Payment Netting & Interbank Settlement Preparation
sidebar_label: Clearing
sidebar_position: 6
description: How clearing works in Australian and global payment systems — DNS vs RTGS, batch netting, BECS clearing cycles, AusPayNet rules, and intraday liquidity implications.
tags: [banking, clearing, dns, rtgs, becs, netting, ausPayNet]
---

import BankingClearingSettlementDiagram from '@site/src/components/BankingClearingSettlementDiagram';

# 🔄 Clearing — Payment Netting & Interbank Settlement Preparation

Clearing is the process of **reconciling and netting payment obligations between financial institutions** before final settlement occurs. It sits between a payment being authorised and money actually moving between bank accounts at the central bank.

> **Key distinction:** Clearing = calculating who owes whom. Settlement = the actual money movement.

<BankingClearingSettlementDiagram />

---

## Why Clearing Exists

If every payment triggered an immediate bilateral transfer of central bank money, the system would be impossibly inefficient:

- Bank A sends 10,000 payments to Bank B
- Bank B sends 9,800 payments to Bank A
- Without clearing: 19,800 gross transfers
- **With clearing:** 1 net transfer of the residual difference

Clearing nets these obligations down to a single net position per bank per settlement cycle.

---

## DNS vs RTGS — The Two Clearing Models

### Deferred Net Settlement (DNS)

| Attribute | Detail |
|-----------|--------|
| **How it works** | All payments are batched; obligations are netted at end of a cycle |
| **Settlement frequency** | Once or several times per day (e.g. BECS: 3 settlement windows) |
| **Liquidity requirement** | Only net positions need to be funded |
| **Risk** | If a participant fails before settlement, all obligations unwind — **systemic risk** |
| **Cost** | Low — efficient use of liquidity |
| **Examples** | BECS Direct Entry, BPAY, VISA/Mastercard daily nets |

### Real-Time Gross Settlement (RTGS)

| Attribute | Detail |
|-----------|--------|
| **How it works** | Each payment is settled individually, in real time |
| **Settlement frequency** | Continuous, payment by payment |
| **Liquidity requirement** | Full face value must be available at time of instruction |
| **Risk** | Very low — each payment is final on settlement |
| **Cost** | Higher liquidity cost |
| **Examples** | NPP (via FSS), RTGS/HVCS (RITS), SWIFT (via correspondent nostros) |

---

## Australian Clearing Systems

### BECS (Bulk Electronic Clearing System)

Operated by **AusPayNet**, BECS handles bulk batch payments:

| Detail | Value |
|--------|-------|
| Payment types | Direct Entry credits, direct debits |
| File format | 120-character fixed-width DE file |
| Timing | D+0 submission, D+1 value (next business day) |
| Settlement windows | 3 per day via RBA RTGS |
| Scheme rules | AusPayNet BECS Procedures |
| Participants | ADIs (banks, credit unions, building societies) |

#### BECS Clearing Cycle

```
Originator (batch file)
     │
     ▼ Submit DE file before cut-off
Originating ADI
     │
     ▼ Send file to Clearing House (AusPayNet/BECS)
BECS Clearing House
     │
     ├─► Net obligations calculated per ADI pair
     │
     ▼ Settlement instructions sent to RBA
RBA RTGS / ESA
     │
     ▼ Net positions settled
Receiving ADIs
     │
     ▼ Credit entries posted to customer accounts
```

### BPAY Clearing

- Operated by **BPAY Group**
- Payments submitted via participating financial institutions
- Batched and netted daily
- Settlement via RITS/RBA

### NPP Fast Settlement Service (FSS)

- Operated by **NPPA** via **RBA FSS**
- RTGS-based: each NPP payment settles individually and immediately
- No netting — each instruction is final
- Available 24/7/365

### HVCS / RITS (High-Value Clearing System)

- Operated by **RBA** via **RITS (Reserve Bank Information and Transfer System)**
- High-value and time-critical domestic AUD payments
- RTGS — payment by payment
- Typically used for large corporate/treasury payments (>$250K rule of thumb)

---

## Multilateral Netting — How it Works

In DNS clearing, all banks' positions are netted multilaterally:

```
Bank A → Bank B: $1,000,000
Bank B → Bank A: $600,000
Bank A → Bank C: $400,000
Bank C → Bank A: $200,000
Bank B → Bank C: $100,000

After multilateral netting:
  Bank A: net position = -$1,000,000 - $400,000 + $600,000 + $200,000 = -$600,000 (net PAYER)
  Bank B: net position = +$1,000,000 - $600,000 - $100,000 = +$300,000 (net RECEIVER)
  Bank C: net position = +$400,000 - $200,000 + $100,000 = +$300,000 (net RECEIVER)

Total net transfers: 3 (instead of 5 gross)
```

---

## Intraday Liquidity Implications

Clearing models directly drive liquidity strategy:

### DNS Liquidity
- Banks must fund their **end-of-cycle net position** only
- Intraday liquidity can be recycled — received payments can fund outgoing obligations
- Risk: if inflows don't arrive before cut-off, bank must draw on credit facility or ESA

### RTGS Liquidity
- Each payment consumes **full face value** from the ESA immediately
- Bank must prefund or actively manage ESA throughout the day
- RITS provides intraday repo (collateral against RBA) to manage peaks

---

## Gridlock Resolution

In RTGS systems, gridlock can occur when multiple banks are simultaneously waiting for inbound funds before they can settle outbound payments — a circular dependency.

RITS uses **SWIFT's LSM (Liquidity Saving Mechanism)**:
1. Payments queue in RITS
2. LSM runs bilateral and multilateral offset algorithms
3. Circular dependencies are detected and resolved by simulating simultaneous settlement
4. Only residual net positions require actual liquidity

---

## Clearing vs Settlement Summary

| Stage | Clearing | Settlement |
|-------|----------|-----------|
| When | During payment processing | End of cycle (DNS) or immediately (RTGS) |
| What happens | Obligations calculated and netted | Central bank money transfers between ESAs |
| Who does it | Clearing houses (AusPayNet, NPPA, BPAY) | RBA (RITS/FSS) |
| Reversibility | Positions can still change | Final and irrevocable |
| Risk | Systemic (DNS only) | Eliminated at settlement |

---

## Clearing Cut-Off Times (BECS — Indicative)

| Window | Submission Deadline | Settlement Time |
|--------|--------------------|-----------------| 
| Morning | Prior evening/night file | 8:30 AM |
| Afternoon | Mid-morning | 1:30 PM |
| Evening | Afternoon | 6:00 PM |

> Exact times set by AusPayNet and subject to change. Check current AusPayNet BECS Procedures.

---

## Engineering Notes

```java
// Conceptual: calculating net position per bank pair
Map<String, BigDecimal> netPositions = payments.stream()
    .collect(Collectors.groupingBy(
        p -> p.getSenderBic() + "_" + p.getReceiverBic(),
        Collectors.reducing(BigDecimal.ZERO, Payment::getAmount, BigDecimal::add)
    ));

// Net: A→B $1M, B→A $600K → one net settlement of A paying B $400K
```

- Store clearing obligations in an **immutable ledger** — never modify posted obligations
- Track clearing cycle state machine: `SUBMITTED → NETTED → SETTLED`
- Implement idempotent settlement status updates (network retries)
- Publish clearing position events for real-time monitoring

---

## Interview Questions

**Q: What is the main systemic risk of DNS and how is it mitigated?**
> If a participant fails before settlement, all obligations of that participant must be unwound, potentially cascading to other participants. Mitigated via: loss-sharing agreements, default funds, collateral requirements, position limits, and central bank liquidity backstops.

**Q: Why don't all payments use RTGS if it has lower settlement risk?**
> RTGS requires full liquidity for every payment immediately, which is expensive. DNS is far more liquidity-efficient (only net positions need funding). Most retail-volume, lower-value payments use DNS because the systemic risk is managed through scheme rules rather than eliminated through immediate settlement.

:::info[Key Insight]
NPP is unique in being both a **real-time customer experience** (instant credit) AND **RTGS settlement** (via RBA FSS). Most other real-time payment systems globally use DNS with deferred settlement — NPP's architecture eliminates the gap.
:::

---

## Related Concepts

- [Settlement](./settlement)
- [NPP](./npp)
- [BECS](./becs)
- [RTGS](./rtgs)
- [Liquidity Management](./liquidity)
- [On-Us Transactions](./onus)
- [Off-Us Transactions](./offus)
