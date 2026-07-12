import React, { useState } from 'react';

type Scenario = 'literal' | 'new' | 'intern';

interface ScenarioConfig {
  title: string;
  color: string;
  code: string;
  description: string;
  bullets: string[];
  s1Pool: boolean;
  s2Pool: boolean;
  s3Heap: boolean;
  s4Pool: boolean;
  showS3: boolean;
  showS4: boolean;
  equalResult: string;
}

const SCENARIOS: Record<Scenario, ScenarioConfig> = {
  literal: {
    title: 'String Literal — Pool Dedup',
    color: '#38bdf8',
    code:
`String s1 = "Hello"; // → SCP
String s2 = "Hello"; // → same SCP ref
System.out.println(s1 == s2); // true`,
    description:
      'Both s1 and s2 point to the exact same object in the String Constant Pool. The JVM deduplicates identical literals automatically.',
    bullets: [
      'JVM checks the SCP first on every string literal assignment.',
      'If "Hello" already exists → returns existing reference. No new object created.',
      's1 == s2 is true — they share the same memory address.',
      'Immutability guarantees this sharing is always safe.',
    ],
    s1Pool: true, s2Pool: true, s3Heap: false, s4Pool: false,
    showS3: false, showS4: false,
    equalResult: 's1 == s2 → true',
  },
  new: {
    title: 'new String() — Forces Heap Allocation',
    color: '#f87171',
    code:
`String s1 = "Hello";          // → SCP
String s3 = new String("Hello"); // → Heap
System.out.println(s1 == s3); // false`,
    description:
      'Using new String() bypasses the pool and always creates a fresh object in the normal Heap, even if an identical string already exists in the SCP.',
    bullets: [
      'new String("Hello") creates TWO objects: "Hello" in SCP (if absent) and a new Heap copy.',
      's1 (SCP) and s3 (Heap) are different objects → == is false.',
      '.equals() still returns true since it compares char content.',
      'Avoid new String() unless you explicitly need a separate heap instance.',
    ],
    s1Pool: true, s2Pool: false, s3Heap: true, s4Pool: false,
    showS3: true, showS4: false,
    equalResult: 's1 == s3 → false',
  },
  intern: {
    title: 'String.intern() — Promote to Pool',
    color: '#4ade80',
    code:
`String s3 = new String("Hello"); // Heap
String s4 = s3.intern();          // → SCP
System.out.println(s1 == s4); // true`,
    description:
      'Calling .intern() checks the SCP. If an equal string exists, it returns the pool reference. s4 is now the same reference as s1.',
    bullets: [
      's3 is a heap object (from new String()).',
      '.intern() walks the SCP — finds "Hello" → returns the existing pool ref.',
      's4 now points to the SCP object, same as s1.',
      's1 == s4 is true — both resolved to the canonical pool instance.',
    ],
    s1Pool: true, s2Pool: false, s3Heap: true, s4Pool: true,
    showS3: true, showS4: true,
    equalResult: 's1 == s4 → true',
  },
};

export default function StringConstantPoolDiagram(): React.JSX.Element {
  const [scenario, setScenario] = useState<Scenario>('literal');
  const cfg = SCENARIOS[scenario];

  // Layout constants
  const heapX = 40, heapY = 30, heapW = 600, heapH = 220;
  const normalY = 50, normalH = 70;
  const scpY = 140, scpH = 80;
  const poolStrX = 280, poolStrY = 175, poolStrW = 120, poolStrH = 28;
  const heapStrX = 90, heapStrY = 75, heapStrW = 120, heapStrH = 28;

  // Reference label positions
  const s1LabelX = 100, s1LabelY = 22;
  const s2LabelX = 200, s2LabelY = 22;
  const s3LabelX = 90, s3LabelY = 52;
  const s4LabelX = 380, s4LabelY = 22;

  const poolCx = poolStrX + poolStrW / 2;
  const poolCy = poolStrY + poolStrH / 2;
  const heapCx = heapStrX + heapStrW / 2;
  const heapCy = heapStrY + heapStrH / 2;

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      {/* Header */}
      <div
        className="interactive-diagram-card-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap', gap: 8 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: 'middle', transition: 'stroke 0.2s' }}><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" /></svg><span style={{ color: cfg.color }}>String Immutability</span> &amp; The String Constant Pool
          </h3>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['literal', 'new', 'intern'] as Scenario[]).map(s => (
            <button
              key={s}
              onClick={() => setScenario(s)}
              style={{
                background: scenario === s ? `${SCENARIOS[s].color}20` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${scenario === s ? SCENARIOS[s].color : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 4, color: scenario === s ? SCENARIOS[s].color : '#94a3b8',
                cursor: 'pointer', padding: '4px 10px', fontSize: '0.8rem', fontWeight: 600,
                transition: 'all 0.15s',
              }}
            >
              {s === 'literal' ? 'Literal' : s === 'new' ? 'new String()' : '.intern()'}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 270" className="interactive-diagram-svg">
          <defs>
            <marker id="scp-arrow-blue" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 2 L 8 5 L 0 8 z" fill="#38bdf8" />
            </marker>
            <marker id="scp-arrow-red" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 2 L 8 5 L 0 8 z" fill="#f87171" />
            </marker>
            <marker id="scp-arrow-green" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 2 L 8 5 L 0 8 z" fill="#4ade80" />
            </marker>
          </defs>

          {/* ── Outer Heap region ── */}
          <rect x={heapX} y={heapY} width={heapW} height={heapH} rx={8}
            fill="rgba(15,23,42,0.5)" stroke="rgba(255,255,255,0.07)" strokeWidth={1.5} />
          <text x={heapX + 10} y={heapY + 14} style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, fill: 'rgba(255,255,255,0.25)', letterSpacing: 1 }}>
            JVM HEAP MEMORY
          </text>

          {/* ── Normal Heap zone ── */}
          <rect x={heapX + 20} y={heapY + normalY} width={heapW - 40} height={normalH} rx={5}
            fill="rgba(248,113,113,0.04)" stroke="rgba(248,113,113,0.15)" strokeDasharray="4,3" />
          <text x={heapX + 30} y={heapY + normalY + 14} style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 8, fill: 'rgba(248,113,113,0.5)' }}>
            Normal Heap (General Object Allocation)
          </text>

          {/* Normal Heap string box (s3) */}
          {cfg.showS3 && (
            <g>
              <rect x={heapStrX} y={heapY + heapStrY} width={heapStrW} height={heapStrH} rx={4}
                fill="rgba(248,113,113,0.12)" stroke="#f87171" strokeWidth={1.5} />
              <text x={heapStrX + heapStrW / 2} y={heapY + heapStrY + 12} style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, fill: '#f87171', textAnchor: 'middle' }}>
                s3 → "Hello"
              </text>
              <text x={heapStrX + heapStrW / 2} y={heapY + heapStrY + 23} style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 7.5, fill: '#f8717180', textAnchor: 'middle' }}>
                (Heap object)
              </text>
            </g>
          )}

          {/* ── String Constant Pool zone ── */}
          <rect x={heapX + 20} y={heapY + scpY} width={heapW - 40} height={scpH} rx={5}
            fill="rgba(56,189,248,0.04)" stroke="rgba(56,189,248,0.2)" />
          <text x={heapX + 30} y={heapY + scpY + 14} style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: 'rgba(56,189,248,0.5)' }}>
            String Constant Pool (SCP) — inside Heap since Java 7
          </text>

          {/* SCP "Hello" box */}
          <rect x={poolStrX} y={heapY + poolStrY} width={poolStrW} height={poolStrH} rx={4}
            fill="rgba(56,189,248,0.12)" stroke="#38bdf8" strokeWidth={1.5} />
          <text x={poolCx} y={heapY + poolStrY + 12} style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#38bdf8', textAnchor: 'middle' }}>
            "Hello"
          </text>
          <text x={poolCx} y={heapY + poolStrY + 23} style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 7.5, fill: '#38bdf880', textAnchor: 'middle' }}>
            (canonical pool instance)
          </text>

          {/* ── Variable labels (above heap) ── */}
          {/* s1 */}
          {cfg.s1Pool && (
            <g>
              <rect x={s1LabelX - 16} y={s1LabelY - 12} width={42} height={18} rx={3}
                fill="rgba(56,189,248,0.15)" stroke="#38bdf8" strokeWidth={1} />
              <text x={s1LabelX + 5} y={s1LabelY} style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, fill: '#38bdf8', textAnchor: 'middle' }}>s1</text>
              {/* s1 → pool arrow */}
              <path
                id="path-s1-pool"
                d={`M ${s1LabelX + 5} ${s1LabelY + 6} C ${s1LabelX + 5} ${heapY + poolStrY - 20}, ${poolCx - 40} ${heapY + poolStrY - 20}, ${poolCx - 40} ${heapY + poolStrY}`}
                fill="none" stroke="#38bdf8" strokeWidth={1.5} markerEnd="url(#scp-arrow-blue)"
                className="interactive-diagram-flowing-path"
              />
              <circle r="2.5" fill="#38bdf8" opacity="0.85">
                <animateMotion dur="1s" repeatCount="indefinite"><mpath href="#path-s1-pool" /></animateMotion>
              </circle>
            </g>
          )}

          {/* s2 */}
          {cfg.s2Pool && (
            <g>
              <rect x={s2LabelX - 16} y={s1LabelY - 12} width={42} height={18} rx={3}
                fill="rgba(56,189,248,0.15)" stroke="#38bdf8" strokeWidth={1} />
              <text x={s2LabelX + 5} y={s1LabelY} style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, fill: '#38bdf8', textAnchor: 'middle' }}>s2</text>
              <path
                id="path-s2-pool"
                d={`M ${s2LabelX + 5} ${s1LabelY + 6} C ${s2LabelX + 5} ${heapY + poolStrY - 20}, ${poolCx} ${heapY + poolStrY - 20}, ${poolCx} ${heapY + poolStrY}`}
                fill="none" stroke="#38bdf8" strokeWidth={1.5} markerEnd="url(#scp-arrow-blue)"
                className="interactive-diagram-flowing-path"
              />
              <circle r="2.5" fill="#38bdf8" opacity="0.85">
                <animateMotion dur="1s" repeatCount="indefinite" begin="0.5s"><mpath href="#path-s2-pool" /></animateMotion>
              </circle>
            </g>
          )}

          {/* s3 → Heap */}
          {cfg.showS3 && (
            <g>
              <rect x={s3LabelX - 16} y={heapY + s3LabelY - 12} width={42} height={18} rx={3}
                fill="rgba(248,113,113,0.15)" stroke="#f87171" strokeWidth={1} />
              <text x={s3LabelX + 5} y={heapY + s3LabelY} style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, fill: '#f87171', textAnchor: 'middle' }}>s3</text>
              <path
                id="path-s3-heap"
                d={`M ${s3LabelX + 22} ${heapY + s3LabelY - 3} L ${heapStrX} ${heapY + heapStrY + heapStrH / 2}`}
                fill="none" stroke="#f87171" strokeWidth={1.5} markerEnd="url(#scp-arrow-red)"
                className="interactive-diagram-flowing-path"
              />
              <circle r="2.5" fill="#f87171" opacity="0.85">
                <animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-s3-heap" /></animateMotion>
              </circle>
            </g>
          )}

          {/* s4 → pool (intern) */}
          {cfg.showS4 && (
            <g>
              <rect x={s4LabelX - 16} y={s1LabelY - 12} width={42} height={18} rx={3}
                fill="rgba(74,222,128,0.15)" stroke="#4ade80" strokeWidth={1} />
              <text x={s4LabelX + 5} y={s1LabelY} style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, fill: '#4ade80', textAnchor: 'middle' }}>s4</text>
              <path
                id="path-s4-pool"
                d={`M ${s4LabelX + 5} ${s1LabelY + 6} C ${s4LabelX + 5} ${heapY + poolStrY - 20}, ${poolCx + 40} ${heapY + poolStrY - 20}, ${poolCx + 40} ${heapY + poolStrY}`}
                fill="none" stroke="#4ade80" strokeWidth={1.5} markerEnd="url(#scp-arrow-green)"
                className="interactive-diagram-flowing-path"
              />
              <circle r="2.5" fill="#4ade80" opacity="0.85">
                <animateMotion dur="1s" repeatCount="indefinite" begin="0.3s"><mpath href="#path-s4-pool" /></animateMotion>
              </circle>
              {/* intern() label on arrow */}
              <text x={s4LabelX + 45} y={heapY + poolStrY - 35} style={{ fontFamily: 'Inter', fontSize: 7.5, fill: '#4ade80', fontStyle: 'italic' }}>.intern()</text>
            </g>
          )}

          {/* ── Result badge ── */}
          <rect x={440} y={heapY + normalY + 5} width={175} height={22} rx={4}
            fill={`${cfg.color}15`} stroke={cfg.color} strokeWidth={1.2} />
          <text x={527} y={heapY + normalY + 19} style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, fill: cfg.color, textAnchor: 'middle' }}>
            {cfg.equalResult}
          </text>

          {/* ── Immutability rules ── */}
          <rect x={heapX} y={260} width={heapW} height={16} rx={3} fill="rgba(167,139,250,0.06)" />
          <text x={heapX + heapW / 2} y={272} style={{ fontFamily: 'Inter', fontSize: 7.5, fill: '#64748b', textAnchor: 'middle' }}>
            String is immutable → hashCode cached on creation · thread-safe by design · safe for pool sharing
          </text>
        </svg>
      </div>

      {/* Code block */}
      <div style={{ margin: '0', padding: '0.7rem 1rem', background: 'rgba(0,0,0,0.35)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <pre style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.6, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          <code style={{ color: cfg.color }}>{cfg.code}</code>
        </pre>
      </div>

      {/* Detail card */}
      <div className="interactive-diagram-details-card" style={{ borderColor: `${cfg.color}40`, background: `${cfg.color}08` }}>
        <div className="interactive-diagram-card-header">
          
          <h3 style={{ color: cfg.color }}>{cfg.title}</h3>
        </div>
        <p>{cfg.description}</p>
        <ul>
          {cfg.bullets.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
      </div>

      <p className="interactive-diagram-helper-text">
        💡 Toggle between <strong>Literal</strong>, <strong>new String()</strong>, and <strong>.intern()</strong> to visualize how each creates or reuses String objects in memory.
      </p>
    </div>
  );
}
