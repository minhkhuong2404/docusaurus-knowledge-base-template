import React, { useState } from 'react';

type NearbyTab = 'fanout' | 'sharding' | 'geohash';

export default function NearbyFriendsDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<NearbyTab>('fanout');
  const [activeStep, setActiveStep] = useState<number>(1);
  const [selectedCell, setSelectedCell] = useState<string>('center');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid rgba(152, 162, 179, 0.25)', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
            Nearby Friends Engine: Real-Time Location Fan-Out &amp; Sharded Pub/Sub Architecture
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('fanout')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'fanout' ? '1px solid #0ea5e9' : '1px solid rgba(152, 162, 179, 0.4)',
              backgroundColor: activeTab === 'fanout' ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
              color: activeTab === 'fanout' ? '#0284c7' : 'var(--ifm-color-content)'
            }}
          >
            Location Fan-Out Flow
          </button>
          <button
            onClick={() => setActiveTab('sharding')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'sharding' ? '1px solid #10b981' : '1px solid rgba(152, 162, 179, 0.4)',
              backgroundColor: activeTab === 'sharding' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              color: activeTab === 'sharding' ? '#15803d' : 'var(--ifm-color-content)'
            }}
          >
            Pub/Sub Sharding Cluster
          </button>
          <button
            onClick={() => setActiveTab('geohash')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'geohash' ? '1px solid #f59e0b' : '1px solid rgba(152, 162, 179, 0.4)',
              backgroundColor: activeTab === 'geohash' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              color: activeTab === 'geohash' ? '#d97706' : 'var(--ifm-color-content)'
            }}
          >
            Geohash Boundary Expansion
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* TAB 1: LOCATION FAN-OUT FLOW */}
        {activeTab === 'fanout' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Step Simulation:</span>
              <button
                onClick={() => setActiveStep(1)}
                style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', border: '1px solid #0ea5e9', backgroundColor: activeStep === 1 ? 'rgba(14, 165, 233, 0.2)' : 'transparent', color: 'var(--ifm-color-content)' }}
              >
                1. Client Egress (WebSocket)
              </button>
              <button
                onClick={() => setActiveStep(2)}
                style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', border: '1px solid #10b981', backgroundColor: activeStep === 2 ? 'rgba(16, 185, 129, 0.2)' : 'transparent', color: 'var(--ifm-color-content)' }}
              >
                2. Redis Cache &amp; Pub/Sub
              </button>
              <button
                onClick={() => setActiveStep(3)}
                style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', border: '1px solid #a78bfa', backgroundColor: activeStep === 3 ? 'rgba(167, 139, 250, 0.2)' : 'transparent', color: 'var(--ifm-color-content)' }}
              >
                3. Subscribed Fan-Out to Peers
              </button>
            </div>

            {/* SVG Visualizer */}
            <div style={{ backgroundColor: 'var(--ifm-card-background-color, #f7fdf9)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(152, 162, 179, 0.3)', marginBottom: '14px' }}>
              <svg viewBox="0 0 860 210" width="100%" height="auto" style={{ overflow: 'visible' }}>
                <defs>
                  <marker id="arrow-nf-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#0284c7" />
                  </marker>
                  <marker id="arrow-nf-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#15803d" />
                  </marker>
                  <marker id="arrow-nf-purple" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#7c3aed" />
                  </marker>
                  <style>{`
                    @keyframes flowDashesNearby {
                      0% { stroke-dashoffset: 24; }
                      100% { stroke-dashoffset: 0; }
                    }
                    .flowing-conduit-nearby {
                      animation: flowDashesNearby 1.2s linear infinite;
                    }
                  `}</style>
                </defs>

                {/* Mobile Client A */}
                <g transform="translate(10, 60)">
                  <rect width="140" height="85" rx="8" fill="var(--ifm-background-color, #ffffff)" stroke="#0ea5e9" strokeWidth="2"/>
                  <text x="70" y="24" textAnchor="middle" fill="var(--ifm-color-content)" fontWeight="700" fontSize="12">User A (Mobile)</text>
                  <text x="70" y="42" textAnchor="middle" fill="#64748b" fontSize="10">GPS: 37.77, -122.41</text>
                  <rect x="10" y="52" width="120" height="24" rx="4" fill="rgba(14, 165, 233, 0.1)"/>
                  <text x="70" y="68" textAnchor="middle" fill="#0284c7" fontSize="9" fontWeight="600">Emits every 30s</text>
                </g>

                {/* Arrow to WS Server 1 */}
                <path d="M 152 102 L 208 102" fill="none" stroke="#0ea5e9" strokeWidth="2.5" markerEnd="url(#arrow-nf-blue)" />
                {activeStep >= 1 && (
                  <path d="M 152 102 L 208 102" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="4, 6" className="flowing-conduit-nearby" />
                )}

                {/* WS Server 1 */}
                <g transform="translate(210, 45)">
                  <rect width="160" height="110" rx="8" fill="var(--ifm-background-color, #ffffff)" stroke="#0ea5e9" strokeWidth="2"/>
                  <text x="80" y="24" textAnchor="middle" fill="var(--ifm-color-content)" fontWeight="700" fontSize="12">WebSocket Node #12</text>
                  <text x="80" y="42" textAnchor="middle" fill="#64748b" fontSize="10">Holds Persistent TCP</text>
                  <rect x="15" y="52" width="130" height="46" rx="4" fill="var(--ifm-background-color, #f2f4f7)" stroke="rgba(152, 162, 179, 0.3)"/>
                  <text x="25" y="68" fill="#334155" fontSize="9">1. Writes Location Cache</text>
                  <text x="25" y="86" fill="#334155" fontSize="9">2. Publishes to Channel A</text>
                </g>

                {/* Arrow to Redis Cluster */}
                <path d="M 372 102 L 428 102" fill="none" stroke="#10b981" strokeWidth="2.5" markerEnd="url(#arrow-nf-green)" />
                {activeStep >= 2 && (
                  <path d="M 372 102 L 428 102" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="4, 6" className="flowing-conduit-nearby" />
                )}

                {/* Redis Cluster */}
                <g transform="translate(430, 30)">
                  <rect width="190" height="140" rx="8" fill="var(--ifm-background-color, #ffffff)" stroke="#10b981" strokeWidth="2.5"/>
                  <text x="95" y="24" textAnchor="middle" fill="var(--ifm-color-content)" fontWeight="700" fontSize="12">Redis Sharded Cluster</text>
                  <rect x="15" y="34" width="160" height="42" rx="4" fill="rgba(16, 185, 129, 0.1)" stroke="#10b981" strokeWidth="1"/>
                  <text x="95" y="50" textAnchor="middle" fill="#15803d" fontWeight="600" fontSize="10">Location Cache (TTL 10m)</text>
                  <text x="95" y="66" textAnchor="middle" fill="#334155" fontSize="9">key: user:A -&gt; (lat, lon, ts)</text>

                  <rect x="15" y="84" width="160" height="40" rx="4" fill="rgba(245, 158, 11, 0.1)" stroke="#f59e0b" strokeWidth="1"/>
                  <text x="95" y="99" textAnchor="middle" fill="#92400e" fontWeight="600" fontSize="10">Redis Pub/Sub Channel</text>
                  <text x="95" y="115" textAnchor="middle" fill="#78350f" fontSize="9">PUBLISH channel_A payload</text>
                </g>

                {/* Arrow to WS Server 2 */}
                <path d="M 622 102 L 678 102" fill="none" stroke="#a78bfa" strokeWidth="2.5" markerEnd="url(#arrow-nf-purple)" />
                {activeStep >= 3 && (
                  <path d="M 622 102 L 678 102" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="4, 6" className="flowing-conduit-nearby" />
                )}

                {/* WS Server 2 (Subscribed to Channel A for Friend B) */}
                <g transform="translate(680, 45)">
                  <rect width="160" height="110" rx="8" fill="var(--ifm-background-color, #ffffff)" stroke="#8b5cf6" strokeWidth="2"/>
                  <text x="80" y="24" textAnchor="middle" fill="var(--ifm-color-content)" fontWeight="700" fontSize="12">WebSocket Node #85</text>
                  <text x="80" y="42" textAnchor="middle" fill="#6b21a8" fontSize="10">Subscribed to Channel A</text>
                  <rect x="15" y="52" width="130" height="46" rx="4" fill="var(--ifm-background-color, #f2f4f7)" stroke="rgba(152, 162, 179, 0.3)"/>
                  <text x="25" y="68" fill="#334155" fontSize="9">Calculates Distance</text>
                  <text x="25" y="86" fill="#15803d" fontWeight="600" fontSize="9">Pushes to Friend B (&lt;5mi)</text>
                </g>
              </svg>
            </div>

            {/* Calculations & Architecture Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '12px' }}>
              <div style={{ backgroundColor: 'var(--ifm-card-background-color, #f7fdf9)', border: '1px solid rgba(152, 162, 179, 0.3)', borderRadius: '8px', padding: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0284c7' }}>Ingestion Math (Alex Xu Scale)</span>
                <ul style={{ margin: '6px 0 0 0', paddingLeft: '16px', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                  <li><strong>Concurrent Active Users:</strong> 10 Million users.</li>
                  <li><strong>Emission Frequency:</strong> Once every 30 seconds.</li>
                  <li><strong>Ingestion QPS:</strong> 10M / 30s = <strong>334,000 updates/sec</strong>.</li>
                  <li><strong>Fan-Out QPS:</strong> Assuming 400 friends per user (10% online = 40 peers): 334k &times; 40 &approx; <strong>13.36 Million forwards/sec</strong>!</li>
                </ul>
              </div>

              <div style={{ backgroundColor: 'var(--ifm-background-color, #f2f4f7)', border: '1px solid rgba(152, 162, 179, 0.3)', borderRadius: '8px', padding: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#15803d' }}>Why Shared Backend Beats P2P</span>
                <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.45 }}>
                  A pure P2P mesh would require every mobile client to maintain 40 concurrent bidirectional WebRTC sockets, rapidly exhausting mobile battery and failing behind mobile cellular Carrier-Grade NAT (CGNAT). The centralized fan-out architecture maintains exactly <strong>one persistent WebSocket connection</strong> per mobile device.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SHARDING & CONSISTENT HASHING */}
        {activeTab === 'sharding' && (
          <div>
            <div style={{ backgroundColor: 'var(--ifm-card-background-color, #f7fdf9)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(152, 162, 179, 0.3)', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#15803d', marginBottom: '8px' }}>
                Pub/Sub Channel Sizing: 140 Redis Nodes Managed by ZooKeeper
              </div>
              <p style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.5, margin: '0 0 10px 0' }}>
                A single Redis node can comfortably handle ~100,000 Pub/Sub pushes per second. Because the system must distribute <strong>14 Million pushes/sec</strong>, Redis Pub/Sub channels must be sharded across a cluster of at least <strong>140 Redis instances</strong>.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div style={{ padding: '10px', backgroundColor: 'var(--ifm-background-color, #f2f4f7)', borderRadius: '6px', border: '1px solid rgba(152, 162, 179, 0.2)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7' }}>1. Zero-Cost Idle Channels</div>
                  <p style={{ fontSize: '10px', color: 'var(--ifm-color-content)', margin: '4px 0 0 0' }}>
                    Redis Pub/Sub channels consume zero memory until active subscribers exist. We pre-allocate channels for all 100M registered users without memory bloat.
                  </p>
                </div>

                <div style={{ padding: '10px', backgroundColor: 'var(--ifm-background-color, #f2f4f7)', borderRadius: '6px', border: '1px solid rgba(152, 162, 179, 0.2)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#15803d' }}>2. ZooKeeper Hash Ring</div>
                  <p style={{ fontSize: '10px', color: 'var(--ifm-color-content)', margin: '4px 0 0 0' }}>
                    ZooKeeper stores the cluster topology and virtual node hash ring. WebSocket servers cache the ring locally to route <code>channel:user_A</code> directly to the target Redis node.
                  </p>
                </div>

                <div style={{ padding: '10px', backgroundColor: 'var(--ifm-background-color, #f2f4f7)', borderRadius: '6px', border: '1px solid rgba(152, 162, 179, 0.2)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#b91c1c' }}>3. Resubscription Storms</div>
                  <p style={{ fontSize: '10px', color: 'var(--ifm-color-content)', margin: '4px 0 0 0' }}>
                    When a Redis node dies or rescales, thousands of WebSocket servers must resubscribe simultaneously. Consistent hashing limits ring rebalancing to $K/N$ channels.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GEOHASH BOUNDARY EXPANSION */}
        {activeTab === 'geohash' && (
          <div>
            <div style={{ backgroundColor: 'var(--ifm-card-background-color, #f7fdf9)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(152, 162, 179, 0.3)', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b', marginBottom: '8px' }}>
                Geohash Boundary Edge Case: The 8-Neighbor Subscription Pattern
              </div>
              <p style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.5, margin: '0 0 10px 0' }}>
                When supporting features like <em>"Nearby Random Person"</em> or Geohash-partitioned channels, users standing 10 meters apart across a Geohash boundary (e.g. <code>u4pruq</code> vs <code>u4pruw</code>) would fail to see each other. The system must query the current cell plus all <strong>8 neighboring cells</strong>:
              </p>

              {/* 3x3 Grid Visualizer */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 90px)', gap: '6px', justifyContent: 'center', margin: '14px 0' }}>
                {['NW', 'N', 'NE', 'W', 'center', 'E', 'SW', 'S', 'SE'].map(pos => (
                  <div
                    key={pos}
                    onClick={() => setSelectedCell(pos)}
                    style={{
                      height: '60px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      border: pos === 'center' ? '2px solid #0ea5e9' : '1px solid rgba(152, 162, 179, 0.4)',
                      backgroundColor: pos === 'center' ? 'rgba(14, 165, 233, 0.2)' : (selectedCell === pos ? 'rgba(245, 158, 11, 0.2)' : 'var(--ifm-background-color, #ffffff)'),
                      color: 'var(--ifm-color-content)',
                      fontSize: '11px',
                      fontWeight: 600
                    }}
                  >
                    <span>{pos === 'center' ? 'Current Cell' : `Neighbor ${pos}`}</span>
                    <span style={{ fontSize: '9px', color: '#64748b' }}>Precision 5-6</span>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'center', fontSize: '11px', color: '#64748b' }}>
                Subscribing to 9 Geohash channels ensures zero dropped matches regardless of proximity to border lines.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
