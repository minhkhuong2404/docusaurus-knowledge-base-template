import React, { useState } from 'react';

export default function CanaryDeploymentDiagram() {
  const [canaryPct, setCanaryPct] = useState<number>(10);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span>Canary Release Traffic Split Simulator</span>
        <button
          onClick={() => setCanaryPct(0)}
          style={{
            marginLeft: 'auto', padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '11px', background: 'rgba(248,113,113,0.2)', color: '#f87171', border: '1px solid #f87171',
          }}
        >
          Emergency Abort (0%)
        </button>
      </div>

      {/* Traffic Control Slider */}
      <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '10px', marginBottom: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', fontWeight: 700 }}>
          <span style={{ color: '#38bdf8' }}>v1 Stable: {100 - canaryPct}%</span>
          <span style={{ color: '#fbbf24' }}>v2 Canary: {canaryPct}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={canaryPct}
          onChange={e => setCanaryPct(Number(e.target.value))}
          style={{ width: '100%', cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
          {[5, 10, 25, 50, 100].map(val => (
            <button
              key={val}
              onClick={() => setCanaryPct(val)}
              style={{
                padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                fontSize: '11px', fontWeight: 700,
                background: canaryPct === val ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.04)',
                color: canaryPct === val ? '#fbbf24' : 'var(--ifm-color-content-secondary)',
                border: canaryPct === val ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              Set {val}%
            </button>
          ))}
        </div>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '16px', borderRadius: '12px', marginBottom: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ background: 'rgba(56,189,248,0.1)', border: '1.5px solid #38bdf8', padding: '12px', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>Production Baseline (v1)</div>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>Receiving {100 - canaryPct}% of real user traffic. Zero errors reported.</div>
          </div>
          <div style={{ background: canaryPct > 0 ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.02)', border: `1.5px solid ${canaryPct > 0 ? '#fbbf24' : 'rgba(255,255,255,0.1)'}`, padding: '12px', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: canaryPct > 0 ? '#fbbf24' : 'var(--ifm-color-content-secondary)' }}>Canary (v2)</div>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>
              {canaryPct > 0 ? `Receiving ${canaryPct}% traffic. Active automated metric analysis (latency & error budget).` : 'Idle / Inactive.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
