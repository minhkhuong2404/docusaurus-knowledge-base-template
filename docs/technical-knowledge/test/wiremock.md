---
id: wiremock
title: WireMock
sidebar_label: 🔌 WireMock
description: WireMock creates a real HTTP server for stubbing and mocking external APIs in tests. This guide covers setup, advanced stubs, fault simulation, contract testing, and production-grade patterns for Java/Spring engineers.
tags: [testing, wiremock, integration-test, mocking, http, api, spring-boot, testcontainers, contract-testing]
---

# WireMock — Mocking External HTTP APIs

:::info Who this guide is for
- **New learners** — start at [What is WireMock?](#what-is-wiremock) to understand why it exists and when to use it.
- **Senior engineers** — jump to [Advanced Patterns](#-advanced-patterns), [Fault Injection](#-fault-injection--resilience-testing), or [Contract Testing](#-contract-testing-with-wiremock).
:::

---

## What is WireMock?

Imagine your application calls an external Payment API. In production, you hit `https://api.stripe.com`. But in tests:

- Stripe might be down → your tests fail for no reason
- Stripe rate-limits you → your CI pipeline gets blocked
- You can't easily make Stripe return a 500 error → you can't test error handling
- Stripe charges money per call → testing gets expensive

**WireMock solves this.** It starts a real HTTP server locally that pretends to be Stripe. Your application talks to `http://localhost:8089` instead, and WireMock responds with whatever you configure.

```
Production:
  Your App ──HTTP──► Stripe API (real)

Tests with WireMock:
  Your App ──HTTP──► WireMock (localhost:8089)
                     ↓ returns pre-configured responses
                     {"status": "SUCCESS", "chargeId": "ch_123"}
```

### WireMock vs Mockito — When to Use Which?

| | Mockito | WireMock |
|---|---|---|
| **What it mocks** | Java objects in memory | An actual HTTP server |
| **Tests** | Unit tests (business logic) | Integration tests (HTTP clients) |
| **Scope** | Single class, no network | Full HTTP request/response cycle |
| **Catches bugs in** | Logic, conditions, calculations | Serialization, headers, status codes, retries, timeouts |
| **Speed** | ⚡ Milliseconds | 🐢 Seconds (starts HTTP server) |

:::tip Rule of Thumb
Use **Mockito** when you want to test *what your code does*. Use **WireMock** when you want to test *how your code talks to external services over HTTP*.
:::

---

## 🚀 Getting Started

### 1. Add Dependencies

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-contract-stub-runner</artifactId>
    <scope>test</scope>
</dependency>

<!-- OR standalone WireMock -->
<dependency>
    <groupId>org.wiremock</groupId>
    <artifactId>wiremock-standalone</artifactId>
    <version>3.9.1</version>
    <scope>test</scope>
</dependency>
```

### 2. Basic Setup with Spring Boot

```java
@SpringBootTest
@AutoConfigureWireMock(port = 0)  // random port — avoids conflicts in CI
class PaymentClientIntegrationTest {

    // WireMock injects the random port into this property
    @Value("${wiremock.server.port}")
    private int wireMockPort;

    @Autowired
    private PaymentClient paymentClient;

    @Test
    void getPayment_success_returnsPayment() {
        // Arrange — tell WireMock what to respond
        stubFor(get(urlEqualTo("/api/payments/PAY-123"))
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBody("""
                    {
                        "id": "PAY-123",
                        "amount": 99.99,
                        "currency": "USD",
                        "status": "SUCCESS"
                    }
                    """)));

        // Act — your real HTTP client makes a real HTTP request
        Payment payment = paymentClient.getPayment("PAY-123");

        // Assert — verify the response was correctly deserialized
        assertEquals("PAY-123", payment.getId());
        assertEquals(new BigDecimal("99.99"), payment.getAmount());
        assertEquals("SUCCESS", payment.getStatus());

        // Verify — WireMock confirms the request was made correctly
        verify(getRequestedFor(urlEqualTo("/api/payments/PAY-123"))
            .withHeader("Accept", containing("application/json")));
    }
}
```

### 3. Configure Your Client to Use WireMock

```yaml
# application-test.yml (or application.yml with test profile)
payment:
  api:
    base-url: http://localhost:${wiremock.server.port}
```

```java
@Configuration
public class PaymentClientConfig {

    @Bean
    public PaymentClient paymentClient(
            @Value("${payment.api.base-url}") String baseUrl,
            RestClient.Builder builder) {
        return new PaymentClient(builder.baseUrl(baseUrl).build());
    }
}
```

---

## 🧠 Deep Dive: Stub Matching

WireMock matches incoming requests against stubs using configurable matchers. Understanding these is key to writing robust tests.

### URL Matching

```java
// Exact match
stubFor(get(urlEqualTo("/api/users/123")));

// Path pattern (regex)
stubFor(get(urlPathMatching("/api/users/[0-9]+")));

// Path with any query params
stubFor(get(urlPathEqualTo("/api/users")));
```

### Header Matching

```java
stubFor(get(urlEqualTo("/api/secure"))
    .withHeader("Authorization", equalTo("Bearer abc123"))
    .withHeader("Accept", containing("application/json"))
    .withHeader("X-Request-Id", matching("[a-f0-9-]{36}"))  // UUID pattern
    .willReturn(ok()));
```

### Query Parameter Matching

```java
stubFor(get(urlPathEqualTo("/api/products"))
    .withQueryParam("category", equalTo("laptop"))
    .withQueryParam("minPrice", matching("[0-9]+"))
    .withQueryParam("page", absent())  // must NOT be present
    .willReturn(okJson("""
        {"products": [], "total": 0}
        """)));
```

### Request Body Matching (POST/PUT)

```java
// Exact JSON body match
stubFor(post(urlEqualTo("/api/orders"))
    .withRequestBody(equalToJson("""
        {"productId": "PROD-1", "quantity": 2}
        """))
    .willReturn(created()));

// Partial JSON match — only check specific fields
stubFor(post(urlEqualTo("/api/orders"))
    .withRequestBody(matchingJsonPath("$.productId", equalTo("PROD-1")))
    .withRequestBody(matchingJsonPath("$.quantity", matching("[0-9]+")))
    .willReturn(created()));

// JSON Schema validation
stubFor(post(urlEqualTo("/api/orders"))
    .withRequestBody(matchingJsonSchema("""
        {
            "type": "object",
            "required": ["productId", "quantity"],
            "properties": {
                "productId": {"type": "string"},
                "quantity": {"type": "integer", "minimum": 1}
            }
        }
        """))
    .willReturn(created()));
```

### Response Helpers

```java
// Common response shortcuts
stubFor(get("/ok").willReturn(ok()));                          // 200
stubFor(get("/json").willReturn(okJson("{}")));                // 200 + JSON
stubFor(get("/created").willReturn(created()));                // 201
stubFor(get("/bad").willReturn(badRequest()));                 // 400
stubFor(get("/forbidden").willReturn(forbidden()));            // 403
stubFor(get("/notfound").willReturn(notFound()));              // 404
stubFor(get("/error").willReturn(serverError()));              // 500

// Full control
stubFor(get("/custom").willReturn(aResponse()
    .withStatus(429)
    .withHeader("Retry-After", "30")
    .withBody("Rate limit exceeded")));
```

---

## 💥 Fault Injection & Resilience Testing

This is where WireMock truly shines — testing what happens when things go wrong.

### Simulating Delays (Timeout Testing)

```java
@Test
void getPayment_timeout_throwsException() {
    // Simulate a 5-second delay — your client has a 2-second timeout
    stubFor(get(urlEqualTo("/api/payments/PAY-123"))
        .willReturn(ok()
            .withFixedDelay(5000)));  // 5 seconds

    // Your client should time out and throw
    assertThrows(PaymentServiceTimeoutException.class,
        () -> paymentClient.getPayment("PAY-123"));
}

// Random delay — simulate real-world latency variance
stubFor(get("/api/slow")
    .willReturn(ok()
        .withUniformRandomDelay(200, 2000)));  // 200ms to 2s
```

### Simulating Network Faults

```java
// Connection reset — TCP connection drops mid-response
stubFor(get("/api/unstable")
    .willReturn(aResponse()
        .withFault(Fault.CONNECTION_RESET_BY_PEER)));

// Empty response — server closes connection without sending anything
stubFor(get("/api/empty")
    .willReturn(aResponse()
        .withFault(Fault.EMPTY_RESPONSE)));

// Malformed response — garbage bytes
stubFor(get("/api/garbage")
    .willReturn(aResponse()
        .withFault(Fault.RANDOM_DATA_THEN_CLOSE)));

// Partial response — sends headers, then drops connection
stubFor(get("/api/partial")
    .willReturn(aResponse()
        .withFault(Fault.MALFORMED_RESPONSE_CHUNK)));
```

| Fault Type | What It Simulates | Tests Your... |
|---|---|---|
| `FIXED_DELAY` | Slow API | Timeout handling, circuit breakers |
| `CONNECTION_RESET_BY_PEER` | Network failure | Retry logic, fallback behavior |
| `EMPTY_RESPONSE` | Server crash mid-request | Error parsing, null safety |
| `RANDOM_DATA_THEN_CLOSE` | Corrupted response | Deserialization error handling |

### Testing Retry Logic with Sequential Responses

```java
@Test
void getPayment_retriesOnFailure_succeedsOnThirdAttempt() {
    // 1st call → 500
    // 2nd call → 500
    // 3rd call → 200 with success
    stubFor(get(urlEqualTo("/api/payments/PAY-123"))
        .inScenario("retry-test")
        .whenScenarioStateIs(Scenario.STARTED)
        .willReturn(serverError())
        .willSetStateTo("SECOND_ATTEMPT"));

    stubFor(get(urlEqualTo("/api/payments/PAY-123"))
        .inScenario("retry-test")
        .whenScenarioStateIs("SECOND_ATTEMPT")
        .willReturn(serverError())
        .willSetStateTo("THIRD_ATTEMPT"));

    stubFor(get(urlEqualTo("/api/payments/PAY-123"))
        .inScenario("retry-test")
        .whenScenarioStateIs("THIRD_ATTEMPT")
        .willReturn(okJson("""
            {"id": "PAY-123", "status": "SUCCESS"}
            """)));

    // Act — client should retry and eventually succeed
    Payment payment = paymentClient.getPayment("PAY-123");

    assertEquals("SUCCESS", payment.getStatus());

    // Verify — exactly 3 requests were made (2 retries + 1 success)
    verify(3, getRequestedFor(urlEqualTo("/api/payments/PAY-123")));
}
```

### Testing Rate Limiting (429 Responses)

```java
@Test
void getPayment_rateLimited_waitsAndRetries() {
    stubFor(get(urlEqualTo("/api/payments/PAY-123"))
        .inScenario("rate-limit")
        .whenScenarioStateIs(Scenario.STARTED)
        .willReturn(aResponse()
            .withStatus(429)
            .withHeader("Retry-After", "1"))
        .willSetStateTo("ALLOWED"));

    stubFor(get(urlEqualTo("/api/payments/PAY-123"))
        .inScenario("rate-limit")
        .whenScenarioStateIs("ALLOWED")
        .willReturn(okJson("""
            {"id": "PAY-123", "status": "SUCCESS"}
            """)));

    Payment payment = paymentClient.getPayment("PAY-123");
    assertEquals("SUCCESS", payment.getStatus());
}
```

---

## 🔬 Advanced Patterns

### Response Templating — Dynamic Responses

WireMock can generate responses based on the request data:

```java
@RegisterExtension
static WireMockExtension wm = WireMockExtension.newInstance()
    .options(wireMockConfig()
        .dynamicPort()
        .extensions(new ResponseTemplateTransformer(true)))
    .build();

@Test
void echo_returnsRequestData() {
    wm.stubFor(get(urlPathMatching("/api/users/(.+)"))
        .willReturn(okJson("""
            {
                "requestedId": "{{request.pathSegments.[2]}}",
                "timestamp": "{{now}}",
                "method": "{{request.method}}"
            }
            """)
            .withTransformers("response-template")));

    // GET /api/users/alice →
    // {"requestedId": "alice", "timestamp": "2024-...", "method": "GET"}
}
```

### Stateful Stubs — Model API State Transitions

```java
// Simulate: create → confirm → ship
@Test
void orderLifecycle_stateTransitions() {
    // GET before creation → 404
    stubFor(get("/api/orders/ORD-1")
        .inScenario("order-lifecycle")
        .whenScenarioStateIs(Scenario.STARTED)
        .willReturn(notFound()));

    // POST to create → returns PENDING, transitions state
    stubFor(post("/api/orders")
        .inScenario("order-lifecycle")
        .whenScenarioStateIs(Scenario.STARTED)
        .willReturn(okJson("""{"id":"ORD-1","status":"PENDING"}"""))
        .willSetStateTo("CREATED"));

    // GET after creation → returns PENDING
    stubFor(get("/api/orders/ORD-1")
        .inScenario("order-lifecycle")
        .whenScenarioStateIs("CREATED")
        .willReturn(okJson("""{"id":"ORD-1","status":"PENDING"}""")));
}
```

### Loading Stubs from JSON Files

Instead of defining stubs in Java, you can load them from JSON files (useful for large or shared stubs):

```
src/test/resources/
└── __files/                    ← response body files
│   └── payment-success.json
└── mappings/                   ← stub definitions
    └── get-payment.json
```

```json
// mappings/get-payment.json
{
    "request": {
        "method": "GET",
        "urlPattern": "/api/payments/[A-Z]+-[0-9]+"
    },
    "response": {
        "status": 200,
        "headers": { "Content-Type": "application/json" },
        "bodyFileName": "payment-success.json"
    }
}
```

```json
// __files/payment-success.json
{
    "id": "PAY-123",
    "amount": 99.99,
    "currency": "USD",
    "status": "SUCCESS"
}
```

---

## 🤝 Contract Testing with WireMock

When your service depends on another team's API, you need to ensure compatibility. **Contract testing** validates that the API you stub in tests matches the real API's behavior.

```
Without contract testing:
  Your stub:  GET /api/users → {"name": "Alice"}
  Real API:   GET /api/users → {"fullName": "Alice"}    ← Field renamed!
  Your test passes ✅ but production breaks ❌

With contract testing:
  Provider publishes contract (e.g., via Pact / Spring Cloud Contract)
  Your WireMock stubs are auto-generated FROM the contract
  If provider changes the API → contract fails → you know before deploying
```

### Spring Cloud Contract Integration

```java
// Consumer side — stubs are auto-downloaded from the provider's published contracts
@SpringBootTest
@AutoConfigureStubRunner(
    ids = "com.example:payment-service:+:stubs:8089",
    stubsMode = StubRunnerProperties.StubsMode.LOCAL)
class PaymentClientContractTest {

    @Autowired
    private PaymentClient paymentClient;

    @Test
    void getPayment_matchesProviderContract() {
        // Stubs are loaded from the payment-service's published contracts
        // If the real API changes, the contract test will fail
        Payment payment = paymentClient.getPayment("PAY-123");
        assertNotNull(payment);
        assertEquals("SUCCESS", payment.getStatus());
    }
}
```

---

## 🐳 WireMock with Testcontainers

For complete isolation (no port conflicts, consistent across local/CI):

```java
@SpringBootTest
@Testcontainers
class PaymentClientDockerTest {

    @Container
    static WireMockContainer wiremock = new WireMockContainer("wiremock/wiremock:3.9.1")
        .withMappingFromResource("mappings/get-payment.json")
        .withFileFromResource("__files/payment-success.json");

    @DynamicPropertySource
    static void configure(DynamicPropertyRegistry registry) {
        registry.add("payment.api.base-url", wiremock::getBaseUrl);
    }

    @Autowired
    private PaymentClient paymentClient;

    @Test
    void getPayment_fromDockerizedWireMock() {
        Payment payment = paymentClient.getPayment("PAY-123");
        assertEquals("SUCCESS", payment.getStatus());
    }
}
```

| Approach | Startup | Port Conflicts | CI Consistency |
|---|---|---|---|
| `@AutoConfigureWireMock` (in-process) | ⚡ Fast (~200ms) | Use `port=0` for random | Good |
| Testcontainers WireMock | 🐢 Slower (~2s) | None (Docker) | Best |

---

## ✅ Best Practices

| Practice | Why |
|---|---|
| **Always use `port = 0`** (random port) | Prevents port conflicts when running tests in parallel |
| **Match only what matters** | Don't assert on incidental headers or exact query param order — tests become brittle |
| **Reset stubs between tests** | Use `@BeforeEach WireMock.reset()` or `@DirtiesContext` to prevent stub leakage |
| **Test failure scenarios first** | Timeouts, 500s, malformed responses are where real bugs live |
| **Use response files for large payloads** | Keep test code clean; put 100-line JSON in `__files/` |
| **Verify outbound requests** | Don't just test responses — verify your app sends correct headers, auth, and body |
| **Name your stubs** | `stubFor(...).withName("get-payment-success")` — easier debugging in logs |

---

## Interview Questions

### For New Learners

**Q: What is WireMock and why do we need it?**
> WireMock is a library that starts a real HTTP server locally to simulate external APIs in tests. We need it because real APIs may be unreliable, rate-limited, expensive, or unable to simulate error scenarios like timeouts and 500 errors.

**Q: What is the difference between WireMock and Mockito?**
> Mockito mocks Java objects in memory — used in unit tests for business logic. WireMock mocks an actual HTTP server — used in integration tests for HTTP client code. WireMock catches bugs that Mockito cannot: serialization issues, incorrect headers, status code handling, and retry logic.

**Q: What does `@AutoConfigureWireMock(port = 0)` do?**
> It starts a WireMock HTTP server on a randomly available port before the test class runs, and injects the port number via `${wiremock.server.port}`. Using port 0 (random) prevents port conflicts when multiple test suites run in parallel.

### For Senior Engineers

**Q: What failure scenarios should teams always simulate with WireMock?**
> At minimum: (1) Timeouts — `withFixedDelay()` exceeding client timeout. (2) Throttling — 429 with `Retry-After` header. (3) Server errors — 500/503 to test circuit breakers. (4) Connection resets — `Fault.CONNECTION_RESET_BY_PEER` for retry logic. (5) Malformed payloads — invalid JSON to test deserialization error handling.

**Q: How do you test retry and idempotency with WireMock?**
> Use WireMock Scenarios: define sequential responses (e.g., 500 → 500 → 200). Assert that the client retried the correct number of times with `verify(3, getRequestedFor(...))`. For idempotency, verify that a retry doesn't cause duplicate side effects — check that the downstream system received exactly one successful request.

**Q: How do you avoid brittle WireMock tests?**
> Match only contract-relevant fields: use `matchingJsonPath` instead of `equalToJson` for large payloads, use `urlPathMatching` instead of `urlEqualTo` when query params vary, and don't assert on incidental headers (like `User-Agent`). Focus stubs on the *contract* — what your code depends on — not on every detail of the response.

**Q: What are the trade-offs between in-process WireMock and Testcontainers WireMock?**
> In-process (`@AutoConfigureWireMock`) is faster to start (~200ms) and simpler to configure, but runs inside the JVM — sharing the same process as your tests. Testcontainers WireMock runs in Docker (~2s startup), providing complete process isolation and identical behavior across local and CI environments. Use in-process for most tests; use Testcontainers when you need strict environment consistency or are debugging network-level issues.

**Q: How does contract testing with WireMock prevent production integration failures?**
> Without contracts, your WireMock stubs may diverge from the real API over time. With Spring Cloud Contract or Pact, the API provider publishes a contract (expected request/response pairs). Your stubs are auto-generated from this contract. If the provider changes the API in a breaking way, the contract test fails in CI — before the change reaches production.
