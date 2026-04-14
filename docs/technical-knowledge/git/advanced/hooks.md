---
id: hooks
title: Git Hooks — Automating Quality Checks
sidebar_label: Hooks
description: '**Git hooks** are scripts that Git automatically executes before or
  after specific events (commit, push, merge, etc.). They live in `.git/hooks/` and
  can be.'
tags:
- technical-knowledge
- git
- advanced
- hooks
---
# Git Hooks — Automating Quality Checks

## What are Git Hooks?

**Git hooks** are scripts that Git automatically executes before or after specific events (commit, push, merge, etc.). They live in `.git/hooks/` and can be written in any executable language — bash, Python, or even Java via a shell wrapper.

Hooks enforce quality gates locally, before code ever reaches CI — catching issues in seconds rather than minutes.

:::info
Hooks in `.git/hooks/` are **not committed to the repository** and are local to each developer's machine. Use **Husky** (JavaScript projects) or a shared `scripts/hooks/` directory with a setup script to distribute hooks to your team.
:::

---

## Hook Locations and Triggers

| Hook | Trigger | Common Use |
|---|---|---|
| `pre-commit` | Before a commit is created | Lint, format, run fast tests |
| `prepare-commit-msg` | Before commit message editor opens | Auto-insert ticket number |
| `commit-msg` | After commit message is entered | Validate Conventional Commits format |
| `post-commit` | After commit is created | Notifications |
| `pre-push` | Before `git push` executes | Run test suite, block bad pushes |
| `pre-rebase` | Before rebase begins | Safety check |
| `post-merge` | After a merge completes | Auto-install dependencies |
| `post-checkout` | After branch switch | Auto-install dependencies |

---

## Setting Up Hooks

```bash
# Hooks must be executable
chmod +x .git/hooks/pre-commit
chmod +x .git/hooks/commit-msg
chmod +x .git/hooks/pre-push
```

---

## pre-commit — Enforce Code Quality

Runs before each commit. If it exits non-zero, the commit is aborted.

```bash
#!/bin/bash
# .git/hooks/pre-commit

set -e

echo "⏳ Running pre-commit checks..."

# 1. Run Checkstyle on staged Java files
STAGED_JAVA=$(git diff --cached --name-only --diff-filter=ACM | grep '\.java$' || true)
if [ -n "$STAGED_JAVA" ]; then
    echo "  → Checkstyle..."
    ./mvnw checkstyle:check -q
fi

# 2. Fail if any TODO/FIXME was staged (optional — adjust to taste)
if git diff --cached | grep -E '^\+.*\b(TODO|FIXME|HACK)\b' > /dev/null 2>&1; then
    echo "❌ Staged code contains TODO/FIXME — resolve or unstage before committing"
    exit 1
fi

# 3. Fail if System.out.println was staged (use a logger instead)
if git diff --cached | grep -E '^\+.*System\.out\.print' > /dev/null 2>&1; then
    echo "❌ System.out.println found — use a Logger instead"
    exit 1
fi

echo "✅ pre-commit checks passed"
```

---

## commit-msg — Validate Conventional Commits

Runs after the developer writes the commit message. Validates the format before the commit is finalised.

```bash
#!/bin/bash
# .git/hooks/commit-msg

COMMIT_MSG_FILE=$1
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# Allow merge commits and revert commits
if echo "$COMMIT_MSG" | grep -qE "^(Merge|Revert)"; then
    exit 0
fi

# Conventional Commits pattern
PATTERN="^(feat|fix|refactor|test|docs|chore|perf|ci|style|revert)(\(.+\))?: .{1,100}$"

if ! echo "$COMMIT_MSG" | grep -qE "$PATTERN"; then
    echo ""
    echo "❌ Invalid commit message format."
    echo ""
    echo "   Expected: <type>(<scope>): <subject>"
    echo "   Example:  feat(transactions): add date range filter"
    echo ""
    echo "   Valid types: feat, fix, refactor, test, docs, chore, perf, ci, style, revert"
    echo ""
    echo "   Your message: $COMMIT_MSG"
    echo ""
    exit 1
fi

echo "✅ Commit message format valid"
```

---

## prepare-commit-msg — Auto-Insert Ticket Number

Automatically prepends the Jira ticket from the branch name into the commit message:

```bash
#!/bin/bash
# .git/hooks/prepare-commit-msg

COMMIT_MSG_FILE=$1
COMMIT_SOURCE=$2

# Only auto-insert on regular commits (not merge, squash, etc.)
if [ -n "$COMMIT_SOURCE" ]; then
    exit 0
fi

# Extract JIRA ticket from branch name: feature/JIRA-123-add-export → JIRA-123
BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null)
TICKET=$(echo "$BRANCH" | grep -oE '[A-Z]+-[0-9]+' | head -1)

if [ -n "$TICKET" ]; then
    # Prepend ticket only if not already in the message
    if ! grep -q "$TICKET" "$COMMIT_MSG_FILE"; then
        sed -i.bak "1s/^/$TICKET: /" "$COMMIT_MSG_FILE"
    fi
fi
```

With this hook, committing on branch `feature/JIRA-123-add-export` auto-produces:
```
JIRA-123: feat(transactions): add date range filter
```

---

## pre-push — Block Bad Pushes

Runs before every `git push`. Useful for running the full test suite as a final gate:

```bash
#!/bin/bash
# .git/hooks/pre-push

echo "⏳ Running pre-push checks (this may take a minute)..."

# Run tests (skip integration tests for speed — they run in CI)
./mvnw test -q -Dgroups="!integration"

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Unit tests failed — push blocked."
    echo "   Fix failing tests or run: git push --no-verify (bypasses hooks)"
    exit 1
fi

echo "✅ Pre-push checks passed — pushing..."
```

---

## post-merge / post-checkout — Auto-Install Dependencies

Run after a merge or branch switch to keep dependencies fresh:

```bash
#!/bin/bash
# .git/hooks/post-merge (and symlink: post-checkout → post-merge)

# Re-run Maven if pom.xml changed
if git diff ORIG_HEAD HEAD --name-only | grep -q "pom.xml"; then
    echo "📦 pom.xml changed — running mvn install..."
    ./mvnw install -q -DskipTests
fi
```

---

## Sharing Hooks with the Team

Since `.git/hooks/` is not versioned, use a setup script:

```bash
# scripts/setup-git-hooks.sh
#!/bin/bash
HOOKS_DIR=".git/hooks"
SCRIPTS_DIR="scripts/hooks"

for hook in pre-commit commit-msg prepare-commit-msg pre-push; do
    ln -sf "../../$SCRIPTS_DIR/$hook" "$HOOKS_DIR/$hook"
    chmod +x "$SCRIPTS_DIR/$hook"
done

echo "✅ Git hooks installed"
```

```bash
# Run once after cloning
bash scripts/setup-git-hooks.sh
```

Or configure a custom hooks directory that IS versioned:

```bash
git config --local core.hooksPath scripts/hooks
# Now Git uses scripts/hooks/ as the hooks directory (committed to the repo)
```

---

## Bypassing Hooks

Skip hooks when needed (e.g., an emergency push):

```bash
git commit --no-verify -m "chore: emergency hotfix"
git push --no-verify
```

---

:::tip[Use Hooks for Local Feedback — Not as the Only Gate]
Hooks provide fast local feedback, but they can be bypassed with `--no-verify`. Always enforce the same checks in your CI pipeline as well. Hooks are developer convenience; CI is the authoritative quality gate.
:::

## Interview Questions (Senior Level)

1. How do you decide which checks belong in local hooks vs CI to optimize feedback without harming productivity?
2. What governance model do you use to keep hook scripts maintainable across teams and platforms?
3. How would you secure hook execution to avoid supply-chain or script-tampering risks?
4. What migration strategy would you use to roll out strict commit-msg and pre-push policies?

Short answer guide:
- Keep hooks fast and deterministic; reserve heavy/integration checks for CI.
- Version hooks in repo and standardize installation with documented ownership.
- Treat hooks as code: review, signing, and least-privilege execution.
- Roll out in warn mode first, then enforce after adoption metrics stabilize.
