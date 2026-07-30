import React, { useState } from 'react';

interface MultiPattern {
  id: string;
  letter: string;
  name: string;
  badge: string;
  color: string;
  topology: string;
  howItWorks: string;
  bestFor: string;
  communication: string;
}

const MULTI_PATTERNS: MultiPattern[] = [
  {
    id: 'orchestrator',
    letter: 'A',
    name: 'Pattern A: Orchestrator-Worker (Hierarchical)',
    badge: 'HIERARCHICAL',
    color: '#38bdf8', // Sky Blue
    topology: 'Parent Orchestrator -> Spawns Worker Subagents 1..N -> Merges Results',
    howItWorks: 'A central orchestrator agent breaks the goal into subtasks, delegates each to a specialized worker subagent, and aggregates results.',
    bestFor: 'Complex multi-domain tasks requiring research, code generation, and review in parallel.',
    communication: 'Direct RPC / Subagent Task Dispatch'
  },
  {
    id: 'sequential',
    letter: 'B',
    name: 'Pattern B: Sequential Pipeline (Assembly Line)',
    badge: 'ASSEMBLY LINE',
    color: '#a78bfa', // Purple
    topology: 'Agent 1 (Spec) -> Agent 2 (Code) -> Agent 3 (Test) -> Agent 4 (Doc)',
    howItWorks: 'Output of Agent N becomes the direct input prompt of Agent N+1, mimicking an assembly line.',
    bestFor: 'Linear transformation pipelines (Specification -> Implementation -> Code Review -> Documentation).',
    communication: 'Pipeline Handoff / Step Chaining'
  },
  {
    id: 'blackboard',
    letter: 'C',
    name: 'Pattern C: Blackboard (Shared State Memory)',
    badge: 'SHARED STATE',
    color: '#fbbf24', // Amber
    topology: 'Agent 1..N <== Reads / Writes ==> Central Shared Memory Blackboard',
    howItWorks: 'Multiple autonomous agents inspect a shared central memory store (blackboard), claiming tasks and writing results when ready.',
    bestFor: 'Asynchronous event-driven problems where agents react to changes in shared state.',
    communication: 'Shared Database / Key-Value Store'
  },
  {
    id: 'debate',
    letter: 'D',
    name: 'Pattern D: Debate / Critic-Proposer',
    badge: 'DEBATE',
    color: '#f87171', // Red
    topology: 'Proposer Agent <== Adversarial Discussion ==> Critic Agent -> Judge Agent',
    howItWorks: 'Proposer generates a solution, Critic challenges assumptions, and a Judge agent evaluates arguments to find optimal consensus.',
    bestFor: 'High-stakes security audits, complex system architecture verification, and mathematical proofs.',
    communication: 'Adversarial Round-Robin Discussion'
  },
  {
    id: 'mapreduce',
    letter: 'E',
    name: 'Pattern E: Map-Reduce (Parallel Scatter-Gather)',
    badge: 'PARALLEL',
    color: '#34d399', // Emerald
    topology: 'Scatter Goal -> Map Worker 1..N (Parallel) -> Reduce Synthesis Agent',
    howItWorks: 'Scatters uniform subtasks across N identical worker agents running in parallel, then reduces results into a single synthesis.',
    bestFor: 'Large-scale codebase scanning, multi-document processing, and parallel benchmark evaluations.',
    communication: 'Scatter-Gather Async Execution'
  }
];

export default function MultiAgentCoordinationPatternsDiagram() {
  const [activeId, setActiveId] = useState<string>('orchestrator');
  const activePattern = MULTI_PATTERNS.find(p => p.id === activeId) || MULTI_PATTERNS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Multi-Agent Coordination Patterns (Patterns A–E)</span>
      </div>

      {/* Pattern Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: '10px',
        padding: '16px',
        background: '#0d0f1e',
        borderBottom: '1px solid #1e2342'
      }}>
        {MULTI_PATTERNS.map((p) => {
          const isActive = activeId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setActiveId(p.id)}
              style={{
                background: isActive ? `${p.color}18` : '#13162b',
                border: `1.5px solid ${isActive ? p.color : '#1e2342'}`,
                borderRadius: '8px',
                padding: '10px 12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontSize: '9px', fontWeight: 800, color: p.color, background: `${p.color}20`, padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                PATTERN {p.letter}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                {p.name.split(': ')[1].split(' (')[0]}
              </div>
            </button>
          );
        })}
      </div>

      {/* Pattern Inspector Details Card */}
      <div className="interactive-diagram-details-card" style={{ background: '#090b14', padding: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: activePattern.color, marginBottom: '4px' }}>
          {activePattern.name}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px', fontFamily: 'monospace' }}>
          Topology: {activePattern.topology}
        </div>

        <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
          {activePattern.howItWorks}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: activePattern.color, textTransform: 'uppercase', marginBottom: '4px' }}>
              Best Architectural Fit
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              {activePattern.bestFor}
            </div>
          </div>

          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
              Communication Mechanism
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              {activePattern.communication}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
