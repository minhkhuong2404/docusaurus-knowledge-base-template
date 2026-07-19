import React, { useState } from 'react';

type AvalancheMode = 'sync' | 'jitter';

export default function CacheAvalancheDiagram(): React.JSX.Element {
  const [mode, setMode] = useState<AvalancheMode>('sync');
  const [timePassed, setTimePassed] = useState<number>(0);

  // Sync mode key expiration times (all at 10s)
  const syncKeys = [
    { name: 'session_A', expiresAt: 10 },
    { name: 'session_B', expiresAt: 10 },
    { name: 'session_C', expiresAt: 10 },
    { name: 'session_D', expiresAt: 10 }
  ];

  // Jittered mode key expiration times (spread out)
  const jitterKeys = [
    { name: 'session_A', expiresAt: 4 },
    { name: 'session_B', expiresAt: 8 },
    { name: 'session_C', expiresAt: 12 },
    { name: 'session_D', expiresAt: 16 }
  ];

  const activeKeys = mode === 'sync' ? syncKeys : jitterKeys;

  // Compute database load dynamically based on active expirations at current second
  const getDbLoad = (sec: number) => {
    if (mode === 'sync') {
      return sec === 10 ? 100 : 5;
    } else {
      // Jittered expirations create minor spikes spread out
      if ([4, 8, 12, 16].includes(sec)) return 25;
      return 5;
    }
  };

  const currentDbLoad = getDbLoad(timePassed);

  const handleTick = () => {
    setTimePassed(prev => (prev + 2) % 20);
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span>Mitigating Cache Avalanche: Randomized TTL Jitter</span>
      </div>

      {/* Mode toggle tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {(['sync', 'jitter'] as AvalancheMode[]).map(m => {
          const isActive = mode === m;
          const label = m === 'sync' ? '1. Synchronized TTL (No Jitter)' : '2. Jittered TTL (Randomized Expiry)';
          const color = m === 'sync' ? '#f87171' : '#34d399';
          return (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setTimePassed(0);
              }}
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
          .ca-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />

      <div className="ca-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
        {/* Left Side Visual Clock */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
            
            {/* Clock ticker */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--ifm-color-content-secondary)' }}>TIME TICKER:</span>
              <span style={{ fontSize: '14px', fontFamily: 'monospace', fontWeight: 'bold', color: '#fbbf24' }}>
                {`00:00:${timePassed < 10 ? '0' + timePassed : timePassed}`}
              </span>
              <button
                onClick={handleTick}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '9.5px',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'var(--ifm-color-content)'
                }}
              >
                +2 seconds
              </button>
            </div>

            {/* Keys remaining status */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', width: '100%' }}>
              {activeKeys.map(k => {
                const expired = timePassed >= k.expiresAt;
                return (
                  <div
                    key={k.name}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '9px',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      background: expired ? 'rgba(248,113,113,0.08)' : 'rgba(52,211,153,0.08)',
                      border: `1px solid ${expired ? '#f8717150' : '#34d39950'}`,
                      color: expired ? '#f87171' : '#34d399',
                      transition: 'all 0.3s'
                    }}
                  >
                    {k.name} {expired ? '(Expired 💨)' : `(Expires at ${k.expiresAt}s)`}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right side audit details */}
        <div className="interactive-diagram-details-card" style={{ borderColor: currentDbLoad > 50 ? '#f87171' : 'var(--ifm-color-content-secondary)' }}>
          <div className="interactive-diagram-card-header" style={{ marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ifm-color-content)' }}>
              🎛️ Database Load Audit
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Database Load Level:</span>
              <div style={{ flex: 1, height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${currentDbLoad}%`, height: '100%', background: currentDbLoad > 50 ? '#f87171' : '#34d399', transition: 'all 0.3s' }} />
              </div>
              <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: currentDbLoad > 50 ? '#f87171' : '#34d399' }}>
                {`${currentDbLoad}%`}
              </span>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px' }}>
              <div style={{ fontWeight: 'bold', color: 'var(--ifm-color-content)' }}>
                Analysis:
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                {mode === 'sync' ? (
                  <span style={{ color: '#f87171' }}>
                    ❌ **DB Peak Danger**: At second 10, all 4 session keys expire at the exact same moment. The application hits a 100% database query peak (Cache Avalanche), risking DB outages.
                  </span>
                ) : (
                  <span style={{ color: '#34d399' }}>
                    🟢 **Load Leveling**: Randomizing expiration times distributes the evictions across seconds 4, 8, 12, and 16. DB load peaks are capped at a safe 25% level.
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
