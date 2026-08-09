import React, { useState, useEffect } from 'react';

interface Step {
  id: number;
  label: string;
  senderBal: number;
  receiverBal: number;
  action: string;
  undoLog: string;
  walLog: string;
  color: string;
}

const STEPS: Step[] = [
  { id: 1, label: 'Initial State', senderBal: 500, receiverBal: 200, action: 'Transaction BEGIN declared', undoLog: 'No entries yet', walLog: 'BEGIN (Txn 101)', color: '#38bdf8' },
  { id: 2, label: 'Step 1: Debit Alice', senderBal: 400, receiverBal: 200, action: 'UPDATE accounts SET balance = 400 WHERE name = "Alice"', undoLog: 'Before-Image: Alice balance=500', walLog: 'REDO: Alice 500 ➔ 400', color: '#fbbf24' },
  { id: 3, label: 'Step 2: Credit Bob', senderBal: 400, receiverBal: 300, action: 'UPDATE accounts SET balance = 300 WHERE name = "Bob"', undoLog: 'Before-Image: Bob balance=200', walLog: 'REDO: Bob 200 ➔ 300', color: '#2dd4bf' },
  { id: 4, label: 'Final State (Commit)', senderBal: 400, receiverBal: 300, action: 'COMMIT issued — fsync() flushed to disk', undoLog: 'Undo slots marked purgeable', walLog: 'COMMIT (Txn 101)', color: '#34d399' },
];

const SUBSYSTEMS = [
  {
    id: 'atomicity',
    letter: 'A',
    name: 'Atomicity',
    color: '#fbbf24',
    title: 'All-or-Nothing Execution',
    desc: 'If system crashes at Step 2 before Commit, Undo Log reads before-images in reverse to restore Alice balance to $500.',
    mechanism: 'Undo Subsystem / Rollback Segments',
  },
  {
    id: 'consistency',
    letter: 'C',
    name: 'Consistency',
    color: '#38bdf8',
    title: 'Invariant Protection',
    desc: 'Database enforces CHECK (balance >= 0) and FOREIGN KEY rules. Business invariants like total money conservation ($700) hold.',
    mechanism: 'Constraint Engine & Application Logic',
  },
  {
    id: 'isolation',
    letter: 'I',
    name: 'Isolation',
    color: '#a78bfa',
    title: 'Concurrent Isolation',
    desc: 'Concurrent queries on Bob account during transfer see either $200 (pre-transfer) or $300 (post-transfer), never $250.',
    mechanism: '2PL Row Locks & MVCC Read Views',
  },
  {
    id: 'durability',
    letter: 'D',
    name: 'Durability',
    color: '#34d399',
    title: 'Permanent Persistence',
    desc: 'Once COMMIT responds to client, WAL log records are synchronously written via fsync(). Power loss 1ms later cannot erase state.',
    mechanism: 'Write-Ahead Log (WAL) & fsync() Flushes',
  },
];

export default function AcidBeginnersDiagram(): React.JSX.Element {
  const [currentStep, setCurrentStep] = useState(0);
  const [isRolledBack, setIsRolledBack] = useState(false);
  const [activeSubsystem, setActiveSubsystem] = useState('atomicity');
  const [playing, setPlaying] = useState(false);

  const step = STEPS[currentStep];
  const sub = SUBSYSTEMS.find(s => s.id === activeSubsystem) ?? SUBSYSTEMS[0];

  useEffect(() => {
    if (!playing) return;
    if (currentStep >= STEPS.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setCurrentStep(s => s + 1);
    }, 1200);
    return () => clearTimeout(timer);
  }, [playing, currentStep]);

  const handlePlay = () => {
    setIsRolledBack(false);
    setCurrentStep(0);
    setPlaying(true);
  };

  const handleRollback = () => {
    setPlaying(false);
    setIsRolledBack(true);
    setCurrentStep(0);
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .acid-grid { grid-template-columns: 1fr !important; } }`}</style>
      
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Interactive ACID Bank Transfer Execution Flow
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button
            onClick={handlePlay}
            disabled={playing}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              cursor: playing ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '12px',
              background: playing ? 'rgba(255,255,255,0.06)' : 'rgba(56,189,248,0.15)',
              color: playing ? 'var(--ifm-color-content-secondary)' : '#38bdf8',
              boxShadow: playing ? 'none' : '0 0 0 1.5px rgba(56,189,248,0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            {playing ? 'Step-by-Step…' : '▶ Animate Transfer'}
          </button>
          <button
            onClick={handleRollback}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '12px',
              background: 'rgba(248,113,113,0.15)',
              color: '#f87171',
              boxShadow: '0 0 0 1.5px rgba(248,113,113,0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            ⚡ Simulate Crash Rollback
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="acid-grid" style={{ display: 'grid', gridTemplateColumns: '58% 42%', gap: '16px', alignItems: 'start' }}>
          
          {/* Left Column: Visual Transfer Stage */}
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', gap: '12px' }}>
              
              {/* Sender Account Box */}
              <div style={{
                flex: 1,
                background: 'rgba(255,255,255,0.03)',
                border: '1.5px solid rgba(56,189,248,0.4)',
                borderRadius: '10px',
                padding: '12px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase' }}>Alice Account</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--ifm-color-content)', margin: '4px 0' }}>
                  ${isRolledBack ? 500 : step.senderBal}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>
                  {isRolledBack ? 'Restored by Undo Log' : currentStep >= 1 ? '-$100 Deducted' : 'Initial Balance'}
                </div>
              </div>

              {/* Transfer Arrow Indicator */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minWidth: '70px' }}>
                <svg width="60" height="24" viewBox="0 0 60 24">
                  <path d="M5,12 L45,12" stroke={step.color} strokeWidth="2.5" strokeDasharray="4 2" />
                  <polygon points="45,6 57,12 45,18" fill={step.color} />
                </svg>
                <span style={{ fontSize: '10px', color: step.color, fontWeight: 700 }}>$100</span>
              </div>

              {/* Receiver Account Box */}
              <div style={{
                flex: 1,
                background: 'rgba(255,255,255,0.03)',
                border: '1.5px solid rgba(52,211,153,0.4)',
                borderRadius: '10px',
                padding: '12px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>Bob Account</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--ifm-color-content)', margin: '4px 0' }}>
                  ${isRolledBack ? 200 : step.receiverBal}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>
                  {isRolledBack ? 'Unchanged (Abort)' : currentStep >= 2 ? '+$100 Credited' : 'Initial Balance'}
                </div>
              </div>
            </div>

            {/* Execution Step Selector Controls */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
              {STEPS.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => { setPlaying(false); setIsRolledBack(false); setCurrentStep(idx); }}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: currentStep === idx && !isRolledBack ? `${s.color}25` : 'rgba(255,255,255,0.04)',
                    color: currentStep === idx && !isRolledBack ? s.color : 'var(--ifm-color-content-secondary)',
                    boxShadow: currentStep === idx && !isRolledBack ? `0 0 0 1.5px ${s.color}` : '0 0 0 1px rgba(255,255,255,0.08)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Step {s.id}
                </button>
              ))}
            </div>

            {/* Current Step Technical Log Card */}
            <div style={{
              background: isRolledBack ? 'rgba(248,113,113,0.1)' : `${step.color}0d`,
              border: `1px solid ${isRolledBack ? 'rgba(248,113,113,0.4)' : `${step.color}30`}`,
              borderRadius: '8px',
              padding: '12px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: isRolledBack ? '#f87171' : step.color }}>
                  {isRolledBack ? 'CRASH & ROLLBACK TRIGGERED' : step.label}
                </span>
                <code style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Txn ID #101</code>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', margin: '0 0 8px', lineHeight: 1.5 }}>
                {isRolledBack
                  ? 'Server crashed mid-transaction. Database engine scans Undo Log, reverses Alice balance from $400 back to $500, and aborts Txn #101.'
                  : step.action}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10.5px' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px 8px', borderRadius: '5px', borderLeft: '3px solid #fbbf24' }}>
                  <span style={{ color: '#fbbf24', fontWeight: 700 }}>Undo Log: </span>
                  <span style={{ color: 'var(--ifm-color-content-secondary)' }}>{isRolledBack ? 'Replaying before-images in reverse' : step.undoLog}</span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px 8px', borderRadius: '5px', borderLeft: '3px solid #34d399' }}>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>WAL Redo Log: </span>
                  <span style={{ color: 'var(--ifm-color-content-secondary)' }}>{isRolledBack ? 'ABORT #101 recorded' : step.walLog}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: ACID Subsystems Deep Dive */}
          <div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
              {SUBSYSTEMS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSubsystem(s.id)}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: '13px',
                    background: activeSubsystem === s.id ? `${s.color}20` : 'rgba(255,255,255,0.04)',
                    color: activeSubsystem === s.id ? s.color : 'var(--ifm-color-content-secondary)',
                    boxShadow: activeSubsystem === s.id ? `0 0 0 1.5px ${s.color}60` : '0 0 0 1px rgba(255,255,255,0.08)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {s.letter}
                </button>
              ))}
            </div>

            <div className={`interactive-diagram-details-card details-${sub.id === 'atomicity' ? 'yellow' : sub.id === 'consistency' ? 'blue' : sub.id === 'isolation' ? 'purple' : 'green'}`} style={{ minHeight: '220px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '18px', fontWeight: 900, color: sub.color, background: `${sub.color}20`, padding: '2px 8px', borderRadius: '6px' }}>{sub.letter}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ifm-color-content)' }}>{sub.name} — {sub.title}</div>
                  <div style={{ fontSize: '10px', color: sub.color, fontWeight: 600 }}>{sub.mechanism}</div>
                </div>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 12px', lineHeight: 1.6 }}>
                {sub.desc}
              </p>
              <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '6px', padding: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ifm-color-content)', textTransform: 'uppercase', marginBottom: '4px' }}>Subsystem Role in Bank Transfer</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                  {sub.id === 'atomicity' && 'Ensures step 1 (debit) and step 2 (credit) occur as one indivisible unit.'}
                  {sub.id === 'consistency' && 'Validates Alice balance >= 0 constraint before committing changes.'}
                  {sub.id === 'isolation' && 'Prevents uncommitted balance changes from leaking to concurrent queries.'}
                  {sub.id === 'durability' && 'Ensures committed $100 transfer survives operating system crash or outage.'}
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
