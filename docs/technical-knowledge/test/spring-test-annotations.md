---
id: spring-test-annotations
title: Testing Annotations
sidebar_label: 🌱 Annotations (JUnit/Spring)
---

# Testing Annotations in Spring & JUnit

When writing tests in a Spring Boot application, you will frequently use a combination of JUnit 5 and Spring Framework annotations.

## JUnit 5 Core Annotations

- `@Test`: Marks a method as a test method.
- `@ParameterizedTest`: Allows a test to run multiple times with different arguments. Used with `@ValueSource`, `@CsvSource`, `@MethodSource`, etc.
- `@BeforeEach` / `@AfterEach`: Executed before/after each test method in the class. Useful for resetting mocks or preparing test data.
- `@BeforeAll` / `@AfterAll`: Executed once before/after all tests in the class. Must be `static` unless lifecycle is per-class. Useful for heavy setup like starting a testcontainer.

### Parameterized Test Example
```java
@ParameterizedTest
@ValueSource(strings = {"racecar", "radar", "able was I ere I saw elba"})
void checkPalindromes(String candidate) {
    assertTrue(StringUtils.isPalindrome(candidate));
}
```

## Mockito Annotations

- `@Mock`: Creates a mock instance of a class or interface.
- `@Spy`: Creates a spy on a real object. Unlike a mock, a spy calls real methods unless explicitly stubbed.
- `@InjectMocks`: Instantiates the tested object and automatically injects `@Mock` or `@Spy` fields into it.

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Test
    void testFindUser() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(new User()));
        assertNotNull(userService.findUser(1L));
    }
}
```

## Spring Boot Test Annotations

- `@SpringBootTest`: Loads the complete Spring application context. Used for integration testing. Can start the server on a defined or random port using `webEnvironment`.
- `@MockBean` (Deprecated in Spring Boot 3.4+ / use `@MockitoBean`): Replaces an existing bean in the Spring ApplicationContext with a mock.
- `@SpyBean` (Deprecated in Spring Boot 3.4+ / use `@MockitoSpyBean`): Wraps a Spring bean with a Mockito spy, allowing you to stub specific methods while keeping real behavior for others.

### Note on Spring Boot 3.4+
In recent Spring Boot versions, `@MockitoBean` and `@MockitoSpyBean` replace the older `@MockBean` and `@SpyBean` annotations to better align with the core framework and improve integration test performance by avoiding context caching issues.

## Sliced Testing Annotations

Sometimes loading the full context with `@SpringBootTest` is too heavy. Spring provides "sliced" annotations that load only specific layers:
- `@WebMvcTest(MyController.class)`: Loads only the web layer (Controllers, Filters, ControllerAdvice) without the full context. Dependencies must be mocked.
- `@DataJpaTest`: Loads only JPA configuration, auto-configures an in-memory database, and wraps tests in a transaction.
- `@JsonTest`: Focuses solely on testing JSON serialization and deserialization.

---

## Interview Questions

### Q: When would you choose @SpringBootTest over sliced tests?
**A:** Use @SpringBootTest when validating cross-layer wiring, full auto-configuration behavior, or end-to-end integration of app components.

### Q: Why can excessive @SpringBootTest usage slow teams down?
**A:** Full-context tests are expensive to start and can reduce feedback speed, which discourages frequent local execution.

### Q: How do you choose between @Mock, @MockBean, and @MockitoBean?
**A:** Use @Mock for plain unit tests, and context-aware bean mocking annotations when replacing beans inside Spring-managed tests.

### Q: What is a common mistake with @WebMvcTest?
**A:** Assuming service/repository beans are loaded automatically. You must provide mocks for dependencies not included in the web slice.

### Q: How do you test configuration properties safely?
**A:** Use targeted context tests with minimal configuration scope and validate binding, defaults, and profile-specific overrides.

### Q: Why are @DataJpaTest defaults important for reliability?
**A:** Transaction rollback and focused JPA context prevent state leakage across tests and keep persistence behavior deterministic.

### Q: How should senior engineers handle deprecated test annotations during upgrades?
**A:** Migrate incrementally with compatibility checks, keep tests green through mixed usage windows, and standardize once baseline versions are aligned.

### Q: What signals indicate your test annotation strategy is wrong?
**A:** Slow suite startup, fragile context caching, and frequent unrelated test breakage after minor wiring changes.
