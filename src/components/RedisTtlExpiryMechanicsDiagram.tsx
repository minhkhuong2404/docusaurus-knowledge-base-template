import React, { useState } from 'react';

interface ExpiryMechanism {
  id: string;
  name: string;
  badge: string;
  color: string;
  triggerCondition: string;
  cpuOverhead: string;
  memoryImpact: string;
  stepDetails: string[];
}

const MECHANISMS: ExpiryMechanism[] = [
  {
    id: 'passive',
    name: '1. Passive Expiration (Lazy Removal on Read)',
    badge: 'On-Read Check',
    color: '#38bdf8',
    triggerCondition: 'Triggered only when a client explicitly issues a read command (e.g. `GET key`) for an expired key.',
    cpuOverhead: 'Near Zero CPU overhead (only checks timestamp when key is accessed).',
    memoryImpact: 'Risk of memory leak if expired keys are NEVER read again by any client!',
    stepDetails: [
      'Client issues GET key command.',
      'Redis inspects key expire timestamp stored in expires dict.',
      'If key.expireTime < currentTime: Key is deleted from RAM instantly and returns (nil).',
      'If key is never accessed again, it remains in memory until Active Expiration cleans it.',
    ],
  },
  {
    id: 'active',
    name: '2. Active Expiration (20Hz Background Sampling)',
    badge: 'Background Daemon',
    color: '#34d399',
    triggerCondition: 'Runs automatically 10 to 20 times per second (20Hz) in background event loop tick.',
    cpuOverhead: 'Capped at 25% CPU execution time per cycle to prevent blocking main thread.',
    memoryImpact: 'Continuously reclaims memory from dead unread keys.',
    stepDetails: [
      'Redis samples 20 random keys with TTL set from expires dict.',
      'Deletes all keys that have already expired.',
      'If MORE than 25% (5 keys) were expired: Redis instantly repeats sampling loop without waiting!',
      'If <25% were expired: Sampling loop ends and waits 50ms for next 20Hz tick.',
    ],
  },
];

export default function RedisTtlExpiryMechanicsDiagram(): React.JSX.Element {
  const [selectedMechanism, setSelectedMechanism] = useState<ExpiryMechanism>(MECHANISMS[1]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Redis Key Expiration Mechanics: Passive Expiration vs 20Hz Active Sampling
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Selector Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {MECHANISMS.map((m) => {
            const isSelected = m.id === selectedMechanism.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMechanism(m)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: isSelected ? `1px solid ${m.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: isSelected ? `${m.color}15` : '#0c0e17',
                  color: isSelected ? '#fff' : 'var(--ifm-color-content-secondary)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 400,
                  fontSize: '12.5px',
                }}
              >
                {m.name}
              </button>
            );
          })}
        </div>

        {/* Selected Overview */}
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', borderLeft: `4px solid ${selectedMechanism.color}`, marginBottom: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>{selectedMechanism.name}</span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: `${selectedMechanism.color}22`, color: selectedMechanism.color, fontWeight: 700 }}>
              {selectedMechanism.badge}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            {selectedMechanism.triggerCondition}
          </p>
        </div>

        {/* Technical Comparisons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              CPU Execution Overhead
            </div>
            <div style={{ fontSize: '12.5px', color: selectedMechanism.color, fontWeight: 700, marginBottom: '10px' }}>
              {selectedMechanism.cpuOverhead}
            </div>

            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              RAM Memory Reclamation Impact
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)' }}>
              {selectedMechanism.memoryImpact}
            </div>
          </div>

          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '8px', fontWeight: 600 }}>
              Execution Flow Steps
            </div>
            <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              {selectedMechanism.stepDetails.map((st, idx) => (
                <li key={idx} style={{ marginBottom: '6px' }}>{st}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
