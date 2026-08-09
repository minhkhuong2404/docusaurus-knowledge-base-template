---
id: rebase
title: git rebase — Replaying Commits
sidebar_label: rebase
description: git rebase moves or replays a sequence of commits onto a new base, rewriting history to produce a clean linear commit graph.
tags:
  - technical-knowledge
  - git
  - branching
  - rebase
---

import GitRebaseInternalsDiagram from '@site/src/components/GitRebaseInternalsDiagram';

# `git rebase` — Replaying Commits

<GitRebaseInternalsDiagram />

---

## What Is `git rebase`?

`git rebase` replays a sequence of commits from your current branch onto a new upstream base commit. Rather than creating a multi-parent merge commit (as `git merge` does), rebase sequentially applies each commit's patch diff onto the target tip, creating **brand-new commit objects** with new SHA-1/SHA-256 hashes and updated parent pointers.

```
BEFORE REBASE (Branch feature diverges from main at commit C):
  main:    A --- B --- C --- D --- E  (origin/main)
                        \
  feature:               F --- G --- H  (HEAD)

AFTER `git rebase main` (Replays F, G, H onto tip of main E):
  main:    A --- B --- C --- D --- E
                                    \
  feature:                           F' --- G' --- H'  (HEAD)
```

---

## Standard Rebase vs Interactive Rebase (`-i`)

### Standard Rebase Flow
Used to pull the latest upstream changes into your feature branch before opening a Pull Request:

```bash
# Switch to your feature branch and fetch latest remotes
git switch feature/payment-gateway
git fetch origin

# Replay local commits on top of current origin/main
git rebase origin/main
```

### Interactive Rebase Commands (`git rebase -i HEAD~N`)

| Action | Command | Purpose |
|---|---|---|
| **`pick`** | `p` | Retain commit as-is. |
| **`reword`** | `r` | Retain commit patch changes, but pause to edit the commit message. |
| **`edit`** | `e` | Pause execution at this commit to amend code changes via `git commit --amend`. |
| **`squash`** | `s` | Combine commit patch into previous commit and concatenate log messages. |
| **`fixup`** | `f` | Combine commit patch into previous commit, discarding this commit's message. |
| **`drop`** | `d` | Delete commit patch entirely from history. |

---

## Conflict Resolution During Rebase

When Git encounters a merge conflict while replaying a commit patch:

```bash
# 1. Resolve conflict in modified files
# 2. Stage resolved paths
git add src/main/java/com/example/PaymentService.java

# 3. Continue replaying remaining commits
git rebase --continue

# Abort rebase and restore original pre-rebase HEAD pointer
git rebase --abort
```

---

## Interview Questions

### Q1. Why is rebasing shared public branches considered dangerous in Git workflows?
> Rebasing creates brand-new commit objects with distinct SHA hashes, rewriting branch history. If you rebase a shared public branch (like `main` or `develop`) that other developers have pulled, their local repositories retain the old commit hashes. Subsequent pulls or merges force Git to reconcile diverged histories, creating duplicated commits and painful merge conflicts across the entire engineering team.

### Q2. What is the difference between `git push --force` and `git push --force-with-lease`?
> `git push --force` (`-f`) overwrites the remote branch pointer unconditionally, ignoring any new commits pushed by teammates to the remote server. `git push --force-with-lease` checks if the remote ref matches your local remote-tracking ref (`origin/branch`). If someone else pushed new commits to the remote branch in the interim, `--force-with-lease` rejects the push, preventing accidental overwrites of teammates' work.

### Q3. How do you recover a feature branch if an interactive rebase goes wrong?
> Use `git reflog` to locate the `HEAD` pointer position prior to executing the rebase (e.g., `HEAD@{2}`). Execute `git reset --hard HEAD@{2}` (or `git reset --hard <pre-rebase-sha>`) to instantly restore the branch pointer, working tree, and index back to its exact pre-rebase state.

---

## See Also

- [Git Merge Mechanics](./merge.md)
- [Git Conflict Resolution](./conflict-resolution.md)
- [Git Reflog Recovery](../history/reflog.md)
