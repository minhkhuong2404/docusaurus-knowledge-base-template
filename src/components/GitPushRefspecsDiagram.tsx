import React, { useState } from 'react';

export default function GitPushRefspecsDiagram(): React.JSX.Element {
  const [flag, setFlag] = useState<'normal' | 'lease' | 'force'>('lease');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 16 12 12 8 16"/>
          <line x1="12" y1="12" x2="12" y2="21"/>
          <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Push Mechanics & Force Guard (`--force-with-lease` vs `--force`)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setFlag('normal')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: flag === 'normal' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', backgroundColor: flag === 'normal' ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            `git push` (Fast-Forward Only)
          </button>
          <button onClick={() => setFlag('lease')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: flag === 'lease' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)', backgroundColor: flag === 'lease' ? 'rgba(52, 211, 153, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            `--force-with-lease` (Safe Force)
          </button>
          <button onClick={() => setFlag('force')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: flag === 'force' ? '1px solid #f87171' : '1px solid rgba(255,255,255,0.1)', backgroundColor: flag === 'force' ? 'rgba(248, 113, 113, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            `--force` (Dangerous Overwrite)
          </button>
        </div>

        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {flag === 'normal' && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>Standard Push</div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content)', margin: 0 }}>Pushes commits only if remote branch can be fast-forwarded. If remote has new commits, push is rejected with <code>[rejected - non-fast-forward]</code>.</p>
            </div>
          )}
          {flag === 'lease' && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>`--force-with-lease` (Recommended)</div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content)', margin: 0 }}>Checks if remote ref matches your local `origin/main` tracking pointer. Refuses force-push if a teammate pushed new commits you haven't fetched yet!</p>
            </div>
          )}
          {flag === 'force' && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f87171', marginBottom: '4px' }}>`--force` (Dangerous)</div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content)', margin: 0 }}>Blindly overwrites remote branch pointer regardless of teammate commits. Can cause irreversible loss of remote commit history for your team!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
