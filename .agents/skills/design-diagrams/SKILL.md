---
name: design-diagrams
description: Design and implement custom interactive React SVG components and flowing arrow animations for diagrams in Docusaurus
---

# Skill: Design Diagrams (Interactive SVG & Flowing Arrows)

This skill covers the full lifecycle of creating, styling, and integrating interactive React diagram components in this Docusaurus knowledge base.

Read the detailed design guide at [references/DESIGNS.md](./references/DESIGNS.md) before starting work.

---

## When to Trigger This Skill

Use this skill when:
- Converting a static ASCII art flow, Mermaid diagram, markdown table, or text-only stub container into a fully functional interactive component.
- Creating a new architecture diagram, state machine, protocol sequence, interactive lookup reference, or checklist from scratch.
- Adding hover effects, animated arrows, step-by-step playback, tabbed panels, or filterable lists to technical documentation.
- Auditing existing diagram components across topic directories (`kafka`, `networking`, `operating-systems`, `redis`, `java`, `database`).

---

## Execution Workflow

### Step 1 — Audit Existing Components & Stubs

Check whether a component file already exists in `src/components/<ConceptName>Diagram.tsx`.
Identify if it is a **text-only stub** (short shell with simple text tabs and no visual representations) vs a **real visual component** (SVG node graphs, animated directional flow sequences, rich interactive tabs with gotchas/metrics, or filterable references).

Commands to check component status:
```bash
# Check line count & stub signatures in components
wc -l src/components/<ConceptName>Diagram.tsx
```

---

### Step 2 — Read the Design Specification

Before writing code, inspect [references/DESIGNS.md](./references/DESIGNS.md). It documents:
- The curated 9-color hex palette and exact semantic roles.
- CSS classes from `src/css/diagrams.css`.
- Five battle-tested archetype templates (Animated Flow, SVG Node Graph, Tabbed Explorer, Searchable List, Interactive Checklist).
- Responsive layout guidelines and TypeScript compile checks.

---

### Step 3 — Choose the Right Archetype

| Content Type | Archetype | Signature Visual Elements |
|---|---|---|
| Protocol handshake / sequence / request-response flow | **A — Animated Flow** | Actor boxes, directional step arrows with `opacity` fade, Play/Animate button with `useEffect` playback timer |
| System architecture / kernel & cluster nodes | **B — SVG Node Graph** | `<svg viewBox>` canvas with dot-matrix background, SVG nodes (`<rect>` + `<text>`), directed `<path>` edges with marker arrowheads, click/hover details panel |
| Feature comparison / protocol evolution / topic tabs | **C — Tabbed Explorer** | Custom tab buttons with colored highlight borders, structured details grid, gotchas/pro-con tags, optional sub-step accordion |
| Lookup reference (headers, status codes, commands, tools) | **D — Searchable List** | Live search `<input>`, filterable list buttons with colored badges, split-pane detail inspection card |
| Pre-launch audit / review criteria / checklists | **E — Interactive Checklist** | Category tabs, clickable custom checkboxes, dynamic progress bar, summary metrics |

---

### Step 4 — Implement the Component

1. File path: `src/components/<ConceptName>Diagram.tsx`.
2. Outermost wrapper: `<div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>`.
3. Header bar: `<div className="interactive-diagram-header">` containing inline `<svg>` icon (never emoji), primary title, and optional action buttons.
4. Color palette: Use exact hex tokens (`#38bdf8`, `#34d399`, `#fbbf24`, `#f97316`, `#f87171`, `#a78bfa`, `#8b5cf6`, `#2dd4bf`, `#f472b6`).
5. Text styling: Use `var(--ifm-color-content)` and `var(--ifm-color-content-secondary)` for theme compatibility.
6. Grid responsiveness: Use fixed percentage columns (e.g. `55% 45%`, `58% 42%`, `50% 50%`, `align-items: start`) and embed an inline `<style>` media query block (`@media (max-width: 768px)`) to collapse columns to `1fr` on small screens.

---

### Step 5 — Verify Compilation & Type Safety

Run TypeScript validation to catch syntax or type errors:
```bash
npx tsc --noEmit
```

Ensure output returns 0 errors for the target component.

---

### Step 6 — Integrate into Documentation Markdown

1. Add import after frontmatter in `docs/.../<page>.md`:
   ```markdown
   import ConceptNameDiagram from '@site/src/components/ConceptNameDiagram';
   ```
2. Replace static ASCII, code block, or table with the JSX tag:
   ```markdown
   <ConceptNameDiagram />
   ```

---

### Step 7 — MANDATORY: Register Any New Markdown Page in sidebars.ts

If your task created a new `.md` page (not just a React component), register its doc ID in `sidebars.ts` under the matching category. See [AGENTS.md](../../AGENTS.md#mandatory-register-every-new-page-in-sidebarsts) for details.
