import React, { useState } from 'react';

export default function ReplicationConsistentHashingDiagram(): React.JSX.Element {
  const [active, setActive] = useState(false);

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

  const posKey = getCoords(45);
  const posA = getCoords(120); // Node A
  const posB = getCoords(240); // Node B
  const posC = getCoords(0);   // Node C

  // Padded connector coordinates (Rule 10)
  const getLinePoints = (start: { x: number, y: number }, end: { x: number, y: number }) => {
    const angleRad = Math.atan2(end.y - start.y, end.x - start.x);
    return {
      startX: start.x + 3 * Math.cos(angleRad),
      startY: start.y + 3 * Math.sin(angleRad),
      targetX: end.x - 12 * Math.cos(angleRad),
      targetY: end.y - 12 * Math.sin(angleRad)
    };
  };

  const line1 = getLinePoints(posKey, posA);
  const line2 = getLinePoints(posA, posB);
  const line3 = getLinePoints(posB, posC);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <span>Consistent Hashing Replication (Replication Factor = 3)</span>
        <button
          onClick={() => setActive(!active)}
          style={{
            marginLeft: 'auto',
            padding: '6px 12px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '11px',
            background: active ? 'rgba(52,211,153,0.15)' : 'rgba(56,189,248,0.15)',
            color: active ? '#34d399' : '#38bdf8',
            boxShadow: `0 0 0 1.5px ${active ? '#34d39950' : '#38bdf850'}`,
            transition: 'all 0.2s'
          }}
        >
          {active ? 'Stop Animation' : 'Trigger Replication'}
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 767px) {
          .rch-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />

      <div className="rch-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
        {/* Left Ring View */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 360 230" className="interactive-diagram-svg">
            <defs>
              <marker id="rch-arr" viewBox="0 0 10 10" refX="6" refY="3" orient="auto" markerWidth="6" markerHeight="6">
                <path d="M0,0 L0,6 L8,3 z" fill="context-fill" />
              </marker>
            </defs>

            {/* Circular Ring */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="3" />

            {/* Primary Node A */}
            <circle cx={posA.x} cy={posA.y} r="9" fill={active ? '#34d399' : 'rgba(255,255,255,0.3)'} stroke="#090b14" strokeWidth="1.5" style={{ transition: 'fill 0.3s' }} />
            <text x={posA.x + 14} y={posA.y + 3} textAnchor="start" fill="#34d399" fontSize="8.5" fontWeight="800">Node A (Primary)</text>

            {/* Replica Node B */}
            <circle cx={posB.x} cy={posB.y} r="9" fill={active ? '#38bdf8' : 'rgba(255,255,255,0.3)'} stroke="#090b14" strokeWidth="1.5" style={{ transition: 'fill 0.3s' }} />
            <text x={posB.x - 14} y={posB.y + 3} textAnchor="end" fill="#38bdf8" fontSize="8.5" fontWeight="800">Node B (Replica 1)</text>

            {/* Replica Node C */}
            <circle cx={posC.x} cy={posC.y} r="9" fill={active ? '#a78bfa' : 'rgba(255,255,255,0.3)'} stroke="#090b14" strokeWidth="1.5" style={{ transition: 'fill 0.3s' }} />
            <text x={posC.x} y={posC.y - 14} textAnchor="middle" fill="#a78bfa" fontSize="8.5" fontWeight="800">Node C (Replica 2)</text>

            {/* Key Dot */}
            <circle cx={posKey.x} cy={posKey.y} r="5.5" fill="#fbbf24" stroke="#090b14" strokeWidth="1" />
            <text x={posKey.x + 8} y={posKey.y - 4} fill="#fbbf24" fontSize="8" fontWeight="700">key "usr_99"</text>

            {/* Flow Path 1: Key to Primary Node A */}
            <path
              id="rch-p1"
              d={`M ${line1.startX} ${line1.startY} L ${line1.targetX} ${line1.targetY}`}
              fill="none"
              stroke="#fbbf24"
              strokeWidth={active ? 1.8 : 1}
              strokeDasharray={active ? 'none' : '3,3'}
              markerEnd="url(#rch-arr)"
              style={{ stroke: '#fbbf24' }}
            />
            {active && (
              <circle r="2.5" fill="#fbbf24" className="interactive-diagram-flowing-dot">
                <animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#rch-p1"/></animateMotion>
              </circle>
            )}

            {/* Flow Path 2: Node A to Node B */}
            <path
              id="rch-p2"
              d={`M ${line2.startX} ${line2.startY} L ${line2.targetX} ${line2.targetY}`}
              fill="none"
              stroke="#38bdf8"
              strokeWidth={active ? 1.8 : 1}
              strokeDasharray={active ? 'none' : '3,3'}
              markerEnd="url(#rch-arr)"
              style={{ stroke: '#38bdf8' }}
            />
            {active && (
              <circle r="2.5" fill="#38bdf8" className="interactive-diagram-flowing-dot">
                <animateMotion dur="0.8s" repeatCount="indefinite" begin="0.4s"><mpath href="#rch-p2"/></animateMotion>
              </circle>
            )}

            {/* Flow Path 3: Node B to Node C */}
            <path
              id="rch-p3"
              d={`M ${line3.startX} ${line3.startY} L ${line3.targetX} ${line3.targetY}`}
              fill="none"
              stroke="#a78bfa"
              strokeWidth={active ? 1.8 : 1}
              strokeDasharray={active ? 'none' : '3,3'}
              markerEnd="url(#rch-arr)"
              style={{ stroke: '#a78bfa' }}
            />
            {active && (
              <circle r="2.5" fill="#a78bfa" className="interactive-diagram-flowing-dot">
                <animateMotion dur="0.8s" repeatCount="indefinite" begin="0.8s"><mpath href="#rch-p3"/></animateMotion>
              </circle>
            )}
          </svg>
        </div>

        {/* Right Side Assessment card */}
        <div className="interactive-diagram-details-card" style={{ borderColor: active ? '#34d399' : 'rgba(255,255,255,0.08)' }}>
          <div className="interactive-diagram-card-header" style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--ifm-color-content)' }}>
              🔒 Durability Audit (RF=3)
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
            <div>
              <strong>Primary Assignment:</strong> Key `"usr_99"` hashes to 45°, traveling clockwise to first node **Node A**. Node A functions as coordinator.
            </div>
            <div>
              <strong>Clockwise Replication:</strong> The write is synchronously/asynchronously streamed from Node A &rarr; **Node B** &rarr; **Node C**.
            </div>
            <div>
              <strong>Failure Resilience:</strong> If Node A crashes, Node B takes over read/write queries. The data survives the concurrent loss of up to 2 replica servers.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
