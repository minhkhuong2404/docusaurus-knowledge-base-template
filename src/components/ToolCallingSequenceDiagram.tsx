import React, { useState } from 'react';

interface SequenceStep {
  id: number;
  from: string;
  to: string;
  action: string;
  color: string;
  details: string;
}

const SEQUENCE: SequenceStep[] = [
  { id: 1, from: 'User', to: 'Agent Harness', action: '1. User Prompt: "Get stock price for AAPL"', color: '#38bdf8', details: 'Harness initializes context, appends system prompt and tool definitions schema.' },
  { id: 2, from: 'Agent Harness', to: 'LLM Engine', action: '2. API Request: messages + tool_definitions', color: '#a78bfa', details: 'LLM receives context and available tool JSON schemas (name, parameters, docstrings).' },
  { id: 3, from: 'LLM Engine', to: 'Agent Harness', action: '3. LLM Response: tool_call("get_stock_price", symbol="AAPL")', color: '#fbbf24', details: 'Model decides to invoke tool. Emits tool_use block with structured parameters.' },
  { id: 4, from: 'Agent Harness', to: 'External API', action: '4. Harness Execution: GET /api/v1/stock?symbol=AAPL', color: '#f87171', details: 'Harness intercepts tool call, verifies permissions/risk, and executes HTTP call.' },
  { id: 5, from: 'External API', to: 'Agent Harness', action: '5. API Response: {"price": 189.45, "currency": "USD"}', color: '#2dd4bf', details: 'Raw external API data returns to the harness runtime.' },
  { id: 6, from: 'Agent Harness', to: 'LLM Engine', action: '6. Context Append: role="tool", content="$189.45"', color: '#a78bfa', details: 'Harness formats observation string and appends to context thread.' },
  { id: 7, from: 'LLM Engine', to: 'User', action: '7. Final Answer: "AAPL is trading at $189.45 USD"', color: '#34d399', details: 'Model parses observation and generates final natural language answer to user.' }
];

export default function ToolCallingSequenceDiagram() {
  const [activeStepId, setActiveStepId] = useState<number>(3);
  const activeStep = SEQUENCE.find(s => s.id === activeStepId) || SEQUENCE[2];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Step-by-Step Tool Calling Sequence Flow</span>
      </div>

      {/* Sequence Rows */}
      <div style={{ padding: '20px', background: '#0d0f1e' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {SEQUENCE.map((step) => {
            const isActive = activeStepId === step.id;
            return (
              <div
                key={step.id}
                onClick={() => setActiveStepId(step.id)}
                style={{
                  background: isActive ? `${step.color}18` : '#13162b',
                  border: `1.5px solid ${isActive ? step.color : '#1e2342'}`,
                  borderRadius: '6px',
                  padding: '10px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? `0 0 12px ${step.color}25` : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: step.color,
                    color: '#090b14',
                    fontSize: '11px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {step.id}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ifm-color-content)' }}>
                    {step.action}
                  </div>
                </div>

                <div style={{ fontSize: '10px', color: step.color, background: `${step.color}15`, padding: '2px 8px', borderRadius: '4px', border: `1px solid ${step.color}30` }}>
                  {step.from} → {step.to}
                </div>
              </div>
            );
          })}
        </div>

        {/* Step Detail Card */}
        <div className="interactive-diagram-details-card" style={{ background: '#090b14', border: `1px solid ${activeStep.color}40`, borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: activeStep.color, marginBottom: '6px' }}>
            {activeStep.action}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.5' }}>
            {activeStep.details}
          </div>
        </div>
      </div>
    </div>
  );
}
