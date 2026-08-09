import React, { useState } from 'react';

const TABS = [
  { id: 'push', label: 'git stash push', color: '#38bdf8', cmd: 'git stash push -m "WIP header fix" -u', detail: 'Saves dirty working directory & index state to the stash stack (stash@{0}) and reverts working directory to HEAD. The -u flag includes untracked files.' },
  { id: 'pop', label: 'git stash pop', color: '#34d399', cmd: 'git stash pop', detail: 'Applies the top stashed state (stash@{0}) back to your working directory AND deletes it from the stash stack.' },
  { id: 'apply', label: 'git stash apply', color: '#fbbf24', cmd: 'git stash apply stash@{1}', detail: 'Applies a specific stashed state to your working directory WITHOUT removing it from the stash stack. Safe for reusing stashes.' },
  { id: 'drop', label: 'git stash drop / clear', color: '#f87171', cmd: 'git stash drop stash@{0}\ngit stash clear', detail: 'Deletes a specific stash entry from the stack, or clears all stashed states permanently.' },
];

export default function GitStashStackDiagram(): React.JSX.Element {
  const [active, setActive] = useState<string>('push');
  const tab = TABS.find(t => t.id === active)!;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 8H3"/><path d="M21 12H3"/><path d="M21 16H3"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Stash Stack Operations (LIFO Stack)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActive(t.id)}
              style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '11px', background: active === t.id ? `${t.color}18` : 'rgba(255,255,255,0.04)', color: active === t.id ? t.color : 'var(--ifm-color-content-secondary)', boxShadow: active === t.id ? `0 0 0 1.5px ${t.color}50` : '0 0 0 1px rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
              {t.label}
            </button>
          ))}
        </div>

        <pre style={{ margin: '0 0 12px 0', background: 'rgba(0,0,0,0.4)', border: `1px solid ${tab.color}40`, borderRadius: '8px', padding: '12px', fontSize: '11.5px', color: tab.color, fontFamily: 'monospace' }}>
          {tab.cmd}
        </pre>

        <div style={{ background: `${tab.color}0d`, border: `1px solid ${tab.color}30`, borderRadius: '10px', padding: '14px' }}>
          <p style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: 1.6 }}>{tab.detail}</p>
        </div>
      </div>
    </div>
  );
}
