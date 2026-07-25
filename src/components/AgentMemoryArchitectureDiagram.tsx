import React, { useState } from 'react';

interface MemoryType {
  id: string;
  name: string;
  badge: string;
  color: string;
  scope: string;
  description: string;
  exampleData: string;
}

const MEMORY_TYPES: MemoryType[] = [
  {
    id: 'working',
    name: '1. Working Memory (In-Context)',
    badge: 'EPHEMERAL',
    color: '#38bdf8', // Sky Blue
    scope: 'Current session / token window (8k–200k tokens)',
    description: 'Active conversation turn history, loaded system prompts, and immediate tool execution results.',
    exampleData: 'Messages: [{role: "user", text: "Fix NPE"}, {role: "tool", text: "PaymentService.java:42"}]'
  },
  {
    id: 'semantic',
    name: '2. Semantic Memory (Vector Store)',
    badge: 'VECTOR DB',
    color: '#a78bfa', // Purple
    scope: 'Across sessions (Persistent lifetime)',
    description: 'Vector embeddings representing facts, documentation chunks, and domain knowledge retrieved via cosine similarity.',
    exampleData: 'Embedding query("Spring Boot transaction isolation") -> Top 3 vector matches from Pinecone'
  },
  {
    id: 'episodic',
    name: '3. Episodic Memory (Experience Log)',
    badge: 'PROCEDURAL',
    color: '#fbbf24', // Amber
    scope: 'Across past problem-solving attempts',
    description: 'Historical log of past agent attempts and solutions ("I fixed a similar deadlock in order-service using Redisson lock").',
    exampleData: 'Episode: { problem: "HikariCP pool exhaustion", solution: "Set max-lifetime < DB idle timeout" }'
  }
];

export default function AgentMemoryArchitectureDiagram() {
  const [activeId, setActiveId] = useState<string>('working');
  const activeMem = MEMORY_TYPES.find(m => m.id === activeId) || MEMORY_TYPES[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Agent Memory Systems Architecture</span>
      </div>

      {/* Memory Grid */}
      <div style={{ padding: '16px 20px', background: '#0d0f1e', borderBottom: '1px solid #1e2342' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {MEMORY_TYPES.map((m) => {
            const isActive = activeId === m.id;
            return (
              <div
                key={m.id}
                onClick={() => setActiveId(m.id)}
                style={{
                  background: isActive ? `${m.color}18` : '#13162b',
                  border: `1.5px solid ${isActive ? m.color : '#1e2342'}`,
                  borderRadius: '8px',
                  padding: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '9px', fontWeight: 800, color: m.color, background: `${m.color}20`, padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                  {m.badge}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                  {m.name.split('. ')[1]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Memory Details Panel */}
      <div className="interactive-diagram-details-card" style={{ background: '#090b14', padding: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: activeMem.color, marginBottom: '4px' }}>
          {activeMem.name}
        </div>
        <div style={{ fontSize: '12px', color: activeMem.color, marginBottom: '10px', fontWeight: 600 }}>
          Scope: {activeMem.scope}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
          {activeMem.description}
        </div>

        <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
            Data Payload Representation
          </div>
          <pre style={{
            background: '#090b14',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '11px',
            color: 'var(--ifm-color-content)',
            margin: 0,
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace'
          }}>
            {activeMem.exampleData}
          </pre>
        </div>
      </div>
    </div>
  );
}
