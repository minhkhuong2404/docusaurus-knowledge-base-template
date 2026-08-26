import React, { useState } from 'react';

export default function DsaWeek19BitManipulationDiagram(): React.JSX.Element {
  const [num, setNum] = useState<number>(12); // binary 1100

  // Brian Kernighan's algorithm: n & (n - 1) clears lowest set bit
  const nMinusOne = num > 0 ? num - 1 : 0;
  const cleared = num & nMinusOne;

  const toBinary = (n: number) => (n >>> 0).toString(2).padStart(8, '0');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 17 10 11 4 5" />
          <line x1="12" y1="19" x2="20" y2="19" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Brian Kernighan's Bit Manipulation Trick (Clear LSB: n & (n - 1))
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          {[12, 14, 25, 40].map((v) => (
            <button key={v} onClick={() => setNum(v)} style={{ padding: '3px 8px', borderRadius: '5px', border: num === v ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', background: num === v ? 'rgba(56,189,248,0.2)' : 'transparent', color: num === v ? '#38bdf8' : 'var(--ifm-color-content-secondary)', fontSize: '11px', cursor: 'pointer' }}>
              n = {v}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: 'var(--ifm-font-family-monospace, monospace)', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(56,189,248,0.1)', borderRadius: '6px' }}>
            <span style={{ color: '#38bdf8', fontWeight: 700 }}>n ({num}):</span>
            <span style={{ color: '#ffffff', letterSpacing: '2px' }}>{toBinary(num)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
            <span style={{ color: '#94a3b8' }}>n - 1 ({nMinusOne}):</span>
            <span style={{ color: '#e2e8f0', letterSpacing: '2px' }}>{toBinary(nMinusOne)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(52,211,153,0.15)', borderRadius: '6px', border: '1px solid #34d399' }}>
            <span style={{ color: '#34d399', fontWeight: 700 }}>n & (n - 1) = {cleared}:</span>
            <span style={{ color: '#34d399', fontWeight: 700, letterSpacing: '2px' }}>{toBinary(cleared)}</span>
          </div>
        </div>
      </div>

      <div className="interactive-diagram-details-card details-blue" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: '13px', marginBottom: '4px' }}>
          Clears the lowest set bit in O(1) CPU instruction cycle!
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          Counting set bits (Hamming Weight) takes O(k) iterations where k is the number of 1-bits, rather than checking all 32 bits.
        </div>
      </div>
    </div>
  );
}
