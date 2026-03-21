---
sidebar_position: 12
title: "Chapter 11: Systems"
description: Separating system construction from use, dependency injection, and scaling clean architecture.
---

# Chapter 11: Systems

## Cities Don't Get Built in a Day — Neither Do Systems

A city works because it has separate teams managing different concerns: water, power, traffic, zoning. No single person understands everything. The same principle applies to software systems: clean systems **separate concerns** at every level.

This chapter zooms out from functions and classes to look at the system as a whole.

---

## Separate Constructing a System from Using It

> *"Software systems should separate the startup process, when the application objects are constructed and the dependencies are 'wired' together, from the runtime logic that takes over after startup."*

### The Problem with Mixing Construction and Logic

```java
// Bad — construction logic mixed into business logic
public Service getService() {
    if (service == null) {
        service = new MyServiceImpl(...); // construction
    }
    return service; // use
}
```

This "lazy initialization" pattern has problems:
- The class has a hard-coded dependency on `MyServiceImpl`
- You can't substitute a different implementation (e.g., in tests) without modifying the class
- The null check is logic noise mixed with business logic
- If `MyServiceImpl`'s constructor throws, `getService()` can behave unexpectedly

### Solution 1: Separate Main from Application

Move all construction to `main()` or a dedicated startup module. The application only ever *uses* objects — it never constructs them.

```
main() → creates objects → passes them to application → application uses them
```

The application doesn't know how objects were constructed. It just uses them.

### Solution 2: Dependency Injection (DI)

The most powerful pattern for separating construction from use. Objects receive their dependencies instead of creating them:

```java
// Bad — the class creates its own dependency
public class OrderService {
    private PaymentProcessor processor = new StripePaymentProcessor(); // hard-coded!
}

// Good — dependency injected
public class OrderService {
    private final PaymentProcessor processor;

    public OrderService(PaymentProcessor processor) { // constructor injection
        this.processor = processor;
    }
}
```

With Spring's DI container:

```java
@Service
public class OrderService {
    private final PaymentProcessor processor;

    @Autowired
    public OrderService(PaymentProcessor processor) {
        this.processor = processor;
    }
}
```

The Spring container manages construction. Your code only manages logic.

---

## Scaling Up — From Simple to Sophisticated

Systems need to grow. The key is to use just enough architecture for today's needs, but design so that growth doesn't require a catastrophic rewrite.

### EJBs as a Cautionary Tale

Early EJB (Enterprise JavaBeans) required business logic to be tangled with container concerns: lifecycle callbacks, JNDI lookups, transaction annotations, home interfaces. Your business logic was hostage to the container.

Modern Spring (and EJB3) fixed this with POJOs: Plain Old Java Objects annotated minimally, tested in isolation, not dependent on the container.

```java
// Old EJB style — business logic tangled with container concerns
public class BankEJB implements EntityBean {
    private EntityContext ctx;

    public void setEntityContext(EntityContext ctx) { this.ctx = ctx; }
    public void ejbActivate() {}
    public void ejbPassivate() {}
    public void ejbRemove() {}
    // Where's the business logic?!
}

// Modern Spring style — pure business logic, DI handles the rest
@Service
@Transactional
public class BankService {
    private final AccountRepository accountRepository;

    public BankService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    public void transfer(long fromId, long toId, BigDecimal amount) {
        Account from = accountRepository.findById(fromId).orElseThrow();
        Account to = accountRepository.findById(toId).orElseThrow();
        from.debit(amount);
        to.credit(amount);
    }
}
```

---

## Aspect-Oriented Programming (AOP)

Some concerns are **cross-cutting** — they affect many parts of the system but aren't core business logic: logging, security, transactions, caching, performance monitoring.

AOP lets you modularize these concerns instead of scattering them throughout the codebase.

**Without AOP** — logging and transactions mixed into business logic everywhere:

```java
public void processOrder(Order order) {
    logger.info("Processing order: " + order.getId()); // cross-cutting
    Transaction tx = beginTransaction();               // cross-cutting
    try {
        // actual business logic — two lines buried in noise
        validate(order);
        fulfillOrder(order);
        tx.commit();
    } catch (Exception e) {
        tx.rollback();
        logger.error("Order processing failed", e);
        throw e;
    }
}
```

**With Spring AOP** — business logic is clean; cross-cutting concerns declared separately:

```java
@Service
public class OrderService {
    public void processOrder(Order order) {
        // Only business logic
        validate(order);
        fulfillOrder(order);
    }
}

// Logging declared as a separate aspect
@Aspect
@Component
public class LoggingAspect {
    @Around("execution(* com.example.OrderService.*(..))")
    public Object log(ProceedingJoinPoint joinPoint) throws Throwable {
        logger.info("Entering: " + joinPoint.getSignature());
        Object result = joinPoint.proceed();
        logger.info("Exiting: " + joinPoint.getSignature());
        return result;
    }
}
```

---

## Test Drive the Architecture

Martin challenges the conventional wisdom that you must get the architecture right up front (Big Design Up Front, or BDUF):

> *"An optimal system architecture consists of modularized domains of concern, each of which is implemented with Plain Old Java (or other) Objects. The different domains are integrated together with minimally invasive Aspects or Aspect-like tools. This architecture can be test-driven, just like the code."*

Start simple. Use the simplest architecture that works today. Add complexity only when needed, guided by real requirements — not speculation.

This is **not** an excuse to avoid thinking about architecture at all. It's a call for **just-in-time design** decisions backed by working code and tests.

---

## Use Standards Wisely, Not Dogmatically

Standards (like EJB, XML configuration heavy frameworks, etc.) can be valuable — but only when they solve your actual problems. Many teams adopt heavyweight standards for their own sake, adding complexity that serves the standard rather than the user.

Choose tools that **reduce complexity**, not add it. Spring's evolution from XML configuration to annotation-based to convention-over-configuration is a good example of a framework learning this lesson.

---

## Systems Need Domain-Specific Languages

A Domain-Specific Language (DSL) is a small, focused language designed to express the concerns of a specific domain clearly. In Java this often takes the form of a Fluent API:

```java
// Without DSL — verbose, hard to read
Order order = new Order();
order.setCustomerId(42);
order.setStatus(OrderStatus.PENDING);
order.addItem(new OrderItem("SKU-001", 2, BigDecimal.valueOf(29.99)));

// With Fluent Builder DSL — reads like the domain
Order order = Order.builder()
    .forCustomer(42)
    .pending()
    .withItem("SKU-001", quantity(2), price(29.99))
    .build();
```

DSLs raise the level of abstraction and reduce the conceptual gap between the domain and the code.

---

## Key Takeaways

- **Separate construction from use** — objects should be assembled in `main` or a DI container, not inside business logic
- **Dependency Injection** is the primary pattern for clean construction separation in Java
- Keep business logic in **POJOs** — free from container concerns
- Use **AOP** for cross-cutting concerns (logging, transactions, security) instead of scattering them
- Prefer **just-in-time architecture** decisions based on working code over upfront speculation
- Use standards and tools that **reduce complexity** — don't adopt them dogmatically
- **DSLs and fluent APIs** close the gap between the domain and the code
