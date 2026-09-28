import React, { useState } from 'react';

type EdmTab = 'async_flow' | 'outbox_cdc' | 'event_styles' | 'partition_scaling';
type EventStyleKey = 'notification' | 'state_transfer' | 'event_sourcing';

export default function EventDrivenMicroservicesDiagram({ initialTab = 'async_flow' }: { initialTab?: EdmTab }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<EdmTab>(initialTab);
  const [selectedStyle, setSelectedStyle] = useState<EventStyleKey>('state_transfer');
  const [consumerCount, setConsumerCount] = useState<number>(4);
  const [isAsync, setIsAsync] = useState<boolean>(true);

  const totalPartitions = 12;

  const eventStyles: Record<EventStyleKey, {
    title: string;
    subtitle: string;
    color: string;
    payload: string;
    tradeoff: string;
    bestFor: string;
  }> = {
    notification: {
      title: '1. Event Notification (Thin Event)',
      subtitle: 'Carries minimal fact + IDs only. Consumers callback to source API for details.',
      color: '#38bdf8',
      payload: '{\n  "eventId": "evt_9011",\n  "eventType": "OrderCreated",\n  "orderId": "ord_101",\n  "occurredAt": "2026-09-02T12:00:00Z"\n}',
      tradeoff: 'Tiny payload size, but re-introduces synchronous HTTP callbacks to Order Service when 5 consumers query order details.',
      bestFor: 'Large binary files, highly sensitive PII, or internal private domain events.'
    },
    state_transfer: {
      title: '2. Event-Carried State Transfer (Fat Event - Recommended)',
      subtitle: 'Carries fact + full state snapshot so consumers act completely autonomously without callback.',
      color: '#34d399',
      payload: '{\n  "eventId": "evt_9012",\n  "eventType": "OrderCreated",\n  "orderId": "ord_101",\n  "customerId": "cust_88",\n  "totalAmount": 149.50,\n  "currency": "USD",\n  "items": [\n    { "sku": "IPHONE-16", "quantity": 1, "price": 149.50 }\n  ],\n  "shippingAddress": "123 Main St, New York, NY",\n  "occurredAt": "2026-09-02T12:00:00Z"\n}',
      tradeoff: 'Consumers remain 100% decoupled at runtime. Event schema acts as a public API contract requiring strict versioning.',
      bestFor: 'Standard microservices choreography (Orders ➔ Payments ➔ Inventory ➔ Shipping).'
    },
    event_sourcing: {
      title: '3. Event Sourcing (The Event IS Truth)',
      subtitle: 'Entity state is derived entirely by replaying its immutable stream of events from epoch 0.',
      color: '#fbbf24',
      payload: '// Aggregate: Order #101 Event Stream Log\n1. OrderCreated { orderId: 101, amount: 149.50 }\n2. ItemAdded { orderId: 101, sku: "CASE-PRO", price: 29.00 }\n3. DiscountApplied { orderId: 101, code: "SUMMER", discount: 20.00 }\n4. OrderPlaced { orderId: 101, finalTotal: 158.50 }',
      tradeoff: 'Perfect audit log and point-in-time replayability for free. Requires CQRS Read Models & snapshotting at high scale.',
      bestFor: 'Financial ledgers, cryptocurrency wallets, and high-compliance audit systems.'
    }
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Event-Driven Microservices Architecture Visualizer
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'async_flow', label: '⚡ Decoupled Event Flow', color: '#34d399' },
            { id: 'outbox_cdc', label: '📦 Transactional Outbox & CDC', color: '#38bdf8' },
            { id: 'event_styles', label: '📜 3 Event Styles', color: '#fbbf24' },
            { id: 'partition_scaling', label: '📊 Consumer Scaling Simulator', color: '#a78bfa' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as EdmTab)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: `1px solid ${activeTab === t.id ? t.color : 'rgba(255,255,255,0.1)'}`,
                background: activeTab === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                fontWeight: activeTab === t.id ? 700 : 500,
                fontSize: '11.5px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* TAB 1: ASYNC FLOW VS SYNC TRAP */}
        {activeTab === 'async_flow' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '13px', color: 'var(--ifm-color-content)' }}>
                Compare communication paradigms:
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setIsAsync(true)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${isAsync ? '#34d399' : 'rgba(255,255,255,0.1)'}`,
                    background: isAsync ? '#34d39920' : 'transparent',
                    color: isAsync ? '#34d399' : 'var(--ifm-color-content-secondary)',
                    fontWeight: isAsync ? 700 : 500,
                    fontSize: '11.5px',
                    cursor: 'pointer'
                  }}
                >
                  ✅ Asynchronous Event-Driven (Kafka)
                </button>
                <button
                  onClick={() => setIsAsync(false)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${!isAsync ? '#f87171' : 'rgba(255,255,255,0.1)'}`,
                    background: !isAsync ? '#f8717120' : 'transparent',
                    color: !isAsync ? '#f87171' : 'var(--ifm-color-content-secondary)',
                    fontWeight: !isAsync ? 700 : 500,
                    fontSize: '11.5px',
                    cursor: 'pointer'
                  }}
                >
                  ❌ Synchronous REST Chaining (Coupled)
                </button>
              </div>
            </div>

            {/* SVG Flow Canvas */}
            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
              <svg viewBox="0 0 820 200" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="edm-arrow-green" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#34d399" />
                  </marker>
                  <marker id="edm-arrow-red" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#f87171" />
                  </marker>
                  <marker id="edm-arrow-blue" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#38bdf8" />
                  </marker>
                </defs>

                {isAsync ? (
                  <g transform="translate(15, 20)">
                    {/* Order Service Producer */}
                    <rect x="0" y="45" width="160" height="90" rx="8" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" strokeWidth="1.5" />
                    <text x="15" y="70" fill="#34d399" fontSize="12" fontWeight="700">📦 Order Service</text>
                    <text x="15" y="90" fill="#e2e8f0" fontSize="9">1. Saves Order to DB</text>
                    <text x="15" y="108" fill="#86efac" fontSize="9" fontWeight="700">2. Emits `OrderCreated`</text>
                    <text x="15" y="123" fill="#94a3b8" fontSize="8">Returns 202 Accepted in 15ms</text>

                    {/* Flow to Kafka */}
                    <path d="M 165 90 L 255 90" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#edm-arrow-green)" className="interactive-diagram-flowing-path" />
                    <text x="175" y="80" fill="#34d399" fontSize="9" fontWeight="700">Publish Event</text>

                    {/* Kafka Message Broker */}
                    <rect x="260" y="20" width="230" height="140" rx="8" fill="rgba(15, 23, 42, 0.85)" stroke="#38bdf8" strokeWidth="1.5" />
                    <text x="275" y="45" fill="#38bdf8" fontSize="12" fontWeight="700">📬 Apache Kafka / RabbitMQ</text>
                    <text x="275" y="65" fill="#93c5fd" fontSize="9">Topic: `orders.created`</text>
                    <rect x="275" y="75" width="200" height="35" rx="4" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" />
                    <text x="285" y="96" fill="#ffffff" fontSize="9" fontWeight="700">[Key: "ord_101"] Partition 2</text>
                    <text x="275" y="130" fill="#a7f3d0" fontSize="8">• Decoupled Temporal Buffer</text>
                    <text x="275" y="145" fill="#a7f3d0" fontSize="8">• Replayable & Fan-out Pub/Sub</text>

                    {/* Flows to Consumers */}
                    <path d="M 495 65 L 565 40" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#edm-arrow-green)" className="interactive-diagram-flowing-path" />
                    <path d="M 495 90 L 565 95" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#edm-arrow-green)" className="interactive-diagram-flowing-path" />
                    <path d="M 495 115 L 565 150" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#edm-arrow-green)" className="interactive-diagram-flowing-path" />

                    {/* Consumers */}
                    <rect x="570" y="15" width="210" height="45" rx="6" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" />
                    <text x="580" y="35" fill="#38bdf8" fontSize="10" fontWeight="700">💳 Payment Service (Group A)</text>
                    <text x="580" y="50" fill="#e2e8f0" fontSize="8">Charges credit card asynchronously</text>

                    <rect x="570" y="75" width="210" height="45" rx="6" fill="rgba(251, 191, 36, 0.15)" stroke="#fbbf24" />
                    <text x="580" y="95" fill="#fbbf24" fontSize="10" fontWeight="700">🏭 Inventory Service (Group B)</text>
                    <text x="580" y="110" fill="#e2e8f0" fontSize="8">Reserves stock items</text>

                    <rect x="570" y="135" width="210" height="45" rx="6" fill="rgba(167, 139, 250, 0.15)" stroke="#a78bfa" />
                    <text x="580" y="155" fill="#a78bfa" fontSize="10" fontWeight="700">📧 Notification Service (Group C)</text>
                    <text x="580" y="170" fill="#e2e8f0" fontSize="8">Sends confirmation email to user</text>
                  </g>
                ) : (
                  <g transform="translate(15, 20)">
                    {/* Synchronous Chaining Trap */}
                    <rect x="0" y="45" width="160" height="90" rx="8" fill="rgba(248, 113, 113, 0.15)" stroke="#f87171" strokeWidth="1.5" />
                    <text x="15" y="70" fill="#f87171" fontSize="12" fontWeight="700">📦 Order Service</text>
                    <text x="15" y="90" fill="#fecaca" fontSize="9">1. Blocks on Payment HTTP</text>
                    <text x="15" y="108" fill="#fecaca" fontSize="9">2. Blocks on Inventory HTTP</text>
                    <text x="15" y="125" fill="#f87171" fontSize="8" fontWeight="700">Latency: 2,500ms (High Fragility)</text>

                    <path d="M 165 70 L 265 45" fill="none" stroke="#f87171" strokeWidth="2" markerEnd="url(#edm-arrow-red)" />
                    <text x="180" y="50" fill="#f87171" fontSize="9">Sync POST (Blocking)</text>

                    <rect x="270" y="20" width="220" height="50" rx="6" fill="rgba(248, 113, 113, 0.15)" stroke="#f87171" />
                    <text x="280" y="40" fill="#f87171" fontSize="10" fontWeight="700">💳 Payment Service (Online)</text>
                    <text x="280" y="58" fill="#e2e8f0" fontSize="8">Takes 800ms to process</text>

                    <path d="M 165 110 L 265 135" fill="none" stroke="#f87171" strokeWidth="2" markerEnd="url(#edm-arrow-red)" />
                    <text x="180" y="130" fill="#f87171" fontSize="9">Sync POST (Blocking)</text>

                    <rect x="270" y="110" width="220" height="50" rx="6" fill="rgba(248, 113, 113, 0.25)" stroke="#f87171" strokeDasharray="4 4" />
                    <text x="280" y="130" fill="#f87171" fontSize="10" fontWeight="700">🏭 Inventory Service (DOWN / SLOW)</text>
                    <text x="280" y="148" fill="#fecaca" fontSize="8">💥 HTTP 504 Gateway Timeout!</text>

                    <rect x="520" y="35" width="270" height="110" rx="8" fill="rgba(15, 23, 42, 0.85)" stroke="#f87171" />
                    <text x="535" y="60" fill="#f87171" fontSize="11" fontWeight="700">💥 Cascading Failure Trap</text>
                    <text x="535" y="80" fill="#fecaca" fontSize="9">• If Inventory crashes, Order creation FAILS.</text>
                    <text x="535" y="100" fill="#fecaca" fontSize="9">• Order service worker threads exhaust connection pools.</text>
                    <text x="535" y="120" fill="#fecaca" fontSize="9">• Complete distributed outage from 1 slow service.</text>
                  </g>
                )}
              </svg>
            </div>
          </div>
        )}

        {/* TAB 2: TRANSACTIONAL OUTBOX & CDC */}
        {activeTab === 'outbox_cdc' && (
          <div>
            <div style={{
              padding: '12px 16px',
              background: 'rgba(56, 189, 248, 0.06)',
              borderLeft: '4px solid #38bdf8',
              borderRadius: '0 8px 8px 0',
              marginBottom: '14px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
                Solving the "Dual-Write" Problem via Transactional Outbox + Debezium CDC
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                Never write to a database and then publish directly to Kafka inside the same method. If the JVM crashes before `kafkaTemplate.send()`, the event is permanently lost. <strong>The Outbox pattern writes the event into an `outbox` table inside the exact same ACID transaction as the domain entity.</strong> Debezium reads the PostgreSQL WAL (Write-Ahead Log) and ships it to Kafka guaranteed.
              </div>
            </div>

            {/* SVG Outbox Canvas */}
            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
              <svg viewBox="0 0 820 180" style={{ width: '100%', height: 'auto', display: 'block' }}>
                {/* 1. App Service */}
                <g transform="translate(15, 20)">
                  <rect x="0" y="25" width="160" height="90" rx="8" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" />
                  <text x="15" y="50" fill="#34d399" fontSize="11" fontWeight="700">1. Order Service</text>
                  <text x="15" y="70" fill="#e2e8f0" fontSize="9">@Transactional</text>
                  <text x="15" y="88" fill="#a7f3d0" fontSize="9">Single ACID Commit</text>
                </g>

                <path d="M 180 80 L 230 80" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#edm-arrow-green)" className="interactive-diagram-flowing-path" />

                {/* 2. PostgreSQL DB Boundary */}
                <g transform="translate(235, 10)">
                  <rect x="0" y="0" width="220" height="135" rx="8" fill="rgba(15, 23, 42, 0.85)" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="15" y="25" fill="#38bdf8" fontSize="11" fontWeight="700">🗄️ PostgreSQL (Local ACID)</text>
                  <rect x="15" y="35" width="190" height="35" rx="4" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" />
                  <text x="25" y="56" fill="#ffffff" fontSize="9" fontWeight="700">Table: `orders` (ID: 101)</text>

                  <rect x="15" y="80" width="190" height="40" rx="4" fill="rgba(251, 191, 36, 0.2)" stroke="#fbbf24" />
                  <text x="25" y="98" fill="#fbbf24" fontSize="9" fontWeight="700">Table: `outbox`</text>
                  <text x="25" y="112" fill="#fef08a" fontSize="8">{`{ event: "OrderCreated", id: 101 }`}</text>
                </g>

                <path d="M 460 80 L 510 80" fill="none" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#edm-arrow-green)" className="interactive-diagram-flowing-path" />
                <text x="465" y="70" fill="#fbbf24" fontSize="8" fontWeight="700">WAL Stream</text>

                {/* 3. Debezium CDC Engine */}
                <g transform="translate(515, 20)">
                  <rect x="0" y="0" width="140" height="115" rx="8" fill="rgba(167, 139, 250, 0.15)" stroke="#a78bfa" strokeWidth="1.5" />
                  <text x="12" y="26" fill="#a78bfa" fontSize="11" fontWeight="700">3. Debezium CDC</text>
                  <text x="12" y="48" fill="#e2e8f0" fontSize="9">• Reads DB WAL logs</text>
                  <text x="12" y="66" fill="#e2e8f0" fontSize="9">• 0% Polling overhead</text>
                  <text x="12" y="86" fill="#c4b5fd" fontSize="8">• At-Least-Once Delivery</text>
                </g>

                <path d="M 660 80 L 700 80" fill="none" stroke="#a78bfa" strokeWidth="2" markerEnd="url(#edm-arrow-green)" className="interactive-diagram-flowing-path" />

                {/* 4. Kafka Topic */}
                <g transform="translate(705, 20)">
                  <rect x="0" y="15" width="105" height="85" rx="6" fill="rgba(52, 211, 153, 0.2)" stroke="#34d399" />
                  <text x="10" y="45" fill="#34d399" fontSize="10" fontWeight="700">4. Kafka Topic</text>
                  <text x="10" y="65" fill="#86efac" fontSize="8">`orders.created`</text>
                  <text x="10" y="85" fill="#ffffff" fontSize="8">Partitioned</text>
                </g>
              </svg>
            </div>
          </div>
        )}

        {/* TAB 3: 3 EVENT STYLES */}
        {activeTab === 'event_styles' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              {(['notification', 'state_transfer', 'event_sourcing'] as EventStyleKey[]).map(style => (
                <button
                  key={style}
                  onClick={() => setSelectedStyle(style)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: `1px solid ${selectedStyle === style ? eventStyles[style].color : 'rgba(255,255,255,0.08)'}`,
                    background: selectedStyle === style ? `${eventStyles[style].color}20` : 'rgba(255,255,255,0.02)',
                    color: selectedStyle === style ? eventStyles[style].color : 'var(--ifm-color-content-secondary)',
                    fontWeight: selectedStyle === style ? 700 : 500,
                    fontSize: '11.5px',
                    cursor: 'pointer'
                  }}
                >
                  {eventStyles[style].title.split('(')[0]}
                </button>
              ))}
            </div>

            <div style={{
              padding: '14px',
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid ${eventStyles[selectedStyle].color}40`,
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: eventStyles[selectedStyle].color, marginBottom: '4px' }}>
                {eventStyles[selectedStyle].title}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', marginBottom: '10px' }}>
                {eventStyles[selectedStyle].subtitle}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>Sample JSON Wire Payload:</div>
                  <pre style={{ margin: 0, color: '#e2e8f0', fontSize: '11px', fontFamily: 'monospace', background: 'transparent', padding: 0 }}>
                    <code>{eventStyles[selectedStyle].payload}</code>
                  </pre>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', marginBottom: '2px' }}>⚖️ Trade-off:</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>{eventStyles[selectedStyle].tradeoff}</div>
                  </div>
                  <div style={{ padding: '10px', background: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.2)', borderRadius: '6px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', marginBottom: '2px' }}>🎯 When to choose:</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>{eventStyles[selectedStyle].bestFor}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CONSUMER GROUP PARTITION ALLOCATION SIMULATOR */}
        {activeTab === 'partition_scaling' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '13px', color: 'var(--ifm-color-content)' }}>
                Topic: <strong style={{ color: '#38bdf8' }}>`orders.created` (12 Partitions)</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)' }}>Consumer Instances in Group:</span>
                <input
                  type="range"
                  min="1"
                  max="16"
                  step="1"
                  value={consumerCount}
                  onChange={e => setConsumerCount(Number(e.target.value))}
                  style={{ cursor: 'pointer', width: '120px' }}
                />
                <span style={{ fontSize: '13px', fontWeight: 700, color: consumerCount > 12 ? '#f87171' : '#34d399', fontFamily: 'monospace' }}>
                  {consumerCount} instances
                </span>
              </div>
            </div>

            {/* Partition Allocation Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', marginBottom: '14px' }}>
              {Array.from({ length: totalPartitions }).map((_, idx) => {
                const assignedConsumer = idx % Math.min(consumerCount, totalPartitions);
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '8px',
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid #38bdf8',
                      borderRadius: '6px',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>Partition {idx}</div>
                    <div style={{ fontSize: '10px', color: '#a7f3d0', marginTop: '4px', fontWeight: 600 }}>
                      ➔ Consumer #{assignedConsumer + 1}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Consumer State Banner */}
            <div style={{
              padding: '12px 14px',
              background: consumerCount > 12 ? 'rgba(248, 113, 113, 0.08)' : 'rgba(52, 211, 153, 0.08)',
              borderLeft: `4px solid ${consumerCount > 12 ? '#f87171' : '#34d399'}`,
              borderRadius: '0 6px 6px 0'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: consumerCount > 12 ? '#f87171' : '#34d399', marginBottom: '4px' }}>
                {consumerCount <= 12
                  ? `Balanced Allocation: ${consumerCount} Active Consumers (~${(totalPartitions / consumerCount).toFixed(1)} partitions each)`
                  : `⚠️ Over-Provisioned: 12 Active Consumers, ${consumerCount - 12} Idle Consumers (Wasted Capacity!)`}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
                {consumerCount <= 12
                  ? `Each consumer is allocated one or more partitions. Maximum parallelism for this topic is ${totalPartitions}.`
                  : `Kafka enforces that a single partition can only be consumed by 1 active consumer per group. Any instances beyond ${totalPartitions} sit completely idle.`}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
