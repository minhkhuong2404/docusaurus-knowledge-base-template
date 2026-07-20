import React, { useState } from 'react';

export default function SessionPersistenceDiagram() {
  const [activeTab, setActiveTab] = useState<'sticky' | 'stateless'>('sticky');

  // Sticky States
  const [serverAHealthy, setServerAHealthy] = useState(true);
  const [stickyCrashTriggered, setStickyCrashTriggered] = useState(false);

  // Stateless States
  const [statelessServerAHealthy, setStatelessServerAHealthy] = useState(true);
  const [statelessCrashTriggered, setStatelessCrashTriggered] = useState(false);

  const triggerStickyCrash = () => {
    setServerAHealthy(false);
    setStickyCrashTriggered(true);
  };

  const resetSticky = () => {
    setServerAHealthy(true);
    setStickyCrashTriggered(false);
  };

  const triggerStatelessCrash = () => {
    setStatelessServerAHealthy(false);
    setStatelessCrashTriggered(true);
  };

  const resetStateless = () => {
    setStatelessServerAHealthy(true);
    setStatelessCrashTriggered(false);
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span>Session Persistence & Affinity Models</span>

        {/* Tab Selector */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button onClick={() => setActiveTab('sticky')} style={{
            padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '12px',
            background: activeTab === 'sticky' ? '#fbbf2418' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'sticky' ? '#fbbf24' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'sticky' ? '0 0 0 1.5px #fbbf2450' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}>
            Sticky Sessions
          </button>
          <button onClick={() => setActiveTab('stateless')} style={{
            padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '12px',
            background: activeTab === 'stateless' ? '#34d39918' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'stateless' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'stateless' ? '0 0 0 1.5px #34d39950' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}>
            Stateless (Redis Cache)
          </button>
        </div>
      </div>

      {activeTab === 'sticky' ? (
        // STICKY SESSIONS ARCHETYPE
        <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }} className="persistence-layout">
          <style dangerouslySetInnerHTML={{__html: `
            @media (max-width: 768px) {
              .persistence-layout {
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
                <marker id="arr-gray" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#64748b" />
                </marker>
              </defs>

              {/* Client Alice */}
              <rect x="40" y="120" width="80" height="40" rx="8" fill="#38bdf818" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="80" y="145" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="bold">Alice (Client)</text>

              {/* Load Balancer */}
              <rect x="180" y="120" width="80" height="40" rx="8" fill="#a78bfa18" stroke="#a78bfa" strokeWidth="1.5" />
              <text x="220" y="145" textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="bold">Sticky LB</text>

              {/* Client -> LB */}
              <path id="path-st-client" d="M 120 140 L 172 140" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arr-blue)" />
              <circle r="3" fill="#38bdf8" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-st-client" />
                </animateMotion>
              </circle>

              {/* Server A */}
              <rect x="340" y="40" width="120" height="55" rx="8" 
                    fill={serverAHealthy ? '#38bdf818' : '#f8717118'} 
                    stroke={serverAHealthy ? '#38bdf8' : '#f87171'} 
                    strokeWidth="1.5" style={{ transition: 'all 0.3s' }} />
              <text x="400" y="62" textAnchor="middle" fill={serverAHealthy ? '#38bdf8' : '#f87171'} fontSize="11.5" fontWeight="bold">Server A</text>
              <text x="400" y="78" textAnchor="middle" fill={serverAHealthy ? '#38bdf8' : '#f87171'} fontSize="8.5">
                {serverAHealthy ? 'Active (Session: Alice)' : 'OFFLINE'}
              </text>

              {/* Server B */}
              <rect x="340" y="175" width="120" height="55" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
              <text x="400" y="197" textAnchor="middle" fill="#94a3b8" fontSize="11.5" fontWeight="bold">Server B</text>
              <text x="400" y="213" textAnchor="middle" fill="#64748b" fontSize="8.5">
                {!serverAHealthy ? 'Active (No Alice Session)' : 'Active (Session: Empty)'}
              </text>

              {/* LB -> Server A Path */}
              <path id="path-st-a" d="M 260 130 L 332 78" fill="none" 
                    stroke={serverAHealthy ? '#38bdf8' : '#64748b'} 
                    strokeWidth="2" strokeDasharray={serverAHealthy ? '0' : '4 4'}
                    markerEnd={serverAHealthy ? 'url(#arr-blue)' : 'url(#arr-gray)'} />
              {serverAHealthy && (
                <circle r="3" fill="#38bdf8" className="interactive-diagram-flowing-dot">
                  <animateMotion dur="1s" repeatCount="indefinite">
                    <mpath href="#path-st-a" />
                  </animateMotion>
                </circle>
              )}

              {/* LB -> Server B Path */}
              <path id="path-st-b" d="M 260 150 L 332 202" fill="none" 
                    stroke={!serverAHealthy ? '#38bdf8' : '#64748b'} 
                    strokeWidth="2" strokeDasharray={!serverAHealthy ? '0' : '4 4'}
                    markerEnd={!serverAHealthy ? 'url(#arr-blue)' : 'url(#arr-gray)'} />
              {!serverAHealthy && (
                <circle r="3" fill="#38bdf8" className="interactive-diagram-flowing-dot">
                  <animateMotion dur="1s" repeatCount="indefinite">
                    <mpath href="#path-st-b" />
                  </animateMotion>
                </circle>
              )}
            </svg>
          </div>

          <div className="interactive-diagram-details-card" style={{ borderColor: '#fbbf2450' }}>
            <div className="interactive-diagram-card-header">
              <h3 style={{ color: '#fbbf24' }}>Sticky Sessions</h3>
            </div>
            <p style={{ fontSize: '13px' }}>
              The Load Balancer uses cookies or IP hashing to pin a user's session to a specific backend server.
            </p>

            <div style={{ margin: '14px 0' }}>
              {serverAHealthy ? (
                <button onClick={triggerStickyCrash} style={{
                  padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#f87171',
                  color: 'white', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'
                }}>
                  💥 Crash Server A
                </button>
              ) : (
                <button onClick={resetSticky} style={{
                  padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#34d399',
                  color: 'white', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'
                }}>
                  🔄 Reset Servers
                </button>
              )}
            </div>

            <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)' }}>
              <strong>System Impact:</strong>
              {stickyCrashTriggered ? (
                <div style={{ color: '#f87171', marginTop: '4px' }}>
                  🚨 Server A crashed! Alice's next request was sent to Server B. However, Server B does not have her session data in memory. **Alice is logged out.**
                </div>
              ) : (
                <div style={{ color: '#34d399', marginTop: '4px' }}>
                  🟢 Active. LB uses cookie `SERVERID=server-a` to keep Alice pinned to Server A.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // STATELESS SESSIONS ARCHETYPE
        <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }} className="persistence-layout">
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
            <svg viewBox="0 0 500 280" className="interactive-diagram">
              <defs>
                <marker id="arr-blue" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#38bdf8" />
                </marker>
                <marker id="arr-green" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#34d399" />
                </marker>
                <marker id="arr-gray" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#64748b" />
                </marker>
              </defs>

              {/* Client Alice */}
              <rect x="40" y="80" width="80" height="40" rx="8" fill="#38bdf818" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="80" y="105" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="bold">Alice (Client)</text>

              {/* Load Balancer */}
              <rect x="180" y="80" width="80" height="40" rx="8" fill="#a78bfa18" stroke="#a78bfa" strokeWidth="1.5" />
              <text x="220" y="105" textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="bold">Stateless LB</text>

              <path id="path-sl-client" d="M 120 100 L 172 100" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arr-blue)" />
              <circle r="3" fill="#38bdf8" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-sl-client" />
                </animateMotion>
              </circle>

              {/* Server A */}
              <rect x="340" y="20" width="120" height="50" rx="8" 
                    fill={statelessServerAHealthy ? '#34d39918' : '#f8717118'} 
                    stroke={statelessServerAHealthy ? '#34d399' : '#f87171'} 
                    strokeWidth="1.5" style={{ transition: 'all 0.3s' }} />
              <text x="400" y="42" textAnchor="middle" fill={statelessServerAHealthy ? '#34d399' : '#f87171'} fontSize="11" fontWeight="bold">Server A</text>
              <text x="400" y="56" textAnchor="middle" fill={statelessServerAHealthy ? '#34d399' : '#f87171'} fontSize="8" style={{ opacity: 0.8 }}>
                {statelessServerAHealthy ? 'Stateless (No Session Memory)' : 'OFFLINE'}
              </text>

              {/* Server B */}
              <rect x="340" y="120" width="120" height="50" rx="8" fill="#34d39918" stroke="#34d399" strokeWidth="1.5" />
              <text x="400" y="142" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="bold">Server B</text>
              <text x="400" y="156" textAnchor="middle" fill="#34d399" fontSize="8" style={{ opacity: 0.8 }}>
                Stateless (No Session Memory)
              </text>

              {/* Redis Session Store */}
              <rect x="230" y="210" width="180" height="50" rx="8" fill="#f472b618" stroke="#f472b6" strokeWidth="1.5" />
              <text x="320" y="232" textAnchor="middle" fill="#f472b6" fontSize="11.5" fontWeight="bold">Redis Shared Session Cache</text>
              <text x="320" y="246" textAnchor="middle" fill="#f472b6" fontSize="8.5">Stores: Alice Session token</text>

              {/* LB -> Server A Path */}
              <path id="path-sl-a" d="M 260 90 L 332 55" fill="none" 
                    stroke={statelessServerAHealthy ? '#38bdf8' : '#64748b'} 
                    strokeWidth="2" strokeDasharray={statelessServerAHealthy ? '0' : '4 4'}
                    markerEnd={statelessServerAHealthy ? 'url(#arr-blue)' : 'url(#arr-gray)'} />
              {statelessServerAHealthy && (
                <circle r="3" fill="#38bdf8" className="interactive-diagram-flowing-dot">
                  <animateMotion dur="1s" repeatCount="indefinite">
                    <mpath href="#path-sl-a" />
                  </animateMotion>
                </circle>
              )}

              {/* LB -> Server B Path */}
              <path id="path-sl-b" d="M 260 110 L 332 140" fill="none" 
                    stroke={!statelessServerAHealthy ? '#38bdf8' : '#64748b'} 
                    strokeWidth="2" strokeDasharray={!statelessServerAHealthy ? '0' : '4 4'}
                    markerEnd={!statelessServerAHealthy ? 'url(#arr-blue)' : 'url(#arr-gray)'} />
              {!statelessServerAHealthy && (
                <circle r="3" fill="#38bdf8" className="interactive-diagram-flowing-dot">
                  <animateMotion dur="1s" repeatCount="indefinite">
                    <mpath href="#path-sl-b" />
                  </animateMotion>
                </circle>
              )}

              {/* Servers -> Redis Paths */}
              <path d="M 400 70 L 400 210" fill="none" stroke="#f472b6" strokeWidth="1.5" strokeDasharray="3 3" />
              <path d="M 380 170 L 320 210" fill="none" stroke="#f472b6" strokeWidth="1.5" strokeDasharray="3 3" />
            </svg>
          </div>

          <div className="interactive-diagram-details-card" style={{ borderColor: '#34d39950' }}>
            <div className="interactive-diagram-card-header">
              <h3 style={{ color: '#34d399' }}>Stateless Sessions</h3>
            </div>
            <p style={{ fontSize: '13px' }}>
              Sessions are decoupled from servers. User tokens are stored in a distributed, memory-based Redis cluster accessed by all nodes.
            </p>

            <div style={{ margin: '14px 0' }}>
              {statelessServerAHealthy ? (
                <button onClick={triggerStatelessCrash} style={{
                  padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#f87171',
                  color: 'white', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'
                }}>
                  💥 Crash Server A
                </button>
              ) : (
                <button onClick={resetStateless} style={{
                  padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#34d399',
                  color: 'white', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'
                }}>
                  🔄 Reset Servers
                </button>
              )}
            </div>

            <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)' }}>
              <strong>System Impact:</strong>
              {statelessCrashTriggered ? (
                <div style={{ color: '#34d399', marginTop: '4px' }}>
                  🟢 Server A crashed! Alice's next request was sent to Server B. Server B reads the session token from Redis. **Alice remains logged in seamlessly.**
                </div>
              ) : (
                <div style={{ color: '#34d399', marginTop: '4px' }}>
                  🟢 Active. Servers remain stateless. Any instance can process Alice's requests by talking to Redis.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
