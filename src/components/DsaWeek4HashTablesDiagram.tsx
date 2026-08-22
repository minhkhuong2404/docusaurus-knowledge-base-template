import React, { useState } from 'react';

export default function DsaWeek4HashTablesDiagram(): React.JSX.Element {
  const [selectedKey, setSelectedKey] = useState<string>('apple');
  const [method, setMethod] = useState<'chaining' | 'probing'>('chaining');

  const keys = [
    { key: 'apple', hash: 3, val: '$1.50' },
    { key: 'banana', hash: 1, val: '$0.80' },
    { key: 'avocado', hash: 3, val: '$2.20' }, // collision with apple
    { key: 'cherry', hash: 5, val: '$3.00' },
  ];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Hash Table Collision Resolution (Separate Chaining vs Linear Probing)
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setMethod('chaining')}
            style={{ padding: '4px 10px', borderRadius: '6px', border: method === 'chaining' ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)', background: method === 'chaining' ? 'rgba(251,191,36,0.18)' : 'rgba(255,255,255,0.04)', color: method === 'chaining' ? '#fbbf24' : 'var(--ifm-color-content-secondary)', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
          >
            Separate Chaining
          </button>
          <button
            onClick={() => setMethod('probing')}
            style={{ padding: '4px 10px', borderRadius: '6px', border: method === 'probing' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', background: method === 'probing' ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.04)', color: method === 'probing' ? '#38bdf8' : 'var(--ifm-color-content-secondary)', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
          >
            Open Addressing (Linear Probing)
          </button>
        </div>
      </div>

      {/* Key selector */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>Select Key to Insert / Lookup:</span>
        {keys.map((k) => (
          <button
            key={k.key}
            onClick={() => setSelectedKey(k.key)}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: selectedKey === k.key ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)',
              background: selectedKey === k.key ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.03)',
              color: selectedKey === k.key ? '#fbbf24' : '#e2e8f0',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            "{k.key}" (hash % 8 = {k.hash})
          </button>
        ))}
      </div>

      {/* SVG Canvas */}
      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 600 200" style={{ width: '100%', minWidth: '480px', height: 'auto' }}>
          <text x="20" y="24" fill="#94a3b8" fontSize="11" fontWeight="700">Hash Buckets (Table Size = 8)</text>

          {/* 8 Buckets */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((bIdx) => {
            const isMatchBucket = (selectedKey === 'apple' || selectedKey === 'avocado') ? bIdx === 3 : (selectedKey === 'banana' ? bIdx === 1 : bIdx === 5);
            return (
              <g key={`b-${bIdx}`} transform={`translate(20, ${40 + bIdx * 19})`}>
                <rect width="60" height="16" rx="3" fill={isMatchBucket ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.03)'} stroke={isMatchBucket ? '#fbbf24' : 'rgba(255,255,255,0.1)'} />
                <text x="30" y="12" textAnchor="middle" fill={isMatchBucket ? '#fbbf24' : '#64748b'} fontSize="10" fontWeight="700">[{bIdx}]</text>

                {/* Chaining Elements */}
                {method === 'chaining' ? (
                  <>
                    {bIdx === 1 && (
                      <g transform="translate(70, 0)">
                        <line x1="0" y1="8" x2="20" y2="8" stroke="#34d399" strokeWidth="1.5" />
                        <rect x="20" width="100" height="16" rx="3" fill="rgba(52,211,153,0.15)" stroke="#34d399" />
                        <text x="70" y="12" textAnchor="middle" fill="#34d399" fontSize="10">banana: $0.80</text>
                      </g>
                    )}
                    {bIdx === 3 && (
                      <g transform="translate(70, 0)">
                        <line x1="0" y1="8" x2="20" y2="8" stroke="#fbbf24" strokeWidth="1.5" />
                        <rect x="20" width="90" height="16" rx="3" fill="rgba(251,191,36,0.2)" stroke="#fbbf24" />
                        <text x="65" y="12" textAnchor="middle" fill="#fbbf24" fontSize="10">apple: $1.50</text>

                        <line x1="110" y1="8" x2="130" y2="8" stroke="#f87171" strokeWidth="1.5" />
                        <rect x="130" width="105" height="16" rx="3" fill="rgba(248,113,113,0.2)" stroke="#f87171" />
                        <text x="182" y="12" textAnchor="middle" fill="#f87171" fontSize="10">avocado: $2.20</text>
                      </g>
                    )}
                    {bIdx === 5 && (
                      <g transform="translate(70, 0)">
                        <line x1="0" y1="8" x2="20" y2="8" stroke="#38bdf8" strokeWidth="1.5" />
                        <rect x="20" width="90" height="16" rx="3" fill="rgba(56,189,248,0.15)" stroke="#38bdf8" />
                        <text x="65" y="12" textAnchor="middle" fill="#38bdf8" fontSize="10">cherry: $3.00</text>
                      </g>
                    )}
                  </>
                ) : (
                  /* Linear Probing */
                  <>
                    {bIdx === 1 && <text x="75" y="12" fill="#34d399" fontSize="10">→ banana: $0.80</text>}
                    {bIdx === 3 && <text x="75" y="12" fill="#fbbf24" fontSize="10">→ apple: $1.50</text>}
                    {bIdx === 4 && <text x="75" y="12" fill="#f87171" fontSize="10">→ avocado: $2.20 (Probed from [3] to [4])</text>}
                    {bIdx === 5 && <text x="75" y="12" fill="#38bdf8" fontSize="10">→ cherry: $3.00</text>}
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-amber" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '13px', marginBottom: '4px' }}>
          Collision Resolution Strategy: {method === 'chaining' ? 'Separate Chaining (Linked Nodes / Red-Black Tree)' : 'Open Addressing with Linear Probing'}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          {method === 'chaining' ? 'Colliding entries form a linked bucket (or TreeBin when count >= 8 in Java HashMap). Load factor threshold = 0.75.' : 'Collisions probe sequentially (i + 1) % N until an empty slot is located. Requires low load factor to avoid primary clustering.'}
        </div>
      </div>
    </div>
  );
}
