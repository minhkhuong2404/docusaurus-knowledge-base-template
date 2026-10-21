import React, { useState } from 'react';

type SystemDesignTab = 'hybrid-search' | 'write-path' | 'filtering' | 'selection';

interface TabDetail {
  id: SystemDesignTab;
  title: string;
  badge: string;
  color: string;
  summary: string;
}

const TABS: TabDetail[] = [
  {
    id: 'hybrid-search',
    title: 'Hybrid Search & RRF Pipeline',
    badge: 'Dense + Sparse + Reranker',
    color: '#38bdf8',
    summary: 'Combines Dense Vector ANN (semantic conceptual search) with Sparse Lexical BM25 (exact keyword & identifier search) merged via Reciprocal Rank Fusion (RRF).'
  },
  {
    id: 'write-path',
    title: 'Vector DB LSM Write Path',
    badge: 'Real-time Ingestion & Compaction',
    color: '#34d399',
    summary: 'How vector engines ingest high-velocity writes without stalling read latency: WAL + MemTable live buffer + background HNSW segment builder + federated search fan-out.'
  },
  {
    id: 'filtering',
    title: 'Single-Stage Bitset Filtering',
    badge: 'Prevent Empty Results & Graph Drift',
    color: '#fbbf24',
    summary: 'Contrasting naive Post-Filtering (empty result trap) and Pre-Filtering (HNSW graph disconnection) with modern Bitset-masked single-stage graph traversal.'
  },
  {
    id: 'selection',
    title: 'System Design Selection Rubric',
    badge: 'pgvector vs ES vs Dedicated',
    color: '#a78bfa',
    summary: 'A Principal Engineer decision matrix: choosing between integrated pgvector, enterprise Elasticsearch/OpenSearch, and dedicated engines (Milvus/Qdrant/Pinecone).'
  }
];

export default function VectorSystemDesignDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<SystemDesignTab>('hybrid-search');

  const currentTab = TABS.find(t => t.id === activeTab) || TABS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .vsd-split-grid { grid-template-columns: 1fr !important; }
          .vsd-pipeline-step { min-width: 100% !important; }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        <span style={{ fontSize: '15px', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.02em' }}>
          Vector Database System Design: Architecture & Production Patterns
        </span>
        <span style={{
          marginLeft: 'auto',
          fontSize: '11px',
          fontWeight: 700,
          background: 'rgba(56, 189, 248, 0.12)',
          color: '#38bdf8',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          padding: '2px 8px',
          borderRadius: '4px'
        }}>
          Staff Interview Spec
        </span>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '12px 16px',
        borderBottom: '1px solid #1e293b',
        background: '#090b14'
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: activeTab === tab.id ? `1.5px solid ${tab.color}` : '1px solid #334155',
              background: activeTab === tab.id ? 'rgba(56, 189, 248, 0.15)' : '#0f172a',
              color: activeTab === tab.id ? '#ffffff' : '#94a3b8',
              fontSize: '12.5px',
              fontWeight: activeTab === tab.id ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: tab.color }} />
            {tab.title}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div style={{ padding: '20px', background: '#0b0f19' }}>
        
        {/* Tab 1: HYBRID SEARCH PIPELINE */}
        {activeTab === 'hybrid-search' && (
          <div>
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#38bdf8', fontWeight: 800 }}>
                  Hybrid Retrieval: Sparse BM25 + Dense Vector ANN + Cross-Encoder Reranker
                </h4>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#94a3b8' }}>
                  Eliminates exact token blindness (part numbers, error codes) while preserving high-level semantic generalization.
                </p>
              </div>
              <span style={{ fontSize: '11px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                Production Gold Standard
              </span>
            </div>

            {/* Visual SVG Flow */}
            <div style={{ background: '#0d0f1e', borderRadius: '8px', border: '1px solid #1e293b', padding: '16px', marginBottom: '16px' }}>
              <svg viewBox="0 0 760 210" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="vsd-arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#38bdf8" />
                  </marker>
                  <marker id="vsd-arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#34d399" />
                  </marker>
                  <marker id="vsd-arrow-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#fbbf24" />
                  </marker>
                </defs>

                {/* Input Query */}
                <rect x="15" y="80" width="130" height="50" rx="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="80" y="102" fill="#ffffff" fontSize="12" fontWeight="700" textAnchor="middle">User Query</text>
                <text x="80" y="118" fill="#94a3b8" fontSize="10" textAnchor="middle">"Fix ERR-4091 latency"</text>

                {/* Fork to Dense & Sparse */}
                <path d="M 145 95 L 185 95 L 185 55 L 225 55" fill="none" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#vsd-arrow-blue)" />
                <path d="M 145 115 L 185 115 L 185 155 L 225 155" fill="none" stroke="#34d399" strokeWidth="1.5" markerEnd="url(#vsd-arrow-green)" />

                {/* Dense Branch */}
                <rect x="230" y="30" width="165" height="50" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="312" y="52" fill="#38bdf8" fontSize="11" fontWeight="700" textAnchor="middle">Dense Embedding (HNSW)</text>
                <text x="312" y="68" fill="#94a3b8" fontSize="9.5" textAnchor="middle">Top-50 Semantic Candidates</text>

                {/* Sparse Branch */}
                <rect x="230" y="130" width="165" height="50" rx="8" fill="#0f172a" stroke="#34d399" strokeWidth="1.5" />
                <text x="312" y="152" fill="#34d399" fontSize="11" fontWeight="700" textAnchor="middle">Sparse Inverted Index (BM25)</text>
                <text x="312" y="168" fill="#94a3b8" fontSize="9.5" textAnchor="middle">Top-50 Exact Lexical Match</text>

                {/* Confluence to RRF */}
                <path d="M 395 55 L 435 55 L 435 95 L 455 95" fill="none" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#vsd-arrow-blue)" />
                <path d="M 395 155 L 435 155 L 435 115 L 455 115" fill="none" stroke="#34d399" strokeWidth="1.5" markerEnd="url(#vsd-arrow-green)" />

                {/* RRF Merge Box */}
                <rect x="460" y="75" width="135" height="60" rx="8" fill="#0f172a" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="527" y="98" fill="#fbbf24" fontSize="11" fontWeight="800" textAnchor="middle">RRF Fusion Merge</text>
                <text x="527" y="114" fill="#cbd5e1" fontSize="9.5" textAnchor="middle">k = 60 Score Normalizer</text>
                <text x="527" y="126" fill="#94a3b8" fontSize="9" textAnchor="middle">Top-30 Unified Ranks</text>

                {/* Arrow to Cross-Encoder */}
                <path d="M 595 105 L 625 105" fill="none" stroke="#fbbf24" strokeWidth="1.5" markerEnd="url(#vsd-arrow-amber)" />

                {/* Cross-Encoder Box */}
                <rect x="630" y="75" width="115" height="60" rx="8" fill="#1e1b4b" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="687" y="98" fill="#c084fc" fontSize="11" fontWeight="800" textAnchor="middle">Cross-Encoder</text>
                <text x="687" y="113" fill="#cbd5e1" fontSize="9" textAnchor="middle">Deep Attention Rerank</text>
                <text x="687" y="126" fill="#4ade80" fontSize="9" fontWeight="700" textAnchor="middle">Final Top-5 to LLM</text>
              </svg>
            </div>

            {/* Detail Explanation Cards */}
            <div className="vsd-split-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '12px' }}>
              <div style={{ background: '#0c0e17', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
                  1. The Inadequacy of Pure Vector Search
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
                  Embedding models map sentences to continuous spaces. However, high-dimensional projections struggle with:
                  <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                    <li>Exact codes: <code>ERR-4091</code>, <code>SKU-89412</code>, <code>uuidv7</code></li>
                    <li>Rare product names or acronyms not seen frequently in training corpus</li>
                    <li>Negative constraints: <em>"Find databases that do NOT use locks"</em></li>
                  </ul>
                </div>
              </div>

              <div style={{ background: '#0c0e17', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fbbf24', marginBottom: '6px' }}>
                  2. Reciprocal Rank Fusion (RRF) Formula
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
                  Avoids incomparable raw score scales (Cosine [0,1] vs BM25 [0, &infin;]) by scoring solely on positional rank:
                  <div style={{ background: '#090b14', padding: '6px 10px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px', margin: '6px 0', border: '1px solid #334155', color: '#facc15' }}>
                    RRF_Score(d) = &sum; [1 / (60 + rank_m(d))]
                  </div>
                  Items appearing in the top results of <em>both</em> dense and sparse indexes receive an exponential boost.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: LSM WRITE PATH */}
        {activeTab === 'write-path' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#34d399', fontWeight: 800 }}>
                High-Throughput Vector Write Path: LSM-Tree Multi-Segment Architecture
              </h4>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#94a3b8' }}>
                Inserting directly into a production HNSW graph causes lock contention and CPU thrashing. Engines use append-only WAL + in-memory buffers + background index merges.
              </p>
            </div>

            {/* Visual SVG Write Path */}
            <div style={{ background: '#0d0f1e', borderRadius: '8px', border: '1px solid #1e293b', padding: '16px', marginBottom: '16px' }}>
              <svg viewBox="0 0 760 220" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="vsd-arrow-mint" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#34d399" />
                  </marker>
                  <marker id="vsd-arrow-cyan" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#38bdf8" />
                  </marker>
                </defs>

                {/* Mutation Request */}
                <rect x="15" y="80" width="115" height="50" rx="8" fill="#1e293b" stroke="#34d399" strokeWidth="1.5" />
                <text x="72" y="103" fill="#ffffff" fontSize="11.5" fontWeight="700" textAnchor="middle">Insert / Update</text>
                <text x="72" y="118" fill="#94a3b8" fontSize="9.5" textAnchor="middle">Vector + Metadata</text>

                {/* Arrow to WAL & MemTable */}
                <path d="M 130 95 L 165 95 L 165 50 L 195 50" fill="none" stroke="#34d399" strokeWidth="1.5" markerEnd="url(#vsd-arrow-mint)" />
                <path d="M 130 115 L 165 115 L 165 155 L 195 155" fill="none" stroke="#34d399" strokeWidth="1.5" markerEnd="url(#vsd-arrow-mint)" />

                {/* WAL */}
                <rect x="200" y="25" width="140" height="50" rx="8" fill="#0f172a" stroke="#f87171" strokeWidth="1.5" />
                <text x="270" y="47" fill="#f87171" fontSize="11" fontWeight="700" textAnchor="middle">Write-Ahead Log (WAL)</text>
                <text x="270" y="63" fill="#94a3b8" fontSize="9.5" textAnchor="middle">Sequential Disk Append (Crash Durability)</text>

                {/* Active MemTable */}
                <rect x="200" y="130" width="140" height="50" rx="8" fill="#0f172a" stroke="#34d399" strokeWidth="1.5" />
                <text x="270" y="152" fill="#34d399" fontSize="11" fontWeight="700" textAnchor="middle">Active MemTable</text>
                <text x="270" y="168" fill="#94a3b8" fontSize="9.5" textAnchor="middle">Unindexed Buffer (Brute-Force SIMD)</text>

                {/* Arrow to Freeze/Flush */}
                <path d="M 340 155 L 385 155" fill="none" stroke="#34d399" strokeWidth="1.5" markerEnd="url(#vsd-arrow-mint)" />

                {/* Frozen Segment */}
                <rect x="390" y="130" width="130" height="50" rx="8" fill="#0f172a" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="455" y="152" fill="#fbbf24" fontSize="11" fontWeight="700" textAnchor="middle">Frozen Segment</text>
                <text x="455" y="168" fill="#94a3b8" fontSize="9.5" textAnchor="middle">500k Rows (Read-Only)</text>

                {/* Background Compactor Arrow */}
                <path d="M 520 155 L 565 155" fill="none" stroke="#fbbf24" strokeWidth="1.5" markerEnd="url(#vsd-arrow-mint)" />

                {/* Background Indexer Box */}
                <rect x="570" y="105" width="175" height="95" rx="8" fill="#090b14" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 3" />
                <text x="657" y="127" fill="#38bdf8" fontSize="11" fontWeight="800" textAnchor="middle">Async Indexing Worker</text>
                <text x="657" y="145" fill="#cbd5e1" fontSize="9.5" textAnchor="middle">&bull; Builds Immutable HNSW Graph</text>
                <text x="657" y="161" fill="#cbd5e1" fontSize="9.5" textAnchor="middle">&bull; Performs SQ8/PQ Quantization</text>
                <text x="657" y="177" fill="#cbd5e1" fontSize="9.5" textAnchor="middle">&bull; Writes Final Segment to Disk</text>

                {/* Query Federation Note */}
                <rect x="390" y="25" width="355" height="55" rx="8" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1" />
                <text x="567" y="47" fill="#c7d2fe" fontSize="11" fontWeight="700" textAnchor="middle">Federated Query Execution (Scatter-Gather)</text>
                <text x="567" y="65" fill="#94a3b8" fontSize="9.5" textAnchor="middle">Query hops across all Immutable HNSW Segments + scans live MemTable, merging candidate heaps.</text>
              </svg>
            </div>

            {/* Explanation Grid */}
            <div className="vsd-split-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '12px' }}>
              <div style={{ background: '#0c0e17', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', marginBottom: '6px' }}>
                  Why In-Place Graph Updates Fail in Production
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
                  Each vector insertion into an existing HNSW graph requires traversing layers, finding $M$ nearest neighbors, and taking bidirectional write locks on edge lists. Under 5,000 writes/sec, this creates extreme lock contention and cache eviction storms.
                </div>
              </div>

              <div style={{ background: '#0c0e17', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
                  The Multi-Segment Scatter-Gather Solution
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
                  Modern engines (Milvus, Qdrant, Pinecone, Lucene) treat segments as <strong>immutable</strong>. Segments are built offline by dedicated background worker threads without taking locks on query paths. Queries search immutable segments concurrently with zero lock overhead.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: FILTERING STRATEGIES */}
        {activeTab === 'filtering' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#fbbf24', fontWeight: 800 }}>
                Metadata Filtering: Post-Filtering vs Pre-Filtering vs Single-Stage Bitset Traversal
              </h4>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#94a3b8' }}>
                Query: <em>"Find top-5 chunks similar to X WHERE tenant_id = 'org_42' AND price &lt; $50"</em>
              </p>
            </div>

            {/* 3-Column Comparative Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              {/* Post-Filtering */}
              <div style={{ background: '#0d0f1e', border: '1px solid #f87171', borderRadius: '8px', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#f87171' }}>1. Post-Filtering</span>
                  <span style={{ fontSize: '10px', background: 'rgba(248, 113, 113, 0.2)', color: '#f87171', padding: '2px 6px', borderRadius: '4px' }}>Flawed</span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#cbd5e1', lineHeight: '1.45', marginBottom: '10px' }}>
                  1. Run standard HNSW search to fetch top-1,000 vectors globally.<br />
                  2. Discard candidates that fail <code>tenant_id = 'org_42'</code>.
                </div>
                <div style={{ background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.3)', borderRadius: '6px', padding: '8px', fontSize: '11px', color: '#fca5a5' }}>
                  <strong>The Empty Result Trap:</strong> If tenant owns only 0.1% of data, all 1,000 candidates get discarded. Returns 0 results even though valid items exist!
                </div>
              </div>

              {/* Naive Pre-Filtering */}
              <div style={{ background: '#0d0f1e', border: '1px solid #fbbf24', borderRadius: '8px', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24' }}>2. Naive Pre-Filtering</span>
                  <span style={{ fontSize: '10px', background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', padding: '2px 6px', borderRadius: '4px' }}>Degraded</span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#cbd5e1', lineHeight: '1.45', marginBottom: '10px' }}>
                  1. Filter relational index first to get allowed ID list.<br />
                  2. Skip all non-matching nodes during graph traversal.
                </div>
                <div style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '6px', padding: '8px', fontSize: '11px', color: '#fde68a' }}>
                  <strong>Graph Disconnection Trap:</strong> Skipping non-matching nodes breaks highway edges. Graph becomes disconnected; greedy walk gets trapped in local minima (recall drops &lt;30%).
                </div>
              </div>

              {/* Single-Stage Bitset */}
              <div style={{ background: '#0d0f1e', border: '1px solid #34d399', borderRadius: '8px', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#34d399' }}>3. Single-Stage Bitset</span>
                  <span style={{ fontSize: '10px', background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', padding: '2px 6px', borderRadius: '4px' }}>Principal Choice</span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#cbd5e1', lineHeight: '1.45', marginBottom: '10px' }}>
                  1. Precompute 64-bit Roaring Bitset of allowed IDs.<br />
                  2. Traverse graph normally; non-matching nodes act as routing bridges but are excluded from top-k score heap.
                </div>
                <div style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '6px', padding: '8px', fontSize: '11px', color: '#86efac' }}>
                  <strong>Optimal Recall &amp; Speed:</strong> Graph connectivity is preserved, and bitwise checking takes 1 CPU cycle per candidate. Supported in Qdrant, Milvus, and pgvector 0.7+.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: SYSTEM DESIGN SELECTION RUBRIC */}
        {activeTab === 'selection' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#a78bfa', fontWeight: 800 }}>
                System Design Interview Selection Rubric: The "Senior Move"
              </h4>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#94a3b8' }}>
                Do not propose a standalone vector DB like Pinecone on question #1. Justify your architectural choice by scale, operational boundaries, and transactional guarantees.
              </p>
            </div>

            <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#0f172a', borderBottom: '2px solid #1e293b' }}>
                    <th style={{ padding: '10px', textAlign: 'left', color: '#38bdf8' }}>Architecture Choice</th>
                    <th style={{ padding: '10px', textAlign: 'left', color: '#34d399' }}>Ideal Scale / Invariants</th>
                    <th style={{ padding: '10px', textAlign: 'left', color: '#fbbf24' }}>Primary Strengths</th>
                    <th style={{ padding: '10px', textAlign: 'left', color: '#f87171' }}>Architectural Limitations</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '10px', fontWeight: 700, color: '#38bdf8' }}>pgvector (PostgreSQL)</td>
                    <td style={{ padding: '10px', color: '#cbd5e1' }}>&lt; 5M–10M vectors; &lt; 1,000 QPS; already using Postgres</td>
                    <td style={{ padding: '10px', color: '#86efac' }}>Single source of truth; ACID multi-table joins; zero dual-write synchronization bugs; unified WAL backups.</td>
                    <td style={{ padding: '10px', color: '#fca5a5' }}>Monolithic vertical scaling; high vector index build times can stall table VACUUM; memory bound to Postgres buffer pool.</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '10px', fontWeight: 700, color: '#fbbf24' }}>Elasticsearch / OpenSearch</td>
                    <td style={{ padding: '10px', color: '#cbd5e1' }}>10M–50M vectors; heavy keyword search infrastructure already deployed</td>
                    <td style={{ padding: '10px', color: '#86efac' }}>Native BM25 + dense vector hybrid search; mature cluster sharding; enterprise RBAC and lifecycle management.</td>
                    <td style={{ padding: '10px', color: '#fca5a5' }}>Heavy JVM GC overhead; high memory consumption; vector search p99 latency is higher than specialized C++/Rust vector engines.</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '10px', fontWeight: 700, color: '#a78bfa' }}>Dedicated Vector DB (Milvus / Qdrant / Pinecone)</td>
                    <td style={{ padding: '10px', color: '#cbd5e1' }}>&gt; 20M–1B+ vectors; &gt; 5,000 QPS; strict &lt;5ms p99 latency</td>
                    <td style={{ padding: '10px', color: '#86efac' }}>Distributed sharding; hardware SIMD / GPU acceleration; native SQ8/PQ/DiskANN; multi-segment LSM write path.</td>
                    <td style={{ padding: '10px', color: '#fca5a5' }}>Operational overhead of an extra distributed cluster; requires Transactional Outbox / CDC to prevent dual-write split-brain.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ background: '#0c0e17', border: '1px solid #334155', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#a78bfa', marginBottom: '4px' }}>
                Staff Interview Pro-Tip: The "Pragmatic Escalation" Script
              </div>
              <div style={{ fontSize: '11.5px', color: '#cbd5e1', lineHeight: '1.5', fontStyle: 'italic' }}>
                "In Phase 1 with 2 million product items, I would start with pgvector on our existing PostgreSQL instance. This avoids introducing a second distributed database, eliminates dual-write synchronization bugs, and allows relational joins with inventory tables. If our scale grows past 10 million embeddings or vector write latency impacts OLTP transactions, I will decouple the vector store into a dedicated Qdrant/Milvus cluster driven by Kafka Change Data Capture (Debezium)."
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
