# Light Theme Design Guidelines & Component Specification

This reference contains the comprehensive design system rules, CSS selector patterns, and anti-patterns for implementing and maintaining the Light Theme across this Docusaurus knowledge base.

---

## 1. Palette Tokens & Color Roles

The user has defined the following exact color tokens:

```css
:root[data-theme="light"] {
  /* Page & Base Canvas */
  --light-bg-page: #F2F4F7;           /* Main outer background */
  --light-surface-mint: #F7FDF9;      /* Fresh mint surface for cards & accents */
  --light-surface-neutral: #F2F2F2;   /* Sub-cards, unselected chips & pills */

  /* Borders & Dividers */
  --light-border-grey: #98A2B3;       /* Background grey, defined borders, dividers */
  --light-border-whiter: #D9D9D9;     /* Subtle light borders, card separators */

  /* Typography */
  --light-text-primary: #0f172a;      /* Headings, card titles, primary body */
  --light-text-secondary: #334155;    /* Subtitles, secondary descriptions */
  --light-text-muted: #475569;        /* Metadata, tags, footnotes */

  /* Brand Accents */
  --light-brand-green: #2f8f4e;       /* Primary active indicator, ticks */
  --light-brand-purple: #7c3aed;      /* System Design / Highlights */
}
```

---

## 2. White Text Elimination (The Zero-White-Text Invariant)

### The Problem
Components designed primarily for dark mode often contain hardcoded inline styles such as:
- `color: '#ffffff'`
- `color: 'rgb(255, 255, 255)'`
- `color: 'rgba(255, 255, 255, 0.7)'`
- `color: '#f8fafc'`

On light surfaces (`#ffffff`, `#F2F4F7`, `#F7FDF9`), these elements become completely invisible or unreadable.

### The Solution Patterns
In `src/css/custom.css`, always scope rules with `[data-theme="light"]`:

```css
/* Universal text darkening for light theme content */
[data-theme="light"] .arcade-game-arena h1,
[data-theme="light"] .arcade-game-arena h2,
[data-theme="light"] .arcade-game-arena h3,
[data-theme="light"] .arcade-game-arena div[style*="color: #ffffff"],
[data-theme="light"] .arcade-game-arena span[style*="color: #ffffff"] {
  color: #0f172a !important;
}

[data-theme="light"] .arcade-game-arena div[style*="rgba(255, 255, 255"],
[data-theme="light"] .arcade-game-arena span[style*="rgba(255, 255, 255"] {
  color: #334155 !important;
}
```

### Inline Code Blocks in Titles
When markdown headings or page titles include inline code like `` `git commit` ``:
```css
[data-theme="light"] .markdown h1 code,
[data-theme="light"] .markdown h2 code,
[data-theme="light"] .markdown h3 code,
[data-theme="light"] .theme-doc-markdown h1 code,
[data-theme="light"] .theme-doc-markdown h2 code,
[data-theme="light"] .theme-doc-markdown h3 code {
  color: #0f172a !important;
  background-color: #F2F2F2 !important;
  border: 1px solid #D9D9D9 !important;
  padding: 2px 6px !important;
  border-radius: 6px !important;
}
```

### Hover States Contrast
On button or answer option hovers, text must NOT flip to white:
```css
[data-theme="light"] .arcade-answer-btn:hover,
[data-theme="light"] .arcade-answer-btn:hover * {
  color: #0f172a !important;
  background-color: #e2e8f0 !important;
}
```

---

## 3. Glassmorphism & Subtle Borders

### Left Menu Bar Styling (Consistent with Dark Theme)
- **All Topics Headings**: Must be pure solid black (`#000000`) and bold (`700`), with no other color on idle, hover, or active-child:
  ```css
  [data-theme="light"] .custom-menu-category-header,
  [data-theme="light"] .custom-menu-category,
  [data-theme="light"] .custom-menu-category-header .menu-label,
  [data-theme="light"] .custom-menu-category-items .custom-menu-category-header,
  [data-theme="light"] .custom-menu-category-items .custom-menu-category-header .menu-label,
  [data-theme="light"] .navbar-sidebar .menu__link--sublist-caret {
    color: #000000 !important;
    font-weight: 700 !important;
    font-size: 0.89rem !important;
    letter-spacing: -0.01em;
  }
  [data-theme="light"] .custom-menu-category-header .menu-caret svg {
    color: #000000 !important;
    stroke: #000000 !important;
  }
  ```
- **Active Page Link & Gradient Highlight**: Matches dark mode with theme-adaptive active background (`var(--sidebar-active-bg)`), colored border (`var(--sidebar-active-border)`), neon glow (`var(--neon-glow-color)`), vertical gradient left bar (`::before`), and animated shimmer sweep (`::after`):
  ```css
  [data-theme="light"] .custom-menu-link.active {
    background: var(--sidebar-active-bg) !important;
    color: var(--sidebar-active-text) !important;
    border: 1px solid var(--sidebar-active-border) !important;
    border-radius: 12px !important;
    box-shadow: 0 0 0 1px var(--sidebar-active-border), 0 4px 18px var(--neon-glow-color), inset 0 1px 0 rgba(255, 255, 255, 0.85) !important;
    font-weight: 700 !important;
    position: relative;
    overflow: hidden;
  }
  [data-theme="light"] .custom-menu-link.active::before {
    content: "";
    position: absolute;
    left: -12px;
    top: 15%;
    height: 70%;
    width: 3.5px;
    border-radius: 2px;
    opacity: 1 !important;
    transform: scaleY(1) !important;
    background: linear-gradient(180deg, var(--brand-green), var(--brand-green-mid)) !important;
    box-shadow: 0 0 8px var(--neon-glow-color);
  }
  ```

### Avatar Icon Hover
On avatar hover, the border must be light and natural, never harsh:
```css
[data-theme="light"] .navbar-user-avatar:hover {
  border-color: rgba(0, 0, 0, 0.15) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
}
```

### Career Hub Section Containers
All section containers and module headers must have a defined border in light mode:
```css
[data-theme="light"] .career-hub-section,
[data-theme="light"] .career-hub-card {
  border: 1px solid #D9D9D9 !important;
  background: #ffffff !important;
}
```

---

## 4. Badges, Chips, Pills & "Toasts" Matrix

The user refers to table badges, selector chips, and tags as "toasts". These must be rich, dark, and high-contrast:

```css
/* Unsolved / Neutral Action Button */
[data-theme="light"] .dsa-status-btn.unsolved {
  background: #F2F2F2 !important;
  color: #1e293b !important;
  border: 1px solid #98A2B3 !important;
}

/* Solved / Green Success Badge */
[data-theme="light"] .dsa-status-btn.solved,
[data-theme="light"] .dsa-diff-badge.dsa-diff-easy,
[data-theme="light"] .arcade-pill-btn.sev-p3.selected,
[data-theme="light"] .arcade-pill-btn.diff-easy.selected {
  background: #dcfce7 !important;
  color: #166534 !important;
  border: 1px solid #86efac !important;
}

/* Medium / Amber Warning Badge */
[data-theme="light"] .dsa-diff-badge.dsa-diff-medium,
[data-theme="light"] .arcade-pill-btn.sev-p2.selected,
[data-theme="light"] .arcade-pill-btn.diff-medium.selected {
  background: #fef3c7 !important;
  color: #92400e !important;
  border: 1px solid #fcd34d !important;
}

/* Hard / Crimson Critical Badge */
[data-theme="light"] .dsa-diff-badge.dsa-diff-hard,
[data-theme="light"] .arcade-pill-btn.sev-p0.selected,
[data-theme="light"] .arcade-pill-btn.diff-hard.selected {
  background: #fee2e2 !important;
  color: #991b1b !important;
  border: 1px solid #fca5a5 !important;
}

/* Company / Info / Blue Badge */
[data-theme="light"] .dsa-company-badge,
[data-theme="light"] .arcade-pill-btn.mode-btn.selected {
  background: #e0e7ff !important;
  color: #3730a3 !important;
  border: 1px solid #c7d2fe !important;
}

/* Lesson Doc / Purple Badge */
[data-theme="light"] .dsa-lesson-doc-badge,
[data-theme="light"] .arcade-pill-btn.diff-all.selected {
  background: #f3e8ff !important;
  color: #6b21a8 !important;
  border: 1px solid #d8b4fe !important;
}
```

---

## 5. Arcade Action Button Gradients (Lighter & Radiant)

Never end gradients with `#1e1b4b` or dark navy/black. Use radiant matching tints:

| Game | Start Color | End Color | Theme Scheme |
|---|---|---|---|
| **Outage Boss Battle (System Design)** | `#9333ea` | `#c084fc` | Lighter Violet |
| **Outage Boss Battle (Java)** | `#d97706` | `#fbbf24` | Warm Amber |
| **Outage Boss Battle (Spring Boot)** | `#059669` | `#34d399` | Fresh Mint Emerald |
| **Outage Boss Battle (Chaos Titan)** | `#0284c7` | `#38bdf8` | Vibrant Sky Blue |
| **Spot The Bug Duel** | `#f59e0b` | `#fb923c` | Amber to Coral |
| **Architecture Pipe Puzzle** | `#0ea5e9` | `#38bdf8` | Cyan to Sky Blue |
| **SQL Index & Query Crusher** | `#10b981` | `#34d399` | Mint Emerald |
| **Flashcard Arena** | `#10b981` | `#34d399` | Mint Emerald |

---

## 6. Interactive Diagrams Exception: Dark Telemetry Canvas in Both Themes

> 🚨 **MANDATORY INVARIANT FOR ALL INTERACTIVE DIAGRAMS**:
> All interactive diagrams (`.interactive-diagram-container`) are **cyber telemetry instruments**.
> They **APPLY FOR DARK THEME AND KEEP THE EXACT SAME DARK THEME COLORS IN LIGHT THEME**.

- **Enforced via `src/css/diagrams.css`**:
  ```css
  [data-theme="light"] .interactive-diagram-container {
    --ifm-color-content: #f8fafc;
    --ifm-color-content-secondary: #94a3b8;
    background: #0b0f19 !important;
    border: 1px solid var(--sidebar-border, rgba(74, 222, 128, 0.18)) !important;
    color: #f8fafc !important;
  }
  [data-theme="light"] .interactive-diagram-svg-wrapper {
    background-color: #0d0f1e !important;
    border: 1px solid rgba(255, 255, 255, 0.05) !important;
  }
  ```
- **Diagram Containers**: Always dark `#090b14` / `#0b0f19`, inner SVG canvas `#0d0f1e` with dot grid, detail panels `#0c0e17`.
- **Node Boxes**: Dark fills (`rgba(15, 23, 42, 0.85)` or `rgba(255, 255, 255, 0.04)`), active fills `${color}25`, glowing neon borders (`#38bdf8`, `#34d399`, `#fbbf24`, `#a78bfa`, `#f87171`).
- **Conduits & Flowing Particles**: Vibrant colored dashed paths (`.interactive-diagram-flowing-path`) and glowing arrow markers.
- **Typography inside Diagrams**: High contrast light text (`#ffffff` for titles/active items, `#e2e8f0` for body/code, `#94a3b8` for subtitles/hints).
- **NEVER use light theme tokens inside diagrams**: Do not use `#F7FDF9`, `#D9D9D9`, `#F2F2F2`, `#ffffff` backgrounds, or `#0f172a` dark text inside `.interactive-diagram-container`. Diagram components must look identical in both dark and light modes.
