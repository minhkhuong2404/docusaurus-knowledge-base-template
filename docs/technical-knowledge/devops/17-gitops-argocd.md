---
id: gitops-argocd
title: GitOps & continuous Delivery
sidebar_label: GitOps (ArgoCD)
description: Introduction to Push vs Pull deployments, GitOps principles, and an architecture overview of ArgoCD and Flux.
tags: [kubernetes, gitops, argocd, ci-cd, intermediate]
---

# GitOps & Continuous Delivery

GitOps is an operational framework that takes DevOps best practices used for application development (version control, collaboration, compliance, and CI/CD) and applies them to infrastructure automation.

---

## 1. Push-based vs Pull-based Deployments

### Push-Based CD (The Old Way)

In a traditional CI/CD pipeline (e.g., Jenkins, GitLab CI, GitHub Actions), the CI server builds the container, authenticates with the Kubernetes cluster, and **pushes** the changes.

```
Developer → git push → GitHub Actions (CI)
                             ↓
             [docker build & push to registry]
                             ↓
             [kubectl apply -f deployment.yaml] → Kubernetes
```

**The disadvantages:**
1. **Security Risk:** The CI server holds administrative credentials (kubeconfig) to your production cluster cluster. If CI is compromised, the cluster is compromised.
2. **Configuration Drift:** If a developer manually runs `kubectl edit deployment` in production, K8s state drifts from Git. The CI server has no idea this happened.

### Pull-Based CD (GitOps / The New Way)

In GitOps, an agent runs **inside** the Kubernetes cluster. It continuously polls the Git repository. When it sees a change in Git, the agent **pulls** the changes and applies them inside the cluster.

```
Developer → git push → GitHub 
                             ↑
                [Agent polls Git periodically]
                             ↑
Kubernetes Cluster [ GitOps Agent (ArgoCD/Flux) ]
```

**The advantages:**
1. **High Security:** The cluster securely reaches OUT to Git. Git/CI never needs inbound access or credentials to the cluster. 
2. **Auto-Reconciliation:** If someone manually runs `kubectl edit`, the GitOps agent immediately detects the drift and overwrites the manual changes with the true state in Git.
3. **Disaster Recovery:** If the cluster burns down, spinning up a new one takes minutes. Just install the GitOps agent, point it at the repo, and the entire infrastructure rebuilds itself seamlessly.

---

## 2. The Core Principles of GitOps

1. **Declarative:** The entire system must be described declaratively (YAML/JSON). No imperative scripts (`kubectl run`).
2. **Version Controlled:** Git is the single, immutable source of truth.
3. **Automatically Applied:** Approved changes in Git are automatically applied to the system by software agents.
4. **Continuously Reconciled:** Software agents continuously ensure the actual system state matches the desired state in Git, auto-healing any drift.

---

## 3. ArgoCD

[ArgoCD](https://argoproj.github.io/cd/) is the industry standard GitOps continuous delivery tool for Kubernetes.

### Architecture

ArgoCD is installed as a set of controllers inside your cluster:

* **API Server:** A gRPC/REST server exposing the ArgoCD web UI and CLI.
* **Repository Server:** Maintains a local cache of the Git repository describing your manifests (plain YAML, Helm, Kustomize, Jsonnet).
* **Application Controller:** The reconciliation engine. It compares the live state of Kubernetes against the desired state defined in Git.

### Manifest Structuring: Separation of Concerns

A best practice in GitOps is to separate your application source code from your Kubernetes manifests.

1. **App Repo** (`frontend-app`): Contains Java/Node.js code. 
   - *CI Pipeline:* Runs tests, builds Docker image `frontend:v1.2.3`, pushes to ECR. The final CI step pushes a commit to the Manifest Repo updating the image tag.
2. **Manifest Repo** (`frontend-infra`): Contains Helm charts or raw YAML.
   - *ArgoCD Agent:* Watches this repo. Sees the image tag changed to `v1.2.3`. Syncs the cluster.

### ArgoCD `Application` CRD

ArgoCD manages deployments via its own Custom Resource, the `Application`.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: billing-api
  namespace: argocd
spec:
  project: default
  source:
    repoURL: 'https://github.com/myorg/infrastructure-manifests.git'
    path: apps/billing    # Directory containing the YAML
    targetRevision: main  # Git branch
  destination:
    server: 'https://kubernetes.default.svc'  # Deploy to the local cluster
    namespace: production
  syncPolicy:
    automated:
      prune: true         # Delete resources if they are removed from Git
      selfHeal: true      # Automatically revert manual kubectl edits
```

### Sync Phases & Waves

ArgoCD allows controlling the order of operations explicitly using annotations.

```yaml
# Inside your deployment.yaml
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "1"  # Deploy DB first
```
```yaml
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "5"  # Deploy API only after DB wave is healthy
```

This prevents the API pods from infinitely crash-looping while waiting for a database statefulset to provision.

---

## 4. Alternative: FluxCD

[Flux](https://fluxcd.io/) is the primary alternative to ArgoCD. 

**ArgoCD vs Flux:**
* **ArgoCD:** Famously has a beautiful, intuitive UI that provides a visual representation of K8s resource trees and live logs. Extremely popular in enterprise.
* **Flux:** Designed to be exclusively CLI and Git-driven (no built-in web UI). Operates as a set of highly modular controllers (Source Controller, Kustomize Controller, Helm Controller). Very beloved by platform purists.
