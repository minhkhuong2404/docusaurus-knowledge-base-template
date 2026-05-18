---
id: reset-revert
title: git reset & git revert — Undoing Changes
sidebar_label: reset & revert
description: '**Rule of thumb:** - Use `git reset` on **local, unpushed** changes
  - Use `git revert` on **pushed or shared** history'
tags:
- technical-knowledge
- git
- history
- reset-revert
---
# `git reset` & `git revert` — Undoing Changes

## The Core Difference

| Command | What it does | Rewrites history? | Safe for shared branches? |
|---|---|---|---|
| `git reset` | Moves the branch pointer backward, discarding or unstaging commits | ✅ Yes | ❌ No |
| `git revert` | Creates a **new commit** that undoes the changes of a previous commit | ❌ No | ✅ Yes |

**Rule of thumb:**
- Use `git reset` on **local, unpushed** changes
- Use `git revert` on **pushed or shared** history

---

## git reset

`git reset` moves the current branch's `HEAD` pointer to a specified commit, with three modes controlling what happens to the commits being "removed":

### `--soft` — Keep changes staged

```bash
git reset --soft HEAD~1
```

- Moves HEAD back one commit
- Changes from the "removed" commit are **placed in the index (staged)**
- Working tree is untouched
- **Use case:** Undo a commit but keep all changes ready to recommit (e.g., to rewrite the message or split the commit)

```
Before: A -- B -- C  (HEAD)
After:  A -- B  (HEAD)   index contains C's changes (staged)
```

### `--mixed` — Keep changes unstaged (default)

```bash
git reset HEAD~1
git reset --mixed HEAD~1
```

- Moves HEAD back one commit
- Changes from the "removed" commit are placed in the **working tree (unstaged)**
- **Use case:** Undo a commit and unstage everything — start the staging process fresh

### `--hard` — Discard all changes

```bash
git reset --hard HEAD~1
```

- Moves HEAD back one commit
- All changes from the "removed" commits are **permanently discarded**
- Working tree and index are both reset to the target commit's state
- **Use case:** Completely discard bad commits and all associated changes

:::danger[`git reset --hard` permanently destroys uncommitted changes. The changes are gone — not in the trash, not recoverable via `git reflog` (the commits are recoverable, but any unstaged changes in the working tree are lost forever). Double-check before running.]
:::

### Reset to a specific commit

```bash
# Reset to a specific SHA
git reset --soft a3f9bc2

# Reset to origin/main (discard all local commits since last push)
git reset --hard origin/main

# Reset a single file to the last committed state (does not move HEAD)
git restore src/main/java/com/example/TransactionService.java
git checkout HEAD -- src/main/java/com/example/TransactionService.java
```

---

## git revert

`git revert` creates a new commit that **inverts the changes** of a specified commit. The original commit is preserved in history — only a new "undo" commit is added. This is safe for shared branches.

### Revert the last commit

```bash
git revert HEAD
# Opens editor for the revert commit message, then commits
```

### Revert a specific commit

```bash
git revert a3f9bc2
```

### Revert without auto-committing (inspect first)

```bash
git revert --no-commit a3f9bc2
# Changes are staged — review them, then:
git revert --continue
# or abort:
git revert --abort
```

### Revert a range of commits

```bash
# Revert commits from a3f9bc2 (exclusive) to HEAD (inclusive)
git revert a3f9bc2..HEAD
```

### Revert a merge commit

Reverting a merge commit requires specifying which parent to treat as the mainline:

```bash
# -m 1 = treat the first parent (the branch you merged INTO) as mainline
git revert -m 1 <merge-commit-sha>
```

---

## Comparison: Reset Modes

```
Commit History:    A -- B -- C -- D  (HEAD on main)

git reset --soft HEAD~2:
  History:  A -- B  (HEAD)
  Index:    changes from C + D are staged
  Worktree: unchanged

git reset --mixed HEAD~2:
  History:  A -- B  (HEAD)
  Index:    clean (no staged changes)
  Worktree: changes from C + D are present but unstaged

git reset --hard HEAD~2:
  History:  A -- B  (HEAD)
  Index:    clean
  Worktree: clean — C and D's changes are GONE

git revert C, then git revert D:
  History:  A -- B -- C -- D -- D' -- C'  (HEAD)
  (D' and C' are new commits that undo D and C respectively)
```

---

## Recovering from a Mistake with reflog

If you ran `git reset --hard` and lost commits, `git reflog` can recover them. See [Reflog](./reflog).

```bash
git reflog
# HEAD@{0}: reset: moving to HEAD~2
# HEAD@{1}: commit: feat: add export            ← the SHA you want
# HEAD@{2}: commit: feat: add service

git reset --hard HEAD@{1}   # recover the lost commit
```

---

:::tip[When to Use Which]
- **Just committed but not pushed, want to redo the commit:** `git reset --soft HEAD~1`
- **Committed wrong files, want to unstage and re-stage:** `git reset HEAD~1` (mixed)
- **Need to completely discard local changes:** `git reset --hard origin/main`
- **Pushed to shared branch, need to undo:** `git revert <sha>` — always
:::

---

## Interview Questions

### Q: Why is revert preferred over reset on shared branches?
**A:** Revert preserves immutable history and collaboration safety while still undoing behavior.

### Q: What is the operational risk of reset --hard in active repos?
**A:** It can permanently discard local work and cause accidental loss when used without backup/reflog awareness.

### Q: How do you undo a bad production deploy safely?
**A:** Revert the specific release commits (or merge commit), validate rollback behavior in CI, and redeploy with monitoring.

### Q: When should you use revert --no-commit?
**A:** When batching multiple reversions into one reviewed rollback commit after inspecting cumulative effects.

### Q: How does reflog change recovery strategy after mistakes?
**A:** It provides a local movement journal for HEAD, enabling restoration of prior states after destructive operations.

### Q: What senior guardrail would you enforce around reset?
**A:** Forbid reset-based history rewrites on protected branches and require revert-based remediation in team workflows.
