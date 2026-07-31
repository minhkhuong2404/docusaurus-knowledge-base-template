import React, { useState } from 'react';

export default function GitFetchVsPullDiagram(): React.JSX.Element {
  const [cmd, setCmd] = useState<'fetch' | 'pull'>('fetch');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="8 17 12 21 16 17"/>
          <line x1="12" y1="12" x2="12" y2="21"/>
          <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Remote Syncing: `git fetch` vs `git pull` Protocol Simulator
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setCmd('fetch')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: cmd === 'fetch' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', backgroundColor: cmd === 'fetch' ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            `git fetch` (Safe: Downloads to `origin/main`)
          </button>
          <button onClick={() => setCmd('pull')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: cmd === 'pull' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)', backgroundColor: cmd === 'pull' ? 'rgba(52, 211, 153, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            `git pull` (`git fetch` + `git merge`)
          </button>
        </div>

        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {cmd === 'fetch' ? (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>`git fetch origin`</div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content)', margin: 0 }}>Downloads remote commits to your local `.git` database and updates tracking branch `origin/main`. Does NOT modify your local working files or current branch!</p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>`git pull origin main`</div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content)', margin: 0 }}>Step 1: Executes `git fetch origin`. Step 2: Instantly executes `git merge origin/main` into your current working branch, modifying your files.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
