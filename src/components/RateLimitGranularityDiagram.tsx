import React, { useState } from 'react';

interface Layer {
  id: string;
  name: string;
  scope: string;
  threshold: string;
  color: string;
  purpose: string;
  redisKeyPattern: string;
  failureBehavior: string;
}

const LAYERS: Layer[] = [
  {
    id: 'ip',
    name: '1. IP-Level Limit',
    scope: 'Client IP Address',
    threshold: '1,000 req / min per IP',
    color: '#38bdf8',
    purpose: 'DDoS mitigation & coarse volumetric attack protection at network edge.',
    redisKeyPattern: 'rl:v1:fw:ip:192.168.1.50:1714000',
    failureBehavior: 'HTTP 429 / WAF Block before hitting application servers.',
  },
  {
    id: 'apikey',
    name: '2. API Key-Level Limit',
    scope: 'API Key Header',
    threshold: '100 req / min per key',
    color: '#a78bfa',
    purpose: 'Developer quota enforcement and SaaS tier monetization limits.',
    redisKeyPattern: 'rl:v1:tb:apikey:key_live_9981',
    failureBehavior: 'HTTP 429 Too Many Requests with X-RateLimit-Limit headers.',
  },
  {
    id: 'user',
    name: '3. User-Level Limit',
    scope: 'Authenticated User ID',
    threshold: '10 req / min per user',
    color: '#34d399',
    purpose: 'Fair resource sharing across users regardless of how many devices/IPs they use.',
    redisKeyPattern: 'rl:v1:tb:user:usr_8831',
    failureBehavior: 'HTTP 429 with Retry-After header.',
  },
  {
    id: 'endpoint',
    name: '4. Endpoint-Level Limit',
    scope: 'Specific URI (e.g. /search)',
    threshold: '20 req / min per user on /search',
    color: '#fbbf24',
    purpose: 'Protects expensive queries, PDF generators, or heavy search endpoints from exhaustion.',
    redisKeyPattern: 'rl:v1:swc:endpoint:/api/v1/search:usr_8831',
    failureBehavior: 'HTTP 429 specifically for target endpoint; other endpoints remain accessible.',
  },
  {
    id: 'global',
    name: '5. Global Service Limit',
    scope: 'Entire Microservice Fleet',
    threshold: '50,000 req / min total',
    color: '#f87171',
    purpose: 'Backpressure control to prevent total downstream database crash.',
    redisKeyPattern: 'rl:v1:global:order-service:current_minute',
    failureBehavior: 'Circuit Breaker trips / HTTP 503 Service Unavailable / Adaptive Shedding.',
  },
];

export default function RateLimitGranularityDiagram(): React.JSX.Element {
  const [selectedLayer, setSelectedLayer] = useState<Layer>(LAYERS[1]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Multi-Tiered Rate Limiting Granularity Pipeline
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--ifm-color-content-secondary)' }}>
          Click any layer in the request stack below to inspect its rate limiting scope, threshold, and Redis key pattern:
        </p>

        {/* Stacked Pipeline Visualizer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {LAYERS.map((layer) => {
            const isSelected = layer.id === selectedLayer.id;
            return (
              <div
                key={layer.id}
                onClick={() => setSelectedLayer(layer)}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: isSelected ? `1.5px solid ${layer.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: isSelected ? `${layer.color}15` : '#0c0e17',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? `0 0 12px ${layer.color}33` : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: layer.color,
                      boxShadow: `0 0 8px ${layer.color}`,
                    }}
                  />
                  <span style={{ fontWeight: 600, fontSize: '14px', color: isSelected ? '#fff' : 'var(--ifm-color-content)' }}>
                    {layer.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '12px', color: layer.color, fontFamily: 'monospace', fontWeight: 600 }}>
                    {layer.threshold}
                  </span>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--ifm-color-content-secondary)' }}>
                    {layer.scope}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Inspection Details Card */}
        <div
          style={{
            padding: '16px',
            backgroundColor: '#0c0e17',
            borderRadius: '10px',
            border: `1px solid ${selectedLayer.color}44`,
            background: `linear-gradient(135deg, #0c0e17 0%, ${selectedLayer.color}0a 100%)`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: selectedLayer.color }}>
              {selectedLayer.name} — Technical Details
            </span>
            <span style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
              Scope: {selectedLayer.scope}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px' }}>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                Primary Purpose
              </div>
              <div style={{ color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
                {selectedLayer.purpose}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                Rejection Behavior
              </div>
              <div style={{ color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
                {selectedLayer.failureBehavior}
              </div>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                Redis Key Pattern
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', backgroundColor: '#05070e', padding: '8px 12px', borderRadius: '6px', color: '#38bdf8', border: '1px solid rgba(255,255,255,0.05)' }}>
                {selectedLayer.redisKeyPattern}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
