---
title: Spring Boot — Advanced Topics
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

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      idle-timeout: 300000
      max-lifetime: 1800000
      connection-timeout: 30000
      leak-detection-threshold: 60000
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
| No connection pool tuning | Connection exhaustion under load | Configure HikariCP appropriately |
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

## Summary

Advanced Spring Boot development requires understanding:

- **Security** — Filter chains, JWT, method-level authorization
- **Reactive** — WebFlux for high-concurrency non-blocking apps
- **Caching** — Abstraction layer with pluggable providers
- **Performance** — Connection pools, JPA tuning, avoiding anti-patterns
- **Observability** — Metrics, tracing, and health indicators
- **Deployment** — Graceful shutdown, layered Docker images, buildpacks