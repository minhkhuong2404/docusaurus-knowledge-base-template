import React, { useState } from 'react';

interface LoopPhase {
  phase: string;
  name: string;
  badge: string;
  color: string;
  explanation: string;
  exampleTrace: string;
}

const PHASES: LoopPhase[] = [
  {
    phase: 'thought',
    name: '1. Thought (Internal Reasoning)',
    badge: 'REASONING',
    color: '#38bdf8', // Sky Blue
    explanation: 'The agent analyzes the user request and current state to form an internal hypothesis about what to do next.',
    exampleTrace: 'Thought: "The user asks for stock price of Apple. I do not have real-time access in my weights. I need to call get_stock_price(\'AAPL\')."'
  },
  {
    phase: 'action',
    name: '2. Action (Tool Execution Intent)',
    badge: 'INTENT',
    color: '#a78bfa', // Purple
    explanation: 'The agent outputs a structured tool invocation payload specifying the tool name and arguments.',
    exampleTrace: 'Action: get_stock_price(symbol="AAPL")'
  },
  {
    phase: 'observation',
    name: '3. Observation (Environment Feedback)',
    badge: 'FEEDBACK',
    color: '#fbbf24', // Amber
    explanation: 'The harness executes the tool and returns the real-world payload or error log back to the agent.',
    exampleTrace: 'Observation: {"symbol": "AAPL", "price": 189.45, "currency": "USD", "timestamp": "14:30 EST"}'
  },
  {
    phase: 'final',
    name: '4. Final Answer (Goal Satisfied)',
    badge: 'RESPONSE',
    color: '#34d399', // Emerald
    explanation: 'Having gathered sufficient evidence from observations, the agent generates the user-facing response.',
    exampleTrace: 'Final Answer: "Apple (AAPL) is currently trading at $189.45 USD."'
  }
];

export default function Eli5ReactLoopDiagram() {
  const [activePhase, setActivePhase] = useState<string>('thought');
  const current = PHASES.find(p => p.phase === activePhase) || PHASES[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>The ReAct Loop: Thought → Action → Observation</span>
      </div>

      {/* Phase Selector */}
      <div style={{ padding: '20px', background: '#0d0f1e' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
          marginBottom: '20px'
        }}>
          {PHASES.map((p) => {
            const isActive = activePhase === p.phase;
            return (
              <div
                key={p.phase}
                onClick={() => setActivePhase(p.phase)}
                style={{
                  background: isActive ? `${p.color}18` : '#13162b',
                  border: `2px solid ${isActive ? p.color : '#1e2342'}`,
                  borderRadius: '8px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? `0 0 12px ${p.color}25` : 'none'
                }}
              >
                <div style={{ fontSize: '9px', fontWeight: 800, color: p.color, textTransform: 'uppercase', marginBottom: '2px' }}>
                  {p.badge}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                  {p.name.split('. ')[1]}
                </div>
              </div>
            );
          })}
        </div>

        {/* Phase Detail Card */}
        <div className="interactive-diagram-details-card" style={{ background: '#090b14', border: `1px solid ${current.color}40`, borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: current.color, marginBottom: '6px' }}>
            {current.name}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
            {current.explanation}
          </div>

          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: current.color, textTransform: 'uppercase', marginBottom: '6px' }}>
              Execution Trace Payload
            </div>
            <pre style={{
              background: '#090b14',
              padding: '10px',
              borderRadius: '4px',
              fontSize: '11px',
              color: 'var(--ifm-color-content)',
              margin: 0,
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace'
            }}>
              {current.exampleTrace}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
