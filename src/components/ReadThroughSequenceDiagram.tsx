import React, { useState } from 'react';

interface SeqStep {
  label: string;
  sender: 'Client' | 'App' | 'Cache' | 'DB';
  receiver: 'Client' | 'App' | 'Cache' | 'DB';
  msg: string;
  type: 'HIT' | 'MISS' | 'GENERAL';
  detail: string;
}

const STEPS: SeqStep[] = [
  { label: 'Step 1: Request', sender: 'Client', receiver: 'App', msg: 'Get Data (ID: 123)', type: 'GENERAL', detail: 'Application receives request from the client.' },
  { label: 'Step 2: Cache Query', sender: 'App', receiver: 'Cache', msg: 'Query cache:123', type: 'GENERAL', detail: 'Application queries the cache layer. Cache acts as data entrypoint.' },
  { label: 'Step 3a: Cache Hit', sender: 'Cache', receiver: 'App', msg: 'Return cached payload', type: 'HIT', detail: 'Data found! Cache provider returns the value back to the application immediately.' },
  { label: 'Step 3b: Cache Miss', sender: 'Cache', receiver: 'DB', msg: 'Fetch record from DB', type: 'MISS', detail: 'On cache miss, the Cache Loader itself queries the Database (not the application code).' },
  { label: 'Step 4: DB Return & Populate', sender: 'DB', receiver: 'Cache', msg: 'Return record & update cache', type: 'MISS', detail: 'Database returns the value. Cache stores it locally with TTL.' },
  { label: 'Step 5: App Response', sender: 'Cache', receiver: 'App', msg: 'Return retrieved payload', type: 'GENERAL', detail: 'Cache returns the loaded data back to the application.' },
  { label: 'Step 6: Client Return', sender: 'App', receiver: 'Client', msg: 'Return record value', type: 'GENERAL', detail: 'Application returns the data to the client.' },
];

export default function ReadThroughSequenceDiagram(): React.JSX.Element {
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
        <span style={{ color: '#34d399' }}>Read-Through Cache Sequence Player</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
          <button onClick={handleBack} className="interactive-diagram-button" style={{ padding: '3px 8px', fontSize: '9.5px', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', cursor: 'pointer' }}>Back</button>
          <button onClick={handleNext} className="interactive-diagram-button" style={{ padding: '3px 8px', fontSize: '9.5px', background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '4px', cursor: 'pointer' }}>Next Step</button>
        </div>
      </div>

      <style>{`
        .readthrough-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .readthrough-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="readthrough-grid">
        
        {/* SVG Viewport */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 350 200" className="interactive-diagram-svg">
            <defs>
              <marker id="rt-arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(148,163,184,0.3)" />
              </marker>
              <marker id="rt-arr-color" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={step.type === 'HIT' ? '#34d399' : step.type === 'MISS' ? '#ef4444' : '#38bdf8'} />
              </marker>
            </defs>

            {/* Lifelines */}
            {/* Client */}
            <line x1="40" y1="40" x2="40" y2="170" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 3" />
            <rect x="15" y="20" width="50" height="20" rx="3" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <text x="40" y="32" textAnchor="middle" fill="#cbd5e1" fontSize="7.5" fontWeight="bold">Client</text>

            {/* App */}
            <line x1="130" y1="40" x2="130" y2="170" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 3" />
            <rect x="105" y="20" width="50" height="20" rx="3" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <text x="130" y="32" textAnchor="middle" fill="#cbd5e1" fontSize="7.5" fontWeight="bold">App</text>

            {/* Cache */}
            <line x1="220" y1="40" x2="220" y2="170" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 3" />
            <rect x="195" y="20" width="50" height="20" rx="3" fill="rgba(251,191,36,0.05)" stroke="#fbbf24" strokeWidth="1.2" />
            <text x="220" y="32" textAnchor="middle" fill="#fbbf24" fontSize="7.5" fontWeight="bold">Cache</text>

            {/* DB */}
            <line x1="310" y1="40" x2="310" y2="170" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 3" />
            <rect x="285" y="20" width="50" height="20" rx="3" fill="rgba(56,189,248,0.05)" stroke="#38bdf8" strokeWidth="1.2" />
            <text x="310" y="32" textAnchor="middle" fill="#38bdf8" fontSize="7.5" fontWeight="bold">Database</text>

            {/* Active Step Message Overlay Arrow */}
            {(() => {
              const xCoords = { Client: 40, App: 130, Cache: 220, DB: 310 };
              const startX = xCoords[step.sender];
              const endX = xCoords[step.receiver];
              const yVal = 55 + currentStep * 16;

              return (
                <g>
                  {/* Background static messages for other steps */}
                  {STEPS.map((s, idx) => {
                    if (idx === currentStep) return null;
                    const sx = xCoords[s.sender];
                    const ex = xCoords[s.receiver];
                    const sy = 55 + idx * 16;
                    return (
                      <g key={idx} style={{ opacity: 0.15 }}>
                        <line x1={sx} y1={sy} x2={ex > sx ? ex - 6 : ex + 6} y2={sy} stroke="rgba(255,255,255,0.3)" strokeWidth="1" markerEnd="url(#rt-arr)" />
                        <text x={(sx + ex) / 2} y={sy - 4} textAnchor="middle" fill="#94a3b8" fontSize="5.5">{s.msg}</text>
                      </g>
                    );
                  })}

                  {/* Active highlighted step */}
                  <line
                    x1={startX}
                    y1={yVal}
                    x2={endX > startX ? endX - 8 : endX + 8}
                    y2={yVal}
                    stroke={step.type === 'HIT' ? '#34d399' : step.type === 'MISS' ? '#ef4444' : '#38bdf8'}
                    strokeWidth="1.5"
                    className="interactive-diagram-flowing-path"
                    markerEnd="url(#rt-arr-color)"
                  />
                  <text
                    x={(startX + endX) / 2}
                    y={yVal - 4}
                    textAnchor="middle"
                    fill={step.type === 'HIT' ? '#34d399' : step.type === 'MISS' ? '#ef4444' : '#38bdf8'}
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
          borderLeft: `4px solid ${step.type === 'HIT' ? '#34d399' : step.type === 'MISS' ? '#ef4444' : '#38bdf8'}`,
          display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '120px'
        }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '11px', color: step.type === 'HIT' ? '#34d399' : step.type === 'MISS' ? '#ef4444' : '#38bdf8' }}>
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
