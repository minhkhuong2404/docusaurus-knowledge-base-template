---
id: kubernetes-configuration
title: Configuration & Resource Management
sidebar_label: Configuration
description: Kubernetes configuration management — namespaces, resource quotas, LimitRanges, labels, annotations, taints and tolerations, node affinity, Pod disruption budgets, and production deployment patterns.
tags: [kubernetes, configuration, namespaces, resourcequota, limitrange, labels, taints, tolerations, pdb, intermediate]
---

# Configuration & Resource Management

---

## Namespaces (Environment Isolation)

Use namespaces to separate environments, teams, or applications.

```bash
# Create namespaces
kubectl create namespace production
kubectl create namespace staging
kubectl create namespace monitoring

# Common convention
production    → prod workloads
staging       → pre-prod testing
development   → dev workloads
monitoring    → Prometheus, Grafana
kube-system   → K8s system components (don't touch)
```

```yaml
# Reference namespace in resource
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-api
  namespace: production     # ← specify namespace
```

```bash
# Work in a namespace
kubectl get pods -n production
kubectl get all -n production

# Set default namespace for your session
kubectl config set-context --current --namespace=production
```

---

## Labels and Selectors

Labels are **key-value pairs** used to organise and select objects.

```yaml
metadata:
  labels:
    app: my-api             # App name
    version: "1.2.0"        # Version
    environment: production # Environment
    team: backend           # Owning team
    tier: api               # Tier (api, worker, db)
```

```bash
# Filter by label
kubectl get pods -l app=my-api
kubectl get pods -l app=my-api,environment=production
kubectl get pods -l 'version in (1.0.0, 1.1.0)'
kubectl get pods -l 'environment notin (dev,staging)'

# Set label on running resource
kubectl label pod my-pod app=my-api
kubectl label pod my-pod release=canary --overwrite

# Remove label
kubectl label pod my-pod release-
```

---

## Annotations

Non-identifying metadata — for tools, documentation, automation.

```yaml
metadata:
  annotations:
    description: "Spring Boot REST API"
    git-commit: "abc123def456"
    deployment-time: "2024-01-15T10:00:00Z"
    kubectl.kubernetes.io/last-applied-configuration: ...
    # Ingress controller config
    nginx.ingress.kubernetes.io/rate-limit: "100"
    # cert-manager config
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    # Prometheus scrape config
    prometheus.io/scrape: "true"
    prometheus.io/path: "/actuator/prometheus"
    prometheus.io/port: "9090"
```

---

## ResourceQuota

Limit total resource consumption in a namespace.

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: production-quota
  namespace: production
spec:
  hard:
    # Compute
    requests.cpu: "10"            # Total CPU requests in namespace
    requests.memory: 20Gi        # Total memory requests
    limits.cpu: "20"
    limits.memory: 40Gi

    # Object counts
    pods: "100"
    services: "20"
    secrets: "50"
    configmaps: "50"
    persistentvolumeclaims: "20"
    services.loadbalancers: "5"
    services.nodeports: "0"       # Disallow NodePort services
```

```bash
kubectl get resourcequota -n production
kubectl describe resourcequota production-quota -n production
```

---

## LimitRange

Set default requests/limits and enforce min/max for individual containers.

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: container-limits
  namespace: production
spec:
  limits:
    - type: Container
      # Default values applied to containers without explicit settings
      default:
        cpu: "500m"
        memory: "512Mi"
      defaultRequest:
        cpu: "100m"
        memory: "128Mi"
      # Enforced bounds
      max:
        cpu: "4"
        memory: "4Gi"
      min:
        cpu: "50m"
        memory: "64Mi"

    - type: PersistentVolumeClaim
      max:
        storage: 100Gi
      min:
        storage: 1Gi
```

---

## Taints and Tolerations

**Taints** on a Node **repel** Pods unless the Pod has a matching **toleration**.

```bash
# Add taint to a node
kubectl taint nodes node1 key=value:NoSchedule
kubectl taint nodes node1 gpu=true:NoSchedule
kubectl taint nodes node1 env=production:NoExecute   # Evict existing Pods too

# Remove taint
kubectl taint nodes node1 gpu=true:NoSchedule-
```

```yaml
# Pod toleration — allows it to run on tainted node
spec:
  tolerations:
    - key: "gpu"
      operator: "Equal"
      value: "true"
      effect: "NoSchedule"

    # Tolerate ALL taints on a node (e.g., DaemonSet on control plane)
    - operator: "Exists"
      effect: "NoSchedule"
```

### Taint Effects
| Effect | Meaning |
|---|---|
| `NoSchedule` | Don't schedule new Pods without toleration |
| `PreferNoSchedule` | Prefer not to schedule (soft) |
| `NoExecute` | Don't schedule AND evict existing Pods without toleration |

**Use case:** Dedicated nodes for GPU workloads, production vs dev isolation, control plane protection.

---

## Node Affinity (Advanced Scheduling)

```yaml
spec:
  affinity:
    nodeAffinity:
      # HARD requirement — Pod won't schedule without this
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions:
              - key: kubernetes.io/arch
                operator: In
                values: ["amd64"]
              - key: node.kubernetes.io/instance-type
                operator: In
                values: ["m5.xlarge", "m5.2xlarge"]

      # SOFT preference — schedules anyway if no match
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 100
          preference:
            matchExpressions:
              - key: topology.kubernetes.io/zone
                operator: In
                values: ["us-east-1a"]
```

---

## Pod Disruption Budget (PDB)

Limit how many Pods of an application can be down simultaneously — protects during node drains, updates.

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: my-api-pdb
spec:
  # Option 1: Minimum available
  minAvailable: 2             # At least 2 Pods must remain running

  # Option 2: Maximum unavailable (choose one)
  # maxUnavailable: 1         # At most 1 Pod can be unavailable

  selector:
    matchLabels:
      app: my-api
```

```bash
kubectl get pdb
# NAME       MIN AVAILABLE  MAX UNAVAILABLE  ALLOWED DISRUPTIONS  AGE
# my-api-pdb 2              N/A              1                    1d
```

**Scenario:** You have 3 replicas and `minAvailable: 2`. During `kubectl drain node1`, K8s will not remove a Pod if it would leave fewer than 2 running.

---

## Contexts and kubeconfig

```bash
# View current context
kubectl config current-context

# List all contexts (clusters)
kubectl config get-contexts

# Switch context
kubectl config use-context my-prod-cluster

# Set default namespace in context
kubectl config set-context --current --namespace=production

# View kubeconfig
kubectl config view
cat ~/.kube/config
```

### Multi-Cluster kubeconfig
```bash
# Merge multiple kubeconfig files
KUBECONFIG=~/.kube/config:~/.kube/dev-cluster:~/.kube/prod-cluster \
  kubectl config view --merge --flatten > ~/.kube/config-merged

export KUBECONFIG=~/.kube/config-merged
```

---

## Production Configuration Checklist

```yaml
# Every production Deployment should have:
spec:
  replicas: 3                          # ✅ Multiple replicas
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0               # ✅ Zero-downtime update
      maxSurge: 1

  template:
    spec:
      containers:
        - resources:
            requests:                 # ✅ Always set requests (for scheduler)
              cpu: "250m"
              memory: "256Mi"
            limits:                   # ✅ Always set limits (prevent OOM)
              cpu: "1"
              memory: "512Mi"
          readinessProbe: ...         # ✅ Readiness probe (traffic routing)
          livenessProbe: ...          # ✅ Liveness probe (auto-restart)
          securityContext:
            runAsNonRoot: true        # ✅ Non-root
            readOnlyRootFilesystem: true  # ✅ Read-only filesystem

      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - topologyKey: kubernetes.io/hostname  # ✅ Spread across nodes
```

---

## Useful Configuration Commands

```bash
# Explain any resource field
kubectl explain pod.spec.containers.resources
kubectl explain deployment.spec.strategy

# Edit a live resource
kubectl edit deployment my-api           # Opens in $EDITOR
kubectl patch deployment my-api -p '{"spec":{"replicas":5}}'

# Apply from stdin
cat deployment.yaml | kubectl apply -f -

# Dry run (validate without applying)
kubectl apply -f deployment.yaml --dry-run=client
kubectl apply -f deployment.yaml --dry-run=server  # Server-side validation

# Generate YAML without applying
kubectl create deployment my-api --image=myapp:1.0.0 \
  --dry-run=client -o yaml > deployment.yaml

# Diff changes before applying
kubectl diff -f deployment.yaml
```

---

## Interview Questions

1. What is the difference between a label and an annotation in Kubernetes?
2. What does a ResourceQuota do and in what scope does it apply?
3. What is a LimitRange and what does it add on top of ResourceQuota?
4. What is a taint and what problem does it solve?
5. What is the difference between `NoSchedule` and `NoExecute` taint effects?
6. What is a Pod Disruption Budget (PDB) and why is it important?
7. How do you spread Pods across availability zones?
8. What is a kubeconfig context?
9. What does `kubectl apply --dry-run=server` do?
10. Why should you always set resource requests on every container in production?
