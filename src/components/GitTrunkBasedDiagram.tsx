import React, { useState } from 'react';

export default function GitTrunkBasedDiagram(): React.JSX.Element {
  const [featureFlag, setFeatureFlag] = useState<boolean>(false);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Trunk-Based Development & Feature Flag Toggle Router
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ backgroundColor: '#0c0e17', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
            Single Shared `main` Branch (Trunk):
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)' }}>
            Developers merge short-lived feature branches (&lt;1 day old) directly into `main` multiple times daily.
          </div>
        </div>

        <button
          onClick={() => setFeatureFlag(!featureFlag)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '6px',
            backgroundColor: featureFlag ? '#34d399' : '#0c0e17',
            color: featureFlag ? '#000' : '#fff',
            fontWeight: 700,
            border: '1px solid #34d399',
            cursor: 'pointer',
          }}
        >
          {featureFlag ? 'FEATURE FLAG: ENABLED (Deployed to Production)' : 'FEATURE FLAG: DISABLED (Code merged safely in main behind flag)'}
        </button>
      </div>
    </div>
  );
}
