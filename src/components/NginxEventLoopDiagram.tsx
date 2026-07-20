import React, { useState } from 'react';

export default function NginxEventLoopDiagram() {
  const [triggerMode, setTriggerMode] = useState<'edge' | 'level'>('edge');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <span>epoll Event Loop & Triggering Modes</span>

        {/* Mode selector */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setTriggerMode('edge')} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: triggerMode === 'edge' ? '#34d39918' : 'rgba(255,255,255,0.04)',
            color: triggerMode === 'edge' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: triggerMode === 'edge' ? '0 0 0 1.5px #34d39950' : '0 0 0 1px rgba(255,255,255,0.08)'
          }}>
            Edge-Triggered (EPOLLET)
          </button>

          <button onClick={() => setTriggerMode('level')} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: triggerMode === 'level' ? '#38bdf818' : 'rgba(255,255,255,0.04)',
            color: triggerMode === 'level' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
            boxShadow: triggerMode === 'level' ? '0 0 0 1.5px #38bdf850' : '0 0 0 1px rgba(255,255,255,0.08)'
          }}>
            Level-Triggered
          </button>
        </div>
      </div>

      <div className="interactive-diagram-details-card" style={{ borderColor: triggerMode === 'edge' ? '#34d39940' : '#38bdf840' }}>
        <h3 style={{ color: triggerMode === 'edge' ? '#34d399' : '#38bdf8', margin: '0 0 6px 0', fontSize: '14px' }}>
          {triggerMode === 'edge' ? 'Edge-Triggered Mode (EPOLLET — Nginx Default)' : 'Level-Triggered Mode'}
        </h3>

        <p style={{ fontSize: '12.5px', color: '#e2e8f0', margin: 0 }}>
          {triggerMode === 'edge'
            ? 'epoll_wait fires ONCE when new data arrives at the socket. Worker MUST loop read() until EAGAIN (no more data). Fewer spurious wakeups = max CPU efficiency!'
            : 'epoll_wait fires repeatedly on every loop iteration as long as unread bytes remain in socket buffer. Higher syscall overhead under heavy load.'
          }
        </p>
      </div>
    </div>
  );
}
