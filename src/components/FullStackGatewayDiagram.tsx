import React from 'react';

export default function FullStackGatewayDiagram() {
  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
        </svg>
        <span>Topology 4: Full Stack Architecture (NLB + API Gateway + Microservices)</span>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '16px' }}>
        <svg viewBox="0 0 500 120" className="interactive-diagram">
          <defs>
            <marker id="arr-top4" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="#38bdf8" />
            </marker>
          </defs>

          {/* Client */}
          <rect x="15" y="40" width="70" height="40" rx="6" fill="#38bdf818" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="50" y="64" textAnchor="middle" fill="#38bdf8" fontSize="10.5" fontWeight="bold">Client</text>

          {/* NLB */}
          <rect x="115" y="40" width="85" height="40" rx="6" fill="#34d39918" stroke="#34d399" strokeWidth="1.5" />
          <text x="157" y="64" textAnchor="middle" fill="#34d399" fontSize="10.5" fontWeight="bold">AWS NLB</text>

          {/* API Gateway */}
          <rect x="230" y="35" width="120" height="50" rx="6" fill="#fbbf2418" stroke="#fbbf24" strokeWidth="1.5" />
          <text x="290" y="58" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="bold">API Gateway</text>
          <text x="290" y="72" textAnchor="middle" fill="#94a3b8" fontSize="8.5">(Kong / Spring Gateway)</text>

          {/* Microservices */}
          <rect x="380" y="40" width="105" height="40" rx="6" fill="#a78bfa18" stroke="#a78bfa" strokeWidth="1.5" />
          <text x="432" y="64" textAnchor="middle" fill="#a78bfa" fontSize="10.5" fontWeight="bold">Microservices</text>

          {/* Connectors */}
          <path d="M 85 60 L 107 60" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arr-top4)" />
          <path d="M 200 60 L 222 60" stroke="#34d399" strokeWidth="1.5" markerEnd="url(#arr-top4)" />
          <path d="M 350 60 L 372 60" stroke="#fbbf24" strokeWidth="1.5" markerEnd="url(#arr-top4)" />
        </svg>
      </div>
    </div>
  );
}
