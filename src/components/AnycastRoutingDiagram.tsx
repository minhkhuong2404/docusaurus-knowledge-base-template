import React, { useState } from 'react';

export default function AnycastRoutingDiagram() {
  const [activeClient, setActiveClient] = useState<'us' | 'eu'>('us');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span>Anycast Routing Mechanics</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }} className="anycast-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .anycast-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* SVG Panel */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 500 280" className="interactive-diagram">
            <defs>
              <marker id="arr-blue" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#38bdf8" />
              </marker>
            </defs>

            {/* Clients */}
            <g onClick={() => setActiveClient('us')} style={{ cursor: 'pointer' }}>
              <rect x="40" y="30" width="100" height="40" rx="6" 
                    fill={activeClient === 'us' ? '#38bdf818' : 'rgba(255,255,255,0.03)'} 
                    stroke={activeClient === 'us' ? '#38bdf8' : 'rgba(255,255,255,0.15)'} 
                    strokeWidth="1.5" />
              <text x="90" y="55" textAnchor="middle" fill={activeClient === 'us' ? '#38bdf8' : '#e2e8f0'} fontSize="11" fontWeight="bold">US Client</text>
            </g>

            <g onClick={() => setActiveClient('eu')} style={{ cursor: 'pointer' }}>
              <rect x="360" y="30" width="100" height="40" rx="6" 
                    fill={activeClient === 'eu' ? '#38bdf818' : 'rgba(255,255,255,0.03)'} 
                    stroke={activeClient === 'eu' ? '#38bdf8' : 'rgba(255,255,255,0.15)'} 
                    strokeWidth="1.5" />
              <text x="410" y="55" textAnchor="middle" fill={activeClient === 'eu' ? '#38bdf8' : '#e2e8f0'} fontSize="11" fontWeight="bold">EU Client</text>
            </g>

            {/* Shared IP Node */}
            <text x="250" y="110" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="bold">
              Shared IP: 104.16.82.100 (Announced globally via BGP)
            </text>

            {/* Servers (PoPs) */}
            <g>
              <rect x="60" y="170" width="120" height="60" rx="8" fill="#0f172a" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
              <text x="120" y="195" textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold">US Edge PoP</text>
              <text x="120" y="215" textAnchor="middle" fill="#64748b" fontSize="10">IP: 104.16.82.100</text>
            </g>

            <g>
              <rect x="320" y="170" width="120" height="60" rx="8" fill="#0f172a" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
              <text x="380" y="195" textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold">EU Edge PoP</text>
              <text x="380" y="215" textAnchor="middle" fill="#64748b" fontSize="10">IP: 104.16.82.100</text>
            </g>

            {/* Routing Paths */}
            {/* US Path */}
            <path id="path-anycast-us" d="M 90 70 L 120 162" fill="none" 
                  stroke={activeClient === 'us' ? '#38bdf8' : 'rgba(255,255,255,0.08)'} 
                  strokeWidth="2" strokeDasharray={activeClient === 'us' ? '0' : '4 4'}
                  markerEnd={activeClient === 'us' ? 'url(#arr-blue)' : ''} />
            {activeClient === 'us' && (
              <circle r="3" fill="#38bdf8" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-anycast-us" />
                </animateMotion>
              </circle>
            )}

            {/* EU Path */}
            <path id="path-anycast-eu" d="M 410 70 L 380 162" fill="none" 
                  stroke={activeClient === 'eu' ? '#38bdf8' : 'rgba(255,255,255,0.08)'} 
                  strokeWidth="2" strokeDasharray={activeClient === 'eu' ? '0' : '4 4'}
                  markerEnd={activeClient === 'eu' ? 'url(#arr-blue)' : ''} />
            {activeClient === 'eu' && (
              <circle r="3" fill="#38bdf8" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-anycast-eu" />
                </animateMotion>
              </circle>
            )}
          </svg>
        </div>

        {/* Info Card */}
        <div className="interactive-diagram-details-card" style={{ borderColor: '#38bdf840' }}>
          <div className="interactive-diagram-card-header">
            <h3 style={{ color: '#38bdf8' }}>Anycast Routing</h3>
          </div>
          <p style={{ fontSize: '13px' }}>
            In Anycast, multiple physically separate servers announce the exact same IP address to the internet using **BGP (Border Gateway Protocol)**.
          </p>

          <div style={{ fontSize: '12.5px', marginTop: '14px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px' }}>
            {activeClient === 'us' ? (
              <div>
                🇺🇸 <strong>Routing client in US:</strong>
                <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px', marginBottom: 0 }}>
                  Internet routers identify the US Edge PoP as the shortest topological path. Packets arrive at the US server instantly.
                </p>
              </div>
            ) : (
              <div>
                🇪🇺 <strong>Routing client in EU:</strong>
                <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px', marginBottom: 0 }}>
                  Internet routers identify the EU Edge PoP as the topologically closest. The client reaches the EU server without any DNS redirection.
                </p>
              </div>
            )}
          </div>

          <p className="interactive-diagram-helper-text" style={{ marginTop: '12px', textAlign: 'left' }}>
            💡 Click on either client node to see where their traffic is routed.
          </p>
        </div>
      </div>
    </div>
  );
}
