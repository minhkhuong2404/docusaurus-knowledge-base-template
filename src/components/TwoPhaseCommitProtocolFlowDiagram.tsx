import React, { useState } from 'react';

type FlowMode = 'commit' | 'abort' | 'in-doubt';

interface PhaseStep {
  phase: string;
  actor: string;
  action: string;
  status: 'SUCCESS' | 'WARNING' | 'DANGER';
  detail: string;
}

interface FlowData {
  id: FlowMode;
  title: string;
  badge: string;
  badgeColor: string;
  description: string;
  steps: PhaseStep[];
}

const FLOWS: FlowData[] = [
  {
    id: 'commit',
    title: 'Happy Path: Unanimous YES ➔ Global COMMIT',
    badge: 'SUCCESS (ATOMIC)',
    badgeColor: '#34d399',
    description: 'All participants successfully execute local operations, lock rows, write to WAL, and commit together.',
    steps: [
      { phase: 'PHASE 1 (PREPARE)', actor: 'Coordinator', action: 'Broadcasts PREPARE(tx_101) to DB1, DB2, DB3', status: 'SUCCESS', detail: 'Asks all nodes if they can guarantee committing.' },
      { phase: 'PHASE 1 (PREPARE)', actor: 'Participants (DB 1, 2, 3)', action: 'Acquire row locks, write undo/redo logs to WAL ➔ Vote YES', status: 'WARNING', detail: 'Participants are now locked and obligated to follow coordinator.' },
      { phase: 'PHASE 2 (DECISION)', actor: 'Coordinator Log', action: 'Writes "COMMIT tx_101" to coordinator WAL (Point of No Return)', status: 'SUCCESS', detail: 'Once written to disk, the transaction is irreversibly committed.' },
      { phase: 'PHASE 2 (COMMIT)', actor: 'Coordinator ➔ Nodes', action: 'Broadcasts COMMIT(tx_101) ➔ Nodes apply changes, release locks, return ACK', status: 'SUCCESS', detail: 'Locks released. Changes become visible to all concurrent readers.' }
    ]
  },
  {
    id: 'abort',
    title: 'Abort Path: One Node Votes NO ➔ Global ROLLBACK',
    badge: 'UNILATERAL ABORT',
    badgeColor: '#fbbf24',
    description: 'If even a single participant encounters an error (e.g. constraint violation or timeout), the entire transaction aborts.',
    steps: [
      { phase: 'PHASE 1 (PREPARE)', actor: 'Coordinator', action: 'Broadcasts PREPARE(tx_102) to DB1, DB2, DB3', status: 'SUCCESS', detail: 'Initiates voting round.' },
      { phase: 'PHASE 1 (PREPARE)', actor: 'Participant DB3 (Payment)', action: 'Card error / Disk full ➔ Votes NO (DB1, DB2 voted YES)', status: 'DANGER', detail: 'Single negative vote triggers immediate abort protocol.' },
      { phase: 'PHASE 2 (DECISION)', actor: 'Coordinator Log', action: 'Writes "ABORT tx_102" to coordinator WAL', status: 'WARNING', detail: 'Decision logged durably on coordinator disk.' },
      { phase: 'PHASE 2 (ROLLBACK)', actor: 'Coordinator ➔ Nodes', action: 'Broadcasts ABORT ➔ All nodes undo changes via Undo Log & release locks', status: 'SUCCESS', detail: 'All participating nodes restored cleanly to pre-transaction state.' }
    ]
  },
  {
    id: 'in-doubt',
    title: 'Failure Mode: Coordinator Crashes in Phase 2',
    badge: 'IN-DOUBT BLOCKAGE',
    badgeColor: '#f87171',
    description: 'Participants voted YES, but coordinator dies before broadcasting Phase 2 decision. Participants are stranded holding locks indefinitely.',
    steps: [
      { phase: 'PHASE 1 (PREPARE)', actor: 'Participants (DB 1, 2, 3)', action: 'Voted YES, acquired row locks, flushed WAL', status: 'WARNING', detail: 'Nodes cannot unilaterally abort because coordinator might have committed.' },
      { phase: 'PHASE 2 (CRASH)', actor: 'Coordinator', action: '💥 Coordinator node crashes / Network partition isolates it', status: 'DANGER', detail: 'No COMMIT or ABORT message reaches the participants.' },
      { phase: 'CONSEQUENCE', actor: 'Participants (DB 1, 2, 3)', action: '🚨 Stuck in "In-Doubt" state holding database row locks forever', status: 'DANGER', detail: 'All other transactions trying to access the locked rows block indefinitely!' }
    ]
  }
];

export default function TwoPhaseCommitProtocolFlowDiagram(): React.JSX.Element {
  const [activeFlow, setActiveFlow] = useState<FlowMode>('commit');

  const current = FLOWS.find((f) => f.id === activeFlow) ?? FLOWS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        .tpc-flow-grid {
          display: grid;
          grid-template-columns: 35% 65%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .tpc-flow-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header bar */}
      <div className="interactive-diagram-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderBottom: '1px solid var(--ifm-color-emphasis-200)', background: 'var(--ifm-color-emphasis-100)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Two-Phase Commit (2PC) Protocol: Prepare, Commit & Failure Modes
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: `${current.badgeColor}20`, color: current.badgeColor, fontWeight: 600 }}>
          {current.badge}
        </span>
      </div>

      {/* Mode Selector Tabs */}
      <div style={{ display: 'flex', gap: '6px', padding: '10px 16px', background: 'var(--ifm-background-surface-color)', borderBottom: '1px solid var(--ifm-color-emphasis-200)', flexWrap: 'wrap' }}>
        {FLOWS.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFlow(f.id)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: `1px solid ${activeFlow === f.id ? f.badgeColor : 'var(--ifm-color-emphasis-300)'}`,
              background: activeFlow === f.id ? `${f.badgeColor}18` : 'transparent',
              color: activeFlow === f.id ? f.badgeColor : 'var(--ifm-color-content-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            {f.title.split(':')[0]}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ padding: '16px' }}>
        <div className="tpc-flow-grid">
          {/* Left Column: Flow Details */}
          <div style={{ background: 'var(--ifm-color-emphasis-100)', padding: '14px', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: current.badgeColor }}>
              {current.title}
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
              {current.description}
            </p>

            <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-300)', fontSize: '11px', lineHeight: 1.45 }}>
              <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>Protocol Invariant:</div>
              <div style={{ color: 'var(--ifm-color-content)' }}>
                {activeFlow === 'commit' ? 'The point of no return occurs when the coordinator writes COMMIT to its WAL. After this, participants MUST commit.' : activeFlow === 'abort' ? 'Any single participant voting NO or timing out forces the coordinator to issue a global ABORT.' : 'Once a participant votes YES, it relinquishes the right to unilaterally abort. It must block until coordinator recovers.'}
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Phase Timeline */}
          <div style={{ background: 'var(--ifm-background-surface-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ifm-color-content)', marginBottom: '10px' }}>
              Step-by-Step Execution Trace:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {current.steps.map((st, i) => (
                <div
                  key={i}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'var(--ifm-color-emphasis-100)',
                    borderLeft: `4px solid ${st.status === 'SUCCESS' ? '#34d399' : st.status === 'WARNING' ? '#fbbf24' : '#f87171'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#38bdf8' }}>{st.phase}</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>{st.actor}</span>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ifm-color-content)', marginBottom: '2px' }}>
                    {st.action}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
                    {st.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
