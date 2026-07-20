import React from 'react';

export default function L4LoadBalancerDiagram() {
  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
        <span>Topology 2: Reverse Proxy + L4 Load Balancer (High TCP Throughput)</span>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '16px' }}>
        <svg viewBox="0 0 500 130" className="interactive-diagram">
          <defs>
            <marker id="arr-top2" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="#38bdf8" />
            </marker>
          </defs>

          {/* Client */}
          <rect x="20" y="45" width="80" height="40" rx="6" fill="#38bdf818" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="60" y="69" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold">Client</text>

          {/* AWS NLB */}
          <rect x="150" y="40" width="110" height="50" rx="6" fill="#34d39918" stroke="#34d399" strokeWidth="1.5" />
          <text x="205" y="63" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="bold">AWS NLB (L4)</text>
          <text x="205" y="77" textAnchor="middle" fill="#94a3b8" fontSize="8.5">(TCP Distribution)</text>

          {/* Nginx Cluster */}
          <rect x="300" y="15" width="100" height="40" rx="6" fill="#a78bfa18" stroke="#a78bfa" strokeWidth="1.5" />
          <text x="350" y="39" textAnchor="middle" fill="#a78bfa" fontSize="10.5" fontWeight="bold">Nginx Node 1</text>

          <rect x="300" y="75" width="100" height="40" rx="6" fill="#a78bfa18" stroke="#a78bfa" strokeWidth="1.5" />
          <text x="350" y="99" textAnchor="middle" fill="#a78bfa" fontSize="10.5" fontWeight="bold">Nginx Node 2</text>

          {/* Backends */}
          <rect x="435" y="45" width="60" height="40" rx="6" fill="#fbbf2418" stroke="#fbbf24" strokeWidth="1.5" />
          <text x="465" y="69" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="bold">Apps</text>

          {/* Connectors */}
          <path d="M 100 65 L 142 65" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arr-top2)" />
          <path d="M 260 60 L 292 35" stroke="#34d399" strokeWidth="1.5" markerEnd="url(#arr-top2)" />
          <path d="M 260 70 L 292 95" stroke="#34d399" strokeWidth="1.5" markerEnd="url(#arr-top2)" />
          <path d="M 400 35 L 427 60" stroke="#a78bfa" strokeWidth="1.5" />
          <path d="M 400 95 L 427 65" stroke="#a78bfa" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  );
}
