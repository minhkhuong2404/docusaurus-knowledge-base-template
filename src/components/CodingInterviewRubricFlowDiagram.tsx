import React, { useState } from 'react';

type TabMode = 'lifecycle' | 'rubric';

interface FlowNode {
  id: string;
  step: string;
  title: string;
  timeWindow: string;
  color: string;
  x: number;
  y: number;
  w: number;
  h: number;
  objective: string;
  doList: string[];
  dontList: string[];
  seniorSignal: string;
}

const LIFECYCLE_NODES: FlowNode[] = [
  {
    id: 'clarify',
    step: '01',
    title: 'Clarify & Constraints',
    timeWindow: 'Min 00–05',
    color: '#38bdf8',
    x: 24,
    y: 55,
    w: 150,
    h: 72,
    objective: 'Eliminate ambiguity, lock down input bounds (N), and surface structural invariants before proposing any algorithm.',
    doList: [
      'Ask input size bounds (e.g. N <= 10^5 implies O(N) or O(N log N))',
      'Clarify sortedness, duplicates, negative values, and character sets (ASCII vs UTF-8)',
      'Ask whether input array/graph can be mutated in-place to save O(N) auxiliary memory',
    ],
    dontList: [
      'Never start typing code in the first 3 minutes',
      'Do not assume inputs fit in 32-bit signed int without checking sum overflow',
    ],
    seniorSignal: 'Frames constraints in terms of memory hierarchy and type safety (e.g., 64-bit long accumulators, cyclic vs DAG topology).',
  },
  {
    id: 'approach',
    step: '02',
    title: 'Brute-Force -> Optimal',
    timeWindow: 'Min 05–10',
    color: '#a78bfa',
    x: 204,
    y: 55,
    w: 150,
    h: 72,
    objective: 'Establish a working baseline in 60 seconds, then apply BUD (Bottlenecks, Unnecessary work, Duplicated work) to reach optimal complexity.',
    doList: [
      'State brute-force time/space complexity verbally in 30–60 seconds',
      'Compare at least 2 approaches (e.g., Sorting O(N log N) + O(1) space vs HashMap O(N) + O(N) space)',
      'Get explicit interviewer buy-in before writing production code',
    ],
    dontList: [
      'Never code the brute-force solution unless explicitly asked',
      'Do not stay silent for 3+ minutes while thinking—narrate your hypothesis tree',
    ],
    seniorSignal: 'Articulates constant-factor realities (e.g., HashMap boxing overhead vs primitive array cache locality).',
  },
  {
    id: 'code',
    step: '03',
    title: 'Modular Clean Code',
    timeWindow: 'Min 10–30',
    color: '#34d399',
    x: 384,
    y: 55,
    w: 150,
    h: 72,
    objective: 'Translate the agreed algorithm into idiomatic, bug-free, self-documenting code with clean abstractions.',
    doList: [
      'Use domain-descriptive identifiers (windowStart, inDegree, minHeap) instead of a, b, x',
      'Extract complex subtasks (isValidCell, buildAdjacencyGraph) into helper methods',
      'Guard upfront against null/empty inputs and integer overflow (lo + (hi - lo) / 2)',
    ],
    dontList: [
      'Avoid legacy Java classes like Stack or Vector—use ArrayDeque',
      'Never use == to compare boxed Integer or String objects',
    ],
    seniorSignal: 'Writes production-ready code on the first pass using modern idioms (Deque, computeIfAbsent, record tuples).',
  },
  {
    id: 'verify',
    step: '04',
    title: 'Dry-Run & Edge Cases',
    timeWindow: 'Min 30–40',
    color: '#fbbf24',
    x: 564,
    y: 55,
    w: 150,
    h: 72,
    objective: 'Proactively trace state variables line-by-line and catch off-by-one bugs before the interviewer points them out.',
    doList: [
      'Trace a non-trivial small example (3–4 elements) tracking exact variable state in a comment table',
      'Test boundary inputs: empty [], single element [x], all duplicates [5,5,5], negative numbers',
      'State final worst-case and average-case Time & Space complexity accurately',
    ],
    dontList: [
      'Do not say "I am done" immediately after typing the last closing brace',
      'Do not test what you wish the code did—trace what the code literally executes',
    ],
    seniorSignal: 'Finds and patches own boundary bug during dry-run without interviewer prompting (earns a 4.0 Testing score).',
  },
  {
    id: 'scale',
    step: '05',
    title: 'Scale & Follow-Ups',
    timeWindow: 'Min 40–45',
    color: '#f472b6',
    x: 744,
    y: 55,
    w: 150,
    h: 72,
    objective: 'Extend the single-machine algorithm to streaming, distributed, or concurrency-safe production constraints.',
    doList: [
      'Discuss what changes if data is an unbounded stream (e.g., Min-Heap of size K or Count-Min Sketch)',
      'Explain thread-safety upgrades (ReentrantReadWriteLock, ConcurrentHashMap, sharded locks)',
      'Transition smoothly into reverse-interviewing with high-signal engineering questions',
    ],
    dontList: [
      'Do not panic when constraints change—treat follow-ups as a positive signal that you finished early',
    ],
    seniorSignal: 'Bridges algorithmic DSA directly to distributed systems (consistent hashing, external merge sort, bloom filters).',
  },
];

interface RubricPillar {
  id: string;
  title: string;
  weight: string;
  color: string;
  x: number;
  y: number;
  w: number;
  h: number;
  strongHire4: string;
  hire3: string;
  noHire12: string;
  staffExpectation: string;
}

const RUBRIC_PILLARS: RubricPillar[] = [
  {
    id: 'comm',
    title: '1. Communication',
    weight: '25% Signal',
    color: '#38bdf8',
    x: 40,
    y: 35,
    w: 185,
    h: 64,
    strongHire4: 'Proactively clarifies constraints, structures thought process logically, and adapts immediately to subtle interviewer cues.',
    hire3: 'Communicates approach clearly before coding; answers questions accurately with minor prompting.',
    noHire12: 'Jumps straight into coding silently, ignores hints, or argues defensively when challenged on trade-offs.',
    staffExpectation: 'Drives the session like an architectural design review—framing trade-offs concisely without rambling.',
  },
  {
    id: 'problem',
    title: '2. Problem Solving',
    weight: '30% Signal',
    color: '#a78bfa',
    x: 260,
    y: 35,
    w: 185,
    h: 64,
    strongHire4: 'Identifies underlying pattern independently, contrasts multiple approaches, and proves tight asymptotic Time & Space bounds.',
    hire3: 'Reaches optimal solution with at most one small nudge; accurately analyzes Big-O complexity.',
    noHire12: 'Stuck on brute-force, requires heavy hand-holding to reach optimal complexity, or miscalculates Big-O.',
    staffExpectation: 'Zero hints needed for medium/hard patterns; proactively analyzes amortized cost, cache locality, and memory overhead.',
  },
  {
    id: 'tech',
    title: '3. Technical Competency',
    weight: '25% Signal',
    color: '#34d399',
    x: 480,
    y: 35,
    w: 185,
    h: 64,
    strongHire4: 'Translates algorithm into clean, modular, idiomatic code rapidly (<15m) with zero syntax or API misuse errors.',
    hire3: 'Writes working code with minor syntax slips or slightly verbose control flow that is cleaned up quickly.',
    noHire12: 'Struggles with basic language collections, off-by-one loops, recursion base cases, or leaves code incomplete.',
    staffExpectation: 'Mastery of standard library internals (e.g., ArrayDeque vs LinkedList, PriorityQueue comparator, immutable records).',
  },
  {
    id: 'testing',
    title: '4. Testing & Verification',
    weight: '20% Signal',
    color: '#fbbf24',
    x: 700,
    y: 35,
    w: 185,
    h: 64,
    strongHire4: 'Systematically dry-runs code with a state trace table, enumerates adversarial corner cases, and self-fixes bugs before asked.',
    hire3: 'Walks through a standard happy-path example and catches obvious edge cases when prompted.',
    noHire12: 'Declares "done" without testing, misses null/empty/overflow bugs, or relies on the interviewer to debug.',
    staffExpectation: 'Treats verification as an invariant proof: tests boundaries (0, 1, MAX_VALUE), cycles, and skewed distributions automatically.',
  },
];

export default function CodingInterviewRubricFlowDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabMode>('lifecycle');
  const [selectedStageId, setSelectedStageId] = useState<string>('approach');
  const [selectedPillarId, setSelectedPillarId] = useState<string>('problem');

  const activeStage = LIFECYCLE_NODES.find((n) => n.id === selectedStageId) ?? LIFECYCLE_NODES[1];
  const activePillar = RUBRIC_PILLARS.find((p) => p.id === selectedPillarId) ?? RUBRIC_PILLARS[1];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .coding-rubric-split {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div className="interactive-diagram-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          <span style={{ color: '#34d399', fontWeight: 700 }}>
            Coding Interview Execution &amp; 4-Pillar Rubric Telemetry
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          <button
            type="button"
            onClick={() => setActiveTab('lifecycle')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              background: activeTab === 'lifecycle' ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === 'lifecycle' ? '#38bdf8' : '#94a3b8',
              boxShadow: activeTab === 'lifecycle' ? '0 0 0 1.5px rgba(56, 189, 248, 0.5)' : '0 0 0 1px rgba(255, 255, 255, 0.1)',
            }}
          >
            45-Min Execution Flow
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rubric')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              background: activeTab === 'rubric' ? 'rgba(52, 211, 153, 0.18)' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === 'rubric' ? '#34d399' : '#94a3b8',
              boxShadow: activeTab === 'rubric' ? '0 0 0 1.5px rgba(52, 211, 153, 0.5)' : '0 0 0 1px rgba(255, 255, 255, 0.1)',
            }}
          >
            4-Pillar Scoring Rubric
          </button>
        </div>
      </div>

      {activeTab === 'lifecycle' ? (
        <div style={{ padding: '16px' }}>
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ overflowX: 'auto', marginBottom: '16px' }}>
            <svg viewBox="0 0 920 175" style={{ width: '100%', minWidth: '740px', height: 'auto', display: 'block' }}>
              <defs>
                {LIFECYCLE_NODES.map((node) => (
                  <marker
                    key={node.id}
                    id={`cir-arr-${node.id}`}
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="3"
                    orient="auto"
                  >
                    <path d="M0,0 L0,6 L8,3 z" fill={node.color} />
                  </marker>
                ))}
              </defs>

              {LIFECYCLE_NODES.slice(0, -1).map((node, idx) => {
                const next = LIFECYCLE_NODES[idx + 1];
                const x1 = node.x + node.w + 6;
                const y1 = node.y + node.h / 2;
                const x2 = next.x - 10;
                const y2 = next.y + next.h / 2;
                const pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
                return (
                  <g key={`${node.id}-${next.id}`}>
                    <path d={pathD} stroke="rgba(148, 163, 184, 0.25)" strokeWidth="2" fill="none" />
                    <path
                      d={pathD}
                      stroke={node.color}
                      strokeWidth="2.2"
                      fill="none"
                      className="interactive-diagram-flowing-path"
                      markerEnd={`url(#cir-arr-${node.id})`}
                    />
                  </g>
                );
              })}

              {LIFECYCLE_NODES.map((node) => {
                const isSelected = node.id === activeStage.id;
                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedStageId(node.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect
                      x={node.x}
                      y={node.y}
                      width={node.w}
                      height={node.h}
                      rx={10}
                      fill={isSelected ? `${node.color}24` : 'rgba(15, 23, 42, 0.9)'}
                      stroke={node.color}
                      strokeWidth={isSelected ? 2.4 : 1.3}
                    />
                    <text
                      x={node.x + 12}
                      y={node.y + 22}
                      fill={node.color}
                      fontSize="10"
                      fontWeight="700"
                    >
                      STEP {node.step} • {node.timeWindow}
                    </text>
                    <text
                      x={node.x + 12}
                      y={node.y + 43}
                      fill="#ffffff"
                      fontSize="12"
                      fontWeight="700"
                    >
                      {node.title}
                    </text>
                    <text
                      x={node.x + 12}
                      y={node.y + 60}
                      fill="#94a3b8"
                      fontSize="10"
                    >
                      Click to inspect playbook
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div
            className="interactive-diagram-details-card"
            style={{
              borderLeft: `4px solid ${activeStage.color}`,
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: activeStage.color }}>
                Step {activeStage.step}: {activeStage.title} ({activeStage.timeWindow})
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '999px',
                  background: `${activeStage.color}20`,
                  color: activeStage.color,
                }}
              >
                Staff / Principal Bar Signal
              </span>
            </div>

            <p style={{ fontSize: '13px', color: '#e2e8f0', marginBottom: '14px', lineHeight: 1.55 }}>
              {activeStage.objective}
            </p>

            <div className="coding-rubric-split" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', alignItems: 'start' }}>
              <div style={{ background: 'rgba(52, 211, 153, 0.06)', border: '1px solid rgba(52, 211, 153, 0.25)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', marginBottom: '8px' }}>
                  High-Signal Execution (Do)
                </div>
                {activeStage.doList.map((item, i) => (
                  <div key={i} style={{ fontSize: '12px', color: '#e2e8f0', marginBottom: '6px', lineHeight: 1.5 }}>
                    • {item}
                  </div>
                ))}
              </div>

              <div style={{ background: 'rgba(248, 113, 113, 0.06)', border: '1px solid rgba(248, 113, 113, 0.25)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f87171', marginBottom: '8px' }}>
                  Red Flags &amp; Anti-Patterns (Avoid)
                </div>
                {activeStage.dontList.map((item, i) => (
                  <div key={i} style={{ fontSize: '12px', color: '#e2e8f0', marginBottom: '6px', lineHeight: 1.5 }}>
                    • {item}
                  </div>
                ))}
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '11.5px', color: '#38bdf8' }}>
                  <strong>L5/L6 Upgrade:</strong> {activeStage.seniorSignal}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '16px' }}>
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ overflowX: 'auto', marginBottom: '16px' }}>
            <svg viewBox="0 0 920 210" style={{ width: '100%', minWidth: '740px', height: 'auto', display: 'block' }}>
              <defs>
                {RUBRIC_PILLARS.map((p) => (
                  <marker
                    key={p.id}
                    id={`rub-arr-${p.id}`}
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="3"
                    orient="auto"
                  >
                    <path d="M0,0 L0,6 L8,3 z" fill={p.color} />
                  </marker>
                ))}
              </defs>

              {RUBRIC_PILLARS.map((p) => {
                const isSelected = p.id === activePillar.id;
                const startX = p.x + p.w / 2;
                const startY = p.y + p.h + 6;
                const targetX = 460;
                const targetY = 142;
                const pathD = `M ${startX} ${startY} C ${startX} ${startY + 22}, ${targetX} ${targetY - 22}, ${targetX} ${targetY}`;
                return (
                  <g key={p.id}>
                    <path d={pathD} stroke="rgba(148, 163, 184, 0.22)" strokeWidth="1.8" fill="none" />
                    <path
                      d={pathD}
                      stroke={p.color}
                      strokeWidth={isSelected ? '2.5' : '1.8'}
                      fill="none"
                      className="interactive-diagram-flowing-path"
                      markerEnd={`url(#rub-arr-${p.id})`}
                    />
                    <g onClick={() => setSelectedPillarId(p.id)} style={{ cursor: 'pointer' }}>
                      <rect
                        x={p.x}
                        y={p.y}
                        width={p.w}
                        height={p.h}
                        rx={10}
                        fill={isSelected ? `${p.color}24` : 'rgba(15, 23, 42, 0.9)'}
                        stroke={p.color}
                        strokeWidth={isSelected ? 2.4 : 1.3}
                      />
                      <text x={p.x + 14} y={p.y + 24} fill={p.color} fontSize="12" fontWeight="700">
                        {p.title}
                      </text>
                      <text x={p.x + 14} y={p.y + 44} fill="#e2e8f0" fontSize="11">
                        {p.weight} • Click to inspect
                      </text>
                    </g>
                  </g>
                );
              })}

              <rect
                x={270}
                y={148}
                width={380}
                height={46}
                rx={10}
                fill="rgba(15, 23, 42, 0.95)"
                stroke="#34d399"
                strokeWidth="2"
              />
              <text x={460} y={168} textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">
                Hiring Committee Packet Synthesis
              </text>
              <text x={460} y={184} textAnchor="middle" fill="#34d399" fontSize="10.5">
                4.0 Strong Hire • 3.0 Hire • 2.0 Lean No Hire • 1.0 No Hire
              </text>
            </svg>
          </div>

          <div
            className="interactive-diagram-details-card"
            style={{
              borderLeft: `4px solid ${activePillar.color}`,
              padding: '16px',
            }}
          >
            <div style={{ fontSize: '15px', fontWeight: 700, color: activePillar.color, marginBottom: '12px' }}>
              {activePillar.title} ({activePillar.weight})
            </div>

            <div className="coding-rubric-split" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>
                    4.0 — Strong Hire Signal
                  </div>
                  <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.5 }}>{activePillar.strongHire4}</div>
                </div>
                <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
                    3.0 — Hire Signal
                  </div>
                  <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.5 }}>{activePillar.hire3}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: 'rgba(248, 113, 113, 0.08)', border: '1px solid rgba(248, 113, 113, 0.3)', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#f87171', marginBottom: '4px' }}>
                    1.0 / 2.0 — Lean No Hire / No Hire
                  </div>
                  <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.5 }}>{activePillar.noHire12}</div>
                </div>
                <div style={{ background: 'rgba(167, 139, 250, 0.08)', border: '1px solid rgba(167, 139, 250, 0.3)', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#a78bfa', marginBottom: '4px' }}>
                    Senior / Staff+ (L5/L6) Leveling Bar
                  </div>
                  <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.5 }}>{activePillar.staffExpectation}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
