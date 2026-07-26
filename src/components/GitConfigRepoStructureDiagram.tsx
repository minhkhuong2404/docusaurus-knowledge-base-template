import React, { useState } from 'react';

interface FileNode {
  path: string;
  scope: string;
  color: string;
  description: string;
}

const FILES: FileNode[] = [
  { path: 'application.yml', scope: 'Shared Global Defaults', color: '#38bdf8', description: 'Inherited by ALL microservices across ALL environments (e.g., common Actuator exposure, tracing sampling).' },
  { path: 'application-prod.yml', scope: 'Shared Production Overrides', color: '#34d399', description: 'Overriding defaults for all services when running in production (e.g., logging.level.root=WARN).' },
  { path: 'order-service.yml', scope: 'Order Service Defaults', color: '#fbbf24', description: 'Base configuration specific to Order Service across all environments.' },
  { path: 'order-service-dev.yml', scope: 'Order Service Dev Profile', color: '#a78bfa', description: 'Order Service overrides for local development (e.g., debug logging, local DB endpoints).' },
  { path: 'order-service-prod.yml', scope: 'Order Service Prod Profile', color: '#f87171', description: 'Order Service production overrides (e.g., HikariCP pool size 50, Stripe API timeout 5s).' },
];

export default function GitConfigRepoStructureDiagram() {
  const [selected, setSelected] = useState<FileNode>(FILES[0]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <span>Git Config Repository Inheritance &amp; File Structure Explorer</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', alignItems: 'start' }}>
        {/* Tree List */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '14px', borderRadius: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', marginBottom: '10px' }}>
            config-repo /
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {FILES.map(f => {
              const isSelected = selected.path === f.path;
              return (
                <div
                  key={f.path}
                  onClick={() => setSelected(f)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 10px', borderRadius: '6px', cursor: 'pointer',
                    background: isSelected ? `${f.color}20` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isSelected ? f.color : 'rgba(255,255,255,0.06)'}`,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{ color: f.color, fontFamily: 'monospace', fontSize: '13px' }}>📄</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '11.5px', color: isSelected ? f.color : 'var(--ifm-color-content)', fontWeight: isSelected ? 700 : 500 }}>
                    {f.path}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected File Details */}
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: `1.5px solid ${selected.color}50` }}>
          <div style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', background: `${selected.color}20`, color: selected.color, display: 'inline-block', marginBottom: '8px' }}>
            {selected.scope}
          </div>

          <div style={{ fontSize: '13px', fontWeight: 800, color: selected.color, fontFamily: 'monospace', marginBottom: '10px' }}>
            {selected.path}
          </div>

          <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
            {selected.description}
          </div>
        </div>
      </div>
    </div>
  );
}
