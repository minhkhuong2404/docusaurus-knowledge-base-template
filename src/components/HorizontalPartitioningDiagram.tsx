import React, { useState, useEffect } from 'react';

const SHARDS = [
  { id: 0, name: 'Shard A (user_id % 3 = 0)', color: '#34d399', x: 60, y: 130, w: 140, h: 50 },
  { id: 1, name: 'Shard B (user_id % 3 = 1)', color: '#38bdf8', x: 270, y: 130, w: 140, h: 50 },
  { id: 2, name: 'Shard C (user_id % 3 = 2)', color: '#a78bfa', x: 480, y: 130, w: 140, h: 50 }
];

export default function HorizontalPartitioningDiagram(): React.JSX.Element {
  const [selectedId, setSelectedId] = useState<number>(120);
  const [animate, setAnimate] = useState(false);

  const targetShardId = selectedId % 3;
  const targetShard = SHARDS.find(s => s.id === targetShardId)!;

  useEffect(() => {
    setAnimate(true);
    const t = setTimeout(() => setAnimate(false), 900);
    return () => clearTimeout(t);
  }, [selectedId]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/>
        </svg>
        <span>Horizontal Partitioning (Row-Based Sharding Modulo)</span>
      </div>

      {/* Controller Buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {[120, 121, 122, 123, 124, 125].map(id => {
          const shardId = id % 3;
          const shardColor = SHARDS[shardId].color;
          const isActive = selectedId === id;
          return (
            <button
              key={id}
              onClick={() => setSelectedId(id)}
              style={{
                flex: 1,
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '11px',
                background: isActive ? `${shardColor}18` : 'rgba(255,255,255,0.03)',
                color: isActive ? shardColor : 'var(--ifm-color-content-secondary)',
                boxShadow: isActive ? `0 0 0 1.5px ${shardColor}50` : '0 0 0 1px rgba(255,255,255,0.06)',
                transition: 'all 0.15s ease'
              }}
            >
              Insert user_id {id}
            </button>
          );
        })}
      </div>

      {/* SVG Ring Canvas */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 200" className="interactive-diagram-svg">
          <defs>
            {SHARDS.map(s => (
              <marker key={`arr-${s.id}`} id={`arr-shard-${s.id}`} viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={s.color} />
              </marker>
            ))}
          </defs>

          {/* Router Node */}
          <g>
            <rect x="270" y="15" width="140" height="40" rx="6" fill="rgba(255, 255, 255, 0.03)" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.5" />
            <text x="340" y="34" textAnchor="middle" fill="var(--ifm-color-content)" fontSize="11" fontWeight="800">Shard Router</text>
            <text x="340" y="47" textAnchor="middle" fill="#38bdf8" fontSize="8" fontFamily="monospace">
              {`Hash: ${selectedId} % 3 = ${targetShardId}`}
            </text>
          </g>

          {/* Paths and Shards */}
          {SHARDS.map(s => {
            const isActive = s.id === targetShardId;
            const targetX = s.x + s.w / 2;
            const pathId = `path-shard-${s.id}`;
            const pathD = `M 340 55 C 340 90, ${targetX} 90, ${targetX} 123`;

            return (
              <g key={s.id}>
                {/* Connector path */}
                <path
                  id={pathId}
                  d={pathD}
                  fill="none"
                  stroke={isActive ? s.color : 'rgba(255,255,255,0.08)'}
                  strokeWidth={isActive ? 2.2 : 1.2}
                  markerEnd={`url(#arr-shard-${s.id})`}
                  className={isActive && animate ? 'interactive-diagram-flowing-path' : ''}
                />

                {/* Flowing packet */}
                {isActive && animate && (
                  <circle r="3.5" fill={s.color} className="interactive-diagram-flowing-dot">
                    <animateMotion dur="0.8s" repeatCount="1">
                      <mpath href={`#${pathId}`} />
                    </animateMotion>
                  </circle>
                )}

                {/* Shard server node */}
                <g>
                  <rect
                    x={s.x}
                    y={s.y}
                    width={s.w}
                    height={s.h}
                    rx="5"
                    fill={isActive ? `${s.color}15` : 'rgba(0,0,0,0.15)'}
                    stroke={isActive ? s.color : 'rgba(255,255,255,0.12)'}
                    strokeWidth="1.5"
                    style={{ transition: 'all 0.3s' }}
                  />
                  <text x={s.x + s.w / 2} y={s.y + 24} textAnchor="middle" fill={isActive ? s.color : 'var(--ifm-color-content-secondary)'} fontSize="9.5" fontWeight="800">
                    {s.name}
                  </text>
                  <text x={s.x + s.w / 2} y={s.y + 38} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="7.5">
                    {isActive ? `📝 Storing user_id ${selectedId}` : 'listening'}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      <div style={{ marginTop: '10px', fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', background: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
        💡 **Modulo Sharding Mechanics:** Each row is routed entirely to a dedicated physical server partition based on `user_id % N`. While simple and effective, a major drawback is that changing `N` (adding/removing shards) forces almost all key locations to remap, causing massive data reshuffling.
      </div>
    </div>
  );
}
