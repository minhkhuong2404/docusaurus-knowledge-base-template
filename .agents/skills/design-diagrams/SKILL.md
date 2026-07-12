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
- Converting a static ASCII art flow, Mermaid diagram, or markdown table into an interactive component.
- Creating a new architecture, state machine, or protocol sequence diagram from scratch.
- Adding hover effects, animated arrows, click-to-expand panels, tabs, or progress indicators to a section.
- Modifying global connection line or arrowhead styles for all Mermaid diagrams.

---

## Execution Steps

### Step 1 — Read the Design Reference

Before writing code, read [references/DESIGNS.md](./references/DESIGNS.md). It documents:
- The full color palette and when to use each color.
- All available CSS classes from `diagrams.css` and what they do.
- The five diagram archetypes with full implementation templates.
- Common pitfalls and how to avoid them.

---

### Step 2 — Choose the Right Archetype

| Content Type | Recommended Archetype |
|---|---|
| Protocol handshake / sequence flow | **Animated Flow** (stateful arrows with play button) |
| Architecture with hover-to-inspect nodes | **SVG Node Graph** (SVG + `<animateMotion>` particles) |
| Comparison table / decision tree | **Tabbed Explorer** (tabs + detail panel) |
| Reference data (headers, status codes) | **Searchable List** (search + click-to-expand) |
| Pre-launch review / audit | **Interactive Checklist** (checkboxes + progress bar) |

---

### Step 3 — Create the Component

1. Create `src/components/<ConceptName>Diagram.tsx`.
2. Name it after the concept, e.g. `HttpStatusCodesDiagram`, `TlsHandshakeDiagram`.
3. Always use `className="interactive-diagram-container"` as the outermost wrapper.
4. Always include an `interactive-diagram-header` bar with an SVG icon and a descriptive title.
5. Use `useState` for all interactive state (active tab, selected item, hover, etc.).
6. See [references/DESIGNS.md](./references/DESIGNS.md) for full boilerplate templates.

**Critical rules:**
- Never use emoji characters in header titles — use inline `<svg>` icons instead.
- Never use `inline style` for colors that appear in the color palette — use the CSS variables or the hex tokens from DESIGNS.md consistently.
- Always resolve all ternary branches to avoid Rspack compilation failures.
- Wrap SVG content in `.interactive-diagram-svg-wrapper.interactive-diagram-grid-bg` for the dot-matrix canvas background.

---

### Step 4 — Integrate into Markdown

Add an import at the top of the `.md` file (after frontmatter):

```markdown
import MyDiagram from '@site/src/components/MyDiagram';
```

Replace the static block (ASCII art, code block, or table) with the JSX tag:

```markdown
<MyDiagram />
```

Multiple imports per file are fine — all existing diagrams in a file follow this pattern.

---

### Step 5 — Global Mermaid Flowing Arrows

All standard `flowchart` Mermaid diagrams automatically inherit the animated flowing-dashed-arrow effect.

To adjust the global Mermaid animation:
1. Open [`src/theme/Mermaid/index.tsx`](file:///Users/lukhuong/Desktop/docusaurus-knowledge-base-template/src/theme/Mermaid/index.tsx) — inspect the `useMemo` block that duplicates `<path>` elements into `.path-bg` and `.path` classes.
2. Edit keyframe or stroke definitions in [`src/css/custom.css`](file:///Users/lukhuong/Desktop/docusaurus-knowledge-base-template/src/css/custom.css).
3. Arrowheads must use SVG 2 `context-fill` / `context-stroke` to inherit hover color transitions:
   ```css
   [class*="mermaidSvg"] svg marker path {
     fill: context-fill !important;
     stroke: context-stroke !important;
   }
   ```

---

### Step 6 — Verify Compilation

The dev server (`npm start`) hot-reloads on every save.

Check for:
- `client (Rspack) compiled successfully` — all clear.
- Any TypeScript or JSX error — fix before proceeding.
- Test interactive states manually in the browser.

---

### Step 7 — Audit Existing Diagrams (Optional)

To find files that still have un-migrated static ASCII art or Mermaid blocks:

```bash
python scratch/scan_diagrams.py
```

Results are written to `scratch/diagrams_inventory.md`.
