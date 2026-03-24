---
id: commit
title: git commit — Recording Changes
sidebar_label: commit
description: '`git commit` takes everything in the **index (staging area)** and creates
  a permanent, immutable snapshot in the repository. Each commit has:'
tags:
- technical-knowledge
- git
- basics
- commit
---
# `git commit` — Recording Changes

## What It Does

`git commit` takes everything in the **index (staging area)** and creates a permanent, immutable snapshot in the repository. Each commit has:

- A **SHA-1 hash** (unique identifier, e.g. `a3f9bc2`)
- A **tree** (pointer to the full project snapshot)
- One or more **parent commits** (forming the history graph)
- **Author** name, email, and timestamp
- **Committer** name, email, and timestamp
- A **commit message**

Commits are immutable. Once created, the content of a commit never changes (though you can create new commits that replace them — see [rebase](../branching/rebase), [squash](../history/squash), [fixup](../history/fixup)).

---

## Syntax

```bash
git commit [options]
```

---

## Common Usage

### Commit with an inline message
```bash
git commit -m "feat(transactions): add date range filter to transaction listing"
```

### Commit and open an editor for a full message
```bash
git commit
# Opens $EDITOR (vim, nano, VS Code, etc.)
```

### Stage all tracked modifications and commit in one step
Skips `git add` for already-tracked files. Does **not** include new untracked files.
```bash
git commit -am "fix(auth): resolve token refresh race condition"
```

### Amend the last commit
Change the message or add forgotten files to the most recent commit. Only safe before pushing.
```bash
# Change just the message
git commit --amend -m "fix(auth): resolve token refresh race condition under load"

# Add a forgotten file to the last commit without changing the message
git add src/main/java/com/example/AuthService.java
git commit --amend --no-edit
```

### Empty commit (useful for triggering CI)
```bash
git commit --allow-empty -m "chore: trigger CI pipeline"
```

---

## Writing Good Commit Messages

Good commit messages are the single most impactful thing you can do for long-term code maintainability. They explain **why** a change was made — the code itself shows **what** changed.

### The Seven Rules of a Great Commit Message

1. **Separate subject from body** with a blank line
2. **Limit subject line to 72 characters**
3. **Use imperative mood** in the subject (`Add`, `Fix`, `Remove` — not `Added`, `Fixed`)
4. **Do not end the subject with a period**
5. **Wrap body at 72 characters**
6. **Explain what and why in the body**, not how
7. **Reference issue/ticket numbers** in the footer

### Conventional Commits Format

The [Conventional Commits](../workflows/conventional-commits) specification adds a machine-readable structure:

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

**Types:**

| Type | When to Use |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `refactor` | Code change that is not a fix or feature |
| `test` | Adding or updating tests |
| `docs` | Documentation only |
| `chore` | Build process, dependency updates, tooling |
| `perf` | Performance improvement |
| `ci` | CI/CD configuration changes |
| `revert` | Reverts a previous commit |
| `style` | Formatting — no logic change |

### Full Example

```
feat(transactions): add CSV export with date range filter

Users can now export their transaction history to CSV from the
transaction history page. Exports honour the active date range
filter and include all visible columns.

The export is generated server-side and streamed to avoid loading
large result sets into memory. Uses Spring's StreamingResponseBody
with a 30-second write timeout.

Closes #JIRA-113
Co-authored-by: Jane Smith <jane@example.com>
```

---

## Commit Signing (GPG / SSH)

Sign commits to prove authorship. Required in some enterprise environments:

```bash
# Configure GPG signing globally
git config --global commit.gpgsign true
git config --global user.signingkey YOUR_GPG_KEY_ID

# Sign a single commit
git commit -S -m "feat: signed commit"

# Verify commit signatures
git log --show-signature
```

---

## Useful Flags Summary

| Flag | Meaning |
|---|---|
| `-m "msg"` | Inline commit message |
| `-a` | Stage all tracked changes before committing |
| `--amend` | Rewrite the last commit |
| `--no-edit` | Amend without changing the message |
| `--allow-empty` | Commit with no changes |
| `-S` | GPG-sign the commit |
| `--dry-run` | Show what would be committed without committing |
| `-v` | Show the diff in the editor when writing the message |
| `--fixup <sha>` | Create a fixup commit for use with `--autosquash` |
| `--squash <sha>` | Create a squash commit for use with `--autosquash` |

---

## Setting Up Your Editor

```bash
# VS Code
git config --global core.editor "code --wait"

# IntelliJ IDEA
git config --global core.editor "idea --wait"

# Nano (simple)
git config --global core.editor "nano"

# Vim
git config --global core.editor "vim"
```

---

:::tip Commit Early, Commit Often — Then Clean Up
Make small, frequent commits while working (even messy ones). Before opening a PR, use interactive rebase (`git rebase -i`) to squash and rewrite them into clean, logical commits. You get the safety of frequent saves and the clarity of clean history. See [Squash](../history/squash) and [Fixup](../history/fixup).
:::
