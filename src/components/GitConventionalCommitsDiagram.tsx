import React, { useState } from 'react';

export default function GitConventionalCommitsDiagram(): React.JSX.Element {
  const [type, setType] = useState<'feat' | 'fix' | 'docs' | 'refactor' | 'breaking'>('feat');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 7 4 4 20 4 20 7"/>
          <line x1="9" y1="20" x2="15" y2="20"/>
          <line x1="12" y1="4" x2="12" y2="20"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Conventional Commits Specification &amp; Automated SemVer Bumper
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
          {(['feat', 'fix', 'docs', 'refactor', 'breaking'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              style={{
                flex: 1,
                padding: '6px 4px',
                borderRadius: '4px',
                border: type === t ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                backgroundColor: type === t ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17',
                color: '#fff',
                fontSize: '11px',
                fontWeight: type === t ? 700 : 400,
                cursor: 'pointer',
              }}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={{ backgroundColor: '#05070e', padding: '12px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', color: '#38bdf8', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          {type === 'feat' && 'feat(auth): add Google OAuth2 login support (Bumps MINOR version: 1.2.0 -> 1.3.0)'}
          {type === 'fix' && 'fix(api): handle null response payload gracefully (Bumps PATCH version: 1.2.0 -> 1.2.1)'}
          {type === 'docs' && 'docs(readme): update deployment instructions (No SemVer bump)'}
          {type === 'refactor' && 'refactor(db): simplify connection pool initialization (No SemVer bump)'}
          {type === 'breaking' && 'feat(api)!: remove deprecated v1 user endpoint\n\nBREAKING CHANGE: v1 API is removed (Bumps MAJOR version: 1.2.0 -> 2.0.0)'}
        </div>
      </div>
    </div>
  );
}
