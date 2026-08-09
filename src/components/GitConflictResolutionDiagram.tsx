import React, { useState } from 'react';

const TABS = [
  { id: 'markers', label: 'Conflict Markers', color: '#f87171', code: `<<<<<<< HEAD
const API_URL = "https://api.v1.example.com";
=======
const API_URL = "https://api.v2.example.com";
>>>>>>> feature/api-v2`, detail: 'Conflict markers inserted by Git into files where 3-way merge cannot resolve automatically. HEAD contains current branch code, feature/api-v2 contains incoming code.' },
  { id: 'diff3', label: 'diff3 Style', color: '#fbbf24', code: `<<<<<<< HEAD
const API_URL = "https://api.v1.example.com";
||||||| ancestor
const API_URL = "http://localhost:8080";
=======
const API_URL = "https://api.v2.example.com";
>>>>>>> feature/api-v2`, detail: 'Configured via git config merge.conflictStyle diff3. Shows common ancestor baseline between current branch and incoming branch.' },
  { id: 'resolve', label: 'Resolution Commands', color: '#34d399', code: `# Accept current branch version
git checkout --ours file.js

# Accept incoming branch version
git checkout --theirs file.js

# Mark as resolved & complete merge
git add file.js
git merge --continue`, detail: 'Use git checkout --ours / --theirs for wholesale file acceptance, or edit file markers manually and stage.' },
];

export default function GitConflictResolutionDiagram(): React.JSX.Element {
  const [active, setActive] = useState<string>('markers');
  const tab = TABS.find(t => t.id === active)!;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Conflict Resolution Inspector
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActive(t.id)}
              style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '11.5px', background: active === t.id ? `${t.color}18` : 'rgba(255,255,255,0.04)', color: active === t.id ? t.color : 'var(--ifm-color-content-secondary)', boxShadow: active === t.id ? `0 0 0 1.5px ${t.color}50` : '0 0 0 1px rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
              {t.label}
            </button>
          ))}
        </div>

        <pre style={{ margin: '0 0 12px 0', background: 'rgba(0,0,0,0.4)', border: `1px solid ${tab.color}40`, borderRadius: '8px', padding: '12px', fontSize: '11px', color: tab.color, fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
          {tab.code}
        </pre>

        <div style={{ background: `${tab.color}0d`, border: `1px solid ${tab.color}30`, borderRadius: '10px', padding: '12px' }}>
          <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: 1.6 }}>{tab.detail}</p>
        </div>
      </div>
    </div>
  );
}
