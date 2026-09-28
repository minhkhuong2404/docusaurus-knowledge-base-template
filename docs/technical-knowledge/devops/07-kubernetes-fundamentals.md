---
id: kubernetes-fundamentals
title: Kubernetes Fundamentals
sidebar_label: K8s Fundamentals
description: Kubernetes architecture for beginners — control plane components, worker nodes, the API server, etcd, scheduler, kubelet, kube-proxy, and how they work together to run containerised workloads.
tags: [kubernetes, k8s, architecture, control-plane, worker-node, api-server, etcd, beginner]
---

import KubernetesArchitectureDiagram from '@site/src/components/KubernetesArchitectureDiagram';

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

<KubernetesArchitectureDiagram />

---

## Control Plane Components

### kube-apiserver
The **front door** to Kubernetes. Every action (CLI, UI, controller) goes through the API server, which validates inputs and persists cluster state to `etcd`.

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
Decides **which Node** a newly created Pod should run on through a two-phase pipeline:

```
Unscheduled Pod (spec.nodeName is empty)
                     │
                     ▼
       ┌───────────────────────────┐
       │   Phase 1: Filtering      │  Eliminates incompatible nodes (e.g., insufficient CPU/RAM,
       │      (Predicates)         │  taints without tolerations, port conflicts, nodeSelector mismatch)
       └─────────────┬─────────────┘
                     │ (Candidate Nodes)
                     ▼
       ┌───────────────────────────┐
       │   Phase 2: Scoring        │  Ranks feasible nodes from 0 to 100 based on weighted strategies
       │      (Priorities)         │  (e.g., ImageLocality, NodeResourcesBalancedAllocation, Spread)
       └─────────────┬─────────────┘
                     │ (Top Scoring Node)
                     ▼
       ┌───────────────────────────┐
       │   Phase 3: Binding        │  Writes binding back to kube-apiserver: spec.nodeName = "node-02"
       └───────────────────────────┘
```

- **Filtering (Predicates)**: Checks hard constraints. Nodes lacking requested CPU/RAM, nodes missing required labels (`nodeSelector`), or nodes with un-tolerated taints are discarded.
- **Scoring (Priorities)**: Ranks surviving candidates. Prefers nodes that already have the container image cached (`ImageLocality`), nodes that balance CPU and memory usage evenly, or nodes that spread pods across failure domains (Availability Zones).
- **Binding**: Creates a `Binding` object via `kube-apiserver`, populating the Pod's `spec.nodeName`. The scheduler itself does not touch worker nodes directly.

### kube-controller-manager
Runs continuous **control loops** — constantly reconciles the actual state of the cluster with the desired state stored in `etcd`.

| Controller | What it does | Under-the-Hood Mechanism |
|---|---|---|
| **ReplicaSet controller** | Ensures exact number of Pod replicas exist | Watches Pod creation/deletion; creates or deletes Pods to balance `spec.replicas` |
| **Deployment controller** | Manages declarative rollouts & rollbacks | Creates and orchestrates underlying ReplicaSets during rolling updates |
| **Node lifecycle controller** | Monitors worker node health and handles evictions | Watches node heartbeat leases in `kube-node-lease`; marks nodes `NotReady` after 40s and initiates Pod evictions after default 300s |
| **EndpointSlice controller** | Tracks healthy Pod IPs backing each Service | Populates `EndpointSlice` objects consumed by `kube-proxy` |
| **Job / CronJob controller** | Manages batch and scheduled workloads | Spawns Pods to completion, tracking retry counts and exit codes |

---

## Worker Node Components

### kubelet
The primary node daemon. Watches the API server for Pods assigned to its node and drives the local container runtime to achieve the Pod spec:

```
kube-apiserver (Pod scheduled: spec.nodeName = "worker-01")
                      │
           Watch API stream notification
                      ▼
                   kubelet
                      │
         gRPC calls via CRI (Unix Domain Socket)
                      ▼
            Container Runtime (containerd / CRI-O)
            ├── 1. Pull Image (ImageService)
            ├── 2. Create Pod Sandbox & Pause Container (RuntimeService)
            ├── 3. Execute CNI Plugins (Setup veth & IP)
            └── 4. Launch Application Containers via runc
                      │
        Probing & Liveness / Readiness monitoring
                      ▼
kubelet reports PodStatus & Node Lease back to kube-apiserver
```

- **CRI Integration**: Talks to container runtimes via standard gRPC over `/run/containerd/containerd.sock` or `/run/crio/crio.sock`.
- **Pod Sandbox Lifecycle**: Always launches a lightweight **pause container** first to hold the shared network (`net`) and IPC namespaces before starting application containers.
- **Health Probing**: Periodically executes liveness, readiness, and startup probes; triggers container restarts or EndpointSlice removal upon failure.

### kube-proxy
Maintains node routing rules to direct Service traffic (ClusterIP, NodePort) to target Pod IPs:

```
Service "orders-svc" (ClusterIP: 10.96.10.50:80)
                      │
       Client Pod initiates TCP connection
                      ▼
        Kernel Routing (programmed by kube-proxy)
        ├── iptables Mode: Sequential rule evaluation with random probability selection
        └── IPVS Mode: Linux IP Virtual Server kernel hash table (O(1) lookup latency)
                      ▼
Packet DNAT'd directly to target Pod IP: 10.244.2.14:8080
```

### Container Runtime (CRI-Compliant)
Executes the actual container processes inside isolated Linux namespaces and cgroups:

| Runtime | Architecture & Characteristics |
|---|---|
| **containerd** | Industry standard, lightweight daemon spun off from Docker; executes containers via `containerd-shim` and `runc`. |
| **CRI-O** | Purpose-built by Red Hat specifically for Kubernetes CRI; minimal footprint with zero extraneous tooling. |
| **Docker (dockerd)** | **Deprecated as direct K8s runtime in v1.20, removed in v1.24**. Docker images remain 100% compatible via OCI format. |

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

The fundamental design pattern of Kubernetes is the **Level-Triggered Reconciliation Loop**:

```
                  ┌──────────────────────────────┐
                  │    Desired State in etcd     │
                  │ (spec: replicas: 3, img: v2) │
                  └──────────────┬───────────────┘
                                 │
                   Read desired  │  Write actual
                                 ▼
+-------------------------------------------------------------------------+
|                    Kube Controller Reconciliation Loop                  |
|                                                                         |
|   1. OBSERVE   ───► Query API server for current live cluster state     |
|         │                                                               |
|         ▼                                                               |
|   2. ANALYZE   ───► Compute diff = (Desired State - Actual State)       |
|         │                                                               |
|         ▼                                                               |
|   3. ACT       ───► Issue imperative mutations to close the delta       |
+-------------------------------------------------------------------------+
```

### Why Level-Triggered (Not Edge-Triggered)?
- **Edge-Triggered (Event-based)**: Systems that act purely on changes (e.g. "Pod X died") risk permanent state desynchronization if an event is dropped due to a network partition or controller crash.
- **Level-Triggered (State-based)**: Kubernetes controllers observe the *current level* (what exists right now) regardless of how many intermediate events occurred. If a controller restarts or network reconnects, the very next loop execution inspects `observedGeneration` vs `generation`, detects any divergence, and drives the cluster toward the target state.

### End-to-End Self-Healing Lifecycle: Node Failure
```
[Worker Node 2 Dies]
        │
        ├── 0s: Node stops renewing heartbeat in kube-node-lease namespace
        ├── 40s (node-monitor-grace-period):
        │       Node Lifecycle Controller marks Node 2 as "NotReady"
        │       Tolerations kick in (node.kubernetes.io/not-ready:NoExecute)
        ├── 300s (pod-eviction-timeout):
        │       Pods on Node 2 marked as Terminating
        ├── +100ms:
        │       ReplicaSet Controller observes: readyReplicas (2) < spec.replicas (3)
        │       ReplicaSet Controller posts 1 new Pod spec to API server (spec.nodeName is null)
        ├── +200ms:
        │       kube-scheduler detects unbound Pod
        │       Filtering: Eliminates Node 2 (NotReady)
        │       Scoring: Evaluates Node 1 vs Node 3 (CPU/RAM headroom, spread)
        │       Binding: Assigns Pod to Node 3
        └── +2s:
                kubelet on Node 3 invokes containerd CRI to pull image and launch container.
                Cluster returns to desired state (3/3 replicas).
```

---

## Local Kubernetes Options

| Tool | Best For | Notes |
|---|---|---|
| **minikube** | Learning, local dev | Single-node VM/container, easy setup |
| **kind** | CI testing, multi-node dev | Runs K8s nodes as Docker containers — ultra fast bootstrap |
| **k3s** | Lightweight production, edge/IoT | Full certified K8s, replaces etcd with SQLite/etcd, minimal RAM (~512MB) |
| **Docker Desktop** | macOS/Windows dev | Single-click enable, embedded single-node cluster |
| **MicroK8s** | Ubuntu dev & homelabs | Snap-installed, production-grade single or multi-node |

```bash
# minikube quickstart
minikube start --driver=docker --cpus=4 --memory=8g --kubernetes-version=v1.30.0
minikube status
minikube dashboard          # Open K8s visual dashboard
minikube tunnel             # Expose LoadBalancer services on localhost

# kind (Kubernetes in Docker)
kind create cluster --name dev --config kind-config.yaml  # Multi-node simulation
kind get clusters
kind load docker-image myapp:v1 --name dev               # Inject local Docker image without registry push
kind delete cluster --name dev
```

---

## Senior Architect Interview Questions & Deep Answers

### 1. What are the components of the Kubernetes control plane and what does each do?
- **`kube-apiserver`**: Stateless REST gateway and sole component that directly talks to `etcd`. Handles authentication, authorization (RBAC), admission controllers (Mutating/Validating webhooks), and schema validation.
- **`etcd`**: Distributed B-Tree key-value store using the Raft consensus algorithm. Serves as the single source of truth for all cluster declarative state.
- **`kube-scheduler`**: Assigns unscheduled Pods to optimal worker nodes via a two-stage pipeline: **Filtering** (Predicates) and **Scoring** (Priorities).
- **`kube-controller-manager`**: Bundles continuous control loops (Deployment, ReplicaSet, Node Lifecycle, EndpointSlice) that drive actual cluster state toward desired state.
- **`cloud-controller-manager`**: Abstracts cloud-provider-specific logic (provisioning AWS NLB/ALBs, EBS storage volumes, or VPC routes).

### 2. What is etcd and why is it critical?
`etcd` is a strongly consistent (CP under CAP theorem) distributed key-value store that stores the complete cluster metadata and spec history. If `etcd` loses quorum (e.g. 2 nodes fail in a 3-node cluster), the control plane becomes read-only and no new pods can be scheduled, updated, or deleted. Worker node data planes (running containers) will continue operating, but cluster orchestration is completely paralyzed.

### 3. What is the role of the kubelet on a worker node?
The `kubelet` is the node agent that registers the node with the API server, watches for Pod assignments (`spec.nodeName == this_node`), and commands the local container runtime via gRPC over the Container Runtime Interface (CRI). It orchestrates the pause container, network namespaces, volume mounts, executes liveness/readiness probes, and continuously reports `PodStatus` and node heartbeat leases back to the control plane.

### 4. Explain the Kubernetes reconciliation loop.
It is an infinite level-triggered control loop operating on: **Observe $\to$ Analyze $\to$ Act**. Rather than reacting only to discrete transient events, the controller continuously observes the live cluster state, computes the difference relative to the desired specification in `etcd`, and invokes declarative or imperative API mutations to eliminate the delta. This guarantees idempotency and self-healing even after process crashes or dropped network packets.

### 5. What is kube-proxy and what does it do?
`kube-proxy` is a network daemon running on each worker node responsible for implementing the `Service` abstraction (Virtual IPs). It watches the API server for `Service` and `EndpointSlice` updates and translates traffic destined for a Service's `ClusterIP` to one of its healthy backend Pod IPs using either:
- **`iptables` mode**: Creates sequential packet filter rules with random weight probabilities (can cause CPU latency bottlenecks at 10,000+ services).
- **`IPVS` mode**: Uses Linux kernel Netfilter hash tables with $O(1)$ lookup complexity, supporting sophisticated load-balancing algorithms (Round Robin, Least Connection).

### 6. What is a Namespace in Kubernetes?
A Namespace is a logical partition within a single physical Kubernetes cluster that provides a scope for object names, resource quotas (`ResourceQuota`), limit ranges (`LimitRange`), and Role-Based Access Control (`RoleBinding`). It does **not** provide network isolation by default; Pods across different namespaces can communicate freely unless restricted by explicit `NetworkPolicy` rules.

### 7. What is the difference between imperative and declarative resource management?
- **Imperative** (`kubectl run`, `kubectl create`): Tells Kubernetes *what actions to execute* step-by-step. Hard to track in Git, non-idempotent, prone to configuration drift.
- **Declarative** (`kubectl apply -f manifest.yaml`): Tells Kubernetes *what end state you desire*. The API server uses 3-way merge patching (comparing local file, live cluster state, and last-applied configuration annotation), enabling GitOps, peer-reviewed infrastructure code, and idempotent convergence.

### 8. What happens when a node dies — how does Kubernetes recover?
1. The dead node fails to renew its lease in `kube-node-lease`.
2. After `node-monitor-grace-period` (default 40s), the Node Lifecycle Controller transitions the node status to `NotReady`.
3. After `pod-eviction-timeout` (default 5 minutes), the controller sets a deletion timestamp on the node's pods.
4. The workload controllers (e.g. `ReplicaSet`) notice missing healthy replicas and submit replacement Pod objects to the API server without a `nodeName`.
5. `kube-scheduler` schedules these replacement Pods to surviving healthy nodes with adequate resource headroom.
6. Once scheduled, `kubelet` on the destination node pulls images, mounts volumes, and starts the pods, restoring required capacity.

### 9. What is the kube-scheduler responsible for?
The `kube-scheduler` assigns unscheduled Pods to the most appropriate worker node without executing the workload itself. It does this via:
1. **Filtering**: Discards nodes that do not satisfy hard constraints (insufficient allocatable CPU/RAM, unscheduled taints, node affinity rules, port conflicts).
2. **Scoring**: Assigns a score (0–100) to each surviving node using weighted priority functions (`NodeResourcesBalancedAllocation`, `ImageLocalityPriority`, Pod topology spread).
3. **Binding**: Sends a `Binding` API request to the API server setting `spec.nodeName` to the winning node.

### 10. Why was Docker deprecated as a Kubernetes container runtime?
Docker daemon (`dockerd`) was built as an end-user developer tool, not a raw container runtime. It communicated via REST API rather than the Kubernetes gRPC Container Runtime Interface (CRI), requiring the Kubernetes project to maintain a heavy in-tree translation layer called **`dockershim`** inside `kubelet`. In Kubernetes 1.24, `dockershim` was removed to eliminate redundant translation hops, reduce cluster node memory/CPU bloat, and allow `kubelet` to interface directly with dedicated CRI runtimes (`containerd` or `CRI-O`). Images built using Docker adhere to the OCI specification and run unmodified on modern Kubernetes clusters.
