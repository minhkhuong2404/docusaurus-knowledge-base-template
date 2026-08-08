import React, { useState } from 'react';

type Mode = 'STAMPEDE' | 'SINGLEFLIGHT';

export default function CacheStampedeThunderingHerdDiagram(): React.JSX.Element {
  const [mode, setMode] = useState<Mode>('STAMPEDE');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <span style={{ color: '#34d399' }}>Cache Stampede vs. SingleFlight Mitigation</span>
      </div>

      {/* Mode selectors */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
        {(['STAMPEDE', 'SINGLEFLIGHT'] as Mode[]).map(m => (
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
            {m === 'STAMPEDE' ? '1. Thundering Herd (Unmitigated)' : '2. SingleFlight (Request Coalescing)'}
          </button>
        ))}
      </div>

      <style>{`
        .stampede-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .stampede-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="stampede-grid">
        
        {/* SVG Diagram Canvas */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 350 200" className="interactive-diagram-svg">
            <defs>
              <marker id="stm-arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(148,163,184,0.3)" />
              </marker>
              <marker id="stm-arr-color" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#ef4444" />
              </marker>
            </defs>

            {/* Concurrent Requesters */}
            <g>
              <rect x="15" y="30" width="80" height="25" rx="3" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <text x="55" y="46" textAnchor="middle" fill="#cbd5e1" fontSize="7.5" fontWeight="bold">Request 1</text>
            </g>
            <g>
              <rect x="15" y="70" width="80" height="25" rx="3" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <text x="55" y="86" textAnchor="middle" fill="#cbd5e1" fontSize="7.5" fontWeight="bold">Request 2</text>
            </g>
            <g>
              <rect x="15" y="110" width="80" height="25" rx="3" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <text x="55" y="126" textAnchor="middle" fill="#cbd5e1" fontSize="7.5" fontWeight="bold">Request N</text>
            </g>

            {/* Cache Layer / Lock Layer */}
            {mode === 'STAMPEDE' ? (
              <g>
                <rect x="140" y="55" width="70" height="50" rx="4" fill="rgba(239,68,68,0.1)" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="3 3" />
                <text x="175" y="80" textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="bold">Cache Miss</text>
                <text x="175" y="92" textAnchor="middle" fill="#cbd5e1" fontSize="6.5">Expired Key</text>

                {/* DB connection lines */}
                <path d="M 95 42 L 140 70" fill="none" stroke="#ef4444" strokeWidth="1.2" markerEnd="url(#stm-arr-color)" />
                <path d="M 95 82 L 140 82" fill="none" stroke="#ef4444" strokeWidth="1.2" markerEnd="url(#stm-arr-color)" />
                <path d="M 95 122 L 140 92" fill="none" stroke="#ef4444" strokeWidth="1.2" markerEnd="url(#stm-arr-color)" />

                {/* Database target */}
                <rect x="250" y="55" width="80" height="50" rx="5" fill="rgba(239,68,68,0.15)" stroke="#ef4444" strokeWidth="1.5" />
                <text x="290" y="78" textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="bold">Database Server</text>
                <text x="290" y="90" textAnchor="middle" fill="#ef4444" fontSize="6.5" fontWeight="bold">💥 OVERLOAD</text>

                {/* Connections from Cache to DB */}
                <path d="M 210 70 L 242 70" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2 2" className="interactive-diagram-flowing-path" />
                <path d="M 210 80 L 242 80" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2 2" className="interactive-diagram-flowing-path" />
                <path d="M 210 90 L 242 90" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2 2" className="interactive-diagram-flowing-path" />
              </g>
            ) : (
              <g>
                {/* SingleFlight Coalescing Lock */}
                <rect x="140" y="45" width="80" height="75" rx="5" fill="rgba(52,211,153,0.1)" stroke="#34d399" strokeWidth="1.5" />
                <text x="180" y="65" textAnchor="middle" fill="#34d399" fontSize="8" fontWeight="bold">SingleFlight</text>
                <rect x="150" y="78" width="60" height="30" rx="3" fill="rgba(251,191,36,0.1)" stroke="#fbbf24" strokeWidth="1.2" />
                <text x="180" y="90" textAnchor="middle" fill="#fbbf24" fontSize="6.5" fontWeight="bold">Mutex Lock</text>
                <text x="180" y="100" textAnchor="middle" fill="#cbd5e1" fontSize="5.5">1 queries, N wait</text>

                {/* DB Connection - Only 1 line */}
                <rect x="260" y="55" width="70" height="50" rx="5" fill="rgba(56,189,248,0.06)" stroke="#38bdf8" strokeWidth="1.2" />
                <text x="295" y="80" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="bold">Database DB</text>
                <text x="295" y="92" textAnchor="middle" fill="#cbd5e1" fontSize="6.5">1 Safe Query</text>

                <path d="M 220 80 L 252 80" fill="none" stroke="#34d399" strokeWidth="1.5" className="interactive-diagram-flowing-path active-path-green" markerEnd="url(#stm-arr)" />

                {/* Connections from clients */}
                <path d="M 95 42 L 140 65" fill="none" stroke="#34d399" strokeWidth="1.2" markerEnd="url(#stm-arr)" />
                <path d="M 95 82 L 140 82" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.2" markerEnd="url(#stm-arr)" />
                <path d="M 95 122 L 140 98" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="1.2" markerEnd="url(#stm-arr)" />
              </g>
            )}
          </svg>
        </div>

        {/* Details Card */}
        <div className="interactive-diagram-details-card" style={{
          borderLeft: `4px solid ${mode === 'STAMPEDE' ? '#ef4444' : '#34d399'}`,
          display: 'flex', flexDirection: 'column', gap: '8px'
        }}>
          
          <div>
            <h4 style={{ margin: 0, fontSize: '12px', color: mode === 'STAMPEDE' ? '#ef4444' : '#34d399' }}>
              {mode === 'STAMPEDE' ? 'Cascading Connection Collapse' : 'Coalescing Interception Model'}
            </h4>
          </div>

          <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', lineHeight: 1.45 }}>
            {mode === 'STAMPEDE' ? 'A highly popular key expires. Within milliseconds, hundreds of concurrent threads get a cache miss and execute identical database fetches, triggering resource starvation.' : 'Only the first thread queries the database after acquiring a local mutex lock. All other concurrent threads block and await the result, then read the freshly populated cache.'}
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.02)',
            borderLeft: `3px solid ${mode === 'STAMPEDE' ? '#ef4444' : '#34d399'}`,
            borderRadius: '4px',
            padding: '6px 8px',
            fontSize: '11px',
          }}>
            <span style={{ fontWeight: 'bold', color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.05em', marginBottom: '2px' }}>
              Production Impact
            </span>
            <span style={{ color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
              {mode === 'STAMPEDE' ? 'Causes database CPU spikes, thread pool exhaustion, and server lockups.' : 'Reduces database load from N queries to exactly 1 query during cache misses.'}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
