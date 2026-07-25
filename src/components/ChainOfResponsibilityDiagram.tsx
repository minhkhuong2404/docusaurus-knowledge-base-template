import React, { useState } from 'react';

interface ChainHandler {
  step: number;
  name: string;
  badge: string;
  color: string;
  checkPerformed: string;
  passBehavior: string;
}

const CHAIN_HANDLERS: ChainHandler[] = [
  {
    step: 1,
    name: '1. Authentication Handler',
    badge: 'AUTH CHECK',
    color: '#38bdf8', // Sky Blue
    checkPerformed: 'Validates HTTP Bearer token or session cookie.',
    passBehavior: 'Token is valid -> Passes request to nextHandler.handle(request)'
  },
  {
    step: 2,
    name: '2. Rate Limiting Handler',
    badge: 'RATE LIMIT',
    color: '#a78bfa', // Purple
    checkPerformed: 'Checks client IP against Redis Token Bucket (100 req/min).',
    passBehavior: 'Bucket has remaining tokens -> Passes request to nextHandler.handle(request)'
  },
  {
    step: 3,
    name: '3. Input Validation Handler',
    badge: 'VALIDATION',
    color: '#fbbf24', // Amber
    checkPerformed: 'Sanitizes request body against XSS scripts and SQL injection payloads.',
    passBehavior: 'Payload clean -> Passes request to final Controller handler'
  },
  {
    step: 4,
    name: '4. Controller Handler (Terminal)',
    badge: 'CONTROLLER',
    color: '#34d399', // Emerald
    checkPerformed: 'Executes core business logic and returns HTTP 200 Response.',
    passBehavior: 'Terminal node in chain — request pipeline successfully completes!'
  }
];

export default function ChainOfResponsibilityDiagram() {
  const [activeStep, setActiveStep] = useState<number>(2);
  const current = CHAIN_HANDLERS.find(h => h.step === activeStep) || CHAIN_HANDLERS[1];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Chain of Responsibility Design Pattern: Handler Pipeline Flow</span>
      </div>

      {/* Grid Stepper */}
      <div style={{ padding: '16px 20px', background: '#0d0f1e', borderBottom: '1px solid #1e2342' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
          {CHAIN_HANDLERS.map((h) => {
            const isActive = activeStep === h.step;
            return (
              <div
                key={h.step}
                onClick={() => setActiveStep(h.step)}
                style={{
                  background: isActive ? `${h.color}18` : '#13162b',
                  border: `1.5px solid ${isActive ? h.color : '#1e2342'}`,
                  borderRadius: '8px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '9px', fontWeight: 800, color: h.color, textTransform: 'uppercase', marginBottom: '2px' }}>
                  STEP {h.step} • {h.badge}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                  {h.name.split('. ')[1]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Handler Details Card */}
      <div className="interactive-diagram-details-card" style={{ background: '#090b14', padding: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: current.color, marginBottom: '6px' }}>
          {current.name}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
          {current.checkPerformed}
        </div>

        <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
            Chain Propagation Behavior
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', fontFamily: 'monospace' }}>
            {current.passBehavior}
          </div>
        </div>
      </div>
    </div>
  );
}
