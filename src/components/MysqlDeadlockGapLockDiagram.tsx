import React, { useState } from 'react';

export type DeadlockTab = 'access_paths' | 'gap_locks' | 'cart_deadlock' | 'read_committed';

interface MysqlDeadlockGapLockDiagramProps {
  initialTab?: DeadlockTab;
}

export default function MysqlDeadlockGapLockDiagram({
  initialTab = 'access_paths',
}: MysqlDeadlockGapLockDiagramProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<DeadlockTab>(initialTab);

  // Tab 1 state: Access paths
  const [accessPath, setAccessPath] = useState<'pk' | 'secondary' | 'table_scan'>('secondary');

  // Tab 3 state: Deadlock step simulator
  const [simStep, setSimStep] = useState<number>(0);

  const deadlockSteps = [
    {
      title: 'T0: Initial State',
      description: 'Table `carts` has items with IDs [5, 15, 25]. User A wants cart 10 (does not exist yet), User B wants cart 20 (does not exist yet).',
      txA: 'Idle',
      txB: 'Idle',
      lockState: 'No active locks.',
      isDeadlock: false,
    },
    {
      title: 'T1: User A issues SELECT ... FOR UPDATE on non-existent ID 10',
      description: 'InnoDB finds no record with ID=10. Under REPEATABLE READ, it must lock the GAP between 5 and 15 to prevent phantoms.',
      txA: 'Acquires Gap Lock on (5, 15)',
      txB: 'Idle',
      lockState: 'Tx A holds Gap Lock on (5, 15). Gap locks are non-exclusive with other gap locks.',
      isDeadlock: false,
    },
    {
      title: 'T2: User B issues SELECT ... FOR UPDATE on non-existent ID 12',
      description: 'User B also targets the same gap (5, 15). Because Gap Locks do NOT block other Gap Locks, Tx B succeeds!',
      txA: 'Holds Gap Lock on (5, 15)',
      txB: 'Acquires Gap Lock on (5, 15)',
      lockState: 'Both Tx A and Tx B hold overlapping Gap Locks on (5, 15). This sets the trap.',
      isDeadlock: false,
    },
    {
      title: 'T3: User A attempts INSERT into gap (ID=10)',
      description: 'Tx A wants an Insert Intention Lock on ID=10. But Tx B holds a Gap Lock on (5, 15). Tx A is forced to WAIT for Tx B.',
      txA: 'Blocked! Waiting for Tx B gap lock',
      txB: 'Holds Gap Lock on (5, 15)',
      lockState: 'Tx A is blocked in lock wait queue.',
      isDeadlock: false,
    },
    {
      title: 'T4: User B attempts INSERT into gap (ID=12) → DEADLOCK!',
      description: 'Tx B wants an Insert Intention Lock on ID=12. But Tx A holds a Gap Lock on (5, 15). Tx B waits for Tx A, while Tx A waits for Tx B! Circular dependency detected in wait-for graph.',
      txA: 'Blocked waiting for Tx B',
      txB: 'Blocked waiting for Tx A',
      lockState: 'DEADLOCK! InnoDB cycle detector fires. Rollback of Tx with fewest undo records (usually Tx B).',
      isDeadlock: true,
    },
  ];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .deadlock-grid-responsive {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          MySQL InnoDB Locking Mechanics: Gap Locks, Access Paths & Deadlock Cycles
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'access_paths', label: '🛤️ 3 WHERE Access Paths', color: '#38bdf8' },
            { id: 'gap_locks', label: '🛡️ Gap & Next-Key Locks', color: '#fbbf24' },
            { id: 'cart_deadlock', label: '💥 2-Cart Deadlock Simulator', color: '#f87171' },
            { id: 'read_committed', label: '⚠️ Why READ COMMITTED Fails', color: '#a78bfa' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as DeadlockTab)}
              style={{
                flex: 1,
                minWidth: '150px',
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

        {/* Tab 1: 3 Access Paths for WHERE */}
        {activeTab === 'access_paths' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {[
                { id: 'pk', label: '1. Clustered PK Seek (Safe)', color: '#34d399' },
                { id: 'secondary', label: '2. Secondary Index Lookup (2 Locks)', color: '#fbbf24' },
                { id: 'table_scan', label: '3. Table Scan / Missing Index (Disaster)', color: '#f87171' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setAccessPath(p.id as typeof accessPath)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: accessPath === p.id ? `${p.color}25` : 'rgba(255,255,255,0.05)',
                    color: accessPath === p.id ? p.color : 'var(--ifm-color-content-secondary)',
                    border: `1px solid ${accessPath === p.id ? p.color : 'rgba(255,255,255,0.1)'}`,
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div
              className="deadlock-grid-responsive"
              style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}
            >
              <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '8px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginBottom: '10px' }}>
                  Execution Path: UPDATE carts SET status = &apos;DRAFT&apos; WHERE ...
                </div>

                <svg viewBox="0 0 520 220" style={{ width: '100%', height: 'auto' }}>
                  <defs>
                    <marker id="arrow-path" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                    </marker>
                    <marker id="arrow-danger" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#f87171" />
                    </marker>
                  </defs>

                  {/* SQL Statement Node */}
                  <rect x="20" y="20" width="480" height="40" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="260" y="45" fill="#f8fafc" fontSize="12" fontWeight="700" textAnchor="middle">
                    {accessPath === 'pk' && "WHERE id = 42 (Primary Key)"}
                    {accessPath === 'secondary' && "WHERE user_id = 99 (Non-unique Secondary Index)"}
                    {accessPath === 'table_scan' && "WHERE cart_token = 'xyz' (NO INDEX - Full Scan)"}
                  </text>

                  {accessPath === 'pk' && (
                    <>
                      <path d="M 260 60 L 260 110" stroke="#34d399" strokeWidth="2" strokeDasharray="4,4" className="interactive-diagram-flowing-path" markerEnd="url(#arrow-path)" />
                      <rect x="130" y="120" width="260" height="65" rx="8" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" strokeWidth="2" />
                      <text x="260" y="145" fill="#34d399" fontSize="13" fontWeight="800" textAnchor="middle">Clustered Index Root</text>
                      <text x="260" y="165" fill="#e2e8f0" fontSize="11" textAnchor="middle">Direct Point Seek ➔ 1 Record Lock (X) on id=42</text>
                      <text x="260" y="178" fill="#94a3b8" fontSize="10" textAnchor="middle">Zero Gap Locks acquired. Concurrency is maximum.</text>
                    </>
                  )}

                  {accessPath === 'secondary' && (
                    <>
                      <path d="M 200 60 L 140 100" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#arrow-path)" />
                      <path d="M 320 60 L 380 100" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#arrow-path)" />

                      <rect x="40" y="110" width="200" height="80" rx="8" fill="rgba(251, 191, 36, 0.12)" stroke="#fbbf24" strokeWidth="1.5" />
                      <text x="140" y="135" fill="#fbbf24" fontSize="12" fontWeight="700" textAnchor="middle">Step 1: idx_user_id</text>
                      <text x="140" y="155" fill="#e2e8f0" fontSize="10" textAnchor="middle">Locks Secondary Index Record</text>
                      <text x="140" y="170" fill="#fef08a" fontSize="10" textAnchor="middle">+ Gap Lock around user_id=99</text>

                      <rect x="280" y="110" width="200" height="80" rx="8" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" strokeWidth="1.5" />
                      <text x="380" y="135" fill="#38bdf8" fontSize="12" fontWeight="700" textAnchor="middle">Step 2: Clustered Index</text>
                      <text x="380" y="155" fill="#e2e8f0" fontSize="10" textAnchor="middle">Looks up PK (id=42)</text>
                      <text x="380" y="170" fill="#bae6fd" fontSize="10" textAnchor="middle">Locks PK Record (X lock)</text>
                    </>
                  )}

                  {accessPath === 'table_scan' && (
                    <>
                      <path d="M 260 60 L 260 105" stroke="#f87171" strokeWidth="2" markerEnd="url(#arrow-danger)" />
                      <rect x="50" y="115" width="420" height="85" rx="8" fill="rgba(248, 113, 113, 0.15)" stroke="#f87171" strokeWidth="2" />
                      <text x="260" y="140" fill="#f87171" fontSize="13" fontWeight="800" textAnchor="middle">FULL TABLE SCAN DISASTER</text>
                      <text x="260" y="160" fill="#fca5a5" fontSize="11" textAnchor="middle">InnoDB iterates through EVERY page & record in clustered index!</text>
                      <text x="260" y="175" fill="#ffffff" fontSize="10" textAnchor="middle">Locks EVERY record + EVERY gap in table until query finishes!</text>
                      <text x="260" y="190" fill="#fca5a5" fontSize="10" textAnchor="middle">Guaranteed to deadlock ANY concurrent write to this table.</text>
                    </>
                  )}
                </svg>
              </div>

              {/* Path Explanation Card */}
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h4 style={{ margin: '0 0 8px 0', color: accessPath === 'pk' ? '#34d399' : accessPath === 'secondary' ? '#fbbf24' : '#f87171' }}>
                  {accessPath === 'pk' && "Clustered Primary Key Access"}
                  {accessPath === 'secondary' && "Non-Unique Secondary Index Access"}
                  {accessPath === 'table_scan' && "Unindexed Column (Table Scan)"}
                </h4>
                <div style={{ fontSize: '12px', lineHeight: '1.6', color: 'var(--ifm-color-content-secondary)' }}>
                  {accessPath === 'pk' && (
                    <>
                      <p>When searching by Primary Key or Unique Index with an exact match (<code>=</code>), InnoDB knows at most <strong>one record can ever exist</strong>.</p>
                      <p><strong>Lock Behavior:</strong> It downgrades the Next-Key lock to a <strong>single Record Lock</strong>. No gap locks are created, meaning concurrent inserts adjacent to this key are completely unblocked.</p>
                    </>
                  )}
                  {accessPath === 'secondary' && (
                    <>
                      <p>Because the secondary index is <strong>non-unique</strong>, multiple rows could have <code>user_id = 99</code>. To prevent another transaction from inserting a new row with <code>user_id = 99</code> (phantom row), InnoDB must:</p>
                      <ul>
                        <li>Lock the matched secondary index record(s).</li>
                        <li>Lock the <strong>gaps</strong> before and after the matched record in the secondary index.</li>
                        <li>Follow the pointer to the clustered index and lock the corresponding PK row(s).</li>
                      </ul>
                      <p style={{ color: '#fbbf24', fontWeight: 600 }}>Lock sequence asymmetry: If Tx1 locks secondary then PK, while Tx2 accesses in reverse order, an immediate deadlock occurs!</p>
                    </>
                  )}
                  {accessPath === 'table_scan' && (
                    <>
                      <p>Without an index, MySQL cannot seek. The storage engine reads every row in the table sequentially and sends it to the MySQL server layer to evaluate the <code>WHERE</code> clause.</p>
                      <p><strong>The Trap:</strong> In <code>REPEATABLE READ</code>, InnoDB places an <strong>Exclusive Next-Key Lock on every single row and gap in the entire table</strong> as it scans. Even if only 1 row matches your criteria, the whole table is locked down until transaction commit!</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Gap Locks & Next-Key Locks */}
        {activeTab === 'gap_locks' && (
          <div>
            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '8px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fbbf24', marginBottom: '8px' }}>
                InnoDB Gap & Next-Key Lock Number Line (Index Records: 10, 20, 30)
              </div>
              <svg viewBox="0 0 600 130" style={{ width: '100%', height: 'auto' }}>
                {/* Horizontal Axis */}
                <line x1="30" y1="60" x2="570" y2="60" stroke="#64748b" strokeWidth="3" />

                {/* Nodes on Axis */}
                {/* Node 10 */}
                <circle cx="150" cy="60" r="10" fill="#38bdf8" stroke="#0f172a" strokeWidth="2" />
                <text x="150" y="85" fill="#38bdf8" fontSize="12" fontWeight="800" textAnchor="middle">10</text>
                {/* Node 20 */}
                <circle cx="300" cy="60" r="10" fill="#38bdf8" stroke="#0f172a" strokeWidth="2" />
                <text x="300" y="85" fill="#38bdf8" fontSize="12" fontWeight="800" textAnchor="middle">20</text>
                {/* Node 30 */}
                <circle cx="450" cy="60" r="10" fill="#38bdf8" stroke="#0f172a" strokeWidth="2" />
                <text x="450" y="85" fill="#38bdf8" fontSize="12" fontWeight="800" textAnchor="middle">30</text>

                {/* Intervals */}
                {/* Gap 1 */}
                <rect x="40" y="25" width="100" height="20" rx="4" fill="rgba(251, 191, 36, 0.15)" stroke="#fbbf24" strokeWidth="1" strokeDasharray="3,3" />
                <text x="90" y="39" fill="#fbbf24" fontSize="10" textAnchor="middle">Gap: (-∞, 10)</text>

                {/* Gap 2 */}
                <rect x="160" y="25" width="130" height="20" rx="4" fill="rgba(251, 191, 36, 0.15)" stroke="#fbbf24" strokeWidth="1" strokeDasharray="3,3" />
                <text x="225" y="39" fill="#fbbf24" fontSize="10" textAnchor="middle">Gap: (10, 20)</text>

                {/* Gap 3 */}
                <rect x="310" y="25" width="130" height="20" rx="4" fill="rgba(251, 191, 36, 0.15)" stroke="#fbbf24" strokeWidth="1" strokeDasharray="3,3" />
                <text x="375" y="39" fill="#fbbf24" fontSize="10" textAnchor="middle">Gap: (20, 30)</text>

                {/* Gap 4 */}
                <rect x="460" y="25" width="100" height="20" rx="4" fill="rgba(251, 191, 36, 0.15)" stroke="#fbbf24" strokeWidth="1" strokeDasharray="3,3" />
                <text x="510" y="39" fill="#fbbf24" fontSize="10" textAnchor="middle">Gap: (30, +∞)</text>

                {/* Next Key Lock label */}
                <path d="M 160 105 L 300 105" stroke="#34d399" strokeWidth="2" />
                <circle cx="300" cy="105" r="4" fill="#34d399" />
                <text x="230" y="120" fill="#34d399" fontSize="10" fontWeight="700" textAnchor="middle">Next-Key Lock: (10, 20] (Gap + Record 20)</text>
              </svg>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>Record Lock</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.5' }}>
                  Locks the exact physical index entry on a B+Tree leaf page. Prevents other transactions from modifying or deleting that specific row.
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>Gap Lock</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.5' }}>
                  Locks the phantom space between index records (or before first / after supremum). <strong>Gap locks are purely inhibitory to INSERTs</strong>; multiple transactions can hold overlapping gap locks simultaneously!
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: '#34d399', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>Next-Key Lock</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.5' }}>
                  A combination of a <strong>Record Lock</strong> on the index record and a <strong>Gap Lock</strong> on the preceding space: <code>(previous, current]</code>. Default locking in REPEATABLE READ.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Cart Deadlock Simulator */}
        {activeTab === 'cart_deadlock' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: deadlockSteps[simStep].isDeadlock ? '#f87171' : '#38bdf8' }}>
                Step {simStep} / 4: {deadlockSteps[simStep].title}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  disabled={simStep === 0}
                  onClick={() => setSimStep((s) => Math.max(0, s - 1))}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '4px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.05)',
                    color: simStep === 0 ? '#64748b' : '#f8fafc',
                    cursor: simStep === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '11px',
                  }}
                >
                  ◀ Previous
                </button>
                <button
                  disabled={simStep === 4}
                  onClick={() => setSimStep((s) => Math.min(4, s + 1))}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '4px',
                    border: 'none',
                    background: simStep === 4 ? 'rgba(255,255,255,0.05)' : '#38bdf8',
                    color: simStep === 4 ? '#64748b' : '#0f172a',
                    fontWeight: 700,
                    cursor: simStep === 4 ? 'not-allowed' : 'pointer',
                    fontSize: '11px',
                  }}
                >
                  Next Step ▶
                </button>
              </div>
            </div>

            <div
              className="deadlock-grid-responsive"
              style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', marginBottom: '16px' }}
            >
              {/* User A Transaction Box */}
              <div
                style={{
                  background: 'rgba(56, 189, 248, 0.08)',
                  borderRadius: '8px',
                  padding: '14px',
                  border: `1.5px solid ${simStep >= 1 ? '#38bdf8' : 'rgba(56, 189, 248, 0.2)'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 800, color: '#38bdf8', fontSize: '13px' }}>Transaction A (User A Cart)</span>
                  <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                    Connection 1
                  </span>
                </div>
                <pre style={{ margin: 0, padding: '8px', background: '#0f172a', borderRadius: '4px', fontSize: '11px', color: '#e2e8f0' }}>
{simStep >= 1 ? `BEGIN;\nSELECT * FROM carts WHERE id = 10 FOR UPDATE;` : `// Waiting to execute...`}
{simStep >= 3 ? `\nINSERT INTO carts (id, user_id) VALUES (10, 101);` : ``}
                </pre>
                <div style={{ marginTop: '8px', fontSize: '11px', color: simStep >= 3 ? '#f87171' : '#bae6fd', fontWeight: 600 }}>
                  State: {deadlockSteps[simStep].txA}
                </div>
              </div>

              {/* User B Transaction Box */}
              <div
                style={{
                  background: 'rgba(251, 191, 36, 0.08)',
                  borderRadius: '8px',
                  padding: '14px',
                  border: `1.5px solid ${simStep >= 2 ? '#fbbf24' : 'rgba(251, 191, 36, 0.2)'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 800, color: '#fbbf24', fontSize: '13px' }}>Transaction B (User B Cart)</span>
                  <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' }}>
                    Connection 2
                  </span>
                </div>
                <pre style={{ margin: 0, padding: '8px', background: '#0f172a', borderRadius: '4px', fontSize: '11px', color: '#e2e8f0' }}>
{simStep >= 2 ? `BEGIN;\nSELECT * FROM carts WHERE id = 12 FOR UPDATE;` : `// Waiting to execute...`}
{simStep >= 4 ? `\nINSERT INTO carts (id, user_id) VALUES (12, 102);` : ``}
                </pre>
                <div style={{ marginTop: '8px', fontSize: '11px', color: simStep >= 4 ? '#f87171' : '#fef08a', fontWeight: 600 }}>
                  State: {deadlockSteps[simStep].txB}
                </div>
              </div>
            </div>

            {/* Explanation & Wait-for Graph */}
            <div
              style={{
                background: deadlockSteps[simStep].isDeadlock ? 'rgba(248, 113, 113, 0.15)' : 'rgba(0,0,0,0.2)',
                borderRadius: '8px',
                padding: '14px',
                border: `1px solid ${deadlockSteps[simStep].isDeadlock ? '#f87171' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: deadlockSteps[simStep].isDeadlock ? '#f87171' : '#38bdf8', marginBottom: '4px' }}>
                Engine Observation: {deadlockSteps[simStep].lockState}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.5' }}>
                {deadlockSteps[simStep].description}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Why READ COMMITTED Fails */}
        {activeTab === 'read_committed' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: '#f87171', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                  1. Foreign Key Constraint Checks (S-Locks)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                  Even in <code>READ COMMITTED</code>, when you insert into a child table with a Foreign Key, InnoDB acquires an <strong>S (Shared) Lock</strong> on the referenced row in the parent table.
                  <br /><br />
                  If two transactions concurrently insert child rows referencing different parent rows in interleaved order, or if one deletes while another inserts, the S-lock escalates into a deadlock cycle.
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                  2. Unique Key Duplicate Checks (S Next-Key)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                  During <code>INSERT</code> or <code>INSERT ... ON DUPLICATE KEY UPDATE</code>, if a duplicate unique key is encountered, InnoDB <strong>must acquire an S Next-Key lock</strong> on the duplicate index entry to verify its visibility, regardless of isolation level!
                  <br /><br />
                  When multiple transactions hit the same duplicate key, all hold S-locks. When one tries to upgrade to X-lock upon commit/rollback, all deadlock against each other.
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                  3. Semi-Consistent Read Limitations
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                  In <code>READ COMMITTED</code>, InnoDB uses <em>semi-consistent read</em>: when a row does not match the <code>WHERE</code> clause during an UPDATE, InnoDB releases the record lock early.
                  <br /><br />
                  <strong>The Trap:</strong> It only releases locks on rows that DO NOT match. On all rows that match, locks are held until <code>COMMIT</code>. If two queries update overlapping sets of rows in different physical order, deadlocks still strike.
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: '#34d399', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                  4. The Guaranteed Fix
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                  <strong>Strict Deterministic Lock Ordering:</strong> Always sort IDs before performing batch updates or inserts (e.g. <code>ORDER BY id ASC</code> in application memory).
                  <br /><br />
                  <strong>Avoid Non-Existent Key Locks:</strong> Instead of <code>SELECT ... FOR UPDATE</code> on an ID that might not exist, use atomic <code>INSERT IGNORE</code> or upserts with explicit row-level targeting.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
