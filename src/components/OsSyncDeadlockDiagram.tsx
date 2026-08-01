import React, { useState } from 'react';

export default function OsSyncDeadlockDiagram(): React.JSX.Element {
  const [primitive, setPrimitive] = useState<'mutex' | 'semaphore' | 'deadlock'>('mutex');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Synchronization Primitives &amp; Deadlock Coffman Conditions
        </span>
      </div>
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setPrimitive('mutex')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: primitive === 'mutex' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)', backgroundColor: primitive === 'mutex' ? 'rgba(52, 211, 153, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>Mutex (Lock)</button>
          <button onClick={() => setPrimitive('semaphore')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: primitive === 'semaphore' ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)', backgroundColor: primitive === 'semaphore' ? 'rgba(251, 191, 36, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>Counting Semaphore</button>
          <button onClick={() => setPrimitive('deadlock')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: primitive === 'deadlock' ? '1px solid #f87171' : '1px solid rgba(255,255,255,0.1)', backgroundColor: primitive === 'deadlock' ? 'rgba(248, 113, 113, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>Deadlock Graph</button>
        </div>
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {primitive === 'mutex' && <p style={{ margin: 0, fontSize: '12px', color: '#34d399' }}>Mutex: Ownership-based binary lock. Only the thread that acquired the mutex can unlock it.</p>}
          {primitive === 'semaphore' && <p style={{ margin: 0, fontSize: '12px', color: '#fbbf24' }}>Semaphore: Signaling mechanism with integer count. wait() decrements count; signal() increments count.</p>}
          {primitive === 'deadlock' && <p style={{ margin: 0, fontSize: '12px', color: '#f87171' }}>Deadlock requires 4 Coffman Conditions: Mutual Exclusion, Hold &amp; Wait, No Preemption, Circular Wait.</p>}
        </div>
      </div>
    </div>
  );
}