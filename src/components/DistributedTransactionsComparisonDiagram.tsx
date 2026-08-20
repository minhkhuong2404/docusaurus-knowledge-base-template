import React, { useState } from 'react';

type StrategyType = '2pc' | 'saga-choreography' | 'saga-orchestration' | 'outbox-cdc' | 'decision-matrix';

interface StrategyDetail {
  id: StrategyType;
  title: string;
  badge: string;
  badgeColor: string;
  consistencyModel: string;
  lockingModel: string;
  scalability: string;
  summary: string;
  failureHandling: string;
  steps: { actor: string; action: string; status: 'SUCCESS' | 'WARNING' | 'DANGER' }[];
}

const STRATEGIES: StrategyDetail[] = [
  {
    id: '2pc',
    title: '1. Two-Phase Commit (2PC)',
    badge: 'STRONG ACID (SYNCHRONOUS)',
    badgeColor: '#38bdf8',
    consistencyModel: 'Strong Consistency (ACID)',
    lockingModel: 'Synchronous Distributed Locks (Held from Phase 1 to Phase 2)',
    scalability: 'Low Throughput (Collapses under high concurrency & network latency)',
    summary: 'A central coordinator drives all participants through Prepare (Vote & Lock) and Commit/Abort phases.',
    failureHandling: 'If coordinator crashes during Phase 2, participants are stuck in an In-Doubt state holding locks indefinitely.',
    steps: [
      { actor: 'Coordinator', action: 'Broadcasts PREPARE to Order DB, Payment DB, Inventory DB', status: 'SUCCESS' },
      { actor: 'Participants', action: 'Acquire local row locks, flush WAL, and vote YES', status: 'WARNING' },
      { actor: 'Coordinator', action: 'Writes durable COMMIT decision to coordinator log (Point of No Return)', status: 'SUCCESS' },
      { actor: 'Participants', action: 'Apply changes, release locks, and return ACK', status: 'SUCCESS' }
    ]
  },
  {
    id: 'saga-choreography',
    title: '2. Saga Pattern (Choreography)',
    badge: 'EVENT-DRIVEN (DECENTRALIZED)',
    badgeColor: '#34d399',
    consistencyModel: 'Eventual Consistency (BASE)',
    lockingModel: 'No Distributed Locks (Local ACID transactions only)',
    scalability: 'High Throughput (Non-blocking, asynchronous messaging via Kafka/RabbitMQ)',
    summary: 'Services react to domain events published to message brokers without a central controller.',
    failureHandling: 'When a step fails (e.g. PaymentFailed), services publish failure events triggering compensating actions in reverse.',
    steps: [
      { actor: 'Order Service', action: 'Creates order (PENDING) ➔ Publishes "OrderCreated" event', status: 'SUCCESS' },
      { actor: 'Inventory Service', action: 'Consumes "OrderCreated" ➔ Reserves stock ➔ Publishes "StockReserved"', status: 'SUCCESS' },
      { actor: 'Payment Service', action: 'Consumes "StockReserved" ➔ Charge fails ➔ Publishes "PaymentFailed"', status: 'DANGER' },
      { actor: 'Inventory Service', action: 'Consumes "PaymentFailed" ➔ Releases reserved stock (Compensation)', status: 'WARNING' },
      { actor: 'Order Service', action: 'Consumes "PaymentFailed" ➔ Sets order status to CANCELLED', status: 'WARNING' }
    ]
  },
  {
    id: 'saga-orchestration',
    title: '3. Saga Pattern (Orchestration)',
    badge: 'STATE MACHINE (CENTRALIZED)',
    badgeColor: '#a78bfa',
    consistencyModel: 'Eventual Consistency (BASE)',
    lockingModel: 'No Distributed Locks (Orchestrator tracks state machine in DB)',
    scalability: 'High Throughput (Clear workflow observability via Temporal, Step Functions, or custom engine)',
    summary: 'A central orchestrator explicitly invokes worker services via commands and coordinates compensations.',
    failureHandling: 'Orchestrator catches error, logs failure state, and sends explicit compensating commands in reverse order.',
    steps: [
      { actor: 'Orchestrator', action: 'Sends "CreateOrder" command to Order Service ➔ OK', status: 'SUCCESS' },
      { actor: 'Orchestrator', action: 'Sends "ReserveStock" command to Inventory Service ➔ OK', status: 'SUCCESS' },
      { actor: 'Orchestrator', action: 'Sends "ProcessPayment" to Payment Service ➔ FAILS (Card Declined)', status: 'DANGER' },
      { actor: 'Orchestrator', action: 'Sends "CompensateStock" to Inventory Service ➔ Restores inventory', status: 'WARNING' },
      { actor: 'Orchestrator', action: 'Sends "CancelOrder" to Order Service ➔ Marks order CANCELLED', status: 'WARNING' }
    ]
  },
  {
    id: 'outbox-cdc',
    title: '4. Transactional Outbox + CDC',
    badge: 'DUAL-WRITE PREVENTION',
    badgeColor: '#fbbf24',
    consistencyModel: 'At-Least-Once Event Delivery',
    lockingModel: 'Single Local DB Transaction (Domain Entity + Outbox Row)',
    scalability: 'Ultra High (Asynchronous log tailing via Debezium / Kafka Connect)',
    summary: 'Eliminates the dual-write hazard by writing domain data and outbox messages inside the same local transaction.',
    failureHandling: 'Debezium tails the database WAL to stream outbox records into Kafka with zero message loss.',
    steps: [
      { actor: 'Order Service', action: 'BEGIN TX: INSERT orders ... + INSERT outbox ... ➔ COMMIT TX', status: 'SUCCESS' },
      { actor: 'Local Database', action: 'Writes both records atomically to disk in a single local transaction', status: 'SUCCESS' },
      { actor: 'Debezium / CDC', action: 'Tails database WAL log and streams outbox record to Kafka topic', status: 'SUCCESS' },
      { actor: 'Consumer Services', action: 'Consume from Kafka with idempotency key deduplication', status: 'SUCCESS' }
    ]
  },
  {
    id: 'decision-matrix',
    title: '5. Architecture Decision Matrix',
    badge: 'STRATEGY SELECTOR',
    badgeColor: '#f87171',
    consistencyModel: 'Multi-Dimensional Comparison',
    lockingModel: 'Context-Dependent',
    scalability: 'System Design Tradeoffs',
    summary: 'Evaluate 2PC, Saga Choreography, Saga Orchestration, and Outbox based on system requirements.',
    failureHandling: 'Select based on latency SLA, consistency requirements, and service graph complexity.',
    steps: [
      { actor: 'Collocated DBs (<200 TPS)', action: 'Use 2PC / XA if within same JVM & strong consistency required', status: 'SUCCESS' },
      { actor: 'Simple Microservices (2-4 steps)', action: 'Use Saga Choreography with Kafka events', status: 'SUCCESS' },
      { actor: 'Complex Workflows (>5 steps)', action: 'Use Saga Orchestration (Temporal / Camunda / Step Functions)', status: 'SUCCESS' },
      { actor: 'Dual-Write Elimination', action: 'Use Transactional Outbox + Debezium CDC for reliable publishing', status: 'SUCCESS' }
    ]
  }
];

export default function DistributedTransactionsComparisonDiagram(): React.JSX.Element {
  const [activeStrategy, setActiveStrategy] = useState<StrategyType>('2pc');

  const current = STRATEGIES.find((s) => s.id === activeStrategy) ?? STRATEGIES[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        .dist-tx-grid {
          display: grid;
          grid-template-columns: 45% 55%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .dist-tx-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header bar */}
      <div className="interactive-diagram-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderBottom: '1px solid var(--ifm-color-emphasis-200)', background: 'var(--ifm-color-emphasis-100)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 3 21 3 21 8" />
          <line x1="4" y1="20" x2="21" y2="3" />
          <polyline points="21 16 21 21 16 21" />
          <line x1="15" y1="15" x2="21" y2="21" />
          <line x1="4" y1="4" x2="9" y2="9" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Distributed Transactions: 2PC vs. Saga vs. Outbox Pattern
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 600 }}>
          Architecture Explorer
        </span>
      </div>

      {/* Navigation Pills */}
      <div style={{ display: 'flex', gap: '6px', padding: '12px 16px', background: 'var(--ifm-background-surface-color)', borderBottom: '1px solid var(--ifm-color-emphasis-200)', flexWrap: 'wrap' }}>
        {STRATEGIES.map((strat) => (
          <button
            key={strat.id}
            onClick={() => setActiveStrategy(strat.id)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: `1px solid ${activeStrategy === strat.id ? strat.badgeColor : 'var(--ifm-color-emphasis-300)'}`,
              background: activeStrategy === strat.id ? `${strat.badgeColor}18` : 'transparent',
              color: activeStrategy === strat.id ? strat.badgeColor : 'var(--ifm-color-content-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            {strat.title}
          </button>
        ))}
      </div>

      {/* Main Body */}
      <div style={{ padding: '16px' }}>
        <div className="dist-tx-grid">
          {/* Left Column: Properties & Invariants */}
          <div style={{ background: 'var(--ifm-color-emphasis-100)', padding: '14px', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', color: current.badgeColor }}>
                {current.title}
              </h4>
              <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: `${current.badgeColor}20`, color: current.badgeColor }}>
                {current.badge}
              </span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
              {current.summary}
            </p>

            {/* Invariant specs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
              <div style={{ padding: '8px', borderRadius: '4px', background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-300)' }}>
                <strong style={{ color: '#38bdf8' }}>Consistency Model:</strong>
                <div style={{ color: 'var(--ifm-color-content)' }}>{current.consistencyModel}</div>
              </div>
              <div style={{ padding: '8px', borderRadius: '4px', background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-300)' }}>
                <strong style={{ color: '#fbbf24' }}>Locking & Throughput:</strong>
                <div style={{ color: 'var(--ifm-color-content)' }}>{current.lockingModel}</div>
              </div>
              <div style={{ padding: '8px', borderRadius: '4px', background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-300)' }}>
                <strong style={{ color: '#f87171' }}>Failure Recovery:</strong>
                <div style={{ color: 'var(--ifm-color-content)' }}>{current.failureHandling}</div>
              </div>
            </div>
          </div>

          {/* Right Column: Execution Sequence & Flow */}
          <div style={{ background: 'var(--ifm-background-surface-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--ifm-color-content)', marginBottom: '10px' }}>
              Execution Flow & Failure Behavior:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {current.steps.map((st, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '4px',
                    background: 'var(--ifm-color-emphasis-100)',
                    borderLeft: `3px solid ${st.status === 'SUCCESS' ? '#34d399' : st.status === 'WARNING' ? '#fbbf24' : '#f87171'}`,
                    fontSize: '11px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <strong style={{ color: 'var(--ifm-color-content)' }}>{idx + 1}. {st.actor}:</strong>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: st.status === 'SUCCESS' ? '#34d399' : st.status === 'WARNING' ? '#fbbf24' : '#f87171' }}>
                      {st.status}
                    </span>
                  </div>
                  <div style={{ color: 'var(--ifm-color-content-secondary)' }}>
                    {st.action}
                  </div>
                </div>
              ))}
            </div>

            {/* Strategy Takeaway */}
            <div style={{ marginTop: '12px', padding: '8px 10px', borderRadius: '4px', background: `${current.badgeColor}12`, border: `1px dashed ${current.badgeColor}`, fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
              <strong style={{ color: current.badgeColor }}>Senior Takeaway:</strong> {activeStrategy === '2pc' ? '2PC is blocking and sacrifices Availability. Avoid manual 2PC across microservices.' : activeStrategy === 'saga-choreography' ? 'Best for 2-4 services. Beware of cyclic event dependencies and high cognitive overhead.' : activeStrategy === 'saga-orchestration' ? 'Best for complex flows. State machine in code gives full visibility and deterministic compensations.' : activeStrategy === 'outbox-cdc' ? 'Standard pattern for preventing dual-write inconsistencies when publishing events.' : 'Select 2PC for collocated DBs, Saga for microservices, and NewSQL for distributed strong ACID.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
