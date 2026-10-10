import React, { useState } from 'react';

type CourseModuleId = 'scaling_spof' | 'databases' | 'load_balancing' | 'api_protocols' | 'security_caching';

interface DatabaseSpec {
  name: string;
  category: 'SQL' | 'NoSQL Document' | 'NoSQL Key-Value' | 'Graph';
  color: string;
  dataModel: string;
  bestUseCases: string;
  weakness: string;
  scalingModel: string;
}

const DATABASE_CATALOG: Record<string, DatabaseSpec> = {
  postgres: {
    name: 'PostgreSQL / MySQL',
    category: 'SQL',
    color: '#38bdf8',
    dataModel: 'Relational Tables, B+Tree Indexes, Foreign Keys, Schema-on-Write',
    bestUseCases: 'Financial transactions, double-entry ledgers, complex multi-table joins, strict ACID invariants.',
    weakness: 'Horizontal write sharding is complex; schema migrations can lock large tables under high load.',
    scalingModel: 'Vertical scaling compute + Horizontal Read Replicas (80/20 read/write rule).'
  },
  mongodb: {
    name: 'MongoDB / DynamoDB',
    category: 'NoSQL Document',
    color: '#34d399',
    dataModel: 'BSON / JSON Nested Documents, Schema-on-Read, Partition Keys',
    bestUseCases: 'E-commerce product catalogs with polymorphic attributes, user profiles, rapidly evolving schemas.',
    weakness: 'Multi-document atomic joins are expensive; eventual consistency requires conflict reconciliation.',
    scalingModel: 'Native horizontal sharding across partition keys and replica sets.'
  },
  redis: {
    name: 'Redis / Memcached',
    category: 'NoSQL Key-Value',
    color: '#fbbf24',
    dataModel: 'In-Memory Key-Value with Rich Data Structures (Strings, Hashes, Sorted Sets, Bitmaps)',
    bestUseCases: 'Session storage, token blacklists, high-throughput leaderboards, cache-aside read buffers.',
    weakness: 'Constrained by RAM cost; persistence to disk (RDB/AOF) introduces latency trade-offs.',
    scalingModel: 'Redis Cluster with 16,384 hash slots, in-memory replication, and Sentinel failover.'
  },
  neo4j: {
    name: 'Neo4j / Amazon Neptune',
    category: 'Graph',
    color: '#a78bfa',
    dataModel: 'Nodes, Directed Edges, Properties, Index-Free Adjacency (pointer-based traversal)',
    bestUseCases: 'Social relationship graphs (friends-of-friends), fraud ring detection, knowledge graphs, recommendation paths.',
    weakness: 'Inefficient for bulk tabular sequential scans or high-volume write aggregations.',
    scalingModel: 'Read scaling via distributed cluster; graph partitioning across multiple machines remains an NP-hard challenge.'
  }
};

export default function SystemDesignCourseFullDiagram(): React.JSX.Element {
  const [activeModule, setActiveModule] = useState<CourseModuleId>('scaling_spof');
  const [selectedDbKey, setSelectedDbKey] = useState<string>('postgres');
  const [lbAlgorithm, setLbAlgorithm] = useState<'round_robin' | 'least_conn' | 'consistent_hash'>('round_robin');
  const [activeServerCount, setActiveServerCount] = useState<number>(3);
  const [healthStatus, setHealthStatus] = useState<Record<number, boolean>>({ 1: true, 2: true, 3: true });

  const selectedDb = DATABASE_CATALOG[selectedDbKey];

  const toggleServerHealth = (serverId: number) => {
    setHealthStatus(prev => ({
      ...prev,
      [serverId]: !prev[serverId]
    }));
  };

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
        @keyframes sdcPulse {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }
        .sdc-flowing-conduit {
          stroke-dasharray: 6 6;
          animation: sdcPulse 1.2s linear infinite;
        }
        .sdc-flowing-fast {
          stroke-dasharray: 4 4;
          animation: sdcPulse 0.7s linear infinite;
        }
        .sdc-card-btn {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .sdc-card-btn:hover {
          filter: brightness(1.2);
        }
        @media (max-width: 768px) {
          .sdc-responsive-grid {
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
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '15px', letterSpacing: '0.02em' }}>
            System Design Master Course Visualizer (Hayk Simonyan Curriculum)
          </span>
        </div>

        {/* Course Module Navigation Tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'scaling_spof', label: '1. Scaling & SPOF', color: '#38bdf8' },
            { id: 'databases', label: '2. SQL, NoSQL & Graph', color: '#34d399' },
            { id: 'load_balancing', label: '3. Load Balancing & Health', color: '#fbbf24' },
            { id: 'api_protocols', label: '4. APIs & Transport (TCP/UDP)', color: '#a78bfa' },
            { id: 'security_caching', label: '5. Security & Caching', color: '#f87171' }
          ].map(mod => (
            <button
              key={mod.id}
              onClick={() => setActiveModule(mod.id as CourseModuleId)}
              className="sdc-card-btn"
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: `1px solid ${activeModule === mod.id ? mod.color : '#334155'}`,
                background: activeModule === mod.id ? `${mod.color}25` : '#0f172a',
                color: activeModule === mod.id ? mod.color : '#94a3b8',
                fontWeight: activeModule === mod.id ? 700 : 500,
                fontSize: '11.5px',
                cursor: 'pointer'
              }}
            >
              {mod.label}
            </button>
          ))}
        </div>
      </div>

      {/* Module 1: Scaling & Single Point of Failure (SPOF) */}
      {activeModule === 'scaling_spof' && (
        <div>
          <div style={{ background: '#0d0f1e', borderRadius: '8px', border: '1px solid #1e293b', padding: '12px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 700 }}>
                🖥️ Module 1: Single Server Hardware Bottlenecks ➔ Decoupled High Availability
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8', background: '#1e293b', padding: '2px 8px', borderRadius: '4px' }}>
                Vertical vs Horizontal Scaling Architecture
              </span>
            </div>

            <svg viewBox="0 0 880 250" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                <marker id="sdc-blue-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                  <polygon points="0 0, 8 4, 0 8" fill="#38bdf8" />
                </marker>
                <marker id="sdc-green-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                  <polygon points="0 0, 8 4, 0 8" fill="#34d399" />
                </marker>
                <marker id="sdc-red-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                  <polygon points="0 0, 8 4, 0 8" fill="#f87171" />
                </marker>
              </defs>

              <rect width="880" height="250" fill="#0b0f19" rx="8" />

              {/* Single Server Setup (Left Pane) */}
              <g transform="translate(30, 25)">
                <rect width="360" height="200" rx="6" fill="#0f172a" stroke="#f87171" strokeWidth="1.5" strokeDasharray="4 4" />
                <text x="180" y="24" fill="#f87171" fontSize="12" fontWeight="700" textAnchor="middle">⚠️ Initial Stage: Single Server (Total SPOF)</text>
                <text x="180" y="40" fill="#94a3b8" fontSize="10" textAnchor="middle">All tiers co-located on 1 virtual machine</text>

                <rect x="25" y="55" width="310" height="35" rx="4" fill="#1e293b" stroke="#64748b" />
                <text x="180" y="74" fill="#ffffff" fontSize="11" fontWeight="600" textAnchor="middle">Web Application Server (Node / Spring / Go)</text>
                <text x="180" y="86" fill="#f87171" fontSize="8.5" textAnchor="middle">Competes for CPU threads &amp; OS memory</text>

                <rect x="25" y="100" width="310" height="35" rx="4" fill="#1e293b" stroke="#64748b" />
                <text x="180" y="119" fill="#ffffff" fontSize="11" fontWeight="600" textAnchor="middle">Database Engine (PostgreSQL / MySQL)</text>
                <text x="180" y="131" fill="#f87171" fontSize="8.5" textAnchor="middle">Disk I/O saturation triggers connection timeouts</text>

                <rect x="25" y="145" width="310" height="35" rx="4" fill="#1e293b" stroke="#64748b" />
                <text x="180" y="164" fill="#ffffff" fontSize="11" fontWeight="600" textAnchor="middle">In-Memory Cache (Redis Local)</text>
                <text x="180" y="176" fill="#f87171" fontSize="8.5" textAnchor="middle">Server reboot loses entire ephemeral cache state</text>
              </g>

              {/* Evolution Arrow */}
              <g transform="translate(415, 110)">
                <path d="M 0 15 L 45 15" stroke="#38bdf8" strokeWidth="3" markerEnd="url(#sdc-blue-arrow)" />
                <text x="22" y="5" fill="#38bdf8" fontSize="10" fontWeight="700" textAnchor="middle">Scale Out</text>
              </g>

              {/* Scaled Decoupled Setup (Right Pane) */}
              <g transform="translate(485, 25)">
                <rect width="365" height="200" rx="6" fill="#0f172a" stroke="#34d399" strokeWidth="1.5" />
                <text x="182" y="24" fill="#34d399" fontSize="12" fontWeight="700" textAnchor="middle">✅ Production Stage: Decoupled Multi-Tier Fleet</text>
                <text x="182" y="40" fill="#94a3b8" fontSize="10" textAnchor="middle">Stateless compute + managed state tiers</text>

                {/* LB */}
                <rect x="25" y="55" width="90" height="60" rx="4" fill="#1e293b" stroke="#fbbf24" />
                <text x="70" y="80" fill="#fbbf24" fontSize="10" fontWeight="700" textAnchor="middle">Load</text>
                <text x="70" y="95" fill="#fbbf24" fontSize="10" fontWeight="700" textAnchor="middle">Balancer</text>

                {/* App Fleet */}
                <g transform="translate(135, 55)">
                  <rect width="95" height="26" rx="3" fill="#1e293b" stroke="#38bdf8" />
                  <text x="47" y="17" fill="#ffffff" fontSize="9.5" textAnchor="middle">App Pod 1</text>
                  <rect y="32" width="95" height="26" rx="3" fill="#1e293b" stroke="#38bdf8" />
                  <text x="47" y="49" fill="#ffffff" fontSize="9.5" textAnchor="middle">App Pod 2</text>
                  <rect y="64" width="95" height="26" rx="3" fill="#1e293b" stroke="#38bdf8" />
                  <text x="47" y="81" fill="#ffffff" fontSize="9.5" textAnchor="middle">App Pod 3</text>
                </g>

                {/* Database & Cache */}
                <g transform="translate(250, 55)">
                  <rect width="90" height="42" rx="3" fill="#1e293b" stroke="#a78bfa" />
                  <text x="45" y="20" fill="#a78bfa" fontSize="9" fontWeight="700" textAnchor="middle">Redis Cluster</text>
                  <text x="45" y="34" fill="#94a3b8" fontSize="8" textAnchor="middle">Shared Sessions</text>

                  <rect y="48" width="90" height="42" rx="3" fill="#1e293b" stroke="#34d399" />
                  <text x="45" y="68" fill="#34d399" fontSize="9" fontWeight="700" textAnchor="middle">Primary DB</text>
                  <text x="45" y="82" fill="#94a3b8" fontSize="8" textAnchor="middle">+ Read Replicas</text>
                </g>

                {/* Conduits */}
                <path d="M 115 85 L 135 68" stroke="#fbbf24" strokeWidth="1.5" className="sdc-flowing-conduit" />
                <path d="M 115 85 L 135 85" stroke="#fbbf24" strokeWidth="1.5" className="sdc-flowing-conduit" />
                <path d="M 115 85 L 135 102" stroke="#fbbf24" strokeWidth="1.5" className="sdc-flowing-conduit" />

                <path d="M 230 75 L 250 75" stroke="#34d399" strokeWidth="1.5" className="sdc-flowing-conduit" />
              </g>
            </svg>
          </div>

          <div className="sdc-responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: '#0b0f19', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
              <div style={{ color: '#38bdf8', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                📏 Vertical Scaling (Scale Up) Limits
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', color: '#94a3b8', fontSize: '12px', lineHeight: '1.6' }}>
                <li><strong style={{ color: '#ffffff' }}>Hard Physical Ceiling:</strong> Even top cloud instances (e.g. AWS `u-24tb1.metal` with 24TB RAM) reach hard CPU socket and PCIe limits.</li>
                <li><strong style={{ color: '#ffffff' }}>Non-Linear Cost Explosion:</strong> Scaling from 64 cores to 128 cores costs exponentially more per computational unit.</li>
                <li><strong style={{ color: '#ffffff' }}>Mandatory Downtime:</strong> Resizing hardware requires stopping the instance, creating guaranteed service interruption.</li>
              </ul>
            </div>

            <div style={{ background: '#0b0f19', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
              <div style={{ color: '#34d399', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                🚀 Horizontal Scaling (Scale Out) Rules
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', color: '#94a3b8', fontSize: '12px', lineHeight: '1.6' }}>
                <li><strong style={{ color: '#ffffff' }}>Mandatory Stateless Compute:</strong> App instances must never store user session state on local disk or local memory.</li>
                <li><strong style={{ color: '#ffffff' }}>Load Balancer Fronting:</strong> Incoming client requests must be distributed dynamically via Layer 4/7 proxies.</li>
                <li><strong style={{ color: '#ffffff' }}>Elastic Auto-Scaling:</strong> Add or remove commodity instances based on CPU, p99 latency, or queue depth.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Module 2: Databases (SQL, NoSQL, Graph) */}
      {activeModule === 'databases' && (
        <div>
          {/* DB Selector Pills */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {Object.keys(DATABASE_CATALOG).map(key => {
              const db = DATABASE_CATALOG[key];
              const isSelected = selectedDbKey === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDbKey(key)}
                  className="sdc-card-btn"
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: `1px solid ${isSelected ? db.color : '#334155'}`,
                    background: isSelected ? `${db.color}25` : '#0f172a',
                    color: isSelected ? db.color : '#cbd5e1',
                    fontSize: '12px',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer'
                  }}
                >
                  {db.name} ({db.category})
                </button>
              );
            })}
          </div>

          {/* Selected DB Detail Card */}
          <div style={{ background: '#0d0f1e', border: `1px solid ${selectedDb.color}50`, borderRadius: '8px', padding: '14px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
                {selectedDb.name}
              </span>
              <span style={{ fontSize: '11px', color: selectedDb.color, background: `${selectedDb.color}20`, padding: '2px 8px', borderRadius: '4px', border: `1px solid ${selectedDb.color}40`, fontWeight: 700 }}>
                {selectedDb.category}
              </span>
            </div>

            <div className="sdc-responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '12px' }}>
              <div style={{ background: '#0b0f19', padding: '10px', borderRadius: '6px', border: '1px solid #1e293b' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>📐 Underlying Data Structure</div>
                <div style={{ fontSize: '12px', color: '#ffffff', fontWeight: 600 }}>{selectedDb.dataModel}</div>
              </div>
              <div style={{ background: '#0b0f19', padding: '10px', borderRadius: '6px', border: '1px solid #1e293b' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>📈 Horizontal Scaling Model</div>
                <div style={{ fontSize: '12px', color: '#ffffff', fontWeight: 600 }}>{selectedDb.scalingModel}</div>
              </div>
            </div>

            <div style={{ background: '#0b0f19', padding: '10px', borderRadius: '6px', border: '1px solid #1e293b', marginBottom: '8px' }}>
              <span style={{ color: '#34d399', fontSize: '12px', fontWeight: 700 }}>🎯 Best Production Fit: </span>
              <span style={{ color: '#e2e8f0', fontSize: '12px' }}>{selectedDb.bestUseCases}</span>
            </div>

            <div style={{ background: '#0b0f19', padding: '10px', borderRadius: '6px', border: '1px solid #1e293b' }}>
              <span style={{ color: '#f87171', fontSize: '12px', fontWeight: 700 }}>⚠️ Critical Trade-Off: </span>
              <span style={{ color: '#e2e8f0', fontSize: '12px' }}>{selectedDb.weakness}</span>
            </div>
          </div>
        </div>
      )}

      {/* Module 3: Load Balancing & Health Checks */}
      {activeModule === 'load_balancing' && (
        <div>
          <div style={{ background: '#0d0f1e', borderRadius: '8px', border: '1px solid #1e293b', padding: '12px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: '#fbbf24', fontWeight: 700 }}>
                ⚖️ Load Balancer Simulator (Toggle Server Health to Test Failover)
              </span>

              {/* Algorithm Switcher */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['round_robin', 'least_conn', 'consistent_hash'] as const).map(alg => (
                  <button
                    key={alg}
                    onClick={() => setLbAlgorithm(alg)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: `1px solid ${lbAlgorithm === alg ? '#fbbf24' : '#334155'}`,
                      background: lbAlgorithm === alg ? '#fbbf2425' : '#0f172a',
                      color: lbAlgorithm === alg ? '#fbbf24' : '#94a3b8',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    {alg === 'round_robin' ? 'Round Robin' : alg === 'least_conn' ? 'Least Connections' : 'Consistent Hash'}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Server Fleet Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '10px' }}>
              {[1, 2, 3].map(id => {
                const isHealthy = healthStatus[id];
                return (
                  <div
                    key={id}
                    onClick={() => toggleServerHealth(id)}
                    style={{
                      background: isHealthy ? '#064e3b20' : '#450a0a25',
                      border: `1px solid ${isHealthy ? '#10b981' : '#ef4444'}`,
                      borderRadius: '6px',
                      padding: '12px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Server #{id}</div>
                    <div style={{ fontSize: '11px', color: isHealthy ? '#34d399' : '#f87171', fontWeight: 700, marginTop: '4px' }}>
                      {isHealthy ? '● ONLINE (200 OK)' : '✖ DEAD (503 Service Unavailable)'}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px' }}>
                      Click to {isHealthy ? 'Crash' : 'Revive'}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '12px', fontSize: '11.5px', color: '#cbd5e1', background: '#0b0f19', padding: '10px', borderRadius: '6px', border: '1px solid #1e293b' }}>
              <strong style={{ color: '#fbbf24' }}>Active Health Probe: </strong>
              The Load Balancer polls <code style={{ color: '#38bdf8' }}>GET /health/live</code> every 5 seconds. When Server fails 2 consecutive checks, it is evicted from upstream target group in &lt; 10s with zero traffic dropped.
            </div>
          </div>

          <div className="sdc-responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: '#0b0f19', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
              <div style={{ color: '#38bdf8', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                🌐 Layer 4 vs Layer 7 Load Balancing
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', color: '#94a3b8', fontSize: '12px', lineHeight: '1.6' }}>
                <li><strong style={{ color: '#ffffff' }}>Layer 4 (Transport / NLB):</strong> Operates on IP and TCP/UDP ports. Does not decrypt packet payloads. Sub-millisecond ultra-fast routing, capable of millions of RPS.</li>
                <li><strong style={{ color: '#ffffff' }}>Layer 7 (Application / ALB):</strong> Parses HTTP headers, cookies, URL paths, and JSON bodies. Enables intelligent routing (e.g. `/api/v1/orders` vs `/static/images`), SSL termination, and rate limiting.</li>
              </ul>
            </div>

            <div style={{ background: '#0b0f19', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
              <div style={{ color: '#fbbf24', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                🎯 Health Check Strategy (Liveness vs Readiness)
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', color: '#94a3b8', fontSize: '12px', lineHeight: '1.6' }}>
                <li><strong style={{ color: '#ffffff' }}>Liveness Probe (`/healthz`):</strong> Detects deadlocks or hung JVM threads. If this fails, the container is restarted immediately.</li>
                <li><strong style={{ color: '#ffffff' }}>Readiness Probe (`/readyz`):</strong> Detects if warming cache, DB connection pool, or heavy initialization is ready. If failing, traffic stops, but container stays alive.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Module 4: API Protocols & Transport Layer */}
      {activeModule === 'api_protocols' && (
        <div>
          <div style={{ background: '#0d0f1e', borderRadius: '8px', border: '1px solid #1e293b', padding: '12px', marginBottom: '12px' }}>
            <div style={{ color: '#a78bfa', fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>
              🔌 Modern API Paradigm &amp; Transport Layer Comparison
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: '#e2e8f0' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155', textAlign: 'left' }}>
                    <th style={{ padding: '8px', color: '#94a3b8' }}>Protocol</th>
                    <th style={{ padding: '8px', color: '#38bdf8' }}>Transport</th>
                    <th style={{ padding: '8px', color: '#34d399' }}>Payload Format</th>
                    <th style={{ padding: '8px', color: '#fbbf24' }}>Over/Under Fetching</th>
                    <th style={{ padding: '8px', color: '#f87171' }}>Best Production Use Case</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '8px', fontWeight: 700, color: '#ffffff' }}>RESTful APIs</td>
                    <td style={{ padding: '8px' }}>HTTP/1.1 or HTTP/2 (TCP)</td>
                    <td style={{ padding: '8px' }}>JSON / XML (Textual)</td>
                    <td style={{ padding: '8px', color: '#f87171' }}>Prone to both (fixed DTOs)</td>
                    <td style={{ padding: '8px' }}>Public web/mobile APIs, CRUD systems</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '8px', fontWeight: 700, color: '#ffffff' }}>GraphQL</td>
                    <td style={{ padding: '8px' }}>HTTP POST (TCP)</td>
                    <td style={{ padding: '8px' }}>JSON Query/Mutation</td>
                    <td style={{ padding: '8px', color: '#34d399' }}>Eliminated (Client specifies fields)</td>
                    <td style={{ padding: '8px' }}>Complex multi-screen mobile dashboards, BFF</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '8px', fontWeight: 700, color: '#ffffff' }}>gRPC / RPC</td>
                    <td style={{ padding: '8px' }}>HTTP/2 Multiplexed (TCP)</td>
                    <td style={{ padding: '8px', color: '#34d399' }}>Protocol Buffers (Binary)</td>
                    <td style={{ padding: '8px' }}>Strict Schema Contracts</td>
                    <td style={{ padding: '8px', color: '#34d399' }}>Internal high-speed microservices, streaming</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', fontWeight: 700, color: '#ffffff' }}>QUIC / HTTP/3</td>
                    <td style={{ padding: '8px', color: '#fbbf24' }}>UDP (Zero HoL Blocking)</td>
                    <td style={{ padding: '8px' }}>Binary Frame Streams</td>
                    <td style={{ padding: '8px' }}>0-RTT Handshake</td>
                    <td style={{ padding: '8px' }}>Mobile roaming (LTE to Wi-Fi), CDN delivery</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Module 5: Security, Auth & Production Caching Stack */}
      {activeModule === 'security_caching' && (
        <div>
          <div style={{ background: '#0d0f1e', borderRadius: '8px', border: '1px solid #1e293b', padding: '12px', marginBottom: '12px' }}>
            <div style={{ color: '#f87171', fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>
              🛡️ Defense-in-Depth Caching &amp; Security Layer Topology
            </div>

            <svg viewBox="0 0 880 180" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <rect width="880" height="180" fill="#0b0f19" rx="8" />

              {/* 5 Layer Pipeline */}
              {[
                { x: 30, title: '1. CDN Edge PoP', sub: 'CloudFront / Cloudflare', desc: 'Caches static assets, DDoS WAF', color: '#38bdf8' },
                { x: 200, title: '2. API Gateway', sub: 'Envoy / Kong', desc: 'Rate limiting, JWT verification', color: '#fbbf24' },
                { x: 370, title: '3. App In-Memory', sub: 'Caffeine L1 Cache', desc: 'Sub-microsecond hot reads', color: '#34d399' },
                { x: 540, title: '4. Redis Cluster', sub: 'Distributed L2 Cache', desc: 'Cache-Aside session buffer', color: '#a78bfa' },
                { x: 710, title: '5. Database Engine', sub: 'PostgreSQL Primary', desc: 'Source of Truth (<10% load)', color: '#f87171' }
              ].map((step, idx) => (
                <g key={idx} transform={`translate(${step.x}, 30)`}>
                  <rect width="140" height="120" rx="6" fill="#1e293b" stroke={step.color} strokeWidth="1.5" />
                  <text x="70" y="24" fill={step.color} fontSize="11" fontWeight="700" textAnchor="middle">{step.title}</text>
                  <text x="70" y="44" fill="#ffffff" fontSize="9.5" fontWeight="600" textAnchor="middle">{step.sub}</text>
                  <line x1="15" y1="54" x2="125" y2="54" stroke="#334155" />
                  <text x="70" y="75" fill="#94a3b8" fontSize="8.5" textAnchor="middle">{step.desc}</text>
                  <text x="70" y="95" fill="#64748b" fontSize="8" textAnchor="middle">Latency: {idx === 0 ? '15ms' : idx === 1 ? '3ms' : idx === 2 ? '0.1ms' : idx === 3 ? '2ms' : '25ms'}</text>
                </g>
              ))}

              {/* Flow Arrows */}
              <path d="M 170 90 L 200 90" stroke="#38bdf8" strokeWidth="2" className="sdc-flowing-conduit" />
              <path d="M 340 90 L 370 90" stroke="#fbbf24" strokeWidth="2" className="sdc-flowing-conduit" />
              <path d="M 510 90 L 540 90" stroke="#34d399" strokeWidth="2" className="sdc-flowing-conduit" />
              <path d="M 680 90 L 710 90" stroke="#a78bfa" strokeWidth="2" className="sdc-flowing-conduit" />
            </svg>
          </div>

          <div className="sdc-responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: '#0b0f19', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
              <div style={{ color: '#38bdf8', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                🔑 Authentication vs Authorization
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', color: '#94a3b8', fontSize: '12px', lineHeight: '1.6' }}>
                <li><strong style={{ color: '#ffffff' }}>Authentication (AuthN):</strong> "Who are you?" Verified via short-lived JWTs (15 min) with cryptographic signature validation or stateful session cookies.</li>
                <li><strong style={{ color: '#ffffff' }}>Authorization (AuthZ):</strong> "What can you do?" Enforced via RBAC (roles/permissions) or ABAC (attributes/context) at the API Gateway or Controller interceptor.</li>
              </ul>
            </div>

            <div style={{ background: '#0b0f19', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
              <div style={{ color: '#f87171', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                ⚡ Caching Invalidation: The Hardest Problem
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', color: '#94a3b8', fontSize: '12px', lineHeight: '1.6' }}>
                <li><strong style={{ color: '#ffffff' }}>Cache-Aside:</strong> Application reads cache first; on miss, queries DB and populates cache. Writes invalidate (delete) cache key.</li>
                <li><strong style={{ color: '#ffffff' }}>Cache Stampede / Thundering Herd:</strong> Prevent by using mutex locks on cache misses or probabilistic early expiration (XFetch).</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: '10px' }}>
        <span style={{ fontSize: '11px', color: '#64748b' }}>
          freeCodeCamp System Design Course Reference &bull; Video ID: C842vFY5kRo
        </span>
        <span style={{ fontSize: '11px', color: '#38bdf8' }}>
          Interactive Master Curriculum Active
        </span>
      </div>
    </div>
  );
}
