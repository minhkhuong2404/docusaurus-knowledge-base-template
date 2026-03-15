---
id: fraud
title: "Fraud Detection & Prevention"
sidebar_label: "Fraud"
sidebar_position: 1
description: Overview of Fraud Detection & Prevention.
tags: [banking, fraud, detection, prevention]
---

# Fraud Detection & Prevention

## Overview

Fraud in banking payments refers to **unauthorised or deceptive financial transactions** that cause monetary loss to customers or the institution. Fraud controls are applied at multiple points in the payment lifecycle for both inbound and outbound payments.

---

## Types of Payment Fraud

| Type | Description | Example |
|------|-------------|---------|
| **APP Fraud** | Authorised Push Payment — customer tricked into sending | Invoice redirection scam |
| **ATO** | Account Takeover — attacker controls victim account | Stolen credentials used to initiate payment |
| **Identity Fraud** | Opening account with false identity | Synthetic identity used to receive funds |
| **Money Muling** | Account used to receive and forward stolen funds | Mule receives APP fraud proceeds |
| **Card Fraud** | Unauthorised card transactions | CNP (card not present) e-commerce fraud |
| **First-Party Fraud** | Customer intentionally commits fraud | Dispute legitimate transaction as fraud |
| **Internal Fraud** | Staff-initiated fraudulent transactions | Teller redirects payments |

---

## Fraud Risk Assessment Points

```
Pain.001 / Payment Instruction
        │
        ▼
┌─────────────────────────────────┐
│   PRE-AUTHORISATION CHECKS      │
│  • Device fingerprint           │
│  • IP/Geolocation anomaly       │
│  • Behavioural biometrics       │
│  • Session risk score           │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│   PAYMENT-TIME FRAUD SCORING    │
│  • Rule-based engine            │
│  • ML model score               │
│  • Velocity checks              │
│  • Counterparty reputation      │
│  • Amount anomaly               │
└────────────────┬────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
    ALLOW             CHALLENGE / BLOCK
    payment           • Step-up auth (OTP/biometric)
                      • Call customer
                      • Block and alert
```

---

## Rule-Based Fraud Controls

### Velocity Rules
```
- More than 5 payments in 1 hour → FLAG
- Total outbound > $10,000 in 24h (unusual for profile) → FLAG
- Same beneficiary account received 3+ payments from different senders → FLAG
```

### Amount Anomaly Rules
```
- Payment amount > 3x customer's average → REVIEW
- Round number large amounts ($50,000, $100,000) → FLAG
- Amount just below reporting threshold ($9,999) → FLAG (structuring)
```

### Counterparty Rules
```
- First-time beneficiary + large amount → CHALLENGE
- Beneficiary account age < 30 days → FLAG
- Beneficiary on internal mule watchlist → BLOCK
```

### Behavioural Rules
```
- Login from new device + immediate large payment → CHALLENGE
- Payment initiated at unusual hour for customer → FLAG
- Multiple failed login attempts before payment → BLOCK
```

---

## ML-Based Fraud Scoring

Typical features used in fraud models:

| Feature Category | Examples |
|-----------------|---------|
| **Transaction** | Amount, currency, payment type, time of day |
| **Customer** | Age of relationship, average transaction amount, payment frequency |
| **Counterparty** | First-time payee, payee account age, payee risk score |
| **Device/Channel** | New device, VPN detected, overseas IP |
| **Velocity** | # payments last hour/day, cumulative amount last 24h |
| **Network** | Graph analysis — is payee linked to known mules? |

---

## Fraud Decision Outcomes

| Decision | Action |
|----------|--------|
| `ALLOW` | Process payment normally |
| `CHALLENGE` | Request additional authentication (OTP, biometric) |
| `REVIEW` | Hold payment; send to fraud analyst queue |
| `BLOCK` | Reject payment; notify customer; freeze account if severe |

---

## APP Fraud Countermeasures

APP (Authorised Push Payment) fraud is where a genuine customer is tricked. Defences include:

1. **Confirmation of Payee (CoP)** — Verify payee name matches account name before sending
2. **Cooling-off period** — Delay large first-time payments by hours/days
3. **Scam warnings** — Display scam alerts during payment flow
4. **Reimbursement schemes** — Industry-mandated refund obligations (e.g., UK PSR)
5. **Payer-payee checks** — Real-time data sharing between banks (NPP's PayTo confirmation)

---

## Inbound Fraud Controls

Even received payments require scrutiny:

- **Mule account detection** — Is the receiving account a money mule?
- **Unusual credit pattern** — Account receiving atypical volume/frequency
- **Structuring detection** — Multiple credits just below reporting thresholds

---

## Fraud Reporting & SAR

- **Suspicious Activity Report (SAR)** — Filed with AUSTRAC (AU), FinCEN (US), NCA (UK)
- Threshold triggers: AU $10,000 cash threshold; suspicious regardless of amount
- Fraud events must be logged with: timestamp, amount, parties, detection method, decision

---

## Java Spring Notes

```java
@Service
public class FraudAssessmentService {

    public FraudDecision assess(PaymentInstruction instruction) {
        FraudContext context = contextBuilder.build(instruction);
        
        // Rule engine
        List<RuleResult> ruleResults = ruleEngine.evaluate(context);
        
        // ML model
        double fraudScore = mlModel.score(context.toFeatureVector());
        
        // Combine signals
        FraudDecision decision = decisionEngine.decide(ruleResults, fraudScore);
        
        // Audit log
        auditService.logFraudAssessment(instruction.getId(), decision, fraudScore);
        
        return decision;
    }
}

public enum FraudDecision {
    ALLOW, CHALLENGE, REVIEW, BLOCK;
    
    public boolean isPaymentAllowed() {
        return this == ALLOW || this == CHALLENGE;
    }
}
```

---

## Fraud Metrics to Monitor

| Metric | Description |
|--------|-------------|
| **False Positive Rate** | Legitimate payments incorrectly flagged |
| **False Negative Rate** | Fraudulent payments missed |
| **Detection Rate** | % of fraud caught |
| **Fraud Loss ($)** | Total monetary loss from undetected fraud |
| **Customer Friction** | % of payments challenged unnecessarily |

---

## Related Concepts
- [sanction.md](./sanction.md) — Related screening; both run at same checkpoint
- [outbound.md](./outbound.md) — Outbound fraud controls
- [inbound.md](./inbound.md) — Inbound mule detection
- [payment_return.md](./payment_return.md) — Recovering funds post-fraud
