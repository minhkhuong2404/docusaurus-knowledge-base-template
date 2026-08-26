import React, { useState } from 'react';

export default function CacheExpirationMechanismsDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'dual' | 'taxonomy' | 'triad'>('dual');
  const [activePolicyIdx, setActivePolicyIdx] = useState<number>(0);
  const [sampleExpiredCount, setSampleExpiredCount] = useState<number>(6); // Default >25% (6 out of 20)

  const policies = [
    {
      name: '1. Absolute Expiration',
      subtitle: 'Expire-After-Write / Fixed TTL',
      color: '#38bdf8',
      desc: 'TTL is fixed at the moment of insertion. Read operations have zero effect on expiration. The key expires exactly after duration T.',
      useCase: 'Predictable business cycles (currency exchange rates, catalog pricing, public leaderboard refreshes).',
      redisCmd: 'SET product:450 \'{"name":"Laptop"}\' EX 600',
      javaCode: 'Caffeine.newBuilder().expireAfterWrite(10, TimeUnit.MINUTES).build();'
    },
    {
      name: '2. Sliding Expiration',
      subtitle: 'Expire-After-Access / Inactivity Window',
      color: '#34d399',
      desc: 'The expiration countdown resets back to the full TTL on every read or write access. Keys only expire after a continuous period of total inactivity.',
      useCase: 'User authentication sessions, active shopping carts, user presence/activity tracking.',
      redisCmd: 'GETEX session:token_abc EX 1800',
      javaCode: 'Caffeine.newBuilder().expireAfterAccess(30, TimeUnit.MINUTES).build();'
    },
    {
      name: '3. Point-in-Time Expiration',
      subtitle: 'Expire-At / Target Epoch Timestamp',
      color: '#fbbf24',
      desc: 'Assigned an explicit target Unix Epoch timestamp or calendar cutoff rather than counting down a relative duration.',
      useCase: 'Daily quota resets at 23:59:59 UTC, flash sale promotional pricing cutoff.',
      redisCmd: 'EXPIREAT quota:user_123 1735689599',
      javaCode: '// Spring Scheduled task or custom Expiry policy'
    },
    {
      name: '4. Variable / Jittered Expiration',
      subtitle: 'Entropy-Based TTL (Prevents Stampedes)',
      color: '#a78bfa',
      desc: 'Adds randomized numerical entropy: TTL_actual = TTL_base ± Random(Jitter). Desynchronizes expirations across batch keys.',
      useCase: 'Pre-warming cache, bulk database syncs, avoiding catastrophic Cache Avalanches.',
      redisCmd: '# Calculated in application layer before SET',
      javaCode: 'int jitter = ThreadLocalRandom.current().nextInt(-600, 601);\nint actualTtl = baseTtlSeconds + jitter;\nredisTemplate.opsForValue().set(key, val, actualTtl, TimeUnit.SECONDS);'
    },
    {
      name: '5. Dynamic / Contextual Expiration',
      subtitle: 'Adaptive SLA / Load-Aware TTL',
      color: '#f472b6',
      desc: 'TTL is dynamically computed at runtime based on external factors like database CPU load, payload size, or user tier.',
      useCase: 'Adaptive load shedding (doubling TTL during DB CPU spikes > 80%), VIP vs Free customer session SLAs.',
      redisCmd: '# Application computes TTL based on telemetry metrics',
      javaCode: 'long baseTtl = (user.isVip()) ? 7200 : 1800;\nif (dbMetrics.getCpuUsage() > 0.80) baseTtl *= 2;'
    }
  ];

  const currentPolicy = policies[activePolicyIdx];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Cache Expiration Mechanics: Dual-Cleanup Engine &amp; Policy Taxonomy
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('dual')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'dual' ? '1px solid #2dd4bf50' : '1px solid transparent',
              background: activeTab === 'dual' ? '#2dd4bf18' : 'transparent',
              color: activeTab === 'dual' ? '#2dd4bf' : 'var(--ifm-color-content-secondary)'
            }}
          >
            Dual-Cleanup Engine
          </button>
          <button
            onClick={() => setActiveTab('taxonomy')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'taxonomy' ? '1px solid #2dd4bf50' : '1px solid transparent',
              background: activeTab === 'taxonomy' ? '#2dd4bf18' : 'transparent',
              color: activeTab === 'taxonomy' ? '#2dd4bf' : 'var(--ifm-color-content-secondary)'
            }}
          >
            5 Expiration Policies
          </button>
          <button
            onClick={() => setActiveTab('triad')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'triad' ? '1px solid #2dd4bf50' : '1px solid transparent',
              background: activeTab === 'triad' ? '#2dd4bf18' : 'transparent',
              color: activeTab === 'triad' ? '#2dd4bf' : 'var(--ifm-color-content-secondary)'
            }}
          >
            Architectural Triad
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Tab 1: Dual-Mechanism Clean Up Engine */}
        {activeTab === 'dual' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '16px' }}>
              {/* Mechanism 1: Passive / Lazy */}
              <div style={{
                background: '#0c0e17',
                borderRadius: '10px',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                padding: '14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: '13px' }}>
                    1. Passive / Lazy Expiration
                  </span>
                  <span style={{ fontSize: '10px', color: '#38bdf8', background: '#38bdf818', padding: '2px 6px', borderRadius: '4px' }}>
                    On-Access (GET)
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, marginBottom: '10px' }}>
                  • <strong>Trigger:</strong> Client executes a read operation (`GET user:100`).<br />
                  • <strong>Check:</strong> Engine checks timestamp metadata in the key header.<br />
                  • <strong>Action:</strong> If current time &gt; expire timestamp, synchronously delete key from RAM and return `nil` (Cache Miss).<br />
                  • <strong>Limitation:</strong> Orphaned keys that are never read again would linger in RAM indefinitely without active cleanup.
                </div>
              </div>

              {/* Mechanism 2: Active / Periodic Sampling */}
              <div style={{
                background: '#0c0e17',
                borderRadius: '10px',
                border: '1px solid rgba(52, 211, 153, 0.25)',
                padding: '14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ color: '#34d399', fontWeight: 700, fontSize: '13px' }}>
                    2. Active / Periodic Expiration
                  </span>
                  <span style={{ fontSize: '10px', color: '#34d399', background: '#34d39918', padding: '2px 6px', borderRadius: '4px' }}>
                    10Hz Background Daemon
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, marginBottom: '10px' }}>
                  • <strong>Cycle:</strong> Runs 10 times per second (`activeExpireCycle()` in Redis).<br />
                  • <strong>Sampling:</strong> Randomly tests <strong>20 keys</strong> with active TTL.<br />
                  • <strong>Purge:</strong> Immediately evicts expired keys from RAM.<br />
                  • <strong>Repeat Rule:</strong> If <strong>&gt;25% (&gt;5 keys)</strong> of sample were expired, immediately repeat cycle to aggressively free RAM!
                </div>
              </div>
            </div>

            {/* Interactive Sampling Simulator */}
            <div style={{
              background: '#090b14',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.06)',
              padding: '14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                  Active Sampling Simulator (20 Random Keys Sampled):
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: sampleExpiredCount > 5 ? '#f87171' : '#34d399'
                }}>
                  {sampleExpiredCount} of 20 Expired ({((sampleExpiredCount / 20) * 100).toFixed(0)}%)
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={sampleExpiredCount}
                onChange={(e) => setSampleExpiredCount(Number(e.target.value))}
                style={{ width: '100%', accentColor: sampleExpiredCount > 5 ? '#f87171' : '#34d399', marginBottom: '10px' }}
              />

              <div style={{
                background: '#0c0e17',
                padding: '10px',
                borderRadius: '6px',
                fontSize: '11px',
                color: 'var(--ifm-color-content-secondary)'
              }}>
                {sampleExpiredCount > 5 ? (
                  <span style={{ color: '#f87171' }}>
                    <strong>Threshold Exceeded (&gt;25%):</strong> Because {sampleExpiredCount}/20 keys are expired, Redis immediately restarts `activeExpireCycle()` without waiting for the next 100ms interval to aggressively clean memory!
                  </span>
                ) : (
                  <span style={{ color: '#34d399' }}>
                    <strong>Healthy Memory (&le;25%):</strong> Expired keys purged. The background worker sleeps until the next scheduled 10Hz cycle.
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: 5 Expiration Policies Taxonomy */}
        {activeTab === 'taxonomy' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '14px' }}>
              {policies.map((p, idx) => (
                <button
                  key={p.name}
                  onClick={() => setActivePolicyIdx(idx)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '6px',
                    border: activePolicyIdx === idx ? `1px solid ${p.color}` : '1px solid rgba(255,255,255,0.08)',
                    background: activePolicyIdx === idx ? `${p.color}18` : '#090b14',
                    color: activePolicyIdx === idx ? p.color : 'var(--ifm-color-content-secondary)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  {p.name.split('.')[1]}
                </button>
              ))}
            </div>

            <div style={{
              background: '#0c0e17',
              borderRadius: '10px',
              border: `1px solid ${currentPolicy.color}40`,
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: currentPolicy.color }}>
                  {currentPolicy.name}: {currentPolicy.subtitle}
                </span>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5, marginBottom: '10px' }}>
                {currentPolicy.desc}
              </p>

              <div style={{ marginBottom: '12px', fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
                <strong>Best Use Cases:</strong> {currentPolicy.useCase}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: '#090b14', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700, marginBottom: '4px' }}>REDIS COMMAND</div>
                  <pre style={{ margin: 0, padding: 0, background: 'transparent', fontSize: '11px', color: 'var(--ifm-color-content)', whiteSpace: 'pre-wrap' }}>
                    {currentPolicy.redisCmd}
                  </pre>
                </div>

                <div style={{ background: '#090b14', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '10px', color: '#34d399', fontWeight: 700, marginBottom: '4px' }}>JAVA / CAFFEINE PATTERN</div>
                  <pre style={{ margin: 0, padding: 0, background: 'transparent', fontSize: '10.5px', color: 'var(--ifm-color-content)', whiteSpace: 'pre-wrap' }}>
                    {currentPolicy.javaCode}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: The Architectural Triad */}
        {activeTab === 'triad' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            <div style={{
              background: '#0c0e17',
              borderRadius: '8px',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              padding: '14px'
            }}>
              <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
                Cache Expiration
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                • <strong>Trigger:</strong> Clock / Time<br />
                • <strong>Condition:</strong> Key TTL duration has elapsed.<br />
                • <strong>State:</strong> Data becomes <em>Stale</em>.<br />
                • <strong>Mechanism:</strong> Lazy on GET &amp; 10Hz sampling.
              </div>
            </div>

            <div style={{
              background: '#0c0e17',
              borderRadius: '8px',
              border: '1px solid rgba(248, 113, 113, 0.25)',
              padding: '14px'
            }}>
              <div style={{ color: '#f87171', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
                Cache Eviction
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                • <strong>Trigger:</strong> RAM / Memory Capacity<br />
                • <strong>Condition:</strong> Cache hits `maxmemory` limit.<br />
                • <strong>State:</strong> Data may still be <em>Fresh</em>, but sacrificed.<br />
                • <strong>Mechanism:</strong> LRU, LFU, W-TinyLFU.
              </div>
            </div>

            <div style={{
              background: '#0c0e17',
              borderRadius: '8px',
              border: '1px solid rgba(52, 211, 153, 0.25)',
              padding: '14px'
            }}>
              <div style={{ color: '#34d399', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
                Cache Invalidation
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                • <strong>Trigger:</strong> Data Mutation Event<br />
                • <strong>Condition:</strong> Authoritative DB record is updated/deleted.<br />
                • <strong>State:</strong> Data becomes <em>Inconsistent</em>.<br />
                • <strong>Mechanism:</strong> CDC (Debezium), Dual-Delete, Pub/Sub.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
