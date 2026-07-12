import React, { useState } from 'react';

type Attack = 'l3-volumetric' | 'l7-flood' | 'none';

export default function DdosMitigationDiagram(): React.JSX.Element {
  const [attack, setAttack] = useState<Attack>('none');

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🛡️ Multi-Layer DDoS Mitigation Architecture
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setAttack('l3-volumetric')} style={{ background: attack === 'l3-volumetric' ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${attack === 'l3-volumetric' ? '#f87171' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: attack === 'l3-volumetric' ? '#f87171' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Simulate L3 Volumetric Attack 💥</button>
          <button onClick={() => setAttack('l7-flood')} style={{ background: attack === 'l7-flood' ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${attack === 'l7-flood' ? '#f87171' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: attack === 'l7-flood' ? '#f87171' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Simulate L7 HTTP Flood 🌊</button>
          <button onClick={() => setAttack('none')} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, color: '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Reset</button>
        </div>
      </div>

      <div style={{ padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          
          {/* Layer 1 */}
          <div style={{ borderLeft: `3px solid ${attack === 'l3-volumetric' ? '#f87171' : '#4ade80'}`, background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '0 6px 6px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#e2e8f0', display: 'block' }}>Layer 1: Upstream Scrubbing (Cloudflare / AWS Shield)</span>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Absorbs high-volume L3/L4 traffic (UDP/ICMP floods) at edge PoPs.</span>
            </div>
            {attack === 'l3-volumetric' && (
              <span style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 800, padding: '2px 6px', background: 'rgba(248,113,113,0.12)', borderRadius: 4 }}>
                💥 Absorbed & Dropped at Edge
              </span>
            )}
          </div>

          {/* Layer 2 */}
          <div style={{ borderLeft: `3px solid ${attack === 'l7-flood' ? '#f87171' : '#4ade80'}`, background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '0 6px 6px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#e2e8f0', display: 'block' }}>Layer 2: CDN / WAF Rate Limiting</span>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Limits matching HTTP request frequencies by user IP to block HTTP floods.</span>
            </div>
            {attack === 'l7-flood' && (
              <span style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 800, padding: '2px 6px', background: 'rgba(248,113,113,0.12)', borderRadius: 4 }}>
                🌊 Rate Limit Triggered (429 Block)
              </span>
            )}
          </div>

          {/* Layer 3 */}
          <div style={{ borderLeft: '3px solid #4ade80', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '0 6px 6px 0' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#e2e8f0', display: 'block' }}>Layer 3: Application Server Auto-scaling</span>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Scales app container count to handle natural traffic spikes and buffer load.</span>
          </div>

        </div>
      </div>
    </div>
  );
}
