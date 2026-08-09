import React, { useState } from 'react';

interface LifecycleStep {
  step: number;
  title: string;
  target: string;
  desc: string;
  isDurable: boolean;
  color: string;
}

const LIFECYCLE_STEPS: LifecycleStep[] = [
  { step: 1, title: '1. Write WAL Log Record', target: 'WAL Buffer (User RAM)', desc: 'Transaction constructs binary log record in wal_buffers assigned next LSN offset.', isDurable: false, color: '#38bdf8' },
  { step: 2, title: '2. Synchronous fsync() Flush', target: 'Physical WAL File (pg_wal)', desc: 'Engine calls fsync(fd) flushing OS Page Cache directly to non-volatile disk.', isDurable: true, color: '#fbbf24' },
  { step: 3, title: '3. Mark Buffer Pool Page Dirty', target: 'Buffer Pool (Shared RAM)', desc: 'Data page modified in Buffer Pool RAM and tagged with page_lsn.', isDurable: true, color: '#a78bfa' },
  { step: 4, title: '4. Return COMMIT SUCCESS', target: 'Application Client', desc: 'Client receives COMMIT response. Durability is achieved because WAL is safely on disk.', isDurable: true, color: '#34d399' },
  { step: 5, title: '5. Asynchronous Checkpoint', target: 'Physical Data Files (.ibd)', desc: 'Background Checkpointer daemon periodically flushes dirty pages (page_lsn <= flushed LSN) to storage.', isDurable: true, color: '#2dd4bf' },
];

export default function AcidWalWritePathLifecycleDiagram(): React.JSX.Element {
  const [activeStepIdx, setActiveStepIdx] = useState(0);

  const step = LIFECYCLE_STEPS[activeStepIdx];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .lifecycle-grid { grid-template-columns: 1fr !important; } }`}</style>

      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          5-Step End-to-End Write Path Lifecycle Visualizer
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="lifecycle-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
          
          {/* Left: 5-Step Buttons List */}
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '10px' }}>
              Execution Lifecycle Sequence (Click Step)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {LIFECYCLE_STEPS.map((s, idx) => {
                const isSel = activeStepIdx === idx;
                return (
                  <button
                    key={s.step}
                    onClick={() => setActiveStepIdx(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      background: isSel ? `${s.color}20` : 'rgba(255,255,255,0.03)',
                      boxShadow: isSel ? `0 0 0 1.5px ${s.color}` : '0 0 0 1px rgba(255,255,255,0.08)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 700, color: isSel ? s.color : 'var(--ifm-color-content)' }}>{s.title}</div>
                      <div style={{ fontSize: '9.5px', color: 'var(--ifm-color-content-secondary)' }}>Target: {s.target}</div>
                    </div>
                    <span style={{ fontSize: '12px', color: s.color, fontWeight: 700 }}>➔</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Step Description & Durability State */}
          <div className={`interactive-diagram-details-card details-${activeStepIdx === 0 ? 'blue' : activeStepIdx === 1 ? 'yellow' : activeStepIdx === 2 ? 'purple' : activeStepIdx === 3 ? 'green' : 'cyan'}`} style={{ minHeight: '200px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: step.color, textTransform: 'uppercase', marginBottom: '2px' }}>
              Stage {step.step} of 5 — {step.target}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '8px' }}>
              {step.title}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 12px', lineHeight: 1.6 }}>
              {step.desc}
            </p>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: '6px', fontSize: '11px' }}>
              <span style={{ color: 'var(--ifm-color-content-secondary)' }}>Durability Guarantee: </span>
              <strong style={{ color: step.isDurable ? '#34d399' : '#fbbf24' }}>
                {step.isDurable ? '✓ DURABLE (Flushed via fsync)' : '⏳ VOLATILE (In RAM Cache)'}
              </strong>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
