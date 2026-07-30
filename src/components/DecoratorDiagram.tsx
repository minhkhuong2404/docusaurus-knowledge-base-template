import React, { useState } from 'react';

interface DecoratorLayer {
  step: number;
  name: string;
  badge: string;
  color: string;
  addedBehavior: string;
  wrapperCode: string;
}

const DECORATOR_LAYERS: DecoratorLayer[] = [
  {
    step: 1,
    name: '1. Base Concrete Component',
    badge: 'BASE CORE',
    color: '#38bdf8', // Sky Blue
    addedBehavior: 'Sends basic notification email to user via SMTP protocol.',
    wrapperCode: 'Notifier notifier = new EmailNotifier();'
  },
  {
    step: 2,
    name: '2. SMS Decorator Wrapper',
    badge: 'SMS WRAPPER',
    color: '#a78bfa', // Purple
    addedBehavior: 'Wraps Base Notifier. First triggers base send(), then dispatches SMS message via Twilio API.',
    wrapperCode: 'notifier = new SMSDecorator(notifier);'
  },
  {
    step: 3,
    name: '3. Slack Decorator Wrapper',
    badge: 'SLACK WRAPPER',
    color: '#fbbf24', // Amber
    addedBehavior: 'Wraps SMS Decorator. First calls SMSDecorator.send(), then posts webhook alert to Slack channel.',
    wrapperCode: 'notifier = new SlackDecorator(notifier);'
  },
  {
    step: 4,
    name: '4. Encryption Decorator Wrapper',
    badge: 'ENCRYPTION',
    color: '#34d399', // Emerald
    addedBehavior: 'Wraps Slack Decorator. Encrypts payload body before passing down through the decorator chain.',
    wrapperCode: 'notifier = new EncryptionDecorator(notifier);'
  }
];

export default function DecoratorDiagram() {
  const [activeStep, setActiveStep] = useState<number>(3);
  const current = DECORATOR_LAYERS.find(l => l.step === activeStep) || DECORATOR_LAYERS[2];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Decorator Design Pattern: Dynamic Onion Wrapping Stack</span>
      </div>

      {/* Layer Grid Stepper */}
      <div style={{ padding: '16px 20px', background: '#0d0f1e', borderBottom: '1px solid #1e2342' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
          {DECORATOR_LAYERS.map((l) => {
            const isActive = activeStep === l.step;
            return (
              <div
                key={l.step}
                onClick={() => setActiveStep(l.step)}
                style={{
                  background: isActive ? `${l.color}18` : '#13162b',
                  border: `1.5px solid ${isActive ? l.color : '#1e2342'}`,
                  borderRadius: '8px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '9px', fontWeight: 800, color: l.color, textTransform: 'uppercase', marginBottom: '2px' }}>
                  LAYER {l.step} • {l.badge}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                  {l.name.split('. ')[1]}
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
          {current.addedBehavior}
        </div>

        <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: current.color, textTransform: 'uppercase', marginBottom: '4px' }}>
            Decorator Instantiation Chain
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
            {current.wrapperCode}
          </pre>
        </div>
      </div>
    </div>
  );
}
