import React, { useState } from 'react';

export default function GitWorktreeDiagram(): React.JSX.Element {
  const [activeTree, setActiveTree] = useState<'main' | 'hotfix' | 'feature'>('main');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          `git worktree` Multiple Linked Working Trees Inspector
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setActiveTree('main')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: activeTree === 'main' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', backgroundColor: activeTree === 'main' ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            Main Directory (`~/project/main`)
          </button>
          <button onClick={() => setActiveTree('hotfix')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: activeTree === 'hotfix' ? '1px solid #f87171' : '1px solid rgba(255,255,255,0.1)', backgroundColor: activeTree === 'hotfix' ? 'rgba(248, 113, 113, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            Worktree 2 (`~/project/hotfix`)
          </button>
          <button onClick={() => setActiveTree('feature')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: activeTree === 'feature' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)', backgroundColor: activeTree === 'feature' ? 'rgba(52, 211, 153, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            Worktree 3 (`~/project/feature-v2`)
          </button>
        </div>

        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
            Shared `.git` Database Location:
          </div>
          <div style={{ fontSize: '12.5px', fontFamily: 'monospace', color: '#34d399', marginBottom: '8px' }}>
            ~/project/main/.git/objects (Single shared object store, ZERO duplicate disk clones!)
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)' }}>
            Command: <code>git worktree add ../hotfix main</code> allows editing hotfixes simultaneously without stashing or switching branches!
          </div>
        </div>
      </div>
    </div>
  );
}
