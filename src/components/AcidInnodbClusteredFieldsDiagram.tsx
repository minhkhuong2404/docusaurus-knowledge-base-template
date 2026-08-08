import React, { useState } from 'react';

interface InnodbField {
  name: string;
  bytes: string;
  color: string;
  role: string;
  example: string;
}

const INNODB_FIELDS: InnodbField[] = [
  { name: 'DB_TRX_ID', bytes: '6 Bytes', color: '#f97316', role: 'Transaction ID of the last statement that inserted or updated this index record.', example: '0x00 0x00 0x00 0x00 0x00 0xC8 (200)' },
  { name: 'DB_ROLL_PTR', bytes: '7 Bytes', color: '#fbbf24', role: 'Pointer to the undo log record in the rollback segment containing the before-image delta.', example: '0x01 0x42 0x7F 0x00 0x00 0x12 0x04' },
  { name: 'DB_ROW_ID', bytes: '6 Bytes', color: '#38bdf8', role: 'Auto-incrementing row ID generated automatically when a table has no explicit Primary Key.', example: '0x00 0x00 0x00 0x00 0x01 0x2C (300)' },
  { name: 'User Columns', bytes: 'Variable', color: '#34d399', role: 'Actual user data column values stored inline inside the B-Tree clustered leaf page.', example: 'id=1, name="Alice", balance=400.00' },
];

export default function AcidInnodbClusteredFieldsDiagram(): React.JSX.Element {
  const [selectedFieldName, setSelectedFieldName] = useState('DB_TRX_ID');

  const current = INNODB_FIELDS.find(f => f.name === selectedFieldName) ?? INNODB_FIELDS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .innodb-fields-grid { grid-template-columns: 1fr !important; } }`}</style>

      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          InnoDB Clustered Index Hidden System Fields
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="innodb-fields-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
          
          {/* Left Pane: Visual Record Memory Block */}
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#f97316', textTransform: 'uppercase', marginBottom: '10px' }}>
              InnoDB Clustered Index Physical Layout (Click Field to Inspect)
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
              {INNODB_FIELDS.map(f => {
                const isSel = selectedFieldName === f.name;
                return (
                  <button
                    key={f.name}
                    onClick={() => setSelectedFieldName(f.name)}
                    style={{
                      flex: 1,
                      minWidth: '85px',
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
              <span style={{ color: 'var(--ifm-color-content-secondary)' }}>Sample Memory Offset Value: </span>
              <code style={{ color: current.color, fontWeight: 700 }}>{current.example}</code>
            </div>
          </div>

          {/* Right Pane: Field Detail Card */}
          <div className={`interactive-diagram-details-card details-${current.name === 'DB_TRX_ID' ? 'yellow' : current.name === 'DB_ROLL_PTR' ? 'yellow' : current.name === 'DB_ROW_ID' ? 'blue' : 'green'}`} style={{ minHeight: '180px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: current.color, textTransform: 'uppercase', marginBottom: '2px' }}>
              Hidden System Field ({current.bytes})
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '8px' }}>
              <code>{current.name}</code>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 12px', lineHeight: 1.6 }}>
              {current.role}
            </p>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: '6px', fontSize: '11px' }}>
              <span style={{ color: 'var(--ifm-color-content-secondary)' }}>Key Engine Purpose: </span>
              <strong style={{ color: current.color }}>
                {current.name === 'DB_TRX_ID' && 'Evaluated against ReadView boundaries to determine if record is visible to active snapshot'}
                {current.name === 'DB_ROLL_PTR' && 'Followed by storage engine to locate Undo Log before-image and reconstruct older row versions'}
                {current.name === 'DB_ROW_ID' && 'Internal unique key used as the implicit clustered index when no explicit Primary Key is defined'}
                {current.name === 'User Columns' && 'Inline leaf page data payload satisfying covering queries without secondary table lookups'}
              </strong>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
