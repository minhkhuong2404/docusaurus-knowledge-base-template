import React, { useState } from 'react';

export default function EnvoyProxyDiagram() {
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>
        </svg>
        <span>Envoy Proxy Internal Architecture &amp; Filter Chain</span>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '18px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
          {/* L3/L4 Listeners */}
          <div
            onMouseEnter={() => setHoveredLayer('l3')}
            onMouseLeave={() => setHoveredLayer(null)}
            style={{
              background: hoveredLayer === 'l3' ? 'rgba(56,189,248,0.2)' : 'rgba(56,189,248,0.08)',
              border: '1.5px solid #38bdf8', borderRadius: '10px', padding: '12px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s ease',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>L3/L4 Listeners</div>
            <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', marginTop: '4px', fontWeight: 600 }}>TCP Proxy &amp; TLS</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>Terminates TLS, binds ports</div>
          </div>

          {/* L7 Filter Chain */}
          <div
            onMouseEnter={() => setHoveredLayer('l7')}
            onMouseLeave={() => setHoveredLayer(null)}
            style={{
              background: hoveredLayer === 'l7' ? 'rgba(52,211,153,0.2)' : 'rgba(52,211,153,0.08)',
              border: '1.5px solid #34d399', borderRadius: '10px', padding: '12px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s ease',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase' }}>L7 Filter Chain</div>
            <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', marginTop: '4px', fontWeight: 600 }}>HTTP / gRPC / WS</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>Route, Auth, Rate Limit</div>
          </div>

          {/* Cluster Manager */}
          <div
            onMouseEnter={() => setHoveredLayer('cluster')}
            onMouseLeave={() => setHoveredLayer(null)}
            style={{
              background: hoveredLayer === 'cluster' ? 'rgba(251,191,36,0.2)' : 'rgba(251,191,36,0.08)',
              border: '1.5px solid #fbbf24', borderRadius: '10px', padding: '12px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s ease',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase' }}>Cluster Manager</div>
            <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', marginTop: '4px', fontWeight: 600 }}>Load Balancing</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>Round-robin, Ring Hash</div>
          </div>

          {/* xDS Control Plane */}
          <div
            onMouseEnter={() => setHoveredLayer('xds')}
            onMouseLeave={() => setHoveredLayer(null)}
            style={{
              background: hoveredLayer === 'xds' ? 'rgba(167,139,250,0.2)' : 'rgba(167,139,250,0.08)',
              border: '1.5px solid #a78bfa', borderRadius: '10px', padding: '12px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s ease',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase' }}>xDS Discovery API</div>
            <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', marginTop: '4px', fontWeight: 600 }}>Dynamic Config</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>LDS, RDS, CDS, EDS</div>
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
        Envoy operates as a C++ high-performance data plane proxy. It dynamically updates listeners (LDS), routes (RDS), clusters (CDS), and endpoint IPs (EDS) streaming from control planes like Istio without requiring service restarts.
      </div>
    </div>
  );
}
