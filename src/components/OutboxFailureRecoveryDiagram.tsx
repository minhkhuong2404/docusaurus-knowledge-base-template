import React, { useState } from 'react';

type TabMode = 'recovery' | 'db-retry';

interface RecoveryNode {
  id: string;
  phase: string;
  title: string;
  sublabel: string;
  color: string;
  x: number;
  y: number;
  w: number;
  h: number;
  mechanics: string;
  failureScenario: string;
  mitigation: string;
}

const RECOVERY_NODES: RecoveryNode[] = [
  {
    id: 'claim',
    phase: 'PHASE 1 • <5ms TX',
    title: 'Atomic Lease Claim',
    sublabel: 'SKIP LOCKED + Fence',
    color: '#38bdf8',
    x: 20,
    y: 45,
    w: 162,
    h: 74,
    mechanics: 'Short DB transaction claims a batch using FOR UPDATE SKIP LOCKED, sets status = IN_PROGRESS, lease_expires_at = now() + 60s, and increments fencing_token. Commits immediately to release the HikariCP connection.',
    failureScenario: 'DB connection timeout, primary failover (57P01), or deadlock (40P01) during batch claim.',
    mitigation: 'Relay circuit breaker opens after consecutive DB failures; exponential backoff with jitter prevents thundering-herd polling against a recovering primary.',
  },
  {
    id: 'kafka',
    phase: 'PHASE 2 • NO DB TX',
    title: 'Kafka Broker Publish',
    sublabel: 'acks=all + event_id',
    color: '#a78bfa',
    x: 215,
    y: 45,
    w: 162,
    h: 74,
    mechanics: 'Relay publishes to Kafka outside any DB transaction with enable.idempotence=true and attaches event_id as a Kafka header/key. Zero DB row locks or connections are held during network I/O.',
    failureScenario: 'Kafka broker unreachable or timeout after 5s; DB connection was NOT wasted.',
    mitigation: 'Mark next_retry_at = now() + backoff(retry_count) + jitter and reset status = PENDING. After max_retries, move to DEAD_LETTER to prevent head-of-line blocking.',
  },
  {
    id: 'ack-fail',
    phase: 'FAILURE BOUNDARY',
    title: 'DB ACK Update Fails!',
    sublabel: 'Kafka OK, DB Down',
    color: '#f87171',
    x: 410,
    y: 45,
    w: 162,
    h: 74,
    mechanics: 'Kafka already persisted the message and returned RecordMetadata, but Phase 3 (UPDATE status = PUBLISHED WHERE id = ? AND fencing_token = ?) fails due to DB failover, network drop, or pod crash.',
    failureScenario: 'Reverse Dual-Write hazard: message is live in Kafka while outbox_events row still reads IN_PROGRESS.',
    mitigation: '1) Retry tiny single-row DB ACK 3-5x with jittered backoff (catches 1-3s failovers). 2) Optionally queue event_id in a local/Redis Pending-ACK flusher. 3) If pod dies, lease expires safely.',
  },
  {
    id: 'reclaim',
    phase: 'RECOVERY • LEASE',
    title: 'Lease Expiry Reclaim',
    sublabel: 'At-Least-Once Replay',
    color: '#fbbf24',
    x: 605,
    y: 45,
    w: 145,
    h: 74,
    mechanics: 'After 60s lease_expires_at passes and the DB recovers, a healthy relay reclaims the stale IN_PROGRESS row, bumps fencing_token, re-publishes the exact same event_id to Kafka, and marks PUBLISHED.',
    failureScenario: 'A slow zombie relay wakes up after a GC pause and tries to overwrite status with a stale fencing_token.',
    mitigation: 'WHERE id = :id AND fencing_token = :token rejects stale updates (0 rows affected). Kafka receives at most a duplicate with identical event_id.',
  },
  {
    id: 'inbox',
    phase: 'CONSUMER • IDEMPOTENT',
    title: 'Transactional Inbox',
    sublabel: 'ON CONFLICT DO NOTHING',
    color: '#34d399',
    x: 780,
    y: 45,
    w: 132,
    h: 74,
    mechanics: 'Downstream consumer inserts event_id into processed_events with a UNIQUE constraint inside the same local DB transaction as its business state mutation.',
    failureScenario: 'Duplicate Kafka message arrives from Phase 3 ACK failure + lease replay.',
    mitigation: 'INSERT ... ON CONFLICT (event_id) DO NOTHING returns 0 rows -> consumer skips side effects and commits Kafka offset. Achieves effectively-once semantics!',
  },
];

interface DbErrorRoute {
  id: string;
  sqlState: string;
  title: string;
  category: string;
  color: string;
  x: number;
  y: number;
  w: number;
  h: number;
  action: string;
  why: string;
}

const DB_ERROR_ROUTES: DbErrorRoute[] = [
  {
    id: 'transient',
    sqlState: '40001 / 40P01 / 08xxx',
    title: 'Transient DB Error',
    category: 'Deadlock / Failover / Pool',
    color: '#fbbf24',
    x: 35,
    y: 35,
    w: 195,
    h: 66,
    action: 'Bounded Exponential Backoff + Full Jitter (e.g., 100ms -> 300ms -> 1s -> 2s) + DB Circuit Breaker.',
    why: 'PostgreSQL serialization failures, deadlocks, and RDS Multi-AZ failovers self-heal within seconds. Jitter prevents synchronized retry storms.',
  },
  {
    id: 'duplicate',
    sqlState: '23505 Unique Violation',
    title: 'Idempotency Collision',
    category: 'Duplicate Client Retry',
    color: '#34d399',
    x: 255,
    y: 35,
    w: 195,
    h: 66,
    action: 'Do NOT retry! Catch 23505 on idempotency_key, query the already-committed business record, and return HTTP 200/201.',
    why: 'The previous attempt already committed both the business row and the outbox event before the HTTP response dropped.',
  },
  {
    id: 'poison',
    sqlState: 'retry_count >= MAX',
    title: 'Poison Pill / Schema Error',
    category: 'Non-Retryable Payload',
    color: '#f87171',
    x: 475,
    y: 35,
    w: 195,
    h: 66,
    action: 'Transition status to DEAD_LETTER, record last_error stack trace, emit P1 alert, and continue relaying healthy aggregates.',
    why: 'Prevents a single malformed JSON payload or oversized Kafka record (>1MB) from stalling the entire outbox poller.',
  },
  {
    id: 'cdc',
    sqlState: 'WAL LSN Offset',
    title: 'Debezium CDC Bypass',
    category: 'Zero DB Status Write-Back',
    color: '#38bdf8',
    x: 695,
    y: 35,
    w: 195,
    h: 66,
    action: 'Eliminates Phase 3 DB status updates entirely! Debezium tracks WAL LSN offsets inside Kafka Connect.',
    why: 'Because the relay never writes UPDATE status = PUBLISHED back to PostgreSQL, a post-publish DB failure cannot create an un-acked row.',
  },
];

export default function OutboxFailureRecoveryDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabMode>('recovery');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('ack-fail');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('transient');

  const activeNode = RECOVERY_NODES.find((n) => n.id === selectedNodeId) ?? RECOVERY_NODES[2];
  const activeRoute = DB_ERROR_ROUTES.find((r) => r.id === selectedRouteId) ?? DB_ERROR_ROUTES[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .outbox-recovery-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div className="interactive-diagram-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span style={{ color: '#34d399', fontWeight: 700 }}>
            Outbox DB Failure Retry &amp; Post-Publish ACK Recovery
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          <button
            type="button"
            onClick={() => setActiveTab('recovery')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              background: activeTab === 'recovery' ? 'rgba(248, 113, 113, 0.18)' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === 'recovery' ? '#f87171' : '#94a3b8',
              boxShadow: activeTab === 'recovery' ? '0 0 0 1.5px rgba(248, 113, 113, 0.5)' : '0 0 0 1px rgba(255, 255, 255, 0.1)',
            }}
          >
            Claim-Publish-Ack &amp; ACK Failure
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('db-retry')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              background: activeTab === 'db-retry' ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === 'db-retry' ? '#38bdf8' : '#94a3b8',
              boxShadow: activeTab === 'db-retry' ? '0 0 0 1.5px rgba(56, 189, 248, 0.5)' : '0 0 0 1px rgba(255, 255, 255, 0.1)',
            }}
          >
            DB Error Classification Matrix
          </button>
        </div>
      </div>

      {activeTab === 'recovery' ? (
        <div style={{ padding: '16px' }}>
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ overflowX: 'auto', marginBottom: '16px' }}>
            <svg viewBox="0 0 930 185" style={{ width: '100%', minWidth: '760px', height: 'auto', display: 'block' }}>
              <defs>
                {RECOVERY_NODES.map((node) => (
                  <marker
                    key={node.id}
                    id={`ofr-arr-${node.id}`}
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="3"
                    orient="auto"
                  >
                    <path d="M0,0 L0,6 L8,3 z" fill={node.color} />
                  </marker>
                ))}
                <marker id="ofr-arr-retry" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#fbbf24" />
                </marker>
              </defs>

              {RECOVERY_NODES.slice(0, -1).map((node, idx) => {
                const next = RECOVERY_NODES[idx + 1];
                const x1 = node.x + node.w + 5;
                const y1 = node.y + node.h / 2;
                const x2 = next.x - 9;
                const y2 = next.y + next.h / 2;
                const pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
                return (
                  <g key={`${node.id}-${next.id}`}>
                    <path d={pathD} stroke="rgba(148, 163, 184, 0.25)" strokeWidth="2" fill="none" />
                    <path
                      d={pathD}
                      stroke={node.color}
                      strokeWidth="2.2"
                      fill="none"
                      className="interactive-diagram-flowing-path"
                      markerEnd={`url(#ofr-arr-${node.id})`}
                    />
                  </g>
                );
              })}

              {/* Feedback loop from Lease Expiry Reclaim back to Kafka Publish */}
              <path
                d="M 677 125 L 677 156 L 296 156 L 296 128"
                stroke="rgba(251, 191, 36, 0.25)"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M 677 125 L 677 156 L 296 156 L 296 128"
                stroke="#fbbf24"
                strokeWidth="2"
                fill="none"
                className="interactive-diagram-flowing-path"
                markerEnd="url(#ofr-arr-retry)"
              />
              <text x="486" y="172" textAnchor="middle" fill="#fbbf24" fontSize="10.5" fontWeight="600">
                If DB stays down past local retries: Lease expires (60s) → Reclaim &amp; Replay same event_id
              </text>

              {RECOVERY_NODES.map((node) => {
                const isSelected = node.id === activeNode.id;
                return (
                  <g key={node.id} onClick={() => setSelectedNodeId(node.id)} style={{ cursor: 'pointer' }}>
                    <rect
                      x={node.x}
                      y={node.y}
                      width={node.w}
                      height={node.h}
                      rx={10}
                      fill={isSelected ? `${node.color}24` : 'rgba(15, 23, 42, 0.92)'}
                      stroke={node.color}
                      strokeWidth={isSelected ? 2.4 : 1.3}
                    />
                    <text x={node.x + 10} y={node.y + 20} fill={node.color} fontSize="9.5" fontWeight="700">
                      {node.phase}
                    </text>
                    <text x={node.x + 10} y={node.y + 40} fill="#ffffff" fontSize="11.5" fontWeight="700">
                      {node.title}
                    </text>
                    <text x={node.x + 10} y={node.y + 58} fill="#94a3b8" fontSize="10">
                      {node.sublabel}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${activeNode.color}`, padding: '16px' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: activeNode.color, marginBottom: '10px' }}>
              {activeNode.phase} — {activeNode.title}
            </div>

            <div className="outbox-recovery-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'start' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
                  Under-the-Hood Execution Mechanics
                </div>
                <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.55, marginBottom: '10px' }}>
                  {activeNode.mechanics}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f87171', marginBottom: '4px' }}>
                  Failure Mode
                </div>
                <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.5 }}>
                  {activeNode.failureScenario}
                </div>
              </div>

              <div style={{ background: 'rgba(52, 211, 153, 0.07)', border: '1px solid rgba(52, 211, 153, 0.28)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', marginBottom: '6px' }}>
                  Production Mitigation &amp; Recovery Strategy
                </div>
                <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.55 }}>
                  {activeNode.mitigation}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '16px' }}>
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ overflowX: 'auto', marginBottom: '16px' }}>
            <svg viewBox="0 0 925 205" style={{ width: '100%', minWidth: '760px', height: 'auto', display: 'block' }}>
              <defs>
                {DB_ERROR_ROUTES.map((route) => (
                  <marker
                    key={route.id}
                    id={`dberr-arr-${route.id}`}
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="3"
                    orient="auto"
                  >
                    <path d="M0,0 L0,6 L8,3 z" fill={route.color} />
                  </marker>
                ))}
              </defs>

              {DB_ERROR_ROUTES.map((route) => {
                const isSelected = route.id === activeRoute.id;
                const startX = route.x + route.w / 2;
                const startY = route.y + route.h + 6;
                const targetX = 462;
                const targetY = 140;
                const pathD = `M ${startX} ${startY} C ${startX} ${startY + 22}, ${targetX} ${targetY - 22}, ${targetX} ${targetY}`;
                return (
                  <g key={route.id}>
                    <path d={pathD} stroke="rgba(148, 163, 184, 0.22)" strokeWidth="1.8" fill="none" />
                    <path
                      d={pathD}
                      stroke={route.color}
                      strokeWidth={isSelected ? '2.5' : '1.8'}
                      fill="none"
                      className="interactive-diagram-flowing-path"
                      markerEnd={`url(#dberr-arr-${route.id})`}
                    />
                    <g onClick={() => setSelectedRouteId(route.id)} style={{ cursor: 'pointer' }}>
                      <rect
                        x={route.x}
                        y={route.y}
                        width={route.w}
                        height={route.h}
                        rx={10}
                        fill={isSelected ? `${route.color}24` : 'rgba(15, 23, 42, 0.92)'}
                        stroke={route.color}
                        strokeWidth={isSelected ? 2.4 : 1.3}
                      />
                      <text x={route.x + 12} y={route.y + 21} fill={route.color} fontSize="10" fontWeight="700">
                        {route.sqlState}
                      </text>
                      <text x={route.x + 12} y={route.y + 40} fill="#ffffff" fontSize="12" fontWeight="700">
                        {route.title}
                      </text>
                      <text x={route.x + 12} y={route.y + 56} fill="#94a3b8" fontSize="10">
                        {route.category}
                      </text>
                    </g>
                  </g>
                );
              })}

              <rect x={255} y={146} width={415} height={44} rx={10} fill="rgba(15, 23, 42, 0.95)" stroke="#34d399" strokeWidth="2" />
              <text x={462} y={166} textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">
                Guaranteed Invariant: Zero Lost Events &amp; Zero Pool Exhaustion
              </text>
              <text x={462} y={182} textAnchor="middle" fill="#34d399" fontSize="10.5">
                Classify SQLState → Jittered Retry / Idempotent Return / DLQ / CDC LSN
              </text>
            </svg>
          </div>

          <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${activeRoute.color}`, padding: '16px' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: activeRoute.color, marginBottom: '10px' }}>
              {activeRoute.title} ({activeRoute.sqlState})
            </div>
            <div className="outbox-recovery-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'start' }}>
              <div style={{ background: 'rgba(52, 211, 153, 0.07)', border: '1px solid rgba(52, 211, 153, 0.28)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', marginBottom: '6px' }}>
                  Required Recovery Action
                </div>
                <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.55 }}>{activeRoute.action}</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
                  Physical Engine Justification
                </div>
                <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.55 }}>{activeRoute.why}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
