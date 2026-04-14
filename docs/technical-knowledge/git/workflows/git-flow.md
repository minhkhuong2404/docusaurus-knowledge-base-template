---
id: git-flow
title: Git Flow — Branch Strategy for Scheduled Releases
sidebar_label: Git Flow
description: '**Git Flow** is a branching model designed by Vincent Driessen for projects
  with scheduled, versioned releases. It defines a strict set of branch types and.'
tags:
- technical-knowledge
- git
- workflows
- git-flow
---
# Git Flow — Branch Strategy for Scheduled Releases

## What is Git Flow?

**Git Flow** is a branching model designed by Vincent Driessen for projects with scheduled, versioned releases. It defines a strict set of branch types and rules for how they interact, producing a clean, navigable history.

It is well-suited for: libraries, enterprise software, mobile apps, and any project with versioned releases and a dedicated QA / release process.

---

## Branch Structure

```
main         ← Production-ready code only. Tagged at every release.
develop      ← Integration branch. All features merge here.
feature/*    ← One branch per feature/story. Branch from develop.
release/*    ← Release preparation. Branch from develop, merge to main + develop.
hotfix/*     ← Critical production fixes. Branch from main, merge to main + develop.
```

---

## Branch Lifecycle

### Feature Branches

```bash
# Start a feature
git switch develop
git pull --rebase origin develop
git switch -c feature/JIRA-123-add-export

# ... develop, commit, push ...

# Finish: merge back to develop
git switch develop
git pull --rebase origin develop
git merge --no-ff feature/JIRA-123-add-export \
  -m "feat(transactions): merge export feature (JIRA-113)"
git push origin develop

# Delete the feature branch
git branch -d feature/JIRA-123-add-export
git push origin --delete feature/JIRA-123-add-export
```

### Release Branches

```bash
# Start a release branch from develop when ready to ship
git switch develop
git switch -c release/1.2.0

# Bump version, update changelog, final QA fixes only
mvn versions:set -DnewVersion=1.2.0

git commit -am "chore: bump version to 1.2.0"

# Fix any bugs found in release testing on this branch
git commit -m "fix: last-minute edge case in export"

# Finish: merge to main AND back to develop
git switch main
git merge --no-ff release/1.2.0 -m "chore: release v1.2.0"
git tag -a v1.2.0 -m "Release 1.2.0"
git push origin main --tags

git switch develop
git merge --no-ff release/1.2.0 -m "chore: back-merge release v1.2.0 into develop"
git push origin develop

git branch -d release/1.2.0
git push origin --delete release/1.2.0
```

### Hotfix Branches

```bash
# Critical bug in production — branch from main (not develop)
git switch main
git switch -c hotfix/JIRA-999-fix-npe

git commit -m "fix(transactions): resolve NPE on null description"

# Merge to main
git switch main
git merge --no-ff hotfix/JIRA-999-fix-npe -m "fix: NPE on null description (JIRA-999)"
git tag -a v1.2.1 -m "Hotfix v1.2.1"
git push origin main --tags

# Merge to develop (keep develop in sync)
git switch develop
git merge --no-ff hotfix/JIRA-999-fix-npe -m "fix: back-merge hotfix v1.2.1 to develop"
git push origin develop

git branch -d hotfix/JIRA-999-fix-npe
```

---

## Full Workflow Diagram

```
main:     ──●───────────────────●──────●──────────────●
            v1.0.0          v1.2.0   v1.2.1        v1.3.0
             │                 ↑  ↑     ↑  ↑           ↑
             │                /  /     /  /           /
develop:  ───●──●──●──●──●──●  /  ────●  /──●──●──●──●
              \      \      release    hotfix  \
feature-A:    ●──●──●┘       1.2.0     1.2.1  feature-B
```

---

## Git Flow Pros and Cons

| Pros | Cons |
|---|---|
| Clear separation of concerns | Complex for small teams |
| Supports parallel releases | Many long-lived branches to maintain |
| Hotfix path is explicit | Requires discipline to follow |
| Audit trail is very clear | Back-merges can be tedious |
| Works well with scheduled releases | Not ideal for continuous delivery |

---

## Git Flow CLI Tool

The `git-flow` CLI automates the branch creation and merging:

```bash
# Install
brew install git-flow-avh   # macOS

# Initialise in a repo
git flow init

# Feature
git flow feature start JIRA-123-add-export
git flow feature finish JIRA-123-add-export

# Release
git flow release start 1.2.0
git flow release finish 1.2.0

# Hotfix
git flow hotfix start JIRA-999-fix-npe
git flow hotfix finish JIRA-999-fix-npe
```

---

:::tip[Git Flow vs Trunk-Based Development]
Git Flow is best for **scheduled, versioned releases** (e.g., monthly releases, mobile apps with store review cycles). If your team deploys to production multiple times per day, [Trunk-Based Development](./trunk-based) is a better fit — fewer branches, simpler rules, faster feedback loops.
:::

---

## Interview Questions

### Q: When is Git Flow still a good choice in modern teams?
**A:** For products with scheduled releases, long QA cycles, and strict release governance where branch isolation is valuable.

### Q: What is the biggest operational risk in Git Flow?
**A:** Merge/back-merge complexity across develop, release, and hotfix branches, which can introduce drift and missed fixes.

### Q: How do you prevent hotfix divergence between main and develop?
**A:** Automate mandatory back-merge checks and include regression tests to verify parity after hotfix propagation.

### Q: Why can Git Flow reduce deployment speed?
**A:** Long-lived branches delay integration, increase conflict probability, and lengthen feedback cycles.

### Q: How do you choose between Git Flow and trunk-based in an interview scenario?
**A:** Base the choice on release cadence, compliance constraints, team maturity, and CI capabilities.

### Q: What governance controls should accompany Git Flow?
**A:** Clear branch policies, release ownership, CI gates per branch type, and strict tagging/versioning discipline.
