import React, { useState } from 'react';

interface GenArray {
  name: string;
  keys: string[];
  color: string;
}

export default function BloomFilterExpirationDiagram(): React.JSX.Element {
  const [generations, setGenerations] = useState<GenArray[]>([
    { name: 'Gen 1 (Oldest)', keys: ['session_a'], color: '#f87171' },
    { name: 'Gen 2 (Active)', keys: ['session_b'], color: '#fbbf24' },
    { name: 'Gen 3 (Newest)', keys: ['session_c'], color: '#34d399' }
  ]);
  const [log, setLog] = useState<string>('Generational rolling window Bloom filter active. Writes always route to Gen 3.');

  const handleInsert = () => {
    const activeKeys = generations.flatMap(g => g.keys);
    const pool = ['session_d', 'session_e', 'session_f'];
    const nextKey = pool.find(k => !activeKeys.includes(k));

    if (!nextKey) {
      setLog('Pool exhausted! Reset to clear timeline.');
      return;
    }

    setGenerations(prev => {
      const updated = [...prev];
      updated[2] = { ...updated[2], keys: [...updated[2].keys, nextKey] };
      return updated;
    });
    setLog(`Inserted "${nextKey}" directly into the active Gen 3 Bloom filter.`);
  };

  const handlePassGen = () => {
    setGenerations(prev => {
      const expired = prev[0].keys;
      const nextGen1 = { ...prev[1], name: 'Gen 1 (Oldest)', color: '#f87171' };
      const nextGen2 = { ...prev[2], name: 'Gen 2 (Active)', color: '#fbbf24' };
      const nextGen3 = { name: 'Gen 3 (Newest)', keys: [], color: '#34d399' };

      setLog(`Passed generation window: Old Gen 1 keys [${expired.join(', ')}] expired and were cleared. Gen 2 &rarr; Gen 1. Gen 3 &rarr; Gen 2. Gen 3 reset to empty.`);
      return [nextGen1, nextGen2, nextGen3];
    });
  };

  const handleReset = () => {
    setGenerations([
      { name: 'Gen 1 (Oldest)', keys: ['session_a'], color: '#f87171' },
      { name: 'Gen 2 (Active)', keys: ['session_b'], color: '#fbbf24' },
      { name: 'Gen 3 (Newest)', keys: ['session_c'], color: '#34d399' }
    ]);
    setLog('Simulator reset.');
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <span>Generational / Rolling Window Bloom Filter Expiration</span>
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
          onClick={handleInsert}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '11px',
            background: 'rgba(52,211,153,0.15)',
            color: '#34d399',
            boxShadow: '0 0 0 1px #34d39950'
          }}
        >
          Insert new item (Gen 3)
        </button>
        <button
          onClick={handlePassGen}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '11px',
            background: 'rgba(251,191,36,0.15)',
            color: '#fbbf24',
            boxShadow: '0 0 0 1px #fbbf2450'
          }}
        >
          Pass Generation &raquo;
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 767px) {
          .bfe-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />

      <div className="bfe-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
        {/* Visual stack of generations */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {generations.map(g => (
              <div
                key={g.name}
                style={{
                  border: `1.5px solid ${g.color}`,
                  background: 'rgba(0,0,0,0.15)',
                  borderRadius: '6px',
                  padding: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', color: g.color }}>
                  <span>{g.name}</span>
                  <span style={{ fontSize: '9px', fontWeight: 'normal', color: 'var(--ifm-color-content-secondary)' }}>
                    {g.name.includes('Gen 3') ? '✍️ Active Writes' : '👁️ Read-Only'}
                  </span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', fontFamily: 'monospace', marginTop: '4px' }}>
                  Keys: [{g.keys.join(', ') || 'empty'}]
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action console log details */}
        <div className="interactive-diagram-details-card" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
          <div className="interactive-diagram-card-header" style={{ marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ifm-color-content)' }}>
              🔎 Rolling Window Mechanism
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.45' }}>
            {log}
            <span style={{ display: 'block', marginTop: '6px', fontSize: '11px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
              **Rolling window**: To support expiration without counter overhead, keys are segmented into generations. Wiping the oldest generation acts as bulk expiration without re-indexing.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
