import React, { useState } from 'react';

type MigrationCompany =
  | 'dropbox'
  | 'discord'
  | 'vitess'
  | 'github'
  | 'pinterest'
  | 'instagram'
  | 'figma'
  | 'whatsapp';

interface MigrationCase {
  id: MigrationCompany;
  title: string;
  company: string;
  scale: string;
  strategy: string;
  tradeOff: string;
  color: string;
}

const MIGRATION_CASES: MigrationCase[] = [
  {
    id: 'dropbox',
    title: 'Dropbox Magic Pocket: Multi-Exabyte Object Storage',
    company: 'Dropbox',
    scale: '500+ Petabytes (moving off AWS S3 to custom on-premise hardware)',
    strategy: 'Built Magic Pocket in Rust & Go. Instead of 3x replication (which consumes 300% storage overhead), Magic Pocket uses an 8+9 Reed-Solomon Erasure Coding scheme. An 8-block data chunk produces 9 parity blocks, distributed across distinct racks. Can survive the loss of 9 disks or whole server racks simultaneously while reducing raw storage overhead from 200% down to ~112%!',
    tradeOff: 'Erasure coding incurs CPU computation overhead during block reconstruction and increases read latency on degraded reads, requiring specialized memory caching tiers.',
    color: '#38bdf8',
  },
  {
    id: 'discord',
    title: 'Discord: Trillions of Messages from Cassandra to ScyllaDB',
    company: 'Discord',
    scale: 'Trillions of messages, millions of read/write requests per second',
    strategy: 'Cassandra on the JVM suffered severe GC pauses and tombstone scanning latency cliffs when fetching unread channels. Discord migrated trillions of messages to ScyllaDB (a C++ rewrite of Cassandra that uses the Seastar share-nothing thread-per-core asynchronous architecture). Zero JVM garbage collection, deterministic P99 latency dropping from 1,000ms+ down to sub-15ms across all channels.',
    tradeOff: 'C++ manual memory architecture requires precise CPU core pinning and kernel networking tuning; cannot rely on JVM bytecode introspection.',
    color: '#34d399',
  },
  {
    id: 'vitess',
    title: 'YouTube + Vitess: Transparent MySQL Sharding',
    company: 'YouTube',
    scale: 'Billions of video views per day; millions of global concurrent transactions',
    strategy: 'YouTube scaled relational MySQL by building Vitess: an open-source clustering system for horizontal scaling. Vitess provides a lightweight proxy (vtgate) that parses standard SQL, translates queries into sharded partition targets based on VSchema, pools connections to eliminate MySQL connection explosion, and handles automatic resharding without application downtime.',
    tradeOff: 'Complex cross-shard distributed joins and multi-shard 2PC distributed transactions incur coordination latency, encouraging denormalization.',
    color: '#fbbf24',
  },
  {
    id: 'github',
    title: 'GitHub: Zero-Downtime MySQL 5.7 to 8.0 Fleet Upgrade',
    company: 'GitHub',
    scale: '100+ MySQL clusters, petabytes of code repos, PRs, and issues',
    strategy: 'GitHub upgraded its entire fleet without a single second of maintenance window downtime using gh-ost and Orchestrator. Binlog stream tailing asynchronously copied table data into shadow tables, while Orchestrator automated primary-replica promotions using Raft consensus failover in <10s. Upgraded read replicas first, performed query planner shadow diffing, and executed automated master failovers.',
    tradeOff: 'Query planner behavior in MySQL 8 (e.g. hash joins vs block nested loops) required weeks of shadow-read query auditing to avoid regression spikes.',
    color: '#a78bfa',
  },
  {
    id: 'pinterest',
    title: 'Pinterest: 64-Bit Deterministic MySQL Sharding',
    company: 'Pinterest',
    scale: 'Tens of billions of pins/boards, 50K+ QPS on modest infrastructure',
    strategy: 'When Cassandra was immature in 2012, Pinterest sharded bare MySQL instances using a custom 64-bit integer ID layout: 16 bits Shard ID (up to 65,536 logical shards), 10 bits Entity Type (Pin, Board, User), and 38 bits local auto-increment. Created 4,096 logical databases mapped across 8 physical servers, eliminating cross-shard joins by co-locating user data.',
    tradeOff: 'Cross-shard secondary lookups (e.g. searching across all boards by tag) cannot be executed via SQL; requires external Elasticsearch clusters.',
    color: '#f97316',
  },
  {
    id: 'instagram',
    title: 'Instagram: From Redis RAM to Cassandra & Rocksandra (C++)',
    company: 'Instagram',
    scale: '1+ Billion users, hundreds of millions of user feed timelines',
    strategy: 'Holding user feed timelines in Redis RAM became financially unsustainable. Instagram migrated feeds to Cassandra on NVMe SSDs, slashing hosting costs by 75%. When Cassandra JVM GC stalls pushed P99 read latencies to 60ms, Meta built Rocksandra: replacing Cassandra Java-based storage engine with native C++ RocksDB via JNI, dropping P99 latencies back to 20ms.',
    tradeOff: 'Bridging Java and C++ through JNI boundaries introduces minor marshalling overhead and complicates operational crash debugging (core dumps vs Java stack traces).',
    color: '#f472b6',
  },
  {
    id: 'figma',
    title: 'Figma: Real-Time Multiplayer Sync (Server-Authoritative LWW)',
    company: 'Figma',
    scale: 'Hundreds of concurrent users editing massive 50K-node vector canvases',
    strategy: 'Figma rejected peer-to-peer OT (intractable for 2D tree hierarchy reparenting) and pure CRDTs (too much metadata/tombstone memory bloat in WebAssembly). Instead, Figma built a server-authoritative single-threaded Rust room process that sequences mutations, applies property-level Last-Writer-Wins (LWW) commutative updates, and uses fractional indexing for layer ordering.',
    tradeOff: 'Requires a dedicated stateful server process per active document, demanding sticky load balancing and rapid room process migration during server crashes.',
    color: '#2dd4bf',
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp: 2M+ Concurrent Connections per Server with Erlang',
    company: 'WhatsApp',
    scale: '2 Billion users, 100 Billion messages/day with ~50 engineers',
    strategy: 'WhatsApp utilized the Erlang BEAM virtual machine and FreeBSD kernel tuning to push past the C10K problem to the C2M problem (2 Million+ concurrent persistent TCP connections on a single physical commodity server). Erlang lightweight actor processes consume only a few hundred bytes each, communicating via asynchronous message passing without shared-memory thread contention.',
    tradeOff: 'Erlang is dynamically typed with specialized syntax; functional actor concurrency requires shifting engineering mindsets away from traditional OOP/relational patterns.',
    color: '#818cf8',
  },
];

export default function CaseStudiesDataMigrationsDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<MigrationCompany>('dropbox');

  const selected = MIGRATION_CASES.find((c) => c.id === activeTab) || MIGRATION_CASES[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <style>{`
        @media (max-width: 768px) {
          .migration-grid-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Petabyte Data Stores & Zero-Downtime Migration Case Studies
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {MIGRATION_CASES.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveTab(c.id)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: `1px solid ${activeTab === c.id ? c.color : 'rgba(255, 255, 255, 0.1)'}`,
                background: activeTab === c.id ? `${c.color}22` : 'transparent',
                color: activeTab === c.id ? c.color : 'var(--ifm-color-content-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {c.company}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Canvas with Dynamic Flowing Conduits */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg
          viewBox="0 0 940 180"
          className="interactive-diagram-svg"
          style={{ minHeight: '180px' }}
          role="img"
          aria-label="Data migration dual-write and shadow validation pipeline"
        >
          <defs>
            <marker
              id="arrow-cyan-mig"
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
              id="arrow-green-mig"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34d399" />
            </marker>
          </defs>

          {/* Phase 1: Dual-Write Ingestion */}
          <g>
            <rect x="30" y="45" width="160" height="90" rx="10" fill="rgba(15, 23, 42, 0.85)" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="55" cy="72" r="14" fill="#38bdf822" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="55" y="77" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="800">1</text>
            <text x="115" y="70" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="12" fontWeight="700">Dual-Write Ingest</text>
            <text x="115" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">Kafka / CDC Event</text>
            <text x="115" y="112" textAnchor="middle" fill="#38bdf8" fontSize="9.5" fontWeight="600">Old + New Target</text>
          </g>

          {/* Flow Lines to Legacy and Target Stores */}
          <path d="M 190 90 C 260 90, 270 50, 330 50" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.3" />
          <path
            d="M 190 90 C 260 90, 270 50, 330 50"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            className="interactive-diagram-flowing-path"
            markerEnd="url(#arrow-cyan-mig)"
          />

          <path d="M 190 90 C 260 90, 270 130, 330 130" fill="none" stroke="#34d399" strokeWidth="1.5" strokeOpacity="0.3" />
          <path
            d="M 190 90 C 260 90, 270 130, 330 130"
            fill="none"
            stroke="#34d399"
            strokeWidth="2"
            className="interactive-diagram-flowing-path"
            markerEnd="url(#arrow-green-mig)"
          />

          {/* Legacy Store */}
          <g>
            <rect x="335" y="30" width="160" height="42" rx="6" fill="rgba(15, 23, 42, 0.9)" stroke="#38bdf8" strokeWidth="1.2" />
            <text x="415" y="47" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="11" fontWeight="700">Primary Source</text>
            <text x="415" y="63" textAnchor="middle" fill="#38bdf8" fontSize="9.5">S3 / Cassandra JVM / MySQL</text>
          </g>

          {/* Target Modern Store */}
          <g>
            <rect x="335" y="110" width="160" height="42" rx="6" fill="rgba(15, 23, 42, 0.9)" stroke="#34d399" strokeWidth="1.2" />
            <text x="415" y="127" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="11" fontWeight="700">Target Datastore</text>
            <text x="415" y="143" textAnchor="middle" fill="#34d399" fontSize="9.5">Magic Pocket / Scylla / Vitess</text>
          </g>

          {/* Lines to Shadow Reconciliation */}
          <path d="M 495 50 C 560 50, 570 90, 620 90" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeOpacity="0.3" />
          <path
            d="M 495 50 C 560 50, 570 90, 620 90"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2"
            className="interactive-diagram-flowing-path"
          />

          <path d="M 495 130 C 560 130, 570 90, 620 90" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeOpacity="0.3" />
          <path
            d="M 495 130 C 560 130, 570 90, 620 90"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2"
            className="interactive-diagram-flowing-path"
          />

          {/* Shadow Verifier Node */}
          <g>
            <rect x="625" y="45" width="160" height="90" rx="10" fill="rgba(15, 23, 42, 0.85)" stroke="#fbbf24" strokeWidth="1.5" />
            <circle cx="650" cy="72" r="14" fill="#fbbf2422" stroke="#fbbf24" strokeWidth="1.5" />
            <text x="650" y="77" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="800">2</text>
            <text x="710" y="70" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="12" fontWeight="700">Shadow Verifier</text>
            <text x="710" y="88" textAnchor="middle" fill="#fbbf24" fontSize="10">Bitwise Diff Check</text>
            <text x="710" y="112" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">100% Match Ratio</text>
          </g>

          {/* Cutover Arrow */}
          <line x1="785" y1="90" x2="835" y2="90" stroke="#34d399" strokeWidth="2" strokeOpacity="0.3" />
          <line
            x1="785"
            y1="90"
            x2="835"
            y2="90"
            stroke="#34d399"
            strokeWidth="2.5"
            className="interactive-diagram-flowing-path"
            markerEnd="url(#arrow-green-mig)"
          />

          {/* Final Cutover Node */}
          <g>
            <rect x="840" y="45" width="90" height="90" rx="10" fill="rgba(6, 78, 59, 0.3)" stroke="#34d399" strokeWidth="1.5" />
            <circle cx="885" cy="72" r="14" fill="#34d39922" stroke="#34d399" strokeWidth="1.5" />
            <text x="885" y="77" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="800">✓</text>
            <text x="885" y="102" textAnchor="middle" fill="#34d399" fontSize="10.5" fontWeight="700">Live Cutover</text>
            <text x="885" y="118" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9">Zero Downtime</text>
          </g>
        </svg>
      </div>

      {/* Details Split Pane */}
      <div className="migration-grid-layout" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', marginTop: '16px' }}>
        <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${selected.color}` }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: selected.color, textTransform: 'uppercase' }}>
            SCALE & ARCHITECTURAL STRATEGY
          </span>
          <h4 style={{ margin: '4px 0 6px 0', color: 'var(--ifm-color-content)', fontSize: '15px' }}>
            {selected.title}
          </h4>
          <p style={{ margin: '0 0 8px 0', fontSize: '11.5px', color: '#fbbf24', fontWeight: 600 }}>
            {selected.scale}
          </p>
          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            {selected.strategy}
          </p>
        </div>

        <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #f87171' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#f87171', textTransform: 'uppercase' }}>
            ENGINEERING TRADE-OFFS & LESSONS
          </span>
          <h4 style={{ margin: '4px 0 8px 0', color: 'var(--ifm-color-content)', fontSize: '15px' }}>
            The Reality of Petabyte Migrations
          </h4>
          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.55 }}>
            {selected.tradeOff}
          </p>
        </div>
      </div>
    </div>
  );
}
