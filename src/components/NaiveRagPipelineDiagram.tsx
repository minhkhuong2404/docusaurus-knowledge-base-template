import React, { useState } from 'react';

interface RagStep {
  step: number;
  name: string;
  badge: string;
  color: string;
  whatItDoes: string;
  limitations: string;
}

const RAG_STEPS: RagStep[] = [
  {
    step: 1,
    name: '1. Fixed Chunking',
    badge: 'SPLIT',
    color: '#38bdf8', // Sky Blue
    whatItDoes: 'Splits raw documents or code files into fixed-size chunks (e.g. 500 tokens) with static overlap.',
    limitations: 'Breaks semantic boundaries mid-sentence or mid-function.'
  },
  {
    step: 2,
    name: '2. Vector Embedding',
    badge: 'EMBED',
    color: '#a78bfa', // Purple
    whatItDoes: 'Passes chunks through an embedding model (text-embedding-3) to store 1536-dimensional vectors in a Vector DB.',
    limitations: 'Dense vectors lose keyword precision for exact code symbols.'
  },
  {
    step: 3,
    name: '3. Vector Similarity Search',
    badge: 'RETRIEVE',
    color: '#fbbf24', // Amber
    whatItDoes: 'Embeds user query and computes Cosine Similarity / HNSW top-K nearest neighbor chunks.',
    limitations: 'Retrieves irrelevant chunks if query vocabulary differs from document terminology.'
  },
  {
    step: 4,
    name: '4. Prompt Generation',
    badge: 'GENERATE',
    color: '#34d399', // Emerald
    whatItDoes: 'Injects top-K retrieved text chunks into LLM context window alongside user query.',
    limitations: 'Suffers from context rot / middle-lost attention when top-K contains noisy chunks.'
  }
];

export default function NaiveRagPipelineDiagram() {
  const [activeStep, setActiveStep] = useState<number>(3);
  const current = RAG_STEPS.find(s => s.step === activeStep) || RAG_STEPS[2];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Naive RAG 4-Stage Pipeline</span>
      </div>

      {/* Grid Stepper */}
      <div style={{ padding: '20px', background: '#0d0f1e' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '10px',
          marginBottom: '20px'
        }}>
          {RAG_STEPS.map((s) => {
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
                  STEP {s.step} • {s.badge}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                  {s.name.split('. ')[1]}
                </div>
              </div>
            );
          })}
        </div>

        {/* Step Detail Panel */}
        <div className="interactive-diagram-details-card" style={{ background: '#090b14', padding: '16px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: current.color, marginBottom: '6px' }}>
            {current.name}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', marginBottom: '12px', lineHeight: '1.5' }}>
            {current.whatItDoes}
          </div>
          <div style={{ background: '#f8717110', borderLeft: '3px solid #f87171', padding: '8px 12px', borderRadius: '4px', fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
            <strong style={{ color: '#f87171' }}>Naive RAG Limitation: </strong>
            {current.limitations}
          </div>
        </div>
      </div>
    </div>
  );
}
