import React, { useState } from 'react';

interface Stage {
  id: string;
  name: string;
  color: string;
  desc: string;
  roleInfo: string;
}

const STAGES: Stage[] = [
  {
    id: 'COMMAND',
    name: '1. Command (Write path)',
    color: '#ef4444',
    desc: 'Mutates state. Validates domain invariants, enforces business constraints, and commits writes.',
    roleInfo: 'Strict ACID enforcement. Highly normalized SQL schema (e.g. PostgreSQL) prevents data redundancy/anomalies.',
  },
  {
    id: 'CDC',
    name: '2. CDC Projection Link',
    color: '#fbbf24',
    desc: 'Asynchronously projects database mutations to the read database using CDC (Debezium + Kafka).',
    roleInfo: 'Runs out-of-band. Keeps read store updated within milliseconds without degrading write transaction latency.',
  },
  {
    id: 'QUERY',
    name: '3. Query (Read path)',
    color: '#34d399',
    desc: 'Fetches pre-computed lookups. Bypasses join calculations entirely by reading denormalized data models.',
    roleInfo: 'Reads from read-optimized databases (e.g. Elasticsearch, MongoDB documents) tailored for UI layout shapes.',
  },
];

export default function CqrsDataFlowDiagram(): React.JSX.Element {
  const [activeStage, setActiveStage] = useState<string>('CDC');

  const current = STAGES.find(s => s.id === activeStage) || STAGES[1];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9"/>
          <rect x="14" y="3" width="7" height="5"/>
          <rect x="14" y="12" width="7" height="9"/>
          <rect x="3" y="16" width="7" height="5"/>
          <line x1="7" y1="7" x2="14" y2="5"/>
          <line x1="7" y1="18" x2="14" y2="15"/>
        </svg>
        <span style={{ color: '#34d399' }}>CQRS Command &amp; Query Segregation Model</span>
      </div>

      <style>{`
        .cqrs-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .cqrs-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="cqrs-grid">
        
        {/* SVG Viewport */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 350 200" className="interactive-diagram-svg">
            <defs>
              <marker id="cqrs-arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(148,163,184,0.3)" />
              </marker>
              <marker id="cqrs-arr-color" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={current.color} />
              </marker>
            </defs>

            {/* Controller */}
            <g>
              <rect x="15" y="75" width="80" height="40" rx="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <text x="55" y="93" textAnchor="middle" fill="#cbd5e1" fontSize="8" fontWeight="bold">API Router</text>
              <text x="55" y="105" textAnchor="middle" fill="#94a3b8" fontSize="6.5">Controller</text>
            </g>

            {/* Write model / Command path */}
            <g onClick={() => setActiveStage('COMMAND')} style={{ cursor: 'pointer' }}>
              <rect x="125" y="25" width="85" height="40" rx="4" fill={activeStage === 'COMMAND' ? 'rgba(239,68,68,0.1)' : 'rgba(15,23,42,0.8)'} stroke="#ef4444" strokeWidth={activeStage === 'COMMAND' ? '1.8' : '1'} />
              <text x="167.5" y="43" textAnchor="middle" fill="#ef4444" fontSize="7.5" fontWeight="bold">Write DB</text>
              <text x="167.5" y="55" textAnchor="middle" fill="#cbd5e1" fontSize="6.5">Command Model</text>
            </g>

            {/* Read model / Query path */}
            <g onClick={() => setActiveStage('QUERY')} style={{ cursor: 'pointer' }}>
              <rect x="125" y="125" width="85" height="40" rx="4" fill={activeStage === 'QUERY' ? 'rgba(52,211,153,0.1)' : 'rgba(15,23,42,0.8)'} stroke="#34d399" strokeWidth={activeStage === 'QUERY' ? '1.8' : '1'} />
              <text x="167.5" y="143" textAnchor="middle" fill="#34d399" fontSize="7.5" fontWeight="bold">Read DB</text>
              <text x="167.5" y="155" textAnchor="middle" fill="#cbd5e1" fontSize="6.5">Query Model</text>
            </g>

            {/* Paths */}
            {/* Controller to Write */}
            <path d="M 75 75 L 125 45" fill="none" stroke="#ef4444" strokeWidth="1.2" markerEnd="url(#cqrs-arr)" />
            {/* Controller to Read */}
            <path d="M 75 115 L 125 145" fill="none" stroke="#34d399" strokeWidth="1.2" markerEnd="url(#cqrs-arr)" />

            {/* CDC Projection link between DBs */}
            <g onClick={() => setActiveStage('CDC')} style={{ cursor: 'pointer' }}>
              <path d="M 167.5 65 L 167.5 120" fill="none" stroke={activeStage === 'CDC' ? '#fbbf24' : 'rgba(148,163,184,0.3)'} strokeWidth="1.5" strokeDasharray="3 3"
                    className={activeStage === 'CDC' ? 'interactive-diagram-flowing-path' : ''}
                    markerEnd={activeStage === 'CDC' ? 'url(#cqrs-arr-color)' : 'url(#cqrs-arr)'} />
              <text x="210" y="97" textAnchor="middle" fill={activeStage === 'CDC' ? '#fbbf24' : '#94a3b8'} fontSize="7.5" fontWeight="bold">CDC Sync Link</text>
            </g>

            <text x="175" y="190" textAnchor="middle" fill="#475569" fontSize="8" fontStyle="italic">
              💡 Click Command, CDC Link, or Query stages for details.
            </text>
          </svg>
        </div>

        {/* Details Card */}
        <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${current.color}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          <div>
            <h3 style={{ color: current.color }}>{current.name}</h3>
          </div>

          <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', margin: 0, lineHeight: 1.45 }}>
            {current.desc}
          </p>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
            <span style={{ fontWeight: 'bold', color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.05em', marginBottom: '2px' }}>
              Database Role
            </span>
            <span style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
              {current.roleInfo}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
