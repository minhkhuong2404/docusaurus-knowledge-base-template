import React, { useState } from 'react';

export type OpenSearchPracticeMode =
  | 'query-execution'
  | 'bulk-routing'
  | 'schema-reindex'
  | 'hybrid-knn';

interface Props {
  initialMode?: OpenSearchPracticeMode;
}

interface ModeMeta {
  id: OpenSearchPracticeMode;
  label: string;
  accent: string;
  subtitle: string;
}

const MODES: ModeMeta[] = [
  {
    id: 'query-execution',
    label: 'Query vs Filter Context & PIT Pagination',
    accent: '#38bdf8',
    subtitle: 'How bool.filter caches Roaring Bitmaps in IndicesQueryCache and why PIT + search_after beats from/size deep pagination',
  },
  {
    id: 'bulk-routing',
    label: 'Bulk Ingestion, UUIDv7 IDs & Multi-Tenant Routing',
    accent: '#34d399',
    subtitle: 'Sizing _bulk payloads (5–15 MB), avoiding random UUIDv4 segment lookup penalties, and _routing shard isolation',
  },
  {
    id: 'schema-reindex',
    label: 'Zero-Downtime Alias Reindex & Mapping Governance',
    accent: '#fbbf24',
    subtitle: 'Atomic Read/Write Alias cutovers with sliced _reindex, plus nested vs flat_object memory layout',
  },
  {
    id: 'hybrid-knn',
    label: 'Hybrid Search (BM25 + k-NN Vector HNSW)',
    accent: '#a78bfa',
    subtitle: 'Combining lexical BM25 precision with FAISS/Lucene HNSW vector recall using Pre-Filtering & RRF Normalization Pipelines',
  },
];

interface PracticePattern {
  id: string;
  category: string;
  title: string;
  antiPattern: string;
  bestPractice: string;
  engineReason: string;
  impactMetric: string;
  accent: string;
}

const PRACTICE_PATTERNS: PracticePattern[] = [
  {
    id: 'filter-vs-must',
    category: 'Querying',
    title: 'bool.filter vs. bool.must for Exact Predicates',
    antiPattern: 'Putting status, tenant_id, and @timestamp ranges inside bool.must',
    bestPractice: 'Move all non-scored predicates into bool.filter and round timestamps (now-1h/m)',
    engineReason: 'bool.filter skips floating-point BM25 TF-IDF math and caches compressed Roaring Bitmaps in IndicesQueryCache for segments >10,000 docs.',
    impactMetric: '5x–15x lower query latency',
    accent: '#38bdf8',
  },
  {
    id: 'pagination',
    category: 'Pagination',
    title: 'Point-in-Time (PIT) + search_after vs. from/size',
    antiPattern: 'Using from: 50000, size: 50 for deep pagination or export jobs',
    bestPractice: 'Open a Point-in-Time (PIT) context and paginate via search_after: [lastSortVal, lastTiebreaker]',
    engineReason: 'from + size forces every shard to allocate a priority queue of (from + size) hits and sort S * (from + size) records on the Coordinating Node.',
    impactMetric: 'O(1) constant heap & latency at page 10,000',
    accent: '#34d399',
  },
  {
    id: 'document-id',
    category: 'Indexing',
    title: 'Auto-Generated / UUIDv7 IDs vs. Random UUIDv4 _id',
    antiPattern: 'Assigning random UUIDv4 strings as the OpenSearch document _id on write-heavy indices',
    bestPractice: 'Omit _id (let OpenSearch generate flake IDs) or use time-ordered UUIDv7 keys',
    engineReason: 'Custom random IDs force Lucene to check every segment Bloom filter and FST Term Dictionary to verify if the _id already exists before appending.',
    impactMetric: '+40% to +65% higher _bulk indexing throughput',
    accent: '#fbbf24',
  },
  {
    id: 'numeric-ids',
    category: 'Mappings',
    title: 'Mapping Identifiers (order_id, zip_code) as keyword',
    antiPattern: 'Mapping order_id, trace_id, or sku_number as long or integer',
    bestPractice: 'Map all identifiers sorted/filtered by equality as keyword (reserve long/double for range math)',
    engineReason: 'Numeric types build BKD-Trees optimized for range scans (BETWEEN), whereas keyword builds an FST Inverted Index optimized for O(1) exact term lookups.',
    impactMetric: '3x faster term lookups & 30% smaller index',
    accent: '#a78bfa',
  },
];

export default function OpenSearchBestPracticesDiagram({
  initialMode = 'query-execution',
}: Props): React.ReactElement {
  const [activeMode, setActiveMode] = useState<OpenSearchPracticeMode>(initialMode);
  const [selectedPatternId, setSelectedPatternId] = useState<string>('filter-vs-must');
  const [selectedNode, setSelectedNode] = useState<string>('filter-cache');

  const currentMode = MODES.find((m) => m.id === activeMode) || MODES[0];
  const selectedPattern =
    PRACTICE_PATTERNS.find((p) => p.id === selectedPatternId) || PRACTICE_PATTERNS[0];

  const renderQueryExecutionSvg = () => (
    <svg
      viewBox="0 0 880 390"
      style={{
        width: '100%',
        height: 'auto',
        background: '#0d0f1e',
        borderRadius: '10px',
        border: '1px solid rgba(56, 189, 248, 0.25)',
      }}
    >
      <defs>
        <pattern id="os-bp-grid-1" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="rgba(148, 163, 184, 0.12)" />
        </pattern>
        <marker id="os-bp-arrow-cyan" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
        </marker>
        <marker id="os-bp-arrow-green" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#34d399" />
        </marker>
        <marker id="os-bp-arrow-red" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#f87171" />
        </marker>
        <marker id="os-bp-arrow-amber" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" />
        </marker>
      </defs>

      <rect width="880" height="390" fill="url(#os-bp-grid-1)" />

      {/* Top Lane: Query vs Filter Context */}
      <rect x="16" y="14" width="848" height="175" rx="8" fill="rgba(15, 23, 42, 0.78)" stroke="rgba(56, 189, 248, 0.3)" />
      <text x="30" y="36" fill="#38bdf8" fontSize="12" fontWeight="700">
        LANE 1: QUERY EXECUTION PATH — FILTER CONTEXT (ROARING BITMAP CACHE) VS. QUERY CONTEXT (BM25 SCORING)
      </text>

      {/* Incoming Search Request */}
      <g
        onClick={() => setSelectedNode('bool-query')}
        style={{ cursor: 'pointer' }}
      >
        <rect x="30" y="54" width="175" height="116" rx="7" fill="rgba(30, 41, 59, 0.95)" stroke={selectedNode === 'bool-query' ? '#38bdf8' : 'rgba(148, 163, 184, 0.35)'} strokeWidth="1.8" />
        <text x="117" y="76" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="700">POST /orders/_search</text>
        <text x="42" y="96" fill="#34d399" fontSize="9.5" fontFamily="monospace">bool.filter: [</text>
        <text x="50" y="110" fill="#e2e8f0" fontSize="9" fontFamily="monospace">term: status="PAID"</text>
        <text x="50" y="123" fill="#e2e8f0" fontSize="9" fontFamily="monospace">range: now-1h/m</text>
        <text x="42" y="136" fill="#34d399" fontSize="9.5" fontFamily="monospace">]</text>
        <text x="42" y="153" fill="#fbbf24" fontSize="9.5" fontFamily="monospace">bool.must: [match: "pro"]</text>
      </g>

      {/* Fast Path: Roaring Bitmap Cache */}
      <path d="M 211 85 L 285 85" stroke="#34d399" strokeWidth="2" fill="none" markerEnd="url(#os-bp-arrow-green)" />
      <path d="M 211 85 L 285 85" className="interactive-diagram-flowing-path" stroke="#34d399" strokeWidth="2.2" fill="none" />

      <g
        onClick={() => setSelectedNode('filter-cache')}
        style={{ cursor: 'pointer' }}
      >
        <rect x="295" y="50" width="265" height="68" rx="7" fill="rgba(6, 78, 59, 0.32)" stroke="#34d399" strokeWidth="1.8" />
        <text x="427" y="70" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">1. Filter Context (IndicesQueryCache)</text>
        <text x="427" y="87" textAnchor="middle" fill="#e2e8f0" fontSize="9.5">Roaring Bitmap Bitwise AND: [1,0,1,1,0...]</text>
        <text x="427" y="103" textAnchor="middle" fill="#94a3b8" fontSize="9">Zero BM25 math • Cached in RAM (~0.1 ms)</text>
      </g>

      {/* Scored Path: BM25 Only on Filtered Subset */}
      <path d="M 211 146 L 285 146" stroke="#fbbf24" strokeWidth="2" fill="none" markerEnd="url(#os-bp-arrow-amber)" />
      <path d="M 211 146 L 285 146" className="interactive-diagram-flowing-path" stroke="#fbbf24" strokeWidth="2" fill="none" />

      <g
        onClick={() => setSelectedNode('bm25-scorer')}
        style={{ cursor: 'pointer' }}
      >
        <rect x="295" y="124" width="265" height="54" rx="7" fill="rgba(120, 53, 15, 0.28)" stroke="#fbbf24" strokeWidth="1.5" />
        <text x="427" y="144" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="700">2. Query Context (BM25 Scorer)</text>
        <text x="427" y="162" textAnchor="middle" fill="#e2e8f0" fontSize="9.5">Evaluates TF-IDF ONLY on bitset-matched docs</text>
      </g>

      {/* Arrow to DocValues Collector */}
      <path d="M 566 84 L 624 105" stroke="#34d399" strokeWidth="2" fill="none" markerEnd="url(#os-bp-arrow-green)" />
      <path d="M 566 84 L 624 105" className="interactive-diagram-flowing-path" stroke="#34d399" strokeWidth="2" fill="none" />
      <path d="M 566 150 L 624 125" stroke="#fbbf24" strokeWidth="2" fill="none" markerEnd="url(#os-bp-arrow-amber)" />

      <g
        onClick={() => setSelectedNode('docvalues-agg')}
        style={{ cursor: 'pointer' }}
      >
        <rect x="634" y="62" width="212" height="106" rx="7" fill="rgba(15, 23, 42, 0.95)" stroke="#38bdf8" strokeWidth="1.8" />
        <text x="740" y="84" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">3. TopDocs & DocValues</text>
        <text x="740" y="103" textAnchor="middle" fill="#e2e8f0" fontSize="9.5">• _source: includes only</text>
        <text x="740" y="119" textAnchor="middle" fill="#e2e8f0" fontSize="9.5">• Aggs scan OS Page Cache</text>
        <text x="740" y="135" textAnchor="middle" fill="#34d399" fontSize="9.5">• Global Ordinals Lookup</text>
        <text x="740" y="153" textAnchor="middle" fill="#94a3b8" fontSize="9">p99 Latency: 4–12 ms</text>
      </g>

      {/* Bottom Lane: Deep Pagination Comparison */}
      <rect x="16" y="202" width="848" height="174" rx="8" fill="rgba(15, 23, 42, 0.78)" stroke="rgba(248, 113, 113, 0.3)" />
      <text x="30" y="224" fill="#f87171" fontSize="12" fontWeight="700">
        LANE 2: DEEP PAGINATION PHYSICS — WHY from + size FAILS vs. POINT-IN-TIME (PIT) + search_after
      </text>

      {/* Bad Path: from + size */}
      <rect x="30" y="238" width="395" height="122" rx="7" fill="rgba(127, 29, 29, 0.22)" stroke="#f87171" strokeWidth="1.5" />
      <text x="44" y="258" fill="#f87171" fontSize="11" fontWeight="700">❌ ANTI-PATTERN: from: 50,000, size: 20 across 20 Shards</text>
      <text x="44" y="278" fill="#e2e8f0" fontSize="9.5">• Each of the 20 shards must build a Priority Queue of 50,020 hits</text>
      <text x="44" y="295" fill="#e2e8f0" fontSize="9.5">• Coordinating Node merges 20 × 50,020 = 1,000,400 hits in JVM Heap!</text>
      <text x="44" y="312" fill="#e2e8f0" fontSize="9.5">• Discards 1,000,380 hits just to return 20 docs → Heap OOM / 429</text>
      <text x="44" y="336" fill="#fca5a5" fontSize="9.5" fontFamily="monospace">Blocked by default: index.max_result_window = 10,000</text>

      {/* Good Path: PIT + search_after */}
      <rect x="450" y="238" width="398" height="122" rx="7" fill="rgba(6, 78, 59, 0.24)" stroke="#34d399" strokeWidth="1.8" />
      <text x="464" y="258" fill="#34d399" fontSize="11" fontWeight="700">✅ PRINCIPAL PATTERN: Point-in-Time (PIT) + search_after</text>
      <text x="464" y="278" fill="#e2e8f0" fontSize="9.5">1. POST /orders/_search/point_in_time?keep_alive=5m (freezes segments)</text>
      <text x="464" y="295" fill="#e2e8f0" fontSize="9.5">2. Pass search_after: [1729123000, "doc_9918"] + sort: [@timestamp, _id]</text>
      <text x="464" y="312" fill="#e2e8f0" fontSize="9.5">3. Each shard seeks past cursor in BKD/DocValues & returns ONLY 20 hits!</text>
      <text x="464" y="336" fill="#6ee7b7" fontSize="9.5" fontFamily="monospace">Coordinating Node merges 20 × 20 = 400 hits (O(1) constant cost)</text>
    </svg>
  );

  const renderBulkRoutingSvg = () => (
    <svg
      viewBox="0 0 880 390"
      style={{
        width: '100%',
        height: 'auto',
        background: '#0d0f1e',
        borderRadius: '10px',
        border: '1px solid rgba(52, 211, 153, 0.25)',
      }}
    >
      <defs>
        <pattern id="os-bp-grid-2" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="rgba(148, 163, 184, 0.12)" />
        </pattern>
        <marker id="os-bulk-green" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#34d399" />
        </marker>
        <marker id="os-bulk-cyan" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
        </marker>
        <marker id="os-bulk-amber" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" />
        </marker>
      </defs>

      <rect width="880" height="390" fill="url(#os-bp-grid-2)" />

      {/* Top Section: BulkIngester Sizing & ID Generation */}
      <rect x="16" y="14" width="848" height="172" rx="8" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(52, 211, 153, 0.3)" />
      <text x="30" y="36" fill="#34d399" fontSize="12" fontWeight="700">
        HIGH-THROUGHPUT _bulk PIPELINE: BYTE-SIZED BATCHING (5–15 MB) & SEQUENTIAL / AUTO-ID OPTIMIZATION
      </text>

      {/* Java 21 BulkIngester */}
      <rect x="30" y="54" width="215" height="114" rx="7" fill="rgba(30, 41, 59, 0.95)" stroke="#38bdf8" strokeWidth="1.8" />
      <text x="137" y="75" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">Java 21 BulkIngester</text>
      <text x="42" y="95" fill="#e2e8f0" fontSize="9.5">• flushBytes: 10 MB (sweet spot)</text>
      <text x="42" y="112" fill="#e2e8f0" fontSize="9.5">• maxOperations: 5,000 docs</text>
      <text x="42" y="129" fill="#e2e8f0" fontSize="9.5">•flushInterval: 2s</text>
      <text x="42" y="146" fill="#34d399" fontSize="9.5">• ConcurrentRequests: 4</text>

      <path d="M 251 110 L 315 110" stroke="#38bdf8" strokeWidth="2.2" fill="none" markerEnd="url(#os-bulk-cyan)" />
      <path d="M 251 110 L 315 110" className="interactive-diagram-flowing-path" stroke="#38bdf8" strokeWidth="2.2" fill="none" />

      {/* Coordinating Node Sub-Batching */}
      <rect x="325" y="54" width="225" height="114" rx="7" fill="rgba(30, 41, 59, 0.95)" stroke="#fbbf24" strokeWidth="1.8" />
      <text x="437" y="75" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="700">Coordinating Node Router</text>
      <text x="338" y="95" fill="#e2e8f0" fontSize="9.5">• Splits 10 MB payload by Shard</text>
      <text x="338" y="112" fill="#e2e8f0" fontSize="9.5">• Hash: Murmur3(_routing || _id)</text>
      <text x="338" y="129" fill="#e2e8f0" fontSize="9.5">• Backpressure: 429 on full queue</text>
      <text x="338" y="146" fill="#fbbf24" fontSize="9.5">• Retries ONLY failed item indices</text>

      <path d="M 556 110 L 620 110" stroke="#34d399" strokeWidth="2.2" fill="none" markerEnd="url(#os-bulk-green)" />
      <path d="M 556 110 L 620 110" className="interactive-diagram-flowing-path" stroke="#34d399" strokeWidth="2.2" fill="none" />

      {/* Primary Shard ID Check Comparison */}
      <rect x="630" y="54" width="218" height="114" rx="7" fill="rgba(6, 78, 59, 0.3)" stroke="#34d399" strokeWidth="1.8" />
      <text x="739" y="75" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Primary Shard Lucene Engine</text>
      <text x="642" y="95" fill="#34d399" fontSize="9.5">✓ Auto-ID / UUIDv7: Pure Append!</text>
      <text x="642" y="112" fill="#94a3b8" fontSize="9">   Skips segment _id bloom lookups</text>
      <text x="642" y="131" fill="#f87171" fontSize="9.5">✗ Random UUIDv4: Probes all FST</text>
      <text x="642" y="148" fill="#94a3b8" fontSize="9">   segments for existing _id (-45%)</text>

      {/* Bottom Section: Multi-Tenant Shard Routing */}
      <rect x="16" y="198" width="848" height="178" rx="8" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(56, 189, 248, 0.3)" />
      <text x="30" y="220" fill="#38bdf8" fontSize="12" fontWeight="700">
        MULTI-TENANT SHARD ROUTING (_routing=tenant_id): SCATTER-GATHER ELIMINATION & HOT-SHARD MITIGATION
      </text>

      {/* Tenant Query with Routing */}
      <rect x="30" y="236" width="225" height="122" rx="7" fill="rgba(30, 41, 59, 0.95)" stroke="#38bdf8" strokeWidth="1.8" />
      <text x="142" y="258" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="700">Tenant Query / Bulk Write</text>
      <text x="42" y="279" fill="#38bdf8" fontSize="9.5" fontFamily="monospace">GET /saas-docs/_search</text>
      <text x="42" y="295" fill="#34d399" fontSize="9.5" fontFamily="monospace">  ?routing=tenant_acme</text>
      <text x="42" y="316" fill="#e2e8f0" fontSize="9.5">Without routing: Hits ALL 30 shards</text>
      <text x="42" y="334" fill="#34d399" fontSize="9.5">With routing: Hits ONLY Shard 2!</text>

      {/* Targeted Arrow to Shard 2 */}
      <path d="M 261 296 L 368 296" stroke="#34d399" strokeWidth="2.5" fill="none" markerEnd="url(#os-bulk-green)" />
      <path d="M 261 296 L 368 296" className="interactive-diagram-flowing-path" stroke="#34d399" strokeWidth="2.5" fill="none" />

      {/* Shards Column */}
      <rect x="378" y="234" width="160" height="36" rx="5" fill="rgba(30, 41, 59, 0.5)" stroke="rgba(148, 163, 184, 0.25)" />
      <text x="458" y="256" textAnchor="middle" fill="#64748b" fontSize="10">Shard 0 &amp; 1 (Bypassed)</text>

      <rect x="378" y="278" width="160" height="40" rx="6" fill="rgba(6, 78, 59, 0.45)" stroke="#34d399" strokeWidth="2" />
      <text x="458" y="296" textAnchor="middle" fill="#34d399" fontSize="10.5" fontWeight="700">🎯 Shard 2 (tenant_acme)</text>
      <text x="458" y="311" textAnchor="middle" fill="#e2e8f0" fontSize="8.5">100% Tenant Locality</text>

      <rect x="378" y="326" width="160" height="36" rx="5" fill="rgba(30, 41, 59, 0.5)" stroke="rgba(148, 163, 184, 0.25)" />
      <text x="458" y="348" textAnchor="middle" fill="#64748b" fontSize="10">Shard 3..29 (Bypassed)</text>

      {/* Whale Tenant Defense */}
      <path d="M 544 298 L 594 298" stroke="#fbbf24" strokeWidth="2" fill="none" markerEnd="url(#os-bulk-amber)" />

      <rect x="604" y="236" width="244" height="122" rx="7" fill="rgba(120, 53, 15, 0.25)" stroke="#fbbf24" strokeWidth="1.6" />
      <text x="726" y="258" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="700">Whale Tenant Skew Guard</text>
      <text x="616" y="278" fill="#e2e8f0" fontSize="9.5">What if 1 tenant = 60% of data?</text>
      <text x="616" y="296" fill="#fbbf24" fontSize="9" fontFamily="monospace">index.routing_partition_size: 4</text>
      <text x="616" y="315" fill="#e2e8f0" fontSize="9.5">Spreads each tenant across a</text>
      <text x="616" y="331" fill="#e2e8f0" fontSize="9.5">contiguous subset of 4 shards instead</text>
      <text x="616" y="347" fill="#e2e8f0" fontSize="9.5">of overloading a single hot shard!</text>
    </svg>
  );

  const renderSchemaReindexSvg = () => (
    <svg
      viewBox="0 0 880 390"
      style={{
        width: '100%',
        height: 'auto',
        background: '#0d0f1e',
        borderRadius: '10px',
        border: '1px solid rgba(251, 191, 36, 0.25)',
      }}
    >
      <defs>
        <pattern id="os-bp-grid-3" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="rgba(148, 163, 184, 0.12)" />
        </pattern>
        <marker id="os-reindex-amber" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" />
        </marker>
        <marker id="os-reindex-green" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#34d399" />
        </marker>
        <marker id="os-reindex-cyan" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
        </marker>
      </defs>

      <rect width="880" height="390" fill="url(#os-bp-grid-3)" />

      {/* Top Section: Zero-Downtime Alias + Sliced Reindex */}
      <rect x="16" y="14" width="848" height="190" rx="8" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(251, 191, 36, 0.3)" />
      <text x="30" y="36" fill="#fbbf24" fontSize="12" fontWeight="700">
        ZERO-DOWNTIME SCHEMA EVOLUTION: READ / WRITE ALIAS ABSTRACTION + PARALLEL SLICED _reindex
      </text>

      {/* Microservice App */}
      <rect x="30" y="65" width="180" height="115" rx="7" fill="rgba(30, 41, 59, 0.95)" stroke="#38bdf8" strokeWidth="1.8" />
      <text x="120" y="88" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="700">Order Microservice</text>
      <text x="42" y="110" fill="#e2e8f0" fontSize="9.5">Never hardcodes physical</text>
      <text x="42" y="125" fill="#e2e8f0" fontSize="9.5">index name (orders_v1)!</text>
      <text x="42" y="146" fill="#38bdf8" fontSize="9.5" fontFamily="monospace">Reads: orders_read</text>
      <text x="42" y="162" fill="#34d399" fontSize="9.5" fontFamily="monospace">Writes: orders_write</text>

      <path d="M 216 122 L 285 122" stroke="#38bdf8" strokeWidth="2.2" fill="none" markerEnd="url(#os-reindex-cyan)" />
      <path d="M 216 122 L 285 122" className="interactive-diagram-flowing-path" stroke="#38bdf8" strokeWidth="2.2" fill="none" />

      {/* Alias Layer */}
      <rect x="295" y="55" width="200" height="132" rx="7" fill="rgba(120, 53, 15, 0.25)" stroke="#fbbf24" strokeWidth="1.8" />
      <text x="395" y="76" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="700">Atomic _aliases Pointer</text>
      <text x="308" y="98" fill="#e2e8f0" fontSize="9.5">POST /_aliases (Atomic Swap):</text>
      <text x="308" y="116" fill="#f87171" fontSize="9" fontFamily="monospace">- remove: orders_v1</text>
      <text x="308" y="132" fill="#34d399" fontSize="9" fontFamily="monospace">+ add:    orders_v2</text>
      <text x="308" y="152" fill="#94a3b8" fontSize="9">Zero app restarts or downtime;</text>
      <text x="308" y="167" fill="#94a3b8" fontSize="9">ClusterState updates in &lt;5 ms</text>

      {/* Arrow to Old Index v1 and New Index v2 */}
      <path d="M 501 92 L 580 78" stroke="#94a3b8" strokeWidth="1.6" strokeDasharray="4 4" fill="none" />
      <path d="M 501 148 L 580 156" stroke="#34d399" strokeWidth="2.2" fill="none" markerEnd="url(#os-reindex-green)" />
      <path d="M 501 148 L 580 156" className="interactive-diagram-flowing-path" stroke="#34d399" strokeWidth="2.2" fill="none" />

      {/* orders_v1 */}
      <rect x="590" y="48" width="255" height="58" rx="6" fill="rgba(30, 41, 59, 0.85)" stroke="rgba(148, 163, 184, 0.4)" />
      <text x="717" y="68" textAnchor="middle" fill="#94a3b8" fontSize="10.5" fontWeight="700">orders_v1 (Legacy Mapping)</text>
      <text x="717" y="86" textAnchor="middle" fill="#e2e8f0" fontSize="9" fontFamily="monospace">status: text (broken sorting)</text>

      {/* Sliced Reindex Flow between v1 and v2 */}
      <path d="M 717 110 L 717 128" stroke="#fbbf24" strokeWidth="2.2" fill="none" markerEnd="url(#os-reindex-amber)" />
      <path d="M 717 110 L 717 128" className="interactive-diagram-flowing-path" stroke="#fbbf24" strokeWidth="2.2" fill="none" />
      <text x="728" y="123" fill="#fbbf24" fontSize="9" fontWeight="700">_reindex?slices=auto</text>

      {/* orders_v2 */}
      <rect x="590" y="134" width="255" height="58" rx="6" fill="rgba(6, 78, 59, 0.35)" stroke="#34d399" strokeWidth="1.8" />
      <text x="717" y="154" textAnchor="middle" fill="#34d399" fontSize="10.5" fontWeight="700">orders_v2 (Corrected Mapping)</text>
      <text x="717" y="172" textAnchor="middle" fill="#e2e8f0" fontSize="9" fontFamily="monospace">status: keyword (DocValues enabled)</text>

      {/* Bottom Section: Object vs Nested vs flat_object */}
      <rect x="16" y="216" width="848" height="160" rx="8" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(167, 139, 250, 0.3)" />
      <text x="30" y="238" fill="#a78bfa" fontSize="12" fontWeight="700">
        MAPPING OBJECT ARRAYS: STANDARD OBJECT FLATTENING TRAP vs. NESTED vs. FLAT_OBJECT
      </text>

      <rect x="30" y="250" width="265" height="112" rx="6" fill="rgba(127, 29, 29, 0.22)" stroke="#f87171" />
      <text x="42" y="270" fill="#f87171" fontSize="10.5" fontWeight="700">1. Standard object Array (Flattened)</text>
      <text x="42" y="288" fill="#e2e8f0" fontSize="9" fontFamily="monospace">{`[{"name":"Alice","role":"admin"},`}</text>
      <text x="42" y="302" fill="#e2e8f0" fontSize="9" fontFamily="monospace">{` {"name":"Bob","role":"viewer"}]`}</text>
      <text x="42" y="320" fill="#fca5a5" fontSize="9">Indexed as: name=[Alice,Bob], role=[admin,viewer]</text>
      <text x="42" y="336" fill="#f87171" fontSize="9" fontWeight="700">❌ False Match: Bob + admin returns TRUE!</text>

      <rect x="308" y="250" width="265" height="112" rx="6" fill="rgba(6, 78, 59, 0.25)" stroke="#34d399" />
      <text x="320" y="270" fill="#34d399" fontSize="10.5" fontWeight="700">2. type: "nested" (Correlated Objects)</text>
      <text x="320" y="288" fill="#e2e8f0" fontSize="9">Stores each array element as a hidden</text>
      <text x="320" y="303" fill="#e2e8f0" fontSize="9">separate Lucene child document in segment.</text>
      <text x="320" y="321" fill="#34d399" fontSize="9" fontWeight="700">✅ Preserves exact Alice=admin correlation</text>
      <text x="320" y="338" fill="#fbbf24" fontSize="8.5">⚠️ 1 parent + 50 items = 51 Lucene docs!</text>

      <rect x="586" y="250" width="264" height="112" rx="6" fill="rgba(30, 41, 59, 0.9)" stroke="#38bdf8" />
      <text x="598" y="270" fill="#38bdf8" fontSize="10.5" fontWeight="700">3. type: "flat_object" (Dynamic Maps)</text>
      <text x="598" y="288" fill="#e2e8f0" fontSize="9">For arbitrary JSON labels/tags/attributes</text>
      <text x="598" y="303" fill="#e2e8f0" fontSize="9">where keys are unknown at design time.</text>
      <text x="598" y="321" fill="#38bdf8" fontSize="9" fontWeight="700">✅ Prevents ClusterState Mapping Explosion</text>
      <text x="598" y="338" fill="#94a3b8" fontSize="8.5">Supports exact dot-path &amp; value queries</text>
    </svg>
  );

  const renderHybridKnnSvg = () => (
    <svg
      viewBox="0 0 880 390"
      style={{
        width: '100%',
        height: 'auto',
        background: '#0d0f1e',
        borderRadius: '10px',
        border: '1px solid rgba(167, 139, 250, 0.25)',
      }}
    >
      <defs>
        <pattern id="os-bp-grid-4" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="rgba(148, 163, 184, 0.12)" />
        </pattern>
        <marker id="os-knn-purple" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#a78bfa" />
        </marker>
        <marker id="os-knn-cyan" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
        </marker>
        <marker id="os-knn-green" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#34d399" />
        </marker>
      </defs>

      <rect width="880" height="390" fill="url(#os-bp-grid-4)" />

      <text x="24" y="30" fill="#a78bfa" fontSize="12.5" fontWeight="700">
        OPENSEARCH HYBRID SEARCH PIPELINE: LEXICAL BM25 + EFFICIENT PRE-FILTERED k-NN (HNSW) + SCORE NORMALIZATION
      </text>

      {/* Hybrid Query Input */}
      <rect x="24" y="95" width="185" height="175" rx="8" fill="rgba(30, 41, 59, 0.95)" stroke="#38bdf8" strokeWidth="1.8" />
      <text x="116" y="120" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="700">Hybrid Query Request</text>
      <text x="36" y="142" fill="#38bdf8" fontSize="9" fontFamily="monospace">query: {'{'}</text>
      <text x="44" y="157" fill="#34d399" fontSize="9" fontFamily="monospace">hybrid: {'{'}</text>
      <text x="52" y="172" fill="#e2e8f0" fontSize="8.5" fontFamily="monospace">queries: [</text>
      <text x="58" y="187" fill="#fbbf24" fontSize="8.5" fontFamily="monospace">1. bool (BM25 + filter)</text>
      <text x="58" y="202" fill="#a78bfa" fontSize="8.5" fontFamily="monospace">2. knn (768-d vector)</text>
      <text x="52" y="217" fill="#e2e8f0" fontSize="8.5" fontFamily="monospace">]</text>
      <text x="44" y="232" fill="#34d399" fontSize="9" fontFamily="monospace">{'}'}</text>
      <text x="36" y="247" fill="#38bdf8" fontSize="9" fontFamily="monospace">{'}'}</text>

      {/* Split Paths */}
      <path d="M 215 145 L 285 95" stroke="#38bdf8" strokeWidth="2.2" fill="none" markerEnd="url(#os-knn-cyan)" />
      <path d="M 215 145 L 285 95" className="interactive-diagram-flowing-path" stroke="#38bdf8" strokeWidth="2.2" fill="none" />

      <path d="M 215 215 L 285 255" stroke="#a78bfa" strokeWidth="2.2" fill="none" markerEnd="url(#os-knn-purple)" />
      <path d="M 215 215 L 285 255" className="interactive-diagram-flowing-path" stroke="#a78bfa" strokeWidth="2.2" fill="none" />

      {/* Branch 1: Lexical BM25 */}
      <rect x="295" y="48" width="265" height="115" rx="8" fill="rgba(15, 23, 42, 0.9)" stroke="#38bdf8" strokeWidth="1.8" />
      <text x="427" y="70" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">Sub-Query 1: Lexical BM25</text>
      <text x="308" y="90" fill="#e2e8f0" fontSize="9.5">• Exact SKU, error code &amp; keyword match</text>
      <text x="308" y="107" fill="#e2e8f0" fontSize="9.5">• FST Term Dictionary + Roaring Bitmaps</text>
      <text x="308" y="124" fill="#fbbf24" fontSize="9.5">• Raw Unbounded Score: [0.0 .. 42.8]</text>
      <text x="308" y="143" fill="#94a3b8" fontSize="9">Strengths: Exact identifiers, rare tokens</text>

      {/* Branch 2: k-NN HNSW Vector with Pre-Filter */}
      <rect x="295" y="195" width="265" height="145" rx="8" fill="rgba(15, 23, 42, 0.9)" stroke="#a78bfa" strokeWidth="1.8" />
      <text x="427" y="217" textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="700">Sub-Query 2: k-NN HNSW Vector</text>
      <text x="308" y="237" fill="#e2e8f0" fontSize="9.5">• Engine: FAISS / Lucene HNSW Graph</text>
      <text x="308" y="254" fill="#34d399" fontSize="9.5">• Efficient Pre-Filter (Bitmap applied</text>
      <text x="308" y="269" fill="#34d399" fontSize="9.5">  DURING graph traversal, not post-hoc!)</text>
      <text x="308" y="287" fill="#e2e8f0" fontSize="9.5">• Quantization: fp16 / int8 scalar (4x less RAM)</text>
      <text x="308" y="305" fill="#a78bfa" fontSize="9.5">• Raw Cosine Score: [0.0 .. 1.0]</text>
      <text x="308" y="323" fill="#94a3b8" fontSize="9">Strengths: Semantic intent, synonyms</text>

      {/* Converge into Search Normalization Pipeline */}
      <path d="M 566 105 L 626 155" stroke="#38bdf8" strokeWidth="2.2" fill="none" markerEnd="url(#os-knn-cyan)" />
      <path d="M 566 105 L 626 155" className="interactive-diagram-flowing-path" stroke="#38bdf8" strokeWidth="2.2" fill="none" />

      <path d="M 566 260 L 626 205" stroke="#a78bfa" strokeWidth="2.2" fill="none" markerEnd="url(#os-knn-purple)" />
      <path d="M 566 260 L 626 205" className="interactive-diagram-flowing-path" stroke="#a78bfa" strokeWidth="2.2" fill="none" />

      {/* Normalization / RRF Processor */}
      <rect x="636" y="88" width="222" height="190" rx="8" fill="rgba(6, 78, 59, 0.3)" stroke="#34d399" strokeWidth="2" />
      <text x="747" y="112" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Search Pipeline Processor</text>
      <text x="648" y="134" fill="#ffffff" fontSize="9.5" fontWeight="600">Option A: min_max / l2 Norm</text>
      <text x="648" y="150" fill="#e2e8f0" fontSize="9">Scales both to [0.0, 1.0], then</text>
      <text x="648" y="165" fill="#34d399" fontSize="9" fontFamily="monospace">0.3 * BM25 + 0.7 * kNN</text>
      <line x1="648" y1="180" x2="844" y2="180" stroke="rgba(148, 163, 184, 0.25)" />
      <text x="648" y="198" fill="#ffffff" fontSize="9.5" fontWeight="600">Option B: RRF (Reciprocal Rank)</text>
      <text x="648" y="214" fill="#e2e8f0" fontSize="9" fontFamily="monospace">score = Σ 1 / (60 + rank_i)</text>
      <text x="648" y="232" fill="#94a3b8" fontSize="9">Zero weight tuning required;</text>
      <text x="648" y="247" fill="#94a3b8" fontSize="9">executes inside OpenSearch node!</text>
    </svg>
  );

  return (
    <div
      className="interactive-diagram-container"
      style={{
        fontFamily: 'var(--ifm-font-family-base)',
        background: '#0b0f19',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '12px',
        padding: '1.25rem',
        margin: '1.5rem 0',
        color: '#f8fafc',
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .os-bp-split-grid {
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
          gap: '0.75rem',
          marginBottom: '1rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid rgba(148, 163, 184, 0.18)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={currentMode.accent} strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <path d="M8 11h6" />
            <path d="M11 8v6" />
          </svg>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#ffffff' }}>
              OpenSearch Engineering &amp; Usage Playbook Explorer
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{currentMode.subtitle}</div>
          </div>
        </div>

        {/* Mode Switcher */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {MODES.map((m) => {
            const isActive = m.id === activeMode;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveMode(m.id)}
                style={{
                  background: isActive ? 'rgba(56, 189, 248, 0.16)' : 'rgba(15, 23, 42, 0.85)',
                  color: isActive ? m.accent : '#cbd5e1',
                  border: `1px solid ${isActive ? m.accent : 'rgba(148, 163, 184, 0.25)'}`,
                  borderRadius: '6px',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.76rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main SVG Canvas */}
      <div style={{ marginBottom: '1.1rem' }}>
        {activeMode === 'query-execution'
          ? renderQueryExecutionSvg()
          : activeMode === 'bulk-routing'
            ? renderBulkRoutingSvg()
            : activeMode === 'schema-reindex'
              ? renderSchemaReindexSvg()
              : renderHybridKnnSvg()}
      </div>

      {/* Bottom Interactive Anti-Pattern vs. Principal Pattern Inspector */}
      <div
        className="os-bp-split-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '44% 54%',
          justifyContent: 'space-between',
          alignItems: 'start',
          gap: '1rem',
        }}
      >
        {/* Left Selector List */}
        <div
          style={{
            background: '#0c0e17',
            borderRadius: '8px',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            padding: '0.75rem',
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            High-Impact OpenSearch Usage Rules
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {PRACTICE_PATTERNS.map((item) => {
              const isSelected = item.id === selectedPattern.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedPatternId(item.id)}
                  style={{
                    textAlign: 'left',
                    background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15, 23, 42, 0.7)',
                    border: `1px solid ${isSelected ? item.accent : 'rgba(148, 163, 184, 0.2)'}`,
                    borderRadius: '6px',
                    padding: '0.5rem 0.65rem',
                    cursor: 'pointer',
                    color: '#f8fafc',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isSelected ? item.accent : '#e2e8f0' }}>
                      {item.title}
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                        background: 'rgba(52, 211, 153, 0.15)',
                        color: '#34d399',
                        fontWeight: 600,
                      }}
                    >
                      {item.category}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Detail Card */}
        <div
          style={{
            background: '#0c0e17',
            borderRadius: '8px',
            border: `1px solid ${selectedPattern.accent}`,
            padding: '0.9rem 1rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.55rem' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff' }}>
              {selectedPattern.title}
            </span>
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#34d399',
                background: 'rgba(52, 211, 153, 0.14)',
                border: '1px solid rgba(52, 211, 153, 0.4)',
                borderRadius: '999px',
                padding: '0.15rem 0.6rem',
              }}
            >
              {selectedPattern.impactMetric}
            </span>
          </div>

          <div style={{ fontSize: '0.8rem', color: '#fca5a5', marginBottom: '0.35rem' }}>
            <strong>❌ Common Mistake:</strong> {selectedPattern.antiPattern}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#6ee7b7', marginBottom: '0.55rem' }}>
            <strong>✅ Effective Pattern:</strong> {selectedPattern.bestPractice}
          </div>
          <div
            style={{
              fontSize: '0.79rem',
              color: '#cbd5e1',
              background: 'rgba(15, 23, 42, 0.85)',
              padding: '0.55rem 0.7rem',
              borderRadius: '6px',
              borderLeft: `3px solid ${selectedPattern.accent}`,
            }}
          >
            <strong>Under-the-Hood Lucene Reason:</strong> {selectedPattern.engineReason}
          </div>
        </div>
      </div>
    </div>
  );
}
