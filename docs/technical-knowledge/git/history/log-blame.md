---
id: log-blame
title: git log & git blame — Exploring History
sidebar_label: log & blame
description: '`git log` shows the commit history of the current branch — or any branch,
  range, file, or author you specify.'
tags:
- technical-knowledge
- git
- history
- log-blame
---
# `git log` & `git blame` — Exploring History

## git log

`git log` shows the commit history of the current branch — or any branch, range, file, or author you specify.

---

### Basic Usage

```bash
git log                        # full log, newest first
git log --oneline              # one line per commit
git log --oneline --graph      # ASCII graph of branch topology
git log --oneline --graph --all  # all branches
```

### Filtering by Author, Date, or Message

```bash
# By author
git log --author="Jane Smith"
git log --author="jane@example.com"

# By date range
git log --since="2024-01-01" --until="2024-01-31"
git log --since="2 weeks ago"
git log --after="yesterday"

# By commit message keyword
git log --grep="JIRA-123"
git log --grep="fix" --grep="auth" --all-match   # both terms must appear

# By branch/range
git log main..feature/JIRA-123          # commits in feature not in main
git log feature/JIRA-123..main          # commits in main not in feature
git log origin/main..HEAD               # your unpushed commits
```

### Filtering by File or Directory

```bash
# Commits that touched a specific file
git log -- src/main/java/com/example/TransactionService.java

# Commits that touched any file in a directory
git log -- src/main/java/com/example/service/

# Commits that added or removed a specific string (the pickaxe)
git log -S "findByUserIdAndCreatedAtBetween"   # exact string
git log -G "findBy.*Between"                   # regex
```

The **pickaxe** (`-S` / `-G`) is extremely powerful for finding exactly when a method was introduced or removed.

### Pretty Formats

```bash
# Standard formats
git log --format=oneline
git log --format=short
git log --format=medium        # default
git log --format=full
git log --format=fuller

# Custom format
git log --format="%h  %ad  %an  %s" --date=short
# a3f9bc2  2024-01-15  Jane Smith  feat(transactions): add date range filter

# Show changed files per commit
git log --stat
git log --name-only
git log --name-status           # M/A/D status per file
```

### Useful Aliases for log

```bash
# Pretty one-line graph with author and date
git log --oneline --graph --decorate \
  --format="%C(yellow)%h%C(reset) %C(cyan)%ad%C(reset) %C(green)%an%C(reset) %s" \
  --date=short

# Save as alias
git config --global alias.lg \
  "log --oneline --graph --decorate --all \
   --format='%C(yellow)%h%C(reset) %C(cyan)%ad%C(reset) %C(green)%an%C(reset) %s' \
   --date=short"

# Usage:
git lg
```

---

## git blame

`git blame` annotates every line of a file with the commit SHA, author, and date of the last change to that line. It answers: *"Who wrote this line, and when?"*

```bash
git blame src/main/java/com/example/TransactionService.java
```

Output:

```
a3f9bc2 (Jane Smith   2024-01-15 10:23:11 +0700 42)     public Page<TransactionDto> findTransactions(
9f3e2d1 (Bob Johnson  2024-01-20 14:01:55 +0700 43)             UUID userId,
9f3e2d1 (Bob Johnson  2024-01-20 14:01:55 +0700 44)             LocalDate fromDate,
9f3e2d1 (Bob Johnson  2024-01-20 14:01:55 +0700 45)             LocalDate toDate,
a3f9bc2 (Jane Smith   2024-01-15 10:23:11 +0700 46)             Pageable pageable) {
```

### Blame specific lines

```bash
git blame -L 40,60 src/main/java/com/example/TransactionService.java
```

### Blame a specific revision (point in time)

```bash
git blame v1.1.0 -- src/main/java/com/example/TransactionService.java
git blame HEAD~10 -- src/main/java/com/example/TransactionService.java
```

### Ignore whitespace changes

```bash
git blame -w src/main/java/com/example/TransactionService.java
```

### Detect moved or copied lines (`-C`, `-M`)

Find the commit that originally wrote a line, even if it was later moved or copied to this file:

```bash
git blame -C -C src/main/java/com/example/TransactionService.java
# -C    detect lines copied from other files in same commit
# -C -C detect lines moved from any file across the whole history
```

---

## Following a Line's History

Once `git blame` gives you a SHA, drill deeper:

```bash
# See the full diff of that commit
git show a3f9bc2

# See what the file looked like at that commit
git show a3f9bc2:src/main/java/com/example/TransactionService.java

# Then blame that commit's parent to see the line's history before that change
git blame a3f9bc2^ -- src/main/java/com/example/TransactionService.java
```

Repeat this to walk a line's full history backward through time.

---

## git log Flags Summary

| Flag | Meaning |
|---|---|
| `--oneline` | One line per commit |
| `--graph` | ASCII branch topology |
| `--all` | Include all branches and tags |
| `--decorate` | Show branch/tag labels on commits |
| `--stat` | Show files changed per commit |
| `--patch` / `-p` | Show full diff per commit |
| `--follow` | Follow file renames |
| `-S <string>` | Pickaxe: commits that added/removed string |
| `-G <regex>` | Pickaxe: commits matching regex in diff |
| `--author` | Filter by author |
| `--grep` | Filter by commit message |
| `--since` / `--after` | Filter by date |
| `--until` / `--before` | Filter by date |
| `-N` | Limit to N commits |
| `--no-merges` | Exclude merge commits |
| `--merges` | Show only merge commits |

---

:::tip IDE Integration
In IntelliJ IDEA, right-click any line → **Git → Annotate with Git Blame** for an inline blame view with full commit details on hover. For VS Code, the **GitLens** extension provides the same. Use these for day-to-day blame — use the CLI for scripting and custom queries.
:::

## Interview Questions (Senior Level)

1. How do you investigate a production regression quickly using `git log`, `-S/-G`, and `blame` without chasing noise?
2. What are the limits of `git blame` in heavily refactored codebases, and how do you mitigate false ownership conclusions?
3. How would you build a forensic checklist to trace when a risky behavior entered the codebase?
4. Which history views do you standardize for release-readiness audits?

Short answer guide:
- Combine pickaxe search, focused ranges, and targeted file history.
- Use `-w`, `-C`, and prior revisions to follow moved code.
- Correlate commit diffs with incident timeline and deployment metadata.
- Keep repeatable log formats and tags for release cut verification.
