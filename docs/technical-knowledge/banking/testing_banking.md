---
id: testing_banking
title: Testing in Banking & Payments
sidebar_label: Testing in Payments
sidebar_position: 3
---

# Testing in Banking & Payments

## Overview

Testing in banking is **high-stakes** — a defect in a payment system can result in customer funds lost, duplicate payments, regulatory breaches, or system outages. As a result, banking teams invest heavily in testing practices, environments, and tooling.

---

## Why Testing Is Critical in Payments

| Risk | Consequence |
|------|-------------|
| Duplicate payment bug | Double-debit of customer account |
| Wrong amount calculation | Financial loss / customer complaint |
| Sanctions screening bypass | Regulatory breach (massive fine) |
| Missing debit reversal | Funds not returned after rejection |
| Settlement amount mismatch | Reconciliation failure |
| Race condition in concurrent posts | Incorrect balance |
| Idempotency failure | Same payment processed twice on retry |

---

## Test Types in Payment Systems

### 1. Unit Tests
Test individual classes/methods in isolation.

```java
@Test
void shouldCalculateNetSettlementAmount() {
    // Given
    BigDecimal gross = new BigDecimal("10000.00");
    BigDecimal fee = new BigDecimal("15.00");
    
    // When
    BigDecimal net = feeCalculator.calculateNet(gross, fee);
    
    // Then
    assertThat(net).isEqualByComparingTo("9985.00");
}

@Test
void shouldRejectPaymentWhenInsufficientFunds() {
    // Given
    Account account = Account.withBalance("100.00");
    
    // When / Then
    assertThatThrownBy(() -> 
        paymentService.debit(account, new BigDecimal("200.00")))
        .isInstanceOf(InsufficientFundsException.class);
}
```

### 2. Integration Tests
Test the interaction between components — e.g., payment service + database + CBS.

```java
@SpringBootTest
@Testcontainers
class PaymentRepositoryIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15");

    @Test
    void shouldPersistAndRetrievePaymentByEndToEndId() {
        PaymentOrder order = buildTestPayment("E2E-001");
        repository.save(order);
        
        Optional<PaymentOrder> found = repository.findByEndToEndId("E2E-001");
        
        assertThat(found).isPresent();
        assertThat(found.get().getAmount()).isEqualByComparingTo("500.00");
    }
}
```

### 3. End-to-End (E2E) Tests
Test the full payment flow from instruction to posting.

```java
@Test
void fullNppPaymentFlowShouldCompleteSuccessfully() {
    // Given: a payment instruction
    PaymentRequest request = PaymentRequest.builder()
        .debtorBsb("062-000").debtorAccount("11111111")
        .creditorBsb("032-000").creditorAccount("22222222")
        .amount(new BigDecimal("500.00"))
        .endToEndId("E2E-TEST-001")
        .build();
    
    // When: submitted
    String paymentId = paymentClient.submit(request);
    
    // Then: payment should be SETTLED within 30 seconds
    await().atMost(30, SECONDS).until(() ->
        paymentRepository.findById(paymentId)
            .map(p -> p.getStatus() == SETTLED)
            .orElse(false)
    );
    
    // And: debtor account debited
    assertThat(accountService.getBalance("11111111"))
        .isEqualByComparingTo("500.00"); // starting balance was 1000
    
    // And: creditor account credited
    assertThat(accountService.getBalance("22222222"))
        .isEqualByComparingTo("500.00");
}
```

### 4. Contract Tests
In a microservices landscape, contract tests verify that a service's API matches what its consumers expect — critical in payments where many services exchange ISO 20022 messages.

```java
// Pact consumer contract test
@ExtendWith(PactConsumerTestExt.class)
class Pacs008ConsumerContractTest {
    
    @Pact(consumer = "payment-processor", provider = "npp-gateway")
    RequestResponsePact createPact(PactDslWithProvider builder) {
        return builder
            .given("NPP gateway is available")
            .uponReceiving("a valid pacs.008 message")
            .path("/npp/payments")
            .method("POST")
            .body(validPacs008Json())
            .willRespondWith()
            .status(200)
            .body(pacs002AcceptedJson())
            .toPact();
    }
}
```

### 5. Performance / Load Tests
Payments must handle peak volumes (e.g., Monday morning payroll).

```
Tools: k6, Apache JMeter, Gatling

Test scenarios:
├── Steady load:   100 TPS sustained for 1 hour
├── Ramp up:       0 → 500 TPS over 10 minutes
├── Spike:         Sudden 5x load increase
└── Soak test:     50 TPS for 12 hours (memory leaks, etc.)

Key metrics:
├── P99 latency < 500ms (NPP must be < 15s end-to-end)
├── Zero errors under normal load
└── Graceful degradation under extreme load
```

### 6. Chaos / Resilience Tests
Deliberately break things to verify the system handles failures.

```
Scenarios:
├── CBS unavailable: Does payment queue? Does it resume on recovery?
├── NPP network timeout: Does debit reverse? Is idempotency preserved?
├── Database failover: Do in-flight payments complete or fail cleanly?
└── Sanctions service down: Does payment halt (fail-safe)?
```

---

## Test Environments in Banking

Banks maintain multiple environments to manage risk:

```
DEV         ← Developer sandbox; often mocked dependencies
     │
     ▼
SIT         ← System Integration Testing; real-ish services
(System      Internal: CBS, fraud, sanctions all wired up
 Integration) Scheme: Stubbed or vendor sandbox
Test)
     │
     ▼
UAT         ← User Acceptance Testing; business validates
(User         Closest to production
 Acceptance   Scheme: Vendor-provided test environments (NPP SIT, SWIFT LAU)
 Testing)
     │
     ▼
PREPROD     ← Final gate; identical to production config
(Staging)     Only hotfixes and release candidates here
     │
     ▼
PROD        ← Live environment
```

---

## Scheme Test Environments

Each payment scheme provides test infrastructure:

| Scheme | Test Environment |
|--------|----------------|
| **NPP** | NPP SIT (System Integration Testing) environment, managed by NPPA |
| **SWIFT** | SWIFT LAU (Live Application Update) / Alliance Gateway test |
| **BECS** | AusPayNet test facility |
| **RTGS/HVCS** | RBA test RTGS environment |

For NPP SIT:
```
- Simulates full NPP message routing
- Test BSBs allocated per participant
- pacs.008 / pacs.002 / pacs.004 all testable
- PayID lookup returns test data
- Settlement is simulated (not real money)
```

---

## Idempotency Testing

**Critical in payments** — the same payment must not be processed twice if:
- Client retries due to network timeout
- Message is delivered twice by the broker

```java
// Test idempotency
@Test
void submittingSamePaymentTwiceShouldOnlyProcessOnce() {
    PaymentRequest request = buildPaymentWithId("UNIQUE-ID-001");
    
    // Submit twice
    paymentService.process(request);
    paymentService.process(request);  // Duplicate
    
    // Should only have one ledger entry
    List<LedgerEntry> entries = ledgerRepository
        .findByEndToEndId("UNIQUE-ID-001");
    
    assertThat(entries).hasSize(1);
    
    // And only one payment record
    long paymentCount = paymentRepository.countByEndToEndId("UNIQUE-ID-001");
    assertThat(paymentCount).isEqualTo(1);
}
```

---

## ISO 20022 Message Testing

Testing XML-based ISO 20022 messages:

```java
@Test
void shouldProduceValidPacs008XmlAgainstXsd() throws Exception {
    // Build a pacs.008
    FIToFICustomerCreditTransferV10 msg = pacs008Builder.build(testOrder);
    
    // Marshal to XML
    String xml = jaxbMarshaller.marshal(msg);
    
    // Validate against XSD schema
    SchemaFactory factory = SchemaFactory.newInstance(XMLConstants.W3C_XML_SCHEMA_NS_URI);
    Schema schema = factory.newSchema(
        new StreamSource(getClass().getResourceAsStream("/xsd/pacs.008.001.10.xsd")));
    
    Validator validator = schema.newValidator();
    assertDoesNotThrow(() -> 
        validator.validate(new StreamSource(new StringReader(xml))));
}
```

---

## Testing Checklist for Payment Features

Before shipping any payment change:

- [ ] **Happy path** — Payment completes successfully end-to-end
- [ ] **Insufficient funds** — Debit rejected; no pacs.008 sent
- [ ] **Invalid account** — Correct error returned; no debit posted
- [ ] **Duplicate submission** — Second request rejected; no double-posting
- [ ] **Sanctions match** — Payment blocked; compliance alert raised
- [ ] **Network timeout** — Debit reversal triggered; no orphaned debit
- [ ] **Partial return** — pacs.004 with partial amount handled correctly
- [ ] **Concurrency** — Two requests for same account simultaneously — no race condition
- [ ] **Large amounts** — BigDecimal precision (never use `double` for money)
- [ ] **Currency rounding** — AUD rounds to 2 decimal places; JPY to 0
- [ ] **Schema validation** — ISO 20022 XML validates against XSD
- [ ] **Audit log** — All events written to audit trail

---

## Golden Rule: Never Use `double` for Money

```java
// ❌ WRONG — floating point precision error
double a = 0.1 + 0.2;
System.out.println(a);  // 0.30000000000000004  ← WRONG

// ✅ CORRECT — use BigDecimal
BigDecimal a = new BigDecimal("0.1").add(new BigDecimal("0.2"));
System.out.println(a);  // 0.3  ← CORRECT

// ✅ For currency, always specify scale and rounding
BigDecimal amount = new BigDecimal("1234.567")
    .setScale(2, RoundingMode.HALF_UP);  // 1234.57
```

---

## Useful Libraries (Java)

| Library | Use |
|---------|-----|
| **JUnit 5** | Test framework |
| **Mockito** | Mocking dependencies |
| **Testcontainers** | Spin up real PostgreSQL, Kafka, Redis in tests |
| **WireMock** | Mock external HTTP APIs (CBS, sanctions service) |
| **Awaitility** | Async assertions (wait for payment to settle) |
| **AssertJ** | Fluent assertions |
| **JAXB** | ISO 20022 XML marshalling/unmarshalling |
| **prowide-iso20022** | ISO 20022 message library for Java |

---

## Related Concepts
- [payment_lifecycle_101.md](./payment_lifecycle_101.md) — What you're testing
- [payment_exceptions.md](./payment_exceptions.md) — Edge cases to test
- [core_banking.md](./core_banking.md) — System under test (posting engine)
- [pacs004.md](./pacs004.md) — Return handling test cases
- [reconciliation.md](./reconciliation.md) — Reconciliation test scenarios
