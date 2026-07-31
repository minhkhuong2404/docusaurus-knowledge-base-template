import React, { useState } from 'react';

export default function GitHooksPipelineDiagram(): React.JSX.Element {
  const [stage, setStage] = useState<'pre-commit' | 'commit-msg' | 'pre-push' | 'pre-receive'>('pre-commit');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Hooks Execution Pipeline (.git/hooks/)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
          <button onClick={() => setStage('pre-commit')} style={{ flex: 1, padding: '6px 4px', borderRadius: '4px', border: stage === 'pre-commit' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', backgroundColor: stage === 'pre-commit' ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>
            pre-commit
          </button>
          <button onClick={() => setStage('commit-msg')} style={{ flex: 1, padding: '6px 4px', borderRadius: '4px', border: stage === 'commit-msg' ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)', backgroundColor: stage === 'commit-msg' ? 'rgba(251, 191, 36, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>
            commit-msg
          </button>
          <button onClick={() => setStage('pre-push')} style={{ flex: 1, padding: '6px 4px', borderRadius: '4px', border: stage === 'pre-push' ? '1px solid #a78bfa' : '1px solid rgba(255,255,255,0.1)', backgroundColor: stage === 'pre-push' ? 'rgba(167, 139, 250, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>
            pre-push
          </button>
          <button onClick={() => setStage('pre-receive')} style={{ flex: 1, padding: '6px 4px', borderRadius: '4px', border: stage === 'pre-receive' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)', backgroundColor: stage === 'pre-receive' ? 'rgba(52, 211, 153, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>
            pre-receive (Server)
          </button>
        </div>

        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {stage === 'pre-commit' && <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content)' }}>Runs BEFORE commit message prompt. Perfect for running ESLint, Prettier, or secret key scanners. Exit code non-zero aborts commit.</p>}
          {stage === 'commit-msg' && <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content)' }}>Validates commit message format against Conventional Commits regex (e.g. `feat(scope): message`). Exit code non-zero aborts commit.</p>}
          {stage === 'pre-push' && <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content)' }}>Runs BEFORE remote push. Ideal for unit tests and integration test suites. Prevents broken builds from reaching remote repository.</p>}
          {stage === 'pre-receive' && <p style={{ margin: 0, fontSize: '12px', color: '#34d399' }}>SERVER-SIDE hook running on GitHub / GitLab server. Enforces enterprise policy rules before accepting pushes.</p>}
        </div>
      </div>
    </div>
  );
}
