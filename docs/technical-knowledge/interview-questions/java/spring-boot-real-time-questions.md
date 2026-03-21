---
id: spring-boot-real-time-questions
title: "69 Real-Time Spring Boot Interview Questions"
description: "A comprehensive guide to advanced, scenario-based, and practical Spring Boot interview questions."
sidebar_position: 2
tags: [spring-boot, java, interview, microservices, backend, architecture, security]
---

# 69 Real-Time Spring Boot Interview Questions

This comprehensive guide covers 69 advanced, scenario-based, and practical Spring Boot questions frequently asked in technical interviews. It focuses heavily on architecture, performance optimization, security, and microservices.

---

## 🌐 Microservices & Communication

* **1. How would you handle inter-service communication in a microservice architecture?**
  * **Direct/Simple:** Use `RestTemplate` or `WebClient` for direct HTTP requests.
  * **Complex Interactions:** Use `FeignClient` to simplify declarative calls.
  * **Asynchronous:** Use message brokers like RabbitMQ or Kafka for event-driven communication.
  ```java
  @FeignClient(name = "inventory-service", url = "http://localhost:8082")
  public interface InventoryClient {
      @GetMapping("/api/inventory/{productId}")
      boolean checkStock(@PathVariable String productId);
  }

```

* **2. How do you implement API rate limiting to prevent abuse?**
Use a library like Bucket4j or utilize Spring Cloud Gateway's built-in rate-limiting capabilities (backed by Redis) to restrict requests per user/IP over a specific timeframe.
* **3. How can a Spring Boot application be made more resilient to failures?**
Use Circuit Breakers (like Resilience4j) to stop cascading failures, add retry mechanisms with exponential backoff, and enforce strict timeouts.
* **4. What is Spring Cloud and how is it useful?**
It is a suite of tools for managing microservices, handling complex tasks like service discovery (Eureka), load balancing, and centralized configuration so independent services work seamlessly together.
* **5. How do you manage externalized configuration in a microservice architecture?**
Use **Spring Cloud Config Server** as a central repository to distribute YAML/properties settings to all microservices dynamically.
* **6. How can Spring Cloud Gateway be configured for routing, security, and monitoring?**
Define routes in `application.yml`, integrate Spring Security for authentication at the edge, and use Spring Actuator to monitor the gateway's health.
* **7. Describe how to implement security in a microservices architecture.**
Add Spring Security to all services. Use a central authentication service to issue JWTs. Ensure each microservice validates the token, usually by routing traffic through an API Gateway for centralized security checks.
* **8. How is session management configured in distributed systems?**
Use **Spring Session** to store session data in a shared location (like Redis or a database) so users stay logged in regardless of which server handles their request.
* **9. Explain the conversion of business logic into serverless functions.**
Use **Spring Cloud Function** to write business tasks as simple Java `Function<T, R>` beans, which the framework adapts to run on cloud serverless platforms (like AWS Lambda).
* **10. Discuss the integration of distributed tracing.**
Use Spring Cloud Sleuth (or Micrometer Tracing) with Zipkin to assign unique Trace IDs to requests traveling across microservices, helping pinpoint network delays and errors.

---

## ⚡ Caching & Performance

* **11. Can you explain the caching mechanism available in Spring Boot?**
Caching acts as a memory layer for frequently used data to avoid repeating expensive operations (like complex database queries).
* **12. How would you implement caching in a Spring Boot application?**
Add `spring-boot-starter-cache`. Enable it with `@EnableCaching` on the main class. Use `@Cacheable` on methods to store results, and `@CacheEvict` or `@CachePut` to update them.
```java
@Service
public class ProductService {
    @Cacheable(value = "products", key = "#id")
    public Product getProduct(Long id) {
        return repository.findById(id).orElseThrow();
    }

    @CacheEvict(value = "products", key = "#id")
    public void deleteProduct(Long id) {
        repository.deleteById(id);
    }
}

```


* **13. What is the difference between Cache Eviction and Cache Expiration?**
* **Eviction:** Removes data to free up space (e.g., Least Recently Used policy).
* **Expiration:** Removes data because it reached a set Time-To-Live (TTL) and is considered stale.


* **14. Your application is experiencing performance issues under high load. What steps would you take?**
Analyze logs and metrics using Actuator and Splunk. Run performance tests with a profiler. Optimize database queries, implement caching, and scale horizontally.
* **15. What are the strategies to optimize the performance of a Spring Boot application?**
Implement caching, optimize DB queries, use `@Async` for non-blocking operations, apply load balancing, optimize code time complexity, and use Spring WebFlux for massive concurrent connections.

---

## 💾 APIs & Data Access

* **16. What are the best practices for versioning REST APIs?**
* **URL Versioning:** `/api/v1/products`
* **Header Versioning:** Custom headers (e.g., `X-API-Version: 1`)
* **Media Type Versioning:** `Accept: application/vnd.company.v1+json`
* **Parameter Versioning:** `/api/products?version=1`


* **17. How does Spring Boot simplify the data access layer?**
It auto-configures `DataSource` and JPA settings. It provides `JpaRepository` for instant CRUD operations without boilerplate code and translates SQL exceptions into consistent Spring data access exceptions.
* **18. What are best practices for managing transactions?**
Always apply `@Transactional` at the Service layer (where business logic resides) so multiple repository calls succeed or roll back together.
* **19. How would you implement a "Soft Delete" feature?**
Add a `deleted` boolean column. Update this column instead of running a SQL `DELETE`. Use Hibernate's `@Where(clause = "deleted=false")` to automatically filter out soft-deleted records.
* **20. How do you build a non-blocking reactive REST API?**
Use **Spring WebFlux**. Return `Mono<T>` or `Flux<T>` from controllers, and use reactive database repositories (like R2DBC) to ensure the entire stack is non-blocking.
* **21. How can you implement pagination?**
Pass a `PageRequest` (implementing the `Pageable` interface) containing the page number and size to Spring Data JPA repository methods to return a `Page<T>` object.
```java
Pageable pageable = PageRequest.of(0, 10, Sort.by("name"));
Page<User> users = userRepository.findAll(pageable);

```



---

## ⚙️ Core Configurations & Annotations

* **22. What does `@SpringBootApplication` do internally?**
It combines `@Configuration` (marks it as a bean source), `@EnableAutoConfiguration` (sets up dependencies), and `@ComponentScan` (looks for components in the current package).
* **23. Explain the role of `@EnableAutoConfiguration`.**
It auto-configures the app based on classpath dependencies (e.g., setting up Tomcat if `spring-web` is present) using conditional evaluation.
* **24. What are conditional annotations?**
Annotations like `@ConditionalOnClass` or `@ConditionalOnProperty` that tell Spring to only create a bean if specific conditions are met, allowing flexible, environment-specific configurations.
* **25. How to tell an auto-configuration to back away when a bean exists?**
Use `@ConditionalOnMissingBean`. It tells Spring to only auto-configure a bean if the developer hasn't already manually defined one.
* **26. How can we handle multiple beans of the same type?**
Use `@Qualifier("beanName")` to specify exactly which bean to inject, or use `@Primary` on one bean class to mark it as the default choice.
* **27. What does it mean that Spring Boot supports relaxed binding?**
It allows flexible property naming. `server.port`, `server-port`, and `SERVER_PORT` are all mapped to the same internal property.
* **28. What advantages does YAML offer over properties files?**
YAML supports hierarchical structures, making complex configurations much more readable. However, it is highly sensitive to indentation.
* **29. Explain how Spring Boot profiles work.**
Profiles (`application-dev.yml`, `application-prod.yml`) allow you to separate configurations for different environments, letting you switch database URLs or feature flags without changing code.
* **30. How does Spring Boot decide which embedded server to use?**
It checks the classpath. It defaults to Tomcat (included in `spring-boot-starter-web`), but will configure Jetty or Undertow if their dependencies are provided instead.
* **31. Can we override or replace the embedded Tomcat server?**
Yes. Exclude the `spring-boot-starter-tomcat` dependency and include `spring-boot-starter-jetty`.
* **32. Explain the concept of embedded servlet containers.**
Spring Boot builds the web server directly into the runnable JAR file, eliminating the need to install and configure an external server (like a standalone Tomcat instance) for deployment.
* **33. How does Spring Boot make Dependency Injection easier compared to traditional Spring?**
It removes the need for complex XML wiring by using component scanning (`@Autowired`, `@Service`, `@Component`) to automatically discover and inject dependencies.
* **34. What are the basic annotations that Spring Boot offers?**
`@SpringBootApplication`, `@RestController`, `@RequestMapping`, `@Service`, `@Repository`, and `@Autowired`.
* **35. How to get the list of all beans in your Spring Boot application?**
Autowire the `ApplicationContext` and call `applicationContext.getBeanDefinitionNames()`.
* **36. What is Aspect-Oriented Programming (AOP) in the Spring framework?**
AOP separates cross-cutting concerns (like logging or security) from core business logic, defining them in an "aspect" and applying them globally.
* **37. Explain Spring Boot's approach to asynchronous operations.**
It uses `@Async` to run tasks in a background thread. It requires `@EnableAsync` on a config class.
* **38. How can you enable and use asynchronous methods?**
```java
@Configuration
@EnableAsync
public class AsyncConfig {}

@Service
public class EmailService {
    @Async
    public void sendEmailInBackground() {
        // Executes in a separate thread
    }
}

```



---

## 🛡️ Security

* **39. What is the difference between Authentication and Authorization?**
* **Authentication:** Verifying *who* you are (login credentials).
* **Authorization:** Verifying *what* you are allowed to do (roles/permissions).


* **40. Describe how you would secure sensitive data accessed by users with different roles.**
Implement authentication, Role-Based Access Control (RBAC), encrypt sensitive data, enforce HTTPS, and externalize database credentials out of the source code.
* **41. How is Spring Security implemented?**
Add the security starter dependency, create a `SecurityFilterChain` bean to define protected routes, implement `UserDetailsService` to fetch users, and configure a `PasswordEncoder` (like BCrypt).
* **42. Discuss securing an application using JSON Web Tokens (JWT).**
Upon login, issue a signed JWT containing user roles. For subsequent requests, a custom Spring Security filter intercepts the request, validates the JWT signature, and authenticates the user without querying the database.
* **43. Configure Spring Security for basic form-based authentication.**
Use `http.formLogin()` in your security configuration to enable the default login page and `http.authorizeHttpRequests()` to restrict endpoints.
* **44. Discuss the configuration of Spring Boot security to address common security concerns.**
Enforce HTTPS, enable default CSRF protection, secure session management against fixation attacks, and strongly hash passwords.

---

## 🚦 Monitoring & Actuator

* **45. What are Spring Boot Actuator endpoints?**
They provide built-in endpoints (like `/actuator/health` and `/actuator/metrics`) to monitor and manage the application in production environments.
* **46. How can we secure the actuator endpoints?**
Limit exposure via `application.properties`, require authentication via Spring Security, and restrict access to users with a specific `ACTUATOR_ADMIN` role.
* **47. How would you manage and monitor asynchronous tasks?**
Return `CompletableFuture` from `@Async` methods, configure a custom `ThreadPoolTaskExecutor`, and monitor thread pool exhaustion using Actuator metrics.

---

## 🧪 Testing

* **48. How do you approach testing in a Spring Boot application?**
Use Unit Testing (with Mockito) to test methods in isolation, and Integration Testing to test how components interact within the Spring application context.
* **49. Discuss the use of `@SpringBootTest` and `@MockBean`.**
* `@SpringBootTest`: Loads the full application context for integration tests.
* `@MockBean`: Replaces a real bean in the Spring context with a Mockito mock (useful for mocking databases or external APIs during tests).


* **50. How can you mock external services in a test?**
Use `@MockBean` on the FeignClient or RestTemplate wrapper, and use `Mockito.when()` to return predefined responses.
* **51. How do you mock microservices during testing?**
Use tools like **WireMock** to spin up a fake local server that returns predetermined JSON responses to your application's HTTP calls.

---

## 📦 Deployment & Practical Scenarios

* **52. Describe a project where you improved performance and the techniques used.**
*(Example)*: Optimized database queries using connection pooling, implemented EhCache for read-heavy endpoints, enabled HTTP response compression, and moved heavy email notifications to `@Async` queues.
* **53. How would you handle file uploads in Spring Boot?**
Create a `@PostMapping` that accepts a `MultipartFile` parameter to process the incoming binary data.
* **54. How would you send welcome emails after registration?**
Add `spring-boot-starter-mail`, configure SMTP credentials in properties, and inject `JavaMailSender` into a service to dispatch the email.
* **55. What is Spring Boot CLI?**
A command-line tool that allows you to rapidly prototype and run Spring applications using Groovy scripts without standard project boilerplate.
* **56. Can we create a non-web application with Spring Boot?**
Yes. Simply exclude the web starters. Use `CommandLineRunner` or `ApplicationRunner` interfaces to execute backend processing logic immediately upon startup.
* **57. How does Spring Boot support internationalization (i18n)?**
By utilizing `messages.properties` and `messages_fr.properties` files. Spring's `LocaleResolver` determines which file to use based on the client's `Accept-Language` header.
* **58. What is Spring Boot DevTools used for?**
It significantly speeds up local development by automatically restarting the application when Java files change and enabling LiveReload for frontend resources.
* **59. How to deploy as JAR vs WAR files?**
* **JAR:** The default. Contains the embedded server. Run via `java -jar`.
* **WAR:** Change packaging in Maven/Gradle, extend `SpringBootServletInitializer`, and deploy to a standalone external server (like enterprise Tomcat).


* **60. Discuss integration with CI/CD pipelines.**
Automate building, running tests (`mvn clean test`), and deploying the application using platforms like Jenkins, GitLab CI, or GitHub Actions on every code push.
* **61. How to resolve the "White Label Error Page"?**
Ensure your controller URLs are mapped correctly. For a better UX, create a custom class implementing `ErrorController` or handle specific exceptions globally using `@ControllerAdvice`.
* **62. How to handle a 404 error?**
Map a custom method to `/error` within a custom `ErrorController`, or configure a specific `404.html` template if using Thymeleaf.
* **63. How can a Spring Boot application implement event-driven architecture?**
Create custom events extending `ApplicationEvent`, publish them via `ApplicationEventPublisher`, and listen to them using `@EventListener` (or `@TransactionalEventListener`).
* **64. How would you integrate cloud storage (like AWS S3)?**
Add the cloud provider's SDK (e.g., AWS SDK for Java). Configure credentials securely, and create a service wrapper to abstract the upload/download logic.
* **65. Ensure fair API usage.**
*(Related to Question 2)*: Implement Rate Limiting via Bucket4j mapped to specific high-traffic controller endpoints.
* **66. Managing background notifications via queues.**
Integrate RabbitMQ or Kafka. Use `KafkaTemplate` to publish messages to a topic, allowing a separate consumer service to process the notifications asynchronously.
* **67. Explain the process of creating a Docker image for Spring Boot.**
Create a `Dockerfile` using a base Java image (e.g., `eclipse-temurin:17-jre`), `COPY` the target `.jar` file into the container, and set the `ENTRYPOINT` to `["java", "-jar", "/app.jar"]`.
* **68. Handling API rate limits and failures from external APIs.**
Use Resilience4j to wrap your `RestTemplate`/`WebClient` calls in Circuit Breakers and Retry configurations so your app doesn't crash when the external API goes down.
* **69. Securing an application to ensure only authenticated users access certain endpoints.**
In your Security Configuration, use `http.authorizeHttpRequests(auth -> auth.requestMatchers("/public/**").permitAll().anyRequest().authenticated())`.
