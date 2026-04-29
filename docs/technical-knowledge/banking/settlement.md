---
title: Settlement
description: Overview of settlement in payment systems.
tags: [banking, settlement, payments]
---

# Settlement

Settlement is the final transfer of funds between participants to discharge cleared payment obligations.

## Overview

Settlement is where value actually moves between institutions. Clearing determines who owes whom; settlement discharges that obligation.

Without settlement finality, a payment is not economically complete.

## Clearing vs Settlement

| Stage | Purpose | Output |
|---|---|---|
| Clearing | Exchange instructions and compute obligations | Net or gross positions |
| Settlement | Move funds to discharge obligations | Final transfer between participants |

## Settlement Models

### Real-Time Gross Settlement (RTGS)

- Each payment settles individually in near real time
- High liquidity demand
- High finality and low credit risk
- Common for high-value/urgent rails

### Deferred Net Settlement (DNS)

- Payments are accumulated and netted over a cycle
- Lower liquidity requirement
- Settlement risk exists until cycle completion
- Common for batch ACH/direct entry models

## Internal (On-Us) vs Interbank (Off-Us)

- **On-us:** settlement is internal ledger posting only
- **Off-us:** settlement occurs via central bank accounts, scheme settlement accounts, or correspondent nostro/vostro arrangements

## Settlement Finality

Settlement finality means the transfer is irrevocable under scheme/legal rules. It is crucial for:
- Liquidity and treasury certainty
- Risk management
- Dispute and exception boundaries

Teams should explicitly model states: `initiated -> clearing_accepted -> settlement_pending -> settled_final`.

## Settlement Risk Types

- **Credit risk:** counterparty fails before settlement
- **Liquidity risk:** participant cannot fund position in time
- **Operational risk:** outages delay or misstate obligations
- **Legal risk:** unclear finality or jurisdictional conflict

## Engineering and Operations Considerations

- Reconcile clearing totals vs settlement totals per cycle
- Keep immutable settlement events linked to payment references
- Monitor cut-offs and funding windows
- Trigger escalation for settlement pending beyond SLA
- Protect against duplicate settlement updates with idempotency keys

## Related Concepts

- [Clearing](./clearing)
- [Reconciliation](./reconciliation)
- [Outbound Payments](./outbound)
- [Inbound Payments](./inbound)
- [Off-Us Transactions](./offus)
