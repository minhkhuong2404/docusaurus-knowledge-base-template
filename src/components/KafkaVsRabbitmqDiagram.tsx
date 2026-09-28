import React, { useState } from 'react';

type TechId = 'kafka' | 'rabbitmq' | 'sqs';

interface Attribute {
  k: string;
  v: string;
  good: boolean | null;
}

interface TechTab {
  id: TechId;
  label: string;
  color: string;
  badgeBg: string;
  overview: string;
  attributes: Attribute[];
}

const TABS: TechTab[] = [
  {
    id: 'kafka',
    label: 'Apache Kafka',
    color: '#15803d',
    badgeBg: '#dcfce7',
    overview:
      'Distributed append-only commit log & event streaming platform. Consumers independently pull and commit sequential partition offsets. Retains immutable events regardless of consumption. Engineered for extreme throughput (millions of msg/s via zero-copy sendfile and page cache), event replayability, and multi-consumer fanout.',
    attributes: [
      { k: 'Delivery Model', v: 'Pull-based (consumers poll batches at their own pace)', good: true },
      { k: 'Data Retention', v: 'Durable & persistent (time-based, size-based, or log compaction)', good: true },
      { k: 'Ordering Guarantees', v: 'Strict FIFO per partition (total ordering per partition key)', good: true },
      { k: 'Throughput', v: 'Extreme (1M+ msg/s per broker via sequential I/O & page cache)', good: true },
      { k: 'Message Replay', v: 'Native (consumers can rewind offset to any historical point)', good: true },
      { k: 'Retries & DLQ', v: 'Non-native (requires non-blocking retry topics to prevent HoL blocking)', good: false },
      { k: 'Consumer Scaling', v: 'Consumer groups (partitions mapped 1:1 to group consumer threads)', good: true },
      { k: 'Max Payload Limit', v: 'Default 1MB (anti-pattern for blobs; requires Claim Check pattern)', good: null },
      { k: 'Best System Design Fit', v: 'Real-time analytics, event sourcing, CDC, multi-consumer broadcast', good: true },
    ],
  },
  {
    id: 'sqs',
    label: 'AWS SQS (Standard / FIFO)',
    color: '#0369a1',
    badgeBg: '#e0f2fe',
    overview:
      'Fully managed cloud message queuing service. Workers poll messages; messages become invisible during processing (Visibility Timeout) and are deleted only upon explicit ACK. Highly suited for uncoordinated background jobs and decoupled workers with native per-message retries and Dead Letter Queues.',
    attributes: [
      { k: 'Delivery Model', v: 'Pull-based polling (short or long polling up to 20s)', good: true },
      { k: 'Data Retention', v: 'Transient (messages deleted on worker DeleteMessage ACK, max 14 days)', good: false },
      { k: 'Ordering Guarantees', v: 'Best-effort (Standard) or strict per MessageGroupId (FIFO SQS)', good: null },
      { k: 'Throughput', v: 'Nearly unlimited (Standard) or up to 3,000–30,000 msg/s (FIFO with batching)', good: true },
      { k: 'Message Replay', v: 'Unsupported (once deleted from queue, messages cannot be re-read)', good: false },
      { k: 'Retries & DLQ', v: 'Native out-of-the-box (Visibility Timeout + Redrive Policy to DLQ)', good: true },
      { k: 'Consumer Scaling', v: 'Competing consumers (workers scale independently without partition limits)', good: true },
      { k: 'Max Payload Limit', v: '256 KB (requires S3 Extended Client for larger payloads)', good: false },
      { k: 'Best System Design Fit', v: 'Web Crawler URL queues, asynchronous email/SMS dispatch, burst absorption', good: true },
    ],
  },
  {
    id: 'rabbitmq',
    label: 'RabbitMQ',
    color: '#c2410c',
    badgeBg: '#ffedd5',
    overview:
      'Traditional message broker implementing AMQP 0-9-1. Brokers push messages directly to connected worker threads and delete them immediately upon ACK. Excellent for complex multi-criteria routing (exchanges, topic wildcards), per-message TTL, and microservice RPC / task queues.',
    attributes: [
      { k: 'Delivery Model', v: 'Push-based (broker pushes directly to worker TCP channels)', good: false },
      { k: 'Data Retention', v: 'Transient (messages deleted immediately upon worker ACK; memory-centric)', good: false },
      { k: 'Ordering Guarantees', v: 'Strict per-queue (broken if competing consumers NACK/requeue)', good: false },
      { k: 'Throughput', v: 'Moderate (20,000–50,000 msg/s per queue; degrades under memory pressure)', good: false },
      { k: 'Message Replay', v: 'Unsupported (consumed = deleted permanently)', good: false },
      { k: 'Retries & DLQ', v: 'Native per-queue dead-letter exchanges (DLX) and per-message TTL', good: true },
      { k: 'Consumer Scaling', v: 'Competing consumers pool (round-robin push across connected workers)', good: null },
      { k: 'Routing Logic', v: 'Rich AMQP exchanges (Direct, Fanout, Topic wildcards, Headers)', good: true },
      { k: 'Best System Design Fit', v: 'Complex enterprise routing, transactional task queues, request-reply RPC', good: true },
    ],
  },
];

const INTERVIEW_USE_CASES = [
  {
    scenario: 'Web Crawler URL Queue',
    chosen: 'sqs' as TechId,
    reason:
      'Why HelloInterview chose SQS over Kafka: individual URLs fail intermittently (rate limits, DNS errors). SQS provides native Visibility Timeouts and per-message DLQ retries without Head-of-Line blocking. In Kafka, a failing URL blocks the entire partition unless a complex retry topic topology is engineered.',
  },
  {
    scenario: 'Ad Click Aggregator',
    chosen: 'kafka' as TechId,
    reason:
      'Requires ingestion of hundreds of thousands of click events per second with real-time sliding/tumbling window stream processing (e.g. Flink/Kafka Streams) and durable log replay for audit billing.',
  },
  {
    scenario: 'Ticketmaster Virtual Waiting Queue',
    chosen: 'kafka' as TechId,
    reason:
      'Requires strict, tamper-proof FIFO order of user arrivals to admit ticket buyers to checkout in the exact order they entered the queue. Kafka partition keys enforce total ordering.',
  },
  {
    scenario: 'YouTube Video Upload & Transcoding',
    chosen: 'kafka' as TechId,
    reason:
      'Asynchronous decoupling using the Claim Check pattern: raw video is stored in S3 blob storage; small S3 URI pointer is published to Kafka for worker pool transcoding orchestration.',
  },
  {
    scenario: 'Facebook Live Comments Feed',
    chosen: 'kafka' as TechId,
    reason:
      'Pub/sub broadcast: multiple independent consumer groups (live UI stream, automated toxicity moderation, ML sentiment analytics) independently tail the same comment stream without data duplication.',
  },
  {
    scenario: 'Enterprise Order Routing & RPC',
    chosen: 'rabbitmq' as TechId,
    reason:
      'Requires AMQP Topic Exchange wildcard routing (e.g., `orders.us.electronics.#`), per-message expiration TTL, and direct RPC correlation reply queues.',
  },
];

export default function KafkaVsRabbitmqDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TechId>('kafka');
  const tab = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .kafka-vs-tech-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Header bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          System Design Comparison: Kafka vs AWS SQS vs RabbitMQ
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Tab buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          {TABS.map((t) => {
            const isSelected = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: isSelected ? `2px solid ${t.color}` : '1px solid #D9D9D9',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '13px',
                  background: isSelected ? t.badgeBg : '#F2F2F2',
                  color: isSelected ? t.color : '#334155',
                  boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Overview banner */}
        <div style={{ background: '#F7FDF9', border: '1px solid #98A2B3', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: tab.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
            Architectural Synopsis
          </div>
          <p style={{ fontSize: '12.5px', color: '#1e293b', margin: 0, lineHeight: 1.55 }}>
            {tab.overview}
          </p>
        </div>

        {/* 2-Column Split: Characteristics vs Interview Scenarios */}
        <div className="kafka-vs-tech-grid" style={{ display: 'grid', gridTemplateColumns: '52% 48%', gap: '14px', alignItems: 'start' }}>
          {/* Column 1: Characteristics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
              Core Characteristics
            </div>
            {tab.attributes.map((a, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  background: '#ffffff',
                  border: '1px solid #D9D9D9',
                  borderRadius: '6px',
                  padding: '7px 10px',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    flexShrink: 0,
                    marginTop: '1px',
                    color: a.good === true ? '#15803d' : a.good === false ? '#b91c1c' : '#b45309',
                  }}
                >
                  {a.good === true ? '✓' : a.good === false ? '✗' : '•'}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', minWidth: '125px', flexShrink: 0 }}>
                  {a.k}:
                </span>
                <span style={{ fontSize: '11px', color: '#334155', lineHeight: 1.4 }}>
                  {a.v}
                </span>
              </div>
            ))}
          </div>

          {/* Column 2: System Design Scenarios */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              System Design Interview Decision Matrix
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {INTERVIEW_USE_CASES.map((uc, i) => {
                const isSelectedWinner = uc.chosen === activeTab;
                const winnerTab = TABS.find((t) => t.id === uc.chosen)!;
                return (
                  <div
                    key={i}
                    style={{
                      background: isSelectedWinner ? winnerTab.badgeBg : '#ffffff',
                      border: isSelectedWinner ? `1.5px solid ${winnerTab.color}` : '1px solid #D9D9D9',
                      borderRadius: '8px',
                      padding: '9px 12px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                        {uc.scenario}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: winnerTab.color,
                          background: isSelectedWinner ? '#ffffff' : winnerTab.badgeBg,
                          padding: '1px 7px',
                          borderRadius: '10px',
                          border: `1px solid ${winnerTab.color}40`,
                        }}
                      >
                        Winner: {winnerTab.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#334155', lineHeight: 1.45 }}>
                      {uc.reason}
                    </div>
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