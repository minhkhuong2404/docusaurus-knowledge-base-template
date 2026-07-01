---
id: rtgs
title: RTGS — Real-Time Gross Settlement
sidebar_label: RTGS / HVCS / RITS
sidebar_position: 12
description: Complete guide to Real-Time Gross Settlement (RTGS) in Australia — RITS, HVCS, ESA management, liquidity, gridlock resolution, and high-value payment engineering.
tags: [banking, rtgs, hvcs, rits, rba, settlement, high-value, liquidity]
---

# ⚡ RTGS — Real-Time Gross Settlement

**Real-Time Gross Settlement (RTGS)** is a payment settlement mechanism where each payment instruction is settled individually and immediately in **central bank money**, without netting against other payments.

> RTGS = one payment → one settlement → irrevocable. No waiting. No netting.

---

## RTGS vs DNS

| Attribute | RTGS | DNS (Deferred Net Settlement) |
|-----------|------|-------------------------------|
| **Settlement timing** | Immediate, payment-by-payment | End-of-cycle, batched |
| **Settlement finality** | Instantaneous and irrevocable | Final only at settlement window |
| **Liquidity requirement** | Full face value per payment | Only net position at day-end |
| **Systemic risk** | Very low | Higher (unwind risk) |
| **Typical use** | High-value, time-critical | Bulk, low-value |
| **Examples (AU)** | RITS, NPP/FSS | BECS, BPAY |

---

## Australian RTGS Infrastructure

### RITS — Reserve Bank Information and Transfer System

RITS is the RBA's core high-value settlement system for Australia:

| Attribute | Detail |
|-----------|--------|
| Operator | Reserve Bank of Australia (RBA) |
| Currency | AUD only |
| Participants | ADIs with ESA accounts at RBA |
| Operating hours | 7:30 AM – 8:30 PM AEST (business days) |
| Payment minimum | No formal minimum; convention is high-value (>$10K–$250K+) |
| Access method | SWIFT connectivity to RBA |
| Settlement mechanism | RTGS with LSM (Liquidity Saving Mechanism) |
| Messages | SWIFT MT202 / ISO 20022 pacs.009 |

### NPP Fast Settlement Service (FSS)

The FSS is RITS's extension for NPP payments:

| Attribute | Detail |
|-----------|--------|
| Purpose | RTGS settlement of individual NPP payments |
| Operating hours | 24/7/365 |
| Latency | Sub-second (ESA debit/credit within ~1 second) |
| Currency | AUD only |
| Volume | Every individual NPP payment settles here |

### HVCS — High Value Clearing System

The HVCS is the clearing layer above RITS:

| Attribute | Detail |
|-----------|--------|
| Purpose | Clearing of high-value, time-critical domestic payments |
| Format | SWIFT MT messages (migrating to ISO 20022) |
| Settlement | Immediate RTGS via RITS |
| Cut-off time | 8:00 PM AEST (for same-day settlement) |

---

## Payment Flow Through RITS

```
Corporate customer submits high-value AUD payment

Debtor Bank
  │ Validates payment, sanctions, fraud, balance
  │
  ▼ Sends SWIFT MT202 (or pacs.009) to RBA RITS
RBA RITS
  │
  ├── Check debtor bank's ESA balance sufficient?
  │     YES → proceed
  │     NO → payment queues (see queuing below)
  │
  ├── Debit debtor bank's ESA
  ├── Credit creditor bank's ESA
  │
  ▼ Settlement confirmed (irrevocable)
  │
  ▼ RBA sends MT910 / pacs.002 confirmation to debtor bank
  │
Creditor Bank
  │ Receives MT910 / pacs.002 → posts credit to customer account
  ▼
Creditor Customer notified
```

---

## ESA Management in RTGS

Since every payment consumes the full face value from the ESA immediately, banks must actively manage their ESA balance throughout the day.

### Intraday Liquidity Sources

| Source | Mechanism | Cost |
|--------|-----------|------|
| **Standing ESA balance** | Pre-funded from interbank lending or customer deposits | Opportunity cost |
| **Intraday repo** | Borrow against eligible collateral (government bonds) from RBA | Collateral; rate ~0% (intraday) |
| **Reverse repo** | Park excess cash at RBA | Earns near cash rate |
| **Interbank market** | Borrow from other banks (overnight cash market) | BBSW + spread |
| **Incoming payments** | Recycling: inbound ESA credits fund outbound |  Free (timing-dependent) |

### Collateral for RBA Intraday Repo

| Eligible | Examples |
|---------|---------|
| ✅ Eligible | Commonwealth Government Securities (CGS), Semi-government bonds, ADI-issued securities with RBA-approved ratings |
| ❌ Not eligible | Equities, corporate bonds below investment grade, unrated securities |

---

## Payment Queuing in RITS

When a bank's ESA has insufficient balance to settle a payment immediately, RITS **queues** the payment rather than rejecting it.

### Queue Priority

Payments are queued with two priority levels:

| Priority | Description |
|---------|-------------|
| **Priority** | Time-critical payments — settled first when liquidity available |
| **Normal** | Standard payments — settled in arrival order within priority group |

### LSM — Liquidity Saving Mechanism

RITS runs a sophisticated **Liquidity Saving Mechanism** to resolve gridlock:

```
Bank A wants to pay Bank B $10M — ESA insufficient, queues
Bank B wants to pay Bank A $8M — ESA insufficient, queues
Bank C wants to pay Bank A $3M — ESA sufficient, settles

LSM detects: A→B and B→A can partially offset
LSM simulation: settle A→B and B→A simultaneously, net $2M needed
If net liquidity available: ALL THREE settle simultaneously
```

**LSM runs continuously**, checking queued payments for bilateral and multilateral offset opportunities every few seconds.

### Types of LSM

| Type | Description |
|------|-------------|
| **Bilateral offset** | A owes B $10M, B owes A $8M → net $2M settles both |
| **Multilateral offset** | Circular: A→B, B→C, C→A → all can offset |
| **FIFO bypass** | A high-priority payment jumps queue if it doesn't delay others |

---

## HVCS Cut-Off Times

| Payment Type | Cut-Off (AEST) | Notes |
|-------------|---------------|-------|
| Standard HVCS | 8:00 PM | Same-day value |
| Priority HVCS | 8:00 PM | Settles before normal queue |
| RBA internal | 8:30 PM | ESA-to-ESA (government payments) |

Payments submitted after cut-off are held for next business day.

---

## RTGS in Cross-Border Context

International high-value payments ultimately settle through domestic RTGS systems:

| Currency | Domestic RTGS |
|---------|--------------|
| AUD | RITS (Australia) |
| USD | Fedwire (Federal Reserve) |
| EUR | TARGET2 (European Central Bank) |
| GBP | CHAPS (Bank of England) |
| JPY | BOJ-NET (Bank of Japan) |

A SWIFT MT103 from Australia to the US:
1. AU bank debits Nostro at US correspondent (settled in Fedwire)
2. US correspondent pays US receiving bank (via Fedwire or CHIPS)
3. Not settled in RITS — RITS only settles AUD

---

## Engineering Notes

### Monitoring RTGS Liquidity

```java
// Real-time ESA balance monitoring
@Scheduled(fixedDelay = 5000) // every 5 seconds
public void monitorEsaBalance() {
    BigDecimal currentBalance = rbaRitsGateway.getEsaBalance();
    BigDecimal queuedObligations = ritsQueueService.getQueuedTotal();
    BigDecimal projectedBalance = currentBalance.subtract(queuedObligations);

    if (projectedBalance.compareTo(MINIMUM_BUFFER) < 0) {
        // Alert treasury desk — may need intraday repo
        alertService.sendLowEsaAlert(projectedBalance, MINIMUM_BUFFER);
    }
}
```

### Priority Payment Submission

```java
// Mark a payment as priority for RITS queue
public PaymentInstruction buildRtgsInstruction(Payment payment, boolean isPriority) {
    return PaymentInstruction.builder()
        .messageType("pacs.009")
        .settlementPriority(isPriority
            ? SettlementPriority.HIGH
            : SettlementPriority.NORMAL)
        .interBankSettlementDate(LocalDate.now())
        .instructedAmount(payment.getAmount())
        .build();
}
```

### Settlement Confirmation Handling

```java
// Handle RITS settlement confirmation (MT910 / pacs.002)
@MessageHandler
public void onSettlementConfirmed(SettlementConfirmation confirmation) {
    String txId = confirmation.getOriginalTransactionId();

    // Mark as settled — FINAL
    paymentRepository.updateStatus(txId, PaymentStatus.SETTLED);
    paymentRepository.setSettlementTimestamp(txId, confirmation.getSettledAt());

    // Publish domain event
    eventBus.publish(new PaymentSettled(txId, confirmation.getSettledAt()));

    // Trigger customer notification
    notificationService.sendCreditAdvice(txId);
}
```

---

## Interview Questions

**Q: Why would a bank choose RTGS over DNS for a payment?**
> RTGS is used for high-value, time-critical, or risk-sensitive payments where:
> 1. Same-day settlement finality is required (large corporate, property settlement)
> 2. The counterparty requires payment certainty before releasing goods/services
> 3. Systemic risk from DNS unwind is unacceptable (large amounts)
> 4. Regulatory requirement (e.g. some securities transactions)

**Q: What happens when an RTGS payment fails to settle due to insufficient ESA balance?**
> RITS queues the payment (not rejects it). The bank can resolve this by: (a) intraday repo with RBA against eligible collateral, (b) receiving incoming payments first (recycling), (c) LSM offset if a counterparty also has a queued payment, (d) interbank lending. If still unresolved at close of business, RBA may extend operating hours or apply emergency liquidity assistance.

:::info[Key Insight]
NPP uses RTGS (via FSS) for every single payment — even $1 transfers. This is architecturally unusual: most retail-volume payment systems globally use DNS. Australia's NPP decision to use RTGS for all NPP payments was deliberate — it eliminates settlement risk entirely from the retail payment system.
:::

---

## Related Concepts

- [Settlement](./settlement)
- [Clearing](./clearing)
- [Liquidity Management](./liquidity)
- [NPP](./npp)
- [BECS](./becs)
- [SWIFT](./swift)
