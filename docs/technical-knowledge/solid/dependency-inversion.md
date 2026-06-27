---
id: dependency-inversion
title: Dependency Inversion Principle
sidebar_position: 5
description: Don't let your important business logic classes depend directly on concrete
  implementations (like a specific database driver, a specific email provider, etc.).
tags:
- technical-knowledge
- solid
- dependency-inversion
---
# D — Dependency Inversion Principle

> **"High-level modules should not depend on low-level modules. Both should depend on abstractions."**
> — Robert C. Martin

---

## 🧠 What Does It Mean?

Don't let your important business logic classes depend directly on concrete implementations (like a specific database driver, a specific email provider, etc.).

Instead, both the high-level class and low-level class should **depend on an interface (abstraction)**.

**Real-world analogy:** When you plug a lamp into the wall, you don't care if the electricity comes from a coal plant, solar panels, or a nuclear reactor. The **plug socket (interface)** is the abstraction. Your lamp depends on the socket — not on where the electricity comes from. You can swap the power source without touching the lamp.

---

## 🎯 Why Should I Care?

Here's a story that plays out in real companies:

A startup builds their entire backend on AWS — S3 for file storage, SES for email, DynamoDB for data, SNS for notifications. Every service directly imports and uses AWS SDK classes:

```java
// Business logic tightly coupled to AWS
public class DocumentService {
    private final AmazonS3 s3Client = AmazonS3ClientBuilder.defaultClient();
    private final AmazonSES sesClient = AmazonSESClientBuilder.defaultClient();

    public void processDocument(Document doc) {
        s3Client.putObject("my-bucket", doc.getKey(), doc.getContent());
        sesClient.sendEmail(buildNotification(doc));
    }
}
```

Two years later, the company gets acquired. The new parent company mandates migration to **Google Cloud Platform**. Every service class that directly used AWS SDK must be rewritten — that's 150+ classes. The migration takes 9 months and introduces dozens of regressions.

**If they had applied DIP:**
- `DocumentService` depends on `FileStorage` and `EmailSender` interfaces
- AWS implementations (`S3FileStorage`, `SESEmailSender`) and GCP implementations (`GCSFileStorage`, `GmailEmailSender`) both implement the same interfaces
- Migration = swap the implementation beans. **Zero business logic changes.**

**This is the cost of ignoring DIP:**
- 🔒 **Vendor lock-in** — your business logic is married to a specific technology
- 🧪 **Untestable** — you can't unit test without a real database/cloud service
- 🐢 **Painful migrations** — switching databases, cloud providers, or libraries is a rewrite
- 🧩 **Rigid architecture** — every infrastructure change cascades through business code

---

## ❌ Bad Example — Violating DIP

```java
// Low-level class — a specific implementation
public class MySQLUserRepository {
    public void save(String username) {
        System.out.println("Saving to MySQL: " + username);
    }
}
```

```java
// High-level class depends DIRECTLY on the low-level MySQLUserRepository
public class UserService {

    // Tightly coupled to MySQL! ❌
    private MySQLUserRepository repository = new MySQLUserRepository();

    public void registerUser(String username) {
        // some business logic...
        repository.save(username);
    }
}
```

**Why is this bad?**
- Want to switch to PostgreSQL? You must modify `UserService`.
- Want to write unit tests with a fake/mock repository? You can't — it's hardcoded.
- `UserService` (high-level business logic) is directly tied to `MySQLUserRepository` (low-level detail).

---

## ✅ Good Example — Applying DIP

Introduce an interface (abstraction) that both the high-level and low-level modules depend on:

```java
// The abstraction — both sides depend on this
public interface UserRepository {
    void save(String username);
}
```

```java
// Low-level: MySQL implementation
public class MySQLUserRepository implements UserRepository {
    @Override
    public void save(String username) {
        System.out.println("Saving to MySQL: " + username);
    }
}
```

```java
// Low-level: PostgreSQL implementation (easy to add!)
public class PostgreSQLUserRepository implements UserRepository {
    @Override
    public void save(String username) {
        System.out.println("Saving to PostgreSQL: " + username);
    }
}
```

```java
// Low-level: In-memory implementation (great for testing!)
public class InMemoryUserRepository implements UserRepository {
    private final List<String> users = new ArrayList<>();

    @Override
    public void save(String username) {
        users.add(username);
        System.out.println("Saved in memory: " + username);
    }
}
```

```java
// High-level: UserService now depends on the INTERFACE, not a concrete class
public class UserService {

    private final UserRepository repository; // interface, not concrete class ✅

    // Dependency is INJECTED — not created inside
    public UserService(UserRepository repository) {
        this.repository = repository;
    }

    public void registerUser(String username) {
        // business logic...
        repository.save(username);
    }
}
```

Now you can plug in any repository without touching `UserService`!

```java
// Easily swap implementations
UserService mysqlService = new UserService(new MySQLUserRepository());
UserService postgresService = new UserService(new PostgreSQLUserRepository());
UserService testService = new UserService(new InMemoryUserRepository());
```

---

## 🔍 How to Spot Violations

| Smell | What It Means |
|---|---|
| **`new ConcreteClass()` in business logic** | High-level module directly creates low-level dependency |
| **Import of infrastructure packages** | Business class imports `com.mysql`, `com.amazonaws`, `javax.mail` |
| **Can't test without external systems** | Unit tests need a database, API key, or network connection |
| **Class name in the field type** | `private MySQLRepo repo` instead of `private UserRepo repo` |
| **Configuration scattered in code** | Connection strings, API keys hardcoded in business classes |
| **"Works on my machine"** | Different environments need different implementations but code is rigid |

### The Dependency Direction Test

Draw the dependency arrows in your code:

```
❌ Without DIP:
UserService → MySQLUserRepository → MySQL Driver
(high-level depends on low-level — dependency flows DOWN)

✅ With DIP:
UserService → UserRepository (interface) ← MySQLUserRepository
(both depend on the abstraction — dependency is INVERTED)
```

The key insight: the **interface is owned by the high-level module**, not the low-level one. The business layer defines what it needs; the infrastructure layer implements it.

---

## 🌱 In a Spring Boot Application

Spring's **dependency injection** is literally built on DIP. When you use `@Autowired` or constructor injection, Spring injects the right implementation at runtime.

```java
// The interface (abstraction)
public interface PaymentGateway {
    void charge(String customerId, double amount);
}
```

```java
// Real implementation (used in production)
@Component
@Profile("production")
public class StripePaymentGateway implements PaymentGateway {
    @Override
    public void charge(String customerId, double amount) {
        System.out.println("Charging via Stripe: $" + amount + " for customer " + customerId);
        // real Stripe API call here
    }
}
```

```java
// Fake implementation (used in development/testing)
@Component
@Profile("development")
public class MockPaymentGateway implements PaymentGateway {
    @Override
    public void charge(String customerId, double amount) {
        System.out.println("[MOCK] Fake charge of $" + amount + " for " + customerId);
    }
}
```

```java
@Service
public class OrderService {

    private final PaymentGateway paymentGateway;

    // Spring injects the right implementation based on @Profile
    public OrderService(PaymentGateway paymentGateway) {
        this.paymentGateway = paymentGateway;
    }

    public void placeOrder(String customerId, double total) {
        // business logic...
        paymentGateway.charge(customerId, total);
    }
}
```

In production → Stripe is injected.
In testing → Mock is injected.
`OrderService` **never changes** — it always works with the `PaymentGateway` interface. ✅

---

## 🏢 Real-World Use Cases

### 1. Multi-Cloud Portability

A SaaS company needs to deploy on both AWS and Azure to serve different enterprise clients:

```java
// Ports (interfaces owned by the domain)
public interface FileStorage {
    void upload(String path, byte[] data);
    byte[] download(String path);
    void delete(String path);
}

public interface MessageQueue {
    void publish(String topic, String message);
    void subscribe(String topic, Consumer<String> handler);
}
```

```java
// AWS Adapters
@Component @Profile("aws")
public class S3FileStorage implements FileStorage { /* AWS S3 SDK calls */ }

@Component @Profile("aws")
public class SQSMessageQueue implements MessageQueue { /* AWS SQS SDK calls */ }

// Azure Adapters
@Component @Profile("azure")
public class BlobFileStorage implements FileStorage { /* Azure Blob SDK calls */ }

@Component @Profile("azure")
public class ServiceBusMessageQueue implements MessageQueue { /* Azure Service Bus calls */ }
```

Switching cloud providers is a **configuration change**, not a code change:

```yaml
# application-aws.yml
spring.profiles.active: aws

# application-azure.yml
spring.profiles.active: azure
```

### 2. Database Migration

A growing startup needs to migrate from MongoDB to PostgreSQL as their data model stabilizes:

```java
// Domain defines what it needs
public interface OrderRepository {
    Order save(Order order);
    Optional<Order> findById(String id);
    List<Order> findByCustomer(String customerId);
    void deleteById(String id);
}

// Phase 1: MongoDB implementation (current)
@Repository @Profile("mongo")
public class MongoOrderRepository implements OrderRepository {
    @Autowired private MongoTemplate mongoTemplate;
    // MongoDB-specific implementation
}

// Phase 2: PostgreSQL implementation (migration target)
@Repository @Profile("postgres")
public class JpaOrderRepository implements OrderRepository {
    @Autowired private JpaOrderJpaRepository jpaRepo;
    // JPA-specific implementation
}

// Phase 3: Dual-write implementation (migration period)
@Repository @Profile("migration")
public class DualWriteOrderRepository implements OrderRepository {
    private final MongoOrderRepository mongoRepo;
    private final JpaOrderRepository jpaRepo;

    @Override
    public Order save(Order order) {
        mongoRepo.save(order);    // write to old
        return jpaRepo.save(order); // write to new
    }
    // ... read from new, fallback to old
}
```

The business logic (`OrderService`) **never changes** throughout the entire migration.

### 3. A/B Testing Infrastructure

A product team needs to test different recommendation algorithms:

```java
public interface RecommendationEngine {
    List<Product> recommend(User user, int count);
}

@Component("collaborative")
public class CollaborativeFilteringEngine implements RecommendationEngine {
    // Based on similar users' behavior
}

@Component("content-based")
public class ContentBasedEngine implements RecommendationEngine {
    // Based on product attributes
}

@Component("ml-model-v2")
public class MLModelV2Engine implements RecommendationEngine {
    // New ML model being A/B tested
}

@Service
public class ProductPageService {
    private final Map<String, RecommendationEngine> engines;

    public List<Product> getRecommendations(User user) {
        String variant = abTestService.getVariant(user, "recommendation-algo");
        return engines.get(variant).recommend(user, 10);
    }
}
```

New recommendation algorithms are deployed **without touching the product page service**.

---

## 🏗️ Architecture-Level Deep Dive

### Hexagonal Architecture (Ports and Adapters)

DIP is the **foundation** of Hexagonal Architecture, one of the most important architectural patterns for enterprise applications:

```
                    ┌─────────────────────────┐
   Driving Adapters │                         │  Driven Adapters
                    │                         │
  [REST Controller] │    ┌─────────────┐      │  [MySQL Repository]
  [GraphQL API]     │───▶│   DOMAIN    │◀─────│  [Redis Cache]
  [CLI Command]     │    │   (Core     │      │  [Stripe Gateway]
  [Event Listener]  │    │   Business  │      │  [S3 File Storage]
                    │    │   Logic)    │      │  [Kafka Producer]
                    │    └─────────────┘      │
                    │     ▲           ▲       │
                    │   Ports       Ports     │
                    │  (Input)    (Output)    │
                    └─────────────────────────┘
```

**Key rules:**
1. The **domain** (center) defines interfaces (ports) — it has ZERO external dependencies
2. **Adapters** (outer ring) implement the ports — they depend on the domain
3. Dependencies always point **inward** (toward the domain)
4. The domain is **pure business logic** — no frameworks, no databases, no HTTP

```java
// Port (defined by domain — the domain OWNS this interface)
package com.app.domain.port;

public interface OrderPort {
    Order save(Order order);
    Optional<Order> findById(OrderId id);
}
```

```java
// Adapter (implements the port — infrastructure depends on domain)
package com.app.infrastructure.persistence;

@Repository
public class JpaOrderAdapter implements OrderPort {
    @Autowired private JpaOrderRepository jpaRepo;

    @Override
    public Order save(Order order) {
        OrderEntity entity = OrderMapper.toEntity(order);
        return OrderMapper.toDomain(jpaRepo.save(entity));
    }
}
```

### Dependency Graphs and the Acyclic Dependency Principle

DIP helps avoid **circular dependencies** — a major source of architectural rot:

```
❌ Circular dependency (compilation/deployment nightmare)
OrderService → PaymentService → NotificationService → OrderService

✅ DIP breaks the cycle
OrderService → PaymentPort (interface) ← PaymentService
                                           ↓
                               NotificationPort (interface) ← NotificationService
```

By depending on interfaces rather than concrete classes, you naturally break cycles and create a **Directed Acyclic Graph (DAG)** of dependencies.

### DIP in Java Module System (JPMS)

Java 9+ modules enforce DIP at the package level:

```java
// Domain module — defines ports, has NO infrastructure dependencies
module com.app.domain {
    exports com.app.domain.model;
    exports com.app.domain.port;
    // NOTE: does NOT require any infrastructure modules
}

// Infrastructure module — implements ports
module com.app.infrastructure.mysql {
    requires com.app.domain;  // depends on domain
    requires java.sql;         // infrastructure detail

    provides com.app.domain.port.UserRepository
        with com.app.infrastructure.mysql.MySQLUserRepository;
}

// Application module — wires everything together
module com.app.application {
    requires com.app.domain;
    requires com.app.infrastructure.mysql;
    uses com.app.domain.port.UserRepository;
}
```

### DIP and Clean Architecture Layers

Robert C. Martin's Clean Architecture is built entirely on DIP:

```
┌──────────────────────────────────────────────┐
│              Frameworks & Drivers             │  ← Spring, MySQL, S3
│  ┌────────────────────────────────────────┐   │
│  │         Interface Adapters             │   │  ← Controllers, Gateways
│  │  ┌──────────────────────────────────┐  │   │
│  │  │       Application Business       │  │   │  ← Use Cases
│  │  │  ┌────────────────────────────┐  │  │   │
│  │  │  │  Enterprise Business Rules │  │  │   │  ← Entities, Domain
│  │  │  └────────────────────────────┘  │  │   │
│  │  └──────────────────────────────────┘  │   │
│  └────────────────────────────────────────┘   │
└──────────────────────────────────────────────┘

Dependency Rule: Dependencies ALWAYS point inward.
Inner layers NEVER know about outer layers.
This is DIP applied at every boundary.
```

### IoC Containers Beyond Spring

DIP is a **principle** — dependency injection is a **mechanism**. Different ecosystems implement it differently:

| Framework | DI Mechanism |
|---|---|
| **Spring** | `@Autowired`, `@Component`, `@Profile` |
| **Jakarta CDI** | `@Inject`, `@Produces`, `@Alternative` |
| **Guice** | `@Inject`, Module bindings |
| **Dagger** | `@Inject`, `@Component`, compile-time DI |
| **Manual** | Constructor injection without any framework |

You don't need a framework to apply DIP — it's about **design**, not tooling:

```java
// Pure DIP — no framework needed
public class Application {
    public static void main(String[] args) {
        UserRepository repo = new MySQLUserRepository(dataSource);
        EmailService email = new SmtpEmailService(smtpConfig);
        UserService service = new UserService(repo, email);
        // Dependencies are inverted and injected manually
    }
}
```

---

## ⚖️ Trade-offs & When NOT to Apply

### When Abstraction Is Overhead

Not every class needs an interface. Creating abstractions for single, stable implementations adds indirection with no benefit:

```java
// Over-engineered — this will only ever have one implementation
public interface StringUtils {
    String capitalize(String input);
    String truncate(String input, int maxLength);
}

public class StringUtilsImpl implements StringUtils {
    // ... the only implementation, forever
}

// Just use a utility class directly
public final class StringUtils {
    public static String capitalize(String input) { /* ... */ }
    public static String truncate(String input, int maxLength) { /* ... */ }
}
```

### Decision Framework: When to Abstract

| Question | If Yes → Abstract | If No → Direct |
|---|---|---|
| Will there be multiple implementations? | ✅ | |
| Do you need to mock this in tests? | ✅ | |
| Is it an external system (DB, API, file system)? | ✅ | |
| Could the technology change? | ✅ | |
| Is it pure business logic with no side effects? | | ✅ |
| Is it a utility/helper class? | | ✅ |
| Is it framework-specific glue code? | | ✅ |

### The Cost of Interface Proliferation

Every interface adds:
- **A file to navigate** — IDE has one more type to search through
- **Indirection** — debugging requires one more "Go to Implementation" click
- **Naming burden** — `UserService` vs `UserServiceImpl` is a known anti-pattern

**Anti-pattern alert:** If every class in your project has a corresponding interface with `Impl` suffix, you're probably over-abstracting:

```java
// Meaningless abstraction — 1:1 interface-to-impl ratio
public interface UserService { /* ... */ }
public class UserServiceImpl implements UserService { /* ... */ }

// Better: only create interfaces where multiple implementations exist or are expected
public class UserService {
    private final UserRepository repository; // THIS has multiple impls — worth abstracting
    // UserService itself is a concrete class — fine!
}
```

### Pragmatic DIP

Apply DIP at **architectural boundaries** where the cost of coupling is highest:

```
Apply DIP here (high-value boundaries):
├── Database access       → Repository interfaces
├── External APIs         → Gateway/Client interfaces
├── File storage          → Storage interfaces
├── Message queues        → Publisher/Subscriber interfaces
└── Third-party services  → Adapter interfaces

Skip DIP here (low-value, internal):
├── Utility classes       → Use directly
├── DTOs and value objects → Use directly
├── Framework config      → Use directly
└── Internal helpers      → Use directly
```

---

## 🧪 Testing Implications

### The Testing Trinity: Fake vs Mock vs Stub

DIP enables three types of test doubles, each serving a different purpose:

| Type | Purpose | Example |
|---|---|---|
| **Stub** | Returns pre-configured values | `when(repo.findById(1L)).thenReturn(user)` |
| **Mock** | Verifies interactions occurred | `verify(emailService).sendWelcomeEmail(email)` |
| **Fake** | Working lightweight implementation | `InMemoryUserRepository` with a `HashMap` |

```java
// Fake — the most powerful test double for DIP
public class InMemoryUserRepository implements UserRepository {
    private final Map<Long, User> store = new HashMap<>();
    private long sequence = 0;

    @Override
    public User save(User user) {
        user.setId(++sequence);
        store.put(user.getId(), user);
        return user;
    }

    @Override
    public Optional<User> findById(Long id) {
        return Optional.ofNullable(store.get(id));
    }

    @Override
    public List<User> findAll() {
        return new ArrayList<>(store.values());
    }

    @Override
    public void deleteById(Long id) {
        store.remove(id);
    }
}
```

### Testing at Architectural Boundaries

```java
// Unit test — uses fakes, fast, no Spring context
class UserServiceTest {
    private final UserRepository repo = new InMemoryUserRepository();
    private final EmailService email = new NoOpEmailService();
    private final UserService service = new UserService(repo, email);

    @Test
    void shouldRegisterUser() {
        service.registerUser("john", "john@mail.com");
        assertThat(repo.findAll()).hasSize(1);
    }
}

// Integration test — verifies real adapter works correctly
@DataJpaTest
class JpaUserRepositoryIntegrationTest {
    @Autowired private JpaUserRepository repository;

    @Test
    void shouldPersistAndRetrieveUser() {
        User saved = repository.save(new User("john"));
        assertThat(repository.findById(saved.getId())).isPresent();
    }
}

// Contract test — ensures ALL implementations behave the same
abstract class UserRepositoryContractTest {
    abstract UserRepository createRepository();

    @Test
    void saveShouldAssignId() {
        User user = createRepository().save(new User("john"));
        assertThat(user.getId()).isNotNull();
    }

    @Test
    void findByIdShouldReturnSavedUser() {
        UserRepository repo = createRepository();
        User saved = repo.save(new User("john"));
        assertThat(repo.findById(saved.getId())).contains(saved);
    }
}
```

### Test Speed Impact

| Approach | Test Speed | Why |
|---|---|---|
| **Direct DB dependency** | ~200ms/test | Real database connection per test |
| **Mocked dependency** | ~5ms/test | No I/O, but fragile to refactoring |
| **Fake implementation** | ~1ms/test | In-memory, realistic behavior, refactor-safe |

A suite of 500 tests:
- Without DIP (real DB): **100 seconds** 🐢
- With DIP (fakes): **0.5 seconds** 🚀

---

## 🔗 Relationship to Other SOLID Principles

| Principle | How It Connects to DIP |
|---|---|
| **Single Responsibility (SRP)** | SRP creates focused classes that are natural candidates for abstraction behind interfaces |
| **Open/Closed (OCP)** | DIP is the **mechanism** that enables OCP — new implementations extend behavior without modifying existing code |
| **Liskov Substitution (LSP)** | DIP makes substitution possible; LSP ensures it's safe — both are needed for reliable polymorphism |
| **Interface Segregation (ISP)** | ISP ensures the interfaces that DIP depends on are small and focused, not bloated |

**DIP is the architectural enabler.** While the other four principles guide class-level design, DIP shapes how entire modules and systems are structured. It's the principle that makes your architecture **pluggable, testable, and future-proof**.

**The SOLID synergy chain:**
```
SRP → focused classes
ISP → focused interfaces for those classes
DIP → depend on those focused interfaces
OCP → extend by adding new implementations
LSP → new implementations are safe substitutions
```

---

## 🔑 Key Concepts

| Term | Meaning |
|---------|---------|
| **High-level module** | Your business logic (`OrderService`, `UserService`) |
| **Low-level module** | The detail (`MySQLRepo`, `StripeGateway`, `EmailSender`) |
| **Abstraction** | The interface that sits between them |
| **Dependency Injection** | Providing the dependency from outside (constructor injection) |
| **Inversion of Control (IoC)** | The framework controls object lifecycle, not your code |
| **Port** | An interface defined by the domain (hexagonal architecture) |
| **Adapter** | An implementation of a port for a specific technology |

---

## 💡 Quick Rule of Thumb

If you see `new ConcreteClass()` **inside** a service or business class, ask yourself: *"Should this be an interface instead?"*

A high-level class should **never** call `new` on a low-level class. Let Spring (or another IoC container) manage that.

---

## 📌 Summary

| | Bad | Good |
|---|---|---|
| **Dependency on** | Concrete class (`MySQLUserRepository`) | Interface (`UserRepository`) |
| **How created** | `new MySQLUserRepository()` inside service | Injected via constructor |
| **Swap implementation** | Must modify business class | Just provide a different bean |
| **Testability** | Hard — can't mock | Easy — inject a test double |

You've completed all 5 SOLID principles! [See the full summary →](./summary)

---

## Interview Questions

### Q: How is DIP different from dependency injection?
**A:** DIP is a design principle about dependency direction toward abstractions. Dependency injection is a technique to provide those abstractions at runtime.

### Q: In a Spring application, who should own repository interfaces?
**A:** The domain/application layer should own the interface contract. Infrastructure modules implement it. This preserves business-level control over required behavior.

### Q: What is the risk of putting framework-specific types in domain interfaces?
**A:** It leaks infrastructure concerns into core business logic, making tests and future migrations harder.

### Q: How would you apply DIP to external integrations like payment and notification providers?
**A:** Define provider-agnostic ports (interfaces), implement adapters per vendor, and wire adapter selection via configuration/profile.

### Q: What interview answer shows mature DIP usage in testing?
**A:** Use contract-focused fakes for domain tests and thin mocks only at boundaries. This validates behavior without over-coupling tests to implementation details.

### Q: When can DIP be overused?
**A:** Creating interfaces for classes with a single stable implementation and no testing pressure can add unnecessary indirection.

### Q: How do you migrate from hardcoded dependencies to DIP safely?
**A:** Introduce an interface around the existing concrete class, inject it through constructors, update call sites incrementally, and keep behavior unchanged with regression tests.

### Q: What does good DIP look like in incident response?
**A:** You can quickly replace failing adapters (for example, switch to fallback provider) without changing core business services.
