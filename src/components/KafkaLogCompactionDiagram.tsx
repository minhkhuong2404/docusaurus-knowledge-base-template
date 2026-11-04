import React, { useState } from 'react';

interface SegmentRecord {
  offset: number;
  key: string;
  val: string | null;
  status: 'retained' | 'discarded' | 'tombstone' | 'active';
  timestamp: string;
}

export default function KafkaLogCompactionDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'cleaner' | 'tombstone' | 'dual'>('cleaner');
  const [cleanerStep, setCleanerStep] = useState<number>(0);
  const [tombstoneStep, setTombstoneStep] = useState<number>(0);
  const [dualRetentionMode, setDualRetentionMode] = useState<'both' | 'compact-only' | 'delete-only'>('both');

  // Step descriptions for Tab 1 (Log Cleaner Engine)
  const cleanerSteps = [
    {
      title: '1. Partition Log State: Active vs Inactive Segments',
      desc: 'The partition log is divided into closed segments (historical) and the active segment (currently receiving writes). The cleaner thread inspects only closed segments once dirty ratio exceeds min.cleanable.dirty.ratio.',
      highlight: 'initial'
    },
    {
      title: '2. Pass 1: Build In-Memory SkimpyOffsetMap',
      desc: 'The cleaner thread allocates an off-heap hash map (24 bytes per entry: 8-byte key hash + 8-byte offset). It sequentially scans dirty segments, recording the highest offset for each key.',
      highlight: 'hashmap'
    },
    {
      title: '3. Pass 2: Clean & Rewrite into Replacement Segment',
      desc: 'The cleaner reads clean + dirty segments from oldest to newest. Any record whose offset is strictly lower than the offset in SkimpyOffsetMap is pruned. Retained records write to a new .swap segment.',
      highlight: 'rewrite'
    },
    {
      title: '4. Atomic File Swap & Garbage Collection',
      desc: 'The new compacted segment is atomically swapped into place via OS rename syscall (.swap -> .log), and the obsolete dirty segment files are immediately unlinked from disk.',
      highlight: 'swapped'
    }
  ];

  // Tombstone steps for Tab 2
  const tombstoneSteps = [
    {
      title: 'Step 1: Producer Emits Tombstone (null payload)',
      desc: 'Producer writes record with key="order-804" and value=null to signal entity deletion. In the active segment, this record is stored like any other.',
      status: 'published'
    },
    {
      title: 'Step 2: Consumer Reads Deletion Signal',
      desc: 'Online consumers consume the tombstone and immediately delete the corresponding key from their local RocksDB state store, PostgreSQL read model, or Redis cache.',
      status: 'consumed'
    },
    {
      title: 'Step 3: delete.retention.ms Grace Period (Default: 24h)',
      desc: 'The cleaner thread preserves the tombstone record in the log for delete.retention.ms. This guarantees lagging or restarted consumers have time to observe the deletion.',
      status: 'grace'
    },
    {
      title: 'Step 4: Cleaner Purges Tombstone Record',
      desc: 'Once delete.retention.ms expires and all prior records with that key are cleaned, the cleaner discards the tombstone itself. The key ceases to exist anywhere in Kafka.',
      status: 'purged'
    },
    {
      title: 'Hazard: Tombstone Resurrection Disaster',
      desc: 'If a consumer was down for >24h (longer than delete.retention.ms), it missed the tombstone! If it restores from a backup snapshot or older state, the deleted entity is resurrected!',
      status: 'hazard'
    }
  ];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .kcompact-grid {
            grid-template-columns: 1fr !important;
          }
          .kcompact-segment-row {
            flex-direction: column !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
          <path d="M12 12v9" />
          <path d="m8 17 4 4 4-4" />
        </svg>
        <span style={{ color: '#34d399', fontWeight: 800, fontSize: '14px', letterSpacing: '0.5px' }}>
          Kafka cleanup.policy & Log Compaction Engine Architecture
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'cleaner', label: '⚙️ 1. Log Cleaner & SkimpyOffsetMap Pipeline', color: '#34d399' },
            { id: 'tombstone', label: '🪦 2. Tombstone Lifecycle & Resurrection Hazard', color: '#fbbf24' },
            { id: 'dual', label: '🔀 3. Dual Retention (compact,delete) Invariants', color: '#38bdf8' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                flex: 1,
                minWidth: '180px',
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: activeTab === t.id ? `${t.color}25` : 'rgba(255,255,255,0.04)',
                color: activeTab === t.id ? t.color : '#94a3b8',
                boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}` : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: Cleaner Engine */}
        {activeTab === 'cleaner' && (
          <div>
            {/* Step Controls */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                CLEANER CYCLE PHASE:
              </span>
              {cleanerSteps.map((s, idx) => (
                <button
                  key={s.title}
                  onClick={() => setCleanerStep(idx)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: cleanerStep === idx ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                    background: cleanerStep === idx ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.03)',
                    color: cleanerStep === idx ? '#34d399' : '#e2e8f0'
                  }}
                >
                  Step {idx + 1}
                </button>
              ))}
            </div>

            {/* Explanation Banner */}
            <div style={{
              background: '#0d0f1e',
              border: '1px solid rgba(52,211,153,0.3)',
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399', marginBottom: '4px' }}>
                {cleanerSteps[cleanerStep].title}
              </div>
              <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
                {cleanerSteps[cleanerStep].desc}
              </div>
            </div>

            {/* Visual Segments Representation */}
            <div className="kcompact-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '14px', alignItems: 'start' }}>
              <div style={{ background: '#0b0f19', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px' }}>
                  DISK LOG SEGMENTS: PARTITION partition-0
                </div>

                {/* Segment 0: Clean head */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#34d399', fontWeight: 700, marginBottom: '4px' }}>
                    <span>00000000.log (CLEAN SEGMENT)</span>
                    <span>Offsets 0-2 (Compacted)</span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <div style={{ flex: 1, padding: '6px', background: 'rgba(52,211,153,0.12)', border: '1px solid #34d399', borderRadius: '4px', fontSize: '10px', color: '#e2e8f0' }}>
                      <div style={{ color: '#34d399', fontWeight: 700 }}>Off: 0</div>
                      <div>K: k1 (v1)</div>
                    </div>
                    <div style={{ flex: 1, padding: '6px', background: 'rgba(52,211,153,0.12)', border: '1px solid #34d399', borderRadius: '4px', fontSize: '10px', color: '#e2e8f0' }}>
                      <div style={{ color: '#34d399', fontWeight: 700 }}>Off: 1</div>
                      <div>K: k2 (v1)</div>
                    </div>
                  </div>
                </div>

                {/* Segment 1: Dirty segment (being processed) */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: cleanerStep >= 2 ? '#fbbf24' : '#f87171', fontWeight: 700, marginBottom: '4px' }}>
                    <span>00000002.log (DIRTY CLOSED SEGMENT)</span>
                    <span>{cleanerStep >= 3 ? 'SWAPPED & CLEANED' : 'Awaiting Cleaner Pass'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    <div style={{
                      flex: 1,
                      minWidth: '70px',
                      padding: '6px',
                      background: cleanerStep >= 2 ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.03)',
                      border: cleanerStep >= 2 ? '1px dashed #f87171' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '4px',
                      fontSize: '10px',
                      color: cleanerStep >= 2 ? '#94a3b8' : '#e2e8f0'
                    }}>
                      <div style={{ fontWeight: 700, color: cleanerStep >= 2 ? '#f87171' : '#38bdf8' }}>Off: 2</div>
                      <div>K: k1 (v2)</div>
                      {cleanerStep >= 2 && <div style={{ color: '#f87171', fontSize: '9px', fontWeight: 800 }}>DISCARDED</div>}
                    </div>

                    <div style={{
                      flex: 1,
                      minWidth: '70px',
                      padding: '6px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '4px',
                      fontSize: '10px',
                      color: '#e2e8f0'
                    }}>
                      <div style={{ fontWeight: 700, color: '#38bdf8' }}>Off: 3</div>
                      <div>K: k3 (v1)</div>
                      {cleanerStep >= 2 && <div style={{ color: '#34d399', fontSize: '9px', fontWeight: 800 }}>RETAINED</div>}
                    </div>

                    <div style={{
                      flex: 1,
                      minWidth: '70px',
                      padding: '6px',
                      background: cleanerStep >= 2 ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.03)',
                      border: cleanerStep >= 2 ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '4px',
                      fontSize: '10px',
                      color: '#e2e8f0'
                    }}>
                      <div style={{ fontWeight: 700, color: '#34d399' }}>Off: 4</div>
                      <div>K: k1 (v3)</div>
                      {cleanerStep >= 2 && <div style={{ color: '#34d399', fontSize: '9px', fontWeight: 800 }}>LATEST</div>}
                    </div>
                  </div>
                </div>

                {/* Segment 2: Active Segment */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#38bdf8', fontWeight: 700, marginBottom: '4px' }}>
                    <span>00000005.log (ACTIVE SEGMENT)</span>
                    <span style={{ color: '#fbbf24', background: 'rgba(251,191,36,0.15)', padding: '1px 5px', borderRadius: '3px' }}>IMMUNE TO CLEANER</span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <div style={{ flex: 1, padding: '6px', background: 'rgba(56,189,248,0.1)', border: '1px solid #38bdf8', borderRadius: '4px', fontSize: '10px', color: '#e2e8f0' }}>
                      <div style={{ color: '#38bdf8', fontWeight: 700 }}>Off: 5</div>
                      <div>K: k2 (v2)</div>
                    </div>
                    <div style={{ flex: 1, padding: '6px', background: 'rgba(56,189,248,0.1)', border: '1px solid #38bdf8', borderRadius: '4px', fontSize: '10px', color: '#e2e8f0' }}>
                      <div style={{ color: '#38bdf8', fontWeight: 700 }}>Off: 6 (Active append)</div>
                      <div>K: k4 (v1)</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Engine Internals Card */}
              <div style={{ background: '#0c0e17', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', marginBottom: '8px' }}>
                  CLEANER MEMORY: SkimpyOffsetMap
                </div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8', marginBottom: '10px' }}>
                  Linear-probing off-heap hash map storing 24-byte entry per distinct key:
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: '#090b14', borderRadius: '4px', fontSize: '11px', border: cleanerStep >= 1 ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: '#e2e8f0' }}>Key Hash: <code>hash("k1")</code></span>
                    <span style={{ color: '#34d399', fontWeight: 700 }}>Highest Offset: 4</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: '#090b14', borderRadius: '4px', fontSize: '11px', border: cleanerStep >= 1 ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: '#e2e8f0' }}>Key Hash: <code>hash("k3")</code></span>
                    <span style={{ color: '#34d399', fontWeight: 700 }}>Highest Offset: 3</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', marginBottom: '4px' }}>
                    Critical Invariant:
                  </div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>
                    Offsets are <strong>never renumbered</strong>. Retaining highest offsets (0, 1, 3, 4, 5, 6) preserves monotonic consumer progress without shifting commit positions.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Tombstone Lifecycle */}
        {activeTab === 'tombstone' && (
          <div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {tombstoneSteps.map((s, idx) => (
                <button
                  key={s.title}
                  onClick={() => setTombstoneStep(idx)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: tombstoneStep === idx ? (idx === 4 ? '1px solid #f87171' : '1px solid #fbbf24') : '1px solid rgba(255,255,255,0.1)',
                    background: tombstoneStep === idx ? (idx === 4 ? 'rgba(248,113,113,0.2)' : 'rgba(251,191,36,0.2)') : 'rgba(255,255,255,0.03)',
                    color: tombstoneStep === idx ? (idx === 4 ? '#f87171' : '#fbbf24') : '#e2e8f0'
                  }}
                >
                  {idx === 4 ? '⚠️ Hazard' : `Step ${idx + 1}`}
                </button>
              ))}
            </div>

            <div style={{
              background: tombstoneStep === 4 ? 'rgba(248,113,113,0.1)' : 'rgba(251,191,36,0.1)',
              border: `1px solid ${tombstoneStep === 4 ? '#f87171' : '#fbbf24'}`,
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: tombstoneStep === 4 ? '#f87171' : '#fbbf24', marginBottom: '4px' }}>
                {tombstoneSteps[tombstoneStep].title}
              </div>
              <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
                {tombstoneSteps[tombstoneStep].desc}
              </div>
            </div>

            {/* Tombstone Timeline Flow */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '10px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#38bdf8', marginBottom: '4px' }}>PRODUCER APP</div>
                <div style={{ fontSize: '11px', color: '#cbd5e1' }}><code>send("orders", "804", null)</code></div>
                <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '4px' }}>Tombstone record published</div>
              </div>

              <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '10px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#34d399', marginBottom: '4px' }}>LIVE CONSUMER</div>
                <div style={{ fontSize: '11px', color: '#cbd5e1' }}><code>cache.evict("804")</code></div>
                <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '4px' }}>Key removed from local state</div>
              </div>

              <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '10px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#fbbf24', marginBottom: '4px' }}>LOG CLEANER</div>
                <div style={{ fontSize: '11px', color: '#cbd5e1' }}>delete.retention.ms</div>
                <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '4px' }}>Clock ticks (Default: 86400000 ms)</div>
              </div>

              <div style={{ background: '#090b14', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '6px', padding: '10px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#f87171', marginBottom: '4px' }}>LAGGING CONSUMER</div>
                <div style={{ fontSize: '11px', color: '#cbd5e1' }}>Lag &gt; 24 Hours</div>
                <div style={{ fontSize: '9.5px', color: '#f87171', marginTop: '4px' }}>Tombstone gone → Silent state corruption</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Dual Retention Policy (compact,delete) */}
        {activeTab === 'dual' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                SIMULATE POLICY:
              </span>
              {[
                { id: 'both', label: 'compact,delete (Dual Retention)', color: '#38bdf8' },
                { id: 'compact-only', label: 'compact only', color: '#34d399' },
                { id: 'delete-only', label: 'delete only', color: '#f87171' }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setDualRetentionMode(m.id as any)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: dualRetentionMode === m.id ? `1px solid ${m.color}` : '1px solid rgba(255,255,255,0.1)',
                    background: dualRetentionMode === m.id ? `${m.color}20` : 'rgba(255,255,255,0.03)',
                    color: dualRetentionMode === m.id ? m.color : '#e2e8f0'
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div style={{ background: '#0b0f19', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', marginBottom: '6px' }}>
                {dualRetentionMode === 'both' && 'cleanup.policy=[compact, delete] — Deduplication + Time Expiration'}
                {dualRetentionMode === 'compact-only' && 'cleanup.policy=compact — Eternal State Retention per Key'}
                {dualRetentionMode === 'delete-only' && 'cleanup.policy=delete — Pure TTL Window Log'}
              </div>

              <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '12px' }}>
                {dualRetentionMode === 'both' && (
                  <>
                    Kafka runs <strong>both cleaner threads and log retention check coordinator</strong>. Compaction eliminates obsolete intermediate updates within segments, and retention purges closed segments whose highest record timestamp is older than <code>retention.ms</code>. Ideal for GDPR compliance and transient session state.
                  </>
                )}
                {dualRetentionMode === 'compact-only' && (
                  <>
                    Records with keys are stored <strong>forever</strong> unless explicitly deleted with a tombstone (<code>value=null</code>). Unkeyed records (<code>key=null</code>) can never be compacted and cause permanent disk growth.
                  </>
                )}
                {dualRetentionMode === 'delete-only' && (
                  <>
                    Messages are deleted strictly when segment age &gt; <code>retention.ms</code> or partition size &gt; <code>retention.bytes</code>. Key deduplication is completely disabled.
                  </>
                )}
              </div>

              <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', color: '#e2e8f0' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                    <th style={{ padding: '6px 8px', color: '#94a3b8' }}>Dimension</th>
                    <th style={{ padding: '6px 8px', color: '#38bdf8' }}>cleanup.policy=delete</th>
                    <th style={{ padding: '6px 8px', color: '#34d399' }}>cleanup.policy=compact</th>
                    <th style={{ padding: '6px 8px', color: '#fbbf24' }}>cleanup.policy=[compact,delete]</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '6px 8px', fontWeight: 700 }}>Data Retention Limit</td>
                    <td style={{ padding: '6px 8px' }}>Bounded by retention.ms/bytes</td>
                    <td style={{ padding: '6px 8px' }}>Indefinite per unique key</td>
                    <td style={{ padding: '6px 8px' }}>Bounded by retention.ms per key</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '6px 8px', fontWeight: 700 }}>Key Deduplication</td>
                    <td style={{ padding: '6px 8px' }}>None (stores all history)</td>
                    <td style={{ padding: '6px 8px' }}>Yes (latest value per key)</td>
                    <td style={{ padding: '6px 8px' }}>Yes (latest value within TTL)</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 8px', fontWeight: 700 }}>Primary Use Case</td>
                    <td style={{ padding: '6px 8px' }}>Raw event streams, audits</td>
                    <td style={{ padding: '6px 8px' }}>CDC changelogs, KTable state</td>
                    <td style={{ padding: '6px 8px' }}>GDPR, expiring user sessions</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
