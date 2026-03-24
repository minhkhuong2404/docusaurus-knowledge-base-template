---
sidebar_position: 8
title: "Chapter 7: Build"
---

# Chapter 7: Build

**Part II — Implementation**

> Good build pipelines are the foundation of independent deployability. This chapter covers how to structure source repositories and CI pipelines for microservices.

---

## The Goal: Independent Deployability Starts at Build Time

Independent deployability — the core promise of microservices — must be supported from the first step: the build. If building one service requires building or checking out all other services, you've already undermined the architecture.

---

## Continuous Integration (CI) Principles

CI means integrating and verifying code changes frequently — ideally multiple times per day. The three principles:

1. **Integrate frequently** — small, frequent merges to main rather than long-lived feature branches
2. **Fast feedback** — a build that takes 45 minutes is not a good feedback loop
3. **Fix broken builds immediately** — a broken build blocks everyone; it's the team's top priority

### What a CI Pipeline Should Do
1. Compile the code
2. Run unit tests
3. Run integration tests
4. Build the artifact (JAR, Docker image)
5. Publish the artifact to a registry
6. (Optionally) Deploy to a dev/staging environment

---

## Source Code Repository Models

A key architectural decision: how do you organize your code across repositories?

### One Repository per Microservice (Multirepo / Polyrepo)

Each service has its own Git repository.

```
git/
├── order-service/
├── inventory-service/
├── payment-service/
└── customer-service/
```

**Advantages:**
- Clear ownership — one team, one repo
- Independent CI pipelines per service
- Repository permissions align with team ownership
- Smaller repos = faster checkouts and builds

**Disadvantages:**
- Cross-service refactoring requires multiple PRs across repos
- Managing shared libraries requires versioned artifacts
- "Who broke what" across services harder to correlate

### Monorepo (All Services in One Repository)

All services in a single repository.

```
mono-repo/
├── services/
│   ├── order-service/
│   ├── inventory-service/
│   └── payment-service/
├── libs/
│   ├── common-dto/
│   └── shared-security/
└── build.gradle (root)
```

**Advantages:**
- Atomic cross-service changes in a single commit
- Easier to keep shared code in sync
- Single source of truth for the entire codebase

**Disadvantages:**
- Build tooling must be smart enough to only rebuild affected services
- Repository grows large; CI can become slow without optimization
- Ownership boundaries can blur

**Newman's recommendation:** Start with one repo per service. The independent ownership model supports team autonomy. Use a monorepo only if tooling (Gradle, Bazel, Nx) can handle selective builds efficiently.

---

## Artifact Management

After building, the artifact must be stored somewhere. The artifact is the **deployable unit** — the thing that gets promoted through environments.

### Types of Artifacts

| Language/Platform | Artifact Type |
|---|---|
| Java / Spring | JAR / WAR file |
| Containerized | Docker image |
| Serverless | ZIP package |

### Build Once, Deploy Everywhere

A key principle: **build the artifact once, then promote it through environments**. Never rebuild from source for staging or production — the artifact that passed tests in CI is exactly what goes to production.

```
Source ──► Build ──► [ Artifact Registry ] ──► Dev ──► Staging ──► Prod
              (one build)         (same artifact promoted)
```

### Container Registries
For Docker images, use a registry like:
- Docker Hub
- AWS ECR
- Google Container Registry
- JFrog Artifactory

Tag images with the git commit SHA for traceability:
```bash
docker build -t order-service:$(git rev-parse --short HEAD) .
docker push registry.example.com/order-service:abc1234
```

---

## CI Pipelines per Service

Each microservice should have its own independent CI pipeline. Changes to one service should not trigger builds for other services.

### GitHub Actions Example (Spring Boot Service)
```yaml
name: Order Service CI

on:
  push:
    paths:
      - 'order-service/**'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
        with: { java-version: '21' }
      - run: ./gradlew :order-service:build
      - run: ./gradlew :order-service:test
      - name: Build Docker image
        run: docker build -t order-service:${{ github.sha }} ./order-service
      - name: Push to registry
        run: docker push registry.example.com/order-service:${{ github.sha }}
```

---

## Managing Shared Code

Libraries shared across services (e.g., common DTOs, shared security config) need careful management.

### Options

**1. Shared library as a versioned Maven/Gradle artifact**
```xml
<dependency>
    <groupId>com.example</groupId>
    <artifactId>common-events</artifactId>
    <version>1.2.0</version>
</dependency>
```
Each service explicitly opts in to a version. Safe but requires discipline to update.

**2. Client library generated from service contract**
The service that owns an API publishes a client library (e.g., generated from OpenAPI or proto). Consumers add it as a dependency.

:::warning
Be careful with shared libraries. A library that couples multiple services (e.g., a shared domain model) creates the same problems as a shared database. Keep shared libraries thin: common utilities, not business logic.
:::

---

## Trunk-Based Development vs. Feature Branches

| Approach | Description | Best For |
|---|---|---|
| **Trunk-Based** | All developers commit to `main` daily; use feature flags for incomplete features | High-velocity teams, strong CI discipline |
| **Short-lived Feature Branches** | Branches live 1–2 days max, then merged | Most teams — balance of isolation and integration |
| **Long-lived Feature Branches** | Branches live weeks — classic Gitflow | Avoid — leads to painful merges and delayed integration |

The book recommends trunk-based or very short-lived branches. Long-lived branches defeat the purpose of continuous integration.

---

## Summary

| Concept | One-Line Summary |
|---------|-----------------|
| CI | Integrate frequently, get fast feedback, fix broken builds immediately |
| Multirepo | One repo per service — supports team ownership and independent CI |
| Monorepo | One repo for all — good for atomic cross-service changes; needs smart build tooling |
| Build once | Create one artifact; promote it through environments unchanged |
| Trunk-based development | Commit to main frequently; use feature flags for incomplete work |
| Shared libraries | Keep thin; never put business logic in shared libs |
