import React, { useState } from 'react';

type SagaFlowMode = 'success' | 'payment-fail' | 'pivot-concept';

interface SagaStepNode {
  stepName: string;
  service: string;
  type: 'COMPENSABLE' | 'PIVOT' | 'RETRYABLE' | 'COMPENSATION';
  status: 'DONE' | 'FAILED' | 'COMPENSATED' | 'SKIPPED';
  action: string;
  color: string;
}

interface SagaLifecycleData {
  id: SagaFlowMode;
  title: string;
  badge: string;
  badgeColor: string;
  summary: string;
  steps: SagaStepNode[];
  insight: string;
}

const LIFECYCLES: SagaLifecycleData[] = [
  {
    id: 'success',
    title: 'Happy Path: All Local Transactions Commit',
    badge: 'SAGA COMPLETED',
    badgeColor: '#34d399',
    summary: 'Each service executes its local ACID transaction and signals the next step until the entire business transaction is complete.',
    steps: [
      { stepName: 'Step 1: Create Order', service: 'Order Service (Postgres)', type: 'COMPENSABLE', status: 'DONE', action: 'INSERT order (status=PENDING)', color: '#34d399' },
      { stepName: 'Step 2: Reserve Inventory', service: 'Inventory Service (MySQL)', type: 'COMPENSABLE', status: 'DONE', action: 'UPDATE stock SET qty = qty - 1', color: '#34d399' },
      { stepName: 'Step 3: Charge Payment (Pivot)', service: 'Payment Service (Stripe)', type: 'PIVOT', status: 'DONE', action: 'Charge credit card $99.00', color: '#38bdf8' },
      { stepName: 'Step 4: Dispatch Notification', service: 'Notification Service', type: 'RETRYABLE', status: 'DONE', action: 'Send confirmation email', color: '#34d399' }
    ],
    insight: 'All forward steps succeeded. No compensating transactions were necessary.'
  },
  {
    id: 'payment-fail',
    title: 'Failure Path: Payment Fails ➔ Backward Compensation',
    badge: 'COMPENSATED',
    badgeColor: '#f87171',
    summary: 'Payment fails at Step 3. The system halts forward execution and executes compensating actions in reverse order (C2, C1).',
    steps: [
      { stepName: 'Step 1: Create Order', service: 'Order Service', type: 'COMPENSABLE', status: 'COMPENSATED', action: 'Compensated by C1: Mark order CANCELLED', color: '#fbbf24' },
      { stepName: 'Step 2: Reserve Inventory', service: 'Inventory Service', type: 'COMPENSABLE', status: 'COMPENSATED', action: 'Compensated by C2: Restore inventory + 1', color: '#fbbf24' },
      { stepName: 'Step 3: Charge Payment', service: 'Payment Service', type: 'PIVOT', status: 'FAILED', action: '❌ Card Declined / Insufficient funds', color: '#f87171' },
      { stepName: 'Step 4: Notification', service: 'Notification Service', type: 'RETRYABLE', status: 'SKIPPED', action: 'Skipped because earlier step failed', color: 'var(--ifm-color-emphasis-400)' }
    ],
    insight: 'Compensations are NEW forward-moving transactions that semantically undo prior effects. Database logs are NOT rewound.'
  },
  {
    id: 'pivot-concept',
    title: 'The Pivot Transaction & Saga Step Taxonomy',
    badge: 'TAXONOMY',
    badgeColor: '#a78bfa',
    summary: 'A Saga is divided into three distinct classes of transactions: Compensable, Pivot, and Retryable.',
    steps: [
      { stepName: '1. Compensable Transactions', service: 'Steps 1 & 2', type: 'COMPENSABLE', status: 'DONE', action: 'Can be rolled back by a corresponding compensating transaction (C1, C2).', color: '#38bdf8' },
      { stepName: '2. Pivot Transaction', service: 'Step 3 (Payment)', type: 'PIVOT', status: 'DONE', action: 'The go/no-go boundary. Once committed, the Saga is guaranteed to finish.', color: '#a78bfa' },
      { stepName: '3. Retryable Transactions', service: 'Step 4 (Delivery/Email)', type: 'RETRYABLE', status: 'DONE', action: 'Occur after the Pivot. Must be idempotent and guaranteed to eventually succeed.', color: '#34d399' }
    ],
    insight: 'Understanding the Pivot Step simplifies failure handling: if failure happens before/at Pivot ➔ Compensate; if after Pivot ➔ Retry until successful.'
  }
];

export default function SagaCompensationLifecycleDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<SagaFlowMode>('payment-fail');

  const current = LIFECYCLES.find((l) => l.id === activeTab) ?? LIFECYCLES[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        .saga-comp-grid {
          display: grid;
          grid-template-columns: 35% 65%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .saga-comp-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header bar */}
      <div className="interactive-diagram-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderBottom: '1px solid var(--ifm-color-emphasis-200)', background: 'var(--ifm-color-emphasis-100)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Saga Execution Lifecycle: Forward Actions & Compensations
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: `${current.badgeColor}20`, color: current.badgeColor, fontWeight: 600 }}>
          {current.badge}
        </span>
      </div>

      {/* Mode Selector Tabs */}
      <div style={{ display: 'flex', gap: '6px', padding: '10px 16px', background: 'var(--ifm-background-surface-color)', borderBottom: '1px solid var(--ifm-color-emphasis-200)', flexWrap: 'wrap' }}>
        {LIFECYCLES.map((l) => (
          <button
            key={l.id}
            onClick={() => setActiveTab(l.id)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: `1px solid ${activeTab === l.id ? l.badgeColor : 'var(--ifm-color-emphasis-300)'}`,
              background: activeTab === l.id ? `${l.badgeColor}18` : 'transparent',
              color: activeTab === l.id ? l.badgeColor : 'var(--ifm-color-content-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            {l.title.split(':')[0]}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ padding: '16px' }}>
        <div className="saga-comp-grid">
          {/* Left Column: Summary & Insight */}
          <div style={{ background: 'var(--ifm-color-emphasis-100)', padding: '14px', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: current.badgeColor }}>
              {current.title}
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
              {current.summary}
            </p>

            <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--ifm-background-surface-color)', borderLeft: `3px solid ${current.badgeColor}`, fontSize: '11px', lineHeight: 1.45 }}>
              <div style={{ fontWeight: 700, color: current.badgeColor, marginBottom: '4px' }}>Key Architectural Takeaway:</div>
              <div style={{ color: 'var(--ifm-color-content)' }}>{current.insight}</div>
            </div>
          </div>

          {/* Right Column: Node Pipeline */}
          <div style={{ background: 'var(--ifm-background-surface-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ifm-color-content)', marginBottom: '10px' }}>
              Sequence of Local ACID Steps:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {current.steps.map((st, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'var(--ifm-color-emphasis-100)',
                    borderLeft: `4px solid ${st.color}`
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--ifm-color-content)' }}>
                        {st.stepName}
                      </span>
                      <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '3px', background: `${st.color}20`, color: st.color }}>
                        {st.type}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                      {st.service} • {st.action}
                    </div>
                  </div>

                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: `${st.color}20`, color: st.color }}>
                    {st.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
