import React, { useState } from 'react';

interface AdvancedFeature {
  id: string;
  name: string;
  badge: string;
  color: string;
  howItWorks: string;
  whyItBeatsNaive: string;
}

const FEATURES: AdvancedFeature[] = [
  {
    id: 'chunking',
    name: '1. Semantic AST Chunking',
    badge: 'AST-AWARE',
    color: '#38bdf8', // Sky Blue
    howItWorks: 'Uses tree-sitter parsers to split code by AST boundaries (classes, methods, interfaces) rather than arbitrary 500-character limits.',
    whyItBeatsNaive: 'Preserves full method context and Javadocs within a single chunk, eliminating split-function syntax errors.'
  },
  {
    id: 'hybrid',
    name: '2. Hybrid Search (Sparse + Dense)',
    badge: 'BM25 + VECTOR',
    color: '#a78bfa', // Purple
    howItWorks: 'Combines BM25 keyword search (exact symbol/function match) with Dense Vector embeddings using Reciprocal Rank Fusion (RRF).',
    whyItBeatsNaive: 'Guarantees exact variable/method name lookups while maintaining semantic intent discovery.'
  },
  {
    id: 'rerank',
    name: '3. Cross-Encoder Re-Ranking',
    badge: 'RERANKER',
    color: '#34d399', // Emerald
    howItWorks: 'Passes top 50 candidates through a Cross-Encoder reranker (e.g. Cohere / BGE Reranker) to select the top 5 highest relevance chunks.',
    whyItBeatsNaive: 'Filter out 90% of vector similarity noise, preventing prompt context bloat.'
  },
  {
    id: 'rewrite',
    name: '4. Query Rewriting & Multi-Query Expansion',
    badge: 'QUERY EXPAND',
    color: '#fbbf24', // Amber
    howItWorks: 'Uses an LLM agent to rephrase vague user queries into 3 targeted sub-queries matching codebase domain vocabulary.',
    whyItBeatsNaive: 'Solves vocabulary mismatch when user uses colloquial terms different from codebase class names.'
  }
];

export default function AdvancedAgenticRagDiagram() {
  const [activeId, setActiveId] = useState<string>('hybrid');
  const activeFeat = FEATURES.find(f => f.id === activeId) || FEATURES[1];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Production Advanced Agentic RAG Architecture</span>
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
        {FEATURES.map((f) => {
          const isActive = activeId === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setActiveId(f.id)}
              style={{
                background: isActive ? `${f.color}18` : '#13162b',
                border: `1.5px solid ${isActive ? f.color : '#1e2342'}`,
                borderRadius: '8px',
                padding: '10px 12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontSize: '9px', fontWeight: 800, color: f.color, background: `${f.color}20`, padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                {f.badge}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                {f.name.split('. ')[1]}
              </div>
            </button>
          );
        })}
      </div>

      {/* Details Card */}
      <div className="interactive-diagram-details-card" style={{ background: '#090b14', padding: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: activeFeat.color, marginBottom: '6px' }}>
          {activeFeat.name}
        </div>

        <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
          {activeFeat.howItWorks}
        </div>

        <div style={{ background: `${activeFeat.color}10`, padding: '10px 14px', borderRadius: '6px', borderLeft: `3px solid ${activeFeat.color}`, fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          <strong style={{ color: activeFeat.color }}>Why It Beats Naive RAG: </strong>
          {activeFeat.whyItBeatsNaive}
        </div>
      </div>
    </div>
  );
}
