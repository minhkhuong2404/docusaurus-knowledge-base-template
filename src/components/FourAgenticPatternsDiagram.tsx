import React, { useState } from 'react';

interface Pattern {
  id: string;
  number: number;
  name: string;
  badge: string;
  color: string;
  summary: string;
  howItWorks: string;
  idealUseCase: string;
  codePattern: string;
}

const PATTERNS: Pattern[] = [
  {
    id: 'reflection',
    number: 1,
    name: 'Pattern 1: Reflection (Self-Correction)',
    badge: 'SELF-HEAL',
    color: '#38bdf8', // Sky Blue
    summary: 'The agent evaluates its own generated output against rules or test assertions, iteratively fixing errors before finalizing.',
    howItWorks: 'Generator LLM produces draft -> Evaluator LLM / Test Runner critiques draft -> Generator fixes code based on feedback.',
    idealUseCase: 'Code generation, automated refactoring, translation validation, and complex reasoning.',
    codePattern: 'draft = llm.generate(prompt)\nfeedback = evaluator.critique(draft)\nif feedback.has_errors:\n    draft = llm.refine(draft, feedback)'
  },
  {
    id: 'tooluse',
    number: 2,
    name: 'Pattern 2: Tool Use (Function Calling)',
    badge: 'ACTIONS',
    color: '#a78bfa', // Purple
    summary: 'Extends LLM text generation with external execution interfaces (search, bash, SQL, REST APIs).',
    howItWorks: 'LLM receives tool JSON schemas -> Outputs tool_use call payload -> Harness executes code and returns observation.',
    idealUseCase: 'Fetching live market data, database queries, terminal execution, and file I/O.',
    codePattern: 'tool_call = llm.decide_tool(user_query)\nresult = harness.execute(tool_call.name, tool_call.args)\nfinal_answer = llm.synthesize(result)'
  },
  {
    id: 'planning',
    number: 3,
    name: 'Pattern 3: Planning & Task Decomposition',
    badge: 'PLANNING',
    color: '#fbbf24', // Amber
    summary: 'Decomposes complex multi-step goals into a structured DAG or subtask checklist before starting execution.',
    howItWorks: 'Planner LLM breaks goal into steps -> Executor executes step 1..N -> Re-planner adjusts remaining steps if errors occur.',
    idealUseCase: '0-to-1 app building, multi-file migrations, research reports, and complex refactoring.',
    codePattern: 'plan = planner.create_dag(goal)\nfor step in plan.steps:\n    res = executor.run(step)\n    if res.failed: plan = planner.replan(plan, res.error)'
  },
  {
    id: 'multiagent',
    number: 4,
    name: 'Pattern 4: Multi-Agent Collaboration',
    badge: 'SWARM',
    color: '#34d399', // Emerald
    summary: 'Divides complex domain problems among specialized agent roles (Orchestrator, Researcher, Coder, Critic).',
    howItWorks: 'Orchestrator spawns specialized agents -> Agents communicate via message bus or shared state graph.',
    idealUseCase: 'Enterprise software architecture, complex code review pipelines, and multi-domain research.',
    codePattern: 'research = subagent_researcher.run(topic)\ncode = subagent_coder.run(spec, research)\nreview = subagent_critic.run(code)'
  }
];

export default function FourAgenticPatternsDiagram() {
  const [activeId, setActiveId] = useState<string>('reflection');
  const activePattern = PATTERNS.find(p => p.id === activeId) || PATTERNS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>The 4 Foundational Agentic Design Patterns (Andrew Ng)</span>
      </div>

      {/* Pattern Selector Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '10px',
        padding: '16px',
        background: '#0d0f1e',
        borderBottom: '1px solid #1e2342'
      }}>
        {PATTERNS.map((p) => {
          const isActive = activeId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setActiveId(p.id)}
              style={{
                background: isActive ? `${p.color}18` : '#13162b',
                border: `1.5px solid ${isActive ? p.color : '#1e2342'}`,
                borderRadius: '8px',
                padding: '12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? `0 0 12px ${p.color}25` : 'none'
              }}
            >
              <div style={{ fontSize: '9px', fontWeight: 800, color: p.color, background: `${p.color}20`, padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                {p.badge}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                {p.name.split(': ')[1]}
              </div>
            </button>
          );
        })}
      </div>

      {/* Pattern Details Panel */}
      <div className="interactive-diagram-details-card" style={{ background: '#090b14', padding: '20px' }}>
        <div style={{ fontSize: '17px', fontWeight: 700, color: activePattern.color, marginBottom: '6px' }}>
          {activePattern.name}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
          {activePattern.summary}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: activePattern.color, textTransform: 'uppercase', marginBottom: '4px' }}>
              Execution Mechanics
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              {activePattern.howItWorks}
            </div>
          </div>

          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
              Canonical Code Pattern
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
              {activePattern.codePattern}
            </pre>
          </div>
        </div>

        <div style={{ background: `${activePattern.color}10`, padding: '10px 14px', borderRadius: '6px', borderLeft: `3px solid ${activePattern.color}`, fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
          <strong style={{ color: activePattern.color }}>Ideal Engineering Use Case: </strong>
          {activePattern.idealUseCase}
        </div>
      </div>
    </div>
  );
}
