import React, { useState } from 'react';

interface Pattern {
  id: string;
  name: string;
  badge: string;
  color: string;
  summary: string;
  whoWrites: string;
  steps: string[];
  readWriteRatio: string;
  pros: string[];
  cons: string[];
  idealFor: string;
  avoidFor: string;
  codeSnippet: string;
}

const PATTERNS: Pattern[] = [
  {
    id: 'cache-aside',
    name: '1. Cache-Aside (Lazy Loading)',
    badge: 'Most Popular (Read-Heavy)',
    color: '#34d399',
    summary: 'Application directly manages cache. Reads check cache first; on a miss, app queries the database and writes data back into cache.',
    whoWrites: 'Application process writes to cache lazily upon reading missing data.',
    steps: [
      'App checks Cache for Key.',
      'HIT: Return cached data immediately to client.',
      'MISS: Query SQL Database for record.',
      'App writes record to Cache (with TTL) for future reads.',
      'Return data to caller.'
    ],
    readWriteRatio: 'Read-Heavy (90% Reads / 10% Writes)',
    pros: [
      'Resilient — Cache failure degrades to DB queries without breaking app',
      'Memory efficient — Only requested data populates cache'
    ],
    cons: [
      '3-hop latency penalty on cache miss (Cache -> DB -> Cache write)',
      'Cold start latency; initial reads are always slow'
    ],
    idealFor: 'User profiles, catalog browsing, article content.',
    avoidFor: 'Write-heavy data, strict zero-stale consistency requirements.',
    codeSnippet: `User user = redisTemplate.get("user:" + id);
if (user == null) {
    user = userRepo.findById(id); // DB lookup
    redisTemplate.set("user:" + id, user, Duration.ofMinutes(30));
}`
  },
  {
    id: 'read-through',
    name: '2. Read-Through',
    badge: 'Abstracted Cache Loader',
    color: '#a78bfa',
    summary: 'Application interacts strictly with the Cache provider abstraction. On a miss, the cache provider itself loads data from DB transparently.',
    whoWrites: 'Cache Provider / Data Loader module populates cache automatically.',
    steps: [
      'App requests Key from Cache Provider.',
      'Cache Provider checks internal store.',
      'MISS: Cache Provider executes DB query on behalf of App.',
      'Cache Provider stores result in Cache and returns to App.'
    ],
    readWriteRatio: 'Read-Heavy with abstracted data access layers',
    pros: [
      'Clean application code — DB fallback logic is encapsulated',
      'Request coalescing — Cache loader prevents thundering herd'
    ],
    cons: [
      'Requires framework/provider support (e.g., Caffeine LoadingCache)',
      'Cache acts as Single Point of Failure (SPOF) if provider crashes'
    ],
    idealFor: 'Microservices with central data loader abstractions.',
    avoidFor: 'Complex multi-table queries that do not map to simple keys.',
    codeSnippet: `// Caffeine LoadingCache
LoadingCache<String, User> cache = Caffeine.newBuilder()
    .build(key -> userRepo.findById(key)); // Central loader
User user = cache.get(userId); // App never calls DB directly`
  },
  {
    id: 'write-through',
    name: '3. Write-Through',
    badge: 'Synchronous Consistency',
    color: '#38bdf8',
    summary: 'Every write updates BOTH Cache and Database synchronously before returning OK to client. Cache is never stale.',
    whoWrites: 'Application/Cache layer writes to Cache AND DB synchronously on every write.',
    steps: [
      'App sends Write Request to Cache Provider.',
      'Cache Provider writes update to SQL Database.',
      'Cache Provider writes update to Cache store.',
      'Returns success status to Client.'
    ],
    readWriteRatio: 'Balanced Read/Write with zero stale tolerance',
    pros: [
      'Cache is strictly synchronized with DB — No invalidation code needed',
      'Next read after write is guaranteed cache HIT'
    ],
    cons: [
      'Higher write latency (must wait for double write: Cache + DB)',
      'Cache pollution — populates data that may never be read again'
    ],
    idealFor: 'Financial ledgers, inventory counts, user status.',
    avoidFor: 'High-frequency write streams, logging, telemetry.',
    codeSnippet: `@Transactional
public void updateUser(User user) {
    userRepo.save(user); // DB write
    redisTemplate.set("user:" + user.getId(), user); // Sync Cache write
}`
  },
  {
    id: 'write-behind',
    name: '4. Write-Behind (Write-Back)',
    badge: 'Ultra Fast (Data Loss Risk!)',
    color: '#f87171',
    summary: 'Write updates Cache instantly and returns OK. A background worker flushes batched writes to DB asynchronously later.',
    whoWrites: 'Background worker/flusher flushes queued cache updates to DB asynchronously.',
    steps: [
      'App writes update to Cache (returns <1ms response).',
      'Write event pushed to async Queue / Stream.',
      'Background worker batches queued updates.',
      'Worker executes bulk SQL batch update to DB.'
    ],
    readWriteRatio: 'Write-Heavy (90% Writes / 10% Reads)',
    pros: [
      'Maximum write performance (<1ms write response)',
      'Absorbs DB write surges by coalescing 100 updates into 1 SQL batch'
    ],
    cons: [
      'PERMANENT DATA LOSS RISK if cache node crashes before flush',
      'Eventual consistency between Cache and Database'
    ],
    idealFor: 'Page view counters, game scoreboards, video stream progress.',
    avoidFor: 'Bank account balances, payment checkouts, security audits.',
    codeSnippet: `// Write to Redis instantly
redisTemplate.opsForValue().increment("article:views:" + id);
// Async worker flushes aggregated totals to MySQL every 10 seconds`
  },
  {
    id: 'write-around',
    name: '5. Write-Around',
    badge: 'Zero RAM Waste (Combo Standard)',
    color: '#2dd4bf',
    summary: 'Writes go straight to the Database, completely bypassing the Cache. Data is loaded into Cache only when requested by a read.',
    whoWrites: 'Cache is NOT written on mutation; populated later by Cache-Aside reads.',
    steps: [
      'App writes updated record directly to SQL Database.',
      'Cache is completely bypassed (no write to Cache).',
      'Subsequent read request triggers Cache Miss.',
      'Cache-Aside populates Cache for future reads.'
    ],
    readWriteRatio: 'Write-heavy or write-once-read-rarely data',
    pros: [
      'Prevents Cache RAM pollution from write-once data',
      'Saves cache storage and network bandwidth on updates'
    ],
    cons: [
      'First read immediately following a write is guaranteed Cache Miss',
      'Higher latency for recently modified entities'
    ],
    idealFor: 'Log archives, user blog posts, document uploads (paired with Cache-Aside).',
    avoidFor: 'Entities that are read immediately after being created/updated.',
    codeSnippet: `// Write directly to DB, bypass Redis
userRepo.save(user); 
// Next read will hit Cache-Aside to load into Redis lazily`
  },
  {
    id: 'refresh-ahead',
    name: '6. Refresh-Ahead',
    badge: 'Predictive Proactive',
    color: '#fbbf24',
    summary: 'Background worker predicts which hot keys are expiring and proactively refreshes them from DB before TTL expires.',
    whoWrites: 'Background worker process based on key access probability analytics.',
    steps: [
      'Worker monitors hot key access rates & TTL countdown.',
      'Before TTL expires (e.g. at 85% expiration mark), worker triggers DB reload.',
      'New value written to Cache silently.',
      'Client reads experience 0ms cache miss penalty.'
    ],
    readWriteRatio: 'Predictable high-concurrency hot keys',
    pros: [
      'Eliminates cache misses and cold-start latency for hot keys',
      'Prevents Cache Stampede / Thundering Herd'
    ],
    cons: [
      'Wasted DB resources if access prediction is wrong',
      'Complex prediction logic and worker maintenance'
    ],
    idealFor: 'Trending news feeds, flash sale product pages, top 100 leaderboards.',
    avoidFor: 'Unpredictable tail keys with low read frequency.',
    codeSnippet: `@Scheduled(fixedRate = 55000) // Every 55s for 60s TTL
public void refreshHotFeed() {
    List<Feed> trending = feedRepo.findTopTrending();
    redisTemplate.set("feed:trending", trending, Duration.ofSeconds(60));
}`
  }
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
          The 6 Architectural Caching Patterns Explorer
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
                  padding: '7px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '11px',
                  background: isSelected ? `${pt.color}18` : 'rgba(255, 255, 255, 0.04)',
                  color: isSelected ? pt.color : 'var(--ifm-color-content-secondary)',
                  boxShadow: isSelected ? `0 0 0 1.5px ${pt.color}` : '0 0 0 1px rgba(255, 255, 255, 0.08)',
                  transition: 'all 0.15s ease'
                }}
              >
                {pt.name}
              </button>
            );
          })}
        </div>

        {/* Pattern Summary Card */}
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.02)',
          padding: '14px',
          borderRadius: '8px',
          borderLeft: `4px solid ${selectedPattern.color}`,
          marginBottom: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          borderRight: '1px solid rgba(255, 255, 255, 0.06)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontWeight: 800, fontSize: '14px', color: selectedPattern.color }}>{selectedPattern.name}</span>
            <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '4px', backgroundColor: `${selectedPattern.color}20`, color: selectedPattern.color, fontWeight: 700 }}>
              {selectedPattern.badge}
            </span>
          </div>

          <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            {selectedPattern.summary}
          </p>

          <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: '4px' }}>
            <strong>Who Writes & When:</strong> {selectedPattern.whoWrites}
          </div>
        </div>

        {/* Layout Grid */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media (max-width: 768px) {
            .cp-grid-split {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        <div className="cp-grid-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Left: Steps & Fit */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Execution Sequence */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: selectedPattern.color, marginBottom: '8px', fontWeight: 800 }}>
                Execution Flow Sequence
              </div>
              <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.6' }}>
                {selectedPattern.steps.map((st, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>{st}</li>
                ))}
              </ol>
            </div>

            {/* When to use vs avoid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.2)', padding: '10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>Ideal For</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)' }}>{selectedPattern.idealFor}</div>
              </div>
              <div style={{ background: 'rgba(248, 113, 113, 0.08)', border: '1px solid rgba(248, 113, 113, 0.2)', padding: '10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#f87171', textTransform: 'uppercase', marginBottom: '4px' }}>Avoid For</div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)' }}>{selectedPattern.avoidFor}</div>
              </div>
            </div>
          </div>

          {/* Right: Pros/Cons & Code */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Pros and Cons */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase' }}>Key Advantages</div>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
                  {selectedPattern.pros.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#f87171', textTransform: 'uppercase' }}>Trade-Offs & Costs</div>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: '1.5' }}>
                  {selectedPattern.cons.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Code snippet */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '6px', fontWeight: 700 }}>
                Code Pattern Implementation
              </div>
              <pre style={{ margin: 0, padding: '10px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace', color: '#38bdf8', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
                <code>{selectedPattern.codeSnippet}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
