import React, { useState } from 'react';

export default function GitLogBlameExplorerDiagram(): React.JSX.Element {
  const [view, setView] = useState<'log' | 'blame'>('log');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Log Graph & Line Attribution Inspector (`git log` vs `git blame`)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setView('log')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: view === 'log' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', backgroundColor: view === 'log' ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            `git log --graph --oneline --all`
          </button>
          <button onClick={() => setView('blame')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: view === 'blame' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)', backgroundColor: view === 'blame' ? 'rgba(52, 211, 153, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            `git blame -L 10,15 app.js`
          </button>
        </div>

        <pre style={{ margin: 0, padding: '12px', backgroundColor: '#05070e', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.05)' }}>
          <code>
            {view === 'log'
              ? `*   a1b2c3d (HEAD -> main) Merge pull request #42\n|\\  \n| * e5f6g7h (feature/auth) feat: add OAuth2 handler\n* | 9x8y7z6 fix: resolve memory leak in connection pool\n|/  \n* 1a2b3c4 Initial commit`
              : `a1b2c3d (Alice  2026-07-15) 10: const db = connect();\ne5f6g7h (Bob    2026-07-20) 11: function queryUser(id) {\n9x8y7z6 (Carol  2026-07-31) 12:   return db.execute("SELECT...", [id]);\ne5f6g7h (Bob    2026-07-20) 13: }`}
          </code>
        </pre>
      </div>
    </div>
  );
}
