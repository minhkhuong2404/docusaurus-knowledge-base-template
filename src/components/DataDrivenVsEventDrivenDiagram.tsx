import React, { useState } from 'react';

type ArchitectureMode = 'data_driven' | 'event_driven' | 'hybrid' | 'decision_matrix';

interface ScenarioEval {
  title: string;
  recommended: 'Data-Driven' | 'Event-Driven' | 'Hybrid (CDC + Outbox)';
  accentColor: string;
  reason: string;
  latencyProfile: string;
  consistencyTarget: string;
  complexityTax: string;
  antiPatternWarning: string;
}

const SCENARIOS: Record<string, ScenarioEval> = {
  reporting: {
    title: 'Financial Ledger & Regulatory Balance Reporting',
    recommended: 'Data-Driven',
    accentColor: '#38bdf8',
    reason: 'Requires strict immediate ACID transactions, relational foreign-key integrity, multi-table atomic balance audits, and predictable tabular querying across normalized schemas.',
    latencyProfile: '10ms – 250ms (synchronous query, bounded by index scan & lock acquisition)',
    consistencyTarget: 'Strict Immediate Consistency (Serializability / Read Committed)',
    complexityTax: 'Low to Medium: single database engine, native rollback, standard SQL tooling',
    antiPatternWarning: 'Avoid pure EDA with eventual consistency here; temporary reconciliation drifts can breach regulatory balance audits.'
  },
  fulfillment: {
    title: 'High-Volume E-Commerce Order Fulfillment & Logistics',
    recommended: 'Event-Driven',
    accentColor: '#34d399',
    reason: 'Involves decoupled cross-domain microservices (Payments, Inventory, Logistics, Notifications). Asynchronous event choreography prevents cascade outages and buffers burst traffic.',
    latencyProfile: '< 5ms producer handoff, sub-second end-to-end choreography pipeline',
    consistencyTarget: 'Eventual Consistency (BASE) governed by Saga compensations',
    complexityTax: 'Medium to High: distributed tracing, dead-letter handling, idempotent deduplication',
    antiPatternWarning: 'Avoid synchronous REST request-response chains across 5 services; failure in Logistics will cascade back and abort Order creation.'
  },
  enterprise_crm: {
    title: 'Scalable Enterprise Core (Transactional OLTP + Multi-Read CQRS)',
    recommended: 'Hybrid (CDC + Outbox)',
    accentColor: '#a78bfa',
    reason: 'Local service operations demand atomic ACID safety in PostgreSQL/MySQL, while global data propagation needs streaming event distribution to Elastic, Redis, and Lakehouses via CDC (Debezium).',
    latencyProfile: '< 2ms local write; ~15ms replication lag to downstream read projections',
    consistencyTarget: 'Local ACID + Global Eventual Consistency (Read Model Projections)',
    complexityTax: 'High: requires Kafka brokers, CDC connectors, schema registries, and projection consumers',
    antiPatternWarning: 'Avoid Dual Writes (writing to SQL DB and publishing to Kafka in the same controller method); network partitions will cause silent data divergence.'
  },
  iot_telemetry: {
    title: 'Real-Time IoT Telemetry & Anomaly Fraud Detection',
    recommended: 'Event-Driven',
    accentColor: '#fbbf24',
    reason: 'Millions of continuous incoming sensor/transaction events require high-throughput append-only streaming, real-time sliding window aggregations, and sub-millisecond alerting.',
    latencyProfile: '< 1ms event ingestion, < 20ms stream analytics latency via Flink/Kafka Streams',
    consistencyTarget: 'Stream-level Exactly-Once Processing (EOS) via transactional epoch offsets',
    complexityTax: 'High: streaming state store management (RocksDB), watermarks, partition rebalances',
    antiPatternWarning: 'Avoid inserting millions of raw IoT data points directly into a single relational table; lock contention and B-tree index maintenance will collapse the DB.'
  }
};

export default function DataDrivenVsEventDrivenDiagram({
  initialMode = 'data_driven'
}: {
  initialMode?: ArchitectureMode;
}): React.JSX.Element {
  const [activeMode, setActiveMode] = useState<ArchitectureMode>(initialMode);
  const [selectedScenarioKey, setSelectedScenarioKey] = useState<string>('fulfillment');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const scenario = SCENARIOS[selectedScenarioKey];

  return (
    <div
      className="interactive-diagram-container"
      style={{
        fontFamily: 'var(--ifm-font-family-base)',
        margin: '1.5rem 0',
        borderRadius: '10px',
        padding: '1.25rem',
        background: '#090b14',
        border: '1px solid #1e293b',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
      }}
    >
      <style>{`
        @keyframes ddaPulseFlow {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes ddaGlow {
          0%, 100% { opacity: 0.75; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.03); }
        }
        .dda-flowing-conduit {
          stroke-dasharray: 6 6;
          animation: ddaPulseFlow 1.2s linear infinite;
        }
        .dda-flowing-fast {
          stroke-dasharray: 4 4;
          animation: ddaPulseFlow 0.7s linear infinite;
        }
        .dda-node-card {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        .dda-node-card:hover {
          filter: brightness(1.2);
        }
        @media (max-width: 768px) {
          .dda-responsive-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div
        className="interactive-diagram-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          borderBottom: '1px solid #1e293b',
          paddingBottom: '12px',
          marginBottom: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          </svg>
          <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '15px', letterSpacing: '0.02em' }}>
            Data-Driven vs Event-Driven Architecture Deep Dive
          </span>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'data_driven', label: '💾 Data-Driven (State)', color: '#38bdf8' },
            { id: 'event_driven', label: '⚡ Event-Driven (Stream)', color: '#34d399' },
            { id: 'hybrid', label: '🔄 Modern Hybrid (CDC + Outbox)', color: '#a78bfa' },
            { id: 'decision_matrix', label: '⚖️ Decision Matrix', color: '#fbbf24' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveMode(tab.id as ArchitectureMode)}
              style={{
                padding: '5px 11px',
                borderRadius: '6px',
                border: `1px solid ${activeMode === tab.id ? tab.color : '#334155'}`,
                background: activeMode === tab.id ? `${tab.color}25` : '#0f172a',
                color: activeMode === tab.id ? tab.color : '#94a3b8',
                fontWeight: activeMode === tab.id ? 700 : 500,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode 1: Data-Driven Architecture Canvas */}
      {activeMode === 'data_driven' && (
        <div>
          <div style={{ background: '#0d0f1e', borderRadius: '8px', border: '1px solid #1e293b', padding: '12px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 700 }}>
                💾 Data-Driven Paradigm: Centralized Database as the Single Source of Truth
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8', background: '#1e293b', padding: '2px 8px', borderRadius: '4px' }}>
                Request-Response & Scheduled Polling
              </span>
            </div>

            <svg viewBox="0 0 880 260" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                <marker id="marker-blue" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                  <polygon points="0 0, 8 4, 0 8" fill="#38bdf8" />
                </marker>
                <marker id="marker-amber" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                  <polygon points="0 0, 8 4, 0 8" fill="#fbbf24" />
                </marker>
                <marker id="marker-red" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                  <polygon points="0 0, 8 4, 0 8" fill="#f87171" />
                </marker>
                <linearGradient id="dbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e3a8a" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
              </defs>

              {/* Background Canvas Grid */}
              <rect width="880" height="260" fill="#0b0f19" rx="8" />

              {/* Left Client Nodes */}
              <g
                className="dda-node-card"
                onMouseEnter={() => setHoveredNode('client_a')}
                onMouseLeave={() => setHoveredNode(null)}
                transform="translate(40, 30)"
              >
                <rect width="170" height="58" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="85" y="24" fill="#ffffff" fontSize="12" fontWeight="700" textAnchor="middle">Web / Mobile Client</text>
                <text x="85" y="42" fill="#94a3b8" fontSize="10" textAnchor="middle">Synchronous HTTP POST</text>
              </g>

              <g
                className="dda-node-card"
                onMouseEnter={() => setHoveredNode('service_b')}
                onMouseLeave={() => setHoveredNode(null)}
                transform="translate(40, 110)"
              >
                <rect width="170" height="58" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="85" y="24" fill="#ffffff" fontSize="12" fontWeight="700" textAnchor="middle">Billing Service</text>
                <text x="85" y="42" fill="#94a3b8" fontSize="10" textAnchor="middle">Reads State on Demand</text>
              </g>

              <g
                className="dda-node-card"
                onMouseEnter={() => setHoveredNode('batch_worker')}
                onMouseLeave={() => setHoveredNode(null)}
                transform="translate(40, 190)"
              >
                <rect width="170" height="58" rx="6" fill="#1e293b" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="85" y="24" fill="#ffffff" fontSize="12" fontWeight="700" textAnchor="middle">ETL / Batch Poller</text>
                <text x="85" y="42" fill="#fbbf24" fontSize="10" textAnchor="middle">Cron: SELECT * WHERE ts &gt; t</text>
              </g>

              {/* Center Central Database */}
              <g
                className="dda-node-card"
                onMouseEnter={() => setHoveredNode('central_db')}
                onMouseLeave={() => setHoveredNode(null)}
                transform="translate(350, 45)"
              >
                <rect width="190" height="170" rx="8" fill="url(#dbGrad)" stroke="#38bdf8" strokeWidth="2" />
                <ellipse cx="95" cy="24" rx="70" ry="14" fill="#3b82f6" fillOpacity="0.3" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="95" y="28" fill="#ffffff" fontSize="13" fontWeight="800" textAnchor="middle">Central OLTP Database</text>
                <text x="95" y="55" fill="#38bdf8" fontSize="10" textAnchor="middle">PostgreSQL / Oracle / MySQL</text>
                <line x1="20" y1="65" x2="170" y2="65" stroke="#334155" strokeWidth="1" />

                <rect x="25" y="75" width="140" height="22" rx="3" fill="#1e293b" stroke="#475569" />
                <text x="95" y="90" fill="#94a3b8" fontSize="9.5" textAnchor="middle">orders (id, state, total)</text>

                <rect x="25" y="103" width="140" height="22" rx="3" fill="#1e293b" stroke="#475569" />
                <text x="95" y="118" fill="#94a3b8" fontSize="9.5" textAnchor="middle">inventory (sku, quantity)</text>

                <rect x="25" y="131" width="140" height="22" rx="3" fill="#1e293b" stroke="#475569" />
                <text x="95" y="146" fill="#94a3b8" fontSize="9.5" textAnchor="middle">invoices (inv_id, status)</text>
              </g>

              {/* Right Downstream / Consumer Services */}
              <g
                className="dda-node-card"
                onMouseEnter={() => setHoveredNode('analytics_dwh')}
                onMouseLeave={() => setHoveredNode(null)}
                transform="translate(670, 45)"
              >
                <rect width="170" height="65" rx="6" fill="#1e293b" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="85" y="24" fill="#ffffff" fontSize="12" fontWeight="700" textAnchor="middle">Analytics DWH</text>
                <text x="85" y="42" fill="#94a3b8" fontSize="10" textAnchor="middle">Snowflake / BigQuery</text>
                <text x="85" y="56" fill="#a78bfa" fontSize="9" textAnchor="middle">Batch Ingestion (Daily/Hourly)</text>
              </g>

              <g
                className="dda-node-card"
                onMouseEnter={() => setHoveredNode('inventory_svc')}
                onMouseLeave={() => setHoveredNode(null)}
                transform="translate(670, 150)"
              >
                <rect width="170" height="65" rx="6" fill="#1e293b" stroke="#f87171" strokeWidth="1.5" />
                <text x="85" y="24" fill="#ffffff" fontSize="12" fontWeight="700" textAnchor="middle">Fulfillment Service</text>
                <text x="85" y="42" fill="#f87171" fontSize="10" textAnchor="middle">Tight Schema Coupling</text>
                <text x="85" y="56" fill="#94a3b8" fontSize="9" textAnchor="middle">Polls DB table for "NEW"</text>
              </g>

              {/* Paths Client -> DB */}
              <path d="M 210 59 L 340 90" stroke="#38bdf8" strokeWidth="2" fill="none" className="dda-flowing-conduit" markerEnd="url(#marker-blue)" />
              <text x="270" y="65" fill="#38bdf8" fontSize="9" fontWeight="600">INSERT / UPDATE</text>

              <path d="M 210 139 L 340 130" stroke="#38bdf8" strokeWidth="2" fill="none" className="dda-flowing-conduit" markerEnd="url(#marker-blue)" />
              <text x="270" y="125" fill="#38bdf8" fontSize="9" fontWeight="600">SELECT (Sync)</text>

              <path d="M 210 219 L 340 170" stroke="#fbbf24" strokeWidth="2" fill="none" className="dda-flowing-conduit" markerEnd="url(#marker-amber)" />
              <text x="270" y="205" fill="#fbbf24" fontSize="9" fontWeight="600">Periodic Polling</text>

              {/* Paths DB -> Downstream */}
              <path d="M 540 110 L 660 78" stroke="#a78bfa" strokeWidth="1.8" fill="none" strokeDasharray="5 5" markerEnd="url(#marker-blue)" />
              <text x="590" y="85" fill="#a78bfa" fontSize="9" fontWeight="600">Nightly ETL Dump</text>

              <path d="M 540 160 L 660 182" stroke="#f87171" strokeWidth="1.8" fill="none" className="dda-flowing-conduit" markerEnd="url(#marker-red)" />
              <text x="590" y="165" fill="#f87171" fontSize="9" fontWeight="600">Continuous Polling Lock</text>
            </svg>
          </div>

          {/* DDA Architectural Insights Cards */}
          <div className="dda-responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: '#0b0f19', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ color: '#34d399', fontSize: '13px', fontWeight: 700 }}>✅ Strengths of Data-Driven</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', color: '#94a3b8', fontSize: '12px', lineHeight: '1.6' }}>
                <li><strong style={{ color: '#ffffff' }}>Strict ACID Guarantees:</strong> Transactions either commit atomically or roll back. Eliminates phantom states.</li>
                <li><strong style={{ color: '#ffffff' }}>Single Source of Truth:</strong> One database stores canonical reality. No out-of-order reconciliation drift.</li>
                <li><strong style={{ color: '#ffffff' }}>Expressive SQL Joins:</strong> Multi-table queries, analytical aggregations, and ad-hoc slicing are natively supported.</li>
                <li><strong style={{ color: '#ffffff' }}>Low Conceptual Overhead:</strong> Standard request-response mental model; standard ORMs and migrations.</li>
              </ul>
            </div>

            <div style={{ background: '#0b0f19', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ color: '#f87171', fontSize: '13px', fontWeight: 700 }}>⚠️ Production Gotchas & Bottlenecks</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', color: '#94a3b8', fontSize: '12px', lineHeight: '1.6' }}>
                <li><strong style={{ color: '#ffffff' }}>Tight Temporal Coupling:</strong> If the central DB is slow, connection pools (HikariCP) saturate, causing cascading service timeouts.</li>
                <li><strong style={{ color: '#ffffff' }}>Schema Lockstep Coupling:</strong> Modifying a shared table schema risks breaking multiple dependent services simultaneously.</li>
                <li><strong style={{ color: '#ffffff' }}>Polling Inefficiency:</strong> Workers continuously querying `WHERE status = 'PENDING'` burn CPU, IOPS, and table read locks.</li>
                <li><strong style={{ color: '#ffffff' }}>Single-Leader Write Bottleneck:</strong> Scaling writes past a single primary node requires painful sharding or distributed SQL.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Event-Driven Architecture Canvas */}
      {activeMode === 'event_driven' && (
        <div>
          <div style={{ background: '#0d0f1e', borderRadius: '8px', border: '1px solid #1e293b', padding: '12px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#34d399', fontWeight: 700 }}>
                ⚡ Event-Driven Paradigm: Distributed Append-Only Event Log as Integration Backbone
              </span>
              <span style={{ fontSize: '11px', color: '#34d399', background: 'rgba(52, 211, 153, 0.15)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                Real-Time Push & Asynchronous Choreography
              </span>
            </div>

            <svg viewBox="0 0 880 260" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                <marker id="marker-green" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                  <polygon points="0 0, 8 4, 0 8" fill="#34d399" />
                </marker>
                <linearGradient id="brokerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#064e3b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
              </defs>

              <rect width="880" height="260" fill="#0b0f19" rx="8" />

              {/* Producers */}
              <g className="dda-node-card" transform="translate(40, 45)">
                <rect width="170" height="70" rx="6" fill="#1e293b" stroke="#34d399" strokeWidth="1.5" />
                <text x="85" y="24" fill="#ffffff" fontSize="12" fontWeight="700" textAnchor="middle">Order Service</text>
                <text x="85" y="42" fill="#34d399" fontSize="10" textAnchor="middle">Publishes: OrderPlaced</text>
                <text x="85" y="58" fill="#94a3b8" fontSize="9" textAnchor="middle">Sub-millisecond ack (acks=1)</text>
              </g>

              <g className="dda-node-card" transform="translate(40, 145)">
                <rect width="170" height="70" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="85" y="24" fill="#ffffff" fontSize="12" fontWeight="700" textAnchor="middle">Payment Service</text>
                <text x="85" y="42" fill="#38bdf8" fontSize="10" textAnchor="middle">Publishes: PaymentCaptured</text>
                <text x="85" y="58" fill="#94a3b8" fontSize="9" textAnchor="middle">Zero dependency on Orders</text>
              </g>

              {/* Event Broker / Log Backbone */}
              <g className="dda-node-card" transform="translate(330, 35)">
                <rect width="220" height="190" rx="8" fill="url(#brokerGrad)" stroke="#34d399" strokeWidth="2" />
                <text x="110" y="28" fill="#ffffff" fontSize="13" fontWeight="800" textAnchor="middle">Distributed Event Broker</text>
                <text x="110" y="46" fill="#34d399" fontSize="10" textAnchor="middle">Apache Kafka / Redpanda / Pulsar</text>
                <line x1="20" y1="56" x2="200" y2="56" stroke="#047857" strokeWidth="1" />

                {/* Partitions */}
                <g transform="translate(20, 68)">
                  <rect width="180" height="32" rx="4" fill="#0f172a" stroke="#059669" strokeWidth="1" />
                  <text x="10" y="16" fill="#34d399" fontSize="9.5" fontWeight="700">Topic: order.events</text>
                  <text x="10" y="27" fill="#6ee7b7" fontSize="8">Offset: [0][1][2][3] ➔ [NEW]</text>
                </g>

                <g transform="translate(20, 108)">
                  <rect width="180" height="32" rx="4" fill="#0f172a" stroke="#059669" strokeWidth="1" />
                  <text x="10" y="16" fill="#38bdf8" fontSize="9.5" fontWeight="700">Topic: payment.events</text>
                  <text x="10" y="27" fill="#7dd3fc" fontSize="8">Offset: [0][1][2] ➔ [NEW]</text>
                </g>

                <g transform="translate(20, 148)">
                  <rect width="180" height="28" rx="4" fill="#1e293b" />
                  <text x="90" y="18" fill="#94a3b8" fontSize="9" textAnchor="middle">Immutable Append-Only Log</text>
                </g>
              </g>

              {/* Consumers */}
              <g className="dda-node-card" transform="translate(670, 25)">
                <rect width="170" height="55" rx="6" fill="#1e293b" stroke="#34d399" strokeWidth="1.5" />
                <text x="85" y="22" fill="#ffffff" fontSize="11.5" fontWeight="700" textAnchor="middle">Inventory Service</text>
                <text x="85" y="38" fill="#34d399" fontSize="9" textAnchor="middle">Listens: OrderPlaced</text>
                <text x="85" y="50" fill="#94a3b8" fontSize="8.5" textAnchor="middle">Auto-reserves stock</text>
              </g>

              <g className="dda-node-card" transform="translate(670, 95)">
                <rect width="170" height="55" rx="6" fill="#1e293b" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="85" y="22" fill="#ffffff" fontSize="11.5" fontWeight="700" textAnchor="middle">Notification Service</text>
                <text x="85" y="38" fill="#fbbf24" fontSize="9" textAnchor="middle">Listens: PaymentCaptured</text>
                <text x="85" y="50" fill="#94a3b8" fontSize="8.5" textAnchor="middle">Sends SMS / Email Receipt</text>
              </g>

              <g className="dda-node-card" transform="translate(670, 165)">
                <rect width="170" height="55" rx="6" fill="#1e293b" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="85" y="22" fill="#ffffff" fontSize="11.5" fontWeight="700" textAnchor="middle">Fraud ML Pipeline</text>
                <text x="85" y="38" fill="#a78bfa" fontSize="9" textAnchor="middle">Subscribes to all streams</text>
                <text x="85" y="50" fill="#94a3b8" fontSize="8.5" textAnchor="middle">Calculates risk score &lt; 5ms</text>
              </g>

              {/* Streaming Paths */}
              <path d="M 210 80 L 320 100" stroke="#34d399" strokeWidth="2.2" fill="none" className="dda-flowing-fast" markerEnd="url(#marker-green)" />
              <path d="M 210 180 L 320 145" stroke="#38bdf8" strokeWidth="2.2" fill="none" className="dda-flowing-fast" markerEnd="url(#marker-green)" />

              <path d="M 550 90 L 660 52" stroke="#34d399" strokeWidth="2" fill="none" className="dda-flowing-fast" markerEnd="url(#marker-green)" />
              <path d="M 550 125 L 660 122" stroke="#fbbf24" strokeWidth="2" fill="none" className="dda-flowing-fast" markerEnd="url(#marker-green)" />
              <path d="M 550 160 L 660 192" stroke="#a78bfa" strokeWidth="2" fill="none" className="dda-flowing-fast" markerEnd="url(#marker-green)" />
            </svg>
          </div>

          {/* EDA Architectural Insights Cards */}
          <div className="dda-responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: '#0b0f19', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ color: '#34d399', fontSize: '13px', fontWeight: 700 }}>✅ Strengths of Event-Driven</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', color: '#94a3b8', fontSize: '12px', lineHeight: '1.6' }}>
                <li><strong style={{ color: '#ffffff' }}>Temporal Decoupling:</strong> Producers publish events without waiting. If consumers go down, messages buffer safely in the broker log.</li>
                <li><strong style={{ color: '#ffffff' }}>Zero Cascade Failure:</strong> A crash in Notification or Analytics cannot bring down Order ingestion.</li>
                <li><strong style={{ color: '#ffffff' }}>Plug-and-Play Extensibility:</strong> Add new consumers (e.g. Fraud ML) without changing or redeploying upstream producers.</li>
                <li><strong style={{ color: '#ffffff' }}>Massive Append Throughput:</strong> Kafka leverages OS page cache and zero-copy `sendfile()` for millions of msgs/sec.</li>
              </ul>
            </div>

            <div style={{ background: '#0b0f19', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ color: '#f87171', fontSize: '13px', fontWeight: 700 }}>⚠️ Production Complexity & Hazards</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', color: '#94a3b8', fontSize: '12px', lineHeight: '1.6' }}>
                <li><strong style={{ color: '#ffffff' }}>Eventual Consistency:</strong> Consumers see updates with variable lag. User reads right after writes may yield stale state.</li>
                <li><strong style={{ color: '#ffffff' }}>At-Least-Once Delivery:</strong> Network retries cause duplicate events; all consumer handlers MUST be strictly idempotent.</li>
                <li><strong style={{ color: '#ffffff' }}>Out-of-Order Hazards:</strong> Partition rebalancing or network retries can deliver `OrderCancelled` before `OrderCreated`.</li>
                <li><strong style={{ color: '#ffffff' }}>Distributed Tracing Tax:</strong> Correlating asynchronous event chains requires propagating OpenTelemetry trace contexts in headers.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Mode 3: Modern Hybrid Architecture (CDC + Outbox + CQRS) */}
      {activeMode === 'hybrid' && (
        <div>
          <div style={{ background: '#0d0f1e', borderRadius: '8px', border: '1px solid #1e293b', padding: '12px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#a78bfa', fontWeight: 700 }}>
                🔄 Hybrid Convergence: Transactional Outbox + CDC (Debezium) + CQRS Read Projections
              </span>
              <span style={{ fontSize: '11px', color: '#a78bfa', background: 'rgba(167, 139, 250, 0.15)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(167, 139, 250, 0.3)' }}>
                Zero Dual-Write Risk + Best of Both Paradigms
              </span>
            </div>

            <svg viewBox="0 0 880 260" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                <marker id="marker-purple" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                  <polygon points="0 0, 8 4, 0 8" fill="#a78bfa" />
                </marker>
              </defs>

              <rect width="880" height="260" fill="#0b0f19" rx="8" />

              {/* 1. Microservice with Local ACID DB */}
              <g className="dda-node-card" transform="translate(30, 30)">
                <rect width="240" height="200" rx="8" fill="#111827" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="120" y="24" fill="#ffffff" fontSize="12" fontWeight="700" textAnchor="middle">Order Service (Local ACID)</text>
                <text x="120" y="40" fill="#38bdf8" fontSize="10" textAnchor="middle">Single Local Transaction Scope</text>
                <line x1="15" y1="50" x2="225" y2="50" stroke="#334155" />

                {/* Table: orders */}
                <rect x="25" y="60" width="190" height="35" rx="4" fill="#1e293b" stroke="#475569" />
                <text x="35" y="78" fill="#ffffff" fontSize="10" fontWeight="600">Table: orders</text>
                <text x="35" y="90" fill="#94a3b8" fontSize="8.5">INSERT INTO orders (id, total, status)</text>

                {/* Table: outbox */}
                <rect x="25" y="105" width="190" height="38" rx="4" fill="#1e293b" stroke="#38bdf8" />
                <text x="35" y="122" fill="#38bdf8" fontSize="10" fontWeight="700">Table: outbox_events</text>
                <text x="35" y="136" fill="#94a3b8" fontSize="8.5">INSERT INTO outbox (payload, key)</text>

                {/* Local DB WAL */}
                <rect x="25" y="152" width="190" height="30" rx="4" fill="#0f172a" stroke="#60a5fa" />
                <text x="120" y="171" fill="#60a5fa" fontSize="9.5" fontWeight="700" textAnchor="middle">PostgreSQL Write-Ahead Log (WAL)</text>
              </g>

              {/* 2. CDC Engine (Debezium) */}
              <g className="dda-node-card" transform="translate(310, 75)">
                <rect width="130" height="110" rx="8" fill="#1e1b4b" stroke="#a78bfa" strokeWidth="2" />
                <text x="65" y="26" fill="#ffffff" fontSize="12" fontWeight="800" textAnchor="middle">Debezium CDC</text>
                <text x="65" y="44" fill="#a78bfa" fontSize="9.5" textAnchor="middle">Kafka Connect</text>
                <line x1="15" y1="54" x2="115" y2="54" stroke="#4338ca" />
                <text x="65" y="72" fill="#cbd5e1" fontSize="9" textAnchor="middle">Tails WAL Stream</text>
                <text x="65" y="88" fill="#34d399" fontSize="8.5" textAnchor="middle">Zero App Overhead</text>
                <text x="65" y="102" fill="#f87171" fontSize="8" textAnchor="middle">No Dual-Write Danger</text>
              </g>

              {/* 3. Kafka Broker */}
              <g className="dda-node-card" transform="translate(480, 50)">
                <rect width="140" height="160" rx="8" fill="#064e3b" stroke="#34d399" strokeWidth="1.5" />
                <text x="70" y="26" fill="#ffffff" fontSize="12" fontWeight="800" textAnchor="middle">Kafka Stream</text>
                <text x="70" y="44" fill="#34d399" fontSize="9.5" textAnchor="middle">orders.v1</text>
                <line x1="15" y1="54" x2="125" y2="54" stroke="#047857" />

                <rect x="15" y="65" width="110" height="24" rx="3" fill="#022c22" stroke="#059669" />
                <text x="70" y="81" fill="#a7f3d0" fontSize="9" textAnchor="middle">Partition 0</text>

                <rect x="15" y="95" width="110" height="24" rx="3" fill="#022c22" stroke="#059669" />
                <text x="70" y="111" fill="#a7f3d0" fontSize="9" textAnchor="middle">Partition 1</text>

                <text x="70" y="145" fill="#6ee7b7" fontSize="8.5" textAnchor="middle">Guaranteed Order by Key</text>
              </g>

              {/* 4. CQRS Read Projections & Downstream */}
              <g className="dda-node-card" transform="translate(660, 30)">
                <rect width="190" height="60" rx="6" fill="#1e293b" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="95" y="22" fill="#ffffff" fontSize="11" fontWeight="700" textAnchor="middle">Elasticsearch / OpenSearch</text>
                <text x="95" y="38" fill="#fbbf24" fontSize="9" textAnchor="middle">CQRS Full-Text Read Model</text>
                <text x="95" y="50" fill="#94a3b8" fontSize="8" textAnchor="middle">Sub-10ms search queries</text>
              </g>

              <g className="dda-node-card" transform="translate(660, 100)">
                <rect width="190" height="60" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="95" y="22" fill="#ffffff" fontSize="11" fontWeight="700" textAnchor="middle">Redis Cache Invalidation</text>
                <text x="95" y="38" fill="#38bdf8" fontSize="9" textAnchor="middle">Real-time cache updater</text>
                <text x="95" y="50" fill="#94a3b8" fontSize="8" textAnchor="middle">Evicts stale user orders</text>
              </g>

              <g className="dda-node-card" transform="translate(660, 170)">
                <rect width="190" height="60" rx="6" fill="#1e293b" stroke="#34d399" strokeWidth="1.5" />
                <text x="95" y="22" fill="#ffffff" fontSize="11" fontWeight="700" textAnchor="middle">ClickHouse / Iceberg Lakehouse</text>
                <text x="95" y="38" fill="#34d399" fontSize="9" textAnchor="middle">Streaming Analytical OLAP</text>
                <text x="95" y="50" fill="#94a3b8" fontSize="8" textAnchor="middle">Real-time revenue metrics</text>
              </g>

              {/* Paths */}
              <path d="M 270 168 L 310 130" stroke="#a78bfa" strokeWidth="2" fill="none" className="dda-flowing-fast" markerEnd="url(#marker-purple)" />
              <path d="M 440 130 L 480 130" stroke="#34d399" strokeWidth="2.2" fill="none" className="dda-flowing-fast" markerEnd="url(#marker-purple)" />
              <path d="M 620 90 L 660 60" stroke="#fbbf24" strokeWidth="1.8" fill="none" className="dda-flowing-fast" markerEnd="url(#marker-purple)" />
              <path d="M 620 130 L 660 130" stroke="#38bdf8" strokeWidth="1.8" fill="none" className="dda-flowing-fast" markerEnd="url(#marker-purple)" />
              <path d="M 620 170 L 660 200" stroke="#34d399" strokeWidth="1.8" fill="none" className="dda-flowing-fast" markerEnd="url(#marker-purple)" />
            </svg>
          </div>

          <div style={{ background: '#0b0f19', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
            <div style={{ color: '#a78bfa', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              💡 Why Senior Architects Choose the Hybrid Pattern (SitePoint Principle Applied)
            </div>
            <p style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.6', margin: 0 }}>
              Neither Data-Driven nor Event-Driven architecture is universally superior in isolation. At scale, treating them as exclusive opposites is an anti-pattern.
              The <strong style={{ color: '#ffffff' }}>Transactional Outbox with Change Data Capture</strong> provides a mathematically safe bridge: applications write to their local relational database under full ACID guarantees (Data-Driven transactional integrity), and Debezium extracts those mutations directly from the database's Write-Ahead Log into Apache Kafka (Event-Driven decoupled dissemination). Downstream consumer systems project these streams into read-optimized datastores (Elasticsearch, Redis, ClickHouse) without burdening the primary transactional engine.
            </p>
          </div>
        </div>
      )}

      {/* Mode 4: Decision Matrix & Interactive Evaluator */}
      {activeMode === 'decision_matrix' && (
        <div>
          {/* Scenario Selector */}
          <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {Object.keys(SCENARIOS).map(key => {
              const sc = SCENARIOS[key];
              const isSelected = selectedScenarioKey === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedScenarioKey(key)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${isSelected ? sc.accentColor : '#334155'}`,
                    background: isSelected ? `${sc.accentColor}25` : '#0f172a',
                    color: isSelected ? sc.accentColor : '#cbd5e1',
                    fontSize: '12px',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {sc.title}
                </button>
              );
            })}
          </div>

          {/* Scenario Evaluation Card */}
          <div
            style={{
              background: '#0d0f1e',
              border: `1px solid ${scenario.accentColor}50`,
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
                {scenario.title}
              </span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: scenario.accentColor,
                  background: `${scenario.accentColor}20`,
                  padding: '3px 10px',
                  borderRadius: '20px',
                  border: `1px solid ${scenario.accentColor}60`
                }}
              >
                Recommended: {scenario.recommended}
              </span>
            </div>

            <p style={{ color: '#e2e8f0', fontSize: '12.5px', lineHeight: '1.6', margin: '0 0 12px 0' }}>
              <strong style={{ color: scenario.accentColor }}>Architectural Rationale: </strong>
              {scenario.reason}
            </p>

            <div className="dda-responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px' }}>
              <div style={{ background: '#0b0f19', padding: '10px', borderRadius: '6px', border: '1px solid #1e293b' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>⏱️ Latency Profile</div>
                <div style={{ fontSize: '11.5px', color: '#ffffff', fontWeight: 600 }}>{scenario.latencyProfile}</div>
              </div>
              <div style={{ background: '#0b0f19', padding: '10px', borderRadius: '6px', border: '1px solid #1e293b' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>🔒 Consistency Target</div>
                <div style={{ fontSize: '11.5px', color: '#ffffff', fontWeight: 600 }}>{scenario.consistencyTarget}</div>
              </div>
              <div style={{ background: '#0b0f19', padding: '10px', borderRadius: '6px', border: '1px solid #1e293b' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>🛠️ Complexity Tax</div>
                <div style={{ fontSize: '11.5px', color: '#ffffff', fontWeight: 600 }}>{scenario.complexityTax}</div>
              </div>
            </div>

            <div style={{ background: '#450a0a25', border: '1px solid #ef444450', borderRadius: '6px', padding: '10px' }}>
              <span style={{ color: '#f87171', fontSize: '12px', fontWeight: 700 }}>⚠️ Critical Anti-Pattern: </span>
              <span style={{ color: '#fca5a5', fontSize: '11.5px' }}>{scenario.antiPatternWarning}</span>
            </div>
          </div>

          {/* Full Comparative Matrix Table */}
          <div style={{ overflowX: 'auto', background: '#0b0f19', borderRadius: '8px', border: '1px solid #1e293b', padding: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: '#e2e8f0' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155', textAlign: 'left' }}>
                  <th style={{ padding: '8px', color: '#94a3b8' }}>Dimension</th>
                  <th style={{ padding: '8px', color: '#38bdf8' }}>💾 Data-Driven Architecture</th>
                  <th style={{ padding: '8px', color: '#34d399' }}>⚡ Event-Driven Architecture</th>
                  <th style={{ padding: '8px', color: '#a78bfa' }}>🔄 Modern Hybrid (CDC/Outbox)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '8px', fontWeight: 700, color: '#ffffff' }}>Primary Driver</td>
                  <td style={{ padding: '8px' }}>Central database state &amp; SQL queries</td>
                  <td style={{ padding: '8px' }}>Immutable event stream of business facts</td>
                  <td style={{ padding: '8px' }}>Local ACID state tailing to event stream</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '8px', fontWeight: 700, color: '#ffffff' }}>Trigger Mechanism</td>
                  <td style={{ padding: '8px' }}>Request/Response or Scheduled Cron Polling</td>
                  <td style={{ padding: '8px' }}>Real-time push pub/sub consumer triggers</td>
                  <td style={{ padding: '8px' }}>Push via DB log tailer + Pub/Sub</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '8px', fontWeight: 700, color: '#ffffff' }}>Temporal Coupling</td>
                  <td style={{ padding: '8px', color: '#f87171' }}>Tight: Caller waits for DB or service</td>
                  <td style={{ padding: '8px', color: '#34d399' }}>Loose: Producer returns after broker ack</td>
                  <td style={{ padding: '8px', color: '#34d399' }}>Loose for inter-service communication</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '8px', fontWeight: 700, color: '#ffffff' }}>Consistency Model</td>
                  <td style={{ padding: '8px' }}>Immediate ACID transactions</td>
                  <td style={{ padding: '8px' }}>Eventual Consistency (BASE) + Sagas</td>
                  <td style={{ padding: '8px' }}>Local ACID + Global Eventual Consistency</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '8px', fontWeight: 700, color: '#ffffff' }}>Ad-Hoc Querying</td>
                  <td style={{ padding: '8px', color: '#34d399' }}>Native: standard SQL joins &amp; grouping</td>
                  <td style={{ padding: '8px', color: '#f87171' }}>Difficult without state-stores/tables</td>
                  <td style={{ padding: '8px', color: '#34d399' }}>Optimized: CQRS views (Elastic/OLAP)</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 700, color: '#ffffff' }}>Operational Tax</td>
                  <td style={{ padding: '8px' }}>Low: DB admin, schema migration tools</td>
                  <td style={{ padding: '8px', color: '#fbbf24' }}>High: brokers, lag monitors, DLQ, replay</td>
                  <td style={{ padding: '8px', color: '#fbbf24' }}>High: Kafka Connect, schema registry</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: '10px' }}>
        <span style={{ fontSize: '11px', color: '#64748b' }}>
          SitePoint Architecture Comparison Reference &bull; Senior Engineering System Design
        </span>
        <span style={{ fontSize: '11px', color: '#38bdf8' }}>
          Status: Operational Canvas Active
        </span>
      </div>
    </div>
  );
}
