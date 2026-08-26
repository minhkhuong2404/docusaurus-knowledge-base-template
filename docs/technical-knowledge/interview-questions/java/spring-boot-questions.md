---
id: spring-boot-interview
title: Spring Boot Interview Questions
sidebar_label: Spring Boot
description: Top Spring Boot interview questions covering auto-configuration mechanics, starter dependencies, BOM version resolution, and embedded server bootstrapping.
tags: [spring-boot, java, interview, backend]
---

# Top Spring Boot Interview Questions & Answers

---

## Core Framework Questions

### Q1. What is Apache Spring Boot and what are its four foundational technical pillars?
> Spring Boot is an opinionated framework built on top of Spring Framework designed to simplify application bootstrapping and deployment. Its core pillars are: (1) **Auto-configuration** (dynamically instantiating beans based on classpath inspection); (2) **Starter Dependencies** (curated transitively managed POM packages); (3) **Embedded Servlet Containers** (packaging Tomcat, Jetty, or Undertow programmatically inside executable JARs); (4) **Production-Ready Actuator Metrics** (health indicators, metrics, and environment inspection).

### Q2. How does Spring Boot Auto-Configuration work under the hood?
> Auto-configuration is initiated by `@EnableAutoConfiguration` inside `@SpringBootApplication`.
> 1. `AutoConfigurationImportSelector` reads candidate configuration class names:
>    - **Spring Boot 2.x**: From `META-INF/spring.factories`.
>    - **Spring Boot 3.x**: From `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`.
> 2. Each candidate class is filtered against `@Conditional` annotations:
>    - `@ConditionalOnClass`: Checks if necessary library classes exist on the classpath.
>    - `@ConditionalOnMissingBean`: Checks if the developer has already registered a custom bean.
>    - `@ConditionalOnProperty`: Checks if target configuration properties are enabled.
> 3. Passing candidates register default bean definitions into the `ApplicationContext`.

```
@SpringBootApplication ---> @EnableAutoConfiguration
                                  │
                                  ▼
                    AutoConfigurationImportSelector
                                  │
                                  ▼
Read AutoConfiguration.imports ---> Filter @Conditional Annotations ---> Register Beans
```

### Q3. How does Spring Boot manage starter dependencies and version resolution via BOMs?
> Spring Boot uses a **Bill of Materials (BOM)** pattern. Projects inheriting from `spring-boot-starter-parent` leverage `spring-boot-dependencies`. The BOM defines compatible version numbers in a `<dependencyManagement>` section for hundreds of libraries (Jackson, Hibernate, JUnit). Sub-projects declare dependencies (e.g., `spring-boot-starter-data-jpa`) without specifying explicit `<version>` tags, eliminating transitive dependency version conflicts.

### Q4. How are Embedded Servlet Containers (Tomcat/Jetty) bootstrapped during application startup?
> When `SpringApplication.run()` executes, it instantiates a `ServletWebServerApplicationContext`. During the `onRefresh()` lifecycle phase, the context searches the bean registry for a `ServletWebServerFactory` implementation (e.g., `TomcatServletWebServerFactory`). The factory programmatically instantiates an embedded `WebServer` object (`TomcatWebServer`), configures listener ports, binds the `DispatcherServlet`, and starts the container natively.

### Q5. What is the difference between `@Controller` and `@RestController` in Spring MVC?
> `@Controller` is the traditional Spring MVC stereotype annotation used to handle requests and return view template names (e.g., Thymeleaf/JSP). To return raw JSON/XML data, handler methods must be explicitly annotated with `@ResponseBody`. `@RestController` is a composite annotation that combines `@Controller` and `@ResponseBody`, automatically serializing all handler method return values into HTTP response body bytes via `HttpMessageConverter` (e.g., Jackson `ObjectMapper`).

### Q6. What are the common Lombok traps in Spring Boot domain models and JPA Entities?
> While Project Lombok (`@Data`, `@Getter`, `@Setter`, `@Builder`) eliminates boilerplate code, using it carelessly on JPA entities introduces serious production bugs:
> 1. **`@Data` / `@EqualsAndHashCode` on JPA Entities:** `@Data` generates `equals()` and `hashCode()` using all non-static fields. In JPA, loading lazy-loaded collections inside `hashCode()` triggers unexpected database queries (N+1 problem) or throws `LazyInitializationException`. For JPA entities, `equals()` and `hashCode()` should rely strictly on a stable business key or database Primary Key (`id`).
> 2. **`@Builder` Field Initialization:** Fields initialized at inline declaration (e.g., `private List<Item> items = new ArrayList<>();`) are ignored when constructed via `@Builder`, resulting in `null` pointers unless annotated with `@Builder.Default`.

### Q7. How does Global Custom Exception Handling work in Spring Boot?
> Spring Boot provides centralized exception handling using `@RestControllerAdvice` (or `@ControllerAdvice`) and `@ExceptionHandler`.
> 1. `@RestControllerAdvice` intercepts exceptions thrown by any `@RestController` across the application.
> 2. `@ExceptionHandler(SpecificException.class)` handles matching exception types and formats a standardized JSON response body (e.g., `ErrorResponse(timestamp, status, message, path)`).

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex, WebRequest req) {
        ErrorResponse error = new ErrorResponse(
            LocalDateTime.now(),
            HttpStatus.NOT_FOUND.value(),
            ex.getMessage(),
            req.getDescription(false)
        );
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }
}
```

### Q8. How do you implement the Strategy Design Pattern in Spring Boot using Dependency Injection?
> Spring automatically injects all implementations of an interface into a `Map<String, PaymentStrategy>` or `List<PaymentStrategy>`.
> - When injecting `Map<String, PaymentStrategy>`, Spring uses the **Spring bean name** as the Map key.
> - This eliminates manual `switch-case` or `if-else` blocks for dynamic strategy selection.

```java
public interface PaymentStrategy {
    void processPayment(double amount);
}

@Service("CREDIT_CARD")
public class CreditCardStrategy implements PaymentStrategy { ... }

@Service("PAYPAL")
public class PayPalStrategy implements PaymentStrategy { ... }

@Service
public class PaymentContext {
    // Spring automatically populates map key = bean name ("CREDIT_CARD", "PAYPAL")
    private final Map<String, PaymentStrategy> strategies;

    @Autowired
    public PaymentContext(Map<String, PaymentStrategy> strategies) {
        this.strategies = strategies;
    }

    public void execute(String type, double amount) {
        PaymentStrategy strategy = strategies.get(type);
        if (strategy == null) throw new IllegalArgumentException("Invalid strategy: " + type);
        strategy.processPayment(amount);
    }
}
```

### Q9. What are the key Spring REST Annotations and how do `@PathVariable` vs `@RequestParam` differ?
> - **`@PathVariable`:** Extracts dynamic values directly embedded in the URI path template (e.g., `/api/users/{id}` → `@PathVariable Long id`). Used to identify a specific resource.
> - **`@RequestParam`:** Extracts query parameters appended after `?` in the URL (e.g., `/api/users?page=1&size=10` → `@RequestParam int page`). Used for filtering, sorting, or pagination.
> - **`@RequestBody`:** Deserializes incoming HTTP POST/PUT JSON payload into a Java DTO via Jackson `ObjectMapper`. Paired with `@Valid` to trigger Bean Validation.

### Q10. What is the difference between `@Component`, `@Service`, `@Repository`, and `@Configuration`?
> All four are sub-stereotypes of `@Component`, making them candidates for Spring auto-detection and component scanning:
> - **`@Component`:** Generic archetype for any Spring-managed component.
> - **`@Service`:** Denotes service-layer business logic. Carries semantic intent.
> - **`@Repository`:** Denotes data access objects (DAOs). Automatically enables Spring's **`PersistenceExceptionTranslationPostProcessor`**, translating native DB driver exceptions (e.g., SQLException, HibernateException) into Spring's unified `DataAccessException` hierarchy.
> - **`@Configuration`:** Denotes bean definition source containing `@Bean` methods. Spring proxies `@Configuration` classes via **CGLIB** to ensure inter-bean method calls reuse existing singleton instances (Full `@Configuration` mode).

---

## See Also

- [Spring Boot Real-Time Interview Questions](./spring-boot-real-time-questions.md)
- [Spring Data JPA & Hibernate Internals](../../interview-questions/java/spring-boot-questions.md)
- [Microservices Design Patterns](../../system-design/microservices-patterns.md)

