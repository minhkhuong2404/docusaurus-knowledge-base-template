import React, { useState } from 'react';

type ArchTab = 'dual-write-seam' | 'mysql-skip-locked' | 'lifecycle-flow' | 'tradeoff-matrix';

export default function InventoryReservationDiagram({ initialTab = 'mysql-skip-locked' }: { initialTab?: ArchTab }) {
  const [activeTab, setActiveTab] = useState<ArchTab>(initialTab);
  const [lockedUnits, setLockedUnits] = useState<number[]>([1, 2]);
  const [activeCheckoutThread, setActiveCheckoutThread] = useState<number>(3);

  return (
    <div className="interactive-diagram-container">
      <style>{`
        @media (max-width: 768px) {
          .inventory-grid-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <div>
            <h4 style={{ margin: 0, color: '#34d399', fontSize: '15px', fontWeight: 700 }}>
              Inventory Reservation Architecture: Redis vs MySQL SKIP LOCKED
            </h4>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
              Shopify Scale Case Study: Eliminating the Dual-Write Inconsistency Seam
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <span style={{ fontSize: '11px', fontFamily: 'monospace', padding: '3px 8px', borderRadius: '12px', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
          $5.1M GMV / Minute
        </span>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '0 4px' }}>
        <button
          onClick={() => setActiveTab('mysql-skip-locked')}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            border: '1px solid',
            borderColor: activeTab === 'mysql-skip-locked' ? '#34d399' : 'var(--ifm-color-emphasis-300)',
            background: activeTab === 'mysql-skip-locked' ? 'rgba(52, 211, 153, 0.15)' : 'var(--ifm-background-surface-color)',
            color: activeTab === 'mysql-skip-locked' ? '#34d399' : 'var(--ifm-color-content-secondary)'
          }}
        >
          MySQL 8 SKIP LOCKED Architecture
        </button>
        <button
          onClick={() => setActiveTab('dual-write-seam')}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            border: '1px solid',
            borderColor: activeTab === 'dual-write-seam' ? '#f87171' : 'var(--ifm-color-emphasis-300)',
            background: activeTab === 'dual-write-seam' ? 'rgba(248, 113, 113, 0.15)' : 'var(--ifm-background-surface-color)',
            color: activeTab === 'dual-write-seam' ? '#f87171' : 'var(--ifm-color-content-secondary)'
          }}
        >
          The Redis Dual-Write Seam Problem
        </button>
        <button
          onClick={() => setActiveTab('lifecycle-flow')}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            border: '1px solid',
            borderColor: activeTab === 'lifecycle-flow' ? '#38bdf8' : 'var(--ifm-color-emphasis-300)',
            background: activeTab === 'lifecycle-flow' ? 'rgba(56, 189, 248, 0.15)' : 'var(--ifm-background-surface-color)',
            color: activeTab === 'lifecycle-flow' ? '#38bdf8' : 'var(--ifm-color-content-secondary)'
          }}
        >
          Reservation Lifecycle (Hold ➔ Commit)
        </button>
        <button
          onClick={() => setActiveTab('tradeoff-matrix')}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            border: '1px solid',
            borderColor: activeTab === 'tradeoff-matrix' ? '#fbbf24' : 'var(--ifm-color-emphasis-300)',
            background: activeTab === 'tradeoff-matrix' ? 'rgba(251, 191, 36, 0.15)' : 'var(--ifm-background-surface-color)',
            color: activeTab === 'tradeoff-matrix' ? '#fbbf24' : 'var(--ifm-color-content-secondary)'
          }}
        >
          Pattern Comparison Matrix
        </button>
      </div>

      {/* Main Tab Content */}
      <div style={{ padding: '4px' }}>
        {/* TAB 1: MYSQL SKIP LOCKED */}
        {activeTab === 'mysql-skip-locked' && (
          <div className="inventory-grid-layout" style={{ display: 'grid', gridTemplateColumns: '52% 48%', gap: '16px', alignItems: 'start' }}>
            {/* SVG Visualizer */}
            <div className="interactive-diagram-svg-wrapper" style={{ padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#34d399', marginBottom: '8px' }}>
                Parallel Row Claims: Zero Lock Waiting
              </div>

              <svg viewBox="0 0 440 230" className="interactive-diagram-svg">
                <defs>
                  <marker id="inv-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="#34d399" />
                  </marker>
                  <marker id="inv-arrow-blue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="#38bdf8" />
                  </marker>
                </defs>

                {/* Checkout Workers */}
                <rect x="10" y="30" width="100" height="34" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="60" y="52" fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold">Thread 1 (Cart A)</text>

                <rect x="10" y="85" width="100" height="34" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="60" y="107" fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold">Thread 2 (Cart B)</text>

                <rect x="10" y="140" width="100" height="34" rx="6" fill="#1e293b" stroke="#34d399" strokeWidth="2" />
                <text x="60" y="162" fill="#34d399" fontSize="10" textAnchor="middle" fontWeight="bold">Thread 3 (Cart C)</text>

                {/* MySQL Database Box */}
                <rect x="180" y="15" width="250" height="195" rx="8" fill="#0d141e" stroke="#34d399" strokeWidth="1.5" />
                <text x="305" y="35" fill="#34d399" fontSize="11" textAnchor="middle" fontWeight="bold">
                  MySQL 8: inventory_units (Item #101)
                </text>

                {/* Unit Row 1 */}
                <rect x="195" y="45" width="220" height="32" rx="4" fill="#2d1619" stroke="#f87171" strokeWidth="1.5" />
                <text x="205" y="65" fill="#f87171" fontSize="9" fontWeight="bold">Unit #1: [LOCKED by Thread 1]</text>

                {/* Unit Row 2 */}
                <rect x="195" y="85" width="220" height="32" rx="4" fill="#2d1619" stroke="#f87171" strokeWidth="1.5" />
                <text x="205" y="105" fill="#f87171" fontSize="9" fontWeight="bold">Unit #2: [LOCKED by Thread 2]</text>

                {/* Unit Row 3 (Claimed by Thread 3) */}
                <rect x="195" y="125" width="220" height="32" rx="4" fill="#13232a" stroke="#34d399" strokeWidth="2" />
                <text x="205" y="145" fill="#34d399" fontSize="9" fontWeight="bold">Unit #3: [CLAIMED by Thread 3]</text>

                {/* Unit Row 4 (Available) */}
                <rect x="195" y="165" width="220" height="32" rx="4" fill="#1e293b" stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" />
                <text x="205" y="185" fill="#94a3b8" fontSize="9">Unit #4: [available]</text>

                {/* Direct Arrows */}
                <path d="M114 47 L190 57" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#inv-arrow-blue)" />
                <path d="M114 102 L190 98" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#inv-arrow-blue)" />

                {/* SKIP LOCKED path: Thread 3 skips 1 & 2 */}
                <path d="M114 157 C 150 157, 150 141, 190 141" stroke="#34d399" strokeWidth="2.5" markerEnd="url(#inv-arrow)" />
              </svg>

              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '8px', lineHeight: 1.4 }}>
                <strong>How SKIP LOCKED operates:</strong> Thread 3 requests 1 unit. Instead of waiting for Thread 1 or 2 to commit their locks, MySQL skips locked rows 1 &amp; 2 immediately and locks Unit 3 with zero latency!
              </div>
            </div>

            {/* Explanation & Code */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
                  The 3 Pillars of Shopify&apos;s MySQL Architecture
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                  <li><strong>Unit-Level Modeling:</strong> Inventory modeled as individual unit rows or discrete tokens rather than a single bottleneck counter.</li>
                  <li><strong>FOR UPDATE SKIP LOCKED:</strong> Concurrent checkouts skip already-locked units, eliminating row lock queuing and deadlocks.</li>
                  <li><strong>Single-Seam ACID:</strong> Reservation, payment authorization, and inventory ledger occur in the same database transaction.</li>
                </ul>
              </div>

              {/* SQL Implementation Snippet */}
              <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-200)', fontFamily: 'monospace', fontSize: '11px' }}>
                <div style={{ color: '#38bdf8', marginBottom: '6px', fontWeight: 700 }}>-- Atomic Claim Transaction</div>
                <div style={{ color: 'var(--ifm-color-content)' }}>START TRANSACTION;</div>
                <div style={{ color: '#34d399', marginTop: '2px' }}>
                  SELECT id FROM inventory_units<br />
                  WHERE item_id = 101 AND status = &apos;available&apos;<br />
                  LIMIT 1 FOR UPDATE SKIP LOCKED;
                </div>
                <div style={{ color: '#fbbf24', marginTop: '4px' }}>
                  UPDATE inventory_units<br />
                  SET status = &apos;reserved&apos;, expires_at = NOW() + INTERVAL 10 MINUTE<br />
                  WHERE id = :claimed_id;
                </div>
                <div style={{ color: 'var(--ifm-color-content)', marginTop: '2px' }}>COMMIT;</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: THE DUAL-WRITE SEAM */}
        {activeTab === 'dual-write-seam' && (
          <div className="inventory-grid-layout" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', alignItems: 'start' }}>
            {/* SVG Visualizing Dual Write Seam */}
            <div className="interactive-diagram-svg-wrapper" style={{ padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#f87171', marginBottom: '8px' }}>
                The Dual-Write Seam: Why Redis + MySQL Fails
              </div>

              <svg viewBox="0 0 420 220" className="interactive-diagram-svg">
                {/* Checkout App */}
                <rect x="20" y="80" width="90" height="50" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="65" y="102" fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold">Checkout Pod</text>
                <text x="65" y="118" fill="var(--ifm-color-content-secondary)" fontSize="8" textAnchor="middle">2 Systems to Sync</text>

                {/* Path to Redis */}
                <path d="M114 90 L200 55" stroke="#34d399" strokeWidth="2" markerEnd="url(#inv-arrow)" />
                <rect x="205" y="30" width="190" height="50" rx="6" fill="#13232a" stroke="#34d399" strokeWidth="1.5" />
                <text x="300" y="50" fill="#34d399" fontSize="10" textAnchor="middle" fontWeight="bold">Step 1: Redis Reservation (Fast)</text>
                <text x="300" y="66" fill="var(--ifm-color-content-secondary)" fontSize="8" textAnchor="middle">DECR stock:101 ➔ Hold for 10 min</text>

                {/* The Seam (Red Warning) */}
                <line x1="140" y1="95" x2="180" y2="135" stroke="#f87171" strokeWidth="3" strokeDasharray="3 3" />
                <rect x="125" y="105" width="70" height="20" rx="4" fill="#2d1619" stroke="#f87171" strokeWidth="1" />
                <text x="160" y="119" fill="#f87171" fontSize="8" textAnchor="middle" fontWeight="bold">THE SEAM</text>

                {/* Path to MySQL */}
                <path d="M114 125 L200 155" stroke="#f87171" strokeWidth="2" strokeDasharray="4 3" markerEnd="url(#inv-arrow)" />
                <rect x="205" y="135" width="190" height="55" rx="6" fill="#2d1619" stroke="#f87171" strokeWidth="1.5" />
                <text x="300" y="155" fill="#f87171" fontSize="10" textAnchor="middle" fontWeight="bold">Step 2: MySQL Ledger (Fails / Drops)</text>
                <text x="300" y="172" fill="var(--ifm-color-content-secondary)" fontSize="8" textAnchor="middle">Timeout / Network Partition / Crash</text>
              </svg>

              <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '8px', lineHeight: 1.4 }}>
                <strong>No Distributed ACID:</strong> Because Redis and MySQL are physically independent databases, there is no atomic 2-phase commit. Any failure between Step 1 and Step 2 causes phantom stock holds or overselling.
              </div>
            </div>

            {/* Failure Modes List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(248, 113, 113, 0.1)', border: '1px solid #f87171' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', marginBottom: '6px' }}>
                  3 Catastrophic Failure Modes of Redis + MySQL
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.6 }}>
                  <p style={{ margin: '0 0 6px 0' }}>
                    <strong>1. The Expiration Race (Overselling):</strong> User A reserves in Redis. Stripe takes 10.1 minutes. Redis TTL expires and gives stock to User B. User A&apos;s payment finally succeeds and commits to MySQL. <strong>2 users bought 1 physical item!</strong>
                  </p>
                  <p style={{ margin: '0 0 6px 0' }}>
                    <strong>2. Phantom Holds (Underselling):</strong> Redis decrements stock, but the app crashes before writing to MySQL. The item shows &quot;Sold Out&quot; while units sit unsold in the warehouse.
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>3. Reconciler Drift:</strong> Background cron scripts must constantly compare Redis vs MySQL keys, adding millions of reconciliation queries during peak sales.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LIFECYCLE FLOW */}
        {activeTab === 'lifecycle-flow' && (
          <div style={{ padding: '8px', background: 'var(--ifm-background-surface-color)', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '12px', textTransform: 'uppercase' }}>
              The 3-Stage State Machine of a Reserved Unit
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '12px', borderRadius: '6px', background: 'var(--ifm-color-emphasis-100)', borderTop: '4px solid #34d399' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399' }}>1. AVAILABLE</div>
                <p style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', margin: '6px 0 0 0', lineHeight: 1.5 }}>
                  Unallocated unit in warehouse. Queryable by checkouts via <code>status = &apos;available&apos;</code>.
                </p>
              </div>

              <div style={{ padding: '12px', borderRadius: '6px', background: 'var(--ifm-color-emphasis-100)', borderTop: '4px solid #fbbf24' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24' }}>2. RESERVED (In Cart)</div>
                <p style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', margin: '6px 0 0 0', lineHeight: 1.5 }}>
                  Claimed with a 10-minute hold window. If payment fails or times out, reverts automatically to <code>AVAILABLE</code>.
                </p>
              </div>

              <div style={{ padding: '12px', borderRadius: '6px', background: 'var(--ifm-color-emphasis-100)', borderTop: '4px solid #38bdf8' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>3. SOLD (Committed)</div>
                <p style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', margin: '6px 0 0 0', lineHeight: 1.5 }}>
                  Payment confirmed. Transferred to fulfillment queue. Cannot be unlocked or reserved again.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TRADEOFF MATRIX */}
        {activeTab === 'tradeoff-matrix' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--ifm-color-emphasis-300)', color: 'var(--ifm-color-content)' }}>
                  <th style={{ padding: '8px' }}>Architecture Strategy</th>
                  <th style={{ padding: '8px' }}>Max Throughput</th>
                  <th style={{ padding: '8px' }}>Consistency Risk</th>
                  <th style={{ padding: '8px' }}>Row Contention</th>
                  <th style={{ padding: '8px' }}>Best Use Case</th>
                </tr>
              </thead>
              <tbody style={{ color: 'var(--ifm-color-content-secondary)' }}>
                <tr style={{ borderBottom: '1px solid var(--ifm-color-emphasis-200)' }}>
                  <td style={{ padding: '8px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>Single Counter (UPDATE qty = qty - 1)</td>
                  <td style={{ padding: '8px' }}>Low (~100 tx/s)</td>
                  <td style={{ padding: '8px', color: '#34d399' }}>Zero (ACID)</td>
                  <td style={{ padding: '8px', color: '#f87171' }}>Catastrophic (1 row lock)</td>
                  <td style={{ padding: '8px' }}>Low-traffic small stores</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--ifm-color-emphasis-200)' }}>
                  <td style={{ padding: '8px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>Redis Holds + MySQL Ledger</td>
                  <td style={{ padding: '8px', color: '#34d399' }}>Very High (~50k tx/s)</td>
                  <td style={{ padding: '8px', color: '#f87171' }}>High (Dual-write seam)</td>
                  <td style={{ padding: '8px', color: '#34d399' }}>Zero in MySQL</td>
                  <td style={{ padding: '8px' }}>Ticket reservations with high tolerance for reconcilers</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--ifm-color-emphasis-200)', background: 'rgba(52, 211, 153, 0.06)' }}>
                  <td style={{ padding: '8px', fontWeight: 700, color: '#34d399' }}>MySQL 8 SKIP LOCKED (Shopify Model)</td>
                  <td style={{ padding: '8px', color: '#34d399' }}>High (~10k - 20k tx/s per pod)</td>
                  <td style={{ padding: '8px', color: '#34d399' }}>Zero (100% ACID)</td>
                  <td style={{ padding: '8px', color: '#34d399' }}>Zero (Skips locked rows)</td>
                  <td style={{ padding: '8px', fontWeight: 700, color: '#34d399' }}>Massive Flash Sales / E-Commerce Checkouts</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
