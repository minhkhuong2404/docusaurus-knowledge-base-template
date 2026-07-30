import React, { useState } from 'react';

interface FileItem {
  path: string;
  name: string;
  badge: string;
  color: string;
  description: string;
}

const FILES: FileItem[] = [
  {
    path: 'config/WebClientConfig.java',
    name: 'WebClientConfig',
    badge: 'Non-Blocking HTTP',
    color: '#38bdf8',
    description: 'Configures non-blocking Reactor WebClient beans for each downstream service with connect/read timeouts, W3C traceparent header propagation filters, and latency metrics collection.',
  },
  {
    path: 'client/UserServiceClient.java',
    name: 'UserServiceClient',
    badge: 'Service Client',
    color: '#34d399',
    description: 'Encapsulates downstream HTTP calls to User Service with Resilience4j circuit breakers, exponential backoff retries, and custom 4xx/5xx status exception mapping.',
  },
  {
    path: 'composer/DashboardComposer.java',
    name: 'DashboardComposer',
    badge: 'Fan-Out Engine',
    color: '#fbbf24',
    description: 'The core composition engine. Executes Mono.zip() parallel fan-out across User, Order, Analytics, and Support services. Applies a 3s global SLA timeout and graceful degradation fallbacks.',
  },
  {
    path: 'mapper/WebResponseMapper.java',
    name: 'WebResponseMapper',
    badge: 'DTO Transformer',
    color: '#a78bfa',
    description: 'Transforms raw domain DTOs into WebDashboardResponse. Trims unneeded internal fields and exposes full profile fields, orders, analytics, and open support tickets for web rendering.',
  },
  {
    path: 'controller/DashboardController.java',
    name: 'DashboardController',
    badge: 'REST Controller',
    color: '#f87171',
    description: 'Spring WebFlux REST controller exposing GET /api/v1/dashboard. Handles JWT auth principal extraction, sets trace headers, and manages HTTP cache-control directives.',
  },
];

export default function BffProjectStructureDiagram() {
  const [selected, setSelected] = useState<FileItem>(FILES[2]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <span>Spring Boot Web BFF Production Project Structure</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', alignItems: 'start' }}>
        {/* File Tree List */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '14px', borderRadius: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', marginBottom: '10px' }}>
            web-bff / src / main / java / com / example / webbff /
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

        {/* Selected Component Inspector */}
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: `1.5px solid ${selected.color}50` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', background: `${selected.color}20`, color: selected.color }}>
              {selected.badge}
            </span>
          </div>

          <div style={{ fontSize: '13px', fontWeight: 800, color: selected.color, fontFamily: 'monospace', marginBottom: '10px' }}>
            {selected.name}
          </div>

          <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
            {selected.description}
          </div>
        </div>
      </div>
    </div>
  );
}
