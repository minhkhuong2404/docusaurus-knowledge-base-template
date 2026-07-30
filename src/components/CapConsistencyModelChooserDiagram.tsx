import React, { useState } from 'react';

interface ModelDetail {
  id: string;
  name: string;
  latency: string;
  availability: string;
  complexity: string;
  color: string;
  explanation: string;
  examples: string[];
}

const MODELS: ModelDetail[] = [
  {
    id: 'STRONG',
    name: '1. Strong Consistency',
    latency: 'High (Synchronous Roundtrips)',
    availability: 'Low (Fails on splits)',
    complexity: 'Low (No data conflicts)',
    color: '#ef4444',
    explanation: 'Ensures that every reader gets the absolute newest value instantly or returns an error. Solves double-spending but slows performance.',
    examples: ['Bank Account Ledger', 'Stock Order Books', 'Auth Sessions'],
  },
  {
    id: 'CAUSAL',
    name: '2. Causal Consistency',
    latency: 'Medium',
    availability: 'Medium',
    complexity: 'Medium',
    color: '#fbbf24',
    explanation: 'Ensures causally related writes are seen in order (e.g. comments and their replies). Unrelated actions can be delivered asynchronously.',
    examples: ['Slack Threads', 'Social Media Replies', 'Git Commits'],
  },
  {
    id: 'RYOW',
    name: '3. Read-Your-Own-Writes',
    latency: 'Low',
    availability: 'High',
    complexity: 'Medium',
    color: '#38bdf8',
    explanation: 'Guarantees the updating user always sees their changes immediately (via session sticky caches), while others catch up asynchronously.',
    examples: ['User Profile Preferences', 'Shopping Carts', 'User Bios'],
  },
  {
    id: 'EVENTUAL',
    name: '4. Eventual Consistency',
    latency: 'Very Low',
    availability: 'Very High',
    complexity: 'High (Needs merge conflict logic)',
    color: '#34d399',
    explanation: 'Maximum speed. Writes are accepted anywhere. Replicas synchronize in background. If no new writes occur, all nodes will converge to identical states.',
    examples: ['DNS Records Sync', 'Netflix Movie Catalog', 'Analytics Counters'],
  },
];

export default function CapConsistencyModelChooserDiagram(): React.JSX.Element {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const current = MODELS[activeIndex];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="21" x2="4" y2="14"/>
          <line x1="4" y1="10" x2="4" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12" y2="3"/>
          <line x1="20" y1="21" x2="20" y2="16"/>
          <line x1="20" y1="12" x2="20" y2="3"/>
          <line x1="2" y1="14" x2="6" y2="14"/>
          <line x1="10" y1="8" x2="14" y2="8"/>
          <line x1="18" y1="16" x2="22" y2="16"/>
        </svg>
        <span style={{ color: '#34d399' }}>Choosing the Right Consistency Model Spectrum</span>
      </div>

      <style>{`
        .chooser-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .chooser-grid {
            grid-template-columns: 1fr;
          }
        }
        .chooser-item {
          background: rgba(15,23,42,0.6);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          padding: 10px 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .chooser-item:hover {
          background: rgba(255,255,255,0.02);
          border-color: rgba(255,255,255,0.12);
        }
      `}</style>

      <div className="chooser-grid">
        
        {/* Horizontal spectrum items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {MODELS.map((model, idx) => {
            const isSelected = activeIndex === idx;
            return (
              <div
                key={model.id}
                onClick={() => setActiveIndex(idx)}
                className="chooser-item"
                style={{
                  borderLeft: `3px solid ${isSelected ? model.color : 'transparent'}`,
                  background: isSelected ? 'rgba(255,255,255,0.02)' : 'rgba(15,23,42,0.6)',
                  borderColor: isSelected ? model.color : 'rgba(255,255,255,0.06)',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: isSelected ? model.color : '#cbd5e1' }}>
                  {model.name}
                </div>
                <div style={{ fontSize: '9.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                  Latency: {model.latency}
                </div>
              </div>
            );
          })}
        </div>

        {/* Details Card */}
        <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${current.color}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          <div>
            <h3 style={{ color: current.color }}>{current.name} Details</h3>
          </div>

          <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', margin: 0, lineHeight: 1.45 }}>
            {current.explanation}
          </p>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '10px' }}>
              <span style={{ fontWeight: 'bold', color: '#64748b' }}>Availability:</span> <span style={{ color: 'var(--ifm-color-content-secondary)' }}>{current.availability}</span>
            </div>
            <div style={{ fontSize: '10px' }}>
              <span style={{ fontWeight: 'bold', color: '#64748b' }}>Design Complexity:</span> <span style={{ color: 'var(--ifm-color-content-secondary)' }}>{current.complexity}</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
            <span style={{ fontWeight: 'bold', color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Production Examples
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {current.examples.map((ex, idx) => (
                <span key={idx} style={{
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '9.5px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  color: 'var(--ifm-color-content)',
                }}>
                  {ex}
                </span>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
