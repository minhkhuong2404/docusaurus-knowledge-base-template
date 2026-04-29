---
title: Debtor
description: Overview of the debtor role in payment messages.
tags: [banking, debtor, iso20022]
---

# Debtor

The debtor is the party whose account is debited to fund a payment instruction.

## Overview

In ISO 20022 and payment operations, the debtor is the legal and financial source of funds. The debtor may be:
- an individual customer
- a business account holder
- a treasury entity for corporate or institutional payments

The debtor role appears across initiation, clearing, settlement reporting, and investigations.

## Debtor in Message Context

Typical debtor-related elements include:
- `Dbtr` (debtor party details)
- `DbtrAcct` (debtor account)
- `DbtrAgt` (debtor bank/agent)

These are used in `pain.001`, transformed into interbank messages (e.g., `pacs.008`), and referenced in status/return flows.

## Debtor Responsibilities in Payment Flow

- Provide valid payment instruction and beneficiary details
- Maintain sufficient available balance
- Pass authentication/authorization controls
- Comply with product and legal restrictions

For direct debit, debtor consent (mandate) must already exist for creditor-initiated pulls.

## Key Debtor Risk Checks

- Account active and not blocked/frozen
- Available balance and overdraft limits
- Velocity and product limits
- AML/sanctions/fraud screening context
- Name/account validation policies where required

## Debtor vs Debtor Agent

- **Debtor:** payer customer/entity
- **Debtor Agent:** bank that services debtor account and executes debit

This distinction is important in multi-bank flows, especially for off-us transfers.

## Related Concepts

- [pain.001](./pain001)
- [Direct Debit](./direct_debit)
- [Outbound Payments](./outbound)
- [Off-Us Transactions](./offus)
