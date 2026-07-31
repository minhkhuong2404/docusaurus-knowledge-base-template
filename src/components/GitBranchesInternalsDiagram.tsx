import React, { useState } from 'react';

export default function GitBranchesInternalsDiagram(): React.JSX.Element {
  const [activeBranch, setActiveBranch] = useState<'main' | 'feature'>('main');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="6" y1="3" x2="6" y2="15"/>
          <circle cx="18" cy="6" r="3"/>
          <circle cx="6" cy="18" r="3"/>
          <path d="M18 9a9 9 0 0 1-9 9"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Branch & HEAD Pointer Mechanics (`.git/HEAD` & `.git/refs/heads/`)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setActiveBranch('main')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: activeBranch === 'main' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', backgroundColor: activeBranch === 'main' ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            `git switch main`
          </button>
          <button onClick={() => setActiveBranch('feature')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: activeBranch === 'feature' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)', backgroundColor: activeBranch === 'feature' ? 'rgba(52, 211, 153, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            `git switch feature`
          </button>
        </div>

        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
            Contents of file <code>.git/HEAD</code>:
          </div>
          <div style={{ fontSize: '13px', fontFamily: 'monospace', color: '#38bdf8', marginBottom: '12px' }}>
            ref: refs/heads/{activeBranch}
          </div>

          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
            Contents of file <code>.git/refs/heads/{activeBranch}</code>:
          </div>
          <div style={{ fontSize: '13px', fontFamily: 'monospace', color: '#34d399' }}>
            {activeBranch === 'main' ? '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e (Commit C2)' : '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b (Commit C4)'}
          </div>
        </div>
      </div>
    </div>
  );
}
