import React, { useState } from 'react';

interface SubagentRole {
  id: string;
  name: string;
  badge: string;
  color: string;
  contextInput: string;
  internalTools: string[];
  outputReturned: string;
  benefit: string;
}

const ROLES: SubagentRole[] = [
  {
    id: 'research',
    name: 'Subagent 1: Code Base Research',
    badge: 'FRESH CONTEXT',
    color: '#38bdf8', // Sky Blue
    contextInput: 'Only topic + tool definitions (e.g. "Find all files matching /payment/api")',
    internalTools: ['semantic_search', 'list_directory', 'read_file_header'],
    outputReturned: 'Returns ONLY file paths array: ["PaymentService.java", "OrderRepo.java"]',
    benefit: 'Performs 10 search tool calls without dumping 15,000 tokens of file contents into parent memory.'
  },
  {
    id: 'coder',
    name: 'Subagent 2: Feature Implementation',
    badge: 'ISOLATED AGENT',
    color: '#a78bfa', // Purple
    contextInput: 'Feature specification + 2 relevant file contents (No historical chat history)',
    internalTools: ['read_file', 'write_file', 'run_tests'],
    outputReturned: 'Returns ONLY modified code diff patch + build status string',
    benefit: 'Focuses 100% of context headroom on writing precise code diffs.'
  },
  {
    id: 'reviewer',
    name: 'Subagent 3: Security & Style Audit',
    badge: 'CRITIC AGENT',
    color: '#34d399', // Emerald
    contextInput: 'Modified code diff patch + AGENTS.md ruleset',
    internalTools: ['linter_check', 'security_scan'],
    outputReturned: 'Returns ONLY audit verdict: "Approved (0 vulnerabilities found)"',
    benefit: 'Evaluates code objectively without bias from earlier developer chat context.'
  }
];

export default function SubagentIsolationDiagram() {
  const [activeId, setActiveId] = useState<string>('research');
  const activeSubagent = ROLES.find(r => r.id === activeId) || ROLES[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Parent Orchestrator & Subagent Context Isolation</span>
      </div>

      {/* Orchestrator -> Subagents Visual Hierarchy */}
      <div style={{ padding: '16px 20px', background: '#0d0f1e', borderBottom: '1px solid #1e2342' }}>
        <div style={{
          background: '#13162b',
          border: '1.5px solid #38bdf840',
          borderRadius: '8px',
          padding: '12px 16px',
          textAlign: 'center',
          marginBottom: '14px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '2px' }}>
            PARENT ORCHESTRATOR AGENT
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
            Context Window: High-level Goal + Plan (Lean & Unpolluted)
          </div>
        </div>

        {/* Subagents Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {ROLES.map((role) => {
            const isActive = activeId === role.id;
            return (
              <div
                key={role.id}
                onClick={() => setActiveId(role.id)}
                style={{
                  background: isActive ? `${role.color}18` : '#13162b',
                  border: `1.5px solid ${isActive ? role.color : '#1e2342'}`,
                  borderRadius: '8px',
                  padding: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? `0 0 12px ${role.color}25` : 'none'
                }}
              >
                <div style={{ fontSize: '9px', fontWeight: 800, color: role.color, background: `${role.color}20`, padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                  {role.badge}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                  {role.name.split(': ')[1]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Subagent Details Panel */}
      <div className="interactive-diagram-details-card" style={{ background: '#090b14', padding: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: activeSubagent.color, marginBottom: '12px' }}>
          {activeSubagent.name}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: activeSubagent.color, textTransform: 'uppercase', marginBottom: '4px' }}>
              Minimal Subagent Input Context
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              {activeSubagent.contextInput}
            </div>
          </div>

          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
              Result Passed Back to Parent
            </div>
            <div style={{ fontSize: '12px', color: '#34d399', fontFamily: 'monospace' }}>
              {activeSubagent.outputReturned}
            </div>
          </div>
        </div>

        <div style={{ background: `${activeSubagent.color}10`, padding: '10px 14px', borderRadius: '6px', borderLeft: `3px solid ${activeSubagent.color}`, fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          <strong style={{ color: activeSubagent.color }}>Context Isolation Benefit: </strong>
          {activeSubagent.benefit}
        </div>
      </div>
    </div>
  );
}
