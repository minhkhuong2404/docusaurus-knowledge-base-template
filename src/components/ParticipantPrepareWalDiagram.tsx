import React, { useState } from 'react';

interface LogRecord {
  lsn: number;
  operation: string;
  payload: string;
  color: string;
  diskAction: string;
  locksState: string;
  details: string[];
}

const RECORDS: LogRecord[] = [
  {
    lsn: 1001,
    operation: 'BEGIN txn=T1',
    payload: 'Transaction initialized',
    color: '#38bdf8',
    diskAction: 'Buffered: Placed in PG memory buffers.',
    locksState: 'None',
    details: [
      'Allocates a virtual transaction ID in local memory.',
      'Does not block any other database resources yet.',
      'No disk write is performed; fast memory-only allocation.',
    ],
  },
  {
    lsn: 1002,
    operation: 'UPDATE accounts SET balance = balance - 100',
    payload: 'WHERE id=42 (old=500, new=400)',
    color: '#fbbf24',
    diskAction: 'Buffered: WAL record written to shared log buffer.',
    locksState: 'Exclusive Row Lock on account 42',
    details: [
      'Modifies the page in the shared buffer pool (creating a dirty page).',
      'Acquires row-level exclusive lock (X-lock) on record id=42.',
      'Appends the update record to the Postgres WAL buffer in memory.',
    ],
  },
  {
    lsn: 1003,
    operation: 'PREPARE txn=T1 xid=2PC-global-id',
    payload: 'State: IN-DOUBT (Point of Fsync)',
    color: '#34d399',
    diskAction: 'FLUSHED: Durable fsync() executed to disk.',
    locksState: 'Exclusive Row Locks HELD',
    details: [
      'Durably persists transaction metadata and undo/redo records to disk.',
      'Calls pg_fsync(): waits for disk controller to guarantee write durability.',
      'Keeps row locks held. Transaction enters the in-doubt state, awaiting commit/abort.',
    ],
  },
];

export default function ParticipantPrepareWalDiagram(): React.JSX.Element {
  const [activeLsn, setActiveLsn] = useState<number>(1003);

  const active = RECORDS.find(r => r.lsn === activeLsn) || RECORDS[2];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
          <line x1="6" y1="6" x2="6.01" y2="6"/>
          <line x1="6" y1="18" x2="6.01" y2="18"/>
        </svg>
        <span style={{ color: '#34d399' }}>Participant Write-Ahead Log (WAL) Block Layout</span>
      </div>

      <style>{`
        .wal-grid {
          display: grid;
          grid-template-columns: 55% 45%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .wal-grid {
            grid-template-columns: 1fr;
          }
        }
        .wal-record-block {
          background: rgba(15,23,42,0.6);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .wal-record-block:hover {
          border-color: rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.02);
        }
      `}</style>

      <div className="wal-grid">
        
        {/* Track blocks list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {RECORDS.map(record => {
            const isSelected = activeLsn === record.lsn;
            return (
              <div
                key={record.lsn}
                onClick={() => setActiveLsn(record.lsn)}
                className="wal-record-block"
                style={{
                  borderLeft: `4px solid ${isSelected ? record.color : 'rgba(255,255,255,0.15)'}`,
                  boxShadow: isSelected ? `0 0 10px ${record.color}15` : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: isSelected ? record.color : '#94a3b8' }}>
                    LSN {record.lsn}
                  </span>
                  {isSelected && (
                    <span style={{ fontSize: '9px', fontWeight: 700, color: record.color, textTransform: 'uppercase' }}>
                      Selected
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '11.5px', color: '#e2e8f0', fontWeight: 'bold' }}>
                  {record.operation}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                  {record.payload}
                </div>
              </div>
            );
          })}
        </div>

        {/* Details Card */}
        <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${active.color}`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          <div>
            <h4 style={{ margin: '0 0 4px', fontSize: '12px', color: active.color }}>
              LSN {active.lsn} Log Metadata
            </h4>
          </div>

          <div style={{ fontSize: '11px' }}>
            <span style={{ fontWeight: 'bold', color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.05em' }}>
              Disk Write Type
            </span>
            <span style={{ color: 'var(--ifm-color-content)' }}>
              {active.diskAction}
            </span>
          </div>

          <div style={{ fontSize: '11px' }}>
            <span style={{ fontWeight: 'bold', color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.05em' }}>
              Database Lock Status
            </span>
            <span style={{ color: 'var(--ifm-color-content)' }}>
              {active.locksState}
            </span>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
            <span style={{ fontWeight: 'bold', color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: '8px', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Under the Hood
            </span>
            <ul style={{ margin: 0, paddingLeft: '14px' }}>
              {active.details.map((detail, idx) => (
                <li key={idx} style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '3px', lineHeight: 1.45 }}>
                  {detail}
                </li>
              ))}
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
}
