import React, { useState } from 'react';

interface AnomalyInfo {
  id: string;
  name: string;
  badge: string;
  origin: string;
  color: string;
  summary: string;
  timeline: {
    time: string;
    txnA: string;
    txnB: string;
    note: string;
  }[];
  preventionLevel: string;
  practicalFix: string;
}

const ANOMALIES: AnomalyInfo[] = [
  {
    id: 'dirty-read',
    name: '1. Dirty Read',
    badge: 'Uncommitted Data',
    origin: 'ANSI SQL 1992 (P1)',
    color: '#f87171',
    summary: 'Transaction B reads data modified by Transaction A before A commits. When A rolls back, B is left holding data that never officially existed.',
    timeline: [
      { time: 'T1', txnA: 'UPDATE balance = $0 WHERE id = 1', txnB: 'Idle', note: 'Txn A modifies row in uncommitted transaction' },
      { time: 'T2', txnA: 'Processing...', txnB: 'SELECT balance WHERE id = 1', note: 'Txn B reads uncommitted balance = $0' },
      { time: 'T3', txnA: 'ROLLBACK;', txnB: 'Process order based on $0 balance', note: 'Txn A aborts! Txn B just acted on phantom phantom data' },
    ],
    preventionLevel: 'READ COMMITTED or higher',
    practicalFix: 'Default in PostgreSQL, Oracle, SQL Server. Uses per-statement MVCC snapshot so uncommitted writes are invisible to other transactions.',
  },
  {
    id: 'non-repeatable-read',
    name: '2. Non-Repeatable Read',
    badge: 'Fuzzy Read',
    origin: 'ANSI SQL 1992 (P2)',
    color: '#fbbf24',
    summary: 'Transaction A reads the same row twice during its execution and gets different values because Transaction B modified and committed it in between.',
    timeline: [
      { time: 'T1', txnA: 'SELECT balance WHERE id = 1 (gets $500)', txnB: 'Idle', note: 'First read by Txn A' },
      { time: 'T2', txnA: 'Processing logic...', txnB: 'UPDATE balance = $300; COMMIT;', note: 'Txn B modifies and commits change' },
      { time: 'T3', txnA: 'SELECT balance WHERE id = 1 (gets $300)', txnB: 'Idle', note: 'Same query, same row, but different value! Non-repeatable.' },
    ],
    preventionLevel: 'REPEATABLE READ or higher',
    practicalFix: 'Uses per-transaction snapshot (Snapshot Isolation) so all reads in Txn A see a single frozen point-in-time state of the database.',
  },
  {
    id: 'phantom-read',
    name: '3. Phantom Read',
    badge: 'Range Ghost',
    origin: 'ANSI SQL 1992 (P3)',
    color: '#c084fc',
    summary: 'Transaction A executes a range query (e.g. COUNT), then Transaction B inserts a new row matching that range and commits. Txn A re-executes the range query and sees new "phantom" rows.',
    timeline: [
      { time: 'T1', txnA: 'SELECT COUNT(*) WHERE balance > 100 (returns 5)', txnB: 'Idle', note: 'Initial range query' },
      { time: 'T2', txnA: 'Processing report...', txnB: 'INSERT INTO accounts (balance) VALUES (200); COMMIT;', note: 'Txn B inserts new qualifying row' },
      { time: 'T3', txnA: 'SELECT COUNT(*) WHERE balance > 100 (returns 6)', txnB: 'Idle', note: 'New "phantom" row appears in range result!' },
    ],
    preventionLevel: 'SERIALIZABLE (Standard) / REPEATABLE READ (PostgreSQL)',
    practicalFix: 'PostgreSQL REPEATABLE READ holds a single snapshot for the entire transaction, which naturally blocks phantom reads without locking tables.',
  },
  {
    id: 'lost-update',
    name: '4. Lost Update',
    badge: 'Silent Overwrite',
    origin: '1995 Critique (P4)',
    color: '#ef4444',
    summary: 'Two concurrent transactions read the same balance, calculate a new value, and write back. The second commit overwrites the first commit silently.',
    timeline: [
      { time: 'T1', txnA: 'Read balance = $500', txnB: 'Read balance = $500', note: 'Both read initial state' },
      { time: 'T2', txnA: 'Compute $500 - $100 = $400', txnB: 'Compute $500 - $200 = $300', note: 'Both compute independently' },
      { time: 'T3', txnA: 'UPDATE balance = $400; COMMIT;', txnB: 'Idle', note: 'Txn A commits $400 balance' },
      { time: 'T4', txnA: 'Idle', txnB: 'UPDATE balance = $300; COMMIT;', note: 'Txn B overwrites! Txn A deduction ($100) is LOST forever!' },
    ],
    preventionLevel: 'REPEATABLE READ (PostgreSQL aborts Txn B) / SELECT FOR UPDATE',
    practicalFix: 'Use atomic update: UPDATE accounts SET balance = balance - 100 WHERE id = 1 AND balance >= 100; or pessimistic SELECT FOR UPDATE.',
  },
  {
    id: 'write-skew',
    name: '5. Write Skew',
    badge: 'Shared Invariant Failure',
    origin: '1995 Critique (P5)',
    color: '#38bdf8',
    summary: 'Two transactions read overlapping data, check an invariant ("at least 1 doctor on-call"), and write to DIFFERENT rows. Combined result violates invariant with 0 doctors on-call.',
    timeline: [
      { time: 'T1', txnA: 'SELECT COUNT(*) WHERE on_call=true (sees 2)', txnB: 'SELECT COUNT(*) WHERE on_call=true (sees 2)', note: 'Both check invariant independently' },
      { time: 'T2', txnA: 'UPDATE doctor_1 SET on_call=false', txnB: 'UPDATE doctor_2 SET on_call=false', note: 'Both write to DIFFERENT rows! No lock collision.' },
      { time: 'T3', txnA: 'COMMIT;', txnB: 'COMMIT;', note: 'Both commit successfully! Total on-call = 0. Invariant BROKEN!' },
    ],
    preventionLevel: 'SERIALIZABLE (SSI) / Materialized Row Lock',
    practicalFix: 'Materialize the constraint into a concrete row (SELECT FOR UPDATE on shift_slot row) to force concurrent transactions into a single lock queue.',
  },
];

export default function AcidIsolationAnomaliesDiagram(): React.JSX.Element {
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyInfo>(ANOMALIES[3]); // Default to Lost Update

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Database Isolation Anomalies & Real-World Safeguards
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Anomaly Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {ANOMALIES.map((an) => {
            const isSelected = an.id === selectedAnomaly.id;
            return (
              <button
                key={an.id}
                onClick={() => setSelectedAnomaly(an)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: isSelected ? `1px solid ${an.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                  background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.2)',
                  color: isSelected ? '#ffffff' : 'var(--ifm-color-content-secondary)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 600 : 400,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>{an.name}</span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 5px',
                    borderRadius: '4px',
                    backgroundColor: `${an.color}22`,
                    color: an.color,
                    fontWeight: 600,
                  }}
                >
                  {an.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Anomaly Overview Card */}
        <div
          style={{
            padding: '14px 16px',
            backgroundColor: '#0c0e17',
            borderRadius: '10px',
            borderLeft: `4px solid ${selectedAnomaly.color}`,
            marginBottom: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>{selectedAnomaly.name}</span>
            <span style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '3px 8px', borderRadius: '4px' }}>
              Spec Source: {selectedAnomaly.origin}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            {selectedAnomaly.summary}
          </p>
        </div>

        {/* Timeline Visualization Table */}
        <div
          style={{
            backgroundColor: '#0c0e17',
            borderRadius: '10px',
            padding: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '16px',
          }}
        >
          <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Concurrent Transaction Sequence Matrix
          </h4>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--ifm-color-content-secondary)' }}>
                  <th style={{ padding: '8px', textAlign: 'left', width: '60px' }}>Step</th>
                  <th style={{ padding: '8px', textAlign: 'left', width: '35%' }}>Transaction A</th>
                  <th style={{ padding: '8px', textAlign: 'left', width: '35%' }}>Transaction B</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Impact / Concurrency Note</th>
                </tr>
              </thead>
              <tbody>
                {selectedAnomaly.timeline.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 700, color: selectedAnomaly.color }}>{row.time}</td>
                    <td style={{ padding: '10px 8px', fontFamily: 'monospace', color: '#e2e8f0' }}>{row.txnA}</td>
                    <td style={{ padding: '10px 8px', fontFamily: 'monospace', color: '#e2e8f0' }}>{row.txnB}</td>
                    <td style={{ padding: '10px 8px', color: 'var(--ifm-color-content-secondary)' }}>{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Prevention & Engineering Recommendation */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#0c0e17',
              borderRadius: '10px',
              padding: '14px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Spec Prevention Threshold
            </div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: selectedAnomaly.color }}>
              {selectedAnomaly.preventionLevel}
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#0c0e17',
              borderRadius: '10px',
              padding: '14px',
              border: `1px solid ${selectedAnomaly.color}44`,
              background: `linear-gradient(135deg, #0c0e17 0%, ${selectedAnomaly.color}10 100%)`,
            }}
          >
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: selectedAnomaly.color, marginBottom: '4px', fontWeight: 600 }}>
              Production Remediation Strategy
            </div>
            <div style={{ fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
              {selectedAnomaly.practicalFix}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .interactive-diagram-container div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
