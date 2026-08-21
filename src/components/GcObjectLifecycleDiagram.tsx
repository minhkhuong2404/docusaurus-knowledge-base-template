import React, { useState, useEffect } from 'react';

type Step = {
  id: number;
  title: string;
  shortLabel: string;
  color: string;
  lead: string;
  underTheHood: string[];
  failureModes: string[];
  notes: string[];
  flags?: string[];
};

const STEPS: Step[] = [
  {
    id: 0,
    title: '1. Born in Eden',
    shortLabel: 'Eden',
    color: '#34d399',
    lead: 'Almost every `new` allocates in Eden (usually via a thread-local TLAB bump pointer). Locals and method parameters live on the stack; only heap objects enter this generational lifecycle.',
    underTheHood: [
      'TLAB (Thread Local Allocation Buffer): each thread bumps a private pointer — almost no synchronization for small objects.',
      'Object header stores mark word (incl. GC age bits) + class pointer (compressed oops when enabled).',
      'Stack frames die when the method returns; heap objects survive until unreachable from GC Roots.',
    ],
    failureModes: [
      'Allocation failure in Eden triggers Minor GC; if still no space after GC → promotion failure / Full GC path depending on collector.',
      'Humongous / large objects may skip Eden (G1: humongous regions) and land in Old-like regions immediately.',
    ],
    notes: [
      'A local variable holding a reference is not “in Eden” — the reference is on the stack; the object is on the heap.',
      'Most objects die in Eden (weak generational hypothesis) — never see S0/S1.',
    ],
  },
  {
    id: 1,
    title: '2. Minor GC → Survivor (To)',
    shortLabel: 'Minor→S',
    color: '#38bdf8',
    lead: 'When Eden fills, a Minor GC (young collection) runs. Live objects in Eden are evacuated (copied) into the empty Survivor space (“To”). Dead Eden objects are abandoned — the whole Eden is wiped.',
    underTheHood: [
      'Young collection uses Mark-Copy: survivors are compacted into To; From/Eden are considered empty afterward.',
      'One Survivor is always empty before a young GC (the To space); the other may hold survivors from the previous cycle (From).',
      'Minor GC is typically STW but short because Young is small relative to Old.',
    ],
    failureModes: [
      'Promotion failure: To + Old cannot absorb survivors → escalation toward Full GC.',
      'Excessive Minor GC rate: Eden too small or allocation rate too high (GC logs: short intervals).',
    ],
    notes: [
      'S0 and S1 are twins — only labels; roles flip every young GC.',
      'Copying costs CPU proportional to live data, not to dead data — why young gen loves Mark-Copy.',
    ],
    flags: ['-Xmn / -XX:NewRatio', '-XX:SurvivorRatio=8'],
  },
  {
    id: 2,
    title: '3. S0 ↔ S1 Flip (Age++)',
    shortLabel: 'S0↔S1',
    color: '#2dd4bf',
    lead: 'On the next Minor GC, survivors in From plus live Eden objects are copied into the other Survivor (new To). Spaces swap roles. Each successful survival increments the object’s age in the mark word.',
    underTheHood: [
      'From space is evacuated; after GC it becomes the empty To for the following cycle.',
      'Age is stored in object header; adaptive tenuring may promote earlier if Survivor occupancy is high.',
      'Objects that die between flips never leave Young — cheapest reclaim path.',
    ],
    failureModes: [
      'Survivor overflow: too much live young data → premature promotion into Old (pollutes tenured space).',
      'TargetSurvivorRatio missed → dynamic tenuring threshold drops; Old fills faster.',
    ],
    notes: [
      'Visual rule: always one empty Survivor after a successful young GC.',
      'Interview: explain From/To swap — not “S0 is always first”.',
    ],
    flags: ['-XX:TargetSurvivorRatio', '-XX:MaxTenuringThreshold=15'],
  },
  {
    id: 3,
    title: '4. Promote to Old Gen',
    shortLabel: 'Promote',
    color: '#a78bfa',
    lead: 'When age ≥ MaxTenuringThreshold (default 15) — or Survivor is too full — the object is copied into the Old (tenured) generation. Long-lived caches, singletons, and session graphs usually end here.',
    underTheHood: [
      'Promotion is still a copy (or region evacuation under G1); references from Young/Old must be updated.',
      'Card table / remembered sets track Old→Young pointers so Minor GC need not scan all of Old.',
      'Premature promotion turns short-lived garbage into Old-gen pressure — worse pause profiles.',
    ],
    failureModes: [
      'Old gen fills → concurrent mark / Major / Full GC depending on collector.',
      'Promotion storm after deploy warmup or traffic spike → latency cliff.',
    ],
    notes: [
      'MaxTenuringThreshold=0 forces immediate promotion — useful only for experiments.',
      'Leads watch “promotion rate” in GC logs as carefully as allocation rate.',
    ],
    flags: ['-XX:MaxTenuringThreshold=15', '-XX:InitialTenuringThreshold'],
  },
  {
    id: 4,
    title: '5. Live in Old Gen',
    shortLabel: 'Old live',
    color: '#8b5cf6',
    lead: 'Old holds long-lived reachable objects. Collection is rarer and more expensive (Mark-Compact, CMS concurrent phases, G1 mixed, or ZGC concurrent relocate). Reachability from GC Roots still decides life.',
    underTheHood: [
      'GC Roots: thread stacks, statics, JNI refs, etc. Unreachable subgraphs are garbage even if they reference each other.',
      'Fragmentation risk under pure Mark-Sweep (historical CMS pain) — compaction or concurrent relocate addresses it.',
      'G1 collects high-garbage Old regions in mixed cycles alongside Young.',
    ],
    failureModes: [
      'Memory leak: objects still reachable from a static Map / ThreadLocal / listener — GC will not save you.',
      'Full GC fallback when concurrent cycles cannot keep up with allocation.',
    ],
    notes: [
      '“Die” means unreachable — not “unused by business logic.”',
      'Heap dump + MAT/VisualVM for leaks; GC alone cannot detect logical abandonment.',
    ],
  },
  {
    id: 5,
    title: '6. Unreachable → Collected',
    shortLabel: 'Collected',
    color: '#f87171',
    lead: 'Once no path from any GC Root reaches the object, a future Old/mixed/Full (or concurrent) cycle reclaims its storage. Finalize is deprecated/irrelevant for modern design — Cleaner / try-with-resources for native resources.',
    underTheHood: [
      'Mark phase identifies live set; sweep/compact/relocate reclaims or moves survivors.',
      'STW windows differ by collector: Parallel (long STW), G1 (bounded), ZGC (sub-ms).',
      'Metaspace class metadata is not the Java Heap — different OOM story.',
    ],
    failureModes: [
      'OutOfMemoryError: Java heap space — live set + fragmentation exceeded -Xmx.',
      'Allocation stall (ZGC) if concurrent cycle lags allocation rate.',
    ],
    notes: [
      'Collecting dead objects is the happy path; the hard problems are live-set growth and pause goals.',
      'See STW evolution diagram for how collectors shrank freeze time.',
    ],
    flags: ['-Xmx', '-XX:+UseG1GC', '-XX:+UseZGC'],
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
    <div style={{ marginBottom: '12px' }}>
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
          <li key={item} style={{ marginBottom: '4px' }}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function regionFill(active: boolean, color: string, dim: boolean): string {
  if (dim) return 'rgba(255,255,255,0.03)';
  if (active) return `${color}28`;
  return `${color}12`;
}

export default function GcObjectLifecycleDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [animStep, setAnimStep] = useState(0);

  useEffect(() => {
    if (!playing || animStep >= STEPS.length) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => {
      setActiveStep(animStep);
      setAnimStep((s) => s + 1);
    }, 950);
    return () => clearTimeout(t);
  }, [playing, animStep]);

  const handlePlay = () => {
    setActiveStep(null);
    setAnimStep(0);
    setPlaying(true);
  };

  const selectStep = (id: number) => {
    setPlaying(false);
    setActiveStep(activeStep === id ? null : id);
  };

  const selected = activeStep !== null ? STEPS[activeStep] : null;
  const s = activeStep;

  // Visual role of survivors: after step 1, prefer S0; after step 2 flip highlight to S1
  const toIsS1 = s !== null && s >= 2;
  const edenHot = s === 0;
  const youngGc = s === 1 || s === 2;
  const oldHot = s !== null && s >= 3;
  const deadHot = s === 5;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .gc-lifecycle-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Object Lifecycle: Eden → S0/S1 → Old → Collected
        </span>
        <button
          onClick={handlePlay}
          disabled={playing}
          style={{
            marginLeft: 'auto',
            padding: '6px 14px',
            borderRadius: '8px',
            border: 'none',
            cursor: playing ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '12px',
            background: playing ? 'rgba(255,255,255,0.06)' : 'rgba(52,211,153,0.15)',
            color: playing ? 'var(--ifm-color-content-secondary)' : '#34d399',
            boxShadow: playing ? 'none' : '0 0 0 1.5px rgba(52,211,153,0.4)',
            transition: 'all 0.2s ease',
          }}
        >
          {playing ? 'Playing…' : '▶ Animate'}
        </button>
      </div>

      <div style={{ padding: '18px' }}>
        <div className="gc-lifecycle-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '18px', alignItems: 'start' }}>
          <div>
            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
              <svg viewBox="0 0 780 360" className="interactive-diagram-svg" style={{ width: '100%', height: 'auto' }}>
                <defs>
                  <marker id="gc-life-arr-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34d399" />
                  </marker>
                  <marker id="gc-life-arr-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
                  </marker>
                  <marker id="gc-life-arr-teal" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2dd4bf" />
                  </marker>
                  <marker id="gc-life-arr-purple" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a78bfa" />
                  </marker>
                  <marker id="gc-life-arr-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f87171" />
                  </marker>
                </defs>

                {/* Young gen frame */}
                <rect x="20" y="20" width="420" height="220" rx="12" fill="rgba(56,189,248,0.05)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="36" y="44" fill="#38bdf8" fontSize="12" fontWeight="800">
                  YOUNG GENERATION
                </text>

                {/* Eden */}
                <g onClick={() => selectStep(0)} style={{ cursor: 'pointer' }}>
                  <rect
                    x="40"
                    y="60"
                    width="200"
                    height="160"
                    rx="8"
                    fill={regionFill(edenHot, '#34d399', s !== null && s > 0 && s < 5)}
                    stroke="#34d399"
                    strokeWidth={edenHot ? 2.4 : 1.4}
                  />
                  <text x="140" y="120" textAnchor="middle" fill="#34d399" fontSize="16" fontWeight="800">
                    Eden
                  </text>
                  <text x="140" y="142" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="11">
                    new objects
                  </text>
                  <text x="140" y="162" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">
                    TLAB bump-pointer
                  </text>
                </g>

                {/* S0 */}
                <g onClick={() => selectStep(toIsS1 ? 2 : 1)} style={{ cursor: 'pointer' }}>
                  <rect
                    x="260"
                    y="60"
                    width="160"
                    height="70"
                    rx="8"
                    fill={regionFill(!toIsS1 && youngGc, '#2dd4bf', false)}
                    stroke="#2dd4bf"
                    strokeWidth={!toIsS1 && youngGc ? 2.4 : 1.4}
                  />
                  <text x="340" y="90" textAnchor="middle" fill="#2dd4bf" fontSize="13" fontWeight="800">
                    S0 {!toIsS1 && youngGc ? '(To/From)' : ''}
                  </text>
                  <text x="340" y="110" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">
                    Survivor
                  </text>
                </g>

                {/* S1 */}
                <g onClick={() => selectStep(2)} style={{ cursor: 'pointer' }}>
                  <rect
                    x="260"
                    y="150"
                    width="160"
                    height="70"
                    rx="8"
                    fill={regionFill(toIsS1 && youngGc, '#2dd4bf', false)}
                    stroke="#2dd4bf"
                    strokeWidth={toIsS1 && youngGc ? 2.4 : 1.4}
                  />
                  <text x="340" y="180" textAnchor="middle" fill="#2dd4bf" fontSize="13" fontWeight="800">
                    S1 {toIsS1 && youngGc ? '(To/From)' : ''}
                  </text>
                  <text x="340" y="200" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">
                    Survivor
                  </text>
                </g>

                {/* Old gen */}
                <g onClick={() => selectStep(3)} style={{ cursor: 'pointer' }}>
                  <rect
                    x="470"
                    y="20"
                    width="280"
                    height="220"
                    rx="12"
                    fill={regionFill(oldHot && !deadHot, '#a78bfa', false)}
                    stroke="#a78bfa"
                    strokeWidth={oldHot ? 2.2 : 1.5}
                  />
                  <text x="610" y="50" textAnchor="middle" fill="#a78bfa" fontSize="12" fontWeight="800">
                    OLD GENERATION
                  </text>
                  <text x="610" y="120" textAnchor="middle" fill="#a78bfa" fontSize="15" fontWeight="800">
                    Tenured
                  </text>
                  <text x="610" y="145" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="11">
                    age ≥ threshold / overflow
                  </text>
                  <text x="610" y="168" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">
                    long-lived reachable objects
                  </text>
                </g>

                {/* Collected bin */}
                <g onClick={() => selectStep(5)} style={{ cursor: 'pointer' }}>
                  <rect
                    x="470"
                    y="260"
                    width="280"
                    height="70"
                    rx="10"
                    fill={regionFill(deadHot, '#f87171', false)}
                    stroke="#f87171"
                    strokeWidth={deadHot ? 2.4 : 1.4}
                  />
                  <text x="610" y="290" textAnchor="middle" fill="#f87171" fontSize="14" fontWeight="800">
                    Unreachable → Reclaimed
                  </text>
                  <text x="610" y="310" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">
                    Major / Mixed / Concurrent cycle
                  </text>
                </g>

                {/* Flow arrows */}
                {s === 1 && (
                  <>
                    <path
                      id="gc-e1"
                      d="M 250 120 L 252 95"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                      markerEnd="url(#gc-life-arr-blue)"
                      className="interactive-diagram-flowing-path"
                    />
                    <circle r="3.5" fill="#38bdf8" className="interactive-diagram-flowing-dot">
                      <animateMotion dur="0.8s" repeatCount="indefinite">
                        <mpath href="#gc-e1" />
                      </animateMotion>
                    </circle>
                  </>
                )}
                {s === 2 && (
                  <>
                    <path
                      id="gc-e2"
                      d="M 340 135 L 340 145"
                      fill="none"
                      stroke="#2dd4bf"
                      strokeWidth="2.5"
                      markerEnd="url(#gc-life-arr-teal)"
                      className="interactive-diagram-flowing-path"
                    />
                    <circle r="3.5" fill="#2dd4bf" className="interactive-diagram-flowing-dot">
                      <animateMotion dur="0.7s" repeatCount="indefinite">
                        <mpath href="#gc-e2" />
                      </animateMotion>
                    </circle>
                  </>
                )}
                {s === 3 && (
                  <>
                    <path
                      id="gc-e3"
                      d="M 430 130 L 462 130"
                      fill="none"
                      stroke="#a78bfa"
                      strokeWidth="2.5"
                      markerEnd="url(#gc-life-arr-purple)"
                      className="interactive-diagram-flowing-path"
                    />
                    <circle r="3.5" fill="#a78bfa" className="interactive-diagram-flowing-dot">
                      <animateMotion dur="0.8s" repeatCount="indefinite">
                        <mpath href="#gc-e3" />
                      </animateMotion>
                    </circle>
                  </>
                )}
                {s === 5 && (
                  <>
                    <path
                      id="gc-e5"
                      d="M 610 245 L 610 255"
                      fill="none"
                      stroke="#f87171"
                      strokeWidth="2.5"
                      markerEnd="url(#gc-life-arr-red)"
                      className="interactive-diagram-flowing-path"
                    />
                    <circle r="3.5" fill="#f87171" className="interactive-diagram-flowing-dot">
                      <animateMotion dur="0.7s" repeatCount="indefinite">
                        <mpath href="#gc-e5" />
                      </animateMotion>
                    </circle>
                  </>
                )}

                <text x="40" y="280" fill="var(--ifm-color-content-secondary)" fontSize="11">
                  Minor GC: Mark-Copy inside Young · roles of S0/S1 flip each cycle
                </text>
                <text x="40" y="300" fill="var(--ifm-color-content-secondary)" fontSize="11">
                  Promotion: age ≥ MaxTenuringThreshold (default 15) or Survivor pressure
                </text>
                <text x="40" y="330" fill="#fbbf24" fontSize="11" fontWeight="700">
                  Stack locals ≠ heap lifecycle — only objects on the Heap are tenured / GC’d
                </text>
              </svg>
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
              {STEPS.map((step) => {
                const isActive = activeStep === step.id;
                return (
                  <button
                    key={step.id}
                    onClick={() => selectStep(step.id)}
                    style={{
                      flex: '1 1 14%',
                      minWidth: '70px',
                      padding: '7px 6px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '10px',
                      background: isActive ? `${step.color}18` : 'rgba(255,255,255,0.03)',
                      color: isActive ? step.color : 'var(--ifm-color-content-secondary)',
                      boxShadow: isActive ? `0 0 0 1.5px ${step.color}50` : '0 0 0 1px rgba(255,255,255,0.06)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {step.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            {selected ? (
              <div
                className="interactive-diagram-details-card"
                style={{ borderColor: selected.color, minHeight: '320px', maxHeight: '520px', overflowY: 'auto' }}
              >
                <div
                  className="interactive-diagram-card-header"
                  style={{ marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}
                >
                  <span className="interactive-diagram-indicator-dot" style={{ background: selected.color }} />
                  <span style={{ fontSize: '14px', fontWeight: 800, color: selected.color }}>{selected.title}</span>
                </div>
                <p style={{ margin: '0 0 14px 0', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.6 }}>
                  {selected.lead}
                </p>
                <Section label="Under the hood" color={selected.color} items={selected.underTheHood} />
                <Section label="Failure modes" color="#f87171" items={selected.failureModes} />
                <Section label="Notes" color="#fbbf24" items={selected.notes} />
                {selected.flags && selected.flags.length > 0 && (
                  <div>
                    <div
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: '#38bdf8',
                        marginBottom: '5px',
                      }}
                    >
                      Flags
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {selected.flags.map((f) => (
                        <code
                          key={f}
                          style={{
                            fontSize: '11px',
                            color: '#38bdf8',
                            background: 'rgba(56,189,248,0.08)',
                            border: '1px solid rgba(56,189,248,0.25)',
                            borderRadius: '5px',
                            padding: '4px 8px',
                          }}
                        >
                          {f}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '32px 18px',
                  border: '1px dashed rgba(255,255,255,0.10)',
                  borderRadius: '12px',
                  color: 'var(--ifm-color-content-secondary)',
                  fontSize: '13px',
                  minHeight: '320px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1.55,
                }}
              >
                Press ▶ Animate or select a stage to follow an object from Eden through S0/S1 into Old until reclamation.
              </div>
            )}
            <p className="interactive-diagram-helper-text" style={{ marginTop: '10px' }}>
              S0 and S1 swap From/To each Minor GC. Age lives in the object header until promotion or death in Young.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
