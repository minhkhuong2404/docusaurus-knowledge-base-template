---
id: cards
title: Cards & Card Schemes
sidebar_label: Cards & Card Schemes
sidebar_position: 4
---

# Cards & Card Schemes

## Overview

**Payment cards** (debit and credit) are one of the most widely used payment methods globally. They operate on **card schemes** — networks that define rules, standards, and infrastructure for card transactions. Understanding card payments is fundamental for any banking professional.

---

## Card Types

| Type | Description | Funding Source |
|------|-------------|---------------|
| **Debit Card** | Directly debits customer's bank account | Own funds (transaction/savings account) |
| **Credit Card** | Draws on a credit limit; pay later | Credit extended by issuing bank |
| **Prepaid Card** | Pre-loaded with a fixed amount | Pre-funded, not linked to bank account |
| **Charge Card** | Balance must be paid in full monthly | Credit extended; no revolving balance |
| **Virtual Card** | Card number without physical card | Digital — for online/API use |

---

## Major Card Schemes

| Scheme | Origin | Network Type | Known For |
|--------|--------|-------------|---------|
| **Visa** | USA | Open (4-party) | Largest global network |
| **Mastercard** | USA | Open (4-party) | Second largest; Cirrus/Maestro |
| **American Express (Amex)** | USA | Closed (3-party) | Premium, high spend |
| **eftpos** | Australia | Domestic | Low-cost AU debit; proprietary |
| **UnionPay** | China | Open/Closed | Largest by cardholders |
| **JCB** | Japan | Closed | Japan-focused, global acceptance |

---

## 4-Party vs 3-Party (Closed Loop) Models

### 4-Party (Open Loop) — Visa / Mastercard

```
Cardholder ──────────────────────────────────► Merchant
    │                                              │
    │                                              │
Issuing Bank                               Acquiring Bank
(Customer's bank,                          (Merchant's bank,
 issues the card)                           processes transactions)
    │                                              │
    └─────────── Card Scheme Network ─────────────┘
                  (Visa / Mastercard)
                  Sets rules, routes, settles
```

### 3-Party (Closed Loop) — Amex / eftpos (domestic)

```
Cardholder ─────────────────────────────────► Merchant
    │                                              │
    └──────────── Single Network ─────────────────┘
                (Amex / eftpos)
                Acts as issuer AND acquirer
                Controls full chain
```

---

## Card Transaction Flow (4-Party, Online)

```
Customer taps/swipes card at merchant
        │
        ▼
POS Terminal
        │  Authorization Request
        ▼
Acquiring Bank (Merchant's Bank)
        │  Forward auth request
        ▼
Card Scheme Network (Visa/MC)
        │  Route to issuer
        ▼
Issuing Bank (Customer's Bank)
        │  Check: valid card? sufficient funds? fraud check?
        ▼
   ┌────┴────┐
   │         │
APPROVE    DECLINE
   │
   ▼
Auth Response back through chain:
Issuing Bank → Scheme → Acquirer → Terminal → Customer

APPROVED:
  ├── Terminal prints/displays "APPROVED"
  ├── Issuing Bank places HOLD on account
  └── Merchant receives auth code

SETTLEMENT (end of day or next day):
  ├── Merchant submits batch of auth codes
  ├── Acquirer sends to scheme
  ├── Scheme routes to issuers
  ├── Issuers convert holds to final debits
  └── Net settlement via scheme (next business day)
```

---

## Key Card Payment Concepts

### Authorization vs Settlement

```
AUTHORIZATION:
  - Happens in real-time at point of sale
  - Issuing bank places a HOLD on the account
  - Funds NOT yet moved
  - Auth code returned (6-digit)
  - Auth is valid for typically 7–30 days

CLEARING:
  - Merchant submits transaction data to acquirer
  - Scheme processes and matches to authorization
  - Interchange fees calculated

SETTLEMENT:
  - Actual funds movement
  - Issuing bank converts hold to final debit
  - Acquirer credits merchant's account
  - Net settlement via scheme
```

### Interchange Fees

```
Cardholder pays $100 to Merchant

Scheme fee:       $0.30 (goes to Visa/MC)
Interchange fee:  $0.60 (goes to Issuing Bank — card reward funded here)
Acquirer margin:  $0.20 (Acquiring Bank keeps)
──────────────────────
Merchant receives: $98.90  (Merchant Discount Rate = 1.1%)

MDR (Merchant Discount Rate) = Interchange + Scheme fee + Acquirer margin
```

### Card Networks and Least-Cost Routing (LCR)

In Australia, merchants can route debit transactions over eftpos (cheaper) instead of Visa/Mastercard:

```
Customer's debit card supports:  Visa Debit  AND  eftpos

Merchant terminal routes via eftpos (cheaper interchange)
  → Issuing Bank processes as eftpos transaction
  → Lower cost to merchant
```

This is called **Least-Cost Routing (LCR)** — mandated to be available in Australia.

---

## Card Security

### EMV Chip
- **EMV** = Europay, Mastercard, Visa standard
- Chip generates a unique cryptogram per transaction (cannot be cloned like magnetic stripe)
- Chip + PIN is more secure than swipe + signature

### CNP (Card Not Present) — Online Transactions
- Higher fraud risk since card is not physically present
- Controls:
  - CVV/CVC (3–4 digit card verification value)
  - 3D Secure (3DS) — additional authentication via bank (OTP, biometric)
  - Address Verification Service (AVS)

### Tokenisation
```
Real card number:  4111 1111 1111 1111
Token:             9876 5432 1098 7654  (merchant stores this, not real PAN)

Mapping only held by:  Card scheme token vault / issuing bank
Benefit: Merchant breach doesn't expose real card numbers
```

### PCI-DSS
**Payment Card Industry Data Security Standard** — compliance required for any entity that stores, processes, or transmits card data:
- 12 core requirements including encryption, access controls, monitoring
- Annual audit (QSA) for large merchants; self-assessment for small
- Non-compliance: fines and losing ability to accept cards

---

## Card Disputes & Chargebacks

When a cardholder disputes a transaction:

```
1. Cardholder contacts issuing bank:
   "I didn't make this transaction" / "Item not received"

2. Issuing Bank:
   ├── Provisional credit to cardholder
   └── Initiates chargeback via scheme

3. Scheme routes chargeback to Acquiring Bank

4. Acquiring Bank:
   ├── Notifies merchant
   └── Debits merchant's account (provisional)

5. Merchant can:
   ├── ACCEPT chargeback (no dispute, merchant loses funds)
   └── DISPUTE with evidence (proof of delivery, signed receipt)

6. Scheme arbitrates if both sides disagree

7. Final outcome:
   ├── Cardholder wins → funds returned to cardholder
   └── Merchant wins → merchant keeps funds, cardholder recharged
```

### Chargeback Reason Codes (Visa examples)

| Code | Reason |
|------|--------|
| `10.1` | EMV Liability Shift — counterfeit fraud |
| `10.4` | Other Fraud — Card Absent Environment |
| `11.1` | Card Recovery Bulletin |
| `12.1` | Late Presentment (too late to settle) |
| `13.1` | Merchandise / Services Not Received |
| `13.3` | Not as Described |
| `13.6` | Credit Not Processed |

---

## eftpos (Australian Domestic Scheme)

**eftpos** is Australia's domestic debit card scheme:

```
Network:      Proprietary (domestic AU)
Operator:     eftpos Payments Australia Limited (ePAL)
Card type:    Debit only
Key feature:  Lower interchange fees than Visa Debit/Mastercard Debit
Cashout:      eftpos supports cashout at point of sale (unique to AU)
Availability: POS terminals; limited online acceptance

eftpos CHQ → debit from cheque/transaction account
eftpos SAV → debit from savings account

Note: eftpos is being upgraded with digital capabilities
      (eftpos token, online payments) to compete with Visa/MC
```

---

## Java Spring Notes

```java
// Card authorization request processing
@Service
public class CardAuthorizationService {

    public AuthorizationResponse authorize(AuthorizationRequest request) {
        // Validate card
        Card card = cardRepository.findByPan(request.getTokenizedPan())
            .orElseThrow(() -> new CardNotFoundException());

        if (card.getStatus() != CardStatus.ACTIVE) {
            return AuthorizationResponse.decline(DeclineCode.CARD_BLOCKED);
        }

        // Check balance / credit limit
        Account account = accountService.getLinkedAccount(card);
        if (!account.hasSufficientFunds(request.getAmount())) {
            return AuthorizationResponse.decline(DeclineCode.INSUFFICIENT_FUNDS);
        }

        // Fraud check
        FraudDecision fraud = fraudService.assess(request, card, account);
        if (fraud == FraudDecision.BLOCK) {
            return AuthorizationResponse.decline(DeclineCode.FRAUD_SUSPECTED);
        }

        // Place hold
        String holdId = accountService.createHold(
            account.getId(), 
            request.getAmount(), 
            request.getMerchantId()
        );

        String authCode = authCodeGenerator.generate();

        return AuthorizationResponse.approve(authCode, holdId);
    }
}
```

---

## Related Concepts
- [fraud.md](./fraud.md) — Card fraud and CNP fraud
- [account_types.md](./account_types.md) — Debit cards linked to transaction accounts
- [inbound.md](./inbound.md) — Merchant settlement is an inbound credit
- [outbound.md](./outbound.md) — Card debit is an outbound from customer's perspective
- [aml_kyc.md](./aml_kyc.md) — KYC required for card issuance
