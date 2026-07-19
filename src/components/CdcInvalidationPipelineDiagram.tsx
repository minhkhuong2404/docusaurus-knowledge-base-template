import React, { useState } from 'react';

interface Stage {
  id: string;
  name: string;
  color: string;
  desc: string;
  techInfo: string;
}

const STAGES: Stage[] = [
  {
    id: 'COMMIT',
    name: '1. DB Commit',
    color: '#38bdf8',
    desc: 'Application writes to database. Transaction commits successfully.',
    techInfo: 'Application is unblocked immediately; no cache-writing operations pollute the application code path.',
  },
  {
    id: 'WAL',
    name: '2. WAL Log',
    color: '#a78bfa',
    desc: 'Database appends the committed row changes to its local Write-Ahead Log (WAL).',
    techInfo: 'E.g., PostgreSQL pg_wal or MySQL Binlog. Serves as the ultimate source of physical truth.',
  },
  {
    id: 'DEBEZIUM',
    name: '3. Debezium Poll',
    color: '#fbbf24',
    desc: 'Debezium connector reads the tail of the database WAL asynchronously.',
    techInfo: 'Uses DB native streaming replication protocols (e.g. pgoutput) to capture modifications with zero querying overhead.',
  },
  {
    id: 'KAFKA',
    name: '4. Kafka Event',
    color: '#f472b6',
    desc: 'Debezium publishes row change events to a structured Kafka topic (e.g. database.updates).',
    techInfo: 'Durable event log preserves event sequences and allows multiple downstream consumers to scale independently.',
  },
  {
    id: 'WORKER',
    name: '5. Invalidation Worker',
    color: '#34d399',
    desc: 'Worker consumes Kafka events and translates row IDs into corresponding Redis cache keys.',
    techInfo: 'Fires eviction command: redis.del("user:" + rowId). Safely filters duplicate events.',
  },
];

export default function CdcInvalidationPipelineDiagram(): React.JSX.Element {
  const [activeStage, setActiveStage] = useState<string>('DEBEZIUM');

  const current = STAGES.find(s => s.id === activeStage) || STAGES[2];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span style={{ color: '#34d399' }}>CDC-Based Cache Invalidation Pipeline</span>
      </div>

      <style>{`
        .cdc-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .cdc-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="cdc-grid">
        
        {/* SVG Pipeline Graph */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 350 200" className="interactive-diagram-svg">
            <defs>
              <marker id="cdc-arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(148,163,184,0.3)" />
              </marker>
              <marker id="cdc-arr-color" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={current.color} />
              </marker>
            </defs>

            {/* Connecting paths */}
            <path d="M 45 60 L 105 60" fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth="1.5" markerEnd="url(#cdc-arr)" />
            <path d="M 155 60 L 215 60" fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth="1.5" markerEnd="url(#cdc-arr)" />
            <path d="M 265 60 L 265 110 L 85 110 L 85 135" fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth="1.5" markerEnd="url(#cdc-arr)" />
            <path d="M 135 150 L 195 150" fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth="1.5" markerEnd="url(#cdc-arr)" />

            {/* Stages circles/nodes */}
            {/* DB Commit */}
            <g onClick={() => setActiveStage('COMMIT')} style={{ cursor: 'pointer' }}>
              <rect x="15" y="40" width="30" height="40" rx="3" fill={activeStage === 'COMMIT' ? 'rgba(56,189,248,0.15)' : 'rgba(15,23,42,0.8)'} stroke="#38bdf8" strokeWidth={activeStage === 'COMMIT' ? '2' : '1'} />
              <text x="30" y="63" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="bold">DB</text>
            </g>

            {/* WAL */}
            <g onClick={() => setActiveStage('WAL')} style={{ cursor: 'pointer' }}>
              <rect x="110" y="40" width="45" height="40" rx="3" fill={activeStage === 'WAL' ? 'rgba(167,135,250,0.15)' : 'rgba(15,23,42,0.8)'} stroke="#a78bfa" strokeWidth={activeStage === 'WAL' ? '2' : '1'} />
              <text x="132.5" y="63" textAnchor="middle" fill="#a78bfa" fontSize="8" fontWeight="bold">WAL</text>
            </g>

            {/* Debezium */}
            <g onClick={() => setActiveStage('DEBEZIUM')} style={{ cursor: 'pointer' }}>
              <rect x="220" y="40" width="45" height="40" rx="3" fill={activeStage === 'DEBEZIUM' ? 'rgba(251,191,36,0.15)' : 'rgba(15,23,42,0.8)'} stroke="#fbbf24" strokeWidth={activeStage === 'DEBEZIUM' ? '2' : '1'} />
              <text x="242.5" y="63" textAnchor="middle" fill="#fbbf24" fontSize="8" fontWeight="bold">CDC</text>
            </g>

            {/* Kafka */}
            <g onClick={() => setActiveStage('KAFKA')} style={{ cursor: 'pointer' }}>
              <rect x="60" y="130" width="55" height="40" rx="3" fill={activeStage === 'KAFKA' ? 'rgba(244,114,182,0.15)' : 'rgba(15,23,42,0.8)'} stroke="#f472b6" strokeWidth={activeStage === 'KAFKA' ? '2' : '1'} />
              <text x="87.5" y="153" textAnchor="middle" fill="#f472b6" fontSize="7.5" fontWeight="bold">Kafka</text>
            </g>

            {/* Worker */}
            <g onClick={() => setActiveStage('WORKER')} style={{ cursor: 'pointer' }}>
              <rect x="200" y="130" width="55" height="40" rx="3" fill={activeStage === 'WORKER' ? 'rgba(52,211,153,0.15)' : 'rgba(15,23,42,0.8)'} stroke="#34d399" strokeWidth={activeStage === 'WORKER' ? '2' : '1'} />
              <text x="227.5" y="153" textAnchor="middle" fill="#34d399" fontSize="7.5" fontWeight="bold">Worker</text>
            </g>

            {/* Redis Cache Box Destination */}
            <g>
              <rect x="285" y="130" width="45" height="40" rx="3" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <text x="307.5" y="153" textAnchor="middle" fill="#94a3b8" fontSize="7.5">Redis</text>
            </g>
            <path d="M 255 150 L 277 150" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.2" markerEnd="url(#cdc-arr)" />

            <text x="175" y="190" textAnchor="middle" fill="#475569" fontSize="8" fontStyle="italic">
              💡 Click any pipeline node to view details.
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
              Under the Hood Technology
            </span>
            <span style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
              {current.techInfo}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
