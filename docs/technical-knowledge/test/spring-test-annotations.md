---
id: spring-test-annotations
title: Testing Annotations
sidebar_label: 🌱 Annotations (JUnit/Spring)
description: Complete reference for JUnit 5, Mockito, and Spring Boot testing annotations — what each does, when to use it, and production-grade code examples for Java/Spring engineers.
tags: [testing, junit5, mockito, spring-boot-test, annotations, webmvctest, datajpatest, sliced-test]
---

# Testing Annotations in Spring & JUnit

:::info Who this guide is for
- **New learners** — start at [The Big Picture](#the-big-picture) to understand how annotations fit together before diving into specifics.
- **Senior engineers** — jump to [Annotation Decision Matrix](#-annotation-decision-matrix), [Spring Boot 3.4+ Changes](#-spring-boot-34-migration), or [Interview Questions](#interview-questions).
:::

---

## The Big Picture

When writing tests in a Spring Boot project, you deal with **three layers** of annotations:

```
┌────────────────────────────────────────────────────────────┐
│  Layer 1: JUnit 5 (Test Runner)                            │
│  @Test, @ParameterizedTest, @BeforeEach, @DisplayName      │
│  → Controls WHAT runs, WHEN, and HOW                       │
├────────────────────────────────────────────────────────────┤
│  Layer 2: Mockito (Test Doubles)                           │
│  @Mock, @Spy, @InjectMocks, @Captor                        │
│  → Controls DEPENDENCIES — replace real objects with fakes │
├────────────────────────────────────────────────────────────┤
│  Layer 3: Spring Boot Test (Application Context)           │
│  @SpringBootTest, @WebMvcTest, @DataJpaTest, @MockitoBean  │
│  → Controls SPRING CONTEXT — how much of the app loads     │
└────────────────────────────────────────────────────────────┘
```

:::tip Rule of Thumb
- **Unit tests** → Layer 1 + Layer 2 only (no Spring context → fast ⚡)
- **Integration tests** → Layer 1 + Layer 3 (Spring context → slower 🐢, but tests real wiring)
:::

---

## Layer 1: JUnit 5 Core Annotations

### Lifecycle Annotations

```java
class OrderServiceTest {

    @BeforeAll   // Runs ONCE before all tests (must be static)
    static void setupOnce() {
        // Expensive one-time setup: start Testcontainers, load CSV, etc.
    }

    @BeforeEach  // Runs BEFORE each test method
    void setup() {
        // Reset mocks, prepare test data, clean state
    }

    @Test
    void shouldCalculateTotal() { /* test logic */ }

    @AfterEach   // Runs AFTER each test method
    void tearDown() {
        // Close resources, clear caches
    }

    @AfterAll    // Runs ONCE after all tests (must be static)
    static void cleanupOnce() {
        // Stop containers, delete temp files
    }
}
```

```
Execution order for 2 test methods:

  @BeforeAll ──────────────────────────────────────────
       │
       ├── @BeforeEach → @Test (test1) → @AfterEach
       │
       ├── @BeforeEach → @Test (test2) → @AfterEach
       │
  @AfterAll ───────────────────────────────────────────
```

### Test Annotations

| Annotation | Purpose | Example |
|---|---|---|
| `@Test` | Marks a single test method | `@Test void shouldReturnUser()` |
| `@ParameterizedTest` | Runs the same test with different inputs | See example below |
| `@RepeatedTest(5)` | Runs the test 5 times (flaky test detection) | `@RepeatedTest(5) void stressTest()` |
| `@DisplayName` | Human-readable test name in reports | `@DisplayName("Should reject expired coupons")` |
| `@Disabled` | Skips a test (with reason) | `@Disabled("Bug #1234 — fix pending")` |
| `@Timeout(5)` | Fails if test takes longer than 5 seconds | `@Timeout(value = 5, unit = SECONDS)` |
| `@Tag("slow")` | Categorize tests for selective execution | Filter in Maven: `-Dgroups=slow` |
| `@Nested` | Group related tests in inner classes | Organize by scenario |

### Parameterized Tests — Test Many Inputs

```java
// ── @ValueSource — simple single-value inputs ────────────
@ParameterizedTest(name = "isPalindrome({0})")
@ValueSource(strings = {"racecar", "radar", "level", "madam"})
void shouldDetectPalindromes(String word) {
    assertTrue(StringUtils.isPalindrome(word));
}

// ── @CsvSource — multiple arguments per test ─────────────
@ParameterizedTest(name = "add({0}, {1}) = {2}")
@CsvSource({
    "1,    1,    2",
    "0,    0,    0",
    "-1,   1,    0",
    "100,  200,  300"
})
void shouldAddNumbers(int a, int b, int expected) {
    assertEquals(expected, calculator.add(a, b));
}

// ── @MethodSource — complex objects as test data ─────────
@ParameterizedTest
@MethodSource("provideInvalidEmails")
void shouldRejectInvalidEmails(String email, String reason) {
    ValidationResult result = validator.validate(email);
    assertFalse(result.isValid(), "Expected invalid: " + reason);
}

static Stream<Arguments> provideInvalidEmails() {
    return Stream.of(
        Arguments.of("",                "empty string"),
        Arguments.of("no-at-sign",      "missing @"),
        Arguments.of("@no-local.com",   "missing local part"),
        Arguments.of("spaces in@x.com", "contains spaces"),
        Arguments.of(null,              "null value")
    );
}

// ── @EnumSource — test all enum values ───────────────────
@ParameterizedTest
@EnumSource(OrderStatus.class)
void allStatusesShouldHaveDisplayName(OrderStatus status) {
    assertNotNull(status.getDisplayName());
    assertFalse(status.getDisplayName().isBlank());
}
```

### Nested Tests — Organize by Scenario

```java
@DisplayName("OrderService")
class OrderServiceTest {

    @Nested
    @DisplayName("when creating an order")
    class WhenCreatingOrder {

        @Test
        @DisplayName("should save to database")
        void shouldSave() { /* ... */ }

        @Test
        @DisplayName("should publish OrderCreated event")
        void shouldPublishEvent() { /* ... */ }

        @Nested
        @DisplayName("with invalid input")
        class WithInvalidInput {

            @Test
            @DisplayName("should throw on null product")
            void shouldThrowOnNull() { /* ... */ }

            @Test
            @DisplayName("should throw on negative quantity")
            void shouldThrowOnNegative() { /* ... */ }
        }
    }
}
```

Report output:
```
OrderService
  ├── when creating an order
  │   ├── ✅ should save to database
  │   ├── ✅ should publish OrderCreated event
  │   └── with invalid input
  │       ├── ✅ should throw on null product
  │       └── ✅ should throw on negative quantity
```

---

## Layer 2: Mockito Annotations

| Annotation | What It Creates | When To Use |
|---|---|---|
| `@Mock` | A mock (all methods return defaults) | Replace a dependency you don't want to call |
| `@Spy` | A spy wrapping a real object | Need real behavior + override one method |
| `@InjectMocks` | Real object with mocks injected | Auto-wire `@Mock`/`@Spy` into the class under test |
| `@Captor` | An `ArgumentCaptor` | Capture arguments passed to a mock for detailed assertions |

:::warning Always use `@ExtendWith(MockitoExtension.class)`
Without this, `@Mock`, `@Spy`, and `@InjectMocks` do nothing — they are not initialized. This is the #1 mistake beginners make.
:::

### Complete Example with @Captor

```java
@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private EmailGateway emailGateway;
    @Mock private UserRepository userRepo;
    @Captor private ArgumentCaptor<EmailMessage> emailCaptor;
    @InjectMocks private NotificationService notificationService;

    @Test
    void sendOrderConfirmation_composesCorrectEmail() {
        // Arrange
        User user = new User("alice", "alice@example.com");
        Order order = new Order("ORD-001", new BigDecimal("99.99"));
        when(userRepo.findById("alice")).thenReturn(Optional.of(user));

        // Act
        notificationService.sendOrderConfirmation("alice", order);

        // Assert — capture the actual email that was sent
        verify(emailGateway).send(emailCaptor.capture());
        EmailMessage sentEmail = emailCaptor.getValue();

        assertEquals("alice@example.com", sentEmail.getTo());
        assertThat(sentEmail.getSubject()).contains("ORD-001");
        assertThat(sentEmail.getBody()).contains("$99.99");
    }

    @Test
    void sendOrderConfirmation_userNotFound_doesNotSendEmail() {
        when(userRepo.findById("unknown")).thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class,
            () -> notificationService.sendOrderConfirmation("unknown", anyOrder()));

        // Verify email was NEVER sent
        verifyNoInteractions(emailGateway);
    }
}
```

### Common Mockito Methods Reference

```java
// ── Stubbing ──────────────────────────────────────────────
when(mock.method(arg)).thenReturn(value);          // return value
when(mock.method(arg)).thenThrow(new RuntimeException());  // throw
when(mock.method(arg)).thenAnswer(invocation -> {  // dynamic
    String arg0 = invocation.getArgument(0);
    return arg0.toUpperCase();
});

// ── Verification ──────────────────────────────────────────
verify(mock).method(arg);                     // called exactly once
verify(mock, times(3)).method(arg);           // called exactly 3 times
verify(mock, never()).method(arg);            // never called
verify(mock, atLeastOnce()).method(any());    // at least once
verifyNoMoreInteractions(mock);               // no other calls
verifyNoInteractions(mock);                   // zero calls total

// ── Argument Matchers ─────────────────────────────────────
when(repo.findById(any())).thenReturn(...);   // any argument
when(repo.findByName(eq("alice"))).thenReturn(...); // exact value
when(repo.findByAge(anyInt())).thenReturn(...);
when(repo.findByName(argThat(name -> name.startsWith("A")))).thenReturn(...);
```

---

## Layer 3: Spring Boot Test Annotations

### @SpringBootTest — Full Application Context

```java
// Loads the ENTIRE Spring context — all beans, all config
// Use for end-to-end integration tests
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ApplicationIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void healthCheck_returns200() {
        ResponseEntity<String> response =
            restTemplate.getForEntity("/actuator/health", String.class);
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }
}
```

| `webEnvironment` Option | Behavior |
|---|---|
| `MOCK` (default) | Simulated servlet environment — use `MockMvc` |
| `RANDOM_PORT` | Starts real HTTP server on random port — use `TestRestTemplate` |
| `DEFINED_PORT` | Starts server on `server.port` |
| `NONE` | No web environment at all — service-layer tests |

### Sliced Test Annotations — Load Only What You Need

```
Full context (@SpringBootTest):
  ┌──────────────────────────────────────────────────────┐
  │ Controllers + Services + Repos + Config + Security + │
  │ Kafka + Redis + Scheduling + ...                     │
  └──────────────────────────────────────────────────────┘
  ⏱️ Startup time: 5-30 seconds

@WebMvcTest slice:
  ┌───────────────────────────────────┐
  │ Controllers + Filters + Advice   │
  └───────────────────────────────────┘
  ⏱️ Startup time: 1-3 seconds

@DataJpaTest slice:
  ┌───────────────────────────────────┐
  │ Repositories + JPA + In-mem DB   │
  └───────────────────────────────────┘
  ⏱️ Startup time: 2-5 seconds
```

#### @WebMvcTest — Controller Layer Only

```java
@WebMvcTest(OrderController.class)   // only loads OrderController + web layer
class OrderControllerTest {

    @Autowired private MockMvc mockMvc;

    @MockitoBean    // Spring Boot 3.4+
    private OrderService orderService;

    @Test
    void getOrder_found_returns200() throws Exception {
        when(orderService.findById("ORD-1"))
            .thenReturn(Optional.of(new OrderDto("ORD-1", "SHIPPED")));

        mockMvc.perform(get("/api/orders/ORD-1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.orderId").value("ORD-1"))
            .andExpect(jsonPath("$.status").value("SHIPPED"));
    }

    @Test
    void getOrder_notFound_returns404() throws Exception {
        when(orderService.findById("UNKNOWN"))
            .thenReturn(Optional.empty());

        mockMvc.perform(get("/api/orders/UNKNOWN"))
            .andExpect(status().isNotFound());
    }
}
```

:::warning Common @WebMvcTest Mistake
`@WebMvcTest` does **NOT** load `@Service`, `@Repository`, or `@Component` beans. If your controller depends on `OrderService`, you must provide a `@MockitoBean` for it. Forgetting this causes `NoSuchBeanDefinitionException`.
:::

#### @DataJpaTest — Repository Layer Only

```java
@DataJpaTest     // auto-configures: JPA, in-memory H2, @Entity scanning
@AutoConfigureTestDatabase(replace = Replace.NONE)  // use Testcontainers instead
class OrderRepositoryTest {

    @Autowired private OrderRepository orderRepo;
    @Autowired private TestEntityManager em;

    @Test
    void findByStatus_returnsMatchingOrders() {
        em.persist(new Order("PROD-1", 2, "PENDING"));
        em.persist(new Order("PROD-2", 1, "SHIPPED"));
        em.persist(new Order("PROD-3", 3, "PENDING"));
        em.flush();

        List<Order> pending = orderRepo.findByStatus("PENDING");

        assertEquals(2, pending.size());
        assertTrue(pending.stream().allMatch(o -> o.getStatus().equals("PENDING")));
    }

    @Test
    void customQuery_calculatesRevenueByCategory() {
        // Test your @Query methods against real SQL
        em.persist(new Order("laptop", 1, "COMPLETED", new BigDecimal("1299")));
        em.persist(new Order("laptop", 1, "COMPLETED", new BigDecimal("999")));
        em.flush();

        BigDecimal revenue = orderRepo.calculateRevenueByCategory("laptop");
        assertEquals(new BigDecimal("2298"), revenue);
    }
}
```

#### @JsonTest — Serialization/Deserialization Only

```java
@JsonTest
class OrderDtoJsonTest {

    @Autowired private JacksonTester<OrderDto> json;

    @Test
    void serialize_producesExpectedJson() throws Exception {
        OrderDto dto = new OrderDto("ORD-1", "SHIPPED", LocalDate.of(2024, 1, 15));

        assertThat(json.write(dto))
            .extractingJsonPathStringValue("$.orderId").isEqualTo("ORD-1")
            .extractingJsonPathStringValue("$.status").isEqualTo("SHIPPED")
            .extractingJsonPathStringValue("$.date").isEqualTo("2024-01-15");
    }

    @Test
    void deserialize_parsesJsonCorrectly() throws Exception {
        String content = """
            {"orderId": "ORD-1", "status": "SHIPPED", "date": "2024-01-15"}
            """;

        assertThat(json.parse(content))
            .isEqualTo(new OrderDto("ORD-1", "SHIPPED", LocalDate.of(2024, 1, 15)));
    }
}
```

---

## 📋 Annotation Decision Matrix

Use this table to pick the right annotation for your test scenario:

| I want to test... | Annotation | Mocking | Context | Speed |
|---|---|---|---|---|
| Pure business logic | `@ExtendWith(MockitoExtension.class)` | `@Mock` / `@InjectMocks` | None | ⚡ ~ms |
| Controller endpoints | `@WebMvcTest` | `@MockitoBean` | Web slice | 🐢 ~2s |
| JPA repository queries | `@DataJpaTest` | — | JPA slice | 🐢 ~3s |
| JSON serialization | `@JsonTest` | — | JSON slice | ⚡ ~1s |
| Full app wiring | `@SpringBootTest` | `@MockitoBean` (optional) | Full | 🐌 ~10s |
| External HTTP APIs | `@SpringBootTest` + WireMock | — | Full + mock server | 🐌 ~10s |
| Kafka consumer/producer | `@SpringBootTest` + `@EmbeddedKafka` | — | Full + embedded | 🐌 ~15s |

---

## 🔄 Spring Boot 3.4+ Migration

Spring Boot 3.4 introduced new annotations to replace the older `@MockBean` and `@SpyBean`:

| Old (Deprecated) | New (Spring Boot 3.4+) | Change |
|---|---|---|
| `@MockBean` | `@MockitoBean` | Better context caching, clearer naming |
| `@SpyBean` | `@MockitoSpyBean` | Same improvements |

```java
// ── Before (Spring Boot < 3.4) ────────────────────────────
@SpringBootTest
class OldStyleTest {
    @MockBean private PaymentClient paymentClient;   // deprecated
    @SpyBean private OrderService orderService;      // deprecated
}

// ── After (Spring Boot 3.4+) ──────────────────────────────
@SpringBootTest
class NewStyleTest {
    @MockitoBean private PaymentClient paymentClient;     // ✅
    @MockitoSpyBean private OrderService orderService;    // ✅
}
```

:::tip Why The Change?
The old `@MockBean` sometimes caused **context caching issues** — Spring would create separate application contexts for tests that use different `@MockBean` combinations, dramatically slowing down test suites. The new annotations are designed to integrate more cleanly with Spring's test context framework.
:::

---

## Interview Questions

### For New Learners

**Q: What is the difference between `@Mock` and `@MockitoBean`?**
> `@Mock` (Mockito) creates a mock in plain unit tests — no Spring context is involved. `@MockitoBean` (Spring Boot) replaces an actual bean in the Spring ApplicationContext with a mock — used in integration tests where Spring manages the wiring.

**Q: Why use `@WebMvcTest` instead of `@SpringBootTest` for controller tests?**
> `@WebMvcTest` loads only the web layer (controllers, filters, advice) — starting in ~2 seconds. `@SpringBootTest` loads the entire application context (services, repos, configs, Kafka, Redis...) — starting in 10+ seconds. Use `@WebMvcTest` for speed when you only need to test HTTP request/response behavior.

**Q: What does `@BeforeEach` do?**
> It marks a method that runs before every single `@Test` method in the class. Use it to reset mocks, prepare test data, or set up clean state so tests don't affect each other.

### For Senior Engineers

**Q: How do you choose between `@Mock`, `@MockitoBean`, and `@MockitoSpyBean`?**
> Use `@Mock` in pure unit tests (no Spring context) — fastest. Use `@MockitoBean` in integration tests when you need to replace a Spring-managed bean entirely (e.g., mock an external payment gateway). Use `@MockitoSpyBean` when you need the real bean behavior but want to verify or override one specific method (e.g., spy on a service to verify event publishing while keeping real business logic).

**Q: Why can excessive `@SpringBootTest` usage slow teams down?**
> Each unique combination of `@MockitoBean` declarations creates a separate Spring context. If 50 test classes each mock different beans, Spring may create 50 separate contexts — each taking 10+ seconds to start. Fix: standardize mock combinations using a shared base class, or prefer `@WebMvcTest`/`@DataJpaTest` slices.

**Q: What signals indicate your test annotation strategy is wrong?**
> (1) Test suite takes 15+ minutes to run locally. (2) Tests fail when reordered. (3) Every test class uses `@SpringBootTest` even for pure logic. (4) You see `ApplicationContext was cached X times` warnings with high X values. (5) Developers skip running tests locally because they're too slow.

**Q: How should you handle deprecated `@MockBean` during a Spring Boot upgrade?**
> Migrate incrementally: start with new test classes using `@MockitoBean`, then update existing tests component-by-component. Both annotations work simultaneously during the migration window. Add a checkstyle/lint rule to prevent new usages of `@MockBean` and track migration progress.

**Q: How do you test configuration properties safely?**
> Use `@SpringBootTest(classes = {MyConfig.class})` with minimal config scope instead of loading the full app. Test binding, defaults, validation (`@Validated`), and profile-specific overrides (`@ActiveProfiles("test")`). Use `@ConfigurationPropertiesTest` for focused property binding tests.
