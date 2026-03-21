---
id: integration-testing
title: Integration Testing
sidebar_label: Integration Testing
---

# Integration Testing

## What is Integration Testing?

**Integration tests** validate that multiple components work correctly together. Unlike unit tests, they test real interactions — against a real database, message broker, or external HTTP service (using test containers or WireMock stubs).

They answer the question: *"Does the wiring between components actually work?"*

---

## Scope

Integration tests cover interactions such as:
- Service layer → JPA Repository → Database (PostgreSQL)
- Message producer → Kafka → Message consumer
- REST controller → Service → Repository (full slice)
- REST client → External API (stubbed with WireMock)

---

## Tools

| Tool | Purpose |
|---|---|
| **Spring Boot Test** | Load full or sliced application context |
| **Testcontainers** | Spin up real Docker containers (PostgreSQL, Redis, Kafka) |
| **MockMvc** | Test HTTP controllers without starting a real HTTP server |
| **WireMock** | Stub external HTTP APIs |
| **@DataJpaTest** | Slice: only JPA layer wired (fast) |
| **@WebMvcTest** | Slice: only MVC layer wired (fast) |

---

## Maven Dependencies

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>postgresql</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>kafka</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>com.github.tomakehurst</groupId>
    <artifactId>wiremock-jre8-standalone</artifactId>
    <scope>test</scope>
</dependency>
```

---

## Examples

### Repository Integration Test (Testcontainers + PostgreSQL)

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = NONE)
@Testcontainers
class TransactionRepositoryIT {

    @Container
    static PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url",        postgres::getJdbcUrl);
        registry.add("spring.datasource.username",   postgres::getUsername);
        registry.add("spring.datasource.password",   postgres::getPassword);
    }

    @Autowired
    private TransactionRepository repository;

    @Test
    @DisplayName("Should find transactions within date range for given user")
    void findByUserIdAndCreatedAtBetween_returnsMatchingRecords() {
        UUID userId = UUID.randomUUID();
        Instant jan1  = Instant.parse("2024-01-01T00:00:00Z");
        Instant jan31 = Instant.parse("2024-01-31T23:59:59Z");

        repository.save(buildTransaction(userId, Instant.parse("2024-01-15T10:00:00Z")));
        repository.save(buildTransaction(userId, Instant.parse("2024-02-01T10:00:00Z"))); // outside range

        Page<Transaction> result = repository.findByUserIdAndCreatedAtBetween(
            userId, jan1, jan31, Pageable.unpaged());

        assertThat(result.getTotalElements()).isEqualTo(1);
    }
}
```

### Controller Integration Test (MockMvc)

```java
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class TransactionControllerIT {

    @Container
    static PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TransactionRepository repository;

    @Test
    @WithMockUser(username = "test-user")
    @DisplayName("GET /api/v1/transactions returns 200 with paginated results")
    void getTransactions_authenticatedUser_returns200() throws Exception {
        mockMvc.perform(get("/api/v1/transactions")
                .param("fromDate", "2024-01-01")
                .param("toDate",   "2024-01-31")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").isNumber())
            .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    @WithMockUser
    @DisplayName("GET /api/v1/transactions with invalid date range returns 422")
    void getTransactions_invalidDateRange_returns422() throws Exception {
        mockMvc.perform(get("/api/v1/transactions")
                .param("fromDate", "2024-01-31")
                .param("toDate",   "2024-01-01"))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.code").value("INVALID_DATE_RANGE"));
    }
}
```

### Kafka Integration Test

```java
@SpringBootTest
@Testcontainers
class PaymentEventConsumerIT {

    @Container
    static KafkaContainer kafka =
        new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.5.0"));

    @DynamicPropertySource
    static void kafkaProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
    }

    @Autowired
    private KafkaTemplate<String, PaymentEvent> kafkaTemplate;

    @Autowired
    private TransactionRepository repository;

    @Test
    @DisplayName("Consuming a PaymentEvent should persist a transaction record")
    void consumePaymentEvent_persistsTransaction() throws Exception {
        PaymentEvent event = new PaymentEvent(UUID.randomUUID(), new BigDecimal("99.99"), "USD");

        kafkaTemplate.send("payment-events", event.getId().toString(), event).get();

        await().atMost(10, SECONDS).untilAsserted(() ->
            assertThat(repository.findById(event.getId())).isPresent());
    }
}
```

---

## Best Practices

| Practice | Guidance |
|---|---|
| **Use Testcontainers** | Always test against a real database/broker, not H2 in-memory |
| **Shared containers** | Use `@Container static` to reuse containers across tests in a class |
| **Test data isolation** | Use `@Transactional` or truncate tables in `@BeforeEach` |
| **Realistic data** | Use test data that resembles production values |
| **Separate IT profile** | Use `@ActiveProfiles("test")` with a dedicated `application-test.yml` |

---

:::info Naming Convention
Name integration test classes with the suffix `IT` (e.g., `TransactionRepositoryIT`) and unit tests with `Test` (e.g., `TransactionServiceTest`). Maven Failsafe runs `*IT` classes in the `verify` phase, separate from Surefire unit tests.
:::
