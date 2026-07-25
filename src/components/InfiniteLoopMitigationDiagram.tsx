import React, { useState } from 'react';

interface Guard {
  id: string;
  name: string;
  badge: string;
  color: string;
  mechanism: string;
  triggerCondition: string;
  actionTaken: string;
}

const GUARDS: Guard[] = [
  {
    id: 'turns',
    name: '1. Max Turn Count Guard',
    badge: 'TURN LIMIT',
    color: '#38bdf8', // Sky Blue
    mechanism: 'Enforces a strict global step counter for the agent session.',
    triggerCondition: 'turn_count >= max_turns (e.g. 30 turns max)',
    actionTaken: 'Raises HarnessTerminationException; returns partial output summary to user.'
  },
  {
    id: 'cost',
    name: '2. Session Cost Ceiling Guard',
    badge: 'DOLLAR CAP',
    color: '#34d399', // Emerald
    mechanism: 'Tracks cumulative LLM API token spend (input + output + reasoning tokens) in real time.',
    triggerCondition: 'total_cost_usd >= cost_ceiling (e.g. $5.00 max limit)',
    actionTaken: 'Immediately halts session execution before incurring surprise cloud API bills.'
  },
  {
    id: 'stall',
    name: '3. Action Signature Stall Detector',
    badge: 'STALL DETECT',
    color: '#fbbf24', // Amber
    mechanism: 'Hashes recent tool calls (`tool_name + json_inputs`). Tracks unique signatures over sliding window of N turns.',
    triggerCondition: 'Last 5–10 turns contain <= 2 unique action signatures (repeating cycle detected)',
    actionTaken: 'Triggers stall alert; forces agent to switch strategy or escalate to human.'
  },
  {
    id: 'hitl',
    name: '4. HITL Escalation Gate',
    badge: 'HUMAN ESCALATION',
    color: '#f87171', // Red
    mechanism: 'Pauses agent state machine, persists current checkpoint to DB, and alerts human via Web/Slack.',
    triggerCondition: 'Agent is stalled OR cost warning threshold ($2.00) is reached',
    actionTaken: 'Waits for human supervisor to inject guidance or resume session.'
  }
];

export default function InfiniteLoopMitigationDiagram() {
  const [activeId, setActiveId] = useState<string>('stall');
  const activeGuard = GUARDS.find(g => g.id === activeId) || GUARDS[2];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>The Infinite Loop Failure Problem & 4-Layer Safeguard System</span>
      </div>

      {/* Failure Scenario Visualizer */}
      <div style={{ padding: '16px 20px', background: '#0d0f1e', borderBottom: '1px solid #1e2342' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', marginBottom: '8px' }}>
          Classic Agent Infinite Loop Failure Cycle
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '8px',
          marginBottom: '16px'
        }}>
          {[
            { step: 'Turn 1', desc: 'Syntax Error in Code', col: '#38bdf8' },
            { step: 'Turn 2', desc: 'Run Test -> Fail', col: '#a78bfa' },
            { step: 'Turn 3', desc: 'Fix Wrong Function', col: '#fbbf24' },
            { step: 'Turn 4', desc: 'Run Test -> Still Fail', col: '#f97316' },
            { step: 'Turns 5–200', desc: 'Repeat Wrong Fix ↺ ($50+ Bill)', col: '#f87171' }
          ].map((item, idx) => (
            <div key={idx} style={{ background: '#13162b', border: `1px solid ${item.col}40`, borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: item.col }}>{item.step}</div>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Safeguard Selector Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '10px',
        padding: '16px',
        background: '#090b14'
      }}>
        {GUARDS.map((guard) => {
          const isActive = activeId === guard.id;
          return (
            <button
              key={guard.id}
              onClick={() => setActiveId(guard.id)}
              style={{
                background: isActive ? `${guard.color}18` : '#13162b',
                border: `1.5px solid ${isActive ? guard.color : '#1e2342'}`,
                borderRadius: '8px',
                padding: '10px 12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontSize: '9px', fontWeight: 800, color: guard.color, background: `${guard.color}20`, padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                {guard.badge}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                {guard.name.split('. ')[1]}
              </div>
            </button>
          );
        })}
      </div>

      {/* Safeguard Details Card */}
      <div className="interactive-diagram-details-card" style={{ background: '#0d0f1e', borderTop: '1px solid #1e2342', padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeGuard.color }} />
          <div style={{ fontSize: '16px', fontWeight: 700, color: activeGuard.color }}>
            {activeGuard.name}
          </div>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
          {activeGuard.mechanism}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', marginBottom: '4px' }}>
              Trigger Condition
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', fontFamily: 'monospace' }}>
              {activeGuard.triggerCondition}
            </div>
          </div>

          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: activeGuard.color, textTransform: 'uppercase', marginBottom: '4px' }}>
              Safeguard Action
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
              {activeGuard.actionTaken}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
