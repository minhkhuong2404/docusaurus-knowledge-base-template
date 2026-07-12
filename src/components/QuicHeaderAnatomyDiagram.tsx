import React, { useState } from 'react';

type HeaderType = 'long' | 'short';

export default function QuicHeaderAnatomyDiagram(): React.JSX.Element {
  const [headerType, setHeaderType] = useState<HeaderType>('long');

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          📊 QUIC Packet Headers & Core Envelopes
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setHeaderType('long')} style={{ background: headerType === 'long' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${headerType === 'long' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: headerType === 'long' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Long Header</button>
          <button onClick={() => setHeaderType('short')} style={{ background: headerType === 'short' ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${headerType === 'short' ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: headerType === 'short' ? '#a78bfa' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Short Header</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.2rem', padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        {/* Info detail */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1.2rem' }}>
          {headerType === 'long' ? (
            <>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#38bdf8' }}>Long Header Packet Structure</h4>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.45 }}>
                Used during connection establishment before keys are fully settled. Contains fields like: Version, Destination Connection ID, Source Connection ID, and length.
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                <span style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: 4, fontSize: '0.64rem', color: '#cbd5e1' }}>• Initial</span>
                <span style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: 4, fontSize: '0.64rem', color: '#cbd5e1' }}>• Handshake</span>
                <span style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: 4, fontSize: '0.64rem', color: '#cbd5e1' }}>• 0-RTT</span>
                <span style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: 4, fontSize: '0.64rem', color: '#cbd5e1' }}>• Retry</span>
              </div>
            </>
          ) : (
            <>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#a78bfa' }}>Short Header (1-RTT) Structure</h4>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.45 }}>
                Minimizes packet overhead during normal data phase. Strips version flags and redundant source connection ID fields to save packet footprint bytes.
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                <span style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: 4, fontSize: '0.64rem', color: '#cbd5e1' }}>• 1-RTT Application Data</span>
              </div>
            </>
          )}
        </div>

        {/* Visual Map */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#cbd5e1' }}>Anatomy Header Fields</h4>
          <pre style={{ margin: 0, padding: '8px 12px', background: '#090b14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.68rem', color: '#38bdf8', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            {headerType === 'long' ? (
`┌───────────────────────────────────────┐
│ Header Form (1 bit = 1)               │
│ Packet Type (2 bits: Initial/etc.)    │
│ Version (32 bits)                     │
│ Destination Connection ID (0..160b)   │
│ Source Connection ID (0..160b)        │
│ Payload (Encrypted Crypto/Frames)     │
└───────────────────────────────────────┘`
            ) : (
`┌───────────────────────────────────────┐
│ Header Form (1 bit = 0)               │
│ Spin Bit (1 bit)                      │
│ Destination Connection ID (0..160b)   │
│ Packet Number (8..32 bits)            │
│ Payload (Encrypted Application Data)  │
└───────────────────────────────────────┘`
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
