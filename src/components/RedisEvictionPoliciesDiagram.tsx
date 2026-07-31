import React, { useState } from 'react';

interface Policy {
  id: string;
  name: string;
  badge: string;
  color: string;
  description: string;
  algorithm: string;
  bestFor: string;
}

const POLICIES: Policy[] = [
  {
    id: 'noeviction',
    name: 'noeviction (Default)',
    badge: 'OOM Error',
    color: '#f87171',
    description: 'Returns an OOM command error when maxmemory is reached for commands that allocate memory (SET, HSET). Reads (GET) continue working.',
    algorithm: 'No keys evicted. Out-of-memory error returned.',
    bestFor: 'Using Redis as an authoritative primary database where data loss is unacceptable.',
  },
  {
    id: 'allkeys-lru',
    name: 'allkeys-lru',
    badge: 'Least Recently Used',
    color: '#34d399',
    description: 'Evicts the least recently used (LRU) keys across the entire keyspace regardless of TTL.',
    algorithm: 'Approximated LRU — samples 5 keys randomly and evicts the one with oldest idle time.',
    bestFor: 'General-purpose caching (power-law traffic distribution where popular keys are read frequently).',
  },
  {
    id: 'volatile-lru',
    name: 'volatile-lru',
    badge: 'LRU + TTL Only',
    color: '#38bdf8',
    description: 'Evicts the least recently used keys ONLY among keys that have an explicit TTL set.',
    algorithm: 'Approximated LRU on keys with TTL set.',
    bestFor: 'Mixed deployments where some keys are permanent configuration and others are temporary cache entries.',
  },
  {
    id: 'allkeys-lfu',
    name: 'allkeys-lfu',
    badge: 'Least Frequently Used',
    color: '#a78bfa',
    description: 'Evicts the least frequently used (LFU) keys across the entire keyspace using access frequency counter.',
    algorithm: 'Logarithmic 8-bit access counter + decay frequency.',
    bestFor: 'Workloads where historical frequency matters more than recency (avoids cache pollution from rare bursty scans).',
  },
  {
    id: 'volatile-lfu',
    name: 'volatile-lfu',
    badge: 'LFU + TTL Only',
    color: '#c084fc',
    description: 'Evicts the least frequently used keys ONLY among keys with an explicit TTL set.',
    algorithm: 'Logarithmic frequency counter on TTL keys.',
    bestFor: 'Frequency-based eviction for temporary cache entries while preserving permanent keys.',
  },
  {
    id: 'volatile-ttl',
    name: 'volatile-ttl',
    badge: 'Shortest TTL First',
    color: '#fbbf24',
    description: 'Evicts keys with the shortest remaining Time-To-Live (TTL) first.',
    algorithm: 'Samples keys with TTL set and evicts the one closest to natural expiration.',
    bestFor: 'Time-sensitive caching where expiring data soonest should be freed first.',
  },
  {
    id: 'allkeys-random',
    name: 'allkeys-random',
    badge: 'Random Eviction',
    color: '#94a3b8',
    description: 'Evicts random keys across the entire keyspace to free up memory.',
    algorithm: 'Uniform random key selection.',
    bestFor: 'Uniform access pattern workloads where all keys are accessed with equal probability.',
  },
];

export default function RedisEvictionPoliciesDiagram(): React.JSX.Element {
  const [selectedPolicy, setSelectedPolicy] = useState<Policy>(POLICIES[1]); // Default to allkeys-lru

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Redis Memory Eviction Policy Matrix (`maxmemory-policy`)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Policy Selector Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {POLICIES.map((p) => {
            const isSelected = p.id === selectedPolicy.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPolicy(p)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: isSelected ? `1px solid ${p.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: isSelected ? `${p.color}15` : '#0c0e17',
                  color: isSelected ? '#fff' : 'var(--ifm-color-content-secondary)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 400,
                  fontSize: '12px',
                }}
              >
                {p.name}
              </button>
            );
          })}
        </div>

        {/* Selected Policy Overview */}
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', borderLeft: `4px solid ${selectedPolicy.color}`, marginBottom: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>{selectedPolicy.name}</span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: `${selectedPolicy.color}22`, color: selectedPolicy.color, fontWeight: 700 }}>
              {selectedPolicy.badge}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            {selectedPolicy.description}
          </p>
        </div>

        {/* Algorithm & Best For Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Underlying Eviction Mechanics
            </div>
            <div style={{ fontSize: '13px', color: selectedPolicy.color, fontWeight: 600, lineHeight: 1.4 }}>
              {selectedPolicy.algorithm}
            </div>
          </div>

          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Recommended Production Use Case
            </div>
            <div style={{ fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
              {selectedPolicy.bestFor}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
