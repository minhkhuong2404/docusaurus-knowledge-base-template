import React, { useState } from 'react';

interface ModelTier {
  id: string;
  name: string;
  provider: string;
  tier: string;
  color: string;
  strengths: string[];
  weaknesses: string;
  idealRole: string;
  contextWindow: string;
}

const MODELS: ModelTier[] = [
  {
    id: 'claude-sonnet',
    name: 'Claude 3.5 / 3.7 Sonnet',
    provider: 'Anthropic',
    tier: 'IDE Workhorse & Diff Leader',
    color: '#a78bfa', // Purple
    strengths: [
      'Exceptional structural code comprehension & multi-file diff writing',
      'Strict adherence to XML tag schemas & System Prompt instructions',
      'Lowest hallucination rate on complex refactoring tasks'
    ],
    weaknesses: 'Can be conservative with large file writes unless explicitly prompted to generate complete files.',
    idealRole: 'Default engine for Cursor Composer, Windsurf Cascade, and complex IDE vibe coding.',
    contextWindow: '200k tokens'
  },
  {
    id: 'openai-reasoning',
    name: 'OpenAI o1 / o3-mini',
    provider: 'OpenAI',
    tier: 'Deep Reasoning & Hard Logic',
    color: '#38bdf8', // Sky Blue
    strengths: [
      'Native reasoning tokens allow deep multi-step internal CoT thinking',
      'Solves hard concurrency deadlocks, numerical logic, and algorithmic bugs',
      'Highest accuracy on competitive programming & SWE-bench tasks'
    ],
    weaknesses: 'Higher latency due to thinking phase; higher token cost on large prompt histories.',
    idealRole: 'System architecture planning, complex race condition debugging, and algorithm optimization.',
    contextWindow: '128k–200k tokens'
  },
  {
    id: 'gpt4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    tier: 'Multimodal & Fast Tool Execution',
    color: '#34d399', // Emerald
    strengths: [
      'Fast inference speed with highly reliable Function Calling / JSON mode',
      'Native multimodal vision support (screenshot-to-HTML/CSS generation)',
      'Extremely strong general instruction following'
    ],
    weaknesses: 'Shorter effective reasoning horizon compared to o1/o3-mini on multi-file refactors.',
    idealRole: 'General chat assistant, UI/UX image-to-code generation, and fast tool-calling agents.',
    contextWindow: '128k tokens'
  },
  {
    id: 'gemini',
    name: 'Gemini 2.0 Flash / Pro',
    provider: 'Google',
    tier: 'Massive Context & High Throughput',
    color: '#fbbf24', // Amber
    strengths: [
      'Massive 1M–2M token context window for repository-wide analysis',
      'Ultra-fast inference speed at minimal API cost',
      'Excellent multimodal performance across code, video, and audio'
    ],
    weaknesses: 'Can require precise prompting to avoid overly verbose output.',
    idealRole: 'Whole-codebase context indexing, massive log parsing, and high-volume background RAG.',
    contextWindow: '1,000,000–2,000,000 tokens'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek R1 / V3',
    provider: 'Open Source',
    tier: 'Open Weights & On-Premise Cost Efficiency',
    color: '#2dd4bf', // Teal
    strengths: [
      'State-of-the-art open-weights reasoning performance',
      'Can be self-hosted locally or on private cloud infrastructure',
      'Unbeatable cost-per-token efficiency'
    ],
    weaknesses: 'Requires enterprise self-hosting setup for ultra-low latency guarantees.',
    idealRole: 'Privacy-restricted enterprise codebases, on-premise coding agents, and self-hosted clusters.',
    contextWindow: '64k–128k tokens'
  }
];

export default function FrontierModelsDiagram() {
  const [activeId, setActiveId] = useState<string>('claude-sonnet');
  const activeModel = MODELS.find(m => m.id === activeId) || MODELS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Frontier Model Comparison for Coding (2025–2026)</span>
      </div>

      {/* Model Selector Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: '10px',
        padding: '16px',
        background: '#0d0f1e',
        borderBottom: '1px solid #1e2342'
      }}>
        {MODELS.map((model) => {
          const isActive = activeId === model.id;
          return (
            <button
              key={model.id}
              onClick={() => setActiveId(model.id)}
              style={{
                background: isActive ? `${model.color}18` : '#13162b',
                border: `1.5px solid ${isActive ? model.color : '#1e2342'}`,
                borderRadius: '8px',
                padding: '10px 12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontSize: '9px', fontWeight: 800, color: model.color, textTransform: 'uppercase', marginBottom: '2px' }}>
                {model.provider}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                {model.name}
              </div>
            </button>
          );
        })}
      </div>

      {/* Content Inspector Card */}
      <div style={{ padding: '20px', background: '#090b14' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: activeModel.color }}>
              {activeModel.name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
              {activeModel.provider} • <span style={{ color: activeModel.color, fontWeight: 600 }}>{activeModel.tier}</span>
            </div>
          </div>

          <div style={{ fontSize: '11px', fontWeight: 700, color: activeModel.color, background: `${activeModel.color}15`, padding: '4px 10px', borderRadius: '4px', border: `1px solid ${activeModel.color}30` }}>
            Context Window: {activeModel.contextWindow}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '14px' }}>
          {/* Key Strengths */}
          <div style={{ background: '#13162b', padding: '14px', borderRadius: '8px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '8px' }}>
              Primary Coding Strengths
            </div>
            <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
              {activeModel.strengths.map((str, idx) => (
                <li key={idx} style={{ marginBottom: '6px' }}>{str}</li>
              ))}
            </ul>
          </div>

          {/* Weaknesses / Tradeoffs */}
          <div style={{ background: '#13162b', padding: '14px', borderRadius: '8px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', marginBottom: '8px' }}>
              Known Trade-offs / Weaknesses
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.5' }}>
              {activeModel.weaknesses}
            </div>
          </div>
        </div>

        {/* Ideal Agentic Role */}
        <div style={{ background: `${activeModel.color}10`, padding: '10px 14px', borderRadius: '6px', borderLeft: `3px solid ${activeModel.color}`, fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          <strong style={{ color: activeModel.color }}>Ideal Agentic Role: </strong>
          {activeModel.idealRole}
        </div>
      </div>
    </div>
  );
}
