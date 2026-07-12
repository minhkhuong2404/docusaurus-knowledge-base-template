import React, { useState } from 'react';

type NetState = 'wifi' | 'cellular';

export default function QuicConnectionMigrationDiagram(): React.JSX.Element {
  const [network, setNetwork] = useState<NetState>('wifi');

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          📱 Client Network Connection Migration (WiFi ↔ 4G/Cellular)
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setNetwork('wifi')} style={{ background: network === 'wifi' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${network === 'wifi' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: network === 'wifi' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Mobile on WiFi</button>
          <button onClick={() => setNetwork('cellular')} style={{ background: network === 'cellular' ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${network === 'cellular' ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: network === 'cellular' ? '#a78bfa' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Mobile on 4G/Cellular</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        {/* Detail Panel */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: network === 'wifi' ? '#38bdf8' : '#a78bfa' }}>
              Network Mode: {network === 'wifi' ? 'WiFi Connection' : 'Cellular 4G Link'}
            </h4>
            <p style={{ margin: 0, fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.45 }}>
              {network === 'wifi' ? (
                'Client is connected to a local access point. Packets traverse using the local private subnet routing IP: 192.168.1.10.'
              ) : (
                'Client roams outside range. Interface switches to Cellular card with public dynamic cellular IP: 10.55.99.112. Because the Connection ID stays identical, the server processes incoming frames seamlessly without requiring TLS handshake negotiations.'
              )}
            </p>
          </div>
        </div>

        {/* Client parameter log */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#38bdf8' }}>Connection Context</h4>
          <pre style={{ margin: 0, padding: '8px 12px', background: '#090b14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.72rem', color: '#38bdf8', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            {network === 'wifi' ? (
`Source IP: 192.168.1.10
Source Port: 54321
Dest IP: 203.0.113.1 (Server)
Connection ID: 0x9a8b7c6d5e4f (Active) ✅`
            ) : (
`Source IP: 10.55.99.112 (IP Changed!)
Source Port: 60233
Dest IP: 203.0.113.1 (Server)
Connection ID: 0x9a8b7c6d5e4f (Persisted!) 🚀`
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
