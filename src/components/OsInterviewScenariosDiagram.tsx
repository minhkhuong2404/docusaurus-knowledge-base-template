import React, { useState } from 'react';

export default function OsInterviewScenariosDiagram(): React.JSX.Element {
  const [topic, setTopic] = useState<'thrashing' | 'context' | 'zombie'>('thrashing');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Senior Operating System Interview Problem Scenarios
        </span>
      </div>
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setTopic('thrashing')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: topic === 'thrashing' ? '1px solid #f87171' : '1px solid rgba(255,255,255,0.1)', backgroundColor: topic === 'thrashing' ? 'rgba(248, 113, 113, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>Memory Thrashing</button>
          <button onClick={() => setTopic('context')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: topic === 'context' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', backgroundColor: topic === 'context' ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>Context Switch Cost</button>
          <button onClick={() => setTopic('zombie')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: topic === 'zombie' ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)', backgroundColor: topic === 'zombie' ? 'rgba(251, 191, 36, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>Zombie Process</button>
        </div>
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {topic === 'thrashing' && <p style={{ margin: 0, fontSize: '12px', color: '#f87171' }}>Thrashing occurs when active working set exceeds RAM capacity. System spends majority of CPU cycles handling page faults rather than executing code.</p>}
          {topic === 'context' && <p style={{ margin: 0, fontSize: '12px', color: '#38bdf8' }}>Context switch involves saving/restoring CPU registers, stack pointers, and invalidating TLB cache lines (~1–5µs cost).</p>}
          {topic === 'zombie' && <p style={{ margin: 0, fontSize: '12px', color: '#fbbf24' }}>Zombie process has terminated but its entry remains in PCB process table because parent hasn't reaped exit status via waitpid().</p>}
        </div>
      </div>
    </div>
  );
}