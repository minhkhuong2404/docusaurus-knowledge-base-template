import React, { useState } from 'react';

type EvolutionTab = 'h1' | 'h2' | 'h3';

export default function HttpEvolutionDiagram(): React.JSX.Element {
  const [tab, setTab] = useState<EvolutionTab>('h1');

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          🌐 HTTP Protocol Evolution Comparison (HTTP/1.1 vs. 2 vs. 3)
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setTab('h1')} style={{ background: tab === 'h1' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${tab === 'h1' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: tab === 'h1' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>HTTP/1.1</button>
          <button onClick={() => setTab('h2')} style={{ background: tab === 'h2' ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${tab === 'h2' ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: tab === 'h2' ? '#a78bfa' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>HTTP/2</button>
          <button onClick={() => setTab('h3')} style={{ background: tab === 'h3' ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${tab === 'h3' ? '#4ade80' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: tab === 'h3' ? '#4ade80' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>HTTP/3</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.2rem', padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        {/* Info card */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1.2rem' }}>
          {tab === 'h1' && (
            <>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#38bdf8' }}>HTTP/1.1 (Connection Pools)</h4>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.45 }}>
                Loads assets sequentially. Browsers open a connection pool (typically limited to 6 parallel TCP links per origin). Suffers from application-level Head-of-Line blocking because a slow response blocks subsequent requests on that socket connection.
              </p>
            </>
          )}

          {tab === 'h2' && (
            <>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#a78bfa' }}>HTTP/2 (Multiplexed Streams)</h4>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.45 }}>
                Multiplexes multiple logical streams over a single TCP connection. However, because TCP views data as a single ordered byte stream, a single packet loss stalls all active HTTP streams on the connection (TCP-level HOL blocking).
              </p>
            </>
          )}

          {tab === 'h3' && (
            <>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#4ade80' }}>HTTP/3 (QUIC / UDP Transport)</h4>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.45 }}>
                Replaces TCP with QUIC transport running over UDP. Each stream operates independently; a lost packet in stream A only blocks stream A, leaving streams B and C completely unaffected.
              </p>
            </>
          )}
        </div>

        {/* Visual Map */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#cbd5e1' }}>Transport Layout</h4>
          <pre style={{ margin: 0, padding: '8px 12px', background: '#090b14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.68rem', color: '#38bdf8', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            {tab === 'h1' ? (
`TCP Conn 1: [Request A] ──► [Response A]
TCP Conn 2: [Request B] ──► [Response B]
TCP Conn 3: [Request C] ──► [Response C]
(Max 6 connections)`
            ) : tab === 'h2' ? (
`Single TCP Connection:
  ├── Stream A: [A1][A2][A3] ──►
  ├── Stream B: [B1][B2]     ──►
  └── Stream C: [C1][C2]     ──►
(TCP drops A2 -> ALL STALLED!)`
            ) : (
`Single QUIC Connection (UDP):
  ├── Stream A: [A1][A2][A3] ──► (Isolated)
  ├── Stream B: [B1][B2]     ──► (Isolated)
  └── Stream C: [C1][C2]     ──► (Isolated)
(Pkt drop in Stream A -> B & C continue!)`
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
