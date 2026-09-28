import React, { useState } from 'react';

export type MdlTab = 'undo_bloat' | 'rollback_trap' | 'kill_query_diff' | 'mdl_cascade';

interface LongTransactionMdlMeltdownDiagramProps {
  initialTab?: MdlTab;
}

export default function LongTransactionMdlMeltdownDiagram({
  initialTab = 'mdl_cascade',
}: LongTransactionMdlMeltdownDiagramProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<MdlTab>(initialTab);
  const [mdlStep, setMdlStep] = useState<number>(0);

  const mdlSteps = [
    {
      title: 'Phase 1: Slow SELECT starts',
      clientA: 'SELECT * FROM orders (Long analytical query) ➔ Holds MDL Shared Read Lock',
      clientB: 'Idle',
      subsequentClients: 'Running normally (1ms response time)',
      poolStatus: 'Healthy (2/100 connections active)',
      isMeltdown: false,
    },
    {
      title: 'Phase 2: DDL Migration is executed',
      clientA: 'Still reading orders (holds MDL Shared Read)',
      clientB: 'ALTER TABLE orders ADD COLUMN status ... ➔ Requests MDL Exclusive Lock (BLOCKED by Client A)',
      subsequentClients: 'Running normally',
      poolStatus: 'Healthy (3/100 connections active)',
      isMeltdown: false,
    },
    {
      title: 'Phase 3: MySQL Queues DDL; Next Reads Block!',
      clientA: 'Still running slow SELECT',
      clientB: 'Waiting for table metadata lock (Exclusive request queued at head)',
      subsequentClients: 'SELECT * FROM orders WHERE id = 123 ➔ BLOCKED behind DDL Exclusive lock!',
      poolStatus: 'Warning: 28/100 connections waiting on MDL',
      isMeltdown: false,
    },
    {
      title: 'Phase 4: Complete Service Meltdown!',
      clientA: 'Still running slow SELECT',
      clientB: 'Still waiting for table metadata lock',
      subsequentClients: 'ALL incoming API requests querying `orders` are blocked!',
      poolStatus: 'CRITICAL: 100/100 HikariCP connections exhausted! Total API outage.',
      isMeltdown: true,
    },
  ];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .mdl-grid-responsive {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Long Transactions: Undo Bloat, Rollback Traps & The Metadata Lock (MDL) Cascade
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'mdl_cascade', label: '💥 1. MDL Lock Queue Meltdown', color: '#f87171' },
            { id: 'undo_bloat', label: '📈 2. Undo Log & HLL Bloat', color: '#fbbf24' },
            { id: 'rollback_trap', label: '⏳ 3. The Unskippable Rollback', color: '#a78bfa' },
            { id: 'kill_query_diff', label: '🔪 4. KILL QUERY vs KILL CONNECTION', color: '#38bdf8' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as MdlTab)}
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

        {/* Tab 1: MDL Queue Meltdown */}
        {activeTab === 'mdl_cascade' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: mdlSteps[mdlStep].isMeltdown ? '#f87171' : '#38bdf8' }}>
                Step {mdlStep} / 3: {mdlSteps[mdlStep].title}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  disabled={mdlStep === 0}
                  onClick={() => setMdlStep((s) => Math.max(0, s - 1))}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '4px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.05)',
                    color: mdlStep === 0 ? '#64748b' : '#f8fafc',
                    cursor: mdlStep === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '11px',
                  }}
                >
                  ◀ Previous
                </button>
                <button
                  disabled={mdlStep === 3}
                  onClick={() => setMdlStep((s) => Math.min(3, s + 1))}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '4px',
                    border: 'none',
                    background: mdlStep === 3 ? 'rgba(255,255,255,0.05)' : '#f87171',
                    color: mdlStep === 3 ? '#64748b' : '#ffffff',
                    fontWeight: 700,
                    cursor: mdlStep === 3 ? 'not-allowed' : 'pointer',
                    fontSize: '11px',
                  }}
                >
                  Next Step ▶
                </button>
              </div>
            </div>

            <div className="mdl-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', marginBottom: '14px' }}>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                  MySQL Metadata Lock Queue Flow
                </div>

                <svg viewBox="0 0 480 200" style={{ width: '100%', height: 'auto' }}>
                  {/* Table Object */}
                  <rect x="20" y="20" width="440" height="35" rx="4" fill="#1e293b" stroke="#38bdf8" />
                  <text x="240" y="42" fill="#38bdf8" fontSize="12" fontWeight="700" textAnchor="middle">Table: orders</text>

                  {/* Active Holder */}
                  <rect x="30" y="70" width="420" height="28" rx="4" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" />
                  <text x="40" y="88" fill="#38bdf8" fontSize="10">Holder: Client A (Slow SELECT) ➔ MDL Shared Read</text>

                  {/* Pending DDL */}
                  {mdlStep >= 1 && (
                    <g transform="translate(30, 105)">
                      <rect x="0" y="0" width="420" height="28" rx="4" fill="rgba(251, 191, 36, 0.2)" stroke="#fbbf24" strokeWidth="1.5" />
                      <text x="10" y="18" fill="#fef08a" fontSize="10" fontWeight="700">Waiting Head: ALTER TABLE orders ADD COLUMN ... (Exclusive Request)</text>
                    </g>
                  )}

                  {/* Blocked Readers */}
                  {mdlStep >= 2 && (
                    <g transform="translate(30, 140)">
                      <rect x="0" y="0" width="420" height="45" rx="4" fill={mdlStep === 3 ? "rgba(248, 113, 113, 0.3)" : "rgba(248, 113, 113, 0.15)"} stroke="#f87171" strokeWidth={mdlStep === 3 ? "2" : "1"} />
                      <text x="10" y="18" fill="#f87171" fontSize="10" fontWeight="800">
                        {mdlStep === 3 ? "BLOCKED QUEUE: 98 FastAPI / Spring Boot Worker Connections!" : "Blocked: SELECT * FROM orders WHERE id = 123 (Waiting for metadata lock)"}
                      </text>
                      <text x="10" y="34" fill="#e2e8f0" fontSize="9">
                        MySQL blocks all readers behind pending exclusive DDL to prevent writer starvation!
                      </text>
                    </g>
                  )}
                </svg>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: mdlSteps[mdlStep].isMeltdown ? '#f87171' : '#fbbf24', marginBottom: '8px' }}>
                  Connection Pool Status
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: mdlSteps[mdlStep].isMeltdown ? '#f87171' : '#34d399', marginBottom: '8px' }}>
                  {mdlSteps[mdlStep].poolStatus}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                  <p>In MySQL 5.5+, Metadata Locks (MDL) ensure that while a transaction is reading a table, no other transaction can alter the table definition.</p>
                  <p><strong>The Deadly Priority Rule:</strong> MySQL gives waiting DDL statements <strong>higher priority than new read requests</strong>. As soon as a DDL waits, every subsequent read on that table is queued behind it.</p>
                  <p style={{ color: '#f87171', fontWeight: 600 }}>Within seconds, your entire application connection pool is consumed by waiting threads, causing cascading HTTP 500 errors across all microservices.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Undo Log Bloat */}
        {activeTab === 'undo_bloat' && (
          <div className="mdl-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px' }}>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24', marginBottom: '8px' }}>
                History List Length (HLL) & MVCC Purge Stall
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                <p>When an uncommitted transaction remains open for hours, its <code>ReadView</code> locks the MVCC purge horizon.</p>
                <p>InnoDB cannot purge old undo log versions for ANY row modified across the entire database as long as they might be visible to that old ReadView.</p>
                <p><strong>Consequences:</strong>
                <br />• <code>History list length</code> climbs into the millions.
                <br />• Undo tablespace files (<code>undo_001</code>, <code>undo_002</code>) expand to tens of gigabytes.
                <br />• All SELECT queries must traverse long chains of undo roll pointers (<code>roll_ptr</code>), degrading query throughput by 5x-10x.</p>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                Detection Query (MySQL)
              </div>
              <pre style={{ margin: 0, padding: '10px', background: '#0f172a', borderRadius: '6px', fontSize: '11px', color: '#e2e8f0' }}>
{`-- Inspect active long-running transactions:
SELECT 
    trx_id,
    trx_state,
    trx_started,
    TIMESTAMPDIFF(SECOND, trx_started, NOW()) AS duration_sec,
    trx_query,
    trx_rows_modified
FROM information_schema.innodb_trx
ORDER BY trx_started ASC;

-- Check History List Length:
SHOW ENGINE INNODB STATUS\\G
-- Look under "TRANSACTIONS":
-- "History list length 3412098"`}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: Rollback Trap */}
        {activeTab === 'rollback_trap' && (
          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#a78bfa', marginBottom: '8px' }}>
              Why Cancelling a Big Transaction Takes Longer than Running It
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
              <p>Suppose an engineer accidentally runs an un-indexed bulk update: <code>UPDATE orders SET status = &apos;PROCESSED&apos;;</code> on 5 million rows.</p>
              <p>After 10 minutes, they realize the mistake and hit <em>Cancel</em> in their IDE or execute <code>KILL CONNECTION</code>.</p>
              <p><strong>The Trap:</strong> Rollback is <strong>single-threaded</strong>. InnoDB must traverse the undo log backwards, reading pages into buffer pool, reversing changes, and updating secondary index leaf nodes. <strong>Rollback frequently takes 2x to 3x longer than the write itself!</strong></p>
              <div style={{ padding: '8px', background: 'rgba(248, 113, 113, 0.1)', borderRadius: '4px', borderLeft: '3px solid #f87171', marginTop: '8px' }}>
                <strong style={{ color: '#f87171' }}>⛔ NEVER RESTART THE DATABASE TO STOP A ROLLBACK!</strong>
                <br />If you kill the MySQL process (<code>kill -9 mysqld</code>), the database enters Crash Recovery upon reboot. It MUST execute the undo phase to restore ACID consistency before opening connections. Your database will stay dead for hours!
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: KILL QUERY vs KILL CONNECTION */}
        {activeTab === 'kill_query_diff' && (
          <div className="mdl-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px' }}>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '8px', border: '1px solid #38bdf8' }}>
              <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
                KILL QUERY &lt;id&gt;
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                <p>Stops the <strong>currently executing statement</strong> on thread <code>&lt;id&gt;</code>.</p>
                <p>The client receives <code>ERROR 1317 (70100): Query execution was interrupted</code>.</p>
                <p style={{ color: '#f87171', fontWeight: 600 }}>
                  <strong>The Danger:</strong> The transaction remains <strong>OPEN</strong>! Any locks acquired by prior statements in that transaction remain held until the client connection issues <code>COMMIT</code> or <code>ROLLBACK</code>!
                </p>
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '8px', border: '1px solid #34d399' }}>
              <div style={{ color: '#34d399', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
                KILL CONNECTION &lt;id&gt;
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                <p>Severs the client TCP socket connection and terminates thread <code>&lt;id&gt;</code>.</p>
                <p>MySQL automatically initiates an <strong>asynchronous transaction rollback</strong>, releasing all acquired row locks and Metadata Locks immediately upon completion.</p>
                <p style={{ color: '#34d399', fontWeight: 600 }}>
                  <strong>Recommended:</strong> Always use <code>KILL CONNECTION</code> during emergency triage to guarantee complete release of held locks.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
