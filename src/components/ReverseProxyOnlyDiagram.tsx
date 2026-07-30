import React from 'react';

export default function ReverseProxyOnlyDiagram() {
  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="4"/>
          <line x1="12" y1="2" x2="12" y2="22"/>
        </svg>
        <span>Topology 1: Reverse Proxy Only (Monolith)</span>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '16px' }}>
        <svg viewBox="0 0 500 120" className="interactive-diagram">
          <defs>
            <marker id="arr-top1" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="#38bdf8" />
            </marker>
          </defs>

          {/* Client */}
          <rect x="20" y="40" width="90" height="40" rx="6" fill="#38bdf818" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="65" y="64" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold">Client</text>

          {/* Reverse Proxy */}
          <rect x="180" y="35" width="130" height="50" rx="6" fill="#34d39918" stroke="#34d399" strokeWidth="1.5" />
          <text x="245" y="58" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="bold">Nginx / Caddy</text>
          <text x="245" y="72" textAnchor="middle" fill="#94a3b8" fontSize="8.5">(TLS Term & Static Cache)</text>

          {/* Single App Server */}
          <rect x="370" y="40" width="110" height="40" rx="6" fill="#a78bfa18" stroke="#a78bfa" strokeWidth="1.5" />
          <text x="425" y="64" textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="bold">App Server</text>

          {/* Connectors */}
          <path d="M 110 60 L 172 60" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arr-top1)" />
          <path d="M 310 60 L 362 60" stroke="#34d399" strokeWidth="1.5" markerEnd="url(#arr-top1)" />
        </svg>
      </div>
    </div>
  );
}
