---
id: devops-intro
title: Docker & Kubernetes Knowledge Base
sidebar_label: Overview
slug: /devops
description: A complete beginner-to-advanced guide to Docker and Kubernetes — from writing your first Dockerfile to running production-grade microservices on a managed Kubernetes cluster.
tags: [docker, kubernetes, devops, containers, overview]
---

# Docker & Kubernetes Knowledge Base

> Containers changed how we build, ship, and run software. This guide takes you from zero to production — step by step.

---

## The Problem Containers Solve

Before containers, deploying software meant:

```
Developer machine:  Java 17, Spring Boot 3, PostgreSQL 15
Staging server:     Java 11, different config, PostgreSQL 14  ← "works on my machine"
Production server:  Java 17 but missing native libs, different OS

Result: unpredictable behaviour across environments
```

With containers:
```
One image → runs identically on developer laptop, CI, staging, and production
Dependencies bundled inside the image — no "works on my machine"
```

---

## Docker vs Kubernetes — What's the Difference?

| | Docker | Kubernetes |
|---|---|---|
| **What it is** | Container runtime + build tool | Container **orchestration** platform |
| **Scope** | Single machine | Cluster of many machines |
| **Runs** | Individual containers | Groups of containers (Pods) at scale |
| **Use case** | Build images, run locally, dev environments | Run thousands of containers in production |
| **Analogy** | Shipping container standard | Global port managing millions of containers |

> **Learn Docker first** — Kubernetes builds on Docker concepts.

---

## What's Covered

| # | Topic | Level |
|---|---|---|
| 01 | [Docker Fundamentals](/technical-knowledge/devops/docker-fundamentals) | 🟢 Beginner |
| 02 | [Writing Dockerfiles](/technical-knowledge/devops/dockerfile) | 🟢 Beginner |
| 03 | [Docker CLI Commands](/technical-knowledge/devops/docker-commands) | 🟢 Beginner |
| 04 | [Docker Networking](/technical-knowledge/devops/docker-networking) | 🟡 Intermediate |
| 05 | [Docker Volumes & Storage](/technical-knowledge/devops/docker-volumes) | 🟡 Intermediate |
| 06 | [Docker Compose](/technical-knowledge/devops/docker-compose) | 🟡 Intermediate |
| 07 | [Kubernetes Fundamentals](/technical-knowledge/devops/kubernetes-fundamentals) | 🟢 Beginner |
| 08 | [Pods & Containers](/technical-knowledge/devops/kubernetes-pods) | 🟢 Beginner |
| 09 | [Workloads: Deployments, StatefulSets, Jobs](/technical-knowledge/devops/kubernetes-workloads) | 🟡 Intermediate |
| 10 | [Services & Networking](/technical-knowledge/devops/kubernetes-networking) | 🟡 Intermediate |
| 11 | [Storage: PV, PVC, ConfigMaps, Secrets](/technical-knowledge/devops/kubernetes-storage) | 🟡 Intermediate |
| 12 | [Configuration & Resource Management](/technical-knowledge/devops/kubernetes-configuration) | 🟡 Intermediate |
| 13 | [kubectl Command Reference](/technical-knowledge/devops/kubectl-commands) | 🟡 Intermediate |
| 14 | [Helm — Package Manager for Kubernetes](/technical-knowledge/devops/helm) | 🔴 Advanced |
| 15 | [Interview Questions](/technical-knowledge/devops/devops-interview-questions) | 🎯 All Levels |

---

## Learning Path for Beginners

```
Week 1 — Docker Basics
  ├─ Install Docker Desktop
  ├─ Docker Fundamentals → understand images, containers, layers
  ├─ Writing Dockerfiles → build your first image
  └─ Docker CLI Commands → run, inspect, debug

Week 2 — Docker in Practice
  ├─ Docker Networking → connect services
  ├─ Docker Volumes → persist data
  └─ Docker Compose → run multi-service apps locally

Week 3 — Kubernetes Basics
  ├─ Install minikube / kind
  ├─ Kubernetes Fundamentals → architecture, control plane
  ├─ Pods & Containers → the basic unit
  └─ kubectl Commands → interact with the cluster

Week 4 — Kubernetes in Practice
  ├─ Workloads → Deployments, scaling
  ├─ Services & Networking → expose your app
  ├─ Storage → persist data in K8s
  └─ Configuration → ConfigMaps, Secrets

Week 5+ — Production Topics
  ├─ Kubernetes Security → RBAC, policies
  ├─ Helm → package and deploy applications
  └─ Interview Questions → test your knowledge
```

---

## Quick Concept Map

```
DOCKER
  Image          ← Immutable blueprint (layers)
  Container      ← Running instance of an image
  Dockerfile     ← Recipe to build an image
  Registry       ← Store for images (Docker Hub, ECR, GCR)
  Volume         ← Persistent storage for containers
  Network        ← Communication between containers
  Compose        ← Multi-container apps on one machine

KUBERNETES
  Cluster        ← Group of machines running K8s
  Node           ← A single machine (VM or physical) in the cluster
  Pod            ← Smallest deployable unit (1+ containers)
  Deployment     ← Manages replicas of a Pod, handles rolling updates
  Service        ← Stable network endpoint to reach Pods
  Ingress        ← HTTP routing rules into the cluster
  ConfigMap      ← Non-secret configuration
  Secret         ← Sensitive configuration (passwords, keys)
  PersistentVolume ← Storage provisioned in the cluster
  Namespace      ← Virtual cluster — isolates resources
  Helm Chart     ← Package of Kubernetes YAML templates
```

---

## Local Setup

### Install Docker Desktop
```bash
# macOS — via Homebrew
brew install --cask docker

# Windows — via winget
winget install Docker.DockerDesktop

# Ubuntu / Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER  # Add yourself to docker group
newgrp docker                  # Apply group change

# Verify
docker version
docker run hello-world
```

### Install kubectl
```bash
# macOS
brew install kubectl

# Linux
curl -LO "https://dl.k8s.io/release/$(curl -sL https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl && sudo mv kubectl /usr/local/bin/

# Verify
kubectl version --client
```

### Install minikube (local Kubernetes)
```bash
# macOS
brew install minikube

# Linux
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Start a local cluster
minikube start --driver=docker --cpus=4 --memory=4g

# Verify
kubectl get nodes
```

### Alternative: kind (Kubernetes IN Docker)
```bash
# macOS/Linux
brew install kind

# Create cluster
kind create cluster --name my-cluster

# Load local image into kind (no registry needed)
kind load docker-image myapp:latest --name my-cluster
```

---

:::tip Start here if you're new
Install Docker Desktop, then work through the docs in order starting with [Docker Fundamentals](/technical-knowledge/devops/docker-fundamentals). Every topic includes runnable examples — type them out rather than copy-pasting for better retention.
:::

:::info Spring Boot users
All code examples in this guide use Java / Spring Boot where application code is shown. The Docker and Kubernetes concepts apply to any language.
:::
