import React, { useState } from 'react';

export default function ConsistentHashingDiagram(): React.JSX.Element {
  const [nodeDActive, setNodeDActive] = useState(false);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  // Circle Specs
  const cx = 180;
  const cy = 115;
  const r = 70;

  // Convert angle (0 to 360) to coordinate
  // 0 deg is top (12 o'clock), growing clockwise
  const getCoords = (angleDeg: number, radius = r) => {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(angleRad),
      y: cy + radius * Math.sin(angleRad)
    };
  };

  // Node Positions (Angles on ring)
  const nodeA = 120;
  const nodeB = 240;
  const nodeC = 0; // 360
  const nodeD = 300;

  // Coordinates
  const posA = getCoords(nodeA);
  const posB = getCoords(nodeB);
  const posC = getCoords(nodeC);
  const posD = getCoords(nodeD);

  // Keys to hash (Angles on ring)
  const keys = [
    { id: 'key1', label: 'user-42', angle: 45, color: '#38bdf8' },
    { id: 'key2', label: 'user-99', angle: 160, color: '#a78bfa' },
    { id: 'key3', label: 'user-uuid', angle: 280, color: '#fbbf24' }
  ];

  // Determine owner node based on D active status
  const getKeyOwner = (angle: number) => {
    if (angle <= nodeA) return { label: 'Node A', pos: posA, color: '#34d399' };
    if (angle <= nodeB) return { label: 'Node B', pos: posB, color: '#f472b6' };
    if (nodeDActive) {
      if (angle <= nodeD) return { label: 'Node D', pos: posD, color: '#2dd4bf' };
      return { label: 'Node C', pos: posC, color: '#a78bfa' };
    }
    return { label: 'Node C', pos: posC, color: '#a78bfa' };
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span>Consistent Hashing Ring Playground</span>
        <button
          onClick={() => {
            setNodeDActive(!nodeDActive);
            setHoveredKey(null);
          }}
          style={{
            marginLeft: 'auto',
            padding: '6px 12px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '12px',
            background: nodeDActive ? 'rgba(248,113,113,0.15)' : 'rgba(52,211,153,0.15)',
            color: nodeDActive ? '#f87171' : '#34d399',
            boxShadow: `0 0 0 1.5px ${nodeDActive ? '#f8717150' : '#34d39950'}`,
            transition: 'all 0.2s'
          }}
        >
          {nodeDActive ? 'Remove Node D' : 'Add Node D'}
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 767px) {
          .ch-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />

      <div className="ch-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
        {/* Left Side: SVG Ring */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 360 230" className="interactive-diagram-svg">
            <defs>
              <marker id="ch-arr" viewBox="0 0 10 10" refX="6" refY="3" orient="auto" markerWidth="6" markerHeight="6">
                <path d="M0,0 L0,6 L8,3 z" fill="context-fill" />
              </marker>
            </defs>

            {/* Circular Ring */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="3" />
            <text x={cx} y={cy - r - 8} textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="7">0 / 2^32</text>

            {/* Physical Nodes */}
            {/* Node C */}
            <circle cx={posC.x} cy={posC.y} r="10" fill="#a78bfa" stroke="#090b14" strokeWidth="1.5" />
            <text x={posC.x} y={posC.y - 14} textAnchor="middle" fill="#a78bfa" fontSize="9" fontWeight="800">Node C</text>

            {/* Node A */}
            <circle cx={posA.x} cy={posA.y} r="10" fill="#34d399" stroke="#090b14" strokeWidth="1.5" />
            <text x={posA.x + 14} y={posA.y + 3} textAnchor="start" fill="#34d399" fontSize="9" fontWeight="800">Node A</text>

            {/* Node B */}
            <circle cx={posB.x} cy={posB.y} r="10" fill="#f472b6" stroke="#090b14" strokeWidth="1.5" />
            <text x={posB.x - 14} y={posB.y + 3} textAnchor="end" fill="#f472b6" fontSize="9" fontWeight="800">Node B</text>

            {/* Node D (Conditional) */}
            <g style={{ opacity: nodeDActive ? 1 : 0, transition: 'opacity 0.4s ease' }}>
              <circle cx={posD.x} cy={posD.y} r="10" fill="#2dd4bf" stroke="#090b14" strokeWidth="1.5" />
              <text x={posD.x - 14} y={posD.y - 6} textAnchor="end" fill="#2dd4bf" fontSize="9" fontWeight="800">Node D</text>
            </g>

            {/* Keys on Ring */}
            {keys.map(k => {
              const kPos = getCoords(k.angle);
              const owner = getKeyOwner(k.angle);
              const isHovered = hoveredKey === k.id;
              
              // Pad connecting lines between key position and target node (Rule 10)
              const angleRad = Math.atan2(owner.pos.y - kPos.y, owner.pos.x - kPos.x);
              const startX = kPos.x + 4 * Math.cos(angleRad);
              const startY = kPos.y + 4 * Math.sin(angleRad);
              const targetX = owner.pos.x - 12 * Math.cos(angleRad);
              const targetY = owner.pos.y - 12 * Math.sin(angleRad);
              
              const pathId = `key-path-${k.id}`;

              return (
                <g
                  key={k.id}
                  onMouseEnter={() => setHoveredKey(k.id)}
                  onMouseLeave={() => setHoveredKey(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Key node dot */}
                  <circle cx={kPos.x} cy={kPos.y} r="5" fill={k.color} />
                  <text
                    x={kPos.x + 8}
                    y={kPos.y - 4}
                    fill={k.color}
                    fontSize="7.5"
                    fontWeight="700"
                  >
                    {k.label}
                  </text>

                  {/* Connection Line to Clockwise Owner */}
                  <path
                    id={pathId}
                    d={`M ${startX} ${startY} L ${targetX} ${targetY}`}
                    fill="none"
                    stroke={k.color}
                    strokeWidth={isHovered ? 2 : 1}
                    strokeDasharray={isHovered ? 'none' : '3,3'}
                    markerEnd="url(#ch-arr)"
                    fillRule="nonzero"
                    style={{ transition: 'stroke-width 0.2s', stroke: k.color }}
                  />

                  {/* Running particle */}
                  {isHovered && (
                    <circle r="2" fill={k.color} className="interactive-diagram-flowing-dot">
                      <animateMotion dur="0.8s" repeatCount="indefinite">
                        <mpath href={`#${pathId}`} />
                      </animateMotion>
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Right Side: Details panel */}
        <div className="interactive-diagram-details-card" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="interactive-diagram-card-header" style={{ marginBottom: '10px' }}>
            <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--ifm-color-content)' }}>
              ⚙ Hashing Allocations
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {keys.map(k => {
              const owner = getKeyOwner(k.angle);
              const isHovered = hoveredKey === k.id;
              
              // Track if key mapped to Node A was migrated to D
              const isMigrated = k.id === 'key3' && nodeDActive;

              return (
                <div
                  key={k.id}
                  onMouseEnter={() => setHoveredKey(k.id)}
                  onMouseLeave={() => setHoveredKey(null)}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    background: isHovered ? `${k.color}12` : 'rgba(0,0,0,0.15)',
                    border: `1px solid ${isHovered ? `${k.color}40` : 'rgba(255,255,255,0.04)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: k.color }}>
                      {k.label}
                    </span>
                    <span style={{ fontSize: '11px', color: owner.color, fontWeight: 700 }}>
                      ➔ {owner.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>
                    Hashes to {k.angle}° on ring. Counter-clockwise node is owned by {owner.label}.
                  </div>
                  {isMigrated && (
                    <div style={{ fontSize: '9.5px', color: '#fbbf24', marginTop: '2px', fontWeight: 'bold' }}>
                      ⚡ Migrated! (Mapped to Node C, now owned by Node D)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <span className="interactive-diagram-helper-text">💡 Hover over keys (or labels) to trace lines. Click "Add Node D" to see Node D slice the ring and migrate only `user-uuid` while leaving `user-42` and `user-99` untouched.</span>
    </div>
  );
}
