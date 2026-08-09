import React, { useState } from 'react';

interface JoinAlgo {
  id: string;
  name: string;
  badge: string;
  color: string;
  description: string;
  timeComplexity: string;
  memoryRequirement: string;
  bestFor: string;
  executionSteps: string[];
}

const JOINS: JoinAlgo[] = [
  {
    id: 'nested-loop',
    name: '1. Nested Loop Join',
    badge: 'Small Outer + Index',
    color: '#38bdf8',
    description: 'For each row in the outer table (outer loop), scan the inner table (inner loop) to find matching rows. Index on inner table makes this fast.',
    timeComplexity: 'O(N × M) worst-case without index; O(N log M) with B-Tree index on inner table.',
    memoryRequirement: 'Minimal (O(1) memory overhead; requires no large hash/sort buffers).',
    bestFor: 'Small outer table joined with indexed inner table.',
    executionSteps: [
      'Fetch 1 row from Outer Table A.',
      'Probe B-Tree index on Inner Table B for matching key.',
      'Combine matching rows into result batch.',
      'Repeat for next row in Outer Table A.',
    ],
  },
  {
    id: 'hash-join',
    name: '2. Hash Join',
    badge: 'Large Unsorted Datasets',
    color: '#34d399',
    description: 'Build Phase: Reads smaller table and builds an in-memory hash table on join key. Probe Phase: Scans larger table and probes hash table.',
    timeComplexity: 'O(N + M) time complexity — very fast for large equality joins.',
    memoryRequirement: 'High (requires memory equal to size of build table; spills to disk work_mem if too large).',
    bestFor: 'Large unsorted datasets joined on equality (`A.id = B.a_id`).',
    executionSteps: [
      'Build Phase: Scan Table A (smaller) and populate in-memory hash table on join key.',
      'Probe Phase: Sequentially scan Table B (larger).',
      'For each row in Table B, compute hash(B.join_key) and probe hash table.',
      'If match found, output joined row to result stream.',
    ],
  },
  {
    id: 'sort-merge',
    name: '3. Sort-Merge Join',
    badge: 'Pre-Sorted / Range Joins',
    color: '#fbbf24',
    description: 'Sort Phase: Sort both tables on join key (if not already sorted by index). Merge Phase: Scan both tables concurrently like two pointers.',
    timeComplexity: 'O(N log N + M log M) for sorting; O(N + M) for merge scan.',
    memoryRequirement: 'Moderate to High (requires memory for sorting if not index-backed).',
    bestFor: 'Tables already sorted by B-Tree index or range/inequality join conditions (`A.date BETWEEN B.start AND B.end`).',
    executionSteps: [
      'Sort Table A on join key (or use pre-existing index order).',
      'Sort Table B on join key.',
      'Advance pointer on Table A and Table B concurrently.',
      'Output matches when keys match; advance smaller key pointer.',
    ],
  },
];

export default function DatabaseJoinAlgorithmsDiagram(): React.JSX.Element {
  const [selectedJoin, setSelectedJoin] = useState<JoinAlgo>(JOINS[1]); // Default to Hash Join

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="18" r="3"/>
          <circle cx="6" cy="6" r="3"/>
          <path d="M13 6h3a2 2 0 0 1 2 2v7"/>
          <line x1="6" y1="9" x2="6" y2="21"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Database Join Execution Algorithms (Nested Loop vs Hash Join vs Sort-Merge)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {JOINS.map((j) => {
            const isSelected = j.id === selectedJoin.id;
            return (
              <button
                key={j.id}
                onClick={() => setSelectedJoin(j)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: isSelected ? `1px solid ${j.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: isSelected ? `${j.color}15` : '#0c0e17',
                  color: isSelected ? '#fff' : 'var(--ifm-color-content-secondary)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 400,
                  fontSize: '12px',
                }}
              >
                {j.name}
              </button>
            );
          })}
        </div>

        {/* Selected Join Overview Card */}
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', borderLeft: `4px solid ${selectedJoin.color}`, marginBottom: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>{selectedJoin.name}</span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: `${selectedJoin.color}22`, color: selectedJoin.color, fontWeight: 700 }}>
              {selectedJoin.badge}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            {selectedJoin.description}
          </p>
        </div>

        {/* Technical Tradeoffs Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Time Complexity
            </div>
            <div style={{ fontSize: '13px', color: selectedJoin.color, fontWeight: 700, marginBottom: '10px' }}>
              {selectedJoin.timeComplexity}
            </div>

            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Memory Footprint
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', marginBottom: '10px' }}>
              {selectedJoin.memoryRequirement}
            </div>

            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Optimizer Selection Criteria
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
              {selectedJoin.bestFor}
            </div>
          </div>

          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '8px', fontWeight: 600 }}>
              Execution Flow Steps
            </div>
            <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              {selectedJoin.executionSteps.map((st, idx) => (
                <li key={idx} style={{ marginBottom: '6px' }}>{st}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
