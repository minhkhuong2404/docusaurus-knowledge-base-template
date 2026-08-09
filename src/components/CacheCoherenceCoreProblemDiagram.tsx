import React, { useState } from 'react';

type Mode = 'PROBLEM' | 'SOLUTION';

export default function CacheCoherenceCoreProblemDiagram(): React.JSX.Element {
  const [mode, setMode] = useState<Mode>('PROBLEM');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <span style={{ color: '#34d399' }}>L1 Cache Coherence Core Problem &amp; Broadcast Solution</span>
      </div>

      {/* Mode controls */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
        {(['PROBLEM', 'SOLUTION'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: '6px 12px', borderRadius: '8px',
              cursor: 'pointer', fontWeight: 700, fontSize: '11px',
              background: mode === m ? 'rgba(56,189,248,0.15)' : 'transparent',
              color: mode === m ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
              border: `1px solid ${mode === m ? '#38bdf850' : 'transparent'}`,
              transition: 'all 0.2s',
            }}
          >
            {m === 'PROBLEM' ? '1. Coherence Leak (The Core Problem)' : '2. Pub/Sub Invalidation Broadcast'}
          </button>
        ))}
      </div>

      <style>{`
        .coherence-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .coherence-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="coherence-grid">
        
        {/* SVG Viewport */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 350 200" className="interactive-diagram-svg">
            <defs>
              <marker id="coh-arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(148,163,184,0.3)" />
              </marker>
              <marker id="coh-arr-color" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={mode === 'PROBLEM' ? '#ef4444' : '#34d399'} />
              </marker>
            </defs>

            {/* Node A (Writer) */}
            <g>
              <rect x="25" y="20" width="80" height="45" rx="4" fill="rgba(56,189,248,0.06)" stroke="#38bdf8" strokeWidth="1.2" />
              <text x="65" y="38" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="bold">Node A (Write)</text>
              <text x="65" y="48" textAnchor="middle" fill="#cbd5e1" fontSize="6.5">L1 Cache: v2</text>
            </g>

            {/* Node B (Reader) */}
            <g>
              <rect x="135" y="20" width="80" height="45" rx="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <text x="175" y="38" textAnchor="middle" fill="#cbd5e1" fontSize="8" fontWeight="bold">Node B (Read)</text>
              <text x="175" y="48" textAnchor="middle" fill={mode === 'PROBLEM' ? '#ef4444' : '#34d399'} fontSize="6.5" fontWeight="bold">
                {mode === 'PROBLEM' ? 'L1 Cache: v1 ❌' : 'L1: Evicted ✅'}
              </text>
            </g>

            {/* Node C (Reader) */}
            <g>
              <rect x="245" y="20" width="80" height="45" rx="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <text x="285" y="38" textAnchor="middle" fill="#cbd5e1" fontSize="8" fontWeight="bold">Node C (Read)</text>
              <text x="285" y="48" textAnchor="middle" fill={mode === 'PROBLEM' ? '#ef4444' : '#34d399'} fontSize="6.5" fontWeight="bold">
                {mode === 'PROBLEM' ? 'L1 Cache: v1 ❌' : 'L1: Evicted ✅'}
              </text>
            </g>

            {/* Shared L2 Cache (Redis) */}
            <g>
              <rect x="110" y="125" width="130" height="45" rx="5" fill="rgba(251,191,36,0.1)" stroke="#fbbf24" strokeWidth="1.5" />
              <text x="175" y="145" textAnchor="middle" fill="#fbbf24" fontSize="8.5" fontWeight="bold">Shared Redis (L2)</text>
              <text x="175" y="157" textAnchor="middle" fill="#cbd5e1" fontSize="7.5" fontFamily="monospace">Value: v2</text>
            </g>

            {/* Directed paths */}
            {/* Node A updates L2 */}
            <path d="M 65 65 L 65 147 L 102 147" fill="none" stroke="#34d399" strokeWidth="1.2" className="interactive-diagram-flowing-path active-path-green" markerEnd="url(#coh-arr)" />

            {mode === 'PROBLEM' ? (
              <g>
                {/* Node B and C remain un-invalidated */}
                <path d="M 175 65 L 175 120" fill="none" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="3 3" />
                <path d="M 285 65 L 285 147 L 247 147" fill="none" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="3 3" />
                <text x="230" y="105" textAnchor="middle" fill="#ef4444" fontSize="7" fontWeight="bold">No Invalidation Signal</text>
              </g>
            ) : (
              <g>
                {/* Redis Pub/Sub broadcast */}
                <path d="M 65 65 L 65 147 L 102 147" fill="none" stroke="#34d399" strokeWidth="1.2" />
                {/* PubSub lines back to B and C */}
                <path d="M 175 125 L 175 73" fill="none" stroke="#34d399" strokeWidth="1.5" className="interactive-diagram-flowing-path active-path-green" markerEnd="url(#coh-arr-color)" />
                <path d="M 240 135 L 275 73" fill="none" stroke="#34d399" strokeWidth="1.5" className="interactive-diagram-flowing-path active-path-green" markerEnd="url(#coh-arr-color)" />
                <text x="235" y="98" textAnchor="middle" fill="#34d399" fontSize="7" fontWeight="bold">Redis Broadcast Evict</text>
              </g>
            )}
          </svg>
        </div>

        {/* Details Card */}
        <div className="interactive-diagram-details-card" style={{
          borderLeft: `4px solid ${mode === 'PROBLEM' ? '#ef4444' : '#34d399'}`,
          display: 'flex', flexDirection: 'column', gap: '8px'
        }}>
          
          <div>
            <h4 style={{ margin: 0, fontSize: '12px', color: mode === 'PROBLEM' ? '#ef4444' : '#34d399' }}>
              {mode === 'PROBLEM' ? 'Incoherent L1 Memory State' : 'Pub/Sub Coherence Channel'}
            </h4>
          </div>

          <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', lineHeight: 1.45 }}>
            {mode === 'PROBLEM' ? 'Each application node manages its own local heap cache. When Node A writes to the Database and evicts L2 (Redis), Node B and Node C remain completely unaware and serve stale cache entries (v1) until local TTL expires.' : 'Node A writes the update and publishes an invalidation event to a Redis Pub/Sub channel. Node B and Node C listen to the channel, receive the event, and immediately invalidate their local L1 caches.'}
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.02)',
            borderLeft: `3px solid ${mode === 'PROBLEM' ? '#ef4444' : '#34d399'}`,
            borderRadius: '4px',
            padding: '6px 8px',
            fontSize: '11px',
          }}>
            <span style={{ fontWeight: 'bold', color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.05em', marginBottom: '2px' }}>
              Data Freshness
            </span>
            <span style={{ color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
              {mode === 'PROBLEM' ? 'Inconsistent views: Users hit different servers and see conflicting profiles.' : 'Real-time synchronization: L1 coherence is aligned within milliseconds.'}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
