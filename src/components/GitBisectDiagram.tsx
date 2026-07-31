import React, { useState } from 'react';

export default function GitBisectDiagram(): React.JSX.Element {
  const [step, setStep] = useState<number>(1);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          `git bisect` Binary Search Bug Finder Simulator ($O(\log N)$ Steps)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setStep(1)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: step === 1 ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', backgroundColor: step === 1 ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11.5px', cursor: 'pointer' }}>
            Step 1: 1000 Commits ➔ Test Midpoint #500
          </button>
          <button onClick={() => setStep(2)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: step === 2 ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)', backgroundColor: step === 2 ? 'rgba(251, 191, 36, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11.5px', cursor: 'pointer' }}>
            Step 2: #500 is GOOD ➔ Test Midpoint #750
          </button>
          <button onClick={() => setStep(3)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: step === 3 ? '1px solid #f87171' : '1px solid rgba(255,255,255,0.1)', backgroundColor: step === 3 ? 'rgba(248, 113, 113, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11.5px', cursor: 'pointer' }}>
            Found Bad Commit in 10 Steps!
          </button>
        </div>

        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {step === 1 && <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content)' }}>Range: 1000 commits. `git bisect` checks out commit #500. Run automated test.</p>}
          {step === 2 && <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ifm-color-content)' }}>Mark `#500 good`. Range reduced by half (commits #501 to #1000). Checks out #750.</p>}
          {step === 3 && <p style={{ margin: 0, fontSize: '12.5px', color: '#34d399', fontWeight: 700 }}>`c8f7e6 is the first bad commit`! Located regression in 10 tests instead of 1000 manual checks!</p>}
        </div>
      </div>
    </div>
  );
}
