import React, { useState } from 'react';

type Field = 'ports' | 'seq' | 'ack' | 'flags' | 'window' | 'checksum';

export default function TcpSegmentAnatomyDiagram(): React.JSX.Element {
  const [activeField, setActiveField] = useState<Field>('ports');

  const fieldData = {
    ports: {
      title: 'Source & Destination Ports (16 bits each)',
      desc: 'Process addressing. Identifies the specific application protocol on the sender and receiver host machines (ranges: 0–65535).'
    },
    seq: {
      title: 'Sequence Number (32 bits)',
      desc: 'Used for ordered delivery. Represents the byte offset of the first data byte of this segment in the overall session stream.'
    },
    ack: {
      title: 'Acknowledgment Number (32 bits)',
      desc: 'Used for guaranteed delivery. Specifies the next expected sequence byte number that the sender of the ACK expects to receive.'
    },
    flags: {
      title: 'Control Flags (9 bits)',
      desc: 'Identifies session state triggers: SYN (Establish), ACK (Confirm), FIN (Terminate), RST (Abort), PSH (Push), and URG (Urgent).'
    },
    window: {
      title: 'Receiver Window Size (16 bits)',
      desc: 'Used for Flow Control. Advertises how much buffer size (in bytes) is left available on the receiver to prevent buffer overflows.'
    },
    checksum: {
      title: 'Checksum (16 bits)',
      desc: 'Used for Error Detection. Cryptographic math verifying that the header and payload data were not altered or corrupted in transit.'
    }
  };

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          📊 Interactive TCP Segment Structure Header
        </h3>
      </div>

      <div style={{ padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        {/* Header anatomy boxes layout */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'monospace', fontSize: '0.72rem', marginBottom: '1.2rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            <div onMouseEnter={() => setActiveField('ports')} style={{ padding: '10px', background: activeField === 'ports' ? 'rgba(56,189,248,0.12)' : '#0d1527', border: `1px solid ${activeField === 'ports' ? '#38bdf8' : 'rgba(255,255,255,0.06)'}`, borderRadius: 4, textAlign: 'center', cursor: 'pointer' }}>
              Source Port (16b)
            </div>
            <div onMouseEnter={() => setActiveField('ports')} style={{ padding: '10px', background: activeField === 'ports' ? 'rgba(56,189,248,0.12)' : '#0d1527', border: `1px solid ${activeField === 'ports' ? '#38bdf8' : 'rgba(255,255,255,0.06)'}`, borderRadius: 4, textAlign: 'center', cursor: 'pointer' }}>
              Destination Port (16b)
            </div>
          </div>

          <div onMouseEnter={() => setActiveField('seq')} style={{ padding: '10px', background: activeField === 'seq' ? 'rgba(167,139,250,0.12)' : '#0d1527', border: `1px solid ${activeField === 'seq' ? '#a78bfa' : 'rgba(255,255,255,0.06)'}`, borderRadius: 4, textAlign: 'center', cursor: 'pointer' }}>
            Sequence Number (32b)
          </div>

          <div onMouseEnter={() => setActiveField('ack')} style={{ padding: '10px', background: activeField === 'ack' ? 'rgba(74,222,128,0.12)' : '#0d1527', border: `1px solid ${activeField === 'ack' ? '#4ade80' : 'rgba(255,255,255,0.06)'}`, borderRadius: 4, textAlign: 'center', cursor: 'pointer' }}>
            Acknowledgment Number (32b)
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            <div onMouseEnter={() => setActiveField('flags')} style={{ padding: '10px', background: activeField === 'flags' ? 'rgba(251,146,60,0.12)' : '#0d1527', border: `1px solid ${activeField === 'flags' ? '#fb923c' : 'rgba(255,255,255,0.06)'}`, borderRadius: 4, textAlign: 'center', cursor: 'pointer' }}>
              Control Flags (9b)
            </div>
            <div onMouseEnter={() => setActiveField('window')} style={{ padding: '10px', background: activeField === 'window' ? 'rgba(56,189,248,0.12)' : '#0d1527', border: `1px solid ${activeField === 'window' ? '#38bdf8' : 'rgba(255,255,255,0.06)'}`, borderRadius: 4, textAlign: 'center', cursor: 'pointer' }}>
              Window Size (16b)
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            <div onMouseEnter={() => setActiveField('checksum')} style={{ padding: '10px', background: activeField === 'checksum' ? 'rgba(74,222,128,0.12)' : '#0d1527', border: `1px solid ${activeField === 'checksum' ? '#4ade80' : 'rgba(255,255,255,0.06)'}`, borderRadius: 4, textAlign: 'center', cursor: 'pointer' }}>
              Checksum (16b)
            </div>
            <div style={{ padding: '10px', background: '#0d1527', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, textAlign: 'center', color: '#64748b' }}>
              Urgent Pointer (16b)
            </div>
          </div>

        </div>

        {/* Dynamic Detail Card */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#e2e8f0' }}>{fieldData[activeField].title}</h4>
          <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.45 }}>
            {fieldData[activeField].desc}
          </p>
        </div>
      </div>
      <p className="interactive-diagram-helper-text">💡 Hover over different segment header blocks to inspect their functionality details.</p>
    </div>
  );
}
