---
id: spring-boot-configuration-properties
title: Spring Boot Externalized Configuration — Env Vars, Profiles & Defaults
sidebar_label: Configuration & Properties
description: Master guide to Spring Boot externalized configuration — 17-level property source precedence, environment variable relaxed binding, profile overrides, default values, and type-safe @ConfigurationProperties.
tags:
  - spring
  - spring-boot
  - configuration
  - properties
  - environment-variables
  - profiles
---

import SpringBootConfigPropertiesDiagram from '@site/src/components/SpringBootConfigPropertiesDiagram';

# Spring Boot Externalized Configuration: Env Vars, Profiles & Defaults

In microservices and cloud-native deployments, applications must follow **The Twelve-Factor App** methodology: store configuration in the environment, decouple code from deployment topology, and maintain strict separation between staging and production credentials.

Spring Boot provides a sophisticated externalized configuration engine that unifies properties from files, environment variables, system properties, and command-line arguments into a single cohesive property abstraction. 

This guide provides a Senior Principal Engineer deep dive into how Spring Boot resolves properties, handles relaxed binding, activates profile cascades, applies default values, and avoids severe production configuration disasters.

---

## Interactive Architecture Diagram

Explore the complete property resolution pipeline, 17-level precedence hierarchy, relaxed binding rules, and the `@Value` vs `@ConfigurationProperties` architectural matrix below:

<SpringBootConfigPropertiesDiagram />

---

## 1. Under the Hood: The Spring Boot Property Resolution Engine

When a Spring Boot application initializes via `SpringApplication.run()`, before any Spring beans are constructed, the framework creates and configures a `ConfigurableEnvironment` (typically `StandardServletEnvironment` or `StandardReactiveWebEnvironment`).

```
                ┌────────────────────────────────────────┐
                │          SpringApplication.run()       │
                └───────────────────┬────────────────────┘
                                    │ Emits ApplicationEnvironmentPreparedEvent
                                    ▼
                ┌────────────────────────────────────────┐
                │        ConfigurableEnvironment         │
                │  (Maintains MutablePropertySources)    │
                └───────────────────┬────────────────────┘
                                    │ Evaluates Top-Down (First Non-Null Wins)
    ┌───────────────────────────────┴───────────────────────────────┐
    ▼                               ▼                               ▼
[Tier 1: CLI Args]       [Tier 3: System Props (-D)]    [Tier 4: OS Env Vars]
--server.port=9090       -Dserver.port=8080             SERVER_PORT=7000
    │                               │                               │
    └───────────────────────────────┼───────────────────────────────┘
                                    ▼
                ┌────────────────────────────────────────┐
                │    PropertySourcesPropertyResolver     │
                │        Resolved Property: 9090         │
                └────────────────────────────────────────┘
```

### The `MutablePropertySources` Chain
Internally, the `Environment` maintains an ordered list of `PropertySource<?>` objects inside a `MutablePropertySources` collection. When your code requests a property (e.g., via `@Value("${server.port}")` or `@ConfigurationProperties`):
1. The `PropertySourcesPropertyResolver` queries each `PropertySource` in sequence starting from index `0`.
2. As soon as a `PropertySource` returns a non-null value for that property name, **iteration halts immediately**.
3. If no property source provides a value, Spring Boot evaluates the default fallback expression (`:default_val`). If no default is defined, it throws an `IllegalArgumentException: Could not resolve placeholder`.

---

## 2. The 17-Level Precedence Hierarchy (The Engine Truth)

Spring Boot defines a strict order of precedence for property resolution. When the same key is configured in multiple places, the source higher up in this list **overrides** the ones below it:

| Rank | Property Source | Underlying Class / Origin | Production Scope |
| :---: | :--- | :--- | :--- |
| **1** | Devtools Global Settings | `~/.config/spring-boot-devtools.properties` | Local developer machine |
| **2** | `@TestPropertySource` annotations | Test execution context | Unit/Integration testing |
| **3** | `@SpringBootTest#properties` attribute | Test execution context | Test slice configuration |
| **4** | **Command-Line Arguments** | `SimpleCommandLinePropertySource` | Container runtime overrides (`--port=9090`) |
| **5** | **`SPRING_APPLICATION_JSON`** | `SpringApplicationJsonEnvironmentPostProcessor` | Cloud platforms, single JSON string |
| **6** | `ServletConfig` init parameters | Java EE servlet container | Traditional WAR deployments |
| **7** | `ServletContext` init parameters | Java EE servlet context | Shared web application settings |
| **8** | JNDI attributes | `JndiPropertySource` (`java:comp/env`) | Legacy application servers (WebLogic/JBoss) |
| **9** | **Java System Properties** | `System.getProperties()` (`-Dserver.port=8080`) | JVM launch flags |
| **10** | **OS Environment Variables** | `System.getenv()` (`export SERVER_PORT=8080`) | Docker, Kubernetes, Linux shell |
| **11** | `RandomValuePropertySource` | `RandomValuePropertySource` (`random.*`) | Random ports, tokens, UUIDs |
| **12** | **Profile File (Outside JAR)** | `file:./config/application-{profile}.yml` | Mounted Kubernetes ConfigMaps |
| **13** | **Profile File (Inside JAR)** | `classpath:/application-{profile}.yml` | Packaged profile configs (git committed) |
| **14** | **Application File (Outside JAR)** | `file:./config/application.yml` | Mounted baseline host configs |
| **15** | **Application File (Inside JAR)** | `classpath:/application.yml` | Default baseline application configuration |
| **16** | `@PropertySource` annotations | Loaded via `@Configuration` classes | Legacy third-party property files |
| **17** | **Default Properties** | `SpringApplication.setDefaultProperties(Map)` | Programmatic fallback dictionary |

### ⚠️ The JVM System Property vs. OS Env Var Precedence Trap
Notice that **Java System Properties (Rank 9) override OS Environment Variables (Rank 10)**!

This creates one of the most common production debugging nightmares in containerized environments:
```bash
# Dockerfile contains an entrypoint with hardcoded JVM flag:
ENTRYPOINT ["java", "-Dspring.datasource.url=jdbc:postgresql://localhost:5432/mydb", "-jar", "/app.jar"]
```
If a DevOps engineer attempts to override the database host in Kubernetes by injecting an environment variable:
```yaml
env:
  - name: SPRING_DATASOURCE_URL
    value: "jdbc:postgresql://aurora-prod.internal:5432/mydb"
```
**Spring Boot will completely ignore `SPRING_DATASOURCE_URL`!** Because `-Dspring.datasource.url` is evaluated at Rank 9, it silently wins over the Rank 10 OS environment variable.

> **Production Rule:** Never hardcode configuration values as `-D` flags in Docker `ENTRYPOINT` or `CMD` directives unless you explicitly intend to forbid container environment overrides.

---

## 3. Environment Variable Relaxed Binding Mechanics

Operating systems and Unix shells impose strict constraints on environment variable naming:
- Bash/sh only supports alphanumeric characters (`a-z`, `A-Z`, `0-9`) and underscores (`_`).
- Characters like dots (`.`) and dashes (`-`) are illegal in Unix environment variable identifiers.

To bridge the gap between canonical YAML keys (which use dots and kebab-case) and OS environments, Spring Boot applies **Relaxed Binding**:

```
Canonical YAML Key:       spring.datasource.hikari.maximum-pool-size
                              │       │      │          │
1. Replace dots with _:       ▼       ▼      ▼          ▼
                             spring_datasource_hikari_maximum-pool-size
2. Replace dashes with _:     │       │      │          │
                             spring_datasource_hikari_maximum_pool_size
3. Convert to Uppercase:      ▼       ▼      ▼          ▼
OS Environment Variable:     SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE
```

### Relaxed Binding Rules Matrix

| Canonical Property (YAML / Code) | OS Environment Variable (Linux / K8s) | Relaxed Binding Conversion Mechanics |
| :--- | :--- | :--- |
| `spring.datasource.url` | `SPRING_DATASOURCE_URL` | Dots (`.`) converted to underscores (`_`), uppercased. |
| `spring.main.banner-mode` | `SPRING_MAIN_BANNER_MODE` | Dashes (`-`) converted to underscores (`_`), uppercased. |
| `app.rate-limiting.max-rps` | `APP_RATELIMITING_MAXRPS` or `APP_RATE_LIMITING_MAX_RPS` | Both snake_case and collapsed uppercase are valid matches. |
| `app.servers[0].hostname` | `APP_SERVERS_0_HOSTNAME` | Bracket index `[0]` converted to `_0_` underscore boundary. |
| `app.servers[1].port` | `APP_SERVERS_1_PORT` | Indexed collections in arrays or lists map to numerical indices. |
| `app.api-keys.client-a` | `APP_APIKEYS_CLIENT_A` | Map keys with dashes are converted according to relaxed rules. |

---

## 4. Default Variable Values & Fallback Expressions

When using property injection, developers must frequently provide fallback values when a property is absent from external sources.

### 1. `@Value` Default Value Syntax
The colon (`:`) separator designates the default value in a property placeholder:
```java
@Component
public class PaymentGatewayClient {

    // 1. Literal Primitive Default (defaults to 5000 if property is missing)
    @Value("${payment.gateway.timeout-ms:5000}")
    private int timeoutMs;

    // 2. String Literal Default
    @Value("${payment.gateway.currency:USD}")
    private String defaultCurrency;

    // 3. Empty String Default (trailing colon with nothing after)
    @Value("${payment.gateway.prefix:}")
    private String prefix;

    // 4. Null Default via SpEL (Spring Expression Language)
    @Value("${payment.gateway.proxy-host:#{null}}")
    private String proxyHost;

    // 5. Nested Fallback Chains (First non-null property wins)
    @Value("${PAYMENT_HOST:${FALLBACK_HOST:http://localhost:8080}}")
    private String targetHost;
}
```

### 2. Rich Type Coercion via `ConversionService`
Spring Boot automatically parses strings into rich Java types without manual conversion code:

```yaml
app:
  cache:
    ttl: 30m                  # java.time.Duration
    max-file-size: 50MB       # org.springframework.util.unit.DataSize
    supported-currencies:     # java.util.List<String>
      - USD
      - EUR
      - JPY
    environment: PRODUCTION   # Enum (AppEnv.PRODUCTION)
```

```java
@Component
public class CacheProperties {
    @Value("${app.cache.ttl:10s}")
    private Duration timeToLive;        // Parsed as Duration.ofSeconds(10)

    @Value("${app.cache.max-file-size:10MB}")
    private DataSize maxPayloadSize;    // Parsed as DataSize.ofMegabytes(10)
}
```

---

## 5. Profile Overrides & Cascading Activation

Spring Profiles allow you to segregate parts of your application configuration and make it available only in certain environments (e.g., `local`, `dev`, `staging`, `prod`).

### 1. Activating Profiles
Profiles can be activated through multiple tiers of the precedence ladder:
```bash
# 1. Command-line flag (Highest file priority)
java -jar app.jar --spring.profiles.active=prod,us-east

# 2. JVM System Property
java -Dspring.profiles.active=prod -jar app.jar

# 3. OS Environment Variable (Kubernetes Standard)
export SPRING_PROFILES_ACTIVE=prod
```

### 2. Multi-Document YAML Files (Spring Boot 2.4+)
Rather than splitting configurations across multiple files (`application-dev.yml`, `application-prod.yml`), you can consolidate them into a single `application.yml` using multi-document separators (`---`) and `spring.config.activate.on-profile`:

```yaml
# ─── Baseline Configuration (Loaded for ALL profiles) ───
server:
  port: 8080
app:
  cache:
    enabled: true
    ttl: 5m
  database:
    max-pool-size: 10

---
# ─── Local / Dev Profile Overrides ───
spring:
  config:
    activate:
      on-profile: local | dev
server:
  port: 9000
logging:
  level:
    root: DEBUG

---
# ─── Production Profile Overrides ───
spring:
  config:
    activate:
      on-profile: prod & us-east
server:
  port: 8443
app:
  database:
    max-pool-size: 50
logging:
  level:
    root: WARN
```

### 3. Profile Expression Logic
Spring Boot 2.4+ introduced boolean expressions for profile activation:
- `on-profile: prod | staging`: Activates if **either** `prod` OR `staging` is active.
- `on-profile: prod & us-east`: Activates only when **both** `prod` AND `us-east` are active.
- `on-profile: !prod`: Activates when `prod` is **NOT** active.

### 4. Profile Groups
In large microservice fleets, managing dozens of granular profiles becomes unwieldy. Profile groups allow you to define a single composite profile that automatically activates multiple underlying profiles:

```yaml
spring:
  profiles:
    group:
      production:
        - proddb
        - prodmetrics
        - prodvault
        - k8s
```
Running `--spring.profiles.active=production` automatically activates `proddb`, `prodmetrics`, `prodvault`, and `k8s`.

---

## 6. Type-Safe `@ConfigurationProperties` vs `@Value`

While `@Value("${my.prop}")` is convenient for quick prototypes, it is widely considered an **anti-pattern in enterprise production code**.

### Architectural Comparison Matrix

| Architectural Dimension | Field-Level `@Value` | `@ConfigurationProperties` (Java 17/21 Record) |
| :--- | :--- | :--- |
| **Fail-Fast Validation** | ❌ None. Throws NPE at runtime when the field is accessed. | ✅ Strict JSR-380 validation (`@NotNull`, `@Min`) during application boot. |
| **Relaxed Binding** | ❌ None. Requires exact character-for-character match. | ✅ Full relaxed binding (`camelCase`, `kebab-case`, `UPPERCASE_ENV`). |
| **Complex Hierarchies** | ❌ Painful. Requires manual parsing for nested maps and lists. | ✅ Automatic binding to nested records, typed lists, and maps. |
| **Type Safety** | ⚠️ Weak. Basic primitives and strings. | ✅ Strong type coercion (Duration, DataSize, Enums, Custom beans). |
| **IDE Autocomplete** | ❌ None. Magic string literals scattered across beans. | ✅ Full autocompletion via `spring-boot-configuration-processor`. |
| **Immutability** | ⚠️ Requires constructor boilerplate or mutable fields. | ✅ 100% immutable by design with Java Records. |

### The Modern Production Pattern: Validated Java Records

```java
package com.company.payment.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

@Validated
@ConfigurationProperties(prefix = "app.payment")
public record PaymentProperties(
    @NotBlank(message = "Payment gateway URL must not be blank")
    String gatewayUrl,

    @Min(value = 100, message = "Timeout must be at least 100ms")
    @Max(value = 30000, message = "Timeout must not exceed 30s")
    int timeoutMs,

    @NotNull
    Duration connectionTimeout,

    @Valid
    @NotNull
    RetryPolicy retry
) {
    public record RetryPolicy(
        @Min(1) int maxAttempts,
        @NotNull Duration backoffInterval
    ) {}
}
```

To enable this record in your application:
```java
@SpringBootApplication
@ConfigurationPropertiesScan("com.company.payment.config")
public class PaymentApplication {
    public static void main(String[] args) {
        SpringApplication.run(PaymentApplication.class, args);
    }
}
```

If the Kubernetes deployment manifest fails to provide `app.payment.gateway-url`, the application **crashes immediately during bootstrap with a detailed validation report**, preventing a half-initialized, broken container from passing Kubernetes readiness probes!

---

## 7. Production Gotchas & Senior Failure Modes

### 1. The "Silent Localhost Fallback" Disaster
A dangerous habit among developers is configuring fallback defaults that point to local development services:
```yaml
# ❌ DANGEROUS IN PRODUCTION
spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/orders_db
```
**Why this causes catastrophic outages:**
1. If a production Kubernetes pod fails to inject the `DB_HOST` secret due to a typo in the Secret manifest (`DB_HOSTS` instead of `DB_HOST`), Spring Boot does not fail fast.
2. It silently falls back to `localhost:5432`.
3. The pod attempts to connect to a PostgreSQL database on its own container loopback interface, hangs for 30 seconds waiting for connection timeouts, and enters a crash loop.
4. Developers waste hours debugging database connectivity when the root cause was an unmapped environment variable.

> **Remedy:** In production profile configurations (`application-prod.yml`), never specify fallback defaults for external infrastructure endpoints. Let the application fail fast if required variables are missing:
> ```yaml
> # ✅ SAFE FOR PRODUCTION
> spring:
>   datasource:
>     url: jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}
> ```

---

### 2. Actuator `/actuator/env` Secret Leakage
The Spring Boot Actuator `/env` endpoint exposes the entire `Environment` property bag, including all property sources, system properties, and environment variables.

If exposed without authorization, attackers can read database passwords, AWS credentials, and JWT signing keys.

```yaml
# Sanitize sensitive values in actuator
management:
  endpoints:
    web:
      exposure:
        include: health, info, metrics
  endpoint:
    env:
      show-values: WHEN_AUTHORIZED   # Options: NEVER, ALWAYS, WHEN_AUTHORIZED
      keys-to-sanitize:
        - password
        - secret
        - key
        - token
        - credentials
        - vcap_services
```

---

### 3. Dynamic Property Reloading with `@RefreshScope`
In Spring Cloud environments (e.g., Spring Cloud Config, Consul, Vault), properties can be reloaded dynamically at runtime without restarting the JVM:
```java
@RestController
@RefreshScope
public class FeatureFlagController {
    @Value("${feature.dark-mode:false}")
    private boolean darkModeEnabled;
}
```

**The Under-the-Hood Mechanics & Race Condition Trap:**
1. When a `/actuator/refresh` POST request is executed, Spring Cloud invalidates the target bean in the `GenericScope` cache.
2. The next time a request invokes a method on `FeatureFlagController`, Spring creates a brand-new instance of the bean and injects the updated properties.
3. **The Race Condition:** The CGLIB proxy wraps the bean. During high-concurrency request execution, if one thread triggers a refresh while another thread is mid-execution, state inconsistency or lock contention can occur.
4. **Senior Best Practice:** Avoid `@RefreshScope` on stateful beans, database connection pools, or multi-threaded background workers. Instead, use `@ConfigurationPropertiesSnapshot` or design immutable worker configurations.

---

## 8. Summary Checklist for Senior Engineers

- [ ] **Enforce Precedence Rules**: Ensure JVM `-D` flags do not accidentally override container environment variables in Docker entrypoints.
- [ ] **Prefer `@ConfigurationProperties` over `@Value`**: Group related properties into validated, immutable Java records.
- [ ] **No Localhost Defaults in Prod**: Ban `${DB_HOST:localhost}` fallback patterns in production manifests to guarantee fail-fast behavior.
- [ ] **Leverage Relaxed Binding**: Use canonical kebab-case in YAML (`app.my-service.timeout`) and uppercase snake_case in Kubernetes env vars (`APP_MYSERVICE_TIMEOUT`).
- [ ] **Sanitize Actuator Endpoints**: Restrict `/actuator/env` access and verify sensitive keys are masked with `******`.
- [ ] **Use Profile Groups**: Group microservice profile dependencies into cohesive bundles (`spring.profiles.group.prod`).
