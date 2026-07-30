import React, { useState } from 'react';

interface Strategy {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  badge: string;
  goal: string;
  workflow: string[];
  rules: string[];
  primaryRisk: string;
}

const STRATEGIES: Strategy[] = [
  {
    id: 'greenfield',
    title: 'Greenfield (0-to-1 Apps)',
    subtitle: 'Rapid prototype to working architecture without early technical debt',
    color: '#38bdf8', // Sky Blue
    badge: 'NEW BUILD',
    goal: 'Build full-stack functional MVP rapidly while maintaining clean separation of layers.',
    workflow: [
      'Generate explicit ARCHITECTURE.md & DB entity schemas first',
      'Implement DB Data Layer -> Service Layer -> REST Controller sequentially',
      'Create baseline AGENTS.md defining tech stack versions & coding rules',
      'Generate automated integration tests for happy-path API endpoints'
    ],
    rules: [
      'Do not jump directly to writing UI code before backend contracts exist',
      'Keep module boundaries clean (SRP) to avoid refactoring later',
      'Define data transfer objects (DTOs) as records'
    ],
    primaryRisk: 'Unstructured boilerplate accumulation leading to instant architectural debt.'
  },
  {
    id: 'legacy',
    title: 'Legacy Monoliths',
    subtitle: 'Safely refactor or enhance existing code without breaking regression tests',
    color: '#a78bfa', // Purple
    badge: 'MAINTENANCE',
    goal: 'Modify or migrate complex modules with minimal blast radius and zero downtime.',
    workflow: [
      'Verify 100% regression test pass on legacy module before editing',
      'Use Scoped Prompting: edit one isolated class/file at a time',
      'Provide exact interfaces/docstrings to agent rather than entire codebase',
      'Run build & test suites immediately after every file modification'
    ],
    rules: [
      'Do NOT allow agent to touch unrelated files outside specified task scope',
      'Do NOT upgrade third-party library versions mid-task',
      'Preserve existing public API signatures and docstrings'
    ],
    primaryRisk: 'Agent over-refactoring unrelated files causing mass merge conflicts.'
  },
  {
    id: 'bugfix',
    title: 'Production Bug Fixing',
    subtitle: 'Surgical diagnostic and remediation with zero side effects',
    color: '#fbbf24', // Amber
    badge: 'HOTFIX',
    goal: 'Diagnose root cause under load, write a reproducing test, and apply a surgical fix.',
    workflow: [
      'Feed exact stacktrace and production environment context into LLM',
      'Direct agent to write a FAILING regression test reproducing the issue FIRST',
      'Apply surgical code fix specifically targeting the failing assertion',
      'Execute full test suite to verify fix passes alongside all existing tests'
    ],
    rules: [
      'Never apply a "quick fix" patch without a reproducing test',
      'Avoid swallowing exceptions or returning dummy fallback values',
      'Identify root cause (concurrency, NPE, resource leak) before mutating code'
    ],
    primaryRisk: 'Layering quick patches on top of bugs, resulting in infinite guessing loops.'
  }
];

export default function VibeCodingStrategiesDiagram() {
  const [activeId, setActiveId] = useState<string>('greenfield');
  const activeStrategy = STRATEGIES.find(s => s.id === activeId) || STRATEGIES[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Vibe Coding Strategies by Project Type</span>
      </div>

      {/* Selector Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
                padding: '12px 14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: strat.color, background: `${strat.color}20`, padding: '2px 6px', borderRadius: '4px' }}>
                  {strat.badge}
                </span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                {strat.title}
              </div>
            </button>
          );
        })}
      </div>

      {/* Details Display Grid */}
      <div style={{ padding: '20px', background: '#090b14' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '18px', fontWeight: 700, color: activeStrategy.color, marginBottom: '4px' }}>
            {activeStrategy.title}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)' }}>
            {activeStrategy.subtitle}
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {/* Step-by-Step Workflow */}
          <div style={{ background: '#13162b', padding: '16px', borderRadius: '8px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: activeStrategy.color, textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              Recommended Execution Workflow
            </div>
            <ol style={{ paddingLeft: '18px', margin: 0, fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
              {activeStrategy.workflow.map((step, idx) => (
                <li key={idx} style={{ marginBottom: '8px' }}>{step}</li>
              ))}
            </ol>
          </div>

          {/* Strict Scoping Rules */}
          <div style={{ background: '#13162b', padding: '16px', borderRadius: '8px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Strict Scoping & Guardrails
            </div>
            <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
              {activeStrategy.rules.map((rule, idx) => (
                <li key={idx} style={{ marginBottom: '8px' }}>{rule}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Primary Risk Warning */}
        <div style={{
          marginTop: '16px',
          background: '#f8717110',
          border: '1px solid #f8717130',
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
            <strong style={{ color: '#f87171' }}>Primary Risk to Avoid: </strong>
            {activeStrategy.primaryRisk}
          </div>
        </div>
      </div>
    </div>
  );
}
