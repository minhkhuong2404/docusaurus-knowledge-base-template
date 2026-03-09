# Copilot Instructions — Engineering Knowledge Base

## Project Overview

This is a **Docusaurus 3.6** static documentation site (`engineering-knowledge-base`) serving as an internal engineering knowledge base. It is TypeScript-first, using React 18 and the `@docusaurus/preset-classic`.

## Architecture & Key Files

- **`docusaurus.config.ts`** — Site-wide config (title, URL, presets, Prism theme). Changes here affect the entire site.
- **`sidebars.ts`** — Defines navigation structure. Every new doc must be registered here under its category.
- **`docs/`** — Markdown content organized by topic domain: `architecture/`, `backend/`, `kafka/`. Each `.md` file uses YAML frontmatter with a `title` field.
- **`src/components/CodeBlock.tsx`** — Custom code-highlighting component wrapping `prism-react-renderer` with the project's theme.
- **`src/theme/prismTheme.ts`** — One Dark–inspired custom Prism theme used globally for syntax highlighting.

## Adding a New Documentation Page

1. Create a `.md` file in the appropriate `docs/<category>/` folder.
2. Include YAML frontmatter with at least `title`:
   ```markdown
   ---
   title: Your Page Title
   ---
   ```
3. Add the doc ID (`<category>/<filename-without-extension>`) to `sidebars.ts` inside the matching category's `items` array.

## Adding a New Documentation Category

1. Create a new folder under `docs/` (e.g., `docs/frontend/`).
2. Add a sidebar entry in `sidebars.ts` following the existing pattern:
   ```ts
   { type: 'category', label: 'Frontend', items: ['frontend/react-basics'] }
   ```

## Code Conventions

- **TypeScript everywhere** — Config files (`docusaurus.config.ts`, `sidebars.ts`) and components are all `.ts`/`.tsx`. Do not introduce plain `.js` files.
- **Default exports** — Components and config modules use `export default`. Follow this pattern.
- **Typed imports** — Use `import type` for type-only imports (see `sidebars.ts`, `docusaurus.config.ts`).
- **No strict mode** — `tsconfig.json` has `"strict": false`. Do not enable strict checks without discussion.

## Developer Workflow

```sh
npm start   # Local dev server with hot reload
npm run build   # Production build
npm run serve   # Serve production build locally
```

There is no test framework configured. There are no linting or formatting tools set up.

## Custom Theme Details

The Prism syntax-highlighting theme in `src/theme/prismTheme.ts` uses a One Dark color palette (`#282c34` background). When adding new token styles, follow the existing pattern of `{ types: [...], style: { ... } }` objects in the `styles` array.

The `CodeBlock` component (`src/components/CodeBlock.tsx`) is a standalone wrapper for programmatic code rendering. Markdown fenced code blocks in `docs/` are handled automatically by Docusaurus's built-in Prism integration—not by this component.
