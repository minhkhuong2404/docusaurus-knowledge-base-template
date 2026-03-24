---
id: fetch-pull
title: git fetch & git pull — Getting Remote Changes
sidebar_label: fetch & pull
description: '**The golden rule:** Prefer `git fetch` + manual inspect over `git pull`
  when you want to see what''s changed before integrating. Use `git pull --rebase`
  for.'
tags:
- technical-knowledge
- git
- basics
- fetch-pull
---
# `git fetch` & `git pull` — Getting Remote Changes

## The Difference

| Command | What it does |
|---|---|
| `git fetch` | Downloads remote commits and updates remote-tracking refs (`origin/main`) — **does not touch your working tree or local branches** |
| `git pull` | Runs `git fetch` and then immediately integrates those changes into your current branch (via merge or rebase) |

**The golden rule:** Prefer `git fetch` + manual inspect over `git pull` when you want to see what's changed before integrating. Use `git pull --rebase` for routine updates to keep history linear.

---

## git fetch

### Fetch from origin (default remote)
```bash
git fetch
git fetch origin
```

### Fetch a specific branch
```bash
git fetch origin main
```

### Fetch all remotes
```bash
git fetch --all
```

### Fetch and prune deleted remote branches
```bash
git fetch --prune
# or configure it globally:
git config --global fetch.prune true
```

### Inspect what was fetched before integrating
```bash
# View commits that are on origin/main but not on your local main
git log main..origin/main --oneline

# See the diff
git diff main origin/main

# Then merge when ready
git merge origin/main
```

---

## git pull

`git pull` = `git fetch` + `git merge` (by default) or `git fetch` + `git rebase` (with `--rebase`).

### Default pull (fetch + merge)
```bash
git pull origin main
```
This creates a merge commit if your branch has diverged from the remote, which can clutter history.

### Pull with rebase (recommended for feature branches)
```bash
git pull --rebase origin main
```
This replays your local commits on top of the fetched commits, keeping history linear without a merge commit.

### Set rebase as the default pull strategy globally
```bash
git config --global pull.rebase true
```

### Pull and automatically stash/unstash local changes
```bash
git pull --rebase --autostash
# Stashes uncommitted changes, pulls, replays commits, then pops the stash
```

---

## Handling Diverged History

When your branch and the remote have both moved forward, you have three options:

```
Local:   A -- B -- C         (your commits)
                    \
Remote:  A -- B -- D -- E   (remote commits you don't have yet)
```

**Option 1: Merge (creates a merge commit)**
```bash
git pull origin main
# Result: A -- B -- C -- M   (M = merge commit of C and E)
#                    \  /
#                     D -- E
```

**Option 2: Rebase (linear — preferred for feature branches)**
```bash
git pull --rebase origin main
# Result: A -- B -- D -- E -- C'  (C replayed on top of E)
```

**Option 3: Fast-forward only (reject if diverged)**
```bash
git pull --ff-only origin main
# Fails if branches have diverged — forces you to decide explicitly
```

---

## Useful Flags Summary

### fetch flags

| Flag | Meaning |
|---|---|
| `--all` | Fetch from all remotes |
| `--prune` | Remove remote-tracking refs for deleted remote branches |
| `--tags` | Fetch all tags |
| `--depth=N` | Shallow fetch — only last N commits |
| `-v` | Verbose output |

### pull flags

| Flag | Meaning |
|---|---|
| `--rebase` | Rebase instead of merge after fetch |
| `--ff-only` | Only fast-forward — abort if history diverged |
| `--autostash` | Stash before pull, pop after |
| `--no-commit` | Fetch and merge but don't auto-commit the merge |
| `--prune` | Prune stale remote-tracking branches during fetch |

---

:::tip Establish a Routine
Before starting work each day, run:
```bash
git fetch --prune
git log HEAD..origin/main --oneline   # see what teammates pushed
git pull --rebase origin main         # catch up
```
This keeps your branch current and avoids large, painful merges at PR time.
:::
