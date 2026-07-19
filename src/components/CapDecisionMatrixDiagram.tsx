import React, { useState } from 'react';

interface Quadrant {
  id: string;
  name: string;
  strategy: string;
  color: string;
  downtimeCost: 'HIGH' | 'LOW';
  staleCost: 'HIGH' | 'LOW';
  useCases: string[];
  explanation: string;
}

const QUADRANTS: Quadrant[] = [
  {
    id: 'CP_BANKING',
    name: 'Strict CP System',
    strategy: 'Prioritize Consistency (CP)',
    color: '#ef4444',
    downtimeCost: 'HIGH',
    staleCost: 'HIGH',
    useCases: ['Banking Ledgers', 'Airline Seat Bookings', 'Inventory Reservations'],
    explanation: 'Downtime is costly, but serving stale data causes irreversible financial or operational damage (e.g. double booking or overdrafts). The system must reject writes/reads during partitions.',
  },
  {
    id: 'AP_SOCIAL',
    name: 'Strict AP System',
    strategy: 'Prioritize Availability (AP)',
    color: '#34d399',
    downtimeCost: 'LOW',
    staleCost: 'LOW',
    useCases: ['Social Feeds', 'Comment Threads', 'Recommendation Engines'],
    explanation: 'System availability is key for user engagement. Stale data (e.g. seeing a tweet 10 seconds late) is acceptable. The system accepts writes and reads on all alive nodes.',
  },
  {
    id: 'HYBRID_CART',
    name: 'Tunable Hybrid System',
    strategy: 'Tunable / Session Consistency',
    color: '#fbbf24',
    downtimeCost: 'HIGH',
    staleCost: 'LOW',
    useCases: ['E-Commerce Shopping Carts', 'User Profile Preferences', 'Collaborative Doc Editing'],
    explanation: 'High downtime is unacceptable, but users need consistent views of their own edits. Use Read-Your-Own-Writes session consistency: user sees their updates immediately, others catch up eventually.',
  },
];

export default function CapDecisionMatrixDiagram(): React.JSX.Element {
  const [activeId, setActiveId] = useState<string>('CP_BANKING');

  const current = QUADRANTS.find(q => q.id === activeId) || QUADRANTS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
          <line x1="15" y1="3" x2="15" y2="21"/>
          <line x1="3" y1="9" x2="21" y2="9"/>
          <line x1="3" y1="15" x2="21" y2="15"/>
        </svg>
        <span style={{ color: '#34d399' }}>Distributed System CAP Decision Framework</span>
      </div>

      <style>{`
        .matrix-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .matrix-grid {
            grid-template-columns: 1fr;
          }
        }
        .matrix-cell {
          background: rgba(15,23,42,0.6);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .matrix-cell:hover {
          background: rgba(255,255,255,0.02);
          border-color: rgba(255,255,255,0.12);
        }
      `}</style>

      <div className="matrix-grid">
        
        {/* Selector quadrant List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {QUADRANTS.map(q => {
            const isSelected = q.id === activeId;
            return (
              <div
                key={q.id}
                onClick={() => setActiveId(q.id)}
                className="matrix-cell"
                style={{
                  borderLeft: `4px solid ${isSelected ? q.color : 'rgba(255,255,255,0.1)'}`,
                  borderColor: isSelected ? q.color : 'rgba(255,255,255,0.06)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <span>Downtime Cost: {q.downtimeCost}</span>
                  <span>Stale Cost: {q.staleCost}</span>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: isSelected ? q.color : '#cbd5e1', marginTop: '2px' }}>
                  {q.name}
                </div>
                <div style={{ fontSize: '9.5px', color: 'var(--ifm-color-content-secondary)' }}>
                  {q.strategy}
                </div>
              </div>
            );
          })}
        </div>

        {/* Details Card */}
        <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${current.color}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          <div>
            <h3 style={{ color: current.color }}>{current.name}</h3>
            <span style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>
              {current.strategy}
            </span>
          </div>

          <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', margin: 0, lineHeight: 1.45 }}>
            {current.explanation}
          </p>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
            <span style={{ fontWeight: 'bold', color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Standard Production Use Cases
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {current.useCases.map((uc, idx) => (
                <span key={idx} style={{
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '9.5px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  color: 'var(--ifm-color-content)',
                }}>
                  {uc}
                </span>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
