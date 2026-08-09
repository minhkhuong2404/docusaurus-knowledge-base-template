import React, { useState } from 'react';

const TABS = [
  {
    id: 'rabbitmq',
    label: 'RabbitMQ',
    color: '#f97316',
    icon: '🐇',
    overview: 'Traditional message broker using AMQP protocol. Messages are pushed to consumers and deleted on acknowledgement. Exchange-Queue routing model. Best for task queues, complex routing, and RPC patterns.',
    attributes: [
      { k: 'Model', v: 'Push-based (broker pushes to consumers)', good: false },
      { k: 'Retention', v: 'Message deleted after ACK (ephemeral)', good: false },
      { k: 'Ordering', v: 'Queue-level FIFO (no partition concept)', good: null },
      { k: 'Throughput', v: 'Moderate (50K–200K msg/s)', good: false },
      { k: 'Consumer Scale', v: 'Multiple consumers compete (queue)', good: null },
      { k: 'Replay', v: 'Not supported (consumed = gone)', good: false },
      { k: 'Protocol', v: 'AMQP 0-9-1, MQTT, STOMP', good: null },
      { k: 'Best For', v: 'Task queues, RPC, complex routing, low latency', good: true },
      { k: 'Routing', v: 'Exchange → Binding → Queue (flexible)', good: true },
      { k: 'Message TTL', v: 'Per-message or per-queue TTL configurable', good: true },
    ],
  },
  {
    id: 'kafka',
    label: 'Apache Kafka',
    color: '#34d399',
    icon: '⚡',
    overview: 'Distributed commit log / event streaming platform. Consumers pull messages at their own pace. Messages are retained for a configurable period regardless of consumption. Best for high-throughput event pipelines, stream processing, and audit logs.',
    attributes: [
      { k: 'Model', v: 'Pull-based (consumers control pace)', good: true },
      { k: 'Retention', v: 'Time-based or size-based (configurable days)', good: true },
      { k: 'Ordering', v: 'Strict ordering within partition', good: true },
      { k: 'Throughput', v: 'Very high (millions of msg/s via zero-copy)', good: true },
      { k: 'Consumer Scale', v: 'Consumer groups (partition-based fan-out)', good: true },
      { k: 'Replay', v: 'Full replay from any offset within retention', good: true },
      { k: 'Protocol', v: 'Kafka Binary Protocol (TCP)', good: null },
      { k: 'Best For', v: 'Event streaming, audit logs, CDC, ML pipelines', good: true },
      { k: 'Routing', v: 'Topic + Partition (key-based)', good: null },
      { k: 'Message TTL', v: 'retention.ms / retention.bytes per topic', good: true },
    ],
  },
];

const USE_CASES = [
  { label: 'User order notifications', winner: 'rabbitmq', reason: 'Low latency, push to consumers, automatic retry queues' },
  { label: 'Real-time analytics pipeline', winner: 'kafka', reason: 'High throughput, replay, multiple independent consumer groups' },
  { label: 'Microservice RPC / task queue', winner: 'rabbitmq', reason: 'Request-reply pattern, flexible exchange routing, DLQ' },
  { label: 'Database change data capture (CDC)', winner: 'kafka', reason: 'Ordered, replayable event log per table' },
  { label: 'Audit log / compliance', winner: 'kafka', reason: 'Immutable retention, time-based replay, compaction' },
  { label: 'Background job scheduling', winner: 'rabbitmq', reason: 'Per-message TTL, dead-letter queues, priority queues' },
];

export default function KafkaVsRabbitmqDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'rabbitmq' | 'kafka'>('kafka');
  const tab = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) { .kafka-vs-rabbit-grid { grid-template-columns: 1fr !important; } }
      `}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Kafka vs RabbitMQ — When to Use Which</span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Tab buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as 'rabbitmq' | 'kafka')}
              style={{ flex: 1, padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px', background: activeTab === t.id ? `${t.color}18` : 'rgba(255,255,255,0.04)', color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)', boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}50` : '0 0 0 1px rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
              {t.label}
            </button>
          ))}
        </div>

        <p style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 16px', lineHeight: 1.6 }}>{tab.overview}</p>

        <div className="kafka-vs-rabbit-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
          {/* Attributes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Characteristics</div>
            {tab.attributes.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '7px', padding: '8px 10px' }}>
                <span style={{ fontSize: '11px', flexShrink: 0, marginTop: '1px', color: a.good === true ? '#34d399' : a.good === false ? '#f87171' : '#fbbf24' }}>
                  {a.good === true ? '✓' : a.good === false ? '✗' : '~'}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: tab.color, minWidth: '110px', flexShrink: 0 }}>{a.k}:</span>
                <span style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)' }}>{a.v}</span>
              </div>
            ))}
          </div>

          {/* Use cases */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Use Case Decision Guide</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {USE_CASES.map((uc, i) => {
                const isWinner = uc.winner === activeTab;
                const winnerColor = uc.winner === 'kafka' ? '#34d399' : '#f97316';
                return (
                  <div key={i} style={{ background: isWinner ? `${winnerColor}10` : 'rgba(255,255,255,0.02)', border: `1px solid ${isWinner ? winnerColor + '35' : 'rgba(255,255,255,0.06)'}`, borderRadius: '8px', padding: '8px 10px', transition: 'all 0.2s ease' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, color: isWinner ? winnerColor : 'var(--ifm-color-content-secondary)', marginBottom: '3px' }}>
                      {isWinner ? '✓ ' : ''}{uc.label}
                    </div>
                    {isWinner && <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)' }}>{uc.reason}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}