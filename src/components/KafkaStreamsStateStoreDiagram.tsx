import React, { useState } from 'react';

type StoreTab = 'layers' | 'rocksdb_io' | 'checkpoint';

export default function KafkaStreamsStateStoreDiagram({ initialTab = 'layers' }: { initialTab?: StoreTab }): React.JSX.Element {
  const [tab, setTab] = useState<StoreTab>(initialTab);
  const [activeIoPath, setActiveIoPath] = useState<'write' | 'read'>('write');
  const [selectedCheckpointEntry, setSelectedCheckpointEntry] = useState<number>(0);

  const checkpointEntries = [
    { topic: 'order-enrichment-agg-store-changelog', partition: 0, offset: 1420580, desc: 'Committed changelog offset safely written to local disk.' },
    { topic: 'order-enrichment-agg-store-changelog', partition: 1, offset: 1398210, desc: 'On restart, task skips changelog replay up to offset 1398210.' },
    { topic: 'order-enrichment-agg-store-changelog', partition: 2, offset: 1450012, desc: 'Clean shutdown flushes write cache and persists exact offset.' }
  ];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <style>{`
        @media (max-width: 768px) {
          .kstreams-store-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Kafka Streams State Stores: Write Cache, RocksDB LSM-Tree & Changelogs
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {[
            { id: 'layers', label: '1. 3-Tier Storage Architecture', color: '#34d399' },
            { id: 'rocksdb_io', label: '2. RocksDB LSM Write vs Read Path', color: '#38bdf8' },
            { id: 'checkpoint', label: '3. Checkpoint File & Crash Recovery', color: '#fbbf24' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as StoreTab)}
              style={{
                flex: 1,
                minWidth: '180px',
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: tab === t.id ? `${t.color}22` : 'rgba(255,255,255,0.04)',
                color: tab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                boxShadow: tab === t.id ? `0 0 0 1.5px ${t.color}` : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'layers' && (
          <div className="kstreams-store-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '14px', alignItems: 'start' }}>
            {/* Visual 3-Tier Canvas */}
            <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '14px' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px' }}>
                TASK STATE STORE STORAGE PIPELINE
              </div>

              {/* Tier 1 */}
              <div style={{ background: 'rgba(56,189,248,0.08)', border: '1.5px solid #38bdf8', borderRadius: '6px', padding: '10px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: '#38bdf8', fontSize: '12px' }}>Tier 1: In-Memory Write Cache (RAM)</span>
                  <span style={{ fontSize: '9px', fontWeight: 700, background: '#38bdf822', color: '#38bdf8', padding: '2px 5px', borderRadius: '3px' }}>Default 10MB</span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                  Buffers stream updates in memory, deduplicates successive writes by key, and batches emissions to downstream nodes.
                </p>
              </div>

              <div style={{ textAlign: 'center', color: '#64748b', fontSize: '11px', margin: '2px 0' }}>
                ▼ commit.interval.ms flush()
              </div>

              {/* Tier 2 */}
              <div style={{ background: 'rgba(52,211,153,0.08)', border: '1.5px solid #34d399', borderRadius: '6px', padding: '10px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: '#34d399', fontSize: '12px' }}>Tier 2: RocksDB Embedded LSM-Tree (Local SSD)</span>
                  <span style={{ fontSize: '9px', fontWeight: 700, background: '#34d39922', color: '#34d399', padding: '2px 5px', borderRadius: '3px' }}>Sub-ms Access</span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                  Local key-value engine with MemTable, WAL (Write-Ahead Log), Block Cache, and immutable SSTables with Bloom filters.
                </p>
              </div>

              <div style={{ textAlign: 'center', color: '#64748b', fontSize: '11px', margin: '2px 0' }}>
                ▼ Async changelog write & replication
              </div>

              {/* Tier 3 */}
              <div style={{ background: 'rgba(251,191,36,0.08)', border: '1.5px solid #fbbf24', borderRadius: '6px', padding: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: '#fbbf24', fontSize: '12px' }}>Tier 3: Kafka Changelog Topic (Remote Durability)</span>
                  <span style={{ fontSize: '9px', fontWeight: 700, background: '#fbbf2422', color: '#fbbf24', padding: '2px 5px', borderRadius: '3px' }}>Log Compaction</span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                  Compacted internal Kafka topic (`cleanup.policy=compact,delete`). Provides crash-recovery replay source and standby sync.
                </p>
              </div>
            </div>

            {/* Details Panel */}
            <div className="interactive-diagram-details-card details-green" style={{ minHeight: '300px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', marginBottom: '6px' }}>
                WHY 3 TIERS?
              </div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--ifm-color-content)' }}>
                Write Amplification Protection + Zero-Loss Durability
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: '0 0 8px 0' }}>
                If every incoming stream event hit RocksDB and Kafka changelogs directly, high-volume key updates (e.g. 100K clicks/sec on 10 popular keys) would overwhelm local disk I/O and network bandwidth.
              </p>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '6px', fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
                <strong>Key Tuning Knobs:</strong>
                <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px' }}>
                  <li>`statestore.cache.max.bytes`: Global cache pool shared across all tasks (default 10MB).</li>
                  <li>`commit.interval.ms`: 100ms with EOS, 30s otherwise. Controls how often Tier 1 flushes to Tier 2 & 3.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {tab === 'rocksdb_io' && (
          <div className="kstreams-store-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'start' }}>
            <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '14px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button
                  onClick={() => setActiveIoPath('write')}
                  style={{
                    flex: 1,
                    padding: '6px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '11.5px',
                    background: activeIoPath === 'write' ? '#38bdf8' : 'rgba(255,255,255,0.06)',
                    color: activeIoPath === 'write' ? '#090b14' : 'var(--ifm-color-content)'
                  }}
                >
                  Write Path (LSM Append)
                </button>
                <button
                  onClick={() => setActiveIoPath('read')}
                  style={{
                    flex: 1,
                    padding: '6px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '11.5px',
                    background: activeIoPath === 'read' ? '#34d399' : 'rgba(255,255,255,0.06)',
                    color: activeIoPath === 'read' ? '#090b14' : 'var(--ifm-color-content)'
                  }}
                >
                  Read Path (Hierarchical Lookup)
                </button>
              </div>

              {activeIoPath === 'write' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px' }}>
                  <div style={{ background: 'rgba(56,189,248,0.1)', padding: '8px', borderRadius: '4px', borderLeft: '3px solid #38bdf8' }}>
                    <strong style={{ color: '#38bdf8' }}>1. MemTable Insert:</strong> Written to in-memory skiplist (sub-microsecond latency).
                  </div>
                  <div style={{ background: 'rgba(56,189,248,0.1)', padding: '8px', borderRadius: '4px', borderLeft: '3px solid #38bdf8' }}>
                    <strong style={{ color: '#38bdf8' }}>2. WAL Append:</strong> Sequentially appended to Write-Ahead Log on disk for durability.
                  </div>
                  <div style={{ background: 'rgba(56,189,248,0.1)', padding: '8px', borderRadius: '4px', borderLeft: '3px solid #38bdf8' }}>
                    <strong style={{ color: '#38bdf8' }}>3. SSTable Flush:</strong> Full MemTable becomes immutable and flushes to disk SSTable file.
                  </div>
                  <div style={{ background: 'rgba(56,189,248,0.1)', padding: '8px', borderRadius: '4px', borderLeft: '3px solid #38bdf8' }}>
                    <strong style={{ color: '#38bdf8' }}>4. Background Compaction:</strong> Leveled compaction merges SSTables and removes old versions.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px' }}>
                  <div style={{ background: 'rgba(52,211,153,0.1)', padding: '8px', borderRadius: '4px', borderLeft: '3px solid #34d399' }}>
                    <strong style={{ color: '#34d399' }}>1. Check MemTable:</strong> Inspect active memory skiplist (instant hit if recently written).
                  </div>
                  <div style={{ background: 'rgba(52,211,153,0.1)', padding: '8px', borderRadius: '4px', borderLeft: '3px solid #34d399' }}>
                    <strong style={{ color: '#34d399' }}>2. Check Block Cache:</strong> Read uncompressed SSTable data blocks cached in RAM.
                  </div>
                  <div style={{ background: 'rgba(52,211,153,0.1)', padding: '8px', borderRadius: '4px', borderLeft: '3px solid #34d399' }}>
                    <strong style={{ color: '#34d399' }}>3. Bloom Filter Evaluation:</strong> Probabilistic filter skips SSTable files without reading disk.
                  </div>
                  <div style={{ background: 'rgba(52,211,153,0.1)', padding: '8px', borderRadius: '4px', borderLeft: '3px solid #34d399' }}>
                    <strong style={{ color: '#34d399' }}>4. Disk SSTable Seek:</strong> Direct binary search in Level 0..N SSTable files.
                  </div>
                </div>
              )}
            </div>

            <div className="interactive-diagram-details-card details-blue" style={{ minHeight: '260px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '6px' }}>
                SENIOR PERFORMANCE NOTE
              </div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--ifm-color-content)' }}>
                Off-Heap Memory & RocksDB Block Cache Sizing
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: 0 }}>
                RocksDB allocations occur in <strong>native off-heap memory (C++)</strong>, outside JVM `-Xmx` heap limits. In container environments (Kubernetes), forgetting to budget off-heap memory causes the Linux kernel OOM killer to terminate pods silently. Always use `RocksDBConfigSetter` to cap the shared block cache.
              </p>
            </div>
          </div>
        )}

        {tab === 'checkpoint' && (
          <div className="kstreams-store-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '14px', alignItems: 'start' }}>
            {/* Checkpoint Inspector */}
            <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '14px' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '8px' }}>
                LOCAL .checkpoint FILE INSPECTOR (MONOSPACE)
              </div>
              <pre style={{ fontFamily: 'Consolas, Monaco, monospace', fontSize: '11px', color: '#e2e8f0', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px', margin: '0 0 10px 0' }}>
{`0
3
order-enrichment-agg-store-changelog 0 1420580
order-enrichment-agg-store-changelog 1 1398210
order-enrichment-agg-store-changelog 2 1450012`}
              </pre>

              <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                CLICK ENTRY TO INSPECT RESTORE BOUNDARY:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {checkpointEntries.map((e, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedCheckpointEntry(idx)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 700,
                      textAlign: 'left',
                      background: selectedCheckpointEntry === idx ? '#fbbf24' : 'rgba(255,255,255,0.04)',
                      color: selectedCheckpointEntry === idx ? '#090b14' : 'var(--ifm-color-content)'
                    }}
                  >
                    Partition {e.partition} ➔ Offset {e.offset}
                  </button>
                ))}
              </div>
            </div>

            {/* Recovery Logic Explanation */}
            <div className="interactive-diagram-details-card details-orange" style={{ minHeight: '260px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '6px' }}>
                CRASH RECOVERY LIFECYCLE
              </div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: 'var(--ifm-color-content)' }}>
                Clean vs Unclean Recovery
              </h4>
              <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4, margin: '0 0 8px 0' }}>
                {checkpointEntries[selectedCheckpointEntry].desc}
              </p>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                • <strong>Clean Shutdown:</strong> Writes `.checkpoint` file. On restart, RocksDB is up to date; task resumes immediately.<br />
                • <strong>Crash (OOM / Kill -9):</strong> `.checkpoint` is deleted or stale. Task replays changelog from offset 0 or last checkpoint to guarantee zero loss.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
