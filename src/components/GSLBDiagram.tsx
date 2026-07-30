import React, { useState } from 'react';

export default function GSLBDiagram() {
  const [routingMode, setRoutingMode] = useState<'latency' | 'failover'>('latency');

  // Failover states
  const [dcAHealthy, setDcAHealthy] = useState(true);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span>Global Server Load Balancing (GSLB) Modes</span>

        {/* Toggle Controls */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button onClick={() => setRoutingMode('latency')} style={{
            padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '12px',
            background: routingMode === 'latency' ? '#38bdf818' : 'rgba(255,255,255,0.04)',
            color: routingMode === 'latency' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
            boxShadow: routingMode === 'latency' ? '0 0 0 1.5px #38bdf850' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}>
            Latency-Based
          </button>
          <button onClick={() => setRoutingMode('failover')} style={{
            padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '12px',
            background: routingMode === 'failover' ? '#fbbf2418' : 'rgba(255,255,255,0.04)',
            color: routingMode === 'failover' ? '#fbbf24' : 'var(--ifm-color-content-secondary)',
            boxShadow: routingMode === 'failover' ? '0 0 0 1.5px #fbbf2450' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}>
            DNS Failover
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }} className="gslb-layout">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .gslb-layout {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 500 280" className="interactive-diagram">
            <defs>
              <marker id="arr-blue" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#38bdf8" />
              </marker>
              <marker id="arr-amber" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#fbbf24" />
              </marker>
              <marker id="arr-gray" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#64748b" />
              </marker>
            </defs>

            {/* Clients */}
            {/* US Client */}
            <g>
              <rect x="30" y="30" width="80" height="35" rx="6" fill="#38bdf818" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="70" y="52" textAnchor="middle" fill="#38bdf8" fontSize="10.5" fontWeight="bold">US Client</text>
            </g>

            {/* EU Client */}
            <g>
              <rect x="390" y="30" width="80" height="35" rx="6" fill="#38bdf818" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="430" y="52" textAnchor="middle" fill="#38bdf8" fontSize="10.5" fontWeight="bold">EU Client</text>
            </g>

            {/* GSLB Controller (DNS Server) */}
            <rect x="200" y="25" width="100" height="45" rx="8" fill="#a78bfa18" stroke="#a78bfa" strokeWidth="1.5" />
            <text x="250" y="47" textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="bold">GSLB Server</text>
            <text x="250" y="60" textAnchor="middle" fill="#94a3b8" fontSize="8">(Route 53 / DNS)</text>

            {/* Data Centers */}
            {/* us-east Data Center */}
            <rect x="40" y="170" width="130" height="65" rx="8" 
                  fill={dcAHealthy ? '#34d39918' : '#f8717118'} 
                  stroke={dcAHealthy ? '#34d399' : '#f87171'} 
                  strokeWidth="1.5" style={{ transition: 'all 0.3s' }} />
            <text x="105" y="195" textAnchor="middle" fill={dcAHealthy ? '#34d399' : '#f87171'} fontSize="11.5" fontWeight="bold">Data Center A</text>
            <text x="105" y="212" textAnchor="middle" fill={dcAHealthy ? '#34d399' : '#f87171'} fontSize="8.5">
              {dcAHealthy ? 'US East (203.0.113.10)' : 'OFFLINE (FAILED)'}
            </text>

            {/* eu-west Data Center */}
            <rect x="330" y="170" width="130" height="65" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            <text x="395" y="195" textAnchor="middle" fill="#94a3b8" fontSize="11.5" fontWeight="bold">Data Center B</text>
            <text x="395" y="212" textAnchor="middle" fill="#64748b" fontSize="8.5">EU West (198.51.100.20)</text>

            {/* Paths */}
            {routingMode === 'latency' ? (
              // Latency-based paths
              <g>
                {/* US Client -> DC A */}
                <path id="path-gslb-usa" d="M 70 65 L 105 162" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arr-blue)" />
                <circle r="3" fill="#38bdf8" className="interactive-diagram-flowing-dot">
                  <animateMotion dur="1.2s" repeatCount="indefinite">
                    <mpath href="#path-gslb-usa" />
                  </animateMotion>
                </circle>

                {/* EU Client -> DC B */}
                <path id="path-gslb-eub" d="M 430 65 L 395 162" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arr-blue)" />
                <circle r="3" fill="#38bdf8" className="interactive-diagram-flowing-dot">
                  <animateMotion dur="1.2s" repeatCount="indefinite">
                    <mpath href="#path-gslb-eub" />
                  </animateMotion>
                </circle>
              </g>
            ) : (
              // Failover GSLB paths
              <g>
                {/* US Client Path */}
                <path id="path-f-us" d="M 70 65 L 105 162" fill="none" 
                      stroke={dcAHealthy ? '#38bdf8' : '#64748b'} 
                      strokeWidth="2" strokeDasharray={dcAHealthy ? '0' : '4 4'}
                      markerEnd={dcAHealthy ? 'url(#arr-blue)' : 'url(#arr-gray)'} />
                {dcAHealthy && (
                  <circle r="3" fill="#38bdf8" className="interactive-diagram-flowing-dot">
                    <animateMotion dur="1.2s" repeatCount="indefinite">
                      <mpath href="#path-f-us" />
                    </animateMotion>
                  </circle>
                )}

                {/* EU Client Path */}
                {dcAHealthy ? (
                  <g>
                    <path id="path-f-eu-a" d="M 430 65 L 120 162" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arr-blue)" />
                    <circle r="3" fill="#38bdf8" className="interactive-diagram-flowing-dot">
                      <animateMotion dur="1.5s" repeatCount="indefinite">
                        <mpath href="#path-f-eu-a" />
                      </animateMotion>
                    </circle>
                  </g>
                ) : (
                  <g>
                    <path id="path-f-eu-b" d="M 430 65 L 395 162" fill="none" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#arr-amber)" />
                    <circle r="3" fill="#fbbf24" className="interactive-diagram-flowing-dot">
                      <animateMotion dur="1s" repeatCount="indefinite">
                        <mpath href="#path-f-eu-b" />
                      </animateMotion>
                    </circle>
                    
                    {/* Redirect US Client as well */}
                    <path id="path-f-us-redirect" d="M 70 65 L 380 162" fill="none" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#arr-amber)" />
                    <circle r="3" fill="#fbbf24" className="interactive-diagram-flowing-dot">
                      <animateMotion dur="1.5s" repeatCount="indefinite">
                        <mpath href="#path-f-us-redirect" />
                      </animateMotion>
                    </circle>
                  </g>
                )}
              </g>
            )}
          </svg>
        </div>

        {/* Controller Card */}
        <div className="interactive-diagram-details-card" style={{ borderColor: routingMode === 'latency' ? '#38bdf840' : '#fbbf2440' }}>
          <div className="interactive-diagram-card-header">
            <h3 style={{ color: routingMode === 'latency' ? '#38bdf8' : '#fbbf24' }}>
              {routingMode === 'latency' ? 'Latency-Based Routing' : 'DNS Failover Routing'}
            </h3>
          </div>
          <p style={{ fontSize: '13px' }}>
            {routingMode === 'latency' 
              ? 'GSLB resolves the DNS query to the IP of the data center topologically nearest to the client, minimizing round-trip times.'
              : 'GSLB resolves all traffic to the primary DC. If the primary health check fails, GSLB dynamically rewrites DNS to route everyone to the standby DR site.'
            }
          </p>

          {routingMode === 'failover' && (
            <div style={{ margin: '14px 0' }}>
              {dcAHealthy ? (
                <button onClick={() => setDcAHealthy(false)} style={{
                  padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#f87171',
                  color: 'white', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'
                }}>
                  💥 Fail Data Center A
                </button>
              ) : (
                <button onClick={() => setDcAHealthy(true)} style={{
                  padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#34d399',
                  color: 'white', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'
                }}>
                  🔄 Restore Data Center A
                </button>
              )}
            </div>
          )}

          <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
            <strong>DNS Resolution Log:</strong>
            {routingMode === 'latency' ? (
              <div style={{ color: '#38bdf8', marginTop: '4px' }}>
                🌐 US user resolved to 203.0.113.10 (DC A).<br/>
                🌐 EU user resolved to 198.51.100.20 (DC B).
              </div>
            ) : dcAHealthy ? (
              <div style={{ color: '#34d399', marginTop: '4px' }}>
                🟢 Primary active. All users resolved to Data Center A (203.0.113.10).
              </div>
            ) : (
              <div style={{ color: '#fbbf24', marginTop: '4px' }}>
                🚨 DC A dead! GSLB updated record: api.example.com → 198.51.100.20 (DC B). Failover complete.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
