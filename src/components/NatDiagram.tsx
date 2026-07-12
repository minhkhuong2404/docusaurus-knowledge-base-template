import React, { useState } from 'react';

type Flow = 'outbound' | 'inbound';

export default function NatDiagram(): React.JSX.Element {
  const [activeFlow, setActiveFlow] = useState<Flow>('outbound');

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🔄 Network Address Translation (NAT) flow
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setActiveFlow('outbound')} style={{ background: activeFlow === 'outbound' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeFlow === 'outbound' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeFlow === 'outbound' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>1. Outbound (SNAT)</button>
          <button onClick={() => setActiveFlow('inbound')} style={{ background: activeFlow === 'inbound' ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeFlow === 'inbound' ? '#4ade80' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeFlow === 'inbound' ? '#4ade80' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>2. Inbound Response</button>
        </div>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 180" className="interactive-diagram-svg">
          <defs>
            <marker id="nat-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 2 L 8 5 L 0 8 z" fill="#94a3b8" />
            </marker>
          </defs>

          {/* Private Host */}
          <g transform="translate(100, 90)">
            <rect x="-60" y="-30" width="120" height="60" rx="5" fill="#0d1527" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="0" y="-5" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#38bdf8', textAnchor: 'middle' }}>Internal Host</text>
            <text x="0" y="10" style={{ fontFamily: 'Inter', fontSize: 7.5, fill: '#94a3b8', textAnchor: 'middle' }}>IP: 10.0.0.5</text>
            <text x="0" y="20" style={{ fontFamily: 'Inter', fontSize: 7.5, fill: '#94a3b8', textAnchor: 'middle' }}>Port: 54321</text>
          </g>

          {/* NAT Router */}
          <g transform="translate(340, 90)">
            <rect x="-60" y="-30" width="120" height="60" rx="5" fill="#0d1527" stroke="#fb923c" strokeWidth="1.5" />
            <text x="0" y="-5" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#fb923c', textAnchor: 'middle' }}>NAT Router</text>
            <text x="0" y="10" style={{ fontFamily: 'Inter', fontSize: 7.5, fill: '#94a3b8', textAnchor: 'middle' }}>Public: 203.0.113.1</text>
            <text x="0" y="20" style={{ fontFamily: 'Inter', fontSize: 7, fill: '#cbd5e1', textAnchor: 'middle' }}>[Translation Table]</text>
          </g>

          {/* Destination Server */}
          <g transform="translate(580, 90)">
            <rect x="-60" y="-30" width="120" height="60" rx="5" fill="#0d1527" stroke="#4ade80" strokeWidth="1.5" />
            <text x="0" y="-5" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#4ade80', textAnchor: 'middle' }}>Google Server</text>
            <text x="0" y="10" style={{ fontFamily: 'Inter', fontSize: 7.5, fill: '#94a3b8', textAnchor: 'middle' }}>IP: 142.250.80.46</text>
            <text x="0" y="20" style={{ fontFamily: 'Inter', fontSize: 7.5, fill: '#94a3b8', textAnchor: 'middle' }}>Port: 443 (HTTPS)</text>
          </g>

          {/* Paths */}
          {activeFlow === 'outbound' ? (
            <>
              <path id="nat-flow1" d="M 160 80 L 280 80" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#nat-arr)" />
              <path id="nat-flow2" d="M 400 80 L 520 80" fill="none" stroke="#fb923c" strokeWidth="2" markerEnd="url(#nat-arr)" />
              <text x="220" y="70" style={{ fontFamily: 'Inter', fontSize: 7, fill: '#38bdf8', textAnchor: 'middle' }}>Src: 10.0.0.5:54321</text>
              <text x="460" y="70" style={{ fontFamily: 'Inter', fontSize: 7, fill: '#fb923c', textAnchor: 'middle' }}>Src: 203.0.113.1:54321</text>
              <circle r="3.2" fill="#38bdf8"><animateMotion dur="1s" repeatCount="indefinite"><mpath href="#nat-flow1" /></animateMotion></circle>
              <circle r="3.2" fill="#fb923c"><animateMotion dur="1s" repeatCount="indefinite"><mpath href="#nat-flow2" /></animateMotion></circle>
            </>
          ) : (
            <>
              <path id="nat-flow3" d="M 520 100 L 400 100" fill="none" stroke="#4ade80" strokeWidth="2" markerEnd="url(#nat-arr)" />
              <path id="nat-flow4" d="M 280 100 L 160 100" fill="none" stroke="#fb923c" strokeWidth="2" markerEnd="url(#nat-arr)" />
              <text x="460" y="115" style={{ fontFamily: 'Inter', fontSize: 7, fill: '#4ade80', textAnchor: 'middle' }}>Dst: 203.0.113.1:54321</text>
              <text x="220" y="115" style={{ fontFamily: 'Inter', fontSize: 7, fill: '#fb923c', textAnchor: 'middle' }}>Dst: 10.0.0.5:54321</text>
              <circle r="3.2" fill="#4ade80"><animateMotion dur="1s" repeatCount="indefinite"><mpath href="#nat-flow3" /></animateMotion></circle>
              <circle r="3.2" fill="#fb923c"><animateMotion dur="1s" repeatCount="indefinite"><mpath href="#nat-flow4" /></animateMotion></circle>
            </>
          )}
        </svg>
      </div>

      <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }} className="interactive-diagram-grid-bg">
        <h4 style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: '#cbd5e1' }}>Translation mapping (SNAT Session)</h4>
        <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#94a3b8' }}>
          {activeFlow === 'outbound' ? (
            '✏️ Outbound SNAT: The router alters the IP header, substituting the private source IP (10.0.0.5) with the routers external public IP (203.0.113.1) and records this session mapping in the translation lookup table.'
          ) : (
            '✏️ Inbound Translate: When response packets hit the public interface, the router scans the lookup table, translates destination IP/port parameters back to client values, and forwards to the target host.'
          )}
        </div>
      </div>
    </div>
  );
}
