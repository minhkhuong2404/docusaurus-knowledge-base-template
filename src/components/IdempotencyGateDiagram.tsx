import React, { useState } from 'react';

export default function IdempotencyGateDiagram() {
  const [useIdempotencyKey, setUseIdempotencyKey] = useState<boolean>(true);
  const [activeStep, setActiveStep] = useState<number>(1);

  const stepsWithoutKey = [
    { step: 1, title: 'Initial Request', text: 'Client sends POST /payments ($100 charge request)', color: '#38bdf8' },
    { step: 2, title: 'Server Processing', text: 'Server executes payment with Payment Gateway ($100 charged)', color: '#34d399' },
    { step: 3, title: 'Network Drop', text: '5000ms response timeout due to network packet drop', color: '#fbbf24' },
    { step: 4, title: 'Unsafe Retry #2', text: 'Client retries POST /payments without key. Server processes AGAIN ($100 charged AGAIN)', color: '#f87171' },
    { step: 5, title: 'Double Charge Outcome', text: 'Customer was double-charged $200 for a single checkout attempt!', color: '#f87171' },
  ];

  const stepsWithKey = [
    { step: 1, title: 'Initial Request with Key', text: 'Client sends POST /payments (Header: Idempotency-Key: ik_99a)', color: '#38bdf8' },
    { step: 2, title: 'Server Check & Execute', text: 'Server checks Redis (Miss) -> Charges $100 -> Caches ik_99a in Redis', color: '#34d399' },
    { step: 3, title: 'Network Drop', text: '5000ms response timeout due to network packet drop', color: '#fbbf24' },
    { step: 4, title: 'Safe Retry #2 with Key', text: 'Client retries with SAME Idempotency-Key: ik_99a', color: '#38bdf8' },
    { step: 5, title: 'Cache Hit & Replay', text: 'Server checks Redis (Hit!) -> Returns cached response instantly. $100 charged ONCE!', color: '#34d399' },
  ];

  const currentSteps = useIdempotencyKey ? stepsWithKey : stepsWithoutKey;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span>Idempotency Safety Gate</span>

        {/* Mode Selector */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button onClick={() => { setUseIdempotencyKey(false); setActiveStep(1); }} style={{
            padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '12px',
            background: !useIdempotencyKey ? '#f8717118' : 'rgba(255,255,255,0.04)',
            color: !useIdempotencyKey ? '#f87171' : 'var(--ifm-color-content-secondary)',
            boxShadow: !useIdempotencyKey ? '0 0 0 1.5px #f8717150' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}>
            No Key (Double Charge ❌)
          </button>
          <button onClick={() => { setUseIdempotencyKey(true); setActiveStep(1); }} style={{
            padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '12px',
            background: useIdempotencyKey ? '#34d39918' : 'rgba(255,255,255,0.04)',
            color: useIdempotencyKey ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: useIdempotencyKey ? '0 0 0 1.5px #34d39950' : '0 0 0 1px rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease',
          }}>
            With Idempotency Key (Safe ✅)
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', alignItems: 'start' }} className="idem-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .idem-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* Step List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {currentSteps.map(s => {
            const isSelected = activeStep === s.step;
            return (
              <div key={s.step} onClick={() => setActiveStep(s.step)} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
                borderRadius: '8px', cursor: 'pointer',
                background: isSelected ? `${s.color}15` : 'rgba(255,255,255,0.03)',
                boxShadow: isSelected ? `0 0 0 1.5px ${s.color}50` : '0 0 0 1px rgba(255,255,255,0.06)',
                transition: 'all 0.2s ease'
              }}>
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%', background: `${s.color}20`,
                  color: s.color, fontWeight: 'bold', fontSize: '11px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {s.step}
                </div>
                <div style={{ fontSize: '12px', color: isSelected ? '#ffffff' : '#e2e8f0', fontWeight: isSelected ? 'bold' : 'normal' }}>
                  {s.title}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail Panel */}
        <div className="interactive-diagram-details-card" style={{ borderColor: `${currentSteps[activeStep - 1].color}40` }}>
          <div className="interactive-diagram-card-header">
            <h3 style={{ color: currentSteps[activeStep - 1].color }}>
              Step {activeStep}: {currentSteps[activeStep - 1].title}
            </h3>
          </div>

          <p style={{ fontSize: '13px', color: '#e2e8f0', marginTop: '10px' }}>
            {currentSteps[activeStep - 1].text}
          </p>

          <div style={{
            fontSize: '11.5px', marginTop: '14px', padding: '10px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <strong>Rule:</strong> Never retry non-idempotent operations (POST) without propagating an <code>Idempotency-Key</code> header.
          </div>
        </div>
      </div>
    </div>
  );
}
