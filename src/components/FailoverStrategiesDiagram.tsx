import React, { useState } from 'react';

export default function FailoverStrategiesDiagram() {
  const [activeTab, setActiveTab] = useState<'passive' | 'active'>('passive');
  
  // Passive Failover States
  const [primaryHealthy, setPrimaryHealthy] = useState(true);
  const [passiveTriggered, setPassiveTriggered] = useState(false);

  // Active Failover States
  const [instanceAHealthy, setInstanceAHealthy] = useState(true);

  const resetPassive = () => {
    setPrimaryHealthy(true);
    setPassiveTriggered(false);
  };

  const failPrimary = () => {
    setPrimaryHealthy(false);
    // Simulate automatic switch after heartbeat fail
    setTimeout(() => {
      setPassiveTriggered(true);
    }, 1000);
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </svg>
        <span>Failover Strategies Explorer</span>
        
        {/* Tab Buttons */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button onClick={() => setActiveTab('passive')} style={{
            padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '12px',
            background: activeTab === 'passive' ? '#fbbf2418' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'passive' ? '#fbbf24' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'passive' ? '0 0 0 1.5px #fbbf2450' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}>
            Active-Passive
          </button>
          <button onClick={() => setActiveTab('active')} style={{
            padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '12px',
            background: activeTab === 'active' ? '#34d39918' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'active' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'active' ? '0 0 0 1.5px #34d39950' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}>
            Active-Active
          </button>
        </div>
      </div>

      {activeTab === 'passive' ? (
        // ACTIVE-PASSIVE ARCHETYPE
        <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }} className="failover-layout-grid">
          <style dangerouslySetInnerHTML={{__html: `
            @media (max-width: 768px) {
              .failover-layout-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `}} />
          
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
            <svg viewBox="0 0 500 300" className="interactive-diagram">
              <defs>
                <marker id="arr-blue" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#38bdf8" />
                </marker>
                <marker id="arr-gray" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#64748b" />
                </marker>
              </defs>

              {/* Client Node */}
              <rect x="40" y="130" width="80" height="40" rx="8" fill="#38bdf818" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="80" y="155" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="bold">Client</text>

              {/* Load Balancer Node */}
              <rect x="200" y="130" width="80" height="40" rx="8" fill="#a78bfa18" stroke="#a78bfa" strokeWidth="1.5" />
              <text x="240" y="155" textAnchor="middle" fill="#a78bfa" fontSize="12" fontWeight="bold">Load Balancer</text>

              {/* Connection Client -> LB */}
              <path id="flow-client-lb" d="M 120 150 L 192 150" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arr-blue)" />
              <circle r="3" fill="#38bdf8" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#flow-client-lb" />
                </animateMotion>
              </circle>

              {/* Primary Node */}
              <rect x="360" y="50" width="100" height="45" rx="8" 
                    fill={primaryHealthy ? '#34d39918' : '#f8717118'} 
                    stroke={primaryHealthy ? '#34d399' : '#f87171'} 
                    strokeWidth="1.5" style={{ transition: 'all 0.3s' }} />
              <text x="410" y="72" textAnchor="middle" fill={primaryHealthy ? '#34d399' : '#f87171'} fontSize="11" fontWeight="bold">Primary Server</text>
              <text x="410" y="86" textAnchor="middle" fill={primaryHealthy ? '#34d399' : '#f87171'} fontSize="9" style={{ opacity: 0.8 }}>
                {primaryHealthy ? 'ACTIVE (100% Load)' : 'OFFLINE (CRASH)'}
              </text>

              {/* Standby Node */}
              <rect x="360" y="200" width="100" height="45" rx="8" 
                    fill={passiveTriggered ? '#34d39918' : 'rgba(255,255,255,0.03)'} 
                    stroke={passiveTriggered ? '#34d399' : '#64748b'} 
                    strokeWidth="1.5" style={{ transition: 'all 0.3s' }} />
              <text x="410" y="222" textAnchor="middle" fill={passiveTriggered ? '#34d399' : '#94a3b8'} fontSize="11" fontWeight="bold">Standby Server</text>
              <text x="410" y="236" textAnchor="middle" fill={passiveTriggered ? '#34d399' : '#64748b'} fontSize="9">
                {passiveTriggered ? 'ACTIVE (Failover)' : 'IDLE (Hot Standby)'}
              </text>

              {/* LB -> Primary Path */}
              <path id="path-lb-primary" d="M 280 140 L 352 85" fill="none" 
                    stroke={primaryHealthy ? '#38bdf8' : '#64748b'} 
                    strokeWidth="2" strokeDasharray={primaryHealthy ? '0' : '4 4'}
                    markerEnd={primaryHealthy ? 'url(#arr-blue)' : 'url(#arr-gray)'} />
              {primaryHealthy && (
                <circle r="3" fill="#38bdf8" className="interactive-diagram-flowing-dot">
                  <animateMotion dur="1s" repeatCount="indefinite">
                    <mpath href="#path-lb-primary" />
                  </animateMotion>
                </circle>
              )}

              {/* LB -> Standby Path */}
              <path id="path-lb-standby" d="M 280 160 L 352 215" fill="none" 
                    stroke={passiveTriggered ? '#38bdf8' : '#64748b'} 
                    strokeWidth="2" strokeDasharray={passiveTriggered ? '0' : '4 4'}
                    markerEnd={passiveTriggered ? 'url(#arr-blue)' : 'url(#arr-gray)'} />
              {passiveTriggered && (
                <circle r="3" fill="#38bdf8" className="interactive-diagram-flowing-dot">
                  <animateMotion dur="1s" repeatCount="indefinite">
                    <mpath href="#path-lb-standby" />
                  </animateMotion>
                </circle>
              )}

              {/* Heartbeat Line */}
              <path d="M 410 98 L 410 192" fill="none" 
                    stroke={primaryHealthy ? '#fbbf24' : '#f87171'} 
                    strokeWidth="1.5" strokeDasharray="3 3" />
              <text x="415" y="148" fill={primaryHealthy ? '#fbbf24' : '#f87171'} fontSize="9" fontWeight="bold">
                {primaryHealthy ? 'Heartbeat OK' : 'Heartbeat Failed'}
              </text>
            </svg>
          </div>

          {/* Controller Card */}
          <div className="interactive-diagram-details-card" style={{ borderColor: '#fbbf2450' }}>
            <div className="interactive-diagram-card-header">
              <h3 style={{ color: '#fbbf24' }}>Active-Passive Strategy</h3>
            </div>
            <p style={{ fontSize: '13px' }}>
              One active primary processes 100% of the traffic. A secondary (standby) is kept synchronized but idle.
            </p>
            <div style={{ margin: '14px 0' }}>
              {primaryHealthy ? (
                <button onClick={failPrimary} style={{
                  padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#f87171',
                  color: 'white', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'
                }}>
                  💥 Simulate Primary Failure
                </button>
              ) : (
                <button onClick={resetPassive} style={{
                  padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#34d399',
                  color: 'white', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'
                }}>
                  🔄 Reset Infrastructure
                </button>
              )}
            </div>
            
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
              <strong>Status Log:</strong>
              {!primaryHealthy && !passiveTriggered && (
                <div style={{ color: '#fbbf24', marginTop: '4px' }}>⚠️ Heartbeat lost! Detecting outage (RTO timer running)...</div>
              )}
              {passiveTriggered && (
                <div style={{ color: '#34d399', marginTop: '4px' }}>✅ Failover complete! Standby promoted to Active. VIP/DNS updated.</div>
              )}
              {primaryHealthy && (
                <div style={{ marginTop: '4px' }}>🟢 Primary Server running. Standby synchronizing state.</div>
              )}
            </div>
            
            <ul style={{ fontSize: '11px', marginTop: '12px', paddingLeft: '16px' }}>
              <li><strong>RTO (Recovery Time):</strong> 1–5 minutes (DNS propagation / VIP sweep).</li>
              <li><strong>RPO (Data Loss):</strong> Depends on replication mode (Async vs Sync).</li>
            </ul>
          </div>
        </div>
      ) : (
        // ACTIVE-ACTIVE ARCHETYPE
        <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }} className="failover-layout-grid">
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
            <svg viewBox="0 0 500 300" className="interactive-diagram">
              <defs>
                <marker id="arr-blue" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#38bdf8" />
                </marker>
                <marker id="arr-gray" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#64748b" />
                </marker>
              </defs>

              {/* Client Node */}
              <rect x="40" y="130" width="80" height="40" rx="8" fill="#38bdf818" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="80" y="155" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="bold">Client</text>

              {/* Load Balancer Node */}
              <rect x="200" y="130" width="80" height="40" rx="8" fill="#a78bfa18" stroke="#a78bfa" strokeWidth="1.5" />
              <text x="240" y="155" textAnchor="middle" fill="#a78bfa" fontSize="12" fontWeight="bold">Load Balancer</text>

              {/* Client -> LB Connection */}
              <path id="flow-client-lb-aa" d="M 120 150 L 192 150" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arr-blue)" />
              <circle r="3" fill="#38bdf8" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#flow-client-lb-aa" />
                </animateMotion>
              </circle>

              {/* Instance A */}
              <rect x="360" y="50" width="100" height="45" rx="8" 
                    fill={instanceAHealthy ? '#34d39918' : '#f8717118'} 
                    stroke={instanceAHealthy ? '#34d399' : '#f87171'} 
                    strokeWidth="1.5" style={{ transition: 'all 0.3s' }} />
              <text x="410" y="72" textAnchor="middle" fill={instanceAHealthy ? '#34d399' : '#f87171'} fontSize="11" fontWeight="bold">Server Instance A</text>
              <text x="410" y="86" textAnchor="middle" fill={instanceAHealthy ? '#34d399' : '#f87171'} fontSize="9">
                {instanceAHealthy ? 'ACTIVE (50% Load)' : 'OFFLINE (CRASH)'}
              </text>

              {/* Instance B */}
              <rect x="360" y="200" width="100" height="45" rx="8" fill="#34d39918" stroke="#34d399" strokeWidth="1.5" />
              <text x="410" y="222" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="bold">Server Instance B</text>
              <text x="410" y="236" textAnchor="middle" fill="#34d399" fontSize="9">
                {instanceAHealthy ? 'ACTIVE (50% Load)' : 'ACTIVE (100% Load)'}
              </text>

              {/* LB -> Instance A Path */}
              <path id="path-lb-a" d="M 280 140 L 352 85" fill="none" 
                    stroke={instanceAHealthy ? '#38bdf8' : '#64748b'} 
                    strokeWidth="2" strokeDasharray={instanceAHealthy ? '0' : '4 4'}
                    markerEnd={instanceAHealthy ? 'url(#arr-blue)' : 'url(#arr-gray)'} />
              {instanceAHealthy && (
                <circle r="3" fill="#38bdf8" className="interactive-diagram-flowing-dot">
                  <animateMotion dur="1.5s" repeatCount="indefinite">
                    <mpath href="#path-lb-a" />
                  </animateMotion>
                </circle>
              )}

              {/* LB -> Instance B Path */}
              <path id="path-lb-b" d="M 280 160 L 352 215" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arr-blue)" />
              <circle r="3" fill="#38bdf8" className="interactive-diagram-flowing-dot">
                <animateMotion dur={instanceAHealthy ? '1.5s' : '0.7s'} repeatCount="indefinite">
                  <mpath href="#path-lb-b" />
                </animateMotion>
              </circle>
            </svg>
          </div>

          {/* Controller Card */}
          <div className="interactive-diagram-details-card" style={{ borderColor: '#34d39950' }}>
            <div className="interactive-diagram-card-header">
              <h3 style={{ color: '#34d399' }}>Active-Active Strategy</h3>
            </div>
            <p style={{ fontSize: '13px' }}>
              All nodes actively handle traffic simultaneously. If one fails, the load balancer dynamically routes traffic to the surviving instances.
            </p>
            <div style={{ margin: '14px 0' }}>
              {instanceAHealthy ? (
                <button onClick={() => setInstanceAHealthy(false)} style={{
                  padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#f87171',
                  color: 'white', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'
                }}>
                  💥 Crash Instance A
                </button>
              ) : (
                <button onClick={() => setInstanceAHealthy(true)} style={{
                  padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#34d399',
                  color: 'white', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'
                }}>
                  🔄 Restart Instance A
                </button>
              )}
            </div>

            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
              <strong>Status Log:</strong>
              {!instanceAHealthy ? (
                <div style={{ color: '#f97316', marginTop: '4px' }}>⚠️ Instance A down! Load Balancer redirected 100% of queries to Instance B.</div>
              ) : (
                <div style={{ color: '#34d399', marginTop: '4px' }}>🟢 Both nodes healthy. Load is split 50/50.</div>
              )}
            </div>

            <ul style={{ fontSize: '11px', marginTop: '12px', paddingLeft: '16px' }}>
              <li><strong>RTO (Recovery Time):</strong> Milliseconds (LB health checks remove failed nodes).</li>
              <li><strong>RPO (Data Loss):</strong> Zero (no replication delay if databases are shared).</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
