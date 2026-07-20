import React, { useState } from 'react';

export default function NginxProsConsDiagram() {
  const [activeSide, setActiveSide] = useState<'pros' | 'cons'>('pros');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
        <span>Nginx Trade-Off Analysis: Pros vs. Cons</span>

        {/* Side Selector */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setActiveSide('pros')} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: activeSide === 'pros' ? '#34d39918' : 'rgba(255,255,255,0.04)',
            color: activeSide === 'pros' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeSide === 'pros' ? '0 0 0 1.5px #34d39950' : '0 0 0 1px rgba(255,255,255,0.08)'
          }}>
            Key Advantages 🟢
          </button>
          <button onClick={() => setActiveSide('cons')} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: activeSide === 'cons' ? '#fbbf2418' : 'rgba(255,255,255,0.04)',
            color: activeSide === 'cons' ? '#fbbf24' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeSide === 'cons' ? '0 0 0 1.5px #fbbf2450' : '0 0 0 1px rgba(255,255,255,0.08)'
          }}>
            Architectural Trade-Offs 🟡
          </button>
        </div>
      </div>

      <div className="interactive-diagram-details-card" style={{ borderColor: activeSide === 'pros' ? '#34d39940' : '#fbbf2440' }}>
        <h3 style={{ color: activeSide === 'pros' ? '#34d399' : '#fbbf24', margin: '0 0 6px 0', fontSize: '14px' }}>
          {activeSide === 'pros' ? 'Core Architectural Strengths' : 'Limitations & Operations Complexity'}
        </h3>
        <p style={{ fontSize: '12.5px', color: '#e2e8f0', margin: 0 }}>
          {activeSide === 'pros'
            ? 'Ultra-low memory footprint (~4MB per worker), zero-downtime reloads (SIGHUP) and binary upgrades (SIGUSR2), and battle-tested O(1) epoll event loop scaling to millions of connections.'
            : 'Single-threaded per worker design means CPU-bound work (regex/gzip/synchronous Lua) blocks worker events; disk I/O requires explicit thread pools; advanced features require Nginx Plus.'
          }
        </p>
      </div>
    </div>
  );
}
