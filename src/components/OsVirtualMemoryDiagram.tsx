import React, { useState } from 'react';

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
}