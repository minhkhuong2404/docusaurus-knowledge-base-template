---
id: spring-boot-bootstrap-yml
title: Understanding bootstrap.yml in Spring Boot
sidebar_label: bootstrap.yml Guide
description: A comprehensive guide to bootstrap.yml in Spring Boot — covering the bootstrap context lifecycle, configuration server integration, spring.config.import evolution in Spring Boot 2.4+, and senior deep dives on pitfalls.
tags:
- technical-knowledge
- spring
- spring-boot
- spring-cloud
---

# Understanding bootstrap.yml in Spring Boot

In the Spring Boot ecosystem, configuration management is highly flexible. While most developers are familiar with `application.yml` (or `application.properties`), Spring Cloud introduces `bootstrap.yml`. 

This guide covers what `bootstrap.yml` is, how it works under the hood, when to use it, and how Spring Boot 2.4+ changed config loading with `spring.config.import`.

---

## 1. What is bootstrap.yml? (For New Learners)

To understand `bootstrap.yml`, it is helpful to look at the lifecycle of a Spring Boot application as a two-stage process:

1. **The Bootstrap Stage**: The application prepares itself to load its main configuration.
2. **The Main Stage**: The application initializes its beans, database pools, controllers, and business logic.

```
       [Stage 1: Bootstrap]                       [Stage 2: Main Application]
   Loads bootstrap.yml/properties            Loads application.yml/properties
   Connects to external Config Server        Initializes Spring Beans (DataSources, etc.)
   Fetches dynamic environments/secrets      Starts Tomcat/Netty Web Server
```

### When do you use bootstrap.yml?
You use `bootstrap.yml` when your application needs to fetch its configuration from an **external source** (like Spring Cloud Config Server, HashiCorp Vault, Consul, or AWS Secrets Manager) **before** it configures local beans.

For example, to load database credentials from a central server:
1. The app must first query the external server.
2. To query the server, it needs the server's address (`spring.cloud.config.uri`) and credentials.
3. These bootstrap settings are placed in `bootstrap.yml`.
4. The rest of the application settings (port, database connections, logging) are loaded from `application.yml` or the fetched properties.

#### Sample `bootstrap.yml`:
```yaml
spring:
  application:
    name: payment-service
  cloud:
    config:
      uri: http://config-server.internal.net:8888
      fail-fast: true
```

#### Sample `application.yml`:
```yaml
server:
  port: 8080
logging:
  level:
    org.springframework: INFO
```

---

## 2. Under the Hood: How it Works (Intermediate)

When Spring Cloud is present on the classpath, it creates a **Bootstrap Application Context** before initializing the main application context.

```
   +---------------------------------------+
   |      Bootstrap Parent Context         |  <--- Loads bootstrap.yml
   +---------------------------------------+
                       |
                       v  (Acts as parent)
   +---------------------------------------+
   |      Application Child Context        |  <--- Loads application.yml
   +---------------------------------------+
```

### The Parent-Child Context Relationship
The Bootstrap Context acts as the **parent** of the main Application Context. 
* Any properties loaded into the parent (bootstrap) context are inherited by the child (application) context.
* If a property is defined in both `bootstrap.yml` and `application.yml`, the property in `application.yml` has higher priority and overrides the bootstrap value by default, unless the property is loaded from an external config server (which has high precedence).

---

## 3. Senior Deep Dive

As applications evolved, the bootstrap context approach introduced issues like slow startup times, classloader complexity, and logging bootstrapping problems. Let's analyze how this works at a senior level.

### The Bootstrap Context Lifecycle

The bootstrap phase is managed by the `BootstrapApplicationListener`, which intercepts the Spring Boot startup process:

1. `SpringApplication.run()` is invoked.
2. Spring Boot emits a `ApplicationEnvironmentPreparedEvent`.
3. `BootstrapApplicationListener` intercepts this event.
4. It creates a temporary `SpringApplication` instance specifically to build the **Bootstrap Context** and loads `bootstrap.yml`.
5. Classes implementing `PropertySourceLocator` (like `ConfigServicePropertySourceLocator`) are looked up.
6. The locator queries the remote config server or vault and returns the remote configurations as a `PropertySource`.
7. These property sources are prepended to the environment.
8. The bootstrap context is closed, and its environment is merged as a parent property source into the main application context.

---

## 4. The Spring Boot 2.4+ Paradigm Shift (`spring.config.import`)

Starting with **Spring Boot 2.4**, the configuration loading mechanism was redesigned. 

> [!IMPORTANT]
> In Spring Boot 2.4 and later, **bootstrap context processing is disabled by default**. 
> The recommended approach is to use the native `spring.config.import` property inside `application.yml`.

### Why the change?
The bootstrap context was heavy. It initialized a second Spring context, which ran post-processors, loaded initializers, and registered event listeners twice. This led to:
- Long startup delays.
- Complexity when trying to configure loggers (since logging is initialized before the main context).
- Duplicate bean definitions if scanners were not configured carefully.

### The Modern Alternative: `spring.config.import`
In Spring Boot 2.4+, you can import external configurations directly in `application.yml` without needing `bootstrap.yml`:

```yaml
# application.yml
spring:
  application:
    name: payment-service
  config:
    import:
      - "optional:configserver:http://config-server.internal.net:8888"
      - "optional:vault://secret/payment-service"
```

* **`optional:` prefix**: Tells Spring Boot not to crash on startup if the configuration server is unreachable (useful for local development).
* **`configserver:` / `vault:` prefix**: Tells Spring Boot which locator engine to use for importing the config.

### How to Re-enable bootstrap.yml (Legacy Migration)
If you are migrating a legacy Spring Cloud application and cannot easily switch to `spring.config.import`, you can re-enable the classic `bootstrap.yml` processing in one of two ways:

1. **Add Dependency**: Add `spring-cloud-starter-bootstrap` to your `pom.xml` / `build.gradle`:
   ```xml
   <dependency>
       <groupId>org.springframework.cloud</groupId>
       <artifactId>spring-cloud-starter-bootstrap</artifactId>
   </dependency>
   ```
2. **Environment Flag**: Set the system property or environment variable:
   ```properties
   spring.cloud.bootstrap.enabled=true
   ```

---

## 5. Architectural Pitfalls & Best Practices

Senior engineers must watch for these common issues when managing configuration boots:

### 1. Dual-Context Bean Instantiation
If your application uses component scanning without excluding configuration classes, Spring may instantiate beans in both the bootstrap context and the application context.

* **The Problem**: A Database pool (like `HikariDataSource`) might be initialized in the bootstrap parent context. Because parent contexts are not destroyed automatically when the child context starts, this creates active, leaked connections that are never used.
* **The Solution**: Restrict your `@SpringBootApplication` scanning or use `@Conditional` annotations to prevent beans from initializing during the bootstrap phase.

### 2. Logging Bootstrapping Mismatch
Logging configurations (like `logback-spring.xml`) are initialized early in the Spring Boot lifecycle.
* If your logging configuration relies on properties fetched from a Config Server (e.g. `logging.file.path`), they will **not** be available when logback starts because the bootstrap context hasn't loaded them yet.
* This results in log directories being created with literal strings like `${logging.file.path}_IS_UNDEFINED/`.
* **The Solution**: Use `spring.config.import` (which binds properties before logging system initialization completes) or define logging variables strictly as environment variables.

### 3. Jasypt Decryption Order
If you use Jasypt for configuration encryption:
* If Jasypt decrypts properties in `application.yml`, but those properties depend on a master password fetched from Vault in `bootstrap.yml`, decryption will fail on startup.
* **The Solution**: Configure Jasypt to run at the bootstrap phase using:
  ```yaml
  # bootstrap.yml
  jasypt:
    encryptor:
      bootstrap: true
  ```

---

## Summary Decision Matrix

| Requirement | Use `application.yml` | Use `spring.config.import` | Use `bootstrap.yml` |
|---|:---:|:---:|:---:|
| **Standard Spring Boot App** (No Spring Cloud) | ✅ Yes | ❌ No | ❌ No |
| **Spring Boot 2.4+** with Config Server/Vault | ✅ Yes | ✅ Yes (Recommended) | ❌ No (Requires enabling flag) |
| **Legacy Spring Cloud** (Pre-2.4 compatibility) | ❌ No | ❌ No | ✅ Yes (Classic pattern) |
| **Custom early initialization** (e.g., custom environment encryptors) | ❌ No | ❌ No | ✅ Yes |

---

## Related Pages

- [Spring Boot Configuration Priority & OS Environment Variables](../../non-technical-knowledge/sdlc/deployment/deployment-configuration-verification)
- [Spring Boot Advanced Configurations](./spring-boot-advanced)
- [Spring Cloud Overview](./spring-cloud)
