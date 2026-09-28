import React, { useState } from 'react';

export type WalTab = 'noop_wal' | 'orphan_slots' | 'archive_fail' | 'disk_playbook';

interface PostgresWalReplicationPlaybookDiagramProps {
  initialTab?: WalTab;
}

export default function PostgresWalReplicationPlaybookDiagram({
  initialTab = 'noop_wal',
}: PostgresWalReplicationPlaybookDiagramProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<WalTab>(initialTab);
  const [updateGuard, setUpdateGuard] = useState<'naive_update' | 'guarded_update'>('naive_update');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .wal-grid-responsive {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          <line x1="12" y1="12" x2="12" y2="21" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          PostgreSQL WAL Amplification, Orphan Slots & 2 AM Disk-Full Playbook
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'noop_wal', label: '🔥 1. 380MB No-Op Update Trap', color: '#f87171' },
            { id: 'orphan_slots', label: '🕳️ 2. Orphan Replication Slots', color: '#fbbf24' },
            { id: 'archive_fail', label: '⚠️ 3. Silent archive_command Failure', color: '#a78bfa' },
            { id: 'disk_playbook', label: '🚨 4. The 2 AM 95% Disk Playbook', color: '#34d399' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as WalTab)}
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

        {/* Tab 1: No-op update */}
        {activeTab === 'noop_wal' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button
                onClick={() => setUpdateGuard('naive_update')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: updateGuard === 'naive_update' ? 'rgba(248, 113, 113, 0.25)' : 'rgba(255,255,255,0.05)',
                  color: updateGuard === 'naive_update' ? '#f87171' : 'var(--ifm-color-content-secondary)',
                  border: `1px solid ${updateGuard === 'naive_update' ? '#f87171' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                ❌ Naive UPDATE (380 MB WAL Generated for 0 changes)
              </button>
              <button
                onClick={() => setUpdateGuard('guarded_update')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: updateGuard === 'guarded_update' ? 'rgba(52, 211, 153, 0.25)' : 'rgba(255,255,255,0.05)',
                  color: updateGuard === 'guarded_update' ? '#34d399' : 'var(--ifm-color-content-secondary)',
                  border: `1px solid ${updateGuard === 'guarded_update' ? '#34d399' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                ✅ Short-Circuited UPDATE (0 MB WAL Generated)
              </button>
            </div>

            <div className="wal-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px' }}>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: updateGuard === 'naive_update' ? '#f87171' : '#34d399', marginBottom: '8px' }}>
                  Query Execution & WAL Impact
                </div>
                <pre style={{ margin: 0, padding: '10px', background: '#0f172a', borderRadius: '6px', fontSize: '11px', color: '#e2e8f0' }}>
{updateGuard === 'naive_update' ? `-- Updating 1,000,000 rows already marked ACTIVE:
UPDATE accounts 
SET status = 'ACTIVE' 
WHERE tenant_id = 42;

-- Result:
-- Rows updated: 1,000,000
-- Data logically changed: 0 bytes
-- New heap tuples inserted: 1,000,000
-- WAL Bytes Generated: 382.4 MB!
-- Replica Replay Lag: +45 seconds` : `-- Short-circuiting identical values:
UPDATE accounts 
SET status = 'ACTIVE' 
WHERE tenant_id = 42
  AND status IS DISTINCT FROM 'ACTIVE';

-- Result:
-- Rows updated: 0
-- New heap tuples inserted: 0
-- WAL Bytes Generated: 0 KB
-- Replica Replay Lag: 0 ms`}
                </pre>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24', marginBottom: '8px' }}>
                  Why PostgreSQL Writes Full WAL for No-Op Updates
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                  <p>In PostgreSQL&apos;s append-only MVCC architecture, an <code>UPDATE</code> does not compare previous and new column values by default.</p>
                  <p>It creates a brand new tuple version on disk, assigns a new <code>xmax</code>, and writes a complete WAL modification record for crash recovery and replication.</p>
                  <p style={{ color: '#f87171', fontWeight: 600 }}>A routine cron job executing un-guarded updates can silently produce hundreds of gigabytes of WAL every day, choking standbys and blowing disk quotas.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Orphan Slots */}
        {activeTab === 'orphan_slots' && (
          <div className="wal-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px' }}>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24', marginBottom: '8px' }}>
                How an Abandoned Slot Pins pg_wal Files
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                <p>Replication slots (physical or logical, e.g. for Debezium CDC) guarantee that the primary database will <strong>never delete WAL segments</strong> until the slot confirms they have been consumed (<code>restart_lsn</code>).</p>
                <p>If a developer spins up a CDC test or a standby pod crashes and never recovers, the slot remains in <code>pg_replication_slots</code> with <code>active = false</code>.</p>
                <p style={{ color: '#f87171', fontWeight: 700 }}>Checkpoints run, but pg_wal CANNOT recycle segments! The disk fills until 100% full, causing PostgreSQL to immediately shut down (PANIC).</p>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                Detection Query
              </div>
              <pre style={{ margin: 0, padding: '10px', background: '#0f172a', borderRadius: '6px', fontSize: '11px', color: '#e2e8f0' }}>
{`-- Find inactive slots retaining massive WAL:
SELECT 
    slot_name,
    slot_type,
    active,
    pg_size_pretty(
      pg_wal_lsn_diff(
        pg_current_wal_lsn(), 
        restart_lsn
      )
    ) AS retained_wal_bytes
FROM pg_replication_slots
ORDER BY pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn) DESC;`}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: Silent archive_command failure */}
        {activeTab === 'archive_fail' && (
          <div className="wal-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px' }}>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#a78bfa', marginBottom: '8px' }}>
                The Silent Archive Stalling Mechanism
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                <p>When continuous archiving is enabled (<code>archive_mode = on</code>), PostgreSQL delegates WAL archiving to <code>archive_command</code> (e.g. <code>aws s3 cp ...</code> or <code>wal-g</code>).</p>
                <p>If the script exits with any <strong>non-zero exit code</strong> (expired IAM credentials, S3 network timeout, full backup volume):</p>
                <ul>
                  <li>Postgres retries the exact same segment indefinitely.</li>
                  <li><strong>All subsequent WAL segments are blocked</strong> from being archived or removed!</li>
                  <li>The database appears to function normally until <code>pg_wal</code> consumes 100% of the filesystem.</li>
                </ul>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                Verification Command
              </div>
              <pre style={{ margin: 0, padding: '10px', background: '#0f172a', borderRadius: '6px', fontSize: '11px', color: '#e2e8f0' }}>
{`-- Inspect archiver health:
SELECT 
    archived_count,
    last_archived_wal,
    last_archived_time,
    failed_count,
    last_failed_wal,
    last_failed_time
FROM pg_stat_archiver;

-- Alert if failed_count > 0 and 
-- last_failed_time > last_archived_time!`}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 4: 2 AM Playbook */}
        {activeTab === 'disk_playbook' && (
          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', marginBottom: '12px' }}>
              Playbook 2:00 AM: Disk At 95% and Rising (Emergency Runbook)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ background: 'rgba(248, 113, 113, 0.1)', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #f87171' }}>
                <strong style={{ color: '#f87171', fontSize: '11px' }}>⛔ RULE 1: NEVER RUN `rm pg_wal/*` DIRECTLY!</strong>
                <div style={{ fontSize: '10px', color: '#fca5a5', marginTop: '2px' }}>
                  Deleting an unarchived or un-checkpointed WAL file corrupts transaction history and prevents PostgreSQL from ever starting again.
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px' }}>
                <strong style={{ color: '#38bdf8', fontSize: '12px' }}>Step 1: Check and Drop Inactive Replication Slots</strong>
                <pre style={{ margin: '6px 0 0 0', padding: '6px', background: '#0f172a', borderRadius: '4px', fontSize: '10px', color: '#e2e8f0' }}>
{`SELECT slot_name FROM pg_replication_slots WHERE active = false;
-- Drop the orphan slot:
SELECT pg_drop_replication_slot('abandoned_cdc_slot');`}
                </pre>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px' }}>
                <strong style={{ color: '#fbbf24', fontSize: '12px' }}>Step 2: Force Immediate Checkpoint to Recycle Files</strong>
                <pre style={{ margin: '6px 0 0 0', padding: '6px', background: '#0f172a', borderRadius: '4px', fontSize: '10px', color: '#e2e8f0' }}>
{`CHECKPOINT; -- Triggers immediate reuse of all unpinned WAL files`}
                </pre>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px' }}>
                <strong style={{ color: '#34d399', fontSize: '12px' }}>Step 3: Temporarily Bound wal_keep_size</strong>
                <pre style={{ margin: '6px 0 0 0', padding: '6px', background: '#0f172a', borderRadius: '4px', fontSize: '10px', color: '#e2e8f0' }}>
{`ALTER SYSTEM SET wal_keep_size = '2GB';
SELECT pg_reload_conf();`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
