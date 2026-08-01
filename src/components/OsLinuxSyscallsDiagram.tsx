import React, { useState } from 'react';

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
}