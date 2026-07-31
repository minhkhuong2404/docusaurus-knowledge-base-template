import React, { useState } from 'react';

export default function GitCherryPickDiagram(): React.JSX.Element {
  const [picked, setPicked] = useState<boolean>(false);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v8M8 12h8"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          `git cherry-pick` Single Commit Patch Extraction Tool
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ backgroundColor: '#0c0e17', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>Feature Branch Commit:</div>
          <div style={{ fontSize: '12.5px', color: '#f87171', fontWeight: 700, fontFamily: 'monospace' }}>Commit `f4e3d2c`: Hotfix critical billing bug</div>
        </div>

        <button
          onClick={() => setPicked(!picked)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '6px',
            backgroundColor: picked ? '#34d399' : '#f87171',
            color: '#000',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {picked ? '✅ Cherry-Picked! `f4e3d2c` applied to `main` as new commit' : '🍒 Run `git cherry-pick f4e3d2c` onto `main`'}
        </button>
      </div>
    </div>
  );
}
