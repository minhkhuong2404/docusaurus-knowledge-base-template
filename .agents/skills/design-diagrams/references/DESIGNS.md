# Diagram Design Reference

This document is the authoritative design guide for all interactive React diagram components in this repository.
Read it before creating or modifying any component in `src/components/`.

---

## 1. Architecture Overview

```
src/
├── components/
│   └── <ConceptName>Diagram.tsx   ← one component per diagram
├── css/
│   └── diagrams.css               ← all shared CSS classes
└── theme/
    └── Mermaid/index.tsx          ← global Mermaid flowing-arrow override

docs/
└── **/*.md                        ← import + render the component here
```

Every diagram component:
1. Lives in `src/components/<Name>Diagram.tsx`.
2. Is a default-exported React functional component.
3. Uses `className="interactive-diagram-container"` as the outermost `<div>`.
4. Is imported directly into the `.md` file that needs it.

---

## 2. CSS Class Reference

All classes come from [`src/css/diagrams.css`](file:///Users/lukhuong/Desktop/docusaurus-knowledge-base-template/src/css/diagrams.css). Dark mode is the default; light mode overrides are included.

### Layout Classes

| Class | Purpose |
|---|---|
| `.interactive-diagram-container` | Outermost card wrapper. Dark background `#090b14`, rounded corners, shadow. |
| `.interactive-diagram-svg-wrapper` | Dark SVG canvas box. Use as the wrapper around `<svg>`. |
| `.interactive-diagram-grid-bg` | Adds dot-matrix grid texture to the SVG canvas. Combine with `.interactive-diagram-svg-wrapper`. |
| `.interactive-diagram-details-card` | Side panel for hover/click detail text. Dark card `#0c0e17`. |
| `.interactive-diagram-card-header` | Row with icon + title at the top of a details card. |
| `.interactive-diagram-helper-text` | Small muted hint text (e.g. "hover a node to inspect"). |

### Animation Classes

| Class | Purpose |
|---|---|
| `.interactive-diagram-flowing-path` | Flowing dashed stroke animation on an SVG `<path>`. |
| `.interactive-diagram-flowing-dot` | Glowing particle used with `<animateMotion>`. |
| `.interactive-diagram-pulse-dot` | Pulsing circle (radius animates 3.5px → 6px). |
| `.active-path-red/yellow/green/cyan/purple` | Colored flowing path shorthand (includes stroke color + dasharray + animation). |

### Color State Classes (for details card headings)

| Class | Color (dark) | Color (light) |
|---|---|---|
| `.details-green` h3 | `#4ade80` | `#16a34a` |
| `.details-yellow` h3 | `#fbbf24` | `#d97706` |
| `.details-red` h3 | `#f87171` | `#dc2626` |
| `.details-purple` h3 | `#a855f7` | `#9333ea` |
| `.details-cyan` h3 | `#2dd4bf` | `#0d9488` |
| `.details-blue` h3 | `#3b82f6` | `#2563eb` |
| `.details-gray` h3 | `#94a3b8` | `#475569` |

---

## 3. Color Palette

Use these exact hex values for consistency across all diagrams. Never use generic CSS color names.

| Role | Hex (dark mode) | Usage |
|---|---|---|
| Sky blue | `#38bdf8` | HTTP requests, info, neutral flows |
| Emerald | `#34d399` | Success, server responses, healthy state |
| Amber | `#fbbf24` | Warnings, redirects, intermediate states |
| Orange | `#f97316` | Client errors, 4xx, caution |
| Red | `#f87171` | Server errors, 5xx, critical state |
| Purple | `#a78bfa` | Special/advanced concepts, encryption |
| Violet | `#8b5cf6` | AQS internals, OS-level abstractions |
| Indigo | `#6366f1` | Protocol/transport layer |
| Teal | `#2dd4bf` | Streaming, data flow |
| Pink | `#f472b6` | Security attacks, highlight anomaly |

**Background alpha overlays** — always build on these for tab/button backgrounds:
- Active state: `${color}18` (hex color + `18` = ~10% opacity)
- Active border: `${color}50` (hex color + `50` = ~31% opacity)
- Hover state: `${color}0e` (hex color + `0e` = ~6% opacity)

---

## 4. Standard Header Bar

Every component must start with this header pattern:

```tsx
<div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
  <div className="interactive-diagram-header">
    {/* SVG icon — never emoji */}
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* icon paths */}
    </svg>
    <span>Descriptive Title Here</span>
    {/* Optional: action button aligned right */}
    <button style={{ marginLeft: 'auto', /* ... */ }}>Action</button>
  </div>

  {/* ... component body ... */}
</div>
```

The `.interactive-diagram-header` class is defined in `diagrams.css` and produces a flex row with a subtle bottom border.

---

## 5. The Five Diagram Archetypes

---

### Archetype A — Animated Flow Diagram

**Use for:** Protocol handshakes, request-response sequences, multi-step state flows.

**Key features:**
- Browser ↔ Server (or Actor A ↔ Actor B) layout with colored arrows between them.
- `useState` tracks which step is "active" (highlighted vs dimmed).
- Optional **Animate** button uses `useEffect` + `setTimeout` to step through arrows sequentially.
- Arrows fade to `opacity: 0.3` when inactive, slide up on activation.

**Minimal template:**

```tsx
import React, { useState, useEffect } from 'react';

const STEPS = [
  { id: 1, direction: 'right', label: 'Request', color: '#38bdf8' },
  { id: 2, direction: 'left',  label: '200 OK',  color: '#34d399' },
];

export default function MyFlowDiagram() {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [animStep, setAnimStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing || animStep >= STEPS.length) { setPlaying(false); return; }
    const t = setTimeout(() => { setActiveStep(animStep); setAnimStep(s => s + 1); }, 900);
    return () => clearTimeout(t);
  }, [playing, animStep]);

  return (
    <div className="interactive-diagram-container">
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
        <span>My Flow Diagram</span>
        <button onClick={() => { setActiveStep(null); setAnimStep(0); setPlaying(true); }}
                style={{ marginLeft: 'auto' }}>
          Animate
        </button>
      </div>

      {/* Actor boxes + arrow grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px', gap: '12px', alignItems: 'center' }}>
        {/* Left actor, arrow column, right actor */}
        {STEPS.map((step, i) => {
          const isActive = activeStep !== null && i <= activeStep;
          const isRight = step.direction === 'right';
          return (
            <div key={step.id} onClick={() => setActiveStep(i)}
                 style={{ opacity: isActive ? 1 : 0.3, transition: 'opacity 0.5s ease',
                          display: 'flex', flexDirection: isRight ? 'row' : 'row-reverse',
                          alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: 1, height: '2px',
                            background: `linear-gradient(${isRight ? '90deg' : '270deg'}, ${step.color}00, ${step.color})` }} />
              <span style={{ fontFamily: 'monospace', fontSize: '12px', color: step.color,
                             padding: '4px 10px', borderRadius: '6px',
                             background: `${step.color}18`, border: `1px solid ${step.color}40` }}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Real examples:** `HttpWhatIsDiagram.tsx`, `QuicHandshakeDiagram.tsx`, `TlsHandshakeDiagram.tsx`

---

### Archetype B — SVG Node Graph

**Use for:** Architecture diagrams with nodes (services, layers, components) and directed edges between them.

**Key features:**
- A `<svg viewBox="0 0 W H">` canvas inside `.interactive-diagram-svg-wrapper.interactive-diagram-grid-bg`.
- Nodes are `<rect>` + `<text>` pairs inside `<g onClick={...}>`.
- Edges are `<path>` elements with `id` attributes for `<animateMotion>`.
- `useState` tracks `hoveredNode` — used to apply `.node-active-<color>` filter and show a details panel.
- Moving particles use `<circle>` + `<animateMotion>` + `<mpath href="#edge-id">`.

**Minimal template:**

```tsx
import React, { useState } from 'react';

const NODES = [
  { id: 'client', x: 40, y: 100, w: 100, h: 40, label: 'Client', color: '#38bdf8' },
  { id: 'server', x: 540, y: 100, w: 100, h: 40, label: 'Server', color: '#34d399' },
];
const EDGES = [
  { id: 'e1', d: 'M 140 120 L 540 120', color: '#38bdf8', active: 'client' },
];

export default function MyNodeGraphDiagram() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="interactive-diagram-container">
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <span>My Node Graph</span>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 240" className="interactive-diagram-svg">
          <defs>
            <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="context-fill" />
            </marker>
          </defs>

          {/* Edges */}
          {EDGES.map(e => (
            <g key={e.id}>
              <path id={e.id} d={e.d} fill="none" stroke={e.color} strokeWidth="2"
                    markerEnd="url(#arr)"
                    className={hovered === e.active ? 'interactive-diagram-flowing-path' : ''} />
              {hovered === e.active && (
                <circle r="3" fill={e.color} className="interactive-diagram-flowing-dot">
                  <animateMotion dur="1.2s" repeatCount="indefinite">
                    <mpath href={`#${e.id}`} />
                  </animateMotion>
                </circle>
              )}
            </g>
          ))}

          {/* Nodes */}
          {NODES.map(n => (
            <g key={n.id} onClick={() => setHovered(hovered === n.id ? null : n.id)}
               style={{ cursor: 'pointer' }}
               className={hovered === n.id ? `node-active-${n.id === 'client' ? 'blue' : 'green'}` : ''}>
              <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="8"
                    fill={`${n.color}18`} stroke={n.color} strokeWidth="1.5" />
              <text x={n.x + n.w / 2} y={n.y + n.h / 2 + 5} textAnchor="middle"
                    fill={n.color} fontSize="13" fontWeight="700">{n.label}</text>
            </g>
          ))}
        </svg>
      </div>

      {/* Details panel */}
      {hovered && (
        <div className="interactive-diagram-details-card">
          <p>Details about <strong>{hovered}</strong> go here.</p>
        </div>
      )}
    </div>
  );
}
```

**Real examples:** `CircuitBreakerDiagram.tsx`, `AQSArchitectureDiagram.tsx`, `CollectionsHierarchyDiagram.tsx`

---

### Archetype C — Tabbed Explorer

**Use for:** Side-by-side comparisons, feature matrix, protocol comparison (HTTP/1.1 vs 2 vs 3), evolution timelines.

**Key features:**
- A row of tab buttons with `activeTab` state.
- Clicking a tab switches the content panel below.
- Optionally a second level: clicking a row in the list opens a detail panel on the right.

**Minimal template:**

```tsx
import React, { useState } from 'react';

const TABS = [
  { id: 'a', label: 'Tab A', color: '#38bdf8', content: 'Content for A' },
  { id: 'b', label: 'Tab B', color: '#34d399', content: 'Content for B' },
];

export default function MyTabbedDiagram() {
  const [activeTab, setActiveTab] = useState('a');
  const tab = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="interactive-diagram-container">
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
        </svg>
        <span>My Tabbed Diagram</span>
      </div>

      {/* Tab buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '13px',
            background: activeTab === t.id ? `${t.color}18` : 'rgba(255,255,255,0.04)',
            color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}50` : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content panel */}
      <div style={{ padding: '16px', borderRadius: '10px',
                    background: `${tab.color}08`, border: `1px solid ${tab.color}30` }}>
        <p style={{ color: 'var(--ifm-color-content)', margin: 0 }}>{tab.content}</p>
      </div>
    </div>
  );
}
```

**Real examples:** `HttpStatusCodesDiagram.tsx`, `HttpHeadersDiagram.tsx`, `QuicFlowCongestionLossDiagram.tsx`

---

### Archetype D — Searchable List + Detail Panel

**Use for:** Reference data where users need to look up specific items — HTTP headers, status codes, API surface, configuration options.

**Key features:**
- A scrollable list on the left (`maxHeight`, `overflowY: auto`).
- A detail panel on the right that shows when an item is selected.
- Optional `<input>` search box that filters the list in real time.

**Minimal template:**

```tsx
import React, { useState } from 'react';

const ITEMS = [
  { name: 'Authorization', purpose: 'Auth credentials', example: 'Bearer <token>', note: 'Never log this.' },
  { name: 'Content-Type',  purpose: 'Body format',      example: 'application/json', note: 'Always set.' },
];

export default function MySearchableDiagram() {
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch]     = useState('');
  const color = '#38bdf8';

  const filtered = ITEMS.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.purpose.toLowerCase().includes(search.toLowerCase())
  );
  const item = ITEMS.find(i => i.name === selected);

  return (
    <div className="interactive-diagram-container">
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <span>My Searchable Reference</span>
        <input type="text" placeholder="Search…" value={search}
               onChange={e => { setSearch(e.target.value); setSelected(null); }}
               style={{ marginLeft: 'auto', padding: '6px 10px', borderRadius: '7px',
                        border: '1px solid rgba(255,255,255,0.12)',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--ifm-color-content)', fontSize: '12px', outline: 'none' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px',
                      maxHeight: '320px', overflowY: 'auto' }}>
          {filtered.map(i => (
            <button key={i.name} onClick={() => setSelected(selected === i.name ? null : i.name)} style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              padding: '8px 12px', borderRadius: '7px', border: 'none',
              cursor: 'pointer', textAlign: 'left',
              background: selected === i.name ? `${color}15` : 'rgba(255,255,255,0.03)',
              boxShadow: selected === i.name ? `0 0 0 1.5px ${color}50` : '0 0 0 1px rgba(255,255,255,0.06)',
              transition: 'all 0.2s ease',
            }}>
              <code style={{ fontSize: '11px', fontWeight: 700, color,
                             background: `${color}15`, borderRadius: '4px', padding: '1px 5px' }}>
                {i.name}
              </code>
              <span style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
                {i.purpose}
              </span>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.08)', padding: '18px',
                      display: 'flex', flexDirection: 'column', justifyContent: item ? 'flex-start' : 'center' }}>
          {item ? (
            <>
              <code style={{ fontWeight: 800, fontSize: '14px', color,
                             background: `${color}15`, borderRadius: '6px',
                             padding: '3px 8px', marginBottom: '10px', display: 'inline-block' }}>
                {item.name}
              </code>
              <div style={{ fontFamily: 'monospace', fontSize: '12px',
                            background: 'rgba(0,0,0,0.25)', borderRadius: '6px',
                            padding: '8px 10px', color: '#e2e8f0', marginBottom: '10px' }}>
                {item.name}: {item.example}
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6 }}>
                {item.note}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--ifm-color-content-secondary)', fontSize: '13px' }}>
              Select an item to see details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Real examples:** `HttpHeadersDiagram.tsx`, `HttpStatusCodesDiagram.tsx`

---

### Archetype E — Interactive Checklist

**Use for:** Production readiness checklists, pre-launch audits, review criteria.

**Key features:**
- Categorized sections with tab buttons.
- Each item has a real checkbox (`useState<Record<string, boolean>>`).
- A progress bar updates as items are checked.
- Optional expandable "why?" note per item (toggle with a small button).

**Minimal template:**

```tsx
import React, { useState } from 'react';

const ITEMS = [
  { id: 'a', text: 'TLS 1.3 enabled', note: 'TLS 1.0/1.1 are vulnerable to POODLE/BEAST.' },
  { id: 'b', text: 'HSTS configured', note: 'max-age=31536000; includeSubDomains; preload' },
];
const color = '#f87171';

export default function MyChecklistDiagram() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  const done = ITEMS.filter(i => checked[i.id]).length;
  const pct = (done / ITEMS.length) * 100;

  return (
    <div className="interactive-diagram-container">
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 11l3 3L22 4"/>
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
        </svg>
        <span>My Checklist</span>
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#34d399', fontWeight: 700 }}>
          {done}/{ITEMS.length}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)' }}>
        <div style={{ height: '100%', borderRadius: '3px', width: `${pct}%`,
                      background: pct === 100 ? '#34d399' : `linear-gradient(90deg, ${color}99, ${color})`,
                      transition: 'width 0.4s ease' }} />
      </div>

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {ITEMS.map(item => (
          <div key={item.id}>
            <div onClick={() => toggle(item.id)} style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
              borderRadius: '8px', cursor: 'pointer',
              background: checked[item.id] ? `${color}0e` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${checked[item.id] ? color + '35' : 'rgba(255,255,255,0.07)'}`,
              transition: 'all 0.2s ease',
            }}>
              {/* Checkbox */}
              <div style={{ width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0,
                            border: `2px solid ${checked[item.id] ? color : 'rgba(255,255,255,0.2)'}`,
                            background: checked[item.id] ? color : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s ease' }}>
                {checked[item.id] && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="1.8"
                              strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span style={{ fontSize: '13px', color: 'var(--ifm-color-content)',
                             textDecoration: checked[item.id] ? 'line-through' : 'none',
                             transition: 'all 0.2s ease' }}>
                {item.text}
              </span>
              {item.note && (
                <button onClick={e => { e.stopPropagation(); setExpanded(expanded === item.id ? null : item.id); }}
                        style={{ marginLeft: 'auto', padding: '1px 6px', borderRadius: '4px',
                                 border: 'none', background: `${color}20`, color,
                                 fontSize: '10.5px', fontWeight: 600, cursor: 'pointer' }}>
                  {expanded === item.id ? 'hide' : 'why?'}
                </button>
              )}
            </div>
            {item.note && expanded === item.id && (
              <div style={{ marginTop: '3px', marginLeft: '28px', padding: '8px 12px',
                            background: `${color}10`, border: `1px solid ${color}30`,
                            borderRadius: '6px', fontSize: '12.5px',
                            color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6 }}>
                {item.note}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Real examples:** `ProductionChecklistDiagram.tsx`

---

## 6. The `interactive-diagram-header` Pattern

The header bar must always:
1. Use an inline `<svg>` icon (24×24 viewBox, `stroke="currentColor"`, `strokeWidth="2"`).
2. Have a short descriptive `<span>` title.
3. Place optional action elements (`<button>`, badge) with `marginLeft: 'auto'`.

Do **not** use emoji characters in headers — they render inconsistently across platforms. Use SVG paths from [Feather Icons](https://feathericons.com/) or Heroicons.

Common icon patterns:
```tsx
{/* Globe — HTTP/networking */}
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
</svg>

{/* Lock — security/TLS */}
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
</svg>

{/* Layers — protocol stack */}
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <polygon points="12 2 2 7 12 12 22 7 12 2"/>
  <polyline points="2 17 12 22 22 17"/>
  <polyline points="2 12 12 17 22 12"/>
</svg>

{/* Check-square — checklist */}
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <path d="M9 11l3 3L22 4"/>
  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
</svg>

{/* Activity — data flow/stream */}
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
</svg>
```

---

## 7. Pitfalls & Rules

| Rule | Why |
|---|---|
| Never leave dangling ternary branches (e.g. `x ? a :`) | Rspack compilation failure |
| Never use `{/* ... */}` inline comment inside JSX string templates | Parser error |
| Never put emoji in `<span>` inside diagram headers | Renders as box on some OS/fonts |
| Always set `strokeLinecap="round"` and `strokeLinejoin="round"` on icons | Consistent look |
| Always set `fill="none"` on icon SVGs | Avoids fill bleed on complex paths |
| Use `var(--ifm-color-content)` and `var(--ifm-color-content-secondary)` for text | Automatic light/dark mode support |
| Use `var(--ifm-font-family-base)` on container `fontFamily` | Matches Docusaurus body font |
| Use `fontFamily: 'monospace'` for code/hex/IP values | Clear visual distinction |

---

## 8. Two-Column Grid Layout

Most diagrams use a two-column layout: list on the left, detail panel on the right.

```tsx
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
  {/* Left: scrollable list */}
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px',
                maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
    {/* items */}
  </div>

  {/* Right: detail panel */}
  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)', padding: '20px',
                display: 'flex', flexDirection: 'column',
                justifyContent: selectedItem ? 'flex-start' : 'center' }}>
    {selectedItem ? (
      <div>{/* detail content */}</div>
    ) : (
      <div style={{ textAlign: 'center', color: 'var(--ifm-color-content-secondary)', fontSize: '13px' }}>
        Select an item to see details
      </div>
    )}
  </div>
</div>
```

---

## 9. Integrating into Markdown

```markdown
---
id: my-doc
title: My Doc
---

import MyDiagram from '@site/src/components/MyDiagram';

## My Section

<MyDiagram />
```

Rules:
- Imports must go **after** the frontmatter `---` block and **before** any `#` headings, or immediately after the first heading and before content.
- In practice for this repo, imports are placed right after the frontmatter block.
- Multiple imports per file are fine and follow alphabetical order by convention.

---

## 10. Real Component Index

| Component | Archetype | Section |
|---|---|---|
| `HttpWhatIsDiagram.tsx` | A — Animated Flow | What Is HTTP? |
| `HttpIntroDiagram.tsx` | B — Node Graph | HTTP Request Structure |
| `HttpMethodDecisionDiagram.tsx` | C — Tabbed | Decision Framework |
| `HttpStatusCodesDiagram.tsx` | C+D — Tabbed + Searchable | Status Codes |
| `HttpHeadersDiagram.tsx` | D — Searchable | HTTP Headers |
| `HttpCachingDiagram.tsx` | C — Tabbed | HTTP Caching |
| `HttpEvolutionDiagram.tsx` | C — Tabbed | Protocol Evolution |
| `QuicStackDiagram.tsx` | B — Node Graph | HTTP/3 Stack |
| `TlsHandshakeDiagram.tsx` | A — Animated Flow | TLS 1.3 Handshake |
| `CertChainDiagram.tsx` | B — Node Graph | Certificate Chain |
| `CorsDiagram.tsx` | A — Animated Flow | CORS Preflight |
| `ProductionChecklistDiagram.tsx` | E — Checklist | Production Readiness |
| `CircuitBreakerDiagram.tsx` | B — Node Graph | Circuit Breaker states |
| `CollectionsHierarchyDiagram.tsx` | B — Node Graph | Java Collections |
| `AQSArchitectureDiagram.tsx` | B — Node Graph | Java AQS |
