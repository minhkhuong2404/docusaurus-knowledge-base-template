import React, { useState } from 'react';

interface WalField {
  name: string;
  bytes: string;
  color: string;
  offset: string;
  desc: string;
  example: string;
}

const WAL_FIELDS: WalField[] = [
  { name: 'LSN', bytes: '8 Bytes', color: '#38bdf8', offset: '0x00 - 0x07', desc: 'Log Sequence Number: 64-bit monotonically increasing byte offset in WAL log stream.', example: '0x0000000002A381F0' },
  { name: 'rmid', bytes: '1 Byte', color: '#fbbf24', offset: '0x08', desc: 'Resource Manager ID identifying target subsystem (e.g. RM_HEAP_ID = 10, RM_BTREE_ID = 11).', example: '0x0A (RM_HEAP_ID)' },
  { name: 'xl_info', bytes: '1 Byte', color: '#a78bfa', offset: '0x09', desc: 'Flag byte storing record sub-type information (e.g. XLOG_HEAP_INSERT, XLOG_HEAP_UPDATE).', example: '0x20 (XLOG_HEAP_UPDATE)' },
  { name: 'xl_tot_len', bytes: '4 Bytes', color: '#2dd4bf', offset: '0x0A - 0x0D', desc: 'Total byte length of this WAL record including headers and alignment padding.', example: '0x00000064 (100 Bytes)' },
  { name: 'Payload & CRC32', bytes: 'Variable', color: '#34d399', offset: '0x0E ...', desc: 'Redo page offset, tuple delta bytes, block reference data, and 32-bit CRC checksum.', example: '0x3F82C10A ... [CRC: 0x9B42A1E8]' },
];

export default function AcidWalRecordAnatomyDiagram(): React.JSX.Element {
  const [selectedFieldName, setSelectedFieldName] = useState('LSN');

  const current = WAL_FIELDS.find(f => f.name === selectedFieldName) ?? WAL_FIELDS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .wal-anatomy-grid { grid-template-columns: 1fr !important; } }`}</style>

      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Physical Binary WAL Record Layout Inspector
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="wal-anatomy-grid" style={{ display: 'grid', gridTemplateColumns: '58% 42%', gap: '16px', alignItems: 'start' }}>
          
          {/* Left: Monospace Field Selector */}
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '10px' }}>
              XLogRecord Binary Layout (Click Field to Inspect)
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
              {WAL_FIELDS.map(f => {
                const isSel = current.name === f.name;
                return (
                  <button
                    key={f.name}
                    onClick={() => setSelectedFieldName(f.name)}
                    style={{
                      flex: 1,
                      minWidth: '80px',
                      padding: '10px 6px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'center',
                      background: isSel ? `${f.color}25` : 'rgba(255,255,255,0.03)',
                      boxShadow: isSel ? `0 0 0 1.5px ${f.color}` : '0 0 0 1px rgba(255,255,255,0.08)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <code style={{ fontSize: '11px', fontWeight: 700, color: isSel ? f.color : 'var(--ifm-color-content)', display: 'block' }}>
                      {f.name}
                    </code>
                    <span style={{ fontSize: '9.5px', color: 'var(--ifm-color-content-secondary)' }}>{f.bytes}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px', fontSize: '11px' }}>
              <span style={{ color: 'var(--ifm-color-content-secondary)' }}>Binary Hex Value: </span>
              <code style={{ color: current.color, fontWeight: 700 }}>{current.example}</code>
            </div>
          </div>

          {/* Right: Field Detail Card */}
          <div className={`interactive-diagram-details-card details-${current.name === 'LSN' ? 'blue' : current.name === 'rmid' ? 'yellow' : current.name === 'xl_info' ? 'purple' : 'green'}`} style={{ minHeight: '180px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: current.color, textTransform: 'uppercase', marginBottom: '2px' }}>
              Byte Offset: {current.offset}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '8px' }}>
              <code>{current.name}</code> ({current.bytes})
            </div>
            <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 12px', lineHeight: 1.6 }}>
              {current.desc}
            </p>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: '6px', fontSize: '11px' }}>
              <span style={{ color: 'var(--ifm-color-content-secondary)' }}>Crash Recovery Role: </span>
              <strong style={{ color: current.color }}>
                {current.name === 'LSN' && 'Compared against page_lsn during ARIES Redo pass to determine if page needs replay'}
                {current.name === 'rmid' && 'Routes log replay to appropriate resource manager (Heap vs B-Tree handler)'}
                {current.name === 'xl_info' && 'Identifies exact operation type (INSERT, UPDATE, HOT_UPDATE, DELETE)'}
                {current.name === 'xl_tot_len' && 'Determines byte boundary to advance WAL log parser'}
                {current.name === 'Payload & CRC32' && 'Contains binary delta bytes and CRC checksum to ensure uncorrupted replay'}
              </strong>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
