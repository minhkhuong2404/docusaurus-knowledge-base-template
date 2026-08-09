import React, { useState } from 'react';

interface Concept {
  id: string;
  name: string;
  badge: string;
  color: string;
  description: string;
  mechanics: string[];
  keyCommandOrConfig: string;
}

const CONCEPTS: Concept[] = [
  {
    id: 'replication',
    name: '1. Master-Replica Async Replication',
    badge: 'Read Scalability',
    color: '#38bdf8',
    description: 'Master accepts all writes asynchronously and streams updates to one or more replicas via replication backlog buffer & offsets.',
    mechanics: [
      'Asynchronous replication: Master returns WRITE success immediately to client without waiting for replicas.',
      'Partial Resynchronization (PSYNC): Uses master_repl_offset and replication_id to sync missed stream entries after brief network split.',
      'Full Resynchronization: Master generates RDB snapshot and streams to replica when offset gap is too large.',
    ],
    keyCommandOrConfig: `replicaof 192.168.1.100 6379\nINFO replication # Check master_link_status & offset`,
  },
  {
    id: 'sentinel',
    name: '2. Sentinel High Availability (HA)',
    badge: 'Auto-Failover',
    color: '#fbbf24',
    description: 'Independent Sentinel nodes monitor masters, achieve quorum consensus on Subjectively Down (SDOWN) -> Objectively Down (ODOWN), and execute failover.',
    mechanics: [
      'Quorum Monitoring: Sentinels ping master continuously. If quorum (e.g. 2 out of 3 Sentinels) agree master is down -> ODOWN.',
      'Raft-like Leader Election: Sentinels vote to elect a leader Sentinel to execute the failover.',
      'Failover Execution: Elected Sentinel promotes healthiest replica (highest offset) to Master and reconfigures remaining nodes.',
    ],
    keyCommandOrConfig: `sentinel monitor mymaster 192.168.1.100 6379 2\nsentinel down-after-milliseconds mymaster 5000`,
  },
  {
    id: 'cluster',
    name: '3. Redis Cluster (Hash Slots Sharding)',
    badge: 'Horizontal Scaling',
    color: '#34d399',
    description: 'Keyspace is divided into exactly 16,384 hash slots distributed across multiple master nodes. CRC16(key) % 16384 maps keys to slots.',
    mechanics: [
      'Hash Slot Formula: Slot = CRC16("user:42") % 16384 -> Slot 12401 (handled by Master B).',
      'Hash Tags: Use curly braces {user:42}.orders and {user:42}.profile to force multi-key operations onto the exact same hash slot.',
      'MOVED Redirection: If client sends query to wrong master, node returns "-MOVED 12401 192.168.1.20:6379" for client auto-routing.',
    ],
    keyCommandOrConfig: `CLUSTER KEYSLOT "user:42" -> returns 12401\nCLUSTER NODES # Lists slot assignments per master`,
  },
];

export default function RedisClusterReplicationDiagram(): React.JSX.Element {
  const [selectedConcept, setSelectedConcept] = useState<Concept>(CONCEPTS[0]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="8" height="8" rx="1"/>
          <rect x="14" y="2" width="8" height="8" rx="1"/>
          <rect x="8" y="14" width="8" height="8" rx="1"/>
          <line x1="6" y1="10" x2="12" y2="14"/>
          <line x1="18" y1="10" x2="12" y2="14"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Redis High Availability, Replication & Cluster Sharding (16,384 Slots)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Concept Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {CONCEPTS.map((c) => {
            const isSelected = c.id === selectedConcept.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedConcept(c)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: isSelected ? `1px solid ${c.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: isSelected ? `${c.color}15` : '#0c0e17',
                  color: isSelected ? '#fff' : 'var(--ifm-color-content-secondary)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 400,
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>

        {/* Concept Description Card */}
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', borderLeft: `4px solid ${selectedConcept.color}`, marginBottom: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>{selectedConcept.name}</span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: `${selectedConcept.color}22`, color: selectedConcept.color, fontWeight: 700 }}>
              {selectedConcept.badge}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            {selectedConcept.description}
          </p>
        </div>

        {/* Mechanics & Config */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '8px', fontWeight: 600 }}>
              Core Technical Mechanics
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              {selectedConcept.mechanics.map((m, idx) => (
                <li key={idx} style={{ marginBottom: '6px' }}>{m}</li>
              ))}
            </ul>
          </div>

          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '8px', fontWeight: 600 }}>
              Command & Configuration Reference
            </div>
            <pre style={{ margin: 0, padding: '10px', backgroundColor: '#05070e', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', color: '#38bdf8', border: '1px solid rgba(255,255,255,0.05)' }}>
              <code>{selectedConcept.keyCommandOrConfig}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
