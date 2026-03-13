---
title: "Spring Framework: Interview Questions"
description: Collection of Spring Framework interview questions and answers covering core concepts, containers, web, data, and architecture topics.
tags: [spring-framework, java, interview-questions, backend]
---

# Spring Framework: Interview Questions

A comprehensive collection of commonly asked Spring Framework interview questions, organized by topic and difficulty level.

---

## Core Spring Concepts

### Q1: What is Spring Framework?

Spring is an open-source Java framework for building enterprise applications. It provides infrastructure support including dependency injection, aspect-oriented programming, transaction management, and integration with various technologies. It simplifies development by managing technical details so developers can focus on business logic.

### Q2: What are the advantages of the Spring Framework?

- Manages object creation and wiring through IoC, making code simpler
- Provides declarative transaction management
- Integrates well with other technologies (JPA, Kafka, REST, etc.)
- Makes testing easier through constructor injection and interfaces
- Spring Boot and Spring Cloud enable rapid development of scalable, distributed applications

### Q3: What are the main modules of the Spring Framework?

| Module | Purpose |
|--------|---------|
| **Core** | IoC container and dependency injection |
| **AOP** | Aspect-oriented programming for cross-cutting concerns |
| **Data Access** | JDBC, ORM, transaction management |
| **Web** | Spring MVC, WebFlux, REST |
| **Security** | Authentication and authorization |
| **Test** | Unit and integration testing support |
| **Messaging** | JMS, AMQP, Kafka support |
| **Cloud** | Distributed systems and microservices |

---

## IoC and Dependency Injection

### Q4: What is IoC and DI?

**Inversion of Control (IoC)** is a design principle where the framework controls the flow of a program instead of the developer's code. **Dependency Injection (DI)** is the mechanism used to implement IoC — necessary objects are provided to a class rather than the class creating them itself. This makes code easier to manage, test, and change.

### Q5: What is the role of the IoC container in Spring?

The IoC container manages the creation and configuration of objects (beans). It provides required dependencies automatically, connecting objects and their dependencies so developers can build applications in a more organized and efficient way.

### Q6: What are the types of IoC containers in Spring?

| Container | Description |
|-----------|-------------|
| **BeanFactory** | Basic container that handles creating and managing objects. Lazy initialization. |
| **ApplicationContext** | Advanced container adding event handling, AOP integration, i18n, and web context support. Eager initialization. |

> Most developers prefer `ApplicationContext` because it offers more capabilities and is easier to use.

### Q7: What are the differences between ApplicationContext and BeanFactory?

| Feature | BeanFactory | ApplicationContext |
|---------|-------------|-------------------|
| Bean Loading | Lazy | Eager |
| Event Propagation | No | Yes |
| AOP Support | Manual | Built-in |
| i18n Support | No | Yes |
| Web Context | No | Yes |
| **Best For** | Low-memory / embedded systems | Enterprise applications |

### Q8: When would you use BeanFactory over ApplicationContext?

Use `BeanFactory` in scenarios with minimal resources or when only basic bean management is needed — such as small applications or embedded systems. Use `ApplicationContext` for enterprise-level applications requiring advanced features like event propagation, AOP integration, and declarative services.

---

## Bean Configuration

### Q9: What is a Spring Bean?

A Spring Bean is an object created and managed by the Spring IoC container. Beans are the key building blocks of a Spring application — the framework handles their creation, wiring, and lifecycle.

### Q10: What is the use of @Configuration and @Bean?

`@Configuration` indicates a class contains bean definitions that the Spring container can use. `@Bean` is used on methods within that class to define beans managed by the Spring container.

```java
@Configuration
public class AppConfig {

    @Bean
    public PaymentService paymentService() {
        return new PaymentServiceImpl();
    }
}
```

### Q11: What are the different bean scopes in Spring?

| Scope | Description | Use Case |
|-------|-------------|----------|
| **Singleton** (default) | One instance for the entire application context | Configuration, shared services |
| **Prototype** | New instance each time the bean is requested | Stateful or user-specific objects |
| **Request** | One instance per HTTP request | Web request-scoped data |
| **Session** | One instance per user session | User session data |
| **Global Session** | One instance per global session | Portlet applications |

### Q12: What is the default bean scope?

The default scope is **singleton** — only one instance of the bean is created and shared across the entire application context.

### Q13: When would you use Singleton vs Prototype scope?

- **Singleton**: When you need one shared instance — e.g., configuration settings, stateless services
- **Prototype**: When you need a new instance each time — e.g., objects holding user-specific data or different states for different uses

### Q14: Are singleton beans thread-safe?

**No.** Singleton beans are not thread-safe by default. Since they are shared across the application, you need to add thread-safety measures:
- Use `synchronized` methods or blocks
- Use `ThreadLocal` for thread-confined data
- Implement stateless beans where possible
- Use concurrent utilities from `java.util.concurrent`

### Q15: Can we have multiple Spring configuration files in one project?

Yes. Multiple configuration files help organize bean definitions by purpose or module. You can load them into the application context as needed using `@Import` or component scanning.

---

## Dependency Injection

### Q16: Which is the best way of injecting beans and why?

**Constructor injection** is the recommended approach. It ensures all necessary dependencies are provided when the object is created, making the object more reliable, immutable, and easier to test.

### Q17: Difference between Constructor Injection and Setter Injection?

| Aspect | Constructor Injection | Setter Injection |
|--------|----------------------|-----------------|
| When dependencies are set | At object creation time | After object creation |
| Immutability | Supports immutable objects | Dependencies can change |
| Required dependencies | Enforced — object can't exist without them | Optional — can be set later |
| Circular dependencies | Can cause issues | Helps resolve circular dependencies |

### Q18: What type of injection does @Autowired use?

`@Autowired` primarily uses **constructor injection** by default. It can also be used for:
- **Field injection** — Spring directly sets field values
- **Setter injection** — Dependencies injected through setter methods

### Q19: Why is constructor injection recommended over setter-based injection?

Constructor injection ensures all required dependencies are provided at creation time. This makes objects:
- **Immutable** once constructed
- **Complete** — they can't exist without their dependencies
- **Safer** — no risk of `NullPointerException` from uninitialized dependencies
- **Testable** — dependencies are explicit in the constructor signature

---

## Advanced Topics

### Q20: What is a circular dependency issue?

A circular dependency occurs when two or more beans depend on each other to be created. For example, Bean A requires Bean B, and Bean B requires Bean A. This leads to a deadlock that prevents the application from starting.

### Q21: How do you resolve circular dependencies in Spring Boot?

| Strategy | How It Works |
|----------|-------------|
| **Setter injection** | Allows beans to be instantiated before dependencies are set |
| **`@Lazy` annotation** | Defers bean initialization until actually needed |
| **Redesign architecture** | Separate concerns and reduce coupling between beans |
| **Introduce interfaces** | Abstract implementation details to decouple components |

### Q22: Difference between @Component and @Service. Are they interchangeable?

Both create Spring beans and are technically interchangeable. However:
- `@Component` — generic stereotype for any Spring-managed component
- `@Service` — specialization indicating the bean performs service/business logic

Using the correct stereotype improves code clarity about the bean's role in the application.

### Q23: Difference between @Qualifier and @Primary?

| Annotation | Purpose |
|------------|---------|
| `@Qualifier` | Specifies exactly which bean to inject by name |
| `@Primary` | Marks a bean as the default choice when multiple candidates exist |

```java
@Autowired
@Qualifier("reportingDataSource")
private DataSource dataSource; // Injects the specific bean

@Bean
@Primary
public DataSource primaryDataSource() { ... } // Default when no qualifier specified
```

### Q24: What is the usage of @Transactional?

`@Transactional` defines the scope of a database transaction. All operations within the annotated method either all succeed or all fail together, maintaining data integrity for complex multi-step operations.

### Q25: What is Spring Profiles? How do you activate a profile?

Spring Profiles segregate application configuration by environment (dev, test, prod). Activate a profile using:
- Command line: `-Dspring.profiles.active=prod`
- Properties file: `spring.profiles.active=prod`
- Programmatically: `SpringApplication.setAdditionalProfiles("prod")`

### Q26: How can you inject properties using environment variables?

Use the `@Value` annotation:

```java
@Value("${MY_ENV_VAR}")
private String myProperty;
```

This injects the value of the `MY_ENV_VAR` environment variable into the bean.

### Q27: What happens if multiple AutoConfiguration classes define the same bean?

The last one loaded takes precedence. Control ordering with:
- `@AutoConfigureOrder` — explicit priority
- `@AutoConfigureAfter` / `@AutoConfigureBefore` — relative ordering
- `@ConditionalOnMissingBean` — only create if no existing bean

---

## AOP (Aspect-Oriented Programming)

### Q28: What is AOP? What is its biggest disadvantage?

AOP modularizes cross-cutting concerns (logging, security, transactions) separate from business logic. It improves code readability and reduces redundancy.

**Biggest disadvantage:** It makes execution flow harder to follow. The modularized code runs separately from the main application flow, making it challenging to trace and debug.

### Q29: What is the difference between Join Point and Pointcut?

| Concept | Description |
|---------|-------------|
| **Join Point** | A specific point during program execution (e.g., a method call) where an aspect can be applied |
| **Pointcut** | An expression that selects one or more join points, determining where advice should execute |

> Join Points = actual locations. Pointcuts = the selectors that pick those locations.

---

## Spring Batch

### Q30: What is Spring Batch?

Spring Batch is a framework for processing large volumes of data automatically and efficiently — ideal for data migration, daily transaction processing, and report generation.

**Implementation steps:**
1. Define a **Job** configuration with steps
2. Set up an **ItemReader** to pull data
3. Create an **ItemProcessor** to apply business logic
4. Configure an **ItemWriter** to output processed data
5. All managed within Spring's context for transactional integrity and job monitoring

---

## Testing

### Q31: What is the difference between @Spy and @Mock in Mockito?

| Aspect | @Mock | @Spy |
|--------|-------|------|
| Instance type | Fully mocked (no real code executes) | Partial mock wrapping a real instance |
| Default behavior | All methods return defaults (null, 0, false) | All methods execute real code |
| Override behavior | `when().thenReturn()` | `doReturn().when()` for selective stubbing |
| Best for | Isolating dependencies | When some real behavior is needed |

---

## Scenario-Based Questions

### Q32: You are starting a new Spring project. Would you use annotations or XML for configuration?

Consider:
- **Annotations** — concise, readable, part of the code, easier to maintain
- **XML** — better for complex configurations, separation of concerns, modifiable without recompilation

Decision factors: team familiarity, project requirements, and configuration complexity. Most modern projects favor annotations.

### Q33: You have a large project with many interdependent beans. How would you manage dependencies?

- Use **dependency injection** to manage dependencies
- Use **Spring Profiles** for environment-specific configurations
- **Group related beans** in separate `@Configuration` classes
- Use `@ComponentScan` to automatically discover beans
- Apply **interface-driven design** to reduce coupling

### Q34: How would you make a singleton bean thread-safe?

- Use `synchronized` methods or blocks for critical sections
- Use `ThreadLocal` for thread-confined objects
- Implement **stateless beans** to avoid shared state
- Use concurrent utilities from `java.util.concurrent`

### Q35: How would you resolve a bean conflict in Spring Boot?

Use `@Qualifier("beanName")` at the injection point to specify exactly which bean to inject when multiple beans of the same type exist. Alternatively, mark one bean as `@Primary` to set a default.

### Q36: Difference between JpaRepository and CrudRepository?

| Feature | CrudRepository | JpaRepository |
|---------|---------------|---------------|
| CRUD operations | Yes | Yes (inherited) |
| Pagination & Sorting | No | Yes |
| Batch operations | No | Yes |
| Flush persistence context | No | Yes |
| **Use CrudRepository when** | Simple database interactions without advanced JPA features |
| **Use JpaRepository when** | Full JPA capabilities are needed |

---

## Advanced Editorial Pass: Spring Interview Answers That Stand Out

### Upgrade Path for Responses
- Translate conceptual answers into architecture and production implications.
- Highlight boundaries: container concern, application concern, platform concern.
- Show explicit trade-offs and failure containment strategy.

### Red Flags to Avoid
- Memorized definitions without decision criteria.
- Ignoring observability, rollout, and rollback implications.
- Assuming default framework behavior is always safe at scale.

### Deliberate Practice
1. Pair each answer with one performance and one reliability consideration.
2. Add one anti-pattern and how you would detect it in production.
3. Practice concise, layered explanations: concept, trade-off, implementation.

### Compare Next
- [Spring Boot: Interview Questions](./spring-boot-interview-questions.md)
- [Spring Framework: Deep Dive](./spring-framework-deep-dive.md)
- [Spring MVC - Complete Guide](./spring-mvc.md)
