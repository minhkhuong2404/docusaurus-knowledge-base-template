---
id: spring-boot-interview
title: Spring Boot Interview Questions
sidebar_label: Spring Boot
description: "Top Spring Boot interview questions covering annotations, configuration, and service development basics."
tags: [spring-boot, java, interview, backend]
---

# Top Spring Boot Interview Questions & Answers

These questions cover core Spring Boot concepts, auto-configuration mechanics, starter dependencies, and embedded containers.

## 1. What is Spring Boot and why should we use it?

Spring Boot is an extension of the Spring framework designed to simplify the bootstrap and development of new Spring applications. It eliminates the boilerplate XML configurations and complex setup required in traditional Spring applications.

### Core Pillars of Spring Boot

1. **Auto-configuration:** Dynamically configures beans based on dependencies detected in the classpath.
2. **Starter Dependencies:** Curated POMs that group transitive dependencies, resolving version conflicts out of the box.
3. **Embedded Servlet Containers:** Packages the web server (Tomcat, Jetty) inside the runnable JAR file.
4. **Production-Ready Features:** Provides out-of-the-box monitoring via Actuator, metrics collection, externalized configuration, and security.

---

## 2. Under the Hood: How does Auto-Configuration work?

Auto-configuration is triggered by the `@EnableAutoConfiguration` annotation (which is part of the `@SpringBootApplication` composite annotation).

### Step-by-Step Flow

```
1. @SpringBootApplication imports @EnableAutoConfiguration
   │
   ▼
2. AutoConfigurationImportSelector is loaded
   │
   ▼
3. Reads configuration imports file:
   - Spring Boot 2.x: META-INF/spring.factories
   - Spring Boot 3.x: META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
   │
   ▼
4. Loads list of candidate configuration classes (e.g., DataSourceAutoConfiguration)
   │
   ▼
5. Filters candidates using @Conditional annotations:
   - @ConditionalOnClass (Is the library jar in classpath?)
   - @ConditionalOnMissingBean (Has the user already defined this bean?)
   - @ConditionalOnProperty (Is the config enabled in application.properties?)
   │
   ▼
6. Registers remaining beans in the ApplicationContext
```

### Example: DataSourceAutoConfiguration
If Spring Boot finds the `h2` database jar on the classpath (`@ConditionalOnClass(DataSource.class)`), and you have NOT manually defined a `DataSource` bean (`@ConditionalOnMissingBean(DataSource.class)`), it automatically configures an in-memory H2 database connection pool.

---

## 3. How does Spring Boot manage starter dependencies and versions?

Spring Boot uses a **BOM (Bill of Materials)** pattern to manage dependency versions, avoiding compatibility errors between libraries.

### Parent POM Structure
Your application's `pom.xml` typically inherits from `spring-boot-starter-parent`:
```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.0</version>
</parent>
```
The parent POM references `spring-boot-dependencies`, which is the BOM. This BOM contains a `<dependencyManagement>` section defining compatible versions for hundreds of popular libraries (Jackson, Hibernate, JUnit, etc.).

### Benefit
When adding a dependency managed by the parent, you do not need to specify the `<version>` tag:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
    <!-- Version is inherited from parent BOM, ensuring compatibility -->
</dependency>
```

---

## 4. How are Embedded Servlet Containers bootstrapped?

In traditional Spring MVC, you build a WAR file and deploy it to a standalone web server (like external Tomcat). In Spring Boot, the server is embedded.

### Programmatic Web Server Bootstrapping
During startup, the `SpringApplication.run()` method initializes a specialized `ApplicationContext` called `ServletWebServerApplicationContext` (for servlet apps) or `ReactiveWebServerApplicationContext` (for WebFlux apps).

1. During the **`onRefresh()`** phase of the context lifecycle, Spring Boot looks for a bean implementing the `ServletWebServerFactory` interface (e.g., `TomcatServletWebServerFactory`).
2. The factory instantiates a class implementing the `WebServer` interface (e.g., `TomcatWebServer`).
3. This class programmatically starts the embedded server instance:
   ```java
   // Conceptual internal Tomcat bootstrap
   Tomcat tomcat = new Tomcat();
   tomcat.setPort(port);
   tomcat.start();
   ```
4. Finally, Spring Boot registers the `DispatcherServlet` into this programmatic Tomcat context.

---

## 5. Difference between `@Controller` and `@RestController`

* **`@Controller`:** Used to define traditional Spring MVC controllers that return **views** (e.g. HTML pages via Thymeleaf or JSP). If you want a method to return raw data instead, you must annotate it with `@ResponseBody`.
* **`@RestController`:** A specialized convenience annotation that combines `@Controller` and `@ResponseBody`. Every handler method in a `@RestController` automatically serializes its return value directly into the HTTP response body (typically as JSON or XML using Jackson).

```java
// Equivalent declarations:
@Controller
@ResponseBody
public class MyLegacyController { ... }

@RestController
public class MyModernController { ... }
```

---

## 6. How to change the default embedded server?

By default, the `spring-boot-starter-web` transitive dependencies pull in Tomcat. To switch to **Jetty** or **Undertow**, you must exclude the tomcat starter and declare the alternative:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-tomcat</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-jetty</artifactId>
</dependency>
```
During context refresh, Spring Boot will fail to find `TomcatServletWebServerFactory` on the classpath but will successfully find `JettyServletWebServerFactory`, bootstrapping Jetty instead.
