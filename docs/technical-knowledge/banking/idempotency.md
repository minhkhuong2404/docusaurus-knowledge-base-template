---
id: idempotency
title: Idempotency in Payment Systems
sidebar_label: Idempotency in Payments
sidebar_position: 11
description: Critical engineering guide to idempotency in payment systems — duplicate detection strategies, EndToEndId, at-least-once delivery, saga compensation, and Java implementation patterns.
tags: [banking, idempotency, payments, engineering, deduplication, at-least-once, saga]
---

# 🔐 Idempotency in Payment Systems

Idempotency in payments means that **processing the same payment instruction multiple times produces the same outcome as processing it once**. It is one of the most critical safety properties in financial systems, preventing double charges, double credits, and phantom payments.

> Without idempotency, network timeouts, retries, and failures become catastrophic rather than recoverable.

---

## Why Idempotency Is Critical in Payments

### The Retry Problem

```
Client sends payment request
    → Network timeout after 5s
    → Client doesn't know if the bank received it
    → Client retries

If the bank already processed the first request:
  ❌ Without idempotency → customer charged TWICE
  ✅ With idempotency    → second request returns same result as first
```

### Failure Scenarios Requiring Idempotency

| Scenario | Risk Without Idempotency |
|----------|------------------------|
| Network timeout on payment POST | Duplicate payment on retry |
| Message broker redelivery (Kafka at-least-once) | Duplicate event processing |
| Database commit success, response lost | Client retries → duplicate |
| Scheduled batch rerun after failure | Entire batch executed twice |
| Webhook received twice | Duplicate status update triggers |
| Outage recovery — partial processing | Same file partially processed again |

---

## ISO 20022 Idempotency Fields

### The ID Hierarchy

| Field | Set By | Scope | Purpose |
|-------|--------|-------|---------|
| `MsgId` | Message sender | Per message | Message-level dedup; unique per sender per day |
| `PmtInfId` | Initiating party | Per payment group in pain.001 | Group-level dedup |
| `EndToEndId` | Originating customer | Preserved end-to-end | Customer's own reference; never changed |
| `InstrId` | Debtor bank | Per instruction | Bank's instruction-level dedup |
| `TxId` | Debtor bank | Per transaction | Unique transaction reference |
| `UETR` | Debtor bank | Global (gpi) | UUID4; globally unique across all banks |

### Using EndToEndId for Deduplication

```java
// EndToEndId is set once at origin and preserved through the entire chain
// Use it as your idempotency key for customer-facing operations

String endToEndId = "E2E-" + customerId + "-" + UUID.randomUUID();

// Before processing, check if we've seen this EndToEndId before
if (paymentRepository.existsByEndToEndId(endToEndId)) {
    return paymentRepository.findByEndToEndId(endToEndId);
    // Return existing result — do NOT process again
}
```

---

## Idempotency Key Strategies

### 1. Client-Provided Idempotency Key (API pattern)

The API consumer generates a unique key and passes it in a header:

```http
POST /payments
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "amount": 100.00,
  "currency": "AUD",
  "debtorAccount": "062-000/12345678",
  "creditorAccount": "063-000/98765432"
}
```

Server logic:

```java
@PostMapping("/payments")
public ResponseEntity<PaymentResponse> createPayment(
    @RequestHeader("Idempotency-Key") String idempotencyKey,
    @RequestBody PaymentRequest request) {

    // Check if we've seen this key before
    Optional<IdempotencyRecord> existing =
        idempotencyStore.findByKey(idempotencyKey);

    if (existing.isPresent()) {
        // Return cached response — do NOT process again
        return ResponseEntity
            .status(existing.get().getHttpStatus())
            .body(existing.get().getResponse());
    }

    // Process the payment
    PaymentResponse response = paymentService.process(request);

    // Store the idempotency record with TTL
    idempotencyStore.save(IdempotencyRecord.builder()
        .key(idempotencyKey)
        .httpStatus(200)
        .response(response)
        .expiresAt(Instant.now().plus(Duration.ofDays(7)))
        .build());

    return ResponseEntity.ok(response);
}
```

### 2. Content-Based Idempotency Key (hash)

When the client cannot provide a key, derive one from the content:

```java
String idempotencyKey = DigestUtils.sha256Hex(
    debtorAccount +
    creditorAccount +
    amount.toPlainString() +
    currency +
    valueDate.toString() +
    endToEndId
);
```

> ⚠️ Content-based keys are fragile — any field difference (even spacing) creates a different key. Use client-provided keys for APIs wherever possible.

### 3. Database Unique Constraint (at the transaction level)

```java
@Entity
@Table(uniqueConstraints = {
    @UniqueConstraint(columnNames = {"end_to_end_id", "debtor_bsb", "debtor_account"})
})
public class PaymentInstruction {
    private String endToEndId;
    private String debtorBsb;
    private String debtorAccount;
    // ...
}

// In service:
try {
    paymentRepository.save(payment);
} catch (DataIntegrityViolationException e) {
    // Duplicate EndToEndId — return existing record
    return paymentRepository.findByEndToEndId(payment.getEndToEndId());
}
```

---

## At-Least-Once Delivery — Kafka & Messaging

Payment systems commonly use Kafka with **at-least-once delivery semantics** (the default). This means a message may be delivered more than once.

### Problem

```
PaymentCreatedEvent published to Kafka
Consumer reads message, processes payment ✅
Consumer fails before committing offset
Kafka re-delivers message
Consumer processes payment AGAIN ❌ DUPLICATE
```

### Solution — Idempotent Consumer

```java
@KafkaListener(topics = "payment-instructions")
public void handlePaymentInstruction(PaymentInstructionEvent event) {
    String idempotencyKey = event.getMessageId(); // Kafka message key

    // Atomic check-and-insert using Redis or DB
    boolean isNew = idempotencyStore.setIfAbsent(
        "payment:" + idempotencyKey,
        "processed",
        Duration.ofDays(1)
    );

    if (!isNew) {
        log.info("Duplicate message {} — skipping", idempotencyKey);
        return; // Already processed — skip
    }

    // Safe to process
    paymentProcessor.process(event);
}
```

### Kafka Exactly-Once Semantics (EOS)

For highest-reliability payment processing:

```java
// Producer with idempotence enabled
Properties props = new Properties();
props.put("enable.idempotence", true);
props.put("acks", "all");
props.put("retries", Integer.MAX_VALUE);
props.put("max.in.flight.requests.per.connection", 5);

// Transactional producer (exactly-once)
props.put("transactional.id", "payment-producer-1");
```

---

## BECS Batch Idempotency

```java
public class BecsSubmissionService {

    // Generate deterministic submission ID from content
    public SubmissionResult submitBatch(BecsBatch batch) {
        String submissionId = calculateSubmissionId(batch);

        // Prevent duplicate file submission
        if (submissionRepository.existsBySubmissionId(submissionId)) {
            log.warn("Duplicate BECS submission: {}", submissionId);
            return submissionRepository.findBySubmissionId(submissionId);
        }

        // Submit to bank
        SubmissionResult result = bankGateway.submit(batch.toDeFile());

        // Persist with idempotency ID
        submissionRepository.save(SubmissionRecord.builder()
            .submissionId(submissionId)
            .submittedAt(Instant.now())
            .transactionCount(batch.getTransactions().size())
            .totalAmount(batch.getTotalAmount())
            .status(result.getStatus())
            .build());

        return result;
    }

    private String calculateSubmissionId(BecsBatch batch) {
        // Hash of date + batch reference + total amounts
        return DigestUtils.sha256Hex(
            batch.getProcessingDate().toString() +
            batch.getBatchReference() +
            batch.getTotalAmount().toPlainString() +
            batch.getTransactionCount()
        );
    }
}
```

---

## Saga Pattern & Idempotency

In a distributed payment system, a saga coordinates multiple services. Each step must be idempotent.

```
Payment Saga:
  Step 1: Reserve funds (debit hold)      [idempotent: check existing hold]
  Step 2: Send to external network        [idempotent: use EndToEndId]
  Step 3: Confirm receipt                 [idempotent: check status]
  Step 4: Release hold / finalise debit   [idempotent: check if already posted]

Compensating transactions (on failure):
  Cancel Step 4 → debit_reversal          [idempotent: check if reversal exists]
  Cancel Step 3 → payment cancellation    [idempotent: send camt.056 once]
  Cancel Step 2 → recall/return           [idempotent: check pacs.004 exists]
  Cancel Step 1 → release hold            [idempotent: check hold status]
```

```java
// Each saga step checks for idempotency
@Transactional
public void executeStep(String sagaId, SagaStep step) {
    SagaStepRecord record = sagaStepRepository
        .findBySagaIdAndStep(sagaId, step)
        .orElse(null);

    if (record != null && record.isCompleted()) {
        log.info("Saga step {} already completed for {}", step, sagaId);
        return; // Idempotent — skip
    }

    // Execute the step
    StepResult result = step.execute();

    // Mark complete
    sagaStepRepository.save(SagaStepRecord.builder()
        .sagaId(sagaId)
        .step(step.getName())
        .completedAt(Instant.now())
        .result(result)
        .build());
}
```

---

## Idempotency Store Options

| Option | Pros | Cons |
|--------|------|------|
| **PostgreSQL (unique constraint)** | Atomic, transactional | DB write per request |
| **Redis (SETNX/SET NX EX)** | Fast, TTL-based | Separate infra, eventual durability |
| **DynamoDB (conditional write)** | Scalable, serverless | AWS-specific |
| **In-memory (ConcurrentHashMap)** | Zero latency | Lost on restart — development only |

For payment systems, **PostgreSQL unique constraint** is recommended — it participates in the same transaction as the payment record, ensuring atomicity.

---

## Interview Questions

**Q: What is the difference between idempotency and deduplication?**
> Deduplication is one way to achieve idempotency. Idempotency is the property: "calling N times = calling once." Deduplication detects exact duplicate requests and short-circuits them. You can also achieve idempotency through other means (e.g. state machine that ignores already-applied transitions).

**Q: How do you design an idempotent payment API?**
> Require clients to provide an Idempotency-Key header (UUID). On receipt, check a durable store (DB/Redis) for the key. If found, return the cached response. If not found, process and persist the result with the key. Use the same HTTP response status as the original. Set a reasonable TTL (7-30 days). Make the key check atomic with the payment processing using DB transactions.

**Q: Is Kafka's at-least-once delivery safe for payments?**
> At-least-once delivery means messages can be delivered more than once — you must implement idempotent consumers. For payment processing, check a deduplication store (Redis SETNX or DB unique constraint) before processing each message. Alternatively, Kafka's exactly-once semantics (EOS) with transactional producers/consumers eliminates the duplicate delivery concern.

:::danger[Never Do This]
```java
// ❌ WRONG: No idempotency check
@PostMapping("/payments")
public void createPayment(@RequestBody PaymentRequest req) {
    paymentService.debitAccount(req); // Could run twice on retry!
}
```
:::

:::tip[Always Do This]
```java
// ✅ RIGHT: Idempotency key check first
@PostMapping("/payments")
public ResponseEntity<PaymentResponse> createPayment(
    @RequestHeader("Idempotency-Key") String key,
    @RequestBody PaymentRequest req) {
    return idempotencyService.executeOnce(key, () -> paymentService.process(req));
}
```
:::

---

## Related Concepts

- [Payment Lifecycle 101](./payment_lifecycle_101)
- [BECS](./becs)
- [NPP](./npp)
- [Debit Posting](./debit_post)
- [Payment Exceptions](./payment_exceptions)
- [Reconciliation](./reconciliation)
