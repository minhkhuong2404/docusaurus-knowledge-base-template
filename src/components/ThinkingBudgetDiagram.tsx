import React, { useState } from 'react';

interface BudgetTier {
  id: string;
  complexity: string;
  budgetTokens: string;
  color: string;
  badge: string;
  description: string;
  sampleTask: string;
  costImpact: string;
}

const BUDGETS: BudgetTier[] = [
  {
    id: 'disabled',
    complexity: 'Trivial Complexity (Level 1)',
    budgetTokens: '0 Tokens (Disabled)',
    color: '#34d399', // Emerald
    badge: 'DISABLED',
    description: 'Internal thinking phase is disabled. Model emits response tokens immediately without reasoning steps.',
    sampleTask: 'Reformat JSON output, classify customer sentiment, convert String to Date.',
    costImpact: 'Zero reasoning token cost overhead.'
  },
  {
    id: 'moderate',
    complexity: 'Moderate Complexity (Level 2–3)',
    budgetTokens: '2,000–5,000 Tokens',
    color: '#38bdf8', // Sky Blue
    badge: 'STANDARD',
    description: 'Sufficient budget for short step-by-step planning before emitting code diffs.',
    sampleTask: 'Implement a new JPA repository method, write a unit test class for an existing service.',
    costImpact: 'Adds ~$0.01–$0.05 per API call.'
  },
  {
    id: 'complex',
    complexity: 'High Complexity (Level 4)',
    budgetTokens: '8,000–16,000 Tokens',
    color: '#a78bfa', // Purple
    badge: 'EXTENDED',
    description: 'Deep internal CoT reasoning allowing the model to simulate multi-threaded execution paths and edge cases.',
    sampleTask: 'Diagnose intermittent deadlock in multi-threaded worker, design distributed rate limiter.',
    costImpact: 'Adds ~$0.15–$0.50 per API call.'
  },
  {
    id: 'research',
    complexity: 'Research / Novel Architecture (Level 5)',
    budgetTokens: '32,000+ Tokens (Max)',
    color: '#fbbf24', // Amber
    badge: 'MAXIMUM',
    description: 'Unrestricted exploration where the model tests and discards multiple solution hypotheses internally.',
    sampleTask: 'Novel cryptographic protocol design, enterprise migration blueprint across 50+ microservices.',
    costImpact: 'Adds ~$0.75–$2.50+ per API call. Use sparingly!'
  }
];

export default function ThinkingBudgetDiagram() {
  const [activeId, setActiveId] = useState<string>('complex');
  const activeItem = BUDGETS.find(b => b.id === activeId) || BUDGETS[2];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Reasoning Model Thinking Budget Allocation Strategy</span>
      </div>

      {/* Selector Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '10px',
        padding: '16px',
        background: '#0d0f1e',
        borderBottom: '1px solid #1e2342'
      }}>
        {BUDGETS.map((b) => {
          const isActive = activeId === b.id;
          return (
            <button
              key={b.id}
              onClick={() => setActiveId(b.id)}
              style={{
                background: isActive ? `${b.color}18` : '#13162b',
                border: `1.5px solid ${isActive ? b.color : '#1e2342'}`,
                borderRadius: '8px',
                padding: '10px 12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontSize: '9px', fontWeight: 800, color: b.color, background: `${b.color}20`, padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                {b.badge}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                {b.budgetTokens}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Budget Details Panel */}
      <div className="interactive-diagram-details-card" style={{ background: '#090b14', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: activeItem.color }}>
              {activeItem.complexity}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)' }}>
              Reasoning Token Budget: <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>{activeItem.budgetTokens}</span>
            </div>
          </div>

          <div style={{ fontSize: '11px', fontWeight: 700, color: activeItem.color, background: `${activeItem.color}15`, padding: '4px 10px', borderRadius: '4px', border: `1px solid ${activeItem.color}30` }}>
            Cost Impact: {activeItem.costImpact}
          </div>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
          {activeItem.description}
        </div>

        <div style={{ background: '#13162b', padding: '12px 14px', borderRadius: '6px', borderLeft: `3px solid ${activeItem.color}`, fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          <strong style={{ color: activeItem.color }}>Target Task Examples: </strong>
          {activeItem.sampleTask}
        </div>
      </div>
    </div>
  );
}
