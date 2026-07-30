import React, { useState, useEffect } from 'react';

export default function DeploymentStrategiesDiagram() {
  const [activeTab, setActiveTab] = useState<'bluegreen' | 'canary' | 'rolling'>('bluegreen');

  // Blue-Green States
  const [bgTraffic, setBgTraffic] = useState<'blue' | 'green'>('blue');

  // Canary States
  const [canaryStage, setCanaryStage] = useState<5 | 25 | 100>(5);
  const [canaryAborted, setCanaryAborted] = useState(false);

  // Rolling States
  const [rollingStep, setRollingStep] = useState<number>(0);
  const [rollingActive, setRollingActive] = useState(false);

  useEffect(() => {
    if (!rollingActive) return;
    if (rollingStep >= 4) {
      setRollingActive(false);
      return;
    }
    const t = setTimeout(() => {
      setRollingStep(s => s + 1);
    }, 1500);
    return () => clearTimeout(t);
  }, [rollingActive, rollingStep]);

  const startRolling = () => {
    setRollingStep(0);
    setRollingActive(true);
  };

  const getBGColor = (type: 'blue' | 'green') => {
    if (bgTraffic === type) return '#38bdf8';
    return '#64748b';
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
        <span>Zero-Downtime Deployment Strategies</span>

        {/* Tabs */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          {([
            { id: 'bluegreen', label: 'Blue-Green', color: '#38bdf8' },
            { id: 'canary', label: 'Canary', color: '#fbbf24' },
            { id: 'rolling', label: 'Rolling Update', color: '#34d399' }
          ] as const).map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: '12px',
              background: activeTab === t.id ? `${t.color}18` : 'rgba(255,255,255,0.04)',
              color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
              boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}50` : '0 0 0 1px rgba(255,255,255,0.08)',
              transition: 'all 0.2s ease',
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'bluegreen' && (
        // BLUE-GREEN TAB
        <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }} className="deploy-layout">
          <style dangerouslySetInnerHTML={{__html: `
            @media (max-width: 768px) {
              .deploy-layout {
                grid-template-columns: 1fr !important;
              }
            }
          `}} />

          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
            <svg viewBox="0 0 500 260" className="interactive-diagram">
              <defs>
                <marker id="arr-blue" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#38bdf8" />
                </marker>
                <marker id="arr-emerald" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#34d399" />
                </marker>
                <marker id="arr-gray" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#64748b" />
                </marker>
              </defs>

              {/* Client */}
              <rect x="40" y="110" width="80" height="40" rx="8" fill="#38bdf818" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="80" y="135" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="bold">User Traffic</text>

              {/* Router */}
              <rect x="180" y="110" width="80" height="40" rx="8" fill="#a78bfa18" stroke="#a78bfa" strokeWidth="1.5" />
              <text x="220" y="135" textAnchor="middle" fill="#a78bfa" fontSize="12" fontWeight="bold">Router / LB</text>

              <path id="path-bg-user" d="M 120 130 L 172 130" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arr-blue)" />
              <circle r="3" fill="#38bdf8" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-bg-user" />
                </animateMotion>
              </circle>

              {/* Blue Pool */}
              <rect x="340" y="40" width="120" height="50" rx="8" 
                    fill={bgTraffic === 'blue' ? '#38bdf818' : 'rgba(255,255,255,0.02)'} 
                    stroke={bgTraffic === 'blue' ? '#38bdf8' : '#64748b'} 
                    strokeWidth="1.5" style={{ transition: 'all 0.3s' }} />
              <text x="400" y="65" textAnchor="middle" fill={bgTraffic === 'blue' ? '#38bdf8' : '#94a3b8'} fontSize="12" fontWeight="bold">Blue Cluster (v1)</text>
              <text x="400" y="80" textAnchor="middle" fill={bgTraffic === 'blue' ? '#38bdf8' : '#64748b'} fontSize="9">
                {bgTraffic === 'blue' ? '100% Traffic' : '0% Traffic (Standby)'}
              </text>

              {/* Green Pool */}
              <rect x="340" y="170" width="120" height="50" rx="8" 
                    fill={bgTraffic === 'green' ? '#34d39918' : 'rgba(255,255,255,0.02)'} 
                    stroke={bgTraffic === 'green' ? '#34d399' : '#64748b'} 
                    strokeWidth="1.5" style={{ transition: 'all 0.3s' }} />
              <text x="400" y="195" textAnchor="middle" fill={bgTraffic === 'green' ? '#34d399' : '#94a3b8'} fontSize="12" fontWeight="bold">Green Cluster (v2)</text>
              <text x="400" y="210" textAnchor="middle" fill={bgTraffic === 'green' ? '#34d399' : '#64748b'} fontSize="9">
                {bgTraffic === 'green' ? '100% Traffic' : '0% Traffic (Staging)'}
              </text>

              {/* Paths from Router */}
              <path id="path-to-blue" d="M 260 120 L 332 75" fill="none" 
                    stroke={bgTraffic === 'blue' ? '#38bdf8' : '#64748b'} 
                    strokeWidth="2" strokeDasharray={bgTraffic === 'blue' ? '0' : '4 4'}
                    markerEnd={bgTraffic === 'blue' ? 'url(#arr-blue)' : 'url(#arr-gray)'} />
              {bgTraffic === 'blue' && (
                <circle r="3" fill="#38bdf8" className="interactive-diagram-flowing-dot">
                  <animateMotion dur="1s" repeatCount="indefinite">
                    <mpath href="#path-to-blue" />
                  </animateMotion>
                </circle>
              )}

              <path id="path-to-green" d="M 260 140 L 332 185" fill="none" 
                    stroke={bgTraffic === 'green' ? '#34d399' : '#64748b'} 
                    strokeWidth="2" strokeDasharray={bgTraffic === 'green' ? '0' : '4 4'}
                    markerEnd={bgTraffic === 'green' ? 'url(#arr-emerald)' : 'url(#arr-gray)'} />
              {bgTraffic === 'green' && (
                <circle r="3" fill="#34d399" className="interactive-diagram-flowing-dot">
                  <animateMotion dur="1s" repeatCount="indefinite">
                    <mpath href="#path-to-green" />
                  </animateMotion>
                </circle>
              )}
            </svg>
          </div>

          <div className="interactive-diagram-details-card" style={{ borderColor: '#38bdf850' }}>
            <div className="interactive-diagram-card-header">
              <h3 style={{ color: '#38bdf8' }}>Blue-Green Deployment</h3>
            </div>
            <p style={{ fontSize: '13px' }}>
              Two identical physical environments are maintained. Traffic is switched atomically by updating the load balancer rules.
            </p>
            <div style={{ margin: '14px 0' }}>
              <button onClick={() => setBgTraffic(bgTraffic === 'blue' ? 'green' : 'blue')} style={{
                padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#38bdf8',
                color: '#090b14', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'
              }}>
                🎛️ Toggle Router Switch
              </button>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
              <strong>Operational Log:</strong>
              {bgTraffic === 'blue' ? (
                <div style={{ marginTop: '4px' }}>🔵 Running version 1.0.0 in Blue environment. Green is idle and ready for deployment.</div>
              ) : (
                <div style={{ color: '#34d399', marginTop: '4px' }}>🟢 Running version 2.0.0 in Green. Blue is preserved for instant rollback if issues occur.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'canary' && (
        // CANARY TAB
        <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }} className="deploy-layout">
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
            <svg viewBox="0 0 500 260" className="interactive-diagram">
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

              {/* Client */}
              <rect x="40" y="110" width="80" height="40" rx="8" fill="#38bdf818" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="80" y="135" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="bold">User Traffic</text>

              {/* Router */}
              <rect x="180" y="110" width="80" height="40" rx="8" fill="#a78bfa18" stroke="#a78bfa" strokeWidth="1.5" />
              <text x="220" y="135" textAnchor="middle" fill="#a78bfa" fontSize="12" fontWeight="bold">Canary LB</text>

              <path id="path-can-user" d="M 120 130 L 172 130" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arr-blue)" />
              <circle r="3" fill="#38bdf8" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-can-user" />
                </animateMotion>
              </circle>

              {/* v1 Pool */}
              <rect x="340" y="40" width="120" height="50" rx="8" 
                    fill={canaryAborted || canaryStage < 100 ? '#38bdf818' : 'rgba(255,255,255,0.02)'} 
                    stroke={canaryAborted || canaryStage < 100 ? '#38bdf8' : '#64748b'} 
                    strokeWidth="1.5" />
              <text x="400" y="65" textAnchor="middle" fill={canaryAborted || canaryStage < 100 ? '#38bdf8' : '#94a3b8'} fontSize="12" fontWeight="bold">Production v1</text>
              <text x="400" y="80" textAnchor="middle" fill={canaryAborted || canaryStage < 100 ? '#38bdf8' : '#64748b'} fontSize="9">
                {canaryAborted ? '100% Traffic' : `${100 - canaryStage}% Traffic`}
              </text>

              {/* v2 Pool */}
              <rect x="340" y="170" width="120" height="50" rx="8" 
                    fill={!canaryAborted && canaryStage > 0 ? '#fbbf2418' : 'rgba(255,255,255,0.02)'} 
                    stroke={!canaryAborted && canaryStage > 0 ? '#fbbf24' : '#64748b'} 
                    strokeWidth="1.5" />
              <text x="400" y="195" textAnchor="middle" fill={!canaryAborted && canaryStage > 0 ? '#fbbf24' : '#94a3b8'} fontSize="12" fontWeight="bold">Canary v2</text>
              <text x="400" y="210" textAnchor="middle" fill={!canaryAborted && canaryStage > 0 ? '#fbbf24' : '#64748b'} fontSize="9">
                {canaryAborted ? '0% (Aborted)' : `${canaryStage}% Traffic`}
              </text>

              {/* Paths */}
              <path id="path-can-v1" d="M 260 120 L 332 75" fill="none" 
                    stroke={canaryAborted || canaryStage < 100 ? '#38bdf8' : '#64748b'} 
                    strokeWidth="2" markerEnd={canaryAborted || canaryStage < 100 ? 'url(#arr-blue)' : 'url(#arr-gray)'} />
              {(canaryAborted || canaryStage < 100) && (
                <circle r="3" fill="#38bdf8" className="interactive-diagram-flowing-dot">
                  <animateMotion dur="1s" repeatCount="indefinite">
                    <mpath href="#path-can-v1" />
                  </animateMotion>
                </circle>
              )}

              <path id="path-can-v2" d="M 260 140 L 332 185" fill="none" 
                    stroke={!canaryAborted && canaryStage > 0 ? '#fbbf24' : '#64748b'} 
                    strokeWidth="2" markerEnd={!canaryAborted && canaryStage > 0 ? 'url(#arr-amber)' : 'url(#arr-gray)'} />
              {!canaryAborted && canaryStage > 0 && (
                <circle r="3" fill="#fbbf24" className="interactive-diagram-flowing-dot">
                  <animateMotion dur="1s" repeatCount="indefinite">
                    <mpath href="#path-can-v2" />
                  </animateMotion>
                </circle>
              )}
            </svg>
          </div>

          <div className="interactive-diagram-details-card" style={{ borderColor: '#fbbf2450' }}>
            <div className="interactive-diagram-card-header">
              <h3 style={{ color: '#fbbf24' }}>Canary Deployment</h3>
            </div>
            <p style={{ fontSize: '13px' }}>
              Expose a small percentage of users to the new version (v2). Watch error rates and metrics, then roll out to 100% or roll back.
            </p>

            <div style={{ display: 'flex', gap: '8px', margin: '14px 0' }}>
              <button onClick={() => { setCanaryStage(5); setCanaryAborted(false); }} style={{
                padding: '6px 10px', borderRadius: '6px', border: 'none', background: 'rgba(251,191,36,0.15)',
                color: '#fbbf24', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold'
              }}>5%</button>
              <button onClick={() => { setCanaryStage(25); setCanaryAborted(false); }} style={{
                padding: '6px 10px', borderRadius: '6px', border: 'none', background: 'rgba(251,191,36,0.15)',
                color: '#fbbf24', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold'
              }}>25%</button>
              <button onClick={() => { setCanaryStage(100); setCanaryAborted(false); }} style={{
                padding: '6px 10px', borderRadius: '6px', border: 'none', background: 'rgba(52,211,153,0.15)',
                color: '#34d399', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold'
              }}>100%</button>
              <button onClick={() => setCanaryAborted(true)} style={{
                padding: '6px 10px', borderRadius: '6px', border: 'none', background: 'rgba(248,113,113,0.2)',
                color: '#f87171', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold'
              }}>Abort 🚫</button>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
              <strong>Status Log:</strong>
              {canaryAborted ? (
                <div style={{ color: '#f87171', marginTop: '4px' }}>🚨 Rollout Aborted! All traffic routed back to production v1.0.0.</div>
              ) : canaryStage === 100 ? (
                <div style={{ color: '#34d399', marginTop: '4px' }}>🟢 Full promotion complete! v2.0.0 is serving 100% of user traffic.</div>
              ) : (
                <div style={{ marginTop: '4px' }}>🟡 Routing {canaryStage}% of requests to Canary nodes for quality verification.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rolling' && (
        // ROLLING UPDATE TAB
        <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }} className="deploy-layout">
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
            <svg viewBox="0 0 500 260" className="interactive-diagram">
              {/* Pool Nodes */}
              {([
                { id: 1, x: 100, y: 50, label: 'Pod 1' },
                { id: 2, x: 280, y: 50, label: 'Pod 2' },
                { id: 3, x: 100, y: 150, label: 'Pod 3' },
                { id: 4, x: 280, y: 150, label: 'Pod 4' }
              ]).map(pod => {
                let podColor = '#38bdf8'; // v1 (blue)
                let statusText = 'v1.0.0';
                
                if (rollingStep >= pod.id) {
                  podColor = '#34d399'; // v2 (green)
                  statusText = 'v2.0.0';
                } else if (rollingActive && rollingStep === pod.id - 1) {
                  podColor = '#fbbf24'; // updating
                  statusText = 'Updating...';
                }

                return (
                  <g key={pod.id}>
                    <rect x={pod.x} y={pod.y} width={120} height={50} rx="8"
                          fill={`${podColor}15`} stroke={podColor} strokeWidth="1.5"
                          style={{ transition: 'all 0.5s ease' }} />
                    <text x={pod.x + 60} y={pod.y + 25} textAnchor="middle" fill={podColor} fontSize="11" fontWeight="bold">
                      {pod.label}
                    </text>
                    <text x={pod.x + 60} y={pod.y + 40} textAnchor="middle" fill={podColor} fontSize="9">
                      {statusText}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="interactive-diagram-details-card" style={{ borderColor: '#34d39950' }}>
            <div className="interactive-diagram-card-header">
              <h3 style={{ color: '#34d399' }}>Rolling Update</h3>
            </div>
            <p style={{ fontSize: '13px' }}>
              Instances in the pool are updated incrementally one-by-one. Ensures the cluster always has capacity to handle traffic.
            </p>

            <div style={{ margin: '14px 0' }}>
              <button onClick={startRolling} disabled={rollingActive} style={{
                padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#34d399',
                color: '#090b14', fontWeight: 'bold', fontSize: '12px', cursor: rollingActive ? 'not-allowed' : 'pointer',
                opacity: rollingActive ? 0.5 : 1
              }}>
                🚀 Start Rolling Update
              </button>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
              <strong>Status Log:</strong>
              {rollingActive ? (
                <div style={{ color: '#fbbf24', marginTop: '4px' }}>⚙️ Updating Pod {rollingStep + 1} of 4...</div>
              ) : rollingStep === 4 ? (
                <div style={{ color: '#34d399', marginTop: '4px' }}>🟢 All pods successfully updated to v2.0.0.</div>
              ) : (
                <div style={{ marginTop: '4px' }}>🔵 Click "Start Rolling Update" to trigger rollout.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
