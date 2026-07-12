import React, { useState } from 'react';

type PathSelect = 'as1-path' | 'as2-path';

export default function BgpDiagram(): React.JSX.Element {
  const [activePath, setActivePath] = useState<PathSelect>('as1-path');

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🌐 BGP Path Vector Route Propagation
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setActivePath('as1-path')} style={{ background: activePath === 'as1-path' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activePath === 'as1-path' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activePath === 'as1-path' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>AS Path 1 (Shortest)</button>
          <button onClick={() => setActivePath('as2-path')} style={{ background: activePath === 'as2-path' ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activePath === 'as2-path' ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activePath === 'as2-path' ? '#a78bfa' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>AS Path 2 (Alternative)</button>
        </div>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 180" className="interactive-diagram-svg">
          <defs>
            <marker id="bgp-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 2 L 8 5 L 0 8 z" fill="#94a3b8" />
            </marker>
          </defs>

          {/* AS Nodes */}
          <g transform="translate(100, 90)">
            <rect x="-55" y="-30" width="110" height="60" rx="6" fill="#0d1527" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="0" y="-5" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#38bdf8', textAnchor: 'middle' }}>AS65001 (ISP 1)</text>
            <text x="0" y="10" style={{ fontFamily: 'Inter', fontSize: 7.5, fill: '#94a3b8', textAnchor: 'middle' }}>Local Prefix</text>
          </g>

          <g transform="translate(340, 40)">
            <rect x="-55" y="-30" width="110" height="60" rx="6" fill="#0d1527" stroke="#a78bfa" strokeWidth="1.5" />
            <text x="0" y="-5" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#a78bfa', textAnchor: 'middle' }}>AS65002 (Google)</text>
            <text x="0" y="10" style={{ fontFamily: 'Inter', fontSize: 7.5, fill: '#94a3b8', textAnchor: 'middle' }}>Transit AS</text>
          </g>

          <g transform="translate(580, 90)">
            <rect x="-55" y="-30" width="110" height="60" rx="6" fill="#0d1527" stroke="#4ade80" strokeWidth="1.5" />
            <text x="0" y="-5" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#4ade80', textAnchor: 'middle' }}>AS65003 (ISP 2)</text>
            <text x="0" y="10" style={{ fontFamily: 'Inter', fontSize: 7.5, fill: '#94a3b8', textAnchor: 'middle' }}>Target Prefix</text>
          </g>

          {/* Paths */}
          {activePath === 'as1-path' ? (
            <>
              <path id="bgp-p1" d="M 155 90 L 525 90" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4 4" markerEnd="url(#bgp-arr)" />
              <text x="340" y="105" style={{ fontFamily: 'Inter', fontSize: 8.5, fill: '#38bdf8', textAnchor: 'middle', fontWeight: 700 }}>Direct Peer Session Link</text>
              <circle r="3.5" fill="#38bdf8"><animateMotion dur="1.2s" repeatCount="indefinite"><mpath href="#bgp-p1" /></animateMotion></circle>
            </>
          ) : (
            <>
              <path id="bgp-p2-a" d="M 150 75 L 290 45" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeDasharray="4 4" markerEnd="url(#bgp-arr)" />
              <path id="bgp-p2-b" d="M 390 45 L 530 75" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeDasharray="4 4" markerEnd="url(#bgp-arr)" />
              <text x="340" y="115" style={{ fontFamily: 'Inter', fontSize: 8.5, fill: '#a78bfa', textAnchor: 'middle', fontWeight: 700 }}>Transit Path Routing</text>
              <circle r="3.5" fill="#a78bfa"><animateMotion dur="1s" repeatCount="indefinite"><mpath href="#bgp-p2-a" /></animateMotion></circle>
              <circle r="3.5" fill="#a78bfa"><animateMotion dur="1s" repeatCount="indefinite"><mpath href="#bgp-p2-b" /></animateMotion></circle>
            </>
          )}
        </svg>
      </div>

      <div className="interactive-diagram-details-card" style={{ margin: 0, borderTop: 0, borderRadius: '0 0 6px 6px' }}>
        {activePath === 'as1-path' ? (
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
            <strong>Direct Peer Path</strong> — Path Selection Attribute: <code>AS_PATH: [65003]</code>. The BGP engine prefers this route because it has the fewest autonomous system hops (shortest path).
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
            <strong>Transit AS Path</strong> — Path Selection Attribute: <code>AS_PATH: [65002, 65003]</code>. Route advertisements traverse through an intermediate system (Google network backbone) to deliver packets.
          </p>
        )}
      </div>
    </div>
  );
}
