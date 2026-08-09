import React, { useState } from 'react';

interface UndoRecord {
  trxId: number;
  rollPtr: string;
  recType: string;
  table: string;
  beforeImage: string;
  afterImage: string;
  status: string;
  color: string;
}

const UNDO_RECORDS: UndoRecord[] = [
  { trxId: 200, rollPtr: 'rseg_01 #42', recType: 'TRX_UNDO_UPD_EXIST_REC', table: 'accounts (id=1)', beforeImage: 'balance = 500', afterImage: 'balance = 400', status: 'Active (Uncommitted)', color: '#fbbf24' },
  { trxId: 180, rollPtr: 'rseg_01 #39', recType: 'TRX_UNDO_UPD_EXIST_REC', table: 'accounts (id=1)', beforeImage: 'balance = 600', afterImage: 'balance = 500', status: 'Committed (Held for MVCC)', color: '#38bdf8' },
  { trxId: 150, rollPtr: 'rseg_01 #12', recType: 'TRX_UNDO_INSERT_REC', table: 'accounts (id=1)', beforeImage: 'tuple created', afterImage: 'balance = 600', status: 'Purgeable (Safe to reclaim)', color: '#34d399' },
];

export default function AcidUndoLogDiagram(): React.JSX.Element {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [hllCount, setHllCount] = useState(12500);

  const rec = UNDO_RECORDS[selectedIdx];

  const getHllStatus = (count: number) => {
    if (count < 5000) return { label: 'Optimal Purge', color: '#34d399' };
    if (count < 50000) return { label: 'Moderate Lag', color: '#fbbf24' };
    return { label: 'CRITICAL BLOAT', color: '#f87171' };
  };

  const hllInfo = getHllStatus(hllCount);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .undo-grid { grid-template-columns: 1fr !important; } }`}</style>
      
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Undo Log Record & History Chain Architecture
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="undo-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
          
          {/* Left Pane: Undo Chain Visual Pointer Graph */}
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '10px' }}>
              Rollback Segment Pointer Chain (roll_ptr Traversal)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {UNDO_RECORDS.map((r, idx) => {
                const isSel = selectedIdx === idx;
                return (
                  <div key={r.trxId} onClick={() => setSelectedIdx(idx)} style={{ cursor: 'pointer' }}>
                    <div style={{
                      background: isSel ? `${r.color}20` : 'rgba(255,255,255,0.03)',
                      border: `1.5px solid ${isSel ? r.color : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '8px',
                      padding: '10px 12px',
                      transition: 'all 0.2s ease',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 800, color: r.color, background: `${r.color}25`, padding: '2px 6px', borderRadius: '4px' }}>
                            Trx #{r.trxId}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--ifm-color-content)', fontWeight: 700 }}>{r.recType}</span>
                        </div>
                        <code style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>roll_ptr: {r.rollPtr}</code>
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)' }}>
                        Before-Image Payload: <code style={{ color: r.color }}>{r.beforeImage}</code> (After: {r.afterImage})
                      </div>
                    </div>

                    {/* Chain Arrow */}
                    {idx < UNDO_RECORDS.length - 1 && (
                      <div style={{ display: 'flex', justifyContent: 'center', margin: '3px 0' }}>
                        <svg width="20" height="16" viewBox="0 0 20 16">
                          <line x1="10" y1="0" x2="10" y2="12" stroke="#fbbf24" strokeWidth="2" strokeDasharray="3 2" />
                          <polygon points="6,12 14,12 10,16" fill="#fbbf24" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Pane: Selected Record Detail Card & HLL Simulator */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Record Field Detail Card */}
            <div className={`interactive-diagram-details-card details-${selectedIdx === 0 ? 'yellow' : selectedIdx === 1 ? 'blue' : 'green'}`} style={{ minHeight: '160px' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: rec.color, marginBottom: '6px' }}>
                Undo Record Payload (Trx #{rec.trxId})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', marginBottom: '10px' }}>
                <div><span style={{ color: 'var(--ifm-color-content-secondary)' }}>Target Table:</span> <strong>{rec.table}</strong></div>
                <div><span style={{ color: 'var(--ifm-color-content-secondary)' }}>Status:</span> <strong style={{ color: rec.color }}>{rec.status}</strong></div>
                <div><span style={{ color: 'var(--ifm-color-content-secondary)' }}>Before Value:</span> <code style={{ color: '#f87171' }}>{rec.beforeImage}</code></div>
                <div><span style={{ color: 'var(--ifm-color-content-secondary)' }}>After Value:</span> <code style={{ color: '#34d399' }}>{rec.afterImage}</code></div>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: 1.5 }}>
                {selectedIdx === 0 && 'Active uncommitted transaction. If ROLLBACK occurs, rollback engine reads this before-image to restore balance=500.'}
                {selectedIdx === 1 && 'Transaction committed, but before-image retained to serve MVCC snapshots created prior to Trx #200.'}
                {selectedIdx === 2 && 'Oldest undo log entry. Safe for InnoDB Purge Threads to reclaim disk space.'}
              </p>
            </div>

            {/* Undo History List Length (HLL) Bloat Simulator */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                  History List Length (HLL) Gauge
                </span>
                <span style={{ fontSize: '10px', fontWeight: 800, color: hllInfo.color, background: `${hllInfo.color}20`, padding: '2px 6px', borderRadius: '4px' }}>
                  {hllInfo.label}
                </span>
              </div>

              <div style={{ fontSize: '18px', fontWeight: 800, color: hllInfo.color, marginBottom: '6px' }}>
                {hllCount.toLocaleString()} <span style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', fontWeight: 400 }}>unpurged undo logs</span>
              </div>

              <input
                type="range"
                min="1000"
                max="100000"
                step="1000"
                value={hllCount}
                onChange={e => setHllCount(Number(e.target.value))}
                style={{ width: '100%', marginBottom: '8px', cursor: 'pointer' }}
              />

              <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
                {hllCount > 50000
                  ? '⚠️ High HLL (>50k): Long-running transactions prevent Purge Threads from freeing undo pages. Results in disk bloat & query slowdowns.'
                  : 'Purge Threads are keeping up with write throughput. Undo pages reclaimed promptly.'}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
