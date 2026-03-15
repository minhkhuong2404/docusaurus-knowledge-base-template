---
id: iso20022_migration
title: ISO 20022 Migration
sidebar_label: ISO 20022 Migration
sidebar_position: 2
description: Overview of ISO 20022 Migration.
tags: [banking, iso20022, migration, iso]
---

# ISO 20022 Migration

## Overview

**ISO 20022** is the global standard for financial messaging, replacing a range of legacy formats (SWIFT MT, proprietary flat files, EDIFACT). The migration is the **largest change to financial messaging infrastructure in decades**, affecting thousands of institutions worldwide.

- **Standard body:** ISO (International Organization for Standardization)
- **Scope:** Payments, securities, FX, trade finance
- **Timeline:** 2022–2025 (cross-border); ongoing for domestic systems
- **Key driver:** Richer data, better reconciliation, improved compliance

---

## Why ISO 20022?

| Problem with Legacy (MT) | ISO 20022 Solution |
|-------------------------|-------------------|
| Limited remittance data (140 chars) | Structured unlimited remittance data |
| No standardised party identifiers | LEI, BIC, IBAN as first-class fields |
| Proprietary field formats | Standardised XML / JSON schemas |
| Poor machine-readability | Fully structured, XSD-validated |
| Hard to add new fields | Extensible by design |
| Weak for AML/sanctions | Rich party data improves screening |
| SWIFT-proprietary | Truly global standard used by all networks |

---

## ISO 20022 Message Families in Banking

### Payment Messages (pacs., pain., camt.)

```
Initiation (Customer → Bank):
  pain.001  CustomerCreditTransferInitiation
  pain.002  CustomerPaymentStatusReport
  pain.007  CustomerPaymentReversal
  pain.008  CustomerDirectDebitInitiation

Interbank (Bank → Bank):
  pacs.002  FIToFIPaymentStatusReport
  pacs.003  FIToFICustomerDirectDebit
  pacs.004  PaymentReturn
  pacs.007  FIToFIPaymentReversal
  pacs.008  FIToFICustomerCreditTransfer
  pacs.009  FinancialInstitutionCreditTransfer
  pacs.010  FinancialInstitutionDirectDebit

Cash Management (Bank → Customer):
  camt.052  BankToCustomerAccountReport (intraday)
  camt.053  BankToCustomerStatement (EOD)
  camt.054  BankToCustomerDebitCreditNotification
  camt.055  CustomerPaymentCancellationRequest
  camt.056  FIToFIPaymentCancellationRequest
  camt.057  NotificationToReceive
  camt.058  NotificationToReceiveStatusReport
  camt.060  AccountReportingRequest
```

---

## SWIFT ISO 20022 Migration Timeline

```
Nov 2021  ─── SWIFT gpi co-existence period begins
              MT + MX messages both accepted

Nov 2022  ─── Full co-existence period (MT + MX live)
              Migration starts: pacs.008, pacs.009, pacs.004
              Banks begin testing ISO 20022 on cross-border

Mar 2023  ─── Mandatory UETR on all MT103 messages
              (backporting traceability to legacy)

Nov 2025  ─── MT messages retired for cross-border payments
              pacs.008 replaces MT103
              pacs.009 replaces MT202/MT202COV
              camt.053 replaces MT940/MT950
              camt.054 replaces MT900/MT910

Nov 2025+ ─── ISO 20022 only for cross-border via SWIFT
```

---

## MT to MX Mapping (Key Fields)

### MT103 → pacs.008

| MT103 Field | MX pacs.008 Field | Notes |
|------------|------------------|-------|
| `:20:` TxRef | `CdtTrfTxInf/PmtId/InstrId` | Instruction reference |
| `:21:` RelatedRef | `CdtTrfTxInf/PmtId/EndToEndId` | E2E reference |
| `:23B:` BankOpCode | `CdtTrfTxInf/PmtTpInf/SvcLvl` | CRED → normal |
| `:32A:` Amount | `IntrBkSttlmAmt + IntrBkSttlmDt` | Settlement amount + date |
| `:33B:` InstructedAmt | `CdtTrfTxInf/InstdAmt` | Original instructed amount |
| `:50K:` Debtor | `Dbtr/Nm + DbtrAcct/Id` | Payer details |
| `:52A:` OrderingInst | `DbtrAgt/FinInstnId/BICFI` | Debtor bank BIC |
| `:53B:` SenderCorr | `IntrmyAgt1/FinInstnId/BICFI` | Correspondent bank |
| `:57A:` AcctWithInst | `CdtrAgt/FinInstnId/BICFI` | Creditor bank BIC |
| `:59:` Beneficiary | `Cdtr/Nm + CdtrAcct/Id` | Payee details |
| `:70:` Remittance | `RmtInf/Ustrd` | Payment reference |
| `:71A:` Charges | `ChrgBr` | OUR→DEBT, BEN→CRED, SHA→SHAR |
| `:72:` SenderToRcvr | `InstrForNxtAgt` | Bank-to-bank info |

---

## Truncation Problem

A key challenge during migration: ISO 20022 fields are **longer and richer** than MT fields. When converting MX→MT (or vice versa), data may be **truncated**:

```
ISO 20022 Creditor Name:  "International Widget Manufacturing Co. Pty Ltd"
MT103 :59: limit:          35 characters
Truncated to:              "International Widget Manufacturi"

Impact:
  ├── Creditor name doesn't match account
  ├── Sanctions screening may miss match (or false positive)
  ├── Reconciliation failure at creditor bank
  └── Compliance record incomplete
```

### SWIFT Truncation Rules
- SWIFT has published mandatory truncation rules for co-existence
- Banks must implement structured translation, not blind truncation
- LEI is preferred to name where available (stable, not truncatable)

---

## Enhanced Remittance Data

One of the biggest benefits of ISO 20022 over MT103:

```
MT103 :70: (140 chars, unstructured):
/INV/20240615/USD5000

ISO 20022 RmtInf (structured):
<RmtInf>
  <Strd>
    <RfrdDocInf>
      <Tp>
        <CdOrPrtry><Cd>CINV</Cd></CdOrPrtry>   ← Invoice
      </Tp>
      <Nb>INV-20240615-001</Nb>                  ← Invoice number
      <RltdDt>2024-06-15</RltdDt>                ← Invoice date
    </RfrdDocInf>
    <RfrdDocAmt>
      <DuePyblAmt Ccy="USD">5000.00</DuePyblAmt>
      <DscntApldAmt Ccy="USD">250.00</DscntApldAmt>  ← Discount
      <RmtdAmt Ccy="USD">4750.00</RmtdAmt>
    </RfrdDocAmt>
  </Strd>
</RmtInf>
```

This enables **automated invoice matching** in ERP systems — no manual reconciliation.

---

## Australian ISO 20022 Adoption

| System | Format | Status |
|--------|--------|--------|
| **NPP** | ISO 20022 MX from inception | ✅ Live since 2018 |
| **HVCS / RTGS** | ISO 20022 MX | ✅ Live |
| **BECS** | Proprietary flat file | 🔄 Migration planned (long-term) |
| **SWIFT cross-border** | MT (legacy) + MX (migration) | 🔄 Co-existence → MX-only Nov 2025 |
| **Direct Debit (PayTo)** | ISO 20022 MX | ✅ Live since 2022 |

---

## Migration Challenges for Banks

| Challenge | Detail | Mitigation |
|-----------|--------|-----------|
| **System replacement** | Core banking systems may not support XML | Middleware translation layer |
| **Data mapping** | MT fields don't map 1:1 to MX | Detailed field mapping spec |
| **Truncation** | Rich MX data truncated on MT-era systems | SWIFT truncation guidelines |
| **Testing** | Thousands of message variants to test | Automated test harness |
| **Counterparty readiness** | Not all peers migrated at same pace | Co-existence / translation |
| **Regulatory reporting** | LEI, structured data new requirements | Data enrichment pipeline |

---

## Java Spring Migration Notes

```java
// Translation service — MT103 ↔ pacs.008
@Service
public class MtMxTranslationService {

    /**
     * Translate legacy MT103 to ISO 20022 pacs.008
     * Used during SWIFT co-existence period
     */
    public FIToFICustomerCreditTransferV10 mt103ToPacs008(Mt103 mt103) {
        var msg = new FIToFICustomerCreditTransferV10();
        var tx = new CreditTransferTransaction50();
        
        // Payment IDs
        var pmtId = new PaymentIdentification7();
        pmtId.setInstrId(mt103.getField20());      // :20: → InstrId
        pmtId.setEndToEndId(mt103.getField21());   // :21: → EndToEndId
        // Generate UETR if not present (mandatory in MX)
        pmtId.setUETR(UUID.randomUUID().toString());
        tx.setPmtId(pmtId);
        
        // Amount (may need currency conversion formatting)
        var amt = parseAmount(mt103.getField32A());
        tx.setIntrBkSttlmAmt(amt);
        
        // Debtor — :50K:
        var dbtr = new PartyIdentification135();
        dbtr.setNm(mt103.getField50K().getName());
        tx.setDbtr(dbtr);
        
        // Creditor — :59:
        var cdtr = new PartyIdentification135();
        cdtr.setNm(mt103.getField59().getName());
        tx.setCdtr(cdtr);
        
        // Remittance — :70:
        var rmtInf = new RemittanceInformation21();
        rmtInf.getUstrd().add(mt103.getField70());
        tx.setRmtInf(rmtInf);
        
        // Charge bearer — :71A:
        tx.setChrgBr(mapChargeBearer(mt103.getField71A()));
        
        msg.getCdtTrfTxInf().add(tx);
        return msg;
    }
    
    private ChargeBearerType1Code mapChargeBearer(String mt71a) {
        return switch (mt71a) {
            case "OUR" -> ChargeBearerType1Code.DEBT;
            case "BEN" -> ChargeBearerType1Code.CRED;
            case "SHA" -> ChargeBearerType1Code.SHAR;
            default    -> ChargeBearerType1Code.SLEV;
        };
    }
}
```

---

## Related Concepts
- [pacs008.md](./pacs008.md) — Primary ISO 20022 payment message
- [swift.md](./swift.md) — SWIFT MT messages being replaced
- [pain001.md](./pain001.md) — Customer-side ISO 20022 message
- [camt053.md](./camt053.md) — Replaces MT940 statement
- [fis.md](./fis.md) — FI readiness for ISO 20022 migration
