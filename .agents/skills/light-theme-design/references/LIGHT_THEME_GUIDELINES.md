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

### Active Page Link in Left Menu Bar
Avoid bold or harsh active borders. Use a soft, natural frosted glass look:
```css
[data-theme="light"] .custom-menu-link.active {
  background: rgba(255, 255, 255, 0.8) !important;
  color: var(--brand-green) !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
  border-radius: 9px !important;
  font-weight: 600 !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
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

## 6. Interactive Diagrams Light Mode Adaptation

- Diagram containers must inherit `--ifm-font-family-base`.
- Outer card background: `#ffffff` or `#F7FDF9`, border `1px solid #D9D9D9`.
- Node boxes: soft background (`#F2F2F2` or `#F7FDF9`), border `1.5px solid #98A2B3`.
- Arrow conduits: darker solid SVG strokes (`#98A2B3`) with vibrant moving overlays.
- Never use bright unshaded neon highlights on white surfaces; use dark saturated primary tones.
