import React, { useState } from 'react';

export default function NetworkIndexOverviewDiagram(): React.JSX.Element {
  const [activeLayer, setActiveLayer] = useState<number>(5);

  const layers = [
    { num: 5, name: 'Application Layer', pdu: 'Data / Payload', protocols: 'HTTP, HTTPS, DNS, gRPC, SSH, SMTP', desc: 'Provides network services directly to end-user applications and APIs.' },
    { num: 4, name: 'Transport Layer', pdu: 'Segment / Datagram', protocols: 'TCP, UDP, QUIC', desc: 'End-to-end communication, port addressing, flow control, and reliability.' },
    { num: 3, name: 'Network Layer', pdu: 'Packet', protocols: 'IPv4, IPv6, ICMP, BGP, OSPF', desc: 'Logical addressing (IP) and routing across disparate networks.' },
    { num: 2, name: 'Data Link Layer', pdu: 'Frame', protocols: 'Ethernet, Wi-Fi (802.11), ARP', desc: 'Physical MAC addressing, framing, and point-to-point local transfer.' },
    { num: 1, name: 'Physical Layer', pdu: 'Bits', protocols: 'Fiber Optics, Copper Wire, Radio Waves', desc: 'Raw bitstream transmission over physical media.' },
  ];

  const current = layers.find(l => l.num === activeLayer) || layers[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2"/>
          <rect x="2" y="14" width="20" height="8" rx="2"/>
          <line x1="6" y1="6" x2="6" y2="6.01"/>
          <line x1="6" y1="18" x2="6" y2="18.01"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Internet 5-Layer Protocol Stack & PDU Explorer
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
          {layers.map(l => (
            <button
              key={l.num}
              onClick={() => setActiveLayer(l.num)}
              style={{
                display: 'flex',
                justify: 'space-between',
                padding: '10px 14px',
                borderRadius: '6px',
                border: activeLayer === l.num ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                backgroundColor: activeLayer === l.num ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17',
                color: '#fff',
                fontWeight: activeLayer === l.num ? 700 : 400,
                fontSize: '12.5px',
                cursor: 'pointer',
              }}
            >
              <span>Layer {l.num}: {l.name}</span>
              <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>PDU: {l.pdu}</span>
            </button>
          ))}
        </div>

        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
            Layer {current.num} — {current.name} (Protocols: {current.protocols})
          </div>
          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ifm-color-content)' }}>
            {current.desc}
          </p>
        </div>
      </div>
    </div>
  );
}
