import React, { useState, useEffect } from 'react';

interface PhaseNode {
  id: string;
  stepNum: string;
  title: string;
  subtitle: string;
  timeWindow: string;
  minutes: string;
  color: string;
  x: number;
  y: number;
  w: number;
  h: number;
  goal: string;
  deliverables: string[];
  antiPattern: string;
  boeRule: string;
  levelExpectations: {
    l4: string;
    l5: string;
    l6: string;
  };
}

const PHASES: PhaseNode[] = [
  {
    id: 'requirements',
    stepNum: '01',
    title: 'Requirements',
    subtitle: 'Functional & Non-Functional',
    timeWindow: 'Min 00–05',
    minutes: '~5 min',
    color: '#38bdf8',
    x: 24,
    y: 56,
    w: 132,
    h: 72,
    goal: 'Lock down the Top 3 core user capabilities (Functional) and quantified system qualities (Non-Functional) before touching the canvas.',
    deliverables: [
      'Top 3 Functional "Users can..." capabilities + explicit Out-of-Scope boundary',
      'Per-operation Consistency vs. Availability (e.g. CP for booking, AP for search)',
      'Quantified scale (DAU, Read:Write ratio, burst peak) & p99 latency targets',
    ],
    antiPattern: 'Writing generic NFRs ("fast, scalable, highly available") or spending 10 minutes doing isolated Back-of-the-Envelope math that never changes a design choice.',
    boeRule: 'Skip isolated upfront math unless a back-of-envelope number immediately changes problem scope. Save calculations for in-context HLD/Deep Dives.',
    levelExpectations: {
      l4: 'Extracts core functional requirements with interviewer prompting; identifies basic read vs. write traffic profile.',
      l5: 'Proactively scopes Top 3 features, cuts scope cleanly, and quantifies operation-specific CAP & p99 latency targets.',
      l6: 'Frames business invariants (RPO=0, legal compliance, peak flash crowds), identifies asymmetric bottlenecks in <3 minutes.',
    },
  },
  {
    id: 'entities',
    stepNum: '02',
    title: 'Core Entities',
    subtitle: 'Domain Nouns & State',
    timeWindow: 'Min 05–08',
    minutes: '~3 min',
    color: '#a78bfa',
    x: 184,
    y: 56,
    w: 128,
    h: 72,
    goal: 'Establish a shared vocabulary of the 3–5 primary persisted domain objects that flow through the API and storage layer.',
    deliverables: [
      '3–5 primary domain nouns (e.g. User, Event, Ticket, Booking)',
      'Key identifiers & relationships without premature SQL column type bike-shedding',
      'Clear separation of mutable transactional state vs. immutable event logs',
    ],
    antiPattern: 'Spending 12 minutes debating VARCHAR(255) vs TEXT, B+Tree index fill factors, or normalization forms before drawing a single service.',
    boeRule: 'No math needed yet—just identify the rough cardinality relationships (1:N, M:N) between entities.',
    levelExpectations: {
      l4: 'Lists main tables/objects accurately so API design has clear nouns to reference.',
      l5: 'Identifies lifecycle state fields (e.g. status, version, expires_at) that will anchor concurrency control later.',
      l6: 'Separates hot contention entities (Inventory/Seat) from cold metadata (Venue/Event) upfront to prepare for sharding.',
    },
  },
  {
    id: 'api',
    stepNum: '03',
    title: 'API Interface',
    subtitle: 'Client-Server Contract',
    timeWindow: 'Min 08–13',
    minutes: '~4–5 min',
    color: '#2dd4bf',
    x: 340,
    y: 56,
    w: 128,
    h: 72,
    goal: 'Translate every Functional Requirement 1-to-1 into an explicit wire contract (REST, gRPC, GraphQL, or WebSocket/SSE).',
    deliverables: [
      '1-to-1 endpoint mapping for each Functional Requirement (verb, path, payload, response)',
      'Idempotency-Key header on state-mutating POST/PUT endpoints',
      'Cursor-based pagination (?cursor=...&limit=20) & JWT caller identity from Auth header',
    ],
    antiPattern: 'Passing trusted user_id inside the POST body (spoofing vulnerability) or using OFFSET pagination on massive tables.',
    boeRule: 'Check payload size only if media/blobs are involved (e.g. >5MB triggers S3 Presigned URLs instead of API Gateway pass-through).',
    levelExpectations: {
      l4: 'Writes clean REST endpoints covering the functional requirements with sensible request/response bodies.',
      l5: 'Includes Idempotency-Key headers, cursor pagination, and extracts user identity from Authorization JWT.',
      l6: 'Justifies protocol trade-offs (REST vs. gRPC vs. SSE/WebSockets) and designs async 202 Accepted polling/webhook contracts for slow ops.',
    },
  },
  {
    id: 'dataflow',
    stepNum: '04',
    title: 'Data Flow',
    subtitle: 'Optional Pipeline Trace',
    timeWindow: 'Min 13–15',
    minutes: '~2 min (Opt)',
    color: '#fbbf24',
    x: 496,
    y: 56,
    w: 128,
    h: 72,
    goal: 'For async data/ingestion pipelines (Web Crawler, Click Aggregator), list the 4–5 sequential transformation stages before drawing boxes.',
    deliverables: [
      'Numbered sequence (1 → 2 → 3 → 4) of how raw input transforms into queryable state',
      'Boundary identification between synchronous ingress and asynchronous stream processing',
      'Skip this step entirely for standard CRUD / request-response applications',
    ],
    antiPattern: 'Forcing a redundant text Data Flow list on a simple CRUD system when the High-Level Design diagram already shows the exact path.',
    boeRule: 'Quickly note event amplification factor (e.g. 1 post → 500 follower fan-out writes) if relevant.',
    levelExpectations: {
      l4: 'Can trace basic request flow verbally before drawing components.',
      l5: 'Knows when to include Data Flow (stream/pipeline problems) vs. when to jump straight from API to HLD.',
      l6: 'Uses Data Flow to isolate failure domains (ingest durability boundary vs. downstream enrichment/aggregation).',
    },
  },
  {
    id: 'hld',
    stepNum: '05',
    title: 'High-Level Design',
    subtitle: 'Baseline Working System',
    timeWindow: 'Min 15–25',
    minutes: '~10–12 min',
    color: '#34d399',
    x: 652,
    y: 56,
    w: 136,
    h: 72,
    goal: 'Build the simplest end-to-end architecture that satisfies 100% of Functional Requirements, going endpoint-by-endpoint.',
    deliverables: [
      'End-to-end diagram: Client → API Gateway/LB → Services → Primary Storage',
      'Concrete database schema & index definitions drawn next to storage nodes',
      'Verbal callouts of scaling bottlenecks ("I will solve this contention in Deep Dives")',
    ],
    antiPattern: 'Prematurely drawing Kafka, Redis, sharding, and multi-region active-active in Minute 15 before proving a baseline working flow.',
    boeRule: 'Perform IN-CONTEXT BOE math here! (e.g. "At 20k writes/sec, a single Postgres primary saturates IOPS, flagging a Deep Dive").',
    levelExpectations: {
      l4: 'Produces a complete, working baseline diagram that satisfies all functional requirements with appropriate DB choices.',
      l5: 'Moves briskly (~10 min), avoids premature optimization, and explicitly flags 2–3 bottlenecks for Deep Dives.',
      l6: 'Completes clean baseline in <8 min with exact schema/index layout, leaving 15+ minutes for Staff-level Deep Dives.',
    },
  },
  {
    id: 'deepdives',
    stepNum: '06',
    title: 'Deep Dives',
    subtitle: 'Scale, Contention & Faults',
    timeWindow: 'Min 25–35+',
    minutes: '~10–15 min',
    color: '#f97316',
    x: 816,
    y: 56,
    w: 136,
    h: 72,
    goal: 'Harden and scale the architecture to satisfy 100% of Non-Functional Requirements and resolve load-bearing bottlenecks.',
    deliverables: [
      '2–3 deep technical solutions (sharding keys, lock-free/atomic contention control, caching)',
      'Failure-mode mitigation (thundering herd, split-brain fencing tokens, Outbox/Saga)',
      'Trade-off matrix comparing at least 2 viable alternatives per bottleneck',
    ],
    antiPattern: 'Speaking in hand-wavy buzzwords ("just add Redis" or "just shard the DB") without specifying cache keys, TTLs, invalidation, or shard keys.',
    boeRule: 'Use targeted math to prove your Deep Dive works (e.g. 10M active seats × 100 bytes = 1GB → fits entirely in a single Redis cluster).',
    levelExpectations: {
      l4: 'Follows interviewer leads into bottlenecks and reasons through viable scaling fixes when prompted.',
      l5: 'Proactively proposes the top 2–3 bottlenecks, presents Option A vs. Option B trade-offs, and justifies the winner.',
      l6: 'Drives the entire Deep Dive autonomously; covers kernel/DB engine mechanics (MVCC, WAL, fencing tokens), blast radius & Day-2 ops.',
    },
  },
];

export default function SystemDesignDeliveryFrameworkDiagram(): React.JSX.Element {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedLevel, setSelectedLevel] = useState<'l4' | 'l5' | 'l6'>('l5');

  useEffect(() => {
    if (!isPlaying) return undefined;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % PHASES.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const currentPhase = PHASES[activeIndex];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .delivery-framework-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span style={{ color: '#34d399', fontWeight: 700 }}>
          The 35-Minute System Design Delivery Framework (Interactive Pacing Engine)
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {(['l4', 'l5', 'l6'] as const).map((lvl) => {
            const labels = { l4: 'Mid (L4)', l5: 'Senior (L5)', l6: 'Staff+ (L6)' };
            const isSelected = selectedLevel === lvl;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedLevel(lvl)}
                style={{
                  background: isSelected ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.14)'}`,
                  color: isSelected ? '#ffffff' : '#94a3b8',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {labels[lvl]}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            style={{
              background: isPlaying ? 'rgba(248, 113, 113, 0.18)' : 'rgba(52, 211, 153, 0.18)',
              border: `1px solid ${isPlaying ? '#f87171' : '#34d399'}`,
              color: isPlaying ? '#f87171' : '#34d399',
              borderRadius: '6px',
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {isPlaying ? 'Pause Walkthrough' : 'Auto-Play 35m Flow'}
          </button>
        </div>
      </div>

      {/* SVG Pipeline Canvas with Moving Arrows */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ overflowX: 'auto' }}>
        <svg viewBox="0 0 976 210" style={{ width: '100%', minWidth: '780px', height: 'auto', display: 'block' }}>
          <defs>
            {PHASES.map((phase) => (
              <marker
                key={phase.id}
                id={`df-arrow-${phase.id}`}
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L0,6 L8,3 z" fill={phase.color} />
              </marker>
            ))}
            <marker id="df-arrow-Loop" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#fbbf24" />
            </marker>
          </defs>

          {/* Top Time Budget Track Bar */}
          <text x="24" y="26" fill="#94a3b8" fontSize="11" fontWeight="600">
            45-MIN INTERVIEW CLOCK: [0–5m Intro] → 35 MIN ACTIVE DESIGN EXECUTION → [40–45m Q&amp;A]
          </text>

          {/* Directed Edges with Flowing Arrows */}
          {PHASES.slice(0, -1).map((fromPhase, idx) => {
            const toPhase = PHASES[idx + 1];
            const x1 = fromPhase.x + fromPhase.w + 6;
            const y1 = fromPhase.y + fromPhase.h / 2;
            const x2 = toPhase.x - 10;
            const y2 = toPhase.y + toPhase.h / 2;
            const isEdgeActive = idx <= activeIndex;

            return (
              <g key={`${fromPhase.id}-${toPhase.id}`}>
                <path
                  d={`M ${x1} ${y1} L ${x2} ${y2}`}
                  stroke="rgba(148, 163, 184, 0.25)"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d={`M ${x1} ${y1} L ${x2} ${y2}`}
                  className="interactive-diagram-flowing-path"
                  stroke={isEdgeActive ? fromPhase.color : '#64748b'}
                  strokeWidth={isEdgeActive ? '2.5' : '1.5'}
                  strokeDasharray="6 4"
                  fill="none"
                  markerEnd={`url(#df-arrow-${fromPhase.id})`}
                />
              </g>
            );
          })}

          {/* Contextual BOE Math & NFR Verification Feedback Arcs */}
          <path
            d="M 720 134 C 720 178, 884 178, 884 134"
            className="interactive-diagram-flowing-path"
            stroke="#fbbf24"
            strokeWidth="2"
            strokeDasharray="6 4"
            fill="none"
            markerEnd="url(#df-arrow-Loop)"
          />
          <rect x="676" y="164" width="256" height="24" rx="5" fill="#0d0f1e" stroke="#fbbf24" strokeWidth="1" />
          <text x="804" y="180" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="700">
            IN-CONTEXT BOE MATH &amp; BOTTLENECK ESCALATION
          </text>

          {/* Trace line from Requirements (NFRs) to Deep Dives */}
          <path
            d="M 90 134 C 90 192, 620 192, 850 134"
            className="interactive-diagram-flowing-path"
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeDasharray="5 5"
            opacity="0.65"
            fill="none"
            markerEnd="url(#df-arrow-requirements)"
          />
          <rect x="250" y="168" width="290" height="22" rx="4" fill="#0d0f1e" stroke="#38bdf8" strokeWidth="1" />
          <text x="395" y="183" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600">
            Non-Functional Requirements Anchor Deep Dives
          </text>

          {/* Phase Nodes */}
          {PHASES.map((phase, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <g
                key={phase.id}
                onClick={() => {
                  setIsPlaying(false);
                  setActiveIndex(idx);
                }}
                style={{ cursor: 'pointer' }}
              >
                {/* Time Badge Above Node */}
                <rect
                  x={phase.x + 12}
                  y={phase.y - 18}
                  width={phase.w - 24}
                  height="15"
                  rx="4"
                  fill={isSelected ? phase.color : 'rgba(15, 23, 42, 0.9)'}
                  stroke={phase.color}
                  strokeWidth="1"
                />
                <text
                  x={phase.x + phase.w / 2}
                  y={phase.y - 7}
                  textAnchor="middle"
                  fill={isSelected ? '#090b14' : phase.color}
                  fontSize="9.5"
                  fontWeight="700"
                >
                  {phase.timeWindow} ({phase.minutes})
                </text>

                {/* Main Node Card */}
                <rect
                  x={phase.x}
                  y={phase.y}
                  width={phase.w}
                  height={phase.h}
                  rx="8"
                  fill={isSelected ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.85)'}
                  stroke={phase.color}
                  strokeWidth={isSelected ? '2.5' : '1.2'}
                />

                {/* Step Number Pill */}
                <text
                  x={phase.x + 10}
                  y={phase.y + 20}
                  fill={phase.color}
                  fontSize="11"
                  fontWeight="800"
                >
                  STEP {phase.stepNum}
                </text>

                {/* Phase Title */}
                <text
                  x={phase.x + 10}
                  y={phase.y + 40}
                  fill="#ffffff"
                  fontSize="12.5"
                  fontWeight="700"
                >
                  {phase.title}
                </text>

                {/* Phase Subtitle */}
                <text
                  x={phase.x + 10}
                  y={phase.y + 57}
                  fill="#94a3b8"
                  fontSize="10"
                >
                  {phase.subtitle}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Split-Pane Inspection Panel */}
      <div
        className="delivery-framework-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '55% 45%',
          gap: '16px',
          padding: '16px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Phase Deliverables & Anti-Patterns */}
        <div
          style={{
            background: '#0c0e17',
            border: `1px solid ${currentPhase.color}`,
            borderRadius: '8px',
            padding: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: currentPhase.color, fontWeight: 800, fontSize: '14px' }}>
              Step {currentPhase.stepNum}: {currentPhase.title} ({currentPhase.minutes})
            </span>
            <span
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                color: '#e2e8f0',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              {currentPhase.timeWindow}
            </span>
          </div>

          <p style={{ color: '#e2e8f0', fontSize: '13px', margin: '0 0 12px 0', lineHeight: 1.5 }}>
            {currentPhase.goal}
          </p>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: '#34d399', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
              Mandatory Whiteboard Deliverables
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', color: '#e2e8f0', fontSize: '12.5px', lineHeight: 1.55 }}>
              {currentPhase.deliverables.map((item) => (
                <li key={item} style={{ marginBottom: '4px' }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div
            style={{
              background: 'rgba(248, 113, 113, 0.08)',
              borderLeft: '3px solid #f87171',
              padding: '8px 10px',
              borderRadius: '4px',
            }}
          >
            <div style={{ color: '#f87171', fontSize: '11px', fontWeight: 700, marginBottom: '2px' }}>
              CRITICAL TIME-MANAGEMENT TRAP TO AVOID
            </div>
            <div style={{ color: '#e2e8f0', fontSize: '12px', lineHeight: 1.45 }}>
              {currentPhase.antiPattern}
            </div>
          </div>
        </div>

        {/* Right Column: Level Calibration & Back-of-the-Envelope Policy */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            style={{
              background: '#0c0e17',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '8px',
              padding: '14px',
            }}
          >
            <div style={{ color: '#38bdf8', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
              Interviewer Rubric Signal ({selectedLevel.toUpperCase()} Bar)
            </div>
            <p style={{ color: '#ffffff', fontSize: '13px', margin: '0 0 10px 0', lineHeight: 1.5 }}>
              {currentPhase.levelExpectations[selectedLevel]}
            </p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {(['l4', 'l5', 'l6'] as const).map((lvl) => (
                <span
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: selectedLevel === lvl ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    color: selectedLevel === lvl ? '#38bdf8' : '#94a3b8',
                    border: `1px solid ${selectedLevel === lvl ? '#38bdf8' : 'transparent'}`,
                  }}
                >
                  {lvl.toUpperCase()}: {lvl === 'l4' ? 'Execution' : lvl === 'l5' ? 'Proactive Trade-offs' : 'Principal Autonomy'}
                </span>
              ))}
            </div>
          </div>

          <div
            style={{
              background: '#0c0e17',
              border: '1px solid rgba(251, 191, 36, 0.35)',
              borderRadius: '8px',
              padding: '12px 14px',
            }}
          >
            <div style={{ color: '#fbbf24', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
              In-Context Back-of-the-Envelope (BOE) Math Rule
            </div>
            <div style={{ color: '#e2e8f0', fontSize: '12px', lineHeight: 1.45 }}>
              {currentPhase.boeRule}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
