import React, { useState } from 'react';

interface CompactionMethod {
  id: string;
  name: string;
  badge: string;
  color: string;
  beforeState: string;
  afterState: string;
  howItWorks: string;
  prosCons: string;
}

const METHODS: CompactionMethod[] = [
  {
    id: 'summarization',
    name: 'Strategy 1: Summarization',
    badge: 'LLM CONDENSER',
    color: '#38bdf8', // Sky Blue
    beforeState: '30,000 Tokens (Turns 1–30):\n- Turns 1-15: Setup, file reading, planning\n- Turns 16-25: Implementation & bug fixes\n- Turns 26-30: Test failure stacktraces',
    afterState: '1,200 Tokens:\nSystem Prompt +\n[History Summary]: "Built PaymentService with idempotency. Fixed NPE on line 42. Tests pass for happy path." +\nLast 10 Turns',
    howItWorks: 'Uses a secondary LLM call to summarize conversation history, preserving key architectural decisions, resolved bugs, and open issues while dropping raw message turns.',
    prosCons: 'Preserves high-level intent and decisions, but costs tokens for the summarization call itself.'
  },
  {
    id: 'verbatim',
    name: 'Strategy 2: Verbatim Deletion',
    badge: 'STRICT PRUNING',
    color: '#a78bfa', // Purple
    beforeState: '25,000 Tokens:\n- System Prompt\n- Old tool results (5 file reads)\n- Resolved debug messages\n- Current task context',
    afterState: '4,000 Tokens:\n- System Prompt\n- Current task context\n- Key code decisions\n(Deleted all stale tool outputs & debug messages)',
    howItWorks: 'Directly purges old tool output strings, redundant file read contents, and resolved debugging messages from the message array without calling an LLM summarizer.',
    prosCons: 'Fast and deterministic with zero LLM API cost, but loses granular conversational context.'
  },
  {
    id: 'pruning',
    name: 'Strategy 3: Tool Result Pruning',
    badge: 'STALE DATA PURGE',
    color: '#34d399', // Emerald
    beforeState: '18,000 Tokens:\n- Tool Call 1: read_file("User.java") [4,000 tokens]\n- Tool Call 2: read_file("Order.java") [5,000 tokens]\n- Tool Call 3: read_file("Payment.java") [6,000 tokens]',
    afterState: '6,500 Tokens:\n- Kept only Tool Call 3 (most recent file read)\n- Replaced Tool Call 1 & 2 outputs with "[Pruned stale tool result]"',
    howItWorks: 'Scans the conversation history for role=="tool" messages and prunes all but the N most recent tool results.',
    prosCons: 'Extremely effective at combating tool output context bloat without risking system prompt or user instruction loss.'
  }
];

export default function ContextCompactionDiagram() {
  const [activeId, setActiveId] = useState<string>('summarization');
  const activeMethod = METHODS.find(m => m.id === activeId) || METHODS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 14 10 14 10 20" />
          <polyline points="20 10 14 10 14 4" />
          <line x1="14" y1="10" x2="21" y2="3" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Context Compaction & Token Compression Mechanics</span>
      </div>

      {/* Strategy Selector Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '10px',
        padding: '16px',
        background: '#0d0f1e',
        borderBottom: '1px solid #1e2342'
      }}>
        {METHODS.map((m) => {
          const isActive = activeId === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setActiveId(m.id)}
              style={{
                background: isActive ? `${m.color}18` : '#13162b',
                border: `1.5px solid ${isActive ? m.color : '#1e2342'}`,
                borderRadius: '8px',
                padding: '10px 12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontSize: '9px', fontWeight: 800, color: m.color, background: `${m.color}20`, padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                {m.badge}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                {m.name}
              </div>
            </button>
          );
        })}
      </div>

      {/* Before vs After Visual Comparison */}
      <div style={{ padding: '20px', background: '#090b14' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: activeMethod.color, marginBottom: '4px' }}>
          {activeMethod.name}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
          {activeMethod.howItWorks}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '14px' }}>
          {/* Before State */}
          <div style={{ background: '#13162b', padding: '14px', borderRadius: '8px', border: '1px solid #f8717140' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Before Compaction (Context Bloat)
            </div>
            <pre style={{
              background: '#090b14',
              padding: '10px',
              borderRadius: '6px',
              fontSize: '11px',
              color: '#f87171',
              whiteSpace: 'pre-wrap',
              margin: 0,
              border: '1px solid #f8717130',
              fontFamily: 'monospace'
            }}>
              {activeMethod.beforeState}
            </pre>
          </div>

          {/* After State */}
          <div style={{ background: '#13162b', padding: '14px', borderRadius: '8px', border: '1px solid #34d39940' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              After Compaction (Lean Context)
            </div>
            <pre style={{
              background: '#090b14',
              padding: '10px',
              borderRadius: '6px',
              fontSize: '11px',
              color: '#34d399',
              whiteSpace: 'pre-wrap',
              margin: 0,
              border: '1px solid #34d39930',
              fontFamily: 'monospace'
            }}>
              {activeMethod.afterState}
            </pre>
          </div>
        </div>

        <div style={{ background: `${activeMethod.color}10`, padding: '10px 14px', borderRadius: '6px', borderLeft: `3px solid ${activeMethod.color}`, fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          <strong style={{ color: activeMethod.color }}>Trade-offs: </strong>
          {activeMethod.prosCons}
        </div>
      </div>
    </div>
  );
}
