import React, { useState } from 'react';

export default function NginxHttp2Http3Diagram() {
  const [protocol, setProtocol] = useState<'h1' | 'h2' | 'h3'>('h2');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
        <span>HTTP Protocol Evolution — HTTP/1.1 vs. HTTP/2 vs. HTTP/3 QUIC</span>

        {/* Protocol selector */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setProtocol('h1')} style={{
            padding: '5px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '11px',
            background: protocol === 'h1' ? '#f8717120' : 'rgba(255,255,255,0.04)',
            color: protocol === 'h1' ? '#f87171' : '#94a3b8'
          }}>
            HTTP/1.1 (Sequential)
          </button>
          <button onClick={() => setProtocol('h2')} style={{
            padding: '5px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '11px',
            background: protocol === 'h2' ? '#38bdf820' : 'rgba(255,255,255,0.04)',
            color: protocol === 'h2' ? '#38bdf8' : '#94a3b8'
          }}>
            HTTP/2 (Multiplexed TCP)
          </button>
          <button onClick={() => setProtocol('h3')} style={{
            padding: '5px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '11px',
            background: protocol === 'h3' ? '#34d39920' : 'rgba(255,255,255,0.04)',
            color: protocol === 'h3' ? '#34d399' : '#94a3b8'
          }}>
            HTTP/3 (QUIC UDP)
          </button>
        </div>
      </div>

      <div className="interactive-diagram-details-card" style={{ borderColor: protocol === 'h3' ? '#34d39940' : protocol === 'h2' ? '#38bdf840' : '#f8717140' }}>
        <h3 style={{ color: protocol === 'h3' ? '#34d399' : protocol === 'h2' ? '#38bdf8' : '#f87171', margin: '0 0 6px 0', fontSize: '14px' }}>
          {protocol === 'h1' && 'HTTP/1.1 — Head-of-Line Blocking'}
          {protocol === 'h2' && 'HTTP/2 — Binary Stream Multiplexing over Single TCP'}
          {protocol === 'h3' && 'HTTP/3 — QUIC over UDP (Per-Stream Independence)'}
        </h3>
        <p style={{ fontSize: '12.5px', color: '#e2e8f0', margin: 0 }}>
          {protocol === 'h1' && 'Sends one request per TCP connection at a time. High latency due to connection setup overhead and Head-of-Line blocking.'}
          {protocol === 'h2' && 'Multiplexes hundreds of parallel request-response streams over a single TCP connection. However, TCP packet loss stalls ALL streams.'}
          {protocol === 'h3' && 'Replaces TCP with QUIC over UDP. Streams operate completely independently — packet loss on Stream 2 does NOT block Stream 1!'}
        </p>
      </div>
    </div>
  );
}
