---
title: Inbound Payments
description: Overview of inbound payment flows in banking systems.
tags: [banking, payments, inbound]
---

# Inbound Payments

Inbound payments are credits arriving from an external scheme or bank into your institution.

## Overview

Inbound flows start when your bank receives a payment instruction from another institution through a payment rail. Your bank acts as creditor bank (beneficiary bank) and decides whether to accept, reject, hold, or return the payment.

## Inbound Flow (Reference)

```text
Scheme / Counterparty Message In
  -> Technical validation (schema, signature, channel)
  -> Business validation (account, amount, status)
  -> Compliance checks (sanctions/AML/fraud controls)
  -> Credit posting to beneficiary account
  -> Notification to customer (camt.054 / channel alert)
  -> Reconciliation and settlement confirmation
```

## Key Decisions in Inbound Processing

- **Accept:** account valid, controls passed, funds credited
- **Reject:** immediate refusal due to invalid message/account/state
- **Hold:** pending review (sanctions hit, fraud alert, legal hold)
- **Return:** send funds back after prior acceptance (e.g., account closed later discovered)

## Account and Product Rules

Common inbound checks:
- Beneficiary account exists and is open
- Account accepts inbound credits (not restricted/closed)
- Currency compatibility with account product
- Name-check or payee verification rules where applicable

## Inbound Returns and Investigations

Inbound credit may still be reversed/returned under scheme rules:
- `pacs.004` for return of previously credited payment
- `camt.056` / investigations for cancellation requests
- manual exception queues for ambiguous cases

Strong traceability (`EndToEndId`, instruction references, settlement IDs) is essential for operations.

## Inbound in On-Us vs Off-Us Context

- **On-us:** payer and payee internal; inbound is effectively an internal credit event
- **Off-us:** true interbank inbound from external participant/scheme

Most operational complexity appears in off-us inbound due to network dependencies and counterparties.

## Related Concepts

- [Outbound Payments](./outbound)
- [Off-Us Transactions](./offus)
- [On-Us Transactions](./onus)
- [Credit Posting](./credit_post)
- [Payment Return](./payment_return)
