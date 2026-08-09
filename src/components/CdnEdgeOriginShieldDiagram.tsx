import React, { useState } from 'react';

type Mode = 'NO_SHIELD' | 'WITH_SHIELD';

export default function CdnEdgeOriginShieldDiagram(): React.JSX.Element {
  const [mode, setMode] = useState<Mode>('NO_SHIELD');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span style={{ color: '#34d399' }}>CDN Edge &amp; Origin Shielding Architecture</span>
      </div>

      {/* Mode selectors */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
        {(['NO_SHIELD', 'WITH_SHIELD'] as Mode[]).map(m => (
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
            {m === 'NO_SHIELD' ? '1. Direct Origin Hits (No Shield)' : '2. With Origin Shielding'}
          </button>
        ))}
      </div>

      <style>{`
        .cdn-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .cdn-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="cdn-grid">
        
        {/* SVG Diagram */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 350 200" className="interactive-diagram-svg">
            <defs>
              <marker id="cdn-arr-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(148,163,184,0.3)" />
              </marker>
              <marker id="cdn-arr-red" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#ef4444" />
              </marker>
            </defs>

            {/* Clients */}
            <text x="35" y="25" fill="#cbd5e1" fontSize="7" fontWeight="bold">Global Clients</text>
            <circle cx="35" cy="55" r="14" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <text x="35" y="58" textAnchor="middle" fill="#cbd5e1" fontSize="7.5">User A</text>

            <circle cx="35" cy="135" r="14" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <text x="35" y="138" textAnchor="middle" fill="#cbd5e1" fontSize="7.5">User B</text>

            {/* CDN Edges */}
            <text x="125" y="25" fill="#fbbf24" fontSize="7" fontWeight="bold">CDN Edges</text>
            <rect x="110" y="40" width="50" height="30" rx="3" fill="rgba(251,191,36,0.05)" stroke="#fbbf24" strokeWidth="1" />
            <text x="135" y="58" textAnchor="middle" fill="#fbbf24" fontSize="7">Edge US</text>

            <rect x="110" y="120" width="50" height="30" rx="3" fill="rgba(251,191,36,0.05)" stroke="#fbbf24" strokeWidth="1" />
            <text x="135" y="138" textAnchor="middle" fill="#fbbf24" fontSize="7">Edge EU</text>

            {/* Clients to Edges */}
            <path d="M 50 55 L 102 55" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1" markerEnd="url(#cdn-arr-arrow)" />
            <path d="M 50 135 L 102 135" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1" markerEnd="url(#cdn-arr-arrow)" />

            {mode === 'NO_SHIELD' ? (
              <g>
                {/* No Shield: Both edges hit the origin */}
                <rect x="250" y="70" width="80" height="50" rx="5" fill="rgba(239,68,68,0.1)" stroke="#ef4444" strokeWidth="1.5" />
                <text x="290" y="93" textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="bold">Origin Server</text>
                <text x="290" y="105" textAnchor="middle" fill="#cbd5e1" fontSize="6.5">2 queries hit DB</text>

                {/* Paths directly to Origin */}
                <path d="M 160 55 L 245 80" fill="none" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="3 3" className="interactive-diagram-flowing-path" markerEnd="url(#cdn-arr-red)" />
                <path d="M 160 135 L 245 110" fill="none" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="3 3" className="interactive-diagram-flowing-path" markerEnd="url(#cdn-arr-red)" />
              </g>
            ) : (
              <g>
                {/* Origin Shield Layer */}
                <rect x="185" y="70" width="60" height="55" rx="4" fill="rgba(56,189,248,0.1)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="215" y="92" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="bold">Origin Shield</text>
                <text x="215" y="104" textAnchor="middle" fill="#cbd5e1" fontSize="6">Coalescing...</text>

                {/* Origin Server */}
                <rect x="275" y="80" width="60" height="35" rx="4" fill="rgba(52,211,153,0.06)" stroke="#34d399" strokeWidth="1.2" />
                <text x="305" y="101" textAnchor="middle" fill="#34d399" fontSize="8" fontWeight="bold">Origin</text>

                {/* Edges to Shield */}
                <path d="M 160 55 L 182 80" fill="none" stroke="#38bdf8" strokeWidth="1.2" markerEnd="url(#cdn-arr-arrow)" />
                <path d="M 160 135 L 182 110" fill="none" stroke="#38bdf8" strokeWidth="1.2" markerEnd="url(#cdn-arr-arrow)" />

                {/* Shield to Origin - 1 query only */}
                <path d="M 245 97 L 267 97" fill="none" stroke="#34d399" strokeWidth="1.5" className="interactive-diagram-flowing-path active-path-green" markerEnd="url(#cdn-arr-arrow)" />
              </g>
            )}
          </svg>
        </div>

        {/* Details Card */}
        <div className="interactive-diagram-details-card" style={{
          borderLeft: `4px solid ${mode === 'NO_SHIELD' ? '#ef4444' : '#38bdf8'}`,
          display: 'flex', flexDirection: 'column', gap: '8px'
        }}>
          
          <div>
            <h4 style={{ margin: 0, fontSize: '12px', color: mode === 'NO_SHIELD' ? '#ef4444' : '#38bdf8' }}>
              {mode === 'NO_SHIELD' ? 'Origin Thundering Herd' : 'Origin Shield Protection'}
            </h4>
          </div>

          <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', lineHeight: 1.45 }}>
            {mode === 'NO_SHIELD' ? 'When cache entries expire globally, every edge node independently forwards a miss request to the origin, creating a massive wave of incoming traffic (fan-in load amplification).' : 'A single centralized shield layer intercepts all edge misses. The shield fetches and caches the resource once, then returns it to all edges, protecting the origin from query storms.'}
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.02)',
            borderLeft: `3px solid ${mode === 'NO_SHIELD' ? '#ef4444' : '#38bdf8'}`,
            borderRadius: '4px',
            padding: '6px 8px',
            fontSize: '11px',
          }}>
            <span style={{ fontWeight: 'bold', color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.05em', marginBottom: '2px' }}>
              Origin Load
            </span>
            <span style={{ color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
              {mode === 'NO_SHIELD' ? 'Proportional to edge location count (e.g. 100x traffic amplification).' : 'Reduced to exactly 1 query per cache miss window.'}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
