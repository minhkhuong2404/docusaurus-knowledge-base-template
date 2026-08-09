import React, { useState } from 'react';

interface TupleHeaderField {
  name: string;
  bytes: string;
  color: string;
  role: string;
  example: string;
}

const TUPLE_FIELDS: TupleHeaderField[] = [
  { name: 'xmin', bytes: '4 Bytes', color: '#38bdf8', role: 'Transaction ID that created/inserted this tuple version', example: 'xmin = 100' },
  { name: 'xmax', bytes: '4 Bytes', color: '#f87171', role: 'Transaction ID that deleted/updated this tuple version (0 if live)', example: 'xmax = 105' },
  { name: 'cmin / cmax', bytes: '4 Bytes', color: '#fbbf24', role: 'Command ID distinguishing statement execution order within txn', example: 'cmin = 0, cmax = 1' },
  { name: 't_ctid', bytes: '6 Bytes', color: '#2dd4bf', role: 'ItemPointer (page_number, tuple_index) pointing to updated version', example: 't_ctid = (0, 2)' },
  { name: 't_infomask', bytes: '2 Bytes', color: '#a78bfa', role: 'Bitmask flags (HEAP_XMIN_COMMITTED, HEAP_XMAX_INVALID, HEAP_HOT_UPDATED)', example: '0x0500' },
];

export default function AcidPostgresMvccDiagram(): React.JSX.Element {
  const [selectedField, setSelectedField] = useState('xmin');
  const [testTxnId, setTestTxnId] = useState(102);

  // Snapshot configuration: xmin=100, xmax=108, xip_list=[102, 105]
  const snapshotXmin = 100;
  const snapshotXmax = 108;
  const activeTxns = [102, 105];

  // Visibility logic calculation
  const evalVisibility = (xminVal: number, xmaxVal: number) => {
    // Is xmin committed & < snapshotXmin?
    if (xminVal < snapshotXmin) {
      if (xmaxVal === 0) return { visible: true, reason: 'xmin committed (< snapshot xmin) and xmax=0 (not deleted)' };
      if (xmaxVal >= snapshotXmax || activeTxns.includes(xmaxVal)) {
        return { visible: true, reason: 'xmin committed; deletion (xmax) was uncommitted or started after snapshot' };
      }
      return { visible: false, reason: 'xmin committed, but tuple was deleted by committed xmax before snapshot' };
    }
    if (activeTxns.includes(xminVal)) {
      return { visible: false, reason: 'xmin is in active txns list (xip_list) — uncommitted to this snapshot' };
    }
    if (xminVal >= snapshotXmax) {
      return { visible: false, reason: 'xmin >= snapshot xmax — created after snapshot was taken' };
    }
    return { visible: true, reason: 'xmin committed before snapshot' };
  };

  const currentField = TUPLE_FIELDS.find(f => f.name === selectedField) ?? TUPLE_FIELDS[0];
  const visResult = evalVisibility(testTxnId, 0);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .pg-mvcc-grid { grid-template-columns: 1fr !important; } }`}</style>
      
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          PostgreSQL HeapTupleHeaderData & Snapshot Visibility Calculator
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="pg-mvcc-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
          
          {/* Left Pane: Tuple Header Bitfield Explorer */}
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '10px' }}>
              HeapTupleHeaderData (23 Bytes Physical Layout)
            </div>

            {/* Tuple Header Buttons Layout */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
              {TUPLE_FIELDS.map(f => {
                const isSel = selectedField === f.name;
                return (
                  <button
                    key={f.name}
                    onClick={() => setSelectedField(f.name)}
                    style={{
                      flex: 1,
                      minWidth: '80px',
                      padding: '8px 6px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'center',
                      background: isSel ? `${f.color}25` : 'rgba(255,255,255,0.03)',
                      boxShadow: isSel ? `0 0 0 1.5px ${f.color}` : '0 0 0 1px rgba(255,255,255,0.08)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, color: isSel ? f.color : 'var(--ifm-color-content)' }}>{f.name}</div>
                    <div style={{ fontSize: '9.5px', color: 'var(--ifm-color-content-secondary)' }}>{f.bytes}</div>
                  </button>
                );
              })}
            </div>

            {/* Field Details */}
            <div style={{
              background: `${currentField.color}0d`,
              border: `1px solid ${currentField.color}30`,
              borderRadius: '8px',
              padding: '12px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: currentField.color }}>{currentField.name}</span>
                <code style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>{currentField.bytes}</code>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 8px', lineHeight: 1.5 }}>
                {currentField.role}
              </p>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '6px 8px', borderRadius: '4px', fontSize: '10.5px' }}>
                <span style={{ color: 'var(--ifm-color-content-secondary)' }}>Sample Byte Value: </span>
                <code style={{ color: currentField.color, fontWeight: 700 }}>{currentField.example}</code>
              </div>
            </div>
          </div>

          {/* Right Pane: Interactive Snapshot Visibility Evaluator */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#2dd4bf', textTransform: 'uppercase', marginBottom: '8px' }}>
                Snapshot Visibility Calculator (xmin:xmax:xip_list)
              </div>
              
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px', fontSize: '11px', marginBottom: '10px' }}>
                Active Snapshot: <code style={{ color: '#2dd4bf' }}>100:108:102,105</code>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                  (xmin=100, xmax=108, active=[102, 105])
                </div>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', display: 'block', marginBottom: '4px' }}>
                  Test Tuple Created By xmin:
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[95, 102, 105, 110].map(id => (
                    <button
                      key={id}
                      onClick={() => setTestTxnId(id)}
                      style={{
                        flex: 1,
                        padding: '6px 4px',
                        borderRadius: '5px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '11px',
                        background: testTxnId === id ? 'rgba(45,212,191,0.2)' : 'rgba(255,255,255,0.04)',
                        color: testTxnId === id ? '#2dd4bf' : 'var(--ifm-color-content-secondary)',
                        boxShadow: testTxnId === id ? '0 0 0 1.5px #2dd4bf' : '0 0 0 1px rgba(255,255,255,0.08)',
                      }}
                    >
                      Trx #{id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Result Box */}
              <div style={{
                background: visResult.visible ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
                border: `1px solid ${visResult.visible ? 'rgba(52,211,153,0.4)' : 'rgba(248,113,113,0.4)'}`,
                borderRadius: '6px',
                padding: '10px',
              }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: visResult.visible ? '#34d399' : '#f87171', marginBottom: '2px' }}>
                  {visResult.visible ? '✓ TUPLE VISIBLE TO SNAPSHOT' : '✗ TUPLE INVISIBLE TO SNAPSHOT'}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.4 }}>
                  {visResult.reason}
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
