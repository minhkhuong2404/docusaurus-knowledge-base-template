# Engineering Knowledge Base

The Engineering Knowledge Base is a practical learning and reference website for software engineers.
It is built with [Docusaurus](https://docusaurus.io/) and organized for fast, topic-based learning across backend, distributed systems, cloud, and platform engineering.

This site is docs-first (served from `/`) and is intended to support:

- day-to-day implementation decisions
- interview preparation and revision
- onboarding into new technical domains
- shared team understanding of core concepts and trade-offs

## What This Website Covers

The documentation is grouped into structured learning paths, including:

- Java
- Spring Ecosystem
- Design Patterns
- System Design
- Security
- Networking
- Kafka
- Database
- Operating Systems
- DevOps and Containerization
- AWS
- Banking and Finance

Each path typically starts with an overview, then moves into fundamentals, advanced concepts, and interview-focused practice.

## Tech Stack

- Docusaurus `3.9.2`
- React `18`
- TypeScript config files (`docusaurus.config.ts`, `sidebars.ts`)
- Custom Prism theme in `src/theme/prismTheme.ts`

## Website Structure

The main navigation is defined in `sidebars.ts`.

Content lives primarily under `docs/technical-knowledge/`, while the homepage/introduction is in `docs/intro.md`.

```text
docs/
  intro.md
  technical-knowledge/
    java/
    spring/
    design-patterns/
    system-design/
    security/
    networking/
    kafka/
    database/
    operating-systems/
    devops/
    aws/
    banking/

src/
  components/
  css/
  theme/

docusaurus.config.ts
sidebars.ts
```

## How to Use the Site

1. Open a domain overview page from the sidebar.
2. Follow category sections in order from fundamentals to advanced topics.
3. Use interview sections to check understanding with practical questions.
4. Revisit pages as a quick reference during design and implementation.

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
