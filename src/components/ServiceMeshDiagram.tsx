import React from 'react';

export default function ServiceMeshDiagram() {
  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
        </svg>
        <span>Topology 5: Service Mesh (East-West Sidecar Proxy mTLS)</span>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '16px' }}>
        <svg viewBox="0 0 500 130" className="interactive-diagram">
          <defs>
            <marker id="arr-top5" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="#2dd4bf" />
            </marker>
          </defs>

          {/* Pod A */}
          <rect x="30" y="25" width="180" height="80" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="120" y="45" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold">Pod A (Order Service)</text>
          <rect x="42" y="55" width="70" height="35" rx="4" fill="#38bdf818" />
          <text x="77" y="76" textAnchor="middle" fill="#38bdf8" fontSize="9.5">App Code</text>
          <rect x="125" y="55" width="72" height="35" rx="4" fill="#2dd4bf20" stroke="#2dd4bf" strokeWidth="1" />
          <text x="161" y="76" textAnchor="middle" fill="#2dd4bf" fontSize="9" fontWeight="bold">Envoy Sidecar</text>

          {/* Pod B */}
          <rect x="290" y="25" width="180" height="80" rx="8" fill="#0f172a" stroke="#a78bfa" strokeWidth="1.5" />
          <text x="380" y="45" textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="bold">Pod B (Payment Service)</text>
          <rect x="302" y="55" width="72" height="35" rx="4" fill="#2dd4bf20" stroke="#2dd4bf" strokeWidth="1" />
          <text x="338" y="76" textAnchor="middle" fill="#2dd4bf" fontSize="9" fontWeight="bold">Envoy Sidecar</text>
          <rect x="385" y="55" width="70" height="35" rx="4" fill="#a78bfa18" />
          <text x="420" y="76" textAnchor="middle" fill="#a78bfa" fontSize="9.5">App Code</text>

          {/* mTLS Connection Arrow */}
          <path d="M 197 72 L 294 72" stroke="#2dd4bf" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arr-top5)" />
          <text x="245" y="64" textAnchor="middle" fill="#2dd4bf" fontSize="9" fontWeight="bold">mTLS Tunnel</text>
        </svg>
      </div>
    </div>
  );
}
