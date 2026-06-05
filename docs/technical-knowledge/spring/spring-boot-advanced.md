---
title: Spring Boot — Advanced Topics
description: Advanced Spring Boot topics covering security, performance tuning, reactive systems, deployment, and production-ready design.
tags: [spring-boot, java, backend, advanced]
---

# Spring Boot — Advanced Topics

Advanced Spring Boot concepts including performance tuning, security practices, reactive programming, distributed systems patterns, and production deployment strategies.

---

## Spring Boot Security

### Security Architecture

Spring Security in Spring Boot works through a **filter chain**. Every HTTP request passes through a series of security filters before reaching your controller:

```
Request → SecurityFilterChain → Authentication → Authorization → Controller
```

### Default Security Behavior

Adding `spring-boot-starter-security` immediately:

- Protects all endpoints with HTTP Basic authentication
- Generates a random password (printed to console)
- Enables CSRF protection
- Creates a default login page at `/login`

### Custom Security Configuration (Spring Boot 3.x)

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            );
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

### JWT Authentication Flow

```
1. Client sends credentials to /auth/login
2. Server validates and returns a JWT
3. Client includes JWT in Authorization header for subsequent requests
4. JwtAuthenticationFilter extracts and validates the token
5. SecurityContext is populated with the authenticated user
```

### Method-Level Security

```java
@Service
public class OrderService {

    @PreAuthorize("hasRole('ADMIN') or #userId == authentication.principal.id")
    public Order getOrder(Long userId, Long orderId) {
        // Only admins or the owning user can access
    }

    @PostAuthorize("returnObject.owner == authentication.name")
    public Order findOrder(Long orderId) {
        // Filter response — only return if the caller owns it
    }
}
```

---

## Reactive Programming with WebFlux

### When to Use WebFlux vs MVC

| Aspect | Spring MVC | Spring WebFlux |
|--------|-----------|----------------|
| Model | Thread-per-request | Event loop (non-blocking) |
| Best For | Traditional CRUD, blocking I/O | High concurrency, streaming |
| Server | Tomcat, Jetty | Netty, Undertow |
| Data Access | JDBC, JPA | R2DBC, reactive MongoDB |
| Backpressure | N/A | Built-in (Reactive Streams) |

### Reactive REST Endpoint

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    @GetMapping
    public Flux<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/{id}")
    public Mono<User> getUser(@PathVariable String id) {
        return userRepository.findById(id)
            .switchIfEmpty(Mono.error(new UserNotFoundException(id)));
    }
}
```

### Key Reactive Types

| Type | Description | Analogy |
|------|-------------|---------|
| `Mono<T>` | 0 or 1 element | `Optional<T>` or `CompletableFuture<T>` |
| `Flux<T>` | 0 to N elements | `Stream<T>` or `List<T>` |

---

## Caching Strategies

### Spring Cache Abstraction

```java
@Service
public class ProductService {

    @Cacheable(value = "products", key = "#id")
    public Product getProduct(Long id) {
        // Called only on cache miss
        return productRepository.findById(id).orElseThrow();
    }

    @CachePut(value = "products", key = "#product.id")
    public Product updateProduct(Product product) {
        // Always executes, updates cache with return value
        return productRepository.save(product);
    }

    @CacheEvict(value = "products", key = "#id")
    public void deleteProduct(Long id) {
        // Removes entry from cache
        productRepository.deleteById(id);
    }

    @CacheEvict(value = "products", allEntries = true)
    public void clearProductCache() {
        // Clears the entire cache
    }
}
```

### Cache Providers

| Provider | Use Case |
|----------|----------|
| **ConcurrentMapCache** | Default, in-memory, single-instance apps |
| **Caffeine** | High-performance in-memory, single-instance |
| **Redis** | Distributed caching across multiple instances |
| **Hazelcast** | Distributed caching with data grid features |
| **EhCache** | Feature-rich, supports disk overflow |

### Redis Cache Configuration

```yaml
spring:
  cache:
    type: redis
    redis:
      time-to-live: 600000  # 10 minutes
  data:
    redis:
      host: localhost
      port: 6379
```

---

## Exception Handling Patterns

### Global Exception Handler

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.NOT_FOUND.value(),
            ex.getMessage(),
            LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        List<String> errors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .toList();

        ErrorResponse error = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            "Validation failed",
            errors,
            LocalDateTime.now()
        );
        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "An unexpected error occurred",
            LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
```

### Problem Details (RFC 7807) — Spring Boot 3.x

```java
@ExceptionHandler(ResourceNotFoundException.class)
public ProblemDetail handleNotFound(ResourceNotFoundException ex) {
    ProblemDetail problem = ProblemDetail.forStatusAndDetail(
        HttpStatus.NOT_FOUND, ex.getMessage()
    );
    problem.setTitle("Resource Not Found");
    problem.setProperty("timestamp", Instant.now());
    return problem;
}
```

---

## Database Migration with Flyway / Liquibase

### Flyway

Spring Boot auto-configures Flyway when it's on the classpath. Migrations are SQL files in `src/main/resources/db/migration/`:

```
db/migration/
├── V1__Create_users_table.sql
├── V2__Add_email_column.sql
└── V3__Create_orders_table.sql
```

```sql
-- V1__Create_users_table.sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Liquibase

Alternative to Flyway using XML/YAML/JSON changelogs:

```yaml
databaseChangeLog:
  - changeSet:
      id: 1
      author: dev
      changes:
        - createTable:
            tableName: users
            columns:
              - column:
                  name: id
                  type: BIGINT
                  autoIncrement: true
                  constraints:
                    primaryKey: true
```

---

## Performance Tuning

### JVM and Server Tuning

```yaml
server:
  tomcat:
    threads:
      max: 200       # Max worker threads
      min-spare: 10  # Min idle threads
    max-connections: 10000
    accept-count: 100
    connection-timeout: 20000
```

### Connection Pool Tuning (HikariCP)

For detailed guidelines on pool sizing, parameter details, and starvation patterns, see the **[Database Connection Pooling](../system-design/connection-pooling.md)** guide.

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
```

### JPA Performance

```yaml
spring:
  jpa:
    open-in-view: false  # Disable OSIV — prevents lazy loading in views
    properties:
      hibernate:
        default_batch_fetch_size: 16
        jdbc:
          batch_size: 50
        order_inserts: true
        order_updates: true
        generate_statistics: true  # Enable for debugging, disable in prod
```

### Common Performance Anti-Patterns

| Anti-Pattern | Impact | Solution |
|--------------|--------|----------|
| N+1 query problem | Excessive DB calls | Use `JOIN FETCH`, `@EntityGraph`, or batch fetching |
| Open Session in View (OSIV) | DB connection held through view rendering | Set `spring.jpa.open-in-view=false` |
| No connection pool tuning | Connection exhaustion under load | Configure HikariCP (see [Connection Pooling](../system-design/connection-pooling.md)) |
| Unbounded queries | Memory exhaustion | Always use pagination (`Pageable`) |
| Missing indexes | Slow queries | Analyze query plans, add database indexes |
| Synchronous external calls | Thread starvation | Use async (`@Async`) or reactive patterns |

---

## Graceful Shutdown

Spring Boot 2.3+ supports graceful shutdown:

```yaml
server:
  shutdown: graceful
spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s
```

**Behavior:**
1. Stop accepting new requests
2. Wait for in-flight requests to complete (up to timeout)
3. Shut down the application context
4. Destroy beans (calls `@PreDestroy`)

---

## Observability

### Distributed Tracing with Micrometer

Spring Boot 3.x integrates with Micrometer Observation API:

```yaml
management:
  tracing:
    sampling:
      probability: 1.0  # Sample 100% of requests (reduce in production)
  endpoints:
    web:
      exposure:
        include: health, metrics, prometheus
  metrics:
    distribution:
      percentiles-histogram:
        http.server.requests: true
```

### Custom Metrics

```java
@Service
public class OrderService {

    private final Counter orderCounter;
    private final Timer orderTimer;

    public OrderService(MeterRegistry registry) {
        this.orderCounter = Counter.builder("orders.created")
            .description("Number of orders created")
            .register(registry);
        this.orderTimer = Timer.builder("orders.processing.time")
            .description("Order processing time")
            .register(registry);
    }

    public Order createOrder(OrderRequest request) {
        return orderTimer.record(() -> {
            Order order = processOrder(request);
            orderCounter.increment();
            return order;
        });
    }
}
```

---

## Docker & Containerization

### Layered JAR for Efficient Docker Builds

Spring Boot 2.3+ produces layered JARs for better Docker caching:

```dockerfile
FROM eclipse-temurin:21-jre as builder
WORKDIR /app
COPY target/*.jar app.jar
RUN java -Djarmode=layertools -jar app.jar extract

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /app/dependencies/ ./
COPY --from=builder /app/spring-boot-loader/ ./
COPY --from=builder /app/snapshot-dependencies/ ./
COPY --from=builder /app/application/ ./
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
```

### Cloud Native Buildpacks

No Dockerfile needed:

```bash
./mvnw spring-boot:build-image -Dspring-boot.build-image.imageName=myapp:latest
```

---

## Virtual Threads (Spring Boot 3.2+ / Java 21)

Virtual threads (Project Loom) replace the traditional thread-per-request model with lightweight JVM-managed threads, enabling far greater concurrency without reactive code.

### Enabling Virtual Threads

```yaml
spring:
  threads:
    virtual:
      enabled: true  # Spring Boot 3.2+ — Tomcat uses virtual threads automatically
```

```java
// Custom async executor with virtual threads
@Bean
public Executor taskExecutor() {
    return Executors.newVirtualThreadPerTaskExecutor();
}
```

### Virtual Threads vs Reactive (WebFlux)

| Aspect | Virtual Threads | WebFlux (Reactive) |
|---|---|---|
| Programming model | Familiar blocking code | Reactive (Mono/Flux) |
| Code complexity | Low | High |
| Blocking I/O | **Safe** — virtual threads park, not block OS threads | Must avoid — blocks the event loop |
| Throughput | Very high for I/O-bound workloads | Very high |
| CPU-bound work | No gain over platform threads | No gain |
| Migration cost | Minimal — existing code works | Full rewrite to reactive |

### Virtual Thread Pitfalls

```java
// ❌ Synchronized blocks pin the carrier thread — kills virtual thread benefits
@Service
public class LegacyService {
    public synchronized void criticalSection() {  // Pins OS thread during blocking ops
        jdbcTemplate.query(...);  // Blocks inside synchronized = carrier thread blocked
    }
}

// ✅ Use ReentrantLock instead for virtual-thread-friendly locking
private final ReentrantLock lock = new ReentrantLock();
public void criticalSection() {
    lock.lock();
    try {
        jdbcTemplate.query(...);  // Virtual thread parks — carrier thread freed
    } finally {
        lock.unlock();
    }
}
```

---

## @Async — Thread Pool Design and Pitfalls

### Custom Thread Pool Executor

The default `@Async` executor is `SimpleAsyncTaskExecutor` — it creates a **new thread per invocation** with no pooling. Always configure a custom executor in production:

```java
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    @Override
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(50);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("async-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }

    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return (ex, method, params) ->
            log.error("Async error in {}: {}", method.getName(), ex.getMessage(), ex);
    }
}
```

### @Async Pitfalls

**1. Exceptions from `void` async methods are silently swallowed without a handler:**

```java
@Async
public void sendEmail(String to) {
    throw new RuntimeException("SMTP failed");
    // ❌ Exception is LOST unless AsyncUncaughtExceptionHandler is configured
}
```

**2. Return type `CompletableFuture` is required to propagate exceptions:**

```java
@Async
public CompletableFuture<String> fetchData() {
    try {
        return CompletableFuture.completedFuture(externalApi.fetch());
    } catch (Exception e) {
        return CompletableFuture.failedFuture(e);  // ✅ Caller can handle it
    }
}
```

**3. SecurityContext is NOT propagated to `@Async` threads by default:**

```java
// ❌ The async thread has no SecurityContext — authentication.getName() returns null
@Async
public void processUserData() {
    String user = SecurityContextHolder.getContext().getAuthentication().getName();
}

// ✅ Fix: configure DelegatingSecurityContextAsyncTaskExecutor
@Bean
public Executor securityAwareAsyncExecutor() {
    return new DelegatingSecurityContextAsyncTaskExecutor(taskExecutor());
}
```

**4. Self-invocation bypasses `@Async`** — same proxy problem as `@Transactional`.

---

## @Retryable — Retry with Spring Retry

```xml
<dependency>
    <groupId>org.springframework.retry</groupId>
    <artifactId>spring-retry</artifactId>
</dependency>
```

```java
@Configuration
@EnableRetry
public class RetryConfig { }

@Service
public class PaymentService {

    @Retryable(
        retryFor = {PaymentGatewayException.class, SocketTimeoutException.class},
        maxAttempts = 3,
        backoff = @Backoff(delay = 500, multiplier = 2, maxDelay = 5000)
    )
    public PaymentResult charge(PaymentRequest request) {
        return gatewayClient.charge(request);
    }

    @Recover
    public PaymentResult fallback(PaymentGatewayException ex, PaymentRequest request) {
        // Called when all retries are exhausted
        log.error("Payment failed after retries: {}", request.getOrderId());
        return PaymentResult.failed("GATEWAY_UNAVAILABLE");
    }
}
```

### Spring Retry vs Resilience4j

| Feature | Spring Retry | Resilience4j |
|---|---|---|
| Retry | ✅ | ✅ |
| Circuit Breaker | ❌ | ✅ |
| Rate Limiter | ❌ | ✅ |
| Bulkhead | ❌ | ✅ |
| Time Limiter | ❌ | ✅ |
| Reactive support | Limited | Native |
| Best for | Simple retry scenarios | Production resilience patterns |

> **Senior recommendation:** Use Resilience4j for production microservices — it covers the full resilience pattern set. Use Spring Retry only if you need quick retry-only behavior.

---

## @Scheduled in Clustered Environments

`@Scheduled` runs on **every node** in a cluster by default. This causes duplicate execution — a dangerous behavior for jobs that modify data, send emails, or trigger payments.

### The Problem

```java
@Scheduled(cron = "0 0 2 * * *")  // Runs at 2 AM
public void generateDailyReport() {
    // ❌ Runs on ALL 5 nodes simultaneously → 5 duplicate reports
}
```

### Fix: ShedLock (Distributed Lock)

```xml
<dependency>
    <groupId>net.javacrumbs.shedlock</groupId>
    <artifactId>shedlock-spring</artifactId>
</dependency>
<dependency>
    <groupId>net.javacrumbs.shedlock</groupId>
    <artifactId>shedlock-provider-jdbc-template</artifactId>
</dependency>
```

```sql
-- Required schema
CREATE TABLE shedlock (
  name       VARCHAR(64)  NOT NULL,
  lock_until TIMESTAMP    NOT NULL,
  locked_at  TIMESTAMP    NOT NULL,
  locked_by  VARCHAR(255) NOT NULL,
  PRIMARY KEY (name)
);
```

```java
@Configuration
@EnableSchedulerLock(defaultLockAtMostFor = "10m")
public class SchedulerConfig {
    @Bean
    public LockProvider lockProvider(DataSource dataSource) {
        return new JdbcTemplateLockProvider(dataSource);
    }
}

@Scheduled(cron = "0 0 2 * * *")
@SchedulerLock(name = "dailyReport", lockAtLeastFor = "5m", lockAtMostFor = "10m")
public void generateDailyReport() {
    // ✅ Only ONE node acquires the lock and runs this — others skip
}
```

## Java Records in Spring Boot

Java 14 introduced **Records** as a concise way to model immutable data carriers. In Spring Boot 3.x (which requires Java 17+), records have become the standard choice for data transfer.

### 1. REST Controllers & DTOs
Records automatically integrate with Jackson for JSON serialization and deserialization. Since they have no setters, they guarantee request and response payloads remain immutable during processing.

```java
public record UserRegistrationRequest(
    @NotBlank String username,
    @Email String email,
    @Size(min = 8) String password
) {}

@RestController
@RequestMapping("/api/users")
public class UserRegistrationController {

    @PostMapping
    public ResponseEntity<Void> register(@Valid @RequestBody UserRegistrationRequest request) {
        // request.username() to access field (no getUsername())
        return ResponseEntity.ok().build();
    }
}
```

### 2. Spring Data JPA Projections
Instead of fetching full managed entities, database read queries can fetch light immutable record projections directly:

```java
public record UserSummary(Long id, String username, String email) {}

public interface UserRepository extends JpaRepository<User, Long> {
    
    // Class-based DTO projection
    List<UserSummary> findByActiveTrue();
    
    // Constructor projection using JPQL
    @Query("SELECT new com.example.dto.UserSummary(u.id, u.username, u.email) FROM User u WHERE u.active = true")
    List<UserSummary> findActiveUserSummaries();
}
```

### 3. Immutable Configuration Properties
In Spring Boot 3.x, `@ConfigurationProperties` supports constructor binding on record types out of the box, removing the need for boilerplate getters/setters or Lomboks.

```java
@ConfigurationProperties(prefix = "app.security")
public record SecurityProperties(
    String jwtSecret,
    Duration tokenValidity,
    List<String> allowedOrigins
) {}
```
To enable this, annotate your configuration with `@ConfigurationPropertiesScan` or `@EnableConfigurationProperties(SecurityProperties.class)`.

---

## Summary

Advanced Spring Boot development requires understanding:

- **Security** — Filter chains, JWT, method-level authorization
- **Reactive** — WebFlux for high-concurrency non-blocking apps
- **Caching** — Abstraction layer with pluggable providers
- **Performance** — Connection pools, JPA tuning, avoiding anti-patterns
- **Observability** — Metrics, tracing, and health indicators
- **Deployment** — Graceful shutdown, layered Docker images, buildpacks
- **Virtual Threads** — Spring Boot 3.2+ Loom integration for blocking I/O at scale
- **Async Safety** — Thread pool design, exception handling, SecurityContext propagation
- **Retry Patterns** — Spring Retry for simple cases, Resilience4j for production resilience
- **Scheduled Job Safety** — ShedLock for cluster-aware scheduling

---

## Advanced Editorial Pass: Advanced Spring Boot Trade-offs

### Core Engineering Tensions
- Throughput vs consistency when combining caching, async execution, and transactional boundaries.
- Fast startup vs comprehensive observability instrumentation.
- Convention speed vs explicit control for long-lived, critical services.

### Common High-Maturity Pitfalls
- Annotation-heavy architecture that hides transactional and retry semantics.
- Performance tuning done without representative traffic models.
- Over-centralized base configuration that blocks service-level autonomy.

### Review Checklist
1. Validate tuning with load profiles that match real latency distributions.
2. Make cross-cutting behavior explicit (retries, timeouts, cache invalidation).
3. Keep advanced defaults documented with rationale and rollback plans.

### Compare Next
- [Spring Boot - Internals & Architecture](./spring-boot-internals.md)
- [Spring Data JPA - Complete Guide](./spring-data-jpa.md)
- [Spring Security - Complete Guide](./spring-security.md)

---

## Interview Questions

### Q: How do you choose between MVC with virtual threads and WebFlux?
**A:** Prefer MVC plus virtual threads for simpler code with high I/O concurrency; choose WebFlux for fully non-blocking end-to-end pipelines.

### Q: What is the most common production mistake with @Async?
**A:** Using default executor settings, leading to uncontrolled thread growth or weak error handling.

### Q: How should retries be designed to avoid cascading failures?
**A:** Combine bounded retries with backoff, jitter, timeout budgets, and circuit breakers.

### Q: What does good graceful shutdown protect against?
**A:** Request loss during rolling deployments and incomplete writes during pod termination.

### Q: Why is cache strategy an architecture decision, not an annotation decision?
**A:** TTL, invalidation, consistency, and failure behavior must align with business correctness, not just performance.

### Q: How do you make observability actionable in advanced Boot services?
**A:** Define SLO-driven metrics, trace critical paths, and correlate logs with trace/span identifiers.

### Q: What is a safe way to introduce virtual threads in an existing service?
**A:** Roll out gradually, profile blocking hotspots, and remove synchronized pinning points before broad enablement.
