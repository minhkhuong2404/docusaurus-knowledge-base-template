import React, { useState } from 'react';

type FailureScenario = 'normal' | 'partial-failure' | 'dual-write';

interface ScenarioInfo {
  id: FailureScenario;
  title: string;
  badge: string;
  badgeColor: string;
  description: string;
  services: {
    name: string;
    db: string;
    action: string;
    state: 'COMMITTED' | 'FAILED' | 'LOST' | 'PENDING';
    color: string;
  }[];
  consequence: string;
}

const SCENARIOS: ScenarioInfo[] = [
  {
    id: 'normal',
    title: 'Happy Path: All Services Succeed',
    badge: 'ALL COMMITTED',
    badgeColor: '#34d399',
    description: 'All three services successfully write to their respective data stores in sequence.',
    services: [
      { name: '1. Order Service', db: 'PostgreSQL DB', action: 'INSERT order (status=PENDING)', state: 'COMMITTED', color: '#34d399' },
      { name: '2. Inventory Service', db: 'MySQL DB', action: 'UPDATE stock SET qty = qty - 1', state: 'COMMITTED', color: '#34d399' },
      { name: '3. Payment Service', db: 'Stripe API', action: 'Charge credit card $99.00', state: 'COMMITTED', color: '#34d399' }
    ],
    consequence: '✅ System remains consistent across all 3 service boundaries.'
  },
  {
    id: 'partial-failure',
    title: 'Partial Failure: Payment Fails After DB Writes',
    badge: 'STATE DIVERGENCE',
    badgeColor: '#f87171',
    description: 'Order and Inventory are committed to physical disks, but Payment card is declined.',
    services: [
      { name: '1. Order Service', db: 'PostgreSQL DB', action: 'INSERT order (COMMITTED to disk)', state: 'COMMITTED', color: '#34d399' },
      { name: '2. Inventory Service', db: 'MySQL DB', action: 'Stock deducted (COMMITTED to disk)', state: 'COMMITTED', color: '#34d399' },
      { name: '3. Payment Service', db: 'Stripe API', action: 'Card DECLINED / Network timeout (HTTP 504)', state: 'FAILED', color: '#f87171' }
    ],
    consequence: '🚨 DISASTER: Customer is NOT charged, but inventory is deducted and an active order exists on disk! No single database rollback can span these three systems.'
  },
  {
    id: 'dual-write',
    title: 'Dual-Write Crash: DB Saved, Message Lost',
    badge: 'SILENT DESYNC',
    badgeColor: '#fbbf24',
    description: 'Service saves entity locally, but JVM crashes or network drops before publishing event to Kafka.',
    services: [
      { name: '1. Local Database', db: 'PostgreSQL', action: 'orderRepository.save(order) ➔ COMMITTED', state: 'COMMITTED', color: '#34d399' },
      { name: '2. JVM / Process', db: 'Application Node', action: '💥 CRASH / OOM / Network Partition', state: 'FAILED', color: '#f87171' },
      { name: '3. Kafka Broker', db: 'Topic: "orders"', action: 'kafkaTemplate.send() NEVER REACHED', state: 'LOST', color: '#fbbf24' }
    ],
    consequence: '🚨 SILENT DATA LOSS: Order exists in DB forever, but downstream Inventory and Payment services never learn of its existence.'
  }
];

export default function EcommerceDistributedFailureDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<FailureScenario>('partial-failure');

  const current = SCENARIOS.find((s) => s.id === activeTab) ?? SCENARIOS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        .ecom-fail-grid {
          display: grid;
          grid-template-columns: 35% 65%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .ecom-fail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header bar */}
      <div className="interactive-diagram-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderBottom: '1px solid var(--ifm-color-emphasis-200)', background: 'var(--ifm-color-emphasis-100)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          E-Commerce Distributed Checkout: Partial Failures & Dual-Write Hazard
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: `${current.badgeColor}20`, color: current.badgeColor, fontWeight: 600 }}>
          {current.badge}
        </span>
      </div>

      {/* Scenario Selector Tabs */}
      <div style={{ display: 'flex', gap: '6px', padding: '10px 16px', background: 'var(--ifm-background-surface-color)', borderBottom: '1px solid var(--ifm-color-emphasis-200)', flexWrap: 'wrap' }}>
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveTab(s.id)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: `1px solid ${activeTab === s.id ? s.badgeColor : 'var(--ifm-color-emphasis-300)'}`,
              background: activeTab === s.id ? `${s.badgeColor}18` : 'transparent',
              color: activeTab === s.id ? s.badgeColor : 'var(--ifm-color-content-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            {s.title.split(':')[0]}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ padding: '16px' }}>
        <div className="ecom-fail-grid">
          {/* Left Column: Context & Consequence */}
          <div style={{ background: 'var(--ifm-color-emphasis-100)', padding: '14px', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: current.badgeColor }}>
              {current.title}
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
              {current.description}
            </p>

            <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--ifm-background-surface-color)', borderLeft: `3px solid ${current.badgeColor}`, fontSize: '11px', lineHeight: 1.45 }}>
              <div style={{ fontWeight: 700, color: current.badgeColor, marginBottom: '4px' }}>System Impact:</div>
              <div style={{ color: 'var(--ifm-color-content)' }}>{current.consequence}</div>
            </div>
          </div>

          {/* Right Column: Visual Pipeline of Nodes */}
          <div style={{ background: 'var(--ifm-background-surface-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ifm-color-content)', marginBottom: '10px' }}>
              Multi-Service Execution Pipeline:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {current.services.map((svc, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    background: 'var(--ifm-color-emphasis-100)',
                    border: `1px solid ${svc.color}40`,
                    borderLeft: `4px solid ${svc.color}`
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ifm-color-content)' }}>
                      {svc.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                      Storage: <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{svc.db}</span> • {svc.action}
                    </div>
                  </div>

                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: `${svc.color}20`, color: svc.color }}>
                    {svc.state}
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
