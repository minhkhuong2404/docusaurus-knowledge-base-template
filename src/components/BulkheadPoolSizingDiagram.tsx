import React, { useState } from 'react';

export default function BulkheadPoolSizingDiagram() {
  const [rps, setRps] = useState<number>(100);
  const [latencyMs, setLatencyMs] = useState<number>(200);
  const [multiplier, setMultiplier] = useState<number>(1.5);

  const latencySec = latencyMs / 1000;
  const baseThreads = Math.ceil(rps * latencySec);
  const maxThreads = Math.ceil(baseThreads * multiplier);
  const coreThreads = Math.ceil(maxThreads / 2);
  const queueCap = maxThreads * 2;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
          <line x1="8" y1="6" x2="16" y2="6"/>
          <line x1="16" y1="14" x2="16" y2="18"/>
        </svg>
        <span>Little's Law Pool Sizing Calculator (L = λ × W)</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', alignItems: 'start' }} className="sizing-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .sizing-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* Sliders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span>Request Rate (λ):</span>
              <strong style={{ color: '#38bdf8' }}>{rps} RPS</strong>
            </div>
            <input type="range" min="10" max="500" step="10" value={rps} onChange={e => setRps(Number(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span>P99 Response Time (W):</span>
              <strong style={{ color: '#fbbf24' }}>{latencyMs}ms ({latencySec}s)</strong>
            </div>
            <input type="range" min="50" max="2000" step="50" value={latencyMs} onChange={e => setLatencyMs(Number(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span>Safety Multiplier:</span>
              <strong style={{ color: '#34d399' }}>{multiplier}x</strong>
            </div>
            <input type="range" min="1.1" max="2.5" step="0.1" value={multiplier} onChange={e => setMultiplier(Number(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
          </div>
        </div>

        {/* Computed Results Card */}
        <div className="interactive-diagram-details-card" style={{ borderColor: '#34d39940' }}>
          <div className="interactive-diagram-card-header">
            <h3 style={{ color: '#34d399' }}>Calculated Bulkhead Sizing</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '10px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span>Little's Law Base (L = λ × W):</span>
              <strong>{baseThreads} threads</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>maxThreadPoolSize:</span>
              <strong style={{ color: '#38bdf8' }}>{maxThreads} threads</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span>coreThreadPoolSize:</span>
              <strong>{coreThreads} threads</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>queueCapacity:</span>
              <strong style={{ color: '#fbbf24' }}>{queueCap} slots</strong>
            </div>
          </div>

          <div style={{
            fontSize: '11px', padding: '10px', borderRadius: '6px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
            marginTop: '8px'
          }}>
            <strong style={{ color: '#fbbf24' }}>Queue Sizing Golden Rule:</strong> Keep <code>queueCapacity</code> small (2× maxThreads). A giant queue converts fast failures into 30s slow failures!
          </div>
        </div>
      </div>
    </div>
  );
}
