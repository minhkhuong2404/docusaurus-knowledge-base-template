import React, { useState } from 'react';

interface SystemLayer {
  id: string;
  layerNumber: number;
  title: string;
  color: string;
  summary: string;
  exampleSnippet: string;
  impact: string;
}

const LAYERS: SystemLayer[] = [
  {
    id: 'persona',
    layerNumber: 1,
    title: 'Persona & Role Definition',
    color: '#38bdf8', // Sky Blue
    summary: 'Establishes the agent’s expertise, technical tone, domain authority, and mindset.',
    exampleSnippet: 'You are a Senior Principal Software Architect on the Payments Infrastructure team.\nYou write production-grade, highly maintainable Java 21 code following SOLID design principles.',
    impact: 'Sets baseline code quality, naming conventions, and domain vocabulary.'
  },
  {
    id: 'environment',
    layerNumber: 2,
    title: 'Context & Environment Boundaries',
    color: '#a78bfa', // Purple
    summary: 'Defines exact tech stack versions, runtime environment, libraries, and project structure.',
    exampleSnippet: 'Stack: Java 21, Spring Boot 3.3.x, PostgreSQL 16, Redis 7.x, JUnit 5 + Testcontainers.\nNo Lombok allowed — use Java 21 record classes for all DTOs.',
    impact: 'Prevents library version hallucination and deprecated code generation.'
  },
  {
    id: 'constraints',
    layerNumber: 3,
    title: 'Operational Rules & Constraints',
    color: '#f87171', // Red
    summary: 'Strict negative rules and safety boundaries to constrain agent blast radius.',
    exampleSnippet: 'CONSTRAINTS:\n- Do NOT modify database schema directly — use Flyway migrations only.\n- Do NOT introduce third-party libraries without explicit user approval.\n- Do NOT touch files outside the specified /src/main directory.',
    impact: 'Protects codebase integrity and limits accidental over-refactoring.'
  },
  {
    id: 'tools',
    layerNumber: 4,
    title: 'Tool Usage Guidelines',
    color: '#fbbf24', // Amber
    summary: 'Instructs the agent on when and how to call external tools, compilers, and test runners.',
    exampleSnippet: 'TOOL RULES:\n- After modifying any Java file, execute `./gradlew test` to verify build status.\n- If a build error occurs, inspect the log output before making further changes.',
    impact: 'Enforces self-verification and automated test execution cycles.'
  },
  {
    id: 'output',
    layerNumber: 5,
    title: 'Output Schema & Response Template',
    color: '#34d399', // Emerald
    summary: 'Specifies response layout, code formatting, XML/JSON tags, and diff presentation.',
    exampleSnippet: 'RESPONSE FORMAT:\nProvide your response in XML tags:\n<diff_summary>Brief 2-line explanation</diff_summary>\n<code_patch>Unified git diff patch</code_patch>',
    impact: 'Ensures output can be parsed deterministically by IDEs or downstream subagents.'
  }
];

export default function SystemPromptArchitectureDiagram() {
  const [activeLayerId, setActiveLayerId] = useState<string>('persona');
  const activeLayer = LAYERS.find(l => l.id === activeLayerId) || LAYERS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>System Prompt Architecture for Coding Agents</span>
      </div>

      {/* Layer Stack Grid */}
      <div style={{ padding: '20px', background: '#0d0f1e' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {LAYERS.map((layer) => {
            const isActive = activeLayerId === layer.id;
            return (
              <div
                key={layer.id}
                onClick={() => setActiveLayerId(layer.id)}
                style={{
                  background: isActive ? `${layer.color}18` : '#13162b',
                  border: `2px solid ${isActive ? layer.color : '#1e2342'}`,
                  borderRadius: '8px',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? `0 0 12px ${layer.color}25` : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: layer.color,
                    color: '#090b14',
                    fontWeight: 800,
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {layer.layerNumber}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                      {layer.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
                      {layer.summary}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '11px', fontWeight: 700, color: layer.color, background: `${layer.color}15`, padding: '4px 10px', borderRadius: '4px', border: `1px solid ${layer.color}30` }}>
                  {isActive ? 'INSPECTING LAYER' : 'CLICK TO VIEW'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Inspector Panel */}
        <div className="interactive-diagram-details-card" style={{ background: '#090b14', border: '1px solid #1e2342', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeLayer.color }} />
            <div style={{ fontSize: '15px', fontWeight: 700, color: activeLayer.color }}>
              Layer {activeLayer.layerNumber}: {activeLayer.title}
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
              Example Prompt Snippet
            </div>
            <pre style={{
              background: '#13162b',
              padding: '12px',
              borderRadius: '6px',
              fontSize: '12px',
              color: 'var(--ifm-color-content)',
              whiteSpace: 'pre-wrap',
              margin: 0,
              border: `1px solid ${activeLayer.color}40`,
              fontFamily: 'monospace'
            }}>
              {activeLayer.exampleSnippet}
            </pre>
          </div>

          <div style={{ background: `${activeLayer.color}10`, padding: '10px 14px', borderRadius: '6px', borderLeft: `3px solid ${activeLayer.color}`, fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
            <strong style={{ color: activeLayer.color }}>Impact on Agent Behavior: </strong>
            {activeLayer.impact}
          </div>
        </div>
      </div>
    </div>
  );
}
