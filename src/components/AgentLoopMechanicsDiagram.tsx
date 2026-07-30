import React, { useState } from 'react';

interface LoopStep {
  step: number;
  name: string;
  badge: string;
  color: string;
  description: string;
  statePayload: string;
}

const LOOP_STEPS: LoopStep[] = [
  {
    step: 1,
    name: '1. Goal Input & Persona Initialization',
    badge: 'INPUT',
    color: '#38bdf8', // Sky Blue
    description: 'User enters high-level intent. System prompt and active tools are loaded into context.',
    statePayload: 'User: "What is Apple (AAPL) trading at right now?"\nSystem Prompt: "You have access to get_stock_price(symbol)."'
  },
  {
    step: 2,
    name: '2. LLM Reasoning & Intent Formulation',
    badge: 'THINK',
    color: '#a78bfa', // Purple
    description: 'LLM evaluates goal against tool descriptions. Determines it lacks real-time price and decides to call a tool.',
    statePayload: 'Thought: "I need live stock data. I will invoke get_stock_price(\'AAPL\')."\nTool Call Intent: {"name": "get_stock_price", "args": {"symbol": "AAPL"}}'
  },
  {
    step: 3,
    name: '3. Harness Tool Execution',
    badge: 'EXECUTE',
    color: '#fbbf24', // Amber
    description: 'Agent harness intercepts tool call, validates schema, executes external API call or database query.',
    statePayload: 'Harness -> API: GET https://api.marketdata.com/v1/stock/AAPL\nResponse: {"symbol": "AAPL", "price": 189.45, "currency": "USD"}'
  },
  {
    step: 4,
    name: '4. Observation & State Ingestion',
    badge: 'OBSERVE',
    color: '#2dd4bf', // Teal
    description: 'Tool result returns as an observation role message back to LLM context window.',
    statePayload: 'Role: "tool"\nContent: "AAPL stock price is $189.45 USD as of 14:30 EST."'
  },
  {
    step: 5,
    name: '5. Decision Evaluation & Terminal Check',
    badge: 'DECIDE',
    color: '#34d399', // Emerald
    description: 'LLM evaluates whether goal is met. If sufficient info exists, emits final response; if not, loops back to step 2.',
    statePayload: 'Thought: "I have the exact price. Goal satisfied."\nFinal Response: "Apple (AAPL) is currently trading at $189.45 USD."'
  }
];

export default function AgentLoopMechanicsDiagram() {
  const [activeStep, setActiveStep] = useState<number>(2);
  const current = LOOP_STEPS.find(s => s.step === activeStep) || LOOP_STEPS[1];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>The Core Agentic Loop Execution Cycle</span>
      </div>

      {/* Stepper Grid */}
      <div style={{ padding: '20px', background: '#0d0f1e' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '10px',
          marginBottom: '20px'
        }}>
          {LOOP_STEPS.map((s) => {
            const isActive = activeStep === s.step;
            return (
              <div
                key={s.step}
                onClick={() => setActiveStep(s.step)}
                style={{
                  background: isActive ? `${s.color}18` : '#13162b',
                  border: `2px solid ${isActive ? s.color : '#1e2342'}`,
                  borderRadius: '8px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? `0 0 12px ${s.color}25` : 'none'
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

        {/* Step Inspector Card */}
        <div className="interactive-diagram-details-card" style={{ background: '#090b14', border: `1px solid ${current.color}40`, borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: current.color }} />
            <div style={{ fontSize: '16px', fontWeight: 700, color: current.color }}>
              {current.name}
            </div>
          </div>

          <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
            {current.description}
          </div>

          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: current.color, textTransform: 'uppercase', marginBottom: '6px' }}>
              State & Payload Trace
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
              {current.statePayload}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
