---
id: stash
title: git stash — Shelving Work in Progress
sidebar_label: stash
---

# `git stash` — Shelving Work in Progress

## What It Does

`git stash` temporarily shelves (stashes) your uncommitted changes — both staged and unstaged — so you can switch context without committing half-finished work. The working tree is restored to a clean state matching `HEAD`. You can return to your stashed work at any time.

---

## Basic Usage

### Save current changes to the stash

```bash
# Stash staged + unstaged tracked changes
git stash

# Stash with a descriptive message (recommended)
git stash push -m "wip: transaction export — adding streaming response"

# Also stash untracked (new, unstaged) files
git stash push -u -m "wip: adding export feature including new files"

# Also stash ignored files (rarely needed)
git stash push -a -m "full stash including ignored files"
```

### View the stash list

```bash
git stash list
# stash@{0}: On feature/JIRA-113: wip: transaction export — adding streaming response
# stash@{1}: On feature/JIRA-123: wip: work in progress before standup
# stash@{2}: WIP on main: a3f9bc2 fix: null check
```

### Apply the most recent stash (keeps it in the list)

```bash
git stash apply
git stash apply stash@{2}   # apply a specific stash
```

### Pop the most recent stash (apply + remove from list)

```bash
git stash pop
git stash pop stash@{1}     # pop a specific stash
```

### Inspect a stash before applying

```bash
# Show the diff of a stash
git stash show -p stash@{0}

# Show just the changed files
git stash show stash@{0}
```

### Drop (delete) a stash

```bash
git stash drop stash@{1}    # delete a specific stash
git stash clear             # delete ALL stashes (cannot be undone)
```

---

## Stashing Only Specific Files

Use `--patch` to selectively stash individual hunks:

```bash
git stash push -p -m "wip: stash only the export changes"
```

Or stash specific files:

```bash
git stash push -m "wip: stash service only" \
  src/main/java/com/example/TransactionService.java
```

---

## Stash and Branch

Create a new branch from a stash — useful when your stash has grown into a proper feature:

```bash
git stash branch feature/JIRA-113-export stash@{0}
# Creates a new branch from the commit where the stash was created,
# applies the stash, and drops it on success
```

---

## Common Workflow Scenarios

### Switch branches mid-work

```bash
# You're halfway through a feature and someone needs a hotfix review
git stash push -m "wip: export feature half done"
git switch hotfix/JIRA-999

# Review, comment, and return
git switch feature/JIRA-113
git stash pop
```

### Pull the latest before applying your WIP

```bash
git stash push -m "wip: before pulling main"
git pull --rebase origin main
git stash pop   # if there are conflicts, resolve them as usual
```

### Use --autostash with pull

```bash
# Git automatically stashes, pulls, then pops — all in one command
git pull --rebase --autostash
```

---

## Useful Flags Summary

| Flag | Meaning |
|---|---|
| `push -m "msg"` | Stash with a descriptive message |
| `-u` / `--include-untracked` | Also stash new untracked files |
| `-a` / `--all` | Also stash ignored files |
| `-p` / `--patch` | Interactively choose hunks to stash |
| `apply` | Apply stash without removing from list |
| `pop` | Apply stash and remove from list |
| `drop` | Delete a stash entry |
| `clear` | Delete all stash entries |
| `show -p` | Show full diff of a stash |
| `branch <name>` | Create a branch from a stash |
| `list` | Show all stash entries |

---

:::tip Prefer WIP Commits Over Long-Lived Stashes
For work that spans more than an hour, prefer creating a `git commit -m "wip: [description]"` instead of leaving it in the stash. WIP commits are visible in `git log`, included in pushes (as backup), and are recoverable via `git reflog`. Stashes are easy to forget and are not pushed to remotes. Amend or squash the WIP commit later.
:::
