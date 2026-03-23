---
id: remotes
title: git remote — Managing Remote Repositories
sidebar_label: Remotes
---

# Remotes — Managing Remote Repositories

## What is a Remote?

A **remote** is a named reference to another Git repository — typically hosted on GitHub, GitLab, Bitbucket, or an internal server. A remote stores a URL and a set of **remote-tracking branches** (`origin/main`, `origin/develop`) that are snapshots of the remote's branches as of the last `fetch`.

Most repositories have a single remote called `origin` (the repo you cloned from). Forks and multi-remote workflows add more.

---

## Viewing Remotes

```bash
# List remote names
git remote

# List remotes with their URLs
git remote -v
# origin  git@github.com:your-org/transaction-service.git (fetch)
# origin  git@github.com:your-org/transaction-service.git (push)

# Show detailed info about a specific remote
git remote show origin
```

---

## Adding and Removing Remotes

```bash
# Add a new remote
git remote add origin git@github.com:your-org/transaction-service.git
git remote add upstream git@github.com:original-org/transaction-service.git

# Remove a remote
git remote remove upstream

# Rename a remote
git remote rename origin github
```

---

## Changing a Remote URL

```bash
# Switch from HTTPS to SSH
git remote set-url origin git@github.com:your-org/transaction-service.git

# Switch from SSH to HTTPS
git remote set-url origin https://github.com/your-org/transaction-service.git
```

---

## Fork Workflow (Upstream + Origin)

When contributing to a project via a fork, you typically have two remotes:

```bash
# origin  = your fork
# upstream = the original repository

git remote add upstream git@github.com:original-org/transaction-service.git
git remote -v
# origin    git@github.com:your-username/transaction-service.git (fetch)
# origin    git@github.com:your-username/transaction-service.git (push)
# upstream  git@github.com:original-org/transaction-service.git (fetch)
# upstream  git@github.com:original-org/transaction-service.git (push)

# Keep your fork's main in sync with upstream
git fetch upstream
git switch main
git merge upstream/main
git push origin main
```

---

## Remote-Tracking Branches

Remote-tracking branches are **read-only local snapshots** of the remote's branches, updated on every `git fetch`. They follow the naming pattern `<remote>/<branch>`:

```bash
# View all remote-tracking branches
git branch -r
# origin/main
# origin/develop
# origin/feature/JIRA-123

# View local + remote
git branch -a

# Check how far behind/ahead you are
git log HEAD..origin/main --oneline    # remote commits you don't have
git log origin/main..HEAD --oneline    # your commits not yet on remote
```

---

## Pruning Stale Remote-Tracking Refs

After a remote branch is deleted, its remote-tracking ref lingers locally until pruned:

```bash
# Prune during fetch (recommended — set globally)
git fetch --prune
git config --global fetch.prune true

# Prune without fetching
git remote prune origin

# See which refs would be pruned (dry run)
git remote prune origin --dry-run
```

---

## Multiple Push Remotes

Push to multiple remotes simultaneously (e.g., GitHub + internal GitLab mirror):

```bash
git remote set-url --add --push origin git@github.com:your-org/repo.git
git remote set-url --add --push origin git@gitlab.internal:your-org/repo.git

git push origin main   # pushes to both URLs
```

---

## Useful Flags Summary

| Command | Meaning |
|---|---|
| `git remote -v` | List remotes with URLs |
| `git remote add <name> <url>` | Add a new remote |
| `git remote remove <name>` | Remove a remote |
| `git remote rename <old> <new>` | Rename a remote |
| `git remote set-url <name> <url>` | Change a remote's URL |
| `git remote show <name>` | Inspect a remote's branches and tracking status |
| `git remote prune <name>` | Remove stale remote-tracking refs |
| `git fetch --prune` | Fetch and prune in one step |

---

:::tip Use SSH Over HTTPS
SSH authentication (via key pair) is more convenient than HTTPS for daily use — no password prompts, and access tokens don't expire. Set up an SSH key once and all Git operations are frictionless:
```bash
ssh-keygen -t ed25519 -C "your@email.com"
cat ~/.ssh/id_ed25519.pub   # add this to GitHub/GitLab SSH settings
```
:::
