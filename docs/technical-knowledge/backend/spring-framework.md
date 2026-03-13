---
title: "Spring Framework: Overview"
description: Foundational overview of the Spring Framework, including IoC, dependency injection, modules, and enterprise application development.
tags: [spring-framework, java, backend, dependency-injection]
---

# Spring Framework: Overview

Spring is a comprehensive Java framework for building enterprise applications. It provides a powerful toolkit that simplifies complex development tasks — from connecting to databases, to managing application components, to handling web requests. Spring takes care of much of the technical plumbing, allowing developers to focus on business logic.

---

## What is Spring?

Spring is an open-source application framework that provides infrastructure support for developing Java applications. At its core, Spring manages objects (called **beans**) and their dependencies through a mechanism known as **Inversion of Control (IoC)**.

### Key Characteristics

| Characteristic | Description |
|----------------|-------------|
| **Lightweight** | Minimal overhead; only use the modules you need |
| **Modular** | Composed of independent modules that can be used separately |
| **Non-invasive** | Does not force classes to extend framework-specific base classes |
| **Enterprise-ready** | Built-in support for transactions, security, messaging, and more |

---

## How Does Spring Help Developers?

Spring significantly reduces the complexity of enterprise Java development:

- **Dependency Management** — Automatically wires objects together, eliminating manual instantiation and reducing coupling
- **Transaction Management** — Provides declarative transaction support using `@Transactional`
- **Integration** — Integrates seamlessly with technologies like JPA/Hibernate, Kafka, REST, messaging systems, and more
- **Testability** — Encourages constructor injection and interface-driven design, making unit testing straightforward
- **Rapid Development** — With Spring Boot, developers get auto-configuration, embedded servers, and production-ready defaults out of the box
- **Scalability** — Spring Cloud adds tools for building distributed systems with service discovery, circuit breakers, and config servers

---

## Spring Framework Modules

The Spring Framework is organized into well-defined modules:

| Module | Purpose |
|--------|---------|
| **Core Container** | IoC and Dependency Injection (`BeanFactory`, `ApplicationContext`) |
| **AOP** | Aspect-Oriented Programming for cross-cutting concerns (logging, security) |
| **Data Access** | JDBC abstraction, ORM integration, transaction management |
| **Web** | Spring MVC, WebFlux (reactive), REST support |
| **Security** | Authentication, authorization, protection against common vulnerabilities |
| **Test** | Support for unit and integration testing with JUnit and Mockito |
| **Messaging** | Support for JMS, AMQP, Kafka integration |
| **Cloud** | Tools for building microservices and distributed systems |

---

## Core Concepts

### Inversion of Control (IoC)

IoC is a design principle where the framework controls the flow of a program rather than the developer's code. Instead of objects creating their own dependencies, the **IoC container** creates them and injects them where needed.

### Dependency Injection (DI)

DI is the mechanism Spring uses to implement IoC. Dependencies are provided to a class from the outside rather than the class creating them itself.

**Three types of injection:**

| Type | Mechanism | When to Use |
|------|-----------|-------------|
| **Constructor Injection** | Dependencies passed via constructor parameters | **Recommended** — ensures immutability and mandatory dependencies |
| **Setter Injection** | Dependencies set through setter methods after construction | Optional dependencies that can change |
| **Field Injection** | Spring injects directly into fields via `@Autowired` | Convenient but harder to test |

```java
// Constructor Injection (recommended)
@Service
public class OrderService {
    private final PaymentService paymentService;

    public OrderService(PaymentService paymentService) {
        this.paymentService = paymentService;
    }
}
```

### Spring Beans

A **Spring Bean** is an object created and managed by the Spring IoC container. Beans are the building blocks of a Spring application.

### Bean Scopes

| Scope | Description | Use Case |
|-------|-------------|----------|
| **Singleton** (default) | One instance per application context | Shared services, configuration |
| **Prototype** | New instance every time it's requested | User-specific data, stateful objects |
| **Request** | One instance per HTTP request | Web request-scoped data |
| **Session** | One instance per HTTP session | User session data |
| **Global Session** | One instance per global session | Portlet applications |

> **Note:** Singleton beans are **not** thread-safe by default. Use synchronized methods, `ThreadLocal`, or concurrent data structures when shared state is involved.

---

## IoC Container Types

| Container | Description | When to Use |
|-----------|-------------|-------------|
| **BeanFactory** | Basic container with lazy bean initialization | Low-memory environments, simple applications |
| **ApplicationContext** | Advanced container with event propagation, AOP integration, internationalization | **Preferred** for most modern applications |

---

## Spring vs Spring Boot

| Aspect | Spring Framework | Spring Boot |
|--------|-----------------|-------------|
| **Configuration** | Manual configuration (XML or annotations) | Auto-configuration with sensible defaults |
| **Server** | External application server required | Embedded server (Tomcat, Jetty, Undertow) |
| **Startup** | More setup required | Quick start with Spring Initializr |
| **Dependency Management** | Manual dependency versions | Starter POMs manage compatible versions |
| **Production Readiness** | Manual setup for health checks, metrics | Built-in Actuator for monitoring |

---

## Key Annotations

| Annotation | Purpose |
|------------|---------|
| `@Configuration` | Declares a class as a source of bean definitions |
| `@Bean` | Defines a bean method inside a `@Configuration` class |
| `@Component` | Generic stereotype for any Spring-managed component |
| `@Service` | Specialization of `@Component` for service-layer beans |
| `@Repository` | Specialization of `@Component` for data access layer |
| `@Controller` | Specialization of `@Component` for web controllers |
| `@Autowired` | Injects dependencies automatically |
| `@Qualifier` | Specifies which bean to inject when multiple candidates exist |
| `@Primary` | Marks a bean as the default choice for autowiring |
| `@Profile` | Associates a bean with a specific environment profile |
| `@Value` | Injects property values or environment variables |

---

## Design Patterns in Spring

Spring heavily utilizes well-known design patterns:

| Pattern | Usage in Spring |
|---------|----------------|
| **Singleton** | Default bean scope — one instance per container |
| **Factory** | `BeanFactory` and `FactoryBean` for creating bean instances |
| **Proxy** | AOP proxies for cross-cutting concerns |
| **Template Method** | `JdbcTemplate`, `RestTemplate`, `JmsTemplate` |
| **Observer** | Application event mechanism (`ApplicationEvent`, `@EventListener`) |
| **Strategy** | Various pluggable strategies (e.g., `ResourceLoader`, `TransactionManager`) |

---

## Spring Profiles

Profiles allow you to segregate application configuration by environment:

```properties
# application-dev.properties
spring.datasource.url=jdbc:h2:mem:devdb

# application-prod.properties
spring.datasource.url=jdbc:postgresql://prod-host:5432/proddb
```

**Activating a profile:**
- Command line: `-Dspring.profiles.active=prod`
- Properties file: `spring.profiles.active=prod`
- Programmatically: `SpringApplication.setAdditionalProfiles("prod")`

---

## When to Use Spring

- **DO** use Spring for enterprise Java applications that need robust DI, transaction management, and integration support
- **DO** use Spring Boot for rapid application development with minimal configuration
- **DO** use Spring Cloud for building microservice architectures
- **DON'T** use Spring when a simple, lightweight solution suffices — avoid over-engineering
- **DON'T** fight the framework — embrace convention over configuration

---

## Advanced Editorial Pass: Framework Foundations and Architectural Cost

### Strategic Perspective
- Spring is an inversion-of-control platform, not only a library bundle.
- Design quality depends on how clearly you define bean ownership and boundaries.
- Framework flexibility can amplify both good architecture and bad coupling.

### High-Risk Patterns
- Treating DI as global mutable state with weak module boundaries.
- Overusing annotations without explicit lifecycle and contract reasoning.
- Pushing domain decisions into framework glue layers.

### Senior Review Questions
1. Can each module be reasoned about without loading the full application context?
2. Are lifecycle assumptions explicit and testable?
3. Which framework feature introduces the largest long-term lock-in risk?

### Compare Next
- [Spring Framework: Deep Dive](./spring-framework-deep-dive.md)
- [Spring Boot - Overview & Why It Matters](./spring-boot.md)
- [Spring Security - Complete Guide](./spring-security.md)
