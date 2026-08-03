---
id: kubernetes-operators
title: Operators & CRDs
sidebar_label: Operators & CRDs
description: Deep dive into Kubernetes Custom Resource Definitions (CRDs) and the Operator Pattern for managing complex stateful applications.
tags: [kubernetes, crd, operators, controllers, intermediate]
---

import GitOpsArgoCdPipelineDiagram from '@site/src/components/GitOpsArgoCdPipelineDiagram';

# Operators & CRDs

The fundamental design pattern of Kubernetes is the **Controller Pattern**: a continuous reconciliation loop that observes the *actual* state of a system, compares it to the *desired* state, and takes actions to make them match.

Kubernetes natively understands Pods, Deployments, and Services. But what if you need Kubernetes to understand a PostgreSQL cluster, a Prometheus instance, or a Kafka broker? This is where **Custom Resource Definitions (CRDs)** and **Operators** come in.

---

## 1. Custom Resource Definitions (CRDs)

<GitOpsArgoCdPipelineDiagram initialTab="operator" />

A CRD allows you to extend the Kubernetes API with your own custom objects.

```yaml
# 1. You register a new API type with K8s
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: postgresclusters.db.example.com
spec:
  group: db.example.com
  names:
    kind: PostgresCluster
    plural: postgresclusters
  scope: Namespaced
  versions:
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                version:
                  type: string
                nodes:
                  type: integer
```

Once applied, the K8s API server now understands `PostgresCluster` resources. Developers can natively use `kubectl`:

```yaml
# 2. You create an instance of your custom resource
apiVersion: db.example.com/v1
kind: PostgresCluster
metadata:
  name: billing-db
spec:
  version: "15.0"
  nodes: 3
```

```bash
kubectl apply -f billing-db.yaml
kubectl get postgresclusters
```

**The Catch:** Kubernetes now stores your `PostgresCluster` in etcd, but it has *no idea what to do with it*. Creating the YAML does absolutely nothing on its own. It needs a Controller.

---

## 2. The Custom Controller

A **Custom Controller** is a piece of code (usually written in Go, using the `client-go` library or Kubebuilder) that runs in the cluster. It watches the API server for changes to your CRD, and contains the logic to action them.

```
1. Developer applies PostgresCluster (nodes: 3)
2. API Server saves to etcd
3. Database Controller detects the new object
4. Database Controller creates:
   ├─ StatefulSet (with 3 replicas)
   ├─ Headless Service (for primary/replica networking)
   └─ Secret (for auto-generated passwords)
5. Database Controller reports Status back to API Server
```

---

## 3. The Operator Pattern

An **Operator** is simply a Custom Controller that encodes **domain-specific human operational knowledge** into software.

A basic controller might just create a StatefulSet. A true *Operator* knows how to:
- Take backups of the database to S3 automatically.
- Safely upgrade PostgreSQL from `14.0` to `15.0` without downtime.
- Detect a split-brain scenario and fail over a replica to primary.
- Automatically scale storage PVCs when disk usage hits 80%.

### Example: Operator Hub in Production

Instead of deploying a database manually via a complex Helm chart, modern DevOps utilizes Operators.

* **Prometheus Operator:** You define a `ServiceMonitor` CRD, and the Operator magically reconfigures the Prometheus scraping targets without restarting Prometheus.
* **Strimzi Kafka Operator:** You define a `Kafka` CRD, and the Operator handles Zookeeper/KRaft quorums, topic creation, and broker rolling restarts.
* **Cert-Manager:** You define a `Certificate` CRD, and the Operator talks to Let's Encrypt, performs the ACME challenge, and saves the resulting cert as a K8s `Secret`.

---

## 4. How Operators Work Under the Hood

Operators use the **Informer** and **Workqueue** mechanics from the K8s SDK:

1. **Informer / Watcher:** Maintains a persistent HTTP streaming connection to the API server. "Tell me when any `PostgresCluster` is added, modified, or deleted."
2. **Cache:** Keeps a local, synchronized copy of the object state to avoid flooding the API server with `GET` requests.
3. **Reconcile Loop:** When an event occurs, the object key is placed in a rate-limited Workqueue. A worker thread pops the key and runs the `Reconcile()` function.
4. **Idempotency:** The `Reconcile()` function is idempotent. It doesn't matter if it runs once or 100 times; it strictly ensures `Actual State == Desired State`.

### The Reconcile Pattern (Pseudocode)
```go
func Reconcile(req Request) (Result, error) {
    // 1. Fetch the CRD instance
    cluster := getPostgresCluster(req.Name)
    
    // 2. Check if StatefulSet exists
    sts := getStatefulSet(cluster.Name)
    if notExists(sts) {
        createStatefulSet(cluster)
        return Requeue()
    }
    
    // 3. Ensure replicas match
    if sts.Replicas != cluster.Spec.Nodes {
        sts.Replicas = cluster.Spec.Nodes
        updateStatefulSet(sts)
    }
    
    // 4. Update CRD Status
    cluster.Status.ReadyNodes = sts.ReadyReplicas
    updateStatus(cluster)
    
    return Success()
}
```

---

## 5. Operators vs Helm

Both package and deploy applications, but they solve different problems.

| Feature | Helm | Operator |
|---|---|---|
| **Lifecycle** | "Day 1" (Install/Upgrade) | "Day 2" (Auto-healing, backups, failover) |
| **Execution** | Runs client-side (your laptop or CI server) | Runs server-side (constantly active inside cluster) |
| **State** | Fire-and-forget. Doesn't know if the app broke later. | Continuous reconciliation. Fixes drift automatically. |
| **Complexity to Write** | Low (Go templates) | High (Go programming, K8s SDK) |

**Best Practice:** Combine them! Deploy the Operator itself using a Helm chart, then let the Operator deploy your databases via CRDs.

---

## Interview Questions

### Q: What separates an Operator from a basic controller?
**A:** An Operator encodes domain operational knowledge such as backup, failover, and safe upgrade workflows.

### Q: Why must reconcile loops be idempotent?
**A:** Controllers receive repeated events and retries, so repeated execution must converge safely to the same desired state.

### Q: How do CRD status fields improve platform operations?
**A:** They expose system health and progress to users and automation without requiring internal controller access.

### Q: What are common failure modes in custom operators?
**A:** Infinite reconcile loops, non-idempotent side effects, and weak backoff causing API server pressure.

### Q: When should a team build an operator instead of a Helm chart?
**A:** When day-two automation and lifecycle intelligence are required beyond templated deployment.

### Q: What testing strategy is critical for operator maturity?
**A:** End-to-end reconciliation tests under failure scenarios, including upgrade, restore, and partial outage behavior.
