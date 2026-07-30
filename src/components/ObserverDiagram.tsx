import React, { useState } from 'react';

interface ObserverPhase {
  step: number;
  name: string;
  badge: string;
  color: string;
  description: string;
  codePattern: string;
}

const OBSERVER_PHASES: ObserverPhase[] = [
  {
    step: 1,
    name: '1. Register Subscribers',
    badge: 'SUBSCRIBE',
    color: '#38bdf8', // Sky Blue
    description: 'Observers attach to Subject event publisher (e.g. EmailListener, SMSListener, LogListener).',
    codePattern: 'subject.attach(emailListener);\nsubject.attach(smsListener);'
  },
  {
    step: 2,
    name: '2. Subject State Change Event',
    badge: 'STATE CHANGE',
    color: '#a78bfa', // Purple
    description: 'Subject undergoes a state mutation (e.g., Order status changed to SHIPPED).',
    codePattern: 'order.setStatus("SHIPPED"); // Triggers internal notifyObservers()'
  },
  {
    step: 3,
    name: '3. Notify Observers Broadcast',
    badge: 'BROADCAST',
    color: '#fbbf24', // Amber
    description: 'Subject iterates over subscriber list calling update(event) on every registered listener.',
    codePattern: 'for (Observer obs : observers) {\n  obs.update(eventData);\n}'
  },
  {
    step: 4,
    name: '4. Observers React (Async / Sync)',
    badge: 'DISPATCH',
    color: '#34d399', // Emerald
    description: 'Observers process event notification independently without coupling Subject code.',
    codePattern: 'EmailListener sends dispatch email;\nSMSListener sends text notification;'
  }
];

export default function ObserverDiagram() {
  const [activeStep, setActiveStep] = useState<number>(3);
  const current = OBSERVER_PHASES.find(p => p.step === activeStep) || OBSERVER_PHASES[2];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Observer Design Pattern: Event Publisher & Subscriber Broadcast</span>
      </div>

      {/* Grid Stepper */}
      <div style={{ padding: '16px 20px', background: '#0d0f1e', borderBottom: '1px solid #1e2342' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
          {OBSERVER_PHASES.map((p) => {
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
          {current.description}
        </div>

        <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
            Event Execution Code Pattern
          </div>
          <pre style={{
            background: '#090b14',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '11px',
            color: 'var(--ifm-color-content)',
            margin: 0,
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace'
          }}>
            {current.codePattern}
          </pre>
        </div>
      </div>
    </div>
  );
}
