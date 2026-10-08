---
id: payment_return
title: Payment Returns — Interbank pacs.004 Mechanics, Return Codes & Suspense Accounting
sidebar_label: Payment Return
description: Comprehensive senior architectural guide to payment returns in banking systems, pacs.004 ISO 20022 return mechanics, return reason codes (AC01, AC04, BE04), double-entry suspense accounting, and settlement cut-off windows.
tags: [banking, ledger, returns, pacs004, iso20022, swift, npp, fednow, sepa]
---

# Payment Returns — Interbank pacs.004 Mechanics & Accounting

A **Payment Return** represents the active return of funds by the receiving institution ("Creditor Bank") back to the originating institution ("Debtor Bank") after an inbound payment has successfully traversed the interbank clearing network, but cannot be legally or technically applied to the beneficiary's account.

Unlike an immediate technical rejection (`pacs.002` RJCT) or an originating-side reversal (`pacs.007` / ISO 8583 0420), a payment return is a **post-acceptance financial movement**. It requires establishing a new interbank settlement obligation moving in reverse across the central bank reserve accounts, accompanied by the **`pacs.004.001.xx` (PaymentReturn)** ISO 20022 message.

---

## 1. Architectural Distinction: Return vs. Reversal vs. Rejection

Understanding where a payment fails determines which protocol message and accounting workflow must execute:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        PAYMENT FAILURE TAXONOMY & PROTOCOLS                            │
│                                                                                        │
│  PHASE 1: PRE-NETWORK VALIDATION                                                       │
│  Debtor Bank catches error before dispatching message.                                 │
│  ──► Action: Internal Ledger Cancellation / pain.002 (RJCT). NO INTERBANK MESSAGE.     │
│                                                                                        │
│  PHASE 2: IN-FLIGHT TECHNICAL NETWORK TIMEOUT                                          │
│  Debtor Bank sends pacs.008, but gateway times out or encounters socket disconnect.   │
│  ──► Action: Debit Reversal (pacs.007 / ISO 8583 0420). Compensating Ledger Saga.      │
│                                                                                        │
│  PHASE 3: SCHEME CLEARING GATEWAY REJECTION                                            │
│  Clearing switch rejects message due to schema validation or closed settlement cycle.  │
│  ──► Action: Negative Status Report (pacs.002 RJCT). No central bank funds settled.   │
│                                                                                        │
│  PHASE 4: POST-SETTLEMENT CREDITOR BANK FAILURE (PAYMENT RETURN)                       │
│  Funds cleared central bank reserves, but Creditor Bank cannot post to recipient.      │
│  ──► Action: PAYMENT RETURN (pacs.004). Funds wired backwards across clearing rails.   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. ISO 20022 Protocol Representation: The `pacs.004` Message

The `pacs.004` message binds the returning funds to the original credit transfer (`pacs.008`) using cryptographic references:

```xml
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.004.001.11">
  <PmtRtr>
    <GrpHdr>
      <MsgId>RTR-20261008-009128</MsgId>
      <CreDtTm>2026-10-08T15:20:11Z</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <SttlmInf>
        <SttlmMtd>CLRG</SttlmMtd>
        <ClrSys>
          <Prtry>SEPA</Prtry>
        </ClrSys>
      </SttlmInf>
    </GrpHdr>
    <TxInf>
      <RtrId>RTR-TX-77112</RtrId>
      <!-- Mandatory Linkage to Original pacs.008 Instruction -->
      <OrgnlGrpInf>
        <OrgnlMsgId>MSG-20261008-0004</OrgnlMsgId>
        <OrgnlMsgNmId>pacs.008.001.10</OrgnlMsgNmId>
      </OrgnlGrpInf>
      <OrgnlEndToEndId>E2E-INV-44019</OrgnlEndToEndId>
      <OrgnlTxId>TX-9988220011</OrgnlTxId>
      <OrgnlUETR>9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d</OrgnlUETR>
      
      <!-- Financial Values (Original vs. Returned) -->
      <OrgnlIntrBkSttlmAmt Ccy="EUR">4500.00</OrgnlIntrBkSttlmAmt>
      <RtrdIntrBkSttlmAmt Ccy="EUR">4500.00</RtrdIntrBkSttlmAmt>
      <RtrdIntrBkSttlmDt>2026-10-08</RtrdIntrBkSttlmDt>
      
      <!-- Standardized ISO Return Reason Code -->
      <RtrRsnInf>
        <Orgtr>
          <Id>
            <OrgId>
              <AnyBIC>BNPAFRPPXXX</AnyBIC>
            </OrgId>
          </Id>
        </Orgtr>
        <Rsn>
          <Cd>AC04</Cd> <!-- Account Closed -->
        </Rsn>
        <AddtlInf>Target IBAN closed on 2026-09-30</AddtlInf>
      </RtrRsnInf>
    </TxInf>
  </PmtRtr>
</Document>
```

---

## 3. Comprehensive Return Reason Codes (`<RtrRsnInf>/<Rsn>/<Cd>`)

Payment system rulebooks (e.g. EPC SEPA Rulebook, Federal Reserve FedNow Operating Circular) require receiving banks to provide standardized 4-character ISO codes detailing why the payment was returned:

| Return Code | Code Name | Root Cause & Operational Context |
|---|---|---|
| **`AC01`** | `IncorrectAccountNumber` | Target IBAN or Account Number has an invalid checksum, routing prefix, or does not exist. |
| **`AC04`** | `ClosedAccountNumber` | Target account is legally closed; funds cannot be accepted. |
| **`AC06`** | `BlockedAccount` | Target account is frozen due to legal court orders, bankruptcy, or internal administrative freeze. |
| **`AG01`** | `TransactionForbidden` | Account type does not permit credit transfers (e.g. child trust, loan account, restricted CD). |
| **`AM04`** | `InsufficientFunds` | Debtor account lacks funds (predominantly in Direct Debit `pacs.003` return flows). |
| **`BE04`** | `MissingCreditorAddress` | Regulatory AML Travel Rule violation; originator failed to supply full beneficiary address. |
| **`MD07`** | `EndCustomerDeceased` | Account holder is deceased; account assets frozen under probate law. |
| **`RR01`** | `MissingDebtorAccount` | Debtor details corrupted or missing from the original instruction. |
| **`RR04`** | `RegulatoryReason` | Regulatory compliance hold or sanctions screening match (OFAC / EU Sanctions). |
| **`MS03`** | `NotSpecifiedReason` | Catch-all generic code when counterparty bank withholds specific details. |

---

## 4. Double-Entry Accounting & Suspense Account Reconciliation

Because a payment return occurs after interbank settlement, handling the returned funds requires a multi-stage general ledger (GL) workflow:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        DOUBLE-ENTRY PAYMENT RETURN WORKFLOW                            │
│                                                                                        │
│  STEP 1: INBOUND SETTLEMENT CREDITED TO DEBTOR BANK                                    │
│  Central clearing rail deposits funds back into Debtor Bank's reserve account.         │
│                                                                                        │
│       DR (Debit)  Central Bank Reserve Settlement Account (#1001)       $4,500.00      │
│       CR (Credit) Inward Return Suspense Account (#2099)                     $4,500.00 │
│                                                                                        │
│  ────────────────────────────────────────────────────────────────────────────────────  │
│                                                                                        │
│  STEP 2: AUTOMATED MATCHING ENGINE                                                     │
│  Engine extracts OrgnlEndToEndId ("E2E-INV-44019") and OrgnlUETR.                     │
│  Queries internal Transaction Ledger to locate original customer debit.                │
│                                                                                        │
│  ────────────────────────────────────────────────────────────────────────────────────  │
│                                                                                        │
│  STEP 3: CUSTOMER ACCOUNT RESTORATION                                                  │
│  Matched successfully! Customer deposit balance is credited back.                      │
│                                                                                        │
│       DR (Debit)  Inward Return Suspense Account (#2099)               $4,500.00      │
│       CR (Credit) Customer Deposit Account (#2001-Alice)                     $4,500.00 │
│                                                                                        │
│  Net Suspense Balance: $0.00  |  Customer Balance: Fully Restored                      │
│  Customer Statement: "Payment Returned: AC04 - Target Account Closed"                  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### The Unmatched Exception Workflow
If an incoming `pacs.004` arrives with corrupted or truncated references (e.g. from an intermediary correspondent bank that scrubbed the `OrgnlEndToEndId`):
1. The return is posted into the **Unmatched Return Suspense Account (`#2099`)**.
2. An exception investigation case is opened in the bank's Treasury Operations queue.
3. An SLA timer (typically 48 hours) begins. If not resolved via manual operator lookup against central bank wire logs, the bank dispatches a payment status inquiry (`pacs.028`) to the returning bank.

---

## 5. Scheme Cut-Off Windows & Return Timeframes

Different payment rails enforce strict legal limits on how long a receiving bank has to return funds:

| Rail / System | Maximum Return Window | Rules Framework |
|---|---|---|
| **SEPA Instant (SCT Inst)** | $< 10\text{ seconds}$ (automated) | Immediate automated straight-through return |
| **SEPA Credit Transfer (SCT)** | $3\text{ business days}$ | Extended to 10 days for technical failures |
| **FedNow (US Real-Time)** | Immediate or intraday cut-off | Real-time liquidity adjustment |
| **Direct Debit (SEPA Core / BACS)** | **8 weeks** (no reason needed) / **13 months** (unauthorized) | Consumer protection against unauthorized debits |
| **Cross-Border SWIFT** | Up to $10\text{ business days}$ | Subject to correspondent chain multi-hop routing |

---

## Related Documentation

- [pain.004 — Architectural Clarification & Taxonomy](./pain004.md)
- [pacs.004 — Interbank Payment Return Deep Dive](./pacs004.md)
- [Debit Reversals & Distributed Saga Rollbacks](./debit_reversal.md)
- [pacs.008 — FI-to-FI Customer Credit Transfer](./pacs008.md)
- [On-Us vs. Off-Us Clearing Dynamics](./onus.md)
