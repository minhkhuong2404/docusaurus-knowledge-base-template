import React, { useState } from 'react';
import styles from './G1HeapDiagram.module.css';

type RegionType = 'EDEN' | 'SURVIVOR' | 'OLD' | 'HUMONGOUS' | 'FREE';

interface RegionDetails {
  title: string;
  type: 'green' | 'blue' | 'purple' | 'yellow' | 'gray';
  shortDesc: string;
  tuningFlags: string[];
  gcAction: string;
  underTheHood: string[];
}

const REGION_DATA: Record<RegionType, RegionDetails> = {
  EDEN: {
    title: 'Eden Region (Young Generation)',
    type: 'green',
    shortDesc: 'Logical young generation region. Sized dynamically based on allocation throughput.',
    tuningFlags: ['-XX:G1NewSizePercent (Initial size, default 5%)', '-XX:G1MaxNewSizePercent (Max size, default 60%)'],
    gcAction: 'Minor GCs evacuate surviving objects to Survivor regions, emptying the Eden regions completely to become Free.',
    underTheHood: [
      'Objects are allocated here via TLABs to avoid synchronization locks.',
      'Sizing is adjusted dynamically by G1 between collections to meet user pause time targets (-XX:MaxGCPauseMillis).'
    ]
  },
  SURVIVOR: {
    title: 'Survivor Region (Young Generation)',
    type: 'blue',
    shortDesc: 'Holds survivor objects from previous minor GC collection cycles.',
    tuningFlags: ['-XX:MaxTenuringThreshold (default 15 cycles before Old promotion)'],
    gcAction: 'Minor GCs evacuate surviving objects to a new Survivor region or promote them to Old Gen regions if age threshold exceeded.',
    underTheHood: [
      'Acts exactly like survivor spaces in generational heaps, but regions are non-contiguous.',
      'Ages are recorded in the object headers. Only when age crosses the threshold are they promoted to Old.'
    ]
  },
  OLD: {
    title: 'Old Region (Tenured)',
    type: 'purple',
    shortDesc: 'Contains long-lived objects and promoted survivors. Collected selectively in Mixed GCs.',
    tuningFlags: ['-XX:InitiatingHeapOccupancyPercent (IHOP - triggers old gen cycle, default 45%)'],
    gcAction: 'Mixed GC phases collect all young regions plus the Old regions with the highest garbage density (Garbage-First).',
    underTheHood: [
      'Subject to concurrent marking cycles to detect dead objects.',
      'Objects are compacted by copying live objects to empty regions, avoiding old generation fragmentation.'
    ]
  },
  HUMONGOUS: {
    title: 'Humongous Region',
    type: 'yellow',
    shortDesc: 'A specialized old region type reserved for objects that exceed 50% of a standard G1 region size.',
    tuningFlags: ['-XX:G1HeapRegionSize (Force region size: 1MB to 32MB, must be power of 2)'],
    gcAction: 'Allocated directly in contiguous blocks of Humongous regions. Cleaned during concurrent mark cleanup phases or Full GCs.',
    underTheHood: [
      'Bypasses the young generation completely to avoid expensive copying overhead.',
      'Can lead to premature heap fragmentation if many dynamic humongous allocations are created.'
    ]
  },
  FREE: {
    title: 'Free Region',
    type: 'gray',
    shortDesc: 'Unallocated memory blocks in the G1 Heap region pool available to be claimed as any type.',
    tuningFlags: ['-XX:G1ReservePercent (GC reserve buffer, default 10%)'],
    gcAction: 'Added back to the free region list after collections reclaim space.',
    underTheHood: [
      'Maintained in a linked list structure by the G1 allocator.',
      'Can be dynamically transformed into Eden, Survivor, Old, or Humongous regions on demand.'
    ]
  }
};

const GRID_LAYOUT: { type: RegionType; name: string }[][] = [
  // Row 1
  [
    { type: 'EDEN', name: 'Eden' },
    { type: 'OLD', name: 'Old' },
    { type: 'SURVIVOR', name: 'Survivor' },
    { type: 'EDEN', name: 'Eden' },
    { type: 'OLD', name: 'Old' },
    { type: 'HUMONGOUS', name: 'Humongous' }
  ],
  // Row 2
  [
    { type: 'OLD', name: 'Old' },
    { type: 'EDEN', name: 'Eden' },
    { type: 'FREE', name: 'Free' },
    { type: 'OLD', name: 'Old' },
    { type: 'OLD', name: 'Old' },
    { type: 'EDEN', name: 'Eden' }
  ],
  // Row 3
  [
    { type: 'FREE', name: 'Free' },
    { type: 'OLD', name: 'Old' },
    { type: 'OLD', name: 'Old' },
    { type: 'SURVIVOR', name: 'Survivor' },
    { type: 'FREE', name: 'Free' },
    { type: 'OLD', name: 'Old' }
  ]
];

export default function G1HeapDiagram(): React.JSX.Element {
  const [activeType, setActiveType] = useState<RegionType>('EDEN');

  const selectedData = REGION_DATA[activeType];

  const handleRegionClick = (type: RegionType) => {
    setActiveType(type);
  };

  const getStyleClass = (type: RegionType) => {
    const isSelected = activeType === type;
    switch (type) {
      case 'EDEN':
        return isSelected ? styles.edenActive : styles.eden;
      case 'OLD':
        return isSelected ? styles.oldActive : styles.old;
      case 'SURVIVOR':
        return isSelected ? styles.survActive : styles.surv;
      case 'HUMONGOUS':
        return isSelected ? styles.humActive : styles.hum;
      case 'FREE':
        return isSelected ? styles.freeActive : styles.free;
      default:
        return '';
    }
  };

  return (
    <div className={"interactive-diagram-container"}>
      <div className={`${"interactive-diagram-svg-wrapper"} ${"interactive-diagram-grid-bg"}`}>
        <svg viewBox="0 0 620 280" className={"interactive-diagram-svg"}>
          {/* Main Heap Box */}
          <rect x="10" y="10" width="600" height="260" className={styles.subgraphBox} />
          <text x="25" y="32" className={styles.subgraphTitle}>
            G1 Region-Based Heap Layout (Logical Divisions)
          </text>

          {/* Render 3x6 Grid of regions */}
          {GRID_LAYOUT.map((row, rIdx) => {
            const y = 60 + rIdx * 65;
            return row.map((cell, cIdx) => {
              const x = 30 + cIdx * 95;
              const styleClass = getStyleClass(cell.type);
              return (
                <g
                  key={`${rIdx}-${cIdx}`}
                  className={styles.node}
                  onClick={() => handleRegionClick(cell.type)}
                >
                  <rect
                    x={x}
                    y={y}
                    width="80"
                    height="50"
                    rx="6"
                    ry="6"
                    className={styleClass}
                    strokeWidth={activeType === cell.type ? '2.5' : '1.5'}
                    style={{ transition: 'all 0.2s ease' }}
                  />
                  <text x={x + 40} y={y + 26} className={styles.nodeTitle}>
                    {cell.name === 'Survivor' ? 'Survivor' : cell.name === 'Humongous' ? 'Humongous' : cell.name}
                  </text>
                  <text x={x + 40} y={y + 39} className={styles.nodeDesc} fill="#94a3b8" fontSize="7.5">
                    {cell.type === 'EDEN' ? 'Eden [E]' : cell.type === 'OLD' ? 'Old [O]' : cell.type === 'SURVIVOR' ? 'Surv [S]' : cell.type === 'HUMONGOUS' ? 'Hum [H]' : 'Free [F]'}
                  </text>
                </g>
              );
            });
          })}
        </svg>
      </div>

      {/* Details Card */}
      <div className={`${"interactive-diagram-details-card"} ${
        selectedData.type === 'green' ? "details-green" : selectedData.type === 'blue' ? "details-blue" : selectedData.type === 'purple' ? "details-purple" : selectedData.type === 'yellow' ? "details-yellow" : "details-gray"
      }`}>
        <div className={"interactive-diagram-card-header"}>
          <span className={`${"interactive-diagram-indicator-dot"} ${
            selectedData.type === 'green' ? "card-indicator-green" : selectedData.type === 'blue' ? "card-indicator-blue" : selectedData.type === 'purple' ? "card-indicator-purple" : selectedData.type === 'yellow' ? "card-indicator-yellow" : "card-indicator-gray"
          }`} />
          <h3>{selectedData.title}</h3>
        </div>
        <p><strong>Overview:</strong> {selectedData.shortDesc}</p>
        
        <ul>
          <li><strong>Tuning flags:</strong> {selectedData.tuningFlags.join(' | ')}</li>
          <li><strong>GC Collection Behavior:</strong> {selectedData.gcAction}</li>
          <li><strong>Under the Hood Mechanics:</strong>
            <ul>
              {selectedData.underTheHood.map((detail, i) => (
                <li key={i}>{detail}</li>
              ))}
            </ul>
          </li>
        </ul>
      </div>

      <p className={"interactive-diagram-helper-text"}>
        💡 Click on any region box (Eden, Survivor, Old, Humongous, Free) on the grid to inspect its logical partition rules.
      </p>
    </div>
  );
}
