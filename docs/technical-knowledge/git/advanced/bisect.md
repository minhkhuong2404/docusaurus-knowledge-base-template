---
id: bisect
title: git bisect — Finding the Commit that Broke Things
sidebar_label: bisect
description: '`git bisect` performs a **binary search through commit history** to
  efficiently find the exact commit that introduced a bug. Instead of checking commits
  one by.'
tags:
- technical-knowledge
- git
- advanced
- bisect
---
# `git bisect` — Finding the Broken Commit

## What It Does

`git bisect` performs a **binary search through commit history** to efficiently find the exact commit that introduced a bug. Instead of checking commits one by one (which could take hours on a large repo), bisect narrows the search logarithmically — finding the culprit in `log₂(N)` steps.

For 1000 commits, bisect finds the bad commit in at most **10 steps**.

---

## Basic Manual Bisect

### Step 1 — Start bisect and mark the boundaries

```bash
git bisect start

# Mark the current state as "bad" (the bug is present here)
git bisect bad HEAD

# Mark a known good commit (the bug was not present here)
git bisect good v1.1.0
# or by SHA:
git bisect good a3f9bc2
```

Git checks out the commit at the midpoint of the range.

### Step 2 — Test and mark each commit

After each checkout, test whether the bug is present:

```bash
# If the bug IS present at this commit:
git bisect bad

# If the bug is NOT present at this commit:
git bisect good
```

Git narrows the range with each answer and checks out the next midpoint.

### Step 3 — Git identifies the culprit

After enough answers, Git outputs:

```
b7e2a1f is the first bad commit
commit b7e2a1f
Author: Bob Johnson <bob@example.com>
Date:   Mon Jan 15 14:22:10 2024

    refactor(transactions): extract date range logic to utility class

 src/main/java/com/example/util/DateRangeUtils.java | 42 +++++
 1 file changed, 42 insertions(+)
```

### Step 4 — End bisect and return to your branch

```bash
git bisect reset
# HEAD is now back on your original branch
```

---

## Automated Bisect with a Script

The real power of bisect is **automation**. Provide a script that returns exit code `0` for "good" and non-zero for "bad" — Git will run the entire search unattended.

### Example: bisect using a Maven test

```bash
git bisect start
git bisect bad HEAD
git bisect good v1.1.0

# Run a specific test — pass/fail determines good/bad automatically
git bisect run ./mvnw -q test \
  -Dtest="TransactionServiceTest#findTransactions_dateRangeFilter_returnsCorrectResults"
```

Git runs your test at each midpoint commit, automatically marking good/bad based on the exit code, and delivers the result without any manual input.

### Example: bisect using a shell script

```bash
#!/bin/bash
# scripts/bisect-check.sh

# Build silently
./mvnw -q package -DskipTests 2>/dev/null || exit 125
# Exit 125 = "skip this commit" (e.g., build is broken — not the bug we're hunting)

# Run the specific test
./mvnw -q test -Dtest="TransactionServiceTest#findTransactions_emptyResult"
```

```bash
git bisect run bash scripts/bisect-check.sh
```

:::tip[Exit Code 125]
If a commit can't be tested (e.g., compile error unrelated to the bug), exit with `125`. Git will skip that commit and move to the next one.
:::

---

## Bisect with Terms (Custom Good/Bad Labels)

For regressions that are not clearly "good/bad" (e.g., performance changes):

```bash
git bisect start --term-old fast --term-new slow
git bisect slow HEAD       # current is slow
git bisect fast v1.1.0     # v1.1.0 was fast
# Git now prompts "is this commit fast or slow?"
git bisect fast            # this commit is fast
git bisect slow            # this commit is slow
```

---

## Bisect Log and Replay

Save the bisect session to replay later:

```bash
git bisect log > bisect-session.log

# Replay a saved session
git bisect reset
git bisect replay bisect-session.log
```

---

## Tips for Effective Bisect

| Tip | Detail |
|---|---|
| **Write a reproducible test first** | Automate with `bisect run` for speed and accuracy |
| **Use tags as boundaries** | `git bisect good v1.0.0` — release tags are reliable known-good points |
| **Skip broken builds** | Exit `125` from your script to skip non-compilable commits |
| **Check reflog after** | `git reflog` shows all commits visited during bisect |
| **Once found, `git show`** | `git show <bad-commit>` shows the exact diff that introduced the bug |

---

:::tip[Bisect Saves Hours]
On a repo with 500 commits between the last known-good release and `HEAD`, manually checking each commit would take all day. `git bisect run` with an automated test finds the exact culprit in under 10 steps — usually in a few minutes. Write the test first.
:::

## Interview Questions (Senior Level)

1. How do you prepare deterministic bisect scripts for flaky test environments?
2. When should commits be skipped with exit code `125`, and why?
3. How do you bisect effectively across refactors and intermittent build failures?
4. What post-bisect steps ensure the root cause is fully validated?

Short answer guide:
- Use stable repro tests and isolate nondeterministic dependencies.
- Skip only untestable commits to preserve binary-search integrity.
- Combine manual checkpoints with automated bisect runs.
- Confirm fix with forward/backward validation and regression tests.

:::info[Interview Focus]
Show how `git bisect run` shortens mean-time-to-root-cause during regressions.
:::

:::danger[Interview Trap]
Starting bisect without a deterministic reproduction or clear good/bad boundary.
:::
