import React, { useState } from 'react';

type TabType = 'page-anatomy' | 'ctid-lookup' | 'hot-update' | 'mvcc-visibility' | 'vacuum-lifecycle';

interface PageRegion {
  id: string;
  name: string;
  bytes: string;
  color: string;
  direction: string;
  description: string;
  fields: { name: string; size: string; purpose: string }[];
}

const PAGE_REGIONS: PageRegion[] = [
  {
    id: 'header',
    name: 'PageHeaderData',
    bytes: '24 Bytes',
    color: '#38bdf8',
    direction: 'Starts at Byte 0',
    description: 'Fixed 24-byte header describing page state, WAL LSN, flags, and boundaries of free space.',
    fields: [
      { name: 'pd_lsn (8B)', size: '8 Bytes', purpose: 'Log Sequence Number of the last WAL record that modified this page' },
      { name: 'pd_checksum (2B)', size: '2 Bytes', purpose: 'Page checksum for data corruption detection (if data_checksums enabled)' },
      { name: 'pd_flags (2B)', size: '2 Bytes', purpose: 'Page flags (PD_HAS_FREE_LINES, PD_PAGE_FULL, PD_ALL_VISIBLE)' },
      { name: 'pd_lower (2B)', size: '2 Bytes', purpose: 'Byte offset pointing to the end of the line pointers (start of free space)' },
      { name: 'pd_upper (2B)', size: '2 Bytes', purpose: 'Byte offset pointing to the start of newest tuple data (end of free space)' },
      { name: 'pd_special (2B)', size: '2 Bytes', purpose: 'Offset to special space at end of page (used by index pages; 8192 in heap)' },
      { name: 'pd_pagesize_version (2B)', size: '2 Bytes', purpose: 'Page size (8192) and layout version number (PostgreSQL 12-16 = version 4)' },
      { name: 'pd_prune_xid (4B)', size: '4 Bytes', purpose: 'Oldest unpruned XMAX on page (hint for opportunistic HOT pruning)' }
    ]
  },
  {
    id: 'line-pointers',
    name: 'Line Pointers (ItemIdData)',
    bytes: '4 Bytes each (grows ↓)',
    color: '#34d399',
    direction: 'Starts after Header (Byte 24) → grows downward towards pd_lower',
    description: 'Array of 32-bit item pointers (ItemId). Indirection layer enabling row defragmentation without breaking index pointers.',
    fields: [
      { name: 'lp_off (15 bits)', size: '15 bits', purpose: 'Byte offset from start of page to the actual HeapTuple on this page' },
      { name: 'lp_flags (2 bits)', size: '2 bits', purpose: '0: LP_UNUSED, 1: LP_NORMAL (live), 2: LP_REDIRECT (HOT chain), 3: LP_DEAD' },
      { name: 'lp_len (15 bits)', size: '15 bits', purpose: 'Byte length of the tuple on disk including its HeapTupleHeader' }
    ]
  },
  {
    id: 'free-space',
    name: 'Free Space Gap (Hole)',
    bytes: 'pd_upper - pd_lower',
    color: '#fbbf24',
    direction: 'Between pd_lower and pd_upper',
    description: 'Unallocated contiguous memory. New line pointers grow downwards; new tuple payloads grow upwards. Tracked by Free Space Map (FSM).',
    fields: [
      { name: 'pd_lower boundary', size: '2 Bytes', purpose: 'Points to where the next ItemId (line pointer) will be placed' },
      { name: 'pd_upper boundary', size: '2 Bytes', purpose: 'Points to the starting byte of the latest inserted tuple' },
      { name: 'Available Space', size: 'Dynamic', purpose: 'Space available for new INSERTs or HOT UPDATEs without allocating a new page' }
    ]
  },
  {
    id: 'tuples',
    name: 'Heap Tuples (Data Rows)',
    bytes: 'Variable (grows ↑)',
    color: '#a78bfa',
    direction: 'Starts from bottom (Byte 8192) → grows upward towards pd_upper',
    description: 'Actual physical row versions stored from bottom of page upwards. Each row begins with a 23-byte HeapTupleHeaderData.',
    fields: [
      { name: 't_xmin (4B)', size: '4 Bytes', purpose: 'Transaction ID (XID) that inserted this tuple version' },
      { name: 't_xmax (4B)', size: '4 Bytes', purpose: 'Transaction ID (XID) that deleted/updated this tuple (0 if live and unlocked)' },
      { name: 't_cid / t_xvac (4B)', size: '4 Bytes', purpose: 'Command ID within transaction (distinguishes SQL statements in same XID)' },
      { name: 't_ctid (6B)', size: '6 Bytes', purpose: 'Physical ItemPointer (Block#, Offset#) pointing to self or newer version' },
      { name: 't_infomask2 (2B)', size: '2 Bytes', purpose: 'Attribute count (11 bits) + flags (HEAP_KEYS_UPDATED, HEAP_HOT_UPDATED, HEAP_ONLY_TUPLE)' },
      { name: 't_infomask (2B)', size: '2 Bytes', purpose: 'Visibility flags (HEAP_XMIN_COMMITTED, HEAP_XMIN_INVALID, HEAP_XMAX_COMMITTED, HEAP_HASNULL)' },
      { name: 't_hoff (1B)', size: '1 Byte', purpose: 'Offset from start of tuple header to user column data (aligns to MAXALIGN)' },
      { name: 'User Columns Data', size: 'Variable', purpose: 'Actual column values (e.g. id=42, name=\'Alice\', balance=950.00)' }
    ]
  }
];

export default function PostgresHeapStorageDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabType>('page-anatomy');
  const [selectedRegion, setSelectedRegion] = useState<string>('header');
  const [ctidStep, setCtidStep] = useState<number>(1);
  const [hotScenario, setHotScenario] = useState<'standard' | 'hot'>('hot');
  const [snapshotTxn, setSnapshotTxn] = useState<number>(205);
  const [vacuumStage, setVacuumStage] = useState<number>(1);

  const currentRegion = PAGE_REGIONS.find((r) => r.id === selectedRegion) ?? PAGE_REGIONS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        .pg-heap-grid {
          display: grid;
          grid-template-columns: 50% 50%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .pg-heap-grid {
            grid-template-columns: 1fr !important;
          }
        }
        .pg-tab-btn {
          padding: 8px 14px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }
      `}</style>

      {/* Header bar */}
      <div className="interactive-diagram-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderBottom: '1px solid var(--ifm-color-emphasis-200)', background: 'var(--ifm-color-emphasis-100)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          PostgreSQL Heap Storage & Internals Explorer
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 600 }}>
          8KB Page Architecture
        </span>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '6px', padding: '12px 16px', background: 'var(--ifm-background-surface-color)', borderBottom: '1px solid var(--ifm-color-emphasis-200)', flexWrap: 'wrap' }}>
        {[
          { id: 'page-anatomy', label: '1. 8KB Page & Tuple Anatomy' },
          { id: 'ctid-lookup', label: '2. CTID & Index "Double Hop"' },
          { id: 'hot-update', label: '3. The UPDATE Problem & HOT' },
          { id: 'mvcc-visibility', label: '4. MVCC Visibility & Bloat' },
          { id: 'vacuum-lifecycle', label: '5. VACUUM vs VACUUM FULL' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className="pg-tab-btn"
            style={{
              background: activeTab === tab.id ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
              color: activeTab === tab.id ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
              borderColor: activeTab === tab.id ? '#38bdf8' : 'var(--ifm-color-emphasis-300)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Tab Content Area */}
      <div style={{ padding: '18px' }}>
        {/* TAB 1: 8KB PAGE & TUPLE ANATOMY */}
        {activeTab === 'page-anatomy' && (
          <div>
            <div style={{ marginBottom: '14px', fontSize: '13px', color: 'var(--ifm-color-content-secondary)' }}>
              In PostgreSQL, tables are stored in <strong>8KB (8192-byte) Pages</strong> inside Heap files. Click on any section of the 8KB page slice below to inspect its binary structure, memory growth direction, and exact header fields.
            </div>

            <div className="pg-heap-grid">
              {/* Left Column: Visual Page Layout */}
              <div style={{ background: 'var(--ifm-color-emphasis-100)', padding: '14px', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', color: 'var(--ifm-color-content-secondary)' }}>
                  8192-Byte Page Layout (Offset 0 to 8192)
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {PAGE_REGIONS.map((region) => (
                    <div
                      key={region.id}
                      onClick={() => setSelectedRegion(region.id)}
                      style={{
                        padding: '12px',
                        borderRadius: '6px',
                        border: `2px solid ${selectedRegion === region.id ? region.color : 'transparent'}`,
                        background: selectedRegion === region.id ? `${region.color}15` : 'var(--ifm-background-surface-color)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: region.color }}>
                          {region.name}
                        </span>
                        <span style={{ fontSize: '11px', fontFamily: 'monospace', padding: '2px 6px', borderRadius: '4px', background: 'var(--ifm-color-emphasis-200)', color: 'var(--ifm-color-content)' }}>
                          {region.bytes}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
                        {region.direction}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Growth indicator arrows */}
                <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(251, 191, 36, 0.08)', borderRadius: '6px', border: '1px dashed #fbbf24', fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
                  <strong style={{ color: '#fbbf24' }}>Slotted Page Architecture:</strong> Line pointers grow <strong>downward</strong> from top; Tuple payloads grow <strong>upward</strong> from bottom. Free space exists strictly between <code>pd_lower</code> and <code>pd_upper</code>.
                </div>
              </div>

              {/* Right Column: Detailed Field Inspector */}
              <div style={{ background: 'var(--ifm-background-surface-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: currentRegion.color }} />
                  <h4 style={{ margin: 0, fontSize: '15px', color: currentRegion.color }}>
                    {currentRegion.name} ({currentRegion.bytes})
                  </h4>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
                  {currentRegion.description}
                </p>

                <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px', color: 'var(--ifm-color-content)' }}>
                  Binary Header Fields & Meaning:
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
                  {currentRegion.fields.map((f, i) => (
                    <div key={i} style={{ padding: '8px 10px', borderRadius: '4px', background: 'var(--ifm-color-emphasis-100)', borderLeft: `3px solid ${currentRegion.color}`, fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--ifm-color-content)' }}>
                          {f.name}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>
                          {f.size}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
                        {f.purpose}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CTID & INDEX "DOUBLE HOP" */}
        {activeTab === 'ctid-lookup' && (
          <div>
            <div style={{ marginBottom: '14px', fontSize: '13px', color: 'var(--ifm-color-content-secondary)' }}>
              In PostgreSQL, secondary indexes (B-Tree, GIN, GiST) do <strong>NOT</strong> store raw disk byte offsets. They store the <strong>CTID (Block#, Offset#)</strong>. This causes a two-stage lookup known as the <strong>Double Hop</strong>.
            </div>

            {/* Step Controls */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {[
                { step: 1, title: 'Step 1: Traverse B-Tree Index', desc: 'Find leaf key matching query filter' },
                { step: 2, title: 'Step 2: Read Heap Page into Cache', desc: 'Load 8KB Page specified by Block#' },
                { step: 3, title: 'Step 3: Line Pointer Indirection', desc: 'Resolve Offset# to disk byte offset' },
                { step: 4, title: 'Step 4: MVCC Visibility Check', desc: 'Verify xmin/xmax against Snapshot' }
              ].map((s) => (
                <button
                  key={s.step}
                  onClick={() => setCtidStep(s.step)}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: '6px',
                    textAlign: 'left',
                    background: ctidStep === s.step ? 'rgba(52, 211, 153, 0.15)' : 'var(--ifm-color-emphasis-100)',
                    border: `1px solid ${ctidStep === s.step ? '#34d399' : 'var(--ifm-color-emphasis-300)'}`,
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 700, color: ctidStep === s.step ? '#34d399' : 'var(--ifm-color-content)' }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                    {s.desc}
                  </div>
                </button>
              ))}
            </div>

            {/* Visual Lookup Flow Canvas */}
            <div style={{ background: 'var(--ifm-background-surface-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '30% 35% 35%', gap: '12px', alignItems: 'stretch' }}>
                {/* 1. B-Tree Index */}
                <div style={{ padding: '12px', borderRadius: '6px', border: `2px solid ${ctidStep >= 1 ? '#38bdf8' : 'var(--ifm-color-emphasis-200)'}`, background: ctidStep === 1 ? 'rgba(56, 189, 248, 0.1)' : 'var(--ifm-color-emphasis-100)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '8px' }}>
                    1. B-Tree Leaf Node (idx_users_email)
                  </div>
                  <div style={{ background: 'var(--ifm-background-surface-color)', padding: '8px', borderRadius: '4px', border: '1px solid var(--ifm-color-emphasis-300)', fontSize: '12px', fontFamily: 'monospace' }}>
                    <div>Key: &quot;alice@corp.io&quot;</div>
                    <div style={{ color: '#34d399', fontWeight: 700, marginTop: '4px' }}>
                      Payload: CTID = (0, 1)
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>
                      Block#: 0 | Offset#: 1
                    </div>
                  </div>
                </div>

                {/* 2. Page 0 Line Pointer */}
                <div style={{ padding: '12px', borderRadius: '6px', border: `2px solid ${ctidStep >= 2 ? '#34d399' : 'var(--ifm-color-emphasis-200)'}`, background: (ctidStep === 2 || ctidStep === 3) ? 'rgba(52, 211, 153, 0.1)' : 'var(--ifm-color-emphasis-100)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '8px' }}>
                    2. Page 0 Line Pointer Array
                  </div>
                  <div style={{ background: 'var(--ifm-background-surface-color)', padding: '8px', borderRadius: '4px', border: '1px solid var(--ifm-color-emphasis-300)', fontSize: '12px', fontFamily: 'monospace' }}>
                    <div style={{ fontWeight: 600 }}>ItemId[1] (Offset 1):</div>
                    <div style={{ color: '#fbbf24', marginTop: '2px' }}>lp_off: 8100 (Byte 8100)</div>
                    <div style={{ color: '#a78bfa', marginTop: '2px' }}>lp_flags: LP_NORMAL (1)</div>
                    <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>lp_len: 92 bytes</div>
                  </div>
                </div>

                {/* 3. Physical Heap Tuple */}
                <div style={{ padding: '12px', borderRadius: '6px', border: `2px solid ${ctidStep >= 4 ? '#a78bfa' : 'var(--ifm-color-emphasis-200)'}`, background: ctidStep === 4 ? 'rgba(167, 139, 250, 0.1)' : 'var(--ifm-color-emphasis-100)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', marginBottom: '8px' }}>
                    3. Physical Heap Tuple @ Byte 8100
                  </div>
                  <div style={{ background: 'var(--ifm-background-surface-color)', padding: '8px', borderRadius: '4px', border: '1px solid var(--ifm-color-emphasis-300)', fontSize: '12px', fontFamily: 'monospace' }}>
                    <div style={{ color: '#38bdf8' }}>xmin: 101 (Committed)</div>
                    <div style={{ color: '#f87171' }}>xmax: 0 (Live)</div>
                    <div style={{ color: '#34d399', marginTop: '4px' }}>id: 42, name: &quot;Alice&quot;</div>
                    <div style={{ color: '#fbbf24' }}>email: &quot;alice@corp.io&quot;</div>
                  </div>
                </div>
              </div>

              {/* Step Explanation Callout */}
              <div style={{ marginTop: '14px', padding: '12px', borderRadius: '6px', background: 'var(--ifm-color-emphasis-100)', borderLeft: '4px solid #38bdf8', fontSize: '12px' }}>
                <strong style={{ color: 'var(--ifm-color-content)' }}>Why Line Pointer Indirection Matters:</strong>
                <p style={{ margin: '4px 0 0 0', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                  If PostgreSQL vacuum or defragmentation shifts Alice&apos;s tuple from Byte 8100 to Byte 8050 within Page 0, only <code>ItemId[1].lp_off</code> is updated. The B-Tree Index leaf node continues pointing to <code>CTID (0, 1)</code> without requiring any costly B-Tree index leaf writes or re-balancing!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: THE UPDATE PROBLEM & HOT */}
        {activeTab === 'hot-update' && (
          <div>
            <div style={{ marginBottom: '14px', fontSize: '13px', color: 'var(--ifm-color-content-secondary)' }}>
              In PostgreSQL, an <code>UPDATE</code> is fundamentally an <code>INSERT</code> (new tuple) + <code>DELETE</code> (old tuple). Compare standard update write amplification with <strong>HOT (Heap-Only Tuples)</strong> optimization.
            </div>

            {/* Scenario Switcher */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                onClick={() => setHotScenario('standard')}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: `2px solid ${hotScenario === 'standard' ? '#f87171' : 'var(--ifm-color-emphasis-300)'}`,
                  background: hotScenario === 'standard' ? 'rgba(248, 113, 113, 0.12)' : 'var(--ifm-color-emphasis-100)',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '13px', color: hotScenario === 'standard' ? '#f87171' : 'var(--ifm-color-content)' }}>
                  ⚠️ Standard UPDATE (Indexed Column Changed or No Page Free Space)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                  Causes Massive Write Amplification across all table indexes
                </div>
              </button>

              <button
                onClick={() => setHotScenario('hot')}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: `2px solid ${hotScenario === 'hot' ? '#34d399' : 'var(--ifm-color-emphasis-300)'}`,
                  background: hotScenario === 'hot' ? 'rgba(52, 211, 153, 0.12)' : 'var(--ifm-color-emphasis-100)',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '13px', color: hotScenario === 'hot' ? '#34d399' : 'var(--ifm-color-content)' }}>
                  🚀 HOT UPDATE (Heap-Only Tuples Optimization)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                  Same page free space + non-indexed column update = ZERO index writes
                </div>
              </button>
            </div>

            {/* Visual Comparison Panel */}
            <div style={{ background: 'var(--ifm-background-surface-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
              {hotScenario === 'standard' ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '48% 48%', gap: '16px' }}>
                    {/* Heap Page Changes */}
                    <div style={{ padding: '12px', background: 'var(--ifm-color-emphasis-100)', borderRadius: '6px', border: '1px solid #f87171' }}>
                      <div style={{ fontWeight: 700, fontSize: '12px', color: '#f87171', marginBottom: '8px' }}>
                        HEAP PAGE 0
                      </div>
                      <div style={{ fontSize: '11px', fontFamily: 'monospace', lineHeight: 1.6 }}>
                        <div style={{ padding: '6px', background: 'rgba(248, 113, 113, 0.1)', borderRadius: '4px', marginBottom: '6px' }}>
                          <strong>Tuple #1 @ (0, 1):</strong><br />
                          xmin: 100 | <span style={{ color: '#f87171', fontWeight: 700 }}>xmax: 201 (Marked Dead)</span><br />
                          t_ctid: (0, 2)
                        </div>
                        <div style={{ padding: '6px', background: 'rgba(52, 211, 153, 0.1)', borderRadius: '4px' }}>
                          <strong>Tuple #2 @ (0, 2):</strong><br />
                          <span style={{ color: '#34d399', fontWeight: 700 }}>xmin: 201</span> | xmax: 0<br />
                          t_ctid: (0, 2) (New CTID!)
                        </div>
                      </div>
                    </div>

                    {/* Index Write Amplification */}
                    <div style={{ padding: '12px', background: 'var(--ifm-color-emphasis-100)', borderRadius: '6px', border: '1px solid #fbbf24' }}>
                      <div style={{ fontWeight: 700, fontSize: '12px', color: '#fbbf24', marginBottom: '8px' }}>
                        ALL INDEXES MUST BE UPDATED (Write Amplification)
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ padding: '4px 6px', background: 'var(--ifm-background-surface-color)', borderRadius: '4px' }}>
                          ❌ <code>idx_users_id</code>: Insert new key ➔ (0, 2)
                        </div>
                        <div style={{ padding: '4px 6px', background: 'var(--ifm-background-surface-color)', borderRadius: '4px' }}>
                          ❌ <code>idx_users_email</code>: Insert new key ➔ (0, 2)
                        </div>
                        <div style={{ padding: '4px 6px', background: 'var(--ifm-background-surface-color)', borderRadius: '4px' }}>
                          ❌ <code>idx_users_created_at</code>: Insert new key ➔ (0, 2)
                        </div>
                        <div style={{ padding: '4px 6px', background: 'var(--ifm-background-surface-color)', borderRadius: '4px' }}>
                          ❌ <code>idx_users_org_id</code>: Insert new key ➔ (0, 2)
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '12px', padding: '10px', borderRadius: '4px', background: 'rgba(248, 113, 113, 0.1)', fontSize: '11px', color: '#f87171' }}>
                    <strong>Production Impact:</strong> A single column update triggers 4 separate random B-Tree index writes, causing write stall and severe B-Tree index page bloat!
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px' }}>
                    {/* HOT Chain in Page 0 */}
                    <div style={{ padding: '12px', background: 'var(--ifm-color-emphasis-100)', borderRadius: '6px', border: '1px solid #34d399' }}>
                      <div style={{ fontWeight: 700, fontSize: '12px', color: '#34d399', marginBottom: '8px' }}>
                        HEAP PAGE 0 (Internal HOT Chain with LP_REDIRECT)
                      </div>
                      <div style={{ fontSize: '11px', fontFamily: 'monospace', lineHeight: 1.6 }}>
                        <div style={{ padding: '6px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '4px', marginBottom: '6px' }}>
                          <strong>ItemId[1]:</strong> <span style={{ color: '#38bdf8', fontWeight: 700 }}>LP_REDIRECT ➔ ItemId[2]</span><br />
                          (Old line pointer now points directly to new slot!)
                        </div>
                        <div style={{ padding: '6px', background: 'rgba(52, 211, 153, 0.1)', borderRadius: '4px' }}>
                          <strong>Tuple #2 @ (0, 2):</strong><br />
                          xmin: 201 | xmax: 0 | <span style={{ color: '#34d399', fontWeight: 700 }}>HEAP_ONLY_TUPLE = true</span>
                        </div>
                      </div>
                    </div>

                    {/* Zero Index Updates */}
                    <div style={{ padding: '12px', background: 'var(--ifm-color-emphasis-100)', borderRadius: '6px', border: '1px solid #34d399' }}>
                      <div style={{ fontWeight: 700, fontSize: '12px', color: '#34d399', marginBottom: '8px' }}>
                        INDEX STATE (Untouched!)
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ padding: '4px 6px', background: 'var(--ifm-background-surface-color)', borderRadius: '4px', color: '#34d399' }}>
                          ✓ <code>idx_users_id</code>: Still points to (0, 1)
                        </div>
                        <div style={{ padding: '4px 6px', background: 'var(--ifm-background-surface-color)', borderRadius: '4px', color: '#34d399' }}>
                          ✓ <code>idx_users_email</code>: Still points to (0, 1)
                        </div>
                        <div style={{ padding: '4px 6px', background: 'var(--ifm-background-surface-color)', borderRadius: '4px', color: '#34d399' }}>
                          ✓ <code>idx_users_created_at</code>: Still points to (0, 1)
                        </div>
                        <div style={{ padding: '4px 6px', background: 'var(--ifm-background-surface-color)', borderRadius: '4px', color: '#34d399' }}>
                          ✓ <code>idx_users_org_id</code>: Still points to (0, 1)
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '12px', padding: '10px', borderRadius: '4px', background: 'rgba(52, 211, 153, 0.1)', fontSize: '11px', color: '#34d399' }}>
                    <strong>HOT Benefit:</strong> 0 index modifications! The lookup hits <code>(0, 1)</code>, follows <code>LP_REDIRECT</code> in memory to <code>(0, 2)</code>, avoiding all disk I/O and index bloat. Set <code>WITH (fillfactor = 80)</code> on write-heavy tables to leave free space for HOT updates!
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: MVCC VISIBILITY & BLOAT */}
        {activeTab === 'mvcc-visibility' && (
          <div>
            <div style={{ marginBottom: '14px', fontSize: '13px', color: 'var(--ifm-color-content-secondary)' }}>
              How PostgreSQL determines which tuple version is visible to a transaction snapshot. Test what snapshot transaction <strong>TX {snapshotTxn}</strong> sees in the table.
            </div>

            {/* Interactive Snapshot Selector */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ifm-color-content)' }}>
                Active Transaction Snapshot:
              </span>
              {[
                { xid: 150, label: 'TX 150 (Started before updates)' },
                { xid: 205, label: 'TX 205 (Concurrent with TX 200)' },
                { xid: 310, label: 'TX 310 (Latest snapshot)' }
              ].map((tx) => (
                <button
                  key={tx.xid}
                  onClick={() => setSnapshotTxn(tx.xid)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    border: `1px solid ${snapshotTxn === tx.xid ? '#38bdf8' : 'var(--ifm-color-emphasis-300)'}`,
                    background: snapshotTxn === tx.xid ? 'rgba(56, 189, 248, 0.15)' : 'var(--ifm-color-emphasis-100)',
                    color: snapshotTxn === tx.xid ? '#38bdf8' : 'var(--ifm-color-content)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {tx.label}
                </button>
              ))}
            </div>

            {/* Tuples Visibility Table */}
            <div style={{ background: 'var(--ifm-background-surface-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  {
                    version: 'Version A (CTID: 0, 1)',
                    xmin: 100,
                    xmax: 200,
                    data: 'balance = $1000',
                    isVisible: snapshotTxn < 200,
                    reason: snapshotTxn < 200 ? 'Visible: inserted by TX 100 (committed), deleted by TX 200 (in the future for TX ' + snapshotTxn + ')' : 'Invisible (Dead): deleted by TX 200 which committed before TX ' + snapshotTxn
                  },
                  {
                    version: 'Version B (CTID: 0, 2)',
                    xmin: 200,
                    xmax: 300,
                    data: 'balance = $1200',
                    isVisible: snapshotTxn >= 200 && snapshotTxn < 300,
                    reason: snapshotTxn < 200 ? 'Invisible: created by TX 200 (future transaction)' : snapshotTxn < 300 ? 'Visible: created by TX 200 (committed), deleted by TX 300 (future)' : 'Invisible (Dead): deleted by TX 300'
                  },
                  {
                    version: 'Version C (CTID: 0, 3)',
                    xmin: 300,
                    xmax: 0,
                    data: 'balance = $1500',
                    isVisible: snapshotTxn >= 300,
                    reason: snapshotTxn >= 300 ? 'Visible: created by TX 300 (committed), xmax=0 (live row)' : 'Invisible: created by TX 300 (future transaction relative to snapshot)'
                  }
                ].map((row, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px',
                      borderRadius: '6px',
                      border: `1px solid ${row.isVisible ? '#34d399' : 'var(--ifm-color-emphasis-200)'}`,
                      background: row.isVisible ? 'rgba(52, 211, 153, 0.08)' : 'var(--ifm-color-emphasis-100)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ifm-color-content)' }}>
                          {row.version}
                        </span>
                        <span style={{ fontFamily: 'monospace', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: 'var(--ifm-background-surface-color)' }}>
                          xmin={row.xmin}, xmax={row.xmax}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8' }}>
                          [{row.data}]
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
                        {row.reason}
                      </div>
                    </div>

                    <div style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: row.isVisible ? '#34d399' : 'var(--ifm-color-emphasis-300)', color: row.isVisible ? '#000' : 'var(--ifm-color-content-secondary)' }}>
                      {row.isVisible ? 'VISIBLE' : 'DEAD / HIDDEN'}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '14px', padding: '10px', background: 'rgba(248, 113, 113, 0.08)', borderRadius: '6px', border: '1px solid #f87171', fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
                <strong style={{ color: '#f87171' }}>The Dead Tuple Trap (Table Bloat):</strong> As long as <code>TX 150</code> remains open (e.g. idle in transaction or long analytics query), PostgreSQL <strong>cannot prune Version A</strong>! Even if 10,000 updates happen, old tuples remain locked on disk as dead tuples until the oldest transaction finishes.
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: VACUUM VS VACUUM FULL */}
        {activeTab === 'vacuum-lifecycle' && (
          <div>
            <div style={{ marginBottom: '14px', fontSize: '13px', color: 'var(--ifm-color-content-secondary)' }}>
              Step through the PostgreSQL reclamation lifecycle: from Bloated Dead Tuples to standard <strong>VACUUM</strong> and <strong>VACUUM FULL</strong>.
            </div>

            {/* Stage Selector */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {[
                { stage: 1, title: '1. Bloated Heap Page', desc: 'Dead tuples occupy space' },
                { stage: 2, title: '2. Standard VACUUM', desc: 'Reclaims in-page space, no OS shrink' },
                { stage: 3, title: '3. VACUUM FULL / pg_repack', desc: 'Rewrites table file, reclaims disk space' }
              ].map((st) => (
                <button
                  key={st.stage}
                  onClick={() => setVacuumStage(st.stage)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${vacuumStage === st.stage ? '#fbbf24' : 'var(--ifm-color-emphasis-300)'}`,
                    background: vacuumStage === st.stage ? 'rgba(251, 191, 36, 0.15)' : 'var(--ifm-color-emphasis-100)',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '12px', color: vacuumStage === st.stage ? '#fbbf24' : 'var(--ifm-color-content)' }}>
                    {st.title}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                    {st.desc}
                  </div>
                </button>
              ))}
            </div>

            {/* Vacuum Visualizer */}
            <div style={{ background: 'var(--ifm-background-surface-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
              {vacuumStage === 1 && (
                <div>
                  <div style={{ fontWeight: 700, color: '#f87171', fontSize: '13px', marginBottom: '8px' }}>
                    Stage 1: Fragmented Page with Dead Tuples
                  </div>
                  <div style={{ display: 'flex', gap: '6px', height: '40px', marginBottom: '12px' }}>
                    <div style={{ flex: 1, background: '#34d399', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#000' }}>Live (Tuple 1)</div>
                    <div style={{ flex: 1, background: '#f87171', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff' }}>DEAD (Tuple 2)</div>
                    <div style={{ flex: 1, background: '#f87171', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff' }}>DEAD (Tuple 3)</div>
                    <div style={{ flex: 1, background: '#34d399', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#000' }}>Live (Tuple 4)</div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
                    Disk file size: <strong>100 GB</strong>. Dead tuples cannot be reused by normal queries until vacuumed.
                  </div>
                </div>
              )}

              {vacuumStage === 2 && (
                <div>
                  <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: '13px', marginBottom: '8px' }}>
                    Stage 2: Standard VACUUM (Page-Level Compaction & FSM Update)
                  </div>
                  <div style={{ display: 'flex', gap: '6px', height: '40px', marginBottom: '12px' }}>
                    <div style={{ flex: 1, background: '#34d399', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#000' }}>Live (Tuple 1)</div>
                    <div style={{ flex: 1, background: '#34d399', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#000' }}>Live (Tuple 4)</div>
                    <div style={{ flex: 2, background: 'rgba(56, 189, 248, 0.25)', border: '1px dashed #38bdf8', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>Reclaimed Free Space (FSM)</div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                    ✓ Line pointers marked <code>LP_UNUSED</code>/<code>LP_DEAD</code>.<br />
                    ✓ Free Space Map (FSM) updated so future <code>INSERT</code>s reuse this space.<br />
                    ⚠️ <strong>Disk file size remains 100 GB</strong> (PostgreSQL does not truncate sparse files to avoid filesystem locking).
                  </div>
                </div>
              )}

              {vacuumStage === 3 && (
                <div>
                  <div style={{ fontWeight: 700, color: '#34d399', fontSize: '13px', marginBottom: '8px' }}>
                    Stage 3: VACUUM FULL / pg_repack (Physical Disk File Shrink)
                  </div>
                  <div style={{ display: 'flex', gap: '6px', height: '40px', marginBottom: '12px' }}>
                    <div style={{ flex: 1, background: '#34d399', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#000' }}>Live (Tuple 1)</div>
                    <div style={{ flex: 1, background: '#34d399', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#000' }}>Live (Tuple 4)</div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                    ✓ Creates a brand-new compact table file and swaps file descriptors.<br />
                    ✓ Disk file size shrinks from <strong>100 GB ➔ 20 GB</strong>.<br />
                    ⚠️ <code>VACUUM FULL</code> requires an <code>ACCESS EXCLUSIVE</code> lock (blocks all reads and writes). In production, always use <code>pg_repack</code> for online compaction without table locks!
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
