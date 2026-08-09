import React, { useState } from 'react';

interface DataType {
  id: string;
  name: string;
  badge: string;
  color: string;
  description: string;
  compactEncoding: string;
  rawEncoding: string;
  threshold: string;
  commonCommands: string;
}

const DATA_TYPES: DataType[] = [
  {
    id: 'string',
    name: '1. String',
    badge: 'Binary-Safe (Max 512MB)',
    color: '#38bdf8',
    description: 'The fundamental building block of Redis. Stores text, raw binary, serialized JSON, or integers.',
    compactEncoding: 'int (for 64-bit signed integers) or embstr (embedded SDS for <=44 bytes)',
    rawEncoding: 'raw (Simple Dynamic String - SDS with dynamic buffer capacity)',
    threshold: 'Switches to raw SDS when string length exceeds 44 bytes.',
    commonCommands: `SET key val EX 60\nGET key\nINCRBY key 5\nMGET k1 k2 k3`,
  },
  {
    id: 'hash',
    name: '2. Hash',
    badge: 'Field-Value Map',
    color: '#34d399',
    description: 'Maps field names to string values. Perfect for representing objects (e.g. User, Order) without JSON serialization overhead.',
    compactEncoding: 'listpack / ziplist (contiguous memory array with zero pointer overhead)',
    rawEncoding: 'hashtable (dict with murmurhash2 & incremental rehashing)',
    threshold: 'Switches to hashtable when fields >128 OR any field value >64 bytes.',
    commonCommands: `HSET user:100 name "Alice" email "a@test.com"\nHGET user:100 email\nHGETALL user:100`,
  },
  {
    id: 'list',
    name: '3. List',
    badge: 'Doubly-Linked Sequence',
    color: '#fbbf24',
    description: 'Ordered sequence of strings. Supports O(1) push and pop from both head and tail (deque).',
    compactEncoding: 'listpack (for small lists)',
    rawEncoding: 'quicklist (doubly-linked list of listpack nodes)',
    threshold: 'Switches node size when elements >128 OR element >64 bytes.',
    commonCommands: `LPUSH queue "job1"\nRPOP queue\nLRANGE queue 0 9`,
  },
  {
    id: 'set',
    name: '4. Set',
    badge: 'Unordered Unique Collection',
    color: '#a78bfa',
    description: 'Unordered collection of unique strings. Supports set operations (Intersection, Union, Difference) in O(N).',
    compactEncoding: 'intset (compact sorted array of 16/32/64-bit integers)',
    rawEncoding: 'hashtable (keys are set members, values are NULL)',
    threshold: 'Switches to hashtable when elements >512 OR any element is non-integer.',
    commonCommands: `SADD tags "java" "redis"\nSISMEMBER tags "redis"\nSINTER set1 set2`,
  },
  {
    id: 'zset',
    name: '5. Sorted Set (ZSet)',
    badge: 'Scored Priority Ranking',
    color: '#c084fc',
    description: 'Unique string members sorted by floating-point score. Enables high-speed leaderboards and range queries.',
    compactEncoding: 'listpack (elements & scores stored sequentially)',
    rawEncoding: 'skiplist + hashtable (O(log N) insert/search + O(1) score lookup)',
    threshold: 'Switches to skiplist when elements >128 OR element >64 bytes.',
    commonCommands: `ZADD leaderboard 100 "player1"\nZRANGE leaderboard 0 9 WITHSCORES\nZREMRANGEBYSCORE leaderboard -inf 50`,
  },
  {
    id: 'hll',
    name: '6. HyperLogLog (HLL)',
    badge: 'Probabilistic Cardinality',
    color: '#f87171',
    description: 'Estimates unique cardinality of billions of items with 0.81% standard error using a fixed 12 KB memory footprint.',
    compactEncoding: 'Dense / Sparse bit array (fixed 12,288 bytes)',
    rawEncoding: 'Fixed 12 KB memory structure regardless of millions of unique items',
    threshold: 'Constant 12 KB memory usage whether counting 10 or 100,000,000 unique items.',
    commonCommands: `PFADD uv:2026-07-31 "user_101"\nPFCOUNT uv:2026-07-31`,
  },
];

export default function RedisDataTypesDiagram(): React.JSX.Element {
  const [selectedType, setSelectedType] = useState<DataType>(DATA_TYPES[1]); // Default to Hash

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Redis Data Structures & Internal Memory Encodings Inspector
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Type Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {DATA_TYPES.map((dt) => {
            const isSelected = dt.id === selectedType.id;
            return (
              <button
                key={dt.id}
                onClick={() => setSelectedType(dt)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: isSelected ? `1px solid ${dt.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: isSelected ? `${dt.color}15` : '#0c0e17',
                  color: isSelected ? '#fff' : 'var(--ifm-color-content-secondary)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 400,
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{dt.name}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Data Type Summary Card */}
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', borderLeft: `4px solid ${selectedType.color}`, marginBottom: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>{selectedType.name}</span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: `${selectedType.color}22`, color: selectedType.color, fontWeight: 700 }}>
              {selectedType.badge}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            {selectedType.description}
          </p>
        </div>

        {/* Encodings & Commands Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Small Memory Encoding (Compact)
            </div>
            <div style={{ fontSize: '12.5px', color: selectedType.color, fontWeight: 600, marginBottom: '10px' }}>
              {selectedType.compactEncoding}
            </div>

            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Large Memory Encoding (Raw)
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', fontWeight: 600, marginBottom: '10px' }}>
              {selectedType.rawEncoding}
            </div>

            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Encoding Switch Threshold
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
              {selectedType.threshold}
            </div>
          </div>

          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '6px', fontWeight: 600 }}>
              Common CLI Commands
            </div>
            <pre style={{ margin: 0, padding: '10px', backgroundColor: '#05070e', borderRadius: '6px', fontSize: '11.5px', fontFamily: 'monospace', color: '#38bdf8', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)', lineHeight: 1.5 }}>
              <code>{selectedType.commonCommands}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
