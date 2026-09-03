import React, { useState } from 'react';

type OperationMode = 'refresh' | 'flush';

export default function ElasticsearchRefreshFlushDiagram(): React.JSX.Element {
  const [mode, setMode] = useState<OperationMode>('refresh');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Lucene Write Path: Refresh (Searchability) vs. Flush (Durability)
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setMode('refresh')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: `1px solid ${mode === 'refresh' ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
              background: mode === 'refresh' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.04)',
              color: mode === 'refresh' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
              fontWeight: mode === 'refresh' ? 700 : 500,
              fontSize: '11.5px',
              cursor: 'pointer'
            }}
          >
            ⚡ 1. Refresh (Searchable in 1s)
          </button>
          <button
            onClick={() => setMode('flush')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: `1px solid ${mode === 'flush' ? '#34d399' : 'rgba(255,255,255,0.1)'}`,
              background: mode === 'flush' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255,255,255,0.04)',
              color: mode === 'flush' ? '#34d399' : 'var(--ifm-color-content-secondary)',
              fontWeight: mode === 'flush' ? 700 : 500,
              fontSize: '11.5px',
              cursor: 'pointer'
            }}
          >
            💾 2. Flush (fsync &amp; Translog 30m)
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
          {mode === 'refresh' ? (
            <svg viewBox="0 0 760 210" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                <marker id="rf-blue" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#38bdf8" /></marker>
                <marker id="rf-green" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#34d399" /></marker>
              </defs>

              {/* Memory Index Buffer */}
              <g transform="translate(40, 45)">
                <rect width="200" height="70" rx="8" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="100" y="24" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">Memory Index Buffer</text>
                <text x="100" y="42" textAnchor="middle" fill="#cbd5e1" fontSize="9">JVM Heap Memory</text>
                <text x="100" y="56" textAnchor="middle" fill="#f87171" fontSize="8.5">❌ Not searchable yet</text>
              </g>

              {/* OS Page Cache */}
              <g transform="translate(320, 40)">
                <rect width="220" height="80" rx="8" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" strokeWidth="2" />
                <text x="110" y="24" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="800">OS Page Cache</text>
                <text x="110" y="44" textAnchor="middle" fill="#86efac" fontSize="9.5">New Lucene Segment Created</text>
                <text x="110" y="62" textAnchor="middle" fill="#34d399" fontSize="9" fontWeight="700">✅ NOW SEARCHABLE!</text>
              </g>

              {/* Search Reader */}
              <g transform="translate(600, 50)">
                <rect width="130" height="60" rx="8" fill="rgba(167, 139, 250, 0.12)" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="65" y="24" textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="700">Search Thread</text>
                <text x="65" y="42" textAnchor="middle" fill="#c4b5fd" fontSize="9">Reads Page Cache</text>
              </g>

              {/* Paths */}
              <path d="M 240 80 L 315 80" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#rf-blue)" className="interactive-diagram-flowing-path" />
              <text x="278" y="70" textAnchor="middle" fill="#38bdf8" fontSize="8.5" fontWeight="700">Refresh (1s)</text>

              <path d="M 540 80 L 595 80" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#rf-green)" className="interactive-diagram-flowing-path" />

              <text x="380" y="165" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">
                ⚡ Refresh copies in-memory buffer into OS page cache as an immutable segment. Zero disk I/O!
              </text>
            </svg>
          ) : (
            <svg viewBox="0 0 760 210" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                <marker id="fl-amber" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#f59e0b" /></marker>
                <marker id="fl-green" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#34d399" /></marker>
              </defs>

              {/* OS Page Cache */}
              <g transform="translate(60, 40)">
                <rect width="200" height="75" rx="8" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="100" y="24" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">OS Page Cache</text>
                <text x="100" y="44" textAnchor="middle" fill="#cbd5e1" fontSize="9">Uncommitted segments in RAM</text>
                <text x="100" y="58" textAnchor="middle" fill="#94a3b8" fontSize="8.5">Volatile (Lost on OS crash)</text>
              </g>

              {/* Physical Disk */}
              <g transform="translate(320, 35)">
                <rect width="210" height="85" rx="8" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" strokeWidth="2" />
                <text x="105" y="24" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="800">Physical NVMe Disk</text>
                <text x="105" y="44" textAnchor="middle" fill="#86efac" fontSize="9.5">Segments fsync'd to disk</text>
                <text x="105" y="60" textAnchor="middle" fill="#34d399" fontSize="9" fontWeight="700">🔒 PERSISTED &amp; DURABLE</text>
              </g>

              {/* Translog */}
              <g transform="translate(590, 40)">
                <rect width="140" height="75" rx="8" fill="rgba(245, 158, 11, 0.15)" stroke="#f59e0b" strokeWidth="1.5" />
                <text x="70" y="24" textAnchor="middle" fill="#f59e0b" fontSize="11" fontWeight="700">Translog (WAL)</text>
                <text x="70" y="44" textAnchor="middle" fill="#fcd34d" fontSize="9">Truncated &amp; reset</text>
                <text x="70" y="58" textAnchor="middle" fill="#86efac" fontSize="8.5">Replay log cleaned</text>
              </g>

              {/* Paths */}
              <path d="M 260 80 L 315 80" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#fl-green)" className="interactive-diagram-flowing-path" />
              <text x="288" y="70" textAnchor="middle" fill="#34d399" fontSize="8.5" fontWeight="700">fsync()</text>

              <path d="M 530 80 L 585 80" fill="none" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#fl-amber)" className="interactive-diagram-flowing-path" />
              <text x="558" y="70" textAnchor="middle" fill="#f59e0b" fontSize="8.5" fontWeight="700">Commit</text>

              <text x="380" y="165" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">
                💾 Flush executes physical fsync to storage and resets the append-only translog. Every 30 mins or 512MB!
              </text>
            </svg>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
          <div style={{ padding: '10px', background: 'rgba(56, 189, 248, 0.08)', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            <strong style={{ color: '#38bdf8', fontSize: '11px' }}>Refresh Interval Tuning:</strong>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
              Default is <code>1s</code> (near-real-time). For heavy bulk indexing, increase <code>index.refresh_interval: "30s"</code> or <code>"-1"</code> to eliminate segment thrashing and boost write throughput 5x.
            </p>
          </div>

          <div style={{ padding: '10px', background: 'rgba(52, 211, 153, 0.08)', borderRadius: '6px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
            <strong style={{ color: '#34d399', fontSize: '11px' }}>Translog Crash Protection:</strong>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
              Even though segments are only flushed to disk every 30 minutes, uncommitted documents are never lost because every write appends to the on-disk <code>translog</code> (fsync'd every request or 5s).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
