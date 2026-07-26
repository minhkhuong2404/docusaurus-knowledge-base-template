import React, { useState } from 'react';

interface PriorityItem {
  priority: number;
  name: string;
  example: string;
  useCase: string;
  color: string;
}

const HIERARCHY: PriorityItem[] = [
  { priority: 1, name: 'Command-Line Arguments', example: '--server.port=9090', useCase: 'Emergency local overrides during debugging.', color: '#f87171' },
  { priority: 2, name: 'Environment Variables', example: 'SPRING_DATASOURCE_URL=...', useCase: '12-Factor runtime injection & K8s pod overrides.', color: '#f97316' },
  { priority: 3, name: 'External Config Server', example: 'Spring Cloud Config / Consul', useCase: 'Centralized Git-backed dynamic configuration.', color: '#fbbf24' },
  { priority: 4, name: 'Kubernetes ConfigMaps & Secrets', example: 'Mounted /etc/config/app.yml', useCase: 'Cloud-native volume mounts & Vault secrets.', color: '#34d399' },
  { priority: 5, name: 'External Application File', example: '/config/application.yml', useCase: 'Server-local configuration files.', color: '#38bdf8' },
  { priority: 6, name: 'JAR-Internal application.yml', example: 'src/main/resources/application.yml', useCase: 'Fallback defaults packaged inside the binary.', color: '#a78bfa' },
];

export default function ConfigHierarchyDiagram() {
  const [selected, setSelected] = useState<PriorityItem>(HIERARCHY[1]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </svg>
        <span>Spring Boot Configuration Property Precedence Hierarchy</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', alignItems: 'start' }}>
        {/* Pyramid / Stack List */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '14px', borderRadius: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', marginBottom: '10px' }}>
            Precedence Order (Highest Priority Wins Top-Down)
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {HIERARCHY.map(h => {
              const isSelected = selected.priority === h.priority;
              return (
                <div
                  key={h.priority}
                  onClick={() => setSelected(h)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                    background: isSelected ? `${h.color}20` : 'rgba(255,255,255,0.03)',
                    border: `1.5px solid ${isSelected ? h.color : 'rgba(255,255,255,0.08)'}`,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 800, color: h.color, minWidth: '22px' }}>#{h.priority}</span>
                  <span style={{ fontSize: '12px', fontWeight: isSelected ? 800 : 600, color: 'var(--ifm-color-content)' }}>{h.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Detail Card */}
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: `1.5px solid ${selected.color}50` }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: selected.color, textTransform: 'uppercase' }}>
            Priority #{selected.priority} Level
          </div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: selected.color, marginTop: '2px', marginBottom: '10px' }}>
            {selected.name}
          </div>

          <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', marginBottom: '12px', lineHeight: '1.5' }}>
            {selected.useCase}
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace', color: selected.color, border: '1px solid rgba(255,255,255,0.08)' }}>
            Syntax Example: {selected.example}
          </div>
        </div>
      </div>
    </div>
  );
}
