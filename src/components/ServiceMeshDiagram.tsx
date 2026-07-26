import React, { useState } from 'react';

export default function ServiceMeshDiagram() {
  const [activeTab, setActiveTab] = useState<'mtls' | 'traffic' | 'tracing'>('mtls');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </svg>
        <span>Service Mesh Architecture (Control Plane vs Data Plane)</span>
      </div>

      {/* Control Plane / Data Plane Visualizer */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
        <svg viewBox="0 0 620 260" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <defs>
            <marker id="mesh-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#38bdf8" />
            </marker>
            <marker id="control-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#a78bfa" />
            </marker>
          </defs>

          {/* Control Plane Box */}
          <rect x="160" y="15" width="300" height="65" rx="10" fill="rgba(167,139,250,0.12)" stroke="#a78bfa" strokeWidth="1.5" />
          <text x="310" y="38" textAnchor="middle" fill="#a78bfa" fontSize="13" fontWeight="800">CONTROL PLANE (Istiod / Linkerd Control)</text>
          <text x="310" y="58" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10.5">Certificates (Citadel) · Routing (Pilot) · Telemetry (Mixer/Telemetry)</text>

          {/* Control -> Data Plane Arrows */}
          <path d="M 230 80 L 140 135" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="3,3" markerEnd="url(#control-arrow)" />
          <path d="M 390 80 L 480 135" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="3,3" markerEnd="url(#control-arrow)" />

          {/* DATA PLANE Section */}
          {/* Pod A */}
          <rect x="20" y="135" width="240" height="110" rx="12" fill="rgba(56,189,248,0.06)" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="140" y="155" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="700">Pod A (Order Service)</text>

          <rect x="35" y="170" width="90" height="60" rx="6" fill="rgba(56,189,248,0.15)" stroke="#38bdf8" strokeWidth="1" />
          <text x="80" y="205" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">App</text>

          <rect x="155" y="170" width="90" height="60" rx="6" fill="rgba(52,211,153,0.2)" stroke="#34d399" strokeWidth="1.5" />
          <text x="200" y="198" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="800">Envoy</text>
          <text x="200" y="214" textAnchor="middle" fill="#34d399" fontSize="9">Sidecar</text>

          {/* Inter-Pod Data Flow */}
          <path d="M 245 200 L 375 200" stroke="#34d399" strokeWidth="2.5" markerEnd="url(#mesh-arrow)" />
          <text x="310" y="192" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="800">mTLS Tunnel</text>
          <text x="310" y="216" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Zero-Trust Encrypted</text>

          {/* Pod B */}
          <rect x="360" y="135" width="240" height="110" rx="12" fill="rgba(56,189,248,0.06)" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="480" y="155" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="700">Pod B (Payment Service)</text>

          <rect x="375" y="170" width="90" height="60" rx="6" fill="rgba(52,211,153,0.2)" stroke="#34d399" strokeWidth="1.5" />
          <text x="420" y="198" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="800">Envoy</text>
          <text x="420" y="214" textAnchor="middle" fill="#34d399" fontSize="9">Sidecar</text>

          <rect x="495" y="170" width="90" height="60" rx="6" fill="rgba(56,189,248,0.15)" stroke="#38bdf8" strokeWidth="1" />
          <text x="540" y="205" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">App</text>
        </svg>
      </div>

      {/* Feature Explorer Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        {[
          { id: 'mtls', label: 'Automatic mTLS', color: '#34d399' },
          { id: 'traffic', label: 'Traffic Splitting', color: '#38bdf8' },
          { id: 'tracing', label: 'Telemetry & Tracing', color: '#a78bfa' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            style={{
              padding: '7px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '12px',
              background: activeTab === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)',
              color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
              boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}60` : '0 0 0 1px rgba(255,255,255,0.08)',
              transition: 'all 0.2s ease',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
        {activeTab === 'mtls' && (
          <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
            <strong style={{ color: '#34d399' }}>Zero-Trust Mutual TLS:</strong> Envoy sidecars transparently encrypt all inter-service traffic using SPIFFE/SPIRE X.509 certificates automatically issued and rotated by Istiod. Application code speaks plain HTTP to <code>localhost</code>.
          </div>
        )}
        {activeTab === 'traffic' && (
          <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
            <strong style={{ color: '#38bdf8' }}>Dynamic Traffic Control:</strong> Configure Canary rollouts (e.g. 90% v1 / 10% v2), fault injection (delays/errors), retries, and circuit breakers strictly via Kubernetes YAML CRDs (VirtualService, DestinationRule) without altering code.
          </div>
        )}
        {activeTab === 'tracing' && (
          <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
            <strong style={{ color: '#a78bfa' }}>Automatic Observability:</strong> The mesh generates uniform golden signal metrics (latency, traffic, errors, saturation) and automatically injects W3C trace context headers for Zipkin/Jaeger distributed tracing.
          </div>
        )}
      </div>
    </div>
  );
}
