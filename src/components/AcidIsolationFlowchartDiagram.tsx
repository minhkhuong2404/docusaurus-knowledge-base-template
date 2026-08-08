import React, { useState } from 'react';

interface DecisionPath {
  id: string;
  name: string;
  recommended: string;
  color: string;
  reason: string;
  sqlPattern: string;
}

const DECISION_PATHS: DecisionPath[] = [
  {
    id: 'oltp',
    name: '1. Standard Web Reads / High-Throughput OLTP',
    recommended: 'READ COMMITTED',
    color: '#38bdf8',
    reason: 'Default for PostgreSQL & Oracle. Prevents dirty reads with minimal locking overhead. Single-row correctness is enforced via atomic SQL.',
    sqlPattern: 'UPDATE accounts SET balance = balance - 50 WHERE id = 1 AND balance >= 50;',
  },
  {
    id: 'hot_inventory',
    name: '2. Flash Sales / High-Contention Inventory Deductions',
    recommended: 'READ COMMITTED + SELECT FOR UPDATE',
    color: '#fbbf24',
    reason: 'Explicitly locks target rows without escalating isolation globally across the whole database session.',
    sqlPattern: 'SELECT * FROM inventory WHERE item_id = 42 FOR UPDATE;',
  },
  {
    id: 'reporting',
    name: '3. Financial Reports / Point-in-Time Ledger Audits',
    recommended: 'REPEATABLE READ',
    color: '#a78bfa',
    reason: 'Constructs a static MVCC snapshot for the transaction lifetime. Repeated reads return identical rows even if concurrent txns commit.',
    sqlPattern: 'BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT SUM(amount) FROM ledger;',
  },
  {
    id: 'invariant',
    name: '4. Complex Multi-Row Invariant Enforcement (e.g. Doctor On-Call)',
    recommended: 'SERIALIZABLE (PostgreSQL SSI)',
    color: '#34d399',
    reason: 'Prevents Write Skew anomalies by tracking lock dependency graphs (SIREAD locks). Application must handle retry loops on SQLSTATE 40001.',
    sqlPattern: 'BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT COUNT(*) FROM doctors WHERE on_call = true;',
  },
];

export default function AcidIsolationFlowchartDiagram(): React.JSX.Element {
  const [selectedPathId, setSelectedPathId] = useState('oltp');

  const current = DECISION_PATHS.find(p => p.id === selectedPathId) ?? DECISION_PATHS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .iso-flow-grid { grid-template-columns: 1fr !important; } }`}</style>

      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 17 22 12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Workload Isolation Level Decision Flowchart
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="iso-flow-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
          
          {/* Left: Flowchart Workload Selector List */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '8px' }}>
              Select Concurrency & Correctness Profile
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {DECISION_PATHS.map(p => {
                const isSel = selectedPathId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPathId(p.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      background: isSel ? `${p.color}20` : 'rgba(255,255,255,0.03)',
                      boxShadow: isSel ? `0 0 0 1.5px ${p.color}` : '0 0 0 1px rgba(255,255,255,0.08)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: isSel ? p.color : 'var(--ifm-color-content)' }}>{p.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                      Recommended: <strong style={{ color: p.color }}>{p.recommended}</strong>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Recommendation Card & SQL Pattern */}
          <div className={`interactive-diagram-details-card details-${current.id === 'oltp' ? 'blue' : current.id === 'hot_inventory' ? 'yellow' : current.id === 'reporting' ? 'purple' : 'green'}`} style={{ minHeight: '220px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: current.color, textTransform: 'uppercase', marginBottom: '2px' }}>
              Decision Recommendation
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '8px' }}>
              {current.recommended}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 10px', lineHeight: 1.5 }}>
              {current.reason}
            </p>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px', fontSize: '10.5px' }}>
              <div style={{ color: current.color, fontWeight: 700, marginBottom: '2px' }}>Recommended SQL Pattern:</div>
              <pre style={{ margin: 0, padding: 0, background: 'transparent', color: 'var(--ifm-color-content)', fontSize: '10px' }}>
                <code>{current.sqlPattern}</code>
              </pre>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
