import React, { useState } from 'react';

interface Strategy {
  id: string;
  name: string;
  badge: string;
  color: string;
  architecture: string;
  latencyImpact: string;
  accuracy: string;
  pros: string[];
  cons: string[];
  codePattern: string;
}

const STRATEGIES: Strategy[] = [
  {
    id: 'regional-quota',
    name: '1. Regional Quotas (Static Split)',
    badge: 'Zero Cross-Region Latency',
    color: '#38bdf8',
    architecture: 'Divide global quota statically across regions (e.g. 600 US-EAST, 400 EU-WEST). Each region maintains its own isolated Redis.',
    latencyImpact: '0ms added latency (local regional Redis call only).',
    accuracy: 'Approximate — user routing across regions can hit both quotas (up to 1,000 req/min).',
    pros: [
      'Zero cross-region WAN network calls',
      'Extremely simple regional architecture',
      'High regional fault tolerance (region isolation)',
    ],
    cons: [
      'Static split does not adjust to dynamic traffic shifts',
      'Smart clients can bypass limit by multi-region routing',
    ],
    codePattern: `// Global Limit: 1,000 req/min
// US Region Config: capacity = 600
boolean allowed = usRedisLimiter.consume("user:42", capacity = 600, refill = 10);`,
  },
  {
    id: 'async-sync',
    name: '2. Async Synchronization',
    badge: 'Periodic Sync',
    color: '#fbbf24',
    architecture: 'Regions enforce local rate limits instantly, then periodically sync counts (e.g. every 5 seconds) to a central master Redis store.',
    latencyImpact: '0ms added latency for request path; background worker handles WAN sync.',
    accuracy: 'Eventual — allows up to 5 seconds of over-serving per region during sudden bursts.',
    pros: [
      'Fast request path (local regional check)',
      'Eventual global convergence',
    ],
    cons: [
      'Up to N-second window of over-consumption during traffic spikes',
      'Complex background sync logic & state management',
    ],
    codePattern: `@Scheduled(fixedRate = 5000)
public void syncRegionalCounters() {
    long globalCount = masterRedis.increment(key, localCount);
    if (globalCount > maxGlobalLimit) localBlocklist.add(key);
}`,
  },
  {
    id: 'consistent-hashing',
    name: '3. Consistent Hashing by Client ID',
    badge: 'Exact Global Enforcement',
    color: '#34d399',
    architecture: 'Route rate limit checks for a given client ID to a single authoritative region based on consistent hash algorithm.',
    latencyImpact: '0ms if client enters their primary region; ~80ms WAN hop if entering secondary region.',
    accuracy: '100% Exact — all requests for a client hash to the exact same Redis cluster.',
    pros: [
      'Perfect 100% exact global rate enforcement per client',
      'No over-serving windows or race conditions',
    ],
    cons: [
      'Cross-region latency hop if client hits non-home region',
      'Complex consistent hash ring management on region failover',
    ],
    codePattern: `String targetRegion = hashRing.getRegion("user:42"); // e.g. "US-EAST"
RedisClient targetRedis = getRedisForRegion(targetRegion);
boolean allowed = targetRedis.consume("user:42", limit = 1000);`,
  },
];

export default function MultiRegionRateLimitingDiagram(): React.JSX.Element {
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy>(STRATEGIES[0]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Multi-Region Rate Limiting Strategy Explorer
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Strategy Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {STRATEGIES.map((st) => {
            const isSelected = st.id === selectedStrategy.id;
            return (
              <button
                key={st.id}
                onClick={() => setSelectedStrategy(st)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: isSelected ? `1px solid ${st.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.2)',
                  color: isSelected ? '#ffffff' : 'var(--ifm-color-content-secondary)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 600 : 400,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>{st.name}</span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: `${st.color}22`,
                    color: st.color,
                    fontWeight: 600,
                  }}
                >
                  {st.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Overview Banner */}
        <div
          style={{
            padding: '14px 16px',
            backgroundColor: '#0c0e17',
            borderRadius: '10px',
            borderLeft: `4px solid ${selectedStrategy.color}`,
            marginBottom: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#fff', marginBottom: '6px' }}>
            {selectedStrategy.name}
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            {selectedStrategy.architecture}
          </p>
        </div>

        {/* Technical Trade-Off Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          {/* Metrics */}
          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Request Path Latency Impact
            </div>
            <div style={{ fontSize: '13px', color: selectedStrategy.color, fontWeight: 700, marginBottom: '12px' }}>
              {selectedStrategy.latencyImpact}
            </div>

            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Global Enforcement Accuracy
            </div>
            <div style={{ fontSize: '13px', color: 'var(--ifm-color-content)', fontWeight: 600 }}>
              {selectedStrategy.accuracy}
            </div>
          </div>

          {/* Pros & Cons */}
          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#34d399', marginBottom: '6px', fontWeight: 700 }}>
              Key Advantages
            </div>
            <ul style={{ margin: '0 0 12px 0', paddingLeft: '18px', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              {selectedStrategy.pros.map((p, idx) => <li key={idx}>{p}</li>)}
            </ul>

            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#f87171', marginBottom: '6px', fontWeight: 700 }}>
              Architectural Trade-Offs
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              {selectedStrategy.cons.map((c, idx) => <li key={idx}>{c}</li>)}
            </ul>
          </div>
        </div>

        {/* Code Pattern snippet */}
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '8px', fontWeight: 600 }}>
            Implementation Code Pattern
          </div>
          <pre style={{ margin: 0, padding: '10px', backgroundColor: '#05070e', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', color: '#38bdf8', border: '1px solid rgba(255,255,255,0.05)' }}>
            <code>{selectedStrategy.codePattern}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
