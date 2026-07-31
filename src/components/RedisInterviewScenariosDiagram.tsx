import React, { useState } from 'react';

interface ProductionScenario {
  id: string;
  name: string;
  badge: string;
  color: string;
  problemDescription: string;
  impactOnDb: string;
  solutionArchitecture: string;
  codeOrFix: string;
}

const SCENARIOS: ProductionScenario[] = [
  {
    id: 'penetration',
    name: '1. Cache Penetration',
    badge: 'Non-Existent Keys',
    color: '#f87171',
    problemDescription: 'Attacker repeatedly queries for non-existent keys (e.g. `userId = -999`). Every request misses Cache and hits SQL Database directly.',
    impactOnDb: 'High DB CPU / Connection Pool exhaustion from bad actor traffic.',
    solutionArchitecture: 'Solution 1: Cache Null values with short TTL (e.g. 5 minutes).\nSolution 2: Place a Bloom Filter in front of Redis to intercept invalid keys in O(1) time.',
    codeOrFix: `// Bloom Filter Check:\nif (!bloomFilter.contains(userId)) return null;\n\n// Or Cache Null:\nredis.set(key, "NULL", Duration.ofMinutes(5));`,
  },
  {
    id: 'avalanche',
    name: '2. Cache Avalanche',
    badge: 'Mass TTL Expiration',
    color: '#fbbf24',
    problemDescription: 'Thousands of keys expire at the exact same timestamp (e.g. midnight cron or uniform 1-hour TTL). Sudden mass cache miss floods DB.',
    impactOnDb: 'Database chokes under sudden spike of 50,000 concurrent SQL queries.',
    solutionArchitecture: 'Add Random Jitter (e.g. ±5–15 minutes) to key TTL values so expirations are smoothly distributed over time.',
    codeOrFix: `int randomJitter = ThreadLocalRandom.current().nextInt(300); // 0-5 mins\nredis.set(key, value, Duration.ofSeconds(3600 + randomJitter));`,
  },
  {
    id: 'stampede',
    name: '3. Cache Stampede (Dog-Piling)',
    badge: 'Hot Key Expiration',
    color: '#34d399',
    problemDescription: 'An ultra-popular hot key (e.g. `homepage:banner`) expires. 10,000 concurrent user requests miss cache at once and try to rebuild it in SQL DB.',
    impactOnDb: '10,000 identical expensive SQL queries executed concurrently for the exact same key.',
    solutionArchitecture: 'Solution 1: Distributed Mutex Lock (only 1 thread rebuilds, others wait).\nSolution 2: Probabilistic Early Expiration (XFetch algorithm recalculates key before true TTL).',
    codeOrFix: `if (redis.set(lockKey, "1", NX, EX, 5)) {\n    val = db.fetch();\n    redis.set(key, val, TTL);\n} else { Thread.sleep(50); retry(); }`,
  },
];

export default function RedisInterviewScenariosDiagram(): React.JSX.Element {
  const [selectedScenario, setSelectedScenario] = useState<ProductionScenario>(SCENARIOS[0]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Redis Production Failures: Cache Penetration vs Avalanche vs Stampede
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Scenario Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {SCENARIOS.map((s) => {
            const isSelected = s.id === selectedScenario.id;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedScenario(s)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: isSelected ? `1px solid ${s.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: isSelected ? `${s.color}15` : '#0c0e17',
                  color: isSelected ? '#fff' : 'var(--ifm-color-content-secondary)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 400,
                  fontSize: '12.5px',
                }}
              >
                {s.name}
              </button>
            );
          })}
        </div>

        {/* Selected Scenario Details */}
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', borderLeft: `4px solid ${selectedScenario.color}`, marginBottom: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>{selectedScenario.name}</span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: `${selectedScenario.color}22`, color: selectedScenario.color, fontWeight: 700 }}>
              {selectedScenario.badge}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            {selectedScenario.problemDescription}
          </p>
        </div>

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Production DB Impact
            </div>
            <div style={{ fontSize: '12.5px', color: selectedScenario.color, fontWeight: 700, marginBottom: '10px' }}>
              {selectedScenario.impactOnDb}
            </div>

            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Senior Remediation Strategy
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
              {selectedScenario.solutionArchitecture}
            </div>
          </div>

          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '6px', fontWeight: 600 }}>
              Implementation Code Pattern
            </div>
            <pre style={{ margin: 0, padding: '10px', backgroundColor: '#05070e', borderRadius: '6px', fontSize: '11.5px', fontFamily: 'monospace', color: '#38bdf8', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)', lineHeight: 1.4 }}>
              <code>{selectedScenario.codeOrFix}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
