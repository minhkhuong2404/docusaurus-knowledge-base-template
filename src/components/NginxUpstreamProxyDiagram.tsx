import React, { useState } from 'react';

export default function NginxUpstreamProxyDiagram() {
  const [buffering, setBuffering] = useState<boolean>(true);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 3 21 3 21 8"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
        <span>Upstream Proxying & Buffering Mechanics</span>

        {/* Toggle */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setBuffering(true)} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: buffering ? '#34d39918' : 'rgba(255,255,255,0.04)',
            color: buffering ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: buffering ? '0 0 0 1.5px #34d39950' : '0 0 0 1px rgba(255,255,255,0.08)'
          }}>
            proxy_buffering on (Default 🟢)
          </button>
          <button onClick={() => setBuffering(false)} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: !buffering ? '#fbbf2418' : 'rgba(255,255,255,0.04)',
            color: !buffering ? '#fbbf24' : 'var(--ifm-color-content-secondary)',
            boxShadow: !buffering ? '0 0 0 1.5px #fbbf2450' : '0 0 0 1px rgba(255,255,255,0.08)'
          }}>
            proxy_buffering off (Streaming ⚡)
          </button>
        </div>
      </div>

      <div className="interactive-diagram-details-card" style={{ borderColor: buffering ? '#34d39940' : '#fbbf2440' }}>
        <h3 style={{ color: buffering ? '#34d399' : '#fbbf24', margin: '0 0 6px 0', fontSize: '14px' }}>
          {buffering ? 'Proxy Buffering ON (Frees Upstream Immediately)' : 'Proxy Buffering OFF (Real-Time Stream / SSE)'}
        </h3>
        <p style={{ fontSize: '12.5px', color: '#e2e8f0', margin: 0 }}>
          {buffering
            ? 'Nginx reads response into memory buffers as fast as the upstream can send it. The upstream connection is freed immediately, while Nginx streams the buffer to slow clients.'
            : 'Nginx passes data to client in real-time. Upstream connection remains held until client finishes reading. Required for SSE / WebSockets / Chunked Streaming.'
          }
        </p>
      </div>
    </div>
  );
}
