import React, { useState, useEffect } from 'react';

const PHASES = [
  {
    id: 'stable',
    label: 'Stable State',
    color: '#34d399',
    desc: 'The consumer group is stable. 3 consumers each own 2 partitions. All consuming normally and committing offsets.',
    assignments: [
      { consumer: 'Consumer 1', partitions: ['P0', 'P1'], color: '#38bdf8', active: true },
      { consumer: 'Consumer 2', partitions: ['P2', 'P3'], color: '#34d399', active: true },
      { consumer: 'Consumer 3', partitions: ['P4', 'P5'], color: '#a78bfa', active: true },
    ],
    events: [],
  },
  {
    id: 'trigger',
    label: 'Rebalance Triggered',
    color: '#fbbf24',
    desc: 'Consumer 3 crashes or a new Consumer 4 joins. Group Coordinator detects the change (session.timeout.ms expires or JoinGroupRequest received).',
    assignments: [
      { consumer: 'Consumer 1', partitions: ['P0', 'P1'], color: '#38bdf8', active: true },
      { consumer: 'Consumer 2', partitions: ['P2', 'P3'], color: '#34d399', active: true },
      { consumer: 'Consumer 3', partitions: ['P4', 'P5'], color: '#f87171', active: false },
    ],
    events: ['⚠ Consumer 3 heartbeat timed out', '⚠ Rebalance epoch incremented', '⚠ All consumers receive STOP_FETCH'],
  },
  {
    id: 'joingroup',
    label: 'JoinGroup Phase',
    color: '#f97316',
    desc: 'All active consumers send JoinGroupRequest to the Group Coordinator. Consumption STOPS entirely during this phase — this is the "stop-the-world" rebalance window.',
    assignments: [
      { consumer: 'Consumer 1', partitions: ['⏸ Paused'], color: '#f97316', active: true },
      { consumer: 'Consumer 2', partitions: ['⏸ Paused'], color: '#f97316', active: true },
      { consumer: 'Consumer 4', partitions: ['⏸ Joining'], color: '#fbbf24', active: true },
    ],
    events: ['All send JoinGroupRequest', 'Group Coordinator picks Group Leader (first to join)', 'Coordinator sends member list to Group Leader'],
  },
  {
    id: 'sync',
    label: 'SyncGroup Phase',
    color: '#a78bfa',
    desc: 'The Group Leader (a consumer) runs the partition assignment strategy (RangeAssignor, RoundRobinAssignor, or StickyAssignor) and sends the new assignment to the Coordinator via SyncGroupRequest.',
    assignments: [
      { consumer: 'Consumer 1 (Group Leader)', partitions: ['Runs assignment'], color: '#a78bfa', active: true },
      { consumer: 'Consumer 2', partitions: ['SyncGroupRequest'], color: '#a78bfa', active: true },
      { consumer: 'Consumer 4', partitions: ['SyncGroupRequest'], color: '#a78bfa', active: true },
    ],
    events: ['Group Leader runs RangeAssignor/StickyAssignor', 'Assignment plan sent to Coordinator', 'Coordinator distributes assignments back'],
  },
  {
    id: 'stable2',
    label: 'New Stable State',
    color: '#34d399',
    desc: 'Rebalance complete. All consumers receive their new partition assignments and resume consuming. With StickyAssignor, previously-held partitions are preferentially retained to minimize movement.',
    assignments: [
      { consumer: 'Consumer 1', partitions: ['P0', 'P1', 'P2'], color: '#38bdf8', active: true },
      { consumer: 'Consumer 2', partitions: ['P3', 'P4'], color: '#34d399', active: true },
      { consumer: 'Consumer 4', partitions: ['P5'], color: '#fbbf24', active: true },
    ],
    events: ['All consumers call poll() to resume', 'Offsets resumed from last committed position', 'Potential duplicate processing between last commit and crash'],
  },
];

export default function KafkaConsumerGroupRebalanceDiagram(): React.JSX.Element {
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [animPhase, setAnimPhase] = useState(0);

  useEffect(() => {
    if (!playing || animPhase >= PHASES.length) { setPlaying(false); return; }
    const t = setTimeout(() => { setPhase(animPhase); setAnimPhase(p => p + 1); }, 1600);
    return () => clearTimeout(t);
  }, [playing, animPhase]);

  const handlePlay = () => { setPhase(0); setAnimPhase(0); setPlaying(true); };
  const current = PHASES[phase];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Consumer Group Rebalance Protocol</span>
        <button onClick={handlePlay} disabled={playing}
          style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: playing ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '12px', background: playing ? 'rgba(255,255,255,0.06)' : 'rgba(251,191,36,0.15)', color: playing ? 'var(--ifm-color-content-secondary)' : '#fbbf24', boxShadow: playing ? 'none' : '0 0 0 1.5px rgba(251,191,36,0.4)', transition: 'all 0.2s ease' }}>
          {playing ? 'Playing…' : '▶ Animate'}
        </button>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Phase tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {PHASES.map((p, i) => (
            <button key={p.id} onClick={() => { setPlaying(false); setPhase(i); }}
              style={{ padding: '6px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '11.5px', fontWeight: 600, background: phase === i ? `${p.color}18` : 'rgba(255,255,255,0.04)', color: phase === i ? p.color : 'var(--ifm-color-content-secondary)', boxShadow: phase === i ? `0 0 0 1.5px ${p.color}50` : '0 0 0 1px rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
              {i + 1}. {p.label}
            </button>
          ))}
        </div>

        <p style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 16px', lineHeight: 1.6 }}>{current.desc}</p>

        {/* Consumer assignment grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Partition Assignments</div>
          {current.assignments.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: a.active ? `${a.color}0d` : 'rgba(248,113,113,0.06)', border: `1px solid ${a.active ? a.color + '35' : 'rgba(248,113,113,0.25)'}`, borderRadius: '8px', padding: '10px 14px', transition: 'all 0.4s ease' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: a.active ? a.color : '#f87171', minWidth: '160px' }}>
                {a.active ? '' : '✗ '}{a.consumer}
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {a.partitions.map(p => (
                  <span key={p} style={{ fontSize: '11px', background: `${a.color}15`, border: `1px solid ${a.color}35`, color: a.color, borderRadius: '5px', padding: '2px 8px', fontFamily: 'monospace' }}>{p}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Events */}
        {current.events.length > 0 && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Events</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {current.events.map((ev, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', background: `${current.color}08`, border: `1px solid ${current.color}25`, borderRadius: '7px', padding: '7px 10px' }}>
                  <span style={{ fontSize: '12px', color: current.color, flexShrink: 0 }}>→</span>
                  <span style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)' }}>{ev}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}