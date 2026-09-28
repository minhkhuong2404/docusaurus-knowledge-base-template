---
id: cicd-github-actions
title: CI/CD Fundamentals & GitHub Actions Pipelines
sidebar_label: 22. CI/CD & GitHub Actions
description: A complete guide to Continuous Integration and Continuous Deployment (CI/CD) — covering core concepts, the automated pipeline lifecycle, GitHub Actions workflows, triggers, runner architecture, Docker build & security scanning, and production deployment patterns.
tags: [devops, cicd, github-actions, automation, docker, kubernetes, continuous-integration]
---

import CiCdPipelineDiagram from '@site/src/components/CiCdPipelineDiagram';

# CI/CD Fundamentals & GitHub Actions Pipelines

> In modern software engineering, manual deployments and local-only testing are fatal bottlenecks. **Continuous Integration and Continuous Deployment (CI/CD)** automates the path from code commit to production release, ensuring every change is tested, packaged, and verified reliably.

This guide provides a comprehensive overview of CI/CD principles and practical GitHub Actions pipeline construction based on [Why Every Developer Needs to Understand CI/CD](https://www.youtube.com/watch?v=omB2JkC4QfA).

---

## Why Every Developer Needs CI/CD

Before CI/CD, teams relied on manual steps:
1. Developers wrote code locally and ran tests manually (*"It worked on my laptop!"*).
2. Code was merged into `main` once a month, causing huge "merge hell" conflicts.
3. Operations engineers manually copied JAR files or SSH'd into production servers.
4. If a bug was introduced, diagnosis took hours and rollbacks required manual server surgery.

**With CI/CD:**
Every single `git push` or Pull Request triggers an automated, isolated cloud pipeline that builds, tests, lints, scans, and packages the software in minutes.

| Hierarchy Level | YAML Construct | Runner & Isolation Scope | Execution Dynamics & Ordering |
|---|---|---|---|
| **Workflow** | `name:` in `.github/workflows/*.yml` | Repository level | Triggered by events (`push`, `pull_request`, `schedule`, `workflow_dispatch`). |
| **Job** | `jobs.<job_id>` (e.g. `test`, `build`) | Fresh ephemeral VM / Container (`ubuntu-latest`) | Jobs run **in parallel** by default; sequential dependencies enforced via `needs: [test]`. |
| **Step** | `steps:` list within each job | Shared filesystem on the same VM runner | Executes sequentially. Steps run action plugins (`uses: actions/checkout@v4`) or shell commands (`run: mvn test`). |

### 1. Events & Triggers (`on:`)
Workflows execute in response to repository events:

```yaml
on:
  push:
    branches: [ main, develop ]
    paths-ignore:
      - '**.md'
      - 'docs/**'
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * *' # Nightly security audit at 2 AM
  workflow_dispatch:      # Allows manual trigger button in GitHub UI
```

### 2. Runners
Runners are virtual machines (or container environments) hosted by GitHub or self-hosted inside your cloud VPC (AWS/GCP):
- `ubuntu-latest` (fastest startup, industry default)
- `windows-latest`
- `macos-latest` (essential for iOS/macOS builds)

### 3. Dependency Caching
Downloading dependencies (Maven JARs, `node_modules`, Gradle artifacts) on every run wastes minutes. GitHub Actions provides built-in caching:

```yaml
- name: Set up Java & Cache Maven
  uses: actions/setup-java@v4
  with:
    java-version: '21'
    distribution: 'temurin'
    cache: 'maven' # Automatically caches ~/.m2 repository
```

---

## Production GitHub Actions YAML Walkthrough

Here is a complete, enterprise-grade `.github/workflows/ci-cd.yml` workflow combining testing, multi-stage Docker builds, Trivy CVE scanning, and deployment:

```yaml
name: Enterprise CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # ─────────────────────────────────────────────────────────────
  # STAGE 1: Fast Automated Test & Linting
  # ─────────────────────────────────────────────────────────────
  test-and-verify:
    name: 🧪 Run Unit & Integration Tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: maven

      - name: Compile and Test
        run: mvn clean verify --batch-mode

      - name: Publish Test Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: surefire-reports
          path: target/surefire-reports/

  # ─────────────────────────────────────────────────────────────
  # STAGE 2: Container Packaging & Security Scanning
  # ─────────────────────────────────────────────────────────────
  build-and-scan:
    name: 🐳 Build Docker Image & Scan CVEs
    needs: test-and-verify
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: actions/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and Load Local Image
        uses: docker/build-push-action@v5
        with:
          context: .
          load: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

      - name: Run Trivy Vulnerability Scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          format: 'table'
          exit-code: '1' # Fails build if CRITICAL vulnerabilities exist
          ignore-unfixed: true
          severity: 'CRITICAL,HIGH'

      - name: Push Verified Image to Registry
        if: github.ref == 'refs/heads/main'
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest

  # ─────────────────────────────────────────────────────────────
  # STAGE 3: Deploy to Kubernetes Staging
  # ─────────────────────────────────────────────────────────────
  deploy-staging:
    name: 🚀 Deploy to Staging Cluster
    needs: build-and-scan
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Trigger GitOps ArgoCD Sync
        run: |
          echo "Triggering ArgoCD rollout for commit ${{ github.sha }} in staging"
```

---

## Senior CI/CD Best Practices

1. **Fail Fast (Shift Left):** Place the quickest, cheapest checks first (linters, unit tests) before expensive integration tests or Docker builds.
2. **Immutable Artifact Tags:** Never deploy `:latest` blindly in production. Always tag container images with the exact Git commit SHA (`:${{ github.sha }}`) for deterministic tracking and instant rollback.
3. **Secret Security:** Never hardcode API keys or database passwords in YAML files. Use GitHub Encrypted Secrets (`${{ secrets.API_KEY }}`) and OpenID Connect (OIDC) for passwordless cloud authentication (AWS IAM Role / GCP Workload Identity).
4. **Branch Protection Rules:** Require CI workflow status checks to pass before any PR can be merged into `main`.
5. **Clean Ephemeral Runners:** Ensure builds do not rely on local environment state or pre-existing files on disk.

---

## Interview Questions & Answers

### Q1: What is the difference between Continuous Delivery and Continuous Deployment?
**Answer:**
> *"Continuous Delivery automates every stage up through staging and produces a production-ready artifact, but the final promotion to production requires human authorization (a manual gate). Continuous Deployment goes one step further: every commit that passes the automated pipeline is deployed directly into production without manual intervention."*

### Q2: How do you prevent slow CI pipelines from degrading team velocity?
**Answer:**
> *"To keep CI execution under 5–10 minutes: (1) enable dependency caching (`actions/cache`), (2) split tests into parallel runner jobs using a matrix strategy, (3) run unit tests before building container images, (4) use multi-stage Docker builds with BuildKit layer caching, and (5) ignore non-code file changes (e.g. documentation paths) in workflow triggers."*
