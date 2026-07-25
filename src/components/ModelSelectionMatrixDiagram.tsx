import React, { useState } from 'react';

interface Scenario {
  id: string;
  title: string;
  category: string;
  color: string;
  recTool: string;
  recModel: string;
  rationale: string;
  checklist: string[];
}

const SCENARIOS: Scenario[] = [
  {
    id: 'greenfield',
    title: 'Greenfield App (0-to-1)',
    category: 'Rapid Full-Stack Prototyping',
    color: '#38bdf8', // Sky Blue
    recTool: 'Cursor Composer or Replit Agent',
    recModel: 'Claude 3.5 Sonnet / GPT-4o',
    rationale: 'Requires high multi-file scaffolding speed, clean boilerplate generation, and instant full-stack iteration.',
    checklist: [
      'Generate explicit ARCHITECTURE.md spec before prompting',
      'Use Cursor Composer to build DB models -> Service -> API Controllers',
      'Keep files small and modular (SRP) from day one'
    ]
  },
  {
    id: 'refactor',
    title: 'Multi-File Monolith Refactor',
    category: '20+ Files Architecture Change',
    color: '#a78bfa', // Purple
    recTool: 'Cursor Composer or Windsurf Cascade',
    recModel: 'Claude 3.7 Sonnet / OpenAI o3-mini',
    rationale: 'Requires deep multi-file attention fidelity, low diff hallucination, and strong architectural reasoning.',
    checklist: [
      'Lock down regression test suite before modifying legacy code',
      'Use Scoped Prompting: specify exact line ranges or class files',
      'Run `./gradlew test` after modifying each individual file'
    ]
  },
  {
    id: 'deadlock',
    title: 'Concurrency & Deadlock Fix',
    category: 'Deep Multi-Thread Diagnostics',
    color: '#f87171', // Red
    recTool: 'IDE Assistant / Cursor Chat',
    recModel: 'OpenAI o1 / o3-mini (Extended Reasoning)',
    rationale: 'Requires internal reasoning tokens (CoT) to mentally model race conditions, lock ordering, and thread safety.',
    checklist: [
      'Paste exact thread dump and log stacktrace into context',
      'Direct agent to write a FAILING test reproducing the race condition first',
      'Apply surgical fix avoiding quick patches or swallowed exceptions'
    ]
  },
  {
    id: 'logs',
    title: 'Repository-wide Log Analysis',
    category: '500MB Log / Codebase Ingestion',
    color: '#fbbf24', // Amber
    recTool: 'Custom RAG Script / Agent Harness',
    recModel: 'Gemini 2.0 Pro (2M Context Window)',
    rationale: 'Leverages Gemini’s massive 2,000,000 token context window to ingest entire log files without chunking loss.',
    checklist: [
      'Feed entire raw log trace into a single Gemini prompt',
      'Ask for anomaly timeline clustering and root cause correlation',
      'Extract exact timestamps and failing pod identifiers'
    ]
  },
  {
    id: 'enterprise',
    title: 'Privacy-Restricted Codebase',
    color: '#34d399', // Emerald
    category: 'Strict On-Premise Data Isolation',
    recTool: 'OpenHands + Local IDE Extension',
    recModel: 'Self-hosted DeepSeek R1 / CodeLlama',
    rationale: 'Guarantees 100% data privacy with zero third-party cloud data transmission.',
    checklist: [
      'Deploy OpenHands in local Docker sandbox on private GPU cluster',
      'Connect local IDE extension to private Ollama / vLLM endpoint',
      'Verify strict network firewall rules prevent external data egress'
    ]
  }
];

export default function ModelSelectionMatrixDiagram() {
  const [activeId, setActiveId] = useState<string>('greenfield');
  const current = SCENARIOS.find(s => s.id === activeId) || SCENARIOS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Interactive Tool & Model Selection Decision Matrix</span>
      </div>

      {/* Scenario Selector Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: '10px',
        padding: '16px',
        background: '#0d0f1e',
        borderBottom: '1px solid #1e2342'
      }}>
        {SCENARIOS.map((sc) => {
          const isActive = activeId === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => setActiveId(sc.id)}
              style={{
                background: isActive ? `${sc.color}18` : '#13162b',
                border: `1.5px solid ${isActive ? sc.color : '#1e2342'}`,
                borderRadius: '8px',
                padding: '10px 12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontSize: '9px', fontWeight: 800, color: sc.color, textTransform: 'uppercase', marginBottom: '2px' }}>
                {sc.category.split(' ')[0]}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                {sc.title}
              </div>
            </button>
          );
        })}
      </div>

      {/* Scenario Recommendation Card */}
      <div style={{ padding: '20px', background: '#090b14' }}>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '18px', fontWeight: 700, color: current.color, marginBottom: '2px' }}>
            Scenario: {current.title}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
            {current.category}
          </div>
        </div>

        {/* Recommended Tool & Model Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '14px' }}>
          <div style={{ background: '#13162b', padding: '14px', borderRadius: '8px', border: `1px solid ${current.color}40` }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: current.color, textTransform: 'uppercase', marginBottom: '4px' }}>
              Recommended Tool Platform
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
              {current.recTool}
            </div>
          </div>

          <div style={{ background: '#13162b', padding: '14px', borderRadius: '8px', border: '1px solid #34d39940' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
              Recommended Model Engine
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
              {current.recModel}
            </div>
          </div>
        </div>

        {/* Execution Rationale */}
        <div style={{ background: '#13162b', padding: '12px 14px', borderRadius: '6px', borderLeft: `3px solid ${current.color}`, fontSize: '12px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px' }}>
          <strong style={{ color: current.color }}>Selection Rationale: </strong>
          {current.rationale}
        </div>

        {/* Best Practice Action Checklist */}
        <div style={{ background: '#13162b', padding: '14px', borderRadius: '8px', border: '1px solid #1e2342' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '8px' }}>
            Execution Best Practices
          </div>
          <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
            {current.checklist.map((item, idx) => (
              <li key={idx} style={{ marginBottom: '6px' }}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
