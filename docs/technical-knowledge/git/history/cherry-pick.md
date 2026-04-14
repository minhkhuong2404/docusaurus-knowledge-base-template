---
id: cherry-pick
title: git cherry-pick — Applying Specific Commits
sidebar_label: cherry-pick
description: '`git cherry-pick` copies one or more commits from anywhere in the repository
  and applies them to the current branch as new commits. The original commits remain.'
tags:
- technical-knowledge
- git
- history
- cherry-pick
---
# `git cherry-pick` — Applying Specific Commits

## What It Does

`git cherry-pick` copies one or more commits from anywhere in the repository and applies them to the current branch as new commits. The original commits remain unchanged. The new commits have different SHA hashes but identical changes.

```
Before:
  main:    A -- B -- C -- D -- E
                      \
  develop:             F -- G -- H

After: git cherry-pick G (on main)
  main:    A -- B -- C -- D -- E -- G'  (G' = copy of G, different SHA)
                      \
  develop:             F -- G -- H      (unchanged)
```

---

## Syntax

```bash
git cherry-pick <commit-sha>
git cherry-pick <sha1> <sha2> <sha3>     # multiple commits
git cherry-pick <sha1>..<sha3>           # range (exclusive of sha1)
git cherry-pick <sha1>^..<sha3>          # range (inclusive of sha1)
```

---

## Common Use Cases

### 1. Backport a hotfix to a release branch

You fixed a P1 bug on `main`. You also need the fix in `release/1.1.x` which was already deployed.

```bash
# Find the commit SHA of the fix on main
git log main --oneline --grep="JIRA-999"
# a3f9bc2 fix(transactions): resolve NPE on null description (JIRA-999)

# Apply to the release branch
git switch release/1.1.x
git cherry-pick a3f9bc2

# Push
git push origin release/1.1.x
```

### 2. Rescue a commit from a wrong branch

You accidentally committed a feature to `main` instead of your feature branch:

```bash
git log main --oneline -1
# 9f3e2d1 feat: add transaction export endpoint  ← this should be on feature/JIRA-113

# Apply it to the correct branch
git switch feature/JIRA-113
git cherry-pick 9f3e2d1

# Remove it from main
git switch main
git revert 9f3e2d1  # or git reset --hard HEAD~1 if not yet pushed
```

### 3. Pick a specific bug fix from a colleague's unmerged branch

```bash
git fetch origin
git log origin/feature/JIRA-456 --oneline
# b2c3d4e fix(auth): token expiry edge case

git switch my-feature
git cherry-pick b2c3d4e
```

### 4. Cherry-pick a range of commits

```bash
git log --oneline feature/JIRA-113
# 1a4b5c6 feat: add export controller  ← end
# 9f3e2d1 feat: add export service
# 7d1e4f0 feat: add export repository  ← start

# Cherry-pick all three onto release/1.2.0 (inclusive range with ^)
git switch release/1.2.0
git cherry-pick 7d1e4f0^..1a4b5c6
```

---

## Handling Conflicts

If a cherry-picked commit conflicts with the current branch state:

```bash
# 1. Resolve the conflict in the affected files
# 2. Stage the resolved files
git add src/main/java/com/example/TransactionService.java

# 3. Continue the cherry-pick
git cherry-pick --continue

# Or abort — return to state before cherry-pick started
git cherry-pick --abort

# Or skip the conflicting commit in a range
git cherry-pick --skip
```

---

## Useful Flags

| Flag | Meaning |
|---|---|
| `-x` | Append `(cherry picked from commit <sha>)` to the message |
| `-e` | Open editor to change the commit message |
| `-n` / `--no-commit` | Apply changes to the index but do not commit (lets you combine multiple cherry-picks into one commit) |
| `--signoff` | Add a `Signed-off-by` trailer |
| `--continue` | Continue after resolving conflicts |
| `--abort` | Abort and restore original state |
| `--skip` | Skip the current commit in a range pick |
| `--mainline N` | Specify parent number when cherry-picking a merge commit |

### `-x` flag — traceability

Use `-x` when backporting to release branches so the commit message records where it came from:

```bash
git cherry-pick -x a3f9bc2
# Resulting commit message:
# fix(transactions): resolve NPE on null description (JIRA-999)
#
# (cherry picked from commit a3f9bc2)
```

---

## Cherry-Pick vs Merge vs Rebase

| | Cherry-pick | Merge | Rebase |
|---|---|---|---|
| Copies single commits | ✅ | ❌ | ❌ |
| Preserves original commit | ✅ | ✅ | ❌ |
| Keeps full branch history | ❌ | ✅ | ❌ |
| Linear result | ✅ | ❌ | ✅ |
| Duplicates commits | ✅ (new SHA) | ❌ | ✅ (new SHA) |
| Best for | Hotfix backports, rescue commits | Integrating branches | Updating a feature branch |

---

:::warning[Avoid Cherry-Picking as a Substitute for Merging]
Cherry-picking duplicates commits, and duplicate commits cause confusion and conflicts down the line when the originating branch is eventually merged. If you need all of a branch's changes, merge it. Reserve cherry-pick for **specific, targeted** commit transport — particularly hotfix backports.
:::

---

## Interview Questions

### Q: What is the best use case for cherry-pick in release operations?
**A:** Backporting targeted hotfix commits from main to maintenance branches without pulling unrelated features.

### Q: Why can excessive cherry-picking create long-term maintenance issues?
**A:** It duplicates history and increases future conflict complexity when branches eventually merge.

### Q: How does -x help in regulated or audited environments?
**A:** It embeds source commit traceability directly in commit messages, improving audit trails.

### Q: When should you avoid cherry-picking and prefer merge/rebase?
**A:** When you need most or all branch changes; cherry-pick is for selective transport, not branch integration.

### Q: How do you cherry-pick safely under incident pressure?
**A:** Pick minimal commits, run targeted validation, and verify no hidden dependency commits were omitted.

### Q: What is a common pitfall with cherry-picking merge commits?
**A:** Missing parent selection context; you must specify the correct mainline parent or results can be incorrect.
