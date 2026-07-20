import React, { useState } from 'react';

interface LayerInfo {
  id: string;
  name: string;
  orderNum: number;
  color: string;
  role: string;
  runtimeBehavior: string;
  antiPatternWarning: string;
}

const LAYERS: LayerInfo[] = [
  {
    id: 'bulkhead',
    name: 'Bulkhead (Outer Layer)',
    orderNum: 1,
    color: '#38bdf8',
    role: 'Concurrency Isolation Guard',
    runtimeBehavior: 'Rejects request immediately if maximum concurrent thread permits are exhausted.',
    antiPatternWarning: 'Must be placed outermost so concurrent callers are rejected before acquiring thread permits or triggering retries.'
  },
  {
    id: 'circuitbreaker',
    name: 'CircuitBreaker',
    orderNum: 2,
    color: '#a78bfa',
    role: 'System Health Guard',
    runtimeBehavior: 'Rejects request instantly in 0ms (CallNotPermittedException) if downstream failure rate breached threshold.',
    antiPatternWarning: 'If placed INSIDE Retry, a tripped circuit breaker would prevent transient retries from attempting recovery.'
  },
  {
    id: 'retry',
    name: 'Retry',
    orderNum: 3,
    color: '#34d399',
    role: 'Transient Failure Recovery',
    runtimeBehavior: 'On transient failure (e.g. 503, timeout), sleeps with backoff+jitter and retries up to N maxAttempts.',
    antiPatternWarning: 'If placed OUTSIDE CircuitBreaker, retries will execute against an OPEN circuit breaker, throwing CallNotPermittedException N times.'
  },
  {
    id: 'timelimiter',
    name: 'TimeLimiter',
    orderNum: 4,
    color: '#fbbf24',
    role: 'Per-Attempt Hard Timeout',
    runtimeBehavior: 'Applies a strict execution timeout (e.g. 2s) to each individual call attempt.',
    antiPatternWarning: 'Must be placed INSIDE Retry so that EACH individual retry attempt has its own independent timeout budget.'
  },
  {
    id: 'ratelimiter',
    name: 'RateLimiter (Inner Layer)',
    orderNum: 5,
    color: '#2dd4bf',
    role: 'Downstream Request Rate Regulator',
    runtimeBehavior: 'Throttles call frequency to match downstream capacity limits.',
    antiPatternWarning: 'Placed closest to actual HTTP call so every attempt (including individual retries) respects downstream rate limits.'
  }
];

export default function DecorationOrderDiagram() {
  const [selectedId, setSelectedId] = useState<string>('circuitbreaker');

  const selectedLayer = LAYERS.find(l => l.id === selectedId) || LAYERS[1];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 17 22 12"/>
        </svg>
        <span>Resilience4j Decoration Order Inspector</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', alignItems: 'start' }} className="decor-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .decor-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* Decoration Chain Flow */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', fontWeight: 'bold', marginBottom: '4px' }}>
            EXECUTION ORDER (OUTER → INNER):
          </div>

          {LAYERS.map(layer => {
            const isSelected = selectedId === layer.id;
            return (
              <button key={layer.id} onClick={() => setSelectedId(layer.id)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                textAlign: 'left',
                background: isSelected ? `${layer.color}18` : 'rgba(255,255,255,0.03)',
                boxShadow: isSelected ? `0 0 0 1.5px ${layer.color}50` : '0 0 0 1px rgba(255,255,255,0.06)',
                transition: 'all 0.2s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 'bold', color: layer.color,
                    background: `${layer.color}20`, width: '22px', height: '22px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {layer.orderNum}
                  </span>
                  <span style={{ fontSize: '12.5px', color: '#e2e8f0', fontWeight: 'bold' }}>
                    @{layer.name}
                  </span>
                </div>
                <span style={{ fontSize: '10.5px', color: layer.color, fontWeight: 'bold' }}>
                  {layer.role.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Layer Details Card */}
        <div className="interactive-diagram-details-card" style={{ borderColor: `${selectedLayer.color}40` }}>
          <div className="interactive-diagram-card-header">
            <h3 style={{ color: selectedLayer.color }}>
              Layer {selectedLayer.orderNum}: @{selectedLayer.name}
            </h3>
          </div>

          <div style={{ margin: '8px 0' }}>
            <span style={{
              fontSize: '11px', fontWeight: 'bold', color: selectedLayer.color,
              background: `${selectedLayer.color}15`, padding: '3px 8px', borderRadius: '4px'
            }}>
              ROLE: {selectedLayer.role}
            </span>
          </div>

          <p style={{ fontSize: '12.5px', color: '#e2e8f0', marginTop: '10px' }}>
            <strong>Runtime Behavior:</strong> {selectedLayer.runtimeBehavior}
          </p>

          <div style={{
            fontSize: '11.5px', background: 'rgba(248,113,113,0.08)',
            padding: '10px', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.2)',
            marginTop: '12px'
          }}>
            <strong style={{ color: '#f87171' }}>Ordering Anti-Pattern Gotcha:</strong>
            <p style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', margin: '4px 0 0 0' }}>
              {selectedLayer.antiPatternWarning}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
