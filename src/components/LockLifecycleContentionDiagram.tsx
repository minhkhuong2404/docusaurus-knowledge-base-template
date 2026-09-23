import React, { useState } from 'react';

export type LockScopeTab = 'lifecycles' | 'flash_sale_storm' | 'decision_matrix';

interface LockLifecycleContentionDiagramProps {
  initialTab?: LockScopeTab;
}

export default function LockLifecycleContentionDiagram({
  initialTab = 'lifecycles',
}: LockLifecycleContentionDiagramProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<LockScopeTab>(initialTab);
  const [concurrencyStrategy, setConcurrencyStrategy] = useState<'optimistic_retry' | 'redis_lua_queue'>('optimistic_retry');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .lock-grid-responsive {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Locking Archetypes & Lifespans: Why Optimistic Retries Fail in Flash Sales
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'lifecycles', label: '⏳ 1. Lock Lifespans & Scopes', color: '#38bdf8' },
            { id: 'flash_sale_storm', label: '💥 2. Flash Sale CAS Storm Simulator', color: '#f87171' },
            { id: 'decision_matrix', label: '📊 3. Lock Archetype Decision Matrix', color: '#34d399' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as LockScopeTab)}
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

        {/* Tab 1: Lock Lifespans */}
        {activeTab === 'lifecycles' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                1. Version Column (@Version)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.5' }}>
                <strong>Lives By:</strong> Application State / Commit Check.
                <br /><br />
                Zero DB locks during user thinking time. At commit: <code>UPDATE ... WHERE id = ? AND version = ?</code>.
                <br /><br />
                <span style={{ color: '#38bdf8' }}>Blast Radius:</span> None on DB locks, but high abort rate under contention.
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ color: '#34d399', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                2. SELECT FOR UPDATE
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.5' }}>
                <strong>Lives By:</strong> Relational Transaction Boundary.
                <br /><br />
                Acquired when row is read; <strong>automatically released when transaction commits or rolls back</strong>.
                <br /><br />
                <span style={{ color: '#34d399' }}>Blast Radius:</span> Serializes concurrent threads on that row; risk of lock timeout.
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                3. Advisory Lock (pg_advisory)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.5' }}>
                <strong>Lives By:</strong> Connection / Session Boundary.
                <br /><br />
                Does NOT release on COMMIT! Survives across multiple transactions until explicit unlock or socket disconnect.
                <br /><br />
                <span style={{ color: '#fbbf24' }}>Blast Radius:</span> Connection pool exhaustion if returned to pool while locked!
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ color: '#f87171', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                4. Lock Column (status=&apos;LOCKED&apos;)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.5' }}>
                <strong>Lives By:</strong> Persistent Table State.
                <br /><br />
                Stored in row data. If the application crashes before clearing the flag, the record is <strong>locked forever (zombie lock)</strong>.
                <br /><br />
                <span style={{ color: '#f87171' }}>Blast Radius:</span> Requires background reaper daemon with heartbeats.
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: '12px', marginBottom: '6px' }}>
                5. Redis Lock (SET NX PX)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.5' }}>
                <strong>Lives By:</strong> TTL + Watchdog Renewal.
                <br /><br />
                Lives for specified milliseconds. If process halts or GC pauses exceed TTL, lock expires prematurely.
                <br /><br />
                <span style={{ color: '#a78bfa' }}>Blast Radius:</span> Requires fencing tokens to prevent zombie writes to storage.
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Flash Sale Simulator */}
        {activeTab === 'flash_sale_storm' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button
                onClick={() => setConcurrencyStrategy('optimistic_retry')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: concurrencyStrategy === 'optimistic_retry' ? 'rgba(248, 113, 113, 0.25)' : 'rgba(255,255,255,0.05)',
                  color: concurrencyStrategy === 'optimistic_retry' ? '#f87171' : 'var(--ifm-color-content-secondary)',
                  border: `1px solid ${concurrencyStrategy === 'optimistic_retry' ? '#f87171' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                ❌ Optimistic Locking + Retry (The Naive Trap)
              </button>
              <button
                onClick={() => setConcurrencyStrategy('redis_lua_queue')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: concurrencyStrategy === 'redis_lua_queue' ? 'rgba(52, 211, 153, 0.25)' : 'rgba(255,255,255,0.05)',
                  color: concurrencyStrategy === 'redis_lua_queue' ? '#34d399' : 'var(--ifm-color-content-secondary)',
                  border: `1px solid ${concurrencyStrategy === 'redis_lua_queue' ? '#34d399' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                ✅ Redis Lua Atomic / Queue Serialization (Senior Architecture)
              </button>
            </div>

            <div className="lock-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px' }}>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: concurrencyStrategy === 'optimistic_retry' ? '#f87171' : '#34d399', marginBottom: '8px' }}>
                  {concurrencyStrategy === 'optimistic_retry' ? "The CAS Abort Storm Under 10,000 Req/sec" : "Sequential Linear Decrement"}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ background: '#0f172a', padding: '8px', borderRadius: '4px' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Abort / Retry Rate</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: concurrencyStrategy === 'optimistic_retry' ? '#f87171' : '#34d399' }}>
                      {concurrencyStrategy === 'optimistic_retry' ? "99.2%" : "0.0%"}
                    </div>
                  </div>
                  <div style={{ background: '#0f172a', padding: '8px', borderRadius: '4px' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>DB CPU Utilization</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: concurrencyStrategy === 'optimistic_retry' ? '#f87171' : '#34d399' }}>
                      {concurrencyStrategy === 'optimistic_retry' ? "100% (Pegged)" : "12%"}
                    </div>
                  </div>
                  <div style={{ background: '#0f172a', padding: '8px', borderRadius: '4px' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>P99 Latency</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: concurrencyStrategy === 'optimistic_retry' ? '#f87171' : '#34d399' }}>
                      {concurrencyStrategy === 'optimistic_retry' ? "7,450 ms" : "14 ms"}
                    </div>
                  </div>
                  <div style={{ background: '#0f172a', padding: '8px', borderRadius: '4px' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Connection Pool State</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: concurrencyStrategy === 'optimistic_retry' ? '#f87171' : '#34d399' }}>
                      {concurrencyStrategy === 'optimistic_retry' ? "EXHAUSTED" : "Healthy (5/50)"}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24', marginBottom: '8px' }}>
                  {concurrencyStrategy === 'optimistic_retry' ? "Why 'Retry On Conflict' Kills Ticketing" : "Why Lua / Queue Succeeds"}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                  {concurrencyStrategy === 'optimistic_retry' ? (
                    <>
                      <p>When 10,000 users try to buy 100 tickets simultaneously, 1 transaction succeeds in bumping the version. The remaining 9,999 transactions fail.</p>
                      <p>If each failed transaction retries 3 times, you produce <strong>30,000 database queries in seconds</strong>. Every retry recalculates, pulls connections from HikariCP, and saturates CPU with wasted rollback work.</p>
                      <p style={{ color: '#f87171', fontWeight: 600 }}>The database cascades into complete service outage while selling zero additional tickets.</p>
                    </>
                  ) : (
                    <>
                      <p>Redis executes single-threaded Lua scripts in microseconds: <code>if redis.call(&apos;get&apos;, key) &gt; 0 then return redis.call(&apos;decr&apos;, key) end</code>.</p>
                      <p>The first 100 requests decrement the counter and receive an instantaneous success token. The 101st request is immediately rejected with 0 retries and 0 database load.</p>
                      <p style={{ color: '#34d399', fontWeight: 600 }}>Database receives exactly 100 clean, non-conflicting checkout orders asynchronously.</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Decision Matrix */}
        {activeTab === 'decision_matrix' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--ifm-color-content)' }}>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Mechanism</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Contention Level</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Failure Mode</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Ideal Use Case</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 700, color: '#38bdf8' }}>Optimistic (@Version)</td>
                  <td style={{ padding: '8px', color: '#34d399' }}>Low (&lt; 5% conflicts)</td>
                  <td style={{ padding: '8px' }}>OptimisticLockException (Safe retry)</td>
                  <td style={{ padding: '8px' }}>User profiles, CMS articles, draft updates</td>
                </tr>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '8px', fontWeight: 700, color: '#34d399' }}>SELECT FOR UPDATE</td>
                  <td style={{ padding: '8px', color: '#fbbf24' }}>Medium (Scoped records)</td>
                  <td style={{ padding: '8px' }}>Lock Wait Timeout / Deadlock</td>
                  <td style={{ padding: '8px' }}>Bank account transfers, ledger updates</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 700, color: '#fbbf24' }}>FOR UPDATE SKIP LOCKED</td>
                  <td style={{ padding: '8px', color: '#34d399' }}>High (Pool of items)</td>
                  <td style={{ padding: '8px' }}>Returns empty if all locked</td>
                  <td style={{ padding: '8px' }}>Job queue workers, non-specific seat booking</td>
                </tr>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '8px', fontWeight: 700, color: '#a78bfa' }}>Redis Lua / Atomic Decr</td>
                  <td style={{ padding: '8px', color: '#f87171' }}>Extreme (10k+ req/sec)</td>
                  <td style={{ padding: '8px' }}>Immediate fast-fail rejection</td>
                  <td style={{ padding: '8px' }}>Flash sales, limited concert ticketing</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 700, color: '#f472b6' }}>Advisory Lock</td>
                  <td style={{ padding: '8px', color: '#38bdf8' }}>Application Mutex</td>
                  <td style={{ padding: '8px' }}>Blocks or NOWAIT fails</td>
                  <td style={{ padding: '8px' }}>Single-worker cron dispatch across nodes</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
