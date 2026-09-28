import React, { useState } from 'react';

export type RedisLuaTab = 'batch_race' | 'lua_lock' | 'cluster_clock' | 'rtt_math';

interface RedisLuaDistributedLockDiagramProps {
  initialTab?: RedisLuaTab;
}

export default function RedisLuaDistributedLockDiagram({
  initialTab = 'batch_race',
}: RedisLuaDistributedLockDiagramProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<RedisLuaTab>(initialTab);
  const [executionMode, setExecutionMode] = useState<'interleaved' | 'lua_atomic'>('interleaved');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .redis-grid-responsive {
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
          <path d="m9 12 2 2 4-4" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Redis Lua Scripting: Atomicity, Distributed Locks & Roundtrip Optimization
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'batch_race', label: '⚔️ 1. Batch vs Single Mutation Race', color: '#f87171' },
            { id: 'lua_lock', label: '🔒 2. Safe Lock & Fencing Token', color: '#38bdf8' },
            { id: 'cluster_clock', label: '⏱️ 3. TIME Monotonic Clock & Handover', color: '#34d399' },
            { id: 'rtt_math', label: '⚡ 4. The Roundtrip (RTT) Math', color: '#fbbf24' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as RedisLuaTab)}
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

        {/* Tab 1: Batch vs Single Mutation Race */}
        {activeTab === 'batch_race' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button
                onClick={() => setExecutionMode('interleaved')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: executionMode === 'interleaved' ? 'rgba(248, 113, 113, 0.25)' : 'rgba(255,255,255,0.05)',
                  color: executionMode === 'interleaved' ? '#f87171' : 'var(--ifm-color-content-secondary)',
                  border: `1px solid ${executionMode === 'interleaved' ? '#f87171' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                ❌ Interleaved Pipeline / Multiple Commands (Data Corruption)
              </button>
              <button
                onClick={() => setExecutionMode('lua_atomic')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: executionMode === 'lua_atomic' ? 'rgba(52, 211, 153, 0.25)' : 'rgba(255,255,255,0.05)',
                  color: executionMode === 'lua_atomic' ? '#34d399' : 'var(--ifm-color-content-secondary)',
                  border: `1px solid ${executionMode === 'lua_atomic' ? '#34d399' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                ✅ Atomic Redis Lua Script (Zero Interleaving)
              </button>
            </div>

            <div className="redis-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px' }}>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: executionMode === 'interleaved' ? '#f87171' : '#34d399', marginBottom: '8px' }}>
                  Redis Event Loop Execution Timeline
                </div>

                <svg viewBox="0 0 460 210" style={{ width: '100%', height: 'auto' }}>
                  {/* Event Loop Queue Box */}
                  <rect x="20" y="20" width="420" height="170" rx="8" fill="#0f172a" stroke="#334155" />
                  <text x="230" y="42" fill="#94a3b8" fontSize="11" fontWeight="700" textAnchor="middle">
                    Redis Single-Threaded Command Queue
                  </text>

                  {executionMode === 'interleaved' ? (
                    <>
                      {/* Interleaved queue entries */}
                      <rect x="40" y="55" width="380" height="24" rx="4" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" />
                      <text x="50" y="71" fill="#38bdf8" fontSize="10">Batch Worker: HSET product:42 price 100</text>

                      <rect x="40" y="85" width="380" height="24" rx="4" fill="rgba(248, 113, 113, 0.3)" stroke="#f87171" strokeWidth="1.5" />
                      <text x="50" y="101" fill="#fca5a5" fontSize="10" fontWeight="700">⚡ User Edit: HSET product:42 stock 0 (Out of Stock)</text>

                      <rect x="40" y="115" width="380" height="24" rx="4" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" />
                      <text x="50" y="131" fill="#38bdf8" fontSize="10">Batch Worker: HSET product:42 stock 50 (OVERWRITES USER EDIT!)</text>

                      <rect x="40" y="145" width="380" height="24" rx="4" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" />
                      <text x="50" y="161" fill="#38bdf8" fontSize="10">Batch Worker: HSET product:42 status ACTIVE</text>
                    </>
                  ) : (
                    <>
                      {/* Lua monolithic entry */}
                      <rect x="40" y="65" width="380" height="100" rx="6" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" strokeWidth="2" />
                      <text x="230" y="95" fill="#34d399" fontSize="12" fontWeight="800" textAnchor="middle">
                        EVALSHA (Batch Atomic Lua Script)
                      </text>
                      <text x="230" y="118" fill="#e2e8f0" fontSize="10" textAnchor="middle">
                        Executes all 5 mutations without interruption.
                      </text>
                      <text x="230" y="135" fill="#94a3b8" fontSize="10" textAnchor="middle">
                        User edit queues cleanly AFTER Lua completes or aborts safely.
                      </text>
                    </>
                  )}
                </svg>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24', marginBottom: '8px' }}>
                  The Batch Import Race Condition
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                  <p>When an asynchronous worker imports 50,000 products, naive code sends pipelined <code>HSET</code> or multi-command batches.</p>
                  <p>Meanwhile, a seller marks product 42 as <em>Out of Stock</em> via API. If that single API call sneaks in between the batch worker&apos;s individual commands, the batch worker&apos;s subsequent command overwrites the stock back to 50!</p>
                  <p style={{ color: '#34d399', fontWeight: 600 }}>By encapsulating the read-verify-write logic in a single Lua script, Redis guarantees absolute serial atomicity.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Lua Distributed Lock */}
        {activeTab === 'lua_lock' && (
          <div className="redis-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px' }}>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                1. Safe Atomic Release Script
              </div>
              <pre style={{ margin: 0, padding: '10px', background: '#0f172a', borderRadius: '6px', fontSize: '11px', color: '#e2e8f0' }}>
{`-- Release lock ONLY if the token matches:
-- KEYS[1] = lock key, ARGV[1] = random_uuid
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end`}
              </pre>
              <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
                Prevents Node A from deleting Node B&apos;s lock if Node A experienced a long GC pause and its lock already expired!
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', marginBottom: '8px' }}>
                2. Watchdog Lease Renewal Script
              </div>
              <pre style={{ margin: 0, padding: '10px', background: '#0f172a', borderRadius: '6px', fontSize: '11px', color: '#e2e8f0' }}>
{`-- Extend TTL only if still owned by this client:
-- KEYS[1] = lock key, ARGV[1] = uuid, ARGV[2] = ttl_ms
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("pexpire", KEYS[1], ARGV[2])
else
    return 0
end`}
              </pre>
              <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
                Background thread pulses every <code>TTL / 3</code> to maintain the lease while the business operation is actively executing.
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: TIME Monotonic Clock */}
        {activeTab === 'cluster_clock' && (
          <div className="redis-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px' }}>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', marginBottom: '8px' }}>
                The Trap of Local Pod System Clocks
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                <p>Distributed microservice pods run on different physical hypervisors. Their system clocks drift due to VM hypervisor clock skew, NTP step corrections, or leap seconds.</p>
                <p>If Pod A evaluates <code>System.currentTimeMillis()</code> and writes a lease until <code>T+30s</code>, Pod B whose clock is 5 seconds ahead may consider the lease expired immediately!</p>
                <div style={{ padding: '8px', background: 'rgba(52, 211, 153, 0.1)', borderRadius: '4px', border: '1px solid #34d399' }}>
                  <strong>The Solution: Redis TIME</strong>
                  <br />Inside Lua: <code>local t = redis.call(&apos;TIME&apos;)</code>
                  <br />Returns <code>[seconds, microseconds]</code> directly from the Redis Master kernel, providing a single cluster-wide monotonic source of truth.
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                Cooperative Lock Handover Between Pods
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.6' }}>
                <p>When a blue/green pod deployment occurs or a worker drains for graceful shutdown, dropping a lock forces all competing workers into a thundering herd race.</p>
                <p><strong>Handover Protocol:</strong> Instead of deleting the lock, Pod A executes a Lua script that re-assigns ownership directly to Pod B&apos;s token:
                <br /><code>if get(lock) == podA then set(lock, podB); return 1 end</code></p>
                <p style={{ color: '#38bdf8' }}>Guarantees zero idle downtime and zero race conditions during rolling restarts.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: RTT Math */}
        {activeTab === 'rtt_math' && (
          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fbbf24', marginBottom: '12px' }}>
              Latency Comparison: 5 Commands Across a 1.5ms Network Hop
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div style={{ background: '#0f172a', padding: '12px', borderRadius: '6px', border: '1px solid #f87171' }}>
                <div style={{ color: '#f87171', fontWeight: 700, fontSize: '12px' }}>Sequential Calls</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#f87171', margin: '6px 0' }}>7.5 ms</div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>5 RTTs × 1.5ms network. Redis execution was only 25µs! 99.7% of time is wire latency.</div>
              </div>

              <div style={{ background: '#0f172a', padding: '12px', borderRadius: '6px', border: '1px solid #fbbf24' }}>
                <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '12px' }}>Pipelining</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#fbbf24', margin: '6px 0' }}>1.5 ms</div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>1 RTT. Batched in TCP socket buffer. <strong>Warning:</strong> Not atomic! Other clients can interleave.</div>
              </div>

              <div style={{ background: '#0f172a', padding: '12px', borderRadius: '6px', border: '1px solid #34d399' }}>
                <div style={{ color: '#34d399', fontWeight: 700, fontSize: '12px' }}>Lua Script (EVALSHA)</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#34d399', margin: '6px 0' }}>1.5 ms</div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>1 RTT + 100% Guaranteed Atomicity. Zero command interleaving in Redis event loop.</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
