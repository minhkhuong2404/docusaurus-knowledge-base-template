---
title: Clearing
description: Overview of clearing in payment processing.
tags: [banking, clearing, payments]
---

# Clearing

Clearing is the process of exchanging payment instructions and validating obligations before settlement.

## Overview

Clearing is the stage where payment participants exchange instructions, perform rule checks, and calculate obligations. It sits between payment initiation and settlement.

For off-us payments, clearing is mandatory. For on-us payments, clearing is often a simplified internal routing/validation step.

## What Happens During Clearing

- Message exchange through a rail (NPP, ACH/direct entry, card network, SWIFT chain)
- Syntax and schema validation
- Participant and account-level rule checks
- Duplicate/idempotency checks
- Position calculation (gross or net)
- Acknowledgements and status messaging

## Clearing Flow (Off-Us)

```text
Sending bank releases payment
  -> Clearing network validates and routes
  -> Receiving bank validates and accepts/rejects
  -> Status returned (e.g., pacs.002)
  -> Obligation prepared for settlement
```

## Gross vs Net Clearing Outcomes

- **Gross:** obligation tracked per transaction (often near real-time)
- **Net:** obligations aggregated per participant over a cycle

The clearing design directly affects liquidity and settlement risk.

## Common Clearing Exceptions

- Invalid beneficiary account
- Unsupported currency/product
- Cut-off missed
- Participant unavailable
- Duplicate instruction detected

Each exception must map to a deterministic status and customer-facing narrative.

## Clearing Data Needed for Reconciliation

Keep the following keys for downstream matching:
- Original instruction identifiers (`MsgId`, `InstrId`, `EndToEndId`)
- Network reference IDs
- Scheme cycle/batch IDs
- Participant/member IDs
- Timestamps for send/ack/accept/reject

## Related Concepts

- [Settlement](./settlement)
- [Reconciliation](./reconciliation)
- [Off-Us Transactions](./offus)
- [pacs.002](./pacs002)
