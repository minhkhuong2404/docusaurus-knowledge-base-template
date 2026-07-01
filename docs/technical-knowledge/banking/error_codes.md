---
id: error_codes
title: Payment Error & Reason Codes Reference
sidebar_label: Error Codes Reference
sidebar_position: 99
description: Master lookup table for ISO 20022 reason codes, BECS dishonour codes, NPP rejection codes, and SWIFT error codes used in Australian and international payment processing.
tags: [banking, error-codes, reason-codes, iso20022, becs, npp, swift, reference]
---

# 📋 Payment Error & Reason Codes Reference

A comprehensive reference of all error, return, rejection, and status reason codes used across Australian and international payment systems.

---

## ISO 20022 — Payment Status Reason Codes

Used in: `pacs.002` (status report), `pacs.004` (return), `camt.055/056` (cancellation)

### Account-Related Codes (AC)

| Code | Full Name | Meaning | Action |
|------|-----------|---------|--------|
| `AC01` | IncorrectAccountNumber | Account number invalid format or check digit | Verify account format; request correct details |
| `AC02` | InvalidDebtorAccountNumber | Debtor account number invalid | Check debtor account |
| `AC03` | InvalidCreditorAccountNumber | Creditor account number invalid | Check creditor account |
| `AC04` | ClosedAccountNumber | Account has been closed | Obtain updated account details |
| `AC05` | ClosedDebtorAccountNumber | Debtor account closed | Contact debtor |
| `AC06` | BlockedAccount | Account is blocked/frozen | Contact account holder's bank |
| `AC07` | ClosedCreditorAccountNumber | Creditor account closed | Update creditor account details |
| `AC10` | InvalidDebtorAccountCurrency | Currency mismatch with account | Verify payment currency |
| `AC11` | InvalidCreditorAccountCurrency | Creditor account currency mismatch | Verify payment currency |
| `AC13` | InvalidDebtorAccountType | Account type cannot receive this payment | Use correct payment method |
| `AC14` | InvalidAgentAccount | Intermediary agent account invalid | Contact intermediary |

### Amount-Related Codes (AM)

| Code | Full Name | Meaning | Action |
|------|-----------|---------|--------|
| `AM01` | ZeroAmount | Amount is zero | Correct payment amount |
| `AM02` | NotAllowedAmount | Amount not within allowed range | Check scheme/account limits |
| `AM03` | NotAllowedCurrency | Currency not supported | Use supported currency |
| `AM04` | InsufficientFunds | Debtor account has insufficient funds | Advise customer; retry later |
| `AM05` | Duplication | Duplicate payment detected | Confirm if duplicate; void if confirmed |
| `AM06` | TooLowAmount | Amount below minimum | Increase amount or use different channel |
| `AM07` | BlockedAmount | Amount held/blocked | Contact bank for details |
| `AM09` | WrongAmount | Amount differs from agreed/expected | Verify agreement and resubmit |
| `AM10` | InvalidControlSum | Batch control sum doesn't match | Recalculate and resubmit batch |
| `AM11` | InvalidTransactionCurrency | Transaction currency invalid | Correct currency code |
| `AM12` | InvalidAmount | Amount format invalid | Fix amount format |
| `AM14` | ForbiddenAmount | Amount forbidden for this payment type | Use appropriate payment channel |

### Agent / Routing Codes (AG)

| Code | Full Name | Meaning | Action |
|------|-----------|---------|--------|
| `AG01` | TransactionForbidden | Transaction not permitted to/from this account | Contact bank for authorisation |
| `AG02` | InvalidBankOperationCode | Bank operation code invalid | Correct bank operation code |
| `AG03` | TransactionNotSupported | Transaction type not supported | Use alternative method |
| `AG04` | InvalidAgentCountry | Agent country code invalid | Correct country code |
| `AG05` | InvalidAgentAddress | Agent address details incorrect | Correct agent address |
| `AG06` | UnknownEndCustomer | End beneficiary unknown to bank | Verify beneficiary details |
| `AG07` | UnsuccesfulDirectDebit | Direct debit unsuccessfully executed | Check mandate; contact customer |
| `AG08` | InvalidAccessRights | No authority to debit/credit this account | Verify payment authority |
| `AG09` | UnsupportedMessageType | Message type not supported | Use correct message format |
| `AG10` | InvalidAgentBIC | Agent BIC code is invalid | Correct BIC code |

### Mandate Codes (MD)

| Code | Full Name | Meaning | Action |
|------|-----------|---------|--------|
| `MD01` | NoMandate | No mandate/authorisation exists | Obtain mandate before initiating |
| `MD02` | MissingMandatoryInformationInMandate | Mandate missing required fields | Complete mandate details |
| `MD03` | InvalidFileFormatForOtherThanPaymentInitiationAndCustomerPaymentStatusReport | File format error | Correct file format |
| `MD04` | InvalidFileFormatForPaymentInitiation | Payment initiation file format error | Correct format |
| `MD05` | CollectionNotDue | Collection date is not valid | Correct collection date |
| `MD06` | RefundRequestByEndCustomer | Customer requested reversal/refund | Process customer request |
| `MD07` | EndCustomerDeceased | Account holder is deceased | Contact estate/executors |

### Narrative / Miscellaneous

| Code | Full Name | Meaning | Action |
|------|-----------|---------|--------|
| `NARR` | Narrative | Free text explanation provided | Read narrative field in `<AddtlInf>` |
| `FF01` | InvalidFileFormat | Generic file format error | Fix and resubmit |
| `FF05` | InvalidLocalInstrument | Local instrument code invalid | Correct local instrument |
| `MS01` | NotSpecifiedReasonAgentGenerated | Reason not specified (agent) | Investigate with sending bank |
| `MS02` | NotSpecifiedReasonCustomerGenerated | Reason not specified (customer) | Contact customer |
| `MS03` | NotSpecifiedReasonFinancialInstitutionGenerated | Reason unspecified (FI) | Contact FI |
| `RC01` | BankIdentifierIncorrect | BIC/routing code incorrect | Correct bank identifier |
| `RC07` | InvalidCreditorBICIdentifier | Creditor BIC invalid | Fix and resubmit |
| `RR01` | MissingDebtorAccount | Debtor account missing | Complete debtor details |
| `RR02` | MissingDebtorNameOrAddress | Debtor name/address missing | Add debtor information |
| `RR03` | MissingCreditorNameOrAddress | Creditor name/address missing | Add creditor information |
| `RR04` | RegulatoryReason | Blocked for regulatory reasons | Provide regulatory information |
| `SL01` | SpecificServiceOfferedByDebtorAgent | Service offered by debtor agent | Contact debtor's bank |

---

## BECS Direct Entry — Return/Dishonour Codes

Used in BECS DE return files sent back to originating banks.

| Code | Reason | Common Cause | Creditor Action |
|------|--------|-------------|----------------|
| `01` | Refer to customer | Bank declines without explanation | Contact payer directly |
| `02` | Refer to customer with caution | Potential fraud concern | Do not resubmit; investigate |
| `03` | No authority to debit | No valid DDR/mandate | Obtain fresh mandate |
| `04` | Account closed | Account permanently closed | Obtain new account details |
| `05` | Account transferred to another ADI | Account moved to different bank | Get new BSB/account |
| `06` | Account inactive | Dormant/not transacting | Contact customer |
| `07` | Invalid BSB | BSB does not exist | Verify BSB format and value |
| `08` | Amount not agreed | Amount different from mandate | Reconcile with customer |
| `09` | Invalid account number | Format or checksum error | Verify account number |
| `10` | Customer deceased | Account holder has died | Contact estate |
| `11` | Account not found | BSB/account combination not found | Verify both BSB and account |
| `12` | Account not eligible for debits | Credit-only account type | Use different payment method |
| `13` | Non-sufficient funds (NSF) | Insufficient balance at debit time | Retry in future / contact customer |
| `14` | Funds withheld | Account under attachment or hold | Contact account holder |
| `15` | Duplicate transaction | Same debit already processed | Confirm duplicate; void if needed |
| `19` | Account number invalid for BSB | Account number doesn't match BSB | Verify account details |

---

## NPP / Osko Rejection Codes

NPP payments rejected by the receiving bank use ISO 20022 reason codes (subset):

| Code | Reason in NPP Context |
|------|-----------------------|
| `AC01` | Invalid PayID or BSB/account format |
| `AC04` | Closed account — PayID or BSB/account no longer active |
| `AC06` | Account blocked — compliance hold or fraud flag |
| `AM04` | Insufficient funds (NPP debit side) |
| `MD01` | PayTo payment: no active mandate |
| `AG01` | Payment forbidden — sanctioned party |
| `RR04` | Regulatory hold — AML review required |

---

## SWIFT Error Codes

### General SWIFT Errors (in FIN/gpi)

| Error Code | Category | Meaning |
|-----------|----------|---------|
| `T00` | Format | Format error in field |
| `T01` | Format | Character set error |
| `T26` | Code word | Invalid code word in field |
| `T28` | Format | Field too long |
| `T32` | Format | Amount format error |
| `T40` | Content | Invalid date |
| `T43` | Content | Invalid currency code |
| `T44` | Content | Amount exceeds maximum |
| `T50` | Business | Duplicate transaction reference |
| `D01` | Business | Funds insufficient |
| `D07` | Business | Beneficiary account closed |

### SWIFT gpi Rejection Codes

| Code | Meaning |
|------|---------|
| `CNCL` | Cancelled by sender |
| `RJCT` | Rejected — see reason code |
| `PDNG` | Pending — compliance review |
| `ACSC` | Accepted, settlement completed |
| `ACCC` | Accepted, credit to customer completed |

---

## pacs.002 Transaction Status Codes

Used in the `<TxSts>` field of pacs.002 status report:

| Code | Full Name | Meaning |
|------|-----------|---------|
| `ACTC` | AcceptedTechnicalValidation | Message technically valid; not yet business-validated |
| `ACCP` | AcceptedCustomerProfile | Passed customer-level validation |
| `ACSC` | AcceptedSettlementCompleted | Settlement confirmed (RTGS) |
| `ACSP` | AcceptedSettlementInProcess | Settlement initiated but not yet final |
| `ACWC` | AcceptedWithChange | Accepted but with modifications |
| `PDNG` | Pending | Awaiting processing (manual review, compliance hold) |
| `RJCT` | Rejected | Rejected — see `<StsRsnInf>` for reason code |
| `PART` | PartiallyAccepted | Some transactions in batch accepted, some rejected |

---

## camt.055/056 Cancellation Status Codes

| Code | Meaning |
|------|---------|
| `CNCL` | Cancellation accepted |
| `RJCT` | Cancellation rejected |
| `PDNG` | Cancellation pending — under investigation |
| `PART` | Partially cancelled (batch) |

Cancellation rejection reasons (`<RjctRsn>`):

| Code | Meaning |
|------|---------|
| `LEGL` | Legal decision — cannot cancel |
| `ARDT` | Already returned |
| `NOAS` | No answer from beneficiary's bank |
| `NOOR` | No original transaction found |
| `PTNA` | Payment too near to processing; cannot cancel |
| `CUST` | Beneficiary customer declined cancellation |
| `AGNT` | Incorrect agent details |

---

## Error Code Lookup Approach in Code

```java
public enum Iso20022ReasonCode {
    AC01("IncorrectAccountNumber", "Account number invalid format"),
    AC04("ClosedAccountNumber", "Account has been closed"),
    AM04("InsufficientFunds", "Insufficient balance"),
    MD01("NoMandate", "No active mandate found"),
    NARR("Narrative", "See narrative for details");

    private final String shortName;
    private final String description;

    public ReturnAction getRecommendedAction() {
        return switch (this) {
            case AC04, AC07 -> ReturnAction.REQUEST_NEW_ACCOUNT_DETAILS;
            case AM04 -> ReturnAction.RETRY_LATER;
            case MD01 -> ReturnAction.OBTAIN_MANDATE;
            case AC01, AC03 -> ReturnAction.VERIFY_ACCOUNT_FORMAT;
            default -> ReturnAction.INVESTIGATE;
        };
    }
}

// Map BECS dishonour to ISO 20022 (for PayTo migration)
public Iso20022ReasonCode fromBecsDishonour(String becsCode) {
    return switch (becsCode) {
        case "04" -> Iso20022ReasonCode.AC04; // Account closed
        case "13" -> Iso20022ReasonCode.AM04; // NSF
        case "03" -> Iso20022ReasonCode.MD01; // No mandate
        case "07" -> Iso20022ReasonCode.AC01; // Invalid BSB (= account format)
        case "15" -> Iso20022ReasonCode.AM05; // Duplicate
        default   -> Iso20022ReasonCode.NARR;
    };
}
```

---

## Related Concepts

- [pacs.002](./pacs002)
- [pacs.004](./pacs004)
- [Payment Return](./payment_return)
- [Payment Exceptions](./payment_exceptions)
- [Direct Debit](./direct_debit)
- [BECS](./becs)
- [PayTo](./payto)
