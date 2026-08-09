import React, { useState } from 'react';

const FAILURES = [
  {
    id: 'part_abort',
    title: '1. Participant Abort',
    color: '#fbbf24',
    location: 'Phase 1 Prepare',
    behavior: 'Participant returns NO or times out during Phase 1.',
    resolution: 'Coordinator aborts global transaction; sends ROLLBACK to all participants. No partial updates occur.',
  },
  {
    id: 'part_crash_pre',
    title: '2. Participant Crash (Pre-Prepare)',
    color: '#f97316',
    location: 'Phase 1 Prepare',
    behavior: 'Participant node crashes before writing PREPARE WAL record.',
    resolution: 'Coordinator times out waiting for vote, issues global ROLLBACK.',
  },
  {
    id: 'part_crash_post',
    title: '3. Participant Crash (Post-Prepare)',
    color: '#f87171',
    location: 'Phase 1 Prepared State',
    behavior: 'Participant node crashes after writing PREPARE WAL record.',
    resolution: 'Indoubt Transaction: On restart, participant queries Coordinator for decision (COMMIT or ROLLBACK) while holding local locks.',
  },
  {
    id: 'coord_crash_mid',
    title: '4. Coordinator Crash (Mid-Phase 1)',
    color: '#f87171',
    location: 'Phase 1 Prepare',
    behavior: 'Coordinator crashes before logging decision.',
    resolution: 'Coordinated Blocking Hazard: Participants wait in PREPARED state holding locks indefinitely until new Coordinator recovers.',
  },
  {
    id: 'coord_crash_post',
    title: '5. Coordinator Crash (Post-Commit Log)',
    color: '#a78bfa',
    location: 'Phase 2 Commit',
    behavior: 'Coordinator logs COMMIT to WAL then crashes before sending Phase 2 messages.',
    resolution: 'On restart, Coordinator reads WAL, detects unacknowledged COMMIT, and re-sends COMMIT messages to all participants.',
  },
];

export default function AcidDistributed2PcDiagram(): React.JSX.Element {
  const [activePhase, setActivePhase] = useState<'phase1' | 'phase2'>('phase1');
  const [selectedFailure, setSelectedFailure] = useState('part_abort');

  const fail = FAILURES.find(f => f.id === selectedFailure) ?? FAILURES[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .twopc-grid { grid-template-columns: 1fr !important; } }`}</style>

      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Two-Phase Commit (2PC) State Machine & Failure Mode Matrix
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActivePhase('phase1')}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '11px',
              background: activePhase === 'phase1' ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.04)',
              color: activePhase === 'phase1' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
              boxShadow: activePhase === 'phase1' ? '0 0 0 1.5px #38bdf8' : '0 0 0 1px rgba(255,255,255,0.08)',
            }}
          >
            Phase 1: Prepare
          </button>
          <button
            onClick={() => setActivePhase('phase2')}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '11px',
              background: activePhase === 'phase2' ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.04)',
              color: activePhase === 'phase2' ? '#34d399' : 'var(--ifm-color-content-secondary)',
              boxShadow: activePhase === 'phase2' ? '0 0 0 1.5px #34d399' : '0 0 0 1px rgba(255,255,255,0.08)',
            }}
          >
            Phase 2: Commit
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="twopc-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
          
          {/* Left: Sequence Diagram Stage */}
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: activePhase === 'phase1' ? '#38bdf8' : '#34d399', textTransform: 'uppercase', marginBottom: '10px' }}>
              Protocol Sequence Flow ({activePhase === 'phase1' ? 'Phase 1 Prepare' : 'Phase 2 Commit'})
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center', marginBottom: '14px' }}>
              <div style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.4)', borderRadius: '6px', padding: '8px' }}>
                <div style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 700 }}>Coordinator</div>
                <div style={{ fontSize: '9px', color: 'var(--ifm-color-content-secondary)' }}>Orchestrator</div>
              </div>
              <div style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.4)', borderRadius: '6px', padding: '8px' }}>
                <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>Node A</div>
                <div style={{ fontSize: '9px', color: 'var(--ifm-color-content-secondary)' }}>Participant</div>
              </div>
              <div style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.4)', borderRadius: '6px', padding: '8px' }}>
                <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 700 }}>Node B</div>
                <div style={{ fontSize: '9px', color: 'var(--ifm-color-content-secondary)' }}>Participant</div>
              </div>
            </div>

            {/* Step Explanation Cards */}
            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '8px', padding: '10px', fontSize: '11px', lineHeight: 1.5 }}>
              {activePhase === 'phase1' ? (
                <div>
                  <div style={{ color: '#38bdf8', fontWeight: 700, marginBottom: '4px' }}>Phase 1 Execution:</div>
                  1. Coordinator sends <code>PREPARE</code> message to Node A & Node B.<br />
                  2. Participants acquire row locks, write <code>PREPARE</code> to local WAL.<br />
                  3. Nodes reply <code>YES</code> to Coordinator (State: PREPARED).
                </div>
              ) : (
                <div>
                  <div style={{ color: '#34d399', fontWeight: 700, marginBottom: '4px' }}>Phase 2 Execution:</div>
                  1. Coordinator writes durable <code>COMMIT</code> log to its transaction log.<br />
                  2. Coordinator sends <code>COMMIT</code> message to Node A & Node B.<br />
                  3. Participants execute commit, release locks, and return <code>ACK</code>.
                </div>
              )}
            </div>
          </div>

          {/* Right: Interactive 5-Scenario Failure Mode Matrix */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content)', textTransform: 'uppercase' }}>
              5-Scenario Failure Mode Simulator
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {FAILURES.map(f => {
                const isSel = selectedFailure === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFailure(f.id)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      background: isSel ? `${f.color}20` : 'rgba(255,255,255,0.03)',
                      boxShadow: isSel ? `0 0 0 1.5px ${f.color}` : '0 0 0 1px rgba(255,255,255,0.08)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, color: isSel ? f.color : 'var(--ifm-color-content)' }}>{f.title}</div>
                  </button>
                );
              })}
            </div>

            {/* Failure Detail Card */}
            <div className="interactive-diagram-details-card details-red" style={{ minHeight: '140px' }}>
              <div style={{ fontSize: '10px', color: fail.color, fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                Failure Timing: {fail.location}
              </div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '6px' }}>
                {fail.title}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 8px', lineHeight: 1.5 }}>
                {fail.behavior}
              </p>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px', borderRadius: '6px', fontSize: '10.5px' }}>
                <span style={{ color: '#34d399', fontWeight: 700 }}>Resolution: </span>
                <span style={{ color: 'var(--ifm-color-content-secondary)' }}>{fail.resolution}</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
