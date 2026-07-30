import React, { useState } from 'react';

type PartitionState = 'NORMAL' | 'PARTITION_CP' | 'PARTITION_AP';

export default function CapNetworkPartitionDiagram(): React.JSX.Element {
  const [state, setState] = useState<PartitionState>('NORMAL');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="2" ry="2"/>
          <line x1="12" y1="2" x2="12" y2="22"/>
        </svg>
        <span style={{ color: '#34d399' }}>CAP Network Partition Simulator</span>
      </div>

      {/* Controller Buttons */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
        {(['NORMAL', 'PARTITION_CP', 'PARTITION_AP'] as PartitionState[]).map(s => (
          <button
            key={s}
            onClick={() => setState(s)}
            style={{
              padding: '6px 12px', borderRadius: '8px', border: 'none',
              cursor: 'pointer', fontWeight: 700, fontSize: '11px',
              background: state === s ? 'rgba(56,189,248,0.15)' : 'transparent',
              color: state === s ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
              border: `1px solid ${state === s ? '#38bdf850' : 'transparent'}`,
              transition: 'all 0.2s',
            }}
          >
            {s === 'NORMAL' ? '1. Normal (No Partition)' : s === 'PARTITION_CP' ? '2. Partition: CP Behavior' : '3. Partition: AP Behavior'}
          </button>
        ))}
      </div>

      <style>{`
        .partition-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .partition-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="partition-grid">
        
        {/* SVG Canvas */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 350 210" className="interactive-diagram-svg">
            <defs>
              <marker id="part-arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(148,163,184,0.3)" />
              </marker>
              <marker id="part-arr-color" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#ef4444" />
              </marker>
            </defs>

            {/* Replication Link between Node A and Node B */}
            {state === 'NORMAL' ? (
              <g>
                <path d="M 90 95 L 250 95" stroke="#34d399" strokeWidth="2" strokeDasharray="3 3" className="interactive-diagram-flowing-path active-path-green" />
                <text x="175" y="87" textAnchor="middle" fill="#34d399" fontSize="7.5" fontWeight="bold">Sync Replication Active</text>
              </g>
            ) : (
              <g>
                {/* Partitioned link */}
                <path d="M 90 95 L 250 95" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2 2" />
                {/* Bolt / Partition line */}
                <path d="M 165 75 L 185 115" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
                <path d="M 185 75 L 165 115" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
                <text x="175" y="65" textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="bold">⚡ PARTITIONED</text>
              </g>
            )}

            {/* Node A (Payment DB Region 1) */}
            <g>
              <rect x="25" y="70" width="70" height="50" rx="6" fill="rgba(56,189,248,0.1)" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="60" y="88" textAnchor="middle" fill="#38bdf8" fontSize="9.5" fontWeight="bold">Node A</text>
              <text x="60" y="105" textAnchor="middle" fill="#cbd5e1" fontSize="8" fontFamily="monospace">
                {state === 'NORMAL' ? 'Val: v1' : 'Val: v2 (Write)'}
              </text>
            </g>

            {/* Node B (Payment DB Region 2) */}
            <g>
              <rect x="255" y="70" width="70" height="50" rx="6" fill="rgba(167,135,250,0.1)" stroke="#a78bfa" strokeWidth="1.5" />
              <text x="290" y="88" textAnchor="middle" fill="#a78bfa" fontSize="9.5" fontWeight="bold">Node B</text>
              <text x="290" y="105" textAnchor="middle" fill="#cbd5e1" fontSize="8" fontFamily="monospace">
                {state === 'NORMAL' ? 'Val: v1' : state === 'PARTITION_CP' ? 'Val: v1' : 'Val: v1 (Stale)'}
              </text>
            </g>

            {/* Client (reads from nodes) */}
            <g>
              <rect x="135" y="155" width="80" height="30" rx="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
              <text x="175" y="174" textAnchor="middle" fill="#cbd5e1" fontSize="8.5" fontWeight="bold">Client API</text>
            </g>

            {/* Arrows from Client to nodes */}
            {state === 'PARTITION_CP' ? (
              <g>
                <path d="M 145 155 L 75 125" fill="none" stroke="#ef4444" strokeWidth="1.5" markerEnd="url(#part-arr-color)" />
                <text x="90" y="150" fill="#ef4444" fontSize="7" fontWeight="bold">❌ ERROR</text>
              </g>
            ) : (
              <g>
                <path d="M 145 155 L 75 125" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.2" markerEnd="url(#part-arr)" />
                <text x="90" y="150" fill="#34d399" fontSize="7" fontWeight="bold">
                  {state === 'NORMAL' ? 'Read v1' : 'Write v2'}
                </text>
              </g>
            )}

            {state === 'PARTITION_AP' ? (
              <g>
                <path d="M 205 155 L 275 125" fill="none" stroke="#fbbf24" strokeWidth="1.5" markerEnd="url(#part-arr)" />
                <text x="260" y="150" fill="#fbbf24" fontSize="7" fontWeight="bold">Read v1 ⚠️</text>
              </g>
            ) : (
              <path d="M 205 155 L 275 125" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.2" markerEnd="url(#part-arr)" />
            )}
          </svg>
        </div>

        {/* Info panel */}
        <div className="interactive-diagram-details-card" style={{
          borderLeft: `4px solid ${state === 'NORMAL' ? '#34d399' : state === 'PARTITION_CP' ? '#ef4444' : '#fbbf24'}`,
          display: 'flex', flexDirection: 'column', gap: '8px'
        }}>
          
          <div>
            <h4 style={{ margin: 0, fontSize: '12px', color: state === 'NORMAL' ? '#34d399' : state === 'PARTITION_CP' ? '#ef4444' : '#fbbf24' }}>
              {state === 'NORMAL' ? 'Steady State Operation' : state === 'PARTITION_CP' ? 'CP: Choose Consistency, Sacrifice Avail' : 'AP: Choose Availability, Sacrifice Consistency'}
            </h4>
          </div>

          <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', lineHeight: 1.45 }}>
            {state === 'NORMAL' && 'All nodes communicate correctly. Database updates are replicated synchronously. Client is served the latest values with full availability.'}
            {state === 'PARTITION_CP' && 'Network link is partitioned. Node A cannot reach Node B. To ensure strict data consistency, Node A rejects writes or reads (returns an error) until quorum can be verified.'}
            {state === 'PARTITION_AP' && 'Network link is partitioned. Node A continues to accept writes (Value: v2). Client reads from Node B and gets the old value (Value: v1), maintaining availability but serving stale data.'}
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.02)',
            borderLeft: `3px solid ${state === 'NORMAL' ? '#34d399' : state === 'PARTITION_CP' ? '#ef4444' : '#fbbf24'}`,
            borderRadius: '4px',
            padding: '6px 8px',
            fontSize: '11px',
          }}>
            <span style={{ fontWeight: 'bold', color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.05em', marginBottom: '2px' }}>
              System Resolution Action
            </span>
            <span style={{ color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
              {state === 'NORMAL' && 'Replication latency is minimal. Consistency is guaranteed at low read cost.'}
              {state === 'PARTITION_CP' && 'Return HTTP 500 or timeout. Fail transaction fast to keep ledger records correct.'}
              {state === 'PARTITION_AP' && 'Return stale data immediately. Resolve divergence asynchronously (e.g. read-repair or active anti-entropy) once partition heals.'}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
