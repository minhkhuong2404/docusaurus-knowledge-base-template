import React, { useState } from 'react';

export default function GitFlowWorkflowDiagram(): React.JSX.Element {
  const [selectedBranch, setSelectedBranch] = useState<'main' | 'develop' | 'feature' | 'release' | 'hotfix'>('develop');

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
          Git Flow Branching Strategy Interactive Inspector
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
          {(['main', 'develop', 'feature', 'release', 'hotfix'] as const).map((b) => (
            <button
              key={b}
              onClick={() => setSelectedBranch(b)}
              style={{
                flex: 1,
                padding: '6px 4px',
                borderRadius: '4px',
                border: selectedBranch === b ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                backgroundColor: selectedBranch === b ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17',
                color: '#fff',
                fontSize: '11px',
                fontWeight: selectedBranch === b ? 700 : 400,
                cursor: 'pointer',
              }}
            >
              {b.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {selectedBranch === 'main' && <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content)' }}><code>main</code>: Stores official production release history. Every commit on main corresponds to a production release with a version tag (`v1.0.0`).</p>}
          {selectedBranch === 'develop' && <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content)' }}><code>develop</code>: Integration branch for features. Contains complete history of upcoming scheduled release.</p>}
          {selectedBranch === 'feature' && <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content)' }}><code>feature/*</code>: Created from `develop`. Used for building new features. Merged back into `develop` via PR.</p>}
          {selectedBranch === 'release' && <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content)' }}><code>release/*</code>: Created from `develop` when feature-complete. Used for bug fixes and release prep. Merged into BOTH `main` and `develop`.</p>}
          {selectedBranch === 'hotfix' && <p style={{ margin: 0, fontSize: '12px', color: '#f87171' }}><code>hotfix/*</code>: Created directly from `main` to patch production emergencies. Merged into BOTH `main` and `develop`.</p>}
        </div>
      </div>
    </div>
  );
}
