import React, { useState } from 'react';

export default function GitStashStackDiagram(): React.JSX.Element {
  const [stashes, setStashes] = useState<string[]>([
    'WIP on main: WIP feature B changes',
    'WIP on main: refactor database queries',
  ]);

  const popStash = () => {
    if (stashes.length > 0) {
      setStashes(stashes.slice(1));
    }
  };

  const pushStash = () => {
    setStashes([`WIP on main: stash at ${new Date().toLocaleTimeString()}`, ...stashes]);
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 8H3"/>
          <path d="M21 12H3"/>
          <path d="M21 16H3"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Stash LIFO Stack Inspector (`git stash push / pop / apply`)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={pushStash} style={{ flex: 1, padding: '8px', borderRadius: '6px', backgroundColor: '#38bdf8', color: '#000', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
            + git stash push
          </button>
          <button onClick={popStash} disabled={stashes.length === 0} style={{ flex: 1, padding: '8px', borderRadius: '6px', backgroundColor: stashes.length > 0 ? '#34d399' : '#555', color: '#000', fontWeight: 700, border: 'none', cursor: stashes.length > 0 ? 'pointer' : 'not-allowed' }}>
            - git stash pop
          </button>
        </div>

        <div style={{ backgroundColor: '#0c0e17', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '8px' }}>
            LIFO Stash Stack ({stashes.length} entries):
          </div>
          {stashes.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>Stash stack is empty.</div>
          ) : (
            stashes.map((s, idx) => (
              <div key={idx} style={{ backgroundColor: '#05070e', padding: '8px', borderRadius: '4px', marginBottom: '6px', fontSize: '12px', fontFamily: 'monospace', color: idx === 0 ? '#fbbf24' : 'var(--ifm-color-content)', border: '1px solid rgba(255,255,255,0.05)' }}>
                stash@&#123;{idx}&#125;: {s}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
