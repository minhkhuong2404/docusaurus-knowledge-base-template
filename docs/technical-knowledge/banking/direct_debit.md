---
title: Direct Debit
description: Overview of direct debit payment flows.
tags: [banking, direct-debit, payments]
---

# Direct Debit

Direct debit allows a payee to collect funds from a payer account under a valid mandate.

## Overview

Direct debit is a pull-payment model. Unlike credit transfer (push), the payee initiates collection from the debtor account after customer authorization (mandate).

Common uses:
- Utility and telecom billing
- Loan repayments
- Subscription collection
- Corporate receivables automation

## Parties in Direct Debit

- **Debtor:** payer whose account is debited
- **Creditor:** biller/payee collecting funds
- **Debtor bank:** account holding bank for payer
- **Creditor bank:** bank for biller
- **Scheme/clearing operator:** rail that routes and settles collections

## High-Level Flow

```text
Mandate creation (customer authorizes creditor)
  -> Creditor submits debit instruction batch
  -> Clearing and validation
  -> Debtor bank debits account
  -> Settlement between banks
  -> Creditor receives funds and remittance
```

## Mandate Management

Strong mandate governance is critical:
- capture explicit customer consent
- store mandate reference and effective dates
- support pauses/cancellation and expiry
- ensure instruction references mandate at collection time

Missing or invalid mandate is a primary return/reject reason.

## Returns and Disputes

Direct debit has well-defined return/dispute windows by scheme:
- technical return (account closed/invalid)
- insufficient funds return
- unauthorized debit claim
- customer dispute/chargeback-style reversal

Operational teams need reason-code workflows and customer communication templates.

## Direct Debit vs Credit Transfer

| Dimension | Direct Debit | Credit Transfer |
|---|---|---|
| Initiator | Creditor/Payee | Debtor/Payer |
| Payment model | Pull | Push |
| Authorization | Mandate required | Payment instruction authentication |
| Risk emphasis | Mandate and dispute risk | Fraud and beneficiary risk |

## Related Concepts

- [Debtor](./debtor)
- [Payment Return](./payment_return)
- [pain.007 & pacs.007](./pain007_pacs007)
- [Clearing](./clearing)
