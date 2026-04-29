---
title: Outbound Payments
description: Overview of outbound payment flows in banking systems.
tags: [banking, payments, outbound]
---

# Outbound Payments

Outbound payments are instructions initiated by your institution to transfer funds to another bank or scheme.

## Overview

Outbound payments start from your bank's customer channels (mobile app, internet banking, API, file upload) and move outward to another institution or scheme participant.

Most outbound flows begin with `pain.001` (customer to bank) and become `pacs.008` (FI to FI), with status/notification messages throughout processing.

## Outbound Flow (Reference)

```text
Customer Initiation
  -> Channel/Auth
  -> Validation (account, limits, format)
  -> Risk/Compliance (fraud, AML, sanctions)
  -> Funds check + debit posting
  -> Routing (on-us vs off-us, rail selection)
  -> Scheme submission / counterparty send
  -> Acknowledgements and final confirmation
```

## On-Us vs Off-Us in Outbound

- **On-us:** recipient account also in your bank; no external clearing required
- **Off-us:** recipient at another bank; send via NPP/BECS/SWIFT/card rail

This decision is a critical routing gate and should be deterministic and auditable.

## Key Validation and Decision Points

- Customer authentication and authorization
- Debtor account status (active, not blocked, allowed for payments)
- Amount, velocity, and product limit checks
- Cut-off/time-window rules by scheme
- Currency and FX handling
- Beneficiary and remittance validation

## Posting and Ledger Treatment

- Debit posting can be memo-first then hard-post after network acceptance, or hard-post directly based on product design
- For off-us, suspense/settlement bridge accounts are often used until final confirmation
- Reversals and returns must preserve accounting traceability to original instruction IDs

## Operations and Exceptions

Outbound teams must handle:
- Rejects (`pacs.002` with negative status)
- Timeouts / unknown status
- Late returns (`pacs.004`)
- Customer cancellation requests (`camt.055` / `camt.056`)

Each scenario should map to a standard case workflow with SLA ownership.

## Related Concepts

- [Inbound Payments](./inbound)
- [On-Us Transactions](./onus)
- [Off-Us Transactions](./offus)
- [pacs.008](./pacs008)
- [pacs.002](./pacs002)
- [Payment Exceptions](./payment_exceptions)
