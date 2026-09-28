import React, { useState } from 'react';

type TechOption = 'kafka' | 'rabbitmq' | 'sqs';
type ScenarioOption = 'streaming' | 'task_queue' | 'serverless' | 'replay';

export default function KafkaVsRabbitMqVsSqsDiagram(): React.JSX.Element {
  const [selectedTech, setSelectedTech] = useState<TechOption>('kafka');
  const [selectedScenario, setSelectedScenario] = useState<ScenarioOption>('streaming');

  const scenarioRecommendations: Record<ScenarioOption, {
    title: string;
    winner: 'Apache Kafka' | 'RabbitMQ' | 'AWS SQS';
    color: string;
    rationale: string;
    tech: TechOption;
  }> = {
    streaming: {
      title: 'High-Throughput Event Streaming & Real-Time Analytics',
      winner: 'Apache Kafka',
      color: '#38bdf8',
      rationale: 'Millions of events/sec, append-only sequential log, zero-copy DMA, persistent offsets, and multi-consumer replayability make Kafka the gold standard.',
      tech: 'kafka'
    },
    task_queue: {
      title: 'Complex Routing, Task Queues & Per-Message Retries',
      winner: 'RabbitMQ',
      color: '#fbbf24',
      rationale: 'Exchange bindings (Direct, Topic, Fanout, Headers), per-message TTL, priority queues, and dead-letter exchanges (DLX) provide unmatched routing flexibility.',
      tech: 'rabbitmq'
    },
    serverless: {
      title: 'Zero-Maintenance Cloud Decoupling & Serverless Workers',
      winner: 'AWS SQS',
      color: '#f97316',
      rationale: 'Fully managed, zero server patching, automated elastic scaling, native AWS IAM security, and direct AWS Lambda event-source triggers.',
      tech: 'sqs'
    },
    replay: {
      title: 'Event Sourcing, Rewind & Historical Data Reprocessing',
      winner: 'Apache Kafka',
      color: '#38bdf8',
      rationale: 'RabbitMQ and SQS delete messages upon acknowledgement. Kafka retains immutable commit logs for days or years, allowing consumers to rewind offsets to epoch 0.',
      tech: 'kafka'
    }
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Kafka vs RabbitMQ vs AWS SQS Architectural Visualizer
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          {[
            { id: 'kafka', label: 'Kafka (Append Log)', color: '#38bdf8' },
            { id: 'rabbitmq', label: 'RabbitMQ (Smart Broker)', color: '#fbbf24' },
            { id: 'sqs', label: 'AWS SQS (Managed Queue)', color: '#f97316' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTech(t.id as TechOption)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: `1px solid ${selectedTech === t.id ? t.color : 'rgba(255,255,255,0.1)'}`,
                background: selectedTech === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)',
                color: selectedTech === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                fontWeight: selectedTech === t.id ? 700 : 500,
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
        {/* SVG Flow Canvas */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
          <svg viewBox="0 0 820 220" style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              <marker id="arrow-k-blue" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M 0 0 L 8 4 L 0 8 Z" fill="#38bdf8" />
              </marker>
              <marker id="arrow-k-amber" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M 0 0 L 8 4 L 0 8 Z" fill="#fbbf24" />
              </marker>
              <marker id="arrow-k-orange" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M 0 0 L 8 4 L 0 8 Z" fill="#f97316" />
              </marker>
            </defs>

            {selectedTech === 'kafka' && (
              <g transform="translate(15, 20)">
                {/* Producers */}
                <rect x="0" y="30" width="100" height="70" rx="6" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" />
                <text x="12" y="60" fill="#38bdf8" fontSize="11" fontWeight="700">Producers</text>
                <text x="12" y="80" fill="#e0f2fe" fontSize="9">Writes by Key</text>

                <path d="M 105 65 L 155 65" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow-k-blue)" className="interactive-diagram-flowing-path" />

                {/* Kafka Broker: Append-Only Partition Log */}
                <rect x="160" y="0" width="370" height="150" rx="8" fill="rgba(15, 23, 42, 0.85)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="175" y="24" fill="#38bdf8" fontSize="12" fontWeight="700">📜 Apache Kafka: Partitioned Append-Only Log</text>

                {/* Partition 0 Log Slots */}
                <g transform="translate(175, 40)">
                  <text x="0" y="15" fill="#94a3b8" fontSize="10">Partition 0:</text>
                  {[0, 1, 2, 3, 4, 5].map(offset => (
                    <g key={offset} transform={`translate(${70 + offset * 45}, 0)`}>
                      <rect x="0" y="0" width="40" height="30" rx="4" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" />
                      <text x="10" y="19" fill="#ffffff" fontSize="10" fontWeight="700">#{offset}</text>
                    </g>
                  ))}
                  {/* Offset pointer */}
                  <path d="M 175 40 L 175 32" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#arrow-k-blue)" />
                  <text x="125" y="55" fill="#34d399" fontSize="9" fontWeight="700">▲ Consumer Group A (Offset 2)</text>
                  <text x="260" y="55" fill="#fbbf24" fontSize="9" fontWeight="700">▲ Analytics Group B (Offset 5)</text>
                </g>

                {/* Partition 1 Log Slots */}
                <g transform="translate(175, 100)">
                  <text x="0" y="15" fill="#94a3b8" fontSize="10">Partition 1:</text>
                  {[0, 1, 2, 3, 4, 5].map(offset => (
                    <g key={offset} transform={`translate(${70 + offset * 45}, 0)`}>
                      <rect x="0" y="0" width="40" height="30" rx="4" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" />
                      <text x="10" y="19" fill="#ffffff" fontSize="10" fontWeight="700">#{offset}</text>
                    </g>
                  ))}
                </g>

                <path d="M 535 65 L 585 65" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow-k-blue)" className="interactive-diagram-flowing-path" />

                {/* Consumer Groups */}
                <g transform="translate(590, 15)">
                  <rect x="0" y="0" width="180" height="60" rx="6" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" />
                  <text x="10" y="24" fill="#34d399" fontSize="10" fontWeight="700">Consumer Group 1 (Orders)</text>
                  <text x="10" y="45" fill="#e2e8f0" fontSize="9">Pull loop, commits offset</text>

                  <rect x="0" y="70" width="180" height="60" rx="6" fill="rgba(251, 191, 36, 0.15)" stroke="#fbbf24" />
                  <text x="10" y="94" fill="#fbbf24" fontSize="10" fontWeight="700">Consumer Group 2 (Fraud AI)</text>
                  <text x="10" y="115" fill="#e2e8f0" fontSize="9">Replays stream at own pace</text>
                </g>
              </g>
            )}

            {selectedTech === 'rabbitmq' && (
              <g transform="translate(15, 20)">
                {/* Producer */}
                <rect x="0" y="40" width="100" height="60" rx="6" fill="rgba(251, 191, 36, 0.15)" stroke="#fbbf24" />
                <text x="15" y="65" fill="#fbbf24" fontSize="11" fontWeight="700">Publisher</text>
                <text x="15" y="82" fill="#e2e8f0" fontSize="9">Routing Key</text>

                <path d="M 105 70 L 155 70" fill="none" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#arrow-k-amber)" className="interactive-diagram-flowing-path" />

                {/* Exchange */}
                <rect x="160" y="20" width="120" height="100" rx="8" fill="rgba(251, 191, 36, 0.2)" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="175" y="45" fill="#fbbf24" fontSize="11" fontWeight="700">Smart Exchange</text>
                <text x="175" y="65" fill="#ffffff" fontSize="9">Direct / Topic</text>
                <text x="175" y="85" fill="#ffffff" fontSize="9">Fanout / Headers</text>
                <text x="175" y="105" fill="#fef08a" fontSize="8">Binding Rules</text>

                {/* Flow to Queues */}
                <path d="M 285 50 L 335 30" fill="none" stroke="#fbbf24" strokeWidth="1.5" markerEnd="url(#arrow-k-amber)" className="interactive-diagram-flowing-path" />
                <path d="M 285 90 L 335 110" fill="none" stroke="#fbbf24" strokeWidth="1.5" markerEnd="url(#arrow-k-amber)" className="interactive-diagram-flowing-path" />

                {/* Queues */}
                <rect x="340" y="10" width="180" height="50" rx="6" fill="rgba(15, 23, 42, 0.85)" stroke="#38bdf8" />
                <text x="350" y="30" fill="#38bdf8" fontSize="10" fontWeight="700">Queue: emails.*</text>
                <text x="350" y="48" fill="#e2e8f0" fontSize="8">Transient: Deleted on ACK</text>

                <rect x="340" y="80" width="180" height="50" rx="6" fill="rgba(15, 23, 42, 0.85)" stroke="#f472b6" />
                <text x="350" y="100" fill="#f472b6" fontSize="10" fontWeight="700">Queue: audit.critical</text>
                <text x="350" y="118" fill="#e2e8f0" fontSize="8">DLX on reject (Dead Letter)</text>

                {/* Push to Workers */}
                <path d="M 525 35 L 575 35" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#arrow-k-amber)" />
                <path d="M 525 105 L 575 105" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#arrow-k-amber)" />

                {/* Workers */}
                <rect x="580" y="10" width="170" height="50" rx="6" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" />
                <text x="590" y="30" fill="#34d399" fontSize="10" fontWeight="700">Worker A (Push)</text>
                <text x="590" y="48" fill="#e2e8f0" fontSize="9">Sends ack / nack</text>

                <rect x="580" y="80" width="170" height="50" rx="6" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" />
                <text x="590" y="100" fill="#34d399" fontSize="10" fontWeight="700">Worker B (Push)</text>
                <text x="590" y="118" fill="#e2e8f0" fontSize="9">Prefetch limit = 50</text>
              </g>
            )}

            {selectedTech === 'sqs' && (
              <g transform="translate(15, 20)">
                {/* AWS S3 / App Producer */}
                <rect x="0" y="40" width="110" height="60" rx="6" fill="rgba(249, 115, 22, 0.15)" stroke="#f97316" />
                <text x="10" y="65" fill="#f97316" fontSize="11" fontWeight="700">AWS Services / App</text>
                <text x="10" y="82" fill="#e2e8f0" fontSize="9">SendMessage API</text>

                <path d="M 115 70 L 165 70" fill="none" stroke="#f97316" strokeWidth="2" markerEnd="url(#arrow-k-orange)" className="interactive-diagram-flowing-path" />

                {/* AWS SQS Queue */}
                <rect x="170" y="15" width="340" height="120" rx="8" fill="rgba(15, 23, 42, 0.85)" stroke="#f97316" strokeWidth="1.5" />
                <text x="185" y="40" fill="#f97316" fontSize="12" fontWeight="700">☁️ AWS SQS (Managed Serverless Queue)</text>
                <text x="185" y="62" fill="#fdba74" fontSize="10">Standard (Unlimited TPS) or FIFO (Ordered)</text>

                {/* Visibility Timeout Box */}
                <rect x="185" y="75" width="310" height="45" rx="4" fill="rgba(249, 115, 22, 0.2)" stroke="#f97316" />
                <text x="195" y="94" fill="#ffffff" fontSize="10" fontWeight="700">⏱️ Visibility Timeout (e.g. 30s)</text>
                <text x="195" y="110" fill="#fed7aa" fontSize="9">Hides message while worker processes. Auto-reappears on crash.</text>

                <path d="M 515 70 L 565 70" fill="none" stroke="#f97316" strokeWidth="2" markerEnd="url(#arrow-k-orange)" className="interactive-diagram-flowing-path" />

                {/* Lambda / EC2 Workers */}
                <g transform="translate(570, 20)">
                  <rect x="0" y="0" width="190" height="50" rx="6" fill="rgba(249, 115, 22, 0.15)" stroke="#f97316" />
                  <text x="10" y="24" fill="#f97316" fontSize="10" fontWeight="700">AWS Lambda Function</text>
                  <text x="10" y="42" fill="#e2e8f0" fontSize="9">Event source trigger (auto scale)</text>

                  <rect x="0" y="60" width="190" height="50" rx="6" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" />
                  <text x="10" y="84" fill="#34d399" fontSize="10" fontWeight="700">EC2 Worker Pull Loop</text>
                  <text x="10" y="102" fill="#e2e8f0" fontSize="9">DeleteMessage on success</text>
                </g>
              </g>
            )}
          </svg>
        </div>

        {/* Architecture Comparison Table */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: '16px'
        }}>
          <table style={{ width: '100%', margin: 0, borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#94a3b8' }}>Dimension</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#38bdf8' }}>Apache Kafka</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#fbbf24' }}>RabbitMQ</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#f97316' }}>AWS SQS</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--ifm-color-content)' }}>Mental Model</td>
                <td style={{ padding: '8px 12px', color: '#e2e8f0' }}>Append-Only Partitioned Log</td>
                <td style={{ padding: '8px 12px', color: '#e2e8f0' }}>Smart Broker (Exchanges & Queues)</td>
                <td style={{ padding: '8px 12px', color: '#e2e8f0' }}>Serverless Managed Cloud Queue</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--ifm-color-content)' }}>Broker vs Consumer</td>
                <td style={{ padding: '8px 12px', color: '#e2e8f0' }}>Dumb Broker / Smart Consumer</td>
                <td style={{ padding: '8px 12px', color: '#e2e8f0' }}>Smart Broker / Dumb Consumer</td>
                <td style={{ padding: '8px 12px', color: '#e2e8f0' }}>Cloud Managed / Poll Loop</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--ifm-color-content)' }}>Message Retention</td>
                <td style={{ padding: '8px 12px', color: '#34d399' }}>Persistent (Replayable forever)</td>
                <td style={{ padding: '8px 12px', color: '#f87171' }}>Transient (Deleted on ACK)</td>
                <td style={{ padding: '8px 12px', color: '#fbbf24' }}>Buffered (Up to 14 days)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--ifm-color-content)' }}>Delivery Paradigm</td>
                <td style={{ padding: '8px 12px', color: '#e2e8f0' }}>Pull (Batch `poll()`)</td>
                <td style={{ padding: '8px 12px', color: '#e2e8f0' }}>Push (`basic.deliver`) + Pull</td>
                <td style={{ padding: '8px 12px', color: '#e2e8f0' }}>Pull (`ReceiveMessage`)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--ifm-color-content)' }}>Throughput</td>
                <td style={{ padding: '8px 12px', color: '#38bdf8', fontWeight: 700 }}>1,000,000+ msgs/sec</td>
                <td style={{ padding: '8px 12px', color: '#e2e8f0' }}>20,000–50,000 msgs/sec</td>
                <td style={{ padding: '8px 12px', color: '#e2e8f0' }}>Unlimited (Std) / 3K (FIFO)</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--ifm-color-content)' }}>Ops Overhead</td>
                <td style={{ padding: '8px 12px', color: '#f87171' }}>High (Cluster, Storage, Partitions)</td>
                <td style={{ padding: '8px 12px', color: '#fbbf24' }}>Medium (Erlang nodes, Cluster)</td>
                <td style={{ padding: '8px 12px', color: '#34d399', fontWeight: 700 }}>Zero (100% Serverless)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Scenario Recommendation Engine */}
        <div style={{
          padding: '14px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)', marginBottom: '8px' }}>
            🎯 Decision Guide: Which Messaging Engine Should You Choose?
          </div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {[
              { id: 'streaming', label: '📊 Real-Time Analytics & Streaming' },
              { id: 'task_queue', label: '🛠️ Complex Task Routing & Retries' },
              { id: 'serverless', label: '⚡ Serverless AWS Lambda Apps' },
              { id: 'replay', label: '⏪ Event Sourcing & Rewind History' }
            ].map(s => (
              <button
                key={s.id}
                onClick={() => {
                  setSelectedScenario(s.id as ScenarioOption);
                  setSelectedTech(scenarioRecommendations[s.id as ScenarioOption].tech);
                }}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: `1px solid ${selectedScenario === s.id ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                  background: selectedScenario === s.id ? '#38bdf820' : 'transparent',
                  color: selectedScenario === s.id ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
                  fontSize: '11.5px',
                  fontWeight: selectedScenario === s.id ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div style={{
            padding: '12px',
            background: `${scenarioRecommendations[selectedScenario].color}0a`,
            borderLeft: `4px solid ${scenarioRecommendations[selectedScenario].color}`,
            borderRadius: '0 6px 6px 0'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: scenarioRecommendations[selectedScenario].color, marginBottom: '4px' }}>
              Recommended: {scenarioRecommendations[selectedScenario].winner}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              {scenarioRecommendations[selectedScenario].rationale}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
