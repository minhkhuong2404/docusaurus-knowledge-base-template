---
id: interface-segregation
title: Interface Segregation Principle
sidebar_position: 4
---

# I — Interface Segregation Principle

> **"No client should be forced to depend on methods it does not use."**
> — Robert C. Martin

---

## 🧠 What Does It Mean?

Keep your interfaces **small and focused**. Don't create a "fat" interface that bundles unrelated methods together, forcing classes to implement things they don't need.

**Real-world analogy:** Imagine a job contract that says *"You must be able to code, cook, drive a truck, and perform surgery."* That's unreasonable! Each role should have its own specific contract.

In code terms: if a class has to implement a method just to throw `UnsupportedOperationException` or leave it empty — your interface is too fat.

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
