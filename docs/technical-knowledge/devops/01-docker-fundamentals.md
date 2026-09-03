| Layer Level | Layer Content & Command | Access Mode | Persistence & Lifecycle |
|---|---|---|---|
| **Top Layer** | Container Scratch Space (`/tmp`, modified configs, logs) | **Read-Write** | Ephemeral: destroyed automatically when container is removed. |
| **Layer 3** | `COPY app.jar /app/app.jar` | **Read-Only** | Cached immutable layer shared across all instances running this image. |
| **Layer 2** | `RUN apk add curl` | **Read-Only** | System dependencies cached by layer checksum. |
| **Layer 1** | `FROM eclipse-temurin:21-jre-alpine` | **Read-Only** | Base OS Alpine kernel userspace + JRE binary footprint. |---
id: docker-fundamentals
title: Docker Fundamentals
sidebar_label: Docker Fundamentals
description: Core Docker concepts for beginners — containers vs virtual machines, images, layers, the image registry, container lifecycle, and the Docker architecture.
tags: [docker, containers, images, registry, beginner, fundamentals]
---

import DockerArchitectureDiagram from '@site/src/components/DockerArchitectureDiagram';
import DevOpsManifestSpecDiagram from '@site/src/components/DevOpsManifestSpecDiagram';
import VmDockerK8sComparisonDiagram from '@site/src/components/VmDockerK8sComparisonDiagram';

# Docker Fundamentals

## What is a Container? (Demystified)

> **The Core Mental Model:** A container is **not a mini-virtual machine**. There is no guest operating system kernel or hypervisor. **A container is simply a standard Linux process isolated by the host kernel.**

When you run `docker run -d -p 80:80 nginx`, the Linux host starts a regular process called `nginx`. However, the Docker daemon wraps that process inside three Linux kernel isolation primitives:
1. **Linux Namespaces:** Controls what the process can **SEE** (its own private process tree, network interfaces, and filesystem).
2. **Control Groups (cgroups):** Controls what the process can **CONSUME** (maximum CPU percentage, memory limits, and I/O rates).
3. **OverlayFS Union Filesystem:** Layers read-only image layers under a thin read-write scratch layer.

<DockerArchitectureDiagram initialTab="internals" />

---

## The 3 Foundations of Linux Container Isolation

### 1. Linux Namespaces (Visibility & Scoping)
Namespaces provide process-level virtualization by creating independent partitions for system resources:

| Namespace | Linux Flag | What It Isolates | Container Behavior |
|---|---|---|---|
| **PID** | `CLONE_NEWPID` | Process IDs | The container process sees itself as `PID 1`. It cannot see any other process running on the host or other containers. |
| **NET** | `CLONE_NEWNET` | Network stack | Container gets its own private `lo` loopback (127.0.0.1), IP routing table, and virtual ethernet pair (`veth`) attached to `docker0` bridge. |
| **MNT** | `CLONE_NEWNS` | Filesystem mount points | Roots the container into its private filesystem, hiding `/home`, `/etc`, and `/var` of the host. |
| **IPC** | `CLONE_NEWIPC` | Inter-process communication | Prevents container processes from accessing shared memory segments, semaphores, or message queues of the host. |
| **UTS** | `CLONE_NEWUTS` | Hostname and domain | Allows setting a container-specific hostname (`--hostname web-01`) without modifying the host machine's name. |
| **USER** | `CLONE_NEWUSER` | User and group IDs | Maps container `root` (UID 0) to an unprivileged UID (e.g. UID 10001) on the host, preventing host root escalation. |

### 2. Control Groups (cgroups) (Resource Guardrails)
While namespaces prevent a container from snooping on the host, **cgroups** prevent a "noisy neighbor" container from crashing the host:
- `docker run -m 512m --cpus="1.5"` creates a cgroup directory in `/sys/fs/cgroup/memory/docker/<container_id>`.
- If memory usage exceeds 512MB, the Linux kernel's Out-Of-Memory (OOM) killer terminates that container process without affecting the host or other containers.

### 3. OverlayFS (Layered Union Mount)
Docker images are built as immutable, stacked layers using a union filesystem:
- **LowerDir (Read-Only):** The immutable base OS (e.g., Alpine/Debian) and installed runtime packages.
- **UpperDir (Read/Write):** A thin ephemeral layer created when the container starts. Any new files or edits are written here (Copy-on-Write).
- **MergedDir:** The unified filesystem view that the container process actually sees.

---

## Docker Image Manifest (OCI) & Kubernetes Spec Architecture

<DevOpsManifestSpecDiagram initialTab="docker" />

---

## Containers vs Virtual Machines

<VmDockerK8sComparisonDiagram />| Layer Level | Layer Content & Command | Access Mode | Persistence & Lifecycle |
|---|---|---|---|
| **Top Layer** | Container Scratch Space (`/tmp`, modified configs, logs) | **Read-Write** | Ephemeral: destroyed automatically when container is removed. |
| **Layer 3** | `COPY app.jar /app/app.jar` | **Read-Only** | Cached immutable layer shared across all instances running this image. |
| **Layer 2** | `RUN apk add curl` | **Read-Only** | System dependencies cached by layer checksum. |
| **Layer 1** | `FROM eclipse-temurin:21-jre-alpine` | **Read-Only** | Base OS Alpine kernel userspace + JRE binary footprint. |

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
