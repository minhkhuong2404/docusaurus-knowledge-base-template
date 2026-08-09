import React, { useState } from 'react';

interface LockStep {
  id: number;
  title: string;
  badge: string;
  color: string;
  description: string;
  luaOrCode: string;
}

const LOCK_STEPS: LockStep[] = [
  {
    id: 1,
    title: '1. Atomic Acquisition (SET NX PX)',
    badge: 'Acquisition',
    color: '#38bdf8',
    description: 'Client attempts to acquire lock using a unique random UUID. SET NX PX ensures atomic check-and-set with automatic key expiration.',
    luaOrCode: `SET lock:order:100 "uuid-client-a-9821" NX PX 30000`,
  },
  {
    id: 2,
    title: '2. Redlock Multi-Node Consensus',
    badge: 'Consensus',
    color: '#a78bfa',
    description: 'For high availability without single-master dependency, client acquires lock on N/2 + 1 (3 out of 5) independent master nodes within total timeout.',
    luaOrCode: `Nodes 1, 2, 3: ✅ OK (Acquired in 4ms)
Nodes 4, 5: ⏳ Timeout
Result: 3/5 Majority Quorum Achieved -> Lock Acquired!`,
  },
  {
    id: 3,
    title: '3. Redisson Watchdog (Lock Renewal)',
    badge: 'TTL Watchdog',
    color: '#fbbf24',
    description: 'A background Watchdog thread periodically extends the lock TTL (every 10s for 30s lock) so long-running operations don\'t lose lock prematurely.',
    luaOrCode: `// Watchdog timer fires every 10s:
if (lockHeldByCurrentThread) {
    redis.call('pexpire', lockKey, 30000);
}`,
  },
  {
    id: 4,
    title: '4. Fencing Token Validation',
    badge: 'Fencing Guard',
    color: '#34d399',
    description: 'Database inspects auto-incrementing fencing token (e.g. token=42) to reject writes from clients experiencing garbage collection pauses.',
    luaOrCode: `UPDATE orders SET status = 'PAID', fencing_token = 42 
WHERE id = 100 AND fencing_token < 42;`,
  },
  {
    id: 5,
    title: '5. Safe Atomic Release (Lua Script)',
    badge: 'Safe Release',
    color: '#f87171',
    description: 'Client releases lock using Lua script to verify UUID ownership before deletion. Prevents Client A from accidentally deleting Client B\'s lock.',
    luaOrCode: `if redis.call('get', KEYS[1]) == ARGV[1] then
    return redis.call('del', KEYS[1])
else
    return 0
end`,
  },
];

export default function RedisDistributedLockDiagram(): React.JSX.Element {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const activeStep = LOCK_STEPS[activeStepIndex];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Redis Distributed Lock (Redlock & Redisson Watchdog Protocol)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Step Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {LOCK_STEPS.map((st, idx) => {
            const isSelected = idx === activeStepIndex;
            return (
              <button
                key={st.id}
                onClick={() => setActiveStepIndex(idx)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: isSelected ? `1px solid ${st.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: isSelected ? `${st.color}18` : '#0c0e17',
                  color: isSelected ? '#fff' : 'var(--ifm-color-content-secondary)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 400,
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{st.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Step Details */}
        <div style={{ backgroundColor: '#0c0e17', padding: '16px', borderRadius: '10px', border: `1px solid ${activeStep.color}44`, marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: activeStep.color }}>
              {activeStep.title}
            </span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: `${activeStep.color}22`, color: activeStep.color, fontWeight: 700 }}>
              {activeStep.badge}
            </span>
          </div>

          <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            {activeStep.description}
          </p>

          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
            Redis Command / Implementation Pattern
          </div>
          <pre style={{ margin: 0, padding: '10px', backgroundColor: '#05070e', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.05)', overflowX: 'auto' }}>
            <code>{activeStep.luaOrCode}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
