import React, { useState } from 'react';

export default function OsProcessesThreadsDiagram(): React.JSX.Element {
  const [state, setState] = useState<'ready' | 'running' | 'waiting' | 'terminated'>('running');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 3-3.87"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Process Lifecycle State Machine &amp; Thread Stack/Heap Sharing
        </span>
      </div>
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
          {(['ready', 'running', 'waiting', 'terminated'] as const).map(s => (
            <button key={s} onClick={() => setState(s)} style={{ flex: 1, padding: '6px', borderRadius: '4px', border: state === s ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)', backgroundColor: state === s ? 'rgba(52, 211, 153, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>
              [{s.toUpperCase()}] State
            </button>
          ))}
        </div>
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {state === 'ready' && <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content)' }}>READY: Process loaded in RAM, waiting for CPU scheduler assignment.</p>}
          {state === 'running' && <p style={{ margin: 0, fontSize: '12px', color: '#34d399' }}>RUNNING: Executing instructions on CPU core. Threads share Heap/Data segment, but possess unique Stack pointers &amp; PC registers.</p>}
          {state === 'waiting' && <p style={{ margin: 0, fontSize: '12px', color: '#fbbf24' }}>WAITING / BLOCKED: Process paused waiting for I/O completion or signal (e.g. disk read, socket data).</p>}
          {state === 'terminated' && <p style={{ margin: 0, fontSize: '12px', color: '#f87171' }}>TERMINATED: Execution completed. Resources freed; PCB cleaned up after parent calls waitpid().</p>}
        </div>
      </div>
    </div>
  );
}