---
id: becs
title: BECS — Bulk Electronic Clearing System
sidebar_label: BECS
sidebar_position: 10
description: Complete guide to Australia's BECS Direct Entry (DE) system — file formats, transaction codes, timing windows, return codes, settlement, and engineering patterns.
tags: [banking, becs, direct-entry, batch, bulk-payments, ausPayNet, clearing]
---

import BankingBatchReconciliationDiagram from '@site/src/components/BankingBatchReconciliationDiagram';

# 📦 BECS — Bulk Electronic Clearing System

BECS (Bulk Electronic Clearing System) is Australia's primary **batch payment rail** for high-volume, low-urgency domestic credit transfers and direct debits. It is operated by **AusPayNet** and processes billions of dollars daily for payroll, direct debits, government benefits, and bulk supplier payments.

---

## What BECS Handles

| Payment Type | Examples |
|-------------|---------|
| **Direct Entry Credits** | Payroll, superannuation, government benefits, bulk supplier payments |
| **Direct Entry Debits (DDR)** | Bill payments, subscriptions, loan repayments |

BECS does NOT handle:
- Real-time payments (use NPP)
- International payments (use SWIFT)
- High-value time-critical (use RTGS/HVCS)

---

## File Format — Direct Entry (DE) File & 120-Byte Batch Architecture

<BankingBatchReconciliationDiagram />

---

BECS uses a **120-character fixed-width ASCII** file format. Every line is exactly 120 characters. Files are submitted electronically to the bank/clearing house before the submission cut-off.

### Record Structure

| Record Type | Indicator | Description |
|-------------|-----------|-------------|
| **File Header** | `0` | Identifies the originating institution and file |
| **Batch Header** | `1` | Descriptive record — batch metadata |
| **Detail Record** | `2` | Individual transaction |
| **Batch Footer** | `7` | Batch total records and amounts |
| **File Trailer** | `9` | File total records and amounts |

### Detail Record Layout (Record Type 2)

```
Position  Length  Field
1         1       Record type indicator ('2')
2-8       7       BSB (format: xxx-xxx)
9         1       Blank
10-26     17      Account number (right-justified, blank-padded)
27        1       Indicator (blank, N, W, X, Y)
28-29     2       Transaction code (see below)
30-38     9       Amount (cents, no decimal, right-justified, zero-padded)
39-54     16      Title of account (name)
55-86     32      Lodgement reference (shown on customer statement)
87-93     7       Trace BSB (originator's BSB)
94-110    17      Trace account number (originator's account)
111-126   16      Remitter name
127-128   2       Withholding tax (00 = none)
(to 120 chars)
```

### Transaction Codes

| Code | Type | Description |
|------|------|-------------|
| `13` | Externally Initiated Debit | Standard direct debit |
| `50` | Externally Initiated Credit | Standard direct credit |
| `51` | Australian Government Security interest | |
| `52` | Family Allowance | |
| `53` | Pay | Payroll credit |
| `54` | Pension | |
| `55` | Allotment | Military allotment |
| `56` | Dividend | |
| `57` | Debenture/Note Interest | |

---

## Timing & Processing Windows

### Business Day Rules
- BECS processes only on **business days** (excludes weekends and public holidays)
- D = submission date; customer account effect = D+1

### Submission Cut-Off Times (Indicative — per bank)

| Window | Submission By | Value Date |
|--------|--------------|------------|
| Morning | Prior night (e.g. 10 PM) | Next business day |
| Midday | ~11 AM | Same business day |
| Afternoon | ~3 PM | Same business day |

> Exact cut-offs vary by bank and are not published uniformly. Confirm with your bank's BECS submission guide.

### Settlement Windows (RBA)

BECS obligations settle at the RBA via 3 intraday windows:
- **Morning:** ~8:45 AM
- **Afternoon:** ~1:45 PM
- **Evening:** ~6:15 PM

---

## Originator vs User vs Sponsor

| Role | Description |
|------|-------------|
| **Originator** | The business submitting payments (e.g. an employer paying payroll) |
| **User** | Registered BECS participant — may be the originator's bank |
| **Sponsor Bank** | The ADI that submits DE files to the clearing house on behalf of originators |
| **Receiving Bank** | The ADI that receives transactions and posts to customer accounts |

---

## Return / Dishonour Process

When a BECS transaction cannot be processed by the receiving bank, it is returned to the originating bank via a **return file**:

### Return File Record Type

Return files use the same 120-char format. The detail record includes:

```
Field: Return reason code (positions 108-110 in return record)
```

### Common Return/Dishonour Codes

| Code | Reason |
|------|--------|
| `01` | Refer to customer |
| `03` | No authority to debit (no valid DDR) |
| `04` | Account closed |
| `05` | Account transferred to another ADI |
| `07` | Invalid BSB |
| `09` | Invalid account number |
| `13` | Non-sufficient funds |
| `14` | Funds withheld |
| `15` | Duplicate transaction |
| `19` | Account not found |

### Return Timeline
- Receiving bank has up to **7 business days** to return a dishonour
- Returns are sent as batch files (same DE format, different transaction type)
- Originator must process return files and update their records

---

## BECS vs NPP vs SWIFT

| Attribute | BECS | NPP | SWIFT |
|-----------|------|-----|-------|
| Type | Batch | Real-time | Messaging |
| Timing | D+1 | Sub-second | D+0 to D+2 |
| Settlement | DNS | RTGS | Nostro/RTGS |
| Volume | Bulk (millions/batch) | High-frequency single | Cross-border |
| Domestic only | ✅ | ✅ | ❌ |
| 24/7 | ❌ | ✅ | ❌ |
| Data richness | Low | High (ISO 20022) | Medium (MT) / High (MX) |

---

## Engineering Patterns

### Generating a BECS DE File

```java
public class BecsFileWriter {

    public String generateDeFile(BecsSubmission submission) {
        StringBuilder sb = new StringBuilder();

        // File Header (Record 0)
        sb.append(formatFileHeader(submission));

        for (BecsBatch batch : submission.getBatches()) {
            // Batch Header (Record 1)
            sb.append(formatBatchHeader(batch));

            for (BecsTransaction txn : batch.getTransactions()) {
                // Detail Record (Record 2) — exactly 120 chars
                sb.append(formatDetailRecord(txn));
            }

            // Batch Footer (Record 7)
            sb.append(formatBatchFooter(batch));
        }

        // File Trailer (Record 9)
        sb.append(formatFileTrailer(submission));
        return sb.toString();
    }

    private String formatDetailRecord(BecsTransaction txn) {
        return String.format("%-1s%-7s%-1s%-17s%-1s%-2s%09d%-16s%-32s%-7s%-17s%-16s%02d",
            "2",                          // record type
            txn.getBsb(),                 // BSB xxx-xxx
            " ",                          // blank
            leftPad(txn.getAccount(), 17),
            " ",                          // indicator
            txn.getTransactionCode(),     // e.g. "53" for pay
            txn.getAmountCents(),         // amount in cents
            truncate(txn.getAccountName(), 16),
            truncate(txn.getLodgementRef(), 32),
            txn.getTraceBsb(),
            leftPad(txn.getTraceAccount(), 17),
            truncate(txn.getRemitterName(), 16),
            txn.getWithholdingTax()
        );
    }
}
```

### Parsing a BECS Return File

```java
public List<BecsReturn> parseReturnFile(String deFileContent) {
    return Arrays.stream(deFileContent.split("\n"))
        .filter(line -> line.charAt(0) == '2')  // detail records only
        .map(line -> BecsReturn.builder()
            .bsb(line.substring(1, 8))
            .account(line.substring(9, 26).trim())
            .amount(new BigDecimal(line.substring(29, 38)).divide(BigDecimal.valueOf(100)))
            .returnCode(line.substring(107, 109).trim())
            .originalRef(line.substring(54, 86).trim())
            .build()
        )
        .collect(Collectors.toList());
}
```

### Idempotency for BECS Submissions

```java
// Use a submission ID to prevent duplicate file submission
String submissionId = DigestUtils.sha256Hex(
    submissionDate + batchId + fileContents
);

if (submissionRepository.existsBySubmissionId(submissionId)) {
    log.warn("Duplicate BECS submission detected: {}", submissionId);
    return SubmissionResult.duplicate(submissionId);
}
```

---

## Reconciliation

After each BECS settlement window:

1. **Transaction log reconciliation**: Verify every submitted DE record has a result (settled or returned)
2. **Net position reconciliation**: Internal net position should match RBA-confirmed settlement amount
3. **Customer account reconciliation**: Verify customer account postings match DE file amounts
4. **Return file processing**: Apply all returned dishonours to originator records

---

## Interview Questions

**Q: What does D+1 mean in BECS and why can't it be faster?**
> D+1 means the customer account effect happens the next business day. BECS is batch-based — files are collected during a window, netted overnight, and settled via DNS at morning window. The batch architecture and DNS settlement model inherently add latency. NPP solves this with individual RTGS settlement 24/7.

**Q: Why is the 7-business-day return window a problem for creditors?**
> A creditor may credit goods/services immediately on D+1 (e.g. supermarket accepts a DD payment), but then receive a dishonour return on D+7. They've already provided value with no recourse on the payment. This creates credit/fraud risk. PayTo mitigates this by validating mandate and balance upfront with real-time settlement.

:::warning[Common Engineering Mistake]
Assuming BECS files are self-validating. The DE format has minimal checksum protection. Implementing your own pre-submission validation (BSB format, account length, amount range, transaction code validity, batch totals) is essential before sending to the bank.
:::

---

## Related Concepts

- [Direct Debit](./direct_debit)
- [PayTo](./payto)
- [Clearing](./clearing)
- [Settlement](./settlement)
- [Reconciliation](./reconciliation)
- [Idempotency in Payments](./idempotency)
