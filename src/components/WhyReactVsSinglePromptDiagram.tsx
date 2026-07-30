import React, { useState } from 'react';

interface MetricComparison {
  title: string;
  naiveSinglePrompt: string;
  reactAgentLoop: string;
  benefit: string;
  color: string;
}

const COMPARISONS: MetricComparison[] = [
  {
    title: '1. Fact Verification & Hallucinations',
    naiveSinglePrompt: 'Generates text directly from model weights. Cannot verify facts, leading to confident hallucinations.',
    reactAgentLoop: 'Grounds responses in live vector DB search or API queries before generating answers.',
    benefit: 'Eliminates hallucinated facts by grounding in real external data.',
    color: '#38bdf8' // Sky Blue
  },
  {
    title: '2. Access to Live & Real-Time Data',
    naiveSinglePrompt: 'Restricted strictly to fixed training cutoff date. Fails on current news or live stock prices.',
    reactAgentLoop: 'Calls real-time tools (web search, market APIs, database queries) as part of execution loop.',
    benefit: 'Provides up-to-the-minute accurate real-world data.',
    color: '#a78bfa' // Purple
  },
  {
    title: '3. Error Self-Correction & Testing',
    naiveSinglePrompt: 'Outputs code in one shot. Syntactical or runtime errors are presented to user unverified.',
    reactAgentLoop: 'Executes generated code in sandbox, reads error stacktraces as observations, and fixes bugs automatically.',
    benefit: 'Delivers verified, bug-free outputs tested against compilers.',
    color: '#34d399' // Emerald
  }
];

export default function WhyReactVsSinglePromptDiagram() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const current = COMPARISONS[activeTab];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>ReAct Loop Agent vs. Naive Single-Prompt Generation</span>
      </div>

      {/* Comparison Selector */}
      <div style={{ padding: '16px 20px', background: '#0d0f1e', borderBottom: '1px solid #1e2342' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {COMPARISONS.map((c, idx) => {
            const isActive = activeTab === idx;
            return (
              <div
                key={idx}
                onClick={() => setActiveTab(idx)}
                style={{
                  background: isActive ? `${c.color}18` : '#13162b',
                  border: `1.5px solid ${isActive ? c.color : '#1e2342'}`,
                  borderRadius: '8px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                  {c.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side-by-Side Comparison Panel */}
      <div className="interactive-diagram-details-card" style={{ background: '#090b14', padding: '20px' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: current.color, marginBottom: '14px' }}>
          {current.title}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <div style={{ background: '#f8717110', border: '1px solid #f8717140', padding: '14px', borderRadius: '6px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#f87171', textTransform: 'uppercase', marginBottom: '6px' }}>
              ❌ Naive Single-Prompt Approach
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.5' }}>
              {current.naiveSinglePrompt}
            </div>
          </div>

          <div style={{ background: '#34d39910', border: '1px solid #34d39940', padding: '14px', borderRadius: '6px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', marginBottom: '6px' }}>
              ✅ ReAct Agent Loop Approach
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.5' }}>
              {current.reactAgentLoop}
            </div>
          </div>
        </div>

        <div style={{ background: `${current.color}15`, padding: '10px 14px', borderRadius: '6px', borderLeft: `3px solid ${current.color}`, fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          <strong style={{ color: current.color }}>Engineering Advantage: </strong>
          {current.benefit}
        </div>
      </div>
    </div>
  );
}
