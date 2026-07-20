import React, { useState } from 'react';

export default function Http3QuicDiagram() {
  const [packetLoss, setPacketLoss] = useState<boolean>(false);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
        <span>HTTP/3 QUIC Packet-Loss Isolation Simulator</span>

        {/* Toggle */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setPacketLoss(false)} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: !packetLoss ? '#34d39918' : 'rgba(255,255,255,0.04)',
            color: !packetLoss ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: !packetLoss ? '0 0 0 1.5px #34d39950' : '0 0 0 1px rgba(255,255,255,0.08)'
          }}>
            Normal Flow (No Packet Loss) 🟢
          </button>
          <button onClick={() => setPacketLoss(true)} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: packetLoss ? '#f8717118' : 'rgba(255,255,255,0.04)',
            color: packetLoss ? '#f87171' : 'var(--ifm-color-content-secondary)',
            boxShadow: packetLoss ? '0 0 0 1.5px #f8717150' : '0 0 0 1px rgba(255,255,255,0.08)'
          }}>
            Simulate Packet Loss on Stream 2 🚨
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px' }} className="h3-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .h3-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* HTTP/2 TCP */}
        <div className="interactive-diagram-details-card" style={{ borderColor: packetLoss ? '#f8717140' : '#fbbf2440' }}>
          <h4 style={{ color: packetLoss ? '#f87171' : '#fbbf24', margin: '0 0 6px 0', fontSize: '13px' }}>
            HTTP/2 over TCP
          </h4>
          <p style={{ fontSize: '11.5px', color: '#e2e8f0', margin: 0 }}>
            {packetLoss
              ? '🚨 TCP Transport HOL Blocking: Packet 2 dropped! TCP forces Stream 1 and Stream 3 to freeze until Packet 2 is retransmitted.'
              : 'Shares a single TCP stream. Fast when network is perfect.'
            }
          </p>
        </div>

        {/* HTTP/3 QUIC */}
        <div className="interactive-diagram-details-card" style={{ borderColor: '#34d39940' }}>
          <h4 style={{ color: '#34d399', margin: '0 0 6px 0', fontSize: '13px' }}>
            HTTP/3 over QUIC (UDP)
          </h4>
          <p style={{ fontSize: '11.5px', color: '#e2e8f0', margin: 0 }}>
            {packetLoss
              ? '🟢 Independent Streams: Stream 2 packet dropped, but Stream 1 and Stream 3 continue processing with 0ms delay!'
              : 'Per-stream reliability over UDP. Instant 0-RTT reconnection on Wi-Fi to 5G network switches.'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
