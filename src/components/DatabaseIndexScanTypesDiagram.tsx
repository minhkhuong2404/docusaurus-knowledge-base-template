import React, { useState } from 'react';

interface ScanType {
  id: string;
  name: string;
  badge: string;
  color: string;
  description: string;
  ioPattern: string;
  tablePagesRead: string;
  indexPagesRead: string;
  bestFor: string;
  exampleQuery: string;
}

const SCANS: ScanType[] = [
  {
    id: 'seq-scan',
    name: '1. Sequential Scan (Seq Scan)',
    badge: 'Full Table Scan',
    color: '#f87171',
    description: 'Reads every single block/page of the table from disk to find matching rows. Slow for small queries, fast for reading >20% of a large table.',
    ioPattern: 'Sequential Disk I/O (high throughput, reads unneeded pages).',
    tablePagesRead: '100% of Table Pages (e.g. 10,000 pages)',
    indexPagesRead: '0 pages (Index not used)',
    bestFor: 'Small tables, or queries returning a large fraction (>20%) of total rows.',
    exampleQuery: `SELECT * FROM users WHERE active = true; -- 90% of table matches`,
  },
  {
    id: 'index-scan',
    name: '2. Index Scan',
    badge: 'B-Tree Lookup + Heap Fetch',
    color: '#38bdf8',
    description: 'Traverses the B-Tree index to find matching tuple IDs (TIDs), then fetches individual rows from table heap pages.',
    ioPattern: 'Random Disk I/O (B-Tree traversal followed by scattered heap page fetches).',
    tablePagesRead: 'Target Heap Pages only (e.g. 15 pages)',
    indexPagesRead: 'B-Tree Depth Pages (e.g. 3 pages)',
    bestFor: 'High-selectivity queries returning <5% of total table rows.',
    exampleQuery: `SELECT * FROM users WHERE email = 'alice@example.com';`,
  },
  {
    id: 'index-only-scan',
    name: '3. Index-Only Scan (Covering Index)',
    badge: 'Zero Heap Access',
    color: '#34d399',
    description: 'All requested columns are contained directly inside the index key/INCLUDE payload. Never reads the table heap!',
    ioPattern: 'Sequential/Random Index I/O only (Zero Table Heap I/O).',
    tablePagesRead: '0 Heap Pages (Checked via Visibility Map)',
    indexPagesRead: 'B-Tree Depth Pages (e.g. 3 pages)',
    bestFor: 'Read-heavy queries where index covers all SELECT and WHERE columns.',
    exampleQuery: `CREATE INDEX idx_user_name_email ON users(name) INCLUDE (email);\nSELECT email FROM users WHERE name = 'Alice';`,
  },
  {
    id: 'bitmap-index-scan',
    name: '4. Bitmap Index Scan',
    badge: 'Multi-Index Combination',
    color: '#fbbf24',
    description: 'Scans one or more indexes to build an in-memory bitmap of physical block offsets, sorts them, and fetches heap pages in physical disk order.',
    ioPattern: 'Sequentialized Heap I/O (combines multiple index filters like AND/OR).',
    tablePagesRead: 'Physical Block Sorted Pages (e.g. 40 pages)',
    indexPagesRead: 'Multiple Index Pages (e.g. 8 pages)',
    bestFor: 'Queries combining multiple indexed columns (`status = ACTIVE AND category = TECH`).',
    exampleQuery: `SELECT * FROM products WHERE category = 'Electronics' AND status = 'IN_STOCK';`,
  },
];

export default function DatabaseIndexScanTypesDiagram(): React.JSX.Element {
  const [selectedScan, setSelectedScan] = useState<ScanType>(SCANS[1]); // Default to Index Scan

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Database Index Scan Types & I/O Execution Cost Simulator
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {SCANS.map((sc) => {
            const isSelected = sc.id === selectedScan.id;
            return (
              <button
                key={sc.id}
                onClick={() => setSelectedScan(sc)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: isSelected ? `1px solid ${sc.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: isSelected ? `${sc.color}15` : '#0c0e17',
                  color: isSelected ? '#fff' : 'var(--ifm-color-content-secondary)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 400,
                  fontSize: '12px',
                }}
              >
                {sc.name}
              </button>
            );
          })}
        </div>

        {/* Selected Scan Overview Card */}
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', borderLeft: `4px solid ${selectedScan.color}`, marginBottom: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>{selectedScan.name}</span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: `${selectedScan.color}22`, color: selectedScan.color, fontWeight: 700 }}>
              {selectedScan.badge}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            {selectedScan.description}
          </p>
        </div>

        {/* I/O & Execution Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Disk I/O Pattern
            </div>
            <div style={{ fontSize: '13px', color: selectedScan.color, fontWeight: 700, marginBottom: '10px' }}>
              {selectedScan.ioPattern}
            </div>

            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Table Heap Pages Scanned
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', marginBottom: '10px' }}>
              {selectedScan.tablePagesRead}
            </div>

            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Index Pages Touched
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)' }}>
              {selectedScan.indexPagesRead}
            </div>
          </div>

          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '6px', fontWeight: 600 }}>
              SQL Query Example & Optimizer Trigger
            </div>
            <pre style={{ margin: '0 0 10px 0', padding: '8px', backgroundColor: '#05070e', borderRadius: '6px', fontSize: '11.5px', fontFamily: 'monospace', color: '#38bdf8', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
              <code>{selectedScan.exampleQuery}</code>
            </pre>

            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Optimal Workload Scenario
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
              {selectedScan.bestFor}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
