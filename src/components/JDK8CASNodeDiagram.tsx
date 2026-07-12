import React, { useState } from 'react';

type BucketState = 'empty' | 'cas' | 'sync' | 'tree';

interface BucketInfo {
  label: string;
  state: BucketState;
  color: string;
  detail: string;
  operation: string;
}

const BUCKETS: BucketInfo[] = [
  { label: 'Bucket 0', state: 'empty',  color: '#38bdf8', detail: 'Empty bucket → CAS insert (lock-free)',          operation: 'CAS compareAndSwap(null → Node)' },
  { label: 'Bucket 1', state: 'cas',    color: '#a78bfa', detail: 'Collision on empty → CAS retry wins',            operation: 'CAS(null → Node) — atomic, no lock' },
  { label: 'Bucket 2', state: 'sync',   color: '#fb923c', detail: 'Bucket has ≥1 node → synchronized(head)',        operation: 'synchronized(firstNode) { append to list }' },
  { label: 'Bucket 3', state: 'tree',   color: '#4ade80', detail: 'Bin length ≥ 8 → treeify to Red-Black Tree',     operation: 'synchronized(firstNode) { insert into RBTree }' },
  { label: 'Bucket 4', state: 'empty',  color: '#38bdf8', detail: 'Empty bucket → CAS insert (lock-free)',          operation: 'CAS compareAndSwap(null → Node)' },
  { label: 'Bucket 5', state: 'sync',   color: '#fb923c', detail: 'Bucket occupied → synchronized on head node',    operation: 'synchronized(firstNode) { linked list insert }' },
  { label: 'Bucket 6', state: 'cas',    color: '#a78bfa', detail: 'Empty, thread-safe via CAS with no lock',        operation: 'CAS(null → Node) — zero contention' },
  { label: 'Bucket 7', state: 'tree',   color: '#4ade80', detail: 'Treeified (≥8 entries) → RB-Tree node insert',  operation: 'synchronized(firstNode) { TreeNode.insert() }' },
];

const STATE_LABELS: Record<BucketState, string> = {
  empty: 'Empty → CAS',
  cas:   'CAS Insert',
  sync:  'Synchronized',
  tree:  'RB-Tree',
};

export default function JDK8CASNodeDiagram(): React.JSX.Element {
  const [active, setActive] = useState<number | null>(null);
  const [animating, setAnimating] = useState<number[]>([]);

  function triggerAnimation(i: number) {
    if (animating.includes(i)) return;
    setActive(i);
    setAnimating(prev => [...prev, i]);
    setTimeout(() => {
      setAnimating(prev => prev.filter(x => x !== i));
      setActive(null);
    }, 1600);
  }

  const bucketW = 74;
  const bucketGap = 6;
  const startX = (680 - (BUCKETS.length * (bucketW + bucketGap) - bucketGap)) / 2;

  const sel = active !== null ? BUCKETS[active] : null;

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          ⚡ <span style={{ color: '#4ade80' }}>JDK 8</span> — CAS + Synchronized Node-Based (ConcurrentHashMap)
        </h3>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 250" className="interactive-diagram-svg">
          <defs>
            <marker id="jdk8-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 2 L 8 5 L 0 8 z" fill="rgba(148,163,184,0.4)" />
            </marker>
          </defs>

          {/* Node[] flat array label */}
          <rect x="200" y="10" width="280" height="26" rx="6" fill="rgba(74,222,128,0.07)" stroke="#4ade80" strokeWidth="1.2" />
          <text x="340" y="27" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10.5, fill: '#4ade80', textAnchor: 'middle' }}>
            Node[] — Flat Hash Array (JDK 8)
          </text>

          {/* Buckets */}
          {BUCKETS.map((b, i) => {
            const x = startX + i * (bucketW + bucketGap);
            const isAnim = animating.includes(i);
            const isSelected = active === i;
            const stateColor = b.color;

            return (
              <g key={i} onClick={() => triggerAnimation(i)} style={{ cursor: 'pointer' }}>
                {/* Top Node[] index box */}
                <rect
                  x={x} y={46} width={bucketW} height={24} rx={4}
                  fill={isAnim ? `${stateColor}20` : 'rgba(15,23,42,0.7)'}
                  stroke={isAnim ? stateColor : 'rgba(255,255,255,0.09)'}
                  strokeWidth={isAnim ? 1.5 : 1}
                  style={{ transition: 'fill 0.15s, stroke 0.15s' }}
                />
                <text x={x + bucketW / 2} y={58} style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 7.5, fill: isAnim ? stateColor : '#64748b', textAnchor: 'middle' }}>
                  [{i}]
                </text>
                <text x={x + bucketW / 2} y={67} style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 6.5, fill: isAnim ? stateColor : '#334155', textAnchor: 'middle' }}>
                  {STATE_LABELS[b.state]}
                </text>

                {/* Connector line */}
                <line
                  x1={x + bucketW / 2} y1={70}
                  x2={x + bucketW / 2} y2={95}
                  stroke={isAnim ? stateColor : 'rgba(148,163,184,0.15)'}
                  strokeWidth={isAnim ? 1.5 : 1}
                  markerEnd="url(#jdk8-arr)"
                  style={{ transition: 'stroke 0.15s' }}
                />

                {/* Data structure box */}
                {b.state === 'empty' && (
                  <>
                    <rect x={x} y={95} width={bucketW} height={20} rx={3} fill="rgba(56,189,248,0.05)" stroke={isAnim ? '#38bdf8' : 'rgba(255,255,255,0.05)'} strokeDasharray="3,2" />
                    <text x={x + bucketW / 2} y={109} style={{ fontFamily: 'Inter', fontSize: 7, fill: isAnim ? '#38bdf8' : '#475569', textAnchor: 'middle', fontWeight: 600 }}>null (empty)</text>
                  </>
                )}
                {(b.state === 'cas' || b.state === 'sync') && (
                  <>
                    {[0, 1, 2].map(j => (
                      <g key={j}>
                        <rect x={x} y={95 + j * 26} width={bucketW} height={20} rx={3}
                          fill={isAnim ? `${stateColor}10` : 'rgba(15,23,42,0.6)'}
                          stroke={isAnim && j === 0 ? stateColor : 'rgba(255,255,255,0.06)'}
                          strokeWidth={isAnim && j === 0 ? 1.2 : 1}
                        />
                        <text x={x + bucketW / 2} y={109 + j * 26} style={{ fontFamily: 'Inter', fontSize: 6.5, fill: isAnim && j === 0 ? stateColor : '#475569', textAnchor: 'middle', fontWeight: j === 0 ? 700 : 500 }}>
                          {j === 0 ? '▶ head Node' : `  Node ${j + 1}`}
                        </text>
                        {j < 2 && <line x1={x + bucketW / 2} y1={115 + j * 26} x2={x + bucketW / 2} y2={121 + j * 26} stroke="rgba(148,163,184,0.15)" strokeWidth={1} />}
                      </g>
                    ))}
                  </>
                )}
                {b.state === 'tree' && (
                  <>
                    <rect x={x} y={95} width={bucketW} height={80} rx={3} fill={isAnim ? 'rgba(74,222,128,0.06)' : 'rgba(15,23,42,0.6)'} stroke={isAnim ? '#4ade80' : 'rgba(255,255,255,0.06)'} strokeWidth={isAnim ? 1.2 : 1} />
                    {/* Mini RB-tree visual */}
                    <circle cx={x + bucketW / 2} cy={115} r={6} fill={isAnim ? '#4ade8080' : '#1e293b'} stroke={isAnim ? '#4ade80' : '#334155'} strokeWidth={1} />
                    <circle cx={x + bucketW / 2 - 14} cy={133} r={5} fill={isAnim ? '#f8717140' : '#1e293b'} stroke={isAnim ? '#f87171' : '#334155'} strokeWidth={1} />
                    <circle cx={x + bucketW / 2 + 14} cy={133} r={5} fill={isAnim ? '#4ade8040' : '#1e293b'} stroke={isAnim ? '#4ade80' : '#334155'} strokeWidth={1} />
                    <line x1={x + bucketW / 2 - 5} y1={120} x2={x + bucketW / 2 - 10} y2={128} stroke={isAnim ? '#4ade8060' : '#334155'} strokeWidth={1} />
                    <line x1={x + bucketW / 2 + 5} y1={120} x2={x + bucketW / 2 + 10} y2={128} stroke={isAnim ? '#4ade8060' : '#334155'} strokeWidth={1} />
                    <text x={x + bucketW / 2} y={112} style={{ fontFamily: 'Inter', fontSize: 5.5, fill: isAnim ? '#4ade80' : '#475569', textAnchor: 'middle', fontWeight: 700 }}>root</text>
                    <text x={x + bucketW / 2} y={163} style={{ fontFamily: 'Inter', fontSize: 6, fill: isAnim ? '#4ade80' : '#334155', textAnchor: 'middle' }}>RB-Tree ≥8</text>
                  </>
                )}

                {/* Animated particle on click */}
                {isAnim && (
                  <circle r="3" fill={stateColor} opacity="0.85">
                    <animate attributeName="cy" values="46;70;95;175" dur="0.5s" repeatCount="indefinite" />
                    <animate attributeName="cx" values={`${x + bucketW / 2};${x + bucketW / 2};${x + bucketW / 2};${x + bucketW / 2}`} dur="0.5s" repeatCount="indefinite" />
                  </circle>
                )}
              </g>
            );
          })}

          {/* Bottom legend */}
          {[
            { color: '#38bdf8', label: 'Empty → CAS (lock-free)' },
            { color: '#a78bfa', label: 'CAS insert' },
            { color: '#fb923c', label: 'synchronized(head)' },
            { color: '#4ade80', label: 'RB-Tree (≥8 nodes)' },
          ].map((item, i) => (
            <g key={i}>
              <rect x={26 + i * 160} y={220} width={8} height={8} rx={2} fill={item.color} opacity="0.7" />
              <text x={40 + i * 160} y={228} style={{ fontFamily: 'Inter', fontSize: 7, fill: '#64748b' }}>{item.label}</text>
            </g>
          ))}
        </svg>
      </div>

      {/* Detail card */}
      {sel ? (
        <div className="interactive-diagram-details-card" style={{ borderColor: `${sel.color}40`, background: `${sel.color}08` }}>
          <div className="interactive-diagram-card-header">
            
            <h3 style={{ color: sel.color }}>{sel.label} — {STATE_LABELS[sel.state]}</h3>
          </div>
          <p><strong>Scenario:</strong> {sel.detail}</p>
          <p><code style={{ color: sel.color, background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: 4, fontSize: '0.82rem' }}>{sel.operation}</code></p>
          <ul style={{ marginTop: 8 }}>
            {sel.state === 'empty' && <>
              <li>Bucket is <strong>null</strong> — no existing head node.</li>
              <li>Thread calls <code>U.compareAndSwapObject(tab, i, null, newNode)</code> — atomic, <strong>no mutex needed</strong>.</li>
              <li>If CAS fails (race), retries from the top of the loop.</li>
            </>}
            {sel.state === 'cas' && <>
              <li>Equivalent to 'empty' path — CAS resolves atomically.</li>
              <li>Zero lock contention if buckets are non-overlapping.</li>
            </>}
            {sel.state === 'sync' && <>
              <li>Bucket already has a head node.</li>
              <li><code>synchronized(f)</code> — <strong>lock acquired on the head node only</strong>, not the whole map.</li>
              <li>Other threads writing to different buckets proceed without waiting.</li>
            </>}
            {sel.state === 'tree' && <>
              <li>Bin length ≥ 8 triggers <strong>treeification</strong> to a Red-Black Tree.</li>
              <li>O(log n) insert instead of O(n) linked list scan.</li>
              <li>Lock is still <code>synchronized(firstNode)</code>, but the structure is now a TreeNode.</li>
            </>}
          </ul>
        </div>
      ) : (
        <p className="interactive-diagram-helper-text">💡 Click any bucket to see the exact locking strategy used for that bin type.</p>
      )}
    </div>
  );
}
