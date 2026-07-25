import React, { useState } from 'react';

interface AgentInfo {
  id: string;
  name: string;
  badge: string;
  color: string;
  modelType: string;
  sandbox: string;
  keyStrength: string;
  useCase: string;
}

const AGENTS: AgentInfo[] = [
  {
    id: 'devin',
    name: 'Cognition Devin',
    badge: 'MANAGED SAAS',
    color: '#38bdf8', // Sky Blue
    modelType: 'Cloud MicroVM + Headless Browser',
    sandbox: 'Isolated Cloud MicroVM with full Linux terminal, Chrome browser, and code editor',
    keyStrength: 'Full-stack end-to-end web browsing, deployment, and long-horizon task execution',
    useCase: 'Asynchronous GitHub issue resolution and complex web app features from natural language specs'
  },
  {
    id: 'openhands',
    name: 'OpenHands (All-Hands AI)',
    badge: 'OPEN SOURCE',
    color: '#34d399', // Emerald
    modelType: 'Docker Container Sandbox',
    sandbox: 'Self-hosted Docker container with customizable permission gates and tool integrations',
    keyStrength: 'Community-driven, 100% transparent, privacy-first, on-premise enterprise deployment',
    useCase: 'Enterprise teams with strict data privacy requirements and custom internal tool integration'
  },
  {
    id: 'replit',
    name: 'Replit Agent',
    badge: 'CLOUD PLATFORM',
    color: '#a78bfa', // Purple
    modelType: 'Replit Cloud Workspace',
    sandbox: 'Integrated Replit Linux container environment with instant database & domain hosting',
    keyStrength: 'Zero-to-one rapid full-stack app prototyping from a single prompt with instant live URL',
    useCase: 'Hackathons, rapid MVP prototyping, and zero-configuration web app generation'
  },
  {
    id: 'sweagent',
    name: 'SWE-agent (Princeton)',
    badge: 'RESEARCH / ACI',
    color: '#fbbf24', // Amber
    modelType: 'Agent-Computer Interface (ACI)',
    sandbox: 'Terminal shell environment optimized specifically for LLM text file editing and execution',
    keyStrength: 'Highly tuned file search and editing interface designed to maximize benchmark performance',
    useCase: 'Academic benchmarking (SWE-bench) and lightweight CLI coding automation'
  }
];

export default function AutonomousAgentsDiagram() {
  const [activeId, setActiveId] = useState<string>('devin');
  const activeAgent = AGENTS.find(a => a.id === activeId) || AGENTS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Autonomous Background Agent Architecture & Platform Comparison</span>
      </div>

      {/* Container Execution Lifecycle Visualization */}
      <div style={{ padding: '16px 20px', background: '#0d0f1e', borderBottom: '1px solid #1e2342' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', marginBottom: '10px' }}>
          Containerized Agentic Execution Loop
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '8px',
          alignItems: 'center'
        }}>
          {[
            { step: '1. Issue Received', desc: 'Jira / GitHub Ticket', col: '#38bdf8' },
            { step: '2. Sandbox Spin-up', desc: 'Docker / MicroVM', col: '#a78bfa' },
            { step: '3. AST Code Edit', desc: 'Multi-file Mutation', col: '#fbbf24' },
            { step: '4. Shell & Browser', desc: 'Terminal / Headless', col: '#2dd4bf' },
            { step: '5. Test Execution', desc: 'Pass/Fail Check', col: '#f87171' },
            { step: '6. PR Submitted', desc: 'Git Pull Request', col: '#34d399' }
          ].map((item, idx) => (
            <div key={idx} style={{ background: '#13162b', border: `1px solid ${item.col}40`, borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: item.col }}>{item.step}</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Selector Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '10px',
        padding: '16px',
        background: '#090b14'
      }}>
        {AGENTS.map((agent) => {
          const isActive = activeId === agent.id;
          return (
            <button
              key={agent.id}
              onClick={() => setActiveId(agent.id)}
              style={{
                background: isActive ? `${agent.color}18` : '#13162b',
                border: `1.5px solid ${isActive ? agent.color : '#1e2342'}`,
                borderRadius: '8px',
                padding: '10px 12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '9px', fontWeight: 800, color: agent.color, background: `${agent.color}20`, padding: '2px 6px', borderRadius: '4px' }}>
                  {agent.badge}
                </span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                {agent.name}
              </div>
            </button>
          );
        })}
      </div>

      {/* Agent Inspector Details Card */}
      <div className="interactive-diagram-details-card" style={{ background: '#0d0f1e', borderTop: '1px solid #1e2342', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeAgent.color }} />
          <div style={{ fontSize: '16px', fontWeight: 700, color: activeAgent.color }}>
            {activeAgent.name} — <span style={{ color: 'var(--ifm-color-content)', fontSize: '14px' }}>{activeAgent.modelType}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
              Sandbox Environment
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              {activeAgent.sandbox}
            </div>
          </div>

          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: activeAgent.color, textTransform: 'uppercase', marginBottom: '4px' }}>
              Key Architectural Advantage
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              {activeAgent.keyStrength}
            </div>
          </div>
        </div>

        <div style={{ background: `${activeAgent.color}10`, padding: '10px 14px', borderRadius: '6px', borderLeft: `3px solid ${activeAgent.color}`, fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          <strong style={{ color: activeAgent.color }}>Ideal Enterprise Use Case: </strong>
          {activeAgent.useCase}
        </div>
      </div>
    </div>
  );
}
