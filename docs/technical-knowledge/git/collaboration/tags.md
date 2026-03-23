---
id: tags
title: git tag — Marking Releases
sidebar_label: Tags
---

# Tags — Marking Releases

## What is a Tag?

A **tag** is an immutable pointer to a specific commit — unlike a branch, it never moves. Tags are used to mark release points (`v1.2.0`), milestones, or any commit you want to reference permanently.

There are two types of tags:

| Type | Description |
|---|---|
| **Lightweight** | Just a pointer to a commit — like a branch that never moves |
| **Annotated** | A full Git object with a message, tagger name, email, date, and optional GPG signature. **Recommended for releases.** |

---

## Creating Tags

### Annotated tag (recommended for releases)
```bash
git tag -a v1.2.0 -m "Release 1.2.0 — transaction export feature"
```

### Lightweight tag (simple bookmark)
```bash
git tag v1.2.0-rc1
```

### Tag a specific past commit
```bash
git tag -a v1.1.5 a3f9bc2 -m "Retroactive tag for 1.1.5 hotfix"
```

---

## Listing and Inspecting Tags

```bash
# List all tags
git tag

# List tags matching a pattern
git tag -l "v1.2.*"
git tag -l "v1.*"

# Show tag details (annotated tags show the full object)
git show v1.2.0

# List tags with their commit messages (annotated only)
git tag -n           # show first line of each tag message
git tag -n5          # show up to 5 lines
```

---

## Pushing Tags to Remote

Tags are **not pushed automatically** with `git push`:

```bash
# Push a specific tag
git push origin v1.2.0

# Push all tags
git push --tags

# Push all annotated tags only (recommended — excludes lightweight tags)
git push origin 'refs/tags/v*'
```

---

## Deleting Tags

```bash
# Delete a local tag
git tag -d v1.2.0-rc1

# Delete a remote tag
git push origin --delete v1.2.0-rc1
# or:
git push origin :refs/tags/v1.2.0-rc1
```

---

## Checking Out a Tag

Tags are not branches — you cannot commit on them. Checking out a tag puts you in **detached HEAD** state:

```bash
git checkout v1.2.0
# HEAD is now at a3f9bc2... (detached HEAD)

# To work from a tag, create a branch from it
git switch -c hotfix/JIRA-999 v1.2.0
```

---

## Semantic Versioning

Follow [Semantic Versioning](https://semver.org) for release tags:

```
v<MAJOR>.<MINOR>.<PATCH>[-<pre-release>][+<build>]

v1.0.0        ← initial stable release
v1.1.0        ← new feature, backward compatible
v1.1.1        ← bug fix
v1.2.0-rc.1   ← release candidate
v2.0.0        ← breaking changes
```

| Segment | Increment when |
|---|---|
| **MAJOR** | Breaking changes — not backward compatible |
| **MINOR** | New features, backward compatible |
| **PATCH** | Bug fixes, backward compatible |

---

## Signed Tags (GPG)

For high-security release pipelines, sign tags with GPG:

```bash
# Create a signed tag
git tag -s v1.2.0 -m "Release 1.2.0"

# Verify a signed tag
git tag -v v1.2.0
```

---

## Release Automation with Tags

Use tags to trigger CI/CD release pipelines:

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v[0-9]+.[0-9]+.[0-9]+'   # matches v1.2.0, v2.0.0, etc.

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Get tag version
        id: version
        run: echo "VERSION=${GITHUB_REF#refs/tags/}" >> $GITHUB_OUTPUT

      - name: Build and publish
        run: |
          mvn versions:set -DnewVersion=${{ steps.version.outputs.VERSION }}
          mvn deploy -B

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          name: Release ${{ steps.version.outputs.VERSION }}
          generate_release_notes: true
```

---

:::tip Tag on Main, Never on Feature Branches
Always create release tags on `main` (or your release branch) after merging and verifying the release build. Tagging on a feature branch creates a tag that points to an unmerged commit, which is confusing and can lead to incorrect releases.
:::
