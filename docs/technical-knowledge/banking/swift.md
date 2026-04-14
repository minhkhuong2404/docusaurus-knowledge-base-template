---
title: SWIFT
description: Overview of SWIFT messaging in cross-border payments.
tags: [banking, swift, cross-border]
---

# SWIFT

SWIFT is a global financial messaging network used by institutions to exchange standardized payment instructions.

## Interview Questions (Senior Level)

1. How do you design resilient SWIFT processing for delayed acknowledgments and correspondent-bank hops?
2. What controls are essential to prevent sanctions breaches in cross-border flows?
3. How do UETR and message references support payment investigations?
4. When should a payment be repaired versus returned in SWIFT operations?

Short answer guide:
- Build robust state machines with timeout and repair workflows.
- Enforce sanctions screening and audit trails at multiple checkpoints.
- Use end-to-end identifiers for deterministic traceability.
- Repair only when compliance allows and beneficiary intent is preservable.

:::info[Interview Focus]
Describe cross-border flow with correspondent banks, sanctions checks, and investigation references.
:::

:::danger[Interview Trap]
Assuming SWIFT messages settle money directly.
:::
