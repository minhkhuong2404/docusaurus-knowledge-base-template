---
id: push
title: git push — Uploading to a Remote
sidebar_label: push
description: '`git push` uploads your local commits to a remote repository, making
  them available to other team members. It transfers only the objects (commits, trees.'
tags:
- technical-knowledge
- git
- basics
- push
---
# `git push` — Uploading to a Remote

## What It Does

`git push` uploads your local commits to a remote repository, making them available to other team members. It transfers only the objects (commits, trees, blobs) that the remote does not yet have, making it efficient.

A push is a **fast-forward operation by default** — the remote will only accept a push if its branch can be fast-forwarded to your commit (i.e., your local branch is ahead of the remote with no divergence). If the remote has commits you don't have, Git will reject the push and ask you to pull first.

---

## Syntax

```bash
git push [remote] [branch]
```

---

## Common Usage

### Push current branch to origin
```bash
git push origin feature/JIRA-123-add-export
```

### Push and set upstream tracking (first push of a new branch)
```bash
git push -u origin feature/JIRA-123-add-export
# After this, plain `git push` and `git pull` work without specifying remote/branch
```

### Push to a differently named remote branch
```bash
git push origin local-branch:remote-branch
```

### Push all local branches
```bash
git push --all origin
```

### Push tags to remote
```bash
# Push a specific tag
git push origin v1.2.0

# Push all tags
git push --tags
```

### Delete a remote branch
```bash
git push origin --delete feature/JIRA-123-add-export
# or shorthand:
git push origin :feature/JIRA-123-add-export
```

---

## Force Push

Force push **replaces** the remote branch with your local branch, discarding any commits on the remote that are not in your local history. Use with extreme care.

### `--force` (dangerous — avoid on shared branches)
```bash
git push --force origin feature/my-branch
```
This can destroy your teammates' commits if they have pushed to the same branch.

### `--force-with-lease` (safer force push)
This is the correct force push to use. It refuses to force-push if the remote has commits you have not fetched — protecting against accidentally overwriting someone else's work:

```bash
git push --force-with-lease origin feature/my-branch
```

**When is force push acceptable?**
- After rebasing or amending your own feature branch (before others have based work on it)
- Cleaning up a PR branch before merge
- Pushing to your own fork

**When is force push NEVER acceptable?**
- `main` / `master`
- `develop`
- `release/**`
- Any branch that is shared with teammates who have already pulled from it

### Protect branches from force push

Configure branch protection in GitHub / GitLab / Bitbucket:

```yaml
# .github/branch-protection.yml (GitHub Actions / API)
# Require PRs, prevent force push, require status checks on main:
branches:
  - name: main
    protection:
      required_pull_request_reviews:
        required_approving_review_count: 1
      allow_force_pushes: false
      allow_deletions: false
      required_status_checks:
        strict: true
```

---

## Upstream Tracking

When a local branch tracks a remote branch, Git knows how far ahead or behind you are:

```bash
# Check tracking relationships
git branch -vv

# Output:
# * feature/JIRA-123   a3f9bc2 [origin/feature/JIRA-123: ahead 2] feat: add export
#   main               91bc3f0 [origin/main] chore: bump Spring Boot version

# Set tracking on an existing branch
git branch --set-upstream-to=origin/main main
```

---

## Push Hooks

Git runs hooks before and after push. Useful for pre-push validation:

```bash
# .git/hooks/pre-push  (must be executable: chmod +x)
#!/bin/bash

echo "Running pre-push checks..."

# Block push if tests fail
./mvnw test -q
if [ $? -ne 0 ]; then
  echo "❌ Tests failed — push blocked"
  exit 1
fi

echo "✅ Pre-push checks passed"
exit 0
```

---

## Useful Flags Summary

| Flag | Meaning |
|---|---|
| `-u` / `--set-upstream` | Set tracking and push |
| `--all` | Push all local branches |
| `--tags` | Push all tags |
| `--force` | Overwrite remote unconditionally (dangerous) |
| `--force-with-lease` | Force push only if remote hasn't changed (safe) |
| `--delete` | Delete a remote branch or tag |
| `--dry-run` | Show what would be pushed without doing it |
| `-v` / `--verbose` | Show details of what is being transferred |
| `--no-verify` | Skip pre-push hooks (use sparingly) |

---

:::warning Never Force-Push to Shared Branches
`git push --force` on `main` or `develop` will rewrite the public history and corrupt every teammate's local clone. Use `--force-with-lease` on feature branches only, and **never** on protected branches.
:::

## Interview Questions (Senior Level)

1. How do you design branch protection around safe push behavior at scale?
2. Why is `--force-with-lease` materially safer than `--force`?
3. What controls prevent accidental pushes to privileged remotes?
4. How do you recover quickly from a mistaken force push?

Short answer guide:
- Use protected branches, required checks, and approval gates.
- Lease validation prevents overwriting unseen remote commits.
- Add remote restrictions, hooks, and least-privilege credentials.
- Recover via reflog/backup refs and coordinated branch restoration.

:::info Interview Focus
Tie push strategy to governance: branch protection, approval policy, and recovery procedures.
:::

:::danger Interview Trap
Recommending `--force` on collaborative branches instead of `--force-with-lease` on owned feature branches.
:::
