import React, { useState } from 'react';

type ConnectionType = '1rtt' | '0rtt';

export default function QuicHandshakeDiagram(): React.JSX.Element {
  const [type, setType] = useState<ConnectionType>('1rtt');

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🤝 QUIC Connection & Resumption Setup (1-RTT vs. 0-RTT)
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setType('1rtt')} style={{ background: type === '1rtt' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${type === '1rtt' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: type === '1rtt' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>1-RTT Handshake</button>
          <button onClick={() => setType('0rtt')} style={{ background: type === '0rtt' ? 'rgba(251,146,60,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${type === '0rtt' ? '#fb923c' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: type === '0rtt' ? '#fb923c' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>0-RTT Resumption</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.2rem', padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        {/* Info card */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {type === '1rtt' ? (
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#38bdf8' }}>First connection: 1 RTT</h4>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.45 }}>
                Combines connection and cryptographic handshake into a single round trip. The client sends a ClientHello with transport parameters in the Initial packet. The server derives keys and responds, allowing application data to flow.
              </p>
            </div>
          ) : (
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#fb923c' }}>Session Resumption: 0-RTT</h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.45 }}>
                Uses a ticket from a previous session. The client encrypts and fires application payloads (GET request) alongside the Initial packet, resulting in 0 RTT before transmission begins.
              </p>
              <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', padding: '6px 8px', borderRadius: 4, fontSize: '0.68rem', color: '#f87171' }}>
                ⚠️ <strong>Replay Risk:</strong> Attackers can capture and replay 0-RTT packets. Restrict usage to idempotent requests (e.g. GET).
              </div>
            </div>
          )}
        </div>

        {/* Timeline visual */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#cbd5e1' }}>Packet Sequence Map</h4>
          <pre style={{ margin: 0, padding: '8px 12px', background: '#090b14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.68rem', color: '#38bdf8', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            {type === '1rtt' ? (
`Client ──► Server
  Initial (CRYPTO: ClientHello)

Client ◄── Server
  Initial (CRYPTO: ServerHello)
  Handshake (TLS Keys Derived)

Client ──► Server
  Short Header (Encrypted App Data)`
            ) : (
`Client ──► Server
  Initial (ClientHello + 0-RTT Data) 🚀

Client ◄── Server
  Short Header (Encrypted Response)`
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
