---
id: spring-boot-tricky-interview-questions-2
title: Spring Boot Tricky Interview Questions and Answers #2
description: A collection of challenging Spring Boot interview questions covering architecture, security, scaling, and configuration.
tags:
  - Java
  - Spring Boot
  - Interview Experience
  - Microservices
  - Backend Development
---

# Spring Boot Tricky Interview Questions & Answers #2

This guide contains challenging interview questions and detailed answers focused on Spring Boot, designed to test practical experience and advanced conceptual understanding.

---

## 1. Spring Boot Internals & Configuration

### Q: How to get the list of all the beans in your Spring Boot application?
**A:** Two approaches — programmatic and via Actuator:

```java
// 1. Programmatic — autowire ApplicationContext
@Component
public class BeanLister implements CommandLineRunner {
    @Autowired ApplicationContext context;
    
    @Override
    public void run(String... args) {
        String[] beanNames = context.getBeanDefinitionNames();
        Arrays.sort(beanNames);
        for (String name : beanNames) {
            System.out.printf("%-40s → %s%n", name, context.getBean(name).getClass().getName());
        }
        // Output: dataSource → com.zaxxer.hikari.HikariDataSource
    }
}
```

```bash
# 2. Actuator endpoint (requires management.endpoints.web.exposure.include=beans)
curl http://localhost:8080/actuator/beans | jq '.contexts[].beans | keys'
```

The Actuator response also shows bean **scope** (singleton/prototype), **type**, **resource** (where defined), and **dependencies** — useful for debugging wiring issues.

### Q: Explain the concept of Spring Boot's embedded servlet containers.
**A:** Spring Boot bundles a web server **inside the application JAR** — no external Tomcat/JBoss installation needed:

| Server | Default for | Model | Use Case |
|--------|------------|-------|----------|
| **Tomcat** | `spring-boot-starter-web` | Thread-per-request | General purpose (95% of apps) |
| **Jetty** | — | Thread-per-request | Lightweight, good WebSocket support |
| **Undertow** | — | Non-blocking I/O | High-throughput, Red Hat ecosystem |
| **Netty** | `spring-boot-starter-webflux` | Event-loop | Reactive applications |

The embedded server is configured programmatically via `application.yml`:
```yaml
server:
  port: 8080
  tomcat:
    threads:
      max: 200          # Worker threads (default: 200)
      min-spare: 10     # Minimum idle threads
    max-connections: 8192  # Max TCP connections accepted
    accept-count: 100      # OS-level backlog queue
    connection-timeout: 20s  # Connection idle timeout
```

> **Thread pool sizing tip:** Using **Little's Law** — `threads_needed = throughput × latency`. For 300 RPS with 50ms avg response: `300 × 0.05 = 15 threads`. Set `threads.max` to 2-3× this for burst headroom.

### Q: How does Spring Boot make Dependency Injection (DI) easier compared to traditional Spring?
**A:**

| Aspect | Traditional Spring | Spring Boot |
|--------|-------------------|-------------|
| Bean definition | XML: `<bean class="...">` or `@Bean` | Auto-detected via `@Component`, `@Service`, `@Repository` |
| Wiring | Explicit `<property ref="...">` | Auto-wired by type (constructor injection preferred) |
| Configuration | Manual DataSource, TransactionManager, etc. | Auto-configured from classpath + properties |
| 3rd party setup | Write `@Configuration` classes | Starter POMs + auto-configuration |

**Under the hood:** `@ComponentScan` (part of `@SpringBootApplication`) scans packages recursively. For each `@Component`-annotated class, Spring creates a `BeanDefinition`, resolves constructor parameters by type, and injects them. **Constructor injection** is preferred (and implicit since Spring 4.3 for single-constructor classes) — it makes dependencies explicit and allows `final` fields:

```java
@Service
public class OrderService {
    private final OrderRepository orderRepo;   // final → immutable
    private final PaymentGateway paymentGateway;
    
    // Single constructor → @Autowired is implicit
    public OrderService(OrderRepository orderRepo, PaymentGateway paymentGateway) {
        this.orderRepo = orderRepo;
        this.paymentGateway = paymentGateway;
    }
}
```

### Q: How does Spring Boot simplify the management of application secrets and sensitive configurations?
**A:** Layered approach, from simple to enterprise:

1. **Environment variables:** `SPRING_DATASOURCE_PASSWORD=secret` — overrides `spring.datasource.password`. Works with Docker, Kubernetes secrets.

2. **`application-{profile}.yml`:** Profile-specific configs in Git (dev/staging/prod). **Never commit real secrets to Git.**

3. **Spring Cloud Config Server:** Centralized config backed by Git, with encryption support:
   ```yaml
   spring.datasource.password: '{cipher}AQBxxxxEncryptedxxxx'
   ```

4. **HashiCorp Vault integration:**
   ```yaml
   spring.cloud.vault:
     uri: https://vault.company.com
     kv:
       backend: secret
       default-context: myapp
   ```
   The `spring-cloud-starter-vault-config` dependency auto-injects Vault secrets as Spring properties at startup — zero code changes.

5. **Kubernetes Secrets:** Mounted as environment variables or files, read via `@Value("${DB_PASSWORD}")`.

### Q: Explain Spring Boot's approach to handle asynchronous operations.
**A:** Spring Boot's `@Async` annotation runs methods on a separate thread pool:

```java
@Configuration
@EnableAsync
public class AsyncConfig {
    @Bean("taskExecutor")
    public Executor asyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);          // Minimum threads
        executor.setMaxPoolSize(20);          // Maximum threads
        executor.setQueueCapacity(100);       // Queue before creating new threads
        executor.setThreadNamePrefix("async-");
        executor.setRejectedExecutionHandler(new CallerRunsPolicy()); // Backpressure
        executor.initialize();
        return executor;
    }
}

@Service
public class NotificationService {
    @Async("taskExecutor")
    public CompletableFuture<String> sendEmail(String to, String body) {
        // Runs on async-* thread, not the Tomcat worker thread
        emailClient.send(to, body);
        return CompletableFuture.completedFuture("sent");
    }
}
```

> **Critical self-invocation trap:** `@Async` (like `@Transactional`, `@Cacheable`) is proxy-based. Calling `this.sendEmail()` from within the same class bypasses the proxy — the method runs synchronously on the caller's thread. **Fix:** Inject the service into itself via constructor, or extract to a separate bean.

### Q: How can you enable and use asynchronous methods in a Spring Boot application?
**A:**
1. Add `@EnableAsync` to a configuration class.
2. Define a custom `ThreadPoolTaskExecutor` bean (avoid the default `SimpleAsyncTaskExecutor` which creates unlimited threads).
3. Annotate target methods with `@Async("executorBeanName")`.
4. Return `CompletableFuture<T>` if the caller needs the result, or `void` for fire-and-forget.
5. Handle exceptions via `AsyncUncaughtExceptionHandler` (for void methods) or `.exceptionally()` on `CompletableFuture`.

---

## 2. Security & Authentication

### Q: Describe how you would secure sensitive data in a Spring Boot application accessed by multiple users with different roles.
**A:** Defense-in-depth approach:

| Layer | Mechanism | Implementation |
|-------|-----------|----------------|
| **Authentication** | Verify identity | Spring Security + JWT/OAuth2 |
| **Authorization** | Role-based access | `@PreAuthorize("hasRole('ADMIN')")` |
| **Data encryption at rest** | Protect stored data | AES-256 via `Jasypt` or DB-level TDE |
| **Data encryption in transit** | Protect network traffic | HTTPS/TLS (mandatory in production) |
| **Secret management** | Keep credentials safe | Vault, K8s Secrets, env vars |
| **Audit trail** | Track access | Spring Data Auditing + `@CreatedBy` |

```java
// Role-based method security
@PreAuthorize("hasRole('ADMIN') or #userId == authentication.principal.id")
public UserProfile getUserProfile(Long userId) { ... }

// Data masking in logs
@ToString(exclude = {"ssn", "creditCard"}) // Lombok
public class User { ... }
```

### Q: Can you explain the difference between Authentication and Authorization in Spring Security?
**A:**
| Aspect | Authentication | Authorization |
|--------|---------------|---------------|
| Question | **Who** are you? | **What** can you do? |
| Mechanism | Credentials verification | Permission/role checks |
| When | **Before** authorization | **After** authentication |
| Spring component | `AuthenticationManager` + `AuthenticationProvider` | `AccessDecisionManager` + `SecurityExpressionHandler` |
| Failure response | `401 Unauthorized` | `403 Forbidden` |
| Storage | `SecurityContext.getAuthentication()` | `GrantedAuthority` collection |

### Q: How is Spring Security implemented in a Spring Boot application?
**A:** Modern Spring Security (Spring Boot 3.x) uses component-based configuration — `WebSecurityConfigurerAdapter` is **deprecated**:

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity  // Enables @PreAuthorize, @PostAuthorize
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())  // Disable for stateless APIs
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12); // 12 rounds — ~250ms hash time
    }
}
```

> **Filter chain execution order:** `SecurityContextPersistenceFilter` → `CsrfFilter` → `LogoutFilter` → `UsernamePasswordAuthenticationFilter` → `ExceptionTranslationFilter` → `FilterSecurityInterceptor`. Your custom JWT filter is inserted before `UsernamePasswordAuthenticationFilter`.

### Q: Describe how to implement security in a Microservices architecture using Spring Boot.
**A:** The **API Gateway pattern** centralizes security:

```
                        ┌─────────────────┐
  Client ──JWT──────►   │   API Gateway   │ ──── Auth Service (issues JWT)
                        │  (validates JWT) │
                        └────┬────┬────┬──┘
                             │    │    │
                    ┌────────┤    │    ├────────┐
                    ▼        ▼    ▼    ▼        ▼
               Service A  Service B  Service C  Service D
               (trusts     (trusts   (trusts    (trusts
                gateway)    gateway)  gateway)   gateway)
```

1. **Auth Service** authenticates users and issues signed JWT tokens.
2. **API Gateway** (Spring Cloud Gateway) validates JWT signature on every request. Invalid tokens → `401`.
3. **Downstream services** trust the gateway — they extract user claims from the JWT header without re-validating the signature (or validate with the same public key for extra security).
4. **mTLS** (mutual TLS) secures inter-service communication.

---

## 3. Deployment & Scaling

### Q: If you had to scale a Spring Boot application to handle high traffic, what strategies would you use?
**A:**

| Strategy | What It Solves | Implementation |
|----------|---------------|----------------|
| **Horizontal scaling** | CPU/memory exhaustion | Kubernetes replicas + HPA |
| **Connection pooling** | DB connection exhaustion | HikariCP (`maximumPoolSize`) |
| **Caching** | Repetitive DB queries | Redis/Caffeine + `@Cacheable` |
| **Async processing** | Thread blocking on I/O | `@Async`, message queues |
| **Read replicas** | DB read bottleneck | Spring `@Transactional(readOnly=true)` routes to replica |
| **CDN** | Static asset latency | CloudFront/CloudFlare |
| **Rate limiting** | Abuse/DDoS | Bucket4j, Spring Cloud Gateway |

**Capacity planning with Little's Law:**
```
Concurrent users = Arrival rate × Average response time
Example: 1000 RPS × 0.1s = 100 concurrent requests
→ Need 100+ Tomcat threads + proportional DB connections
```

### Q: In Spring Boot, how is Session Management configured in distributed systems?
**A:** Spring Session externalizes session data:

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.session</groupId>
    <artifactId>spring-session-data-redis</artifactId>
</dependency>
```

```yaml
# application.yml
spring:
  session:
    store-type: redis
    timeout: 30m
  redis:
    host: redis-cluster.internal
    port: 6379
```

Spring Session intercepts `HttpSession` operations via a `SessionRepositoryFilter`, transparently storing/retrieving session data from Redis instead of server memory. All application instances share the same Redis — a user's session persists across any server they hit.

> **Alternative for stateless APIs:** Don't use sessions at all. Use JWT — the client carries its own authentication state. This is the preferred approach for microservices.

---

## 4. File Handling, Email & CLI

### Q: You are creating an endpoint that allows users to upload files. How would you handle it?
**A:**
```java
@RestController
public class FileController {
    @PostMapping("/api/upload")
    public ResponseEntity<String> upload(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) return ResponseEntity.badRequest().body("No file");
        if (file.getSize() > 10_000_000) return ResponseEntity.status(413).body("Too large");
        
        // Stream to S3 (don't load entire file into memory)
        s3Client.putObject(PutObjectRequest.builder()
            .bucket("my-bucket").key(file.getOriginalFilename()).build(),
            RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        
        return ResponseEntity.ok("Uploaded: " + file.getOriginalFilename());
    }
}
```

```yaml
# application.yml — configure file upload limits
spring:
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 10MB
      file-size-threshold: 2KB  # Files larger than 2KB written to temp disk
```

> **Production tip:** Never store uploads on local disk in a scaled deployment — instances are ephemeral. Use object storage (S3, GCS, MinIO).

### Q: After registration, your application needs to send a welcome email. How?
**A:**
```java
@Service
public class EmailService {
    private final JavaMailSender mailSender;
    
    @Async("taskExecutor")  // Send asynchronously — don't block registration
    public void sendWelcomeEmail(String to, String name) {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);
        helper.setTo(to);
        helper.setSubject("Welcome, " + name + "!");
        helper.setText(buildHtmlTemplate(name), true); // HTML content
        mailSender.send(message);
    }
}
```

> **Resilience:** Email servers can be down. In production, use a **message queue** (Kafka/RabbitMQ) between your app and the email sender. The registration flow publishes a `UserRegisteredEvent`, and a separate consumer handles email delivery with retries.

### Q: How do you disable a specific Auto-configuration class?
**A:**
```java
// Method 1: Annotation exclude
@SpringBootApplication(exclude = {
    DataSourceAutoConfiguration.class,
    SecurityAutoConfiguration.class
})
public class MyApplication { }

// Method 2: Property-based exclude
// application.yml
spring:
  autoconfigure:
    exclude:
      - org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration
```

### Q: Explain the difference between Cache Eviction and Cache Expiration.
**A:**
| Aspect | Cache Eviction | Cache Expiration |
|--------|---------------|------------------|
| **Trigger** | Cache is full (space pressure) | Entry age exceeds TTL |
| **Purpose** | Manage cache **size** | Ensure data **freshness** |
| **Policy** | LRU, LFU, FIFO, Random | Time-based (TTL, TTI) |
| **Example** | Caffeine `maximumSize(1000)` — evicts LRU entry when 1001st added | Redis `EXPIRE key 3600` — entry dies after 1 hour |
| **Data loss** | Potentially useful data removed | Stale data removed |

In practice, you configure **both**: size-based eviction (prevent OOM) + time-based expiration (prevent stale reads).

### Q: How would you manage externalized configuration in a microservice architecture?
**A:** **Spring Cloud Config Server** provides centralized config:

```
┌─────────────────────────────────┐
│   Spring Cloud Config Server    │ ← backed by Git repo
└───────┬─────────┬───────────┬──┘
        │         │           │
   ┌────▼──┐  ┌──▼────┐  ┌──▼────┐
   │User   │  │Order  │  │Payment│  ← fetch config at startup
   │Service│  │Service│  │Service│
   └───────┘  └───────┘  └───────┘
```

- Each service has `bootstrap.yml` pointing to Config Server.
- Config Server serves `{application-name}-{profile}.yml` from Git.
- **Sensitive values:** Encrypt with Config Server's `/encrypt` endpoint, or integrate Vault.
- **Runtime refresh:** `@RefreshScope` beans re-read config when `/actuator/refresh` is called — no restart needed.