import React, { useState } from 'react';

interface MemoryTypeDetail {
  id: string;
  name: string;
  badge: string;
  color: string;
  category: 'In-Context (Ephemeral)' | 'External (Persistent)';
  readWriteMechanism: string;
  exampleUse: string;
}

const MEMORY_DETAILS: MemoryTypeDetail[] = [
  {
    id: 'working',
    name: '1. Working Memory (In-Context)',
    badge: 'EPHEMERAL',
    color: '#38bdf8', // Sky Blue
    category: 'In-Context (Ephemeral)',
    readWriteMechanism: 'Agent reads & writes active message thread, system instructions, and tool outputs directly inside the LLM token context window.',
    exampleUse: 'Current conversation history, user preferences declared in current session, active code diff under review.'
  },
  {
    id: 'episodic',
    name: '2. Episodic Memory (Past Summaries)',
    badge: 'HISTORICAL',
    color: '#a78bfa', // Purple
    category: 'External (Persistent)',
    readWriteMechanism: 'Agent retrieves distilled summaries of previous conversation threads and past task runs to preserve continuity.',
    exampleUse: '"User preferred TypeScript over JavaScript in session #42", past debugging session outcome logs.'
  },
  {
    id: 'semantic',
    name: '3. Semantic Memory (Knowledge Base)',
    badge: 'VECTOR DB',
    color: '#fbbf24', // Amber
    category: 'External (Persistent)',
    readWriteMechanism: 'Agent executes dense vector similarity search (Pinecone/Qdrant) over indexed codebase files, documentation, and wikis.',
    exampleUse: 'Retrieving API endpoint specs, database entity schemas, corporate HR policy rules.'
  },
  {
    id: 'procedural',
    name: '4. Procedural Memory (Skill Exemplars)',
    badge: 'INSTRUCTIONAL',
    color: '#34d399', // Emerald
    category: 'External (Persistent)',
    readWriteMechanism: 'Agent retrieves few-shot task exemplars, AGENTS.md rules, and step-by-step workflow templates.',
    exampleUse: 'Standard operating procedures for creating a pull request, strict linting and formatting rules.'
  }
];

export default function FourMemoryTypesDiagram() {
  const [activeId, setActiveId] = useState<string>('working');
  const current = MEMORY_DETAILS.find(m => m.id === activeId) || MEMORY_DETAILS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>The Four Memory Types: Scope & Storage Mechanisms</span>
      </div>

      {/* Grid Selector */}
      <div style={{ padding: '16px 20px', background: '#0d0f1e', borderBottom: '1px solid #1e2342' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '10px'
        }}>
          {MEMORY_DETAILS.map((m) => {
            const isActive = activeId === m.id;
            return (
              <div
                key={m.id}
                onClick={() => setActiveId(m.id)}
                style={{
                  background: isActive ? `${m.color}18` : '#13162b',
                  border: `1.5px solid ${isActive ? m.color : '#1e2342'}`,
                  borderRadius: '8px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '9px', fontWeight: 800, color: m.color, background: `${m.color}20`, padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                  {m.badge}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                  {m.name.split('. ')[1]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Card */}
      <div className="interactive-diagram-details-card" style={{ background: '#090b14', padding: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: current.color, marginBottom: '4px' }}>
          {current.name}
        </div>
        <div style={{ fontSize: '11px', color: current.color, fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
          Category: {current.category}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: current.color, textTransform: 'uppercase', marginBottom: '4px' }}>
              Read / Write Mechanism
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              {current.readWriteMechanism}
            </div>
          </div>

          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
              Production Example Use Case
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              {current.exampleUse}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
