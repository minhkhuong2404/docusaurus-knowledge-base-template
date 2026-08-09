import React, { useState } from 'react';

export default function BffCachingStrategyDiagram() {
  const [cached, setCached] = useState<boolean>(true);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span>BFF Caching Strategy &amp; Kafka Event-Driven Eviction Simulator</span>
        <button
          onClick={() => setCached(!cached)}
          style={{
            marginLeft: 'auto', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer',
            fontWeight: 700, fontSize: '11px',
            background: cached ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)',
            color: cached ? '#34d399' : '#fbbf24',
            border: `1px solid ${cached ? '#34d399' : '#fbbf24'}`,
          }}
        >
          {cached ? 'Simulate Order Created (Evict Cache)' : 'Refetch & Re-cache (Cache Hit)'}
        </button>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '20px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid #38bdf8', padding: '12px', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>GET /api/v1/dashboard</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Incoming Web Client</div>
          </div>

          <div style={{ background: cached ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)', border: `2px solid ${cached ? '#34d399' : '#f87171'}`, padding: '14px', borderRadius: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: cached ? '#34d399' : '#f87171' }}>
              Caffeine Cache (30s TTL)
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>
              Status: <strong style={{ color: cached ? '#34d399' : '#f87171' }}>{cached ? 'CACHE HIT (<2ms)' : 'CACHE MISS (Fan-out downstream)'}</strong>
            </div>
          </div>

          <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid #fbbf24', padding: '12px', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24' }}>Kafka Eviction Listener</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>Invalidates on OrderCreated</div>
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
        <strong>BFF Cache Rule:</strong> Cache dashboard responses aggressively with a 30-second TTL. Invalidate the user cache key immediately whenever downstream Kafka events occur (e.g. <code>OrderCreatedEvent</code>). Never cache degraded 503 fallback responses.
      </div>
    </div>
  );
}
