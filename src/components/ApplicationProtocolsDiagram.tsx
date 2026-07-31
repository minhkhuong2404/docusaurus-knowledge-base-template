import React, { useState } from 'react';

export default function ApplicationProtocolsDiagram(): React.JSX.Element {
  const [proto, setProto] = useState<'ssh' | 'websocket' | 'grpc' | 'mqtt'>('grpc');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6"/>
          <polyline points="8 6 2 12 8 18"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Application Protocols Reference Matrix (SSH, WebSocket, gRPC, MQTT)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
          {(['ssh', 'websocket', 'grpc', 'mqtt'] as const).map(p => (
            <button
              key={p}
              onClick={() => setProto(p)}
              style={{
                flex: 1,
                padding: '6px 4px',
                borderRadius: '4px',
                border: proto === p ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                backgroundColor: proto === p ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17',
                color: '#fff',
                fontSize: '11px',
                fontWeight: proto === p ? 700 : 400,
                cursor: 'pointer',
              }}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {proto === 'ssh' && <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ifm-color-content)' }}>Port 22 (TCP). Encrypted remote terminal shell access &amp; SFTP file transfer via Diffie-Hellman key exchange.</p>}
          {proto === 'websocket' && <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ifm-color-content)' }}>Port 80/443 (TCP). Full-duplex persistent bidirectional connection initiated via HTTP 101 Switching Protocols header.</p>}
          {proto === 'grpc' && <p style={{ margin: 0, fontSize: '12.5px', color: '#38bdf8' }}>HTTP/2 (TCP). Binary Protocol Buffers serialization with client/server streaming, multiplexing, and header compression.</p>}
          {proto === 'mqtt' && <p style={{ margin: 0, fontSize: '12.5px', color: '#34d399' }}>Port 1883 (TCP). Lightweight Publish/Subscribe message queue protocol designed for low-power IoT sensor devices.</p>}
        </div>
      </div>
    </div>
  );
}
