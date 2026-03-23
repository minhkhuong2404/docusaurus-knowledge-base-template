---
id: rebase
title: git rebase — Replaying Commits
sidebar_label: rebase
---

# `git rebase` — Replaying Commits

## What It Does

`git rebase` moves or replays a sequence of commits onto a new base. It rewrites commit history by creating **new commits** with the same changes but different parent commits (and therefore new SHA hashes).

The fundamental difference from merge:

```
BEFORE (both start from C):
  main:    A -- B -- C -- D -- E
                      \
  feature:             F -- G -- H

AFTER git merge main (creates a merge commit):
  feature: A -- B -- C -- F -- G -- H -- M
                      \               /
                       D -- E --------

AFTER git rebase main (replays F, G, H on top of E):
  feature: A -- B -- C -- D -- E -- F' -- G' -- H'
                                    (new SHA hashes)
```

Rebasing produces **linear history** — as if the feature branch was started from the latest point on main.

---

## Standard Rebase (Update a Branch)

The most common use: bring your feature branch up-to-date with main before opening a PR.

```bash
git switch feature/JIRA-123
git fetch origin
git rebase origin/main
```

If there are conflicts during replay, Git pauses on the conflicting commit:

```bash
# 1. Resolve conflicts in your editor
# 2. Stage the resolved files
git add src/main/java/com/example/TransactionService.java

# 3. Continue replaying the remaining commits
git rebase --continue

# Or abort and return to the state before rebase started
git rebase --abort

# Or skip the problematic commit (use only if you're certain it's safe)
git rebase --skip
```

---

## Interactive Rebase (`-i`)

Interactive rebase is one of Git's most powerful features. It lets you edit, reorder, squash, split, drop, or rename commits before they are pushed or merged.

```bash
# Rebase the last 5 commits interactively
git rebase -i HEAD~5

# Rebase all commits since branching from main
git rebase -i origin/main
```

Git opens your editor with a list of commits, oldest at the top:

```
pick a3f9bc2 feat(transactions): add repository method
pick 7d1e4f0 wip: controller scaffolding
pick 2c8a1b3 fix typo
pick 9f3e2d1 feat(transactions): add service logic
pick 1a4b5c6 feat(transactions): add controller endpoint

# Commands:
# p, pick   = use commit as-is
# r, reword = use commit but edit the message
# e, edit   = use commit but pause to amend
# s, squash = meld into previous commit (combine messages)
# f, fixup  = meld into previous commit (discard this message)
# d, drop   = remove the commit entirely
# b, break  = pause here (useful for splitting commits)
```

### Common patterns

**Squash WIP commits into a clean feature commit:**
```
pick a3f9bc2 feat(transactions): add repository method
squash 7d1e4f0 wip: controller scaffolding
squash 2c8a1b3 fix typo
squash 9f3e2d1 feat(transactions): add service logic
squash 1a4b5c6 feat(transactions): add controller endpoint
```

**Reorder commits (change lines order):**
```
pick a3f9bc2 feat: add domain model
pick 9f3e2d1 feat: add service logic
pick 7d1e4f0 wip: controller scaffolding    ← move this down
pick 1a4b5c6 feat: add controller
```

**Drop a commit entirely:**
```
pick a3f9bc2 feat: add domain model
drop 7d1e4f0 wip: debug logging I don't want
pick 9f3e2d1 feat: add service logic
```

**Reword a commit message:**
```
reword a3f9bc2 feat: add transaction filter   ← Git will pause to edit this message
pick   9f3e2d1 feat: add service logic
```

---

## Rebase onto Another Branch

Move a branch from one base onto a completely different branch:

```bash
# Scenario: feature-b was accidentally branched from feature-a,
# but should have been branched from main

git rebase --onto main feature-a feature-b
```

```
Before:
  main:      A -- B -- C
                        \
  feature-a:             D -- E
                               \
  feature-b:                    F -- G

After: git rebase --onto main feature-a feature-b
  main:      A -- B -- C -- F' -- G'
```

---

## Autosquash

When combined with `--fixup` commits, `--autosquash` automatically rearranges the rebase todo list:

```bash
# Create a fixup commit targeting an earlier commit
git commit --fixup a3f9bc2

# During interactive rebase, autosquash arranges it automatically
git rebase -i --autosquash origin/main
```

See [Fixup](../history/fixup) for the full workflow.

---

## When NOT to Rebase

:::danger Never rebase shared branches
Do not rebase any branch that other team members have pulled and based work on. Rebase rewrites SHA hashes — anyone who has the old SHAs will have a diverged history that is painful to reconcile.

**Safe to rebase:** your own local feature branch before pushing  
**Safe to rebase:** a pushed feature branch only you are working on (use `--force-with-lease`)  
**NEVER rebase:** `main`, `develop`, `release/**`, or any branch shared with others
:::

---

## Useful Flags Summary

| Flag | Meaning |
|---|---|
| `-i` / `--interactive` | Open interactive editor |
| `--onto <newbase>` | Rebase onto a different base |
| `--continue` | Continue after resolving conflicts |
| `--abort` | Cancel rebase and restore original state |
| `--skip` | Skip the current conflicting commit |
| `--autosquash` | Auto-arrange fixup/squash commits |
| `--autostash` | Stash dirty working tree before rebase, pop after |
| `--no-ff` | Create a merge commit instead of fast-forward at the end |
| `-x "cmd"` | Run a shell command after each replayed commit |
