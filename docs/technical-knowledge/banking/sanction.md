---
id: sanction
description: Overview of sanctions controls in payment processing.
tags: [banking, compliance, sanctions]

title: "Sanctions Screening"
sidebar_label: "Sanctions"
sidebar_position: 2
---

# Sanctions Screening

## Overview

**Sanctions screening** is the mandatory compliance process of checking all payment parties — individuals, entities, and financial institutions — against government-issued and international **watchlists**. If a match is found, the payment must be blocked, the account may need to be frozen, and the incident reported to the regulator.

Sanctions are **geopolitical tools**. Governments use them to restrict economic activity with certain countries, regimes, terrorist organisations, weapons proliferators, and corrupt individuals. For banks, processing a sanctioned transaction — even unknowingly — can result in catastrophic penalties.

> **Key principle:** Sanctions are not optional and not risk-based. If a name is on the list, the payment must stop — no exceptions.

---

## Why Sanctions Screening Matters

### Real-World Penalty Examples

| Bank                   | Year | Penalty   | Reason                                            |
| ---------------------- | ---- | --------- | ------------------------------------------------- |
| **BNP Paribas**        | 2014 | USD 8.97B | Processing transactions for Sudan, Iran, Cuba     |
| **Standard Chartered** | 2019 | USD 1.1B  | Iran, Myanmar, Zimbabwe transaction processing    |
| **HSBC**               | 2012 | USD 1.9B  | Mexican drug cartel + sanctions violations        |
| **Commerzbank**        | 2015 | USD 1.45B | Iran, Sudan payments stripped of identifying info |
| **Westpac**            | 2020 | AUD 1.3B  | AML/CTF breaches including AUSTRAC violations     |

### Consequences of Non-Compliance

| Consequence                         | Details                                                                                   |
| ----------------------------------- | ----------------------------------------------------------------------------------------- |
| **Massive fines**                   | Can exceed the bank's annual profit                                                       |
| **Criminal prosecution**            | Senior executives personally liable                                                       |
| **Reputational damage**             | Loss of correspondent banking relationships — effectively cuts off international payments |
| **SWIFT disconnection**             | Exclusion from the global interbank network                                               |
| **Banking licence revocation**      | Regulator can shut the bank down                                                          |
| **Deferred Prosecution Agreements** | Bank placed under US government supervision for years                                     |

---

## Types of Sanctions

### 1. Comprehensive Sanctions (Country-Level)
Broad prohibition on all economic activity with a country or regime.

| Country / Regime   | Sanctioning Body             | Scope                            |
| ------------------ | ---------------------------- | -------------------------------- |
| Iran               | OFAC (US), EU, UN, DFAT (AU) | Near-total ban on transactions   |
| North Korea (DPRK) | OFAC, UN, EU, DFAT           | Comprehensive embargo            |
| Syria              | OFAC, EU, DFAT               | Broad restrictions               |
| Cuba               | OFAC                         | US-specific embargo; others vary |
| Russia (post-2022) | EU, OFAC, DFAT, UK           | Sectoral + targeted              |
| Belarus            | EU, UK, OFAC                 | Senior regime figures + entities |
| Myanmar            | OFAC, EU, DFAT               | Military junta + entities        |

> ⚠️ **Extraterritorial Reach of OFAC:** Even a non-US bank can be penalised by OFAC if transactions touch the US financial system (USD clearing, US correspondent banks). This makes OFAC screening globally mandatory.

### 2. Targeted / Individual Sanctions
Prohibitions on specific named individuals and entities, regardless of their country.

- **Specially Designated Nationals (SDN)** — OFAC's primary list; includes terrorists, drug traffickers, WMD proliferators, and corrupt oligarchs
- **Consolidated UN List** — UN-designated individuals and entities
- **EU Consolidated List** — EU-designated individuals and entities
- **DFAT List (AU)** — Australia's autonomous sanctions on individuals and entities

### 3. Sectoral Sanctions
Restrictions on specific **sectors** of an economy rather than blanket bans — common for Russia sanctions:

```
Sectoral Sanctions examples (Russia):
├── Energy sector  — Restrictions on financing for oil projects
├── Defence sector — No finance/export of military equipment
├── Finance sector — Restrictions on major Russian banks (debt/equity financing)
└── Technology      — Export controls on dual-use technology
```

### 4. Secondary Sanctions
US secondary sanctions penalise **non-US entities** that do business with sanctioned parties — even if no US person or USD is involved:

```
Iranian company  ────────────────►  German company (non-US)
(sanctioned)                             │
                                         │ US secondary sanctions risk
                                         ▼
                              German company could be cut off
                              from the US financial system
```

This is why banks globally — not just US banks — screen against OFAC lists.

---

## Global Sanctions Lists

### Primary Lists (Must Screen Against)

| List                                 | Authority                                                | Notes                                         |
| ------------------------------------ | -------------------------------------------------------- | --------------------------------------------- |
| **OFAC SDN**                         | US Treasury Office of Foreign Assets Control             | ~13,000+ entries; most powerful list globally |
| **OFAC Non-SDN / SSI**               | US Treasury                                              | Sectoral Sanctions Identifications (SSI) list |
| **UN Security Council Consolidated** | United Nations                                           | Mandatory for all UN member states            |
| **EU Consolidated Sanctions**        | European Council                                         | Must screen for EU-connected transactions     |
| **UK OFSI Consolidated**             | HM Treasury Office of Financial Sanctions Implementation | Post-Brexit, UK maintains its own list        |
| **DFAT Consolidated**                | Australian Dept of Foreign Affairs and Trade             | Australia's autonomous sanctions              |
| **AUSTRAC Guidance**                 | AUSTRAC                                                  | AML/CTF risk guidance (supplements DFAT)      |

### Secondary / Supplementary Lists

| List                               | Source     | Usage                                        |
| ---------------------------------- | ---------- | -------------------------------------------- |
| **Interpol Red Notices**           | Interpol   | Wanted persons (not legally binding)         |
| **World Bank Debarred**            | World Bank | Debarred entities from WB projects           |
| **FATF High-Risk Countries**       | FATF       | Enhanced due diligence jurisdictions         |
| **Transparency International CPI** | TI         | Corruption Perception Index — risk indicator |
| **Internal Bank Blacklists**       | Each bank  | Internal watchlists from investigations      |

---

## SDN List — Structure Deep Dive

The OFAC SDN list entry contains:

```
SDN Entry Example:
├── Name:           ALI HASSAN MOHAMMED
├── Aliases:        HASSAN, Ali; MOHAMMED ALI, Hassan
├── Type:           Individual
├── Program:        SDGT (Specially Designated Global Terrorist)
├── DOB:            01 Jan 1975
├── POB:            Yemen
├── Nationality:    Yemeni
├── Passport:       YE123456 (issued Yemen)
├── Address:        Sana'a, Yemen
└── Additional info: Associated with [terrorist org]

Associated entity:
├── Name:           AL-HASSAN TRADING CO.
├── Type:           Entity
├── Program:        SDGT
├── Address:        Sana'a, Yemen
└── ID:             YE-REG-12345
```

Banks must screen against **all fields** — name, alias, DOB, address, passport number.

---

## What Must Be Screened

### In Every Payment

```
pacs.008 / pain.001 Payment Instruction
├── Debtor
│   ├── Name (and all name variants)
│   ├── Address / country
│   ├── Date of birth (individuals)
│   └── Registration number (entities)
├── Debtor Account (IBAN, account number)
├── Debtor Agent (BIC → country extraction)
├── Instructing Party (if different from debtor)
├── Ultimate Debtor (if present)
├── Intermediary Agent(s) (correspondent banks)
├── Creditor Agent (BIC → country extraction)
├── Creditor
│   ├── Name
│   ├── Address / country
│   └── Registration number
├── Creditor Account
├── Ultimate Creditor (if present)
└── Remittance Information
    └── Scan for entity names embedded in free text
```

### At Customer Onboarding
- Full name + aliases
- Beneficial owners (≥ 25% ownership — see UBO rules in AML)
- Directors and key controllers
- Connected entities and subsidiaries

### On List Updates
When OFAC/UN/DFAT publish a new list version, every existing customer in the bank must be **re-screened** against the new entries.

---

## Sanctions Screening Architecture

```
Payment Instruction
        │
        ▼
┌───────────────────────────────────────────────────────┐
│              SANCTIONS SCREENING ENGINE                │
│                                                        │
│  1. DATA EXTRACTION                                    │
│     Parse all party fields from ISO 20022 message     │
│                                                        │
│  2. NORMALISATION                                      │
│     ├── Remove punctuation: "AL-RASHID" → "AL RASHID" │
│     ├── Expand abbreviations: "Co." → "Company"       │
│     ├── Transliterate: Arabic/Cyrillic → Latin        │
│     ├── Lowercase + trim                              │
│     └── Split compound names                          │
│                                                        │
│  3. MATCHING ENGINE                                    │
│     ├── Exact match (account numbers, BICs, LEIs)     │
│     ├── Fuzzy name match (Jaro-Winkler, Levenshtein)  │
│     ├── Phonetic match (Soundex, Double Metaphone)    │
│     ├── Token / n-gram match                          │
│     ├── Alias expansion (check all known aliases)     │
│     └── Country code match (for embargoed countries)  │
│                                                        │
│  4. SCORING & THRESHOLDING                             │
│     ├── Score 0–100 per candidate match               │
│     ├── < threshold → CLEAR                           │
│     └── ≥ threshold → ALERT                          │
└────────────────────────┬──────────────────────────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
           CLEAR               POTENTIAL MATCH
              │                     │
         Process               Auto-Hold Payment
         Payment               Notify Compliance
                                    │
                          ┌─────────┴──────────┐
                          │                    │
                    FALSE POSITIVE        TRUE MATCH
                          │                    │
                    Document            BLOCK permanently
                    Release             Freeze account
                    Tune rule           File with AUSTRAC/OFAC
```

---

## Name Matching Algorithms

### Jaro-Winkler Similarity
Best for short strings (names). Gives extra weight to matches at the start of the string.

```java
// Jaro-Winkler example
double score = jaroWinkler.apply("Mohammed Ali", "Mohammad Ali");
// Returns ~0.944 — high confidence match

// Threshold typically set at 0.85 for sanctions
boolean isAlert = score >= 0.85;
```

### Levenshtein Distance
Counts minimum edits (insert, delete, substitute) to transform one string to another.

```java
int distance = levenshtein.apply("HASSAN", "HASAAN");
// Returns 1 (one substitution) — likely a match
```

### Double Metaphone (Phonetic)
Encodes names by how they sound, not how they're spelled.

```java
String[] codes = metaphone.doubleMetaphone("Mohammed");
// Returns ["MHM", "MMT"] — same codes as "Mohamed", "Muhammed"
// Catches transliteration variants
```

### Token Set Ratio
Handles names in different word order.

```java
// "Ali Hassan Mohammed" vs "Mohammed Ali Hassan"
// Standard fuzzy: low score (different order)
// Token set ratio: high score (same tokens, different order)
double score = tokenSetRatio("Ali Hassan Mohammed", "Mohammed Ali Hassan");
// Returns 1.0 — same tokens
```

### Match Threshold Strategy

| Threshold         | Behaviour               | Trade-off                                    |
| ----------------- | ----------------------- | -------------------------------------------- |
| 100% (exact only) | Minimal false positives | Easily evaded by minor spelling variants     |
| 85–90%            | Balanced                | Industry standard for high-volume screening  |
| 70–80%            | More alerts             | High false positive rate; analyst workload ↑ |
| 60–70%            | Very sensitive          | Unusable false positive rate                 |

Banks typically run **multiple thresholds** — 85% for auto-hold, 70% for audit log only.

---

## Country Risk and Embargo Screening

Beyond name matching, the **country** in a payment must be checked:

```java
public class CountryRiskScreeningService {

    public CountryRiskResult screen(String bicOrIban) {
        String countryCode = extractCountry(bicOrIban);  // e.g., "IR" from BKIRIRIA

        if (comprehensiveEmbargo.contains(countryCode)) {
            // e.g., IR (Iran), KP (North Korea), SY (Syria)
            return CountryRiskResult.block("Comprehensive embargo: " + countryCode);
        }

        if (sectoralSanctions.contains(countryCode)) {
            // e.g., RU (Russia) — depends on transaction type
            return CountryRiskResult.review("Sectoral sanctions apply: " + countryCode);
        }

        if (fatfHighRisk.contains(countryCode)) {
            // FATF grey/black list countries
            return CountryRiskResult.enhancedDueDiligence(countryCode);
        }

        return CountryRiskResult.clear(countryCode);
    }

    private String extractCountry(String bic) {
        // BIC format: BBBB-CC-LL-BBB (CC = country)
        return bic.length() >= 6 ? bic.substring(4, 6).toUpperCase() : "XX";
    }
}
```

### High-Risk / Embargoed Country Categories

| Category                  | Examples                          | Treatment                                    |
| ------------------------- | --------------------------------- | -------------------------------------------- |
| **Comprehensive embargo** | Iran, DPRK, Syria, Cuba (US)      | Block all transactions                       |
| **Sectoral sanctions**    | Russia, Belarus                   | Block based on transaction type/sector       |
| **FATF Black List**       | Iran, DPRK                        | Enhanced due diligence + report to regulator |
| **FATF Grey List**        | Pakistan, UAE (past), Philippines | Increased monitoring                         |
| **High-risk DFAT**        | Countries on DFAT concern list    | Enhanced scrutiny                            |

---

## False Positive Management

False positives are the biggest operational challenge in sanctions screening. A bank processing millions of payments per day may generate thousands of false alerts daily.

### False Positive Rate Benchmarks

| Industry              | Typical FP Rate                      | Target |
| --------------------- | ------------------------------------ | ------ |
| Retail banking        | 95–99% of alerts are false positives | < 95%  |
| Correspondent banking | 90–97%                               | < 90%  |
| Trade finance         | 85–95%                               | < 85%  |

### Reducing False Positives

```
Techniques:
├── Whitelisting — Known good entities (e.g., "Shell" the oil company vs "Shell" the person)
├── Rule tuning — Adjust thresholds per list / name type
├── Context scoring — Weight by address, DOB, account number match
├── Entity disambiguation — Resolve common names using LEI/registration numbers
├── Suppression rules — Suppress alert if same entity already reviewed + cleared
└── Post-review feedback loop — Analyst decisions train the model
```

### Analyst Workflow for False Positive Disposition

```
Alert Received
     │
     ▼
Analyst Reviews:
  ├── Does nationality/address/DOB match?
  ├── Is this a common name? (e.g., "Mohammed Ali" — millions worldwide)
  ├── Additional identifiers available? (passport, LEI, registration)
  ├── Context: what is the transaction for?
  └── Has this entity been cleared before?
     │
     ├── CLEARLY DIFFERENT PERSON → False Positive
     │     Document: name, why cleared, analyst ID, timestamp
     │     Add to suppression list (if safe to do so)
     │
     ├── UNCERTAIN → Escalate to Senior Analyst
     │     Request additional customer information
     │     Apply de-risking measures
     │
     └── CONFIRMED MATCH → True Hit
           Escalate to Compliance Manager
           Block payment / freeze account
           File with AUSTRAC/OFAC
```

---

## Watchlist Maintenance and List Updates

Sanctions lists are **updated frequently** — OFAC alone may update the SDN list multiple times per week:

```
List Update Workflow:
1. New list published by OFAC/UN/EU/DFAT
2. Compliance team notified (automated)
3. New list ingested into screening engine (automated, < 1 hour)
4. Delta screening run against:
   ├── All existing customers (customer screening)
   ├── All pending/queued payments
   └── Recent transactions (look-back period, e.g., 30 days)
5. New alerts generated for newly added entries
6. Audit log of list version used for each screening event
```

```java
@Service
public class WatchlistMaintenanceService {

    @Scheduled(fixedDelay = 3_600_000)  // Every hour
    public void checkForListUpdates() {
        for (SanctionsList list : SanctionsList.values()) {
            String latestVersion = listProvider.getLatestVersion(list);
            String currentVersion = listVersionRepository.getCurrent(list);

            if (!latestVersion.equals(currentVersion)) {
                List<SanctionsEntry> delta = listProvider.getDelta(
                    list, currentVersion, latestVersion);

                // Update local list
                listRepository.applyDelta(list, delta);
                listVersionRepository.update(list, latestVersion);

                // Re-screen impacted customers
                screeningJobQueue.submit(new DeltaScreeningJob(delta));

                auditLog.info("Sanctions list updated: {} from {} to {}",
                    list, currentVersion, latestVersion);
            }
        }
    }
}
```

---

## Sanctions Evasion Red Flags

Banks must be alert to attempts to circumvent sanctions controls:

| Red Flag                   | Description                                                                               |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| **Stripping**              | Removing identifying information from SWIFT MT messages (e.g., removing Iranian bank BIC) |
| **Name misspelling**       | Deliberate typos to avoid fuzzy matching (e.g., "Khaminei" for "Khamenei")                |
| **Shell company routing**  | Using non-sanctioned shell companies owned by sanctioned individuals                      |
| **Third-country routing**  | Routing payments through a non-sanctioned jurisdiction to obscure origin/destination      |
| **Proxy ownership**        | Sanctioned individual owns < 50% but controls the entity through nominees                 |
| **Mixed jurisdiction**     | Legitimate entity registered in a sanctioned country (e.g., a branch in Iran)             |
| **PayID masking**          | Using a phone number or email PayID to hide account details                               |
| **Correspondent layering** | Using chains of correspondent banks to obscure the sanctioned party                       |

### Payment Stripping (Historical SWIFT MT)

```
Original MT103:
:52A: BKIRIRIA  ← Iranian bank BIC
:59: /IR987654321 John Smith

Stripped MT103 sent to US correspondent:
:52A: (field removed)
:59: John Smith

US correspondent bank sees no Iranian connection → processes
→ Bank later fined for knowing about the stripping
```

ISO 20022 makes stripping much harder — structured XML fields are harder to remove without breaking validation.

---

## Correspondent Banking and De-Risking

Banks are reducing their correspondent banking relationships to avoid sanctions exposure — known as **de-risking**:

```
Bank A (small, high-risk jurisdiction)
  │
  │ Applies for USD correspondent account
  │
  ▼
Major US Bank (potential correspondent)
  │
  │ Assesses:
  ├── Does Bank A have robust sanctions controls?
  ├── Is Bank A's home jurisdiction high-risk?
  ├── What are Bank A's customers like?
  └── Is the compliance cost worth the revenue?
  │
  ▼
If risk too high → De-risk: decline the relationship
```

This de-risking trend creates **financial exclusion** for smaller/developing-country banks — a global policy challenge.

---

## Regulatory Reporting — True Sanctions Hit

When a **confirmed sanctions hit** is found:

### Immediate Actions (Within Hours)
1. **Block** the payment permanently
2. **Freeze** the customer's account (if the customer is sanctioned)
3. **Escalate** to Compliance Manager and Legal
4. **Do NOT tip off** the customer — this is a criminal offence

### Regulatory Reporting
| Jurisdiction | Authority          | Report                  | Deadline                |
| ------------ | ------------------ | ----------------------- | ----------------------- |
| Australia    | AUSTRAC + DFAT     | SMR / Freezing notice   | Immediately / ASAP      |
| US           | OFAC               | OFAC Report             | Within 10 business days |
| UK           | OFSI (HM Treasury) | Freezing / asset report | Within 14 days          |
| EU           | National FIU       | Per member state rules  | Varies                  |

### Record Keeping
- All screening events must be logged (payment ID, parties screened, list version, score, decision)
- Minimum retention: **7 years** in Australia
- Records must be producible on demand for regulatory examination

---

## Sanctions vs AML vs Fraud

| Dimension                 | Sanctions                                | AML/CTF                          | Fraud                               |
| ------------------------- | ---------------------------------------- | -------------------------------- | ----------------------------------- |
| **Purpose**               | Block geopolitically prohibited entities | Detect financial crime patterns  | Prevent monetary loss               |
| **Legal obligation**      | Mandatory — no risk-based discretion     | Mandatory — risk-based approach  | Risk management                     |
| **Lists used**            | Government watchlists (OFAC, UN, DFAT)   | Internal TM rules, FATF guidance | Internal blacklists, fraud networks |
| **Can tip off customer?** | ❌ Criminal offence                       | ❌ Criminal offence               | ✅ Yes (contact to verify)           |
| **Report to**             | AUSTRAC, OFAC, OFSI, DFAT                | AUSTRAC (SMR)                    | Internal only                       |
| **Reviewer**              | Compliance officer                       | AML analyst                      | Fraud analyst                       |
| **Threshold approach**    | Zero tolerance                           | Risk-based                       | Risk-based                          |
| **False positives**       | High volume — need analyst triage        | Moderate                         | High — automated clearing common    |

---

## Java Spring — Full Screening Implementation

```java
@Service
@Slf4j
public class SanctionsScreeningService {

    private final WatchlistRepository watchlistRepository;
    private final NameNormalisationService normaliser;
    private final MatchingEngine matchingEngine;
    private final PaymentHoldService holdService;
    private final ComplianceAlertService alertService;
    private final ScreeningAuditRepository auditRepository;
    private final CountryRiskService countryRiskService;

    @Value("${screening.fuzzy.threshold:0.85}")
    private double fuzzyThreshold;

    @Value("${screening.exact.account-numbers:true}")
    private boolean screenAccountNumbers;

    public ScreeningResult screen(PaymentInstruction instruction) {
        List<ScreeningSubject> subjects = extractAllSubjects(instruction);
        List<ScreeningAlert> alerts = new ArrayList<>();

        for (ScreeningSubject subject : subjects) {

            // 1. Country-level check (fast — before name matching)
            if (subject.hasCountry()) {
                CountryRiskResult countryRisk =
                    countryRiskService.screen(subject.getCountry());
                if (countryRisk.isBlocked()) {
                    return escalateHit(instruction, subject, countryRisk.getReason());
                }
            }

            // 2. Account number / BIC exact match
            if (screenAccountNumbers && subject.hasAccountIdentifier()) {
                List<WatchlistMatch> exactMatches =
                    watchlistRepository.findExactByIdentifier(
                        subject.getAccountIdentifier());
                if (!exactMatches.isEmpty()) {
                    return escalateHit(instruction, subject,
                        "Exact account/BIC match: " + subject.getAccountIdentifier());
                }
            }

            // 3. Fuzzy name matching
            String normalisedName = normaliser.normalise(subject.getName());
            List<WatchlistCandidate> candidates =
                watchlistRepository.findCandidates(normalisedName);

            for (WatchlistCandidate candidate : candidates) {
                double score = matchingEngine.score(normalisedName,
                    candidate.getNormalisedName());

                if (score >= fuzzyThreshold) {
                    alerts.add(ScreeningAlert.builder()
                        .subject(subject)
                        .candidate(candidate)
                        .score(score)
                        .matchType(MatchType.FUZZY_NAME)
                        .build());
                }
            }
        }

        // Audit every screening event
        auditRepository.save(ScreeningAuditRecord.builder()
            .paymentId(instruction.getId())
            .subjectsScreened(subjects.size())
            .alertCount(alerts.size())
            .listVersions(watchlistRepository.getCurrentVersions())
            .screenedAt(Instant.now())
            .result(alerts.isEmpty() ? "CLEAR" : "ALERT")
            .build());

        if (alerts.isEmpty()) {
            return ScreeningResult.clear(instruction.getId());
        }

        // Hold payment and notify compliance
        holdService.hold(instruction.getId(), HoldReason.SANCTION_ALERT);
        alertService.raiseAlerts(alerts);

        log.warn("Sanctions alert on payment {}: {} alerts raised",
            instruction.getId(), alerts.size());

        return ScreeningResult.potentialMatch(instruction.getId(), alerts);
    }

    private ScreeningResult escalateHit(PaymentInstruction instruction,
            ScreeningSubject subject, String reason) {
        holdService.holdPermanently(instruction.getId(), HoldReason.CONFIRMED_SANCTION);
        alertService.raiseConfirmedHit(instruction, subject, reason);
        log.error("CONFIRMED SANCTIONS HIT on payment {}: {}",
            instruction.getId(), reason);
        return ScreeningResult.confirmedMatch(instruction.getId(), reason);
    }

    private List<ScreeningSubject> extractAllSubjects(PaymentInstruction instruction) {
        List<ScreeningSubject> subjects = new ArrayList<>();

        // Parties
        subjects.add(ScreeningSubject.fromParty(instruction.getDebtor(),
            SubjectRole.DEBTOR));
        subjects.add(ScreeningSubject.fromParty(instruction.getCreditor(),
            SubjectRole.CREDITOR));

        // Agents / BICs
        subjects.add(ScreeningSubject.fromBic(instruction.getDebtorAgentBic(),
            SubjectRole.DEBTOR_AGENT));
        subjects.add(ScreeningSubject.fromBic(instruction.getCreditorAgentBic(),
            SubjectRole.CREDITOR_AGENT));

        // Optional parties
        if (instruction.hasUltimateDebtor()) {
            subjects.add(ScreeningSubject.fromParty(instruction.getUltimateDebtor(),
                SubjectRole.ULTIMATE_DEBTOR));
        }
        if (instruction.hasUltimateCreditor()) {
            subjects.add(ScreeningSubject.fromParty(instruction.getUltimateCreditor(),
                SubjectRole.ULTIMATE_CREDITOR));
        }

        // Intermediary agents
        instruction.getIntermediaryAgents().forEach(agent ->
            subjects.add(ScreeningSubject.fromBic(agent.getBic(),
                SubjectRole.INTERMEDIARY_AGENT)));

        return subjects.stream()
            .filter(ScreeningSubject::isScreenable)
            .collect(toList());
    }
}
```

---

## Screening in the Payment Lifecycle

```
                ┌────────────────────────────────────┐
                │    SCREENING TOUCHPOINTS            │
                ├────────────────────────────────────┤
  Onboarding ──►│ 1. KYC onboarding screen           │
                │    (customer + UBOs + directors)    │
                ├────────────────────────────────────┤
  Outbound   ──►│ 2. Pre-payment screen               │
  Payment       │    (all parties in pain.001)        │
                ├────────────────────────────────────┤
  Inbound    ──►│ 3. Inbound payment screen          │
  Payment       │    (all parties in pacs.008)        │
                ├────────────────────────────────────┤
  Scheduled  ──►│ 4. Periodic re-screen              │
  Batch         │    (existing customer base)         │
                ├────────────────────────────────────┤
  List Update──►│ 5. Delta screen on list change     │
                │    (re-screen against new entries)  │
                └────────────────────────────────────┘
```

---

## Related Concepts
- [aml_kyc.md](./aml_kyc.md) — Runs alongside sanctions; different purpose and lists
- [fraud.md](./fraud.md) — Third compliance check in the same pipeline
- [outbound.md](./outbound.md) — Sanctions check before payment is submitted
- [inbound.md](./inbound.md) — Sanctions check on received pacs.008
- [fis.md](./fis.md) — FI-level (BIC/country) sanctions screening
- [payment_exceptions.md](./payment_exceptions.md) — Sanctions holds as exceptions
- [swift.md](./swift.md) — SWIFT gpi and sanctions compliance