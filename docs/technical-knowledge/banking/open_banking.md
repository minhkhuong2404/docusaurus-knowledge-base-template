---
id: open_banking
title: Open Banking & Consumer Data Right (CDR)
sidebar_label: Open Banking / CDR
sidebar_position: 1
description: Overview of Open Banking & Consumer Data Right (CDR).
tags: [banking, open, consumer, data, right, cdr]
---

# Open Banking & Consumer Data Right (CDR)

## Overview

**Open Banking** in Australia is implemented through the **Consumer Data Right (CDR)** framework, which gives consumers the legal right to **share their financial data** with accredited third parties. It enables a new generation of financial services built on secure, standardised data sharing — without sharing credentials.

- **Legislation:** Consumer Data Right Act 2019
- **Regulator:** ACCC (Australian Competition and Consumer Commission) + OAIC (privacy)
- **Standards body:** Data Standards Body (DSB), managed by Treasury
- **API standard:** CDR API (based on OpenID Connect / OAuth 2.0 + REST/JSON)
- **Banking go-live:** July 2020 (major banks); expanded to all ADIs

---

## CDR Participants

| Role | Description | Examples |
|------|-------------|---------|
| **Data Holder (DH)** | Bank that holds the customer's data | ANZ, CBA, NAB, Westpac |
| **Accredited Data Recipient (ADR)** | Third party that receives data with customer consent | Fintechs, accountants, comparison sites |
| **Consumer** | The bank customer who owns the data | Individual or business |
| **ACCC** | Accreditation authority; maintains ADR register | |
| **CDR Register** | ACCC-maintained registry of participants | |

---

## CDR Data Scope — Banking

### Phase 1 — Product Reference Data (no consent needed)
```
Publicly available product information:
├── Account types available
├── Interest rates
├── Fees and charges
├── Features and eligibility
└── Available at CDR Register / Data Holder endpoints
```

### Phase 2 — Consumer Account Data (consent required)
```
With consumer consent, ADRs can access:
├── Account information
│   ├── Account names and types
│   ├── BSB and account number
│   └── Account status
│
├── Transaction data
│   ├── Transaction history
│   ├── Merchant details
│   ├── Transaction amounts and dates
│   └── Running balance
│
├── Direct debit authorisations
└── Scheduled payments
```

---

## CDR Consent Flow

```
Consumer uses Third-Party App (ADR)
        │
        ▼
App requests consent:
  "Share your CBA transaction history for 90 days?"
        │
        ▼
Consumer redirected to their bank (Data Holder)
  (OAuth 2.0 Authorization Code flow)
        │
        ▼
Consumer authenticates at bank (existing credentials)
        │
        ▼
Consumer reviews and approves consent
  ├── Which accounts to share
  ├── What data to share
  ├── Duration of access
  └── One-time or ongoing
        │
        ▼
Bank issues access token to ADR
        │
        ▼
ADR calls CDR APIs with token
  GET /cdr-au/v1/banking/accounts
  GET /cdr-au/v1/banking/accounts/{id}/transactions
        │
        ▼
Bank returns data in CDR standard format (JSON)
```

---

## CDR API Endpoints (Banking)

| Endpoint | Description |
|----------|-------------|
| `GET /banking/accounts` | List consumer's accounts |
| `GET /banking/accounts/balances` | Account balances |
| `GET /banking/accounts/{id}/transactions` | Transaction history |
| `GET /banking/accounts/{id}/direct-debits` | Direct debit authorities |
| `GET /banking/payees` | Saved payees |
| `GET /banking/payments/scheduled` | Scheduled payments |
| `GET /common/customer` | Consumer identity details |

---

## CDR Data Standards — Transaction Object (JSON)

```json
{
  "accountId": "12345",
  "transactions": [
    {
      "transactionId": "TX-ABC-001",
      "isDetailAvailable": true,
      "type": "PAYMENT",
      "status": "POSTED",
      "description": "NPP Payment to Jane Smith",
      "postingDateTime": "2024-06-15T14:30:00+10:00",
      "valueDateTime": "2024-06-15T14:30:00+10:00",
      "amount": "-150.00",
      "currency": "AUD",
      "reference": "Invoice 12345",
      "merchantName": null,
      "merchantCategoryCode": null,
      "billerCode": null,
      "billerName": null,
      "crn": null
    }
  ]
}
```

---

## Consent Management

### Consent Lifecycle
```
PENDING    → Consumer redirected to bank for approval
ACTIVE     → Consumer approved; data can be accessed
EXPIRED    → Consent duration elapsed (e.g., 90 days max)
REVOKED    → Consumer revoked consent (via bank or ADR)
WITHDRAWN  → ADR withdrew (stopped using the data)
```

### Consumer Rights
- View all active consents in their banking app
- Revoke consent at any time (takes effect within 5 minutes)
- Consent auto-expires; must be renewed
- Right to data deletion request

---

## CDR vs Open Banking (UK/EU)

| Feature | AU CDR | UK Open Banking | EU PSD2 |
|---------|--------|----------------|---------|
| Scope | Read + write (future) | Read + payment initiation | Read + payment initiation |
| Regulator | ACCC + OAIC | FCA + CMA | EBA + national regulators |
| Standard | CDR API (FAPI) | Open Banking Standard | Berlin Group / NextGenPSD2 |
| Payment initiation | Planned (Action Initiation) | ✅ Live | ✅ Live |
| Liability regime | CDR Rules | Open Banking Rules | PSD2 |

---

## Action Initiation (CDR Phase 3 — Future)

Australia is expanding CDR to include **payment initiation** (write actions):

```
Planned capabilities:
├── Initiate NPP payments via CDR API
├── Create/cancel direct debit authorities (PayTo)
├── Schedule payments
└── Account-to-account transfers

This would allow fintechs to initiate payments
without the customer needing to use their bank's app.
```

---

## CDR Security Requirements

| Requirement | Standard |
|-------------|---------|
| Authentication | FAPI 1.0 Advanced (OIDC + OAuth 2.0) |
| Token binding | PKCE (Proof Key for Code Exchange) |
| Transport | TLS 1.2+ |
| Certificate management | CDR Certificate Authority |
| Token lifetime | Access token: short-lived (minutes) |
| Refresh token | Up to 90 days |

---

## Java Spring Implementation (Data Holder)

```java
@RestController
@RequestMapping("/cdr-au/v1/banking")
@RequiresConsent  // Custom annotation to validate CDR consent
public class CdrBankingController {

    @GetMapping("/accounts")
    public ResponseEntity<AccountListResponse> getAccounts(
            @AuthenticationPrincipal CdrConsumerPrincipal consumer,
            @RequestParam(required = false) OpenStatus openStatus) {
        
        List<Account> accounts = accountService
            .getAccountsForConsumer(consumer.getCustomerId(), openStatus);
        
        return ResponseEntity.ok(
            AccountListResponse.builder()
                .data(accounts.stream()
                    .map(cdrMapper::toAccountDetail)
                    .collect(toList()))
                .links(buildLinks())
                .meta(buildMeta(accounts.size()))
                .build());
    }

    @GetMapping("/accounts/{accountId}/transactions")
    public ResponseEntity<TransactionListResponse> getTransactions(
            @PathVariable String accountId,
            @AuthenticationPrincipal CdrConsumerPrincipal consumer,
            @RequestParam @DateTimeFormat(iso = DATE_TIME) OffsetDateTime newestTime,
            @RequestParam @DateTimeFormat(iso = DATE_TIME) OffsetDateTime oldestTime) {
        
        // Validate consumer has consent for this account
        consentValidator.validateAccountAccess(consumer, accountId);
        
        List<Transaction> txns = transactionService
            .getTransactions(accountId, oldestTime, newestTime);
        
        return ResponseEntity.ok(
            TransactionListResponse.builder()
                .data(txns.stream().map(cdrMapper::toTransactionDetail).toList())
                .links(buildPaginatedLinks())
                .meta(buildMeta(txns.size()))
                .build());
    }
}
```

---

## Related Concepts
- [account_types.md](/technical-knowledge/banking/account_types) — Account types exposed via CDR
- [npp.md](/technical-knowledge/banking/npp) — NPP PayTo is the CDR payment initiation mechanism
- [direct_debit.md](/technical-knowledge/banking/direct_debit) — CDR will include direct debit authority APIs
- [fis.md](/technical-knowledge/banking/fis) — Data Holders are ADIs (financial institutions)
- [aml_kyc.md](/technical-knowledge/banking/aml_kyc) — Data sharing must respect AML/privacy obligations
