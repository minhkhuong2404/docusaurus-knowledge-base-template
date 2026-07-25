import React, { useState } from 'react';

interface MemoryTier {
  id: string;
  name: string;
  badge: string;
  color: string;
  scope: string;
  storageBackend: string;
  whatItStores: string;
  managementStrategy: string;
}

const TIERS: MemoryTier[] = [
  {
    id: 'short-term',
    name: '1. Short-Term Memory (In-Context)',
    badge: 'EPHEMERAL RAM',
    color: '#38bdf8', // Sky Blue
    scope: 'Current session / turn thread',
    storageBackend: 'LLM Context Window (8k–1M tokens)',
    whatItStores: 'Active user query, system prompt, recent tool call parameters, and intermediate reasoning steps.',
    managementStrategy: 'Context Compaction, sliding window trimming, tool result pruning at 70% RAM capacity.'
  },
  {
    id: 'long-term',
    name: '2. Long-Term Memory (Semantic & Episodic)',
    badge: 'PERSISTENT STORE',
    color: '#a78bfa', // Purple
    scope: 'Across sessions & user lifetime',
    storageBackend: 'Vector Database (Pinecone/Qdrant) + SQL Store',
    whatItStores: 'User preferences, historical conversation summaries, codebase embeddings, and domain facts.',
    managementStrategy: 'Vector similarity RAG search, periodic episode summarization on session end.'
  },
  {
    id: 'procedural',
    name: '3. Procedural Memory (Skills & Rules)',
    badge: 'INSTRUCTIONAL',
    color: '#34d399', // Emerald
    scope: 'Project-wide / Agent domain rules',
    storageBackend: 'AGENTS.md, CLAUDE.md, Few-shot Prompt Stores',
    whatItStores: 'Coding standards, build/test commands, negative constraints, and dynamic few-shot task exemplars.',
    managementStrategy: 'Loaded at session initialization or retrieved dynamically based on task classification.'
  }
];

export default function ThreeMemoryTiersDiagram() {
  const [activeId, setActiveId] = useState<string>('short-term');
  const activeTier = TIERS.find(t => t.id === activeId) || TIERS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>The Three Memory Tiers of AI Agents</span>
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
        {TIERS.map((t) => {
          const isActive = activeId === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveId(t.id)}
              style={{
                background: isActive ? `${t.color}18` : '#13162b',
                border: `1.5px solid ${isActive ? t.color : '#1e2342'}`,
                borderRadius: '8px',
                padding: '10px 12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontSize: '9px', fontWeight: 800, color: t.color, background: `${t.color}20`, padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                {t.badge}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                {t.name.split('. ')[1]}
              </div>
            </button>
          );
        })}
      </div>

      {/* Details Panel */}
      <div className="interactive-diagram-details-card" style={{ background: '#090b14', padding: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: activeTier.color, marginBottom: '6px' }}>
          {activeTier.name}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: activeTier.color, textTransform: 'uppercase', marginBottom: '4px' }}>
              Storage Backend & Persistence Scope
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', fontWeight: 600 }}>
              {activeTier.storageBackend}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
              Scope: {activeTier.scope}
            </div>
          </div>

          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
              What It Stores
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
              {activeTier.whatItStores}
            </div>
          </div>
        </div>

        <div style={{ background: `${activeTier.color}10`, padding: '10px 14px', borderRadius: '6px', borderLeft: `3px solid ${activeTier.color}`, fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          <strong style={{ color: activeTier.color }}>Management Strategy: </strong>
          {activeTier.managementStrategy}
        </div>
      </div>
    </div>
  );
}
