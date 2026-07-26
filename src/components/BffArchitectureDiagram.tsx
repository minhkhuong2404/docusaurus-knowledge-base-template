import React, { useState } from 'react';

export default function BffArchitectureDiagram() {
  const [selectedLayer, setSelectedLayer] = useState<'gw' | 'bff' | 'micro' | null>('bff');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </svg>
        <span>Full-Stack BFF Architecture &amp; Gateway Responsibility Split</span>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '20px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
          {/* Layer 1: API Gateway */}
          <div
            onClick={() => setSelectedLayer('gw')}
            style={{
              background: selectedLayer === 'gw' ? 'rgba(56,189,248,0.2)' : 'rgba(56,189,248,0.06)',
              border: `1.5px solid ${selectedLayer === 'gw' ? '#38bdf8' : 'rgba(56,189,248,0.3)'}`,
              padding: '14px', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s ease',
            }}
          >
            <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>Cross-Cutting Edge</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ifm-color-content)', marginTop: '4px' }}>API Gateway</div>
            <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '6px' }}>TLS Termination · JWT Validation · Global Rate Limiting</div>
          </div>

          {/* Layer 2: Dedicated BFFs */}
          <div
            onClick={() => setSelectedLayer('bff')}
            style={{
              background: selectedLayer === 'bff' ? 'rgba(52,211,153,0.2)' : 'rgba(52,211,153,0.06)',
              border: `1.5px solid ${selectedLayer === 'bff' ? '#34d399' : 'rgba(52,211,153,0.3)'}`,
              padding: '14px', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s ease',
            }}
          >
            <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase' }}>BFF Composition Layer</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ifm-color-content)', marginTop: '4px' }}>Mobile / Web / TV BFFs</div>
            <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '6px' }}>Data Aggregation · Response Shaping · OAuth Token Handler</div>
          </div>

          {/* Layer 3: Microservices */}
          <div
            onClick={() => setSelectedLayer('micro')}
            style={{
              background: selectedLayer === 'micro' ? 'rgba(251,191,36,0.2)' : 'rgba(251,191,36,0.06)',
              border: `1.5px solid ${selectedLayer === 'micro' ? '#fbbf24' : 'rgba(251,191,36,0.3)'}`,
              padding: '14px', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s ease',
            }}
          >
            <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase' }}>Domain Core</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ifm-color-content)', marginTop: '4px' }}>Backend Microservices</div>
            <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '6px' }}>User Svc · Order Svc · Payment Svc · Analytics Svc</div>
          </div>
        </div>
      </div>

      {/* Responsibility Detail */}
      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
        {selectedLayer === 'gw' && (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', marginBottom: '6px' }}>API Gateway Responsibilities (Upstream of BFFs)</div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
              Handled globally for all incoming traffic: Edge TLS termination, initial JWT signature validation, global DDoS rate limiting, and path-based request routing to the appropriate client BFF.
            </div>
          </div>
        )}
        {selectedLayer === 'bff' && (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399', marginBottom: '6px' }}>Backend for Frontend (BFF) Responsibilities</div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
              Handled independently per client team: Non-blocking parallel fan-out aggregation, client-specific response DTO shaping, HttpOnly session OAuth token handling, and BFF-level caching.
            </div>
          </div>
        )}
        {selectedLayer === 'micro' && (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24', marginBottom: '6px' }}>Downstream Microservices Responsibilities</div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
              Pure domain business logic and data persistence. Microservices have zero awareness of frontend UI layouts or specific device form factors.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
