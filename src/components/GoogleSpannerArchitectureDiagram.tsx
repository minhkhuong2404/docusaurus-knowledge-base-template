import React, { useState } from 'react';

interface ComponentDetail {
  id: string;
  name: string;
  color: string;
  desc: string;
  underTheHood: string[];
}

const SPA_DETAILS: Record<string, ComponentDetail> = {
  ZONES: {
    id: 'ZONES',
    name: 'Multi-Region Zones',
    color: '#38bdf8',
    desc: 'Google Spanner replicates data across multiple physical zones (e.g. Zone A, Zone B, Zone C) to ensure high resilience and data redundancy.',
    underTheHood: [
      'Each zone runs its own set of directory servers (spanservers) containing directory subsets.',
      'Replication spans are distributed to achieve global physical isolation.',
      'If an entire region/zone experiences a blackout, remaining zones take over seamlessly.',
    ],
  },
  PAXOS_GROUP: {
    id: 'PAXOS_GROUP',
    name: 'Paxos Replication Group',
    color: '#34d399',
    desc: 'A Paxos replication group is formed by spans across different zones to agree on every transaction sequence.',
    underTheHood: [
      'Each span in the replication group has a Paxos replica.',
      'Transactions must be agreed upon by a majority quorum of zones.',
      'One replica is elected as the Paxos Leader, which coordinates writes.',
    ],
  },
  TRUETIME: {
    id: 'TRUETIME',
    name: 'TrueTime API (Atomic Clocks)',
    color: '#fbbf24',
    desc: 'TrueTime API provides synchronized atomic clock times globally with a bounded uncertainty window [t.earliest, t.latest].',
    underTheHood: [
      'Uses GPS receivers combined with independent Rubidium atomic clocks in each data center.',
      'Guarantees monotonically increasing transactional timestamps across zones.',
      'Eliminates lock contention for read-only transactions, matching CP invariants at low latency.',
    ],
  },
};

export default function GoogleSpannerArchitectureDiagram(): React.JSX.Element {
  const [activeId, setActiveId] = useState<string>('TRUETIME');

  const active = SPA_DETAILS[activeId];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="6 2 18 2 18 6 6 6 6 2"/>
          <rect x="3" y="6" width="18" height="16" rx="2"/>
          <line x1="10" y1="12" x2="14" y2="12"/>
        </svg>
        <span style={{ color: '#34d399' }}>Google Spanner (CP) Architecture Layout</span>
      </div>

      <style>{`
        .spanner-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .spanner-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="spanner-grid">
        
        {/* SVG Pipeline */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 350 200" className="interactive-diagram-svg">
            {/* Zones border wrapper */}
            <rect x="15" y="20" width="320" height="110" rx="8" fill="rgba(56,189,248,0.03)" stroke="rgba(56,189,248,0.15)" strokeWidth="1" onClick={() => setActiveId('ZONES')} style={{ cursor: 'pointer' }} />
            <text x="30" y="32" fill="#38bdf8" fontSize="7" fontWeight="bold">Zones Boundaries</text>

            {/* Zone A */}
            <g onClick={() => setActiveId('ZONES')} style={{ cursor: 'pointer' }}>
              <rect x="25" y="45" width="80" height="70" rx="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              <text x="65" y="58" textAnchor="middle" fill="#94a3b8" fontSize="7" fontWeight="bold">Zone A</text>
              <rect x="35" y="70" width="60" height="35" rx="3" fill="rgba(15,23,42,0.8)" stroke="#cbd5e1" strokeWidth="1" />
              <text x="65" y="82" textAnchor="middle" fill="#e2e8f0" fontSize="6.5">Spans (A)</text>
              <text x="65" y="93" textAnchor="middle" fill="#64748b" fontSize="5.5">Paxos Replica</text>
            </g>

            {/* Zone B */}
            <g onClick={() => setActiveId('ZONES')} style={{ cursor: 'pointer' }}>
              <rect x="135" y="45" width="80" height="70" rx="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              <text x="175" y="58" textAnchor="middle" fill="#94a3b8" fontSize="7" fontWeight="bold">Zone B</text>
              <rect x="145" y="70" width="60" height="35" rx="3" fill="rgba(52,211,153,0.15)" stroke="#34d399" strokeWidth="1.5" />
              <text x="175" y="82" textAnchor="middle" fill="#34d399" fontSize="6.5" fontWeight="bold">Spans (B)</text>
              <text x="175" y="93" textAnchor="middle" fill="#34d399" fontSize="5.5" fontWeight="black">⭐ LEADER</text>
            </g>

            {/* Zone C */}
            <g onClick={() => setActiveId('ZONES')} style={{ cursor: 'pointer' }}>
              <rect x="245" y="45" width="80" height="70" rx="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              <text x="285" y="58" textAnchor="middle" fill="#94a3b8" fontSize="7" fontWeight="bold">Zone C</text>
              <rect x="255" y="70" width="60" height="35" rx="3" fill="rgba(15,23,42,0.8)" stroke="#cbd5e1" strokeWidth="1" />
              <text x="285" y="82" textAnchor="middle" fill="#e2e8f0" fontSize="6.5">Spans (C)</text>
              <text x="285" y="93" textAnchor="middle" fill="#64748b" fontSize="5.5">Paxos Replica</text>
            </g>

            {/* Paxos replication group connections */}
            <path d="M 65 105 C 105 130, 245 130, 285 105" fill="none" stroke="#34d399" strokeWidth="1.2" strokeDasharray="3 3" onClick={() => setActiveId('PAXOS_GROUP')} style={{ cursor: 'pointer' }} />
            <text x="175" y="132" textAnchor="middle" fill="#34d399" fontSize="7" fontWeight="bold" onClick={() => setActiveId('PAXOS_GROUP')} style={{ cursor: 'pointer' }}>Paxos Consensus Ring</text>

            {/* TrueTime API Engine block */}
            <g onClick={() => setActiveId('TRUETIME')} style={{ cursor: 'pointer' }}>
              <rect x="15" y="145" width="320" height="35" rx="5" fill="rgba(251,191,36,0.08)" stroke="#fbbf24" strokeWidth="1.2" />
              <text x="175" y="160" textAnchor="middle" fill="#fbbf24" fontSize="8" fontWeight="bold">TrueTime API: Atomic Clocks + GPS Synced Time</text>
              <text x="175" y="172" textAnchor="middle" fill="#94a3b8" fontSize="6.5" fontStyle="italic">Provides global linearizable timestamps [t.earliest, t.latest]</text>
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
              Architecture Details
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
