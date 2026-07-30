import React, { useState } from 'react';

interface DispatchStep {
  step: number;
  name: string;
  badge: string;
  color: string;
  methodSignature: string;
  dispatchMechanism: string;
  purpose: string;
}

const DISPATCH_STEPS: DispatchStep[] = [
  {
    step: 1,
    name: '1. Client Calls Element.accept(visitor)',
    badge: 'FIRST DISPATCH',
    color: '#38bdf8', // Sky Blue
    methodSignature: 'element.accept(exportVisitor)',
    dispatchMechanism: 'First dynamic dispatch happens on the runtime type of the Element (e.g., Circle, Rectangle, CompoundGraphic).',
    purpose: 'Allows adding new operations to existing element structures without altering element classes.'
  },
  {
    step: 2,
    name: '2. Element Executes Double Dispatch Callback',
    badge: 'SECOND DISPATCH',
    color: '#a78bfa', // Purple
    methodSignature: 'public void accept(Visitor v) { v.visitCircle(this); }',
    dispatchMechanism: 'Second dynamic dispatch happens on overloaded visit method of Visitor using exact typed `this` reference.',
    purpose: 'Ensures JVM resolves the exact concrete element type at compile-time/runtime overload resolution.'
  },
  {
    step: 3,
    name: '3. Concrete Visitor Performs Operation',
    badge: 'VISITOR OPERATION',
    color: '#34d399', // Emerald
    methodSignature: 'XMLExportVisitor.visitCircle(Circle c)',
    dispatchMechanism: 'Visitor executes concrete operation (e.g. exporting element to XML, JSON, or SVG format).',
    purpose: 'Keeps operational logic centralized inside specialized Visitor classes.'
  }
];

export default function VisitorDiagram() {
  const [activeStep, setActiveStep] = useState<number>(2);
  const current = DISPATCH_STEPS.find(s => s.step === activeStep) || DISPATCH_STEPS[1];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Visitor Design Pattern: Double Dispatch Call Mechanism</span>
      </div>

      {/* Grid Stepper */}
      <div style={{ padding: '16px 20px', background: '#0d0f1e', borderBottom: '1px solid #1e2342' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {DISPATCH_STEPS.map((s) => {
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
          {current.dispatchMechanism}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: current.color, textTransform: 'uppercase', marginBottom: '4px' }}>
              Method Signature
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', fontFamily: 'monospace' }}>
              {current.methodSignature}
            </div>
          </div>

          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
              Design Purpose
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              {current.purpose}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
