import React, { useState, useEffect } from 'react';

interface Step {
  id: number;
  label: string;
  sender: string;
  receiver: string;
  color: string;
  durationMs: number;
  note: string;
}

const STEPS: Step[] = [
  { id: 1, label: 'GET /users/123/dashboard', sender: 'Client', receiver: 'API Composer', color: '#38bdf8', durationMs: 5, note: 'Incoming HTTP request' },
  { id: 2, label: 'Parallel Fan-Out (Virtual Threads)', sender: 'API Composer', receiver: 'User / Order / Loyalty Services', color: '#34d399', durationMs: 0, note: 'Concurrent asynchronous dispatch' },
  { id: 3, label: 'Loyalty Svc Response', sender: 'Loyalty Svc', receiver: 'API Composer', color: '#a78bfa', durationMs: 30, note: '30ms (Fastest)' },
  { id: 4, label: 'User Svc Response', sender: 'User Svc', receiver: 'API Composer', color: '#38bdf8', durationMs: 50, note: '50ms' },
  { id: 5, label: 'Order Svc Response', sender: 'Order Svc', receiver: 'API Composer', color: '#fbbf24', durationMs: 80, note: '80ms (Max bottleneck)' },
  { id: 6, label: 'Merge & Return JSON', sender: 'API Composer', receiver: 'Client', color: '#34d399', durationMs: 5, note: 'Total: 80ms (Parallel) vs 160ms (Sequential)' },
];

export default function ApiCompositionArchitectureDiagram() {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [playing, setPlaying] = useState<boolean>(false);

  useEffect(() => {
    if (!playing || activeStep === null) return;
    if (activeStep >= STEPS.length) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => {
      setActiveStep(s => (s !== null ? s + 1 : 1));
    }, 900);
    return () => clearTimeout(t);
  }, [playing, activeStep]);

  const handlePlay = () => {
    setActiveStep(1);
    setPlaying(true);
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
        <span>API Composition Parallel Fan-Out Architecture</span>
        <button
          onClick={handlePlay}
          disabled={playing}
          style={{
            marginLeft: 'auto', padding: '6px 14px', borderRadius: '8px',
            border: 'none', cursor: playing ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: '12px',
            background: playing ? 'rgba(255,255,255,0.06)' : 'rgba(56,189,248,0.15)',
            color: playing ? 'var(--ifm-color-content-secondary)' : '#38bdf8',
            boxShadow: playing ? 'none' : '0 0 0 1.5px rgba(56,189,248,0.4)',
            transition: 'all 0.2s ease',
          }}
        >
          {playing ? 'Playing Sequence…' : '▶ Animate Fan-Out'}
        </button>
      </div>

      {/* Latency Comparison Card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid #f87171', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#f87171', textTransform: 'uppercase' }}>Sequential Fetching (Blocking)</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#f87171', marginTop: '4px' }}>50ms + 80ms + 30ms = 160ms</div>
          <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>High latency, blocking threads</div>
        </div>

        <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid #34d399', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase' }}>Parallel Fan-Out (API Composition)</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>max(50ms, 80ms, 30ms) = 80ms</div>
          <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>50% latency reduction via Virtual Threads</div>
        </div>
      </div>

      {/* Sequence Timeline */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '18px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {STEPS.map(s => {
            const isActive = activeStep !== null && s.id <= activeStep;
            return (
              <div
                key={s.id}
                onClick={() => setActiveStep(s.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: '12px',
                  padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                  background: isActive ? `${s.color}15` : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${isActive ? s.color : 'rgba(255,255,255,0.08)'}`,
                  opacity: activeStep === null || isActive ? 1 : 0.35,
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{ minWidth: '24px', height: '24px', borderRadius: '50%', background: s.color, color: '#000', fontWeight: 800, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {s.id}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>
                    {s.sender} → {s.receiver}: {s.label}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                    {s.note}
                  </div>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: s.color, fontFamily: 'monospace' }}>
                  {s.durationMs > 0 ? `${s.durationMs}ms` : 'Async'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
        <strong>Key takeaway:</strong> In API Composition, parallel fan-out reduces request latency to the single slowest downstream dependency. Using Java 21 Virtual Threads (<code>Executors.newVirtualThreadPerTaskExecutor()</code>) keeps thread context switching overhead practically zero.
      </div>
    </div>
  );
}
