---
title: camt.054 Notification
description: Overview of ISO 20022 camt.054 notifications.
tags: [banking, iso20022, camt054]
---

# camt.054

camt.054 is the ISO 20022 debit/credit notification message for reporting booked entries or notifications.

## Overview

`camt.054` (`BankToCustomerDebitCreditNotification`) provides debit/credit event notifications to customers, usually near real time or in frequent batches. It is commonly used for transaction alerts and receivables processing.

## Typical Use Cases

- Outbound debit advice after payment execution
- Inbound credit notification to beneficiary
- Corporate receivables auto-matching with remittance details
- Triggering downstream workflows (posting, notifications, case handling)

## Structure (High Level)

```text
camt.054
├── GrpHdr
└── Ntfctn (1..n notifications)
    ├── Id / CreDtTm
    ├── Acct (account being reported)
    ├── Ntry (debit or credit entry)
    │   ├── CdtDbtInd
    │   ├── Amt / BookgDt / ValDt
    │   └── NtryDtls -> TxDtls
    │       ├── Refs (EndToEndId, TxId, etc.)
    │       ├── RmtInf
    │       └── Related parties/agents
```

## Why camt.054 Is Important in Payment Flows

- Confirms customer-visible movement after processing
- Carries references needed to link to original `pain.001`/`pacs.008`
- Enables near-real-time reconciliation and customer notifications
- Supports exception handling when expected notifications are missing

## camt.054 vs camt.053

- `camt.054`: event-driven notification
- `camt.053`: periodic statement (official summary)

In operations, camt.054 is for speed; camt.053 is for completeness and day-close control.

## Engineering Considerations

- Process as idempotent stream; duplicates can occur
- Use reference keys for exact matching (`EndToEndId`, bank refs)
- Handle out-of-order arrival versus status messages
- Keep resilient retry and dead-letter strategy for downstream consumers

## Related Concepts

- [camt.053](./camt053)
- [pacs.002](./pacs002)
- [Reconciliation](./reconciliation)
- [Inbound Payments](./inbound)
- [Outbound Payments](./outbound)
