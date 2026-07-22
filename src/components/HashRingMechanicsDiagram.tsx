import React, { useState } from 'react';

export default function HashRingMechanicsDiagram() {
  const [selectedKey, setSelectedKey] = useState<'k1' | 'k2' | 'k3'>('k1');

  const keyData = {
    k1: { name: 'user_1', hash: 100, target: 'Server B (pos 150)', color: '#38bdf8', desc: 'Hash 100 walks clockwise → first server encountered is Server B at pos 150.', keyAngle: (100 / 255) * 360 - 90, targetAngle: (150 / 255) * 360 - 90 },
    k2: { name: 'user_2', hash: 200, target: 'Server C (pos 210)', color: '#34d399', desc: 'Hash 200 walks clockwise → first server encountered is Server C at pos 210.', keyAngle: (200 / 255) * 360 - 90, targetAngle: (210 / 255) * 360 - 90 },
    k3: { name: 'user_3', hash: 250, target: 'Server A (pos 42 - Wrapped!)', color: '#a78bfa', desc: 'Hash 250 exceeds highest node (210) → wraps around ring to Server A at pos 42.', keyAngle: (250 / 255) * 360 - 90, targetAngle: (42 / 255) * 360 - 90 }
  };

  const active = keyData[selectedKey];

  // Helper to convert ring pos (0..255) to SVG coordinates
  const getCoords = (pos: number, r: number = 100) => {
    const angleRad = ((pos / 255) * 360 - 90) * (Math.PI / 180);
    return {
      x: 150 + r * Math.cos(angleRad),
      y: 150 + r * Math.sin(angleRad)
    };
  };

  const serverA = getCoords(42);
  const serverB = getCoords(150);
  const serverC = getCoords(210);
  const keyCoords = getCoords(active.hash);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <span>Consistent Hash Ring Mechanics (0 - 255 Ring)</span>

        {/* Key selector */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setSelectedKey('k1')} style={{
            padding: '5px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '11px',
            background: selectedKey === 'k1' ? '#38bdf820' : 'rgba(255,255,255,0.04)',
            color: selectedKey === 'k1' ? '#38bdf8' : '#94a3b8',
            boxShadow: selectedKey === 'k1' ? '0 0 0 1.5px #38bdf850' : '0 0 0 1px rgba(255,255,255,0.08)'
          }}>
            Key user_1 (100)
          </button>
          <button onClick={() => setSelectedKey('k2')} style={{
            padding: '5px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '11px',
            background: selectedKey === 'k2' ? '#34d39920' : 'rgba(255,255,255,0.04)',
            color: selectedKey === 'k2' ? '#34d399' : '#94a3b8',
            boxShadow: selectedKey === 'k2' ? '0 0 0 1.5px #34d39950' : '0 0 0 1px rgba(255,255,255,0.08)'
          }}>
            Key user_2 (200)
          </button>
          <button onClick={() => setSelectedKey('k3')} style={{
            padding: '5px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '11px',
            background: selectedKey === 'k3' ? '#a78bfa20' : 'rgba(255,255,255,0.04)',
            color: selectedKey === 'k3' ? '#a78bfa' : '#94a3b8',
            boxShadow: selectedKey === 'k3' ? '0 0 0 1.5px #a78bfa50' : '0 0 0 1px rgba(255,255,255,0.08)'
          }}>
            Key user_3 (250 Wrap)
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'center' }} className="ring-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .ring-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* Circular SVG Ring Visualizer */}
        <div style={{ display: 'flex', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.4)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <svg width="280" height="280" viewBox="0 0 300 300">
            {/* Outer Hash Ring */}
            <circle cx="150" cy="150" r="100" fill="none" stroke="#334155" strokeWidth="5" strokeDasharray="6 4" />
            <circle cx="150" cy="150" r="100" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />

            {/* Position 0 Marker */}
            <line x1="150" y1="42" x2="150" y2="54" stroke="#64748b" strokeWidth="2" />
            <text x="150" y="36" fill="#64748b" fontSize="10" textAnchor="middle" fontWeight="bold">0 / 255</text>

            {/* Server Nodes */}
            {/* Server A */}
            <circle cx={serverA.x} cy={serverA.y} r="14" fill="#1e293b" stroke="#34d399" strokeWidth="2.5" />
            <text x={serverA.x} y={serverA.y + 4} fill="#34d399" fontSize="10" textAnchor="middle" fontWeight="bold">A</text>
            <text x={serverA.x + 22} y={serverA.y + 4} fill="#94a3b8" fontSize="9">pos 42</text>

            {/* Server B */}
            <circle cx={serverB.x} cy={serverB.y} r="14" fill="#1e293b" stroke="#38bdf8" strokeWidth="2.5" />
            <text x={serverB.x} y={serverB.y + 4} fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold">B</text>
            <text x={serverB.x - 22} y={serverB.y + 16} fill="#94a3b8" fontSize="9">pos 150</text>

            {/* Server C */}
            <circle cx={serverC.x} cy={serverC.y} r="14" fill="#1e293b" stroke="#f43f5e" strokeWidth="2.5" />
            <text x={serverC.x} y={serverC.y + 4} fill="#f43f5e" fontSize="10" textAnchor="middle" fontWeight="bold">C</text>
            <text x={serverC.x - 24} y={serverC.y + 4} fill="#94a3b8" fontSize="9">pos 210</text>

            {/* Key Marker & Direction line */}
            <circle cx={keyCoords.x} cy={keyCoords.y} r="8" fill={active.color} stroke="#ffffff" strokeWidth="2" />
            <line x1="150" y1="150" x2={keyCoords.x} y2={keyCoords.y} stroke={active.color} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />

            {/* Center Clockwise Indicator */}
            <circle cx="150" cy="150" r="28" fill="#0f172a" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <text x="150" y="146" fill="#94a3b8" fontSize="9" textAnchor="middle">CLOCKWISE</text>
            <text x="150" y="158" fill={active.color} fontSize="10" textAnchor="middle" fontWeight="bold">↻ WALK</text>
          </svg>
        </div>

        {/* Info Card */}
        <div className="interactive-diagram-details-card" style={{ borderColor: `${active.color}40` }}>
          <h3 style={{ color: active.color, margin: '0 0 6px 0', fontSize: '14px' }}>
            Key `{active.name}` (hash = {active.hash}) → Route to {active.target}
          </h3>
          <p style={{ fontSize: '12.5px', color: '#e2e8f0', margin: 0 }}>
            {active.desc} Binary search in sorted keys array / <code>TreeMap.ceilingEntry({active.hash})</code> resolves target node in <strong>O(log S)</strong> time.
          </p>
        </div>
      </div>
    </div>
  );
}
