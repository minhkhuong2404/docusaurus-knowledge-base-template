import React, { useState } from 'react';

export default function FixedWindowSpikeDiagram() {
  const [step, setStep] = useState<'idle' | 'w1' | 'spike'>('idle');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span>Fixed Window Boundary Spike (2x Limit Vulnerability)</span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setStep('w1')} style={{
            padding: '4px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '11px',
            background: step === 'w1' ? '#38bdf820' : 'rgba(255,255,255,0.04)',
            color: step === 'w1' ? '#38bdf8' : '#94a3b8'
          }}>
            1. Send 100 req at 00:59
          </button>
          <button onClick={() => setStep('spike')} style={{
            padding: '4px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '11px',
            background: step === 'spike' ? '#f8717120' : 'rgba(255,255,255,0.04)',
            color: step === 'spike' ? '#f87171' : '#94a3b8'
          }}>
            2. Send 100 req at 01:01 🚨
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'center' }} className="spike-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .spike-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* Windows Visualization */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Window 1 */}
          <div style={{
            flex: 1, padding: '10px', borderRadius: '8px',
            background: step !== 'idle' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255,255,255,0.02)',
            border: step !== 'idle' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.06)'
          }}>
            <strong style={{ fontSize: '11px', color: '#38bdf8' }}>Window 1 [00:00 - 01:00]</strong>
            <div style={{ fontSize: '12px', marginTop: '6px', color: '#e2e8f0' }}>
              Counter: <strong>{step === 'idle' ? 0 : 100} / 100</strong>
            </div>
            <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '4px' }}>
              {step !== 'idle' ? '100 reqs at 00:59 (Passed ✓)' : 'Idle'}
            </div>
          </div>

          {/* Window 2 */}
          <div style={{
            flex: 1, padding: '10px', borderRadius: '8px',
            background: step === 'spike' ? 'rgba(248, 113, 113, 0.15)' : 'rgba(255,255,255,0.02)',
            border: step === 'spike' ? '1px solid #f87171' : '1px solid rgba(255,255,255,0.06)'
          }}>
            <strong style={{ fontSize: '11px', color: step === 'spike' ? '#f87171' : '#94a3b8' }}>Window 2 [01:00 - 02:00]</strong>
            <div style={{ fontSize: '12px', marginTop: '6px', color: '#e2e8f0' }}>
              Counter: <strong>{step === 'spike' ? 100 : 0} / 100</strong>
            </div>
            <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '4px' }}>
              {step === 'spike' ? 'Counter reset! 100 reqs at 01:01 (Passed ✓)' : 'Idle'}
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="interactive-diagram-details-card" style={{ borderColor: step === 'spike' ? '#f8717140' : '#38bdf840' }}>
          <h4 style={{ color: step === 'spike' ? '#f87171' : '#38bdf8', margin: '0 0 4px 0', fontSize: '13px' }}>
            {step === 'spike' ? '🚨 2x Boundary Spike Detected!' : 'Fixed Window Counter State'}
          </h4>
          <p style={{ fontSize: '12px', color: '#e2e8f0', margin: 0 }}>
            {step === 'idle' && 'Click the buttons above to simulate sending 100 requests right before and after a window boundary.'}
            {step === 'w1' && 'Window 1 receives 100 requests at 00:59. Counter reaches 100/100 and passes.'}
            {step === 'spike' && 'Between 00:59 and 01:01 (a 2-second span), the server processed 200 requests! Fixed Window resets counter at 01:00, completely missing the 2x burst spike.'}
          </p>
        </div>
      </div>
    </div>
  );
}
