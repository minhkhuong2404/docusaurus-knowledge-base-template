---
title: Spring Boot — Overview & Why It Matters
description: Overview of Spring Boot, its core benefits, and why it is widely used for modern Java backend and microservice development.
tags: [spring-boot, java, backend, microservices]
---
import SpringBootFeaturesDiagram from '@site/src/components/SpringBootFeaturesDiagram';
import SpringBootStartupTimelineDiagram from '@site/src/components/SpringBootStartupTimelineDiagram';
import SpringBootLayeredArchitectureDiagram from '@site/src/components/SpringBootLayeredArchitectureDiagram';
import SpringBootHexagonalArchitectureDiagram from '@site/src/components/SpringBootHexagonalArchitectureDiagram';
import SpringProjectsRelationshipDiagram from '@site/src/components/SpringProjectsRelationshipDiagram';
import SpringBootPackageStructureDiagram from '@site/src/components/SpringBootPackageStructureDiagram';



# Spring Boot — Overview & Why It Matters

Spring Boot makes it easy to create stand-alone, production-grade Spring-based applications with minimal configuration. It is the de-facto standard for building Java microservices and web applications.

---

## What Is Spring Boot?

Spring Boot is an **opinionated framework** built on top of the Spring Framework. It eliminates most of the boilerplate configuration that Spring applications traditionally require, letting developers focus on business logic instead of infrastructure plumbing.

**Key idea:** Convention over configuration — sensible defaults are provided out of the box, and you only override what you need.

#### 👶 Beginner Concept: The "Meal Kit" Analogy
If building a backend is like making Lasagna:
- **Raw Spring Framework:** You go to the grocery store, grab flour, tomatoes, cheese, ground beef, pan, and an oven. You measure everything yourself entirely from scratch. You even build the oven (the Tomcat web server).
- **Spring Boot:** You sign up for HelloFresh (a meal kit). A box arrives with perfectly measured ingredients, a pre-heated pan, and an oven already running on your counter. You just combine the specific ingredients you want, throw away what you don't, and hit "Bake".

You don't lose any control of the recipe (you can still add your own spices). Spring Boot just assumes you don't want to spend 3 hours building an oven every time you want dinner.

---

## 🎯 Why Should I Care?

### For Beginners: From Zero to Running API in 5 Minutes

Without Spring Boot, building a simple REST API in Java requires:
1. Create a Maven/Gradle project manually
2. Add 15+ dependencies (Spring MVC, Jackson, Tomcat, logging, etc.) and manage their version compatibility
3. Write an XML configuration file (or multiple Java config classes) for component scanning, view resolvers, message converters
4. Configure a `web.xml` deployment descriptor
5. Set up an external Tomcat server, build a WAR file, deploy it
6. Write a `DispatcherServlet` configuration
7. *Then* start writing your actual controller

With Spring Boot:
1. Go to [start.spring.io](https://start.spring.io), check "Spring Web", download
2. Write your controller
3. Run `./mvnw spring-boot:run`

**That's it.** Everything else is auto-configured.

### For Intermediate Developers: The Ecosystem Multiplier

Spring Boot isn't just about saving setup time — it's the **gateway to the entire Spring ecosystem**:

```
spring-boot-starter-web        → REST APIs, MVC
spring-boot-starter-data-jpa   → Database access with JPA/Hibernate
spring-boot-starter-security   → Authentication & authorization
spring-boot-starter-actuator   → Production monitoring
spring-boot-starter-cache      → Caching abstraction (Redis, Caffeine)
spring-boot-starter-amqp       → RabbitMQ messaging
spring-boot-starter-webflux    → Reactive programming
spring-cloud-starter-*         → Service discovery, config server, circuit breakers
```

Each starter is a **pre-tested, version-compatible package**. You never deal with dependency hell — Spring Boot's BOM (Bill of Materials) ensures everything works together.

### For Senior Engineers: Why Boot Won the Java Market

Spring Boot dominates Java backend development for structural reasons:

| Factor | Impact |
|---|---|
| **Fat JAR deployment** | Eliminated the WAR/application server complexity that plagued Java EE |
| **12-Factor App alignment** | Externalized config, stateless processes, port binding — cloud-native by design |
| **Docker/K8s native** | Single `java -jar` command → perfect for containers |
| **Actuator** | Health checks, metrics, and readiness probes built-in → production-ready from day 1 |
| **Auto-configuration** | Massively reduced onboarding time for new team members |
| **Spring Initializr** | Standardized project structure across the industry |

Before Spring Boot (2013), Java web development was losing ground to Node.js, Ruby on Rails, and Django because of setup complexity. Spring Boot reversed that trend entirely.

---

## Why Use Spring Boot?

### Problems It Solves

| Problem with Raw Spring | How Spring Boot Fixes It |
|-------------------------|--------------------------| 
| Extensive XML or Java configuration | Auto-configuration infers settings from the classpath |
| Manual dependency management | Starter POMs bundle compatible dependencies |
| Embedded server setup is complex | Embedded Tomcat/Jetty/Undertow with zero config |
| Deploying WAR files to external servers | Produces runnable fat JARs |
| No standard project structure | Spring Initializr generates a ready-to-go scaffold |
| Production monitoring is an afterthought | Actuator endpoints included for health, metrics, etc. |

### Core Benefits

1. **Rapid Development** — `spring-boot-starter-*` dependencies pull in everything you need. A REST API can be up in minutes.
2. **Auto-Configuration** — `@EnableAutoConfiguration` (included in `@SpringBootApplication`) scans the classpath and configures beans automatically.
3. **Embedded Server** — No need for an external application server. The app starts with `java -jar`.
4. **Production-Ready** — Actuator provides health checks, metrics, environment info, and HTTP trace out of the box.
5. **Opinionated Defaults** — Sensible defaults reduce decision fatigue while remaining fully overridable.
6. **Microservice-Friendly** — Lightweight, self-contained JARs are ideal for containerized deployments (Docker, Kubernetes).

---

## How Does Spring Boot Help Development?

### 1. Starter Dependencies

Starters are curated dependency descriptors. Instead of hunting for compatible library versions, you declare a single starter:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

This pulls in Spring MVC, Jackson, embedded Tomcat, and validation — all in compatible versions managed by the Spring Boot BOM.

**Common starters:**

| Starter | What It Provides |
|---------|-----------------| 
| `spring-boot-starter-web` | REST/MVC, embedded Tomcat, Jackson |
| `spring-boot-starter-data-jpa` | JPA, Hibernate, Spring Data |
| `spring-boot-starter-security` | Spring Security defaults |
| `spring-boot-starter-test` | JUnit 5, Mockito, AssertJ, MockMvc |
| `spring-boot-starter-actuator` | Health, metrics, info endpoints |
| `spring-boot-starter-validation` | Bean Validation (Hibernate Validator) |
| `spring-boot-starter-cache` | Cache abstraction |
| `spring-boot-starter-amqp` | RabbitMQ integration |

### 2. Auto-Configuration

Spring Boot examines the classpath at startup and automatically configures beans:

- `DataSource` if H2/MySQL/PostgreSQL driver is detected
- `EntityManagerFactory` if JPA is on the classpath
- `DispatcherServlet` if Spring MVC is present
- `SecurityFilterChain` if Spring Security is present

You can inspect what was auto-configured:

```
--debug
```

Or in `application.properties`:

```properties
debug=true
```

#### How Auto-Configuration Actually Works

```java
// A simplified view of how DataSource auto-configuration works
@AutoConfiguration
@ConditionalOnClass(DataSource.class)  // only if DataSource is on classpath
@EnableConfigurationProperties(DataSourceProperties.class)
public class DataSourceAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean  // only if YOU haven't defined your own DataSource
    public DataSource dataSource(DataSourceProperties properties) {
        return DataSourceBuilder.create()
            .url(properties.getUrl())
            .username(properties.getUsername())
            .password(properties.getPassword())
            .build();
    }
}
```

**The key conditional annotations:**

| Annotation | Meaning |
|---|---|
| `@ConditionalOnClass` | Only configure if this class exists on the classpath |
| `@ConditionalOnMissingBean` | Only configure if the user hasn't defined their own bean |
| `@ConditionalOnProperty` | Only configure if a specific property is set |
| `@ConditionalOnWebApplication` | Only configure in web applications |
| `@ConditionalOnBean` | Only configure if another specific bean exists |

**This is why Spring Boot is "opinionated but flexible":** It auto-configures everything, but `@ConditionalOnMissingBean` means **your explicit configuration always wins**.

### 3. Externalized Configuration

Spring Boot supports a powerful property resolution order:

1. Command-line arguments
2. `SPRING_APPLICATION_JSON` (inline JSON)
3. OS environment variables
4. `application-{profile}.properties` / `.yml`
5. `application.properties` / `.yml`
6. `@PropertySource` annotations
7. Default properties

This means the same artifact can run in dev, staging, and production with different configs — no recompilation needed.

```yaml
# application-dev.yml
server:
  port: 8080
spring:
  datasource:
    url: jdbc:h2:mem:devdb

# application-prod.yml
server:
  port: 443
spring:
  datasource:
    url: jdbc:postgresql://prod-host:5432/mydb
```

#### Type-Safe Configuration with `@ConfigurationProperties`

For complex configuration, use type-safe binding instead of scattered `@Value` annotations:

```java
// ❌ Fragile — typos in property names are silent errors
@Value("${app.payment.stripe.api-key}")
private String stripeApiKey;

@Value("${app.payment.stripe.timeout-ms}")
private int timeoutMs;
```

```java
// ✅ Type-safe, validated, and IDE-friendly
@ConfigurationProperties(prefix = "app.payment.stripe")
@Validated
public record StripeProperties(
    @NotBlank String apiKey,
    @Min(100) @Max(30000) int timeoutMs,
    @NotBlank String webhookSecret,
    boolean sandboxMode
) {}

// Usage
@Service
public class PaymentService {
    private final StripeProperties config;

    public PaymentService(StripeProperties config) {
        this.config = config;
    }
}
```

```yaml
app:
  payment:
    stripe:
      api-key: ${STRIPE_API_KEY}
      timeout-ms: 5000
      webhook-secret: ${STRIPE_WEBHOOK_SECRET}
      sandbox-mode: true
```

### 4. Spring Boot Actuator

Actuator exposes operational endpoints:

| Endpoint | Purpose |
|----------|---------| 
| `/actuator/health` | Application health status |
| `/actuator/metrics` | JVM, HTTP, and custom metrics |
| `/actuator/info` | Build and application info |
| `/actuator/env` | Environment properties |
| `/actuator/beans` | All registered beans |
| `/actuator/loggers` | View and change log levels at runtime |
| `/actuator/httptrace` | Recent HTTP request/response traces |

#### Health Checks for Kubernetes

Spring Boot Actuator integrates natively with Kubernetes probes:

```yaml
# application.yml
management:
  endpoint:
    health:
      probes:
        enabled: true  # exposes /actuator/health/liveness and /actuator/health/readiness
  health:
    livenessState:
      enabled: true
    readinessState:
      enabled: true
```

```yaml
# Kubernetes deployment.yml
containers:
  - name: my-app
    livenessProbe:
      httpGet:
        path: /actuator/health/liveness
        port: 8080
      initialDelaySeconds: 30
    readinessProbe:
      httpGet:
        path: /actuator/health/readiness
        port: 8080
      initialDelaySeconds: 10
```

**Liveness vs Readiness:**

| Probe | Question It Answers | Failure Action |
|---|---|---|
| **Liveness** | "Is the app still alive, or is it hung/deadlocked?" | Kubernetes **restarts** the pod |
| **Readiness** | "Is the app ready to serve traffic?" | Kubernetes **stops routing** traffic to it |

#### Custom Health Indicators

```java
@Component
public class DatabaseHealthIndicator implements HealthIndicator {

    private final DataSource dataSource;

    @Override
    public Health health() {
        try (Connection conn = dataSource.getConnection()) {
            if (conn.isValid(2)) {
                return Health.up()
                    .withDetail("database", "reachable")
                    .withDetail("latency", measureLatency())
                    .build();
            }
        } catch (SQLException e) {
            return Health.down()
                .withDetail("error", e.getMessage())
                .build();
        }
        return Health.down().build();
    }
}
```

### 5. Spring Boot DevTools

`spring-boot-devtools` accelerates the development loop:

- **Automatic restart** — Restarts the app when classes change
- **LiveReload** — Triggers browser refresh on resource changes
- **Property defaults** — Disables caching in development for instant feedback
- **Remote debugging** — Supports remote app restarts and updates

---

## The `@SpringBootApplication` Annotation

This single annotation combines three powerful annotations:

```java
@SpringBootApplication
// Equivalent to:
// @SpringBootConfiguration  — marks this as a configuration class
// @EnableAutoConfiguration  — enables auto-configuration
// @ComponentScan           — scans the current package and sub-packages
public class MyApplication {
    public static void main(String[] args) {
        SpringApplication.run(MyApplication.class, args);
    }
}
```

### Common Gotcha: Package Structure

`@ComponentScan` scans the **current package and sub-packages**. If your main class is in `com.myapp`, Spring will only find beans under `com.myapp.*`.

<SpringBootPackageStructureDiagram />

---

## Spring Boot vs Spring Framework — Deep Comparison

| Aspect | Spring Framework | Spring Boot |
|--------|-----------------|-------------|
| **Philosophy** | Maximum flexibility, zero opinions | Opinionated defaults, overridable |
| **Configuration** | Manual (XML or Java) | Auto-configuration from classpath |
| **Server** | External (deploy WAR to Tomcat) | Embedded (Tomcat/Jetty/Undertow in JAR) |
| **Dependencies** | Manual version management (dependency hell) | Starter POMs with managed BOM |
| **Setup Time** | Hours to days | Minutes |
| **Production Monitoring** | Manual integration | Actuator built-in |
| **Learning Curve** | Steeper (must understand IoC deeply) | Gentler entry point |
| **Deployment** | WAR file → application server | Fat JAR → `java -jar app.jar` |
| **Testing** | Complex setup with `@ContextConfiguration` | `@SpringBootTest` with auto-slice testing |
| **Cloud-Native** | Requires significant adaptation | Docker/K8s ready out of the box |

> **Spring Boot does not replace Spring Framework** — it builds on top of it and removes friction.

### What Spring Boot Adds on Top of Spring

<SpringBootFeaturesDiagram />

### When to Use Plain Spring Without Boot

| Scenario | Why |
|---|---|
| **Shared library / module** | Libraries shouldn't include an embedded server or auto-configuration |
| **Legacy application server** | Mandated WAR deployment to WebSphere/WebLogic |
| **Ultra-lightweight utility** | Plain Spring IoC is lighter than Boot's startup overhead |
| **Learning** | Understanding raw Spring first makes Boot's magic less mysterious |
| **Framework development** | Building your own framework on top of Spring |

---

## 🧠 Senior Deep Dive: The Startup Lifecycle (Under the Hood)

When you call `SpringApplication.run();`, Spring Boot goes through a highly organized sequence of initialization steps. Understanding this is critical for debugging "My Bean isn't loading before X happens" issues.

1. **`SpringApplication` Instantiation:**
   Spring determines if this is a web application (`Servlet`, `Reactive`, or `None`) based on the classpath libraries.
2. **Environment Preparation:**
   OS environment variables, system properties, and `application.yml` are merged into the `Environment`. 
3. **ApplicationContext Creation:**
   The massive heavy-lifting phase begins. Based on the environment type, it creates either an `AnnotationConfigServletWebServerApplicationContext` or similar.
4. **Auto-Configuration Deep Scan:**
   Spring uses `SpringFactoriesLoader` to check `META-INF/spring.factories` (or `org.springframework.boot.autoconfigure.AutoConfiguration.imports` in modern versions) from all imported dependencies. It tries to initialize thousands of beans wrapped in `@ConditionalOnClass` or `@ConditionalOnMissingBean` boundaries.
5. **Bean Definition Loading:**
   Your custom `@Component` and `@Service` classes are scanned into the Bean Registry. Spring resolves all the dependency injection trees.
6. **Embedded Server Started:**
   The Tomcat/Jetty engine is booted, binding to the configured port (e.g., 8080).
7. **ApplicationReadyEvent Fired:**
   `CommandLineRunner` and `ApplicationRunner` implementations are invoked sequentially. The terminal prints the `Started Application in X.XXX seconds` log.

### Startup Timeline Visualization

<SpringBootStartupTimelineDiagram />

**Lifecycle hooks:**

| Hook | When It Runs | Use Case |
|------|-------------|----------|
| `CommandLineRunner` | After context is ready, receives raw CLI args | Run batch jobs, seed data |
| `ApplicationRunner` | After context is ready, receives parsed `ApplicationArguments` | Same, with parsed args |
| `@PostConstruct` | After a specific bean is injected, but before the whole context is ready | Initialize a single bean |
| `@PreDestroy` | Shutting down, right before bean is removed from the context | Cleanup resources |
| `SmartLifecycle` | Fine-grained start/stop control with numerical ordering | Ordered startup of components |
| `ApplicationStartedEvent` | After context refresh, before runners | Early post-startup logic |
| `ApplicationReadyEvent` | After all runners complete | Signal "fully ready" |
| `ContextClosedEvent` | Application shutdown begins | Graceful shutdown logic |

### Startup Performance Optimization

For production services where startup time matters (serverless, scale-to-zero):

```properties
# Lazy initialization — beans created on first access, not at startup
spring.main.lazy-initialization=true

# Disable unnecessary auto-configurations
spring.autoconfigure.exclude=\
  org.springframework.boot.autoconfigure.mail.MailSenderAutoConfiguration,\
  org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration
```

```java
// GraalVM Native Image — AOT compilation for instant startup
// Build: mvn -Pnative native:compile
// Result: ~50ms startup instead of ~3000ms
```

| Technique | Startup Improvement | Trade-off |
|---|---|---|
| **Lazy init** | 30–50% faster | First request is slower |
| **Exclude unused auto-configs** | 10–20% faster | Manual maintenance |
| **Spring AOT (GraalVM Native)** | 90%+ faster (~50ms) | Longer build time, reflection limitations |
| **Class Data Sharing (CDS)** | 20–30% faster | Requires JDK setup |
| **Virtual threads** | N/A (not startup) | Improves runtime throughput |

---

## 🏢 Real-World Architecture Patterns

### 1. Layered Architecture (Most Common)

<SpringBootLayeredArchitectureDiagram />

```java
@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {
    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        Order order = orderService.createOrder(request.toCommand());
        return ResponseEntity.status(HttpStatus.CREATED).body(OrderResponse.from(order));
    }
}

@Service
@Transactional
public class OrderService {
    private final OrderRepository orderRepository;
    private final PaymentGateway paymentGateway;
    private final NotificationService notificationService;

    public Order createOrder(CreateOrderCommand command) {
        Order order = Order.create(command);
        order = orderRepository.save(order);
        paymentGateway.charge(order.getPaymentDetails());
        notificationService.sendConfirmation(order);
        return order;
    }
}

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByCustomerIdAndStatus(Long customerId, OrderStatus status);
}
```

### 2. Hexagonal / Ports & Adapters (Enterprise)

<SpringBootHexagonalArchitectureDiagram />

```java
// Port (interface in domain layer)
public interface PaymentPort {
    PaymentResult charge(PaymentRequest request);
}

// Adapter (implementation in infrastructure layer)
@Component
@Profile("production")
public class StripePaymentAdapter implements PaymentPort {
    private final StripeClient stripeClient;

    @Override
    public PaymentResult charge(PaymentRequest request) {
        // Stripe-specific implementation
    }
}

@Component
@Profile("test")
public class FakePaymentAdapter implements PaymentPort {
    @Override
    public PaymentResult charge(PaymentRequest request) {
        return PaymentResult.success(); // always succeeds in tests
    }
}
```

### 3. Spring Boot + Docker + Kubernetes

```dockerfile
# Multi-stage build for optimal image size
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY . .
RUN ./mvnw package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Spring Boot optimizations for containers
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

```yaml
# application.yml — container-aware configuration
server:
  shutdown: graceful  # wait for active requests to complete
spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s  # max wait time for graceful shutdown
management:
  server:
    port: 9090  # separate port for actuator (not exposed publicly)
```

---

## ⚖️ Trade-offs & Common Pitfalls

### Auto-Configuration Surprises

```java
// ❌ Problem: You add spring-boot-starter-data-redis to your pom.xml
// just for the Redis client library, but Spring Boot auto-configures
// a full RedisTemplate, RedisConnectionFactory, and changes your
// cache manager from Caffeine to Redis — breaking your existing caching!

// ✅ Fix: Explicitly exclude unwanted auto-configuration
@SpringBootApplication(exclude = {
    RedisAutoConfiguration.class,
    RedisRepositoryAutoConfiguration.class
})
public class MyApplication { }
```

### Profile Drift

```yaml
# ❌ Profile drift: dev and prod have different behavior
# application-dev.yml uses H2 in-memory → no FK constraints
# application-prod.yml uses PostgreSQL → strict FK constraints
# Tests pass in dev, fail in production!

# ✅ Fix: Use the same database engine in all environments
# application-dev.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/devdb  # same engine as prod!

# Or use Testcontainers for integration tests
```

### Fat JAR Size & Startup Time

| Metric | Typical Spring Boot App | Optimized |
|---|---|---|
| **JAR size** | 50–100MB | 30–50MB (exclude unused starters) |
| **Startup time** | 3–8 seconds | 1–3 seconds (lazy init, exclude auto-configs) |
| **Memory** | 256–512MB | 128–256MB (tuned JVM flags) |
| **Native image** | N/A | 50–100ms startup, 50–80MB memory |

### When Spring Boot Is NOT the Right Choice

| Scenario | Better Alternative |
|---|---|
| **Ultra-low latency** (sub-ms) | Quarkus, Micronaut, or hand-tuned Netty |
| **Serverless / Lambda** | Quarkus (native) or lightweight frameworks |
| **Simple CLI tool** | Picocli or plain Java |
| **Frontend-heavy app** | Next.js, Django, Rails |
| **Embedded systems** | Too heavy for constrained environments |

---

## 🧪 Testing in Spring Boot

### The Testing Pyramid

Spring Boot provides specialized test slices that load only what you need:

```
         /   @SpringBootTest   \          ← Full integration (slow, few)
        /   @WebMvcTest         \         ← Controller layer only
       /   @DataJpaTest          \        ← Repository layer only
      /   @MockBean + unit tests  \       ← Pure unit tests (fast, many)
```

```java
// Controller test — only loads web layer, no database
@WebMvcTest(OrderController.class)
class OrderControllerTest {
    @Autowired private MockMvc mockMvc;
    @MockBean private OrderService orderService;

    @Test
    void shouldCreateOrder() throws Exception {
        when(orderService.createOrder(any())).thenReturn(testOrder);

        mockMvc.perform(post("/api/v1/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"customerId": 1, "items": [{"productId": 42, "quantity": 2}]}
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").exists());
    }
}

// Repository test — only loads JPA, uses embedded database
@DataJpaTest
class OrderRepositoryTest {
    @Autowired private OrderRepository repository;

    @Test
    void shouldFindOrdersByCustomer() {
        repository.save(new Order(1L, OrderStatus.PENDING));
        List<Order> orders = repository.findByCustomerIdAndStatus(1L, OrderStatus.PENDING);
        assertThat(orders).hasSize(1);
    }
}

// Full integration test — loads entire application
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class OrderIntegrationTest {
    @Autowired private TestRestTemplate restTemplate;

    @Test
    void shouldCreateAndRetrieveOrder() {
        ResponseEntity<OrderResponse> response = restTemplate.postForEntity(
            "/api/v1/orders", createRequest, OrderResponse.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }
}
```

| Annotation | What It Loads | Speed | Use For |
|---|---|---|---|
| `@WebMvcTest` | Controllers, filters, converters only | ⚡ Fast | REST API contract testing |
| `@DataJpaTest` | JPA, Hibernate, repositories only | ⚡ Fast | Query and repository testing |
| `@WebFluxTest` | Reactive controllers only | ⚡ Fast | Reactive endpoint testing |
| `@JsonTest` | JSON serialization only | ⚡ Fast | DTO serialization/deserialization |
| `@SpringBootTest` | Everything | 🐢 Slow | End-to-end integration tests |

---

## 🔗 Relationship to Other Spring Projects

<SpringProjectsRelationshipDiagram />

| Project | What It Adds | Typical Starter |
|---|---|---|
| **Spring Data JPA** | Repository abstraction for databases | `spring-boot-starter-data-jpa` |
| **Spring Security** | Authentication, authorization, CSRF, OAuth2 | `spring-boot-starter-security` |
| **Spring Cloud Config** | Centralized configuration management | `spring-cloud-starter-config` |
| **Spring Cloud Netflix** | Service discovery (Eureka), client load balancing | `spring-cloud-starter-netflix-eureka-*` |
| **Spring Cloud Gateway** | API gateway, routing, rate limiting | `spring-cloud-starter-gateway` |
| **Spring Batch** | Large-scale batch processing | `spring-boot-starter-batch` |

---

## Summary

Spring Boot transforms the Spring development experience by providing:

- **Zero-config startup** through auto-configuration
- **Dependency harmony** through starter POMs
- **Deployment simplicity** through embedded servers and fat JARs
- **Operational visibility** through Actuator
- **Environment flexibility** through externalized configuration

It is the foundation for modern Java application development, from monoliths to cloud-native microservices.

### Compare Next
- [Spring Boot - Internals & Architecture](./spring-boot-internals.md)
- [Spring Boot - Advanced Topics](./spring-boot-advanced.md)
- [Spring Framework: Overview](./spring-framework.md)

---

## Interview Questions

### Fundamentals

### Q: What is Spring Boot and how does it differ from the Spring Framework?
**A:** Spring Framework provides IoC, DI, AOP, MVC, and other foundational features but requires manual configuration. Spring Boot is a layer on top that provides auto-configuration, starter dependencies, embedded servers, and production-ready features (Actuator). It doesn't replace Spring — it eliminates boilerplate so you can use Spring faster.

### Q: Why is Spring Boot preferred for microservices over plain Spring?
**A:** It reduces setup overhead with auto-configuration and starters, produces self-contained fat JARs perfect for containers, includes Actuator for health/metrics/readiness probes, and supports externalized configuration for environment-specific deployment — all critical for microservice architecture.

### Q: What does `@SpringBootApplication` do?
**A:** It's a meta-annotation combining `@SpringBootConfiguration` (marks a configuration class), `@EnableAutoConfiguration` (enables classpath-based auto-configuration), and `@ComponentScan` (scans the current package and sub-packages for beans). It's the entry point annotation for every Spring Boot application.

### Auto-Configuration & Configuration

### Q: How does auto-configuration work?
**A:** Spring Boot reads auto-configuration classes from `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` (Boot 3.x) or `META-INF/spring.factories` (Boot 2.x). Each class uses conditional annotations (`@ConditionalOnClass`, `@ConditionalOnMissingBean`, etc.) to decide whether to create beans. Your explicit configuration always takes precedence over auto-configuration.

### Q: What is the biggest risk of relying heavily on auto-configuration defaults?
**A:** Hidden behavior can change after dependency upgrades — a new JAR on the classpath can trigger unexpected auto-configuration. Teams should keep critical configuration explicit, use `--debug` to audit what's auto-configured, and test configuration changes across environments.

### Q: How does the externalized configuration priority work?
**A:** Spring Boot resolves properties in order: command-line args > environment variables > `application-{profile}.yml` > `application.yml` > defaults. Higher-priority sources override lower ones. This allows the same artifact to run in dev, staging, and production without recompilation.

### Q: What is `@ConfigurationProperties` and when should you use it over `@Value`?
**A:** `@ConfigurationProperties` binds a group of related properties to a type-safe POJO, supports validation (`@Validated`), and works with IDE auto-completion. Use it for structured config (e.g., `app.payment.stripe.*`). Use `@Value` only for one-off simple properties.

### Production & Operations

### Q: What operational checks should every Spring Boot service expose?
**A:** Health (overall app status), readiness (can it accept traffic?), liveness (is it hung?), key latency/error metrics, and dependency status (database, cache, downstream services). All achievable through Spring Boot Actuator.

### Q: How do profiles impact deployment safety?
**A:** They separate environment behavior without rebuilding artifacts, but can cause "profile drift" where dev uses H2 and prod uses PostgreSQL, leading to bugs that only appear in production. Mitigate by using the same database engine across all environments and testing with Testcontainers.

### Q: How do you optimize Spring Boot startup time?
**A:** Lazy initialization (`spring.main.lazy-initialization=true`), exclude unused auto-configurations, use Spring AOT with GraalVM Native Image for sub-100ms startup, and Class Data Sharing (CDS). Trade-offs: lazy init makes the first request slower; native images have longer build times and reflection limitations.

### Architecture & Design

### Q: When should you avoid adding another starter dependency?
**A:** When it introduces broad transitive features you don't need (e.g., adding `starter-data-redis` just for the client triggers auto-configuration of `RedisTemplate`, cache manager, etc.). Explicitly exclude unwanted auto-configs or depend on the raw library instead.

### Q: How do you handle feature rollout safely in Spring Boot services?
**A:** Use feature flags (e.g., LaunchDarkly, Unleash, or Spring Cloud Config) so deployment and release are decoupled. Deploy the code with the feature disabled, then gradually enable it for a percentage of users. This separates "shipping code" from "activating behavior."

### Q: When would you choose Quarkus or Micronaut over Spring Boot?
**A:** For serverless/FaaS where cold-start time is critical (Quarkus native compiles in ~50ms vs Boot's ~3s). For extremely memory-constrained environments (IoT, edge computing). Spring Boot's advantage is ecosystem breadth, community size, and enterprise tooling — Quarkus/Micronaut are better for specific performance-critical scenarios.

### Q: How does Spring Boot support 12-Factor App methodology?
**A:** Externalized config (env vars, profiles) → Factor III. Fat JAR deployment → Factor V (build, release, run). Stateless services → Factor VI. Port binding (embedded server) → Factor VII. Actuator health checks → Factor VIII (telemetry). Graceful shutdown → Factor IX (disposability).
