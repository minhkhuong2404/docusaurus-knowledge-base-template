import React, { useState } from 'react';

interface IdeStage {
  step: number;
  title: string;
  badge: string;
  color: string;
  description: string;
  ideAction: string;
}

const IDE_STAGES: IdeStage[] = [
  {
    step: 1,
    title: '1. Indexing & Context Retrieval',
    badge: 'INDEXING',
    color: '#38bdf8', // Sky Blue
    description: 'The IDE builds an in-memory Merkle tree index of your codebase using Tree-sitter AST parsing + vector embeddings.',
    ideAction: 'Scans /src, extracts class signatures, imports, open editor tabs, and recent Git diffs into working context.'
  },
  {
    step: 2,
    title: '2. Composer Agent Prompt Assembly',
    badge: 'PROMPT BUILD',
    color: '#a78bfa', // Purple
    description: 'Combines user prompt with active cursor position, relevant AST symbols, AGENTS.md rules, and open file contents.',
    ideAction: 'Constructs XML-tagged prompt payload: <system_rules>, <active_file>, <referenced_symbols>, <user_intent>.'
  },
  {
    step: 3,
    title: '3. Multi-File AST Diff Mutation',
    badge: 'DIFF EDIT',
    color: '#fbbf24', // Amber
    description: 'The LLM streams code edits back to the IDE using search/replace block patches across multiple files.',
    ideAction: 'Applies diff patches directly to editor buffer; presents red/green visual diff highlights for developer approval.'
  },
  {
    step: 4,
    title: '4. Terminal Execution & Self-Correction',
    badge: 'TERMINAL & TEST',
    color: '#34d399', // Emerald
    description: 'The agent executes compiler build commands (`npm test` or `./gradlew build`) in a background terminal session.',
    ideAction: 'If tests fail, harness captures error stacktrace, feeds it back to the agent loop, and auto-applies a bugfix patch.'
  }
];

export default function IdeCodingAgentMechanicsDiagram() {
  const [activeStep, setActiveStep] = useState<number>(3);
  const current = IDE_STAGES.find(s => s.step === activeStep) || IDE_STAGES[2];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>How IDE Coding Agents (Cursor / Windsurf / Antigravity) Work</span>
      </div>

      {/* Grid Stepper */}
      <div style={{ padding: '20px', background: '#0d0f1e' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
          marginBottom: '20px'
        }}>
          {IDE_STAGES.map((s) => {
            const isActive = activeStep === s.step;
            return (
              <div
                key={s.step}
                onClick={() => setActiveStep(s.step)}
                style={{
                  background: isActive ? `${s.color}18` : '#13162b',
                  border: `1.5px solid ${isActive ? s.color : '#1e2342'}`,
                  borderRadius: '8px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '9px', fontWeight: 800, color: s.color, textTransform: 'uppercase', marginBottom: '2px' }}>
                  STAGE {s.step} • {s.badge}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                  {s.title.split('. ')[1]}
                </div>
              </div>
            );
          })}
        </div>

        {/* Stage Detail Panel */}
        <div className="interactive-diagram-details-card" style={{ background: '#090b14', border: `1px solid ${current.color}40`, borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: current.color, marginBottom: '6px' }}>
            {current.title}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
            {current.description}
          </div>

          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: current.color, textTransform: 'uppercase', marginBottom: '4px' }}>
              Under-The-Hood IDE Action
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              {current.ideAction}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
