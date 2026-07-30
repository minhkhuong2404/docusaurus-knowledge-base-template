import React, { useState } from 'react';

interface Strategy {
  id: string;
  name: string;
  badge: string;
  color: string;
  icon: string;
  whatItDoes: string;
  whenToUse: string;
  example: string;
  tokenSaving: string;
}

const STRATEGIES: Strategy[] = [
  {
    id: 'retrieval',
    name: 'Retrieval Strategy',
    badge: 'DYNAMIC SEARCH',
    color: '#38bdf8', // Sky Blue
    icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    whatItDoes: 'Dynamically searches and loads only the specific files, AST nodes, and API schemas relevant to the current step.',
    whenToUse: 'Long-running developer tasks in large codebases (>50 files) or massive documentation knowledge bases.',
    example: 'Instead of loading all 40 Java files in /service, vector-search query returns only PaymentService.java and OrderRepository.java.',
    tokenSaving: 'Saves 80%–95% of total codebase context tokens per prompt.'
  },
  {
    id: 'offloading',
    name: 'Offloading Strategy',
    badge: 'EXTERNAL STORE',
    color: '#a78bfa', // Purple
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    whatItDoes: 'Moves large completed outputs (e.g. 5,000-line build logs, intermediate test outputs) to disk or key-value storage, keeping only a reference handle in memory.',
    whenToUse: 'After executing heavy CLI tool calls or generating intermediate build artifacts.',
    example: 'Write raw test execution output to /tmp/test_results.log; pass file handle and a 2-line pass/fail status string back to LLM context.',
    tokenSaving: 'Reclaims 10,000+ tokens of raw tool output noise.'
  },
  {
    id: 'isolation',
    name: 'Isolation Strategy',
    badge: 'SUBAGENTS',
    color: '#34d399', // Emerald
    icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    whatItDoes: 'Spawns dedicated subagents with fresh, empty context windows for independent subtasks (e.g., code reviewer, doc generator).',
    whenToUse: 'When a subtask doesn’t need the parent orchestrator’s accumulated 30-turn conversation history.',
    example: 'Parent agent delegates code security audit to a subagent; subagent returns a 3-line security verdict back to parent.',
    tokenSaving: 'Prevents parent orchestrator context window pollution.'
  },
  {
    id: 'compression',
    name: 'Compression Strategy',
    badge: 'PROACTIVE COMPACT',
    color: '#fbbf24', // Amber
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    whatItDoes: 'Summarizes or prunes the oldest portion of conversation history when RAM capacity reaches 60%–70%.',
    whenToUse: 'Proactively during long vibe-coding sessions before hitting hard attention degradation limits.',
    example: 'Compress turns 1–20 into a 200-token bulleted summary of decisions made, bugs fixed, and current build state.',
    tokenSaving: 'Reduces 30,000 tokens of conversation history to ~1,200 tokens.'
  }
];

export default function ContextEngineeringStrategiesDiagram() {
  const [activeId, setActiveId] = useState<string>('retrieval');
  const activeStrat = STRATEGIES.find(s => s.id === activeId) || STRATEGIES[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>The Four Pillars of Context Engineering</span>
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
        {STRATEGIES.map((strat) => {
          const isActive = activeId === strat.id;
          return (
            <button
              key={strat.id}
              onClick={() => setActiveId(strat.id)}
              style={{
                background: isActive ? `${strat.color}18` : '#13162b',
                border: `1.5px solid ${isActive ? strat.color : '#1e2342'}`,
                borderRadius: '8px',
                padding: '12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? `0 0 12px ${strat.color}25` : 'none'
              }}
            >
              <div style={{ fontSize: '9px', fontWeight: 800, color: strat.color, background: `${strat.color}20`, padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '6px' }}>
                {strat.badge}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                {strat.name.split(' ')[0]}
              </div>
            </button>
          );
        })}
      </div>

      {/* Strategy Detail Panel */}
      <div className="interactive-diagram-details-card" style={{ background: '#090b14', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeStrat.color }} />
          <div style={{ fontSize: '17px', fontWeight: 700, color: activeStrat.color }}>
            {activeStrat.name}
          </div>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
          {activeStrat.whatItDoes}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: activeStrat.color, textTransform: 'uppercase', marginBottom: '4px' }}>
              When To Deploy
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              {activeStrat.whenToUse}
            </div>
          </div>

          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
              Real-World Example
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
              {activeStrat.example}
            </div>
          </div>
        </div>

        <div style={{ background: `${activeStrat.color}10`, padding: '10px 14px', borderRadius: '6px', borderLeft: `3px solid ${activeStrat.color}`, fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          <strong style={{ color: activeStrat.color }}>Token Overhead Reduction: </strong>
          {activeStrat.tokenSaving}
        </div>
      </div>
    </div>
  );
}
