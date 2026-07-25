import React, { useState } from 'react';

interface CommandStep {
  step: number;
  name: string;
  badge: string;
  color: string;
  invokerAction: string;
  receiverImpact: string;
}

const COMMAND_STEPS: CommandStep[] = [
  {
    step: 1,
    name: '1. Invoker Triggers Command',
    badge: 'INVOKER',
    color: '#38bdf8', // Sky Blue
    invokerAction: 'User clicks Button / Shortcut in UI -> Invoker executes command.execute()',
    receiverImpact: 'Command object encapsulates target receiver instance and method arguments.'
  },
  {
    step: 2,
    name: '2. Concrete Command Execution',
    badge: 'EXECUTE',
    color: '#a78bfa', // Purple
    invokerAction: 'CopyCommand.execute() -> reads text selection -> saves state to clipboard',
    receiverImpact: 'Receiver (TextEditor) performs actual modification operation.'
  },
  {
    step: 3,
    name: '3. History Stack Push',
    badge: 'UNDO STACK',
    color: '#fbbf24', // Amber
    invokerAction: 'Command History Stack pushes executed command onto undo history stack.',
    receiverImpact: 'Allows multi-level Undo / Redo capabilities across application.'
  },
  {
    step: 4,
    name: '4. Undo Triggered',
    badge: 'UNDO ACTION',
    color: '#34d399', // Emerald
    invokerAction: 'User presses Ctrl+Z -> CommandHistory.pop().undo()',
    receiverImpact: 'Receiver restores previous state snapshot prior to execution.'
  }
];

export default function CommandDiagram() {
  const [activeStep, setActiveStep] = useState<number>(2);
  const current = COMMAND_STEPS.find(s => s.step === activeStep) || COMMAND_STEPS[1];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Command Design Pattern: Encapsulated Request & Undo Stack</span>
      </div>

      {/* Grid Stepper */}
      <div style={{ padding: '16px 20px', background: '#0d0f1e', borderBottom: '1px solid #1e2342' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
          {COMMAND_STEPS.map((s) => {
            const isActive = activeStep === s.step;
            return (
              <div
                key={s.step}
                onClick={() => setActiveStep(s.step)}
                style={{
                  background: isActive ? `${s.color}18` : '#13162b',
                  border: `1.5px solid ${isActive ? s.color : '#1e2342'}`,
                  borderRadius: '8px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '9px', fontWeight: 800, color: s.color, textTransform: 'uppercase', marginBottom: '2px' }}>
                  STEP {s.step} • {s.badge}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                  {s.name.split('. ')[1]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Details Card */}
      <div className="interactive-diagram-details-card" style={{ background: '#090b14', padding: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: current.color, marginBottom: '6px' }}>
          {current.name}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
          {current.invokerAction}
        </div>

        <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
            Receiver Impact & Undo Support
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)' }}>
            {current.receiverImpact}
          </div>
        </div>
      </div>
    </div>
  );
}
