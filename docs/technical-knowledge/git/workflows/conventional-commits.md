---
id: conventional-commits
title: Conventional Commits — Structured Commit Messages
sidebar_label: Conventional Commits
description: '[Conventional Commits](https://www.conventionalcommits.org) is a lightweight
  convention for writing commit messages in a machine-readable, human-understandable.'
tags:
- technical-knowledge
- git
- workflows
- conventional-commits
---

import GitConventionalCommitsDiagram from '@site/src/components/GitConventionalCommitsDiagram';

# Conventional Commits — Structured Commit Messages

<GitConventionalCommitsDiagram />

## What is the Conventional Commits Specification?

[Conventional Commits](https://www.conventionalcommits.org) is a lightweight convention for writing commit messages in a machine-readable, human-understandable format. It enables:

- **Automated changelog generation** (`CHANGELOG.md`)
- **Automated semantic version bumping** (patch / minor / major)
- **Searchable, filterable history** by type and scope
- **Consistent onboarding** — every developer writes messages the same way

---

## Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Rules
- **type** — required, lowercase
- **scope** — optional, in parentheses, describes the component affected
- **subject** — required, imperative mood, no trailing period, max 72 chars
- Blank line between subject and body
- Body explains **what** and **why**, not how
- Footer contains `BREAKING CHANGE:` or issue references

---

## Types

| Type | When to Use | Version Bump |
|---|---|---|
| `feat` | A new feature | **MINOR** (1.x.0) |
| `fix` | A bug fix | **PATCH** (1.0.x) |
| `refactor` | Code change that is neither a fix nor a feature | None |
| `test` | Adding or updating tests | None |
| `docs` | Documentation changes only | None |
| `chore` | Build process, dependencies, tooling | None |
| `perf` | Performance improvement | **PATCH** |
| `ci` | CI/CD configuration | None |
| `style` | Formatting, whitespace (no logic change) | None |
| `revert` | Reverting a previous commit | Depends |

A `BREAKING CHANGE:` footer or `!` after the type triggers a **MAJOR** bump (x.0.0).

---

## Examples

### Minimal (subject only)

```
feat(transactions): add CSV export endpoint
```

```
fix(auth): resolve token refresh race condition
```

```
chore(deps): upgrade Spring Boot from 3.1.5 to 3.2.1
```

### With body

```
feat(transactions): add date range filter to listing API

Previously the listing API returned all transactions for a user
with no ability to filter by date. This becomes unworkable for
users with > 6 months of history.

The filter accepts ISO-8601 dates (fromDate, toDate) and defaults
to returning all records when no filter is supplied.
```

### With breaking change footer

```
feat(api)!: rename transaction amount field to amountMinorUnits

BREAKING CHANGE: The `amount` field in TransactionDto has been renamed
to `amountMinorUnits` and now returns an integer (minor currency units)
instead of a decimal. Clients must update their deserialization logic.

Closes JIRA-201
```

### With multiple footers

```
fix(transactions): prevent duplicate export jobs on concurrent requests

Added an idempotency key to the export job creation. Concurrent requests
with the same userId and date range now return the existing job rather
than creating a duplicate.

Reviewed-by: Jane Smith <jane@example.com>
Closes JIRA-345
Co-authored-by: Bob Johnson <bob@example.com>
```

### Revert

```
revert: feat(transactions): add CSV export endpoint

This reverts commit a3f9bc2.
Reason: export feature caused memory pressure under load — tracked in JIRA-399
```

---

## Scopes for Java/Spring Projects

Define scopes that map to your service's bounded contexts or layers:

```
feat(auth): ...           # authentication / authorisation
feat(transactions): ...   # transaction domain
feat(export): ...         # export feature
feat(payments): ...       # payment processing
feat(api): ...            # API layer / contracts
feat(db): ...             # database / migrations
feat(config): ...         # configuration
feat(kafka): ...          # messaging / events
feat(security): ...       # security configuration
chore(deps): ...          # dependency management
chore(build): ...         # Maven/Gradle configuration
ci(github): ...           # GitHub Actions
docs(api): ...            # API documentation
```

---

## Automating Changelogs

### Using `conventional-changelog-cli`

```bash
npm install -g conventional-changelog-cli

# Generate changelog from the last release tag to now
conventional-changelog -p angular -i CHANGELOG.md -s -r 1
```

### Generated `CHANGELOG.md`

```markdown
## [1.2.0] - 2024-03-15

### Features
- **transactions:** add CSV export endpoint (JIRA-113) (a3f9bc2)
- **transactions:** add date range filter to listing API (JIRA-105) (9f3e2d1)
- **auth:** support OAuth2 PKCE flow (JIRA-98) (7d1e4f0)

### Bug Fixes
- **transactions:** resolve NPE on null description (JIRA-199) (b2c3d4e)
- **auth:** fix token refresh race condition (JIRA-201) (1a4b5c6)

### BREAKING CHANGES
- **api:** rename transaction amount field to amountMinorUnits (JIRA-201)
```

---

## Enforcing Conventions with a commit-msg Hook

```bash
#!/bin/bash
# .git/hooks/commit-msg  (or scripts/hooks/commit-msg)

COMMIT_MSG=$(cat "$1")

# Allow merge and revert commits
echo "$COMMIT_MSG" | grep -qE "^(Merge|Revert)" && exit 0

# Conventional Commits pattern
PATTERN="^(feat|fix|refactor|test|docs|chore|perf|ci|style|revert)(\(.+\))?!?: .{1,100}"

if ! echo "$COMMIT_MSG" | grep -qE "$PATTERN"; then
    echo ""
    echo "❌ Commit message does not follow Conventional Commits."
    echo ""
    echo "   Format:  <type>(<scope>): <subject>"
    echo "   Example: feat(transactions): add date range filter"
    echo "   Types:   feat | fix | refactor | test | docs | chore | perf | ci | style | revert"
    exit 1
fi
```

See [Hooks](../advanced/hooks) for setup instructions.

---

:::tip[Keep Scopes Consistent]
The value of scopes comes from consistency — if one developer writes `feat(transaction):` and another writes `feat(transactions):`, changelog grouping breaks. Define your project's allowed scopes in a `commitlint.config.js` or team wiki and enforce them in the hook.
:::

---

## Interview Questions

### Q: How do Conventional Commits improve release automation?
**A:** They provide machine-readable intent so tooling can generate changelogs and semantic version bumps reliably.

### Q: What is the risk of enforcing conventions too strictly?
**A:** Overly rigid rules can slow developers and encourage meaningless compliance messages.

### Q: How do you roll out Conventional Commits to an existing team?
**A:** Start with lightweight linting and templates, provide examples, then progressively enforce in CI once adoption stabilizes.

### Q: Why are scopes important in monorepos or multi-domain services?
**A:** Scopes improve traceability and changelog usefulness by mapping commits to bounded contexts/components.

### Q: How would you handle a commit that contains both fix and refactor changes?
**A:** Prefer splitting into separate commits by intent; if unavoidable, choose the dominant intent and explain details in the body.

### Q: Do commit message conventions replace PR descriptions?
**A:** No. Commit messages capture change intent over time, while PR descriptions provide review-time context and validation evidence.
