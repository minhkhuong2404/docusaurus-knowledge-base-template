import React, { useState, useEffect } from 'react';

type Mode = 'copy' | 'compact';

type Step = {
  id: number;
  title: string;
  shortLabel: string;
  color: string;
  lead: string;
  underTheHood: string[];
  notes: string[];
};

const COPY_STEPS: Step[] = [
  {
    id: 0,
    title: '1. Before Minor GC',
    shortLabel: 'Before',
    color: '#38bdf8',
    lead: 'Eden is full of live (green) and dead (gray) objects. From may hold survivors from the last cycle. To is empty — required spare space for Mark-Copy.',
    underTheHood: [
      'Young layout: Eden + From + To (S0/S1 with flipped roles).',
      'Dead objects are never visited one-by-one later — only live ones are copied.',
      'STW begins: mutator threads pause for the young collection.',
    ],
    notes: [
      'Cost will scale with live bytes in Eden+From, not with how many dead objects exist.',
    ],
  },
  {
    id: 1,
    title: '2. Mark from GC Roots',
    shortLabel: 'Mark',
    color: '#fbbf24',
    lead: 'Trace from GC Roots (stacks, statics, …). Reachable objects in Eden/From are marked live. Unreachable stay dead — they will not be copied.',
    underTheHood: [
      'Roots → object graph walk; circular garbage with no root path stays unmarked.',
      'Only the live set matters for the next copy phase.',
      'Card tables / RSets help find Old→Young pointers into the young set.',
    ],
    notes: [
      'Mark here is conceptual; HotSpot young GC is an evacuating collector, not a separate full mark-sweep pass.',
    ],
  },
  {
    id: 2,
    title: '3. Copy live → To',
    shortLabel: 'Copy',
    color: '#34d399',
    lead: 'Each live object is copied into the empty To space (bump allocation). References are updated to the new addresses. Dead objects are left behind.',
    underTheHood: [
      'Evacuation = Mark-Copy: survivors land compacted in To.',
      'CPU ∝ live data size; wiping Eden/From is O(1) region reset afterward.',
      'If To cannot hold everyone → promotion to Old or evacuation failure.',
    ],
    notes: [
      'This is why Young loves copying: most objects are dead, so little is copied.',
    ],
  },
  {
    id: 3,
    title: '4. Wipe Eden + From; flip',
    shortLabel: 'Flip',
    color: '#2dd4bf',
    lead: 'Eden and From are discarded as empty. To becomes the new From for the next cycle; the other survivor is the new empty To. Ages of survivors increment.',
    underTheHood: [
      'S0/S1 labels swap From/To roles — twins, not a fixed pipeline order.',
      'Age in the object header drives later promotion (MaxTenuringThreshold).',
      'Mutators resume; Eden allocates again via TLABs.',
    ],
    notes: [
      'Interview: always one empty survivor after a successful young GC.',
    ],
  },
];

const COMPACT_STEPS: Step[] = [
  {
    id: 0,
    title: '1. Fragmented Old',
    shortLabel: 'Before',
    color: '#a78bfa',
    lead: 'Old gen has live objects scattered between dead holes. Free space exists in total but not as one contiguous bump region — Mark-Sweep left fragmentation.',
    underTheHood: [
      'Typical after sweep-without-compact (historical CMS pain).',
      'Large array allocation can fail despite free bytes summing enough.',
      'STW or concurrent relocate will fix layout depending on collector.',
    ],
    notes: [
      'Parallel Old / Full GC often Mark-Compact; G1 evacuates regions instead of whole-heap slide.',
    ],
  },
  {
    id: 1,
    title: '2. Mark live',
    shortLabel: 'Mark',
    color: '#fbbf24',
    lead: 'Trace from GC Roots; mark live objects. Dead holes are candidates to reclaim or collapse.',
    underTheHood: [
      'Same reachability idea as young mark — live set is the source of truth.',
      'Concurrent collectors do most marking while mutators run; compact still needs care with pointers.',
    ],
    notes: [
      'Mark alone does not fix fragmentation — that is the compact/relocate step.',
    ],
  },
  {
    id: 2,
    title: '3. Slide / compact',
    shortLabel: 'Slide',
    color: '#34d399',
    lead: 'Live objects are relocated toward one end of the space. Gaps close. A single contiguous free region appears at the other end for bump allocation.',
    underTheHood: [
      'Every moved object needs reference updates (pointers rewrite).',
      'More work than young copy when the live set is large — why Old collections are rarer/heavier.',
      'ZGC/Shenandoah relocate concurrently with load barriers instead of a long stop-the-world slide.',
    ],
    notes: [
      'Trade CPU/pause to restore contiguous free memory.',
    ],
  },
  {
    id: 3,
    title: '4. Contiguous free tail',
    shortLabel: 'Done',
    color: '#2dd4bf',
    lead: 'Survivors are packed; free memory is one block. Allocators can bump-pointer again until the next fragmentation cycle.',
    underTheHood: [
      'Predictable allocation success for large objects (vs fragmented free lists).',
      'Full GC Mark-Compact is the “stop the world and clean the warehouse” last resort on many collectors.',
    ],
    notes: [
      'Prefer tuning to avoid Full GC; compaction is the expensive correctness hammer.',
    ],
  },
];

function Section({
  label,
  color,
  items,
}: {
  label: string;
  color: string;
  items: string[];
}): React.JSX.Element {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div
        style={{
          fontSize: '10px',
          fontWeight: 800,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color,
          marginBottom: '5px',
        }}
      >
        {label}
      </div>
      <ul
        style={{
          margin: 0,
          paddingLeft: '16px',
          fontSize: '12px',
          color: 'var(--ifm-color-content-secondary)',
          lineHeight: 1.55,
        }}
      >
        {items.map((item) => (
          <li key={item} style={{ marginBottom: '3px' }}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Live = green pill, dead = gray */
function Obj({
  x,
  y,
  live,
  label,
  highlight,
}: {
  x: number;
  y: number;
  live: boolean;
  label: string;
  highlight?: boolean;
}): React.JSX.Element {
  const fill = live ? (highlight ? '#34d399' : 'rgba(52,211,153,0.85)') : 'rgba(148,163,184,0.45)';
  const stroke = live ? '#34d399' : 'rgba(148,163,184,0.7)';
  return (
    <g>
      <rect x={x} y={y} width="36" height="22" rx="4" fill={fill} stroke={stroke} strokeWidth={highlight ? 2 : 1} />
      <text x={x + 18} y={y + 15} textAnchor="middle" fill={live ? '#0f172a' : '#cbd5e1'} fontSize="9" fontWeight="700">
        {label}
      </text>
    </g>
  );
}

export default function GcMarkCopySimulationDiagram(): React.JSX.Element {
  const [mode, setMode] = useState<Mode>('copy');
  const [activeStep, setActiveStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [animStep, setAnimStep] = useState(0);

  const steps = mode === 'copy' ? COPY_STEPS : COMPACT_STEPS;
  const selected = steps[activeStep];

  useEffect(() => {
    if (!playing || animStep >= steps.length) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => {
      setActiveStep(animStep);
      setAnimStep((s) => s + 1);
    }, 1000);
    return () => clearTimeout(t);
  }, [playing, animStep, steps.length]);

  const handlePlay = () => {
    setActiveStep(0);
    setAnimStep(0);
    setPlaying(true);
  };

  const switchMode = (m: Mode) => {
    setPlaying(false);
    setMode(m);
    setActiveStep(0);
    setAnimStep(0);
  };

  const accent = mode === 'copy' ? '#34d399' : '#a78bfa';

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .gc-algo-sim-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Algorithm Simulation</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            onClick={() => switchMode('copy')}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '11px',
              background: mode === 'copy' ? 'rgba(52,211,153,0.18)' : 'rgba(255,255,255,0.04)',
              color: mode === 'copy' ? '#34d399' : 'var(--ifm-color-content-secondary)',
              boxShadow: mode === 'copy' ? '0 0 0 1.5px rgba(52,211,153,0.45)' : 'none',
            }}
          >
            Mark-Copy
          </button>
          <button
            onClick={() => switchMode('compact')}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '11px',
              background: mode === 'compact' ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.04)',
              color: mode === 'compact' ? '#a78bfa' : 'var(--ifm-color-content-secondary)',
              boxShadow: mode === 'compact' ? '0 0 0 1.5px rgba(167,139,250,0.45)' : 'none',
            }}
          >
            Mark-Compact
          </button>
          <button
            onClick={handlePlay}
            disabled={playing}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              cursor: playing ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '12px',
              background: playing ? 'rgba(255,255,255,0.06)' : `${accent}22`,
              color: playing ? 'var(--ifm-color-content-secondary)' : accent,
              boxShadow: playing ? 'none' : `0 0 0 1.5px ${accent}66`,
            }}
          >
            {playing ? 'Playing…' : '▶ Animate'}
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="gc-algo-sim-grid" style={{ display: 'grid', gridTemplateColumns: '58% 42%', gap: '16px', alignItems: 'start' }}>
          <div>
            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
              {mode === 'copy' ? (
                <svg viewBox="0 0 720 280" style={{ width: '100%', height: 'auto' }}>
                  <defs>
                    <marker id="gc-sim-arr-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34d399" />
                    </marker>
                    <marker id="gc-sim-arr-amber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fbbf24" />
                    </marker>
                  </defs>

                  {/* Eden */}
                  <rect x="20" y="40" width="220" height="160" rx="10" fill="rgba(52,211,153,0.08)" stroke="#34d399" strokeWidth="1.5" />
                  <text x="130" y="62" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="800">
                    Eden
                  </text>
                  <Obj x={40} y={90} live label="A" highlight={activeStep >= 1} />
                  <Obj x={90} y={90} live={false} label="×" />
                  <Obj x={140} y={90} live label="B" highlight={activeStep >= 1} />
                  <Obj x={40} y={130} live={false} label="×" />
                  <Obj x={90} y={130} live label="C" highlight={activeStep >= 1} />
                  <Obj x={140} y={130} live={false} label="×" />

                  {/* From */}
                  <rect
                    x="260"
                    y="40"
                    width="140"
                    height="160"
                    rx="10"
                    fill={activeStep >= 3 ? 'rgba(255,255,255,0.03)' : 'rgba(45,212,191,0.08)'}
                    stroke="#2dd4bf"
                    strokeWidth="1.5"
                  />
                  <text x="330" y="62" textAnchor="middle" fill="#2dd4bf" fontSize="12" fontWeight="800">
                    From {activeStep >= 3 ? '(empty)' : ''}
                  </text>
                  {activeStep < 3 && (
                    <>
                      <Obj x={280} y={100} live label="D" highlight={activeStep >= 1} />
                      <Obj x={330} y={100} live={false} label="×" />
                      <Obj x={280} y={140} live label="E" highlight={activeStep >= 1} />
                    </>
                  )}

                  {/* To */}
                  <rect
                    x="420"
                    y="40"
                    width="160"
                    height="160"
                    rx="10"
                    fill="rgba(56,189,248,0.08)"
                    stroke="#38bdf8"
                    strokeWidth={activeStep >= 2 ? 2.2 : 1.5}
                  />
                  <text x="500" y="62" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="800">
                    To {activeStep >= 3 ? '→ new From' : '(empty→live)'}
                  </text>
                  {activeStep >= 2 && (
                    <>
                      <Obj x={440} y={90} live label="A" highlight />
                      <Obj x={490} y={90} live label="B" highlight />
                      <Obj x={540} y={90} live label="C" highlight />
                      <Obj x={440} y={130} live label="D" highlight />
                      <Obj x={490} y={130} live label="E" highlight />
                    </>
                  )}

                  {/* Roots */}
                  <rect x="600" y="80" width="100" height="80" rx="8" fill="rgba(251,191,36,0.1)" stroke="#fbbf24" strokeWidth="1.5" />
                  <text x="650" y="115" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="800">
                    GC Roots
                  </text>
                  <text x="650" y="135" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">
                    stacks / statics
                  </text>

                  {activeStep === 1 && (
                    <>
                      <path
                        id="gc-sim-mark"
                        d="M 600 120 L 400 120"
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="2.2"
                        markerEnd="url(#gc-sim-arr-amber)"
                        className="interactive-diagram-flowing-path"
                      />
                      <circle r="3.5" fill="#fbbf24" className="interactive-diagram-flowing-dot">
                        <animateMotion dur="1s" repeatCount="indefinite">
                          <mpath href="#gc-sim-mark" />
                        </animateMotion>
                      </circle>
                    </>
                  )}
                  {activeStep === 2 && (
                    <>
                      <path
                        id="gc-sim-copy1"
                        d="M 180 100 L 430 100"
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="2.5"
                        markerEnd="url(#gc-sim-arr-green)"
                        className="interactive-diagram-flowing-path"
                      />
                      <path
                        id="gc-sim-copy2"
                        d="M 320 120 L 430 130"
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="2.5"
                        markerEnd="url(#gc-sim-arr-green)"
                        className="interactive-diagram-flowing-path"
                      />
                      <circle r="3.5" fill="#34d399" className="interactive-diagram-flowing-dot">
                        <animateMotion dur="0.9s" repeatCount="indefinite">
                          <mpath href="#gc-sim-copy1" />
                        </animateMotion>
                      </circle>
                      <circle r="3.5" fill="#34d399" className="interactive-diagram-flowing-dot">
                        <animateMotion dur="1.1s" repeatCount="indefinite">
                          <mpath href="#gc-sim-copy2" />
                        </animateMotion>
                      </circle>
                    </>
                  )}

                  <text x="20" y="230" fill="var(--ifm-color-content-secondary)" fontSize="11">
                    Green = live · Gray = dead (not copied) · Cost ∝ live set, not dead count
                  </text>
                  <text x="20" y="252" fill="#34d399" fontSize="11" fontWeight="700">
                    Young Minor GC = Mark-Copy into empty To, then flip S0/S1
                  </text>
                </svg>
              ) : (
                <svg viewBox="0 0 720 280" style={{ width: '100%', height: 'auto' }}>
                  <defs>
                    <marker id="gc-sim-arr-purple" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a78bfa" />
                    </marker>
                    <marker id="gc-sim-arr-amber2" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fbbf24" />
                    </marker>
                  </defs>

                  <rect x="40" y="50" width="640" height="140" rx="12" fill="rgba(167,139,250,0.06)" stroke="#a78bfa" strokeWidth="1.5" />
                  <text x="60" y="78" fill="#a78bfa" fontSize="12" fontWeight="800">
                    Old generation region
                  </text>

                  {activeStep < 2 && (
                    <>
                      <Obj x={70} y={110} live label="L1" highlight={activeStep >= 1} />
                      <Obj x={130} y={110} live={false} label="×" />
                      <Obj x={190} y={110} live label="L2" highlight={activeStep >= 1} />
                      <Obj x={250} y={110} live={false} label="×" />
                      <Obj x={310} y={110} live={false} label="×" />
                      <Obj x={370} y={110} live label="L3" highlight={activeStep >= 1} />
                      <Obj x={430} y={110} live={false} label="×" />
                      <Obj x={490} y={110} live label="L4" highlight={activeStep >= 1} />
                      <Obj x={550} y={110} live={false} label="×" />
                    </>
                  )}
                  {activeStep >= 2 && (
                    <>
                      <Obj x={70} y={110} live label="L1" highlight />
                      <Obj x={120} y={110} live label="L2" highlight />
                      <Obj x={170} y={110} live label="L3" highlight />
                      <Obj x={220} y={110} live label="L4" highlight />
                      <rect
                        x={280}
                        y={100}
                        width={360}
                        height={42}
                        rx="6"
                        fill="rgba(45,212,191,0.12)"
                        stroke="#2dd4bf"
                        strokeWidth="1.5"
                        strokeDasharray={activeStep === 2 ? '4 3' : undefined}
                      />
                      <text x={460} y={126} textAnchor="middle" fill="#2dd4bf" fontSize="12" fontWeight="800">
                        Contiguous free space
                      </text>
                    </>
                  )}

                  {activeStep === 1 && (
                    <>
                      <path
                        id="gc-cmp-mark"
                        d="M 60 40 L 200 100"
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="2"
                        markerEnd="url(#gc-sim-arr-amber2)"
                        className="interactive-diagram-flowing-path"
                      />
                      <circle r="3.5" fill="#fbbf24" className="interactive-diagram-flowing-dot">
                        <animateMotion dur="0.9s" repeatCount="indefinite">
                          <mpath href="#gc-cmp-mark" />
                        </animateMotion>
                      </circle>
                      <text x="60" y="36" fill="#fbbf24" fontSize="10" fontWeight="700">
                        Roots → mark live
                      </text>
                    </>
                  )}
                  {activeStep === 2 && (
                    <>
                      <path
                        id="gc-cmp-slide"
                        d="M 500 130 L 240 130"
                        fill="none"
                        stroke="#a78bfa"
                        strokeWidth="2.5"
                        markerEnd="url(#gc-sim-arr-purple)"
                        className="interactive-diagram-flowing-path"
                      />
                      <circle r="3.5" fill="#a78bfa" className="interactive-diagram-flowing-dot">
                        <animateMotion dur="1s" repeatCount="indefinite">
                          <mpath href="#gc-cmp-slide" />
                        </animateMotion>
                      </circle>
                    </>
                  )}

                  <text x="40" y="230" fill="var(--ifm-color-content-secondary)" fontSize="11">
                    Slide live objects together · rewrite pointers · one free tail for bump allocation
                  </text>
                  <text x="40" y="252" fill="#a78bfa" fontSize="11" fontWeight="700">
                    Mark-Compact trades pause/CPU for contiguous free memory in Old
                  </text>
                </svg>
              )}
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
              {steps.map((step) => {
                const on = activeStep === step.id;
                return (
                  <button
                    key={step.id}
                    onClick={() => {
                      setPlaying(false);
                      setActiveStep(step.id);
                    }}
                    style={{
                      flex: '1 1 20%',
                      minWidth: '70px',
                      padding: '7px 6px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '10px',
                      background: on ? `${step.color}18` : 'rgba(255,255,255,0.03)',
                      color: on ? step.color : 'var(--ifm-color-content-secondary)',
                      boxShadow: on ? `0 0 0 1.5px ${step.color}50` : '0 0 0 1px rgba(255,255,255,0.06)',
                    }}
                  >
                    {step.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="interactive-diagram-details-card" style={{ borderColor: selected.color, minHeight: '280px' }}>
              <div
                className="interactive-diagram-card-header"
                style={{ marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}
              >
                <span className="interactive-diagram-indicator-dot" style={{ background: selected.color }} />
                <span style={{ fontSize: '14px', fontWeight: 800, color: selected.color }}>{selected.title}</span>
              </div>
              <p style={{ margin: '0 0 12px 0', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.55 }}>
                {selected.lead}
              </p>
              <Section label="Under the hood" color={selected.color} items={selected.underTheHood} />
              <Section label="Notes" color="#fbbf24" items={selected.notes} />
            </div>
            <p className="interactive-diagram-helper-text" style={{ marginTop: '10px' }}>
              {mode === 'copy'
                ? 'Mark-Copy: evacuate live objects into empty To, abandon dead space, flip survivors.'
                : 'Mark-Compact: mark live, slide together, leave one free region — typical Old/Full path.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
