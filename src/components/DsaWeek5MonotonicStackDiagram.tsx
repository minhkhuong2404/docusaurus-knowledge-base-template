import React, { useState, useEffect } from 'react';

export default function DsaWeek5MonotonicStackDiagram(): React.JSX.Element {
  const [step, setStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const arr = [2, 1, 2, 4, 3];
  // Next Greater Element simulation:
  const simSteps = [
    { i: 0, val: 2, stack: [2], result: [-1, -1, -1, -1, -1], desc: 'Push 2 onto stack. Stack: [2]' },
    { i: 1, val: 1, stack: [2, 1], result: [-1, -1, -1, -1, -1], desc: '1 < 2 → Monotonic decreasing invariant maintained. Push 1. Stack: [2, 1]' },
    { i: 2, val: 2, stack: [2, 2], result: [-1, 2, -1, -1, -1], desc: '2 > top(1) → Pop 1. Next greater for 1 is 2! Push 2. Stack: [2, 2]' },
    { i: 3, val: 4, stack: [4], result: [4, 2, 4, -1, -1], desc: '4 > top(2) → Pop 2 (NGE=4), Pop 2 (NGE=4). Push 4. Stack: [4]' },
    { i: 4, val: 3, stack: [4, 3], result: [4, 2, 4, -1, -1], desc: '3 &lt; 4 → Push 3. Stack: [4, 3]. Complete! Unmatched elements get -1.' },
  ];

  useEffect(() => {
    let t: any;
    if (isPlaying) {
      t = setInterval(() => {
        setStep((s) => {
          if (s >= simSteps.length - 1) { setIsPlaying(false); return s; }
          return s + 1;
        });
      }, 1500);
    }
    return () => clearInterval(t);
  }, [isPlaying]);

  const active = simSteps[Math.min(step, simSteps.length - 1)];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Monotonic Stack Simulation (Next Greater Element)
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setIsPlaying(!isPlaying)} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: isPlaying ? '#fbbf24' : '#f87171', color: '#090b14', fontWeight: 700, fontSize: '11.5px', cursor: 'pointer' }}>
            {isPlaying ? '⏸ Pause' : '▶ Animate'}
          </button>
          <button onClick={() => { setIsPlaying(false); setStep(0); }} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--ifm-color-content)', fontSize: '11.5px', cursor: 'pointer' }}>
            🔄 Reset
          </button>
        </div>
      </div>

      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 580 160" style={{ width: '100%', minWidth: '460px', height: 'auto' }}>
          {/* Input Array */}
          <text x="20" y="25" fill="#94a3b8" fontSize="11" fontWeight="700">Input Array:</text>
          {arr.map((v, idx) => {
            const isCur = idx === active.i;
            return (
              <g key={`arr-${idx}`} transform={`translate(${110 + idx * 55}, 10)`}>
                <rect width="45" height="30" rx="5" fill={isCur ? 'rgba(248,113,113,0.25)' : 'rgba(255,255,255,0.03)'} stroke={isCur ? '#f87171' : 'rgba(255,255,255,0.1)'} />
                <text x="22" y="20" textAnchor="middle" fill={isCur ? '#f87171' : '#e2e8f0'} fontSize="13" fontWeight="700">{v}</text>
              </g>
            );
          })}

          {/* Monotonic Stack Container */}
          <text x="20" y="90" fill="#38bdf8" fontSize="11" fontWeight="700">Monotonic Stack:</text>
          <rect x="130" y="70" width="180" height="35" rx="6" fill="rgba(56,189,248,0.05)" stroke="#38bdf8" strokeDasharray="3 3" />
          {active.stack.map((sVal, sIdx) => (
            <g key={`stack-${sIdx}`} transform={`translate(${140 + sIdx * 45}, 75)`}>
              <rect width="38" height="25" rx="4" fill="rgba(56,189,248,0.2)" stroke="#38bdf8" />
              <text x="19" y="17" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="700">{sVal}</text>
            </g>
          ))}

          {/* Output NGE */}
          <text x="20" y="145" fill="#34d399" fontSize="11" fontWeight="700">Next Greater Result:</text>
          {active.result.map((resVal, rIdx) => (
            <g key={`res-${rIdx}`} transform={`translate(${145 + rIdx * 55}, 130)`}>
              <rect width="45" height="22" rx="4" fill="rgba(52,211,153,0.15)" stroke="#34d399" />
              <text x="22" y="16" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="700">{resVal}</text>
            </g>
          ))}
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-red" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#f87171', fontSize: '13px', marginBottom: '4px' }}>
          {active.desc}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          Each element is pushed and popped at most once → O(N) Total Time Complexity.
        </div>
      </div>
    </div>
  );
}
