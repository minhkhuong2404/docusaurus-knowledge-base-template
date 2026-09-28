import React, { useState } from 'react';

export type DdlTab = 'algorithm_matrix' | 'row_log_trap' | 'ghost_vs_ptosc' | 'pg_concurrently';

interface OnlineDdlComparisonDiagramProps {
  initialTab?: DdlTab;
}

export default function OnlineDdlComparisonDiagram({
  initialTab = 'algorithm_matrix',
}: OnlineDdlComparisonDiagramProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<DdlTab>(initialTab);
  const [rowLogUsage, setRowLogUsage] = useState<number>(85);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .ddl-grid-responsive {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Online DDL Mechanics: ALGORITHM Matrix, Row Log Overflow & gh-ost vs pt-osc
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'algorithm_matrix', label: '🎛️ 1. ALGORITHM & LOCK Matrix', color: '#38bdf8' },
            { id: 'row_log_trap', label: '💣 2. The INPLACE Row Log Trap', color: '#f87171' },
            { id: 'ghost_vs_ptosc', label: '👻 3. gh-ost vs pt-osc', color: '#34d399' },
            { id: 'pg_concurrently', label: '🐘 4. PostgreSQL CREATE INDEX CONCURRENTLY', color: '#fbbf24' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as DdlTab)}
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
                transition: 'all 0.2s ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Algorithm Matrix */}
        {activeTab === 'algorithm_matrix' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--ifm-color-content)' }}>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Operation</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Algorithm</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Permitted DML (LOCK)</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Table Rebuild?</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 700, color: '#34d399' }}>Add Secondary Index</td>
                  <td style={{ padding: '8px' }}><code>INPLACE</code></td>
                  <td style={{ padding: '8px', color: '#34d399' }}>Concurrent Reads & Writes (<code>NONE</code>)</td>
                  <td style={{ padding: '8px' }}>No (Builds index B+Tree)</td>
                </tr>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '8px', fontWeight: 700, color: '#38bdf8' }}>Add Column at End (MySQL 8)</td>
                  <td style={{ padding: '8px' }}><code>INSTANT</code></td>
                  <td style={{ padding: '8px', color: '#38bdf8' }}>Concurrent Reads & Writes (Metadata only)</td>
                  <td style={{ padding: '8px' }}>No (&lt; 0.1s duration)</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 700, color: '#fbbf24' }}>Change Column Data Type</td>
                  <td style={{ padding: '8px' }}><code>COPY</code></td>
                  <td style={{ padding: '8px', color: '#f87171' }}>Read-only (<code>SHARED</code> lock, blocks writes!)</td>
                  <td style={{ padding: '8px' }}>Yes (Copies entire table)</td>
                </tr>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '8px', fontWeight: 700, color: '#f87171' }}>Add Fulltext Index</td>
                  <td style={{ padding: '8px' }}><code>INPLACE</code></td>
                  <td style={{ padding: '8px', color: '#f87171' }}>Read-only (Blocks writes during build)</td>
                  <td style={{ padding: '8px' }}>No</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Row Log Trap */}
        {activeTab === 'row_log_trap' && (
          <div>
            <div style={{ marginBottom: '14px', background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: rowLogUsage > 100 ? '#f87171' : '#38bdf8' }}>
                  Online Alter Row Log Buffer: {rowLogUsage} MB / 128 MB (innodb_online_alter_log_max_size)
                </span>
                <span style={{ fontSize: '11px', color: rowLogUsage > 100 ? '#f87171' : '#34d399', fontWeight: 800 }}>
                  {rowLogUsage > 100 ? "💥 OVERFLOW: DDL CRASH & ROLLBACK" : "Healthy Buffer Capacity"}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="160"
                value={rowLogUsage}
                onChange={(e) => setRowLogUsage(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>

            <div className="ddl-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px' }}>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: rowLogUsage > 100 ? '#f87171' : '#34d399', marginBottom: '8px' }}>
                  The Hidden Trap of ALGORITHM=INPLACE
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                  <p>When creating an index with <code>ALGORITHM=INPLACE, LOCK=NONE</code>, MySQL permits live applications to perform concurrent INSERTs, UPDATEs, and DELETEs.</p>
                  <p>All concurrent changes that occur while the B+Tree is being built are temporarily recorded into an <strong>Online Alter Row Log</strong>.</p>
                  <p><strong>The Crash:</strong> If high concurrent write throughput exceeds <code>innodb_online_alter_log_max_size</code> (default 128MB), the DDL aborts with:</p>
                  <pre style={{ margin: 0, padding: '8px', background: '#0f172a', borderRadius: '4px', fontSize: '10px', color: '#f87171' }}>
ERROR 1799 (HY000): Creating index &apos;...&apos; required more than &apos;innodb_online_alter_log_max_size&apos; bytes of modification data.
                  </pre>
                  <p style={{ marginTop: '8px', color: '#f87171' }}>All hours of index creation are rolled back immediately!</p>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                  The Production Remedy
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                  <p>Prior to running large index creations on tables with heavy write traffic, dynamically increase the buffer in your session:</p>
                  <pre style={{ margin: 0, padding: '8px', background: '#0f172a', borderRadius: '4px', fontSize: '10px', color: '#34d399' }}>
SET SESSION innodb_online_alter_log_max_size = 1073741824; -- 1 GB
ALTER TABLE orders ADD INDEX idx_status (status),
  ALGORITHM=INPLACE, LOCK=NONE;
                  </pre>
                  <p style={{ marginTop: '8px' }}>Alternatively, use external triggerless migration tools like <strong>gh-ost</strong>.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: gh-ost vs pt-osc */}
        {activeTab === 'ghost_vs_ptosc' && (
          <div className="ddl-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px' }}>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                pt-online-schema-change (pt-osc)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                <p><strong>Mechanism:</strong> Creates a shadow table and attaches <strong>3 database triggers</strong> (<code>AFTER INSERT</code>, <code>AFTER UPDATE</code>, <code>AFTER DELETE</code>) on the original table to replicate live writes.</p>
                <p><strong>The Risks:</strong>
                <br />• <strong>Write Amplification:</strong> Every write executes a trigger, doubling transactional lock contention.
                <br />• <strong>Deadlocks:</strong> Concurrent batch updates can deadlock on trigger executions.
                <br />• <strong>Unstoppable:</strong> Cannot pause or throttle without dropping the triggers.</p>
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '8px', border: '1px solid #34d399' }}>
              <div style={{ color: '#34d399', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                GitHub&apos;s gh-ost (Triggerless)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                <p><strong>Mechanism:</strong> Triggerless! Connects to MySQL as a <strong>binlog replication client</strong>. Reads binlog stream asynchronously and replays onto the ghost table.</p>
                <p><strong>Key Advantages:</strong>
                <br />• <strong>Dynamic Throttling:</strong> Automatically pauses when replica lag exceeds 1s or CPU exceeds 70%.
                <br />• <strong>Zero Lock Contention:</strong> No database triggers attached to primary table.
                <br />• <strong>Microsecond Cutover:</strong> Performs an atomic, lock-free table swap.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Postgres CONCURRENTLY */}
        {activeTab === 'pg_concurrently' && (
          <div className="ddl-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px' }}>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24', marginBottom: '8px' }}>
                Postgres 2-Pass Scanning Architecture
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                <p>Standard <code>CREATE INDEX</code> takes an <code>ACCESS EXCLUSIVE</code> lock, blocking all reads and writes until completion.</p>
                <p><code>CREATE INDEX CONCURRENTLY</code> takes only a <code>SHARE UPDATE EXCLUSIVE</code> lock (reads and writes continue!). To accomplish this, it performs <strong>two full table scans</strong>:</p>
                <ol style={{ paddingLeft: '16px', margin: 0 }}>
                  <li>Waits for all active write transactions to finish, builds initial B+Tree.</li>
                  <li>Scans table again to catch up with modifications that occurred during pass 1.</li>
                  <li>Waits for all active read snapshots to terminate before marking index valid.</li>
                </ol>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#f87171', marginBottom: '8px' }}>
                The INVALID Index Trap & Remedy
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                <p>If <code>CREATE INDEX CONCURRENTLY</code> fails (e.g. duplicate key violation, cancelled by DBA, or lock timeout), it leaves an <strong>INVALID index</strong> in the catalog:</p>
                <pre style={{ margin: 0, padding: '8px', background: '#0f172a', borderRadius: '4px', fontSize: '10px', color: '#f87171' }}>
{`-- Inspect invalid indexes:
SELECT relname FROM pg_class c 
JOIN pg_index i ON c.oid = i.indexrelid 
WHERE i.indisvalid = false;`}
                </pre>
                <p style={{ marginTop: '8px', color: '#f87171' }}>The index is <strong>never used by queries</strong>, yet EVERY future INSERT/UPDATE must still write to it!</p>
                <p style={{ color: '#34d399' }}><strong>Remedy:</strong> <code>REINDEX CONCURRENTLY &lt;index_name&gt;;</code> or <code>DROP INDEX CONCURRENTLY &lt;index_name&gt;;</code>.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
