import React, { useState } from 'react';

export default function NginxThreadPoolDiagram() {
  const [useThreadPool, setUseThreadPool] = useState<boolean>(true);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
          <line x1="8" y1="6" x2="16" y2="6"/>
        </svg>
        <span>Nginx Thread Pool (Solving Disk I/O Blocking)</span>

        {/* Toggle */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setUseThreadPool(true)} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: useThreadPool ? '#34d39918' : 'rgba(255,255,255,0.04)',
            color: useThreadPool ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: useThreadPool ? '0 0 0 1.5px #34d39950' : '0 0 0 1px rgba(255,255,255,0.08)'
          }}>
            With Thread Pool (aio threads) 🟢
          </button>
          <button onClick={() => setUseThreadPool(false)} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: !useThreadPool ? '#f8717118' : 'rgba(255,255,255,0.04)',
            color: !useThreadPool ? '#f87171' : 'var(--ifm-color-content-secondary)',
            boxShadow: !useThreadPool ? '0 0 0 1.5px #f8717150' : '0 0 0 1px rgba(255,255,255,0.08)'
          }}>
            Without Thread Pool (Direct Read) 💥
          </button>
        </div>
      </div>

      <div className="interactive-diagram-details-card" style={{ borderColor: useThreadPool ? '#34d39940' : '#f8717140' }}>
        <h3 style={{ color: useThreadPool ? '#34d399' : '#f87171', margin: '0 0 6px 0', fontSize: '14px' }}>
          {useThreadPool ? 'Thread Pool Execution Flow (Zero Event-Loop Blocking)' : 'Direct Read (Event-Loop Freeze Risk)'}
        </h3>
        <p style={{ fontSize: '12.5px', color: '#e2e8f0', margin: 0 }}>
          {useThreadPool
            ? 'When a file miss requires disk I/O, Nginx pushes a task to the thread_pool queue and returns to the event loop immediately. A background thread performs pread() (10ms) and notifies event loop via eventfd.'
            : 'Standard pread() on disk miss blocks the single-threaded worker for 10ms. All 5,000 other connections managed by this worker suffer 10ms added latency!'
          }
        </p>
      </div>
    </div>
  );
}
