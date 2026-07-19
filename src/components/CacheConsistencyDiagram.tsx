import React, { useState } from 'react';

type Mode = 'no_invalidation' | 'with_eviction';

export default function CacheConsistencyDiagram(): React.JSX.Element {
  const [mode, setMode] = useState<Mode>('no_invalidation');
  const [step, setStep] = useState<number>(0);

  const handleNextStep = () => {
    setStep(prev => (prev + 1) % 3);
  };

  const handleModeChange = (m: Mode) => {
    setMode(m);
    setStep(0);
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
        <span>Cache Consistency: Invalidation on Write Strategy</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {(['no_invalidation', 'with_eviction'] as Mode[]).map(m => {
          const isActive = mode === m;
          const label = m === 'no_invalidation' ? '1. Without Invalidation (Stale Data)' : '2. With Cache Eviction on Write (Consistent)';
          const color = m === 'no_invalidation' ? '#f87171' : '#34d399';
          return (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              style={{
                flex: 1,
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '12px',
                background: isActive ? `${color}18` : 'rgba(255,255,255,0.04)',
                color: isActive ? color : 'var(--ifm-color-content-secondary)',
                boxShadow: isActive ? `0 0 0 1.5px ${color}50` : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 767px) {
          .cc-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />

      <div className="cc-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
        {/* Visual Map */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ minHeight: '180px' }}>
          <svg viewBox="0 0 360 180" className="interactive-diagram-svg">
            {/* Cache block */}
            <rect x="50" y="30" width="100" height="50" rx="6" fill="rgba(56,189,248,0.06)" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="100" y="52" textAnchor="middle" fill="#38bdf8" fontSize="10.5" fontWeight="800">Cache (Redis)</text>
            <text x="100" y="68" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5" fontFamily="monospace">
              {mode === 'no_invalidation'
                ? 'key1: "v1"'
                : step === 0 ? 'key1: "v1"' : step === 1 ? '(key evicted 💨)' : 'key1: "v2"'
              }
            </text>

            {/* DB block */}
            <rect x="210" y="30" width="100" height="50" rx="6" fill="rgba(251,191,36,0.06)" stroke="#fbbf24" strokeWidth="1.5" />
            <text x="260" y="52" textAnchor="middle" fill="#fbbf24" fontSize="10.5" fontWeight="800">Database</text>
            <text x="260" y="68" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5" fontFamily="monospace">
              {step === 0 ? 'key1: "v1"' : 'key1: "v2"'}
            </text>

            {/* Invalidation indicator line */}
            {mode === 'with_eviction' && step === 1 && (
              <g>
                <path d="M 210 55 L 158 55" fill="none" stroke="#f87171" strokeWidth="2" strokeDasharray="3,3" />
                <text x="184" y="46" textAnchor="middle" fill="#f87171" fontSize="7" fontWeight="bold">Evict Key</text>
              </g>
            )}

            {/* Client request */}
            <g>
              <rect x="135" y="125" width="90" height="30" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" />
              <text x="180" y="144" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="9" fontWeight="bold">Client Session</text>
            </g>

            {/* Query path */}
            {step === 2 && (
              <g>
                <path d="M 180 120 L 110 88" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="135" y="112" textAnchor="middle" fill="#38bdf8" fontSize="7.5" fontWeight="bold">
                  {mode === 'no_invalidation' ? 'Hit &rarr; stale "v1"' : 'Miss &rarr; fetch from DB'}
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Info panel */}
        <div className="interactive-diagram-details-card" style={{ borderColor: mode === 'no_invalidation' ? '#f87171' : '#34d399' }}>
          <div className="interactive-diagram-card-header" style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ifm-color-content)' }}>
              Step {step + 1} of 3
            </span>
            <button
              onClick={handleNextStep}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '10px',
                background: 'rgba(255,255,255,0.08)',
                color: 'var(--ifm-color-content)'
              }}
            >
              Next Step &raquo;
            </button>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.45 }}>
            {mode === 'no_invalidation' ? (
              <div>
                {step === 0 && 'Step 1: DB & Cache are consistent. Both contain value "v1".'}
                {step === 1 && 'Step 2: Client writes value "v2" directly to Database. The DB updates instantly to "v2", but Cache is untouched and still holds "v1".'}
                {step === 2 && 'Step 3: Client queries key. App checks Cache, finds "v1" (Cache Hit), and returns "v1". Client reads stale data! Inconsistency remains until Cache TTL expires.'}
              </div>
            ) : (
              <div>
                {step === 0 && 'Step 1: DB & Cache are consistent. Both contain value "v1".'}
                {step === 1 && 'Step 2: Client writes value "v2" to DB. In the same Transaction/Flow, the Application executes a cache delete command: cache.evict("key1").'}
                {step === 2 && 'Step 3: Client queries key. Cache is empty (Cache Miss). App fetches "v2" from DB and rewrites it back to Cache. Client reads fresh consistent data "v2"!'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
