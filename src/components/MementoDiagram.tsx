import React, { useState } from 'react';

interface MementoPhase {
  step: number;
  name: string;
  badge: string;
  color: string;
  action: string;
  encapsulationProtection: string;
}

const MEMENTO_PHASES: MementoPhase[] = [
  {
    step: 1,
    name: '1. Originator State Mutates',
    badge: 'STATE MUTATION',
    color: '#38bdf8', // Sky Blue
    action: 'TextEditor (Originator) modifies internal text state: "Hello World"',
    encapsulationProtection: 'Originator holds full access to private fields.'
  },
  {
    step: 2,
    name: '2. Snapshot Creation (Memento)',
    badge: 'CREATE SNAPSHOT',
    color: '#a78bfa', // Purple
    action: 'Originator instantiates Memento snapshot holding immutable copy of internal state.',
    encapsulationProtection: 'Memento fields are private/package-private, inaccessible to Caretaker.'
  },
  {
    step: 3,
    name: '3. Caretaker Stores Memento',
    badge: 'CARETAKER STACK',
    color: '#fbbf24', // Amber
    action: 'Caretaker (History Manager) pushes Memento snapshot onto Stack<Memento>.',
    encapsulationProtection: 'Caretaker cannot inspect or modify Memento internal state data.'
  },
  {
    step: 4,
    name: '4. Restore State (Undo)',
    badge: 'RESTORE UNDO',
    color: '#34d399', // Emerald
    action: 'Caretaker pops Memento from Stack and passes to Originator.restore(memento).',
    encapsulationProtection: 'Originator restores internal state back to "Hello World".'
  }
];

export default function MementoDiagram() {
  const [activeStep, setActiveStep] = useState<number>(2);
  const current = MEMENTO_PHASES.find(p => p.step === activeStep) || MEMENTO_PHASES[1];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Memento Design Pattern: State Snapshot & Caretaker Undo Stack</span>
      </div>

      {/* Grid Stepper */}
      <div style={{ padding: '16px 20px', background: '#0d0f1e', borderBottom: '1px solid #1e2342' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
          {MEMENTO_PHASES.map((p) => {
            const isActive = activeStep === p.step;
            return (
              <div
                key={p.step}
                onClick={() => setActiveStep(p.step)}
                style={{
                  background: isActive ? `${p.color}18` : '#13162b',
                  border: `1.5px solid ${isActive ? p.color : '#1e2342'}`,
                  borderRadius: '8px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '9px', fontWeight: 800, color: p.color, textTransform: 'uppercase', marginBottom: '2px' }}>
                  STEP {p.step} • {p.badge}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                  {p.name.split('. ')[1]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Details Inspector */}
      <div className="interactive-diagram-details-card" style={{ background: '#090b14', padding: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: current.color, marginBottom: '6px' }}>
          {current.name}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
          {current.action}
        </div>

        <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
            Encapsulation Security Guarantee
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)' }}>
            {current.encapsulationProtection}
          </div>
        </div>
      </div>
    </div>
  );
}
