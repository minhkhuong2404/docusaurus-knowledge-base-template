---
sidebar_position: 10
title: 'Chapter 9: Testing'
description: '**Part II — Implementation**'
tags:
- books
- building-microservice
- chapter-09
---
# Chapter 9: Testing

**Part II — Implementation**

> Testing microservices is harder than testing a monolith. More services means more integration surfaces, more potential failures, and slower end-to-end test suites. This chapter explains how to test effectively without getting paralyzed by complexity.

---

## Why Testing Microservices Is Different

In a monolith, an end-to-end test spins up one process. In a microservice architecture, a single user journey might involve 5–10 services, each with its own database, potentially on separate infrastructure. End-to-end tests become:

- **Slow** — spin up and tear down many services
- **Flaky** — more moving parts = more failure points
- **Expensive** — maintaining complex test environments

The solution is not to abandon testing — it's to **test smarter** by relying more on lower-cost tests and using high-cost tests sparingly.

---

## The Test Pyramid

Mike Cohn's Test Pyramid describes the ideal distribution of test types:

```
          /\
         /  \
        / E2E\          ← Few, slow, expensive, high confidence
       /──────\
      / Service\        ← Some, moderate speed
     /   Tests  \
    /────────────\
   /  Unit Tests  \     ← Many, fast, cheap, low-level confidence
  /────────────────\
```

The higher up the pyramid, the more expensive, slower, and more brittle the test. The pyramid says: **invest heavily at the bottom, lightly at the top**.

### In Practice for Microservices

| Layer | What it tests | Example in Spring |
|---|---|---|
| **Unit** | Single class/function in isolation | JUnit 5 + Mockito |
| **Integration** | Service + its dependencies (DB, external config) | `@SpringBootTest`, Testcontainers |
| **Contract** | API contract between services | Spring Cloud Contract, Pact |
| **Component** | Full service in isolation (stubbed dependencies) | WireMock + `@SpringBootTest` |
| **End-to-End** | Full system from UI to database | Playwright, Selenium, Karate |

---

## Unit Tests

Test the smallest units of logic in complete isolation. Mock all dependencies.

```java
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private PaymentClient paymentClient;

    @InjectMocks
    private OrderService orderService;

    @Test
    void shouldCreateOrderSuccessfully() {
        // Given
        CreateOrderRequest request = new CreateOrderRequest("customer-1", List.of(...));
        when(paymentClient.charge(any())).thenReturn(new PaymentResult("payment-1"));
        when(orderRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        // When
        Order result = orderService.createOrder(request);

        // Then
        assertThat(result.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
        verify(orderRepository).save(any(Order.class));
    }
}
```

**Fast, deterministic, cheap to run** — the backbone of your test suite.

---

## Integration Tests

Test the service with its real dependencies (database, cache, message broker). Use **Testcontainers** to spin up real infrastructure in Docker.

```java
@SpringBootTest
@Testcontainers
class OrderRepositoryIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15")
        .withDatabaseName("orders")
        .withUsername("test")
        .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private OrderRepository orderRepository;

    @Test
    void shouldPersistAndRetrieveOrder() {
        Order order = new Order("customer-1");
        orderRepository.save(order);

        Optional<Order> found = orderRepository.findById(order.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getCustomerId()).isEqualTo("customer-1");
    }
}
```

Testcontainers gives you a real PostgreSQL, Kafka, Redis, or any other Docker image in your tests — no mocking of infrastructure.

---

## Contract Tests

This is where microservice testing diverges most from monolith testing.

**Problem:** When Service A calls Service B's API, both teams evolve independently. How do you ensure Service A's expectations stay in sync with Service B's actual behavior?

### Consumer-Driven Contract Testing (Pact)

1. **Consumer** (Service A) defines what it expects from the **Provider** (Service B) — the "contract"
2. **Provider** runs the contract tests against its own code to verify it fulfills the contract
3. If the Provider breaks a contract, the test fails — *before* deployment

```java
// Consumer test (Order Service consuming Inventory Service)
@ExtendWith(PactConsumerTestExt.class)
@PactTestFor(providerName = "inventory-service")
class InventoryClientPactTest {

    @Pact(consumer = "order-service")
    public RequestResponsePact reserveStockPact(PactDslWithProvider builder) {
        return builder
            .given("product SKU-123 is available")
            .uponReceiving("a request to reserve stock")
            .path("/inventory/reserve")
            .method("POST")
            .body(new PactDslJsonBody()
                .stringValue("sku", "SKU-123")
                .integerType("quantity", 2))
            .willRespondWith()
            .status(200)
            .body(new PactDslJsonBody()
                .stringValue("reservationId", "res-1"))
            .toPact();
    }

    @Test
    @PactTestFor(pactMethod = "reserveStockPact")
    void shouldReserveStock(MockServer mockServer) {
        InventoryClient client = new InventoryClient(mockServer.getUrl());
        ReservationResult result = client.reserve("SKU-123", 2);
        assertThat(result.getReservationId()).isNotBlank();
    }
}
```

**Spring Cloud Contract** is the Spring-native alternative to Pact. The provider defines contracts as Groovy DSL or YAML; the framework generates tests.

---

## Component Tests

Test the entire service in isolation — all internal components wired together, but with external service calls stubbed out. Uses **WireMock** to simulate upstream/downstream services.

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWireMock(port = 0)
class OrderServiceComponentTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void shouldCreateOrderWhenInventoryAvailable() {
        // Stub inventory service
        stubFor(post(urlEqualTo("/inventory/reserve"))
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBody("{\"reservationId\": \"res-1\"}")));

        // Call our service
        CreateOrderRequest request = new CreateOrderRequest("customer-1", List.of(...));
        ResponseEntity<OrderDto> response = restTemplate.postForEntity("/orders", request, OrderDto.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().getStatus()).isEqualTo("CONFIRMED");
    }
}
```

---

## End-to-End Tests

Run sparingly. Use for the most critical user journeys only. Keep the suite small and focused.

### Problems with Large E2E Test Suites
- **Slow** — can take 30–60 minutes
- **Flaky** — network timeouts, service startup timing, order-dependent state
- **Ownership unclear** — who owns a test that spans 6 services?

:::tip[Apply the "10-minute rule": if your full automated test suite takes more than 10 minutes, it will slow down your CI pipeline and developers will start skipping it.]
:::

---

## Testing in Production

Modern practice shifts some testing to production itself:

### Synthetic Monitoring
Run scripted "fake" user journeys in production on a schedule. Alert if they fail.

### A/B Testing
Deploy two versions and observe which performs better with real users.

### Chaos Engineering
Deliberately inject failures (kill services, slow network) to test resilience. Tools: Chaos Monkey, Gremlin.

### Feature Flags
Deploy new code behind a flag. Enable for 1% of users first. Monitor. Roll out gradually.

---

## Summary

| Test Type | Scope | Speed | Use |
|---|---|---|---|
| Unit | Single class | Very fast | Everywhere — business logic |
| Integration | Service + DB/infra | Moderate | Database queries, messaging |
| Contract (Pact) | API between 2 services | Fast | API evolution safety net |
| Component | Full service (stubbed deps) | Moderate | Service behavior in isolation |
| End-to-End | Full system | Slow | Critical happy paths only |
| In-production | Real users | Real-time | Synthetic monitoring, chaos |
