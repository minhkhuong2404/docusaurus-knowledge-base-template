---
id: docker-fundamentals
title: Docker Fundamentals
sidebar_label: Docker Fundamentals
description: Core Docker concepts for beginners — containers vs virtual machines, images, layers, the image registry, container lifecycle, and the Docker architecture.
tags: [docker, containers, images, registry, beginner, fundamentals]
---

# Docker Fundamentals

## What is a Container?

A container is a **lightweight, isolated process** that packages an application with everything it needs to run — code, runtime, libraries, and config — so it behaves identically everywhere.

```
Without containers:                 With containers:
  Your App                            ┌─────────────────┐
  ↓ depends on                        │  Your App        │
  Java 17                             │  Java 17         │ ← All bundled
  Spring Boot 3.x                     │  Spring Boot 3.x │   inside image
  libssl 1.1                          │  libssl 1.1      │
  ↓ must match                        └─────────────────┘
  The host OS                         Runs on any host
  ← often it doesn't
```

---

## Containers vs Virtual Machines

```
Virtual Machine                     Container
┌──────────────────────┐            ┌──────────────────────┐
│  App A               │            │  App A   │  App B     │
├──────────────────────┤            ├──────────┼────────────┤
│  Guest OS (Linux)    │            │  Libs    │  Libs      │
├──────────────────────┤            ├──────────┴────────────┤
│  Hypervisor          │            │  Container Runtime    │
├──────────────────────┤            │  (Docker Engine)      │
│  Host OS             │            ├───────────────────────┤
├──────────────────────┤            │  Host OS (Linux)      │
│  Hardware            │            ├───────────────────────┤
└──────────────────────┘            │  Hardware             │
                                    └───────────────────────┘
Size:   GBs                         Size:   MBs
Boot:   Minutes                     Boot:   Milliseconds
Isolation: Full OS boundary         Isolation: Linux namespaces + cgroups
```

| Feature | VM | Container |
|---|---|---|
| OS | Full guest OS | Shares host kernel |
| Boot time | 1–2 minutes | < 1 second |
| Image size | GB range | MB range |
| Isolation | Strongest (hypervisor) | Strong (namespaces) |
| Performance overhead | Higher | Near-native |
| Use case | Different OS needs, strong isolation | Microservices, fast scaling |

> Containers use **Linux namespaces** (isolate processes, filesystem, network) and **cgroups** (limit CPU, memory) — not a separate OS kernel.

---

## Docker Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Docker Client (CLI)                                      │
│  docker build · docker run · docker push                  │
└────────────────────┬─────────────────────────────────────┘
                     │ REST API (unix socket / TCP)
┌────────────────────▼─────────────────────────────────────┐
│  Docker Daemon (dockerd)                                   │
│  ┌────────────┐  ┌─────────────┐  ┌────────────────────┐  │
│  │  Images    │  │  Containers │  │  Networks/Volumes  │  │
│  └────────────┘  └─────────────┘  └────────────────────┘  │
│           Uses: containerd → runc (OCI runtime)            │
└──────────────────────────────────────────────────────────┘
                     │ pull/push
┌────────────────────▼─────────────────────────────────────┐
│  Registry (Docker Hub / ECR / GCR / Nexus)                │
└──────────────────────────────────────────────────────────┘
```

### Components
| Component | Role |
|---|---|
| **Docker CLI** | Command-line tool you type commands into |
| **Docker Daemon** | Background service that manages containers |
| **containerd** | Container lifecycle manager (lower level than Docker) |
| **runc** | OCI-compliant container runtime (actually runs processes) |
| **Registry** | Remote store for Docker images |

---

## Images and Layers

An image is built from **read-only layers** stacked on top of each other.

```dockerfile
FROM eclipse-temurin:21-jre-alpine   ← Layer 1: Base OS + JRE
RUN apk add curl                      ← Layer 2: Add curl package
COPY app.jar /app/app.jar             ← Layer 3: Your application JAR
```

```
Layer 3: app.jar         ← changes most often (yours)
Layer 2: curl installed  ← changes occasionally
Layer 1: JRE Alpine      ← changes rarely (base)
```

### Why Layers Matter
- **Caching:** If Layer 1 and 2 haven't changed, Docker reuses them from cache — only Layer 3 is rebuilt. Dramatically speeds up builds.
- **Sharing:** Multiple images sharing the same base layer only store it once on disk.
- **Immutability:** Layers are read-only. Running a container adds a thin **writable layer** on top — the image itself is never modified.

```
Running container:
  ┌─────────────────────────────┐
  │  Writable layer (container) │ ← temporary, lost when container removed
  ├─────────────────────────────┤
  │  Layer 3: app.jar           │ read-only
  ├─────────────────────────────┤
  │  Layer 2: curl              │ read-only
  ├─────────────────────────────┤
  │  Layer 1: JRE Alpine        │ read-only
  └─────────────────────────────┘
```

---

## Image Naming and Tags

```
docker.io / library / ubuntu : 24.04
    ↑           ↑        ↑       ↑
Registry  Namespace  Image   Tag/version

# Examples:
ubuntu                          # docker.io/library/ubuntu:latest
nginx:1.25                      # docker.io/library/nginx:1.25
mycompany/myapp:1.0.0           # docker.io/mycompany/myapp:1.0.0
123456789.dkr.ecr.us-east-1.amazonaws.com/myapp:v2  # AWS ECR
```

### Tag Best Practices
| Tag | Use | Risk |
|---|---|---|
| `latest` | Development only | Unpredictable — changes silently |
| `1.0.0` (semver) | Production ✅ | Immutable reference |
| `sha256:abc123...` | Pinned exact version ✅ | Most explicit, never changes |

```bash
# Always tag with version + latest for production images
docker build -t myapp:1.2.3 -t myapp:latest .

# Pull by digest (guaranteed immutable)
docker pull ubuntu@sha256:45b23dee08af5e43a7fea6c4cf9c25ccf269ee113168c19722f87876677c5cb2
```

---

## Container Lifecycle

```
           docker create
Image  ──────────────────→  Created
                               │
              docker start     │
                               ↓
                            Running ←──── docker restart
                               │
       docker pause            ↓
                            Paused
                               │
       docker unpause          ↓
                            Running
                               │
       docker stop (SIGTERM)   │
       docker kill  (SIGKILL)  ↓
                            Stopped/Exited
                               │
       docker rm               ↓
                            Removed (deleted)

Shortcut: docker run = docker create + docker start
```

---

## Registries

### Public Registries
| Registry | URL | Notes |
|---|---|---|
| Docker Hub | `hub.docker.com` | Default, largest public registry |
| GitHub Container Registry | `ghcr.io` | Integrated with GitHub Actions |
| Google Container Registry | `gcr.io` | Google Cloud |
| Amazon ECR Public | `public.ecr.aws` | AWS public images |

### Private Registries
| Registry | Notes |
|---|---|
| Amazon ECR | Private, per AWS account |
| Google Artifact Registry | Private, replaces GCR |
| Azure Container Registry | Private, Azure |
| Harbor | Self-hosted, open source |
| Nexus Repository | Self-hosted, enterprise |

```bash
# Login to Docker Hub
docker login

# Login to AWS ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  123456789.dkr.ecr.us-east-1.amazonaws.com

# Tag for ECR
docker tag myapp:1.0.0 123456789.dkr.ecr.us-east-1.amazonaws.com/myapp:1.0.0

# Push
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/myapp:1.0.0
```

---

## Key Concepts Summary

| Term | Definition |
|---|---|
| **Image** | Immutable, layered snapshot of a filesystem + config. Blueprint. |
| **Container** | Running (or stopped) instance of an image. Has writable layer. |
| **Dockerfile** | Text file with instructions to build an image. |
| **Registry** | Remote repository for storing and distributing images. |
| **Layer** | Read-only filesystem diff. Multiple layers make up an image. |
| **Tag** | Human-readable label pointing to a specific image version. |
| **Digest** | Content-addressable SHA256 hash — uniquely identifies an image. |
| **Volume** | Persistent storage that survives container restarts. |
| **Network** | Virtual network connecting containers. |
| **Docker Compose** | Tool for defining multi-container apps in YAML. |

---

## Interview Questions

1. What is a container and how does it differ from a virtual machine?
2. What are Docker image layers and why do they matter for build performance?
3. What is the difference between an image and a container?
4. Why is using the `latest` tag bad practice in production?
5. What are Linux namespaces and cgroups? How do they relate to containers?
6. What happens to data in a container's writable layer when the container is removed?
7. What is a container registry and name three examples.
8. Explain the Docker client-daemon architecture.
