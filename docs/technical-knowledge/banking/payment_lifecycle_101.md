---
id: payment_lifecycle_101
title: Payment Lifecycle 101 — New Learner Guide
sidebar_label: Payment Lifecycle 101
sidebar_position: 1
---

# Payment Lifecycle 101 — New Learner Guide

## Welcome to Payments

If you're new to banking, the payment ecosystem can feel overwhelming. This page takes you from **zero to "I understand how a payment works"** using plain language and diagrams — no assumptions about prior knowledge.

---

## The Big Picture: What Happens When You Pay Someone?

You open your banking app, type $500 and your friend's BSB + account number, and hit "Send". Simple, right? Under the hood, a surprisingly complex sequence of events occurs in **under 15 seconds**.

```
YOU                     YOUR BANK               YOUR FRIEND'S BANK      YOUR FRIEND

Tap "Send" ────────────►│                               │                     │
                         │  1. Is this really you?       │                     │
                         │  2. Do you have $500?         │                     │
                         │  3. Is this payment risky?    │                     │
                         │  4. Debit your account $500   │                     │
                         │────── Send payment ──────────►│                     │
                         │                               │  5. Is this legit?  │
                         │                               │  6. Find account    │
                         │                               │  7. Credit $500     │
                         │◄──── Confirmed ───────────────│────── Notify ──────►│
                         │                               │                "You received $500"
                         │
                    "Payment sent"
```

Every single one of those numbered steps is a system, a rule, or a protocol. This guide explains each one.

---

## Step 1 — You Initiate a Payment

You provide:
- **How much** — $500
- **Who to** — BSB 062-000, Account 12345678
- **Why** — "Rent for June"

Your bank calls this a **payment instruction** or **payment order**.

In the ISO 20022 world (the international standard banks use), the electronic version of your instruction is a **`pain.001`** message (see [pain.001](./pain001.md)).

---

## Step 2 — Authentication & Authorisation

Before anything happens, your bank asks:

> "Is this really you, and are you allowed to make this payment?"

| Check | What it does |
|-------|-------------|
| **Authentication** | Confirms you are who you say you are (PIN, biometric, OTP) |
| **Authorisation** | Confirms you're allowed to send from this account in this amount |

---

## Step 3 — Can You Afford It?

Your bank checks your **available balance**:

```
Ledger Balance:    $1,200    (total of all posted transactions)
− Existing Holds:  $200      (e.g., pending card payment)
= Available:       $1,000

Payment amount:    $500      ✅ Sufficient
```

If you don't have enough: payment is **declined** immediately, before anything else happens.

---

## Step 4 — Screening (The Compliance Checks)

This is the step most people don't know exists. Before a single dollar moves, the bank runs:

### Duplicate Check
> "Did we already process this exact payment?" — Prevents accidental double-payments.

### Sanctions Screening
> "Is the recipient on a government prohibited list?" — e.g., OFAC, UN sanctions lists.
> If yes: payment is **blocked**, compliance team alerted.

### Fraud Assessment
> "Does this payment look suspicious?" — Rules + AI models analyse hundreds of signals.
> If risky: payment may be **held for review** or a **challenge** (OTP) sent to you.

### AML Check
> "Does this fit a money laundering pattern?" — Velocity rules, structuring detection.

👉 See [Fraud](./fraud.md), [Sanctions](./sanction.md), [AML & KYC](./aml_kyc.md)

---

## Step 5 — Debit Your Account

Once all checks pass, your bank:

1. **Reserves** the $500 (reduces your available balance)
2. Eventually **posts a debit** — a formal ledger entry saying "Account 9999 sent $500"
3. Sends you a **debit notification** (that push notification: "Payment sent: $500")

The notification is generated from a **`camt.054`** message — see [camt.054](./camt054.md).

---

## Step 6 — Route the Payment

Your bank decides **which rail to use** to deliver the money:

```
Same bank as recipient? ─────► On-Us (internal transfer, instant)

Different bank? ───────────────► Which scheme?
  Real-time (NPP)?  ─────────── NPP / Osko (< 15 seconds)
  High value?       ─────────── RTGS (same day)
  Bill payment?     ─────────── BPAY (next day)
  International?    ─────────── SWIFT (1–2 days)
  Otherwise?        ─────────── BECS Direct Entry (next day)
```

👉 See [NPP](./npp.md), [BPAY](./bpay.md), [SWIFT](./swift.md), and [Clearing & Settlement](./clearing.md)

---

## Step 7 — The Interbank Message

Your bank now **tells your friend's bank** about the payment using a standard message format: **`pacs.008`** — the interbank credit transfer. This message contains:

- Your details (name, account)
- Your friend's details (name, account)
- The amount
- A unique ID to track the payment end-to-end

👉 See [pacs.008](./pacs008.md)

---

## Step 8 — Settlement (The Money Actually Moves)

The **`pacs.008` is information** — it says "I'm sending you $500". But actual money doesn't flow through that message. It flows through a **settlement system**:

```
For NPP:   RBA Fast Settlement Service (FSS)
           Reserve Bank debits your bank's settlement account
           Reserve Bank credits your friend's bank's settlement account
           This is FINAL — irrevocable, real money

For BECS:  End of day netting
           All payments between banks are netted
           Only the difference settles at the RBA
```

👉 See [Clearing & Settlement](./clearing.md)

---

## Step 9 — Credit Your Friend's Account

Your friend's bank:
1. Receives the `pacs.008`
2. Runs its own screening (fraud, sanctions)
3. Identifies your friend's account
4. **Credits $500** to your friend's account
5. Sends your friend a **credit notification** (`camt.054`)

---

## Step 10 — Confirmation

Your bank receives confirmation that the payment was successfully processed (`pacs.002`). Your app updates: "Payment delivered ✅"

---

## What Could Go Wrong? (Exceptions)

Payments don't always complete smoothly:

| Problem | What Happens |
|---------|-------------|
| Wrong account number | Your friend's bank can't find the account → **Returns** funds via `pacs.004` |
| Sanctions match | Payment blocked → Compliance team review |
| Fraud detected | Payment held → You receive a call or challenge |
| Network outage | Payment queued → Retried when network recovers |
| Insufficient funds | Declined immediately → No funds moved |

👉 See [Payment Exceptions](./payment_exceptions.md), [pacs.004](./pacs004.md)

---

## Full Message Sequence (NPP Payment)

Here's every message exchanged for a successful NPP payment:

```
You (Customer)         Your Bank              Their Bank         Your Friend

pain.001 ────────────►
(optional, for API/
 corporate; usually
 just API call)

                       pacs.008 ─────────────►
                       (interbank message)

                                              Credit account
                                              ◄──── pacs.002 ────
                                              (confirmed)

◄──── camt.054 ─────                                             ◄──── camt.054
(Debit notification)                                             (Credit notification)

                       ◄──── pain.002 ─────
                       (status from network,
                        for corporate customers)
```

---

## Key Terms Cheat Sheet

| Term | Plain English |
|------|--------------|
| **Debtor** | The person paying (money leaves their account) |
| **Creditor** | The person receiving (money enters their account) |
| **Debtor Bank** | The payer's bank — sends the payment |
| **Creditor Bank** | The payee's bank — receives the payment |
| **Clearing** | Exchanging payment information between banks |
| **Settlement** | The actual movement of money between banks |
| **ESA** | A bank's account at the Reserve Bank (where settlement happens) |
| **BSB** | 6-digit code identifying a branch in Australia |
| **PayID** | A phone number or email linked to a bank account |
| **pacs** | Payment Clearing and Settlement — ISO 20022 interbank messages |
| **pain** | Payment Initiation — ISO 20022 customer-to-bank messages |
| **camt** | Cash Management — ISO 20022 bank-to-customer messages |
| **NPP** | New Payments Platform — Australia's real-time payment network |
| **STP** | Straight-Through Processing — payment completed without human intervention |

---

## What to Read Next

Based on your role:

### 🧑‍💻 Developer / Engineer
1. [pain.001](./pain001.md) → [pacs.008](./pacs008.md) → [camt.054](./camt054.md) — the message chain
2. [On-Us vs Off-Us](./onus.md) — routing logic
3. [NPP](./npp.md) — the main AU real-time scheme

### 🔍 Analyst / Operations
1. [Inbound Payments](./inbound.md) → [Outbound Payments](./outbound.md)
2. [Payment Exceptions](./payment_exceptions.md)
3. [Reconciliation](./reconciliation.md)

### 🛡️ Compliance / Risk
1. [Sanctions Screening](./sanction.md)
2. [AML & KYC](./aml_kyc.md)
3. [Fraud Detection](./fraud.md)

### 📊 Product / Business
1. [NPP](./npp.md), [BPAY](./bpay.md), and [SWIFT](./swift.md) — understanding the rails
2. [NPP & PayTo](./npp.md) — modern AU payments
3. [Open Banking / CDR](./open_banking.md) — future of payments
