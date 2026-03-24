---
id: intro
title: Git Knowledge Base
sidebar_label: Introduction
slug: /technical-knowledge/git
---

# Git Knowledge Base

> A comprehensive reference for everything Git — from staging your first file to rewriting history, managing complex merges, and running team-wide workflows.

## What is Git?

**Git** is a distributed version control system (VCS) created by Linus Torvalds in 2005. Every developer has a full copy of the repository — including its complete history — on their local machine. This means most operations are instant, offline-capable, and non-destructive.

Git tracks changes as a **directed acyclic graph (DAG)** of commits, where each commit is an immutable snapshot of the entire project tree at a point in time (not a diff). Branches are simply lightweight, movable pointers to commits.

---

## Core Concepts at a Glance

| Concept | What it is |
|---|---|
| **Repository** | The `.git` directory containing all history, objects, and refs |
| **Working Tree** | Your actual files on disk — what you edit |
| **Index / Staging Area** | The preparation zone between working tree and commits |
| **Commit** | An immutable snapshot of the staged tree plus metadata |
| **Branch** | A movable pointer to a commit (`refs/heads/name`) |
| **HEAD** | A pointer to the currently checked-out commit or branch |
| **Remote** | A named URL to another repository (e.g., `origin`) |
| **Tag** | An immutable pointer to a commit — usually a release marker |

---

## The Three Trees

Understanding Git's **three trees** is the key to understanding almost every Git command:

```
Working Tree    →  git add  →   Index (Stage)   →  git commit  →   Repository
(your files)                   (snapshot draft)                    (commit history)
      ↑                                                                   |
      └─────────────────── git checkout / git restore ──────────────────┘
```

- `git add` moves changes from the **working tree** into the **index**
- `git commit` moves changes from the **index** into the **repository**
- `git checkout` / `git restore` moves changes from the **repository** or **index** back into the **working tree**

---

## Quick Command Reference

| Task | Command |
|---|---|
| Stage all changes | `git add .` |
| Commit with message | `git commit -m "feat: description"` |
| Push to remote | `git push origin branch-name` |
| Pull latest changes | `git pull --rebase origin main` |
| Create and switch branch | `git switch -c feature/my-feature` |
| Merge a branch | `git merge --no-ff feature/my-feature` |
| Rebase onto main | `git rebase main` |
| Interactive rebase | `git rebase -i HEAD~5` |
| Cherry-pick a commit | `git cherry-pick <sha>` |
| Squash last N commits | `git rebase -i HEAD~N` |
| Stash work-in-progress | `git stash push -m "wip: description"` |
| Reset to previous commit | `git reset --soft HEAD~1` |
| Undo a commit safely | `git revert <sha>` |
| Find which commit introduced a bug | `git bisect start` |
| View full history graph | `git log --oneline --graph --all` |

---

## How to Use This Documentation

Use the **sidebar** to navigate by topic area:

- **Basics** — `add`, `commit`, `push`, `fetch/pull`, `status/diff`
- **Branching** — creating branches, merging, rebasing, conflict resolution
- **History & Rewriting** — `cherry-pick`, `squash`, `fixup`, `reset`, `revert`, `reflog`
- **Collaboration** — remotes, tags, stash, submodules
- **Advanced** — hooks, aliases, `bisect`, worktrees
- **Workflows** — Git Flow, trunk-based development, conventional commits, PR best practices

:::tip Golden Rule of Git
**Never rewrite history on shared branches.** Rebase, squash, and fixup are safe on your own feature branches. Once a branch is pushed and shared with others, use `git revert` instead.
:::
