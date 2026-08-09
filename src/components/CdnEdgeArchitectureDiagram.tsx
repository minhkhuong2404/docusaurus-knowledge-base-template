import React, { useState } from 'react';

export default function CdnEdgeArchitectureDiagram(): React.JSX.Element {
  const [cached, setCached] = useState<boolean>(true);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          CDN Anycast Edge PoP &amp; Origin Shield Architecture
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
            Request Status at Local Edge PoP (Singapore):
          </div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: cached ? '#34d399' : '#fbbf24' }}>
            {cached ? '⚡ EDGE HIT (Served in 5ms directly from local Edge RAM cache)' : '🐢 EDGE MISS (Origin Fetch: 180ms round-trip to US-East Origin Server)'}
          </div>
        </div>

        <button
          onClick={() => setCached(!cached)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '6px',
            backgroundColor: cached ? '#34d399' : '#fbbf24',
            color: '#000',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {cached ? 'Simulate Cache Expiration (Cache MISS)' : 'Simulate Warm Cache (Cache HIT)'}
        </button>
      </div>
    </div>
  );
}
