import React, { useState } from 'react';

type DestinationIP = 'local-app' | 'corporate-db' | 'public-dns';

export default function RoutingTableDiagram(): React.JSX.Element {
  const [targetIp, setTargetIp] = useState<DestinationIP>('local-app');

  const targetMapping = {
    'local-app': { ip: '192.168.1.50', name: 'Local App Instance' },
    'corporate-db': { ip: '10.5.10.1', name: 'Corporate DB Cluster' },
    'public-dns': { ip: '8.8.8.8', name: 'Google Public DNS' }
  };

  const routes = [
    { dest: '127.0.0.0/8', gw: '127.0.0.1', iface: 'lo', desc: 'Loopback local interface route.' },
    { dest: '192.168.1.0/24', gw: '0.0.0.0', iface: 'eth0', desc: 'Directly connected subnet route.' },
    { dest: '10.0.0.0/8', gw: '192.168.1.254', iface: 'eth0', desc: 'Static route for private corporate servers.' },
    { dest: '0.0.0.0/0', gw: '192.168.1.1', iface: 'eth0', desc: 'Default gateway route for all public internet traffic.' }
  ];

  // Helper logic to find which route matches best
  const getMatchIndex = () => {
    if (targetIp === 'local-app') return 1; // 192.168.1.0/24 matches 192.168.1.50
    if (targetIp === 'corporate-db') return 2; // 10.0.0.0/8 matches 10.5.10.1
    return 3; // 0.0.0.0/0 matches 8.8.8.8
  };

  const matchIdx = getMatchIndex();

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🗺️ Longest Prefix Match Routing Table Simulator
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setTargetIp('local-app')} style={{ background: targetIp === 'local-app' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${targetIp === 'local-app' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: targetIp === 'local-app' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>192.168.1.50</button>
          <button onClick={() => setTargetIp('corporate-db')} style={{ background: targetIp === 'corporate-db' ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${targetIp === 'corporate-db' ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: targetIp === 'corporate-db' ? '#a78bfa' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>10.5.10.1</button>
          <button onClick={() => setTargetIp('public-dns')} style={{ background: targetIp === 'public-dns' ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${targetIp === 'public-dns' ? '#4ade80' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: targetIp === 'public-dns' ? '#4ade80' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>8.8.8.8</button>
        </div>
      </div>

      <div style={{ padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#cbd5e1' }}>
          Routing target: <strong>{targetMapping[targetIp].ip}</strong> ({targetMapping[targetIp].name})
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 2fr', gap: 4, paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>
            <span>Destination IP Mask</span>
            <span>Gateway IP</span>
            <span>Iface</span>
            <span>Route Logic</span>
          </div>

          {routes.map((route, idx) => {
            const isWinner = idx === matchIdx;
            return (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr 1fr 2fr',
                  gap: 4,
                  padding: '8px 6px',
                  background: isWinner ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.01)',
                  border: `1px solid ${isWinner ? '#4ade80' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: 4,
                  fontSize: '0.72rem',
                  fontFamily: 'monospace',
                  color: isWinner ? '#4ade80' : '#cbd5e1',
                  transition: 'all 0.2s'
                }}
              >
                <span>{route.dest}</span>
                <span>{route.gw}</span>
                <span>{route.iface}</span>
                <span style={{ fontSize: '0.64rem', fontFamily: 'Inter', color: isWinner ? '#4ade80' : '#94a3b8' }}>
                  {isWinner ? '🎯 Longest Prefix Match (WINNER)' : route.desc}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
