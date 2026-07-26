---
id: externalized-configuration
title: Externalized Configuration
sidebar_label: Externalized Configuration
description: Deep dive into Externalized Configuration — 12-Factor App principle III, Spring Cloud Config Server with Git backend, hot-reload via Spring Cloud Bus, Kubernetes ConfigMaps/Secrets, HashiCorp Vault, and configuration hierarchy.
tags: [system-design, microservices, configuration, spring-cloud, kubernetes, vault, devops]
---

import ExternalizedConfigProblemDiagram from '@site/src/components/ExternalizedConfigProblemDiagram';
import ConfigHierarchyDiagram from '@site/src/components/ConfigHierarchyDiagram';
import ConfigServerGitArchitectureDiagram from '@site/src/components/ConfigServerGitArchitectureDiagram';
import GitConfigRepoStructureDiagram from '@site/src/components/GitConfigRepoStructureDiagram';
import EnvConfigMatrixDiagram from '@site/src/components/EnvConfigMatrixDiagram';
import LaunchDarklyArchitectureDiagram from '@site/src/components/LaunchDarklyArchitectureDiagram';
import LaunchDarklyRelayProxyDiagram from '@site/src/components/LaunchDarklyRelayProxyDiagram';

# Externalized Configuration

**Externalized Configuration** separates all environment-specific, changeable, or sensitive settings from the application's packaged binary — storing them outside the code in a centralized configuration service, environment variables, or secret stores — so that the **same binary can run across all environments without modification**.

> **12-Factor App, Principle III:** *"Store config in the environment. A litmus test: can you open source your codebase right now without compromising credentials? If not, your config is in your code."*

---

## 👶 Beginner: Why Config Must Leave the Code

### The Problem: Config Baked Into the JAR

<ExternalizedConfigProblemDiagram />

---

## 🏗️ The Configuration Hierarchy

In a well-designed system, configuration comes from multiple sources with a clear priority order:

<ConfigHierarchyDiagram />

This hierarchy means you can always override any config at any level — a critical production fix can be applied via an environment variable override without rebuilding the artifact.

---

## 🏗️ Architecture: Spring Cloud Config Server

### Full Architecture with Git Backend

<ConfigServerGitArchitectureDiagram />

### Git Config Repository Structure

<GitConfigRepoStructureDiagram />

```yaml
# config-repo/application.yml — Shared by ALL services
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  tracing:
    sampling:
      probability: 0.1   # 10% sampling in all environments

logging:
  level:
    root: INFO
```

```yaml
# config-repo/order-service-prod.yml — Order service, production only
spring:
  datasource:
    url: jdbc:postgresql://prod-primary-db.internal:5432/orders
    hikari:
      maximum-pool-size: 50
      minimum-idle: 10
      connection-timeout: 3000

payment:
  stripe:
    api-key: ${STRIPE_API_KEY}         # Still comes from Vault/env — never in Git!
    timeout-ms: 5000

feature:
  bulk-discount: true                  # Enabled in prod only

logging:
  level:
    com.company.orders: WARN           # Quieter in prod
```

### Config Server Setup

```java
// config-server/src/main/java/com/company/ConfigServerApplication.java
@SpringBootApplication
@EnableConfigServer
public class ConfigServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ConfigServerApplication.class, args);
    }
}
```

```yaml
# config-server/src/main/resources/application.yml
server:
  port: 8888

spring:
  cloud:
    config:
      server:
        git:
          uri: https://github.com/your-org/config-repo
          default-label: main
          search-paths: "configs/{application}"   # Namespace per service
          clone-on-start: true                    # Fail fast on startup if Git unreachable
          timeout: 5                              # 5 second Git clone timeout
          refresh-rate: 60                        # Pull from Git every 60 seconds

        # High availability: Config Server uses its own local Git clone as fallback
        # if GitHub is temporarily unreachable
        git:
          basedir: /tmp/config-server-cache

# Encrypt sensitive values stored in Git (optional)
encrypt:
  key: ${CONFIG_SERVER_ENCRYPT_KEY}
```

### Client Service Setup

```yaml
# order-service/src/main/resources/application.yml
spring:
  application:
    name: order-service               # Used by Config Server to find the right file

  config:
    import: "configserver:http://config-server:8888"

  cloud:
    config:
      fail-fast: true                 # FAIL on startup if Config Server is unreachable
      retry:
        max-attempts: 6               # Retry 6 times on startup
        initial-interval: 1000        # Starting with 1s backoff
        multiplier: 1.5               # Exponential: 1s, 1.5s, 2.25s...
        max-interval: 2000

  profiles:
    active: ${SPRING_PROFILES_ACTIVE:dev}   # Default to dev, override in prod via env var
```

---

## 🔥 Hot Reload: Changing Config Without Restart

The real power of externalized config: change a feature flag or timeout value in Git, push, and it propagates to all running instances **without restarts**.

### @RefreshScope Beans

```java
// Mark beans that read @Value properties as refreshable
@RefreshScope
@Service
@Slf4j
public class FeatureFlagService {

    // These values are re-read when a refresh event is received
    @Value("${feature.bulk-discount:false}")
    private boolean bulkDiscountEnabled;

    @Value("${feature.new-checkout-flow:false}")
    private boolean newCheckoutEnabled;

    @Value("${payment.timeout-ms:5000}")
    private int paymentTimeoutMs;

    public boolean isBulkDiscountEnabled() {
        return bulkDiscountEnabled;
    }
}
```

### Spring Cloud Bus: Broadcast Refresh to All Instances

```bash
# In your CI/CD pipeline after pushing to config-repo:

# Option 1: Refresh all services listening on the bus (recommended)
curl -X POST http://config-server:8888/actuator/busrefresh

# Option 2: Refresh a specific service only
curl -X POST http://config-server:8888/actuator/busrefresh/order-service

# Spring Cloud Bus uses Kafka or RabbitMQ to broadcast the RefreshRemoteApplicationEvent
# All instances of order-service receive it and refresh their @RefreshScope beans
```

### What Gets Refreshed vs. What Requires Restart

| Config Change | Refresh | Restart |
| :--- | :---: | :---: |
| Feature flags (`@Value`) in `@RefreshScope` beans | ✅ | |
| Timeout values in `@RefreshScope` beans | ✅ | |
| Log levels (`logging.level.*`) | ✅ | |
| Spring Data JPA datasource URL | | ✅ |
| Spring Security configuration | | ✅ |
| Thread pool sizes | | ✅ |
| `@Bean` definitions | | ✅ |

---

## 🚀 Enterprise Feature Management: LaunchDarkly Deep Dive

While tools like Spring Cloud Config Server manage **global environment properties** (such as database URLs, pool sizes, and log levels), enterprise applications require **granular, real-time feature evaluation** per user, per organization, or per geographic region. **LaunchDarkly** is the enterprise standard for dynamic feature management, progressive rollouts, targeted experimentation, and instant operational kill switches.

<LaunchDarklyArchitectureDiagram />

### 1. LaunchDarkly vs. Traditional Property Hot-Reload

| Feature / Dimension | Spring Cloud Config (`@RefreshScope`) | LaunchDarkly Feature Management |
| :--- | :--- | :--- |
| **Evaluation Scope** | Global (all instances of a service receive the exact same value) | Granular Contextual Target (`LDContext` — per user, per tenant, per country) |
| **Latency Mechanics** | Network fetch from Config Server or Spring Cloud Bus Kafka broadcast | **In-Memory Evaluation (&lt;10µs)** via local rule engine; rules updated via streaming SSE |
| **Propagation Speed** | 30s – 60s (requires Git push + webhook + bus broadcast) | **Sub-second (&lt;200ms)** globally across all connected SDKs |
| **Rollout Capability** | Binary (on/off for whole cluster) | Percentage Rollouts (e.g. 1% → 5% → 20%), Targeted Rules, A/B Experimentation |
| **Access Control & Audit** | Git commit log (requires developer access) | Fine-grained RBAC, Jira integration, change approvals, automated flag kill-switches |

---

### 2. Architecture: Local In-Memory Evaluation & Relay Proxy

A common misconception is that evaluating a feature flag with LaunchDarkly requires making a remote HTTP call for every user request. **This is false.**

<LaunchDarklyRelayProxyDiagram />

1. **Streaming Connections (SSE)**: On application startup, the LaunchDarkly SDK establishes a persistent, long-lived Server-Sent Events (SSE) connection to the LaunchDarkly CDN or Relay Proxy.
2. **Local Rules Engine**: The SDK downloads the flag rules JSON payload into local RAM. When your code calls `ldClient.boolVariation("flag-key", context, fallback)`, the SDK evaluates the rules **100% in-memory in less than 10 microseconds**. Zero remote network calls occur during request processing.
3. **Enterprise Relay Proxy**: For high-scale Kubernetes clusters (hundreds of microservice pods), enterprise architectures place a **LaunchDarkly Relay Proxy** inside the private network. Microservice pods connect locally to the Relay Proxy, which maintains a single outbound SSE connection to LaunchDarkly's SaaS. If external network connectivity is severed, the Relay Proxy falls back to a local Redis cache, guaranteeing **100% zero-downtime resilience**.

---

### 3. Spring Boot Production Implementation

#### Step 1: Maven Dependencies

```xml
<dependency>
    <groupId>com.launchdarkly</groupId>
    <artifactId>launchdarkly-java-server-sdk</artifactId>
    <version>7.4.0</version>
</dependency>
```

#### Step 2: Spring SDK Bean Configuration

```java
@Configuration
@Slf4j
public class LaunchDarklyConfig {

    @Value("${launchdarkly.sdk-key}")
    private String sdkKey;

    @Value("${launchdarkly.relay-proxy-url:}")
    private String relayProxyUrl;

    @Bean(destroyMethod = "close")
    public LDClient ldClient() {
        LDConfig.Builder configBuilder = new LDConfig.Builder();

        // Connect via enterprise Relay Proxy if configured in K8s
        if (StringUtils.hasText(relayProxyUrl)) {
            configBuilder.serviceEndpoints(Components.serviceEndpoints()
                .streaming(relayProxyUrl)
                .events(relayProxyUrl));
            log.info("Configured LaunchDarkly SDK to connect via Relay Proxy: {}", relayProxyUrl);
        }

        // Configure resilient offline fallback and streaming timeouts
        configBuilder.events(Components.sendEvents().capacity(10000));

        LDClient client = new LDClient(sdkKey, configBuilder.build());

        if (client.isInitialized()) {
            log.info("LaunchDarkly SDK successfully initialized and rules synced.");
        } else {
            log.warn("LaunchDarkly SDK failed to initialize within timeout. Using fallback values.");
        }

        return client;
    }
}
```

#### Step 3: Context-Aware Flag Evaluation in Service Layer

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class CheckoutService {

    private final LDClient ldClient;
    private final LegacyCheckoutProcessor legacyProcessor;
    private final NewCheckoutV2Processor v2Processor;

    public CheckoutResult processCheckout(User user, Cart cart) {
        // Construct multi-attribute evaluation context (LDContext)
        LDContext context = LDContext.builder(user.getId())
            .kind("user")
            .set("email", user.getEmail())
            .set("tier", user.getLoyaltyTier().name()) // e.g. "GOLD", "PLATINUM"
            .set("country", user.getCountryCode())     // e.g. "US", "DE"
            .set("betaTester", user.isBetaTester())
            .build();

        // Evaluate boolean feature flag in-memory (<10 microseconds)
        boolean useV2Checkout = ldClient.boolVariation("new-checkout-flow-v2", context, false);

        if (useV2Checkout) {
            log.debug("Executing V2 Checkout Flow for userId={}", user.getId());
            return v2Processor.execute(user, cart);
        } else {
            log.debug("Executing Legacy Checkout Flow for userId={}", user.getId());
            return legacyProcessor.execute(user, cart);
        }
    }

    // Dynamic JSON Configuration Flag (Multivariate)
    public PricingConfig getDynamicPricingConfig(User user) {
        LDContext context = LDContext.builder(user.getId()).kind("user").build();

        // Retrieve complex JSON config payload dynamically managed in LaunchDarkly dashboard
        LDValue jsonValue = ldClient.jsonValueVariation("dynamic-pricing-rules", context, LDValue.ofNull());
        
        return parsePricingConfig(jsonValue);
    }
}
```

#### Step 4: Custom Aspect-Oriented Feature Flagging (`@FeatureFlag`)

To keep business logic clean, use a custom Spring AOP aspect to evaluate LaunchDarkly flags declaratively on controller or service methods:

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface FeatureFlag {
    String key();
    boolean fallback() default false;
}

@Aspect
@Component
@RequiredArgsConstructor
public class FeatureFlagAspect {

    private final LDClient ldClient;

    @Around("@annotation(flag)")
    public Object checkFlag(ProceedingJoinPoint joinPoint, FeatureFlag flag) throws Throwable {
        // Extract current user ID from SecurityContext or request attribute
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        LDContext context = LDContext.builder(userId).kind("user").build();

        boolean enabled = ldClient.boolVariation(flag.key(), context, flag.fallback());

        if (!enabled) {
            throw new FeatureDisabledException("Feature " + flag.key() + " is currently disabled.");
        }

        return joinPoint.proceed();
    }
}
```

---

### 4. Advanced Target Rules & Progressive Rollouts

LaunchDarkly enables sophisticated deployment patterns directly from the UI without code changes:

1. **Targeted Beta Testing**:
   - Rule: `If betaTester == true OR email endsWith "@company.com" → Serve true`.
2. **Percentage Rollout (Canary Deployment)**:
   - Rule: `Rollout 5% of all users based on user.id hash bucket → Serve true`.
   - Ramp up percentage dynamically (5% → 25% → 50% → 100%) while observing APM error rates in Datadog/Prometheus.
3. **Instant Operational Kill Switch**:
   - If a new feature causes memory leaks or database lock contention, flip the master flag toggle in LaunchDarkly UI.
   - All connected service instances switch back to the fallback control path in **under 200 milliseconds** worldwide — eliminating the need for emergency rollback deployments.

---

### 5. Production Gotchas & Flag Governance

1. **Flag Debt & Technical Debt Lifecycle**:
   - **Temporary Release Flags**: Intended to be short-lived (e.g. 30 days during rollout). Once at 100% rollout, schedule code refactoring to remove the `if/else` check and purge the flag from LaunchDarkly.
   - **Permanent Operational Flags**: Circuit breakers, maintenance modes, and rate-limiting toggles designed to remain in code long-term.
2. **Always Provide Robust Fallback Defaults**:
   - The fallback parameter in `boolVariation("key", context, fallback)` is executed if the SDK is disconnected or the flag is deleted. Never pass `null` or unhandled fallbacks.
3. **Avoid Evaluating Flags Inside High-Frequency Tight Loops**:
   - While in-memory evaluation takes only ~4µs, calling `boolVariation` 1,000,000 times inside a tight `for` loop will still consume CPU cycles. Evaluate the flag once before entering the loop.

---

## 🔐 Secrets Management: Never Store Secrets in Git

Even with a private Git repo, secrets (API keys, DB passwords, private certs) must not be stored in plain text. Use a dedicated secret store:

### Option A: HashiCorp Vault Integration

```yaml
# application.yml — Vault integration
spring:
  cloud:
    vault:
      host: vault.internal
      port: 8200
      scheme: https
      authentication: KUBERNETES    # Pod identity auth — no long-lived tokens
      kubernetes:
        role: order-service-role
      kv:
        enabled: true
        default-context: order-service
      config:
        lifecycle:
          enabled: true             # Auto-renew lease before expiry
```

```bash
# Vault stores secrets separately from Config Server Git
vault kv put secret/order-service \
  stripe-api-key="sk_live_abc123xyz" \
  db-password="supersecret123" \
  jwt-signing-key="eyJhbGciOiJSUzI1NiJ9..."

# Spring Boot merges Vault secrets with Config Server properties at startup
# Application sees them as regular @Value("${stripe.api-key}") properties
```

### Option B: Kubernetes Secrets + External Secrets Operator

```yaml
# externalsecret.yaml — ESO syncs from AWS Secrets Manager to K8s Secrets
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: order-service-secrets
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: order-service-secrets
    creationPolicy: Owner
  data:
    - secretKey: STRIPE_API_KEY
      remoteRef:
        key: production/order-service/stripe
        property: api_key
    - secretKey: DB_PASSWORD
      remoteRef:
        key: production/order-service/database
        property: password
```

```yaml
# deployment.yaml — inject into pods as env vars
spec:
  containers:
    - name: order-service
      envFrom:
        - secretRef:
            name: order-service-secrets      # Kubernetes Secret (synced from AWS)
        - configMapRef:
            name: order-service-config       # Non-sensitive config
```

---

## 🌍 Environment-Specific Configuration Matrix

<EnvConfigMatrixDiagram />

---

## ⚠️ Pros vs. Cons

| Pros | Cons |
| :--- | :--- |
| **Same artifact runs everywhere** — one JAR for dev/staging/prod | **Config Server is a critical dependency** — if it's down during rolling restart, services can't start |
| **Security** — secrets are never in source code or Docker images | **Bootstrap ordering** — services need Config Server healthy before they start |
| **Auditability** — Git history = complete audit log of every config change | **Config drift** — if teams edit K8s ConfigMaps directly without updating Git, environments diverge |
| **Hot reload** — change feature flags without deployments | **Complexity** — Config Server + Cloud Bus + Vault + K8s Secrets = large operational surface |
| **Environment parity** — staging config structure mirrors production | **Caching lag** — Config Server caches Git for 60s; pushes don't take effect instantly |

---

## ❗ Common Gotchas & Anti-Patterns

1. **Secrets in ConfigMaps (Not Secrets):**
   - *Anti-Pattern:* `kubectl create configmap order-config --from-literal=DB_PASSWORD=mypassword`
   - *Fix:* ConfigMaps are stored unencrypted in etcd and readable by any pod in the namespace. Always use `Secret` objects or a secret manager (Vault/AWS SM).

2. **Config Server Without High Availability:**
   - *Anti-Pattern:* Running a single Config Server replica. If it restarts during your rolling deployment, 50% of new pods fail to start.
   - *Fix:* Run Config Server with 3 replicas. Enable readiness probes. Ensure services cache the last-known-good config on disk (`spring.cloud.config.failFast=false` with a local cache for existing instances).

3. **Hardcoded Defaults That Shadow External Config:**
   - *Anti-Pattern:* `@Value("${payment.timeout-ms:30000}")` — if Config Server fails to load, service silently uses a 30-second timeout instead of failing fast.
   - *Fix:* For critical config, use `@Value("${payment.timeout-ms}")` with no default. The service will fail to start if the value is missing — better than silently using wrong values.

4. **Refreshing `@Scheduled` Tasks:**
   - *Anti-Pattern:* Expecting a `@RefreshScope` bean's `@Scheduled` method to pick up a new cron expression after refresh.
   - *Fix:* `@Scheduled` beans are not refreshable in Spring. Re-register the `ScheduledFuture` explicitly in a `@EventListener(RefreshScopeRefreshedEvent.class)` listener.

5. **Environment Variable Naming Collisions:**
   - *Anti-Pattern:* Having both `SPRING_DATASOURCE_URL` in a ConfigMap and `spring.datasource.url` in Config Server. Kubernetes env vars take priority — debugging why Config Server's value is ignored is painful.
   - *Fix:* Document the priority order for your team. Use one authoritative source per environment, not a mix.
