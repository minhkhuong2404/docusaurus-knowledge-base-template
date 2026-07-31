import React, { useState } from 'react';

export default function NetworkingInterviewScenariosDiagram(): React.JSX.Element {
  const [topic, setTopic] = useState<'url' | 'synflood' | 'mtu' | 'timewait'>('url');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Senior Networking Interview Problem &amp; Architecture Scenarios Matrix
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '16px' }}>
          <button onClick={() => setTopic('url')} style={{ padding: '8px 4px', borderRadius: '6px', border: topic === 'url' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', backgroundColor: topic === 'url' ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>
            "URL in Browser"
          </button>
          <button onClick={() => setTopic('synflood')} style={{ padding: '8px 4px', borderRadius: '6px', border: topic === 'synflood' ? '1px solid #f87171' : '1px solid rgba(255,255,255,0.1)', backgroundColor: topic === 'synflood' ? 'rgba(248, 113, 113, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>
            SYN Flood Defense
          </button>
          <button onClick={() => setTopic('mtu')} style={{ padding: '8px 4px', borderRadius: '6px', border: topic === 'mtu' ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)', backgroundColor: topic === 'mtu' ? 'rgba(251, 191, 36, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>
            Path MTU Discovery
          </button>
          <button onClick={() => setTopic('timewait')} style={{ padding: '8px 4px', borderRadius: '6px', border: topic === 'timewait' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)', backgroundColor: topic === 'timewait' ? 'rgba(52, 211, 153, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>
            TIME_WAIT Leaks
          </button>
        </div>

        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {topic === 'url' && <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content)' }}>DNS Resolution ➔ TCP 3-Way Handshake ➔ TLS 1.3 Key Exchange ➔ HTTP/2 GET Request ➔ NGINX Reverse Proxy ➔ Backend Response ➔ DOM Rendering.</p>}
          {topic === 'synflood' && <p style={{ margin: 0, fontSize: '12px', color: '#f87171' }}>Attacker floods SYN packets with spoofed IPs. Solution: Enable Linux SYN Cookies (`net.ipv4.tcp_syncookies = 1`) to encode connection state in ISN sequence without allocating kernel queue RAM.</p>}
          {topic === 'mtu' && <p style={{ margin: 0, fontSize: '12px', color: '#fbbf24' }}>Path MTU Discovery uses DF (Don't Fragment) bit + ICMP Type 3 Code 4 ("Fragmentation Needed"). Prevents silent packet drops on jumbo frame routers.</p>}
          {topic === 'timewait' && <p style={{ margin: 0, fontSize: '12px', color: '#34d399' }}>Active close socket waits 2 * MSL (60s) to catch delayed in-flight packets. Solution: Enable HTTP Keep-Alive connection pooling to reuse sockets.</p>}
        </div>
      </div>
    </div>
  );
}
