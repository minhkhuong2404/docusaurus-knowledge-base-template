import React, { useState } from 'react';

export default function RingReplicationDiagram() {
  const [rf, setRf] = useState<number>(3);

  const getCoords = (pos: number, r: number = 95) => {
    const angleRad = ((pos / 255) * 360 - 90) * (Math.PI / 180);
    return {
      x: 140 + r * Math.cos(angleRad),
      y: 140 + r * Math.sin(angleRad)
    };
  };

  const keyCoords = getCoords(100);
  const sA = getCoords(130);
  const sB = getCoords(185);
  const sC = getCoords(235);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="4"/>
          <line x1="12" y1="2" x2="12" y2="22"/>
        </svg>
        <span>High Availability Replication Ring (RF = {rf})</span>

        {/* RF selector */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setRf(1)} style={{
            padding: '5px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '11px',
            background: rf === 1 ? '#f8717120' : 'rgba(255,255,255,0.04)',
            color: rf === 1 ? '#f87171' : '#94a3b8',
            boxShadow: rf === 1 ? '0 0 0 1.5px #f8717150' : '0 0 0 1px rgba(255,255,255,0.08)'
          }}>
            RF = 1 (No Replicas)
          </button>
          <button onClick={() => setRf(2)} style={{
            padding: '5px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '11px',
            background: rf === 2 ? '#fbbf2420' : 'rgba(255,255,255,0.04)',
            color: rf === 2 ? '#fbbf24' : '#94a3b8',
            boxShadow: rf === 2 ? '0 0 0 1.5px #fbbf2450' : '0 0 0 1px rgba(255,255,255,0.08)'
          }}>
            RF = 2 (1 Replica)
          </button>
          <button onClick={() => setRf(3)} style={{
            padding: '5px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '11px',
            background: rf === 3 ? '#34d39920' : 'rgba(255,255,255,0.04)',
            color: rf === 3 ? '#34d399' : '#94a3b8',
            boxShadow: rf === 3 ? '0 0 0 1.5px #34d39950' : '0 0 0 1px rgba(255,255,255,0.08)'
          }}>
            RF = 3 (Gold Standard 🟢)
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'center' }} className="repl-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .repl-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* Circular SVG Hash Ring */}
        <div style={{ display: 'flex', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.4)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <svg width="270" height="270" viewBox="0 0 280 280">
            <circle cx="140" cy="140" r="95" fill="none" stroke="#334155" strokeWidth="5" strokeDasharray="6 4" />

            {/* Key Marker (hash 100) */}
            <circle cx={keyCoords.x} cy={keyCoords.y} r="7" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
            <text x={keyCoords.x - 28} y={keyCoords.y - 10} fill="#38bdf8" fontSize="9" fontWeight="bold">Key (100)</text>

            {/* Primary Node A */}
            <circle cx={sA.x} cy={sA.y} r="13" fill="#1e293b" stroke="#34d399" strokeWidth="2.5" />
            <text x={sA.x} y={sA.y + 4} fill="#34d399" fontSize="10" textAnchor="middle" fontWeight="bold">A</text>
            <text x={sA.x + 18} y={sA.y + 4} fill="#34d399" fontSize="8" fontWeight="bold">PRIMARY</text>

            {/* Replica 1 Node B (RF >= 2) */}
            {rf >= 2 ? (
              <>
                <circle cx={sB.x} cy={sB.y} r="13" fill="#1e293b" stroke="#fbbf24" strokeWidth="2.5" />
                <text x={sB.x} y={sB.y + 4} fill="#fbbf24" fontSize="10" textAnchor="middle" fontWeight="bold">B</text>
                <text x={sB.x + 18} y={sB.y + 4} fill="#fbbf24" fontSize="8" fontWeight="bold">REPL 1</text>
              </>
            ) : (
              <>
                <circle cx={sB.x} cy={sB.y} r="10" fill="#1e293b" stroke="#64748b" strokeWidth="1" strokeDasharray="2 2" opacity="0.4" />
                <text x={sB.x} y={sB.y + 3} fill="#64748b" fontSize="9" textAnchor="middle" opacity="0.5">B</text>
              </>
            )}

            {/* Replica 2 Node C (RF >= 3) */}
            {rf >= 3 ? (
              <>
                <circle cx={sC.x} cy={sC.y} r="13" fill="#1e293b" stroke="#f43f5e" strokeWidth="2.5" />
                <text x={sC.x} y={sC.y + 4} fill="#f43f5e" fontSize="10" textAnchor="middle" fontWeight="bold">C</text>
                <text x={sC.x - 28} y={sC.y + 16} fill="#f43f5e" fontSize="8" fontWeight="bold">REPL 2</text>
              </>
            ) : (
              <>
                <circle cx={sC.x} cy={sC.y} r="10" fill="#1e293b" stroke="#64748b" strokeWidth="1" strokeDasharray="2 2" opacity="0.4" />
                <text x={sC.x} y={sC.y + 3} fill="#64748b" fontSize="9" textAnchor="middle" opacity="0.5">C</text>
              </>
            )}

            <circle cx="140" cy="140" r="24" fill="#0f172a" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <text x="140" y="144" fill="#94a3b8" fontSize="8" textAnchor="middle">REPL</text>
            <text x="140" y="154" fill={rf === 3 ? '#34d399' : '#fbbf24'} fontSize="9" textAnchor="middle" fontWeight="bold">RF={rf}</text>
          </svg>
        </div>

        {/* Info Card */}
        <div className="interactive-diagram-details-card" style={{ borderColor: rf === 3 ? '#34d39940' : rf === 2 ? '#fbbf2440' : '#f8717140' }}>
          <h3 style={{ color: rf === 3 ? '#34d399' : rf === 2 ? '#fbbf24' : '#f87171', margin: '0 0 6px 0', fontSize: '14px' }}>
            Replication Factor R = {rf} Placement Logic
          </h3>
          <p style={{ fontSize: '12.5px', color: '#e2e8f0', margin: 0 }}>
            Key <code>user_1</code> (hash 100) resolves to <strong>Primary Server A</strong> (first node clockwise).<br/>
            {rf === 1 && 'No secondary replicas stored. If Server A fails, user_1 data is inaccessible.'}
            {rf === 2 && 'Replicates to Primary Server A + Replica 1 (Server B - next distinct physical node clockwise).'}
            {rf === 3 && 'Replicates to Primary Server A + Replica 1 (Server B) + Replica 2 (Server C). Skipping V-nodes mapping to already selected physical nodes guarantees multi-zone hardware isolation!'}
          </p>
        </div>
      </div>
    </div>
  );
}
