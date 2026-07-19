import React, { useState } from 'react';

interface LfuKey {
  id: string;
  frequency: number;
}

export default function LfuEvictionDiagram(): React.JSX.Element {
  const [keys, setKeys] = useState<LfuKey[]>([
    { id: 'A', frequency: 5 },
    { id: 'B', frequency: 3 },
    { id: 'C', frequency: 2 },
    { id: 'D', frequency: 1 }
  ]);
  const [log, setLog] = useState<string>('Initial state. Keys are sorted by frequency. Eviction drops the item with the lowest frequency.');

  const handleAccess = (id: string) => {
    const updated = keys.map(k => {
      if (k.id === id) {
        return { ...k, frequency: k.frequency + 1 };
      }
      return k;
    });

    // Sort by frequency descending
    updated.sort((x, y) => y.frequency - x.frequency);
    setKeys(updated);
    setLog(`Accessed key "${id}". Frequency count incremented. List re-sorted by frequency.`);
  };

  const handleInsert = () => {
    // Find next available key label
    const pool = ['E', 'F', 'G', 'H'];
    const activeIds = keys.map(k => k.id);
    const keyToInsert = pool.find(id => !activeIds.includes(id)) || 'E';

    // Evict lowest frequency (last item in sorted array)
    const evicted = keys[keys.length - 1];
    const filtered = keys.slice(0, keys.length - 1);
    const updated = [...filtered, { id: keyToInsert, frequency: 1 }];

    updated.sort((x, y) => y.frequency - x.frequency);
    setKeys(updated);
    setLog(`Inserted new key "${keyToInsert}" with frequency = 1. Key "${evicted.id}" (lowest frequency count: ${evicted.frequency}) was evicted to clear capacity.`);
  };

  const handleReset = () => {
    setKeys([
      { id: 'A', frequency: 5 },
      { id: 'B', frequency: 3 },
      { id: 'C', frequency: 2 },
      { id: 'D', frequency: 1 }
    ]);
    setLog('Reset cache list to initial state.');
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
        <span>LFU (Least Frequently Used) Cache Frequency Simulator</span>
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

      {/* Controller Buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {keys.map(k => (
          <button
            key={k.id}
            onClick={() => handleAccess(k.id)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '11px',
              background: 'rgba(56,189,248,0.15)',
              color: '#38bdf8',
              boxShadow: '0 0 0 1px #38bdf850'
            }}
          >
            Access key {k.id}
          </button>
        ))}
        <button
          onClick={handleInsert}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '11px',
            background: 'rgba(248,113,113,0.15)',
            color: '#f87171',
            boxShadow: '0 0 0 1px #f8717150',
            marginLeft: 'auto'
          }}
        >
          Insert new key (Evict LFU)
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 767px) {
          .lfu-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />

      <div className="lfu-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
        {/* Frequency visual chart */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {keys.map((k, idx) => {
              const maxFreq = Math.max(...keys.map(x => x.frequency), 1);
              const pct = (k.frequency / maxFreq) * 100;
              const isLfu = idx === keys.length - 1;
              const barColor = isLfu ? '#f87171' : '#38bdf8';

              return (
                <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '14px', fontWeight: 'bold', fontSize: '12px', color: barColor }}>{k.id}</span>
                  <div style={{ flex: 1, height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: barColor, transition: 'width 0.4s ease' }} />
                  </div>
                  <span style={{ width: '45px', fontSize: '10px', color: 'var(--ifm-color-content-secondary)', textAlign: 'right', fontFamily: 'monospace' }}>
                    {`hits: ${k.frequency}`}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: '14px', fontSize: '9px', color: '#f87171', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'right' }}>
            ⚠️ Tail is LFU (Lowest Frequency) &rarr; Next Eviction target
          </div>
        </div>

        {/* Info detail log */}
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
