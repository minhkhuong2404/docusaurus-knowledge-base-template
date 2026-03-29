---
id: worktree
title: git worktree — Multiple Working Trees
sidebar_label: Worktree
description: '`git worktree` lets you check out **multiple branches simultaneously**,
  each in its own directory, all sharing the same `.git` repository. No stashing,
  no.'
tags:
- technical-knowledge
- git
- advanced
- worktree
---
# `git worktree` — Multiple Working Trees

## What It Does

`git worktree` lets you check out **multiple branches simultaneously**, each in its own directory, all sharing the same `.git` repository. No stashing, no switching, no losing context.

This is ideal when you need to review or hotfix another branch without abandoning in-progress work on your current branch.

---

## When to Use Worktrees

| Scenario | Without Worktree | With Worktree |
|---|---|---|
| Fix a hotfix while mid-feature | Stash → switch → fix → push → pop → resume | Add worktree → fix in parallel → remove worktree |
| Review a colleague's large PR | Stash → checkout → review → switch back | Add worktree for their branch → review in separate window |
| Run tests on main while developing on feature | Wait for tests then switch | Worktree on main runs tests independently |
| Compare behaviour between branches | Manually switch back and forth | Two IDE windows, each on a different branch |

---

## Basic Usage

### Add a worktree

```bash
# Add a worktree for an existing branch
git worktree add ../hotfix-workspace hotfix/JIRA-999

# Add a worktree and create a new branch
git worktree add -b hotfix/JIRA-999 ../hotfix-workspace origin/main
```

This creates a new directory `../hotfix-workspace` that is a fully functional working tree on the `hotfix/JIRA-999` branch, while your current directory stays on your feature branch.

### List all worktrees

```bash
git worktree list
# /home/jane/projects/transaction-service         a3f9bc2 [feature/JIRA-123]
# /home/jane/projects/hotfix-workspace            91bc3f0 [hotfix/JIRA-999]
```

### Work in the new worktree

```bash
cd ../hotfix-workspace

# It's a full working tree — all normal Git commands work
git log --oneline -5
./mvnw test
git add .
git commit -m "fix(transactions): resolve NPE on null description"
git push origin hotfix/JIRA-999

# Return to your feature work
cd ../transaction-service
# Your feature branch is completely undisturbed — no stash needed
```

### Remove a worktree

```bash
# First, leave the worktree directory
cd ../transaction-service

# Remove the worktree
git worktree remove ../hotfix-workspace

# Force remove if there are uncommitted changes
git worktree remove --force ../hotfix-workspace

# Prune stale worktree references (if directory was deleted manually)
git worktree prune
```

---

## Worktree with IDE

Open the worktree directory as a **separate project window** in your IDE:

```bash
# IntelliJ IDEA
idea ../hotfix-workspace

# VS Code
code ../hotfix-workspace
```

You now have two IDE windows, each on a different branch, each with their own run configurations, search indexes, and tool windows.

---

## Constraints

- A branch can only be checked out in **one worktree at a time**. If `hotfix/JIRA-999` is in a worktree, you cannot `git switch hotfix/JIRA-999` in the main tree until the worktree is removed
- All worktrees share the same object store — no duplication of history or objects
- You can have as many worktrees as you need

---

## Useful Commands

| Command | Meaning |
|---|---|
| `git worktree add <path> <branch>` | Create a new worktree for an existing branch |
| `git worktree add -b <branch> <path> <base>` | Create worktree on a new branch |
| `git worktree list` | Show all worktrees and their branches |
| `git worktree remove <path>` | Remove a worktree |
| `git worktree prune` | Clean up stale worktree references |
| `git worktree lock <path>` | Lock a worktree to prevent removal |
| `git worktree unlock <path>` | Unlock a worktree |

---

:::tip Worktrees Beat Stashing for Hotfixes
The classic hotfix workflow requires you to stash, switch, fix, push, switch back, and pop — with the risk of forgetting to pop or creating stash conflicts. Worktrees eliminate all of that: your feature work is untouched in its directory, and the hotfix lives in a separate, parallel workspace.
:::

## Interview Questions (Senior Level)

1. How do worktrees reduce context-switch risk in incident response workflows?
2. What operational guardrails should teams define for temporary worktree lifecycle?
3. When is worktree superior to branch switching and stash-based flows?
4. How do you avoid branch-lock confusion when one branch is active in another worktree?

Short answer guide:
- Worktrees isolate changes and minimize accidental carryover.
- Enforce naming, cleanup, and ownership conventions for temp trees.
- Prefer for parallel hotfix/review/test contexts.
- Use `git worktree list` visibility and cleanup routines.

:::info Interview Focus
Explain how worktrees reduce context-switch risk during hotfixes and parallel reviews.
:::

:::danger Interview Trap
Leaving stale worktrees that create branch confusion and cleanup debt.
:::
