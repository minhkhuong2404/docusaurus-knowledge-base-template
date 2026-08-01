import React, { useState } from 'react';

const MODES = [
  { id: 'soft', label: 'git reset --soft HEAD~1', color: '#38bdf8', badge: 'Moves HEAD only', detail: 'Moves HEAD pointer back to target commit. Leaves Staging Area (Index) and Working Directory untouched. All changes remain staged and ready to commit.' },
  { id: 'mixed', label: 'git reset --mixed HEAD~1', color: '#fbbf24', badge: 'Default: Moves HEAD + Resets Staging Area', detail: 'Moves HEAD pointer back and resets Staging Area to match target commit. Working Directory files are preserved as unstaged changes.' },
  { id: 'hard', label: 'git reset --hard HEAD~1', color: '#f87171', badge: 'DANGER: Moves HEAD + Clears Staging + Wipes Disk', detail: 'Moves HEAD pointer back, resets Staging Area, and overwrites Working Directory files to match target commit. Uncommitted changes are permanently lost!' },
  { id: 'revert', label: 'git revert <commit-sha>', color: '#34d399', badge: 'Safe for Public Branches: Creates New Inverse Commit', detail: 'Safe public undo. Does NOT rewrite history. Creates a brand-new commit that applies exact inverse diff of target commit. Ideal for pushed commits.' },
];

export default function GitResetVsRevertDiagram(): React.JSX.Element {
  const [active, setActive] = useState<string>('soft');
  const mode = MODES.find(m => m.id === active)!;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Reset (--soft / --mixed / --hard) vs Git Revert
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => setActive(m.id)}
              style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '11px', background: active === m.id ? `${m.color}18` : 'rgba(255,255,255,0.04)', color: active === m.id ? m.color : 'var(--ifm-color-content-secondary)', boxShadow: active === m.id ? `0 0 0 1.5px ${m.color}50` : '0 0 0 1px rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
              {m.label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: '11px', background: `${mode.color}15`, border: `1px solid ${mode.color}40`, borderRadius: '6px', padding: '4px 10px', marginBottom: '12px', color: mode.color, display: 'inline-block', fontWeight: 600 }}>
          {mode.badge}
        </div>

        <div style={{ background: `${mode.color}0d`, border: `1px solid ${mode.color}30`, borderRadius: '10px', padding: '14px' }}>
          <p style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: 1.6 }}>{mode.detail}</p>
        </div>
      </div>
    </div>
  );
}
