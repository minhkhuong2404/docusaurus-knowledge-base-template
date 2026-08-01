import React, { useState, useEffect } from 'react';

const PHASES = [
  {
    id: 'follower',
    label: 'Follower State',
    desc: 'All nodes start as followers. They receive heartbeats from the leader and reset their election timeout. As long as heartbeats arrive within election timeout (150–300ms), followers remain passive.',
    color: '#38bdf8',
    nodes: [
      { label: 'Node 1', state: 'Leader', color: '#34d399' },
      { label: 'Node 2', state: 'Follower', color: '#38bdf8' },
      { label: 'Node 3', state: 'Follower', color: '#38bdf8' },
    ],
    arrows: [
      { from: 0, to: 1, label: '♥ Heartbeat', color: '#34d399' },
      { from: 0, to: 2, label: '♥ Heartbeat', color: '#34d399' },
    ],
    note: 'Node 1 is the current leader. Heartbeats prevent election timeouts from firing.',
  },
  {
    id: 'timeout',
    label: 'Election Timeout',
    desc: 'Node 1 crashes or partitions. Node 2 and Node 3 stop receiving heartbeats. After their randomized election timeout fires (150–300ms), one of them transitions to Candidate.',
    color: '#f97316',
    nodes: [
      { label: 'Node 1', state: 'Crashed', color: '#f87171' },
      { label: 'Node 2', state: 'Candidate', color: '#f97316' },
      { label: 'Node 3', state: 'Follower', color: '#38bdf8' },
    ],
    arrows: [
      { from: 1, to: 2, label: 'Timeout fired', color: '#f97316' },
    ],
    note: 'Node 2 increments its term (term=2), votes for itself, and sends RequestVote RPCs.',
  },
  {
    id: 'vote',
    label: 'RequestVote',
    desc: 'The Candidate (Node 2) broadcasts RequestVote(term=2, lastLogIndex, lastLogTerm) to all peers. A follower grants its vote only if: it hasn\'t voted this term AND the candidate\'s log is at least as up-to-date.',
    color: '#fbbf24',
    nodes: [
      { label: 'Node 1', state: 'Crashed', color: '#f87171' },
      { label: 'Node 2', state: 'Candidate', color: '#fbbf24' },
      { label: 'Node 3', state: 'Follower', color: '#38bdf8' },
    ],
    arrows: [
      { from: 1, to: 2, label: 'RequestVote→', color: '#fbbf24' },
      { from: 2, to: 1, label: '←VoteGranted', color: '#34d399' },
    ],
    note: 'Node 3 grants its vote. Node 2 now has a majority (2 of 3 votes). Election is won.',
  },
  {
    id: 'leader',
    label: 'New Leader Elected',
    desc: 'Node 2 wins the election with a quorum of votes and transitions to Leader for term=2. It immediately sends AppendEntries(heartbeat) RPCs to all followers to establish authority and reset their election timers.',
    color: '#34d399',
    nodes: [
      { label: 'Node 1', state: 'Crashed', color: '#f87171' },
      { label: 'Node 2', state: 'New Leader', color: '#34d399' },
      { label: 'Node 3', state: 'Follower', color: '#38bdf8' },
    ],
    arrows: [
      { from: 1, to: 2, label: '♥ Heartbeat (term=2)', color: '#34d399' },
    ],
    note: 'Cluster is healthy again (2/3 nodes). Node 1 will rejoin as follower when it recovers.',
  },
];

export default function KafkaRaftConsensusDiagram(): React.JSX.Element {
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [animPhase, setAnimPhase] = useState(0);

  useEffect(() => {
    if (!playing || animPhase >= PHASES.length) { setPlaying(false); return; }
    const t = setTimeout(() => { setPhase(animPhase); setAnimPhase(p => p + 1); }, 1400);
    return () => clearTimeout(t);
  }, [playing, animPhase]);

  const handlePlay = () => { setPhase(0); setAnimPhase(0); setPlaying(true); };
  const current = PHASES[phase];

  const NODE_POSITIONS = [
    { cx: 100, cy: 120 },
    { cx: 300, cy: 120 },
    { cx: 500, cy: 120 },
  ];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Raft Consensus — Leader Election</span>
        <button onClick={handlePlay} disabled={playing}
          style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: playing ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '12px', background: playing ? 'rgba(255,255,255,0.06)' : 'rgba(251,191,36,0.15)', color: playing ? 'var(--ifm-color-content-secondary)' : '#fbbf24', boxShadow: playing ? 'none' : '0 0 0 1.5px rgba(251,191,36,0.4)', transition: 'all 0.2s ease' }}>
          {playing ? 'Playing…' : '▶ Animate'}
        </button>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Phase tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {PHASES.map((p, i) => (
            <button key={p.id} onClick={() => { setPlaying(false); setPhase(i); }}
              style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: phase === i ? `${p.color}18` : 'rgba(255,255,255,0.04)', color: phase === i ? p.color : 'var(--ifm-color-content-secondary)', boxShadow: phase === i ? `0 0 0 1.5px ${p.color}50` : '0 0 0 1px rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
              {i + 1}. {p.label}
            </button>
          ))}
        </div>

        {/* SVG visualization */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', marginBottom: '14px' }}>
          <svg viewBox="0 0 600 200" style={{ width: '100%', height: 'auto' }}>
            <defs>
              {['#34d399', '#38bdf8', '#fbbf24', '#f97316', '#f87171'].map(c => (
                <marker key={c} id={`raft-arr-${c.slice(1)}`} markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L7,3 z" fill={c} />
                </marker>
              ))}
            </defs>

            {/* Arrows */}
            {current.arrows.map((arrow, i) => {
              const from = NODE_POSITIONS[arrow.from];
              const to = NODE_POSITIONS[arrow.to];
              const midX = (from.cx + to.cx) / 2;
              const arrowY = 80 + i * 30;
              return (
                <g key={i}>
                  <line x1={from.cx + 40} y1={arrowY} x2={to.cx - 40} y2={arrowY}
                    stroke={arrow.color} strokeWidth="1.8" markerEnd={`url(#raft-arr-${arrow.color.slice(1)})`} />
                  <text x={midX} y={arrowY - 5} textAnchor="middle" fill={arrow.color} fontSize="9.5" fontWeight="600">{arrow.label}</text>
                </g>
              );
            })}

            {/* Nodes */}
            {current.nodes.map((node, i) => {
              const pos = NODE_POSITIONS[i];
              return (
                <g key={i}>
                  <circle cx={pos.cx} cy={pos.cy} r="36"
                    fill={`${node.color}18`} stroke={node.color} strokeWidth="2"
                    style={{ transition: 'all 0.5s ease' }} />
                  <text x={pos.cx} y={pos.cy - 5} textAnchor="middle" fill={node.color} fontSize="12" fontWeight="700">{node.label}</text>
                  <text x={pos.cx} y={pos.cy + 12} textAnchor="middle" fill={node.color} fontSize="9.5" opacity="0.8">{node.state}</text>
                </g>
              );
            })}

            {/* Term indicator */}
            <text x="300" y="185" textAnchor="middle" fill="var(--ifm-color-content-secondary)" fontSize="10">
              {phase >= 1 ? 'Term: 2 (new election)' : 'Term: 1 (stable)'}
            </text>
          </svg>
        </div>

        {/* Detail card */}
        <div style={{ background: `${current.color}0d`, border: `1px solid ${current.color}30`, borderRadius: '10px', padding: '14px' }}>
          <div style={{ fontWeight: 700, fontSize: '13px', color: current.color, marginBottom: '6px' }}>{current.label}</div>
          <p style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 8px', lineHeight: 1.6 }}>{current.desc}</p>
          <div style={{ fontSize: '11px', color: current.color, background: `${current.color}10`, borderRadius: '6px', padding: '6px 10px', borderLeft: `3px solid ${current.color}` }}>
            {current.note}
          </div>
        </div>
      </div>
    </div>
  );
}