# DESIGNS.md — Interactive Diagram Design Specification

> **AGENT INSTRUCTION**: Read this entire document before writing any diagram component.
> Follow every rule exactly. Do not deviate from the color palette, class names, or archetype templates.

---

## 🚨 MANDATORY REQUIREMENT: ALWAYS GENERATE INTERACTIVE DIAGRAMS WITH MOVING ARROWS ONLY

- **NO MONOSPACE SCHEMA INSPECTORS**: Never generate static code block inspectors, text-heavy card lists, or monospace trees.
- **MOVING ARROWS ON ALL DIAGRAMS**: Every generated diagram MUST feature interactive visual elements with **moving/flowing arrows** (e.g. `.interactive-diagram-flowing-path`, animated step-by-step directional arrows, or SVG conduits with moving arrow markers).
- **GENUINE VISUAL CANVASES**: Use SVG vector canvases (`<svg viewBox>`) with grid backgrounds (`.interactive-diagram-grid-bg`) or step-by-step playback sequencers.

---

## Quick-Start Decision Tree

```
Is there a static ASCII block, code block, table, or text-only stub to replace?
├─ YES → Is it a sequence/handshake/flow/payload transit?   → Archetype A (Animated Flow with Moving Arrows)
│         Is it nodes + directed edges/architecture/data?  → Archetype B (SVG Node Graph with Flowing Arrows)
│         Is it comparison/tabs/protocol evolution?         → Archetype C (Tabbed Explorer with SVG Flow)
│         Is it a lookup reference (headers/tools)?         → Archetype D (Searchable List)
│         Is it a checklist/audit criteria?                 → Archetype E (Interactive Checklist)
└─ NO  → Do not create a component.

⚠️ MANDATORY RULE: NEVER generate Monospace Schema Inspector diagrams.
Wire formats, packet headers, schemas, runbooks, and payload transformations must ALWAYS be visualized
as interactive diagrams featuring moving/flowing directional arrows and animated step playback.
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

export default function MyConceptDiagram(): React.JSX.Element {
  // 1. Interactive state
  const [selected, setSelected] = useState<string | null>(null);

  return (
    // 2. Outermost wrapper — ALWAYS this class
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>

      {/* 3. Header bar — ALWAYS present */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
             stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* icon paths — see Section 6 */}
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Descriptive Title (no emoji)
        </span>
        {/* Optional: action button with marginLeft: 'auto' */}
      </div>

      {/* 4. Component body — choose an archetype below */}
      <div style={{ padding: '16px' }}>
        {/* Archetype JSX content */}
      </div>

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
| `.interactive-diagram-header` | Standard header bar with border, flex alignment, and icon spacing. |
| `.interactive-diagram-svg-wrapper` | Wrapper around `<svg>` canvas. Dark `#0d0f1e`, inner shadow. |
| `.interactive-diagram-grid-bg` | Dot-matrix grid texture. Add alongside `.interactive-diagram-svg-wrapper`. |
| `.interactive-diagram-details-card` | Hover/click detail side panel. Dark `#0c0e17`. |
| `.interactive-diagram-card-header` | Flex row with icon + title inside a details card. |
| `.interactive-diagram-helper-text` | Muted hint text ("Click a node to inspect"). |

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
| Sky blue | `#38bdf8` | HTTP requests, neutral info flows, client side |
| Emerald | `#34d399` | Success, server responses, healthy, completed |
| Amber | `#fbbf24` | Warnings, redirects, intermediate states, storage/VFS |
| Orange | `#f97316` | Client errors (4xx), caution, hardware layer |
| Red | `#f87171` | Server errors (5xx), critical, deadlock, untrusted |
| Purple | `#a78bfa` | Encryption, kernel/OS, advanced concepts |
| Violet | `#8b5cf6` | AQS internals, execution context |
| Teal | `#2dd4bf` | Streaming, data flow, IPC channels |
| Pink | `#f472b6` | Security attacks, anomalies, signal handlers |

**Alpha overlay formula** (append to hex):

| Opacity | Suffix | Example | Use for |
|---|---|---|---|
| ~10% | `18` | `#38bdf818` | Active tab/button background |
| ~31% | `50` | `#38bdf850` | Active tab/button border |
| ~6% | `0e` | `#38bdf80e` | Hover row background |
| ~25% | `40` | `#38bdf840` | Border on hover item |

---

## Archetype A — Animated Flow

**Use when:** Sequence flows, multi-step handshakes, or protocol execution steps.

**Key features:**
- Steps array with directional indicators (`left` or `right`), labels, and detail notes.
- Step playback control (`playing`, `animStep`, `useEffect` with `setTimeout`).
- Click-to-inspect step functionality.

```tsx
import React, { useState, useEffect } from 'react';

const STEPS = [
  { id: 1, direction: 'right' as const, label: 'SYN', color: '#38bdf8', note: 'Client initiates TCP handshake' },
  { id: 2, direction: 'left'  as const, label: 'SYN-ACK', color: '#34d399', note: 'Server responds with ACK + SYN' },
  { id: 3, direction: 'right' as const, label: 'ACK', color: '#38bdf8', note: 'Connection established' },
];

export default function TcpHandshakeDiagram(): React.JSX.Element {
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
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>TCP 3-Way Handshake</span>
        <button onClick={handlePlay} disabled={playing}
          style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: playing ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '12px', background: playing ? 'rgba(255,255,255,0.06)' : 'rgba(56,189,248,0.15)', color: playing ? 'var(--ifm-color-content-secondary)' : '#38bdf8', boxShadow: playing ? 'none' : '0 0 0 1.5px rgba(56,189,248,0.4)', transition: 'all 0.2s ease' }}>
          {playing ? 'Playing…' : '▶ Animate'}
        </button>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px', gap: '12px', alignItems: 'center' }}>
          <div style={{ background: 'rgba(56,189,248,0.10)', border: '1.5px solid rgba(56,189,248,0.35)', borderRadius: '12px', padding: '14px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>Client</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {STEPS.map((step, i) => {
              const isActive = activeStep !== null && i <= activeStep;
              const isRight  = step.direction === 'right';
              return (
                <div key={step.id} onClick={() => setActiveStep(activeStep === i ? null : i)}
                  style={{ display: 'flex', flexDirection: isRight ? 'row' : 'row-reverse', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: isActive ? 1 : 0.3, transition: 'opacity 0.5s ease' }}>
                  <div style={{ flex: 1, height: '2px', background: `linear-gradient(${isRight ? '90deg' : '270deg'}, ${step.color}00, ${step.color})`, position: 'relative' }}>
                    <div style={{ position: 'absolute', [isRight ? 'right' : 'left']: '-1px', top: '-4px', width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', [isRight ? 'borderLeft' : 'borderRight']: `8px solid ${step.color}` }} />
                  </div>
                  <div style={{ padding: '5px 10px', borderRadius: '7px', flexShrink: 0, background: `${step.color}18`, border: `1px solid ${step.color}40` }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '11.5px', color: step.color, fontWeight: 700 }}>{step.label}</div>
                    <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '1px' }}>{step.note}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ background: 'rgba(52,211,153,0.10)', border: '1.5px solid rgba(52,211,153,0.35)', borderRadius: '12px', padding: '14px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#34d399' }}>Server</div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Archetype B — SVG Node Graph

**Use when:** Architecture flows, system node topologies, or subsystem layered diagrams.

**Key features:**
- SVG canvas wrapped in `.interactive-diagram-svg-wrapper.interactive-diagram-grid-bg`.
- SVG nodes with hover/click selection.
- Split-pane layout using fixed percentage grid (`55% 45%` or `58% 42%`) with inline `@media (max-width: 768px)` block.
- Side details card powered by `.interactive-diagram-details-card`.

```tsx
import React, { useState } from 'react';

const NODES = [
  { id: 'client', label: 'Client', subtitle: 'Browser / App', x: 30, y: 50, w: 110, h: 60, color: '#38bdf8', detail: { title: 'Client Component', body: 'Sends HTTP requests to the backend.', tags: ['HTTP/2', 'TLS 1.3'] } },
  { id: 'lb', label: 'Load Balancer', subtitle: 'NGINX / ALB', x: 220, y: 50, w: 120, h: 60, color: '#fbbf24', detail: { title: 'Load Balancer', body: 'Terminates TLS and routes traffic.', tags: ['Round Robin', 'Health check'] } },
];

export default function ArchNodeGraphDiagram(): React.JSX.Element {
  const [selected, setSelected] = useState<string | null>(null);
  const selNode = NODES.find(n => n.id === selected) ?? null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .arch-grid { grid-template-columns: 1fr !important; } }`}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>System Architecture Topology</span>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="arch-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden' }}>
            <svg viewBox="0 0 370 160" style={{ width: '100%', height: 'auto' }}>
              <defs>
                <marker id="arr-blue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#38bdf8" />
                </marker>
              </defs>
              {/* Conduit base line + moving flowing dashed overlay with arrowhead */}
              <line x1="140" y1="80" x2="212" y2="80" stroke="rgba(56,189,248,0.25)" strokeWidth="2" />
              <line x1="140" y1="80" x2="212" y2="80" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 4" className="interactive-diagram-flowing-path" markerEnd="url(#arr-blue)" />

              {NODES.map(n => {
                const isActive = selected === n.id;
                return (
                  <g key={n.id} onClick={() => setSelected(selected === n.id ? null : n.id)} style={{ cursor: 'pointer' }}>
                    <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="8" fill={isActive ? `${n.color}25` : `${n.color}10`} stroke={n.color} strokeWidth={isActive ? 2 : 1.5} />
                    <text x={n.x + n.w / 2} y={n.y + 26} textAnchor="middle" fill={n.color} fontSize="12" fontWeight="700">{n.label}</text>
                    <text x={n.x + n.w / 2} y={n.y + 44} textAnchor="middle" fill={n.color} fontSize="9" opacity={0.7}>{n.subtitle}</text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className={`interactive-diagram-details-card ${selNode ? 'details-blue' : 'details-gray'}`} style={{ minHeight: '160px', display: 'flex', flexDirection: 'column', justifyContent: selNode ? 'flex-start' : 'center' }}>
            {selNode ? (
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: selNode.color, marginBottom: '8px' }}>{selNode.detail.title}</div>
                <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 10px', lineHeight: 1.6 }}>{selNode.detail.body}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {selNode.detail.tags.map(t => (
                    <code key={t} style={{ fontSize: '10px', background: `${selNode.color}18`, color: selNode.color, border: `1px solid ${selNode.color}30`, borderRadius: '4px', padding: '2px 6px' }}>{t}</code>
                  ))}
                </div>
              </div>
            ) : (
              <div className="interactive-diagram-helper-text" style={{ textAlign: 'center' }}>Click any node to inspect details</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Archetype C — Tabbed Explorer

**Use when:** Multiple distinct tabs comparing features, mechanisms, or modes.

```tsx
import React, { useState } from 'react';

const TABS = [
  { id: 'mode1', label: 'Mode A', color: '#38bdf8', text: 'Detailed description of Mode A.' },
  { id: 'mode2', label: 'Mode B', color: '#34d399', text: 'Detailed description of Mode B.' },
];

export default function TabbedExplorerDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState('mode1');
  const tab = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Tabbed Mode Comparison</span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '12px', background: activeTab === t.id ? `${t.color}18` : 'rgba(255,255,255,0.04)', color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)', boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}50` : '0 0 0 1px rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ background: `${tab.color}0d`, border: `1px solid ${tab.color}30`, borderRadius: '10px', padding: '14px' }}>
          <p style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: 1.6 }}>{tab.text}</p>
        </div>
      </div>
    </div>
  );
}
```

---

## Archetype D — Searchable List + Detail Panel

**Use when:** Filterable lists of tools, headers, status codes, or options.

```tsx
import React, { useState } from 'react';

const ITEMS = [
  { name: 'ping', layer: 'L3 Network', color: '#38bdf8', desc: 'Test IP reachability using ICMP Echo Requests.' },
  { name: 'curl', layer: 'L5 Application', color: '#34d399', desc: 'Transfer data over HTTP/HTTPS with full header control.' },
];

export default function SearchableListDiagram(): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>('ping');

  const filtered = ITEMS.filter(i => i.name.includes(search.toLowerCase()) || i.desc.toLowerCase().includes(search.toLowerCase()));
  const sel = ITEMS.find(i => i.name === selected) ?? null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Tools Reference</span>
        <input type="text" placeholder="Search…" value={search} onChange={e => { setSearch(e.target.value); setSelected(null); }}
          style={{ marginLeft: 'auto', padding: '6px 10px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'var(--ifm-color-content)', fontSize: '12px', outline: 'none', width: '140px' }} />
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {filtered.map(item => (
              <button key={item.name} onClick={() => setSelected(item.name === selected ? null : item.name)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '7px', border: 'none', cursor: 'pointer', textAlign: 'left', background: selected === item.name ? `${item.color}15` : 'rgba(255,255,255,0.03)', boxShadow: selected === item.name ? `0 0 0 1.5px ${item.color}50` : '0 0 0 1px rgba(255,255,255,0.06)' }}>
                <code style={{ fontSize: '11.5px', color: item.color, fontWeight: 700 }}>{item.name}</code>
                <span style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>{item.layer}</span>
              </button>
            ))}
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', padding: '14px' }}>
            {sel ? (
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: sel.color, marginBottom: '6px' }}>{sel.name}</div>
                <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: 1.6 }}>{sel.desc}</p>
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', textAlign: 'center' }}>Select an item</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Archetype E — Interactive Checklist

**Use when:** Pre-launch review or production audit checklists.

```tsx
import React, { useState } from 'react';

const ITEMS = [
  { id: 't1', text: 'TLS 1.3 enabled' },
  { id: 't2', text: 'Connection pool configured' },
];

export default function ProductionChecklistDiagram(): React.JSX.Element {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setChecked(c => ({ ...c, [id]: !c[id] }));
  const count = Object.values(checked).filter(Boolean).length;
  const pct = Math.round((count / ITEMS.length) * 100);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Production Checklist ({pct}%)</span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: '14px' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: '#34d399', transition: 'width 0.4s ease' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {ITEMS.map(item => {
            const isDone = !!checked[item.id];
            return (
              <div key={item.id} onClick={() => toggle(item.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '7px', cursor: 'pointer', background: isDone ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isDone ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.07)'}` }}>
                <span style={{ fontSize: '12px', color: isDone ? '#34d399' : 'var(--ifm-color-content-secondary)' }}>{isDone ? '✓' : '○'}</span>
                <span style={{ fontSize: '12px', color: 'var(--ifm-color-content)', textDecoration: isDone ? 'line-through' : 'none' }}>{item.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

---

## Pitfalls Checklist

Before submitting a component, verify:

- [ ] `className="interactive-diagram-container"` is on the outermost `<div>`
- [ ] Header uses `<svg>` icon, not emoji
- [ ] All hex colors are from the palette table above
- [ ] Text uses `var(--ifm-color-content)` / `var(--ifm-color-content-secondary)`
- [ ] Every ternary has a `false` branch (no dangling `x ? a :`)
- [ ] `<marker>` path uses `fill="context-fill"` or dynamically maps color-matching definition IDs to match path stroke color.
- [ ] Multi-column layouts use fixed percentage columns (`55% 45%`, `58% 42%`, `50% 50%`) with `align-items: start` and inline media query style block to stack columns to `1fr` on small screens (`@media (max-width: 768px)`).
- [ ] Node & lifeline nodes are padded. Add spacing offsets to arrow coordinates (e.g. `+6px` start, `-12px` end) so path lines and arrowhead tips float cleanly.
- [ ] Component compiles cleanly with `npx tsc --noEmit`.
