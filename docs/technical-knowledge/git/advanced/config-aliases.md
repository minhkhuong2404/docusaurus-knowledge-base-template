---
id: config-aliases
title: git config & Aliases — Customising Git
sidebar_label: Config & Aliases
description: 'Git configuration exists at three scopes, each overriding the one above
  it:'
tags:
- technical-knowledge
- git
- advanced
- config-aliases
---
# `git config` & Aliases — Customising Git

## The Three Config Levels

Git configuration exists at three scopes, each overriding the one above it:

| Level | File Location | Scope |
|---|---|---|
| **System** | `/etc/gitconfig` | All users on the machine |
| **Global** | `~/.gitconfig` or `~/.config/git/config` | Your user account |
| **Local** | `.git/config` (inside the repo) | This repository only |

```bash
git config --system   # system-wide
git config --global   # your user (~/.gitconfig)
git config --local    # this repo (.git/config) — default
```

---

## Essential Global Configuration

Run these once after installing Git:

```bash
# Identity (used in every commit)
git config --global user.name "Jane Smith"
git config --global user.email "jane@yourcompany.com"

# Default branch name for new repositories
git config --global init.defaultBranch main

# Editor (use your IDE or a simple editor)
git config --global core.editor "code --wait"   # VS Code
git config --global core.editor "idea --wait"   # IntelliJ IDEA
git config --global core.editor "nano"          # Nano

# Pull strategy: rebase by default (keep history linear)
git config --global pull.rebase true

# Push: only push the current branch, not all tracking branches
git config --global push.default current

# Auto-prune stale remote-tracking refs on every fetch
git config --global fetch.prune true

# Always use --force-with-lease instead of --force when pushing
# (not a native Git config — use a shell alias instead — see below)

# Diff and merge tool
git config --global merge.conflictstyle diff3
git config --global merge.tool intellij
git config --global diff.tool intellij

# Enable color output
git config --global color.ui auto

# Automatically fix line endings (cross-platform teams)
git config --global core.autocrlf input    # macOS/Linux
git config --global core.autocrlf true     # Windows

# Rebase: auto-squash fixup! commits
git config --global rebase.autoSquash true

# Rebase: auto-stash dirty working tree before rebase
git config --global rebase.autoStash true

# Faster git status on large repos
git config --global core.untrackedCache true
git config --global core.fsmonitor true
```

---

## View Your Configuration

```bash
# Show all config and where each value comes from
git config --list --show-origin

# Show a specific key
git config user.email
git config --global pull.rebase
```

---

## Git Aliases

Aliases let you define short, memorable shortcuts for long or frequently used commands. They live in `~/.gitconfig` under `[alias]`.

### Everyday Shortcuts

```bash
git config --global alias.st    "status -s -b"
git config --global alias.co    "checkout"
git config --global alias.sw    "switch"
git config --global alias.br    "branch -vv"
git config --global alias.bra   "branch -vva"
git config --global alias.d     "diff"
git config --global alias.ds    "diff --staged"
git config --global alias.unstage "restore --staged"
```

### Pretty Log Aliases

```bash
# One-line graph with author and date
git config --global alias.lg \
  "log --oneline --graph --decorate --all \
   --format='%C(yellow)%h%C(reset) %C(cyan)%ad%C(reset) %C(green)%aN%C(reset) %s%C(auto)%d' \
   --date=short"

# Full log with stats
git config --global alias.ll \
  "log --stat --format='%C(yellow)%h%C(reset) %C(bold)%s%C(reset) %C(green)(%ad)%C(reset) %C(cyan)[%aN]' \
   --date=short"

# My commits since yesterday
git config --global alias.today \
  "log --oneline --since='midnight' --author='$(git config user.email)'"

# Unpushed commits
git config --global alias.unpushed \
  "log --oneline @{u}..HEAD"

# Unmerged branches
git config --global alias.unmerged \
  "branch --no-merged"
```

### Workflow Aliases

```bash
# Safer force push
git config --global alias.fpush \
  "push --force-with-lease"

# Undo last commit but keep changes staged
git config --global alias.undo \
  "reset --soft HEAD~1"

# Discard ALL local changes (careful!)
git config --global alias.nuke \
  "reset --hard HEAD"

# Show last commit
git config --global alias.last \
  "log -1 HEAD --stat"

# Show all aliases
git config --global alias.aliases \
  "config --get-regexp alias"

# Prune and fetch in one step
git config --global alias.up \
  "fetch --all --prune"

# Create a fixup commit (pass the SHA as argument)
git config --global alias.fixup \
  "commit --fixup"

# Interactive rebase with autosquash from origin/main
git config --global alias.tidy \
  "rebase -i --autosquash origin/main"
```

### Shell Command Aliases (prefix with `!`)

```bash
# Open git log in a pager with colors
git config --global alias.graph \
  "!git log --oneline --graph --decorate --all | head -50"

# Delete all merged local branches (except main, develop, master)
git config --global alias.sweep \
  "!git branch --merged | grep -vE '(main|develop|master|\\*)' | xargs -r git branch -d"

# Show the root directory of the repo
git config --global alias.root \
  "rev-parse --show-toplevel"
```

---

## Sample `~/.gitconfig`

```ini
[user]
    name = Jane Smith
    email = jane@yourcompany.com

[core]
    editor = code --wait
    autocrlf = input
    untrackedCache = true
    fsmonitor = true

[init]
    defaultBranch = main

[pull]
    rebase = true

[push]
    default = current

[fetch]
    prune = true

[merge]
    conflictstyle = diff3
    tool = intellij

[rebase]
    autoSquash = true
    autoStash = true

[alias]
    st     = status -s -b
    co     = checkout
    sw     = switch
    br     = branch -vv
    bra    = branch -vva
    d      = diff
    ds     = diff --staged
    lg     = log --oneline --graph --decorate --all --format='%C(yellow)%h%C(reset) %C(cyan)%ad%C(reset) %C(green)%aN%C(reset) %s%C(auto)%d' --date=short
    last   = log -1 HEAD --stat
    undo   = reset --soft HEAD~1
    fpush  = push --force-with-lease
    tidy   = rebase -i --autosquash origin/main
    up     = fetch --all --prune
    fixup  = commit --fixup
    sweep  = !git branch --merged | grep -vE '(main|develop|master|\\*)' | xargs -r git branch -d
    aliases = config --get-regexp alias
```

---

:::tip Back Up Your `.gitconfig`
Store your `~/.gitconfig` in a dotfiles repository on GitHub. This way you can set up a new machine in minutes with all your aliases and config:
```bash
git clone git@github.com:your-username/dotfiles.git ~/dotfiles
ln -sf ~/dotfiles/.gitconfig ~/.gitconfig
```
:::
