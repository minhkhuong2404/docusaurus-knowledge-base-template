import React, { useState } from 'react';

export default function GracefulScalingDiagram() {
  const [activeTab, setActiveTab] = useState<'add' | 'remove' | 'vnodes'>('add');

  const getCoords = (pos: number, r: number = 95) => {
    const angleRad = ((pos / 255) * 360 - 90) * (Math.PI / 180);
    return {
      x: 140 + r * Math.cos(angleRad),
      y: 140 + r * Math.sin(angleRad)
    };
  };

  const sA = getCoords(42);
  const sB = getCoords(150);
  const sC = getCoords(210);
  const sD = getCoords(100);

  // V-Nodes coordinates
  const vNodesA = [getCoords(42), getCoords(110), getCoords(180)];
  const vNodesB = [getCoords(80), getCoords(150), getCoords(230)];
  const vNodesC = [getCoords(20), getCoords(130), getCoords(210)];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
        </svg>
        <span>Graceful Scaling & Virtual Nodes Visualizer</span>

        {/* Tab selector */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setActiveTab('add')} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: activeTab === 'add' ? '#34d39918' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'add' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'add' ? '0 0 0 1.5px #34d39950' : '0 0 0 1px rgba(255,255,255,0.08)'
          }}>
            Add Node D
          </button>

          <button onClick={() => setActiveTab('remove')} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: activeTab === 'remove' ? '#f8717118' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'remove' ? '#f87171' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'remove' ? '0 0 0 1.5px #f8717150' : '0 0 0 1px rgba(255,255,255,0.08)'
          }}>
            Remove Node B
          </button>

          <button onClick={() => setActiveTab('vnodes')} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: activeTab === 'vnodes' ? '#38bdf818' : 'rgba(255,255,255,0.04)',
            color: activeTab === 'vnodes' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
            boxShadow: activeTab === 'vnodes' ? '0 0 0 1.5px #38bdf850' : '0 0 0 1px rgba(255,255,255,0.08)'
          }}>
            Virtual Nodes (V-Nodes)
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'center' }} className="scaling-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .scaling-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* Circular SVG Hash Ring */}
        <div style={{ display: 'flex', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.4)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <svg width="270" height="270" viewBox="0 0 280 280">
            <circle cx="140" cy="140" r="95" fill="none" stroke="#334155" strokeWidth="5" strokeDasharray="6 4" />

            {activeTab !== 'vnodes' ? (
              <>
                {/* Server A */}
                <circle cx={sA.x} cy={sA.y} r="13" fill="#1e293b" stroke="#34d399" strokeWidth="2" />
                <text x={sA.x} y={sA.y + 4} fill="#34d399" fontSize="10" textAnchor="middle" fontWeight="bold">A</text>

                {/* Server B (unless removed) */}
                {activeTab !== 'remove' ? (
                  <>
                    <circle cx={sB.x} cy={sB.y} r="13" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                    <text x={sB.x} y={sB.y + 4} fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold">B</text>
                  </>
                ) : (
                  <>
                    <circle cx={sB.x} cy={sB.y} r="13" fill="#1e293b" stroke="#f87171" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
                    <text x={sB.x} y={sB.y + 4} fill="#f87171" fontSize="10" textAnchor="middle" opacity="0.5">B❌</text>
                  </>
                )}

                {/* Server C */}
                <circle cx={sC.x} cy={sC.y} r="13" fill="#1e293b" stroke="#f43f5e" strokeWidth="2" />
                <text x={sC.x} y={sC.y + 4} fill="#f43f5e" fontSize="10" textAnchor="middle" fontWeight="bold">C</text>

                {/* Server D (when added) */}
                {activeTab === 'add' && (
                  <>
                    <circle cx={sD.x} cy={sD.y} r="13" fill="#1e293b" stroke="#fbbf24" strokeWidth="2.5" />
                    <text x={sD.x} y={sD.y + 4} fill="#fbbf24" fontSize="10" textAnchor="middle" fontWeight="bold">D</text>
                    <text x={sD.x + 22} y={sD.y + 4} fill="#fbbf24" fontSize="9" fontWeight="bold">NEW</text>
                  </>
                )}
              </>
            ) : (
              <>
                {/* V-Nodes mode */}
                {vNodesA.map((pt, idx) => (
                  <circle key={`va-${idx}`} cx={pt.x} cy={pt.y} r="9" fill="#1e293b" stroke="#34d399" strokeWidth="2" />
                ))}
                {vNodesB.map((pt, idx) => (
                  <circle key={`vb-${idx}`} cx={pt.x} cy={pt.y} r="9" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                ))}
                {vNodesC.map((pt, idx) => (
                  <circle key={`vc-${idx}`} cx={pt.x} cy={pt.y} r="9" fill="#1e293b" stroke="#f43f5e" strokeWidth="2" />
                ))}
              </>
            )}

            <circle cx="140" cy="140" r="24" fill="#0f172a" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <text x="140" y="144" fill="#94a3b8" fontSize="8" textAnchor="middle">RING</text>
            <text x="140" y="154" fill="#e2e8f0" fontSize="9" textAnchor="middle" fontWeight="bold">TOPOLOGY</text>
          </svg>
        </div>

        {/* Details Card */}
        <div className="interactive-diagram-details-card" style={{
          borderColor: activeTab === 'add' ? '#34d39940' : activeTab === 'remove' ? '#f8717140' : '#38bdf840'
        }}>
          <h3 style={{
            color: activeTab === 'add' ? '#34d399' : activeTab === 'remove' ? '#f87171' : '#38bdf8',
            margin: '0 0 6px 0', fontSize: '14px'
          }}>
            {activeTab === 'add' && 'Adding Server D at Hash Position 100'}
            {activeTab === 'remove' && 'Removing Server B (Position 150)'}
            {activeTab === 'vnodes' && 'Virtual Nodes (V-Nodes) Pattern'}
          </h3>

          <p style={{ fontSize: '12.5px', color: '#e2e8f0', margin: 0 }}>
            {activeTab === 'add' && 'Server D only intercepts keys in range [42, 100) from Server B. Only ~25% of keys migrate from B to D. The rest of the cluster remains 100% untouched!'}
            {activeTab === 'remove' && 'When Server B goes offline, its assigned key range [150, 210) falls forward clockwise to Server C. No other nodes are affected.'}
            {activeTab === 'vnodes' && 'Mapping physical servers to 100+ virtual nodes (e.g. hash("10.0.0.1#v1")) eliminates data skew, smooths out variance, and allows weighted load balancing based on server hardware specs!'}
          </p>
        </div>
      </div>
    </div>
  );
}
