import React, { useState } from 'react';

type UDPField = 'ports' | 'len' | 'checksum';

export default function UdpAnatomyDiagram(): React.JSX.Element {
  const [activeField, setActiveField] = useState<UDPField>('ports');

  const fields = {
    ports: {
      title: 'Source & Destination Ports (16 bits each)',
      desc: 'Identifies the process endpoint application ports. Direct process-to-process packet parsing.'
    },
    len: {
      title: 'Length (16 bits)',
      desc: 'Specifies the total length of the UDP header plus the payload data in bytes (minimum value is 8 bytes).'
    },
    checksum: {
      title: 'Checksum (16 bits)',
      desc: 'Used for error detection. Verifies integrity of header and payload. Optional in IPv4 but mandatory in IPv6.'
    }
  };

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          📊 Minimal UDP Segment Header (8 Bytes total)
        </h3>
      </div>

      <div style={{ padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        {/* Visual Header Block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'monospace', fontSize: '0.72rem', marginBottom: '1.2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            <div onMouseEnter={() => setActiveField('ports')} style={{ padding: '12px', background: activeField === 'ports' ? 'rgba(56,189,248,0.12)' : '#0d1527', border: `1px solid ${activeField === 'ports' ? '#38bdf8' : 'rgba(255,255,255,0.06)'}`, borderRadius: 4, textAlign: 'center', cursor: 'pointer' }}>
              Source Port (16b)
            </div>
            <div onMouseEnter={() => setActiveField('ports')} style={{ padding: '12px', background: activeField === 'ports' ? 'rgba(56,189,248,0.12)' : '#0d1527', border: `1px solid ${activeField === 'ports' ? '#38bdf8' : 'rgba(255,255,255,0.06)'}`, borderRadius: 4, textAlign: 'center', cursor: 'pointer' }}>
              Destination Port (16b)
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            <div onMouseEnter={() => setActiveField('len')} style={{ padding: '12px', background: activeField === 'len' ? 'rgba(167,139,250,0.12)' : '#0d1527', border: `1px solid ${activeField === 'len' ? '#a78bfa' : 'rgba(255,255,255,0.06)'}`, borderRadius: 4, textAlign: 'center', cursor: 'pointer' }}>
              Length (16b)
            </div>
            <div onMouseEnter={() => setActiveField('checksum')} style={{ padding: '12px', background: activeField === 'checksum' ? 'rgba(74,222,128,0.12)' : '#0d1527', border: `1px solid ${activeField === 'checksum' ? '#4ade80' : 'rgba(255,255,255,0.06)'}`, borderRadius: 4, textAlign: 'center', cursor: 'pointer' }}>
              Checksum (16b)
            </div>
          </div>
        </div>

        {/* Dynamic Detail Card */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#e2e8f0' }}>{fields[activeField].title}</h4>
          <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.45 }}>
            {fields[activeField].desc}
          </p>
        </div>
      </div>
      <p className="interactive-diagram-helper-text">💡 Hover over different UDP header blocks to inspect their functionality details.</p>
    </div>
  );
}
