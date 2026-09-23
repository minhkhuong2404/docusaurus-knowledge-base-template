import React, { useState } from 'react';

export type PgLockTab = 'xmax_storage' | 'four_lock_modes' | 'eval_plan_qual' | 'ssi_dependencies';

interface PostgresUpdateLockingDiagramProps {
  initialTab?: PgLockTab;
}

export default function PostgresUpdateLockingDiagram({
  initialTab = 'xmax_storage',
}: PostgresUpdateLockingDiagramProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<PgLockTab>(initialTab);
  const [fkLockScenario, setFkLockScenario] = useState<'update_non_key' | 'update_primary_key'>('update_non_key');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .pg-lock-grid-responsive {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          PostgreSQL Row Locking Mechanics: xmax, 4 Lock Modes, EvalPlanQual & SSI
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'xmax_storage', label: '💾 1. xmax In-Place Tuple Lock', color: '#38bdf8' },
            { id: 'four_lock_modes', label: '🔒 2. 4 Lock Modes & Foreign Keys', color: '#fbbf24' },
            { id: 'eval_plan_qual', label: '🔄 3. EvalPlanQual (EPQ) Recheck', color: '#34d399' },
            { id: 'ssi_dependencies', label: '📐 4. SSI rw-Antidependencies', color: '#a78bfa' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as PgLockTab)}
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

        {/* Tab 1: xmax In-Place Lock */}
        {activeTab === 'xmax_storage' && (
          <div className="pg-lock-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px' }}>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                PostgreSQL Heap Page: Tuple Header Anatomy (HeapTupleHeaderData)
              </div>
              <svg viewBox="0 0 460 210" style={{ width: '100%', height: 'auto' }}>
                {/* 8KB Block representation */}
                <rect x="20" y="20" width="420" height="170" rx="8" fill="#0f172a" stroke="#334155" />
                <text x="230" y="42" fill="#94a3b8" fontSize="11" fontWeight="700" textAnchor="middle">
                  Heap Page Block (shared_buffers)
                </text>

                {/* Tuple Header Box */}
                <rect x="40" y="55" width="380" height="70" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="50" y="75" fill="#38bdf8" fontSize="11" fontWeight="700">HeapTupleHeader (23 Bytes)</text>

                <g transform="translate(50, 85)">
                  <rect x="0" y="0" width="75" height="25" fill="#334155" rx="3" />
                  <text x="37" y="16" fill="#f8fafc" fontSize="9" textAnchor="middle">t_xmin: 1001</text>

                  <rect x="85" y="0" width="105" height="25" fill="rgba(248, 113, 113, 0.3)" stroke="#f87171" rx="3" />
                  <text x="137" y="16" fill="#fca5a5" fontSize="9" fontWeight="800" textAnchor="middle">t_xmax: 1005 (LOCK)</text>

                  <rect x="200" y="0" width="165" height="25" fill="#334155" rx="3" />
                  <text x="282" y="16" fill="#94a3b8" fontSize="9" textAnchor="middle">t_infomask: EXCL_LOCK</text>
                </g>

                {/* Second Transaction waiting */}
                <rect x="40" y="135" width="380" height="40" rx="6" fill="rgba(251, 191, 36, 0.15)" stroke="#fbbf24" />
                <text x="230" y="155" fill="#fbbf24" fontSize="10" fontWeight="700" textAnchor="middle">
                  Tx 1009 inspects xmax=1005 ➔ Active in ProcArray
                </text>
                <text x="230" y="168" fill="#e2e8f0" fontSize="9" textAnchor="middle">
                  Sleeps on virtual transaction lock: XactLockTableWait(1005)
                </text>
              </svg>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                Why PostgreSQL Does NOT Have a Row Lock Table
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                <p>In MySQL InnoDB, row locks consume memory inside a centralized Lock Manager table. Locking 10 million rows can exhaust server RAM.</p>
                <p>PostgreSQL avoids this by <strong>writing row locks directly into the tuple header on disk/shared buffers using <code>t_xmax</code></strong>. It can lock 1 billion rows with exactly 0 bytes of lock table overhead!</p>
                <p style={{ color: '#34d399', fontWeight: 600 }}>Multi-transactions (MultiXact): If multiple readers hold <code>FOR SHARE</code> locks, <code>xmax</code> points to a MultiXactId in <code>pg_multixact/</code>.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: 4 Lock Modes & FKs */}
        {activeTab === 'four_lock_modes' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button
                onClick={() => setFkLockScenario('update_non_key')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: fkLockScenario === 'update_non_key' ? 'rgba(52, 211, 153, 0.25)' : 'rgba(255,255,255,0.05)',
                  color: fkLockScenario === 'update_non_key' ? '#34d399' : 'var(--ifm-color-content-secondary)',
                  border: `1px solid ${fkLockScenario === 'update_non_key' ? '#34d399' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                ✅ UPDATE non-key column (FOR NO KEY UPDATE: No FK Conflict)
              </button>
              <button
                onClick={() => setFkLockScenario('update_primary_key')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: fkLockScenario === 'update_primary_key' ? 'rgba(248, 113, 113, 0.25)' : 'rgba(255,255,255,0.05)',
                  color: fkLockScenario === 'update_primary_key' ? '#f87171' : 'var(--ifm-color-content-secondary)',
                  border: `1px solid ${fkLockScenario === 'update_primary_key' ? '#f87171' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                ⚠️ UPDATE Primary Key (FOR UPDATE: Blocks Child INSERTs)
              </button>
            </div>

            <div className="pg-lock-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px' }}>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: fkLockScenario === 'update_non_key' ? '#34d399' : '#f87171', marginBottom: '8px' }}>
                  {fkLockScenario === 'update_non_key' ? "Concurrent Non-Key Update & Child Insert" : "Primary Key Update Conflict"}
                </div>
                <pre style={{ margin: 0, padding: '10px', background: '#0f172a', borderRadius: '6px', fontSize: '11px', color: '#e2e8f0' }}>
{fkLockScenario === 'update_non_key' ? `-- Tx 1: Updating user's name:
UPDATE users SET name = 'Alice' WHERE id = 42;
-- Acquires FOR NO KEY UPDATE on user 42

-- Tx 2: Inserting child order:
INSERT INTO orders (user_id, total) VALUES (42, 99.00);
-- Acquires FOR KEY SHARE on user 42

-- Result: FOR NO KEY UPDATE is COMPATIBLE with FOR KEY SHARE!
-- Both transactions proceed concurrently without waiting.` : `-- Tx 1: Updating primary key or deleting:
UPDATE users SET id = 999 WHERE id = 42;
-- Acquires heavy FOR UPDATE on user 42

-- Tx 2: Inserting child order:
INSERT INTO orders (user_id, total) VALUES (42, 99.00);
-- Requests FOR KEY SHARE on user 42

-- Result: FOR UPDATE CONFLICTS with FOR KEY SHARE!
-- Tx 2 BLOCKS until Tx 1 commits or rolls back.`}
                </pre>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24', marginBottom: '8px' }}>
                  The 4 PostgreSQL Row-Level Lock Modes Matrix
                </div>
                <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.05)', color: '#f8fafc' }}>
                      <th style={{ padding: '6px', textAlign: 'left' }}>Mode</th>
                      <th style={{ padding: '6px', textAlign: 'left' }}>Triggered By</th>
                      <th style={{ padding: '6px', textAlign: 'left' }}>Conflicts With</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '6px', color: '#34d399', fontWeight: 700 }}>FOR KEY SHARE</td>
                      <td style={{ padding: '6px' }}>FK check on parent row</td>
                      <td style={{ padding: '6px', color: '#f87171' }}>FOR UPDATE only</td>
                    </tr>
                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '6px', color: '#38bdf8', fontWeight: 700 }}>FOR SHARE</td>
                      <td style={{ padding: '6px' }}>Explicit SELECT FOR SHARE</td>
                      <td style={{ padding: '6px', color: '#f87171' }}>FOR UPDATE, NO KEY UPDATE</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px', color: '#fbbf24', fontWeight: 700 }}>FOR NO KEY UPDATE</td>
                      <td style={{ padding: '6px' }}>Standard UPDATE non-unique col</td>
                      <td style={{ padding: '6px', color: '#f87171' }}>FOR UPDATE, NO KEY UPDATE, SHARE</td>
                    </tr>
                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '6px', color: '#f87171', fontWeight: 700 }}>FOR UPDATE</td>
                      <td style={{ padding: '6px' }}>DELETE / UPDATE PK / explicit</td>
                      <td style={{ padding: '6px', color: '#f87171' }}>ALL MODES (Exclusive)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: EvalPlanQual (EPQ) */}
        {activeTab === 'eval_plan_qual' && (
          <div className="pg-lock-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px' }}>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', marginBottom: '8px' }}>
                How EvalPlanQual (EPQ) Handles Concurrent Updates
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                <p>Under <code>READ COMMITTED</code>, when Transaction B attempts to update a row that was just committed by Transaction A:</p>
                <ol style={{ paddingLeft: '16px', margin: 0 }}>
                  <li>Tx B wakes up and notices row v1 was superseded by row v2.</li>
                  <li>Postgres does <strong>NOT fail or error out</strong>.</li>
                  <li>It invokes <strong>EvalPlanQual</strong>: fetches newest tuple v2 and re-evaluates the query&apos;s original <code>WHERE</code> condition against v2.</li>
                  <li><strong>If WHERE still matches:</strong> Tx B updates row v2.</li>
                  <li><strong>If WHERE no longer matches:</strong> Tx B silently skips the row (0 rows updated).</li>
                </ol>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#f87171', marginBottom: '8px' }}>
                The Contrast with REPEATABLE READ & SERIALIZABLE
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                <p>Under <code>REPEATABLE READ</code> or <code>SERIALIZABLE</code>, EvalPlanQual is <strong>disabled</strong>.</p>
                <p>If Tx B attempts to update a row modified by a concurrent transaction committed after Tx B&apos;s snapshot started, Postgres throws an immediate error:</p>
                <pre style={{ margin: 0, padding: '8px', background: '#0f172a', borderRadius: '4px', fontSize: '10px', color: '#f87171' }}>
ERROR: could not serialize access due to concurrent update
                </pre>
                <p style={{ marginTop: '8px' }}>The application must catch this exception and retry the transaction from the beginning.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: SSI Dependencies */}
        {activeTab === 'ssi_dependencies' && (
          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#a78bfa', marginBottom: '8px' }}>
              Serializable Snapshot Isolation (SSI): Why False Positives Are By Design
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
              <p>PostgreSQL SSI tracks read-write conflicts using non-blocking in-memory <strong>SIREAD locks</strong> (predicate locks) on tuples, pages, and relations.</p>
              <p>When Transaction T₁ reads data and concurrent Transaction T₂ writes that data, a read-write antidependency edge is recorded (T₁ &rarr; T₂).</p>
              <p>To mathematically guarantee true serializability without heavyweight read locks, PostgreSQL checks for dangerous structures (T_in &rarr; T₀ &rarr; T_out). Because lock granularity escalates to pages when memory is low, <strong>false positive aborts can occur even if transactions touch different rows on the same page</strong>!</p>
              <div style={{ padding: '8px', background: 'rgba(167, 139, 250, 0.1)', borderRadius: '4px', border: '1px solid #a78bfa', marginTop: '8px' }}>
                <strong style={{ color: '#a78bfa' }}>Key Rule:</strong> <code>could not serialize access due to read/write dependencies</code> is <strong>NOT a bug</strong>. It is the mathematical guarantee of mathematical serializability in an MVCC engine. Every application using SERIALIZABLE <strong>must implement an automatic retry loop</strong>!
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
