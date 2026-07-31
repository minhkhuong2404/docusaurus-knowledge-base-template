import React, { useState } from 'react';

interface Phase {
  id: string;
  name: string;
  badge: string;
  color: string;
  description: string;
  lockCompatibility: string;
  rules: string[];
}

const PHASES: Phase[] = [
  {
    id: 'growing',
    name: '1. Growing Phase (Lock Acquisition)',
    badge: 'Acquiring Locks',
    color: '#38bdf8',
    description: 'Transaction acquires all required Shared (S) or Exclusive (X) locks on rows/pages as it executes queries. ZERO locks may be released during this phase.',
    lockCompatibility: 'Shared (S) locks allow concurrent S locks. Exclusive (X) locks block both S and X locks.',
    rules: [
      'Can acquire new locks (S-Lock / X-Lock)',
      'Can upgrade S-Lock to X-Lock',
      'CANNOT release any locks',
    ],
  },
  {
    id: 'shrinking',
    name: '2. Shrinking Phase (Lock Release)',
    badge: 'Releasing Locks',
    color: '#fbbf24',
    description: 'Transaction releases locks once execution reaches its peak lock point. Once the first lock is released, NO new locks may ever be acquired.',
    lockCompatibility: 'Releasing locks unblocks waiting transactions in the lock queue.',
    rules: [
      'Can release locks',
      'Can downgrade X-Lock to S-Lock',
      'CANNOT acquire any new locks (Strict 2PL prevents cascade rollbacks by holding X-locks until COMMIT)',
    ],
  },
  {
    id: 'strict-2pl',
    name: '3. Strict 2PL (Production Standard)',
    badge: 'Cascade Prevention',
    color: '#34d399',
    description: 'All Exclusive (X) locks held by a transaction MUST be retained until the transaction officially COMMITS or ROLLS BACK. Prevents dirty reads and cascading aborts.',
    lockCompatibility: 'Guarantees serializability and avoids dirty read cascading rollbacks.',
    rules: [
      'All Exclusive (X) locks held until COMMIT / ROLLBACK',
      'S-Locks can be released gradually (Strict 2PL) or held until COMMIT (Rigorous 2PL)',
      'Used by InnoDB and PostgreSQL Serializability engines',
    ],
  },
];

export default function TwoPhaseLockingMechanismDiagram(): React.JSX.Element {
  const [selectedPhase, setSelectedPhase] = useState<Phase>(PHASES[0]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Two-Phase Locking Protocol (2PL & Strict 2PL Concurrency Control)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Phase Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {PHASES.map((p) => {
            const isSelected = p.id === selectedPhase.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPhase(p)}
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

        {/* Selected Phase Overview */}
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', borderLeft: `4px solid ${selectedPhase.color}`, marginBottom: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>{selectedPhase.name}</span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: `${selectedPhase.color}22`, color: selectedPhase.color, fontWeight: 700 }}>
              {selectedPhase.badge}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            {selectedPhase.description}
          </p>
        </div>

        {/* Lock Compatibility & Rules Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '6px', fontWeight: 600 }}>
              Phase Invariants & Rules
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              {selectedPhase.rules.map((r, idx) => (
                <li key={idx} style={{ marginBottom: '6px' }}>{r}</li>
              ))}
            </ul>
          </div>

          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '6px', fontWeight: 600 }}>
              Lock Compatibility Matrix
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', color: 'var(--ifm-color-content)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--ifm-color-content-secondary)' }}>
                  <th style={{ padding: '4px', textAlign: 'left' }}>Requested \ Held</th>
                  <th style={{ padding: '4px', textAlign: 'center' }}>Shared (S)</th>
                  <th style={{ padding: '4px', textAlign: 'center' }}>Exclusive (X)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '6px 4px', fontWeight: 700, color: '#38bdf8' }}>Shared (S)</td>
                  <td style={{ padding: '6px 4px', textAlign: 'center', color: '#34d399', fontWeight: 700 }}>✅ OK</td>
                  <td style={{ padding: '6px 4px', textAlign: 'center', color: '#f87171', fontWeight: 700 }}>❌ BLOCK</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 4px', fontWeight: 700, color: '#f87171' }}>Exclusive (X)</td>
                  <td style={{ padding: '6px 4px', textAlign: 'center', color: '#f87171', fontWeight: 700 }}>❌ BLOCK</td>
                  <td style={{ padding: '6px 4px', textAlign: 'center', color: '#f87171', fontWeight: 700 }}>❌ BLOCK</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
