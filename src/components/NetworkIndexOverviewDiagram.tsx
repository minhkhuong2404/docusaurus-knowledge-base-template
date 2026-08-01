import React, { useState } from 'react';

const LAYERS = [
  {
    num: 5, name: 'Application Layer', pdu: 'Data / Message', color: '#38bdf8',
    protocols: ['HTTP/1.1', 'HTTP/2', 'HTTP/3', 'HTTPS', 'DNS', 'gRPC', 'WebSocket', 'SSH', 'SMTP', 'FTP'],
    detail: {
      title: 'Application Layer (L5 — TCP/IP Model)',
      body: 'Provides services directly to end-user apps and APIs. Handles data formatting, session semantics, and application-specific protocols. In TCP/IP this merges OSI layers 5–7. Java: HttpClient, WebClient, gRPC stubs, OkHttp.',
      tags: ['HTTP/HTTPS', 'DNS', 'gRPC (HTTP/2)', 'WebSocket', 'SMTP', 'SSH'],
    },
  },
  {
    num: 4, name: 'Transport Layer', pdu: 'Segment / Datagram', color: '#34d399',
    protocols: ['TCP', 'UDP', 'QUIC', 'TLS (on TCP)', 'DTLS'],
    detail: {
      title: 'Transport Layer (L4)',
      body: 'End-to-end communication between processes identified by port numbers. TCP: reliable, ordered, flow-controlled. UDP: unreliable, connectionless, low-latency. QUIC: UDP-based with built-in TLS 1.3, stream multiplexing, and connection migration.',
      tags: ['TCP SYN/ACK 3-way handshake', 'Port 0–65535', 'Flow control (sliding window)', 'QUIC (HTTP/3)'],
    },
  },
  {
    num: 3, name: 'Network Layer', pdu: 'Packet', color: '#a78bfa',
    protocols: ['IPv4', 'IPv6', 'ICMP', 'BGP', 'OSPF', 'IGMP'],
    detail: {
      title: 'Network Layer (L3)',
      body: 'Logical addressing (IP) and routing packets across heterogeneous networks. Routers operate here. BGP is the internet\'s inter-domain routing protocol. ICMP is used by ping and traceroute for diagnostic messages.',
      tags: ['IP 32-bit address (IPv4)', 'Subnet mask / CIDR /24', 'TTL hop decrement', 'BGP AS path routing'],
    },
  },
  {
    num: 2, name: 'Data Link Layer', pdu: 'Frame', color: '#fbbf24',
    protocols: ['Ethernet (802.3)', 'Wi-Fi (802.11)', 'ARP', 'VLANs (802.1Q)', 'PPP'],
    detail: {
      title: 'Data Link Layer (L2)',
      body: 'Point-to-point framing between directly connected nodes using MAC addresses. Ethernet frames include source/destination MAC, EtherType, payload, and FCS (CRC). ARP resolves IP addresses to MAC addresses on a local segment.',
      tags: ['MAC address 48-bit', 'ARP: IP → MAC', 'CRC32 FCS', 'MTU 1500 bytes'],
    },
  },
  {
    num: 1, name: 'Physical Layer', pdu: 'Bits / Signal', color: '#f97316',
    protocols: ['Ethernet copper (Cat5e/6)', 'Fiber (SMF/MMF)', 'Wi-Fi (2.4/5GHz)', 'USB', 'RS-232'],
    detail: {
      title: 'Physical Layer (L1)',
      body: 'Raw bit transmission over physical media. Concerns: signal encoding (NRZ, Manchester), cable impedance, optical wavelengths, wireless radio frequencies. Repeaters and hubs operate here — no addressing or framing.',
      tags: ['Cat6: 10 Gbps / 55m', 'Single-mode fiber: 100km+', 'Wi-Fi 6 (802.11ax)', 'Bit rate vs baud rate'],
    },
  },
];

export default function NetworkIndexOverviewDiagram(): React.JSX.Element {
  const [active, setActive] = useState<number | null>(null);
  const activeLayer = LAYERS.find(l => l.num === active) ?? null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .net-overview-grid { grid-template-columns: 1fr !important; } }`}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>TCP/IP 5-Layer Protocol Stack Explorer</span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Click any layer to inspect</span>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="net-overview-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
          {/* Layer stack */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {LAYERS.map(layer => {
              const isActive = active === layer.num;
              return (
                <div key={layer.num} onClick={() => setActive(active === layer.num ? null : layer.num)}
                  style={{ display: 'flex', alignItems: 'stretch', gap: 0, borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', border: `1.5px solid ${isActive ? layer.color : layer.color + '40'}`, transition: 'all 0.22s ease', transform: isActive ? 'scale(1.01)' : 'scale(1)' }}>
                  {/* Layer badge */}
                  <div style={{ minWidth: '44px', background: isActive ? `${layer.color}30` : `${layer.color}12`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 6px', borderRight: `1px solid ${layer.color}25` }}>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: layer.color }}>L{layer.num}</span>
                  </div>
                  {/* Layer content */}
                  <div style={{ flex: 1, padding: '10px 12px', background: isActive ? `${layer.color}08` : 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: layer.color }}>{layer.name}</span>
                      <span style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', background: `${layer.color}15`, borderRadius: '4px', padding: '1px 6px' }}>PDU: {layer.pdu}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {layer.protocols.map(p => (
                        <span key={p} style={{ fontSize: '10px', color: layer.color, background: `${layer.color}12`, border: `1px solid ${layer.color}25`, borderRadius: '4px', padding: '1px 6px' }}>{p}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Encapsulation arrows */}
            <div style={{ textAlign: 'center', fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>
              ↓ Encapsulation (send) &nbsp;|&nbsp; ↑ Decapsulation (receive)
            </div>
          </div>

          {/* Detail panel */}
          <div className={`interactive-diagram-details-card ${activeLayer ? 'details-cyan' : 'details-gray'}`}
            style={{ minHeight: '220px', display: 'flex', flexDirection: 'column', justifyContent: activeLayer ? 'flex-start' : 'center', transition: 'all 0.25s ease' }}>
            {activeLayer ? (
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: activeLayer.color, marginBottom: '10px' }}>{activeLayer.detail.title}</div>
                <p style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 12px', lineHeight: 1.6 }}>{activeLayer.detail.body}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {activeLayer.detail.tags.map(t => (
                    <code key={t} style={{ fontSize: '10.5px', background: `${activeLayer.color}18`, color: activeLayer.color, border: `1px solid ${activeLayer.color}40`, borderRadius: '5px', padding: '2px 7px' }}>{t}</code>
                  ))}
                </div>
              </div>
            ) : (
              <div className="interactive-diagram-helper-text" style={{ textAlign: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px', opacity: 0.4 }}>
                  <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
                </svg>
                <div>Click any layer to inspect its protocols and PDUs</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
