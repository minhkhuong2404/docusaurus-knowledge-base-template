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

import GitFlowWorkflowDiagram from '@site/src/components/GitFlowWorkflowDiagram';

# Git Flow — Branch Strategy for Scheduled Releases

<GitFlowWorkflowDiagram />

## What is Git Flow?

**Git Flow** is a branching model designed by Vincent Driessen for projects with scheduled, versioned releases. It defines a strict set of branch types and rules for how they interact, producing a clean, navigable history.

It is well-suited for: libraries, enterprise software, mobile apps, and any project with versioned releases and a dedicated QA / release process.

---

## Branch Structure

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
