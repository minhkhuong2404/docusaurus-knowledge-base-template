import React, { useState } from 'react';

interface ArchitectureMode {
  id: string;
  name: string;
  badge: string;
  color: string;
  storageLayout: string;
  queryPattern: string;
  ioCharacteristics: string;
  schemaExample: string;
}

const MODES: ArchitectureMode[] = [
  {
    id: 'oltp',
    name: '1. OLTP (Row-Oriented)',
    badge: 'Transactional',
    color: '#38bdf8',
    description: 'Stores data row-by-row on disk pages. Ideal for fast single-record lookup (`SELECT * WHERE id = 42`) and concurrent ACID transactions.',
    storageLayout: 'Row Storage: [Row1: ID, Name, Age, Email] -> [Row2: ID, Name, Age, Email]',
    queryPattern: 'Point lookups & targeted updates (`UPDATE accounts SET balance = balance - 100`)',
    ioCharacteristics: 'Scatters disk reads across all columns even if query only requests 1 column.',
    schemaExample: 'Normalized 3NF Relational Tables (PostgreSQL, MySQL, Oracle)',
  },
  {
    id: 'olap',
    name: '2. OLAP (Column-Oriented)',
    badge: 'Analytical Engine',
    color: '#34d399',
    description: 'Stores data column-by-column on disk blocks with heavy compression. Ideal for scanning billions of rows over a few columns (`SUM(sales) GROUP BY year`).',
    storageLayout: 'Column Storage: [Col_ID: 1, 2...] -> [Col_Sales: 100, 200...] -> [Col_Year: 2026, 2026...]',
    queryPattern: 'Aggregations over massive datasets (`SUM`, `AVG`, `COUNT`, `GROUP BY`)',
    ioCharacteristics: 'Reads ONLY the specific columns requested in SELECT, ignoring unneeded attributes.',
    schemaExample: 'Columnar Data Warehouses (Snowflake, ClickHouse, Amazon Redshift, Google BigQuery)',
  },
  {
    id: 'star-schema',
    name: '3. Star Schema (Dimensional)',
    badge: 'Denormalized OLAP',
    color: '#fbbf24',
    description: 'Central Fact table containing quantitative metrics (e.g. `Sales_Fact`), surrounded by denormalized Dimension tables (e.g. `Dim_Customer`, `Dim_Date`).',
    storageLayout: 'Single-hop JOINs between Fact and Dimension tables.',
    queryPattern: 'Simple, high-performance BI reporting & OLAP slice/dice queries.',
    ioCharacteristics: 'Faster query execution due to fewer table JOINs; minor data redundancy in dimensions.',
    schemaExample: 'Fact_Sales -> Dim_Customer, Dim_Product, Dim_Date, Dim_Store',
  },
  {
    id: 'snowflake-schema',
    name: '4. Snowflake Schema (Normalized Dimensional)',
    badge: 'Normalized OLAP',
    color: '#c084fc',
    description: 'Variation of Star Schema where Dimension tables are further normalized into sub-dimensions (e.g. `Dim_Product` -> `Dim_SubCategory` -> `Dim_Category`).',
    storageLayout: 'Multi-hop hierarchical JOINs across normalized dimensions.',
    queryPattern: 'Complex analytical queries where dimensions are shared across business domains.',
    ioCharacteristics: 'Saves storage space in dimension tables but requires more JOINs during analysis.',
    schemaExample: 'Fact_Sales -> Dim_Product -> Dim_Category -> Dim_Department',
  },
];

export default function DataWarehousingOlapDiagram(): React.JSX.Element {
  const [selectedMode, setSelectedMode] = useState<ArchitectureMode>(MODES[1]); // Default to OLAP

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          OLTP vs OLAP Storage Engines & Dimensional Data Warehousing
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {MODES.map((m) => {
            const isSelected = m.id === selectedMode.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMode(m)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: isSelected ? `1px solid ${m.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: isSelected ? `${m.color}15` : '#0c0e17',
                  color: isSelected ? '#fff' : 'var(--ifm-color-content-secondary)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 400,
                  fontSize: '12px',
                }}
              >
                {m.name}
              </button>
            );
          })}
        </div>

        {/* Selected Mode Summary */}
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', borderLeft: `4px solid ${selectedMode.color}`, marginBottom: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>{selectedMode.name}</span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: `${selectedMode.color}22`, color: selectedMode.color, fontWeight: 700 }}>
              {selectedMode.badge}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            {selectedMode.storageLayout}
          </p>
        </div>

        {/* Technical Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Query & Workload Pattern
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', marginBottom: '10px', lineHeight: 1.4 }}>
              {selectedMode.queryPattern}
            </div>

            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              I/O Column Selective Behavior
            </div>
            <div style={{ fontSize: '12.5px', color: selectedMode.color, fontWeight: 600 }}>
              {selectedMode.ioCharacteristics}
            </div>
          </div>

          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '6px', fontWeight: 600 }}>
              Schema Architecture & Storage Tech
            </div>
            <div style={{ fontSize: '12.5px', fontFamily: 'monospace', color: '#38bdf8', backgroundColor: '#05070e', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
              {selectedMode.schemaExample}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
