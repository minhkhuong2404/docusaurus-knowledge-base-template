import React, { useState } from 'react';

interface PersistenceMode {
  id: string;
  name: string;
  badge: string;
  color: string;
  mechanism: string;
  rpoRecoveryPoint: string;
  latencyImpact: string;
  config: string;
}

const MODES: PersistenceMode[] = [
  {
    id: 'rdb',
    name: '1. RDB (Point-In-Time Snapshots)',
    badge: 'Fast Compact Snapshots',
    color: '#38bdf8',
    mechanism: 'Redis forks child process (`BGSAVE`) to dump entire RAM memory dataset to compact binary dump.rdb file.',
    rpoRecoveryPoint: 'Data lost since last snapshot (e.g. up to 60s or 5m data loss).',
    latencyImpact: 'fork() latency spike on memory page table copy (50-100ms pause for 10 GB RAM).',
    config: `save 60 1000 # Save every 60s if 1000 keys changed\ndbfilename dump.rdb`,
  },
  {
    id: 'aof-everysec',
    name: '2. AOF (appendfsync everysec)',
    badge: 'Production Standard',
    color: '#34d399',
    mechanism: 'Logs every WRITE command to disk log file. Background thread issues fsync() once per second.',
    rpoRecoveryPoint: 'At most 1 second of write data loss on server crash.',
    latencyImpact: 'Minimal (<1ms latency per write; background thread handles disk fsync).',
    config: `appendonly yes\nappendfsync everysec`,
  },
  {
    id: 'aof-always',
    name: '3. AOF (appendfsync always)',
    badge: 'Maximum Durability',
    color: '#fbbf24',
    mechanism: 'Forces disk fsync() after EVERY single write command before returning success to client.',
    rpoRecoveryPoint: 'Zero data loss (strict durability).',
    latencyImpact: 'Extremely slow! Reduces throughput from 100,000 ops/sec down to ~2,000 ops/sec (disk IOPS bottleneck).',
    config: `appendonly yes\nappendfsync always`,
  },
  {
    id: 'rdb-aof-hybrid',
    name: '4. Hybrid RDB + AOF (Redis 4.0+)',
    badge: 'Fastest Restart + Zero Loss',
    color: '#c084fc',
    mechanism: 'AOF rewrite (`BGREWRITEAOF`) writes an RDB snapshot header followed by incremental AOF write logs.',
    rpoRecoveryPoint: 'At most 1 second of data loss with lightning-fast reboot recovery.',
    latencyImpact: 'Minimal latency with ultra-fast startup file loading.',
    config: `aof-use-rdb-preamble yes`,
  },
];

export default function RedisPersistenceMechanicsDiagram(): React.JSX.Element {
  const [selectedMode, setSelectedMode] = useState<PersistenceMode>(MODES[1]); // Default to AOF everysec

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3"/>
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Redis Data Persistence & Recovery Architecture (RDB vs AOF vs Hybrid)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Selector Tabs */}
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
                }}
              >
                {m.name}
              </button>
            );
          })}
        </div>

        {/* Selected Mode Summary */}
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', borderLeft: `4px solid ${selectedMode.color}`, marginBottom: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>{selectedMode.name}</span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: `${selectedMode.color}22`, color: selectedMode.color, fontWeight: 700 }}>
              {selectedMode.badge}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            {selectedMode.mechanism}
          </p>
        </div>

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Recovery Point Objective (Data Loss Risk)
            </div>
            <div style={{ fontSize: '12.5px', color: selectedMode.color, fontWeight: 700, marginBottom: '10px' }}>
              {selectedMode.rpoRecoveryPoint}
            </div>

            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Write Latency / CPU Fork Impact
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
              {selectedMode.latencyImpact}
            </div>
          </div>

          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '6px', fontWeight: 600 }}>
              redis.conf Configuration
            </div>
            <pre style={{ margin: 0, padding: '10px', backgroundColor: '#05070e', borderRadius: '6px', fontSize: '11.5px', fontFamily: 'monospace', color: '#38bdf8', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
              <code>{selectedMode.config}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
