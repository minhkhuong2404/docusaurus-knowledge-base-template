---
title: "Spring Framework: Deep Dive"
description: Advanced Spring Framework guide covering bean lifecycle, AOP, data access, reactive programming, and batch processing.
tags: [spring-framework, java, backend, advanced]
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

## BeanPostProcessor vs BeanFactoryPostProcessor

Two critical extension points that senior engineers must distinguish:

| | `BeanFactoryPostProcessor` | `BeanPostProcessor` |
|---|---|---|
| When it runs | **Before** any beans are instantiated | **After** each bean is instantiated |
| What it modifies | Bean **definitions** (metadata) | Bean **instances** |
| `ApplicationContext.getBean()` safe? | No — triggers premature instantiation | Yes |
| Common use | `PropertySourcesPlaceholderConfigurer` resolving `${...}` | AOP proxying, `@Autowired` injection |

```java
// BeanFactoryPostProcessor — modifies bean definitions before instantiation
@Component
public class CustomBeanFactoryPostProcessor implements BeanFactoryPostProcessor {
    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory factory) {
        BeanDefinition def = factory.getBeanDefinition("myService");
        def.setScope(BeanDefinition.SCOPE_PROTOTYPE);  // Change scope at definition level
    }
}

// BeanPostProcessor — wraps/modifies bean instances after creation
@Component
public class AuditBeanPostProcessor implements BeanPostProcessor {
    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        if (bean instanceof AuditableService) {
            return Proxy.newProxyInstance(...)  // Wrap in dynamic proxy
        }
        return bean;
    }
}
```

> **Interview trap:** `BeanPostProcessor` beans are instantiated very early in the context lifecycle, before other beans. Never `@Autowire` a late-initializing bean (e.g., JPA repositories) into a `BeanPostProcessor` — it causes premature initialization and bypasses auto-configuration.

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

### @Transactional Pitfall Patterns

These are the most common senior interview and production bug topics:

**1. Checked exceptions don't roll back by default**

```java
@Transactional
public void processPayment(Order order) throws PaymentException {
    paymentRepository.save(order);
    paymentGateway.charge(order);  // Throws PaymentException (checked)
    // ❌ Transaction COMMITS even though exception was thrown!
    // PaymentException is a checked exception — not rolled back by default
}

// Fix:
@Transactional(rollbackFor = PaymentException.class)
public void processPayment(Order order) throws PaymentException { ... }
```

**2. `@Transactional` on `private` or `final` methods is silently ignored**

```java
@Service
public class OrderService {
    @Transactional  // ❌ IGNORED — CGLIB cannot override private/final methods
    private void saveOrder(Order order) { ... }
}
// Solution: always put @Transactional on public methods
```

**3. Transaction not applied to new threads**

```java
@Transactional
public void processOrders(List<Order> orders) {
    orders.parallelStream().forEach(order -> {
        orderRepository.save(order);  // ❌ No transaction! Runs in a new thread
    });
}
// The transaction context is bound to the current thread via ThreadLocal.
// New threads spawned inside a @Transactional have NO transaction.
```

**4. `REQUIRES_NEW` doesn't work when called internally (self-invocation)**

```java
@Transactional
public void outer() {
    inner();  // ❌ @Transactional(REQUIRES_NEW) on inner() is IGNORED via self-call
}

@Transactional(propagation = Propagation.REQUIRES_NEW)
public void inner() { ... }  // Only works if called from ANOTHER Spring bean
```

**5. `readOnly = true` is not enforced — it's a hint**

```java
@Transactional(readOnly = true)
public User getUser(Long id) {
    User user = userRepository.findById(id).orElseThrow();
    user.setName("Modified");  // Hibernate may or may not flush this — behavior is DB/driver dependent
    return user;
    // readOnly = true skips the "dirty check" — Hibernate won't check for changes
    // This is a performance optimization, NOT a write-guard
}
```

---

## Aspect-Oriented Programming (AOP) — Deep Dive

AOP modularizes **cross-cutting concerns** — functionality that spans multiple classes like logging, security, and transaction management — keeping business logic clean.

### Core Concepts

| Concept | Definition | Example |
|---------|-----------|---------|
| **Aspect** | Module encapsulating a cross-cutting concern | `LoggingAspect`, `SecurityAspect` |
| **Join Point** | A point in execution where advice *can* run | Method call, method execution |
| **Pointcut** | Expression selecting which join points to intercept | `execution(* com.example.service..*(..))` |
| **Advice** | Code that runs at a selected join point | `@Before`, `@After`, `@Around` |
| **Target Object** | The original bean being proxied | Your `OrderService` |
| **Proxy** | The wrapper object that intercepts calls | Spring-generated CGLIB/JDK proxy |
| **Weaving** | Linking aspects with target objects | Spring does this at startup (proxy-based) |

### Spring AOP vs AspectJ

| | Spring AOP | AspectJ |
|---|---|---|
| Weaving | **Proxy-based** (runtime) | **Bytecode weaving** (compile/load time) |
| Join points supported | **Method execution only** | Fields, constructors, static methods, etc. |
| Self-invocation | ❌ (bypasses proxy) | ✅ (weaved into bytecode) |
| Setup | Zero config (built into Spring) | Needs AspectJ compiler / agent |
| Best for | Most enterprise use cases | Performance-critical or non-Spring code |

> **Key insight:** Spring AOP only intercepts **Spring-managed bean method calls made through the proxy**. Field access, constructors, and `this.method()` calls are invisible to it.

---

### Pointcut Expression DSL

Mastery of pointcut expressions is essential for writing precise, production-safe aspects:

```java
// execution — most common: matches method execution
@Pointcut("execution(* com.example.service.*.*(..))")
// execution( [modifier] [return-type] [declaring-type.][method]([params]) )
//   *            = any return type
//   com.example.service.*.*(..)  = any method in any class in this package
//   (..) = any number of params

// within — matches all methods within a type/package
@Pointcut("within(com.example.controller..*)")  // all classes in controller and subpackages

// @annotation — matches methods annotated with a specific annotation
@Pointcut("@annotation(com.example.annotation.Auditable)")

// @within — matches all methods within a class annotated with a given annotation
@Pointcut("@within(org.springframework.stereotype.Service)")

// bean — matches methods on specific Spring beans (Spring AOP only)
@Pointcut("bean(orderService)")
@Pointcut("bean(*Service)")  // all beans ending in "Service"

// args — matches based on method argument types at runtime
@Pointcut("args(com.example.dto.OrderRequest, ..)")

// Combining expressions
@Pointcut("within(com.example.service..*) && !execution(* *.get*(..)))")
// all service methods except getters
```

### Advice Types

```java
@Aspect
@Component
public class ExampleAspect {

    // Runs before the method — cannot prevent execution (use @Around for that)
    @Before("execution(* com.example.service.*.*(..))")
    public void beforeAdvice(JoinPoint jp) {
        log.info("Calling: {}", jp.getSignature().toShortString());
    }

    // Runs after normal return — receives the return value
    @AfterReturning(pointcut = "execution(* com.example.service.*.*(..))", returning = "result")
    public void afterReturning(JoinPoint jp, Object result) {
        log.info("Returned: {}", result);
    }

    // Runs after an exception is thrown
    @AfterThrowing(pointcut = "execution(* com.example.service.*.*(..))", throwing = "ex")
    public void afterThrowing(JoinPoint jp, Exception ex) {
        log.error("Exception in {}: {}", jp.getSignature(), ex.getMessage());
    }

    // Runs after method regardless of outcome (like finally)
    @After("execution(* com.example.service.*.*(..))")
    public void afterAdvice(JoinPoint jp) { }

    // Wraps the method — full control, must call proceed()
    @Around("execution(* com.example.service.*.*(..))")
    public Object aroundAdvice(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.currentTimeMillis();
        try {
            Object result = pjp.proceed();  // MUST call proceed() to continue
            log.info("Duration: {}ms", System.currentTimeMillis() - start);
            return result;
        } catch (Exception e) {
            log.error("Failed after {}ms", System.currentTimeMillis() - start);
            throw e;  // Always rethrow unless intentionally swallowing
        }
    }
}
```

### Aspect Ordering (`@Order`)

When multiple aspects apply to the same join point, `@Order` controls execution order. Lower number = **outer** (runs first entering, last exiting):

```
@Order(1) Security Aspect → @Order(2) Logging Aspect → @Order(3) Transaction Aspect
         ↓                           ↓                           ↓
                              Target Method
         ↑                           ↑                           ↑
    (last out)                 (second out)                (first out)
```

```java
@Aspect @Component @Order(1)
public class SecurityAspect { ... }  // Outermost — checks auth first

@Aspect @Component @Order(2)
public class LoggingAspect { ... }   // Middle — logs method entry/exit

@Aspect @Component @Order(3)
public class TransactionAspect { ... } // Innermost — closest to target
```

> In Spring's built-in aspects: `@Transactional` has `Integer.MAX_VALUE` order (innermost). `@Validated` has `Integer.MAX_VALUE - 1`. Place your custom aspects with explicit lower numbers to run before them.

---

### AOP Integration 1: Logging and MDC Tracing

The most valuable production AOP use case — attaching trace IDs, user context, and timing to every log line without cluttering service code:

```java
@Aspect
@Component
@Order(2)
public class LoggingAspect {

    @Around("@within(org.springframework.stereotype.Service)")
    public Object logAndTrace(ProceedingJoinPoint pjp) throws Throwable {
        String method = pjp.getSignature().toShortString();
        String traceId = UUID.randomUUID().toString().substring(0, 8);

        // MDC: attach context to every log line in this thread
        MDC.put("traceId", traceId);
        MDC.put("method", method);
        long start = System.currentTimeMillis();

        try {
            log.debug("→ {}", method);
            Object result = pjp.proceed();
            log.debug("← {} [{}ms]", method, System.currentTimeMillis() - start);
            return result;
        } catch (Exception e) {
            log.error("✗ {} failed [{}ms]: {}", method, System.currentTimeMillis() - start, e.getMessage());
            throw e;
        } finally {
            MDC.clear();  // CRITICAL: always clear MDC in finally to avoid leaks in thread pools
        }
    }
}
```

**Logback pattern to use the MDC context:**
```xml
<pattern>%d{HH:mm:ss} [%thread] %X{traceId} %-5level %logger - %msg%n</pattern>
```

**Production refinement — propagate MDC to async threads:**
```java
// MDC is ThreadLocal — it's lost when @Async spawns a new thread
// Fix: use MDC.getCopyOfContextMap() and restore in the async thread
@Async
public void asyncTask() {
    Map<String, String> context = MDC.getCopyOfContextMap();
    CompletableFuture.runAsync(() -> {
        if (context != null) MDC.setContextMap(context);
        try { doWork(); } finally { MDC.clear(); }
    });
}
```

---

### AOP Integration 2: Security with `@PreAuthorize` and Method Security

Spring Security's method-level security (`@PreAuthorize`, `@PostAuthorize`, `@Secured`) is implemented as an AOP aspect:

```java
@Service
public class OrderService {

    // SpEL expression evaluated against SecurityContext
    @PreAuthorize("hasRole('ORDER_MANAGER') or #order.ownerId == authentication.principal.id")
    public void cancelOrder(Order order) { ... }

    // @PostAuthorize: runs AFTER method, can inspect return value
    @PostAuthorize("returnObject.ownerId == authentication.principal.id")
    public Order getOrder(Long orderId) { ... }

    // @PostFilter: filters collection return values
    @PostFilter("filterObject.status != 'CONFIDENTIAL' or hasRole('ADMIN')")
    public List<Order> getAllOrders() { ... }
}
```

**How it works internally:**

```
External call → MethodSecurityInterceptor (AOP @Around advice)
                    ↓
            Evaluates SpEL against SecurityContextHolder.getContext()
                    ↓
            AccessDecisionManager → grants or throws AccessDeniedException
                    ↓
            pjp.proceed() → target method executes
```

**Custom security aspect — audit sensitive data access:**

```java
@Aspect
@Component
@Order(1)  // Before transaction opens (so we can audit before any DB write)
public class AuditSecurityAspect {

    private final AuditRepository auditRepo;

    @Around("@annotation(com.example.annotation.SensitiveOperation)")
    public Object auditSensitiveOperation(ProceedingJoinPoint pjp) throws Throwable {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : "anonymous";
        String operation = pjp.getSignature().toShortString();

        AuditEntry entry = AuditEntry.builder()
            .username(username)
            .operation(operation)
            .args(Arrays.toString(pjp.getArgs()))
            .timestamp(Instant.now())
            .build();

        try {
            Object result = pjp.proceed();
            entry.setOutcome("SUCCESS");
            auditRepo.save(entry);
            return result;
        } catch (AccessDeniedException e) {
            entry.setOutcome("ACCESS_DENIED");
            auditRepo.save(entry);
            throw e;
        } catch (Exception e) {
            entry.setOutcome("ERROR: " + e.getMessage());
            auditRepo.save(entry);
            throw e;
        }
    }
}
```

**Common pitfall:** `@PreAuthorize` on a Spring `@Component` method works. `@PreAuthorize` on a controller method called internally (this.method()) does NOT — same self-invocation problem as `@Transactional`.

---

### AOP Integration 3: Caching with `@Cacheable`

Spring's `@Cacheable` is an AOP around-advice that:
1. Computes the cache key from SpEL
2. Checks the cache — returns cached value if hit
3. Calls the target method on cache miss
4. Stores the result in the cache

```java
@Service
public class ProductService {

    // key is evaluated from method args using SpEL
    @Cacheable(value = "products", key = "#category + '_' + #page", unless = "#result.isEmpty()")
    public List<Product> getProductsByCategory(String category, int page) {
        return productRepository.findByCategory(category, PageRequest.of(page, 20));
    }

    // @CacheEvict: removes entries on write operations
    @CacheEvict(value = "products", allEntries = true)
    @Transactional
    public Product updateProduct(Product product) {
        return productRepository.save(product);
    }

    // @CachePut: always updates cache regardless of hit/miss
    @CachePut(value = "products", key = "#result.id")
    public Product createProduct(Product product) {
        return productRepository.save(product);
    }
}
```

**Production gotchas:**

```java
// ❌ Self-invocation — @Cacheable is ignored (same proxy problem)
public List<Product> getAll() {
    return getProductsByCategory("electronics", 0);  // NOT cached!
}

// ❌ @Cacheable on private/final method — silently ignored
@Cacheable("products")
private List<Product> findFromDb() { ... }  // CGLIB can't intercept

// ❌ Cache key collision — different methods, same key expression
@Cacheable(value = "users", key = "#id")    // User cache
@Cacheable(value = "users", key = "#id")    // Order cache (different bean, same value!)
// Fix: always use distinct cache value names per entity type
```

**Custom cache aspect for metrics:**

```java
@Aspect
@Component
@Order(10)  // After Spring's @Cacheable aspect (which has lower order)
public class CacheMetricsAspect {

    private final MeterRegistry meterRegistry;

    @Around("@annotation(cacheable)")
    public Object trackCacheUsage(ProceedingJoinPoint pjp, Cacheable cacheable) throws Throwable {
        Timer.Sample sample = Timer.start(meterRegistry);
        String cacheName = cacheable.value()[0];

        Object result = null;
        boolean cacheHit = false;

        result = pjp.proceed();
        // Spring's cacheable aspect has already run — if result was cached, method wasn't called
        // We'd need to hook CacheManager directly to know hit/miss precisely

        sample.stop(meterRegistry.timer("cache.operation", "cache", cacheName));
        return result;
    }
}
```

---

### AOP Integration 4: Transactions — How `@Transactional` Uses AOP

`@Transactional` is an AOP around-advice implemented by `TransactionInterceptor`:

```
External call
    → CGLIB/JDK Proxy (TransactionInterceptor's @Around)
        → TransactionManager.getTransaction() (opens DB connection + begins TX)
            → target method executes (JPA calls, etc.)
        → on success: TransactionManager.commit()
        → on exception: TransactionManager.rollback() (for unchecked + configured exceptions)
```

**Transaction propagation modeled as AOP advice chain:**

```java
// Service A @Transactional (REQUIRED) calls Service B @Transactional (REQUIRES_NEW)
// These are separate Spring beans — TWO separate proxy invocations:

class ServiceA {                          class ServiceB {
  TX-Proxy-A                              TX-Proxy-B
    @Transactional REQUIRED                 @Transactional REQUIRES_NEW
    ↓                                       ↓
  Begin TX-1                              Suspend TX-1
    → calls ServiceB.save()               Begin TX-2
       → ServiceB proxy intercepts           → execute
          → REQUIRES_NEW → suspend TX-1   Commit TX-2
                                          Resume TX-1
}                                       → Return to ServiceA
```

**Thread boundary: transactions don't cross `@Async` barriers**

```java
@Service
public class ReportService {

    @Transactional
    public void generateReport() {
        List<Order> orders = orderRepo.findAll();

        // ❌ @Async spawns new thread — transaction context is ThreadLocal, NOT transferred
        notificationService.sendReport(orders);
        // notificationService.sendReport() runs in a thread with NO transaction
    }
}
```

---

### AOP Integration 5: Metrics and Monitoring with Micrometer

AOP makes it trivial to add performance metrics without modifying business code:

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Timed {
    String value() default "";
    String[] tags() default {};
}

@Aspect
@Component
public class MetricsAspect {

    private final MeterRegistry meterRegistry;

    @Around("@annotation(timed)")
    public Object recordMetrics(ProceedingJoinPoint pjp, Timed timed) throws Throwable {
        String metricName = timed.value().isEmpty()
            ? pjp.getSignature().getDeclaringTypeName() + "." + pjp.getSignature().getName()
            : timed.value();

        Timer.Sample sample = Timer.start(meterRegistry);

        try {
            Object result = pjp.proceed();
            sample.stop(meterRegistry.timer(metricName,
                "outcome", "success",
                "class", pjp.getSignature().getDeclaringType().getSimpleName()));
            return result;
        } catch (Exception e) {
            sample.stop(meterRegistry.timer(metricName,
                "outcome", "error",
                "exception", e.getClass().getSimpleName()));
            meterRegistry.counter(metricName + ".errors",
                "exception", e.getClass().getSimpleName()).increment();
            throw e;
        }
    }
}

// Usage on service methods
@Service
public class OrderService {
    @Timed("order.placement")
    public Order placeOrder(OrderRequest req) { ... }
}
```

**Integrating with Micrometer's `@Timed` directly:**

```java
// Spring Boot Actuator + Micrometer already provides @io.micrometer.core.annotation.Timed
// Enable via TimedAspect bean:
@Bean
public TimedAspect timedAspect(MeterRegistry registry) {
    return new TimedAspect(registry);
}

// Then on any Spring bean method:
@Timed(value = "http.requests", extraTags = {"region", "us-east-1"}, percentiles = {0.5, 0.95, 0.99})
public Order placeOrder(OrderRequest req) { ... }
// Metrics available at /actuator/metrics/http.requests
```

---

### AOP Integration 6: Retry and Circuit Breaker

Both Spring Retry and Resilience4j use AOP aspects under the hood:

**Spring Retry (`@Retryable`):**

```java
@Service
public class PaymentService {

    // AOP intercepts this → retries on failure with backoff
    @Retryable(
        retryFor = {TransientDataAccessException.class, RemoteServiceException.class},
        maxAttempts = 3,
        backoff = @Backoff(delay = 1000, multiplier = 2.0, maxDelay = 10000)
    )
    public PaymentResult charge(PaymentRequest request) {
        return paymentGateway.process(request);
    }

    @Recover  // Called when all retries exhausted
    public PaymentResult chargeRecover(RemoteServiceException ex, PaymentRequest request) {
        log.error("Payment failed after retries: {}", request.getId());
        return PaymentResult.failed("service_unavailable");
    }
}
```

**Resilience4j with AOP:**

```java
@Service
public class InventoryService {

    // Multiple AOP aspects applied — order matters!
    // Execution order (inner to outer):
    // Bulkhead → Rate Limiter → Circuit Breaker → Retry → TimeLimiter → method
    @CircuitBreaker(name = "inventory", fallbackMethod = "fallbackInventory")
    @Retry(name = "inventory")
    @TimeLimiter(name = "inventory")
    public CompletableFuture<Integer> checkStock(Long productId) {
        return CompletableFuture.supplyAsync(() -> inventoryClient.getStock(productId));
    }

    // Fallback receives the exception as first param
    public CompletableFuture<Integer> fallbackInventory(Long productId, CallNotPermittedException ex) {
        log.warn("Circuit open for product {}: using cached stock", productId);
        return CompletableFuture.completedFuture(stockCache.getOrDefault(productId, 0));
    }
}
```

**Resilience4j is NOT a Spring AOP aspect by default** — it has its own annotation-based AOP that requires `resilience4j-spring-boot3` starter. The proxy chain stacks multiple Resilience4j interceptors.

---

### Custom Annotation-Based Aspect Pattern

The cleanest pattern: define your own annotation, then intercept it with an aspect — no pointcut expressions in business code:

```java
// 1. Define the annotation
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RateLimit {
    int requestsPerSecond() default 100;
    String key() default "";  // SpEL for dynamic key (e.g., "#userId")
}

// 2. Binding annotation to advice via parameter binding
@Aspect
@Component
public class RateLimitAspect {

    private final RateLimiterRegistry registry = RateLimiterRegistry.ofDefaults();

    @Around("@annotation(rateLimit)")  // Binds annotation instance to param
    public Object enforceRateLimit(ProceedingJoinPoint pjp, RateLimit rateLimit) throws Throwable {
        // Parse SpEL key expression
        String key = resolveKey(rateLimit.key(), pjp);

        RateLimiter limiter = registry.rateLimiter(key,
            RateLimiterConfig.custom()
                .limitForPeriod(rateLimit.requestsPerSecond())
                .limitRefreshPeriod(Duration.ofSeconds(1))
                .build());

        return limiter.executeCallable(() -> {
            try { return pjp.proceed(); }
            catch (Throwable t) { throw new RuntimeException(t); }
        });
    }
}

// 3. Apply cleanly in service code
@Service
public class ApiService {
    @RateLimit(requestsPerSecond = 50, key = "#userId")
    public Response handleRequest(Long userId, Request req) { ... }
}
```

---

### AOP Aspect Ordering — Spring's Internal Stack

When multiple framework annotations combine, the proxy chain from outermost to innermost looks like this in a typical Spring Boot service call:

```
External HTTP Request
  → Spring Security (FilterChain, method security @PreAuthorize) [Order 1]
    → Logging/Tracing Aspect (MDC setup) [Order 2]
      → Metrics Aspect (@Timed) [Order 3]
        → Retry Aspect (@Retryable) [Order 4]
          → Cache Aspect (@Cacheable) [Order 5]
            → Transaction Aspect (@Transactional) [Order MAX_VALUE-1]
              → Validation Aspect (@Validated) [Order MAX_VALUE]
                → Target Method
              ← validation check
            ← commit / rollback
          ← cache write
        ← retry on failure
      ← stop timer
    ← clear MDC
  ← security check
HTTP Response
```

Understanding this chain is critical for debugging puzzling behavior like:
- **Why did my audit log save even though the transaction rolled back?** (Audit aspect is outside transaction)
- **Why is my cache returning stale data after a failed update?** (CacheEvict runs even on exception by default — use `beforeInvocation = false`)
- **Why isn't my @Retryable working?** (It's on a `private` method or called internally)

---

**Same issue applies to:** `@Async`, `@Cacheable`, `@Scheduled`, and any other Spring AOP annotation.



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

---

## Advanced Editorial Pass: Deep Dive with Operability Focus

### Advanced Lens
- Internal extension points should be used sparingly and with clear ownership.
- Container behavior must remain explainable to on-call engineers under stress.
- Framework customization is justified only when it reduces net complexity.

### Failure Scenarios
- Custom post-processors that alter bean semantics unexpectedly.
- Complex proxy stacks that blur transaction and security boundaries.
- Hard-to-reproduce context initialization issues across environments.

### Implementation Guidance
1. Document every non-default extension with intent and rollback approach.
2. Keep AOP and proxy layering transparent in diagnostics.
3. Add minimal reproducible tests for every lifecycle customization.

### Compare Next
- [Spring Framework: Overview](./spring-framework.md)
- [Spring Boot - Internals & Architecture](./spring-boot-internals.md)
- [Spring Security - Complete Guide](./spring-security.md)

---

## Interview Questions

### Q: How do you decide whether a cross-cutting concern belongs in AOP?
**A:** Use AOP for orthogonal policies such as logging, security, metrics, and transactions, not core business branching.

### Q: What is the highest-impact proxy pitfall in Spring services?
**A:** Self-invocation bypasses proxies, which can silently disable @Transactional, @Async, and @Cacheable behavior.

### Q: Why should bean post-processing be handled carefully?
**A:** Early lifecycle hooks can trigger premature bean creation and unstable startup order.

### Q: How do you make transaction boundaries reliable in large codebases?
**A:** Keep transactional entry points explicit, public, and close to use-case orchestration boundaries.

### Q: What does senior-level AOP debugging look like?
**A:** Trace advisor order, proxy type, and join-point matching before changing business code.

### Q: When should you avoid creating another custom aspect?
**A:** When framework-provided mechanisms already cover the concern with lower complexity.

### Q: How do method security and transaction aspects interact operationally?
**A:** Aspect order determines whether access checks happen before resource usage and transaction opening.
