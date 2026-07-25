import React, { useState } from 'react';

interface TreeNode {
  id: string;
  name: string;
  badge: string;
  color: string;
  nodeType: 'Leaf (Individual)' | 'Composite (Container)';
  behavior: string;
  childItems?: string[];
}

const TREE_NODES: TreeNode[] = [
  {
    id: 'file1',
    name: '1. File: resume.pdf (Leaf)',
    badge: 'LEAF NODE',
    color: '#38bdf8', // Sky Blue
    nodeType: 'Leaf (Individual)',
    behavior: 'Executes getSize() directly returning file byte size (2,048 KB). Has no child elements.'
  },
  {
    id: 'file2',
    name: '2. File: logo.png (Leaf)',
    badge: 'LEAF NODE',
    color: '#38bdf8', // Sky Blue
    nodeType: 'Leaf (Individual)',
    behavior: 'Executes getSize() directly returning file byte size (512 KB). Has no child elements.'
  },
  {
    id: 'folder',
    name: '3. Folder: /Documents (Composite)',
    badge: 'COMPOSITE CONTAINER',
    color: '#34d399', // Emerald
    nodeType: 'Composite (Container)',
    behavior: 'Executes getSize() by iterating over all child nodes, delegating getSize() calls, and summing total size.',
    childItems: ['File: resume.pdf (2,048 KB)', 'File: logo.png (512 KB)', 'Subfolder: /Projects (10,240 KB)']
  }
];

export default function CompositeDiagram() {
  const [activeId, setActiveId] = useState<string>('folder');
  const current = TREE_NODES.find(n => n.id === activeId) || TREE_NODES[2];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Composite Design Pattern: Recursive Tree Hierarchy Traversal</span>
      </div>

      {/* Grid Selector */}
      <div style={{ padding: '16px 20px', background: '#0d0f1e', borderBottom: '1px solid #1e2342' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {TREE_NODES.map((node) => {
            const isActive = activeId === node.id;
            return (
              <div
                key={node.id}
                onClick={() => setActiveId(node.id)}
                style={{
                  background: isActive ? `${node.color}18` : '#13162b',
                  border: `1.5px solid ${isActive ? node.color : '#1e2342'}`,
                  borderRadius: '8px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '9px', fontWeight: 800, color: node.color, background: `${node.color}20`, padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                  {node.badge}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                  {node.name.split('. ')[1]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Details Card */}
      <div className="interactive-diagram-details-card" style={{ background: '#090b14', padding: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: current.color, marginBottom: '4px' }}>
          {current.name}
        </div>
        <div style={{ fontSize: '11px', color: current.color, fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
          Type: {current.nodeType}
        </div>

        <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
          {current.behavior}
        </div>

        {current.childItems && (
          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '6px' }}>
              Child Nodes Managed by Composite
            </div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              {current.childItems.map((item, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
