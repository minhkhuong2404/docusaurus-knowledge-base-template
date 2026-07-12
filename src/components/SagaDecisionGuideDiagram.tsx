import React, { useState } from 'react';

interface Decision {
  id: string;
  question: string;
  yes: string;
  no: string;
  yesTarget: string;
  noTarget: string;
}

type Result = 'CHOREOGRAPHY' | 'ORCHESTRATION' | 'ASYNC_ORCH' | 'EITHER';

interface ResultInfo {
  label: string;
  color: string;
  desc: string;
  points: string[];
}

const RESULTS: Record<Result, ResultInfo> = {
  CHOREOGRAPHY: {
    label: 'Choreography ✅',
    color: '#4ade80',
    desc: 'Simple linear flow with ≤4 services. Choreography is sufficient — lower infra, no orchestrator to maintain.',
    points: ['Ensure distributed tracing is in place', 'Write end-to-end integration tests', 'Monitor event schema changes carefully'],
  },
  ORCHESTRATION: {
    label: 'Orchestration 🎯',
    color: '#a78bfa',
    desc: 'Complex, branching, compliance-heavy, or multi-team workflow. Orchestration strongly preferred.',
    points: ['Centralized state machine = full audit log', 'One place to understand and modify the workflow', 'Compensation logic centralized', 'Easier to debug at 2 AM'],
  },
  ASYNC_ORCH: {
    label: 'Async Orchestration (Kafka) ⚡',
    color: '#38bdf8',
    desc: 'Long-running saga or human approval steps require async Kafka-based orchestration. No blocking threads.',
    points: ['Non-blocking orchestrator thread', 'Saga can span minutes/hours/days', 'Handles human approval steps naturally', 'Requires Kafka + idempotency + outbox'],
  },
  EITHER: {
    label: 'Either (Team choice) 🔀',
    color: '#fb923c',
    desc: 'Both patterns work. Choose based on team familiarity and existing infrastructure.',
    points: ['Small team: either is fine', 'Existing event-driven system: choreography may integrate naturally', 'New system: orchestration is easier to start'],
  },
};

const DECISIONS: Decision[] = [
  { id: 'q1', question: 'Simple linear flow? (≤4 services, no branching)', yes: 'Choreography may be sufficient', no: 'Orchestration strongly preferred', yesTarget: 'q2', noTarget: 'ORCHESTRATION' },
  { id: 'q2', question: 'Needs auditing for compliance or finance?', yes: 'Use Orchestration', no: 'Next question', yesTarget: 'ORCHESTRATION', noTarget: 'q3' },
  { id: 'q3', question: 'Multiple teams own different saga participants?', yes: 'Use Orchestration', no: 'Either works', yesTarget: 'ORCHESTRATION', noTarget: 'q4' },
  { id: 'q4', question: 'Long-running saga / human approval steps?', yes: 'Async Orchestration (Kafka)', no: 'Choreography is fine', yesTarget: 'ASYNC_ORCH', noTarget: 'CHOREOGRAPHY' },
];

type NodeId = string;

export default function SagaDecisionGuideDiagram(): React.JSX.Element {
  const [path, setPath] = useState<NodeId[]>(['q1']);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});

  const currentNode = path[path.length - 1];
  const isResult = (n: string): n is Result => ['CHOREOGRAPHY', 'ORCHESTRATION', 'ASYNC_ORCH', 'EITHER'].includes(n);
  const currentDecision = DECISIONS.find(d => d.id === currentNode);
  const result = isResult(currentNode) ? RESULTS[currentNode as Result] : null;

  function answer(yes: boolean) {
    if (!currentDecision) return;
    const next = yes ? currentDecision.yesTarget : currentDecision.noTarget;
    setAnswers(prev => ({ ...prev, [currentNode]: yes }));
    setPath(prev => [...prev, next]);
  }

  function reset() {
    setPath(['q1']);
    setAnswers({});
  }

  const progress = Math.round(((path.length - 1) / 5) * 100);

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: 'middle' }}><path d="M16 3h5v5" /><path d="M4 20L21 3" /><path d="M21 16v5h-5" /><path d="M15 15l6 6" /><path d="M4 4l5 5" /></svg><span style={{ color: '#a78bfa' }}>Choreography vs Orchestration</span> — Full Decision Guide
          </h3>
        </div>
        <button onClick={reset} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.8rem' }}>↩ Reset</button>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.05)' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: result ? (result.color) : '#a78bfa', transition: 'width 0.4s, background 0.3s' }} />
      </div>

      {/* Breadcrumb trail */}
      <div style={{ padding: '8px 1rem', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        {path.map((node, i) => {
          const dec = DECISIONS.find(d => d.id === node);
          const ans = answers[node];
          const label = dec ? (i === 0 ? 'Start' : (ans ? '✓ YES' : '✗ NO')) : (RESULTS[node as Result]?.label ?? node);
          const color = isResult(node) ? RESULTS[node as Result].color : ans === true ? '#4ade80' : ans === false ? '#f87171' : '#a78bfa';
          return (
            <React.Fragment key={node}>
              {i > 0 && <span style={{ color: '#334155', fontSize: '0.75rem' }}>→</span>}
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color, padding: '2px 6px', borderRadius: 3, background: `${color}15`, border: `1px solid ${color}30` }}>{label}</span>
            </React.Fragment>
          );
        })}
      </div>

      {/* Active decision card */}
      {currentDecision && !result && (
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 8, padding: '1rem 1.2rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a78bfa', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>Question {path.length} of 4</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0', lineHeight: 1.5 }}>{currentDecision.question}</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => answer(true)} style={{ flex: 1, padding: '12px', background: 'rgba(74,222,128,0.1)', border: '1.5px solid #4ade80', borderRadius: 6, color: '#4ade80', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'background 0.15s' }}>
              ✓ YES
              <div style={{ fontSize: '0.75rem', color: '#4ade8080', fontWeight: 500, marginTop: 4 }}>{currentDecision.yes}</div>
            </button>
            <button onClick={() => answer(false)} style={{ flex: 1, padding: '12px', background: 'rgba(248,113,113,0.1)', border: '1.5px solid #f87171', borderRadius: 6, color: '#f87171', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'background 0.15s' }}>
              ✗ NO
              <div style={{ fontSize: '0.75rem', color: '#f8717180', fontWeight: 500, marginTop: 4 }}>{currentDecision.no}</div>
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="interactive-diagram-details-card" style={{ borderColor: `${result.color}40`, background: `${result.color}08`, margin: '0' }}>
          <div className="interactive-diagram-card-header">
            
            <h3 style={{ color: result.color }}>Recommendation: {result.label}</h3>
          </div>
          <p>{result.desc}</p>
          <ul>{result.points.map((p, i) => <li key={i}>{p}</li>)}</ul>
          <button onClick={reset} style={{ marginTop: 8, background: `${result.color}15`, border: `1px solid ${result.color}40`, borderRadius: 4, color: result.color, cursor: 'pointer', padding: '6px 16px', fontSize: '0.82rem', fontWeight: 600 }}>↩ Start Over</button>
        </div>
      )}
    </div>
  );
}
