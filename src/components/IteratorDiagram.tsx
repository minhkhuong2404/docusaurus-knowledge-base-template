import React, { useState } from 'react';

interface IteratorTraversal {
  id: string;
  name: string;
  badge: string;
  color: string;
  algorithm: string;
  stateRepresentation: string;
  useCase: string;
}

const TRAVERSALS: IteratorTraversal[] = [
  {
    id: 'sequential',
    name: '1. Sequential Linear Iterator',
    badge: 'LINEAR',
    color: '#38bdf8', // Sky Blue
    algorithm: 'Traverses array or linked list elements in order index 0..N using hasNext() and next().',
    stateRepresentation: 'Cursor pointer tracking current index position in collection.',
    useCase: 'Standard ArrayList / LinkedList iterations.'
  },
  {
    id: 'dfs',
    name: '2. Depth-First Search (DFS) Tree Iterator',
    badge: 'STACK TRAVERSAL',
    color: '#a78bfa', // Purple
    algorithm: 'Uses internal Stack to traverse hierarchical tree nodes deep down left subtrees before backtracking.',
    stateRepresentation: 'Stack<Node> tracking unvisited parent and child branches.',
    useCase: 'DOM tree parsing, AST file structure traversal.'
  },
  {
    id: 'bfs',
    name: '3. Breadth-First Search (BFS) Graph Iterator',
    badge: 'QUEUE TRAVERSAL',
    color: '#34d399', // Emerald
    algorithm: 'Uses internal Queue to traverse collection nodes level-by-level.',
    stateRepresentation: 'Queue<Node> tracking level order frontier.',
    useCase: 'Social network friend connections, shortest path routing.'
  }
];

export default function IteratorDiagram() {
  const [activeId, setActiveId] = useState<string>('dfs');
  const current = TRAVERSALS.find(t => t.id === activeId) || TRAVERSALS[1];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Iterator Design Pattern: Encapsulated Collection Traversal</span>
      </div>

      {/* Traversal Selector Grid */}
      <div style={{ padding: '16px 20px', background: '#0d0f1e', borderBottom: '1px solid #1e2342' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {TRAVERSALS.map((t) => {
            const isActive = activeId === t.id;
            return (
              <div
                key={t.id}
                onClick={() => setActiveId(t.id)}
                style={{
                  background: isActive ? `${t.color}18` : '#13162b',
                  border: `1.5px solid ${isActive ? t.color : '#1e2342'}`,
                  borderRadius: '8px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '9px', fontWeight: 800, color: t.color, background: `${t.color}20`, padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                  {t.badge}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                  {t.name.split('. ')[1]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Details Inspector */}
      <div className="interactive-diagram-details-card" style={{ background: '#090b14', padding: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: current.color, marginBottom: '4px' }}>
          {current.name}
        </div>

        <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
          {current.algorithm}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: current.color, textTransform: 'uppercase', marginBottom: '4px' }}>
              Internal Iterator State
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              {current.stateRepresentation}
            </div>
          </div>

          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
              Target Use Case
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              {current.useCase}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
