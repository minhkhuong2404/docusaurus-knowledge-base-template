---
id: regulatory_reporting
title: Regulatory Reporting in Banking
sidebar_label: Regulatory Reporting
sidebar_position: 16
description: Guide to regulatory reporting obligations for Australian banks — AUSTRAC TTR/IFTI/SMR, APRA reporting, RBA reporting, ASIC obligations, and engineering automation patterns.
tags: [banking, regulatory, austrac, apra, ttr, ifti, smr, compliance, reporting]
---

# 📊 Regulatory Reporting in Banking

Australian banks and payment service providers have extensive regulatory reporting obligations — mandatory disclosures to government agencies covering large cash transactions, cross-border transfers, suspicious activity, prudential metrics, and market conduct.

---

## Australian Regulatory Bodies

| Body | Role | Key Reporting |
|------|------|--------------|
| **AUSTRAC** | AML/CTF regulator | TTR, IFTI, SMR |
| **APRA** | Prudential regulator | Capital, liquidity, operational risk |
| **RBA** | Central bank | ESA, payment statistics |
| **ASIC** | Market conduct | Financial services obligations |
| **OAIC** | Privacy regulator | Notifiable data breaches |
| **ATO** | Tax authority | TBAR (superannuation), TFN withholding |

---

## AUSTRAC Reporting

AUSTRAC (Australian Transaction Reports and Analysis Centre) is the primary financial intelligence body for AML/CTF compliance.

### 1. Threshold Transaction Reports (TTR)

**Definition:** Any physical currency transaction of **AUD 10,000 or more** (or foreign equivalent).

| Attribute | Detail |
|-----------|--------|
| Trigger | Cash deposit, withdrawal, or currency exchange ≥ AUD 10,000 |
| Who reports | All ADIs, casinos, bullion dealers, money remitters |
| Timeframe | Must be reported **within 10 business days** of transaction |
| Format | AUSTRAC TTR form / API |
| Joint transactions | Multiple cash transactions totalling ≥ $10K in one day count |
| Structuring | Multiple sub-$10K transactions to avoid TTR = criminal offence |

**Engineering alert — Structuring Detection:**

```java
// Detect potential structuring (multiple cash transactions below $10K)
public void checkForStructuring(String customerId, LocalDate date) {
    List<Transaction> cashTxns = transactionRepository
        .findCashTransactionsByCustomerAndDate(customerId, date);

    BigDecimal dailyTotal = cashTxns.stream()
        .map(Transaction::getAmount)
        .reduce(BigDecimal.ZERO, BigDecimal::add);

    if (dailyTotal.compareTo(STRUCTURING_THRESHOLD) >= 0) {
        // Flag for AML review — potential structuring
        amlAlertService.raiseStructuringAlert(customerId, date, dailyTotal, cashTxns);
    }
}
```

### 2. International Funds Transfer Instructions (IFTI)

**Definition:** Report on **all** international funds transfers — inbound and outbound.

| Attribute | Detail |
|-----------|--------|
| Trigger | Any SWIFT/cross-border transfer regardless of amount |
| Who reports | All ADIs, remittance service providers |
| Timeframe | **Within 10 business days** |
| Includes | Sender, receiver, amount, currency, routing details |
| Direction | Both inbound AND outbound |

**Key difference from TTR:** IFTI applies to ALL amounts, not just ≥ $10,000.

```java
// Trigger IFTI report for every international transfer
@EventListener
public void onInternationalTransfer(InternationalTransferEvent event) {
    IFTIReport report = IFTIReport.builder()
        .reportDate(LocalDate.now())
        .transferDate(event.getValueDate())
        .senderName(event.getSenderName())
        .senderCountry(event.getSenderCountry())
        .receiverName(event.getReceiverName())
        .receiverCountry(event.getReceiverCountry())
        .amount(event.getAmount())
        .currency(event.getCurrency())
        .amlClearance(event.getAmlStatus())
        .swiftReference(event.getUetr())
        .build();

    austracReportingService.submitIFTI(report);
}
```

### 3. Suspicious Matter Reports (SMR)

**Definition:** Report on any transaction or customer activity that gives grounds to **suspect** money laundering, terrorism financing, or proceeds of crime — regardless of amount.

| Attribute | Detail |
|-----------|--------|
| Trigger | Reasonable grounds to suspect ML/TF activity |
| Amount threshold | **None** — even a $5 transaction can trigger an SMR |
| Who reports | Reporting entities under AML/CTF Act |
| Timeframe | **Within 24 hours** if terrorism financing; 3 business days otherwise |
| Tipping off | It is a **criminal offence** to tell the customer an SMR was filed |
| AML investigation | Bank must investigate before filing |

**Tipping-Off Rule:**

```java
// NEVER reveal to a customer that an SMR has been/will be filed
// This is a criminal offence under the AML/CTF Act 2006

public PaymentResult holdForSmrReview(String customerId, String paymentId) {
    // Hold payment for review
    paymentService.hold(paymentId, HoldReason.AML_REVIEW);

    // Do NOT tell the customer the real reason
    // Use a generic message
    notificationService.send(customerId,
        "Your payment is temporarily held pending verification. " +
        "Please contact us if you have questions.");

    // Internally flag for AML team
    amlCaseService.create(customerId, paymentId, CaseType.SMR_ASSESSMENT);

    return PaymentResult.held(paymentId);
}
```

---

## APRA Prudential Reporting

APRA requires banks to submit regular prudential data:

### Key APRA Returns

| Return | Frequency | Content |
|--------|-----------|---------|
| **ARF 110** (LCR) | Monthly | Liquidity Coverage Ratio |
| **ARF 115** (NSFR) | Quarterly | Net Stable Funding Ratio |
| **ARF 120** (Capital) | Quarterly | Capital adequacy (Basel III) |
| **ARF 180** (Capital — detailed) | Quarterly | Risk-weighted assets breakdown |
| **ARF 701** (Deposits) | Monthly | Deposit composition and stability |
| **ARF 702** (Credit) | Quarterly | Loan portfolio quality |
| **ARF 725** (Operational Risk) | Annual | Operational risk incidents and losses |
| **PAIRS/SOARS** | Ongoing | APRA's risk assessment system |

### LCR Reporting (ARF 110)

```
LCR = HQLA / Net Cash Outflows (30-day stress) ≥ 100%

Daily monitoring:
  - HQLA portfolio marked to market
  - Inflow/outflow scenarios modelled
  - LCR ratio calculated and stored
  - Alert if ratio < 110% (10% buffer above requirement)
```

---

## RBA Reporting

Banks submit payment statistics to the RBA:

| Report | Content |
|--------|---------|
| **Payment System Board Statistics** | Monthly transaction volumes and values by channel |
| **NPP Payment Statistics** | NPP/Osko transaction counts and values |
| **BECS Statistics** | Direct Entry volumes |
| **ESA Balance** | Daily ESA balance reporting |
| **Intraday Liquidity** | Real-time ESA monitoring (via RITS) |

---

## Data Breach Reporting (OAIC)

Under the Notifiable Data Breaches (NDB) scheme:

| Attribute | Detail |
|-----------|--------|
| Trigger | Breach likely to cause serious harm |
| Timeframe | Notify OAIC and affected individuals **as soon as practicable** (generally within 30 days of discovery) |
| Scope | Customer financial data, identity data |

---

## Automated Regulatory Reporting Architecture

```
Payment Events
      │
      ▼
Event Stream (Kafka)
      │
      ├──► TTR Engine ──► AUSTRAC API
      │     (cash ≥ $10K)
      │
      ├──► IFTI Engine ──► AUSTRAC API
      │     (all cross-border)
      │
      ├──► Transaction Monitoring ──► SMR Queue ──► AML Analyst ──► AUSTRAC
      │     (suspicious patterns)
      │
      ├──► Prudential Calculator ──► APRA Portal
      │     (LCR, NSFR, Capital)
      │
      └──► Payment Statistics ──► RBA
            (volume, value by channel)
```

### Reporting Data Store

```java
@Entity
public class RegulatoryReport {
    private String reportId;
    private ReportType type;             // TTR, IFTI, SMR, LCR, NSFR
    private RegulatoryBody submittedTo;  // AUSTRAC, APRA, RBA
    private LocalDateTime submittedAt;
    private ReportStatus status;         // DRAFT, SUBMITTED, ACCEPTED, REJECTED
    private String referenceNumber;      // Regulator-assigned reference
    private String payloadHash;          // SHA256 of submitted payload
    private String payload;              // Encrypted report payload
}
```

---

## Penalties for Non-Compliance

| Regulator | Maximum Penalty |
|-----------|----------------|
| AUSTRAC | $222 million+ per breach (Westpac: AUD 1.3 billion settlement 2020) |
| APRA | ADI licence revocation; public requirements |
| ASIC | AUD 9.45 million per contravention (corporate) |
| OAIC | AUD 50 million+ for serious / repeated breaches |

---

## Interview Questions

**Q: What is the difference between a TTR and an SMR?**
> TTR (Threshold Transaction Report) = mandatory, automatic report on any cash transaction ≥ AUD 10,000. No suspicion required — it's purely threshold-based. SMR (Suspicious Matter Report) = discretionary, judgment-based report filed when staff have reasonable grounds to suspect ML/TF activity — regardless of amount. A $50 transaction can trigger an SMR; a $20M transaction may never trigger one if it's clearly legitimate.

**Q: Why is tipping off illegal in AML reporting?**
> If a bank warned a customer that an SMR was being filed, the customer (if a money launderer) would immediately move funds, destroy evidence, or change behaviour — undermining the entire financial intelligence gathering purpose. The AML/CTF Act 2006 makes tipping off a criminal offence (up to 2 years imprisonment) to protect the integrity of AUSTRAC's financial intelligence.

:::danger[High Stakes]
AUSTRAC enforcement is one of the most significant financial risks for Australian banks. Westpac's AUD 1.3 billion penalty (2020) and Commonwealth Bank's AUD 700 million penalty (2018) demonstrate that systemic failures in IFTI/SMR reporting attract the largest fines in Australian corporate history.
:::

---

## Related Concepts

- [AML, CTF & KYC](./aml_kyc)
- [Sanctions Screening](./sanction)
- [Fraud Detection & Prevention](./fraud)
- [Liquidity Management](./liquidity)
- [Core Banking System](./core_banking)
