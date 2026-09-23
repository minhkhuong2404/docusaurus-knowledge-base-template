import React, { useState } from 'react';

export type QueryOptTab = 'hash_join' | 'app_join' | 'select_id_write' | 'upsert_traps';

interface QueryOptimizationUpsertTrapsDiagramProps {
  initialTab?: QueryOptTab;
}

export default function QueryOptimizationUpsertTrapsDiagram({
  initialTab = 'upsert_traps',
}: QueryOptimizationUpsertTrapsDiagramProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<QueryOptTab>(initialTab);
  const [activeTrap, setActiveTrap] = useState<number>(1);

  const upsertTraps = [
    {
      num: 1,
      title: 'Auto-Increment Counter Exhaustion & Gaps',
      color: '#f87171',
      desc: 'Whenever an `INSERT ... ON DUPLICATE KEY UPDATE` executes, MySQL allocates an auto-increment ID upfront before evaluating whether a duplicate key exists. If the row already exists and triggers an UPDATE, the allocated ID is DISCARDED! High-frequency upsert jobs burn through millions of IDs per hour, triggering integer overflow on INT/BIGINT keys.',
      code: `-- Table has 1 row (id=1, email='a@b.com')
INSERT INTO users (email, name) VALUES ('a@b.com', 'Alice')
ON DUPLICATE KEY UPDATE name = VALUES(name);
-- Next inserted row receives id=3 (id=2 was burned!)`,
    },
    {
      num: 2,
      title: 'Insert Intention vs Gap Lock Deadlocks',
      color: '#fbbf24',
      desc: 'When an upsert encounters a duplicate key on a secondary unique index, InnoDB acquires an Exclusive Next-Key Lock on that existing row. If two concurrent transactions upsert records into adjacent gaps in different order, the Insert Intention lock waits for the Gap lock held by the other, resulting in an immediate deadlock.',
      code: `Tx1: INSERT INTO inventory (sku, qty) VALUES ('A', 10) ON DUP... (Locks gap A)
Tx2: INSERT INTO inventory (sku, qty) VALUES ('B', 20) ON DUP... (Locks gap B)
Tx1: Wants to insert B -> Waits for Tx2 gap lock
Tx2: Wants to insert A -> Waits for Tx1 gap lock -> DEADLOCK!`,
    },
    {
      num: 3,
      title: 'Binlog Replication Divergence (Statement Mode)',
      color: '#a78bfa',
      desc: 'In statement-based replication (binlog_format=STATEMENT), if an upsert references non-deterministic functions (e.g. NOW(), UUID()) or if secondary unique index evaluation order differs between master and replica, the replica updates a completely different row than the master! Must always use binlog_format=ROW.',
      code: `-- DANGEROUS under binlog_format=STATEMENT:
INSERT INTO audit_log (key, count, updated_at) 
VALUES ('k1', 1, NOW())
ON DUPLICATE KEY UPDATE count = count + 1, updated_at = NOW();`,
    },
    {
      num: 4,
      title: 'Multiple Unique Key Ambiguity',
      color: '#38bdf8',
      desc: 'If a table has BOTH a Primary Key (`id`) and a Unique Secondary Key (`email`), and the incoming values match id on Row 1 but email on Row 2, MySQL cannot update both! It updates only ONE of the rows arbitrarily, leaving the database in an inconsistent state.',
      code: `Table: (id=1, email='alice@a.com'), (id=2, email='bob@b.com')
INSERT INTO users (id, email) VALUES (1, 'bob@b.com')
ON DUPLICATE KEY UPDATE ...;
-- Unpredictable: Which row gets updated? id=1 or id=2?`,
    },
  ];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .queryopt-grid-responsive {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <path d="M11 8v6" />
          <path d="M8 11h6" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Advanced Query Optimization: Hash Joins, App-Side Joins & The 4 UPSERT Traps
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'upsert_traps', label: '⚠️ 1. The 4 UPSERT Traps', color: '#f87171' },
            { id: 'hash_join', label: '⚙️ 2. Hash Join Memory Spills', color: '#fbbf24' },
            { id: 'app_join', label: '⚡ 3. App-Side Joins (No N+1)', color: '#34d399' },
            { id: 'select_id_write', label: '🔒 4. SELECT id Then Write-by-ID', color: '#38bdf8' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as QueryOptTab)}
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

        {/* Tab 1: 4 UPSERT Traps */}
        {activeTab === 'upsert_traps' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {upsertTraps.map((tr) => (
                <button
                  key={tr.num}
                  onClick={() => setActiveTrap(tr.num)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: activeTrap === tr.num ? `${tr.color}25` : 'rgba(255,255,255,0.05)',
                    color: activeTrap === tr.num ? tr.color : 'var(--ifm-color-content-secondary)',
                    border: `1px solid ${activeTrap === tr.num ? tr.color : 'rgba(255,255,255,0.1)'}`,
                  }}
                >
                  Trap #{tr.num}: {tr.title.split('&')[0].trim()}
                </button>
              ))}
            </div>

            <div className="queryopt-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px' }}>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: upsertTraps[activeTrap - 1].color, marginBottom: '8px' }}>
                  {upsertTraps[activeTrap - 1].title}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                  {upsertTraps[activeTrap - 1].desc}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                  Code Example & Anomaly
                </div>
                <pre style={{ margin: 0, padding: '10px', background: '#0f172a', borderRadius: '6px', fontSize: '11px', color: '#e2e8f0' }}>
                  {upsertTraps[activeTrap - 1].code}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Hash Join */}
        {activeTab === 'hash_join' && (
          <div className="queryopt-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px' }}>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24', marginBottom: '8px' }}>
                Hash Join Memory Spill Architecture
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                <p>Starting in MySQL 8.0.18 and standard in PostgreSQL, the optimizer uses <strong>Hash Joins</strong> for equi-joins when no index is available.</p>
                <p><strong>Phase 1 (Build):</strong> Reads the smaller table and constructs an in-memory hash table keyed by the join attribute.</p>
                <p><strong>Phase 2 (Probe):</strong> Reads the larger table and probes each row against the hash table in memory in $O(1)$ time.</p>
                <p style={{ color: '#f87171', fontWeight: 600 }}>
                  <strong>The Disk Spill Trap:</strong> If the build table exceeds <code>join_buffer_size</code> (MySQL) or <code>work_mem</code> (PostgreSQL), the hash table spills into temporary disk files, degrading latency from 20ms to 8 seconds!
                </p>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                EXPLAIN Output Detection
              </div>
              <pre style={{ margin: 0, padding: '10px', background: '#0f172a', borderRadius: '6px', fontSize: '11px', color: '#e2e8f0' }}>
{`-- Look for hash join spills in EXPLAIN ANALYZE:
-> Inner hash join (orders.user_id = users.id)
   (actual time=0.45..12.3 rows=50000)
   -- Warning if spilling to disk:
   Batches: 5, Memory Usage: 32768kB (Disk Spill: Yes)`}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: App-side joins */}
        {activeTab === 'app_join' && (
          <div className="queryopt-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px' }}>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', marginBottom: '8px' }}>
                Application-Side 2-Step Batch Join
              </div>
              <pre style={{ margin: 0, padding: '10px', background: '#0f172a', borderRadius: '6px', fontSize: '11px', color: '#e2e8f0' }}>
{`// Step 1: Fetch top 50 orders (1 roundtrip)
List<Order> orders = orderRepo.findByUserId(userId, limit(50));
List<Long> orderIds = orders.stream().map(Order::getId).toList();

// Step 2: Batch fetch all related items (1 roundtrip)
List<OrderItem> items = itemRepo.findByOrderIdIn(orderIds);

// Step 3: In-memory hash mapping (0 roundtrips)
Map<Long, List<OrderItem>> itemMap = items.stream()
    .collect(groupingBy(OrderItem::getOrderId));`}
              </pre>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                Why This Beats Complex Multi-Table SQL JOINs
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                <p>1. <strong>No Cartesian Products:</strong> Prevents transferring redundant order columns for every child item row over the wire.</p>
                <p>2. <strong>Cache-Friendly:</strong> Each entity (Order, Item) can be independently cached in Redis with high cache hit ratios.</p>
                <p>3. <strong>Microservice-Ready:</strong> Works seamlessly when `orders` and `order_items` are partitioned across different database shards.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: SELECT id then write */}
        {activeTab === 'select_id_write' && (
          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
              The &apos;SELECT id Then Write-by-ID&apos; Deterministic Locking Pattern
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
              <p>Naive batch updates using range conditions (e.g. <code>UPDATE orders SET status = &apos;EXPIRED&apos; WHERE created_at &lt; NOW() - INTERVAL 7 DAY LIMIT 1000</code>) acquire arbitrary, non-deterministic gap locks that routinely deadlock against concurrent user writes.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '10px' }}>
                <div style={{ background: '#0f172a', padding: '10px', borderRadius: '6px' }}>
                  <strong style={{ color: '#38bdf8', fontSize: '11px' }}>1. Read-Only ID Fetch</strong>
                  <div style={{ fontSize: '10px', marginTop: '4px' }}><code>SELECT id FROM orders WHERE created_at &lt; ? LIMIT 1000;</code><br />Zero write locks acquired.</div>
                </div>
                <div style={{ background: '#0f172a', padding: '10px', borderRadius: '6px' }}>
                  <strong style={{ color: '#fbbf24', fontSize: '11px' }}>2. Sort in Memory</strong>
                  <div style={{ fontSize: '10px', marginTop: '4px' }}><code>orderIds.sort(naturalOrder());</code><br />Guarantees every thread acquires locks in identical ascending order.</div>
                </div>
                <div style={{ background: '#0f172a', padding: '10px', borderRadius: '6px' }}>
                  <strong style={{ color: '#34d399', fontSize: '11px' }}>3. Targeted Write by PK</strong>
                  <div style={{ fontSize: '10px', marginTop: '4px' }}><code>UPDATE orders SET status = &apos;EXPIRED&apos; WHERE id IN (:sortedIds);</code><br />Locks exact rows, 0 gap locks, 0 deadlocks.</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
