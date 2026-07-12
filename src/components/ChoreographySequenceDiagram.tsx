import React, { useState } from 'react';

interface ChoreoStep {
  label: string;
  from: 'client' | 'os' | 'is' | 'ps' | 'ns';
  to: 'client' | 'os' | 'is' | 'ps' | 'ns' | 'self';
  desc: string;
  badge?: string;
}

const HAPPY_STEPS: ChoreoStep[] = [
  { label: 'POST /orders', from: 'client', to: 'os', desc: 'Client submits a new order. Order Service writes order to database with PENDING status.' },
  { label: 'Emit: OrderCreated', from: 'os', to: 'is', desc: 'Order Service publishes OrderCreated event to message broker. Inventory Service consumes it.' },
  { label: 'Reserve Stock', from: 'is', to: 'self', desc: 'Inventory Service checks local DB and reserves the requested items inside a local ACID transaction.' },
  { label: 'Emit: StockReserved', from: 'is', to: 'ps', desc: 'Inventory Service publishes StockReserved event. Payment Service consumes it.' },
  { label: 'Charge Customer', from: 'ps', to: 'self', desc: 'Payment Service executes payment transaction via Stripe API or payment gateway.' },
  { label: 'Emit: PaymentProcessed', from: 'ps', to: 'os', desc: 'Payment processed successfully. Event sent to Order Service to finalize state.' },
  { label: 'Emit: PaymentProcessed', from: 'ps', to: 'ns', desc: 'Simultaneously, event is sent to Notification Service to alert the customer.' },
  { label: 'Update Order → CONFIRMED', from: 'os', to: 'self', desc: 'Order Service updates local status to CONFIRMED. Transaction is complete.' },
  { label: 'Send Confirmation Email', from: 'ns', to: 'self', desc: 'Notification Service sends confirmation email/SMS. Eventual consistency reached!' }
];

const FAILURE_STEPS: ChoreoStep[] = [
  { label: 'POST /orders', from: 'client', to: 'os', desc: 'Client submits a new order. Order Service writes order to database with PENDING status.' },
  { label: 'Emit: OrderCreated', from: 'os', to: 'is', desc: 'Order Service publishes OrderCreated event to message broker. Inventory Service consumes it.' },
  { label: 'Reserve Stock', from: 'is', to: 'self', desc: 'Inventory Service checks local DB and reserves the requested items inside a local ACID transaction.' },
  { label: 'Emit: StockReserved', from: 'is', to: 'ps', desc: 'Inventory Service publishes StockReserved event. Payment Service consumes it.' },
  { label: 'Payment FAILS ❌', from: 'ps', to: 'self', desc: 'Payment Service attempts charge, but card is declined or funds are insufficient.' },
  { label: 'Emit: PaymentFailed', from: 'ps', to: 'is', desc: 'Payment Service publishes PaymentFailed event to trigger compensation in Inventory Service.' },
  { label: 'Emit: PaymentFailed', from: 'ps', to: 'os', desc: 'Payment Service publishes PaymentFailed event to trigger compensation in Order Service.' },
  { label: 'Release Reserved Stock', from: 'is', to: 'self', desc: 'COMPENSATION: Inventory Service releases the reserved stock items back to available inventory.' },
  { label: 'Update Order → CANCELLED', from: 'os', to: 'self', desc: 'COMPENSATION: Order Service updates the database status to CANCELLED. System is consistent.' }
];

const PARTICIPANT_POS = {
  client: { x: 60, label: 'Client 💻', color: '#94a3b8' },
  os: { x: 200, label: 'Order Service 📦', color: '#38bdf8' },
  is: { x: 340, label: 'Inventory Service 🗄️', color: '#4ade80' },
  ps: { x: 480, label: 'Payment Service 💳', color: '#a78bfa' },
  ns: { x: 620, label: 'Notification Service ✉️', color: '#fb923c' }
};

export default function ChoreographySequenceDiagram(): React.JSX.Element {
  const [pathMode, setPathMode] = useState<'happy' | 'failure'>('happy');
  const [currentStep, setCurrentStep] = useState<number>(0);

  const steps = pathMode === 'happy' ? HAPPY_STEPS : FAILURE_STEPS;
  const activeStepInfo = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleModeChange = (mode: 'happy' | 'failure') => {
    setPathMode(mode);
    setCurrentStep(0);
  };

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={pathMode === 'happy' ? '#4ade80' : '#f87171'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: 'middle', transition: 'stroke 0.2s' }}><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" /><line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" /></svg><span style={{ color: pathMode === 'happy' ? '#4ade80' : '#f87171' }}>Choreography Flow Map</span>
          </h3>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => handleModeChange('happy')} style={{ background: pathMode === 'happy' ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.02)', border: `1px solid ${pathMode === 'happy' ? '#4ade80' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: pathMode === 'happy' ? '#4ade80' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>
            Happy Path ✅
          </button>
          <button onClick={() => handleModeChange('failure')} style={{ background: pathMode === 'failure' ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.02)', border: `1px solid ${pathMode === 'failure' ? '#f87171' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: pathMode === 'failure' ? '#f87171' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>
            Payment Fails (Compensation) ❌
          </button>
        </div>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ overflowX: 'auto' }}>
        <svg viewBox="0 0 680 340" className="interactive-diagram-svg" style={{ minWidth: 600 }}>
          <defs>
            <marker id="ch-seq-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
            </marker>
            <marker id="ch-seq-arrow-fail" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f87171" />
            </marker>
          </defs>

          {/* Vertical Lifelines */}
          {Object.entries(PARTICIPANT_POS).map(([key, value]) => (
            <g key={key}>
              <line x1={value.x} y1={40} x2={value.x} y2={295} stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" strokeDasharray="3,3" />
              {/* Participant Box */}
              <rect x={value.x - 55} y={10} width={110} height={25} rx={4} fill="rgba(15,23,42,0.8)" stroke={value.color} strokeWidth="1" />
              <text x={value.x} y={26} style={{ fontFamily: 'Inter', fontSize: 8.5, fontWeight: 700, fill: value.color, textAnchor: 'middle' }}>{value.label}</text>
            </g>
          ))}

          {/* Sequence Message Lines */}
          {steps.map((step, idx) => {
            const isActive = idx === currentStep;
            const isCompleted = idx < currentStep;
            const y = 55 + idx * 26;

            const fromX = PARTICIPANT_POS[step.from].x;
            const isSelf = step.to === 'self';
            const toX = isSelf ? fromX : PARTICIPANT_POS[step.to].x;

            const pathId = `ch-step-path-${idx}`;
            const color = pathMode === 'failure' && idx >= 4 ? '#f87171' : isActive ? '#38bdf8' : isCompleted ? '#475569' : 'rgba(255,255,255,0.04)';

            if (isSelf) {
              // Self-loop message
              return (
                <g key={idx} onClick={() => setCurrentStep(idx)} style={{ cursor: 'pointer' }}>
                  <path id={pathId}
                    d={`M ${fromX} ${y} Q ${fromX + 25} ${y + 6} ${fromX} ${y + 12}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={isActive ? 2 : 1.2}
                    markerEnd={pathMode === 'failure' && idx >= 4 ? 'url(#ch-seq-arrow-fail)' : 'url(#ch-seq-arrow)'}
                    style={{ transition: 'stroke 0.2s' }}
                  />
                  {isActive && (
                    <circle r="2.2" fill={color}>
                      <animateMotion dur="0.8s" repeatCount="indefinite"><mpath href={`#${pathId}`} /></animateMotion>
                    </circle>
                  )}
                  <text x={fromX + 30} y={y + 8} style={{ fontFamily: 'Inter', fontSize: 7, fontWeight: isActive ? 700 : 500, fill: color, alignmentBaseline: 'middle' }}>
                    {step.label}
                  </text>
                </g>
              );
            } else {
              // Service-to-service message
              return (
                <g key={idx} onClick={() => setCurrentStep(idx)} style={{ cursor: 'pointer' }}>
                  <path id={pathId}
                    d={`M ${fromX} ${y} L ${toX} ${y}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={isActive ? 2 : 1.2}
                    markerEnd={pathMode === 'failure' && idx >= 4 ? 'url(#ch-seq-arrow-fail)' : 'url(#ch-seq-arrow)'}
                    style={{ transition: 'stroke 0.2s' }}
                  />
                  {isActive && (
                    <circle r="2.2" fill={color}>
                      <animateMotion dur="0.8s" repeatCount="indefinite"><mpath href={`#${pathId}`} /></animateMotion>
                    </circle>
                  )}
                  <text x={(fromX + toX) / 2} y={y - 4} style={{ fontFamily: 'Inter', fontSize: 7, fontWeight: isActive ? 700 : 500, fill: color, textAnchor: 'middle' }}>
                    {step.label}
                  </text>
                </g>
              );
            }
          })}
        </svg>
      </div>

      {/* Stepper Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={handleBack} disabled={currentStep === 0} style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: currentStep === 0 ? '#475569' : '#e2e8f0', cursor: currentStep === 0 ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
          ◀ Back
        </button>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>
          Step {currentStep + 1} of {steps.length}
        </span>
        <button onClick={handleNext} disabled={currentStep === steps.length - 1} style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: currentStep === steps.length - 1 ? '#475569' : '#e2e8f0', cursor: currentStep === steps.length - 1 ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
          Next Step ▶
        </button>
      </div>

      {/* Detail Card */}
      <div className="interactive-diagram-details-card" style={{ margin: 0, borderTop: 0, borderRadius: '0 0 6px 6px', borderLeftColor: pathMode === 'failure' && currentStep >= 4 ? '#f87171' : '#38bdf8' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: 4, background: pathMode === 'failure' && currentStep >= 4 ? 'rgba(248,113,113,0.12)' : 'rgba(56,189,248,0.12)', color: pathMode === 'failure' && currentStep >= 4 ? '#f87171' : '#38bdf8', fontWeight: 700 }}>
            {activeStepInfo.from.toUpperCase()} → {activeStepInfo.to.toUpperCase()}
          </span>
          <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#e2e8f0' }}>{activeStepInfo.label}</h4>
        </div>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
          {activeStepInfo.desc}
        </p>
      </div>
      <p className="interactive-diagram-helper-text">💡 Click any step name directly inside the sequence map or use the stepper to explore step-by-step.</p>
    </div>
  );
}
