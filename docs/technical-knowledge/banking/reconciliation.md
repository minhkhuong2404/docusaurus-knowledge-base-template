---
id: reconciliation
title: "Reconciliation"
sidebar_label: "Reconciliation"
sidebar_position: 1
description: Overview of Reconciliation.
tags: [banking, reconciliation]
---

# Reconciliation

## Overview

**Reconciliation** in payments is the process of **matching internal payment records against external confirmations** (bank statements, network confirmations, settlement reports) to ensure every transaction is correctly accounted for, with no gaps, duplicates, or errors.

---

## Why Reconciliation Matters

| Risk if not reconciled | Impact |
|------------------------|--------|
| Undetected failed payments | Customer funds lost or not delivered |
| Duplicate payments | Double payment to supplier |
| Settlement shortfall | Bank exposed to overnight liquidity risk |
| Unidentified credits | Funds sitting in suspense, not applied |
| Regulatory breach | Failure to report or account for transactions |

---

## Reconciliation Types

### 1. Payment Reconciliation (Transaction Level)
Match each internal payment order against network/bank confirmation:

```
Internal Payment Order  ←→  pacs.002 / pain.002 confirmation
     EndToEndId                  OrgnlEndToEndId
     TxId                        OrgnlTxId
     Amount                      IntrBkSttlmAmt
     Status                      TxSts
```

### 2. Account/Ledger Reconciliation
Match posted ledger entries against camt.053 bank statement:

```
Internal Ledger Entry  ←→  camt.053 Ntry
     LedgerEntryId            AcctSvcrRef
     Amount                   Amt
     BookingDate              BookgDt
     CdtDbtInd                CdtDbtInd
```

### 3. Nostro Reconciliation
Match FI's own ledger of a correspondent account against the correspondent bank's statement:

```
Our Nostro Ledger  ←→  MT940 / camt.053 from correspondent
```

### 4. Settlement Reconciliation
Verify actual settlement movements at the central bank (ESA):

```
Expected net settlement position  ←→  RBA FSS settlement confirmation
```

---

## Reconciliation Data Sources

| Source | Message | Content |
|--------|---------|---------|
| Internal payment system | N/A | Payment orders, statuses |
| NPP Network | pacs.002 | Per-transaction confirmation |
| SWIFT | pacs.002 / MT199 | Status per payment |
| Bank statement (own) | camt.053 / MT940 | All entries for period |
| Intraday notification | camt.054 | Real-time transaction alerts |
| Settlement confirmation | RBA FSS report | Net position settled |

---

## Reconciliation Process

```
End of Business Day
        │
        ▼
Collect all internal payment records for the day
        │
        ▼
Receive camt.053 from correspondent/internal bank
        │
        ▼
For each internal record:
  Search for matching camt.053 entry
        │
        ├── MATCHED  → Check amount, date, currency
        │               └── All match → RECONCILED ✅
        │               └── Mismatch  → FLAG for investigation
        │
        └── UNMATCHED → Check pacs.002 status
                          ├── RJCT → Reverse and reconcile
                          ├── PDNG → Carry forward
                          └── No response → Escalate
        │
        ▼
Balance check:
  Statement opening + credits − debits = closing?
        │
        ├── YES → Reconciliation complete ✅
        └── NO  → Investigate discrepancy
```

---

## Match Keys (IDs Used for Reconciliation)

| ID | Set By | Carried In | Used For |
|----|--------|-----------|---------|
| `EndToEndId` | Originating customer | pain.001, pacs.008, camt.054 | E2E payment tracking |
| `TxId` | Debtor bank | pacs.008, pacs.002 | Interbank transaction matching |
| `InstrId` | Sending bank | pacs.008 | Instruction-level matching |
| `AcctSvcrRef` | Creditor bank | camt.053, camt.054 | Statement entry matching |
| `UETR` | Debtor bank | All SWIFT messages | SWIFT payment tracking |
| `MsgId` | Sender | All messages | Message-level dedup |

---

## Suspense Account

The **suspense account** is a holding account for transactions that cannot be immediately matched or applied:

```
Reasons for suspense:
- Inbound payment — creditor account not found
- Credit or debit with no matching payment order
- Amount mismatch
- Pending investigation (fraud, sanctions)

Suspense management:
- All suspense items must be aged and reviewed daily
- SLA: resolve within 5 business days
- Unresolved items escalated to operations management
- Regulatory obligation: cannot hold funds indefinitely
```

---

## Reconciliation Statuses

| Status | Meaning |
|--------|---------|
| `MATCHED` | Internal record matched to external confirmation |
| `RECONCILED` | Matched and verified (amount, date, status correct) |
| `UNMATCHED` | No corresponding external record found |
| `DISPUTED` | Match found but data doesn't agree |
| `PENDING` | Awaiting confirmation (e.g., T+1 settlement) |
| `WRITTEN_OFF` | Unrecoverable difference; actioned by finance |
| `IN_SUSPENSE` | Held pending investigation |

---

## Java Spring Reconciliation Service

```java
@Service
public class ReconciliationService {

    @Scheduled(cron = "0 0 22 * * MON-FRI")  // 10 PM weekdays
    public void runDailyReconciliation() {
        LocalDate today = LocalDate.now();
        
        // 1. Get all internal payment orders for today
        List<PaymentOrder> orders = paymentRepository.findByDate(today);
        
        // 2. Get camt.053 statement entries
        List<StatementEntry> entries = statementRepository.findByDate(today);
        
        // 3. Match
        ReconciliationReport report = matcher.match(orders, entries);
        
        // 4. Handle unmatched
        report.getUnmatched().forEach(unmatched -> {
            suspenseService.createItem(unmatched);
            alertService.notifyOpsTeam(unmatched);
        });
        
        // 5. Handle mismatches
        report.getMismatches().forEach(mismatch -> {
            investigationService.raise(mismatch);
        });
        
        // 6. Publish report
        reportingService.publish(report);
    }
}

@Component
public class PaymentMatcher {

    public ReconciliationReport match(
            List<PaymentOrder> orders,
            List<StatementEntry> entries) {
        
        Map<String, StatementEntry> entryByRef = entries.stream()
            .collect(Collectors.toMap(
                StatementEntry::getAcctSvcrRef,
                Function.identity()
            ));
        
        var report = new ReconciliationReport();
        
        for (PaymentOrder order : orders) {
            // Try matching by EndToEndId first, then TxId
            Optional<StatementEntry> match = findMatch(order, entryByRef);
            
            if (match.isEmpty()) {
                report.addUnmatched(order);
            } else if (!amountsMatch(order, match.get())) {
                report.addMismatch(order, match.get());
            } else {
                report.addReconciled(order, match.get());
            }
        }
        
        return report;
    }
}
```

---

## Reconciliation SLAs

| Type | SLA | Escalation |
|------|-----|-----------|
| NPP real-time | Intraday | Within 4 hours if unmatched |
| DE/BECS | Next business day | Within 24 hours |
| SWIFT | T+1 to T+2 | Within 3 business days |
| Suspense items | 5 business days | Finance director sign-off |
| Nostro breaks | End of day | Treasury escalation |

---

## Related Concepts
- [camt053.md](./camt053.md) — Primary reconciliation source
- [camt054.md](./camt054.md) — Intraday reconciliation triggers
- [pacs002.md](./pacs002.md) — Transaction status confirmation
- [debit_post.md](./debit_post.md) — Ledger entries to reconcile
- [credit_post.md](./credit_post.md) — Ledger entries to reconcile
- [payment_return.md](./payment_return.md) — Returned payments affect reconciliation
