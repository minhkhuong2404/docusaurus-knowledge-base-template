---
id: kubernetes-workloads
title: Workloads — Deployments, StatefulSets, DaemonSets & Jobs
sidebar_label: Workloads
description: Complete guide to Kubernetes workload resources — Deployments, ReplicaSets, StatefulSets, DaemonSets, Jobs, and CronJobs with rolling updates, rollbacks, and autoscaling.
tags: [kubernetes, deployment, statefulset, daemonset, job, cronjob, hpa, rolling-update, intermediate]
---

# Workloads — Deployments, StatefulSets, DaemonSets & Jobs

> You almost never create Pods directly. You create a **workload resource** that manages Pods for you.

---

## Workload Types Overview

| Resource | Pods | Pod Identity | Use Case |
|---|---|---|---|
| **Deployment** | Multiple replicas | Interchangeable | Stateless apps (REST APIs) |
| **StatefulSet** | Multiple replicas | Stable identity | Databases, message queues |
| **DaemonSet** | One per Node | Per-node | Logging agents, monitoring |
| **Job** | One or more | N/A | Batch tasks, migrations |
| **CronJob** | On schedule | N/A | Scheduled tasks, reports |

---

## Deployment

The most common workload. Manages a set of identical, stateless Pods.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-api
  namespace: production
  labels:
    app: my-api
spec:
  replicas: 3                       # Desired number of Pods

  selector:
    matchLabels:
      app: my-api                   # Which Pods this Deployment manages

  # Rolling update strategy
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1                   # How many extra Pods during update
      maxUnavailable: 0             # How many Pods can be unavailable (0 = zero-downtime)

  template:                         # Pod template
    metadata:
      labels:
        app: my-api                 # MUST match selector.matchLabels
        version: "1.2.0"
    spec:
      containers:
        - name: api
          image: myapp:1.2.0
          ports:
            - containerPort: 8080
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "1"
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
            periodSeconds: 5
            failureThreshold: 3
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
            periodSeconds: 10
            failureThreshold: 3
          env:
            - name: SPRING_PROFILES_ACTIVE
              value: production
```

### Relationship: Deployment → ReplicaSet → Pods

```
Deployment (my-api)
  └─ ReplicaSet (my-api-7d9f8c) [version 1.2.0]
       ├─ Pod (my-api-7d9f8c-abc12) [Running]
       ├─ Pod (my-api-7d9f8c-def34) [Running]
       └─ Pod (my-api-7d9f8c-ghi56) [Running]

After update to v1.3.0:
Deployment (my-api)
  ├─ ReplicaSet (my-api-7d9f8c) [version 1.2.0] → scaled to 0
  └─ ReplicaSet (my-api-abc123) [version 1.3.0] → scaled to 3
```

### Rolling Update Process

```
Step 1: Create new Pod (v1.3.0) → [old×3, new×1]
Step 2: New Pod passes readiness → Route traffic to it
Step 3: Remove one old Pod       → [old×2, new×1]
Step 4: Repeat...                → [old×0, new×3]
Result: Zero downtime!
```

```bash
# Trigger rolling update
kubectl set image deployment/my-api api=myapp:1.3.0

# Watch rollout
kubectl rollout status deployment/my-api
# Waiting for deployment "my-api" rollout to finish: 1 out of 3 new replicas have been updated...
# deployment "my-api" successfully rolled out

# Pause / Resume
kubectl rollout pause deployment/my-api
kubectl rollout resume deployment/my-api

# Rollback
kubectl rollout undo deployment/my-api                 # Roll back to previous
kubectl rollout undo deployment/my-api --to-revision=2 # Roll back to revision 2

# History
kubectl rollout history deployment/my-api
kubectl rollout history deployment/my-api --revision=2
```

---

## StatefulSet

For **stateful applications** that need stable network identities and persistent storage.

### Differences from Deployment
| Feature | Deployment | StatefulSet |
|---|---|---|
| Pod names | Random (`my-app-7d9f8c-abc12`) | Ordered (`my-app-0`, `my-app-1`) |
| Pod identity | Interchangeable | Stable, unique |
| Startup order | Parallel | Sequential (0, 1, 2...) |
| Storage | Shared or none | Each Pod gets its OWN PVC |
| DNS | Random Pod IPs | Stable DNS per Pod |

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres         # Headless service name (required)
  replicas: 3
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:16-alpine
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: pg-secret
                  key: password
          volumeMounts:
            - name: pgdata
              mountPath: /var/lib/postgresql/data

  # Each Pod gets its own PVC automatically
  volumeClaimTemplates:
    - metadata:
        name: pgdata
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: fast-ssd
        resources:
          requests:
            storage: 20Gi
```

### StatefulSet Pod DNS

```
Pod name:        postgres-0, postgres-1, postgres-2
DNS:             postgres-0.postgres.default.svc.cluster.local
                 postgres-1.postgres.default.svc.cluster.local
                 ↑ pod-name.service-name.namespace.svc.cluster.local
```

This stable DNS is what makes StatefulSets useful for clustered databases — each replica always has the same hostname.

---

## DaemonSet

Ensures **one Pod runs on every Node** (or on selected nodes).

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: log-collector
  namespace: kube-system
spec:
  selector:
    matchLabels:
      name: log-collector
  template:
    metadata:
      labels:
        name: log-collector
    spec:
      # Run on every node (including control plane if toleration added)
      tolerations:
        - key: node-role.kubernetes.io/control-plane
          operator: Exists
          effect: NoSchedule

      containers:
        - name: fluent-bit
          image: fluent/fluent-bit:2.2
          volumeMounts:
            - name: varlog
              mountPath: /var/log
              readOnly: true
            - name: containers
              mountPath: /var/lib/docker/containers
              readOnly: true

      volumes:
        - name: varlog
          hostPath:
            path: /var/log
        - name: containers
          hostPath:
            path: /var/lib/docker/containers
```

**Use cases:** Log collectors (Fluentd, Filebeat), monitoring agents (Prometheus Node Exporter), network plugins (CNI), security agents.

---

## Job

Runs Pods to **completion** — not continuously like a Deployment.

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration
spec:
  completions: 1                # Run 1 successful completion
  parallelism: 1                # Run 1 Pod at a time
  backoffLimit: 3               # Retry up to 3 times on failure
  activeDeadlineSeconds: 300    # Kill if not done in 5 min
  ttlSecondsAfterFinished: 600  # Delete Job 10 min after completion

  template:
    spec:
      restartPolicy: OnFailure  # Required: Never | OnFailure (not Always)
      containers:
        - name: migrate
          image: myapp:1.0.0
          command: ["java", "-jar", "/app/app.jar", "--migrate"]
          env:
            - name: SPRING_DATASOURCE_URL
              value: jdbc:postgresql://postgres:5432/mydb
```

### Parallel Jobs
```yaml
spec:
  completions: 10              # Need 10 successful completions total
  parallelism: 3               # Run 3 Pods at once
  # K8s runs batches of 3 until 10 total succeed
```

---

## CronJob

Runs Jobs on a **cron schedule**.

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: daily-report
spec:
  schedule: "0 2 * * *"          # Every day at 2am (UTC)
  # Cron syntax: minute hour day-of-month month day-of-week
  # "*/5 * * * *"  = every 5 minutes
  # "0 9 * * 1-5"  = 9am weekdays

  concurrencyPolicy: Forbid       # Allow | Forbid | Replace
  successfulJobsHistoryLimit: 3   # Keep last 3 successful jobs
  failedJobsHistoryLimit: 1       # Keep last 1 failed job
  startingDeadlineSeconds: 60     # If missed, run within 60s or skip

  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: report-generator
              image: myapp:1.0.0
              command: ["java", "-jar", "/app/app.jar", "--run-report"]
```

---

## Horizontal Pod Autoscaler (HPA)

Automatically scales Deployments/StatefulSets based on metrics.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-api
  minReplicas: 2
  maxReplicas: 20
  metrics:
    # CPU-based scaling
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70   # Scale up if avg CPU > 70%

    # Memory-based scaling
    - type: Resource
      resource:
        name: memory
        target:
          type: AverageValue
          averageValue: 400Mi

    # Custom metric (e.g., requests per second from Prometheus)
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "1000"
```

```bash
# Create HPA imperatively (quick way)
kubectl autoscale deployment my-api --min=2 --max=20 --cpu-percent=70

# Check HPA status
kubectl get hpa my-api
# NAME      REFERENCE          TARGETS   MINPODS   MAXPODS   REPLICAS
# my-api    Deployment/my-api  45%/70%   2         20        3
```

---

## Node Selection and Affinity

```yaml
spec:
  # Simple node selector
  nodeSelector:
    kubernetes.io/arch: amd64
    cloud.google.com/gke-nodepool: high-memory

  # Advanced affinity rules
  affinity:
    # Node affinity — prefer/require specific nodes
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions:
              - key: node-type
                operator: In
                values: ["compute", "general"]
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 100
          preference:
            matchExpressions:
              - key: region
                operator: In
                values: ["us-east"]

    # Pod anti-affinity — spread Pods across nodes/zones
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        - labelSelector:
            matchLabels:
              app: my-api
          topologyKey: "kubernetes.io/hostname"  # One Pod per node
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 100
          podAffinityTerm:
            labelSelector:
              matchLabels:
                app: my-api
            topologyKey: "topology.kubernetes.io/zone"  # Prefer spread across zones
```

---

## Deployments: Key Commands

```bash
# Create / Update
kubectl apply -f deployment.yaml
kubectl set image deployment/my-api api=myapp:1.3.0

# Scale
kubectl scale deployment my-api --replicas=5

# Status
kubectl get deployments
kubectl get deployment my-api -o wide
kubectl describe deployment my-api

# Rollout
kubectl rollout status deployment/my-api
kubectl rollout history deployment/my-api
kubectl rollout undo deployment/my-api

# Delete
kubectl delete deployment my-api
kubectl delete -f deployment.yaml
```

---

## Interview Questions

1. What is the difference between a Deployment and a StatefulSet?
2. How does a rolling update work in a Kubernetes Deployment?
3. How do you roll back a Deployment to the previous version?
4. What is `maxSurge` and `maxUnavailable` in a rolling update strategy?
5. What problem does a StatefulSet solve that a Deployment cannot?
6. What is a DaemonSet and what is it used for?
7. What is the difference between a Job and a CronJob?
8. What is the `restartPolicy` for a Job's Pod template and why can't it be `Always`?
9. How does a Horizontal Pod Autoscaler work?
10. How do you spread Pods across different availability zones to improve resilience?
