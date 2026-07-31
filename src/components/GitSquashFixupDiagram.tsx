import React, { useState } from 'react';

export default function GitSquashFixupDiagram(): React.JSX.Element {
  const [squashed, setSquashed] = useState<boolean>(false);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 14 10 14 10 20"/>
          <polyline points="20 10 14 10 14 4"/>
          <line x1="14" y1="10" x2="21" y2="3"/>
          <line x1="3" y1="21" x2="10" y2="14"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Interactive Rebase Autosquash (`git commit --fixup` & `squash`)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ backgroundColor: '#05070e', padding: '10px 12px', borderRadius: '6px', fontSize: '11.5px', fontFamily: 'monospace', color: '#e2e8f0', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          {squashed ? (
            <div style={{ color: '#34d399', fontWeight: 700 }}>
              pick a1b2c3d feat: add OAuth2 login (Combined 3 commits into 1 single clean commit!)
            </div>
          ) : (
            <div>
              <div>pick a1b2c3d feat: add OAuth2 login</div>
              <div style={{ color: '#fbbf24' }}>fixup e5f6g7h fixup! typo fix</div>
              <div style={{ color: '#fbbf24' }}>fixup 9x8y7z6 fixup! minor formatting</div>
            </div>
          )}
        </div>

        <button
          onClick={() => setSquashed(!squashed)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '6px',
            backgroundColor: squashed ? '#34d399' : '#fbbf24',
            color: '#000',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {squashed ? 'Reset Commit List' : '⚡ Run `git rebase -i --autosquash HEAD~3`'}
        </button>
      </div>
    </div>
  );
}
