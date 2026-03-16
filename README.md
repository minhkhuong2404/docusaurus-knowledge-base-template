# Engineering Knowledge Base

Internal engineering documentation site built with [Docusaurus](https://docusaurus.io/) and TypeScript.

The site is documentation-first (`docs` route is mounted at `/`) and currently focuses on technical learning paths for backend and platform engineering.

## Tech Stack

- Docusaurus `3.9.2`
- React `18`
- TypeScript config files (`docusaurus.config.ts`, `sidebars.ts`)
- Custom Prism theme in `src/theme/prismTheme.ts`

## Current Content Map

The main navigation is defined in `sidebars.ts` and currently includes:

- Welcome / Intro
- Java
- Spring Ecosystem
- Design Patterns
- System Design
- Kafka
- Database
- Operating Systems

All topic pages are stored under `docs/technical-knowledge/`.

## Development

### Prerequisites

- Node.js 18+
- npm

### Install

```sh
npm install
```

### Start Local Server

```sh
npm start
```

Runs the site locally (default: `http://localhost:3000`) with hot reload.

### Build for Production

```sh
npm run build
```

Outputs static files to `build/`.

### Serve Production Build Locally

```sh
npm run serve
```

### Deploy

```sh
npm run deploy
```

## Project Structure

```text
docs/
  intro.md
  technical-knowledge/
    java/
    spring/
    design-patterns/
    system-design/
    kafka/
    database/
    operating-systems/

src/
  components/
  css/
  theme/

docusaurus.config.ts
sidebars.ts
```

## Writing and Registering Docs

1. Create a markdown file in the right folder under `docs/technical-knowledge/`.
2. Add frontmatter:

```md
---
title: Your Page Title
description: Short summary of the page
tags: [topic, category]
---
```

3. Add the document ID to the correct section in `sidebars.ts`.

Example ID format:

- `technical-knowledge/java/java-overview`
- `technical-knowledge/kafka/core/kafka-overview`

## Notes

- Blog is disabled.
- Docs are served from the root route (`/`).
- This repository is intended for internal knowledge sharing.
