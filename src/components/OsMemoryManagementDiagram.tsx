import React, { useState } from 'react';

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
}