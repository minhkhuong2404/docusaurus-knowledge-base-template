import React, { useState } from 'react';

interface SetupDetail {
  id: string;
  tabLabel: string;
  title: string;
  color: string;
  scenario: string;
  flowDescription: string;
  registryRole: string;
  outcomeText: string;
}

const SETUPS: Record<string, SetupDetail> = {
  SPIKE: {
    id: 'SPIKE',
    tabLabel: '1. The Mass DLQ Spike',
    title: 'Schema Mismatch (Mass DLQ Spike)',
    color: '#ef4444',
    scenario: 'Producer deploys OrderV2 (which makes a new field required), but legacy consumers are still running on OrderV1 schema.',
    flowDescription: 'Every OrderV2 message received by the OrderV1 consumer throws a DeserializationException. Consumer threads exhaust retries instantly, routing 100,000+ messages to the DLQ in minutes.',
    registryRole: 'No Registry Check: The incompatible code is deployed directly to production, bypassing schema validation.',
    outcomeText: 'Result: Production Outage. On-call paged. Massive manual redrive task is required after rolling back/fixing code.',
  },
  REGISTRY: {
    id: 'REGISTRY',
    tabLabel: '2. Schema Registry Guard',
    title: 'Schema Registry (Guard & Block)',
    color: '#34d399',
    scenario: 'Producer attempts to publish OrderV2 schema. Before code deployment, CI/CD queries the Schema Registry compatibility API.',
    flowDescription: 'Registry detects that OrderV2 removes/changes required fields, breaking legacy consumers. The API returns compatibility: false, causing the build/CI pipeline to fail and block deployment.',
    registryRole: 'Active Registry Guard: Prevents bad schemas from ever reaching the live brokers.',
    outcomeText: 'Result: Safe Build Failure. Incompatibility caught in CI/CD. No production impact, zero DLQ messages written.',
  },
};

export default function SchemaEvolutionDlqSpikeDiagram(): React.JSX.Element {
  const [activeSetup, setActiveSetup] = useState<string>('SPIKE');

  const current = SETUPS[activeSetup];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 20h20" />
          <path d="M5 17l5-5 5 5 5-10" />
          <circle cx="20" cy="7" r="2" />
        </svg>
        <span style={{ color: '#34d399' }}>Schema Evolution &amp; DLQ Spike Pattern</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
        {Object.values(SETUPS).map(setup => (
          <button
            key={setup.id}
            onClick={() => setActiveSetup(setup.id)}
            style={{
              padding: '6px 12px', borderRadius: '8px',
              cursor: 'pointer', fontWeight: 700, fontSize: '11px',
              background: activeSetup === setup.id ? 'rgba(52,211,153,0.15)' : 'transparent',
              color: activeSetup === setup.id ? '#34d399' : 'var(--ifm-color-content-secondary)',
              border: `1px solid ${activeSetup === setup.id ? '#34d39950' : 'transparent'}`,
              transition: 'all 0.2s',
            }}
          >
            {setup.tabLabel}
          </button>
        ))}
      </div>

      <style>{`
        .spike-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .spike-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="spike-grid">

        {/* SVG Pipeline */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 350 200" className="interactive-diagram-svg">
            <defs>
              <marker id="spk-arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(148,163,184,0.3)" />
              </marker>
              <marker id="spk-arr-color" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={current.color} />
              </marker>
            </defs>

            {/* Producer */}
            <g>
              <rect x="15" y="40" width="80" height="40" rx="5" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" />
              <text x="55" y="58" textAnchor="middle" fill="#cbd5e1" fontSize="8" fontWeight="bold">Producer</text>
              <text x="55" y="70" textAnchor="middle" fill="#f472b6" fontSize="6.5">OrderV2 Schema</text>
            </g>

            {activeSetup === 'SPIKE' ? (
              // Spike Flow
              <g>
                {/* Main Topic */}
                <rect x="135" y="40" width="80" height="40" rx="5" fill="rgba(56,189,248,0.06)" stroke="#38bdf8" strokeWidth="1.2" />
                <text x="175" y="58" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="bold">Main Topic</text>
                <text x="175" y="70" textAnchor="middle" fill="#ef4444" fontSize="6.5">100k Poison Pills</text>

                {/* Legacy Consumer */}
                <rect x="255" y="40" width="80" height="40" rx="5" fill="rgba(239,68,68,0.1)" stroke="#ef4444" strokeWidth="1.5" />
                <text x="295" y="58" textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="bold">Consumer V1</text>
                <text x="295" y="70" textAnchor="middle" fill="#cbd5e1" fontSize="6.5">Deserialization Fail 💥</text>

                {/* DLQ */}
                <rect x="135" y="130" width="80" height="40" rx="5" fill="rgba(244,114,182,0.15)" stroke="#f472b6" strokeWidth="1.5" />
                <text x="175" y="148" textAnchor="middle" fill="#f472b6" fontSize="8" fontWeight="bold">DLQ</text>
                <text x="175" y="160" textAnchor="middle" fill="#ef4444" fontSize="6.5" fontWeight="black">SPIKING: 100,000 depth 📈</text>

                {/* Paths */}
                {/* Producer -> Topic */}
                <path d="M 95 60 L 127 60" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.2" markerEnd="url(#spk-arr)" />
                {/* Topic -> Consumer */}
                <path d="M 215 60 L 247 60" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.2" markerEnd="url(#spk-arr)" />
                {/* Consumer -> DLQ */}
                <path d="M 295 80 L 295 110 L 223 140" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3"
                  className="interactive-diagram-flowing-path" markerEnd="url(#spk-arr-color)" />
              </g>
            ) : (
              // Registry Guard
              <g>
                {/* Schema Registry Box */}
                <rect x="135" y="40" width="80" height="50" rx="6" fill="rgba(52,211,153,0.1)" stroke="#34d399" strokeWidth="1.5" />
                <text x="175" y="60" textAnchor="middle" fill="#34d399" fontSize="8" fontWeight="800">Schema Registry</text>
                <text x="175" y="72" textAnchor="middle" fill="#ef4444" fontSize="6.5" fontWeight="bold">is_compatible: false</text>
                <text x="175" y="82" textAnchor="middle" fill="#94a3b8" fontSize="6" fontStyle="italic">REJECTED 🛑</text>

                {/* Build CI/CD pipeline blocker sign */}
                <rect x="255" y="40" width="80" height="40" rx="5" fill="rgba(239,68,68,0.1)" stroke="#ef4444" strokeWidth="1.2" />
                <text x="295" y="58" textAnchor="middle" fill="#ef4444" fontSize="7" fontWeight="bold">Build Blocked</text>
                <text x="295" y="70" textAnchor="middle" fill="#cbd5e1" fontSize="6">Deployment halted</text>

                {/* Paths */}
                {/* Producer -> Registry check */}
                <path d="M 95 60 L 127 60" fill="none" stroke="#34d399" strokeWidth="1.5"
                  className="interactive-diagram-flowing-path active-path-green" markerEnd="url(#spk-arr-color)" />
                {/* Registry -> CI/CD Block */}
                <path d="M 215 60 L 247 60" fill="none" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="3 3" markerEnd="url(#spk-arr)" />
              </g>
            )}
          </svg>
        </div>

        {/* Info panel */}
        <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${current.color}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>

          <div>
            <h3 style={{ color: current.color }}>{current.title}</h3>
          </div>

          <div style={{ fontSize: '11px' }}>
            <span style={{ fontWeight: 'bold', color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.05em' }}>
              Scenario details
            </span>
            <span style={{ color: 'var(--ifm-color-content)', lineHeight: 1.45 }}>
              {current.scenario}
            </span>
          </div>

          <div style={{ fontSize: '11px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
            <span style={{ fontWeight: 'bold', color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.05em', marginBottom: '2px' }}>
              Pipeline Execution Flow
            </span>
            <span style={{ color: 'var(--ifm-color-content-secondary)', lineHeight: 1.45 }}>
              {current.flowDescription}
            </span>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.02)',
            borderLeft: `3px solid ${current.color}`,
            borderRadius: '4px',
            padding: '8px 10px',
            fontSize: '10.5px',
          }}>
            <span style={{ fontWeight: 'bold', color: current.color, display: 'block', textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.05em', marginBottom: '2px' }}>
              Schema Registry Action
            </span>
            <span style={{ color: 'var(--ifm-color-content-secondary)', lineHeight: 1.45 }}>
              {current.registryRole}
            </span>
          </div>

          <div style={{
            background: activeSetup === 'SPIKE' ? 'rgba(239,68,68,0.04)' : 'rgba(52,211,153,0.04)',
            border: `1px solid ${activeSetup === 'SPIKE' ? 'rgba(239,68,68,0.15)' : 'rgba(52,211,153,0.15)'}`,
            borderRadius: '6px',
            padding: '8px 10px',
            fontSize: '11px',
          }}>
            <div style={{ fontSize: '8.5px', fontWeight: 700, color: current.color, textTransform: 'uppercase', marginBottom: '3px' }}>
              Deployment Outcome
            </div>
            <span style={{ color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
              {current.outcomeText}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
