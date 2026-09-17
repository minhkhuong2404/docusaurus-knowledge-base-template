import React, { useState } from 'react';

type FailureStage = 'single-instance' | 'horizontal-app' | 'database-limits' | 'caching-stampede' | 'async-queues' | 'ai-vector-scale';

interface StageData {
  id: FailureStage;
  title: string;
  badge: string;
  traffic: string;
  brokenComponent: string;
  errorMessage: string;
  whyItBreaks: string[];
  architecturalFix: string;
  fixSteps: string[];
  judgmentRule: string;
}

const STAGES: StageData[] = [
  {
    id: 'single-instance',
    title: '1. The Single Server (1 App, 1 DB)',
    badge: '1 – 1,000 Users',
    traffic: '~10 - 50 req/sec',
    brokenComponent: 'Monolithic Web Server & Colocated DB',
    errorMessage: 'FATAL: JavaScript heap out of memory / 504 Gateway Timeout',
    whyItBreaks: [
      'Node.js single-threaded event loop blocks on synchronous JSON parsing or crypto ops.',
      'Colocated PostgreSQL competes with the web process for RAM, causing OS OOM Killer to kill the database.',
      'Traffic spikes exhaust CPU and thread pools, leaving requests queued until HTTP 504 timeout.'
    ],
    architecturalFix: 'Decouple App from Database & Add Reverse Proxy / Load Balancer',
    fixSteps: [
      'Move database to a dedicated managed instance (e.g. AWS RDS / Supabase) with isolated RAM.',
      'Place Nginx / AWS ALB in front of the application server.',
      'Prepare the application runtime to run multiple stateless replicas.'
    ],
    judgmentRule: 'Start with 1 server + 1 DB on Day 1. Do NOT introduce microservices or Kubernetes until you physically measure CPU/Memory saturation.'
  },
  {
    id: 'horizontal-app',
    title: '2. Horizontal Scaling Pitfalls',
    badge: '1,000 – 50,000 Users',
    traffic: '~200 - 1,000 req/sec',
    brokenComponent: 'Stateless App Fleet Coordination',
    errorMessage: '401 Unauthorized (Session Not Found) / 404 Not Found (File Missing)',
    whyItBreaks: [
      'Session State Trap: User logs in on Server A; next request hits Server B where in-memory session is missing ➔ forced logout.',
      'Local File Upload Trap: Files saved to local disk (`/public/uploads`) on Server A do not exist when requested from Server B.',
      'Duplicate Cron Execution: If 5 app replicas run the same cron job, customers receive 5 duplicate charge emails at midnight!'
    ],
    architecturalFix: 'Stateless App Tier + Shared Session Store + Object Storage',
    fixSteps: [
      'Store user sessions in a centralized Redis cluster or switch to stateless JWTs (Clerk / Auth0).',
      'Move all file uploads directly to Cloud Object Storage (Amazon S3 / Cloudflare R2 / Supabase Storage).',
      'Isolate scheduled cron jobs to a single dedicated worker pod or use Redis distributed locks (Redlock).'
    ],
    judgmentRule: 'Your application servers must be completely disposable. Any state on the local disk or local RAM is a production outage waiting to happen.'
  },
  {
    id: 'database-limits',
    title: '3. The Database Bottleneck',
    badge: '50,000 – 250,000 Users',
    traffic: '~2,000 - 5,000 req/sec',
    brokenComponent: 'Primary Relational Database',
    errorMessage: 'FATAL: remaining connection slots are reserved for non-replication superuser connections',
    whyItBreaks: [
      'Connection Exhaustion: 20 app servers × 20 pool connections = 400 connections. PostgreSQL max_connections is breached, crashing incoming queries.',
      'Read Contention: Complex analytical queries and dashboard feeds peg DB CPU at 100%, locking out write transactions.',
      'The Replication Lag Trap: User writes to Primary, redirects, reads from Replica before sync completes ➔ "My post vanished!"'
    ],
    architecturalFix: 'Connection Pooling + Read Replicas + Causal Routing',
    fixSteps: [
      'Deploy PgBouncer / Supavisor connection pooler: multiplexes 5,000 client connections down to 50 server connections.',
      'Add 2-3 Read Replicas to absorb 80% of SELECT traffic.',
      'Enforce Read-Your-Own-Writes consistency: Route reads to Primary for 3 seconds after any write by that user ID.'
    ],
    judgmentRule: 'The database is stateful and cannot scale infinitely with a slider. Defend the database at all costs with connection pooling and caching.'
  },
  {
    id: 'caching-stampede',
    title: '4. Caching & The Stampede',
    badge: '250,000 – 1,000,000 Users',
    traffic: '~10,000 - 25,000 req/sec',
    brokenComponent: 'Distributed Redis Cache & Origin DB',
    errorMessage: 'DB Connection Timeout: 10,000 simultaneous queries on cache expiration',
    whyItBreaks: [
      'Cache Stampede (Thundering Herd): When a viral home feed key expires, 10,000 concurrent requests miss simultaneously and slam the DB.',
      'Cache Invalidation Stale Bug: Updating DB without invalidating cache serves outdated prices or permissions to users.',
      'Cache Penetration: Attackers query non-existent IDs (e.g. ID -999); queries bypass cache and hit DB every single time.'
    ],
    architecturalFix: 'Cache-Aside + Mutex Locking + Probabilistic Early Refresh',
    fixSteps: [
      'Implement Distributed Mutex (Redis SETNX): On cache miss, only 1 worker queries DB; other 9,999 wait for the key to repopulate.',
      'Adopt XFetch Probabilistic Early Expiration: Background workers refresh hot keys before they physically expire.',
      'Use Bloom Filters in front of Redis to reject queries for non-existent IDs before touching database.'
    ],
    judgmentRule: 'Decide if data can be stale. Follower counts and view counts can be 30 seconds stale; bank balances and inventory checkout NEVER can.'
  },
  {
    id: 'async-queues',
    title: '5. The Synchronous HTTP Trap',
    badge: '1M – 5M Users',
    traffic: '~30,000 - 80,000 req/sec',
    brokenComponent: 'User-Facing Request Threads & External APIs',
    errorMessage: '504 Gateway Timeout (Upstream request timed out after 30000ms)',
    whyItBreaks: [
      'Blocking on External APIs: Calling AI LLMs (OpenAI/Anthropic), PDF generators, or scraping tools inside HTTP request takes 10+ seconds.',
      'Connection Saturation: Clients keep connections open, exhausting reverse proxy worker slots and socket file descriptors.',
      'Double Execution: Impatient users click "Submit" 4 times when the page hangs, triggering duplicate processing or payments.'
    ],
    architecturalFix: 'Asynchronous Job Queues + 202 Accepted + WebSockets/SSE',
    fixSteps: [
      'On request, push job to BullMQ / Redis / AWS SQS and return HTTP 202 Accepted with a unique `job_id` in < 20ms.',
      'Dedicated background worker fleet processes the queue with retry exponential backoff.',
      'Stream completion status to client via Server-Sent Events (SSE), WebSockets, or client polling (`GET /jobs/:id`).'
    ],
    judgmentRule: 'Never let external API latency dictate your internal API response time. Any task taking longer than 200ms belongs in a background queue.'
  },
  {
    id: 'ai-vector-scale',
    title: '6. AI & Vector Search Scale',
    badge: '5M+ Users / High-AI Traffic',
    traffic: '~100,000+ req/sec',
    brokenComponent: 'Vector Database & Embedding Storage',
    errorMessage: 'Query Timeout / High Latency p99: pgvector Cosine Distance Scan',
    whyItBreaks: [
      'Sequential Vector Scan: Exact cosine distance search requires scanning all 1536-dimension vectors ($O(N)$), killing DB at > 50,000 rows.',
      'Memory Exhaustion: Vector indexes (HNSW) require massive RAM to keep the vector graph resident in memory.',
      'Embedding Drift & Rate Limits: Re-embedding millions of documents exceeds third-party API rate limits and burns thousands of dollars.'
    ],
    architecturalFix: 'Approximate Nearest Neighbor (ANN) HNSW Indexing + Dedicated Vector Store',
    fixSteps: [
      'Build HNSW (Hierarchical Navigable Small World) index in pgvector: changes search from $O(N)$ to $O(\\log N)$.',
      'Tune `m` (connections per node) and `ef_construction` parameters based on memory budget.',
      'Cache semantic query embeddings in Redis to prevent repeated LLM embedding generation calls.'
    ],
    judgmentRule: 'Vector search is an approximation trade-off. Accept 95% recall for 100x speedup. Never run exact vector scans in a production request path.'
  }
];

export default function WhatBreaksAtScaleDiagram() {
  const [activeStageId, setActiveStageId] = useState<FailureStage>('single-instance');
  const [showResolvedView, setShowResolvedView] = useState<boolean>(false);

  const stage = STAGES.find((s) => s.id === activeStageId) || STAGES[0];

  return (
    <div className="interactive-diagram-container">
      <style>{`
        @media (max-width: 768px) {
          .breaks-layout-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div>
            <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '15px', fontWeight: 700 }}>
              What Actually Breaks When Your App Gets Popular
            </h4>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
              Interactive Failure Simulator & Architectural Evolution (JavaScript Mastery Principles)
            </div>
          </div>
        </div>

        {/* State Toggle: Broken vs Resolved */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Simulation:</span>
          <button
            onClick={() => setShowResolvedView(!showResolvedView)}
            style={{
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              background: showResolvedView ? '#34d399' : '#f87171',
              color: '#090b14',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            {showResolvedView ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Architectural Fix Applied
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                Active Failure State
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stage Selector Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '0 4px' }}>
        {STAGES.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setActiveStageId(s.id);
              setShowResolvedView(false);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: activeStageId === s.id ? '#38bdf8' : 'var(--ifm-color-emphasis-300)',
              background: activeStageId === s.id ? 'rgba(56, 189, 248, 0.15)' : 'var(--ifm-background-surface-color)',
              color: activeStageId === s.id ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            {s.title.split('. ')[1]}
          </button>
        ))}
      </div>

      {/* Main Split-Pane Content */}
      <div className="breaks-layout-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', alignItems: 'start' }}>
        {/* Left Column: Visual Architecture Topology Canvas */}
        <div className="interactive-diagram-svg-wrapper" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)' }}>
              System Topology: {showResolvedView ? 'Target Scalable Design' : 'Failure Point Under Load'}
            </span>
            <span style={{ fontSize: '11px', fontFamily: 'monospace', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: '#fbbf24' }}>
              Scale: {stage.badge}
            </span>
          </div>

          <svg viewBox="0 0 460 260" className="interactive-diagram-svg" style={{ maxHeight: '250px' }}>
            <defs>
              <marker id="arrow-sky" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#38bdf8" />
              </marker>
              <marker id="arrow-emerald" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#34d399" />
              </marker>
              <marker id="arrow-red" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#f87171" />
              </marker>
            </defs>

            {/* Stage 1: Single Instance */}
            {stage.id === 'single-instance' && (
              <g>
                <rect x="20" y="90" width="70" height="40" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="55" y="114" fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold">Clients (1k)</text>

                <path d="M96 110 L154 110" stroke={showResolvedView ? "#34d399" : "#f87171"} strokeWidth="2" strokeDasharray={showResolvedView ? "none" : "4 3"} markerEnd={showResolvedView ? "url(#arrow-emerald)" : "url(#arrow-red)"} />

                <rect x="160" y="60" width="130" height="100" rx="8" fill={showResolvedView ? "#13232a" : "#2d1619"} stroke={showResolvedView ? "#34d399" : "#f87171"} strokeWidth="2" />
                <text x="225" y="80" fill={showResolvedView ? "#34d399" : "#f87171"} fontSize="11" textAnchor="middle" fontWeight="bold">
                  {showResolvedView ? "Nginx / ALB" : "Single VPS ($10)"}
                </text>
                <text x="225" y="102" fill="var(--ifm-color-content-secondary)" fontSize="9" textAnchor="middle">
                  {showResolvedView ? "SSL + Round Robin" : "Colocated Node + Postgres"}
                </text>
                <text x="225" y="122" fill={showResolvedView ? "#38bdf8" : "#f87171"} fontSize="9" textAnchor="middle" fontWeight="600">
                  {showResolvedView ? "Healthy Gateway" : "CPU 100% | OOM Crash"}
                </text>

                <path d="M296 110 L344 110" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow-sky)" />
                <rect x="350" y="80" width="90" height="60" rx="6" fill="#1e293b" stroke={showResolvedView ? "#34d399" : "#f87171"} strokeWidth="1.5" />
                <text x="395" y="105" fill={showResolvedView ? "#34d399" : "#f87171"} fontSize="10" textAnchor="middle" fontWeight="bold">
                  {showResolvedView ? "Managed RDS" : "Local Postgres"}
                </text>
                <text x="395" y="123" fill="var(--ifm-color-content-secondary)" fontSize="8" textAnchor="middle">
                  {showResolvedView ? "Isolated RAM/I/O" : "RAM Contention"}
                </text>
              </g>
            )}

            {/* Stage 2: Horizontal Scaling */}
            {stage.id === 'horizontal-app' && (
              <g>
                <rect x="10" y="100" width="60" height="36" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="40" y="122" fill="#38bdf8" fontSize="9" textAnchor="middle" fontWeight="bold">Load Balancer</text>

                <path d="M74 105 L114 65" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow-sky)" />
                <path d="M74 135 L114 175" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow-sky)" />

                {/* App 1 */}
                <rect x="120" y="45" width="100" height="42" rx="6" fill="#1e293b" stroke={showResolvedView ? "#34d399" : "#f87171"} strokeWidth="1.5" />
                <text x="170" y="65" fill={showResolvedView ? "#34d399" : "#f87171"} fontSize="10" textAnchor="middle" fontWeight="bold">App Pod #1</text>
                <text x="170" y="78" fill="var(--ifm-color-content-secondary)" fontSize="8" textAnchor="middle">
                  {showResolvedView ? "Stateless JWT / R2" : "Local /uploads (Broken!)"}
                </text>

                {/* App 2 */}
                <rect x="120" y="155" width="100" height="42" rx="6" fill="#1e293b" stroke={showResolvedView ? "#34d399" : "#f87171"} strokeWidth="1.5" />
                <text x="170" y="175" fill={showResolvedView ? "#34d399" : "#f87171"} fontSize="10" textAnchor="middle" fontWeight="bold">App Pod #2</text>
                <text x="170" y="188" fill="var(--ifm-color-content-secondary)" fontSize="8" textAnchor="middle">
                  {showResolvedView ? "Stateless JWT / R2" : "Session Missing (401!)"}
                </text>

                {/* Shared Cloud State */}
                <path d="M224 65 L284 100" stroke={showResolvedView ? "#34d399" : "#f87171"} strokeWidth="1.5" markerEnd={showResolvedView ? "url(#arrow-emerald)" : "url(#arrow-red)"} />
                <path d="M224 175 L284 140" stroke={showResolvedView ? "#34d399" : "#f87171"} strokeWidth="1.5" markerEnd={showResolvedView ? "url(#arrow-emerald)" : "url(#arrow-red)"} />

                <rect x="290" y="85" width="150" height="70" rx="8" fill={showResolvedView ? "#13232a" : "#2d1619"} stroke={showResolvedView ? "#34d399" : "#f87171"} strokeWidth="2" />
                <text x="365" y="110" fill={showResolvedView ? "#34d399" : "#f87171"} fontSize="11" textAnchor="middle" fontWeight="bold">
                  {showResolvedView ? "Shared State Layer" : "State Collision"}
                </text>
                <text x="365" y="128" fill="var(--ifm-color-content-secondary)" fontSize="9" textAnchor="middle">
                  {showResolvedView ? "Redis Sessions + S3/R2 Bucket" : "Disjoint Memory & Files"}
                </text>
              </g>
            )}

            {/* Stage 3: Database Limits */}
            {stage.id === 'database-limits' && (
              <g>
                <rect x="10" y="90" width="80" height="45" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="50" y="112" fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold">20 App Pods</text>
                <text x="50" y="126" fill="var(--ifm-color-content-secondary)" fontSize="8" textAnchor="middle">400 Connections</text>

                <path d="M94 112 L144 112" stroke={showResolvedView ? "#34d399" : "#f87171"} strokeWidth="2" markerEnd={showResolvedView ? "url(#arrow-emerald)" : "url(#arrow-red)"} />

                {/* Pooler or direct crash */}
                <rect x="150" y="70" width="120" height="85" rx="8" fill={showResolvedView ? "#13232a" : "#2d1619"} stroke={showResolvedView ? "#34d399" : "#f87171"} strokeWidth="2" />
                <text x="210" y="94" fill={showResolvedView ? "#34d399" : "#f87171"} fontSize="11" textAnchor="middle" fontWeight="bold">
                  {showResolvedView ? "PgBouncer / Supavisor" : "Direct DB Connect"}
                </text>
                <text x="210" y="115" fill="var(--ifm-color-content-secondary)" fontSize="8" textAnchor="middle">
                  {showResolvedView ? "Multiplexed Pool: 50" : "max_connections Exceeded!"}
                </text>
                <text x="210" y="132" fill={showResolvedView ? "#38bdf8" : "#f87171"} fontSize="8" textAnchor="middle">
                  {showResolvedView ? "Transaction Mode Pooling" : "FATAL Connection Drop"}
                </text>

                {/* DBs */}
                <path d="M274 95 L314 65" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow-sky)" />
                <path d="M274 130 L314 160" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow-sky)" />

                <rect x="320" y="45" width="125" height="42" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="382" y="65" fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold">Primary DB (Writes)</text>
                <text x="382" y="78" fill="var(--ifm-color-content-secondary)" fontSize="8" textAnchor="middle">ACID Transactions</text>

                <rect x="320" y="145" width="125" height="42" rx="6" fill="#1e293b" stroke={showResolvedView ? "#34d399" : "#fbbf24"} strokeWidth="1.5" />
                <text x="382" y="165" fill={showResolvedView ? "#34d399" : "#fbbf24"} fontSize="10" textAnchor="middle" fontWeight="bold">Read Replicas (80%)</text>
                <text x="382" y="178" fill="var(--ifm-color-content-secondary)" fontSize="8" textAnchor="middle">
                  {showResolvedView ? "Causal Consistency Check" : "Replication Lag 200ms"}
                </text>
              </g>
            )}

            {/* Stage 4: Cache Stampede */}
            {stage.id === 'caching-stampede' && (
              <g>
                <rect x="10" y="90" width="80" height="45" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="50" y="112" fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold">10,000 Users</text>
                <text x="50" y="125" fill="var(--ifm-color-content-secondary)" fontSize="8" textAnchor="middle">Simultaneous Reads</text>

                <path d="M94 112 L144 112" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow-sky)" />

                {/* Redis */}
                <rect x="150" y="65" width="130" height="95" rx="8" fill={showResolvedView ? "#13232a" : "#2d1619"} stroke={showResolvedView ? "#34d399" : "#f87171"} strokeWidth="2" />
                <text x="215" y="88" fill={showResolvedView ? "#34d399" : "#f87171"} fontSize="11" textAnchor="middle" fontWeight="bold">Redis Cache</text>
                <text x="215" y="108" fill="var(--ifm-color-content-secondary)" fontSize="8" textAnchor="middle">
                  {showResolvedView ? "Mutex Lock + Early Refresh" : "Hot Key Expired (TTL 0s)!"}
                </text>
                <text x="215" y="128" fill={showResolvedView ? "#34d399" : "#f87171"} fontSize="8" textAnchor="middle" fontWeight="bold">
                  {showResolvedView ? "Only 1 DB Query Allowed" : "Thundering Herd Miss!"}
                </text>

                <path d="M284 112 L334 112" stroke={showResolvedView ? "#34d399" : "#f87171"} strokeWidth={showResolvedView ? "1.5" : "3"} markerEnd={showResolvedView ? "url(#arrow-emerald)" : "url(#arrow-red)"} />

                <rect x="340" y="80" width="105" height="65" rx="6" fill="#1e293b" stroke={showResolvedView ? "#34d399" : "#f87171"} strokeWidth="1.5" />
                <text x="392" y="105" fill={showResolvedView ? "#34d399" : "#f87171"} fontSize="10" textAnchor="middle" fontWeight="bold">Postgres DB</text>
                <text x="392" y="122" fill="var(--ifm-color-content-secondary)" fontSize="8" textAnchor="middle">
                  {showResolvedView ? "Normal Load (1 Query)" : "10k DB Queries Crash!"}
                </text>
              </g>
            )}

            {/* Stage 5: Async Queues */}
            {stage.id === 'async-queues' && (
              <g>
                <rect x="10" y="90" width="75" height="45" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="47" y="112" fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold">Client App</text>
                <text x="47" y="125" fill="var(--ifm-color-content-secondary)" fontSize="8" textAnchor="middle">Long AI/PDF Job</text>

                <path d="M89 112 L134 112" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow-sky)" />

                {/* Web Tier */}
                <rect x="140" y="70" width="115" height="85" rx="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="197" y="92" fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold">API Gateway</text>
                <text x="197" y="110" fill="var(--ifm-color-content-secondary)" fontSize="8" textAnchor="middle">
                  {showResolvedView ? "Returns HTTP 202 in 15ms" : "Synchronous Block 15s"}
                </text>
                <text x="197" y="128" fill={showResolvedView ? "#34d399" : "#f87171"} fontSize="8" textAnchor="middle" fontWeight="bold">
                  {showResolvedView ? "Job ID: job_9981" : "504 Timeout on Client"}
                </text>

                {/* Queue or Direct LLM */}
                <path d="M259 112 L304 112" stroke={showResolvedView ? "#34d399" : "#f87171"} strokeWidth="2" markerEnd={showResolvedView ? "url(#arrow-emerald)" : "url(#arrow-red)"} />

                <rect x="310" y="70" width="135" height="85" rx="8" fill={showResolvedView ? "#13232a" : "#2d1619"} stroke={showResolvedView ? "#34d399" : "#f87171"} strokeWidth="2" />
                <text x="377" y="95" fill={showResolvedView ? "#34d399" : "#f87171"} fontSize="11" textAnchor="middle" fontWeight="bold">
                  {showResolvedView ? "BullMQ / SQS Workers" : "OpenAI / Claude API"}
                </text>
                <text x="377" y="115" fill="var(--ifm-color-content-secondary)" fontSize="8" textAnchor="middle">
                  {showResolvedView ? "Decoupled Async Fleet" : "Ties Up Web Worker Thread"}
                </text>
                <text x="377" y="132" fill={showResolvedView ? "#34d399" : "#f87171"} fontSize="8" textAnchor="middle">
                  {showResolvedView ? "Push via WebSocket / SSE" : "Cascading Failures"}
                </text>
              </g>
            )}

            {/* Stage 6: AI Vector Scale */}
            {stage.id === 'ai-vector-scale' && (
              <g>
                <rect x="15" y="90" width="80" height="45" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="55" y="112" fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold">User Query</text>
                <text x="55" y="125" fill="var(--ifm-color-content-secondary)" fontSize="8" textAnchor="middle">1536-dim Vector</text>

                <path d="M99 112 L144 112" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow-sky)" />

                {/* Vector Indexing */}
                <rect x="150" y="65" width="140" height="95" rx="8" fill={showResolvedView ? "#13232a" : "#2d1619"} stroke={showResolvedView ? "#34d399" : "#f87171"} strokeWidth="2" />
                <text x="220" y="88" fill={showResolvedView ? "#34d399" : "#f87171"} fontSize="11" textAnchor="middle" fontWeight="bold">
                  {showResolvedView ? "HNSW Index (pgvector)" : "Sequential Cosine Scan"}
                </text>
                <text x="220" y="108" fill="var(--ifm-color-content-secondary)" fontSize="8" textAnchor="middle">
                  {showResolvedView ? "O(log N) Graph Hop" : "O(N) Full Table Distance"}
                </text>
                <text x="220" y="125" fill={showResolvedView ? "#34d399" : "#f87171"} fontSize="8" textAnchor="middle" fontWeight="bold">
                  {showResolvedView ? "Latency: 4ms (98% Recall)" : "Latency: 2800ms (CPU 100%)"}
                </text>

                <path d="M294 112 L344 112" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#arrow-sky)" />
                <rect x="350" y="80" width="95" height="65" rx="6" fill="#1e293b" stroke="#34d399" strokeWidth="1.5" />
                <text x="397" y="105" fill="#34d399" fontSize="10" textAnchor="middle" fontWeight="bold">Semantic Cache</text>
                <text x="397" y="122" fill="var(--ifm-color-content-secondary)" fontSize="8" textAnchor="middle">Redis Embeddings</text>
              </g>
            )}
          </svg>

          {/* Quick Metrics Bar */}
          <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ padding: '8px', borderRadius: '6px', background: 'var(--ifm-color-emphasis-100)', border: '1px solid var(--ifm-color-emphasis-200)' }}>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase' }}>Target Traffic</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>{stage.traffic}</div>
            </div>
            <div style={{ padding: '8px', borderRadius: '6px', background: 'var(--ifm-color-emphasis-100)', border: '1px solid var(--ifm-color-emphasis-200)' }}>
              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase' }}>Critical Component</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24' }}>{stage.brokenComponent}</div>
            </div>
          </div>
        </div>

        {/* Right Column: Failure Breakdown & Fix Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Error Banner */}
          <div style={{ padding: '12px', borderRadius: '8px', background: showResolvedView ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)', border: `1px solid ${showResolvedView ? '#34d399' : '#f87171'}` }}>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: showResolvedView ? '#34d399' : '#f87171', marginBottom: '4px' }}>
              {showResolvedView ? 'Resolution Summary' : 'Observed Production Symptom'}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--ifm-color-content)', wordBreak: 'break-word' }}>
              {showResolvedView ? stage.architecturalFix : stage.errorMessage}
            </div>
          </div>

          {/* Why It Breaks List */}
          {!showResolvedView ? (
            <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-200)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#f87171', marginBottom: '8px', textTransform: 'uppercase' }}>
                Why It Actually Breaks
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6 }}>
                {stage.whyItBreaks.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-200)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', marginBottom: '8px', textTransform: 'uppercase' }}>
                Step-by-Step Architectural Remedy
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.6 }}>
                {stage.fixSteps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Judgment is the Job Card */}
          <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(251, 191, 36, 0.08)', borderLeft: '4px solid #fbbf24' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '4px' }}>
              Architectural Judgment Rule
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5, fontStyle: 'italic' }}>
              &ldquo;{stage.judgmentRule}&rdquo;
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
