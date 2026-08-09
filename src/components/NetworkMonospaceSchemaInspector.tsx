import React, { useState } from 'react';

const NETWORK_SCHEMAS = [
  {
    id: 'tcp_header',
    name: '1. TCP Header Bitwise Monospace Schema (20 Bytes Overhead)',
    spec: ` 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|          Source Port          |       Destination Port        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                        Sequence Number                        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                     Acknowledgment Number                     |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  Data | Rsvd |U|A|P|R|S|F|                    |
| Offset|      |R|C|S|S|Y|I|            Window Size              |
|       |      |G|K|H|T|N|N|                    |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|           Checksum            |         Urgent Pointer        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+`,
    fields: [
      { name: 'Source/Dest Port', type: '16 Bits Each', desc: '16-bit process numbers (e.g. Source Port 49152, Dest Port 443).' },
      { name: 'Sequence Number', type: '32 Bits (4B)', desc: 'Initial Sequence Number (ISN) + byte counter for ordered stream reassembly.' },
      { name: 'Ack Number', type: '32 Bits (4B)', desc: 'Next expected byte sequence number from sender.' },
      { name: 'TCP Control Flags', type: '6 Bits (SYN/ACK/FIN/RST)', desc: 'Control flags: SYN (handshake start), ACK (acknowledge), FIN (clean close), RST (abort connection).' }
    ]
  },
  {
    id: 'ip_header',
    name: '2. IPv4 Header Bitwise Monospace Schema (20 Bytes Overhead)',
    spec: ` 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|Version|  IHL  |Type of Service|          Total Length         |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|         Identification        |Flags|      Fragment Offset    |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  Time to Live |    Protocol   |        Header Checksum        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                       Source IP Address                       |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    Destination IP Address                     |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+`,
    fields: [
      { name: 'Version & IHL', type: '4 Bits + 4 Bits', desc: 'IPv4 identifier + Internet Header Length in 32-bit words.' },
      { name: 'Time To Live (TTL)', type: '8 Bits (1B)', desc: 'Hop limit counter decremented by each router. Prevents routing loops.' },
      { name: 'Protocol', type: '8 Bits (1B)', desc: 'Protocol identifier for payload (6 = TCP, 17 = UDP, 1 = ICMP).' }
    ]
  }
];

export default function NetworkMonospaceSchemaInspector(): React.JSX.Element {
  const [selectedSchemaIdx, setSelectedSchemaIdx] = useState<number>(0);
  const [selectedFieldIdx, setSelectedFieldIdx] = useState<number>(0);

  const currSchema = NETWORK_SCHEMAS[selectedSchemaIdx];
  const currField = currSchema.fields[selectedFieldIdx] || currSchema.fields[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .net-schema-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Network Packet Bitwise Monospace Header Inspector (TCP / IPv4)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Schema Switcher Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {NETWORK_SCHEMAS.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => { setSelectedSchemaIdx(idx); setSelectedFieldIdx(0); }}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: selectedSchemaIdx === idx ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.04)',
                color: selectedSchemaIdx === idx ? '#fbbf24' : 'var(--ifm-color-content-secondary)',
                boxShadow: selectedSchemaIdx === idx ? '0 0 0 1.5px #fbbf24' : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* Main Monospace Inspector Grid */}
        <div className="net-schema-grid" style={{ display: 'grid', gridTemplateColumns: '58% 42%', gap: '14px', alignItems: 'start' }}>
          <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '12px', overflowX: 'auto' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
              BITWISE HEADER LAYOUT (MONOSPACE 32-BIT WORDS)
            </div>
            <pre style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace', fontSize: '10.5px', color: '#e2e8f0', lineHeight: 1.4, margin: 0, background: 'transparent' }}>
              {currSchema.spec}
            </pre>
          </div>

          <div className="interactive-diagram-details-card details-yellow" style={{ minHeight: '260px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '6px' }}>
              HEADER FIELD INSPECTOR
            </div>

            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {currSchema.fields.map((f, idx) => (
                <button
                  key={f.name}
                  onClick={() => setSelectedFieldIdx(idx)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    background: selectedFieldIdx === idx ? '#fbbf24' : 'rgba(255,255,255,0.06)',
                    color: selectedFieldIdx === idx ? '#090b14' : 'var(--ifm-color-content)'
                  }}
                >
                  {f.name}
                </button>
              ))}
            </div>

            <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '4px' }}>
              {currField.name}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
              Bit Alignment: {currField.type}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: 0 }}>
              {currField.desc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
