import React, { useState } from 'react';

type NodeId =
  | 'throwable'
  | 'error' | 'oome' | 'soe' | 'assertion' | 'link_error'
  | 'exception'
  | 'checked' | 'ioexception' | 'sqlexception' | 'classnotfound' | 'interrupted'
  | 'runtime' | 'npe' | 'iae' | 'aioobe' | 'cce' | 'cme' | 'nse';

interface NodeMeta {
  label: string;
  category: 'root' | 'error' | 'checked' | 'unchecked' | 'group';
  description: string;
  mustHandle: boolean | null;
  tip?: string;
  example?: string;
}

const META: Record<NodeId, NodeMeta> = {
  throwable:      { label: 'Throwable', category: 'root',     mustHandle: null, description: 'The root of all Java errors and exceptions. Every thrown object must be a Throwable.', tip: 'Only Throwable and its subclasses can be caught or thrown.' },
  error:          { label: 'Error',     category: 'error',    mustHandle: false, description: 'Serious JVM-level failures. Applications should NOT try to catch these — they indicate unrecoverable conditions.', tip: 'Do not catch Error unless you have a very specific reason (e.g., logging before shutdown).' },
  oome:           { label: 'OutOfMemoryError',   category: 'error', mustHandle: false, description: 'JVM ran out of heap memory. Caused by memory leaks, enormous data loads, or misconfigured heap.', example: 'Heap dump analysis, -Xmx tuning, WeakReference usage.' },
  soe:            { label: 'StackOverflowError', category: 'error', mustHandle: false, description: 'Call stack exceeded its limit. Almost always caused by infinite recursion.', example: 'Add base case to recursive method, use iteration.' },
  assertion:      { label: 'AssertionError',     category: 'error', mustHandle: false, description: 'Thrown by a failed assert statement. Enabled with -ea JVM flag.', example: 'assert value > 0 : "must be positive";' },
  link_error:     { label: 'LinkageError',       category: 'error', mustHandle: false, description: 'Class dependency issues at link time — class version mismatch, missing classes.', example: 'NoClassDefFoundError, ClassFormatError.' },

  exception:      { label: 'Exception',          category: 'group',    mustHandle: null,  description: 'Parent of all exceptions. Subclass for domain-specific custom exceptions.', tip: 'Extend Exception for checked, RuntimeException for unchecked custom exceptions.' },
  checked:        { label: 'Checked Exceptions', category: 'checked',  mustHandle: true,  description: 'Checked at compile time. The compiler forces you to either catch them (try-catch) or declare them (throws).', tip: 'Use for recoverable conditions where the caller needs to take action.' },
  ioexception:    { label: 'IOException',         category: 'checked', mustHandle: true,  description: 'Signals an I/O failure — file not found, network drop, stream closed.', example: 'try (var is = Files.newInputStream(path)) { ... }' },
  sqlexception:   { label: 'SQLException',        category: 'checked', mustHandle: true,  description: 'Database access error. Contains vendor error code + SQL state.', example: 'Check e.getSQLState() for ANSI SQL error codes.' },
  classnotfound:  { label: 'ClassNotFoundException', category: 'checked', mustHandle: true, description: 'Class could not be found by ClassLoader at runtime via forName().', example: 'Class.forName("com.driver.Driver")' },
  interrupted:    { label: 'InterruptedException', category: 'checked', mustHandle: true, description: 'Thread was interrupted while sleeping, waiting, or blocked.', example: 'Always restore interrupt flag: Thread.currentThread().interrupt()' },

  runtime:        { label: 'RuntimeException',   category: 'unchecked', mustHandle: false, description: 'Unchecked exceptions — compiler does NOT require handling. Represent programmer bugs.', tip: 'Prefer unchecked exceptions for programming errors. Use checked for external failures.' },
  npe:            { label: 'NullPointerException',          category: 'unchecked', mustHandle: false, description: 'Accessing a member on a null reference. Java 14+ includes helpful NPE messages.', example: 'Use Optional<T> or null checks.' },
  iae:            { label: 'IllegalArgumentException',      category: 'unchecked', mustHandle: false, description: 'Method received an argument with an illegal value.', example: 'throw new IllegalArgumentException("size must be > 0")' },
  aioobe:         { label: 'ArrayIndexOutOfBoundsException',category: 'unchecked', mustHandle: false, description: 'Array access beyond its length boundary.', example: 'Validate index before access or use enhanced for-each.' },
  cce:            { label: 'ClassCastException',            category: 'unchecked', mustHandle: false, description: 'Invalid object cast at runtime. Use instanceof before casting.', example: 'if (obj instanceof String s) { ... }' },
  cme:            { label: 'ConcurrentModificationException', category: 'unchecked', mustHandle: false, description: 'Collection modified while iterating with a fail-fast iterator.', example: 'Use Iterator.remove() or CopyOnWriteArrayList.' },
  nse:            { label: 'NumberFormatException',         category: 'unchecked', mustHandle: false, description: 'String cannot be parsed to a number.', example: 'Integer.parseInt("abc") → throws NFE. Validate input first.' },
};

const CAT_COLOR: Record<string, string> = {
  root:     '#a78bfa',
  error:    '#f87171',
  checked:  '#38bdf8',
  unchecked:'#fb923c',
  group:    '#94a3b8',
};

// [x, y, w] in a 760×320 viewBox
const LAYOUT: Record<NodeId, [number, number, number]> = {
  throwable:     [295, 8, 170],

  error:         [60,  68, 120],
  oome:          [10,  140, 148],
  soe:           [10,  178, 148],
  assertion:     [10,  216, 148],
  link_error:    [10,  254, 148],

  exception:     [450, 68, 120],
  checked:       [290, 140, 130],
  ioexception:   [160, 210, 132],
  sqlexception:  [160, 248, 132],
  classnotfound: [300, 210, 170],
  interrupted:   [300, 248, 170],

  runtime:       [590, 140, 148],
  npe:           [480, 210, 152],
  iae:           [480, 248, 152],
  aioobe:        [480, 286, 152],
  cce:           [644, 210, 115],
  cme:           [644, 248, 175],
  nse:           [644, 286, 145],
};

// [from, to]
const EDGES: [NodeId, NodeId][] = [
  ['throwable', 'error'],
  ['throwable', 'exception'],
  ['error', 'oome'],
  ['error', 'soe'],
  ['error', 'assertion'],
  ['error', 'link_error'],
  ['exception', 'checked'],
  ['exception', 'runtime'],
  ['checked', 'ioexception'],
  ['checked', 'sqlexception'],
  ['checked', 'classnotfound'],
  ['checked', 'interrupted'],
  ['runtime', 'npe'],
  ['runtime', 'iae'],
  ['runtime', 'aioobe'],
  ['runtime', 'cce'],
  ['runtime', 'cme'],
  ['runtime', 'nse'],
];

function center(id: NodeId): [number, number] {
  const [x, y, w] = LAYOUT[id];
  return [x + w / 2, y + 11];
}

export default function ExceptionHierarchyDiagram(): React.JSX.Element {
  const [selected, setSelected] = useState<NodeId | null>(null);
  const sel = selected ? META[selected] : null;

  // Which nodes are connected to selected
  const connected = selected
    ? EDGES.flatMap(([f, t]) => {
        if (f === selected) return [t];
        if (t === selected) return [f];
        return [];
      })
    : [];

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      {/* Header */}
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: 'middle' }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg><span style={{ color: '#a78bfa' }}>Java Exception Hierarchy</span>
          </h3>
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { color: CAT_COLOR.error, label: 'Error (unrecoverable)' },
            { color: CAT_COLOR.checked, label: 'Checked (must handle)' },
            { color: CAT_COLOR.unchecked, label: 'Unchecked (runtime)' },
          ].map(({ color, label }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: '#94a3b8' }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: color, opacity: 0.8 }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* SVG */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ overflowX: 'auto' }}>
        <svg viewBox="0 0 810 310" className="interactive-diagram-svg" style={{ minWidth: 600 }}>
          <defs>
            {Object.entries(CAT_COLOR).map(([cat, color]) => (
              <marker key={cat} id={`eh-arr-${cat}`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                <path d="M 0 2 L 8 5 L 0 8 z" fill={color} />
              </marker>
            ))}
            <marker id="eh-arr-dim" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 2 L 8 5 L 0 8 z" fill="rgba(148,163,184,0.2)" />
            </marker>
          </defs>

          {/* Edges */}
          {EDGES.map(([from, to]) => {
            const [x1, y1] = center(from);
            const [x2, y2] = center(to);
            const toMeta = META[to];
            const edgeColor = CAT_COLOR[toMeta.category] ?? '#94a3b8';
            const isActive = selected === from || selected === to || connected.includes(from) && from === to;
            const edgeId = `eh-edge-${from}-${to}`;
            const dimmed = selected !== null && !isActive;

            return (
              <g key={edgeId}>
                <path
                  id={edgeId}
                  d={`M ${x1} ${y1 + 9} L ${x2} ${y2 - 8}`}
                  fill="none"
                  stroke={dimmed ? 'rgba(148,163,184,0.07)' : isActive ? edgeColor : 'rgba(148,163,184,0.18)'}
                  strokeWidth={isActive ? 1.5 : 1}
                  markerEnd={dimmed ? 'url(#eh-arr-dim)' : `url(#eh-arr-${toMeta.category})`}
                  style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
                />
                {isActive && (
                  <circle r="2.5" fill={edgeColor} opacity="0.85">
                    <animateMotion dur="0.75s" repeatCount="indefinite">
                      <mpath href={`#${edgeId}`} />
                    </animateMotion>
                  </circle>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {(Object.entries(LAYOUT) as [NodeId, [number, number, number]][]).map(([id, [x, y, w]]) => {
            const meta = META[id];
            const color = CAT_COLOR[meta.category];
            const isSelected = selected === id;
            const isConnected = connected.includes(id);
            const isDimmed = selected !== null && !isSelected && !isConnected;

            return (
              <g key={id} onClick={() => setSelected(isSelected ? null : id)} style={{ cursor: 'pointer' }}>
                <rect
                  x={x} y={y} width={w} height={20} rx={4}
                  fill={isSelected ? `${color}22` : isConnected ? `${color}10` : 'rgba(15,23,42,0.65)'}
                  stroke={isSelected ? color : isConnected ? `${color}80` : 'rgba(255,255,255,0.07)'}
                  strokeWidth={isSelected ? 1.8 : 1}
                  opacity={isDimmed ? 0.3 : 1}
                  style={{ transition: 'fill 0.15s, stroke 0.15s, opacity 0.15s' }}
                />
                <text
                  x={x + w / 2} y={y + 13}
                  style={{
                    fontFamily: 'Inter',
                    fontSize: id === 'throwable' || id === 'exception' || id === 'error' || id === 'runtime' || id === 'checked' ? 9 : 7.5,
                    fontWeight: isSelected ? 800 : isConnected ? 700 : 600,
                    fill: isDimmed ? 'rgba(100,116,139,0.4)' : isSelected || isConnected ? color : '#64748b',
                    textAnchor: 'middle',
                    transition: 'fill 0.15s',
                  }}
                >
                  {meta.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Detail Card */}
      {sel ? (
        <div
          className="interactive-diagram-details-card"
          style={{ borderColor: `${CAT_COLOR[sel.category]}40`, background: `${CAT_COLOR[sel.category]}08` }}
        >
          <div className="interactive-diagram-card-header">
            
            <h3 style={{ color: CAT_COLOR[sel.category] }}>{sel.label}</h3>
            {sel.mustHandle !== null && (
              <span style={{
                marginLeft: 'auto',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 4,
                background: sel.mustHandle ? 'rgba(56,189,248,0.15)' : 'rgba(251,146,60,0.15)',
                color: sel.mustHandle ? '#38bdf8' : '#fb923c',
                border: `1px solid ${sel.mustHandle ? '#38bdf840' : '#fb923c40'}`,
              }}>
                {sel.mustHandle ? '✓ Must Handle (Checked)' : '✕ No Compiler Enforcement (Unchecked)'}
              </span>
            )}
          </div>
          <p style={{ margin: '4px 0 8px' }}>{sel.description}</p>
          {sel.tip && (
            <p style={{ margin: '4px 0', fontSize: '0.82rem', padding: '6px 10px', background: 'rgba(167,139,250,0.08)', borderLeft: '3px solid #a78bfa', borderRadius: '0 4px 4px 0' }}>
              💡 <strong>Tip:</strong> {sel.tip}
            </p>
          )}
          {sel.example && (
            <div style={{ marginTop: 8 }}>
              <code style={{ display: 'block', background: 'rgba(0,0,0,0.35)', padding: '6px 10px', borderRadius: 4, fontSize: '0.79rem', color: CAT_COLOR[sel.category], lineHeight: 1.6 }}>
                {sel.example}
              </code>
            </div>
          )}
        </div>
      ) : (
        <p className="interactive-diagram-helper-text">
          💡 Click any node to see details, handling requirements, and real-world examples.
        </p>
      )}
    </div>
  );
}
