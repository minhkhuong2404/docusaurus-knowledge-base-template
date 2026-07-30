import React from 'react';

export default function L7PathRoutingDiagram() {
  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 3 21 3 21 8"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
        <span>Topology 3: L7 Load Balancer with Path Routing (ALB)</span>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '16px' }}>
        <svg viewBox="0 0 500 130" className="interactive-diagram">
          <defs>
            <marker id="arr-top3" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="#38bdf8" />
            </marker>
          </defs>

          {/* Client */}
          <rect x="20" y="45" width="80" height="40" rx="6" fill="#38bdf818" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="60" y="69" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold">Client</text>

          {/* AWS ALB */}
          <rect x="160" y="40" width="120" height="50" rx="6" fill="#a78bfa18" stroke="#a78bfa" strokeWidth="1.5" />
          <text x="220" y="63" textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="bold">AWS ALB (L7)</text>
          <text x="220" y="77" textAnchor="middle" fill="#94a3b8" fontSize="8.5">(Inspects URL Path)</text>

          {/* Target User Service */}
          <rect x="340" y="15" width="130" height="40" rx="6" fill="#34d39918" stroke="#34d399" strokeWidth="1.5" />
          <text x="405" y="39" textAnchor="middle" fill="#34d399" fontSize="10.5" fontWeight="bold">/api/users → User Svc</text>

          {/* Target Order Service */}
          <rect x="340" y="75" width="130" height="40" rx="6" fill="#fbbf2418" stroke="#fbbf24" strokeWidth="1.5" />
          <text x="405" y="99" textAnchor="middle" fill="#fbbf24" fontSize="10.5" fontWeight="bold">/api/orders → Order Svc</text>

          {/* Connectors */}
          <path d="M 100 65 L 152 65" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arr-top3)" />
          <path d="M 280 60 L 332 35" stroke="#a78bfa" strokeWidth="1.5" markerEnd="url(#arr-top3)" />
          <path d="M 280 70 L 332 95" stroke="#a78bfa" strokeWidth="1.5" markerEnd="url(#arr-top3)" />
        </svg>
      </div>
    </div>
  );
}
