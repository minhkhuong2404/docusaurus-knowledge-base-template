import React, { useState } from 'react';

export default function NetworkTroubleshootingToolsDiagram(): React.JSX.Element {
  const [tool, setTool] = useState<'ping' | 'traceroute' | 'ss' | 'dig' | 'tcpdump'>('ping');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 17 10 11 14 15 20 9"/>
          <line x1="20" y1="14" x2="20" y2="9"/>
          <line x1="15" y1="9" x2="20" y2="9"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          CLI Network Diagnostic &amp; Troubleshooting Tool Selector
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
          {(['ping', 'traceroute', 'ss', 'dig', 'tcpdump'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTool(t)}
              style={{
                flex: 1,
                padding: '6px 4px',
                borderRadius: '4px',
                border: tool === t ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                backgroundColor: tool === t ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17',
                color: '#fff',
                fontSize: '11px',
                fontWeight: tool === t ? 700 : 400,
                cursor: 'pointer',
              }}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        <pre style={{ margin: 0, padding: '12px', backgroundColor: '#05070e', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', color: '#34d399', border: '1px solid rgba(255,255,255,0.05)' }}>
          <code>
            {tool === 'ping' && `$ ping -c 4 8.8.8.8\n64 bytes from 8.8.8.8: icmp_seq=1 ttl=117 time=14.2 ms`}
            {tool === 'traceroute' && `$ traceroute 1.1.1.1\n1  192.168.1.1 (192.168.1.1)  1.23 ms\n2  10.240.0.1 (10.240.0.1)  4.56 ms\n3  one.one.one.one (1.1.1.1)  12.3 ms`}
            {tool === 'ss' && `$ ss -tulpn\nNetid  State   Recv-Q Send-Q Local Address:Port  Process\ntcp    LISTEN  0      128    0.0.0.0:8080        users:(("nginx",pid=1234))`}
            {tool === 'dig' && `$ dig +short example.com A\n93.184.216.34`}
            {tool === 'tcpdump' && `$ tcpdump -i eth0 -nn 'tcp port 443 and host 93.184.216.34'\n23:55:01.123 IP 192.168.1.50.54321 > 93.184.216.34.443: Flags [S], seq 12345`}
          </code>
        </pre>
      </div>
    </div>
  );
}
