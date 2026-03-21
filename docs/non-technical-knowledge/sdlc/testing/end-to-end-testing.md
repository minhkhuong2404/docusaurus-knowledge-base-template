---
id: end-to-end-testing
title: End-to-End (E2E) Testing
sidebar_label: E2E Testing
---

# End-to-End (E2E) Testing

## What is E2E Testing?

**End-to-end (E2E) testing** validates complete user journeys through the entire system stack — from the user interface through the API gateway, multiple backend services, databases, and external integrations — exactly as a real user would experience them.

E2E tests answer: *"Does the whole system work together from the user's perspective?"*

---

## Characteristics

| Characteristic | Detail |
|---|---|
| **Scope** | Full stack: UI → API → Services → Database |
| **Speed** | Slowest test type (seconds to minutes per scenario) |
| **Maintenance** | Highest maintenance cost |
| **Confidence** | Highest level of production-like confidence |
| **Quantity** | Fewest tests — focus on critical paths only |

---

## What to Cover in E2E Tests

Focus on **happy paths of business-critical journeys**:

- User registration and login
- Core product purchase or checkout flow
- Payment processing and confirmation
- Account management (update profile, change password)
- High-value reporting workflows

Do NOT use E2E tests to validate:
- Edge cases (unit tests do this better)
- Bulk data operations (integration tests)
- All possible error paths (too expensive)

---

## E2E Testing Environments

E2E tests must run in an environment that closely mirrors production:

```
Environments:
  DEV       → Unit + Integration tests only
  SIT       → Integration + API contract tests
  UAT       → Full E2E test suite
  PRODUCTION → Smoke E2E (post-deployment inflight)
```

---

## Tools

| Tool | Best For |
|---|---|
| **Playwright** | Modern web apps, multi-browser, fast |
| **Selenium WebDriver** | Legacy web apps, wide language support |
| **Cypress** | JavaScript/React frontends |
| **REST Assured** | Pure API E2E workflows (no UI) |
| **Karate DSL** | API E2E with built-in assertions |

---

## REST Assured API E2E Example

For backend-focused teams, pure API E2E tests are often more stable than UI tests:

```java
@E2ETest
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@TestPropertySource(properties = {
    "e2e.base-url=https://uat.yourapp.com"
})
class TransactionJourneyE2ETest {

    @Value("${e2e.base-url}")
    private String baseUrl;

    private String authToken;
    private String transactionId;

    @BeforeEach
    void authenticate() {
        authToken = RestAssured
            .given()
                .baseUri(baseUrl)
                .contentType(ContentType.JSON)
                .body(new LoginRequest("e2e-test-user@test.com", "TestPass123!"))
            .when()
                .post("/api/v1/auth/login")
            .then()
                .statusCode(200)
                .extract().jsonPath().getString("accessToken");
    }

    @Test
    @DisplayName("Complete transaction journey: create → list → export")
    void completeTransactionJourney() {
        // Step 1: Create a transaction
        transactionId = RestAssured
            .given()
                .baseUri(baseUrl)
                .header("Authorization", "Bearer " + authToken)
                .contentType(ContentType.JSON)
                .body(new CreateTransactionRequest(
                    new BigDecimal("250.00"), "USD", "E2E test payment"))
            .when()
                .post("/api/v1/transactions")
            .then()
                .statusCode(201)
                .body("amount", equalTo(250.00f))
                .body("status", equalTo("PENDING"))
                .extract().jsonPath().getString("id");

        // Step 2: Verify it appears in the list
        RestAssured
            .given()
                .baseUri(baseUrl)
                .header("Authorization", "Bearer " + authToken)
                .param("fromDate", LocalDate.now().toString())
                .param("toDate",   LocalDate.now().toString())
            .when()
                .get("/api/v1/transactions")
            .then()
                .statusCode(200)
                .body("content.id", hasItem(transactionId));

        // Step 3: Export transactions as CSV
        RestAssured
            .given()
                .baseUri(baseUrl)
                .header("Authorization", "Bearer " + authToken)
                .param("fromDate", LocalDate.now().toString())
                .param("toDate",   LocalDate.now().toString())
                .accept("text/csv")
            .when()
                .get("/api/v1/transactions/export")
            .then()
                .statusCode(200)
                .contentType("text/csv")
                .body(containsString(transactionId));
    }
}
```

---

## E2E Test Data Strategy

### Dedicated Test Users
Maintain dedicated test accounts that are never used for production data:

```yaml
# application-e2e.yml
e2e:
  test-user:
    email: e2e-automation@test.yourapp.com
    password: ${E2E_TEST_PASSWORD}
```

### Data Cleanup
Always clean up test data after the suite runs:

```java
@AfterEach
void cleanUp() {
    if (transactionId != null) {
        adminClient.deleteTransaction(transactionId);
    }
}
```

### Data Idempotency
Design E2E tests to be safe to re-run — idempotent. Do not assume test data state from a previous run.

---

## Exit Criteria

- [ ] All critical user journeys have at least one E2E test
- [ ] E2E suite passes 100% on UAT environment
- [ ] Test execution results are attached to the release ticket
- [ ] E2E tests added to the post-deployment smoke check

---

:::caution E2E Test Smell
If your E2E suite takes more than 20 minutes to run, it is too large. Prune low-value scenarios and push them down to integration tests.
:::
