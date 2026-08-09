import React, { useState } from 'react';

export default function BlueGreenDeploymentDiagram() {
  const [activeEnv, setActiveEnv] = useState<'blue' | 'green'>('blue');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
        <span>Blue-Green Zero-Downtime Deployment Simulator</span>
        <button
          onClick={() => setActiveEnv(activeEnv === 'blue' ? 'green' : 'blue')}
          style={{
            marginLeft: 'auto', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer',
            fontWeight: 700, fontSize: '11.5px',
            background: activeEnv === 'blue' ? 'rgba(52,211,153,0.2)' : 'rgba(56,189,248,0.2)',
            color: activeEnv === 'blue' ? '#34d399' : '#38bdf8',
            border: `1px solid ${activeEnv === 'blue' ? '#34d399' : '#38bdf8'}`,
          }}
        >
          {activeEnv === 'blue' ? 'Switch Traffic to Green (v2)' : 'Rollback to Blue (v1)'}
        </button>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '20px', borderRadius: '12px', marginBottom: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 200px', gap: '16px', alignItems: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>Router / Service Selector</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>K8s Service selector</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: activeEnv === 'blue' ? '#38bdf8' : '#34d399' }}>
              100% Traffic → {activeEnv.toUpperCase()}
            </div>
            <div style={{ height: '3px', background: activeEnv === 'blue' ? '#38bdf8' : '#34d399', width: '100%', marginTop: '6px', borderRadius: '2px' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{
              background: activeEnv === 'blue' ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.02)',
              border: `1.5px solid ${activeEnv === 'blue' ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
              padding: '10px 14px', borderRadius: '8px',
              opacity: activeEnv === 'blue' ? 1 : 0.4,
              transition: 'all 0.3s ease',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>Blue Environment (v1.0)</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Status: {activeEnv === 'blue' ? 'Active Production' : 'Idle / Standby'}</div>
            </div>

            <div style={{
              background: activeEnv === 'green' ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.02)',
              border: `1.5px solid ${activeEnv === 'green' ? '#34d399' : 'rgba(255,255,255,0.1)'}`,
              padding: '10px 14px', borderRadius: '8px',
              opacity: activeEnv === 'green' ? 1 : 0.4,
              transition: 'all 0.3s ease',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#34d399' }}>Green Environment (v2.0)</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Status: {activeEnv === 'green' ? 'Active Production' : 'Testing / Standby'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
