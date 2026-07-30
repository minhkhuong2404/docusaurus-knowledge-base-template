import React, { useState } from 'react';

interface HierarchyLevel {
  level: number;
  title: string;
  category: string;
  color: string;
  role: string;
  latency: string;
  examples: string[];
  value: string;
  description: string;
}

const LEVELS: HierarchyLevel[] = [
  {
    level: 1,
    title: 'Level 1: Autocomplete',
    category: 'Inline Keystroke Prediction',
    color: '#38bdf8', // Sky Blue
    role: 'Typist (Line-by-line helper)',
    latency: '100–300 ms',
    examples: ['GitHub Copilot Tab', 'Supermaven', 'Codeium Autocomplete'],
    value: 'Saves repetitive keystrokes, speeds up routine syntax lookup.',
    description: 'Predicts the next few tokens or lines based on immediate local cursor context.'
  },
  {
    level: 2,
    title: 'Level 2: Chat & Inline Assist',
    category: 'Single-File Prompt Assistance',
    color: '#a78bfa', // Purple
    role: 'Prompt Engineer / Assistant',
    latency: '1–3 seconds',
    examples: ['Copilot Chat', 'VS Code Inline Chat', 'JetBrains AI Assistant'],
    value: 'Explains complex functions, generates unit tests, fixes compiler errors.',
    description: 'Accepts natural language user prompts to modify single files or answer queries.'
  },
  {
    level: 3,
    title: 'Level 3: IDE Agent & Composer',
    category: 'Multi-File Orchestration & Terminal',
    color: '#fbbf24', // Amber
    role: 'Director & Code Reviewer',
    latency: '5–30 seconds',
    examples: ['Cursor Composer', 'Windsurf (Codeium Cascade)', 'Antigravity Workspace'],
    value: 'Implements full multi-file features, runs terminal tests, auto-corrects build failures.',
    description: 'Maintains codebase indexing, reads/writes across multiple files, executes terminal commands.'
  },
  {
    level: 4,
    title: 'Level 4: Autonomous Background Agent',
    category: 'Asynchronous Ticket Resolution',
    color: '#34d399', // Emerald
    role: 'Product Manager / Supervisor',
    latency: 'Minutes to Hours',
    examples: ['Cognition Devin', 'OpenHands (All-Hands AI)', 'Replit Agent', 'SWE-agent'],
    value: 'Resolves entire Jira tickets / GitHub issues end-to-end and submits Pull Requests.',
    description: 'Operates in isolated sandboxes with terminal, headless browser, and Git workspace access.'
  }
];

export default function ToolHierarchyDiagram() {
  const [activeLevel, setActiveLevel] = useState<number>(3);
  const current = LEVELS.find(l => l.level === activeLevel) || LEVELS[2];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>The AI Coding Tool Autonomy Spectrum</span>
      </div>

      {/* Spectrum Stepper */}
      <div style={{ padding: '20px', background: '#0d0f1e' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
          marginBottom: '20px'
        }}>
          {LEVELS.map((item) => {
            const isActive = activeLevel === item.level;
            return (
              <div
                key={item.level}
                onClick={() => setActiveLevel(item.level)}
                style={{
                  background: isActive ? `${item.color}18` : '#13162b',
                  border: `2px solid ${isActive ? item.color : '#1e2342'}`,
                  borderRadius: '8px',
                  padding: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? `0 0 12px ${item.color}25` : 'none'
                }}
              >
                <div style={{ fontSize: '10px', fontWeight: 800, color: item.color, textTransform: 'uppercase', marginBottom: '4px' }}>
                  L{item.level} AUTONOMY
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                  {item.title.split(': ')[1]}
                </div>
              </div>
            );
          })}
        </div>

        {/* Level Details Card */}
        <div className="interactive-diagram-details-card" style={{ background: '#090b14', border: `1px solid ${current.color}40`, borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: current.color }} />
              <div style={{ fontSize: '16px', fontWeight: 700, color: current.color }}>
                {current.title} — <span style={{ color: 'var(--ifm-color-content)' }}>{current.category}</span>
              </div>
            </div>

            <div style={{ fontSize: '11px', fontWeight: 700, color: current.color, background: `${current.color}15`, padding: '4px 10px', borderRadius: '4px', border: `1px solid ${current.color}30` }}>
              Latency: {current.latency}
            </div>
          </div>

          <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
            {current.description}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '14px' }}>
            <div style={{ background: '#13162b', padding: '10px 12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                User Role / Mindset
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                {current.role}
              </div>
            </div>

            <div style={{ background: '#13162b', padding: '10px 12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Leading Tool Examples
              </div>
              <div style={{ fontSize: '12px', color: current.color, fontWeight: 600 }}>
                {current.examples.join(' • ')}
              </div>
            </div>
          </div>

          <div style={{ background: `${current.color}10`, padding: '10px 14px', borderRadius: '6px', borderLeft: `3px solid ${current.color}`, fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
            <strong style={{ color: current.color }}>Primary Productivity Value: </strong>
            {current.value}
          </div>
        </div>
      </div>
    </div>
  );
}
