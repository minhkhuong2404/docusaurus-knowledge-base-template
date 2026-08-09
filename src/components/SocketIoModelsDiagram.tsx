import React, { useState } from 'react';

export default function SocketIoModelsDiagram(): React.JSX.Element {
  const [model, setModel] = useState<'blocking' | 'nonblocking' | 'epoll' | 'async'>('epoll');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Linux Socket I/O Architecture Models: Blocking vs `epoll` vs `io_uring`
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '16px' }}>
          <button onClick={() => setModel('blocking')} style={{ padding: '8px 4px', borderRadius: '6px', border: model === 'blocking' ? '1px solid #f87171' : '1px solid rgba(255,255,255,0.1)', backgroundColor: model === 'blocking' ? 'rgba(248, 113, 113, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>
            Blocking I/O
          </button>
          <button onClick={() => setModel('nonblocking')} style={{ padding: '8px 4px', borderRadius: '6px', border: model === 'nonblocking' ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)', backgroundColor: model === 'nonblocking' ? 'rgba(251, 191, 36, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>
            Non-Blocking Polling
          </button>
          <button onClick={() => setModel('epoll')} style={{ padding: '8px 4px', borderRadius: '6px', border: model === 'epoll' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', backgroundColor: model === 'epoll' ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>
            I/O Multiplexing (`epoll`)
          </button>
          <button onClick={() => setModel('async')} style={{ padding: '8px 4px', borderRadius: '6px', border: model === 'async' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)', backgroundColor: model === 'async' ? 'rgba(52, 211, 153, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>
            Async I/O (`io_uring`)
          </button>
        </div>

        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {model === 'blocking' && <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content)' }}>Thread blocks completely on <code>read()</code> until data arrives from socket buffer. High thread context switching overhead (1 thread per connection).</p>}
          {model === 'nonblocking' && <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content)' }}><code>read()</code> returns immediately with <code>EAGAIN</code> if no data available. Requires busy loop polling — wastes CPU cycles!</p>}
          {model === 'epoll' && <p style={{ margin: 0, fontSize: '12px', color: '#38bdf8' }}>Event-driven O(1) notification model! Single thread monitors 1,000,000 active socket file descriptors via kernel readiness queue (used by NGINX, Redis, Netty).</p>}
          {model === 'async' && <p style={{ margin: 0, fontSize: '12px', color: '#34d399' }}>Linux `io_uring` ring buffer model. Zero syscall overhead! Kernel copies data directly into user-space buffers and notifies completion ring.</p>}
        </div>
      </div>
    </div>
  );
}
