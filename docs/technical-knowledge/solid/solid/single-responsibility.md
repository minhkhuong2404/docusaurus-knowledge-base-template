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
# S — Single Responsibility Principle

> **"A class should have only one reason to change."**
> — Robert C. Martin

---

## 🧠 What Does It Mean?

Every class should do **exactly one thing** and do it well. If a class is handling multiple unrelated responsibilities, then it has multiple reasons to change — that's a problem.

Think of it like job roles at a company:
- A **cashier** handles payments
- A **chef** prepares food
- A **waiter** serves customers

You wouldn't ask the chef to also handle billing, right? Same idea in code.

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

## 💡 Quick Rule of Thumb

Ask yourself: **"If I describe what this class does, do I need the word 'AND'?"**

- `"This class saves users AND sends emails AND logs events"` → ❌ Violates SRP
- `"This class saves users to the database"` → ✅ Follows SRP

---

## 📌 Summary

| | Bad | Good |
|---|---|---|
| **UserService** | Validates + Saves + Emails + Logs | Only orchestrates the flow |
| **Reason to change** | 4+ reasons | 1 reason |
| **Testability** | Hard (does too much) | Easy (test each class in isolation) |

Next up: [Open/Closed Principle →](./open-closed)
