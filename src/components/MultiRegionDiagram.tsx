import React, { useState } from 'react';

export default function MultiRegionDiagram() {
  const [regionAHealthy, setRegionAHealthy] = useState(true);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span>Multi-Region Active-Active Replication Failover</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }} className="multi-region-layout">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .multi-region-layout {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* SVG Panel */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 500 320" className="interactive-diagram">
            <defs>
              <marker id="arr-blue" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#38bdf8" />
              </marker>
              <marker id="arr-green" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#34d399" />
              </marker>
              <marker id="arr-amber" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#fbbf24" />
              </marker>
              <marker id="arr-red" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#f87171" />
              </marker>
            </defs>

            {/* Region A Container */}
            <rect x="20" y="70" width="200" height="230" rx="10" 
                  fill={regionAHealthy ? '#0f172a' : '#f8717106'} 
                  stroke={regionAHealthy ? 'rgba(255,255,255,0.1)' : '#f87171'} 
                  strokeWidth="1.5" strokeDasharray={regionAHealthy ? '0' : '4 4'}
                  style={{ transition: 'all 0.3s' }} />
            <text x="120" y="90" textAnchor="middle" fill={regionAHealthy ? '#e2e8f0' : '#f87171'} fontSize="11" fontWeight="bold">
              Region A (US East)
            </text>

            {/* Region B Container */}
            <rect x="280" y="70" width="200" height="230" rx="10" fill="#0f172a" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
            <text x="380" y="90" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="bold">
              Region B (EU West)
            </text>

            {/* Clients */}
            {/* US User */}
            <g>
              <rect x="40" y="10" width="70" height="30" rx="5" fill="#38bdf818" stroke="#38bdf8" strokeWidth="1" />
              <text x="75" y="28" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">US Client</text>
            </g>

            {/* EU User */}
            <g>
              <rect x="390" y="10" width="70" height="30" rx="5" fill="#38bdf818" stroke="#38bdf8" strokeWidth="1" />
              <text x="425" y="28" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">EU Client</text>
            </g>

            {/* DNS Paths */}
            {/* US User Path */}
            {regionAHealthy ? (
              <path id="path-dns-a" d="M 75 40 L 120 100" fill="none" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arr-blue)" />
            ) : (
              <path id="path-dns-a-redirect" d="M 75 40 L 320 100" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arr-amber)" />
            )}
            {!regionAHealthy && (
              <circle r="2.5" fill="#fbbf24" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1.5s" repeatCount="indefinite">
                  <path d="M 75 40 L 320 100" fill="none" />
                </animateMotion>
              </circle>
            )}
            {regionAHealthy && (
              <circle r="2.5" fill="#38bdf8" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-dns-a" />
                </animateMotion>
              </circle>
            )}

            {/* EU User Path */}
            <path id="path-dns-b" d="M 425 40 L 380 100" fill="none" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arr-blue)" />
            <circle r="2.5" fill="#38bdf8" className="interactive-diagram-flowing-dot">
              <animateMotion dur="1s" repeatCount="indefinite">
                <mpath href="#path-dns-b" />
              </animateMotion>
            </circle>

            {/* Region A Internal Nodes */}
            <g style={{ opacity: regionAHealthy ? 1 : 0.3, transition: 'all 0.3s' }}>
              <rect x="70" y="110" width="100" height="30" rx="5" fill="#a78bfa18" stroke="#a78bfa" strokeWidth="1.2" />
              <text x="120" y="128" textAnchor="middle" fill="#a78bfa" fontSize="10" fontWeight="bold">ALB us-east</text>

              <rect x="70" y="170" width="100" height="30" rx="5" fill="#2dd4bf18" stroke="#2dd4bf" strokeWidth="1.2" />
              <text x="120" y="188" textAnchor="middle" fill="#2dd4bf" fontSize="10" fontWeight="bold">App Servers</text>

              <rect x="70" y="230" width="100" height="30" rx="5" fill="#34d39918" stroke="#34d399" strokeWidth="1.2" />
              <text x="120" y="248" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="bold">DB us-east</text>

              {/* Internal Paths */}
              <line x1="120" y1="140" x2="120" y2="165" stroke="#e2e8f0" strokeWidth="1" />
              <line x1="120" y1="200" x2="120" y2="225" stroke="#e2e8f0" strokeWidth="1" />
            </g>

            {/* Region B Internal Nodes */}
            <g>
              <rect x="330" y="110" width="100" height="30" rx="5" fill="#a78bfa18" stroke="#a78bfa" strokeWidth="1.2" />
              <text x="380" y="128" textAnchor="middle" fill="#a78bfa" fontSize="10" fontWeight="bold">ALB eu-west</text>

              <rect x="330" y="170" width="100" height="30" rx="5" fill="#2dd4bf18" stroke="#2dd4bf" strokeWidth="1.2" />
              <text x="380" y="188" textAnchor="middle" fill="#2dd4bf" fontSize="10" fontWeight="bold">App Servers</text>

              <rect x="330" y="230" width="100" height="30" rx="5" fill="#34d39918" stroke="#34d399" strokeWidth="1.2" />
              <text x="380" y="248" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="bold">DB eu-west</text>

              {/* Internal Paths */}
              <line x1="380" y1="140" x2="380" y2="165" stroke="#e2e8f0" strokeWidth="1" />
              <line x1="380" y1="200" x2="380" y2="225" stroke="#e2e8f0" strokeWidth="1" />
            </g>

            {/* Bidirectional Database Replication Line */}
            {regionAHealthy ? (
              <g>
                <path id="db-rep-a-b" d="M 170 245 L 330 245" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4 4" />
                <circle r="2.5" fill="#fbbf24" className="interactive-diagram-flowing-dot">
                  <animateMotion dur="2.5s" repeatCount="indefinite">
                    <mpath href="#db-rep-a-b" />
                  </animateMotion>
                </circle>
              </g>
            ) : (
              <g>
                <path d="M 170 245 L 330 245" fill="none" stroke="#f87171" strokeWidth="1.5" strokeDasharray="3 3" />
                <text x="250" y="238" textAnchor="middle" fill="#f87171" fontSize="9" fontWeight="bold">Replication Down</text>
                <line x1="230" y1="240" x2="270" y2="250" stroke="#f87171" strokeWidth="2" />
              </g>
            )}
          </svg>
        </div>

        {/* Controller Card */}
        <div className="interactive-diagram-details-card" style={{ borderColor: regionAHealthy ? 'rgba(255,255,255,0.08)' : '#f8717150' }}>
          <div className="interactive-diagram-card-header">
            <h3 style={{ color: regionAHealthy ? '#e2e8f0' : '#f87171' }}>Multi-Region Deployment</h3>
          </div>
          <p style={{ fontSize: '13px' }}>
            Normally, clients connect to their closest region. Databases replicate continuously across regions.
          </p>

          <div style={{ margin: '14px 0' }}>
            {regionAHealthy ? (
              <button onClick={() => setRegionAHealthy(false)} style={{
                padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#f87171',
                color: 'white', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'
              }}>
                💥 Simulate Region A Outage
              </button>
            ) : (
              <button onClick={() => setRegionAHealthy(true)} style={{
                padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#34d399',
                color: 'white', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'
              }}>
                🔄 Restore Region A
              </button>
            )}
          </div>

          <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
            <strong>Traffic Status:</strong>
            {!regionAHealthy ? (
              <div style={{ color: '#fbbf24', marginTop: '4px' }}>
                ⚠️ US clients routed to Region B (EU West). Latency increased (+120ms). Reads may be stale due to lack of real-time replication.
              </div>
            ) : (
              <div style={{ color: '#34d399', marginTop: '4px' }}>
                🟢 Region-aware routing functioning. Synchronizing cross-region databases.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
