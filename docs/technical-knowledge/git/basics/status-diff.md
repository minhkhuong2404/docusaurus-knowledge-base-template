---
id: status-diff
title: git status & git diff — Inspecting Changes
sidebar_label: status & diff
description: '`git status` shows the state of your working tree and index relative
  to the current `HEAD` commit.'
tags:
- technical-knowledge
- git
- basics
- status-diff
---
# `git status` & `git diff` — Inspecting Changes

## git status

`git status` shows the state of your working tree and index relative to the current `HEAD` commit.

```bash
git status       # full output
git status -s    # short/compact format
git status -b    # include branch and tracking info
```

### Reading the output

```
On branch feature/JIRA-123
Your branch is ahead of 'origin/feature/JIRA-123' by 2 commits.

Changes to be committed:        ← in the index (staged)
  (use "git restore --staged <file>..." to unstage)
        modified:   src/main/java/com/example/TransactionService.java
        new file:   src/main/java/com/example/dto/ExportRequest.java

Changes not staged for commit:  ← in working tree, not staged
  (use "git add <file>..." to update what will be committed)
        modified:   src/main/resources/application.yml

Untracked files:                ← new files Git doesn't know about
        src/test/java/com/example/ExportServiceTest.java
```

### Short format

```bash
git status -s
# M  TransactionService.java     ← staged modification
#  M application.yml             ← unstaged modification
# A  dto/ExportRequest.java      ← staged new file
# ?? ExportServiceTest.java      ← untracked
```

| Symbol | Meaning |
|---|---|
| `M` (left column) | Staged modification |
| `M` (right column) | Unstaged modification |
| `A` | Staged new file |
| `D` | Deleted |
| `R` | Renamed |
| `??` | Untracked |
| `!!` | Ignored |

---

## git diff

`git diff` shows the actual line-by-line changes between states.

### Unstaged changes (working tree vs index)
```bash
git diff
# Shows what you've changed but NOT yet staged
```

### Staged changes (index vs last commit)
```bash
git diff --staged
# or:
git diff --cached
# Shows what WILL go into the next commit
```

### Between two commits
```bash
git diff abc1234 def5678
git diff HEAD~3 HEAD
git diff v1.1.0 v1.2.0
```

### Between two branches
```bash
git diff main feature/JIRA-123
git diff origin/main HEAD
```

### A specific file only
```bash
git diff HEAD -- src/main/java/com/example/TransactionService.java
```

### Stat summary (no line detail)
```bash
git diff --stat
git diff --stat main..feature/JIRA-123
# Output:
# src/main/java/.../TransactionService.java | 24 +++++++----
# src/main/java/.../ExportController.java   | 51 +++++++++++++++++++++
# 2 files changed, 64 insertions(+), 11 deletions(-)
```

### Word-level diff (easier to read for prose/config changes)
```bash
git diff --word-diff
```

---

## Reading a Diff

```diff
diff --git a/src/main/java/com/example/TransactionService.java b/src/main/java/com/example/TransactionService.java
index 3b1f2c4..9a0e7f1 100644
--- a/src/main/java/com/example/TransactionService.java   ← old version
+++ b/src/main/java/com/example/TransactionService.java   ← new version
@@ -24,7 +24,10 @@ public class TransactionService {    ← hunk header

     public Page<TransactionDto> findTransactions(...) {
-        validateDateRange(fromDate, toDate);           ← removed line (red)
+        validateDateRange(fromDate, toDate);           ← added line (green)
+        log.debug("Fetching for userId={}", userId);  ← new line
         return transactionRepository.findBy...
     }
```

- **`---`** = the old (before) version
- **`+++`** = the new (after) version
- **`@@`** = hunk header showing line numbers
- **`-`** lines = removed
- **`+`** lines = added
- Unchanged context lines have no prefix

---

## Useful Flags Summary

### diff flags

| Flag | Meaning |
|---|---|
| `--staged` / `--cached` | Diff index vs HEAD (what's staged) |
| `--stat` | Summary of files changed and line counts |
| `--name-only` | Only show filenames |
| `--name-status` | Filenames with M/A/D status |
| `--word-diff` | Highlight changes at word level |
| `--ignore-space-change` | Ignore whitespace changes |
| `-U<N>` | Show N lines of context (default 3) |
| `--color-words` | Color-code word-level changes inline |

---

:::tip Use Your IDE Diff Tool
For complex diffs, open your IDE's diff viewer. You can configure Git to use IntelliJ IDEA's diff tool:
```bash
git config --global diff.tool intellij
git config --global difftool.intellij.cmd 'idea diff "$LOCAL" "$REMOTE"'
git difftool HEAD~1
```
:::

## Interview Questions (Senior Level)

1. How do you establish a diff-review routine that catches risky changes early?
2. When should reviewers insist on split commits based on `status`/`diff` output?
3. What diff views are most useful for config-heavy versus code-heavy changes?
4. How do you avoid whitespace-only noise masking critical logic edits?

Short answer guide:
- Review staged and unstaged deltas separately before commit.
- Split mixed-intent changes to improve safety and traceability.
- Use word/stat/name-status modes based on change type.
- Apply ignore-whitespace views carefully, then re-check full diff.
