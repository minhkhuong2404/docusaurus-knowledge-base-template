const fs = require('fs');
const path = require('path');

const osComponents = [
  {
    file: 'src/components/OsOverviewDiagram.tsx',
    code: `import React, { useState } from 'react';

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
}`
  },
  {
    file: 'src/components/OsCpuSchedulingDiagram.tsx',
    code: `import React, { useState } from 'react';

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
}`
  },
  {
    file: 'src/components/OsProcessesThreadsDiagram.tsx',
    code: `import React, { useState } from 'react';

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
}`
  },
  {
    file: 'src/components/OsMemoryManagementDiagram.tsx',
    code: `import React, { useState } from 'react';

export default function OsMemoryManagementDiagram(): React.JSX.Element {
  const [tlbHit, setTlbHit] = useState<boolean>(true);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          MMU Virtual-to-Physical Address Translation &amp; TLB Cache
        </span>
      </div>
      <div style={{ padding: '16px' }}>
        <button onClick={() => setTlbHit(!tlbHit)} style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: tlbHit ? '#34d399' : '#fbbf24', color: '#000', fontWeight: 700, border: 'none', cursor: 'pointer', marginBottom: '16px' }}>
          {tlbHit ? 'Simulate TLB HIT (1ns Translation)' : 'Simulate TLB MISS (Page Table Walk: 30ns)'}
        </button>
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: tlbHit ? '#34d399' : '#fbbf24', marginBottom: '4px' }}>
            {tlbHit ? '⚡ TLB HIT' : '🐢 TLB MISS'}
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content)' }}>
            {tlbHit ? 'Virtual Page Number (VPN) found in hardware TLB cache. Instantly mapped to Physical Frame Number (PFN).' : 'VPN not in TLB. MMU must walk multi-level Page Table in RAM, incurring latency penalty before caching entry.'}
          </p>
        </div>
      </div>
    </div>
  );
}`
  },
  {
    file: 'src/components/OsVirtualMemoryDiagram.tsx',
    code: `import React, { useState } from 'react';

export default function OsVirtualMemoryDiagram(): React.JSX.Element {
  const [pageFault, setPageFault] = useState<boolean>(false);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Virtual Memory Demand Paging &amp; Page Fault Trap Flow
        </span>
      </div>
      <div style={{ padding: '16px' }}>
        <button onClick={() => setPageFault(!pageFault)} style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: pageFault ? '#f87171' : '#34d399', color: '#000', fontWeight: 700, border: 'none', cursor: 'pointer', marginBottom: '16px' }}>
          {pageFault ? 'Simulate Page Fault Trap (Disk Fetch: 10ms)' : 'Simulate Valid Page in RAM (Present Bit = 1)'}
        </button>
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: pageFault ? '#f87171' : '#34d399', marginBottom: '4px' }}>
            {pageFault ? '⚠️ PAGE FAULT TRAP' : '✅ PAGE PRESENT IN RAM'}
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content)' }}>
            {pageFault ? 'Present Bit = 0. CPU triggers hardware trap to OS kernel. Kernel suspends process, reads page from Swap/Disk into free frame, updates Page Table, and restarts instruction.' : 'Present Bit = 1. Address translated directly to RAM frame without OS kernel intervention.'}
          </p>
        </div>
      </div>
    </div>
  );
}`
  },
  {
    file: 'src/components/OsSyncDeadlockDiagram.tsx',
    code: `import React, { useState } from 'react';

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
}`
  },
  {
    file: 'src/components/OsLinuxSyscallsDiagram.tsx',
    code: `import React, { useState } from 'react';

export default function OsLinuxSyscallsDiagram(): React.JSX.Element {
  const [space, setSpace] = useState<'user' | 'kernel'>('user');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          User Space (Ring 3) to Kernel Space (Ring 0) Syscall Flow
        </span>
      </div>
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setSpace('user')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: space === 'user' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', backgroundColor: space === 'user' ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>Ring 3 User Space (read(), write())</button>
          <button onClick={() => setSpace('kernel')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: space === 'kernel' ? '1px solid #a78bfa' : '1px solid rgba(255,255,255,0.1)', backgroundColor: space === 'kernel' ? 'rgba(167, 139, 250, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>Ring 0 Kernel Space (Syscall Handler Table)</button>
        </div>
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {space === 'user' && <p style={{ margin: 0, fontSize: '12px', color: '#38bdf8' }}>User Space: Application executes in Ring 3 with restricted hardware access. Invokes C library wrapper (glibc).</p>}
          {space === 'kernel' && <p style={{ margin: 0, fontSize: '12px', color: '#a78bfa' }}>Kernel Space: CPU transitions to Ring 0 via syscall assembly instruction. Executes kernel function from sys_call_table and returns result.</p>}
        </div>
      </div>
    </div>
  );
}`
  },
  {
    file: 'src/components/OsFileSystemsIoDiagram.tsx',
    code: `import React, { useState } from 'react';

export default function OsFileSystemsIoDiagram(): React.JSX.Element {
  const [component, setComponent] = useState<'vfs' | 'inode' | 'fd'>('vfs');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Virtual File System (VFS), Inode Table &amp; File Descriptors
        </span>
      </div>
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setComponent('vfs')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: component === 'vfs' ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)', backgroundColor: component === 'vfs' ? 'rgba(251, 191, 36, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>VFS Abstraction</button>
          <button onClick={() => setComponent('inode')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: component === 'inode' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)', backgroundColor: component === 'inode' ? 'rgba(52, 211, 153, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>Inode Metadata Structure</button>
          <button onClick={() => setComponent('fd')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: component === 'fd' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', backgroundColor: component === 'fd' ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>File Descriptor Map</button>
        </div>
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {component === 'vfs' && <p style={{ margin: 0, fontSize: '12px', color: '#fbbf24' }}>VFS provides unified API (open, read, write) across ext4, XFS, NFS, and pseudofs (/proc, /sys).</p>}
          {component === 'inode' && <p style={{ margin: 0, fontSize: '12px', color: '#34d399' }}>Inode stores file size, permissions, owner UID, timestamps, and data block pointers. Filename is stored in Directory Entry (dentry).</p>}
          {component === 'fd' && <p style={{ margin: 0, fontSize: '12px', color: '#38bdf8' }}>Per-process File Descriptor table maps integer FDs (0=stdin, 1=stdout, 2=stderr) to open file table entries in system memory.</p>}
        </div>
      </div>
    </div>
  );
}`
  },
  {
    file: 'src/components/OsIpcNetworkingDiagram.tsx',
    code: `import React, { useState } from 'react';

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
}`
  },
  {
    file: 'src/components/OsInterviewScenariosDiagram.tsx',
    code: `import React, { useState } from 'react';

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
}`
  }
];

osComponents.forEach(c => {
  fs.writeFileSync(c.file, c.code, 'utf8');
  console.log(`Created ${c.file}`);
});
