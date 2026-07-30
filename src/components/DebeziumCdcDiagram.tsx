import React, { useState } from 'react';

interface CdcComponent {
  id: string;
  title: string;
  role: string;
  color: string;
  details: string[];
}

const COMPONENTS: Record<string, CdcComponent> = {
  APP: {
    id: 'APP',
    title: 'Application Service',
    role: 'Saves business data and triggers event logging.',
    color: '#38bdf8',
    details: [
      'Executes SQL: INSERT INTO orders(...) AND INSERT INTO outbox_events(...).',
      'Both inserts share a single ACID database transaction context.',
      'Only writes to PostgreSQL; no direct network request is made to the message broker.',
    ],
  },
  WAL: {
    id: 'WAL',
    title: 'PostgreSQL WAL (Write-Ahead Log)',
    role: 'PostgreSQL\'s append-only transaction log containing binary state changes.',
    color: '#34d399',
    details: [
      'Configured with wal_level = logical for replica extraction.',
      'Guarantees order of operations exactly as they were committed.',
      'Bypasses query plans — writes are immediately appended to disk.',
    ],
  },
  DEBEZIUM: {
    id: 'DEBEZIUM',
    title: 'Debezium PG Connector',
    role: 'Tails the database WAL stream using a logical replication slot.',
    color: '#fbbf24',
    details: [
      'Runs as a source connector inside Kafka Connect framework.',
      'Maintains replication slot state to track LSN (Log Sequence Number).',
      'Extracts inserts to outbox_events and formats them as standard JSON events.',
    ],
  },
  ROUTER: {
    id: 'ROUTER',
    title: 'Debezium Outbox Event Router',
    role: 'A Single Message Transform (SMT) that intercepts and routes events.',
    color: '#a78bfa',
    details: [
      'Reads fields: payload, event_type, aggregate_type, and topic.',
      'Dynamically rewrites the target topic name based on aggregate_type.',
      'Extracts the payload body, discarding metadata wrapper fields.',
    ],
  },
  KAFKA: {
    id: 'KAFKA',
    title: 'Kafka Broker Partitions',
    role: 'Distributes and persists the routed event messages.',
    color: '#f472b6',
    details: [
      'Topic target automatically mapped (e.g. order-events).',
      'Uses aggregate_id as the message key to guarantee partition-level ordering.',
      'Retains messages based on configured compaction/retention rules.',
    ],
  },
};

export default function DebeziumCdcDiagram(): React.JSX.Element {
  const [selectedComp, setSelectedComp] = useState<string>('DEBEZIUM');

  const active = COMPONENTS[selectedComp];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span>PostgreSQL WAL to Kafka CDC Pipeline</span>
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
          <svg viewBox="0 0 350 280" className="interactive-diagram-svg">
            <defs>
              <marker id="cdc-arr-default" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(148,163,184,0.25)" />
              </marker>
              <marker id="cdc-arr-cyan" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
              </marker>
              <marker id="cdc-arr-green" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34d399" />
              </marker>
              <marker id="cdc-arr-yellow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fbbf24" />
              </marker>
              <marker id="cdc-arr-purple" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a78bfa" />
              </marker>
            </defs>

            {/* Paths */}
            {/* App -> WAL */}
            <path id="e-app-wal" d="M 80 56 L 80 108" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5"
                  markerEnd={selectedComp === 'APP' || selectedComp === 'WAL' ? 'url(#cdc-arr-cyan)' : 'url(#cdc-arr-default)'}
                  className={selectedComp === 'APP' || selectedComp === 'WAL' ? 'interactive-diagram-flowing-path active-path-cyan' : ''} />
            {selectedComp === 'APP' && (
              <circle r="3" fill="#38bdf8" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#e-app-wal" />
                </animateMotion>
              </circle>
            )}

            {/* WAL -> Debezium */}
            <path id="e-wal-deb" d="M 146 140 L 198 140" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5"
                  markerEnd={selectedComp === 'WAL' || selectedComp === 'DEBEZIUM' ? 'url(#cdc-arr-green)' : 'url(#cdc-arr-default)'}
                  className={selectedComp === 'WAL' || selectedComp === 'DEBEZIUM' ? 'interactive-diagram-flowing-path active-path-green' : ''} />
            {selectedComp === 'WAL' && (
              <circle r="3" fill="#34d399" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1.2s" repeatCount="indefinite">
                  <mpath href="#e-wal-deb" />
                </animateMotion>
              </circle>
            )}

            {/* Debezium -> Router */}
            <path id="e-deb-rot" d="M 270 166 L 270 188" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5"
                  markerEnd={selectedComp === 'DEBEZIUM' || selectedComp === 'ROUTER' ? 'url(#cdc-arr-yellow)' : 'url(#cdc-arr-default)'}
                  className={selectedComp === 'DEBEZIUM' || selectedComp === 'ROUTER' ? 'interactive-diagram-flowing-path active-path-yellow' : ''} />
            {selectedComp === 'DEBEZIUM' && (
              <circle r="3" fill="#fbbf24" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#e-deb-rot" />
                </animateMotion>
              </circle>
            )}

            {/* Router -> Kafka */}
            <path id="e-rot-kaf" d="M 204 220 L 152 220" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5"
                  markerEnd={selectedComp === 'ROUTER' || selectedComp === 'KAFKA' ? 'url(#cdc-arr-purple)' : 'url(#cdc-arr-default)'}
                  className={selectedComp === 'ROUTER' || selectedComp === 'KAFKA' ? 'interactive-diagram-flowing-path active-path-purple' : ''} />
            {selectedComp === 'ROUTER' && (
              <circle r="3" fill="#a78bfa" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1.2s" repeatCount="indefinite">
                  <mpath href="#e-rot-kaf" />
                </animateMotion>
              </circle>
            )}

            {/* Application Node */}
            <g onClick={() => setSelectedComp('APP')} style={{ cursor: 'pointer' }}>
              <rect x="20" y="20" width="120" height="30" rx="6"
                    fill={selectedComp === 'APP' ? 'rgba(56,189,248,0.15)' : 'rgba(15,23,42,0.6)'}
                    stroke={selectedComp === 'APP' ? '#38bdf8' : 'rgba(255,255,255,0.08)'} strokeWidth="1.5" style={{ transition: 'all 0.2s' }} />
              <text x="80" y="38" textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="800">
                Application Service
              </text>
            </g>

            {/* WAL Node */}
            <g onClick={() => setSelectedComp('WAL')} style={{ cursor: 'pointer' }}>
              <rect x="20" y="120" width="120" height="40" rx="6"
                    fill={selectedComp === 'WAL' ? 'rgba(52,211,153,0.15)' : 'rgba(15,23,42,0.6)'}
                    stroke={selectedComp === 'WAL' ? '#34d399' : 'rgba(255,255,255,0.08)'} strokeWidth="1.5" style={{ transition: 'all 0.2s' }} />
              <text x="80" y="140" textAnchor="middle" fill="#34d399" fontSize="9.5" fontWeight="800">
                PostgreSQL WAL
              </text>
              <text x="80" y="151" textAnchor="middle" fill="#475569" fontSize="7" fontStyle="italic">
                wal_level = logical
              </text>
            </g>

            {/* Debezium Node */}
            <g onClick={() => setSelectedComp('DEBEZIUM')} style={{ cursor: 'pointer' }}>
              <rect x="210" y="120" width="120" height="40" rx="6"
                    fill={selectedComp === 'DEBEZIUM' ? 'rgba(251,191,36,0.15)' : 'rgba(15,23,42,0.6)'}
                    stroke={selectedComp === 'DEBEZIUM' ? '#fbbf24' : 'rgba(255,255,255,0.08)'} strokeWidth="1.5" style={{ transition: 'all 0.2s' }} />
              <text x="270" y="140" textAnchor="middle" fill="#fbbf24" fontSize="9.5" fontWeight="800">
                Debezium Connector
              </text>
              <text x="270" y="151" textAnchor="middle" fill="#475569" fontSize="7" fontStyle="italic">
                Kafka Connect Source
              </text>
            </g>

            {/* Outbox SMT Router Node */}
            <g onClick={() => setSelectedComp('ROUTER')} style={{ cursor: 'pointer' }}>
              <rect x="210" y="200" width="120" height="40" rx="6"
                    fill={selectedComp === 'ROUTER' ? 'rgba(167,135,250,0.15)' : 'rgba(15,23,42,0.6)'}
                    stroke={selectedComp === 'ROUTER' ? '#a78bfa' : 'rgba(255,255,255,0.08)'} strokeWidth="1.5" style={{ transition: 'all 0.2s' }} />
              <text x="270" y="220" textAnchor="middle" fill="#a78bfa" fontSize="9.5" fontWeight="800">
                EventRouter SMT
              </text>
              <text x="270" y="231" textAnchor="middle" fill="#475569" fontSize="7" fontStyle="italic">
                Extracts &amp; Routes topic
              </text>
            </g>

            {/* Kafka Broker Node */}
            <g onClick={() => setSelectedComp('KAFKA')} style={{ cursor: 'pointer' }}>
              <rect x="20" y="200" width="120" height="40" rx="6"
                    fill={selectedComp === 'KAFKA' ? 'rgba(244,114,182,0.15)' : 'rgba(15,23,42,0.6)'}
                    stroke={selectedComp === 'KAFKA' ? '#f472b6' : 'rgba(255,255,255,0.08)'} strokeWidth="1.5" style={{ transition: 'all 0.2s' }} />
              <text x="80" y="220" textAnchor="middle" fill="#f472b6" fontSize="9.5" fontWeight="800">
                Kafka Topic Partitions
              </text>
              <text x="80" y="231" textAnchor="middle" fill="#475569" fontSize="7" fontStyle="italic">
                order-events topic
              </text>
            </g>

            <text x="175" y="268" style={{ fontFamily: 'Inter', fontSize: 8.5, fill: '#475569', textAnchor: 'middle', fontStyle: 'italic' }}>
              💡 Click on components to inspect their WAL configurations.
            </text>
          </svg>
        </div>

        {/* Info card */}
        <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${active.color}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="interactive-diagram-card-header">
            <h3 style={{ color: active.color }}>{active.title}</h3>
          </div>
          <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', margin: 0 }}>
            {active.role}
          </p>
          <ul style={{ margin: 0, paddingLeft: '14px' }}>
            {active.details.map((detail, idx) => (
              <li key={idx} style={{ fontSize: '11px', color: 'var(--ifm-color-content)', marginBottom: '4px', lineHeight: 1.4 }}>
                {detail}
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}
