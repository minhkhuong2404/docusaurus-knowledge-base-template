import React, { useState } from 'react';

const SEGMENTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

export default function JDK7SegmentLockingDiagram(): React.JSX.Element {
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const [writing, setWriting] = useState<number[]>([]);

  function simulateWrite(seg: number) {
    if (writing.includes(seg)) return;
    setActiveSegment(seg);
    setWriting(prev => [...prev, seg]);
    setTimeout(() => {
      setWriting(prev => prev.filter(s => s !== seg));
      setActiveSegment(null);
    }, 1800);
  }

  const segW = 36;
  const segGap = 4;
  const totalW = SEGMENTS.length * (segW + segGap);
  const startX = (680 - totalW) / 2;

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🔒 <span style={{ color: '#38bdf8' }}>JDK 7</span> — Segment-Based Locking (ConcurrentHashMap)
        </h3>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 230" className="interactive-diagram-svg">
          <defs>
            <marker id="jdk7-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 2 L 8 5 L 0 8 z" fill="#38bdf8" />
            </marker>
            <marker id="jdk7-arrow-locked" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 2 L 8 5 L 0 8 z" fill="#f87171" />
            </marker>
          </defs>

          {/* ConcurrentHashMap label */}
          <rect x="240" y="8" width="200" height="28" rx="6" fill="rgba(56,189,248,0.08)" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="340" y="27" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, fill: '#38bdf8', textAnchor: 'middle' }}>ConcurrentHashMap</text>

          {/* Arrow down to segments */}
          <line x1="340" y1="36" x2="340" y2="55" stroke="rgba(56,189,248,0.3)" strokeWidth="1" markerEnd="url(#jdk7-arrow)" />

          {/* Segments row */}
          {SEGMENTS.map((seg, i) => {
            const x = startX + i * (segW + segGap);
            const isActive = writing.includes(seg);
            const isHovered = activeSegment === seg && !isActive;
            return (
              <g key={seg} onClick={() => simulateWrite(seg)} style={{ cursor: 'pointer' }}>
                {/* Segment box */}
                <rect
                  x={x} y={62} width={segW} height={32} rx={4}
                  fill={isActive ? 'rgba(248,113,113,0.15)' : isHovered ? 'rgba(56,189,248,0.1)' : 'rgba(15,23,42,0.7)'}
                  stroke={isActive ? '#f87171' : isHovered ? '#38bdf8' : 'rgba(255,255,255,0.1)'}
                  strokeWidth={isActive ? 1.5 : 1}
                  style={{ transition: 'fill 0.15s, stroke 0.15s' }}
                />
                <text x={x + segW / 2} y={77} style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 7.5, fill: isActive ? '#f87171' : '#94a3b8', textAnchor: 'middle' }}>
                  {`Seg[${seg}]`}
                </text>
                <text x={x + segW / 2} y={89} style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 6.5, fill: isActive ? '#f87171' : '#475569', textAnchor: 'middle' }}>
                  {isActive ? '🔒' : '🔓'}
                </text>

                {/* Arrow to HashEntry */}
                <line
                  x1={x + segW / 2} y1={94}
                  x2={x + segW / 2} y2={118}
                  stroke={isActive ? '#f87171' : 'rgba(148,163,184,0.2)'}
                  strokeWidth={isActive ? 1.5 : 1}
                  markerEnd={isActive ? 'url(#jdk7-arrow-locked)' : 'url(#jdk7-arrow)'}
                  style={{ transition: 'stroke 0.15s' }}
                />

                {/* HashEntry box */}
                <rect x={x} y={118} width={segW} height={22} rx={3} fill="rgba(15,23,42,0.6)" stroke={isActive ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.05)'} />
                <text x={x + segW / 2} y={133} style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 6, fill: '#64748b', textAnchor: 'middle' }}>
                  HashEntry[]
                </text>

                {/* Arrow to linked list */}
                <line x1={x + segW / 2} y1={140} x2={x + segW / 2} y2={158} stroke="rgba(148,163,184,0.15)" strokeWidth={1} />

                {/* Linked list node chain */}
                <rect x={x + 2} y={158} width={segW - 4} height={16} rx={2} fill="rgba(15,23,42,0.5)" stroke="rgba(255,255,255,0.04)" />
                <text x={x + segW / 2} y={169} style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 5.5, fill: '#334155', textAnchor: 'middle' }}>→ node →</text>

                {/* Particle on active write */}
                {isActive && (
                  <>
                    <circle r="2.5" fill="#f87171" opacity="0.9">
                      <animate attributeName="cy" values="94;118;140;158" dur="0.6s" repeatCount="indefinite" />
                      <animate attributeName="cx" values={`${x + segW / 2};${x + segW / 2};${x + segW / 2};${x + segW / 2}`} dur="0.6s" repeatCount="indefinite" />
                    </circle>
                  </>
                )}
              </g>
            );
          })}

          {/* Concurrency level label */}
          <rect x="10" y="195" width="660" height="24" rx="4" fill="rgba(56,189,248,0.05)" stroke="rgba(56,189,248,0.1)" />
          <text x="340" y="211" style={{ fontFamily: 'Inter', fontSize: 8.5, fill: '#64748b', textAnchor: 'middle' }}>
            Default concurrency level: 16 segments → up to <tspan fill="#38bdf8" fontWeight="700">16 concurrent writers</tspan>. Each segment holds a ReentrantLock.
          </text>
        </svg>
      </div>

      <div className="interactive-diagram-details-card details-cyan">
        <div className="interactive-diagram-card-header">
          
          <h3>How It Works</h3>
        </div>
        <ul>
          <li><strong>16 Segments</strong>: The map is divided into Segment[0..15], each with its own <code>ReentrantLock</code>.</li>
          <li><strong>Per-segment locking</strong>: Writing to Segment[3] locks only Segment[3]; all other segments remain fully concurrent.</li>
          <li><strong>HashEntry[]</strong>: Each segment holds its own hash bucket array → linked list chain.</li>
          <li><strong>Limitation</strong>: Segment overhead + 16-thread concurrency ceiling replaced in JDK 8.</li>
        </ul>
        <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '4px 0 0' }}>
          👆 Click any segment above to simulate a concurrent write acquiring the lock.
        </p>
      </div>
    </div>
  );
}
