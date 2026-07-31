import React, { useState } from 'react';

export default function GitConfigAliasesDiagram(): React.JSX.Element {
  const [scope, setScope] = useState<'global' | 'local'>('global');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Configuration Scope Hierarchy (`--global` vs `--local`)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setScope('global')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: scope === 'global' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', backgroundColor: scope === 'global' ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            `~/.gitconfig` (Global)
          </button>
          <button onClick={() => setScope('local')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: scope === 'local' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)', backgroundColor: scope === 'local' ? 'rgba(52, 211, 153, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            `.git/config` (Repository Local)
          </button>
        </div>

        <pre style={{ margin: 0, padding: '12px', backgroundColor: '#05070e', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.05)' }}>
          <code>
            {scope === 'global'
              ? `[user]\n    name = Alice Smith\n    email = alice@company.com\n[alias]\n    st = status\n    co = checkout\n    lg = log --graph --oneline --all`
              : `[user]\n    email = alice@personal-github.com\n[remote "origin"]\n    url = git@github.com:alice/personal-project.git`}
          </code>
        </pre>
      </div>
    </div>
  );
}
