import React, { useState } from 'react';

export default function RedisBitmapBitopDiagram(): React.JSX.Element {
  const [operation, setOperation] = useState<'AND' | 'OR' | 'XOR'>('AND');

  const jan14Bits = [1, 1, 0, 1, 0, 1, 0, 0]; // Users 1..8
  const jan15Bits = [1, 0, 0, 1, 1, 1, 0, 1];

  const computeResult = (op: 'AND' | 'OR' | 'XOR') => {
    return jan14Bits.map((b1, idx) => {
      const b2 = jan15Bits[idx];
      if (op === 'AND') return b1 & b2;
      if (op === 'OR') return b1 | b2;
      return b1 ^ b2;
    });
  };

  const resultBits = computeResult(operation);
  const activeCount = resultBits.filter((b) => b === 1).length;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2"/>
          <rect x="2" y="14" width="20" height="8" rx="2"/>
          <line x1="6" y1="6" x2="6" y2="6.01"/>
          <line x1="6" y1="18" x2="6" y2="18.01"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Redis Bitmap Bitwise Set Algebra (`BITOP AND / OR / XOR`)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Operation Selector */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {(['AND', 'OR', 'XOR'] as const).map((op) => {
            const isSelected = op === operation;
            return (
              <button
                key={op}
                onClick={() => setOperation(op)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '6px',
                  border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17',
                  color: isSelected ? '#fff' : 'var(--ifm-color-content-secondary)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                BITOP {op} {op === 'AND' ? '(Retention)' : op === 'OR' ? '(Total Reach)' : '(Churn/New)'}
              </button>
            );
          })}
        </div>

        {/* Bit Arrays Grid */}
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px' }}>
          {/* Jan 14 */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
              Bitmap 1: dau:2026-01-14 (Users 1..8)
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {jan14Bits.map((b, idx) => (
                <div key={idx} style={{ flex: 1, textAlign: 'center', padding: '6px', borderRadius: '4px', backgroundColor: b === 1 ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.03)', border: b === 1 ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.05)', color: b === 1 ? '#38bdf8' : 'var(--ifm-color-content-secondary)', fontWeight: 700, fontSize: '12px' }}>
                  U{idx + 1}: {b}
                </div>
              ))}
            </div>
          </div>

          {/* Jan 15 */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
              Bitmap 2: dau:2026-01-15 (Users 1..8)
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {jan15Bits.map((b, idx) => (
                <div key={idx} style={{ flex: 1, textAlign: 'center', padding: '6px', borderRadius: '4px', backgroundColor: b === 1 ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.03)', border: b === 1 ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.05)', color: b === 1 ? '#fbbf24' : 'var(--ifm-color-content-secondary)', fontWeight: 700, fontSize: '12px' }}>
                  U{idx + 1}: {b}
                </div>
              ))}
            </div>
          </div>

          {/* Result Array */}
          <div style={{ paddingTop: '8px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
              Result Bitmap: BITOP {operation} output (BITCOUNT = {activeCount})
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {resultBits.map((b, idx) => (
                <div key={idx} style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: '4px', backgroundColor: b === 1 ? 'rgba(52, 211, 153, 0.25)' : 'rgba(255,255,255,0.03)', border: b === 1 ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.05)', color: b === 1 ? '#34d399' : 'var(--ifm-color-content-secondary)', fontWeight: 700, fontSize: '13px' }}>
                  {b}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Command Box */}
        <div style={{ fontSize: '12px', fontFamily: 'monospace', backgroundColor: '#05070e', padding: '10px 12px', borderRadius: '6px', color: '#34d399', border: '1px solid rgba(255,255,255,0.05)' }}>
          BITOP {operation} result_key dau:2026-01-14 dau:2026-01-15 &amp;&amp; BITCOUNT result_key -&gt; {activeCount}
        </div>
      </div>
    </div>
  );
}
