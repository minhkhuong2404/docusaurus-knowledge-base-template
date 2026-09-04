---
title: "Spring Boot: Interview Questions"
description: Curated Spring Boot interview questions and answers spanning fundamentals, advanced topics, and real-world production scenarios.
tags: [spring-boot, java, interview-questions, backend]
---

# Spring Boot: Interview Questions

A comprehensive collection of Spring Boot interview questions organized by difficulty level — from scenario-based to advanced and expert topics. Covers auto-configuration, microservices, performance, security, and production concerns.

---

## Level I — Core Concepts

### Q1: What is Spring Boot and how does it differ from Spring Framework?

Spring Boot is an opinionated framework built on top of Spring Framework that simplifies application setup and development. Key differences:

| Aspect | Spring Framework | Spring Boot |
|--------|-----------------|-------------|
| Configuration | Manual (XML/Java) | Auto-configuration |
| Server | External WAR deployment | Embedded server (fat JAR) |
| Dependencies | Manual version management | Starter POMs |
| Boilerplate | Significant | Minimal |
| Production features | Manual setup | Actuator included |

Spring Boot does not replace Spring — it removes the friction of using it.

### Q2: What does `@SpringBootApplication` do?

It is a convenience annotation combining three annotations:

- **`@SpringBootConfiguration`** — Marks the class as a configuration source
- **`@EnableAutoConfiguration`** — Enables Spring Boot's auto-configuration mechanism
- **`@ComponentScan`** — Scans the current package and all sub-packages for Spring components

### Q3: What are Spring Boot Starters?

Starters are curated dependency descriptors that bundle compatible libraries for a specific purpose. Instead of manually specifying dozens of dependencies with compatible versions, you add a single starter.

**Examples:**
- `spring-boot-starter-web` — Web apps with Spring MVC + embedded Tomcat
- `spring-boot-starter-data-jpa` — JPA with Hibernate
- `spring-boot-starter-security` — Spring Security
- `spring-boot-starter-test` — Testing with JUnit 5, Mockito, AssertJ

### Q4: How does Spring Boot Auto-Configuration work?

Spring Boot reads `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` from all JARs on the classpath. Each listed class uses conditional annotations (`@ConditionalOnClass`, `@ConditionalOnMissingBean`, etc.) to decide whether to register beans. If a JDBC driver is on the classpath, a `DataSource` is auto-configured. If you define your own `DataSource` bean, auto-configuration backs off.

### Q5: What is the purpose of Spring Boot Actuator?

Actuator provides production-ready features:

| Endpoint | Purpose |
|----------|---------|
| `/health` | Application health checks |
| `/metrics` | JVM, HTTP, custom metrics |
| `/env` | Environment properties |
| `/beans` | All registered beans |
| `/loggers` | View/change log levels at runtime |
| `/info` | Application info |

It also integrates with monitoring systems like Prometheus, Grafana, and Datadog.

### Q6: What is the difference between `application.properties` and `application.yml`?

Both serve the same purpose — externalized configuration. The difference is syntax:

```properties
# application.properties
server.port=8080
spring.datasource.url=jdbc:mysql://localhost:3306/mydb
```

```yaml
# application.yml
server:
  port: 8080
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mydb
```

YAML is more readable for nested properties. Both support profiles (`application-{profile}.properties/yml`).

---

## Level II — Practical Usage

### Q7: How do you handle different environments in Spring Boot?

Use **Spring Profiles**:

1. Create profile-specific config files: `application-dev.yml`, `application-prod.yml`
2. Activate via command line: `-Dspring.profiles.active=prod`
3. Or via environment variable: `SPRING_PROFILES_ACTIVE=prod`

Beans can also be profile-specific:

```java
@Configuration
@Profile("production")
public class ProdConfig { ... }
```

### Q8: How do you implement exception handling in Spring Boot REST APIs?

Use `@RestControllerAdvice` for global exception handling:

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(404)
            .body(new ErrorResponse(404, ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        List<String> errors = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .toList();
        return ResponseEntity.badRequest()
            .body(new ErrorResponse(400, "Validation failed", errors));
    }
}
```

### Q9: What is the difference between `@Controller` and `@RestController`?

| Annotation | Returns | Response Body |
|------------|---------|---------------|
| `@Controller` | View name (resolved by ViewResolver) | Requires `@ResponseBody` on each method |
| `@RestController` | Direct response body (JSON/XML) | `@ResponseBody` applied automatically |

`@RestController` = `@Controller` + `@ResponseBody`

### Q10: How does Spring Boot handle database migrations?

Spring Boot auto-configures **Flyway** or **Liquibase** when they're on the classpath:

- **Flyway**: SQL-based migrations in `db/migration/` (`V1__Create_table.sql`)
- **Liquibase**: XML/YAML changelogs

Migrations run automatically at startup, ensuring the database schema matches the application version.

### Q11: What is `@ConfigurationProperties` and when should you use it?

`@ConfigurationProperties` binds a group of external properties to a Java object:

```java
@ConfigurationProperties(prefix = "app.mail")
public class MailProperties {
    private String host;
    private int port;
    private String from;
    // getters and setters
}
```

Use it instead of multiple `@Value` annotations when you have related configuration properties. It supports:
- Type-safe binding
- Relaxed naming (`mail-host`, `MAIL_HOST`, `mailHost`)
- Validation with `@Validated`

---

## Level III — Scenario-Based

### Q12: Your Spring Boot application starts slowly. How do you diagnose and fix it?

**Diagnosis:**
1. Enable startup analysis: `--debug` flag or `spring.main.lazy-initialization=true`
2. Use Spring Boot's startup tracing (`ApplicationStartup` with `BufferingApplicationStartup`)
3. Check auto-configuration report for unnecessary configurations
4. Profile with JFR (Java Flight Recorder) or async-profiler

**Common fixes:**

| Cause | Fix |
|-------|-----|
| Too many auto-configurations | Exclude unnecessary ones with `@SpringBootApplication(exclude = ...)` |
| Classpath scanning too broad | Narrow `@ComponentScan` to specific packages |
| Eager initialization of all beans | Use `spring.main.lazy-initialization=true` for dev |
| Flyway migrations on large DB | Baseline migrations, optimize SQL |
| Hibernate DDL auto | Set `spring.jpa.hibernate.ddl-auto=none` in production |

### Q13: You have a REST API that sometimes returns 500 errors under load. How do you investigate?

**Step-by-step approach:**

1. **Check logs** — Look for stack traces, OOM errors, connection pool exhaustion
2. **Monitor metrics** — Check `/actuator/metrics` for `http.server.requests`, `hikaricp.connections.active`
3. **Check connection pool** — Is `hikari.maximum-pool-size` too small?
4. **Check thread pool** — Are all Tomcat threads busy? (`server.tomcat.threads.max`)
5. **Look for N+1 queries** — Enable Hibernate statistics: `hibernate.generate_statistics=true`
6. **Check for memory leaks** — Monitor heap usage with Actuator or JVisualVM
7. **Enable circuit breaker** — Use Resilience4j to prevent cascading failures to downstream services

### Q14: How would you secure a REST API that exposes both public and protected endpoints?

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**", "/actuator/health").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/**").authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        return http.build();
    }
}
```

Key considerations:
- Use **JWT** for stateless authentication
- Apply **method-level security** with `@PreAuthorize` for fine-grained control
- Use **CORS** configuration for frontend/API separation
- Disable CSRF for stateless APIs (no session cookies)
- Rate-limit sensitive endpoints

### Q15: Your application needs to call three external APIs and aggregate results. How do you design this?

**Approach 1: Parallel execution with `CompletableFuture`**

```java
@Service
public class AggregationService {

    @Async
    public CompletableFuture<UserData> fetchUserData(String userId) {
        return CompletableFuture.completedFuture(userClient.getUser(userId));
    }

    @Async
    public CompletableFuture<List<Order>> fetchOrders(String userId) {
        return CompletableFuture.completedFuture(orderClient.getOrders(userId));
    }

    @Async
    public CompletableFuture<PaymentInfo> fetchPayments(String userId) {
        return CompletableFuture.completedFuture(paymentClient.getPayments(userId));
    }

    public AggregatedResponse aggregate(String userId) {
        CompletableFuture<UserData> userFuture = fetchUserData(userId);
        CompletableFuture<List<Order>> ordersFuture = fetchOrders(userId);
        CompletableFuture<PaymentInfo> paymentsFuture = fetchPayments(userId);

        CompletableFuture.allOf(userFuture, ordersFuture, paymentsFuture).join();

        return new AggregatedResponse(
            userFuture.join(), ordersFuture.join(), paymentsFuture.join()
        );
    }
}
```

**Approach 2: Reactive with WebClient**

```java
public Mono<AggregatedResponse> aggregate(String userId) {
    Mono<UserData> user = webClient.get().uri("/users/{id}", userId).retrieve().bodyToMono(UserData.class);
    Mono<List<Order>> orders = webClient.get().uri("/orders?userId={id}", userId).retrieve().bodyToFlux(Order.class).collectList();
    Mono<PaymentInfo> payments = webClient.get().uri("/payments?userId={id}", userId).retrieve().bodyToMono(PaymentInfo.class);

    return Mono.zip(user, orders, payments)
        .map(tuple -> new AggregatedResponse(tuple.getT1(), tuple.getT2(), tuple.getT3()));
}
```

Add **Resilience4j** circuit breakers and timeouts for each external call:

```java
@CircuitBreaker(name = "userService", fallbackMethod = "fallbackUser")
public UserData fetchUser(String userId) { ... }
```

### Q16: How would you implement pagination and sorting for a large dataset?

```java
@GetMapping("/products")
public Page<ProductDTO> getProducts(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "name") String sortBy,
        @RequestParam(defaultValue = "asc") String direction) {

    Sort sort = direction.equalsIgnoreCase("asc")
        ? Sort.by(sortBy).ascending()
        : Sort.by(sortBy).descending();

    Pageable pageable = PageRequest.of(page, size, sort);
    return productRepository.findAll(pageable).map(this::toDTO);
}
```

**Key considerations:**
- Always limit `size` with a maximum (e.g., 100) to prevent huge queries
- Use database-level pagination (Spring Data does this automatically)
- Return `Page<T>` for total count or `Slice<T>` for better performance when total isn't needed
- Add index on the sort column

### Q17: You need to process a CSV file with millions of rows. How do you do this in Spring Boot?

**Use Spring Batch:**

```java
@Configuration
public class CsvBatchConfig {

    @Bean
    public Job importJob(JobRepository jobRepository, Step step) {
        return new JobBuilder("csvImport", jobRepository)
            .start(step)
            .build();
    }

    @Bean
    public Step step(JobRepository jobRepository, PlatformTransactionManager txManager) {
        return new StepBuilder("processStep", jobRepository)
            .<InputRecord, OutputRecord>chunk(1000, txManager)
            .reader(csvReader())
            .processor(recordProcessor())
            .writer(databaseWriter())
            .faultTolerant()
            .skipLimit(100)
            .skip(ParseException.class)
            .build();
    }
}
```

**Why Spring Batch?**
- Chunk-based processing (configurable batch size)
- Built-in restart/retry/skip capabilities
- Transaction management per chunk
- Job monitoring and execution history

---

## Level IV — Advanced

### Q18: How does Spring Boot's auto-configuration ordering work?

Auto-configuration classes are loaded in a specific order:

1. Classes listed first in `AutoConfiguration.imports` have lower priority
2. `@AutoConfigureOrder` sets explicit priority
3. `@AutoConfigureBefore` / `@AutoConfigureAfter` define relative ordering
4. `@ConditionalOnMissingBean` ensures user-defined beans take precedence

**Practical implication:** If you define a `DataSource` bean in your `@Configuration` class, `DataSourceAutoConfiguration` detects it via `@ConditionalOnMissingBean` and skips its own `DataSource` creation.

### Q19: Explain the `@Conditional` family of annotations in depth.

These annotations control whether a bean or configuration class is registered:

| Annotation | Condition |
|------------|-----------|
| `@ConditionalOnClass` | Class is on the classpath |
| `@ConditionalOnMissingClass` | Class is NOT on the classpath |
| `@ConditionalOnBean` | Bean exists in the context |
| `@ConditionalOnMissingBean` | Bean does NOT exist in the context |
| `@ConditionalOnProperty` | Property has a specific value |
| `@ConditionalOnResource` | Resource exists on the classpath |
| `@ConditionalOnWebApplication` | App is a web application |
| `@ConditionalOnExpression` | SpEL expression is true |

**Custom conditional:**

```java
public class OnKubernetesCondition implements Condition {
    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
        return System.getenv("KUBERNETES_SERVICE_HOST") != null;
    }
}

@Configuration
@Conditional(OnKubernetesCondition.class)
public class KubernetesConfig { ... }
```

### Q20: What is the difference between `@Transactional` propagation levels?

| Propagation | Behavior |
|-------------|----------|
| `REQUIRED` (default) | Join existing transaction or create new one |
| `REQUIRES_NEW` | Always create a new transaction, suspend existing |
| `NESTED` | Execute within a nested transaction (savepoint) |
| `SUPPORTS` | Use existing transaction if available, otherwise non-transactional |
| `NOT_SUPPORTED` | Execute non-transactionally, suspend existing |
| `MANDATORY` | Must run within an existing transaction, throw exception if none |
| `NEVER` | Must NOT run within a transaction, throw exception if one exists |

**Common pitfall:** Calling a `@Transactional` method from within the same class bypasses the proxy, so the transaction annotation has no effect. Always call from another bean.

### Q21: How do you implement multi-tenancy in Spring Boot?

**Three strategies:**

| Strategy | Isolation | Complexity | Use Case |
|----------|-----------|-----------|----------|
| **Separate Database** | Highest | High | Regulatory compliance |
| **Shared Database, Separate Schema** | Medium | Medium | Moderate isolation needs |
| **Shared Database, Shared Schema** | Lowest | Low | SaaS with many tenants |

**Shared schema with discriminator column:**

```java
@Entity
@FilterDef(name = "tenantFilter", parameters = @ParamDef(name = "tenantId", type = String.class))
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class Order {
    @Column(name = "tenant_id")
    private String tenantId;
}
```

**Tenant resolution via interceptor:**

```java
@Component
public class TenantInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
                            Object handler) {
        String tenantId = request.getHeader("X-Tenant-ID");
        TenantContext.setCurrentTenant(tenantId);
        return true;
    }
}
```

### Q22: How does Spring Boot handle bean lifecycle and destruction?

**Full bean lifecycle:**

```
1. Instantiation (constructor)
2. Populate properties (dependency injection)
3. BeanNameAware.setBeanName()
4. BeanFactoryAware.setBeanFactory()
5. ApplicationContextAware.setApplicationContext()
6. BeanPostProcessor.postProcessBeforeInitialization()
7. @PostConstruct
8. InitializingBean.afterPropertiesSet()
9. Custom init-method
10. BeanPostProcessor.postProcessAfterInitialization()
--- Bean is ready for use ---
11. @PreDestroy
12. DisposableBean.destroy()
13. Custom destroy-method
```

### Q23: How do you implement API versioning in Spring Boot?

**Four approaches:**

```java
// 1. URI versioning
@GetMapping("/api/v1/users")
public List<UserV1> getUsersV1() { ... }

@GetMapping("/api/v2/users")
public List<UserV2> getUsersV2() { ... }

// 2. Header versioning
@GetMapping(value = "/api/users", headers = "X-API-VERSION=1")
public List<UserV1> getUsersV1() { ... }

// 3. Parameter versioning
@GetMapping(value = "/api/users", params = "version=1")
public List<UserV1> getUsersV1() { ... }

// 4. Content negotiation (Accept header)
@GetMapping(value = "/api/users", produces = "application/vnd.myapp.v1+json")
public List<UserV1> getUsersV1() { ... }
```

| Approach | Pros | Cons |
|----------|------|------|
| URI | Simple, cacheable | URL pollution |
| Header | Clean URLs | Not visible in browser |
| Parameter | Simple | Can clutter query strings |
| Content negotiation | RESTful | Complex for clients |

### Q24: How do you implement rate limiting in Spring Boot?

**Using Bucket4j with Spring Boot:**

```java
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String clientIp = request.getRemoteAddr();
        Bucket bucket = buckets.computeIfAbsent(clientIp, this::createBucket);

        if (bucket.tryConsume(1)) {
            chain.doFilter(request, response);
        } else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.getWriter().write("Rate limit exceeded");
        }
    }

    private Bucket createBucket(String key) {
        return Bucket.builder()
            .addLimit(Bandwidth.classic(100, Refill.intervally(100, Duration.ofMinutes(1))))
            .build();
    }
}
```

**Using Spring Cloud Gateway (for API Gateway):**

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: rate-limited-route
          uri: lb://my-service
          predicates:
            - Path=/api/**
          filters:
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 10
                redis-rate-limiter.burstCapacity: 20
```

---

## Level V — Expert

### Q25: How would you design a Spring Boot application for 10,000+ concurrent users?

**Architecture considerations:**

1. **Stateless design** — No server-side sessions, use JWT
2. **Horizontal scaling** — Multiple instances behind a load balancer
3. **Connection pooling** — Tune HikariCP (`maximumPoolSize` based on `connections = cores * 2 + disk_spindles`)
4. **Caching layers** — Redis for distributed caching, Caffeine for local hot cache
5. **Async processing** — Offload heavy work to message queues (Kafka, RabbitMQ)
6. **Database optimization** — Read replicas, connection pooling, indexed queries
7. **CDN** — Static assets via CDN
8. **Circuit breakers** — Resilience4j for downstream service failures

**Thread pool configuration:**

```yaml
server:
  tomcat:
    threads:
      max: 400
      min-spare: 50
    max-connections: 10000
    accept-count: 200
```

**Or switch to reactive:**

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-webflux</artifactId>
</dependency>
```

WebFlux uses event-loop model — can handle thousands of concurrent connections with few threads.

### Q26: Explain Spring Boot's class loading mechanism for fat JARs.

Spring Boot includes a custom class loader (`LaunchedURLClassLoader`) that can read nested JARs:

```
my-app.jar
├── BOOT-INF/classes/       ← App classes (higher priority)
├── BOOT-INF/lib/           ← Dependency JARs (loaded as nested JARs)
└── org/springframework/boot/loader/
    └── JarLauncher         ← Entry point
```

**Boot sequence:**
1. JVM starts `JarLauncher.main()` (from `MANIFEST.MF`)
2. `JarLauncher` creates `LaunchedURLClassLoader` that understands nested JAR format
3. Loads `BOOT-INF/classes/` first, then `BOOT-INF/lib/*.jar`
4. Delegates to your `@SpringBootApplication` class

This is why you can't run `java -cp my-app.jar com.example.MyApp` — the custom launcher is required.

### Q27: How do you implement the saga pattern for distributed transactions in Spring Boot?

**A:** Avoid blocking distributed transaction protocols (like 2PC). Instead, decompose cross-service workflows into a sequence of local transactions using the **Saga Pattern**. You can implement this in Spring Boot using:
- **Choreography-based Sagas (Event-Driven):** Services listen to and publish events (e.g., via Spring Boot Kafka binders) to trigger subsequent steps.
- **Orchestration-based Sagas (Central Coordinator):** A dedicated controller bean coordinates calls to other services and schedules compensating actions if any steps fail.

For complete structural code examples of both orchestration and choreography sagas, idempotency handling, and the compensating transaction playbook in Spring Boot, see the dedicated [Saga Pattern Guide](../system-design/saga-pattern.md).

### Q28: How do you implement CQRS in Spring Boot?

**Command Query Responsibility Segregation** separates read and write models:

```java
// Command side — writes
@Service
public class OrderCommandService {

    private final OrderRepository writeRepo;
    private final ApplicationEventPublisher events;

    @Transactional
    public void createOrder(CreateOrderCommand command) {
        Order order = Order.create(command);
        writeRepo.save(order);
        events.publishEvent(new OrderCreatedEvent(order));
    }
}

// Query side — reads (can use different data model, even different database)
@Service
public class OrderQueryService {

    private final OrderReadRepository readRepo; // Optimized for queries

    public OrderView findOrder(String orderId) {
        return readRepo.findById(orderId)
            .orElseThrow(() -> new OrderNotFoundException(orderId));
    }

    public Page<OrderSummary> searchOrders(OrderSearchCriteria criteria, Pageable pageable) {
        return readRepo.search(criteria, pageable);
    }
}

// Event handler syncs read model
@Component
public class OrderProjection {

    @EventListener
    @Async
    public void on(OrderCreatedEvent event) {
        // Update read-optimized view/table
        readRepo.save(OrderView.from(event));
    }
}
```

### Q29: How do you handle zero-downtime deployments with Spring Boot?

**Deployment Strategies:**

1. **Rolling Update** — Replace Pods incrementally (`maxUnavailable: 0`, `maxSurge: 25%`) behind a Service/Ingress.
2. **Blue-Green Deployment** — Spin up an identical green cluster and swap router/DNS atomically.
3. **Canary Deployment** — Route $5\% \to 20\% \to 100\%$ traffic to the new version based on automated metric analysis.

**The Distributed Race Condition (Root Cause of 502/504 Errors):**
During rolling updates or HPA scale-in, two independent paths run asynchronously:
- **Distributed Network Plane:** API Server removes Pod IP from `EndpointSlice` $\to$ Ingress (Nginx/Envoy) & `kube-proxy` update iptables/IPVS across worker nodes (takes $2 - 5\text{ seconds}$).
- **Pod Container Plane:** Kubelet sends `SIGTERM` $\to$ Embedded Tomcat shuts down listening socket in $<300\text{ms}$.
- **The Gap:** For $2 - 5\text{s}$, Ingress still forwards incoming traffic to the closed socket, generating intermittent `HTTP 502 Bad Gateway` or `Connection Reset by Peer`.

**The Two-Layer Production Solution:**

```yaml
# Layer 1: Spring Boot application.yml
server:
  shutdown: graceful # Closes socket, permits in-flight requests to complete
spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s # Max wait time for active transactions/queries
```

```yaml
# Layer 2: Kubernetes Deployment Pod Spec
spec:
  # Formula: terminationGracePeriodSeconds > preStop sleep + timeout-per-shutdown-phase + buffer
  terminationGracePeriodSeconds: 45
  containers:
    - name: app
      lifecycle:
        preStop:
          exec:
            # Deliberate 10s sleep gives Ingress/iptables ample time to drain Pod IP
            command: ["/bin/sh", "-c", "sleep 10"]
```

**Senior Operational Traps to Avoid:**
1. **Docker PID 1 Signal Drop:** Never use Shell Form (`ENTRYPOINT java -jar app.jar`), which starts `/bin/sh` as PID 1 (which drops `SIGTERM`). Always use Exec Form (`ENTRYPOINT ["java", "-jar", "app.jar"]`).
2. **Grace Period Under-Sizing:** If `terminationGracePeriodSeconds` is less than `preStop sleep + timeout-per-shutdown-phase`, K8s forcibly kills the JVM with `SIGKILL` (`kill -9`) before database transactions finish.
3. **Async & Kafka Pools:** Configure `ThreadPoolTaskExecutor.setWaitForTasksToCompleteOnShutdown(true)` and Kafka listener `setShutdownTimeout(15000)` to prevent message corruption or consumer group rebalance storms.

*Detailed architectural breakdown and interactive simulation:* [Zero-Downtime Graceful Shutdown: Kubernetes & Spring Boot 3.x](./kubernetes-graceful-shutdown-zero-downtime.md).

**Database migration compatibility:**
- Migrations must be **backward-compatible** (old code runs with new schema)
- Add columns (nullable or with defaults), never remove in the same release
- Use expand-and-contract pattern for breaking schema changes

### Q30: How do you build a custom Spring Boot Starter?

**Step-by-step:**

1. **Create the autoconfigure module:**

```java
@AutoConfiguration
@ConditionalOnClass(NotificationService.class)
@EnableConfigurationProperties(NotificationProperties.class)
public class NotificationAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnProperty(prefix = "notification", name = "enabled", havingValue = "true", matchIfMissing = true)
    public NotificationService notificationService(NotificationProperties props) {
        return new NotificationService(props.getProvider(), props.getApiKey());
    }
}
```

2. **Create the properties class:**

```java
@ConfigurationProperties(prefix = "notification")
public class NotificationProperties {
    private boolean enabled = true;
    private String provider = "email";
    private String apiKey;
    // getters and setters
}
```

3. **Register in `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`:**

```
com.example.notification.NotificationAutoConfiguration
```

4. **Create the starter POM** (depends on autoconfigure module + actual library)

Users then simply add your starter and configure via `application.yml`:

```yaml
notification:
  enabled: true
  provider: slack
  api-key: ${SLACK_API_KEY}
```

---

## Rapid-Fire Questions

### Q31: What is `spring.jpa.open-in-view` and should you disable it?

OSIV (Open Session in View) keeps the Hibernate session open through the entire HTTP request, allowing lazy-loaded entities to be fetched in the view layer. **Disable it** (`false`) because it holds database connections longer than necessary and hides N+1 query issues. Fetch everything you need in the service layer instead.

### Q32: What is the difference between `@Component`, `@Service`, `@Repository`, and `@Controller`?

All are specializations of `@Component` and register beans via component scanning. The differences are semantic:

| Annotation | Semantic Meaning | Extra Behavior |
|------------|-----------------|----------------|
| `@Component` | Generic bean | None |
| `@Service` | Business logic | None (documentation only) |
| `@Repository` | Data access layer | Exception translation (SQL → Spring exceptions) |
| `@Controller` | Web controller | Request mapping support |

### Q33: How does Spring Boot decide which embedded server to use?

It checks the classpath in this order:
1. If Tomcat classes are present → Tomcat (default, included in `starter-web`)
2. If Jetty classes are present → Jetty
3. If Undertow classes are present → Undertow

If multiple are present, Tomcat wins unless explicitly excluded.

### Q34: What happens if two beans of the same type exist?

Spring throws `NoUniqueBeanDefinitionException`. Resolve with:
- `@Primary` — marks one bean as the default
- `@Qualifier("beanName")` — specifies exactly which bean to inject
- `@ConditionalOnMissingBean` — prevents creation if one already exists

### Q35: What is the difference between `CommandLineRunner` and `ApplicationRunner`?

Both run after the application context is ready:

| Interface | Argument Type | Use Case |
|-----------|--------------|----------|
| `CommandLineRunner` | `String... args` (raw) | Simple CLI arg processing |
| `ApplicationRunner` | `ApplicationArguments` (parsed) | Named/optional arg support |

### Q36: How do you test a Spring Boot application?

| Annotation | What It Does |
|------------|-------------|
| `@SpringBootTest` | Loads full application context |
| `@WebMvcTest` | Loads only web layer (controllers) |
| `@DataJpaTest` | Loads only JPA components (repositories) |
| `@MockBean` | Replaces a bean with a Mockito mock |
| `@TestPropertySource` | Override properties for tests |

```java
@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Test
    void shouldReturnUser() throws Exception {
        when(userService.findById(1L)).thenReturn(new User(1L, "John"));

        mockMvc.perform(get("/api/users/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("John"));
    }
}
```

### Q37: What is Spring Boot's relaxed binding?

Spring Boot maps properties using relaxed rules:

| Format | Example |
|--------|---------|
| Kebab | `my-app.api-key` |
| Camel | `myApp.apiKey` |
| Underscore | `my_app.api_key` |
| Upper case | `MY_APP_API_KEY` |

All map to the same Java field `apiKey`. This is useful because environment variables use `UPPER_SNAKE_CASE` while YAML uses `kebab-case`.

### Q38: How do you implement health checks for downstream dependencies?

```java
@Component
public class DatabaseHealthIndicator implements HealthIndicator {

    private final DataSource dataSource;

    @Override
    public Health health() {
        try (Connection conn = dataSource.getConnection()) {
            return Health.up()
                .withDetail("database", "reachable")
                .build();
        } catch (SQLException e) {
            return Health.down()
                .withDetail("database", "unreachable")
                .withException(e)
                .build();
        }
    }
}
```

Spring Boot includes built-in health indicators for common dependencies (DB, Redis, Elasticsearch, etc.) that activate automatically when those dependencies are on the classpath.

---

## Level VI — Expert (Senior Interview Questions)

### Q39: Why does calling `@Transactional` method from within the same class not start a transaction?

Spring implements `@Transactional` using **AOP proxies**. When code outside the class calls `service.placeOrder()`, it hits the proxy, which opens a transaction. But when `placeOrder()` internally calls `this.sendConfirmation()`, it bypasses the proxy — calling the raw object directly. The proxy never intercepts the call, so `@Transactional` on `sendConfirmation()` is silently ignored.

**Fix:** Extract to a separate bean, or inject `self` to force the call through the proxy.

```java
// This correctly forces the call through the proxy
@Service
public class OrderService {
    @Autowired private OrderService self;  // inject proxy of itself

    public void placeOrder(Order order) {
        self.sendConfirmation(order);  // goes through proxy ✅
    }
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void sendConfirmation(Order order) { ... }
}
```

### Q40: What is the difference between `BeanPostProcessor` and `BeanFactoryPostProcessor`? When would you use each?

| | `BeanFactoryPostProcessor` | `BeanPostProcessor` |
|---|---|---|
| Runs | Before any beans are instantiated | After each bean instance is created |
| Modifies | Bean **definitions** (metadata) | Bean **instances** |
| Example use | Resolve `${...}` placeholders | Wrap beans in AOP proxies |
| Risk | Calling `getBean()` causes premature init | Must be defined as early as possible |

`PropertySourcesPlaceholderConfigurer` is a `BeanFactoryPostProcessor` — it resolves properties before any bean is created. Spring's AOP mechanism uses `BeanPostProcessor` to replace beans with proxies after creation.

### Q41: What are the trade-offs of virtual threads (Project Loom) in Spring Boot 3.2+?

```yaml
spring:
  threads:
    virtual:
      enabled: true
```

**Benefits:** Thousands of concurrent requests with far fewer OS threads; existing blocking code works as-is; no refactoring to reactive.

**Trade-offs and pitfalls:**
- `synchronized` blocks **pin** the carrier OS thread — blocks the entire JVM thread-by-thread advantage. Migrate to `ReentrantLock`.
- Third-party libraries (HikariCP, Redis clients) with internal `synchronized` can pin threads — monitor with JFR.
- No benefit for CPU-bound work — only I/O-bound operations gain.
- Thread-local caching assumptions may break at scale (99,999 virtual threads can share thread-locals wastefully).

### Q42: What constraints does GraalVM Native Image impose on Spring Boot applications?

GraalVM Native Image compiles the app at build time, eliminating the JVM at runtime. This imposes:

| Constraint | Why | Spring Boot Mitigation |
|---|---|---|
| No runtime classpath scanning | Reflection must be registered at build time | `@RegisterReflectionForBinding`, `reflect-config.json` |
| No dynamic proxy generation at runtime | CGLIB proxies pre-generated at build time | Spring AOT processes these |
| No lazy initialization | All beans must be resolvable at build time | Spring AOT hints track them |
| Slower build time | Everything compiled upfront | GraalVM build plugins |

**Build:**
```bash
./mvnw -Pnative spring-boot:build-image  # Cloud-native buildpacks + GraalVM
```

**When to use:** Serverless functions, CLI tools, or anything requiring fast startup + low memory. Not ideal for large monoliths with heavy ORM usage.

### Q43: How does `@Scheduled` behave in a multi-instance deployment, and how do you fix it?

By default, `@Scheduled` runs on **every JVM instance**. In a 5-node cluster running a `@Scheduled` job at midnight, all 5 nodes execute it simultaneously — causing data duplication, double-sends, or conflicts.

**Fix with ShedLock:**
```java
@Scheduled(cron = "0 0 0 * * *")
@SchedulerLock(name = "midnightJob", lockAtLeastFor = "5m", lockAtMostFor = "30m")
public void midnightJob() { ... }  // Only 1 node acquires the DB lock
```

**Alternative:** Use a dedicated scheduler (Quartz clustered, AWS EventBridge, Kubernetes CronJob) for critical single-execution jobs.

### Q44: Explain how Spring Boot's auto-configuration ordering works. How do you control it?

Auto-configuration classes are all loaded from `AutoConfiguration.imports`. Their ordering is controlled by:

1. **`@AutoConfigureOrder(n)`** — explicit numeric priority (lower = earlier)
2. **`@AutoConfigureAfter(X.class)`** — load after specific auto-config
3. **`@AutoConfigureBefore(X.class)`** — load before specific auto-config
4. **`@ConditionalOnMissingBean`** — user-defined beans take precedence; auto-config backs off

**Practical example:** Writing a custom starter that should run after `DataSourceAutoConfiguration` but before `JpaAutoConfiguration`:

```java
@AutoConfiguration
@AutoConfigureAfter(DataSourceAutoConfiguration.class)
@AutoConfigureBefore(JpaAutoConfiguration.class)
public class MyCustomDatabaseConfig {
    @Bean
    @ConditionalOnMissingBean
    public CustomDatabaseInterceptor interceptor(DataSource ds) { ... }
}
```

### Q45: How do you propagate `SecurityContext` to `@Async` threads? What pitfalls exist?

By default, `SecurityContextHolder` is `ThreadLocal` — Spring Security context lost on `@Async` execution. Three solutions:

1. **`DelegatingSecurityContextAsyncTaskExecutor`** (recommended) — wraps the thread pool, copies context per task
2. **`MODE_INHERITABLETHREADLOCAL`** — uses Java's `InheritableThreadLocal`, but reused pooled threads carry stale context
3. **Explicit pass-through** — pass `Authentication` as a method parameter

The cleanest production pattern:
```java
@Override
public Executor getAsyncExecutor() {
    return new DelegatingSecurityContextAsyncTaskExecutor(
        new ThreadPoolTaskExecutor() {{ setCorePoolSize(10); initialize(); }}
    );
}
```

### Q46: Design a custom `HealthIndicator` for a business-critical dependency. What should it check?

```java
@Component
public class PaymentGatewayHealthIndicator implements HealthIndicator {

    private final PaymentGatewayClient client;

    @Override
    public Health health() {
        try {
            // ✅ Check actual connectivity (ping endpoint, not just config)
            GatewayStatus status = client.ping();

            if (status.isUp()) {
                return Health.up()
                    .withDetail("gateway", status.getVersion())
                    .withDetail("latencyMs", status.getLatencyMs())
                    .build();
            }
            return Health.down()
                .withDetail("reason", status.getErrorMessage())
                .build();
        } catch (Exception e) {
            return Health.down(e)
                .withDetail("gateway", "unreachable")
                .build();
        }
    }
}
```

**What a strong health check verifies:**
- Network reachability (not just config existence)
- Authentication success (not just connectivity)
- Response < timeout threshold
- Exposed via `/actuator/health/paymentGateway`

**Configuration:**
```yaml
management:
  endpoint:
    health:
      show-details: when-authorized
      group:
        readiness:
          include: db, paymentGateway, redis
```

---

### Q47: In what order do Spring AOP aspects execute when a service method has `@PreAuthorize`, `@Transactional`, `@Cacheable`, and a custom logging aspect?

Order is controlled by `@Order` on each aspect (lower = outermost proxy). Spring's built-in aspect orders:

```
@PreAuthorize / Method Security → [custom aspects] → @Cacheable → @Transactional → @Validated
(outermost)                                                                          (innermost)
```

In practice, the default execution order for a service method call is:

```
External call
→ [1] Spring Security MethodSecurityInterceptor (@PreAuthorize) — throws 403 before any work
  → [2] Custom LoggingAspect @Order(2) — MDC setup, start timer
    → [3] @Cacheable aspect — return cached value or continue
      → [4] @Transactional aspect (Integer.MAX_VALUE - 1) — open transaction
        → target method executes
      ← commit or rollback
    ← write to cache on success
  ← stop timer, clear MDC
← security check done
```

**Critical implication:** If the logging aspect is **outside** the transaction aspect, a log entry written in `@AfterReturning` will appear **even if the transaction rolled back** — because the log happened outside the transaction boundary. Always use `@Order` explicitly on custom aspects.

---

### Q48: When would you choose a custom `@Aspect` over Spring Security's `@PreAuthorize` for access control?

| Scenario | Use `@PreAuthorize` | Use Custom `@Aspect` |
|----------|--------------------|-----------------------|
| Role/permission check | ✅ Standard, concise | Overkill |
| Row-level access (check owner) | ✅ SpEL `#entity.ownerId == principal.id` | If complex logic needed |
| Multi-system access check (external API, DB, cache) | ❌ SpEL can't call remote | ✅ Full Java logic |
| Audit trail required | ❌ No built-in persistence | ✅ Can persist to DB in aspect |
| Complex conditional logic | Cumbersome in SpEL | ✅ Readable Java code |

**Custom audit security aspect pattern:**

```java
@Around("@annotation(sensitiveOp)")
public Object auditSensitiveOperation(ProceedingJoinPoint pjp, SensitiveOperation sensitiveOp) throws Throwable {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    // Log who, what, when — BEFORE calling the method
    auditRepo.save(AuditEntry.builder()
        .user(auth.getName())
        .action(sensitiveOp.action())
        .resource(pjp.getArgs()[0].toString())
        .build());
    return pjp.proceed();
}
```

Note: If you save the audit entry **inside** the same transaction as the business operation and the transaction rolls back, the audit log is ALSO lost. Fix: use `@Transactional(propagation = REQUIRES_NEW)` inside the aspect to save audit in a separate transaction.

---

### Q49: MDC context is lost in `@Async` methods. How do you fix it?

`MDC` uses `ThreadLocal` storage. When `@Async` spawns a new thread from the executor pool, the new thread has NO MDC context — the trace ID, request ID, and user info are all lost.

**Fix 1: TaskDecorator on the async executor:**

```java
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    @Override
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(50);
        // TaskDecorator: wrap each task with MDC propagation
        executor.setTaskDecorator(runnable -> {
            Map<String, String> contextMap = MDC.getCopyOfContextMap();
            return () -> {
                try {
                    if (contextMap != null) MDC.setContextMap(contextMap);
                    runnable.run();
                } finally {
                    MDC.clear();  // Always clean up
                }
            };
        });
        executor.initialize();
        return executor;
    }
}
```

**Fix 2: SecurityContext propagation for `@Async` + Spring Security:**

```java
// Spring Security's SecurityContext is also ThreadLocal
// Fix: configure DelegatingSecurityContextExecutor
@Bean
public Executor asyncExecutor() {
    Executor delegate = new ThreadPoolTaskExecutor();
    // Wraps each task to copy SecurityContext as well as MDC
    return new DelegatingSecurityContextExecutor(delegate,
        SecurityContextHolder.getContext());
}
```

Without this fix, `Authentication` is `null` inside `@Async` methods — causing `NullPointerException` when calling `SecurityContextHolder.getContext().getAuthentication()`.

---

### Q50: `@CacheEvict` runs but the cache still returns stale data after a failed transaction. Why?

**Root cause:** `@CacheEvict` defaults to `beforeInvocation = false` — meaning it runs **after** the method returns. If the method is also `@Transactional`, the cache is evicted, but the transaction later **rolls back** → the database still has the old data → the cache is empty → next request refills cache from DB with rolled-back (old) value. Now cache is consistent again.

But the real problem occurs when:

```java
@CacheEvict(value = "products", key = "#product.id")
@Transactional
public void updateProduct(Product product) {
    productRepository.save(product);
    // If an exception here causes rollback...
    // cache was already evicted (the eviction ran after save but before rollback committed)
    // Next cache fetch gets OLD data from DB → cache filled with stale data
}
```

**Fix options:**

```java
// Option 1: beforeInvocation = true — evict before any logic runs
// Safer: cache is evicted regardless of transaction outcome
@CacheEvict(value = "products", key = "#product.id", beforeInvocation = true)
@Transactional
public void updateProduct(Product product) { ... }

// Option 2: Use a TransactionSynchronizationAdapter to evict AFTER commit
@Transactional
public void updateProduct(Product product) {
    productRepository.save(product);
    Long id = product.getId();
    TransactionSynchronizationManager.registerSynchronization(
        new TransactionSynchronizationAdapter() {
            @Override
            public void afterCommit() {
                cacheManager.getCache("products").evict(id);  // Only evicts on TX commit
            }
        });
}
```

Option 2 is the correct production approach — cache only evicted when the database transaction successfully commits.

---

### Q51: Design a custom `@Auditable` annotation and AOP aspect for production use. What edge cases must you handle?

**Production-worthy implementation:**

```java
// Annotation
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Auditable {
    String action();               // e.g., "USER_LOGIN", "ORDER_CANCEL"
    boolean captureArgs() default false;  // careful with PII
    boolean captureResult() default false;
}

// Aspect
@Aspect
@Component
@Order(2)  // After security, before transaction (so audit is in same TX as business op)
public class AuditableAspect {

    private final AuditService auditService;

    @Around("@annotation(auditable)")
    public Object audit(ProceedingJoinPoint pjp, Auditable auditable) throws Throwable {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = (auth != null) ? auth.getName() : "anonymous";

        AuditRecord record = AuditRecord.builder()
            .action(auditable.action())
            .username(username)
            .traceId(MDC.get("traceId"))
            .method(pjp.getSignature().toShortString())
            .args(auditable.captureArgs() ? sanitize(pjp.getArgs()) : null)
            .timestamp(Instant.now())
            .build();

        try {
            Object result = pjp.proceed();
            record.setOutcome("SUCCESS");
            if (auditable.captureResult()) record.setResult(sanitize(result));
            return result;
        } catch (AccessDeniedException e) {
            record.setOutcome("ACCESS_DENIED");
            throw e;
        } catch (Exception e) {
            record.setOutcome("FAILURE: " + e.getClass().getSimpleName());
            throw e;
        } finally {
            // Save ALWAYS — success or failure — in a separate transaction to avoid rollback
            auditService.saveAsync(record);
        }
    }
}
```

**Edge cases to handle in production:**

| Edge case | Problem | Solution |
|---|---|---|
| Transaction rollback | Audit entry lost | Save audit in separate `REQUIRES_NEW` transaction or async |
| PII in method args | GDPR violation | `captureArgs = false` by default; `sanitize()` removes sensitive fields |
| High throughput | Audit DB write is on critical path | async save via `@Async` or Kafka |
| Null authentication | Pre-auth or system task | Null check, default to "system" user |
| Exception from audit | Breaks business operation | Wrap audit save in try-catch; don't let audit fail business logic |

---

### Q31: How do you enable Virtual Threads in Spring Boot 3.2+ and what is the "Carrier Thread Pinning" trap?

**How to Enable:**
In Spring Boot 3.2+ with Java 21, simply add this configuration property:
```yaml
spring:
  threads:
    virtual:
      enabled: true
```
This automatically configures Tomcat, Jetty, and default task executors (like the `@Async` executor) to run tasks on Virtual Threads instead of traditional Platform Threads.

**The "Carrier Thread Pinning" Trap:**
- Virtual Threads run on top of actual OS-level Platform Threads (called **Carrier Threads**). 
- When a virtual thread encounters a blocking operation (like I/O or sleep), it yields control, allowing the carrier thread to execute other virtual threads.
- However, if the virtual thread blocks inside a **`synchronized` block or method**, or calls native code, it is **"pinned"** to the carrier thread. The carrier thread cannot be released, blocking all other virtual threads waiting on that platform thread.
- **How to prevent:** Avoid using `synchronized` blocks inside hot paths or blocking operations. Replace them with **`java.util.concurrent.locks.ReentrantLock`**, which allows virtual threads to yield control correctly when blocking.

### Q32: What is the default rollback behavior of Spring's `@Transactional` for checked vs. unchecked exceptions, and how do you customize it?

**Default Behavior:**
- Spring's transactional system **only rolls back transactions automatically for Unchecked Exceptions** (subclasses of `RuntimeException` and `Error` like `NullPointerException` or `IllegalArgumentException`).
- Transactions **do not roll back automatically for Checked Exceptions** (subclasses of `Exception` that require a `try-catch` or `throws` declaration, like `IOException` or `SQLException`). The transaction will still commit even if the checked exception propagates out of the method.

**How to Customize:**
To force Spring to roll back the transaction when a checked exception occurs, use the `rollbackFor` attribute:
```java
@Transactional(rollbackFor = Exception.class)
public void processPayment() throws IOException {
    // Both checked and unchecked exceptions will trigger a rollback
}
```
You can also prevent rollbacks for specific runtime exceptions using `noRollbackFor`.

### Q33: Why does calling a method annotated with `@Transactional` or `@Async` from another method in the same class fail to create a transaction or run asynchronously?

**The Cause:**
Spring applies behavior like transactions and asynchronous execution by wrapping your beans in **Proxy Objects** (usually CGLIB proxies). 
- When an external client calls a method on your bean, it actually invokes it on the proxy wrapper. The proxy starts the transaction or offloads the task to a thread pool *before* delegating the call to your actual bean.
- When you invoke a method **internally** from another method within the same class (e.g. `this.doSomething()`), the call bypasses the proxy entirely and executes directly on the target object. Consequently, any annotations on the called method are completely ignored.

**The Solutions:**
1. **Separate Beans (Recommended):** Move the annotated method to a dedicated collaborator class.
2. **Self-Injection:** Injected the service into itself (using `@Lazy` to avoid circular dependency errors) and call the method on the injected self-reference.
3. **`AopContext.currentProxy()`:** Call `((MyService) AopContext.currentProxy()).myMethod()`, which requires `@EnableAspectJAutoProxy(exposeProxy = true)`.

---

## Advanced Editorial Pass: Interview Readiness with Production Depth

### How to Level Up Answers
- Move from definitions to operational consequences and failure recovery paths.
- Explain not only what a feature does, but what can break under scale.
- Use concrete stories: incident, diagnosis, mitigation, and long-term fix.

### Signals of a Strong Answer
- Clear trade-offs (latency, consistency, complexity, cost).
- Explicit boundaries between framework behavior and team-owned logic.
- Measurable outcomes and observability strategy.

### Practice Drills
1. Re-answer each question with one real failure mode and one mitigation.
2. Add metrics you would monitor before and after the design choice.
3. Time-box explanations to 90 seconds while preserving technical depth.

### Compare Next
- [Spring Interview Questions](./spring-interview-questions.md)
- [Spring Boot - Internals & Architecture](./spring-boot-internals.md)
- [Spring Boot - Advanced Topics](./spring-boot-advanced.md)
