import React, { useState } from 'react';

interface SchemaField {
  name: string;
  bytes: string;
  color: string;
  offset: string;
  desc: string;
  hexValue: string;
}

const UPDATE_FIELDS: SchemaField[] = [
  { name: 'trx_id', bytes: '6 Bytes', color: '#fbbf24', offset: '0x00 - 0x05', desc: 'Transaction ID of the transaction that mutated this row.', hexValue: '0x00 0x00 0x00 0x00 0x00 0xC8 (200)' },
  { name: 'roll_ptr', bytes: '7 Bytes', color: '#38bdf8', offset: '0x06 - 0x0C', desc: '7-byte undo log pointer to previous undo record creating historical reverse chain.', hexValue: '0x01 0x42 0x7F 0x00 0x00 0x12 0x04' },
  { name: 'rec_type', bytes: '1 Byte', color: '#a78bfa', offset: '0x0D', desc: 'Mutation type identifier (12 = TRX_UNDO_UPD_EXIST_REC).', hexValue: '0x0C (TRX_UNDO_UPD_EXIST_REC)' },
  { name: 'table_id', bytes: '8 Bytes', color: '#2dd4bf', offset: '0x0E - 0x15', desc: 'Internal storage dictionary table identifier.', hexValue: '0x00 0x00 0x00 0x00 0x00 0x00 0x04 0xD2' },
  { name: 'before_image_payload', bytes: 'Variable', color: '#34d399', offset: '0x16 ...', desc: 'Delta payload storing original column before-images (e.g. balance=500).', hexValue: '0x62 0x61 0x6C 0x61 0x6E 0x63 0x65 0x3D 0x35 0x30 0x30' },
];

const INSERT_FIELDS: SchemaField[] = [
  { name: 'trx_id', bytes: '6 Bytes', color: '#fbbf24', offset: '0x00 - 0x05', desc: 'Transaction ID of the transaction that inserted this row.', hexValue: '0x00 0x00 0x00 0x00 0x00 0x96 (150)' },
  { name: 'roll_ptr', bytes: '7 Bytes', color: '#38bdf8', offset: '0x06 - 0x0C', desc: '7-byte undo log pointer (0 for initial insert record).', hexValue: '0x00 0x00 0x00 0x00 0x00 0x00 0x00' },
  { name: 'rec_type', bytes: '1 Byte', color: '#a78bfa', offset: '0x0D', desc: 'Mutation type identifier (11 = TRX_UNDO_INSERT_REC).', hexValue: '0x0B (TRX_UNDO_INSERT_REC)' },
  { name: 'table_id', bytes: '8 Bytes', color: '#2dd4bf', offset: '0x0E - 0x15', desc: 'Internal storage dictionary table identifier.', hexValue: '0x00 0x00 0x00 0x00 0x00 0x00 0x04 0xD2' },
  { name: 'row_primary_key', bytes: 'Variable', color: '#f97316', offset: '0x16 ...', desc: 'Primary key value inserted (allows rollback by deleting PK on abort).', hexValue: '0x69 0x64 0x3D 0x31 (id=1)' },
];

export default function AcidUndoRecordStructureDiagram(): React.JSX.Element {
  const [recTypeMode, setRecTypeMode] = useState<'update' | 'insert'>('update');
  const [selectedFieldName, setSelectedFieldName] = useState<string>('trx_id');

  const fields = recTypeMode === 'update' ? UPDATE_FIELDS : INSERT_FIELDS;
  const current = fields.find(f => f.name === selectedFieldName) ?? fields[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .undo-struct-grid { grid-template-columns: 1fr !important; } }`}</style>

      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M7 8h10" />
          <path d="M7 12h10" />
          <path d="M7 16h6" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Undo Record Physical Binary Inspector
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => { setRecTypeMode('update'); setSelectedFieldName('trx_id'); }}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '11px',
              background: recTypeMode === 'update' ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.04)',
              color: recTypeMode === 'update' ? '#fbbf24' : 'var(--ifm-color-content-secondary)',
              boxShadow: recTypeMode === 'update' ? '0 0 0 1.5px #fbbf24' : '0 0 0 1px rgba(255,255,255,0.08)',
            }}
          >
            TRX_UNDO_UPD_EXIST_REC
          </button>
          <button
            onClick={() => { setRecTypeMode('insert'); setSelectedFieldName('trx_id'); }}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '11px',
              background: recTypeMode === 'insert' ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.04)',
              color: recTypeMode === 'insert' ? '#a78bfa' : 'var(--ifm-color-content-secondary)',
              boxShadow: recTypeMode === 'insert' ? '0 0 0 1.5px #a78bfa' : '0 0 0 1px rgba(255,255,255,0.08)',
            }}
          >
            TRX_UNDO_INSERT_REC
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="undo-struct-grid" style={{ display: 'grid', gridTemplateColumns: '58% 42%', gap: '16px', alignItems: 'start' }}>
          
          {/* Left Pane: Monospace Record Layout Block */}
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '10px' }}>
              Physical Binary Record Fields (Click Field to Inspect)
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
              {fields.map(f => {
                const isSel = current.name === f.name;
                return (
                  <button
                    key={f.name}
                    onClick={() => setSelectedFieldName(f.name)}
                    style={{
                      flex: 1,
                      minWidth: '90px',
                      padding: '10px 8px',
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

            {/* Hex Byte Inspector Box */}
            <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '6px', padding: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Byte Offset Stream ({current.offset})
              </div>
              <code style={{ fontSize: '11px', color: current.color, fontWeight: 700, wordBreak: 'break-all' }}>
                {current.hexValue}
              </code>
            </div>
          </div>

          {/* Right Pane: Selected Field Description */}
          <div className={`interactive-diagram-details-card details-${current.name === 'trx_id' ? 'yellow' : current.name === 'roll_ptr' ? 'blue' : current.name === 'rec_type' ? 'purple' : 'teal'}`} style={{ minHeight: '180px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: current.color, textTransform: 'uppercase', marginBottom: '2px' }}>
              Field Offset: {current.offset}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '8px' }}>
              <code>{current.name}</code> ({current.bytes})
            </div>
            <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 12px', lineHeight: 1.6 }}>
              {current.desc}
            </p>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: '6px', fontSize: '11px' }}>
              <span style={{ color: 'var(--ifm-color-content-secondary)' }}>Storage Engine Usage: </span>
              <strong style={{ color: current.color }}>
                {recTypeMode === 'update' ? 'Restores before-image on ROLLBACK & powers MVCC snapshot traversal' : 'Used to delete newly inserted primary key on ROLLBACK'}
              </strong>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
