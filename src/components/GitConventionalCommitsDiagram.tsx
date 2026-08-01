import React, { useState } from 'react';

const TABS = [
  { id: 'feat', label: 'feat(scope): ...', color: '#38bdf8', example: 'feat(auth): add OAuth2 refresh token rotation mechanism', semver: 'MINOR version bump (v1.1.0)', detail: 'Introduces a new user-facing feature or API capability.' },
  { id: 'fix', label: 'fix(scope): ...', color: '#34d399', example: 'fix(db): resolve connection pool leak under high concurrency', semver: 'PATCH version bump (v1.0.1)', detail: 'Patches a bug in production code.' },
  { id: 'breaking', label: 'feat(api)!: ...', color: '#f87171', example: 'feat(api)!: drop deprecated v1 REST endpoints\n\nBREAKING CHANGE: /v1/users removed', semver: 'MAJOR version bump (v2.0.0)', detail: 'Contains breaking API changes. Signaled by ! after scope or BREAKING CHANGE footer.' },
];

export default function GitConventionalCommitsDiagram(): React.JSX.Element {
  const [active, setActive] = useState<string>('feat');
  const tab = TABS.find(t => t.id === active)!;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Conventional Commits &amp; Semantic Versioning
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

        <pre style={{ margin: '0 0 10px 0', background: 'rgba(0,0,0,0.4)', border: `1px solid ${tab.color}40`, borderRadius: '8px', padding: '12px', fontSize: '11.5px', color: tab.color, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          {tab.example}
        </pre>

        <div style={{ background: `${tab.color}0d`, border: `1px solid ${tab.color}30`, borderRadius: '10px', padding: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: tab.color, marginBottom: '4px' }}>{tab.semver}</div>
          <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: 1.6 }}>{tab.detail}</p>
        </div>
      </div>
    </div>
  );
}
