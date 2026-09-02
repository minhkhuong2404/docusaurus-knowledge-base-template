import React, { useState } from 'react';

type ScenarioTab = 'checkout_flow' | 'key_hash' | 'broker_failover' | 'eos_truth';

export default function KafkaInterviewScenarioDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<ScenarioTab>('checkout_flow');
  const [customerKey, setCustomerKey] = useState<string>('cust_8821');
  const [brokerFailed, setBrokerFailed] = useState<boolean>(false);

  // Simple string hash simulation for Murmur2 demonstration
  const calculatePartition = (key: string, numPartitions: number = 3): number => {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash << 5) - hash + key.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % numPartitions;
  };

  const targetPartition = calculatePartition(customerKey, 3);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Apache Kafka Interview Scenarios & Mechanics Visualizer
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'checkout_flow', label: '🛒 Real-World Event Flow', color: '#38bdf8' },
            { id: 'key_hash', label: '🔑 Key Partitioning Math', color: '#34d399' },
            { id: 'broker_failover', label: '🛡️ Broker Failover & ISR', color: '#fbbf24' },
            { id: 'eos_truth', label: '🎯 Exactly-Once Myth vs Reality', color: '#f472b6' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as ScenarioTab)}
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
        {/* TAB 1: END-TO-END CHECKOUT FLOW */}
        {activeTab === 'checkout_flow' && (
          <div>
            <div style={{
              padding: '12px 16px',
              background: 'rgba(56, 189, 248, 0.06)',
              borderLeft: '4px solid #38bdf8',
              borderRadius: '0 8px 8px 0',
              marginBottom: '14px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
                End-to-End E-Commerce Order Flow: What Problem Does Kafka Solve?
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                Instead of Checkout Service executing 4 slow, synchronous HTTP calls (Payment, Inventory, Email, Fraud Detection), it appends an immutable <code>OrderPlaced</code> event to Kafka in <strong>&lt;5ms</strong>. Independent consumer groups read at their own speed.
              </div>
            </div>

            {/* Flow SVG */}
            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
              <svg viewBox="0 0 820 180" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="k-arrow-blue" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#38bdf8" />
                  </marker>
                  <marker id="k-arrow-green" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#34d399" />
                  </marker>
                </defs>

                {/* 1. Checkout Producer */}
                <g transform="translate(15, 25)">
                  <rect x="0" y="20" width="150" height="85" rx="6" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="12" y="45" fill="#38bdf8" fontSize="11" fontWeight="700">1. Checkout Service</text>
                  <text x="12" y="65" fill="#e2e8f0" fontSize="9">Key: "cust_8821"</text>
                  <text x="12" y="82" fill="#86efac" fontSize="9">Event: OrderPlaced</text>
                  <text x="12" y="96" fill="#94a3b8" fontSize="8">Returns 200 in 3ms</text>
                </g>

                <path d="M 170 65 L 235 65" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#k-arrow-blue)" className="interactive-diagram-flowing-path" />

                {/* 2. Kafka Topic Partition Log */}
                <g transform="translate(240, 15)">
                  <rect x="0" y="0" width="280" height="125" rx="8" fill="rgba(15, 23, 42, 0.85)" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="15" y="25" fill="#38bdf8" fontSize="11" fontWeight="700">📜 Topic: `orders.placed`</text>
                  <text x="15" y="42" fill="#94a3b8" fontSize="9">Append-only sequential log (Zero-copy DMA)</text>

                  {/* Partition slots */}
                  <g transform="translate(15, 55)">
                    {[0, 1, 2, 3, 4].map(offset => (
                      <g key={offset} transform={`translate(${offset * 48}, 0)`}>
                        <rect x="0" y="0" width="42" height="30" rx="4" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" />
                        <text x="10" y="19" fill="#ffffff" fontSize="10" fontWeight="700">#{offset}</text>
                      </g>
                    ))}
                  </g>
                  <text x="15" y="112" fill="#34d399" fontSize="8" fontWeight="700">▲ High Watermark: Offset #4 (Committed to all ISRs)</text>
                </g>

                <path d="M 525 65 L 585 65" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#k-arrow-green)" className="interactive-diagram-flowing-path" />

                {/* 3. Fan-out Consumer Groups */}
                <g transform="translate(590, 15)">
                  <rect x="0" y="0" width="190" height="35" rx="4" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" />
                  <text x="10" y="22" fill="#34d399" fontSize="9" fontWeight="700">💳 Payment Group (Offset 4)</text>

                  <rect x="0" y="45" width="190" height="35" rx="4" fill="rgba(251, 191, 36, 0.15)" stroke="#fbbf24" />
                  <text x="10" y="67" fill="#fbbf24" fontSize="9" fontWeight="700">🏭 Inventory Group (Offset 4)</text>

                  <rect x="0" y="90" width="190" height="35" rx="4" fill="rgba(167, 139, 250, 0.15)" stroke="#a78bfa" />
                  <text x="10" y="112" fill="#a78bfa" fontSize="9" fontWeight="700">🤖 AI Fraud Group (Offset 2 - Replay)</text>
                </g>
              </svg>
            </div>
          </div>
        )}

        {/* TAB 2: KEY PARTITIONING MATH */}
        {activeTab === 'key_hash' && (
          <div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '13px', color: 'var(--ifm-color-content)' }}>
                Test Partition Routing Key:
              </div>
              <input
                type="text"
                value={customerKey}
                onChange={e => setCustomerKey(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}
              />
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Formula: <code>Math.abs(murmur2(key)) % 3 Partitions</code>
              </div>
            </div>

            {/* 3 Partitions Visualizer */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '14px' }}>
              {[0, 1, 2].map(p => {
                const isTarget = targetPartition === p;
                return (
                  <div
                    key={p}
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      background: isTarget ? 'rgba(52, 211, 153, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      border: `2px solid ${isTarget ? '#34d399' : 'rgba(255, 255, 255, 0.08)'}`,
                      textAlign: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 700, color: isTarget ? '#34d399' : '#94a3b8' }}>
                      Partition {p} {isTarget ? '🎯 (Target)' : ''}
                    </div>
                    <div style={{ fontSize: '11px', color: isTarget ? '#ffffff' : 'var(--ifm-color-content-secondary)', marginTop: '6px' }}>
                      {isTarget
                        ? `All events with key "${customerKey}" will ALWAYS route here in strict sequential order.`
                        : 'Different customer keys land here for parallel throughput.'}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: '12px', background: 'rgba(52, 211, 153, 0.06)', borderLeft: '4px solid #34d399', borderRadius: '0 6px 6px 0', fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              <strong>Senior Interview Takeaway:</strong> Kafka guarantees ordering <em>only within a partition</em>. By setting a message key (e.g., `customerId` or `orderId`), all state updates for that aggregate land on the exact same partition, ensuring consumers process them in strict chronological sequence with zero race conditions.
            </div>
          </div>
        )}

        {/* TAB 3: BROKER FAILOVER & ISR */}
        {activeTab === 'broker_failover' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '13px', color: 'var(--ifm-color-content)' }}>
                Simulate Broker Outage & KRaft Leader Election:
              </div>
              <button
                onClick={() => setBrokerFailed(!brokerFailed)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: `1px solid ${brokerFailed ? '#f87171' : '#34d399'}`,
                  background: brokerFailed ? '#f8717120' : '#34d39920',
                  color: brokerFailed ? '#f87171' : '#34d399',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {brokerFailed ? '💥 Broker 1 is CRASHED (Recover?)' : '🟢 Crash Broker 1 (Leader)'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '14px' }}>
              {/* Broker 1 */}
              <div style={{
                padding: '14px',
                borderRadius: '8px',
                background: brokerFailed ? 'rgba(248, 113, 113, 0.1)' : 'rgba(56, 189, 248, 0.1)',
                border: `1px solid ${brokerFailed ? '#f87171' : '#38bdf8'}`
              }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: brokerFailed ? '#f87171' : '#38bdf8', marginBottom: '4px' }}>
                  Broker 1 {brokerFailed ? '(CRASHED 💥)' : '(LEADER ⭐)'}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
                  {brokerFailed ? 'Heartbeat timed out. Controller removes Broker 1 from In-Sync Replicas (ISR).' : 'Serving all read & write traffic for Partition 0.'}
                </div>
              </div>

              {/* Broker 2 */}
              <div style={{
                padding: '14px',
                borderRadius: '8px',
                background: brokerFailed ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${brokerFailed ? '#34d399' : 'rgba(255, 255, 255, 0.08)'}`
              }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: brokerFailed ? '#34d399' : '#fbbf24', marginBottom: '4px' }}>
                  Broker 2 {brokerFailed ? '(PROMOTED TO LEADER 👑)' : '(FOLLOWER 🛡️)'}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
                  {brokerFailed
                    ? 'Elected new Leader in <10ms because it was in the ISR. 0% Data Loss with acks=all.'
                    : 'Replicating Leader log in real-time. In-Sync Replica (ISR).'}
                </div>
              </div>

              {/* Broker 3 */}
              <div style={{
                padding: '14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fbbf24', marginBottom: '4px' }}>
                  Broker 3 (FOLLOWER 🛡️)
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
                  Replicating Leader log. High Watermark advances when both followers acknowledge fetch.
                </div>
              </div>
            </div>

            <div style={{ padding: '12px', background: 'rgba(251, 191, 36, 0.06)', borderLeft: '4px solid #fbbf24', borderRadius: '0 6px 6px 0', fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              <strong>Zero Data Loss Formula:</strong> Producer <code>acks=all</code> (or <code>acks=-1</code>) combined with topic configuration <code>min.insync.replicas=2</code> ensures that a write is only acknowledged once at least 2 in-sync brokers have committed the record to disk.
            </div>
          </div>
        )}

        {/* TAB 4: EXACTLY-ONCE TRUTH */}
        {activeTab === 'eos_truth' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
            <div style={{ padding: '16px', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                ✅ Inside Kafka Ecosystem: TRUE Exactly-Once (EOS)
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5, marginBottom: '8px' }}>
                When consuming from Topic A and producing to Topic B (e.g. Kafka Streams / Flink):
              </div>
              <ul style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, paddingLeft: '18px', lineHeight: 1.6 }}>
                <li><code>enable.idempotence=true</code>: Producer IDs (PID) + sequence numbers prevent network duplicate writes.</li>
                <li>Transactional Coordinator: Commits input offsets and output records in a single 2-Phase atomic commit marker.</li>
              </ul>
            </div>

            <div style={{ padding: '16px', background: 'rgba(248, 113, 113, 0.05)', border: '1px solid rgba(248, 113, 113, 0.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#f87171', marginBottom: '8px' }}>
                ❌ Outside Kafka Ecosystem: IMPOSSIBLE without App Dedup
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5, marginBottom: '8px' }}>
                The moment a consumer writes to an external database, Stripe API, or email gateway:
              </div>
              <ul style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, paddingLeft: '18px', lineHeight: 1.6 }}>
                <li>External systems cannot join the Kafka 2PC transaction.</li>
                <li>If the consumer updates PostgreSQL but crashes before committing offset to Kafka, the redelivered message will duplicate the write!</li>
                <li><strong>Fix:</strong> Application-level idempotency keys + DB Unique constraints.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
