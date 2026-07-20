import React, { useState } from 'react';

export default function LoadBalancerTypesDiagram() {
  const [activeTab, setActiveTab] = useState<'l4l7' | 'health' | 'algo'>('l4l7');
  const [selectedAlgo, setSelectedAlgo] = useState<'rr' | 'least' | 'hash'>('rr');
  const [algoRequestCount, setAlgoRequestCount] = useState<number>(0);

  // Health check simulation states
  const [nodeBHealthy, setNodeBHealthy] = useState<boolean>(true);

  const handleSendRequest = () => {
    setAlgoRequestCount(c => c + 1);
  };

  const getTargetServer = () => {
    if (selectedAlgo === 'rr') {
      const idx = (algoRequestCount % 3);
      return idx === 0 ? 'Server A' : idx === 1 ? 'Server B' : 'Server C';
    } else if (selectedAlgo === 'least') {
      // Server B has fewest connections
      return 'Server B (3 active conns)';
    } else {
      // IP Hash
      return 'Server A (Hashed from IP 192.168.1.5)';
    }
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
        <span>Load Balancer Mechanics — L4/L7, Health Checks & Algorithms</span>

        {/* Tab selector */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setActiveTab('l4l7')} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: activeTab === 'l4l7' ? '#38bdf818' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'l4l7' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'l4l7' ? '0 0 0 1.5px #38bdf850' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}>
            L4 vs. L7
          </button>
          <button onClick={() => setActiveTab('health')} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: activeTab === 'health' ? '#34d39918' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'health' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'health' ? '0 0 0 1.5px #34d39950' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}>
            Health Checks
          </button>
          <button onClick={() => setActiveTab('algo')} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: activeTab === 'algo' ? '#a78bfa18' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'algo' ? '#a78bfa' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'algo' ? '0 0 0 1.5px #a78bfa50' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}>
            Algorithms
          </button>
        </div>
      </div>

      {activeTab === 'l4l7' && (
        <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', alignItems: 'start' }} className="lb-grid">
          <style dangerouslySetInnerHTML={{__html: `
            @media (max-width: 768px) {
              .lb-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `}} />

          {/* L4 Card */}
          <div className="interactive-diagram-details-card" style={{ borderColor: '#38bdf840' }}>
            <div className="interactive-diagram-card-header">
              <h3 style={{ color: '#38bdf8' }}>Layer 4 Load Balancer (Transport)</h3>
            </div>
            <p style={{ fontSize: '12.5px', color: '#e2e8f0' }}>
              Routes raw <strong>TCP / UDP packets</strong> based on IP address and port numbers only. Does NOT inspect HTTP headers or payload.
            </p>
            <div style={{ fontSize: '11.5px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div>⚡ <strong>Speed:</strong> Ultra-fast (hardware wire-speed)</div>
              <div>🔒 <strong>TLS:</strong> Passthrough or edge termination</div>
              <div>☁️ <strong>AWS Equivalent:</strong> Network Load Balancer (NLB)</div>
            </div>
          </div>

          {/* L7 Card */}
          <div className="interactive-diagram-details-card" style={{ borderColor: '#34d39940' }}>
            <div className="interactive-diagram-card-header">
              <h3 style={{ color: '#34d399' }}>Layer 7 Load Balancer (Application)</h3>
            </div>
            <p style={{ fontSize: '12.5px', color: '#e2e8f0' }}>
              Decrypts and inspects <strong>HTTP / HTTPS content</strong>. Routes based on URL path (e.g. <code>/api/users</code>), headers, or cookies.
            </p>
            <div style={{ fontSize: '11.5px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div>🧠 <strong>Intelligence:</strong> Path routing, header rewriting, cookies</div>
              <div>🔒 <strong>TLS:</strong> Terminates TLS to inspect HTTP body</div>
              <div>☁️ <strong>AWS Equivalent:</strong> Application Load Balancer (ALB)</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'health' && (
        <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }} className="lb-grid">
          {/* Active Health Check Diagram */}
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '14px' }}>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', fontWeight: 'bold', marginBottom: '10px' }}>
              ACTIVE HEALTH CHECK PROBES (Every 10s to /actuator/health):
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ padding: '8px 12px', borderRadius: '6px', background: '#34d39915', border: '1px solid #34d399', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#34d399' }}>Server A (10.0.1.5)</span>
                <span style={{ fontSize: '10.5px', color: '#34d399', fontWeight: 'bold' }}>HTTP 200 OK — IN ROTATION 🟢</span>
              </div>

              <div style={{
                padding: '8px 12px', borderRadius: '6px',
                background: nodeBHealthy ? '#34d39915' : '#f8717115',
                border: `1px solid ${nodeBHealthy ? '#34d399' : '#f87171'}`,
                display: 'flex', justifyContent: 'space-between', transition: 'all 0.3s'
              }}>
                <span style={{ fontSize: '11.5px', fontWeight: 'bold', color: nodeBHealthy ? '#34d399' : '#f87171' }}>
                  Server B (10.0.1.6)
                </span>
                <span style={{ fontSize: '10.5px', color: nodeBHealthy ? '#34d399' : '#f87171', fontWeight: 'bold' }}>
                  {nodeBHealthy ? 'HTTP 200 OK — IN ROTATION 🟢' : 'HTTP 503 — REMOVED FROM ROTATION 🚨'}
                </span>
              </div>

              <div style={{ padding: '8px 12px', borderRadius: '6px', background: '#34d39915', border: '1px solid #34d399', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#34d399' }}>Server C (10.0.1.7)</span>
                <span style={{ fontSize: '10.5px', color: '#34d399', fontWeight: 'bold' }}>HTTP 200 OK — IN ROTATION 🟢</span>
              </div>
            </div>
          </div>

          <div className="interactive-diagram-details-card" style={{ borderColor: '#34d39940' }}>
            <div className="interactive-diagram-card-header">
              <h3>Health Checking Controls</h3>
            </div>
            <p style={{ fontSize: '12.5px', color: '#e2e8f0' }}>
              The Load Balancer continuously probes <code>/actuator/health</code>. Unhealthy targets are immediately pulled from the routing table.
            </p>

            <div style={{ margin: '12px 0' }}>
              {nodeBHealthy ? (
                <button onClick={() => setNodeBHealthy(false)} style={{
                  padding: '7px 12px', borderRadius: '6px', border: 'none', background: '#f87171',
                  color: 'white', fontWeight: 'bold', fontSize: '11.5px', cursor: 'pointer'
                }}>
                  💥 Fail Server B (Return 503)
                </button>
              ) : (
                <button onClick={() => setNodeBHealthy(true)} style={{
                  padding: '7px 12px', borderRadius: '6px', border: 'none', background: '#34d399',
                  color: 'white', fontWeight: 'bold', fontSize: '11.5px', cursor: 'pointer'
                }}>
                  🔄 Recover Server B (Return 200)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'algo' && (
        <div style={{ display: 'grid', gridTemplateColumns: '45% 55%', gap: '16px', alignItems: 'start' }} className="lb-grid">
          {/* Algo Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={() => setSelectedAlgo('rr')} style={{
              padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left',
              background: selectedAlgo === 'rr' ? '#a78bfa18' : 'rgba(255,255,255,0.03)',
              boxShadow: selectedAlgo === 'rr' ? '0 0 0 1.5px #a78bfa50' : '0 0 0 1px rgba(255,255,255,0.06)'
            }}>
              <strong style={{ fontSize: '12px', color: '#a78bfa' }}>Round Robin</strong>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Sequential rotation (A → B → C)</div>
            </button>

            <button onClick={() => setSelectedAlgo('least')} style={{
              padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left',
              background: selectedAlgo === 'least' ? '#34d39918' : 'rgba(255,255,255,0.03)',
              boxShadow: selectedAlgo === 'least' ? '0 0 0 1.5px #34d39950' : '0 0 0 1px rgba(255,255,255,0.06)'
            }}>
              <strong style={{ fontSize: '12px', color: '#34d399' }}>Least Connections</strong>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Routes to server with fewest active connections</div>
            </button>

            <button onClick={() => setSelectedAlgo('hash')} style={{
              padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left',
              background: selectedAlgo === 'hash' ? '#fbbf2418' : 'rgba(255,255,255,0.03)',
              boxShadow: selectedAlgo === 'hash' ? '0 0 0 1.5px #fbbf2450' : '0 0 0 1px rgba(255,255,255,0.06)'
            }}>
              <strong style={{ fontSize: '12px', color: '#fbbf24' }}>IP Hash (Sticky)</strong>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Hashes client IP to ensure same server mapping</div>
            </button>
          </div>

          {/* Simulator Card */}
          <div className="interactive-diagram-details-card" style={{ borderColor: '#a78bfa40' }}>
            <div className="interactive-diagram-card-header">
              <h3>Algorithm Simulation</h3>
            </div>

            <div style={{ margin: '12px 0' }}>
              <button onClick={handleSendRequest} style={{
                padding: '8px 14px', borderRadius: '6px', border: 'none', background: '#a78bfa',
                color: '#090b14', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'
              }}>
                ⚡ Send Request #{algoRequestCount + 1}
              </button>
            </div>

            <div style={{ fontSize: '12px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px' }}>
              <strong>Routing Outcome:</strong>
              <div style={{ color: '#34d399', fontWeight: 'bold', marginTop: '4px' }}>
                ➡️ Target: {getTargetServer()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
