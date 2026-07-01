---
id: correspondent_banking
title: Correspondent Banking
sidebar_label: Correspondent Banking
sidebar_position: 14
description: How correspondent banking works — Nostro/Vostro/Loro accounts, routing chains, SWIFT messaging, de-risking, and the role of correspondents in cross-border payments.
tags: [banking, correspondent-banking, nostro, vostro, swift, cross-border, clearing]
---

# 🌍 Correspondent Banking

Correspondent banking is the arrangement by which one bank (**the correspondent**) provides payment and other services to another bank (**the respondent**) — typically to enable cross-border payments in currencies or markets where the respondent bank doesn't have a direct presence.

---

## Why Correspondent Banking Exists

Banks cannot maintain direct accounts at every bank in every country. Instead, they maintain accounts at a **network of correspondent banks** in key financial centres and currencies. This network allows a payment to travel from any bank to any other bank globally, even without a direct relationship.

```
Small AU regional bank → ANZ (correspondent) → JP Morgan NY (correspondent) → Small US bank
```

---

## Nostro / Vostro / Loro Accounts

| Term | Perspective | Definition | Example |
|------|-------------|------------|---------|
| **Nostro** | Our bank | "Our account at their bank" — account we hold with our correspondent | AU Bank's USD account at JP Morgan NY |
| **Vostro** | Their bank | "Their account at our bank" — account our correspondent holds with us | JP Morgan NY's AUD account at AU Bank |
| **Loro** | A third bank | "Their (a third bank's) account" — used when describing a third party | "Correspondent's account at JP Morgan" |

### Funding the Nostro

To send USD payments, AU Bank must prefund its USD Nostro at a US correspondent:

```
AU Bank transfers AUD → sells AUD/buys USD (FX desk) → funds USD Nostro at JP Morgan NY
```

Or receives USD inflows from other banks which credit the Nostro.

---

## Correspondent Routing Chain

### Simple Chain (1 correspondent)

```
Customer (AU) submits AUD → USD payment to US bank

AU Debtor Bank
  │ Holds USD Nostro at ANZ (NY branch)
  │ MT103 → ANZ NY
  ▼
ANZ New York Branch
  │ Holds USD Nostro at Bank of New York (BONY)
  │ MT103 → BONY
  ▼
Bank of New York (Mellon)
  │ Maintains direct relationships with most US banks
  │ Routes to creditor bank
  ▼
US Creditor Bank
  │ Credits customer account
  ▼
US Customer receives funds
```

### Complex Chain (multi-hop)

```
Payment: AU → Brazil (BRL)

AU Bank → HSBC (AU) [USD Nostro] → Citibank NY [USD] → Banco Bradesco (Brazil) → Customer BRL account
```

Each intermediary takes a **correspondent fee** and applies its own compliance checks.

---

## Key Correspondent Banking Messages

| Message | Direction | Purpose |
|---------|-----------|---------|
| **MT103** | Debtor bank → each bank in chain | Customer credit transfer instruction |
| **MT202 COV** | Debtor bank → correspondent | Cover payment (funds movement) |
| **MT910** | Receiving bank → sending bank | Confirmation of credit |
| **MT940** | Correspondent → account holder | Nostro account statement |
| **MT950** | Correspondent → account holder | Statement (simplified) |
| **pacs.008** | ISO 20022 equivalent of MT103 | FI-to-FI customer credit transfer |
| **pacs.009** | ISO 20022 equivalent of MT202 | FI-to-FI financial transfer |

---

## Correspondent Banking and SWIFT gpi

Before SWIFT gpi, cross-border payments were opaque:
- No visibility into which correspondent currently held the funds
- No tracking of deductions (fees taken by each hop)
- No SLA for delivery

With **SWIFT gpi**:
- UETR (UUID4) tracks the payment end-to-end
- Each bank in the chain updates the gpi Tracker
- Fee deductions at each hop are visible
- 95%+ of gpi payments credited within 24 hours (most sub-1 hour)
- Banks must pass on the full amount or declare deductions explicitly

---

## De-risking — The Correspondent Banking Problem

**De-risking** refers to correspondent banks terminating relationships with respondent banks they consider too risky — typically smaller banks, banks in high-risk jurisdictions, or banks with weak AML/compliance controls.

### Why De-risking Happens

| Reason | Detail |
|--------|--------|
| **Regulatory risk** | Fear of fines for inadvertent AML/sanctions violations |
| **Low profitability** | Small correspondent relationships not worth the compliance overhead |
| **Reputational risk** | Correspondent implicated in scandal via respondent |
| **FATF grey/black lists** | Countries on FATF lists often lose correspondent access |

### Consequences

- Banks in Pacific Islands, Caribbean, some African nations losing USD access
- Remittance corridors closing (expensive for migrant workers)
- Financial exclusion for whole regions
- Forces banks to use intermediaries at higher cost

### Wolfsberg Group Guidance

The Wolfsberg Group (major correspondent banks) provides guidelines for **CDD (Customer Due Diligence)** on respondent banks:

- Annual correspondent due diligence questionnaire
- Assessment of AML/sanctions program quality
- Ownership and management review
- Jurisdictional risk assessment

---

## Nostro Reconciliation

A Nostro account must be reconciled daily — the bank's **internal expectation** vs the **correspondent's statement**:

```
Internal Ledger:                    Nostro Statement (MT940/camt.053):
  USD Credits: $15,234,500     vs   Credits: $15,234,000
  USD Debits:  $12,000,000     vs   Debits:  $12,000,000
  Expected Close: $3,234,500        Actual Close: $3,234,000
  BREAK: $500
```

Common break causes:
- **Fee deductions**: Correspondent deducted fees not in internal ledger
- **Timing differences**: Payment credited next day vs expected same day
- **Rejected payment**: Returned by beneficiary bank, not yet notified
- **FX conversion**: Rate applied differed from expected

---

## Engineering Notes

```java
// Nostro position monitoring
@Service
public class NostroReconciliationService {

    public ReconciliationResult reconcileNostro(Currency currency, LocalDate date) {
        // Internal ledger expected position
        MonetaryAmount expected = nostroLedgerService
            .getClosingBalance(currency, date);

        // Correspondent statement (received via MT940/camt.053)
        MonetaryAmount actual = correspondentStatementService
            .getClosingBalance(currency, date);

        MonetaryAmount break_ = expected.subtract(actual);

        if (break_.isZero()) {
            return ReconciliationResult.reconciled(currency, date);
        }

        // Classify the break
        List<BreakItem> breakItems = breakAnalysisService
            .analyseBreak(currency, date, break_);

        return ReconciliationResult.broken(currency, date, break_, breakItems);
    }
}

// Model a correspondent relationship
@Entity
public class CorrespondentRelationship {
    private String correspondentBic;
    private String correspondentName;
    private Currency currency;
    private String nostroAccount;
    private BigDecimal minimumBalance;    // trigger for top-up
    private BigDecimal targetBalance;     // optimal operating balance
    private LocalDate ddqExpiryDate;      // due diligence questionnaire expiry
    private RelationshipStatus status;    // ACTIVE, SUSPENDED, TERMINATED
}
```

---

## Correspondent Banking vs Direct Clearing

| | Correspondent Banking | Direct Clearing |
|---|---|---|
| Account type | Bilateral Nostro/Vostro | Central bank ESA |
| Settlement | Commercial bank money | Central bank money |
| Risk | Counterparty risk on correspondent | Near-zero (central bank) |
| Scope | Cross-border, any currency | Domestic, scheme currency |
| Visibility | Improving (gpi) | High (RTGS confirmation) |
| Cost | Per-hop fees + FX | Scheme fees only |

---

## Interview Questions

**Q: What is the difference between Nostro and Vostro?**
> Nostro ("our" in Italian) = an account we hold at another bank in their country/currency (e.g. our USD account at JP Morgan NY). Vostro ("your") = an account another bank holds at us (e.g. JP Morgan's AUD account at our bank). The same account is simultaneously a Nostro from our perspective and a Vostro from the correspondent's perspective.

**Q: Why might a bank lose its correspondent banking relationship and what are the consequences?**
> Banks are de-risked when correspondents determine the compliance cost of maintaining the relationship outweighs the revenue, or when the respondent is in a high-risk jurisdiction. Consequences: loss of USD clearing access, inability to process international remittances, increased cost if alternative correspondents are found, and potential for customers to be unable to receive/send international payments entirely.

:::warning[Anti-Money Laundering]
Correspondent banking is a major vector for money laundering — funds from criminal activity can be layered through multiple jurisdictions via nested correspondent chains. This is why correspondent bank due diligence (DDQ) and ongoing monitoring of payment flows through each correspondent relationship is a regulatory requirement for all ADIs.
:::

---

## Related Concepts

- [SWIFT](./swift)
- [Settlement](./settlement)
- [Clearing](./clearing)
- [FX in Payments](./fx)
- [AML, CTF & KYC](./aml_kyc)
- [Sanctions Screening](./sanction)
