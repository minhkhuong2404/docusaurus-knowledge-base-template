---
id: spring-boot-tricky-interview-questions
title: Spring Boot Tricky Interview Questions and Answers
description: A detailed collection of tricky and advanced Spring Boot interview questions and answers, covering microservices, caching, performance optimization, and application configuration.
tags:
  - Java
  - Spring Boot
  - Microservices
  - Interview Prep
  - Backend Development
---

# Spring Boot Tricky Interview Questions & Answers

---

## 1. Microservices & Communication

### Q1. How do you handle inter-service communication in a microservices architecture using Spring Boot?
> Choose based on coupling and synchronization requirements: (1) **Synchronous Non-blocking**: Use `WebClient` (Spring WebFlux) for real-time HTTP calls (avoid deprecated `RestTemplate`). (2) **Declarative HTTP Clients**: Use `Spring Cloud OpenFeign` for clean REST client interfaces. (3) **Asynchronous Event-Driven**: Use Apache Kafka or RabbitMQ to decouple services for eventual consistency. Mitigate synchronous cascading failures using **Resilience4j Circuit Breaker** and fallback methods.

```java
@CircuitBreaker(name = "userService", fallbackMethod = "getUserFallback")
public User getUser(Long id) {
    return webClient.get().uri("/users/{id}", id).retrieve().bodyToMono(User.class).block();
}
private User getUserFallback(Long id, Throwable t) {
    return User.defaultUser(); // Return cached or safe fallback payload
}
```

---

## 2. Caching & Performance Optimization

### Q2. How does Spring Boot's caching abstraction work and what are the common self-invocation gotchas?
> Spring's cache abstraction (`@Cacheable`, `@CachePut`, `@CacheEvict`) provides a transparent caching layer backed by providers like Caffeine or Redis. Spring uses **AOP Proxies** to intercept method calls. If a method invokes another `@Cacheable` method inside the **same class** (`this.findById()`), the call bypasses the Spring AOP proxy, causing cache annotations to be silently ignored.

### Q3. How do you diagnose and resolve HikariCP database connection pool exhaustion under high load?
> Monitor `hikaricp.connections.active` and `hikaricp.connections.pending`. If pending requests time out (`connectionTimeout=30000ms`), size the pool according to the HikariCP formula:
> $$\text{Connections} = (\text{CPU Cores} \times 2) + \text{Disk Spindles}$$
> Enable SQL query profiling to fix N+1 lazy loading bugs using `@EntityGraph` or `JOIN FETCH`.

---

## 3. Core Framework & Proxy Mechanics

### Q4. How does Spring Boot choose between JDK Dynamic Proxies and CGLIB Proxies for AOP and `@Transactional`?
> If a target bean implements at least one interface, Spring Framework historically defaults to **JDK Dynamic Proxies** (`java.lang.reflect.Proxy`). If the bean implements no interfaces, Spring uses **CGLIB** to generate a subclass at runtime. Since Spring Boot 2.x, Spring Boot defaults to **CGLIB Proxies** (`spring.aop.proxy-target-class=true`) for all beans. Note that `final` classes or `final` methods cannot be subclassed by CGLIB, causing AOP advice (like `@Transactional`) to fail silently.

### Q5. What is the difference between `@EnableAutoConfiguration` in Spring Boot 2.x vs Spring Boot 3.x?
> In Spring Boot 2.x, candidate auto-configuration class names were loaded from `META-INF/spring.factories`. In Spring Boot 3.x (Spring Framework 6), `spring.factories` for auto-configuration is deprecated. Auto-configuration class names must be registered inside `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`.

---

## See Also

- [Spring Boot Auto-Configuration Mechanics](../../java/spring-boot-questions.md)
- [Microservices Design Patterns](../../../system-design/microservices-patterns.md)
- [Java Locks & Concurrency Primitives](../../../java/java-locks.md)