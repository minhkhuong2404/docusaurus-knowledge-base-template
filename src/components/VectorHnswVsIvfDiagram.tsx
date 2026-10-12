import React, { useState } from 'react';

type IndexAlgorithm = 'hnsw' | 'ivf-pq' | 'flat';

interface AlgorithmSpec {
  id: IndexAlgorithm;
  name: string;
  badge: string;
  color: string;
  recallRate: string;
  queryLatency: string;
  buildTime: string;
  ramUsagePerMillion: string;
  qpsScale: string;
  description: string;
  underTheHood: string[];
  whenToUse: string;
  antiPattern: string;
}

const ALGORITHMS: Record<IndexAlgorithm, AlgorithmSpec> = {
  hnsw: {
    id: 'hnsw',
    name: 'HNSW (Hierarchical Navigable Small World)',
    badge: 'Gold Standard for Latency & High Recall',
    color: '#38bdf8',
    recallRate: '98% - 99.5%',
    queryLatency: '1 - 5 ms',
    buildTime: 'High (hours for 10M+ vectors)',
    ramUsagePerMillion: '~10 - 14 GB (1536-dim FP32 + link graphs)',
    qpsScale: '1,000 - 5,000 QPS / core',
    description: 'Multi-layer proximity graph reminiscent of Skip Lists. Upper layers have sparse long-distance highway edges for coarse routing; bottom layer (Layer 0) has dense local connectivity for fine-grained convergence.',
    underTheHood: [
      'Layer Assignment: Nodes are probabilistically assigned a maximum layer via exponential decay l = -ln(unif(0, 1)) * mL.',
      'Greedy Walk: At layer l > 0, algorithm greedily hops to neighbors closest to query vector until reaching a local minimum.',
      'Layer 0 Entry: Drops into Layer 0 and runs beam search maintaining an efSearch-sized candidate priority queue.',
      'Memory Overhead: Each node maintains M bidirectional neighbor pointers (4-8 bytes each) per layer, inflating footprint.'
    ],
    whenToUse: 'Interactive low-latency applications (e.g. conversational RAG, real-time code assistant) requiring >98% recall and sub-10ms response times.',
    antiPattern: 'Extreme multi-billion vector scale without adequate DRAM budget; streaming write spikes that trigger expensive graph re-linking.'
  },
  'ivf-pq': {
    id: 'ivf-pq',
    name: 'IVF-PQ (Inverted File with Product Quantization)',
    badge: 'Extreme RAM Compression & Billion-Scale',
    color: '#fbbf24',
    recallRate: '85% - 95%',
    queryLatency: '5 - 20 ms',
    buildTime: 'Medium (requires offline k-means clustering)',
    ramUsagePerMillion: '~0.2 - 1.5 GB (95% RAM reduction vs Flat)',
    qpsScale: '500 - 2,500 QPS / core',
    description: 'Two-stage index: Inverted File (IVF) partitions vector space into Voronoi cells via k-means centroids. Product Quantization (PQ) chops high-dimensional vectors into m sub-vectors and compresses each into 1-byte codebook centroids.',
    underTheHood: [
      'IVF Inverted List: Divides space into k Voronoi centroids (e.g. 4096 clusters). Query probes only the closest nprobe centroids.',
      'Product Quantization: A 1536-dim FP32 vector (6144 bytes) is split into 64 sub-vectors of 24 dims. Each sub-vector is mapped to an 8-bit centroid byte, yielding a 64-byte code (99% compression!).',
      'Asymmetric Distance Computation (ADC): Precomputes a distance lookup table between query sub-vectors and codebook centroids; candidate distances are evaluated via fast table lookups instead of heavy floating-point math.'
    ],
    whenToUse: 'Billion-scale datasets where hardware RAM budget is constrained, or offline batch analytics where 90% recall is acceptable.',
    antiPattern: 'Low-latency search pipelines where <5ms p99 is required, or datasets with dynamic distribution drift requiring constant k-means retraining.'
  },
  flat: {
    id: 'flat',
    name: 'Flat Index (Brute-Force Exact kNN)',
    badge: '100% Deterministic Ground Truth',
    color: '#34d399',
    recallRate: '100.0% (Exact)',
    queryLatency: '50 - 500+ ms (Linear scan)',
    buildTime: 'Instant (0 indexing time, append-only)',
    ramUsagePerMillion: '~6.14 GB (Raw 1536-dim FP32 vectors)',
    qpsScale: '10 - 50 QPS / core',
    description: 'Zero index structure. Executes a raw brute-force linear scan across every vector in the dataset using SIMD (AVX-512 / ARM Neon) matrix-vector dot products.',
    underTheHood: [
      'Exhaustive Distance Computation: Computes exact distance metric against all N vectors in storage.',
      'Hardware SIMD Parallelism: Packed float operations execute 16 vector dimensions per CPU cycle with fused multiply-add (FMA).',
      'Min-Heap Top-k: Maintains a fixed-size min-heap of size k to collect closest matches.',
      'Algorithmic Complexity: O(N · d) floating-point operations per query.'
    ],
    whenToUse: 'Small datasets (<50,000 vectors), evaluation baseline for measuring ANN recall loss, or isolated small-tenant queries behind strict filter pre-predicates.',
    antiPattern: 'Datasets exceeding 100k vectors in real-time user-facing latency paths.'
  }
};

export default function VectorHnswVsIvfDiagram(): React.JSX.Element {
  const [algo, setAlgo] = useState<IndexAlgorithm>('hnsw');
  const [activeLayer, setActiveLayer] = useState<number>(2);

  const cur = ALGORITHMS[algo];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 820px) {
          .hnsw-split-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="3" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="18" r="3" />
          <line x1="9" y1="6" x2="15" y2="6" />
          <line x1="9" y1="18" x2="15" y2="18" />
          <line x1="6" y1="9" x2="6" y2="15" />
          <line x1="18" y1="9" x2="18" y2="15" />
          <line x1="8.5" y1="8.5" x2="15.5" y2="15.5" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Vector ANN Index Engine: HNSW Multi-Layer Traversal vs IVF-PQ
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
          Select Index Family
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {(Object.keys(ALGORITHMS) as IndexAlgorithm[]).map((key) => {
            const item = ALGORITHMS[key];
            const isSelected = algo === key;
            return (
              <button
                key={key}
                onClick={() => setAlgo(key)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: isSelected ? `1.5px solid ${item.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: isSelected ? `${item.color}18` : '#0c0e17',
                  color: isSelected ? '#fff' : 'var(--ifm-color-content-secondary)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '12.5px',
                  transition: 'all 0.18s ease'
                }}
              >
                {item.name.split(' (')[0]}
              </button>
            );
          })}
        </div>

        {/* Algorithm Overview Card */}
        <div style={{
          backgroundColor: '#0c0e17',
          padding: '14px',
          borderRadius: '10px',
          borderLeft: `4px solid ${cur.color}`,
          marginBottom: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 800, fontSize: '15px', color: '#fff' }}>{cur.name}</span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: `${cur.color}22`, color: cur.color, fontWeight: 700 }}>
              {cur.badge}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            {cur.description}
          </p>
        </div>

        {/* Dynamic Visual Canvas with Moving Arrows */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ marginBottom: '16px', padding: '16px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: cur.color, fontWeight: 700 }}>
              {algo === 'hnsw' ? 'HNSW Hierarchical Skip-Graph Walkthrough' : algo === 'ivf-pq' ? 'IVF Voronoi Centroid Probe & Quantized Lookup' : 'SIMD Exhaustive Linear Scan'}
            </span>
            {algo === 'hnsw' && (
              <div style={{ display: 'flex', gap: '6px' }}>
                {[2, 1, 0].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setActiveLayer(lvl)}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      border: activeLayer === lvl ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: activeLayer === lvl ? 'rgba(56, 189, 248, 0.2)' : '#070913',
                      color: activeLayer === lvl ? '#fff' : '#94a3b8'
                    }}
                  >
                    Layer {lvl} {lvl === 2 ? '(Express Highway)' : lvl === 1 ? '(Intermediate)' : '(Dense Ground)'}
                  </button>
                ))}
              </div>
            )}
          </div>

          <svg viewBox="0 0 760 210" className="interactive-diagram-svg" style={{ maxHeight: '220px' }}>
            <defs>
              <marker id="algo-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill={cur.color} />
              </marker>
              <filter id="glowBall" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {algo === 'hnsw' && (
              <>
                {/* Layer 2 (Top Sparse) */}
                <g opacity={activeLayer === 2 ? 1 : 0.35} transition="opacity 0.2s">
                  <rect x="40" y="20" width="680" height="36" rx="6" fill="#0b1329" stroke="#38bdf8" strokeWidth={activeLayer === 2 ? 1.5 : 0.8} />
                  <text x="55" y="42" fill="#38bdf8" fontSize="11" fontWeight="700">Layer 2 (Sparse Highway: long hops)</text>
                  <circle cx="200" cy="38" r="6" fill="#38bdf8" />
                  <circle cx="560" cy="38" r="6" fill="#38bdf8" />
                  <path id="hnsw-hop-l2" d="M 206 38 L 554 38" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 3" markerEnd="url(#algo-arrow)" />
                  {activeLayer === 2 && (
                    <circle r="4" fill="#38bdf8" filter="url(#glowBall)">
                      <animateMotion dur="2.2s" repeatCount="indefinite">
                        <mpath href="#hnsw-hop-l2" />
                      </animateMotion>
                    </circle>
                  )}
                  <text x="380" y="32" fill="#94a3b8" fontSize="9.5" textAnchor="middle">Coarse Hop (greedy descent)</text>
                </g>

                {/* Layer 1 (Mid Layer) */}
                <g opacity={activeLayer === 1 ? 1 : 0.35} transition="opacity 0.2s">
                  <rect x="40" y="78" width="680" height="42" rx="6" fill="#071822" stroke="#2dd4bf" strokeWidth={activeLayer === 1 ? 1.5 : 0.8} />
                  <text x="55" y="102" fill="#2dd4bf" fontSize="11" fontWeight="700">Layer 1 (Medium Granularity)</text>
                  <circle cx="200" cy="99" r="5" fill="#2dd4bf" />
                  <circle cx="340" cy="99" r="5" fill="#2dd4bf" />
                  <circle cx="480" cy="99" r="5" fill="#2dd4bf" />
                  <circle cx="560" cy="99" r="5" fill="#2dd4bf" />
                  <path id="hnsw-hop-l1" d="M 560 44 L 560 94 L 486 99" stroke="#2dd4bf" strokeWidth="2" strokeDasharray="4 3" markerEnd="url(#algo-arrow)" />
                  {activeLayer === 1 && (
                    <circle r="4" fill="#2dd4bf" filter="url(#glowBall)">
                      <animateMotion dur="2.2s" repeatCount="indefinite">
                        <mpath href="#hnsw-hop-l1" />
                      </animateMotion>
                    </circle>
                  )}
                </g>

                {/* Layer 0 (Bottom Dense) */}
                <g opacity={activeLayer === 0 ? 1 : 0.35} transition="opacity 0.2s">
                  <rect x="40" y="140" width="680" height="52" rx="6" fill="#0a1d17" stroke="#34d399" strokeWidth={activeLayer === 0 ? 1.5 : 0.8} />
                  <text x="55" y="162" fill="#34d399" fontSize="11" fontWeight="700">Layer 0 (Dense Ground: All N vectors, M=16..64 links/node)</text>
                  <circle cx="430" cy="170" r="4.5" fill="#34d399" />
                  <circle cx="460" cy="170" r="4.5" fill="#34d399" />
                  <circle cx="480" cy="170" r="6" fill="#fbbf24" stroke="#fff" strokeWidth="1.5" />
                  <circle cx="510" cy="170" r="4.5" fill="#34d399" />
                  <circle cx="540" cy="170" r="4.5" fill="#34d399" />
                  <path id="hnsw-hop-l0" d="M 480 105 L 480 162" stroke="#fbbf24" strokeWidth="2" strokeDasharray="3 3" markerEnd="url(#algo-arrow)" />
                  {activeLayer === 0 && (
                    <circle r="4" fill="#fbbf24" filter="url(#glowBall)">
                      <animateMotion dur="1.8s" repeatCount="indefinite">
                        <mpath href="#hnsw-hop-l0" />
                      </animateMotion>
                    </circle>
                  )}
                  <text x="480" y="196" fill="#fbbf24" fontSize="9.5" fontWeight="700" textAnchor="middle">Target top-k Neighborhood Converged</text>
                </g>
              </>
            )}

            {algo === 'ivf-pq' && (
              <>
                {/* IVF Voronoi Partitions */}
                <rect x="40" y="25" width="280" height="160" rx="8" fill="#181308" stroke="#fbbf24" strokeWidth="1.5" />
                <text x="55" y="48" fill="#fbbf24" fontSize="12" fontWeight="700">1. IVF Coarse Centroids</text>
                <text x="55" y="65" fill="#94a3b8" fontSize="10">k-means partition (e.g. 4096 clusters)</text>
                <circle cx="100" cy="110" r="8" fill="#fbbf24" />
                <circle cx="220" cy="90" r="8" fill="#38bdf8" />
                <circle cx="180" cy="150" r="8" fill="#fbbf24" />
                <path id="ivf-probe-path" d="M 70 80 L 212 88" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 3" markerEnd="url(#algo-arrow)" />
                <circle r="4" fill="#38bdf8" filter="url(#glowBall)">
                  <animateMotion dur="2s" repeatCount="indefinite">
                    <mpath href="#ivf-probe-path" />
                  </animateMotion>
                </circle>
                <text x="140" y="80" fill="#38bdf8" fontSize="9.5" textAnchor="middle">Query probe (nprobe=16)</text>

                {/* PQ Product Quantization */}
                <rect x="360" y="25" width="360" height="160" rx="8" fill="#0d111d" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="380" y="48" fill="#38bdf8" fontSize="12" fontWeight="700">2. PQ Compressed Sub-Vectors</text>
                <text x="380" y="65" fill="#94a3b8" fontSize="10">1536-dim FP32 (6144B) → 64 bytes (99% saved)</text>
                <g transform="translate(380, 80)">
                  <rect x="0" y="0" width="70" height="30" rx="4" fill="#1e293b" stroke="#38bdf8" />
                  <text x="35" y="19" fill="#38bdf8" fontSize="10" textAnchor="middle">Sub 1: 1B</text>
                  <rect x="80" y="0" width="70" height="30" rx="4" fill="#1e293b" stroke="#38bdf8" />
                  <text x="115" y="19" fill="#38bdf8" fontSize="10" textAnchor="middle">Sub 2: 1B</text>
                  <rect x="160" y="0" width="70" height="30" rx="4" fill="#1e293b" stroke="#38bdf8" />
                  <text x="195" y="19" fill="#38bdf8" fontSize="10" textAnchor="middle">... 64 bytes</text>
                </g>
                <text x="380" y="145" fill="#34d399" fontSize="11" fontWeight="600">ADC Asymmetric Distance Computation</text>
                <text x="380" y="162" fill="#94a3b8" fontSize="9.5">O(1) memory table lookup without FP32 multiplications</text>
              </>
            )}

            {algo === 'flat' && (
              <>
                <rect x="40" y="30" width="680" height="150" rx="8" fill="#091b15" stroke="#34d399" strokeWidth="1.5" />
                <text x="60" y="58" fill="#34d399" fontSize="13" fontWeight="700">Linear Scan with SIMD Matrix Dot Product</text>
                <text x="60" y="76" fill="#94a3b8" fontSize="11">Iterates sequentially across all N rows: dot_product(Q, V[i])</text>

                <path id="flat-scan-path" d="M 60 120 L 700 120" stroke="#34d399" strokeWidth="2.5" strokeDasharray="6 4" markerEnd="url(#algo-arrow)" />
                <circle r="5" fill="#34d399" filter="url(#glowBall)">
                  <animateMotion dur="2.4s" repeatCount="indefinite">
                    <mpath href="#flat-scan-path" />
                  </animateMotion>
                </circle>

                <text x="100" y="145" fill="#34d399" fontSize="11" fontWeight="700">CPU Core 0 [AVX-512]</text>
                <text x="350" y="145" fill="#34d399" fontSize="11" fontWeight="700">CPU Core 1 [AVX-512]</text>
                <text x="600" y="145" fill="#34d399" fontSize="11" fontWeight="700">CPU Core 2 [AVX-512]</text>
              </>
            )}
          </svg>
        </div>

        {/* 2-Column Metrics & Deep Dive */}
        <div className="hnsw-split-grid" style={{ display: 'grid', gridTemplateColumns: '48% 52%', gap: '16px', alignItems: 'start' }}>
          {/* Engineering Metrics Matrix */}
          <div style={{ backgroundColor: '#0c0e17', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: cur.color, fontWeight: 700, marginBottom: '12px' }}>
              Production Performance Envelope
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ backgroundColor: '#060810', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase' }}>Recall Accuracy</div>
                <div style={{ fontSize: '15px', color: '#34d399', fontWeight: 800, marginTop: '2px' }}>{cur.recallRate}</div>
              </div>

              <div style={{ backgroundColor: '#060810', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase' }}>Query p99 Latency</div>
                <div style={{ fontSize: '15px', color: '#38bdf8', fontWeight: 800, marginTop: '2px' }}>{cur.queryLatency}</div>
              </div>

              <div style={{ backgroundColor: '#060810', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase' }}>RAM / 1M Vectors</div>
                <div style={{ fontSize: '14px', color: '#fbbf24', fontWeight: 800, marginTop: '2px' }}>{cur.ramUsagePerMillion}</div>
              </div>

              <div style={{ backgroundColor: '#060810', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase' }}>QPS Throughput / Core</div>
                <div style={{ fontSize: '14px', color: '#a855f7', fontWeight: 800, marginTop: '2px' }}>{cur.qpsScale}</div>
              </div>
            </div>

            <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
              <strong>Index Build Time:</strong> {cur.buildTime}
            </div>
          </div>

          {/* Under-The-Hood Mechanics */}
          <div style={{ backgroundColor: '#0c0e17', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: cur.color, fontWeight: 700, marginBottom: '8px' }}>
              Under-the-Hood Architectural Mechanics
            </div>
            <ul style={{ margin: '0 0 12px 0', paddingLeft: '16px', fontSize: '11.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              {cur.underTheHood.map((item, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>{item}</li>
              ))}
            </ul>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
              <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 700 }}>RECOMMENDED DEPLOYMENT SCENARIO:</div>
              <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>{cur.whenToUse}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
