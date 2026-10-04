---
name: light-theme-design
description: Design system tokens, contrast rules, badge/toast styles, and light theme configurations for Docusaurus, Arcade, Career Hub, and interactive diagrams
---

# Skill: Light Theme Design System & UI Configuration

This skill defines the official design tokens, color palette, contrast standards, component rules, and verification procedures for the light theme across this Docusaurus knowledge base.

Read the complete specifications in [references/LIGHT_THEME_GUIDELINES.md](./references/LIGHT_THEME_GUIDELINES.md).

---

## 1. Core Light Theme Color Palette

Always use the exact curated tokens specified by the user:

| Token | Hex Value | Semantic Usage |
|---|---|---|
| **Page Background** | `#F2F4F7` | Body background, outer page backdrop |
| **Surface Mint** | `#F7FDF9` | Card accents, mint-tinted surfaces, active card highlights |
| **Surface Neutral / Chips** | `#F2F2F2` | Secondary cards, sub-cards, neutral chips, unselected badges ("toasts") |
| **Background Grey / Border** | `#98A2B3` | Secondary borders, unselected button borders, dividers, dark border definition |
| **Whiter Grey / Border** | `#D9D9D9` | Subtle borders, light card borders, inactive dividers |
| **Primary Text** | `#0f172a` / `#1e293b` | Headings, card titles, main text, option text (NEVER pure white) |
| **Secondary Text** | `#334155` / `#475569` | Subtitles, descriptions, metadata, timestamps |
| **Brand Primary Green** | `#2f8f4e` / `#22c55e` | Primary navigation accents, read completed indicators |

---

## 2. Mandatory Contrast & Typography Rules

### No White Text in Light Mode
- Elements with hardcoded `#ffffff`, `rgba(255, 255, 255, ...)`, `#f8fafc` must be scoped or overridden in `[data-theme="light"]` to `#0f172a` or `#1e293b`.
- Titles containing inline code blocks (e.g. `git commit` in backticks) must have dark monospace text with soft tinted backgrounds (`#F2F2F2` with border `#D9D9D9`), never disappearing into the white surface.
- Hover states on buttons, answer options, and menu links must maintain dark text (`#0f172a` / `#1e293b`) on hover, never inverting to white.

### Glassmorphism & Subtle Borders
- Active page links and cards must use light, natural glass borders:
  ```css
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
  background: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(8px) !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03) !important;
  border-radius: 9px !important;
  ```
- Avatar icon hover borders must be soft and thin (`1px solid rgba(0, 0, 0, 0.15)` or `1.5px solid var(--brand-green)`), never thick or harsh.
- Career Hub `#` sections must include defined light borders (`1px solid #D9D9D9` or `#98A2B3`).

---

## 3. Badges, Chips, Pills & "Toasts" Specifications

All small badge/tag/chip components (referred to as "toasts" by the user) must be dark, high-contrast, and solid—never washed-out white pastels:

| Category | Background | Border | Text Color |
|---|---|---|---|
| **Neutral / Unsolved** | `#F2F2F2` | `1px solid #98A2B3` | `#1e293b` / `#334155` |
| **Easy / Solved / P3** | `#dcfce7` | `1px solid #86efac` | `#166534` / `#15803d` |
| **Medium / Mid / P2** | `#fef3c7` | `1px solid #fcd34d` | `#92400e` |
| **Hard / Senior / P0** | `#fee2e2` | `1px solid #fca5a5` | `#991b1b` |
| **Company / Blue** | `#e0e7ff` / `#e0f2fe` | `1px solid #c7d2fe` / `#7dd3fc` | `#3730a3` / `#0369a1` |
| **Purple / Lesson Doc / All Levels** | `#f3e8ff` | `1px solid #d8b4fe` | `#6b21a8` |

---

## 4. Arcade Start Game Buttons (Radiant Lighter Gradients)

Never use dark navy or near-black gradient endpoints (e.g. `#1e1b4b`). Use luminous, vibrant gradients:

- **Violet/Purple (System Design / Outage Boss)**: `linear-gradient(135deg, #9333ea 0%, #c084fc 100%)`
- **Amber/Orange (Spot The Bug / Blitz)**: `linear-gradient(135deg, #f59e0b 0%, #fb923c 100%)`
- **Sky Blue/Cyan (Architecture Pipe)**: `linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)`
- **Emerald/Mint (SQL Index / Match Grid)**: `linear-gradient(135deg, #10b981 0%, #34d399 100%)`
- **Action Button Hover**:
  ```css
  .arcade-start-btn {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25) !important;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }
  .arcade-start-btn:hover:not(:disabled) {
    transform: translateY(-2px) !important;
    filter: brightness(1.08) !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18) !important;
  }
  ```

---

## 5. Interactive Diagrams Exception: Dark Telemetry Canvas in Both Themes

> 🚨 **MANDATORY INVARIANT FOR ALL INTERACTIVE DIAGRAMS**:
> All interactive diagrams (`.interactive-diagram-container`) are **cyber telemetry instruments**.
> They **APPLY FOR DARK THEME AND KEEP THE EXACT SAME DARK THEME COLORS IN LIGHT THEME**.

- Enforced via `src/css/diagrams.css` (`[data-theme="light"] .interactive-diagram-container` sets dark background `#0b0f19 !important` and light text `#f8fafc !important`).
- SVG canvas wrappers must use `.interactive-diagram-svg-wrapper.interactive-diagram-grid-bg` (`#0d0f1e`).
- Nodes must use dark fills (`rgba(15, 23, 42, 0.85)` / `rgba(255, 255, 255, 0.04)`) with glowing neon borders.
- Typography inside diagrams must ALWAYS be light and high-contrast: `#ffffff` for titles, `#e2e8f0` for body/code, `#94a3b8` for subtitles/hints.
- **NEVER** use light theme page tokens (`#F7FDF9`, `#D9D9D9`, `#0f172a` text, `#F2F2F2`) inside interactive diagram components.

---

## 6. Verification Checklist

Whenever modifying light theme styles:
1. `node scripts/checkstyle.js --quiet` — Must pass with 0 errors across 800 files.
2. Verify in both `[data-theme="light"]` and `[data-theme="dark"]` for no text invisibility or clashing borders.
3. Do NOT run `yarn build` or `yarn test` unless explicitly requested.

