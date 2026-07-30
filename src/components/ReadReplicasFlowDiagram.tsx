import React, { useState } from 'react';

type Mode = 'STEADY' | 'LAG_TRAP' | 'LAG_SHIELD';

export default function ReadReplicasFlowDiagram(): React.JSX.Element {
  const [mode, setMode] = useState<Mode>('STEADY');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 16 12 12 8 16"/>
          <line x1="12" y1="12" x2="12" y2="21"/>
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
          <polyline points="16 16 12 12 8 16"/>
        </svg>
        <span style={{ color: '#34d399' }}>Read Replicas Replication &amp; Lag Shielding Simulator</span>
      </div>

      {/* Mode controls */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
        {(['STEADY', 'LAG_TRAP', 'LAG_SHIELD'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: '6px 12px', borderRadius: '8px', border: 'none',
              cursor: 'pointer', fontWeight: 700, fontSize: '11px',
              background: mode === m ? 'rgba(56,189,248,0.15)' : 'transparent',
              color: mode === m ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
              border: `1px solid ${mode === m ? '#38bdf850' : 'transparent'}`,
              transition: 'all 0.2s',
            }}
          >
            {m === 'STEADY' ? '1. Normal Replication' : m === 'LAG_TRAP' ? '2. Replica Lag (Stale Read Trap)' : '3. Lag Shielding (Primary Session Routing)'}
          </button>
        ))}
      </div>

      <style>{`
        .rep-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .rep-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="rep-grid">
        
        {/* SVG Viewport */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 350 200" className="interactive-diagram-svg">
            <defs>
              <marker id="rep-arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(148,163,184,0.3)" />
              </marker>
              <marker id="rep-arr-green" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34d399" />
              </marker>
              <marker id="rep-arr-red" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#ef4444" />
              </marker>
            </defs>

            {/* App server node */}
            <g>
              <rect x="135" y="20" width="80" height="35" rx="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <text x="175" y="42" textAnchor="middle" fill="#cbd5e1" fontSize="8.5" fontWeight="bold">Application</text>
            </g>

            {/* Primary DB */}
            <g>
              <rect x="25" y="110" width="70" height="50" rx="5" fill="rgba(52,211,153,0.1)" stroke="#34d399" strokeWidth="1.5" />
              <text x="60" y="130" textAnchor="middle" fill="#34d399" fontSize="9" fontWeight="bold">Primary DB</text>
              <text x="60" y="145" textAnchor="middle" fill="#cbd5e1" fontSize="8" fontFamily="monospace">
                {mode === 'STEADY' ? 'Val: v2' : 'Val: v2 (Write)'}
              </text>
            </g>

            {/* Read Replica DB */}
            <g>
              <rect x="255" y="110" width="70" height="50" rx="5" fill="rgba(56,189,248,0.1)" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="290" y="130" textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="bold">Replica DB</text>
              <text x="290" y="145" textAnchor="middle" fill="#cbd5e1" fontSize="8" fontFamily="monospace">
                {mode === 'STEADY' ? 'Val: v2' : mode === 'LAG_TRAP' ? 'Val: v1 (Lag)' : 'Val: v1 (Lagging)'}
              </text>
            </g>

            {/* Application connections */}
            {/* App to Primary (Write path) */}
            <path d="M 140 55 L 75 105" fill="none" stroke="#34d399" strokeWidth="1.5" className="interactive-diagram-flowing-path active-path-green" markerEnd="url(#rep-arr-green)" />
            <text x="80" y="75" fill="#34d399" fontSize="7" fontWeight="bold">Write v2</text>

            {/* App to Replica (Read path) */}
            {mode === 'LAG_SHIELD' ? (
              <g>
                {/* Shield: Read bypassed to Primary */}
                <path d="M 145 55 Q 115 85 95 108" fill="none" stroke="#34d399" strokeWidth="1.5" className="interactive-diagram-flowing-path active-path-green" markerEnd="url(#rep-arr-green)" />
                <text x="145" y="88" fill="#34d399" fontSize="6.5" fontWeight="bold">Read v2 (Shielded)</text>
              </g>
            ) : (
              <g>
                <path d="M 210 55 L 275 105" fill="none" stroke={mode === 'LAG_TRAP' ? '#ef4444' : 'rgba(148,163,184,0.4)'} strokeWidth="1.2" markerEnd={mode === 'LAG_TRAP' ? 'url(#rep-arr-red)' : 'url(#rep-arr)'} />
                <text x="260" y="75" fill={mode === 'LAG_TRAP' ? '#ef4444' : '#cbd5e1'} fontSize="7" fontWeight="bold">
                  {mode === 'STEADY' ? 'Read v2' : 'Read v1 ❌'}
                </text>
              </g>
            )}

            {/* WAL Replication pipeline */}
            {mode === 'STEADY' ? (
              <g>
                <path d="M 95 135 L 250 135" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" className="interactive-diagram-flowing-path" />
                <text x="172.5" y="127" textAnchor="middle" fill="#38bdf8" fontSize="7">WAL Replication active</text>
              </g>
            ) : (
              <g>
                <path d="M 95 135 L 250 135" fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="2 2" />
                <text x="172.5" y="127" textAnchor="middle" fill="#ef4444" fontSize="7" fontWeight="bold">Lag delay (+2s) ⏳</text>
              </g>
            )}
          </svg>
        </div>

        {/* Details Card */}
        <div className="interactive-diagram-details-card" style={{
          borderLeft: `4px solid ${mode === 'STEADY' ? '#34d399' : mode === 'LAG_TRAP' ? '#ef4444' : '#fbbf24'}`,
          display: 'flex', flexDirection: 'column', gap: '8px'
        }}>
          
          <div>
            <h4 style={{ margin: 0, fontSize: '12px', color: mode === 'STEADY' ? '#34d399' : mode === 'LAG_TRAP' ? '#ef4444' : '#fbbf24' }}>
              {mode === 'STEADY' ? 'Consistency Maintained' : mode === 'LAG_TRAP' ? 'Replication Lag Trap' : 'Primary Session Shield'}
            </h4>
          </div>

          <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', lineHeight: 1.45 }}>
            {mode === 'STEADY' && 'Replication lag is minimal (<10ms). The update committed on the primary propagates quickly. Readers querying the replica receive the fresh value immediately.'}
            {mode === 'LAG_TRAP' && 'Application writes value to primary, but replication lag stalls. Immediately afterward, user refreshes page and reads from replica — obtaining stale value (v1), creating a ghost bug.'}
            {mode === 'LAG_SHIELD' && 'Application tracks recently written sessions. For 2-5 seconds following a write, reads from that session are forced to the primary database, bypassing lagging replicas.'}
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.02)',
            borderLeft: `3px solid ${mode === 'STEADY' ? '#34d399' : mode === 'LAG_TRAP' ? '#ef4444' : '#fbbf24'}`,
            borderRadius: '4px',
            padding: '6px 8px',
            fontSize: '11px',
          }}>
            <span style={{ fontWeight: 'bold', color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.05em', marginBottom: '2px' }}>
              Consistency Result
            </span>
            <span style={{ color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
              {mode === 'STEADY' && 'Linearizable read-your-own-writes (RYOW) is satisfied under low load.'}
              {mode === 'LAG_TRAP' && 'User interface displays stale data; inconsistency causes support tickets.'}
              {mode === 'LAG_SHIELD' && 'Guarantees RYOW consistency for active writers, offloading cold reads.'}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
