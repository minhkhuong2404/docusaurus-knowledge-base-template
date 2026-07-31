import React, { useState } from 'react';

interface NormalForm {
  level: string;
  name: string;
  badge: string;
  color: string;
  coreRule: string;
  anomalyFixed: string;
  exampleViolation: string;
}

const FORMS: NormalForm[] = [
  {
    level: '1NF',
    name: '1. First Normal Form (1NF)',
    badge: 'Atomic Values',
    color: '#38bdf8',
    coreRule: 'Each table cell must contain a single atomic value. No repeating groups or comma-separated lists.',
    anomalyFixed: 'Prevents impossible indexing and partial string search bottlenecks.',
    exampleViolation: `UNF Violation: user_id=1, phone="555-1234, 555-9999"\n1NF Fix: Split into two rows (user_id=1, phone="555-1234"), (user_id=1, phone="555-9999")`,
  },
  {
    level: '2NF',
    name: '2. Second Normal Form (2NF)',
    badge: 'No Partial Dependencies',
    color: '#fbbf24',
    coreRule: 'Must be in 1NF. Every non-key attribute must depend on the ENTIRE Composite Primary Key, not just part of it.',
    anomalyFixed: 'Eliminates update anomalies on partial composite keys.',
    exampleViolation: `2NF Violation: PK=(order_id, product_id), attribute product_name depends ONLY on product_id!\n2NF Fix: Move product_name out to standalone Products table.`,
  },
  {
    level: '3NF',
    name: '3. Third Normal Form (3NF)',
    badge: 'No Transitive Dependencies',
    color: '#34d399',
    coreRule: 'Must be in 2NF. Every non-key attribute must depend ONLY on the primary key ("The key, the whole key, and nothing but the key").',
    anomalyFixed: 'Eliminates transitive dependencies (A -> B -> C).',
    exampleViolation: `3NF Violation: Table (user_id PK, zip_code, city_name). city_name depends on zip_code, not user_id!\n3NF Fix: Move (zip_code PK, city_name) to ZipCodes table.`,
  },
  {
    level: 'BCNF',
    name: '4. Boyce-Codd Normal Form (BCNF)',
    badge: 'Strict Functional Determinants',
    color: '#c084fc',
    coreRule: 'Must be in 3NF. For every functional dependency X -> Y, X MUST be a Super Key.',
    anomalyFixed: 'Eliminates overlapping candidate key redundancies.',
    exampleViolation: `BCNF Violation: Overlapping candidate keys where non-key attribute determines part of a key.`,
  },
];

export default function DatabaseDesignNormalizationDiagram(): React.JSX.Element {
  const [selectedFormIndex, setSelectedFormIndex] = useState<number>(2); // Default to 3NF
  const selectedForm = FORMS[selectedFormIndex];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Database Normalization Rules (1NF ➔ 2NF ➔ 3NF ➔ BCNF)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Form Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {FORMS.map((f, idx) => {
            const isSelected = idx === selectedFormIndex;
            return (
              <button
                key={f.level}
                onClick={() => setSelectedFormIndex(idx)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: isSelected ? `1px solid ${f.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: isSelected ? `${f.color}15` : '#0c0e17',
                  color: isSelected ? '#fff' : 'var(--ifm-color-content-secondary)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 400,
                  fontSize: '13px',
                }}
              >
                {f.level}
              </button>
            );
          })}
        </div>

        {/* Selected Form Details */}
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', borderLeft: `4px solid ${selectedForm.color}`, marginBottom: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>{selectedForm.name}</span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: `${selectedForm.color}22`, color: selectedForm.color, fontWeight: 700 }}>
              {selectedForm.badge}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            {selectedForm.coreRule}
          </p>
        </div>

        {/* Grid Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Data Anomaly Prevented
            </div>
            <div style={{ fontSize: '12.5px', color: selectedForm.color, fontWeight: 600, lineHeight: 1.4 }}>
              {selectedForm.anomalyFixed}
            </div>
          </div>

          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '6px', fontWeight: 600 }}>
              Violation Example & Solution
            </div>
            <pre style={{ margin: 0, padding: '8px', backgroundColor: '#05070e', borderRadius: '6px', fontSize: '11.5px', fontFamily: 'monospace', color: '#38bdf8', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)', lineHeight: 1.4 }}>
              <code>{selectedForm.exampleViolation}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
