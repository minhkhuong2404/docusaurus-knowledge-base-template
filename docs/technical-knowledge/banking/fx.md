---
id: fx
title: Foreign Exchange (FX) in Payments
sidebar_label: FX in Payments
sidebar_position: 2
description: Overview of Foreign Exchange (FX) in Payments.
tags: [banking, fx, foreign, exchange, in, payments]
---

# Foreign Exchange (FX) in Payments

## Overview

**Foreign Exchange (FX)** in the context of payments refers to the **conversion of one currency to another** when a payment is made across different currency zones. FX is involved whenever the debtor and creditor accounts are in different currencies — domestically (e.g., AUD account → USD account) or internationally.

---

## When FX is Required

| Scenario | FX Required? | Notes |
|----------|-------------|-------|
| AUD → AUD (domestic) | ❌ No | Same currency, no conversion |
| AUD account → USD account (same bank, on-us) | ✅ Yes | Intra-bank FX conversion |
| AUD → USD via SWIFT | ✅ Yes | Cross-currency international payment |
| EUR → AUD (inbound SWIFT) | ✅ Yes | Conversion before credit to AUD account |
| AUD account → AUD account via SWIFT | ❌ No | Same currency, different bank |

---

## FX in ISO 20022 Messages

### pain.001 — Instructed Amount vs Settlement Amount
```xml
<!-- Customer instructs AUD 10,000 to be paid -->
<InstdAmt Ccy="AUD">10000.00</InstdAmt>

<!-- Bank converts to USD for settlement -->
<IntrBkSttlmAmt Ccy="USD">6500.00</IntrBkSttlmAmt>

<!-- Exchange rate applied -->
<XchgRate>0.6500</XchgRate>
```

### pacs.008 — FX Fields
```xml
<CdtTrfTxInf>
    <!-- Settlement amount (in settlement currency) -->
    <IntrBkSttlmAmt Ccy="USD">6500.00</IntrBkSttlmAmt>
    
    <!-- Original instructed amount (in original currency) -->
    <InstdAmt Ccy="AUD">10000.00</InstdAmt>
    
    <!-- Exchange rate information -->
    <XchgRateInf>
        <XchgRate>0.65000</XchgRate>        <!-- AUD/USD rate -->
        <RateTp>AGRD</RateTp>               <!-- Rate type: Agreed -->
        <CtrctId>FX-20240615-001</CtrctId>  <!-- FX deal reference -->
    </XchgRateInf>
    
    <!-- Charge Bearer (important for FX) -->
    <ChrgBr>SHAR</ChrgBr>
</CdtTrfTxInf>
```

---

## FX Rate Types

| Code | Name | Description |
|------|------|-------------|
| `SPOT` | Spot Rate | Current market rate (settlement T+2) |
| `SALE` | Sale Rate | Retail rate charged by bank (includes margin) |
| `PURC` | Purchase Rate | Rate bank pays to purchase foreign currency |
| `AGRD` | Agreed Rate | Pre-agreed rate (from FX contract/forward) |
| `OVRN` | Overnight Rate | Overnight swap rate |

---

## FX in Outbound International Payments

```
Customer instructs:  Send AUD 10,000 to supplier in Germany (EUR account)

Step 1 — FX Conversion at Debtor Bank:
  Customer's AUD account debited:  AUD 10,000
  Bank buys EUR at spot rate:       0.6200 AUD/EUR
  EUR amount calculated:            EUR 6,200

Step 2 — pacs.008 sent to Creditor Bank:
  IntrBkSttlmAmt: EUR 6,200
  InstdAmt: AUD 10,000
  XchgRate: 0.6200

Step 3 — Settlement:
  Via SWIFT correspondent with EUR account
  EUR 6,200 delivered to German bank

Step 4 — Credit to Creditor:
  EUR 6,200 credited to supplier's EUR account
```

---

## FX in Inbound International Payments

```
Overseas sender sends USD 5,000 to Australian recipient (AUD account)

Step 1 — Received by Australian bank:
  IntrBkSttlmAmt: USD 5,000

Step 2 — Creditor account is AUD:
  Bank converts USD → AUD at current rate
  USD/AUD rate: 1.5400
  AUD credited: AUD 7,700

Step 3 — camt.054 to customer:
  Original amount: USD 5,000
  Credited amount: AUD 7,700
  Exchange rate: 1.5400
```

---

## FX Rate Components

Banks earn revenue on FX through:

```
Mid-market rate (interbank):      1 AUD = 0.6500 USD
                                            │
                 Bank margin:              + 0.0050 (spread)
                                            │
Customer buy rate (selling AUD):  1 AUD = 0.6450 USD  ← customer gets less
Customer sell rate (buying AUD):  1 AUD = 0.6550 USD  ← customer pays more
```

### Transaction Fee vs Spread
- **Spread** — Built into exchange rate (hidden cost)
- **Transaction fee** — Explicit fee per transaction (e.g., $15 per SWIFT payment)
- **Correspondent charges** — Fees deducted by intermediary banks (per `ChrgBr`)

---

## Charge Bearer (`ChrgBr`) and FX Impact

| `ChrgBr` | Who pays what | Impact on credited amount |
|---------|--------------|--------------------------|
| `DEBT` | All fees paid by sender | Creditor receives full converted amount |
| `CRED` | All fees paid by receiver | Correspondent fees deducted from credited amount |
| `SHAR` | Each pays own bank | Sending bank fee on sender; receiving bank fee on receiver |
| `SLEV` | Per service level | Defined in agreement |

---

## FX Hedging and Forward Contracts

Corporate customers often hedge FX risk:

```
Company A needs to pay EUR 100,000 in 3 months:

TODAY:
  Book FX forward contract at rate 0.6200 AUD/EUR
  Lock in: need to deliver AUD 161,290 to get EUR 100,000

IN 3 MONTHS:
  Regardless of spot rate (0.5900 or 0.6500),
  execute at agreed rate 0.6200
  CtrctId referenced in pacs.008 XchgRateInf
```

---

## Multi-Currency Accounts

Banks may offer **multi-currency accounts** allowing customers to hold balances in multiple currencies:

```
Customer Account:
├── AUD wallet: $10,000
├── USD wallet: $5,000
└── EUR wallet: €3,000

Outbound USD payment:
  → Debit USD wallet directly (no FX needed)
  
Outbound GBP payment:
  → No GBP wallet → FX from AUD wallet → GBP settlement
```

---

## Regulatory FX Obligations

| Requirement | Description |
|-------------|-------------|
| **IFTI Reporting** | All international transfers (any amount) reported to AUSTRAC |
| **Best Execution** | Banks must obtain fair FX rates for customers |
| **Rate Disclosure** | Rate, fees, and total amount must be disclosed (ASIC) |
| **RBA FX reporting** | Large FX positions reported to RBA |

---

## Java Spring Notes

```java
@Service
public class FxConversionService {

    public FxConversionResult convert(
            BigDecimal amount, 
            Currency fromCurrency, 
            Currency toCurrency,
            FxRateType rateType) {
        
        if (fromCurrency.equals(toCurrency)) {
            return FxConversionResult.noConversion(amount, fromCurrency);
        }
        
        // Get rate from FX rate provider (Reuters, Bloomberg, internal)
        FxRate rate = fxRateProvider.getRate(
            fromCurrency, toCurrency, rateType);
        
        BigDecimal convertedAmount = amount
            .multiply(rate.getRate())
            .setScale(2, RoundingMode.HALF_UP);
        
        // Audit log the conversion
        fxAuditLog.record(FxAuditEntry.builder()
            .fromCurrency(fromCurrency)
            .toCurrency(toCurrency)
            .originalAmount(amount)
            .convertedAmount(convertedAmount)
            .rate(rate.getRate())
            .rateType(rateType)
            .rateTimestamp(rate.getTimestamp())
            .build());
        
        return FxConversionResult.builder()
            .originalAmount(amount)
            .originalCurrency(fromCurrency)
            .convertedAmount(convertedAmount)
            .convertedCurrency(toCurrency)
            .exchangeRate(rate.getRate())
            .build();
    }
}
```

---

## Related Concepts
- [swift.md](/technical-knowledge/banking/swift) — FX is most common on SWIFT cross-border payments
- [pacs008.md](/technical-knowledge/banking/pacs008) — FX fields in interbank message
- [inbound.md](/technical-knowledge/banking/inbound) — FX on inbound payments
- [outbound.md](/technical-knowledge/banking/outbound) — FX on outbound payments
- [fis.md](/technical-knowledge/banking/fis) — Nostro accounts per currency
