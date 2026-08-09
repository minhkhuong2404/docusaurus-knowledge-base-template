import React, { useState } from 'react';

interface Stage {
  step: number;
  name: string;
  badge: string;
  color: string;
  description: string;
  example: string;
}

const STAGES: Stage[] = [
  {
    step: 1,
    name: '1. Text Tokenization',
    badge: 'Character Splitting',
    color: '#38bdf8',
    description: 'Splits raw document text strings into lowercase token terms, stripping punctuation and special formatting.',
    example: `Input: "The Quick Brown Foxes were Running!" -> Tokens: ["the", "quick", "brown", "foxes", "were", "running"]`,
  },
  {
    step: 2,
    name: '2. Stopword Removal & Stemming',
    badge: 'Linguistic Normalization',
    color: '#fbbf24',
    description: 'Strips low-value stopwords ("the", "were") and applies Porter Stemmer / Lemmatizer ("foxes" -> "fox", "running" -> "run").',
    example: `Filtered & Stemmed Terms: ["quick", "brown", "fox", "run"]`,
  },
  {
    step: 3,
    name: '3. Inverted Index Posting List',
    badge: 'Hash Map Storage',
    color: '#34d399',
    description: 'Maps each unique stemmed term to an inverted posting list of Document IDs along with Term Frequency (TF) and Position Offsets.',
    example: `"fox" -> [Doc_1: freq=1, pos=3], [Doc_4: freq=2, pos=12, 45]\n"run" -> [Doc_1: freq=1, pos=5]`,
  },
  {
    step: 4,
    name: '4. BM25 Relevance Scoring',
    badge: 'TF-IDF Ranking',
    color: '#c084fc',
    description: 'Ranks matching documents using BM25 formula balancing Term Frequency (TF), Inverse Document Frequency (IDF), and Document Length normalization.',
    example: `Score(Doc_4, "fox") = 3.82 (High relevance)\nScore(Doc_1, "fox") = 1.45`,
  },
];

export default function FullTextSearchEngineDiagram(): React.JSX.Element {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(2); // Default to Inverted Index
  const activeStep = STAGES[activeStepIndex];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Full-Text Search Engine Inverted Index & BM25 Scoring Pipeline
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Step Selector Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
          {STAGES.map((st, idx) => {
            const isSelected = idx === activeStepIndex;
            return (
              <button
                key={st.step}
                onClick={() => setActiveStepIndex(idx)}
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: isSelected ? `1px solid ${st.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: isSelected ? `${st.color}18` : '#0c0e17',
                  color: isSelected ? '#fff' : 'var(--ifm-color-content-secondary)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 400,
                  fontSize: '12px',
                }}
              >
                {st.name}
              </button>
            );
          })}
        </div>

        {/* Selected Step Overview */}
        <div style={{ backgroundColor: '#0c0e17', padding: '16px', borderRadius: '10px', borderLeft: `4px solid ${activeStep.color}`, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: activeStep.color }}>
              {activeStep.name}
            </span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: `${activeStep.color}22`, color: activeStep.color, fontWeight: 700 }}>
              {activeStep.badge}
            </span>
          </div>

          <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            {activeStep.description}
          </p>

          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
            Data Transformation Output
          </div>
          <pre style={{ margin: 0, padding: '10px', backgroundColor: '#05070e', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', color: '#38bdf8', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
            <code>{activeStep.example}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
