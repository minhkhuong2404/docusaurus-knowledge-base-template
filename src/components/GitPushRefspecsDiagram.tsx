import React, { useState } from 'react';

const MODES = [
  { id: 'standard', label: 'git push origin main', color: '#38bdf8', desc: 'Standard push. Sends local commits to origin/main. Fails if remote contains commits not present locally (non-fast-forward rejected).' },
  { id: 'refspec', label: 'git push origin feat:main', color: '#34d399', desc: 'Explicit Refspec syntax: <src>:<dst>. Pushes local branch feat to remote branch main on origin.' },
  { id: 'force', label: 'git push --force-with-lease', color: '#fbbf24', desc: 'Safe force push. Overwrites remote history ONLY if remote refs match local origin/main tracker. Prevents overwriting work pushed by teammates.' },
  { id: 'upstream', label: 'git push -u origin main', color: '#a78bfa', desc: 'Sets upstream tracking (-u / --set-upstream). Links local main to origin/main so future calls require only git push / git pull.' },
];

export default function GitPushRefspecsDiagram(): React.JSX.Element {
  const [active, setActive] = useState<string>('standard');
  const mode = MODES.find(m => m.id === active)!;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="12 19 12 5 19 12"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Push &amp; Refspecs Explorer
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

        <div style={{ background: `${mode.color}0d`, border: `1px solid ${mode.color}30`, borderRadius: '10px', padding: '14px' }}>
          <code style={{ fontSize: '13px', fontWeight: 700, color: mode.color, display: 'block', marginBottom: '6px' }}>{mode.label}</code>
          <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: 1.6 }}>{mode.desc}</p>
        </div>
      </div>
    </div>
  );
}
