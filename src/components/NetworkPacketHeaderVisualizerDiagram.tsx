import React, { useState } from 'react';

export default function NetworkPacketHeaderVisualizerDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'tcp' | 'ipv4' | 'flags'>('tcp');
  const [activeFlagScenario, setActiveFlagScenario] = useState<'syn' | 'synack' | 'ack' | 'pshack' | 'fin' | 'rst'>('syn');
  const [selectedField, setSelectedField] = useState<string | null>(null);

  const flagScenarios = {
    syn: { name: 'SYN (Connect Request)', flags: { SYN: 1, ACK: 0, FIN: 0, RST: 0, PSH: 0, URG: 0 }, desc: 'Initial handshake probe from Client to Server with initial sequence number (ISN).' },
    synack: { name: 'SYN-ACK (Handshake Response)', flags: { SYN: 1, ACK: 1, FIN: 0, RST: 0, PSH: 0, URG: 0 }, desc: 'Server confirms Client ISN (ACK=ISN+1) and sends Server ISN.' },
    ack: { name: 'ACK (Handshake Complete / Pure ACK)', flags: { SYN: 0, ACK: 1, FIN: 0, RST: 0, PSH: 0, URG: 0 }, desc: 'Client confirms Server ISN. 3-Way Handshake established.' },
    pshack: { name: 'PSH-ACK (Data Push)', flags: { SYN: 0, ACK: 1, FIN: 0, RST: 0, PSH: 1, URG: 0 }, desc: 'Application data payload delivered; requests receiving kernel to bypass buffer delay and push directly to socket.' },
    fin: { name: 'FIN-ACK (Graceful Teardown)', flags: { SYN: 0, ACK: 1, FIN: 1, RST: 0, PSH: 0, URG: 0 }, desc: 'Initiates 4-way connection termination.' },
    rst: { name: 'RST (Connection Abort / Refused)', flags: { SYN: 0, ACK: 0, FIN: 0, RST: 1, PSH: 0, URG: 0 }, desc: 'Immediate unceremonious connection reset (e.g. port closed, firewall reject).' }
  };

  const currFlags = flagScenarios[activeFlagScenario];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Bitwise TCP &amp; IPv4 Packet Header Architecture Visualizer
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('tcp')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'tcp' ? '1px solid #38bdf850' : '1px solid transparent',
              background: activeTab === 'tcp' ? '#38bdf818' : 'transparent',
              color: activeTab === 'tcp' ? '#38bdf8' : 'var(--ifm-color-content-secondary)'
            }}
          >
            TCP 32-Bit Word Header
          </button>
          <button
            onClick={() => setActiveTab('flags')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'flags' ? '1px solid #38bdf850' : '1px solid transparent',
              background: activeTab === 'flags' ? '#38bdf818' : 'transparent',
              color: activeTab === 'flags' ? '#38bdf8' : 'var(--ifm-color-content-secondary)'
            }}
          >
            TCP Control Flags
          </button>
          <button
            onClick={() => setActiveTab('ipv4')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'ipv4' ? '1px solid #38bdf850' : '1px solid transparent',
              background: activeTab === 'ipv4' ? '#38bdf818' : 'transparent',
              color: activeTab === 'ipv4' ? '#38bdf8' : 'var(--ifm-color-content-secondary)'
            }}
          >
            IPv4 Packet Header
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Tab 1: TCP 32-Bit Word Header */}
        {activeTab === 'tcp' && (
          <div>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '10px' }}>
              Standard 20-Byte TCP Header (32-Bit Word Alignment):
            </div>

            {/* 32-Bit Grid Representation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
              {/* Word 0 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div
                  onClick={() => setSelectedField('Source Port (16 bits): Port on originating host (e.g. 54321 ephemeral).')}
                  style={{ background: '#090b14', border: '1px solid #38bdf8', padding: '8px', borderRadius: '6px', textAlign: 'center', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>Source Port (16 bits)</div>
                  <div style={{ fontSize: '9px', color: 'var(--ifm-color-content-secondary)' }}>0 - 15</div>
                </div>
                <div
                  onClick={() => setSelectedField('Destination Port (16 bits): Target service port (e.g. 443 HTTPS, 80 HTTP, 3306 MySQL).')}
                  style={{ background: '#090b14', border: '1px solid #38bdf8', padding: '8px', borderRadius: '6px', textAlign: 'center', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>Destination Port (16 bits)</div>
                  <div style={{ fontSize: '9px', color: 'var(--ifm-color-content-secondary)' }}>16 - 31</div>
                </div>
              </div>

              {/* Word 1 */}
              <div
                onClick={() => setSelectedField('Sequence Number (32 bits): Byte stream offset of the first data byte in this segment. Ensures in-order reassembly.')}
                style={{ background: '#090b14', border: '1px solid #34d399', padding: '8px', borderRadius: '6px', textAlign: 'center', cursor: 'pointer' }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399' }}>Sequence Number (32 bits / 4 Bytes)</div>
                <div style={{ fontSize: '9px', color: 'var(--ifm-color-content-secondary)' }}>Tracks byte position in payload stream</div>
              </div>

              {/* Word 2 */}
              <div
                onClick={() => setSelectedField('Acknowledgment Number (32 bits): Next expected byte number from remote peer (Cumulative ACK).')}
                style={{ background: '#090b14', border: '1px solid #2dd4bf', padding: '8px', borderRadius: '6px', textAlign: 'center', cursor: 'pointer' }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#2dd4bf' }}>Acknowledgment Number (32 bits / 4 Bytes)</div>
                <div style={{ fontSize: '9px', color: 'var(--ifm-color-content-secondary)' }}>Valid only when ACK flag is set</div>
              </div>

              {/* Word 3 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr 2fr', gap: '6px' }}>
                <div
                  onClick={() => setSelectedField('Data Offset / Header Length (4 bits): Number of 32-bit words in header (minimum 5 = 20 bytes).')}
                  style={{ background: '#090b14', border: '1px solid #fbbf24', padding: '6px', borderRadius: '6px', textAlign: 'center', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#fbbf24' }}>Offset (4b)</div>
                </div>
                <div
                  onClick={() => setSelectedField('Reserved (3 bits): Must be 0.')}
                  style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.1)', padding: '6px', borderRadius: '6px', textAlign: 'center', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Res (3b)</div>
                </div>
                <div
                  onClick={() => setSelectedField('Control Flags (9 bits): URG, ACK, PSH, RST, SYN, FIN, ECE, CWR, NS governing connection lifecycle.')}
                  style={{ background: '#090b14', border: '1px solid #f87171', padding: '6px', borderRadius: '6px', textAlign: 'center', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#f87171' }}>Flags (9b)</div>
                </div>
                <div
                  onClick={() => setSelectedField('Window Size (16 bits): Receive buffer capacity advertised for flow control (TCP Windowing).')}
                  style={{ background: '#090b14', border: '1px solid #a78bfa', padding: '6px', borderRadius: '6px', textAlign: 'center', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#a78bfa' }}>Window Size (16b)</div>
                </div>
              </div>

              {/* Word 4 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div
                  onClick={() => setSelectedField('Checksum (16 bits): 16-bit one\'s complement checksum covering TCP header + pseudo-IP header + payload.')}
                  style={{ background: '#090b14', border: '1px solid #34d399', padding: '8px', borderRadius: '6px', textAlign: 'center', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399' }}>Checksum (16 bits)</div>
                </div>
                <div
                  onClick={() => setSelectedField('Urgent Pointer (16 bits): Points to urgent data byte when URG flag is set.')}
                  style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '6px', textAlign: 'center', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Urgent Pointer (16 bits)</div>
                </div>
              </div>
            </div>

            {selectedField && (
              <div style={{ background: '#0c0e17', border: '1px solid #38bdf840', padding: '10px', borderRadius: '6px', fontSize: '11.5px', color: 'var(--ifm-color-content)' }}>
                {selectedField}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Control Flags Simulator */}
        {activeTab === 'flags' && (
          <div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {(['syn', 'synack', 'ack', 'pshack', 'fin', 'rst'] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveFlagScenario(key)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: activeFlagScenario === key ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                    background: activeFlagScenario === key ? '#38bdf818' : '#090b14',
                    color: activeFlagScenario === key ? '#38bdf8' : 'var(--ifm-color-content-secondary)'
                  }}
                >
                  {flagScenarios[key].name.split(' ')[0]}
                </button>
              ))}
            </div>

            <div style={{
              background: '#0c0e17',
              borderRadius: '10px',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              padding: '16px'
            }}>
              <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
                {currFlags.name}
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', marginBottom: '12px' }}>
                {currFlags.desc}
              </p>

              {/* Flags Bit Pattern */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', textAlign: 'center' }}>
                {Object.entries(currFlags.flags).map(([flag, val]) => (
                  <div
                    key={flag}
                    style={{
                      background: val === 1 ? '#34d39922' : '#090b14',
                      border: val === 1 ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.05)',
                      padding: '8px',
                      borderRadius: '6px'
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, color: val === 1 ? '#34d399' : 'var(--ifm-color-content-secondary)' }}>{flag}</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: val === 1 ? '#34d399' : 'var(--ifm-color-content-secondary)', fontFamily: 'monospace' }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: IPv4 Packet Header */}
        {activeTab === 'ipv4' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', fontSize: '11px' }}>
              <div style={{ background: '#090b14', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #38bdf8' }}>
                <strong style={{ color: '#38bdf8' }}>Version &amp; IHL (8b):</strong> Version 4 + Internet Header Length (5 words = 20B).
              </div>
              <div style={{ background: '#090b14', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #fbbf24' }}>
                <strong style={{ color: '#fbbf24' }}>Total Length (16b):</strong> Entire IP datagram size including header + payload (up to 65,535 bytes).
              </div>
              <div style={{ background: '#090b14', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #f87171' }}>
                <strong style={{ color: '#f87171' }}>Flags (DF, MF) &amp; Offset (16b):</strong> Controls IP MTU fragmentation (DF=1 causes ICMP Type 3 Code 4 for Path MTU Discovery).
              </div>
              <div style={{ background: '#090b14', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #34d399' }}>
                <strong style={{ color: '#34d399' }}>TTL (8b) &amp; Protocol (8b):</strong> Decremented by every router hop (prevents infinite loops) + specifies L4 protocol (6=TCP, 17=UDP).
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
