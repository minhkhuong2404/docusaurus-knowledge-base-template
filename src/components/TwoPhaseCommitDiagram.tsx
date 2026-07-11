import React, { useState } from 'react';

type Phase = 'prepare' | 'commit' | 'abort';

export default function TwoPhaseCommitDiagram(): React.JSX.Element {
  const [phase, setPhase] = useState<Phase>('prepare');

  const participants = ['Order DB', 'Inventory DB', 'Payment API'];
  const participantColors = ['#38bdf8', '#4ade80', '#a78bfa'];

  const problems = [
    { label: 'Blocking locks', color: '#f87171', detail: 'All DBs hold row locks for the entire 2PC duration → throughput collapses under concurrency.' },
    { label: 'Coordinator SPOF', color: '#fb923c', detail: 'If coordinator crashes between phases → participants hold locks indefinitely (no timeout to unlock).' },
    { label: 'External APIs incompatible', color: '#facc15', detail: 'Stripe, SendGrid have no prepare/commit support — cannot join a 2PC protocol.' },
    { label: 'Availability sacrifice', color: '#f87171', detail: 'CAP theorem: 2PC chooses consistency over availability. One unreachable participant blocks all.' },
  ];

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="interactive-diagram-indicator-dot card-indicator-red" />
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
            🔒 <span style={{ color: '#f87171' }}>Two-Phase Commit (2PC)</span> — Why It Fails at Scale
          </h3>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['prepare', 'commit', 'abort'] as Phase[]).map(p => (
            <button key={p} onClick={() => setPhase(p)} style={{ background: phase === p ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${phase === p ? '#f87171' : 'rgba(255,255,255,0.07)'}`, borderRadius: 4, color: phase === p ? '#f87171' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.8rem', fontWeight: 600, textTransform: 'capitalize' }}>
              {p === 'prepare' ? 'Phase 1: Prepare' : p === 'commit' ? 'Phase 2: Commit' : 'Phase 2: Abort'}
            </button>
          ))}
        </div>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 200" className="interactive-diagram-svg">
          <defs>
            <marker id="2pc-arr-right" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 2 L 8 5 L 0 8 z" fill="#f87171" /></marker>
            <marker id="2pc-arr-left" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 2 L 8 5 L 0 8 z" fill="#4ade80" /></marker>
            <marker id="2pc-arr-red-left" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 2 L 8 5 L 0 8 z" fill="#f87171" /></marker>
          </defs>

          {/* Coordinator box */}
          <rect x="260" y="15" width="160" height="32" rx="6" fill="rgba(248,113,113,0.1)" stroke="#f87171" strokeWidth="1.5" />
          <text x="340" y="29" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#f87171', textAnchor: 'middle' }}>Coordinator</text>
          <text x="340" y="42" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7.5, fill: '#94a3b8', textAnchor: 'middle' }}>(Single Point of Failure)</text>

          {/* Participant boxes */}
          {participants.map((p, i) => {
            const x = 20 + i * 220;
            const color = participantColors[i];
            const isLocked = phase === 'prepare';
            return (
              <g key={p}>
                <rect x={x} y={130} width={130} height={50} rx={5}
                  fill={isLocked ? `${color}10` : phase === 'commit' ? `${color}15` : 'rgba(248,113,113,0.05)'}
                  stroke={isLocked ? `${color}80` : phase === 'commit' ? color : '#f87171'}
                  strokeWidth={1.5} strokeDasharray={isLocked ? '4,3' : 'none'} />
                <text x={x + 65} y={151} style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, fill: color, textAnchor: 'middle' }}>{p}</text>
                <text x={x + 65} y={165} style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7.5, fill: isLocked ? '#fb923c' : phase === 'commit' ? '#4ade80' : '#f87171', textAnchor: 'middle' }}>
                  {isLocked ? '🔒 LOCKED (holding lock)' : phase === 'commit' ? '✅ Released' : '↩ Rolled back'}
                </text>
                <text x={x + 65} y={176} style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 7, fill: '#475569', textAnchor: 'middle' }}>
                  {isLocked ? '"Ready"' : phase === 'commit' ? '"Committed"' : '"Aborted"'}
                </text>
              </g>
            );
          })}

          {/* Coordinator → Participant arrows (phase 1 send) */}
          {[85, 305, 525].map((px, i) => {
            const pathId = `2pc-down-${i}`;
            const color = participantColors[i];
            return (
              <g key={pathId}>
                <path id={pathId} d={`M 340 47 Q 340 88 ${px + 65} 130`} fill="none"
                  stroke={phase === 'prepare' ? '#f87171' : phase === 'commit' ? color : '#f87171'}
                  strokeWidth={1.5} markerEnd={phase === 'commit' ? 'url(#2pc-arr-right)' : 'url(#2pc-arr-red-left)'}
                  className="interactive-diagram-flowing-path" />
                <circle r="2.5" fill={phase === 'prepare' ? '#f87171' : phase === 'commit' ? color : '#f87171'} opacity="0.85">
                  <animateMotion dur="1s" repeatCount="indefinite" begin={`${i * 0.3}s`}><mpath href={`#${pathId}`} /></animateMotion>
                </circle>
              </g>
            );
          })}

          {/* Phase labels */}
          <text x="340" y="93" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: phase === 'prepare' ? '#f87171' : phase === 'commit' ? '#4ade80' : '#f87171', textAnchor: 'middle', fontStyle: 'italic' }}>
            {phase === 'prepare' ? '← Prepare? "Lock your resources"' : phase === 'commit' ? '← Commit! "Release locks"' : '← Abort! "Roll back"'}
          </text>
        </svg>
      </div>

      {/* Problems grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 1rem 1rem' }}>
        {problems.map(p => (
          <div key={p.label} style={{ padding: '8px 12px', background: `${p.color}08`, border: `1px solid ${p.color}30`, borderRadius: 6 }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: p.color, marginBottom: 4 }}>❌ {p.label}</div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5 }}>{p.detail}</div>
          </div>
        ))}
      </div>
      <p className="interactive-diagram-helper-text">💡 Toggle phases above to see how 2PC causes locking across all participants simultaneously.</p>
    </div>
  );
}
