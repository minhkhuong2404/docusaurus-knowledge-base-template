import React, { useState } from 'react';

type SimulationTurn = {
  turnNumber: number;
  label: string;
  userPromptTokens: number;
  outputTokens: number;
  cachedTokens: number;
  newTokensComputed: number;
  totalTokensInWindow: number;
  costWithCache: number; // in USD cents or dollars
  costWithoutCache: number;
  ttftWithCacheMs: number;
  ttftWithoutCacheMs: number;
  description: string;
};

const SIMULATION_TURNS: SimulationTurn[] = [
  {
    turnNumber: 1,
    label: 'Turn 1: Initial System + Prompt',
    userPromptTokens: 1000,
    outputTokens: 3000,
    cachedTokens: 0,
    newTokensComputed: 51000,
    totalTokensInWindow: 51000,
    costWithCache: 0.191, // 51k * $3.75/M (1.25x cache write)
    costWithoutCache: 0.153, // 51k * $3.00/M (base input price)
    ttftWithCacheMs: 2400,
    ttftWithoutCacheMs: 2400,
    description: 'Cold Cache: 50k tokens (System Prompt + MCP Tool Schemas + Docs) + 1k user prompt. Full attention computed and saved to GPU KV-Cache.'
  },
  {
    turnNumber: 2,
    label: 'Turn 2: First Tool Call / Chat Turn',
    userPromptTokens: 1000,
    outputTokens: 3000,
    cachedTokens: 51000,
    newTokensComputed: 4000, // 3k prev output + 1k new input
    totalTokensInWindow: 55000,
    costWithCache: 0.027, // 51k * $0.30/M (cache read) + 4k * $3.00/M = $0.0153 + $0.012 = $0.027
    costWithoutCache: 0.165, // 55k * $3.00/M = $0.165 (6.1x more expensive!)
    ttftWithCacheMs: 380, // 84% reduction in TTFT
    ttftWithoutCacheMs: 2600,
    description: 'Cache Hit: 51k prefix tokens reloaded from VRAM at 90% discount! Only 4k new tokens processed through attention heads.'
  },
  {
    turnNumber: 3,
    label: 'Turn 3: Subsequent Agent Step',
    userPromptTokens: 1000,
    outputTokens: 3000,
    cachedTokens: 55000,
    newTokensComputed: 4000,
    totalTokensInWindow: 59000,
    costWithCache: 0.028, // 55k * $0.30/M + 4k * $3.00/M = $0.0165 + $0.012 = $0.028
    costWithoutCache: 0.177, // 59k * $3.00/M = $0.177 (6.3x more expensive!)
    ttftWithCacheMs: 410,
    ttftWithoutCacheMs: 2800,
    description: 'Incremental Append: Prefix grew to 55k tokens. Previous attention state preserved. Agent enjoys sub-second time-to-first-token.'
  },
  {
    turnNumber: 4,
    label: 'Turn 4: Multi-Step Task Deepens',
    userPromptTokens: 1000,
    outputTokens: 3000,
    cachedTokens: 59000,
    newTokensComputed: 4000,
    totalTokensInWindow: 63000,
    costWithCache: 0.029,
    costWithoutCache: 0.189,
    ttftWithCacheMs: 430,
    ttftWithoutCacheMs: 3100,
    description: 'Sustained Savings: In long-running agent workflows (coding, research), 90%+ of tokens are read from cache on every loop iteration.'
  }
];

export default function PromptCachingDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'simulator' | 'invalidation' | 'economics'>('simulator');
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(1);
  const [isInvalidatedExample, setIsInvalidatedExample] = useState<boolean>(false);

  const turn = SIMULATION_TURNS[currentTurnIndex];

  // Cumulative calculation up to currentTurnIndex
  let cumulativeWithCache = 0;
  let cumulativeWithoutCache = 0;
  for (let i = 0; i <= currentTurnIndex; i++) {
    cumulativeWithCache += SIMULATION_TURNS[i].costWithCache;
    cumulativeWithoutCache += SIMULATION_TURNS[i].costWithoutCache;
  }
  const totalSavedPercent = Math.round(((cumulativeWithoutCache - cumulativeWithCache) / cumulativeWithoutCache) * 100);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Prompt Caching & KV-Cache Reuse Architecture
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('simulator')}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '6px',
              border: '1px solid',
              borderColor: activeTab === 'simulator' ? '#38bdf8' : 'rgba(255,255,255,0.1)',
              background: activeTab === 'simulator' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: activeTab === 'simulator' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
              cursor: 'pointer'
            }}
          >
            KV-Cache Simulator
          </button>
          <button
            onClick={() => setActiveTab('invalidation')}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '6px',
              border: '1px solid',
              borderColor: activeTab === 'invalidation' ? '#f87171' : 'rgba(255,255,255,0.1)',
              background: activeTab === 'invalidation' ? 'rgba(248, 113, 113, 0.15)' : 'transparent',
              color: activeTab === 'invalidation' ? '#f87171' : 'var(--ifm-color-content-secondary)',
              cursor: 'pointer'
            }}
          >
            Prefix Invalidation Trap
          </button>
          <button
            onClick={() => setActiveTab('economics')}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '6px',
              border: '1px solid',
              borderColor: activeTab === 'economics' ? '#34d399' : 'rgba(255,255,255,0.1)',
              background: activeTab === 'economics' ? 'rgba(52, 211, 153, 0.15)' : 'transparent',
              color: activeTab === 'economics' ? '#34d399' : 'var(--ifm-color-content-secondary)',
              cursor: 'pointer'
            }}
          >
            Provider Economics Matrix
          </button>
        </div>
      </div>

      <style>{`
        @keyframes flowingDash {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }
        .flowing-arrow-path {
          stroke-dasharray: 6 6;
          animation: flowingDash 1.2s linear infinite;
        }
        .flowing-arrow-fast {
          stroke-dasharray: 4 4;
          animation: flowingDash 0.8s linear infinite;
        }
        @media (max-width: 768px) {
          .diagram-split-pane {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Tab 1: KV-Cache Simulator */}
      {activeTab === 'simulator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Turn selector bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#0d0f1e',
            border: '1px solid #1e2342',
            borderRadius: '8px',
            padding: '8px 12px',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {SIMULATION_TURNS.map((t, idx) => (
                <button
                  key={t.turnNumber}
                  onClick={() => setCurrentTurnIndex(idx)}
                  style={{
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: currentTurnIndex === idx ? '#38bdf8' : '#232946',
                    background: currentTurnIndex === idx ? 'rgba(56, 189, 248, 0.2)' : '#13162b',
                    color: currentTurnIndex === idx ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  Turn {t.turnNumber}
                </button>
              ))}
            </div>

            <div style={{ fontSize: '13px', color: '#34d399', fontWeight: 600 }}>
              Cumulative Savings: <span style={{ color: '#ffffff', fontWeight: 800 }}>{totalSavedPercent > 0 ? `${totalSavedPercent}%` : '0%'}</span> (${(cumulativeWithoutCache - cumulativeWithCache).toFixed(3)} saved)
            </div>
          </div>

          {/* Main Visualizer SVG Canvas */}
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '16px' }}>
            <svg viewBox="0 0 900 320" className="interactive-diagram-svg">
              <defs>
                <marker id="marker-blue" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 Z" fill="#38bdf8" />
                </marker>
                <marker id="marker-green" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 Z" fill="#34d399" />
                </marker>
                <marker id="marker-purple" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 Z" fill="#a78bfa" />
                </marker>
                <linearGradient id="cachedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#34d399" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0.08" />
                </linearGradient>
                <linearGradient id="newTokensGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {/* Lane 1: Host Application (Spring AI / LangChain4j / Agent) */}
              <rect x="30" y="30" width="220" height="260" rx="10" fill="#111428" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="50" y="60" fill="#38bdf8" fontSize="13" fontWeight="700">Host Application</text>
              <text x="50" y="80" fill="var(--ifm-color-content-secondary)" fontSize="11">Spring AI / LangChain4j</text>

              {/* Payload Breakdown Box */}
              <rect x="45" y="100" width="190" height="46" rx="6" fill="#181c38" stroke="#34d399" strokeWidth="1" />
              <text x="55" y="120" fill="#34d399" fontSize="11" fontWeight="700">Static System & Tools Prefix</text>
              <text x="55" y="136" fill="var(--ifm-color-content-secondary)" fontSize="10">50,000 tokens (Immutable)</text>

              <rect x="45" y="156" width="190" height="46" rx="6" fill="#181c38" stroke={turn.turnNumber === 1 ? '#38bdf8' : '#34d399'} strokeWidth="1" />
              <text x="55" y="176" fill={turn.turnNumber === 1 ? '#38bdf8' : '#34d399'} fontSize="11" fontWeight="700">History Prefix</text>
              <text x="55" y="192" fill="var(--ifm-color-content-secondary)" fontSize="10">
                {turn.turnNumber === 1 ? '0 tokens (Turn 1 init)' : `${turn.cachedTokens - 50000} tokens cached`}
              </text>

              <rect x="45" y="212" width="190" height="46" rx="6" fill="#181c38" stroke="#f97316" strokeWidth="1" />
              <text x="55" y="232" fill="#f97316" fontSize="11" fontWeight="700">Tail Delta Message</text>
              <text x="55" y="248" fill="var(--ifm-color-content-secondary)" fontSize="10">
                +{turn.newTokensComputed} new tokens to compute
              </text>

              {/* Flow Conduits to Cloud LLM Provider */}
              {turn.cachedTokens > 0 ? (
                <>
                  {/* Flowing Cache Hit Line */}
                  <path
                    d="M 250 123 L 370 123"
                    fill="none"
                    stroke="#34d399"
                    strokeWidth="2.5"
                    className="flowing-arrow-fast"
                    markerEnd="url(#marker-green)"
                  />
                  <text x="270" y="115" fill="#34d399" fontSize="10" fontWeight="700">CACHE HIT (Prefix Read)</text>
                </>
              ) : (
                <>
                  {/* Cold write line */}
                  <path
                    d="M 250 123 L 370 123"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    className="flowing-arrow-path"
                    markerEnd="url(#marker-blue)"
                  />
                  <text x="265" y="115" fill="#38bdf8" fontSize="10" fontWeight="700">COLD WRITE (Compute K,V)</text>
                </>
              )}

              {/* New tokens line */}
              <path
                d="M 250 235 L 370 235"
                fill="none"
                stroke="#f97316"
                strokeWidth="2"
                className="flowing-arrow-path"
                markerEnd="url(#marker-blue)"
              />
              <text x="270" y="252" fill="#f97316" fontSize="10" fontWeight="700">New Attention Tokens</text>

              {/* Lane 2: GPU VRAM / KV-Cache Store */}
              <rect x="380" y="30" width="240" height="260" rx="10" fill="#0e1224" stroke={turn.cachedTokens > 0 ? '#34d399' : '#a78bfa'} strokeWidth="1.5" />
              <text x="400" y="60" fill={turn.cachedTokens > 0 ? '#34d399' : '#a78bfa'} fontSize="13" fontWeight="700">
                GPU VRAM (KV-Cache)
              </text>
              <text x="400" y="80" fill="var(--ifm-color-content-secondary)" fontSize="11">
                Radix Tree / PagedAttention Block
              </text>

              {/* KV-Cache Memory Blocks visual */}
              <g transform="translate(400, 100)">
                <rect x="0" y="0" width="200" height="70" rx="6" fill="url(#cachedGradient)" stroke="#34d399" strokeWidth="1.5" />
                <text x="12" y="24" fill="#34d399" fontSize="11" fontWeight="700">
                  {turn.cachedTokens > 0 ? `Active KV-Cache: ${turn.cachedTokens.toLocaleString()} tk` : 'Unpopulated (Cold)'}
                </text>
                <text x="12" y="42" fill="var(--ifm-color-content-secondary)" fontSize="10">
                  {turn.cachedTokens > 0 ? 'Pre-calculated K & V matrices loaded in VRAM' : 'Allocating PagedAttention blocks...'}
                </text>
                <text x="12" y="58" fill={turn.cachedTokens > 0 ? '#34d399' : '#fbbf24'} fontSize="10" fontWeight="600">
                  {turn.cachedTokens > 0 ? 'Cost: 1/10th base price ($0.30/M)' : 'First turn: write charged at 1.25x'}
                </text>

                <rect x="0" y="85" width="200" height="60" rx="6" fill="url(#newTokensGradient)" stroke="#f97316" strokeWidth="1" />
                <text x="12" y="108" fill="#f97316" fontSize="11" fontWeight="700">
                  Attention Engine: {turn.newTokensComputed.toLocaleString()} tk
                </text>
                <text x="12" y="126" fill="var(--ifm-color-content-secondary)" fontSize="10">
                  Calculates Q · K^T / √d_k for delta only
                </text>
              </g>

              {/* Flow Conduits from Engine to Next-Token Output */}
              <path
                d="M 620 170 L 680 170"
                fill="none"
                stroke="#a78bfa"
                strokeWidth="2.5"
                className="flowing-arrow-fast"
                markerEnd="url(#marker-purple)"
              />

              {/* Lane 3: Output Generation & Metrics */}
              <rect x="690" y="30" width="180" height="260" rx="10" fill="#121528" stroke="#a78bfa" strokeWidth="1.5" />
              <text x="710" y="60" fill="#a78bfa" fontSize="13" fontWeight="700">Output Stream</text>
              <text x="710" y="80" fill="var(--ifm-color-content-secondary)" fontSize="11">Next-Token Prediction</text>

              {/* Metrics Badge */}
              <rect x="705" y="100" width="150" height="42" rx="6" fill="#1b1e3b" stroke="#34d399" strokeWidth="1" />
              <text x="715" y="118" fill="#34d399" fontSize="10" fontWeight="700">Time-To-First-Token (TTFT)</text>
              <text x="715" y="134" fill="#ffffff" fontSize="12" fontWeight="800">
                {turn.ttftWithCacheMs}ms <tspan fill="#f87171" fontSize="10">({turn.ttftWithoutCacheMs}ms cold)</tspan>
              </text>

              <rect x="705" y="152" width="150" height="42" rx="6" fill="#1b1e3b" stroke="#38bdf8" strokeWidth="1" />
              <text x="715" y="170" fill="#38bdf8" fontSize="10" fontWeight="700">Turn Input Cost</text>
              <text x="715" y="186" fill="#ffffff" fontSize="12" fontWeight="800">
                ${turn.costWithCache.toFixed(3)} <tspan fill="#f87171" fontSize="10">(${turn.costWithoutCache.toFixed(3)})</tspan>
              </text>

              <rect x="705" y="204" width="150" height="70" rx="6" fill="#1b1e3b" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <text x="715" y="222" fill="var(--ifm-color-content)" fontSize="10" fontWeight="700">Turn Delta Savings</text>
              <text x="715" y="244" fill="#34d399" fontSize="16" fontWeight="800">
                {turn.turnNumber === 1 ? 'Cold Write' : `-${Math.round((1 - turn.costWithCache / turn.costWithoutCache) * 100)}%`}
              </text>
              <text x="715" y="262" fill="var(--ifm-color-content-secondary)" fontSize="9">
                {turn.turnNumber === 1 ? 'Saved on future turns' : 'Input cost slashed by ~85-90%'}
              </text>
            </svg>
          </div>

          {/* Turn Description Card */}
          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #38bdf8' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: '14px' }}>
                {turn.label}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
                Total Window: <strong>{turn.totalTokensInWindow.toLocaleString()} tokens</strong>
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', color: 'var(--ifm-color-content)' }}>
              {turn.description}
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Cache Invalidation Trap Visualizer */}
      {activeTab === 'invalidation' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => setIsInvalidatedExample(false)}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: `1.5px solid ${!isInvalidatedExample ? '#34d399' : '#1e2342'}`,
                background: !isInvalidatedExample ? 'rgba(52, 211, 153, 0.12)' : '#0d0f1e',
                color: !isInvalidatedExample ? '#34d399' : 'var(--ifm-color-content-secondary)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              ✅ Best Practice: Static Prefix + Dynamic Tail (Cache Hits!)
            </button>
            <button
              onClick={() => setIsInvalidatedExample(true)}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: `1.5px solid ${isInvalidatedExample ? '#f87171' : '#1e2342'}`,
                background: isInvalidatedExample ? 'rgba(248, 113, 113, 0.12)' : '#0d0f1e',
                color: isInvalidatedExample ? '#f87171' : 'var(--ifm-color-content-secondary)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              ❌ The Trap: Dynamic Timestamp in System Prompt (100% Cache Miss)
            </button>
          </div>

          <div
            className="diagram-split-pane"
            style={{
              display: 'grid',
              gridTemplateColumns: '50% 50%',
              gap: '16px',
              alignItems: 'start'
            }}
          >
            {/* Left Box: Payload Structure */}
            <div style={{ background: '#0d0f1e', border: '1px solid #1e2342', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '12px' }}>
                Payload Structure Sent to LLM API
              </div>

              {/* Message 1: System */}
              <div style={{
                background: isInvalidatedExample ? 'rgba(248, 113, 113, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                border: `1px solid ${isInvalidatedExample ? '#f87171' : '#34d399'}`,
                borderRadius: '6px',
                padding: '10px',
                marginBottom: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: isInvalidatedExample ? '#f87171' : '#34d399', marginBottom: '4px' }}>
                  <span>ROLE: SYSTEM (50,000 tokens)</span>
                  <span>{isInvalidatedExample ? 'MUTATED EVERY SECOND' : '100% DETERMINISTIC'}</span>
                </div>
                <pre style={{ margin: 0, padding: '6px', background: '#090b14', fontSize: '11px', color: 'var(--ifm-color-content)', borderRadius: '4px', overflowX: 'auto' }}>
                  {isInvalidatedExample ? (
`You are an AI coding assistant.
Current Time: 2026-09-14 23:40:12.834  <-- 💥 CACHE KILLER!
Working Dir: /Users/dev/project
[+49,900 tokens of rules, tools, & schema]`
                  ) : (
`You are an AI coding assistant.
[+49,900 tokens of static rules, tools, & architecture schemas]
(No timestamps, no changing runtime state)`
                  )}
                </pre>
              </div>

              {/* Message 2: Conversation History */}
              <div style={{
                background: isInvalidatedExample ? 'rgba(248, 113, 113, 0.08)' : 'rgba(52, 211, 153, 0.08)',
                border: `1px dashed ${isInvalidatedExample ? '#f87171' : '#34d399'}`,
                borderRadius: '6px',
                padding: '10px',
                marginBottom: '10px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: isInvalidatedExample ? '#f87171' : '#34d399', marginBottom: '4px' }}>
                  ROLE: HISTORY (4,000 tokens)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
                  {isInvalidatedExample
                    ? 'Prefix already corrupted by system prompt above! Cache comparison fails at byte 42.'
                    : 'Append-Only conversation turns. Every previous turn matches the GPU prefix hash.'}
                </div>
              </div>

              {/* Message 3: Current User Turn */}
              <div style={{
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid #38bdf8',
                borderRadius: '6px',
                padding: '10px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
                  ROLE: USER (Tail Message - 500 tokens)
                </div>
                <pre style={{ margin: 0, padding: '6px', background: '#090b14', fontSize: '11px', color: 'var(--ifm-color-content)', borderRadius: '4px', overflowX: 'auto' }}>
                  {!isInvalidatedExample ? (
`[Dynamic runtime state passed HERE at the tail]:
Current Time: 2026-09-14 23:40:12
User Request: "Optimize the database query in OrderService.java"`
                  ) : (
`User Request: "Optimize the database query in OrderService.java"`
                  )}
                </pre>
              </div>
            </div>

            {/* Right Box: GPU KV-Cache Outcome */}
            <div style={{ background: '#0d0f1e', border: '1px solid #1e2342', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '12px' }}>
                GPU Attention & Billing Outcome
              </div>

              <div style={{
                padding: '14px',
                borderRadius: '8px',
                background: isInvalidatedExample ? 'rgba(248, 113, 113, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                border: `1.5px solid ${isInvalidatedExample ? '#f87171' : '#34d399'}`,
                marginBottom: '14px'
              }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: isInvalidatedExample ? '#f87171' : '#34d399' }}>
                  {isInvalidatedExample ? '💥 100% CACHE MISS (INVALIDATED)' : '⚡ 92% CACHE HIT (KV REUSE)'}
                </div>
                <div style={{ fontSize: '12px', marginTop: '6px', color: 'var(--ifm-color-content)' }}>
                  {isInvalidatedExample
                    ? 'Because byte 42 changed, the provider Radix tree branch severed. All 54,000 tokens are recomputed on GPU cores from scratch!'
                    : '54,000 tokens instantly recalled from GPU High-Bandwidth Memory (HBM). Zero attention recomputation required.'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div style={{ background: '#13162b', padding: '10px', borderRadius: '6px', border: '1px solid #1e2342' }}>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Per-Turn Cost</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: isInvalidatedExample ? '#f87171' : '#34d399' }}>
                    {isInvalidatedExample ? '$0.165 / turn' : '$0.027 / turn'}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>
                    {isInvalidatedExample ? 'Full price billed' : '90% token discount'}
                  </div>
                </div>

                <div style={{ background: '#13162b', padding: '10px', borderRadius: '6px', border: '1px solid #1e2342' }}>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>100-Turn Agent Session</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: isInvalidatedExample ? '#f87171' : '#34d399' }}>
                    {isInvalidatedExample ? '$42.50' : '$4.75'}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>
                    {isInvalidatedExample ? 'Tokens grow quadratically' : '88.8% total cost reduction'}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.5' }}>
                💡 <strong>Architectural Rule:</strong> Prefix caching checks characters strictly from index 0 forward. Any dynamic perturbation at token $N$ invalidates every single token from index $N+1$ to the end of the context window.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Provider Pricing & SLA Matrix */}
      {activeTab === 'economics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            background: '#0d0f1e',
            border: '1px solid #1e2342',
            borderRadius: '10px',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#13162b', borderBottom: '1px solid #1e2342', color: 'var(--ifm-color-content)' }}>
                  <th style={{ padding: '12px' }}>Provider & Model</th>
                  <th style={{ padding: '12px' }}>Caching Mechanism</th>
                  <th style={{ padding: '12px' }}>Min Threshold</th>
                  <th style={{ padding: '12px' }}>TTL (Eviction Window)</th>
                  <th style={{ padding: '12px' }}>Cache Read Discount</th>
                  <th style={{ padding: '12px' }}>Cache Write Surcharge</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #1e2342' }}>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#38bdf8' }}>Anthropic Claude 3.5 Sonnet</td>
                  <td style={{ padding: '12px' }}>Explicit <code>cache_control</code> breakpoint</td>
                  <td style={{ padding: '12px' }}>1,024 tokens (2,048 on Haiku)</td>
                  <td style={{ padding: '12px' }}>5 minutes (or 1h option)</td>
                  <td style={{ padding: '12px', color: '#34d399', fontWeight: 700 }}>90% OFF ($0.30/M)</td>
                  <td style={{ padding: '12px', color: '#fbbf24' }}>+25% on 1st write ($3.75/M)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #1e2342' }}>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#34d399' }}>OpenAI GPT-4o / o1</td>
                  <td style={{ padding: '12px' }}>Automatic Prefix Matching</td>
                  <td style={{ padding: '12px' }}>1,024 tokens (in 128-token blocks)</td>
                  <td style={{ padding: '12px' }}>5–60 minutes (dynamic traffic)</td>
                  <td style={{ padding: '12px', color: '#34d399', fontWeight: 700 }}>50% OFF ($1.25/M)</td>
                  <td style={{ padding: '12px', color: '#34d399' }}>Free (0% surcharge)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #1e2342' }}>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#2dd4bf' }}>DeepSeek V3 / R1</td>
                  <td style={{ padding: '12px' }}>Automatic Prefix Matching</td>
                  <td style={{ padding: '12px' }}>64 tokens</td>
                  <td style={{ padding: '12px' }}>Multi-hour persistent</td>
                  <td style={{ padding: '12px', color: '#34d399', fontWeight: 700 }}>75% OFF ($0.07/M)</td>
                  <td style={{ padding: '12px', color: '#34d399' }}>Free (0% surcharge)</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#a78bfa' }}>Google Gemini 1.5 Pro</td>
                  <td style={{ padding: '12px' }}>Explicit Context Caching API</td>
                  <td style={{ padding: '12px' }}>32,768 tokens</td>
                  <td style={{ padding: '12px' }}>1 hour default (customizable)</td>
                  <td style={{ padding: '12px', color: '#34d399', fontWeight: 700 }}>75% OFF ($0.875/M)</td>
                  <td style={{ padding: '12px', color: '#fbbf24' }}>Storage fee per hour</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '12px',
            color: 'var(--ifm-color-content)',
            lineHeight: '1.6'
          }}>
            <strong>💡 Human-in-the-Loop Gotcha:</strong> Notice the 5-minute TTL on Anthropic. If an AI Coding Agent pauses to ask the human for approval or code review, and the developer takes a 10-minute coffee break, the GPU evicts the KV-Cache. The next turn will incur a <strong>Cold Cache Write</strong> surcharge. Keep this in mind when configuring agent pause intervals!
          </div>
        </div>
      )}
    </div>
  );
}
