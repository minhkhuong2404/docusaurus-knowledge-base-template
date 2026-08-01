import React, { useState } from 'react';

export default function OsCpuSchedulingDiagram(): React.JSX.Element {
  const [algo, setAlgo] = useState<'cfs' | 'rr' | 'sjf'>('cfs');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          CPU Scheduling Algorithm &amp; Context Switch Simulator
        </span>
      </div>
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {(['cfs', 'rr', 'sjf'] as const).map(a => (
            <button key={a} onClick={() => setAlgo(a)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: algo === a ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', backgroundColor: algo === a ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>
              {a === 'cfs' ? 'Linux CFS (Red-Black Tree)' : a === 'rr' ? 'Round Robin (Time Quantum)' : 'Shortest Job First (SJF)'}
            </button>
          ))}
        </div>
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {algo === 'cfs' && <p style={{ margin: 0, fontSize: '12px', color: '#38bdf8' }}>Linux CFS models an ideal multi-tasking CPU using a Red-Black tree sorted by vruntime. Task with smallest virtual runtime is selected next.</p>}
          {algo === 'rr' && <p style={{ margin: 0, fontSize: '12px', color: '#34d399' }}>Round Robin assigns a fixed time quantum (e.g. 10ms). Preempts process when time slice expires, placing it back into the ready queue.</p>}
          {algo === 'sjf' && <p style={{ margin: 0, fontSize: '12px', color: '#fbbf24' }}>SJF selects process with shortest estimated CPU burst duration. Minimizes average wait time but can cause starvation for long jobs.</p>}
        </div>
      </div>
    </div>
  );
}