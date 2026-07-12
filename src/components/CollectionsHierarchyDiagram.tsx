import React, { useState } from 'react';

type NodeId = 
  | 'iterable' | 'collection' | 'list' | 'set' | 'queue'
  | 'arraylist' | 'linkedlist' | 'vector' | 'cowlist'
  | 'hashset' | 'linkedhashset' | 'treeset'
  | 'priorityqueue' | 'arraydeque' | 'blockingqueue'
  | 'map' | 'hashmap' | 'linkedhashmap' | 'treemap' | 'hashtable' | 'chm';

interface NodeInfo {
  label: string;
  color: string;
  description: string;
  complexity?: string;
  note?: string;
}

const NODE_INFO: Record<NodeId, NodeInfo> = {
  iterable:       { label: 'Iterable', color: '#a78bfa', description: 'Root interface enabling for-each loops via iterator().' },
  collection:     { label: 'Collection', color: '#818cf8', description: 'Core interface: add, remove, size, contains, iterator.' },
  list:           { label: 'List', color: '#38bdf8', description: 'Ordered sequence allowing duplicates. Indexed access.', complexity: 'get(i): O(1)–O(n)' },
  set:            { label: 'Set', color: '#34d399', description: 'No duplicates. Models mathematical set concept.', complexity: 'contains: O(1)–O(log n)' },
  queue:          { label: 'Queue / Deque', color: '#fb923c', description: 'FIFO ordering. Deque supports both ends.', complexity: 'offer/poll: O(1)–O(log n)' },
  arraylist:      { label: 'ArrayList', color: '#38bdf8', description: 'Resizable array. Best for random access.', complexity: 'get: O(1) | add end: O(1) amortized', note: '1.5× resize' },
  linkedlist:     { label: 'LinkedList', color: '#38bdf8', description: 'Doubly-linked list. Also implements Deque.', complexity: 'add head/tail: O(1) | get(i): O(n)', note: 'Higher memory per node' },
  vector:         { label: 'Vector (legacy)', color: '#64748b', description: 'Synchronized ArrayList. Avoid in new code.', note: 'Legacy — use Collections.synchronizedList' },
  cowlist:        { label: 'CopyOnWriteArrayList', color: '#38bdf8', description: 'Thread-safe by copying array on write. Best for read-heavy.', complexity: 'read: O(1) | write: O(n)', note: 'Concurrent' },
  hashset:        { label: 'HashSet', color: '#34d399', description: 'Backed by HashMap. O(1) average ops. No order.', complexity: 'add/contains/remove: O(1)' },
  linkedhashset:  { label: 'LinkedHashSet', color: '#34d399', description: 'HashSet + insertion order maintained via linked list.', complexity: 'O(1) with ordering overhead' },
  treeset:        { label: 'TreeSet', color: '#34d399', description: 'Red-Black Tree. Sorted natural or Comparator order.', complexity: 'add/contains/remove: O(log n)' },
  priorityqueue:  { label: 'PriorityQueue', color: '#fb923c', description: 'Min-heap by default. Not thread-safe.', complexity: 'offer/poll: O(log n) | peek: O(1)' },
  arraydeque:     { label: 'ArrayDeque', color: '#fb923c', description: 'Resizable circular array. Faster than Stack/LinkedList.', complexity: 'addFirst/Last: O(1)' },
  blockingqueue:  { label: 'BlockingQueue', color: '#fb923c', description: 'Thread-safe queue with blocking put/take. Used in thread pools.', note: 'Concurrent subtypes' },
  map:            { label: 'Map', color: '#f472b6', description: 'Key-value pairs. Not a Collection. Keys unique.' },
  hashmap:        { label: 'HashMap', color: '#f472b6', description: 'Hash table. O(1) avg ops. Null key/values allowed. Not thread-safe.', complexity: 'get/put: O(1) avg | O(n) worst' },
  linkedhashmap:  { label: 'LinkedHashMap', color: '#f472b6', description: 'HashMap + insertion/access order. Useful for LRU cache.', complexity: 'O(1) with order overhead' },
  treemap:        { label: 'TreeMap', color: '#f472b6', description: 'Red-Black Tree. Sorted keys. NavigableMap operations.', complexity: 'get/put/remove: O(log n)' },
  hashtable:      { label: 'Hashtable (legacy)', color: '#64748b', description: 'Synchronized Map. No null keys/values. Obsolete.', note: 'Legacy — use ConcurrentHashMap' },
  chm:            { label: 'ConcurrentHashMap', color: '#f472b6', description: 'Thread-safe. JDK 8+: CAS + node-level sync. High concurrency.', complexity: 'get/put: O(1) avg', note: 'No null keys/values' },
};

// SVG layout positions [x, y, width]
const NODES: Record<NodeId, [number, number, number]> = {
  iterable:      [290, 10, 100],
  collection:    [290, 60, 100],
  list:          [80, 120, 90],
  set:           [330, 120, 90],
  queue:         [580, 120, 110],
  arraylist:     [20, 185, 90],
  linkedlist:    [120, 185, 95],
  vector:        [20, 235, 90],
  cowlist:       [120, 235, 115],
  hashset:       [270, 185, 85],
  linkedhashset: [365, 185, 105],
  treeset:       [270, 235, 85],
  priorityqueue: [510, 185, 100],
  arraydeque:    [620, 185, 90],
  blockingqueue: [510, 235, 110],
  // Map tree — positioned right side below
  map:           [290, 300, 90],
  hashmap:       [80, 370, 90],
  linkedhashmap: [195, 370, 110],
  treemap:       [330, 370, 80],
  hashtable:     [430, 370, 95],
  chm:           [540, 370, 115],
};

// Edge definitions [from, to]
const EDGES: [NodeId, NodeId][] = [
  ['iterable', 'collection'],
  ['collection', 'list'],
  ['collection', 'set'],
  ['collection', 'queue'],
  ['list', 'arraylist'],
  ['list', 'linkedlist'],
  ['list', 'vector'],
  ['list', 'cowlist'],
  ['set', 'hashset'],
  ['set', 'linkedhashset'],
  ['set', 'treeset'],
  ['queue', 'priorityqueue'],
  ['queue', 'arraydeque'],
  ['queue', 'blockingqueue'],
  ['map', 'hashmap'],
  ['map', 'linkedhashmap'],
  ['map', 'treemap'],
  ['map', 'hashtable'],
  ['map', 'chm'],
];

function nodeCenter(id: NodeId): [number, number] {
  const [x, y, w] = NODES[id];
  return [x + w / 2, y + 14];
}

export default function CollectionsHierarchyDiagram(): React.JSX.Element {
  const [selected, setSelected] = useState<NodeId | null>(null);
  const info = selected ? NODE_INFO[selected] : null;

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      {/* Header */}
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🗂️ <span style={{ color: '#a78bfa' }}>Java Collections Framework</span> — Hierarchy Overview
        </h3>
      </div>

      {/* SVG canvas */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '12px 0' }}>
        <svg viewBox="0 0 760 420" className="interactive-diagram-svg" style={{ overflow: 'visible' }}>
          <defs>
            <marker id="ch-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 2 L 8 5 L 0 8 z" fill="rgba(148,163,184,0.5)" />
            </marker>
            <marker id="ch-arrow-active" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 2 L 8 5 L 0 8 z" fill="#a78bfa" />
            </marker>
            {/* Map separator label */}
          </defs>

          {/* Map section label */}
          <text x="290" y="285" style={{ fontFamily: 'Inter', fontSize: 9, fill: 'rgba(255,255,255,0.2)', textAnchor: 'middle', fontWeight: 700, letterSpacing: 2 }}>── MAP TREE (separate from Collection) ──</text>

          {/* Edges */}
          {EDGES.map(([from, to]) => {
            const [x1, y1] = nodeCenter(from);
            const [x2, y2] = nodeCenter(to);
            const isActive = selected === from || selected === to;
            const edgeId = `ch-edge-${from}-${to}`;
            return (
              <g key={edgeId}>
                <path
                  id={edgeId}
                  d={`M ${x1} ${y1 + 8} L ${x2} ${y2 - 8}`}
                  fill="none"
                  stroke={isActive ? '#a78bfa' : 'rgba(148,163,184,0.2)'}
                  strokeWidth={isActive ? 1.5 : 1}
                  markerEnd={isActive ? 'url(#ch-arrow-active)' : 'url(#ch-arrow)'}
                  className={isActive ? 'interactive-diagram-flowing-path' : ''}
                  style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
                />
                {isActive && (
                  <circle r="2.5" fill="#a78bfa" opacity="0.9">
                    <animateMotion dur="0.7s" repeatCount="indefinite">
                      <mpath href={`#${edgeId}`} />
                    </animateMotion>
                  </circle>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {(Object.entries(NODES) as [NodeId, [number, number, number]][]).map(([id, [x, y, w]]) => {
            const info = NODE_INFO[id];
            const isSelected = selected === id;
            const isParentOfSelected = selected ? EDGES.some(([f, t]) => f === id && t === selected) : false;
            const isChildOfSelected = selected ? EDGES.some(([f, t]) => f === selected && t === id) : false;
            const isHighlighted = isSelected || isParentOfSelected || isChildOfSelected;

            return (
              <g key={id} onClick={() => setSelected(isSelected ? null : id)} style={{ cursor: 'pointer' }}>
                <rect
                  x={x} y={y} width={w} height={22} rx={4}
                  fill={isHighlighted ? `${info.color}18` : 'rgba(15,23,42,0.6)'}
                  stroke={isHighlighted ? info.color : 'rgba(255,255,255,0.08)'}
                  strokeWidth={isHighlighted ? 1.5 : 1}
                  style={{ transition: 'fill 0.2s, stroke 0.2s' }}
                />
                <text
                  x={x + w / 2} y={y + 14}
                  style={{ fontFamily: 'Inter', fontSize: 8.5, fontWeight: isHighlighted ? 800 : 600, fill: isHighlighted ? info.color : '#94a3b8', textAnchor: 'middle', transition: 'fill 0.2s' }}
                >
                  {info.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Detail card */}
      {info ? (
        <div className="interactive-diagram-details-card details-purple" style={{ marginTop: 0 }}>
          <div className="interactive-diagram-card-header">
            
            <h3 style={{ color: NODE_INFO[selected!].color }}>{info.label}</h3>
          </div>
          <p style={{ margin: '4px 0' }}>{info.description}</p>
          {info.complexity && <p style={{ margin: '4px 0', fontSize: '0.82rem', color: '#94a3b8' }}>⚡ <strong>Complexity:</strong> {info.complexity}</p>}
          {info.note && <p style={{ margin: '4px 0', fontSize: '0.82rem', color: '#fb923c' }}>⚠️ {info.note}</p>}
        </div>
      ) : (
        <p className="interactive-diagram-helper-text">💡 Click any node to see its details, complexity, and notes.</p>
      )}
    </div>
  );
}
