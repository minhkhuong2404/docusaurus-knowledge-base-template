---
id: single-responsibility
title: Single Responsibility Principle
sidebar_position: 1
description: Every class should do **exactly one thing** and do it well. If a class
  is handling multiple unrelated responsibilities, then it has multiple reasons to
  change.
tags:
- technical-knowledge
- solid
- single-responsibility
---
import SolidPrinciplesDiagram from '@site/src/components/SolidPrinciplesDiagram';

# S — Single Responsibility Principle

> **"A class should have only one reason to change."**
> — Robert C. Martin

<SolidPrinciplesDiagram initialPrinciple="SRP" />

---

## 🧠 What Does It Mean?

Every class should do **exactly one thing** and do it well. If a class is handling multiple unrelated responsibilities, then it has multiple reasons to change — that's a problem.

Think of it like job roles at a company:
- A **cashier** handles payments
- A **chef** prepares food
- A **waiter** serves customers

You wouldn't ask the chef to also handle billing, right? Same idea in code.

---

## 🎯 Why Should I Care?

Imagine you join a team working on an e-commerce platform. There's a class called `OrderService` that:
- Validates order data
- Calculates prices and discounts
- Saves orders to the database
- Sends confirmation emails
- Generates PDF invoices
- Publishes analytics events

Every sprint, **someone** touches `OrderService`. The pricing team changes discount logic and accidentally breaks the email template. The infrastructure team updates the database driver and the PDF generation stops working. Nobody wants to touch this file anymore — it's become a **"god class"** that everyone fears.

**This is the cost of ignoring SRP:**
- 🐛 **More bugs** — unrelated changes interfere with each other
- 😰 **Fear-driven development** — developers avoid touching fragile code
- 🐢 **Slower delivery** — merge conflicts, long code reviews, hard-to-trace failures
- 🧪 **Untestable** — you can't test email logic without setting up a database

SRP prevents all of this by keeping each class focused on **one job**.

---

## ❌ Bad Example — Violating SRP

```java
// This class does WAY too much
public class UserService {

    public void registerUser(String username, String email) {
        // 1. Validate input
        if (username == null || email == null) {
            throw new IllegalArgumentException("Invalid input");
        }

        // 2. Save to database
        System.out.println("Saving user to DB: " + username);

        // 3. Send welcome email
        System.out.println("Sending email to: " + email);

        // 4. Log the event
        System.out.println("LOG: User registered - " + username);
    }
}
```

**Why is this bad?**
- If email logic changes → you touch `UserService`
- If logging format changes → you touch `UserService`
- If DB logic changes → you touch `UserService`
- It has **4 reasons to change** — that violates SRP!

---

## ✅ Good Example — Applying SRP

Break it into focused, single-purpose classes:

```java
// Handles only validation
public class UserValidator {
    public void validate(String username, String email) {
        if (username == null || email == null) {
            throw new IllegalArgumentException("Invalid input");
        }
    }
}
```

```java
// Handles only persistence
public class UserRepository {
    public void save(String username) {
        System.out.println("Saving user to DB: " + username);
    }
}
```

```java
// Handles only email sending
public class EmailService {
    public void sendWelcomeEmail(String email) {
        System.out.println("Sending welcome email to: " + email);
    }
}
```

```java
// Handles only logging
public class AuditLogger {
    public void log(String message) {
        System.out.println("LOG: " + message);
    }
}
```

```java
// Now UserService just orchestrates — clean and simple
public class UserService {

    private final UserValidator validator;
    private final UserRepository repository;
    private final EmailService emailService;
    private final AuditLogger logger;

    public UserService(UserValidator validator, UserRepository repository,
                       EmailService emailService, AuditLogger logger) {
        this.validator = validator;
        this.repository = repository;
        this.emailService = emailService;
        this.logger = logger;
    }

    public void registerUser(String username, String email) {
        validator.validate(username, email);
        repository.save(username);
        emailService.sendWelcomeEmail(email);
        logger.log("User registered: " + username);
    }
}
```

Now each class has **exactly one reason to change**. ✅

---

## 🔍 How to Spot Violations

Use this checklist during code reviews:

| Smell | What It Looks Like |
|---|---|
| **The "AND" test** | You describe the class as "it does X **and** Y **and** Z" |
| **Large constructor** | A class with 8+ dependencies is likely doing too many things |
| **Frequent merge conflicts** | Multiple developers touch the same file for unrelated features |
| **God class** | A file with 500+ lines that keeps growing every sprint |
| **Mixed imports** | A class importing database drivers, email libraries, and HTTP clients together |
| **Unrelated test setup** | You need to mock a database just to test email formatting logic |
| **Shotgun surgery** | A single business change requires editing many unrelated spots in one class |

**Quick mental check:** *"If I describe this class, do I need the word AND?"*

- `"This class saves users AND sends emails AND logs events"` → ❌ Violates SRP
- `"This class saves users to the database"` → ✅ Follows SRP

---

## 🌱 In a Spring Boot Application

In Spring, you naturally apply SRP using layers:

```
Controller   →  handles HTTP requests only
Service      →  handles business logic only
Repository   →  handles database access only
```

```java
@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<String> register(@RequestBody UserRequest request) {
        userService.registerUser(request.getUsername(), request.getEmail());
        return ResponseEntity.ok("User registered!");
    }
}
```

```java
@Service
public class UserService {
    // business logic only
}
```

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // DB access only
}
```

Each layer has one responsibility. Spring's annotations (`@Controller`, `@Service`, `@Repository`) are literally designed around SRP!

---

## 🏢 Real-World Use Cases

### 1. E-Commerce Order Processing

A startup initially has a single `OrderManager` class that validates, prices, persists, and notifies — all in one place. As the team grows to 20 engineers:
- The **pricing team** needs to change discount calculations weekly
- The **notifications team** is adding SMS and push channels
- The **data team** needs to emit analytics events

**SRP solution:** Split into `OrderValidator`, `PricingEngine`, `OrderRepository`, `NotificationService`, and `AnalyticsPublisher`. Each team owns their component, deploys independently, and merge conflicts disappear.

### 2. Financial Reporting System

A bank's `ReportGenerator` class fetches data from multiple sources, applies business rules, formats output as PDF/Excel/CSV, and emails the report. When auditors require a new format, the change risks breaking the data-fetching logic.

**SRP solution:** Separate into `DataAggregator`, `BusinessRuleEngine`, `ReportFormatter` (with strategy per format), and `ReportDistributor`. Adding a new format is now just a new `ReportFormatter` implementation.

### 3. User Authentication Pipeline

A monolithic `AuthService` handles password hashing, token generation, session management, rate limiting, and audit logging. A security audit reveals that changing the hashing algorithm requires testing the entire authentication flow.

**SRP solution:** Extract `PasswordHasher`, `TokenProvider`, `SessionManager`, `RateLimiter`, and `SecurityAuditLogger`. The hashing algorithm can be upgraded with confidence — it's isolated and independently testable.

---

## 🏗️ Architecture-Level Deep Dive

### SRP and Microservice Decomposition

SRP doesn't just apply to classes — it's a **fractal principle** that scales up to modules, services, and entire systems:

```
Class level   →  One class, one responsibility
Module level  →  One module, one business capability
Service level →  One microservice, one bounded context
Team level    →  One team, one domain (Conway's Law)
```

When decomposing a monolith into microservices, SRP guides the boundaries. A service that handles both "user authentication" and "user profile management" will eventually become a bottleneck — two teams will compete to deploy changes to the same service.

### SRP and Domain-Driven Design (DDD)

In DDD, SRP aligns with **bounded contexts**. Each bounded context encapsulates a single domain responsibility:

```
Order Context       →  Order lifecycle management
Payment Context     →  Payment processing and reconciliation
Shipping Context    →  Logistics and delivery tracking
Notification Context →  Multi-channel message delivery
```

A `User` entity in the Order Context only cares about delivery address and order history. The same user in the Payment Context cares about billing info and payment methods. They're different **projections** of the same real-world entity — each with a single responsibility.

### SRP and Event-Driven Architecture

SRP naturally leads to event-driven patterns. Instead of a monolithic `OrderService` that directly calls `EmailService`, `InventoryService`, and `AnalyticsService`:

```java
// SRP + Events: OrderService only handles order creation
@Service
public class OrderService {
    private final OrderRepository repository;
    private final ApplicationEventPublisher publisher;

    public Order createOrder(OrderRequest request) {
        Order order = repository.save(new Order(request));
        publisher.publishEvent(new OrderCreatedEvent(order)); // fire and forget
        return order;
    }
}

// Each listener has its own responsibility
@Component
public class OrderEmailListener {
    @EventListener
    public void onOrderCreated(OrderCreatedEvent event) {
        // send confirmation email — isolated responsibility
    }
}

@Component
public class InventoryListener {
    @EventListener
    public void onOrderCreated(OrderCreatedEvent event) {
        // reserve inventory — isolated responsibility
    }
}
```

Adding a new side-effect (e.g., analytics) means adding a new listener — `OrderService` never changes.

---

## ⚖️ Trade-offs & When NOT to Apply

### The Ravioli Code Anti-Pattern

Over-applying SRP can create "ravioli code" — hundreds of tiny classes where understanding a single business flow requires jumping through 15 files. Signs you've gone too far:

- Classes with names like `UserNameValidator`, `UserEmailValidator`, `UserAgeValidator` when they're always used together
- A simple request-response flow touches 12+ classes
- New team members spend days tracing a single operation

### When to Bend the Rule

| Scenario | Pragmatic Choice |
|---|---|
| **Prototype / MVP** | Keep responsibilities co-located until patterns emerge; extract later |
| **Simple CRUD** | A single `Service` class for straightforward entities is fine |
| **Cohesive operations** | If two operations *always* change together, they may be one responsibility |
| **Tiny microservice** | A service with 3 endpoints and 200 lines doesn't need 15 classes |

### Cohesion vs Coupling Balance

SRP is really about **high cohesion**. The goal isn't "make everything tiny" — it's "keep related things together and unrelated things apart."

**Robert C. Martin clarified this later:** *"A module should be responsible to one, and only one, actor."* It's about **who requests changes**, not about counting methods.

```
✅ High cohesion: All methods serve the same stakeholder/actor
❌ Low cohesion: Methods serve different stakeholders who change at different rates
```

---

## 🧪 Testing Implications

### How SRP Enables Better Tests

| Without SRP | With SRP |
|---|---|
| Test `registerUser()` requires mocking DB, email server, logger | Test `UserValidator` with pure unit tests — no mocks needed |
| A broken email test blocks the entire `UserService` test suite | Email tests are completely isolated from persistence tests |
| Test setup is 50+ lines of boilerplate | Test setup is 3–5 lines |
| Code coverage is misleading — testing one path exercises unrelated code | Coverage accurately reflects tested behavior |

### Testing Strategy by Layer

```java
// Pure unit test — no Spring context, no mocks
@Test
void shouldRejectNullUsername() {
    UserValidator validator = new UserValidator();
    assertThrows(IllegalArgumentException.class,
        () -> validator.validate(null, "test@mail.com"));
}

// Focused integration test — only tests persistence
@DataJpaTest
class UserRepositoryTest {
    @Autowired
    private UserRepository repository;

    @Test
    void shouldSaveUser() {
        repository.save(new User("john"));
        assertThat(repository.findByUsername("john")).isPresent();
    }
}

// Orchestration test — mocks collaborators, tests flow
@ExtendWith(MockitoExtension.class)
class UserServiceTest {
    @Mock UserValidator validator;
    @Mock UserRepository repository;
    @Mock EmailService emailService;
    @Mock AuditLogger logger;
    @InjectMocks UserService service;

    @Test
    void shouldRegisterUser() {
        service.registerUser("john", "john@mail.com");
        verify(validator).validate("john", "john@mail.com");
        verify(repository).save("john");
        verify(emailService).sendWelcomeEmail("john@mail.com");
    }
}
```

---

## 🔗 Relationship to Other SOLID Principles

| Principle | How It Connects to SRP |
|---|---|
| **Open/Closed (OCP)** | SRP classes are easier to extend without modification — each extension point is focused |
| **Liskov Substitution (LSP)** | Focused classes are less likely to violate parent contracts — fewer reasons to override incorrectly |
| **Interface Segregation (ISP)** | SRP at the interface level — if a class has one responsibility, its interface should be narrow too |
| **Dependency Inversion (DIP)** | SRP classes are natural candidates for abstraction behind interfaces — each interface represents one capability |

**SRP is the foundation.** If you get SRP right, the other four principles become much easier to follow. A class with one responsibility naturally has a narrow interface (ISP), is easier to substitute (LSP), and simpler to extend (OCP).

---

## 📌 Summary

| | Bad | Good |
|---|---|---|
| **UserService** | Validates + Saves + Emails + Logs | Only orchestrates the flow |
| **Reason to change** | 4+ reasons | 1 reason |
| **Testability** | Hard (does too much) | Easy (test each class in isolation) |

Next up: [Open/Closed Principle →](./open-closed)

---

## Interview Questions

### Q: How do you identify SRP violations in a mature codebase?
**A:** Look for classes changed by unrelated tickets, large constructor dependency lists, and methods spanning multiple concerns like validation, persistence, and notification.

### Q: Does SRP mean one method per class?
**A:** No. SRP is about one reason to change, not tiny class size. A class can have multiple methods if they serve one cohesive responsibility.

### Q: How does SRP help scaling teams?
**A:** Clear ownership boundaries reduce merge conflicts and improve parallel work. Different developers can evolve separate components independently.

### Q: What is a safe strategy to refactor a god class using SRP?
**A:** First extract pure functions, then isolate side-effect boundaries, then move cohesive clusters into new collaborators while preserving behavior with tests.

### Q: How would you explain SRP in domain-driven design terms?
**A:** Align responsibilities to domain boundaries and use cases. A class should map to a clear domain concept or application action, not mixed concerns.

### Q: What are signs of SRP over-refactoring?
**A:** Excessive indirection and too many tiny classes with unclear names, where tracing a business flow requires jumping through many files.

### Q: Why does SRP reduce production defects?
**A:** Smaller, focused units are easier to reason about and test, which reduces unintended side effects from routine changes.

### Q: How does SRP relate to observability?
**A:** Focused components emit clearer logs/metrics per concern, making troubleshooting faster during incidents.
