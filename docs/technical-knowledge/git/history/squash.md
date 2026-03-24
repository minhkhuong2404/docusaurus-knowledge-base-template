---
id: squash
title: git squash — Combining Commits
sidebar_label: squash
description: '**Squashing** combines multiple commits into a single commit. This is
  used to clean up a messy feature branch before merging — turning a series of `wip`,
  `fix.'
tags:
- technical-knowledge
- git
- history
- squash
---
# Squashing Commits

## What is Squashing?

**Squashing** combines multiple commits into a single commit. This is used to clean up a messy feature branch before merging — turning a series of `wip`, `fix typo`, and `temp` commits into one or a few clean, meaningful commits that tell a story.

Squashing is performed via `git rebase -i` (interactive rebase). It is a **history rewrite**, so only squash commits that have not been pushed to a shared branch, or use `--force-with-lease` if you need to push afterward.

---

## When to Squash

| Good use case | Not ideal |
|---|---|
| Collapsing WIP / "fix typo" / "temp" commits before a PR | Squashing logically separate concerns into one giant commit |
| Creating a clean single commit per ticket/story | Squashing after teammates have based work on your branch |
| Reducing noise in a long-running feature branch | When each commit is already clean and meaningful |

---

## Squashing with Interactive Rebase

### Example: Clean up the last 5 commits

```bash
git rebase -i HEAD~5
```

Git opens your editor:

```
pick a3f9bc2 feat(transactions): add domain model
pick 7d1e4f0 wip: controller in progress
pick 2c8a1b3 fix typo in service
pick 9f3e2d1 add missing null check
pick 1a4b5c6 feat(transactions): add controller endpoint
```

Change `pick` to `squash` (or `s`) for commits you want to fold upward:

```
pick a3f9bc2 feat(transactions): add domain model
squash 7d1e4f0 wip: controller in progress
squash 2c8a1b3 fix typo in service
squash 9f3e2d1 add missing null check
squash 1a4b5c6 feat(transactions): add controller endpoint
```

Git will pause and open the message editor, combining all messages:

```
# This is a combination of 5 commits.
# The first commit's message is:
feat(transactions): add domain model

# This is the commit message #2:
wip: controller in progress

# This is the commit message #3:
fix typo in service
...
```

Edit it down to one clean message:

```
feat(transactions): add transaction listing with date range filter

- Domain model and repository for transaction lookup
- Service layer with date range validation
- REST controller with pagination support

Closes JIRA-123
```

Save and close — Git produces a single clean commit.

---

## Squashing into Multiple Logical Commits

You do not have to squash everything into one. Group related commits logically:

```
pick a3f9bc2 feat(transactions): add repository and domain model
squash 7d1e4f0 wip: missing index annotations
squash 2c8a1b3 add missing validation in repository
pick 9f3e2d1 feat(transactions): add service and controller
squash 1a4b5c6 fix: missing error handling in controller
squash b3e9f1a test: add unit tests for service
```

This produces two clean commits — one for the data layer, one for the service/API layer.

---

## Squash Merge (via `git merge --squash`)

When merging a feature branch, `--squash` collapses all feature commits into staged changes and lets you write one clean commit:

```bash
git switch main
git merge --squash feature/JIRA-123
git commit -m "feat(transactions): add transaction listing with date range filter (JIRA-123)"
```

The feature branch's individual commits do **not** appear in `main`'s history. The feature branch itself is not deleted and is not "merged" in Git's eyes — you must delete it manually.

This is the approach used by GitHub's "Squash and merge" button in pull requests.

---

## After Squashing — Force Push

After squashing commits that were already pushed, force-push to update the remote branch:

```bash
git push --force-with-lease origin feature/JIRA-123
```

---

## Squash vs Fixup

| | `squash` | `fixup` |
|---|---|---|
| Keeps this commit's message? | ✅ Yes — adds to combined message | ❌ No — discards message |
| When to use | Meaningful message worth keeping | Trivial fix, message is noise |

```
pick a3f9bc2 feat(transactions): add service logic
squash 7d1e4f0 add missing validation          ← message included
fixup  2c8a1b3 fix typo                        ← message discarded
```

See [Fixup](./fixup) for the `--fixup` / `--autosquash` workflow.

---

:::tip Squash at PR Review Time
A good habit: keep whatever commits you need locally while working (safety nets), then squash before requesting review. Reviewers see clean history, and `git log` on main stays meaningful.
:::
