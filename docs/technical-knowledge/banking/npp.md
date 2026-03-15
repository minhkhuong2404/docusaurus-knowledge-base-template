---
id: npp
title: "NPP — New Payments Platform"
sidebar_label: "NPP"
sidebar_position: 1
description: Overview of NPP — New Payments Platform.
tags: [banking, npp, new, payments, platform]
---

# NPP — New Payments Platform

## Overview

The **New Payments Platform (NPP)** is Australia's **real-time, data-rich payment infrastructure** launched in February 2018. It enables near-instant payments 24/7/365 between accounts at participating Australian financial institutions.

- **Operator:** NPP Australia Limited (NPPA)
- **Settlement:** RBA Fast Settlement Service (FSS)
- **Message Standard:** ISO 20022 (MX format)
- **Availability:** 24/7/365

---

## NPP Key Features

| Feature | Detail |
|---------|--------|
| **Speed** | Typically < 15 seconds end-to-end |
| **Availability** | 24/7, 365 days/year |
| **Data richness** | Up to 280 characters of remittance data |
| **PayID** | Proxy addressing (phone, email, ABN, org ID) |
| **Settlement** | Real-time gross via RBA FSS |
| **Amount limit** | No mandated cap (FIs may set own limits) |

---

## NPP Architecture

```
                        ┌─────────────────────────┐
                        │  NPP Australia (NPPA)   │
                        │  Basic Infrastructure   │
                        │  (BI) — ISO 20022 Hub   │
                        └────────────┬────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
     ┌────────▼──────────┐  ┌───────▼─────────┐  ┌────────▼──────────┐
     │    Bank A         │  │    Bank B        │  │    Bank C         │
     │  (Direct          │  │  (Direct         │  │  (Indirect via    │
     │   Participant)    │  │   Participant)   │  │   Bank A)         │
     └───────────────────┘  └─────────────────┘  └───────────────────┘
              │                                            
              ▼
     ┌───────────────────┐
     │ RBA Fast          │
     │ Settlement        │
     │ Service (FSS)     │
     └───────────────────┘
```

---

## NPP Message Flow (Credit Transfer)

```
Customer A                Bank A (Debtor)           Bank B (Creditor)
     │                         │                          │
     │── Initiate payment ────►│                          │
     │   (app/API/pain.001)    │                          │
     │                         │── Validate & screen      │
     │                         │── Debit account          │
     │                         │── Build pacs.008 ───────►│
     │                         │                          │── Validate
     │                         │                          │── Screen
     │                         │◄── pacs.002 ACK ─────────│
     │                         │                          │
     │                         │◄── RBA FSS Settlement ──►│
     │                         │    (simultaneous)        │
     │                         │                          │── Credit account
     │                         │                          │── camt.054 ──► Customer B
     │◄── Debit notification ──│
         (camt.054)
```

---

## NPP Overlay Services

Overlay services are **products built on top of NPP infrastructure**:

### Osko (by BPAY)
- First NPP overlay service
- Consumer and business payments
- PayID-enabled
- Real-time credit transfers

### PayTo (launched 2022)
- **Agreement-based payments** (replaces Direct Debit)
- Payer authorises a payment agreement stored at NPP
- Payee can initiate pull-based payments under the agreement
- Near-real-time, 24/7
- Replaces BECS Direct Debit for many use cases

```
PayTo Flow:
1. Biller creates Payment Agreement → sent to Payer's bank
2. Payer approves agreement (via banking app)
3. Biller initiates debit under agreement (any time)
4. Payer's bank validates agreement → credits biller
```

---

## PayID

**PayID** is a **proxy addressing system** on the NPP that maps a simple identifier to a BSB/account number.

| PayID Type | Example |
|-----------|---------|
| Phone number | `0412 345 678` |
| Email address | `jane@example.com` |
| ABN | `12 345 678 901` |
| Organisation ID | Assigned by NPPA |

### PayID Resolution Flow
```
Sender enters:  "jane@example.com"
                        │
                        ▼
              NPP PayID Directory
                        │
                        ▼
        Returns:  Jane Smith, BSB 062-000, Acct 12345678
                        │
                        ▼
         Sender confirms name match
                        │
                        ▼
              Payment proceeds
```

---

## NPP ISO 20022 Messages Used

| Message | Purpose |
|---------|---------|
| `pacs.008` | Credit transfer instruction |
| `pacs.002` | Payment status report |
| `pacs.004` | Payment return |
| `camt.054` | Account notification |
| `acmt.023` | PayID registration |
| `acmt.024` | PayID lookup response |

---

## NPP vs BECS Direct Entry

| Feature | NPP | BECS/DE |
|---------|-----|---------|
| Speed | < 15 seconds | Next business day |
| Hours | 24/7/365 | Business hours, cut-offs |
| Message format | ISO 20022 (MX) | Proprietary flat file |
| Remittance data | 280 characters | Limited |
| PayID | ✅ | ❌ |
| Settlement | Real-time gross (RTGS-like) | Deferred net (DNS) |

---

## NPP vs RTGS/HVCS

| Feature | NPP | HVCS/RTGS |
|---------|-----|---------|
| Target use | Retail/SME | High-value wholesale |
| Value limit | No mandated cap | Large (>$250K typical) |
| Customer visible | ✅ | Typically B2B only |
| Overlay services | ✅ Osko, PayTo | ❌ |

---

## NPP Participation

| Type | Description |
|------|-------------|
| **Connected Institution (CI)** | Direct NPP participant with own connection to BI |
| **Identified Institution (II)** | Participates via a CI (sponsor); has own PayID space |
| **Addressing Service Provider (ASP)** | Manages PayID on behalf of others |

---

## Java Spring Integration Notes

```java
@Service
public class NppPaymentService {

    @Value("${npp.endpoint}")
    private String nppEndpoint;
    
    public NppResult submitPayment(PaymentOrder order) {
        // Build pacs.008
        Pacs008 pacs008 = pacs008Builder.build(order);
        
        // Validate against NPP-specific rules
        nppValidator.validate(pacs008);
        
        // Submit to NPP BI
        NppResponse response = nppClient.submit(pacs008);
        
        if (response.isAccepted()) {
            order.setStatus(PaymentStatus.SUBMITTED_TO_NPP);
            order.setNppTxId(response.getTransactionId());
        }
        
        return NppResult.from(response);
    }
    
    @Async
    public void resolvePayId(String payId) {
        PayIdLookupRequest request = new PayIdLookupRequest(payId);
        PayIdResponse response = nppClient.lookupPayId(request);
        // Cache and return account details
    }
}
```

---

## NPP Error Codes

| Code | Meaning |
|------|---------|
| `AC01` | Incorrect account number |
| `AC03` | Invalid creditor account number |
| `NARR` | Free text error narrative |
| `FF01` | Invalid file format |
| `AM04` | Insufficient funds |
| `RR04` | Regulatory reason (sanctions) |

---

## Related Concepts
- [pacs008.md](/technical-knowledge/banking/pacs008) — Core NPP payment message
- [inbound.md](/technical-knowledge/banking/inbound) — Receiving NPP payments
- [outbound.md](/technical-knowledge/banking/outbound) — Sending NPP payments
- [clearing.md](/technical-knowledge/banking/clearing) — NPP as clearing system
- [settlement.md](/technical-knowledge/banking/settlement) — RBA FSS real-time settlement
- [onus.md](/technical-knowledge/banking/onus) — On-us vs NPP routing decision
