import React, { useState } from 'react';

interface TierDetail {
  id: string;
  name: string;
  latency: string;
  throughput: string;
  consistency: string;
  targetData: string;
  color: string;
  desc: string;
}

const TIERS: TierDetail[] = [
  {
    id: 'L1',
    name: 'L1 In-Memory Cache (Local Heap)',
    latency: '< 1 ms',
    throughput: '1M+ QPS per instance',
    consistency: 'Eventual (Per-node TTL)',
    targetData: 'Hot configs, static lookups, session tokens',
    color: '#38bdf8',
    desc: 'Local JVM or application heap memory. Fastest access tier. Bypasses all network hops entirely but is local to each server node.',
  },
  {
    id: 'L2',
    name: 'L2 Distributed Cache (Redis)',
    latency: '1 - 5 ms',
    throughput: '100k+ QPS per node',
    consistency: 'Eventual (Shared invalidation)',
    targetData: 'User profiles, catalog items, pre-computed feeds',
    color: '#a78bfa',
    desc: 'Shared distributed in-memory cache. Reached via network hop. Serves as a single source of cache truth for all application nodes.',
  },
  {
    id: 'CDN',
    name: 'CDN Edge Cache (Cloudflare)',
    latency: '10 - 50 ms',
    throughput: 'Millions (Global edges)',
    consistency: 'Eventual (Purge / TTL)',
    targetData: 'Static assets, public API JSONs, dynamic pages',
    color: '#fbbf24',
    desc: 'Cached content deployed at proxy edges physically close to users. Eliminates traffic hitting the application origin entirely.',
  },
  {
    id: 'REPLICA',
    name: 'DB Read Replicas',
    latency: '50 - 100 ms',
    throughput: '10k+ QPS per instance',
    consistency: 'Eventual (Subject to replication lag)',
    targetData: 'Complex reporting queries, non-cached page reads',
    color: '#f472b6',
    desc: 'Read-only replica databases syncing asynchronously via write-ahead logs. Offloads heavy relational reads from the primary write database.',
  },
  {
    id: 'PRIMARY',
    name: 'Primary Database (Authority)',
    latency: '> 100 ms',
    throughput: '1,000 - 5,000 QPS',
    consistency: 'Strong (Read-Your-Writes)',
    targetData: 'Transactional balance checks, fresh database writes',
    color: '#34d399',
    desc: 'The single source of truth for writes and strict transactions. Serves reads only when strong consistency is strictly required.',
  },
];

export default function ScalingReadsStrategyHierarchyDiagram(): React.JSX.Element {
  const [activeId, setActiveId] = useState<string>('L1');

  const current = TIERS.find(t => t.id === activeId) || TIERS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 22 22 22 12 2"/>
        </svg>
        <span style={{ color: '#34d399' }}>Read Scaling Storage Hierarchy &amp; Latency Menu</span>
      </div>

      <style>{`
        .strat-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .strat-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="strat-grid">
        
        {/* Tier hierarchy stacks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {TIERS.map(tier => {
            const isSelected = tier.id === activeId;
            return (
              <div
                key={tier.id}
                onClick={() => setActiveId(tier.id)}
                style={{
                  background: isSelected ? `${tier.color}10` : 'rgba(15,23,42,0.6)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderColor: isSelected ? tier.color : 'rgba(255,255,255,0.06)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <div>
                  <div style={{ fontSize: '11.5px', fontWeight: 'bold', color: isSelected ? tier.color : '#cbd5e1' }}>
                    {tier.name}
                  </div>
                  <div style={{ fontSize: '9.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                    Latency: {tier.latency}
                  </div>
                </div>
                <div style={{
                  fontSize: '8.5px',
                  fontWeight: 'bold',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(255,255,255,0.04)',
                  color: tier.color,
                }}>
                  {tier.id}
                </div>
              </div>
            );
          })}
        </div>

        {/* Details Card */}
        <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${current.color}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          <div>
            <h3 style={{ color: current.color, margin: 0 }}>{current.name}</h3>
            <span style={{ fontSize: '9px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>
              Latency Shield Tier Details
            </span>
          </div>

          <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content)', margin: 0, lineHeight: 1.45 }}>
            {current.desc}
          </p>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '10.5px' }}>
              <span style={{ fontWeight: 'bold', color: '#64748b' }}>Throughput limit:</span> <span style={{ color: 'var(--ifm-color-content-secondary)' }}>{current.throughput}</span>
            </div>
            <div style={{ fontSize: '10.5px' }}>
              <span style={{ fontWeight: 'bold', color: '#64748b' }}>Consistency Model:</span> <span style={{ color: 'var(--ifm-color-content-secondary)' }}>{current.consistency}</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
            <span style={{ fontWeight: 'bold', color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.05em', marginBottom: '2px' }}>
              Target Data Invariants
            </span>
            <span style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', fontFamily: 'monospace' }}>
              {current.targetData}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
