---
title: camt.053 Statement
description: Overview of ISO 20022 camt.053 statements.
tags: [banking, iso20022, camt053]
---

# camt.053

camt.053 is the ISO 20022 bank-to-customer statement message used for end-of-day account reporting.

## Overview

`camt.053` (`BankToCustomerStatement`) is an account statement message sent by a bank to its customer, typically end-of-day or intraday statement cut. It provides booked balance and entry details for reconciliation and accounting.

## Primary Use Cases

- Daily account statement delivery to corporate treasury
- Automated bank reconciliation against ERP/AP/AR ledgers
- Audit trail for debits, credits, fees, and interest postings
- Position and cash forecasting

## Structure (High Level)

```text
camt.053
├── GrpHdr
└── Stmt (1..n account statements)
    ├── Id / CreDtTm / FrToDt
    ├── Acct (account identification)
    ├── Bal (opening, interim, closing)
    └── Ntry (entries)
        ├── CdtDbtInd
        ├── Amt / Ccy
        ├── BookgDt / ValDt
        └── NtryDtls / TxDtls (references, remittance, counterparties)
```

## camt.053 vs camt.054

- `camt.053`: statement-oriented periodic summary with detailed entries
- `camt.054`: event/notification-oriented credit/debit advice

Organizations often consume both: `camt.054` for near-real-time updates and `camt.053` for official day-close reconciliation.

## Operational Considerations

- Statement generation cut-off times must be deterministic
- Missing entries or duplicate entries cause reconciliation breaks
- Balance type semantics (opening/closing/booked/available) must be documented
- Statement IDs and sequence numbers should support replay-safe ingestion

## Integration Tips

- Map `Ntry` and `TxDtls` into internal transaction model
- Keep full reference chain (`EndToEndId`, bank refs, scheme refs)
- Validate total movements against internal ledger snapshots
- Use idempotent import by `(statement_id, entry_ref)` keys

## Related Concepts

- [camt.054](./camt054)
- [Reconciliation](./reconciliation)
- [Settlement](./settlement)
