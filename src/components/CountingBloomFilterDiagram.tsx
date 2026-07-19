import React, { useState } from 'react';

export default function CountingBloomFilterDiagram(): React.JSX.Element {
  const [counters, setCounters] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0]);
  const [log, setLog] = useState<string>('Simulator ready. Insert "apple" and "banana" to watch counter increments.');
  const [activeIndices, setActiveIndices] = useState<number[]>([]);
  const [insertedKeys, setInsertedKeys] = useState<string[]>([]);

  const handleAdd = (key: string, indices: number[]) => {
    const updated = [...counters];
    indices.forEach(idx => {
      updated[idx] = Math.min(15, updated[idx] + 1); // 4-bit limit is 15
    });
    setCounters(updated);
    setActiveIndices(indices);
    setInsertedKeys([...insertedKeys, key]);
    setLog(`Inserted "${key}" &rarr; Incremented counters at indices [${indices.join(', ')}]. Index 4 is shared!`);
  };

  const handleDelete = (key: string, indices: number[]) => {
    if (!insertedKeys.includes(key)) {
      setLog(`Cannot delete "${key}" &rarr; It is not active in the filter list!`);
      return;
    }

    const updated = [...counters];
    indices.forEach(idx => {
      updated[idx] = Math.max(0, updated[idx] - 1);
    });
    setCounters(updated);
    setActiveIndices(indices);

    // Remove first occurrence of key
    const idx = insertedKeys.indexOf(key);
    const keysFiltered = [...insertedKeys];
    keysFiltered.splice(idx, 1);
    setInsertedKeys(keysFiltered);

    setLog(`Deleted "${key}" &rarr; Decremented counters at indices [${indices.join(', ')}]. Notice how shared index 4 remains positive, preserving other keys!`);
  };

  const handleReset = () => {
    setCounters([0, 0, 0, 0, 0, 0, 0, 0]);
    setActiveIndices([]);
    setInsertedKeys([]);
    setLog('Simulator reset.');
  };

  const appleIdx = [1, 4, 6];
  const bananaIdx = [2, 4, 7];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>
        </svg>
        <span>Counting Bloom Filter Deletion Simulator</span>
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
          onClick={() => handleAdd('apple', appleIdx)}
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
          Add "apple" [1, 4, 6]
        </button>
        <button
          onClick={() => handleDelete('apple', appleIdx)}
          disabled={!insertedKeys.includes('apple')}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: 'none',
            cursor: insertedKeys.includes('apple') ? 'pointer' : 'not-allowed',
            fontWeight: 700,
            fontSize: '11px',
            background: insertedKeys.includes('apple') ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.02)',
            color: insertedKeys.includes('apple') ? '#f87171' : 'rgba(255,255,255,0.2)',
            boxShadow: insertedKeys.includes('apple') ? '0 0 0 1px #f8717150' : 'none'
          }}
        >
          Delete "apple"
        </button>

        <button
          onClick={() => handleAdd('banana', bananaIdx)}
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
            marginLeft: '12px'
          }}
        >
          Add "banana" [2, 4, 7]
        </button>
        <button
          onClick={() => handleDelete('banana', bananaIdx)}
          disabled={!insertedKeys.includes('banana')}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: 'none',
            cursor: insertedKeys.includes('banana') ? 'pointer' : 'not-allowed',
            fontWeight: 700,
            fontSize: '11px',
            background: insertedKeys.includes('banana') ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.02)',
            color: insertedKeys.includes('banana') ? '#f87171' : 'rgba(255,255,255,0.2)',
            boxShadow: insertedKeys.includes('banana') ? '0 0 0 1px #f8717150' : 'none'
          }}
        >
          Delete "banana"
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 767px) {
          .cbf-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />

      <div className="cbf-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
        {/* Visual Counters Array */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--ifm-color-content-secondary)', marginBottom: '12px', textTransform: 'uppercase' }}>
            4-Bit Counter Array Model
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px' }}>
            {counters.map((count, idx) => {
              const isActive = activeIndices.includes(idx);
              const activeColor = count > 1 ? '#fbbf24' : '#a78bfa';

              return (
                <div
                  key={idx}
                  style={{
                    width: '32px',
                    height: '42px',
                    borderRadius: '4px',
                    border: `1.5px solid ${isActive ? activeColor : 'rgba(255,255,255,0.15)'}`,
                    background: isActive ? `${activeColor}15` : count > 0 ? 'rgba(167,139,250,0.05)' : 'rgba(0,0,0,0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isActive ? `0 0 6px ${activeColor}30` : 'none',
                    transition: 'all 0.25s'
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: count > 0 ? activeColor : 'var(--ifm-color-content-secondary)' }}>
                    {count}
                  </span>
                  <span style={{ fontSize: '6.5px', color: 'rgba(255,255,255,0.3)', marginTop: '2px', fontFamily: 'monospace' }}>
                    {idx}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: '12px', fontSize: '9.5px', color: 'var(--ifm-color-content-secondary)' }}>
            Active Set: [<strong>{insertedKeys.join(', ') || 'none'}</strong>]
          </div>
        </div>

        {/* Audit Details */}
        <div className="interactive-diagram-details-card" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
          <div className="interactive-diagram-card-header" style={{ marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ifm-color-content)' }}>
              🔎 CBF Logic & Safety
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.45' }}>
            {log}
            <span style={{ display: 'block', marginTop: '6px', fontSize: '11px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
              **Why normal Bloom filters can&apos;t delete**: If you clear bit 4 to delete "apple", you silently corrupt "banana" (which also needs bit 4 to be 1). The Counting Bloom Filter avoids this by keeping cell counts.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
