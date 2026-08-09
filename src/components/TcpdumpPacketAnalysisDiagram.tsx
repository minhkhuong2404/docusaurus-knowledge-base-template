import React, { useState } from 'react';

export default function TcpdumpPacketAnalysisDiagram(): React.JSX.Element {
  const [flag, setFlag] = useState<'SYN' | 'SYN-ACK' | 'ACK' | 'FIN' | 'RST'>('SYN');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Wireshark / `tcpdump` Control Flags &amp; Packet Header Inspector
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
          {(['SYN', 'SYN-ACK', 'ACK', 'FIN', 'RST'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFlag(f)}
              style={{
                flex: 1,
                padding: '6px 4px',
                borderRadius: '4px',
                border: flag === f ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)',
                backgroundColor: flag === f ? 'rgba(251, 191, 36, 0.15)' : '#0c0e17',
                color: '#fff',
                fontSize: '11px',
                fontWeight: flag === f ? 700 : 400,
                cursor: 'pointer',
              }}
            >
              [{f}] Flag
            </button>
          ))}
        </div>

        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {flag === 'SYN' && <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content)' }}><code>Flags [S]</code>: Initiates TCP connection. Contains Client ISN (Initial Sequence Number) and MSS option.</p>}
          {flag === 'SYN-ACK' && <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content)' }}><code>Flags [S.]</code>: Server acknowledges client SYN and advertises server ISN.</p>}
          {flag === 'ACK' && <p style={{ margin: 0, fontSize: '12.5px', color: '#34d399' }}><code>Flags [.]</code>: Acknowledges received data segment or completes 3-way handshake.</p>}
          {flag === 'FIN' && <p style={{ margin: 0, fontSize: '12.5px', color: '#fbbf24' }}><code>Flags [F.]</code>: Graceful connection termination request from one peer.</p>}
          {flag === 'RST' && <p style={{ margin: 0, fontSize: '12.5px', color: '#f87171' }}><code>Flags [R]</code>: Abrupt TCP connection reset! Sent when port is closed or connection state is invalid.</p>}
        </div>
      </div>
    </div>
  );
}
