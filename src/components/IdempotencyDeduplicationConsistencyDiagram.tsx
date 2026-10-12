import React, { useState } from 'react';

type MainTab = 'architecture' | 'idempotency-dedup' | 'consistency-matrix' | 'failure-scenarios';

interface FlowStep {
  step: number;
  title: string;
  sender: string;
  receiver: string;
  action: string;
  detail: string;
  status: 'initial' | 'processing' | 'committed' | 'cached' | 'rejected';
}

export default function IdempotencyConsistencyInteractiveDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<MainTab>('architecture');
  const [selectedScenario, setSelectedScenario] = useState<'happy_first_write' | 'concurrent_retry' | 'stale_read_eventual' | 'linearizable_quorum'>('happy_first_write');
  const [stepIndex, setStepIndex] = useState<number>(0);

  const scenarioFlows: Record<string, { title: string; subtitle: string; consistencyType: string; steps: FlowStep[] }> = {
    happy_first_write: {
      title: '1. First-Time Request + Strong Consistency Commit',
      subtitle: 'Complete idempotency key reservation, unique constraint commit, and read-your-writes guarantee.',
      consistencyType: 'Strong Consistency (Linearizability / Read-Your-Writes)',
      steps: [
        {
          step: 1,
          title: 'Client Dispatches Mutating Request',
          sender: 'Client Device',
          receiver: 'API Gateway',
          action: 'POST /v1/orders with Idempotency-Key: "idemp-uuid-9981"',
          detail: 'Client calculates SHA-256 payload digest. Passes standard RFC header Idempotency-Key to prevent duplicate execution across network retries.',
          status: 'initial'
        },
        {
          step: 2,
          title: 'Distributed In-Flight Lock Acquisition',
          sender: 'API Gateway',
          receiver: 'Redis Cluster',
          action: 'SET lock:idemp-uuid-9981 "PROCESSING" NX EX 120',
          detail: 'Atomic SETNX claims processing right. If key already exists in PROCESSING state, concurrent requests are immediately rejected or held.',
          status: 'processing'
        },
        {
          step: 3,
          title: 'ACID Transaction & DB Unique Constraint',
          sender: 'Order Domain Service',
          receiver: 'Primary DB (Postgres / Raft Quorum)',
          action: 'BEGIN; INSERT INTO idempotency_records ...; UPDATE inventory ...; COMMIT;',
          detail: 'Database enforces UNIQUE (idempotency_key). Updates master ledger and writes cached HTTP response body inside the same atomic commit boundary.',
          status: 'committed'
        },
        {
          step: 4,
          title: 'Result Stored & Response Returned',
          sender: 'Primary DB',
          receiver: 'Client Device',
          action: 'HTTP 201 Created with X-Cache-Lookup: MISS-STORED',
          detail: 'Idempotency record state updated from PROCESSING to COMPLETED with 7-day TTL. Response returned to client with strict monotonic guarantee.',
          status: 'cached'
        }
      ]
    },
    concurrent_retry: {
      title: '2. Concurrent Retry Race (In-Flight Deduplication)',
      subtitle: 'Network timeout triggers instant client retry while request #1 is still committing.',
      consistencyType: 'Deduplication Guard & Mutual Exclusion',
      steps: [
        {
          step: 1,
          title: 'Client Socket Times Out & Immediately Retries',
          sender: 'Client Device',
          receiver: 'API Gateway',
          action: 'POST /v1/orders with IDENTICAL Idempotency-Key: "idemp-uuid-9981"',
          detail: 'Request #1 is delayed by 180ms due to database disk flush. Client-side HTTP timeout fires at 150ms and triggers automatic retry policy.',
          status: 'initial'
        },
        {
          step: 2,
          title: 'Gateway Probes Deduplication Layer',
          sender: 'API Gateway',
          receiver: 'Redis Cluster',
          action: 'SETNX lock:idemp-uuid-9981 returns 0 (Key Already Exists)',
          detail: 'Deduplication filter evaluates stored state: state == "PROCESSING". Lock cannot be re-acquired by worker #2.',
          status: 'processing'
        },
        {
          step: 3,
          title: 'Downstream Core Engine Protected',
          sender: 'API Gateway',
          receiver: 'Order Domain Service',
          action: 'EXECUTION SHIELDED (0 calls dispatched to database)',
          detail: 'Core database is completely isolated from duplicate mutation load, preventing double debit, inventory oversell, and lock thrashing.',
          status: 'rejected'
        },
        {
          step: 4,
          title: 'Transient Conflict Response Returned',
          sender: 'API Gateway',
          receiver: 'Client Device',
          action: 'HTTP 409 Conflict / 425 Too Early (Retry-After: 2s)',
          detail: 'Gateway informs client that operation is already in progress. Client halts aggressive bursting and polls status cleanly.',
          status: 'rejected'
        }
      ]
    },
    stale_read_eventual: {
      title: '3. Asynchronous Replication Lag (Eventual Consistency Anomaly)',
      subtitle: 'Write succeeds on Primary, but Client reads immediately from an asynchronous replica.',
      consistencyType: 'Eventual Consistency (Stale Read Anomaly / Time Travel)',
      steps: [
        {
          step: 1,
          title: 'Write Committed on Primary Node',
          sender: 'Order Domain Service',
          receiver: 'Primary Leader Node',
          action: 'UPDATE user_account SET status = "VERIFIED" (Committed at t0)',
          detail: 'Primary Leader acknowledges commit to client. Asynchronous replication stream (WAL / binlog) queued for background replica propagation.',
          status: 'committed'
        },
        {
          step: 2,
          title: 'Asynchronous Replication Delay',
          sender: 'Primary Leader Node',
          receiver: 'Follower Read Replica 2',
          action: 'Replication Stream delayed by 250ms (Network jitter / disk contention)',
          detail: 'Follower node has not yet applied WAL record. Follower node still holds stale record: status == "UNVERIFIED".',
          status: 'processing'
        },
        {
          step: 3,
          title: 'User Refreshes UI (Read Dispatched to Replica)',
          sender: 'Client Device',
          receiver: 'Follower Read Replica 2',
          action: 'GET /v1/user/status via Round-Robin Load Balancer',
          detail: 'Load balancer routes read request to Follower 2. Follower returns status: "UNVERIFIED"!',
          status: 'rejected'
        },
        {
          step: 4,
          title: 'The Time-Travel User Experience Bug',
          sender: 'Follower Read Replica 2',
          receiver: 'Client Device',
          action: 'UI renders "Account Unverified" immediately after confirmation dialog',
          detail: 'Classic violation of Read-Your-Writes consistency. Customer panicked, clicks "Verify" again, generating duplicate support tickets.',
          status: 'rejected'
        }
      ]
    },
    linearizable_quorum: {
      title: '4. Quorum Read / Lease Read (Strong Consistency)',
      subtitle: 'Strict linearizable read prevents stale state across distributed nodes.',
      consistencyType: 'Strong Consistency (R + W > N Quorum / Raft Leader Lease)',
      steps: [
        {
          step: 1,
          title: 'Quorum Write Committed Across Majority',
          sender: 'Order Service',
          receiver: 'Raft Cluster (Node 1, Node 2, Node 3)',
          action: 'Write appended to Node 1 (Leader) and Node 2 (Follower)',
          detail: 'Quorum formula satisfied: W = 2 out of N = 3 nodes acked. Commit index advanced permanently.',
          status: 'committed'
        },
        {
          step: 2,
          title: 'Client Issues Read Request',
          sender: 'Client Device',
          receiver: 'Distributed Key-Value Cluster',
          action: 'GET /v1/account/balance with ReadConsistency = LINEARIZABLE',
          detail: 'Read must guarantee observing the latest committed state in real time without stale window.',
          status: 'processing'
        },
        {
          step: 3,
          title: 'Leader Heartbeat Verification / Quorum Read',
          sender: 'Raft Leader',
          receiver: 'Follower Majority',
          action: 'Leader verifies active leadership lease via heartbeat round',
          detail: 'Leader confirms it was not partitioned or superseded by another leader (fencing against split-brain zombie leader).',
          status: 'committed'
        },
        {
          step: 4,
          title: 'Guaranteed Fresh State Returned',
          sender: 'Raft Leader',
          receiver: 'Client Device',
          action: 'HTTP 200 OK with guaranteed up-to-date balance',
          detail: 'Zero staleness. All subsequent reads anywhere across the globe observe this value or a later committed value.',
          status: 'cached'
        }
      ]
    }
  };

  const currentFlow = scenarioFlows[selectedScenario];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <style>{`
        @media (max-width: 768px) {
          .idemp-consist-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Idempotency, Deduplication & Distributed Consistency Engine
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'architecture', label: '1. Multi-Tier Architecture', icon: '🏛️' },
            { id: 'idempotency-dedup', label: '2. Idempotency vs Deduplication', icon: '⚡' },
            { id: 'consistency-matrix', label: '3. Strong vs Eventual Consistency', icon: '⚖️' },
            { id: 'failure-scenarios', label: '4. Interactive Protocol Walkthrough', icon: '🔬' }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as MainTab)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '12px',
                  background: isActive ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  color: isActive ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
                  boxShadow: isActive ? '0 0 0 1.5px #38bdf8' : '0 0 0 1px rgba(255, 255, 255, 0.08)',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.icon} {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: ARCHITECTURE OVERVIEW */}
        {activeTab === 'architecture' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '12px 16px', borderRadius: '8px', fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.6' }}>
              <strong style={{ color: '#38bdf8' }}>Physical Data Pipeline:</strong> Idempotency and consistency operate across multiple physical boundaries. At the edge, short-lived deduplication filters drop high-frequency duplicates. At the core, persistent unique constraints and consensus protocols enforce strict data invariants.
            </div>

            <div className="idemp-consist-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px' }}>
              {/* Left Column: Idempotency Pipeline */}
              <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🛡️</span> 3-Tier Idempotency Defense Pipeline
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { tier: 'Tier 1: Gateway Fingerprinting', tech: 'Redis / Memory Table', ttl: '60s - 120s TTL', desc: 'SHA-256 payload digest + SETNX mutual exclusion lock to stop in-flight race conditions.' },
                    { tier: 'Tier 2: Application State Machine', tech: 'Redis / Distributed Cache', ttl: '24h - 7d TTL', desc: 'Stores HTTP status, cached response payload, and request execution status (PENDING / COMPLETED).' },
                    { tier: 'Tier 3: Database Unique Constraint', tech: 'PostgreSQL / Spanner', ttl: 'Permanent (ACID)', desc: 'Natural DB constraint: UNIQUE (idempotency_key). Ultimate safety net preventing dual commit.' }
                  ].map((t, idx) => (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #34d399' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff' }}>{t.tier}</span>
                        <span style={{ fontSize: '10px', color: '#34d399', fontFamily: 'monospace' }}>{t.ttl}</span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>{t.tech}</div>
                      <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.4' }}>{t.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Consistency Models Spectrum */}
              <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⚖️</span> Distributed Consistency Engine Placement
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { level: 'Strong (Linearizability)', protocol: 'Raft / Paxos / 2PC', cost: 'High Latency / Reduced Availability', desc: 'Real-time total order. All nodes globally observe updates immediately upon completion.' },
                    { level: 'Session (Read-Your-Writes)', protocol: 'Sticky Routing / Version Vector', cost: 'Moderate Latency / High Availability', desc: 'Client always sees their own writes; other clients may observe slight asynchronous delay.' },
                    { level: 'Eventual Consistency', protocol: 'Async Replication / Gossip / CRDT', cost: 'Sub-ms Latency / Max Availability', desc: 'Zero coordination on write path. Replicas converge asynchronously over time.' }
                  ].map((c, idx) => (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #38bdf8' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff' }}>{c.level}</span>
                        <span style={{ fontSize: '10px', color: '#fbbf24' }}>{c.cost}</span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#38bdf8', fontFamily: 'monospace', marginBottom: '4px' }}>{c.protocol}</div>
                      <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.4' }}>{c.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: IDEMPOTENCY VS DEDUPLICATION */}
        {activeTab === 'idempotency-dedup' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '10px', color: '#38bdf8', textAlign: 'left' }}>Dimension</th>
                    <th style={{ padding: '10px', color: '#fbbf24', textAlign: 'left' }}>Deduplication Mechanism</th>
                    <th style={{ padding: '10px', color: '#34d399', textAlign: 'left' }}>Idempotency Engine</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      dim: 'Core Mathematical Definition',
                      dedup: 'Filter duplicate tokens: discard or drop duplicate events received within time window Δt.',
                      idemp: 'Mathematical property: f(f(x)) = f(x). Invoking N ≥ 1 times produces identical system state.'
                    },
                    {
                      dim: 'Primary Architectural Layer',
                      dedup: 'Edge API Gateway, Kafka Consumer offset manager, Reverse Proxy, Message Broker.',
                      idemp: 'Domain Application Service, Database Unique Constraints, Payment Ledger Core.'
                    },
                    {
                      dim: 'State Retention Lifetime',
                      dedup: 'Short-lived (60 seconds to 1 hour) stored in ephemeral memory (Redis / Memcached).',
                      idemp: 'Long-lived / Permanent (24 hours to 90 days, or permanent record in database).'
                    },
                    {
                      dim: 'Response Behavior on Duplicate',
                      dedup: 'Drops packet, acknowledges message without reprocessing, or returns HTTP 409 / 429.',
                      idemp: 'Replays the original stored HTTP 200/201 response payload with identical headers.'
                    },
                    {
                      dim: 'Payload Tamper Verification',
                      dedup: 'Usually checks only key identity; rarely inspects mutated payload bytes.',
                      idemp: 'Validates SHA-256 canonical hash; rejects request if key is reused with altered payload.'
                    },
                    {
                      dim: 'Failure Recovery Strategy',
                      dedup: 'If cache node crashes, duplicate message might slip through to downstream consumers.',
                      idemp: 'Database ACID commit guarantees absolute uniqueness; cannot be breached by cache crashes.'
                    }
                  ].map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                      <td style={{ padding: '10px', fontWeight: 700, color: '#ffffff' }}>{row.dim}</td>
                      <td style={{ padding: '10px', color: 'var(--ifm-color-content)', lineHeight: '1.4' }}>{row.dedup}</td>
                      <td style={{ padding: '10px', color: 'var(--ifm-color-content)', lineHeight: '1.4' }}>{row.idemp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: STRONG VS EVENTUAL CONSISTENCY */}
        {activeTab === 'consistency-matrix' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="idemp-consist-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px' }}>
              {/* Strong Consistency Card */}
              <div style={{ background: 'rgba(248, 113, 113, 0.05)', border: '1px solid rgba(248, 113, 113, 0.25)', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#f87171', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🔒</span> Strong Consistency (Linearizability)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.5', marginBottom: '12px' }}>
                  <strong>The Contract:</strong> A single global timeline exists. As soon as a write finishes successfully, <strong>every client everywhere in the universe</strong> reading that key is guaranteed to observe the new value immediately.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '4px' }}>
                    <span style={{ color: '#34d399', fontWeight: 700 }}>✅ Advantages:</span> Zero stale reads, simple mental model, prevents overselling/overdrafts, no conflict resolution logic needed.
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '4px' }}>
                    <span style={{ color: '#f87171', fontWeight: 700 }}>⚠️ Trade-offs:</span> High write latency (cross-DC roundtrips), reduced availability under network partitions (CAP theorem CP), lower maximum throughput.
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '4px' }}>
                    <span style={{ color: '#38bdf8', fontWeight: 700 }}>🏢 Systems:</span> Google Spanner (TrueTime), etcd (Raft quorum read), ZooKeeper, PostgreSQL primary.
                  </div>
                </div>
              </div>

              {/* Eventual Consistency Card */}
              <div style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🌐</span> Eventual Consistency (BASE)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.5', marginBottom: '12px' }}>
                  <strong>The Contract:</strong> No global real-time synchronization. If no new updates are made to a key, all replicas will <strong>eventually converge</strong> to identical values. During convergence, clients may observe stale data or out-of-order state.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '4px' }}>
                    <span style={{ color: '#34d399', fontWeight: 700 }}>✅ Advantages:</span> Extremely high throughput, sub-millisecond local writes/reads, resilient to network partitions (CAP theorem AP), massive horizontal scalability.
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '4px' }}>
                    <span style={{ color: '#f87171', fontWeight: 700 }}>⚠️ Trade-offs:</span> Stale reads, time-travel anomalies, complex application-level conflict resolution (CRDTs, vector clocks, LWW data loss).
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '4px' }}>
                    <span style={{ color: '#38bdf8', fontWeight: 700 }}>🏢 Systems:</span> Amazon DynamoDB (default read), Apache Cassandra, Amazon S3 (pre-2020), DNS system, Couchbase.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: INTERACTIVE PROTOCOL WALKTHROUGH */}
        {activeTab === 'failure-scenarios' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Scenario Selector */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'happy_first_write', label: '1. First Write (Idempotent Commit)', color: '#34d399' },
                { id: 'concurrent_retry', label: '2. Concurrent Retry (In-Flight Dedup)', color: '#fbbf24' },
                { id: 'stale_read_eventual', label: '3. Stale Read (Eventual Replication Lag)', color: '#f87171' },
                { id: 'linearizable_quorum', label: '4. Linearizable Quorum Read (Strong)', color: '#38bdf8' }
              ].map(s => {
                const isSel = selectedScenario === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedScenario(s.id as any);
                      setStepIndex(0);
                    }}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '5px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: isSel ? `${s.color}25` : 'rgba(255,255,255,0.03)',
                      color: isSel ? s.color : 'var(--ifm-color-content-secondary)',
                      boxShadow: isSel ? `0 0 0 1px ${s.color}` : 'none'
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>

            {/* Scenario Header Card */}
            <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>{currentFlow.title}</span>
                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(56,189,248,0.15)', color: '#38bdf8', fontWeight: 700 }}>
                  {currentFlow.consistencyType}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{currentFlow.subtitle}</div>
            </div>

            {/* Step Stepper & Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {currentFlow.steps.map((st, idx) => {
                const isSelected = stepIndex === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setStepIndex(idx)}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      background: isSelected ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.02)',
                      boxShadow: isSelected ? '0 0 0 1px #38bdf8' : '0 0 0 1px rgba(255,255,255,0.05)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontSize: '10px', fontWeight: 800, color: isSelected ? '#38bdf8' : '#64748b' }}>
                      STEP {st.step}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {st.title}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Step Details */}
            {(() => {
              const active = currentFlow.steps[stepIndex];
              return (
                <div style={{ background: 'rgba(12, 14, 23, 0.9)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>
                      Step {active.step}: {active.title}
                    </span>
                    <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8' }}>
                      {active.sender} ➔ {active.receiver}
                    </span>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '11px', color: '#34d399', marginBottom: '10px' }}>
                    {active.action}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.6' }}>
                    {active.detail}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
