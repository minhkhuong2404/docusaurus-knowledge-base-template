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

### Q27: How do you implement saga pattern for distributed transactions in Spring Boot?

**Choreography-based saga (event-driven):**

```java
// Order Service publishes event
@Service
public class OrderService {

    private final KafkaTemplate<String, OrderEvent> kafka;

    @Transactional
    public Order createOrder(OrderRequest request) {
        Order order = orderRepository.save(new Order(request, Status.PENDING));
        kafka.send("order-events", new OrderCreatedEvent(order.getId(), request));
        return order;
    }

    @KafkaListener(topics = "payment-events")
    public void handlePaymentResult(PaymentEvent event) {
        if (event.isSuccess()) {
            orderRepository.updateStatus(event.getOrderId(), Status.CONFIRMED);
        } else {
            // Compensating transaction
            orderRepository.updateStatus(event.getOrderId(), Status.CANCELLED);
            kafka.send("inventory-events", new ReleaseInventoryEvent(event.getOrderId()));
        }
    }
}
```

**Orchestration-based saga:**

```java
@Service
public class OrderSagaOrchestrator {

    public Order processOrder(OrderRequest request) {
        // Step 1: Create order
        Order order = orderService.createOrder(request);
        try {
            // Step 2: Reserve inventory
            inventoryService.reserve(order);
            // Step 3: Process payment
            paymentService.charge(order);
            // Step 4: Confirm order
            orderService.confirm(order.getId());
        } catch (InventoryException e) {
            orderService.cancel(order.getId()); // Compensate
        } catch (PaymentException e) {
            inventoryService.release(order);    // Compensate step 2
            orderService.cancel(order.getId()); // Compensate step 1
        }
        return order;
    }
}
```

| Approach | Pros | Cons |
|----------|------|------|
| Choreography | Loose coupling, scalable | Hard to track, complex failure handling |
| Orchestration | Centralized logic, easier to understand | Single point of failure, tighter coupling |

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

**Strategies:**

1. **Rolling deployment** — Replace instances one at a time behind a load balancer
2. **Blue-green deployment** — Run two environments, switch traffic atomically
3. **Canary deployment** — Route small percentage of traffic to new version

**Spring Boot requirements:**

```yaml
# Graceful shutdown
server:
  shutdown: graceful
spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s

# Health check for readiness
management:
  endpoint:
    health:
      probes:
        enabled: true
  health:
    livenessstate:
      enabled: true
    readinessstate:
      enabled: true
```

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