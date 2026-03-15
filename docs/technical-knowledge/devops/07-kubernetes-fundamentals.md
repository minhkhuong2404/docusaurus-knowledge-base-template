---
id: kubernetes-fundamentals
title: Kubernetes Fundamentals
sidebar_label: K8s Fundamentals
description: Kubernetes architecture for beginners — control plane components, worker nodes, the API server, etcd, scheduler, kubelet, kube-proxy, and how they work together to run containerised workloads.
tags: [kubernetes, k8s, architecture, control-plane, worker-node, api-server, etcd, beginner]
---

# Kubernetes Fundamentals

> Kubernetes (K8s) automates the deployment, scaling, and management of containerised applications across a cluster of machines.

---

## Why Kubernetes?

Running containers in production at scale requires:

| Need | What Kubernetes Provides |
|---|---|
| Keep containers running | Automatic restarts, self-healing |
| Scale up/down | Horizontal Pod Autoscaler |
| Zero-downtime deploys | Rolling updates, canary deployments |
| Service discovery | Built-in DNS, Services |
| Load balancing | Service load balancing |
| Secret management | Secrets and ConfigMaps |
| Storage | Persistent Volumes |
| Multi-machine scheduling | Scheduler places Pods optimally |

---

## Kubernetes Cluster Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  CONTROL PLANE (Master Node)                                         │
│                                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐  │
│  │ API Server  │  │  Scheduler   │  │ Controller   │  │  etcd   │  │
│  │ (kube-api)  │  │              │  │  Manager     │  │         │  │
│  └──────┬──────┘  └──────────────┘  └──────────────┘  └─────────┘  │
│         │ (all components talk through API server)                   │
└─────────┼───────────────────────────────────────────────────────────┘
          │
          │ kubelet watches for work
┌─────────▼───────────────────────────────────────────────────────────┐
│  WORKER NODE 1                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────┐   │
│  │   kubelet    │  │  kube-proxy  │  │  Container Runtime      │   │
│  │              │  │              │  │  (containerd)           │   │
│  └──────────────┘  └──────────────┘  └─────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Pod A  (container-1 + container-2)                         │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  ┌─────────────┐  ┌─────────────┐                                   │
│  │  Pod B      │  │  Pod C      │                                   │
│  └─────────────┘  └─────────────┘                                   │
└──────────────────────────────────────────────────────────────────────┘

WORKER NODE 2 ... WORKER NODE N  (same structure)
```

---

## Control Plane Components

### kube-apiserver
The **front door** to Kubernetes. Every action (CLI, UI, controller) goes through the API server.

```
kubectl apply -f deployment.yaml
       ↓
kube-apiserver (REST API)
       ↓ validates + persists
     etcd
       ↓ notifies watchers
  Scheduler, Controllers, kubelets
```

- All state changes go through the API server
- Authenticates and authorises every request
- Exposes the Kubernetes REST API

### etcd
A **distributed key-value store** that holds the entire cluster state.

```
Everything in Kubernetes is stored in etcd:
  /registry/pods/default/my-pod
  /registry/deployments/default/my-deployment
  /registry/services/default/my-service
  /registry/secrets/default/my-secret
```

- Strongly consistent (Raft consensus)
- Only the API server reads/writes to etcd
- **Back this up** — losing etcd = losing your cluster

### kube-scheduler
Decides **which Node** a newly created Pod should run on.

```
New Pod created (no Node assigned)
       ↓
Scheduler evaluates each Node:
  ✓ Does it have enough CPU and memory?
  ✓ Does it satisfy node selectors / affinity?
  ✓ Are there any taints that block it?
  ✓ Is it the least loaded node?
       ↓
Assigns Pod to best Node → writes to API server
```

### kube-controller-manager
Runs **control loops** — constantly reconciles desired state with actual state.

| Controller | What it does |
|---|---|
| **ReplicaSet controller** | Ensures the right number of Pod replicas exist |
| **Deployment controller** | Manages rolling updates |
| **Node controller** | Monitors node health, evicts Pods from unhealthy nodes |
| **Service Account controller** | Creates default service accounts in new namespaces |
| **Endpoint controller** | Populates Service endpoints |
| **Job controller** | Manages Job and CronJob execution |

```
Desired state: 3 replicas
Actual state:  2 replicas (one died)
       ↓
ReplicaSet controller creates 1 new Pod → actual = desired
```

### cloud-controller-manager
Integrates with cloud provider APIs (AWS, GCP, Azure) to provision load balancers, persistent volumes, etc.

---

## Worker Node Components

### kubelet
The **agent** on every worker node. Talks to the API server and ensures containers are running as specified.

```
API server tells kubelet: "Run this Pod spec"
       ↓
kubelet instructs container runtime (containerd/Docker)
       ↓
containerd pulls image + runs containers
       ↓
kubelet monitors health, reports back to API server
```

### kube-proxy
Maintains **network rules** on each node to enable Service communication.

```
Service "my-api" → ClusterIP: 10.96.0.1:8080
       ↓
kube-proxy sets up iptables/IPVS rules:
  Any packet to 10.96.0.1:8080 → forward to one of the backing Pods
```

### Container Runtime
Runs the actual containers. Kubernetes supports any OCI-compliant runtime.

| Runtime | Notes |
|---|---|
| **containerd** | Default in most modern K8s distros |
| **CRI-O** | Lightweight, RedHat-backed |
| **Docker** | Deprecated as K8s runtime (K8s 1.24+) |

---

## The Kubernetes API

Everything in Kubernetes is a **resource** — a typed object stored in etcd and managed via the API.

```yaml
apiVersion: apps/v1        # API group + version
kind: Deployment           # Resource type
metadata:
  name: my-api             # Resource name
  namespace: default       # Logical partition
  labels:
    app: my-api
    version: "1.0"
spec:                      # Desired state
  replicas: 3
  ...
status:                    # Actual state (written by K8s, read-only)
  readyReplicas: 3
  ...
```

### API Groups
```
core/v1          → Pod, Service, ConfigMap, Secret, PersistentVolume
apps/v1          → Deployment, ReplicaSet, StatefulSet, DaemonSet
batch/v1         → Job, CronJob
networking.k8s.io/v1 → Ingress, NetworkPolicy
rbac.authorization.k8s.io/v1 → Role, RoleBinding, ClusterRole
autoscaling/v2   → HorizontalPodAutoscaler
storage.k8s.io/v1 → StorageClass
```

---

## Namespaces

Virtual clusters within a physical cluster. Scope resources and permissions.

```bash
kubectl get namespaces
# NAME              STATUS
# default           Active   ← default if not specified
# kube-system       Active   ← K8s internal components
# kube-public       Active   ← Publicly readable resources
# kube-node-lease   Active   ← Node heartbeat leases
```

```bash
# Create namespace
kubectl create namespace production
kubectl create namespace staging

# Work in a namespace
kubectl get pods -n production
kubectl get all -n production

# Set default namespace for current context
kubectl config set-context --current --namespace=production
kubectl get pods   # Now defaults to production

# Resources that are NOT namespaced (cluster-wide):
# Nodes, PersistentVolumes, ClusterRoles, StorageClass, Namespace itself
```

---

## Declarative vs Imperative

```bash
# Imperative — tell K8s what to DO
kubectl run my-pod --image=nginx
kubectl create deployment my-deploy --image=nginx --replicas=3
kubectl expose deployment my-deploy --port=80

# Declarative — tell K8s what STATE you want (preferred!)
kubectl apply -f deployment.yaml    # Create or update
kubectl delete -f deployment.yaml   # Delete what's in the file
```

> Always use **declarative** YAML files in production. They're version-controlled, reviewable, and idempotent.

---

## Reconciliation Loop (The Core Concept)

```
You define desired state in YAML
        ↓
kubectl apply → API server stores in etcd
        ↓
Controller Manager watches etcd
        ↓
"Current state ≠ Desired state"
        ↓
Controller takes action to close the gap
        ↓
Repeats forever (control loop)

Example:
  You: "I want 3 replicas of my-api"
  K8s: "I see 2 running" → creates 1 more
  K8s: "I see 4 running" → deletes 1
  K8s: "I see 3 running" → does nothing ✓
```

---

## Local Kubernetes Options

| Tool | Best For | Notes |
|---|---|---|
| **minikube** | Learning, local dev | Single-node, easy setup |
| **kind** | CI testing, local dev | K8s in Docker — very fast |
| **k3s** | Lightweight production, edge | Full K8s, minimal resources |
| **Docker Desktop** | macOS/Windows dev | One-click enable |
| **MicroK8s** | Ubuntu dev | Snap-installed |

```bash
# minikube
minikube start --driver=docker --cpus=4 --memory=8g --kubernetes-version=v1.30.0
minikube stop
minikube delete
minikube dashboard          # Open K8s dashboard in browser
minikube tunnel             # Expose LoadBalancer services on localhost

# kind
kind create cluster --name dev
kind create cluster --name dev --config kind-config.yaml  # Multi-node
kind delete cluster --name dev
kind load docker-image myapp:latest --name dev  # Load local image
```

---

## Interview Questions

1. What are the components of the Kubernetes control plane and what does each do?
2. What is etcd and why is it critical?
3. What is the role of the kubelet on a worker node?
4. Explain the Kubernetes reconciliation loop.
5. What is kube-proxy and what does it do?
6. What is a Namespace in Kubernetes?
7. What is the difference between imperative and declarative resource management?
8. What happens when a node dies — how does Kubernetes recover?
9. What is the kube-scheduler responsible for?
10. Why was Docker deprecated as a Kubernetes container runtime?
