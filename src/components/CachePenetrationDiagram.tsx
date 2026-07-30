import React, { useState } from 'react';

type PenetrationMode = 'no_protection' | 'bloom_filter' | 'cache_null';

export default function CachePenetrationDiagram(): React.JSX.Element {
  const [mode, setMode] = useState<PenetrationMode>('no_protection');
  const [queryCount, setQueryCount] = useState<number>(0);
  const [cacheContent, setCacheContent] = useState<string>('Empty');
  const [dbLoad, setDbLoad] = useState<number>(0);

  const handleQuery = () => {
    setQueryCount(prev => prev + 1);

    if (mode === 'no_protection') {
      setDbLoad(prev => prev + 1);
    } else if (mode === 'bloom_filter') {
      // Bloom Filter rejects the key before hitting cache or DB
      // dbLoad remains unchanged, cacheContent remains Empty
    } else if (mode === 'cache_null') {
      if (queryCount === 0) {
        // First query hits DB
        setDbLoad(prev => prev + 1);
        setCacheContent('usr_9999: NULL');
      } else {
        // Subsequent queries hit cached null value, DB is bypassed
      }
    }
  };

  const handleModeChange = (m: PenetrationMode) => {
    setMode(m);
    setQueryCount(0);
    setCacheContent('Empty');
    setDbLoad(0);
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span>Mitigating Cache Penetration (Non-Existent Keys Queries)</span>
      </div>

      {/* Mode selectors */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {(['no_protection', 'bloom_filter', 'cache_null'] as PenetrationMode[]).map(m => {
          const isActive = mode === m;
          const label = m === 'no_protection' ? '1. No Protection' : m === 'bloom_filter' ? '2. Bloom Filter' : '3. Cache Null Values';
          const color = m === 'no_protection' ? '#f87171' : m === 'bloom_filter' ? '#a78bfa' : '#34d399';
          return (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              style={{
                flex: 1,
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '11px',
                background: isActive ? `${color}18` : 'rgba(255,255,255,0.03)',
                color: isActive ? color : 'var(--ifm-color-content-secondary)',
                boxShadow: isActive ? `0 0 0 1.5px ${color}50` : '0 0 0 1px rgba(255,255,255,0.06)',
                transition: 'all 0.15s ease'
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 767px) {
          .cp-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />

      <div className="cp-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
        {/* Router Flow simulation */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
            
            {/* Client Trigger */}
            <button
              onClick={handleQuery}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: 'rgba(56,189,248,0.15)',
                color: '#38bdf8',
                boxShadow: '0 0 0 1px #38bdf850',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              🚀 Query Non-Existent Key `"usr_9999"`
            </button>

            {/* Bloom filter overlay */}
            {mode === 'bloom_filter' && (
              <div style={{ border: '1.5px solid #a78bfa', background: 'rgba(167, 139, 250, 0.08)', borderRadius: '6px', padding: '8px 14px', width: '220px', fontSize: '11px', fontWeight: 'bold', color: '#a78bfa' }}>
                🛡️ Bloom Filter: Checks Bit Array
                <div style={{ fontSize: '9px', fontWeight: 'normal', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                  Result: **Definite Miss (Rejects request)**
                </div>
              </div>
            )}

            {/* Cache Node */}
            <div style={{ border: '1.5px solid #38bdf8', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '6px', padding: '8px 14px', width: '220px', fontSize: '11px', fontWeight: 'bold', color: '#38bdf8' }}>
              💾 Cache Cluster
              <div style={{ fontSize: '9px', fontWeight: 'normal', color: 'var(--ifm-color-content-secondary)', marginTop: '2px', fontFamily: 'monospace' }}>
                {`Cache Content: ${cacheContent}`}
              </div>
            </div>

            {/* DB Node */}
            <div style={{ border: `1.5px solid ${dbLoad > 0 ? '#f87171' : 'rgba(255,255,255,0.15)'}`, background: dbLoad > 0 ? 'rgba(248,113,113,0.06)' : 'rgba(0,0,0,0.15)', borderRadius: '6px', padding: '8px 14px', width: '220px', fontSize: '11px', fontWeight: 'bold', color: dbLoad > 0 ? '#f87171' : 'var(--ifm-color-content-secondary)', transition: 'all 0.3s' }}>
              🗄️ Database
              <div style={{ fontSize: '9px', fontWeight: 'normal', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                {`Queries Hit DB: ${dbLoad}`}
              </div>
            </div>

          </div>
        </div>

        {/* Audit reports card */}
        <div className="interactive-diagram-details-card" style={{ borderColor: dbLoad > 3 ? '#f87171' : 'var(--ifm-color-content-secondary)' }}>
          <div className="interactive-diagram-card-header" style={{ marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ifm-color-content)' }}>
              📈 Database Load Metrics
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            <div>
              Total Client Requests: <strong>{queryCount}</strong>
            </div>
            <div>
              Database Queries Processed: <strong style={{ color: dbLoad > 0 ? '#fbbf24' : 'var(--ifm-color-content)' }}>{dbLoad}</strong>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px', marginTop: '4px' }}>
              <div style={{ fontWeight: 'bold', color: 'var(--ifm-color-content)' }}>
                Mechanism Assessment:
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                {mode === 'no_protection' && (
                  <span style={{ color: '#f87171' }}>
                    ❌ **Vulnerability**: Every single non-existent query misses cache and hits DB directly. A scraper or hacker can crash the DB within seconds (OOM / thread starvation).
                  </span>
                )}
                {mode === 'bloom_filter' && (
                  <span style={{ color: '#a78bfa' }}>
                    🟢 **Optimal Protection**: The Bloom filter checks key membership instantly in L1 memory. DB is 100% shielded from arbitrary scan probes.
                  </span>
                )}
                {mode === 'cache_null' && (
                  <span style={{ color: '#34d399' }}>
                    🟢 **Adaptive Defense**: The first request hits DB, gets Null, and stores `usr_9999: NULL` in cache. Subsequent duplicate queries hit cache directly, protecting the DB from repetitive spikes.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
