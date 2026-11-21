import React, { useState } from 'react';

type UseCaseId = 'docs' | 'chat' | 'notifications';

interface ArchNode {
  id: string;
  label: string;
  sublabel: string;
  color: string;
  x: number;
  y: number;
  w: number;
  h: number;
  detail: string;
}

interface ArchEdge {
  from: string;
  to: string;
  label: string;
  color: string;
}

interface UseCaseSpec {
  id: UseCaseId;
  tabLabel: string;
  transport: string;
  consistencyModel: string;
  orderingKey: string;
  sourceOfTruth: string;
  summary: string;
  nodes: ArchNode[];
  edges: ArchEdge[];
  tradeOffs: string[];
}

const USE_CASES: Record<UseCaseId, UseCaseSpec> = {
  docs: {
    id: 'docs',
    tabLabel: '1. Google Docs (OT / CRDT)',
    transport: 'Bidirectional WebSocket + REST Snapshot',
    consistencyModel: 'Strong Eventual Consistency (OT Revision / CRDT)',
    orderingKey: 'docId (Consistent-Hashed Stateful Room)',
    sourceOfTruth: 'Append-Only Op-Log + Periodic S3/DB Snapshots',
    summary:
      'Collaborative editors require sub-100ms bidirectional deltas AND deterministic conflict resolution when two users edit the same line concurrently without locks.',
    nodes: [
      {
        id: 'users',
        label: 'Clients A & B',
        sublabel: 'Local Optimistic Buffer',
        color: '#38bdf8',
        x: 24,
        y: 80,
        w: 150,
        h: 72,
        detail:
          'Applies local keystrokes immediately (0ms UI lag), buffers unacked ops in-flight, and sends deltas (baseRev, op) over WebSocket.',
      },
      {
        id: 'gw',
        label: 'Doc Gateway / LB',
        sublabel: 'Consistent Hash (docId)',
        color: '#a78bfa',
        x: 230,
        y: 80,
        w: 165,
        h: 72,
        detail:
          'Routes all collaborators of the same docId to the SAME Stateful Doc Server instance so OT revision serialization stays lock-free in memory.',
      },
      {
        id: 'engine',
        label: 'OT / CRDT Engine',
        sublabel: 'Rev N -> Rev N+1',
        color: '#34d399',
        x: 455,
        y: 34,
        w: 195,
        h: 74,
        detail:
          'OT transforms incoming op(baseRev) against committed ops [baseRev+1..N], assigns monotonic serverRev = N+1, and broadcasts to all room peers.',
      },
      {
        id: 'presence',
        label: 'Cursor & Presence',
        sublabel: 'Redis Pub/Sub (Ephemeral)',
        color: '#fbbf24',
        x: 455,
        y: 136,
        w: 195,
        h: 66,
        detail:
          'Throttled cursor/selection coordinates broadcast via fire-and-forget Redis Pub/Sub; never persisted to the op-log.',
      },
      {
        id: 'store',
        label: 'Op-Log + Snapshot',
        sublabel: 'DynamoDB/PG + S3',
        color: '#f472b6',
        x: 710,
        y: 34,
        w: 175,
        h: 74,
        detail:
          'Persists ordered (docId, serverRev, op) deltas; background worker compacts every 500 ops into an S3/DB snapshot for fast page loads.',
      },
    ],
    edges: [
      { from: 'users', to: 'gw', label: 'WS Delta (baseRev)', color: '#38bdf8' },
      { from: 'gw', to: 'engine', label: 'Route by docId', color: '#a78bfa' },
      { from: 'gw', to: 'presence', label: 'Cursor Pos', color: '#fbbf24' },
      { from: 'engine', to: 'store', label: 'Append Op', color: '#34d399' },
    ],
    tradeOffs: [
      'OT (Google Docs) keeps server as single source of truth & small op payloads, but requires sticky docId routing.',
      'CRDT (Yjs / Automerge) enables peer-to-peer / offline-first merging without a central sequencer, at higher metadata memory cost.',
      'Always separate durable Document Ops (persisted) from ephemeral Cursor Presence (fire-and-forget).',
    ],
  },
  chat: {
    id: 'chat',
    tabLabel: '2. Chat System (1:1 & Group)',
    transport: 'WebSocket (Online) + APNs/FCM (Offline)',
    consistencyModel: 'Per-Conversation Ordering (Snowflake ID / seq)',
    orderingKey: 'conversationId (Kafka / DB Partition Key)',
    sourceOfTruth: 'Durable Message Store (Cassandra / ScyllaDB)',
    summary:
      'Chat systems persist every message durably BEFORE pushing to recipients, using a Redis user-to-gateway routing table for targeted cross-node delivery.',
    nodes: [
      {
        id: 'sender',
        label: 'Sender Client',
        sublabel: 'WS Frame + clientMsgId',
        color: '#38bdf8',
        x: 24,
        y: 80,
        w: 150,
        h: 72,
        detail:
          'Attaches a client-generated UUID (clientMsgId) for idempotency so retries on flaky mobile networks never create duplicate chat bubbles.',
      },
      {
        id: 'chatSvc',
        label: 'Chat Service',
        sublabel: 'Snowflake / ULID Seq',
        color: '#34d399',
        x: 230,
        y: 80,
        w: 165,
        h: 72,
        detail:
          'Assigns time-ordered message_id + per-conversation seq, writes to Cassandra/ScyllaDB FIRST, then looks up recipient gateway in Redis.',
      },
      {
        id: 'routing',
        label: 'Presence & Routing',
        sublabel: 'Redis user -> nodeId',
        color: '#fbbf24',
        x: 455,
        y: 34,
        w: 190,
        h: 70,
        detail:
          'Maps online userId -> {connId, gatewayNodeId}. Avoids O(N) broadcast across all gateway nodes.',
      },
      {
        id: 'msgDb',
        label: 'Message Store',
        sublabel: '(channel_id, bucket)',
        color: '#a78bfa',
        x: 455,
        y: 136,
        w: 190,
        h: 66,
        detail:
          'Wide-column store partitioned by (conversation_id, month_bucket) sorted by message_id DESC for fast infinite scroll & offline resume.',
      },
      {
        id: 'delivery',
        label: 'Recipient Delivery',
        sublabel: 'Gateway WS or Push',
        color: '#f472b6',
        x: 705,
        y: 80,
        w: 180,
        h: 72,
        detail:
          'If online -> publishes to recipient gateway node channel -> WebSocket push. If offline -> dispatches APNs/FCM push notification.',
      },
    ],
    edges: [
      { from: 'sender', to: 'chatSvc', label: 'Send(clientMsgId)', color: '#38bdf8' },
      { from: 'chatSvc', to: 'routing', label: 'Lookup Node', color: '#fbbf24' },
      { from: 'chatSvc', to: 'msgDb', label: 'Persist First', color: '#a78bfa' },
      { from: 'routing', to: 'delivery', label: 'WS / Push', color: '#34d399' },
    ],
    tradeOffs: [
      'Persist to DB BEFORE pushing over WebSocket so offline/reconnecting devices can always catch up via ?afterSeq=N.',
      'For large channels (>1,000 members), switch from eager per-member fan-out to channel-level pub/sub + pull-on-open.',
      'Store a single last_read_seq watermark per (user, channel) instead of per-message read receipts to avoid write amplification.',
    ],
  },
  notifications: {
    id: 'notifications',
    tabLabel: '3. Real-Time Notifications',
    transport: 'SSE (Last-Event-ID) + APNs/FCM Push',
    consistencyModel: 'At-Least-Once + Idempotent Durable Inbox',
    orderingKey: 'userId (Kafka Partition Key)',
    sourceOfTruth: 'Notification Inbox Table (PostgreSQL / DynamoDB)',
    summary:
      'Notifications are unidirectional server-to-client events: Transactional Outbox -> Kafka -> Preference/Dedupe Router -> Durable Inbox -> SSE or Mobile Push.',
    nodes: [
      {
        id: 'source',
        label: 'Domain Service',
        sublabel: 'Outbox + Kafka (userId)',
        color: '#38bdf8',
        x: 24,
        y: 80,
        w: 155,
        h: 72,
        detail:
          'Emits domain events via Transactional Outbox into Kafka partitioned by userId so events never get lost if DB commits.',
      },
      {
        id: 'router',
        label: 'Notification Router',
        sublabel: 'Prefs, Dedupe & Collapse',
        color: '#a78bfa',
        x: 235,
        y: 80,
        w: 175,
        h: 72,
        detail:
          'Checks user opt-outs, quiet hours, rate limits, and aggregates noisy bursts (e.g. "Alice and 12 others liked your post").',
      },
      {
        id: 'inbox',
        label: 'Durable User Inbox',
        sublabel: 'DB + Monotonic seq',
        color: '#34d399',
        x: 465,
        y: 34,
        w: 185,
        h: 70,
        detail:
          'Writes notification to durable inbox with UNIQUE(event_id) BEFORE attempting real-time delivery. Source of truth for bell-icon badge.',
      },
      {
        id: 'presence',
        label: 'Presence Check',
        sublabel: 'Online vs Offline',
        color: '#fbbf24',
        x: 465,
        y: 136,
        w: 185,
        h: 66,
        detail:
          'Checks Redis presence:conn:{userId}. Routes live tabs to SSE/WebSocket backplane; routes offline mobile devices to APNs/FCM.',
      },
      {
        id: 'channels',
        label: 'SSE / Push Channels',
        sublabel: 'EventSource / FCM',
        color: '#f472b6',
        x: 705,
        y: 80,
        w: 180,
        h: 72,
        detail:
          'Browser EventSource reconnects automatically with Last-Event-ID header to replay missed notifications seamlessly.',
      },
    ],
    edges: [
      { from: 'source', to: 'router', label: 'Kafka(userId)', color: '#38bdf8' },
      { from: 'router', to: 'inbox', label: 'Persist Inbox', color: '#34d399' },
      { from: 'router', to: 'presence', label: 'Check Online', color: '#fbbf24' },
      { from: 'presence', to: 'channels', label: 'SSE / Push', color: '#f472b6' },
    ],
    tradeOffs: [
      'SSE is superior to WebSocket for web notifications: plain HTTP/2, automatic Last-Event-ID resume, and zero custom framing.',
      'Real-time delivery is a latency optimization—the durable Notification Inbox is always the source of truth.',
      'Use Fan-out-on-Write for normal alerts, and Fan-out-on-Read for global/celebrity broadcasts (10M+ followers).',
    ],
  },
};

export default function RealTimeUseCasesArchitectureDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<UseCaseId>('docs');
  const spec = USE_CASES[activeTab];
  const [selectedNodeId, setSelectedNodeId] = useState<string>(spec.nodes[2].id);

  const activeNode =
    spec.nodes.find((n) => n.id === selectedNodeId) ?? spec.nodes[0];

  const handleTabChange = (nextTab: UseCaseId) => {
    setActiveTab(nextTab);
    setSelectedNodeId(USE_CASES[nextTab].nodes[2].id);
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .rt-uc-split {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div className="interactive-diagram-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span style={{ color: '#34d399', fontWeight: 700 }}>
            Real-Time Use Case Architectures (Docs vs. Chat vs. Notifications)
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto', flexWrap: 'wrap' }}>
          {(Object.keys(USE_CASES) as UseCaseId[]).map((id) => {
            const isActive = activeTab === id;
            const tabColor = id === 'docs' ? '#34d399' : id === 'chat' ? '#38bdf8' : '#fbbf24';
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleTabChange(id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  background: isActive ? `${tabColor}20` : 'rgba(255,255,255,0.05)',
                  color: isActive ? tabColor : '#94a3b8',
                  boxShadow: isActive ? `0 0 0 1.5px ${tabColor}55` : '0 0 0 1px rgba(255,255,255,0.1)',
                }}
              >
                {USE_CASES[id].tabLabel}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: '8px',
            marginBottom: '14px',
          }}
        >
          <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '8px', padding: '8px 12px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>Transport</div>
            <div style={{ fontSize: '12px', color: '#ffffff', fontWeight: 600 }}>{spec.transport}</div>
          </div>
          <div style={{ background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.25)', borderRadius: '8px', padding: '8px 12px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>Consistency Engine</div>
            <div style={{ fontSize: '12px', color: '#ffffff', fontWeight: 600 }}>{spec.consistencyModel}</div>
          </div>
          <div style={{ background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.25)', borderRadius: '8px', padding: '8px 12px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase' }}>Ordering / Routing Key</div>
            <div style={{ fontSize: '12px', color: '#ffffff', fontWeight: 600 }}>{spec.orderingKey}</div>
          </div>
          <div style={{ background: 'rgba(167, 139, 250, 0.08)', border: '1px solid rgba(167, 139, 250, 0.25)', borderRadius: '8px', padding: '8px 12px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase' }}>Source of Truth</div>
            <div style={{ fontSize: '12px', color: '#ffffff', fontWeight: 600 }}>{spec.sourceOfTruth}</div>
          </div>
        </div>

        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ overflowX: 'auto', marginBottom: '14px' }}>
          <svg viewBox="0 0 910 230" style={{ width: '100%', minWidth: '740px', height: 'auto', display: 'block' }}>
            <defs>
              <marker id="rtuc-arr-blue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#38bdf8" />
              </marker>
              <marker id="rtuc-arr-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#34d399" />
              </marker>
              <marker id="rtuc-arr-purple" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#a78bfa" />
              </marker>
              <marker id="rtuc-arr-amber" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#fbbf24" />
              </marker>
              <marker id="rtuc-arr-pink" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#f472b6" />
              </marker>
            </defs>

            {spec.edges.map((edge, idx) => {
              const fromNode = spec.nodes.find((n) => n.id === edge.from);
              const toNode = spec.nodes.find((n) => n.id === edge.to);
              if (!fromNode || !toNode) {
                return null;
              }
              const x1 = fromNode.x + fromNode.w + 5;
              const y1 = fromNode.y + fromNode.h / 2;
              const x2 = toNode.x - 9;
              const y2 = toNode.y + toNode.h / 2;
              const midX = (x1 + x2) / 2;
              const pathD = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
              const markerId =
                edge.color === '#34d399'
                  ? 'rtuc-arr-green'
                  : edge.color === '#a78bfa'
                    ? 'rtuc-arr-purple'
                    : edge.color === '#fbbf24'
                      ? 'rtuc-arr-amber'
                      : edge.color === '#f472b6'
                        ? 'rtuc-arr-pink'
                        : 'rtuc-arr-blue';

              return (
                <g key={`${edge.from}-${edge.to}-${idx}`}>
                  <path d={pathD} stroke="rgba(148,163,184,0.22)" strokeWidth="2" fill="none" />
                  <path
                    d={pathD}
                    stroke={edge.color}
                    strokeWidth="2.2"
                    fill="none"
                    className="interactive-diagram-flowing-path"
                    markerEnd={`url(#${markerId})`}
                  />
                  <text
                    x={midX}
                    y={(y1 + y2) / 2 - 8}
                    textAnchor="middle"
                    fill={edge.color}
                    fontSize="10"
                    fontWeight="700"
                  >
                    {edge.label}
                  </text>
                </g>
              );
            })}

            {spec.nodes.map((node) => {
              const isSelected = node.id === activeNode.id;
              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  style={{ cursor: 'pointer' }}
                >
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
                  <text x={node.x + 12} y={node.y + 24} fill={node.color} fontSize="12" fontWeight="700">
                    {node.label}
                  </text>
                  <text x={node.x + 12} y={node.y + 44} fill="#e2e8f0" fontSize="10.5">
                    {node.sublabel}
                  </text>
                  <text x={node.x + 12} y={node.y + 60} fill="#94a3b8" fontSize="9.5">
                    Click node to inspect
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="rt-uc-split" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'start' }}>
          <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${activeNode.color}`, padding: '14px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: activeNode.color, marginBottom: '6px' }}>
              Node Deep Dive: {activeNode.label}
            </div>
            <div style={{ fontSize: '12.5px', color: '#e2e8f0', lineHeight: 1.55, marginBottom: '8px' }}>
              {activeNode.detail}
            </div>
            <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
              {spec.summary}
            </div>
          </div>

          <div className="interactive-diagram-details-card" style={{ padding: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', marginBottom: '8px' }}>
              Key Architectural Rules &amp; Trade-Offs
            </div>
            {spec.tradeOffs.map((t, i) => (
              <div key={i} style={{ fontSize: '12px', color: '#e2e8f0', marginBottom: '6px', lineHeight: 1.5 }}>
                • {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
