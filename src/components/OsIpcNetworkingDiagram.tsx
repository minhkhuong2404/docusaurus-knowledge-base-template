import React, { useState } from 'react';

export default function OsIpcNetworkingDiagram(): React.JSX.Element {
  const [ipc, setIpc] = useState<'shm' | 'pipe' | 'socket'>('shm');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Inter-Process Communication (IPC) Mechanisms Comparison
        </span>
      </div>
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setIpc('shm')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: ipc === 'shm' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)', backgroundColor: ipc === 'shm' ? 'rgba(52, 211, 153, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>Shared Memory (Fastest)</button>
          <button onClick={() => setIpc('pipe')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: ipc === 'pipe' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', backgroundColor: ipc === 'pipe' ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>Pipes / FIFO</button>
          <button onClick={() => setIpc('socket')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: ipc === 'socket' ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)', backgroundColor: ipc === 'socket' ? 'rgba(251, 191, 36, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>Unix Sockets</button>
        </div>
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {ipc === 'shm' && <p style={{ margin: 0, fontSize: '12px', color: '#34d399' }}>Shared Memory: Processes map same RAM region. Zero kernel copy overhead. Requires mutex/semaphore synchronization.</p>}
          {ipc === 'pipe' && <p style={{ margin: 0, fontSize: '12px', color: '#38bdf8' }}>Pipes: Unidirectional stream buffer in kernel memory. Data written by one process is read sequentially by another.</p>}
          {ipc === 'socket' && <p style={{ margin: 0, fontSize: '12px', color: '#fbbf24' }}>Unix Domain Sockets: Bidirectional IPC mechanism using file paths (/tmp/app.sock). Skips network stack overhead.</p>}
        </div>
      </div>
    </div>
  );
}