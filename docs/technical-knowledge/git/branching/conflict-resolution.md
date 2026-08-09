---
id: conflict-resolution
title: Conflict Resolution
sidebar_label: Conflict Resolution
description: A conflict occurs when two branches have made **different changes to
  the same line(s)** of the same file, and Git cannot automatically determine which
  version.
tags:
- technical-knowledge
- git
- branching
- conflict-resolution
---

import GitConflictResolutionDiagram from '@site/src/components/GitConflictResolutionDiagram';

# Conflict Resolution

<GitConflictResolutionDiagram />

## What is a Merge Conflict?

A conflict occurs when two branches have made **different changes to the same line(s)** of the same file, and Git cannot automatically determine which version to keep. Conflicts can happen during `merge`, `rebase`, `cherry-pick`, `revert`, and `stash pop`.

Conflicts are normal. They are not errors — they are Git asking you to make a decision.

---

## Anatomy of a Conflict Marker

```java
<<<<<<< HEAD
    public Page<TransactionDto> findTransactions(UUID userId, Pageable pageable) {
        return transactionRepository.findByUserId(userId, pageable)
||||||| base (with --diff3)
    public Page<TransactionDto> findTransactions(UUID userId, Pageable pageable) {
        return transactionRepository.findAll(pageable)
=======
    public Page<TransactionDto> findTransactions(
            UUID userId, LocalDate fromDate, LocalDate toDate, Pageable pageable) {
        validateDateRange(fromDate, toDate);
        return transactionRepository.findByUserIdAndCreatedAtBetween(
                userId, toInstant(fromDate), toInstant(toDate), pageable)
>>>>>>> feature/JIRA-123
```

| Section | Meaning |
|---|---|
| `<<<<<<< HEAD` to `\|\|\|\|\|\|\| base` | Your current branch version |
| `\|\|\|\|\|\|\| base` to `=======` | The common ancestor (shown with `--diff3`) |
| `=======` to `>>>>>>> feature/JIRA-123` | The incoming branch version |

Enable the `diff3` style globally — the base section is invaluable for understanding why each side changed what it did:

```bash
git config --global merge.conflictstyle diff3
```

---

## Step-by-Step Resolution

### Step 1 — Identify all conflicted files

```bash
git status
# Both modified: src/main/java/com/example/TransactionService.java
# Both modified: src/main/resources/application.yml
```

### Step 2 — Open each conflicted file and resolve

Edit the file to what the final correct version should be. **Remove all conflict markers** (`<<<<<<<`, `|||||||`, `=======`, `>>>>>>>`):

```java
// Resolved version — keeps the new signature with date range filter
public Page<TransactionDto> findTransactions(
        UUID userId, LocalDate fromDate, LocalDate toDate, Pageable pageable) {
    validateDateRange(fromDate, toDate);
    return transactionRepository.findByUserIdAndCreatedAtBetween(
            userId, toInstant(fromDate), toInstant(toDate), pageable);
}
```

### Step 3 — Stage the resolved file

```bash
git add src/main/java/com/example/TransactionService.java
git add src/main/resources/application.yml
```

### Step 4 — Complete the operation

```bash
# After a merge:
git merge --continue
# or: git commit

# After a rebase:
git rebase --continue

# After a cherry-pick:
git cherry-pick --continue
```

### Abort and start over

```bash
git merge --abort
git rebase --abort
git cherry-pick --abort
```

---

## Using a Merge Tool

### Configure IntelliJ IDEA as the merge tool

```bash
git config --global merge.tool intellij
git config --global mergetool.intellij.cmd \
  'idea merge "$LOCAL" "$REMOTE" "$BASE" "$MERGED"'
git config --global mergetool.intellij.trustExitCode true

# Launch the tool for all conflicted files
git mergetool
```

### VS Code

```bash
git config --global merge.tool vscode
git config --global mergetool.vscode.cmd \
  'code --wait "$MERGED"'
```

### Prefer one side entirely

```bash
# Accept all changes from the incoming branch (theirs)
git checkout --theirs src/main/resources/application.yml
git add src/main/resources/application.yml

# Accept all changes from the current branch (ours)
git checkout --ours src/main/resources/application.yml
git add src/main/resources/application.yml
```

---

## Preventing Conflicts

| Practice | How it helps |
|---|---|
| Short-lived branches | Less divergence = fewer conflicts |
| Pull/rebase frequently | Stay close to main; conflicts are smaller |
| Small, focused commits | Easier to reason about when conflicts do occur |
| Team ownership of files | Avoid two people editing the same file |
| Feature flags | Merge incomplete features to main early behind a flag |

---

:::tip[Resolving Conflicts in Rebase]
During a rebase, Git replays commits one at a time. You may need to resolve the same logical conflict multiple times across different commits. If this happens frequently, consider squashing your commits first (`git rebase -i`), then rebasing the single resulting commit — you will only need to resolve the conflict once.
:::

---

## Interview Questions

### Q: What is the first thing you do when conflict count is high?
**A:** Pause and understand semantic intent on both branches before editing files. Blind conflict marker edits are high risk.

### Q: Why is conflictstyle diff3 useful for senior workflows?
**A:** The base section reveals original intent and helps decide whether to preserve, replace, or combine both sides correctly.

### Q: How do you reduce repeated conflict resolution during long rebases?
**A:** Squash logically related commits first and rebase fewer commits with cleaner boundaries.

### Q: When is choosing --ours or --theirs acceptable?
**A:** For generated files or clearly authoritative config sources, not for business logic where both sides likely matter.

### Q: What process prevents conflict regressions after merge?
**A:** Run targeted tests around conflicted modules and include reviewer validation on conflict-heavy files.

### Q: How do teams systematically reduce merge conflicts over time?
**A:** Short-lived branches, smaller PRs, and clear file ownership conventions reduce overlapping edits.
