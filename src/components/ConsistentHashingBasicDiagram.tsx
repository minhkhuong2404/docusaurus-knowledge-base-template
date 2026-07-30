import React, { useState } from 'react';

interface HashKey {
  id: string;
  name: string;
  pct: number;
  angle: number;
  color: string;
  desc: string;
  targetNode: string;
  nodeColor: string;
}

const KEYS: HashKey[] = [
  {
    id: 'k1',
    name: 'Key hash = 10%',
    pct: 10,
    angle: 36,
    color: '#38bdf8',
    desc: 'Hashes to 10% on the ring. Travels clockwise and is assigned to Node N1 (25%).',
    targetNode: 'N1 (25%)',
    nodeColor: '#34d399'
  },
  {
    id: 'k2',
    name: 'Key hash = 40%',
    pct: 40,
    angle: 144,
    color: '#fbbf24',
    desc: 'Hashes to 40% on the ring. Travels clockwise and is assigned to Node N2 (50%).',
    targetNode: 'N2 (50%)',
    nodeColor: '#f472b6'
  },
  {
    id: 'k3',
    name: 'Key hash = 60%',
    pct: 60,
    angle: 216,
    color: '#a78bfa',
    desc: 'Hashes to 60% on the ring. Travels clockwise and is assigned to Node N3 (75%).',
    targetNode: 'N3 (75%)',
    nodeColor: '#a78bfa'
  }
];

export default function ConsistentHashingBasicDiagram(): React.JSX.Element {
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);

  const cx = 180;
  const cy = 115;
  const r = 70;

  // Convert percentage/angle to coordinates
  const getCoords = (angleDeg: number) => {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy + r * Math.sin(angleRad)
    };
  };

  const selectedKey = KEYS.find(k => k.id === selectedKeyId) || null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span>Basic Consistent Hashing Ring</span>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 767px) {
          .chb-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />

      <div className="chb-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
        {/* Left Ring View */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 360 230" className="interactive-diagram-svg">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="3" />
            <text x={cx} y={cy - r - 8} textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8">0%</text>
            <text x={cx} y={cy + r + 14} textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="8">50%</text>

            {/* Nodes on Ring */}
            {/* N1 (25% = 90 deg) */}
            <circle cx={cx + r} cy={cy} r="9" fill="#34d399" stroke="#090b14" strokeWidth="1.5" />
            <text x={cx + r + 14} y={cy + 3} textAnchor="start" fill="#34d399" fontSize="9" fontWeight="800">N1 (25%)</text>

            {/* N2 (50% = 180 deg) */}
            <circle cx={cx} cy={cy + r} r="9" fill="#f472b6" stroke="#090b14" strokeWidth="1.5" />
            <text x={cx} y={cy + r + 15} textAnchor="middle" fill="#f472b6" fontSize="9" fontWeight="800"></text>

            {/* N3 (75% = 270 deg) */}
            <circle cx={cx - r} cy={cy} r="9" fill="#a78bfa" stroke="#090b14" strokeWidth="1.5" />
            <text x={cx - r - 14} y={cy + 3} textAnchor="end" fill="#a78bfa" fontSize="9" fontWeight="800">N3 (75%)</text>

            {/* Keys mapping */}
            {KEYS.map(k => {
              const pos = getCoords(k.angle);
              const isSelected = selectedKeyId === k.id;
              
              // Define path along the arc for selection
              // Draw line from key position to target node position
              let targetAngle = 90; // Default N1
              if (k.id === 'k2') targetAngle = 180; // N2
              if (k.id === 'k3') targetAngle = 270; // N3
              
              const targetPos = getCoords(targetAngle);
              const pathId = `arc-path-${k.id}`;
              
              // Pad connecting lines between key position and target node (Rule 10)
              const angleRad = Math.atan2(targetPos.y - pos.y, targetPos.x - pos.x);
              const startX = pos.x + 3 * Math.cos(angleRad);
              const startY = pos.y + 3 * Math.sin(angleRad);
              const targetX = targetPos.x - 12 * Math.cos(angleRad);
              const targetY = targetPos.y - 12 * Math.sin(angleRad);

              return (
                <g key={k.id} onClick={() => setSelectedKeyId(selectedKeyId === k.id ? null : k.id)} style={{ cursor: 'pointer' }}>
                  {/* Key mark on ring */}
                  <circle cx={pos.x} cy={pos.y} r="5.5" fill={k.color} stroke="#090b14" strokeWidth="1" />
                  <text x={pos.x + 8} y={pos.y - 4} fill={k.color} fontSize="8" fontWeight="700">{`${k.pct}%`}</text>

                  {/* Flow line */}
                  {isSelected && (
                    <g>
                      <path
                        id={pathId}
                        d={`M ${startX} ${startY} L ${targetX} ${targetY}`}
                        fill="none"
                        stroke={k.color}
                        strokeWidth="2"
                        strokeDasharray="4,3"
                      />
                      <circle r="2.5" fill={k.color} className="interactive-diagram-flowing-dot">
                        <animateMotion dur="0.9s" repeatCount="indefinite">
                          <mpath href={`#${pathId}`} />
                        </animateMotion>
                      </circle>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Right Details Side */}
        <div className="interactive-diagram-details-card" style={{ borderColor: selectedKey ? selectedKey.color : 'rgba(255,255,255,0.08)' }}>
          <div className="interactive-diagram-card-header" style={{ marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
            <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--ifm-color-content)' }}>
              ⚙ Key-to-Node Routing
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {KEYS.map(k => {
              const isSelected = selectedKeyId === k.id;
              return (
                <button
                  key={k.id}
                  onClick={() => setSelectedKeyId(selectedKeyId === k.id ? null : k.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: isSelected ? `${k.color}15` : 'rgba(255, 255, 255, 0.02)',
                    boxShadow: isSelected ? `0 0 0 1.5px ${k.color}50` : '0 0 0 1px rgba(255, 255, 255, 0.05)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '11px', fontWeight: 'bold' }}>
                    <span style={{ color: k.color }}>{k.name}</span>
                    <span style={{ color: k.nodeColor }}>➔ {k.targetNode}</span>
                  </div>
                  {isSelected && (
                    <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                      {k.desc}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <span className="interactive-diagram-helper-text">💡 Click a key percentage on the ring or choose from the list to trace its routing clockwise to the owning node.</span>
    </div>
  );
}
