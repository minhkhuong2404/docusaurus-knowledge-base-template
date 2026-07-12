import React, { useState } from 'react';

interface OrchStep {
  label: string;
  from: 'orchestrator' | 'is' | 'ps' | 'os';
  to: 'orchestrator' | 'is' | 'ps' | 'os' | 'self';
  state: string;
  desc: string;
  type: 'command' | 'reply' | 'compensation' | 'local_state';
}

const STEPS: OrchStep[] = [
  { label: 'State: STARTED', from: 'orchestrator', to: 'self', state: 'STARTED', type: 'local_state', desc: 'Saga state initialized and persisted locally as STARTED before executing downstream network calls.' },
  { label: 'ReserveStock command', from: 'orchestrator', to: 'is', state: 'STARTED', type: 'command', desc: 'Orchestrator sends command containing sagaId, orderId, and items to Inventory Service.' },
  { label: 'StockReserved reply ✅', from: 'is', to: 'orchestrator', state: 'STARTED', type: 'reply', desc: 'Inventory Service successfully reserves stock and replies. Orchestrator receives reply.' },
  { label: 'State: STOCK_RESERVED', from: 'orchestrator', to: 'self', state: 'STOCK_RESERVED', type: 'local_state', desc: 'Orchestrator transition confirmed. Local DB updated with version check.' },
  { label: 'ProcessPayment command', from: 'orchestrator', to: 'ps', state: 'STOCK_RESERVED', type: 'command', desc: 'Orchestrator triggers Payment Service. Thread stays unblocked (async queue).' },
  { label: 'PaymentFailed reply ❌', from: 'ps', to: 'orchestrator', state: 'STOCK_RESERVED', type: 'reply', desc: 'Payment fails due to insufficient funds. Orchestrator marks flow for compensation.' },
  { label: 'State: COMPENSATING', from: 'orchestrator', to: 'self', state: 'COMPENSATING', type: 'local_state', desc: 'Orchestrator enters COMPENSATING state. Prepares to rollback already completed forward steps.' },
  { label: 'ReleaseStock command (Comp)', from: 'orchestrator', to: 'is', state: 'COMPENSATING', type: 'compensation', desc: 'Orchestrator commands Inventory Service to release stock reservation.' },
  { label: 'StockReleased reply ✅', from: 'is', to: 'orchestrator', state: 'COMPENSATING', type: 'reply', desc: 'Inventory Service completes stock release, replies. Orchestrator marks Inventory complete.' },
  { label: 'CancelOrder command (Comp)', from: 'orchestrator', to: 'os', state: 'COMPENSATING', type: 'compensation', desc: 'Orchestrator commands Order Service to cancel the pending order.' },
  { label: 'OrderCancelled reply ✅', from: 'os', to: 'orchestrator', state: 'COMPENSATING', type: 'reply', desc: 'Order Service updates status to CANCELLED, replies to Orchestrator.' },
  { label: 'State: CANCELLED ✅', from: 'orchestrator', to: 'self', state: 'CANCELLED', type: 'local_state', desc: 'Orchestrator marks Saga as CANCELLED (Terminal). Final state persisted cleanly.' }
];

const PARTICIPANT_POS = {
  orchestrator: { x: 80, label: 'Saga Orchestrator 🤖', color: '#a78bfa' },
  is: { x: 260, label: 'Inventory Service 🗄️', color: '#4ade80' },
  ps: { x: 440, label: 'Payment Service 💳', color: '#fb923c' },
  os: { x: 600, label: 'Order Service 📦', color: '#38bdf8' }
};

export default function OrchestrationSequenceDiagram(): React.JSX.Element {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const activeStepInfo = STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const getStepColor = (step: OrchStep, idx: number) => {
    const isActive = idx === currentStep;
    const isCompleted = idx < currentStep;

    if (!isActive && !isCompleted) return 'rgba(255,255,255,0.04)';
    if (step.type === 'compensation' || step.state === 'COMPENSATING') return '#f87171';
    if (step.state === 'CANCELLED') return '#94a3b8';
    if (step.type === 'command') return '#a78bfa';
    if (step.type === 'reply') return '#4ade80';
    return '#a78bfa';
  };

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: 'middle' }}><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" /><line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" /></svg><span style={{ color: '#a78bfa' }}>Orchestration Flow Map (Payment Failure Exception)</span>
          </h3>
        </div>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ overflowX: 'auto' }}>
        <svg viewBox="0 0 680 370" className="interactive-diagram-svg" style={{ minWidth: 600 }}>
          <defs>
            <marker id="orc-seq-arrow-purple" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a78bfa" />
            </marker>
            <marker id="orc-seq-arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#4ade80" />
            </marker>
            <marker id="orc-seq-arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f87171" />
            </marker>
          </defs>

          {/* Lifelines */}
          {Object.entries(PARTICIPANT_POS).map(([key, value]) => (
            <g key={key}>
              <line x1={value.x} y1={40} x2={value.x} y2={355} stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" strokeDasharray="3,3" />
              <rect x={value.x - 65} y={10} width={130} height={25} rx={4} fill="rgba(15,23,42,0.8)" stroke={value.color} strokeWidth="1" />
              <text x={value.x} y={26} style={{ fontFamily: 'Inter', fontSize: 8.5, fontWeight: 700, fill: value.color, textAnchor: 'middle' }}>{value.label}</text>
            </g>
          ))}

          {/* Sequence Steps */}
          {STEPS.map((step, idx) => {
            const isActive = idx === currentStep;
            const y = 60 + idx * 24;
            const fromX = PARTICIPANT_POS[step.from].x;
            const isSelf = step.to === 'self';
            const toX = isSelf ? fromX : PARTICIPANT_POS[step.to].x;
            const color = getStepColor(step, idx);

            const arrowMarker = step.type === 'compensation' 
              ? 'url(#orc-seq-arrow-red)' 
              : step.type === 'reply' && step.label.includes('❌') 
                ? 'url(#orc-seq-arrow-red)' 
                : step.type === 'reply' 
                  ? 'url(#orc-seq-arrow-green)' 
                  : 'url(#orc-seq-arrow-purple)';

            if (isSelf) {
              // Local state persist note
              return (
                <g key={idx} onClick={() => setCurrentStep(idx)} style={{ cursor: 'pointer' }}>
                  <rect x={fromX - 60} y={y - 8} width={120} height={16} rx={3} 
                    fill={isActive ? `${color}20` : 'rgba(0,0,0,0.3)'} 
                    stroke={color} 
                    strokeWidth={isActive ? 1.5 : 0.8} 
                    style={{ transition: 'stroke 0.2s, fill 0.2s' }}
                  />
                  <text x={fromX} y={y + 3} style={{ fontFamily: 'Inter', fontSize: 7, fontWeight: 700, fill: color, textAnchor: 'middle' }}>
                    {step.label}
                  </text>
                </g>
              );
            } else {
              // Network Command / Reply / Compensation message line
              const pathId = `orc-step-path-${idx}`;
              return (
                <g key={idx} onClick={() => setCurrentStep(idx)} style={{ cursor: 'pointer' }}>
                  <path id={pathId}
                    d={`M ${fromX} ${y} L ${toX} ${y}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={isActive ? 2 : 1.2}
                    strokeDasharray={step.type === 'reply' ? '4,2' : 'none'}
                    markerEnd={arrowMarker}
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a78bfa' }}>
            Step {currentStep + 1} of {STEPS.length}
          </span>
          <span style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 2 }}>
            Saga State: <strong style={{ color: getStepColor(activeStepInfo, currentStep) }}>{activeStepInfo.state}</strong>
          </span>
        </div>
        <button onClick={handleNext} disabled={currentStep === STEPS.length - 1} style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: currentStep === STEPS.length - 1 ? '#475569' : '#e2e8f0', cursor: currentStep === STEPS.length - 1 ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
          Next Step ▶
        </button>
      </div>

      {/* Detail Card */}
      <div className="interactive-diagram-details-card" style={{ margin: 0, borderTop: 0, borderRadius: '0 0 6px 6px', borderLeftColor: getStepColor(activeStepInfo, currentStep) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: 4, background: `${getStepColor(activeStepInfo, currentStep)}15`, color: getStepColor(activeStepInfo, currentStep), fontWeight: 700 }}>
            {activeStepInfo.type.toUpperCase()}
          </span>
          <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#e2e8f0' }}>{activeStepInfo.label}</h4>
        </div>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
          {activeStepInfo.desc}
        </p>
      </div>
      <p className="interactive-diagram-helper-text">💡 Play through step-by-step to see how the orchestrator drives command &amp; compensation flows, tracking state transitions in its local database.</p>
    </div>
  );
}
