import React, { useState } from 'react';

export default function ApiGatewayOverviewDiagram() {
  const [selectedFeature, setSelectedFeature] = useState<'auth' | 'rate' | 'route' | 'transform'>('auth');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
        </svg>
        <span>API Gateway Perimeter & Core Roles</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }} className="gw-overview-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .gw-overview-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* Feature Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={() => setSelectedFeature('auth')} style={{
            padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left',
            background: selectedFeature === 'auth' ? '#38bdf818' : 'rgba(255,255,255,0.03)',
            boxShadow: selectedFeature === 'auth' ? '0 0 0 1.5px #38bdf850' : '0 0 0 1px rgba(255,255,255,0.06)'
          }}>
            <strong style={{ fontSize: '12px', color: '#38bdf8' }}>1. Perimeter Authentication & Scopes</strong>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Validates JWT tokens once at the edge; injects X-User-Id headers.</div>
          </button>

          <button onClick={() => setSelectedFeature('rate')} style={{
            padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left',
            background: selectedFeature === 'rate' ? '#fbbf2418' : 'rgba(255,255,255,0.03)',
            boxShadow: selectedFeature === 'rate' ? '0 0 0 1.5px #fbbf2450' : '0 0 0 1px rgba(255,255,255,0.06)'
          }}>
            <strong style={{ fontSize: '12px', color: '#fbbf24' }}>2. Global Rate Limiting</strong>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Enforces per-client quotas (e.g. 1000 req/min) via Redis token buckets.</div>
          </button>

          <button onClick={() => setSelectedFeature('route')} style={{
            padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left',
            background: selectedFeature === 'route' ? '#34d39918' : 'rgba(255,255,255,0.03)',
            boxShadow: selectedFeature === 'route' ? '0 0 0 1.5px #34d39950' : '0 0 0 1px rgba(255,255,255,0.06)'
          }}>
            <strong style={{ fontSize: '12px', color: '#34d399' }}>3. Dynamic Path Routing</strong>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Routes /v1/orders → Order Service based on Service Registry.</div>
          </button>

          <button onClick={() => setSelectedFeature('transform')} style={{
            padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left',
            background: selectedFeature === 'transform' ? '#a78bfa18' : 'rgba(255,255,255,0.03)',
            boxShadow: selectedFeature === 'transform' ? '0 0 0 1.5px #a78bfa50' : '0 0 0 1px rgba(255,255,255,0.06)'
          }}>
            <strong style={{ fontSize: '12px', color: '#a78bfa' }}>4. Protocol & Content Translation</strong>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Translates public REST HTTP JSON into internal gRPC Protobuf.</div>
          </button>
        </div>

        {/* Info Card */}
        <div className="interactive-diagram-details-card" style={{ borderColor: selectedFeature === 'auth' ? '#38bdf840' : selectedFeature === 'rate' ? '#fbbf2440' : selectedFeature === 'route' ? '#34d39940' : '#a78bfa40' }}>
          <div className="interactive-diagram-card-header">
            <h3 style={{ color: selectedFeature === 'auth' ? '#38bdf8' : selectedFeature === 'rate' ? '#fbbf24' : selectedFeature === 'route' ? '#34d399' : '#a78bfa' }}>
              {selectedFeature === 'auth' && 'Authentication & Authorization'}
              {selectedFeature === 'rate' && 'Perimeter Rate Limiting'}
              {selectedFeature === 'route' && 'Dynamic Microservice Routing'}
              {selectedFeature === 'transform' && 'Protocol Translation'}
            </h3>
          </div>
          <p style={{ fontSize: '12.5px', color: '#e2e8f0', marginTop: '8px' }}>
            {selectedFeature === 'auth' && 'By validating identity once at the perimeter, downstream microservices do not need to duplicate JWT verification logic or maintain identity keys.'}
            {selectedFeature === 'rate' && 'Token buckets stored in Redis allow multi-instance API Gateways to globally track per-client API quotas and fail fast on floods.'}
            {selectedFeature === 'route' && 'Shields mobile and web clients from internal topology changes (e.g., splitting a monolith service or renaming pod endpoints).'}
            {selectedFeature === 'transform' && 'Exposes developer-friendly REST/JSON endpoints externally while maintaining high-performance binary gRPC streams internally.'}
          </p>
        </div>
      </div>
    </div>
  );
}
