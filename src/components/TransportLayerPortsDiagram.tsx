import React, { useState } from 'react';

type Application = 'chrome' | 'postgres' | 'redis';

export default function TransportLayerPortsDiagram(): React.JSX.Element {
  const [activeApp, setActiveApp] = useState<Application>('chrome');

  const appData = {
    chrome: {
      name: 'Chrome Web Browser',
      srcPort: '54321 (Dynamic/Ephemeral)',
      destPort: '443 (Well-known HTTPS)',
      server: 'Nginx Web Server',
      desc: 'Outgoing web requests dynamically lease a high-range port (>49152) from the OS, connecting to a standard HTTPS port (443) on the server.'
    },
    postgres: {
      name: 'PostgreSQL Database Client',
      srcPort: '61022 (Dynamic/Ephemeral)',
      destPort: '5432 (Registered PG)',
      server: 'PostgreSQL Cluster Server',
      desc: 'Database connections target the standard registered port 5432, maintaining a persistent stateful TCP channel for query executions.'
    },
    redis: {
      name: 'Redis Cache client',
      srcPort: '63110 (Dynamic/Ephemeral)',
      destPort: '6379 (Registered Redis)',
      server: 'Redis Cache Instance',
      desc: 'Fast memory caches use persistent TCP socket connections targeting port 6379 to execute key-value lookups.'
    }
  };

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🔌 Process-to-Process Port Mapping
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setActiveApp('chrome')} style={{ background: activeApp === 'chrome' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeApp === 'chrome' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeApp === 'chrome' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Web (Chrome)</button>
          <button onClick={() => setActiveApp('postgres')} style={{ background: activeApp === 'postgres' ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeApp === 'postgres' ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeApp === 'postgres' ? '#a78bfa' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Database (Postgres)</button>
          <button onClick={() => setActiveApp('redis')} style={{ background: activeApp === 'redis' ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeApp === 'redis' ? '#4ade80' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeApp === 'redis' ? '#4ade80' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Cache (Redis)</button>
        </div>
      </div>

      <div style={{ padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Mapping flow */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#cbd5e1' }}>Port Resolution</h4>
            <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginBottom: '6px' }}>
              👤 Client App: <strong>{appData[activeApp].name}</strong>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginBottom: '6px', fontFamily: 'monospace' }}>
              Source Port: <span style={{ color: '#38bdf8' }}>{appData[activeApp].srcPort}</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginBottom: '6px', fontFamily: 'monospace' }}>
              Destination Port: <span style={{ color: '#a78bfa' }}>{appData[activeApp].destPort}</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
              🖥️ Target Server: <strong>{appData[activeApp].server}</strong>
            </div>
          </div>

          {/* Explanation */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#e2e8f0' }}>Description</h4>
            <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.45 }}>
              {appData[activeApp].desc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
