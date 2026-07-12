import React, { useState } from 'react';

type H3Field = 'qpack' | 'framing' | 'streams';

export default function QuicHttp3Diagram(): React.JSX.Element {
  const [activeField, setActiveField] = useState<H3Field>('qpack');

  const fields = {
    qpack: {
      title: 'QPACK Header Compression',
      desc: 'Eliminates Head-of-Line blocking in header compression. Unlike HTTP/2\'s stateful HPACK (which requires strict sequential processing), QPACK uses a dynamic table allowing out-of-order decompression over independent streams.'
    },
    framing: {
      title: 'HTTP/3 Framing Layer',
      desc: 'Maps standard HTTP verbs (GET, POST), response codes, and headers into discrete structured frame chunks (e.g. HEADERS frame, DATA frame) written directly to QUIC streams.'
    },
    streams: {
      title: 'QUIC Streams mapping',
      desc: 'Each HTTP request/response transaction binds to its own dedicated bidirectional QUIC stream. Control and configuration signals utilize independent unidirectional channels.'
    }
  };

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          📊 HTTP/3 over QUIC Stack Layers
        </h3>
      </div>

      <div style={{ padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        {/* Layer Layout */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'monospace', fontSize: '0.74rem', marginBottom: '1.2rem' }}>
          
          <div onMouseEnter={() => setActiveField('qpack')} style={{ padding: '12px', background: activeField === 'qpack' ? 'rgba(56,189,248,0.12)' : '#0d1527', border: `1px solid ${activeField === 'qpack' ? '#38bdf8' : 'rgba(255,255,255,0.06)'}`, borderRadius: 4, textAlign: 'center', cursor: 'pointer' }}>
            QPACK (Header Compression Layer)
          </div>

          <div onMouseEnter={() => setActiveField('framing')} style={{ padding: '12px', background: activeField === 'framing' ? 'rgba(167,139,250,0.12)' : '#0d1527', border: `1px solid ${activeField === 'framing' ? '#a78bfa' : 'rgba(255,255,255,0.06)'}`, borderRadius: 4, textAlign: 'center', cursor: 'pointer' }}>
            HTTP/3 Framing Layer
          </div>

          <div onMouseEnter={() => setActiveField('streams')} style={{ padding: '12px', background: activeField === 'streams' ? 'rgba(74,222,128,0.12)' : '#0d1527', border: `1px solid ${activeField === 'streams' ? '#4ade80' : 'rgba(255,255,255,0.06)'}`, borderRadius: 4, textAlign: 'center', cursor: 'pointer' }}>
            QUIC Transport Streams
          </div>

        </div>

        {/* Detail Panel */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#e2e8f0' }}>{fields[activeField].title}</h4>
          <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.45 }}>
            {fields[activeField].desc}
          </p>
        </div>
      </div>
      <p className="interactive-diagram-helper-text">💡 Hover over different layers to inspect how HTTP/3 maps verbs and options onto QUIC.</p>
    </div>
  );
}
