---
id: reflog
title: git reflog — The Safety Net
sidebar_label: reflog
description: The **reflog** (reference log) is a local journal of every place `HEAD`
  and your branch pointers have pointed to, in chronological order. Every time you.
tags:
- technical-knowledge
- git
- history
- reflog
---
# `git reflog` — The Safety Net

## What is the Reflog?

The **reflog** (reference log) is a local journal of every place `HEAD` and your branch pointers have pointed to, in chronological order. Every time you commit, reset, rebase, merge, checkout, or amend — Git records the previous position in the reflog.

This makes the reflog the ultimate safety net. Even if you `git reset --hard`, run a destructive rebase, or accidentally delete a branch — the commits are still in Git's object store, and the reflog tells you exactly how to get back to them.

:::info
The reflog is **local only**. It is not pushed to remotes. If you clone a repo, you have no reflog for the original machine's operations.
:::

---

## Viewing the Reflog

```bash
git reflog
# or equivalently:
git reflog show HEAD
```

Output:

```
a3f9bc2 HEAD@{0}: commit: feat(transactions): add controller
9f3e2d1 HEAD@{1}: commit: feat(transactions): add service
7d1e4f0 HEAD@{2}: rebase (finish): returning to refs/heads/feature/JIRA-123
2c8a1b3 HEAD@{3}: rebase (pick): feat: add domain model
b2c3d4e HEAD@{4}: reset: moving to HEAD~3
1a4b5c6 HEAD@{5}: commit: fix: null check
...
```

Each entry shows:
- The commit SHA at that point
- The `HEAD@{N}` reference (can be used directly in Git commands)
- What action caused the change
- The commit message or operation description

### View reflog for a specific branch

```bash
git reflog show main
git reflog show feature/JIRA-123
```

### Show reflog with timestamps

```bash
git reflog --date=iso
git reflog --date=relative
# HEAD@{2 hours ago}: commit: feat: add export
```

---

## Common Recovery Scenarios

### Scenario 1: Recover from `git reset --hard`

You ran `git reset --hard HEAD~3` and lost three commits you needed:

```bash
git reflog
# HEAD@{0}: reset: moving to HEAD~3
# HEAD@{1}: commit: feat: add export controller    ← SHA you want
# HEAD@{2}: commit: feat: add export service
# HEAD@{3}: commit: feat: add export repository

# Option A: Reset HEAD back to the commit before the destructive reset
git reset --hard HEAD@{1}

# Option B: Create a new branch pointing to the recovered commit
git branch recovered-work HEAD@{1}
git switch recovered-work
```

### Scenario 2: Recover a deleted branch

You deleted a feature branch with `git branch -D`:

```bash
git reflog
# HEAD@{4}: checkout: moving from feature/JIRA-123 to main

# Find the last commit of the deleted branch
git reflog show feature/JIRA-123
# (or search the main HEAD reflog for the checkout)

# Recreate the branch
git branch feature/JIRA-123 a3f9bc2
```

### Scenario 3: Recover after a bad rebase

Your interactive rebase went wrong and you lost commits:

```bash
git reflog
# HEAD@{0}: rebase (finish): returning to refs/heads/feature/JIRA-123
# HEAD@{1}: rebase (squash): feat: first squashed commit
# HEAD@{2}: rebase (start): checkout origin/main
# HEAD@{3}: commit: feat: add export controller    ← state before the rebase
# HEAD@{4}: commit: feat: add export service
# HEAD@{5}: commit: feat: add export repository

# Restore the branch to its pre-rebase state
git reset --hard HEAD@{3}
```

### Scenario 4: Recover an amended commit

You ran `git commit --amend` and want the original back:

```bash
git reflog
# HEAD@{0}: commit (amend): feat(transactions): revised message
# HEAD@{1}: commit: feat(transactions): original message  ← original SHA

git reset --soft HEAD@{1}   # restore the original commit
```

---

## Reflog Expiry

Reflog entries are kept for 90 days (default). After that, `git gc` prunes them. You can adjust:

```bash
git config --global gc.reflogExpire 180        # keep for 180 days
git config --global gc.reflogExpireUnreachable 30  # unreachable commits: 30 days
```

Manually expire old entries:
```bash
git reflog expire --expire=now --all    # prune all reflog entries
git gc                                  # clean up dangling objects
```

---

:::tip[Commit Often = Larger Safety Net]
Every commit creates a reflog entry. Making frequent WIP commits (even messy ones) while working gives you more recovery points. You can always squash them before merging.
:::

## Interview Questions (Senior Level)

1. A teammate force-pushed and lost commits. How do you design a safe recovery playbook using reflog and branch recreation?
2. When is `reflog` insufficient for recovery, and what preventative controls reduce that risk?
3. How do reflog retention settings affect incident recovery windows in large repos?
4. What is your policy for destructive history rewrite on shared branches?

Short answer guide:
- Recover by identifying prior refs in reflog, then branch and validate before push.
- Reflog is local; enforce protected branches and server-side backups.
- Tune expiry to your operational recovery SLA.
- Restrict rewrites and require `--force-with-lease` with clear ownership.
