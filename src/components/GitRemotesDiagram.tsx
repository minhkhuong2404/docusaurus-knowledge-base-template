import React, { useState } from 'react';

export default function GitRemotesDiagram(): React.JSX.Element {
  const [remote, setRemote] = useState<'origin' | 'upstream'>('origin');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Remote Topology (`origin` Fork vs `upstream` Source)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setRemote('origin')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: remote === 'origin' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', backgroundColor: remote === 'origin' ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            `origin` (Personal Fork)
          </button>
          <button onClick={() => setRemote('upstream')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: remote === 'upstream' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)', backgroundColor: remote === 'upstream' ? 'rgba(52, 211, 153, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            `upstream` (Main Organization Repo)
          </button>
        </div>

        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
            Remote URL Configuration for <code>{remote}</code>:
          </div>
          <div style={{ fontSize: '12.5px', fontFamily: 'monospace', color: remote === 'origin' ? '#38bdf8' : '#34d399' }}>
            {remote === 'origin' ? 'git@github.com:myuser/project-fork.git' : 'git@github.com:org/project-main.git'}
          </div>
        </div>
      </div>
    </div>
  );
}
