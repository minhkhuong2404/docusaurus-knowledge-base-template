import React, { useState } from 'react';

export default function ApiCompositionDiagram() {
  const [activeStep, setActiveStep] = useState<number>(1);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
        </svg>
        <span>API Composition (Parallel Query Aggregation) Visualizer</span>
      </div>

      {/* Interactive Step Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[
          { step: 1, label: '1. Client Request' },
          { step: 2, label: '2. Parallel Fan-Out (CompletableFuture)' },
          { step: 3, label: '3. Response Merge & Timeout Safeguard' },
        ].map(s => (
          <button
            key={s.step}
            onClick={() => setActiveStep(s.step)}
            style={{
              flex: 1, padding: '8px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '11.5px', fontWeight: 700,
              background: activeStep === s.step ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.04)',
              color: activeStep === s.step ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
              boxShadow: activeStep === s.step ? '0 0 0 1.5px #38bdf8' : '0 0 0 1px rgba(255,255,255,0.08)',
              transition: 'all 0.2s ease',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '18px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 180px', gap: '14px', alignItems: 'center' }}>
          <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid #38bdf8', padding: '12px 8px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>Client / BFF</div>
            <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>GET /dashboard</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#34d399', marginBottom: '4px' }}>
              {activeStep === 1 ? 'GET /dashboard' : activeStep === 2 ? 'Parallel Async HTTP Requests' : 'Aggregated DTO Response (145ms)'}
            </div>
            <div style={{ height: '3px', background: '#34d399', width: '100%', borderRadius: '2px' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid #34d399', padding: '8px', borderRadius: '6px', fontSize: '11px', color: '#34d399', fontWeight: 700 }}>
              User Service (45ms)
            </div>
            <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid #fbbf24', padding: '8px', borderRadius: '6px', fontSize: '11px', color: '#fbbf24', fontWeight: 700 }}>
              Order Service (85ms)
            </div>
            <div style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid #a78bfa', padding: '8px', borderRadius: '6px', fontSize: '11px', color: '#a78bfa', fontWeight: 700 }}>
              Loyalty Service (30ms)
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
        <strong>API Composition:</strong> Queries are executed concurrently using non-blocking thread pools or <code>CompletableFuture.allOf()</code>. Total latency equals the slowest downstream service response (85ms) plus minimal JSON merging overhead.
      </div>
    </div>
  );
}
