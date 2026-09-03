---
id: payment_hub
title: Payment Hub Architecture
sidebar_label: Payment Hub Architecture
sidebar_position: 17
description: Payment Hub vs Payment Gateway vs Payment Factory — architecture patterns, orchestration, channel abstraction, and Java/Spring engineering design for centralised payment processing.
tags: [banking, payment-hub, architecture, orchestration, microservices, spring, payments]
---

import BankingHubRoutingProcessingDiagram from '@site/src/components/BankingHubRoutingProcessingDiagram';

# 🏗️ Payment Hub Architecture

A **Payment Hub** is a centralised platform that orchestrates all payment processing across multiple rails, channels, and schemes through a unified, rule-driven engine. It is the evolution from bank-specific per-channel silos to a single payment intelligence layer.

<BankingHubRoutingProcessingDiagram />

---

## Payment Hub vs Gateway vs Factory

| Concept | Definition | Scope |
|---------|-----------|-------|
| **Payment Gateway** | Accepts incoming payment requests and routes them to the appropriate network | Input routing only |
| **Payment Factory** | Centralises payment initiation from multiple customer channels into a normalised pipeline | Outbound initiation |
| **Payment Hub** | Full orchestration — encompasses intake, routing, transformation, compliance, posting, and reporting across all flows | End-to-end |

A Payment Hub includes payment factory capabilities plus:
- Inbound payment processing
- Internal routing and settlement
- Scheme connector management
- Compliance engine integration
- Reconciliation
- Reporting and audit

---

## Why Banks Build Payment Hubs

### The Silo Problem

Without a hub, each payment type has its own system:

```
BECS System    → has its own validation, compliance, posting
NPP System     → has its own validation, compliance, posting
SWIFT System   → has its own validation, compliance, posting
BPAY System    → has its own validation, compliance, posting
Cards System   → has its own validation, compliance, posting
```

**Problems:**
- 5x compliance rule maintenance
- Inconsistent customer experience across channels
- Difficult cross-channel reporting
- High operational cost
- Hard to add new rails (every addition = new silo)

### The Hub Solution

```
All Channels → [Payment Hub] → All Rails
                     │
             Shared services:
             - Compliance (sanctions, AML, fraud)
             - Idempotency
             - Authorisation
             - Posting
             - Reconciliation
             - Audit / reporting
```

---

## Payment Hub Architecture Layers

| Hub Architecture Layer | Ingress / Egress Protocols | Key Responsibilities & Functions | Integration Characteristics |
|---|---|---|---|
| **1. Intake / API Layer** | REST, gRPC, ISO 20022, BECS 18-byte ABA, SWIFT MT/MX | Accepts payments from mobile apps, online banking, corporate portals, and third-party APIs. | TLS 1.3, OAuth 2.0 / mTLS validation |
| **2. Normalisation Layer** | Canonical Model Transformation | Converts diverse incoming schemas into an **Internal Message Format (IMF)** canonical Java model. | Schema validation & enrichments |
| **3. Orchestration Engine** | State Machine & Workflow Pipeline | 12-step processing: duplicate check, sanctions/AML screening, fraud score, route selection, debit hold, network submission. | Sagas with compensations & event streaming |
| **4. Connector Layer** | Rail-Specific Adapters | Outbound protocol translation: NPP PAG adapter, BECS file generator, SWIFT Alliance gateway, BPAY, RTGS. | High-resilience circuit breakers & retry queues |
| **5. Core Banking / Ledger** | Double-Entry Posting System | Synchronizes customer account balances, reservation holds, and interbank settlement journals. | ACID transaction locks & event CDC |

---

## Internal Message Format (IMF)

The IMF is the hub's canonical payment model — a superset of all fields across all schemes:

```java
@Data
public class CanonicalPayment {
    // Identity
    private String paymentId;          // Hub-assigned UUID
    private String endToEndId;         // Customer-provided reference
    private String messageId;          // Source message ID
    private String uetr;               // SWIFT gpi tracker (if applicable)

    // Parties
    private PaymentParty debtor;
    private PaymentParty creditor;
    private PaymentAgent debtorAgent;
    private PaymentAgent creditorAgent;

    // Amount
    private Money instructedAmount;
    private Money settlementAmount;    // May differ (FX conversion)
    private String chargeBearer;       // DEBT/CRED/SHAR/SLEV

    // Routing
    private PaymentChannel selectedChannel;  // NPP/BECS/SWIFT/HVCS/BPAY
    private PaymentPriority priority;
    private LocalDate valueDate;

    // Status
    private PaymentStatus status;
    private Instant statusUpdatedAt;

    // Compliance
    private SanctionsResult sanctionsResult;
    private FraudResult fraudResult;
    private AmlResult amlResult;

    // Audit
    private String sourceSystem;
    private Instant receivedAt;
    private Instant processedAt;
}
```

---

## Orchestration as a State Machine

Payment processing in a hub is modelled as a **state machine** — each transition is atomic and auditable:

```java
enum PaymentStatus {
    RECEIVED,
    NORMALISING,
    VALIDATING,
    COMPLIANCE_SCREENING,
    COMPLIANCE_HOLD,
    PENDING_APPROVAL,
    APPROVED,
    BALANCE_CHECKED,
    DEBITED,
    TRANSFORMING,
    SUBMITTED,
    ACKNOWLEDGED,
    SETTLEMENT_IN_PROGRESS,
    SETTLED,
    REJECTED,
    RETURNED,
    CANCELLED,
    FAILED
}

@Service
public class PaymentOrchestrator {

    public void advance(CanonicalPayment payment, PaymentEvent event) {
        PaymentStatus nextState = stateMachine.transition(
            payment.getStatus(), event
        );

        if (nextState == null) {
            throw new InvalidTransitionException(payment.getStatus(), event);
        }

        // Persist state transition (audit log)
        auditService.recordTransition(
            payment.getPaymentId(),
            payment.getStatus(),
            nextState,
            event
        );

        payment.setStatus(nextState);
        paymentRepository.save(payment);

        // Trigger next step
        workflowService.executeStep(payment, nextState);
    }
}
```

---

## Connector Pattern

Each payment scheme has a dedicated **connector** that translates the IMF to/from the scheme's native format:

```java
public interface PaymentConnector {
    String getSupportedChannel();
    NetworkMessage transform(CanonicalPayment payment);  // IMF → scheme message
    CanonicalPayment parse(NetworkMessage message);       // scheme message → IMF
    SubmissionResult submit(NetworkMessage message);
    PaymentStatus mapStatus(String schemeStatus);
}

@Component
public class NppConnector implements PaymentConnector {

    @Override
    public String getSupportedChannel() { return "NPP"; }

    @Override
    public NetworkMessage transform(CanonicalPayment payment) {
        return Pacs008Message.builder()
            .msgId(payment.getMessageId())
            .endToEndId(payment.getEndToEndId())
            .instrAmt(payment.getInstructedAmount())
            .cdtrAcct(payment.getCreditor().getAccount())
            .dbtrAcct(payment.getDebtor().getAccount())
            .build();
    }

    @Override
    public PaymentStatus mapStatus(String nppStatus) {
        return switch (nppStatus) {
            case "ACTC" -> PaymentStatus.ACKNOWLEDGED;
            case "ACSC" -> PaymentStatus.SETTLED;
            case "RJCT" -> PaymentStatus.REJECTED;
            default     -> PaymentStatus.UNKNOWN;
        };
    }
}
```

---

## Key Design Principles

| Principle | Description |
|-----------|-------------|
| **Idempotency everywhere** | Every step checks for existing result before re-executing |
| **Event-driven** | State changes publish events consumed by downstream systems |
| **Immutable audit log** | Every state transition is recorded and never deleted |
| **Compensating transactions** | Every step has a reversal/compensation action for saga rollback |
| **Stateless processing** | Hub steps are stateless — state lives in the database, not memory |
| **Circuit breakers** | Downstream connectors (NPP, SWIFT) are wrapped in circuit breakers |
| **Timeout handling** | Every network call has explicit timeouts and retry policies |

---

## Commercial Payment Hub Vendors

| Vendor | Product | Notes |
|--------|---------|-------|
| **Finastra** | Fusion Payments | Widely deployed in Australian banks |
| **ACI Worldwide** | Universal Payments | Global deployment, supports NPP |
| **Volante Technologies** | VolPay Hub | ISO 20022 specialist |
| **FIS** | Payment Universal Platform | Large bank focus |
| **Temenos** | Payments Hub | Part of T24 core banking |
| **Homebuild** | Custom Spring/Kafka | Many tier-1 banks build own |

---

## Interview Questions

**Q: What is the key architectural advantage of a Payment Hub over per-scheme silos?**
> A hub centralises shared logic (compliance, idempotency, routing, audit) into a single system, eliminating the N×duplication of maintaining separate rules for each scheme. Adding a new payment rail becomes adding a new connector — not a new system. Regulatory changes (e.g. new AUSTRAC rule) are implemented once in the hub, not N times across N systems.

**Q: How do you handle a partial failure in a payment hub — e.g. the debit posts but the network submission fails?**
> Using the Saga pattern with compensating transactions. If network submission fails after a debit posts: (1) publish a `PaymentSubmissionFailed` event, (2) the saga orchestrator triggers the compensation step — a debit reversal, (3) the reversal posts, credits the customer account, and publishes `PaymentFailed`. The entire saga is tracked with idempotency keys so a restart never re-executes completed steps.

:::info[Architectural Maturity]
Banks often progress through stages: (1) per-scheme silos → (2) payment factory for outbound → (3) full hub for all flows. The journey to a full hub typically takes 5-10 years and requires significant investment in data model normalisation and connector development.
:::

---

## Related Concepts

- [Outbound Payments](./outbound)
- [Inbound Payments](./inbound)
- [Idempotency in Payments](./idempotency)
- [NPP](./npp)
- [BECS](./becs)
- [SWIFT](./swift)
- [Core Banking System](./core_banking)
- [Reconciliation](./reconciliation)
