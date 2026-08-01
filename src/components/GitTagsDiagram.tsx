import React, { useState } from 'react';

const TABS = [
  { id: 'lightweight', label: 'Lightweight Tag', color: '#38bdf8', cmd: 'git tag v1.0.0', detail: 'A lightweight tag is simply an un-annotated pointer file in .git/refs/tags/v1.0.0 containing a 40-character commit SHA-1 hash. Cheap and fast for temporary release markers.' },
  { id: 'annotated', label: 'Annotated Tag', color: '#34d399', cmd: 'git tag -a v1.0.0 -m "Release version 1.0.0"', detail: 'An annotated tag creates a full Git object in .git/objects containing the tagger name, email, timestamp, tagging message, and optional PGP cryptographic signature (-s).' },
  { id: 'push_tags', label: 'Pushing Tags', color: '#fbbf24', cmd: 'git push origin v1.0.0\ngit push origin --tags', detail: 'Tags are NOT automatically pushed to remote servers by git push. You must explicitly push individual tags or use --tags to push all local tags.' },
];

export default function GitTagsDiagram(): React.JSX.Element {
  const [active, setActive] = useState<string>('annotated');
  const tab = TABS.find(t => t.id === active)!;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
          <line x1="7" y1="7" x2="7.01" y2="7"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Tag Types (Lightweight vs Annotated Tags)
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

        <pre style={{ margin: '0 0 12px 0', background: 'rgba(0,0,0,0.4)', border: `1px solid ${tab.color}40`, borderRadius: '8px', padding: '12px', fontSize: '11.5px', color: tab.color, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          {tab.cmd}
        </pre>

        <div style={{ background: `${tab.color}0d`, border: `1px solid ${tab.color}30`, borderRadius: '10px', padding: '14px' }}>
          <p style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: 1.6 }}>{tab.detail}</p>
        </div>
      </div>
    </div>
  );
}
