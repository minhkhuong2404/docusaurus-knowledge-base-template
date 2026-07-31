import React, { useState } from 'react';

export default function NetworkSecurityProtocolsDiagram(): React.JSX.Element {
  const [sec, setSec] = useState<'tls' | 'ipsec' | 'wireguard'>('tls');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Network Encryption &amp; VPN Protocols (TLS 1.3 vs IPsec vs WireGuard)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setSec('tls')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: sec === 'tls' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', backgroundColor: sec === 'tls' ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            TLS 1.3 (1-RTT / 0-RTT Handshake)
          </button>
          <button onClick={() => setSec('ipsec')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: sec === 'ipsec' ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)', backgroundColor: sec === 'ipsec' ? 'rgba(251, 191, 36, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            IPsec (AH / ESP Tunnel)
          </button>
          <button onClick={() => setSec('wireguard')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: sec === 'wireguard' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)', backgroundColor: sec === 'wireguard' ? 'rgba(52, 211, 153, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            WireGuard VPN (Noise Protocol)
          </button>
        </div>

        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {sec === 'tls' && <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content)' }}>Application layer encryption. Uses ECDHE key exchange to negotiate symmetric AES-GCM/ChaCha20 keys in just 1 RTT with perfect forward secrecy.</p>}
          {sec === 'ipsec' && <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content)' }}>Network Layer (Layer 3) VPN protocol. Encapsulates full IP packets with ESP headers for site-to-site corporate tunnels.</p>}
          {sec === 'wireguard' && <p style={{ margin: 0, fontSize: '12px', color: '#34d399' }}>Modern, ultra-fast UDP-based VPN (~4,000 lines of code vs IPsec's 400,000 lines). Uses Noise protocol framework and Curve25519 key exchange.</p>}
        </div>
      </div>
    </div>
  );
}
