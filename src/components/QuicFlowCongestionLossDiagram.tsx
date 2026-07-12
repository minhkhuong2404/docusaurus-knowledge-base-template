import React, { useState } from 'react';

type Section = 'loss' | 'flow' | 'congestion';

export default function QuicFlowCongestionLossDiagram(): React.JSX.Element {
  const [activeSec, setActiveSec] = useState<Section>('loss');

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          ⚙️ QUIC Internals: Loss, Flow, & Congestion Control
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setActiveSec('loss')} style={{ background: activeSec === 'loss' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeSec === 'loss' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeSec === 'loss' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Loss Recovery</button>
          <button onClick={() => setActiveSec('flow')} style={{ background: activeSec === 'flow' ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeSec === 'flow' ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeSec === 'flow' ? '#a78bfa' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Flow Control</button>
          <button onClick={() => setActiveSec('congestion')} style={{ background: activeSec === 'congestion' ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeSec === 'congestion' ? '#4ade80' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeSec === 'congestion' ? '#4ade80' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>Congestion Control</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.2rem', padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        {/* Info detail */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1.2rem' }}>
          {activeSec === 'loss' && (
            <>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#38bdf8' }}>Retransmission Ambiguity Resolved</h4>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.45 }}>
                TCP uses ambiguous sequence numbers. If a segment is retransmitted and an ACK returns, the sender cannot tell if the ACK was for the original or the retransmitted packet. QUIC solves this by using monotonically increasing packet numbers (never reusing them), allowing clean RTT calculations.
              </p>
            </>
          )}

          {activeSec === 'flow' && (
            <>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#a78bfa' }}>Dual-Tier Window Allocations</h4>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.45 }}>
                QUIC handles flow control at two separate layers. Stream-level windows limit unacknowledged byte sizes per individual request stream. Connection-level windows limit the cumulative sum of in-flight bytes across all active streams.
              </p>
            </>
          )}

          {activeSec === 'congestion' && (
            <>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#4ade80' }}>Userspace Plug & Play Algorithms</h4>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.45 }}>
                Because QUIC runs in userspace (unlike TCP inside kernel space), developers can swap congestion control algorithms on the fly. Compares reactive loss-based CUBIC with proactive bottleneck bandwidth-modelling BBR.
              </p>
            </>
          )}
        </div>

        {/* Visual pre block */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#cbd5e1' }}>Internals Mapping</h4>
          <pre style={{ margin: 0, padding: '8px 12px', background: '#090b14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.66rem', color: '#38bdf8', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            {activeSec === 'loss' ? (
`TCP:
  seq=100 (Lost) ──► Retransmit seq=100
  ACK 100 received → Which one? (Ambiguous)

QUIC:
  pkt#1 (Lost) ──► Retransmit in pkt#5
  ACK #5 received → Unambiguous RTT calculation! ✅`
            ) : activeSec === 'flow' ? (
`┌──────────────────────────────────────┐
│ Connection Window Cap (e.g. 256KB)   │
│  ├─ Stream 1 Window (Max 64KB)       │
│  ├─ Stream 3 Window (Max 64KB)       │
│  └─ Stream 5 Window (Max 64KB)       │
└──────────────────────────────────────┘`
            ) : (
`CUBIC:
  Increases window size until packets drop.
  Aggressive, loss-based reactive loops.

BBR:
  Measures RTprop & BtlBw continuously.
  Proactive bandwidth modeling. ✅`
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
