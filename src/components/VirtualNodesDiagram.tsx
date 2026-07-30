import React, { useState } from 'react';

export default function VirtualNodesDiagram(): React.JSX.Element {
  const [vnodesOn, setVnodesOn] = useState(true);

  const cx = 180;
  const cy = 115;
  const r = 70;

  const getCoords = (angleDeg: number) => {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy + r * Math.sin(angleRad)
    };
  };

  // Coordinates when Vnodes are OFF
  const posS1 = getCoords(30);
  const posS2 = getCoords(170);
  const posS3 = getCoords(220);

  // Vnodes ON details (12 nodes, interleaved S1, S2, S3)
  const vnodesList = [
    { name: 'S1_1', angle: 30, color: '#38bdf8' },
    { name: 'S2_1', angle: 60, color: '#f472b6' },
    { name: 'S3_1', angle: 90, color: '#a78bfa' },
    { name: 'S1_2', angle: 120, color: '#38bdf8' },
    { name: 'S2_2', angle: 150, color: '#f472b6' },
    { name: 'S3_2', angle: 180, color: '#a78bfa' },
    { name: 'S1_3', angle: 210, color: '#38bdf8' },
    { name: 'S2_3', angle: 240, color: '#f472b6' },
    { name: 'S3_3', angle: 270, color: '#a78bfa' },
    { name: 'S1_4', angle: 300, color: '#38bdf8' },
    { name: 'S2_4', angle: 330, color: '#f472b6' },
    { name: 'S3_4', angle: 360, color: '#a78bfa' }
  ];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span>Consistent Hashing: Virtual Nodes (Vnodes)</span>
        <button
          onClick={() => setVnodesOn(!vnodesOn)}
          style={{
            marginLeft: 'auto',
            padding: '6px 12px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '12px',
            background: vnodesOn ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
            color: vnodesOn ? '#34d399' : '#f87171',
            boxShadow: `0 0 0 1.5px ${vnodesOn ? '#34d39950' : '#f8717150'}`,
            transition: 'all 0.2s'
          }}
        >
          {vnodesOn ? 'Vnodes: ON' : 'Vnodes: OFF'}
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 767px) {
          .vn-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />

      <div className="vn-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
        {/* Left Side Ring View */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 360 230" className="interactive-diagram-svg">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="3" />
            
            {!vnodesOn ? (
              // Simple nodes: Uneven partitions
              <g>
                {/* S1 */}
                <circle cx={posS1.x} cy={posS1.y} r="10" fill="#38bdf8" stroke="#090b14" strokeWidth="1.5" />
                <text x={posS1.x + 14} y={posS1.y + 3} textAnchor="start" fill="#38bdf8" fontSize="9.5" fontWeight="800">Server S1</text>
                {/* Arc text */}
                <path d={`M ${posS3.x} ${posS3.y} A ${r} ${r} 0 0 1 ${posS1.x} ${posS1.y}`} fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3,3" />
                <text x={cx + 10} y={cy - 20} fill="#38bdf8" fontSize="8" fontWeight="bold">S1 owns ~47% of ring</text>

                {/* S2 */}
                <circle cx={posS2.x} cy={posS2.y} r="10" fill="#f472b6" stroke="#090b14" strokeWidth="1.5" />
                <text x={posS2.x} y={posS2.y + 15} textAnchor="middle" fill="#f472b6" fontSize="9.5" fontWeight="800">Server S2</text>

                {/* S3 */}
                <circle cx={posS3.x} cy={posS3.y} r="10" fill="#a78bfa" stroke="#090b14" strokeWidth="1.5" />
                <text x={posS3.x - 14} y={posS3.y + 3} textAnchor="end" fill="#a78bfa" fontSize="9.5" fontWeight="800">Server S3</text>
                <text x={cx - 50} y={cy + 40} fill="#a78bfa" fontSize="8" fontWeight="bold">S3 owns ~14%</text>
              </g>
            ) : (
              // Vnodes on ring
              <g>
                {vnodesList.map(vn => {
                  const pos = getCoords(vn.angle);
                  return (
                    <g key={vn.name}>
                      <circle cx={pos.x} cy={pos.y} r="6.5" fill={vn.color} stroke="#090b14" strokeWidth="1" />
                      <text x={pos.x + 8} y={pos.y + 3} fill={vn.color} fontSize="7" fontWeight="bold">{vn.name}</text>
                    </g>
                  );
                })}
              </g>
            )}
          </svg>
        </div>

        {/* Right Side Assessment card */}
        <div className="interactive-diagram-details-card" style={{ borderColor: vnodesOn ? '#34d399' : '#f87171' }}>
          <div className="interactive-diagram-card-header" style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--ifm-color-content)' }}>
              {vnodesOn ? '🟢 Uniform Load (Stable)' : '🔴 Key Imbalance (Danger)'}
            </span>
          </div>

          {!vnodesOn ? (
            <div>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
                <li>**Hotspot Risk**: Physical node positions are random. S1 inherits almost half the ring (47%), while S3 owns just 14%.</li>
                <li>**Unfair Load**: S1 will process 3x more writes and connections than S3, despite similar CPU/hardware capacity.</li>
                <li>**Cascade Risk**: S1 runs out of connections or hits CPU exhaustion, leading to cluster failures.</li>
              </ul>
            </div>
          ) : (
            <div>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
                <li>**Balanced Arcs**: Interleaving 12 vnode positions splits the ring into tiny slices, smoothing out load deviation.</li>
                <li>**Proportional Capacity**: Heterogeneous servers can be scaled easily (e.g. S1 gets 256 vnodes, S3 gets 128 vnodes).</li>
                <li>**Fault Isolation**: When S1 fails, its workload is distributed among S2 and S3 vnode slots on the ring instead of crashing a single neighbour.</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
