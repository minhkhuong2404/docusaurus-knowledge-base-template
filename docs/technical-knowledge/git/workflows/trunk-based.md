---
id: trunk-based
title: Trunk-Based Development — High-Frequency Delivery
sidebar_label: Trunk-Based Development
---

# Trunk-Based Development — High-Frequency Delivery

## What is Trunk-Based Development?

**Trunk-Based Development (TBD)** is a branching strategy where all developers integrate their changes into a single shared branch (`main` / `trunk`) multiple times per day. Feature branches are short-lived (hours to 1–2 days at most) and merged directly to trunk via pull requests.

It is the branching strategy used by Google, Meta, Netflix, and most high-performing engineering teams practicing continuous delivery.

---

## Core Principles

1. **One trunk** — `main` is the only long-lived branch
2. **Short-lived branches** — feature branches live for hours or days, never weeks
3. **Merge to trunk daily** — every developer integrates at least once per day
4. **Feature flags** — incomplete features are merged behind a flag, not held on a branch
5. **Automated quality gates** — CI must be fast and green before any merge to trunk

---

## Branch Lifetime Rules

| Branch Type | Max Lifetime | Merges To |
|---|---|---|
| Feature branch | 1–2 days | `main` via PR |
| Bugfix branch | < 4 hours | `main` via PR |
| Hotfix branch | < 2 hours | `main` directly |
| Release branch | Not used — tag instead | — |

---

## The Daily Workflow

```bash
# Start of day: fetch and rebase
git fetch origin
git pull --rebase origin main

# Create a short-lived feature branch
git switch -c feature/JIRA-123-add-export-service

# Work in small, committable increments
git commit -m "feat(export): add ExportRepository with query method"
git commit -m "feat(export): add ExportService with streaming logic"

# Rebase before opening PR (keep history linear)
git fetch origin
git rebase origin/main

# Push and open PR
git push -u origin feature/JIRA-123-add-export-service

# PR is reviewed, CI passes, then squash-merged to main
# Branch is deleted immediately after merge
```

---

## Feature Flags — The Key Enabler

Feature flags (feature toggles) allow you to merge incomplete code to trunk without exposing it to users. This is what makes TBD work for large features.

### Spring Boot Feature Flag Setup

```java
// application.yml
features:
  transaction-export:
    enabled: false     # off in production until fully ready

// Feature properties class
@ConfigurationProperties(prefix = "features.transaction-export")
@Getter @Setter
public class TransactionExportFeatureProperties {
    private boolean enabled;
}

// Feature flag check in service
@Service
@RequiredArgsConstructor
public class TransactionExportService {

    private final TransactionExportFeatureProperties features;

    public byte[] exportToCsv(UUID userId, LocalDate from, LocalDate to) {
        if (!features.isEnabled()) {
            throw new FeatureNotEnabledException("transaction-export");
        }
        // ... implementation
    }
}
```

Or use LaunchDarkly / Unleash / Spring Cloud Config for runtime flag toggling without redeploy:

```java
@RestController
@RequiredArgsConstructor
public class TransactionController {

    private final LDClient ldClient;

    @GetMapping("/api/v1/transactions/export")
    public ResponseEntity<?> export(@AuthenticationPrincipal UserPrincipal user) {
        boolean exportEnabled = ldClient.boolVariation(
            "transaction-export", user.toLDUser(), false);

        if (!exportEnabled) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        // ...
    }
}
```

---

## CI Pipeline Requirements for TBD

TBD requires a fast, reliable CI pipeline. Every PR must be verified before merging:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    timeout-minutes: 15      # ← Must be fast. If CI takes 30+ min, TBD slows down

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: maven

      - name: Build and test
        run: ./mvnw verify -B -T 4   # parallel build for speed

      - name: Sonar analysis
        run: ./mvnw sonar:sonar -B
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

  # Branch protection: all jobs must pass before merge to main
```

**CI speed targets for TBD:**

| Stage | Target |
|---|---|
| Unit tests | < 2 minutes |
| Integration tests | < 5 minutes |
| Build + Sonar | < 3 minutes |
| Total pipeline | < 10 minutes |

---

## Release in Trunk-Based Development

There are no release branches. Releases are created by tagging any green commit on `main`:

```bash
# Tag the release commit
git tag -a v1.2.0 -m "Release 1.2.0"
git push origin v1.2.0

# A tag push triggers the release pipeline in CI/CD
# which builds, tests, and deploys to production
```

---

## TBD vs Git Flow

| | Trunk-Based | Git Flow |
|---|---|---|
| Long-lived branches | Only `main` | `main`, `develop`, `release`, `hotfix` |
| Integration frequency | Multiple times per day | Per feature (days/weeks) |
| Feature isolation | Feature flags | Feature branches |
| Merge conflicts | Rare — small, frequent merges | Common — large, infrequent merges |
| Release process | Tag a commit on `main` | Release branch + merge ceremony |
| Best for | Continuous delivery, SaaS, microservices | Scheduled releases, libraries, mobile apps |
| CI requirements | High — must be fast and reliable | Medium |

---

:::tip Start Small
You do not need to go fully trunk-based on day one. Start by reducing your feature branch lifetime from "2 weeks" to "3 days" and using feature flags for large features. The reduction in merge conflict pain and PR review lag will be immediately obvious.
:::
