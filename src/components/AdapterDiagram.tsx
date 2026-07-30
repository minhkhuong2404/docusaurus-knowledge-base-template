import React, { useState } from 'react';

interface AdapterStep {
  step: number;
  title: string;
  badge: string;
  color: string;
  description: string;
  dataFlow: string;
}

const ADAPTER_STEPS: AdapterStep[] = [
  {
    step: 1,
    name: '1. Client Invokes Target Interface',
    badge: 'CLIENT REQUEST',
    color: '#38bdf8', // Sky Blue
    description: 'Client app calls modern target interface expecting standard JSON payload.',
    dataFlow: 'Client -> target.processData(jsonData)'
  },
  {
    step: 2,
    name: '2. Adapter Intercepts & Converts Data',
    badge: 'ADAPTER TRANSLATION',
    color: '#a78bfa', // Purple
    description: 'Adapter receives JSON payload, transforms structure into legacy XML format required by legacy library.',
    dataFlow: 'JSON { "user_id": 42 } -> Adapter converts to XML <user><id>42</id></user>'
  },
  {
    step: 3,
    name: '3. Adapter Invokes Legacy Adaptee',
    badge: 'LEGACY EXECUTION',
    color: '#fbbf24', // Amber
    description: 'Adapter forwards converted XML payload to third-party or legacy class interface.',
    dataFlow: 'Adapter -> legacyLib.executeXmlQuery(xmlData)'
  },
  {
    step: 4,
    name: '4. Response Wrapped & Returned',
    badge: 'CLIENT RESPONSE',
    color: '#34d399', // Emerald
    description: 'Legacy XML response is translated back into JSON object and returned seamlessly to client.',
    dataFlow: 'Legacy XML response -> Adapter translates -> JSON returned to Client'
  }
];

export default function AdapterDiagram() {
  const [activeStep, setActiveStep] = useState<number>(2);
  const current = ADAPTER_STEPS.find(s => s.step === activeStep) || ADAPTER_STEPS[1];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Adapter Design Pattern: Interface Translation Pipeline</span>
      </div>

      {/* Grid Stepper */}
      <div style={{ padding: '16px 20px', background: '#0d0f1e', borderBottom: '1px solid #1e2342' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
          {ADAPTER_STEPS.map((s) => {
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

      {/* Step Inspector Card */}
      <div className="interactive-diagram-details-card" style={{ background: '#090b14', padding: '20px' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: current.color, marginBottom: '6px' }}>
          {current.name}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
          {current.description}
        </div>

        <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
            Data Translation & Flow
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', fontFamily: 'monospace' }}>
            {current.dataFlow}
          </div>
        </div>
      </div>
    </div>
  );
}
