---
id: aml_kyc
title: "AML, CTF & KYC"
sidebar_label: "AML, CTF & KYC"
sidebar_position: 3
description: Overview of AML, CTF and KYC controls in banking.
tags: [banking, aml, ctf, kyc, compliance]
---

# AML, CTF & KYC

## Overview

**AML (Anti-Money Laundering)**, **CTF (Counter-Terrorism Financing)**, and **KYC (Know Your Customer)** are the core pillars of financial crime compliance. Together they form a bank's first line of defence against criminals using the financial system to launder money, fund terrorism, or commit financial crime.

| Pillar  | Purpose                                                                 |
| ------- | ----------------------------------------------------------------------- |
| **KYC** | Verify who your customers are before and during the relationship        |
| **AML** | Detect and report activity that may constitute money laundering         |
| **CTF** | Detect and report activity that may be funding terrorism                |
| **CDD** | Customer Due Diligence — the ongoing process combining KYC + monitoring |
| **EDD** | Enhanced Due Diligence — deeper checks for higher-risk customers        |

> **Key distinction:** KYC is about *knowing* your customer. AML/CTF is about *monitoring* what they do.

---

## Regulatory Framework

### Australia

| Legislation / Standard                                                       | Description                                                     |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **AML/CTF Act 2006**                                                         | Primary legislation administered by AUSTRAC                     |
| **AML/CTF Rules 2007** (as amended)                                          | Detailed operational requirements                               |
| **Anti-Money Laundering and Counter-Terrorism Financing Amendment Act 2024** | Tranche 2 expansion to lawyers, accountants, real estate agents |
| **FATF Recommendations** (40 Recommendations)                                | International AML/CTF standard — Australia is a FATF member     |
| **Basel Committee Guidance**                                                 | Sound management of risks related to money laundering           |
| **APRA Prudential Standards**                                                | APS 001 — prudential soundness includes financial crime risk    |

### Key Regulators

| Regulator      | Role                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| **AUSTRAC**    | Australian Transaction Reports and Analysis Centre — primary AML/CTF regulator and financial intelligence unit |
| **APRA**       | Prudential regulator — expects boards to govern financial crime risk                                           |
| **ASIC**       | Conduct regulator — financial services licensing incorporates AML/CTF obligations                              |
| **AFP / ACIC** | Law enforcement — investigate money laundering and terrorism financing                                         |

### International

| Body                                   | Role                                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------------------------ |
| **FATF (Financial Action Task Force)** | Sets the global AML/CTF standards; mutual evaluation of member countries                   |
| **FATF-Style Regional Bodies (FSRBs)** | e.g., Asia/Pacific Group (APG) — FATF's regional equivalent                                |
| **Egmont Group**                       | Network of 166 Financial Intelligence Units (FIUs) globally — enables intelligence sharing |
| **Wolfsberg Group**                    | Association of 13 major global banks; publishes AML guidance                               |

---

## Money Laundering — Deep Dive

### Definition

Money laundering is the process by which proceeds of crime are made to appear legitimate. The underlying predicate offence may be drug trafficking, fraud, corruption, tax evasion, human trafficking, cybercrime, or any other serious crime.

### The Three Stages

```
┌──────────────────────────────────────────────────────────────────────┐
│                    MONEY LAUNDERING LIFECYCLE                         │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  STAGE 1: PLACEMENT                                                  │
│  ──────────────────                                                  │
│  Dirty cash enters the financial system                              │
│                                                                      │
│  Methods:                                                            │
│  • Cash deposits (splitting to avoid reporting thresholds)           │
│  • Smurfing (using multiple people to deposit smaller amounts)       │
│  • Cash-intensive businesses (restaurants, carwashes, casinos)       │
│  • Gambling winnings                                                 │
│  • Trade-based laundering (over/under-invoice goods)                │
│                                                                      │
│  Bank's exposure: HIGHEST — cash enters the system here             │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  STAGE 2: LAYERING                                                   │
│  ────────────────                                                    │
│  Multiple transactions obscure the audit trail                       │
│                                                                      │
│  Methods:                                                            │
│  • Rapid wire transfers between multiple accounts/countries          │
│  • Shell company chains (Company A → B → C → D)                     │
│  • Cryptocurrency mixing                                             │
│  • Trade-based layering (false invoices across borders)             │
│  • Loan-back schemes (laundered money "loaned" to criminal)          │
│  • Foreign exchange conversions                                      │
│  • Real estate purchases and sales                                   │
│                                                                      │
│  Bank's exposure: HIGH — payment systems used to layer               │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  STAGE 3: INTEGRATION                                                │
│  ─────────────────────                                               │
│  Funds re-enter the legitimate economy                               │
│                                                                      │
│  Methods:                                                            │
│  • Luxury goods (watches, jewellery, art)                            │
│  • Real estate (buy property with laundered funds)                   │
│  • Business investment                                               │
│  • Stock market investment                                           │
│  • Professional fees (overpay lawyers/accountants)                   │
│                                                                      │
│  Bank's exposure: MODERATE — funds appear legitimate by this point   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Common Money Laundering Typologies

| Typology                          | Description                                                             | Red Flags                                                                             |
| --------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Structuring / Smurfing**        | Breaking large amounts into smaller deposits below reporting thresholds | Multiple sub-$10K cash deposits; multiple people depositing for same beneficiary      |
| **Shell Company Layering**        | Using multiple corporate entities to move funds                         | Payments to companies with no apparent business purpose; complex ownership structures |
| **Trade-Based Laundering**        | Over/under-invoicing on trade                                           | Invoice amounts inconsistent with market price; trade with unusual counterparties     |
| **Money Mule Networks**           | Using unwitting/recruited individuals to move funds                     | Young/new account receives large credit and immediately moves it on                   |
| **Professional Money Laundering** | Using lawyers, accountants, real estate agents                          | Third-party payments; commingled client funds                                         |
| **Casino / Gambling**             | Cash in, winnings withdrawn as "clean" money                            | Large casino transactions; immediate cash-out of winnings                             |
| **Real Estate**                   | Buying property with illicit funds                                      | All-cash purchases; rapid resale                                                      |
| **Cryptocurrency**                | Using crypto to obscure fund movement                                   | Large crypto exchange transactions                                                    |

---

## Terrorism Financing (CTF) — Unique Challenges

Terrorism financing is **fundamentally different** from money laundering in one key way:

```
MONEY LAUNDERING:       Large amounts of DIRTY money → Made to look CLEAN
TERRORISM FINANCING:    Small amounts of CLEAN money → Used for VIOLENT ends
```

### CTF Challenges

| Challenge                | Detail                                                                             |
| ------------------------ | ---------------------------------------------------------------------------------- |
| **Small amounts**        | A terrorist attack may cost only a few hundred to a few thousand dollars           |
| **Legitimate sources**   | Funds may come from legitimate employment, donations, or family support            |
| **No prior crime**       | Unlike ML, there is no predicate offence to trace                                  |
| **Compartmentalisation** | Terror cells often deliberately keep transactions small and separate               |
| **Charities**            | Some charities (knowingly or unknowingly) channel funds to terrorist organisations |

### CTF Red Flags

- Frequent small transfers to high-risk jurisdictions (conflict zones)
- Purchases of weapons-related materials (fertilisers, chemicals, electronics)
- Travel to known terrorism hotspots followed by increased financial activity
- Donations to unregistered or high-risk charities
- Consistent financial support from overseas to a local individual with no apparent income

---

## KYC — Know Your Customer

### What KYC Is

KYC is the process of verifying that a customer is who they say they are, understanding the nature of their expected business activity, and assessing the financial crime risk they present.

### Customer Identification Program (CIP)

**Individual Customers:**

```
Mandatory Identification:
├── Full legal name (as on government document)
├── Date of birth
├── Residential address
├── Tax File Number (TFN) or exemption
│
Identity Verification (at least ONE of):
├── Australian passport
├── Australian driver's licence (with photo)
├── Medicare card + secondary document
├── Foreign passport (+ visa if required)
├── Birth certificate + secondary document (e.g., utility bill)
└── National identity card
```

**Corporate / Entity Customers:**

```
Mandatory Identification:
├── Full legal name of entity
├── ABN (Australian Business Number)
├── ACN (Australian Company Number) — if company
├── Registered address
├── Principal place of business
├── Nature of business / industry
├── Source of funds (how does the business generate money?)
│
Entity Structure — Identify:
├── All directors / trustees / partners
├── Company secretary
├── Authorised signatories
└── Ultimate Beneficial Owners (UBOs) — see below
```

---

## Ultimate Beneficial Ownership (UBO)

**The most complex part of corporate KYC.** Banks must identify the real human being(s) who ultimately own or control a corporate customer — not just the direct shareholders.

### UBO Rules (Australia)

```
Beneficial Owner Threshold: ≥ 25% ownership OR effective control

Simple Structure:
  Company ABC → 100% owned by John Smith
  UBO: John Smith (100% → above 25%)

Complex Structure:
  Company ABC
  ├── 40% owned by Trust XYZ
  │         └── Trustee: Jane Brown
  │             Beneficiaries: Brown Family
  ├── 35% owned by Overseas Co Ltd
  │         └── 80% owned by Ali Hassan
  │             (so Ali = 28% effective → above 25%)
  └── 25% owned by VC Fund (no individual > 25%)

UBOs to identify:
  ├── Jane Brown (trustee = effective control of Trust XYZ)
  ├── Ali Hassan (28% effective ownership via Overseas Co)
  └── VC Fund general partner (if individual has control)
```

### UBO Challenges

| Challenge                  | Example                                           |
| -------------------------- | ------------------------------------------------- |
| **Multi-layer structures** | 10+ layers of holding companies                   |
| **Nominee shareholders**   | Person holds shares on behalf of another          |
| **Bearer shares**          | Ownership transfers physically — identity unclear |
| **Trust structures**       | Discretionary trusts; beneficiaries not fixed     |
| **Overseas entities**      | Foreign company registries may not be public      |
| **Orphaned structures**    | Beneficial owner deceased; no clear successor     |

---

## KYC Levels — Risk-Based Approach

Not all customers carry the same risk. The regulatory framework requires a **risk-based approach**:

### Simplified Due Diligence (SDD)
For very low-risk customers where ML/TF risk is demonstrably low.

```
Eligible for SDD:
├── Listed public companies (ASX, NYSE, etc.)
├── Government entities
├── Regulated financial institutions
└── Low-value products (e.g., prepaid cards up to $250)

What's reduced:
├── Less documentation required
├── Beneficial ownership threshold may be relaxed
└── Less frequent refresh required
```

### Standard Due Diligence (CDD)
The baseline for most retail and SME customers.

```
Required:
├── Full CIP (identity verification)
├── Understanding purpose of account
├── Expected transaction types and volumes
├── Source of funds (how they earn money)
└── Ongoing transaction monitoring
```

### Enhanced Due Diligence (EDD)
For high-risk customers — significantly more documentation and scrutiny.

```
Who requires EDD:
├── PEPs (Politically Exposed Persons) — see below
├── Customers in high-risk jurisdictions (FATF grey/black list)
├── Cash-intensive businesses (e.g., carwashes, casinos)
├── Non-face-to-face (remote) onboarding in some cases
├── Customers whose beneficial ownership is unusually complex
├── Charities operating in high-risk jurisdictions
└── Any customer whose risk assessment is HIGH

EDD requires:
├── Senior management approval to onboard
├── Source of WEALTH (not just funds — how they accumulated their assets)
├── Source of FUNDS for specific transactions
├── Enhanced ongoing monitoring (more frequent, lower thresholds)
├── Annual or biennial review (vs 3–5 years for standard)
└── Enhanced documentation of business relationships
```

---

## Politically Exposed Persons (PEPs)

A PEP is a person entrusted with a **prominent public function** — they are at higher risk of bribery and corruption.

### PEP Categories

| Category                           | Examples                                                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Domestic PEP**                   | Prime Minister, Cabinet Ministers, Senators, Federal Court judges, senior military officers, chiefs of state-owned enterprises |
| **Foreign PEP**                    | Heads of state, ministers, ambassadors, senior judges of foreign governments                                                   |
| **International Organisation PEP** | Senior officials of UN, IMF, World Bank, Olympic Committee                                                                     |
| **Family Members**                 | Spouse, children, parents, siblings of any PEP                                                                                 |
| **Close Associates**               | Business partners and close personal associates of PEPs                                                                        |

### PEP Risk Profile

```
Why PEPs are high risk:
├── Access to public funds
├── Ability to direct state resources
├── Potential to accept bribes
├── May use financial system to conceal corruption proceeds
└── Politically connected entities may be used for state-sponsored crime

PEP ≠ Criminal:
Being a PEP does NOT mean a person is corrupt — it means ENHANCED monitoring
is required because the risk is objectively higher.
```

### PEP Screening in Practice

```java
@Service
public class PepScreeningService {

    public PepResult screen(Customer customer) {
        // Screen against PEP databases
        // (World-Check, Dow Jones Risk & Compliance, ACAMS, etc.)
        List<PepMatch> matches = pepDatabase.findMatches(
            customer.getFullName(),
            customer.getDateOfBirth(),
            customer.getNationality()
        );

        if (matches.isEmpty()) {
            return PepResult.notPep();
        }

        // PEP found — determine category
        PepMatch bestMatch = matches.get(0);

        return PepResult.builder()
            .isPep(true)
            .category(bestMatch.getCategory())          // DOMESTIC / FOREIGN / INTERNATIONAL
            .pepRole(bestMatch.getRole())               // "Minister of Finance"
            .requiresEdd(true)
            .requiresSeniorApproval(true)
            .monitoringFrequency(MonitoringFrequency.HIGH)
            .build();
    }
}
```

---

## KYC Refresh and Ongoing Monitoring

KYC is **not a one-time event** — it must be refreshed periodically:

| Customer Risk Level | KYC Refresh Frequency           |
| ------------------- | ------------------------------- |
| LOW                 | Every 5 years                   |
| MEDIUM              | Every 3 years                   |
| HIGH                | Annually                        |
| PEP                 | Annually or on change of status |
| EDD customer        | At least annually               |

### Triggers for Immediate Refresh
- Change in beneficial ownership
- Customer moves to high-risk jurisdiction
- Unusual transaction patterns detected by TM
- Customer becomes a PEP (newly elected/appointed)
- Regulatory alert about the customer
- Media adverse news about the customer

---

## Transaction Monitoring (TM)

Transaction monitoring is the **engine room of AML** — automated analysis of every transaction to detect suspicious patterns.

### TM Rule Examples

#### Structuring / Smurfing
```
Rule:    Customer deposits cash multiple times in a short period,
         each amount just below AUD $10,000 (the TTR threshold)

Logic:   SUM(cash deposits) in rolling 24h by Customer_ID > 9,000
         AND max(single deposit) < 10,000
         AND count(deposits) >= 3

Alert:   Possible structuring to avoid Threshold Transaction Report

Example:
  9:00 AM  — Cash deposit $4,900
  2:00 PM  — Cash deposit $4,800
  Total: $9,700 — below threshold but pattern is suspicious
```

#### Money Mule (Rapid Pass-Through)
```
Rule:    Account receives a large credit and moves most of it
         within a very short window (1–24 hours)

Logic:   Credit received > $5,000
         AND Debit within 24h > 80% of credit amount
         AND Debit payee != own account

Alert:   Possible money mule account

Example:
  T+0h:  Receive $12,000 from unknown party
  T+2h:  Send $11,500 to 3 different accounts
  Remaining balance: $500
```

#### Velocity Anomaly
```
Rule:    Customer's transaction volume spikes dramatically
         compared to their historical baseline

Logic:   Count(transactions last 7 days) > 3 * avg(transactions per week, last 6 months)
         OR Sum(amount last 7 days) > 3 * avg(weekly amount, last 6 months)

Alert:   Unusual transaction frequency/volume

Example:
  Historical: 5 transactions/week, $2,000/week average
  This week: 45 transactions, $28,000
  → Alert triggered
```

#### Round-Trip / Circular Transfers
```
Rule:    Funds leave and return in similar amounts within a short period

Logic:   Outbound payment to Party A on Day 1
         AND Inbound payment from Party A (or related) on Day 1–3
         AND Return amount >= 85% of outbound amount

Alert:   Possible layering

Example:
  Day 1: Transfer $50,000 to offshore company
  Day 3: Receive $48,500 from same offshore company
  → Circular transaction — possible layering
```

#### High-Risk Jurisdiction
```
Rule:    Payment to/from a country on FATF high-risk list
         or DFAT-listed country

Logic:   Creditor or Debtor bank country_code IN (fatf_high_risk_countries)

Alert:   Enhanced due diligence required

Countries on FATF Black/Grey lists (periodic changes):
  Black: Iran, DPRK
  Grey:  Changes frequently — includes countries with AML deficiencies
```

#### Threshold Just-Below Reporting (TTR Avoidance)
```
Rule:    Multiple transactions just below $10,000 over time

Logic:   Count(transactions between $9,000 and $9,999) in rolling 30 days
         by same Customer_ID >= 3

Alert:   Deliberate structuring below TTR threshold
```

#### Dormant Account Sudden Activity
```
Rule:    Account with no activity for 6+ months suddenly
         receives/sends large amounts

Logic:   Last transaction date > 180 days ago
         AND New transaction > $10,000 OR > 5x largest historical transaction

Alert:   Dormant account reactivated — investigate purpose
```

---

## AML/CTF Reporting Obligations (Australia)

### 1. Threshold Transaction Report (TTR)

**What:** Any cash transaction (physical currency) of AUD $10,000 or more.

```
Triggers:
├── Cash deposit ≥ AUD $10,000
├── Cash withdrawal ≥ AUD $10,000
├── Foreign currency conversion ≥ AUD $10,000 in cash
└── Buying/selling physical precious metals for cash ≥ AUD $10,000

Filing requirement:
├── Report to AUSTRAC within 10 business days
├── Include: customer details, amount, date, facility
└── Keep records for 7 years

Note: Suspicion of structuring (multiple transactions to avoid TTR)
      should be reported as an SMR, not a TTR
```

### 2. International Funds Transfer Instruction (IFTI)

**What:** Every international funds transfer — regardless of amount.

```
Triggers:
├── ALL outbound SWIFT payments (any amount, including $1)
├── ALL inbound SWIFT payments received
├── NPP payments with international nexus
└── Foreign currency conversions involving international transfer

Filing requirement:
├── Report to AUSTRAC within 10 business days of sending/receiving
├── Include: ordering party, beneficiary, amounts, correspondent banks
└── Approximately 40 million IFTIs filed with AUSTRAC per year

Note: IFTI is a reporting obligation, not a red flag. It's automated
      batch reporting, not manual alert review.
```

### 3. Suspicious Matter Report (SMR)

**What:** Any matter where the reporting entity suspects (or should have suspected) that information may be relevant to the investigation of a tax or Commonwealth offence, including money laundering or terrorism financing.

```
Low threshold — "suspects" means reasonable grounds to suspect,
not certainty. When in doubt, file.

Triggers (non-exhaustive):
├── Transaction patterns consistent with money laundering typologies
├── Customer provides false or inconsistent information
├── Unusual interest in avoiding reporting thresholds
├── Customer identity cannot be satisfactorily verified
├── Sudden unexplained wealth inconsistent with known occupation
├── Transaction linked to known criminal investigation
└── Terrorism financing suspicion (ANY suspicion → immediate report)

Filing requirement:
├── "As soon as practicable" after forming the suspicion
├── For terrorism financing: within 24 hours
├── Include: complete customer details, transaction details,
│           nature of suspicion, basis for suspicion
└── NEVER tip off the customer (criminal offence)

Note: Failure to file an SMR when required is a criminal offence
      for both the institution and individual officers
```

### Tipping-Off Prohibition

This is one of the most important rules in AML/CTF compliance:

```
✅ You MAY:
  ├── Discuss the SMR with colleagues on a need-to-know basis
  ├── Share the SMR with AUSTRAC
  └── Share with law enforcement (on request)

❌ You MUST NOT:
  ├── Tell the customer you have filed or are filing an SMR
  ├── Hint to the customer that their account is under investigation
  ├── Tell third parties that you have filed an SMR about someone
  ├── Provide information that would allow the customer to identify
  │   the existence of the SMR
  └── Delay or structure your response in a way that tips off the subject

Penalty: Up to 2 years imprisonment + fines for individuals
```

---

## AML/CTF Program Components

Every reporting entity must have a **written AML/CTF Program** comprising two parts:

### Part A — AUSTRAC Compliance Program

```
Required elements:
├── 1. ML/TF Risk Assessment
│       Identify and assess ML/TF risks for:
│       ├── Customer types
│       ├── Products and services
│       ├── Delivery channels
│       └── Jurisdictions
│
├── 2. Customer Due Diligence Procedures
│       ├── Standard CDD
│       ├── Simplified CDD (when eligible)
│       ├── Enhanced CDD (EDD)
│       ├── Ongoing CDD
│       └── Beneficial ownership rules
│
├── 3. Transaction Monitoring Program
│       ├── Automated monitoring rules
│       ├── Review and alert process
│       └── Escalation and SMR filing
│
├── 4. Employee Due Diligence
│       ├── Staff background checks
│       ├── AML training (at least annually)
│       └── Culture of compliance
│
├── 5. AML/CTF Compliance Officer
│       ├── Designated officer (often called the MLRO)
│       ├── Senior management appointment
│       └── Responsible for filing SMRs
│
└── 6. Independent Review
        ├── Internal or external audit
        └── At least every 2 years (more frequently for high-risk)
```

### Part B — Know Your Customer (KYC) Program

```
Required elements:
├── Customer identification procedures
├── Beneficial ownership identification
├── Ongoing customer due diligence
├── Enhanced due diligence for high-risk
└── Record-keeping obligations
```

---

## The Travel Rule (FATF Recommendation 16)

The **Travel Rule** requires that certain information about the originator and beneficiary **"travel"** with a wire transfer — it must be transmitted to the next institution in the payment chain.

### What Must Travel With Every Payment

```
Originator (Debtor) Information:
├── Full name
├── Account number (or unique transaction reference if no account)
├── Address, or date/place of birth, or national ID number

Beneficiary (Creditor) Information:
├── Full name
├── Account number (or unique reference)
```

### Thresholds

| Jurisdiction            | Threshold                                         |
| ----------------------- | ------------------------------------------------- |
| **FATF standard**       | USD/EUR 1,000 or above                            |
| **Australia (AUSTRAC)** | All international transfers (any amount per IFTI) |
| **US (FinCEN)**         | USD 3,000 or above (bank-to-bank)                 |
| **EU (AMLD / TFR)**     | EUR 1,000 or above                                |

### Travel Rule in ISO 20022

The pacs.008 message naturally carries all Travel Rule information in structured fields:

```xml
<!-- Originator info — satisfies Travel Rule -->
<Dbtr>
    <Nm>John Smith</Nm>
    <PstlAdr><AdrLine>123 Main St, Sydney NSW 2000</AdrLine></PstlAdr>
</Dbtr>
<DbtrAcct><Id><Othr><Id>12345678</Id></Othr></Id></DbtrAcct>

<!-- Beneficiary info — satisfies Travel Rule -->
<Cdtr>
    <Nm>Jane Doe</Nm>
</Cdtr>
<CdtrAcct><Id><Othr><Id>87654321</Id></Othr></Id></CdtrAcct>
```

This is one reason why ISO 20022 migration is so important for compliance — legacy MT formats often failed to carry all required fields.

---

## Risk-Based Customer Segmentation

Banks assign each customer a risk rating that drives CDD intensity and monitoring sensitivity:

```
Risk Scoring Model:

Customer Risk Score = f(
    customer_type,       // Individual, company, charity, PEP, etc.
    geography,           // Home country, transaction countries
    industry,            // Cash-intensive, high-risk sectors
    product_usage,       // International wires, cash, crypto
    relationship_tenure, // New customer = higher risk
    historical_alerts,   // Previous TM alerts, SMRs
    negative_news        // Adverse media screening
)

Risk Buckets:
  LOW    (Score < 30)  → SDD / Standard CDD, 5-year refresh
  MEDIUM (Score 30-70) → Standard CDD, 3-year refresh
  HIGH   (Score 70-90) → EDD, annual refresh
  VERY HIGH (Score > 90) → EDD + senior approval, 6-month review
```

---

## Adverse Media Screening

Beyond sanctions lists and PEP databases, banks screen for **negative news**:

```
What is screened:
├── News articles linking customer to crime, corruption, fraud
├── Court records and judgements
├── Regulatory enforcement actions
├── Company insolvency and bankruptcy records
└── Social media (in some cases)

Sources:
├── Commercial providers: World-Check, Dow Jones Risk & Compliance,
│   LexisNexis, Refinitiv
├── AUSTRAC alerts
├── ACIC (Australian Criminal Intelligence Commission) records
└── Open source internet search

Frequency:
├── At onboarding
├── Ongoing automated monitoring (many providers offer alerts)
└── On trigger events (e.g., new transaction from high-risk country)
```

---

## FATF Mutual Evaluation and Country Risk

FATF periodically evaluates every member country's AML/CTF regime:

```
FATF Evaluation Outcomes:

COMPLIANT:
  Country has effective AML/CTF regime
  Standard due diligence applies

GREY LIST (Increased Monitoring):
  Jurisdiction with strategic deficiencies
  Committed to work with FATF to address
  → Bank should apply enhanced due diligence for customers/payments
     involving this country

BLACK LIST (Call for Action):
  High-risk jurisdictions — Iran, DPRK
  FATF calls for countermeasures
  → Banks should apply the most stringent EDD or avoid entirely
  → Overlaps heavily with OFAC/UN sanctions

Current status at: www.fatf-gafi.org (updated regularly)
```

---

## AML in the Payment Processing Pipeline

```
Payment Instruction Received
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 1: CUSTOMER RISK CHECK                            │
│  ├── KYC status: VERIFIED? EXPIRED? PENDING?            │
│  ├── Customer risk rating: LOW / MEDIUM / HIGH?         │
│  ├── Is customer a PEP? → EDD monitoring active?        │
│  ├── Customer on internal watchlist?                    │
│  └── AML/CTF program hold on account?                   │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 2: TRANSACTION MONITORING RULES                   │
│  ├── Structuring rule                                   │
│  ├── Money mule (rapid pass-through) rule               │
│  ├── Velocity anomaly rule                              │
│  ├── Round-trip / circular transaction rule             │
│  ├── High-risk jurisdiction rule                        │
│  ├── Dormant account sudden activity rule               │
│  └── Custom bank-specific rules                         │
└────────────────────────┬────────────────────────────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
           CLEAR               ALERT RAISED
              │                     │
              ▼                     ▼
         Continue            Hold Payment
         Processing          Queue to AML Analyst
                                    │
                          ┌─────────┴──────────┐
                          │                    │
                    FALSE POSITIVE         TRUE SUSPICIOUS
                          │                    │
                    Document            Continue Investigation
                    Release             File SMR with AUSTRAC
                    Tune Rule           Possible account closure
                                        Report to AFP if terrorism
```

---

## Java Spring — Full AML/KYC Implementation

```java
// Customer KYC model
@Entity
@Table(name = "customer_kyc")
public class CustomerKyc {

    @Id
    private String customerId;

    @Enumerated(EnumType.STRING)
    private KycStatus status;          // PENDING, VERIFIED, EXPIRED, SUSPENDED

    @Enumerated(EnumType.STRING)
    private RiskRating riskRating;     // LOW, MEDIUM, HIGH, VERY_HIGH

    @Enumerated(EnumType.STRING)
    private DueDiligenceLevel ddLevel; // SDD, STANDARD, EDD

    private boolean isPep;
    private String pepRole;            // "Minister of Finance"
    private boolean isUbo;             // Is this person a UBO of another entity?
    private boolean adverseMediaFlag;

    private LocalDate kycVerifiedDate;
    private LocalDate kycExpiryDate;   // When next refresh is due
    private LocalDate lastReviewDate;

    @OneToMany(mappedBy = "customerId", cascade = CascadeType.ALL)
    private List<UltimateBeneficialOwner> ubos;

    @OneToMany(mappedBy = "customerId", cascade = CascadeType.ALL)
    private List<CustomerDocument> identityDocuments;
}

// Transaction Monitoring Service
@Service
@Slf4j
public class TransactionMonitoringService {

    private final List<TmRule> rules;  // injected rules (Spring beans)
    private final TmAlertRepository alertRepository;
    private final ComplianceQueueService complianceQueue;
    private final SmrService smrService;
    private final AuditService auditService;

    public TmResult evaluate(PaymentInstruction instruction, Customer customer) {
        List<TmAlert> alerts = new ArrayList<>();
        TmContext context = TmContext.builder()
            .instruction(instruction)
            .customer(customer)
            .customerHistory(transactionHistoryService.get(customer.getId(), 180))
            .build();

        for (TmRule rule : rules) {
            if (rule.isApplicable(context)) {
                RuleResult result = rule.evaluate(context);
                if (result.isAlert()) {
                    alerts.add(TmAlert.builder()
                        .ruleId(rule.getId())
                        .ruleName(rule.getName())
                        .severity(result.getSeverity())
                        .description(result.getDescription())
                        .paymentId(instruction.getId())
                        .customerId(customer.getId())
                        .raisedAt(Instant.now())
                        .status(TmAlertStatus.OPEN)
                        .build());
                }
            }
        }

        if (!alerts.isEmpty()) {
            alertRepository.saveAll(alerts);
            complianceQueue.submit(alerts);
            auditService.logTmAlerts(instruction.getId(), alerts);
            log.warn("TM alerts raised for payment {}: {} alerts",
                instruction.getId(), alerts.size());
            return TmResult.hold(alerts);
        }

        // Check IFTI obligation (international transfers)
        if (instruction.isInternational()) {
            iftiScheduler.schedule(instruction);
        }

        return TmResult.clear();
    }
}

// Structuring Rule implementation
@Component
public class StructuringRule implements TmRule {

    private static final BigDecimal TTR_THRESHOLD = new BigDecimal("10000.00");
    private static final BigDecimal LOWER_BOUND   = new BigDecimal("9000.00");
    private static final int        MIN_COUNT      = 3;
    private static final int        WINDOW_HOURS   = 24;

    @Override
    public String getId() { return "TM-001-STRUCTURING"; }

    @Override
    public boolean isApplicable(TmContext ctx) {
        return ctx.getInstruction().isCash();
    }

    @Override
    public RuleResult evaluate(TmContext ctx) {
        String customerId = ctx.getCustomer().getId();
        LocalDateTime windowStart = LocalDateTime.now().minusHours(WINDOW_HOURS);

        List<Transaction> recentCash = ctx.getCustomerHistory().stream()
            .filter(t -> t.isCash())
            .filter(t -> t.getTimestamp().isAfter(windowStart))
            .collect(toList());

        BigDecimal totalCash = recentCash.stream()
            .map(Transaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        boolean allBelowThreshold = recentCash.stream()
            .allMatch(t -> t.getAmount().compareTo(TTR_THRESHOLD) < 0);

        boolean sumNearThreshold = totalCash.compareTo(LOWER_BOUND) >= 0
            && totalCash.compareTo(TTR_THRESHOLD) < 0;

        if (allBelowThreshold && sumNearThreshold
                && recentCash.size() >= MIN_COUNT) {
            return RuleResult.alert(
                AlertSeverity.HIGH,
                String.format(
                    "Structuring: %d cash transactions totalling $%.2f in 24h, "
                    + "all below TTR threshold",
                    recentCash.size(), totalCash)
            );
        }
        return RuleResult.clear();
    }
}

// AML screening orchestrator
@Service
public class AmlComplianceService {

    public AmlDecision assess(PaymentInstruction instruction, Customer customer) {

        // 1. KYC status
        CustomerKyc kyc = kycRepository.findById(customer.getId())
            .orElseThrow();

        if (kyc.getStatus() == KycStatus.EXPIRED) {
            return AmlDecision.hold(HoldReason.KYC_EXPIRED,
                "KYC expired on " + kyc.getKycExpiryDate());
        }
        if (kyc.getStatus() == KycStatus.SUSPENDED) {
            return AmlDecision.block(BlockReason.KYC_SUSPENDED);
        }

        // 2. PEP — apply EDD monitoring
        if (kyc.isPep()) {
            eddMonitor.record(instruction, customer);
        }

        // 3. Transaction monitoring
        TmResult tmResult = transactionMonitoringService
            .evaluate(instruction, customer);

        if (tmResult.isHold()) {
            return AmlDecision.hold(HoldReason.TM_ALERT,
                tmResult.getAlerts().size() + " TM alerts");
        }

        // 4. IFTI reporting (does not block payment)
        if (instruction.isInternational()) {
            iftiScheduler.schedule(instruction);
        }

        return AmlDecision.clear();
    }
}
```

---

## AML vs CTF vs Sanctions vs Fraud

| Dimension                 | AML                                 | CTF                             | Sanctions                           | Fraud                     |
| ------------------------- | ----------------------------------- | ------------------------------- | ----------------------------------- | ------------------------- |
| **Goal**                  | Detect laundering of crime proceeds | Prevent funding of terrorism    | Block prohibited persons/countries  | Prevent monetary loss     |
| **Money flow**            | Large amounts, dirty → clean        | Small amounts, clean → violence | Any amount, prohibited parties      | Unauthorised transactions |
| **Threshold**             | Risk-based                          | Zero tolerance — any amount     | Zero tolerance                      | Risk-based                |
| **Lists used**            | FATF guidance, internal TM rules    | FATF guidance, terror lists     | OFAC, UN, DFAT, EU                  | Internal blacklists       |
| **Report to**             | AUSTRAC (SMR, TTR, IFTI)            | AUSTRAC (SMR) + AFP             | AUSTRAC + DFAT + foreign regulators | Internal only             |
| **Tip-off allowed?**      | ❌ Criminal offence                  | ❌ Criminal offence              | ❌ Criminal offence                  | ✅ Yes                     |
| **Who investigates**      | AML analyst → MLRO                  | AML analyst → MLRO → AFP        | Sanctions officer → Legal           | Fraud analyst             |
| **Customer relationship** | May continue with monitoring        | Terminate if confirmed          | Terminate and freeze                | Review + restrict         |

---

## Related Concepts
- [sanction.md](./sanction.md) — Sanctions runs alongside AML; different lists and purpose
- [fraud.md](./fraud.md) — Third pillar of compliance; different reporting chain
- [fis.md](./fis.md) — FI-level AML obligations and correspondent banking
- [payment_exceptions.md](./payment_exceptions.md) — AML holds as payment exceptions
- [outbound.md](./outbound.md) — AML checkpoint on outbound payments
- [inbound.md](./inbound.md) — AML checkpoint on inbound payments
- [open_banking.md](./open_banking.md) — CDR data-sharing and AML/privacy balance
- [core_banking.md](./core_banking.md) — KYC data stored in customer information file (CIF)