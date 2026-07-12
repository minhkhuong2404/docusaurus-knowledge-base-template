import React, { useState } from 'react';

type Proto = 'tcp' | 'quic';

export default function QuicMultiplexingDiagram(): React.JSX.Element {
  const [proto, setProto] = useState<Proto>('tcp');
  const [lossActive, setLossActive] = useState<boolean>(false);

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          📦 Head-of-Line Blocking Comparison (TCP vs. QUIC)
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => { setProto('tcp'); setLossActive(false); }} style={{ background: proto === 'tcp' ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${proto === 'tcp' ? '#f87171' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: proto === 'tcp' ? '#f87171' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>TCP (HTTP/2)</button>
          <button onClick={() => { setProto('quic'); setLossActive(false); }} style={{ background: proto === 'quic' ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${proto === 'quic' ? '#4ade80' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: proto === 'quic' ? '#4ade80' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>QUIC (HTTP/3)</button>
        </div>
      </div>

      <div style={{ padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
            Active Protocol: <strong>{proto === 'tcp' ? 'HTTP/2 over TCP' : 'HTTP/3 over QUIC'}</strong>
          </span>
          <button
            onClick={() => setLossActive(prev => !prev)}
            style={{
              padding: '6px 12px',
              background: lossActive ? '#fb923c' : 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 4,
              color: '#fff',
              fontSize: '0.74rem',
              cursor: 'pointer'
            }}
          >
            {lossActive ? 'Reset Simulation 🔄' : 'Trigger Packet Loss 💥'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {/* Stream A */}
          <div style={{ borderLeft: `3px solid ${lossActive ? '#f87171' : '#4ade80'}`, background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '0 6px 6px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#e2e8f0', display: 'block' }}>Stream A (HTML)</span>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Carries core page structure file.</span>
            </div>
            {lossActive && (
              <span style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 800, padding: '2px 6px', background: 'rgba(248,113,113,0.12)', borderRadius: 4 }}>
                💥 Packet Lost (Stalled waiting retransmit)
              </span>
            )}
          </div>

          {/* Stream B */}
          <div style={{ borderLeft: `3px solid ${lossActive && proto === 'tcp' ? '#f87171' : '#4ade80'}`, background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '0 6px 6px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#e2e8f0', display: 'block' }}>Stream B (CSS)</span>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Carries page styles document.</span>
            </div>
            {lossActive && (
              <span style={{ fontSize: '0.7rem', color: proto === 'tcp' ? '#f87171' : '#4ade80', fontWeight: 800, padding: '2px 6px', background: proto === 'tcp' ? 'rgba(248,113,113,0.12)' : 'rgba(74,222,128,0.12)', borderRadius: 4 }}>
                {proto === 'tcp' ? '❌ Stalled (HOL Blocked by Stream A)' : '✅ Loaded Cleanly'}
              </span>
            )}
          </div>

          {/* Stream C */}
          <div style={{ borderLeft: `3px solid ${lossActive && proto === 'tcp' ? '#f87171' : '#4ade80'}`, background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '0 6px 6px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#e2e8f0', display: 'block' }}>Stream C (JavaScript)</span>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Carries bundle modules script.</span>
            </div>
            {lossActive && (
              <span style={{ fontSize: '0.7rem', color: proto === 'tcp' ? '#f87171' : '#4ade80', fontWeight: 800, padding: '2px 6px', background: proto === 'tcp' ? 'rgba(248,113,113,0.12)' : 'rgba(74,222,128,0.12)', borderRadius: 4 }}>
                {proto === 'tcp' ? '❌ Stalled (HOL Blocked by Stream A)' : '✅ Loaded Cleanly'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
