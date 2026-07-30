import React, { useState } from 'react';

interface TtlKey {
  id: string;
  ttl: number; // remaining seconds
  maxTtl: number;
}

export default function TtlExpirationDiagram(): React.JSX.Element {
  const [keys, setKeys] = useState<TtlKey[]>([
    { id: 'session_101', ttl: 20, maxTtl: 20 },
    { id: 'profile_99', ttl: 10, maxTtl: 20 },
    { id: 'cart_val_3', ttl: 5, maxTtl: 20 }
  ]);
  const [log, setLog] = useState<string>('Initial state. Click "Pass 5 Seconds" to simulate time decay.');

  const handleTimePass = () => {
    const expired: string[] = [];
    const updated = keys
      .map(k => {
        const nextTtl = Math.max(0, k.ttl - 5);
        if (nextTtl === 0 && k.ttl > 0) {
          expired.push(k.id);
        }
        return { ...k, ttl: nextTtl };
      })
      .filter(k => k.ttl > 0); // Active eviction of expired keys

    setKeys(updated);
    if (expired.length > 0) {
      setLog(`Passed 5 seconds. Keys [${expired.join(', ')}] expired (TTL reached 0) and were automatically evicted.`);
    } else {
      setLog('Passed 5 seconds. All active key TTL counters decremented.');
    }
  };

  const handleInsert = () => {
    const pool = ['auth_token', 'user_meta', 'config_sys'];
    const activeIds = keys.map(k => k.id);
    const keyToInsert = pool.find(id => !activeIds.includes(id)) || 'auth_token';

    if (activeIds.includes(keyToInsert)) {
      setLog('Key already active.');
      return;
    }

    setKeys([...keys, { id: keyToInsert, ttl: 15, maxTtl: 15 }]);
    setLog(`Inserted new key "${keyToInsert}" with TTL = 15 seconds.`);
  };

  const handleReset = () => {
    setKeys([
      { id: 'session_101', ttl: 20, maxTtl: 20 },
      { id: 'profile_99', ttl: 10, maxTtl: 20 },
      { id: 'cart_val_3', ttl: 5, maxTtl: 20 }
    ]);
    setLog('Reset cache timers to initial state.');
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <span>TTL (Time to Live) Cache Expiry Simulator</span>
        <button
          onClick={handleReset}
          style={{
            marginLeft: 'auto',
            padding: '4px 10px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '11px',
            background: 'rgba(255,255,255,0.06)',
            color: 'var(--ifm-color-content-secondary)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.1)'
          }}
        >
          Reset
        </button>
      </div>

      {/* Simulator buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <button
          onClick={handleTimePass}
          disabled={keys.length === 0}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: 'none',
            cursor: keys.length > 0 ? 'pointer' : 'not-allowed',
            fontWeight: 700,
            fontSize: '11px',
            background: keys.length > 0 ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.02)',
            color: keys.length > 0 ? '#34d399' : 'rgba(255,255,255,0.2)',
            boxShadow: keys.length > 0 ? '0 0 0 1px #34d39950' : 'none'
          }}
        >
          Pass 5 Seconds ⏱️
        </button>
        <button
          onClick={handleInsert}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '11px',
            background: 'rgba(56,189,248,0.15)',
            color: '#38bdf8',
            boxShadow: '0 0 0 1px #38bdf850',
            marginLeft: 'auto'
          }}
        >
          Put new key (TTL = 15s)
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 767px) {
          .ttl-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />

      <div className="ttl-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
        {/* Keys Timers View */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
          {keys.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ifm-color-content-secondary)', fontSize: '12px' }}>
              💨 Cache is empty. All keys have expired!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {keys.map(k => {
                const pct = (k.ttl / k.maxTtl) * 100;
                const barColor = k.ttl <= 5 ? '#f87171' : '#38bdf8';

                return (
                  <div key={k.id} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', fontWeight: 'bold' }}>
                      <span style={{ color: 'var(--ifm-color-content)' }}>{k.id}</span>
                      <span style={{ color: barColor, fontFamily: 'monospace' }}>{`${k.ttl}s left`}</span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: barColor, transition: 'width 0.3s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action log */}
        <div className="interactive-diagram-details-card" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
          <div className="interactive-diagram-card-header" style={{ marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ifm-color-content)' }}>
              📝 Execution Log
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.45' }}>
            {log}
          </p>
        </div>
      </div>
    </div>
  );
}
