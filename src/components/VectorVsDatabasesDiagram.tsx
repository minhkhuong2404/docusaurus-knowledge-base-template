import React, { useState } from 'react';

type DatabaseParadigm = 'vector' | 'relational' | 'document' | 'keyvalue' | 'graph';

interface QueryStep {
  title: string;
  desc: string;
  metric: string;
}

interface ParadigmSpec {
  id: DatabaseParadigm;
  name: string;
  badge: string;
  color: string;
  dataModel: string;
  mathEngine: string;
  searchComplexity: string;
  storageFormat: string;
  writeThroughput: string;
  querySteps: QueryStep[];
  strengths: string[];
  weaknesses: string[];
  representativeTech: string[];
  exampleQuery: string;
}

const PARADIGMS: Record<DatabaseParadigm, ParadigmSpec> = {
  vector: {
    id: 'vector',
    name: 'Vector Database',
    badge: 'High-Dimensional ANN Embeddings',
    color: '#38bdf8',
    dataModel: 'Dense numerical float32 vectors (d = 768..3072 dims) + sparse metadata payload.',
    mathEngine: 'Approximate Nearest Neighbor (HNSW / IVF-PQ / SCaNN) using Cosine, L2 (Euclidean), or Dot Product distance.',
    searchComplexity: 'O(log N) graph traversal or O(k · d) centroids probe; Exact kNN is O(N · d).',
    storageFormat: 'In-RAM Proximity Graphs (M links/node) + Quantized codebooks (PQ) + Append-only WAL.',
    writeThroughput: 'Moderate (5k-50k vectors/s/node) due to heavy index construction overhead (HNSW graph repairs & clustering).',
    querySteps: [
      { title: '1. Embed & Project', desc: 'Raw query text/image is transformed by deep model into d-dimensional float32 vector.', metric: 't ~ 5-20ms' },
      { title: '2. Entry Point & Greedy Walk', desc: 'Traverse top sparse layers of HNSW graph down to layer 0 finding nearest neighbors.', metric: 't ~ 2-8ms' },
      { title: '3. Pre/Post-Filtered Rerank', desc: 'Filter by metadata (ACL, tenant_id) and compute exact dot product on top-k candidates.', metric: 't ~ 1-5ms' }
    ],
    strengths: [
      'Semantic similarity: captures conceptual context beyond keyword matching',
      'Unstructured data native: search images, audio, natural language, code embeddings',
      'Sub-linear ANN recall: retrieves top-k out of 100M+ vectors in single-digit milliseconds',
      'Foundation for GenAI: Powers Retrieval-Augmented Generation (RAG) and Agent Long-Term Memory'
    ],
    weaknesses: [
      'Approximate results: Probabilistic recall (95%-99%), not 100% deterministic precision',
      'RAM heavy: 1M 1536-dim vectors in FP32 = ~6.14 GB base vectors + ~4-8 GB HNSW graph links',
      'High index build latency: inserting records triggers graph edge rebalancing and distance metrics',
      'No ad-hoc relational joins or cross-table foreign key ACID transactions'
    ],
    representativeTech: ['Milvus', 'Qdrant', 'Pinecone', 'Weaviate', 'pgvector', 'Chroma'],
    exampleQuery: `-- pgvector HNSW Top-5 Cosine Similarity Query\nSELECT id, title, (embedding <=> '[0.012, -0.045, 0.891, ...]') AS cosine_distance\nFROM document_chunks\nWHERE tenant_id = 'org_42'\nORDER BY embedding <=> '[0.012, -0.045, 0.891, ...]'\nLIMIT 5;`
  },
  relational: {
    id: 'relational',
    name: 'Relational Database (RDBMS)',
    badge: 'Normalized Schema & Strict ACID',
    color: '#34d399',
    dataModel: 'Strictly typed 2D tables with foreign keys, primary keys, and normalized constraints (1NF-3NF).',
    mathEngine: 'Relational algebra (σ Select, π Project, ⋈ Join), B-Tree / B+Tree balanced ordering.',
    searchComplexity: 'O(log B N) single-row index seek; O(N log N) hash/merge joins across large tables.',
    storageFormat: 'Fixed-size slotted pages (8KB-16KB), write-ahead log (WAL/redo log), buffer pool cache.',
    writeThroughput: 'High for single-node OLTP (20k-100k writes/s); bounded by synchronous fsync & row locks.',
    querySteps: [
      { title: '1. Parse & Cost-Based Optimizer', desc: 'SQL tokenization, AST generation, index cardinality estimation, join order selection.', metric: 't ~ 0.2-1ms' },
      { title: '2. B-Tree Root-to-Leaf Seek', desc: 'Binary search over 8KB page offsets down 3-4 levels to retrieve tuple ID (TID).', metric: 't ~ 0.1-0.5ms' },
      { title: '3. Heap Fetch & MVCC Visibility', desc: 'Fetch heap tuple, evaluate transaction snapshot visibility against xmin/xmax.', metric: 't ~ 0.2-1ms' }
    ],
    strengths: [
      'Strict serializability & full ACID transactions across multi-table mutations',
      'Normalized schema prevents anomalies, enforces referential integrity and zero duplication',
      'Mature query optimizers (cost-based optimizer with rich column histogram statistics)',
      'Deterministic exact matches, range filtering, and comprehensive aggregation expressions'
    ],
    weaknesses: [
      'Rigid schema migrations on billion-row tables require online DDL tools (gh-ost/pt-osc)',
      'Severe impedance mismatch for semantic search (LIKE "%word%" causes full table scans)',
      'Horizontal write scaling requires complex application-level sharding or Distributed SQL',
      'Exponential latency degrade on deep multi-hop relationship traversals'
    ],
    representativeTech: ['PostgreSQL', 'MySQL (InnoDB)', 'Oracle', 'CockroachDB', 'TiDB'],
    exampleQuery: `-- Multi-Table Join with Serializable Snapshot Isolation\nSELECT o.order_id, c.email, SUM(oi.quantity * oi.unit_price) AS total_revenue\nFROM orders o\nJOIN customers c ON o.customer_id = c.id\nJOIN order_items oi ON o.order_id = oi.order_id\nWHERE o.created_at >= '2026-01-01' AND o.status = 'COMPLETED'\nGROUP BY o.order_id, c.email;`
  },
  document: {
    id: 'document',
    name: 'Document NoSQL',
    badge: 'Hierarchical JSON / BSON',
    color: '#fbbf24',
    dataModel: 'Hierarchical nested JSON/BSON records with embedded arrays and sub-documents.',
    mathEngine: 'Document field indexing via B-Trees, wildcard index paths, hash sharding.',
    searchComplexity: 'O(log N) B-Tree field lookup; full collection scan if unindexed nested path is queried.',
    storageFormat: 'WiredTiger engine: B-Trees/LSM, snappy compressed extent blocks, row-level concurrency.',
    writeThroughput: 'Very High (50k-200k writes/s); append-optimized with lightweight document-level locks.',
    querySteps: [
      { title: '1. Router Dispatch (mongos)', desc: 'Inspect query shard key and route cursor directly to target shard primary replica.', metric: 't ~ 0.5-2ms' },
      { title: '2. B-Tree Path Traversal', desc: 'Scan compound or multikey B-Tree index pointers matching the filter predicate.', metric: 't ~ 0.2-1ms' },
      { title: '3. In-Memory Document Decode', desc: 'Decompress WiredTiger page, deserialize BSON into memory, project selected fields.', metric: 't ~ 0.5-3ms' }
    ],
    strengths: [
      'Polymorphic schema-less flexibility: evolve fields without ALTER TABLE downtime',
      'Entity locality: aggregate root read in a single I/O fetch without multi-table joins',
      'Native horizontal sharding out of the box with automated data chunk migrations',
      'Rich aggregation pipelines ($match, $unwind, $group, $facet)'
    ],
    weaknesses: [
      'Document bloat and 16MB document size ceiling in engines like MongoDB',
      'Denormalization creates data duplication and eventually inconsistent stale copies',
      'Multi-document distributed transactions incur latency penalties and coordinator locks',
      'Poor fit for high-dimensional geometric or dense semantic similarity queries'
    ],
    representativeTech: ['MongoDB', 'Amazon DocumentDB', 'Couchbase'],
    exampleQuery: `-- MongoDB Aggregate Pipeline with Embedded Filtering\ndb.orders.aggregate([\n  { $match: { "status": "SHIPPED", "shipping_address.country": "US" } },\n  { $unwind: "$items" },\n  { $group: { _id: "$items.category", totalSales: { $sum: { $multiply: ["$items.price", "$items.qty"] } } } },\n  { $sort: { totalSales: -1 } }\n]);`
  },
  keyvalue: {
    id: 'keyvalue',
    name: 'Key-Value & In-Memory',
    badge: 'Sub-Millisecond O(1) Access',
    color: '#f97316',
    dataModel: 'Opaque byte string, hashmap, sorted set, or bitfield addressed solely by unique string key.',
    mathEngine: 'Hash tables with MurmurHash / SipHash algorithms, skip lists for range scoring.',
    searchComplexity: 'O(1) average key lookup; O(log N) range scan on Skip Lists / Sorted Sets.',
    storageFormat: 'RAM-resident hash buckets with pointer chains; optional AOF / RDB background persistence.',
    writeThroughput: 'Extreme (100k-1M+ ops/s/node) due to zero disk head contention and single-threaded lock-free event loop.',
    querySteps: [
      { title: '1. Network Event Loop Poll', desc: 'epoll/kqueue dispatches non-blocking socket buffer directly to single-threaded worker.', metric: 't ~ 0.05ms' },
      { title: '2. Hash Slot / Dict Lookup', desc: 'Compute SipHash(key), probe main dictionary table with O(1) hash bucket pointer.', metric: 't ~ 0.01ms' },
      { title: '3. Serialization & Return', desc: 'Extract in-RAM memory block and write RESP protocol payload back to client socket.', metric: 't ~ 0.05ms' }
    ],
    strengths: [
      'Blazing speed: deterministic sub-millisecond p99 latencies (sub-500µs)',
      'Extreme write/read operations per second with minimal CPU and memory overhead',
      'Atomic data structure primitives: distributed locks, rate-limit sliding windows, hyperloglog',
      'Simplicity: easy to reason about caching and partitioning'
    ],
    weaknesses: [
      'No secondary index capability natively; cannot filter by nested value attributes',
      'High DRAM cost per gigabyte compared to NVMe SSD block storage',
      'Cold restart penalty if restoring huge 100GB+ datasets from AOF / snapshot files',
      'Incapable of semantic similarity or fuzzy vector searches'
    ],
    representativeTech: ['Redis', 'Dragonfly', 'Aerospike', 'Amazon DynamoDB (KV mode)', 'Memcached'],
    exampleQuery: `-- Redis Atomic Pipeline / Lua Script Execution\n-- Key-Value O(1) Read / Atomic Decrement with Expiration\nEVAL "if redis.call('get', KEYS[1]) then return redis.call('decrby', KEYS[1], ARGV[1]) else return nil end" 1 user:stock:item_99 2`
  },
  graph: {
    id: 'graph',
    name: 'Graph Database',
    badge: 'Index-Free Adjacency (Multi-Hop)',
    color: '#a855f7',
    dataModel: 'Property Graph model: Nodes (entities), Directed Edges (relationships), and Key-Value attributes.',
    mathEngine: 'Graph algorithms (Dijkstra shortest path, PageRank, Louvain community detection).',
    searchComplexity: 'O(k^d) where k is degree and d is traversal depth (independent of total graph size N).',
    storageFormat: 'Fixed-size record stores with direct physical double-linked pointers between nodes and edges on disk.',
    writeThroughput: 'Moderate (10k-30k writes/s); edge updates require atomic pointer rewrites on both endpoints.',
    querySteps: [
      { title: '1. Seed Node Index Lookup', desc: 'Use B-Tree or Hash index to locate the starting root node in the graph.', metric: 't ~ 0.2-1ms' },
      { title: '2. Pointer Chasing Traversal', desc: 'Follow double-linked physical memory pointers across connected relationship records.', metric: 't ~ 0.5-5ms' },
      { title: '3. Subgraph Path Assembly', desc: 'Accumulate path nodes, validate hop limits, and stream matching entity properties.', metric: 't ~ 1-8ms' }
    ],
    strengths: [
      'Index-Free Adjacency: Traversing 1 hop takes O(1) time regardless of whether graph has 1M or 1B nodes',
      'Intuitive relationship modeling for fraud rings, social networks, and supply chains',
      'Expressive query languages (Cypher, Gremlin, GQL) for complex path-finding',
      'Deep 5-10 hop traversals run in milliseconds instead of crashing RDBMS with cartesian joins'
    ],
    weaknesses: [
      'Difficult horizontal partitioning: distributed graph partitioning (NP-hard min-cut problem)',
      'High memory footprint for maintaining pointer caches across large edge topologies',
      'Poor performance for bulk aggregation scans (e.g., calculating average price across 100M rows)',
      'Cannot execute high-dimensional cosine similarity or semantic vector queries natively'
    ],
    representativeTech: ['Neo4j', 'Amazon Neptune', 'Memgraph', 'ArangoDB'],
    exampleQuery: `-- Cypher: Multi-Hop Fraud Detection Traversal\nMATCH (victim:User {id: 'usr_101'})-[:TRANSFERRED_TO*1..4]->(suspicious:User)\nWHERE suspicious.risk_score > 85\nRETURN suspicious.id, length(path) AS hop_distance\nORDER BY hop_distance ASC LIMIT 10;`
  }
};

export default function VectorVsDatabasesDiagram(): React.JSX.Element {
  const [selected, setSelected] = useState<DatabaseParadigm>('vector');
  const [stepIdx, setStepIdx] = useState<number>(0);

  const active = PARADIGMS[selected];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 820px) {
          .paradigm-split-grid { grid-template-columns: 1fr !important; }
          .paradigm-selector-row { flex-direction: column !important; }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Database Archetype Comparison & Vector Deep Dive
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
          Click an archetype to inspect physical engine mechanics
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Paradigm Buttons */}
        <div className="paradigm-selector-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {(Object.keys(PARADIGMS) as DatabaseParadigm[]).map((key) => {
            const item = PARADIGMS[key];
            const isSelected = selected === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setSelected(key);
                  setStepIdx(0);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: isSelected ? `1.5px solid ${item.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: isSelected ? `${item.color}18` : '#0c0e17',
                  color: isSelected ? '#fff' : 'var(--ifm-color-content-secondary)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '12.5px',
                  transition: 'all 0.18s ease',
                  boxShadow: isSelected ? `0 0 12px ${item.color}33` : 'none'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                {item.name}
              </button>
            );
          })}
        </div>

        {/* Selected Banner */}
        <div style={{
          backgroundColor: '#0c0e17',
          padding: '14px 18px',
          borderRadius: '10px',
          borderLeft: `4px solid ${active.color}`,
          marginBottom: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span style={{ fontSize: '17px', fontWeight: 800, color: '#fff' }}>{active.name}</span>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: `${active.color}22`, color: active.color, fontWeight: 700 }}>
                {active.badge}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
              {active.dataModel}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {active.representativeTech.map((t) => (
              <span key={t} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#e2e8f0', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Dynamic SVG Animated Flow Engine */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ marginBottom: '16px', padding: '16px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: active.color, fontWeight: 700, letterSpacing: '0.5px' }}>
              Execution Pipeline: Under-the-Hood Query Flow
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {active.querySteps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStepIdx(i)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    border: stepIdx === i ? `1px solid ${active.color}` : '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: stepIdx === i ? `${active.color}25` : '#070913',
                    color: stepIdx === i ? '#fff' : 'var(--ifm-color-content-secondary)'
                  }}
                >
                  Step {i + 1}
                </button>
              ))}
            </div>
          </div>

          <svg viewBox="0 0 780 180" className="interactive-diagram-svg" style={{ maxHeight: '200px' }}>
            <defs>
              <marker id="arrow-flow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill={active.color} />
              </marker>
              <filter id="glowAccent" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Conduits & Flowing Animation */}
            {/* Step 1 to Step 2 */}
            <path
              id="conduit-1-2"
              d="M 230 85 L 300 85"
              fill="none"
              stroke={stepIdx >= 1 ? active.color : '#1e2438'}
              strokeWidth="2.5"
              strokeDasharray={stepIdx >= 1 ? '4 3' : 'none'}
              markerEnd="url(#arrow-flow)"
            />
            {stepIdx >= 1 && (
              <circle r="4" fill={active.color} filter="url(#glowAccent)">
                <animateMotion dur="1.8s" repeatCount="indefinite">
                  <mpath href="#conduit-1-2" />
                </animateMotion>
              </circle>
            )}

            {/* Step 2 to Step 3 */}
            <path
              id="conduit-2-3"
              d="M 510 85 L 580 85"
              fill="none"
              stroke={stepIdx >= 2 ? active.color : '#1e2438'}
              strokeWidth="2.5"
              strokeDasharray={stepIdx >= 2 ? '4 3' : 'none'}
              markerEnd="url(#arrow-flow)"
            />
            {stepIdx >= 2 && (
              <circle r="4" fill={active.color} filter="url(#glowAccent)">
                <animateMotion dur="1.8s" repeatCount="indefinite">
                  <mpath href="#conduit-2-3" />
                </animateMotion>
              </circle>
            )}

            {/* Step 1 Node */}
            <g
              transform="translate(20, 35)"
              onClick={() => setStepIdx(0)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                width="210"
                height="100"
                rx="8"
                fill="#070913"
                stroke={stepIdx === 0 ? active.color : 'rgba(255, 255, 255, 0.1)'}
                strokeWidth={stepIdx === 0 ? 2 : 1}
              />
              <circle cx="24" cy="28" r="10" fill={`${active.color}25`} />
              <text x="24" y="32" textAnchor="middle" fill={active.color} fontSize="11" fontWeight="800">1</text>
              <text x="44" y="32" fill="#fff" fontSize="12" fontWeight="700">
                {active.querySteps[0].title.split('. ')[1] || active.querySteps[0].title}
              </text>
              <foreignObject x="15" y="46" width="180" height="48">
                <div style={{ fontSize: '10.5px', color: '#94a3b8', lineHeight: 1.35, overflow: 'hidden' }}>
                  {active.querySteps[0].desc}
                </div>
              </foreignObject>
              <text x="195" y="94" textAnchor="end" fill={active.color} fontSize="9.5" fontWeight="700">
                {active.querySteps[0].metric}
              </text>
            </g>

            {/* Step 2 Node */}
            <g
              transform="translate(300, 35)"
              onClick={() => setStepIdx(1)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                width="210"
                height="100"
                rx="8"
                fill="#070913"
                stroke={stepIdx === 1 ? active.color : 'rgba(255, 255, 255, 0.1)'}
                strokeWidth={stepIdx === 1 ? 2 : 1}
              />
              <circle cx="24" cy="28" r="10" fill={`${active.color}25`} />
              <text x="24" y="32" textAnchor="middle" fill={active.color} fontSize="11" fontWeight="800">2</text>
              <text x="44" y="32" fill="#fff" fontSize="12" fontWeight="700">
                {active.querySteps[1].title.split('. ')[1] || active.querySteps[1].title}
              </text>
              <foreignObject x="15" y="46" width="180" height="48">
                <div style={{ fontSize: '10.5px', color: '#94a3b8', lineHeight: 1.35, overflow: 'hidden' }}>
                  {active.querySteps[1].desc}
                </div>
              </foreignObject>
              <text x="195" y="94" textAnchor="end" fill={active.color} fontSize="9.5" fontWeight="700">
                {active.querySteps[1].metric}
              </text>
            </g>

            {/* Step 3 Node */}
            <g
              transform="translate(580, 35)"
              onClick={() => setStepIdx(2)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                width="180"
                height="100"
                rx="8"
                fill="#070913"
                stroke={stepIdx === 2 ? active.color : 'rgba(255, 255, 255, 0.1)'}
                strokeWidth={stepIdx === 2 ? 2 : 1}
              />
              <circle cx="24" cy="28" r="10" fill={`${active.color}25`} />
              <text x="24" y="32" textAnchor="middle" fill={active.color} fontSize="11" fontWeight="800">3</text>
              <text x="44" y="32" fill="#fff" fontSize="12" fontWeight="700">
                {active.querySteps[2].title.split('. ')[1] || active.querySteps[2].title}
              </text>
              <foreignObject x="15" y="46" width="150" height="48">
                <div style={{ fontSize: '10.5px', color: '#94a3b8', lineHeight: 1.35, overflow: 'hidden' }}>
                  {active.querySteps[2].desc}
                </div>
              </foreignObject>
              <text x="165" y="94" textAnchor="end" fill={active.color} fontSize="9.5" fontWeight="700">
                {active.querySteps[2].metric}
              </text>
            </g>
          </svg>
        </div>

        {/* 2-Column Split: Physical Architecture & Example */}
        <div className="paradigm-split-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', alignItems: 'start' }}>
          {/* Left Column: Physical Engine Specs */}
          <div style={{ backgroundColor: '#0c0e17', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: active.color, fontWeight: 700, marginBottom: '12px' }}>
              Physical Storage & Algorithm Mechanics
            </div>

            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase' }}>Indexing & Math Engine</div>
              <div style={{ fontSize: '12.5px', color: '#fff', fontWeight: 600, marginTop: '2px' }}>{active.mathEngine}</div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase' }}>Search Complexity</div>
              <div style={{ fontSize: '12.5px', color: '#fbbf24', fontWeight: 600, marginTop: '2px', fontFamily: 'monospace' }}>{active.searchComplexity}</div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase' }}>Physical Storage Format</div>
              <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', marginTop: '2px' }}>{active.storageFormat}</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase' }}>Write Throughput Envelope</div>
              <div style={{ fontSize: '12.5px', color: '#34d399', fontWeight: 600, marginTop: '2px' }}>{active.writeThroughput}</div>
            </div>
          </div>

          {/* Right Column: Code Snippet & Query Example */}
          <div style={{ backgroundColor: '#0c0e17', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: active.color, fontWeight: 700, marginBottom: '8px' }}>
              Representative Query & API Syntax
            </div>
            <pre style={{
              margin: '0 0 12px 0',
              padding: '12px',
              backgroundColor: '#05070e',
              borderRadius: '8px',
              fontSize: '11.5px',
              fontFamily: 'monospace',
              color: '#38bdf8',
              overflowX: 'auto',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              lineHeight: 1.45
            }}>
              <code>{active.exampleQuery}</code>
            </pre>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '10.5px', color: '#34d399', fontWeight: 700, marginBottom: '4px' }}>KEY STRENGTHS</div>
                <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
                  {active.strengths.slice(0, 2).map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div style={{ fontSize: '10.5px', color: '#f87171', fontWeight: 700, marginBottom: '4px' }}>TRADEOFFS & LIMITS</div>
                <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
                  {active.weaknesses.slice(0, 2).map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
