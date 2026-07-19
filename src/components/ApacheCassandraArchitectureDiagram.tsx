import React, { useState } from 'react';

interface ComponentDetail {
  id: string;
  name: string;
  color: string;
  desc: string;
  underTheHood: string[];
}

const CAS_DETAILS: Record<string, ComponentDetail> = {
  MASTERLESS: {
    id: 'MASTERLESS',
    name: 'Masterless Ring (DHT)',
    color: '#fbbf24',
    desc: 'Cassandra uses a masterless structure where nodes are arranged in a ring using Consistent Hashing (Distributed Hash Table).',
    underTheHood: [
      'Nodes are assigned specific token ranges (e.g. Node 1 gets 0-33, Node 2 gets 34-66).',
      'A partition key is hashed to determine which node owns the primary data copy.',
      'No single point of failure (SPOF): any alive node can coordinate a read or write.',
    ],
  },
  GOSSIP: {
    id: 'GOSSIP',
    name: 'Gossip Protocol Mesh',
    color: '#a78bfa',
    desc: 'Nodes share state, health metadata, and topology information asynchronously via gossip protocols.',
    underTheHood: [
      'Every second, each node gossips with up to three random peers.',
      'Allows cluster to discover node additions, removals, and network splits dynamically.',
      'Uses accrual failure detector (Phi accrual) to adjust heartbeat timeouts dynamically.',
    ],
  },
  TUNABLE: {
    id: 'TUNABLE',
    name: 'Tunable Consistency (R+W > N)',
    color: '#34d399',
    desc: 'Provides flexible consistency policies depending on your speed and safety requirements.',
    underTheHood: [
      'N = Replication Factor (e.g. 3 copies).',
      'W = Write Quorum (e.g. ONE, QUORUM, ALL).',
      'R = Read Quorum. If R + W > N, strong consistency is guaranteed; otherwise, eventual consistency applies.',
    ],
  },
};

export default function ApacheCassandraArchitectureDiagram(): React.JSX.Element {
  const [activeId, setActiveId] = useState<string>('MASTERLESS');

  const active = CAS_DETAILS[activeId];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="2" x2="12" y2="22"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
        </svg>
        <span style={{ color: '#34d399' }}>Apache Cassandra (AP) Masterless Architecture</span>
      </div>

      <style>{`
        .cassandra-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .cassandra-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="cassandra-grid">
        
        {/* SVG Ring View */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 350 200" className="interactive-diagram-svg">
            {/* Gossip Connection Circle */}
            <circle cx="175" cy="100" r="55" fill="none" stroke="rgba(167,135,250,0.25)" strokeWidth="1.5" strokeDasharray="3 3" onClick={() => setActiveId('GOSSIP')} style={{ cursor: 'pointer' }} />
            <text x="175" y="104" textAnchor="middle" fill="#a78bfa" fontSize="7" fontWeight="bold" onClick={() => setActiveId('GOSSIP')} style={{ cursor: 'pointer' }}>Gossip Protocol Mesh</text>

            {/* Node 1 */}
            <g onClick={() => setActiveId('MASTERLESS')} style={{ cursor: 'pointer' }}>
              <circle cx="175" cy="40" r="22" fill="rgba(251,191,36,0.1)" stroke="#fbbf24" strokeWidth="1.5" />
              <text x="175" y="38" textAnchor="middle" fill="#fbbf24" fontSize="7.5" fontWeight="bold">Node 1</text>
              <text x="175" y="48" textAnchor="middle" fill="#94a3b8" fontSize="6">Token: 0-33</text>
            </g>

            {/* Node 2 */}
            <g onClick={() => setActiveId('MASTERLESS')} style={{ cursor: 'pointer' }}>
              <circle cx="120" cy="135" r="22" fill="rgba(251,191,36,0.1)" stroke="#fbbf24" strokeWidth="1.5" />
              <text x="120" y="133" textAnchor="middle" fill="#fbbf24" fontSize="7.5" fontWeight="bold">Node 2</text>
              <text x="120" y="143" textAnchor="middle" fill="#94a3b8" fontSize="6">Token: 34-66</text>
            </g>

            {/* Node 3 */}
            <g onClick={() => setActiveId('MASTERLESS')} style={{ cursor: 'pointer' }}>
              <circle cx="230" cy="135" r="22" fill="rgba(251,191,36,0.1)" stroke="#fbbf24" strokeWidth="1.5" />
              <text x="230" y="133" textAnchor="middle" fill="#fbbf24" fontSize="7.5" fontWeight="bold">Node 3</text>
              <text x="230" y="143" textAnchor="middle" fill="#94a3b8" fontSize="6">Token: 67-99</text>
            </g>

            {/* Tunable Consistency Slider / Config panel block indicator */}
            <g onClick={() => setActiveId('TUNABLE')} style={{ cursor: 'pointer' }}>
              <rect x="25" y="175" width="300" height="20" rx="4" fill="rgba(52,211,153,0.06)" stroke="#34d399" strokeWidth="1" />
              <text x="175" y="187" textAnchor="middle" fill="#34d399" fontSize="7.5" fontWeight="bold">Tunable consistency levels options: R + W &gt; N</text>
            </g>
          </svg>
        </div>

        {/* Info panel */}
        <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${active.color}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          <div>
            <h3 style={{ color: active.color }}>{active.name}</h3>
          </div>

          <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', margin: 0, lineHeight: 1.45 }}>
            {active.desc}
          </p>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
            <span style={{ fontWeight: 'bold', color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Under the Hood
            </span>
            <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '11px' }}>
              {active.underTheHood.map((line, idx) => (
                <li key={idx} style={{ color: 'var(--ifm-color-content-secondary)', marginBottom: '3.5px', lineHeight: 1.4 }}>
                  {line}
                </li>
              ))}
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
}
