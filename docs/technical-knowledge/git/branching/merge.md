---
id: merge
title: git merge — Combining Branches
sidebar_label: merge
description: '`git merge` integrates the history of one branch into another. It finds
  the **common ancestor** of the two branches and combines their changes, creating
  a new.'
tags:
- technical-knowledge
- git
- branching
- merge
---
# `git merge` — Combining Branches

## What It Does

`git merge` integrates the history of one branch into another. It finds the **common ancestor** of the two branches and combines their changes, creating a new **merge commit** (or fast-forwarding the pointer if possible).

---

## Merge Strategies

### Fast-Forward Merge

When the target branch has not diverged from the source — it is simply behind — Git moves the pointer forward instead of creating a new commit.

```
Before:
  main:    A -- B
                 \
  feature:        C -- D

After: git merge feature (fast-forward)
  main:    A -- B -- C -- D  (no merge commit, pointer just moved)
```

```bash
git switch main
git merge feature/JIRA-123
```

### No Fast-Forward (`--no-ff`) — Recommended for Feature Branches

Forces a merge commit even when fast-forward is possible. This preserves the fact that a feature branch existed, making history easier to read.

```
Before:
  main:    A -- B
                 \
  feature:        C -- D

After: git merge --no-ff feature/JIRA-123
  main:    A -- B ----------- M   (M = merge commit)
                 \          /
  feature:        C -- D --
```

```bash
git switch main
git merge --no-ff feature/JIRA-123 -m "feat(transactions): merge export feature (#PR-42)"
```

This is the **recommended strategy** for integrating feature branches. The merge commit creates a clear, navigable record of the feature's integration point.

### Squash Merge

Collapses all commits from the feature branch into a single staged change and lets you commit it cleanly. The feature branch commits do not appear in main's history.

```bash
git switch main
git merge --squash feature/JIRA-123
git commit -m "feat(transactions): add CSV export (#PR-42)"
```

Use this when the feature branch has messy WIP commits that you do not want in main's history. See also [Squash](../history/squash).

---

## Common Merge Scenarios

### Merge a feature branch into develop

```bash
git switch develop
git pull --rebase origin develop        # catch up first
git merge --no-ff feature/JIRA-123 \
  -m "feat(transactions): add CSV export (JIRA-113)"
git push origin develop
```

### Merge a release branch into main and develop

```bash
# Merge to main
git switch main
git merge --no-ff release/1.2.0 -m "chore: release v1.2.0"
git tag -a v1.2.0 -m "Release 1.2.0"
git push origin main --tags

# Back-merge to develop
git switch develop
git merge --no-ff release/1.2.0 -m "chore: back-merge release v1.2.0 to develop"
git push origin develop
```

### Merge a hotfix

```bash
git switch main
git merge --no-ff hotfix/JIRA-999 -m "fix: resolve NPE on null description (JIRA-999)"
git tag -a v1.2.1 -m "Hotfix v1.2.1"
git push origin main --tags

# Also merge into develop
git switch develop
git merge --no-ff hotfix/JIRA-999
git push origin develop
```

---

## Handling Merge Conflicts

When both branches have changed the same lines, Git cannot auto-resolve and leaves conflict markers:

```java
<<<<<<< HEAD (current branch — develop)
    public Page<TransactionDto> findTransactions(UUID userId, Pageable pageable) {
=======
    public Page<TransactionDto> findTransactions(UUID userId,
            LocalDate fromDate, LocalDate toDate, Pageable pageable) {
>>>>>>> feature/JIRA-123 (incoming branch)
```

Resolve by editing the file to the correct final state (removing all `<<<<`, `====`, `>>>>` markers), then:

```bash
git add src/main/java/com/example/TransactionService.java
git merge --continue    # or: git commit
```

To abort the merge and return to the pre-merge state:
```bash
git merge --abort
```

See [Conflict Resolution](./conflict-resolution) for full guidance.

---

## Useful Flags Summary

| Flag | Meaning |
|---|---|
| `--no-ff` | Always create a merge commit |
| `--ff-only` | Only merge if fast-forward is possible, else abort |
| `--squash` | Collapse all branch commits into staged changes |
| `--abort` | Abandon an in-progress merge |
| `--continue` | Continue after resolving conflicts |
| `--no-commit` | Perform merge but stop before committing |
| `-m "msg"` | Set the merge commit message inline |
| `--strategy-option=theirs` | Resolve all conflicts by preferring the incoming branch |
| `--strategy-option=ours` | Resolve all conflicts by preferring the current branch |

---

:::tip[Merge vs Rebase]
Use **merge** (`--no-ff`) when integrating **completed** branches into shared branches (`develop`, `main`). Use **rebase** to update a **feature branch** with the latest changes from `main` before opening a PR. This gives you the best of both: linear feature branch history and clear merge points in main.
:::

---

## Interview Questions

### Q: Why do many teams prefer --no-ff for feature integration?
**A:** It preserves branch context and makes audit/history navigation easier for incident analysis and change tracing.

### Q: When is ff-only useful?
**A:** In strict linear-history repositories where merge commits are disallowed and branch hygiene is enforced.

### Q: What is the risk of frequent squash merges?
**A:** They simplify main history but can hide granular commit intent and complicate later root-cause analysis.

### Q: How do you choose merge strategy for hotfixes?
**A:** Optimize for speed and traceability: minimal change set, explicit merge record, and immediate back-merge where needed.

### Q: How do merge strategies affect release governance?
**A:** Strategy choice impacts auditability, rollback confidence, and ability to reconstruct change lineage quickly.

### Q: What should happen before merging conflict-heavy branches?
**A:** Run focused regression tests and verify critical paths impacted by conflicted files.
