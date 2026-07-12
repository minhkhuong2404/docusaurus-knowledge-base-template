# DESIGNS.md — Interactive Diagram Design Specification

> **AGENT INSTRUCTION**: Read this entire document before writing any diagram component.
> Follow every rule exactly. Do not deviate from the color palette, class names, or archetype templates.

---

## Quick-Start Decision Tree

```
Is there a static ASCII block, code block, or table to replace?
├─ YES → Is it a sequence/handshake/flow?             → Archetype A (Animated Flow)
│         Is it nodes + directed edges?               → Archetype B (SVG Node Graph)
│         Is it comparison/tabs/protocol evolution?   → Archetype C (Tabbed Explorer)
│         Is it a lookup reference (headers/codes)?   → Archetype D (Searchable List)
│         Is it a checklist/audit criteria?           → Archetype E (Interactive Checklist)
└─ NO  → Do not create a component.
```

---

## File Naming & Location

```
src/components/<ConceptName>Diagram.tsx
```

- Name must end in `Diagram`.
- Name the concept, not the page: `TlsHandshakeDiagram` not `HttpsPageDiagram`.
- One component per concept. One default export per file.

---

## Skeleton Every Component Must Follow

```tsx
import React, { useState } from 'react';

export default function MyConcept Diagram() {
  // 1. All interactive state declared here
  const [activeItem, setActiveItem] = useState<string | null>(null);

  return (
    // 2. Outermost wrapper — ALWAYS this class
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>

      {/* 3. Header bar — ALWAYS present */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* icon paths — see Section 6 for common icons */}
        </svg>
        <span>Descriptive Title (no emoji)</span>
        {/* Optional: action button with marginLeft:'auto' */}
      </div>

      {/* 4. Component body — choose an archetype below */}

    </div>
  );
}
```

---

## CSS Classes Reference

All classes are in [`src/css/diagrams.css`](file:///Users/lukhuong/Desktop/docusaurus-knowledge-base-template/src/css/diagrams.css). Do not inline styles for things already covered by these classes.

### Layout

| Class | Use for |
|---|---|
| `.interactive-diagram-container` | **Required outermost wrapper.** Dark card `#090b14`, 16px rounded, shadow. |
| `.interactive-diagram-svg-wrapper` | Wrapper around `<svg>` canvas. Dark `#0d0f1e`, inner shadow. |
| `.interactive-diagram-grid-bg` | Dot-matrix grid texture. Add alongside `.interactive-diagram-svg-wrapper`. |
| `.interactive-diagram-details-card` | Hover/click detail side panel. Dark `#0c0e17`. |
| `.interactive-diagram-card-header` | Flex row with icon + title inside a details card. |
| `.interactive-diagram-helper-text` | Small muted hint text ("click a node to inspect"). |

### Animation

| Class | Use for |
|---|---|
| `.interactive-diagram-flowing-path` | Flowing dashed stroke on SVG `<path>`. Apply conditionally on hover/active state. |
| `.interactive-diagram-flowing-dot` | Glowing particle `<circle>` used with `<animateMotion>`. |
| `.interactive-diagram-pulse-dot` | Pulsing circle (radius 3.5px → 6px). |
| `.active-path-red/yellow/green/cyan/purple` | Pre-built colored flowing path (includes color + dasharray + animation). |

### Color State Helpers (apply to `.interactive-diagram-details-card`)

| Class | Dark Mode Color | Light Mode Color |
|---|---|---|
| `.details-green` | `#4ade80` | `#16a34a` |
| `.details-yellow` | `#fbbf24` | `#d97706` |
| `.details-red` | `#f87171` | `#dc2626` |
| `.details-purple` | `#a855f7` | `#9333ea` |
| `.details-cyan` | `#2dd4bf` | `#0d9488` |
| `.details-blue` | `#3b82f6` | `#2563eb` |
| `.details-gray` | `#94a3b8` | `#475569` |

---

## Color Palette

**Only use these hex values.** Never use CSS color keywords (`red`, `blue`, `green`).

| Name | Hex | Semantic role |
|---|---|---|
| Sky blue | `#38bdf8` | HTTP requests, neutral info flows |
| Emerald | `#34d399` | Success, server responses, healthy |
| Amber | `#fbbf24` | Warnings, redirects, intermediate |
| Orange | `#f97316` | Client errors (4xx), caution |
| Red | `#f87171` | Server errors (5xx), critical |
| Purple | `#a78bfa` | Encryption, advanced/special |
| Violet | `#8b5cf6` | OS/kernel, AQS internals |
| Teal | `#2dd4bf` | Streaming, data flow |
| Pink | `#f472b6` | Security attacks, anomalies |

**Alpha overlay formula** (append to hex):

| Opacity | Suffix | Example | Use for |
|---|---|---|---|
| ~10% | `18` | `#38bdf818` | Active tab/button background |
| ~31% | `50` | `#38bdf850` | Active tab/button border |
| ~6% | `0e` | `#38bdf80e` | Hover row background |
| ~25% | `40` | `#38bdf840` | Border on hover item |

---

## Archetype A — Animated Flow

**Use when:** The content is a sequence: request → response, handshake steps, multi-actor message flow.

**Structure:**
- Three-column grid: `[Actor A box] [arrows column] [Actor B box]`
- Each step is a row in the arrows column with a direction (left or right arrow)
- Steps dim to `opacity: 0.3` when not active
- Optional **Animate** button steps through with `useEffect` + `setTimeout`

**Full template:**

```tsx
import React, { useState, useEffect } from 'react';

const STEPS = [
  { id: 1, direction: 'right' as const, label: 'GET /resource', color: '#38bdf8', note: 'Client requests' },
  { id: 2, direction: 'left'  as const, label: '200 OK + Body', color: '#34d399', note: 'Server responds' },
];

export default function MyFlowDiagram() {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [animStep, setAnimStep]     = useState(0);
  const [playing, setPlaying]       = useState(false);

  useEffect(() => {
    if (!playing || animStep >= STEPS.length) { setPlaying(false); return; }
    const t = setTimeout(() => { setActiveStep(animStep); setAnimStep(s => s + 1); }, 900);
    return () => clearTimeout(t);
  }, [playing, animStep]);

  const handlePlay = () => { setActiveStep(null); setAnimStep(0); setPlaying(true); };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
        <span>My Flow Title</span>
        <button onClick={handlePlay} disabled={playing}
                style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: '8px',
                         border: 'none', cursor: playing ? 'not-allowed' : 'pointer',
                         fontWeight: 600, fontSize: '12px',
                         background: playing ? 'rgba(255,255,255,0.06)' : 'rgba(56,189,248,0.15)',
                         color: playing ? 'var(--ifm-color-content-secondary)' : '#38bdf8',
                         boxShadow: playing ? 'none' : '0 0 0 1.5px rgba(56,189,248,0.4)',
                         transition: 'all 0.2s ease' }}>
          {playing ? 'Playing…' : 'Animate'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 130px', gap: '12px', alignItems: 'center' }}>
        {/* Actor A */}
        <div style={{ background: 'rgba(56,189,248,0.10)', border: '1.5px solid rgba(56,189,248,0.35)',
                      borderRadius: '12px', padding: '14px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>Client</div>
        </div>

        {/* Steps column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {STEPS.map((step, i) => {
            const isActive = activeStep !== null && i <= activeStep;
            const isRight  = step.direction === 'right';
            return (
              <div key={step.id} onClick={() => setActiveStep(activeStep === i ? null : i)}
                   style={{ display: 'flex', flexDirection: isRight ? 'row' : 'row-reverse',
                            alignItems: 'center', gap: '8px', cursor: 'pointer',
                            opacity: isActive ? 1 : 0.3,
                            transition: 'opacity 0.5s ease, transform 0.3s ease',
                            transform: isActive ? 'translateY(0)' : 'translateY(4px)' }}>
                {/* Arrow line */}
                <div style={{ flex: 1, height: '2px',
                              background: `linear-gradient(${isRight ? '90deg' : '270deg'}, ${step.color}00, ${step.color})`,
                              position: 'relative' }}>
                  <div style={{ position: 'absolute',
                                [isRight ? 'right' : 'left']: '-1px', top: '-4px',
                                width: 0, height: 0,
                                borderTop: '5px solid transparent', borderBottom: '5px solid transparent',
                                [isRight ? 'borderLeft' : 'borderRight']: `8px solid ${step.color}` }} />
                </div>
                {/* Label */}
                <div style={{ padding: '5px 10px', borderRadius: '7px', flexShrink: 0,
                              background: `${step.color}18`, border: `1px solid ${step.color}40` }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '11.5px', color: step.color, fontWeight: 700 }}>
                    {step.label}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '1px' }}>
                    {step.note}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actor B */}
        <div style={{ background: 'rgba(52,211,153,0.10)', border: '1.5px solid rgba(52,211,153,0.35)',
                      borderRadius: '12px', padding: '14px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#34d399' }}>Server</div>
        </div>
      </div>
    </div>
  );
}
```

**Real examples:** `HttpWhatIsDiagram.tsx`, `TlsHandshakeDiagram.tsx`, `CorsDiagram.tsx`

---

## Archetype B — SVG Node Graph

**Use when:** The content is an architecture — nodes (services, components, layers) connected by directed edges.

**Structure:**
- `<svg viewBox="0 0 W H">` inside `.interactive-diagram-svg-wrapper.interactive-diagram-grid-bg`
- Nodes: `<g onClick>` containing `<rect>` + `<text>`
- Edges: `<path id="e1">` with `markerEnd="url(#arr)"`
- Particles: `<circle><animateMotion><mpath href="#e1"/></animateMotion></circle>` (conditional on hover)
- Details panel below SVG shows on `hoveredNode !== null`

**Arrowhead marker (always use `context-fill`):**

```tsx
<defs>
  <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
    <path d="M0,0 L0,6 L8,3 z" fill="context-fill" />
  </marker>
</defs>
```

**Node pattern:**

```tsx
<g key={node.id}
   onClick={() => setHovered(hovered === node.id ? null : node.id)}
   style={{ cursor: 'pointer' }}
   className={hovered === node.id ? 'node-active-green' : ''}>
  <rect x={node.x} y={node.y} width={node.w} height={node.h} rx="8"
        fill={`${node.color}18`} stroke={node.color} strokeWidth="1.5" />
  <text x={node.x + node.w / 2} y={node.y + node.h / 2 + 5}
        textAnchor="middle" fill={node.color} fontSize="13" fontWeight="700">
    {node.label}
  </text>
</g>
```

**Edge + particle pattern:**

```tsx
<path id="e-client-server" d="M 140 120 L 540 120"
      fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arr)"
      className={hovered === 'client' ? 'interactive-diagram-flowing-path' : ''} />
{hovered === 'client' && (
  <circle r="3" fill="#38bdf8" className="interactive-diagram-flowing-dot">
    <animateMotion dur="1.2s" repeatCount="indefinite">
      <mpath href="#e-client-server" />
    </animateMotion>
  </circle>
)}
```

**Real examples:** `CircuitBreakerDiagram.tsx`, `AQSArchitectureDiagram.tsx`, `CollectionsHierarchyDiagram.tsx`

---

## Archetype C — Tabbed Explorer

**Use when:** Multiple distinct views of the same concept (HTTP version comparison, phase-by-phase breakdown, protocol features).

**Tab button pattern:**

```tsx
{TABS.map(t => (
  <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
    padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
    fontWeight: 600, fontSize: '13px',
    background: activeTab === t.id ? `${t.color}18` : 'rgba(255,255,255,0.04)',
    color:      activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
    boxShadow:  activeTab === t.id ? `0 0 0 1.5px ${t.color}50` : '0 0 0 1px rgba(255,255,255,0.08)',
    transition: 'all 0.2s ease',
  }}>
    {t.label}
  </button>
))}
```

**Real examples:** `HttpStatusCodesDiagram.tsx`, `HttpEvolutionDiagram.tsx`, `QuicFlowCongestionLossDiagram.tsx`

---

## Archetype D — Searchable List + Detail Panel

**Use when:** A large reference list that users need to filter and look up (headers, status codes, config keys).

**Two-column grid layout:**

```tsx
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
  {/* LEFT: scrollable list */}
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px',
                maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
    {filtered.map(item => (
      <button key={item.name} onClick={() => setSelected(selected === item.name ? null : item.name)} style={{
        display: 'flex', alignItems: 'flex-start', gap: '10px',
        padding: '9px 12px', borderRadius: '7px', border: 'none',
        cursor: 'pointer', textAlign: 'left',
        background: selected === item.name ? `${color}15` : 'rgba(255,255,255,0.03)',
        boxShadow: selected === item.name ? `0 0 0 1.5px ${color}50` : '0 0 0 1px rgba(255,255,255,0.06)',
        transition: 'all 0.2s ease',
      }}>
        <code style={{ fontSize: '11.5px', fontWeight: 700, color,
                       background: `${color}15`, borderRadius: '4px', padding: '1px 5px' }}>
          {item.name}
        </code>
        <span style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          {item.purpose}
        </span>
      </button>
    ))}
  </div>

  {/* RIGHT: detail panel */}
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

**Search box pattern (place in header with `marginLeft: 'auto'`):**

```tsx
<input type="text" placeholder="Search…" value={search}
       onChange={e => { setSearch(e.target.value); setSelected(null); }}
       style={{ marginLeft: 'auto', padding: '7px 12px', borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--ifm-color-content)', fontSize: '12.5px',
                outline: 'none', width: '160px' }} />
```

**Real examples:** `HttpHeadersDiagram.tsx`, `HttpStatusCodesDiagram.tsx`

---

## Archetype E — Interactive Checklist

**Use when:** A pre-launch checklist or review criteria with categories.

**Checkbox pattern:**

```tsx
<div onClick={() => toggle(key)} style={{
  display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
  borderRadius: '8px', cursor: 'pointer',
  background: isChecked ? `${color}0e` : 'rgba(255,255,255,0.03)',
  border: `1px solid ${isChecked ? color + '35' : 'rgba(255,255,255,0.07)'}`,
  transition: 'all 0.2s ease',
}}>
  {/* Visual checkbox */}
  <div style={{ width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0,
                border: `2px solid ${isChecked ? color : 'rgba(255,255,255,0.2)'}`,
                background: isChecked ? color : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease' }}>
    {isChecked && (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )}
  </div>
  <span style={{ fontSize: '13px', color: 'var(--ifm-color-content)',
                 textDecoration: isChecked ? 'line-through' : 'none',
                 transition: 'all 0.2s ease' }}>
    {item.text}
  </span>
</div>
```

**Progress bar pattern:**

```tsx
<div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
  <div style={{ height: '100%', borderRadius: '3px', width: `${progress}%`,
                background: progress === 100 ? '#34d399' : `linear-gradient(90deg, ${color}99, ${color})`,
                transition: 'width 0.4s ease' }} />
</div>
```

**Real example:** `ProductionChecklistDiagram.tsx`

---

## Header Icon Library

Use these inline SVG icons. All use `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `strokeWidth="2"`, `strokeLinecap="round"`, `strokeLinejoin="round"`.

```tsx
{/* Globe — HTTP, networking, web */}
<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>

{/* Lock — security, TLS, auth */}
<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
<path d="M7 11V7a5 5 0 0 1 10 0v4"/>

{/* Layers — protocol stack, OSI model */}
<polygon points="12 2 2 7 12 12 22 7 12 2"/>
<polyline points="2 17 12 22 22 17"/>
<polyline points="2 12 12 17 22 12"/>

{/* Arrow right — request flow, sequence */}
<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>

{/* Server/database — backend, services */}
<rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>
<line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>

{/* Monitor — client, browser */}
<rect x="2" y="3" width="20" height="14" rx="2"/>
<line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>

{/* Check-square — checklist */}
<path d="M9 11l3 3L22 4"/>
<path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>

{/* Search — searchable reference */}
<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>

{/* Activity — data flow, streaming */}
<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>

{/* Code — programming, methods */}
<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>

{/* Shield — security headers, firewall */}
<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>

{/* Grid — collections, framework */}
<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
<rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
```

---

## Pitfalls Checklist

Before submitting a component, verify:

- [ ] `className="interactive-diagram-container"` is on the outermost `<div>`
- [ ] Header uses `<svg>` icon, not emoji
- [ ] All hex colors are from the palette table above
- [ ] Text uses `var(--ifm-color-content)` / `var(--ifm-color-content-secondary)`
- [ ] Every ternary has a `false` branch (no dangling `x ? a :`)
- [ ] `<marker>` path uses `fill="context-fill"` not a hardcoded color
- [ ] SVG `<text>` has `textAnchor` set (`middle`, `start`, or `end`)
- [ ] The markdown import is added after the frontmatter block
- [ ] Dev server shows `compiled successfully` after saving

---

## Integration Checklist

```markdown
{/* Step 1: Add import after frontmatter */}
import MyDiagram from '@site/src/components/MyDiagram';

{/* Step 2: Replace static content in the section */}
<MyDiagram />
```

- Imports go **immediately after** the closing `---` of the frontmatter.
- Multiple imports are fine; keep them grouped together.
- The static content (ASCII block, mermaid block, table) is **fully replaced** — do not keep both.
