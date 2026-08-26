import React, { useState } from 'react';

export default function DsaWeek9BinarySearchDiagram(): React.JSX.Element {
  const [target, setTarget] = useState<number>(14);
  const [step, setStep] = useState<number>(0);

  const arr = [2, 5, 8, 12, 14, 19, 23, 31, 42];

  // Simulation steps for Target 14:
  // Step 0: L=0, R=8, Mid=4 (14) → Found!
  const simSteps = [
    { L: 0, R: 8, mid: 4, midVal: 14, desc: 'Init: L=0, R=8. Mid = 4 (Value = 14). target 14 == arr[4] → FOUND in 1 comparison!' },
    { L: 0, R: 3, mid: 1, midVal: 5, desc: 'If target was 8: L=0, R=3. Mid = 1 (Value = 5). 8 > 5 → L = mid + 1 = 2.' },
    { L: 2, R: 3, mid: 2, midVal: 8, desc: 'L=2, R=3. Mid = 2 (Value = 8). target 8 == arr[2] → FOUND in 2 comparisons!' },
  ];

  const active = simSteps[Math.min(step, simSteps.length - 1)];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Binary Search Bisecting Search Space
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setStep(0)} style={{ padding: '3px 8px', borderRadius: '5px', border: step === 0 ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#38bdf8', fontSize: '11px', cursor: 'pointer' }}>
            Target 14
          </button>
          <button onClick={() => setStep(1)} style={{ padding: '3px 8px', borderRadius: '5px', border: step >= 1 ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#34d399', fontSize: '11px', cursor: 'pointer' }}>
            Target 8 (2 Steps)
          </button>
        </div>
      </div>

      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 600 130" style={{ width: '100%', minWidth: '480px', height: 'auto' }}>
          {arr.map((val, i) => {
            const inRange = i >= active.L && i <= active.R;
            const isMid = i === active.mid;
            return (
              <g key={`bs-${i}`} transform={`translate(${40 + i * 58}, 40)`}>
                <rect width="48" height="36" rx="6" fill={isMid ? 'rgba(52,211,153,0.3)' : inRange ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.02)'} stroke={isMid ? '#34d399' : inRange ? '#38bdf8' : 'rgba(255,255,255,0.08)'} strokeWidth={isMid ? 2 : 1} />
                <text x="24" y="23" textAnchor="middle" fill={isMid ? '#34d399' : inRange ? '#38bdf8' : '#475569'} fontSize="13" fontWeight="700">{val}</text>
                <text x="24" y="48" textAnchor="middle" fill="#64748b" fontSize="9">i={i}</text>
                {i === active.L && <text x="24" y="-8" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="700">L ↓</text>}
                {i === active.R && <text x="24" y="-8" textAnchor="middle" fill="#f87171" fontSize="10" fontWeight="700">R ↓</text>}
                {isMid && <text x="24" y="65" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="700">MID ↑</text>}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-blue" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: '13px', marginBottom: '4px' }}>
          {active.desc}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          Search Space Halving: N → N/2 → N/4 → 1. Guarantees O(log N) Time Complexity.
        </div>
      </div>
    </div>
  );
}
