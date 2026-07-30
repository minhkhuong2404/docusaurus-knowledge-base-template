import React, { useState } from 'react';

interface SeqStep {
  label: string;
  sender: 'App' | 'Redis' | 'DB';
  receiver: 'App' | 'Redis' | 'DB';
  msg: string;
  type: 'EVT' | 'WRITE' | 'GENERAL';
  detail: string;
}

const STEPS: SeqStep[] = [
  { label: 'Step 1: First Eviction', sender: 'App', receiver: 'Redis', msg: 'Delete Key', type: 'EVT', detail: 'App deletes cache key first, reducing cache read windows before writing.' },
  { label: 'Step 2: Database Write', sender: 'App', receiver: 'DB', msg: 'UPDATE table SET val = v2', type: 'WRITE', detail: 'App writes the update to the primary database.' },
  { label: 'Step 3: Replication Lag Pause', sender: 'App', receiver: 'App', msg: 'Sleep 500ms', type: 'GENERAL', detail: 'App pauses to allow the primary database update to propagate to all read replicas.' },
  { label: 'Step 4: Second Eviction', sender: 'App', receiver: 'Redis', msg: 'Delete Key Again', type: 'EVT', detail: 'App evicts the cache key a second time. This clears any stale reads that occurred during the replication lag window.' },
];

export default function DualDeleteSequenceDiagram(): React.JSX.Element {
  const [currentStep, setCurrentStep] = useState<number>(0);

  const step = STEPS[currentStep];

  const handleNext = () => {
    setCurrentStep(prev => (prev + 1) % STEPS.length);
  };

  const handleBack = () => {
    setCurrentStep(prev => (prev - 1 + STEPS.length) % STEPS.length);
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 22 22 22 12 2"/>
        </svg>
        <span style={{ color: '#34d399' }}>The Dual-Delete Invalidation Strategy</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
          <button onClick={handleBack} className="interactive-diagram-button" style={{ padding: '3px 8px', fontSize: '9.5px', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', cursor: 'pointer' }}>Back</button>
          <button onClick={handleNext} className="interactive-diagram-button" style={{ padding: '3px 8px', fontSize: '9.5px', background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '4px', cursor: 'pointer' }}>Next Step</button>
        </div>
      </div>

      <style>{`
        .dualdelete-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .dualdelete-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="dualdelete-grid">
        
        {/* SVG Viewport */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 350 180" className="interactive-diagram-svg">
            <defs>
              <marker id="dd-arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(148,163,184,0.3)" />
              </marker>
              <marker id="dd-arr-color" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={step.type === 'EVT' ? '#fbbf24' : step.type === 'WRITE' ? '#ef4444' : '#38bdf8'} />
              </marker>
            </defs>

            {/* Lifelines */}
            {/* App */}
            <line x1="60" y1="40" x2="60" y2="150" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 3" />
            <rect x="35" y="20" width="50" height="20" rx="3" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <text x="60" y="32" textAnchor="middle" fill="#cbd5e1" fontSize="7.5" fontWeight="bold">App</text>

            {/* Redis */}
            <line x1="175" y1="40" x2="175" y2="150" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 3" />
            <rect x="150" y="20" width="50" height="20" rx="3" fill="rgba(251,191,36,0.05)" stroke="#fbbf24" strokeWidth="1.2" />
            <text x="175" y="32" textAnchor="middle" fill="#fbbf24" fontSize="7.5" fontWeight="bold">Redis</text>

            {/* Database */}
            <line x1="290" y1="40" x2="290" y2="150" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 3" />
            <rect x="265" y="20" width="50" height="20" rx="3" fill="rgba(56,189,248,0.05)" stroke="#38bdf8" strokeWidth="1.2" />
            <text x="290" y="32" textAnchor="middle" fill="#38bdf8" fontSize="7.5" fontWeight="bold">Database</text>

            {/* Messages */}
            {(() => {
              const xCoords = { App: 60, Redis: 175, DB: 290 };
              return (
                <g>
                  {/* Background static messages */}
                  {STEPS.map((s, idx) => {
                    if (idx === currentStep) return null;
                    const sx = xCoords[s.sender];
                    const ex = xCoords[s.receiver];
                    const sy = 55 + idx * 22;
                    return (
                      <g key={idx} style={{ opacity: 0.15 }}>
                        {sx === ex ? (
                          <path d={`M ${sx} ${sy} C ${sx+20} ${sy-10}, ${sx+20} ${sy+10}, ${sx} ${sy}`} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" markerEnd="url(#dd-arr)" />
                        ) : (
                          <line x1={sx} y1={sy} x2={ex > sx ? ex - 6 : ex + 6} y2={sy} stroke="rgba(255,255,255,0.3)" strokeWidth="1" markerEnd="url(#dd-arr)" />
                        )}
                        <text x={sx === ex ? sx + 30 : (sx + ex) / 2} y={sy - 4} textAnchor="middle" fill="#94a3b8" fontSize="5.5">{s.msg}</text>
                      </g>
                    );
                  })}

                  {/* Active Step */}
                  {step.sender === step.receiver ? (
                    <path
                      d={`M ${xCoords[step.sender]} ${55 + currentStep * 22} C ${xCoords[step.sender]+25} ${55 + currentStep * 22 - 10}, ${xCoords[step.sender]+25} ${55 + currentStep * 22 + 10}, ${xCoords[step.sender]} ${55 + currentStep * 22}`}
                      fill="none"
                      stroke={step.type === 'EVT' ? '#fbbf24' : step.type === 'WRITE' ? '#ef4444' : '#38bdf8'}
                      strokeWidth="1.5"
                      className="interactive-diagram-flowing-path"
                      markerEnd="url(#dd-arr-color)"
                    />
                  ) : (
                    <line
                      x1={xCoords[step.sender]}
                      y1={55 + currentStep * 22}
                      x2={xCoords[step.receiver] > xCoords[step.sender] ? xCoords[step.receiver] - 8 : xCoords[step.receiver] + 8}
                      y2={55 + currentStep * 22}
                      stroke={step.type === 'EVT' ? '#fbbf24' : step.type === 'WRITE' ? '#ef4444' : '#38bdf8'}
                      strokeWidth="1.5"
                      className="interactive-diagram-flowing-path"
                      markerEnd="url(#dd-arr-color)"
                    />
                  )}
                  <text
                    x={step.sender === step.receiver ? xCoords[step.sender] + 35 : (xCoords[step.sender] + xCoords[step.receiver]) / 2}
                    y={55 + currentStep * 22 - 4}
                    textAnchor="middle"
                    fill={step.type === 'EVT' ? '#fbbf24' : step.type === 'WRITE' ? '#ef4444' : '#38bdf8'}
                    fontSize="6.5"
                    fontWeight="bold"
                  >
                    {step.msg}
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>

        {/* Details Card */}
        <div className="interactive-diagram-details-card" style={{
          borderLeft: `4px solid ${step.type === 'EVT' ? '#fbbf24' : step.type === 'WRITE' ? '#ef4444' : '#38bdf8'}`,
          display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '120px'
        }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '11px', color: step.type === 'EVT' ? '#fbbf24' : step.type === 'WRITE' ? '#ef4444' : '#38bdf8' }}>
              {step.label}
            </h4>
          </div>
          <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', margin: 0, lineHeight: 1.45 }}>
            {step.detail}
          </p>
        </div>

      </div>
    </div>
  );
}
