import React, { useState } from 'react';

type CoordPattern = 'choreography' | 'orchestration' | 'comparison';

interface PatternData {
  id: CoordPattern;
  title: string;
  badge: string;
  badgeColor: string;
  communicationStyle: string;
  coupling: string;
  observability: string;
  summary: string;
  pros: string[];
  cons: string[];
  bestFor: string;
}

const PATTERNS: PatternData[] = [
  {
    id: 'choreography',
    title: '1. Choreography (Decentralized Events)',
    badge: 'EVENT-DRIVEN',
    badgeColor: '#34d399',
    communicationStyle: 'Asynchronous Pub/Sub via Message Broker (Kafka / RabbitMQ)',
    coupling: 'Loose Coupling (Services know about events, not other services)',
    observability: 'Low (Distributed state across services; requires distributed tracing / OpenTelemetry)',
    summary: 'Services publish domain events when local transactions complete. Other services listen and react autonomously without a centralized controller.',
    pros: [
      'Simpler to start with small service topologies (2–3 services)',
      'No single point of failure or centralized bottleneck',
      'Services remain loosely coupled and autonomously deployable'
    ],
    cons: [
      'High cognitive overhead: impossible to understand full business workflow in one place',
      'Risk of cyclic event storms and infinite loops',
      'Extremely difficult to integration-test and trace during 2 AM production outages'
    ],
    bestFor: 'Simple workflows with 2–4 services where failure handling is linear and straightforward.'
  },
  {
    id: 'orchestration',
    title: '2. Orchestration (Centralized State Machine)',
    badge: 'STATE MACHINE',
    badgeColor: '#a78bfa',
    communicationStyle: 'Direct Command/Reply (gRPC / HTTP / Task Queues)',
    coupling: 'Services coupled to Orchestrator commands, but decoupled from each other',
    observability: 'High (Single UI / dashboard to inspect live state of any order: Temporal, Step Functions, Camunda)',
    summary: 'A dedicated orchestrator component acts as the coordinator state machine, explicitly dispatching commands to domain services and directing compensations.',
    pros: [
      'Clear, centralized visibility of entire workflow state in a single state machine',
      'Deterministic error handling, retry policies, and timeout management',
      'Easy to add new steps or modify workflow logic without modifying worker services'
    ],
    cons: [
      'Requires running and operating orchestrator infrastructure (Temporal / Camunda / Step Functions)',
      'Risk of putting too much domain business logic into the orchestrator (anemic services)'
    ],
    bestFor: 'Complex multi-step workflows (>4 services), workflows with conditional branching, human approval steps, or strict SLA timeouts.'
  },
  {
    id: 'comparison',
    title: '3. Side-by-Side Comparison & Decision Rule',
    badge: 'SELECTION RULE',
    badgeColor: '#38bdf8',
    communicationStyle: 'Architectural Tradeoff Matrix',
    coupling: 'Context-Dependent',
    observability: 'Key Selection Factor',
    summary: 'Rule of thumb: 2–3 steps with simple failure handling ➔ Choreography. 4+ steps, distinct retry/timeout policies, or need for real-time status inspection ➔ Orchestration.',
    pros: [
      'Choreography: Minimal initial infrastructure overhead',
      'Orchestration: Superior production observability and auditability',
      'Hybrid approach: Orchestration for core business flows + Choreography for notifications'
    ],
    cons: [
      'Choreography becomes unmaintainable past 5 services',
      'Orchestration adds operational complexity for tiny apps'
    ],
    bestFor: 'Senior engineering teams balancing development velocity with long-term operability.'
  }
];

export default function SagaChoreographyVsOrchestrationDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<CoordPattern>('choreography');

  const current = PATTERNS.find((p) => p.id === activeTab) ?? PATTERNS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        .saga-arch-grid {
          display: grid;
          grid-template-columns: 42% 58%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .saga-arch-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header bar */}
      <div className="interactive-diagram-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderBottom: '1px solid var(--ifm-color-emphasis-200)', background: 'var(--ifm-color-emphasis-100)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Saga Coordination: Choreography vs. Orchestration Deep Dive
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: `${current.badgeColor}20`, color: current.badgeColor, fontWeight: 600 }}>
          {current.badge}
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', padding: '10px 16px', background: 'var(--ifm-background-surface-color)', borderBottom: '1px solid var(--ifm-color-emphasis-200)', flexWrap: 'wrap' }}>
        {PATTERNS.map((p) => (
          <button
            key={p.id}
            onClick={() => setActiveTab(p.id)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: `1px solid ${activeTab === p.id ? p.badgeColor : 'var(--ifm-color-emphasis-300)'}`,
              background: activeTab === p.id ? `${p.badgeColor}18` : 'transparent',
              color: activeTab === p.id ? p.badgeColor : 'var(--ifm-color-content-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            {p.title.split(':')[0]}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ padding: '16px' }}>
        <div className="saga-arch-grid">
          {/* Left Column: Properties */}
          <div style={{ background: 'var(--ifm-color-emphasis-100)', padding: '14px', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: current.badgeColor }}>
              {current.title}
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
              {current.summary}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
              <div style={{ padding: '6px 8px', borderRadius: '4px', background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-300)' }}>
                <strong style={{ color: '#38bdf8' }}>Communication:</strong>
                <div style={{ color: 'var(--ifm-color-content)' }}>{current.communicationStyle}</div>
              </div>
              <div style={{ padding: '6px 8px', borderRadius: '4px', background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-300)' }}>
                <strong style={{ color: '#a78bfa' }}>Observability:</strong>
                <div style={{ color: 'var(--ifm-color-content)' }}>{current.observability}</div>
              </div>
              <div style={{ padding: '6px 8px', borderRadius: '4px', background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-300)' }}>
                <strong style={{ color: '#34d399' }}>Best Recommended For:</strong>
                <div style={{ color: 'var(--ifm-color-content)' }}>{current.bestFor}</div>
              </div>
            </div>
          </div>

          {/* Right Column: Pros and Cons */}
          <div style={{ background: 'var(--ifm-background-surface-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '6px' }}>
                ✅ Advantages & Strengths:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {current.pros.map((pr, i) => (
                  <div key={i} style={{ fontSize: '11px', color: 'var(--ifm-color-content)', display: 'flex', alignItems: 'start', gap: '6px' }}>
                    <span style={{ color: '#34d399' }}>•</span>
                    <span>{pr}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', marginBottom: '6px' }}>
                ⚠️ Challenges & Tradeoffs:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {current.cons.map((cn, i) => (
                  <div key={i} style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', display: 'flex', alignItems: 'start', gap: '6px' }}>
                    <span style={{ color: '#f87171' }}>•</span>
                    <span>{cn}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
