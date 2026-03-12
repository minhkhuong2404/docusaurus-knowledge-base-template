---
title: "Spring Framework: Deep Dive"
---

# Spring Framework: Deep Dive

This page covers advanced Spring Framework concepts including the bean lifecycle, AOP, data access patterns, reactive programming, and batch processing.

---

## Spring Bean Lifecycle

Understanding the bean lifecycle is crucial for optimizing resource management in large-scale applications.

### Lifecycle Phases

```
Container Start
    → Bean Definition Loading
        → Bean Instantiation
            → Dependency Injection
                → @PostConstruct / InitializingBean.afterPropertiesSet()
                    → Custom init-method
                        → Bean Ready for Use
                            → @PreDestroy / DisposableBean.destroy()
                                → Custom destroy-method
                                    → Bean Destroyed
```

### Lifecycle Callbacks

| Callback | Mechanism | When It Runs |
|----------|-----------|-------------|
| `@PostConstruct` | Annotation | After dependency injection is complete |
| `InitializingBean.afterPropertiesSet()` | Interface | After all properties are set |
| Custom `init-method` | XML/annotation config | After `afterPropertiesSet()` |
| `@PreDestroy` | Annotation | Before bean is removed from container |
| `DisposableBean.destroy()` | Interface | During container shutdown |
| Custom `destroy-method` | XML/annotation config | After `destroy()` |

```java
@Component
public class DataSourceManager {

    @PostConstruct
    public void init() {
        // Initialize connection pool
    }

    @PreDestroy
    public void cleanup() {
        // Close connections gracefully
    }
}
```

---

## ApplicationContext vs BeanFactory

| Feature | BeanFactory | ApplicationContext |
|---------|-------------|-------------------|
| Bean Instantiation | Lazy (on demand) | Eager (at startup) |
| Event Propagation | No | Yes (`ApplicationEvent`) |
| AOP Integration | Manual | Built-in |
| Internationalization (i18n) | No | Yes (`MessageSource`) |
| Web Context Support | No | Yes (`WebApplicationContext`) |
| Resource Loading | Basic | Advanced (`ResourceLoader`) |
| Recommended For | Low-memory / embedded systems | Enterprise applications |

```java
// BeanFactory (basic)
BeanFactory factory = new XmlBeanFactory(new ClassPathResource("beans.xml"));

// ApplicationContext (preferred)
ApplicationContext context = new AnnotationConfigApplicationContext(AppConfig.class);
```

---

## Circular Dependencies

A circular dependency occurs when two or more beans depend on each other:

```
Bean A → requires Bean B → requires Bean A → deadlock!
```

### Resolution Strategies

| Strategy | How It Works |
|----------|-------------|
| **Setter Injection** | Allows beans to be instantiated before dependencies are set |
| **`@Lazy` Annotation** | Defers bean initialization until actually needed, breaking the cycle |
| **Redesign Architecture** | Introduce an interface or third bean to decouple |

```java
@Component
public class ServiceA {
    private ServiceB serviceB;

    @Autowired
    @Lazy
    public void setServiceB(ServiceB serviceB) {
        this.serviceB = serviceB;
    }
}
```

---

## Stereotype Annotations

| Annotation | Layer | Purpose |
|------------|-------|---------|
| `@Component` | Generic | Any Spring-managed component |
| `@Service` | Service | Business logic and service tasks |
| `@Repository` | Data Access | Database interaction, exception translation |
| `@Controller` | Presentation | Web request handling (MVC) |
| `@RestController` | Presentation | RESTful web services (`@Controller` + `@ResponseBody`) |

> `@Component`, `@Service`, `@Repository`, and `@Controller` are technically interchangeable — they all register beans. However, using the correct stereotype improves code clarity and enables layer-specific features (e.g., `@Repository` adds persistence exception translation).

---

## Data Access: JpaRepository vs CrudRepository

| Feature | CrudRepository | JpaRepository |
|---------|---------------|---------------|
| CRUD Operations | Yes | Yes (inherited) |
| Pagination & Sorting | No | Yes |
| Batch Operations | No | Yes (`saveAll`, `deleteInBatch`) |
| Flush Persistence Context | No | Yes (`flush()`, `saveAndFlush()`) |
| Best For | Simple data access | Full JPA capabilities |

```java
// CrudRepository — basic CRUD
public interface UserRepository extends CrudRepository<User, Long> {
}

// JpaRepository — full JPA features
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByStatus(OrderStatus status);
}
```

---

## @Qualifier vs @Primary

When multiple beans of the same type exist, Spring needs to know which one to inject.

```java
@Configuration
public class DataSourceConfig {

    @Bean
    @Primary  // Default choice when no qualifier specified
    public DataSource primaryDataSource() {
        return new HikariDataSource(primaryConfig());
    }

    @Bean
    @Qualifier("reporting")
    public DataSource reportingDataSource() {
        return new HikariDataSource(reportingConfig());
    }
}

@Service
public class ReportService {
    // Uses the @Qualifier to pick a specific bean
    public ReportService(@Qualifier("reporting") DataSource dataSource) {
        // ...
    }
}
```

| Annotation | Behavior |
|------------|----------|
| `@Primary` | Marks a bean as the default when multiple candidates exist |
| `@Qualifier` | Explicitly selects a specific bean by name |

---

## @Transactional

The `@Transactional` annotation defines the scope of a database transaction. All operations within the annotated method either succeed or fail together.

```java
@Service
public class TransferService {

    @Transactional
    public void transfer(Long fromId, Long toId, BigDecimal amount) {
        accountRepository.debit(fromId, amount);
        accountRepository.credit(toId, amount);
        // If credit fails, debit is rolled back
    }
}
```

### Key Attributes

| Attribute | Purpose | Default |
|-----------|---------|---------|
| `propagation` | How transactions relate to each other | `REQUIRED` |
| `isolation` | Transaction isolation level | Database default |
| `readOnly` | Hint for optimization on read-only operations | `false` |
| `rollbackFor` | Exceptions that trigger rollback | Unchecked exceptions |
| `timeout` | Maximum time for the transaction | No timeout |

---

## Aspect-Oriented Programming (AOP)

AOP modularizes cross-cutting concerns — functionality that spans multiple classes like logging, security, and transaction management.

### Core Concepts

| Concept | Description |
|---------|-------------|
| **Aspect** | A module encapsulating a cross-cutting concern |
| **Join Point** | A specific point in execution (e.g., method call, field access) |
| **Pointcut** | An expression that selects one or more join points |
| **Advice** | Code that runs at a selected join point (before, after, around) |
| **Weaving** | Process of linking aspects with target objects |

### Join Point vs Pointcut

- **Join Point** = the actual location in the program where an aspect can be applied
- **Pointcut** = the expression that determines *which* join points the advice applies to

```java
@Aspect
@Component
public class LoggingAspect {

    // Pointcut: selects all methods in service package
    @Pointcut("execution(* com.example.service.*.*(..))")
    public void serviceMethods() {}

    // Advice: runs before the selected join points
    @Before("serviceMethods()")
    public void logMethodEntry(JoinPoint joinPoint) {
        log.info("Entering: {}", joinPoint.getSignature().getName());
    }
}
```

### AOP Disadvantages

- Makes execution flow harder to trace and debug
- Modularized code runs separately from the main application flow
- Can introduce unexpected behavior if pointcut expressions are too broad

---

## Spring WebFlux vs Spring MVC

| Aspect | Spring MVC | Spring WebFlux |
|--------|-----------|----------------|
| Programming Model | Synchronous, blocking | Asynchronous, non-blocking |
| Concurrency | Thread-per-request | Event-loop (fewer threads) |
| Built On | Servlet API | Project Reactor |
| Best For | Traditional web apps | High-concurrency, streaming |
| Server | Tomcat, Jetty | Netty, Undertow |

```java
// Spring MVC (blocking)
@GetMapping("/users/{id}")
public User getUser(@PathVariable Long id) {
    return userService.findById(id);
}

// Spring WebFlux (reactive)
@GetMapping("/users/{id}")
public Mono<User> getUser(@PathVariable Long id) {
    return userService.findById(id);
}
```

---

## Spring Batch

Spring Batch is a framework for processing large volumes of data efficiently — ideal for data migration, report generation, and scheduled jobs.

### Architecture

```
Job
 └── Step 1
 │    ├── ItemReader   → reads data (DB, file, API)
 │    ├── ItemProcessor → applies business logic
 │    └── ItemWriter   → writes processed data
 └── Step 2
      └── Tasklet      → single operation step
```

### Key Components

| Component | Role |
|-----------|------|
| **Job** | Defines the entire batch process |
| **Step** | A single phase within a job |
| **ItemReader** | Reads input data |
| **ItemProcessor** | Transforms data |
| **ItemWriter** | Writes output data |
| **JobRepository** | Stores metadata about job executions |

---

## Testing: @Mock vs @Spy

| Annotation | Behavior | Use Case |
|------------|----------|----------|
| `@Mock` | Fully mocked instance; no real code executes | Isolating dependencies in unit tests |
| `@Spy` | Partial mock wrapping a real instance; real methods execute unless overridden | Testing with some real behavior |

```java
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private PaymentGateway paymentGateway; // Fully mocked

    @Spy
    private OrderValidator orderValidator; // Real logic, selectively stubbed

    @InjectMocks
    private OrderService orderService;

    @Test
    void shouldProcessOrder() {
        when(paymentGateway.charge(any())).thenReturn(true);
        doReturn(true).when(orderValidator).validate(any()); // Override one method

        orderService.process(new Order());
        verify(paymentGateway).charge(any());
    }
}
```

---

## Configuration: Annotations vs XML

| Aspect | Annotations | XML |
|--------|------------|-----|
| Readability | Concise, inline with code | Verbose, separate files |
| Maintenance | Easier — part of the codebase | Harder — separate from code |
| Flexibility | Requires recompilation for changes | Can be modified without recompilation |
| Complex Config | Can get cluttered | Better for complex wiring |
| Best For | Most modern projects | Legacy systems, external config needs |

> **Best practice:** Use annotations for most configurations. Reserve XML for cases where external configuration without recompilation is required.

---

## Auto-Configuration Conflicts

When multiple `@AutoConfiguration` classes define the same bean, the last one loaded takes precedence. Control ordering with:

| Annotation | Purpose |
|------------|---------|
| `@AutoConfigureOrder` | Set explicit ordering priority |
| `@AutoConfigureAfter` | Load after a specific auto-configuration |
| `@AutoConfigureBefore` | Load before a specific auto-configuration |
| `@ConditionalOnMissingBean` | Only create bean if it doesn't already exist |

```java
@AutoConfiguration
@AutoConfigureAfter(DataSourceAutoConfiguration.class)
public class CustomDataSourceConfig {

    @Bean
    @ConditionalOnMissingBean
    public DataSource dataSource() {
        return new CustomDataSource();
    }
}
```
