---
id: cop
title: Confirmation of Payee (CoP)
sidebar_label: Confirmation of Payee
sidebar_position: 15
description: How Confirmation of Payee works — PayID name matching, account name verification, fuzzy matching, Authorised Push Payment fraud prevention, and engineering implementation.
tags: [banking, cop, confirmation-of-payee, payid, fraud, app-fraud, name-matching]
---

# ✅ Confirmation of Payee (CoP)

**Confirmation of Payee (CoP)** is a fraud prevention mechanism that verifies the **name of the account holder matches the account number** before a payment is made. It is designed to prevent Authorised Push Payment (APP) fraud and misdirected payments.

---

## Why CoP Exists

### The Problem: Authorised Push Payment (APP) Fraud

Without CoP, a fraudster can:
1. Convince a customer that "Account 062-000/12345678 belongs to Company XYZ"
2. Customer logs in, enters the details, and clicks "Pay"
3. Bank verifies account format ✅ — but never checks the account **name**
4. Money sent to fraudster's account
5. Customer authorised the payment — bank traditionally has no liability

APP fraud cost Australian banks hundreds of millions of dollars annually.

### CoP Solution

Before the payment is submitted, the bank queries the beneficiary bank:

> "Does account 062-000/12345678 belong to 'Company XYZ'?"

Beneficiary bank responds:
- ✅ **MATCH** — Name matches exactly
- ⚠️ **CLOSE MATCH** — Name is similar (typo, abbreviation)
- ❌ **NO MATCH** — Name doesn't match
- ℹ️ **NO ACCOUNT** — Account doesn't exist

The customer sees this result **before** authorising the payment.

---

## CoP in Australia — PayID

Australia's CoP implementation is integrated into the **NPP PayID** system:

### How PayID CoP Works

```
Customer enters: BSB 062-000 / Account 12345678 / Name "John Smith"
                 (or: PayID phone "0412 345 678")
        │
        ▼
Originating Bank → NPPA PayID Directory
        │ Query: Who owns BSB/account or PayID?
        ▼
NPPA resolves PayID → returns registered name "JOHN SMITH"
        │
        ▼
Originating Bank compares:
  Customer entered: "John Smith"
  Registered name:  "JOHN SMITH"
        │
  ┌─────┴─────────────────────────────────┐
  │         Fuzzy name matching           │
  │  "John Smith" vs "JOHN SMITH"  → MATCH (case-insensitive) │
  │  "Jon Smith"  vs "JOHN SMITH"  → CLOSE MATCH (1 edit distance) │
  │  "Jane Smith" vs "JOHN SMITH"  → NO MATCH │
  └───────────────────────────────────────┘
        │
        ▼
Customer shown result before they authorise
```

### PayID Registration = CoP Enablement

- Customers register a PayID (phone/email/ABN) against their BSB/account
- Registration is voluntary (but strongly encouraged by banks)
- Only PayID-registered accounts can be CoP-checked via NPP
- BSB/account-only payments: CoP is technically harder (no central lookup)

---

## CoP Response Types

| Response | Meaning | Customer Guidance |
|---------|---------|-----------------|
| ✅ **Match** | Name matches exactly or very closely | Safe to proceed |
| ⚠️ **Close Match** | Name has minor differences | Verify directly with payee; common for abbreviated names, AKAs |
| ❌ **No Match** | Name doesn't match the account | Do NOT proceed; confirm details with payee via known contact method |
| ℹ️ **Account not found** | BSB/account does not exist or no PayID registered | Do not proceed; verify details |
| 🔒 **Opted out** | Account holder has opted out of CoP | Proceed with caution; cannot verify |
| ⏱️ **Unavailable** | CoP service unavailable | Bank may proceed with warning |

---

## Fuzzy Name Matching

Exact matching rejects too many legitimate payments (e.g. "John Smith" vs "J. Smith"). Banks implement fuzzy matching algorithms:

| Technique | Description |
|-----------|-------------|
| **Normalisation** | Uppercase, remove punctuation, standardise abbreviations |
| **Edit distance (Levenshtein)** | Number of character edits to transform one string to another |
| **Token matching** | Match individual words (surname, given name) independently |
| **Phonetic matching (Soundex/Metaphone)** | Match names that sound alike |
| **Nickname matching** | "Rob" matches "Robert", "Bill" matches "William" |
| **Business name normalisation** | "Pty Ltd" = "PTY LIMITED" = "P/L" |

```java
// Simplified CoP name matching
public MatchResult matchName(String submittedName, String registeredName) {
    String normalised1 = normalise(submittedName);  // uppercase, trim, remove punctuation
    String normalised2 = normalise(registeredName);

    if (normalised1.equals(normalised2)) {
        return MatchResult.MATCH;  // Exact match
    }

    int editDistance = levenshtein(normalised1, normalised2);
    int maxLength = Math.max(normalised1.length(), normalised2.length());
    double similarity = 1.0 - ((double) editDistance / maxLength);

    if (similarity >= 0.85) {
        return MatchResult.CLOSE_MATCH;  // Very similar
    }

    if (allTokensMatch(normalised1, normalised2)) {
        return MatchResult.CLOSE_MATCH;  // All name parts present (different order)
    }

    return MatchResult.NO_MATCH;
}
```

---

## CoP and Scam Liability

### Shifting Liability

CoP shifts fraud liability:

| Customer Action | Bank Liability |
|-----------------|---------------|
| Ignores NO MATCH warning and pays | Customer bears greater responsibility |
| Pays on MATCH response (but fraud still occurred) | Bank may share liability |
| Not warned (bank didn't implement CoP) | Bank bears greater liability |

### AFCA (Australian Financial Complaints Authority)

AFCA considers CoP availability and customer behaviour when assessing APP fraud complaints. Banks without CoP face greater liability exposure.

---

## UK CoP — A Reference Implementation

The UK implemented mandatory CoP in 2020 (Faster Payments). Key differences from AU:
- Mandatory for large UK banks (Pay.UK scheme)
- Covers all account-to-account payments (not just PayID)
- Clear YES/NO/CLOSE response codes
- Reduced APP fraud significantly post-implementation

Australia is progressively adopting CoP through NPP/PayID expansion.

---

## Engineering Implementation

### CoP API Pattern

```java
// CoP check before payment initiation
@PostMapping("/payments/verify-payee")
public CopVerificationResult verifyPayee(
    @RequestBody CopVerificationRequest request) {

    // Step 1: Resolve BSB/account or PayID to name
    AccountIdentity identity = payIdDirectoryClient.resolve(
        request.getBsb(),
        request.getAccountNumber(),
        request.getPayId()
    );

    if (identity == null) {
        return CopVerificationResult.accountNotFound();
    }

    // Step 2: Fuzzy name match
    MatchResult match = nameMatchingService.match(
        request.getPayeeName(),
        identity.getRegisteredName()
    );

    // Step 3: Return result to customer UI
    return CopVerificationResult.builder()
        .result(match)
        .registeredNameHint(match == MatchResult.CLOSE_MATCH
            ? maskName(identity.getRegisteredName())  // Show partial for privacy
            : null)
        .advice(generateAdvice(match))
        .build();
}
```

### Storing CoP Result for Audit

```java
// Always persist the CoP result with the payment for audit
@Entity
public class PaymentInstruction {
    // ... payment fields ...

    // CoP audit trail
    private CopResult copResult;     // MATCH / CLOSE_MATCH / NO_MATCH / NOT_CHECKED
    private Instant copCheckedAt;
    private String copRegisteredName; // masked
    private boolean customerOverrodeWarning; // did they pay despite NO_MATCH?
}
```

---

## Interview Questions

**Q: What is Authorised Push Payment fraud and how does CoP help?**
> APP fraud = the customer is tricked into authorising a payment to a fraudster's account. Because the customer authorised it, banks traditionally had no liability. CoP adds a name verification step before the customer authorises, making the deception harder — if the fraudster's account name doesn't match what they told the victim, the customer sees a warning. CoP shifts liability back toward banks that don't implement it.

**Q: Why is fuzzy matching necessary in CoP and what are its limits?**
> Exact matching would flag too many false positives — "J. Smith" doesn't exactly match "JOHN SMITH" but it's the same person. Fuzzy matching accepts minor differences. However, it cannot detect cases where the fraudster sets up an account with the exact same name as the legitimate payee (identity mirroring) — CoP verifies name match but not genuine identity.

:::warning[Opt-out Risk]
Some account holders opt out of PayID registration to avoid privacy concerns (PayID lookup reveals their name). This makes CoP impossible for those accounts, leaving senders with less protection. Banks should educate customers on the fraud-prevention benefit of PayID registration.
:::

---

## Related Concepts

- [NPP](./npp)
- [PayTo](./payto)
- [Fraud Detection & Prevention](./fraud)
- [Outbound Payments](./outbound)
- [Inbound Payments](./inbound)
- [Open Banking / CDR](./open_banking)
