---
id: experienced-java-backend-interview
title: Java Backend Interview (5+ Years Experience)
sidebar_label: Experienced Backend Q&A
description: "Senior-level Java, Spring Boot, and microservices interview questions for experienced backend engineers."
tags: [java, interview, spring-boot, microservices]
---

# Java, Spring Boot & Microservices Interview Questions

This comprehensive guide covers high-level architectural and technical questions frequently asked of Senior Java Developers (5+ years experience).

## 1. Can you use `HashMap` in a multi-threaded environment?

It depends on the scenario:

### Read-only (safe)
If the map is fully initialized before any thread reads it (e.g., populated at startup, then never modified), a standard `HashMap` is safe and offers the best performance. This is because there's a **happens-before** relationship between the initialization thread and the reading threads (via the `final` field or thread start).

### Read-Write (dangerous)
In a concurrent read-write scenario, `HashMap` is **not** thread-safe. The risks include:
- **Data corruption:** Two threads resizing simultaneously can create an infinite loop in the linked list (pre-Java 8) or corrupt the tree structure (Java 8+).
- **Lost updates:** Two threads writing to the same bucket can overwrite each other's entries.
- **ConcurrentModificationException:** Only thrown by the iterator's fail-fast mechanism, not guaranteed in all corruption scenarios.

### Thread-Safe Alternatives

| Option | Mechanism | Read Performance | Write Performance | Best For |
|:-------|:----------|:----------------|:-----------------|:---------|
| `ConcurrentHashMap` | CAS + node-level `synchronized` (Java 8+) | Excellent (lock-free reads) | Good | General concurrent access |
| `Collections.synchronizedMap()` | Single mutex on entire map | Poor (blocks all readers) | Poor | Legacy compatibility |
| `Hashtable` | Same as above | Poor | Poor | **Never use** (legacy) |

### ConcurrentHashMap Internal Evolution

**Java 7:** Used **Segment locking** (16 segments by default). Each segment was essentially a mini-HashMap with its own lock. Max 16 concurrent writers.

**Java 8+:** Segments were **removed**. The new approach uses:
- **CAS (Compare-And-Swap)** for inserting into empty buckets (no locking at all)
- **`synchronized` on the first Node** of a non-empty bucket (fine-grained, per-bucket locking)
- **Lock-free reads** via `volatile` node references

This means the concurrency level is equal to the **number of buckets**, not a fixed 16.

## 2. String Literal vs. `new String()`

* **String Literal (`"hello"`):** The JVM checks the **String Constant Pool (SCP)**. If `"hello"` already exists, it returns the existing reference. If not, it creates a new entry in the pool. Only **one object** is created (in the pool).
* **`new String("hello")`:** Always creates a **new object in the Heap**, bypassing the pool check. However, the literal `"hello"` must still exist in the pool (created at class-loading time if not already present). So up to **two objects** are created.

### Memory Layout

| Declaration Syntax | Heap Memory Location | Reference Address Example | Pool Reusability (`==`) |
|---|---|---|---|
| `String a = "hello";` | **String Constant Pool (SCP)** | Pointer `0x100` | Reuses existing pool instance. `a == b` returns `true`. |
| `String b = "hello";` | **String Constant Pool (SCP)** | Pointer `0x100` | Shared identical memory reference. |
| `String c = new String("hello");` | **Regular Heap Space** (outside SCP) | Pointer `0x200` (wraps `char[]/byte[]`) | Bypasses pool reuse. `a == c` returns `false`, `a.equals(c)` returns `true`. |
| `String d = c.intern();` | **String Constant Pool (SCP)** | Pointer `0x100` | Pulls existing pool reference. `a == d` returns `true`. |

**Key difference:**
```java
String a = "hello";
String b = "hello";
String c = new String("hello");

System.out.println(a == b);      // true  — same pool reference
System.out.println(a == c);      // false — different objects
System.out.println(a.equals(c)); // true  — same content
```

**Since Java 7:** The String Constant Pool was moved from **PermGen** to the **Heap**, allowing it to be garbage collected and to grow dynamically.

## 3. Java 8 Features & Real-world Usage

### Stream API
Enables functional-style processing of collections with a pipeline of lazy intermediate operations and a terminal operation:
```java
List<String> activeEmails = users.stream()
    .filter(User::isActive)
    .map(User::getEmail)
    .filter(email -> email.endsWith("@company.com"))
    .sorted()
    .collect(Collectors.toList());
```

**Key internal detail:** Streams use **short-circuit evaluation** — operations like `findFirst()`, `limit()`, and `anyMatch()` stop processing as soon as the result is determined, even on infinite streams.

### Lambda Expressions
Lambdas are compiled to **invokedynamic** bytecode instructions (not anonymous inner classes). The JVM generates the implementation class at runtime using `LambdaMetafactory`, which is more efficient than creating a `.class` file for each lambda.

### Optional
Prevents `NullPointerException` by explicitly modeling the absence of a value:
```java
// Anti-pattern: DON'T use Optional.get() without check
Optional<User> userOpt = repository.findById(id);

// Good: orElseThrow with meaningful exception
User user = userOpt.orElseThrow(() -> 
    new UserNotFoundException("User not found: " + id));

// Good: functional transformation chain
String email = userOpt
    .map(User::getEmail)
    .filter(e -> e.contains("@"))
    .orElse("default@company.com");
```

**Performance trap:** `orElse()` **always** evaluates its argument, even when the Optional has a value. Use `orElseGet()` for expensive operations:
```java
// BAD: DB call happens even if user exists
User u = optional.orElse(repository.createDefault());

// GOOD: DB call only happens if empty
User u = optional.orElseGet(() -> repository.createDefault());
```

### Default Methods
Added to interfaces to provide backward-compatible API evolution. This is how Java added methods like `forEach()`, `stream()`, and `spliterator()` to the `Collection` interface in Java 8 without breaking millions of existing implementations.

**Diamond problem resolution:** If a class implements two interfaces with the same default method, the class **must** override it to resolve the ambiguity.

## 4. Spring Boot Starter Dependencies

Spring Boot starters are curated **Bill of Materials (BOM)** that group related dependencies with pre-verified compatible versions.

### How it works internally
1. You add a single starter (e.g., `spring-boot-starter-web`)
2. Maven/Gradle resolves its **transitive dependencies** (Tomcat, Jackson, Spring MVC, etc.)
3. Spring Boot's `spring-boot-dependencies` BOM pins all version numbers to prevent conflicts

### Common Starters

| Starter | Includes |
|:--------|:---------|
| `spring-boot-starter-web` | Spring MVC, Tomcat, Jackson |
| `spring-boot-starter-data-jpa` | Hibernate, Spring Data JPA, HikariCP |
| `spring-boot-starter-security` | Spring Security, BCrypt |
| `spring-boot-starter-test` | JUnit 5, Mockito, AssertJ |

**Production tip:** Use `mvn dependency:tree` to audit transitive dependencies and identify version conflicts.

## 5. What is Spring Boot Actuator?

Actuator provides **production-ready** operational endpoints to monitor and manage your application at runtime.

### Key Endpoints

| Endpoint | Purpose | Sensitive? |
|:---------|:--------|:-----------|
| `/actuator/health` | Application + dependency health (DB, disk, Redis) | No (public by default) |
| `/actuator/metrics` | JVM memory, GC, HTTP request durations, thread pools | Yes |
| `/actuator/env` | All configuration properties and their sources | **Very sensitive** |
| `/actuator/beans` | Complete list of Spring beans and their dependencies | Yes |
| `/actuator/threaddump` | Thread dump (equivalent to `jstack`) | Yes |
| `/actuator/heapdump` | Heap dump (equivalent to `jmap`) | **Extremely sensitive** |
| `/actuator/prometheus` | Metrics in Prometheus scrape format | Yes |

### Security Best Practice
```yaml
# application.yml — expose only what you need
management:
  endpoints:
    web:
      exposure:
        include: health, metrics, prometheus
  endpoint:
    health:
      show-details: when-authorized  # Don't expose DB details publicly
```

**Production warning:** Never expose `/actuator/env` or `/actuator/heapdump` publicly. The env endpoint can leak database passwords, API keys, and secrets. The heapdump can be analyzed offline to extract all in-memory data.

## 6. Profiles in Spring Boot

Profiles allow environment-specific configuration without code changes.

### Configuration hierarchy (highest priority wins)
1. Command-line arguments (`--spring.profiles.active=prod`)
2. JVM system properties (`-Dspring.profiles.active=prod`)
3. OS environment variables (`SPRING_PROFILES_ACTIVE=prod`)
4. Profile-specific files (`application-prod.yml`)
5. Default file (`application.yml`)

### Multi-profile documents (YAML)
```yaml
# application.yml
spring:
  datasource:
    url: jdbc:h2:mem:testdb  # Default (dev)

---
spring:
  config:
    activate:
      on-profile: prod
  datasource:
    url: jdbc:postgresql://prod-db:5432/myapp
    hikari:
      maximum-pool-size: 20
```

### Profile-specific beans
```java
@Configuration
@Profile("prod")
public class ProdCacheConfig {
    @Bean
    public CacheManager cacheManager() {
        return new RedisCacheManager(/* ... */);
    }
}

@Configuration
@Profile("dev")
public class DevCacheConfig {
    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager(); // Simple in-memory
    }
}
```

## 7. API Documentation with Swagger

Swagger (OpenAPI 3.0) generates interactive API documentation from your code annotations.

### Setup with SpringDoc (modern replacement for Springfox)
```java
// Just add the dependency — auto-configured
// springdoc-openapi-starter-webmvc-ui

@RestController
@Tag(name = "Users", description = "User management API")
public class UserController {

    @Operation(summary = "Get user by ID",
               description = "Returns a user if found, 404 otherwise")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "User found"),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping("/api/users/{id}")
    public ResponseEntity<UserDto> getUser(@PathVariable Long id) {
        // ...
    }
}
```

**Access:** Swagger UI is available at `/swagger-ui.html` and the raw OpenAPI spec at `/v3/api-docs`.

## 8. Microservices: Monolithic to Microservices

When decomposing a monolith, follow the **Strangler Fig Pattern**:

### Step-by-step Decomposition
1. **Identify bounded contexts** using Domain-Driven Design (DDD) — each context maps to one microservice.
2. **Extract the most painful bottleneck first** — not everything at once.
3. **Set up an API Gateway** that routes traffic — new requests go to the microservice, legacy routes go to the monolith.
4. **Gradually strangle** the monolith by extracting more services over time.

### Key Principles
* **Database per Service:** Each service owns its data. No shared databases. Use events (Kafka/RabbitMQ) for data synchronization.
* **Single Responsibility:** Each service does one thing well and can be deployed independently.
* **Loose Coupling/High Cohesion:** Services communicate through well-defined APIs, not shared internal state.

### Anti-patterns to avoid
* **Distributed Monolith:** Services that must be deployed together are not truly microservices.
* **Shared Database:** If two services read/write the same tables, you have a distributed monolith with network overhead.
* **Synchronous chains:** A → B → C → D creates brittle coupling. Use async messaging where possible.

## 9. Fault Tolerance: Resilience4j

Resilience4j (replacement for deprecated Netflix Hystrix) provides fault tolerance patterns:

### Circuit Breaker (State Machine)
```
CLOSED ──(failure rate > threshold)──→ OPEN
  ↑                                      │
  │                                      │ (wait duration)
  │                                      ↓
  └──(success rate > threshold)──── HALF_OPEN
```

```java
@CircuitBreaker(name = "paymentService", fallbackMethod = "paymentFallback")
public PaymentResponse processPayment(PaymentRequest request) {
    return paymentClient.charge(request);
}

private PaymentResponse paymentFallback(PaymentRequest request, Throwable t) {
    log.warn("Payment service unavailable, queuing for retry", t);
    retryQueue.enqueue(request);
    return PaymentResponse.pending();
}
```

### Configuration
```yaml
resilience4j:
  circuitbreaker:
    instances:
      paymentService:
        failure-rate-threshold: 50       # Open after 50% failures
        wait-duration-in-open-state: 30s # Wait 30s before half-open
        sliding-window-size: 10          # Evaluate last 10 calls
        permitted-number-of-calls-in-half-open-state: 3
```

### Other patterns
- **Retry:** Automatic retries with exponential backoff (`@Retry`)
- **Rate Limiter:** Limit calls per time period (`@RateLimiter`)
- **Bulkhead:** Isolate failures by limiting concurrent calls (`@Bulkhead`)
- **Time Limiter:** Cancel calls that take too long (`@TimeLimiter`)

## 10. Synchronous vs. Asynchronous Communication

| Aspect | Synchronous | Asynchronous |
|:-------|:-----------|:-------------|
| **Pattern** | Request/Response | Fire-and-forget or Event-driven |
| **Coupling** | Tight (caller waits) | Loose (caller moves on) |
| **Tools** | RestTemplate, WebClient, OpenFeign | Kafka, RabbitMQ, SQS |
| **Failure impact** | Cascading failures possible | Buffered by message broker |
| **Use case** | Need immediate response (get user details) | Notifications, audit logs, data sync |

### When to use which
- **Sync:** When the caller cannot proceed without the response (e.g., checking inventory before placing an order).
- **Async:** When the caller doesn't need the result immediately (e.g., sending confirmation email, updating analytics).

### The Saga Pattern (Distributed Transactions)
For operations spanning multiple services (e.g., Order → Payment → Inventory), use the **Saga Pattern** with compensating transactions instead of distributed 2PC:
1. Order Service creates order (PENDING)
2. Payment Service charges card → success
3. Inventory Service reserves stock → **fails**
4. **Compensate:** Payment Service refunds the charge
5. Order Service marks order as CANCELLED

## 11. SQL Joins Summary

| Join Type | Description | Returns Rows When |
| :------------- | :----------------------------------------- | :----------------- |
| **Inner Join** | Returns only matching rows from both tables | Match exists in **both** tables |
| **Left Join** | All rows from left + matching from right | Always returns left table rows |
| **Right Join** | All rows from right + matching from left | Always returns right table rows |
| **Full Join** | All rows from both tables | Always returns all rows |
| **Cross Join** | Cartesian product (every combination) | No join condition (M × N rows) |
| **Self Join** | Table joined with itself | Used for hierarchies (employee/manager) |

**MySQL workaround for Full Join:**
```sql
SELECT * FROM A LEFT JOIN B ON A.id = B.id
UNION
SELECT * FROM A RIGHT JOIN B ON A.id = B.id;
```

## 12. Hibernate: First Level vs. Second Level Cache

| Feature | First Level Cache | Second Level Cache |
|:--------|:-----------------|:------------------|
| **Scope** | Per `Session` (EntityManager) | Per `SessionFactory` (application-wide) |
| **Enabled** | Always (cannot disable) | Must be explicitly configured |
| **Eviction** | When session is closed or cleared | TTL-based or manual eviction |
| **Shared** | No (each session has its own) | Yes (all sessions share) |
| **Provider** | Built into Hibernate | External: EhCache, Hazelcast, Redis |
| **Storage** | Identity Map (`Map<PK, Entity>`) | Dehydrated state (serialized form) |

### How it works

```java
Session session = sessionFactory.openSession();
User u1 = session.get(User.class, 1L); // SQL: SELECT * FROM users WHERE id=1
User u2 = session.get(User.class, 1L); // No SQL — returns from L1 cache
// u1 == u2 → true (same object reference!)

Session session2 = sessionFactory.openSession();
User u3 = session2.get(User.class, 1L); 
// Without L2: executes SQL again
// With L2: reads from L2 cache (but returns a NEW object, u3 != u1)
```

### Query Cache (Often Overlooked)
The entity cache caches by primary key. The **Query Cache** caches the results of HQL/JPQL queries (storing the list of matching IDs). Both L2 and Query Cache must be enabled for full caching benefit.

```java
@Cacheable  // Enable L2 cache for this entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Entity
public class Product { /* ... */ }
```

---
