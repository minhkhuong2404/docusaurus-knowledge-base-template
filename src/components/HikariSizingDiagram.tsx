import React, { useState } from 'react';

export default function HikariSizingDiagram(): React.JSX.Element {
  const [tn, setTn] = useState(16); // Concurrent threads doing DB work
  const [cm, setCm] = useState(1);  // Max simultaneous connections per thread
  const [cores, setCores] = useState(8); // CPU Cores
  const [spindles, setSpindles] = useState(1); // Spindles (effective spindles/disk seek capability)

  // Calculations
  const mathematicalPoolSize = tn * (cm - 1) + 1;
  const hardwarePoolSize = cores * 2 + spindles;

  // Decide if there is a warning
  const isOverpooled = hardwarePoolSize < 10 && mathematicalPoolSize > 50;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/>
        </svg>
        <span>HikariCP Connection Pool Sizing Calculator</span>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 767px) {
          .sizing-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />

      <div className="sizing-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '20px', alignItems: 'start' }}>
        {/* Left Side: Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Thread math sliders */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Formula: Tn × (Cm - 1) + 1
            </div>

            {/* Slider 1: Tn */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span>Concurrent DB Threads (Tn)</span>
                <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>{tn}</span>
              </div>
              <input
                type="range" min="1" max="100" value={tn}
                onChange={e => setTn(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8' }}
              />
            </div>

            {/* Slider 2: Cm */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span>Simultaneous Connections per Thread (Cm)</span>
                <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>{cm}</span>
              </div>
              <input
                type="range" min="1" max="5" value={cm}
                onChange={e => setCm(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8' }}
              />
              <span style={{ fontSize: '9.5px', color: 'var(--ifm-color-content-secondary)' }}>
                *Usually 1. Values &gt; 1 indicate nested transaction/queries in a single thread context.
              </span>
            </div>
          </div>

          {/* Hardware recommendations sliders */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#34d399', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Hardware Formula: (Cores × 2) + Spindles
            </div>

            {/* Slider 3: Cores */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span>CPU Cores (Database Server)</span>
                <span style={{ fontWeight: 'bold', color: '#34d399' }}>{cores}</span>
              </div>
              <input
                type="range" min="1" max="64" value={cores}
                onChange={e => setCores(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#34d399' }}
              />
            </div>

            {/* Slider 4: Spindles */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span>Effective Spindles / Disk factor</span>
                <span style={{ fontWeight: 'bold', color: '#34d399' }}>{spindles}</span>
              </div>
              <input
                type="range" min="0" max="16" value={spindles}
                onChange={e => setSpindles(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#34d399' }}
              />
              <span style={{ fontSize: '9.5px', color: 'var(--ifm-color-content-secondary)' }}>
                *Set to 1 or 0 for pure NVMe SSDs (minimal disk seek latency).
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Results Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Sizing Results */}
          <div className="interactive-diagram-details-card" style={{ borderColor: isOverpooled ? '#f87171' : '#38bdf8' }}>
            <div className="interactive-diagram-card-header" style={{ marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ifm-color-content)' }}>
                📊 Calculated Pool Sizing
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Formula Result */}
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', fontWeight: 600 }}>Thread-based (Deadlock Proof) Limit</span>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#38bdf8', marginTop: '4px' }}>
                  {mathematicalPoolSize} Connections
                </div>
              </div>

              {/* Hardware Result */}
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', fontWeight: 600 }}>Hardware Capacity Sizing</span>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#34d399', marginTop: '4px' }}>
                  {hardwarePoolSize} Connections
                </div>
              </div>

              {/* Warnings and Info */}
              {isOverpooled && (
                <div style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', padding: '10px', borderRadius: '6px', fontSize: '11px', color: '#f87171' }}>
                  ⚠️ **Over-pooling Risk:** Allocating {mathematicalPoolSize} connections exceeds the hardware capability ({hardwarePoolSize}). This will cause context-switching overhead on DB CPU cores and degrade query throughput.
                </div>
              )}

              {!isOverpooled && (
                <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', padding: '10px', borderRadius: '6px', fontSize: '11.5px', color: '#34d399' }}>
                  ✅ **Healthy Balance:** The pool sizing matches hardware capacity limits. This prevents connection wait queues while preserving optimal database process schedules.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '10px', fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', background: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
        💡 **Hikari Sizing Philosophy:** "More is not always better". A smaller connection pool matching CPU cores allows the database to process transactions in a highly serialized, cache-local manner, outperforming oversized pools which stall under thread scheduler contest.
      </div>
    </div>
  );
}
