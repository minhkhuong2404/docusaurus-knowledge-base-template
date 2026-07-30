import React, { useState } from 'react';

interface RouteTier {
  id: string;
  tierName: string;
  modelExamples: string;
  color: string;
  tasks: string[];
  rationale: string;
  relativeCost: string;
}

const TIERS: RouteTier[] = [
  {
    id: 'frontier',
    tierName: 'Frontier / Reasoning Tier',
    modelExamples: 'Claude 3.7 Sonnet (Extended) / OpenAI o1 / o3-mini',
    color: '#38bdf8', // Sky Blue
    tasks: ['Multi-step architectural planning', 'System design decomposition', 'Complex concurrency & race condition debugging', 'High-stakes code review'],
    rationale: 'Maximum cognitive reasoning capacity required. Dedicated reasoning tokens prevent flawed architecture plans.',
    relativeCost: 'High ($3.00–$15.00 / M tokens)'
  },
  {
    id: 'mid',
    tierName: 'Mid-Tier Workhorse',
    modelExamples: 'Claude 3.5 Sonnet / GPT-4o',
    color: '#a78bfa', // Purple
    tasks: ['Feature implementation & code writing', 'Unit test generation', 'Multi-file diff patches', 'Technical documentation drafting'],
    rationale: 'Optimal balance of fast inference speed, high code quality, and moderate token cost for standard developer workflows.',
    relativeCost: 'Moderate ($2.50–$3.00 / M tokens)'
  },
  {
    id: 'fast',
    tierName: 'Fast / Lightweight Tier',
    modelExamples: 'Claude 3.5 Haiku / GPT-4o-mini',
    color: '#34d399', // Emerald
    tasks: ['Tool call argument formatting', 'JSON Schema validation', 'Issue triage & classification', 'Short text summarization'],
    rationale: 'Low reasoning complexity. Sub-second response latency and ultra-low cost for high-frequency internal agent steps.',
    relativeCost: 'Low ($0.15–$0.80 / M tokens)'
  },
  {
    id: 'embed',
    tierName: 'Task-Specialized Embedding Tier',
    modelExamples: 'OpenAI text-embedding-3-large / Cohere Embed',
    color: '#fbbf24', // Amber
    tasks: ['Semantic codebase search', 'Vector RAG retrieval', 'Document chunk similarity scoring'],
    rationale: 'Task-specialized vector space embeddings. Cannot generate text, but offers ultra-cheap mathematical similarity matching.',
    relativeCost: 'Ultra-Low ($0.02–$0.13 / M tokens)'
  }
];

export default function ModelRoutingArchitectureDiagram() {
  const [activeId, setActiveId] = useState<string>('frontier');
  const activeTier = TIERS.find(t => t.id === activeId) || TIERS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Automated Model Routing & Cost Optimization Architecture</span>
      </div>

      {/* Task Router Flow Visualizer */}
      <div style={{ padding: '16px 20px', background: '#0d0f1e', borderBottom: '1px solid #1e2342' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', marginBottom: '10px' }}>
          Dynamic Task Router Pipeline
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {TIERS.map((tier) => {
            const isActive = activeId === tier.id;
            return (
              <div
                key={tier.id}
                onClick={() => setActiveId(tier.id)}
                style={{
                  background: isActive ? `${tier.color}18` : '#13162b',
                  border: `1.5px solid ${isActive ? tier.color : '#1e2342'}`,
                  borderRadius: '8px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? `0 0 12px ${tier.color}25` : 'none'
                }}
              >
                <div style={{ fontSize: '10px', fontWeight: 800, color: tier.color, textTransform: 'uppercase', marginBottom: '4px' }}>
                  {tier.tierName.split(' ')[0]} TIER
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                  {tier.tierName.split(' — ')[0]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Tier Details Panel */}
      <div className="interactive-diagram-details-card" style={{ background: '#090b14', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: activeTier.color }}>
              {activeTier.tierName}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
              Target Models: <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>{activeTier.modelExamples}</span>
            </div>
          </div>

          <div style={{ fontSize: '11px', fontWeight: 700, color: activeTier.color, background: `${activeTier.color}15`, padding: '4px 10px', borderRadius: '4px', border: `1px solid ${activeTier.color}30` }}>
            Cost: {activeTier.relativeCost}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '14px' }}>
          <div style={{ background: '#13162b', padding: '14px', borderRadius: '8px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: activeTier.color, textTransform: 'uppercase', marginBottom: '8px' }}>
              Routed Subtasks
            </div>
            <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
              {activeTier.tasks.map((task, idx) => (
                <li key={idx} style={{ marginBottom: '6px' }}>{task}</li>
              ))}
            </ul>
          </div>

          <div style={{ background: '#13162b', padding: '14px', borderRadius: '8px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '8px' }}>
              Routing Rationale
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.5' }}>
              {activeTier.rationale}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
