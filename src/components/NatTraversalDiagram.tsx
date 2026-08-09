import React, { useState } from 'react';

export default function NatTraversalDiagram(): React.JSX.Element {
  const [tech, setTech] = useState<'stun' | 'turn' | 'ice'>('stun');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          P2P WebRTC NAT Traversal Architecture (STUN vs TURN vs ICE)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setTech('stun')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: tech === 'stun' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', backgroundColor: tech === 'stun' ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            STUN (Reflective Public IP Discovery)
          </button>
          <button onClick={() => setTech('turn')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: tech === 'turn' ? '1px solid #f87171' : '1px solid rgba(255,255,255,0.1)', backgroundColor: tech === 'turn' ? 'rgba(248, 113, 113, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            TURN (Relay Fallback Server)
          </button>
          <button onClick={() => setTech('ice')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: tech === 'ice' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)', backgroundColor: tech === 'ice' ? 'rgba(52, 211, 153, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            ICE Framework
          </button>
        </div>

        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {tech === 'stun' && <p style={{ margin: 0, fontSize: '12px', color: 'var(--ifm-color-content)' }}>STUN server allows a client behind Full Cone/Restricted NAT to discover its public IP address and port mapping for direct P2P audio/video media streams.</p>}
          {tech === 'turn' && <p style={{ margin: 0, fontSize: '12px', color: '#f87171' }}>Used when Symmetric NAT prevents direct P2P connection (~15% of WebRTC calls). TURN server relays media packets between peers.</p>}
          {tech === 'ice' && <p style={{ margin: 0, fontSize: '12px', color: '#34d399' }}>Interactive Connectivity Establishment (ICE). Gathers candidates (host IP, STUN reflective IP, TURN relay IP) and finds the lowest-latency path.</p>}
        </div>
      </div>
    </div>
  );
}
