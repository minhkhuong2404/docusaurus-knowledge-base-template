import React, { useState } from 'react';

export default function GitStatusDiffDiagram(): React.JSX.Element {
  const [diffType, setDiffType] = useState<'unstaged' | 'staged'>('unstaged');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="9" x2="20" y2="9"/>
          <line x1="4" y1="15" x2="20" y2="15"/>
          <line x1="10" y1="3" x2="8" y2="21"/>
          <line x1="16" y1="3" x2="14" y2="21"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Status & Unified Diff Inspector (`git diff` vs `git diff --staged`)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setDiffType('unstaged')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: diffType === 'unstaged' ? '1px solid #f87171' : '1px solid rgba(255,255,255,0.1)', backgroundColor: diffType === 'unstaged' ? 'rgba(248, 113, 113, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            `git diff` (Working Directory vs Staging Area)
          </button>
          <button onClick={() => setDiffType('staged')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: diffType === 'staged' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)', backgroundColor: diffType === 'staged' ? 'rgba(52, 211, 153, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            `git diff --staged` (Staging Area vs HEAD)
          </button>
        </div>

        <pre style={{ margin: 0, padding: '12px', backgroundColor: '#05070e', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.05)', overflowX: 'auto' }}>
          <code>
            {diffType === 'unstaged'
              ? `diff --git a/app.js b/app.js\n--- a/app.js\n+++ b/app.js\n@@ -10,3 +10,4 @@\n- console.log("Old code");\n+ console.log("New unstaged modification");`
              : `diff --git a/README.md b/README.md\n--- a/README.md\n+++ b/README.md\n@@ -1,2 +1,3 @@\n # My Project\n+ Added staged documentation section ready for commit.`}
          </code>
        </pre>
      </div>
    </div>
  );
}
