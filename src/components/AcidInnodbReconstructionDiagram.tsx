import React, { useState } from 'react';

interface ReconStep {
  id: number;
  title: string;
  location: string;
  data: string;
  trxId: number;
  isVisible: boolean;
  explanation: string;
  color: string;
}

const RECON_STEPS: ReconStep[] = [
  { id: 1, title: '1. Read Clustered Index Leaf Page', location: 'Buffer Pool Page', data: 'balance = 400', trxId: 200, isVisible: false, explanation: 'InnoDB reads the latest tuple directly from the clustered index leaf page. DB_TRX_ID is 200.', color: '#f97316' },
  { id: 2, title: '2. Evaluate ReadView Visibility', location: 'ReadView Checker', data: 'balance = 400 (Invisible)', trxId: 200, isVisible: false, explanation: 'DB_TRX_ID (200) >= m_low_limit_id (200). Tuple is uncommitted/future to this snapshot. Must follow DB_ROLL_PTR.', color: '#fbbf24' },
  { id: 3, title: '3. Follow DB_ROLL_PTR to Undo Log', location: 'Rollback Segment', data: 'Undo Rec #1: balance=500, DB_TRX_ID=150', trxId: 150, isVisible: false, explanation: 'InnoDB follows DB_ROLL_PTR (0x7f4a01) to read before-image delta in the rollback segment.', color: '#38bdf8' },
  { id: 4, title: '4. Re-evaluate ReadView & Reconstruct', location: 'In-Memory Reconstruction', data: 'balance = 500 (Visible!)', trxId: 150, isVisible: true, explanation: 'DB_TRX_ID (150) < m_high_limit_id (160). Undo delta applied in memory. Reconstructed historical tuple (balance=500) is returned to query!', color: '#34d399' },
];

export default function AcidInnodbReconstructionDiagram(): React.JSX.Element {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  const step = RECON_STEPS[currentStepIdx];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .recon-grid { grid-template-columns: 1fr !important; } }`}</style>

      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          InnoDB Historical Version Reconstruction Stepper
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="recon-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
          
          {/* Left: Stepper Flow List */}
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '10px' }}>
              Reconstruction Algorithm Execution Sequence
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {RECON_STEPS.map((s, idx) => {
                const isSel = currentStepIdx === idx;
                return (
                  <button
                    key={s.id}
                    onClick={() => setCurrentStepIdx(idx)}
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
                      <div style={{ fontSize: '9.5px', color: 'var(--ifm-color-content-secondary)' }}>Target: {s.location}</div>
                    </div>
                    <span style={{ fontSize: '12px', color: s.color, fontWeight: 700 }}>➔</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Step Details & Result */}
          <div className={`interactive-diagram-details-card details-${step.isVisible ? 'green' : 'yellow'}`} style={{ minHeight: '200px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: step.color, textTransform: 'uppercase', marginBottom: '2px' }}>
              Execution Step {step.id} of 4
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '6px' }}>
              {step.title}
            </div>
            <div style={{ fontSize: '11px', background: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: '4px', marginBottom: '10px' }}>
              Active Data Payload: <code style={{ color: step.color }}>{step.data}</code> (Trx #{step.trxId})
            </div>
            <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 10px', lineHeight: 1.5 }}>
              {step.explanation}
            </p>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: '6px', fontSize: '10.5px' }}>
              <span style={{ color: 'var(--ifm-color-content-secondary)' }}>Snapshot Status: </span>
              <strong style={{ color: step.isVisible ? '#34d399' : '#fbbf24' }}>
                {step.isVisible ? '✓ Tuple Reconstructed & Returned to Client' : '⏳ Inspecting Next Pointer in Chain'}
              </strong>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
