import React, { useState } from 'react';

interface EnvItem {
  id: string;
  name: string;
  color: string;
  sources: { source: string; active: boolean; detail: string }[];
}

const ENVS: EnvItem[] = [
  {
    id: 'dev',
    name: 'Local Dev',
    color: '#38bdf8',
    sources: [
      { source: 'application.yml (in JAR)', active: true, detail: 'Provides local dev fallback defaults' },
      { source: 'Config Server (Git)', active: false, detail: 'Bypassed in local offline development' },
      { source: 'Kubernetes ConfigMaps', active: false, detail: 'Not present on local machine' },
      { source: 'Vault / K8s Secrets', active: false, detail: 'Local dev uses dummy mock keys' },
      { source: 'Environment Variables', active: true, detail: '.env or IDE environment overrides' },
    ],
  },
  {
    id: 'stg',
    name: 'Staging',
    color: '#fbbf24',
    sources: [
      { source: 'application.yml (in JAR)', active: true, detail: 'Base defaults' },
      { source: 'Config Server (Git)', active: true, detail: 'Pulls staging profile configs' },
      { source: 'Kubernetes ConfigMaps', active: true, detail: 'Mounted staging pod volumes' },
      { source: 'Vault / K8s Secrets', active: true, detail: 'Staging secrets synced via ESO' },
      { source: 'Environment Variables', active: false, detail: 'Standard K8s deployment spec' },
    ],
  },
  {
    id: 'prod',
    name: 'Production',
    color: '#34d399',
    sources: [
      { source: 'application.yml (in JAR)', active: true, detail: 'Base defaults' },
      { source: 'Config Server (Git)', active: true, detail: 'Pulls order-service-prod.yml' },
      { source: 'Kubernetes ConfigMaps', active: true, detail: 'Prod namespace ConfigMaps' },
      { source: 'Vault / K8s Secrets', active: true, detail: 'Production secrets from Vault/AWS SM' },
      { source: 'Environment Variables', active: true, detail: 'Emergency production hotfix overrides' },
    ],
  },
];

export default function EnvConfigMatrixDiagram() {
  const [activeEnv, setActiveEnv] = useState<EnvItem>(ENVS[2]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
        </svg>
        <span>Environment-Specific Configuration Source Matrix</span>
      </div>

      {/* Env Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {ENVS.map(e => (
          <button
            key={e.id}
            onClick={() => setActiveEnv(e)}
            style={{
              flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '12px',
              background: activeEnv.id === e.id ? `${e.color}20` : 'rgba(255,255,255,0.04)',
              color: activeEnv.id === e.id ? e.color : 'var(--ifm-color-content-secondary)',
              boxShadow: activeEnv.id === e.id ? `0 0 0 1.5px ${e.color}60` : '0 0 0 1px rgba(255,255,255,0.08)',
              transition: 'all 0.2s ease',
            }}
          >
            {e.name}
          </button>
        ))}
      </div>

      {/* Sources Table */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: activeEnv.color, textTransform: 'uppercase', marginBottom: '12px' }}>
          Active Configuration Sources for {activeEnv.name} Environment
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {activeEnv.sources.map(s => (
            <div
              key={s.source}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: '8px',
                background: s.active ? `${activeEnv.color}15` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${s.active ? activeEnv.color + '40' : 'rgba(255,255,255,0.06)'}`,
                opacity: s.active ? 1 : 0.4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '14px', color: s.active ? activeEnv.color : 'var(--ifm-color-content-secondary)' }}>
                  {s.active ? '✅' : '⚪'}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>{s.source}</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>{s.detail}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
