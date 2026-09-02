---
id: interface-segregation
title: Interface Segregation Principle
sidebar_position: 4
description: Keep your interfaces **small and focused**. Don't create a "fat" interface
  that bundles unrelated methods together, forcing classes to implement things they.
tags:
- technical-knowledge
- solid
- interface-segregation
---
import SolidPrinciplesDiagram from '@site/src/components/SolidPrinciplesDiagram';

# I — Interface Segregation Principle

> **"No client should be forced to depend on methods it does not use."**
> — Robert C. Martin

<SolidPrinciplesDiagram initialPrinciple="ISP" />

---

## 🧠 What Does It Mean?

Keep your interfaces **small and focused**. Don't create a "fat" interface that bundles unrelated methods together, forcing classes to implement things they don't need.

**Real-world analogy:** Imagine a job contract that says *"You must be able to code, cook, drive a truck, and perform surgery."* That's unreasonable! Each role should have its own specific contract.

In code terms: if a class has to implement a method just to throw `UnsupportedOperationException` or leave it empty — your interface is too fat.

---

## 🎯 Why Should I Care?

Consider this scenario: A company has a shared `UserService` interface used by both the **web dashboard team** and the **mobile API team**:

```java
public interface UserService {
    UserProfile getProfile(Long userId);
    void updateProfile(Long userId, UserProfile profile);
    List<ActivityLog> getActivityLog(Long userId);        // only web needs this
    DashboardStats getDashboardStats(Long userId);        // only web needs this
    MobileSettings getMobileSettings(Long userId);        // only mobile needs this
    void registerPushToken(Long userId, String token);    // only mobile needs this
}
```

Now every time the web team adds a dashboard feature, the method signature changes, and the **mobile team's build breaks** — even though they don't use that method. The mobile team must recompile, redeploy, and re-test... for a change that doesn't affect them at all.

**This is the cost of fat interfaces:**
- 🔗 **Unnecessary coupling** — teams that share a fat interface are coupled to each other's changes
- 🏗️ **Forced recompilation** — adding a method forces ALL implementors to update, even if irrelevant
- 🧟 **Zombie code** — empty implementations and `UnsupportedOperationException` litter the codebase
- 🧪 **Test pollution** — mocking a fat interface requires stubbing methods you don't care about
- 🚀 **Deployment coupling** — independent teams must coordinate releases because of a shared interface

ISP says: **split that interface** so each client depends only on what it actually uses.

---

## ❌ Bad Example — Violating ISP

```java
// One giant interface for ALL types of workers
public interface Worker {
    void work();
    void eat();
    void sleep();
    void attendMeeting();
    void writeReport();
}
```

```java
// A human employee — fine, they do all of this
public class HumanEmployee implements Worker {
    @Override public void work()          { System.out.println("Working..."); }
    @Override public void eat()           { System.out.println("Having lunch..."); }
    @Override public void sleep()         { System.out.println("Going home to sleep..."); }
    @Override public void attendMeeting() { System.out.println("In a meeting..."); }
    @Override public void writeReport()   { System.out.println("Writing report..."); }
}
```

```java
// A robot worker — it doesn't eat, sleep, or attend meetings!
public class RobotWorker implements Worker {
    @Override public void work()          { System.out.println("Working 24/7..."); }
    @Override public void eat()           { /* Robots don't eat — but forced to implement this! */ }
    @Override public void sleep()         { /* Robots don't sleep — but forced to implement this! */ }
    @Override public void attendMeeting() { /* N/A — forced anyway! */ }
    @Override public void writeReport()   { System.out.println("Generating report..."); }
}
```

`RobotWorker` is forced to implement 3 methods it has no use for. This is **interface pollution** — a sign that `Worker` is trying to do too much.

---

## ✅ Good Example — Applying ISP

Split the fat interface into small, focused ones:

```java
public interface Workable {
    void work();
}

public interface Eatable {
    void eat();
}

public interface Sleepable {
    void sleep();
}

public interface Meetable {
    void attendMeeting();
}

public interface Reportable {
    void writeReport();
}
```

Now each class only implements what it actually does:

```java
// Human implements everything relevant to them
public class HumanEmployee implements Workable, Eatable, Sleepable, Meetable, Reportable {
    @Override public void work()          { System.out.println("Working..."); }
    @Override public void eat()           { System.out.println("Having lunch..."); }
    @Override public void sleep()         { System.out.println("Going home to sleep..."); }
    @Override public void attendMeeting() { System.out.println("In a meeting..."); }
    @Override public void writeReport()   { System.out.println("Writing report..."); }
}
```

```java
// Robot only implements what's relevant
public class RobotWorker implements Workable, Reportable {
    @Override public void work()        { System.out.println("Working 24/7..."); }
    @Override public void writeReport() { System.out.println("Generating report..."); }
}
```

No empty methods. No forced implementations. ✅

---

## 🔍 How to Spot Violations

| Smell | What It Means |
|---|---|
| **Empty method bodies** | The class doesn't need this method but is forced to implement it |
| **`throw new UnsupportedOperationException()`** | The contract demands something the class can't do |
| **`// not applicable` comments** | A telltale sign of a forced implementation |
| **Mocking unused methods in tests** | Your test doubles stub methods that aren't relevant to the test |
| **One interface, many disparate methods** | Methods that serve different clients bundled together |
| **Changes to one method affect unrelated implementors** | Adding a method forces ALL implementations to change |
| **Different clients use different subsets** | Some callers use methods A/B, others use C/D — same interface |

### The Client-Usage Test

Look at your interface from each **client's** perspective:

```
Interface: UserService (10 methods)
├── WebController uses:    getProfile, updateProfile, getDashboardStats, getActivityLog
├── MobileController uses: getProfile, getMobileSettings, registerPushToken
└── AdminController uses:  getProfile, updateProfile, deleteUser, exportData

→ Three clients, three different subsets → split into 3+ interfaces!
```

---

## 🌱 In a Spring Boot Application

A very common real-world example: repository interfaces.

```java
// ❌ One fat repository interface
public interface UserRepository {
    User findById(Long id);
    List<User> findAll();
    void save(User user);
    void delete(Long id);
    List<User> generateReport();      // belongs here? 🤔
    void sendWelcomeEmail(User user); // definitely not a repository concern! ❌
}
```

```java
// ✅ Segregated interfaces — each does one thing
public interface UserReadRepository {
    User findById(Long id);
    List<User> findAll();
}

public interface UserWriteRepository {
    void save(User user);
    void delete(Long id);
}

public interface UserReportRepository {
    List<User> generateReport();
}
```

```java
// A read-only service only depends on what it needs
@Service
public class UserQueryService {

    private final UserReadRepository readRepository;

    public UserQueryService(UserReadRepository readRepository) {
        this.readRepository = readRepository;
    }

    public User getUser(Long id) {
        return readRepository.findById(id);
    }
}
```

---

## 🌱 Another Spring Example: Service Interfaces

```java
// ❌ Fat interface — forces SMS service to also "send email"
public interface MessageService {
    void sendEmail(String to, String subject, String body);
    void sendSms(String to, String message);
    void sendPushNotification(String deviceToken, String message);
}
```

```java
// ✅ Segregated
public interface EmailSender {
    void sendEmail(String to, String subject, String body);
}

public interface SmsSender {
    void sendSms(String to, String message);
}

public interface PushSender {
    void sendPushNotification(String deviceToken, String message);
}
```

```java
@Component
public class SmsService implements SmsSender {
    @Override
    public void sendSms(String to, String message) {
        System.out.println("SMS to " + to + ": " + message);
    }
}
```

Now `SmsService` only knows about SMS. It won't be affected if email logic changes.

---

## 🏢 Real-World Use Cases

### 1. CQRS (Command Query Responsibility Segregation)

CQRS is ISP applied at the architectural level — separating **read** and **write** operations:

```java
// ❌ One interface for everything
public interface OrderRepository {
    Order findById(Long id);
    List<Order> findByCustomer(Long customerId);
    List<OrderSummary> getAnalyticsSummary(DateRange range);  // read-heavy
    void save(Order order);                                    // write
    void updateStatus(Long id, OrderStatus status);           // write
}
```

```java
// ✅ ISP applied: separate read and write ports
public interface OrderQueryPort {
    Order findById(Long id);
    List<Order> findByCustomer(Long customerId);
}

public interface OrderAnalyticsPort {
    List<OrderSummary> getAnalyticsSummary(DateRange range);
}

public interface OrderCommandPort {
    void save(Order order);
    void updateStatus(Long id, OrderStatus status);
}
```

**Benefits:** The read side can be optimized independently (caching, read replicas). The write side can focus on consistency. Analytics can use a completely different data store.

### 2. Multi-Channel Notification System

A SaaS platform sends notifications via email, SMS, push, Slack, and in-app messages. Different notification types need different channels:

```java
// ✅ ISP: Each channel is its own capability
public interface EmailCapable {
    void sendEmail(String to, String subject, String body);
}

public interface SmsCapable {
    void sendSms(String phoneNumber, String message);
}

public interface SlackCapable {
    void sendSlackMessage(String channel, String message);
}

public interface PushCapable {
    void sendPush(String deviceToken, String title, String body);
}

// Different notification types compose different capabilities
@Service
public class OrderNotifier implements EmailCapable, PushCapable {
    // Orders send email + push, but NOT Slack or SMS
}

@Service
public class AlertNotifier implements EmailCapable, SlackCapable, SmsCapable {
    // Alerts go to email + Slack + SMS for urgency
}
```

### 3. Role-Based API Permissions

A REST API serves different user roles with different capabilities:

```java
// ✅ ISP aligns with role boundaries
public interface ViewerApi {
    List<Report> listReports();
    Report getReport(Long id);
}

public interface EditorApi extends ViewerApi {
    Report createReport(ReportRequest request);
    Report updateReport(Long id, ReportRequest request);
}

public interface AdminApi extends EditorApi {
    void deleteReport(Long id);
    void manageUsers();
    AuditLog getAuditLog();
}
```

Each controller implements only the API surface for its role. A `ViewerController` never sees `deleteReport()`.

---

## 🏗️ Architecture-Level Deep Dive

### ISP and API Gateway Design

In microservice architectures, fat APIs at the gateway level create the same problems as fat interfaces:

```
❌ Fat Gateway API
/api/users         → ALL user operations (profile, settings, admin, analytics)
                     Every client gets endpoints they don't need
                     Mobile app downloads OpenAPI spec with 200 irrelevant endpoints

✅ ISP-Applied Gateway (Backend for Frontend pattern)
/api/web/users     → Web-specific user operations
/api/mobile/users  → Mobile-specific user operations  
/api/admin/users   → Admin-specific user operations
```

This pattern is called **Backend for Frontend (BFF)** — it's ISP at the API level.

### ISP and GraphQL vs REST

GraphQL naturally applies ISP by letting clients request **only the fields they need**:

```graphql
# Mobile client — only needs name and avatar
query {
  user(id: 123) {
    name
    avatarUrl
  }
}

# Web dashboard — needs full profile with activity
query {
  user(id: 123) {
    name
    email
    role
    activityLog {
      action
      timestamp
    }
    dashboardStats {
      loginCount
      lastActive
    }
  }
}
```

With REST, this would require either:
- A fat `/users/:id` endpoint returning everything (violates ISP)
- Multiple specialized endpoints (applies ISP manually)

### Role Interfaces vs Header Interfaces

There are two ways to design interfaces:

| Type | Description | Example |
|---|---|---|
| **Header Interface** | Mirrors the full public API of a class | `public interface UserService` with ALL methods |
| **Role Interface** | Describes a specific capability/role | `Readable`, `Writable`, `Cacheable` |

**ISP favors Role Interfaces.** Design interfaces based on what **clients need**, not what **implementations offer**.

```java
// Header Interface (anti-ISP) — mirrors the implementation
public interface UserService {
    User findById(Long id);
    List<User> findAll();
    void save(User user);
    void delete(Long id);
    UserStats getStats(Long id);
    void sendNotification(Long id, String message);
}

// Role Interfaces (pro-ISP) — designed for specific clients
public interface UserFinder {        // used by: read-only services
    User findById(Long id);
    List<User> findAll();
}

public interface UserPersistence {   // used by: write services
    void save(User user);
    void delete(Long id);
}

public interface UserNotifier {      // used by: notification service
    void sendNotification(Long id, String message);
}
```

### Consumer-Driven Contracts

In microservice architectures, ISP maps to **Consumer-Driven Contract Testing** (popularized by Pact):

```
Service A (Provider) exposes: /users/{id}

Consumer 1 (Mobile) expects: { name, avatar }
Consumer 2 (Web)    expects: { name, email, role, lastLogin }
Consumer 3 (Admin)  expects: { name, email, role, permissions, auditLog }

Each consumer defines its OWN contract (ISP!) — the provider must satisfy ALL contracts
but each consumer only cares about its subset.
```

### ISP and Java Module System (JPMS)

Java 9+ modules enforce ISP at the package level:

```java
// module-info.java for the domain module
module com.app.domain {
    exports com.app.domain.read;    // read-only port
    exports com.app.domain.write;   // write port
    // internal implementation packages are NOT exported
}

// module-info.java for the query service
module com.app.query {
    requires com.app.domain;
    // can only access read port — write port methods not visible
}
```

---

## ⚖️ Trade-offs & When NOT to Apply

### Interface Explosion

The biggest risk of over-applying ISP is **interface explosion** — too many tiny interfaces that make navigation and comprehension harder:

```java
// Over-segregated — these are always used together
public interface Nameable { String getName(); }
public interface Ageable { int getAge(); }
public interface Emailable { String getEmail(); }
public interface Addressable { Address getAddress(); }
public interface Phoneable { String getPhone(); }

// This is ridiculous — just use a single interface
public interface Person {
    String getName();
    int getAge();
    String getEmail();
    Address getAddress();
    String getPhone();
}
```

### When to Split vs. When to Keep Unified

| Split When | Keep Unified When |
|---|---|
| Different clients use different method subsets | All clients use all methods |
| Methods change at different rates | Methods change together |
| Different teams own different implementations | One team owns everything |
| You see empty/no-op implementations | All implementations are complete |
| You're designing a public API or library | Internal implementation detail |
| The interface has 10+ methods serving different concerns | The interface has 3–5 cohesive methods |

### The "Same Client" Rule

**If the same client always uses all methods of an interface, don't split it.** ISP is about **client-driven design**, not "make everything tiny."

```java
// These 4 methods are ALWAYS used together in every client → don't split
public interface Connection {
    void open();
    void close();
    boolean isOpen();
    void send(byte[] data);
}
```

### Refactoring Strategy: Gradual Split

Don't try to split a fat interface all at once in a large codebase. Use a phased approach:

```java
// Phase 1: Introduce new focused interface, extend old one for compatibility
public interface UserReader {
    User findById(Long id);
    List<User> findAll();
}

// Old fat interface now extends the new one — backward compatible
public interface UserRepository extends UserReader {
    void save(User user);
    void delete(Long id);
}

// Phase 2: Migrate clients one-by-one to use UserReader instead of UserRepository
// Phase 3: Once all read-only clients migrated, remove unused methods from UserRepository
```

---

## 🧪 Testing Implications

### Focused Test Doubles

With ISP, your test doubles (mocks, stubs, fakes) are **minimal and focused**:

```java
// ❌ Without ISP: Mock requires stubbing 10 methods, you only use 2
@Mock UserRepository repository; // 10 methods to potentially stub
// when(repository.findById(1L)).thenReturn(user);
// The other 8 methods? Ignored, but still pollute your mock setup.

// ✅ With ISP: Mock is focused — only the methods you need
@Mock UserReader userReader; // only 2 methods: findById, findAll
when(userReader.findById(1L)).thenReturn(user);
// Clean, minimal, clearly communicates what the test cares about
```

### Verifying Interface Segregation in Tests

If you find yourself doing this in tests, it's a sign to split:

```java
// 🚩 Red flag — stubbing methods you don't care about to satisfy the interface
@Mock UserService userService;

@BeforeEach
void setup() {
    // Required by interface but NOT by this test
    when(userService.findAll()).thenReturn(Collections.emptyList());
    when(userService.getStats(anyLong())).thenReturn(new UserStats());
    when(userService.getDashboardData()).thenReturn(null);

    // This is the ONLY method this test actually uses
    when(userService.findById(1L)).thenReturn(testUser);
}
```

### Testing Strategy Per Interface

```java
// Each segregated interface gets its own test class
class UserReaderTest {
    // Only tests read operations
    @Test void shouldFindUserById() { /* ... */ }
    @Test void shouldReturnAllUsers() { /* ... */ }
}

class UserWriterTest {
    // Only tests write operations
    @Test void shouldSaveUser() { /* ... */ }
    @Test void shouldDeleteUser() { /* ... */ }
}

class UserReporterTest {
    // Only tests reporting operations
    @Test void shouldGenerateUserReport() { /* ... */ }
}
```

---

## 🔗 Relationship to Other SOLID Principles

| Principle | How It Connects to ISP |
|---|---|
| **Single Responsibility (SRP)** | SRP at the class level, ISP at the interface level — both promote focus and cohesion |
| **Open/Closed (OCP)** | Narrow interfaces are easier to extend with new implementations — fewer methods to implement |
| **Liskov Substitution (LSP)** | ISP **prevents** LSP violations — if a class only implements interfaces it can fully support, no empty/throwing overrides |
| **Dependency Inversion (DIP)** | DIP says "depend on abstractions" — ISP says "make those abstractions small and meaningful" |

**ISP and LSP are best friends.** Most LSP violations happen because a fat interface forces a class to implement methods it can't support. Split the interface (ISP), and the LSP violation disappears:

```java
// Fat interface → LSP violation
class GiftCard extends PaymentProcessor {
    void refund() { throw new UnsupportedOperationException(); } // ❌ LSP violation
}

// Split interface (ISP) → LSP violation gone
class GiftCard implements Payable {
    // Only implements what it can do ✅ — no refund method to violate
}
```

---

## 💡 Quick Rule of Thumb

If you see `// not applicable` comments or empty implementations in a class, your interface is likely **too fat** — time to split it up.

---

## 📌 Summary

| | Bad | Good |
|---|---|---|
| **Interface size** | One big interface with everything | Many small, focused interfaces |
| **Implementation** | Classes forced to implement irrelevant methods | Each class only implements what it needs |
| **Impact of change** | Changing one method can ripple everywhere | Changes are isolated |

Next up: [Dependency Inversion Principle →](./dependency-inversion)

---

## Interview Questions

### Q: How does ISP reduce blast radius in large systems?
**A:** Smaller interfaces isolate change impact. Updating one capability contract does not force unrelated consumers to recompile or adapt.

### Q: What are indicators of a fat interface in backend services?
**A:** Many methods unused by each consumer, repeated no-op implementations, and frequent breaking changes across unrelated teams.

### Q: How does ISP help with microservice API design?
**A:** It encourages consumer-oriented contracts, reducing over-fetching/under-fetching and making service boundaries clearer.

### Q: Should you split every interface aggressively?
**A:** No. Split by client usage patterns. Too many tiny interfaces with no distinct clients can make navigation harder.

### Q: How does ISP improve test quality?
**A:** Test doubles only implement needed methods, which keeps tests focused and reduces mock maintenance overhead.

### Q: What is a practical ISP pattern with Spring repositories?
**A:** Define separate read and write ports, then inject only the required port into each use case.

### Q: How do ISP and DIP reinforce each other?
**A:** DIP depends on abstractions, and ISP makes those abstractions minimal and meaningful for each client.

### Q: What migration path do you use when splitting a fat interface?
**A:** Introduce small interfaces, adapt existing implementation to support both temporarily, move consumers incrementally, then remove the old interface.
