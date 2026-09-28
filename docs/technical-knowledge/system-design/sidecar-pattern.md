---
id: sidecar-pattern
title: Sidecar Pattern
sidebar_label: Sidecar
description: Deep-dive into the Sidecar pattern — Linux namespace internals, Kubernetes native sidecar lifecycle, PgBouncer connection pooling, Vault secrets injection, config hot-reload, Spring Boot integration, and production failure modes for senior engineers.
tags: [system-design, microservices, containerization, kubernetes, sidecar, reliability, spring-boot]
---
import SidecarPatternDiagram from '@site/src/components/SidecarPatternDiagram';

# Sidecar Pattern

The **Sidecar** pattern attaches a helper container to a primary application container inside a shared runtime context (a Kubernetes Pod). The sidecar offloads cross-cutting operational concerns — mTLS, traffic routing, log forwarding, secret injection, database connection pooling, config hot-reload — away from application code entirely.

This achieves **single responsibility at the container level**: the Spring Boot app owns business logic; the sidecar owns infrastructure concerns. Teams can evolve, upgrade, and replace either independently.

---

## The Problem It Solves

Without sidecars, every microservice team re-implements the same operational boilerplate:

```
Without Sidecar:
  Order Service (Java)       → embeds: TLS cert management, DB pool tuning,
                               secrets refresh, access log formatting, retry logic
  Payment Service (Go)       → embeds: same concerns, implemented differently
  Inventory Service (Node)   → embeds: same concerns, implemented differently again

  Result: Inconsistent security posture. Library version drift.
          Security patches require re-deploying every service.

With Sidecar:
  Order Service (Java)       → embeds: business logic only
  Payment Service (Go)       → embeds: business logic only
  Sidecar (Envoy / Vault Agent / PgBouncer) → owns: TLS, secrets, pooling

  Result: One sidecar update rolls out across all services simultaneously.
          Security patches require no application code changes.
```

---

## Under the Hood: Linux Namespaces in Pods

A Kubernetes Pod is not a VM boundary — it is a **group of Linux containers sharing specific kernel namespaces**. Understanding which namespaces are shared, and which are isolated, explains exactly how sidecars communicate with zero overhead.

<SidecarPatternDiagram />

| Linux Kernel Namespace | Pod Sharing Status | Sidecar Mechanics & Inter-Process Comm |
|---|---|---|
| **`net` (Network)** | 🌐 **Shared** | Same IP, same loopback (`127.0.0.1`), same port table. Near zero socket latency. |
| **`ipc` (Inter-Process)** | ⚡ **Shared** | Direct POSIX message queues and shared memory segments. |
| **`uts` (Hostname)** | 🏷️ **Shared** | Identical hostname seen across all containers in the pod. |
| **Volumes / Mounts** | 📂 **Shared Mounts** | `emptyDir`, secrets, and configMaps shared via file descriptor pointers. |
| **`pid` (Process IDs)** | 🛡️ **Isolated (default)** | Each container cannot see other container PIDs (unless `shareProcessNamespace: true`). |
| **`mnt` (Filesystem Root)** | 🛡️ **Isolated** | Completely separate container root filesystems (`/var`, `/etc`, etc.). |

### Namespace-by-Namespace Breakdown

**`net` namespace (shared by default):**

Every container in the pod shares one IP address and one loopback interface. Communication over `localhost` is kernel-local — no TCP stack traversal, no socket overhead beyond a system call. This is why `127.0.0.1:6432` (PgBouncer sidecar) is effectively free compared to a remote TCP connection.

Containers must not bind the same port — the shared `net` namespace makes port conflicts a pod-level failure.

**`pid` namespace (isolated by default, optionally shared):**

With `shareProcessNamespace: true`, the sidecar can see and signal the application's processes directly. This enables the config-reload pattern: sidecar sends `SIGHUP` to the Java process when config changes, triggering a reload without a restart.

```yaml
spec:
  shareProcessNamespace: true   # Enable cross-container PID visibility
  containers:
  - name: order-app
    # ...
  - name: config-reloader
    # Can now: kill -HUP $(pgrep java)
```

**`mnt` namespace (isolated, with shared volume overlay):**

Each container has its own filesystem view, but Kubernetes `volumes` create a shared layer. An `emptyDir` volume mounted into both containers at different paths enables the sidecar-to-app file handoff pattern — Vault Agent writes a secret to `/vault/secrets/db-password`; Spring Boot reads from `/app/secrets/db-password`. Same inode, different mount paths, zero copying.

**`ipc` namespace (shared by default):**

Shared memory segments and POSIX message queues work across containers in the pod. Rarely used in practice — most sidecar communication uses localhost TCP. Relevant for high-performance data pipelines where sidecar and app exchange data via shared memory to avoid serialization overhead.

---

## Container Lifecycle: The Startup and Shutdown Problem

The hardest operational problem with the original sidecar model was **lifecycle ordering**. Kubernetes started all containers in a pod simultaneously, creating two races:

### Startup Race (Pre-v1.28)

```
T=0ms   Pod starts
T=0ms   Spring Boot app starts → tries to acquire DB connection → PgBouncer not ready → CRASH
T=200ms PgBouncer sidecar finishes initializing → too late, pod is restarting
```

```
T=0ms   Pod starts
T=0ms   Envoy sidecar starts → iptables rules not yet installed
T=50ms  Spring Boot app makes outbound call → bypasses Envoy entirely (no mTLS)
T=100ms Envoy finishes initialization → too late, call already sent unencrypted
```

### Shutdown Race (Pre-v1.28)

```
T=0ms   Pod receives SIGTERM (rolling deploy / scale-down)
T=0ms   Envoy sidecar begins shutdown → iptables rules removed
T=0ms   Spring Boot app still processing in-flight requests → outbound calls fail
T=30s   Spring Boot app finishes drain → graceful shutdown complete
         (but Envoy was gone for 30 seconds — all outbound calls during that window failed)
```

### The Fix: Kubernetes Native Sidecars (v1.28+)

Kubernetes 1.28 introduced `restartPolicy: Always` on init containers, creating **native sidecars** with guaranteed lifecycle ordering:

```
Startup order:
  1. Init containers run sequentially (as before)
  2. Native sidecar init containers start AND stay running
  3. Kubernetes waits for sidecar readiness probe to pass
  4. Only then does the primary app container start
  → No more startup race

Shutdown order:
  1. Primary app container receives SIGTERM
  2. Primary app drains connections (terminationGracePeriodSeconds)
  3. Primary app exits
  4. Native sidecar containers receive SIGTERM
  5. Sidecars drain and exit
  → No more shutdown race
```

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
spec:
  template:
    spec:
      terminationGracePeriodSeconds: 60   # Total pod shutdown budget
      initContainers:

      # Native sidecar: starts before app, stays alive, shuts down after app
      - name: vault-agent
        image: vault:1.15.0
        restartPolicy: Always             # ← This is what makes it a "native sidecar"
        args: ["agent", "-config=/etc/vault/config.hcl"]
        volumeMounts:
        - name: secrets
          mountPath: /vault/secrets
        readinessProbe:
          exec:
            command: ["vault", "status", "-tls-skip-verify"]
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            cpu: 50m
            memory: 64Mi
          limits:
            cpu: 200m
            memory: 128Mi

      - name: pgbouncer
        image: pgbouncer/pgbouncer:1.22.0
        restartPolicy: Always             # ← Also a native sidecar
        ports:
        - containerPort: 6432
        readinessProbe:
          tcpSocket:
            port: 6432
          initialDelaySeconds: 3
          periodSeconds: 5
        resources:
          requests:
            cpu: 50m
            memory: 64Mi
          limits:
            cpu: 200m
            memory: 128Mi

      containers:
      - name: order-app
        image: order-service:2.1.0
        # Starts only after vault-agent AND pgbouncer readiness probes pass
        env:
        - name: DB_URL
          value: jdbc:postgresql://127.0.0.1:6432/orders
        - name: DB_SECRET_PATH
          value: /app/secrets/db-password
        volumeMounts:
        - name: secrets
          mountPath: /app/secrets

      volumes:
      - name: secrets
        emptyDir:
          medium: Memory    # tmpfs — secrets never hit disk
```

### Pre-v1.28 Startup Workaround

For clusters still on < 1.28, implement a wait loop in the application entrypoint:

```dockerfile
# entrypoint.sh
#!/bin/sh
set -e

wait_for_service() {
  local host=$1 port=$2 name=$3
  echo "Waiting for $name at $host:$port..."
  until nc -z "$host" "$port" 2>/dev/null; do
    sleep 1
  done
  echo "$name is ready."
}

# Wait for sidecars before starting JVM
wait_for_service 127.0.0.1 6432 "PgBouncer"
wait_for_service 127.0.0.1 8200 "Vault Agent"

exec java \
  -XX:MaxRAMPercentage=75.0 \
  -jar /app/order-service.jar
```

For Istio specifically (Envoy sidecar), Istio provides `holdApplicationUntilProxyStarts` in `MeshConfig` which injects the wait automatically without modifying the entrypoint.

---

## Production Patterns

### Pattern 1: Database Connection Pooler (PgBouncer)

Opening one JDBC connection per application thread to PostgreSQL is expensive. Each PostgreSQL backend process consumes ~5–10MB RAM and a file descriptor. At 100 pods × 20 threads = 2,000 direct connections — PostgreSQL's `max_connections` is commonly 200–500, causing connection refusals at scale.

PgBouncer as a sidecar multiplexes many application connections onto a small pool of real PostgreSQL connections:

```
Without PgBouncer:
  100 pods × HikariCP pool size 20 = 2,000 PostgreSQL backend processes
  PostgreSQL RAM: 2,000 × 8MB = 16GB just for connections

With PgBouncer sidecar:
  100 pods × HikariCP pool size 20 = 2,000 connections → PgBouncer (local)
  PgBouncer pool size 5 per pod × 100 pods = 500 real PostgreSQL connections
  PostgreSQL RAM: 500 × 8MB = 4GB (75% reduction)
```

```yaml
# pgbouncer.ini mounted via ConfigMap
[databases]
orders = host=postgres-primary.db.svc.cluster.local port=5432 dbname=orders

[pgbouncer]
listen_addr = 127.0.0.1        # Only accepts local connections — no external access
listen_port = 6432
auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt

pool_mode = transaction         # Return connection to pool after each transaction
                                # Incompatible with: SET, advisory locks, LISTEN/NOTIFY
                                # Use session mode if those are needed

max_client_conn = 200           # Max connections from Spring Boot HikariCP
default_pool_size = 10          # Real connections to PostgreSQL per database
min_pool_size = 2
reserve_pool_size = 5           # Extra connections for connection spikes
reserve_pool_timeout = 3

# Connection health
server_check_delay = 30
server_check_query = SELECT 1
server_lifetime = 3600          # Recycle PostgreSQL connections every hour
server_idle_timeout = 600       # Close idle connections after 10min

log_connections = 1
log_disconnections = 1
log_pooler_errors = 1
stats_period = 60
```

```yaml
# HikariCP config in application.yml — pointing to local PgBouncer
spring:
  datasource:
    url: jdbc:postgresql://127.0.0.1:6432/orders
    username: app_user
    password: ${DB_PASSWORD}     # Injected by Vault Agent sidecar
    hikari:
      maximum-pool-size: 20      # These are PgBouncer client connections, not PostgreSQL
      minimum-idle: 5
      connection-timeout: 3000
      idle-timeout: 300000       # Shorter than PgBouncer's server_idle_timeout
      max-lifetime: 1800000
      # Disable prepared statement caching — PgBouncer transaction mode doesn't persist
      # server-side prepared statements across connections
      data-source-properties:
        prepareThreshold: 0      # Disable server-side prepared statements with PgBouncer
        preparedStatementCacheQueries: 0
```

:::warning[PgBouncer Transaction Mode Incompatibilities]
In `pool_mode = transaction`, the PostgreSQL connection is returned to the pool after each transaction commit/rollback. This breaks features that require a persistent connection: `SET` statements, `pg_advisory_lock`, `LISTEN/NOTIFY`, and server-side cursors. If your application uses any of these, use `pool_mode = session` instead (less efficient but fully compatible).
:::

**Monitoring PgBouncer health from the sidecar:**

```bash
# PgBouncer admin console (from within the pod)
kubectl exec -it <pod-name> -c pgbouncer -- \
  psql -h 127.0.0.1 -p 6432 -U pgbouncer pgbouncer -c "SHOW POOLS;"

# Output columns: database, user, cl_active, cl_waiting, sv_active, sv_idle, sv_used
# cl_waiting > 0 means clients are waiting for a connection → increase pool size or investigate slow queries
```

### Pattern 2: Secret Injection (Vault Agent)

Hardcoding secrets in environment variables is a security anti-pattern: they appear in `kubectl describe pod`, container inspection, and crash dumps. Vault Agent sidecar fetches secrets dynamically and writes them to a shared in-memory volume.

```hcl
# vault-agent-config.hcl — mounted as ConfigMap
pid_file = "/tmp/vault-agent.pid"

auto_auth {
  method "kubernetes" {
    mount_path = "auth/kubernetes"
    config = {
      role = "order-service"    # Vault role bound to this pod's ServiceAccount
    }
  }
  sink "file" {
    config = {
      path = "/vault/token"
    }
  }
}

# Render secrets as files — Spring Boot reads these on startup and refresh
template {
  source      = "/etc/vault/templates/db-password.tpl"
  destination = "/vault/secrets/db-password"
  perms       = "0640"
}

template {
  source      = "/etc/vault/templates/api-keys.tpl"
  destination = "/vault/secrets/application.properties"
  perms       = "0640"
  # Vault Agent re-renders and triggers refresh when secret rotates
  exec {
    command       = ["sh", "-c", "curl -s -X POST http://127.0.0.1:8080/actuator/refresh"]
    timeout       = "5s"
    restart_on_error = false
  }
}
```

```
# /etc/vault/templates/application.properties.tpl
{{ with secret "secret/data/order-service/prod" }}
spring.datasource.password={{ .Data.data.db_password }}
stripe.api.key={{ .Data.data.stripe_key }}
{{ end }}
```

```yaml
# Spring Boot reads secrets from files — never from environment variables
spring:
  config:
    import: "optional:file:/vault/secrets/application.properties"
  cloud:
    vault:
      enabled: false    # Not using Spring Cloud Vault — Vault Agent handles auth
```

**Why file-based secrets over environment variables:**

| | Environment Variables | File-based (Vault Agent) |
|:---|:---|:---|
| Visible in `kubectl describe` | Yes | No |
| Appear in crash dumps | Yes | No |
| Rotatable without restart | No | Yes (with `/actuator/refresh`) |
| Audit trail | No | Yes (Vault audit log) |
| Encrypted at rest | No | Yes (Vault storage) |

### Pattern 3: Config Hot-Reload

Spring Boot's `@RefreshScope` allows beans to reload their configuration without a JVM restart. The sidecar triggers this when ConfigMap or Vault secrets change.

```java
// Spring Boot: beans that reload on /actuator/refresh
@RestController
@RefreshScope                       // This bean is destroyed and recreated on refresh
@Slf4j
public class PaymentController {

    @Value("${payment.provider.url}")
    private String paymentProviderUrl;

    @Value("${payment.timeout.ms:5000}")
    private int timeoutMs;

    @PostMapping("/payments")
    public PaymentResponse charge(@RequestBody ChargeRequest request) {
        log.info("Calling payment provider at {} with timeout {}ms",
            paymentProviderUrl, timeoutMs);
        // ...
    }
}
```

```java
// Spring Boot: secure the /actuator/refresh endpoint
@Configuration
public class ActuatorSecurityConfig {

    @Bean
    public SecurityFilterChain actuatorSecurity(HttpSecurity http) throws Exception {
        return http
            .requestMatchers(r -> r.requestMatchers("/actuator/**"))
            .authorizeHttpRequests(auth -> auth
                // Only allow refresh from localhost (the sidecar)
                .requestMatchers("/actuator/refresh").access(
                    new WebExpressionAuthorizationManager("hasIpAddress('127.0.0.1')")
                )
                .anyRequest().denyAll()
            )
            .build();
    }
}
```

```yaml
# application.yml — expose refresh endpoint
management:
  endpoints:
    web:
      exposure:
        include: health,readiness,liveness,refresh,info
  endpoint:
    refresh:
      enabled: true
```

**Config reload sidecar using `inotifywait`:**

```dockerfile
# Custom config-reloader sidecar image
FROM alpine:3.19
RUN apk add --no-cache inotify-tools curl

COPY reload.sh /reload.sh
RUN chmod +x /reload.sh
CMD ["/reload.sh"]
```

```bash
#!/bin/sh
# reload.sh — watches config file and triggers Spring Boot refresh
CONFIG_PATH="/config/application.properties"
REFRESH_URL="http://127.0.0.1:8080/actuator/refresh"

echo "Watching $CONFIG_PATH for changes..."
while true; do
  inotifywait -e close_write,modify,create,delete "$CONFIG_PATH" 2>/dev/null
  echo "Config change detected. Triggering Spring Boot refresh..."
  
  # Retry refresh up to 3 times
  for i in 1 2 3; do
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$REFRESH_URL")
    if [ "$HTTP_STATUS" = "200" ]; then
      echo "Refresh succeeded."
      break
    fi
    echo "Refresh attempt $i failed (HTTP $HTTP_STATUS). Retrying..."
    sleep 2
  done
done
```

### Pattern 4: Log Forwarding (Fluent Bit)

Instead of configuring log shipping inside the application, a log-forwarder sidecar tails the application's log file and ships to the central logging platform.

```yaml
initContainers:
- name: fluent-bit
  image: fluent/fluent-bit:3.0
  restartPolicy: Always
  volumeMounts:
  - name: log-volume
    mountPath: /var/log/app
  - name: fluent-bit-config
    mountPath: /fluent-bit/etc/
  resources:
    limits:
      cpu: 100m
      memory: 64Mi

containers:
- name: order-app
  image: order-service:2.1.0
  env:
  - name: LOG_FILE
    value: /var/log/app/order-service.log
  volumeMounts:
  - name: log-volume
    mountPath: /var/log/app

volumes:
- name: log-volume
  emptyDir: {}                  # Shared between app and fluent-bit
- name: fluent-bit-config
  configMap:
    name: fluent-bit-config
```

```yaml
# fluent-bit ConfigMap
[INPUT]
    Name              tail
    Path              /var/log/app/order-service.log
    Parser            json
    Tag               order-service.*
    Refresh_Interval  5
    Mem_Buf_Limit     10MB
    Skip_Long_Lines   On

[FILTER]
    Name  record_modifier
    Match *
    Record pod_name  ${HOSTNAME}
    Record namespace ${NAMESPACE}

[OUTPUT]
    Name  opensearch
    Match *
    Host  opensearch.logging.svc.cluster.local
    Port  9200
    Index order-service-logs
    Retry_Limit 5
```

**Spring Boot JSON log configuration** (Logback — needed for Fluent Bit to parse structured logs):

```xml
<!-- logback-spring.xml -->
<configuration>
  <springProfile name="prod">
    <appender name="JSON_FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
      <file>/var/log/app/order-service.log</file>
      <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
        <fileNamePattern>/var/log/app/order-service.%d{yyyy-MM-dd}.%i.log.gz</fileNamePattern>
        <maxFileSize>100MB</maxFileSize>
        <maxHistory>3</maxHistory>       <!-- Fluent Bit ships logs quickly; minimal retention needed -->
        <totalSizeCap>500MB</totalSizeCap>
      </rollingPolicy>
      <encoder class="net.logstash.logback.encoder.LogstashEncoder">
        <includeMdcKeyName>traceId</includeMdcKeyName>
        <includeMdcKeyName>spanId</includeMdcKeyName>
        <includeMdcKeyName>userId</includeMdcKeyName>
      </encoder>
    </appender>
    <root level="INFO">
      <appender-ref ref="JSON_FILE"/>
    </root>
  </springProfile>
</configuration>
```

---

## Spring Boot Integration Patterns

### Graceful Shutdown with Sidecar Drain

Spring Boot's graceful shutdown (`server.shutdown=graceful`) drains in-flight HTTP requests before exiting. But if the Envoy sidecar's iptables rules are removed before Spring Boot finishes draining, in-progress outbound calls fail.

Configure a pre-stop hook to delay the primary container shutdown, giving sidecars time to signal readiness for teardown:

```yaml
containers:
- name: order-app
  image: order-service:2.1.0
  lifecycle:
    preStop:
      exec:
        command:
        - sh
        - -c
        - |
          # Wait for Envoy to start draining (Istio sends /healthz/ready = false)
          # Then wait for in-flight requests to complete
          sleep 5
          # Spring Boot graceful shutdown handles the rest via SIGTERM
  env:
  - name: SERVER_SHUTDOWN
    value: graceful
```

```yaml
# application.yml
server:
  shutdown: graceful

spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s   # Max time to drain in-flight requests
```

**Full shutdown sequence with native sidecars (v1.28+):**

```
T=0s    Pod receives SIGTERM
T=0s    Kubernetes removes pod from Service endpoints (no new traffic)
T=0s    Envoy starts draining: returns 503 for health checks, completes in-flight
T=0s    Spring Boot receives SIGTERM → starts graceful shutdown (stops accepting new requests)
T=5s    preStop sleep completes
T=5s    Spring Boot drains remaining in-flight requests
T=30s   All in-flight requests complete (or timeout-per-shutdown-phase elapses)
T=30s   Spring Boot JVM exits
T=30s   Native sidecars (Vault, PgBouncer, Fluent Bit) receive SIGTERM
T=35s   Sidecars flush buffers and exit cleanly
T=60s   terminationGracePeriodSeconds budget exhausted → SIGKILL sent if still running
```

### Health Checks: Liveness vs. Readiness with Sidecars

Spring Boot Actuator exposes separate liveness and readiness probes. Kubernetes should use them correctly:

```yaml
containers:
- name: order-app
  livenessProbe:
    httpGet:
      path: /actuator/health/liveness   # Is the JVM alive? (not deadlocked)
      port: 8080
    initialDelaySeconds: 60             # Give JVM time to start; too short → restart loop
    periodSeconds: 10
    failureThreshold: 3
    timeoutSeconds: 5

  readinessProbe:
    httpGet:
      path: /actuator/health/readiness  # Ready to serve traffic? (DB connected, caches warm)
      port: 8080
    initialDelaySeconds: 10
    periodSeconds: 5
    failureThreshold: 3
    timeoutSeconds: 3
```

```java
// Custom readiness indicator — not ready until sidecar dependencies are healthy
@Component
public class SidecarDependencyReadinessIndicator implements HealthIndicator {

    private final JdbcTemplate jdbcTemplate;   // Connects via PgBouncer sidecar

    @Override
    public Health health() {
        try {
            // Validates the full path: App → PgBouncer (sidecar) → PostgreSQL
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            return Health.up()
                .withDetail("pgbouncer", "connected")
                .build();
        } catch (Exception e) {
            return Health.down()
                .withDetail("pgbouncer", "unreachable")
                .withException(e)
                .build();
        }
    }
}
```

### Resource Sizing Guidelines

Sidecars consume real pod resources. Under-provisioning causes OOM kills that restart the entire pod. Over-provisioning wastes cluster capacity.

| Sidecar | CPU Request | CPU Limit | Memory Request | Memory Limit | Notes |
|:---|:---|:---|:---|:---|:---|
| Envoy (Istio) | 100m | 2000m | 128Mi | 1Gi | Scales with connection count; profile at peak load |
| PgBouncer | 50m | 200m | 64Mi | 128Mi | Very lightweight; scales with connection count |
| Vault Agent | 50m | 200m | 64Mi | 128Mi | Mostly idle; spikes during secret renewal |
| Fluent Bit | 50m | 100m | 64Mi | 128Mi | Scales with log volume |
| Config Reloader | 10m | 50m | 32Mi | 64Mi | Near-zero workload |

```yaml
# Template resource block for production sidecars
resources:
  requests:
    cpu: 50m          # Guaranteed allocation — size to steady-state
    memory: 64Mi      # Guaranteed allocation — must never be hit at runtime
  limits:
    cpu: 200m         # Burst ceiling — soft limit (throttled, not killed)
    memory: 128Mi     # Hard limit — OOM kill triggers pod restart; size conservatively
```

:::warning[Memory Limit is a Hard Kill Boundary]
CPU limits throttle; they do not kill. Memory limits kill. If a sidecar's memory limit is too low, the Linux OOM killer terminates the sidecar process, causing a pod restart that disrupts the healthy primary container. Always set memory limits 2× the observed steady-state usage under peak load.
:::

---

## Observability: Monitoring the Sidecar Layer

Sidecars should expose their own health and metrics endpoints. The primary application should not be responsible for surfacing sidecar health.

```yaml
# PgBouncer metrics via prometheus-pgbouncer-exporter (another sidecar, or built-in)
# Exposes: pgbouncer_pool_cl_active, pgbouncer_pool_sv_idle, pgbouncer_pool_cl_waiting

# Alert: clients waiting for a connection (pool exhaustion)
- alert: PgBouncerClientWaiting
  expr: pgbouncer_pool_cl_waiting > 0
  for: 30s
  annotations:
    summary: "PgBouncer has {{ $value }} clients waiting — pool may be undersized"

# Alert: Vault Agent token about to expire (secret refresh failure)
- alert: VaultAgentTokenExpiringSoon
  expr: vault_agent_token_ttl_seconds < 3600
  for: 5m
  annotations:
    summary: "Vault Agent token expires in {{ $value }}s — check Vault connectivity"
```

---

## Production Gotchas & Anti-Patterns

### 1. Zombie Sidecars in Kubernetes Jobs

When a `Job` pod completes, the primary container exits with code 0. But sidecars (Envoy, Vault Agent, Fluent Bit) have infinite run loops — they never exit. The pod stays in `Running` state indefinitely; the Job never completes.

```
kubectl get pods -n batch
NAME              READY   STATUS    RESTARTS   AGE
report-job-abc    1/2     Running   0          2d    ← Job finished 2 days ago. Sidecar zombied.
```

**Fix (pre-v1.28):** Signal the sidecar to exit from the primary container on completion:

```java
// In Spring Batch Job completion listener
@Component
public class SidecarShutdownListener implements JobExecutionListener {

    @Override
    public void afterJob(JobExecution jobExecution) {
        if (isRunningInKubernetes()) {
            log.info("Batch job complete. Signaling sidecar shutdown.");
            try {
                // If shareProcessNamespace: true, kill sidecar by process name
                new ProcessBuilder("sh", "-c", "kill $(pgrep envoy) $(pgrep vault)").start();
                // Give sidecars 5s to flush logs and close connections
                Thread.sleep(5000);
            } catch (Exception e) {
                log.warn("Could not signal sidecar shutdown gracefully.", e);
            }
        }
    }

    private boolean isRunningInKubernetes() {
        return System.getenv("KUBERNETES_SERVICE_HOST") != null;
    }
}
```

**Fix (v1.28+):** Native sidecars automatically terminate when the primary container of a Job exits. Zero code change required.

### 2. Sidecar OOM Kills Healthy Primary Container

A sidecar configured with insufficient memory limits is OOM-killed by the Linux kernel. Kubernetes restarts the entire pod, interrupting the healthy primary application.

```
Event: OOMKilling container vault-agent in pod order-service-abc (limit: 64Mi, usage: 71Mi)
→ Pod restarted. 847 in-flight requests dropped.
```

**Fix:**
1. Profile sidecar memory under realistic load: `kubectl top pod <pod-name> --containers`
2. Set memory limits to 2× observed peak, not 1×
3. Set memory requests equal to observed steady-state
4. Alert before the limit is hit: `container_memory_working_set_bytes / container_spec_memory_limit_bytes > 0.8`

### 3. Localhost-Only Binding Trap

PgBouncer listening on `127.0.0.1:6432` is correct for security, but the Spring Boot app must connect to `127.0.0.1`, not a hostname. If `spring.datasource.url` uses the pod's external IP or a service hostname, the traffic exits the pod and bypasses PgBouncer entirely.

```yaml
# WRONG — bypasses PgBouncer sidecar
spring.datasource.url: jdbc:postgresql://postgres-primary.db.svc.cluster.local:5432/orders

# CORRECT — hits PgBouncer on localhost
spring.datasource.url: jdbc:postgresql://127.0.0.1:6432/orders
```

### 4. Missing `preStop` Hook Causes Connection Reset Errors

Without a `preStop` sleep, Kubernetes removes the pod from the `Endpoints` list and sends SIGTERM simultaneously. New requests still arrive via kube-proxy for ~1–2 seconds (propagation delay) after SIGTERM is received, causing connection resets.

**Fix:** Always add a `preStop` sleep of 5–15 seconds to all containers that serve traffic:

```yaml
lifecycle:
  preStop:
    exec:
      command: ["sh", "-c", "sleep 10"]
```

### 5. `shareProcessNamespace` Security Risk

Enabling `shareProcessNamespace: true` allows the sidecar to read the memory of the primary container's processes (via `/proc/<pid>/mem`). In a threat model where the sidecar image is compromised, this grants it access to in-memory secrets, heap dumps, and JVM internals.

**Mitigate:**
- Only enable for trusted internal sidecars (config-reloader you control)
- Never enable for third-party or community sidecar images without security review
- Use `securityContext.readOnlyRootFilesystem: true` and `allowPrivilegeEscalation: false` on all sidecar containers

```yaml
- name: config-reloader
  image: my-private-registry/config-reloader:1.0.0   # Internal, audited image
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    readOnlyRootFilesystem: true
    allowPrivilegeEscalation: false
    capabilities:
      drop: ["ALL"]
```

### 6. Volume Mount Permissions Mismatch

The sidecar writes secrets to a shared `emptyDir` volume as user `root`. The Spring Boot app runs as a non-root user (`runAsUser: 1000`) and cannot read the files.

```
Error: /vault/secrets/db-password: Permission denied
```

**Fix:** Set consistent `fsGroup` or file permissions in the sidecar template command:

```yaml
spec:
  securityContext:
    fsGroup: 1000           # All volumes owned by GID 1000 — matches app user
  initContainers:
  - name: vault-agent
    securityContext:
      runAsUser: 1000       # Write files as same user as the app
```

---

## Decision Matrix

| Use Case | Sidecar Type | Key Config |
|:---|:---|:---|
| High-concurrency Spring Boot + PostgreSQL | PgBouncer | `pool_mode=transaction`, disable prepared statements in HikariCP |
| Secret injection without restart | Vault Agent | `restartPolicy: Always`, `emptyDir medium: Memory`, Actuator refresh hook |
| Zero-trust mTLS between services | Envoy (Istio) | `PeerAuthentication STRICT`, `holdApplicationUntilProxyStarts: true` |
| Centralized structured log shipping | Fluent Bit | JSON Logback encoder, shared `emptyDir` log volume |
| Dynamic config reload | Config Reloader | `inotifywait` + `POST /actuator/refresh`, localhost-only Actuator exposure |
| Batch Job with sidecar | Any + v1.28+ | Native sidecar `restartPolicy: Always` — auto-terminates on job completion |
| Low-memory pods (< 512Mi total) | Minimal sidecars | Profile all sidecar memory; consider DaemonSet-level agents instead |