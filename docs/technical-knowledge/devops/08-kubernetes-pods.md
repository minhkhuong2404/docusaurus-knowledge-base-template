---
id: kubernetes-pods
title: Pods & Containers
sidebar_label: Pods & Containers
description: Deep dive into Kubernetes Pods — Pod lifecycle, init containers, sidecar containers, probes, resource requests and limits, environment variables, and multi-container patterns.
tags: [kubernetes, pods, containers, init-containers, sidecar, probes, resources, lifecycle, beginner]
---

# Pods & Containers

> A **Pod** is the smallest deployable unit in Kubernetes. It wraps one or more containers that share a network and storage.

---

## What is a Pod?

```
Pod
  ├─ Shared network namespace (same IP, same ports)
  ├─ Shared storage volumes
  └─ One or more containers
       ├─ Container 1: your app
       ├─ Container 2: sidecar (logging agent)
       └─ Init Container: runs before app starts
```

**Key rules:**
- All containers in a Pod share the same IP address
- Containers in a Pod can communicate via `localhost`
- A Pod is always scheduled to **one** Node — it doesn't span nodes
- Pods are **ephemeral** — they're not moved, they're recreated (new IP each time)

---

## Pod YAML — Complete Example

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-api-pod
  namespace: default
  labels:
    app: my-api             # Used by Services to find this Pod
    version: "1.0"
    environment: production
  annotations:
    description: "Spring Boot API server"
    git-commit: "abc123"

spec:
  # ─── Init Containers (run to completion BEFORE app starts) ────────
  initContainers:
    - name: wait-for-db
      image: busybox:1.36
      command: ['sh', '-c',
        'until nc -z postgres 5432; do echo waiting for postgres; sleep 2; done']

    - name: run-migrations
      image: myapp-migrations:1.0.0
      env:
        - name: DB_URL
          value: "jdbc:postgresql://postgres:5432/mydb"

  # ─── Main Containers ──────────────────────────────────────────────
  containers:
    - name: api
      image: myapp:1.0.0
      imagePullPolicy: Always       # Always | IfNotPresent | Never

      # Ports (documentation only — doesn't actually open ports)
      ports:
        - name: http
          containerPort: 8080
          protocol: TCP
        - name: management
          containerPort: 9090

      # ─── Environment Variables ──────────────────────────────────
      env:
        - name: SPRING_PROFILES_ACTIVE
          value: "production"
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret       # Secret name
              key: password         # Key within the secret
        - name: APP_NAME
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: app-name
        - name: MY_POD_NAME
          valueFrom:
            fieldRef:               # Downward API — inject Pod metadata
              fieldPath: metadata.name
        - name: MY_NODE_NAME
          valueFrom:
            fieldRef:
              fieldPath: spec.nodeName
        - name: MY_CPU_LIMIT
          valueFrom:
            resourceFieldRef:
              resource: limits.cpu

      # Inject entire ConfigMap or Secret as env vars
      envFrom:
        - configMapRef:
            name: app-config        # All keys become env vars
        - secretRef:
            name: app-secrets

      # ─── Resource Requests & Limits ─────────────────────────────
      resources:
        requests:                   # Minimum guaranteed resources
          memory: "256Mi"           # Scheduler uses this for placement
          cpu: "250m"               # 250 millicores = 0.25 CPU
        limits:                     # Maximum allowed
          memory: "512Mi"           # OOMKilled if exceeded
          cpu: "1000m"              # Throttled if exceeded (NOT killed)

      # ─── Health Probes ──────────────────────────────────────────
      startupProbe:                 # Is the app done starting?
        httpGet:
          path: /actuator/health
          port: 9090
        failureThreshold: 30        # 30 × 10s = 5 min max startup
        periodSeconds: 10

      livenessProbe:                # Is the app alive? Restart if not.
        httpGet:
          path: /actuator/health/liveness
          port: 9090
        initialDelaySeconds: 0      # startupProbe handles initial delay
        periodSeconds: 10
        timeoutSeconds: 5
        failureThreshold: 3

      readinessProbe:               # Is app ready for traffic? Remove from LB if not.
        httpGet:
          path: /actuator/health/readiness
          port: 9090
        periodSeconds: 5
        timeoutSeconds: 3
        failureThreshold: 2
        successThreshold: 1

      # ─── Volume Mounts ──────────────────────────────────────────
      volumeMounts:
        - name: config-vol
          mountPath: /app/config
          readOnly: true
        - name: data-vol
          mountPath: /app/data
        - name: tmp-vol
          mountPath: /tmp

      # ─── Security Context ───────────────────────────────────────
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        runAsGroup: 1001
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop: ["ALL"]

      # ─── Lifecycle Hooks ────────────────────────────────────────
      lifecycle:
        postStart:                  # Runs after container starts (async)
          exec:
            command: ["/bin/sh", "-c", "echo Container started"]
        preStop:                    # Runs before container stops (sync)
          exec:                     # K8s waits for this before SIGTERM
            command: ["/bin/sh", "-c", "sleep 5"]  # Drain connections

    # ─── Sidecar Container ────────────────────────────────────────
    - name: log-shipper
      image: fluent/fluent-bit:2.2
      volumeMounts:
        - name: log-vol
          mountPath: /var/log/app
          readOnly: true

  # ─── Volumes ────────────────────────────────────────────────────
  volumes:
    - name: config-vol
      configMap:
        name: app-config
    - name: data-vol
      persistentVolumeClaim:
        claimName: my-pvc
    - name: tmp-vol
      emptyDir: {}               # Ephemeral, shared between containers
    - name: log-vol
      emptyDir: {}

  # ─── Pod-Level Settings ─────────────────────────────────────────
  restartPolicy: Always           # Always | OnFailure | Never
  terminationGracePeriodSeconds: 30  # SIGTERM grace period

  # Node selection
  nodeSelector:
    kubernetes.io/arch: amd64
    node-type: compute

  # Service account for RBAC / cloud provider permissions
  serviceAccountName: my-app-sa

  # Image pull secrets (for private registries)
  imagePullSecrets:
    - name: my-registry-secret

  # DNS
  dnsPolicy: ClusterFirst         # ClusterFirst | Default | None
```

---

## Pod Lifecycle States

```
Pending    → Pod accepted, but not yet scheduled/pulled
Running    → Pod bound to node, at least one container running
Succeeded  → All containers completed successfully (for Jobs)
Failed     → All containers terminated, at least one failed
Unknown    → Pod state can't be determined (node comms lost)
```

### Container States
```
Waiting    → Not yet running (pulling image, init containers running)
Running    → Executing
Terminated → Finished (exit code 0 = success, non-zero = failed)
```

---

## Health Probes Deep Dive

Three types, each answers a different question:

```
startupProbe    → "Has the application finished starting?"
                  (replaces initial delay — handles slow-starting apps)

livenessProbe   → "Is the application still alive?"
                  (Kubernetes restarts container if this fails)

readinessProbe  → "Is the application ready to serve traffic?"
                  (Kubernetes removes from Service endpoints if this fails)
```

### Probe Types
```yaml
# HTTP GET — most common for web services
httpGet:
  path: /actuator/health
  port: 8080
  httpHeaders:
    - name: X-Health-Check
      value: "true"

# TCP Socket — for non-HTTP services
tcpSocket:
  port: 5432    # Just checks if port is open

# Exec Command — run command inside container
exec:
  command:
    - sh
    - -c
    - "redis-cli ping | grep PONG"
  # Exit code 0 = healthy, non-zero = unhealthy

# gRPC (K8s 1.24+)
grpc:
  port: 50051
  service: ""
```

### Probe Timing
```yaml
initialDelaySeconds: 30    # Wait N seconds before first probe
periodSeconds: 10          # Probe every N seconds
timeoutSeconds: 5          # Probe times out after N seconds
failureThreshold: 3        # Mark unhealthy after N consecutive failures
successThreshold: 1        # Mark healthy after N consecutive successes (readiness)
```

### Spring Boot Probe Setup
```yaml
# application.yml
management:
  endpoint:
    health:
      probes:
        enabled: true          # Enables /actuator/health/liveness + /readiness
  endpoints:
    web:
      exposure:
        include: health
  health:
    livenessstate:
      enabled: true
    readinessstate:
      enabled: true
```

---

## Resource Requests and Limits

```yaml
resources:
  requests:          # What the Pod NEEDS (scheduler uses this for placement)
    memory: "256Mi"
    cpu: "250m"      # 250 millicores = 0.25 of 1 CPU core
  limits:            # Maximum the Pod can USE
    memory: "512Mi"
    cpu: "1"         # 1 full CPU core
```

### What Happens at the Limit?
| Resource | At Limit |
|---|---|
| **Memory** | Container is **OOMKilled** (Out of Memory). Restarted by K8s. |
| **CPU** | Container is **throttled** (slowed down). NOT killed. |

### CPU Units
```
1 CPU = 1000m (millicores)
0.5 CPU = 500m
0.25 CPU = 250m
2 CPUs = 2000m or just "2"
```

### Memory Units
```
128Mi  = 128 Mebibytes (binary, 1024-based) — preferred in K8s
128M   = 128 Megabytes (decimal, 1000-based)
1Gi    = 1 Gibibyte
```

### QoS Classes
| Class | Condition | Eviction Priority |
|---|---|---|
| **Guaranteed** | requests == limits for all containers | Last to be evicted |
| **Burstable** | requests < limits (at least one resource) | Middle priority |
| **BestEffort** | No requests or limits set | First to be evicted |

---

## Init Containers

Run **sequentially to completion** before the main containers start. If an init container fails, K8s retries until it succeeds.

```yaml
initContainers:
  # 1. Wait for database to be ready
  - name: wait-for-postgres
    image: busybox:1.36
    command:
      - sh
      - -c
      - |
        until nc -z -w3 postgres 5432; do
          echo "Waiting for postgres..."
          sleep 3
        done
        echo "PostgreSQL is ready!"

  # 2. Run database migrations
  - name: db-migrate
    image: myapp:1.0.0
    command: ["java", "-jar", "/app/app.jar", "--spring.batch.job.enabled=migrate"]
    env:
      - name: SPRING_DATASOURCE_URL
        value: jdbc:postgresql://postgres:5432/mydb

# Main container only starts after BOTH init containers succeed
containers:
  - name: api
    image: myapp:1.0.0
```

---

## Multi-Container Pod Patterns

### Sidecar Pattern
Enhance the main container without modifying it.

```yaml
containers:
  - name: api
    image: myapp:1.0.0
    volumeMounts:
      - name: log-vol
        mountPath: /app/logs

  - name: log-shipper          # Sidecar: ships logs to ELK
    image: fluent/fluent-bit:2.2
    volumeMounts:
      - name: log-vol
        mountPath: /var/log/app
        readOnly: true

volumes:
  - name: log-vol
    emptyDir: {}               # Shared between both containers
```

### Ambassador Pattern
Proxy outbound connections for the main container.

```yaml
containers:
  - name: api
    image: myapp:1.0.0
    # API connects to localhost:5432 (ambassador)
    env:
      - name: DB_HOST
        value: localhost      # Connects to ambassador, not DB directly

  - name: db-ambassador       # Ambassador: handles auth, TLS, retries
    image: envoy:latest
    # Proxies connections from localhost:5432 → real DB
```

### Adapter Pattern
Adapt the main container's output format for external systems.

```yaml
containers:
  - name: legacy-app
    image: legacy-app:1.0.0   # Outputs proprietary log format

  - name: log-adapter         # Adapter: converts to standard format
    image: log-converter:1.0.0
    # Reads legacy format, outputs JSON for Elasticsearch
```

---

## emptyDir — Shared Volume Between Containers

```yaml
volumes:
  - name: shared-data
    emptyDir: {}              # Created when Pod starts, deleted when Pod dies

containers:
  - name: writer
    volumeMounts:
      - mountPath: /output
        name: shared-data

  - name: reader
    volumeMounts:
      - mountPath: /input
        name: shared-data     # Same directory — both containers see same files
```

---

## Interview Questions

1. What is a Pod in Kubernetes and why is it the basic unit rather than a container?
2. What is the difference between a liveness probe and a readiness probe?
3. What is a startup probe and when should you use it?
4. What is the difference between resource requests and resource limits?
5. What happens to a container when it exceeds its memory limit? Its CPU limit?
6. What are init containers and what are they used for?
7. How do two containers in the same Pod communicate?
8. What is the Sidecar pattern? Give an example.
9. What are the three Pod QoS classes and how are they determined?
10. Why are Pods considered ephemeral? What replaces a dead Pod?
