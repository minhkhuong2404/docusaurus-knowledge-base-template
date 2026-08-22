import React, { useState } from 'react';

export default function DsaWeek15AdvancedSlidingWindowDiagram(): React.JSX.Element {
  const [step, setStep] = useState<number>(0);

  const steps = [
    { L: 0, R: 5, win: 'ADOBEC', matched: 'A,B,C', desc: 'Expand R to index 5 ("ADOBEC") → All target characters {A,B,C} matched! Valid window found (len=6).' },
    { L: 1, R: 5, win: 'DOBEC', matched: 'B,C', desc: 'Shrink L to 1 ("DOBEC") → "A" count drops below requirement → Window invalid, expand R again.' },
    { L: 9, R: 12, win: 'BANC', matched: 'A,B,C', desc: 'Later optimal window at [9..12] ("BANC") → Len = 4 (Global Minimum Window Substring!).' },
  ];

  const active = steps[step];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
          <polyline points="17 2 12 7 7 2" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Minimum Window Substring Dynamic Frequency Match
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          {steps.map((_, i) => (
            <button key={i} onClick={() => setStep(i)} style={{ padding: '3px 8px', borderRadius: '5px', border: step === i ? '1px solid #f472b6' : '1px solid rgba(255,255,255,0.1)', background: step === i ? 'rgba(244,114,182,0.2)' : 'transparent', color: step === i ? '#f472b6' : 'var(--ifm-color-content-secondary)', fontSize: '11px', cursor: 'pointer' }}>
              State {i + 1}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '12px', overflowX: 'auto' }}>
        <svg viewBox="0 0 540 120" style={{ width: '100%', minWidth: '420px', height: 'auto' }}>
          <text x="20" y="25" fill="#94a3b8" fontSize="11" fontWeight="700">Target: "ABC" | Current Window Substring:</text>
          <rect x="20" y="45" width="280" height="45" rx="8" fill="rgba(244,114,182,0.2)" stroke="#f472b6" strokeWidth="2" />
          <text x="160" y="73" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="700">"{active.win}"</text>

          <g transform="translate(330, 45)">
            <rect width="180" height="45" rx="8" fill="rgba(52,211,153,0.15)" stroke="#34d399" />
            <text x="90" y="22" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="700">Matched Characters</text>
            <text x="90" y="38" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">{active.matched}</text>
          </g>
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-pink" style={{ padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ fontWeight: 700, color: '#f472b6', fontSize: '13px', marginBottom: '4px' }}>
          {active.desc}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          Two Pointers + Hash Map Counter enables linear O(N) scan without redundant re-checks.
        </div>
      </div>
    </div>
  );
}
