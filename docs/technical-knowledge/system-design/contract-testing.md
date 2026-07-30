---
id: contract-testing
title: Contract Testing
sidebar_label: Contract Testing
description: Complete guide to Consumer-Driven Contract Testing in microservices, detailing Pact framework integration, CI/CD setup, and trade-offs.
tags: [system-design, microservices, testing, pact, ci-cd]
---

import ContractTestingPactFlowDiagram from '@site/src/components/ContractTestingPactFlowDiagram';

# Contract Testing

In a microservices architecture, services change constantly. If Service B changes its API structure (e.g., changing a variable type or deleting a field), Service A will crash when it attempts to call B in production. **Contract Testing** catches these integration bugs in the build pipeline without requiring heavy, brittle, and slow End-to-End (E2E) integration test environments.

---

## Consumer-Driven Contract Testing (Pact Flow)

<ContractTestingPactFlowDiagram />

---

## Setup & Implementation

Below is a Spring Boot contract test displaying both the Consumer definition and the Provider verification.

### 1. Consumer Test (Order Service)
The consumer defines exactly what request it will make and the exact response schema it expects from the Payment Service:

```java
@ExtendWith(PactConsumerTestExt.class)
@PactTestFor(providerName = "payment-service")
public class OrderServiceContractTest {

    @Pact(consumer = "order-service")
    public RequestResponsePact createPaymentPact(PactDslWithProvider builder) {
        return builder
            .given("payment gateway is active")
            .uponReceiving("a request to capture payment")
                .path("/api/payments/charge")
                .method("POST")
                .headers("Content-Type", "application/json")
                .body(new PactDslJsonBody()
                    .stringType("orderId", "order-100")
                    .decimalType("amount", 99.99))
            .willRespondWith()
                .status(200)
                .body(new PactDslJsonBody()
                    .stringType("transactionId") // Assert type matches string
                    .stringValue("status", "SUCCESS")) // Assert exact value match
            .toPact();
    }

    @Test
    @PactTestFor(pactMethod = "createPaymentPact")
    public void runTest(MockServer mockServer) {
        PaymentClient client = new PaymentClient(mockServer.getUrl());
        PaymentResult result = client.charge(new ChargeRequest("order-100", new BigDecimal("99.99")));
        
        assertEquals("SUCCESS", result.getStatus());
        assertNotNull(result.getTransactionId());
    }
}
```

Running this test generates a contract JSON file (e.g., `target/pacts/order-service-payment-service.json`).

---

### 2. Provider Verification Test (Payment Service)
The provider loads the contract from the Pact Broker and automatically replays requests against its local controllers:

```java
@Provider("payment-service")
@PactFolder("pacts") // Or @PactBroker(url = "http://pact-broker.company.com")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class PaymentProviderTest {

    @LocalServerPort
    private int port;

    @BeforeEach
    public void setupTestTarget(PactVerificationContext context) {
        context.setTarget(new HttpTestTarget("localhost", port));
    }

    @TestTemplate
    @ExtendWith(PactVerificationInvocationContextProvider.class)
    public void verifyPacts(PactVerificationContext context) {
        context.verifyInteraction(); // Replays all consumer requests
    }

    // Set up database/mock states matching the "given" conditions in the pact
    @State("payment gateway is active")
    public void setPaymentGatewayState() {
        // Prepare database mock data or configure local stubs
    }
}
```

---

## Pros vs. Cons

| Pros | Cons |
| :--- | :--- |
| **Fast Build Feedback**: Verification runs in seconds as part of unit testing, without booting up Docker containers or network dependencies. | **High Learning Curve**: Teams must learn mock behaviors and the concept of states (`@State`) in Pact. |
| **Mock Integrity**: Guarantees that local stubs used in consumer unit tests match real provider behaviors. | **State Coordination**: Mocking database states in the provider to match consumer expectations can become complex. |
| **Eliminates E2E Testing**: Replaces brittle integration test suites that fail due to unrelated environment issues. | **Broker Hosting**: Requires deploying, hosting, and backing up a centralized Pact Broker application. |

---

## Common Gotchas & Anti-Patterns

1. **Testing Business Logic**: Verifying negative test states or complex calculation results via contracts. Contracts should strictly verify API shape, schema structures, and path definitions. Leave business rules to local unit tests.
2. **Ignoring the `can-i-deploy` step**: Running verification tests but omitting the CLI check in the CI release pipeline. Without blocking releases on failed contract verification, the testing loop is useless.
3. **Hardcoding Dynamic Fields**: Writing assertions on variable response fields (like timestamp values `createdAt: "2026-07-03T10:15:30Z"`). 
   - *Solution*: Use type-based matching rule parameters (`.datetimeType("createdAt")`) instead of string values.
4. **Tolerate unknown fields**: Configure consumers to ignore unknown fields (`@JsonIgnoreProperties(ignoreUnknown = true)`) so provider additions do not break contracts.
