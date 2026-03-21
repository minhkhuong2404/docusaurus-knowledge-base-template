---
id: unit-testing
title: Unit Testing
sidebar_label: Unit Testing
---

# Unit Testing

## What is Unit Testing?

A **unit test** validates the behaviour of a single, isolated unit of code — typically a method or class — without involving external dependencies such as databases, message queues, or HTTP services. Dependencies are replaced with **mocks** or **stubs**.

Unit tests are the foundation of the testing pyramid. They are the fastest to run, easiest to debug, and provide the tightest feedback loop during development.

---

## When to Write Unit Tests

- **Always**: For any method containing business logic, conditions, or data transformation
- **Before the fix**: When resolving a bug — write a failing test that reproduces the bug, then fix it
- **During TDD**: Write the test first, then the implementation

---

## Goals

- Validate every logical branch (if/else, switch, loops)
- Verify error and edge case handling
- Serve as living documentation of expected behaviour
- Catch regressions before code is committed

---

## Unit Testing in Java with JUnit 5 + Mockito

### Dependencies (Maven)

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
    <!-- Includes JUnit 5, Mockito, AssertJ, Hamcrest -->
</dependency>
```

### Testing a Service Class

```java
@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private TransactionMapper transactionMapper;

    @InjectMocks
    private TransactionService transactionService;

    private final UUID USER_ID = UUID.randomUUID();

    @Test
    @DisplayName("Should return paginated transactions for valid date range")
    void findTransactions_validDateRange_returnsPage() {
        // Arrange
        LocalDate from = LocalDate.of(2024, 1, 1);
        LocalDate to   = LocalDate.of(2024, 1, 31);
        Pageable pageable = PageRequest.of(0, 20);

        Transaction txn = buildTransaction();
        TransactionDto dto = buildTransactionDto();

        when(transactionRepository.findByUserIdAndCreatedAtBetween(
                eq(USER_ID), any(Instant.class), any(Instant.class), eq(pageable)))
            .thenReturn(new PageImpl<>(List.of(txn)));

        when(transactionMapper.toDto(txn)).thenReturn(dto);

        // Act
        Page<TransactionDto> result = transactionService
                .findTransactions(USER_ID, from, to, pageable);

        // Assert
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent()).containsExactly(dto);
    }

    @Test
    @DisplayName("Should throw InvalidDateRangeException when fromDate is after toDate")
    void findTransactions_fromDateAfterToDate_throwsException() {
        // Arrange
        LocalDate from = LocalDate.of(2024, 1, 31);
        LocalDate to   = LocalDate.of(2024, 1, 1);

        // Act & Assert
        assertThatThrownBy(() ->
            transactionService.findTransactions(USER_ID, from, to, Pageable.unpaged()))
            .isInstanceOf(InvalidDateRangeException.class)
            .hasMessageContaining("fromDate must not be after toDate");

        verifyNoInteractions(transactionRepository);
    }

    @Test
    @DisplayName("Should return all transactions when no date range is specified")
    void findTransactions_noDateRange_returnsAll() {
        // Arrange
        when(transactionRepository.findByUserIdAndCreatedAtBetween(
                eq(USER_ID), any(), any(), any()))
            .thenReturn(Page.empty());

        // Act
        Page<TransactionDto> result = transactionService
                .findTransactions(USER_ID, null, null, Pageable.unpaged());

        // Assert
        assertThat(result).isEmpty();
    }
}
```

### Testing Edge Cases with Parameterised Tests

```java
@ParameterizedTest(name = "amount={0} should be {1}")
@MethodSource("amountValidationCases")
void validateAmount_variousInputs_correctBehaviour(
        BigDecimal amount, boolean expectedValid) {
    if (expectedValid) {
        assertThatNoException().isThrownBy(
            () -> validator.validateAmount(amount));
    } else {
        assertThatThrownBy(() -> validator.validateAmount(amount))
            .isInstanceOf(InvalidAmountException.class);
    }
}

static Stream<Arguments> amountValidationCases() {
    return Stream.of(
        Arguments.of(new BigDecimal("0.01"),  true),   // minimum valid
        Arguments.of(new BigDecimal("1000"),  true),   // normal case
        Arguments.of(BigDecimal.ZERO,         false),  // zero not allowed
        Arguments.of(new BigDecimal("-1"),    false),  // negative not allowed
        Arguments.of(null,                    false)   // null not allowed
    );
}
```

---

## Code Coverage

Measure with JaCoCo and enforce in CI:

```xml
<!-- pom.xml -->
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <executions>
        <execution>
            <goals><goal>prepare-agent</goal></goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>verify</phase>
            <goals><goal>report</goal></goals>
        </execution>
        <execution>
            <id>check</id>
            <phase>verify</phase>
            <goals><goal>check</goal></goals>
            <configuration>
                <rules>
                    <rule>
                        <limits>
                            <limit>
                                <counter>LINE</counter>
                                <value>COVEREDRATIO</value>
                                <minimum>0.80</minimum>
                            </limit>
                        </limits>
                    </rule>
                </rules>
            </configuration>
        </execution>
    </executions>
</plugin>
```

---

## Best Practices

| Practice | Description |
|---|---|
| **AAA pattern** | Always structure: Arrange → Act → Assert |
| **One assertion focus** | Each test verifies one behaviour |
| **Descriptive names** | `methodName_condition_expectedResult` |
| **No production logic in tests** | Tests must not duplicate the code they test |
| **Deterministic** | Tests must not depend on time, random values, or order |
| **Fast** | Unit tests should complete in milliseconds |
| **Independent** | No shared mutable state between tests |

---

:::tip
Use `@DisplayName` on every test in JUnit 5. When a test fails in CI, a meaningful display name makes the problem immediately obvious without reading the full test code.
:::
