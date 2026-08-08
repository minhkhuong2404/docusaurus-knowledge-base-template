import React, { useState } from 'react';

interface SeqStep {
  step: number;
  title: string;
  sender: string;
  receiver: string;
  coordState: string;
  partState: string;
  action: string;
  color: string;
}

const SEQ_STEPS: SeqStep[] = [
  { step: 1, title: '1. Phase 1: Send PREPARE', sender: 'Coordinator', receiver: 'Node A & Node B', coordState: 'PREPARING', partState: 'INIT ➔ PREPARING', action: 'Coordinator sends PREPARE message to all participants.', color: '#38bdf8' },
  { step: 2, title: '2. Write PREPARE WAL & Vote YES', sender: 'Node A & Node B', receiver: 'Coordinator', coordState: 'PREPARING', partState: 'PREPARED', action: 'Participants write PREPARE record to local WAL, hold row locks, and reply YES.', color: '#fbbf24' },
  { step: 3, title: '3. Phase 2: Log COMMIT & Send COMMIT', sender: 'Coordinator', receiver: 'Node A & Node B', coordState: 'COMMITTING', partState: 'PREPARED', action: 'Coordinator writes COMMIT record to its WAL, transitions to COMMITTING, sends COMMIT message.', color: '#a78bfa' },
  { step: 4, title: '4. Execute Commit & Return ACK', sender: 'Node A & Node B', receiver: 'Coordinator', coordState: 'FINISHED', partState: 'COMMITTED', action: 'Participants commit changes locally, release row locks, and return ACK. Transaction completes!', color: '#34d399' },
];

export default function Acid2PcSequenceStateMachineDiagram(): React.JSX.Element {
  const [activeStepIdx, setActiveStepIdx] = useState(0);

  const current = SEQ_STEPS[activeStepIdx];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .twopc-seq-grid { grid-template-columns: 1fr !important; } }`}</style>

      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          2PC Protocol State Machine & Message Sequence Stepper
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="twopc-seq-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
          
          {/* Left: Sequence Steps Selector */}
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', marginBottom: '10px' }}>
              Protocol Message Sequence
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {SEQ_STEPS.map((s, idx) => {
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
                      <div style={{ fontSize: '9.5px', color: 'var(--ifm-color-content-secondary)' }}>{s.sender} ➔ {s.receiver}</div>
                    </div>
                    <span style={{ fontSize: '12px', color: s.color, fontWeight: 700 }}>➔</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: State Inspector Card */}
          <div className={`interactive-diagram-details-card details-${activeStepIdx === 0 ? 'blue' : activeStepIdx === 1 ? 'yellow' : activeStepIdx === 2 ? 'purple' : 'green'}`} style={{ minHeight: '210px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: current.color, textTransform: 'uppercase', marginBottom: '2px' }}>
              Message {current.step} of 4
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '8px' }}>
              {current.title}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10.5px', marginBottom: '10px' }}>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '6px', borderRadius: '4px' }}>
                <span style={{ color: 'var(--ifm-color-content-secondary)' }}>Coordinator State: </span>
                <strong style={{ color: current.color }}>{current.coordState}</strong>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '6px', borderRadius: '4px' }}>
                <span style={{ color: 'var(--ifm-color-content-secondary)' }}>Participant State: </span>
                <strong style={{ color: 'var(--ifm-color-content)' }}>{current.partState}</strong>
              </div>
            </div>

            <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 10px', lineHeight: 1.5 }}>
              {current.action}
            </p>

            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: '6px', fontSize: '10.5px' }}>
              <span style={{ color: 'var(--ifm-color-content-secondary)' }}>Durability Status: </span>
              <strong style={{ color: current.color }}>
                {activeStepIdx >= 2 ? 'Global Commit Decision Flushed to Coordinator Log' : 'In-Flight Prepared Locks Held'}
              </strong>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
