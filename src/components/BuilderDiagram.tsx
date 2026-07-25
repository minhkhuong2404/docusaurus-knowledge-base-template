import React, { useState } from 'react';

interface BuildStep {
  step: number;
  name: string;
  badge: string;
  color: string;
  methodCall: string;
  objectState: string;
}

const BUILD_STEPS: BuildStep[] = [
  {
    step: 1,
    name: '1. Initialize Builder',
    badge: 'NEW BUILDER',
    color: '#38bdf8', // Sky Blue
    methodCall: 'HttpRequest.builder()',
    objectState: 'HttpRequestBuilder { url: null, method: "GET", headers: {}, body: null }'
  },
  {
    step: 2,
    name: '2. Set Target URL',
    badge: 'CONFIG URL',
    color: '#a78bfa', // Purple
    methodCall: '.url("https://api.gateway.com/v1/orders")',
    objectState: 'HttpRequestBuilder { url: "https://api.gateway.com...", method: "GET", ... }'
  },
  {
    step: 3,
    name: '3. Set HTTP Method & Headers',
    badge: 'HEADERS',
    color: '#fbbf24', // Amber
    methodCall: '.method("POST").addHeader("Authorization", "Bearer token")',
    objectState: 'HttpRequestBuilder { url: "...", method: "POST", headers: {"Authorization": "Bearer..."}, ... }'
  },
  {
    step: 4,
    name: '4. Set Payload & Build()',
    badge: 'FINAL PRODUCT',
    color: '#34d399', // Emerald
    methodCall: '.body("{\\"amount\\": 100}").build()',
    objectState: 'Immutable HttpRequest Object Created & Validated! Ready for execution.'
  }
];

export default function BuilderDiagram() {
  const [activeStep, setActiveStep] = useState<number>(3);
  const current = BUILD_STEPS.find(b => b.step === activeStep) || BUILD_STEPS[2];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 7l-5 5m0 0l-5-5m5 5V2" />
          <rect x="3" y="17" width="18" height="5" rx="2" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Builder Design Pattern: Fluent Step-by-Step Construction</span>
      </div>

      {/* Grid Stepper */}
      <div style={{ padding: '16px 20px', background: '#0d0f1e', borderBottom: '1px solid #1e2342' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
          {BUILD_STEPS.map((s) => {
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

      {/* Step Detail Card */}
      <div className="interactive-diagram-details-card" style={{ background: '#090b14', padding: '20px' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: current.color, marginBottom: '6px' }}>
          {current.name}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: current.color, textTransform: 'uppercase', marginBottom: '4px' }}>
              Fluent Chain Method Call
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', fontFamily: 'monospace' }}>
              {current.methodCall}
            </div>
          </div>

          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
              Builder Internal State Snapshot
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', fontFamily: 'monospace' }}>
              {current.objectState}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
