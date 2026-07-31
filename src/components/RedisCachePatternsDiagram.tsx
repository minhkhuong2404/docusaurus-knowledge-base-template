import React, { useState } from 'react';

interface Pattern {
  id: string;
  name: string;
  badge: string;
  color: string;
  summary: string;
  steps: string[];
  readWriteRatio: string;
  pros: string[];
  cons: string[];
  codeSnippet: string;
}

const PATTERNS: Pattern[] = [
  {
    id: 'cache-aside',
    name: '1. Cache-Aside (Lazy Loading)',
    badge: 'Most Common',
    color: '#34d399',
    summary: 'Application manages both cache and database directly. Cache is populated lazily only when a read request misses.',
    steps: [
      'App checks Redis Cache for Key.',
      'HIT: Return data immediately from Redis.',
      'MISS: Read record from SQL Database.',
      'App writes record to Redis Cache (with TTL) for future requests.',
      'Return record to caller.',
    ],
    readWriteRatio: 'Read-heavy workloads (90% read / 10% write).',
    pros: [
      'Resilient — cache failure does not break DB writes',
      'Lazy loading — only requested data is cached (memory efficient)',
    ],
    cons: [
      'Initial cache miss penalty (higher latency on first read)',
      'Potential stale data if DB is updated without cache invalidation',
    ],
    codeSnippet: `User user = redisTemplate.get(userId);
if (user == null) {
    user = userRepo.findById(userId);
    redisTemplate.set(userId, user, Duration.ofMinutes(30));
}`,
  },
  {
    id: 'write-through',
    name: '2. Write-Through',
    badge: 'Synchronous Consistency',
    color: '#38bdf8',
    summary: 'Application writes to Cache layer first; Cache synchronously updates Database before acknowledging write to client.',
    steps: [
      'App initiates write to Cache Service.',
      'Cache Service synchronously updates SQL Database.',
      'Cache Service updates Redis Cache.',
      'Acknowledge successful write back to Application.',
    ],
    readWriteRatio: 'Strict consistency read/write workloads.',
    pros: [
      'Cache is never stale — always synchronized with DB',
      'No cache miss penalty on subsequent reads',
    ],
    cons: [
      'Higher write latency (must write to both Cache and DB synchronously)',
      'Infrequently read data still populates cache (wasted RAM)',
    ],
    codeSnippet: `cacheProvider.writeThrough(userId, updatedUserData); 
// Cache provider handles DB update + Cache set in single call`,
  },
  {
    id: 'write-behind',
    name: '3. Write-Behind (Write-Back)',
    badge: 'Ultra High Write Speed',
    color: '#fbbf24',
    summary: 'Application writes to Redis instantly and returns. An asynchronous queue flushes writes to DB in batches in the background.',
    steps: [
      'App writes to Redis (instant <1ms response).',
      'Write event pushed to Redis Stream / Queue.',
      'Background worker process consumes queue.',
      'Batch inserts/updates executed against SQL Database.',
    ],
    readWriteRatio: 'Write-heavy workloads (analytics, page views, clickstreams).',
    pros: [
      'Lightning-fast write throughput (<1ms latency)',
      'Absorbs DB write spikes & reduces IOPS pressure',
    ],
    cons: [
      'Risk of data loss if Redis crashes before async background flush',
      'Eventual consistency between Cache and Database',
    ],
    codeSnippet: `redisTemplate.opsForValue().set(key, value); // Instant response
queue.push(writeEvent); // Async batch flusher writes DB every 5s`,
  },
  {
    id: 'read-through',
    name: '4. Read-Through',
    badge: 'Transparent Cache Wrapper',
    color: '#a78bfa',
    summary: 'Application interacts solely with the Cache provider abstraction. Cache transparently loads missing data from DB.',
    steps: [
      'App asks Cache Provider for Key.',
      'Cache Provider checks internal Redis.',
      'If missing, Cache Provider queries SQL DB directly.',
      'Cache Provider populates Redis and returns data to App.',
    ],
    readWriteRatio: 'Read-heavy workloads with abstracted data access layers.',
    pros: [
      'Clean application code — app doesn\'t handle DB fallback',
      'Cache provider handles lock coalescing (protects DB from stampedes)',
    ],
    cons: [
      'Requires supporting Cache Provider framework (e.g. Ehcache / Guava Cache Loader)',
      'Initial miss latency penalty still applies',
    ],
    codeSnippet: `@Cacheable(value = "users", key = "#id") // Spring Cache abstracts DB query
public User getUserById(Long id) {
    return userRepo.findById(id);
}`,
  },
];

export default function RedisCachePatternsDiagram(): React.JSX.Element {
  const [selectedPattern, setSelectedPattern] = useState<Pattern>(PATTERNS[0]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3"/>
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Distributed Caching Patterns & Execution Topology Explorer
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Pattern Selection Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {PATTERNS.map((pt) => {
            const isSelected = pt.id === selectedPattern.id;
            return (
              <button
                key={pt.id}
                onClick={() => setSelectedPattern(pt)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: isSelected ? `1px solid ${pt.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: isSelected ? `${pt.color}15` : '#0c0e17',
                  color: isSelected ? '#fff' : 'var(--ifm-color-content-secondary)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 400,
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{pt.name}</span>
              </button>
            );
          })}
        </div>

        {/* Pattern Summary Card */}
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', borderLeft: `4px solid ${selectedPattern.color}`, marginBottom: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>{selectedPattern.name}</span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: `${selectedPattern.color}22`, color: selectedPattern.color, fontWeight: 700 }}>
              {selectedPattern.badge}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            {selectedPattern.summary}
          </p>
        </div>

        {/* Flow Steps & Code Comparison */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Left: Execution Flow Steps */}
          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '8px', fontWeight: 600 }}>
              Execution Flow Sequence
            </div>
            <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.6 }}>
              {selectedPattern.steps.map((st, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>{st}</li>
              ))}
            </ol>
          </div>

          {/* Right: Pros/Cons & Code */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                Code Pattern Example
              </div>
              <pre style={{ margin: 0, padding: '8px', backgroundColor: '#05070e', borderRadius: '6px', fontSize: '11.5px', fontFamily: 'monospace', color: '#38bdf8', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
                <code>{selectedPattern.codeSnippet}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
