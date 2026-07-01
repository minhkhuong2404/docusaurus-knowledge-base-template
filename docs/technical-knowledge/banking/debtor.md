---
id: debtor
title: Debtor — The Paying Party in a Payment
sidebar_label: Debtor
sidebar_position: 4
description: Complete guide to the debtor (paying party) in ISO 20022 payment messages — Debtor vs Originator vs Ultimate Debtor, SWIFT vs ISO fields, debtor agent, and identification.
tags: [banking, debtor, iso20022, pain001, pacs008, originator, ultimate-debtor]
---

# 👤 Debtor — The Paying Party in a Payment

The **Debtor** is the party whose account is debited — the entity that **owes** the money and from whose account funds are ultimately withdrawn. Understanding the debtor structure is essential for correct ISO 20022 message construction and for AML/compliance traceability requirements.

---

## Debtor vs Originator vs Ultimate Debtor

ISO 20022 distinguishes multiple parties on the "paying side":

| Party | Role | ISO 20022 Field |
|-------|------|----------------|
| **Ultimate Debtor** | The true economic originator — who the payment is ultimately from | `<UltmtDbtr>` |
| **Debtor** | The account holder whose account is debited | `<Dbtr>` |
| **Debtor Agent** | The debtor's bank (the bank holding the debtor's account) | `<DbtrAgt>` |
| **Instructing Party** | The entity submitting the payment instruction (may differ from debtor in corporate treasury setups) | `<InitgPty>` (pain.001) |

### Example: Corporate Treasury Payment

A multinational's treasury centre (Singapore) initiates a payment on behalf of the Australian subsidiary:

```
Ultimate Debtor: "ABC Corp Australia Pty Ltd" (the entity making the payment)
Debtor:          "ABC Corp Treasury Singapore Pte Ltd" (account being debited)
Debtor Agent:    DBS Bank Singapore (holds the treasury account)
Initiating Party: TreasuryDirect Ltd (payment factory / ERP)
```

---

## Debtor in pain.001 (Customer Initiation)

The pain.001 message captures the debtor at customer instruction time:

```xml
<PmtInf>
  <!-- Debtor = account being debited -->
  <Dbtr>
    <Nm>John Smith</Nm>
    <PstlAdr>
      <Ctry>AU</Ctry>
      <AdrLine>123 Collins Street Melbourne VIC 3000</AdrLine>
    </PstlAdr>
    <Id>
      <PrvtId>
        <DtAndPlcOfBirth>
          <BirthDt>1980-05-15</BirthDt>
          <CtryOfBirth>AU</CtryOfBirth>
        </DtAndPlcOfBirth>
      </PrvtId>
    </Id>
  </Dbtr>

  <!-- Debtor's account at the bank -->
  <DbtrAcct>
    <Id>
      <Othr>
        <Id>12345678</Id>           <!-- Account number -->
        <SchmeNm><Cd>BBAN</Cd></SchmeNm>
      </Othr>
    </Id>
    <Tp><Cd>CACC</Cd></Tp>         <!-- Current account -->
    <Ccy>AUD</Ccy>
  </DbtrAcct>

  <!-- Debtor's bank (by BIC or routing code) -->
  <DbtrAgt>
    <FinInstnId>
      <BICFI>ANZBAU3MXXX</BICFI>   <!-- ANZ Bank BIC -->
      <ClrSysMmbId>
        <ClrSysId><Cd>AUBSB</Cd></ClrSysId>
        <MmbId>012-000</MmbId>      <!-- BSB -->
      </ClrSysMmbId>
    </FinInstnId>
  </DbtrAgt>

  <!-- Optional: who the payment is truly from -->
  <UltmtDbtr>
    <Nm>Jane Doe</Nm>              <!-- If different from account holder -->
  </UltmtDbtr>
</PmtInf>
```

---

## Debtor in pacs.008 (Interbank Transfer)

When the debtor bank forwards the payment to the creditor bank, the pacs.008 preserves the debtor details:

```xml
<CdtTrfTxInf>
  <Dbtr>
    <Nm>John Smith</Nm>
  </Dbtr>
  <DbtrAcct>
    <Id><Othr><Id>12345678</Id></Othr></Id>
  </DbtrAcct>
  <DbtrAgt>
    <FinInstnId>
      <BICFI>ANZBAU3MXXX</BICFI>
    </FinInstnId>
  </DbtrAgt>
  <UltmtDbtr>
    <Nm>Jane Doe</Nm>
  </UltmtDbtr>
</CdtTrfTxInf>
```

The debtor details are propagated **unchanged** through the payment chain for:
- AML/sanctions re-screening at correspondent banks
- AUSTRAC IFTI reporting
- Beneficiary reconciliation
- Dispute resolution

---

## Debtor Identification Types

ISO 20022 supports multiple identification formats for the debtor:

### For Individuals (`<PrvtId>`)

| Sub-element | Description |
|-------------|-------------|
| `<DtAndPlcOfBirth>` | Date and country of birth |
| `<Othr>` | Passport number, tax ID, driver's licence |

### For Organisations (`<OrgId>`)

| Sub-element | Description | Example |
|-------------|-------------|---------|
| `<BICOrBEI>` | BIC code | `ANZBAU3M` |
| `<LEI>` | Legal Entity Identifier (ISO 17442) | `HWUPKR0MPOU8FGXBT394` |
| `<Othr><SchmeNm><Cd>TXID</Cd>` | Tax ID (ABN for Australia) | `12345678901` |
| `<Othr><SchmeNm><Cd>CUST</Cd>` | Customer number | Internal bank reference |

---

## Debtor vs SWIFT MT103

In the legacy MT103 format, debtor-related parties map to:

| MT103 Field | ISO 20022 Equivalent | Description |
|-------------|---------------------|-------------|
| `:50A:` or `:50K:` | `<Dbtr>` + `<DbtrAcct>` | Ordering Customer (Debtor) |
| `:52A:` | `<DbtrAgt>` | Ordering Institution (Debtor's Bank) |
| `:56A:` | `<IntrmyAgt1>` | Intermediary institution |
| `:72:` field 50G: | `<UltmtDbtr>` | Ultimate Ordering Customer (if different) |

### MT103 `:50K:` Example

```
:50K:/12345678
John Smith
123 Collins Street
Melbourne VIC 3000
Australia
```

This maps to:
- `<DbtrAcct>` → account 12345678
- `<Dbtr><Nm>` → John Smith
- `<Dbtr><PstlAdr>` → address lines

---

## AML Significance of the Debtor

The debtor is a **primary screening target** for AML and sanctions:

1. **Sanctions screening**: Debtor name + address checked against OFAC, UN, DFAT, AUSTRAC lists
2. **PEP check**: Is the debtor a Politically Exposed Person?
3. **IFTI reporting**: Debtor details included in AUSTRAC report for all international transfers
4. **KYC anchor**: The debtor's identity is the foundation of the bank's Know Your Customer obligation
5. **Correspondent screening**: Correspondent banks re-screen the debtor in pacs.008

```java
// Debtor screening example
public ScreeningResult screenDebtor(Debtor debtor) {
    SanctionsResult sanctions = sanctionsEngine.screen(
        debtor.getName(),
        debtor.getCountry(),
        debtor.getIdentification()
    );

    PepResult pep = pepChecker.check(
        debtor.getName(),
        debtor.getDateOfBirth(),
        debtor.getCountry()
    );

    return ScreeningResult.builder()
        .debtorName(debtor.getName())
        .sanctionsResult(sanctions)
        .pepResult(pep)
        .requiresEnhancedDueDiligence(pep.isPep() || sanctions.isFuzzyMatch())
        .build();
}
```

---

## Common Misunderstandings

| Misconception | Correct Understanding |
|--------------|----------------------|
| "Debtor = who initiates the payment" | Debtor = whose account is debited. Initiating party may differ (corporate treasury, payment factory) |
| "UltimateDebtor is always populated" | UltimateDebtor is optional — only needed when the true economic payor differs from the account holder |
| "Debtor Agent is the same as the sending bank" | Usually yes, but in indirect clearing the debtor agent may use a sponsor/aggregator bank |

---

## Related Concepts

- [pain.001](./pain001)
- [pacs.008](./pacs008)
- [AML, CTF & KYC](./aml_kyc)
- [Sanctions Screening](./sanction)
- [Correspondent Banking](./correspondent_banking)
- [SWIFT](./swift)
- [Outbound Payments](./outbound)
