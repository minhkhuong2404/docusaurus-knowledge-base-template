---
id: testing-concepts
title: Testing Concepts
sidebar_label: 🧪 Concepts & Best Practices
description: From first principles to production — unit testing, integration testing, the test pyramid, mocking strategies, TDD, and battle-tested best practices for Java/Spring engineers.
tags: [testing, unit-test, integration-test, tdd, mocking, mockito, test-pyramid, best-practices]
---

import TestingPyramidDoublesDiagram from '@site/src/components/TestingPyramidDoublesDiagram';

# Testing Concepts & Best Practices

:::info[Who this guide is for]
- **New learners** — start at [Why Do We Test?](#why-do-we-test) and read top-to-bottom. Every concept is explained from scratch before code appears.
- **Senior engineers** — jump to [Advanced Patterns](#advanced-testing-patterns), [Anti-Patterns](#testing-anti-patterns), or [Interview Questions](#interview-questions).
:::

---

## Why Do We Test?

Imagine you build a house and skip all inspections. The electrician wired everything, the plumber connected the pipes — you just assume it works and move in. Six months later, a pipe bursts inside the wall and floods three rooms.

**Tests are your inspections.** They verify that every piece of your codebase works correctly — before it reaches production.

Without tests:
- Every code change is a gamble — "did I break something else?"
- Bugs are discovered by users instead of engineers
- Refactoring becomes terrifying — nobody dares to clean up code
- Onboarding new engineers is slow — no safety net to learn against

With tests:
- You catch regressions in seconds, not days
- You refactor fearlessly — tests confirm behavior didn't change
- You document intent — tests show *how* code is supposed to be used
- You deploy with confidence — CI/CD gates prevent broken code from shipping

---

## Types of Tests

### The Test Pyramid & Test Doubles Explorer

<TestingPyramidDoublesDiagram />

---

| Level | What It Tests | Speed | Dependencies | Confidence |
|-------|--------------|-------|-------------|------------|
| **Unit** | Single class/method in isolation | ⚡ ~ms | None (mocked) | Logic correctness |
| **Integration** | Multiple components wired together | 🐢 ~seconds | Real DB, HTTP, queues | Wiring correctness |
| **E2E** | Full user flow through the entire system | 🐌 ~minutes | Everything real | System works end-to-end |

:::tip[The 70/20/10 Rule (Google's approach)]
Aim for roughly **70% unit tests**, **20% integration tests**, and **10% E2E tests**. This gives maximum coverage with minimum execution time.
:::

---

### Unit Testing

A unit test isolates a **single class or function** and verifies its logic. External dependencies (databases, APIs, other services) are replaced with **mocks** or **stubs**.

```java
// Class under test — pure business logic
public class PricingService {

    private final TaxCalculator taxCalculator;
    private final DiscountRepository discountRepo;

    public BigDecimal calculateFinalPrice(String productId, BigDecimal basePrice) {
        Discount discount = discountRepo.findByProductId(productId)
            .orElse(Discount.NONE);

        BigDecimal discounted = basePrice.subtract(discount.getAmount());
        BigDecimal tax = taxCalculator.calculateTax(discounted);

        return discounted.add(tax);
    }
}

// Unit test — dependencies are mocked
@ExtendWith(MockitoExtension.class)
class PricingServiceTest {

    @Mock private TaxCalculator taxCalculator;
    @Mock private DiscountRepository discountRepo;
    @InjectMocks private PricingService pricingService;

    @Test
    void calculateFinalPrice_withDiscount_appliesDiscountThenTax() {
        // Arrange (Given)
        when(discountRepo.findByProductId("PROD-1"))
            .thenReturn(Optional.of(new Discount(new BigDecimal("10.00"))));
        when(taxCalculator.calculateTax(new BigDecimal("90.00")))
            .thenReturn(new BigDecimal("9.00"));

        // Act (When)
        BigDecimal result = pricingService.calculateFinalPrice(
            "PROD-1", new BigDecimal("100.00"));

        // Assert (Then)
        assertEquals(new BigDecimal("99.00"), result);
        verify(taxCalculator).calculateTax(new BigDecimal("90.00"));
    }

    @Test
    void calculateFinalPrice_noDiscount_appliesTaxOnly() {
        when(discountRepo.findByProductId("PROD-2"))
            .thenReturn(Optional.empty());
        when(taxCalculator.calculateTax(new BigDecimal("100.00")))
            .thenReturn(new BigDecimal("10.00"));

        BigDecimal result = pricingService.calculateFinalPrice(
            "PROD-2", new BigDecimal("100.00"));

        assertEquals(new BigDecimal("110.00"), result);
    }
}
```

**Key characteristics of good unit tests:**
- Run in **milliseconds** (no I/O, no network, no DB)
- Test **one behavior** per test method
- Use **descriptive names** that read like a specification
- Follow **Arrange → Act → Assert** structure

---

### Integration Testing

Integration tests verify that **multiple components work together correctly** — the wiring between your code and real infrastructure (database, HTTP endpoints, message queues).

```java
// Integration test — starts real Spring context + in-memory DB
@SpringBootTest
@AutoConfigureMockMvc
@Transactional   // rolls back after each test — clean state
class OrderControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private OrderRepository orderRepo;

    @Test
    void createOrder_savesToDatabase_andReturns201() throws Exception {
        String requestBody = """
            {
                "productId": "PROD-1",
                "quantity": 2,
                "customerId": "CUST-100"
            }
            """;

        mockMvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.orderId").exists())
            .andExpect(jsonPath("$.status").value("PENDING"));

        // Verify side effect — data actually persisted
        assertEquals(1, orderRepo.count());
        Order saved = orderRepo.findAll().get(0);
        assertEquals("PROD-1", saved.getProductId());
        assertEquals(2, saved.getQuantity());
    }

    @Test
    void createOrder_invalidPayload_returns400() throws Exception {
        mockMvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))  // missing required fields
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors").isNotEmpty());
    }
}
```

---

### System & End-to-End (E2E) Testing

System tests evaluate the entire integrated application as a whole against complete functional and non-functional requirements (real databases, Kafka brokers, caches, and HTTP clients). External 3rd party services are stubbed using tools like WireMock.

---

## 📦 Testing Paradigms: Black-Box vs White-Box vs Grey-Box

Testing can also be categorized by the **degree of internal code visibility**:

| Paradigm | Internal Code Knowledge | Refactoring Resilience | Primary Focus |
|---|---|---|---|
| **Black-Box Testing** | None (Opaque box) | 🛡️ **Highest** (Immune to internal refactoring) | Specification, API contracts, user journeys, NFRs |
| **White-Box Testing** | Full (Source code, classes, memory) | ⚠️ **Low** (Breaks on internal code changes) | Branch/line coverage, internal algorithms, loops |
| **Grey-Box Testing** | Partial (DB schema, architecture) | ⚖️ **Moderate** | API data integrity, security, distributed transactions |

> 🚀 **Deep Dive**: For a complete analysis of Equivalence Partitioning (EP), Boundary Value Analysis (BVA), Non-Functional Requirements (NFR) testing, and Testcontainers architecture, see **[Black-Box & System Testing Guide](./blackbox-and-system-testing.md)**.

---

## 🧠 Deep Dive: Mocking vs Stubbing vs Spying

Understanding the difference is critical for writing effective tests.

<TestingPyramidDoublesDiagram initialTab="doubles" />

### Side-by-Side Comparison

```java
// ── MOCK: verify interactions ─────────────────────────────
@Mock
private EmailService emailService;

@Test
void registerUser_sendsWelcomeEmail() {
    userService.register(new User("alice@example.com"));

    // We don't care what the email service RETURNS
    // We care that it was CALLED with the right argument
    verify(emailService).sendWelcomeEmail("alice@example.com");
}

// ── STUB: control return values ───────────────────────────
@Mock
private UserRepository userRepo;  // Mockito @Mock can act as a stub

@Test
void findUser_returnsUser_whenExists() {
    // We don't care HOW MANY TIMES this is called
    // We just need it to return a specific value
    when(userRepo.findById(1L)).thenReturn(Optional.of(alice));

    User result = userService.findUser(1L);
    assertEquals("Alice", result.getName());
}

// ── SPY: partial mock on a real object ────────────────────
@Spy
private List<String> spyList = new ArrayList<>();

@Test
void spy_callsRealMethod_unlessStubbed() {
    spyList.add("one");          // real add() is called
    spyList.add("two");
    assertEquals(2, spyList.size());  // real size()

    doReturn(100).when(spyList).size();  // stub only size()
    assertEquals(100, spyList.size());   // stubbed
    assertEquals("one", spyList.get(0)); // still real
}
```

:::warning[When to use Spy vs Mock]
Use **Mock** (default choice) when you want full control and isolation. Use **Spy** only when you need the *real* behavior of most methods and want to override just one or two — common when testing legacy code you can't easily refactor.
:::

---

## The FIRST Principles of Unit Testing

| Principle | Meaning | Violation Example |
|-----------|---------|-------------------|
| **F**ast | Tests run in milliseconds | Test makes a real HTTP call taking 2 seconds |
| **I**ndependent | No test depends on another | Test B fails if Test A doesn't run first |
| **R**epeatable | Same result every time, anywhere | Test fails on Tuesdays because it checks `LocalDate.now()` |
| **S**elf-validating | Pass/fail is automatic | Test prints output that a human must read to judge |
| **T**imely | Written alongside production code | Tests written 3 months after the feature shipped |

---

## The Given-When-Then Pattern (BDD)

Every test should read like a sentence:

```
GIVEN [a precondition]
WHEN  [an action occurs]
THEN  [an expected result happens]
```

```java
@Test
void shouldRejectWithdrawal_whenInsufficientBalance() {
    // Given — account with $100
    BankAccount account = new BankAccount(new BigDecimal("100.00"));

    // When — attempt to withdraw $150
    InsufficientFundsException ex = assertThrows(
        InsufficientFundsException.class,
        () -> account.withdraw(new BigDecimal("150.00"))
    );

    // Then — meaningful error, balance unchanged
    assertEquals("Insufficient balance: $100.00 < $150.00", ex.getMessage());
    assertEquals(new BigDecimal("100.00"), account.getBalance());
}
```

---

## Advanced Testing Patterns

### Parameterized Tests — Test Many Inputs with One Method

```java
@ParameterizedTest(name = "isValidEmail({0}) should be {1}")
@CsvSource({
    "alice@example.com,  true",
    "bob@company.co.uk,  true",
    "'',                  false",
    "not-an-email,       false",
    "@missing-local.com, false",
    "spaces in@here.com, false"
})
void isValidEmail(String email, boolean expected) {
    assertEquals(expected, EmailValidator.isValid(email));
}
```

### Custom Assertions — Make Tests Read Like Specs

```java
// Instead of:
assertEquals("SHIPPED", order.getStatus());
assertNotNull(order.getShippedAt());
assertTrue(order.getTrackingNumber().startsWith("TRK-"));

// Create a custom assertion (AssertJ style):
assertThat(order)
    .hasStatus("SHIPPED")
    .hasTrackingNumberStartingWith("TRK-")
    .wasShippedWithinLast(Duration.ofMinutes(5));
```

### Testcontainers — Real Databases in Tests

```java
@SpringBootTest
@Testcontainers
class OrderRepositoryIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private OrderRepository orderRepo;

    @Test
    void savesAndRetrievesOrder() {
        Order saved = orderRepo.save(new Order("PROD-1", 2));
        Order found = orderRepo.findById(saved.getId()).orElseThrow();
        assertEquals("PROD-1", found.getProductId());
    }
}
```

---

## Testing Anti-Patterns

| Anti-Pattern | What Goes Wrong | Fix |
|---|---|---|
| **Testing implementation, not behavior** | Verifying internal method calls instead of outcomes — breaks on every refactor | Assert on **observable output** (return values, state changes, side effects) |
| **One giant test method** | 200-line test that checks 15 things — impossible to debug when it fails | **One assertion per concept** per test method |
| **Over-mocking** | Mocking everything including the class under test — tests pass but real code is broken | Mock **only external boundaries** (DB, HTTP, message queues) |
| **Flaky tests** | Tests that pass/fail randomly due to timing, ordering, or shared state | Use `@Transactional` rollback, fixed clocks, and isolated test data |
| **Copy-paste test data** | Same JSON payload duplicated in 30 test methods — painful to maintain | Use **test fixtures** or **builder patterns** for test data |
| **Testing framework code** | Testing that Spring `@Autowired` works — that's Spring's job | Focus on **your** business logic and wiring |
| **No negative tests** | Only testing the happy path — real bugs live in edge cases | Test **invalid input, empty collections, null values, exceptions** |

:::tip[The "Delete The Test" Litmus Test]
If you deleted a test and introduced a bug, would that test have caught it? If not, the test provides no value — it's testing implementation details, not behavior.
:::

---

## Test Organization in a Spring Boot Project

```
src/
├── main/java/com/example/shop/
│   ├── order/
│   │   ├── OrderController.java
│   │   ├── OrderService.java
│   │   └── OrderRepository.java
│   └── payment/
│       ├── PaymentClient.java
│       └── PaymentService.java
│
└── test/java/com/example/shop/
    ├── order/
    │   ├── OrderServiceTest.java           ← Unit test (Mockito)
    │   ├── OrderControllerTest.java        ← @WebMvcTest (sliced)
    │   └── OrderIntegrationTest.java       ← @SpringBootTest + Testcontainers
    ├── payment/
    │   ├── PaymentServiceTest.java         ← Unit test
    │   └── PaymentClientIntegrationTest.java ← WireMock
    └── testutil/
        ├── TestDataFactory.java            ← Shared test builders
        └── IntegrationTestBase.java        ← Shared @Testcontainers setup
```

---

## Interview Questions

### For New Learners

**Q: What is the difference between a unit test and an integration test?**
> A unit test isolates a single class/method and mocks all dependencies — it verifies logic correctness and runs in milliseconds. An integration test verifies that multiple components work together (controller → service → database) — it catches wiring bugs and runs in seconds.

**Q: What is the test pyramid and why does it matter?**
> The test pyramid recommends many fast unit tests at the base, fewer integration tests in the middle, and very few E2E tests at the top. This gives maximum confidence with minimum execution time. An inverted pyramid (many E2E, few unit tests) leads to slow, fragile CI pipelines.

**Q: What is the difference between a mock and a stub?**
> A stub returns pre-programmed answers — you use it to control what a dependency *returns*. A mock records calls — you use it to verify that a dependency was *called* correctly. In Mockito, `when(...).thenReturn(...)` is stubbing; `verify(...)` is mocking.

### For Senior Engineers

**Q: How do you decide what belongs in unit tests vs integration tests in a microservice?**
> Keep business rules, validation logic, and pure computations in unit tests. Put framework wiring, persistence queries, serialization/deserialization, and network boundaries in integration tests. A good signal: if the behavior depends only on input/output and has no I/O, unit test it. If it involves Spring context, database, or HTTP, integration test it.

**Q: How do you reduce flaky tests in CI?**
> Remove time dependencies (inject clocks), remove ordering dependencies (each test sets up its own state), control randomness (seed random generators), use `@Transactional` rollback for DB isolation, use Testcontainers instead of shared databases, and avoid `Thread.sleep()` — use `Awaitility` for async assertions.

**Q: What is the risk of over-mocking?**
> Tests become coupled to implementation details. They pass even when real integration behavior is broken. If you mock the repository and service layer in every test, you'll never catch bugs in your actual SQL queries, serialization, or transaction boundaries. The fix: mock external boundaries only, and write integration tests for the wiring.

**Q: When should you use consumer-driven contract tests?**
> When teams evolve APIs independently. Provider team publishes a contract (e.g., with Pact), consumer team writes tests against that contract. If the provider changes the API in a breaking way, the contract test fails before deployment — preventing runtime integration failures.

**Q: How do you measure test effectiveness beyond coverage percentage?**
> Track **mutation testing score** (PIT — how many injected bugs do tests catch?), **escaped defect rate** (bugs found in production that tests should have caught), **flaky test rate**, and **mean time to detect regression**. High line coverage with low mutation score means tests are shallow.
