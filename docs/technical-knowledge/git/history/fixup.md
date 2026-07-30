---
id: fixup
title: git fixup — Amending Previous Commits
sidebar_label: fixup
description: A **fixup** commit is a special type of squash commit that targets a
  specific earlier commit for amendment. When you run `git rebase --autosquash`, Git.
tags:
- technical-knowledge
- git
- history
- fixup
---
# `git fixup` — Amending Previous Commits

## What is a Fixup?

A **fixup** commit is a special type of squash commit that targets a specific earlier commit for amendment. When you run `git rebase --autosquash`, Git automatically:

1. Moves the fixup commit directly below its target
2. Squashes it into the target commit
3. Discards the fixup commit's message (unlike `squash`, which keeps it)

This is the cleanest workflow for correcting earlier commits in a feature branch without disturbing everything else.

---

## The Workflow

### Step 1 — Find the SHA of the commit you want to fix

```bash
git log --oneline
# 1a4b5c6 feat(transactions): add controller endpoint
# 9f3e2d1 feat(transactions): add service logic         ← I need to fix this one
# 7d1e4f0 feat(transactions): add repository
# a3f9bc2 feat(transactions): add domain model
```

### Step 2 — Make your fix and create a fixup commit

```bash
# Edit the file
vim src/main/java/com/example/TransactionService.java

# Stage it
git add src/main/java/com/example/TransactionService.java

# Create a fixup commit targeting the SHA of the commit to fix
git commit --fixup 9f3e2d1
# Creates a commit with the message: "fixup! feat(transactions): add service logic"
```

Git automatically prefixes the message with `fixup! ` followed by the target commit's subject. This is the token `--autosquash` recognises.

```bash
git log --oneline
# b7e2a1f fixup! feat(transactions): add service logic   ← new fixup commit
# 1a4b5c6 feat(transactions): add controller endpoint
# 9f3e2d1 feat(transactions): add service logic
# 7d1e4f0 feat(transactions): add repository
# a3f9bc2 feat(transactions): add domain model
```

You can continue working and create as many fixup commits as needed.

### Step 3 — Clean up with autosquash rebase

When ready to clean up (before opening a PR):

```bash
git rebase -i --autosquash origin/main
```

Git automatically rearranges the todo list — moving fixup commits below their targets and marking them as `fixup`:

```
pick a3f9bc2 feat(transactions): add domain model
pick 7d1e4f0 feat(transactions): add repository
pick 9f3e2d1 feat(transactions): add service logic
fixup b7e2a1f fixup! feat(transactions): add service logic   ← auto-arranged
pick 1a4b5c6 feat(transactions): add controller endpoint
```

Save and close. Git squashes `b7e2a1f` into `9f3e2d1` and discards the fixup message. The result is clean history as if the original commit was always correct.

---

## Make Autosquash the Default

```bash
git config --global rebase.autoSquash true
# Now git rebase -i always enables autosquash
```

---

## `--fixup` vs `--squash`

| | `--fixup` | `--squash` |
|---|---|---|
| Message | Discarded (prefixed `fixup! `) | Kept (prefixed `squash! `) |
| Good for | Silent corrections — typos, missed null checks, formatting | Meaningful additions worth documenting |

```bash
# Fixup (silent correction — message discarded)
git commit --fixup 9f3e2d1

# Squash (meaningful addition — message included in final commit)
git commit --squash 9f3e2d1
```

---

## Fixup with Amend (`--fixup=amend:`)

Git 2.32+ supports fixup with message amendment in one step:

```bash
# Fix the changes AND reword the target commit's message
git commit --fixup=amend:9f3e2d1
```

This creates a `amend! ` prefixed commit that, during autosquash rebase, will both apply the changes AND open the editor to let you reword the target commit's message.

---

## Full Example in a Real Workflow

```bash
# Working on a feature branch
git switch -c feature/JIRA-123

# Make commits as you develop
git commit -m "feat(transactions): add domain model"
git commit -m "feat(transactions): add repository"
git commit -m "feat(transactions): add service"

# Reviewer asks you to fix a validation edge case in the service
vim src/main/java/com/example/TransactionService.java
git add .
git commit --fixup HEAD~0   # fixup the most recent commit
# or target a specific earlier commit:
git commit --fixup abc1234

# Add another fix from a review comment
vim src/main/java/com/example/dto/TransactionDto.java
git add .
git commit --fixup abc1234  # same target — multiple fixups are fine

# Before merging, clean up the entire branch
git rebase -i --autosquash origin/main

# Force push the cleaned branch
git push --force-with-lease origin feature/JIRA-123
```

---

:::tip[Set Up a Shell Alias]
Speed up the fixup workflow with a shell alias:

```bash
# .bashrc / .zshrc
alias gfix='git commit --fixup'

# Usage:
gfix 9f3e2d1
```

Combined with `git config --global rebase.autoSquash true`, this becomes the fastest way to maintain clean branch history.
:::

## Interview Questions

1. How does a `fixup`-first workflow improve review velocity compared with ad hoc amend/rebase usage?
2. What branch protection rules should accompany frequent `--autosquash` rewrites?
3. How do you coach teams to avoid losing context when fixup messages are discarded?
4. In which cases is `--fixup=amend:` a better choice than plain `--fixup`?

Short answer guide:
- Fixups separate correction intent from final history cleanup.
- Combine with protected main branches and controlled force-push on feature branches.
- Capture rationale in PR discussion and final curated commit messages.
- Use amend fixup when the original message itself needs correction.
