import React, { useState } from 'react';

export default function OsOverviewDiagram(): React.JSX.Element {
  const [subsystem, setSubsystem] = useState<'cpu' | 'memory' | 'fs' | 'process'>('cpu');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Operating System Subsystems &amp; Kernel Architecture Explorer
        </span>
      </div>
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '16px' }}>
          <button onClick={() => setSubsystem('cpu')} style={{ padding: '8px 4px', borderRadius: '6px', border: subsystem === 'cpu' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', backgroundColor: subsystem === 'cpu' ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>CPU Scheduler</button>
          <button onClick={() => setSubsystem('memory')} style={{ padding: '8px 4px', borderRadius: '6px', border: subsystem === 'memory' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)', backgroundColor: subsystem === 'memory' ? 'rgba(52, 211, 153, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>Virtual Memory</button>
          <button onClick={() => setSubsystem('fs')} style={{ padding: '8px 4px', borderRadius: '6px', border: subsystem === 'fs' ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)', backgroundColor: subsystem === 'fs' ? 'rgba(251, 191, 36, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>File System (VFS)</button>
          <button onClick={() => setSubsystem('process')} style={{ padding: '8px 4px', borderRadius: '6px', border: subsystem === 'process' ? '1px solid #a78bfa' : '1px solid rgba(255,255,255,0.1)', backgroundColor: subsystem === 'process' ? 'rgba(167, 139, 250, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>IPC &amp; Signals</button>
        </div>
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {subsystem === 'cpu' && <p style={{ margin: 0, fontSize: '12px', color: '#38bdf8' }}>CPU Scheduler: Preemptive CFS (Completely Fair Scheduler), context switching, time slice allocation.</p>}
          {subsystem === 'memory' && <p style={{ margin: 0, fontSize: '12px', color: '#34d399' }}>Virtual Memory: Paging, MMU, TLB hardware caching, page faults, demand paging.</p>}
          {subsystem === 'fs' && <p style={{ margin: 0, fontSize: '12px', color: '#fbbf24' }}>VFS Layer: Abstract inode table, file descriptor maps, page cache, journaling.</p>}
          {subsystem === 'process' && <p style={{ margin: 0, fontSize: '12px', color: '#a78bfa' }}>IPC &amp; Signals: Pipes, Shared Memory (shmget), Unix Domain Sockets, Semaphore coordination.</p>}
        </div>
      </div>
    </div>
  );
}