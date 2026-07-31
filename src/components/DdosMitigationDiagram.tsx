import React, { useState } from 'react';

export default function DdosMitigationDiagram(): React.JSX.Element {
  const [mitigation, setMitigation] = useState<boolean>(true);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          DDoS Mitigation Architecture: Scrubbing Center &amp; Anycast Routing
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
            500 Gbps Volumetric SYN Flood Attack Vector:
          </div>
          <div style={{ fontSize: '12.5px', color: mitigation ? '#34d399' : '#f87171', fontWeight: 700 }}>
            {mitigation ? '✅ Anycast BGP Scrubbing Center absorbs 500 Gbps attack traffic, filtering SYN cookies before forwarding clean traffic to Origin.' : '❌ Origin server crashes under connection backlog exhaustion!'}
          </div>
        </div>

        <button
          onClick={() => setMitigation(!mitigation)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '6px',
            backgroundColor: mitigation ? '#34d399' : '#f87171',
            color: '#000',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {mitigation ? 'Scrubbing Center ACTIVE (Click to Disable Defense)' : 'Scrubbing Center DISABLED (Click to Enable Defense)'}
        </button>
      </div>
    </div>
  );
}
