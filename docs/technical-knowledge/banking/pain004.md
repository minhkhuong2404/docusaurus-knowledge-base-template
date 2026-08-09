---
id: pain004
title: pain.004 — Does It Exist?
sidebar_label: pain.004 (Clarification)
sidebar_position: 7
description: '**No — `pain.004` is not a defined ISO 20022 message.**'
tags:
- technical-knowledge
- banking
- pain004
---

import BankingReversalRecallDiagram from '@site/src/components/BankingReversalRecallDiagram';

# pain.004 — Clarification

## Does pain.004 Exist in ISO 20022?

**No — `pain.004` is not a defined ISO 20022 message.**

This is a common source of confusion for new learners. The ISO 20022 `pain` (Payment Initiation) message family skips directly from `pain.002` to `pain.007`. There is no `pain.003`, `pain.004`, `pain.005`, or `pain.006` in the standard set.

---

## Quick Reference: Return vs Reversal vs Recall

<BankingReversalRecallDiagram />

---

---

## See Also

- [pacs.004 — Payment Return](./pacs004.md) — The message you are most likely looking for
- [pain.007 & pacs.007 — Payment Reversal](./pain007_pacs007.md)
- [camt.055 & camt.056 — Cancellation Request](./camt055_camt056.md)
- [Debit Reversal](./debit_reversal.md) — Internal accounting reversal
