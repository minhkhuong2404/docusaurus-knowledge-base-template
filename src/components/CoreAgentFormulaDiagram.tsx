import React, { useState } from 'react';

interface ComponentInfo {
  id: string;
  name: string;
  badge: string;
  color: string;
  role: string;
  details: string[];
  formulaPart: string;
}

const COMPONENTS: ComponentInfo[] = [
  {
    id: 'brain',
    name: '1. Brain (LLM Reasoning Engine)',
    badge: 'COGNITION',
    color: '#38bdf8', // Sky Blue
    role: 'Central executive cognitive engine that parses user intent, evaluates tool results, and makes routing decisions.',
    details: [
      'Executes zero-shot and chain-of-thought reasoning',
      'Selects which tools to invoke and constructs JSON arguments',
      'Evaluates termination criteria to decide when the goal is achieved'
    ],
    formulaPart: 'LLM (Brain)'
  },
  {
    id: 'memory',
    name: '2. Memory (Short-Term & Long-Term)',
    badge: 'PERSISTENCE',
    color: '#a78bfa', // Purple
    role: 'Provides state persistence across turn history, user preferences, and vector database embeddings.',
    details: [
      'Short-term (In-Context): Working token window message thread',
      'Long-term (Semantic): Vector database similarity search (Pinecone/Qdrant)',
      'Episodic (Procedural): Past problem-solving execution traces'
    ],
    formulaPart: '+ Memory'
  },
  {
    id: 'planning',
    name: '3. Planning & Reflection',
    badge: 'STRATEGY',
    color: '#fbbf24', // Amber
    role: 'Decomposes complex goals into manageable task DAGs and self-evaluates outputs against rules.',
    details: [
      'Task Decomposition: Splits 0-to-1 build goals into subtasks',
      'Self-Reflection: Critiques drafts and fixes compiler/test errors',
      'Re-planning: Adjusts DAG when a tool execution fails'
    ],
    formulaPart: '+ Planning'
  },
  {
    id: 'tools',
    name: '4. Tools & Environment Interfaces',
    badge: 'EXECUTION',
    color: '#34d399', // Emerald
    role: 'Allows the LLM to interact with the real world (web search, terminal, APIs, databases).',
    details: [
      'MCP Servers: Standardized connectors (Postgres, GitHub, Slack)',
      'Sandboxed Runtime: MicroVM / Docker code execution environment',
      'File System I/O: Multi-file AST editing and Git diff generation'
    ],
    formulaPart: '+ Tools'
  }
];

export default function CoreAgentFormulaDiagram() {
  const [activeId, setActiveId] = useState<string>('brain');
  const current = COMPONENTS.find(c => c.id === activeId) || COMPONENTS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>The Core Agent Formula: Agent = LLM + Memory + Planning + Tools</span>
      </div>

      {/* Formula Component Bar */}
      <div style={{ padding: '20px', background: '#0d0f1e', borderBottom: '1px solid #1e2342' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', marginBottom: '10px' }}>
          Interactive Formula Anatomy
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px'
        }}>
          {COMPONENTS.map((c) => {
            const isActive = activeId === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setActiveId(c.id)}
                style={{
                  background: isActive ? `${c.color}18` : '#13162b',
                  border: `2px solid ${isActive ? c.color : '#1e2342'}`,
                  borderRadius: '8px',
                  padding: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? `0 0 12px ${c.color}25` : 'none'
                }}
              >
                <div style={{ fontSize: '9px', fontWeight: 800, color: c.color, textTransform: 'uppercase', marginBottom: '2px' }}>
                  {c.badge}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                  {c.formulaPart}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Component Details Card */}
      <div className="interactive-diagram-details-card" style={{ background: '#090b14', padding: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: current.color, marginBottom: '6px' }}>
          {current.name}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
          {current.role}
        </div>

        <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: current.color, textTransform: 'uppercase', marginBottom: '6px' }}>
            Key Capabilities & Sub-systems
          </div>
          <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.5' }}>
            {current.details.map((d, i) => (
              <li key={i} style={{ marginBottom: '4px' }}>{d}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
