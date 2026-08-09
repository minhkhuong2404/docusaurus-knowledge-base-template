import React, { useState } from 'react';

type TabType = 'anomalies' | 'matrix' | 'implementations' | 'fixes' | 'spec-vs-impl';

// ─── helpers ─────────────────────────────────────────────────────────────────

function Badge({ color, text }: { color: string; text: string }) {
  return (
    <span style={{
      fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px',
      background: `${color}18`, color, display: 'inline-block',
    }}>{text}</span>
  );
}

function Check({ ok }: { ok: boolean }) {
  return <span style={{ color: ok ? '#f87171' : '#34d399', fontWeight: 700 }}>{ok ? '✅ Possible' : '❌ Prevented'}</span>;
}

// ─── data ─────────────────────────────────────────────────────────────────────

const ANOMALIES = [
  {
    id: 'dirty-read',
    name: 'Dirty Read',
    origin: 'ANSI SQL 1992 (P1)',
    color: '#f87171',
    oneLiner: 'You read data that was never officially committed.',
    story: 'Transaction A updates a balance but hasn\'t committed yet. Transaction B reads that value. Then A rolls back. B just acted on a phantom — data that never officially existed.',
    analogy: 'Overhearing your manager say "I\'m promoting Alice" before they\'ve signed anything. You congratulate Alice. Then the manager says "I was thinking out loud, it\'s not decided." You embarrassed yourself on phantom information.',
    timeline: [
      { t: 'T1', a: 'UPDATE balance = $0 WHERE id = 1  ← not committed', b: '(idle)', note: '' },
      { t: 'T2', a: '(processing...)', b: 'SELECT balance → sees $0!', note: '⚠️ Reads uncommitted data' },
      { t: 'T3', a: 'ROLLBACK', b: 'Acts on the $0 balance', note: '💥 B read data that never existed' },
    ],
    prevention: 'READ COMMITTED or higher',
    keyInsight: 'Solved in PostgreSQL, Oracle, SQL Server by default. Even at READ UNCOMMITTED, PostgreSQL silently upgrades to READ COMMITTED — dirty reads are impossible there.',
  },
  {
    id: 'non-repeatable',
    name: 'Non-Repeatable Read',
    origin: 'ANSI SQL 1992 (P2)',
    color: '#fbbf24',
    oneLiner: 'Same row, same query, same transaction — two different answers.',
    story: 'In one transaction, B reads a row twice. Between those two reads, another transaction committed a change. The row looks different. The read is not "repeatable."',
    analogy: 'You look at the stock price at 10am: $100. You blink. 10:01am: $95. You\'re in the same "meeting" (transaction) but reality shifted under you.',
    timeline: [
      { t: 'T1', a: 'SELECT balance WHERE id=1 → $500', b: '(idle)', note: 'First read' },
      { t: 'T2', a: '(processing...)', b: 'UPDATE balance = $300; COMMIT', note: '⚠️ Concurrent write commits' },
      { t: 'T3', a: 'SELECT balance WHERE id=1 → $300', b: '(idle)', note: '💥 Same row, different value!' },
    ],
    prevention: 'REPEATABLE READ or higher',
    keyInsight: 'READ COMMITTED uses a per-statement snapshot, so each SELECT sees the latest committed data — two reads in one transaction CAN differ. REPEATABLE READ uses a per-transaction snapshot, freezing reality at transaction start.',
  },
  {
    id: 'phantom',
    name: 'Phantom Read',
    origin: 'ANSI SQL 1992 (P3)',
    color: '#c084fc',
    oneLiner: 'Your range query returns a different count — a ghost appeared.',
    story: 'Transaction A counts rows matching a condition: 10. Another transaction inserts a matching row and commits. A re-runs the count: 11. No existing row changed — a new "phantom" appeared.',
    analogy: 'You count the chairs in a room: 10. You step out and come back. 11 chairs. Someone snuck one in. The chairs you saw before are the same — but now there\'s an extra one you didn\'t plan for.',
    timeline: [
      { t: 'T1', a: 'SELECT COUNT(*) WHERE balance > 100 → 5', b: '(idle)', note: 'Initial count' },
      { t: 'T2', a: '(processing report...)', b: 'INSERT (balance=200); COMMIT', note: '⚠️ New qualifying row added' },
      { t: 'T3', a: 'SELECT COUNT(*) WHERE balance > 100 → 6', b: '(idle)', note: '💥 Phantom row appeared!' },
    ],
    prevention: 'SERIALIZABLE (standard) — or REPEATABLE READ in PostgreSQL (snapshot blocks phantoms)',
    keyInsight: 'This is the gap between standard theory and PostgreSQL reality. Standard says REPEATABLE READ allows phantoms. PostgreSQL\'s per-transaction snapshot naturally blocks them — you get phantom protection "for free" at REPEATABLE READ.',
  },
  {
    id: 'lost-update',
    name: 'Lost Update',
    origin: '1995 Critique (P4)',
    color: '#ef4444',
    oneLiner: 'Two transactions both read, compute, and write — one silently erases the other.',
    story: 'The e-wallet bug. Two withdrawal requests arrive nearly simultaneously. Both read balance = 500k. Both check "enough funds?" — yes. Both write their result. The second write overwrites the first. One withdrawal is silently lost.',
    analogy: 'Two cashiers, one register till. Both count $500. One gives change for $100 purchase, puts $400 back. Other gives change for $200 purchase, puts $300 back. Final till: $300. But it should be $200. $100 vanished — no exception, no alert.',
    timeline: [
      { t: 'T1', a: 'SELECT balance → $500', b: 'SELECT balance → $500', note: 'Both read same value' },
      { t: 'T2', a: 'Compute: $500 - $100 = $400', b: 'Compute: $500 - $200 = $300', note: 'Both compute independently' },
      { t: 'T3', a: 'UPDATE balance = $400; COMMIT', b: '(waiting)', note: 'A commits first' },
      { t: 'T4', a: '(done)', b: 'UPDATE balance = $300; COMMIT', note: '💥 B overwrites A! $100 withdrawal lost.' },
    ],
    prevention: 'REPEATABLE READ (PG aborts T2) / SELECT FOR UPDATE / atomic UPDATE',
    keyInsight: 'This is what no isolation level name warns you about. It\'s silent: no exception, no log entry. The only symptom is end-of-day balance reconciliation failing. The fix is usually at the query level — not by raising isolation.',
  },
  {
    id: 'write-skew',
    name: 'Write Skew',
    origin: '1995 Critique (P5)',
    color: '#38bdf8',
    oneLiner: 'Two transactions both check a shared invariant, then each writes to a different row — combined result breaks the invariant.',
    story: 'Hospital rule: at least 1 doctor on-call. Doctor An requests leave. Checks: 2 doctors on-call — ok. Doctor Binh simultaneously requests leave. Also checks: 2 on-call — ok. Both write to different rows. Both commit. Result: 0 doctors on-call.',
    analogy: 'Two people both check: "Is there at least one lifeguard on duty?" Both see yes (2 lifeguards). Both clock out separately, each thinking the other is still there. Neither lied. The sign-out sheet is correct per person. But the pool is now unguarded.',
    timeline: [
      { t: 'T1', a: 'SELECT COUNT(*) WHERE on_call=true → 2', b: 'SELECT COUNT(*) WHERE on_call=true → 2', note: 'Both check invariant' },
      { t: 'T2', a: 'UPDATE doctor_1 SET on_call=false', b: 'UPDATE doctor_2 SET on_call=false', note: '⚠️ Different rows — no collision' },
      { t: 'T3', a: 'COMMIT', b: 'COMMIT', note: '💥 0 doctors on-call. Invariant broken.' },
    ],
    prevention: 'SERIALIZABLE (SSI) — or materialize the invariant as a lockable row',
    keyInsight: 'Write skew is harder than lost update because there is no direct row collision for the database to detect. Each transaction writes a different row. The conflict exists at the invariant level, not the row level. Only SSI or explicit SELECT FOR UPDATE on a materialized row can catch it.',
  },
];

const LEVELS = [
  {
    name: 'READ UNCOMMITTED',
    short: 'RU',
    color: '#ef4444',
    dirty: true, nonRepeat: true, phantom: true, lostUpdate: true, writeSkew: true,
    desc: 'No isolation at all. Reads uncommitted changes from other transactions. Almost never used in practice.',
    useWhen: 'Approximate analytics where speed > accuracy (e.g., rough row count on a huge table). Never for financial data.',
    pgNote: 'PostgreSQL silently runs as READ COMMITTED. Dirty reads are impossible in PostgreSQL regardless of what you declare.',
  },
  {
    name: 'READ COMMITTED',
    short: 'RC',
    color: '#fbbf24',
    dirty: false, nonRepeat: true, phantom: true, lostUpdate: true, writeSkew: true,
    desc: 'Only reads committed data. Default in PostgreSQL, Oracle, SQL Server. Two reads in the same transaction can see different committed values.',
    useWhen: 'Default for most OLTP workloads. Fine for simple single-row operations where you don\'t re-read the same row. Handle lost updates at the query level.',
    pgNote: 'Per-statement snapshot: each SQL statement takes a fresh snapshot at execution time. Two SELECTs 3 seconds apart in the same transaction CAN see different data.',
  },
  {
    name: 'REPEATABLE READ',
    short: 'RR',
    color: '#f97316',
    dirty: false, nonRepeat: false, phantom: true, lostUpdate: true, writeSkew: true,
    desc: 'Standard: prevents dirty and non-repeatable reads. Phantoms theoretically possible. Lost update and write skew still possible per standard.',
    useWhen: 'When you read the same row multiple times in one transaction and need consistent values. PostgreSQL gives you extra protection beyond the standard at this level.',
    pgNote: 'Per-transaction snapshot: one snapshot at first statement, held until commit. ALSO prevents phantoms (snapshot blocks new rows). ALSO aborts on lost update (serialization_failure error). Write skew still possible.',
  },
  {
    name: 'SERIALIZABLE',
    short: 'SE',
    color: '#34d399',
    dirty: false, nonRepeat: false, phantom: false, lostUpdate: false, writeSkew: false,
    desc: 'Strongest. Transactions appear to execute one at a time (though they may run concurrently). No anomalies from the 1992 or 1995 lists.',
    useWhen: 'Write skew scenarios. Complex invariants across multiple rows/tables. Accept the cost: more aborts, retry loops required everywhere.',
    pgNote: 'Uses SSI (Serializable Snapshot Isolation): tracks read-write dependency edges. If a dependency cycle would produce non-serializable outcome, aborts one transaction. This is what catches write skew. Oracle\'s "SERIALIZABLE" is actually just Snapshot Isolation — still allows write skew.',
  },
];

const DB_IMPLS = [
  {
    db: 'PostgreSQL',
    default: 'READ COMMITTED',
    defaultColor: '#fbbf24',
    rows: [
      { level: 'READ UNCOMMITTED', actual: 'READ COMMITTED', scope: 'Per-statement snapshot', note: 'Dirty reads impossible. Silently upgraded.' },
      { level: 'READ COMMITTED', actual: 'READ COMMITTED', scope: 'Per-statement snapshot', note: 'Default. Each SQL gets fresh snapshot. Two SELECTs can differ.' },
      { level: 'REPEATABLE READ', actual: 'Snapshot Isolation (SI)', scope: 'Per-transaction snapshot', note: 'Also blocks phantoms + aborts on lost update. Write skew still possible.' },
      { level: 'SERIALIZABLE', actual: 'SSI (Serializable Snapshot Isolation)', scope: 'Per-transaction + dependency tracking', note: 'Catches write skew via read-write cycle detection. Abort rate rises under load.' },
    ],
  },
  {
    db: 'MySQL InnoDB',
    default: 'REPEATABLE READ',
    defaultColor: '#f97316',
    rows: [
      { level: 'READ UNCOMMITTED', actual: 'READ UNCOMMITTED', scope: 'No snapshot', note: 'Dirty reads possible.' },
      { level: 'READ COMMITTED', actual: 'READ COMMITTED', scope: 'Per-statement snapshot', note: 'Similar to PostgreSQL RC.' },
      { level: 'REPEATABLE READ', actual: 'MVCC + Gap Locks', scope: 'Per-transaction snapshot', note: 'Default. Uses gap locks to prevent phantoms in some cases. Different from PostgreSQL RR.' },
      { level: 'SERIALIZABLE', actual: 'SERIALIZABLE (locks)', scope: 'Lock-based', note: 'Converts all SELECTs to SELECT FOR SHARE. Heavy locking.' },
    ],
  },
  {
    db: 'Oracle',
    default: 'READ COMMITTED',
    defaultColor: '#fbbf24',
    rows: [
      { level: 'READ COMMITTED', actual: 'READ COMMITTED', scope: 'Per-statement snapshot', note: 'Default. MVCC-based.' },
      { level: 'SERIALIZABLE', actual: 'Snapshot Isolation (!)', scope: 'Per-transaction snapshot', note: '⚠️ Oracle\'s SERIALIZABLE is actually SI. Still allows write skew. Same label, weaker guarantee than PostgreSQL.' },
    ],
  },
  {
    db: 'SQL Server',
    default: 'READ COMMITTED',
    defaultColor: '#fbbf24',
    rows: [
      { level: 'READ COMMITTED', actual: 'Lock-based or SNAPSHOT', scope: 'Per-statement', note: 'Two modes: lock-based (default) or READ_COMMITTED_SNAPSHOT (MVCC). Must opt-in to MVCC.' },
      { level: 'SNAPSHOT', actual: 'Snapshot Isolation', scope: 'Per-transaction snapshot', note: 'Explicit SNAPSHOT level (not standard SQL). Prevents most anomalies except write skew.' },
      { level: 'SERIALIZABLE', actual: 'SERIALIZABLE (range locks)', scope: 'Lock-based range locks', note: 'True serializable via range locks. Heavy.' },
    ],
  },
];

const PRACTICAL_FIXES = [
  {
    anomaly: 'Lost Update',
    color: '#ef4444',
    options: [
      {
        name: 'Atomic UPDATE (best)',
        code: `UPDATE accounts
SET balance = balance - 70
WHERE id = ? AND balance >= 70;
-- Check affected rows: 0 = insufficient OR lost race → retry`,
        when: 'Always prefer this when logic fits in one statement. No extra lock, no retry loop.',
        not: 'Complex multi-step logic that can\'t be expressed in one UPDATE.',
      },
      {
        name: 'Optimistic Locking (@Version)',
        code: `-- Add version column
UPDATE accounts
SET balance = ?, version = version + 1
WHERE id = ? AND version = ?;
-- 0 rows = someone changed it first → retry

// JPA
@Version private Long version; // automatic`,
        when: 'Low-contention data. Reads vastly outnumber writes. Occasional retry is acceptable.',
        not: 'Flash-sale hot rows where every transaction competes. Retry storm under load.',
      },
      {
        name: 'Pessimistic Locking (SELECT FOR UPDATE)',
        code: `BEGIN;
SELECT balance FROM accounts
WHERE id = ? FOR UPDATE; -- locks row immediately
-- ... compute ...
UPDATE accounts SET balance = ? WHERE id = ?;
COMMIT;`,
        when: 'Hot rows with frequent contention. Inventory during flash sales. No retry wanted.',
        not: 'Low-contention data — adds lock overhead unnecessarily.',
      },
    ],
  },
  {
    anomaly: 'Write Skew',
    color: '#38bdf8',
    options: [
      {
        name: 'Materialize the invariant (preferred)',
        code: `BEGIN;
-- Lock the on-call slot row — makes invisible invariant visible
SELECT * FROM on_call_slots
WHERE shift_id = ? FOR UPDATE;

SELECT COUNT(*) FROM doctors
WHERE on_call = true AND shift_id = ?;
-- IF count > 1 THEN update, ELSE raise exception
COMMIT;`,
        when: 'The invariant can be represented as a concrete row. Forces concurrent transactions into a lock queue.',
        not: 'Invariants that span too many objects to materialize cleanly.',
      },
      {
        name: 'SERIALIZABLE isolation (last resort)',
        code: `BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
SELECT COUNT(*) FROM doctors
WHERE on_call = true AND shift_id = ?;
-- IF ok THEN
UPDATE doctors SET on_call = false WHERE id = ?;
COMMIT;
-- Must catch serialization_failure and retry!`,
        when: 'Complex invariants that can\'t be materialized. Accept: retry loops everywhere, higher abort rate under load.',
        not: 'High-throughput systems — SSI abort rate climbs fast under load.',
      },
    ],
  },
];

// ─── main ─────────────────────────────────────────────────────────────────────

export default function IsolationLevelDiagram({
  initialTab = 'matrix',
}: { initialTab?: TabType }): React.JSX.Element {
  const [tab, setTab] = useState<TabType>(initialTab);
  const [selectedAnomaly, setSelectedAnomaly] = useState(ANOMALIES[3]); // default: lost update
  const [selectedLevel, setSelectedLevel] = useState(LEVELS[1]); // default: read committed
  const [selectedDb, setSelectedDb] = useState(DB_IMPLS[0]); // default: PostgreSQL
  const [selectedFix, setSelectedFix] = useState(0); // 0 = lost update

  const TABS: { id: TabType; label: string }[] = [
    { id: 'anomalies',      label: '1. Anomaly Zoo' },
    { id: 'matrix',         label: '2. 4-Level Matrix' },
    { id: 'implementations', label: '3. DB Implementations' },
    { id: 'fixes',          label: '4. Practical Fixes' },
    { id: 'spec-vs-impl',   label: '5. Spec vs Reality' },
  ];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span>Isolation Levels — Spec, Implementation & Real Production Fixes</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '6px 13px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '12px',
              background: active ? 'rgba(167,139,250,0.14)' : 'rgba(255,255,255,0.04)',
              color: active ? '#a78bfa' : 'var(--ifm-color-content-secondary)',
              boxShadow: active ? '0 0 0 1.5px #a78bfa' : '0 0 0 1px rgba(255,255,255,0.08)',
              transition: 'all 0.15s ease',
            }}>{t.label}</button>
          );
        })}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .iso-grid { display: grid; gap: 14px; }
        @media (max-width: 768px) {
          .iso-2col { grid-template-columns: 1fr !important; }
          .iso-3col { grid-template-columns: 1fr !important; }
        }
      ` }} />

      {/* ── TAB 1: ANOMALY ZOO ───────────────────────────────────────────── */}
      {tab === 'anomalies' && (
        <div className="iso-grid">
          <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
            Three anomalies from ANSI SQL 1992 + two critical ones from the 1995 Critique paper. Click to explore each.
          </div>

          <div className="iso-2col" style={{ display: 'grid', gridTemplateColumns: '30% 70%', gap: '14px', alignItems: 'start' }}>
            {/* Anomaly list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {ANOMALIES.map(a => {
                const sel = selectedAnomaly.id === a.id;
                return (
                  <div key={a.id} onClick={() => setSelectedAnomaly(a)} style={{
                    padding: '8px 10px', borderRadius: '6px', cursor: 'pointer',
                    background: sel ? `${a.color}10` : 'rgba(255,255,255,0.02)',
                    border: sel ? `1px solid ${a.color}40` : '1px solid rgba(255,255,255,0.05)',
                    transition: 'all 0.15s ease',
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: sel ? 800 : 600, color: sel ? a.color : 'var(--ifm-color-content)' }}>{a.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>{a.origin}</div>
                  </div>
                );
              })}
            </div>

            {/* Anomaly detail */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ background: `${selectedAnomaly.color}08`, border: `1px solid ${selectedAnomaly.color}30`, borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: selectedAnomaly.color, marginBottom: '4px' }}>{selectedAnomaly.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '8px' }}>{selectedAnomaly.origin}</div>
                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.6' }}>{selectedAnomaly.story}</div>
              </div>

              {/* Analogy */}
              <div style={{ background: 'rgba(251,191,36,0.06)', borderLeft: '3px solid #fbbf24', padding: '8px 12px', borderRadius: '4px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '3px' }}>Analogy</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>{selectedAnomaly.analogy}</div>
              </div>

              {/* Timeline */}
              <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Transaction Timeline</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <th style={{ padding: '4px 8px', color: '#a78bfa', textAlign: 'left', width: '30px' }}>t</th>
                        <th style={{ padding: '4px 8px', color: '#38bdf8', textAlign: 'left' }}>Transaction A</th>
                        <th style={{ padding: '4px 8px', color: '#34d399', textAlign: 'left' }}>Transaction B</th>
                        <th style={{ padding: '4px 8px', color: '#fbbf24', textAlign: 'left' }}>Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAnomaly.timeline.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '4px 8px', color: '#a78bfa', fontWeight: 700 }}>{row.t}</td>
                          <td style={{ padding: '4px 8px', color: 'var(--ifm-color-content)', fontFamily: 'monospace' }}>{row.a}</td>
                          <td style={{ padding: '4px 8px', color: 'var(--ifm-color-content)', fontFamily: 'monospace' }}>{row.b}</td>
                          <td style={{ padding: '4px 8px', color: row.note.startsWith('💥') ? '#f87171' : row.note.startsWith('⚠️') ? '#fbbf24' : 'var(--ifm-color-content-secondary)' }}>{row.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ background: 'rgba(52,211,153,0.06)', borderLeft: '3px solid #34d399', padding: '8px 10px', borderRadius: '4px', flex: '1', minWidth: '200px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '3px' }}>Prevented By</div>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)' }}>{selectedAnomaly.prevention}</div>
                </div>
                <div style={{ background: 'rgba(167,139,250,0.06)', borderLeft: '3px solid #a78bfa', padding: '8px 10px', borderRadius: '4px', flex: '1', minWidth: '200px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', marginBottom: '3px' }}>Key Insight</div>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>{selectedAnomaly.keyInsight}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: 4-LEVEL MATRIX ─────────────────────────────────────────── */}
      {tab === 'matrix' && (
        <div className="iso-grid">
          {/* Matrix table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '8px 10px', color: '#a78bfa', textAlign: 'left' }}>Isolation Level</th>
                  <th style={{ padding: '8px 10px', color: '#f87171', textAlign: 'center' }}>Dirty Read</th>
                  <th style={{ padding: '8px 10px', color: '#fbbf24', textAlign: 'center' }}>Non-Repeatable</th>
                  <th style={{ padding: '8px 10px', color: '#c084fc', textAlign: 'center' }}>Phantom Read</th>
                  <th style={{ padding: '8px 10px', color: '#ef4444', textAlign: 'center' }}>Lost Update</th>
                  <th style={{ padding: '8px 10px', color: '#38bdf8', textAlign: 'center' }}>Write Skew</th>
                </tr>
              </thead>
              <tbody>
                {LEVELS.map((lvl, idx) => {
                  const sel = selectedLevel.name === lvl.name;
                  return (
                    <tr key={lvl.name} onClick={() => setSelectedLevel(lvl)} style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: sel ? `${lvl.color}08` : idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                      cursor: 'pointer',
                      outline: sel ? `1px solid ${lvl.color}30` : 'none',
                    }}>
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ fontWeight: 700, color: lvl.color }}>{lvl.name}</div>
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}><Check ok={lvl.dirty} /></td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}><Check ok={lvl.nonRepeat} /></td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}><Check ok={lvl.phantom} /></td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}><Check ok={lvl.lostUpdate} /></td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}><Check ok={lvl.writeSkew} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Detail panel for selected level */}
          <div style={{ background: `${selectedLevel.color}08`, border: `1px solid ${selectedLevel.color}30`, borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontWeight: 800, fontSize: '13px', color: selectedLevel.color }}>{selectedLevel.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.6' }}>{selectedLevel.desc}</div>
            <div className="iso-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ background: 'rgba(52,211,153,0.06)', borderLeft: '3px solid #34d399', padding: '8px 10px', borderRadius: '4px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>Use When</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>{selectedLevel.useWhen}</div>
              </div>
              <div style={{ background: 'rgba(167,139,250,0.06)', borderLeft: '3px solid #a78bfa', padding: '8px 10px', borderRadius: '4px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', marginBottom: '4px' }}>PostgreSQL Reality</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>{selectedLevel.pgNote}</div>
              </div>
            </div>
          </div>

          {/* Key framing */}
          <div style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: '8px', padding: '12px 14px', fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.7' }}>
            <strong style={{ color: '#f97316' }}>The table describes the spec, not the implementation.</strong> Every database is free to prevent <em>more</em> anomalies at a given level than the standard requires (PostgreSQL REPEATABLE READ prevents phantoms — the standard doesn't require it). And names can lie: Oracle's "SERIALIZABLE" is actually Snapshot Isolation and still allows write skew. Never trust the label — verify what your database actually does underneath.
          </div>
        </div>
      )}

      {/* ── TAB 3: DB IMPLEMENTATIONS ────────────────────────────────────── */}
      {tab === 'implementations' && (
        <div className="iso-grid">
          {/* DB selector */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {DB_IMPLS.map(db => {
              const sel = selectedDb.db === db.db;
              return (
                <button key={db.db} onClick={() => setSelectedDb(db)} style={{
                  padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: '12px',
                  background: sel ? 'rgba(167,139,250,0.14)' : 'rgba(255,255,255,0.04)',
                  color: sel ? '#a78bfa' : 'var(--ifm-color-content-secondary)',
                  boxShadow: sel ? '0 0 0 1.5px #a78bfa' : '0 0 0 1px rgba(255,255,255,0.08)',
                }}>{db.db}</button>
              );
            })}
          </div>

          {/* Default callout */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: `${selectedDb.defaultColor}08`, border: `1px solid ${selectedDb.defaultColor}30`, borderRadius: '6px', padding: '8px 12px' }}>
            <span style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Default isolation level:</span>
            <Badge color={selectedDb.defaultColor} text={selectedDb.default} />
            <span style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginLeft: '8px' }}>— this is what every transaction uses unless explicitly overridden</span>
          </div>

          {/* Implementation table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '8px 10px', color: '#a78bfa', textAlign: 'left' }}>Level Name</th>
                  <th style={{ padding: '8px 10px', color: '#a78bfa', textAlign: 'left' }}>Actual Mechanism</th>
                  <th style={{ padding: '8px 10px', color: '#a78bfa', textAlign: 'left' }}>Snapshot Scope</th>
                  <th style={{ padding: '8px 10px', color: '#a78bfa', textAlign: 'left' }}>Key Notes</th>
                </tr>
              </thead>
              <tbody>
                {selectedDb.rows.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '7px 10px', fontWeight: 700, color: 'var(--ifm-color-content)', whiteSpace: 'nowrap' }}>{row.level}</td>
                    <td style={{ padding: '7px 10px', color: '#38bdf8' }}>{row.actual}</td>
                    <td style={{ padding: '7px 10px', color: 'var(--ifm-color-content-secondary)' }}>{row.scope}</td>
                    <td style={{ padding: '7px 10px', color: row.note.startsWith('⚠️') ? '#fbbf24' : 'var(--ifm-color-content-secondary)' }}>{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Critical insight */}
          <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '8px', padding: '12px 14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#f87171', marginBottom: '8px' }}>The Oracle Trap — Same Label, Different Guarantee</div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.7' }}>
              Oracle calls its highest isolation level "SERIALIZABLE" — but underneath it runs Snapshot Isolation. That means write skew is still possible on Oracle even at SERIALIZABLE. A team that relied on the name without reading the docs would ship a broken on-call scheduling system believing they were protected.
              <br /><br />
              <strong>Rule:</strong> Never trust an isolation level by its name. Always read what the specific database version actually does at that level. The spec is a floor, not a ceiling. Implementations can differ widely — and in the case of Oracle, the highest level name doesn't even match the spec's guarantee.
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: PRACTICAL FIXES ───────────────────────────────────────── */}
      {tab === 'fixes' && (
        <div className="iso-grid">
          <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
            In practice, most teams keep the database default and handle anomalies at the query level. Raising isolation level adds lock contention and requires retry loops everywhere. The fixes below usually cost less.
          </div>

          {/* Anomaly picker */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {PRACTICAL_FIXES.map((f, idx) => (
              <button key={f.anomaly} onClick={() => setSelectedFix(idx)} style={{
                padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: '12px',
                background: selectedFix === idx ? `${f.color}15` : 'rgba(255,255,255,0.04)',
                color: selectedFix === idx ? f.color : 'var(--ifm-color-content-secondary)',
                boxShadow: selectedFix === idx ? `0 0 0 1.5px ${f.color}` : '0 0 0 1px rgba(255,255,255,0.08)',
              }}>Fix: {f.anomaly}</button>
            ))}
          </div>

          {/* Fix options */}
          {PRACTICAL_FIXES[selectedFix].options.map((opt, idx) => (
            <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontWeight: 800, fontSize: '13px', color: PRACTICAL_FIXES[selectedFix].color }}>{opt.name}</div>
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '6px', padding: '10px', fontFamily: 'monospace', fontSize: '11px', color: '#34d399', whiteSpace: 'pre', overflowX: 'auto' }}>
                {opt.code}
              </div>
              <div className="iso-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ background: 'rgba(52,211,153,0.06)', borderLeft: '3px solid #34d399', padding: '8px 10px', borderRadius: '4px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '3px' }}>Use When</div>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>{opt.when}</div>
                </div>
                <div style={{ background: 'rgba(248,113,113,0.06)', borderLeft: '3px solid #f87171', padding: '8px 10px', borderRadius: '4px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', marginBottom: '3px' }}>Not For</div>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>{opt.not}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 5: SPEC VS REALITY ───────────────────────────────────────── */}
      {tab === 'spec-vs-impl' && (
        <div className="iso-grid">

          {/* Two-layer framing */}
          <div className="iso-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '8px', padding: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', marginBottom: '8px' }}>Layer 1: The Spec (Isolation Level)</div>
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.7' }}>
                Isolation level is a <strong>behavioural contract</strong>: "at this level, these anomalies must not occur." It says <em>what</em> the database guarantees, not <em>how</em> it achieves it.
                <br /><br />
                The spec is the label on the dial.
              </div>
            </div>
            <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '8px', padding: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399', marginBottom: '8px' }}>Layer 2: The Implementation (MVCC + Locks)</div>
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.7' }}>
                Each database chooses its own mechanisms to fulfil (or partially fulfil) the spec. MVCC. 2PL. SSI. Gap locks. The same level name can map to completely different mechanisms — and therefore different anomaly protections — across databases.
                <br /><br />
                The implementation is what actually runs.
              </div>
            </div>
          </div>

          {/* MVCC quick explainer */}
          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24', marginBottom: '10px' }}>MVCC — How Databases Avoid Blocking</div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.7' }}>
              When you UPDATE a row, PostgreSQL (and most modern databases) don't overwrite the old value. They create a new version and keep the old one. Each transaction sees the version that existed when its snapshot was taken — not the latest one.
              <br /><br />
              Think of it as photocopying the morning newspaper before boarding a train. Outside, news keeps updating. But your copy stays consistent: you never read a mix of yesterday's and today's articles in the same paper.
              <br /><br />
              <strong>Result:</strong> Readers never block writers. Writers never block readers. The database achieves isolation without everyone waiting in a single lock queue.
            </div>
            <div style={{ marginTop: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', padding: '10px', fontFamily: 'monospace', fontSize: '11px', color: '#a78bfa' }}>
              {`-- PostgreSQL hidden columns on every row:\n`}
              {`xmin: txn ID that CREATED this version\n`}
              {`xmax: txn ID that DELETED/REPLACED this version (0 = still live)\n\n`}
              {`-- Transaction T100 reads: only sees rows where xmin <= 100 and xmax = 0\n`}
              {`-- Transaction T102 writes: creates new row version (xmin=102)\n`}
              {`-- T100 still sees the old version — no lock needed`}
            </div>
          </div>

          {/* Snapshot scope comparison */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#a78bfa', marginBottom: '10px' }}>Snapshot Scope: The Critical Difference Between READ COMMITTED and REPEATABLE READ</div>
            <div className="iso-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24', marginBottom: '8px' }}>READ COMMITTED — Per-Statement Snapshot</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.6', marginBottom: '8px' }}>
                  Each SQL statement takes a fresh snapshot at execution time. Two SELECT statements 3 seconds apart in the same transaction CAN see different committed data.
                </div>
                <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '4px', padding: '8px', fontFamily: 'monospace', fontSize: '10px', color: '#fbbf24' }}>
                  {`BEGIN;\n`}
                  {`-- 10:00:01 → snapshot S1\n`}
                  {`SELECT balance; -- sees $500\n\n`}
                  {`-- (another txn commits: $300)\n\n`}
                  {`-- 10:00:04 → snapshot S2 (new!)\n`}
                  {`SELECT balance; -- sees $300 ← DIFFERENT\n`}
                  {`COMMIT;`}
                </div>
              </div>
              <div style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#f97316', marginBottom: '8px' }}>REPEATABLE READ — Per-Transaction Snapshot</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.6', marginBottom: '8px' }}>
                  One snapshot at the first statement, held until COMMIT. Every read in this transaction sees the same frozen world — regardless of what other transactions commit.
                </div>
                <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '4px', padding: '8px', fontFamily: 'monospace', fontSize: '10px', color: '#f97316' }}>
                  {`BEGIN;\n`}
                  {`-- 10:00:01 → snapshot S1\n`}
                  {`SELECT balance; -- sees $500\n\n`}
                  {`-- (another txn commits: $300)\n\n`}
                  {`-- still snapshot S1\n`}
                  {`SELECT balance; -- sees $500 ← SAME\n`}
                  {`COMMIT;`}
                </div>
              </div>
            </div>
          </div>

          {/* The contract / final principle */}
          <div style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#a78bfa', marginBottom: '8px' }}>The Contract Framing</div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: '1.7' }}>
              Isolation level is a contract between you and the database: <strong>"the database will hide these anomalies for you; you must handle the rest."</strong>
              <br /><br />
              Every time you lower the isolation level, you take more responsibility onto your application. The database does not warn you — it silently gives you the result, correct or not, exactly as contracted. The only symptom of a violated invariant is an off-by-one balance at 2am during peak traffic.
              <br /><br />
              The question worth asking before picking an isolation level: <em>"What invariant must always hold in this operation — and what data do I read to make the decision but never write?"</em> The data you read-but-not-write is your write skew risk surface. Identify it first, then pick your tool.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
