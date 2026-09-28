import React, { useState } from 'react';

export default function PostgresCheckpointWalDiagram({ initialTab = 'write_path' }: { initialTab?: 'write_path' | 'tuning' | 'pg_stat' | 'pitfalls' }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'write_path' | 'tuning' | 'pg_stat' | 'pitfalls'>(initialTab);
  
  // Tuning simulator state
  const [timeoutMinutes, setTimeoutMinutes] = useState<number>(15);
  const [completionTarget, setCompletionTarget] = useState<number>(0.9);
  
  // Monitoring state
  const [timedCount, setTimedCount] = useState<number>(85);
  const [reqCount, setReqCount] = useState<number>(15);

  const writeWindowMinutes = (timeoutMinutes * completionTarget).toFixed(1);
  const totalCheckpoints = timedCount + reqCount;
  const forcedPercent = totalCheckpoints > 0 ? ((reqCount / totalCheckpoints) * 100).toFixed(1) : '0';
  const isForcedHigh = Number(forcedPercent) > 10;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .pg-checkpoint-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          PostgreSQL Checkpoint & WAL Engine: Zero I/O Spikes Tuning
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'write_path', label: '🔄 1. Write Path & Checkpointer Anatomy', color: '#38bdf8' },
            { id: 'tuning', label: '⚡ 2. I/O Smoothing (completion_target)', color: '#34d399' },
            { id: 'pg_stat', label: '📊 3. pg_stat_bgwriter Health Inspector', color: '#fbbf24' },
            { id: 'pitfalls', label: '⚠️ 4. Full-Page Writes & Crash RTO', color: '#f87171' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                flex: 1,
                minWidth: '160px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: activeTab === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}50` : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: WRITE PATH & CHECKPOINT ANATOMY */}
        {activeTab === 'write_path' && (
          <div>
            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '14px' }}>
              <svg viewBox="0 0 800 300" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="pg-arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                  </marker>
                  <marker id="pg-arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#34d399" />
                  </marker>
                  <marker id="pg-arrow-amber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" />
                  </marker>
                </defs>

                {/* Client / Backend Worker */}
                <rect x="20" y="110" width="130" height="70" rx="8" fill="rgba(56,189,248,0.15)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="85" y="138" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="700">Client Backend</text>
                <text x="85" y="156" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">INSERT / UPDATE</text>

                {/* Branch 1: WAL Path (Fast Sequential) */}
                <path d="M 150 130 C 200 130, 220 50, 280 50" fill="none" stroke="#34d399" strokeWidth="2" strokeDasharray="4 4" className="interactive-diagram-flowing-path" markerEnd="url(#pg-arrow-green)" />
                <rect x="280" y="20" width="220" height="60" rx="6" fill="rgba(52,211,153,0.15)" stroke="#34d399" strokeWidth="1.2" />
                <text x="390" y="42" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">Step 1: wal_buffers (RAM)</text>
                <text x="390" y="60" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">Sequential Append-only record</text>

                <path d="M 500 50 L 580 50" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#pg-arrow-green)" />
                <rect x="580" y="20" width="190" height="60" rx="6" fill="rgba(52,211,153,0.2)" stroke="#34d399" strokeWidth="1.2" />
                <text x="675" y="42" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">pg_wal / disk (fsync)</text>
                <text x="675" y="60" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">Guarantees Durability (ACID)</text>

                {/* Branch 2: Shared Buffers (In-Memory Dirty Pages) */}
                <path d="M 150 160 C 200 160, 220 180, 280 180" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#pg-arrow-blue)" />
                <rect x="280" y="150" width="220" height="60" rx="6" fill="rgba(56,189,248,0.15)" stroke="#38bdf8" strokeWidth="1.2" />
                <text x="390" y="172" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">Step 2: shared_buffers (RAM)</text>
                <text x="390" y="190" textAnchor="middle" fill="#fbbf24" fontSize="10">8KB Page modified ➔ Marked DIRTY</text>

                {/* Branch 3: Checkpointer Process (Flushing to Data Files) */}
                <rect x="280" y="230" width="220" height="55" rx="6" fill="rgba(251,191,36,0.15)" stroke="#fbbf24" strokeWidth="1.2" />
                <text x="390" y="252" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="700">Checkpointer Background Daemon</text>
                <text x="390" y="270" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">Wakes up every checkpoint_timeout</text>

                <path d="M 500 255 C 540 255, 550 210, 580 210" fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="4 4" className="interactive-diagram-flowing-path" markerEnd="url(#pg-arrow-amber)" />
                <rect x="580" y="170" width="190" height="85" rx="6" fill="rgba(248,113,113,0.15)" stroke="#f87171" strokeWidth="1.2" />
                <text x="675" y="195" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="700">Table Data Files ($PGDATA)</text>
                <text x="675" y="215" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="9">Random I/O (Heavy disk write!)</text>
                <text x="675" y="235" textAnchor="middle" fill="#34d399" fontSize="9">Frees old WAL / Bounds Crash RTO</text>
              </svg>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px 16px' }}>
              <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '4px', fontSize: '13px' }}>
                Why PostgreSQL Never Writes Directly to Table Files on COMMIT
              </div>
              <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.5', color: 'var(--ifm-color-content-secondary)' }}>
                Writing directly to table data files requires <strong>Random I/O</strong> across different disk sectors for each row, which would devastate throughput. Instead, PostgreSQL performs two steps: it appends changes sequentially to the <strong>WAL (Write-Ahead Log)</strong> for instant durability with fast sequential I/O, and updates the in-memory 8KB page in <strong>`shared_buffers`</strong> (marked as Dirty). The <strong>Checkpointer</strong> background process batches the flush of all dirty pages to disk at scheduled intervals.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: I/O SMOOTHING */}
        {activeTab === 'tuning' && (
          <div>
            <div className="pg-checkpoint-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', marginBottom: '14px' }}>
              {/* Sliders panel */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ color: '#34d399', fontWeight: 700, fontSize: '13px', marginBottom: '12px' }}>
                  Interactive Checkpoint Sizing & I/O Spreading
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span>1. checkpoint_timeout:</span>
                    <strong style={{ color: '#38bdf8' }}>{timeoutMinutes} Minutes</strong>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="5"
                    value={timeoutMinutes}
                    onChange={e => setTimeoutMinutes(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#38bdf8' }}
                  />
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>
                    Max time between regular checkpoints (Default: 5min. Production: 15-30min).
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span>2. checkpoint_completion_target:</span>
                    <strong style={{ color: '#34d399' }}>{completionTarget}</strong>
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="0.9"
                    step="0.05"
                    value={completionTarget}
                    onChange={e => setCompletionTarget(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#34d399' }}
                  />
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>
                    Fraction of checkpoint_timeout over which to spread dirty page writes.
                  </div>
                </div>

                {/* Calculation box */}
                <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid #34d399', borderRadius: '6px', padding: '10px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Active I/O Write Window:</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
                    {writeWindowMinutes} Minutes
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content)', marginTop: '4px' }}>
                    Formula: {timeoutMinutes}m × {completionTarget} = {writeWindowMinutes}m. Checkpointer throttles writes smoothly, leaving ample disk bandwidth for client queries!
                  </div>
                </div>
              </div>

              {/* Graphical I/O Spikes Comparison */}
              <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                  I/O Profile Comparison: Default vs Tuned
                </div>

                <div style={{ marginBottom: '10px', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '6px', padding: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#f87171' }}>
                    ❌ Default (timeout=5m, completion_target=0.5)
                  </div>
                  <div style={{ height: '36px', display: 'flex', alignItems: 'flex-end', gap: '4px', marginTop: '4px' }}>
                    {[10, 10, 95, 90, 10, 10, 95, 90, 10].map((h, i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: `${h}%`,
                          background: h > 50 ? '#f87171' : 'rgba(255,255,255,0.2)',
                          borderRadius: '2px'
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ fontSize: '9px', color: '#f87171', marginTop: '4px' }}>
                    Violent I/O spikes every 5 mins saturate disk throughput ➔ Java p99 latency spikes!
                  </div>
                </div>

                <div style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '6px', padding: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399' }}>
                    ✅ Tuned (timeout=15m, completion_target=0.9)
                  </div>
                  <div style={{ height: '36px', display: 'flex', alignItems: 'flex-end', gap: '4px', marginTop: '4px' }}>
                    {[25, 25, 26, 25, 24, 25, 26, 25, 25].map((h, i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: `${h}%`,
                          background: '#34d399',
                          borderRadius: '2px'
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ fontSize: '9px', color: '#34d399', marginTop: '4px' }}>
                    Flat, predictable I/O profile with zero latency spikes or disk saturation.
                  </div>
                </div>
              </div>
            </div>

            {/* Config snippet */}
            <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ color: '#34d399', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                Production-Ready postgresql.conf Parameters
              </div>
              <pre style={{ background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '6px', fontSize: '11px', margin: 0, overflowX: 'auto', color: '#e2e8f0' }}>
{`# 1. Spread checkpoints over 15-30 minutes (reduces write frequency)
checkpoint_timeout = ${timeoutMinutes}min

# 2. Allow up to 16-32GB of WAL before triggering emergency forced checkpoint
max_wal_size = 16GB
min_wal_size = 2GB

# 3. Spread dirty page flushing across ${Math.round(completionTarget * 100)}% of the checkpoint interval
checkpoint_completion_target = ${completionTarget}

# 4. Adequate WAL buffer to prevent client commit wait locks (-1 auto-allocates 1/32 of shared_buffers)
wal_buffers = 16MB`}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 3: PG_STAT_BGWRITER */}
        {activeTab === 'pg_stat' && (
          <div>
            <div className="pg-checkpoint-grid" style={{ display: 'grid', gridTemplateColumns: '48% 52%', gap: '14px', marginBottom: '14px' }}>
              {/* Simulator controls */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '13px', marginBottom: '10px' }}>
                  pg_stat_bgwriter Ratio Inspector
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                    <span>checkpoints_timed (Scheduled):</span>
                    <strong style={{ color: '#34d399' }}>{timedCount}</strong>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={timedCount}
                    onChange={e => setTimedCount(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#34d399' }}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                    <span>checkpoints_req (Forced / Early):</span>
                    <strong style={{ color: '#f87171' }}>{reqCount}</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={reqCount}
                    onChange={e => setReqCount(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#f87171' }}
                  />
                </div>

                <div style={{ background: isForcedHigh ? 'rgba(248,113,113,0.15)' : 'rgba(52,211,153,0.15)', border: `1px solid ${isForcedHigh ? '#f87171' : '#34d399'}`, borderRadius: '6px', padding: '10px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Forced Checkpoint Ratio:</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: isForcedHigh ? '#f87171' : '#34d399', marginTop: '2px' }}>
                    {forcedPercent}% Forced
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: isForcedHigh ? '#f87171' : '#34d399', marginTop: '4px' }}>
                    {isForcedHigh
                      ? '⚠️ WARNING: >10% checkpoints are forced! max_wal_size is undersized.'
                      : '✅ HEALTHY: Checkpoints run predictably on schedule.'}
                  </div>
                </div>
              </div>

              {/* SQL Query card */}
              <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                  Production Health Audit SQL
                </div>
                <pre style={{ background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '6px', fontSize: '11px', margin: 0, overflowX: 'auto', color: '#e2e8f0' }}>
{`SELECT 
    checkpoints_timed, 
    checkpoints_req,
    round(100.0 * checkpoints_req / 
          nullif(checkpoints_timed + checkpoints_req, 0), 2) AS forced_checkpoint_pct,
    checkpoint_write_time, 
    checkpoint_sync_time, 
    buffers_checkpoint
FROM pg_stat_bgwriter;`}
                </pre>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '8px', lineHeight: '1.5' }}>
                  If <code>forced_checkpoint_pct &gt; 10%</code>, your application writes data faster than <code>max_wal_size</code> can buffer, triggering emergency flushes. Double <code>max_wal_size</code> to 16GB or 32GB!
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PITFALLS & FULL-PAGE WRITES */}
        {activeTab === 'pitfalls' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '12px', marginBottom: '14px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ color: '#f87171', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
                  1. RTO Crash Recovery Trade-off
                </div>
                <p style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: '1.5' }}>
                  Increasing <code>checkpoint_timeout</code> to 60m and <code>max_wal_size</code> to 64GB eliminates all I/O spikes during runtime. However, if the server loses power, Postgres must replay all WAL records since the last checkpoint, lengthening <strong>Recovery Time Objective (RTO)</strong> upon reboot.
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
                  2. Full-Page Writes (FPW) Amplification
                </div>
                <p style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: '1.5' }}>
                  Immediately after every checkpoint, the first modification to an 8KB data page writes the <strong>entire 8KB page</strong> to WAL (<code>full_page_writes = on</code>) to guard against torn pages. Frequent checkpoints cause massive WAL write amplification!
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ color: '#34d399', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
                  3. wal_buffers Contention
                </div>
                <p style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: '1.5' }}>
                  If <code>wal_buffers</code> is too small (default 512KB), multiple concurrent Java Spring Boot backend connections will contend on WAL insertion locks, leading to high <code>WALWriteLock</code> wait events. Set to 16MB or -1.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
