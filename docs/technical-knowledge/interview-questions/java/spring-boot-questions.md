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

---

## See Also

- [Spring Boot Real-Time Interview Questions](./spring-boot-real-time-questions.md)
- [Spring Data JPA & Hibernate Internals](../../interview-questions/java/spring-boot-questions.md)
- [Microservices Design Patterns](../../system-design/microservices-patterns.md)
