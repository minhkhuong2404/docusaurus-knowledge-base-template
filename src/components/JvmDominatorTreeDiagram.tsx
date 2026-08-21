import React, { useState } from 'react';

type DominatorTab = 'tree' | 'shallow-vs-retained' | 'path-to-gc-roots';

interface TreeNode {
  name: string;
  className: string;
  shallowHeap: string;
  retainedHeap: string;
  retainedPercent: number;
  level: number;
  isAccumulationPoint?: boolean;
}

const TREE_DATA: TreeNode[] = [
  { name: 'LocalCache @ 0x7f8b6c0010', className: 'com.example.cache.LocalCache', shallowHeap: '48 B', retainedHeap: '1,847,293,440 B (1.84 GB)', retainedPercent: 78.4, level: 0, isAccumulationPoint: true },
  { name: 'HashMap @ 0x7f8b6c0040', className: 'java.util.HashMap', shallowHeap: '48 B', retainedHeap: '1,847,293,392 B (1.84 GB)', retainedPercent: 78.4, level: 1 },
  { name: 'Node[] @ 0x7f8b6c0100', className: 'java.util.HashMap$Node[16777216]', shallowHeap: '16,777,232 B (16.7 MB)', retainedHeap: '1,847,293,344 B (1.84 GB)', retainedPercent: 78.4, level: 2 },
  { name: 'Node (Entry 1..2,100,000)', className: 'java.util.HashMap$Node', shallowHeap: '32 B', retainedHeap: '950,000,000 B (950 MB)', retainedPercent: 40.3, level: 3 },
  { name: 'SessionData @ 0x7f8b800000', className: 'com.example.model.SessionData', shallowHeap: '64 B', retainedHeap: '450 B', retainedPercent: 0.01, level: 4 }
];

export default function JvmDominatorTreeDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<DominatorTab>('tree');
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number>(0);

  const selectedNode = TREE_DATA[selectedNodeIndex];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        .dom-grid {
          display: grid;
          grid-template-columns: 58% 42%;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .dom-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderBottom: '1px solid var(--ifm-color-emphasis-200)', background: 'var(--ifm-color-emphasis-100)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Eclipse MAT Dominator Tree & Heap Leak Analysis
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', fontWeight: 600 }}>
          Retained Heap Explorer
        </span>
      </div>

      {/* Mode Tabs */}
      <div style={{ display: 'flex', gap: '6px', padding: '10px 16px', background: 'var(--ifm-background-surface-color)', borderBottom: '1px solid var(--ifm-color-emphasis-200)' }}>
        <button
          onClick={() => setActiveTab('tree')}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            border: `1px solid ${activeTab === 'tree' ? '#fbbf24' : 'var(--ifm-color-emphasis-300)'}`,
            background: activeTab === 'tree' ? 'rgba(251, 191, 36, 0.15)' : 'transparent',
            color: activeTab === 'tree' ? '#fbbf24' : 'var(--ifm-color-content-secondary)'
          }}
        >
          1. Dominator Tree (MAT)
        </button>
        <button
          onClick={() => setActiveTab('shallow-vs-retained')}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            border: `1px solid ${activeTab === 'shallow-vs-retained' ? '#38bdf8' : 'var(--ifm-color-emphasis-300)'}`,
            background: activeTab === 'shallow-vs-retained' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: activeTab === 'shallow-vs-retained' ? '#38bdf8' : 'var(--ifm-color-content-secondary)'
          }}
        >
          2. Shallow vs. Retained Heap
        </button>
        <button
          onClick={() => setActiveTab('path-to-gc-roots')}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            border: `1px solid ${activeTab === 'path-to-gc-roots' ? '#f87171' : 'var(--ifm-color-emphasis-300)'}`,
            background: activeTab === 'path-to-gc-roots' ? 'rgba(248, 113, 113, 0.15)' : 'transparent',
            color: activeTab === 'path-to-gc-roots' ? '#f87171' : 'var(--ifm-color-content-secondary)'
          }}
        >
          3. Path to GC Roots
        </button>
      </div>

      {/* Main Content */}
      <div style={{ padding: '16px' }}>
        {activeTab === 'tree' && (
          <div className="dom-grid">
            {/* Tree View */}
            <div style={{ background: 'var(--ifm-color-emphasis-100)', padding: '14px', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ifm-color-content)', marginBottom: '8px' }}>
                Dominator Tree Hierarchy (Sorted by Retained Heap):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {TREE_DATA.map((node, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedNodeIndex(idx)}
                    style={{
                      padding: '8px 10px',
                      marginLeft: `${node.level * 16}px`,
                      borderRadius: '6px',
                      border: `1px solid ${selectedNodeIndex === idx ? '#fbbf24' : 'var(--ifm-color-emphasis-300)'}`,
                      background: selectedNodeIndex === idx ? 'rgba(251, 191, 36, 0.18)' : 'var(--ifm-background-surface-color)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: '12px', color: node.isAccumulationPoint ? '#f87171' : 'var(--ifm-color-content)' }}>
                        {node.level > 0 ? '└── ' : ''}{node.className}
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#fbbf24' }}>
                        {node.retainedPercent}% Heap
                      </span>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px', fontFamily: 'monospace' }}>
                      Shallow: {node.shallowHeap} | Retained: {node.retainedHeap}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Node Details */}
            <div style={{ background: 'var(--ifm-background-surface-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', marginBottom: '6px' }}>
                Accumulation Point Inspection
              </div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: 'var(--ifm-color-content)' }}>
                {selectedNode.className}
              </h4>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '12px' }}>
                Memory address: <code>{selectedNode.name.split('@')[1] || '0x7f8b...'}</code>
              </div>

              {/* Progress Bar of Retained Heap */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span>Heap Occupancy:</span>
                  <span style={{ fontWeight: 700, color: selectedNode.retainedPercent > 50 ? '#f87171' : '#38bdf8' }}>
                    {selectedNode.retainedPercent}% of total heap
                  </span>
                </div>
                <div style={{ height: '8px', borderRadius: '4px', background: 'var(--ifm-color-emphasis-200)', overflow: 'hidden' }}>
                  <div style={{ width: `${selectedNode.retainedPercent}%`, height: '100%', background: selectedNode.retainedPercent > 50 ? '#f87171' : '#38bdf8' }} />
                </div>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', padding: '10px', borderRadius: '6px', background: 'var(--ifm-color-emphasis-100)', borderLeft: '4px solid #fbbf24' }}>
                <strong>Why this is the root cause:</strong><br />
                {selectedNode.level === 0 ? (
                  'The single LocalCache instance only takes 48 bytes of shallow heap itself, but it dominates 1.84 GB (78.4% of total heap) because it keeps all 2.1 million SessionData objects transitively reachable!'
                ) : (
                  `This child node holds ${selectedNode.shallowHeap} shallow memory and contributes to the parent's ${selectedNode.retainedHeap} retained memory.`
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'shallow-vs-retained' && (
          <div style={{ background: 'var(--ifm-background-surface-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px' }}>
              <div style={{ padding: '12px', borderRadius: '6px', background: 'var(--ifm-color-emphasis-100)', border: '1px solid var(--ifm-color-emphasis-300)' }}>
                <h4 style={{ margin: '0 0 6px 0', color: '#38bdf8', fontSize: '13px' }}>Shallow Heap (Self Size)</h4>
                <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.45, margin: 0 }}>
                  The amount of memory allocated to store the object <strong>itself</strong> (object header, primitive fields, and reference pointers). It does <em>not</em> include the size of objects referenced.
                </p>
                <div style={{ marginTop: '8px', fontSize: '11px', fontFamily: 'monospace', color: '#38bdf8' }}>
                  Example: <code>new HashMap()</code> = 48 bytes
                </div>
              </div>

              <div style={{ padding: '12px', borderRadius: '6px', background: 'var(--ifm-color-emphasis-100)', border: '1px solid var(--ifm-color-emphasis-300)' }}>
                <h4 style={{ margin: '0 0 6px 0', color: '#fbbf24', fontSize: '13px' }}>Retained Heap (Blast Radius)</h4>
                <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.45, margin: 0 }}>
                  The total amount of heap memory that would be <strong>freed by the GC</strong> if this object were garbage collected (the object itself + all descendant objects exclusively reachable from it).
                </p>
                <div style={{ marginTop: '8px', fontSize: '11px', fontFamily: 'monospace', color: '#fbbf24' }}>
                  Example: <code>LocalCache</code> = 1.84 GB (78.4%)
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'path-to-gc-roots' && (
          <div style={{ background: 'var(--ifm-background-surface-color)', padding: '16px', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-200)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#f87171', marginBottom: '8px' }}>
              Path to GC Roots (Excluding Weak/Soft References):
            </div>
            <pre style={{ margin: 0, padding: '12px', borderRadius: '6px', background: 'var(--ifm-color-emphasis-100)', fontSize: '11px', lineHeight: 1.5, border: '1px solid var(--ifm-color-emphasis-300)' }}>
              <code>{`[GC Root: Static Variable]
  └── com.example.cache.LocalCache.CACHE (static field)
      └── com.example.cache.LocalCache instance
          └── java.util.HashMap "dataMap"
              └── java.util.HashMap$Node[] (table)
                  └── java.util.HashMap$Node
                      └── com.example.model.SessionData (LEAKING OBJECT)

Fix: Break the chain by adding TTL eviction, bounded Caffeine/Guava cache, or WeakReference!`}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
