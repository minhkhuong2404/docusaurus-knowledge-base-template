import React, { useState } from 'react';

export default function GitRebaseInternalsDiagram(): React.JSX.Element {
  const [step, setStep] = useState<number>(1);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="17 1 21 5 17 9"/>
          <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
          <polyline points="7 23 3 19 7 15"/>
          <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Rebase Replay Protocol Simulator (`git rebase main`)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setStep(1)} style={{ padding: '8px', borderRadius: '6px', border: step === 1 ? '1px solid #a78bfa' : '1px solid rgba(255,255,255,0.1)', backgroundColor: step === 1 ? 'rgba(167, 139, 250, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11.5px', cursor: 'pointer' }}>
            1. Save Commits to Temporary Patch
          </button>
          <button onClick={() => setStep(2)} style={{ padding: '8px', borderRadius: '6px', border: step === 2 ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', backgroundColor: step === 2 ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11.5px', cursor: 'pointer' }}>
            2. Reset Feature Branch to `main`
          </button>
          <button onClick={() => setStep(3)} style={{ padding: '8px', borderRadius: '6px', border: step === 3 ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)', backgroundColor: step === 3 ? 'rgba(52, 211, 153, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11.5px', cursor: 'pointer' }}>
            3. Replay Patches One by One
          </button>
        </div>

        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {step === 1 && <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ifm-color-content)' }}>Step 1: Git finds the common ancestor and temporarily saves feature branch commits (F1, F2) as patch files in `.git/rebase-apply/`.</p>}
          {step === 2 && <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ifm-color-content)' }}>Step 2: Git resets your current feature branch pointer to match the latest tip of `main` (C3).</p>}
          {step === 3 && <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ifm-color-content)' }}>Step 3: Git applies patches F1 and F2 sequentially on top of C3, generating brand new commit SHA-1 hashes (F1', F2'). Clean linear history!</p>}
        </div>
      </div>
    </div>
  );
}
