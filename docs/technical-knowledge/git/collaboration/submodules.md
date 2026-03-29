---
id: submodules
title: git submodule — Embedding Repositories
sidebar_label: Submodules
description: A **submodule** is a Git repository embedded inside another Git repository.
  The parent repository stores a reference to a specific commit of the submodule —.
tags:
- technical-knowledge
- git
- collaboration
- submodules
---
# `git submodule` — Embedding Repositories

## What is a Submodule?

A **submodule** is a Git repository embedded inside another Git repository. The parent repository stores a reference to a specific commit of the submodule — not the submodule's files directly. This lets you include shared libraries, infrastructure configs, or third-party code while tracking them independently.

---

## Adding a Submodule

```bash
git submodule add git@github.com:your-org/shared-proto.git libs/shared-proto
git submodule add git@github.com:your-org/infra-config.git infra/config

# Commit the addition
git commit -m "chore: add shared-proto and infra-config as submodules"
```

This creates:
- A `libs/shared-proto/` directory (the submodule content)
- A `.gitmodules` file tracking all submodules:

```ini
[submodule "libs/shared-proto"]
    path = libs/shared-proto
    url = git@github.com:your-org/shared-proto.git
    branch = main
```

---

## Cloning a Repository with Submodules

```bash
# Clone and initialise all submodules in one step (recommended)
git clone --recurse-submodules git@github.com:your-org/transaction-service.git

# If you already cloned without submodules
git submodule update --init --recursive
```

---

## Updating Submodules

### Update all submodules to their tracked commit

```bash
git submodule update --recursive
```

### Pull latest changes from submodule's remote branch

```bash
# Update all submodules to the latest commit on their tracked branch
git submodule update --remote --recursive

# Update a single submodule
git submodule update --remote libs/shared-proto
```

### After pulling the parent repo (colleagues may have updated submodule refs)

```bash
git pull
git submodule update --init --recursive
```

---

## Working Inside a Submodule

```bash
# Enter the submodule
cd libs/shared-proto

# It is a fully independent Git repository
git log --oneline
git switch -c fix/update-proto
# Make changes, commit, push...
git push origin fix/update-proto

# Return to parent
cd ../..

# The parent repo now shows the submodule as "modified"
git status
# modified: libs/shared-proto (new commits)

# Stage and commit the updated submodule reference
git add libs/shared-proto
git commit -m "chore: bump shared-proto to v2.1.0"
```

---

## Removing a Submodule

```bash
# Step 1: Remove from .gitmodules
git submodule deinit -f libs/shared-proto

# Step 2: Remove from .git/modules cache
rm -rf .git/modules/libs/shared-proto

# Step 3: Remove the tracked directory
git rm -f libs/shared-proto

# Step 4: Commit
git commit -m "chore: remove shared-proto submodule"
```

---

## Useful Commands Summary

| Command | Meaning |
|---|---|
| `git submodule add <url> <path>` | Add a new submodule |
| `git submodule update --init --recursive` | Initialise and fetch all submodules |
| `git submodule update --remote` | Pull latest from submodule's remote branch |
| `git submodule status` | Show current commit of each submodule |
| `git submodule foreach git pull` | Pull latest in all submodules |
| `git submodule deinit <path>` | Unregister a submodule |

---

:::caution Consider Alternatives to Submodules
Submodules are powerful but add operational complexity — especially for CI/CD pipelines and teammates unfamiliar with the workflow. For sharing Java libraries across services, consider publishing to a private Maven/Gradle repository (Nexus, GitHub Packages, Artifactory) instead. Reserve submodules for cases where you genuinely need to co-develop the shared code alongside the parent project.
:::

## Interview Questions (Senior Level)

1. How do you decide between submodules and package registries for shared code?
2. What CI/CD controls are required for stable submodule workflows?
3. How do you prevent detached-head confusion in submodule contributors?
4. What rollback strategy do you use when a submodule bump breaks production?

Short answer guide:
- Prefer package distribution unless co-development is required.
- Pin commits, enforce recursive init/update, and validate refs in CI.
- Train on branch workflow inside submodule repos.
- Revert pointer commits quickly and test compatibility matrices.

:::info Interview Focus
Explain when submodules are justified and what CI controls make them reliable.
:::

:::danger Interview Trap
Treating submodules like normal directories and forgetting pointer commit management.
:::
