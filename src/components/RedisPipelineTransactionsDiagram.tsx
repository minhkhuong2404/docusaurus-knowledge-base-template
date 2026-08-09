import React, { useState } from 'react';

interface ExecutionMode {
  id: string;
  name: string;
  badge: string;
  color: string;
  rttCount: string;
  atomicity: string;
  description: string;
  codePattern: string;
}

const MODES: ExecutionMode[] = [
  {
    id: 'sequential',
    name: '1. Sequential Calls',
    badge: '10 RTTs (Slow)',
    color: '#f87171',
    rttCount: 'N Round-Trip Times (10 commands = 10 RTTs = ~5ms network overhead)',
    atomicity: 'Non-atomic — other client commands can interleave between every call.',
    description: 'Each command sends a separate TCP packet, waits for server response, then sends the next. Network latency dominates execution time.',
    codePattern: `redis.set("a", "1"); // RTT #1\nredis.set("b", "2"); // RTT #2\nredis.set("c", "3"); // RTT #3`,
  },
  {
    id: 'pipelining',
    name: '2. Pipelining',
    badge: '1 RTT (Batching)',
    color: '#38bdf8',
    rttCount: '1 Round-Trip Time (10 commands batched into 1 TCP packet = ~0.5ms)',
    atomicity: 'Non-atomic on server side — commands execute fast but other clients CAN interleave between commands in the batch.',
    description: 'Client buffers N commands locally, writes them in one TCP payload, and reads all responses in one go. Drastically reduces network latency.',
    codePattern: `redisTemplate.executePipelined((RedisCallback<Object>) conn -> {\n    conn.set("a".getBytes(), "1".getBytes());\n    conn.set("b".getBytes(), "2".getBytes());\n    return null;\n});`,
  },
  {
    id: 'transactions',
    name: '3. MULTI / EXEC (Transactions)',
    badge: 'Queued Execution',
    color: '#fbbf24',
    rttCount: '1 RTT for DISCARD/EXEC; 1 RTT per queued command unless combined with Pipelining.',
    atomicity: 'Isolated block execution — commands inside MULTI/EXEC are executed sequentially without interleaving, BUT NO ROLLBACK occurs if individual commands fail.',
    description: 'Queues commands on server until EXEC is called. Use WATCH for optimistic concurrency control (check-and-set).',
    codePattern: `redis.watch("account:A");\nredis.multi();\nredis.debit("account:A", 100);\nredis.credit("account:B", 100);\nList<Object> results = redis.exec(); // Returns null if WATCH key changed!`,
  },
  {
    id: 'lua-script',
    name: '4. Lua Scripts / Redis Functions',
    badge: 'Server-Side Atomic',
    color: '#34d399',
    rttCount: '1 Round-Trip Time (Script sent to server, all logic runs directly in RAM).',
    atomicity: '100% Fully Atomic — entire script executes as a single unbroken atomic operation. Zero interleaving possible.',
    description: 'Sends Lua code to Redis. Eliminates client-server round-trips for conditional logic (e.g. read -> check -> compute -> write).',
    codePattern: `String lua = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";\nredis.eval(lua, 1, "lockKey", "uuid123");`,
  },
];

export default function RedisPipelineTransactionsDiagram(): React.JSX.Element {
  const [selectedMode, setSelectedMode] = useState<ExecutionMode>(MODES[1]); // Default to Pipelining

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="12" x2="2" y2="12"/>
          <path d="M5 12l6 6M5 12l6-6"/>
          <path d="M19 12l-6 6M19 12l-6-6"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Redis Execution Pathways: Pipelining vs MULTI/EXEC vs Lua Scripts
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Mode Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {MODES.map((m) => {
            const isSelected = m.id === selectedMode.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMode(m)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: isSelected ? `1px solid ${m.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: isSelected ? `${m.color}15` : '#0c0e17',
                  color: isSelected ? '#fff' : 'var(--ifm-color-content-secondary)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 400,
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{m.name}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Mode Summary Card */}
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', borderLeft: `4px solid ${selectedMode.color}`, marginBottom: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>{selectedMode.name}</span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: `${selectedMode.color}22`, color: selectedMode.color, fontWeight: 700 }}>
              {selectedMode.badge}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            {selectedMode.description}
          </p>
        </div>

        {/* Technical Comparisons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Network Round-Trip Overhead (RTT)
            </div>
            <div style={{ fontSize: '12.5px', color: selectedMode.color, fontWeight: 700, marginBottom: '12px' }}>
              {selectedMode.rttCount}
            </div>

            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Atomicity Guarantee
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
              {selectedMode.atomicity}
            </div>
          </div>

          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '6px', fontWeight: 600 }}>
              Code Implementation Pattern
            </div>
            <pre style={{ margin: 0, padding: '8px', backgroundColor: '#05070e', borderRadius: '6px', fontSize: '11.5px', fontFamily: 'monospace', color: '#38bdf8', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
              <code>{selectedMode.codePattern}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
