import React, { useState } from 'react';

export default function Http2MultiplexingDiagram() {
  const [activeStream, setActiveStream] = useState<number>(1);
  const [protocolMode, setProtocolMode] = useState<'h1' | 'h2'>('h2');

  const streams = [
    { id: 1, name: 'Stream 1: GET /api/users', color: '#38bdf8', desc: 'Header + Data frames interleaved over Stream 1.' },
    { id: 2, name: 'Stream 2: GET /static/logo.png', color: '#34d399', desc: 'Fast small asset frames complete without waiting for Stream 1.' },
    { id: 3, name: 'Stream 3: POST /api/orders', color: '#a78bfa', desc: 'Binary DATA frames stream concurrently in parallel.' }
  ];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="18" x2="20" y2="18"/>
        </svg>
        <span>HTTP/2 Multiplexed Binary Stream Simulator</span>

        {/* Mode selector */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setProtocolMode('h1')} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: protocolMode === 'h1' ? '#f8717118' : 'rgba(255,255,255,0.04)',
            color: protocolMode === 'h1' ? '#f87171' : 'var(--ifm-color-content-secondary)',
            boxShadow: protocolMode === 'h1' ? '0 0 0 1.5px #f8717150' : '0 0 0 1px rgba(255,255,255,0.08)'
          }}>
            HTTP/1.1 (3 TCP Connections)
          </button>

          <button onClick={() => setProtocolMode('h2')} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: protocolMode === 'h2' ? '#38bdf818' : 'rgba(255,255,255,0.04)',
            color: protocolMode === 'h2' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
            boxShadow: protocolMode === 'h2' ? '0 0 0 1.5px #38bdf850' : '0 0 0 1px rgba(255,255,255,0.08)'
          }}>
            HTTP/2 (1 Multiplexed TCP)
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'start' }} className="h2-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .h2-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* Stream Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {streams.map(s => {
            const isSelected = activeStream === s.id;
            return (
              <button key={s.id} onClick={() => setActiveStream(s.id)} style={{
                padding: '9px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', textAlign: 'left',
                background: isSelected ? `${s.color}15` : 'rgba(255,255,255,0.03)',
                boxShadow: isSelected ? `0 0 0 1.5px ${s.color}50` : '0 0 0 1px rgba(255,255,255,0.06)'
              }}>
                <strong style={{ fontSize: '12px', color: isSelected ? s.color : '#e2e8f0' }}>{s.name}</strong>
              </button>
            );
          })}
        </div>

        {/* Info Card */}
        <div className="interactive-diagram-details-card" style={{ borderColor: `${streams[activeStream - 1].color}40` }}>
          <h3 style={{ color: streams[activeStream - 1].color, margin: '0 0 6px 0', fontSize: '14px' }}>
            {streams[activeStream - 1].name}
          </h3>
          <p style={{ fontSize: '12.5px', color: '#e2e8f0', margin: 0 }}>
            {protocolMode === 'h1'
              ? 'In HTTP/1.1, each stream requires opening a separate TCP connection or waiting sequentially in line (Head-of-Line blocking).'
              : `${streams[activeStream - 1].desc} Multiple streams interleave binary frames over a single TCP connection simultaneously.`
            }
          </p>
        </div>
      </div>
    </div>
  );
}
