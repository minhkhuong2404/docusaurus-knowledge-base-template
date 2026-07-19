import React, { useState } from 'react';

type QueryType = 'colocated' | 'scattergather';

export default function ScatterGatherCoLocatedDiagram(): React.JSX.Element {
  const [tab, setTab] = useState<QueryType>('colocated');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span>Query Partitioning: Co-located vs. Scatter-Gather</span>
      </div>

      {/* Tab selectors */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {(['colocated', 'scattergather'] as QueryType[]).map(t => {
          const isActive = tab === t;
          const label = t === 'colocated' ? 'Co-located Query (Shard Key Filter)' : 'Scatter-Gather Query (No Shard Key)';
          const color = t === 'colocated' ? '#34d399' : '#fbbf24';
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '12.5px',
                background: isActive ? `${color}18` : 'rgba(255,255,255,0.04)',
                color: isActive ? color : 'var(--ifm-color-content-secondary)',
                boxShadow: isActive ? `0 0 0 1.5px ${color}50` : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* SVG Canvas wrapper */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 180" className="interactive-diagram-svg">
          <defs>
            <marker id="sg-arr-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#34d399" /></marker>
            <marker id="sg-arr-amber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fbbf24" /></marker>
            <marker id="sg-arr-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f87171" /></marker>
          </defs>

          {/* Client Node */}
          <g>
            <rect x="20" y="65" width="80" height="50" rx="5" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <text x="60" y="94" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="10.5" fontWeight="800">Client</text>
          </g>

          {/* Router Node */}
          <g>
            <rect x="180" y="60" width="110" height="60" rx="6" fill="rgba(255, 255, 255, 0.03)" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.5" />
            <text x="235" y="88" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="11" fontWeight="800">Query Router</text>
            <text x="235" y="101" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8.5">
              {tab === 'colocated' ? 'usr_id filter present' : 'filter on age / email'}
            </text>
          </g>

          {/* Connection: Client to Router */}
          <path id="sg-client-router" d="M 100 90 L 172 90" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />

          {tab === 'colocated' ? (
            <g>
              {/* Shards */}
              <rect x="420" y="15" width="110" height="35" rx="4" fill="rgba(0,0,0,0.15)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <text x="475" y="36" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">Shard A</text>

              <rect x="420" y="70" width="110" height="40" rx="5" fill="rgba(52,211,153,0.1)" stroke="#34d399" strokeWidth="1.5" />
              <text x="475" y="94" textAnchor="middle" fill="#34d399" fontSize="10.5" fontWeight="800">Shard B (Target)</text>

              <rect x="420" y="130" width="110" height="35" rx="4" fill="rgba(0,0,0,0.15)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <text x="475" y="151" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="9.5">Shard C</text>

              {/* Direct Arrow to Shard B */}
              <path id="sg-col-path" d="M 290 90 L 410 90" fill="none" stroke="#34d399" strokeWidth="2.2" markerEnd="url(#sg-arr-green)" className="interactive-diagram-flowing-path" />
              <circle r="3.5" fill="#34d399" className="interactive-diagram-flowing-dot">
                <animateMotion dur="0.9s" repeatCount="indefinite"><mpath href="#sg-col-path"/></animateMotion>
              </circle>
              
              <text x="590" y="94" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="bold">🟢 1 Network Hop</text>
            </g>
          ) : (
            <g>
              {/* Shards */}
              <rect x="420" y="15" width="110" height="35" rx="4" fill="rgba(251,191,36,0.1)" stroke="#fbbf24" strokeWidth="1.5" />
              <text x="475" y="36" textAnchor="middle" fill="#fbbf24" fontSize="9.5" fontWeight="800">Shard A</text>

              <rect x="420" y="70" width="110" height="35" rx="4" fill="rgba(251,191,36,0.1)" stroke="#fbbf24" strokeWidth="1.5" />
              <text x="475" y="91" textAnchor="middle" fill="#fbbf24" fontSize="9.5" fontWeight="800">Shard B</text>

              <rect x="420" y="130" width="110" height="35" rx="4" fill="rgba(248,113,113,0.12)" stroke="#f87171" strokeWidth="1.5" />
              <text x="475" y="151" textAnchor="middle" fill="#f87171" fontSize="9.5" fontWeight="800">Shard C (Slow)</text>

              {/* Parallel arrows */}
              <path id="sg-scat-A" d="M 290 85 Q 340 50, 410 32" fill="none" stroke="#fbbf24" strokeWidth="1.5" markerEnd="url(#sg-arr-amber)" className="interactive-diagram-flowing-path" />
              <circle r="2.5" fill="#fbbf24" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite"><mpath href="#sg-scat-A"/></animateMotion>
              </circle>

              <path id="sg-scat-B" d="M 290 90 L 410 88" fill="none" stroke="#fbbf24" strokeWidth="1.5" markerEnd="url(#sg-arr-amber)" className="interactive-diagram-flowing-path" />
              <circle r="2.5" fill="#fbbf24" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite" begin="0.2s"><mpath href="#sg-scat-B"/></animateMotion>
              </circle>

              <path id="sg-scat-C" d="M 290 95 Q 340 130, 410 148" fill="none" stroke="#f87171" strokeWidth="1.8" markerEnd="url(#sg-arr-red)" className="interactive-diagram-flowing-path" />
              <circle r="2.5" fill="#f87171" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1.2s" repeatCount="indefinite" begin="0.4s"><mpath href="#sg-scat-C"/></animateMotion>
              </circle>

              <text x="590" y="94" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="bold">🔴 Slow Tail (Shard C)</text>
            </g>
          )}
        </svg>
      </div>

      {/* Description Panel */}
      <div className="interactive-diagram-details-card" style={{ borderColor: tab === 'colocated' ? '#34d399' : '#fbbf24' }}>
        {tab === 'colocated' ? (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#34d399', marginBottom: '4px' }}>⚡ Co-located Query (Single-Shard Routing)</div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              <li>**Shard Key Filter**: The SQL query contains `WHERE user_id = 101`. The Router hashes this key and routes to Shard B directly.</li>
              <li>**Latency Profile**: Direct 1-network RTT routing. No cross-shard aggregation or sorting needed.</li>
              <li>**Scalability**: Highly scalable. Doubling shards has zero impact on query execution latency.</li>
            </ul>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fbbf24', marginBottom: '4px' }}>⚠️ Scatter-Gather Query (Full Cluster Scan)</div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              <li>**No Shard Key**: The SQL query filter runs on non-sharded columns, e.g. `WHERE age &gt; 30`. The Router must scan all shards.</li>
              <li>**Parallel Scatter**: Router distributes queries to all nodes in parallel and must merge and sort results in memory.</li>
              <li>**Slow-Tail Latency Problem**: The end-to-end response blocks waiting for the slowest node. At P99, queries are 10-20x slower.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
