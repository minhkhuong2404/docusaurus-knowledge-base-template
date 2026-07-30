import React, { useState } from 'react';

interface TemplateStep {
  step: number;
  name: string;
  badge: string;
  color: string;
  stepType: 'Invariant Fixed Step' | 'Abstract Primitive Step' | 'Optional Hook Step';
  description: string;
  subclassOverride: string;
}

const TEMPLATE_STEPS: TemplateStep[] = [
  {
    step: 1,
    name: '1. openFile() (Invariant Step)',
    badge: 'FIXED STEP',
    color: '#38bdf8', // Sky Blue
    stepType: 'Invariant Fixed Step',
    description: 'Final base method in DataMiner abstract class. Reads raw file bytes from storage.',
    subclassOverride: 'Cannot be overridden by subclasses — guarantees consistent file opening protocol.'
  },
  {
    step: 2,
    name: '2. extractData() (Primitive Step)',
    badge: 'MUST OVERRIDE',
    color: '#a78bfa', // Purple
    stepType: 'Abstract Primitive Step',
    description: 'Abstract method signature. Must be implemented by concrete parser subclasses.',
    subclassOverride: 'PDFDataMiner parses PDF objects; CSVDataMiner parses comma-separated rows.'
  },
  {
    step: 3,
    name: '3. parseData() (Primitive Step)',
    badge: 'MUST OVERRIDE',
    color: '#fbbf24', // Amber
    stepType: 'Abstract Primitive Step',
    description: 'Abstract method signature transforming extracted raw data into standard JSON data structure.',
    subclassOverride: 'Subclasses convert custom raw schemas into unified domain model.'
  },
  {
    step: 4,
    name: '4. sendReport() (Optional Hook)',
    badge: 'OPTIONAL HOOK',
    color: '#34d399', // Emerald
    stepType: 'Optional Hook Step',
    description: 'Hook method with empty default implementation. Subclasses override if reporting is required.',
    subclassOverride: 'EnterprisePDFMiner overrides hook to email PDF audit report to compliance.'
  }
];

export default function TemplateMethodDiagram() {
  const [activeStep, setActiveStep] = useState<number>(2);
  const current = TEMPLATE_STEPS.find(s => s.step === activeStep) || TEMPLATE_STEPS[1];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Template Method Design Pattern: Algorithm Skeleton & Subclass Hooks</span>
      </div>

      {/* Stepper Grid */}
      <div style={{ padding: '16px 20px', background: '#0d0f1e', borderBottom: '1px solid #1e2342' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
          {TEMPLATE_STEPS.map((s) => {
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
        <div style={{ fontSize: '16px', fontWeight: 700, color: current.color, marginBottom: '4px' }}>
          {current.name}
        </div>
        <div style={{ fontSize: '12px', color: current.color, fontWeight: 700, marginBottom: '12px' }}>
          Classification: {current.stepType}
        </div>

        <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
          {current.description}
        </div>

        <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
            Subclass Override Behavior
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)' }}>
            {current.subclassOverride}
          </div>
        </div>
      </div>
    </div>
  );
}
