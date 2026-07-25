import React, { useState } from 'react';

interface Framework {
  id: string;
  name: string;
  badge: string;
  color: string;
  summary: string;
  promptExample: string;
  outputExample: string;
  bestFor: string;
  tokenCost: string;
}

const FRAMEWORKS: Framework[] = [
  {
    id: 'zero-shot',
    name: 'Zero-Shot Prompting',
    badge: '0-SHOT',
    color: '#38bdf8', // Sky Blue
    summary: 'Direct instruction without input/output exemplars. Relies on model pre-trained knowledge.',
    promptExample: 'Task: Classify the following customer feedback as positive, neutral, or negative.\n\nFeedback: "The API latency is low, but the documentation lacks endpoint code samples."',
    outputExample: 'Classification: Neutral (Praise for latency, criticism for documentation)',
    bestFor: 'Simple text classification, standard coding tasks on frontier models (GPT-4o, Claude 3.5).',
    tokenCost: 'Lowest (No extra context overhead)'
  },
  {
    id: 'few-shot',
    name: 'Few-Shot (In-Context Learning)',
    badge: 'FEW-SHOT',
    color: '#a78bfa', // Purple
    summary: 'Provides 3-5 exemplary input-output pairs to enforce custom syntax, DSL, or strict output styling.',
    promptExample: 'Task: Convert Java anonymous inner classes to lambda expressions.\n\nExample 1:\nInput: runner.execute(new Runnable() { public void run() { doWork(); } });\nOutput: runner.execute(() -> doWork());\n\nNow process this input:\nbutton.addActionListener(new ActionListener() { public void actionPerformed(ActionEvent e) { log(); } });',
    outputExample: 'button.addActionListener(e -> log());',
    bestFor: 'Custom DSL translations, specialized JSON formatting, legacy code transformations.',
    tokenCost: 'Moderate (+100–500 tokens per exemplar pair)'
  },
  {
    id: 'cot',
    name: 'Chain-of-Thought (CoT)',
    badge: 'REASONING',
    color: '#fbbf24', // Amber
    summary: 'Forces the LLM to generate step-by-step intermediate reasoning before emitting final output.',
    promptExample: 'Analyze whether to use Kafka or Redis Streams for an order queue with 50,000 TPS, strict ordering, and 7-day replay. Think step-by-step before making your recommendation.',
    outputExample: '1. Evaluate throughput: Both handle 50k TPS.\n2. Evaluate ordering: Kafka per partition key; Redis Streams per stream.\n3. Evaluate retention: Holding 7 days of 50k TPS in RAM (Redis) is cost-prohibitive. Kafka uses disk pagecache.\nConclusion: Recommend Kafka due to retention cost efficiency.',
    bestFor: 'Complex system design decisions, multi-file concurrency debugging, hard algorithmic tasks.',
    tokenCost: 'High (Requires output tokens for reasoning steps)'
  },
  {
    id: 'structured',
    name: 'Structured Output (XML / JSON)',
    badge: 'SCHEMA',
    color: '#34d399', // Emerald
    summary: 'Uses XML tags or Pydantic/JSON Mode decoding to guarantee deterministic, parseable outputs.',
    promptExample: 'Inspect the provided code for thread-safety. Return XML tags:\n<audit_report>\n  <vulnerable>true/false</vulnerable>\n  <remediation>code</remediation>\n</audit_report>',
    outputExample: '<audit_report>\n  <vulnerable>true</vulnerable>\n  <remediation>private final AtomicInteger count = new AtomicInteger();</remediation>\n</audit_report>',
    bestFor: 'Tool calling, backend API payloads, automated linters, agent-to-agent message passing.',
    tokenCost: 'Low to Moderate (Minimal schema tag overhead)'
  }
];

export default function PromptingFrameworksDiagram() {
  const [activeId, setActiveId] = useState<string>('few-shot');
  const activeItem = FRAMEWORKS.find(f => f.id === activeId) || FRAMEWORKS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Core Prompting Frameworks & Mechanics</span>
      </div>

      {/* Selector Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '10px',
        padding: '16px',
        background: '#0d0f1e',
        borderBottom: '1px solid #1e2342'
      }}>
        {FRAMEWORKS.map((fw) => {
          const isActive = activeId === fw.id;
          return (
            <button
              key={fw.id}
              onClick={() => setActiveId(fw.id)}
              style={{
                background: isActive ? `${fw.color}18` : '#13162b',
                border: `1.5px solid ${isActive ? fw.color : '#1e2342'}`,
                borderRadius: '8px',
                padding: '10px 12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: fw.color, background: `${fw.color}20`, padding: '2px 6px', borderRadius: '4px' }}>
                  {fw.badge}
                </span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                {fw.name}
              </div>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div style={{ padding: '20px', background: '#090b14' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '17px', fontWeight: 700, color: activeItem.color, marginBottom: '4px' }}>
            {activeItem.name}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)' }}>
            {activeItem.summary}
          </div>
        </div>

        {/* Input vs Output Box */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '14px',
          marginBottom: '16px'
        }}>
          {/* Prompt Input */}
          <div style={{ background: '#13162b', padding: '14px', borderRadius: '8px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: activeItem.color, textTransform: 'uppercase', marginBottom: '8px' }}>
              Prompt Structure / Input
            </div>
            <pre style={{
              background: '#090b14',
              padding: '10px',
              borderRadius: '6px',
              fontSize: '11px',
              color: 'var(--ifm-color-content-secondary)',
              whiteSpace: 'pre-wrap',
              margin: 0,
              border: '1px solid #1e2342'
            }}>
              {activeItem.promptExample}
            </pre>
          </div>

          {/* Model Output */}
          <div style={{ background: '#13162b', padding: '14px', borderRadius: '8px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '8px' }}>
              Model Generation / Output
            </div>
            <pre style={{
              background: '#090b14',
              padding: '10px',
              borderRadius: '6px',
              fontSize: '11px',
              color: '#34d399',
              whiteSpace: 'pre-wrap',
              margin: 0,
              border: '1px solid #34d39930'
            }}>
              {activeItem.outputExample}
            </pre>
          </div>
        </div>

        {/* Tradeoffs & Recommendations */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px'
        }}>
          <div style={{ background: '#13162b', padding: '10px 14px', borderRadius: '6px', borderLeft: `3px solid ${activeItem.color}`, fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
            <strong style={{ color: 'var(--ifm-color-content)' }}>Best Used For: </strong>{activeItem.bestFor}
          </div>
          <div style={{ background: '#13162b', padding: '10px 14px', borderRadius: '6px', borderLeft: '3px solid #fbbf24', fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
            <strong style={{ color: '#fbbf24' }}>Token Overhead: </strong>{activeItem.tokenCost}
          </div>
        </div>
      </div>
    </div>
  );
}
