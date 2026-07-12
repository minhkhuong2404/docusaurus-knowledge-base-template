import React, { useState } from 'react';

type Phase = 'slow-start' | 'avoidance' | 'dup-ack' | 'timeout';

export default function TcpCongestionControlDiagram(): React.JSX.Element {
  const [phase, setPhase] = useState<Phase>('slow-start');

  const phaseData = {
    'slow-start': {
      title: '1. Slow Start Phase',
      math: 'cwnd = cwnd * 2 (Exponential Growth)',
      desc: 'Starts with cwnd = 1 MSS. On receiving ACKs, the window doubles every RTT. This continues until cwnd reaches the slow-start threshold (ssthresh) or packet loss occurs.',
      values: 'cwnd progression: 1 → 2 → 4 → 8 → 16 MSS'
    },
    avoidance: {
      title: '2. Congestion Avoidance Phase',
      math: 'cwnd = cwnd + 1 per RTT (Linear Growth / Additive Increase)',
      desc: 'Enters when cwnd >= ssthresh. Growth slows down to a conservative linear rate (adding 1 MSS per round trip time) to avoid overloading routers.',
      values: 'cwnd progression: 16 → 17 → 18 → 19 → 20 MSS'
    },
    'dup-ack': {
      title: '3. Fast Retransmit (3 Duplicate ACKs)',
      math: 'ssthresh = cwnd / 2, cwnd = ssthresh (Multiplicative Decrease)',
      desc: 'Receiver sends duplicate ACKs indicating a single missing segment but that subsequent data arrived. The sender drops cwnd to ssthresh and immediately enters linear avoidance, skipping Slow Start.',
      values: 'New ssthresh = 10, cwnd = 10 (Restarts Linear)'
    },
    timeout: {
      title: '4. Packet Loss (Timeout)',
      math: 'ssthresh = cwnd / 2, cwnd = 1 MSS (Full Reset)',
      desc: 'No ACKs are received. The retransmission timer expires (RTO). Sender assumes major network congestion, cuts ssthresh to half, drops cwnd to 1, and restarts Slow Start.',
      values: 'New ssthresh = 10, cwnd = 1 (Restarts Slow Start)'
    }
  };

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          📈 TCP Congestion Control Simulator (AIMD)
        </h3>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <button onClick={() => setPhase('slow-start')} style={{ background: phase === 'slow-start' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${phase === 'slow-start' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: phase === 'slow-start' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '4px 8px', fontSize: '0.74rem', fontWeight: 600 }}>Slow Start</button>
          <button onClick={() => setPhase('avoidance')} style={{ background: phase === 'avoidance' ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${phase === 'avoidance' ? '#a78bfa' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: phase === 'avoidance' ? '#a78bfa' : '#94a3b8', cursor: 'pointer', padding: '4px 8px', fontSize: '0.74rem', fontWeight: 600 }}>Avoidance</button>
          <button onClick={() => setPhase('dup-ack')} style={{ background: phase === 'dup-ack' ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${phase === 'dup-ack' ? '#4ade80' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: phase === 'dup-ack' ? '#4ade80' : '#94a3b8', cursor: 'pointer', padding: '4px 8px', fontSize: '0.74rem', fontWeight: 600 }}>Dup ACKs</button>
          <button onClick={() => setPhase('timeout')} style={{ background: phase === 'timeout' ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${phase === 'timeout' ? '#f87171' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: phase === 'timeout' ? '#f87171' : '#94a3b8', cursor: 'pointer', padding: '4px 8px', fontSize: '0.74rem', fontWeight: 600 }}>Timeout</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        {/* Step details */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
          <h4 style={{ margin: '0 0 2px 0', fontSize: '0.85rem', color: '#e2e8f0' }}>{phaseData[phase].title}</h4>
          <span style={{ fontSize: '0.7rem', color: '#a78bfa', display: 'block', marginBottom: '8px', fontFamily: 'monospace', fontWeight: 700 }}>
            {phaseData[phase].math}
          </span>
          <p style={{ margin: 0, fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.45 }}>
            {phaseData[phase].desc}
          </p>
        </div>

        {/* Dynamic value visualization */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#38bdf8' }}>Congestion Window (cwnd)</h4>
          <pre style={{ margin: 0, padding: '8px 12px', background: '#090b14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.72rem', color: '#38bdf8', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            {phaseData[phase].values}
          </pre>
        </div>
      </div>
    </div>
  );
}
