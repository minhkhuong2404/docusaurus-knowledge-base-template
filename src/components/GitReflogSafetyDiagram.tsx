import React, { useState } from 'react';

export default function GitReflogSafetyDiagram(): React.JSX.Element {
  const [recovered, setRecovered] = useState<boolean>(false);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          `git reflog` Emergency Safety Net & Lost Commit Recovery Simulator
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ backgroundColor: '#05070e', padding: '10px 12px', borderRadius: '6px', fontSize: '11.5px', fontFamily: 'monospace', color: '#e2e8f0', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div>HEAD@&#123;0&#125;: reset: moving to HEAD~1 (Accidental hard reset!)</div>
          <div style={{ color: '#fbbf24' }}>HEAD@&#123;1&#125;: commit: feat: critical unpushed feature (a9b8c7d)</div>
          <div>HEAD@&#123;2&#125;: checkout: moving from main to feature</div>
        </div>

        <button
          onClick={() => setRecovered(!recovered)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '6px',
            backgroundColor: recovered ? '#34d399' : '#38bdf8',
            color: '#000',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {recovered ? '✅ RECOVERED! `git checkout -b feature-recovered HEAD@{1}`' : '⚡ Execute Recovery Command'}
        </button>
      </div>
    </div>
  );
}
