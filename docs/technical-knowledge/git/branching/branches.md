---
id: branches
title: git branch — Creating & Managing Branches
sidebar_label: Branches
description: A branch in Git is a **lightweight movable pointer** to a commit. Creating
  a branch costs nothing — it is just a 41-byte file containing a SHA. When you commit.
tags:
- technical-knowledge
- git
- branching
- branches
---
# Branches — Creating & Managing

## What is a Branch?

A branch in Git is a **lightweight movable pointer** to a commit. Creating a branch costs nothing — it is just a 41-byte file containing a SHA. When you commit on a branch, the pointer moves forward automatically.

`HEAD` is a special pointer that tells Git which branch (or commit) you are currently on.

```
main:    A -- B -- C          ← HEAD on main
                    \
feature:             D -- E  ← HEAD on feature after two commits
```

---

## Creating Branches

```bash
# Create a branch (does not switch to it)
git branch feature/JIRA-123-add-export

# Create and switch to the new branch (modern syntax)
git switch -c feature/JIRA-123-add-export

# Create and switch (classic syntax)
git checkout -b feature/JIRA-123-add-export

# Create a branch from a specific commit or tag
git switch -c hotfix/JIRA-999 v1.2.0
git switch -c hotfix/JIRA-999 a3f9bc2
```

---

## Switching Branches

```bash
# Switch to an existing branch (modern)
git switch main

# Switch to an existing branch (classic)
git checkout main

# Switch back to the previous branch (like cd -)
git switch -
```

:::caution
Git will not let you switch branches with uncommitted changes if those changes would conflict with the target branch. Either commit, stash, or discard changes first.
:::

---

## Listing Branches

```bash
# Local branches
git branch

# Remote-tracking branches
git branch -r

# All branches (local + remote)
git branch -a

# Verbose — show last commit on each branch
git branch -vv

# Show branches merged into current branch (safe to delete)
git branch --merged

# Show branches NOT yet merged (do not delete these!)
git branch --no-merged
```

---

## Renaming a Branch

```bash
# Rename the current branch
git branch -m new-name

# Rename a specific branch
git branch -m old-name new-name

# After renaming, update the remote
git push origin --delete old-name
git push -u origin new-name
```

---

## Deleting Branches

```bash
# Delete a merged local branch (safe — won't delete unmerged)
git branch -d feature/JIRA-123-add-export

# Force delete an unmerged branch (data loss risk — be sure)
git branch -D feature/abandoned-experiment

# Delete a remote branch
git push origin --delete feature/JIRA-123-add-export

# Prune stale remote-tracking refs
git fetch --prune
```

---

## Branch Naming Conventions

Consistent naming makes branches self-documenting:

| Pattern | Use Case |
|---|---|
| `feature/JIRA-123-short-description` | New feature |
| `bugfix/JIRA-456-fix-null-pointer` | Non-critical bug fix |
| `hotfix/JIRA-789-critical-payment-issue` | Critical production fix |
| `release/1.2.0` | Release preparation |
| `chore/upgrade-spring-boot-3.2` | Tooling / dependency work |
| `refactor/extract-transaction-mapper` | Refactoring without feature change |
| `docs/update-api-readme` | Documentation only |

---

## Tracking Remote Branches

```bash
# Create a local branch tracking a remote branch
git switch -c feature/JIRA-123 origin/feature/JIRA-123

# Or fetch and checkout in one step
git fetch origin
git switch feature/JIRA-123  # Git auto-detects the remote tracking branch

# Check what each local branch tracks
git branch -vv
```

---

:::tip Keep Branches Short-Lived
Long-lived feature branches accumulate drift from main and lead to painful, large merges. Aim for branches that live no longer than 2–3 days. If a feature is large, break it into smaller branches and merge incrementally behind a feature flag.
:::

## Interview Questions (Senior Level)

1. How do you enforce short-lived branch discipline in a large team without slowing delivery?
2. What branching model works best for trunk-based CI/CD with strict compliance approvals?
3. How do you handle parallel hotfix and feature development while minimizing merge debt?
4. Which branch naming and lifecycle metrics would you track at team level?

Short answer guide:
- Automate stale-branch detection and merge cadence policies.
- Prefer trunk-based with feature flags and release controls.
- Isolate hotfix branches from release baseline, then back-merge systematically.
- Track branch age, rebase frequency, and conflict rate.
