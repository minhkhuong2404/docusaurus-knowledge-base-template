---
title: Spring Boot — Internals & Architecture
description: Deep dive into Spring Boot internals, including auto-configuration, embedded servers, conditional beans, starters, and events.
tags: [spring-boot, java, internals, auto-configuration]
---

# Spring Boot — Internals & Architecture

A deep dive into how Spring Boot works under the hood: auto-configuration mechanics, the embedded server model, conditional bean loading, custom starters, and the event-driven architecture.

---

## Auto-Configuration Deep Dive

### How Auto-Configuration Works

When `@EnableAutoConfiguration` is present (included in `@SpringBootApplication`), Spring Boot:

1. Reads `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` (Spring Boot 3.x) or `META-INF/spring.factories` (2.x) from every JAR on the classpath
2. Loads the listed auto-configuration classes
3. Evaluates **conditional annotations** on each class
4. Registers beans only if conditions are met

```
Classpath has HikariCP + PostgreSQL driver
  → DataSourceAutoConfiguration conditions pass
    → HikariDataSource bean created
    → JdbcTemplate bean created
```

### Key Conditional Annotations

| Annotation | Bean Is Created When… |
|------------|----------------------|
| `@ConditionalOnClass` | A specific class is on the classpath |
| `@ConditionalOnMissingBean` | No bean of that type already exists |
| `@ConditionalOnProperty` | A property has a specific value |
| `@ConditionalOnBean` | A specific bean already exists in the context |
| `@ConditionalOnMissingClass` | A specific class is NOT on the classpath |
| `@ConditionalOnWebApplication` | The app is a web application |
| `@ConditionalOnExpression` | A SpEL expression evaluates to true |

### Example: DataSource Auto-Configuration

```java
@AutoConfiguration
@ConditionalOnClass({ DataSource.class, EmbeddedDatabaseType.class })
@ConditionalOnMissingBean(type = "io.r2dbc.spi.ConnectionFactory")
@EnableConfigurationProperties(DataSourceProperties.class)
public class DataSourceAutoConfiguration {

    @Configuration
    @ConditionalOnMissingBean(DataSource.class)
    @ConditionalOnProperty(name = "spring.datasource.url")
    static class PooledDataSourceConfiguration {
        // Creates HikariCP DataSource with properties from application.yml
    }
}
```

**What this means:** Spring Boot only creates a `DataSource` if:
- `DataSource` class is on the classpath ✓
- No R2DBC `ConnectionFactory` exists ✓
- No custom `DataSource` bean is already defined ✓
- `spring.datasource.url` property is set ✓

### Overriding Auto-Configuration

Define your own bean, and auto-configuration backs off:

```java
@Configuration
public class CustomDataSourceConfig {

    @Bean
    public DataSource dataSource() {
        // Your custom DataSource — auto-config won't create one
        return new CustomPoolDataSource();
    }
}
```

You can also exclude specific auto-configurations:

```java
@SpringBootApplication(exclude = { DataSourceAutoConfiguration.class })
```

---

## Embedded Server Architecture

### How It Works

Traditional Java web apps are packaged as WAR files and deployed to an external Tomcat/JBoss/WebLogic. Spring Boot flips this model:

```
Traditional:  App → WAR → External Server
Spring Boot:  App + Server → Fat JAR → java -jar
```

Spring Boot embeds the server inside the application:

1. `ServletWebServerAutoConfiguration` detects servlet container on the classpath
2. Creates an `EmbeddedServletContainerFactory` (e.g., `TomcatServletWebServerFactory`)
3. Starts the server during `ApplicationContext` refresh
4. Registers `DispatcherServlet` programmatically

### Server Options

| Server | Starter | Use Case |
|--------|---------|----------|
| **Tomcat** | Default (included in `starter-web`) | General purpose, most widely used |
| **Jetty** | `spring-boot-starter-jetty` | Lightweight, good for async/WebSocket |
| **Undertow** | `spring-boot-starter-undertow` | High performance, non-blocking |

Switching servers — exclude Tomcat, add the alternative:

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
    <artifactId>spring-boot-starter-undertow</artifactId>
</dependency>
```

---

## Spring Boot Starter Mechanism

### What Is a Starter?

A starter is a **dependency descriptor** — a POM with no code, only managed transitive dependencies. It ensures compatible versions across libraries.

### Anatomy of a Starter

```
spring-boot-starter-data-jpa
├── spring-boot-starter (core)
├── spring-boot-starter-aop
├── spring-data-jpa
├── hibernate-core
├── jakarta.persistence-api
├── spring-orm
└── spring-aspects
```

### Creating a Custom Starter

Custom starters follow a naming convention: `{project}-spring-boot-starter`.

**Structure:**

```
my-service-spring-boot-starter/
├── src/main/java/
│   └── com/example/autoconfigure/
│       ├── MyServiceAutoConfiguration.java
│       └── MyServiceProperties.java
└── src/main/resources/
    └── META-INF/
        └── spring/
            └── org.springframework.boot.autoconfigure.AutoConfiguration.imports
```

**Auto-configuration class:**

```java
@AutoConfiguration
@ConditionalOnClass(MyService.class)
@EnableConfigurationProperties(MyServiceProperties.class)
public class MyServiceAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public MyService myService(MyServiceProperties properties) {
        return new MyService(properties.getEndpoint(), properties.getTimeout());
    }
}
```

**Properties class:**

```java
@ConfigurationProperties(prefix = "my.service")
public class MyServiceProperties {
    private String endpoint = "http://localhost:8080";
    private int timeout = 5000;
    // getters and setters
}
```

**Registration file** (`AutoConfiguration.imports`):

```
com.example.autoconfigure.MyServiceAutoConfiguration
```

---

## Spring Boot Event System

Spring Boot publishes events during the application lifecycle. You can hook into these for custom initialization, logging, or cleanup.

### Application Lifecycle Events (in order)

| Event | When It Fires |
|-------|--------------|
| `ApplicationStartingEvent` | Before anything — just after `run()` is called |
| `ApplicationEnvironmentPreparedEvent` | Environment is ready, context not yet created |
| `ApplicationContextInitializedEvent` | Context created, beans not yet loaded |
| `ApplicationPreparedEvent` | Beans loaded, context not yet refreshed |
| `ContextRefreshedEvent` | Context fully refreshed, all beans instantiated |
| `ApplicationStartedEvent` | Context refreshed, runners not yet called |
| `ApplicationReadyEvent` | Everything ready — app can serve traffic |
| `ApplicationFailedEvent` | Startup failed with an exception |

### Listening to Events

```java
@Component
public class ReadinessListener {

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        // Initialize caches, warm up connections, etc.
    }
}
```

For events before the context is ready, register via `SpringApplication`:

```java
SpringApplication app = new SpringApplication(MyApp.class);
app.addListeners(event -> {
    if (event instanceof ApplicationEnvironmentPreparedEvent) {
        // Modify environment before context is created
    }
});
app.run(args);
```

---

## Configuration Properties Binding

Spring Boot can bind structured properties to Java objects:

```yaml
app:
  cache:
    enabled: true
    ttl: 300
    max-size: 1000
```

```java
@ConfigurationProperties(prefix = "app.cache")
public class CacheProperties {
    private boolean enabled;
    private int ttl;
    private int maxSize;
    // getters and setters
}
```

**Binding features:**

- **Relaxed binding** — `max-size`, `maxSize`, `MAX_SIZE` all map to `maxSize`
- **Type conversion** — Strings to `Duration`, `DataSize`, enums, etc.
- **Validation** — Add `@Validated` and use JSR-303 annotations (`@NotNull`, `@Min`, etc.)
- **Nested objects** — Complex hierarchies bind naturally
- **List/Map support** — YAML lists and maps bind to `List<>` and `Map<>`

---

## Fat JAR Structure

Spring Boot packages everything into an executable JAR:

```
my-app.jar
├── BOOT-INF/
│   ├── classes/          ← Your compiled code
│   ├── lib/              ← All dependency JARs
│   └── classpath.idx     ← JAR loading order
├── META-INF/
│   └── MANIFEST.MF       ← Main-Class: JarLauncher
└── org/springframework/boot/loader/
    ├── JarLauncher.class  ← Entry point
    └── ...                ← Custom classloader
```

**How it boots:**

1. JVM calls `JarLauncher.main()` (specified in MANIFEST.MF)
2. `JarLauncher` sets up a custom `ClassLoader` that can read nested JARs
3. Delegates to your `@SpringBootApplication` class's `main()`

---

## Profiles Architecture

Profiles control which beans and configurations are active:

```java
@Configuration
@Profile("production")
public class ProductionConfig {

    @Bean
    public DataSource dataSource() {
        // Production connection pool
    }
}

@Configuration
@Profile("development")
public class DevConfig {

    @Bean
    public DataSource dataSource() {
        // In-memory H2 for development
    }
}
```

**Profile resolution order:**

1. `spring.profiles.active` from command line
2. `spring.profiles.active` from environment variable
3. `spring.profiles.active` from `application.properties`
4. `spring.profiles.default` (defaults to `"default"`)

**Profile-specific property files** are loaded automatically:
- `application-dev.yml` when `dev` profile is active
- `application-prod.yml` when `prod` profile is active
- Values in profile-specific files override `application.yml`

---

## Summary

Spring Boot's power comes from:

- **Conditional auto-configuration** that reacts to the classpath
- **Embedded servers** that simplify deployment
- **Starter POMs** that ensure dependency compatibility
- **A rich event system** for lifecycle hooks
- **Relaxed property binding** for type-safe configuration
- **Fat JAR packaging** for single-artifact deployment

Understanding these internals enables you to debug startup issues, write custom starters, and optimize application behavior.

---

## Advanced Editorial Pass: Spring Boot Internals for Debuggability

### Why Internals Matter in Real Systems
- Understanding condition evaluation prevents accidental behavior changes during upgrades.
- Context lifecycle clarity improves startup sequencing and shutdown safety.
- Bean wiring visibility reduces time-to-diagnosis for production misconfiguration.

### Failure Modes
- Relying on implicit ordering for critical initialization logic.
- Hidden bean replacement through permissive component scanning.
- Configuration binding mismatches that fail late under specific profiles.

### Practical Heuristics
1. Keep package boundaries explicit for component scanning and auto-configuration imports.
2. Surface condition and binding diagnostics in non-production environments.
3. Add smoke tests for key context invariants after dependency upgrades.

### Compare Next
- [Spring Boot - Overview & Why It Matters](./spring-boot.md)
- [Spring Boot - Advanced Topics](./spring-boot-advanced.md)
- [Spring Framework: Deep Dive](./spring-framework-deep-dive.md)
