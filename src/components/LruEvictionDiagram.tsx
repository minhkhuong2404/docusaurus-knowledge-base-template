import React, { useState } from 'react';

export default function LruEvictionDiagram(): React.JSX.Element {
  const [list, setList] = useState<string[]>(['A', 'B', 'C', 'D']);
  const [log, setLog] = useState<string>('Initial state. Head is Most Recently Used (MRU), Tail is Least Recently Used (LRU).');

  const handleAccess = (key: string) => {
    // If key exists, pull it to the front
    if (list.includes(key)) {
      const filtered = list.filter(k => k !== key);
      const updated = [key, ...filtered];
      setList(updated);
      setLog(`Accessed key "${key}". It was removed from its current position and pushed to the HEAD (MRU).`);
    }
  };

  const handleInsert = () => {
    const nextKeys = ['E', 'F', 'G', 'H'];
    // Find a key not in list
    const keyToInsert = nextKeys.find(k => !list.includes(k)) || 'E';

    const tail = list[list.length - 1];
    const filtered = list.slice(0, list.length - 1); // remove tail
    const updated = [keyToInsert, ...filtered];
    
    setList(updated);
    setLog(`Inserted new key "${keyToInsert}". Max capacity (4) was exceeded. Tail node "${tail}" (LRU) was evicted from the cache.`);
  };

  const handleReset = () => {
    setList(['A', 'B', 'C', 'D']);
    setLog('Reset cache list to initial state.');
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
        <span>LRU (Least Recently Used) Linked List Simulator</span>
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
        {['A', 'B', 'C', 'D'].map(k => (
          <button
            key={k}
            onClick={() => handleAccess(k)}
            disabled={!list.includes(k)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: list.includes(k) ? 'pointer' : 'not-allowed',
              fontWeight: 700,
              fontSize: '11px',
              background: list.includes(k) ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.02)',
              color: list.includes(k) ? '#38bdf8' : 'rgba(255,255,255,0.2)',
              boxShadow: list.includes(k) ? '0 0 0 1px #38bdf850' : 'none'
            }}
          >
            Access key {k}
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
          Insert new key (Evict tail)
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 767px) {
          .lru-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />

      <div className="lru-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
        {/* Visual List Stack */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {list.map((key, idx) => {
              const isHead = idx === 0;
              const isTail = idx === list.length - 1;
              const nodeColor = isHead ? '#34d399' : isTail ? '#f87171' : '#38bdf8';

              return (
                <React.Fragment key={key}>
                  {/* Linked List Node */}
                  <div
                    style={{
                      width: '45px',
                      height: '45px',
                      borderRadius: '8px',
                      border: `1.5px solid ${nodeColor}`,
                      background: isHead ? 'rgba(52,211,153,0.08)' : isTail ? 'rgba(248,113,113,0.08)' : 'rgba(56,189,248,0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      boxShadow: isHead ? '0 0 8px rgba(52,211,153,0.2)' : 'none',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: nodeColor }}>{key}</span>
                    <span style={{ fontSize: '6.5px', color: 'var(--ifm-color-content-secondary)', position: 'absolute', bottom: '2px' }}>
                      {isHead ? 'HEAD' : isTail ? 'TAIL' : `pos ${idx}`}
                    </span>
                  </div>

                  {/* Connecting line / arrow */}
                  {!isTail && (
                    <svg width="20" height="20" viewBox="0 0 20 20" style={{ fill: 'none', stroke: 'rgba(255,255,255,0.15)', strokeWidth: '1.5' }}>
                      <path d="M 0 10 L 16 10" markerEnd="url(#aside-arr)" stroke="rgba(255,255,255,0.3)" />
                      <polygon points="12,7 17,10 12,13" fill="rgba(255,255,255,0.3)" />
                    </svg>
                  )}
                </React.Fragment>
              );
            })}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '9.5px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', fontWeight: 'bold', padding: '0 8px' }}>
            <span style={{ color: '#34d399' }}>🟢 MRU (Most Recently Used)</span>
            <span style={{ color: '#f87171' }}>🔴 LRU (Least Recently Used)</span>
          </div>
        </div>

        {/* Action Log details */}
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
