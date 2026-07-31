import React, { useState } from 'react';

export default function GitResetVsRevertDiagram(): React.JSX.Element {
  const [mode, setMode] = useState<'soft' | 'mixed' | 'hard' | 'revert'>('soft');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 2v6h6"/>
          <path d="M3 13a9 9 0 1 0 3-7.7L3 8"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Reset (`--soft / --mixed / --hard`) vs Safe `git revert`
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '16px' }}>
          <button onClick={() => setMode('soft')} style={{ padding: '8px 4px', borderRadius: '6px', border: mode === 'soft' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', backgroundColor: mode === 'soft' ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>
            `reset --soft`
          </button>
          <button onClick={() => setMode('mixed')} style={{ padding: '8px 4px', borderRadius: '6px', border: mode === 'mixed' ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)', backgroundColor: mode === 'mixed' ? 'rgba(251, 191, 36, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>
            `reset --mixed`
          </button>
          <button onClick={() => setMode('hard')} style={{ padding: '8px 4px', borderRadius: '6px', border: mode === 'hard' ? '1px solid #f87171' : '1px solid rgba(255,255,255,0.1)', backgroundColor: mode === 'hard' ? 'rgba(248, 113, 113, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>
            `reset --hard`
          </button>
          <button onClick={() => setMode('revert')} style={{ padding: '8px 4px', borderRadius: '6px', border: mode === 'revert' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)', backgroundColor: mode === 'revert' ? 'rgba(52, 211, 153, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>
            `git revert`
          </button>
        </div>

        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {mode === 'soft' && <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content)' }}>Moves HEAD back 1 commit. Leaves all uncommitted changes STAGED in the Index. Ideal for uncommitting to change commit message.</p>}
          {mode === 'mixed' && <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content)' }}>Default mode. Moves HEAD back 1 commit AND resets Staging Area. Changes are kept UNSTAGED in Working Directory.</p>}
          {mode === 'hard' && <p style={{ margin: 0, fontSize: '12px', color: '#f87171' }}>⚠️ DANGEROUS! Moves HEAD back 1 commit, resets Staging Area, AND WIPES ALL UNCOMMITTED CHANGES from Working Directory!</p>}
          {mode === 'revert' && <p style={{ margin: 0, fontSize: '12px', color: '#34d399' }}>✅ SAFE FOR PUBLIC BRANCHES! Creates a brand new commit that plays the inverse patch of target commit. Preserves history integrity!</p>}
        </div>
      </div>
    </div>
  );
}
