import React, { useState } from 'react';

export default function ConsistentHashingNodeMigrationDiagram(): React.JSX.Element {
  const [nodeDActive, setNodeDActive] = useState(false);

  // Circle geometry specs
  const cx = 180;
  const cy = 115;
  const r = 70;

  // Convert angle (0 to 360) to coordinate
  const getCoords = (angleDeg: number, radius = r) => {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(angleRad),
      y: cy + radius * Math.sin(angleRad)
    };
  };

  // Node Positions (Angles on ring)
  const nodeA = 90;   // N1 (25%)
  const nodeB = 180;  // N2 (50%)
  const nodeC = 270;  // N3 (75%)
  const nodeD = 216;  // N4 (60% - added)

  const posA = getCoords(nodeA);
  const posB = getCoords(nodeB);
  const posC = getCoords(nodeC);
  const posD = getCoords(nodeD);

  // Keys
  // Key A at 40% (144 deg)
  const keyA = { name: 'Key A (40%)', angle: 144, color: '#38bdf8' };
  // Key B at 55% (198 deg)
  const keyB = { name: 'Key B (55%)', angle: 198, color: '#fbbf24' };
  // Key C at 70% (252 deg)
  const keyC = { name: 'Key C (70%)', angle: 252, color: '#a78bfa' };

  // Owner determinations
  const getKeyBTarget = () => {
    return nodeDActive
      ? { name: 'N4 (60%)', pos: posD, color: '#2dd4bf', active: true }
      : { name: 'N3 (75%)', pos: posC, color: '#a78bfa', active: false };
  };

  const targetB = getKeyBTarget();
  const coordA = getCoords(keyA.angle);
  const coordB = getCoords(keyB.angle);
  const coordC = getCoords(keyC.angle);

  // Pad coordinates to nodes (Rule 10)
  const getLinePoints = (start: { x: number, y: number }, end: { x: number, y: number }) => {
    const angleRad = Math.atan2(end.y - start.y, end.x - start.x);
    return {
      startX: start.x + 3 * Math.cos(angleRad),
      startY: start.y + 3 * Math.sin(angleRad),
      targetX: end.x - 12 * Math.cos(angleRad),
      targetY: end.y - 12 * Math.sin(angleRad)
    };
  };

  const lineA = getLinePoints(coordA, posB);
  const lineB = getLinePoints(coordB, targetB.pos);
  const lineC = getLinePoints(coordC, posC);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span>Consistent Hashing Ring Topology Updates</span>
        <button
          onClick={() => setNodeDActive(!nodeDActive)}
          style={{
            marginLeft: 'auto',
            padding: '6px 12px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '11px',
            background: nodeDActive ? 'rgba(248,113,113,0.15)' : 'rgba(52,211,153,0.15)',
            color: nodeDActive ? '#f87171' : '#34d399',
            boxShadow: `0 0 0 1.5px ${nodeDActive ? '#f8717150' : '#34d39950'}`,
            transition: 'all 0.2s'
          }}
        >
          {nodeDActive ? 'Remove Node N4 (60%)' : 'Add Node N4 (60%)'}
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 767px) {
          .chm-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />

      <div className="chm-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
        {/* Left Side: SVG ring */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
          <svg viewBox="0 0 360 230" className="interactive-diagram-svg">
            <defs>
              <marker id="chm-arr" viewBox="0 0 10 10" refX="6" refY="3" orient="auto" markerWidth="6" markerHeight="6">
                <path d="M0,0 L0,6 L8,3 z" fill="context-fill" />
              </marker>
            </defs>

            {/* Circular Ring */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="3" />

            {/* Static Nodes */}
            {/* N1 */}
            <circle cx={posA.x} cy={posA.y} r="9" fill="#34d399" stroke="#090b14" strokeWidth="1.5" />
            <text x={posA.x + 14} y={posA.y + 3} textAnchor="start" fill="#34d399" fontSize="9" fontWeight="800">N1 (25%)</text>

            {/* N2 */}
            <circle cx={posB.x} cy={posB.y} r="9" fill="#f472b6" stroke="#090b14" strokeWidth="1.5" />
            <text x={posB.x} y={posB.y + 15} textAnchor="middle" fill="#f472b6" fontSize="9" fontWeight="800">N2 (50%)</text>

            {/* N3 */}
            <circle cx={posC.x} cy={posC.y} r="9" fill="#a78bfa" stroke="#090b14" strokeWidth="1.5" />
            <text x={posC.x - 14} y={posC.y + 3} textAnchor="end" fill="#a78bfa" fontSize="9" fontWeight="800">N3 (75%)</text>

            {/* Dynamic Node N4 */}
            <g style={{ opacity: nodeDActive ? 1 : 0, transition: 'opacity 0.4s ease' }}>
              <circle cx={posD.x} cy={posD.y} r="9" fill="#2dd4bf" stroke="#090b14" strokeWidth="1.5" />
              <text x={posD.x - 14} y={posD.y - 6} textAnchor="end" fill="#2dd4bf" fontSize="9" fontWeight="800">N4 (60%)</text>
            </g>

            {/* Keys */}
            {/* Key A */}
            <circle cx={coordA.x} cy={coordA.y} r="5" fill={keyA.color} />
            <text x={coordA.x + 8} y={coordA.y - 4} fill={keyA.color} fontSize="7.5" fontWeight="700">A (40%)</text>
            <path d={`M ${lineA.startX} ${lineA.startY} L ${lineA.targetX} ${lineA.targetY}`} fill="none" stroke={keyA.color} strokeWidth="1.2" strokeDasharray="3,2" markerEnd="url(#chm-arr)" style={{ stroke: keyA.color }} />

            {/* Key B (Moves!) */}
            <circle cx={coordB.x} cy={coordB.y} r="5" fill={keyB.color} />
            <text x={coordB.x + 8} y={coordB.y + 10} fill={keyB.color} fontSize="7.5" fontWeight="700">B (55%)</text>
            <path id="path-key-b" d={`M ${lineB.startX} ${lineB.startY} L ${lineB.targetX} ${lineB.targetY}`} fill="none" stroke={keyB.color} strokeWidth="1.5" markerEnd="url(#chm-arr)" style={{ stroke: keyB.color, transition: 'all 0.4s' }} />

            {/* Key C */}
            <circle cx={coordC.x} cy={coordC.y} r="5" fill={keyC.color} />
            <text x={coordC.x + 8} y={coordC.y - 4} fill={keyC.color} fontSize="7.5" fontWeight="700">C (70%)</text>
            <path d={`M ${lineC.startX} ${lineC.startY} L ${lineC.targetX} ${lineC.targetY}`} fill="none" stroke={keyC.color} strokeWidth="1.2" strokeDasharray="3,2" markerEnd="url(#chm-arr)" style={{ stroke: keyC.color }} />
          </svg>
        </div>

        {/* Right Side Details panel */}
        <div className="interactive-diagram-details-card" style={{ borderColor: nodeDActive ? '#2dd4bf' : 'rgba(255,255,255,0.08)' }}>
          <div className="interactive-diagram-card-header" style={{ marginBottom: '10px' }}>
            <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--ifm-color-content)' }}>
              📈 Migration Assessment
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            <div style={{ padding: '6px 8px', borderRadius: '4px', background: 'rgba(0,0,0,0.15)' }}>
              <strong>Key A (40%):</strong> Assigned to N2. {nodeDActive ? 'Unchanged ✅' : 'Unchanged ✅'}
            </div>
            <div style={{ padding: '6px 8px', borderRadius: '4px', background: nodeDActive ? 'rgba(45, 212, 191, 0.12)' : 'rgba(0,0,0,0.15)', border: `1px solid ${nodeDActive ? '#2dd4bf30' : 'transparent'}` }}>
              <strong>Key B (55%):</strong> Assigned to <strong>{targetB.name}</strong>.
              {nodeDActive && <div style={{ fontSize: '10.5px', color: '#fbbf24', marginTop: '2px', fontWeight: 'bold' }}>⚠️ Migrated from N3 to N4!</div>}
            </div>
            <div style={{ padding: '6px 8px', borderRadius: '4px', background: 'rgba(0,0,0,0.15)' }}>
              <strong>Key C (70%):</strong> Assigned to N3. {nodeDActive ? 'Unchanged ✅' : 'Unchanged ✅'}
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px', marginTop: '4px' }}>
              <div style={{ fontWeight: 'bold', color: nodeDActive ? '#2dd4bf' : 'var(--ifm-color-content-secondary)' }}>
                Migration Footprint:
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                {nodeDActive ? (
                  <span>
                    - **Consistent Hashing**: Only **~1/N (25%)** keys migrate.
                    <br />- **Modulo Arithmetic**: **~100%** key migration forced by partition changes.
                  </span>
                ) : (
                  'Click "Add Node N4" to trace key re-allocation.'
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
