---
id: pull-request-best-practices
title: Pull Request Best Practices
sidebar_label: PR Best Practices
description: 'A pull request (PR) is a unit of communication as much as it is a unit
  of code change. A good PR:'
tags:
- technical-knowledge
- git
- workflows
- pull-request-best-practices
---
# Pull Request Best Practices

## What Makes a Good Pull Request?

A pull request (PR) is a unit of communication as much as it is a unit of code change. A good PR:

- Has a **single, clear purpose**
- Is **small enough to review thoroughly** in under 30 minutes
- Includes **enough context** that a reviewer can understand the why without asking
- Has a **clean, logical commit history**
- **Passes CI** before review is requested

---

## PR Size

The single biggest factor in PR quality is **size**.

| PR Size | Lines Changed | Review Quality | Time to Merge |
|---|---|---|---|
| Small | < 200 | Thorough, fast | Hours |
| Medium | 200–500 | Adequate | 1–2 days |
| Large | 500–1000 | Superficial | Days |
| Giant | > 1000 | "Looks good" | Week+ |

**Target: under 400 lines changed.** If a feature requires more, split it into sequential PRs:

1. PR 1: Domain model and repository (`TransactionExport` entity, JPA)
2. PR 2: Service layer + unit tests
3. PR 3: Controller + integration tests
4. PR 4: Feature flag wiring + E2E test

Each PR is mergeable independently (behind a feature flag if needed).

---

## Writing a Good PR Description

A PR description should answer three questions:

1. **What** changed?
2. **Why** was this change made?
3. **How** was it tested?

### PR Template (`.github/pull_request_template.md`)

```markdown
## Summary
<!-- What does this PR do? 2–3 sentences. -->

## Motivation
<!-- Why is this change needed? Link to Jira ticket, customer complaint, or design doc. -->
Closes JIRA-

## Changes
<!-- Brief bullet list of the significant changes. Not a git log dump. -->
- 
- 

## Testing
<!-- How was this tested? What should the reviewer verify? -->
- [ ] Unit tests added / updated
- [ ] Integration tests added / updated
- [ ] Manually tested on local / SIT environment
- [ ] Feature flag tested (on + off)

## Screenshots / Evidence
<!-- For UI or API changes — paste a curl output, screenshot, or log snippet. -->

## Checklist
- [ ] Code follows project conventions
- [ ] No `System.out.println` or debug logging left in
- [ ] No TODO/FIXME in production code
- [ ] API documentation updated (if applicable)
- [ ] `CHANGELOG.md` updated (if applicable)
```

### Good PR Description Example

```markdown
## Summary
Adds a CSV export endpoint for transaction history. Users can download their
transactions for any date range as a CSV file, streamed server-side to avoid
memory issues on large date ranges.

## Motivation
Closes JIRA-113. Customer support was manually exporting data from the DB for
enterprise users monthly. This self-service feature removes that toil.

## Changes
- Added `GET /api/v1/transactions/export` endpoint accepting `fromDate` / `toDate`
- Streaming response via `StreamingResponseBody` — no full result set in memory
- Added `ExportService` with unit tests covering edge cases (empty result, max range)
- Feature flag: `features.transaction-export.enabled` — off by default in prod

## Testing
- Unit tests: `ExportServiceTest` — 12 cases covering date validation, streaming logic
- Integration test: `ExportControllerIT` — verifies CSV format, auth, and 422 on bad range
- Manually tested on SIT: exported 3 months of data (14,000 rows) — 2.1s response time
- Feature flag tested: verified endpoint returns 404 when flag is off

## Screenshots
curl output with 200 + CSV headers: [see CI artifact]
```

---

## Commit History in a PR

Clean up your commit history before requesting review. Reviewers should be able to understand each commit in isolation.

```bash
# Before opening a PR, tidy up with interactive rebase
git rebase -i --autosquash origin/main

# Expected result: 2–5 logical commits, no "wip", "fix typo", "temp"
# Example clean PR history:
# a3f9bc2 feat(export): add ExportRepository and domain model
# 9f3e2d1 feat(export): add ExportService with streaming response
# 7d1e4f0 feat(export): add ExportController and integration tests
# 2c8a1b3 feat(export): wire feature flag and update API docs
```

---

## Review Etiquette

### For PR Authors

| Practice | Guidance |
|---|---|
| Self-review first | Read your own diff before requesting review — catch 80% of issues yourself |
| Respond to all comments | Acknowledge or address every comment, even if you disagree |
| Don't merge until reviewers are satisfied | Don't click merge the moment you get one approval |
| Request specific reviewers | Tag domain experts, not just anyone |
| Keep the PR updated | If main moves significantly, rebase before merging |

### For Reviewers

| Practice | Guidance |
|---|---|
| Review within 24 hours | Unreviewed PRs are blocked teammates |
| Distinguish blocking from non-blocking | Use `Nit:` for non-blocking suggestions |
| Explain the why | "Consider using `Optional` here because..." — not just "change this" |
| Be kind and specific | Critique the code, not the author |
| Approve means "I trust this for production" | Only approve if you genuinely would not catch anything more on another pass |

### Comment Labels

```
MUST: Security vulnerability — must fix before merge
MUST: Null case not handled — will cause NPE in production

SHOULD: Consider extracting this to a method — complex nested logic

NIT: Prefer `var` here for readability (not blocking)
NIT: Minor naming inconsistency — up to you

QUESTION: Why is the pool size set to 20? Is that based on load testing?

PRAISE: Love the use of StreamingResponseBody here — smart choice for memory
```

---

## Branch Protection Rules

Enforce PR quality gates at the repository level:

```yaml
# GitHub branch protection for main:
required_status_checks:
  strict: true          # branch must be up to date before merge
  contexts:
    - "CI / build-and-test"
    - "CI / sonar-analysis"

required_pull_request_reviews:
  required_approving_review_count: 1
  dismiss_stale_reviews: true
  require_code_owner_reviews: true

restrictions:
  allow_force_pushes: false
  allow_deletions: false
```

---

:::tip The 10-Minute Rule
If a reviewer can't understand the purpose of a PR within 10 minutes of reading the description and first few commits — it needs a better description or needs to be split. Treat the PR description as documentation that will be read by future engineers doing `git log`.
:::
