import React, { useState } from 'react';

export default function DnsRecordTypesDiagram(): React.JSX.Element {
  const [record, setRecord] = useState<'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT'>('A');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          DNS Resource Record Type Inspector & Zone File Explorer
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
          {(['A', 'AAAA', 'CNAME', 'MX', 'TXT'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRecord(r)}
              style={{
                flex: 1,
                padding: '6px 4px',
                borderRadius: '4px',
                border: record === r ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)',
                backgroundColor: record === r ? 'rgba(251, 191, 36, 0.15)' : '#0c0e17',
                color: '#fff',
                fontSize: '11px',
                fontWeight: record === r ? 700 : 400,
                cursor: 'pointer',
              }}
            >
              {r} Record
            </button>
          ))}
        </div>

        <pre style={{ margin: 0, padding: '12px', backgroundColor: '#05070e', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', color: '#38bdf8', border: '1px solid rgba(255,255,255,0.05)' }}>
          <code>
            {record === 'A' && `example.com.    3600    IN    A    93.184.216.34  ; Maps hostname to 32-bit IPv4 address`}
            {record === 'AAAA' && `example.com.    3600    IN    AAAA 2606:2800:220:1:248:1893:25c8:1946 ; 128-bit IPv6`}
            {record === 'CNAME' && `www.example.com. 3600   IN    CNAME example.com. ; Alias pointing canonical name to domain`}
            {record === 'MX' && `example.com.    3600    IN    MX 10 mail.example.com. ; Mail Exchange server priority`}
            {record === 'TXT' && `example.com.    3600    IN    TXT "v=spf1 include:_spf.google.com ~all" ; Domain verification`}
          </code>
        </pre>
      </div>
    </div>
  );
}
