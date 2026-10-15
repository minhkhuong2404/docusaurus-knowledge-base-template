import React, { useState } from 'react';

type TabKey = 'idempotency' | 'tcc' | 'waiting-room' | 'bulkhead-breaker' | 'saga-outbox';

interface DetailNode {
  id: string;
  title: string;
  badge: string;
  color: string;
  description: string;
  mechanics: string[];
  metrics: { label: string; value: string }[];
  failureMode: string;
}

const TAB_DATA: Record<TabKey, { name: string; subtitle: string; nodes: DetailNode[] }> = {
  idempotency: {
    name: '1. Idempotency Engine',
    subtitle: 'Atomic in-flight mutex locks and dual-write prevention for payment transactions',
    nodes: [
      {
        id: 'idem-ingress',
        title: 'Client Request & Key Extraction',
        badge: 'Ingress Gate',
        color: '#38bdf8',
        description: 'Client submits transaction with Idempotency-Key header (UUIDv4) or gateway computes a deterministic request payload fingerprint (SHA-256).',
        mechanics: [
          'Extracts Idempotency-Key header and validates UUID format',
          'Computes SHA-256 body hash to detect payload tampering across identical keys',
          'Rejects malformed keys before touching downstream storage'
        ],
        metrics: [
          { label: 'Extraction Latency', value: '< 0.5ms' },
          { label: 'Key Format', value: 'UUIDv4 / SHA-256' }
        ],
        failureMode: 'Reusing identical idempotency key with different payment amount without payload fingerprint verification.'
      },
      {
        id: 'idem-redis-lock',
        title: 'Distributed In-Flight Mutex',
        badge: 'Atomic Guard',
        color: '#fbbf24',
        description: 'Redis SETNX with short TTL (e.g. 30s) locks the key atomically. Concurrent duplicate requests arriving within milliseconds receive HTTP 409 Conflict.',
        mechanics: [
          'Atomic command: SET idempotency:{key} "IN_PROGRESS" NX EX 30',
          'If NX returns 0: duplicate request is currently executing; returns 409 Retry-After',
          'Prevents duplicate parallel worker threads from initiating double card charges'
        ],
        metrics: [
          { label: 'Mutex Lock Latency', value: '< 1.2ms' },
          { label: 'TTL Duration', value: '30s Auto-Release' }
        ],
        failureMode: 'Process crashes mid-flight without TTL, permanently locking the transaction key forever.'
      },
      {
        id: 'idem-rdbms-ledger',
        title: 'Durable Idempotency Ledger',
        badge: 'Source of Truth',
        color: '#34d399',
        description: 'Relational database table with UNIQUE constraint on (user_id, idempotency_key). Records transaction states: IN_PROGRESS, COMMITTED, or FAILED.',
        mechanics: [
          'INSERT INTO idempotency_records ... ON CONFLICT (key) DO NOTHING',
          'Encapsulated within primary business transaction boundary',
          'Stores final serialized HTTP response payload (status code, headers, JSON body)'
        ],
        metrics: [
          { label: 'Storage Engine', value: 'PostgreSQL / MySQL' },
          { label: 'Consistency Level', value: 'ACID Enforced' }
        ],
        failureMode: 'Database write commits but external payment gateway times out, leaving ledger in limbo.'
      },
      {
        id: 'idem-cache-replay',
        title: 'Cached Response Replay',
        badge: 'Zero-Side-Effect Replay',
        color: '#a78bfa',
        description: 'When a duplicate request arrives for a COMMITTED key, the gateway replays the cached historical response without executing card payment or decrementing stock.',
        mechanics: [
          'Reads cached response directly from Redis or PostgreSQL ledger',
          'Sets custom response header: "X-Cache-Lookup: IDEMPOTENT-REPLAY"',
          'Guarantees at-most-once processing across network retries'
        ],
        metrics: [
          { label: 'Replay Response Time', value: '< 4ms' },
          { label: 'Payment Double Charges', value: '0.00% Guaranteed' }
        ],
        failureMode: 'Replaying expired responses after data retention TTL has purged the historic ledger entry.'
      }
    ]
  },
  tcc: {
    name: '2. TCC & Timeout Reaper',
    subtitle: 'Two-phase reservation with dead-man switch for high-contention ticket holds',
    nodes: [
      {
        id: 'tcc-try',
        title: 'Phase 1: Try (Soft Hold)',
        badge: 'Temporary Hold',
        color: '#38bdf8',
        description: 'Reserves seat/inventory unit with an expiration deadline (e.g. 10 minutes). Transitions state from AVAILABLE to RESERVED with client session lock.',
        mechanics: [
          'Executes UPDATE seats SET status="RESERVED", held_until=NOW()+INTERVAL 10 MINUTE',
          'Uses SELECT ... FOR UPDATE SKIP LOCKED to eliminate single-row lock queuing',
          'Dispatches reservation token and countdown timer to client frontend'
        ],
        metrics: [
          { label: 'Hold Duration', value: '600 Seconds' },
          { label: 'Lock Contention', value: 'Zero (SKIP LOCKED)' }
        ],
        failureMode: 'Cart abandonment without expiration reaper leaves seats locked forever, causing artificial stockouts.'
      },
      {
        id: 'tcc-confirm',
        title: 'Phase 2: Confirm (Capture)',
        badge: 'Permanent Commit',
        color: '#34d399',
        description: 'Triggered upon verified payment gateway webhook. Transitions seat state from RESERVED to SOLD and mints digital cryptographic ticket.',
        mechanics: [
          'Verifies that held_until > NOW() before confirming transaction',
          'Atomically updates seat status to "SOLD" and generates barcode asset',
          'Persists immutable financial ledger journal entry'
        ],
        metrics: [
          { label: 'Confirmation SLA', value: '< 80ms' },
          { label: 'Oversell Rate', value: '0.00%' }
        ],
        failureMode: 'Confirm webhook arriving 5 milliseconds AFTER the hold expired and seat was already sold to another user.'
      },
      {
        id: 'tcc-cancel',
        title: 'Phase 2: Cancel (Release)',
        badge: 'Immediate Rollback',
        color: '#f87171',
        description: 'Triggered when customer explicitly abandons checkout or card authorization fails with insufficient funds. Immediately frees seat back to pool.',
        mechanics: [
          'Executes UPDATE seats SET status="AVAILABLE", user_id=NULL WHERE id=?',
          'Invalidates reservation session token in distributed cache',
          'Publishes SeatReleasedEvent to Kafka for real-time seat map broadcast'
        ],
        metrics: [
          { label: 'Release Latency', value: '< 15ms' },
          { label: 'Seat Recirculation', value: 'Instant' }
        ],
        failureMode: 'Out-of-order Cancel arriving before Try due to network reordering, leaving orphan reservations.'
      },
      {
        id: 'tcc-reaper',
        title: 'Timeout Reaper Sweeper',
        badge: 'Dead-Man Switch',
        color: '#fbbf24',
        description: 'Background cron/delayed queue process that continuously audits expired holds and returns abandoned tickets back to the available inventory pool.',
        mechanics: [
          'High-throughput delayed queue (Kafka DLQ / RabbitMQ Dead Letter / Redis ZSET)',
          'ZSET score = expiration epoch timestamp; worker polls ZRANGEBYSCORE -inf (NOW)',
          'Batched soft updates without taking full-table locks on the seats ledger'
        ],
        metrics: [
          { label: 'Sweep Precision', value: '< 1.5s Offset' },
          { label: 'Inventory Leakage', value: '0 Units' }
        ],
        failureMode: 'Reaper service outage during Taylor Swift sale leaving 30% of inventory stuck in phantom holds.'
      }
    ]
  },
  'waiting-room': {
    name: '3. Virtual Waiting Room',
    subtitle: 'Edge-based traffic shaving and cryptographic queue tokens for million-user surges',
    nodes: [
      {
        id: 'room-edge-surge',
        title: 'Edge Ingress Influx (1M+ Users)',
        badge: 'Surge Influx',
        color: '#f87171',
        description: 'Massive flash crowd of 1,000,000 concurrent fans hits the ticketing domain within the same 500-millisecond ticket drop window.',
        mechanics: [
          'Direct traffic would instantly exhaust database connections and saturate Nginx worker pools',
          'CDN Edge layer (Cloudflare / Fastly) intercepts 100% of incoming HTTP requests',
          'Stateless edge evaluation checks if active origin session count exceeds threshold'
        ],
        metrics: [
          { label: 'Peak Inflow', value: '1.2M RPS' },
          { label: 'Origin Load', value: 'Shielded (0%)' }
        ],
        failureMode: 'Allowing unmitigated ingress traffic to reach database connection pool, crashing master node.'
      },
      {
        id: 'room-queue-tokens',
        title: 'Cryptographic Queue Token',
        badge: 'Signed JWT Token',
        color: '#fbbf24',
        description: 'Users are routed to a static, CDN-cached waiting room page and assigned an HMAC-SHA256 signed queue token containing their deterministic queue position.',
        mechanics: [
          'Edge issues signed cookie/JWT: { pos: 42100, exp: 1739500000, sig: ... }',
          'Zero database writes required to queue millions of waiting users',
          'Browser polls lightweight static edge endpoint to compute real-time ETA'
        ],
        metrics: [
          { label: 'Token Issuance Speed', value: '< 2ms' },
          { label: 'Crypto Signature', value: 'Ed25519 / HMAC' }
        ],
        failureMode: 'Unsigned client-side tokens allowing bot operators to forge queue position #1.'
      },
      {
        id: 'room-rate-admission',
        title: 'Controlled Admission Gate',
        badge: 'Traffic Shaver',
        color: '#34d399',
        description: 'The edge gate admits users into the transactional booking engine in measured, calibrated batches (e.g. exactly 500 checkout sessions per second).',
        mechanics: [
          'Token Bucket algorithm calibrated strictly to database write capacity',
          'Admitted token upgraded to ActiveCheckoutToken with 10-minute validity',
          'Converts chaotic million-user spike into a perfectly flat, predictable load profile'
        ],
        metrics: [
          { label: 'Admission Rate', value: '500 Users / Sec' },
          { label: 'Database CPU', value: 'Stable at 45%' }
        ],
        failureMode: 'Token expiration during payment entry forcing users back to the end of the 1-hour queue.'
      },
      {
        id: 'room-sharded-db',
        title: 'Sharded Inventory Buckets',
        badge: 'High-Scale Storage',
        color: '#38bdf8',
        description: 'Database inventory partitioned into discrete buckets or seat rows using MySQL SKIP LOCKED and Redis Bitmaps, eliminating single-row mutex bottlenecks.',
        mechanics: [
          'General admission tickets partitioned across 32 independent counter buckets',
          'Checkout workers write to random bucket mod 32, eliminating lock waits',
          'Guarantees sub-10ms checkout write latency under maximum admitted throughput'
        ],
        metrics: [
          { label: 'Partition Buckets', value: '32 Shards' },
          { label: 'Checkout Latency', value: 'P99 < 12ms' }
        ],
        failureMode: 'Imbalanced bucket distribution where one shard exhausts while other shards retain stock.'
      }
    ]
  },
  'bulkhead-breaker': {
    name: '4. Bulkhead & Adaptive Limits',
    subtitle: 'Isolating downstream payment partners and dynamic RTT concurrency limiting',
    nodes: [
      {
        id: 'bulk-ingress',
        title: 'Gateway Ingress Dispatcher',
        badge: 'Traffic Router',
        color: '#38bdf8',
        description: 'Central API gateway receives checkout payment requests and dynamically routes transactions across multiple PSPs (Payment Service Providers).',
        mechanics: [
          'Evaluates customer card BIN (Visa, Mastercard, Amex, Local debit)',
          'Selects optimal primary payment partner based on fee and real-time health',
          'Enforces maximum global in-flight request boundary'
        ],
        metrics: [
          { label: 'Routing Latency', value: '< 1ms' },
          { label: 'Supported PSPs', value: 'Stripe, Adyen, PayPal' }
        ],
        failureMode: 'Routing 100% of volume to a degrading provider without automated circuit diversion.'
      },
      {
        id: 'bulk-compartments',
        title: 'Compartmentalized Bulkheads',
        badge: 'Fault Isolation',
        color: '#34d399',
        description: 'Dedicated, bounded thread pools and semaphores assigned to each payment provider. A complete outage in Provider A cannot starve threads for Provider B.',
        mechanics: [
          'Stripe Bulkhead: Max 100 concurrent threads, queue capacity 20',
          'Adyen Bulkhead: Max 100 concurrent threads, queue capacity 20',
          'PayPal Bulkhead: Max 50 concurrent threads, queue capacity 10'
        ],
        metrics: [
          { label: 'Isolation Boundary', value: 'Thread & Semaphore' },
          { label: 'Cross-Contamination', value: '0% (Isolated)' }
        ],
        failureMode: 'Shared global thread pool where 100 slow Stripe requests block all internal booking queries.'
      },
      {
        id: 'bulk-circuit-breaker',
        title: 'Circuit Breaker & Fallback',
        badge: 'Fail-Fast Barrier',
        color: '#f87171',
        description: 'Monitors error rates and slow call percentages. If Provider A error rate exceeds 50% over a 100-call sliding window, breaker trips OPEN.',
        mechanics: [
          'State machine: CLOSED (normal) -> OPEN (fail-fast 503) -> HALF-OPEN (probe trial)',
          'When OPEN: immediately fails fast in 0.1ms without touching network socket',
          'Automatically reroutes transactions to secondary payment gateway fallback'
        ],
        metrics: [
          { label: 'Failure Threshold', value: '50% in 100 Calls' },
          { label: 'Open Wait Duration', value: '15 Seconds' }
        ],
        failureMode: 'Breaker flapping rapidly between OPEN and CLOSED due to insufficient sliding window sample size.'
      },
      {
        id: 'bulk-adaptive-limits',
        title: 'Adaptive Concurrency Limiter',
        badge: 'Vegas Algorithm',
        color: '#a78bfa',
        description: 'Netflix Concurrency-Limits implementation based on TCP Vegas / Little\'s Law. Automatically shrinks in-flight capacity as downstream latency climbs.',
        mechanics: [
          'Calculates Gradient = RTT_base / RTT_measured; NewLimit = CurrentLimit * Gradient + Beta',
          'Replaces arbitrary static thread pool numbers with dynamic latency feedback',
          'Prevents upstream server queues from overflowing during minor provider hiccups'
        ],
        metrics: [
          { label: 'Algorithm', value: 'TCP Vegas / Gradient' },
          { label: 'Queue Buffering', value: 'Self-Tuning' }
        ],
        failureMode: 'Misconfigured baseline RTT causing permanent throttling during ordinary network latency variations.'
      }
    ]
  },
  'saga-outbox': {
    name: '5. Outbox & Fenced Saga',
    subtitle: 'Transactional Outbox CDC and out-of-order compensation fences across microservices',
    nodes: [
      {
        id: 'saga-outbox-db',
        title: 'Order DB & Outbox Table',
        badge: 'Dual-Write Immunity',
        color: '#38bdf8',
        description: 'Business order entity mutation and message event are committed within the EXACT SAME local database transaction. Eliminates dual-write loss.',
        mechanics: [
          'BEGIN TRANSACTION; UPDATE orders ...; INSERT INTO outbox_events ...; COMMIT;',
          'Guarantees 100% atomic alignment between database state and event log',
          'Zero message loss even if application process crashes immediately after commit'
        ],
        metrics: [
          { label: 'Transaction Scope', value: 'Single Local ACID' },
          { label: 'Dual-Write Bug Risk', value: 'Eliminated' }
        ],
        failureMode: 'Updating database and attempting direct Kafka produce without outbox; network error causes silent drift.'
      },
      {
        id: 'saga-cdc-kafka',
        title: 'Debezium CDC & Kafka Log',
        badge: 'At-Least-Once Pipeline',
        color: '#fbbf24',
        description: 'Debezium reads the database transaction log (Postgres WAL / MySQL binlog) and streams events to Kafka topic with zero runtime application overhead.',
        mechanics: [
          'Non-polling tail of binary database transaction log',
          'Publishes events with partition key = order_id to preserve strict sequence',
          'De-duplicates message offsets via consumer idempotency tracker'
        ],
        metrics: [
          { label: 'CDC Engine', value: 'Debezium / Kafka' },
          { label: 'Streaming Lag', value: '< 25ms' }
        ],
        failureMode: 'Database WAL disk exhaustion when CDC connector stalls and fails to advance read offset.'
      },
      {
        id: 'saga-orchestrator',
        title: 'Stateful Saga Orchestrator',
        badge: 'Workflow Coordinator',
        color: '#34d399',
        description: 'Centralized state machine executing the multi-step transaction: Reserve Seats -> Authorize Payment -> Capture Funds -> Mint Barcode Ticket.',
        mechanics: [
          'Stores durable saga execution state in PostgreSQL or Temporal workflow engine',
          'If any step fails, dispatches compensating transactions in reverse order',
          'Applies idempotency keys to every outbound remote RPC step'
        ],
        metrics: [
          { label: 'Workflow Engine', value: 'Temporal / Cadence' },
          { label: 'State Durability', value: 'Crash-Resilient' }
        ],
        failureMode: 'Infinite retry loops when a non-retryable payment error (card stolen) is treated as transient.'
      },
      {
        id: 'saga-compensation-fence',
        title: 'Fenced Semantic Compensation',
        badge: 'Out-of-Order Shield',
        color: '#f87171',
        description: 'Defensive state machine preventing out-of-order race conditions where a CANCEL compensating message arrives before the original TRY/RESERVE message.',
        mechanics: [
          'If Cancel arrives first: writes dummy record with state "PRE_CANCELLED"',
          'When subsequent Try arrives: observes PRE_CANCELLED state and immediately aborts',
          'Prevents phantom leaked holds and permanent seat locking'
        ],
        metrics: [
          { label: 'Out-of-Order Safety', value: '100% Fenced' },
          { label: 'Leak Prevention', value: 'Zero Phantom Holds' }
        ],
        failureMode: 'Executing blind refund compensation without verifying original debit transaction actually settled.'
      }
    ]
  }
};

export default function DistributedResiliencePaymentsTicketingDiagram(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<TabKey>('idempotency');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('idem-ingress');

  const currentTabConfig = TAB_DATA[activeTab];
  const selectedNode =
    currentTabConfig.nodes.find((n) => n.id === selectedNodeId) || currentTabConfig.nodes[0];

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setSelectedNodeId(TAB_DATA[tab].nodes[0].id);
  };

  return (
    <div
      className="interactive-diagram-container"
      style={{
        background: '#090b14',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '20px',
        margin: '24px 0',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .resilience-grid {
            grid-template-columns: 1fr !important;
          }
          .resilience-tabs {
            flex-wrap: wrap !important;
          }
        }
      `}</style>

      {/* Header bar */}
      <div className="interactive-diagram-header" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#38bdf8', letterSpacing: '0.04em' }}>
            DISTRIBUTED RESILIENCE PATTERNS · PAYMENTS & TICKETING
          </span>
        </div>
        <span
          style={{
            fontSize: '11px',
            color: '#94a3b8',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          Senior Principal Architecture
        </span>
      </div>

      {/* Tabs navigation */}
      <div
        className="resilience-tabs"
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '12px'
        }}
      >
        {(['idempotency', 'tcc', 'waiting-room', 'bulkhead-breaker', 'saga-outbox'] as TabKey[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              style={{
                background: isActive ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                border: isActive ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                color: isActive ? '#38bdf8' : '#94a3b8',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {TAB_DATA[tab].name}
            </button>
          );
        })}
      </div>

      {/* Subtitle */}
      <div style={{ color: '#cbd5e1', fontSize: '13px', marginBottom: '16px', fontStyle: 'italic' }}>
        {currentTabConfig.subtitle}
      </div>

      {/* Split pane layout: Visual Flow Canvas & Telemetry Detail */}
      <div
        className="resilience-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '55% 45%',
          gap: '16px',
          alignItems: 'start'
        }}
      >
        {/* Left: Interactive SVG Flow Canvas */}
        <div
          style={{
            background: '#0d0f1e',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            padding: '16px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#64748b',
              marginBottom: '12px',
              fontWeight: 700
            }}
          >
            Resilience Architecture Map (Click node to inspect telemetry)
          </div>

          <svg
            width="100%"
            height="290"
            viewBox="0 0 460 290"
            style={{ display: 'block', overflow: 'visible' }}
          >
            <defs>
              <marker
                id="resil-arrow-blue"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
              </marker>
              <marker
                id="resil-arrow-emerald"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34d399" />
              </marker>
              <marker
                id="resil-arrow-amber"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fbbf24" />
              </marker>
              <marker
                id="resil-arrow-purple"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a78bfa" />
              </marker>
              <marker
                id="resil-arrow-red"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f87171" />
              </marker>
            </defs>

            {/* Connecting Flow Lines */}
            {activeTab === 'idempotency' && (
              <>
                {/* Ingress -> Redis Lock */}
                <path
                  d="M 130 52 L 330 52"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#resil-arrow-blue)"
                />
                <path
                  className="interactive-diagram-flowing-path"
                  d="M 130 52 L 330 52"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeDasharray="6,6"
                  fill="none"
                />
                {/* Redis Lock -> RDBMS Ledger */}
                <path
                  d="M 385 85 L 385 180"
                  stroke="#fbbf24"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#resil-arrow-amber)"
                />
                {/* RDBMS Ledger -> Cache Replay */}
                <path
                  d="M 330 212 L 130 212"
                  stroke="#34d399"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#resil-arrow-emerald)"
                />
                <path
                  className="interactive-diagram-flowing-path"
                  d="M 330 212 L 130 212"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeDasharray="6,6"
                  fill="none"
                />
                {/* Cache Replay -> Ingress (Return Replay) */}
                <path
                  d="M 75 180 L 75 85"
                  stroke="#a78bfa"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                  fill="none"
                  markerEnd="url(#resil-arrow-purple)"
                />
              </>
            )}

            {activeTab === 'tcc' && (
              <>
                {/* Try -> Confirm */}
                <path
                  d="M 130 52 L 330 52"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#resil-arrow-blue)"
                />
                <path
                  className="interactive-diagram-flowing-path"
                  d="M 130 52 L 330 52"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeDasharray="6,6"
                  fill="none"
                />
                {/* Confirm -> Cancel (Alternate failure) */}
                <path
                  d="M 385 85 L 385 180"
                  stroke="#f87171"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  fill="none"
                  markerEnd="url(#resil-arrow-red)"
                />
                {/* Cancel -> Reaper */}
                <path
                  d="M 330 212 L 130 212"
                  stroke="#fbbf24"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#resil-arrow-amber)"
                />
                {/* Reaper -> Try (Restores stock) */}
                <path
                  d="M 75 180 L 75 85"
                  stroke="#34d399"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                  fill="none"
                  markerEnd="url(#resil-arrow-emerald)"
                />
              </>
            )}

            {activeTab === 'waiting-room' && (
              <>
                {/* Edge Influx -> Queue Token */}
                <path
                  d="M 130 52 L 330 52"
                  stroke="#f87171"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#resil-arrow-red)"
                />
                <path
                  className="interactive-diagram-flowing-path"
                  d="M 130 52 L 330 52"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeDasharray="6,6"
                  fill="none"
                />
                {/* Queue Token -> Rate Admission */}
                <path
                  d="M 385 85 L 385 180"
                  stroke="#fbbf24"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#resil-arrow-amber)"
                />
                {/* Rate Admission -> Sharded DB */}
                <path
                  d="M 330 212 L 130 212"
                  stroke="#34d399"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#resil-arrow-emerald)"
                />
                <path
                  className="interactive-diagram-flowing-path"
                  d="M 330 212 L 130 212"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeDasharray="6,6"
                  fill="none"
                />
              </>
            )}

            {activeTab === 'bulkhead-breaker' && (
              <>
                {/* Gateway -> Compartments */}
                <path
                  d="M 130 52 L 330 52"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#resil-arrow-blue)"
                />
                <path
                  className="interactive-diagram-flowing-path"
                  d="M 130 52 L 330 52"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeDasharray="6,6"
                  fill="none"
                />
                {/* Compartments -> Circuit Breaker */}
                <path
                  d="M 385 85 L 385 180"
                  stroke="#f87171"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#resil-arrow-red)"
                />
                {/* Circuit Breaker -> Adaptive Limits */}
                <path
                  d="M 330 212 L 130 212"
                  stroke="#a78bfa"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#resil-arrow-purple)"
                />
                {/* Adaptive Limits -> Gateway (RTT feedback) */}
                <path
                  d="M 75 180 L 75 85"
                  stroke="#34d399"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                  fill="none"
                  markerEnd="url(#resil-arrow-emerald)"
                />
              </>
            )}

            {activeTab === 'saga-outbox' && (
              <>
                {/* Order DB -> Debezium CDC */}
                <path
                  d="M 130 52 L 330 52"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#resil-arrow-blue)"
                />
                <path
                  className="interactive-diagram-flowing-path"
                  d="M 130 52 L 330 52"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeDasharray="6,6"
                  fill="none"
                />
                {/* Debezium CDC -> Saga Orchestrator */}
                <path
                  d="M 385 85 L 385 180"
                  stroke="#fbbf24"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#resil-arrow-amber)"
                />
                {/* Saga Orchestrator -> Compensation Fence */}
                <path
                  d="M 330 212 L 130 212"
                  stroke="#f87171"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#resil-arrow-red)"
                />
                {/* Compensation Fence -> Order DB (Rollback) */}
                <path
                  d="M 75 180 L 75 85"
                  stroke="#34d399"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                  fill="none"
                  markerEnd="url(#resil-arrow-emerald)"
                />
              </>
            )}

            {/* Interactive Node Rectangles */}
            {currentTabConfig.nodes.map((node, idx) => {
              // 4-box layout
              let x = 20;
              let y = 20;
              const w = 110;
              const h = 65;

              if (idx === 0) {
                x = 20;
                y = 20;
              } else if (idx === 1) {
                x = 330;
                y = 20;
              } else if (idx === 2) {
                x = 330;
                y = 180;
              } else {
                x = 20;
                y = 180;
              }

              const isSelected = selectedNode.id === node.id;

              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <rect
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    rx="8"
                    fill={isSelected ? 'rgba(56, 189, 248, 0.22)' : 'rgba(255, 255, 255, 0.04)'}
                    stroke={isSelected ? node.color : 'rgba(255, 255, 255, 0.12)'}
                    strokeWidth={isSelected ? '2' : '1'}
                    style={{ transition: 'all 0.2s ease' }}
                  />
                  {/* Badge banner */}
                  <rect
                    x={x + 6}
                    y={y + 6}
                    width={w - 12}
                    height={16}
                    rx="4"
                    fill={node.color}
                    opacity="0.18"
                  />
                  <text
                    x={x + w / 2}
                    y={y + 18}
                    fill={node.color}
                    fontSize="9"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {node.badge}
                  </text>
                  {/* Title lines */}
                  <text
                    x={x + w / 2}
                    y={y + 38}
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {node.title.split(' ')[0]} {node.title.split(' ')[1] || ''}
                  </text>
                  <text
                    x={x + w / 2}
                    y={y + 51}
                    fill="#94a3b8"
                    fontSize="9"
                    textAnchor="middle"
                  >
                    {node.title.split(' ').slice(2).join(' ')}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Right: Detailed Telemetry Inspector */}
        <div
          style={{
            background: '#0c0e17',
            border: `1px solid ${selectedNode.color}40`,
            borderRadius: '8px',
            padding: '16px',
            color: '#ffffff'
          }}
        >
          {/* Node Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: selectedNode.color,
                background: `${selectedNode.color}1a`,
                border: `1px solid ${selectedNode.color}40`,
                padding: '3px 8px',
                borderRadius: '4px',
                textTransform: 'uppercase'
              }}
            >
              {selectedNode.badge}
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Inspect Telemetry</span>
          </div>

          <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginBottom: '6px' }}>
            {selectedNode.title}
          </div>

          <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5', marginBottom: '12px' }}>
            {selectedNode.description}
          </p>

          {/* Under-the-hood Mechanics */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
              Engine Mechanics
            </div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#e2e8f0', lineHeight: '1.5' }}>
              {selectedNode.mechanics.map((m, i) => (
                <li key={i} style={{ marginBottom: '4px' }}>{m}</li>
              ))}
            </ul>
          </div>

          {/* Metrics Panel */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              marginBottom: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            {selectedNode.metrics.map((metric, i) => (
              <div key={i}>
                <div style={{ fontSize: '10px', color: '#64748b' }}>{metric.label}</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: selectedNode.color }}>
                  {metric.value}
                </div>
              </div>
            ))}
          </div>

          {/* Failure Mode Gotcha */}
          <div
            style={{
              background: 'rgba(248, 113, 113, 0.08)',
              border: '1px solid rgba(248, 113, 113, 0.25)',
              borderRadius: '6px',
              padding: '8px 10px',
              fontSize: '11px',
              color: '#fca5a5',
              lineHeight: '1.4'
            }}
          >
            <strong style={{ color: '#f87171' }}>Production Gotcha: </strong>
            {selectedNode.failureMode}
          </div>
        </div>
      </div>
    </div>
  );
}
