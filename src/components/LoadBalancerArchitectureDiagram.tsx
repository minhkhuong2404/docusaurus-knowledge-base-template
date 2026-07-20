import React, { useState } from 'react';

interface ArchitectureNode {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  color: string;
  title: string;
  desc: string;
  details: string[];
}

const NODES: ArchitectureNode[] = [
  {
    id: 'client',
    x: 230, y: 20, w: 140, h: 36,
    label: 'Client (User)',
    color: '#38bdf8',
    title: 'Client Interface',
    desc: 'The starting point of the connection. Originates DNS queries and establishes TLS connections.',
    details: [
      'Queries DNS for API endpoints.',
      'Resolves endpoint to closest target using Anycast/GSLB.',
      'Performs TLS handshake with the nearest load balancer.'
    ]
  },
  {
    id: 'dns',
    x: 230, y: 90, w: 140, h: 36,
    label: 'DNS Resolution',
    color: '#fbbf24',
    title: 'Route 53 / GSLB',
    desc: 'Translates domain names to IP addresses dynamically based on user location and service health.',
    details: [
      'TTL-based failover (e.g. 60-second TTL limits outage duration).',
      'Geoproximity routing reduces latency by matching nearest region.',
      'Automated health checks exclude down regions instantly.'
    ]
  },
  {
    id: 'global-lb',
    x: 230, y: 160, w: 140, h: 36,
    label: 'Global LB (Anycast)',
    color: '#a78bfa',
    title: 'Global Load Balancer',
    desc: 'Uses Anycast routing to advertise a single IP address globally. Directs packets over private fiber to the closest data center.',
    details: [
      'Layer 4 (TCP/UDP) routing via Border Gateway Protocol (BGP).',
      'Absorbs massive distributed DDoS attacks at edge PoPs.',
      'Passes traffic to local application balancers.'
    ]
  },
  {
    id: 'regional-lb',
    x: 230, y: 230, w: 140, h: 36,
    label: 'Regional LB (L7)',
    color: '#2dd4bf',
    title: 'Regional Load Balancer (ALB)',
    desc: 'Layer 7 application-aware router. Terminates TLS, inspects headers, path parameters, and route policies.',
    details: [
      'HTTP-header based routing (e.g., /api/v1 goes to Service Pool).',
      'Manages SSL/TLS termination, freeing backend CPU cycles.',
      'Injects sticky-session cookies and checks target group health.'
    ]
  },
  {
    id: 'services',
    x: 210, y: 300, w: 180, h: 40,
    label: 'Service Pools & Mesh',
    color: '#34d399',
    title: 'Backend Instances & Service Mesh',
    desc: 'Active cluster of application nodes (Kubernetes / ECS) running business logic and communicating via a sidecar mesh.',
    details: [
      'Serves user requests statelessly.',
      'Utilizes sidecar proxies (Envoy) for service-to-service service discovery.',
      'Implements local circuit breakers and retry policies.'
    ]
  }
];

export default function LoadBalancerArchitectureDiagram() {
  const [selectedNode, setSelectedNode] = useState<ArchitectureNode | null>(NODES[2]);

  const activeNode = selectedNode || NODES[2];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span>Load Balancer Architecture Path</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }} className="arch-layout-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .arch-layout-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />
        
        {/* SVG Panel */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 600 365" className="interactive-diagram">
            <defs>
              <marker id="arrow" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="context-fill" />
              </marker>
              
              <marker id="arrow-client" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#38bdf8" />
              </marker>
              <marker id="arrow-dns" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#fbbf24" />
              </marker>
              <marker id="arrow-global" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#a78bfa" />
              </marker>
              <marker id="arrow-regional" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#2dd4bf" />
              </marker>
            </defs>

            {/* Connection paths */}
            {/* Client -> DNS */}
            <path id="path-client-dns" d="M 300 56 L 300 82" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="4 4" />
            <path d="M 300 56 L 300 82" fill="none" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#arrow-dns)"
                  className={activeNode.id === 'dns' ? 'interactive-diagram-flowing-path' : ''} style={{ opacity: activeNode.id === 'dns' ? 1 : 0 }} />

            {/* Client -> Global LB */}
            <path id="path-client-global" d="M 300 56 L 300 152" fill="none" stroke="#e2e8f0" strokeWidth="2" />
            <path d="M 300 56 L 300 152" fill="none" stroke="#a78bfa" strokeWidth="2" markerEnd="url(#arrow-global)"
                  className={activeNode.id === 'global-lb' ? 'interactive-diagram-flowing-path' : ''} style={{ opacity: activeNode.id === 'global-lb' ? 1 : 0 }} />

            {/* Global LB -> Regional LB */}
            <path id="path-global-regional" d="M 300 196 L 300 222" fill="none" stroke="#e2e8f0" strokeWidth="2" />
            <path d="M 300 196 L 300 222" fill="none" stroke="#2dd4bf" strokeWidth="2" markerEnd="url(#arrow-regional)"
                  className={activeNode.id === 'regional-lb' ? 'interactive-diagram-flowing-path' : ''} style={{ opacity: activeNode.id === 'regional-lb' ? 1 : 0 }} />

            {/* Regional LB -> Services */}
            <path id="path-regional-services" d="M 300 266 L 300 292" fill="none" stroke="#e2e8f0" strokeWidth="2" />
            <path d="M 300 266 L 300 292" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#arrow)"
                  className={activeNode.id === 'services' ? 'interactive-diagram-flowing-path' : ''} style={{ opacity: activeNode.id === 'services' ? 1 : 0 }} />

            {/* Render Nodes */}
            {NODES.map(node => {
              const isSelected = activeNode.id === node.id;
              return (
                <g key={node.id} onClick={() => setSelectedNode(node)} style={{ cursor: 'pointer' }}>
                  <rect x={node.x} y={node.y} width={node.w} height={node.h} rx="8"
                        fill={isSelected ? `${node.color}1c` : '#0f172a'}
                        stroke={isSelected ? node.color : 'rgba(255,255,255,0.15)'}
                        strokeWidth={isSelected ? 2 : 1.5}
                        style={{ transition: 'all 0.3s ease' }} />
                  <text x={node.x + node.w / 2} y={node.y + node.h / 2 + 5}
                        textAnchor="middle" fill={isSelected ? node.color : '#e2e8f0'}
                        fontSize="12.5" fontWeight={isSelected ? 'bold' : '600'}
                        style={{ transition: 'all 0.3s ease' }}>
                    {node.label}
                  </text>
                </g>
              );
            })}

            {/* Dynamic flow particles */}
            {activeNode.id === 'dns' && (
              <circle r="3.5" fill="#fbbf24" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-client-dns" />
                </animateMotion>
              </circle>
            )}
            {activeNode.id === 'global-lb' && (
              <circle r="3.5" fill="#a78bfa" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1.2s" repeatCount="indefinite">
                  <mpath href="#path-client-global" />
                </animateMotion>
              </circle>
            )}
            {activeNode.id === 'regional-lb' && (
              <circle r="3.5" fill="#2dd4bf" className="interactive-diagram-flowing-dot">
                <animateMotion dur="0.8s" repeatCount="indefinite">
                  <mpath href="#path-global-regional" />
                </animateMotion>
              </circle>
            )}
            {activeNode.id === 'services' && (
              <circle r="3.5" fill="#34d399" className="interactive-diagram-flowing-dot">
                <animateMotion dur="0.8s" repeatCount="indefinite">
                  <mpath href="#path-regional-services" />
                </animateMotion>
              </circle>
            )}
          </svg>
        </div>

        {/* Details Card */}
        <div className="interactive-diagram-details-card" style={{ borderColor: `${activeNode.color}40` }}>
          <div className="interactive-diagram-card-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={activeNode.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="8" rx="2"/>
              <line x1="6" y1="6" x2="6.01" y2="6"/>
            </svg>
            <h3 style={{ color: activeNode.color }}>{activeNode.title}</h3>
          </div>
          <p style={{ fontSize: '13px' }}>{activeNode.desc}</p>
          <ul style={{ fontSize: '12px', paddingLeft: '16px' }}>
            {activeNode.details.map((detail, idx) => (
              <li key={idx} style={{ marginBottom: '6px' }}>{detail}</li>
            ))}
          </ul>
          <p className="interactive-diagram-helper-text" style={{ marginTop: '12px', textAlign: 'left' }}>
            💡 Click any diagram node to inspect details.
          </p>
        </div>
      </div>
    </div>
  );
}
