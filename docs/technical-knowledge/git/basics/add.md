---
id: add
title: git add — Staging Changes
sidebar_label: add
description: '`git add` moves changes from your **working tree** into the **index**
  (also called the staging area). Think of the index as a draft of your next commit
  — you.'
tags:
- technical-knowledge
- git
- basics
- add
---
# `git add` — Staging Changes

## What It Does

`git add` moves changes from your **working tree** into the **index** (also called the staging area). Think of the index as a draft of your next commit — you curate exactly what goes in before committing.

The index allows you to be intentional. You can edit ten files but only commit three of them, or stage only specific lines within a single file.

---

## Syntax

```bash
git add [options] [pathspec...]
```

---

## Common Usage

### Stage a specific file
```bash
git add src/main/java/com/example/TransactionService.java
```

### Stage all changes in the current directory (and subdirectories)
```bash
git add .
```

### Stage all tracked and untracked changes across the entire repo
```bash
git add -A
# or equivalently:
git add --all
```

### Stage only modifications and deletions (not new/untracked files)
```bash
git add -u
# or:
git add --update
```

### Stage a whole directory
```bash
git add src/main/java/com/example/service/
```

### Stage files matching a pattern
```bash
git add "*.java"
git add src/**/*.yml
```

---

## Interactive and Patch Staging

### Interactive staging (`-i`)
Opens a menu to selectively stage, unstage, or inspect files:

```bash
git add -i
```

### Patch mode (`-p`) — stage individual hunks
This is one of Git's most powerful features. Stage specific lines within a file, not the whole file:

```bash
git add -p
# or:
git add --patch
```

Git presents each changed "hunk" one at a time and asks what to do:

```
@@ -14,7 +14,9 @@ public class TransactionService {
     public Page<TransactionDto> findTransactions(...) {
-        validateDateRange(fromDate, toDate);
+        validateDateRange(fromDate, toDate);
+        log.debug("Fetching transactions for userId={}", userId);
         return transactionRepository.findBy...
     }

Stage this hunk [y,n,q,a,d,s,e,?]?
```

| Key | Action |
|---|---|
| `y` | Stage this hunk |
| `n` | Do not stage this hunk |
| `s` | Split into smaller hunks |
| `e` | Manually edit the hunk |
| `q` | Quit — stop staging |
| `a` | Stage all remaining hunks in this file |
| `d` | Skip this file and all remaining hunks |
| `?` | Show help |

This is useful when a file has two unrelated changes and you want to make two separate, focused commits.

---

## Viewing What Is Staged

After staging, check what is queued for the next commit:

```bash
# Show staged vs last commit (what will go into the commit)
git diff --staged

# Show working tree vs staged (what is NOT yet staged)
git diff

# High-level summary of staged, unstaged, and untracked files
git status
git status -s   # short format
```

---

## Unstaging Files

If you staged something by mistake:

```bash
# Unstage a specific file (keeps your working tree changes)
git restore --staged src/main/java/com/example/TransactionService.java

# Unstage everything
git restore --staged .

# Legacy syntax (still works):
git reset HEAD <file>
```

---

## Ignoring Files with `.gitignore`

Files listed in `.gitignore` will never be staged or tracked. Common entries for Java/Spring projects:

```gitignore
# Build output
target/
*.class
*.jar
*.war

# IDE files
.idea/
*.iml
.vscode/
.eclipse/

# Spring Boot
*.log
application-local.yml
application-secret.yml

# OS
.DS_Store
Thumbs.db

# Environment variables
.env
.env.local
```

Force-add a normally ignored file (use sparingly):
```bash
git add -f src/main/resources/application-template.yml
```

---

## Useful Flags Summary

| Flag | Meaning |
|---|---|
| `.` | All changes in current directory tree |
| `-A` / `--all` | All changes in the whole repo |
| `-u` / `--update` | Modifications + deletions only (no new files) |
| `-p` / `--patch` | Interactive hunk-by-hunk staging |
| `-i` / `--interactive` | Full interactive staging menu |
| `-n` / `--dry-run` | Show what would be added without doing it |
| `-v` / `--verbose` | Show files being added |

---

:::tip Commit Hygiene Starts Here
Use `git add -p` to keep commits small and focused. A commit titled `"fix: resolve NPE in TransactionService"` should only contain the fix — not an unrelated refactor you happened to do in the same session. Patch staging makes that easy.
:::
