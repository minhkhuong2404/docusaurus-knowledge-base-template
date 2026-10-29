import React, { useState } from 'react';

interface Scenario {
  id: string;
  label: string;
  color: string;
  incoming: string;
  redisState: string;
  verdict: string;
  action: string;
  detail: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'new',
    label: 'New record',
    color: '#34d399',
    incoming: 'orders-3 @ offset 105 (key=A)',
    redisState: 'lastOffset=104, partition=3',
    verdict: 'APPLY',
    action: 'Update state + set lastOffset=105 atomically (Lua), forward downstream',
    detail: 'Offset is greater than the fence for this key and the partition matches. A gap larger than 1 is only a metric, because transaction markers and compaction leave legitimate holes in offsets.',
  },
  {
    id: 'dup',
    label: 'Replay (older)',
    color: '#fbbf24',
    incoming: 'orders-3 @ offset 101 (key=A)',
    redisState: 'lastOffset=104, partition=3',
    verdict: 'SKIP',
    action: 'Ignore: state already contains this effect. Do not forward again',
    detail: 'After a rebalance or crash the consumer resumes from the last committed offset, which can be behind Redis. The fence makes the replay idempotent (effectively-once on top of at-least-once).',
  },
  {
    id: 'equal',
    label: 'Replay (equal)',
    color: '#38bdf8',
    incoming: 'orders-3 @ offset 104 (key=A)',
    redisState: 'lastOffset=104, partition=3',
    verdict: 'RE-EMIT',
    action: 'Do not mutate state. Rebuild the output from stored state and forward it again',
    detail: 'Crash window: Redis was written but the downstream produce was not flushed. If equal offsets were skipped, the output message would be lost forever. Equal means re-emit, lower means skip.',
  },
  {
    id: 'part',
    label: 'Partition moved',
    color: '#a78bfa',
    incoming: 'orders-7 @ offset 12 (key=A)',
    redisState: 'lastOffset=104, partition=3',
    verdict: 'REBASE',
    action: 'Offsets are incomparable. Accept, reset fence to (partition=7, offset=12), raise an alert',
    detail: 'The same key arrived from a different partition (topic repartitioned or upstream changed partitioner). Offsets only order records inside one partition, so comparing 12 with 104 would wrongly drop real data.',
  },
  {
    id: 'bad',
    label: 'Wrong partition',
    color: '#f87171',
    incoming: 'orders-2 @ offset 9 (key=A, expected 3)',
    redisState: 'murmur2(A) mod 8 = 3',
    verdict: 'DLQ',
    action: 'Reject to dead-letter topic: co-partitioning contract broken',
    detail: 'The record landed on a partition that does not match murmur2(key) modulo partition count. State for this key would be split across tasks. Quarantine instead of silently corrupting state.',
  },
  {
    id: 'zombie',
    label: 'Zombie task',
    color: '#f97316',
    incoming: 'epoch=4 write after rebalance',
    redisState: 'assignmentEpoch=5',
    verdict: 'FENCE',
    action: 'Reject write: caller epoch is lower than the current partition epoch',
    detail: 'A stalled instance wakes up after losing its partition. Without an epoch check it would overwrite fresher state written by the new owner. The epoch is bumped with INCR on every assignment.',
  },
];

export default function KafkaRedisOffsetFenceDiagram(): React.JSX.Element {
  const [active, setActive] = useState<string>('new');
  const s = SCENARIOS.find((x) => x.id === active) ?? SCENARIOS[0];
  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <style>{'@media (max-width: 768px) { .kr-fence-tabs { flex-wrap: wrap; } }'}</style>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          Offset + Partition Fence in Redis (pick a scenario)
        </h3>
      </div>
      <div className="kr-fence-tabs" style={{ display: 'flex', gap: 6, padding: '8px 12px' }}>
        {SCENARIOS.map((x) => (
          <button
            key={x.id}
            onClick={() => setActive(x.id)}
            style={{
              cursor: 'pointer',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 6,
              background: x.id === active ? 'rgba(255,255,255,0.08)' : '#0d0f1e',
              color: x.color,
              border: `1px solid ${x.color}`,
            }}
          >
            {x.label}
          </button>
        ))}
      </div>
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 150" className="interactive-diagram-svg">
          <defs>
            <marker id="krf-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 2 L 8 5 L 0 8 z" fill="context-stroke" />
            </marker>
          </defs>
          <rect x="10" y="40" width="190" height="70" rx="8" fill="#0d0f1e" stroke="#38bdf8" strokeWidth="1.4" />
          <text x="105" y="62" style={{ fontSize: 11, fontWeight: 700, fill: '#38bdf8', textAnchor: 'middle' }}>Kafka record</text>
          <text x="105" y="84" style={{ fontSize: 9, fill: '#e2e8f0', textAnchor: 'middle' }}>{s.incoming}</text>
          <path className="interactive-diagram-flowing-path" d="M 206 75 L 252 75" stroke="#38bdf8" strokeWidth="2" fill="none" markerEnd="url(#krf-arr)" />
          <rect x="258" y="40" width="190" height="70" rx="8" fill="#0d0f1e" stroke="#f87171" strokeWidth="1.4" />
          <text x="353" y="62" style={{ fontSize: 11, fontWeight: 700, fill: '#f87171', textAnchor: 'middle' }}>Redis Lua fence</text>
          <text x="353" y="84" style={{ fontSize: 9, fill: '#e2e8f0', textAnchor: 'middle' }}>{s.redisState}</text>
          <path className="interactive-diagram-flowing-path" d="M 454 75 L 500 75" stroke={s.color} strokeWidth="2" fill="none" markerEnd="url(#krf-arr)" />
          <rect x="506" y="40" width="160" height="70" rx="8" fill="rgba(255,255,255,0.05)" stroke={s.color} strokeWidth="2.2" />
          <text x="586" y="70" style={{ fontSize: 14, fontWeight: 800, fill: s.color, textAnchor: 'middle' }}>{s.verdict}</text>
          <text x="586" y="90" style={{ fontSize: 8.5, fill: '#94a3b8', textAnchor: 'middle' }}>verdict</text>
        </svg>
      </div>
      <div className="interactive-diagram-details-card" style={{ margin: 0, borderTop: 0, borderRadius: '0 0 6px 6px' }}>
        <p style={{ margin: '0 0 6px', fontSize: '0.82rem', color: s.color, fontWeight: 700 }}>{s.verdict}: {s.action}</p>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>{s.detail}</p>
      </div>
    </div>
  );
}
