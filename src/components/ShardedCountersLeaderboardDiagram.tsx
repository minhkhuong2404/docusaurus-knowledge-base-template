import React, { useState } from 'react';

type TabMode = 'counters' | 'zset' | 'probabilistic';

export default function ShardedCountersLeaderboardDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabMode>('counters');
  const [numShards, setNumShards] = useState<number>(4);
  const [simulatedLikes, setSimulatedLikes] = useState<number>(12450);

  const shardValues = [
    Math.floor(simulatedLikes * 0.28),
    Math.floor(simulatedLikes * 0.24),
    Math.floor(simulatedLikes * 0.26),
    simulatedLikes - Math.floor(simulatedLikes * 0.28) - Math.floor(simulatedLikes * 0.24) - Math.floor(simulatedLikes * 0.26),
  ];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <style>{`
        @media (max-width: 768px) {
          .sharded-grid-layout {
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
          stroke="#fbbf24"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Sharded Counters & High-Scale Real-Time Leaderboards
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'counters', label: '📊 Sharded Counters (Hot Keys)', color: '#fbbf24' },
            { id: 'zset', label: '🏆 Redis ZSET Skiplist Leaderboards', color: '#38bdf8' },
            { id: 'probabilistic', label: '🎲 Probabilistic: HyperLogLog & CMS', color: '#34d399' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as TabMode)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: `1px solid ${activeTab === t.id ? t.color : 'rgba(255, 255, 255, 0.1)'}`,
                background: activeTab === t.id ? `${t.color}22` : 'transparent',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {t.label}
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
          aria-label="Sharded counters ingestion and aggregation pipeline"
        >
          <defs>
            <marker
              id="arrow-amber-sharded"
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
              id="arrow-green-sharded"
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

          {/* Producer Ingestion Node */}
          <g>
            <rect x="30" y="45" width="160" height="90" rx="10" fill="rgba(15, 23, 42, 0.85)" stroke="#fbbf24" strokeWidth="1.5" />
            <circle cx="55" cy="72" r="14" fill="#fbbf2422" stroke="#fbbf24" strokeWidth="1.5" />
            <text x="55" y="77" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="800">⚡</text>
            <text x="115" y="70" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="12" fontWeight="700">Write Ingestion</text>
            <text x="115" y="88" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">100,000 req/sec</text>
            <text x="115" y="112" textAnchor="middle" fill="#fbbf24" fontSize="9.5" fontWeight="600">rand(0, N-1) Sharding</text>
          </g>

          {/* Animated Paths to 4 Shards */}
          {[
            { y: 30, shardId: 0, label: 'Shard 0' },
            { y: 70, shardId: 1, label: 'Shard 1' },
            { y: 110, shardId: 2, label: 'Shard 2' },
            { y: 150, shardId: 3, label: 'Shard 3' },
          ].map((sh, idx) => (
            <g key={idx}>
              <path d={`M 190 90 C 270 90, 280 ${sh.y + 15}, 360 ${sh.y + 15}`} fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeOpacity="0.25" />
              <path
                d={`M 190 90 C 270 90, 280 ${sh.y + 15}, 360 ${sh.y + 15}`}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2"
                className="interactive-diagram-flowing-path"
                markerEnd="url(#arrow-amber-sharded)"
              />

              {/* Shard Node */}
              <rect x="365" y={sh.y} width="160" height="30" rx="6" fill="rgba(15, 23, 42, 0.9)" stroke="#fbbf24" strokeWidth="1" />
              <text x="445" y={sh.y + 19} textAnchor="middle" fill="var(--ifm-color-content)" fontSize="11" fontWeight="600">
                {sh.label}: {shardValues[idx].toLocaleString()} writes
              </text>

              {/* Path from Shard to Aggregator */}
              <path d={`M 525 ${sh.y + 15} C 600 ${sh.y + 15}, 610 90, 680 90`} fill="none" stroke="#34d399" strokeWidth="1.5" strokeOpacity="0.25" />
              <path
                d={`M 525 ${sh.y + 15} C 600 ${sh.y + 15}, 610 90, 680 90`}
                fill="none"
                stroke="#34d399"
                strokeWidth="2"
                className="interactive-diagram-flowing-path"
                markerEnd="url(#arrow-green-sharded)"
              />
            </g>
          ))}

          {/* Aggregator Node (Right) */}
          <g>
            <rect x="685" y="45" width="220" height="90" rx="10" fill="rgba(6, 78, 59, 0.25)" stroke="#34d399" strokeWidth="2" />
            <circle cx="715" cy="75" r="14" fill="#34d39922" stroke="#34d399" strokeWidth="1.5" />
            <text x="715" y="80" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="800">Σ</text>
            <text x="800" y="70" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="13" fontWeight="700">Parallel Sum Aggregator</text>
            <text x="800" y="90" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="700">Total: {simulatedLikes.toLocaleString()}</text>
            <text x="800" y="112" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">O(N) Read / O(1) Scatter-Gather</text>
          </g>
        </svg>
      </div>

      {/* Tab 1: Sharded Counters */}
      {activeTab === 'counters' && (
        <div className="sharded-grid-layout" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', marginTop: '16px' }}>
          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #fbbf24' }}>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--ifm-color-content)', fontSize: '15px' }}>
              Why a Single Counter Key Melts Under Load
            </h4>
            <p style={{ margin: '0 0 8px 0', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              In high-traffic systems (viral tweets, live streaming votes, flash sales), executing <code>UPDATE posts SET likes = likes + 1</code> against a single database row or issuing <code>INCR post:100:likes</code> on a single Redis master creates severe row-lock contention and CPU thread serialization.
            </p>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.55 }}>
              <li><strong>Row Locking:</strong> In PostgreSQL/MySQL, every increment acquires an Exclusive (X) row lock. Latency escalates from 0.5ms to 5,000ms.</li>
              <li><strong>Redis Single-Thread Bottleneck:</strong> A single Redis core caps out at ~120,000 commands/sec. A burst of 500k likes/sec saturates the event loop.</li>
              <li><strong>Solution:</strong> Distribute increments across $N$ sub-keys: <code>post:100:like:0</code> to <code>post:100:like:N-1</code> using random scatter (<code>rand(0, N-1)</code>). Writes scale linearly with $N$!</li>
            </ul>
          </div>

          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #34d399' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#34d399', fontSize: '15px' }}>
              Interactive Load Simulator
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                  Simulated Viral Likes: {simulatedLikes.toLocaleString()}
                </label>
                <input
                  type="range"
                  min="1000"
                  max="100000"
                  step="500"
                  value={simulatedLikes}
                  onChange={(e) => setSimulatedLikes(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ background: 'rgba(52, 211, 153, 0.1)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                <strong style={{ color: '#34d399' }}>Read Aggregation Strategy:</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
                  Read queries issue <code>MGET post:100:like:0 .. post:100:like:3</code> in a single round-trip, or read a pre-aggregated cache updated by a 5-second background rollup job.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Redis ZSET Leaderboards */}
      {activeTab === 'zset' && (
        <div className="sharded-grid-layout" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', marginTop: '16px' }}>
          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #38bdf8' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#38bdf8', fontSize: '15px' }}>
              Redis Sorted Set (ZSET) Dual Architecture
            </h4>
            <p style={{ margin: '0 0 8px 0', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              Under the hood, a Redis ZSET maintains <strong>two simultaneous data structures</strong> pointing to the same memory elements:
            </p>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.55 }}>
              <li><strong>Hash Table:</strong> Maps <code>member ➔ score</code> in $O(1)$ time for fast lookups and updates via <code>ZADD</code> / <code>ZSCORE</code>.</li>
              <li><strong>Skip List:</strong> A multi-level probabilistic linked list that keeps members sorted by score. Provides $O(\log N)$ rank calculation (<code>ZREVRANK</code>) and range queries (<code>ZREVRANGE</code>).</li>
            </ul>
          </div>

          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #fbbf24' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#fbbf24', fontSize: '15px' }}>
              Tie-Breaking via Timestamp Bit-Packing
            </h4>
            <p style={{ margin: '0 0 8px 0', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              In competitive gaming, if Player A and Player B both reach 1,000 points, Player A who reached it first must rank higher. Redis ZSET ties default to lexicographical sorting by username!
            </p>
            <div style={{ background: '#080a12', padding: '10px', borderRadius: '6px', border: '1px solid rgba(251, 191, 36, 0.25)', fontFamily: 'monospace', fontSize: '11px', color: '#fbbf24' }}>
              <div>// Pack score and inverted timestamp into a 64-bit float:</div>
              <div style={{ color: '#34d399', marginTop: '4px' }}>
                final_score = base_score + (1.0 - (epoch_sec / 1e10))
              </div>
              <div style={{ color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>
                // Player reaching score earlier has larger fractional offset!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Probabilistic Counting */}
      {activeTab === 'probabilistic' && (
        <div className="sharded-grid-layout" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', marginTop: '16px' }}>
          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #34d399' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#34d399', fontSize: '15px' }}>
              HyperLogLog (HLL): Distinct Cardinality
            </h4>
            <p style={{ margin: '0 0 8px 0', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              Counts unique items (e.g. Daily Active Users, unique IP visits) across billions of events with standard error &lt; 0.81%:
            </p>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.55 }}>
              <li><strong>Constant Memory:</strong> Consumes only <strong>12 KB of memory</strong> regardless of whether you count 1,000 or 100,000,000 unique users!</li>
              <li><strong>Redis Native:</strong> Implemented via <code>PFADD</code> and <code>PFCOUNT</code>.</li>
            </ul>
          </div>

          <div className="interactive-diagram-details-card" style={{ borderLeft: '4px solid #a78bfa' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#a78bfa', fontSize: '15px' }}>
              Count-Min Sketch (CMS): Frequency Estimation
            </h4>
            <p style={{ margin: '0 0 8px 0', fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              A 2D array of counters with $d$ independent hash functions. Estimates the frequency of specific items in a streaming pipeline (e.g., detecting Top-K trending search terms or DDoS source IPs) with bounded overestimation error.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
